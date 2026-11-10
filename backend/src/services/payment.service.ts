import crypto from 'crypto';
import { Types } from 'mongoose';
import { Booking, IBooking } from '../models/Booking.js';
import { CashPayment, ICashPayment } from '../models/CashPayment.js';
import { CommissionEntry, ICommissionEntry } from '../models/CommissionEntry.js';
import { CommissionSettlement, ICommissionSettlement } from '../models/CommissionSettlement.js';
import { Organization } from '../models/Organization.js';
import { OrganizationMember } from '../models/OrganizationMember.js';
import { User } from '../models/User.js';
import { Service } from '../models/Service.js';
import {
  DEFAULT_COMMISSION_RATE,
  PAYMENT_STATUSES,
  COMMISSION_STATUSES,
} from '../constants/statuses.js';
import { AppError } from '../utils/AppError.js';

export interface RecordCollectionOptions {
  amountCollected: number;
  notes?: string;
}

export interface ConfirmPaymentOptions {
  notes?: string;
}

export interface SettlementOptions {
  providerId?: string;
  organizationId?: string;
  entryIds: string[];
  amountSettled: number;
  settlementMethod?: string;
  paymentReference?: string;
  notes?: string;
}

export class PaymentService {
  /**
   * Generates a collision-resistant human-readable cash receipt number (e.g. RCP-2611-A8B9C1)
   */
  public static generateReceiptNumber(): string {
    const now = new Date();
    const yearMonth = `${now.getFullYear().toString().slice(2)}${String(
      now.getMonth() + 1
    ).padStart(2, '0')}`;
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `RCP-${yearMonth}-${randomSuffix}`;
  }

  /**
   * Generates a collision-resistant commission settlement number (e.g. SETTLE-2611-A8B9C1)
   */
  public static generateSettlementNumber(): string {
    const now = new Date();
    const yearMonth = `${now.getFullYear().toString().slice(2)}${String(
      now.getMonth() + 1
    ).padStart(2, '0')}`;
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `SETTLE-${yearMonth}-${randomSuffix}`;
  }

  /**
   * Ensures a CashPayment document exists for a given booking.
   * Creates one with status PENDING if not already present.
   */
  public static async getOrCreatePayment(bookingId: string): Promise<ICashPayment> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw AppError.notFound('Booking not found', 'BOOKING_NOT_FOUND');
    }

    let payment = await CashPayment.findOne({ booking: booking._id });
    if (!payment) {
      let providerUserId = booking.provider;
      if (!providerUserId && booking.organization) {
        const org = await Organization.findById(booking.organization);
        if (org) {
          providerUserId = org.owner;
        }
      }
      if (!providerUserId && booking.technician) {
        providerUserId = booking.technician;
      }

      // If still no provider assigned, fallback to admin or booking customer temporarily
      const effectiveProvider = providerUserId || booking.customer;

      payment = await CashPayment.create({
        booking: booking._id,
        receiptNumber: this.generateReceiptNumber(),
        customer: booking.customer,
        provider: effectiveProvider,
        organization: booking.organization,
        amountExpected: booking.finalPrice || booking.basePrice,
        amountCollected: 0,
        status: PAYMENT_STATUSES.PENDING,
        paymentMethod: 'CASH_AFTER_SERVICE',
      });
    }

    return payment;
  }

  /**
   * Provider/Technician records cash collected from the customer
   */
  public static async recordCashCollection(
    bookingId: string,
    actor: { userId: string; role: string },
    options: RecordCollectionOptions
  ): Promise<ICashPayment> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw AppError.notFound('Booking not found', 'BOOKING_NOT_FOUND');
    }

    // Authorization check
    let isAuthorized = actor.role === 'ADMIN';

    if (!isAuthorized && booking.provider && booking.provider.toString() === actor.userId) {
      isAuthorized = true;
    }
    if (!isAuthorized && booking.technician && booking.technician.toString() === actor.userId) {
      isAuthorized = true;
    }
    if (!isAuthorized && booking.organization) {
      const org = await Organization.findById(booking.organization);
      if (org && org.owner.toString() === actor.userId) {
        isAuthorized = true;
      } else {
        const membership = await OrganizationMember.findOne({
          organization: booking.organization,
          user: actor.userId,
          status: 'ACTIVE',
        });
        if (membership) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      throw AppError.forbidden(
        'You are not authorized to record cash collection for this booking',
        'FORBIDDEN_PAYMENT_COLLECTION'
      );
    }

    // Booking state check: cash-after-service is recorded when service is COMPLETED or IN_PROGRESS
    if (!['COMPLETED', 'IN_PROGRESS'].includes(booking.status)) {
      throw AppError.badRequest(
        `Cash collection can only be recorded for completed or in-progress services. Current status: ${booking.status}`,
        'INVALID_BOOKING_STATUS_FOR_PAYMENT'
      );
    }

    const payment = await this.getOrCreatePayment(bookingId);

    if (payment.status === PAYMENT_STATUSES.CONFIRMED) {
      throw AppError.badRequest(
        'Payment has already been confirmed by the customer',
        'PAYMENT_ALREADY_CONFIRMED'
      );
    }

    payment.amountCollected = options.amountCollected;
    payment.status = PAYMENT_STATUSES.COLLECTED_BY_PROVIDER;
    payment.collectedAt = new Date();
    if (options.notes) {
      payment.notes = options.notes;
    }

    await payment.save();
    return payment;
  }

  /**
   * Customer confirms cash payment handover to the provider
   * Marks booking as isPaid = true and writes an immutable CommissionEntry to the ledger
   */
  public static async confirmCashPayment(
    bookingId: string,
    actor: { userId: string; role: string },
    options?: ConfirmPaymentOptions
  ): Promise<{ payment: ICashPayment; commissionEntry: ICommissionEntry }> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw AppError.notFound('Booking not found', 'BOOKING_NOT_FOUND');
    }

    // Only customer or admin can confirm the cash handover
    const isCustomer = booking.customer.toString() === actor.userId;
    const isAdmin = actor.role === 'ADMIN';

    if (!isCustomer && !isAdmin) {
      throw AppError.forbidden(
        'Only the customer who made this booking can confirm cash payment handover',
        'FORBIDDEN_PAYMENT_CONFIRMATION'
      );
    }

    const payment = await this.getOrCreatePayment(bookingId);

    if (payment.status === PAYMENT_STATUSES.CONFIRMED) {
      throw AppError.badRequest(
        'Payment has already been confirmed',
        'PAYMENT_ALREADY_CONFIRMED'
      );
    }

    // If provider hadn't recorded collection yet, default amount collected to expected price
    if (payment.amountCollected <= 0) {
      payment.amountCollected = payment.amountExpected;
      payment.collectedAt = new Date();
    }

    payment.status = PAYMENT_STATUSES.CONFIRMED;
    payment.confirmedAt = new Date();
    if (options?.notes) {
      payment.notes = options.notes;
    }
    await payment.save();

    // Mark booking as paid
    booking.isPaid = true;
    await booking.save();

    // Create or retrieve immutable CommissionEntry
    let commissionEntry = await CommissionEntry.findOne({ booking: booking._id });
    if (!commissionEntry) {
      let beneficiaryProviderId = booking.provider;
      if (!beneficiaryProviderId && booking.organization) {
        const org = await Organization.findById(booking.organization);
        if (org) beneficiaryProviderId = org.owner;
      }
      if (!beneficiaryProviderId && booking.technician) {
        beneficiaryProviderId = booking.technician;
      }
      if (!beneficiaryProviderId) {
        beneficiaryProviderId = payment.provider;
      }

      const totalAmount = payment.amountCollected;
      const commissionAmount = Math.round(totalAmount * DEFAULT_COMMISSION_RATE);
      const providerEarnings = totalAmount - commissionAmount;

      commissionEntry = await CommissionEntry.create({
        booking: booking._id,
        payment: payment._id,
        provider: beneficiaryProviderId,
        organization: booking.organization,
        totalAmount,
        commissionRate: DEFAULT_COMMISSION_RATE,
        commissionAmount,
        providerEarnings,
        status: COMMISSION_STATUSES.PENDING_SETTLEMENT,
      });
    }

    return { payment, commissionEntry };
  }

  /**
   * Flag cash payment as disputed (e.g. discrepancy in cash handed over)
   */
  public static async disputeCashPayment(
    bookingId: string,
    actor: { userId: string; role: string },
    reason: string
  ): Promise<ICashPayment> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw AppError.notFound('Booking not found', 'BOOKING_NOT_FOUND');
    }

    // Customer, provider, organization owner, technician, or admin can dispute
    const isCustomer = booking.customer.toString() === actor.userId;
    const isProvider = booking.provider?.toString() === actor.userId;
    const isTechnician = booking.technician?.toString() === actor.userId;
    const isAdmin = actor.role === 'ADMIN';

    let isOrgOwner = false;
    if (booking.organization) {
      const org = await Organization.findById(booking.organization);
      if (org && org.owner.toString() === actor.userId) {
        isOrgOwner = true;
      }
    }

    if (!isCustomer && !isProvider && !isTechnician && !isOrgOwner && !isAdmin) {
      throw AppError.forbidden(
        'You are not authorized to dispute this payment',
        'FORBIDDEN_PAYMENT_DISPUTE'
      );
    }

    const payment = await this.getOrCreatePayment(bookingId);
    payment.status = PAYMENT_STATUSES.DISPUTED;
    payment.disputeReason = reason;
    await payment.save();

    return payment;
  }

  /**
   * Get payment details and optional commission ledger info for a booking
   */
  public static async getPaymentByBooking(
    bookingId: string,
    actor: { userId: string; role: string }
  ): Promise<{
    payment: ICashPayment;
    commissionEntry?: ICommissionEntry | null;
    booking: IBooking;
  }> {
    const booking = await Booking.findById(bookingId)
      .populate('service', 'name category')
      .populate('customer', 'name phone email')
      .populate('provider', 'name phone email')
      .populate('technician', 'name phone email')
      .populate('organization', 'name contactPhone');

    if (!booking) {
      throw AppError.notFound('Booking not found', 'BOOKING_NOT_FOUND');
    }

    const isCustomer = booking.customer._id
      ? booking.customer._id.toString() === actor.userId
      : (booking.customer as any).toString() === actor.userId;

    const isProvider = booking.provider?._id
      ? booking.provider._id.toString() === actor.userId
      : booking.provider?.toString() === actor.userId;

    const isTechnician = booking.technician?._id
      ? booking.technician._id.toString() === actor.userId
      : booking.technician?.toString() === actor.userId;

    const isAdmin = actor.role === 'ADMIN' || actor.role === 'SUPPORT_AGENT';

    let isOrgOwner = false;
    if (booking.organization) {
      const org = await Organization.findById(
        booking.organization._id || booking.organization
      );
      if (org && org.owner.toString() === actor.userId) {
        isOrgOwner = true;
      }
    }

    if (!isCustomer && !isProvider && !isTechnician && !isOrgOwner && !isAdmin) {
      throw AppError.forbidden(
        'You are not authorized to view payment details for this booking',
        'FORBIDDEN_PAYMENT_VIEW'
      );
    }

    const payment = await this.getOrCreatePayment(bookingId);

    let commissionEntry: ICommissionEntry | null = null;
    // Customer does not need internal platform commission breakdown
    if (!isCustomer || isAdmin) {
      commissionEntry = await CommissionEntry.findOne({ booking: booking._id });
    }

    return { payment, commissionEntry, booking };
  }

  /**
   * Get earnings summary, pending commission due, and settlement records for a provider/company
   */
  public static async getProviderEarningsSummary(actor: {
    userId: string;
    role: string;
  }): Promise<{
    totalBookings: number;
    totalGrossRevenue: number;
    totalPlatformCommission: number;
    totalNetEarnings: number;
    pendingCommissionDue: number;
    settledCommission: number;
    commissionRate: number;
    recentEntries: ICommissionEntry[];
    recentSettlements: ICommissionSettlement[];
  }> {
    // Find all organizations where user is owner
    const ownedOrgs = await Organization.find({ owner: actor.userId }).select('_id');
    const orgIds = ownedOrgs.map((o) => o._id);

    const query: any = {
      $or: [
        { provider: new Types.ObjectId(actor.userId) },
        ...(orgIds.length > 0 ? [{ organization: { $in: orgIds } }] : []),
      ],
    };

    const entries = await CommissionEntry.find(query)
      .populate('booking', 'bookingNumber scheduledDate pricingType finalPrice status')
      .sort({ createdAt: -1 });

    let totalGrossRevenue = 0;
    let totalPlatformCommission = 0;
    let totalNetEarnings = 0;
    let pendingCommissionDue = 0;
    let settledCommission = 0;

    for (const entry of entries) {
      totalGrossRevenue += entry.totalAmount;
      totalPlatformCommission += entry.commissionAmount;
      totalNetEarnings += entry.providerEarnings;

      if (entry.status === COMMISSION_STATUSES.PENDING_SETTLEMENT) {
        pendingCommissionDue += entry.commissionAmount;
      } else if (entry.status === COMMISSION_STATUSES.SETTLED) {
        settledCommission += entry.commissionAmount;
      }
    }

    const recentSettlements = await CommissionSettlement.find({
      $or: [
        { provider: new Types.ObjectId(actor.userId) },
        ...(orgIds.length > 0 ? [{ organization: { $in: orgIds } }] : []),
      ],
    })
      .sort({ createdAt: -1 })
      .limit(10);

    return {
      totalBookings: entries.length,
      totalGrossRevenue,
      totalPlatformCommission,
      totalNetEarnings,
      pendingCommissionDue,
      settledCommission,
      commissionRate: DEFAULT_COMMISSION_RATE,
      recentEntries: entries.slice(0, 20),
      recentSettlements,
    };
  }

  /**
   * Admin records manual commission settlement received from provider/company
   */
  public static async recordCommissionSettlement(
    adminUserId: string,
    options: SettlementOptions
  ): Promise<{
    settlement: ICommissionSettlement;
    settledCount: number;
  }> {
    const adminUser = await User.findById(adminUserId);
    if (!adminUser || adminUser.role !== 'ADMIN') {
      throw AppError.forbidden(
        'Only administrators can record commission settlements',
        'FORBIDDEN_SETTLEMENT_RECORD'
      );
    }

    const entryObjectIds = options.entryIds.map((id) => new Types.ObjectId(id));
    const entries = await CommissionEntry.find({
      _id: { $in: entryObjectIds },
      status: COMMISSION_STATUSES.PENDING_SETTLEMENT,
    });

    if (entries.length === 0) {
      throw AppError.badRequest(
        'No valid pending commission entries found for the provided IDs',
        'NO_PENDING_COMMISSION_ENTRIES'
      );
    }

    const settlementNumber = this.generateSettlementNumber();
    const settlement = await CommissionSettlement.create({
      settlementNumber,
      provider: options.providerId ? new Types.ObjectId(options.providerId) : undefined,
      organization: options.organizationId
        ? new Types.ObjectId(options.organizationId)
        : undefined,
      amountSettled: options.amountSettled,
      entriesSettled: entries.map((e) => e._id),
      settlementMethod: options.settlementMethod || 'MANUAL_CASH_OR_OFFLINE',
      paymentReference: options.paymentReference,
      recordedBy: new Types.ObjectId(adminUserId),
      notes: options.notes,
    });

    // Mark entries as SETTLED
    await CommissionEntry.updateMany(
      { _id: { $in: entryObjectIds } },
      {
        $set: {
          status: COMMISSION_STATUSES.SETTLED,
          settlement: settlement._id,
          settledAt: new Date(),
        },
      }
    );

    return { settlement, settledCount: entries.length };
  }

  /**
   * Admin financial overview of platform GMV and commission
   */
  public static async getAdminFinancialReport(): Promise<{
    totalConfirmedPayments: number;
    totalGrossVolumeBDT: number;
    totalCommissionEarnedBDT: number;
    totalCommissionPendingBDT: number;
    totalCommissionSettledBDT: number;
    settlementsCount: number;
    recentSettlements: ICommissionSettlement[];
    recentEntries: ICommissionEntry[];
  }> {
    const confirmedPayments = await CashPayment.find({
      status: PAYMENT_STATUSES.CONFIRMED,
    });

    let totalGrossVolumeBDT = 0;
    for (const p of confirmedPayments) {
      totalGrossVolumeBDT += p.amountCollected;
    }

    const allEntries = await CommissionEntry.find();
    let totalCommissionEarnedBDT = 0;
    let totalCommissionPendingBDT = 0;
    let totalCommissionSettledBDT = 0;

    for (const entry of allEntries) {
      totalCommissionEarnedBDT += entry.commissionAmount;
      if (entry.status === COMMISSION_STATUSES.PENDING_SETTLEMENT) {
        totalCommissionPendingBDT += entry.commissionAmount;
      } else if (entry.status === COMMISSION_STATUSES.SETTLED) {
        totalCommissionSettledBDT += entry.commissionAmount;
      }
    }

    const settlementsCount = await CommissionSettlement.countDocuments();
    const recentSettlements = await CommissionSettlement.find()
      .populate('recordedBy', 'name email')
      .populate('provider', 'name phone')
      .populate('organization', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentEntries = await CommissionEntry.find()
      .populate('booking', 'bookingNumber scheduledDate finalPrice')
      .populate('provider', 'name phone')
      .sort({ createdAt: -1 })
      .limit(20);

    return {
      totalConfirmedPayments: confirmedPayments.length,
      totalGrossVolumeBDT,
      totalCommissionEarnedBDT,
      totalCommissionPendingBDT,
      totalCommissionSettledBDT,
      settlementsCount,
      recentSettlements,
      recentEntries,
    };
  }

  /**
   * Generates a structured cash receipt for customer and provider
   */
  public static async getReceipt(
    bookingId: string,
    actor: { userId: string; role: string }
  ): Promise<{
    receiptNumber: string;
    bookingNumber: string;
    status: string;
    paymentMethod: string;
    amountExpected: number;
    amountCollected: number;
    currency: string;
    currencySymbol: string;
    collectedAt?: Date;
    confirmedAt?: Date;
    customer: { name: string; phone: string };
    provider: { name: string; phone: string };
    service: { name: { en: string; bn: string }; category: string };
    serviceAddress: { area: string; addressLine: string };
  }> {
    const booking = await Booking.findById(bookingId)
      .populate('service')
      .populate('customer', 'name phone email')
      .populate('provider', 'name phone email')
      .populate('technician', 'name phone email')
      .populate('organization', 'name contactPhone');

    if (!booking) {
      throw AppError.notFound('Booking not found', 'BOOKING_NOT_FOUND');
    }

    const isCustomer = booking.customer._id
      ? booking.customer._id.toString() === actor.userId
      : (booking.customer as any).toString() === actor.userId;

    const isProvider = booking.provider?._id
      ? booking.provider._id.toString() === actor.userId
      : booking.provider?.toString() === actor.userId;

    const isTechnician = booking.technician?._id
      ? booking.technician._id.toString() === actor.userId
      : booking.technician?.toString() === actor.userId;

    const isAdmin = actor.role === 'ADMIN' || actor.role === 'SUPPORT_AGENT';

    if (!isCustomer && !isProvider && !isTechnician && !isAdmin) {
      throw AppError.forbidden(
        'You are not authorized to view the receipt for this booking',
        'FORBIDDEN_RECEIPT_VIEW'
      );
    }

    const payment = await this.getOrCreatePayment(bookingId);
    const serviceDoc = booking.service as any;
    const customerDoc = booking.customer as any;
    const providerDoc = (booking.provider || booking.technician || booking.organization) as any;

    return {
      receiptNumber: payment.receiptNumber,
      bookingNumber: booking.bookingNumber,
      status: payment.status,
      paymentMethod: 'Cash After Service (ক্যাশ অন ডেলিভারি / সার্ভিসের পর ক্যাশ)',
      amountExpected: payment.amountExpected,
      amountCollected: payment.amountCollected,
      currency: 'BDT',
      currencySymbol: '৳',
      collectedAt: payment.collectedAt,
      confirmedAt: payment.confirmedAt,
      customer: {
        name: customerDoc?.name || booking.serviceAddress.contactName,
        phone: customerDoc?.phone || booking.serviceAddress.contactPhone,
      },
      provider: {
        name: providerDoc?.name || 'Assigned Provider / সার্ভিস প্রোভাইডার',
        phone: providerDoc?.phone || providerDoc?.contactPhone || 'N/A',
      },
      service: {
        name: serviceDoc?.name || { en: 'Service', bn: 'সার্ভিস' },
        category: serviceDoc?.category || 'General',
      },
      serviceAddress: {
        area: booking.serviceAddress.area,
        addressLine: booking.serviceAddress.addressLine,
      },
    };
  }
}

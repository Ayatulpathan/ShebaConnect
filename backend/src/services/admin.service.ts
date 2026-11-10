import { Types } from 'mongoose';
import { User, IUser } from '../models/User.js';
import { ProviderProfile, IProviderProfile } from '../models/ProviderProfile.js';
import { Organization, IOrganization } from '../models/Organization.js';
import { Booking, IBooking } from '../models/Booking.js';
import { CashPayment } from '../models/CashPayment.js';
import { CommissionEntry } from '../models/CommissionEntry.js';
import { CommissionSettlement } from '../models/CommissionSettlement.js';
import { AuditLog, IAuditLog } from '../models/AuditLog.js';
import { BookingStateService } from './bookingState.service.js';
import { PaymentService, SettlementOptions } from './payment.service.js';
import { NotificationService } from './notification.service.js';
import {
  PAYMENT_STATUSES,
  COMMISSION_STATUSES,
} from '../constants/statuses.js';
import { AppError } from '../utils/AppError.js';

export interface AdminActor {
  userId: string;
  role: string;
}

export interface UserQueryOptions {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface BookingQueryOptions {
  status?: string;
  area?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogQueryOptions {
  action?: string;
  targetType?: string;
  actorId?: string;
  page?: number;
  limit?: number;
}

export class AdminService {
  /**
   * Aggregate high-level platform KPIs and operational health metrics
   */
  public static async getPlatformOverview(): Promise<{
    users: {
      total: number;
      customers: number;
      individualProviders: number;
      registeredCompanies: number;
      verifiedProviders: number;
      pendingProviderVerifications: number;
      pendingCompanyApprovals: number;
    };
    bookings: {
      total: number;
      completed: number;
      cancelled: number;
      disputed: number;
      activeInProgress: number;
    };
    financials: {
      totalGrossVolumeBDT: number;
      totalCommissionEarnedBDT: number;
      totalCommissionPendingBDT: number;
      totalCommissionSettledBDT: number;
      settlementsCount: number;
    };
  }> {
    const [
      totalUsers,
      customers,
      individualProviders,
      registeredCompanies,
      verifiedProviders,
      pendingProviderVerifications,
      pendingCompanyApprovals,
      totalBookings,
      completedBookings,
      cancelledBookings,
      disputedBookings,
      activeInProgress,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'CUSTOMER' }),
      User.countDocuments({ role: 'INDIVIDUAL_PROVIDER' }),
      Organization.countDocuments(),
      ProviderProfile.countDocuments({ verificationStatus: 'VERIFIED' }),
      ProviderProfile.countDocuments({ verificationStatus: 'PENDING_REVIEW' }),
      Organization.countDocuments({ approvalStatus: 'PENDING_APPROVAL' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'COMPLETED' }),
      Booking.countDocuments({ status: 'CANCELLED' }),
      Booking.countDocuments({ status: 'DISPUTED' }),
      Booking.countDocuments({
        status: {
          $in: [
            'REQUESTED',
            'ACCEPTED',
            'SCHEDULED',
            'PROVIDER_ASSIGNED',
            'ON_THE_WAY',
            'IN_PROGRESS',
          ],
        },
      }),
    ]);

    const financialData = await PaymentService.getAdminFinancialReport();

    return {
      users: {
        total: totalUsers,
        customers,
        individualProviders,
        registeredCompanies,
        verifiedProviders,
        pendingProviderVerifications,
        pendingCompanyApprovals,
      },
      bookings: {
        total: totalBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        disputed: disputedBookings,
        activeInProgress,
      },
      financials: {
        totalGrossVolumeBDT: financialData.totalGrossVolumeBDT,
        totalCommissionEarnedBDT: financialData.totalCommissionEarnedBDT,
        totalCommissionPendingBDT: financialData.totalCommissionPendingBDT,
        totalCommissionSettledBDT: financialData.totalCommissionSettledBDT,
        settlementsCount: financialData.settlementsCount,
      },
    };
  }

  /**
   * Search and filter platform users with pagination
   */
  public static async getUsers(options: UserQueryOptions): Promise<{
    users: IUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (options.role) {
      query.role = options.role;
    }

    if (options.status) {
      query.status = options.status;
    }

    if (options.search) {
      const searchRegex = new RegExp(options.search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update user account status (suspend, reactivate, etc.)
   */
  public static async updateUserStatus(
    userId: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'PENDING',
    reason: string | undefined,
    actor: AdminActor
  ): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found', 'USER_NOT_FOUND');
    }

    // Safety: prevent self-suspension of admin account
    if (user._id.toString() === actor.userId && status === 'SUSPENDED') {
      throw AppError.badRequest(
        'You cannot suspend your own administrative account',
        'SELF_SUSPENSION_PROHIBITED'
      );
    }

    const previousStatus = user.status;
    user.status = status;
    await user.save();

    // Create Audit Log
    await AuditLog.create({
      actor: new Types.ObjectId(actor.userId),
      actorRole: actor.role,
      action:
        status === 'SUSPENDED'
          ? 'USER_SUSPENDED'
          : status === 'ACTIVE'
          ? 'USER_ACTIVATED'
          : 'USER_STATUS_PENDING',
      targetType: 'USER',
      targetId: user._id.toString(),
      details: {
        previousStatus,
        newStatus: status,
        reason: reason || 'Administrative decision',
      },
    });

    // Notify user of status update
    try {
      await NotificationService.createNotification({
        recipient: user._id.toString(),
        sender: actor.userId,
        type: 'SYSTEM_ALERT',
        title: {
          en: `Account Status Updated: ${status}`,
          bn: `অ্যাকাউন্ট স্ট্যাটাস পরিবর্তিত: ${status}`,
        },
        message: {
          en: `Your ShebaConnect account status is now ${status}. Reason: ${
            reason || 'Administrative review'
          }`,
          bn: `আপনার সেবাকানেক্ট অ্যাকাউন্ট স্ট্যাটাস এখন ${status}। কারণ: ${
            reason || 'প্রশাসনিক পর্যালোচনা'
          }`,
        },
      });
    } catch (_err) {
      // Non-blocking notification dispatch
    }

    return user;
  }

  /**
   * Retrieve all pending verification applications (Individual Providers & Companies)
   */
  public static async getVerificationApplications(): Promise<{
    providers: IProviderProfile[];
    companies: IOrganization[];
  }> {
    const [providers, companies] = await Promise.all([
      ProviderProfile.find({
        verificationStatus: { $in: ['PENDING_REVIEW', 'UNVERIFIED'] },
      })
        .populate('user', 'name email phone avatarUrl status isVerified')
        .sort({ updatedAt: -1 }),
      Organization.find({
        approvalStatus: { $in: ['PENDING_APPROVAL', 'REJECTED'] },
      })
        .populate('owner', 'name email phone avatarUrl status')
        .sort({ updatedAt: -1 }),
    ]);

    return { providers, companies };
  }

  /**
   * Review and approve/reject individual provider verification submission
   */
  public static async reviewProviderVerification(
    providerId: string,
    status: 'VERIFIED' | 'REJECTED' | 'PENDING_REVIEW',
    notes: string | undefined,
    rejectionReason: string | undefined,
    actor: AdminActor
  ): Promise<IProviderProfile> {
    // Support either ProviderProfile._id or User._id
    let profile = await ProviderProfile.findById(providerId);
    if (!profile) {
      profile = await ProviderProfile.findOne({ user: providerId });
    }
    if (!profile) {
      throw AppError.notFound('Provider profile not found', 'PROVIDER_NOT_FOUND');
    }

    const previousStatus = profile.verificationStatus;
    profile.verificationStatus = status;

    if (status === 'VERIFIED') {
      profile.verifiedAt = new Date();
      profile.rejectionReason = undefined;
      await User.findByIdAndUpdate(profile.user, { isVerified: true });
    } else if (status === 'REJECTED') {
      profile.rejectionReason = rejectionReason || notes || 'Requirements not met';
      await User.findByIdAndUpdate(profile.user, { isVerified: false });
    }

    if (notes) {
      profile.verificationNotes = notes;
    }

    await profile.save();

    // Audit Log
    await AuditLog.create({
      actor: new Types.ObjectId(actor.userId),
      actorRole: actor.role,
      action: status === 'VERIFIED' ? 'PROVIDER_VERIFIED' : 'PROVIDER_REJECTED',
      targetType: 'PROVIDER',
      targetId: profile._id.toString(),
      details: {
        providerUserId: profile.user.toString(),
        previousStatus,
        newStatus: status,
        notes,
        rejectionReason,
      },
    });

    // Notify provider
    try {
      await NotificationService.createNotification({
        recipient: profile.user.toString(),
        sender: actor.userId,
        type: 'SYSTEM_ALERT',
        title: {
          en: `Provider Verification: ${status}`,
          bn: `প্রোভাইডার ভেরিফিকেশন: ${status}`,
        },
        message: {
          en:
            status === 'VERIFIED'
              ? 'Congratulations! Your national identity and provider profile have been verified.'
              : `Your verification submission was reviewed. Status: ${status}. Notes: ${
                  notes || rejectionReason || 'Contact support'
                }`,
          bn:
            status === 'VERIFIED'
              ? 'অভিনন্দন! আপনার জাতীয় পরিচয়পত্র ও প্রোভাইডার প্রোফাইল অনুমোদিত হয়েছে।'
              : `আপনার আবেদন পর্যালোচনা করা হয়েছে। অবস্থা: ${status}। মন্তব্য: ${
                  notes || rejectionReason || 'সহায়তায় যোগাযোগ করুন'
                }`,
        },
      });
    } catch (_err) {
      // Non-blocking notification dispatch
    }

    return profile;
  }

  /**
   * Review and approve/reject company organization registration
   */
  public static async reviewCompanyApproval(
    orgId: string,
    status: 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'PENDING_APPROVAL',
    notes: string | undefined,
    actor: AdminActor
  ): Promise<IOrganization> {
    const org = await Organization.findById(orgId);
    if (!org) {
      throw AppError.notFound('Organization not found', 'ORGANIZATION_NOT_FOUND');
    }

    const previousStatus = org.approvalStatus;
    org.approvalStatus = status;
    org.isVerified = status === 'APPROVED';
    await org.save();

    // Audit Log
    await AuditLog.create({
      actor: new Types.ObjectId(actor.userId),
      actorRole: actor.role,
      action:
        status === 'APPROVED'
          ? 'COMPANY_APPROVED'
          : status === 'REJECTED'
          ? 'COMPANY_REJECTED'
          : 'COMPANY_SUSPENDED',
      targetType: 'COMPANY',
      targetId: org._id.toString(),
      details: {
        previousStatus,
        newStatus: status,
        notes,
      },
    });

    // Notify owner
    try {
      await NotificationService.createNotification({
        recipient: org.owner.toString(),
        sender: actor.userId,
        type: 'SYSTEM_ALERT',
        title: {
          en: `Company Registration: ${status}`,
          bn: `কোম্পানি অনুমোদন: ${status}`,
        },
        message: {
          en: `Your organization '${org.name}' registration status is now ${status}. Notes: ${
            notes || 'Standard compliance check'
          }`,
          bn: `আপনার প্রতিষ্ঠান '${org.name}'-এর অবস্থা এখন ${status}।`,
        },
      });
    } catch (_err) {
      // Non-blocking notification dispatch
    }

    return org;
  }

  /**
   * Query all bookings with pagination and filters
   */
  public static async getAllBookings(options: BookingQueryOptions): Promise<{
    bookings: IBooking[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (options.status) {
      query.status = options.status;
    }

    if (options.area) {
      query['serviceAddress.area'] = options.area.toLowerCase();
    }

    if (options.search) {
      const searchRegex = new RegExp(options.search.trim(), 'i');
      query.$or = [
        { bookingNumber: searchRegex },
        { problemDescription: searchRegex },
        { 'serviceAddress.addressLine': searchRegex },
      ];
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('customer', 'name phone email')
        .populate('provider', 'name phone email')
        .populate('organization', 'name contactPhone')
        .populate('technician', 'name phone email')
        .populate('service', 'name category pricingType basePrice')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(query),
    ]);

    return {
      bookings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get all disputed bookings with payment details
   */
  public static async getDisputes(): Promise<Array<{
    booking: IBooking;
    payment?: unknown;
  }>> {
    const disputedBookings = await Booking.find({ status: 'DISPUTED' })
      .populate('customer', 'name phone email')
      .populate('provider', 'name phone email')
      .populate('organization', 'name contactPhone')
      .populate('technician', 'name phone email')
      .populate('service', 'name category pricingType basePrice')
      .sort({ updatedAt: -1 });

    const bookingIds = disputedBookings.map((b) => b._id);
    const payments = await CashPayment.find({ booking: { $in: bookingIds } });
    const paymentMap = new Map<string, unknown>();
    for (const p of payments) {
      paymentMap.set(p.booking.toString(), p);
    }

    return disputedBookings.map((booking) => ({
      booking,
      payment: paymentMap.get(booking._id.toString()),
    }));
  }

  /**
   * Administrator resolves a disputed booking (either COMPLETED or CANCELLED)
   */
  public static async resolveDispute(
    bookingId: string,
    resolution: 'RESOLVE_AS_COMPLETED' | 'RESOLVE_AS_CANCELLED',
    notes: string,
    refundOrWaiveFee: boolean | undefined,
    actor: AdminActor
  ): Promise<IBooking> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw AppError.notFound('Booking not found', 'BOOKING_NOT_FOUND');
    }

    if (booking.status !== 'DISPUTED') {
      throw AppError.badRequest(
        `Booking is in status '${booking.status}', only DISPUTED bookings can be resolved through this endpoint`,
        'BOOKING_NOT_IN_DISPUTE'
      );
    }

    const nextStatus =
      resolution === 'RESOLVE_AS_COMPLETED' ? 'COMPLETED' : 'CANCELLED';

    // Transition via Centralized State Machine with ADMIN override
    const updatedBooking = await BookingStateService.transition(
      bookingId,
      nextStatus,
      { userId: actor.userId, role: 'ADMIN' },
      { reason: `Dispute Resolved by Admin: ${notes}` }
    );

    // Update Cash Payment and Commission Entry if needed
    const payment = await CashPayment.findOne({ booking: booking._id });
    if (payment) {
      if (resolution === 'RESOLVE_AS_COMPLETED') {
        payment.status = PAYMENT_STATUSES.CONFIRMED;
        payment.notes = (payment.notes ? payment.notes + ' | ' : '') + `Admin dispute resolved: ${notes}`;
        await payment.save();
      } else if (resolution === 'RESOLVE_AS_CANCELLED') {
        payment.status = PAYMENT_STATUSES.PENDING;
        payment.notes = (payment.notes ? payment.notes + ' | ' : '') + `Admin cancelled dispute: ${notes}`;
        await payment.save();

        if (refundOrWaiveFee) {
          await CommissionEntry.updateMany(
            { booking: booking._id },
            { $set: { status: COMMISSION_STATUSES.WAIVED, notes: `Fee waived by Admin: ${notes}` } }
          );
        }
      }
    }

    // Create Audit Log
    await AuditLog.create({
      actor: new Types.ObjectId(actor.userId),
      actorRole: actor.role,
      action: 'DISPUTE_RESOLVED',
      targetType: 'BOOKING',
      targetId: booking._id.toString(),
      details: {
        resolution,
        resolvedStatus: nextStatus,
        notes,
        refundOrWaiveFee: !!refundOrWaiveFee,
      },
    });

    // Notify Customer and Provider
    const parties = [booking.customer.toString()];
    if (booking.provider) parties.push(booking.provider.toString());
    if (booking.technician) parties.push(booking.technician.toString());

    for (const recipientId of parties) {
      try {
        await NotificationService.createNotification({
          recipient: recipientId,
          sender: actor.userId,
          booking: booking._id.toString(),
          type: 'SYSTEM_ALERT',
          title: {
            en: `Dispute Resolved: Booking #${booking.bookingNumber}`,
            bn: `বিরোধ নিষ্পত্তি: বুকিং #${booking.bookingNumber}`,
          },
          message: {
            en: `The administrator has resolved the dispute for booking #${booking.bookingNumber}. Outcome: ${nextStatus}. Notes: ${notes}`,
            bn: `প্রশাসক বুকিং #${booking.bookingNumber}-এর বিরোধ নিষ্পত্তি করেছেন। ফলাফল: ${nextStatus}। মন্তব্য: ${notes}`,
          },
          link: booking._id.toString(),
        });
      } catch (_err) {
        // Non-blocking notification dispatch
      }
    }

    return updatedBooking;
  }

  /**
   * Administrator manual commission settlement
   */
  public static async recordCommissionSettlement(
    actor: AdminActor,
    options: SettlementOptions
  ): Promise<{
    settlement: unknown;
    settledCount: number;
  }> {
    const result = await PaymentService.recordCommissionSettlement(actor.userId, options);

    await AuditLog.create({
      actor: new Types.ObjectId(actor.userId),
      actorRole: actor.role,
      action: 'COMMISSION_SETTLED',
      targetType: 'COMMISSION',
      targetId: (result.settlement as any)._id?.toString() || 'SETTLEMENT',
      details: {
        settlementNumber: (result.settlement as any).settlementNumber,
        amountSettled: options.amountSettled,
        entriesSettledCount: result.settledCount,
        notes: options.notes,
      },
    });

    return result;
  }

  /**
   * Retrieve platform audit trail with pagination
   */
  public static async getAuditLogs(options: AuditLogQueryOptions): Promise<{
    logs: IAuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (options.action) {
      query.action = options.action;
    }

    if (options.targetType) {
      query.targetType = options.targetType;
    }

    if (options.actorId) {
      query.actor = new Types.ObjectId(options.actorId);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actor', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(query),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

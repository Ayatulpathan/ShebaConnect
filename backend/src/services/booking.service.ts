import crypto from 'crypto';
import { Types, FilterQuery } from 'mongoose';
import { Booking, IBooking, IBookingAddress } from '../models/Booking.js';
import { BookingStatusHistory } from '../models/BookingStatusHistory.js';
import { Service } from '../models/Service.js';
import { Organization } from '../models/Organization.js';
import { ProviderServiceListing } from '../models/ProviderServiceListing.js';
import { VALID_DHAKA_AREA_IDS } from '../constants/areas.js';
import { UserRole } from '../constants/roles.js';
import { AppError } from '../utils/AppError.js';

export interface CreateBookingDTO {
  serviceId: string;
  providerId?: string;
  organizationId?: string;
  problemDescription: string;
  serviceAddress: IBookingAddress;
  scheduledDate: string | Date;
  preferredTimeSlot: string;
}

export class BookingService {
  /**
   * Generates a collision-resistant human-readable booking number (e.g., SC-2611-A8B9)
   */
  public static generateBookingNumber(): string {
    const now = new Date();
    const yearMonth = `${now.getFullYear().toString().slice(2)}${String(
      now.getMonth() + 1
    ).padStart(2, '0')}`;
    const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `SC-${yearMonth}-${randomSuffix}`;
  }

  /**
   * Create a new booking request by a customer
   */
  public static async createBooking(
    customerUserId: string,
    data: CreateBookingDTO
  ): Promise<IBooking> {
    const service = await Service.findById(data.serviceId);
    if (!service || !service.isActive) {
      throw new AppError('Service not found or inactive', 404, 'SERVICE_NOT_FOUND');
    }

    if (!VALID_DHAKA_AREA_IDS.includes(data.serviceAddress.area as any)) {
      throw new AppError(
        `Invalid Dhaka area '${data.serviceAddress.area}'. Must be an eligible Dhaka service zone.`,
        400,
        'INVALID_SERVICE_AREA'
      );
    }

    const scheduledDateObj = new Date(data.scheduledDate);
    if (isNaN(scheduledDateObj.getTime())) {
      throw new AppError('Invalid scheduled date provided', 400, 'INVALID_SCHEDULED_DATE');
    }

    let organizationObjId: Types.ObjectId | undefined;
    let providerObjId: Types.ObjectId | undefined;

    if (data.organizationId) {
      const org = await Organization.findById(data.organizationId);
      if (!org || org.approvalStatus === 'SUSPENDED') {
        throw new AppError('Organization not found or inactive', 404, 'ORGANIZATION_NOT_FOUND');
      }
      organizationObjId = org._id;
    }

    if (data.providerId) {
      providerObjId = new Types.ObjectId(data.providerId);
    }

    let bookingNumber = this.generateBookingNumber();
    // Guarantee uniqueness
    while (await Booking.findOne({ bookingNumber })) {
      bookingNumber = this.generateBookingNumber();
    }

    const booking = await Booking.create({
      bookingNumber,
      customer: new Types.ObjectId(customerUserId),
      service: service._id,
      provider: providerObjId,
      organization: organizationObjId,
      status: 'REQUESTED',
      problemDescription: data.problemDescription,
      serviceAddress: data.serviceAddress,
      scheduledDate: scheduledDateObj,
      preferredTimeSlot: data.preferredTimeSlot,
      pricingType: service.pricingType,
      basePrice: service.basePrice,
      finalPrice: service.basePrice,
      isPaid: false,
      paymentMethod: 'CASH_AFTER_SERVICE',
    });

    // Create initial state history
    await BookingStatusHistory.create({
      booking: booking._id,
      newStatus: 'REQUESTED',
      changedBy: new Types.ObjectId(customerUserId),
      actorRole: 'CUSTOMER',
      reason: 'Initial booking request submitted by customer',
      metadata: {
        bookingNumber: booking.bookingNumber,
        pricingType: service.pricingType,
        area: data.serviceAddress.area,
      },
    });

    return booking;
  }

  /**
   * Retrieve a single booking with security authorization check
   */
  public static async getBookingById(
    bookingId: string,
    actor: { userId: string; role: UserRole }
  ): Promise<IBooking> {
    const booking = await Booking.findById(bookingId)
      .populate('customer', 'name phone email')
      .populate('service', 'name slug basePrice pricingType estimatedDurationMinutes')
      .populate('provider', 'name phone email')
      .populate('organization', 'name contactPhone contactEmail')
      .populate('technician', 'name phone email')
      .populate('acceptedQuote');

    if (!booking) {
      throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    // RBAC & Ownership Verification
    const actorIdStr = actor.userId.toString();
    const isCustomer = booking.customer._id
      ? booking.customer._id.toString() === actorIdStr
      : (booking.customer as any).toString() === actorIdStr;
    const isProvider = booking.provider?._id
      ? booking.provider._id.toString() === actorIdStr
      : (booking.provider as any)?.toString() === actorIdStr;
    const isTechnician = booking.technician?._id
      ? booking.technician._id.toString() === actorIdStr
      : (booking.technician as any)?.toString() === actorIdStr;
    const isAdmin = actor.role === 'ADMIN';

    let isCompanyOwner = false;
    if (actor.role === 'COMPANY_OWNER' && booking.organization) {
      const org = await Organization.findOne({
        _id: (booking.organization as any)._id || booking.organization,
        owner: actor.userId,
      });
      if (org) isCompanyOwner = true;
    }

    if (!isCustomer && !isProvider && !isTechnician && !isCompanyOwner && !isAdmin) {
      throw new AppError(
        'You do not have permission to access this booking',
        403,
        'FORBIDDEN_BOOKING_ACCESS'
      );
    }

    return booking;
  }

  /**
   * List bookings scoped by user role and filters
   */
  public static async listBookings(
    actor: { userId: string; role: UserRole },
    filters: { status?: string; page?: number; limit?: number }
  ): Promise<{ bookings: IBooking[]; pagination: { total: number; page: number; limit: number } }> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(50, Math.max(1, filters.limit || 10));
    const skip = (page - 1) * limit;

    const query: FilterQuery<IBooking> = {};

    if (filters.status) {
      query.status = filters.status;
    }

    // Role-based boundary enforcement
    if (actor.role === 'CUSTOMER') {
      query.customer = new Types.ObjectId(actor.userId);
    } else if (actor.role === 'INDIVIDUAL_PROVIDER') {
      // Find listings to know which service areas provider covers
      const listings = await ProviderServiceListing.find({
        provider: actor.userId,
        isActive: true,
      });
      const coveredAreas = Array.from(new Set(listings.flatMap((l) => l.serviceAreas)));

      query.$or = [
        { provider: new Types.ObjectId(actor.userId) },
        // Also show unassigned open requests in provider's service areas
        {
          provider: { $exists: false },
          status: 'REQUESTED',
          'serviceAddress.area': { $in: coveredAreas },
        },
      ];
    } else if (actor.role === 'COMPANY_OWNER') {
      const org = await Organization.findOne({ owner: actor.userId });
      if (org) {
        query.organization = org._id;
      } else {
        return { bookings: [], pagination: { total: 0, page, limit } };
      }
    } else if (actor.role === 'TECHNICIAN') {
      query.technician = new Types.ObjectId(actor.userId);
    } else if (actor.role !== 'ADMIN') {
      // Unrecognized role or support agent with no assignments
      return { bookings: [], pagination: { total: 0, page, limit } };
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('customer', 'name phone')
        .populate('service', 'name slug basePrice pricingType')
        .populate('provider', 'name phone')
        .populate('technician', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(query),
    ]);

    return {
      bookings,
      pagination: {
        total,
        page,
        limit,
      },
    };
  }

  /**
   * Get full audit history of status changes for a booking
   */
  public static async getBookingHistory(
    bookingId: string,
    actor: { userId: string; role: UserRole }
  ) {
    // Validate booking access first
    await this.getBookingById(bookingId, actor);

    const history = await BookingStatusHistory.find({ booking: bookingId })
      .populate('changedBy', 'name role')
      .sort({ createdAt: 1 });

    return history;
  }
}

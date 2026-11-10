import { Types } from 'mongoose';
import { Booking, IBooking } from '../models/Booking.js';
import { BookingStatusHistory } from '../models/BookingStatusHistory.js';
import { Quote } from '../models/Quote.js';
import { OrganizationMember } from '../models/OrganizationMember.js';
import { Organization } from '../models/Organization.js';
import { BOOKING_STATUSES, BookingStatus } from '../constants/statuses.js';
import { UserRole } from '../constants/roles.js';
import { AppError } from '../utils/AppError.js';
import { SocketService } from './socket.service.js';
import { NotificationService } from './notification.service.js';

export interface TransitionActor {
  userId: string;
  role: UserRole;
}

export interface TransitionOptions {
  reason?: string;
  technicianId?: string;
  quoteId?: string;
  finalPrice?: number;
  metadata?: Record<string, unknown>;
}

// State transition validation map
const PERMITTED_NEXT_STATUSES: Record<BookingStatus, BookingStatus[]> = {
  REQUESTED: ['ACCEPTED', 'SCHEDULED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
  ACCEPTED: ['SCHEDULED', 'PROVIDER_ASSIGNED', 'CANCELLED'],
  SCHEDULED: ['PROVIDER_ASSIGNED', 'ON_THE_WAY', 'CANCELLED'],
  PROVIDER_ASSIGNED: ['ON_THE_WAY', 'CANCELLED'],
  ON_THE_WAY: ['IN_PROGRESS', 'DISPUTED', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'DISPUTED', 'CANCELLED'],
  COMPLETED: ['DISPUTED'],
  DISPUTED: ['COMPLETED', 'CANCELLED'],
  REJECTED: [],
  CANCELLED: [],
  EXPIRED: [],
};

export class BookingStateService {
  /**
   * Validate if the requested status transition is allowed in the state machine
   */
  public static isAllowedTransition(
    currentStatus: BookingStatus,
    nextStatus: BookingStatus
  ): boolean {
    const allowed = PERMITTED_NEXT_STATUSES[currentStatus] || [];
    return allowed.includes(nextStatus);
  }

  /**
   * Centralized state transition method
   */
  public static async transition(
    bookingId: string | Types.ObjectId,
    nextStatus: BookingStatus,
    actor: TransitionActor,
    options: TransitionOptions = {}
  ): Promise<IBooking> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    const currentStatus = booking.status;

    // 1. Validate State Machine
    if (!this.isAllowedTransition(currentStatus, nextStatus)) {
      throw new AppError(
        `Invalid status transition from '${currentStatus}' to '${nextStatus}'`,
        400,
        'INVALID_STATUS_TRANSITION'
      );
    }

    // 2. Validate Role & Ownership
    await this.validateActorPermissions(booking, nextStatus, actor, options);

    // 3. Apply status-specific changes
    await this.applyStatusMutations(booking, nextStatus, actor, options);

    // 4. Save updated booking
    booking.status = nextStatus;
    await booking.save();

    // 5. Create immutable audit log in BookingStatusHistory
    await BookingStatusHistory.create({
      booking: booking._id,
      previousStatus: currentStatus,
      newStatus: nextStatus,
      changedBy: new Types.ObjectId(actor.userId),
      actorRole: actor.role,
      reason: options.reason,
      metadata: options.metadata || {},
    });

    // 6. Broadcast real-time booking update & push notification
    try {
      const participantIds: string[] = [];
      if (booking.customer) participantIds.push(booking.customer.toString());
      if (booking.provider) participantIds.push(booking.provider.toString());
      if (booking.technician) participantIds.push(booking.technician.toString());

      SocketService.broadcastBookingStatusUpdate(
        booking._id.toString(),
        nextStatus,
        booking.bookingNumber,
        participantIds
      );

      // Notify the other party
      const isCustomerActor = actor.userId === booking.customer.toString();
      const targetRecipient = isCustomerActor
        ? booking.provider?.toString() || booking.technician?.toString()
        : booking.customer.toString();

      if (targetRecipient) {
        await NotificationService.createNotification({
          recipient: targetRecipient,
          sender: actor.userId,
          booking: booking._id.toString(),
          type: 'BOOKING_STATUS_CHANGED',
          title: {
            en: `Booking Status: ${nextStatus.replace(/_/g, ' ')}`,
            bn: `বুকিং স্ট্যাটাস: ${nextStatus}`,
          },
          message: {
            en: `Booking #${booking.bookingNumber} is now ${nextStatus.replace(/_/g, ' ')}`,
            bn: `আপনার বুকিং #${booking.bookingNumber}-এর অবস্থা পরিবর্তিত হয়ে '${nextStatus}' হয়েছে`,
          },
          link: booking._id.toString(),
        });
      }
    } catch (_err) {
      // Non-blocking notification dispatch
    }

    return booking;
  }

  /**
   * Check permissions based on current state, target state, actor role, and resource ownership
   */
  private static async validateActorPermissions(
    booking: IBooking,
    nextStatus: BookingStatus,
    actor: TransitionActor,
    options: TransitionOptions
  ): Promise<void> {
    const actorIdStr = actor.userId.toString();
    const isCustomer = booking.customer.toString() === actorIdStr;
    const isTargetProvider = booking.provider?.toString() === actorIdStr;
    const isAssignedTechnician = booking.technician?.toString() === actorIdStr;

    // Admin has super-override for administrative interventions & dispute resolution
    if (actor.role === 'ADMIN') {
      return;
    }

    switch (nextStatus) {
      case 'ACCEPTED': {
        if (actor.role !== 'INDIVIDUAL_PROVIDER' && actor.role !== 'COMPANY_OWNER') {
          throw new AppError(
            'Only providers or companies can accept a booking request',
            403,
            'FORBIDDEN_TRANSITION'
          );
        }

        // If booking already targeted a specific provider
        if (booking.provider && !isTargetProvider) {
          // If company, verify owner owns the assigned organization
          if (actor.role === 'COMPANY_OWNER' && booking.organization) {
            const org = await Organization.findById(booking.organization);
            if (!org || org.owner.toString() !== actorIdStr) {
              throw new AppError(
                'You are not authorized to accept for this organization',
                403,
                'FORBIDDEN_TRANSITION'
              );
            }
          } else {
            throw new AppError(
              'This booking was requested for a different provider',
              403,
              'FORBIDDEN_TRANSITION'
            );
          }
        }
        break;
      }

      case 'REJECTED': {
        if (actor.role !== 'INDIVIDUAL_PROVIDER' && actor.role !== 'COMPANY_OWNER') {
          throw new AppError(
            'Only providers can reject booking requests',
            403,
            'FORBIDDEN_TRANSITION'
          );
        }
        break;
      }

      case 'SCHEDULED': {
        // Customer or Provider can schedule
        if (!isCustomer && !isTargetProvider && actor.role !== 'COMPANY_OWNER') {
          throw new AppError(
            'Only the customer or assigned provider can confirm scheduling',
            403,
            'FORBIDDEN_TRANSITION'
          );
        }
        break;
      }

      case 'PROVIDER_ASSIGNED': {
        if (actor.role !== 'COMPANY_OWNER' && actor.role !== 'COMPANY_STAFF' && actor.role !== 'INDIVIDUAL_PROVIDER') {
          throw new AppError(
            'Only company owners, staff, or providers can assign a technician',
            403,
            'FORBIDDEN_TRANSITION'
          );
        }

        if (!options.technicianId) {
          throw new AppError(
            'Technician ID is required when transitioning to PROVIDER_ASSIGNED',
            400,
            'MISSING_REQUIRED_TRANSITION_DATA'
          );
        }

        // If company owner or staff, verify the technician is a registered member of their company
        if (actor.role === 'COMPANY_OWNER' || actor.role === 'COMPANY_STAFF') {
          let orgId: Types.ObjectId | undefined;
          if (actor.role === 'COMPANY_OWNER') {
            const org = await Organization.findOne({ owner: actor.userId });
            if (!org) {
              throw new AppError(
                'Organization not found for this company owner',
                404,
                'ORGANIZATION_NOT_FOUND'
              );
            }
            orgId = org._id;
          } else {
            const staffMember = await OrganizationMember.findOne({
              user: actor.userId,
              status: 'ACTIVE',
            });
            if (!staffMember) {
              throw new AppError(
                'Staff membership not found for this user',
                403,
                'FORBIDDEN_TRANSITION'
              );
            }
            orgId = staffMember.organization;
          }

          const isMember = await OrganizationMember.findOne({
            organization: orgId,
            user: options.technicianId,
            status: 'ACTIVE',
          });

          if (!isMember) {
            throw new AppError(
              'Technician is not an active member of your organization',
              403,
              'INVALID_TECHNICIAN_MEMBERSHIP'
            );
          }
        }
        break;
      }

      case 'ON_THE_WAY': {
        if (!isTargetProvider && !isAssignedTechnician) {
          throw new AppError(
            'Only the assigned provider or technician can update status to ON_THE_WAY',
            403,
            'FORBIDDEN_TRANSITION'
          );
        }
        break;
      }

      case 'IN_PROGRESS': {
        if (!isTargetProvider && !isAssignedTechnician) {
          throw new AppError(
            'Only the assigned provider or technician can start the service',
            403,
            'FORBIDDEN_TRANSITION'
          );
        }
        break;
      }

      case 'COMPLETED': {
        if (!isTargetProvider && !isAssignedTechnician) {
          throw new AppError(
            'Only the assigned provider or technician can complete the service',
            403,
            'FORBIDDEN_TRANSITION'
          );
        }
        break;
      }

      case 'CANCELLED': {
        // Customer can cancel before ON_THE_WAY or IN_PROGRESS
        if (isCustomer) {
          if (['ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status)) {
            throw new AppError(
              'Cancellation policy prohibits cancelling once the provider is on the way or work is in progress',
              400,
              'CANCELLATION_POLICY_RESTRICTION'
            );
          }
        } else if (!isTargetProvider && actor.role !== 'COMPANY_OWNER') {
          throw new AppError(
            'You are not authorized to cancel this booking',
            403,
            'FORBIDDEN_TRANSITION'
          );
        }
        break;
      }

      case 'DISPUTED': {
        // Customer or Provider can dispute
        if (!isCustomer && !isTargetProvider && !isAssignedTechnician) {
          throw new AppError(
            'Only booking participants can open a dispute',
            403,
            'FORBIDDEN_TRANSITION'
          );
        }
        break;
      }

      default:
        break;
    }
  }

  /**
   * Apply required mutations to the booking document
   */
  private static async applyStatusMutations(
    booking: IBooking,
    nextStatus: BookingStatus,
    actor: TransitionActor,
    options: TransitionOptions
  ): Promise<void> {
    switch (nextStatus) {
      case 'ACCEPTED': {
        // If booking didn't have an assigned provider, assign accepting provider
        if (!booking.provider && actor.role === 'INDIVIDUAL_PROVIDER') {
          booking.provider = new Types.ObjectId(actor.userId);
        } else if (!booking.organization && actor.role === 'COMPANY_OWNER') {
          const org = await Organization.findOne({ owner: actor.userId });
          if (org) {
            booking.organization = org._id;
            booking.provider = new Types.ObjectId(actor.userId);
          }
        }
        break;
      }

      case 'PROVIDER_ASSIGNED': {
        if (options.technicianId) {
          booking.technician = new Types.ObjectId(options.technicianId);
        }
        break;
      }

      case 'SCHEDULED': {
        if (options.quoteId) {
          const quote = await Quote.findById(options.quoteId);
          if (quote) {
            booking.acceptedQuote = quote._id;
            booking.finalPrice = quote.amount;
            quote.status = 'ACCEPTED';
            await quote.save();
          }
        } else if (options.finalPrice !== undefined && options.finalPrice >= 0) {
          booking.finalPrice = options.finalPrice;
        }
        break;
      }

      case 'COMPLETED': {
        booking.completedAt = new Date();
        break;
      }

      case 'CANCELLED': {
        booking.cancelledBy = new Types.ObjectId(actor.userId);
        if (options.reason) {
          booking.cancellationReason = options.reason;
        }
        break;
      }

      case 'REJECTED': {
        if (options.reason) {
          booking.rejectionReason = options.reason;
        }
        break;
      }

      default:
        break;
    }
  }
}

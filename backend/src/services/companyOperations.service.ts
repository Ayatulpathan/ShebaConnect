import { Types } from 'mongoose';
import { Organization, type IOrganization } from '../models/Organization.js';
import { OrganizationMember, type IOrganizationMember, type OrganizationMemberRole } from '../models/OrganizationMember.js';
import { User, type IUser } from '../models/User.js';
import { Booking, type IBooking } from '../models/Booking.js';
import { Review } from '../models/Review.js';
import { BookingStateService } from './bookingState.service.js';
import { NotificationService } from './notification.service.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword } from '../utils/password.js';
import { VALID_DHAKA_AREA_IDS } from '../constants/areas.js';

export interface TechnicianStat {
  technicianId: string;
  name: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  assignedJobsCount: number;
  completedJobsCount: number;
  ratingAverage: number;
  ratingCount: number;
}

export interface CompanyMetrics {
  totalBookings: number;
  completedBookings: number;
  activeBookings: number;
  cancelledBookings: number;
  totalGrossRevenue: number;
  netRevenue: number;
  platformCommissionDue: number;
  technicianStats: TechnicianStat[];
}

interface CreateOrgInput {
  name: string;
  tradeLicense: string;
  contactPhone: string;
  contactEmail?: string;
  address: string;
  serviceAreas: string[];
  description?: string;
  logoUrl?: string;
}

interface AddMemberInput {
  name: string;
  email: string;
  phone: string;
  memberRole: OrganizationMemberRole;
  password: string;
}

export class CompanyOperationsService {
  /**
   * Register a new company (Restricted to COMPANY_OWNER)
   */
  static async createOrganization(ownerId: string, input: CreateOrgInput): Promise<IOrganization> {
    const existingOrg = await Organization.findOne({ owner: ownerId });
    if (existingOrg) {
      throw AppError.conflict(
        'You have already registered a service company. Each owner account manages one organization.',
        'ORGANIZATION_EXISTS'
      );
    }

    const normalizedAreas = input.serviceAreas.map((a) => a.toLowerCase().trim());
    const invalidAreas = normalizedAreas.filter((a) => !VALID_DHAKA_AREA_IDS.includes(a));
    if (invalidAreas.length > 0) {
      throw AppError.badRequest(
        `Invalid service area(s): ${invalidAreas.join(', ')}. Please select from valid Dhaka zones.`,
        'INVALID_SERVICE_AREA'
      );
    }

    const organization = new Organization({
      owner: ownerId,
      name: input.name.trim(),
      tradeLicense: input.tradeLicense.trim(),
      contactPhone: input.contactPhone.trim(),
      contactEmail: input.contactEmail?.toLowerCase().trim(),
      address: input.address.trim(),
      serviceAreas: normalizedAreas,
      description: input.description?.trim(),
      logoUrl: input.logoUrl,
      approvalStatus: 'PENDING_APPROVAL',
      isVerified: false,
    });

    await organization.save();
    return organization;
  }

  /**
   * Retrieve company for logged-in owner, staff, or technician
   */
  static async getMyOrganization(userId: string): Promise<IOrganization> {
    // 1. Direct owner check
    let org = await Organization.findOne({ owner: userId });
    if (org) return org;

    // 2. Member check (Staff / Technician)
    const membership = await OrganizationMember.findOne({ user: userId, status: 'ACTIVE' });
    if (!membership) {
      throw AppError.notFound(
        'No service company organization found associated with your account.',
        'ORGANIZATION_NOT_FOUND'
      );
    }

    org = await Organization.findById(membership.organization);
    if (!org) {
      throw AppError.notFound('Associated company could not be found.', 'ORGANIZATION_NOT_FOUND');
    }

    return org;
  }

  /**
   * Update company details (Owner only)
   */
  static async updateOrganization(
    orgId: string,
    ownerId: string,
    input: Partial<CreateOrgInput>
  ): Promise<IOrganization> {
    const org = await Organization.findById(orgId);
    if (!org) {
      throw AppError.notFound('Organization not found', 'ORGANIZATION_NOT_FOUND');
    }

    // Strict resource ownership check: only the owner can modify company data
    if (org.owner.toString() !== ownerId) {
      throw AppError.forbidden(
        'You are not authorized to modify this organization.',
        'FORBIDDEN_ORGANIZATION_ACCESS'
      );
    }

    if (input.name) org.name = input.name.trim();
    if (input.tradeLicense) org.tradeLicense = input.tradeLicense.trim();
    if (input.contactPhone) org.contactPhone = input.contactPhone.trim();
    if (input.contactEmail !== undefined) org.contactEmail = input.contactEmail?.toLowerCase().trim();
    if (input.address) org.address = input.address.trim();
    if (input.description !== undefined) org.description = input.description?.trim();
    if (input.logoUrl !== undefined) org.logoUrl = input.logoUrl;

    if (input.serviceAreas) {
      const normalizedAreas = input.serviceAreas.map((a) => a.toLowerCase().trim());
      const invalidAreas = normalizedAreas.filter((a) => !VALID_DHAKA_AREA_IDS.includes(a));
      if (invalidAreas.length > 0) {
        throw AppError.badRequest(
          `Invalid service area(s): ${invalidAreas.join(', ')}`,
          'INVALID_SERVICE_AREA'
        );
      }
      org.serviceAreas = normalizedAreas;
    }

    await org.save();
    return org;
  }

  /**
   * Add a new Staff member or Technician to the company
   */
  static async addMember(
    orgId: string,
    ownerId: string,
    input: AddMemberInput
  ): Promise<{ member: IOrganizationMember; user: IUser }> {
    const org = await Organization.findById(orgId);
    if (!org) {
      throw AppError.notFound('Organization not found', 'ORGANIZATION_NOT_FOUND');
    }

    if (org.owner.toString() !== ownerId) {
      throw AppError.forbidden(
        'Only the company owner can add staff and technicians.',
        'FORBIDDEN_ORGANIZATION_ACCESS'
      );
    }

    const email = input.email.toLowerCase().trim();
    const phone = input.phone.trim();

    // Determine target system role: COMPANY_STAFF or TECHNICIAN
    const userRole = input.memberRole === 'STAFF' ? 'COMPANY_STAFF' : 'TECHNICIAN';

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { phone }] });
    if (user) {
      // Check if user is already a member of this company
      const existingMember = await OrganizationMember.findOne({
        organization: orgId,
        user: user._id,
      });
      if (existingMember) {
        throw AppError.conflict(
          'This user is already a registered member of your company.',
          'MEMBER_EXISTS'
        );
      }
    } else {
      // Create new user account for the technician/staff
      const hashedPassword = await hashPassword(input.password);
      user = await User.create({
        name: input.name.trim(),
        email,
        phone,
        password: hashedPassword,
        role: userRole,
        status: 'ACTIVE',
        isVerified: true, // Company verified
      });
    }

    const member = await OrganizationMember.create({
      organization: org._id,
      user: user._id,
      memberRole: input.memberRole,
      status: 'ACTIVE',
    });

    return { member, user };
  }

  /**
   * List company staff and technicians (Strict multi-tenant isolation)
   */
  static async getMembers(
    orgId: string,
    requestingUserId: string
  ): Promise<IOrganizationMember[]> {
    const org = await Organization.findById(orgId);
    if (!org) {
      throw AppError.notFound('Organization not found', 'ORGANIZATION_NOT_FOUND');
    }

    // Verify requesting user is owner or an active staff member of THIS company
    const isOwner = org.owner.toString() === requestingUserId;
    const isMember = await OrganizationMember.exists({
      organization: orgId,
      user: requestingUserId,
      status: 'ACTIVE',
    });

    if (!isOwner && !isMember) {
      throw AppError.forbidden(
        'You do not have permission to view members of another organization.',
        'FORBIDDEN_ORGANIZATION_ACCESS'
      );
    }

    return OrganizationMember.find({ organization: orgId })
      .populate('user', 'name email phone role status isVerified avatarUrl')
      .sort({ createdAt: -1 });
  }

  /**
   * Remove a staff or technician from the company
   */
  static async removeMember(
    orgId: string,
    ownerId: string,
    memberId: string
  ): Promise<void> {
    const org = await Organization.findById(orgId);
    if (!org) {
      throw AppError.notFound('Organization not found', 'ORGANIZATION_NOT_FOUND');
    }

    if (org.owner.toString() !== ownerId) {
      throw AppError.forbidden(
        'Only the company owner can remove staff members.',
        'FORBIDDEN_ORGANIZATION_ACCESS'
      );
    }

    const member = await OrganizationMember.findOne({
      _id: memberId,
      organization: orgId,
    });

    if (!member) {
      throw AppError.notFound('Company member record not found.', 'MEMBER_NOT_FOUND');
    }

    await member.deleteOne();
  }

  /**
   * Update staff or technician role/status
   */
  static async updateMember(
    orgId: string,
    ownerId: string,
    memberId: string,
    data: { memberRole?: OrganizationMemberRole; status?: 'ACTIVE' | 'INACTIVE' }
  ): Promise<IOrganizationMember> {
    const org = await Organization.findById(orgId);
    if (!org) {
      throw AppError.notFound('Organization not found', 'ORGANIZATION_NOT_FOUND');
    }

    if (org.owner.toString() !== ownerId) {
      throw AppError.forbidden(
        'Only the company owner can modify staff and technicians.',
        'FORBIDDEN_ORGANIZATION_ACCESS'
      );
    }

    const member = await OrganizationMember.findOne({
      _id: memberId,
      organization: orgId,
    });

    if (!member) {
      throw AppError.notFound('Company member record not found.', 'MEMBER_NOT_FOUND');
    }

    if (data.memberRole) {
      member.memberRole = data.memberRole;
      const newRole = data.memberRole === 'STAFF' ? 'COMPANY_STAFF' : 'TECHNICIAN';
      await User.findByIdAndUpdate(member.user, { role: newRole });
    }

    if (data.status) {
      member.status = data.status;
    }

    await member.save();
    return member;
  }

  /**
   * Assign a technician to a company booking
   */
  static async assignTechnicianToBooking(
    orgId: string,
    actorUserId: string,
    actorRole: string,
    bookingId: string,
    technicianId: string
  ): Promise<IBooking> {
    const org = await Organization.findById(orgId);
    if (!org) {
      throw AppError.notFound('Organization not found', 'ORGANIZATION_NOT_FOUND');
    }

    const isOwner = org.owner.toString() === actorUserId;
    const isStaff = await OrganizationMember.exists({
      organization: orgId,
      user: actorUserId,
      memberRole: 'STAFF',
      status: 'ACTIVE',
    });

    if (!isOwner && !isStaff && actorRole !== 'ADMIN') {
      throw AppError.forbidden(
        'You do not have permission to manage bookings for this company.',
        'FORBIDDEN_ORGANIZATION_ACCESS'
      );
    }

    // Verify technician is active in this company
    const techMembership = await OrganizationMember.findOne({
      organization: orgId,
      user: technicianId,
      memberRole: 'TECHNICIAN',
      status: 'ACTIVE',
    });

    if (!techMembership) {
      throw AppError.badRequest(
        'The specified technician is not an active technician in your organization.',
        'INVALID_TECHNICIAN'
      );
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw AppError.notFound('Booking not found', 'BOOKING_NOT_FOUND');
    }

    if (booking.organization?.toString() !== orgId) {
      throw AppError.forbidden(
        'This booking does not belong to your company.',
        'FORBIDDEN_BOOKING_ACCESS'
      );
    }

    // If status is ACCEPTED or SCHEDULED, transition to PROVIDER_ASSIGNED
    if (['ACCEPTED', 'SCHEDULED'].includes(booking.status)) {
      await BookingStateService.transition(
        bookingId,
        'PROVIDER_ASSIGNED',
        { userId: actorUserId, role: actorRole as any },
        { technicianId }
      );
    } else {
      booking.technician = new Types.ObjectId(technicianId);
      await booking.save();
    }

    // Increment assigned jobs count
    await OrganizationMember.findByIdAndUpdate(techMembership._id, {
      $inc: { assignedJobsCount: 1 },
    });

    // Notify technician
    await NotificationService.createNotification({
      recipient: technicianId,
      sender: actorUserId,
      booking: booking._id.toString(),
      title: {
        en: 'New Job Assigned!',
        bn: 'নতুন কাজের দায়িত্ব পেয়েছেন!',
      },
      message: {
        en: `You have been assigned to service booking #${booking.bookingNumber}.`,
        bn: `আপনাকে সার্ভিস বুকিং #${booking.bookingNumber}-এর দায়িত্ব দেওয়া হয়েছে।`,
      },
      type: 'BOOKING_STATUS_CHANGED',
      link: booking._id.toString(),
    }).catch(() => {});

    return (await Booking.findById(bookingId)
      .populate('technician', 'name email phone avatarUrl')
      .populate('service', 'name slug basePrice')
      .populate('customer', 'name phone')) as IBooking;
  }

  /**
   * Retrieve jobs assigned to a technician
   */
  static async getTechnicianJobs(
    technicianUserId: string,
    statusFilter?: string
  ): Promise<IBooking[]> {
    const query: Record<string, any> = { technician: new Types.ObjectId(technicianUserId) };
    if (statusFilter) {
      query.status = statusFilter;
    }

    return Booking.find(query)
      .sort({ scheduledDate: -1, createdAt: -1 })
      .populate('service', 'name slug basePrice pricingType')
      .populate('customer', 'name phone avatarUrl')
      .populate('organization', 'name contactPhone');
  }

  /**
   * List all bookings for a company
   */
  static async getCompanyBookings(
    orgId: string,
    requestingUserId: string
  ): Promise<IBooking[]> {
    const org = await Organization.findById(orgId);
    if (!org) {
      throw AppError.notFound('Organization not found', 'ORGANIZATION_NOT_FOUND');
    }

    const isOwner = org.owner.toString() === requestingUserId;
    const isStaff = await OrganizationMember.exists({
      organization: orgId,
      user: requestingUserId,
      status: 'ACTIVE',
    });

    if (!isOwner && !isStaff) {
      throw AppError.forbidden(
        'You do not have permission to view bookings for this company.',
        'FORBIDDEN_ORGANIZATION_ACCESS'
      );
    }

    return Booking.find({ organization: orgId })
      .sort({ createdAt: -1 })
      .populate('technician', 'name phone avatarUrl')
      .populate('customer', 'name phone')
      .populate('service', 'name slug basePrice');
  }

  /**
   * Aggregate company performance metrics & technician leaderboard
   */
  static async getCompanyMetrics(
    orgId: string,
    requestingUserId: string
  ): Promise<CompanyMetrics> {
    const org = await Organization.findById(orgId);
    if (!org) {
      throw AppError.notFound('Organization not found', 'ORGANIZATION_NOT_FOUND');
    }

    const isOwner = org.owner.toString() === requestingUserId;
    const isStaff = await OrganizationMember.exists({
      organization: orgId,
      user: requestingUserId,
      status: 'ACTIVE',
    });

    if (!isOwner && !isStaff) {
      throw AppError.forbidden(
        'You do not have permission to view metrics for this company.',
        'FORBIDDEN_ORGANIZATION_ACCESS'
      );
    }

    const orgObjectId = new Types.ObjectId(orgId);

    // Bookings summary
    const bookings = await Booking.find({ organization: orgObjectId });
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter((b) => b.status === 'COMPLETED').length;
    const activeBookings = bookings.filter((b) =>
      ['SCHEDULED', 'PROVIDER_ASSIGNED', 'ON_THE_WAY', 'IN_PROGRESS'].includes(b.status)
    ).length;
    const cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED').length;

    // Gross revenue from completed and paid bookings
    const totalGrossRevenue = bookings
      .filter((b) => b.status === 'COMPLETED' && b.isPaid)
      .reduce((sum, b) => sum + (b.finalPrice || b.basePrice || 0), 0);

    const netRevenue = Math.round(totalGrossRevenue * 0.9);
    const platformCommissionDue = Math.round(totalGrossRevenue * 0.1);

    // Technician stats
    const techMembers = await OrganizationMember.find({
      organization: orgObjectId,
      memberRole: 'TECHNICIAN',
    }).populate('user', 'name phone email avatarUrl');

    const technicianStats: TechnicianStat[] = [];
    for (const tm of techMembers) {
      const u = tm.user as any;
      if (!u) continue;
      const techId = u._id.toString();
      const techAssigned = bookings.filter(
        (b) => b.technician && b.technician.toString() === techId
      ).length;
      const techCompleted = bookings.filter(
        (b) => b.technician && b.technician.toString() === techId && b.status === 'COMPLETED'
      ).length;

      // Reviews average for technician
      const techReviews = await Review.find({
        technician: new Types.ObjectId(techId),
        status: 'ACTIVE',
      });
      const avg =
        techReviews.length > 0
          ? Math.round(
              (techReviews.reduce((sum, r) => sum + r.rating, 0) / techReviews.length) * 10
            ) / 10
          : 0;

      technicianStats.push({
        technicianId: techId,
        name: u.name,
        phone: u.phone,
        email: u.email,
        avatarUrl: u.avatarUrl,
        assignedJobsCount: techAssigned,
        completedJobsCount: techCompleted,
        ratingAverage: avg,
        ratingCount: techReviews.length,
      });
    }

    return {
      totalBookings,
      completedBookings,
      activeBookings,
      cancelledBookings,
      totalGrossRevenue,
      netRevenue,
      platformCommissionDue,
      technicianStats,
    };
  }
}

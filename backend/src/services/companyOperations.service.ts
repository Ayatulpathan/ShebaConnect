import { Organization, type IOrganization } from '../models/Organization.js';
import { OrganizationMember, type IOrganizationMember, type OrganizationMemberRole } from '../models/OrganizationMember.js';
import { User, type IUser } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword } from '../utils/password.js';
import { VALID_DHAKA_AREA_IDS } from '../constants/areas.js';

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
}

import { ProviderProfile, type IProviderProfile, type IVerificationDocument } from '../models/ProviderProfile.js';
import { AvailabilitySlot, type IAvailabilitySlot } from '../models/AvailabilitySlot.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

interface UpdateProfileInput {
  bio?: string;
  skills?: string[];
  experienceYears?: number;
}

interface VerificationSubmissionInput {
  nidNumber: string;
  documents: Array<{
    docType: 'NID' | 'TRADE_LICENSE' | 'POLICE_CLEARANCE' | 'CERTIFICATE';
    documentNumber: string;
    fileUrl?: string;
  }>;
}

interface SlotInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export class ProviderOperationsService {
  /**
   * Get or initialize provider profile
   */
  static async getOrCreateProfile(userId: string): Promise<IProviderProfile> {
    let profile = await ProviderProfile.findOne({ user: userId });
    if (!profile) {
      profile = await ProviderProfile.create({
        user: userId,
        skills: [],
        experienceYears: 1,
        verificationStatus: 'UNVERIFIED',
      });
    }
    return profile;
  }

  /**
   * Update bio, skills, and experience
   */
  static async updateProfile(userId: string, input: UpdateProfileInput): Promise<IProviderProfile> {
    const profile = await this.getOrCreateProfile(userId);

    if (input.bio !== undefined) profile.bio = input.bio.trim();
    if (input.skills !== undefined) profile.skills = input.skills.map((s) => s.trim());
    if (input.experienceYears !== undefined) profile.experienceYears = input.experienceYears;

    await profile.save();
    return profile;
  }

  /**
   * Submit National ID and verification documents for administrative review
   * (Strict Rule: Provider CANNOT set verificationStatus to 'VERIFIED' themselves)
   */
  static async submitVerification(
    userId: string,
    input: VerificationSubmissionInput
  ): Promise<IProviderProfile> {
    const profile = await this.getOrCreateProfile(userId);

    profile.nidNumber = input.nidNumber.trim();

    const formattedDocs: IVerificationDocument[] = input.documents.map((d) => ({
      docType: d.docType,
      documentNumber: d.documentNumber.trim(),
      fileUrl: d.fileUrl,
      submittedAt: new Date(),
    }));

    profile.verificationDocuments = formattedDocs;
    profile.verificationStatus = 'PENDING_REVIEW';
    profile.rejectionReason = undefined;

    await profile.save();
    return profile;
  }

  /**
   * Retrieve weekly availability schedule
   */
  static async getAvailability(userId: string): Promise<IAvailabilitySlot[]> {
    return AvailabilitySlot.find({ provider: userId }).sort({ dayOfWeek: 1 });
  }

  /**
   * Update or initialize weekly recurring availability slots
   */
  static async updateAvailability(userId: string, slots: SlotInput[]): Promise<IAvailabilitySlot[]> {
    // Validate start < end
    for (const slot of slots) {
      if (slot.startTime >= slot.endTime) {
        throw AppError.badRequest(
          `Start time (${slot.startTime}) must be strictly before end time (${slot.endTime}) on day ${slot.dayOfWeek}`,
          'INVALID_TIME_SLOT'
        );
      }
    }

    const operations = slots.map((slot) => ({
      updateOne: {
        filter: { provider: userId, dayOfWeek: slot.dayOfWeek },
        update: {
          $set: {
            startTime: slot.startTime,
            endTime: slot.endTime,
            isAvailable: slot.isAvailable,
          },
        },
        upsert: true,
      },
    }));

    await AvailabilitySlot.bulkWrite(operations);
    return this.getAvailability(userId);
  }
}

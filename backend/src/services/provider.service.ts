import { ProviderServiceListing, type IProviderServiceListing } from '../models/ProviderServiceListing.js';
import { User, type IUser } from '../models/User.js';
import { Service } from '../models/Service.js';
import { AppError } from '../utils/AppError.js';
import { VALID_DHAKA_AREA_IDS } from '../constants/areas.js';

interface ProviderListingInput {
  serviceId: string;
  customPrice?: number;
  serviceAreas: string[];
  experienceYears?: number;
  isActive?: boolean;
}

export class ProviderService {
  /**
   * Add or update a service listing for an Individual Provider or Company
   */
  static async addOrUpdateListing(
    providerId: string,
    input: ProviderListingInput
  ): Promise<IProviderServiceListing> {
    const service = await Service.findById(input.serviceId);
    if (!service) {
      throw AppError.notFound('Service not found', 'SERVICE_NOT_FOUND');
    }

    // Validate that provided areas exist in Dhaka dataset
    const normalizedAreas = input.serviceAreas.map((a) => a.toLowerCase().trim());
    const invalidAreas = normalizedAreas.filter((a) => !VALID_DHAKA_AREA_IDS.includes(a));
    if (invalidAreas.length > 0) {
      throw AppError.badRequest(
        `Invalid Dhaka service area(s): ${invalidAreas.join(', ')}. Please select from valid Dhaka zones.`,
        'INVALID_SERVICE_AREA'
      );
    }

    let listing = await ProviderServiceListing.findOne({
      provider: providerId,
      service: input.serviceId,
    });

    if (listing) {
      if (input.customPrice !== undefined) listing.customPrice = input.customPrice;
      listing.serviceAreas = normalizedAreas;
      if (input.experienceYears !== undefined) listing.experienceYears = input.experienceYears;
      if (input.isActive !== undefined) listing.isActive = input.isActive;
    } else {
      listing = new ProviderServiceListing({
        provider: providerId,
        service: input.serviceId,
        customPrice: input.customPrice || service.basePrice,
        serviceAreas: normalizedAreas,
        experienceYears: input.experienceYears || 1,
        isActive: input.isActive ?? true,
      });
    }

    await listing.save();
    return listing;
  }

  /**
   * Retrieve listings owned by the logged-in provider
   */
  static async getMyListings(providerId: string): Promise<IProviderServiceListing[]> {
    return ProviderServiceListing.find({ provider: providerId })
      .populate('service', 'name slug basePrice pricingType category')
      .sort({ createdAt: -1 });
  }

  /**
   * Public discovery of providers in Dhaka
   */
  static async searchProviders(area?: string, serviceId?: string) {
    const listingQuery: Record<string, unknown> = { isActive: true };

    if (area) {
      listingQuery.serviceAreas = area.toLowerCase().trim();
    }
    if (serviceId) {
      listingQuery.service = serviceId;
    }

    const listings = await ProviderServiceListing.find(listingQuery)
      .populate({
        path: 'provider',
        select: 'name email phone role isVerified avatarUrl preferredLanguage status',
        match: { status: 'ACTIVE' },
      })
      .populate('service', 'name basePrice pricingType category');

    // Filter out any where provider population returned null due to status mismatch
    return listings.filter((l) => l.provider !== null);
  }

  /**
   * Public profile of a provider including their active service listings
   */
  static async getProviderPublicProfile(providerId: string): Promise<{
    provider: IUser;
    services: IProviderServiceListing[];
  }> {
    const provider = await User.findById(providerId).select(
      'name email phone role isVerified avatarUrl createdAt'
    );

    if (!provider || (provider.role !== 'INDIVIDUAL_PROVIDER' && provider.role !== 'COMPANY_OWNER')) {
      throw AppError.notFound('Provider not found', 'PROVIDER_NOT_FOUND');
    }

    const services = await ProviderServiceListing.find({
      provider: providerId,
      isActive: true,
    }).populate('service', 'name slug basePrice pricingType estimatedDurationMinutes');

    return { provider, services };
  }
}

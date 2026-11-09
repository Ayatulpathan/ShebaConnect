import mongoose, { type FilterQuery } from 'mongoose';
import { Service, type IService } from '../models/Service.js';
import { Category } from '../models/Category.js';
import { ProviderServiceListing } from '../models/ProviderServiceListing.js';
import { AppError } from '../utils/AppError.js';
import type { PricingType } from '../constants/statuses.js';

interface ServiceInput {
  name: { en: string; bn: string };
  slug: string;
  category: string;
  description: { en: string; bn: string };
  images?: string[];
  basePrice: number;
  pricingType: PricingType;
  estimatedDurationMinutes?: number;
  requirements?: string[];
  isActive?: boolean;
}

interface SearchFilter {
  q?: string;
  category?: string;
  area?: string;
  pricingType?: PricingType;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export class ServiceService {
  static async getServices(categoryId?: string): Promise<IService[]> {
    const query: FilterQuery<IService> = { isActive: true };
    if (categoryId) {
      if (mongoose.Types.ObjectId.isValid(categoryId)) {
        query.category = categoryId;
      } else {
        const cat = await Category.findOne({ slug: categoryId.toLowerCase() });
        if (cat) query.category = cat._id;
      }
    }

    return Service.find(query).populate('category', 'name slug icon').sort({ createdAt: -1 });
  }

  static async getServiceByIdOrSlug(idOrSlug: string): Promise<{ service: IService; activeProvidersCount: number }> {
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() };

    const service = await Service.findOne(query).populate('category', 'name slug icon');
    if (!service) {
      throw AppError.notFound('Service not found', 'SERVICE_NOT_FOUND');
    }

    const activeProvidersCount = await ProviderServiceListing.countDocuments({
      service: service._id,
      isActive: true,
    });

    return { service, activeProvidersCount };
  }

  static async searchServices(filter: SearchFilter) {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const mongoQuery: FilterQuery<IService> = { isActive: true };

    // 1. Text Query (Search in English or Bangla)
    if (filter.q) {
      const escaped = filter.q.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      mongoQuery.$or = [
        { 'name.en': regex },
        { 'name.bn': regex },
        { 'description.en': regex },
        { 'description.bn': regex },
      ];
    }

    // 2. Category Filter
    if (filter.category) {
      if (mongoose.Types.ObjectId.isValid(filter.category)) {
        mongoQuery.category = filter.category;
      } else {
        const cat = await Category.findOne({ slug: filter.category.toLowerCase() });
        if (cat) mongoQuery.category = cat._id;
      }
    }

    // 3. Pricing Type Filter
    if (filter.pricingType) {
      mongoQuery.pricingType = filter.pricingType;
    }

    // 4. Price Range (BDT)
    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      mongoQuery.basePrice = {};
      if (filter.minPrice !== undefined) mongoQuery.basePrice.$gte = filter.minPrice;
      if (filter.maxPrice !== undefined) mongoQuery.basePrice.$lte = filter.maxPrice;
    }

    // 5. Area Filter (Zero-cost local discovery: matches services offered by providers in that Dhaka area)
    if (filter.area) {
      const listingsInArea = await ProviderServiceListing.find({
        serviceAreas: filter.area.toLowerCase().trim(),
        isActive: true,
      }).select('service');

      const serviceIdsInArea = listingsInArea.map((l) => l.service);
      mongoQuery._id = { $in: serviceIdsInArea };
    }

    const [services, total] = await Promise.all([
      Service.find(mongoQuery)
        .populate('category', 'name slug icon')
        .sort({ basePrice: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Service.countDocuments(mongoQuery),
    ]);

    return {
      services,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async createService(input: ServiceInput): Promise<IService> {
    const category = await Category.findById(input.category);
    if (!category) {
      throw AppError.notFound('Referenced Category does not exist', 'CATEGORY_NOT_FOUND');
    }

    const existingSlug = await Service.findOne({ slug: input.slug.toLowerCase() });
    if (existingSlug) {
      throw AppError.conflict('Service with this slug already exists', 'SERVICE_SLUG_EXISTS');
    }

    const service = new Service({
      ...input,
      slug: input.slug.toLowerCase(),
    });

    await service.save();
    return service;
  }

  static async updateService(id: string, input: Partial<ServiceInput>): Promise<IService> {
    const service = await Service.findById(id);
    if (!service) {
      throw AppError.notFound('Service not found', 'SERVICE_NOT_FOUND');
    }

    if (input.category) {
      const category = await Category.findById(input.category);
      if (!category) throw AppError.notFound('Category not found', 'CATEGORY_NOT_FOUND');
      service.category = category._id;
    }

    if (input.slug && input.slug.toLowerCase() !== service.slug) {
      const existing = await Service.findOne({ slug: input.slug.toLowerCase(), _id: { $ne: id } });
      if (existing) throw AppError.conflict('Slug already in use', 'SERVICE_SLUG_EXISTS');
      service.slug = input.slug.toLowerCase();
    }

    if (input.name) service.name = input.name;
    if (input.description) service.description = input.description;
    if (input.basePrice !== undefined) service.basePrice = input.basePrice;
    if (input.pricingType) service.pricingType = input.pricingType;
    if (input.estimatedDurationMinutes !== undefined) service.estimatedDurationMinutes = input.estimatedDurationMinutes;
    if (input.requirements) service.requirements = input.requirements;
    if (input.images) service.images = input.images;
    if (input.isActive !== undefined) service.isActive = input.isActive;

    await service.save();
    return service;
  }

  static async deleteService(id: string): Promise<void> {
    const result = await Service.findByIdAndDelete(id);
    if (!result) {
      throw AppError.notFound('Service not found', 'SERVICE_NOT_FOUND');
    }
    // Also clean up any provider listings for this service
    await ProviderServiceListing.deleteMany({ service: id });
  }
}

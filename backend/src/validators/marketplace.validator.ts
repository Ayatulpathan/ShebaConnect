import { z } from 'zod';
import { ALL_PRICING_TYPES, type PricingType } from '../constants/statuses.js';

export const createCategorySchema = z.object({
  name: z.object({
    en: z.string().trim().min(2).max(100),
    bn: z.string().trim().min(2).max(100),
  }),
  slug: z.string().trim().min(2).max(100).toLowerCase(),
  description: z.object({
    en: z.string().trim().min(5).max(500),
    bn: z.string().trim().min(5).max(500),
  }),
  icon: z.string().trim().default('Wrench').optional(),
  order: z.number().int().default(0).optional(),
  isActive: z.boolean().default(true).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createServiceSchema = z.object({
  name: z.object({
    en: z.string().trim().min(2).max(150),
    bn: z.string().trim().min(2).max(150),
  }),
  slug: z.string().trim().min(2).max(150).toLowerCase(),
  category: z.string().trim().min(1, 'Category ID is required'),
  description: z.object({
    en: z.string().trim().min(10).max(2000),
    bn: z.string().trim().min(10).max(2000),
  }),
  images: z.array(z.string().url()).default([]).optional(),
  basePrice: z.number().min(0, 'Base price must be a positive number in BDT'),
  pricingType: z.enum(ALL_PRICING_TYPES as [PricingType, ...PricingType[]]),
  estimatedDurationMinutes: z.number().min(15).default(60).optional(),
  requirements: z.array(z.string()).default([]).optional(),
  isActive: z.boolean().default(true).optional(),
});

export const updateServiceSchema = createServiceSchema.partial();

export const searchServicesSchema = z.object({
  q: z.string().trim().optional(),
  category: z.string().trim().optional(),
  area: z.string().trim().optional(),
  pricingType: z.enum(ALL_PRICING_TYPES as [PricingType, ...PricingType[]]).optional(),
  minPrice: z
    .string()
    .transform((val) => parseFloat(val))
    .pipe(z.number().min(0))
    .optional(),
  maxPrice: z
    .string()
    .transform((val) => parseFloat(val))
    .pipe(z.number().min(0))
    .optional(),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1))
    .default('1')
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(50))
    .default('20')
    .optional(),
});

export const createProviderListingSchema = z.object({
  serviceId: z.string().trim().min(1, 'Service ID is required'),
  customPrice: z.number().min(0).optional(),
  serviceAreas: z.array(z.string().trim()).min(1, 'At least one service area is required'),
  experienceYears: z.number().min(0).max(50).default(1).optional(),
  isActive: z.boolean().default(true).optional(),
});

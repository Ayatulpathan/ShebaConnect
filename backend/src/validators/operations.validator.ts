import { z } from 'zod';

const bdPhoneRegex = /^(?:\+8801|01)[3-9]\d{8}$/;
const nidRegex = /^\d{10}$|^\d{13}$|^\d{17}$/;
const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const updateProviderProfileSchema = z.object({
  bio: z.string().trim().max(1000).optional(),
  skills: z.array(z.string().trim()).optional(),
  experienceYears: z.number().min(0).max(50).optional(),
});

export const submitVerificationSchema = z.object({
  nidNumber: z.string().trim().regex(nidRegex, 'National ID must be 10, 13, or 17 digits'),
  documents: z
    .array(
      z.object({
        docType: z.enum(['NID', 'TRADE_LICENSE', 'POLICE_CLEARANCE', 'CERTIFICATE']),
        documentNumber: z.string().trim().min(2),
        fileUrl: z.string().url().optional(),
      })
    )
    .min(1, 'At least one verification document record is required'),
});

export const availabilitySlotItemSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(timeFormatRegex, 'Start time must be in HH:mm 24h format'),
  endTime: z.string().regex(timeFormatRegex, 'End time must be in HH:mm 24h format'),
  isAvailable: z.boolean().default(true),
});

export const updateAvailabilitySchema = z.object({
  slots: z.array(availabilitySlotItemSchema).min(1).max(7),
});

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(150),
  tradeLicense: z.string().trim().min(2).max(100),
  contactPhone: z.string().trim().regex(bdPhoneRegex, 'Valid Bangladesh phone number is required'),
  contactEmail: z.string().trim().email().toLowerCase().optional(),
  address: z.string().trim().min(5).max(300),
  serviceAreas: z.array(z.string().trim()).min(1, 'At least one Dhaka service area is required'),
  description: z.string().trim().max(1000).optional(),
  logoUrl: z.string().url().optional(),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

export const addOrganizationMemberSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().toLowerCase(),
  phone: z.string().trim().regex(bdPhoneRegex, 'Valid Bangladesh phone number is required'),
  memberRole: z.enum(['STAFF', 'TECHNICIAN']),
  password: z
    .string()
    .min(8)
    .regex(
      passwordRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

export const assignTechnicianSchema = z.object({
  technicianId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Technician ID format'),
});

export const updateOrganizationMemberSchema = z.object({
  memberRole: z.enum(['STAFF', 'TECHNICIAN']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

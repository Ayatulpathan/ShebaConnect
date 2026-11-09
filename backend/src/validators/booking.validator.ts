import { z } from 'zod';
import { ALL_BOOKING_STATUSES, BookingStatus } from '../constants/statuses.js';
import { VALID_DHAKA_AREA_IDS } from '../constants/areas.js';

export const createBookingSchema = z.object({
  serviceId: z
    .string({ required_error: 'Service ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Service ID format'),
  providerId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Provider ID format')
    .optional(),
  organizationId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Organization ID format')
    .optional(),
  problemDescription: z
    .string({ required_error: 'Problem description is required' })
    .min(10, 'Problem description must be at least 10 characters')
    .max(1000, 'Problem description cannot exceed 1000 characters'),
  serviceAddress: z.object({
    area: z.enum(VALID_DHAKA_AREA_IDS as [string, ...string[]], {
      errorMap: () => ({
        message: 'Invalid Dhaka service area. Please choose from supported zones.',
      }),
    }),
    addressLine: z
      .string({ required_error: 'Address line is required' })
      .min(5, 'Address line must be at least 5 characters')
      .max(200, 'Address line cannot exceed 200 characters'),
    contactPhone: z
      .string({ required_error: 'Contact phone number is required' })
      .regex(
        /^(?:\+8801|01)[3-9]\d{8}$/,
        'Valid Bangladesh phone number is required (e.g. 01712345678)'
      ),
    contactName: z
      .string({ required_error: 'Contact name is required' })
      .min(2, 'Contact name must be at least 2 characters')
      .max(100, 'Contact name cannot exceed 100 characters'),
  }),
  scheduledDate: z
    .string({ required_error: 'Scheduled date is required' })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Scheduled date must be a valid ISO date',
    }),
  preferredTimeSlot: z
    .string({ required_error: 'Preferred time slot is required' })
    .min(3, 'Preferred time slot must be at least 3 characters'),
});

export const transitionBookingSchema = z.object({
  status: z.enum(ALL_BOOKING_STATUSES as [BookingStatus, ...BookingStatus[]], {
    errorMap: () => ({ message: 'Invalid booking status transition value' }),
  }),
  reason: z.string().max(500, 'Reason cannot exceed 500 characters').optional(),
  technicianId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Technician ID format')
    .optional(),
  quoteId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Quote ID format')
    .optional(),
  finalPrice: z.number().min(0, 'Final price cannot be negative').optional(),
});

export const createQuoteSchema = z.object({
  amount: z
    .number({ required_error: 'Quotation amount in BDT is required' })
    .min(0, 'Quotation amount must be at least 0 BDT'),
  breakdown: z
    .array(
      z.object({
        description: z.string().min(1, 'Item description is required'),
        amount: z.number().min(0, 'Item amount cannot be negative'),
      })
    )
    .optional(),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  validUntil: z
    .string({ required_error: 'Quote validity date is required' })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Valid until must be a valid ISO date',
    }),
});

export const quoteResponseSchema = z.object({
  action: z.enum(['ACCEPT', 'REJECT'], {
    errorMap: () => ({ message: "Action must be either 'ACCEPT' or 'REJECT'" }),
  }),
});

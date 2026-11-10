import { z } from 'zod';

export const createReviewSchema = z.object({
  bookingId: z
    .string({ required_error: 'Booking ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Booking ID format'),
  rating: z
    .number({ required_error: 'Overall rating is required' })
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1 star')
    .max(5, 'Rating cannot exceed 5 stars'),
  categories: z.object({
    punctuality: z.number().int().min(1).max(5).default(5),
    quality: z.number().int().min(1).max(5).default(5),
    behavior: z.number().int().min(1).max(5).default(5),
    costTransparency: z.number().int().min(1).max(5).default(5),
  }),
  comment: z
    .string({ required_error: 'Review comment is required' })
    .trim()
    .min(5, 'Comment must be at least 5 characters')
    .max(1000, 'Comment cannot exceed 1000 characters'),
});

export const replyReviewSchema = z.object({
  reply: z
    .string({ required_error: 'Reply comment is required' })
    .trim()
    .min(2, 'Reply must be at least 2 characters')
    .max(500, 'Reply cannot exceed 500 characters'),
});

export const updateReviewStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'FLAGGED', 'HIDDEN'], {
    required_error: 'Status must be ACTIVE, FLAGGED, or HIDDEN',
  }),
});

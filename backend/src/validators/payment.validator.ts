import { z } from 'zod';

export const recordCashCollectionSchema = z.object({
  amountCollected: z
    .number({ required_error: 'Amount collected is required' })
    .positive('Amount collected must be greater than zero'),
  notes: z.string().max(500).optional(),
});

export const confirmCashPaymentSchema = z.object({
  notes: z.string().max(500).optional(),
});

export const disputeCashPaymentSchema = z.object({
  reason: z
    .string({ required_error: 'Dispute reason is required' })
    .min(5, 'Dispute reason must be at least 5 characters')
    .max(500, 'Dispute reason cannot exceed 500 characters'),
});

export const recordSettlementSchema = z
  .object({
    providerId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Provider ID format')
      .optional(),
    organizationId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Organization ID format')
      .optional(),
    entryIds: z
      .array(
        z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Commission Entry ID')
      )
      .min(1, 'At least one commission entry ID is required for settlement'),
    amountSettled: z
      .number({ required_error: 'Amount settled is required' })
      .positive('Settlement amount must be greater than zero'),
    settlementMethod: z.string().max(100).optional(),
    paymentReference: z.string().max(100).optional(),
    notes: z.string().max(500).optional(),
  })
  .refine((data) => data.providerId || data.organizationId, {
    message: 'Either providerId or organizationId must be specified',
  });

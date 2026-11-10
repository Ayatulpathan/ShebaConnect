import { z } from 'zod';

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING'], {
    errorMap: () => ({ message: "Status must be 'ACTIVE', 'SUSPENDED', or 'PENDING'" }),
  }),
  reason: z.string().max(500, 'Reason must not exceed 500 characters').optional(),
});

export const reviewProviderVerificationSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED', 'PENDING_REVIEW'], {
    errorMap: () => ({ message: "Status must be 'VERIFIED', 'REJECTED', or 'PENDING_REVIEW'" }),
  }),
  notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
  rejectionReason: z.string().max(500, 'Rejection reason must not exceed 500 characters').optional(),
});

export const reviewCompanyApprovalSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'SUSPENDED', 'PENDING_APPROVAL'], {
    errorMap: () => ({
      message: "Status must be 'APPROVED', 'REJECTED', 'SUSPENDED', or 'PENDING_APPROVAL'",
    }),
  }),
  notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
});

export const resolveDisputeSchema = z.object({
  resolution: z.enum(['RESOLVE_AS_COMPLETED', 'RESOLVE_AS_CANCELLED'], {
    errorMap: () => ({
      message: "Resolution must be 'RESOLVE_AS_COMPLETED' or 'RESOLVE_AS_CANCELLED'",
    }),
  }),
  notes: z.string().min(3, 'Resolution notes must be at least 3 characters').max(1000),
  refundOrWaiveFee: z.boolean().optional(),
});

export const adminCancelBookingSchema = z.object({
  reason: z.string().min(3, 'Cancellation reason must be at least 3 characters').max(1000),
});

export const manualSettlementSchema = z.object({
  providerId: z.string().optional(),
  organizationId: z.string().optional(),
  entryIds: z.array(z.string()).min(1, 'At least one commission entry ID is required'),
  amountSettled: z.number().positive('Settlement amount must be greater than zero'),
  settlementMethod: z.string().optional(),
  paymentReference: z.string().optional(),
  notes: z.string().optional(),
});

export type UpdateUserStatusDTO = z.infer<typeof updateUserStatusSchema>;
export type ReviewProviderVerificationDTO = z.infer<typeof reviewProviderVerificationSchema>;
export type ReviewCompanyApprovalDTO = z.infer<typeof reviewCompanyApprovalSchema>;
export type ResolveDisputeDTO = z.infer<typeof resolveDisputeSchema>;
export type AdminCancelBookingDTO = z.infer<typeof adminCancelBookingSchema>;
export type ManualSettlementDTO = z.infer<typeof manualSettlementSchema>;

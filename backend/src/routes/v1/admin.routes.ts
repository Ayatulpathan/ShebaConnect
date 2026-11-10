import { Router } from 'express';
import { AdminController } from '../../controllers/admin.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/rbac.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  updateUserStatusSchema,
  reviewProviderVerificationSchema,
  reviewCompanyApprovalSchema,
  resolveDisputeSchema,
  manualSettlementSchema,
} from '../../validators/admin.validator.js';

const router = Router();

// All administrative routes require authentication
router.use(authenticate);

// 1. Platform KPIs & Operational Overview
router.get(
  '/overview',
  requireRoles('ADMIN', 'SUPPORT_AGENT'),
  AdminController.getOverview
);

// 2. User Governance
router.get(
  '/users',
  requireRoles('ADMIN', 'SUPPORT_AGENT'),
  AdminController.getUsers
);

router.patch(
  '/users/:userId/status',
  requireRoles('ADMIN'),
  validateBody(updateUserStatusSchema),
  AdminController.updateUserStatus
);

// 3. Verification & Approval Queue
router.get(
  '/verification-applications',
  requireRoles('ADMIN', 'SUPPORT_AGENT'),
  AdminController.getVerificationApplications
);

router.patch(
  '/providers/:providerId/verification',
  requireRoles('ADMIN'),
  validateBody(reviewProviderVerificationSchema),
  AdminController.reviewProviderVerification
);

router.patch(
  '/companies/:orgId/approval',
  requireRoles('ADMIN'),
  validateBody(reviewCompanyApprovalSchema),
  AdminController.reviewCompanyApproval
);

// 4. Booking Management & Dispute Resolution
router.get(
  '/bookings',
  requireRoles('ADMIN', 'SUPPORT_AGENT'),
  AdminController.getBookings
);

router.get(
  '/disputes',
  requireRoles('ADMIN', 'SUPPORT_AGENT'),
  AdminController.getDisputes
);

router.post(
  '/disputes/:bookingId/resolve',
  requireRoles('ADMIN'),
  validateBody(resolveDisputeSchema),
  AdminController.resolveDispute
);

// 5. Financial Ledger & Commission Settlements
router.get(
  '/financials',
  requireRoles('ADMIN', 'SUPPORT_AGENT'),
  AdminController.getFinancials
);

router.post(
  '/settlements',
  requireRoles('ADMIN'),
  validateBody(manualSettlementSchema),
  AdminController.recordSettlement
);

// 6. Platform Audit Trail
router.get(
  '/audit-logs',
  requireRoles('ADMIN', 'SUPPORT_AGENT'),
  AdminController.getAuditLogs
);

export default router;

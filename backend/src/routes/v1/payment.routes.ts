import { Router } from 'express';
import { PaymentController } from '../../controllers/payment.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/rbac.middleware.js';

const router = Router();

// All payment routes require authentication
router.use(authenticate);

// Provider / Company earnings summary
router.get(
  '/provider/summary',
  requireRoles('INDIVIDUAL_PROVIDER', 'COMPANY_OWNER', 'COMPANY_STAFF', 'TECHNICIAN', 'ADMIN'),
  PaymentController.getProviderSummary
);

// Admin financial management
router.post('/admin/settle', requireRoles('ADMIN'), PaymentController.recordSettlement);
router.get('/admin/report', requireRoles('ADMIN'), PaymentController.getAdminReport);

// Booking cash payment actions
router.post(
  '/bookings/:bookingId/collect',
  requireRoles('INDIVIDUAL_PROVIDER', 'COMPANY_OWNER', 'COMPANY_STAFF', 'TECHNICIAN', 'ADMIN'),
  PaymentController.recordCollection
);

router.post(
  '/bookings/:bookingId/confirm',
  requireRoles('CUSTOMER', 'ADMIN'),
  PaymentController.confirmPayment
);

router.post('/bookings/:bookingId/dispute', PaymentController.disputePayment);

router.get('/bookings/:bookingId', PaymentController.getPayment);
router.get('/bookings/:bookingId/receipt', PaymentController.getReceipt);

export const paymentRoutes = router;

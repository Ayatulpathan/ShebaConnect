import { Router } from 'express';
import { BookingController } from '../../controllers/booking.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/rbac.middleware.js';

const router = Router();

// All booking routes require authentication
router.use(authenticate);

// Bookings collection
router
  .route('/')
  .post(requireRoles('CUSTOMER', 'ADMIN'), BookingController.createBooking)
  .get(BookingController.listBookings);

// Individual Booking
router.route('/:id').get(BookingController.getBooking);

// Centralized status transition
router.route('/:id/status').patch(BookingController.transitionStatus);

// Audit history
router.route('/:id/history').get(BookingController.getBookingHistory);

// Quotation management
router
  .route('/:id/quotes')
  .post(
    requireRoles('INDIVIDUAL_PROVIDER', 'COMPANY_OWNER', 'ADMIN'),
    BookingController.createQuote
  )
  .get(BookingController.listQuotes);

router
  .route('/quotes/:quoteId/respond')
  .post(requireRoles('CUSTOMER', 'ADMIN'), BookingController.respondToQuote);

export const bookingRoutes = router;

import { Router } from 'express';
import { ReviewController } from '../../controllers/review.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/rbac.middleware.js';

const router = Router();

// Public routes for viewing reviews
router.get('/service/:serviceId', ReviewController.getReviewsByService);
router.get('/provider/:providerId', ReviewController.getReviewsByProvider);
router.get('/booking/:bookingId', ReviewController.getReviewByBooking);

// Protected routes
router.use(authenticate);

// Customer submits review
router.post('/', ReviewController.createReview);

// Provider / Company replies to review
router.post('/:reviewId/reply', ReviewController.replyToReview);

// Moderation (Admin / Support only)
router.patch(
  '/:reviewId/status',
  requireRoles('ADMIN', 'SUPPORT_AGENT'),
  ReviewController.updateReviewStatus
);

export const reviewRoutes = router;

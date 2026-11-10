import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/review.service.js';
import {
  createReviewSchema,
  replyReviewSchema,
  updateReviewStatusSchema,
} from '../validators/review.validator.js';
import { AppError } from '../utils/AppError.js';

export class ReviewController {
  /**
   * POST /api/v1/reviews
   * Customer submits review for a completed, paid booking
   */
  public static async createReview(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const validated = createReviewSchema.parse(req.body);
      const review = await ReviewService.createReview(req.user.id, validated);

      res.status(201).json({
        success: true,
        message: 'Review submitted successfully',
        data: { review },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/reviews/:reviewId/reply
   * Provider / Technician / Company Owner replies to a review
   */
  public static async replyToReview(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const reviewId = req.params.reviewId as string;
      const validated = replyReviewSchema.parse(req.body);

      const review = await ReviewService.replyToReview(
        reviewId,
        req.user.id,
        validated.reply
      );

      res.status(200).json({
        success: true,
        message: 'Reply submitted successfully',
        data: { review },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/reviews/booking/:bookingId
   * Retrieve review for a specific booking
   */
  public static async getReviewByBooking(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const bookingId = req.params.bookingId as string;
      const review = await ReviewService.getReviewByBooking(bookingId);

      res.status(200).json({
        success: true,
        data: { review },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/reviews/service/:serviceId
   * Public endpoint to list reviews for a service with breakdown summary
   */
  public static async getReviewsByService(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const serviceId = req.params.serviceId as string;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const result = await ReviewService.getReviewsByService(serviceId, page, limit);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/reviews/provider/:providerId
   * Public endpoint to list reviews for a provider
   */
  public static async getReviewsByProvider(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const providerId = req.params.providerId as string;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const result = await ReviewService.getReviewsByProvider(providerId, page, limit);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/reviews/:reviewId/status
   * Moderation endpoint for Admin / Support
   */
  public static async updateReviewStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const reviewId = req.params.reviewId as string;
      const validated = updateReviewStatusSchema.parse(req.body);

      const review = await ReviewService.updateReviewStatus(reviewId, validated.status);

      res.status(200).json({
        success: true,
        message: 'Review status updated successfully',
        data: { review },
      });
    } catch (error) {
      next(error);
    }
  }
}

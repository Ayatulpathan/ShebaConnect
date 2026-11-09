import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/booking.service.js';
import { BookingStateService } from '../services/bookingState.service.js';
import { QuoteService } from '../services/quote.service.js';
import {
  createBookingSchema,
  transitionBookingSchema,
  createQuoteSchema,
  quoteResponseSchema,
} from '../validators/booking.validator.js';
import { AppError } from '../utils/AppError.js';

export class BookingController {
  /**
   * POST /api/v1/bookings
   * Create a new booking request
   */
  public static async createBooking(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const validatedData = createBookingSchema.parse(req.body);
      const booking = await BookingService.createBooking(req.user.id, validatedData);

      res.status(201).json({
        success: true,
        message: 'Booking request created successfully',
        data: { booking },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/bookings/:id
   * Get booking details by ID
   */
  public static async getBooking(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const booking = await BookingService.getBookingById(req.params.id as string, {
        userId: req.user.id,
        role: req.user.role,
      });

      res.status(200).json({
        success: true,
        data: { booking },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/bookings
   * List bookings for current user based on role
   */
  public static async listBookings(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const { status, page, limit } = req.query;
      const result = await BookingService.listBookings(
        {
          userId: req.user.id,
          role: req.user.role,
        },
        {
          status: status as string,
          page: page ? Number(page) : undefined,
          limit: limit ? Number(limit) : undefined,
        }
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/bookings/:id/status
   * Centralized transition of booking status
   */
  public static async transitionStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const validatedData = transitionBookingSchema.parse(req.body);
      const booking = await BookingStateService.transition(
        req.params.id as string,
        validatedData.status,
        {
          userId: req.user.id,
          role: req.user.role,
        },
        {
          reason: validatedData.reason,
          technicianId: validatedData.technicianId,
          quoteId: validatedData.quoteId,
          finalPrice: validatedData.finalPrice,
        }
      );

      res.status(200).json({
        success: true,
        message: `Booking transitioned to ${validatedData.status}`,
        data: { booking },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/bookings/:id/history
   * Retrieve state transition audit trail
   */
  public static async getBookingHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const history = await BookingService.getBookingHistory(req.params.id as string, {
        userId: req.user.id,
        role: req.user.role,
      });

      res.status(200).json({
        success: true,
        data: { history },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/bookings/:id/quotes
   * Provider submits quotation
   */
  public static async createQuote(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const validatedData = createQuoteSchema.parse(req.body);
      const quote = await QuoteService.createQuote(
        req.params.id as string,
        req.user.id,
        validatedData
      );

      res.status(201).json({
        success: true,
        message: 'Quotation submitted successfully',
        data: { quote },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/bookings/:id/quotes
   * List quotes submitted for a booking
   */
  public static async listQuotes(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const quotes = await QuoteService.listQuotesForBooking(req.params.id as string, {
        userId: req.user.id,
        role: req.user.role,
      });

      res.status(200).json({
        success: true,
        data: { quotes },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/bookings/quotes/:quoteId/respond
   * Customer accepts or rejects quotation
   */
  public static async respondToQuote(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const { action } = quoteResponseSchema.parse(req.body);
      const result = await QuoteService.respondToQuote(
        req.params.quoteId as string,
        req.user.id,
        action
      );

      res.status(200).json({
        success: true,
        message: `Quotation ${action === 'ACCEPT' ? 'accepted' : 'rejected'}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

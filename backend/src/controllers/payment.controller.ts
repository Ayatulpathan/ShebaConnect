import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service.js';
import {
  recordCashCollectionSchema,
  confirmCashPaymentSchema,
  disputeCashPaymentSchema,
  recordSettlementSchema,
} from '../validators/payment.validator.js';
import { AppError } from '../utils/AppError.js';

export class PaymentController {
  /**
   * POST /api/v1/payments/bookings/:bookingId/collect
   * Provider/Technician records cash collected
   */
  public static async recordCollection(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const bookingId = req.params.bookingId as string;
      const validatedData = recordCashCollectionSchema.parse(req.body);

      const payment = await PaymentService.recordCashCollection(
        bookingId,
        { userId: req.user.id, role: req.user.role },
        validatedData
      );

      res.status(200).json({
        success: true,
        message: 'Cash collection recorded successfully',
        data: { payment },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/payments/bookings/:bookingId/confirm
   * Customer confirms cash payment handover
   */
  public static async confirmPayment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const bookingId = req.params.bookingId as string;
      const validatedData = confirmCashPaymentSchema.parse(req.body);

      const result = await PaymentService.confirmCashPayment(
        bookingId,
        { userId: req.user.id, role: req.user.role },
        validatedData
      );

      res.status(200).json({
        success: true,
        message: 'Cash payment confirmed successfully and recorded in ledger',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/payments/bookings/:bookingId/dispute
   * Dispute payment amount or handover
   */
  public static async disputePayment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const bookingId = req.params.bookingId as string;
      const validatedData = disputeCashPaymentSchema.parse(req.body);

      const payment = await PaymentService.disputeCashPayment(
        bookingId,
        { userId: req.user.id, role: req.user.role },
        validatedData.reason
      );

      res.status(200).json({
        success: true,
        message: 'Payment dispute recorded successfully',
        data: { payment },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/payments/bookings/:bookingId
   * Get payment details for a booking
   */
  public static async getPayment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const bookingId = req.params.bookingId as string;
      const result = await PaymentService.getPaymentByBooking(bookingId, {
        userId: req.user.id,
        role: req.user.role,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/payments/bookings/:bookingId/receipt
   * Get structured payment receipt for a booking
   */
  public static async getReceipt(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const bookingId = req.params.bookingId as string;
      const receipt = await PaymentService.getReceipt(bookingId, {
        userId: req.user.id,
        role: req.user.role,
      });

      res.status(200).json({
        success: true,
        data: { receipt },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/payments/provider/summary
   * Provider/Company earnings and commission due summary
   */
  public static async getProviderSummary(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const summary = await PaymentService.getProviderEarningsSummary({
        userId: req.user.id,
        role: req.user.role,
      });

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/payments/admin/settle
   * Admin records commission settlement
   */
  public static async recordSettlement(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const validatedData = recordSettlementSchema.parse(req.body);
      const result = await PaymentService.recordCommissionSettlement(
        req.user.id,
        validatedData
      );

      res.status(201).json({
        success: true,
        message: 'Commission settlement recorded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/payments/admin/report
   * Admin platform financial report
   */
  public static async getAdminReport(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const report = await PaymentService.getAdminFinancialReport();

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
}

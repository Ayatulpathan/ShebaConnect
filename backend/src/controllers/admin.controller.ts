import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service.js';
import { AppError } from '../utils/AppError.js';

export class AdminController {
  public static async getOverview(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const overview = await AdminService.getPlatformOverview();
      res.status(200).json({
        success: true,
        data: overview,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await AdminService.getUsers(req.query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateUserStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const { userId } = req.params;
      const { status, reason } = req.body;

      const user = await AdminService.updateUserStatus(
        userId as string,
        status,
        reason,
        { userId: req.user.id, role: req.user.role }
      );

      res.status(200).json({
        success: true,
        message: `User account status updated to ${status}`,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getVerificationApplications(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const applications = await AdminService.getVerificationApplications();
      res.status(200).json({
        success: true,
        data: applications,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async reviewProviderVerification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const { providerId } = req.params;
      const { status, notes, rejectionReason } = req.body;

      const profile = await AdminService.reviewProviderVerification(
        providerId as string,
        status,
        notes,
        rejectionReason,
        { userId: req.user.id, role: req.user.role }
      );

      res.status(200).json({
        success: true,
        message: `Provider verification status updated to ${status}`,
        data: { profile },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async reviewCompanyApproval(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const { orgId } = req.params;
      const { status, notes } = req.body;

      const org = await AdminService.reviewCompanyApproval(
        orgId as string,
        status,
        notes,
        { userId: req.user.id, role: req.user.role }
      );

      res.status(200).json({
        success: true,
        message: `Company registration status updated to ${status}`,
        data: { organization: org },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getBookings(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await AdminService.getAllBookings(req.query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getDisputes(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const disputes = await AdminService.getDisputes();
      res.status(200).json({
        success: true,
        data: { disputes },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async resolveDispute(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const { bookingId } = req.params;
      const { resolution, notes, refundOrWaiveFee } = req.body;

      const updatedBooking = await AdminService.resolveDispute(
        bookingId as string,
        resolution,
        notes,
        refundOrWaiveFee,
        { userId: req.user.id, role: req.user.role }
      );

      res.status(200).json({
        success: true,
        message: `Dispute resolved successfully as ${
          resolution === 'RESOLVE_AS_COMPLETED' ? 'COMPLETED' : 'CANCELLED'
        }`,
        data: { booking: updatedBooking },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getFinancials(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const financials = await AdminService.getPlatformOverview();
      res.status(200).json({
        success: true,
        data: financials.financials,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async recordSettlement(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const result = await AdminService.recordCommissionSettlement(
        { userId: req.user.id, role: req.user.role },
        req.body
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

  public static async getAuditLogs(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await AdminService.getAuditLogs(req.query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

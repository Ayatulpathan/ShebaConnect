import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service.js';
import { AppError } from '../utils/AppError.js';

export class NotificationController {
  /**
   * GET /api/v1/notifications
   * List user's notifications (paginated)
   */
  public static async listNotifications(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const isRead =
        req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await NotificationService.getUserNotifications(req.user.id, {
        isRead,
        page,
        limit,
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
   * GET /api/v1/notifications/unread-count
   * Get unread notification count
   */
  public static async getUnreadCount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const unreadCount = await NotificationService.getUnreadCount(req.user.id);

      res.status(200).json({
        success: true,
        data: { unreadCount },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/notifications/:id/read
   * Mark a single notification as read
   */
  public static async markAsRead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const notificationId = req.params.id as string;
      const notification = await NotificationService.markAsRead(
        notificationId,
        req.user.id
      );

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: { notification },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/notifications/read-all
   * Mark all unread notifications as read
   */
  public static async markAllAsRead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const result = await NotificationService.markAllAsRead(req.user.id);

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/notifications/:id
   * Delete a notification
   */
  public static async deleteNotification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const notificationId = req.params.id as string;
      await NotificationService.deleteNotification(notificationId, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

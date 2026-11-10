import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chat.service.js';
import { AppError } from '../utils/AppError.js';

export class ChatController {
  /**
   * GET /api/v1/chat/bookings/:bookingId
   * Retrieve message history for a booking
   */
  public static async getMessages(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const bookingId = req.params.bookingId as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const messages = await ChatService.getBookingMessages(
        bookingId,
        { userId: req.user.id, role: req.user.role },
        { limit }
      );

      res.status(200).json({
        success: true,
        data: { messages },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/chat/bookings/:bookingId
   * Send a chat message (HTTP fallback for WebSockets)
   */
  public static async sendMessage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const bookingId = req.params.bookingId as string;
      const { content } = req.body;

      if (!content || typeof content !== 'string') {
        throw AppError.badRequest('Message content is required', 'CONTENT_REQUIRED');
      }

      const message = await ChatService.sendMessage(
        bookingId,
        { userId: req.user.id, role: req.user.role },
        content
      );

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: { message },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/chat/bookings/:bookingId/read
   * Mark all unread messages in a booking as read
   */
  public static async markRead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
      }

      const bookingId = req.params.bookingId as string;
      const modifiedCount = await ChatService.markMessagesAsRead(
        bookingId,
        req.user.id
      );

      res.status(200).json({
        success: true,
        message: 'Messages marked as read',
        data: { modifiedCount },
      });
    } catch (error) {
      next(error);
    }
  }
}

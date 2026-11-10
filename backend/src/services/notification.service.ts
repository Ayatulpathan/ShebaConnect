import { Types } from 'mongoose';
import {
  Notification,
  INotification,
  INotificationTitle,
  INotificationMessage,
} from '../models/Notification.js';
import { NotificationType } from '../constants/statuses.js';
import { SocketService } from './socket.service.js';
import { AppError } from '../utils/AppError.js';

export interface CreateNotificationDTO {
  recipient: string;
  sender?: string;
  booking?: string;
  title: INotificationTitle;
  message: INotificationMessage;
  type: NotificationType;
  link?: string;
}

export interface NotificationFilterOptions {
  isRead?: boolean;
  page?: number;
  limit?: number;
}

export class NotificationService {
  /**
   * Creates a notification in MongoDB and pushes it in real-time via Socket.IO
   */
  public static async createNotification(
    data: CreateNotificationDTO
  ): Promise<INotification> {
    const notification = await Notification.create({
      recipient: new Types.ObjectId(data.recipient),
      sender: data.sender ? new Types.ObjectId(data.sender) : undefined,
      booking: data.booking ? new Types.ObjectId(data.booking) : undefined,
      title: data.title,
      message: data.message,
      type: data.type,
      link: data.link,
      isRead: false,
    });

    // Push real-time event to user's private socket room
    SocketService.sendNotification(notification);

    return notification;
  }

  /**
   * Retrieves paginated notifications for a user
   */
  public static async getUserNotifications(
    userId: string,
    options: NotificationFilterOptions = {}
  ): Promise<{
    notifications: INotification[];
    total: number;
    unreadCount: number;
    page: number;
    limit: number;
  }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const query: any = { recipient: new Types.ObjectId(userId) };
    if (options.isRead !== undefined) {
      query.isRead = options.isRead;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'name email phone avatarUrl')
        .populate('booking', 'bookingNumber status'),
      Notification.countDocuments(query),
      Notification.countDocuments({
        recipient: new Types.ObjectId(userId),
        isRead: false,
      }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page,
      limit,
    };
  }

  /**
   * Returns unread notification count for badge rendering
   */
  public static async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({
      recipient: new Types.ObjectId(userId),
      isRead: false,
    });
  }

  /**
   * Marks a single notification as read
   */
  public static async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<INotification> {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: new Types.ObjectId(userId),
    });

    if (!notification) {
      throw AppError.notFound('Notification not found', 'NOTIFICATION_NOT_FOUND');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return notification;
  }

  /**
   * Marks all unread notifications as read for a user
   */
  public static async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const result = await Notification.updateMany(
      {
        recipient: new Types.ObjectId(userId),
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Deletes a notification
   */
  public static async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<void> {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: new Types.ObjectId(userId),
    });

    if (!notification) {
      throw AppError.notFound('Notification not found', 'NOTIFICATION_NOT_FOUND');
    }
  }
}

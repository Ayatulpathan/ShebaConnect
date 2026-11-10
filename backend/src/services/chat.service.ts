import { Types } from 'mongoose';
import { Booking, IBooking } from '../models/Booking.js';
import { ChatMessage, IChatMessage } from '../models/ChatMessage.js';
import { Organization } from '../models/Organization.js';
import { OrganizationMember } from '../models/OrganizationMember.js';
import { SocketService } from './socket.service.js';
import { NotificationService } from './notification.service.js';
import { AppError } from '../utils/AppError.js';

export interface ParticipantCheckResult {
  isAuthorized: boolean;
  booking?: IBooking;
  partnerUserId?: string;
}

export class ChatService {
  /**
   * Validates if the user is an authorized participant of the booking chat
   */
  public static async validateBookingParticipant(
    bookingId: string,
    actor: { id?: string; userId?: string; role: string }
  ): Promise<ParticipantCheckResult> {
    const currentUserId = actor.userId || actor.id;
    if (!currentUserId) {
      return { isAuthorized: false };
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return { isAuthorized: false };
    }

    const isAdmin = actor.role === 'ADMIN' || actor.role === 'SUPPORT_AGENT';
    const isCustomer = booking.customer.toString() === currentUserId;
    const isProvider = booking.provider?.toString() === currentUserId;
    const isTechnician = booking.technician?.toString() === currentUserId;

    let isOrgMember = false;
    let orgOwnerId: string | undefined;

    if (booking.organization) {
      const org = await Organization.findById(booking.organization);
      if (org) {
        orgOwnerId = org.owner.toString();
        if (orgOwnerId === currentUserId) {
          isOrgMember = true;
        } else {
          const membership = await OrganizationMember.findOne({
            organization: booking.organization,
            user: currentUserId,
            status: 'ACTIVE',
          });
          if (membership) {
            isOrgMember = true;
          }
        }
      }
    }

    const isAuthorized =
      isAdmin || isCustomer || isProvider || isTechnician || isOrgMember;

    if (!isAuthorized) {
      return { isAuthorized: false, booking };
    }

    // Determine partner user ID to notify
    let partnerUserId: string | undefined;
    if (isCustomer) {
      partnerUserId =
        booking.provider?.toString() ||
        booking.technician?.toString() ||
        orgOwnerId;
    } else {
      partnerUserId = booking.customer.toString();
    }

    return { isAuthorized: true, booking, partnerUserId };
  }

  /**
   * Sends a chat message in a booking conversation, broadcasts via Socket.IO, and generates in-app notification
   */
  public static async sendMessage(
    bookingId: string,
    sender: { id?: string; userId?: string; role: string },
    content: string
  ): Promise<IChatMessage> {
    const currentUserId = sender.userId || sender.id;
    if (!currentUserId) {
      throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
    }

    const cleanContent = content.trim();
    if (!cleanContent) {
      throw AppError.badRequest('Message content cannot be empty', 'EMPTY_MESSAGE');
    }
    if (cleanContent.length > 1000) {
      throw AppError.badRequest(
        'Message content cannot exceed 1000 characters',
        'MESSAGE_TOO_LONG'
      );
    }

    const { isAuthorized, booking, partnerUserId } =
      await this.validateBookingParticipant(bookingId, sender);

    if (!isAuthorized || !booking) {
      throw AppError.forbidden(
        'You are not authorized to send messages for this booking',
        'FORBIDDEN_CHAT_ACCESS'
      );
    }

    const chatMessage = await ChatMessage.create({
      booking: booking._id,
      sender: new Types.ObjectId(currentUserId),
      senderRole: sender.role,
      content: cleanContent,
      readBy: [new Types.ObjectId(currentUserId)],
    });

    const populatedMessage = await ChatMessage.findById(chatMessage._id).populate(
      'sender',
      'name role phone avatarUrl'
    );

    // Broadcast to the booking chat room
    const io = SocketService.getIO();
    if (io) {
      io.to(`booking:${booking._id.toString()}`).emit(
        'new_message',
        populatedMessage || chatMessage
      );
    }

    // Generate in-app fallback notification for partner if recipient is offline or in another view
    if (partnerUserId && partnerUserId !== currentUserId) {
      await NotificationService.createNotification({
        recipient: partnerUserId,
        sender: currentUserId,
        booking: booking._id.toString(),
        type: 'NEW_CHAT_MESSAGE',
        title: {
          en: 'New Message',
          bn: 'নতুন বার্তা',
        },
        message: {
          en: `New message on booking ${booking.bookingNumber}: "${cleanContent.slice(
            0,
            60
          )}${cleanContent.length > 60 ? '...' : ''}"`,
          bn: `বুকিং ${booking.bookingNumber}-এ নতুন বার্তা: "${cleanContent.slice(
            0,
            60
          )}${cleanContent.length > 60 ? '...' : ''}"`,
        },
        link: booking._id.toString(),
      });
    }

    return populatedMessage || chatMessage;
  }

  /**
   * Retrieves message history for a booking
   */
  public static async getBookingMessages(
    bookingId: string,
    actor: { id?: string; userId?: string; role: string },
    options: { limit?: number; before?: Date } = {}
  ): Promise<IChatMessage[]> {
    const { isAuthorized, booking } = await this.validateBookingParticipant(
      bookingId,
      actor
    );

    if (!isAuthorized || !booking) {
      throw AppError.forbidden(
        'You are not authorized to view messages for this booking',
        'FORBIDDEN_CHAT_ACCESS'
      );
    }

    const limit = Math.min(100, Math.max(1, options.limit || 50));
    const query: any = { booking: booking._id };

    if (options.before) {
      query.createdAt = { $lt: options.before };
    }

    const messages = await ChatMessage.find(query)
      .sort({ createdAt: 1 })
      .limit(limit)
      .populate('sender', 'name role phone avatarUrl');

    return messages;
  }

  /**
   * Marks all messages in a booking as read by the user
   */
  public static async markMessagesAsRead(
    bookingId: string,
    userId: string
  ): Promise<number> {
    const result = await ChatMessage.updateMany(
      {
        booking: new Types.ObjectId(bookingId),
        readBy: { $ne: new Types.ObjectId(userId) },
      },
      {
        $addToSet: { readBy: new Types.ObjectId(userId) },
      }
    );

    const io = SocketService.getIO();
    if (io) {
      io.to(`booking:${bookingId}`).emit('messages_read', {
        bookingId,
        readByUserId: userId,
      });
    }

    return result.modifiedCount;
  }
}

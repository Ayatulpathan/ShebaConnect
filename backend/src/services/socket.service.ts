import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { verifyAccessToken } from '../utils/token.js';
import { INotification } from '../models/Notification.js';

export interface AuthenticatedSocketUser {
  id: string;
  role: string;
  email: string;
}

export interface CustomSocket extends Socket {
  data: {
    user: AuthenticatedSocketUser;
  };
}

export class SocketService {
  private static io: SocketIOServer | null = null;

  /**
   * Initializes Socket.IO with CORS, JWT handshake authentication, and room listeners
   */
  public static init(server: http.Server): SocketIOServer {
    if (this.io) {
      return this.io;
    }

    const io = new SocketIOServer(server, {
      cors: {
        origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 30000,
      pingInterval: 25000,
    });

    // Handshake Authentication Middleware
    io.use((socket, next) => {
      try {
        const authHeader =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization ||
          socket.handshake.query?.token;

        if (!authHeader) {
          return next(new Error('AUTH_TOKEN_MISSING'));
        }

        const token =
          typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
            ? authHeader.slice(7)
            : String(authHeader);

        const payload = verifyAccessToken(token);
        (socket as CustomSocket).data = {
          user: {
            id: payload.sub,
            role: payload.role,
            email: payload.email,
          },
        };

        next();
      } catch (err: any) {
        logger.warn({ error: err.message }, 'Socket authentication handshake rejected');
        next(new Error('AUTH_TOKEN_INVALID'));
      }
    });

    io.on('connection', async (rawSocket) => {
      const socket = rawSocket as CustomSocket;
      const user = socket.data.user;

      logger.debug(
        { socketId: socket.id, userId: user.id, role: user.role },
        'Authenticated socket client connected'
      );

      // Join user personal room for private notifications & system alerts
      const userRoom = `user:${user.id}`;
      socket.join(userRoom);

      // Dynamically import ChatService to avoid circular dependency
      const { ChatService } = await import('./chat.service.js');

      // Join booking chat room
      socket.on('join_booking_chat', async ({ bookingId }) => {
        try {
          if (!bookingId) return;
          const { isAuthorized } = await ChatService.validateBookingParticipant(
            bookingId,
            user
          );

          if (!isAuthorized) {
            socket.emit('error', {
              errorCode: 'FORBIDDEN_CHAT_ACCESS',
              message: 'You are not authorized to join this booking chat',
            });
            return;
          }

          const room = `booking:${bookingId}`;
          socket.join(room);
          socket.emit('joined_booking_chat', { bookingId, success: true });
          logger.debug({ userId: user.id, bookingId }, 'Socket joined booking chat room');
        } catch (error: any) {
          socket.emit('error', {
            errorCode: 'JOIN_CHAT_ERROR',
            message: error.message || 'Failed to join booking chat',
          });
        }
      });

      // Leave booking chat room
      socket.on('leave_booking_chat', ({ bookingId }) => {
        if (!bookingId) return;
        socket.leave(`booking:${bookingId}`);
        logger.debug({ userId: user.id, bookingId }, 'Socket left booking chat room');
      });

      // Send real-time chat message
      socket.on('send_message', async ({ bookingId, content }) => {
        try {
          if (!bookingId || !content) return;
          await ChatService.sendMessage(bookingId, user, content);
        } catch (error: any) {
          socket.emit('error', {
            errorCode: 'SEND_MESSAGE_ERROR',
            message: error.message || 'Failed to send message',
          });
        }
      });

      // Mark messages read
      socket.on('mark_messages_read', async ({ bookingId }) => {
        try {
          if (!bookingId) return;
          await ChatService.markMessagesAsRead(bookingId, user.id);
        } catch (error: any) {
          logger.error({ error, bookingId, userId: user.id }, 'Error marking messages as read');
        }
      });

      socket.on('disconnect', (reason) => {
        logger.debug({ socketId: socket.id, userId: user.id, reason }, 'Socket disconnected');
      });
    });

    this.io = io;
    return io;
  }

  public static getIO(): SocketIOServer | null {
    return this.io;
  }

  /**
   * Broadcast real-time in-app notification to a user's personal room
   */
  public static sendNotification(notification: INotification): void {
    if (!this.io) return;
    const recipientRoom = `user:${notification.recipient.toString()}`;
    this.io.to(recipientRoom).emit('new_notification', notification);
  }

  /**
   * Broadcast booking status update to booking room & participant personal rooms
   */
  public static broadcastBookingStatusUpdate(
    bookingId: string,
    status: string,
    bookingNumber: string,
    participantUserIds: string[] = []
  ): void {
    if (!this.io) return;

    const payload = {
      bookingId,
      status,
      bookingNumber,
      updatedAt: new Date(),
    };

    // Broadcast to booking room (if anyone has chat open)
    this.io.to(`booking:${bookingId}`).emit('booking_status_updated', payload);

    // Also send directly to each participant's personal room
    for (const userId of participantUserIds) {
      if (userId) {
        this.io.to(`user:${userId}`).emit('booking_status_updated', payload);
      }
    }
  }
}

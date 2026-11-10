import mongoose, { Document, Schema, Types } from 'mongoose';
import {
  ALL_NOTIFICATION_TYPES,
  NotificationType,
} from '../constants/statuses.js';

export interface INotificationTitle {
  en: string;
  bn: string;
}

export interface INotificationMessage {
  en: string;
  bn: string;
}

export interface INotification extends Document {
  recipient: Types.ObjectId;
  sender?: Types.ObjectId;
  booking?: Types.ObjectId;
  title: INotificationTitle;
  message: INotificationMessage;
  type: NotificationType;
  isRead: boolean;
  readAt?: Date;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationTitleSchema = new Schema<INotificationTitle>(
  {
    en: { type: String, required: true, trim: true },
    bn: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const NotificationMessageSchema = new Schema<INotificationMessage>(
  {
    en: { type: String, required: true, trim: true },
    bn: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const NotificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      index: true,
    },
    title: {
      type: NotificationTitleSchema,
      required: true,
    },
    message: {
      type: NotificationMessageSchema,
      required: true,
    },
    type: {
      type: String,
      enum: ALL_NOTIFICATION_TYPES,
      default: 'SYSTEM_ALERT',
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    link: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>(
  'Notification',
  NotificationSchema
);

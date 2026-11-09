import mongoose, { Document, Schema, Types } from 'mongoose';
import { ALL_BOOKING_STATUSES, BookingStatus } from '../constants/statuses.js';
import { ALL_ROLES, UserRole } from '../constants/roles.js';

export interface IBookingStatusHistory extends Document {
  booking: Types.ObjectId;
  previousStatus?: BookingStatus;
  newStatus: BookingStatus;
  changedBy: Types.ObjectId;
  actorRole: UserRole;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const BookingStatusHistorySchema = new Schema<IBookingStatusHistory>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    previousStatus: {
      type: String,
      enum: ALL_BOOKING_STATUSES,
    },
    newStatus: {
      type: String,
      enum: ALL_BOOKING_STATUSES,
      required: true,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorRole: {
      type: String,
      enum: ALL_ROLES,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

BookingStatusHistorySchema.index({ booking: 1, createdAt: -1 });

export const BookingStatusHistory = mongoose.model<IBookingStatusHistory>(
  'BookingStatusHistory',
  BookingStatusHistorySchema
);

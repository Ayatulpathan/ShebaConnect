import mongoose, { Document, Schema, Types } from 'mongoose';
import {
  ALL_BOOKING_STATUSES,
  BookingStatus,
  ALL_PRICING_TYPES,
  PricingType,
} from '../constants/statuses.js';
import { VALID_DHAKA_AREA_IDS } from '../constants/areas.js';

export interface IBookingAddress {
  area: string;
  addressLine: string;
  contactPhone: string;
  contactName: string;
}

export interface IBooking extends Document {
  bookingNumber: string;
  customer: Types.ObjectId;
  service: Types.ObjectId;
  provider?: Types.ObjectId;
  organization?: Types.ObjectId;
  technician?: Types.ObjectId;
  status: BookingStatus;
  problemDescription: string;
  serviceAddress: IBookingAddress;
  scheduledDate: Date;
  preferredTimeSlot: string;
  pricingType: PricingType;
  basePrice: number; // in BDT
  finalPrice: number; // in BDT
  acceptedQuote?: Types.ObjectId;
  isPaid: boolean;
  paymentMethod: string;
  cancellationReason?: string;
  cancelledBy?: Types.ObjectId;
  rejectionReason?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BookingAddressSchema = new Schema<IBookingAddress>(
  {
    area: {
      type: String,
      required: true,
      enum: VALID_DHAKA_AREA_IDS,
    },
    addressLine: {
      type: String,
      required: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      required: true,
      match: /^(?:\+8801|01)[3-9]\d{8}$/,
    },
    contactName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const BookingSchema = new Schema<IBooking>(
  {
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    provider: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    technician: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    status: {
      type: String,
      enum: ALL_BOOKING_STATUSES,
      default: 'REQUESTED',
      index: true,
    },
    problemDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    serviceAddress: {
      type: BookingAddressSchema,
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    preferredTimeSlot: {
      type: String,
      required: true,
      trim: true,
    },
    pricingType: {
      type: String,
      enum: ALL_PRICING_TYPES,
      required: true,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    finalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    acceptedQuote: {
      type: Schema.Types.ObjectId,
      ref: 'Quote',
    },
    isPaid: {
      type: Boolean,
      default: false,
      index: true,
    },
    paymentMethod: {
      type: String,
      default: 'CASH_AFTER_SERVICE',
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    completedAt: {
      type: Date,
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

BookingSchema.index({ customer: 1, status: 1 });
BookingSchema.index({ provider: 1, status: 1 });
BookingSchema.index({ technician: 1, status: 1 });
BookingSchema.index({ organization: 1, status: 1 });

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);

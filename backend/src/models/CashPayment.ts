import mongoose, { Document, Schema, Types } from 'mongoose';
import {
  ALL_PAYMENT_STATUSES,
  PaymentStatus,
} from '../constants/statuses.js';

export interface ICashPayment extends Document {
  booking: Types.ObjectId;
  receiptNumber: string;
  customer: Types.ObjectId;
  provider: Types.ObjectId;
  organization?: Types.ObjectId;
  amountExpected: number; // in BDT
  amountCollected: number; // in BDT
  status: PaymentStatus;
  collectedAt?: Date;
  confirmedAt?: Date;
  paymentMethod: string;
  notes?: string;
  disputeReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CashPaymentSchema = new Schema<ICashPayment>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
      index: true,
    },
    receiptNumber: {
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
    provider: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    amountExpected: {
      type: Number,
      required: true,
      min: 0,
    },
    amountCollected: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ALL_PAYMENT_STATUSES,
      default: 'PENDING',
      index: true,
    },
    collectedAt: {
      type: Date,
    },
    confirmedAt: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      default: 'CASH_AFTER_SERVICE',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    disputeReason: {
      type: String,
      trim: true,
      maxlength: 500,
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

CashPaymentSchema.index({ customer: 1, status: 1 });
CashPaymentSchema.index({ provider: 1, status: 1 });
CashPaymentSchema.index({ organization: 1, status: 1 });

export const CashPayment = mongoose.model<ICashPayment>('CashPayment', CashPaymentSchema);

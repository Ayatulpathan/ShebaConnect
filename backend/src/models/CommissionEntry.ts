import mongoose, { Document, Schema, Types } from 'mongoose';
import {
  ALL_COMMISSION_STATUSES,
  CommissionStatus,
  DEFAULT_COMMISSION_RATE,
} from '../constants/statuses.js';

export interface ICommissionEntry extends Document {
  booking: Types.ObjectId;
  payment: Types.ObjectId;
  provider: Types.ObjectId;
  organization?: Types.ObjectId;
  totalAmount: number; // in BDT
  commissionRate: number; // e.g. 0.10 (10%)
  commissionAmount: number; // in BDT (platform share)
  providerEarnings: number; // in BDT (provider net share)
  status: CommissionStatus;
  settlement?: Types.ObjectId;
  settledAt?: Date;
  waivedAt?: Date;
  waiverReason?: string;
  waivedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CommissionEntrySchema = new Schema<ICommissionEntry>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
      index: true,
    },
    payment: {
      type: Schema.Types.ObjectId,
      ref: 'CashPayment',
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
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionRate: {
      type: Number,
      required: true,
      default: DEFAULT_COMMISSION_RATE,
      min: 0,
      max: 1,
    },
    commissionAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    providerEarnings: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ALL_COMMISSION_STATUSES,
      default: 'PENDING_SETTLEMENT',
      index: true,
    },
    settlement: {
      type: Schema.Types.ObjectId,
      ref: 'CommissionSettlement',
    },
    settledAt: {
      type: Date,
    },
    waivedAt: {
      type: Date,
    },
    waiverReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    waivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

CommissionEntrySchema.index({ provider: 1, status: 1 });
CommissionEntrySchema.index({ organization: 1, status: 1 });

export const CommissionEntry = mongoose.model<ICommissionEntry>(
  'CommissionEntry',
  CommissionEntrySchema
);

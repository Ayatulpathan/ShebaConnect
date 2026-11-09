import mongoose, { Document, Schema, Types } from 'mongoose';
import { ALL_QUOTE_STATUSES, QuoteStatus } from '../constants/statuses.js';

export interface IQuoteItem {
  description: string;
  amount: number;
}

export interface IQuote extends Document {
  booking: Types.ObjectId;
  provider: Types.ObjectId;
  organization?: Types.ObjectId;
  amount: number; // in BDT
  breakdown: IQuoteItem[];
  notes?: string;
  validUntil: Date;
  status: QuoteStatus;
  createdAt: Date;
  updatedAt: Date;
}

const QuoteItemSchema = new Schema<IQuoteItem>(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const QuoteSchema = new Schema<IQuote>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
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
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    breakdown: {
      type: [QuoteItemSchema],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ALL_QUOTE_STATUSES,
      default: 'PENDING',
      index: true,
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

QuoteSchema.index({ booking: 1, provider: 1 });

export const Quote = mongoose.model<IQuote>('Quote', QuoteSchema);

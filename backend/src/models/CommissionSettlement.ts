import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICommissionSettlement extends Document {
  settlementNumber: string;
  provider?: Types.ObjectId;
  organization?: Types.ObjectId;
  amountSettled: number; // in BDT
  entriesSettled: Types.ObjectId[];
  settlementMethod: string;
  paymentReference?: string;
  recordedBy: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommissionSettlementSchema = new Schema<ICommissionSettlement>(
  {
    settlementNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
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
    amountSettled: {
      type: Number,
      required: true,
      min: 0,
    },
    entriesSettled: [
      {
        type: Schema.Types.ObjectId,
        ref: 'CommissionEntry',
      },
    ],
    settlementMethod: {
      type: String,
      default: 'MANUAL_CASH_OR_OFFLINE',
    },
    paymentReference: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
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

CommissionSettlementSchema.index({ provider: 1, createdAt: -1 });
CommissionSettlementSchema.index({ organization: 1, createdAt: -1 });

export const CommissionSettlement = mongoose.model<ICommissionSettlement>(
  'CommissionSettlement',
  CommissionSettlementSchema
);

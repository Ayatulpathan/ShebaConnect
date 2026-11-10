import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IAuditLog extends Document {
  actor: mongoose.Types.ObjectId;
  actorRole: string;
  action: string;
  targetType: 'USER' | 'PROVIDER' | 'COMPANY' | 'BOOKING' | 'COMMISSION' | 'CATEGORY' | 'SERVICE';
  targetId: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorRole: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['USER', 'PROVIDER', 'COMPANY', 'BOOKING', 'COMMISSION', 'CATEGORY', 'SERVICE'],
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

AuditLogSchema.index({ targetType: 1, targetId: 1 });
AuditLogSchema.index({ createdAt: -1 });

export const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

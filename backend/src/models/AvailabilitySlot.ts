import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IAvailabilitySlot extends Document {
  _id: mongoose.Types.ObjectId;
  provider: mongoose.Types.ObjectId;
  dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
  startTime: string; // HH:mm (24-hour format)
  endTime: string;   // HH:mm (24-hour format)
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AvailabilitySlotSchema = new Schema<IAvailabilitySlot>(
  {
    provider: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:mm 24-hour format'],
      default: '09:00',
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:mm 24-hour format'],
      default: '18:00',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// One slot configuration per provider per day of week
AvailabilitySlotSchema.index({ provider: 1, dayOfWeek: 1 }, { unique: true });

export const AvailabilitySlot: Model<IAvailabilitySlot> = mongoose.model<IAvailabilitySlot>(
  'AvailabilitySlot',
  AvailabilitySlotSchema
);

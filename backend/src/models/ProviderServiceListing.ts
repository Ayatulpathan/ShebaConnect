import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IProviderServiceListing extends Document {
  _id: mongoose.Types.ObjectId;
  provider: mongoose.Types.ObjectId;
  service: mongoose.Types.ObjectId;
  customPrice?: number;
  serviceAreas: string[];
  experienceYears: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProviderServiceListingSchema = new Schema<IProviderServiceListing>(
  {
    provider: {
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
    customPrice: {
      type: Number,
      min: 0,
    },
    serviceAreas: {
      type: [String],
      required: true,
      index: true,
    },
    experienceYears: {
      type: Number,
      default: 1,
      min: 0,
      max: 50,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate listing for same provider and service
ProviderServiceListingSchema.index({ provider: 1, service: 1 }, { unique: true });

export const ProviderServiceListing: Model<IProviderServiceListing> =
  mongoose.model<IProviderServiceListing>('ProviderServiceListing', ProviderServiceListingSchema);

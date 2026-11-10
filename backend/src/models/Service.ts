import mongoose, { Schema, type Document, type Model } from 'mongoose';
import { ALL_PRICING_TYPES, type PricingType } from '../constants/statuses.js';

export interface IService extends Document {
  _id: mongoose.Types.ObjectId;
  name: {
    en: string;
    bn: string;
  };
  slug: string;
  category: mongoose.Types.ObjectId;
  description: {
    en: string;
    bn: string;
  };
  images: string[];
  basePrice: number; // Stored as numeric value in BDT (৳)
  pricingType: PricingType;
  estimatedDurationMinutes: number;
  requirements: string[];
  isActive: boolean;
  ratingAverage: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    name: {
      en: {
        type: String,
        required: [true, 'English service name is required'],
        trim: true,
        maxlength: 150,
      },
      bn: {
        type: String,
        required: [true, 'Bangla service name is required'],
        trim: true,
        maxlength: 150,
      },
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference is required'],
      index: true,
    },
    description: {
      en: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000,
      },
      bn: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000,
      },
    },
    images: {
      type: [String],
      default: [],
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price in BDT is required'],
      min: [0, 'Base price cannot be negative'],
      index: true,
    },
    pricingType: {
      type: String,
      enum: ALL_PRICING_TYPES,
      default: 'STARTING_PRICE',
      index: true,
    },
    estimatedDurationMinutes: {
      type: Number,
      default: 60,
      min: 15,
    },
    requirements: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      index: true,
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete (ret as Record<string, unknown>).__v;
        return ret;
      },
    },
  }
);

// Compound text index for fast search queries
ServiceSchema.index(
  {
    'name.en': 'text',
    'name.bn': 'text',
    'description.en': 'text',
    'description.bn': 'text',
  },
  {
    weights: {
      'name.en': 10,
      'name.bn': 10,
      'description.en': 2,
      'description.bn': 2,
    },
  }
);

export const Service: Model<IService> = mongoose.model<IService>('Service', ServiceSchema);

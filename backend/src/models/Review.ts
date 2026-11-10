import mongoose, { Document, Schema, Types } from 'mongoose';

export type ReviewStatus = 'ACTIVE' | 'FLAGGED' | 'HIDDEN';

export interface IReviewCategories {
  punctuality: number; // 1-5
  quality: number; // 1-5
  behavior: number; // 1-5
  costTransparency: number; // 1-5
}

export interface IReview extends Document {
  booking: Types.ObjectId;
  customer: Types.ObjectId;
  provider?: Types.ObjectId;
  organization?: Types.ObjectId;
  technician?: Types.ObjectId;
  service: Types.ObjectId;
  rating: number; // 1-5
  categories: IReviewCategories;
  comment: string;
  providerReply?: string;
  repliedAt?: Date;
  repliedBy?: Types.ObjectId;
  isPublic: boolean;
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewCategorySchema = new Schema<IReviewCategories>(
  {
    punctuality: { type: Number, required: true, min: 1, max: 5 },
    quality: { type: Number, required: true, min: 1, max: 5 },
    behavior: { type: Number, required: true, min: 1, max: 5 },
    costTransparency: { type: Number, required: true, min: 1, max: 5 },
  },
  { _id: false }
);

const ReviewSchema = new Schema<IReview>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
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
    service: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      index: true,
    },
    categories: {
      type: ReviewCategorySchema,
      required: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 1000,
    },
    providerReply: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    repliedAt: {
      type: Date,
    },
    repliedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isPublic: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'FLAGGED', 'HIDDEN'],
      default: 'ACTIVE',
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

ReviewSchema.index({ service: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ provider: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ organization: 1, status: 1, createdAt: -1 });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);

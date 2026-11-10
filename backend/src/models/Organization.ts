import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type OrganizationApprovalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface IOrganization extends Document {
  _id: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  name: string;
  tradeLicense: string;
  contactPhone: string;
  contactEmail?: string;
  address: string;
  serviceAreas: string[];
  approvalStatus: OrganizationApprovalStatus;
  isVerified: boolean;
  logoUrl?: string;
  description?: string;
  ratingAverage: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    tradeLicense: {
      type: String,
      required: [true, 'Trade license or registration number is required'],
      trim: true,
      maxlength: 100,
    },
    contactPhone: {
      type: String,
      required: [true, 'Company contact phone is required'],
      trim: true,
      match: [
        /^(?:\+8801|01)[3-9]\d{8}$/,
        'Please enter a valid Bangladesh contact phone number',
      ],
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      required: [true, 'Business operating address is required'],
      trim: true,
      maxlength: 300,
    },
    serviceAreas: {
      type: [String],
      required: true,
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED'],
      default: 'PENDING_APPROVAL',
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    logoUrl: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Organization: Model<IOrganization> = mongoose.model<IOrganization>(
  'Organization',
  OrganizationSchema
);

import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type VerificationStatus = 'UNVERIFIED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';

export interface IVerificationDocument {
  docType: 'NID' | 'TRADE_LICENSE' | 'POLICE_CLEARANCE' | 'CERTIFICATE';
  documentNumber: string;
  fileUrl?: string;
  submittedAt: Date;
}

export interface IProviderProfile extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  bio?: string;
  skills: string[];
  experienceYears: number;
  nidNumber?: string;
  verificationStatus: VerificationStatus;
  verificationDocuments: IVerificationDocument[];
  verificationNotes?: string;
  rejectionReason?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationDocumentSchema = new Schema<IVerificationDocument>(
  {
    docType: {
      type: String,
      enum: ['NID', 'TRADE_LICENSE', 'POLICE_CLEARANCE', 'CERTIFICATE'],
      required: true,
    },
    documentNumber: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ProviderProfileSchema = new Schema<IProviderProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    skills: {
      type: [String],
      default: [],
    },
    experienceYears: {
      type: Number,
      default: 1,
      min: 0,
      max: 50,
    },
    nidNumber: {
      type: String,
      trim: true,
      match: [/^\d{10}$|^\d{13}$|^\d{17}$/, 'National ID must be 10, 13, or 17 digits'],
    },
    verificationStatus: {
      type: String,
      enum: ['UNVERIFIED', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED'],
      default: 'UNVERIFIED',
      index: true,
    },
    verificationDocuments: [VerificationDocumentSchema],
    verificationNotes: {
      type: String,
      trim: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const ProviderProfile: Model<IProviderProfile> = mongoose.model<IProviderProfile>(
  'ProviderProfile',
  ProviderProfileSchema
);

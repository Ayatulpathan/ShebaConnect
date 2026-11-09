import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type OrganizationMemberRole = 'STAFF' | 'TECHNICIAN';

export interface IOrganizationMember extends Document {
  _id: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  memberRole: OrganizationMemberRole;
  status: 'ACTIVE' | 'INACTIVE';
  assignedJobsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationMemberSchema = new Schema<IOrganizationMember>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    memberRole: {
      type: String,
      enum: ['STAFF', 'TECHNICIAN'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },
    assignedJobsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// A user can only have one active membership role per organization
OrganizationMemberSchema.index({ organization: 1, user: 1 }, { unique: true });

export const OrganizationMember: Model<IOrganizationMember> = mongoose.model<IOrganizationMember>(
  'OrganizationMember',
  OrganizationMemberSchema
);

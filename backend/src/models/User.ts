import mongoose, { Schema, type Document, type Model } from 'mongoose';
import { USER_ROLES, type UserRole, ALL_ROLES } from '../constants/roles.js';

export interface IUserAddress {
  _id: mongoose.Types.ObjectId;
  label: string;
  area: string;
  addressLine: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  googleId?: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  isVerified: boolean;
  preferredLanguage: 'bn' | 'en';
  avatarUrl?: string;
  addresses: IUserAddress[];
  refreshTokens?: string[];
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IUserAddress>(
  {
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      default: 'Home',
    },
    area: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    addressLine: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
      index: true,
    },
    phone: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      trim: true,
      match: [
        /^(?:\+8801|01)[3-9]\d{8}$/,
        'Please enter a valid Bangladesh phone number (e.g. 017XXXXXXXX or +88017XXXXXXXX)',
      ],
      index: true,
    },
    password: {
      type: String,
      required: false,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password hash in queries by default
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    role: {
      type: String,
      enum: ALL_ROLES,
      default: USER_ROLES.CUSTOMER,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'PENDING'],
      default: 'ACTIVE',
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    preferredLanguage: {
      type: String,
      enum: ['bn', 'en'],
      default: 'bn',
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    addresses: [AddressSchema],
    refreshTokens: {
      type: [String],
      default: [],
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        const output = ret as Record<string, unknown>;
        delete output.password;
        delete output.refreshTokens;
        delete output.passwordResetToken;
        delete output.passwordResetExpires;
        delete output.__v;
        return output;
      },
    },
  }
);

export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

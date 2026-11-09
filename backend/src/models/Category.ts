import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  name: {
    en: string;
    bn: string;
  };
  slug: string;
  description: {
    en: string;
    bn: string;
  };
  icon: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      en: {
        type: String,
        required: [true, 'English category name is required'],
        trim: true,
        maxlength: 100,
      },
      bn: {
        type: String,
        required: [true, 'Bangla category name is required'],
        trim: true,
        maxlength: 100,
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
    description: {
      en: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
      },
      bn: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
      },
    },
    icon: {
      type: String,
      default: 'Wrench',
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

export const Category: Model<ICategory> = mongoose.model<ICategory>('Category', CategorySchema);

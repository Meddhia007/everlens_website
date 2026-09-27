import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWorkCategory extends Document {
  name: string;
  slug: string;
  description?: string;
  order: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WorkCategorySchema = new Schema<IWorkCategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      trim: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const WorkCategory: Model<IWorkCategory> =
  mongoose.models.WorkCategory || mongoose.model<IWorkCategory>('WorkCategory', WorkCategorySchema);

export default WorkCategory;

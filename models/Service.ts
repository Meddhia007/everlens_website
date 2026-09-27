import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IService extends Document {
  title: string;
  subtitle?: string;
  badge?: string;
  price?: string;
  description?: string;
  features: string[];
  options: string[];
  icon: string; // 'Camera' | 'Film' | 'Video' | 'Gem' | 'Crown' | 'Sparkles' | 'BookOpen' etc.
  order: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    title: {
      type: String,
      required: [true, 'Pack title is required'],
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
      trim: true,
    },
    badge: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: String,
      default: 'Tarifs sur demande',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    features: {
      type: [String],
      default: [],
    },
    options: {
      type: [String],
      default: [],
    },
    icon: {
      type: String,
      default: 'Camera',
      trim: true,
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

export const Service: Model<IService> =
  mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema);

export default Service;

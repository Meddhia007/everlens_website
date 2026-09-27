import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPortfolioMedia {
  url: string;
  type: 'photo' | 'video';
  caption?: string;
  aspectRatio?: string;
}

export interface IPortfolioPost extends Document {
  title: string;
  slug: string;
  location: string;
  year?: string;
  category: string; // 'photography' | 'film' | 'traditional' or custom
  coverImage: string;
  videoUrl?: string;
  media: IPortfolioMedia[];
  featured: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioMediaSchema = new Schema<IPortfolioMedia>(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ['photo', 'video'], default: 'photo' },
    caption: { type: String, default: '' },
    aspectRatio: { type: String, default: '4/5' },
  },
  { _id: false }
);

const PortfolioPostSchema = new Schema<IPortfolioPost>(
  {
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    location: {
      type: String,
      default: 'Tunisia',
      trim: true,
    },
    year: {
      type: String,
      default: '2024',
      trim: true,
    },
    category: {
      type: String,
      required: true,
      default: 'photography',
      index: true,
      trim: true,
    },
    coverImage: {
      type: String,
      required: [true, 'Cover image is required'],
    },
    videoUrl: {
      type: String,
      default: '',
    },
    media: {
      type: [PortfolioMediaSchema],
      default: [],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const PortfolioPost: Model<IPortfolioPost> =
  mongoose.models.PortfolioPost ||
  mongoose.model<IPortfolioPost>('PortfolioPost', PortfolioPostSchema);

export default PortfolioPost;

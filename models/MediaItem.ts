import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type MediaType = 'photo' | 'video';
export type MediaCategory =
  | 'photography'
  | 'films'
  | 'traditional'
  | 'editorial'
  | 'getting-ready'
  | 'ceremony'
  | 'couples-portraits'
  | 'reception'
  | string;

export interface IMediaItem extends Document {
  galleryId: Types.ObjectId;
  originalFilename: string;
  r2Key: string;
  type: MediaType;
  category: MediaCategory;
  isPublicPortfolio: boolean;
  isPrintSelected: boolean;
  printNote?: string;
  title?: string;
  location?: string;
  year?: string;
  order?: number;
  createdAt: Date;
  updatedAt: Date;
}

const MediaItemSchema = new Schema<IMediaItem>(
  {
    galleryId: {
      type: Schema.Types.ObjectId,
      ref: 'Gallery',
      required: [true, 'Gallery ID is required'],
      index: true,
    },
    originalFilename: {
      type: String,
      required: [true, 'Original filename is required'],
      trim: true,
    },
    r2Key: {
      type: String,
      required: [true, 'R2 key is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['photo', 'video'],
      required: [true, 'Media type is required'],
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      default: 'photography',
      index: true,
    },
    isPublicPortfolio: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPrintSelected: {
      type: Boolean,
      default: false,
    },
    printNote: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    year: {
      type: String,
      trim: true,
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

export const MediaItem: Model<IMediaItem> =
  mongoose.models.MediaItem || mongoose.model<IMediaItem>('MediaItem', MediaItemSchema);

export default MediaItem;

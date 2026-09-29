import mongoose, { Schema, Document, Model } from 'mongoose';

export type GalleryStatus = 'draft' | 'active' | 'archived';

export type ProductionStage =
  | 'files_uploaded'
  | 'editing_photos'
  | 'photos_ready'
  | 'editing_film'
  | 'film_ready'
  | 'album_production'
  | 'delivered';

export interface IStageHistoryItem {
  stage: ProductionStage;
  reachedAt: Date;
}

export interface IGallery extends Document {
  coupleNames: string;
  weddingDate: Date;
  clientEmail: string;
  passwordHash: string;
  status: GalleryStatus;
  photoLimit: number;
  productionStage: ProductionStage;
  stageHistory: IStageHistoryItem[];
  expirationDate?: Date;
  guestPin?: string;
  guestLinkToken?: string;
  expirationNotice7DaysSentAt?: Date;
  expirationNotice1DaySentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GallerySchema = new Schema<IGallery>(
  {
    coupleNames: {
      type: String,
      required: [true, 'Couple names are required'],
      trim: true,
    },
    weddingDate: {
      type: Date,
      required: [true, 'Wedding date is required'],
    },
    clientEmail: {
      type: String,
      required: [true, 'Client email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'draft',
      index: true,
    },
    photoLimit: {
      type: Number,
      default: 50,
      min: 1,
    },
    productionStage: {
      type: String,
      enum: [
        'files_uploaded',
        'editing_photos',
        'photos_ready',
        'editing_film',
        'film_ready',
        'album_production',
        'delivered',
      ],
      default: 'files_uploaded',
      index: true,
    },
    stageHistory: [
      {
        stage: {
          type: String,
          required: true,
        },
        reachedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    expirationDate: {
      type: Date,
    },
    expirationNotice7DaysSentAt: {
      type: Date,
    },
    expirationNotice1DaySentAt: {
      type: Date,
    },
    guestPin: {
      type: String,
      trim: true,
    },
    guestLinkToken: {
      type: String,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Gallery: Model<IGallery> =
  mongoose.models.Gallery || mongoose.model<IGallery>('Gallery', GallerySchema);

export default Gallery;

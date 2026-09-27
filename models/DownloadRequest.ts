import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type DownloadStatus = 'queued' | 'processing' | 'ready' | 'expired' | 'failed';

export interface IDownloadRequest extends Document {
  galleryId: Types.ObjectId;
  clientEmail: string;
  coupleNames: string;
  status: DownloadStatus;
  r2Key?: string;
  downloadUrl?: string;
  expiresAt?: Date;
  itemCount: number;
  totalBytes: number;
  errorMessage?: string;
  requestedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DownloadRequestSchema = new Schema<IDownloadRequest>(
  {
    galleryId: {
      type: Schema.Types.ObjectId,
      ref: 'Gallery',
      required: [true, 'Gallery ID is required'],
      index: true,
    },
    clientEmail: {
      type: String,
      required: [true, 'Client email is required'],
      trim: true,
      lowercase: true,
    },
    coupleNames: {
      type: String,
      required: [true, 'Couple names are required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['queued', 'processing', 'ready', 'expired', 'failed'],
      default: 'queued',
      index: true,
    },
    r2Key: {
      type: String,
      trim: true,
    },
    downloadUrl: {
      type: String,
      trim: true,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    itemCount: {
      type: Number,
      default: 0,
    },
    totalBytes: {
      type: Number,
      default: 0,
    },
    errorMessage: {
      type: String,
      trim: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const DownloadRequest: Model<IDownloadRequest> =
  mongoose.models.DownloadRequest ||
  mongoose.model<IDownloadRequest>('DownloadRequest', DownloadRequestSchema);

export default DownloadRequest;

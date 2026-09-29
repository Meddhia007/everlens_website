import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type PhotoCommentStatus = 'open' | 'resolved';

export interface IPhotoComment extends Document {
  mediaItemId: Types.ObjectId;
  galleryId: Types.ObjectId;
  commentText: string;
  submittedAt: Date;
  status: PhotoCommentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const PhotoCommentSchema = new Schema<IPhotoComment>(
  {
    mediaItemId: {
      type: Schema.Types.ObjectId,
      ref: 'MediaItem',
      required: [true, 'Media item ID is required'],
      index: true,
    },
    galleryId: {
      type: Schema.Types.ObjectId,
      ref: 'Gallery',
      required: [true, 'Gallery ID is required'],
      index: true,
    },
    commentText: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'resolved'],
      default: 'open',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find open comments ordered by date
PhotoCommentSchema.index({ status: 1, submittedAt: -1 });

export const PhotoComment: Model<IPhotoComment> =
  mongoose.models.PhotoComment ||
  mongoose.model<IPhotoComment>('PhotoComment', PhotoCommentSchema);

export default PhotoComment;

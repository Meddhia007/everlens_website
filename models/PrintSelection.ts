import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPrintSelection extends Document {
  galleryId: Types.ObjectId;
  mediaItemIds: Types.ObjectId[];
  submittedAt?: Date;
  locked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PrintSelectionSchema = new Schema<IPrintSelection>(
  {
    galleryId: {
      type: Schema.Types.ObjectId,
      ref: 'Gallery',
      required: [true, 'Gallery ID is required'],
      unique: true,
      index: true,
    },
    mediaItemIds: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'MediaItem',
        },
      ],
      default: [],
    },
    submittedAt: {
      type: Date,
    },
    locked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to guarantee server-side enforcement of maximum selections based on Gallery's photoLimit
PrintSelectionSchema.pre('save', async function (next) {
  try {
    if (this.mediaItemIds && this.mediaItemIds.length > 0) {
      const Gallery = mongoose.models.Gallery || (await import('./Gallery')).default;
      const gallery = await Gallery.findById(this.galleryId).select('photoLimit');
      const limit = gallery?.photoLimit || 50;
      if (this.mediaItemIds.length > limit) {
        return next(
          new Error(`Server validation error: Maximum ${limit} items allowed in print selection.`)
        );
      }
    }
    next();
  } catch (err: any) {
    next(err);
  }
});

export const PrintSelection: Model<IPrintSelection> =
  mongoose.models.PrintSelection ||
  mongoose.model<IPrintSelection>('PrintSelection', PrintSelectionSchema);

export default PrintSelection;

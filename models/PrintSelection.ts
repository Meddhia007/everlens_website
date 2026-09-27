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
      validate: {
        validator: function (val: Types.ObjectId[]) {
          return val.length <= 50;
        },
        message: 'Print selection cannot exceed 50 items.',
      },
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

// Pre-save hook to guarantee server-side enforcement of maximum 50 selections
PrintSelectionSchema.pre('save', function (next) {
  if (this.mediaItemIds && this.mediaItemIds.length > 50) {
    return next(new Error('Server validation error: Maximum 50 items allowed in print selection.'));
  }
  next();
});

export const PrintSelection: Model<IPrintSelection> =
  mongoose.models.PrintSelection ||
  mongoose.model<IPrintSelection>('PrintSelection', PrintSelectionSchema);

export default PrintSelection;

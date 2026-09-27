import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGuestRateLimit extends Document {
  key: string;
  attempts: number;
  lockedUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const GuestRateLimitSchema = new Schema<IGuestRateLimit>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 900, // 15 minutes TTL in MongoDB
    },
  },
  {
    timestamps: true,
  }
);

export const GuestRateLimit: Model<IGuestRateLimit> =
  mongoose.models.GuestRateLimit ||
  mongoose.model<IGuestRateLimit>('GuestRateLimit', GuestRateLimitSchema);

export default GuestRateLimit;

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuthRateLimit extends Document {
  key: string;
  attempts: number;
  lockedUntil?: Date | null;
  expireAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AuthRateLimitSchema = new Schema<IAuthRateLimit>(
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
    expireAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Automatically purged by MongoDB TTL when expireAt passes
    },
  },
  {
    timestamps: true,
  }
);

export const AuthRateLimit: Model<IAuthRateLimit> =
  mongoose.models.AuthRateLimit ||
  mongoose.model<IAuthRateLimit>('AuthRateLimit', AuthRateLimitSchema);

export default AuthRateLimit;

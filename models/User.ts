import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'admin' | 'client';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  clientDetails?: {
    partner1Name?: string;
    partner2Name?: string;
    weddingDate?: Date;
    venue?: string;
    gallerySlug?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'client'],
      default: 'client',
      required: true,
      index: true,
    },
    clientDetails: {
      partner1Name: { type: String, trim: true },
      partner2Name: { type: String, trim: true },
      weddingDate: { type: Date },
      venue: { type: String, trim: true },
      gallerySlug: { type: String, trim: true, index: true },
    },
  },
  {
    timestamps: true,
  }
);

// Prevent mongoose from recreating the model on hot-reload in Next.js
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

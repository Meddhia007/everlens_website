import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAdminUser extends Document {
  email: string;
  passwordHash: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    email: {
      type: String,
      required: [true, 'Admin email is required'],
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
      trim: true,
      default: 'Studio Admin',
    },
  },
  {
    timestamps: true,
  }
);

export const AdminUser: Model<IAdminUser> =
  mongoose.models.AdminUser ||
  mongoose.model<IAdminUser>('AdminUser', AdminUserSchema);

export default AdminUser;

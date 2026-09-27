import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInquiry extends Document {
  coupleNames: string;
  email: string;
  phone?: string;
  eventDate?: string;
  venue?: string;
  packageInterest?: string;
  mediaType?: string;
  guestCount?: string;
  notes?: string;
  isRead: boolean;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InquirySchema = new Schema<IInquiry>(
  {
    coupleNames: {
      type: String,
      required: [true, 'Couple names are required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    eventDate: {
      type: String,
      trim: true,
    },
    venue: {
      type: String,
      trim: true,
    },
    packageInterest: {
      type: String,
      trim: true,
    },
    mediaType: {
      type: String,
      trim: true,
    },
    guestCount: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Inquiry: Model<IInquiry> =
  mongoose.models.Inquiry || mongoose.model<IInquiry>('Inquiry', InquirySchema);

export default Inquiry;

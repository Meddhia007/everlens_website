import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEquipmentSpec {
  label: string;
  value: string;
}

export interface IEquipment extends Document {
  name: string;
  category: string; // 'cameras' | 'lenses' | 'aerial' or custom
  role: string;
  badge: string;
  icon: string; // 'Video' | 'Camera' | 'Sparkles' | 'Compass' etc.
  keyFeatures: string[];
  specs: IEquipmentSpec[];
  featuredIn: string[];
  order: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EquipmentSchema = new Schema<IEquipment>(
  {
    name: {
      type: String,
      required: [true, 'Equipment name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Equipment category is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    role: {
      type: String,
      required: [true, 'Equipment role is required'],
      trim: true,
    },
    badge: {
      type: String,
      default: '',
      trim: true,
    },
    icon: {
      type: String,
      default: 'Camera',
      trim: true,
    },
    keyFeatures: {
      type: [String],
      default: [],
    },
    specs: [
      {
        label: { type: String, required: true, trim: true },
        value: { type: String, required: true, trim: true },
      },
    ],
    featuredIn: {
      type: [String],
      default: [],
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Equipment: Model<IEquipment> =
  mongoose.models.Equipment || mongoose.model<IEquipment>('Equipment', EquipmentSchema);

export default Equipment;

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
  who: string; // client email, admin ID, guest token, or IP
  role: 'admin' | 'client' | 'guest' | 'anonymous' | 'system';
  action: string; // 'admin_login_success', 'admin_login_failed', 'client_login_success', 'client_login_failed', 'media_download', 'zip_download', 'print_selection_submit'
  galleryId?: mongoose.Types.ObjectId | null;
  status: 'success' | 'failure';
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    who: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['admin', 'client', 'guest', 'anonymous', 'system'],
      default: 'anonymous',
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    galleryId: {
      type: Schema.Types.ObjectId,
      ref: 'Gallery',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['success', 'failure'],
      default: 'success',
      index: true,
    },
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Create compound index for fast queries by gallery and action
AuditLogSchema.index({ galleryId: 1, action: 1, createdAt: -1 });

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;

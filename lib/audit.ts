import { connectToDatabase } from '@/lib/mongodb';
import { AuditLog } from '@/models/AuditLog';
import mongoose from 'mongoose';
import { NextRequest } from 'next/server';

export interface AuditEventParams {
  who: string;
  role?: 'admin' | 'client' | 'guest' | 'anonymous' | 'system';
  action: string;
  galleryId?: string | mongoose.Types.ObjectId | null;
  status?: 'success' | 'failure';
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  request?: NextRequest;
}

export function extractClientIp(request?: NextRequest): string | undefined {
  if (!request) return undefined;
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || undefined;
}

/**
 * Persists an immutable security audit event to MongoDB.
 * Never throws — failures are quietly recorded so user flows are never blocked.
 */
export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    await connectToDatabase();

    const ip = params.ip || extractClientIp(params.request);
    const userAgent = params.userAgent || params.request?.headers.get('user-agent') || undefined;

    let validGalleryId: mongoose.Types.ObjectId | null = null;
    if (params.galleryId && mongoose.Types.ObjectId.isValid(params.galleryId.toString())) {
      validGalleryId = new mongoose.Types.ObjectId(params.galleryId.toString());
    }

    await AuditLog.create({
      who: params.who,
      role: params.role || 'anonymous',
      action: params.action,
      galleryId: validGalleryId,
      status: params.status || 'success',
      ip,
      userAgent,
      metadata: params.metadata || {},
    });
  } catch (err) {
    console.error('[AUDIT LOG ERROR] Failed to record audit event:', err);
  }
}

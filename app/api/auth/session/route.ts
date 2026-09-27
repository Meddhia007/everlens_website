import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminToken,
  verifyClientToken,
  ADMIN_COOKIE_NAME,
  CLIENT_COOKIE_NAME,
} from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Gallery } from '@/models/Gallery';

export async function GET(request: NextRequest) {
  const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const clientToken = request.cookies.get(CLIENT_COOKIE_NAME)?.value;

  const adminSession = adminToken ? await verifyAdminToken(adminToken) : null;
  const clientSession = clientToken ? await verifyClientToken(clientToken) : null;

  let clientWithDetails: any = clientSession;

  if (clientSession?.galleryId) {
    try {
      await connectToDatabase();
      const gallery = await Gallery.findById(clientSession.galleryId)
        .select('weddingDate coupleNames')
        .lean();
      if (gallery) {
        clientWithDetails = {
          ...clientSession,
          coupleNames: gallery.coupleNames || clientSession.coupleNames,
          weddingDate: gallery.weddingDate ? new Date(gallery.weddingDate).toISOString() : undefined,
        };
      }
    } catch {
      // Graceful fallback to token payload
    }
  }

  return NextResponse.json({
    admin: adminSession,
    client: clientWithDetails,
  });
}

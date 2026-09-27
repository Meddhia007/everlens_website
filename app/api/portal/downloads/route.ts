import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { DownloadRequest } from '@/models/DownloadRequest';
import { processArchiveJob } from '@/lib/archiveWorker';
import { authorizeGalleryAccess } from '@/lib/gallery-auth';
import { getPresignedDownloadUrl } from '@/lib/r2';
import { logAuditEvent } from '@/lib/audit';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeGalleryAccess(request);
    if (!auth.success) {
      return auth.response;
    }

    const { session, gallery } = auth;
    await connectToDatabase();

    const rawRequests = await DownloadRequest.find({
      galleryId: new mongoose.Types.ObjectId(session.galleryId),
    })
      .sort({ requestedAt: -1 })
      .limit(10)
      .lean();

    const now = new Date();
    const safeSlug = (session.coupleNames || gallery.coupleNames || 'everlens')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    // Map and generate fresh 15-minute signed download URLs on-demand
    const requests = await Promise.all(
      rawRequests.map(async (req) => {
        let currentStatus = req.status;

        // Auto-mark expired if past 48-hour window
        if (currentStatus === 'ready' && req.expiresAt && new Date(req.expiresAt) < now) {
          currentStatus = 'expired';
          await DownloadRequest.findByIdAndUpdate(req._id, { status: 'expired' });
        }

        let dynamicDownloadUrl: string | undefined = undefined;
        if (currentStatus === 'ready') {
          if (req.r2Key) {
            // Strictly 15-minute download signed URL generated on-demand
            dynamicDownloadUrl = await getPresignedDownloadUrl(req.r2Key, 900, {
              downloadFilename: `${safeSlug}_wedding_collection.zip`,
              contentType: 'application/zip',
            });
          } else {
            dynamicDownloadUrl = '/api/portal/downloads/zip?type=everything';
          }
        }

        return {
          _id: req._id.toString(),
          status: currentStatus,
          downloadUrl: dynamicDownloadUrl,
          expiresAt: req.expiresAt ? new Date(req.expiresAt).toISOString() : undefined,
          itemCount: req.itemCount,
          requestedAt: req.requestedAt ? new Date(req.requestedAt).toISOString() : undefined,
          completedAt: req.completedAt ? new Date(req.completedAt).toISOString() : undefined,
        };
      })
    );

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error('Failed to get download requests:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to retrieve download requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeGalleryAccess(request);
    if (!auth.success) {
      return auth.response;
    }

    const { session, gallery } = auth;
    await connectToDatabase();

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    // Check if an active archive request is already queued or processing
    const existingActive = await DownloadRequest.findOne({
      galleryId: new mongoose.Types.ObjectId(session.galleryId),
      status: { $in: ['queued', 'processing'] },
      requestedAt: { $gte: tenMinutesAgo },
    });

    if (existingActive) {
      return NextResponse.json({
        success: true,
        message: "Preparing your download — we'll email you when it's ready",
        requestId: existingActive._id.toString(),
        status: existingActive.status,
      });
    }

    // Enqueue a new download request
    const newRequest = await DownloadRequest.create({
      galleryId: new mongoose.Types.ObjectId(session.galleryId),
      clientEmail: session.clientEmail || gallery.clientEmail,
      coupleNames: session.coupleNames || gallery.coupleNames,
      status: 'queued',
      requestedAt: new Date(),
    });

    const jobId = newRequest._id.toString();

    // Security audit log
    await logAuditEvent({
      who: session.clientEmail || gallery.clientEmail || session.sub,
      role: session.role,
      action: 'batch_download_request',
      status: 'success',
      galleryId: session.galleryId,
      metadata: { jobId },
      request,
    });

    // Trigger asynchronous background worker without blocking the HTTP response
    setImmediate(() => {
      processArchiveJob(jobId).catch((err) => {
        console.error(`[BACKGROUND WORKER ERROR] Job ${jobId}:`, err);
      });
    });

    return NextResponse.json({
      success: true,
      message: "Preparing your download — we'll email you when it's ready",
      requestId: jobId,
      status: 'queued',
    });
  } catch (error: any) {
    console.error('Failed to enqueue download request:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to request album download' },
      { status: 500 }
    );
  }
}

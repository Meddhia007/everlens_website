import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { DownloadRequest } from '@/models/DownloadRequest';
import { verifyClientToken, CLIENT_COOKIE_NAME } from '@/lib/auth';
import { processArchiveJob } from '@/lib/archiveWorker';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const clientToken = request.cookies.get(CLIENT_COOKIE_NAME)?.value;
    if (!clientToken) {
      return NextResponse.json({ error: 'Unauthorized client access' }, { status: 401 });
    }

    const session = await verifyClientToken(clientToken);
    if (!session || !session.galleryId) {
      return NextResponse.json({ error: 'Invalid or expired client session' }, { status: 401 });
    }

    await connectToDatabase();

    const rawRequests = await DownloadRequest.find({
      galleryId: new mongoose.Types.ObjectId(session.galleryId),
    })
      .sort({ requestedAt: -1 })
      .limit(10)
      .lean();

    const now = new Date();

    // Map and verify expiration
    const requests = await Promise.all(
      rawRequests.map(async (req) => {
        let currentStatus = req.status;

        // Auto-mark expired if past 48-hour window
        if (currentStatus === 'ready' && req.expiresAt && new Date(req.expiresAt) < now) {
          currentStatus = 'expired';
          await DownloadRequest.findByIdAndUpdate(req._id, { status: 'expired' });
        }

        const sanitizedUrl = req.downloadUrl?.includes('unsplash.com')
          ? '/api/portal/downloads/zip?type=everything'
          : req.downloadUrl;

        return {
          _id: req._id.toString(),
          status: currentStatus,
          downloadUrl: currentStatus === 'ready' ? sanitizedUrl : undefined,
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
    const clientToken = request.cookies.get(CLIENT_COOKIE_NAME)?.value;
    if (!clientToken) {
      return NextResponse.json({ error: 'Unauthorized client access' }, { status: 401 });
    }

    const session = await verifyClientToken(clientToken);
    if (!session || !session.galleryId) {
      return NextResponse.json({ error: 'Invalid or expired client session' }, { status: 401 });
    }

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
      clientEmail: session.clientEmail,
      coupleNames: session.coupleNames,
      status: 'queued',
      requestedAt: new Date(),
    });

    const jobId = newRequest._id.toString();

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

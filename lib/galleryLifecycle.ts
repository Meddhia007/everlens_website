import { connectToDatabase } from '@/lib/mongodb';
import { Gallery } from '@/models/Gallery';
import { sendGalleryExpirationWarningEmail } from '@/lib/email';

export interface LifecycleExecutionResult {
  archivedCount: number;
  archivedIds: string[];
  sent7DayCount: number;
  sent1DayCount: number;
  processedAt: string;
}

/**
 * Daily scheduled gallery lifecycle processor.
 * 1. Auto-archives galleries whose expirationDate has passed (restricts portal access without deleting anything).
 * 2. Sends client reminder email at 7 days before gallery expiration.
 * 3. Sends client final notice email at 1 day (24 hours) before gallery expiration.
 * 
 * Enforces idempotency via expirationNotice7DaysSentAt and expirationNotice1DaySentAt timestamps.
 */
export async function runDailyGalleryLifecycle(): Promise<LifecycleExecutionResult> {
  const now = new Date();
  console.log(`[LIFECYCLE] Executing daily gallery lifecycle check at ${now.toISOString()}`);

  await connectToDatabase();

  // 1. Auto-archive galleries past expirationDate
  const expiredGalleries = await Gallery.find({
    expirationDate: { $exists: true, $ne: null, $lte: now },
    status: { $ne: 'archived' },
  });

  const archivedIds: string[] = [];
  for (const gallery of expiredGalleries) {
    gallery.status = 'archived';
    await gallery.save();
    archivedIds.push(gallery._id.toString());
    console.log(
      `[LIFECYCLE] Auto-archived gallery ${gallery._id} for "${gallery.coupleNames}" (expired on ${gallery.expirationDate?.toISOString()})`
    );
  }

  // 2. Dispatch 7-day expiration warning emails to active galleries
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const galleriesFor7DayNotice = await Gallery.find({
    status: 'active',
    expirationDate: { $gt: now, $lte: sevenDaysFromNow },
    $or: [
      { expirationNotice7DaysSentAt: { $exists: false } },
      { expirationNotice7DaysSentAt: null },
    ],
  });

  let sent7DayCount = 0;
  for (const gallery of galleriesFor7DayNotice) {
    if (!gallery.expirationDate || !gallery.clientEmail) continue;

    const emailRes = await sendGalleryExpirationWarningEmail({
      to: gallery.clientEmail,
      coupleNames: gallery.coupleNames,
      weddingDate: gallery.weddingDate,
      expirationDate: gallery.expirationDate,
      daysRemaining: 7,
    });

    if (emailRes.success) {
      gallery.expirationNotice7DaysSentAt = now;
      await gallery.save();
      sent7DayCount++;
      console.log(
        `[LIFECYCLE] Sent 7-day expiration notice to ${gallery.clientEmail} for "${gallery.coupleNames}"`
      );
    }
  }

  // 3. Dispatch 1-day (24-hour) expiration warning emails to active galleries
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const galleriesFor1DayNotice = await Gallery.find({
    status: 'active',
    expirationDate: { $gt: now, $lte: oneDayFromNow },
    $or: [
      { expirationNotice1DaySentAt: { $exists: false } },
      { expirationNotice1DaySentAt: null },
    ],
  });

  let sent1DayCount = 0;
  for (const gallery of galleriesFor1DayNotice) {
    if (!gallery.expirationDate || !gallery.clientEmail) continue;

    const emailRes = await sendGalleryExpirationWarningEmail({
      to: gallery.clientEmail,
      coupleNames: gallery.coupleNames,
      weddingDate: gallery.weddingDate,
      expirationDate: gallery.expirationDate,
      daysRemaining: 1,
    });

    if (emailRes.success) {
      gallery.expirationNotice1DaySentAt = now;
      await gallery.save();
      sent1DayCount++;
      console.log(
        `[LIFECYCLE] Sent 1-day final expiration notice to ${gallery.clientEmail} for "${gallery.coupleNames}"`
      );
    }
  }

  const result: LifecycleExecutionResult = {
    archivedCount: archivedIds.length,
    archivedIds,
    sent7DayCount,
    sent1DayCount,
    processedAt: now.toISOString(),
  };

  console.log(`[LIFECYCLE] Run completed:`, result);
  return result;
}

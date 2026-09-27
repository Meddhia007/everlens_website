import { NextRequest, NextResponse } from 'next/server';
import { runDailyGalleryLifecycle } from '@/lib/galleryLifecycle';

export const dynamic = 'force-dynamic';

/**
 * Scheduled job endpoint to run the daily gallery lifecycle.
 * Protectable with Authorization: Bearer <CRON_SECRET> header if CRON_SECRET is configured.
 * 
 * Usage:
 *   GET /api/cron/gallery-lifecycle
 *   POST /api/cron/gallery-lifecycle
 */
async function handleLifecycleExecution(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '');
    if (token !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized: Invalid cron secret' }, { status: 401 });
    }
  }

  try {
    const result = await runDailyGalleryLifecycle();
    return NextResponse.json({
      success: true,
      message: 'Daily gallery lifecycle check executed successfully',
      result,
    });
  } catch (error: any) {
    console.error('[CRON API ERROR]', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to run daily gallery lifecycle' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleLifecycleExecution(req);
}

export async function POST(req: NextRequest) {
  return handleLifecycleExecution(req);
}

import React from 'react';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/mongodb';
import { Gallery } from '@/models/Gallery';
import { MediaItem } from '@/models/MediaItem';
import { GuestRateLimit } from '@/models/GuestRateLimit';
import { getPresignedDownloadUrl } from '@/lib/r2';
import { verifyGuestToken, GUEST_COOKIE_NAME } from '@/lib/tokens';
import { GuestPinEntry } from '@/components/guest/GuestPinEntry';
import { GuestSanctuaryView } from '@/components/guest/GuestSanctuaryView';
import { PortalMediaItem } from '@/components/portal/PortalLightbox';
import { Logo } from '@/components/Logo';

interface GuestPageProps {
  params: {
    token: string;
  };
}

export default async function GuestPage({ params }: GuestPageProps) {
  const { token } = params;

  await connectToDatabase();

  const gallery = await Gallery.findOne({ guestLinkToken: token }).lean();

  const isExpired =
    !gallery ||
    gallery.status === 'archived' ||
    Boolean(gallery.expirationDate && new Date(gallery.expirationDate) < new Date());

  if (isExpired) {
    return (
      <main className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-5 bg-cream-deep/40 border border-ink/15 p-8 sm:p-10 rounded-xs text-left">
          <div className="flex flex-col items-center text-center space-y-4">
            <Logo size="md" />
            <div className="space-y-2 pt-2">
              <h1 className="font-serif text-2xl sm:text-3xl text-ink font-normal tracking-tight">
                This gallery has expired — contact us
              </h1>
              <p className="text-xs font-sans text-ink/70 leading-relaxed max-w-sm mx-auto">
                The online celebration sharing period for this wedding collection has concluded and the collection is safely archived. If you are a guest looking to view these moments, please contact the couple or our studio.
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-ink/10 text-center">
            <a
              href="mailto:studio@everlensweddings.com"
              className="text-xs font-sans text-teal hover:underline font-medium"
            >
              Contact Studio: studio@everlensweddings.com
            </a>
          </div>
        </div>
      </main>
    );
  }

  // 1. PIN Protection Check
  if (gallery.guestPin) {
    const cookieStore = cookies();
    const guestCookie = cookieStore.get(GUEST_COOKIE_NAME)?.value;
    const guestSession = guestCookie ? await verifyGuestToken(guestCookie) : null;

    const isVerified =
      guestSession &&
      guestSession.galleryId === gallery._id.toString() &&
      guestSession.guestLinkToken === token;

    if (!isVerified) {
      // Determine client IP for initial rate limit check
      const headersList = headers();
      const forwardedFor = headersList.get('x-forwarded-for');
      const clientIp = forwardedFor
        ? forwardedFor.split(',')[0].trim()
        : headersList.get('x-real-ip') || '127.0.0.1';

      const rateLimitKey = `${token}:${clientIp}`;
      const rateLimit = await GuestRateLimit.findOne({ key: rateLimitKey }).lean();

      const isLockedOut = !!(
        rateLimit?.lockedUntil && new Date(rateLimit.lockedUntil) > new Date()
      );
      const remainingMinutes = isLockedOut
        ? Math.max(1, Math.ceil((new Date(rateLimit!.lockedUntil!).getTime() - Date.now()) / 60000))
        : 0;

      return (
        <main className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 sm:p-6">
          <GuestPinEntry
            token={token}
            coupleNames={gallery.coupleNames}
            initialLockedOut={isLockedOut}
            initialRemainingMinutes={remainingMinutes}
          />
        </main>
      );
    }
  }

  // 2. Fetch Media Items for Verified or Open Guest Gallery
  let mediaList: PortalMediaItem[] = [];
  try {
    const rawItems = await MediaItem.find({ galleryId: gallery._id })
      .sort({ createdAt: -1 })
      .lean();

    mediaList = await Promise.all(
      rawItems.map(async (item) => {
        let viewUrl: string | null = null;
        try {
          viewUrl = await getPresignedDownloadUrl(item.r2Key, 86400);
        } catch {
          viewUrl = null;
        }

        return {
          _id: item._id.toString(),
          galleryId: item.galleryId.toString(),
          originalFilename: item.originalFilename,
          r2Key: item.r2Key,
          type: item.type,
          category: item.category,
          url: viewUrl,
        };
      })
    );
  } catch (err) {
    console.error('Failed to load guest gallery media:', err);
  }

  const weddingDateStr = gallery.weddingDate
    ? new Date(gallery.weddingDate).toISOString()
    : undefined;

  return (
    <GuestSanctuaryView
      coupleNames={gallery.coupleNames}
      weddingDate={weddingDateStr}
      initialMedia={mediaList}
    />
  );
}

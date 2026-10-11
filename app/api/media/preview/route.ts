import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { MediaItem } from '@/models/MediaItem';
import { getObjectBufferFromR2 } from '@/lib/r2';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const key = searchParams.get('key');
    const urlParam = searchParams.get('url');

    const rawW = parseInt(searchParams.get('w') || '1600', 10);
    const targetWidth = Math.min(Math.max(isNaN(rawW) ? 1600 : rawW, 100), 2560);

    const rawQ = parseInt(searchParams.get('q') || '80', 10);
    const targetQuality = Math.min(Math.max(isNaN(rawQ) ? 80 : rawQ, 40), 95);

    const format = (searchParams.get('format') || 'webp').toLowerCase();
    const effectiveFormat = format === 'jpeg' || format === 'jpg' ? 'jpeg' : 'webp';

    let inputBuffer: Buffer | null = null;
    let inputContentType: string | undefined = undefined;

    // 1. Resolve by MediaItem ID
    if (id && mongoose.Types.ObjectId.isValid(id)) {
      await connectToDatabase();
      const item = await MediaItem.findById(id).lean();

      if (item) {
        if (item.type === 'video') {
          // If video has an extracted thumbnail key, use it
          if (item.thumbnailR2Key) {
            const thumbObj = await getObjectBufferFromR2(item.thumbnailR2Key);
            if (thumbObj) {
              inputBuffer = thumbObj.buffer;
              inputContentType = thumbObj.contentType;
            }
          }
        } else {
          // Photo: check preview key first, then master r2Key
          const targetKey = item.previewR2Key || item.r2Key;
          if (targetKey) {
            const mediaObj = await getObjectBufferFromR2(targetKey);
            if (mediaObj) {
              inputBuffer = mediaObj.buffer;
              inputContentType = mediaObj.contentType;
            }
          }
        }
      }
    }

    // 2. Resolve by R2 Key
    if (!inputBuffer && key) {
      const mediaObj = await getObjectBufferFromR2(key);
      if (mediaObj) {
        inputBuffer = mediaObj.buffer;
        inputContentType = mediaObj.contentType;
      }
    }

    // 3. Resolve by URL
    if (!inputBuffer && urlParam) {
      if (urlParam.startsWith('/')) {
        // Local public file
        const cleanPath = urlParam.replace(/^\/+/, '');
        const localPath = path.join(process.cwd(), 'public', cleanPath);
        if (fs.existsSync(localPath)) {
          try {
            inputBuffer = await fs.promises.readFile(localPath);
            inputContentType = 'image/jpeg';
          } catch {}
        }
      } else if (urlParam.startsWith('http://') || urlParam.startsWith('https://')) {
        try {
          const res = await fetch(urlParam, {
            headers: { Accept: 'image/*,*/*' },
            cache: 'force-cache',
          });
          if (res.ok) {
            const arrayBuf = await res.arrayBuffer();
            inputBuffer = Buffer.from(arrayBuf);
            inputContentType = res.headers.get('content-type') || 'image/jpeg';
          }
        } catch {}
      }
    }

    // Fallback: If no image found, use default wedding portrait sample
    if (!inputBuffer) {
      const fallbackPath = path.join(process.cwd(), 'public', 'portfolio', 'images', 'bridal-veil.jpg');
      if (fs.existsSync(fallbackPath)) {
        inputBuffer = await fs.promises.readFile(fallbackPath);
      } else {
        return new NextResponse('Media not found', { status: 404 });
      }
    }

    // 4. Image Transformation via sharp: auto-orient, downscale, WebP/JPEG compression
    let transform = sharp(inputBuffer).rotate(); // Preserves EXIF portrait/landscape orientation
    const metadata = await transform.metadata();

    const currentWidth = metadata.width || targetWidth;
    const finalWidth = Math.min(targetWidth, currentWidth);

    transform = transform.resize({
      width: finalWidth,
      withoutEnlargement: true,
      fastShrinkOnLoad: true,
    });

    if (effectiveFormat === 'webp') {
      transform = transform.webp({
        quality: targetQuality,
        effort: 4,
      });
    } else {
      transform = transform.jpeg({
        quality: targetQuality,
        mozjpeg: true,
      });
    }

    const outputBuffer = await transform.toBuffer();

    return new Response(outputBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': `image/${effectiveFormat}`,
        'Content-Length': outputBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CDN-Cache-Control': 'public, max-age=31536000, immutable',
        'Vercel-CDN-Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('[Preview API Error]:', error);
    return new NextResponse('Failed to process image preview', { status: 500 });
  }
}

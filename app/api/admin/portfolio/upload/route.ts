import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { validateMagicBytes, MAX_PHOTO_BYTES, MAX_VIDEO_BYTES } from '@/lib/upload-validator';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { handleCorsPreflight, getCorsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function authenticateAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

// OPTIONS: Handle CORS preflight with origin whitelist
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request);
}

// PUT: Direct binary upload from BulkUploader (simulates presigned R2 PUT in dev)
export async function PUT(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let key = searchParams.get('key') || request.headers.get('x-r2-key');

    const buffer = Buffer.from(await request.arrayBuffer());

    // 1. Server-side Magic Bytes validation
    const validation = validateMagicBytes(buffer);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid file format detected.' },
        { status: 400 }
      );
    }

    // 2. Server-side Max File Size Enforcement
    const maxAllowed = validation.type === 'video' ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES;
    if (buffer.length > maxAllowed) {
      const maxMb = maxAllowed / (1024 * 1024);
      return NextResponse.json(
        { error: `File size exceeds the ${maxMb >= 1024 ? `${maxMb / 1024}GB` : `${maxMb}MB`} limit for ${validation.type}s.` },
        { status: 400 }
      );
    }

    if (!key) {
      const ext = validation.type === 'video' ? '.mp4' : '.jpg';
      key = `galleries/uploads/${Date.now()}_${crypto.randomUUID()}${ext}`;
    }

    // Clean key of leading slash or traversal
    key = key.replace(/^\/+/, '').replace(/\.\./g, '');

    const publicDir = path.join(process.cwd(), 'public');
    const filePath = path.join(publicDir, 'uploads', key);
    const dir = path.dirname(filePath);

    await mkdir(dir, { recursive: true });
    await writeFile(filePath, buffer);

    const etag = `"${crypto.createHash('md5').update(buffer).digest('hex')}"`;
    const corsHeaders = getCorsHeaders(request);

    return new NextResponse(null, {
      status: 200,
      headers: {
        'ETag': etag,
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Failed to handle PUT upload:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process file upload' },
      { status: 500 }
    );
  }
}

// POST: Multipart form-data upload from Portfolio Posts Manager
export async function POST(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      const singleFile = formData.get('file') as File | null;
      if (singleFile) files.push(singleFile);
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided for upload' }, { status: 400 });
    }

    const publicDir = path.join(process.cwd(), 'public');
    const imagesDir = path.join(publicDir, 'portfolio', 'images');
    const videosDir = path.join(publicDir, 'portfolio', 'videos');

    await mkdir(imagesDir, { recursive: true });
    await mkdir(videosDir, { recursive: true });

    const uploadedUrls: Array<{ url: string; type: 'photo' | 'video'; filename: string }> = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());

      // 1. Server-side Magic Bytes validation
      const validation = validateMagicBytes(buffer);
      if (!validation.valid) {
        return NextResponse.json(
          { error: `File "${file.name}" rejected: ${validation.error}` },
          { status: 400 }
        );
      }

      // 2. Server-side Max File Size Enforcement
      const maxAllowed = validation.type === 'video' ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES;
      if (buffer.length > maxAllowed) {
        const maxMb = maxAllowed / (1024 * 1024);
        return NextResponse.json(
          { error: `File "${file.name}" exceeds the ${maxMb >= 1024 ? `${maxMb / 1024}GB` : `${maxMb}MB`} limit.` },
          { status: 400 }
        );
      }

      const isVideo = validation.type === 'video';
      const targetDir = isVideo ? videosDir : imagesDir;
      const subFolder = isVideo ? 'videos' : 'images';

      // Clean filename
      const safeBasename = file.name
        .toLowerCase()
        .replace(/[^a-z0-9.-]/g, '_')
        .replace(/_+/g, '_');

      const uniqueFilename = `${Date.now()}_${safeBasename}`;
      const filePath = path.join(targetDir, uniqueFilename);

      await writeFile(filePath, buffer);

      const publicUrl = `/portfolio/${subFolder}/${uniqueFilename}`;
      uploadedUrls.push({
        url: publicUrl,
        type: isVideo ? 'video' : 'photo',
        filename: file.name,
      });
    }

    return NextResponse.json({
      success: true,
      uploaded: uploadedUrls,
    });
  } catch (error: any) {
    console.error('Failed to upload portfolio files:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload portfolio assets' },
      { status: 500 }
    );
  }
}

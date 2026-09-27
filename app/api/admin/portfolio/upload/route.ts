import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function authenticateAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

// OPTIONS: Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-r2-key',
    },
  });
}

// PUT: Direct binary upload from BulkUploader (simulates presigned R2 PUT)
export async function PUT(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let key = searchParams.get('key') || request.headers.get('x-r2-key');

    if (!key) {
      const contentType = request.headers.get('content-type') || '';
      const isVideo = contentType.startsWith('video/');
      const ext = isVideo ? '.mp4' : '.jpg';
      key = `galleries/uploads/${Date.now()}_${crypto.randomUUID()}${ext}`;
    }

    // Clean key of leading slash or traversal
    key = key.replace(/^\/+/, '').replace(/\.\./g, '');

    const publicDir = path.join(process.cwd(), 'public');
    const filePath = path.join(publicDir, 'uploads', key);
    const dir = path.dirname(filePath);

    await mkdir(dir, { recursive: true });

    const buffer = Buffer.from(await request.arrayBuffer());
    await writeFile(filePath, buffer);

    const etag = `"${crypto.createHash('md5').update(buffer).digest('hex')}"`;

    return new NextResponse(null, {
      status: 200,
      headers: {
        'ETag': etag,
        'Access-Control-Allow-Origin': '*',
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
      // Check for single 'file'
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
      const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name);
      const targetDir = isVideo ? videosDir : imagesDir;
      const subFolder = isVideo ? 'videos' : 'images';

      // Clean filename
      const safeBasename = file.name
        .toLowerCase()
        .replace(/[^a-z0-9.-]/g, '_')
        .replace(/_+/g, '_');

      const uniqueFilename = `${Date.now()}_${safeBasename}`;
      const filePath = path.join(targetDir, uniqueFilename);

      const buffer = Buffer.from(await file.arrayBuffer());
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

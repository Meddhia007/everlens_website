import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PortfolioPost } from '@/models/PortfolioPost';
import { MediaItem } from '@/models/MediaItem';
import '@/models/Gallery';
import { getPresignedDownloadUrl } from '@/lib/r2';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { memoryStore } from '@/lib/memoryStore';
import { sanitizeString, stripMongoOperators } from '@/lib/security-sanitize';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

async function authenticateAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

// GET: Fetch single post
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    try {
      await connectToDatabase();
      const item = mongoose.Types.ObjectId.isValid(id)
        ? await PortfolioPost.findById(id).lean()
        : await PortfolioPost.findOne({ _id: id }).lean();
      if (item) {
        return NextResponse.json({ post: { ...item, _id: item._id.toString() } });
      }

      // Check MediaItem
      if (mongoose.Types.ObjectId.isValid(id)) {
        const media = await MediaItem.findById(id).populate('galleryId', 'coupleNames weddingDate').lean();
        if (media) {
          let mediaUrl = '';
          try {
            mediaUrl = await getPresignedDownloadUrl(media.r2Key, 3600);
          } catch {}

          const gallery: any = media.galleryId;
          const isVid = media.type === 'video' || /\.(mp4|mov|webm|m4v)$/i.test(media.originalFilename);

          return NextResponse.json({
            post: {
              _id: media._id.toString(),
              title: media.title || (gallery?.coupleNames ? `${gallery.coupleNames} · ${media.originalFilename}` : media.originalFilename.replace(/\.[^/.]+$/, '')),
              location: media.location || (gallery?.coupleNames ? 'Tunisia' : 'Everlens Portfolio'),
              year: media.year || (gallery?.weddingDate ? new Date(gallery.weddingDate).getFullYear().toString() : new Date(media.createdAt).getFullYear().toString()),
              category: media.category || (isVid ? 'films' : 'photography'),
              coverImage: mediaUrl,
              videoUrl: isVid ? mediaUrl : '',
              media: [{ url: mediaUrl, type: isVid ? 'video' : 'photo', caption: media.originalFilename }],
              featured: true,
              order: media.order ?? 0,
              source: 'gallery',
            },
          });
        }
      }
    } catch {
      // Fallback to memory
    }

    const memoryItem = memoryStore?.portfolioPosts.find((p) => p._id === id);
    if (memoryItem) {
      return NextResponse.json({ post: memoryItem });
    }

    return NextResponse.json({ error: 'Portfolio post not found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update post
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    const body = await request.json();

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = sanitizeString(body.title, 200);
    if (body.location !== undefined) updateData.location = sanitizeString(body.location, 200);
    if (body.year !== undefined) updateData.year = sanitizeString(body.year, 10);
    if (body.category !== undefined) updateData.category = sanitizeString(body.category, 50).toLowerCase();
    if (body.coverImage !== undefined) updateData.coverImage = sanitizeString(body.coverImage, 2000);
    if (body.videoUrl !== undefined) updateData.videoUrl = sanitizeString(body.videoUrl, 2000);
    if (body.media !== undefined && Array.isArray(body.media)) {
      updateData.media = body.media.map((m: any) => ({
        url: sanitizeString(m?.url, 2000),
        type: m?.type === 'video' ? 'video' : 'photo',
        caption: sanitizeString(m?.caption, 200),
        aspectRatio: sanitizeString(m?.aspectRatio, 20) || '4/5',
      }));
      if (!updateData.coverImage && updateData.media.length > 0) {
        updateData.coverImage = updateData.media[0].url;
      }
    }
    if (body.featured !== undefined) updateData.featured = Boolean(body.featured);
    if (body.order !== undefined) updateData.order = Number(body.order) || 0;

    const safeUpdateData = stripMongoOperators(updateData);

    try {
      await connectToDatabase();
      const updated = mongoose.Types.ObjectId.isValid(id)
        ? await PortfolioPost.findByIdAndUpdate(id, safeUpdateData, { new: true }).lean()
        : await PortfolioPost.findOneAndUpdate({ _id: id }, safeUpdateData, { new: true }).lean();
      if (updated) {
        const formatted = { ...updated, _id: updated._id.toString() };
        if (memoryStore) {
          const idx = memoryStore.portfolioPosts.findIndex((p) => p._id === id);
          if (idx !== -1) memoryStore.portfolioPosts[idx] = formatted;
        }
        return NextResponse.json({ post: formatted });
      }

      // Check if this is a MediaItem
      if (mongoose.Types.ObjectId.isValid(id)) {
        const media = await MediaItem.findById(id);
        if (media) {
          if (body.title !== undefined) media.title = body.title.trim();
          if (body.location !== undefined) media.location = body.location.trim();
          if (body.year !== undefined) media.year = body.year.trim();
          if (body.category !== undefined) media.category = body.category.trim().toLowerCase();
          if (body.order !== undefined) media.order = Number(body.order);
          await media.save();

          return NextResponse.json({
            post: {
              ...media.toObject(),
              _id: media._id.toString(),
            },
          });
        }
      }
    } catch (dbErr) {
      console.warn('MongoDB update failed, updating memoryStore:', dbErr);
    }

    if (memoryStore) {
      const idx = memoryStore.portfolioPosts.findIndex((p) => p._id === id);
      if (idx !== -1) {
        memoryStore.portfolioPosts[idx] = {
          ...memoryStore.portfolioPosts[idx],
          ...updateData,
        };
        return NextResponse.json({ post: memoryStore.portfolioPosts[idx] });
      }
    }

    return NextResponse.json({ error: 'Portfolio post not found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update post' }, { status: 500 });
  }
}

// DELETE: Delete post or unpublish gallery item from portfolio
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    try {
      await connectToDatabase();
      if (mongoose.Types.ObjectId.isValid(id)) {
        const deleted = await PortfolioPost.findByIdAndDelete(id);
        if (!deleted) {
          // If not in PortfolioPost, unpublish from Public Portfolio in MediaItem
          await MediaItem.findByIdAndUpdate(id, { isPublicPortfolio: false });
        }
      } else {
        await PortfolioPost.deleteOne({ _id: id });
      }
    } catch (dbErr) {
      console.warn('MongoDB delete failed, continuing with memoryStore:', dbErr);
    }

    if (memoryStore) {
      memoryStore.portfolioPosts = memoryStore.portfolioPosts.filter((p) => p._id !== id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to delete post' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { PortfolioPost } from '@/models/PortfolioPost';
import { MediaItem } from '@/models/MediaItem';
import '@/models/Gallery';
import { getPresignedDownloadUrl } from '@/lib/r2';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { memoryStore } from '@/lib/memoryStore';

export const dynamic = 'force-dynamic';

async function authenticateAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

// Helper to generate URL-safe slugs
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// GET: List all portfolio posts for admin (both standalone posts & gallery media marked for portfolio)
export async function GET(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    try {
      await connectToDatabase();

      // 1. Fetch gallery media items marked for Public Portfolio
      const publicMedia = await MediaItem.find({ isPublicPortfolio: true })
        .populate('galleryId', 'coupleNames weddingDate')
        .sort({ order: 1, createdAt: -1 })
        .lean();

      const publicMediaPosts = await Promise.all(
        publicMedia.map(async (item: any) => {
          let mediaUrl = '';
          try {
            mediaUrl = await getPresignedDownloadUrl(item.r2Key, 86400);
          } catch {
            mediaUrl = '';
          }

          const gallery: any = item.galleryId;
          const coupleTitle = item.title || (gallery?.coupleNames ? `${gallery.coupleNames} · ${item.originalFilename}` : item.originalFilename.replace(/\.[^/.]+$/, ''));
          const weddingYear = item.year || (gallery?.weddingDate
            ? new Date(gallery.weddingDate).getFullYear().toString()
            : new Date(item.createdAt || Date.now()).getFullYear().toString());

          const isVid = item.type === 'video' || /\.(mp4|mov|webm|m4v)$/i.test(item.originalFilename);
          const itemCategory = (item.category || (isVid ? 'films' : 'photography')).toLowerCase();

          return {
            _id: item._id.toString(),
            title: coupleTitle,
            slug: `gallery-media-${item._id.toString()}`,
            location: item.location || (gallery?.coupleNames ? 'Tunisia' : 'Everlens Portfolio'),
            year: weddingYear,
            category: itemCategory,
            coverImage: mediaUrl,
            videoUrl: isVid ? mediaUrl : '',
            media: [
              {
                url: mediaUrl,
                type: (isVid ? 'video' : 'photo') as 'photo' | 'video',
                caption: item.originalFilename,
                aspectRatio: isVid ? '9/16' : '4/5',
              },
            ],
            featured: true,
            order: typeof item.order === 'number' ? item.order : 0,
            source: 'gallery',
            galleryId: gallery?._id?.toString(),
            galleryCouple: gallery?.coupleNames,
            createdAt: item.createdAt,
          };
        })
      );

      // 2. Fetch standalone PortfolioPost items
      const items = await PortfolioPost.find().sort({ order: 1, createdAt: -1 }).lean();

      const formattedPortfolioPosts = items.map((item: any) => ({
        ...item,
        _id: item._id.toString(),
        source: 'direct',
      }));

      // Combine both sources
      const allPosts = [...publicMediaPosts, ...formattedPortfolioPosts];

      // Sort by order ascending (0 or unassigned go after explicit orders if desired, or sort by order)
      allPosts.sort((a, b) => {
        const orderA = typeof a.order === 'number' && a.order > 0 ? a.order : 999;
        const orderB = typeof b.order === 'number' && b.order > 0 ? b.order : 999;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

      if (memoryStore) {
        memoryStore.portfolioPosts = [...allPosts];
      }
      return NextResponse.json({ posts: allPosts });
    } catch (dbErr) {
      console.warn('MongoDB connection unavailable, serving from memoryStore:', dbErr);
    }

    return NextResponse.json({ posts: memoryStore?.portfolioPosts || [] });
  } catch (error: any) {
    console.error('Failed to list portfolio posts:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new portfolio post or batch of posts
export async function POST(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    const body = await request.json();

    // Check if this is a batch creation request
    if (body.batch && Array.isArray(body.posts)) {
      const createdPosts: any[] = [];
      await connectToDatabase();

      for (const p of body.posts) {
        const baseSlug = slugify(p.title || 'wedding-post');
        const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;

        const newPost = {
          title: p.title?.trim() || 'Untitled Wedding Post',
          slug: uniqueSlug,
          location: p.location?.trim() || 'Tunisia',
          year: p.year?.trim() || new Date().getFullYear().toString(),
          category: p.category?.trim().toLowerCase() || 'photography',
          coverImage: p.coverImage || p.media?.[0]?.url || '',
          videoUrl: p.videoUrl || '',
          media: Array.isArray(p.media) ? p.media : [],
          featured: !!p.featured,
          order: p.order ?? 0,
        };

        const saved = await PortfolioPost.create(newPost);
        const formatted = { ...saved.toObject(), _id: saved._id.toString() };
        createdPosts.push(formatted);

        if (memoryStore) {
          memoryStore.portfolioPosts.unshift(formatted);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully created ${createdPosts.length} carousel posts`,
        posts: createdPosts,
      });
    }

    // Single post creation
    const { title, location, year, category, coverImage, videoUrl, media, featured, order } = body;

    const mediaList = Array.isArray(media) ? media : [];
    const resolvedCover = coverImage || mediaList[0]?.url || '';

    if (!resolvedCover) {
      return NextResponse.json(
        { error: 'At least one photo or cover image is required for a portfolio post' },
        { status: 400 }
      );
    }

    const postOrder = typeof order === 'number' ? order : 0;
    const resolvedTitle = (title && title.trim()) || `Moment #${postOrder || Date.now().toString(36).slice(-4)}`;
    const baseSlug = slugify(resolvedTitle);
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

    const newPostData = {
      title: resolvedTitle,
      slug: uniqueSlug,
      location: location?.trim() || 'Tunisia',
      year: year?.trim() || new Date().getFullYear().toString(),
      category: category?.trim().toLowerCase() || 'photography',
      coverImage: resolvedCover,
      videoUrl: videoUrl?.trim() || '',
      media: mediaList,
      featured: !!featured,
      order: postOrder,
    };

    try {
      await connectToDatabase();
      const created = await PortfolioPost.create(newPostData);
      const formatted = { ...created.toObject(), _id: created._id.toString() };

      if (memoryStore) {
        memoryStore.portfolioPosts.unshift(formatted);
      }

      return NextResponse.json({ post: formatted }, { status: 201 });
    } catch (dbErr: any) {
      console.error('MongoDB create failed:', dbErr);
      return NextResponse.json(
        { error: dbErr?.message || 'Failed to save post to database' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Failed to create portfolio post:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create post' }, { status: 500 });
  }
}

// PATCH: Update post display orders (single or batch)
export async function PATCH(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    const body = await request.json();

    const ordersToUpdate: Array<{ id: string; order: number }> = Array.isArray(body.orders)
      ? body.orders
      : body.id && typeof body.order === 'number'
      ? [{ id: body.id, order: body.order }]
      : [];

    if (ordersToUpdate.length === 0) {
      return NextResponse.json({ error: 'Valid order data required' }, { status: 400 });
    }

    try {
      await connectToDatabase();
      for (const item of ordersToUpdate) {
        if (item.id && typeof item.order === 'number') {
          const update = { order: item.order };
          if (mongoose.Types.ObjectId.isValid(item.id)) {
            const updated = await PortfolioPost.findByIdAndUpdate(item.id, update);
            if (!updated) {
              await MediaItem.findByIdAndUpdate(item.id, update);
            }
          } else {
            await PortfolioPost.updateOne({ _id: item.id }, update);
          }
        }
      }
    } catch (dbErr) {
      console.warn('MongoDB connection unavailable in PATCH, updating memoryStore:', dbErr);
    }

    if (memoryStore) {
      for (const item of ordersToUpdate) {
        const idx = memoryStore.portfolioPosts.findIndex((p) => p._id === item.id);
        if (idx !== -1) memoryStore.portfolioPosts[idx].order = item.order;
      }
    }

    return NextResponse.json({ success: true, message: 'Display orders updated successfully' });
  } catch (error: any) {
    console.error('Failed to update display orders:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update orders' }, { status: 500 });
  }
}

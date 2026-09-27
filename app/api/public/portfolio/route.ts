import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PortfolioPost } from '@/models/PortfolioPost';
import { MediaItem } from '@/models/MediaItem';
// Register Gallery model for Mongoose populate
import '@/models/Gallery';
import { getPresignedDownloadUrl } from '@/lib/r2';
import { initialPortfolioPosts } from '@/lib/initialData';
import { memoryStore } from '@/lib/memoryStore';

export const dynamic = 'force-dynamic';

function filterPostsByCategory(posts: any[], category: string | null) {
  if (!category || category === 'all' || category === 'All') return posts;
  const catLower = category.toLowerCase();
  return posts.filter((p) => {
    const pCat = p.category?.toLowerCase() || '';
    if (catLower === 'films' || catLower === 'film') {
      return pCat === 'films' || pCat === 'film' || pCat === 'video';
    }
    if (catLower === 'photography' || catLower === 'photo') {
      return pCat === 'photography' || pCat === 'photo' || pCat === 'photos';
    }
    if (catLower.includes('traditional') || catLower.includes('wteya')) {
      return pCat.includes('traditional') || pCat.includes('wteya') || pCat.includes('traditionnel');
    }
    if (catLower.includes('editorial')) {
      return pCat.includes('editorial') || pCat.includes('éditorial');
    }
    return pCat === catLower;
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');

    try {
      await connectToDatabase();

      // 1. Fetch gallery media items marked for Public Portfolio
      const publicMedia = await MediaItem.find({ isPublicPortfolio: true })
        .populate('galleryId', 'coupleNames weddingDate')
        .sort({ createdAt: -1 })
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
          const coupleTitle = gallery?.coupleNames || item.originalFilename.replace(/\.[^/.]+$/, '');
          const weddingYear = gallery?.weddingDate
            ? new Date(gallery.weddingDate).getFullYear().toString()
            : new Date(item.createdAt || Date.now()).getFullYear().toString();

          const isVid = item.type === 'video' || /\.(mp4|mov|webm|m4v)$/i.test(item.originalFilename);
          const itemCategory = (item.category || (isVid ? 'films' : 'photography')).toLowerCase();

          return {
            _id: item._id.toString(),
            title: coupleTitle,
            slug: `gallery-media-${item._id.toString()}`,
            location: gallery?.coupleNames ? 'Tunisia' : 'Everlens Portfolio',
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
            order: 0,
          };
        })
      );

      // 2. Fetch standard PortfolioPost collection items
      let portfolioPosts = await PortfolioPost.find().sort({ order: 1, createdAt: -1 }).lean();

      // Seed initial posts if both collections are empty
      if (portfolioPosts.length === 0 && publicMediaPosts.length === 0) {
        try {
          await PortfolioPost.insertMany(initialPortfolioPosts);
          portfolioPosts = await PortfolioPost.find().sort({ order: 1, createdAt: -1 }).lean();
        } catch {
          portfolioPosts = initialPortfolioPosts as any;
        }
      }

      const formattedPortfolioPosts = portfolioPosts.map((item: any) => ({
        ...item,
        _id: item._id.toString(),
      }));

      // Combine: gallery media marked for public portfolio appear first
      let allPosts = [...publicMediaPosts, ...formattedPortfolioPosts];

      if (memoryStore) {
        memoryStore.portfolioPosts = [...allPosts];
      }

      allPosts = filterPostsByCategory(allPosts, category);

      if (featured === 'true') {
        allPosts = allPosts.filter((p) => p.featured);
      }

      return NextResponse.json({ posts: allPosts });
    } catch (dbErr) {
      console.warn('MongoDB connection unavailable, serving portfolio from memoryStore:', dbErr);
    }

    let posts = (memoryStore?.portfolioPosts && memoryStore.portfolioPosts.length > 0)
      ? memoryStore.portfolioPosts
      : (initialPortfolioPosts as any);

    posts = filterPostsByCategory(posts, category);

    if (featured === 'true') {
      posts = posts.filter((p: any) => p.featured);
    }

    return NextResponse.json({ posts });
  } catch (error: any) {
    console.error('Failed to retrieve portfolio posts:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to load portfolio posts' },
      { status: 500 }
    );
  }
}

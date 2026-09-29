import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { WorkCategory } from '@/models/WorkCategory';
import { initialWorkCategories } from '@/lib/initialData';
import { memoryStore } from '@/lib/memoryStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();

    let items = await WorkCategory.find({ active: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    if (items.length === 0) {
      await WorkCategory.insertMany(initialWorkCategories);
      items = await WorkCategory.find({ active: true })
        .sort({ order: 1, createdAt: 1 })
        .lean();
    }

    const formatted = items.map((item: any) => ({
      id: item._id.toString(),
      name: item.name,
      slug: item.slug,
      description: item.description || '',
      order: item.order || 0,
    }));

    return NextResponse.json(
      { categories: formatted },
      {
        headers: {
          'Cache-Control': 'public, max-age=0, s-maxage=5, stale-while-revalidate=15',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        categories: memoryStore.categories
          .filter((c) => c.active !== false)
          .map((c) => ({
            id: c._id,
            name: c.name,
            slug: c.slug,
            description: c.description || '',
            order: c.order || 0,
          })),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=0, s-maxage=5, stale-while-revalidate=15',
        },
      }
    );
  }
}

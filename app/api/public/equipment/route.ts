import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Equipment } from '@/models/Equipment';
import { initialEquipment } from '@/lib/initialData';
import { memoryStore } from '@/lib/memoryStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();

    let items = await Equipment.find({ active: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    if (items.length === 0) {
      await Equipment.insertMany(initialEquipment);
      items = await Equipment.find({ active: true })
        .sort({ order: 1, createdAt: 1 })
        .lean();
    }

    const formatted = items.map((item: any) => ({
      id: item._id.toString(),
      name: item.name,
      category: item.category,
      role: item.role,
      badge: item.badge || '',
      icon: item.icon || 'Camera',
      keyFeatures: item.keyFeatures || [],
      specs: item.specs || [],
      featuredIn: item.featuredIn || [],
    }));

    return NextResponse.json(
      { equipment: formatted },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
        },
      }
    );
  } catch (error: any) {
    // Graceful fallback to memoryStore
    return NextResponse.json(
      {
        equipment: memoryStore.equipment
          .filter((item) => item.active !== false)
          .map((item) => ({
            id: item._id,
            name: item.name,
            category: item.category,
            role: item.role,
            badge: item.badge || '',
            icon: item.icon || 'Camera',
            keyFeatures: item.keyFeatures || [],
            specs: item.specs || [],
            featuredIn: item.featuredIn || [],
          })),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
        },
      }
    );
  }
}

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Service } from '@/models/Service';
import { initialServices } from '@/lib/initialData';
import { memoryStore } from '@/lib/memoryStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();

    let items = await Service.find({ active: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    if (
      items.length === 0 ||
      items.some((it: any) => String(it.title).toLowerCase().includes('wedding photography')) ||
      (items[0]?.options?.length || 0) < 5
    ) {
      try {
        await Service.deleteMany({});
        await Service.insertMany(initialServices);
        items = await Service.find({ active: true })
          .sort({ order: 1, createdAt: 1 })
          .lean();
      } catch {
        // Continue with memoryStore fallback
      }
    }

    const formatted = items.map((item: any) => ({
      id: item._id.toString(),
      title: item.title,
      subtitle: item.subtitle || '',
      badge: item.badge || '',
      price: item.price || 'Tarifs sur demande',
      description: item.description || '',
      features: Array.isArray(item.features) ? item.features : [],
      options: Array.isArray(item.options) ? item.options : [],
      icon: item.icon || 'Camera',
      order: item.order || 0,
    }));

    return NextResponse.json(
      { services: formatted, packs: formatted },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
        },
      }
    );
  } catch (error: any) {
    const formatted = memoryStore.services
      .filter((s) => s.active !== false)
      .map((s) => ({
        id: s._id,
        title: s.title,
        subtitle: s.subtitle || '',
        badge: s.badge || '',
        price: s.price || 'Tarifs sur demande',
        description: s.description || '',
        features: Array.isArray(s.features) ? s.features : [],
        options: Array.isArray(s.options) ? s.options : [],
        icon: s.icon || 'Camera',
        order: s.order || 0,
      }));

    return NextResponse.json(
      {
        services: formatted,
        packs: formatted,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
        },
      }
    );
  }
}

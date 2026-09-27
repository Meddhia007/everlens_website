import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Service } from '@/models/Service';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { initialServices } from '@/lib/initialData';
import { memoryStore } from '@/lib/memoryStore';

async function authenticateAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

// GET: List all services
export async function GET(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    try {
      await connectToDatabase();

      let items = await Service.find().sort({ order: 1, createdAt: 1 }).lean();

      if (
        items.length === 0 ||
        items.some((it: any) => String(it.title).toLowerCase().includes('wedding photography')) ||
        (items[0]?.options?.length || 0) < 5
      ) {
        await Service.deleteMany({});
        await Service.insertMany(initialServices);
        items = await Service.find().sort({ order: 1, createdAt: 1 }).lean();
      }

      if (items.length > 0) {
        const formatted = items.map((item: any) => ({
          ...item,
          _id: item._id.toString(),
        }));
        memoryStore.services = [...formatted];
        return NextResponse.json({ services: formatted });
      }
    } catch (dbErr) {
      console.warn('MongoDB connection unavailable, serving services from memoryStore.');
    }

    return NextResponse.json({ services: memoryStore.services });
  } catch (error: any) {
    console.error('Failed to list services:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

// POST: Create a new service
export async function POST(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      subtitle = '',
      badge = '',
      price = 'Tarifs sur demande',
      description = '',
      features = [],
      options = [],
      icon = 'Camera',
      order = 0,
      active = true,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Pack title is required' }, { status: 400 });
    }

    const itemPayload = {
      title: title.trim(),
      subtitle: subtitle ? subtitle.trim() : '',
      badge: badge ? badge.trim() : '',
      price: price ? price.trim() : 'Tarifs sur demande',
      description: description ? description.trim() : '',
      features: Array.isArray(features) ? features.map((f: any) => String(f).trim()).filter(Boolean) : [],
      options: Array.isArray(options) ? options.map((o: any) => String(o).trim()).filter(Boolean) : [],
      icon: icon ? icon.trim() : 'Camera',
      order: Number(order) || 0,
      active: Boolean(active),
    };

    try {
      await connectToDatabase();

      const created = await Service.create(itemPayload);
      const formatted = {
        ...created.toObject(),
        _id: created._id.toString(),
      };
      memoryStore.services.push(formatted);

      return NextResponse.json(
        {
          success: true,
          service: formatted,
        },
        { status: 201 }
      );
    } catch (dbErr) {
      console.warn('MongoDB unavailable, saving service to memoryStore fallback.');
      const fallbackItem = {
        _id: 'svc-' + Date.now(),
        ...itemPayload,
      };
      memoryStore.services.push(fallbackItem);

      return NextResponse.json(
        {
          success: true,
          service: fallbackItem,
          offline: true,
        },
        { status: 201 }
      );
    }
  } catch (error: any) {
    console.error('Failed to create service:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create service' },
      { status: 500 }
    );
  }
}

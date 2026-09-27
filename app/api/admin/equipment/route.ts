import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Equipment } from '@/models/Equipment';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { initialEquipment } from '@/lib/initialData';
import { memoryStore } from '@/lib/memoryStore';

async function authenticateAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

// GET: List all equipment items
export async function GET(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    try {
      await connectToDatabase();

      let items = await Equipment.find().sort({ order: 1, createdAt: 1 }).lean();

      // Auto-seed initial items if collection is empty
      if (items.length === 0) {
        await Equipment.insertMany(initialEquipment);
        items = await Equipment.find().sort({ order: 1, createdAt: 1 }).lean();
      }

      if (items.length > 0) {
        const formatted = items.map((item: any) => ({
          ...item,
          _id: item._id.toString(),
        }));
        memoryStore.equipment = [...formatted];
        return NextResponse.json({ equipment: formatted });
      }
    } catch (dbErr) {
      console.warn('MongoDB connection unavailable, serving equipment from memoryStore.');
    }

    return NextResponse.json({ equipment: memoryStore.equipment });
  } catch (error: any) {
    console.error('Failed to list equipment:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch equipment' },
      { status: 500 }
    );
  }
}

// POST: Create a new equipment item
export async function POST(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      category,
      role,
      badge = '',
      icon = 'Camera',
      keyFeatures = [],
      specs = [],
      featuredIn = [],
      order = 0,
      active = true,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Equipment name is required' }, { status: 400 });
    }
    if (!category?.trim()) {
      return NextResponse.json({ error: 'Equipment category is required' }, { status: 400 });
    }
    if (!role?.trim()) {
      return NextResponse.json({ error: 'Equipment role is required' }, { status: 400 });
    }

    const itemPayload = {
      name: name.trim(),
      category: category.trim().toLowerCase(),
      role: role.trim(),
      badge: badge.trim(),
      icon: icon.trim() || 'Camera',
      keyFeatures: Array.isArray(keyFeatures) ? keyFeatures.filter(Boolean) : [],
      specs: Array.isArray(specs) ? specs.filter((s: any) => s.label && s.value) : [],
      featuredIn: Array.isArray(featuredIn) ? featuredIn.filter(Boolean) : [],
      order: Number(order) || 0,
      active: Boolean(active),
    };

    try {
      await connectToDatabase();

      const created = await Equipment.create(itemPayload);
      const formatted = {
        ...created.toObject(),
        _id: created._id.toString(),
      };
      memoryStore.equipment.push(formatted);

      return NextResponse.json(
        {
          success: true,
          equipment: formatted,
        },
        { status: 201 }
      );
    } catch (dbErr) {
      console.warn('MongoDB unavailable, saving equipment to memoryStore fallback.');
      const fallbackItem = {
        _id: 'eq-' + Date.now(),
        ...itemPayload,
      };
      memoryStore.equipment.push(fallbackItem);

      return NextResponse.json(
        {
          success: true,
          equipment: fallbackItem,
          offline: true,
        },
        { status: 201 }
      );
    }
  } catch (error: any) {
    console.error('Failed to create equipment:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create equipment' },
      { status: 500 }
    );
  }
}

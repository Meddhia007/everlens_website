import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Equipment } from '@/models/Equipment';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { memoryStore } from '@/lib/memoryStore';

async function authenticateAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

// GET: Single equipment item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    try {
      await connectToDatabase();
      const item = await Equipment.findById(params.id).lean();

      if (item) {
        return NextResponse.json({
          equipment: {
            ...(item as any),
            _id: (item as any)._id.toString(),
          },
        });
      }
    } catch {
      // Fall through to memoryStore
    }

    const memoryItem = memoryStore.equipment.find((it) => it._id === params.id);
    if (!memoryItem) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    return NextResponse.json({ equipment: memoryItem });
  } catch (error: any) {
    console.error('Failed to get equipment:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to get equipment' },
      { status: 500 }
    );
  }
}

// PUT: Update equipment item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      badge,
      icon,
      keyFeatures,
      specs,
      featuredIn,
      order,
      active,
    } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (category !== undefined) updateData.category = category.trim().toLowerCase();
    if (role !== undefined) updateData.role = role.trim();
    if (badge !== undefined) updateData.badge = badge.trim();
    if (icon !== undefined) updateData.icon = icon.trim();
    if (keyFeatures !== undefined) {
      updateData.keyFeatures = Array.isArray(keyFeatures) ? keyFeatures.filter(Boolean) : [];
    }
    if (specs !== undefined) {
      updateData.specs = Array.isArray(specs) ? specs.filter((s: any) => s.label && s.value) : [];
    }
    if (featuredIn !== undefined) {
      updateData.featuredIn = Array.isArray(featuredIn) ? featuredIn.filter(Boolean) : [];
    }
    if (order !== undefined) updateData.order = Number(order);
    if (active !== undefined) updateData.active = Boolean(active);

    try {
      await connectToDatabase();

      const updated = await Equipment.findByIdAndUpdate(params.id, updateData, {
        new: true,
        runValidators: true,
      }).lean();

      if (updated) {
        const formatted = {
          ...(updated as any),
          _id: (updated as any)._id.toString(),
        };
        const idx = memoryStore.equipment.findIndex((it) => it._id === params.id);
        if (idx !== -1) memoryStore.equipment[idx] = formatted;

        return NextResponse.json({
          success: true,
          equipment: formatted,
        });
      }
    } catch {
      // Fall through to memoryStore
    }

    // Update in memoryStore
    const idx = memoryStore.equipment.findIndex((it) => it._id === params.id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Equipment item not found' }, { status: 404 });
    }

    memoryStore.equipment[idx] = {
      ...memoryStore.equipment[idx],
      ...updateData,
    };

    return NextResponse.json({
      success: true,
      equipment: memoryStore.equipment[idx],
      offline: true,
    });
  } catch (error: any) {
    console.error('Failed to update equipment:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update equipment' },
      { status: 500 }
    );
  }
}

// DELETE: Delete equipment item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    try {
      await connectToDatabase();
      await Equipment.findByIdAndDelete(params.id).lean();
    } catch {
      // Fall through
    }

    memoryStore.equipment = memoryStore.equipment.filter((it) => it._id !== params.id);

    return NextResponse.json({
      success: true,
      message: 'Equipment item removed',
    });
  } catch (error: any) {
    console.error('Failed to delete equipment:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete equipment' },
      { status: 500 }
    );
  }
}

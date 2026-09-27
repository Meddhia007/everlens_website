import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Service } from '@/models/Service';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { memoryStore } from '@/lib/memoryStore';

async function authenticateAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

// GET: Single service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    try {
      await connectToDatabase();
      const item = await Service.findById(id).lean();

      if (item) {
        return NextResponse.json({
          service: {
            ...(item as any),
            _id: (item as any)._id.toString(),
          },
        });
      }
    } catch {
      // Fall through to memoryStore
    }

    const memoryItem = memoryStore.services.find((it) => it._id === id);
    if (!memoryItem) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ service: memoryItem });
  } catch (error: any) {
    console.error('Failed to get service:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to get service' },
      { status: 500 }
    );
  }
}

// PUT: Update service
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    const body = await request.json();
    const { title, subtitle, badge, price, description, features, options, icon, order, active } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (subtitle !== undefined) updateData.subtitle = subtitle.trim();
    if (badge !== undefined) updateData.badge = badge.trim();
    if (price !== undefined) updateData.price = price.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (features !== undefined) {
      updateData.features = Array.isArray(features) ? features.map((f: any) => String(f).trim()).filter(Boolean) : [];
    }
    if (options !== undefined) {
      updateData.options = Array.isArray(options) ? options.map((o: any) => String(o).trim()).filter(Boolean) : [];
    }
    if (icon !== undefined) updateData.icon = icon.trim();
    if (order !== undefined) updateData.order = Number(order);
    if (active !== undefined) updateData.active = Boolean(active);

    try {
      await connectToDatabase();

      const updated = await Service.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).lean();

      if (updated) {
        const formatted = {
          ...(updated as any),
          _id: (updated as any)._id.toString(),
        };
        const idx = memoryStore.services.findIndex((it) => it._id === id);
        if (idx !== -1) memoryStore.services[idx] = formatted;

        return NextResponse.json({
          success: true,
          service: formatted,
        });
      }
    } catch {
      // Fall through to memoryStore
    }

    // Update in memoryStore
    const idx = memoryStore.services.findIndex((it) => it._id === id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    memoryStore.services[idx] = {
      ...memoryStore.services[idx],
      ...updateData,
    };

    return NextResponse.json({
      success: true,
      service: memoryStore.services[idx],
      offline: true,
    });
  } catch (error: any) {
    console.error('Failed to update service:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update service' },
      { status: 500 }
    );
  }
}

// DELETE: Delete service
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    try {
      await connectToDatabase();
      await Service.findByIdAndDelete(id).lean();
    } catch {
      // Fall through
    }

    memoryStore.services = memoryStore.services.filter((it) => it._id !== id);

    return NextResponse.json({
      success: true,
      message: 'Service permanently removed',
    });
  } catch (error: any) {
    console.error('Failed to delete service:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete service' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/mongodb';
import { WorkCategory } from '@/models/WorkCategory';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { memoryStore } from '@/lib/memoryStore';

async function authenticateAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// GET: Single work category
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
      const item = await WorkCategory.findById(id).lean();

      if (item) {
        return NextResponse.json({
          category: {
            ...(item as any),
            _id: (item as any)._id.toString(),
          },
        });
      }
    } catch {
      // Fall through to memoryStore
    }

    const memoryItem = memoryStore.categories.find((it) => it._id === id);
    if (!memoryItem) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ category: memoryItem });
  } catch (error: any) {
    console.error('Failed to get category:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to get category' },
      { status: 500 }
    );
  }
}

// PUT: Update work category
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
    const { name, slug, description, order, active } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (slug !== undefined) {
      const formattedSlug = slugify(slug);
      updateData.slug = formattedSlug;
    }
    if (description !== undefined) updateData.description = description.trim();
    if (order !== undefined) updateData.order = Number(order);
    if (active !== undefined) updateData.active = Boolean(active);

    try {
      await connectToDatabase();

      if (updateData.slug) {
        const existing = await WorkCategory.findOne({
          slug: updateData.slug,
          _id: { $ne: id },
        });
        if (existing) {
          return NextResponse.json(
            { error: `Slug "${updateData.slug}" is already used by another category.` },
            { status: 409 }
          );
        }
      }

      const updated = await WorkCategory.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).lean();

      if (updated) {
        const formatted = {
          ...(updated as any),
          _id: (updated as any)._id.toString(),
        };
        const idx = memoryStore.categories.findIndex((it) => it._id === id);
        if (idx !== -1) memoryStore.categories[idx] = formatted;

        try {
          revalidatePath('/api/public/work-categories');
          revalidatePath('/admin/portfolio');
          revalidatePath('/');
        } catch {}

        return NextResponse.json({
          success: true,
          category: formatted,
        });
      }
    } catch (err: any) {
      if (err?.message?.includes('already used')) {
        return NextResponse.json({ error: err.message }, { status: 409 });
      }
      // Fall through to memoryStore
    }

    // Update in memoryStore
    const idx = memoryStore.categories.findIndex((it) => it._id === id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (updateData.slug) {
      const duplicate = memoryStore.categories.find(
        (it) => it.slug === updateData.slug && it._id !== id
      );
      if (duplicate) {
        return NextResponse.json(
          { error: `Slug "${updateData.slug}" is already used by another category.` },
          { status: 409 }
        );
      }
    }

    memoryStore.categories[idx] = {
      ...memoryStore.categories[idx],
      ...updateData,
    };

    return NextResponse.json({
      success: true,
      category: memoryStore.categories[idx],
      offline: true,
    });
  } catch (error: any) {
    console.error('Failed to update category:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE: Delete work category
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
      await WorkCategory.findByIdAndDelete(id).lean();
    } catch {
      // Fall through
    }

    memoryStore.categories = memoryStore.categories.filter((it) => it._id !== id);

    try {
      revalidatePath('/api/public/work-categories');
      revalidatePath('/admin/portfolio');
      revalidatePath('/');
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Category permanently removed',
    });
  } catch (error: any) {
    console.error('Failed to delete category:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete category' },
      { status: 500 }
    );
  }
}

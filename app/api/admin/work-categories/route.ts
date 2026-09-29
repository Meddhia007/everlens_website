import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/mongodb';
import { WorkCategory } from '@/models/WorkCategory';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { initialWorkCategories } from '@/lib/initialData';
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

// GET: List all work categories
export async function GET(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    try {
      await connectToDatabase();

      let items = await WorkCategory.find().sort({ order: 1, createdAt: 1 }).lean();

      // Auto-seed initial categories if collection is empty
      if (items.length === 0) {
        await WorkCategory.insertMany(initialWorkCategories);
        items = await WorkCategory.find().sort({ order: 1, createdAt: 1 }).lean();
      }

      if (items.length > 0) {
        const formatted = items.map((item: any) => ({
          ...item,
          _id: item._id.toString(),
        }));
        memoryStore.categories = [...formatted];
        return NextResponse.json({ categories: formatted });
      }
    } catch (dbErr) {
      console.warn('MongoDB connection unavailable, serving work categories from memoryStore.');
    }

    return NextResponse.json({ categories: memoryStore.categories });
  } catch (error: any) {
    console.error('Failed to list work categories:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch work categories' },
      { status: 500 }
    );
  }
}

// POST: Create a new work category
export async function POST(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, description = '', order = 0, active = true } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const assignedSlug = slug?.trim() ? slugify(slug) : slugify(name);
    if (!assignedSlug) {
      return NextResponse.json({ error: 'Invalid category slug' }, { status: 400 });
    }

    const itemPayload = {
      name: name.trim(),
      slug: assignedSlug,
      description: description.trim(),
      order: Number(order) || 0,
      active: Boolean(active),
    };

    try {
      await connectToDatabase();

      const existing = await WorkCategory.findOne({ slug: assignedSlug });
      if (existing) {
        return NextResponse.json(
          { error: `Category with slug "${assignedSlug}" already exists.` },
          { status: 409 }
        );
      }

      const created = await WorkCategory.create(itemPayload);

      const formatted = {
        ...created.toObject(),
        _id: created._id.toString(),
      };
      memoryStore.categories.push(formatted);

      try {
        revalidatePath('/api/public/work-categories');
        revalidatePath('/admin/portfolio');
        revalidatePath('/');
      } catch {}

      return NextResponse.json(
        {
          success: true,
          category: formatted,
        },
        { status: 201 }
      );
    } catch (dbErr: any) {
      if (dbErr?.message?.includes('already exists')) {
        return NextResponse.json({ error: dbErr.message }, { status: 409 });
      }

      console.warn('MongoDB unavailable, saving work category to memoryStore fallback.');
      const existingInMem = memoryStore.categories.find((c) => c.slug === assignedSlug);
      if (existingInMem) {
        return NextResponse.json(
          { error: `Category with slug "${assignedSlug}" already exists.` },
          { status: 409 }
        );
      }

      const fallbackItem = {
        _id: 'cat-' + Date.now(),
        ...itemPayload,
      };
      memoryStore.categories.push(fallbackItem);

      return NextResponse.json(
        {
          success: true,
          category: fallbackItem,
          offline: true,
        },
        { status: 201 }
      );
    }
  } catch (error: any) {
    console.error('Failed to create work category:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create work category' },
      { status: 500 }
    );
  }
}

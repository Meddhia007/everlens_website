import {
  initialEquipment,
  initialServices,
  initialWorkCategories,
} from './initialData';

export interface MemoryEquipment {
  _id: string;
  name: string;
  category: string;
  role: string;
  badge: string;
  icon: string;
  keyFeatures: string[];
  specs: { label: string; value: string }[];
  featuredIn: string[];
  order: number;
  active: boolean;
}

export interface MemoryService {
  _id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  price?: string;
  description?: string;
  features?: string[];
  options?: string[];
  icon: string;
  order: number;
  active: boolean;
}

export interface MemoryCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
  active: boolean;
}

export interface MemoryPortfolioPost {
  _id: string;
  title: string;
  slug: string;
  location: string;
  year?: string;
  category: string;
  coverImage: string;
  videoUrl?: string;
  media: Array<{
    url: string;
    type: 'photo' | 'video';
    caption?: string;
    aspectRatio?: string;
  }>;
  featured: boolean;
  order: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __everlens_memory_store: {
    equipment: MemoryEquipment[];
    services: MemoryService[];
    categories: MemoryCategory[];
    portfolioPosts: MemoryPortfolioPost[];
  } | undefined;
}

if (!global.__everlens_memory_store) {
  global.__everlens_memory_store = {
    equipment: initialEquipment.map((item, idx) => ({
      _id: `item-${idx + 1}`,
      name: item.name,
      category: item.category,
      role: item.role,
      badge: item.badge || '',
      icon: item.icon || 'Camera',
      keyFeatures: [...item.keyFeatures],
      specs: [...item.specs],
      featuredIn: [...item.featuredIn],
      order: item.order || idx + 1,
      active: item.active !== false,
    })),
    services: initialServices.map((item, idx) => ({
      _id: `svc-${idx + 1}`,
      title: item.title,
      subtitle: item.subtitle || '',
      badge: item.badge || '',
      price: item.price || 'Tarifs sur demande',
      description: item.description || '',
      features: [...(item.features || [])],
      options: [...(item.options || [])],
      icon: item.icon || 'Camera',
      order: item.order || idx + 1,
      active: item.active !== false,
    })),
    categories: initialWorkCategories.map((item, idx) => ({
      _id: `cat-${idx + 1}`,
      name: item.name,
      slug: item.slug,
      description: item.description || '',
      order: item.order || idx + 1,
      active: item.active !== false,
    })),
    portfolioPosts: [],
  };
} else if (
  global.__everlens_memory_store.services &&
  (global.__everlens_memory_store.services.some((s) => s.title.toLowerCase().includes('wedding photography')) ||
   global.__everlens_memory_store.services.length !== 4 ||
   (global.__everlens_memory_store.services[0]?.options?.length || 0) < 5)
) {
  global.__everlens_memory_store.services = initialServices.map((item, idx) => ({
    _id: `svc-${idx + 1}`,
    title: item.title,
    subtitle: item.subtitle || '',
    badge: item.badge || '',
    price: item.price || 'Tarifs sur demande',
    description: item.description || '',
    features: [...(item.features || [])],
    options: [...(item.options || [])],
    icon: item.icon || 'Camera',
    order: item.order || idx + 1,
    active: item.active !== false,
  }));
}

export const memoryStore = global.__everlens_memory_store;

export default memoryStore;

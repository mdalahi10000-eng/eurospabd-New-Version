import { 
  isSupabaseConfigured, 
  getSupabase, 
  uploadToSupabaseStorage, 
  subscribeToSupabaseTable 
} from '../supabase';
import { mapSupabaseServiceToService, mapServiceToSupabaseRow } from './unifiedBackend';
import { Service, PriceOption } from '../types';
import { SERVICES_DATA, SPA_INFO } from '../data/spaData';
import { buildCanonicalUrl } from '../config/seoConfig';
import { getCachedData, setCachedData, CACHE_KEYS } from './cacheService';

/**
 * Utility: generate SEO-friendly lowercase hyphenated slug from service name
 */
export function generateServiceSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Check if a service slug is already taken in Supabase
 */
export async function checkServiceSlugAvailability(slug: string, excludeId?: string): Promise<boolean> {
  if (!slug) return false;
  if (!isSupabaseConfigured()) return true;
  try {
    const { data, error } = await (getSupabase().from('services') as any)
      .select('id')
      .eq('slug', slug);

    if (error || !data || data.length === 0) return true;
    if (excludeId && data.length === 1 && data[0].id === excludeId) {
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Error checking service slug availability:', err);
    return true; // Fallback
  }
}

/**
 * Upload service featured image to Supabase Storage ('spa-assets' bucket)
 */
export async function uploadServiceImage(
  file: File, 
  onProgress?: (percentage: number) => void
): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  if (onProgress) onProgress(20);
  const res = await uploadToSupabaseStorage('services', file.name, file);
  if (!res.url) {
    throw new Error('Failed to upload image to Supabase Storage.');
  }
  if (onProgress) onProgress(100);
  return res.url;
}

/**
 * Helper to prepare default service structure for existing static data
 */
export function mapStaticServiceToFullService(svc: Service, index: number): Service {
  const displayPrice = svc.priceOptions?.[0]?.price || 'BDT 3,500';
  return {
    ...svc,
    slug: svc.slug || generateServiceSlug(svc.name),
    category: svc.category || 'Massage Therapy',
    price: svc.price || displayPrice,
    displayOrder: svc.displayOrder ?? index,
    status: svc.status || 'active',
    imageAlt: svc.imageAlt || `${svc.name} session at Euro Spa Center Banani`,
    galleryImages: svc.galleryImages || [svc.image],
    bookingCta: svc.bookingCta || 'Book This Treatment',
    serviceAreas: svc.serviceAreas || ['Dhaka', 'Banani', 'Gulshan', 'Dhanmondi'],
    seoTitle: svc.seoTitle || `${svc.name} in Banani, Dhaka | ${SPA_INFO.name}`,
    metaDescription: svc.metaDescription || `${svc.shortDescription} Professional therapy at ${SPA_INFO.name}, Banani. Certified therapists, hygienic suites.`,
    focusKeyword: svc.focusKeyword || `${svc.name.toLowerCase()} banani`,
    secondaryKeywords: svc.secondaryKeywords || ['massage banani', 'dhaka wellness spa', 'relaxation therapy'],
    canonicalUrl: svc.canonicalUrl || buildCanonicalUrl(`/services/${svc.slug || generateServiceSlug(svc.name)}`),
    robotsIndex: svc.robotsIndex ?? true,
    robotsFollow: svc.robotsFollow ?? true,
    ogTitle: svc.ogTitle || `${svc.name} | ${SPA_INFO.name}`,
    ogDescription: svc.ogDescription || svc.shortDescription,
    ogImage: svc.ogImage || svc.image,
    schemaType: svc.schemaType || 'HealthAndBeautyBusiness',
    customSchema: svc.customSchema || '',
    updatedAt: new Date().toISOString()
  };
}

/**
 * Seed initial services from authentic SERVICES_DATA if Supabase table is empty
 */
export async function seedInitialServicesIfEmpty(): Promise<Service[]> {
  if (!isSupabaseConfigured()) {
    return SERVICES_DATA.map((s, idx) => mapStaticServiceToFullService(s, idx));
  }

  try {
    const client = getSupabase();
    const { data: existing, error } = await (client.from('services') as any).select('id').limit(1);
    if (!error && existing && existing.length > 0) {
      return await fetchAllServicesAdmin();
    }

    console.log('Services table is empty. Seeding authentic spa services into Supabase...');
    const rows = SERVICES_DATA.map((s, idx) => {
      const full = mapStaticServiceToFullService(s, idx);
      return mapServiceToSupabaseRow(full);
    });

    await (client.from('services') as any).upsert(rows);
    return await fetchAllServicesAdmin();
  } catch (err) {
    console.warn('Seeding initial services notice:', err);
    return SERVICES_DATA.map((s, idx) => mapStaticServiceToFullService(s, idx));
  }
}

/**
 * Synchronous initial services from cache or static data
 */
export function getInitialServices(): Service[] {
  const cached = getCachedData<Service[]>(CACHE_KEYS.SERVICES);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached;
  }
  return SERVICES_DATA.map((s, idx) => mapStaticServiceToFullService(s, idx));
}

/**
 * Real-time listener for public active services with automatic cache synchronization
 */
export function subscribeToPublicServices(callback: (services: Service[]) => void): () => void {
  fetchPublicServices().then(callback);
  return subscribeToSupabaseTable('services', async () => {
    const updated = await fetchPublicServices();
    callback(updated);
  });
}

/**
 * Fetch active services for public website (ordered by display order)
 */
export async function fetchPublicServices(): Promise<Service[]> {
  if (!isSupabaseConfigured()) {
    return getInitialServices();
  }

  try {
    const { data, error } = await (getSupabase().from('services') as any)
      .select('*')
      .eq('status', 'active')
      .order('display_order', { ascending: true });

    if (!error && data && data.length > 0) {
      const list = data.map(mapSupabaseServiceToService);
      setCachedData(CACHE_KEYS.SERVICES, list);
      return list;
    }
  } catch (err) {
    console.warn('[Supabase] fetchPublicServices error:', err);
  }

  return getInitialServices();
}

/**
 * Fetch all services (both Active and Inactive) for Admin CMS
 */
export async function fetchAllServicesAdmin(): Promise<Service[]> {
  if (!isSupabaseConfigured()) {
    return SERVICES_DATA.map((s, idx) => mapStaticServiceToFullService(s, idx));
  }

  try {
    const { data, error } = await (getSupabase().from('services') as any)
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map(mapSupabaseServiceToService);
    }

    return await seedInitialServicesIfEmpty();
  } catch (err) {
    console.error('Error fetching admin services:', err);
    return SERVICES_DATA.map((s, idx) => mapStaticServiceToFullService(s, idx));
  }
}

/**
 * Create a new service in Supabase
 */
export async function createService(data: Omit<Service, 'id'>): Promise<string> {
  const slug = data.slug?.trim() || generateServiceSlug(data.name);
  const id = `svc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newService: Service = {
    ...data,
    id,
    name: data.name.trim(),
    slug: slug,
    shortDescription: data.shortDescription.trim(),
    fullDescription: data.fullDescription.trim(),
    image: data.image || 'https://lh3.googleusercontent.com/geougc/AF1QipPDGlDn8JiA8nC2xubXZCHfaV8c7sQkBsZr3iWL=w1200-h800-k-no',
    imageAlt: data.imageAlt?.trim() || `${data.name.trim()} treatment at Euro Spa Center Banani`,
    category: data.category?.trim() || 'Massage Therapy',
    price: data.price?.trim() || data.priceOptions?.[0]?.price || 'BDT 3,500',
    durationRange: data.durationRange?.trim() || '60 Minutes',
    status: data.status || 'active',
    popular: Boolean(data.popular),
    displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : 99,
    benefits: Array.isArray(data.benefits) ? data.benefits : [],
    priceOptions: Array.isArray(data.priceOptions) ? data.priceOptions : [],
    galleryImages: Array.isArray(data.galleryImages) ? data.galleryImages : [data.image],
    serviceAreas: Array.isArray(data.serviceAreas) && data.serviceAreas.length > 0 
      ? data.serviceAreas 
      : ['Dhaka', 'Banani', 'Gulshan'],
    bookingCta: data.bookingCta?.trim() || 'Book This Treatment',

    // SEO
    seoTitle: data.seoTitle?.trim() || `${data.name.trim()} in Banani, Dhaka | ${SPA_INFO.name}`,
    metaDescription: data.metaDescription?.trim() || data.shortDescription.trim(),
    focusKeyword: data.focusKeyword?.trim() || `${data.name.trim().toLowerCase()} banani`,
    secondaryKeywords: Array.isArray(data.secondaryKeywords) ? data.secondaryKeywords : [],
    canonicalUrl: data.canonicalUrl?.trim() || buildCanonicalUrl(`/services/${slug}`),
    robotsIndex: data.robotsIndex !== false,
    robotsFollow: data.robotsFollow !== false,
    ogTitle: data.ogTitle?.trim() || data.seoTitle?.trim() || `${data.name.trim()} | ${SPA_INFO.name}`,
    ogDescription: data.ogDescription?.trim() || data.metaDescription?.trim() || data.shortDescription.trim(),
    ogImage: data.ogImage?.trim() || data.image || '',
    schemaType: data.schemaType?.trim() || 'HealthAndBeautyBusiness',
    customSchema: data.customSchema?.trim() || '',
    updatedAt: new Date().toISOString()
  };

  const client = getSupabase();
  const supaRow = mapServiceToSupabaseRow(newService);
  const { error } = await (client.from('services') as any).upsert(supaRow);
  if (error) {
    console.error('[Supabase] createService error:', error);
    throw new Error(error.message || 'Failed to create service in Supabase.');
  }

  const current = getInitialServices();
  setCachedData(CACHE_KEYS.SERVICES, [...current, newService]);
  return id;
}

/**
 * Update an existing service in Supabase
 */
export async function updateService(id: string, updates: Partial<Service>): Promise<void> {
  const nowStr = new Date().toISOString();
  const cleanedUpdates: any = {
    ...updates,
    updatedAt: nowStr
  };

  Object.keys(cleanedUpdates).forEach(key => {
    if (cleanedUpdates[key] === undefined) {
      delete cleanedUpdates[key];
    }
  });

  const client = getSupabase();
  const supaRow = mapServiceToSupabaseRow({ ...cleanedUpdates, id });
  const { error } = await (client.from('services') as any).update(supaRow).eq('id', id);
  if (error) {
    console.error('[Supabase] updateService error:', error);
    throw new Error(error.message || 'Failed to update service in Supabase.');
  }

  const current = getInitialServices();
  const updatedList = current.map(s => s.id === id ? { ...s, ...cleanedUpdates } : s);
  setCachedData(CACHE_KEYS.SERVICES, updatedList);
}

/**
 * Delete a service from Supabase
 */
export async function deleteService(id: string): Promise<void> {
  const client = getSupabase();
  const { error } = await (client.from('services') as any).delete().eq('id', id);
  if (error) {
    console.error('[Supabase] deleteService error:', error);
    throw new Error(error.message || 'Failed to delete service from Supabase.');
  }

  const current = getInitialServices();
  const filtered = current.filter(s => s.id !== id);
  setCachedData(CACHE_KEYS.SERVICES, filtered);
}

/**
 * Duplicate an existing service
 */
export async function duplicateService(service: Service): Promise<string> {
  const newName = `${service.name} (Copy)`;
  let newSlug = `${service.slug || generateServiceSlug(service.name)}-copy`;

  let isUnique = await checkServiceSlugAvailability(newSlug);
  let counter = 1;
  while (!isUnique) {
    newSlug = `${service.slug || generateServiceSlug(service.name)}-copy-${counter}`;
    isUnique = await checkServiceSlugAvailability(newSlug);
    counter++;
  }

  const payload: Omit<Service, 'id'> = {
    ...service,
    name: newName,
    slug: newSlug,
    status: 'inactive',
    displayOrder: (service.displayOrder ?? 0) + 1,
    seoTitle: `${newName} in Banani, Dhaka | ${SPA_INFO.name}`,
    canonicalUrl: buildCanonicalUrl(`/services/${newSlug}`)
  };

  return await createService(payload);
}

/**
 * Quick toggle active / inactive status
 */
export async function toggleServiceStatus(service: Service): Promise<'active' | 'inactive'> {
  const newStatus = service.status === 'active' ? 'inactive' : 'active';
  await updateService(service.id, { status: newStatus });
  return newStatus;
}

/**
 * Reorder services display order
 */
export async function reorderServices(orderedServiceIds: string[]): Promise<void> {
  const client = getSupabase();
  const now = new Date().toISOString();
  await Promise.all(
    orderedServiceIds.map((id, index) =>
      (client.from('services') as any)
        .update({ display_order: index, updated_at: now })
        .eq('id', id)
    )
  );
}

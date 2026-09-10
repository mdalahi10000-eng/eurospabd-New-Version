import { 
  isSupabaseConfigured, 
  getSupabase, 
  deleteFromSupabaseStorage, 
  subscribeToSupabaseTable,
  checkIsAdmin
} from '../supabase';
import { mapSupabaseGalleryToGallery, mapGalleryToSupabaseRow } from './unifiedBackend';
import { PhotoItem, GalleryImage } from '../types';
import { PHOTOS_DATA, SPA_INFO } from '../data/spaData';
import { getCachedData, setCachedData, CACHE_KEYS } from './cacheService';

export const STANDARD_GALLERY_CATEGORIES = [
  'Spa Interior',
  'Treatment Room',
  'Services',
  'Team',
  'Facilities',
  'Other'
] as const;

export type StandardGalleryCategory = typeof STANDARD_GALLERY_CATEGORIES[number];

/**
 * Standardize category mapping from legacy data
 */
export function normalizeCategory(cat: string): string {
  if (cat === 'Rooms') return 'Treatment Room';
  if (cat === 'Ambience') return 'Spa Interior';
  if (cat === 'Facilities') return 'Facilities';
  if (cat === 'Services') return 'Services';
  if (cat === 'Team') return 'Team';
  if (cat === 'Other') return 'Other';
  return cat || 'Spa Interior';
}

/**
 * Clean & generate SEO-friendly image filename:
 * e.g. "My Room Photo!.png" -> "euro-spa-banani-my-room-photo.png"
 */
export function generateSeoImageFilename(title: string, originalFileName?: string): string {
  let extension = 'jpg';
  if (originalFileName && originalFileName.includes('.')) {
    extension = originalFileName.split('.').pop()?.toLowerCase() || 'jpg';
  }

  const baseTitle = title || originalFileName?.replace(/\.[^/.]+$/, '') || 'spa-center';
  const cleanBase = baseTitle
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${cleanBase}.${extension}`;
}

/**
 * Map static authentic photo into full GalleryImage with rich SEO metadata
 */
export function mapStaticPhotoToGalleryImage(photo: PhotoItem, index: number): GalleryImage {
  const normCat = normalizeCategory(photo.category);
  const altText = photo.altText || `${photo.title} at ${SPA_INFO.name}, Road 6 Banani`;
  const caption = photo.caption || `${photo.title} providing a tranquil wellness atmosphere in Banani, Dhaka.`;
  const description = photo.description || `${photo.title} showcasing high hygienic standards, certified therapists, and peaceful massage suites at Euro Spa Center.`;

  return {
    id: photo.id,
    title: photo.title,
    category: normCat,
    image: photo.image,
    fallbackImage: photo.fallbackImage || '',
    altText,
    caption,
    description,
    displayOrder: photo.displayOrder ?? index,
    status: photo.status || 'active',
    storagePath: photo.storagePath || '',
    fileName: photo.fileName || photo.image.split('/').pop()?.split('?')[0] || `photo-${photo.id}.jpg`,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Upload image file to Supabase Storage under bucket `spa-assets`
 */
export async function uploadGalleryFile(
  file: File,
  imageId: string,
  titleForSeo?: string,
  onProgress?: (percentage: number) => void
): Promise<{
  downloadUrl: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}> {
  // Validate and resolve MIME type
  const rawType = (file.type || '').toLowerCase().trim();
  let resolvedType = rawType;
  if (!resolvedType) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg') resolvedType = 'image/jpeg';
    else if (ext === 'png') resolvedType = 'image/png';
    else if (ext === 'webp') resolvedType = 'image/webp';
    else if (ext === 'svg') resolvedType = 'image/svg+xml';
  }

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/svg+xml'];
  if (!allowedMimeTypes.includes(resolvedType)) {
    throw new Error('Unsupported image format. Please upload WebP, JPEG, PNG, or SVG images.');
  }

  // Validate Supabase is configured
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
  }

  // Generate SEO-friendly sanitized filename
  const seoFileName = generateSeoImageFilename(titleForSeo || file.name, file.name);
  const cleanFileName = seoFileName.replace(/[^\w.-]/g, '_');
  const filePath = `gallery/${imageId}/${Date.now()}_${cleanFileName}`;

  // Smooth progressive upload UI feedback
  if (onProgress) onProgress(15);
  let currentPct = 15;
  const progressInterval = setInterval(() => {
    if (currentPct < 90) {
      currentPct += Math.floor(Math.random() * 15) + 5;
      if (currentPct > 90) currentPct = 90;
      if (onProgress) onProgress(currentPct);
    }
  }, 100);

  try {
    const client = getSupabase();

    // Verify session exists before attempting storage upload
    const { data: { session } } = await client.auth.getSession();
    if (!session) {
      throw new Error('Authentication required. Please sign in to your administrator account before uploading.');
    }

    // Upload directly to the existing public 'spa-assets' bucket
    const { data, error: uploadError } = await client.storage
      .from('spa-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: resolvedType,
      });

    if (uploadError) {
      console.error('[Supabase Storage] Upload error detail:', uploadError);
      throw uploadError;
    }

    // Generate public URL from the spa-assets bucket
    const { data: publicUrlData } = client.storage
      .from('spa-assets')
      .getPublicUrl(filePath);

    clearInterval(progressInterval);
    if (onProgress) onProgress(100);

    return {
      downloadUrl: publicUrlData.publicUrl,
      storagePath: filePath,
      fileName: seoFileName,
      fileSize: file.size,
      mimeType: resolvedType
    };
  } catch (err: any) {
    clearInterval(progressInterval);
    console.error('[Supabase Storage] Gallery upload error:', err);
    throw new Error(err.message || 'Failed to upload image to Supabase Storage.');
  }
}

/**
 * Seed initial gallery from authentic PHOTOS_DATA if Supabase table is empty
 */
export async function seedInitialGalleryIfEmpty(): Promise<GalleryImage[]> {
  if (!isSupabaseConfigured()) {
    return PHOTOS_DATA.map((p, idx) => mapStaticPhotoToGalleryImage(p, idx));
  }

  try {
    const client = getSupabase();
    const { data: { session } } = await client.auth.getSession();
    if (!session) {
      return PHOTOS_DATA.map((p, idx) => mapStaticPhotoToGalleryImage(p, idx));
    }
    const isAdmin = await checkIsAdmin(session.user);
    if (!isAdmin) {
      return PHOTOS_DATA.map((p, idx) => mapStaticPhotoToGalleryImage(p, idx));
    }

    const { data: existing, error } = await (client.from('gallery') as any).select('id').limit(1);
    if (!error && existing && existing.length > 0) {
      return await fetchAllGalleryAdmin();
    }

    console.log('Gallery table empty. Seeding authentic spa gallery into Supabase...');
    const rows = PHOTOS_DATA.map((photo, idx) => {
      const full = mapStaticPhotoToGalleryImage(photo, idx);
      return mapGalleryToSupabaseRow(full);
    });

    await (client.from('gallery') as any).upsert(rows);
    return await fetchAllGalleryAdmin();
  } catch (err) {
    console.warn('Seeding initial gallery notice:', err);
    return PHOTOS_DATA.map((p, idx) => mapStaticPhotoToGalleryImage(p, idx));
  }
}

/**
 * Returns the latest synchronously available active gallery images (from cache if available)
 */
export function getInitialGallery(): GalleryImage[] {
  const cached = getCachedData<GalleryImage[]>(CACHE_KEYS.GALLERY);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached;
  }
  return PHOTOS_DATA.map((p, idx) => mapStaticPhotoToGalleryImage(p, idx));
}

/**
 * Real-time listener for public active gallery images with automatic cache synchronization
 */
export function subscribeToPublicGallery(callback: (images: GalleryImage[]) => void): () => void {
  fetchPublicGallery().then(callback);
  return subscribeToSupabaseTable('gallery', async () => {
    const updated = await fetchPublicGallery();
    callback(updated);
  });
}

/**
 * Fetch active gallery images for public website
 * Inactive images are strictly filtered out
 */
export async function fetchPublicGallery(): Promise<GalleryImage[]> {
  if (!isSupabaseConfigured()) {
    return getInitialGallery();
  }

  try {
    const { data, error } = await (getSupabase().from('gallery') as any)
      .select('*')
      .eq('status', 'active')
      .order('display_order', { ascending: true });

    if (!error && data && data.length > 0) {
      const list = data.map(mapSupabaseGalleryToGallery);
      setCachedData(CACHE_KEYS.GALLERY, list);
      return list;
    }
  } catch (err) {
    console.warn('[Supabase] fetchPublicGallery error:', err);
  }

  return getInitialGallery();
}

/**
 * Fetch all gallery images for Admin CMS (includes active & inactive)
 */
export async function fetchAllGalleryAdmin(): Promise<GalleryImage[]> {
  if (!isSupabaseConfigured()) {
    return PHOTOS_DATA.map((p, idx) => mapStaticPhotoToGalleryImage(p, idx));
  }

  try {
    const { data, error } = await (getSupabase().from('gallery') as any)
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map(mapSupabaseGalleryToGallery);
    }

    return await seedInitialGalleryIfEmpty();
  } catch (err) {
    console.error('Admin gallery fetch notice:', err);
    return PHOTOS_DATA.map((p, idx) => mapStaticPhotoToGalleryImage(p, idx));
  }
}

/**
 * Create a new gallery image document in Supabase
 */
export async function createGalleryImage(
  data: Omit<GalleryImage, 'id'>, 
  customId?: string
): Promise<string> {
  const docId = customId || `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const payload: GalleryImage = {
    ...data,
    id: docId,
    status: data.status || 'active',
    category: data.category || 'Spa Interior',
    altText: data.altText?.trim() || `${data.title} at ${SPA_INFO.name}`,
    caption: data.caption || '',
    description: data.description || '',
    displayOrder: data.displayOrder ?? Date.now(),
    updatedAt: new Date().toISOString()
  };

  const client = getSupabase();
  const supaRow = mapGalleryToSupabaseRow(payload);
  const { error: supaErr } = await (client.from('gallery') as any).upsert(supaRow);
  if (supaErr) {
    console.error('[Supabase] createGalleryImage error:', supaErr);
    throw new Error(supaErr.message || 'Failed to save gallery item in Supabase.');
  }

  const current = getInitialGallery();
  setCachedData(CACHE_KEYS.GALLERY, [payload, ...current]);
  return docId;
}

/**
 * Update gallery image metadata in Supabase
 */
export async function updateGalleryImage(id: string, updates: Partial<GalleryImage>): Promise<void> {
  const nowStr = new Date().toISOString();
  const client = getSupabase();
  const supaRow = mapGalleryToSupabaseRow({ ...updates, id } as any);
  
  const { error: supaErr } = await (client.from('gallery') as any).update(supaRow).eq('id', id);
  if (supaErr) {
    console.error('[Supabase] updateGalleryImage error:', supaErr);
    throw new Error(supaErr.message || 'Failed to update gallery item in Supabase.');
  }

  const current = getInitialGallery();
  const updatedList = current.map(img => img.id === id ? { ...img, ...updates, updatedAt: nowStr } : img);
  setCachedData(CACHE_KEYS.GALLERY, updatedList);
}

/**
 * Toggle active / inactive status
 */
export async function toggleGalleryImageStatus(image: GalleryImage): Promise<'active' | 'inactive'> {
  const newStatus = image.status === 'active' ? 'inactive' : 'active';
  await updateGalleryImage(image.id, { status: newStatus });
  return newStatus;
}

/**
 * Delete a gallery image from Supabase (and Supabase storage)
 */
export async function deleteGalleryImage(id: string, storagePath?: string): Promise<void> {
  const client = getSupabase();
  const { error: supaErr } = await (client.from('gallery') as any).delete().eq('id', id);
  if (supaErr) {
    console.error('[Supabase] deleteGalleryImage error:', supaErr);
    throw new Error(supaErr.message || 'Failed to delete gallery item from Supabase.');
  }

  // Delete Supabase Storage file if uploaded
  if (storagePath) {
    try {
      await deleteFromSupabaseStorage('spa-assets', storagePath);
    } catch (e) {
      console.warn('[Supabase Storage] Storage file deletion notice:', e);
    }
  }

  // Proactively update cached gallery
  const current = getInitialGallery();
  setCachedData(CACHE_KEYS.GALLERY, current.filter(img => img.id !== id));
}

/**
 * Batch reorder gallery images in Supabase
 */
export async function reorderGalleryImages(orderedIds: string[]): Promise<void> {
  const now = new Date().toISOString();
  const client = getSupabase();
  await Promise.all(
    orderedIds.map((id, index) =>
      (client.from('gallery') as any)
        .update({ display_order: index, updated_at: now })
        .eq('id', id)
    )
  );
}

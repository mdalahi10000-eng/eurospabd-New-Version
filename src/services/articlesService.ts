import { 
  isSupabaseConfigured, 
  getSupabase, 
  uploadToSupabaseStorage, 
  subscribeToSupabaseTable 
} from '../supabase';
import { mapSupabaseArticleToArticle, mapArticleToSupabaseRow } from './unifiedBackend';
import { Article } from '../types';
import { SERVICES_DATA, PHOTOS_DATA } from '../data/spaData';
import { getCachedData, setCachedData, CACHE_KEYS } from './cacheService';

/**
 * Utility: generate SEO-friendly slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Utility: calculate estimated reading time in minutes
 */
export function calculateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

/**
 * Check if a slug is already taken by another article in Supabase
 */
export async function checkSlugAvailability(slug: string, excludeId?: string): Promise<boolean> {
  if (!slug) return false;
  if (!isSupabaseConfigured()) return true;
  try {
    const { data, error } = await (getSupabase().from('articles') as any)
      .select('id')
      .eq('slug', slug);

    if (error || !data || data.length === 0) return true;
    if (excludeId && data.length === 1 && data[0].id === excludeId) {
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Error checking slug availability:', err);
    return true;
  }
}

/**
 * Upload an article featured image to Supabase Storage
 */
export async function uploadArticleImage(
  file: File, 
  onProgress?: (percentage: number) => void
): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  if (onProgress) onProgress(20);

  const res = await uploadToSupabaseStorage('articles', sanitizedName, file);
  if (!res.url) {
    throw new Error('Failed to upload image to Supabase Storage.');
  }

  if (onProgress) onProgress(100);
  return res.url;
}

/**
 * Fetch all articles (both Draft and Published) for the Admin CMS
 */
export async function fetchAllArticlesAdmin(): Promise<Article[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await (getSupabase().from('articles') as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map(mapSupabaseArticleToArticle);
    }
  } catch (err) {
    console.warn('[Supabase] fetchAllArticlesAdmin error:', err);
  }

  return [];
}

/**
 * Create a new article in Supabase
 */
export async function createArticle(data: Omit<Article, 'id'>): Promise<string> {
  const readingTime = calculateReadingTime(data.content);
  const nowStr = new Date().toISOString();
  const id = `art_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const articlePayload: Article = {
    id,
    title: data.title.trim(),
    slug: data.slug.trim(),
    excerpt: data.excerpt.trim(),
    content: data.content,
    featuredImage: data.featuredImage || '/photos/Image_Aug.png',
    imageAlt: data.imageAlt?.trim() || data.title.trim(),
    category: data.category?.trim() || 'Therapy & Wellness',
    author: data.author?.trim() || 'Euro Spa Team',
    status: data.status || 'draft',
    publishedAt: data.publishedAt || (data.status === 'published' ? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''),
    updatedAt: nowStr,
    seoTitle: data.seoTitle?.trim() || `${data.title.trim()} | Euro Spa Center Banani`,
    metaDescription: data.metaDescription?.trim() || data.excerpt.trim(),
    focusKeyword: data.focusKeyword?.trim() || '',
    canonicalUrl: data.canonicalUrl?.trim() || '',
    ogTitle: data.ogTitle?.trim() || data.seoTitle?.trim() || data.title.trim(),
    ogDescription: data.ogDescription?.trim() || data.metaDescription?.trim() || data.excerpt.trim(),
    ogImage: data.ogImage?.trim() || data.featuredImage || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    readingTimeMinutes: readingTime
  };

  const client = getSupabase();
  const supaRow = mapArticleToSupabaseRow(articlePayload);
  const { error } = await (client.from('articles') as any).upsert(supaRow);

  if (error) {
    console.error('[Supabase] createArticle error:', error);
    throw new Error(error.message || 'Failed to create article in Supabase.');
  }

  if (articlePayload.status === 'published') {
    const current = getInitialArticles();
    setCachedData(CACHE_KEYS.ARTICLES, [articlePayload, ...current]);
  }
  return id;
}

/**
 * Update an existing article in Supabase
 */
export async function updateArticle(id: string, updates: Partial<Article>): Promise<void> {
  const nowStr = new Date().toISOString();
  const cleanedUpdates: any = {
    ...updates,
    updatedAt: nowStr
  };

  if (updates.content) {
    cleanedUpdates.readingTimeMinutes = calculateReadingTime(updates.content);
  }

  Object.keys(cleanedUpdates).forEach(key => {
    if (cleanedUpdates[key] === undefined) {
      delete cleanedUpdates[key];
    }
  });

  const client = getSupabase();
  const supaRow = mapArticleToSupabaseRow({ ...cleanedUpdates, id } as any);
  const { error } = await (client.from('articles') as any).update(supaRow).eq('id', id);

  if (error) {
    console.error('[Supabase] updateArticle error:', error);
    throw new Error(error.message || 'Failed to update article in Supabase.');
  }

  const current = getInitialArticles();
  if (cleanedUpdates.status === 'draft') {
    setCachedData(CACHE_KEYS.ARTICLES, current.filter(a => a.id !== id));
  } else {
    setCachedData(CACHE_KEYS.ARTICLES, current.map(a => a.id === id ? { ...a, ...cleanedUpdates } : a));
  }
}

/**
 * Delete an article from Supabase
 */
export async function deleteArticle(id: string): Promise<void> {
  const client = getSupabase();
  const { error } = await (client.from('articles') as any).delete().eq('id', id);

  if (error) {
    console.error('[Supabase] deleteArticle error:', error);
    throw new Error(error.message || 'Failed to delete article.');
  }

  const current = getInitialArticles();
  setCachedData(CACHE_KEYS.ARTICLES, current.filter(a => a.id !== id));
}

/**
 * Quick toggle publish / unpublish status
 */
export async function toggleArticlePublish(article: Article): Promise<'draft' | 'published'> {
  const newStatus = article.status === 'published' ? 'draft' : 'published';
  const updates: Partial<Article> = {
    status: newStatus
  };

  if (newStatus === 'published' && !article.publishedAt) {
    updates.publishedAt = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  await updateArticle(article.id, updates);
  return newStatus;
}

/**
 * Returns the latest synchronously available published articles (from cache if available)
 */
export function getInitialArticles(): Article[] {
  const cached = getCachedData<Article[]>(CACHE_KEYS.ARTICLES);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached;
  }
  return [];
}

/**
 * Real-time listener for published articles with automatic cache synchronization
 */
export function subscribeToPublishedArticles(callback: (articles: Article[]) => void): () => void {
  fetchPublishedArticles().then(callback);
  return subscribeToSupabaseTable('articles', async () => {
    const updated = await fetchPublishedArticles();
    callback(updated);
  });
}

/**
 * Fetch all published articles from Supabase
 */
export async function fetchPublishedArticles(): Promise<Article[]> {
  if (!isSupabaseConfigured()) {
    return getInitialArticles();
  }

  try {
    const { data, error } = await (getSupabase().from('articles') as any)
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const list = data.map(mapSupabaseArticleToArticle);
      setCachedData(CACHE_KEYS.ARTICLES, list);
      return list;
    }
  } catch (err) {
    console.warn('[Supabase] fetchPublishedArticles error:', err);
  }

  return getInitialArticles();
}

/**
 * Fetch a single published article by its SEO-friendly slug
 */
export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await (getSupabase().from('articles') as any)
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (!error && data) {
      return mapSupabaseArticleToArticle(data);
    }
  } catch (err) {
    console.warn('[Supabase] fetchArticleBySlug error:', err);
  }

  return null;
}

/**
 * Fetch related published articles (excluding the current one)
 */
export async function fetchRelatedArticles(currentArticleId: string, category?: string): Promise<Article[]> {
  try {
    const all = await fetchPublishedArticles();
    return all
      .filter(a => a.id !== currentArticleId && a.status === 'published')
      .slice(0, 3);
  } catch (err) {
    console.warn('Related articles query error:', err);
    return [];
  }
}

export interface AdminStats {
  totalServices: number;
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  totalReviews: number;
  approvedReviews: number;
  averageRating: number;
  publishedArticles: number;
  totalArticles: number;
  galleryImages: number;
  recentAppointments: any[];
  recentReviews: any[];
}

/**
 * Fetch real statistics for the Admin Dashboard from Supabase
 */
export async function fetchAdminStats(): Promise<AdminStats> {
  let totalAppointments = 0;
  let pendingAppointments = 0;
  let confirmedAppointments = 0;
  let totalReviews = 0;
  let approvedReviews = 0;
  let averageRating = 4.9;
  let publishedArticles = 0;
  let totalArticles = 0;
  let totalServices = SERVICES_DATA.length;
  let galleryImages = PHOTOS_DATA.length;
  let recentAppointments: any[] = [];
  let recentReviews: any[] = [];

  if (!isSupabaseConfigured()) {
    return {
      totalServices,
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      totalReviews,
      approvedReviews,
      averageRating,
      publishedArticles,
      totalArticles,
      galleryImages,
      recentAppointments,
      recentReviews
    };
  }

  const client = getSupabase();

  try {
    const { data: appts } = await (client.from('appointments') as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (appts) {
      totalAppointments = appts.length;
      recentAppointments = appts.slice(0, 5);
      appts.forEach((a: any) => {
        if (a.status === 'pending') pendingAppointments++;
        else if (a.status === 'confirmed') confirmedAppointments++;
      });
    }
  } catch (e) {
    console.warn('Appointments stats notice:', e);
  }

  try {
    const { data: revs } = await (client.from('reviews') as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (revs) {
      totalReviews = revs.length;
      let sumRate = 0;
      revs.forEach((r: any) => {
        if (r.status !== 'hidden') approvedReviews++;
        sumRate += typeof r.rating === 'number' ? r.rating : 5;
      });
      if (revs.length > 0) {
        averageRating = parseFloat((sumRate / revs.length).toFixed(1));
      }
      recentReviews = revs.slice(0, 4);
    }
  } catch (e) {
    console.warn('Reviews stats notice:', e);
  }

  try {
    const { data: arts } = await (client.from('articles') as any).select('id, status');
    if (arts) {
      totalArticles = arts.length;
      publishedArticles = arts.filter((a: any) => a.status === 'published').length;
    }
  } catch (e) {
    console.warn('Articles stats notice:', e);
  }

  try {
    const { data: svcs } = await (client.from('services') as any).select('id');
    if (svcs && svcs.length > 0) {
      totalServices = svcs.length;
    }
  } catch (e) {
    console.warn('Services count notice:', e);
  }

  try {
    const { data: gal } = await (client.from('gallery') as any).select('id');
    if (gal && gal.length > 0) {
      galleryImages = gal.length;
    }
  } catch (e) {
    console.warn('Gallery count notice:', e);
  }

  return {
    totalServices,
    totalAppointments,
    pendingAppointments,
    confirmedAppointments,
    totalReviews,
    approvedReviews,
    averageRating,
    publishedArticles,
    totalArticles,
    galleryImages,
    recentAppointments,
    recentReviews
  };
}

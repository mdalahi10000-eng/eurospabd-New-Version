import { 
  collection, 
  getDocs, 
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query, 
  where, 
  limit,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, withTimeout } from '../firebase';
import { isSupabaseConfigured, getSupabase, uploadToSupabaseStorage, subscribeToSupabaseTable } from '../supabase';
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
 * Check if a slug is already taken by another article
 */
export async function checkSlugAvailability(slug: string, excludeId?: string): Promise<boolean> {
  if (!slug) return false;
  try {
    const q = query(collection(db, 'articles'), where('slug', '==', slug));
    const snap = await getDocs(q);
    if (snap.empty) return true;
    if (excludeId && snap.docs.length === 1 && snap.docs[0].id === excludeId) {
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Error checking slug availability:', err);
    return true; // Fallback to allow submission
  }
}

/**
 * Upload an article featured image to Firebase Storage (with Supabase Storage support)
 */
export async function uploadArticleImage(
  file: File, 
  onProgress?: (percentage: number) => void
): Promise<string> {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

  if (isSupabaseConfigured()) {
    try {
      const res = await uploadToSupabaseStorage('articles', sanitizedName, file);
      if (res.url) {
        if (onProgress) onProgress(100);
        return res.url;
      }
    } catch (supaErr) {
      console.warn('[Supabase Storage] article image upload fallback:', supaErr);
    }
  }

  // Clean filename and add timestamp
  const storagePath = `articles/${Date.now()}_${sanitizedName}`;
  const storageRef = ref(storage, storagePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type || 'image/jpeg',
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(progress);
        }
      },
      (error) => {
        console.error('Firebase Storage upload error:', error);
        reject(new Error(error.message || 'Failed to upload image to Firebase Storage.'));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/**
 * Fetch all articles (both Draft and Published) for the Admin CMS
 */
export async function fetchAllArticlesAdmin(): Promise<Article[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await (getSupabase().from('articles') as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map(mapSupabaseArticleToArticle);
      }
    } catch (err) {
      console.warn('[Supabase] fetchAllArticlesAdmin fallback to Firestore:', err);
    }
  }

  try {
    const snap = await getDocs(collection(db, 'articles'));
    if (!snap.empty) {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as Article));

      // Sort by updatedAt or createdAt desc
      return list.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.publishedAt || (a.createdAt?.toDate ? a.createdAt.toDate() : 0)).getTime();
        const timeB = new Date(b.updatedAt || b.publishedAt || (b.createdAt?.toDate ? b.createdAt.toDate() : 0)).getTime();
        return timeB - timeA;
      });
    }
  } catch (err) {
    console.error('Error fetching admin articles:', err);
  }
  return [];
}

/**
 * Create a new article in Firestore
 */
export async function createArticle(data: Omit<Article, 'id'>): Promise<string> {
  const readingTime = calculateReadingTime(data.content);
  const nowStr = new Date().toISOString();

  const articlePayload = {
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
    createdAt: serverTimestamp(),
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

  const docRef = await addDoc(collection(db, 'articles'), articlePayload);

  if (isSupabaseConfigured()) {
    try {
      const supaRow = mapArticleToSupabaseRow({ ...articlePayload, id: docRef.id } as any);
      await (getSupabase().from('articles') as any).upsert(supaRow);
    } catch (err) {
      console.warn('[Supabase] createArticle sync error:', err);
    }
  }

  if (articlePayload.status === 'published') {
    const current = getInitialArticles();
    setCachedData(CACHE_KEYS.ARTICLES, [{ ...articlePayload, id: docRef.id }, ...current]);
  }
  return docRef.id;
}

/**
 * Update an existing article in Firestore
 */
export async function updateArticle(id: string, updates: Partial<Article>): Promise<void> {
  const articleRef = doc(db, 'articles', id);
  const nowStr = new Date().toISOString();

  const cleanedUpdates: any = {
    ...updates,
    updatedAt: nowStr
  };

  if (updates.content) {
    cleanedUpdates.readingTimeMinutes = calculateReadingTime(updates.content);
  }

  // Remove undefined fields
  Object.keys(cleanedUpdates).forEach(key => {
    if (cleanedUpdates[key] === undefined) {
      delete cleanedUpdates[key];
    }
  });

  await updateDoc(articleRef, cleanedUpdates);

  if (isSupabaseConfigured()) {
    try {
      const supaRow = mapArticleToSupabaseRow({ ...cleanedUpdates, id } as any);
      await (getSupabase().from('articles') as any).update(supaRow).eq('id', id);
    } catch (err) {
      console.warn('[Supabase] updateArticle sync error:', err);
    }
  }

  const current = getInitialArticles();
  if (cleanedUpdates.status === 'draft') {
    setCachedData(CACHE_KEYS.ARTICLES, current.filter(a => a.id !== id));
  } else {
    setCachedData(CACHE_KEYS.ARTICLES, current.map(a => a.id === id ? { ...a, ...cleanedUpdates } : a));
  }
}

/**
 * Delete an article from Firestore
 */
export async function deleteArticle(id: string): Promise<void> {
  const articleRef = doc(db, 'articles', id);
  await deleteDoc(articleRef);

  if (isSupabaseConfigured()) {
    try {
      await (getSupabase().from('articles') as any).delete().eq('id', id);
    } catch (err) {
      console.warn('[Supabase] deleteArticle sync error:', err);
    }
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

  // If publishing for the first time or missing publishedAt, populate it
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
  if (isSupabaseConfigured()) {
    fetchPublishedArticles().then(callback);
    return subscribeToSupabaseTable('articles', async () => {
      const updated = await fetchPublishedArticles();
      callback(updated);
    });
  }

  try {
    const q = query(
      collection(db, 'articles'),
      where('status', '==', 'published')
    );
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Article));

        const sorted = list.sort((a, b) => {
          const timeA = new Date(a.publishedAt || (a.createdAt?.toDate ? a.createdAt.toDate() : 0)).getTime();
          const timeB = new Date(b.publishedAt || (b.createdAt?.toDate ? b.createdAt.toDate() : 0)).getTime();
          return timeB - timeA;
        });

        setCachedData(CACHE_KEYS.ARTICLES, sorted);
        callback(sorted);
      } else {
        const initial = getInitialArticles();
        callback(initial);
      }
    }, (err) => {
      console.warn('subscribeToPublishedArticles onSnapshot notice:', err);
      const fallback = getInitialArticles();
      callback(fallback);
    });
  } catch (err) {
    console.warn('Error subscribing to published articles:', err);
    return () => {};
  }
}

/**
 * Fetch all published articles from Firestore.
 * Strictly queries Firebase Firestore without creating fake articles.
 * Returns an empty array if there are currently no published articles.
 */
export async function fetchPublishedArticles(): Promise<Article[]> {
  if (isSupabaseConfigured()) {
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
      console.warn('[Supabase] fetchPublishedArticles fallback to Firestore:', err);
    }
  }

  try {
    const q = query(
      collection(db, 'articles'),
      where('status', '==', 'published')
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Article));

      const sorted = list.sort((a, b) => {
        const timeA = new Date(a.publishedAt || (a.createdAt?.toDate ? a.createdAt.toDate() : 0)).getTime();
        const timeB = new Date(b.publishedAt || (b.createdAt?.toDate ? b.createdAt.toDate() : 0)).getTime();
        return timeB - timeA;
      });

      setCachedData(CACHE_KEYS.ARTICLES, sorted);
      return sorted;
    }
  } catch (err) {
    console.warn('Firestore articles query notice:', err);
  }

  return getInitialArticles();
}

/**
 * Fetch a single published article by its SEO-friendly slug.
 * Draft or unpublished articles will return null and are not publicly accessible.
 */
export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  if (isSupabaseConfigured()) {
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
      console.warn('[Supabase] fetchArticleBySlug fallback to Firestore:', err);
    }
  }

  try {
    const q = query(
      collection(db, 'articles'),
      where('slug', '==', slug),
      where('status', '==', 'published'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Article;
    }
  } catch (err) {
    console.warn('Article query error for slug:', slug, err);
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
 * Fetch real statistics for the Admin Dashboard from Firestore
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
  let recentAppointments: any[] = [];
  let recentReviews: any[] = [];

  try {
    const appointmentsSnap = await withTimeout(getDocs(collection(db, 'appointments')), 3000, null as any);
    if (appointmentsSnap) {
      totalAppointments = appointmentsSnap.size;
      const allAppts = appointmentsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as any));
      
      // Sort recent if timestamp exists
      allAppts.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      recentAppointments = allAppts.slice(0, 5);
      allAppts.forEach((a: any) => {
        if (a.status === 'pending') pendingAppointments++;
        else if (a.status === 'confirmed') confirmedAppointments++;
      });
    }
  } catch (e) {
    console.warn('Appointments count notice:', e);
  }

  try {
    const reviewsSnap = await withTimeout(getDocs(collection(db, 'reviews')), 3000, null as any);
    if (reviewsSnap) {
      totalReviews = reviewsSnap.size;
      const allRevs = reviewsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as any));
      
      let sumRate = 0;
      allRevs.forEach((r: any) => {
        if (r.status !== 'hidden') approvedReviews++;
        sumRate += typeof r.rating === 'number' ? r.rating : 5;
      });

      if (allRevs.length > 0) {
        averageRating = parseFloat((sumRate / allRevs.length).toFixed(1));
      }

      allRevs.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      recentReviews = allRevs.slice(0, 4);
    }
  } catch (e) {
    console.warn('Reviews count notice:', e);
  }

  try {
    const allArticlesSnap = await withTimeout(getDocs(collection(db, 'articles')), 3000, null as any);
    if (allArticlesSnap) {
      totalArticles = allArticlesSnap.size;
      const pubSnap = await withTimeout(
        getDocs(query(collection(db, 'articles'), where('status', '==', 'published'))),
        3000,
        null as any
      );
      if (pubSnap) {
        publishedArticles = pubSnap.size;
      }
    }
  } catch (e) {
    console.warn('Articles count notice:', e);
  }

  let totalServices = SERVICES_DATA.length;
  try {
    const servicesSnap = await withTimeout(getDocs(collection(db, 'services')), 3000, null as any);
    if (servicesSnap && !servicesSnap.empty) {
      totalServices = servicesSnap.size;
    }
  } catch (e) {
    console.warn('Services count notice:', e);
  }

  let galleryImages = PHOTOS_DATA.length;
  try {
    const gallerySnap = await withTimeout(getDocs(collection(db, 'gallery')), 3000, null as any);
    if (gallerySnap && !gallerySnap.empty) {
      galleryImages = gallerySnap.size;
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

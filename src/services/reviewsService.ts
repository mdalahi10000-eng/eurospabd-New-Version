import { 
  collection, 
  getDocs, 
  doc, 
  setDoc,
  addDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { isSupabaseConfigured, getSupabase, subscribeToSupabaseTable } from '../supabase';
import { INITIAL_REVIEWS } from '../data/spaData';
import { getCachedData, setCachedData, CACHE_KEYS } from './cacheService';

export type ReviewStatus = 'approved' | 'hidden';

export interface AdminReview {
  id: string;
  userId?: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  serviceTag?: string;
  status: ReviewStatus;
  adminResponse?: string;
  adminRespondedAt?: any;
  dateString?: string;
  verified?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

const REVIEWS_COLLECTION = collection(db, 'reviews');

/**
 * Seed existing initial reviews into Firestore if the collection is empty.
 * Ensures the Admin panel and public site share the exact same Firestore collection.
 */
export async function seedInitialReviewsIfEmpty(): Promise<AdminReview[]> {
  try {
    const snap = await getDocs(REVIEWS_COLLECTION);
    if (!snap.empty) {
      return snap.docs.map(docSnap => mapDocToAdminReview(docSnap));
    }

    // Seed the 21 existing real reviews from spaData
    const seededList: AdminReview[] = [];
    for (const rev of INITIAL_REVIEWS) {
      const docRef = doc(db, 'reviews', rev.id);
      const data = {
        userName: rev.name,
        userPhoto: rev.avatar || 'https://lh3.googleusercontent.com/a/default-user',
        rating: rev.rating || 5,
        comment: rev.reviewText || '',
        serviceTag: rev.serviceUsed || 'Signature Therapy',
        status: 'approved',
        dateString: rev.date || 'Recent Visit',
        verified: rev.verified ?? true,
        adminResponse: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(docRef, data);
      seededList.push({
        id: rev.id,
        ...data,
        status: 'approved'
      });
    }
    return seededList;
  } catch (err) {
    console.error('Error seeding initial reviews:', err);
    return [];
  }
}

function mapDocToAdminReview(docSnap: any): AdminReview {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    userId: data.userId || '',
    userName: data.userName || 'Valued Guest',
    userPhoto: data.userPhoto || '',
    rating: typeof data.rating === 'number' ? data.rating : 5,
    comment: data.comment || '',
    serviceTag: data.serviceTag || '',
    status: (data.status as ReviewStatus) || 'approved',
    adminResponse: data.adminResponse || '',
    adminRespondedAt: data.adminRespondedAt,
    dateString: data.dateString || '',
    verified: data.verified !== false,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
}

function parseTimestamp(val: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val?.toMillis === 'function') return val.toMillis();
  if (typeof val?.seconds === 'number') return val.seconds * 1000;
  if (typeof val === 'string') {
    const t = new Date(val).getTime();
    return isNaN(t) ? 0 : t;
  }
  return 0;
}

export async function fetchAdminReviews(): Promise<AdminReview[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await (getSupabase().from('reviews') as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const list: AdminReview[] = data.map((d: any) => ({
          id: d.id,
          userId: d.user_id || '',
          userName: d.user_name || 'Valued Guest',
          userPhoto: d.user_photo || '',
          rating: Number(d.rating) || 5,
          comment: d.comment || '',
          serviceTag: d.service_tag || '',
          status: (d.status as ReviewStatus) || 'approved',
          adminResponse: d.admin_response || '',
          adminRespondedAt: d.admin_responded_at,
          dateString: d.date_string || '',
          verified: d.verified !== false,
          createdAt: d.created_at,
          updatedAt: d.updated_at
        }));
        setCachedData(CACHE_KEYS.REVIEWS, list);
        return list;
      }
    } catch (err) {
      console.warn('[Supabase] fetchAdminReviews fallback to Firestore:', err);
    }
  }

  try {
    const snapshot = await getDocs(REVIEWS_COLLECTION);
    if (!snapshot.empty) {
      const list = snapshot.docs.map(docSnap => mapDocToAdminReview(docSnap));
      list.sort((a, b) => {
        const timeA = parseTimestamp(a.createdAt);
        const timeB = parseTimestamp(b.createdAt);
        if (timeA !== timeB) return timeB - timeA;
        return a.userName.localeCompare(b.userName);
      });
      return list;
    }
    return await seedInitialReviewsIfEmpty();
  } catch (error) {
    console.warn('Error fetching admin reviews:', error);
    return [];
  }
}

/**
 * Returns the latest synchronously available reviews (from cache if available)
 */
export function getInitialAdminReviews(): AdminReview[] {
  const cached = getCachedData<AdminReview[]>(CACHE_KEYS.REVIEWS);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached;
  }
  return [];
}

export function subscribeToAdminReviews(
  callback: (reviews: AdminReview[]) => void
): () => void {
  if (isSupabaseConfigured()) {
    fetchAdminReviews().then(callback);
    return subscribeToSupabaseTable('reviews', async () => {
      const updated = await fetchAdminReviews();
      callback(updated);
    });
  }

  try {
    return onSnapshot(REVIEWS_COLLECTION, async (snapshot) => {
      if (snapshot.empty) {
        // Auto-seed if empty
        const seeded = await seedInitialReviewsIfEmpty();
        if (seeded.length > 0) {
          setCachedData(CACHE_KEYS.REVIEWS, seeded);
          callback(seeded);
          return;
        }
      }
      const list = snapshot.docs.map(docSnap => mapDocToAdminReview(docSnap));
      list.sort((a, b) => {
        const timeA = parseTimestamp(a.createdAt);
        const timeB = parseTimestamp(b.createdAt);
        if (timeA !== timeB) return timeB - timeA;
        return a.userName.localeCompare(b.userName);
      });
      setCachedData(CACHE_KEYS.REVIEWS, list);
      callback(list);
    }, (err) => {
      console.warn('Reviews snapshot error:', err);
      fetchAdminReviews().then(res => callback(res));
    });
  } catch (e) {
    console.error('Could not subscribe to admin reviews:', e);
    return () => {};
  }
}

export async function updateReviewStatus(id: string, status: ReviewStatus): Promise<void> {
  const reviewDoc = doc(db, 'reviews', id);
  await updateDoc(reviewDoc, {
    status,
    updatedAt: serverTimestamp()
  });

  if (isSupabaseConfigured()) {
    try {
      await (getSupabase().from('reviews') as any).update({
        status,
        updated_at: new Date().toISOString()
      }).eq('id', id);
    } catch (e) {
      console.warn('[Supabase] updateReviewStatus sync error:', e);
    }
  }

  const current = getInitialAdminReviews();
  const updated = current.map(r => r.id === id ? { ...r, status } : r);
  setCachedData(CACHE_KEYS.REVIEWS, updated);
}

export async function updateReview(id: string, updates: Partial<AdminReview>): Promise<void> {
  const reviewDoc = doc(db, 'reviews', id);
  const payload: any = {
    ...updates,
    updatedAt: serverTimestamp()
  };
  delete payload.id;
  await updateDoc(reviewDoc, payload);

  if (isSupabaseConfigured()) {
    try {
      const supaUpdate: any = { updated_at: new Date().toISOString() };
      if (updates.userName) supaUpdate.user_name = updates.userName;
      if (updates.comment) supaUpdate.comment = updates.comment;
      if (updates.rating) supaUpdate.rating = updates.rating;
      if (updates.status) supaUpdate.status = updates.status;
      if (updates.serviceTag !== undefined) supaUpdate.service_tag = updates.serviceTag;
      if (updates.adminResponse !== undefined) supaUpdate.admin_response = updates.adminResponse;
      if (updates.dateString !== undefined) supaUpdate.date_string = updates.dateString;
      if (updates.verified !== undefined) supaUpdate.verified = updates.verified;

      await (getSupabase().from('reviews') as any).update(supaUpdate).eq('id', id);
    } catch (e) {
      console.warn('[Supabase] updateReview sync error:', e);
    }
  }

  const current = getInitialAdminReviews();
  const updated = current.map(r => r.id === id ? { ...r, ...updates } : r);
  setCachedData(CACHE_KEYS.REVIEWS, updated);
}

export async function createAdminReview(data: Omit<AdminReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const payload: any = {
    ...data,
    userName: data.userName.trim(),
    comment: data.comment.trim(),
    rating: Number(data.rating) || 5,
    status: data.status || 'approved',
    serviceTag: data.serviceTag?.trim() || 'Signature Therapy',
    userPhoto: data.userPhoto?.trim() || 'https://lh3.googleusercontent.com/a/default-user',
    verified: data.verified ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const docRef = await addDoc(REVIEWS_COLLECTION, payload);

  if (isSupabaseConfigured()) {
    try {
      await (getSupabase().from('reviews') as any).upsert({
        id: docRef.id,
        user_name: payload.userName,
        user_photo: payload.userPhoto,
        rating: payload.rating,
        comment: payload.comment,
        service_tag: payload.serviceTag,
        status: payload.status,
        verified: payload.verified,
        date_string: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn('[Supabase] createAdminReview sync error:', e);
    }
  }

  const current = getInitialAdminReviews();
  setCachedData(CACHE_KEYS.REVIEWS, [{ ...payload, id: docRef.id }, ...current]);
  return docRef.id;
}

export async function saveAdminResponse(id: string, adminResponse: string): Promise<void> {
  const reviewDoc = doc(db, 'reviews', id);
  await updateDoc(reviewDoc, {
    adminResponse: adminResponse.trim(),
    adminRespondedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  if (isSupabaseConfigured()) {
    try {
      await (getSupabase().from('reviews') as any).update({
        admin_response: adminResponse.trim(),
        admin_responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq('id', id);
    } catch (e) {
      console.warn('[Supabase] saveAdminResponse sync error:', e);
    }
  }

  const current = getInitialAdminReviews();
  const updated = current.map(r => r.id === id ? { ...r, adminResponse: adminResponse.trim() } : r);
  setCachedData(CACHE_KEYS.REVIEWS, updated);
}

export async function deleteReview(id: string): Promise<void> {
  const reviewDoc = doc(db, 'reviews', id);
  await deleteDoc(reviewDoc);

  if (isSupabaseConfigured()) {
    try {
      await (getSupabase().from('reviews') as any).delete().eq('id', id);
    } catch (e) {
      console.warn('[Supabase] deleteReview sync error:', e);
    }
  }

  const current = getInitialAdminReviews();
  const updated = current.filter(r => r.id !== id);
  setCachedData(CACHE_KEYS.REVIEWS, updated);
}

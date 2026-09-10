import { isSupabaseConfigured, getSupabase, subscribeToSupabaseTable, requireAdmin } from '../supabase';
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

/**
 * Seed existing initial reviews into Supabase if table is empty.
 */
export async function seedInitialReviewsIfEmpty(): Promise<AdminReview[]> {
  if (!isSupabaseConfigured()) {
    return INITIAL_REVIEWS.map(r => ({
      id: r.id,
      userName: r.name,
      userPhoto: r.avatar || 'https://lh3.googleusercontent.com/a/default-user',
      rating: r.rating || 5,
      comment: r.reviewText || '',
      serviceTag: r.serviceUsed || 'Signature Therapy',
      status: 'approved',
      dateString: r.date || 'Recent Visit',
      verified: r.verified ?? true,
      adminResponse: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }

  try {
    const client = getSupabase();
    const { data: existing } = await (client.from('reviews') as any).select('id').limit(1);
    if (existing && existing.length > 0) {
      return await fetchAdminReviews();
    }

    const rows = INITIAL_REVIEWS.map(rev => ({
      id: rev.id,
      user_name: rev.name,
      user_photo: rev.avatar || 'https://lh3.googleusercontent.com/a/default-user',
      rating: rev.rating || 5,
      comment: rev.reviewText || '',
      service_tag: rev.serviceUsed || 'Signature Therapy',
      status: 'approved',
      date_str: rev.date || 'Recent Visit',
      verified: rev.verified ?? true,
      admin_response: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    await (client.from('reviews') as any).upsert(rows);
    return await fetchAdminReviews();
  } catch (err) {
    console.error('Error seeding initial reviews:', err);
    return [];
  }
}

export async function fetchAdminReviews(): Promise<AdminReview[]> {
  if (!isSupabaseConfigured()) {
    return getInitialAdminReviews();
  }

  try {
    const { data, error } = await (getSupabase().from('reviews') as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const list: AdminReview[] = data.map((d: any) => ({
        id: d.id,
        userId: d.user_id || '',
        userName: d.user_name || d.name || 'Valued Guest',
        userPhoto: d.user_photo || d.avatar || 'https://lh3.googleusercontent.com/a/default-user',
        rating: Number(d.rating) || 5,
        comment: d.comment || d.review_text || '',
        serviceTag: d.service_tag || d.service_used || 'Signature Therapy',
        status: (d.status as ReviewStatus) || 'approved',
        adminResponse: d.admin_response || '',
        adminRespondedAt: d.admin_responded_at,
        dateString: d.date_str || d.date_string || d.date || 'Recent Visit',
        verified: d.verified !== false,
        createdAt: d.created_at,
        updatedAt: d.updated_at
      }));
      setCachedData(CACHE_KEYS.REVIEWS, list);
      return list;
    }

    return await seedInitialReviewsIfEmpty();
  } catch (err) {
    console.warn('[Supabase] fetchAdminReviews error:', err);
    return getInitialAdminReviews();
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
  return INITIAL_REVIEWS.map(r => ({
    id: r.id,
    userName: r.name,
    userPhoto: r.avatar || 'https://lh3.googleusercontent.com/a/default-user',
    rating: r.rating || 5,
    comment: r.reviewText || '',
    serviceTag: r.serviceUsed || 'Signature Therapy',
    status: 'approved',
    dateString: r.date || 'Recent Visit',
    verified: r.verified ?? true,
    adminResponse: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
}

export function subscribeToAdminReviews(
  callback: (reviews: AdminReview[]) => void
): () => void {
  fetchAdminReviews().then(callback);
  return subscribeToSupabaseTable('reviews', async () => {
    const updated = await fetchAdminReviews();
    callback(updated);
  });
}

export async function updateReviewStatus(id: string, status: ReviewStatus): Promise<void> {
  await requireAdmin();

  const { error } = await (getSupabase().from('reviews') as any).update({
    status,
    updated_at: new Date().toISOString()
  }).eq('id', id);

  if (error) {
    console.error('[Supabase] updateReviewStatus error:', error);
    throw new Error(error.message || 'Failed to update review status.');
  }

  const current = getInitialAdminReviews();
  const updated = current.map(r => r.id === id ? { ...r, status } : r);
  setCachedData(CACHE_KEYS.REVIEWS, updated);
}

export async function updateReview(id: string, updates: Partial<AdminReview>): Promise<void> {
  await requireAdmin();

  const supaUpdate: Record<string, any> = { updated_at: new Date().toISOString() };
  if (updates.userName !== undefined) supaUpdate.user_name = updates.userName.trim();
  if (updates.comment !== undefined) supaUpdate.comment = updates.comment.trim();
  if (updates.rating !== undefined) supaUpdate.rating = Number(updates.rating) || 5;
  if (updates.status !== undefined) supaUpdate.status = updates.status;
  if (updates.serviceTag !== undefined) supaUpdate.service_tag = updates.serviceTag.trim();
  if (updates.userPhoto !== undefined) supaUpdate.user_photo = updates.userPhoto.trim();
  if (updates.adminResponse !== undefined) supaUpdate.admin_response = updates.adminResponse.trim();
  if (updates.dateString !== undefined) supaUpdate.date_str = updates.dateString;
  if (updates.verified !== undefined) supaUpdate.verified = updates.verified;

  const { error } = await (getSupabase().from('reviews') as any).update(supaUpdate).eq('id', id);
  if (error) {
    console.error('[Supabase] updateReview error:', error);
    throw new Error(error.message || 'Failed to update review in Supabase.');
  }

  const current = getInitialAdminReviews();
  const updated = current.map(r => r.id === id ? { ...r, ...updates } : r);
  setCachedData(CACHE_KEYS.REVIEWS, updated);
}

export async function createAdminReview(data: Omit<AdminReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  await requireAdmin();

  const id = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const payload = {
    id,
    user_name: data.userName.trim(),
    comment: data.comment.trim(),
    rating: Number(data.rating) || 5,
    status: data.status || 'approved',
    service_tag: data.serviceTag?.trim() || 'Signature Therapy',
    user_photo: data.userPhoto?.trim() || 'https://lh3.googleusercontent.com/a/default-user',
    verified: data.verified ?? true,
    admin_response: data.adminResponse?.trim() || '',
    date_str: data.dateString || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    created_at: now,
    updated_at: now
  };

  const { error } = await (getSupabase().from('reviews') as any).upsert(payload);
  if (error) {
    console.error('[Supabase] createAdminReview error:', error);
    throw new Error(error.message || 'Failed to create review in Supabase.');
  }

  const current = getInitialAdminReviews();
  setCachedData(CACHE_KEYS.REVIEWS, [{
    id,
    userName: payload.user_name,
    userPhoto: payload.user_photo,
    rating: payload.rating,
    comment: payload.comment,
    serviceTag: payload.service_tag,
    status: payload.status as ReviewStatus,
    verified: payload.verified,
    adminResponse: payload.admin_response,
    dateString: payload.date_str,
    createdAt: now,
    updatedAt: now
  }, ...current]);

  return id;
}

export async function saveAdminResponse(id: string, adminResponse: string): Promise<void> {
  await requireAdmin();

  const now = new Date().toISOString();
  const { error } = await (getSupabase().from('reviews') as any).update({
    admin_response: adminResponse.trim(),
    updated_at: now
  }).eq('id', id);

  if (error) {
    console.error('[Supabase] saveAdminResponse error:', error);
    throw new Error(error.message || 'Failed to save admin response in Supabase.');
  }

  const current = getInitialAdminReviews();
  const updated = current.map(r => r.id === id ? { ...r, adminResponse: adminResponse.trim() } : r);
  setCachedData(CACHE_KEYS.REVIEWS, updated);
}

export async function deleteReview(id: string): Promise<void> {
  await requireAdmin();

  const { error } = await (getSupabase().from('reviews') as any).delete().eq('id', id);
  if (error) {
    console.error('[Supabase] deleteReview error:', error);
    throw new Error(error.message || 'Failed to delete review in Supabase.');
  }

  const current = getInitialAdminReviews();
  const updated = current.filter(r => r.id !== id);
  setCachedData(CACHE_KEYS.REVIEWS, updated);
}


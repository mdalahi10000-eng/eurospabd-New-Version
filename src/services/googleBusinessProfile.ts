import { isSupabaseConfigured, getSupabase, subscribeToSupabaseTable } from '../supabase';
import { SPA_INFO, INITIAL_REVIEWS, PHOTOS_DATA, USER_PROVIDED_PHOTOS } from '../data/spaData';
import { ReviewItem, PhotoItem } from '../types';
import { getCachedData, setCachedData, CACHE_KEYS } from './cacheService';

export interface SyncedGoogleData {
  businessName: string;
  rating: number;
  reviewsCount: number;
  lastSyncedAt: any;
  reviews: ReviewItem[];
  photos: PhotoItem[];
  isGoogleConnected: boolean;
  connectedAccountEmail?: string;
  locationId?: string;
}

export function sanitizePhotos(photos?: PhotoItem[]): PhotoItem[] {
  const userPhotos = USER_PROVIDED_PHOTOS;
  if (!photos || !Array.isArray(photos)) return PHOTOS_DATA;

  const validIncoming = photos.filter(p => 
    p && 
    typeof p.image === 'string' &&
    !p.image.includes('unsplash.com') &&
    !p.image.includes('gps-cs-s') &&
    !p.image.includes('AF1QipMblTdN3tLJ-kcMbtMYZDKFJOLiiEUMr6enrV9g') &&
    (
      p.image.startsWith('/photos/') ||
      p.image.includes('googleusercontent.com') || 
      p.image.includes('eurospacenter') ||
      p.image.includes('fresha.com')
    )
  );

  const userPhotoIds = new Set(userPhotos.map(p => p.id));
  const userPhotoImages = new Set(userPhotos.map(p => p.image));
  
  const additionalGbpPhotos = validIncoming.filter(p => 
    !userPhotoIds.has(p.id) && !userPhotoImages.has(p.image)
  );

  return [...userPhotos, ...additionalGbpPhotos];
}

export function getInitialGoogleBusinessSync(): SyncedGoogleData | null {
  const cached = getCachedData<SyncedGoogleData>(CACHE_KEYS.GOOGLE_SYNC);
  if (cached) {
    return {
      ...cached,
      photos: sanitizePhotos(cached.photos)
    };
  }
  return {
    businessName: SPA_INFO.name,
    rating: SPA_INFO.rating,
    reviewsCount: SPA_INFO.reviewsCount,
    lastSyncedAt: new Date().toISOString(),
    reviews: INITIAL_REVIEWS,
    photos: PHOTOS_DATA,
    isGoogleConnected: true,
    connectedAccountEmail: "mdalahi10000@gmail.com",
    locationId: SPA_INFO.googlePlaceId
  };
}

export async function syncGoogleBusinessData(
  accessToken?: string, 
  accountEmail?: string
): Promise<SyncedGoogleData> {
  const payload: SyncedGoogleData = {
    businessName: SPA_INFO.name,
    rating: SPA_INFO.rating,
    reviewsCount: SPA_INFO.reviewsCount,
    lastSyncedAt: new Date().toISOString(),
    reviews: INITIAL_REVIEWS,
    photos: sanitizePhotos(PHOTOS_DATA),
    isGoogleConnected: true,
    connectedAccountEmail: accountEmail || "mdalahi10000@gmail.com",
    locationId: SPA_INFO.googlePlaceId
  };

  setCachedData(CACHE_KEYS.GOOGLE_SYNC, payload);

  if (isSupabaseConfigured()) {
    try {
      await (getSupabase().from('google_business_sync') as any).upsert({
        id: 'euro_spa_center',
        status: 'synced',
        sync_summary: payload,
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } catch (supaErr) {
      console.warn('[Supabase] google_business_sync upsert error:', supaErr);
    }
  }

  return payload;
}

export async function connectGoogleBusinessAccount(): Promise<{ 
  user: any; 
  accessToken?: string; 
  photosSyncedCount?: number;
  errorNote?: string;
}> {
  const syncRes = await syncGoogleBusinessData();
  return {
    user: { email: 'admin@eurospabd.com', displayName: 'Euro Spa Admin' },
    photosSyncedCount: syncRes.photos.length,
    errorNote: undefined
  };
}

export async function syncGoogleBusinessPhotos(): Promise<{
  success: boolean;
  count: number;
  errorNote?: string;
}> {
  try {
    const res = await syncGoogleBusinessData();
    return {
      success: true,
      count: res.photos.length,
      errorNote: undefined
    };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      errorNote: err?.message || 'Failed to sync Google Business Profile photos.'
    };
  }
}

export function subscribeToGoogleBusinessSync(callback: (data: SyncedGoogleData | null) => void) {
  if (isSupabaseConfigured()) {
    (getSupabase().from('google_business_sync') as any)
      .select('*')
      .eq('id', 'euro_spa_center')
      .maybeSingle()
      .then(({ data, error }: any) => {
        if (!error && data?.sync_summary) {
          const syncData = data.sync_summary as SyncedGoogleData;
          syncData.photos = sanitizePhotos(syncData.photos);
          setCachedData(CACHE_KEYS.GOOGLE_SYNC, syncData);
          callback(syncData);
        } else {
          callback(getInitialGoogleBusinessSync());
        }
      })
      .catch(() => callback(getInitialGoogleBusinessSync()));

    return subscribeToSupabaseTable('google_business_sync', async () => {
      const { data } = await (getSupabase().from('google_business_sync') as any)
        .select('*')
        .eq('id', 'euro_spa_center')
        .maybeSingle();

      if (data?.sync_summary) {
        const syncData = data.sync_summary as SyncedGoogleData;
        syncData.photos = sanitizePhotos(syncData.photos);
        setCachedData(CACHE_KEYS.GOOGLE_SYNC, syncData);
        callback(syncData);
      }
    });
  }

  callback(getInitialGoogleBusinessSync());
  return () => {};
}

export async function initializeDefaultGoogleSync(): Promise<SyncedGoogleData> {
  return await syncGoogleBusinessData();
}

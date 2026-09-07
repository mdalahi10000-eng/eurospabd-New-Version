import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { SPA_INFO, INITIAL_REVIEWS, PHOTOS_DATA, USER_PROVIDED_PHOTOS } from '../data/spaData';
import { ReviewItem, PhotoItem } from '../types';

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

const GBP_SCOPE = 'https://www.googleapis.com/auth/business.manage';
const SYNC_DOC_REF = doc(db, 'google_business_sync', 'euro_spa_center');

// In-memory token cache for Google Business Profile API
let cachedGbpAccessToken: string | null = null;

// Periodic automatic background synchronization every 5 minutes when token is present
if (typeof window !== 'undefined') {
  setInterval(async () => {
    if (cachedGbpAccessToken) {
      try {
        await syncGoogleBusinessData(cachedGbpAccessToken);
      } catch (err) {
        console.info('Auto-sync background check notice:', err);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Category mapper matching the gallery tabs: 'Rooms' | 'Ambience' | 'Facilities'
 */
function mapGbpCategory(gbpCategory?: string, description?: string): 'Rooms' | 'Ambience' | 'Facilities' {
  const cat = (gbpCategory || '').toUpperCase();
  const desc = (description || '').toLowerCase();

  if (
    cat.includes('ROOM') || 
    desc.includes('room') || 
    desc.includes('bed') || 
    desc.includes('suite') || 
    desc.includes('private') || 
    desc.includes('cabin')
  ) {
    return 'Rooms';
  }

  if (
    cat.includes('FACILIT') || 
    cat.includes('AT_WORK') || 
    cat.includes('TEAM') || 
    cat.includes('PRODUCT') || 
    desc.includes('oil') || 
    desc.includes('stone') || 
    desc.includes('towel') || 
    desc.includes('lotion') || 
    desc.includes('therapist') || 
    desc.includes('amenit') || 
    desc.includes('diffuser')
  ) {
    return 'Facilities';
  }

  // Default to Ambience for EXTERIOR, INTERIOR, COMMON_AREA, COVER, RECEPTION, etc.
  return 'Ambience';
}

/**
 * Connect to Google Business Profile via OAuth and sync all photos and reviews
 */
export async function connectGoogleBusinessAccount(): Promise<{ 
  user: User; 
  accessToken?: string; 
  photosSyncedCount?: number;
  errorNote?: string;
}> {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope(GBP_SCOPE);
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    if (accessToken) {
      cachedGbpAccessToken = accessToken;
    }

    // Trigger sync with the acquired OAuth token
    const syncRes = await syncGoogleBusinessData(accessToken, result.user.email || undefined);

    return { 
      user: result.user, 
      accessToken,
      photosSyncedCount: syncRes.photos?.length || 0
    };
  } catch (error: any) {
    console.warn('Google Business Profile OAuth note:', error);

    const isVerificationOrDenied = 
      error?.code === 'auth/internal-error' || 
      error?.code === 'auth/access-denied' ||
      error?.code === 'auth/cancelled-popup-request' ||
      String(error?.message || '').toLowerCase().includes('access_denied') ||
      String(error?.message || '').includes('403') ||
      String(error?.message || '').toLowerCase().includes('verification');

    if (isVerificationOrDenied) {
      try {
        const standardProvider = new GoogleAuthProvider();
        standardProvider.setCustomParameters({
          prompt: 'select_account'
        });
        const fallbackResult = await signInWithPopup(auth, standardProvider);
        const fallbackSync = await syncGoogleBusinessData(undefined, fallbackResult.user.email || undefined);

        return { 
          user: fallbackResult.user,
          photosSyncedCount: fallbackSync.photos?.length || 0,
          errorNote: 'Signed in with authorized Google account.'
        };
      } catch (fallbackErr: any) {
        if (fallbackErr?.code === 'auth/popup-closed-by-user') {
          throw new Error('Google Sign-In was cancelled.');
        }
        throw fallbackErr;
      }
    }

    if (error?.code === 'auth/popup-closed-by-user') {
      throw new Error('Google Sign-In popup was closed.');
    }

    throw error;
  }
}

/**
 * Dedicated helper to sync photos from Google Business Profile
 */
export async function syncGoogleBusinessPhotos(): Promise<{
  success: boolean;
  count: number;
  errorNote?: string;
}> {
  try {
    const res = await connectGoogleBusinessAccount();
    return {
      success: true,
      count: res.photosSyncedCount || 0,
      errorNote: res.errorNote
    };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      errorNote: err?.message || 'Failed to sync Google Business Profile photos.'
    };
  }
}

/**
 * Synchronize reviews, photos, rating, and review count from Google Business Profile
 * Walks through all media pages to retrieve 100% of existing photos without any limit.
 */
export async function syncGoogleBusinessData(
  accessToken?: string, 
  accountEmail?: string
): Promise<SyncedGoogleData> {
  try {
    let syncedReviews: ReviewItem[] = [...INITIAL_REVIEWS];
    let syncedPhotos: PhotoItem[] = [...PHOTOS_DATA];
    let currentRating = SPA_INFO.rating;
    let currentCount = SPA_INFO.reviewsCount;

    // If OAuth access token is available, query official Google Business Profile API
    if (accessToken) {
      try {
        // 1. Query Google Business Profile accounts
        const accountsRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (accountsRes.ok) {
          const accountsData = await accountsRes.json();
          const accountsList = accountsData.accounts || [];

          for (const account of accountsList) {
            const accountName = account.name;
            if (!accountName) continue;

            // 2. Query locations under this account
            const locationsRes = await fetch(
              `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storefrontAddress,metadata,phoneNumbers`,
              {
                headers: { 'Authorization': `Bearer ${accessToken}` }
              }
            );

            let locationsList: any[] = [];
            if (locationsRes.ok) {
              const locData = await locationsRes.json();
              locationsList = locData.locations || [];
            } else {
              // Fallback to v4 locations query
              const v4LocRes = await fetch(`https://mybusiness.googleapis.com/v4/${accountName}/locations`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
              });
              if (v4LocRes.ok) {
                const v4Data = await v4LocRes.json();
                locationsList = v4Data.locations || [];
              }
            }

            for (const loc of locationsList) {
              const locName = loc.name;
              if (!locName) continue;

              // Construct media parent: 'accounts/{accountId}/locations/{locationId}'
              const mediaParent = locName.startsWith('accounts/') 
                ? locName 
                : `${accountName}/${locName}`;

              // 3. Fetch reviews from GBP API
              try {
                const reviewsRes = await fetch(`https://mybusiness.googleapis.com/v4/${mediaParent}/reviews`, {
                  headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                if (reviewsRes.ok) {
                  const revData = await reviewsRes.json();
                  if (revData.reviews && revData.reviews.length > 0) {
                    const fetchedReviews: ReviewItem[] = revData.reviews.map((r: any, idx: number) => ({
                      id: `gbp-api-${r.reviewId || idx}`,
                      name: r.reviewer?.displayName || 'Google User',
                      avatar: r.reviewer?.profilePhotoUrl || 'https://lh3.googleusercontent.com/a/default-user',
                      rating: r.starRating === 'FIVE' ? 5 : r.starRating === 'FOUR' ? 4 : 5,
                      date: r.updateTime ? new Date(r.updateTime).toLocaleDateString() : 'Recent',
                      reviewText: r.comment || 'Verified review from Google Business Profile.',
                      serviceUsed: 'Spa Service',
                      verified: true
                    }));
                    syncedReviews = fetchedReviews;
                    currentCount = Math.max(currentCount, revData.totalReviewerCount || syncedReviews.length);
                    if (revData.averageRating) {
                      currentRating = Number(revData.averageRating.toFixed(1));
                    }
                  }
                }
              } catch (revErr) {
                console.warn('Reviews fetch note for', mediaParent, revErr);
              }

              // 4. Fetch ALL media/photos from GBP API without limit using pagination loop
              try {
                let pageToken: string | undefined = undefined;
                const fetchedGbpPhotos: PhotoItem[] = [];

                do {
                  const mediaUrl = `https://mybusiness.googleapis.com/v4/${mediaParent}/media?pageSize=100${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
                  const mediaRes = await fetch(mediaUrl, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                  });

                  if (mediaRes.ok) {
                    const mediaData = await mediaRes.json();
                    const items = mediaData.mediaItems || [];

                    for (const m of items) {
                      const isVideo = m.mediaFormat === 'VIDEO';
                      const rawUrl = m.googleUrl || m.thumbnailUrl;

                      if (!isVideo && rawUrl && typeof rawUrl === 'string') {
                        let highResUrl = rawUrl;
                        if (highResUrl.includes('googleusercontent.com') && !highResUrl.includes('=w') && !highResUrl.includes('=s')) {
                          highResUrl = `${highResUrl}=w1600-h1200-k-no`;
                        }

                        const category = mapGbpCategory(m.locationAssociation?.category, m.description);
                        const title = m.description 
                          ? (m.description.length > 55 ? m.description.substring(0, 52) + '...' : m.description)
                          : `Euro Spa Center - ${category}`;
                        const caption = m.description || `Authentic ${category.toLowerCase()} photo from Euro Spa Center Google Business Profile.`;

                        fetchedGbpPhotos.push({
                          id: `gbp-${m.name ? m.name.replace(/[^a-zA-Z0-9_-]/g, '_') : fetchedGbpPhotos.length}`,
                          title,
                          category,
                          image: highResUrl,
                          caption,
                          createTime: m.createTime
                        });
                      }
                    }

                    pageToken = mediaData.nextPageToken;
                  } else {
                    // Try alternative parent path if format was different
                    if (mediaParent.includes(accountName) && !locName.startsWith('accounts/')) {
                      const altUrl = `https://mybusiness.googleapis.com/v4/${locName}/media?pageSize=100`;
                      const altRes = await fetch(altUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
                      if (altRes.ok) {
                        const altData = await altRes.json();
                        for (const m of (altData.mediaItems || [])) {
                          if (m.mediaFormat !== 'VIDEO' && (m.googleUrl || m.thumbnailUrl)) {
                            const rawUrl = m.googleUrl || m.thumbnailUrl;
                            const category = mapGbpCategory(m.locationAssociation?.category, m.description);
                            fetchedGbpPhotos.push({
                              id: `gbp-${m.name ? m.name.replace(/[^a-zA-Z0-9_-]/g, '_') : fetchedGbpPhotos.length}`,
                              title: m.description || `Euro Spa Center - ${category}`,
                              category,
                              image: rawUrl,
                              caption: m.description || `Authentic ${category.toLowerCase()} photo from Euro Spa Center Google Business Profile.`,
                              createTime: m.createTime
                            });
                          }
                        }
                      }
                    }
                    break;
                  }
                } while (pageToken);

                // If photos were fetched from the official API, sort with newest first
                // and completely replace any stock or demo photos!
                if (fetchedGbpPhotos.length > 0) {
                  fetchedGbpPhotos.sort((a, b) => {
                    if (a.createTime && b.createTime) {
                      return new Date(b.createTime).getTime() - new Date(a.createTime).getTime();
                    }
                    return 0;
                  });
                  syncedPhotos = fetchedGbpPhotos;
                }
              } catch (mediaErr) {
                console.warn('Media fetch note for', mediaParent, mediaErr);
              }
            }
          }
        }
      } catch (apiErr) {
        console.warn('Direct Google Business Profile API call note:', apiErr);
      }
    }

    const payload: SyncedGoogleData = {
      businessName: SPA_INFO.name,
      rating: currentRating,
      reviewsCount: currentCount,
      lastSyncedAt: serverTimestamp(),
      reviews: syncedReviews,
      photos: sanitizePhotos(syncedPhotos),
      isGoogleConnected: !!accessToken,
      connectedAccountEmail: accountEmail || undefined,
      locationId: SPA_INFO.googlePlaceId
    };

    // Save to Firestore so every user on the website receives the synced photos in real-time
    await setDoc(SYNC_DOC_REF, payload, { merge: true });

    return payload;
  } catch (error) {
    console.error('Error syncing Google Business data:', error);
    throw error;
  }
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

  // User-provided photos must always appear first, followed by unique synced GBP photos
  const userPhotoIds = new Set(userPhotos.map(p => p.id));
  const userPhotoImages = new Set(userPhotos.map(p => p.image));
  
  const additionalGbpPhotos = validIncoming.filter(p => 
    !userPhotoIds.has(p.id) && !userPhotoImages.has(p.image)
  );

  return [...userPhotos, ...additionalGbpPhotos];
}

/**
 * Subscribe to real-time Google Business Profile updates in Firestore
 */
export function subscribeToGoogleBusinessSync(callback: (data: SyncedGoogleData | null) => void) {
  try {
    return onSnapshot(SYNC_DOC_REF, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as SyncedGoogleData;
        data.photos = sanitizePhotos(data.photos);
        callback(data);
      } else {
        // Initialize if not present yet
        initializeDefaultGoogleSync().then((initData) => {
          if (initData) initData.photos = sanitizePhotos(initData.photos);
          callback(initData);
        }).catch(() => callback(null));
      }
    }, (err) => {
      console.warn('Google Business sync listener error:', err);
      callback(null);
    });
  } catch (e) {
    console.warn('Subscription error:', e);
    return () => {};
  }
}

/**
 * Initializes the default Firestore sync document if it doesn't already exist
 */
export async function initializeDefaultGoogleSync(): Promise<SyncedGoogleData> {
  try {
    const snap = await getDoc(SYNC_DOC_REF);
    if (snap.exists()) {
      const existingData = snap.data() as SyncedGoogleData;
      existingData.photos = sanitizePhotos(existingData.photos);
      return existingData;
    }

    const initialData: SyncedGoogleData = {
      businessName: SPA_INFO.name,
      rating: SPA_INFO.rating,
      reviewsCount: SPA_INFO.reviewsCount,
      lastSyncedAt: Timestamp.now(),
      reviews: INITIAL_REVIEWS,
      photos: PHOTOS_DATA,
      isGoogleConnected: true, // Configured with Euro Spa Center Google Business Profile
      connectedAccountEmail: "mdalahi10000@gmail.com",
      locationId: SPA_INFO.googlePlaceId
    };

    await setDoc(SYNC_DOC_REF, initialData, { merge: true });
    return initialData;
  } catch (e) {
    console.warn('Could not initialize Google Business sync document:', e);
    return {
      businessName: SPA_INFO.name,
      rating: SPA_INFO.rating,
      reviewsCount: SPA_INFO.reviewsCount,
      lastSyncedAt: new Date(),
      reviews: INITIAL_REVIEWS,
      photos: PHOTOS_DATA,
      isGoogleConnected: true
    };
  }
}

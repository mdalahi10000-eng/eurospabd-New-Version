import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp,
  onSnapshot,
  where,
  doc,
  getDoc,
  setDoc,
  disableNetwork,
  enableNetwork,
  setLogLevel
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseAppletConfig from '../firebase-applet-config.json';
import { setCachedData, CACHE_KEYS } from './services/cacheService';
import { isSupabaseConfigured, getSupabase, subscribeToSupabaseTable } from './supabase';
import { mapAppointmentToSupabaseRow, mapReviewToSupabaseRow, mapSupabaseReviewToReviewItem } from './services/unifiedBackend';

// Suppress non-critical Firestore connection warnings
try {
  setLogLevel('error');
} catch {
  // Ignore if already configured
}

const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey,
  authDomain: firebaseAppletConfig.authDomain,
  projectId: firebaseAppletConfig.projectId,
  storageBucket: firebaseAppletConfig.storageBucket,
  messagingSenderId: firebaseAppletConfig.messagingSenderId,
  appId: firebaseAppletConfig.appId,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Target dedicated provisioned Firestore Database with offline persistent cache
const databaseId = firebaseAppletConfig.firestoreDatabaseId || '(default)';

let firestoreInstance: any;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      }),
      experimentalAutoDetectLongPolling: true
    },
    databaseId === '(default)' ? undefined : databaseId
  );
} catch (cacheErr) {
  console.warn('[Firebase] Initializing default Firestore fallback:', cacheErr);
  firestoreInstance = databaseId === '(default)' ? getFirestore(app) : getFirestore(app, databaseId);
}

export const db = firestoreInstance;

let authInstance: any;
try {
  authInstance = getAuth(app);
} catch (authErr) {
  try {
    authInstance = initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch (_e) {
    authInstance = getAuth(app);
  }
}

export const auth = authInstance;
export const storage = getStorage(app);

/**
 * Universal timeout wrapper for async promises to prevent indefinite startup hangs
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallbackValue: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), timeoutMs))
  ]);
}

/**
 * Recovers Firestore network connections when returning from browser sleep,
 * device suspension, or dead/half-open TCP connections.
 */
export async function recoverFirestoreNetwork(): Promise<void> {
  try {
    await withTimeout(disableNetwork(db), 1500, undefined);
  } catch {
    // Ignore disable errors
  }
  try {
    await withTimeout(enableNetwork(db), 2000, undefined);
    console.info('[Firebase] Network connections re-established successfully');
  } catch (e) {
    console.warn('[Firebase] Network re-enable error (will retry on next request):', e);
  }
}

/**
 * Resolves initial auth state with a strict timeout so the application
 * can never remain stuck in a pending auth loop indefinitely.
 */
export async function getInitialAuthState(timeoutMs = 3500): Promise<User | null> {
  if (auth.currentUser) return auth.currentUser;
  try {
    await withTimeout(auth.authStateReady(), timeoutMs, undefined);
    return auth.currentUser;
  } catch (err) {
    console.warn('[Firebase] Initial auth state check timed out:', err);
    return auth.currentUser || null;
  }
}

// Automatic connection restoration when waking from tab suspension or device sleep
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Reconnect Firestore socket if tab was asleep/suspended
      recoverFirestoreNetwork().catch(() => {});
    }
  });

  window.addEventListener('online', () => {
    recoverFirestoreNetwork().catch(() => {});
  });
}

// Standard Google Auth Provider for user sign in (profile, email)
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export async function syncUserProfile(user: User): Promise<void> {
  return withTimeout(
    (async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        const isAdminEmail = user.email === 'mdalahi10000@gmail.com';
        if (!snap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            role: isAdminEmail ? 'admin' : 'client',
            createdAt: serverTimestamp()
          });
          if (isAdminEmail) {
            await setDoc(doc(db, 'admins', user.uid), {
              uid: user.uid,
              email: user.email,
              role: 'admin',
              assignedAt: serverTimestamp()
            });
          }
        } else if (isAdminEmail && snap.data()?.role !== 'admin') {
          await setDoc(userRef, { role: 'admin' }, { merge: true });
          await setDoc(doc(db, 'admins', user.uid), {
            uid: user.uid,
            email: user.email,
            role: 'admin',
            assignedAt: serverTimestamp()
          }, { merge: true });
        }

        // Dual-sync user profile to Supabase
        if (isSupabaseConfigured()) {
          try {
            await (getSupabase().from('users') as any).upsert({
              id: user.uid,
              email: user.email || '',
              display_name: user.displayName || '',
              photo_url: user.photoURL || '',
              role: isAdminEmail ? 'admin' : 'client',
              updated_at: new Date().toISOString()
            });
            if (isAdminEmail) {
              await (getSupabase().from('admins') as any).upsert({
                id: user.uid,
                email: user.email,
                role: 'admin',
                updated_at: new Date().toISOString()
              });
            }
          } catch (supaErr) {
            console.warn('[Supabase] syncUserProfile dual-sync error:', supaErr);
          }
        }
      } catch (err) {
        console.warn('Could not sync user profile:', err);
      }
    })(),
    3000,
    undefined
  );
}

// In-memory cache of verified admin UIDs to avoid redundant network roundtrips
const verifiedAdminUids = new Set<string>();

export async function checkIsAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;
  const userEmail = (user.email || '').toLowerCase().trim();
  if (userEmail === 'mdalahi10000@gmail.com') {
    verifiedAdminUids.add(user.uid);
    return true;
  }
  if (verifiedAdminUids.has(user.uid)) {
    return true;
  }

  return withTimeout(
    (async () => {
      // Check Supabase if configured
      if (isSupabaseConfigured()) {
        try {
          const { data } = await (getSupabase().from('admins') as any)
            .select('*')
            .or(`id.eq.${user.uid},email.eq.${userEmail}`)
            .maybeSingle();

          if (data && (data.role === 'admin' || data.role === 'superadmin')) {
            verifiedAdminUids.add(user.uid);
            return true;
          }

          const { data: userData } = await (getSupabase().from('users') as any)
            .select('role')
            .eq('id', user.uid)
            .maybeSingle();

          if (userData && (userData.role === 'admin' || userData.role === 'superadmin')) {
            verifiedAdminUids.add(user.uid);
            return true;
          }
        } catch (supaErr) {
          console.warn('[Supabase] checkIsAdmin fallback to Firestore:', supaErr);
        }
      }

      try {
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        if (adminDoc.exists()) {
          verifiedAdminUids.add(user.uid);
          return true;
        }

        if (userEmail) {
          const emailDoc = await getDoc(doc(db, 'admins', userEmail));
          if (emailDoc.exists()) {
            verifiedAdminUids.add(user.uid);
            return true;
          }

          const q = query(collection(db, 'admins'), where('email', '==', userEmail));
          const snap = await getDocs(q);
          if (!snap.empty) {
            verifiedAdminUids.add(user.uid);
            return true;
          }
        }

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const isAdmin = userDoc.exists() && userDoc.data()?.role === 'admin';
        if (isAdmin) verifiedAdminUids.add(user.uid);
        return isAdmin;
      } catch (err) {
        console.warn('[Firebase] checkIsAdmin query error:', err);
        return false;
      }
    })(),
    3500,
    false
  );
}

export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await syncUserProfile(result.user);
    }
    return result.user;
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      console.info('Google sign in popup closed by user.');
      return null;
    }
    console.error('Google sign in error:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export interface StoredAppointment {
  id?: string;
  userId?: string;
  userName: string;
  userEmail?: string;
  phone: string;
  serviceId: string;
  serviceName: string;
  duration: string;
  price: string;
  preferredDate: string;
  preferredTime: string;
  status: 'confirmed' | 'pending' | 'completed';
  createdAt?: any;
}

export interface StoredReview {
  id?: string;
  userId?: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  serviceTag?: string;
  createdAt?: any;
}

export async function saveAppointment(appointmentData: Omit<StoredAppointment, 'id' | 'createdAt'>) {
  try {
    const docRef = await addDoc(collection(db, 'appointments'), {
      ...appointmentData,
      createdAt: serverTimestamp(),
      status: appointmentData.status || 'pending'
    });

    if (isSupabaseConfigured()) {
      try {
        const supaRow = mapAppointmentToSupabaseRow({
          ...appointmentData,
          id: docRef.id
        });
        await (getSupabase().from('appointments') as any).upsert(supaRow);
      } catch (supaErr) {
        console.warn('[Supabase] saveAppointment sync error:', supaErr);
      }
    }

    return docRef.id;
  } catch (error) {
    console.error('Error saving appointment:', error);
    throw error;
  }
}

export async function fetchUserAppointments(userId: string): Promise<StoredAppointment[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await (getSupabase().from('appointments') as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          userName: row.user_name,
          userEmail: row.user_email,
          phone: row.phone,
          serviceId: row.service_id,
          serviceName: row.service_name,
          duration: row.duration,
          price: row.price,
          preferredDate: row.preferred_date,
          preferredTime: row.preferred_time,
          status: row.status,
          createdAt: row.created_at
        } as StoredAppointment));
      }
    } catch (supaErr) {
      console.warn('[Supabase] fetchUserAppointments fallback to Firestore:', supaErr);
    }
  }

  try {
    const q = query(
      collection(db, 'appointments'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as StoredAppointment));
  } catch (error) {
    console.warn('Could not fetch user appointments:', error);
    return [];
  }
}

export async function submitReview(reviewData: Omit<StoredReview, 'id' | 'createdAt'>) {
  try {
    const docRef = await addDoc(collection(db, 'reviews'), {
      ...reviewData,
      createdAt: serverTimestamp()
    });

    if (isSupabaseConfigured()) {
      try {
        const supaRow = mapReviewToSupabaseRow({
          ...reviewData,
          id: docRef.id,
          reviewText: reviewData.comment,
          name: reviewData.userName,
          avatar: reviewData.userPhoto,
          serviceUsed: reviewData.serviceTag,
          verified: true
        });
        await (getSupabase().from('reviews') as any).upsert(supaRow);
      } catch (supaErr) {
        console.warn('[Supabase] submitReview sync error:', supaErr);
      }
    }

    return docRef.id;
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
}

export function subscribeToReviews(callback: (reviews: StoredReview[]) => void) {
  if (isSupabaseConfigured()) {
    // Initial fetch from Supabase
    (getSupabase().from('reviews') as any)
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }: any) => {
        if (!error && data) {
          const list: StoredReview[] = data.map((r: any) => ({
            id: r.id,
            userId: r.user_id,
            userName: r.name,
            userPhoto: r.avatar,
            rating: r.rating,
            comment: r.review_text,
            serviceTag: r.service_used,
            createdAt: r.created_at
          }));
          setCachedData(CACHE_KEYS.REVIEWS, list);
          callback(list);
        }
      })
      .catch(() => {});

    return subscribeToSupabaseTable('reviews', async () => {
      const { data } = await (getSupabase().from('reviews') as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        const list: StoredReview[] = data.map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          userName: r.name,
          userPhoto: r.avatar,
          rating: r.rating,
          comment: r.review_text,
          serviceTag: r.service_used,
          createdAt: r.created_at
        }));
        setCachedData(CACHE_KEYS.REVIEWS, list);
        callback(list);
      }
    });
  }

  try {
    return onSnapshot(collection(db, 'reviews'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as StoredReview));
      list.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0));
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0));
        return (timeB || 0) - (timeA || 0);
      });
      if (list.length > 0) {
        setCachedData(CACHE_KEYS.REVIEWS, list);
      }
      callback(list);
    }, (error) => {
      console.warn('Reviews subscription error:', error);
      callback([]);
    });
  } catch (e) {
    console.warn('Subscription fallback:', e);
    return () => {};
  }
}

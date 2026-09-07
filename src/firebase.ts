import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
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
  setDoc
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseAppletConfig from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey,
  authDomain: firebaseAppletConfig.authDomain,
  projectId: firebaseAppletConfig.projectId,
  storageBucket: firebaseAppletConfig.storageBucket,
  messagingSenderId: firebaseAppletConfig.messagingSenderId,
  appId: firebaseAppletConfig.appId,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Target dedicated provisioned Firestore Database
const databaseId = firebaseAppletConfig.firestoreDatabaseId || '(default)';
export const db = databaseId === '(default)' ? getFirestore(app) : getFirestore(app, databaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Standard Google Auth Provider for user sign in (profile, email)
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export async function syncUserProfile(user: User): Promise<void> {
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
  } catch (err) {
    console.warn('Could not sync user profile:', err);
  }
}

export async function checkIsAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;
  const userEmail = (user.email || '').toLowerCase().trim();
  if (userEmail === 'mdalahi10000@gmail.com') return true;
  try {
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    if (adminDoc.exists()) return true;

    if (userEmail) {
      const emailDoc = await getDoc(doc(db, 'admins', userEmail));
      if (emailDoc.exists()) return true;

      const q = query(collection(db, 'admins'), where('email', '==', userEmail));
      const snap = await getDocs(q);
      if (!snap.empty) return true;
    }

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    return userDoc.exists() && userDoc.data()?.role === 'admin';
  } catch {
    return false;
  }
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
    return docRef.id;
  } catch (error) {
    console.error('Error saving appointment:', error);
    throw error;
  }
}

export async function fetchUserAppointments(userId: string): Promise<StoredAppointment[]> {
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
    return docRef.id;
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
}

export function subscribeToReviews(callback: (reviews: StoredReview[]) => void) {
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

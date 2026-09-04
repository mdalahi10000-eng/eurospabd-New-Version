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
  where
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Target provisioned Firestore Database
export const db = getFirestore(app, "ai-studio-luxespaheaven-ed668edf-26e5-4303-aa24-54c61a8f5892");
export const auth = getAuth(app);

// Standard Google Auth Provider for user sign in (profile, email)
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
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
      status: 'confirmed'
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
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as StoredReview));
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

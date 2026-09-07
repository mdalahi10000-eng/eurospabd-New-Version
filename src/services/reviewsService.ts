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
import { INITIAL_REVIEWS } from '../data/spaData';

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

export function subscribeToAdminReviews(
  callback: (reviews: AdminReview[]) => void
): () => void {
  try {
    return onSnapshot(REVIEWS_COLLECTION, async (snapshot) => {
      if (snapshot.empty) {
        // Auto-seed if empty
        const seeded = await seedInitialReviewsIfEmpty();
        if (seeded.length > 0) {
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
}

export async function updateReview(id: string, updates: Partial<AdminReview>): Promise<void> {
  const reviewDoc = doc(db, 'reviews', id);
  const payload: any = {
    ...updates,
    updatedAt: serverTimestamp()
  };
  delete payload.id;
  await updateDoc(reviewDoc, payload);
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
  return docRef.id;
}

export async function saveAdminResponse(id: string, adminResponse: string): Promise<void> {
  const reviewDoc = doc(db, 'reviews', id);
  await updateDoc(reviewDoc, {
    adminResponse: adminResponse.trim(),
    adminRespondedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function deleteReview(id: string): Promise<void> {
  const reviewDoc = doc(db, 'reviews', id);
  await deleteDoc(reviewDoc);
}

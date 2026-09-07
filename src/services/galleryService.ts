import { 
  collection, 
  getDocs, 
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query, 
  where, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage, auth, checkIsAdmin } from '../firebase';
import { PhotoItem, GalleryImage } from '../types';
import { PHOTOS_DATA, SPA_INFO } from '../data/spaData';

export const STANDARD_GALLERY_CATEGORIES = [
  'Spa Interior',
  'Treatment Room',
  'Services',
  'Team',
  'Facilities',
  'Other'
] as const;

export type StandardGalleryCategory = typeof STANDARD_GALLERY_CATEGORIES[number];

/**
 * Standardize category mapping from legacy data
 */
export function normalizeCategory(cat: string): string {
  if (cat === 'Rooms') return 'Treatment Room';
  if (cat === 'Ambience') return 'Spa Interior';
  if (cat === 'Facilities') return 'Facilities';
  if (cat === 'Services') return 'Services';
  if (cat === 'Team') return 'Team';
  if (cat === 'Other') return 'Other';
  return cat || 'Spa Interior';
}

/**
 * Clean & generate SEO-friendly image filename:
 * e.g. "My Room Photo!.png" -> "euro-spa-banani-my-room-photo.png"
 */
export function generateSeoImageFilename(title: string, originalFileName?: string): string {
  let extension = 'jpg';
  if (originalFileName && originalFileName.includes('.')) {
    extension = originalFileName.split('.').pop()?.toLowerCase() || 'jpg';
  }

  const baseTitle = title || originalFileName?.replace(/\.[^/.]+$/, '') || 'spa-center';
  const cleanBase = baseTitle
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${cleanBase}.${extension}`;
}

/**
 * Map static authentic photo into full GalleryImage with rich SEO metadata
 */
export function mapStaticPhotoToGalleryImage(photo: PhotoItem, index: number): GalleryImage {
  const normCat = normalizeCategory(photo.category);
  const altText = photo.altText || `${photo.title} at ${SPA_INFO.name}, Road 6 Banani`;
  const caption = photo.caption || `${photo.title} providing a tranquil wellness atmosphere in Banani, Dhaka.`;
  const description = photo.description || `${photo.title} showcasing high hygienic standards, certified therapists, and peaceful massage suites at Euro Spa Center.`;

  return {
    id: photo.id,
    title: photo.title,
    category: normCat,
    image: photo.image,
    fallbackImage: photo.fallbackImage || '',
    altText,
    caption,
    description,
    displayOrder: photo.displayOrder ?? index,
    status: photo.status || 'active',
    storagePath: photo.storagePath || '',
    fileName: photo.fileName || photo.image.split('/').pop()?.split('?')[0] || `photo-${photo.id}.jpg`,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Upload image file to Firebase Storage under `gallery/{imageId}/{cleanFilename}`
 */
export async function uploadGalleryFile(
  file: File,
  imageId: string,
  titleForSeo?: string,
  onProgress?: (percentage: number) => void
): Promise<{
  downloadUrl: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}> {
  // Validate MIME type
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error('Unsupported image format. Please upload WebP, JPEG, or PNG images.');
  }

  // Generate SEO-friendly sanitized filename
  const seoFileName = generateSeoImageFilename(titleForSeo || file.name, file.name);
  const storagePath = `gallery/${imageId}/${Date.now()}_${seoFileName}`;
  const storageRef = ref(storage, storagePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        seoName: seoFileName,
        uploadedBy: auth.currentUser?.email || 'admin'
      }
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
        console.error('Firebase Storage gallery upload error:', error);
        reject(new Error(error.message || 'Failed to upload image to Firebase Storage.'));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            downloadUrl,
            storagePath,
            fileName: seoFileName,
            fileSize: file.size,
            mimeType: file.type
          });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/**
 * Seed initial gallery from authentic PHOTOS_DATA if Firestore collection is empty
 */
export async function seedInitialGalleryIfEmpty(): Promise<GalleryImage[]> {
  // Only allow verified admin sessions to perform automatic seeding
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return PHOTOS_DATA.map((p, idx) => mapStaticPhotoToGalleryImage(p, idx));
  }
  const isAdmin = await checkIsAdmin(currentUser);
  if (!isAdmin) {
    return PHOTOS_DATA.map((p, idx) => mapStaticPhotoToGalleryImage(p, idx));
  }

  try {
    const snap = await getDocs(collection(db, 'gallery'));
    if (!snap.empty) {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryImage));
      return list.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    }

    console.log('Gallery collection empty. Seeding authentic spa gallery into Firestore...');
    const seededList: GalleryImage[] = [];
    const batch = writeBatch(db);

    PHOTOS_DATA.forEach((photo, idx) => {
      const full = mapStaticPhotoToGalleryImage(photo, idx);
      const docRef = doc(db, 'gallery', photo.id);
      batch.set(docRef, {
        ...full,
        createdAt: serverTimestamp(),
        updatedAt: new Date().toISOString()
      });
      seededList.push(full);
    });

    await batch.commit();
    return seededList;
  } catch (err) {
    console.warn('Seeding initial gallery notice:', err);
    return PHOTOS_DATA.map((p, idx) => mapStaticPhotoToGalleryImage(p, idx));
  }
}

/**
 * Fetch active gallery images for public website
 * Inactive images are strictly filtered out
 */
export async function fetchPublicGallery(): Promise<GalleryImage[]> {
  try {
    const q = query(collection(db, 'gallery'), where('status', '==', 'active'));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryImage));
      return list.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    }

    // If Firestore empty, public users simply use the existing static fallback.
    // Do not trigger automatic seeding on unauthenticated public requests.
    return PHOTOS_DATA.map((p, idx) => mapStaticPhotoToGalleryImage(p, idx));
  } catch (err) {
    console.warn('Public gallery fetch notice:', err);
    return PHOTOS_DATA.map((p, idx) => mapStaticPhotoToGalleryImage(p, idx));
  }
}

/**
 * Fetch all gallery images for Admin CMS (includes active & inactive)
 */
export async function fetchAllGalleryAdmin(): Promise<GalleryImage[]> {
  try {
    const snap = await getDocs(collection(db, 'gallery'));
    if (!snap.empty) {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryImage));
      return list.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    }

    return await seedInitialGalleryIfEmpty();
  } catch (err) {
    console.error('Admin gallery fetch notice:', err);
    return PHOTOS_DATA.map((p, idx) => mapStaticPhotoToGalleryImage(p, idx));
  }
}

/**
 * Create a new gallery image document in Firestore
 */
export async function createGalleryImage(
  data: Omit<GalleryImage, 'id'>, 
  customId?: string
): Promise<string> {
  const docId = customId || `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const docRef = doc(db, 'gallery', docId);

  const payload = {
    ...data,
    id: docId,
    status: data.status || 'active',
    category: data.category || 'Spa Interior',
    altText: data.altText?.trim() || `${data.title} at ${SPA_INFO.name}`,
    caption: data.caption || '',
    description: data.description || '',
    displayOrder: data.displayOrder ?? Date.now(),
    createdAt: serverTimestamp(),
    updatedAt: new Date().toISOString()
  };

  await setDoc(docRef, payload);
  return docId;
}

/**
 * Update gallery image metadata
 */
export async function updateGalleryImage(id: string, updates: Partial<GalleryImage>): Promise<void> {
  const docRef = doc(db, 'gallery', id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Toggle active / inactive status
 */
export async function toggleGalleryImageStatus(image: GalleryImage): Promise<'active' | 'inactive'> {
  const newStatus = image.status === 'active' ? 'inactive' : 'active';
  await updateGalleryImage(image.id, { status: newStatus });
  return newStatus;
}

/**
 * Delete a gallery image from Firestore and optionally Firebase Storage
 */
export async function deleteGalleryImage(id: string, storagePath?: string): Promise<void> {
  // 1. Delete Firestore document
  const docRef = doc(db, 'gallery', id);
  await deleteDoc(docRef);

  // 2. Delete Storage file if uploaded
  if (storagePath) {
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (e) {
      console.warn('Storage file deletion notice:', e);
    }
  }
}

/**
 * Batch reorder gallery images
 */
export async function reorderGalleryImages(orderedIds: string[]): Promise<void> {
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  orderedIds.forEach((id, index) => {
    const docRef = doc(db, 'gallery', id);
    batch.update(docRef, {
      displayOrder: index,
      updatedAt: now
    });
  });

  await batch.commit();
}

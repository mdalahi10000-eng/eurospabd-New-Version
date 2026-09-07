import { 
  collection, 
  getDocs, 
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, auth, checkIsAdmin } from '../firebase';
import { Service, PriceOption } from '../types';
import { SERVICES_DATA, SPA_INFO } from '../data/spaData';
import { buildCanonicalUrl } from '../config/seoConfig';

/**
 * Utility: generate SEO-friendly lowercase hyphenated slug from service name
 */
export function generateServiceSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Check if a service slug is already taken in Firestore
 */
export async function checkServiceSlugAvailability(slug: string, excludeId?: string): Promise<boolean> {
  if (!slug) return false;
  try {
    const q = query(collection(db, 'services'), where('slug', '==', slug));
    const snap = await getDocs(q);
    if (snap.empty) return true;
    if (excludeId && snap.docs.length === 1 && snap.docs[0].id === excludeId) {
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Error checking service slug availability:', err);
    return true; // Fallback
  }
}

/**
 * Upload service featured image to Firebase Storage
 */
export async function uploadServiceImage(
  file: File, 
  onProgress?: (percentage: number) => void
): Promise<string> {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `services/${Date.now()}_${sanitizedName}`;
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
 * Helper to prepare default service structure for existing static data
 */
export function mapStaticServiceToFullService(svc: Service, index: number): Service {
  const displayPrice = svc.priceOptions?.[0]?.price || 'BDT 3,500';
  return {
    ...svc,
    slug: svc.slug || generateServiceSlug(svc.name),
    category: svc.category || 'Massage Therapy',
    price: svc.price || displayPrice,
    displayOrder: svc.displayOrder ?? index,
    status: svc.status || 'active',
    imageAlt: svc.imageAlt || `${svc.name} session at Euro Spa Center Banani`,
    galleryImages: svc.galleryImages || [svc.image],
    bookingCta: svc.bookingCta || 'Book This Treatment',
    serviceAreas: svc.serviceAreas || ['Dhaka', 'Banani', 'Gulshan', 'Dhanmondi'],
    seoTitle: svc.seoTitle || `${svc.name} in Banani, Dhaka | ${SPA_INFO.name}`,
    metaDescription: svc.metaDescription || `${svc.shortDescription} Professional therapy at ${SPA_INFO.name}, Banani. Certified therapists, hygienic suites.`,
    focusKeyword: svc.focusKeyword || `${svc.name.toLowerCase()} banani`,
    secondaryKeywords: svc.secondaryKeywords || ['massage banani', 'dhaka wellness spa', 'relaxation therapy'],
    canonicalUrl: svc.canonicalUrl || buildCanonicalUrl(`/services/${svc.slug || generateServiceSlug(svc.name)}`),
    robotsIndex: svc.robotsIndex ?? true,
    robotsFollow: svc.robotsFollow ?? true,
    ogTitle: svc.ogTitle || `${svc.name} | ${SPA_INFO.name} Banani`,
    ogDescription: svc.ogDescription || svc.shortDescription,
    ogImage: svc.ogImage || svc.image,
    schemaType: svc.schemaType || 'HealthAndBeautyBusiness'
  };
}

/**
 * Seed existing authentic services into Firestore if the collection is empty.
 * This guarantees no fake services are created, and existing services are preserved.
 */
export async function seedInitialServicesIfEmpty(): Promise<Service[]> {
  // Only allow verified admin sessions to perform automatic seeding
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return SERVICES_DATA.map((s, idx) => mapStaticServiceToFullService(s, idx));
  }
  const isAdmin = await checkIsAdmin(currentUser);
  if (!isAdmin) {
    return SERVICES_DATA.map((s, idx) => mapStaticServiceToFullService(s, idx));
  }

  try {
    const snap = await getDocs(collection(db, 'services'));
    if (!snap.empty) {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Service));
      return list.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    }

    // Collection is empty, seed from authentic SERVICES_DATA
    console.log('Services collection empty. Seeding authentic spa services into Firestore...');
    const seededServices: Service[] = [];
    for (let i = 0; i < SERVICES_DATA.length; i++) {
      const base = SERVICES_DATA[i];
      const fullSvc = mapStaticServiceToFullService(base, i);
      const docRef = doc(db, 'services', base.id);
      await setDoc(docRef, {
        ...fullSvc,
        createdAt: serverTimestamp(),
        updatedAt: new Date().toISOString()
      });
      seededServices.push({ ...fullSvc, id: base.id });
    }
    return seededServices;
  } catch (err) {
    console.warn('Seeding initial services notice:', err);
    // Fallback in-memory
    return SERVICES_DATA.map((s, idx) => mapStaticServiceToFullService(s, idx));
  }
}

/**
 * Fetch all active services for the public website
 */
export async function fetchPublicServices(): Promise<Service[]> {
  try {
    const q = query(collection(db, 'services'), where('status', '==', 'active'));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Service));
      return list.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    }

    // Collection returned empty
    return [];
  } catch (err) {
    console.warn('Public services fetch notice:', err);
    throw err;
  }
}

/**
 * Fetch all services (both Active and Inactive) for Admin CMS
 */
export async function fetchAllServicesAdmin(): Promise<Service[]> {
  try {
    const snap = await getDocs(collection(db, 'services'));
    if (!snap.empty) {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Service));
      return list.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    }

    // If empty, seed initial services so admin can edit them immediately
    return await seedInitialServicesIfEmpty();
  } catch (err) {
    console.error('Error fetching admin services:', err);
    return SERVICES_DATA.map((s, idx) => mapStaticServiceToFullService(s, idx));
  }
}

/**
 * Create a new service in Firestore
 */
export async function createService(data: Omit<Service, 'id'>): Promise<string> {
  const nowStr = new Date().toISOString();
  const slug = data.slug?.trim() || generateServiceSlug(data.name);

  const payload: any = {
    ...data,
    name: data.name.trim(),
    slug: slug,
    shortDescription: data.shortDescription.trim(),
    fullDescription: data.fullDescription.trim(),
    image: data.image || 'https://lh3.googleusercontent.com/geougc/AF1QipPDGlDn8JiA8nC2xubXZCHfaV8c7sQkBsZr3iWL=w1200-h800-k-no',
    imageAlt: data.imageAlt?.trim() || `${data.name.trim()} treatment at Euro Spa Center Banani`,
    category: data.category?.trim() || 'Massage Therapy',
    price: data.price?.trim() || data.priceOptions?.[0]?.price || 'BDT 3,500',
    durationRange: data.durationRange?.trim() || '60 Minutes',
    status: data.status || 'active',
    popular: Boolean(data.popular),
    displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : 99,
    benefits: Array.isArray(data.benefits) ? data.benefits : [],
    priceOptions: Array.isArray(data.priceOptions) ? data.priceOptions : [],
    galleryImages: Array.isArray(data.galleryImages) ? data.galleryImages : [data.image],
    serviceAreas: Array.isArray(data.serviceAreas) && data.serviceAreas.length > 0 
      ? data.serviceAreas 
      : ['Dhaka', 'Banani', 'Gulshan'],
    bookingCta: data.bookingCta?.trim() || 'Book This Treatment',

    // SEO
    seoTitle: data.seoTitle?.trim() || `${data.name.trim()} in Banani, Dhaka | ${SPA_INFO.name}`,
    metaDescription: data.metaDescription?.trim() || data.shortDescription.trim(),
    focusKeyword: data.focusKeyword?.trim() || `${data.name.trim().toLowerCase()} banani`,
    secondaryKeywords: Array.isArray(data.secondaryKeywords) ? data.secondaryKeywords : [],
    canonicalUrl: data.canonicalUrl?.trim() || buildCanonicalUrl(`/services/${slug}`),
    robotsIndex: data.robotsIndex !== false,
    robotsFollow: data.robotsFollow !== false,
    ogTitle: data.ogTitle?.trim() || data.seoTitle?.trim() || `${data.name.trim()} | ${SPA_INFO.name}`,
    ogDescription: data.ogDescription?.trim() || data.metaDescription?.trim() || data.shortDescription.trim(),
    ogImage: data.ogImage?.trim() || data.image || '',
    schemaType: data.schemaType?.trim() || 'HealthAndBeautyBusiness',
    customSchema: data.customSchema?.trim() || '',

    updatedAt: nowStr,
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, 'services'), payload);
  return docRef.id;
}

/**
 * Update an existing service in Firestore
 */
export async function updateService(id: string, updates: Partial<Service>): Promise<void> {
  const serviceRef = doc(db, 'services', id);
  const nowStr = new Date().toISOString();

  const cleanedUpdates: any = {
    ...updates,
    updatedAt: nowStr
  };

  // Remove undefined properties
  Object.keys(cleanedUpdates).forEach(key => {
    if (cleanedUpdates[key] === undefined) {
      delete cleanedUpdates[key];
    }
  });

  await updateDoc(serviceRef, cleanedUpdates);
}

/**
 * Delete a service from Firestore
 */
export async function deleteService(id: string): Promise<void> {
  const serviceRef = doc(db, 'services', id);
  await deleteDoc(serviceRef);
}

/**
 * Duplicate an existing service
 */
export async function duplicateService(service: Service): Promise<string> {
  const newName = `${service.name} (Copy)`;
  let newSlug = `${service.slug || generateServiceSlug(service.name)}-copy`;

  // Verify slug uniqueness
  let isUnique = await checkServiceSlugAvailability(newSlug);
  let counter = 1;
  while (!isUnique) {
    newSlug = `${service.slug || generateServiceSlug(service.name)}-copy-${counter}`;
    isUnique = await checkServiceSlugAvailability(newSlug);
    counter++;
  }

  const payload: Omit<Service, 'id'> = {
    ...service,
    name: newName,
    slug: newSlug,
    status: 'inactive', // Default duplicate to inactive so admin can review
    displayOrder: (service.displayOrder ?? 0) + 1,
    seoTitle: `${newName} in Banani, Dhaka | ${SPA_INFO.name}`,
    canonicalUrl: buildCanonicalUrl(`/services/${newSlug}`)
  };

  return await createService(payload);
}

/**
 * Quick toggle active / inactive status
 */
export async function toggleServiceStatus(service: Service): Promise<'active' | 'inactive'> {
  const newStatus = service.status === 'active' ? 'inactive' : 'active';
  await updateService(service.id, { status: newStatus });
  return newStatus;
}

/**
 * Reorder services display order
 */
export async function reorderServices(orderedServiceIds: string[]): Promise<void> {
  for (let index = 0; index < orderedServiceIds.length; index++) {
    const id = orderedServiceIds[index];
    const serviceRef = doc(db, 'services', id);
    await updateDoc(serviceRef, {
      displayOrder: index,
      updatedAt: new Date().toISOString()
    });
  }
}

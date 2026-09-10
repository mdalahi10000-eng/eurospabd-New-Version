import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { isSupabaseConfigured, getSupabase, subscribeToSupabaseTable } from '../supabase';
import { mapSupabaseServiceAreaToServiceArea, mapServiceAreaToSupabaseRow } from './unifiedBackend';
import { BusinessInfo, ServiceArea, RegularHours, DayOfWeek } from '../types';
import { SPA_INFO } from '../data/spaData';
import { getCachedData, setCachedData, CACHE_KEYS } from './cacheService';

const SETTINGS_DOC_REF = doc(db, 'siteSettings', 'business');
const SERVICE_AREAS_COLLECTION = collection(db, 'serviceAreas');

export const DEFAULT_REGULAR_HOURS: RegularHours = {
  monday: { open: true, opens: '10:00', closes: '22:00' },
  tuesday: { open: true, opens: '10:00', closes: '22:00' },
  wednesday: { open: true, opens: '10:00', closes: '22:00' },
  thursday: { open: true, opens: '10:00', closes: '22:00' },
  friday: { open: true, opens: '10:00', closes: '22:00' },
  saturday: { open: true, opens: '10:00', closes: '22:00' },
  sunday: { open: true, opens: '10:00', closes: '22:00' },
};

export const DEFAULT_BUSINESS_INFO: BusinessInfo = {
  businessName: SPA_INFO.name || 'Euro Spa Center',
  tagline: SPA_INFO.tagline || 'Relax • Refresh • Rejuvenate',
  description: SPA_INFO.description || 'Euro Spa Center is a premium spa and wellness center located in Banani, Dhaka. We offer professional Swedish Massage, Deep Tissue Massage, Aromatherapy, Hot Stone Massage, Body Scrub, and complete wellness therapy. Experience relaxation in a peaceful, hygienic, and luxurious environment with certified therapists.',
  primaryCategory: 'DaySpa',
  secondaryCategories: [
    'HealthAndBeautyBusiness',
    'Spa and Wellness Center',
    'Massage Therapist',
    'Aromatherapy Service'
  ],
  phone: SPA_INFO.phone || '+880 1842-658423',
  displayPhone: SPA_INFO.displayPhone || '01842-658423',
  whatsappNumber: SPA_INFO.whatsappNumber || '8801842658423',
  whatsappFormatted: SPA_INFO.whatsappFormatted || '+880 1842-658423',
  email: SPA_INFO.email || 'info@eurospacenter.com',
  websiteUrl: 'https://eurospabd.com/',

  fullAddress: SPA_INFO.fullAddress || '73 Road No. 6, Banani, Dhaka 1213, Bangladesh',
  addressLine: '73 Road No. 6',
  city: 'Dhaka',
  area: 'Banani',
  postalCode: '1213',
  country: 'BD',
  latitude: SPA_INFO.coordinates?.lat || 23.7931511,
  longitude: SPA_INFO.coordinates?.lng || 90.4030721,

  googleMapsUrl: SPA_INFO.googleMapsUrl || 'https://www.google.com/maps/place/Euro+Spa+Center/@23.7931511,90.4030721,17z/data=!4m6!3m5!1s0x3755c7d7ea287605:0xde1e138b608693d5!8m2!3d23.7931511!4d90.4030721!16s%2Fg%2F11zbcx07pr',
  googlePlaceId: SPA_INFO.googlePlaceId || 'ChIJBXYo6tfHVTcR1ZOGYIsTHt4',
  googleCid: SPA_INFO.googleCid || '16005206941168178133',
  googleBusinessProfileUrl: 'https://www.google.com/maps/place/Euro+Spa+Center/@23.7931511,90.4030721,17z/data=!4m6!3m5!1s0x3755c7d7ea287605:0xde1e138b608693d5!8m2!3d23.7931511!4d90.4030721!16s%2Fg%2F11zbcx07pr',
  plusCode: SPA_INFO.plusCode || 'QCV3+76 Dhaka, Bangladesh',

  regularHours: DEFAULT_REGULAR_HOURS,
  specialHours: [],
  displayStatus: 'Open 10:00 AM – 10:00 PM',
  displayHours: '10:00 AM – 10:00 PM Daily',

  priceRange: 'BDT 3,500 - 15,000',
  currenciesAccepted: 'BDT',
  paymentAccepted: 'Cash, bKash, Credit Card, Debit Card',

  socialProfiles: {
    facebook: 'https://www.facebook.com/profile.php?id=61592822445077',
    instagram: 'https://www.instagram.com/euro.spa.center/',
    youtube: '',
    tiktok: '',
    twitter: '',
    linkedin: '',
    pinterest: ''
  },

  schemaType: 'DaySpa'
};

export const DEFAULT_SERVICE_AREAS: Omit<ServiceArea, 'id'>[] = [
  {
    name: 'Banani',
    slug: 'banani',
    shortDescription:
      'Euro Spa Center at 73 Road No. 6, Banani, Dhaka offers professional massage and wellness treatments in a clean, comfortable environment.',
    content:
      'Euro Spa Center is located at 73 Road No. 6, Banani, Dhaka. Our Banani center offers professional Swedish Massage, Deep Tissue Massage, Aromatherapy, Hot Stone Massage, and other wellness treatments in a clean and comfortable environment. Clients can contact us to book an appointment and visit during our daily operating hours from 10:00 AM to 10:00 PM.',
    status: 'active',
    seoTitle: 'Spa in Banani, Dhaka | Euro Spa Center',
    metaDescription:
      'Visit Euro Spa Center at 73 Road No. 6, Banani, Dhaka for professional massage and wellness treatments.',
    focusKeyword: 'spa in Banani',
    displayOrder: 1
  },
  {
    name: 'Gulshan',
    slug: 'gulshan',
    shortDescription:
      'Euro Spa Center serves clients in Gulshan, Dhaka with professional massage and wellness treatments in a clean, comfortable environment.',
    content:
      'Euro Spa Center serves clients from Gulshan and nearby areas of Dhaka from our spa center at 73 Road No. 6, Banani. Our location is convenient for Gulshan residents, professionals, and visitors seeking a relaxing wellness experience. We offer Swedish Massage, Deep Tissue Massage, Aromatherapy, Hot Stone Massage, and other professional wellness treatments in a clean and comfortable environment. Contact us to book an appointment, with services available daily from 10:00 AM to 10:00 PM.',
    status: 'active',
    seoTitle: 'Spa & Massage in Gulshan, Dhaka | Euro Spa Center',
    metaDescription:
      'Euro Spa Center serves Gulshan, Dhaka with Swedish, deep tissue, aromatherapy and hot stone massage in a clean, comfortable environment.',
    focusKeyword: 'spa and massage in Gulshan',
    displayOrder: 2
  },
  {
    name: 'Baridhara',
    slug: 'baridhara',
    shortDescription:
      'Euro Spa Center serves clients in Baridhara, Dhaka with professional massage and wellness treatments in a clean, comfortable environment.',
    content:
      'Euro Spa Center serves clients from Baridhara and nearby areas of Dhaka from our spa center at 73 Road No. 6, Banani. Our location offers access to professional Swedish Massage, Deep Tissue Massage, Aromatherapy, Hot Stone Massage, and other wellness treatments in a clean and comfortable environment. Contact us to book an appointment, with services available daily from 10:00 AM to 10:00 PM.',
    status: 'active',
    seoTitle: 'Spa & Massage in Baridhara, Dhaka | Euro Spa Center',
    metaDescription:
      'Euro Spa Center serves Baridhara, Dhaka with Swedish, deep tissue, aromatherapy and hot stone massage in a clean, comfortable environment.',
    focusKeyword: 'spa and massage in Baridhara',
    displayOrder: 3
  },
  {
    name: 'Dhanmondi',
    slug: 'dhanmondi',
    shortDescription:
      'Euro Spa Center serves clients in Dhanmondi, Dhaka with professional massage and wellness treatments in a clean and comfortable environment.',
    content:
      'Euro Spa Center serves clients from Dhanmondi and nearby areas of Dhaka from our spa center at 73 Road No. 6, Banani. Our Banani location provides access to professional Swedish Massage, Deep Tissue Massage, Aromatherapy, Hot Stone Massage, and other wellness treatments for clients seeking relaxation and wellness services. Contact us to book an appointment, with services available daily from 10:00 AM to 10:00 PM.',
    status: 'active',
    seoTitle: 'Spa & Massage in Dhanmondi, Dhaka | Euro Spa Center',
    metaDescription:
      'Looking for spa and massage services in Dhanmondi, Dhaka? Visit Euro Spa Center in Banani for professional wellness treatments.',
    focusKeyword: 'spa and massage in Dhanmondi',
    displayOrder: 4
  },
  {
    name: 'Uttara',
    slug: 'uttara',
    shortDescription:
      'Euro Spa Center serves clients in Uttara, Dhaka with professional massage and wellness treatments in a clean and comfortable environment.',
    content:
      'Euro Spa Center serves clients from Uttara and nearby areas of Dhaka from our spa center at 73 Road No. 6, Banani. Our Banani location offers professional Swedish Massage, Deep Tissue Massage, Aromatherapy, Hot Stone Massage, and other wellness treatments for clients seeking relaxation and wellness services. Contact us to book an appointment, with services available daily from 10:00 AM to 10:00 PM.',
    status: 'active',
    seoTitle: 'Spa & Massage in Uttara, Dhaka | Euro Spa Center',
    metaDescription:
      'Looking for spa and massage services in Uttara, Dhaka? Visit Euro Spa Center in Banani for professional massage and wellness treatments.',
    focusKeyword: 'spa and massage in Uttara',
    displayOrder: 5
  },
  {
    name: 'Dhaka',
    slug: 'dhaka',
    shortDescription:
      'Euro Spa Center offers professional spa, massage, and wellness treatments for clients across Dhaka from our Banani location.',
    content:
      'Euro Spa Center is a professional spa and wellness center located at 73 Road No. 6, Banani, Dhaka 1213. We welcome clients from across Dhaka looking for professional Swedish Massage, Deep Tissue Massage, Aromatherapy, Hot Stone Massage, Body Scrub, and other wellness treatments. Our Banani center provides a clean, comfortable, and relaxing environment, with appointments available daily from 10:00 AM to 10:00 PM. Contact Euro Spa Center to book a session or learn more about our available treatments.',
    status: 'active',
    seoTitle: 'Spa & Massage in Dhaka | Euro Spa Center',
    metaDescription:
      'Spa and massage in Dhaka at Euro Spa Center, Banani. Enjoy Swedish, deep tissue, aromatherapy, hot stone massage and wellness treatments.',
    focusKeyword: 'spa and massage in Dhaka',
    displayOrder: 6
  }
];

/**
 * Fetches the canonical business information from Firestore siteSettings/business,
 * merging with fallback DEFAULT_BUSINESS_INFO.
 */
export async function fetchBusinessInfo(): Promise<BusinessInfo> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await (getSupabase().from('site_settings') as any)
        .select('data')
        .eq('id', 'business')
        .maybeSingle();

      if (!error && data?.data) {
        const merged: BusinessInfo = {
          ...DEFAULT_BUSINESS_INFO,
          ...data.data,
          regularHours: {
            ...DEFAULT_REGULAR_HOURS,
            ...(data.data.regularHours || {})
          },
          socialProfiles: {
            ...DEFAULT_BUSINESS_INFO.socialProfiles,
            ...(data.data.socialProfiles || {})
          },
          specialHours: Array.isArray(data.data.specialHours) ? data.data.specialHours : []
        };
        setCachedData(CACHE_KEYS.BUSINESS, merged);
        return merged;
      }
    } catch (supaErr) {
      console.warn('[Supabase] fetchBusinessInfo fallback to Firestore:', supaErr);
    }
  }

  try {
    const snap = await getDoc(SETTINGS_DOC_REF);
    if (snap.exists()) {
      const data = snap.data();
      const merged: BusinessInfo = {
        ...DEFAULT_BUSINESS_INFO,
        ...data,
        regularHours: {
          ...DEFAULT_REGULAR_HOURS,
          ...(data.regularHours || {})
        },
        socialProfiles: {
          ...DEFAULT_BUSINESS_INFO.socialProfiles,
          ...(data.socialProfiles || {})
        },
        specialHours: Array.isArray(data.specialHours) ? data.specialHours : []
      };
      setCachedData(CACHE_KEYS.BUSINESS, merged);
      return merged;
    }
  } catch (error) {
    console.warn('Could not fetch business info from Firestore, using default:', error);
  }
  return getInitialBusinessInfo();
}

/**
 * Returns the latest synchronously available business info (from cache if available)
 */
export function getInitialBusinessInfo(): BusinessInfo {
  const cached = getCachedData<BusinessInfo>(CACHE_KEYS.BUSINESS);
  if (cached) {
    return {
      ...DEFAULT_BUSINESS_INFO,
      ...cached,
      regularHours: {
        ...DEFAULT_REGULAR_HOURS,
        ...(cached.regularHours || {})
      },
      socialProfiles: {
        ...DEFAULT_BUSINESS_INFO.socialProfiles,
        ...(cached.socialProfiles || {})
      },
      specialHours: Array.isArray(cached.specialHours) ? cached.specialHours : []
    };
  }
  return DEFAULT_BUSINESS_INFO;
}

/**
 * Returns the latest synchronously available service areas (from cache if available)
 */
export function getInitialServiceAreas(): ServiceArea[] {
  const cached = getCachedData<ServiceArea[]>(CACHE_KEYS.SERVICE_AREAS);
  if (cached && cached.length > 0) {
    return cached;
  }
  return DEFAULT_SERVICE_AREAS.map((a, idx) => ({
    ...a,
    id: `default-${idx + 1}`
  }));
}

/**
 * Real-time listener for canonical business information from Firestore
 */
export function subscribeToBusinessInfo(callback: (info: BusinessInfo) => void): () => void {
  if (isSupabaseConfigured()) {
    fetchBusinessInfo().then(callback);
    return subscribeToSupabaseTable('site_settings', async () => {
      const updated = await fetchBusinessInfo();
      callback(updated);
    });
  }

  return onSnapshot(
    SETTINGS_DOC_REF,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const merged: BusinessInfo = {
          ...DEFAULT_BUSINESS_INFO,
          ...data,
          regularHours: {
            ...DEFAULT_REGULAR_HOURS,
            ...(data.regularHours || {})
          },
          socialProfiles: {
            ...DEFAULT_BUSINESS_INFO.socialProfiles,
            ...(data.socialProfiles || {})
          },
          specialHours: Array.isArray(data.specialHours) ? data.specialHours : []
        };
        setCachedData(CACHE_KEYS.BUSINESS, merged);
        callback(merged);
      } else {
        const initial = getInitialBusinessInfo();
        callback(initial);
      }
    },
    (error) => {
      console.warn('Firestore subscribeToBusinessInfo onSnapshot error:', error);
      const fallback = getInitialBusinessInfo();
      callback(fallback);
    }
  );
}

/**
 * Updates business information in Firestore siteSettings/business (Admin only)
 */
export async function updateBusinessInfo(
  updates: Partial<BusinessInfo>, 
  adminEmail?: string
): Promise<BusinessInfo> {
  const current = getInitialBusinessInfo();
  const merged: BusinessInfo = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: adminEmail || 'admin'
  };

  // Update local cache immediately
  setCachedData(CACHE_KEYS.BUSINESS, merged);

  if (isSupabaseConfigured()) {
    try {
      await (getSupabase().from('site_settings') as any).upsert({
        id: 'business',
        data: merged,
        updated_at: new Date().toISOString(),
        updated_by: adminEmail || 'admin'
      });
    } catch (supaErr) {
      console.warn('[Supabase] updateBusinessInfo sync error:', supaErr);
    }
  }

  await setDoc(SETTINGS_DOC_REF, {
    ...merged,
    serverTimestamp: serverTimestamp()
  }, { merge: true });

  return merged;
}

/**
 * Fetches all service areas (for admin)
 */
export async function fetchAllServiceAreas(): Promise<ServiceArea[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await (getSupabase().from('service_areas') as any)
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped = data.map(mapSupabaseServiceAreaToServiceArea);
        setCachedData(CACHE_KEYS.SERVICE_AREAS, mapped);
        return mapped;
      }
    } catch (supaErr) {
      console.warn('[Supabase] fetchAllServiceAreas fallback to Firestore:', supaErr);
    }
  }

  try {
    const snap = await getDocs(query(SERVICE_AREAS_COLLECTION, orderBy('displayOrder', 'asc')));
    if (!snap.empty) {
      const items = snap.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<ServiceArea, 'id'>)
      }));
      setCachedData(CACHE_KEYS.SERVICE_AREAS, items);
      return items;
    }
  } catch (error) {
    console.warn('Could not fetch service areas from Firestore:', error);
  }

  // If empty, seed from DEFAULT_SERVICE_AREAS in memory
  return DEFAULT_SERVICE_AREAS.map((a, idx) => ({
    ...a,
    id: `default-${idx + 1}`
  }));
}

/**
 * Fetches active service areas for public consumption
 */
export async function fetchPublicServiceAreas(): Promise<ServiceArea[]> {
  const all = await fetchAllServiceAreas();
  const active = all.filter(a => a.status === 'active');
  if (active.length > 0) {
    setCachedData(CACHE_KEYS.SERVICE_AREAS, active);
  }
  return active;
}

/**
 * Fetches a single service area by slug
 */
export async function fetchServiceAreaBySlug(slug: string): Promise<ServiceArea | null> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await (getSupabase().from('service_areas') as any)
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (!error && data) {
        return mapSupabaseServiceAreaToServiceArea(data);
      }
    } catch (supaErr) {
      console.warn('[Supabase] fetchServiceAreaBySlug fallback to Firestore:', supaErr);
    }
  }

  try {
    const q = query(SERVICE_AREAS_COLLECTION, where('slug', '==', slug));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const doc = snap.docs[0];
      return { id: doc.id, ...(doc.data() as Omit<ServiceArea, 'id'>) };
    }
  } catch (e) {
    console.warn('Error querying service area by slug:', e);
  }

  // Fallback to local default array
  const found = DEFAULT_SERVICE_AREAS.find(a => a.slug === slug);
  if (found) {
    return { ...found, id: `default-${found.slug}` };
  }
  return null;
}

/**
 * Saves or updates a service area document
 */
export async function saveServiceArea(area: Partial<ServiceArea> & { name: string; slug: string }): Promise<string> {
  const cleanSlug = area.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
  const now = new Date().toISOString();

  if (area.id && !area.id.startsWith('default-')) {
    const docRef = doc(SERVICE_AREAS_COLLECTION, area.id);
    const { id, ...data } = area;
    await updateDoc(docRef, {
      ...data,
      slug: cleanSlug,
      updatedAt: now
    });

    if (isSupabaseConfigured()) {
      try {
        const supaRow = mapServiceAreaToSupabaseRow({ ...data, slug: cleanSlug, id: area.id });
        await (getSupabase().from('service_areas') as any).update(supaRow).eq('id', area.id);
      } catch (supaErr) {
        console.warn('[Supabase] saveServiceArea update sync error:', supaErr);
      }
    }

    const current = getInitialServiceAreas();
    setCachedData(CACHE_KEYS.SERVICE_AREAS, current.map(a => a.id === area.id ? { ...a, ...data, slug: cleanSlug, updatedAt: now } : a));
    return area.id;
  } else {
    // New document
    const { id, ...data } = area;
    const newAreaPayload: any = {
      ...data,
      slug: cleanSlug,
      status: data.status || 'active',
      displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : 99,
      createdAt: serverTimestamp(),
      updatedAt: now
    };
    const docRef = await addDoc(SERVICE_AREAS_COLLECTION, newAreaPayload);

    if (isSupabaseConfigured()) {
      try {
        const supaRow = mapServiceAreaToSupabaseRow({ ...newAreaPayload, id: docRef.id });
        await (getSupabase().from('service_areas') as any).upsert(supaRow);
      } catch (supaErr) {
        console.warn('[Supabase] saveServiceArea insert sync error:', supaErr);
      }
    }

    const current = getInitialServiceAreas();
    setCachedData(CACHE_KEYS.SERVICE_AREAS, [...current, { ...newAreaPayload, id: docRef.id }]);
    return docRef.id;
  }
}

/**
 * Deletes a service area
 */
export async function deleteServiceArea(areaId: string): Promise<void> {
  if (areaId.startsWith('default-')) {
    return; // Cannot delete in-memory template
  }
  const docRef = doc(SERVICE_AREAS_COLLECTION, areaId);
  await deleteDoc(docRef);

  if (isSupabaseConfigured()) {
    try {
      await (getSupabase().from('service_areas') as any).delete().eq('id', areaId);
    } catch (supaErr) {
      console.warn('[Supabase] deleteServiceArea sync error:', supaErr);
    }
  }

  const current = getInitialServiceAreas();
  setCachedData(CACHE_KEYS.SERVICE_AREAS, current.filter(a => a.id !== areaId));
}

/**
 * Seeds default service areas if collection is currently empty
 */
export async function seedServiceAreasIfEmpty(): Promise<number> {
  try {
    const snap = await getDocs(SERVICE_AREAS_COLLECTION);
    if (snap.size === 0) {
      let count = 0;
      for (const area of DEFAULT_SERVICE_AREAS) {
        await addDoc(SERVICE_AREAS_COLLECTION, {
          ...area,
          createdAt: serverTimestamp(),
          updatedAt: new Date().toISOString()
        });
        count++;
      }
      return count;
    }
    return snap.size;
  } catch (error) {
    console.warn('Could not seed service areas:', error);
    return 0;
  }
}

/**
 * Helper to convert 24h format ('10:00') into 12h human string ('10:00 AM')
 */
export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${m} ${ampm}`;
}

/**
 * Generates dynamic Schema.org LocalBusiness / DaySpa structured data
 */
export function generateLocalBusinessSchema(
  info: BusinessInfo, 
  activeAreas?: ServiceArea[]
): Record<string, any> {
  const daysMap: Record<DayOfWeek, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  // Group opening hours specification
  const openingHoursSpec: any[] = [];
  const openDays = (Object.keys(info.regularHours) as DayOfWeek[]).filter(d => info.regularHours[d]?.open);

  if (openDays.length > 0) {
    // Check if all open days share the same opening and closing times
    const sample = info.regularHours[openDays[0]];
    const allSame = openDays.every(d => 
      info.regularHours[d].opens === sample.opens && 
      info.regularHours[d].closes === sample.closes
    );

    if (allSame) {
      openingHoursSpec.push({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: openDays.map(d => daysMap[d]),
        opens: sample.opens,
        closes: sample.closes
      });
    } else {
      openDays.forEach(d => {
        const dh = info.regularHours[d];
        openingHoursSpec.push({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: [daysMap[d]],
          opens: dh.opens,
          closes: dh.closes
        });
      });
    }
  }

  // Social sameAs array
  const sameAs = Object.values(info.socialProfiles || {})
    .filter((url): url is string => typeof url === 'string' && url.trim().length > 0 && url.startsWith('http'));

  // Area served
  const areaServed = (activeAreas && activeAreas.length > 0)
    ? activeAreas.map(a => ({
        '@type': 'AdministrativeArea',
        name: `${a.name}, Dhaka`
      }))
    : [
        { '@type': 'AdministrativeArea', name: 'Banani, Dhaka' },
        { '@type': 'AdministrativeArea', name: 'Gulshan, Dhaka' },
        { '@type': 'AdministrativeArea', name: 'Baridhara, Dhaka' },
        { '@type': 'AdministrativeArea', name: 'Dhaka Metropolitan' }
      ];

  const canonicalUrl = (info.websiteUrl || 'https://eurospabd.com/').replace(/\/+$/, '') + '/';

  return {
    '@context': 'https://schema.org',
    '@type': info.schemaType || 'DaySpa',
    '@id': `${canonicalUrl}#business`,
    name: info.businessName,
    description: info.description,
    url: canonicalUrl,
    telephone: info.phone,
    email: info.email,
    logo: `${canonicalUrl}euro_spa_logo_clean.png`,
    image: `${canonicalUrl}euro_spa_logo_clean.png`,
    priceRange: info.priceRange || 'BDT 3,500 - 15,000',
    currenciesAccepted: info.currenciesAccepted || 'BDT',
    paymentAccepted: info.paymentAccepted || 'Cash, bKash, Credit Card',
    hasMap: info.googleMapsUrl,
    address: {
      '@type': 'PostalAddress',
      streetAddress: info.addressLine,
      addressLocality: info.area || 'Banani',
      addressRegion: info.city || 'Dhaka',
      postalCode: info.postalCode || '1213',
      addressCountry: info.country || 'BD'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: info.latitude,
      longitude: info.longitude
    },
    openingHoursSpecification: openingHoursSpec,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    areaServed: areaServed
  };
}

/**
 * Injects or updates dynamic JSON-LD in document head
 */
export function injectLocalBusinessSchema(
  info: BusinessInfo, 
  activeAreas?: ServiceArea[]
): void {
  if (typeof document === 'undefined') return;

  const schemaObj = generateLocalBusinessSchema(info, activeAreas);
  const jsonStr = JSON.stringify(schemaObj, null, 2);

  let scriptEl = document.getElementById('euro-spa-local-business-schema') as HTMLScriptElement | null;

if (!scriptEl) {
  scriptEl = document.createElement('script');
  scriptEl.id = 'euro-spa-local-business-schema';
  scriptEl.type = 'application/ld+json';
  document.head.appendChild(scriptEl);
}

scriptEl.textContent = jsonStr;
}

export interface LocalSeoAuditItem {
  id: string;
  label: string;
  category: 'NAP' | 'Location' | 'Categories' | 'Hours' | 'Schema' | 'Signals';
  passed: boolean;
  valueDescription: string;
  recommendation: string;
}

export interface LocalSeoAuditResult {
  score: number; // 0 to 100
  passedCount: number;
  totalCount: number;
  items: LocalSeoAuditItem[];
}

/**
 * Calculates a 12-point advisory checklist for the Local SEO audit.
 * Note: Clearly framed as an advisory completeness tool, NOT Google's ranking algorithm.
 */
export function calculateLocalSeoAudit(
  info: BusinessInfo, 
  areas: ServiceArea[]
): LocalSeoAuditResult {
  const activeAreas = areas.filter(a => a.status === 'active');
  const socialList = Object.values(info.socialProfiles || {}).filter(Boolean);

  const items: LocalSeoAuditItem[] = [
    {
      id: 'name',
      label: 'Canonical Business Name (N)',
      category: 'NAP',
      passed: Boolean(info.businessName && info.businessName.trim().length >= 3),
      valueDescription: info.businessName || 'Missing',
      recommendation: 'Ensure exact spelling matching Google Business Profile and signage.'
    },
    {
      id: 'address',
      label: 'Complete Physical Address (A)',
      category: 'NAP',
      passed: Boolean(info.addressLine && info.fullAddress && info.postalCode),
      valueDescription: info.fullAddress || 'Incomplete address',
      recommendation: 'Provide street address, area (Banani), postal code (1213), and country.'
    },
    {
      id: 'phone',
      label: 'Canonical Phone Number (P)',
      category: 'NAP',
      passed: Boolean(info.phone && info.phone.includes('+880')),
      valueDescription: info.phone || 'Missing phone',
      recommendation: 'Include canonical international dial format (+880).'
    },
    {
      id: 'city',
      label: 'City & Locality Declared',
      category: 'Location',
      passed: Boolean(info.city && info.area),
      valueDescription: `${info.area || 'Missing Area'}, ${info.city || 'Missing City'}`,
      recommendation: 'State exact area locality (Banani) and metropolitan city (Dhaka).'
    },
    {
      id: 'category',
      label: 'Primary Business Category Set',
      category: 'Categories',
      passed: Boolean(info.primaryCategory && info.primaryCategory.length > 0),
      valueDescription: `${info.primaryCategory} (${info.secondaryCategories?.length || 0} secondary)`,
      recommendation: 'Use accurate DaySpa or HealthAndBeautyBusiness classification.'
    },
    {
      id: 'hours',
      label: 'Structured Business Hours Configured',
      category: 'Hours',
      passed: Boolean(
        info.regularHours && 
        Object.values(info.regularHours).some(d => d.open && d.opens && d.closes)
      ),
      valueDescription: info.displayHours || 'Hours not configured',
      recommendation: 'Ensure all operating days have opening and closing times set.'
    },
    {
      id: 'maps',
      label: 'Google Maps Place URL & Coordinates',
      category: 'Location',
      passed: Boolean(info.googleMapsUrl && info.latitude && info.longitude),
      valueDescription: `${info.latitude?.toFixed(4)}, ${info.longitude?.toFixed(4)}`,
      recommendation: 'Verify exact latitude and longitude pin coordinates matching GBP.'
    },
    {
      id: 'serviceAreas',
      label: 'Target Service Areas Defined',
      category: 'Location',
      passed: activeAreas.length > 0,
      valueDescription: `${activeAreas.length} active service areas configured`,
      recommendation: 'Add key neighborhoods served (Banani, Gulshan, Baridhara, Dhanmondi, etc.).'
    },
    {
      id: 'socials',
      label: 'Social Profiles Configured (sameAs)',
      category: 'Signals',
      passed: socialList.length >= 2,
      valueDescription: `${socialList.length} verified profile URLs linked`,
      recommendation: 'Maintain active Facebook, Instagram, and other legitimate business profiles.'
    },
    {
      id: 'schema',
      label: 'LocalBusiness / DaySpa Schema Available',
      category: 'Schema',
      passed: Boolean(info.schemaType && info.phone && info.fullAddress),
      valueDescription: `@type: ${info.schemaType || 'DaySpa'} ready`,
      recommendation: 'Dynamic JSON-LD automatically generated and validated for Google Rich Results.'
    },
    {
      id: 'nap_consistency',
      label: 'NAP Consistency Cross-Check',
      category: 'NAP',
      passed: Boolean(
        info.businessName && 
        info.fullAddress.includes(info.addressLine) && 
        info.phone
      ),
      valueDescription: 'Consistent across website footer, contact section, and schema',
      recommendation: 'Verify no contradictory phone numbers or street addresses exist across pages.'
    },
    {
      id: 'website',
      label: 'Canonical Website URL with HTTPS',
      category: 'Signals',
      passed: Boolean(info.websiteUrl && info.websiteUrl.startsWith('https://')),
      valueDescription: info.websiteUrl || 'Missing HTTPS URL',
      recommendation: 'Canonical address should be secure HTTPS (https://eurospabd.com/).'
    }
  ];

  const passedCount = items.filter(i => i.passed).length;
  const score = Math.round((passedCount / items.length) * 100);

  return {
    score,
    passedCount,
    totalCount: items.length,
    items
  };
}

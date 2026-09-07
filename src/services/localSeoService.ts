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
import { BusinessInfo, ServiceArea, RegularHours, DayOfWeek } from '../types';
import { SPA_INFO } from '../data/spaData';

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
  description: SPA_INFO.description || 'Euro Spa Center is a premium spa and wellness center located in Banani, Dhaka. We offer professional Swedish Massage, Deep Tissue Massage, Aromatherapy, Hot Stone Massage, Four Hand Massage, Body Scrub, and complete wellness therapy. Experience relaxation in a peaceful, hygienic, and luxurious environment with certified therapists.',
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
    shortDescription: 'Primary location of Euro Spa Center on Road 6, Banani with luxury suites and certified therapists.',
    content: 'Euro Spa Center is located in the heart of Banani, Dhaka at 73 Road No. 6. Our Banani flagship center features private sanitized treatment rooms, premium aromatherapy oils, and certified massage therapists specializing in Swedish massage, deep tissue, hot stone, and couples therapies.',
    status: 'active',
    seoTitle: 'Spa in Banani, Dhaka | Euro Spa Center',
    metaDescription: 'Visit Euro Spa Center on Road 6, Banani, Dhaka for authentic Swedish massage, deep tissue therapy, aromatherapy, and private luxury suites.',
    focusKeyword: 'Spa in Banani',
    displayOrder: 1
  },
  {
    name: 'Gulshan',
    slug: 'gulshan',
    shortDescription: 'Serving residents and corporate professionals across Gulshan 1 and Gulshan 2.',
    content: 'Just minutes away from Gulshan-1 and Gulshan-2 circles, Euro Spa Center provides residents and busy professionals with world-class relaxation therapies. Experience deep muscular stress relief, authentic aroma oils, and peaceful privacy in our nearby Banani location.',
    status: 'active',
    seoTitle: 'Spa & Massage near Gulshan, Dhaka | Euro Spa Center',
    metaDescription: 'Looking for a premier spa near Gulshan, Dhaka? Euro Spa Center offers certified massage therapists, tranquil suites, and rejuvenating therapies.',
    focusKeyword: 'Spa near Gulshan',
    displayOrder: 2
  },
  {
    name: 'Baridhara',
    slug: 'baridhara',
    shortDescription: 'Accessible luxury wellness therapies for Baridhara Diplomatic Zone and DOHS.',
    content: 'Euro Spa Center is situated conveniently close to the Baridhara Diplomatic Zone and Baridhara DOHS. We provide diplomats, expats, and residents with discrete, high-standard massage therapies and international spa wellness treatments.',
    status: 'active',
    seoTitle: 'Luxury Spa near Baridhara, Dhaka | Euro Spa Center',
    metaDescription: 'Exclusive therapeutic massage and relaxation therapies near Baridhara Diplomatic Zone at Euro Spa Center Banani. Certified therapists and hygienic suites.',
    focusKeyword: 'Spa near Baridhara',
    displayOrder: 3
  },
  {
    name: 'Dhanmondi',
    slug: 'dhanmondi',
    shortDescription: 'Top-rated relaxation and wellness therapies serving Dhanmondi clients.',
    content: 'Clients visiting from Dhanmondi choose Euro Spa Center for authentic Swedish, deep tissue, and four-hand body therapies. Our certified therapists provide customized massage pressure in a calm, noise-free sanctuary.',
    status: 'active',
    seoTitle: 'Spa & Massage Services for Dhanmondi Residents | Euro Spa Center',
    metaDescription: 'Premier body massage therapies, aromatherapy, and wellness treatments serving Dhanmondi residents at Euro Spa Center, Dhaka.',
    focusKeyword: 'Spa services for Dhanmondi',
    displayOrder: 4
  },
  {
    name: 'Uttara',
    slug: 'uttara',
    shortDescription: 'Certified massage and rejuvenating spa therapies accessible for Uttara residents.',
    content: 'Accessible via Dhaka Expressway and Airport Road, Euro Spa Center welcomes clients from Uttara seeking exceptional therapeutic care, authentic hot stone therapy, and revitalizing body scrubs.',
    status: 'active',
    seoTitle: 'Spa & Massage Therapy for Uttara Residents | Euro Spa Center',
    metaDescription: 'Experience premier Swedish massage and body therapy at Euro Spa Center, trusted by wellness enthusiasts from Uttara and across Dhaka.',
    focusKeyword: 'Spa therapy for Uttara',
    displayOrder: 5
  },
  {
    name: 'Dhaka',
    slug: 'dhaka',
    shortDescription: 'Premier destination for authentic therapeutic massage across the greater Dhaka area.',
    content: 'Euro Spa Center is a premier wellness destination in Dhaka, Bangladesh. We are dedicated to authentic therapeutic massage practices, maintaining stringent hygiene standards, and delivering an unforgettable relaxation journey.',
    status: 'active',
    seoTitle: 'Best Spa & Massage Center in Dhaka | Euro Spa Center',
    metaDescription: 'Euro Spa Center is a leading day spa in Dhaka, Bangladesh offering Swedish massage, aromatherapy, four-hand therapy, and rejuvenating body scrubs.',
    focusKeyword: 'Best Spa in Dhaka',
    displayOrder: 6
  }
];

/**
 * Fetches the canonical business information from Firestore siteSettings/business,
 * merging with fallback DEFAULT_BUSINESS_INFO.
 */
export async function fetchBusinessInfo(): Promise<BusinessInfo> {
  try {
    const snap = await getDoc(SETTINGS_DOC_REF);
    if (snap.exists()) {
      const data = snap.data();
      return {
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
    }
  } catch (error) {
    console.warn('Could not fetch business info from Firestore, using default:', error);
  }
  return DEFAULT_BUSINESS_INFO;
}

/**
 * Real-time listener for canonical business information from Firestore
 */
export function subscribeToBusinessInfo(callback: (info: BusinessInfo) => void): () => void {
  return onSnapshot(
    SETTINGS_DOC_REF,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        callback({
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
        });
      } else {
        callback(DEFAULT_BUSINESS_INFO);
      }
    },
    (error) => {
      console.warn('Firestore subscribeToBusinessInfo onSnapshot error:', error);
      callback(DEFAULT_BUSINESS_INFO);
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
  const current = await fetchBusinessInfo();
  const merged: BusinessInfo = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: adminEmail || 'admin'
  };

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
  try {
    const snap = await getDocs(query(SERVICE_AREAS_COLLECTION, orderBy('displayOrder', 'asc')));
    if (!snap.empty) {
      return snap.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<ServiceArea, 'id'>)
      }));
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
  return all.filter(a => a.status === 'active');
}

/**
 * Fetches a single service area by slug
 */
export async function fetchServiceAreaBySlug(slug: string): Promise<ServiceArea | null> {
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
    return area.id;
  } else {
    // New document
    const { id, ...data } = area;
    const docRef = await addDoc(SERVICE_AREAS_COLLECTION, {
      ...data,
      slug: cleanSlug,
      status: data.status || 'active',
      displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : 99,
      createdAt: serverTimestamp(),
      updatedAt: now
    });
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

  let scriptEl = document.getElementById('dynamic-local-business-schema') as HTMLScriptElement | null;
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = 'dynamic-local-business-schema';
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

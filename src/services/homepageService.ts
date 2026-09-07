import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { SPA_INFO } from '../data/spaData';

export interface HomepageContent {
  heroBannerImage: string;
  heroBannerAlt: string;
  heroTitle: string;
  heroTagline: string;
  categoryBadge: string;
  locationBadge: string;
  statusBadge: string;
  logoImage?: string;
  ratingOverride?: number;
  reviewsCountOverride?: number;
  announcementBanner?: {
    enabled: boolean;
    text: string;
    linkText?: string;
  };
  ctaButtons: {
    directions: { label: string; enabled: boolean };
    bookNow: { label: string; enabled: boolean };
    call: { label: string; enabled: boolean };
    whatsapp: { label: string; enabled: boolean };
  };
  floatingWhatsapp: {
    enabled: boolean;
    tooltipText: string;
  };
  updatedAt?: any;
  updatedBy?: string;
}

export const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  heroBannerImage: 'https://lh3.googleusercontent.com/geougc/AF1QipPLNOXvJcErsUyF-6Jorv4EaoC6kDl3WaDnpL6W=w800-h450-k-no',
  heroBannerAlt: 'Euro Spa Center Ambience',
  heroTitle: SPA_INFO.name || 'Euro Spa Center',
  heroTagline: SPA_INFO.tagline || 'Relax • Refresh • Rejuvenate',
  categoryBadge: SPA_INFO.category || 'Spa and Wellness Center',
  locationBadge: SPA_INFO.locationShort || 'Banani, Dhaka',
  statusBadge: `Open · ${SPA_INFO.openingHours} Daily`,
  logoImage: '',
  ratingOverride: SPA_INFO.rating || 4.9,
  reviewsCountOverride: SPA_INFO.reviewsCount || 21,
  announcementBanner: {
    enabled: false,
    text: 'Special Welcome Offer: Enjoy signature massage packages with certified therapists.',
    linkText: 'Book Now'
  },
  ctaButtons: {
    directions: { label: 'Directions', enabled: true },
    bookNow: { label: 'Book Now', enabled: true },
    call: { label: 'Call', enabled: true },
    whatsapp: { label: 'WhatsApp', enabled: true }
  },
  floatingWhatsapp: {
    enabled: true,
    tooltipText: 'Chat on WhatsApp'
  }
};

const HOMEPAGE_DOC_REF = doc(db, 'siteSettings', 'homepage');

export async function fetchHomepageContent(): Promise<HomepageContent> {
  try {
    const snap = await getDoc(HOMEPAGE_DOC_REF);
    if (snap.exists()) {
      const data = snap.data();
      return {
        ...DEFAULT_HOMEPAGE_CONTENT,
        ...data,
        ctaButtons: {
          ...DEFAULT_HOMEPAGE_CONTENT.ctaButtons,
          ...(data.ctaButtons || {})
        },
        floatingWhatsapp: {
          ...DEFAULT_HOMEPAGE_CONTENT.floatingWhatsapp,
          ...(data.floatingWhatsapp || {})
        },
        announcementBanner: {
          ...DEFAULT_HOMEPAGE_CONTENT.announcementBanner,
          ...(data.announcementBanner || {})
        }
      };
    }
    return DEFAULT_HOMEPAGE_CONTENT;
  } catch (err) {
    console.warn('Error fetching homepage content:', err);
    return DEFAULT_HOMEPAGE_CONTENT;
  }
}

export function subscribeToHomepageContent(callback: (content: HomepageContent) => void): () => void {
  try {
    return onSnapshot(HOMEPAGE_DOC_REF, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        callback({
          ...DEFAULT_HOMEPAGE_CONTENT,
          ...data,
          ctaButtons: {
            ...DEFAULT_HOMEPAGE_CONTENT.ctaButtons,
            ...(data.ctaButtons || {})
          },
          floatingWhatsapp: {
            ...DEFAULT_HOMEPAGE_CONTENT.floatingWhatsapp,
            ...(data.floatingWhatsapp || {})
          },
          announcementBanner: {
            ...DEFAULT_HOMEPAGE_CONTENT.announcementBanner,
            ...(data.announcementBanner || {})
          }
        });
      } else {
        callback(DEFAULT_HOMEPAGE_CONTENT);
      }
    }, (err) => {
      console.warn('Homepage snapshot error:', err);
      callback(DEFAULT_HOMEPAGE_CONTENT);
    });
  } catch (err) {
    console.warn('Error subscribing to homepage content:', err);
    return () => {};
  }
}

export async function updateHomepageContent(content: HomepageContent, updatedBy?: string): Promise<void> {
  await setDoc(HOMEPAGE_DOC_REF, {
    ...content,
    updatedAt: serverTimestamp(),
    updatedBy: updatedBy || 'admin'
  }, { merge: true });
}

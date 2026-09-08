import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { SPA_INFO } from '../data/spaData';
import { getCachedData, setCachedData, CACHE_KEYS } from './cacheService';

export interface AboutHighlight {
  id: string;
  title: string;
  description?: string;
  iconName?: string;
}

export interface AboutContent {
  heading: string;
  subheading?: string;
  description: string;
  secondaryText?: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  highlights: AboutHighlight[];
  yearsOfExperience?: string;
  clientsServed?: string;
  updatedAt?: any;
  updatedBy?: string;
}

export const DEFAULT_ABOUT_CONTENT: AboutContent = {
  heading: `About ${SPA_INFO.name || 'Euro Spa Center'}`,
  subheading: 'Banani’s Premier Luxury Wellness & Massage Sanctuary',
  description: SPA_INFO.description || 'Euro Spa Center is a premier wellness sanctuary situated in Banani, Dhaka. We offer specialized massage therapies, body scrubs, sauna experiences, and holistic wellness treatments delivered by certified and discreet therapists.',
  secondaryText: 'Step into a calm, clean, and private atmosphere crafted for complete physical renewal and mental peace. We adhere to the highest hygiene benchmarks with single-use sanitization, premium essential aromatherapy oils, and individual VIP suites.',
  featuredImage: 'https://lh3.googleusercontent.com/geougc/AF1QipPLNOXvJcErsUyF-6Jorv4EaoC6kDl3WaDnpL6W=w800-h450-k-no',
  featuredImageAlt: 'Euro Spa Center Interior & Ambience',
  yearsOfExperience: '8+ Years',
  clientsServed: '15,000+',
  highlights: [
    {
      id: 'hygiene',
      title: 'Hygienic Treatment Rooms',
      description: 'Sterilized linen, private VIP suites & rigorous sanitization protocols.'
    },
    {
      id: 'therapists',
      title: 'Professional Therapists',
      description: 'Certified, respectful male and female therapists trained in deep anatomy.'
    },
    {
      id: 'experience',
      title: 'Premium Spa Experience',
      description: 'Imported essential oils, gentle ambient lighting & calming acoustics.'
    },
    {
      id: 'private',
      title: 'Private & Comfortable',
      description: 'Completely discreet environment with personal shower & dressing areas.'
    }
  ]
};

const ABOUT_DOC_REF = doc(db, 'siteSettings', 'about');

export async function fetchAboutContent(): Promise<AboutContent> {
  try {
    const snap = await getDoc(ABOUT_DOC_REF);
    if (snap.exists()) {
      const data = snap.data();
      const merged: AboutContent = {
        ...DEFAULT_ABOUT_CONTENT,
        ...data,
        highlights: Array.isArray(data.highlights) && data.highlights.length > 0 
          ? data.highlights 
          : DEFAULT_ABOUT_CONTENT.highlights
      };
      setCachedData(CACHE_KEYS.ABOUT, merged);
      return merged;
    }
  } catch (err) {
    console.warn('Error fetching about content:', err);
  }
  return getInitialAboutContent();
}

/**
 * Returns the latest synchronously available About Us content (from cache if available)
 */
export function getInitialAboutContent(): AboutContent {
  const cached = getCachedData<AboutContent>(CACHE_KEYS.ABOUT);
  if (cached) {
    return {
      ...DEFAULT_ABOUT_CONTENT,
      ...cached,
      highlights: Array.isArray(cached.highlights) && cached.highlights.length > 0
        ? cached.highlights
        : DEFAULT_ABOUT_CONTENT.highlights
    };
  }
  return DEFAULT_ABOUT_CONTENT;
}

export function subscribeToAboutContent(callback: (content: AboutContent) => void): () => void {
  try {
    return onSnapshot(ABOUT_DOC_REF, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const merged: AboutContent = {
          ...DEFAULT_ABOUT_CONTENT,
          ...data,
          highlights: Array.isArray(data.highlights) && data.highlights.length > 0 
            ? data.highlights 
            : DEFAULT_ABOUT_CONTENT.highlights
        };
        setCachedData(CACHE_KEYS.ABOUT, merged);
        callback(merged);
      } else {
        const initial = getInitialAboutContent();
        callback(initial);
      }
    }, (err) => {
      console.warn('About content snapshot error:', err);
      const fallback = getInitialAboutContent();
      callback(fallback);
    });
  } catch (err) {
    console.warn('Error subscribing to about content:', err);
    return () => {};
  }
}

export async function updateAboutContent(content: AboutContent, updatedBy?: string): Promise<void> {
  const merged: AboutContent = {
    ...DEFAULT_ABOUT_CONTENT,
    ...content
  };

  // Update local cache immediately
  setCachedData(CACHE_KEYS.ABOUT, merged);

  await setDoc(ABOUT_DOC_REF, {
    ...merged,
    updatedAt: serverTimestamp(),
    updatedBy: updatedBy || 'admin'
  }, { merge: true });
}

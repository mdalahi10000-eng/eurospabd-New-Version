import { isSupabaseConfigured, getSupabase, subscribeToSupabaseTable } from '../supabase';
import { SPA_INFO } from '../data/spaData';
import { getCachedData, setCachedData, CACHE_KEYS } from './cacheService';

export interface AboutHighlight {
  id: string;
  title: string;
  description?: string;
  iconName?: string;
  imageUrl?: string;
}

export interface AboutContent {
  heading: string;
  subheading?: string;
  description: string;
  secondaryText?: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  logoImage?: string;
  facilityImage?: string;
  facilityImageAlt?: string;
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
  logoImage: '',
  facilityImage: '',
  facilityImageAlt: 'Euro Spa Center Banani Private VIP Sanctuary & Therapy Room',
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

export async function fetchAboutContent(): Promise<AboutContent> {
  if (!isSupabaseConfigured()) {
    return getInitialAboutContent();
  }

  try {
    const { data, error } = await (getSupabase().from('site_settings') as any)
      .select('data')
      .eq('id', 'about')
      .maybeSingle();

    if (!error && data?.data) {
      const merged: AboutContent = {
        ...DEFAULT_ABOUT_CONTENT,
        ...data.data,
        highlights: Array.isArray(data.data.highlights) && data.data.highlights.length > 0
          ? data.data.highlights
          : DEFAULT_ABOUT_CONTENT.highlights
      };
      setCachedData(CACHE_KEYS.ABOUT, merged);
      return merged;
    }
  } catch (supaErr) {
    console.warn('[Supabase] fetchAboutContent error:', supaErr);
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
  fetchAboutContent().then(callback);
  return subscribeToSupabaseTable('site_settings', async () => {
    const updated = await fetchAboutContent();
    callback(updated);
  });
}

export async function updateAboutContent(content: AboutContent, updatedBy?: string): Promise<void> {
  const merged: AboutContent = {
    ...DEFAULT_ABOUT_CONTENT,
    ...content
  };

  setCachedData(CACHE_KEYS.ABOUT, merged);

  if (isSupabaseConfigured()) {
    const { error } = await (getSupabase().from('site_settings') as any).upsert({
      id: 'about',
      data: merged,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy || 'admin'
    });
    if (error) {
      console.error('[Supabase] updateAboutContent error:', error);
      throw new Error(error.message || 'Failed to update about content.');
    }
  }
}

import { isSupabaseConfigured, getSupabase, subscribeToSupabaseTable } from '../supabase';
import { SPA_INFO } from '../data/spaData';
import { getCachedData, setCachedData, CACHE_KEYS } from './cacheService';

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

export async function fetchHomepageContent(): Promise<HomepageContent> {
  if (!isSupabaseConfigured()) {
    return getInitialHomepageContent();
  }

  try {
    const { data, error } = await (getSupabase().from('site_settings') as any)
      .select('data')
      .eq('id', 'homepage')
      .maybeSingle();

    if (!error && data?.data) {
      const merged: HomepageContent = {
        ...DEFAULT_HOMEPAGE_CONTENT,
        ...data.data,
        ctaButtons: {
          ...DEFAULT_HOMEPAGE_CONTENT.ctaButtons,
          ...(data.data.ctaButtons || {})
        },
        floatingWhatsapp: {
          ...DEFAULT_HOMEPAGE_CONTENT.floatingWhatsapp,
          ...(data.data.floatingWhatsapp || {})
        },
        announcementBanner: {
          ...DEFAULT_HOMEPAGE_CONTENT.announcementBanner,
          ...(data.data.announcementBanner || {})
        }
      };
      setCachedData(CACHE_KEYS.HOMEPAGE, merged);
      return merged;
    }
  } catch (supaErr) {
    console.warn('[Supabase] fetchHomepageContent error:', supaErr);
  }

  return getInitialHomepageContent();
}

/**
 * Returns the latest synchronously available homepage content (from cache if available)
 */
export function getInitialHomepageContent(): HomepageContent {
  const cached = getCachedData<HomepageContent>(CACHE_KEYS.HOMEPAGE);
  if (cached) {
    return {
      ...DEFAULT_HOMEPAGE_CONTENT,
      ...cached,
      ctaButtons: {
        ...DEFAULT_HOMEPAGE_CONTENT.ctaButtons,
        ...(cached.ctaButtons || {})
      },
      floatingWhatsapp: {
        ...DEFAULT_HOMEPAGE_CONTENT.floatingWhatsapp,
        ...(cached.floatingWhatsapp || {})
      },
      announcementBanner: {
        ...DEFAULT_HOMEPAGE_CONTENT.announcementBanner,
        ...(cached.announcementBanner || {})
      }
    };
  }
  return DEFAULT_HOMEPAGE_CONTENT;
}

export function subscribeToHomepageContent(callback: (content: HomepageContent) => void): () => void {
  fetchHomepageContent().then(callback);
  return subscribeToSupabaseTable('site_settings', async () => {
    const updated = await fetchHomepageContent();
    callback(updated);
  });
}

export async function updateHomepageContent(content: HomepageContent, updatedBy?: string): Promise<void> {
  const merged: HomepageContent = {
    ...DEFAULT_HOMEPAGE_CONTENT,
    ...content
  };
  // Update local cache immediately
  setCachedData(CACHE_KEYS.HOMEPAGE, merged);

  if (isSupabaseConfigured()) {
    const { error } = await (getSupabase().from('site_settings') as any).upsert({
      id: 'homepage',
      data: merged,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy || 'admin'
    });
    if (error) {
      console.error('[Supabase] updateHomepageContent error:', error);
      throw new Error(error.message || 'Failed to save homepage settings.');
    }
  }
}

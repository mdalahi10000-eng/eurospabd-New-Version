/**
 * Centralized Global SEO Configuration
 * Euro Spa Center - Dhaka, Bangladesh
 */

export const SEO_CONFIG = {
  siteName: 'Euro Spa Center',
  defaultTitle: 'Euro Spa Center | Spa & Massage Center in Banani, Dhaka',
  defaultMetaDescription: 'Euro Spa Center is a spa and wellness center in Banani, Dhaka, offering Swedish, deep tissue, aromatherapy, hot stone massage, body scrub and wellness treatments.',
  canonicalBaseUrl: 'https://eurospabd.com',
  defaultOgImage: 'https://eurospabd.com/photos/logo.jpg',
  defaultKeywords: [
    'spa banani',
    'massage center banani',
    'body massage dhaka',
    'euro spa dhaka',
    'best massage in banani',
    'relaxation spa banani',
    'swedish massage dhaka',
    'deep tissue massage dhaka'
  ],
  twitterHandle: '@eurospabd',
  robots: 'index, follow'
} as const;

/**
 * Builds an absolute canonical URL from a pathname.
 * Ensures single trailing slash for root and clean slug formatting for child paths.
 */
export function buildCanonicalUrl(path: string = '/'): string {
  if (!path || path === '/') {
    return `${SEO_CONFIG.canonicalBaseUrl}/`;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SEO_CONFIG.canonicalBaseUrl}${cleanPath.replace(/\/+$/, '')}`;
}

/**
 * Safely updates or creates a unique canonical link element in <head>.
 * Removes any duplicate or conflicting canonical tags to guarantee exactly one canonical tag exists.
 */
export function setCanonicalUrl(url: string): void {
  if (typeof document === 'undefined') return;

  const existingLinks = document.querySelectorAll('link[rel="canonical"]');
  if (existingLinks.length > 1) {
    existingLinks.forEach((link, index) => {
      if (index > 0) link.remove();
    });
  }

  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', url);
}

/**
 * Updates or creates a meta tag in document head
 */
export function updateMetaTag(attrName: 'name' | 'property', attrValue: string, content: string): void {
  if (typeof document === 'undefined') return;

  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Centralized SEO helper to apply document title, meta description,
 * canonical link, Open Graph tags, and robots directives consistently.
 */
export function updatePageSeo(options: {
  title?: string;
  description?: string;
  canonicalPath?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  robots?: string;
  keywords?: string[];
}): void {
  if (typeof document === 'undefined') return;

  // Title
  const title = options.title || SEO_CONFIG.defaultTitle;
  document.title = title;
  updateMetaTag('property', 'og:title', title);
  updateMetaTag('name', 'twitter:title', title);

  // Description
  const description = options.description || SEO_CONFIG.defaultMetaDescription;
  updateMetaTag('name', 'description', description);
  updateMetaTag('property', 'og:description', description);
  updateMetaTag('name', 'twitter:description', description);

  // Canonical
  const canonicalUrl = options.canonicalUrl || buildCanonicalUrl(options.canonicalPath || '/');
  setCanonicalUrl(canonicalUrl);
  updateMetaTag('property', 'og:url', canonicalUrl);

  // OG Image
  const ogImage = options.ogImage || SEO_CONFIG.defaultOgImage;
  updateMetaTag('property', 'og:image', ogImage);
  updateMetaTag('name', 'twitter:image', ogImage);

  // OG Site Name
  updateMetaTag('property', 'og:site_name', SEO_CONFIG.siteName);

  // OG Type
  updateMetaTag('property', 'og:type', options.ogType || 'website');

  // Robots
  updateMetaTag('name', 'robots', options.robots || SEO_CONFIG.robots);

  // Keywords
  if (options.keywords && options.keywords.length > 0) {
    updateMetaTag('name', 'keywords', options.keywords.join(', '));
  }
}

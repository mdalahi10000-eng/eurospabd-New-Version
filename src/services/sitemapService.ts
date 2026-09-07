import { SEO_CONFIG, buildCanonicalUrl } from '../config/seoConfig';
import { Article } from '../types';
import { Service } from '../types';
import { ServiceArea } from '../types';
import { fetchPublishedArticles } from './articlesService';
import { fetchPublicServices } from './servicesService';
import { fetchPublicServiceAreas } from './localSeoService';

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export interface SitemapUrlEntry {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: string;
}

/**
 * Generates a valid XML sitemap string from provided data.
 * Guarantees /admin, drafts, and inactive items are never included.
 */
export function buildSitemapXml(options: {
  articles?: Article[];
  services?: Service[];
  serviceAreas?: ServiceArea[];
}): string {
  const urls: SitemapUrlEntry[] = [];

  // 1. Homepage (Highest priority)
  urls.push({
    loc: buildCanonicalUrl('/'),
    changefreq: 'weekly',
    priority: '1.0'
  });

  // 1b. About Page
  urls.push({
    loc: buildCanonicalUrl('/about'),
    changefreq: 'weekly',
    priority: '0.8'
  });

  // 2. Blog Index
  urls.push({
    loc: buildCanonicalUrl('/blog'),
    changefreq: 'daily',
    priority: '0.8'
  });

  // 3. Published Blog Articles (strictly status === 'published')
  if (options.articles) {
    options.articles
      .filter(art => art.status === 'published' && art.slug && !art.slug.startsWith('admin'))
      .forEach(art => {
        const lastmod = art.updatedAt 
          ? new Date(art.updatedAt).toISOString().split('T')[0]
          : (art.publishedAt ? new Date(art.publishedAt).toISOString().split('T')[0] : undefined);

        urls.push({
          loc: buildCanonicalUrl(`/blog/${art.slug}`),
          lastmod,
          changefreq: 'weekly',
          priority: '0.7'
        });
      });
  }

  // 4. Active Spa Services (strictly active)
  if (options.services) {
    options.services
      .filter(svc => svc.status !== 'inactive' && (svc.slug || svc.id))
      .forEach(svc => {
        const slug = svc.slug || svc.id;
        const lastmod = svc.updatedAt ? new Date(svc.updatedAt).toISOString().split('T')[0] : undefined;

        urls.push({
          loc: buildCanonicalUrl(`/services/${slug}`),
          lastmod,
          changefreq: 'weekly',
          priority: '0.8'
        });
      });
  }

  // 5. Published Location Landing Pages (strictly active)
  if (options.serviceAreas) {
    options.serviceAreas
      .filter(area => area.status !== 'inactive' && area.slug)
      .forEach(area => {
        const priority = area.slug === 'banani' || area.slug === 'gulshan' ? '0.9' : '0.8';
        urls.push({
          loc: buildCanonicalUrl(`/locations/${area.slug}`),
          changefreq: 'weekly',
          priority
        });
      });
  }

  // Build formatted XML
  const xmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  ];

  for (const entry of urls) {
    xmlLines.push('  <url>');
    xmlLines.push(`    <loc>${escapeXml(entry.loc)}</loc>`);
    if (entry.lastmod) {
      xmlLines.push(`    <lastmod>${entry.lastmod}</lastmod>`);
    }
    if (entry.changefreq) {
      xmlLines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
    }
    if (entry.priority) {
      xmlLines.push(`    <priority>${entry.priority}</priority>`);
    }
    xmlLines.push('  </url>');
  }

  xmlLines.push('</urlset>');
  return xmlLines.join('\n');
}

/**
 * Dynamically queries published content and generates an up-to-date sitemap XML string.
 */
export async function generateDynamicSitemap(): Promise<string> {
  try {
    const [articles, services, serviceAreas] = await Promise.all([
      fetchPublishedArticles().catch(() => []),
      fetchPublicServices().catch(() => []),
      fetchPublicServiceAreas().catch(() => [])
    ]);

    return buildSitemapXml({ articles, services, serviceAreas });
  } catch (err) {
    console.warn('Dynamic sitemap generation fallback notice:', err);
    return buildSitemapXml({});
  }
}

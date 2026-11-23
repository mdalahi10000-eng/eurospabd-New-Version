/**
 * Euro Spa Center - build-time prerender for SEO
 *
 * Runs after `vite build`. For every public page (home, about, blog,
 * each blog post, each service, each location) it writes a static HTML
 * file into dist/ that already contains:
 *   - the correct <title>, meta description, canonical and Open Graph tags
 *   - page-specific JSON-LD schema (Service, BlogPosting, Breadcrumbs, FAQ)
 *   - real readable content (H1, text, prices) and crawlable <a href> links
 * The React app then loads on top exactly as before, so visitors see the
 * same site. Google, however, gets full content in the first HTML response.
 *
 * It also regenerates dist/sitemap.xml from the live data.
 *
 * Data comes from Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY, the
 * same public keys the site already uses). If Supabase can't be reached the
 * script falls back to scripts/migration/data/*.json. Any error is logged
 * and the build still succeeds (the plain SPA is kept).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const BASE_URL = 'https://eurospabd.com';
const SITE_NAME = 'Euro Spa Center';

// ---------------------------------------------------------------------------
// Env loading (.env, .env.production, .env.local - same order Vite uses)
// ---------------------------------------------------------------------------
function loadEnvFiles() {
  for (const file of ['.env', '.env.production', '.env.local', '.env.production.local']) {
    const p = path.join(ROOT, file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      const key = m[1];
      let val = m[2].replace(/^['"]|['"]$/g, '');
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const absUrl = (u) => {
  if (!u) return `${BASE_URL}/photos/logo.jpg`;
  if (/^https?:\/\//i.test(u)) return u;
  return `${BASE_URL}${u.startsWith('/') ? '' : '/'}${encodeURI(u)}`;
};

const canonical = (p) => (p === '/' ? `${BASE_URL}/` : `${BASE_URL}${p}`);

const isoDate = (v) => {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
};

/** Parses values that may be real arrays/objects, JSON strings, or Python-style repr strings. */
function looseParse(v, fallback) {
  if (v === null || v === undefined || v === '') return fallback;
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch (_) {}
  try {
    return JSON.parse(
      v.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false').replace(/\bNone\b/g, 'null').replace(/'/g, '"')
    );
  } catch (_) {
    return fallback;
  }
}

/** Very small markdown -> HTML converter (headings, lists, bold, italic, links, paragraphs). */
function markdownToHtml(md = '') {
  const inline = (t) =>
    esc(t)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text, href) => `<a href="${href}">${text}</a>`);

  const lines = String(md).replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let para = [];
  let list = null;
  const flushPara = () => {
    if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list) out.push(`<${list.type}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.type}>`);
    list = null;
  };
  for (const raw of lines) {
    const line = raw.trim();
    let m;
    if (!line) {
      flushPara();
      flushList();
    } else if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
      flushPara();
      flushList();
      const level = Math.min(Math.max(m[1].length, 2), 4); // page already has the H1
      out.push(`<h${level}>${inline(m[2])}</h${level}>`);
    } else if ((m = line.match(/^[-*+]\s+(.*)$/)) || (m = line.match(/^\d+[.)]\s+(.*)$/))) {
      flushPara();
      const type = /^\d/.test(line) ? 'ol' : 'ul';
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push(m[1]);
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return out.join('\n');
}

const stripMarkdown = (md = '') =>
  String(md)
    .replace(/[#*_>`]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------
async function supabaseGet(table, query) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars not set');
  const res = await fetch(`${url.replace(/\/+$/, '')}/rest/v1/${table}?${query}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) throw new Error(`${table}: HTTP ${res.status}`);
  return res.json();
}

function readMigration(name) {
  const p = path.join(ROOT, 'scripts', 'migration', 'data', `${name}.json`);
  if (!fs.existsSync(p)) return [];
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  return Array.isArray(d) ? d : Object.values(d);
}

const pick = (row, ...keys) => {
  for (const k of keys) if (row[k] !== undefined && row[k] !== null && row[k] !== '') return row[k];
  return undefined;
};

function normService(r) {
  const priceOptions = looseParse(pick(r, 'price_options', 'priceOptions'), [])
    .map((o) => ({
      duration: String(o.duration || '').trim(),
      price: String(o.price || '').trim(),
      amount: Number(o.amount) || parseInt(String(o.price || '').replace(/[^\d]/g, ''), 10) || 0
    }))
    .filter((o) => o.duration);
  return {
    id: String(pick(r, 'id', '_id')),
    name: r.name,
    slug: pick(r, 'slug', 'id', '_id'),
    durationRange: pick(r, 'duration_range', 'durationRange') || priceOptions.map((o) => o.duration).join(' / '),
    shortDescription: pick(r, 'short_description', 'shortDescription') || '',
    fullDescription: pick(r, 'full_description', 'fullDescription') || '',
    image: r.image || '',
    imageAlt: pick(r, 'image_alt', 'imageAlt') || '',
    category: r.category || 'Massage Therapy',
    price: r.price || priceOptions[0]?.price || '',
    priceOptions,
    benefits: looseParse(r.benefits, []),
    status: r.status || 'active',
    displayOrder: Number(pick(r, 'display_order', 'displayOrder')) || 0,
    seoTitle: pick(r, 'seo_title', 'seoTitle'),
    metaDescription: pick(r, 'meta_description', 'metaDescription'),
    robotsIndex: String(pick(r, 'robots_index', 'robotsIndex') ?? 'true').toLowerCase() !== 'false',
    ogImage: pick(r, 'og_image', 'ogImage'),
    updatedAt: pick(r, 'updated_at', 'updatedAt')
  };
}

function normArticle(r) {
  return {
    id: String(pick(r, 'id', '_id')),
    title: r.title,
    slug: r.slug,
    excerpt: r.excerpt || '',
    content: r.content || '',
    featuredImage: pick(r, 'featured_image', 'featuredImage') || '',
    imageAlt: pick(r, 'image_alt', 'imageAlt') || '',
    category: r.category || 'Wellness',
    author: r.author || 'Euro Spa Editorial Team',
    status: r.status || 'draft',
    publishedAt: pick(r, 'published_at', 'publishedAt', 'created_at', 'createdAt'),
    updatedAt: pick(r, 'updated_at', 'updatedAt'),
    seoTitle: pick(r, 'seo_title', 'seoTitle'),
    metaDescription: pick(r, 'meta_description', 'metaDescription'),
    ogImage: pick(r, 'og_image', 'ogImage')
  };
}

function normArea(r) {
  return {
    id: String(pick(r, 'id', '_id')),
    name: r.name,
    slug: r.slug,
    shortDescription: pick(r, 'short_description', 'shortDescription', 'description') || '',
    content: r.content || '',
    status: r.status || 'active',
    seoTitle: pick(r, 'seo_title', 'seoTitle'),
    metaDescription: pick(r, 'meta_description', 'metaDescription'),
    displayOrder: Number(pick(r, 'display_order', 'displayOrder')) || 0,
    updatedAt: pick(r, 'updated_at', 'updatedAt')
  };
}

function normFaq(r) {
  return {
    question: r.question,
    answer: r.answer,
    status: r.status || 'active',
    order: Number(pick(r, 'sort_order', 'sortOrder', 'displayOrder')) || 0
  };
}

const DEFAULT_BUSINESS = {
  businessName: SITE_NAME,
  description:
    'Euro Spa Center is a professional spa and wellness center in Banani, Dhaka offering Swedish, deep tissue, aromatherapy and hot stone massage.',
  phone: '+8801328253172',
  displayPhone: '+8801328253172',
  whatsappNumber: '8801328253172',
  email: '',
  fullAddress: '73 Road No. 6, Banani, Dhaka 1213, Bangladesh',
  addressLine: '73 Road No. 6',
  area: 'Banani',
  city: 'Dhaka',
  postalCode: '1213',
  country: 'BD',
  latitude: 23.7931511,
  longitude: 90.4030721,
  googleMapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJBXYo6tfHVTcR1ZOGYIsTHt4',
  displayHours: '10:00 AM – 10:00 PM Daily',
  opens: '10:00',
  closes: '22:00',
  priceRange: 'BDT 3,500 - 15,000',
  paymentAccepted: 'Cash, bKash, Credit Card, Debit Card',
  socialProfiles: {
    facebook: 'https://www.facebook.com/profile.php?id=61592822445077',
    instagram: 'https://www.instagram.com/euro.spa.center/'
  }
};

function normBusiness(d) {
  if (!d) return { ...DEFAULT_BUSINESS };
  const hours = looseParse(d.regularHours, null);
  const firstOpen = hours ? Object.values(hours).find((h) => h && h.open) : null;
  return {
    ...DEFAULT_BUSINESS,
    ...Object.fromEntries(Object.entries(d).filter(([, v]) => v !== '' && v !== null && v !== undefined)),
    latitude: Number(d.latitude) || DEFAULT_BUSINESS.latitude,
    longitude: Number(d.longitude) || DEFAULT_BUSINESS.longitude,
    opens: firstOpen?.opens || DEFAULT_BUSINESS.opens,
    closes: firstOpen?.closes || DEFAULT_BUSINESS.closes,
    socialProfiles: { ...DEFAULT_BUSINESS.socialProfiles, ...looseParse(d.socialProfiles, {}) }
  };
}

async function loadData() {
  try {
    const [services, articles, areas, settings, faqs] = await Promise.all([
      supabaseGet('services', 'select=*&status=eq.active&order=display_order.asc'),
      supabaseGet('articles', 'select=*&status=eq.published'),
      supabaseGet('service_areas', 'select=*&status=eq.active&order=display_order.asc'),
      supabaseGet('site_settings', 'select=data&id=eq.business'),
      supabaseGet('faqs', 'select=*&order=sort_order.asc').catch(() => [])
    ]);
    if (!services.length) throw new Error('no services returned');
    console.log('[prerender] Loaded live data from Supabase');
    return {
      source: 'supabase',
      services: services.map(normService),
      articles: articles.map(normArticle),
      areas: areas.map(normArea),
      business: normBusiness(settings[0]?.data),
      faqs: faqs.map(normFaq).filter((f) => f.status === 'active' && f.question)
    };
  } catch (err) {
    console.warn(`[prerender] Supabase unavailable (${err.message}); using scripts/migration/data fallback`);
    const settings = readMigration('siteSettings').find((s) => (s._id || s.id) === 'business');
    const business = normBusiness(settings);
    // The migration snapshot holds an old phone number; keep the current one.
    Object.assign(business, {
      phone: DEFAULT_BUSINESS.phone,
      displayPhone: DEFAULT_BUSINESS.displayPhone,
      whatsappNumber: DEFAULT_BUSINESS.whatsappNumber
    });
    return {
      source: 'fallback',
      services: readMigration('services').map(normService).filter((s) => s.status === 'active'),
      articles: readMigration('articles').map(normArticle).filter((a) => a.status === 'published'),
      areas: readMigration('serviceAreas').map(normArea).filter((a) => a.status === 'active'),
      business,
      faqs: readMigration('faqs').map(normFaq).filter((f) => f.status === 'active' && f.question)
    };
  }
}

// ---------------------------------------------------------------------------
// Schema builders
// ---------------------------------------------------------------------------
function businessSchema(b, areas) {
  const sameAs = Object.values(b.socialProfiles || {}).filter(Boolean);
  if (b.googleMapsUrl) sameAs.push(b.googleMapsUrl);
  return {
    '@context': 'https://schema.org',
    '@type': 'DaySpa',
    '@id': `${BASE_URL}/#business`,
    name: b.businessName,
    description: b.description,
    url: `${BASE_URL}/`,
    telephone: String(b.phone).replace(/[^\d+]/g, ''),
    logo: `${BASE_URL}/photos/logo.jpg`,
    image: [`${BASE_URL}/photos/entrance.jpg`, `${BASE_URL}/photos/reception_desk.jpg`, `${BASE_URL}/photos/logo.jpg`],
    priceRange: b.priceRange,
    currenciesAccepted: 'BDT',
    paymentAccepted: b.paymentAccepted,
    hasMap: b.googleMapsUrl,
    address: {
      '@type': 'PostalAddress',
      streetAddress: b.addressLine,
      addressLocality: b.area,
      addressRegion: b.city,
      postalCode: b.postalCode,
      addressCountry: b.country || 'BD'
    },
    geo: { '@type': 'GeoCoordinates', latitude: b.latitude, longitude: b.longitude },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: b.opens,
        closes: b.closes
      }
    ],
    areaServed: [b.area, ...areas.map((a) => a.name)].filter((v, i, arr) => v && arr.indexOf(v) === i).map((name) => ({ '@type': 'Place', name: `${name}, Dhaka` })),
    sameAs: [...new Set(sameAs)]
  };
}

const breadcrumbs = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: canonical(p) }))
});

// ---------------------------------------------------------------------------
// Shared HTML pieces (inline styles: shown only until React loads)
// ---------------------------------------------------------------------------
const WRAP = 'max-width:960px;margin:0 auto;padding:24px 16px;font-family:system-ui,sans-serif;color:#111827;line-height:1.6';

function navHtml(data) {
  const svc = data.services.map((s) => `<a href="/services/${esc(s.slug)}">${esc(s.name)}</a>`).join(' · ');
  return `<nav aria-label="Main" style="font-size:14px;margin-bottom:16px"><a href="/">Home</a> · <a href="/services">Services</a> · <a href="/blog">Blog</a> · <a href="/about">About Us</a><br>${svc}</nav>`;
}

function footerHtml(data) {
  const b = data.business;
  const areas = data.areas.map((a) => `<a href="/locations/${esc(a.slug)}">${esc(a.name)}</a>`).join(' · ');
  const posts = data.articles.slice(0, 6).map((a) => `<li><a href="/blog/${esc(a.slug)}">${esc(a.title)}</a></li>`).join('');
  return `<footer style="margin-top:32px;border-top:1px solid #e5e7eb;padding-top:16px;font-size:14px">
<p><strong>${esc(b.businessName)}</strong><br>${esc(b.fullAddress)}<br>Phone: <a href="tel:${esc(String(b.phone).replace(/[^\d+]/g, ''))}">${esc(b.displayPhone || b.phone)}</a><br>Open ${esc(b.displayHours)}<br><a href="${esc(b.googleMapsUrl)}" rel="noopener">Get directions on Google Maps</a></p>
${areas ? `<p>Service areas: ${areas}</p>` : ''}
${posts ? `<p>Latest articles:</p><ul>${posts}</ul>` : ''}
</footer>`;
}

function pageShell(data, inner) {
  return `<div style="${WRAP}">${navHtml(data)}<main>${inner}</main>${footerHtml(data)}</div>`;
}

// Banani is where the spa is; other areas are "near" pages (we do not claim a branch there).
function locationTitle(a, site) {
  if (a.slug === 'banani') return `Spa in Banani, Dhaka | Body Massage | ${site}`;
  if (a.slug === 'dhaka') return `Spa & Massage Center in Dhaka | ${site}`;
  return `Spa & Massage near ${a.name}, Dhaka | ${site}`;
}

// Short, search-friendly fallback (the stored short description can be a full paragraph).
function locationDescription(a, b) {
  const hours = 'Open daily 10 AM–10 PM';
  if (a.slug === 'banani') return `Spa in Banani, Dhaka: body massage, Swedish, deep tissue, hot stone and aromatherapy at ${SITE_NAME}, 73 Road No. 6. ${hours}. WhatsApp ${b.displayPhone}.`;
  if (a.slug === 'dhaka') return `${SITE_NAME}: spa and massage center in Banani, Dhaka. Swedish, deep tissue, hot stone and aromatherapy massage. ${hours}. WhatsApp ${b.displayPhone}.`;
  return `Spa & massage near ${a.name}, Dhaka: ${SITE_NAME} is at 73 Road No. 6, Banani. Swedish, deep tissue, hot stone and aromatherapy massage. ${hours}.`;
}

function serviceFaqHtml(s, b) {
  const biz = b.businessName || SITE_NAME;
  const priceList = s.priceOptions.filter((o) => o.duration && o.price).map((o) => `${o.duration}: ${o.price}`).join(', ');
  const faqs = [
    [`Where can I book ${s.name} near Banani and Gulshan?`, `${biz} is at ${b.fullAddress}, close to Gulshan. Use Get Directions to open the location in Google Maps.`],
    ...(priceList ? [[`How much does ${s.name} cost in ${b.area}?`, `${s.name} prices at ${biz}: ${priceList}.`]] : []),
    ['What are your opening hours?', `We are open ${b.displayHours}.`],
    [`How do I book ${s.name}?`, `Press Book This Treatment, or call or WhatsApp us on ${b.displayPhone || b.phone}.`]
  ];
  return `<h2>${esc(s.name)} in ${esc(b.area)} – Common Questions</h2>${faqs.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('')}`;
}

function serviceListHtml(services, heading = 'Our Spa & Massage Services') {
  return `<h2>${esc(heading)}</h2><ul>${services
    .map(
      (s) =>
        `<li><a href="/services/${esc(s.slug)}"><strong>${esc(s.name)}</strong></a> – ${esc(s.durationRange)}${s.price ? ` – from ${esc(s.price)}` : ''}. ${esc(s.shortDescription)}</li>`
    )
    .join('')}</ul>`;
}

// ---------------------------------------------------------------------------
// HTML templating
// ---------------------------------------------------------------------------
function setMeta(html, attr, name, content) {
  const re = new RegExp(`<meta\\s+${attr}="${name.replace(/[:]/g, '\\:')}"[^>]*>`, 'i');
  const tag = `<meta ${attr}="${name}" content="${esc(content)}" />`;
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
}

function renderPage(template, { title, description, path: p, image, type = 'website', schemas = [], body, robots = 'index, follow' }, data) {
  let html = template;
  const url = canonical(p);
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`);
  html = setMeta(html, 'name', 'description', description);
  html = setMeta(html, 'name', 'robots', robots);
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'property', 'og:description', description);
  html = setMeta(html, 'property', 'og:url', url);
  html = setMeta(html, 'property', 'og:type', type);
  html = setMeta(html, 'property', 'og:image', absUrl(image));
  html = setMeta(html, 'name', 'twitter:title', title);
  html = setMeta(html, 'name', 'twitter:description', description);
  html = setMeta(html, 'name', 'twitter:image', absUrl(image));
  html = html.replace(/<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${url}" />`);

  // Business schema (keeps the id the React app updates later)
  const biz = JSON.stringify(businessSchema(data.business, data.areas));
  html = html.replace(
    /<script type="application\/ld\+json" id="euro-spa-local-business-schema">[\s\S]*?<\/script>/,
    `<script type="application/ld+json" id="euro-spa-local-business-schema">${biz}</script>`
  );
  if (schemas.length) {
    html = html.replace(
      '</head>',
      `    <script type="application/ld+json" id="prerender-page-schema">${JSON.stringify(schemas).replace(/</g, '\\u003c')}</script>\n  </head>`
    );
  }
  html = html.replace(/<div id="root"><\/div>/, `<div id="root">${pageShell(data, body)}</div>`);
  return html;
}

function writeFile(rel, content) {
  const out = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, content);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  loadEnvFiles();
  const templatePath = path.join(DIST, 'index.html');
  if (!fs.existsSync(templatePath)) throw new Error('dist/index.html not found - run vite build first');
  const template = fs.readFileSync(templatePath, 'utf8');
  if (!template.includes('<div id="root"></div>')) throw new Error('root div not found in template');

  const data = await loadData();
  const b = data.business;
  const where = `${b.area}, ${b.city}`;
  const pages = [];
  const add = (page, lastmod, priority, changefreq = 'weekly') => pages.push({ ...page, lastmod, priority, changefreq });

  // Home
  const faqs = data.faqs.sort((x, y) => x.order - y.order);
  add(
    {
      path: '/',
      title: `Spa in ${where} | Body Massage | ${SITE_NAME}`,
      description: `Spa in ${where}: body massage, Swedish, deep tissue, hot stone and aromatherapy massage at ${SITE_NAME}. Open daily 10 AM–10 PM. WhatsApp ${b.displayPhone}.`,
      image: '/photos/logo.jpg',
      schemas: faqs.length
        ? [
            {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } }))
            }
          ]
        : [],
      body: `<h1>${esc(SITE_NAME)} – Spa & Massage Center in ${esc(where)}</h1>
<p>${esc(b.description)}</p>
${serviceListHtml(data.services)}
${faqs.length ? `<h2>Frequently Asked Questions</h2>${faqs.map((f) => `<h3>${esc(f.question)}</h3><p>${esc(f.answer)}</p>`).join('')}` : ''}`
    },
    new Date().toISOString().slice(0, 10),
    '1.0'
  );

  // About
  add(
    {
      path: '/about',
      title: `About ${SITE_NAME} | Spa & Massage in ${where}`,
      description: `Learn about ${SITE_NAME}, a professional spa and massage center in ${where}. Address, opening hours, therapists and our wellness treatments.`,
      schemas: [breadcrumbs([['Home', '/'], ['About Us', '/about']])],
      body: `<h1>About ${esc(SITE_NAME)}</h1><p>${esc(b.description)}</p>${serviceListHtml(data.services, 'Treatments We Offer')}`
    },
    undefined,
    '0.7',
    'monthly'
  );

  // Services overview
  add(
    {
      path: '/services',
      title: `Massage Services & Prices in ${where} | ${SITE_NAME}`,
      description: `All spa and massage treatments at ${SITE_NAME} in ${where} with durations and prices. Swedish, deep tissue, hot stone, aromatherapy, dry and oil massage.`,
      schemas: [breadcrumbs([['Home', '/'], ['Services', '/services']])],
      body: `<h1>Spa & Massage Services in ${esc(where)}</h1>${serviceListHtml(data.services, 'All Treatments & Prices')}`
    },
    undefined,
    '0.9'
  );

  // Services
  for (const s of data.services) {
    const p = `/services/${s.slug}`;
    const offers = s.priceOptions
      .filter((o) => o.amount > 0)
      .map((o) => ({ '@type': 'Offer', name: `${s.name} - ${o.duration}`, price: o.amount, priceCurrency: 'BDT', url: canonical(p) }));
    const paragraphs = String(s.fullDescription || '')
      .split(/\n\s*\n/)
      .map((t) => t.trim())
      .filter(Boolean);
    const others = data.services.filter((o) => o !== s);
    add(
      {
        path: p,
        title: s.seoTitle || `${s.name} in ${where} | ${SITE_NAME}`,
        description: s.metaDescription || s.shortDescription || `${s.name} at ${SITE_NAME}, ${b.fullAddress}.`,
        image: s.ogImage || s.image,
        robots: s.robotsIndex ? 'index, follow' : 'noindex, follow',
        schemas: [
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            '@id': `${canonical(p)}#service`,
            name: s.name,
            serviceType: s.category,
            description: stripMarkdown(s.fullDescription || s.shortDescription),
            image: absUrl(s.image),
            url: canonical(p),
            areaServed: { '@type': 'City', name: b.city },
            provider: { '@id': `${BASE_URL}/#business` },
            ...(offers.length ? { offers } : {})
          },
          breadcrumbs([['Home', '/'], ['Services', '/services'], [s.name, p]])
        ],
        body: `<p><a href="/">Home</a> › <a href="/services">Services</a> › ${esc(s.name)}</p>
<h1>${esc(s.name)} in ${esc(where)}</h1>
<p>${esc(s.shortDescription)}</p>
${s.image ? `<img src="${esc(s.image)}" alt="${esc(s.imageAlt || `${s.name} at ${SITE_NAME} in ${where}`)}" width="600" height="400" style="max-width:100%;height:auto">` : ''}
${paragraphs.length ? `<h2>What to Expect from ${esc(s.name)} at ${esc(SITE_NAME)}</h2>${paragraphs.map((t) => `<p>${esc(t)}</p>`).join('')}` : ''}
${s.priceOptions.length ? `<h2>${esc(s.name)} Price in ${esc(where)}</h2><ul>${s.priceOptions.map((o) => `<li>${esc(o.duration)}: ${esc(o.price)}</li>`).join('')}</ul>` : ''}
${s.benefits.length ? `<h2>Benefits of ${esc(s.name)}</h2><ul>${s.benefits.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
${serviceFaqHtml(s, b)}
${others.length ? serviceListHtml(others, `Other Spa Treatments in ${b.area}`) : ''}`
      },
      isoDate(s.updatedAt),
      '0.8'
    );
  }

  // Locations
  for (const a of data.areas) {
    const p = `/locations/${a.slug}`;
    add(
      {
        path: p,
        title: a.seoTitle || locationTitle(a, SITE_NAME),
        description: a.metaDescription || locationDescription(a, b),
        schemas: [breadcrumbs([['Home', '/'], [a.name, p]])],
        body: `<p><a href="/">Home</a> › ${esc(a.name)}</p>
<h1>${esc(a.seoTitle || `Spa & Massage Therapy in ${a.name}, Dhaka`)}</h1>
<p>${esc(a.shortDescription)}</p>
${a.content ? `<h2>Relaxation & Therapeutic Wellness for ${esc(a.name)} Clients</h2>${markdownToHtml(a.content)}` : ''}
${serviceListHtml(data.services, `Popular Therapies for ${a.name} Visitors`)}`
      },
      isoDate(a.updatedAt),
      '0.7'
    );
  }

  // Blog list
  const articles = [...data.articles].sort((x, y) => new Date(y.publishedAt) - new Date(x.publishedAt));
  add(
    {
      path: '/blog',
      title: `Wellness Blog & Spa Articles | ${SITE_NAME} | ${where}`,
      description: `Explore spa therapy guides, Swedish massage benefits, aromatherapy tips, and wellness advice from ${SITE_NAME} in ${where}.`,
      schemas: [breadcrumbs([['Home', '/'], ['Blog', '/blog']])],
      body: `<h1>Spa & Wellness Journal</h1><ul>${articles
        .map((a) => `<li><a href="/blog/${esc(a.slug)}"><strong>${esc(a.title)}</strong></a><br>${esc(a.excerpt)}</li>`)
        .join('')}</ul>`
    },
    isoDate(articles[0]?.updatedAt || articles[0]?.publishedAt),
    '0.8',
    'daily'
  );

  // Blog posts
  for (const a of articles) {
    const p = `/blog/${a.slug}`;
    const pub = isoDate(a.publishedAt);
    add(
      {
        path: p,
        title: a.seoTitle || `${a.title} | ${SITE_NAME}`,
        description: a.metaDescription || a.excerpt,
        image: a.ogImage || a.featuredImage,
        type: 'article',
        schemas: [
          {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: a.title,
            description: a.metaDescription || a.excerpt,
            image: absUrl(a.featuredImage || a.ogImage),
            ...(pub ? { datePublished: pub } : {}),
            ...(isoDate(a.updatedAt) ? { dateModified: isoDate(a.updatedAt) } : {}),
            author: { '@type': 'Person', name: a.author },
            publisher: { '@id': `${BASE_URL}/#business` },
            mainEntityOfPage: canonical(p)
          },
          breadcrumbs([['Home', '/'], ['Blog', '/blog'], [a.title, p]])
        ],
        body: `<p><a href="/">Home</a> › <a href="/blog">Blog</a> › ${esc(a.category)}</p>
<article><h1>${esc(a.title)}</h1><p>By ${esc(a.author)}${pub ? ` · ${pub}` : ''}</p>
${a.featuredImage ? `<img src="${esc(a.featuredImage)}" alt="${esc(a.imageAlt || a.title)}" style="max-width:100%;height:auto">` : ''}
${markdownToHtml(a.content)}</article>`
      },
      isoDate(a.updatedAt || a.publishedAt),
      '0.7',
      'monthly'
    );
  }

  // Write pages. Cloudflare serves /services/foo from services/foo.html (no redirect).
  for (const pg of pages) {
    const html = renderPage(template, pg, data);
    const rel = pg.path === '/' ? 'index.html' : `${pg.path.replace(/^\//, '')}.html`;
    writeFile(rel, html);
  }

  // Sitemap (only real, indexable pages)
  const urls = pages
    .filter((pg) => !pg.robots || pg.robots.startsWith('index'))
    .map(
      (pg) =>
        `  <url>\n    <loc>${canonical(pg.path)}</loc>\n${pg.lastmod ? `    <lastmod>${pg.lastmod}</lastmod>\n` : ''}    <changefreq>${pg.changefreq}</changefreq>\n    <priority>${pg.priority}</priority>\n  </url>`
    );
  writeFile('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);

  console.log(`[prerender] Wrote ${pages.length} pages + sitemap.xml (data: ${data.source})`);
}

main().catch((err) => {
  // Never break the deployment: the normal SPA still works without prerendering.
  console.warn('[prerender] Skipped:', err.message);
});

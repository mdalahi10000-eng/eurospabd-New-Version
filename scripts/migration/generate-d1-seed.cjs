const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, 'data');
const OUTPUT_FILE = path.resolve(__dirname, 'seed-d1-data.sql');

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

function boolInt(val, defaultVal = 0) {
  if (val === undefined || val === null) return String(defaultVal);
  return val ? '1' : '0';
}

function jsonText(val, defaultVal = '[]') {
  if (val === undefined || val === null) return `'${defaultVal}'`;
  return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
}

function strVal(val, defaultVal = null) {
  if (val === undefined || val === null) {
    return defaultVal === null ? 'NULL' : `'${defaultVal.replace(/'/g, "''")}'`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

function numVal(val, defaultVal = null) {
  if (val === undefined || val === null || isNaN(Number(val))) {
    return defaultVal === null ? 'NULL' : String(defaultVal);
  }
  return String(Number(val));
}

let sqlStatements = [];
sqlStatements.push('-- Euro Spa Center - Cloudflare D1 Idempotent Seed Data');
sqlStatements.push('-- Generated from scripts/migration/data/ canonical JSON backups');
sqlStatements.push('');

const report = {};

// 1. Users
const usersPath = path.join(DATA_DIR, 'users.json');
if (fs.existsSync(usersPath)) {
  const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  report.users = users.length;
  sqlStatements.push('-- Table: users (' + users.length + ' records)');
  for (const u of users) {
    const id = strVal(u._id || u.uid || u.id);
    const email = strVal(u.email);
    const displayName = strVal(u.displayName);
    const photoUrl = strVal(u.photoURL || u.photoUrl);
    const phone = strVal(u.phone);
    const role = strVal(u.role || 'client');
    const createdAt = strVal(u.createdAt || new Date().toISOString());
    const updatedAt = strVal(u.updatedAt || new Date().toISOString());

    sqlStatements.push(
      `INSERT OR REPLACE INTO users (id, email, display_name, photo_url, phone, role, created_at, updated_at) VALUES (${id}, ${email}, ${displayName}, ${photoUrl}, ${phone}, ${role}, ${createdAt}, ${updatedAt});`
    );
  }
  sqlStatements.push('');
}

// 2. Admins
const adminsPath = path.join(DATA_DIR, 'admins.json');
if (fs.existsSync(adminsPath)) {
  const admins = JSON.parse(fs.readFileSync(adminsPath, 'utf8'));
  report.admins = admins.length;
  sqlStatements.push('-- Table: admins (' + admins.length + ' records)');
  for (const a of admins) {
    const id = strVal(a._id || a.id || 'admin_primary');
    const email = strVal(a.email || 'mdalahi10000@gmail.com');
    const displayName = strVal(a.displayName || 'MD Alahi');
    const role = strVal(a.role || 'admin');
    const permissions = jsonText(a.permissions || ['all']);
    const assignedAt = strVal(a.assignedAt || new Date().toISOString());

    sqlStatements.push(
      `INSERT OR REPLACE INTO admins (id, email, display_name, role, permissions, assigned_at) VALUES (${id}, ${email}, ${displayName}, ${role}, ${permissions}, ${assignedAt});`
    );
  }
  sqlStatements.push('');
}

// 3. Services
const servicesPath = path.join(DATA_DIR, 'services.json');
if (fs.existsSync(servicesPath)) {
  const services = JSON.parse(fs.readFileSync(servicesPath, 'utf8'));
  report.services = services.length;
  sqlStatements.push('-- Table: services (' + services.length + ' records)');
  for (const s of services) {
    const id = strVal(s._id || s.id);
    const name = strVal(s.name);
    const slug = strVal(s.slug);
    const durationRange = strVal(s.durationRange);
    const shortDesc = strVal(s.shortDescription, '');
    const fullDesc = strVal(s.fullDescription, '');
    const image = strVal(s.image, '');
    const imageAlt = strVal(s.imageAlt);
    const galleryImages = jsonText(s.galleryImages || []);
    const category = strVal(s.category, 'Massage Therapy');
    const price = strVal(s.price);
    const popular = boolInt(s.popular, 0);
    const priceOptions = jsonText(s.priceOptions || []);
    const benefits = jsonText(s.benefits || []);
    const bookingCta = strVal(s.bookingCta, 'Book Treatment');
    const displayOrder = numVal(s.displayOrder, 0);
    const status = strVal(s.status, 'active');
    const serviceAreas = jsonText(s.serviceAreas || []);
    const seoTitle = strVal(s.seoTitle);
    const metaDesc = strVal(s.metaDescription);
    const focusKeyword = strVal(s.focusKeyword);
    const secKeywords = jsonText(s.secondaryKeywords || []);
    const canonicalUrl = strVal(s.canonicalUrl);
    const robotsIndex = boolInt(s.robotsIndex !== false, 1);
    const robotsFollow = boolInt(s.robotsFollow !== false, 1);
    const ogTitle = strVal(s.ogTitle);
    const ogDesc = strVal(s.ogDescription);
    const ogImage = strVal(s.ogImage);
    const schemaType = strVal(s.schemaType, 'HealthAndBeautyBusiness');
    const customSchema = strVal(s.customSchema);
    const createdAt = strVal(s.createdAt || new Date().toISOString());
    const updatedAt = strVal(s.updatedAt || new Date().toISOString());

    sqlStatements.push(
      `INSERT OR REPLACE INTO services (id, name, slug, duration_range, short_description, full_description, image, image_alt, gallery_images, category, price, popular, price_options, benefits, booking_cta, display_order, status, service_areas, seo_title, meta_description, focus_keyword, secondary_keywords, canonical_url, robots_index, robots_follow, og_title, og_description, og_image, schema_type, custom_schema, created_at, updated_at) VALUES (${id}, ${name}, ${slug}, ${durationRange}, ${shortDesc}, ${fullDesc}, ${image}, ${imageAlt}, ${galleryImages}, ${category}, ${price}, ${popular}, ${priceOptions}, ${benefits}, ${bookingCta}, ${displayOrder}, ${status}, ${serviceAreas}, ${seoTitle}, ${metaDesc}, ${focusKeyword}, ${secKeywords}, ${canonicalUrl}, ${robotsIndex}, ${robotsFollow}, ${ogTitle}, ${ogDesc}, ${ogImage}, ${schemaType}, ${customSchema}, ${createdAt}, ${updatedAt});`
    );
  }
  sqlStatements.push('');
}

// 4. Reviews
const reviewsPath = path.join(DATA_DIR, 'reviews.json');
if (fs.existsSync(reviewsPath)) {
  const reviews = JSON.parse(fs.readFileSync(reviewsPath, 'utf8'));
  report.reviews = reviews.length;
  sqlStatements.push('-- Table: reviews (' + reviews.length + ' records)');
  for (const r of reviews) {
    const id = strVal(r._id || r.id);
    const userId = strVal(r.userId);
    const userName = strVal(r.userName || r.name || 'Client');
    const userPhoto = strVal(r.userPhoto || r.avatar);
    const rating = numVal(r.rating, 5.0);
    const comment = strVal(r.comment || r.reviewText || '');
    const serviceTag = strVal(r.serviceTag || r.serviceUsed);
    const verified = boolInt(r.verified !== false, 1);
    const status = strVal(r.status, 'approved');
    const adminResp = strVal(r.adminResponse);
    const adminRespAt = strVal(r.adminRespondedAt);
    const dateStr = strVal(r.dateString || r.dateStr || r.date);
    const dateString = strVal(r.dateString || r.dateStr || r.date);
    const createdAt = strVal(r.createdAt || new Date().toISOString());
    const updatedAt = strVal(r.updatedAt || new Date().toISOString());

    sqlStatements.push(
      `INSERT OR REPLACE INTO reviews (id, user_id, user_name, user_photo, rating, comment, service_tag, verified, status, admin_response, admin_responded_at, date_str, date_string, created_at, updated_at) VALUES (${id}, ${userId}, ${userName}, ${userPhoto}, ${rating}, ${comment}, ${serviceTag}, ${verified}, ${status}, ${adminResp}, ${adminRespAt}, ${dateStr}, ${dateString}, ${createdAt}, ${updatedAt});`
    );
  }
  sqlStatements.push('');
}

// 5. Appointments
const apptsPath = path.join(DATA_DIR, 'appointments.json');
const appts = fs.existsSync(apptsPath) ? JSON.parse(fs.readFileSync(apptsPath, 'utf8')) : [];
report.appointments = appts.length;
sqlStatements.push('-- Table: appointments (' + appts.length + ' records)');
for (const a of appts) {
  const id = strVal(a._id || a.id);
  const userId = strVal(a.userId);
  const userName = strVal(a.userName || a.name || 'Client');
  const userEmail = strVal(a.userEmail || a.email);
  const phone = strVal(a.phone || '');
  const serviceId = strVal(a.serviceId);
  const serviceName = strVal(a.serviceName || 'Massage Treatment');
  const duration = strVal(a.duration);
  const price = strVal(a.price);
  const prefDate = strVal(a.preferredDate || a.date || '');
  const prefTime = strVal(a.preferredTime || a.time || '');
  const status = strVal(a.status, 'pending');
  const notes = strVal(a.notes);
  const adminNotes = strVal(a.adminNotes);
  const createdAt = strVal(a.createdAt || new Date().toISOString());
  const updatedAt = strVal(a.updatedAt || new Date().toISOString());

  sqlStatements.push(
    `INSERT OR REPLACE INTO appointments (id, user_id, user_name, user_email, phone, service_id, service_name, duration, price, preferred_date, preferred_time, status, notes, admin_notes, created_at, updated_at) VALUES (${id}, ${userId}, ${userName}, ${userEmail}, ${phone}, ${serviceId}, ${serviceName}, ${duration}, ${price}, ${prefDate}, ${prefTime}, ${status}, ${notes}, ${adminNotes}, ${createdAt}, ${updatedAt});`
  );
}
sqlStatements.push('');

// 6. Articles
const articlesPath = path.join(DATA_DIR, 'articles.json');
if (fs.existsSync(articlesPath)) {
  const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
  report.articles = articles.length;
  sqlStatements.push('-- Table: articles (' + articles.length + ' records)');
  for (const art of articles) {
    const id = strVal(art._id || art.id);
    const title = strVal(art.title);
    const slug = strVal(art.slug || (art._id || '').toLowerCase());
    const excerpt = strVal(art.excerpt, '');
    const content = strVal(art.content, '');
    const featImage = strVal(art.featuredImage, '');
    const imageAlt = strVal(art.imageAlt);
    const category = strVal(art.category, 'Wellness');
    const author = strVal(art.author, 'Euro Spa Editorial Team');
    const status = strVal(art.status, 'draft');
    const pubAt = strVal(art.publishedAt);
    const tags = jsonText(art.tags || []);
    const readingTime = numVal(art.readingTimeMinutes, 3);
    const viewsCount = numVal(art.viewsCount, 0);
    const seoTitle = strVal(art.seoTitle);
    const metaDesc = strVal(art.metaDescription);
    const focusKeyword = strVal(art.focusKeyword);
    const canonicalUrl = strVal(art.canonicalUrl);
    const ogTitle = strVal(art.ogTitle);
    const ogDesc = strVal(art.ogDescription);
    const ogImage = strVal(art.ogImage);
    const createdAt = strVal(art.createdAt || new Date().toISOString());
    const updatedAt = strVal(art.updatedAt || new Date().toISOString());

    sqlStatements.push(
      `INSERT OR REPLACE INTO articles (id, title, slug, excerpt, content, featured_image, image_alt, category, author, status, published_at, tags, reading_time_minutes, views_count, seo_title, meta_description, focus_keyword, canonical_url, og_title, og_description, og_image, created_at, updated_at) VALUES (${id}, ${title}, ${slug}, ${excerpt}, ${content}, ${featImage}, ${imageAlt}, ${category}, ${author}, ${status}, ${pubAt}, ${tags}, ${readingTime}, ${viewsCount}, ${seoTitle}, ${metaDesc}, ${focusKeyword}, ${canonicalUrl}, ${ogTitle}, ${ogDesc}, ${ogImage}, ${createdAt}, ${updatedAt});`
    );
  }
  sqlStatements.push('');
}

// 7. Gallery
const galleryPath = path.join(DATA_DIR, 'gallery.json');
if (fs.existsSync(galleryPath)) {
  const gallery = JSON.parse(fs.readFileSync(galleryPath, 'utf8'));
  report.gallery = gallery.length;
  sqlStatements.push('-- Table: gallery (' + gallery.length + ' records)');
  for (const g of gallery) {
    const id = strVal(g._id || g.id);
    const title = strVal(g.title);
    const category = strVal(g.category, 'Spa Interior');
    const image = strVal(g.image, '');
    const fallbackImage = strVal(g.fallbackImage);
    const altText = strVal(g.altText);
    const caption = strVal(g.caption);
    const description = strVal(g.description);
    const storagePath = strVal(g.storagePath);
    const displayOrder = numVal(g.displayOrder, 0);
    const status = strVal(g.status, 'active');
    const fileName = strVal(g.fileName);
    const fileSize = numVal(g.fileSize);
    const mimeType = strVal(g.mimeType);
    const createdAt = strVal(g.createdAt || new Date().toISOString());
    const updatedAt = strVal(g.updatedAt || new Date().toISOString());

    sqlStatements.push(
      `INSERT OR REPLACE INTO gallery (id, title, category, image, fallback_image, alt_text, caption, description, storage_path, display_order, status, file_name, file_size, mime_type, created_at, updated_at) VALUES (${id}, ${title}, ${category}, ${image}, ${fallbackImage}, ${altText}, ${caption}, ${description}, ${storagePath}, ${displayOrder}, ${status}, ${fileName}, ${fileSize}, ${mimeType}, ${createdAt}, ${updatedAt});`
    );
  }
  sqlStatements.push('');
}

// 8. Site Settings
const settingsPath = path.join(DATA_DIR, 'siteSettings.json');
if (fs.existsSync(settingsPath)) {
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  report.site_settings = settings.length;
  sqlStatements.push('-- Table: site_settings (' + settings.length + ' records)');
  for (const doc of settings) {
    const id = strVal(doc._id || doc.id);
    const { _id, id: rawId, updatedAt, updatedBy, ...rest } = doc;
    const data = jsonText(rest, '{}');
    const updated = strVal(updatedAt || new Date().toISOString());
    const by = strVal(updatedBy || 'migration');

    sqlStatements.push(
      `INSERT OR REPLACE INTO site_settings (id, data, updated_at, updated_by) VALUES (${id}, ${data}, ${updated}, ${by});`
    );
  }
  sqlStatements.push('');
}

// 9. Service Areas
const areasPath = path.join(DATA_DIR, 'serviceAreas.json');
if (fs.existsSync(areasPath)) {
  const areas = JSON.parse(fs.readFileSync(areasPath, 'utf8'));
  report.service_areas = areas.length;
  sqlStatements.push('-- Table: service_areas (' + areas.length + ' records)');
  for (const a of areas) {
    const id = strVal(a._id || a.id);
    const name = strVal(a.name);
    const slug = strVal(a.slug || a._id);
    const headline = strVal(a.headline || a.shortDescription);
    const description = strVal(a.description || a.content || a.shortDescription);
    const landmarks = jsonText(a.landmarks || []);
    const keywords = jsonText(a.keywords || (a.focusKeyword ? [a.focusKeyword] : []));
    const popularServices = jsonText(a.popularServices || []);
    const status = strVal(a.status, 'active');
    const displayOrder = numVal(a.displayOrder, 0);
    const createdAt = strVal(a.createdAt || new Date().toISOString());
    const updatedAt = strVal(a.updatedAt || new Date().toISOString());

    sqlStatements.push(
      `INSERT OR REPLACE INTO service_areas (id, name, slug, headline, description, landmarks, keywords, popular_services, status, display_order, created_at, updated_at) VALUES (${id}, ${name}, ${slug}, ${headline}, ${description}, ${landmarks}, ${keywords}, ${popularServices}, ${status}, ${displayOrder}, ${createdAt}, ${updatedAt});`
    );
  }
  sqlStatements.push('');
}

// 10. FAQs
const faqsPath = path.join(DATA_DIR, 'faqs.json');
if (fs.existsSync(faqsPath)) {
  const faqs = JSON.parse(fs.readFileSync(faqsPath, 'utf8'));
  report.faqs = faqs.length;
  sqlStatements.push('-- Table: faqs (' + faqs.length + ' records)');
  for (let idx = 0; idx < faqs.length; idx++) {
    const f = faqs[idx];
    const id = strVal(f._id || f.id || `faq-${idx + 1}`);
    const question = strVal(f.question);
    const answer = strVal(f.answer);
    const category = strVal(f.category, 'General');
    const status = strVal(f.status, 'active');
    const sortOrder = numVal(f.sortOrder !== undefined ? f.sortOrder : (f.displayOrder !== undefined ? f.displayOrder : idx + 1), idx + 1);
    const createdAt = strVal(f.createdAt || new Date().toISOString());
    const updatedAt = strVal(f.updatedAt || new Date().toISOString());

    sqlStatements.push(
      `INSERT OR REPLACE INTO faqs (id, question, answer, category, status, sort_order, created_at, updated_at) VALUES (${id}, ${question}, ${answer}, ${category}, ${status}, ${sortOrder}, ${createdAt}, ${updatedAt});`
    );
  }
  sqlStatements.push('');
}

// 11. Google Business Sync
const gbpPath = path.join(DATA_DIR, 'google_business_sync.json');
if (fs.existsSync(gbpPath)) {
  const gbp = JSON.parse(fs.readFileSync(gbpPath, 'utf8'));
  report.google_business_sync = gbp.length;
  sqlStatements.push('-- Table: google_business_sync (' + gbp.length + ' records)');
  for (const g of gbp) {
    const id = strVal(g._id || g.id || 'primary_sync');
    const status = strVal(g.status, 'idle');
    const { _id, id: rawGbpId, status: sStatus, lastSyncedAt, ...rest } = g;
    const syncSummary = jsonText(rest, '{}');
    const lastSyncAt = strVal(lastSyncedAt);
    const updatedAt = strVal(new Date().toISOString());

    sqlStatements.push(
      `INSERT OR REPLACE INTO google_business_sync (id, status, sync_summary, last_sync_at, updated_at) VALUES (${id}, ${status}, ${syncSummary}, ${lastSyncAt}, ${updatedAt});`
    );
  }
  sqlStatements.push('');
}

fs.writeFileSync(OUTPUT_FILE, sqlStatements.join('\n'), 'utf8');
console.log('Successfully generated:', OUTPUT_FILE);
console.log('Record counts:', JSON.stringify(report, null, 2));

/**
 * Euro Spa & Salon Dhaka - Supabase Data Importer
 * Reads exported JSON backups from scripts/migration/data/ and performs
 * idempotent batch upserts into all 11 Supabase PostgreSQL tables.
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const DATA_DIR = path.resolve(process.cwd(), 'scripts/migration/data');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export async function importAllToSupabase() {
  console.log('=== STARTING SUPABASE DATA IMPORT ===');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('\n⚠ MISSING SUPABASE CREDENTIALS:');
    console.warn('Please supply SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables to execute the import.');
    console.warn('Example:');
    console.warn('SUPABASE_URL="https://your-project.supabase.co" SUPABASE_SERVICE_ROLE_KEY="your-key" npx tsx scripts/migration/import-to-supabase.ts\n');
    return { success: false, reason: 'missing_credentials' };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const report: { table: string; sourceCount: number; importedCount: number; failedCount: number; error?: string }[] = [];

  // 0. Import Users
  const usersPath = path.join(DATA_DIR, 'users.json');
  if (fs.existsSync(usersPath)) {
    const rawUsers: any[] = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
    console.log(`\nImporting ${rawUsers.length} user records...`);
    const formattedUsers = rawUsers.map((u) => ({
      id: u._id || u.uid || u.id,
      email: u.email,
      display_name: u.displayName || null,
      photo_url: u.photoURL || u.photoUrl || null,
      phone: u.phone || null,
      role: u.role || 'client',
      created_at: u.createdAt || new Date().toISOString(),
      updated_at: u.updatedAt || new Date().toISOString()
    }));
    const { error } = await supabase.from('users').upsert(formattedUsers, { onConflict: 'id' });
    if (error) {
      console.error('  ✖ Error upserting users:', error.message);
      report.push({ table: 'users', sourceCount: rawUsers.length, importedCount: 0, failedCount: rawUsers.length, error: error.message });
    } else {
      console.log(`  ✓ Successfully upserted ${formattedUsers.length} users.`);
      report.push({ table: 'users', sourceCount: rawUsers.length, importedCount: formattedUsers.length, failedCount: 0 });
    }
  }

  // 1. Import Admins
  const adminsPath = path.join(DATA_DIR, 'admins.json');
  if (fs.existsSync(adminsPath)) {
    const rawAdmins: any[] = JSON.parse(fs.readFileSync(adminsPath, 'utf-8'));
    console.log(`\nImporting ${rawAdmins.length} admin records...`);
    const formattedAdmins = rawAdmins.map((a) => ({
      id: a._id || a.id || 'admin_primary',
      email: a.email || 'mdalahi10000@gmail.com',
      display_name: a.displayName || 'MD Alahi',
      role: a.role || 'admin',
      permissions: a.permissions || ['all'],
      assigned_at: a.assignedAt || new Date().toISOString()
    }));
    const { error } = await supabase.from('admins').upsert(formattedAdmins, { onConflict: 'email' });
    if (error) {
      console.error('  ✖ Error upserting admins:', error.message);
      report.push({ table: 'admins', sourceCount: rawAdmins.length, importedCount: 0, failedCount: rawAdmins.length, error: error.message });
    } else {
      console.log(`  ✓ Successfully upserted ${formattedAdmins.length} admins.`);
      report.push({ table: 'admins', sourceCount: rawAdmins.length, importedCount: formattedAdmins.length, failedCount: 0 });
    }
  }

  // 2. Import Services
  const servicesPath = path.join(DATA_DIR, 'services.json');
  if (fs.existsSync(servicesPath)) {
    const rawServices: any[] = JSON.parse(fs.readFileSync(servicesPath, 'utf-8'));
    console.log(`\nImporting ${rawServices.length} services...`);
    const formattedServices = rawServices.map((s) => ({
      id: s._id || s.id,
      name: s.name || '',
      slug: s.slug || null,
      duration_range: s.durationRange || null,
      short_description: s.shortDescription || '',
      full_description: s.fullDescription || '',
      image: s.image || '',
      image_alt: s.imageAlt || null,
      gallery_images: s.galleryImages || [],
      category: s.category || 'Massage Therapy',
      price: s.price || null,
      popular: Boolean(s.popular),
      price_options: s.priceOptions || [],
      benefits: s.benefits || [],
      booking_cta: s.bookingCta || 'Book Treatment',
      display_order: typeof s.displayOrder === 'number' ? s.displayOrder : 0,
      status: s.status || 'active',
      service_areas: s.serviceAreas || [],
      seo_title: s.seoTitle || null,
      meta_description: s.metaDescription || null,
      focus_keyword: s.focusKeyword || null,
      secondary_keywords: s.secondaryKeywords || [],
      canonical_url: s.canonicalUrl || null,
      robots_index: s.robotsIndex !== false,
      robots_follow: s.robotsFollow !== false,
      og_title: s.ogTitle || null,
      og_description: s.ogDescription || null,
      og_image: s.ogImage || null,
      schema_type: s.schemaType || 'HealthAndBeautyBusiness',
      custom_schema: s.customSchema || null,
      created_at: s.createdAt || new Date().toISOString(),
      updated_at: s.updatedAt || new Date().toISOString()
    }));

    if (formattedServices.length > 0) {
      const { error } = await supabase.from('services').upsert(formattedServices, { onConflict: 'id' });
      if (error) {
        console.error('  ✖ Error upserting services:', error.message);
        report.push({ table: 'services', sourceCount: rawServices.length, importedCount: 0, failedCount: rawServices.length, error: error.message });
      } else {
        console.log(`  ✓ Successfully upserted ${formattedServices.length} services.`);
        report.push({ table: 'services', sourceCount: rawServices.length, importedCount: formattedServices.length, failedCount: 0 });
      }
    }
  }

  // 3. Import Reviews
  const reviewsPath = path.join(DATA_DIR, 'reviews.json');
  if (fs.existsSync(reviewsPath)) {
    const rawReviews: any[] = JSON.parse(fs.readFileSync(reviewsPath, 'utf-8'));
    console.log(`\nImporting ${rawReviews.length} reviews...`);
    const formattedReviews = rawReviews.map((r) => ({
      id: r._id || r.id,
      user_id: r.userId || null,
      user_name: r.userName || r.name || 'Valued Guest',
      user_photo: r.userPhoto || r.avatar || null,
      rating: typeof r.rating === 'number' ? r.rating : 5.0,
      comment: r.comment || r.reviewText || '',
      service_tag: r.serviceTag || r.serviceUsed || null,
      verified: r.verified !== false,
      status: r.status || 'approved',
      admin_response: r.adminResponse || null,
      date_str: r.dateString || r.date || null,
      created_at: r.createdAt || new Date().toISOString(),
      updated_at: r.updatedAt || new Date().toISOString()
    }));

    if (formattedReviews.length > 0) {
      const { error } = await supabase.from('reviews').upsert(formattedReviews, { onConflict: 'id' });
      if (error) {
        console.error('  ✖ Error upserting reviews:', error.message);
        report.push({ table: 'reviews', sourceCount: rawReviews.length, importedCount: 0, failedCount: rawReviews.length, error: error.message });
      } else {
        console.log(`  ✓ Successfully upserted ${formattedReviews.length} reviews.`);
        report.push({ table: 'reviews', sourceCount: rawReviews.length, importedCount: formattedReviews.length, failedCount: 0 });
      }
    }
  }

  // 4. Import Site Settings (Homepage, About, Config)
  const settingsPath = path.join(DATA_DIR, 'siteSettings.json');
  if (fs.existsSync(settingsPath)) {
    const rawSettings: any[] = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    console.log(`\nImporting ${rawSettings.length} site settings documents...`);
    const formattedSettings = rawSettings.map((doc) => {
      const docId = doc._id || doc.id;
      const { _id, id, ...rest } = doc;
      return {
        id: docId,
        data: rest,
        updated_at: rest.updatedAt || new Date().toISOString(),
        updated_by: 'migration'
      };
    });

    if (formattedSettings.length > 0) {
      const { error } = await supabase.from('site_settings').upsert(formattedSettings, { onConflict: 'id' });
      if (error) {
        console.error('  ✖ Error upserting site_settings:', error.message);
        report.push({ table: 'site_settings', sourceCount: rawSettings.length, importedCount: 0, failedCount: rawSettings.length, error: error.message });
      } else {
        console.log(`  ✓ Successfully upserted ${formattedSettings.length} site_settings documents.`);
        report.push({ table: 'site_settings', sourceCount: rawSettings.length, importedCount: formattedSettings.length, failedCount: 0 });
      }
    }
  }

  // 5. Import Service Areas
  const serviceAreasPath = path.join(DATA_DIR, 'serviceAreas.json');
  if (fs.existsSync(serviceAreasPath)) {
    const rawAreas: any[] = JSON.parse(fs.readFileSync(serviceAreasPath, 'utf-8'));
    console.log(`\nImporting ${rawAreas.length} service areas...`);
    const formattedAreas = rawAreas.map((a) => ({
      id: a._id || a.id,
      name: a.name || '',
      slug: a.slug || a._id || '',
      headline: a.headline || a.shortDescription || null,
      description: a.description || a.content || a.shortDescription || null,
      landmarks: a.landmarks || [],
      keywords: a.keywords || (a.focusKeyword ? [a.focusKeyword] : []),
      popular_services: a.popularServices || [],
      status: a.status || 'active',
      display_order: typeof a.displayOrder === 'number' ? a.displayOrder : 0,
      created_at: a.createdAt || new Date().toISOString(),
      updated_at: a.updatedAt || new Date().toISOString()
    }));

    if (formattedAreas.length > 0) {
      const { error } = await supabase.from('service_areas').upsert(formattedAreas, { onConflict: 'id' });
      if (error) {
        console.error('  ✖ Error upserting service_areas:', error.message);
        report.push({ table: 'service_areas', sourceCount: rawAreas.length, importedCount: 0, failedCount: rawAreas.length, error: error.message });
      } else {
        console.log(`  ✓ Successfully upserted ${formattedAreas.length} service_areas.`);
        report.push({ table: 'service_areas', sourceCount: rawAreas.length, importedCount: formattedAreas.length, failedCount: 0 });
      }
    }
  }

  // 6. Import Articles
  const articlesPath = path.join(DATA_DIR, 'articles.json');
  if (fs.existsSync(articlesPath)) {
    const rawArticles: any[] = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'));
    console.log(`\nImporting ${rawArticles.length} articles...`);
    const formattedArticles = rawArticles.map((art) => ({
      id: art._id || art.id,
      title: art.title || '',
      slug: art.slug || (art._id || '').toLowerCase(),
      excerpt: art.excerpt || '',
      content: art.content || '',
      featured_image: art.featuredImage || '',
      image_alt: art.imageAlt || null,
      category: art.category || 'Wellness',
      author: art.author || 'Euro Spa Editorial Team',
      status: art.status || 'draft',
      published_at: art.publishedAt || null,
      tags: art.tags || [],
      reading_time_minutes: typeof art.readingTimeMinutes === 'number' ? art.readingTimeMinutes : 3,
      views_count: typeof art.viewsCount === 'number' ? art.viewsCount : 0,
      seo_title: art.seoTitle || null,
      meta_description: art.metaDescription || null,
      focus_keyword: art.focusKeyword || null,
      canonical_url: art.canonicalUrl || null,
      og_title: art.ogTitle || null,
      og_description: art.ogDescription || null,
      og_image: art.ogImage || null,
      created_at: art.createdAt || new Date().toISOString(),
      updated_at: art.updatedAt || new Date().toISOString()
    }));

    if (formattedArticles.length > 0) {
      const { error } = await supabase.from('articles').upsert(formattedArticles, { onConflict: 'id' });
      if (error) {
        console.error('  ✖ Error upserting articles:', error.message);
        report.push({ table: 'articles', sourceCount: rawArticles.length, importedCount: 0, failedCount: rawArticles.length, error: error.message });
      } else {
        console.log(`  ✓ Successfully upserted ${formattedArticles.length} articles.`);
        report.push({ table: 'articles', sourceCount: rawArticles.length, importedCount: formattedArticles.length, failedCount: 0 });
      }
    }
  }

  // 7. Import Gallery Photos
  const galleryPath = path.join(DATA_DIR, 'gallery.json');
  if (fs.existsSync(galleryPath)) {
    const rawGallery: any[] = JSON.parse(fs.readFileSync(galleryPath, 'utf-8'));
    console.log(`\nImporting ${rawGallery.length} gallery items...`);
    const formattedGallery = rawGallery.map((g) => ({
      id: g._id || g.id,
      title: g.title || '',
      category: g.category || 'Spa Interior',
      image: g.image || '',
      fallback_image: g.fallbackImage || null,
      alt_text: g.altText || null,
      caption: g.caption || null,
      description: g.description || null,
      storage_path: g.storagePath || null,
      display_order: typeof g.displayOrder === 'number' ? g.displayOrder : 0,
      status: g.status || 'active',
      file_name: g.fileName || null,
      file_size: g.fileSize || null,
      mime_type: g.mimeType || null,
      created_at: g.createdAt || new Date().toISOString(),
      updated_at: g.updatedAt || new Date().toISOString()
    }));

    if (formattedGallery.length > 0) {
      const { error } = await supabase.from('gallery').upsert(formattedGallery, { onConflict: 'id' });
      if (error) {
        console.error('  ✖ Error upserting gallery:', error.message);
        report.push({ table: 'gallery', sourceCount: rawGallery.length, importedCount: 0, failedCount: rawGallery.length, error: error.message });
      } else {
        console.log(`  ✓ Successfully upserted ${formattedGallery.length} gallery items.`);
        report.push({ table: 'gallery', sourceCount: rawGallery.length, importedCount: formattedGallery.length, failedCount: 0 });
      }
    }
  }

  // 8. Import FAQs
  const faqsPath = path.join(DATA_DIR, 'faqs.json');
  if (fs.existsSync(faqsPath)) {
    const rawFaqs: any[] = JSON.parse(fs.readFileSync(faqsPath, 'utf-8'));
    console.log(`\nImporting ${rawFaqs.length} FAQs...`);
    const formattedFaqs = rawFaqs.map((f, idx) => ({
      id: f._id || f.id || `faq-${idx + 1}`,
      question: f.question || '',
      answer: f.answer || '',
      category: f.category || 'General',
      status: f.status || 'active',
      sort_order: typeof f.sortOrder === 'number' ? f.sortOrder : (f.displayOrder || idx + 1),
      created_at: f.createdAt || new Date().toISOString(),
      updated_at: f.updatedAt || new Date().toISOString()
    }));

    if (formattedFaqs.length > 0) {
      const { error } = await supabase.from('faqs').upsert(formattedFaqs, { onConflict: 'id' });
      if (error) {
        console.error('  ✖ Error upserting faqs:', error.message);
        report.push({ table: 'faqs', sourceCount: rawFaqs.length, importedCount: 0, failedCount: rawFaqs.length, error: error.message });
      } else {
        console.log(`  ✓ Successfully upserted ${formattedFaqs.length} FAQs.`);
        report.push({ table: 'faqs', sourceCount: rawFaqs.length, importedCount: formattedFaqs.length, failedCount: 0 });
      }
    }
  }

  // 9. Import Appointments (if any)
  const apptsPath = path.join(DATA_DIR, 'appointments.json');
  if (fs.existsSync(apptsPath)) {
    const rawAppts: any[] = JSON.parse(fs.readFileSync(apptsPath, 'utf-8'));
    if (rawAppts.length > 0) {
      console.log(`\nImporting ${rawAppts.length} appointments...`);
      const formattedAppts = rawAppts.map((a) => ({
        id: a._id || a.id,
        user_id: a.userId || null,
        user_name: a.userName || a.name || 'Client',
        user_email: a.userEmail || a.email || null,
        phone: a.phone || '',
        service_id: a.serviceId || null,
        service_name: a.serviceName || 'Massage Treatment',
        duration: a.duration || null,
        price: a.price || null,
        preferred_date: a.preferredDate || a.date || '',
        preferred_time: a.preferredTime || a.time || '',
        status: a.status || 'pending',
        notes: a.notes || null,
        admin_notes: a.adminNotes || null,
        created_at: a.createdAt || new Date().toISOString(),
        updated_at: a.updatedAt || new Date().toISOString()
      }));
      const { error } = await supabase.from('appointments').upsert(formattedAppts, { onConflict: 'id' });
      if (error) {
        console.error('  ✖ Error upserting appointments:', error.message);
        report.push({ table: 'appointments', sourceCount: rawAppts.length, importedCount: 0, failedCount: rawAppts.length, error: error.message });
      } else {
        console.log(`  ✓ Successfully upserted ${formattedAppts.length} appointments.`);
        report.push({ table: 'appointments', sourceCount: rawAppts.length, importedCount: formattedAppts.length, failedCount: 0 });
      }
    } else {
      report.push({ table: 'appointments', sourceCount: 0, importedCount: 0, failedCount: 0 });
    }
  }

  // 10. Import Google Business Sync
  const gbpPath = path.join(DATA_DIR, 'google_business_sync.json');
  if (fs.existsSync(gbpPath)) {
    const rawGbp: any[] = JSON.parse(fs.readFileSync(gbpPath, 'utf-8'));
    if (rawGbp.length > 0) {
      const formattedGbp = rawGbp.map((g) => {
        const { _id, id, status, lastSyncAt, ...rest } = g;
        return {
          id: _id || id || 'primary_sync',
          status: status || 'idle',
          sync_summary: rest,
          last_sync_at: lastSyncAt || null,
          updated_at: new Date().toISOString()
        };
      });
      const { error } = await supabase.from('google_business_sync').upsert(formattedGbp, { onConflict: 'id' });
      if (error) {
        console.error('  ✖ Error upserting google_business_sync:', error.message);
        report.push({ table: 'google_business_sync', sourceCount: rawGbp.length, importedCount: 0, failedCount: rawGbp.length, error: error.message });
      } else {
        console.log(`  ✓ Successfully upserted google_business_sync document.`);
        report.push({ table: 'google_business_sync', sourceCount: rawGbp.length, importedCount: formattedGbp.length, failedCount: 0 });
      }
    }
  }

  console.log('\n=== SUPABASE IMPORT SUMMARY ===');
  console.table(report);
  const totalSource = report.reduce((sum, r) => sum + r.sourceCount, 0);
  const totalImported = report.reduce((sum, r) => sum + r.importedCount, 0);
  const totalFailed = report.reduce((sum, r) => sum + r.failedCount, 0);
  console.log(`TOTAL RECORDS: ${totalSource} source, ${totalImported} successfully imported, ${totalFailed} failed.`);

  return { success: totalFailed === 0, report, totalSource, totalImported, totalFailed };
}

if (process.argv[1]?.includes('import-to-supabase')) {
  importAllToSupabase().then(() => process.exit(0)).catch((err) => {
    console.error('Import error:', err);
    process.exit(1);
  });
}

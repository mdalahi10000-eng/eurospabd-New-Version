/**
 * Euro Spa & Salon Dhaka - Unified Backend Adapter
 * Powered by Supabase PostgreSQL and Realtime.
 * Zero UI changes, 100% cache preservation, full zero-downtime safety.
 */
import { isSupabaseConfigured, getSupabase, uploadToSupabaseStorage, subscribeToSupabaseTable } from '../supabase';
import { 
  Service, 
  PriceOption,
  ReviewItem, 
  PhotoItem, 
  GalleryImage, 
  Article, 
  FAQItem,
  ServiceArea
} from '../types';
import type { AdminAppointment } from './appointmentsService';
import { getCachedData, setCachedData, CACHE_KEYS } from './cacheService';

export { isSupabaseConfigured };

// ==============================================================================
// 1. SERVICES
// ==============================================================================
export function mapSupabaseServiceToService(row: any): Service {
  // Robust priceOptions parsing (handles arrays, JSON strings, or single fallbacks)
  let parsedOptions: PriceOption[] = [];
  if (Array.isArray(row.price_options)) {
    parsedOptions = row.price_options;
  } else if (typeof row.price_options === 'string' && row.price_options.trim()) {
    try {
      const parsed = JSON.parse(row.price_options);
      if (Array.isArray(parsed)) {
        parsedOptions = parsed;
      }
    } catch (_) {}
  }

  // Normalize and clean each price option
  let cleanedOptions: PriceOption[] = parsedOptions
    .map((opt: any) => ({
      duration: String(opt.duration || '').trim(),
      price: String(opt.price || '').trim() || (opt.amount ? `BDT ${Number(opt.amount).toLocaleString()}` : ''),
      amount: typeof opt.amount === 'number' ? opt.amount : (parseInt(String(opt.price || '').replace(/[^\d]/g, ''), 10) || 0)
    }))
    .filter(opt => Boolean(opt.duration));

  // Fallback: If no options found, synthesize from main row price/duration
  if (cleanedOptions.length === 0 && row.price) {
    cleanedOptions = [
      {
        duration: row.duration_range || '60 Minutes',
        price: row.price,
        amount: parseInt(String(row.price).replace(/[^\d]/g, ''), 10) || 0
      }
    ];
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug || '',
    durationRange: row.duration_range || (cleanedOptions.length > 0 ? cleanedOptions.map(o => o.duration).join(' / ') : '60 / 90 Minutes'),
    shortDescription: row.short_description || '',
    fullDescription: row.full_description || '',
    image: row.image || '',
    imageAlt: row.image_alt || '',
    galleryImages: Array.isArray(row.gallery_images) ? row.gallery_images : [],
    category: row.category || 'Massage Therapy',
    price: row.price || (cleanedOptions[0]?.price || ''),
    popular: Boolean(row.popular),
    priceOptions: cleanedOptions,
    benefits: Array.isArray(row.benefits) ? row.benefits : [],
    bookingCta: row.booking_cta || 'Book Treatment',
    displayOrder: typeof row.display_order === 'number' ? row.display_order : 0,
    status: row.status || 'active',
    serviceAreas: Array.isArray(row.service_areas) ? row.service_areas : [],
    seoTitle: row.seo_title,
    metaDescription: row.meta_description,
    focusKeyword: row.focus_keyword,
    secondaryKeywords: Array.isArray(row.secondary_keywords) ? row.secondary_keywords : [],
    canonicalUrl: row.canonical_url,
    robotsIndex: row.robots_index !== false,
    robotsFollow: row.robots_follow !== false,
    ogTitle: row.og_title,
    ogDescription: row.og_description,
    ogImage: row.og_image,
    schemaType: row.schema_type,
    customSchema: row.custom_schema,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

export function mapServiceToSupabaseRow(service: Partial<Service>): any {
  const row: any = {};
  if (service.id) row.id = service.id;
  if (service.name !== undefined) row.name = service.name;
  if (service.slug !== undefined) row.slug = service.slug;
  if (service.durationRange !== undefined) row.duration_range = service.durationRange;
  if (service.shortDescription !== undefined) row.short_description = service.shortDescription;
  if (service.fullDescription !== undefined) row.full_description = service.fullDescription;
  if (service.image !== undefined) row.image = service.image;
  if (service.imageAlt !== undefined) row.image_alt = service.imageAlt;
  if (service.galleryImages !== undefined) row.gallery_images = service.galleryImages;
  if (service.category !== undefined) row.category = service.category;
  if (service.price !== undefined) row.price = service.price;
  if (service.popular !== undefined) row.popular = service.popular;
  if (service.priceOptions !== undefined) row.price_options = service.priceOptions;
  if (service.benefits !== undefined) row.benefits = service.benefits;
  if (service.bookingCta !== undefined) row.booking_cta = service.bookingCta;
  if (service.displayOrder !== undefined) row.display_order = service.displayOrder;
  if (service.status !== undefined) row.status = service.status;
  if (service.serviceAreas !== undefined) row.service_areas = service.serviceAreas;
  if (service.seoTitle !== undefined) row.seo_title = service.seoTitle;
  if (service.metaDescription !== undefined) row.meta_description = service.metaDescription;
  if (service.focusKeyword !== undefined) row.focus_keyword = service.focusKeyword;
  if (service.secondaryKeywords !== undefined) row.secondary_keywords = service.secondaryKeywords;
  if (service.canonicalUrl !== undefined) row.canonical_url = service.canonicalUrl;
  if (service.robotsIndex !== undefined) row.robots_index = service.robotsIndex;
  if (service.robotsFollow !== undefined) row.robots_follow = service.robotsFollow;
  if (service.ogTitle !== undefined) row.og_title = service.ogTitle;
  if (service.ogDescription !== undefined) row.og_description = service.ogDescription;
  if (service.ogImage !== undefined) row.og_image = service.ogImage;
  if (service.schemaType !== undefined) row.schema_type = service.schemaType;
  if (service.customSchema !== undefined) row.custom_schema = service.customSchema;
  row.updated_at = new Date().toISOString();
  return row;
}

// ==============================================================================
// 2. REVIEWS
// ==============================================================================
export function mapSupabaseReviewToReview(row: any): ReviewItem {
  return {
    id: row.id,
    name: row.user_name || row.name || 'Valued Guest',
    avatar: row.user_photo || row.avatar || 'https://lh3.googleusercontent.com/a/default-user',
    rating: Number(row.rating) || 5,
    date: row.date_str || row.date || 'Recently',
    reviewText: row.comment || row.review_text || '',
    serviceUsed: row.service_tag || row.service_used || undefined,
    verified: row.verified !== false,
    adminResponse: row.admin_response || undefined,
  };
}

export const mapSupabaseReviewToReviewItem = mapSupabaseReviewToReview;

export function mapReviewToSupabaseRow(review: Partial<ReviewItem> & { id?: string; userId?: string; comment?: string }): any {
  const row: any = {};
  if (review.id) row.id = review.id;
  if (review.userId) row.user_id = review.userId;
  if (review.name) row.user_name = review.name;
  if (review.avatar) row.user_photo = review.avatar;
  if (review.rating !== undefined) row.rating = review.rating;
  if (review.comment !== undefined || review.reviewText !== undefined) row.comment = review.comment || review.reviewText;
  if (review.serviceUsed !== undefined) row.service_tag = review.serviceUsed;
  if (review.verified !== undefined) row.verified = review.verified;
  if (review.date !== undefined) row.date_str = review.date;
  if (review.adminResponse !== undefined) row.admin_response = review.adminResponse;
  row.updated_at = new Date().toISOString();
  return row;
}

// ==============================================================================
// 3. ARTICLES
// ==============================================================================
export function mapSupabaseArticleToArticle(row: any): Article {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt || '',
    content: row.content || '',
    featuredImage: row.featured_image || '',
    imageAlt: row.image_alt || undefined,
    category: row.category || 'Wellness',
    author: row.author || 'Euro Spa Editorial Team',
    status: row.status || 'draft',
    publishedAt: row.published_at || row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    seoTitle: row.seo_title,
    metaDescription: row.meta_description,
    focusKeyword: row.focus_keyword,
    canonicalUrl: row.canonical_url,
    ogTitle: row.og_title,
    ogDescription: row.og_description,
    ogImage: row.og_image,
    tags: Array.isArray(row.tags) ? row.tags : [],
    readingTimeMinutes: row.reading_time_minutes || 3,
  };
}

// ==============================================================================
// 4. GALLERY
// ==============================================================================
export function mapSupabaseGalleryToPhotoItem(row: any): GalleryImage {
  return {
    id: row.id,
    title: row.title,
    category: row.category || 'Spa Interior',
    image: row.image,
    fallbackImage: row.fallback_image || undefined,
    altText: row.alt_text || undefined,
    caption: row.caption || undefined,
    description: row.description || undefined,
    storagePath: row.storage_path || undefined,
    displayOrder: row.display_order ?? 0,
    status: row.status || 'active',
    fileName: row.file_name || undefined,
    fileSize: row.file_size ? Number(row.file_size) : undefined,
    mimeType: row.mime_type || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const mapSupabaseGalleryToGallery = mapSupabaseGalleryToPhotoItem;

export function mapGalleryToSupabaseRow(gallery: Partial<GalleryImage> & { id: string }): any {
  const row: any = { id: gallery.id };
  if (gallery.title !== undefined) row.title = gallery.title;
  if (gallery.category !== undefined) row.category = gallery.category;
  if (gallery.image !== undefined) row.image = gallery.image;
  if (gallery.fallbackImage !== undefined) row.fallback_image = gallery.fallbackImage;
  if (gallery.altText !== undefined) row.alt_text = gallery.altText;
  if (gallery.caption !== undefined) row.caption = gallery.caption;
  if (gallery.description !== undefined) row.description = gallery.description;
  if (gallery.storagePath !== undefined) row.storage_path = gallery.storagePath;
  if (gallery.displayOrder !== undefined) row.display_order = gallery.displayOrder;
  if (gallery.status !== undefined) row.status = gallery.status;
  if (gallery.fileName !== undefined) row.file_name = gallery.fileName;
  if (gallery.fileSize !== undefined) row.file_size = gallery.fileSize;
  if (gallery.mimeType !== undefined) row.mime_type = gallery.mimeType;
  row.updated_at = new Date().toISOString();
  return row;
}

// ==============================================================================
// 5. FAQS
// ==============================================================================
export function mapSupabaseFaqToFAQItem(row: any): FAQItem {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    category: row.category || 'General',
    displayOrder: row.sort_order ?? 0,
    status: row.status || 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapFaqToSupabaseRow(faq: Partial<FAQItem> & { id: string }): any {
  const row: any = { id: faq.id };
  if (faq.question !== undefined) row.question = faq.question;
  if (faq.answer !== undefined) row.answer = faq.answer;
  if (faq.category !== undefined) row.category = faq.category;
  if (faq.displayOrder !== undefined) row.sort_order = faq.displayOrder;
  if (faq.status !== undefined) row.status = faq.status;
  row.updated_at = new Date().toISOString();
  return row;
}

export function mapArticleToSupabaseRow(article: Partial<Article> & { id: string }): any {
  const row: any = { id: article.id };
  if (article.title !== undefined) row.title = article.title;
  if (article.slug !== undefined) row.slug = article.slug;
  if (article.excerpt !== undefined) row.excerpt = article.excerpt;
  if (article.content !== undefined) row.content = article.content;
  if (article.featuredImage !== undefined) row.featured_image = article.featuredImage;
  if (article.imageAlt !== undefined) row.image_alt = article.imageAlt;
  if (article.category !== undefined) row.category = article.category;
  if (article.author !== undefined) row.author = article.author;
  if (article.status !== undefined) row.status = article.status;
  if (article.publishedAt !== undefined) row.published_at = article.publishedAt;
  if (article.seoTitle !== undefined) row.seo_title = article.seoTitle;
  if (article.metaDescription !== undefined) row.meta_description = article.metaDescription;
  if (article.focusKeyword !== undefined) row.focus_keyword = article.focusKeyword;
  if (article.canonicalUrl !== undefined) row.canonical_url = article.canonicalUrl;
  if (article.ogTitle !== undefined) row.og_title = article.ogTitle;
  if (article.ogDescription !== undefined) row.og_description = article.ogDescription;
  if (article.ogImage !== undefined) row.og_image = article.ogImage;
  if (article.tags !== undefined) row.tags = article.tags;
  if (article.readingTimeMinutes !== undefined) row.reading_time_minutes = article.readingTimeMinutes;
  row.updated_at = new Date().toISOString();
  return row;
}

// ==============================================================================
// 6. APPOINTMENTS
// ==============================================================================
export function mapSupabaseAppointmentToAdminAppointment(row: any): AdminAppointment {
  return {
    id: row.id,
    userId: row.user_id || undefined,
    userName: row.user_name || 'Guest Client',
    userEmail: row.user_email || undefined,
    phone: row.phone || '',
    serviceId: row.service_id || undefined,
    serviceName: row.service_name || 'Signature Massage Therapy',
    duration: row.duration || '60 min',
    price: row.price || '',
    preferredDate: row.preferred_date || '',
    preferredTime: row.preferred_time || '',
    status: row.status || 'pending',
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAppointmentToSupabaseRow(app: Partial<AdminAppointment> & { id?: string }): any {
  const row: any = {};
  if (app.id !== undefined) row.id = app.id;
  if (app.userId !== undefined) row.user_id = app.userId;
  if (app.userName !== undefined) row.user_name = app.userName;
  if (app.userEmail !== undefined) row.user_email = app.userEmail;
  if (app.phone !== undefined) row.phone = app.phone;
  if (app.serviceId !== undefined) row.service_id = app.serviceId;
  if (app.serviceName !== undefined) row.service_name = app.serviceName;
  if (app.duration !== undefined) row.duration = app.duration;
  if (app.price !== undefined) row.price = app.price;
  if (app.preferredDate !== undefined) row.preferred_date = app.preferredDate;
  if (app.preferredTime !== undefined) row.preferred_time = app.preferredTime;
  if (app.status !== undefined) row.status = app.status;
  if (app.notes !== undefined) row.notes = app.notes;
  row.updated_at = new Date().toISOString();
  return row;
}

// ==============================================================================
// 7. SERVICE AREAS
// ==============================================================================
export function mapSupabaseServiceAreaToServiceArea(row: any): ServiceArea {
  return {
    id: row.id,
    name: row.name || '',
    slug: row.slug || '',
    shortDescription: row.short_description || row.description || '',
    content: row.content || '',
    status: row.status || 'active',
    seoTitle: row.seo_title || '',
    metaDescription: row.meta_description || '',
    focusKeyword: row.focus_keyword || '',
    displayOrder: typeof row.display_order === 'number' ? row.display_order : 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapServiceAreaToSupabaseRow(area: Partial<ServiceArea> & { id?: string }): any {
  const row: any = {};
  if (area.id !== undefined) row.id = area.id;
  if (area.name !== undefined) row.name = area.name;
  if (area.slug !== undefined) row.slug = area.slug;
  if (area.shortDescription !== undefined) row.description = area.shortDescription;
  if (area.content !== undefined) row.content = area.content;
  if (area.status !== undefined) row.status = area.status;
  if (area.displayOrder !== undefined) row.display_order = area.displayOrder;
  if (area.seoTitle !== undefined) row.seo_title = area.seoTitle;
  if (area.metaDescription !== undefined) row.meta_description = area.metaDescription;
  if (area.focusKeyword !== undefined) row.focus_keyword = area.focusKeyword;
  row.updated_at = new Date().toISOString();
  return row;
}

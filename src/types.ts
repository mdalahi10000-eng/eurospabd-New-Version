export interface PriceOption {
  duration: string; // e.g., '60 Minutes'
  price: string;    // e.g., 'BDT 2,500'
  amount: number;
}

export interface Service {
  id: string;
  name: string;
  slug?: string;
  durationRange: string; // '60 / 90 Minutes'
  shortDescription: string;
  fullDescription: string;
  image: string;
  imageAlt?: string;
  galleryImages?: string[];
  category?: string;
  price?: string;
  popular?: boolean;
  priceOptions: PriceOption[];
  benefits: string[];
  bookingCta?: string;
  displayOrder?: number;
  status?: 'active' | 'inactive';
  serviceAreas?: string[];

  // SEO Fields
  seoTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  secondaryKeywords?: string[];
  canonicalUrl?: string;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  schemaType?: string;
  customSchema?: string;

  updatedAt?: string;
  createdAt?: any;
}

export interface ReviewItem {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  date: string;
  reviewText: string;
  serviceUsed?: string;
  verified?: boolean;
  adminResponse?: string;
}

export interface PhotoItem {
  id: string;
  title: string;
  category: string; // 'Spa Interior' | 'Treatment Room' | 'Services' | 'Team' | 'Facilities' | 'Other' or custom
  image: string;
  fallbackImage?: string;
  altText?: string;
  caption?: string;
  description?: string;
  storagePath?: string;
  displayOrder?: number;
  status?: 'active' | 'inactive';
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt?: any;
  updatedAt?: string;
  createTime?: string;
}

export type GalleryImage = PhotoItem;

export interface Amenity {
  id: string;
  title: string;
  iconName: 'shield' | 'therapist' | 'spa' | 'lock';
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  imageAlt?: string;
  category: string;
  author: string;
  status: 'draft' | 'published';
  publishedAt: string;
  updatedAt?: string;
  createdAt?: any;
  seoTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  tags?: string[];
  readingTimeMinutes?: number;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface DayHours {
  open: boolean;
  opens: string; // "10:00"
  closes: string; // "22:00"
}

export type RegularHours = Record<DayOfWeek, DayHours>;

export interface SpecialHourItem {
  id: string;
  date: string; // YYYY-MM-DD
  note: string; // e.g. "Eid Holiday"
  isClosed: boolean;
  opens?: string;
  closes?: string;
}

export interface SocialProfiles {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  twitter?: string;
  linkedin?: string;
  pinterest?: string;
}

export interface BusinessInfo {
  // Business Identity (NAP)
  businessName: string;
  tagline: string;
  description: string;
  primaryCategory: string; // e.g. 'DaySpa'
  secondaryCategories: string[];
  
  // Phone & Contact (NAP - P)
  phone: string;
  displayPhone: string;
  whatsappNumber: string;
  whatsappFormatted: string;
  email: string;
  websiteUrl: string;

  // Address (NAP - A)
  fullAddress: string;
  addressLine: string;
  city: string;
  area: string;
  postalCode: string;
  country: string; // "BD" or "Bangladesh"
  latitude: number;
  longitude: number;

  // Google & Maps
  googleMapsUrl: string;
  googlePlaceId?: string;
  googleCid?: string;
  googleBusinessProfileUrl?: string;
  plusCode?: string;

  // Hours
  regularHours: RegularHours;
  specialHours: SpecialHourItem[];
  displayStatus: string; // e.g. "Open 10:00 AM – 10:00 PM"
  displayHours: string; // e.g. "10:00 AM – 10:00 PM Daily"

  // Pricing & Currency
  priceRange: string; // e.g. "BDT 3,000 - 15,000" or "$$"
  currenciesAccepted: string; // "BDT"
  paymentAccepted: string; // "Cash, bKash, Credit Card, Debit Card"

  // Social Links
  socialProfiles: SocialProfiles;

  // Schema Settings
  schemaType: 'DaySpa' | 'HealthAndBeautyBusiness' | 'LocalBusiness' | 'Organization';
  
  updatedAt?: string;
  updatedBy?: string;
}

export interface ServiceArea {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  content?: string;
  status: 'active' | 'inactive';
  seoTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  displayOrder: number;
  createdAt?: any;
  updatedAt?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
  displayOrder: number;
  status: 'active' | 'inactive';
  createdAt?: any;
  updatedAt?: any;
}


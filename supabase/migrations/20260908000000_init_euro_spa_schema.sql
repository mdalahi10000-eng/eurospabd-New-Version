-- ==============================================================================
-- EURO SPA & SALON DHAKA - SUPABASE POSTGRESQL SCHEMA & RLS MIGRATION
-- Database: PostgreSQL 15+ (Supabase)
-- Description: Complete schema, relational tables, indexes, RLS policies, and
--              storage bucket configurations mirroring the Firebase Firestore rules.
-- ==============================================================================

-- Enable required cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. USERS & PROFILES TABLE
-- Mirrors Firestore '/users/{userId}'
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,                       -- Firebase UID or Supabase auth.users UUID
  email TEXT NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'client',       -- 'admin' | 'staff' | 'client'
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (lower(email));
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);

-- ------------------------------------------------------------------------------
-- 2. ADMIN DIRECTORY TABLE
-- Mirrors Firestore '/admins/{adminId}'
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admins (
  id TEXT PRIMARY KEY,                       -- User UID or email key
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  permissions JSONB NOT NULL DEFAULT '["all"]'::jsonb,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Seed primary administrator
INSERT INTO public.admins (id, email, display_name, role)
VALUES ('mdalahi_primary', 'mdalahi10000@gmail.com', 'MD Alahi', 'admin')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. SERVICES TABLE
-- Mirrors Firestore '/services/{serviceId}'
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,                       -- Service ID (slug or custom key)
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  duration_range TEXT,                       -- e.g. '60 / 90 Minutes'
  short_description TEXT NOT NULL DEFAULT '',
  full_description TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  image_alt TEXT,
  gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  category TEXT NOT NULL DEFAULT 'Massage Therapy',
  price TEXT,                                -- Display price string e.g. 'BDT 2,500'
  popular BOOLEAN NOT NULL DEFAULT false,
  price_options JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of { duration, price, amount }
  benefits JSONB NOT NULL DEFAULT '[]'::jsonb,      -- Array of benefit strings
  booking_cta TEXT DEFAULT 'Book Treatment',
  display_order INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',     -- 'active' | 'inactive'
  service_areas JSONB NOT NULL DEFAULT '[]'::jsonb, -- Targeted areas e.g. ['Gulshan', 'Banani']
  seo_title TEXT,
  meta_description TEXT,
  focus_keyword TEXT,
  secondary_keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  canonical_url TEXT,
  robots_index BOOLEAN NOT NULL DEFAULT true,
  robots_follow BOOLEAN NOT NULL DEFAULT true,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  schema_type TEXT DEFAULT 'HealthAndBeautyBusiness',
  custom_schema TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_services_status ON public.services (status);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services (category);
CREATE INDEX IF NOT EXISTS idx_services_display_order ON public.services (display_order ASC);

-- ------------------------------------------------------------------------------
-- 4. REVIEWS TABLE
-- Mirrors Firestore '/reviews/{reviewId}'
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT NOT NULL,
  user_photo TEXT,
  rating NUMERIC(2, 1) NOT NULL DEFAULT 5.0,
  comment TEXT NOT NULL,
  service_tag TEXT,                          -- e.g. 'Swedish Massage'
  verified BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'approved',   -- 'approved' | 'pending' | 'hidden'
  admin_response TEXT,
  date_str TEXT,                             -- Preserves formatted date e.g. '2 weeks ago'
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews (status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews (rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews (created_at DESC);

-- ------------------------------------------------------------------------------
-- 5. APPOINTMENTS (BOOKINGS) TABLE
-- Mirrors Firestore '/appointments/{appointmentId}'
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT NOT NULL,
  user_email TEXT,
  phone TEXT NOT NULL,
  service_id TEXT,
  service_name TEXT NOT NULL,
  duration TEXT,
  price TEXT,
  preferred_date TEXT NOT NULL,
  preferred_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',    -- 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments (status);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON public.appointments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments (user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON public.appointments (phone);

-- ------------------------------------------------------------------------------
-- 6. ARTICLES (BLOG / CONTENT) TABLE
-- Mirrors Firestore '/articles/{articleId}'
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  featured_image TEXT NOT NULL DEFAULT '',
  image_alt TEXT,
  category TEXT NOT NULL DEFAULT 'Wellness',
  author TEXT NOT NULL DEFAULT 'Euro Spa Editorial Team',
  status TEXT NOT NULL DEFAULT 'draft',      -- 'published' | 'draft' | 'archived'
  published_at TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  reading_time_minutes INT NOT NULL DEFAULT 3,
  views_count INT NOT NULL DEFAULT 0,
  seo_title TEXT,
  meta_description TEXT,
  focus_keyword TEXT,
  canonical_url TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles (status);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles (slug);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON public.articles (created_at DESC);

-- ------------------------------------------------------------------------------
-- 7. GALLERY TABLE
-- Mirrors Firestore '/gallery/{photoId}'
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gallery (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Spa Interior', -- 'Spa Interior' | 'Treatment Room' | etc.
  image TEXT NOT NULL,
  fallback_image TEXT,
  alt_text TEXT,
  caption TEXT,
  description TEXT,
  storage_path TEXT,
  display_order INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',     -- 'active' | 'inactive'
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_gallery_status ON public.gallery (status);
CREATE INDEX IF NOT EXISTS idx_gallery_category ON public.gallery (category);
CREATE INDEX IF NOT EXISTS idx_gallery_display_order ON public.gallery (display_order ASC);

-- ------------------------------------------------------------------------------
-- 8. SITE SETTINGS (HOMEPAGE, ABOUT, CONFIG) TABLE
-- Mirrors Firestore '/siteSettings/{settingId}'
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY,                       -- 'homepage' | 'about' | 'site_config' | 'business_info'
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_by TEXT
);

-- ------------------------------------------------------------------------------
-- 9. SERVICE AREAS (LOCAL SEO) TABLE
-- Mirrors Firestore '/serviceAreas/{areaId}'
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_areas (
  id TEXT PRIMARY KEY,                       -- e.g. 'gulshan', 'banani', 'uttara'
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  headline TEXT,
  description TEXT,
  landmarks JSONB NOT NULL DEFAULT '[]'::jsonb,
  keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  popular_services JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_service_areas_status ON public.service_areas (status);
CREATE INDEX IF NOT EXISTS idx_service_areas_slug ON public.service_areas (slug);

-- ------------------------------------------------------------------------------
-- 10. FAQS TABLE
-- Mirrors Firestore '/faqs/{faqId}'
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faqs (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  status TEXT NOT NULL DEFAULT 'active',     -- 'active' | 'inactive'
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_faqs_status ON public.faqs (status);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.faqs (category);
CREATE INDEX IF NOT EXISTS idx_faqs_sort_order ON public.faqs (sort_order ASC);

-- ------------------------------------------------------------------------------
-- 11. GOOGLE BUSINESS SYNC TABLE
-- Mirrors Firestore '/google_business_sync/{syncId}'
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.google_business_sync (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'idle',
  sync_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Mirroring exact access rules defined in firestore.rules
-- ==============================================================================

-- Helper functions for RLS checks
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    coalesce(auth.jwt() ->> 'email', '') = 'mdalahi10000@gmail.com'
    OR EXISTS (
      SELECT 1 FROM public.admins
      WHERE email = coalesce(auth.jwt() ->> 'email', '')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_business_sync ENABLE ROW LEVEL SECURITY;

-- 1. USERS POLICIES
CREATE POLICY "Users can read own profile or admin can read all"
  ON public.users FOR SELECT
  USING (auth.uid()::text = id OR public.is_admin());

CREATE POLICY "Users can insert or update own profile or admin can modify"
  ON public.users FOR ALL
  USING (auth.uid()::text = id OR public.is_admin())
  WITH CHECK (auth.uid()::text = id OR public.is_admin());

-- 2. ADMINS POLICIES
CREATE POLICY "Only admins can read and manage admins directory"
  ON public.admins FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. SERVICES POLICIES
CREATE POLICY "Public read for active services"
  ON public.services FOR SELECT
  USING (status = 'active' OR public.is_admin());

CREATE POLICY "Admin write access for services"
  ON public.services FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. REVIEWS POLICIES
CREATE POLICY "Public read for approved reviews"
  ON public.reviews FOR SELECT
  USING (status != 'hidden' OR public.is_admin());

CREATE POLICY "Anyone can submit a review"
  ON public.reviews FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can update or delete reviews"
  ON public.reviews FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete reviews"
  ON public.reviews FOR DELETE
  USING (public.is_admin());

-- 5. APPOINTMENTS POLICIES
CREATE POLICY "Users can read own appointments or admin can read all"
  ON public.appointments FOR SELECT
  USING (auth.uid()::text = user_id OR public.is_admin());

CREATE POLICY "Anyone can submit an appointment reservation"
  ON public.appointments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can update appointments"
  ON public.appointments FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete appointments"
  ON public.appointments FOR DELETE
  USING (public.is_admin());

-- 6. ARTICLES POLICIES
CREATE POLICY "Public read for published articles"
  ON public.articles FOR SELECT
  USING (status = 'published' OR public.is_admin());

CREATE POLICY "Admin write access for articles"
  ON public.articles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. GALLERY POLICIES
CREATE POLICY "Public read for active gallery photos"
  ON public.gallery FOR SELECT
  USING (status = 'active' OR public.is_admin());

CREATE POLICY "Admin write access for gallery"
  ON public.gallery FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 8. SITE SETTINGS POLICIES
CREATE POLICY "Public read for site settings"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admin write access for site settings"
  ON public.site_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 9. SERVICE AREAS POLICIES
CREATE POLICY "Public read for active service areas"
  ON public.service_areas FOR SELECT
  USING (status = 'active' OR public.is_admin());

CREATE POLICY "Admin write access for service areas"
  ON public.service_areas FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 10. FAQS POLICIES
CREATE POLICY "Public read for active FAQs"
  ON public.faqs FOR SELECT
  USING (status = 'active' OR public.is_admin());

CREATE POLICY "Admin write access for FAQs"
  ON public.faqs FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 11. GOOGLE BUSINESS SYNC POLICIES
CREATE POLICY "Admin full access to google business sync"
  ON public.google_business_sync FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- STORAGE BUCKETS & POLICIES
-- Bucket: 'spa-assets' (public read, authenticated admin write)
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('spa-assets', 'spa-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public can read images in spa-assets
CREATE POLICY "Public Access for spa-assets bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'spa-assets');

-- Admins can upload and manage images in spa-assets
CREATE POLICY "Admin Upload Access for spa-assets bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'spa-assets' AND public.is_admin());

CREATE POLICY "Admin Update Access for spa-assets bucket"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'spa-assets' AND public.is_admin())
  WITH CHECK (bucket_id = 'spa-assets' AND public.is_admin());

CREATE POLICY "Admin Delete Access for spa-assets bucket"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'spa-assets' AND public.is_admin());

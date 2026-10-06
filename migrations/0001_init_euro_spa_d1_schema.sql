-- Cloudflare D1 (SQLite) Schema Migration for Euro Spa Center
-- Migration: 0001_init_euro_spa_d1_schema.sql

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'client',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- 2. ADMINS
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  permissions TEXT NOT NULL DEFAULT '["all"]',
  assigned_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT OR IGNORE INTO admins (id, email, display_name, role)
VALUES ('mdalahi_primary', 'mdalahi10000@gmail.com', 'MD Alahi', 'admin');

-- 3. SERVICES
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  duration_range TEXT,
  short_description TEXT NOT NULL DEFAULT '',
  full_description TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  image_alt TEXT,
  gallery_images TEXT NOT NULL DEFAULT '[]',
  category TEXT NOT NULL DEFAULT 'Massage Therapy',
  price TEXT,
  popular INTEGER NOT NULL DEFAULT 0,
  price_options TEXT NOT NULL DEFAULT '[]',
  benefits TEXT NOT NULL DEFAULT '[]',
  booking_cta TEXT DEFAULT 'Book Treatment',
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  service_areas TEXT NOT NULL DEFAULT '[]',
  seo_title TEXT,
  meta_description TEXT,
  focus_keyword TEXT,
  secondary_keywords TEXT NOT NULL DEFAULT '[]',
  canonical_url TEXT,
  robots_index INTEGER NOT NULL DEFAULT 1,
  robots_follow INTEGER NOT NULL DEFAULT 1,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  schema_type TEXT DEFAULT 'HealthAndBeautyBusiness',
  custom_schema TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_services_status ON services (status);
CREATE INDEX IF NOT EXISTS idx_services_category ON services (category);
CREATE INDEX IF NOT EXISTS idx_services_display_order ON services (display_order ASC);
CREATE INDEX IF NOT EXISTS idx_services_slug ON services (slug);

-- 4. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT NOT NULL,
  user_photo TEXT,
  rating REAL NOT NULL DEFAULT 5.0,
  comment TEXT NOT NULL,
  service_tag TEXT,
  verified INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'approved',
  admin_response TEXT,
  admin_responded_at TEXT,
  date_str TEXT,
  date_string TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews (status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews (rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews (created_at DESC);

-- 5. APPOINTMENTS
CREATE TABLE IF NOT EXISTS appointments (
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
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  admin_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments (status);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments (user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments (phone);

-- 6. ARTICLES
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  featured_image TEXT NOT NULL DEFAULT '',
  image_alt TEXT,
  category TEXT NOT NULL DEFAULT 'Wellness',
  author TEXT NOT NULL DEFAULT 'Euro Spa Editorial Team',
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  reading_time_minutes INTEGER NOT NULL DEFAULT 3,
  views_count INTEGER NOT NULL DEFAULT 0,
  seo_title TEXT,
  meta_description TEXT,
  focus_keyword TEXT,
  canonical_url TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_articles_status ON articles (status);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles (slug);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles (created_at DESC);

-- 7. GALLERY
CREATE TABLE IF NOT EXISTS gallery (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Spa Interior',
  image TEXT NOT NULL,
  fallback_image TEXT,
  alt_text TEXT,
  caption TEXT,
  description TEXT,
  storage_path TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_gallery_status ON gallery (status);
CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery (category);
CREATE INDEX IF NOT EXISTS idx_gallery_display_order ON gallery (display_order ASC);

-- 8. SITE SETTINGS
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_by TEXT
);

-- 9. SERVICE AREAS
CREATE TABLE IF NOT EXISTS service_areas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  headline TEXT,
  description TEXT,
  landmarks TEXT NOT NULL DEFAULT '[]',
  keywords TEXT NOT NULL DEFAULT '[]',
  popular_services TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_service_areas_status ON service_areas (status);
CREATE INDEX IF NOT EXISTS idx_service_areas_slug ON service_areas (slug);

-- 10. FAQS
CREATE TABLE IF NOT EXISTS faqs (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  status TEXT NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_faqs_status ON faqs (status);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs (category);
CREATE INDEX IF NOT EXISTS idx_faqs_sort_order ON faqs (sort_order ASC);

-- 11. GOOGLE BUSINESS SYNC
CREATE TABLE IF NOT EXISTS google_business_sync (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'idle',
  sync_summary TEXT NOT NULL DEFAULT '{}',
  last_sync_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

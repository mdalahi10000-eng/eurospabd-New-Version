-- ==============================================================================
-- Migration: Reviews / Testimonials Table Hardening & RLS Policies
-- Ensures complete field preservation and authorized admin operations
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT NOT NULL,
  user_photo TEXT,
  rating NUMERIC(2, 1) NOT NULL DEFAULT 5.0,
  comment TEXT NOT NULL,
  service_tag TEXT,
  verified BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'approved',
  admin_response TEXT,
  date_str TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure schema backwards-compatibility for date and timestamp fields
ALTER TABLE IF EXISTS public.reviews ADD COLUMN IF NOT EXISTS date_str TEXT;
ALTER TABLE IF EXISTS public.reviews ADD COLUMN IF NOT EXISTS date_string TEXT;
ALTER TABLE IF EXISTS public.reviews ADD COLUMN IF NOT EXISTS admin_responded_at TIMESTAMPTZ;

-- Indexes for performant filtering and sorting
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews (status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews (rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews (created_at DESC);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Safe Policy declarations
DO $$
BEGIN
  -- 1. Read Policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Public read for approved reviews'
  ) THEN
    CREATE POLICY "Public read for approved reviews" 
      ON public.reviews FOR SELECT 
      USING (status != 'hidden' OR public.is_admin());
  END IF;

  -- 2. Insert Policy (public or admin)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Anyone can submit a review'
  ) THEN
    CREATE POLICY "Anyone can submit a review" 
      ON public.reviews FOR INSERT 
      WITH CHECK (true);
  END IF;

  -- 3. Update Policy (admin only)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Admin can update reviews'
  ) THEN
    CREATE POLICY "Admin can update reviews" 
      ON public.reviews FOR UPDATE 
      USING (public.is_admin()) 
      WITH CHECK (public.is_admin());
  END IF;

  -- 4. Delete Policy (admin only)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Admin can delete reviews'
  ) THEN
    CREATE POLICY "Admin can delete reviews" 
      ON public.reviews FOR DELETE 
      USING (public.is_admin());
  END IF;
END $$;

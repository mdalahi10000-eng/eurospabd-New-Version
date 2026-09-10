-- ==============================================================================
-- Fix Supabase Storage Permissions for 'spa-assets' Bucket
--
-- Requirements:
-- 1. Allow authenticated administrators to INSERT/upload files into 'spa-assets'
-- 2. Allow authenticated administrators to UPDATE/overwrite files if needed
-- 3. Allow authenticated administrators to DELETE gallery files when deleting gallery items
-- 4. Keep the bucket PUBLIC for public website image viewing
-- 5. Do NOT make the bucket private
-- 6. Use Supabase Storage RLS policies on storage.objects
-- 7. Use existing authenticated Supabase user and admin authorization logic
-- ==============================================================================

-- 1. Ensure 'spa-assets' bucket exists and is strictly PUBLIC
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'spa-assets',
  'spa-assets',
  true,
  10485760, -- 10MB limit per image
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];

-- 2. Ensure Row Level Security is active on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Comprehensive admin verification function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_email text;
  v_uid text;
BEGIN
  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_uid := coalesce(auth.uid()::text, '');

  -- Primary master administrator check
  IF v_email = 'mdalahi10000@gmail.com' THEN
    RETURN true;
  END IF;

  -- Verify against registered admins table by email
  IF v_email <> '' AND EXISTS (
    SELECT 1 FROM public.admins
    WHERE lower(email) = v_email
  ) THEN
    RETURN true;
  END IF;

  -- Verify against registered admins table by auth UID
  IF v_uid <> '' AND EXISTS (
    SELECT 1 FROM public.admins
    WHERE id = v_uid
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- 4. Clean up legacy or conflicting policies on storage.objects for spa-assets
DROP POLICY IF EXISTS "Public Access for spa-assets bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access for spa-assets bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Access for spa-assets bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin Insert Access for spa-assets bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Access for spa-assets bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Access for spa-assets bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read spa-assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated admin upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated admin update" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated admin delete" ON storage.objects;

-- Policy 1: SELECT (Public Read)
-- Public website visitors and guests can view and download images from spa-assets
CREATE POLICY "Public Read Access for spa-assets bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'spa-assets');

-- Policy 2: INSERT (Admin Upload)
-- Authenticated administrators can upload image files to spa-assets
CREATE POLICY "Admin Insert Access for spa-assets bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'spa-assets'
    AND auth.role() = 'authenticated'
    AND public.is_admin()
  );

-- Policy 3: UPDATE (Admin Update/Overwrite)
-- Authenticated administrators can overwrite/update image files in spa-assets
CREATE POLICY "Admin Update Access for spa-assets bucket"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'spa-assets'
    AND auth.role() = 'authenticated'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'spa-assets'
    AND auth.role() = 'authenticated'
    AND public.is_admin()
  );

-- Policy 4: DELETE (Admin Delete)
-- Authenticated administrators can delete image files from spa-assets when deleting gallery records
CREATE POLICY "Admin Delete Access for spa-assets bucket"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'spa-assets'
    AND auth.role() = 'authenticated'
    AND public.is_admin()
  );

-- The admin "Service Areas" editor saves these fields, but the original
-- schema never created them, so every save failed with:
--   "Could not find the 'content' column of 'service_areas' in the schema cache"
-- Additive, nullable columns: safe to run on the live database.
ALTER TABLE public.service_areas ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.service_areas ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.service_areas ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE public.service_areas ADD COLUMN IF NOT EXISTS focus_keyword TEXT;

-- Refresh PostgREST's schema cache so the API sees the new columns immediately
NOTIFY pgrst, 'reload schema';

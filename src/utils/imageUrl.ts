/**
 * Returns a smaller version of an image URL for display.
 * - Google-hosted (lh3.googleusercontent.com): sets the size suffix (=wNNN).
 * - Supabase Storage public objects: uses the image render endpoint (?width=).
 * Any other URL is returned unchanged.
 */
export function optimizeImageUrl(url: string | undefined | null, width: number, quality = 70): string {
  if (!url) return url || '';
  try {
    if (/^https:\/\/lh\d\.googleusercontent\.com\//.test(url)) {
      const base = url.replace(/=[wsh]\d[^/]*$/, '');
      return `${base}=w${width}-rw`;
    }
    const u = new URL(url);
    if (u.hostname.endsWith('.supabase.co') && u.pathname.includes('/storage/v1/object/public/')) {
      if (/\.(svg|gif)$/i.test(u.pathname)) return url;
      u.pathname = u.pathname.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
      u.searchParams.set('width', String(width));
      u.searchParams.set('quality', String(quality));
      return u.toString();
    }
  } catch {
    /* fall through */
  }
  return url;
}

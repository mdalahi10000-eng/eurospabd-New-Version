import { useState, useEffect } from 'react';

export type RouteType = 'home' | 'admin' | 'blog' | 'blog-detail' | 'location-detail' | 'service-detail' | 'about' | 'not-found';

export interface RouteMatch {
  route: RouteType;
  params: {
    slug?: string;
  };
}

export function parseRoute(pathname: string): RouteMatch {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  if (cleanPath === '/admin' || cleanPath.startsWith('/admin/')) {
    return { route: 'admin', params: {} };
  }

  if (cleanPath === '/about' || cleanPath === '/about-us') {
    return { route: 'about', params: {} };
  }

  if (cleanPath === '/blog') {
    return { route: 'blog', params: {} };
  }

  if (cleanPath.startsWith('/blog/')) {
    const slug = cleanPath.replace('/blog/', '').trim();
    if (slug) {
      return { route: 'blog-detail', params: { slug } };
    }
    return { route: 'blog', params: {} };
  }

  if (cleanPath === '/services') {
    return { route: 'home', params: { slug: 'services' } };
  }

  if (cleanPath.startsWith('/services/')) {
    const slug = cleanPath.replace('/services/', '').trim();
    if (slug) {
      return { route: 'service-detail', params: { slug } };
    }
  }

  if (cleanPath.startsWith('/locations/')) {
    const slug = cleanPath.replace('/locations/', '').trim();
    if (slug) {
      return { route: 'location-detail', params: { slug } };
    }
  }

  if (cleanPath === '/' || cleanPath === '/index.html') {
    return { route: 'home', params: {} };
  }

  // Unknown URL: show a real "not found" page (noindex) instead of the homepage
  return { route: 'not-found', params: {} };
}

/** Old URLs that should permanently point somewhere else (e.g. Google Ads landing page). */
const LEGACY_REDIRECTS: Record<string, string> = {
  '/spa/dhaka': '/',
  '/home': '/',
};

export function resolveLegacyRedirect(pathname: string): string | null {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  return LEGACY_REDIRECTS[cleanPath.toLowerCase()] || null;
}

export function navigate(to: string, replace = false): void {
  const current = window.location.pathname + window.location.search;
  if (to === current || to === window.location.pathname) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (replace) {
    window.history.replaceState({}, '', to);
  } else {
    window.history.pushState({}, '', to);
  }

  window.dispatchEvent(new Event('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function useLocationPath(): { path: string; match: RouteMatch } {
  const [path, setPath] = useState<string>(() => {
    const redirect = resolveLegacyRedirect(window.location.pathname);
    if (redirect) {
      window.history.replaceState({}, '', redirect + window.location.search);
      return redirect;
    }
    return window.location.pathname;
  });

  useEffect(() => {
    const handleLocationChange = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  return {
    path,
    match: parseRoute(path),
  };
}

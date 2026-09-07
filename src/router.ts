import { useState, useEffect } from 'react';

export type RouteType = 'home' | 'admin' | 'blog' | 'blog-detail' | 'location-detail' | 'service-detail' | 'about';

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

  return { route: 'home', params: {} };
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
  const [path, setPath] = useState<string>(() => window.location.pathname);

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

import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Phone, 
  MessageSquare, 
  Clock, 
  Shield, 
  CheckCircle, 
  ArrowRight, 
  Sparkles, 
  Calendar,
  ExternalLink,
  ChevronRight,
  Home
} from 'lucide-react';
import { ServiceArea, Service, BusinessInfo } from '../../types';
import { fetchServiceAreaBySlug } from '../../services/localSeoService';
import { navigate } from '../../router';
import { updatePageSeo, SEO_CONFIG, buildCanonicalUrl, setCanonicalUrl } from '../../config/seoConfig';

interface LocationDetailPageProps {
  slug: string;
  businessInfo: BusinessInfo;
  services: Service[];
  onOpenBookNow: (service?: Service) => void;
  onOpenCallModal: () => void;
}

export function LocationDetailPage({
  slug,
  businessInfo,
  services,
  onOpenBookNow,
  onOpenCallModal
}: LocationDetailPageProps) {
  const [area, setArea] = useState<ServiceArea | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchServiceAreaBySlug(slug).then((res) => {
      if (isMounted) {
        setArea(res);
        setLoading(false);
      }
    }).catch((err) => {
      console.warn('Failed to load location by slug:', err);
      if (isMounted) setLoading(false);
    });

    return () => { isMounted = false; };
  }, [slug]);

  // Update SEO Head meta tags dynamically
  useEffect(() => {
    if (!area) return;

    const pageTitle = area.seoTitle || `Spa & Massage Center in ${area.name}, Dhaka | ${businessInfo.businessName || SEO_CONFIG.siteName}`;
    const pageDescription = area.metaDescription || area.shortDescription || businessInfo.description || SEO_CONFIG.defaultMetaDescription;
    const canonicalUrl = buildCanonicalUrl(`/locations/${area.slug}`);

    // Centralized SEO meta and canonical tags
    updatePageSeo({
      title: pageTitle,
      description: pageDescription,
      canonicalUrl: canonicalUrl,
      ogImage: SEO_CONFIG.defaultOgImage,
      ogType: 'website'
    });

    // Inject area-specific Schema
    const localSchema = {
      '@context': 'https://schema.org',
      '@type': businessInfo.schemaType || 'DaySpa',
      '@id': `${canonicalUrl}#local`,
      name: `${businessInfo.businessName || SEO_CONFIG.siteName} - Serving ${area.name}`,
      description: pageDescription,
      url: canonicalUrl,
      telephone: businessInfo.phone,
      address: {
        '@type': 'PostalAddress',
        streetAddress: businessInfo.addressLine,
        addressLocality: businessInfo.area,
        addressRegion: businessInfo.city,
        postalCode: businessInfo.postalCode,
        addressCountry: businessInfo.country
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: businessInfo.latitude,
        longitude: businessInfo.longitude
      },
      hasMap: businessInfo.googleMapsUrl,
      areaServed: {
        '@type': 'AdministrativeArea',
        name: `${area.name}, Dhaka`
      },
      priceRange: businessInfo.priceRange
    };

    let schemaScript = document.getElementById('location-page-schema') as HTMLScriptElement | null;
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = 'location-page-schema';
      schemaScript.type = 'application/ld+json';
      document.head.appendChild(schemaScript);
    }
    schemaScript.textContent = JSON.stringify(localSchema, null, 2);

    return () => {
      // Cleanup location-page-schema on unmount and restore canonical
      const existing = document.getElementById('location-page-schema');
      if (existing) existing.remove();
      setCanonicalUrl(buildCanonicalUrl('/'));
    };
  }, [area, businessInfo]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-500 gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold">Loading location information...</p>
      </div>
    );
  }

  // Not found or inactive
  if (!area || area.status === 'inactive') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
          <MapPin className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          Location Service Area Not Found
        </h1>
        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
          The requested location landing page is currently not published or does not exist. You are welcome to explore our flagship spa therapies in Banani, Dhaka.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Return to Homepage</span>
        </button>
      </div>
    );
  }

  const primaryServices = services.slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* Top Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <button
              onClick={() => navigate('/')}
              className="hover:text-blue-600 flex items-center gap-1 cursor-pointer font-medium"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-400">Locations</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-bold text-slate-900">{area.name}</span>
          </div>

          <button
            onClick={() => onOpenBookNow()}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Appointment</span>
          </button>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200/80 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-bold mb-4">
              <MapPin className="w-3.5 h-3.5" />
              <span>Dhaka Service Area • {area.name}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
              {area.seoTitle || `Spa & Massage Therapy in ${area.name}, Dhaka`}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
              {area.shortDescription}
            </p>

            {/* Direct Contact CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onOpenBookNow()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Book a Session</span>
              </button>

              <a
                href={`https://wa.me/${businessInfo.whatsappNumber}?text=${encodeURIComponent(`Hello Euro Spa Center, I am from ${area.name} and would like to inquire about booking a spa therapy.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Us</span>
              </a>

              <button
                onClick={onOpenCallModal}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4 text-blue-600" />
                <span>{businessInfo.displayPhone}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (2 Cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Unique Editorial Content / Localized Details */}
          {area.content && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center gap-2.5 text-blue-700 font-bold text-xs uppercase tracking-wider mb-3">
                <Sparkles className="w-4 h-4" />
                <span>About Our Services in {area.name}</span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Relaxation & Therapeutic Wellness for {area.name} Clients
              </h2>

              <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3 whitespace-pre-line">
                {area.content}
              </div>
            </div>
          )}

          {/* Available Treatments Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Popular Therapies for {area.name} Visitors
                </h3>
                <p className="text-xs text-slate-500">
                  Certified therapists, private climate-controlled rooms, and pure aromatherapy oils
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {primaryServices.map((service) => (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-blue-200 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        {service.name}
                      </h4>
                      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {service.durationRange}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                      {service.shortDescription}
                    </p>

                    <div className="text-xs font-extrabold text-slate-900 mb-4">
                      {service.price}
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenBookNow(service)}
                    className="w-full py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Book {service.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Canonical NAP & Location Card (1 Col) */}
        <div className="space-y-6">
          {/* Canonical NAP Anchor Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Flagship Center Identity</span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                {businessInfo.businessName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {businessInfo.tagline}
              </p>
            </div>

            <div className="space-y-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 font-semibold">Physical Address:</strong>
                  <span>{businessInfo.fullAddress}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 font-semibold">Operating Hours:</strong>
                  <span>{businessInfo.displayHours}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 font-semibold">Direct Telephone:</strong>
                  <a href={`tel:${businessInfo.phone}`} className="hover:text-blue-600 font-mono">
                    {businessInfo.phone}
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <a
                href={businessInfo.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Get Directions from {area.name}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Quick Assurance Checklist */}
          <div className="bg-slate-100/70 rounded-2xl p-5 border border-slate-200 text-xs space-y-2.5">
            <h4 className="font-bold text-slate-900 mb-1">Our Center Standards</h4>
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Certified professional therapists</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Private sanitized rooms with attached baths</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>100% genuine imported essential oils</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Strict client privacy & professional environment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

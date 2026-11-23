import { useEffect } from 'react';
import {
  MapPin,
  Phone,
  MessageSquare,
  Clock,
  CheckCircle,
  ArrowRight,
  Calendar,
  ExternalLink,
  ChevronRight,
  Home,
  Sparkles
} from 'lucide-react';
import { Service, BusinessInfo, PriceOption } from '../../types';
import { Link } from '../Link';
import {
  updatePageSeo,
  SEO_CONFIG,
  buildCanonicalUrl,
  setCanonicalUrl,
  markPageNotFound
} from '../../config/seoConfig';

interface ServiceDetailPageProps {
  slug: string;
  services: Service[];
  loading: boolean;
  businessInfo: BusinessInfo;
  onOpenBookNow: (service?: Service, option?: PriceOption | null) => void;
  onOpenCallModal: () => void;
}

function toAbsoluteUrl(url: string | undefined): string {
  if (!url) return SEO_CONFIG.defaultOgImage;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SEO_CONFIG.canonicalBaseUrl}${url.startsWith('/') ? '' : '/'}${encodeURI(url)}`;
}

export function ServiceDetailPage({
  slug,
  services,
  loading,
  businessInfo,
  onOpenBookNow,
  onOpenCallModal
}: ServiceDetailPageProps) {
  const service = services.find((s) => (s.slug || s.id) === slug || s.id === slug) || null;
  const otherServices = services.filter((s) => s !== service && s.status !== 'inactive');
  const areaName = businessInfo.area || 'Banani';
  const cityName = businessInfo.city || 'Dhaka';

  // SEO head tags + page-specific schema
  useEffect(() => {
    if (!service) return;

    const canonicalUrl = buildCanonicalUrl(`/services/${service.slug || service.id}`);
    const title = service.seoTitle || `${service.name} in ${areaName}, ${cityName} | ${SEO_CONFIG.siteName}`;
    const description =
      service.metaDescription ||
      service.shortDescription ||
      `${service.name} at ${SEO_CONFIG.siteName}, ${businessInfo.fullAddress}.`;

    updatePageSeo({
      title,
      description,
      canonicalUrl,
      ogImage: toAbsoluteUrl(service.ogImage || service.image),
      ogType: 'website',
      robots: service.robotsIndex === false ? 'noindex, follow' : undefined
    });

    const offers = (service.priceOptions || [])
      .filter((o) => o.amount > 0)
      .map((o) => ({
        '@type': 'Offer',
        name: `${service.name} - ${o.duration}`,
        price: o.amount,
        priceCurrency: 'BDT',
        availability: 'https://schema.org/InStock',
        url: canonicalUrl
      }));

    const schema = [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': `${canonicalUrl}#service`,
        name: service.name,
        serviceType: service.category || 'Massage Therapy',
        description: service.fullDescription || service.shortDescription,
        image: toAbsoluteUrl(service.image),
        url: canonicalUrl,
        areaServed: { '@type': 'City', name: cityName },
        provider: { '@id': `${SEO_CONFIG.canonicalBaseUrl}/#business` },
        ...(offers.length > 0 ? { offers } : {})
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SEO_CONFIG.canonicalBaseUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Services', item: `${SEO_CONFIG.canonicalBaseUrl}/services` },
          { '@type': 'ListItem', position: 3, name: service.name, item: canonicalUrl }
        ]
      }
    ];

    let script = document.getElementById('service-page-schema') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'service-page-schema';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);

    return () => {
      document.getElementById('service-page-schema')?.remove();
      setCanonicalUrl(buildCanonicalUrl('/'));
    };
  }, [service, businessInfo, areaName, cityName]);

  useEffect(() => {
    if (!loading && !service) markPageNotFound();
  }, [loading, service]);

  if (!service && loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-500 gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold">Loading treatment details...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Treatment Not Found</h1>
        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
          This treatment page does not exist or is no longer available. Please explore our other spa therapies in {areaName}, {cityName}.
        </p>
        <Link
          to="/"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Return to Homepage</span>
        </Link>
      </div>
    );
  }

  const whatsappText = encodeURIComponent(
    `Hello ${businessInfo.businessName || SEO_CONFIG.siteName}, I would like to book a ${service.name}.`
  );
  const paragraphs = (service.fullDescription || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const priceList = (service.priceOptions || [])
    .filter((o) => o.duration && o.price)
    .map((o) => `${o.duration}: ${o.price}`)
    .join(', ');
  const faqs = [
    {
      q: `Where can I book ${service.name} near Banani and Gulshan?`,
      a: `${businessInfo.businessName || SEO_CONFIG.siteName} is at ${businessInfo.fullAddress}, close to Gulshan. Use Get Directions to open the location in Google Maps.`
    },
    ...(priceList
      ? [{ q: `How much does ${service.name} cost in ${areaName}?`, a: `${service.name} prices at ${businessInfo.businessName || SEO_CONFIG.siteName}: ${priceList}.` }]
      : []),
    {
      q: 'What are your opening hours?',
      a: `We are open ${businessInfo.displayHours}.`
    },
    {
      q: `How do I book ${service.name}?`,
      a: `Press Book This Treatment, or call or WhatsApp us on ${businessInfo.displayPhone || businessInfo.phone}.`
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
            <Link to="/" className="hover:text-blue-600 flex items-center gap-1 cursor-pointer font-medium">
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <Link to="/services" className="hover:text-blue-600 cursor-pointer font-medium">
              Services
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className="font-bold text-slate-900 truncate">{service.name}</span>
          </nav>

          <button
            onClick={() => onOpenBookNow(service, null)}
            className="shrink-0 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Now</span>
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200/80 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-bold mb-4">
              <Clock className="w-3.5 h-3.5" />
              <span>{service.durationRange}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
              {service.name} in {areaName}, {cityName}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
              {service.shortDescription}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onOpenBookNow(service, null)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>{service.bookingCta || 'Book This Treatment'}</span>
              </button>
              <a
                href={`https://wa.me/${businessInfo.whatsappNumber}?text=${whatsappText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Us</span>
              </a>
              <a
                href={`tel:${(businessInfo.phone || '').replace(/[^0-9+]/g, '')}`}
                onClick={(e) => {
                  e.preventDefault();
                  onOpenCallModal();
                }}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4 text-blue-600" />
                <span>{businessInfo.displayPhone}</span>
              </a>
            </div>
          </div>

          {service.image && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm aspect-[4/3] bg-slate-100">
              <img
                src={service.image}
                alt={service.imageAlt || `${service.name} at ${SEO_CONFIG.siteName} in ${areaName}, ${cityName}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          {paragraphs.length > 0 && (
            <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center gap-2.5 text-blue-700 font-bold text-xs uppercase tracking-wider mb-3">
                <Sparkles className="w-4 h-4" />
                <span>About This Treatment</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                What to Expect from {service.name} at {SEO_CONFIG.siteName}
              </h2>
              <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
                {paragraphs.map((p, i) => (
                  <p key={i} className="whitespace-pre-line">{p}</p>
                ))}
              </div>
            </section>
          )}

          {/* Prices */}
          {service.priceOptions && service.priceOptions.length > 0 && (
            <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                {service.name} Price in {areaName}, {cityName}
              </h2>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {service.priceOptions.map((opt) => (
                  <div key={opt.duration} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{opt.duration}</div>
                      <div className="text-xs text-slate-500">{opt.price}</div>
                    </div>
                    <button
                      onClick={() => onOpenBookNow(service, opt)}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Book {opt.duration}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Benefits */}
          {service.benefits && service.benefits.length > 0 && (
            <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Benefits of {service.name}</h2>
              <ul className="space-y-2.5">
                {service.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* FAQ */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {service.name} in {areaName} – Common Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((f) => (
                <div key={f.q}>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{f.q}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Other services */}
          {otherServices.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Other Spa Treatments in {areaName}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {otherServices.map((s) => (
                  <Link
                    key={s.id}
                    to={`/services/${s.slug || s.id}`}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-blue-300 transition-all flex items-center justify-between gap-3"
                  >
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{s.name}</h3>
                      <p className="text-xs text-slate-500">{s.durationRange}{s.price ? ` • from ${s.price}` : ''}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-blue-600 shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar NAP */}
        <aside className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">{businessInfo.businessName}</h2>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>{businessInfo.fullAddress}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>{businessInfo.displayHours}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <a href={`tel:${(businessInfo.phone || '').replace(/[^0-9+]/g, '')}`} className="hover:text-blue-600">
                  {businessInfo.displayPhone || businessInfo.phone}
                </a>
              </div>
            </div>
            <a
              href={businessInfo.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Get Directions</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}

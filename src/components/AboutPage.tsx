import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Award, 
  ShieldCheck, 
  UserCheck, 
  Sparkles, 
  Lock, 
  CheckCircle2, 
  Phone, 
  Clock, 
  MapPin, 
  Calendar, 
  ChevronRight, 
  HeartHandshake, 
  Droplet, 
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { 
  AboutContent, 
  DEFAULT_ABOUT_CONTENT, 
  fetchAboutContent, 
  subscribeToAboutContent,
  getInitialAboutContent
} from '../services/aboutService';
import { hasCachedData, CACHE_KEYS } from '../services/cacheService';
import { BusinessInfo, ServiceArea } from '../types';
import { SPA_INFO } from '../data/spaData';
import { navigate } from '../router';
import { updatePageSeo, buildCanonicalUrl, setCanonicalUrl, SEO_CONFIG } from '../config/seoConfig';
import euroSpaLogo from '../assets/Untitled design (4).jpg';

interface AboutPageProps {
  onBookNowClick?: () => void;
  onWhatsAppClick?: () => void;
  onCallClick?: () => void;
  businessInfo?: BusinessInfo;
  serviceAreas?: ServiceArea[];
}

const DEFAULT_HIGHLIGHT_ICONS = [
  ShieldCheck,
  UserCheck,
  Sparkles,
  Lock,
  Award,
  CheckCircle2,
  HeartHandshake,
  Droplet
];

export function AboutPage({
  onBookNowClick,
  onWhatsAppClick,
  onCallClick,
  businessInfo,
  serviceAreas
}: AboutPageProps) {
  const [content, setContent] = useState<AboutContent>(() => getInitialAboutContent());
  const [loading, setLoading] = useState<boolean>(() => !hasCachedData(CACHE_KEYS.ABOUT));

  const name = businessInfo?.businessName || SPA_INFO.name || 'Euro Spa Center';
  const phone = businessInfo?.phone || SPA_INFO.phone;
  const whatsappNumber = businessInfo?.whatsappNumber || SPA_INFO.whatsappNumber;
  const address = businessInfo ? `${businessInfo.addressLine}, ${businessInfo.area}, ${businessInfo.city}` : SPA_INFO.fullAddress;
  const displayHours = businessInfo?.displayHours || '10:00 AM – 10:00 PM Daily';

  // Real-time synchronization with Supabase siteSettings/about
  useEffect(() => {
    window.scrollTo(0, 0);

    // Initial load
    fetchAboutContent()
      .then((data) => {
        setContent(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Error loading about content on page:', err);
        setLoading(false);
      });

    // Real-time subscription so admin edits reflect immediately
    const unsubscribe = subscribeToAboutContent((updated) => {
      setContent(updated);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // SEO updates whenever content or businessInfo changes
  useEffect(() => {
   const pageTitle = `About Us | Euro Spa Center | Spa & Wellness in Banani, Dhaka`;
    const pageDescription = content.description 
      ? (content.description.length > 155 ? `${content.description.slice(0, 152)}...` : content.description)
      : `Learn about Euro Spa Center, a professional spa and wellness center at 73 Road No. 6, Banani, Dhaka, offering massage and wellness treatments.`;
    const canonical = buildCanonicalUrl('/about');
    const ogImg = content.featuredImage || SEO_CONFIG.defaultOgImage;

    updatePageSeo({
      title: pageTitle,
      description: pageDescription,
      canonicalUrl: canonical,
      ogImage: ogImg,
      ogType: 'website'
    });

    // Inject dedicated AboutPage JSON-LD Schema
    if (typeof document !== 'undefined') {
      let scriptEl = document.getElementById('about-page-schema') as HTMLScriptElement | null;
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = 'about-page-schema';
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }

      const schemaObj = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'AboutPage',
            '@id': `${canonical}#webpage`,
            'url': canonical,
            'name': pageTitle,
            'description': pageDescription,
            'mainEntity': {
              '@type': 'DaySpa',
              '@id': `${buildCanonicalUrl('/')}#business`,
              'name': name,
              'image': ogImg,
              'telephone': phone,
              'address': {
                '@type': 'PostalAddress',
                'streetAddress': businessInfo?.addressLine || '73 Road No. 6',
                'addressLocality': businessInfo?.area || 'Banani',
                'addressRegion': businessInfo?.city || 'Dhaka',
                'postalCode': businessInfo?.postalCode || '1213',
                'addressCountry': 'BD'
              }
            },
            'breadcrumb': {
              '@type': 'BreadcrumbList',
              'itemListElement': [
                {
                  '@type': 'ListItem',
                  'position': 1,
                  'name': 'Home',
                  'item': buildCanonicalUrl('/')
                },
                {
                  '@type': 'ListItem',
                  'position': 2,
                  'name': 'About Us',
                  'item': canonical
                }
              ]
            }
          }
        ]
      };

      scriptEl.textContent = JSON.stringify(schemaObj, null, 2);
    }

    return () => {
      setCanonicalUrl(buildCanonicalUrl('/'));
      const scriptEl = document.getElementById('about-page-schema');
      if (scriptEl) scriptEl.remove();
    };
  }, [content, name, phone, address, businessInfo]);

  const handleWhatsAppAction = () => {
    if (onWhatsAppClick) {
      onWhatsAppClick();
    } else {
      window.open(
        `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hello ${name}, I would like to inquire about booking a relaxing spa therapy.`)}`,
        '_blank'
      );
    }
  };

  const handleCallAction = () => {
    if (onCallClick) {
      onCallClick();
    } else {
      window.location.href = `tel:${phone.replace(/[^0-9+]/g, '')}`;
    }
  };

  const highlights = content.highlights && content.highlights.length > 0
    ? content.highlights
    : DEFAULT_ABOUT_CONTENT.highlights;

  const featuredImgUrl = content.featuredImage || DEFAULT_ABOUT_CONTENT.featuredImage;
  const featuredImgAlt = content.featuredImageAlt || `${name} Interior, Ambience & VIP Suite`;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => navigate('/')}
          >
            <button 
              onClick={(e) => { e.stopPropagation(); navigate('/'); }}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              title="Return to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <img 
                src={euroSpaLogo} 
                alt={name} 
                className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-2xs" 
              />
              <div>
                <span className="font-bold text-base text-gray-900 leading-none block">
                  {name}
                </span>
                <span className="text-[11px] text-gray-500 font-medium">
                  Banani, Dhaka • Luxury Wellness
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors hidden sm:inline-block cursor-pointer"
            >
              Main Website
            </button>
            <button
              onClick={() => navigate('/blog')}
              className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors hidden md:inline-block cursor-pointer"
            >
              Wellness Blog
            </button>
            {onBookNowClick && (
              <button
                onClick={onBookNowClick}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Book Appointment
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Breadcrumbs Navigation */}
      <div className="bg-white border-b border-gray-100 py-2.5 px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-1.5 text-xs text-gray-500">
          <button 
            onClick={() => navigate('/')}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-900 font-semibold">About Us</span>
        </div>
      </div>

      {/* Main Page Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 sm:py-12 space-y-12">
        {/* Hero & Brand Story Section */}
        <section className="bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-10 shadow-2xs space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Story & Narrative */}
            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sanctuary of Tranquility & Healing</span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                  {content.heading || `About ${name}`}
                </h1>
                {content.subheading && (
                  <p className="text-sm sm:text-base font-semibold text-blue-600">
                    {content.subheading}
                  </p>
                )}
              </div>

              <div className="space-y-4 text-gray-700 text-sm sm:text-base leading-relaxed">
                <p>
                  {content.description}
                </p>
                {content.secondaryText && (
                  <p className="text-gray-600">
                    {content.secondaryText}
                  </p>
                )}
              </div>

              {/* Trust Credentials & Experience Metrics */}
              {(content.yearsOfExperience || content.clientsServed) && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {content.yearsOfExperience && (
                    <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200">
                      <div className="flex items-center gap-2 text-blue-600 mb-1">
                        <Award className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Experience</span>
                      </div>
                      <p className="text-lg sm:text-xl font-extrabold text-gray-900">
                        {content.yearsOfExperience}
                      </p>
                    </div>
                  )}

                  {content.clientsServed && (
                    <div className="p-3.5 rounded-2xl bg-[#F0FDF4] border border-emerald-200">
                      <div className="flex items-center gap-2 text-emerald-600 mb-1">
                        <UserCheck className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Satisfied Guests</span>
                      </div>
                      <p className="text-lg sm:text-xl font-extrabold text-gray-900">
                        {content.clientsServed}
                      </p>
                    </div>
                  )}

                  <div className="p-3.5 rounded-2xl bg-[#FAF5FF] border border-purple-200 col-span-2 sm:col-span-1">
                    <div className="flex items-center gap-2 text-purple-600 mb-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Hygiene Standard</span>
                    </div>
                    <p className="text-lg sm:text-xl font-extrabold text-gray-900">
                      100% Certified
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-4">
                {onBookNowClick && (
                  <button
                    onClick={onBookNowClick}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book an Appointment</span>
                  </button>
                )}

                <button
                  onClick={handleWhatsAppAction}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-2xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Inquiry</span>
                </button>

                <button
                  onClick={handleCallAction}
                  className="px-5 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-sm font-bold rounded-2xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span>{phone}</span>
                </button>
              </div>
            </div>

            {/* Featured Image & Ambience Preview */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden shadow-lg border border-gray-200 bg-gray-100 group">
                <img
                  src={featuredImgUrl}
                  alt={featuredImgAlt}
                  referrerPolicy="no-referrer"
                  className="w-full h-80 sm:h-96 lg:h-[420px] object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_ABOUT_CONTENT.featuredImage!;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                    Banani Luxury Spa Sanctuary
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    Private VIP Therapy Suites
                  </h3>
                  <p className="text-xs text-gray-200 mt-1">
                    Sterilized linen, soothing aromatherapy & personalized wellness care.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Items & Service Pillars Section */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Our Core Standards
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
              Why Discerning Guests Choose {name}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Every detail of our wellness center is purposefully curated to deliver exceptional relaxation, utmost privacy, and authentic physical restoration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {highlights.map((item, idx) => {
              const Icon = DEFAULT_HIGHLIGHT_ICONS[idx % DEFAULT_HIGHLIGHT_ICONS.length];
              return (
                <div 
                  key={item.id || idx}
                  className="bg-white p-6 rounded-3xl border border-gray-200/90 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-base text-gray-900">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="pt-4 mt-4 border-t border-gray-100 flex items-center text-[11px] font-semibold text-blue-600 gap-1">
                    <span>Verified Benchmark</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Hygiene, Discretion & Safety Protocols Card */}
        <section className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Hospitality & Health Compliance</span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
                Uncompromising Hygiene & Absolute Guest Discretion
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                We implement hospital-grade cleanliness across all suites. Fresh linen is unsealed in front of each guest, treatment tables and shower facilities undergo ultraviolet sanitization before every session, and our certified therapists maintain the highest standards of professional ethics.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Single-use sterilized linen & towels for every session</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Discreet private entrance and acoustic insulation</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>100% natural, therapeutic-grade essential aromatherapy oils</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Fully private attached bathrooms & dressing spaces</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5 space-y-4 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300 block">
                Reserve Your Private Suite
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Prior reservations are recommended to guarantee your preferred therapist and private therapy room.
              </p>
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleWhatsAppAction}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Instant WhatsApp Booking</span>
                </button>
                <button
                  onClick={handleCallAction}
                  className="w-full py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span>Direct Hotline</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Location & Quick Contact Card */}
        <section className="bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-8 shadow-2xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Location & Address
                </h4>
                <p className="text-sm font-bold text-gray-900">
                  {address}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Prime Banani location with secure guest parking.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Opening Hours
                </h4>
                <p className="text-sm font-bold text-gray-900">
                  {displayHours}
                </p>
                <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                  Open 7 Days a Week
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Hotline & WhatsApp
                </h4>
                <p className="text-sm font-bold text-gray-900">
                  {phone}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Instant booking & inquiries welcome.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

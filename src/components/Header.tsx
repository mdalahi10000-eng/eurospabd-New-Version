import { MapPin, Star, Navigation, Calendar, Phone, Share2, Menu, Sparkles } from 'lucide-react';
import { SPA_INFO } from '../data/spaData';
import { BusinessInfo } from '../types';
import { HomepageContent } from '../services/homepageService';
import euroSpaLogo from '../assets/Untitled design (4).jpg';

interface HeaderProps {
  onDirectionsClick: () => void;
  onBookNowClick: () => void;
  onCallClick: () => void;
  onWhatsAppClick: () => void;
  onReviewsClick: () => void;
  onLocationClick: () => void;
  onMenuClick: () => void;
  onShareClick: () => void;
  rating?: number;
  reviewsCount?: number;
  businessInfo?: BusinessInfo;
  homepageContent?: HomepageContent;
}

export function Header({
  onDirectionsClick,
  onBookNowClick,
  onCallClick,
  onWhatsAppClick,
  onReviewsClick,
  onLocationClick,
  onMenuClick,
  onShareClick,
  rating,
  reviewsCount,
  businessInfo,
  homepageContent
}: HeaderProps) {
  const displayRating = homepageContent?.ratingOverride ?? (rating ?? SPA_INFO.rating);
  const displayReviewsCount = homepageContent?.reviewsCountOverride ?? (reviewsCount ?? SPA_INFO.reviewsCount);
  const name = homepageContent?.heroTitle || businessInfo?.businessName || SPA_INFO.name;
  const category = homepageContent?.categoryBadge || businessInfo?.primaryCategory || SPA_INFO.category;
  const locationShort = homepageContent?.locationBadge || (businessInfo ? `${businessInfo.area}, ${businessInfo.city}` : SPA_INFO.locationShort);
  const statusDisplay = homepageContent?.statusBadge || businessInfo?.displayStatus || `Open · ${SPA_INFO.openingHours} Daily`;
  const heroImage = homepageContent?.heroBannerImage || "https://lh3.googleusercontent.com/geougc/AF1QipPLNOXvJcErsUyF-6Jorv4EaoC6kDl3WaDnpL6W=w800-h450-k-no";
  const heroAlt = homepageContent?.heroBannerAlt || "Euro Spa Center Ambience";
  const logo = homepageContent?.logoImage || euroSpaLogo;

  // CTA button configs
  const cta = homepageContent?.ctaButtons;
  const directionsConfig = cta?.directions ?? { enabled: true, label: 'Directions' };
  const bookNowConfig = cta?.bookNow ?? { enabled: true, label: 'Book Now' };
  const callConfig = cta?.call ?? { enabled: true, label: 'Call' };
  const whatsappConfig = cta?.whatsapp ?? { enabled: true, label: 'WhatsApp' };

  return (
    <header className="w-full relative bg-white">
      {/* Optional Top Announcement Banner */}
      {homepageContent?.announcementBanner?.enabled && (
        <div className="w-full bg-slate-900 text-white px-3 py-2 text-center text-xs flex items-center justify-center gap-2 font-medium z-30 relative">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{homepageContent.announcementBanner.text}</span>
          {homepageContent.announcementBanner.linkText && (
            <button
              onClick={onBookNowClick}
              className="underline font-bold text-amber-300 hover:text-amber-200 cursor-pointer ml-1"
            >
              {homepageContent.announcementBanner.linkText}
            </button>
          )}
        </div>
      )}

      {/* Top Floating Control Bar matching Clean Minimalism */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between">
        <button 
          id="btn-header-menu"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="bg-white/90 backdrop-blur-md p-2 rounded-full shadow-sm text-gray-700 hover:text-gray-900 hover:bg-white active:scale-95 transition-all cursor-pointer border border-gray-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button 
          id="btn-header-share"
          onClick={onShareClick}
          aria-label="Share profile"
          className="bg-white/90 backdrop-blur-md p-2 rounded-full shadow-sm text-gray-700 hover:text-gray-900 hover:bg-white active:scale-95 transition-all cursor-pointer border border-gray-100"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Hero Banner with Clean Minimalist Overlay */}
      <div className="relative w-full h-52 sm:h-60 md:h-64 overflow-hidden bg-gray-200">
        <img
          src={heroImage}
          alt={heroAlt}
          referrerPolicy="no-referrer"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="w-full h-full object-cover object-center"
        />
        {/* Soft natural gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
      </div>

      {/* Clean Floating Badge Overlapping Hero */}
      <div className="relative -mt-10 sm:-mt-11 flex justify-center z-10">
        <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-white border-4 border-white shadow-xl flex items-center justify-center transition-transform hover:scale-105 overflow-hidden">
          <img
            src={logo}
            alt="Euro Spa Center Logo"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain rounded-full bg-white"
          />
        </div>
      </div>

      {/* Business Identity - Clean Minimalism */}
      <div className="px-5 pt-3 pb-4 text-center border-b border-gray-100">
        <h1 
          id="brand-title"
          className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight"
        >
          {name}
        </h1>

        {homepageContent?.heroTagline && (
          <p className="text-xs font-semibold text-gray-500 mt-0.5">
            {homepageContent.heroTagline}
          </p>
        )}

        {/* Rating and Reviews */}
        <div className="flex items-center justify-center gap-1.5 mt-1.5">
          <span className="text-sm font-bold text-gray-800">{displayRating.toFixed(1)}</span>
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-current text-yellow-400" />
            ))}
          </div>
          <button 
            id="btn-rating-reviews"
            onClick={onReviewsClick}
            className="text-sm text-blue-600 font-medium hover:underline cursor-pointer ml-0.5"
          >
            ({displayReviewsCount} reviews)
          </button>
        </div>

        {/* Category & Location */}
        <div className="mt-1 flex items-center justify-center gap-1 text-sm text-gray-500">
          <button 
            id="btn-header-location"
            onClick={onLocationClick}
            className="flex items-center gap-1 hover:text-gray-800 transition-colors cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <span>{category} &middot; {locationShort}</span>
          </button>
        </div>

        {/* Hours status */}
        <div className="mt-1">
          <span className="text-sm font-bold text-green-600">
            {statusDisplay}
          </span>
        </div>
      </div>

      {/* 4 Circular Action Buttons matching Clean Minimalism Design */}
      <div className="flex justify-around py-4 px-2 sm:px-6 border-b border-gray-100 bg-white">
        {/* Directions */}
        {directionsConfig.enabled && (
          <button 
            type="button"
            id="btn-header-directions"
            onClick={onDirectionsClick}
            aria-label={directionsConfig.label || 'Get directions'}
            className="flex flex-col items-center gap-1.5 cursor-pointer group bg-transparent border-0 p-0 focus:outline-none"
          >
            <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-blue-600 group-hover:bg-blue-50 group-active:scale-95 transition-all shadow-xs">
              <Navigation className="w-5 h-5 fill-current" />
            </div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">
              {directionsConfig.label || 'Directions'}
            </span>
          </button>
        )}

        {/* Book Now (Hero primary) */}
        {bookNowConfig.enabled && (
          <button 
            type="button"
            id="btn-header-book-now"
            onClick={onBookNowClick}
            aria-label={bookNowConfig.label || 'Book an appointment'}
            className="flex flex-col items-center gap-1.5 cursor-pointer group bg-transparent border-0 p-0 focus:outline-none"
          >
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200 group-hover:bg-blue-700 group-active:scale-95 transition-all">
              <Calendar className="w-5 h-5 fill-current" />
            </div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">
              {bookNowConfig.label || 'Book Now'}
            </span>
          </button>
        )}

        {/* Call */}
        {callConfig.enabled && (
          <button 
            type="button"
            id="btn-header-call"
            onClick={onCallClick}
            aria-label={callConfig.label || 'Call reception'}
            className="flex flex-col items-center gap-1.5 cursor-pointer group bg-transparent border-0 p-0 focus:outline-none"
          >
            <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-blue-600 group-hover:bg-blue-50 group-active:scale-95 transition-all shadow-xs">
              <Phone className="w-5 h-5 fill-current" />
            </div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">
              {callConfig.label || 'Call'}
            </span>
          </button>
        )}

        {/* WhatsApp */}
        {whatsappConfig.enabled && (
          <button 
            type="button"
            id="btn-header-whatsapp"
            onClick={onWhatsAppClick}
            aria-label={whatsappConfig.label || 'Chat on WhatsApp'}
            className="flex flex-col items-center gap-1.5 cursor-pointer group bg-transparent border-0 p-0 focus:outline-none"
          >
            <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-green-600 group-hover:bg-green-50 group-active:scale-95 transition-all shadow-xs">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2z"/>
              </svg>
            </div>
            <span className="text-[10px] font-bold text-green-600 uppercase tracking-tighter">
              {whatsappConfig.label || 'WhatsApp'}
            </span>
          </button>
        )}
      </div>
    </header>
  );
}

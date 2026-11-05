import { useState, useEffect, useRef } from 'react';
import { subscribeToReviews, StoredReview, User, getSupabase, formatSupabaseUser } from './supabase';
import { SPA_INFO, SERVICES_DATA, PHOTOS_DATA } from './data/spaData';
import { Service, PriceOption, PhotoItem, BusinessInfo, ServiceArea } from './types';
import { subscribeToGoogleBusinessSync, SyncedGoogleData, getInitialGoogleBusinessSync } from './services/googleBusinessProfile';
import { fetchPublicServices, subscribeToPublicServices, getInitialServices } from './services/servicesService';
import { fetchPublicGallery, subscribeToPublicGallery, getInitialGallery } from './services/galleryService';
import { 
  fetchBusinessInfo, 
  subscribeToBusinessInfo, 
  fetchPublicServiceAreas, 
  injectLocalBusinessSchema, 
  DEFAULT_BUSINESS_INFO,
  getInitialBusinessInfo,
  getInitialServiceAreas
} from './services/localSeoService';
import { getCachedData, hasCachedData, CACHE_KEYS } from './services/cacheService';

import { Header } from './components/Header';
import { NavTabs, TabType } from './components/NavTabs';
import { ServicesSection } from './components/ServicesSection';
import { PhotosSection } from './components/PhotosSection';
import { ReviewsSection } from './components/ReviewsSection';
import { FaqSection } from './components/FaqSection';
import { LocationContactSection } from './components/LocationContactSection';
import { Footer } from './components/Footer';
import { ShareToast } from './components/ShareToast';
import { subscribeToHomepageContent, HomepageContent, DEFAULT_HOMEPAGE_CONTENT, getInitialHomepageContent } from './services/homepageService';
import { subscribeToAboutContent, AboutContent, DEFAULT_ABOUT_CONTENT, getInitialAboutContent } from './services/aboutService';

import { ServiceModal } from './components/modals/ServiceModal';
import { ReviewsModal } from './components/modals/ReviewsModal';
import { PhotosModal } from './components/modals/PhotosModal';
import { LocationModal } from './components/modals/LocationModal';
import { BookNowModal } from './components/modals/BookNowModal';
import { CallModal } from './components/modals/CallModal';
import { MenuDrawer } from './components/modals/MenuDrawer';

import { useLocationPath, navigate } from './router';
import { AdminLayout } from './components/admin/AdminLayout';
import { BlogListPage } from './components/blog/BlogListPage';
import { ArticleDetailPage } from './components/blog/ArticleDetailPage';
import { LocationDetailPage } from './components/locations/LocationDetailPage';
import { AboutPage } from './components/AboutPage';
import { updatePageSeo, SEO_CONFIG, buildCanonicalUrl } from './config/seoConfig';

export default function App() {
  const { match } = useLocationPath();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [communityReviews, setCommunityReviews] = useState<StoredReview[]>(() => getCachedData<StoredReview[]>(CACHE_KEYS.REVIEWS) || []);
  const [syncedGoogleData, setSyncedGoogleData] = useState<SyncedGoogleData | null>(() => getInitialGoogleBusinessSync());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>(() => getInitialServices());
  const [servicesLoading, setServicesLoading] = useState<boolean>(() => !hasCachedData(CACHE_KEYS.SERVICES));
  const [servicesError, setServicesError] = useState<boolean>(false);
  const [galleryImages, setGalleryImages] = useState<PhotoItem[]>(() => getInitialGallery());
  const [galleryLoading, setGalleryLoading] = useState<boolean>(() => !hasCachedData(CACHE_KEYS.GALLERY));
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(() => !hasCachedData(CACHE_KEYS.REVIEWS));
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(() => getInitialBusinessInfo());
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>(() => getInitialServiceAreas());
  const [homepageContent, setHomepageContent] = useState<HomepageContent>(() => getInitialHomepageContent());
  const [aboutContent, setAboutContent] = useState<AboutContent>(() => getInitialAboutContent());

  // Subscribe to real-time homepage and about CMS content from Supabase
  useEffect(() => {
    const unsubHome = subscribeToHomepageContent((data) => {
      setHomepageContent(data);
    });
    const unsubAbout = subscribeToAboutContent((data) => {
      setAboutContent(data);
    });
    return () => {
      unsubHome();
      unsubAbout();
    };
  }, []);

  // Multi-tab and immediate cache update listener
  useEffect(() => {
    const handleCacheUpdated = (e: Event) => {
      const custom = e as CustomEvent<{ key: string; data: any }>;
      if (!custom.detail) return;
      const { key, data } = custom.detail;
      switch (key) {
        case CACHE_KEYS.HOMEPAGE:
          setHomepageContent(data);
          break;
        case CACHE_KEYS.BUSINESS:
          setBusinessInfo(data);
          break;
        case CACHE_KEYS.SERVICES:
          setServices(data);
          setServicesLoading(false);
          break;
        case CACHE_KEYS.GALLERY:
          setGalleryImages(data);
          setGalleryLoading(false);
          break;
        case CACHE_KEYS.SERVICE_AREAS:
          setServiceAreas(data);
          break;
        case CACHE_KEYS.ABOUT:
          setAboutContent(data);
          break;
      }
    };

    window.addEventListener('eurospa_cache_updated', handleCacheUpdated);
    return () => window.removeEventListener('eurospa_cache_updated', handleCacheUpdated);
  }, []);

  // Real-time listener for public active services from Supabase
  useEffect(() => {
    const unsubServices = subscribeToPublicServices((items) => {
      if (items && items.length > 0) {
        setServices(items);
      } else {
        setServices(getInitialServices());
      }
      setServicesLoading(false);
      setServicesError(false);
    });
    return () => unsubServices();
  }, []);

  // Real-time listener for public active gallery photos from Supabase
  useEffect(() => {
    const unsubGallery = subscribeToPublicGallery((items) => {
      if (items && items.length > 0) {
        setGalleryImages(items);
      } else {
        setGalleryImages(getInitialGallery());
      }
      setGalleryLoading(false);
    });
    return () => unsubGallery();
  }, []);

 // Fetch live canonical business info and active service areas from Supabase
useEffect(() => {
  fetchPublicServiceAreas()
    .then(areas => {
      setServiceAreas(areas);
    })
    .catch(err => console.warn('Could not load service areas:', err));
}, []);

useEffect(() => {
  const unsubBiz = subscribeToBusinessInfo((info) => {
    setBusinessInfo(info);
  });

  return () => {
    unsubBiz();
  };
}, []);

useEffect(() => {
  if (businessInfo) {
    injectLocalBusinessSchema(businessInfo, serviceAreas);
  }
}, [businessInfo, serviceAreas]);

  // Centralized SEO restoration for all public routes
useEffect(() => {
  if (match.route === 'home') {
    updatePageSeo({
      title: SEO_CONFIG.defaultTitle,
      description: SEO_CONFIG.defaultMetaDescription,
      canonicalUrl: buildCanonicalUrl('/'),
      ogImage: SEO_CONFIG.defaultOgImage,
      ogType: 'website'
    });
  } else if (match.route === 'service-detail' && match.params.slug) {
    const slug = match.params.slug;
    const matchedSvc = services.find(s => s.slug === slug || s.id === slug);

    if (matchedSvc) {
      setSelectedService(matchedSvc);

      updatePageSeo({
        title:
          matchedSvc.seoTitle ||
          `${matchedSvc.name} in Banani, Dhaka | ${SEO_CONFIG.siteName}`,
        description:
          matchedSvc.metaDescription || matchedSvc.shortDescription,
        canonicalUrl: buildCanonicalUrl(`/services/${slug}`),
        ogImage:
          matchedSvc.ogImage ||
          matchedSvc.image ||
          SEO_CONFIG.defaultOgImage,
        ogType: 'product'
      });
    }
  } else if (match.route === 'location-detail' && match.params.slug) {
    const slug = match.params.slug;
    const matchedArea = serviceAreas.find(area => area.slug === slug);

    if (matchedArea) {
      updatePageSeo({
        title:
          matchedArea.seoTitle ||
          `${matchedArea.name} Spa & Massage | ${SEO_CONFIG.siteName}`,
        description:
          matchedArea.metaDescription || matchedArea.shortDescription,
        canonicalUrl: buildCanonicalUrl(`/locations/${slug}`),
        ogImage: SEO_CONFIG.defaultOgImage,
        ogType: 'website'
      });
    }
  }
}, [
  match.route,
  match.params.slug,
  services,
  serviceAreas
]);

  // Modals state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [reviewsWriteMode, setReviewsWriteMode] = useState(false);
  const [isPhotosModalOpen, setIsPhotosModalOpen] = useState(false);
  const [photosInitialIndex, setPhotosInitialIndex] = useState(0);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isBookNowModalOpen, setIsBookNowModalOpen] = useState(false);
  const [bookingPreselectedService, setBookingPreselectedService] = useState<Service | null>(null);
  const [bookingPreselectedOption, setBookingPreselectedOption] = useState<PriceOption | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);

  // Listen to Supabase Auth state
  useEffect(() => {
    const { data: { subscription } } = getSupabase().auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(formatSupabaseUser(session.user));
      } else {
        setCurrentUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Listen to live community reviews in Supabase
  useEffect(() => {
    const unsubReviews = subscribeToReviews((revs) => {
      setCommunityReviews(revs);
      setReviewsLoading(false);
    });
    return () => unsubReviews();
  }, []);

  // Subscribe to real-time Google Business Profile data (reviews, photos, rating, count)
  useEffect(() => {
    const unsubGbp = subscribeToGoogleBusinessSync((data) => {
      if (data) {
        setSyncedGoogleData(data);
        setReviewsLoading(false);
      }
    });
    return () => unsubGbp();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleWhatsAppAction = () => {
    // Send WhatsApp click event to Google Tag Manager
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'whatsapp_click'
    });

    const targetPhone = businessInfo?.whatsappNumber || SPA_INFO.whatsappNumber;
    const targetName = homepageContent?.heroTitle || businessInfo?.businessName || SPA_INFO.name;
    const text = encodeURIComponent(
      `Hello ${targetName}, I would like to inquire about spa therapies.`
    );

    window.open(
      `https://wa.me/${targetPhone}?text=${text}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleShare = async () => {
    const shareData = {
      title: `${SPA_INFO.name} - Banani, Dhaka`,
      text: `${SPA_INFO.name} offers premium massage and spa therapies in Banani, Dhaka. Open ${SPA_INFO.openingHours}.`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Fallback to copy
        copyUrl();
      }
    } else {
      copyUrl();
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Link copied to clipboard!');
  };

  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'overview') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'services') {
      const el = document.getElementById('section-services');
      el?.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'photos') {
      setIsPhotosModalOpen(true);
    } else if (tab === 'reviews') {
      setIsReviewsModalOpen(true);
    } else if (tab === 'location') {
      setIsLocationModalOpen(true);
    } else if (tab === 'blog') {
      navigate('/blog');
    }
  };

  // Route 1: Protected Admin Panel
  if (match.route === 'admin') {
    return <AdminLayout />;
  }

  // Route 2: Public Blog Articles Listing
  if (match.route === 'blog') {
    return (
      <>
        <BlogListPage
          onBookNowClick={() => {
            setBookingPreselectedService(null);
            setBookingPreselectedOption(null);
            setIsBookNowModalOpen(true);
          }}
          onWhatsAppClick={handleWhatsAppAction}
        />
        <BookNowModal
          isOpen={isBookNowModalOpen}
          onClose={() => setIsBookNowModalOpen(false)}
          currentUser={currentUser}
          onCallClick={() => {
            setIsBookNowModalOpen(false);
            setIsCallModalOpen(true);
          }}
          preselectedService={bookingPreselectedService}
          preselectedOption={bookingPreselectedOption}
          onBookingSuccess={() => showToast('Appointment booked successfully!')}
          availableServices={services}
        />
        <CallModal
          isOpen={isCallModalOpen}
          onClose={() => setIsCallModalOpen(false)}
          onWhatsAppClick={handleWhatsAppAction}
        />
        <ShareToast message={toastMessage} onClose={() => setToastMessage(null)} />
      </>
    );
  }

  // Route 3: Public Dynamic Article Detail Page (/blog/:slug)
  if (match.route === 'blog-detail' && match.params.slug) {
    return (
      <>
        <ArticleDetailPage
          slug={match.params.slug}
          onBookNowClick={() => {
            setBookingPreselectedService(null);
            setBookingPreselectedOption(null);
            setIsBookNowModalOpen(true);
          }}
          onWhatsAppClick={handleWhatsAppAction}
        />
        <BookNowModal
          isOpen={isBookNowModalOpen}
          onClose={() => setIsBookNowModalOpen(false)}
          currentUser={currentUser}
          onCallClick={() => {
            setIsBookNowModalOpen(false);
            setIsCallModalOpen(true);
          }}
          preselectedService={bookingPreselectedService}
          preselectedOption={bookingPreselectedOption}
          onBookingSuccess={() => showToast('Appointment booked successfully!')}
          availableServices={services}
        />
        <CallModal
          isOpen={isCallModalOpen}
          onClose={() => setIsCallModalOpen(false)}
          onWhatsAppClick={handleWhatsAppAction}
        />
        <ShareToast message={toastMessage} onClose={() => setToastMessage(null)} />
      </>
    );
  }

  // Route 4: Location Landing Page (/locations/:slug)
  if (match.route === 'location-detail' && match.params.slug) {
    return (
      <>
        <LocationDetailPage
          slug={match.params.slug}
          businessInfo={businessInfo}
          services={services}
          onOpenBookNow={(service) => {
            setBookingPreselectedService(service || null);
            setBookingPreselectedOption(null);
            setIsBookNowModalOpen(true);
          }}
          onOpenCallModal={() => setIsCallModalOpen(true)}
        />
        <Footer
          onWhatsAppClick={handleWhatsAppAction}
          businessInfo={businessInfo}
          serviceAreas={serviceAreas}
        />
        <BookNowModal
          isOpen={isBookNowModalOpen}
          onClose={() => setIsBookNowModalOpen(false)}
          currentUser={currentUser}
          onCallClick={() => {
            setIsBookNowModalOpen(false);
            setIsCallModalOpen(true);
          }}
          preselectedService={bookingPreselectedService}
          preselectedOption={bookingPreselectedOption}
          onBookingSuccess={() => showToast('Appointment booked successfully!')}
          availableServices={services}
        />
        <CallModal
          isOpen={isCallModalOpen}
          onClose={() => setIsCallModalOpen(false)}
          onWhatsAppClick={handleWhatsAppAction}
          businessInfo={businessInfo}
        />
        <ShareToast message={toastMessage} onClose={() => setToastMessage(null)} />
      </>
    );
  }

  // Route 5: Public Dedicated About Us Page (/about)
  if (match.route === 'about') {
    return (
      <>
        <AboutPage
          businessInfo={businessInfo}
          serviceAreas={serviceAreas}
          onBookNowClick={() => {
            setBookingPreselectedService(null);
            setBookingPreselectedOption(null);
            setIsBookNowModalOpen(true);
          }}
          onWhatsAppClick={handleWhatsAppAction}
          onCallClick={() => setIsCallModalOpen(true)}
        />
        <Footer
          onWhatsAppClick={handleWhatsAppAction}
          businessInfo={businessInfo}
          serviceAreas={serviceAreas}
        />
        <BookNowModal
          isOpen={isBookNowModalOpen}
          onClose={() => setIsBookNowModalOpen(false)}
          currentUser={currentUser}
          onCallClick={() => {
            setIsBookNowModalOpen(false);
            setIsCallModalOpen(true);
          }}
          preselectedService={bookingPreselectedService}
          preselectedOption={bookingPreselectedOption}
          onBookingSuccess={() => showToast('Appointment booked successfully!')}
          availableServices={services}
        />
        <CallModal
          isOpen={isCallModalOpen}
          onClose={() => setIsCallModalOpen(false)}
          onWhatsAppClick={handleWhatsAppAction}
          businessInfo={businessInfo}
        />
        <ShareToast message={toastMessage} onClose={() => setToastMessage(null)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Google Maps Profile Header */}
      <Header
        onDirectionsClick={() => setIsLocationModalOpen(true)}
        onBookNowClick={() => {
          setBookingPreselectedService(null);
          setBookingPreselectedOption(null);
          setIsBookNowModalOpen(true);
        }}
        onCallClick={() => setIsCallModalOpen(true)}
        onWhatsAppClick={handleWhatsAppAction}
        onReviewsClick={() => {
          setReviewsWriteMode(false);
          setIsReviewsModalOpen(true);
        }}
        onLocationClick={() => setIsLocationModalOpen(true)}
        onMenuClick={() => setIsMenuDrawerOpen(true)}
        onShareClick={handleShare}
        rating={syncedGoogleData?.rating}
        reviewsCount={syncedGoogleData?.reviewsCount}
        businessInfo={businessInfo}
        homepageContent={homepageContent}
      />

      {/* Navigation Tabs */}
      <NavTabs activeTab={activeTab} onSelectTab={handleSelectTab} />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* Signature Services */}
        <ServicesSection
          services={services}
          loading={servicesLoading}
          error={servicesError}
          onSelectService={(service) => setSelectedService(service)}
          onViewAllServices={() => {
            setBookingPreselectedService(null);
            setBookingPreselectedOption(null);
            setIsBookNowModalOpen(true);
          }}
        />

        {/* Photos Preview Section */}
        <PhotosSection
          syncedPhotos={syncedGoogleData?.photos}
          galleryImages={galleryImages}
          loading={galleryLoading}
          onOpenPhotosModal={(index = 0) => {
            setPhotosInitialIndex(index);
            setIsPhotosModalOpen(true);
          }}
        />

        {/* What Our Clients Say (Reviews) */}
        <ReviewsSection
          communityReviews={communityReviews}
          syncedReviews={syncedGoogleData?.reviews}
          loading={reviewsLoading}
          onOpenReviewsModal={() => {
            setReviewsWriteMode(false);
            setIsReviewsModalOpen(true);
          }}
          onWriteReviewClick={() => {
            setReviewsWriteMode(true);
            setIsReviewsModalOpen(true);
          }}
        />

        {/* Frequently Asked Questions */}
        <FaqSection
          onWhatsAppClick={handleWhatsAppAction}
          onCallClick={() => setIsCallModalOpen(true)}
        />

        {/* Our Location & Contact Us Section */}
        <LocationContactSection
          onDirectionsClick={() => setIsLocationModalOpen(true)}
          onBookAppointmentClick={() => {
            setBookingPreselectedService(null);
            setBookingPreselectedOption(null);
            setIsBookNowModalOpen(true);
          }}
          onCallClick={() => setIsCallModalOpen(true)}
          onWhatsAppClick={handleWhatsAppAction}
          businessInfo={businessInfo}
        />
      </main>

      {/* Footer */}
      <Footer
        onWhatsAppClick={handleWhatsAppAction}
        businessInfo={businessInfo}
        serviceAreas={serviceAreas}
      />

     

      {/* 1. Service Details Modal (Reference Image 2 matching) */}
      <ServiceModal
        service={selectedService}
        onClose={() => {
          setSelectedService(null);
          if (match.route === 'service-detail') {
            navigate('/', true);
          }
        }}
        onOpenBookingWithService={(svc, opt) => {
          setBookingPreselectedService(svc);
          setBookingPreselectedOption(opt);
          setIsBookNowModalOpen(true);
        }}
      />

      {/* 2. Reviews Modal with Scrolling & Load More for 20+ reviews */}
      <ReviewsModal
        isOpen={isReviewsModalOpen}
        onClose={() => setIsReviewsModalOpen(false)}
        currentUser={currentUser}
        communityReviews={communityReviews}
        syncedReviews={syncedGoogleData?.reviews}
        syncedRating={syncedGoogleData?.rating}
        syncedCount={syncedGoogleData?.reviewsCount}
        initialWriteMode={reviewsWriteMode}
      />

      {/* 3. Photos Gallery Modal */}
      <PhotosModal
        isOpen={isPhotosModalOpen}
        onClose={() => setIsPhotosModalOpen(false)}
        syncedPhotos={syncedGoogleData?.photos}
        galleryImages={galleryImages}
        initialIndex={photosInitialIndex}
      />

      {/* 4. Location Map & Directions Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onCallClick={() => setIsCallModalOpen(true)}
        businessInfo={businessInfo}
      />

      {/* 5. Book Appointment Modal */}
      <BookNowModal
        isOpen={isBookNowModalOpen}
        onClose={() => setIsBookNowModalOpen(false)}
        currentUser={currentUser}
        onCallClick={() => {
          setIsBookNowModalOpen(false);
          setIsCallModalOpen(true);
        }}
        preselectedService={bookingPreselectedService}
        preselectedOption={bookingPreselectedOption}
        onBookingSuccess={() => showToast('Appointment booked successfully!')}
        availableServices={services.length > 0 ? services : SERVICES_DATA}
      />

      {/* 6. Call Reception Modal */}
      <CallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        onWhatsAppClick={handleWhatsAppAction}
        businessInfo={businessInfo}
      />

      {/* 7. Slide Menu & Account Drawer */}
      <MenuDrawer
        isOpen={isMenuDrawerOpen}
        onClose={() => setIsMenuDrawerOpen(false)}
        currentUser={currentUser}
        onNavigateTab={handleSelectTab}
        onBookNowClick={() => {
          setBookingPreselectedService(null);
          setBookingPreselectedOption(null);
          setIsBookNowModalOpen(true);
        }}
        onWhatsAppClick={handleWhatsAppAction}
        onCallClick={() => setIsCallModalOpen(true)}
        businessInfo={businessInfo}
      />

      {/* Toast Notification */}
      <ShareToast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}

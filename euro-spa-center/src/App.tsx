import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, subscribeToReviews, StoredReview } from './firebase';
import { SPA_INFO } from './data/spaData';
import { Service, PriceOption } from './types';
import { subscribeToGoogleBusinessSync, SyncedGoogleData } from './services/googleBusinessProfile';

import { Header } from './components/Header';
import { NavTabs, TabType } from './components/NavTabs';
import { AboutSection } from './components/AboutSection';
import { ServicesSection } from './components/ServicesSection';
import { PhotosSection } from './components/PhotosSection';
import { ReviewsSection } from './components/ReviewsSection';
import { LocationContactSection } from './components/LocationContactSection';
import { Footer } from './components/Footer';
import { ShareToast } from './components/ShareToast';

import { ServiceModal } from './components/modals/ServiceModal';
import { ReviewsModal } from './components/modals/ReviewsModal';
import { PhotosModal } from './components/modals/PhotosModal';
import { LocationModal } from './components/modals/LocationModal';
import { BookNowModal } from './components/modals/BookNowModal';
import { CallModal } from './components/modals/CallModal';
import { MenuDrawer } from './components/modals/MenuDrawer';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseReviews, setFirebaseReviews] = useState<StoredReview[]>([]);
  const [syncedGoogleData, setSyncedGoogleData] = useState<SyncedGoogleData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Listen to live community reviews in Firestore
  useEffect(() => {
    const unsubReviews = subscribeToReviews((revs) => {
      setFirebaseReviews(revs);
    });
    return () => unsubReviews();
  }, []);

  // Subscribe to real-time Google Business Profile data (reviews, photos, rating, count)
  useEffect(() => {
    const unsubGbp = subscribeToGoogleBusinessSync((data) => {
      if (data) {
        setSyncedGoogleData(data);
      }
    });
    return () => unsubGbp();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleWhatsAppAction = () => {
  if (typeof (window as any).gtag_report_conversion === 'function') {
    (window as any).gtag_report_conversion();
  }

  const text = encodeURIComponent(
    `Hello ${SPA_INFO.name}, I would like to inquire about spa therapies.`
  );

  window.open(
    `https://wa.me/${SPA_INFO.whatsappNumber}?text=${text}`,
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
    }
  };

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
      />

      {/* Navigation Tabs */}
      <NavTabs activeTab={activeTab} onSelectTab={handleSelectTab} />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* About Section */}
        <AboutSection />

        {/* Signature Services */}
        <ServicesSection
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
          onOpenPhotosModal={(index = 0) => {
            setPhotosInitialIndex(index);
            setIsPhotosModalOpen(true);
          }}
        />

        {/* What Our Clients Say (Reviews) */}
        <ReviewsSection
          firebaseReviews={firebaseReviews}
          syncedReviews={syncedGoogleData?.reviews}
          onOpenReviewsModal={() => {
            setReviewsWriteMode(false);
            setIsReviewsModalOpen(true);
          }}
          onWriteReviewClick={() => {
            setReviewsWriteMode(true);
            setIsReviewsModalOpen(true);
          }}
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
        />
      </main>

      {/* Footer */}
      <Footer onWhatsAppClick={handleWhatsAppAction} />

      {/* Floating WhatsApp Quick Action Button for Mobile */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          id="btn-floating-whatsapp"
          onClick={handleWhatsAppAction}
          aria-label="Chat on WhatsApp"
          className="flex items-center gap-2 bg-[#25d366] hover:bg-[#20bd5a] text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
          <span className="hidden sm:inline text-xs font-bold">Chat on WhatsApp</span>
        </button>
      </div>

      {/* 1. Service Details Modal (Reference Image 2 matching) */}
      <ServiceModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
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
        firebaseReviews={firebaseReviews}
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
        initialIndex={photosInitialIndex}
      />

      {/* 4. Location Map & Directions Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onCallClick={() => setIsCallModalOpen(true)}
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
      />

      {/* 6. Call Reception Modal */}
      <CallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        onWhatsAppClick={handleWhatsAppAction}
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
      />

      {/* Toast Notification */}
      <ShareToast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}

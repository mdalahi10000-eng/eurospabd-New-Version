import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  Menu, 
  Bell, 
  ExternalLink, 
  Sparkles, 
  Home, 
  Info, 
  Image, 
  MessageSquareQuote, 
  HelpCircle, 
  CalendarDays, 
  BookOpen, 
  Search, 
  Mail, 
  Settings,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { auth, checkIsAdmin, logoutUser } from '../../firebase';
import { AdminLoginPage } from './AdminLoginPage';
import { AdminAccessDeniedPage } from './AdminAccessDeniedPage';
import { AdminSidebar, AdminSection } from './AdminSidebar';
import { AdminDashboardOverview } from './AdminDashboardOverview';
import { AdminComingSoonSection } from './AdminComingSoonSection';
import { AdminBlogSection } from './blog/AdminBlogSection';
import { AdminServicesSection } from './services/AdminServicesSection';
import { AdminGallerySection } from './gallery/AdminGallerySection';
import { AdminLocalSeoSection } from './localseo/AdminLocalSeoSection';
import { AdminAppointmentsSection } from './appointments/AdminAppointmentsSection';
import { AdminReviewsSection } from './reviews/AdminReviewsSection';
import { AdminSiteSettingsSection } from './settings/AdminSiteSettingsSection';
import { AdminHomepageSection } from './homepage/AdminHomepageSection';
import { AdminAboutSection } from './about/AdminAboutSection';
import { AdminFaqSection } from './faq/AdminFaqSection';
import { subscribeToAdminAppointments } from '../../services/appointmentsService';
import { navigate } from '../../router';
import { SPA_INFO } from '../../data/spaData';

const SECTION_METADATA: Record<AdminSection, { title: string; description: string; icon: any }> = {
  dashboard: { title: 'Dashboard', description: 'Overview and vital metrics', icon: Sparkles },
  homepage: { title: 'Homepage Content', description: 'Manage hero headline, banners, badges, and primary action buttons.', icon: Home },
  about: { title: 'About Section', description: 'Edit the spa story, core values, safety protocols, and certifications.', icon: Info },
  services: { title: 'Services & Pricing', description: 'Configure massage treatments, duration options, pricing, and benefits.', icon: Sparkles },
  gallery: { title: 'Gallery & Ambience', description: 'Manage photos, upload new suite imagery, and sync Google Business media.', icon: Image },
  testimonials: { title: 'Testimonials & Reviews', description: 'Moderate community reviews and view Google Business Profile ratings.', icon: MessageSquareQuote },
  faq: { title: 'Frequently Asked Questions', description: 'Update customer questions, booking guidelines, and policies.', icon: HelpCircle },
  appointments: { title: 'Appointments Management', description: 'Track, confirm, reschedule, or cancel client bookings with full filter support.', icon: CalendarDays },
  blog: { title: 'Blog & Articles CMS', description: 'Create and edit wellness guides, manage SEO slugs, tags, and authors.', icon: BookOpen },
  seo: { title: 'Local SEO & Business Information', description: 'Manage canonical NAP, operating hours, target service areas, and Schema.org structured data.', icon: Search },
  contact: { title: 'Contact & Location', description: 'Update Google Maps coordinates, phone numbers, WhatsApp, and operating hours.', icon: Mail },
  settings: { title: 'System Settings', description: 'Manage administrative roles, security rules, and Firebase configurations.', icon: Settings },
};

export function AdminLayout() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [currentSection, setCurrentSection] = useState<AdminSection>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [pendingBookingsCount, setPendingBookingsCount] = useState<number>(0);

  useEffect(() => {
    document.title = `Admin Console | ${SPA_INFO.name}`;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const adminCheck = await checkIsAdmin(user);
          setIsAdmin(adminCheck);
        } catch (e) {
          console.error('Error verifying admin authorization:', e);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(null);
      }
      setAuthChecking(false);
    });

    // Real-time pending bookings badge counter
    const unsubscribeAppts = subscribeToAdminAppointments((appts) => {
      const pending = appts.filter(a => a.status === 'pending').length;
      setPendingBookingsCount(pending);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeAppts();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      setIsAdmin(null);
      setCurrentSection('dashboard');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  // 1. Loading Authentication State
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium tracking-wide">Verifying Administrator Credentials...</p>
      </div>
    );
  }

  // 2. Not Authenticated -> Show Admin Login
  if (!currentUser) {
    return <AdminLoginPage onSuccess={() => setAuthChecking(false)} />;
  }

  // 3. Authenticated but Unauthorized -> Show Access Denied
  if (isAdmin === false) {
    return (
      <AdminAccessDeniedPage
        currentUser={currentUser}
        onLoggedOut={() => {
          setCurrentUser(null);
          setIsAdmin(null);
        }}
      />
    );
  }

  // 4. Authenticated & Authorized -> Render Full Admin Dashboard
  const currentMeta = SECTION_METADATA[currentSection];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      {/* Sidebar (Desktop Persistent & Mobile Drawer) */}
      <AdminSidebar
        currentSection={currentSection}
        onSelectSection={setCurrentSection}
        currentUser={currentUser}
        onLogout={handleLogout}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        appointmentsCount={pendingBookingsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200/90 h-16 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Open Sidebar Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  {currentMeta.title}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <ShieldCheck className="w-3 h-3" />
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                {currentMeta.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Open Public Site"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Public Site</span>
            </button>

            <button
              id="btn-admin-header-logout"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Log Out of Admin Console"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            {/* Profile Avatar */}
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'Admin'}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs border border-blue-200">
                {currentUser.displayName?.[0] || currentUser.email?.[0]?.toUpperCase() || 'A'}
              </div>
            )}
          </div>
        </header>

        {/* Section View Router */}
        <main className="flex-1 overflow-y-auto">
          {currentSection === 'dashboard' ? (
            <AdminDashboardOverview onNavigateSection={setCurrentSection} />
          ) : currentSection === 'homepage' ? (
            <AdminHomepageSection currentUser={currentUser} />
          ) : currentSection === 'about' ? (
            <AdminAboutSection currentUser={currentUser} />
          ) : currentSection === 'faq' ? (
            <AdminFaqSection currentUser={currentUser} />
          ) : currentSection === 'appointments' ? (
            <AdminAppointmentsSection currentUser={currentUser} />
          ) : currentSection === 'testimonials' ? (
            <AdminReviewsSection currentUser={currentUser} />
          ) : currentSection === 'contact' ? (
            <AdminSiteSettingsSection currentUser={currentUser} initialTab="contact" />
          ) : currentSection === 'settings' ? (
            <AdminSiteSettingsSection currentUser={currentUser} initialTab="general" />
          ) : currentSection === 'blog' ? (
            <AdminBlogSection currentUser={currentUser} />
          ) : currentSection === 'services' ? (
            <AdminServicesSection currentUser={currentUser} />
          ) : currentSection === 'gallery' ? (
            <AdminGallerySection currentUser={currentUser} />
          ) : currentSection === 'seo' ? (
            <AdminLocalSeoSection currentUser={currentUser} />
          ) : (
            <AdminComingSoonSection
              title={currentMeta.title}
              description={currentMeta.description}
              icon={currentMeta.icon}
              onBackToDashboard={() => setCurrentSection('dashboard')}
            />
          )}
        </main>
      </div>
    </div>
  );
}

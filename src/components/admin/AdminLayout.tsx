import { useState, useEffect } from 'react';
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
  LogOut,
  RotateCw,
  LogIn,
  AlertCircle
} from 'lucide-react';
import { 
  getSupabase, 
  checkIsAdmin, 
  logoutUser, 
  formatSupabaseUser, 
  AdminAuthUser 
} from '../../supabase';
import { recoverFirestoreNetwork } from '../../firebase';
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
  const [currentUser, setCurrentUser] = useState<AdminAuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [startupPhase, setStartupPhase] = useState<'checking' | 'slow' | 'timed_out'>('checking');
  const [startupNotice, setStartupNotice] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState<number>(0);
  const [currentSection, setCurrentSection] = useState<AdminSection>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [pendingBookingsCount, setPendingBookingsCount] = useState<number>(0);

  useEffect(() => {
    document.title = `Admin Console | ${SPA_INFO.name}`;
    let isCancelled = false;

    // Soft warning timer at 3.5s - session restoration taking longer than usual
    const slowTimer = setTimeout(() => {
      if (!isCancelled) {
        setStartupPhase('slow');
      }
    }, 3500);

    // Hard timeout at 7.5s - guarantees the admin application can NEVER be stuck indefinitely!
    const timeoutTimer = setTimeout(() => {
      if (!isCancelled) {
        console.warn('[AdminLayout] Auth verification exceeded 7.5s. Falling back to login screen.');
        setStartupPhase('timed_out');
        setStartupNotice('Session restoration took longer than expected after an idle period. You can sign in below or retry connection.');
        setAuthChecking(false);
      }
    }, 7500);

    const client = getSupabase();

    const verifyUser = async (user: any) => {
      if (isCancelled) return;
      if (!user) {
        setCurrentUser(null);
        setIsAdmin(null);
        setAuthChecking(false);
        clearTimeout(slowTimer);
        clearTimeout(timeoutTimer);
        return;
      }

      const formatted = formatSupabaseUser(user);
      setCurrentUser(formatted);

      try {
        const adminCheck = await checkIsAdmin(user);
        if (!isCancelled) {
          setIsAdmin(adminCheck);
          setAuthChecking(false);
          clearTimeout(slowTimer);
          clearTimeout(timeoutTimer);
        }
      } catch (e) {
        console.error('[AdminLayout] Error verifying admin authorization in Supabase:', e);
        if (!isCancelled) {
          setIsAdmin(false);
          setAuthChecking(false);
          clearTimeout(slowTimer);
          clearTimeout(timeoutTimer);
        }
      }
    };

    // 1. Immediate session check from Supabase local store
    client.auth.getSession().then(({ data: { session } }) => {
      if (!isCancelled && session?.user) {
        verifyUser(session.user);
      } else if (!isCancelled && !session) {
        setAuthChecking(false);
        clearTimeout(slowTimer);
        clearTimeout(timeoutTimer);
      }
    }).catch((err) => {
      console.warn('[AdminLayout] getSession error:', err);
      if (!isCancelled) {
        setAuthChecking(false);
        clearTimeout(slowTimer);
        clearTimeout(timeoutTimer);
      }
    });

    // 2. Subscribe to Supabase auth state change events (OAuth callback, refresh, signout)
    const { data: { subscription } } = client.auth.onAuthStateChange(async (_event, session) => {
      if (isCancelled) return;
      if (session?.user) {
        await verifyUser(session.user);
      } else {
        setCurrentUser(null);
        setIsAdmin(null);
        setAuthChecking(false);
        clearTimeout(slowTimer);
        clearTimeout(timeoutTimer);
      }
    });

    return () => {
      isCancelled = true;
      clearTimeout(slowTimer);
      clearTimeout(timeoutTimer);
      subscription.unsubscribe();
    };
  }, [retryTrigger]);

  // Real-time pending bookings badge counter - only active when user is verified admin
  useEffect(() => {
    if (!currentUser || isAdmin !== true) return;
    const unsubscribeAppts = subscribeToAdminAppointments((appts) => {
      const pending = appts.filter(a => a.status === 'pending').length;
      setPendingBookingsCount(pending);
    });
    return () => unsubscribeAppts();
  }, [currentUser, isAdmin]);

  const handleRetryConnection = () => {
    setAuthChecking(true);
    setStartupPhase('checking');
    setStartupNotice(null);
    recoverFirestoreNetwork().then(() => {
      setRetryTrigger(prev => prev + 1);
    });
  };

  const handleBypassToLogin = () => {
    setAuthChecking(false);
    setCurrentUser(null);
    setIsAdmin(null);
    setStartupNotice('You continued directly to the administrator login screen.');
  };

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

  // 1. Loading Authentication State with interactive timeout & recovery
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 p-4 font-sans">
        <div className="max-w-md w-full text-center space-y-6 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xs">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-12 h-12 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <ShieldCheck className="w-5 h-5 text-blue-400 absolute" />
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-semibold text-slate-100">
              {startupPhase === 'slow' ? 'Resuming Administration Portal...' : 'Verifying Administrator Credentials...'}
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              {startupPhase === 'slow'
                ? 'Session restoration is taking longer than usual (often occurs after an idle period). You can continue directly to sign in or retry.'
                : 'Please wait while your administrative session is securely verified...'}
            </p>
          </div>

          {startupPhase === 'slow' && (
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                id="btn-admin-bypass-to-login"
                type="button"
                onClick={handleBypassToLogin}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-900/30 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Continue to Login Screen</span>
              </button>

              <button
                id="btn-admin-retry-startup"
                type="button"
                onClick={handleRetryConnection}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Retry Connection</span>
              </button>
            </div>
          )}

          <div className="pt-2 text-[11px] text-slate-500 font-mono">
            {SPA_INFO.name} &bull; Protected Access
          </div>
        </div>
      </div>
    );
  }

  // 2. Not Authenticated -> Show Admin Login
  if (!currentUser) {
    return (
      <AdminLoginPage 
        onSuccess={() => setAuthChecking(false)} 
        startupNotice={startupNotice}
        onRetryConnection={handleRetryConnection}
      />
    );
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

import { User } from 'firebase/auth';
import { 
  LayoutDashboard, 
  Home, 
  Info, 
  Sparkles, 
  Image, 
  MessageSquareQuote, 
  HelpCircle, 
  CalendarDays, 
  BookOpen, 
  Search, 
  MapPin,
  Mail, 
  Settings, 
  LogOut, 
  ExternalLink,
  X
} from 'lucide-react';
import { SPA_INFO } from '../../data/spaData';
import { navigate } from '../../router';
import euroSpaLogo from '../../assets/Untitled design (4).jpg';

export type AdminSection = 
  | 'dashboard'
  | 'homepage'
  | 'about'
  | 'services'
  | 'gallery'
  | 'testimonials'
  | 'faq'
  | 'appointments'
  | 'blog'
  | 'seo'
  | 'contact'
  | 'settings';

interface AdminSidebarProps {
  currentSection: AdminSection;
  onSelectSection: (section: AdminSection) => void;
  currentUser: User | null;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  appointmentsCount?: number;
}

export function AdminSidebar({
  currentSection,
  onSelectSection,
  currentUser,
  onLogout,
  isOpenMobile,
  onCloseMobile,
  appointmentsCount = 0
}: AdminSidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'homepage', label: 'Homepage', icon: Home, badge: null },
    { id: 'about', label: 'About', icon: Info, badge: null },
    { id: 'services', label: 'Services', icon: Sparkles, badge: null },
    { id: 'gallery', label: 'Gallery', icon: Image, badge: null },
    { id: 'testimonials', label: 'Testimonials', icon: MessageSquareQuote, badge: null },
    { id: 'faq', label: 'FAQ', icon: HelpCircle, badge: null },
    { 
      id: 'appointments', 
      label: 'Appointments', 
      icon: CalendarDays, 
      badge: appointmentsCount > 0 ? appointmentsCount.toString() : null 
    },
    { id: 'blog', label: 'Blog / Articles', icon: BookOpen, badge: null },
    { id: 'seo', label: 'Local SEO', icon: MapPin, badge: 'NAP' },
    { id: 'contact', label: 'Contact', icon: Mail, badge: null },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null },
  ] as const;

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between bg-slate-900 text-slate-200 w-64 border-r border-slate-800">
      {/* Top Header Branding */}
      <div>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center overflow-hidden shrink-0">
              <img
                src={euroSpaLogo}
                alt="Euro Spa Center"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="overflow-hidden">
              <h2 className="font-bold text-sm text-white tracking-wide truncate">
                {SPA_INFO.name}
              </h2>
              <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">
                CMS Management
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
          <span className="block px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Navigation
          </span>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectSection(item.id as AdminSection);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white text-blue-600' : 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Profile & Actions */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
        {/* Quick link to live public site */}
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Public Website</span>
          </span>
          <span className="text-[10px] text-slate-500">Open</span>
        </button>

        {/* User Card */}
        {currentUser && (
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Admin'}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-slate-600 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-900 text-blue-200 font-bold flex items-center justify-center text-xs shrink-0">
                  {currentUser.displayName?.[0] || 'A'}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {currentUser.displayName || 'Administrator'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {currentUser.email}
                </p>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block h-screen sticky top-0 shrink-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-64 h-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

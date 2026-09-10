import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CalendarDays, 
  Star, 
  BookOpen, 
  Image as ImageIcon, 
  ArrowUpRight, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Database,
  ExternalLink,
  PlusCircle,
  MapPin,
  Settings,
  MessageSquareQuote,
  ShieldCheck,
  AlertCircle,
  Home,
  Info,
  HelpCircle
} from 'lucide-react';
import { AdminStats, fetchAdminStats } from '../../services/articlesService';
import { SPA_INFO } from '../../data/spaData';
import { navigate } from '../../router';

interface AdminDashboardOverviewProps {
  onNavigateSection: (section: any) => void;
}

export function AdminDashboardOverview({ onNavigateSection }: AdminDashboardOverviewProps) {
  const [stats, setStats] = useState<AdminStats>({
    totalServices: 6,
    totalAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    totalReviews: 0,
    approvedReviews: 0,
    averageRating: 4.9,
    publishedArticles: 3,
    totalArticles: 3,
    galleryImages: 10,
    recentAppointments: [],
    recentReviews: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    setRefreshing(true);
    try {
      const data = await fetchAdminStats();
      setStats(data);
    } catch (e) {
      console.warn('Error loading admin stats:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const metricCards = [
    {
      label: 'Pending Bookings',
      value: stats.pendingAppointments,
      badge: stats.pendingAppointments > 0 ? 'Requires Action' : 'All Clear',
      badgeColor: stats.pendingAppointments > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
      description: `${stats.totalAppointments} total reservations recorded`,
      icon: CalendarDays,
      color: stats.pendingAppointments > 0 ? 'text-amber-600' : 'text-emerald-600',
      bgColor: stats.pendingAppointments > 0 ? 'bg-amber-50/80 border-amber-200' : 'bg-emerald-50/80 border-emerald-200',
      action: () => onNavigateSection('appointments')
    },
    {
      label: 'Published Articles',
      value: stats.publishedArticles,
      badge: `${stats.totalArticles} in CMS`,
      badgeColor: 'bg-purple-100 text-purple-800',
      description: 'Wellness guides & SEO blog articles',
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50/80 border-purple-200',
      action: () => onNavigateSection('blog')
    },
    {
      label: 'Client Reviews',
      value: `${stats.averageRating} ★`,
      badge: `${stats.approvedReviews} published`,
      badgeColor: 'bg-amber-100 text-amber-800',
      description: `${stats.totalReviews} total customer reviews`,
      icon: Star,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50/80 border-amber-200',
      action: () => onNavigateSection('testimonials')
    },
    {
      label: 'Spa Treatments',
      value: stats.totalServices,
      badge: 'Catalog Active',
      badgeColor: 'bg-blue-100 text-blue-800',
      description: 'Massage therapies & couple packages',
      icon: Sparkles,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50/80 border-blue-200',
      action: () => onNavigateSection('services')
    },
    {
      label: 'Global Settings',
      value: 'Live NAP',
      badge: 'Connected',
      badgeColor: 'bg-indigo-100 text-indigo-800',
      description: 'Phone, WhatsApp, address & hours',
      icon: Settings,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50/80 border-indigo-200',
      action: () => onNavigateSection('settings')
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner with Welcome & Sync State */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Euro Spa Center CMS
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Connected
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Welcome to the centralized management dashboard for {SPA_INFO.fullAddress}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadStats}
            disabled={refreshing}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Stats'}</span>
          </button>

          <button
            onClick={() => navigate('/')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Preview Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Real Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              onClick={card.action}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${card.bgColor}`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  {card.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  )}
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {loading ? '—' : card.value}
                </div>
                <div className="text-xs font-bold text-slate-700 mt-1">
                  {card.label}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                {card.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Split: System Status & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supabase Connected Environment Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Database & Security</h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Active
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500">Appointments Sync</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Live Listeners
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500">Reviews Moderation</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Moderation & Replies
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500">Site Settings</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                NAP & Hours Connected
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500">Supabase Storage</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ready for CMS Media
              </span>
            </div>
          </div>
        </div>

        {/* Quick Management Shortcuts */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Quick Actions & Shortcuts</h3>
            <span className="text-xs text-slate-400">Core Tools</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => onNavigateSection('appointments')}
              className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-blue-600" />
                  Manage Appointments
                </span>
                {stats.pendingAppointments > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    {stats.pendingAppointments} Pending
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Filter bookings, confirm status, and contact clients directly via WhatsApp.
              </p>
            </button>

            <button
              onClick={() => onNavigateSection('testimonials')}
              className="p-4 rounded-2xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 group-hover:text-amber-600 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-600" />
                  Moderate Reviews
                </span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  ★ {stats.averageRating}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Approve or hide client testimonials and publish official responses.
              </p>
            </button>

            <button
              onClick={() => onNavigateSection('homepage')}
              className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 flex items-center gap-1.5">
                  <Home className="w-4 h-4 text-emerald-600" />
                  Homepage CMS
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">Hero & Badges</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Edit hero headline, banner images, logo, and circular CTA action buttons.
              </p>
            </button>

            <button
              onClick={() => onNavigateSection('about')}
              className="p-4 rounded-2xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/40 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 group-hover:text-teal-600 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-teal-600" />
                  About Section CMS
                </span>
                <span className="text-[10px] text-teal-600 font-semibold">Brand Story</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Edit narrative text, key pillars, hygiene standards, and satisfaction credentials.
              </p>
            </button>

            <button
              onClick={() => onNavigateSection('faq')}
              className="p-4 rounded-2xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 group-hover:text-sky-600 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-sky-600" />
                  FAQ Management
                </span>
                <span className="text-[10px] text-sky-600 font-semibold">Live Q&A</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Add, edit, reorder, and toggle frequently asked questions and guest policies.
              </p>
            </button>

            <button
              onClick={() => onNavigateSection('settings')}
              className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-indigo-600" />
                  Contact & Business Info
                </span>
                <span className="text-[10px] text-indigo-600 font-semibold">NAP & Hours</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Update phone, WhatsApp, Banani address, opening hours, and social media.
              </p>
            </button>

            <button
              onClick={() => onNavigateSection('blog')}
              className="p-4 rounded-2xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 group-hover:text-purple-600 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  Blog & Articles
                </span>
                <span className="text-[10px] text-purple-600 font-semibold">{stats.publishedArticles} Published</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Publish wellness guides, optimize SEO titles, and write articles.
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Bottom: Recent Appointments & Recent Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments List */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                Recent Spa Bookings
              </h3>
              <p className="text-xs text-slate-500">Latest reservations received from visitors</p>
            </div>
            <button
              onClick={() => onNavigateSection('appointments')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
            >
              View All ({stats.totalAppointments})
            </button>
          </div>

          <div className="p-5">
            {stats.recentAppointments.length === 0 ? (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <CalendarDays className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-medium text-slate-600">No appointment records yet</p>
                <p className="text-[11px] text-slate-400">
                  When users schedule a treatment online, it appears here in real time.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">{appt.userName || 'Guest'}</div>
                      <div className="text-[11px] text-blue-700 font-semibold mt-0.5">
                        {appt.serviceName || 'Signature Spa Therapy'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                        <span>{appt.preferredDate}</span>
                        {appt.preferredTime && <span>• {appt.preferredTime}</span>}
                        {appt.phone && <span>• {appt.phone}</span>}
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                        appt.status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : appt.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : appt.status === 'completed'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {appt.status || 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Reviews Moderation */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                Latest Client Reviews
              </h3>
              <p className="text-xs text-slate-500">Moderation queue & feedback</p>
            </div>
            <button
              onClick={() => onNavigateSection('testimonials')}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors cursor-pointer"
            >
              Moderate All ({stats.totalReviews})
            </button>
          </div>

          <div className="p-5">
            {stats.recentReviews.length === 0 ? (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <MessageSquareQuote className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-medium text-slate-600">No client reviews yet</p>
                <p className="text-[11px] text-slate-400">
                  Reviews submitted via the "Write a Review" modal will show up here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{rev.userName}</span>
                        <div className="flex text-amber-400">
                          {[...Array(Math.round(rev.rating || 5))].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rev.status === 'hidden'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {rev.status === 'hidden' ? 'Hidden' : 'Approved'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 italic">
                      "{rev.comment}"
                    </p>

                    {rev.adminResponse && (
                      <div className="text-[10px] text-blue-700 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Admin Replied
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

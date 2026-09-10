import { useState, useEffect, FormEvent } from 'react';
import { User } from '../../../supabase';
import { 
  Home, 
  Save, 
  CheckCircle2, 
  RefreshCw, 
  Image as ImageIcon, 
  Sparkles, 
  Navigation, 
  Calendar, 
  Phone, 
  MessageSquare, 
  Eye, 
  EyeOff, 
  Megaphone, 
  RotateCcw,
  ExternalLink,
  Tag,
  MapPin,
  Clock
} from 'lucide-react';
import { 
  fetchHomepageContent, 
  updateHomepageContent, 
  HomepageContent, 
  DEFAULT_HOMEPAGE_CONTENT 
} from '../../../services/homepageService';

interface AdminHomepageSectionProps {
  currentUser: User | null;
}

export function AdminHomepageSection({ currentUser }: AdminHomepageSectionProps) {
  const [content, setContent] = useState<HomepageContent>(DEFAULT_HOMEPAGE_CONTENT);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [previewTab, setPreviewTab] = useState<'editor' | 'preview'>('editor');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchHomepageContent();
      setContent(data);
    } catch (err) {
      console.warn('Error loading homepage content:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await updateHomepageContent(content, currentUser?.email || 'admin');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error saving homepage content:', err);
      alert(err?.message || 'Failed to save homepage content to Supabase. Please check permissions.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset all homepage content back to default Euro Spa Center brand settings?')) {
      setContent(DEFAULT_HOMEPAGE_CONTENT);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading Homepage configuration from Supabase...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {savedSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Homepage content updated and live on website!</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Homepage Content & Hero CMS
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Customize hero headline, banner images, badges, promotional alerts, and action buttons.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
            title="Reset to brand default"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-100 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save & Publish</span>
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Hero Banner & Visual Identity */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ImageIcon className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Hero Banner & Visual Media</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hero Banner Image URL *
                </label>
                <input
                  type="url"
                  required
                  value={content.heroBannerImage}
                  onChange={(e) => setContent(prev => ({ ...prev, heroBannerImage: e.target.value }))}
                  placeholder="https://..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  High-resolution photo displayed across the top of the homepage.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Banner Image Alt Text (SEO)
                </label>
                <input
                  type="text"
                  value={content.heroBannerAlt}
                  onChange={(e) => setContent(prev => ({ ...prev, heroBannerAlt: e.target.value }))}
                  placeholder="e.g. Euro Spa Center Ambience & Massage Room"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Custom Logo URL (Optional)
                </label>
                <input
                  type="url"
                  value={content.logoImage || ''}
                  onChange={(e) => setContent(prev => ({ ...prev, logoImage: e.target.value }))}
                  placeholder="Leave empty to use Euro Spa Center standard logo"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Live Banner Preview Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Live Banner Preview
              </span>
              <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-200 border border-slate-300">
                <img
                  src={content.heroBannerImage}
                  alt={content.heroBannerAlt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_HOMEPAGE_CONTENT.heroBannerImage;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end p-3">
                  <div className="text-white text-xs">
                    <span className="font-bold block text-sm">{content.heroTitle || 'Euro Spa Center'}</span>
                    <span className="text-white/80 text-[11px]">{content.heroTagline}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Hero Headlines & Badges */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Tag className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Hero Headings & Identity Badges</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Main Brand Title *
              </label>
              <input
                type="text"
                required
                value={content.heroTitle}
                onChange={(e) => setContent(prev => ({ ...prev, heroTitle: e.target.value }))}
                placeholder="Euro Spa Center"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Brand Tagline
              </label>
              <input
                type="text"
                value={content.heroTagline}
                onChange={(e) => setContent(prev => ({ ...prev, heroTagline: e.target.value }))}
                placeholder="Relax • Refresh • Rejuvenate"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category Badge
              </label>
              <input
                type="text"
                value={content.categoryBadge}
                onChange={(e) => setContent(prev => ({ ...prev, categoryBadge: e.target.value }))}
                placeholder="Spa and Wellness Center"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Location Badge
              </label>
              <input
                type="text"
                value={content.locationBadge}
                onChange={(e) => setContent(prev => ({ ...prev, locationBadge: e.target.value }))}
                placeholder="Banani, Dhaka"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Operating Hours Status Badge
              </label>
              <input
                type="text"
                value={content.statusBadge}
                onChange={(e) => setContent(prev => ({ ...prev, statusBadge: e.target.value }))}
                placeholder="Open · 10:00 AM – 10:00 PM Daily"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Star Rating Override
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={content.ratingOverride ?? 4.9}
                  onChange={(e) => setContent(prev => ({ ...prev, ratingOverride: parseFloat(e.target.value) || 4.9 }))}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Total Reviews Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={content.reviewsCountOverride ?? 21}
                  onChange={(e) => setContent(prev => ({ ...prev, reviewsCountOverride: parseInt(e.target.value) || 0 }))}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Promotional Alert / Announcement Banner */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Top Announcement Banner</h3>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={content.announcementBanner?.enabled ?? false}
                onChange={(e) => setContent(prev => ({
                  ...prev,
                  announcementBanner: {
                    enabled: e.target.checked,
                    text: prev.announcementBanner?.text || 'Special Welcome Offer: Enjoy signature massage packages with certified therapists.',
                    linkText: prev.announcementBanner?.linkText || 'Book Now'
                  }
                }))}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-2 text-xs font-semibold text-slate-700">
                {content.announcementBanner?.enabled ? 'Active' : 'Disabled'}
              </span>
            </label>
          </div>

          {content.announcementBanner?.enabled && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Announcement Message
                </label>
                <input
                  type="text"
                  value={content.announcementBanner.text}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    announcementBanner: {
                      ...prev.announcementBanner!,
                      text: e.target.value
                    }
                  }))}
                  placeholder="e.g. Special Discount: 20% off on Swedish Massage this month!"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  CTA Button Label
                </label>
                <input
                  type="text"
                  value={content.announcementBanner.linkText || 'Book Now'}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    announcementBanner: {
                      ...prev.announcementBanner!,
                      linkText: e.target.value
                    }
                  }))}
                  placeholder="Book Now"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* 4. Action Buttons Configuration */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Hero CTA Action Buttons</h3>
          </div>

          <p className="text-xs text-slate-500">
            Configure labels and toggle visibility for the four circular action buttons beneath the hero banner:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {/* Directions Button */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Navigation className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Directions</span>
                </div>
                <input
                  type="checkbox"
                  checked={content.ctaButtons.directions.enabled}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    ctaButtons: {
                      ...prev.ctaButtons,
                      directions: { ...prev.ctaButtons.directions, enabled: e.target.checked }
                    }
                  }))}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Button Label
                </label>
                <input
                  type="text"
                  value={content.ctaButtons.directions.label}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    ctaButtons: {
                      ...prev.ctaButtons,
                      directions: { ...prev.ctaButtons.directions, label: e.target.value }
                    }
                  }))}
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Book Now Button */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Book Now</span>
                </div>
                <input
                  type="checkbox"
                  checked={content.ctaButtons.bookNow.enabled}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    ctaButtons: {
                      ...prev.ctaButtons,
                      bookNow: { ...prev.ctaButtons.bookNow, enabled: e.target.checked }
                    }
                  }))}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Button Label
                </label>
                <input
                  type="text"
                  value={content.ctaButtons.bookNow.label}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    ctaButtons: {
                      ...prev.ctaButtons,
                      bookNow: { ...prev.ctaButtons.bookNow, label: e.target.value }
                    }
                  }))}
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Call Button */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Phone className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Call Reception</span>
                </div>
                <input
                  type="checkbox"
                  checked={content.ctaButtons.call.enabled}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    ctaButtons: {
                      ...prev.ctaButtons,
                      call: { ...prev.ctaButtons.call, enabled: e.target.checked }
                    }
                  }))}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Button Label
                </label>
                <input
                  type="text"
                  value={content.ctaButtons.call.label}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    ctaButtons: {
                      ...prev.ctaButtons,
                      call: { ...prev.ctaButtons.call, label: e.target.value }
                    }
                  }))}
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* WhatsApp Button */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">WhatsApp</span>
                </div>
                <input
                  type="checkbox"
                  checked={content.ctaButtons.whatsapp.enabled}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    ctaButtons: {
                      ...prev.ctaButtons,
                      whatsapp: { ...prev.ctaButtons.whatsapp, enabled: e.target.checked }
                    }
                  }))}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Button Label
                </label>
                <input
                  type="text"
                  value={content.ctaButtons.whatsapp.label}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    ctaButtons: {
                      ...prev.ctaButtons,
                      whatsapp: { ...prev.ctaButtons.whatsapp, label: e.target.value }
                    }
                  }))}
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 5. Floating WhatsApp Button */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Floating WhatsApp Action Button</h3>
              <p className="text-xs text-slate-500">Persistent floating button in bottom-right corner of the website.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={content.floatingWhatsapp.enabled}
                onChange={(e) => setContent(prev => ({
                  ...prev,
                  floatingWhatsapp: {
                    ...prev.floatingWhatsapp,
                    enabled: e.target.checked
                  }
                }))}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-2 text-xs font-semibold text-slate-700">
                {content.floatingWhatsapp.enabled ? 'Visible' : 'Hidden'}
              </span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Floating Button Tooltip / Label
            </label>
            <input
              type="text"
              value={content.floatingWhatsapp.tooltipText}
              onChange={(e) => setContent(prev => ({
                ...prev,
                floatingWhatsapp: {
                  ...prev.floatingWhatsapp,
                  tooltipText: e.target.value
                }
              }))}
              placeholder="Chat on WhatsApp"
              className="w-full sm:w-1/2 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-100 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving to Supabase...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Publish All Changes Live</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

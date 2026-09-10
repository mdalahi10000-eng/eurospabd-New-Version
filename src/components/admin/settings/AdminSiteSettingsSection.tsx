import { useState, useEffect, FormEvent } from 'react';
import { User } from '../../../supabase';
import { 
  Settings, 
  Phone, 
  MessageCircle, 
  Mail, 
  MapPin, 
  Clock, 
  Share2, 
  Save, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink,
  ShieldCheck,
  Building,
  DollarSign,
  Lock
} from 'lucide-react';
import { 
  fetchBusinessInfo, 
  updateBusinessInfo, 
  DEFAULT_BUSINESS_INFO, 
  DEFAULT_REGULAR_HOURS 
} from '../../../services/localSeoService';
import { BusinessInfo, RegularHours, DayOfWeek } from '../../../types';

interface AdminSiteSettingsSectionProps {
  currentUser: User | null;
  initialTab?: 'contact' | 'address' | 'hours' | 'socials' | 'general' | 'auth';
}

const DAYS: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

const DAY_NAMES: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

export function AdminSiteSettingsSection({ currentUser, initialTab = 'contact' }: AdminSiteSettingsSectionProps) {
  const [info, setInfo] = useState<BusinessInfo>(DEFAULT_BUSINESS_INFO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'contact' | 'address' | 'hours' | 'socials' | 'general' | 'auth'>(initialTab);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await fetchBusinessInfo();
      setInfo(data);
    } catch (err) {
      console.warn('Could not load site settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await updateBusinessInfo({
        ...info,
        updatedBy: currentUser?.email || 'admin'
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Error updating site settings:', err);
      alert('Failed to save settings to Firestore. Please verify admin permissions.');
    } finally {
      setSaving(false);
    }
  };

  const handleHourChange = (day: DayOfWeek, field: 'open' | 'opens' | 'closes', value: any) => {
    setInfo(prev => {
      const currentHours = prev.regularHours || DEFAULT_REGULAR_HOURS;
      return {
        ...prev,
        regularHours: {
          ...currentHours,
          [day]: {
            ...currentHours[day],
            [field]: value
          }
        }
      };
    });
  };

  const handleSocialChange = (network: string, val: string) => {
    setInfo(prev => ({
      ...prev,
      socialProfiles: {
        ...prev.socialProfiles,
        [network]: val
      }
    }));
  };

  if (loading) {
    return (
      <div className="p-12 text-center max-w-5xl mx-auto space-y-3">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading centralized site settings from Firestore...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Toast Feedback */}
      {savedSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-700 flex items-center gap-2 text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Global site settings saved and published successfully!</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Global Site Settings & Business Identity
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Live Connected
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Edit phone numbers, WhatsApp, physical address, opening hours, and social media handles.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={loadSettings}
            disabled={saving}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Reload from Firestore"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('contact')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'contact'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Phone & WhatsApp</span>
        </button>

        <button
          onClick={() => setActiveTab('address')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'address'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Location & Address</span>
        </button>

        <button
          onClick={() => setActiveTab('hours')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'hours'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Opening Hours</span>
        </button>

        <button
          onClick={() => setActiveTab('socials')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'socials'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Social Media</span>
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'general'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Brand & Pricing</span>
        </button>

        <button
          onClick={() => setActiveTab('auth')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'auth'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Admin Security</span>
        </button>
      </div>

      {/* Tab Panels */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Tab 1: Phone & WhatsApp */}
        {activeTab === 'contact' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600" />
                Contact Phone & Messaging Configuration
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                These numbers power the click-to-call buttons, floating WhatsApp widget, and header triggers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Phone (International E.164)
                </label>
                <input
                  type="text"
                  value={info.phone}
                  onChange={(e) => setInfo({ ...info, phone: e.target.value })}
                  placeholder="+880 1842-658423"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <p className="text-[11px] text-slate-400 mt-1">Used for `tel:` links</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Display Phone (Customer-Facing)
                </label>
                <input
                  type="text"
                  value={info.displayPhone}
                  onChange={(e) => setInfo({ ...info, displayPhone: e.target.value })}
                  placeholder="01842-658423"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <p className="text-[11px] text-slate-400 mt-1">Rendered on UI buttons & banners</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp Number (Digits Only with Country Code)
                </label>
                <input
                  type="text"
                  value={info.whatsappNumber}
                  onChange={(e) => setInfo({ ...info, whatsappNumber: e.target.value })}
                  placeholder="8801842658423"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <p className="text-[11px] text-slate-400 mt-1">Used for `https://wa.me/` direct chat</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp Display Formatted
                </label>
                <input
                  type="text"
                  value={info.whatsappFormatted}
                  onChange={(e) => setInfo({ ...info, whatsappFormatted: e.target.value })}
                  placeholder="+880 1842-658423"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <p className="text-[11px] text-slate-400 mt-1">Displayed in contact details</p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Email Address
                </label>
                <input
                  type="email"
                  value={info.email}
                  onChange={(e) => setInfo({ ...info, email: e.target.value })}
                  placeholder="info@eurospacenter.com"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Location & Address */}
        {activeTab === 'address' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-600" />
                Physical Address & Google Maps Navigation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Canonical NAP (Name, Address, Phone) synced with Google Business Profile and Schema markup.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Formatted Address
                </label>
                <input
                  type="text"
                  value={info.fullAddress}
                  onChange={(e) => setInfo({ ...info, fullAddress: e.target.value })}
                  placeholder="73 Road No. 6, Banani, Dhaka 1213, Bangladesh"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Street Address / Road
                  </label>
                  <input
                    type="text"
                    value={info.addressLine}
                    onChange={(e) => setInfo({ ...info, addressLine: e.target.value })}
                    placeholder="73 Road No. 6"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Locality / Area
                  </label>
                  <input
                    type="text"
                    value={info.area}
                    onChange={(e) => setInfo({ ...info, area: e.target.value })}
                    placeholder="Banani"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={info.city}
                    onChange={(e) => setInfo({ ...info, city: e.target.value })}
                    placeholder="Dhaka"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={info.postalCode}
                    onChange={(e) => setInfo({ ...info, postalCode: e.target.value })}
                    placeholder="1213"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Google Maps Place URL
                </label>
                <input
                  type="url"
                  value={info.googleMapsUrl}
                  onChange={(e) => setInfo({ ...info, googleMapsUrl: e.target.value })}
                  placeholder="https://www.google.com/maps/place/Euro+Spa+Center/..."
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={info.latitude}
                    onChange={(e) => setInfo({ ...info, latitude: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={info.longitude}
                    onChange={(e) => setInfo({ ...info, longitude: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Opening Hours */}
        {activeTab === 'hours' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                Regular Operating Hours Schedule
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Set opening and closing times per day. Displayed on homepage, contact section, and Schema markup.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Summary Display Status
                </label>
                <input
                  type="text"
                  value={info.displayStatus}
                  onChange={(e) => setInfo({ ...info, displayStatus: e.target.value })}
                  placeholder="Open 10:00 AM – 10:00 PM"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Schedule Display String
                </label>
                <input
                  type="text"
                  value={info.displayHours}
                  onChange={(e) => setInfo({ ...info, displayHours: e.target.value })}
                  placeholder="10:00 AM – 10:00 PM Daily"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              {DAYS.map((day) => {
                const dayHour = info.regularHours?.[day] || { open: true, opens: '10:00', closes: '22:00' };

                return (
                  <div
                    key={day}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 gap-3"
                  >
                    <div className="flex items-center gap-3 w-32">
                      <input
                        type="checkbox"
                        id={`check-${day}`}
                        checked={dayHour.open}
                        onChange={(e) => handleHourChange(day, 'open', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor={`check-${day}`} className="text-xs font-bold text-slate-900 cursor-pointer">
                        {DAY_NAMES[day]}
                      </label>
                    </div>

                    {dayHour.open ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-medium">Opens:</span>
                        <input
                          type="time"
                          value={dayHour.opens}
                          onChange={(e) => handleHourChange(day, 'opens', e.target.value)}
                          className="text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-slate-400 text-xs">to</span>
                        <span className="text-[11px] text-slate-500 font-medium">Closes:</span>
                        <input
                          type="time"
                          value={dayHour.closes}
                          onChange={(e) => handleHourChange(day, 'closes', e.target.value)}
                          className="text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-lg border border-rose-200">
                        Closed
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Social Media */}
        {activeTab === 'socials' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-purple-600" />
                Social Media Profiles & External Links
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official handles for Euro Spa Center social platforms. Synced with footer icons and Schema `sameAs`.
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Facebook Page URL
                </label>
                <input
                  type="url"
                  value={info.socialProfiles?.facebook || ''}
                  onChange={(e) => handleSocialChange('facebook', e.target.value)}
                  placeholder="https://www.facebook.com/..."
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instagram Profile URL
                </label>
                <input
                  type="url"
                  value={info.socialProfiles?.instagram || ''}
                  onChange={(e) => handleSocialChange('instagram', e.target.value)}
                  placeholder="https://www.instagram.com/euro.spa.center/"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  YouTube Channel URL (Optional)
                </label>
                <input
                  type="url"
                  value={info.socialProfiles?.youtube || ''}
                  onChange={(e) => handleSocialChange('youtube', e.target.value)}
                  placeholder="https://www.youtube.com/..."
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  TikTok Profile URL (Optional)
                </label>
                <input
                  type="url"
                  value={info.socialProfiles?.tiktok || ''}
                  onChange={(e) => handleSocialChange('tiktok', e.target.value)}
                  placeholder="https://www.tiktok.com/@..."
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  LinkedIn Profile URL (Optional)
                </label>
                <input
                  type="url"
                  value={info.socialProfiles?.linkedin || ''}
                  onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                  placeholder="https://www.linkedin.com/company/..."
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: General & Pricing */}
        {activeTab === 'general' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600" />
                Brand Identity & Pricing Range
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Core spa branding and commercial metadata.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Business Name
                </label>
                <input
                  type="text"
                  value={info.businessName}
                  onChange={(e) => setInfo({ ...info, businessName: e.target.value })}
                  placeholder="Euro Spa Center"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tagline / Motto
                </label>
                <input
                  type="text"
                  value={info.tagline}
                  onChange={(e) => setInfo({ ...info, tagline: e.target.value })}
                  placeholder="Relax • Refresh • Rejuvenate"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Business Description
                </label>
                <textarea
                  rows={3}
                  value={info.description}
                  onChange={(e) => setInfo({ ...info, description: e.target.value })}
                  className="w-full text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Price Range Indicator
                  </label>
                  <input
                    type="text"
                    value={info.priceRange}
                    onChange={(e) => setInfo({ ...info, priceRange: e.target.value })}
                    placeholder="BDT 3,500 - 15,000"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Accepted
                  </label>
                  <input
                    type="text"
                    value={info.paymentAccepted}
                    onChange={(e) => setInfo({ ...info, paymentAccepted: e.target.value })}
                    placeholder="Cash, bKash, Credit Card, Debit Card"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Admin Security & Linked Authentication */}
        {activeTab === 'auth' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Admin Authentication & Account Security</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  View and manage Firebase Authentication credentials, role authorization, and linked sign-in methods.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                /admins Authorized
              </span>
            </div>

            {/* Current Account Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Account Email</span>
                <p className="text-sm font-bold text-slate-900 truncate">{currentUser?.email || 'N/A'}</p>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  Authorized in /admins
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Preserved Firebase UID</span>
                <p className="text-xs font-mono text-slate-800 break-all select-all">{currentUser?.uid || 'N/A'}</p>
                <p className="text-[10px] text-slate-500">Exact Firebase User document ID preserved across credential linking.</p>
              </div>
            </div>

            {/* Linked Providers Status */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <h4 className="text-xs font-bold text-slate-800">Linked Authentication Providers</h4>
              <div className="flex flex-wrap gap-2">
                {currentUser?.providerData.map((p) => (
                  <span
                    key={p.providerId}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-800 shadow-2xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Provider: <strong className="font-mono">{p.providerId === 'password' ? 'Email / Password' : p.providerId}</strong></span>
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                The Euro Spa Center /admin management portal uses <strong>Google Sign-In</strong> for secure administrator access. Administrative authorization is strictly governed by the <code>/admins</code> collection in Firestore.
              </p>
            </div>
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={loadSettings}
            disabled={saving}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

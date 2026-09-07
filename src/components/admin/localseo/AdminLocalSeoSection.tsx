import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  MapPin, 
  Search, 
  Clock, 
  Phone, 
  Mail, 
  Globe, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Edit3, 
  Share2, 
  Sparkles, 
  Code, 
  RefreshCw,
  Eye,
  Sliders,
  Calendar
} from 'lucide-react';
import { BusinessInfo, ServiceArea, DayOfWeek, DayHours, SpecialHourItem } from '../../../types';
import { 
  fetchBusinessInfo, 
  updateBusinessInfo, 
  fetchAllServiceAreas, 
  saveServiceArea, 
  deleteServiceArea, 
  seedServiceAreasIfEmpty,
  generateLocalBusinessSchema,
  calculateLocalSeoAudit,
  formatTime12h,
  DEFAULT_REGULAR_HOURS
} from '../../../services/localSeoService';
import { AdminServiceAreaEditorModal } from './AdminServiceAreaEditorModal';
import { navigate } from '../../../router';

interface AdminLocalSeoSectionProps {
  currentUser: User | null;
}

type TabType = 'overview' | 'identity' | 'address' | 'hours' | 'areas' | 'socials' | 'schema';

const DAYS_ORDER: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

export function AdminLocalSeoSection({ currentUser }: AdminLocalSeoSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedNap, setCopiedNap] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Service Area Modal state
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<ServiceArea | null>(null);

  // Special Hours Input state
  const [newSpecialDate, setNewSpecialDate] = useState('');
  const [newSpecialNote, setNewSpecialNote] = useState('');
  const [newSpecialClosed, setNewSpecialClosed] = useState(true);
  const [newSpecialOpens, setNewSpecialOpens] = useState('10:00');
  const [newSpecialCloses, setNewSpecialCloses] = useState('22:00');

  // Secondary Category Tag Input
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Initial Data Load
  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [info, areas] = await Promise.all([
        fetchBusinessInfo(),
        fetchAllServiceAreas()
      ]);
      setBusinessInfo(info);
      setServiceAreas(areas);
    } catch (err: any) {
      console.error('Failed to load local SEO info:', err);
      setErrorMessage('Failed to load business information. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading || !businessInfo) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold">Loading Local SEO & Business Identity...</p>
      </div>
    );
  }

  const audit = calculateLocalSeoAudit(businessInfo, serviceAreas);
  const generatedSchema = generateLocalBusinessSchema(businessInfo, serviceAreas);

  // Save all business info updates
  const handleSaveAll = async () => {
    if (!businessInfo) return;
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccessMessage(null);

    try {
      const updated = await updateBusinessInfo(businessInfo, currentUser?.email || undefined);
      setBusinessInfo(updated);
      setSaveSuccessMessage('Business information and Local SEO settings saved successfully!');
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save business information.');
    } finally {
      setIsSaving(false);
    }
  };

  // NAP Formatted String Copy
  const handleCopyNap = () => {
    if (!businessInfo) return;
    const napText = `${businessInfo.businessName}\n${businessInfo.fullAddress}\nPhone: ${businessInfo.phone}\nWebsite: ${businessInfo.websiteUrl}`;
    navigator.clipboard.writeText(napText);
    setCopiedNap(true);
    setTimeout(() => setCopiedNap(false), 2500);
  };

  // Copy Schema JSON-LD
  const handleCopySchema = () => {
    const jsonStr = JSON.stringify(generatedSchema, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  // Update a top-level field in businessInfo
  const handleFieldChange = <K extends keyof BusinessInfo>(field: K, value: BusinessInfo[K]) => {
    setBusinessInfo(prev => prev ? { ...prev, [field]: value } : null);
  };

  // Update social profile
  const handleSocialChange = (key: keyof BusinessInfo['socialProfiles'], val: string) => {
    setBusinessInfo(prev => {
      if (!prev) return null;
      return {
        ...prev,
        socialProfiles: {
          ...prev.socialProfiles,
          [key]: val
        }
      };
    });
  };

  // Update specific day hours
  const handleDayHourChange = (day: DayOfWeek, updates: Partial<DayHours>) => {
    setBusinessInfo(prev => {
      if (!prev) return null;
      return {
        ...prev,
        regularHours: {
          ...prev.regularHours,
          [day]: {
            ...prev.regularHours[day],
            ...updates
          }
        }
      };
    });
  };

  // Quick preset: Apply 10 AM - 10 PM daily
  const handleApplyPresetHours = () => {
    setBusinessInfo(prev => {
      if (!prev) return null;
      return {
        ...prev,
        regularHours: { ...DEFAULT_REGULAR_HOURS },
        displayStatus: 'Open 10:00 AM – 10:00 PM',
        displayHours: '10:00 AM – 10:00 PM Daily'
      };
    });
  };

  // Add Special Hour item
  const handleAddSpecialHour = () => {
    if (!newSpecialDate) return;
    const item: SpecialHourItem = {
      id: `special-${Date.now()}`,
      date: newSpecialDate,
      note: newSpecialNote.trim() || 'Holiday',
      isClosed: newSpecialClosed,
      ...(!newSpecialClosed ? { opens: newSpecialOpens, closes: newSpecialCloses } : {})
    };

    setBusinessInfo(prev => {
      if (!prev) return null;
      return {
        ...prev,
        specialHours: [...prev.specialHours, item]
      };
    });

    setNewSpecialDate('');
    setNewSpecialNote('');
    setNewSpecialClosed(true);
  };

  // Remove Special Hour item
  const handleRemoveSpecialHour = (id: string) => {
    setBusinessInfo(prev => {
      if (!prev) return null;
      return {
        ...prev,
        specialHours: prev.specialHours.filter(h => h.id !== id)
      };
    });
  };

  // Add Secondary Category
  const handleAddSecondaryCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed || !businessInfo) return;
    if (!businessInfo.secondaryCategories.includes(trimmed)) {
      setBusinessInfo({
        ...businessInfo,
        secondaryCategories: [...businessInfo.secondaryCategories, trimmed]
      });
    }
    setNewCategoryInput('');
  };

  const handleRemoveSecondaryCategory = (cat: string) => {
    if (!businessInfo) return;
    setBusinessInfo({
      ...businessInfo,
      secondaryCategories: businessInfo.secondaryCategories.filter(c => c !== cat)
    });
  };

  // Service Area save
  const handleSaveArea = async (areaData: Partial<ServiceArea> & { name: string; slug: string }) => {
    await saveServiceArea(areaData);
    const updatedAreas = await fetchAllServiceAreas();
    setServiceAreas(updatedAreas);
  };

  // Service Area delete
  const handleDeleteArea = async (areaId: string, areaName: string) => {
    if (!window.confirm(`Are you sure you want to remove target service area "${areaName}"?`)) {
      return;
    }
    await deleteServiceArea(areaId);
    const updatedAreas = await fetchAllServiceAreas();
    setServiceAreas(updatedAreas);
  };

  // Toggle area status
  const handleToggleAreaStatus = async (area: ServiceArea) => {
    const newStatus = area.status === 'active' ? 'inactive' : 'active';
    await saveServiceArea({ ...area, status: newStatus });
    const updatedAreas = await fetchAllServiceAreas();
    setServiceAreas(updatedAreas);
  };

  // Seed default areas
  const handleSeedAreas = async () => {
    await seedServiceAreasIfEmpty();
    const updatedAreas = await fetchAllServiceAreas();
    setServiceAreas(updatedAreas);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Title */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                Local SEO & Business Information
              </h1>
              <p className="text-xs text-slate-500">
                Single canonical business identity, NAP consistency, structured Schema, and service areas
              </p>
            </div>
          </div>
        </div>

        {/* Global Save & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyNap}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Copy Formatted NAP for Directory Citations"
          >
            {copiedNap ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                <span className="text-green-700 font-bold">NAP Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Canonical NAP</span>
              </>
            )}
          </button>

          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving CMS...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alert Notifications */}
      {saveSuccessMessage && (
        <div className="p-3.5 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-medium flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Canonical NAP Anchor Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/80 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                Canonical NAP Source of Truth
              </span>
              <span className="text-[11px] text-slate-400">
                Synchronized across Footer, Contact, & Schema
              </span>
            </div>
            <h2 className="text-xl font-bold mt-1 tracking-tight text-white">
              {businessInfo.businessName}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[11px] text-slate-400 block">Advisory Health Score</span>
              <span className="text-lg font-black text-emerald-400">{audit.score}% Complete</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-emerald-400 font-black text-base">
              {audit.score}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-300 mb-1 flex items-center gap-1.5">
              <span>N</span> • Business Name
            </div>
            <p className="font-semibold text-slate-100">{businessInfo.businessName}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{businessInfo.primaryCategory}</p>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-1 flex items-center gap-1.5">
              <span>A</span> • Canonical Address
            </div>
            <p className="font-semibold text-slate-100">{businessInfo.fullAddress}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{businessInfo.area}, {businessInfo.city} {businessInfo.postalCode}</p>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-1 flex items-center gap-1.5">
              <span>P</span> • Phone Number
            </div>
            <p className="font-semibold text-slate-100">{businessInfo.phone}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">WhatsApp: {businessInfo.whatsappFormatted}</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-1 bg-white p-1 rounded-2xl border">
        {[
          { id: 'overview', label: 'Local SEO Audit', icon: Sparkles },
          { id: 'identity', label: 'Business Identity', icon: Globe },
          { id: 'address', label: 'NAP & Address', icon: MapPin },
          { id: 'hours', label: 'Business Hours', icon: Clock },
          { id: 'areas', label: 'Service Areas', icon: MapPin },
          { id: 'socials', label: 'Social Profiles', icon: Share2 },
          { id: 'schema', label: 'Structured Data', icon: Code },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.id === 'overview' && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-700'}`}>
                  {audit.score}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: LOCAL SEO AUDIT */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Advisory Local SEO Checklist
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  12-point citation completeness and signal readiness check for Euro Spa Center
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-800">
                    {audit.passedCount} of {audit.totalCount} Passed
                  </span>
                  <span className="text-[11px] text-slate-400 block">Advisory Guidance Tool</span>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <span className="text-lg font-black text-emerald-700">{audit.score}%</span>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-[11px] text-blue-800 leading-relaxed">
              <strong>Advisory Tool Disclaimer:</strong> This score represents on-page citation completeness, structured data conformance, and NAP consistency best practices. It is designed as an internal advisory checklist for the SEO expert and does not represent an official Google ranking metric.
            </div>

            {/* Checklist items */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {audit.items.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    item.passed 
                      ? 'bg-emerald-50/40 border-emerald-200' 
                      : 'bg-amber-50/50 border-amber-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {item.passed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">{item.label}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          item.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.passed ? 'Verified' : 'Action Needed'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-mono mt-0.5 truncate">
                        {item.valueDescription}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {item.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BUSINESS IDENTITY & CATEGORIES */}
      {activeTab === 'identity' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Business Identity & Categories
            </h3>
            <p className="text-xs text-slate-500">
              Set the primary brand identity, taglines, and business classification
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Business Name (Canonical Name) *
              </label>
              <input
                type="text"
                value={businessInfo.businessName}
                onChange={(e) => handleFieldChange('businessName', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Must strictly match Google Business Profile</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Brand Tagline
              </label>
              <input
                type="text"
                value={businessInfo.tagline}
                onChange={(e) => handleFieldChange('tagline', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Business Description *
            </label>
            <textarea
              rows={4}
              value={businessInfo.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">Used in schema, Google Business sync, and about sections</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Primary Schema & Business Category *
              </label>
              <select
                value={businessInfo.primaryCategory}
                onChange={(e) => {
                  handleFieldChange('primaryCategory', e.target.value);
                  if (['DaySpa', 'HealthAndBeautyBusiness', 'LocalBusiness', 'Organization'].includes(e.target.value)) {
                    handleFieldChange('schemaType', e.target.value as any);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="DaySpa">DaySpa (Recommended)</option>
                <option value="HealthAndBeautyBusiness">HealthAndBeautyBusiness</option>
                <option value="Spa and Wellness Center">Spa and Wellness Center</option>
                <option value="Massage Therapist">Massage Therapist</option>
                <option value="LocalBusiness">LocalBusiness</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Note: MedicalBusiness is excluded as it does not qualify.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Price Range
              </label>
              <input
                type="text"
                value={businessInfo.priceRange}
                onChange={(e) => handleFieldChange('priceRange', e.target.value)}
                placeholder="e.g. BDT 3,500 - 15,000 or $$"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Included in Schema.org priceRange</p>
            </div>
          </div>

          {/* Secondary Categories Tag Manager */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Secondary Business Categories
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              {businessInfo.secondaryCategories.map((cat) => (
                <span
                  key={cat}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSecondaryCategory(cat)}
                    className="text-slate-400 hover:text-red-600"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSecondaryCategory();
                  }
                }}
                placeholder="Add category (e.g. Aromatherapy Service)..."
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddSecondaryCategory}
                className="px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Accepted Currency
              </label>
              <input
                type="text"
                value={businessInfo.currenciesAccepted}
                onChange={(e) => handleFieldChange('currenciesAccepted', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Methods Accepted
              </label>
              <input
                type="text"
                value={businessInfo.paymentAccepted}
                onChange={(e) => handleFieldChange('paymentAccepted', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: NAP & ADDRESS & MAPS */}
      {activeTab === 'address' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Contact Numbers & Physical Address
            </h3>
            <p className="text-xs text-slate-500">
              The canonical NAP information that feeds every website component, footer, and schema
            </p>
          </div>

          {/* Phone & Contact Group */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Canonical Phone (E.164 / +880) *
              </label>
              <input
                type="text"
                value={businessInfo.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                placeholder="+880 1842-658423"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Display Phone (National format)
              </label>
              <input
                type="text"
                value={businessInfo.displayPhone}
                onChange={(e) => handleFieldChange('displayPhone', e.target.value)}
                placeholder="01842-658423"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                WhatsApp Direct Number
              </label>
              <input
                type="text"
                value={businessInfo.whatsappNumber}
                onChange={(e) => handleFieldChange('whatsappNumber', e.target.value)}
                placeholder="8801842658423"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Primary Business Email
              </label>
              <input
                type="email"
                value={businessInfo.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                placeholder="info@eurospacenter.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Canonical Website URL
              </label>
              <input
                type="url"
                value={businessInfo.websiteUrl}
                onChange={(e) => handleFieldChange('websiteUrl', e.target.value)}
                placeholder="https://eurospabd.com/"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Physical Address Fields */}
          <div className="border-t border-slate-100 pt-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Physical Location & Postal Address
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Formatted Address (Public Display & Citations) *
              </label>
              <input
                type="text"
                value={businessInfo.fullAddress}
                onChange={(e) => handleFieldChange('fullAddress', e.target.value)}
                placeholder="73 Road No. 6, Banani, Dhaka 1213, Bangladesh"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Street Address Line
                </label>
                <input
                  type="text"
                  value={businessInfo.addressLine}
                  onChange={(e) => handleFieldChange('addressLine', e.target.value)}
                  placeholder="73 Road No. 6"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Area / Locality
                </label>
                <input
                  type="text"
                  value={businessInfo.area}
                  onChange={(e) => handleFieldChange('area', e.target.value)}
                  placeholder="Banani"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={businessInfo.city}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  placeholder="Dhaka"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={businessInfo.postalCode}
                  onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                  placeholder="1213"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Google Maps & Geolocation Coordinates */}
          <div className="border-t border-slate-100 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Google Maps, GBP & Geocoordinates</span>
              </h4>
              <a
                href={businessInfo.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>Verify Pin on Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Google Maps Direct URL
              </label>
              <input
                type="url"
                value={businessInfo.googleMapsUrl}
                onChange={(e) => handleFieldChange('googleMapsUrl', e.target.value)}
                placeholder="https://www.google.com/maps/place/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={businessInfo.latitude}
                  onChange={(e) => handleFieldChange('latitude', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={businessInfo.longitude}
                  onChange={(e) => handleFieldChange('longitude', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Google Place ID
                </label>
                <input
                  type="text"
                  value={businessInfo.googlePlaceId || ''}
                  onChange={(e) => handleFieldChange('googlePlaceId', e.target.value)}
                  placeholder="ChIJBXYo6tfHVTcR1ZOGYIsTHt4"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Google Plus Code
                </label>
                <input
                  type="text"
                  value={businessInfo.plusCode || ''}
                  onChange={(e) => handleFieldChange('plusCode', e.target.value)}
                  placeholder="QCV3+76 Dhaka, Bangladesh"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BUSINESS HOURS & SPECIAL DAYS */}
      {activeTab === 'hours' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Regular Operating Hours
              </h3>
              <p className="text-xs text-slate-500">
                Configure opening times per day of the week. Updates public website badges and Schema.org specs.
              </p>
            </div>

            <button
              type="button"
              onClick={handleApplyPresetHours}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 self-start cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Apply 10:00 AM – 10:00 PM Daily</span>
            </button>
          </div>

          {/* Days Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Day of Week</th>
                  <th className="py-3 px-4">Operating Status</th>
                  <th className="py-3 px-4">Opening Time</th>
                  <th className="py-3 px-4">Closing Time</th>
                  <th className="py-3 px-4 text-right">Human Display</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {DAYS_ORDER.map((day) => {
                  const dayHour = businessInfo.regularHours[day] || { open: true, opens: '10:00', closes: '22:00' };
                  return (
                    <tr key={day} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {DAY_LABELS[day]}
                      </td>
                      <td className="py-3 px-4">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={dayHour.open}
                            onChange={(e) => handleDayHourChange(day, { open: e.target.checked })}
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          />
                          <span className={`text-xs font-bold ${dayHour.open ? 'text-green-700' : 'text-slate-400'}`}>
                            {dayHour.open ? 'Open' : 'Closed'}
                          </span>
                        </label>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="time"
                          disabled={!dayHour.open}
                          value={dayHour.opens}
                          onChange={(e) => handleDayHourChange(day, { opens: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs disabled:opacity-40 disabled:bg-slate-50 font-mono"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="time"
                          disabled={!dayHour.open}
                          value={dayHour.closes}
                          onChange={(e) => handleDayHourChange(day, { closes: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs disabled:opacity-40 disabled:bg-slate-50 font-mono"
                        />
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {dayHour.open 
                          ? `${formatTime12h(dayHour.opens)} – ${formatTime12h(dayHour.closes)}`
                          : 'Closed'
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Quick Display Text Customization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Display Hours Label (Header / Badges)
              </label>
              <input
                type="text"
                value={businessInfo.displayHours}
                onChange={(e) => handleFieldChange('displayHours', e.target.value)}
                placeholder="10:00 AM – 10:00 PM Daily"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Display Status String (Contact Card)
              </label>
              <input
                type="text"
                value={businessInfo.displayStatus}
                onChange={(e) => handleFieldChange('displayStatus', e.target.value)}
                placeholder="Open 10:00 AM – 10:00 PM"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Special / Holiday Hours Manager */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Special & Holiday Hours</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Specify scheduled closures, festive holidays (Eid, Puja, New Year), or custom hours
              </p>
            </div>

            {/* List of Special Hours */}
            {businessInfo.specialHours.length > 0 ? (
              <div className="space-y-2">
                {businessInfo.specialHours.map((sh) => (
                  <div
                    key={sh.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">
                        {sh.date}
                      </span>
                      <span className="font-semibold text-slate-800">{sh.note}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        sh.isClosed ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {sh.isClosed ? 'Closed' : `${formatTime12h(sh.opens || '')} - ${formatTime12h(sh.closes || '')}`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSpecialHour(sh.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                      title="Remove Special Hour"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No special holiday hours currently scheduled.</p>
            )}

            {/* Add Special Hour Input Form */}
            <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/30 flex flex-wrap items-center gap-3 text-xs">
              <input
                type="date"
                value={newSpecialDate}
                onChange={(e) => setNewSpecialDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
              />
              <input
                type="text"
                placeholder="Holiday reason (e.g. Eid-ul-Fitr)..."
                value={newSpecialNote}
                onChange={(e) => setNewSpecialNote(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white min-w-[200px]"
              />
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newSpecialClosed}
                  onChange={(e) => setNewSpecialClosed(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-700">All-day Closed</span>
              </label>

              {!newSpecialClosed && (
                <div className="flex items-center gap-1 font-mono">
                  <input
                    type="time"
                    value={newSpecialOpens}
                    onChange={(e) => setNewSpecialOpens(e.target.value)}
                    className="px-2 py-1 rounded border border-slate-200 bg-white text-xs"
                  />
                  <span>–</span>
                  <input
                    type="time"
                    value={newSpecialCloses}
                    onChange={(e) => setNewSpecialCloses(e.target.value)}
                    className="px-2 py-1 rounded border border-slate-200 bg-white text-xs"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleAddSpecialHour}
                disabled={!newSpecialDate}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-40 ml-auto transition-colors"
              >
                Add Special Date
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SERVICE AREAS MANAGER */}
      {activeTab === 'areas' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Service Areas & Location Pages Foundation
              </h3>
              <p className="text-xs text-slate-500">
                Manage target neighborhoods across Dhaka. Each area supports dedicated landing page architecture.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {serviceAreas.length === 0 && (
                <button
                  type="button"
                  onClick={handleSeedAreas}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Seed Standard Dhaka Areas
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setSelectedArea(null);
                  setIsAreaModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Service Area</span>
              </button>
            </div>
          </div>

          {/* Service Areas Cards / Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {serviceAreas.map((area) => {
              const isActive = area.status === 'active';
              return (
                <div
                  key={area.id}
                  className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                    isActive
                      ? 'border-slate-200 bg-white shadow-2xs hover:border-slate-300'
                      : 'border-slate-200 bg-slate-50/80 opacity-75'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {area.displayOrder}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">
                          {area.name}
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleAreaStatus(area)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {isActive ? 'Active (Public)' : 'Inactive (Draft)'}
                      </button>
                    </div>

                    <div className="text-[11px] font-mono text-blue-600 mb-2 flex items-center gap-1">
                      <span>/locations/{area.slug}</span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                      {area.shortDescription || 'No description provided.'}
                    </p>

                    {area.focusKeyword && (
                      <div className="text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block mb-3">
                        <span className="font-semibold text-slate-700">Keyword:</span> {area.focusKeyword}
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {isActive && (
                        <button
                          type="button"
                          onClick={() => navigate(`/locations/${area.slug}`)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Preview Location Page"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Page</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedArea(area);
                          setIsAreaModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit Area"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteArea(area.id, area.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Area"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>Location Landing Page Policy:</strong> Location pages are only published and crawlable when explicitly set to "Active". Thin content is protected by requiring substantive location-specific editorial content before indexation.
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SOCIAL PROFILES (sameAs) */}
      {activeTab === 'socials' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Social Profiles & sameAs Verification
            </h3>
            <p className="text-xs text-slate-500">
              Legitimate social channels used for Organization/LocalBusiness sameAs signals and public footer navigation
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <span>Facebook Page URL</span>
              </label>
              <input
                type="url"
                value={businessInfo.socialProfiles.facebook || ''}
                onChange={(e) => handleSocialChange('facebook', e.target.value)}
                placeholder="https://www.facebook.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <span>Instagram Profile URL</span>
              </label>
              <input
                type="url"
                value={businessInfo.socialProfiles.instagram || ''}
                onChange={(e) => handleSocialChange('instagram', e.target.value)}
                placeholder="https://www.instagram.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <span>YouTube Channel URL</span>
              </label>
              <input
                type="url"
                value={businessInfo.socialProfiles.youtube || ''}
                onChange={(e) => handleSocialChange('youtube', e.target.value)}
                placeholder="https://www.youtube.com/@..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <span>TikTok Profile URL</span>
              </label>
              <input
                type="url"
                value={businessInfo.socialProfiles.tiktok || ''}
                onChange={(e) => handleSocialChange('tiktok', e.target.value)}
                placeholder="https://www.tiktok.com/@..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <span>X / Twitter URL</span>
              </label>
              <input
                type="url"
                value={businessInfo.socialProfiles.twitter || ''}
                onChange={(e) => handleSocialChange('twitter', e.target.value)}
                placeholder="https://twitter.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <span>LinkedIn Company Page</span>
              </label>
              <input
                type="url"
                value={businessInfo.socialProfiles.linkedin || ''}
                onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                placeholder="https://www.linkedin.com/company/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: STRUCTURED DATA & SCHEMA.ORG */}
      {activeTab === 'schema' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                LocalBusiness Schema.org Structured Data
              </h3>
              <p className="text-xs text-slate-500">
                Automatically generated JSON-LD using centralized business identity, geocoordinates, opening hours, and service areas
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://search.google.com/test/rich-results"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <span>Google Rich Results Test</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                type="button"
                onClick={handleCopySchema}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {copiedSchema ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy JSON-LD</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Schema Type selector */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-800">Primary Schema.org @type:</span>
              <p className="text-[11px] text-slate-500">
                Choose the most specific and accurate Google-supported business subtype
              </p>
            </div>

            <select
              value={businessInfo.schemaType}
              onChange={(e) => handleFieldChange('schemaType', e.target.value as any)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="DaySpa">DaySpa (Highly Recommended for Spa Centers)</option>
              <option value="HealthAndBeautyBusiness">HealthAndBeautyBusiness</option>
              <option value="LocalBusiness">LocalBusiness</option>
              <option value="Organization">Organization</option>
            </select>
          </div>

          {/* JSON-LD Code Block */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-emerald-400">&lt;script type="application/ld+json"&gt;</span>
              <span>application/ld+json</span>
            </div>

            <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-[450px] leading-relaxed select-all">
              {JSON.stringify(generatedSchema, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Service Area Modal */}
      <AdminServiceAreaEditorModal
        isOpen={isAreaModalOpen}
        onClose={() => setIsAreaModalOpen(false)}
        area={selectedArea}
        onSave={handleSaveArea}
        existingSlugs={serviceAreas.map(a => a.slug)}
      />
    </div>
  );
}

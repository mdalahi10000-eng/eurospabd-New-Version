import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { 
  ArrowLeft, 
  Save, 
  UploadCloud, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  X, 
  MapPin, 
  DollarSign, 
  Clock, 
  Sparkles,
  Layers,
  Copy
} from 'lucide-react';
import { Service, PriceOption } from '../../../types';
import { 
  createService, 
  updateService, 
  duplicateService,
  generateServiceSlug, 
  checkServiceSlugAvailability, 
  uploadServiceImage 
} from '../../../services/servicesService';
import { AdminServiceSeoCard } from './AdminServiceSeoCard';
import { SPA_INFO } from '../../../data/spaData';

interface AdminServiceEditorProps {
  service: Service | null;
  onBack: () => void;
  onSaved: (savedService: Service) => void;
}

const DEFAULT_CATEGORIES = [
  'Massage Therapy',
  'Oil Massage',
  'Therapeutic Bodywork',
  'Aromatherapy & Herbal',
  'Body Scrub & Skin Care',
  'Exclusive VIP Therapy'
];

const AVAILABLE_LOCATIONS = [
  'Dhaka',
  'Banani',
  'Gulshan',
  'Baridhara',
  'Dhanmondi',
  'Uttara',
  'Mohakhali',
  'Bashundhara'
];

export function AdminServiceEditor({
  service,
  onBack,
  onSaved
}: AdminServiceEditorProps) {
  const isEditing = Boolean(service);

  // Core Fields
  const [name, setName] = useState(service?.name || '');
  const [slug, setSlug] = useState(service?.slug || '');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(service?.slug));
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [category, setCategory] = useState(service?.category || 'Massage Therapy');
  const [customCategory, setCustomCategory] = useState('');
  const [shortDescription, setShortDescription] = useState(service?.shortDescription || '');
  const [fullDescription, setFullDescription] = useState(service?.fullDescription || '');
  const [durationRange, setDurationRange] = useState(service?.durationRange || '60 / 90 Minutes');
  const [displayOrder, setDisplayOrder] = useState<number>(service?.displayOrder ?? 0);
  const [status, setStatus] = useState<'active' | 'inactive'>(service?.status || 'active');
  const [popular, setPopular] = useState<boolean>(Boolean(service?.popular));
  const [bookingCta, setBookingCta] = useState(service?.bookingCta || 'Book This Treatment');

  // Featured Image
  const [image, setImage] = useState(service?.image || 'https://lh3.googleusercontent.com/geougc/AF1QipPDGlDn8JiA8nC2xubXZCHfaV8c7sQkBsZr3iWL=w1200-h800-k-no');
  const [imageAlt, setImageAlt] = useState(service?.imageAlt || '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Price Options
  const [priceOptions, setPriceOptions] = useState<PriceOption[]>(
    service?.priceOptions && service.priceOptions.length > 0
      ? service.priceOptions
      : [
          { duration: '60 Minutes', price: 'BDT 5,500', amount: 5500 },
          { duration: '90 Minutes', price: 'BDT 7,500', amount: 7500 }
        ]
  );

  // Benefits
  const [benefits, setBenefits] = useState<string[]>(
    service?.benefits && service.benefits.length > 0
      ? service.benefits
      : ['Relieves muscle tension', 'Promotes deep relaxation', 'Improves blood circulation']
  );
  const [benefitInput, setBenefitInput] = useState('');

  // Local SEO Locations
  const [serviceAreas, setServiceAreas] = useState<string[]>(
    service?.serviceAreas && service.serviceAreas.length > 0
      ? service.serviceAreas
      : ['Dhaka', 'Banani', 'Gulshan']
  );

  // SEO Fields
  const [seoTitle, setSeoTitle] = useState(service?.seoTitle || '');
  const [metaDescription, setMetaDescription] = useState(service?.metaDescription || '');
  const [focusKeyword, setFocusKeyword] = useState(service?.focusKeyword || '');
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>(service?.secondaryKeywords || []);
  const [canonicalUrl, setCanonicalUrl] = useState(service?.canonicalUrl || '');
  const [robotsIndex, setRobotsIndex] = useState<boolean>(service?.robotsIndex !== false);
  const [robotsFollow, setRobotsFollow] = useState<boolean>(service?.robotsFollow !== false);
  const [ogTitle, setOgTitle] = useState(service?.ogTitle || '');
  const [ogDescription, setOgDescription] = useState(service?.ogDescription || '');
  const [ogImage, setOgImage] = useState(service?.ogImage || '');
  const [schemaType, setSchemaType] = useState(service?.schemaType || 'HealthAndBeautyBusiness');
  const [customSchema, setCustomSchema] = useState(service?.customSchema || '');

  // UI state
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-generate slug when name changes (unless manually edited)
  useEffect(() => {
    if (!slugManuallyEdited && name) {
      setSlug(generateServiceSlug(name));
    }
  }, [name, slugManuallyEdited]);

  // Check slug availability with debounce
  useEffect(() => {
    if (!slug) {
      setSlugAvailable(null);
      return;
    }
    const timer = setTimeout(async () => {
      const avail = await checkServiceSlugAvailability(slug, service?.id);
      setSlugAvailable(avail);
    }, 350);

    return () => clearTimeout(timer);
  }, [slug, service?.id]);

  // Image Upload Handler
  const handleImageFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setImageError('Image exceeds 10MB limit.');
      return;
    }

    try {
      setUploadingImage(true);
      setUploadProgress(10);
      setImageError(null);

      const downloadUrl = await uploadServiceImage(file, (pct) => {
        setUploadProgress(pct);
      });

      setImage(downloadUrl);
      if (!imageAlt) {
        setImageAlt(`${name || 'Service'} session at Euro Spa Center Banani`);
      }
      setFeedback({ type: 'success', message: 'Service image uploaded to Firebase Storage!' });
    } catch (err: any) {
      console.error('Service image upload error:', err);
      setImageError(err.message || 'Failed to upload image.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Price Option Helpers
  const handleAddPriceOption = () => {
    setPriceOptions([
      ...priceOptions,
      { duration: '60 Minutes', price: 'BDT 5,500', amount: 5500 }
    ]);
  };

  const handleUpdatePriceOption = (index: number, field: keyof PriceOption, val: any) => {
    const updated = [...priceOptions];
    updated[index] = { ...updated[index], [field]: val };
    setPriceOptions(updated);
  };

  const handleRemovePriceOption = (index: number) => {
    if (priceOptions.length > 1) {
      setPriceOptions(priceOptions.filter((_, i) => i !== index));
    }
  };

  // Benefit Helpers
  const handleAddBenefit = (b: string) => {
    const clean = b.trim();
    if (clean && !benefits.includes(clean)) {
      setBenefits([...benefits, clean]);
    }
    setBenefitInput('');
  };

  const handleRemoveBenefit = (b: string) => {
    setBenefits(benefits.filter(item => item !== b));
  };

  // Location Toggle
  const toggleLocation = (loc: string) => {
    if (serviceAreas.includes(loc)) {
      setServiceAreas(serviceAreas.filter(l => l !== loc));
    } else {
      setServiceAreas([...serviceAreas, loc]);
    }
  };

  // Save Service
  const handleSave = async () => {
    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'Please enter a service name.' });
      return;
    }
    if (!slug.trim()) {
      setFeedback({ type: 'error', message: 'Please provide an SEO URL slug.' });
      return;
    }
    if (slugAvailable === false) {
      setFeedback({ type: 'error', message: 'This slug is already taken. Please choose a unique URL slug.' });
      return;
    }
    if (!shortDescription.trim()) {
      setFeedback({ type: 'error', message: 'Please enter a short summary description.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const primaryPrice = priceOptions[0]?.price || 'BDT 3,500';
    const finalCategory = customCategory.trim() || category;

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      shortDescription: shortDescription.trim(),
      fullDescription: fullDescription.trim() || shortDescription.trim(),
      category: finalCategory,
      price: primaryPrice,
      durationRange: durationRange.trim() || '60 Minutes',
      image: image.trim(),
      imageAlt: imageAlt.trim() || `${name.trim()} treatment at Euro Spa Center Banani`,
      popular: Boolean(popular),
      status: status,
      displayOrder: Number(displayOrder) || 0,
      priceOptions: priceOptions,
      benefits: benefits,
      bookingCta: bookingCta.trim() || 'Book This Treatment',
      serviceAreas: serviceAreas,
      
      // SEO
      seoTitle: seoTitle.trim() || `${name.trim()} in Banani, Dhaka | ${SPA_INFO.name}`,
      metaDescription: metaDescription.trim() || shortDescription.trim(),
      focusKeyword: focusKeyword.trim() || `${name.trim().toLowerCase()} banani`,
      secondaryKeywords: secondaryKeywords,
      canonicalUrl: canonicalUrl.trim() || `https://eurospacenter.com/services/${slug.trim()}`,
      robotsIndex: robotsIndex,
      robotsFollow: robotsFollow,
      ogTitle: ogTitle.trim() || seoTitle.trim() || `${name.trim()} | ${SPA_INFO.name}`,
      ogDescription: ogDescription.trim() || metaDescription.trim() || shortDescription.trim(),
      ogImage: ogImage.trim() || image.trim(),
      schemaType: schemaType || 'HealthAndBeautyBusiness',
      customSchema: customSchema.trim()
    };

    try {
      if (isEditing && service) {
        await updateService(service.id, payload);
        const updatedService: Service = {
          ...service,
          ...payload
        };
        setFeedback({ type: 'success', message: 'Service updated successfully!' });
        setTimeout(() => onSaved(updatedService), 700);
      } else {
        const newId = await createService(payload);
        const createdService: Service = {
          id: newId,
          ...payload
        };
        setFeedback({ type: 'success', message: 'New service created and added to database!' });
        setTimeout(() => onSaved(createdService), 700);
      }
    } catch (err: any) {
      console.error('Error saving service:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to save service.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!service) return;
    try {
      setSaving(true);
      const newId = await duplicateService(service);
      setFeedback({ type: 'success', message: 'Service duplicated as inactive draft!' });
      setTimeout(() => onBack(), 700);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to duplicate service.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-200/80 transition-colors cursor-pointer"
            title="Return to Services list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Services CMS</span>
              <span className="text-slate-400">/</span>
              <span className="text-xs font-bold text-blue-600">
                {isEditing ? 'Edit Service' : 'Add New Service'}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
              {name || (isEditing ? 'Edit Spa Service' : 'Create New Spa Service')}
            </h2>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {isEditing && (
            <button
              type="button"
              disabled={saving}
              onClick={handleDuplicate}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              title="Clone this service as a draft"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Duplicate</span>
            </button>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : isEditing ? 'Update Service' : 'Save Service'}</span>
          </button>
        </div>
      </div>

      {/* Inline Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button 
            onClick={() => setFeedback(null)}
            className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Core Content & SEO */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Name & URL Slug */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Service Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Swedish Massage"
                className="w-full px-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-base font-bold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Slug URL */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  SEO Slug (Permanent URL path) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setSlug(generateServiceSlug(name));
                    setSlugManuallyEdited(false);
                  }}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Generate from Name</span>
                </button>
              </div>

              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs text-slate-400 font-mono select-none">
                  /services/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(generateServiceSlug(e.target.value));
                    setSlugManuallyEdited(true);
                  }}
                  placeholder="swedish-massage"
                  className={`w-full pl-22 pr-24 py-2.5 bg-slate-50 focus:bg-white border rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-hidden transition-all ${
                    slugAvailable === false 
                      ? 'border-rose-400 ring-2 ring-rose-200' 
                      : slugAvailable === true 
                        ? 'border-emerald-400' 
                        : 'border-slate-200 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                />
                <div className="absolute right-3 flex items-center gap-1 text-[11px]">
                  {slugAvailable === true && (
                    <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Unique
                    </span>
                  )}
                  {slugAvailable === false && (
                    <span className="text-rose-600 font-medium flex items-center gap-0.5">
                      <AlertCircle className="w-3 h-3" /> Taken
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Public URL: <span className="text-slate-600 font-mono">https://eurospacenter.com/services/{slug || 'service-slug'}</span>
              </p>
            </div>

            {/* Short Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Short Description (Cards & Modal Preview) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="A relaxing dry massage designed to release muscle tension and promote overall relaxation."
                className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all leading-relaxed"
              />
            </div>

            {/* Full Detailed Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Description (Detail View & SEO Content)
              </label>
              <textarea
                rows={4}
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                placeholder="A professional Swedish massage using smooth, flowing massage techniques to help relax the body and relieve everyday muscle tension in Banani, Dhaka..."
                className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all leading-relaxed"
              />
            </div>
          </div>

          {/* Pricing & Duration Options */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Price & Duration Options</span>
              </h3>
              <button
                type="button"
                onClick={handleAddPriceOption}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Option</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {priceOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      Session Duration
                    </label>
                    <input
                      type="text"
                      value={opt.duration}
                      onChange={(e) => handleUpdatePriceOption(idx, 'duration', e.target.value)}
                      placeholder="e.g. 60 Minutes"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      Price Text
                    </label>
                    <input
                      type="text"
                      value={opt.price}
                      onChange={(e) => handleUpdatePriceOption(idx, 'price', e.target.value)}
                      placeholder="e.g. BDT 5,500"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden"
                    />
                  </div>

                  <div className="w-24">
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      Amount (BDT)
                    </label>
                    <input
                      type="number"
                      value={opt.amount}
                      onChange={(e) => handleUpdatePriceOption(idx, 'amount', Number(e.target.value) || 0)}
                      placeholder="5500"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-hidden"
                    />
                  </div>

                  {priceOptions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePriceOption(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer mt-3"
                      title="Remove price option"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Benefits / Features */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Features & Benefits
            </h3>

            <div className="flex flex-wrap gap-1.5 min-h-[32px]">
              {benefits.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-100"
                >
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>{b}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveBenefit(b)}
                    className="text-emerald-500 hover:text-emerald-800 cursor-pointer ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={benefitInput}
                onChange={(e) => setBenefitInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddBenefit(benefitInput);
                  }
                }}
                placeholder="e.g. Relieves shoulder tension (Press Enter)..."
                className="flex-1 px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => handleAddBenefit(benefitInput)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Add Benefit
              </button>
            </div>
          </div>

          {/* Local SEO Service Areas */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Local SEO Service Areas</span>
              </h3>
              <span className="text-[10px] text-slate-400">
                Target locations without keyword stuffing
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Associate this treatment with specific client catchment areas across Dhaka. Enables location-targeted discovery.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {AVAILABLE_LOCATIONS.map((loc) => {
                const selected = serviceAreas.includes(loc);
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => toggleLocation(loc)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      selected
                        ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <MapPin className={`w-3 h-3 ${selected ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{loc}</span>
                    {selected && <Check className="w-3 h-3 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Advanced SEO & SERP Card */}
          <AdminServiceSeoCard
            name={name}
            slug={slug}
            shortDescription={shortDescription}
            fullDescription={fullDescription}
            image={image}
            imageAlt={imageAlt}
            serviceAreas={serviceAreas}
            seoTitle={seoTitle}
            setSeoTitle={setSeoTitle}
            metaDescription={metaDescription}
            setMetaDescription={setMetaDescription}
            focusKeyword={focusKeyword}
            setFocusKeyword={setFocusKeyword}
            secondaryKeywords={secondaryKeywords}
            setSecondaryKeywords={setSecondaryKeywords}
            canonicalUrl={canonicalUrl}
            setCanonicalUrl={setCanonicalUrl}
            robotsIndex={robotsIndex}
            setRobotsIndex={setRobotsIndex}
            robotsFollow={robotsFollow}
            setRobotsFollow={setRobotsFollow}
            ogTitle={ogTitle}
            setOgTitle={setOgTitle}
            ogDescription={ogDescription}
            setOgDescription={setOgDescription}
            ogImage={ogImage}
            setOgImage={setOgImage}
            schemaType={schemaType}
            setSchemaType={setSchemaType}
            customSchema={customSchema}
            setCustomSchema={setCustomSchema}
          />
        </div>

        {/* Right Sidebar: Status, Featured Image, Category & Display Order */}
        <div className="space-y-6">
          {/* Status & Priority Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Visibility & Status
            </h3>

            {/* Status Switch */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Service Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    status === 'active'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Active (Live)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('inactive')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    status === 'inactive'
                      ? 'bg-slate-100 border-slate-300 text-slate-800 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Inactive (Draft)</span>
                </button>
              </div>
            </div>

            {/* Popular Badge Toggle */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={popular}
                  onChange={(e) => setPopular(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800">
                  Feature as "Popular" Service
                </span>
              </label>
              <p className="text-[11px] text-slate-400 ml-6 mt-0.5">
                Displays a prominent badge on public service cards.
              </p>
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Display Order Priority
              </label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden font-mono"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Lower numbers appear first on the homepage and services list.
              </span>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (e.target.value !== 'Other') setCustomCategory('');
                }}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden"
              >
                {DEFAULT_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="Other">Custom Category...</option>
              </select>

              {category === 'Other' && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category"
                  className="mt-2 w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden"
                />
              )}
            </div>

            {/* Booking CTA text */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Booking Button CTA Text
              </label>
              <input
                type="text"
                value={bookingCta}
                onChange={(e) => setBookingCta(e.target.value)}
                placeholder="Book This Treatment"
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Featured Image & Firebase Storage */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>Featured Image</span>
              </h3>
              <span className="text-[10px] text-slate-400">Firebase Storage</span>
            </div>

            {/* Image Preview */}
            <div className="relative aspect-16/10 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              {image ? (
                <img
                  src={image}
                  alt={imageAlt || name || 'Service Preview'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                  No image specified
                </div>
              )}

              {uploadingImage && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold">Uploading ({uploadProgress}%)</span>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
                id="service-image-upload"
              />
              <label
                htmlFor="service-image-upload"
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <UploadCloud className="w-4 h-4 text-blue-600" />
                <span>Upload New Image (Storage)</span>
              </label>
            </div>

            {imageError && (
              <p className="text-[11px] text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{imageError}</span>
              </p>
            )}

            {/* Image URL Manual Override */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Image URL (Google Cloud / CDN)
              </label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden"
              />
            </div>

            {/* Image Alt Text */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Image Alt Text (SEO & Accessibility) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="e.g. Swedish massage session in luxury Banani suite"
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

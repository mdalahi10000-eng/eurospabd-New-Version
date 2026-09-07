import { useState } from 'react';
import { 
  Globe, 
  Share2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  FileCode, 
  HelpCircle,
  Compass,
  Check,
  X
} from 'lucide-react';
import { SPA_INFO } from '../../../data/spaData';

interface AdminServiceSeoCardProps {
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  image: string;
  imageAlt: string;
  serviceAreas: string[];

  // SEO fields
  seoTitle: string;
  setSeoTitle: (v: string) => void;
  metaDescription: string;
  setMetaDescription: (v: string) => void;
  focusKeyword: string;
  setFocusKeyword: (v: string) => void;
  secondaryKeywords: string[];
  setSecondaryKeywords: (v: string[]) => void;
  canonicalUrl: string;
  setCanonicalUrl: (v: string) => void;
  robotsIndex: boolean;
  setRobotsIndex: (v: boolean) => void;
  robotsFollow: boolean;
  setRobotsFollow: (v: boolean) => void;
  ogTitle: string;
  setOgTitle: (v: string) => void;
  ogDescription: string;
  setOgDescription: (v: string) => void;
  ogImage: string;
  setOgImage: (v: string) => void;
  schemaType: string;
  setSchemaType: (v: string) => void;
  customSchema: string;
  setCustomSchema: (v: string) => void;
}

export function AdminServiceSeoCard({
  name,
  slug,
  shortDescription,
  fullDescription,
  image,
  imageAlt,
  serviceAreas,
  seoTitle,
  setSeoTitle,
  metaDescription,
  setMetaDescription,
  focusKeyword,
  setFocusKeyword,
  secondaryKeywords,
  setSecondaryKeywords,
  canonicalUrl,
  setCanonicalUrl,
  robotsIndex,
  setRobotsIndex,
  robotsFollow,
  setRobotsFollow,
  ogTitle,
  setOgTitle,
  ogDescription,
  setOgDescription,
  ogImage,
  setOgImage,
  schemaType,
  setSchemaType,
  customSchema,
  setCustomSchema
}: AdminServiceSeoCardProps) {
  const [activeTab, setActiveTab] = useState<'fields' | 'checklist' | 'serp' | 'schema'>('fields');
  const [keywordInput, setKeywordInput] = useState('');

  const displayTitle = seoTitle || (name ? `${name} in Banani, Dhaka | ${SPA_INFO.name}` : `Service Name | ${SPA_INFO.name}`);
  const displayDesc = metaDescription || shortDescription || 'Professional spa therapy and wellness massage at Euro Spa Center Banani.';
  const displayUrl = canonicalUrl || `https://eurospacenter.com/services/${slug || 'service-slug'}`;
  const displayOgImage = ogImage || image;

  // SEO Checklist Analysis
  const keyword = focusKeyword.toLowerCase().trim();
  const titleText = (seoTitle || name).toLowerCase();
  const descText = (metaDescription || shortDescription).toLowerCase();
  const contentText = (fullDescription + ' ' + shortDescription).toLowerCase();
  const slugText = slug.toLowerCase();

  const checkHasTitle = Boolean(seoTitle || name);
  const checkTitleLength = displayTitle.length >= 30 && displayTitle.length <= 65;
  const checkHasDesc = Boolean(metaDescription || shortDescription);
  const checkDescLength = displayDesc.length >= 70 && displayDesc.length <= 165;
  const checkKeywordInTitle = keyword ? titleText.includes(keyword) : false;
  const checkKeywordInSlug = keyword ? slugText.includes(keyword.replace(/[\s_]+/g, '-')) : false;
  const checkKeywordInDesc = keyword ? descText.includes(keyword) : false;
  const checkKeywordInContent = keyword ? contentText.includes(keyword) : false;
  const checkImageAlt = Boolean(imageAlt && imageAlt.trim().length > 3);
  const checkCanonical = Boolean(canonicalUrl);
  const checkServiceAreas = serviceAreas.length > 0;

  const checklistItems = [
    { label: 'SEO Title configured', pass: checkHasTitle, detail: 'Title tags define search result headers' },
    { label: 'SEO Title length optimal (30-65 chars)', pass: checkTitleLength, detail: `Current: ${displayTitle.length} chars` },
    { label: 'Meta Description configured', pass: checkHasDesc, detail: 'Summarizes page for search users' },
    { label: 'Meta Description length optimal (70-165 chars)', pass: checkDescLength, detail: `Current: ${displayDesc.length} chars` },
    { label: 'Focus keyword defined & in title', pass: checkKeywordInTitle, detail: keyword ? `Matches "${keyword}"` : 'Missing focus keyword' },
    { label: 'Focus keyword in URL slug', pass: checkKeywordInSlug, detail: keyword ? `Matches in /services/${slug}` : 'Missing focus keyword' },
    { label: 'Focus keyword in meta description', pass: checkKeywordInDesc, detail: 'Improves SERP bolding and relevance' },
    { label: 'Focus keyword in service description', pass: checkKeywordInContent, detail: 'Natural on-page mention' },
    { label: 'Featured image has ALT text', pass: checkImageAlt, detail: imageAlt ? `"${imageAlt}"` : 'Missing descriptive ALT' },
    { label: 'Canonical URL defined', pass: checkCanonical, detail: 'Prevents duplicate content penalties' },
    { label: 'Local SEO areas assigned', pass: checkServiceAreas, detail: `${serviceAreas.length} locations linked` },
  ];

  const passedCount = checklistItems.filter(i => i.pass).length;
  const totalChecks = checklistItems.length;
  const scorePercent = Math.round((passedCount / totalChecks) * 100);

  // Add secondary keyword
  const handleAddSecondary = (kw: string) => {
    const clean = kw.trim();
    if (clean && !secondaryKeywords.includes(clean)) {
      setSecondaryKeywords([...secondaryKeywords, clean]);
    }
    setKeywordInput('');
  };

  const handleRemoveSecondary = (kwToRemove: string) => {
    setSecondaryKeywords(secondaryKeywords.filter(k => k !== kwToRemove));
  };

  // Generate Default Schema Preview
  const generatedSchema = {
    "@context": "https://schema.org",
    "@type": schemaType || "HealthAndBeautyBusiness",
    "name": name || "Spa Treatment",
    "description": displayDesc,
    "provider": {
      "@type": "DaySpa",
      "name": SPA_INFO.name,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": SPA_INFO.fullAddress,
        "addressLocality": "Banani",
        "addressRegion": "Dhaka",
        "addressCountry": "BD"
      },
      "telephone": SPA_INFO.phone
    },
    "url": displayUrl,
    "image": displayOgImage
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Advanced SEO & Schema Controls
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              scorePercent >= 80 
                ? 'bg-emerald-100 text-emerald-800' 
                : scorePercent >= 50 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-rose-100 text-rose-800'
            }`}>
              {passedCount}/{totalChecks} ({scorePercent}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Advisory optimization for Google rankings, Open Graph, and local search.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('fields')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'fields' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
            }`}
          >
            Fields
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'checklist' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
            }`}
          >
            <span>Checklist</span>
            <span className="text-[10px] px-1 rounded-full bg-slate-200 text-slate-700">
              {passedCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('serp')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'serp' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
            }`}
          >
            SERP Preview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'schema' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
            }`}
          >
            Schema
          </button>
        </div>
      </div>

      {/* Tab: Fields */}
      {activeTab === 'fields' && (
        <div className="space-y-4 text-xs">
          {/* Focus Keyword & Secondary Keywords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Focus Keyword / Search Query
              </label>
              <input
                type="text"
                value={focusKeyword}
                onChange={(e) => setFocusKeyword(e.target.value)}
                placeholder="e.g. swedish massage banani"
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Primary target term for Google organic rankings.
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Secondary Keywords
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSecondary(keywordInput);
                    }
                  }}
                  placeholder="e.g. body ache relief"
                  className="flex-1 px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => handleAddSecondary(keywordInput)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {secondaryKeywords.map(sk => (
                  <span key={sk} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px]">
                    {sk}
                    <button type="button" onClick={() => handleRemoveSecondary(sk)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* SEO Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700">
                SEO Title (SERP Display)
              </label>
              <span className={`text-[10px] font-mono ${
                displayTitle.length > 65 ? 'text-amber-600 font-bold' : displayTitle.length >= 30 ? 'text-emerald-600' : 'text-slate-400'
              }`}>
                {displayTitle.length} / 60 chars {displayTitle.length > 65 && '(May truncate on Google)'}
              </span>
            </div>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder={`${name || 'Service Name'} in Banani, Dhaka | ${SPA_INFO.name}`}
              className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Meta Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700">
                Meta Description
              </label>
              <span className={`text-[10px] font-mono ${
                displayDesc.length > 165 ? 'text-amber-600 font-bold' : displayDesc.length >= 70 ? 'text-emerald-600' : 'text-slate-400'
              }`}>
                {displayDesc.length} / 160 chars
              </span>
            </div>
            <textarea
              rows={2}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder={shortDescription || 'Concise description appearing under the link in Google...'}
              className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 leading-relaxed"
            />
          </div>

          {/* Canonical URL */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Canonical URL
            </label>
            <input
              type="text"
              value={canonicalUrl}
              onChange={(e) => setCanonicalUrl(e.target.value)}
              placeholder={`https://eurospacenter.com/services/${slug || 'service-slug'}`}
              className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden font-mono text-[11px]"
            />
          </div>

          {/* Robots Meta Directives */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Robots Indexing
              </label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="robotsIndex"
                    checked={robotsIndex === true}
                    onChange={() => setRobotsIndex(true)}
                    className="text-blue-600"
                  />
                  <span>Index (Recommended)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer ml-3">
                  <input
                    type="radio"
                    name="robotsIndex"
                    checked={robotsIndex === false}
                    onChange={() => setRobotsIndex(false)}
                    className="text-blue-600"
                  />
                  <span className="text-amber-700">Noindex</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Robots Follow Links
              </label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="robotsFollow"
                    checked={robotsFollow === true}
                    onChange={() => setRobotsFollow(true)}
                    className="text-blue-600"
                  />
                  <span>Follow</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer ml-3">
                  <input
                    type="radio"
                    name="robotsFollow"
                    checked={robotsFollow === false}
                    onChange={() => setRobotsFollow(false)}
                    className="text-blue-600"
                  />
                  <span className="text-amber-700">Nofollow</span>
                </label>
              </div>
            </div>
          </div>

          {/* Social Open Graph Overrides */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="font-bold text-slate-600 uppercase tracking-wider block text-[10px]">
              Open Graph (Social Sharing) Overrides
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={ogTitle}
                onChange={(e) => setOgTitle(e.target.value)}
                placeholder="OG Title (defaults to SEO Title)"
                className="w-full px-3 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden"
              />
              <input
                type="text"
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                placeholder="OG Image URL (defaults to Featured Image)"
                className="w-full px-3 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Checklist */}
      {activeTab === 'checklist' && (
        <div className="space-y-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-800">
                SEO Advisory Audit Score: {scorePercent}%
              </h4>
              <p className="text-[11px] text-slate-500">
                {scorePercent >= 80 
                  ? 'Strong SEO foundation. Ready for indexing.' 
                  : 'Review the unchecked items below to improve ranking potential.'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-base font-extrabold text-slate-900">{passedCount}/{totalChecks}</span>
              <span className="text-[10px] text-slate-400 block">Passed</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {checklistItems.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  {item.pass ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className={item.pass ? 'text-slate-800 font-semibold' : 'text-slate-700'}>
                      {item.label}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {item.detail}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  item.pass ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {item.pass ? 'Optimal' : 'Needs Attention'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: SERP Preview */}
      {activeTab === 'serp' && (
        <div className="space-y-4 font-sans">
          {/* Google Preview */}
          <div className="bg-[#f8f9fa] p-4 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-[#202124]">
              <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">
                E
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-[#202124]">Euro Spa Center</span>
                <span className="text-[10px] text-[#4d5156] font-mono truncate max-w-sm">
                  {displayUrl}
                </span>
              </div>
            </div>

            <h4 className="text-base font-semibold text-[#1a0dab] hover:underline cursor-pointer leading-snug line-clamp-1 pt-1">
              {displayTitle}
            </h4>

            <p className="text-xs text-[#4d5156] leading-relaxed line-clamp-2">
              {displayDesc}
            </p>
          </div>

          {/* Social Share Preview */}
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white max-w-sm">
            <div className="aspect-16/9 bg-slate-100 overflow-hidden relative">
              {displayOgImage ? (
                <img src={displayOgImage} alt="Social Card" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                  No preview image
                </div>
              )}
              <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                eurospacenter.com
              </span>
            </div>
            <div className="p-3 space-y-1 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                eurospacenter.com
              </span>
              <h5 className="font-bold text-slate-900 line-clamp-1">{ogTitle || displayTitle}</h5>
              <p className="text-slate-600 line-clamp-2 text-[11px]">{ogDescription || displayDesc}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Schema (Structured Data) */}
      {activeTab === 'schema' && (
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Schema.org Service Type
            </label>
            <select
              value={schemaType}
              onChange={(e) => setSchemaType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden"
            >
              <option value="HealthAndBeautyBusiness">HealthAndBeautyBusiness (Recommended)</option>
              <option value="DaySpa">DaySpa</option>
              <option value="Service">Service</option>
              <option value="MedicalBusiness">MedicalBusiness / Therapeutic</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700">
                Generated JSON-LD Structured Data
              </label>
              <span className="text-[10px] text-slate-400">
                Injected into service header schema
              </span>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[10px] overflow-x-auto max-h-56 leading-relaxed">
              {JSON.stringify(generatedSchema, null, 2)}
            </pre>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Custom Schema Override (Optional)
            </label>
            <textarea
              rows={3}
              value={customSchema}
              onChange={(e) => setCustomSchema(e.target.value)}
              placeholder="Paste custom <script type='application/ld+json'>{...}</script> or raw JSON-LD here if needed..."
              className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden font-mono text-[11px]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

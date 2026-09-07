import { Globe, Share2, CheckCircle2, AlertCircle } from 'lucide-react';
import { SPA_INFO } from '../../../data/spaData';

interface AdminSeoPreviewProps {
  title: string;
  slug: string;
  metaDescription: string;
  featuredImage: string;
  focusKeyword?: string;
  content?: string;
}

export function AdminSeoPreview({
  title,
  slug,
  metaDescription,
  featuredImage,
  focusKeyword = '',
  content = ''
}: AdminSeoPreviewProps) {
  const displayTitle = title ? `${title} | ${SPA_INFO.name} Banani` : `Article Title | ${SPA_INFO.name} Banani`;
  const displayUrl = `https://eurospacenter.com/blog/${slug || 'article-slug'}`;
  const displayDesc = metaDescription || 'Add a meta description to preview how your article appears in search engine results and social platforms.';

  // Focus keyword checks
  const keyword = focusKeyword.toLowerCase().trim();
  const inTitle = keyword ? title.toLowerCase().includes(keyword) : false;
  const inSlug = keyword ? slug.toLowerCase().includes(keyword.replace(/\s+/g, '-')) : false;
  const inDesc = keyword ? metaDescription.toLowerCase().includes(keyword) : false;
  const inContent = keyword && content ? content.toLowerCase().includes(keyword) : false;

  const titleLength = title.length;
  const descLength = metaDescription.length;

  return (
    <div className="space-y-4">
      {/* Google Search Snippet Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>Google Search Preview</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Desktop & Mobile SERP</span>
        </div>

        <div className="bg-[#f8f9fa] p-3.5 rounded-xl border border-slate-100 space-y-1 font-sans">
          {/* URL Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#202124] leading-tight">
            <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">
              E
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-[#202124]">Euro Spa Center</span>
              <span className="text-[10px] text-[#4d5156] truncate max-w-[300px] sm:max-w-[420px]">
                {displayUrl}
              </span>
            </div>
          </div>

          {/* SERP Title */}
          <h4 className="text-sm sm:text-base font-semibold text-[#1a0dab] hover:underline cursor-pointer leading-snug line-clamp-1 pt-1">
            {displayTitle}
          </h4>

          {/* SERP Snippet */}
          <p className="text-xs text-[#4d5156] leading-relaxed line-clamp-2 pt-0.5">
            {displayDesc}
          </p>
        </div>

        {/* Character Metrics */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-100 text-[11px]">
          <div>
            <span className="text-slate-500">Title Length: </span>
            <span className={`font-semibold ${titleLength > 60 ? 'text-amber-600' : titleLength >= 30 ? 'text-emerald-600' : 'text-slate-700'}`}>
              {titleLength} / 60 chars
            </span>
          </div>
          <div>
            <span className="text-slate-500">Desc Length: </span>
            <span className={`font-semibold ${descLength > 160 ? 'text-amber-600' : descLength >= 80 ? 'text-emerald-600' : 'text-slate-700'}`}>
              {descLength} / 160 chars
            </span>
          </div>
        </div>
      </div>

      {/* Social Card Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Share2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Social Share Card (Open Graph)</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Facebook / WhatsApp / X</span>
        </div>

        <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
          <div className="aspect-16/9 bg-slate-200 overflow-hidden relative">
            {featuredImage ? (
              <img
                src={featuredImage}
                alt="Social Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                No featured image selected
              </div>
            )}
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold">
              eurospacenter.com
            </div>
          </div>
          <div className="p-3 bg-white space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              eurospacenter.com
            </div>
            <h5 className="text-xs font-bold text-slate-900 line-clamp-1">
              {title || 'Article Title'}
            </h5>
            <p className="text-[11px] text-slate-600 line-clamp-2">
              {displayDesc}
            </p>
          </div>
        </div>
      </div>

      {/* Focus Keyword Checklist */}
      {focusKeyword && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
          <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
            <span>Focus Keyword Analysis: <strong className="text-blue-600">"{focusKeyword}"</strong></span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              {inTitle ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              )}
              <span className={inTitle ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                In Title
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {inSlug ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              )}
              <span className={inSlug ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                In URL Slug
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {inDesc ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              )}
              <span className={inDesc ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                In Meta Description
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {inContent ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              )}
              <span className={inContent ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                In Content Body
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

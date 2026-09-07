import { useState, useEffect, FormEvent } from 'react';
import { X, MapPin, Search, CheckCircle, AlertCircle, Globe } from 'lucide-react';
import { ServiceArea } from '../../../types';

interface AdminServiceAreaEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  area: ServiceArea | null;
  onSave: (areaData: Partial<ServiceArea> & { name: string; slug: string }) => Promise<void>;
  existingSlugs: string[];
}

export function AdminServiceAreaEditorModal({
  isOpen,
  onClose,
  area,
  onSave,
  existingSlugs
}: AdminServiceAreaEditorModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [seoTitle, setSeoTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [displayOrder, setDisplayOrder] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (area) {
      setName(area.name || '');
      setSlug(area.slug || '');
      setShortDescription(area.shortDescription || '');
      setContent(area.content || '');
      setStatus(area.status || 'active');
      setSeoTitle(area.seoTitle || '');
      setMetaDescription(area.metaDescription || '');
      setFocusKeyword(area.focusKeyword || '');
      setDisplayOrder(area.displayOrder || 1);
    } else {
      setName('');
      setSlug('');
      setShortDescription('');
      setContent('');
      setStatus('active');
      setSeoTitle('');
      setMetaDescription('');
      setFocusKeyword('');
      setDisplayOrder(existingSlugs.length + 1);
    }
    setError(null);
  }, [area, isOpen, existingSlugs.length]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    // Auto-generate slug if new area or if slug matches old generated version
    if (!area) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
      if (!seoTitle) {
        setSeoTitle(`Spa & Massage in ${val}, Dhaka | Euro Spa Center`);
      }
      if (!focusKeyword) {
        setFocusKeyword(`Spa in ${val}`);
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');

    if (!cleanName) {
      setError('Location name is required.');
      return;
    }

    if (!cleanSlug) {
      setError('A valid URL slug is required.');
      return;
    }

    // Check duplicate slug
    const isDuplicate = existingSlugs.some(s => s === cleanSlug && (!area || area.slug !== cleanSlug));
    if (isDuplicate) {
      setError(`The slug "/locations/${cleanSlug}" is already in use by another service area.`);
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        ...(area ? { id: area.id } : {}),
        name: cleanName,
        slug: cleanSlug,
        shortDescription: shortDescription.trim(),
        content: content.trim(),
        status,
        seoTitle: seoTitle.trim(),
        metaDescription: metaDescription.trim(),
        focusKeyword: focusKeyword.trim(),
        displayOrder: Number(displayOrder) || 1
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save service area. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {area ? 'Edit Service Area' : 'Add Target Service Area'}
              </h2>
              <p className="text-xs text-slate-500">
                Manage local area targeting and location page architecture
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Area Name & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Area / Locality Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Gulshan, Baridhara"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Recognized locality in Dhaka</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                URL Slug *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">
                  /locations/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="gulshan"
                  required
                  className="w-full pl-24 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">SEO canonical slug</p>
            </div>
          </div>

          {/* Status & Display Order */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Publication Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="active">Active (Public & In Schema)</option>
                <option value="inactive">Inactive (Draft / Hidden)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Inactive locations will not be published</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Display Order
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Lower numbers appear first</p>
            </div>
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Short Description (Listing & Snippet)
            </label>
            <textarea
              rows={2}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Brief 1-2 sentence description explaining spa service availability in this area..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Unique Content for Landing Page Foundation */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Unique Location Content / Editorial Copy
              </label>
              <span className="text-[11px] text-slate-400">Anti-Thin-Content Protection</span>
            </div>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Detailed unique information for this location page: proximity to Euro Spa Center Banani, transport convenience, custom treatment focus for residents in this area..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Provides distinctive editorial content to avoid duplicate or thin location landing pages.
            </p>
          </div>

          {/* SEO Metadata Group */}
          <div className="border-t border-slate-100 pt-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
              <Search className="w-3.5 h-3.5" />
              <span>Location SEO Metadata</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700">SEO Title Tag</label>
                <span className={`text-[10px] ${seoTitle.length > 60 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {seoTitle.length}/60 chars
                </span>
              </div>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="e.g. Spa & Massage in Gulshan, Dhaka | Euro Spa Center"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700">Meta Description</label>
                <span className={`text-[10px] ${metaDescription.length > 155 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {metaDescription.length}/155 chars
                </span>
              </div>
              <textarea
                rows={2}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Targeted meta description for Google SERP snippet..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Focus Keyword</label>
              <input
                type="text"
                value={focusKeyword}
                onChange={(e) => setFocusKeyword(e.target.value)}
                placeholder="e.g. Spa near Gulshan"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{area ? 'Update Area' : 'Create Service Area'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

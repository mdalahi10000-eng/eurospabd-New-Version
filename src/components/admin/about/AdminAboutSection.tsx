import { useState, useEffect, FormEvent } from 'react';
import { User } from 'firebase/auth';
import { 
  Info, 
  Save, 
  CheckCircle2, 
  RefreshCw, 
  Plus, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  Image as ImageIcon, 
  ShieldCheck, 
  RotateCcw,
  Sparkles,
  Award,
  Users
} from 'lucide-react';
import { 
  fetchAboutContent, 
  updateAboutContent, 
  AboutContent, 
  AboutHighlight, 
  DEFAULT_ABOUT_CONTENT 
} from '../../../services/aboutService';

interface AdminAboutSectionProps {
  currentUser: User | null;
}

export function AdminAboutSection({ currentUser }: AdminAboutSectionProps) {
  const [content, setContent] = useState<AboutContent>(DEFAULT_ABOUT_CONTENT);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // New highlight modal/inputs
  const [newHighlightTitle, setNewHighlightTitle] = useState<string>('');
  const [newHighlightDesc, setNewHighlightDesc] = useState<string>('');
  const [showAddHighlight, setShowAddHighlight] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAboutContent();
      setContent(data);
    } catch (err) {
      console.warn('Error loading about content:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await updateAboutContent(content, currentUser?.email || 'admin');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Error saving about content:', err);
      alert('Failed to save About page content to Firestore.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset About page content back to default Euro Spa Center brand copy?')) {
      setContent(DEFAULT_ABOUT_CONTENT);
    }
  };

  const handleAddHighlight = (e: FormEvent) => {
    e.preventDefault();
    if (!newHighlightTitle.trim()) return;

    const newItem: AboutHighlight = {
      id: `hl-${Date.now()}`,
      title: newHighlightTitle.trim(),
      description: newHighlightDesc.trim() || undefined
    };

    setContent(prev => ({
      ...prev,
      highlights: [...prev.highlights, newItem]
    }));

    setNewHighlightTitle('');
    setNewHighlightDesc('');
    setShowAddHighlight(false);
  };

  const handleRemoveHighlight = (id: string) => {
    setContent(prev => ({
      ...prev,
      highlights: prev.highlights.filter(h => h.id !== id)
    }));
  };

  const handleMoveHighlight = (index: number, direction: 'up' | 'down') => {
    const list = [...content.highlights];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    setContent(prev => ({
      ...prev,
      highlights: list
    }));
  };

  const handleUpdateHighlightTitle = (id: string, title: string) => {
    setContent(prev => ({
      ...prev,
      highlights: prev.highlights.map(h => h.id === id ? { ...h, title } : h)
    }));
  };

  const handleUpdateHighlightDesc = (id: string, description: string) => {
    setContent(prev => ({
      ...prev,
      highlights: prev.highlights.map(h => h.id === id ? { ...h, description } : h)
    }));
  };

  if (loading) {
    return (
      <div className="p-12 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading About Section content from Firestore...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {savedSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>About section updated and published live!</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              About Section & Story CMS
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Edit headings, sanctuary introduction, credentials, featured media, and key service pillars.
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
        {/* 1. Main Headings & Paragraphs */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Info className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Headlines & Narrative Text</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                About Section Heading *
              </label>
              <input
                type="text"
                required
                value={content.heading}
                onChange={(e) => setContent(prev => ({ ...prev, heading: e.target.value }))}
                placeholder="About Euro Spa Center"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Subheading / Tagline
              </label>
              <input
                type="text"
                value={content.subheading || ''}
                onChange={(e) => setContent(prev => ({ ...prev, subheading: e.target.value }))}
                placeholder="Banani’s Premier Luxury Wellness Sanctuary"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Primary Overview Paragraph *
              </label>
              <textarea
                rows={4}
                required
                value={content.description}
                onChange={(e) => setContent(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Euro Spa Center is a premier wellness sanctuary situated in Banani, Dhaka..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Secondary Hygiene & Philosophy Paragraph (Optional)
              </label>
              <textarea
                rows={3}
                value={content.secondaryText || ''}
                onChange={(e) => setContent(prev => ({ ...prev, secondaryText: e.target.value }))}
                placeholder="Step into a calm, clean, and private atmosphere crafted for complete physical renewal..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* 2. Featured Image & Metrics */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ImageIcon className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Featured Image & Trust Statistics</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Featured About Image URL
                </label>
                <input
                  type="url"
                  value={content.featuredImage || ''}
                  onChange={(e) => setContent(prev => ({ ...prev, featuredImage: e.target.value }))}
                  placeholder="https://..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Image Alt Text (SEO)
                </label>
                <input
                  type="text"
                  value={content.featuredImageAlt || ''}
                  onChange={(e) => setContent(prev => ({ ...prev, featuredImageAlt: e.target.value }))}
                  placeholder="Euro Spa Center Interior & Ambience"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Years of Experience
                  </label>
                  <input
                    type="text"
                    value={content.yearsOfExperience || ''}
                    onChange={(e) => setContent(prev => ({ ...prev, yearsOfExperience: e.target.value }))}
                    placeholder="8+ Years"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Clients Served
                  </label>
                  <input
                    type="text"
                    value={content.clientsServed || ''}
                    onChange={(e) => setContent(prev => ({ ...prev, clientsServed: e.target.value }))}
                    placeholder="15,000+"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Image Preview Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Featured Image Preview
              </span>
              <div className="relative w-full h-40 rounded-xl overflow-hidden bg-slate-200 border border-slate-300">
                <img
                  src={content.featuredImage || DEFAULT_ABOUT_CONTENT.featuredImage}
                  alt={content.featuredImageAlt || 'Preview'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_ABOUT_CONTENT.featuredImage!;
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Core Highlights & Service Pillars */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Key Pillars & Highlights Card</h3>
                <p className="text-xs text-slate-500">Items displayed in the right-column card on the About section.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddHighlight(true)}
              className="px-3 py-1.5 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Pillar</span>
            </button>
          </div>

          {/* Add Highlight Form */}
          {showAddHighlight && (
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-950">Add New Spa Pillar</span>
                <button
                  type="button"
                  onClick={() => setShowAddHighlight(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newHighlightTitle}
                    onChange={(e) => setNewHighlightTitle(e.target.value)}
                    placeholder="e.g. Certified Female Therapists"
                    className="w-full text-xs p-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Short Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={newHighlightDesc}
                    onChange={(e) => setNewHighlightDesc(e.target.value)}
                    placeholder="e.g. Dedicated certified professionals for all treatments"
                    className="w-full text-xs p-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAddHighlight}
                  className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Add to List
                </button>
              </div>
            </div>
          )}

          {/* Highlights List */}
          <div className="space-y-3">
            {content.highlights.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveHighlight(index, 'up')}
                    className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    title="Move Up"
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === content.highlights.length - 1}
                    onClick={() => handleMoveHighlight(index, 'down')}
                    className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    title="Move Down"
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-xs">
                  {index + 1}
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => handleUpdateHighlightTitle(item.id, e.target.value)}
                    className="text-xs font-semibold p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Pillar Title"
                  />
                  <input
                    type="text"
                    value={item.description || ''}
                    onChange={(e) => handleUpdateHighlightDesc(item.id, e.target.value)}
                    className="text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Short description..."
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveHighlight(item.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Remove highlight"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
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
                <span>Saving to Firestore...</span>
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

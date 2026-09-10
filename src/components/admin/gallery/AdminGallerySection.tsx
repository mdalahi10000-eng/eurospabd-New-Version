import { useState, useEffect, useMemo } from 'react';
import { User } from '../../../supabase';
import { 
  Image as ImageIcon, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ExternalLink,
  Sparkles,
  SlidersHorizontal,
  FolderOpen,
  FileCheck,
  Maximize2
} from 'lucide-react';
import { GalleryImage } from '../../../types';
import { 
  fetchAllGalleryAdmin, 
  toggleGalleryImageStatus, 
  deleteGalleryImage,
  reorderGalleryImages,
  STANDARD_GALLERY_CATEGORIES
} from '../../../services/galleryService';
import { AdminGalleryImageEditorModal } from './AdminGalleryImageEditorModal';
import { AdminGalleryPreviewModal } from './AdminGalleryPreviewModal';

interface AdminGallerySectionProps {
  currentUser: User | null;
}

export function AdminGallerySection({ currentUser }: AdminGallerySectionProps) {
  // Data state
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterMissingAltOnly, setFilterMissingAltOnly] = useState(false);

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);

  const [previewImage, setPreviewImage] = useState<GalleryImage | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Delete confirmation
  const [deletingImage, setDeletingImage] = useState<GalleryImage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reordering in progress
  const [isReordering, setIsReordering] = useState(false);

  // Toast notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load all images from database
  const loadImages = async () => {
    setRefreshing(true);
    try {
      const data = await fetchAllGalleryAdmin();
      setImages(data);
    } catch (err: any) {
      console.error('Error fetching gallery photos:', err);
      showToast('Failed to load gallery photos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  // Compute unique categories present in current images + standard options
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>(STANDARD_GALLERY_CATEGORIES);
    images.forEach(img => {
      if (img.category) set.add(img.category);
    });
    return Array.from(set);
  }, [images]);

  // Filtered images calculation
  const filteredImages = useMemo(() => {
    return images.filter(img => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = img.title?.toLowerCase().includes(q);
        const matchesAlt = img.altText?.toLowerCase().includes(q);
        const matchesCaption = img.caption?.toLowerCase().includes(q);
        const matchesDesc = img.description?.toLowerCase().includes(q);
        const matchesCat = img.category?.toLowerCase().includes(q);
        const matchesFile = img.fileName?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesAlt && !matchesCaption && !matchesDesc && !matchesCat && !matchesFile) {
          return false;
        }
      }

      // 2. Category filter
      if (selectedCategory !== 'All' && img.category !== selectedCategory) {
        return false;
      }

      // 3. Status filter
      if (statusFilter !== 'all' && img.status !== statusFilter) {
        return false;
      }

      // 4. Missing ALT text filter
      if (filterMissingAltOnly) {
        const hasAlt = Boolean(img.altText && img.altText.trim().length > 0);
        if (hasAlt) return false;
      }

      return true;
    });
  }, [images, searchQuery, selectedCategory, statusFilter, filterMissingAltOnly]);

  // Overview metrics
  const stats = useMemo(() => {
    const total = images.length;
    const active = images.filter(i => i.status === 'active').length;
    const inactive = total - active;
    const missingAlt = images.filter(i => !i.altText || !i.altText.trim()).length;
    return { total, active, inactive, missingAlt, categoriesCount: uniqueCategories.length };
  }, [images, uniqueCategories]);

  // Action: Toggle Active / Inactive status
  const handleToggleStatus = async (img: GalleryImage) => {
    try {
      const newStatus = await toggleGalleryImageStatus(img);
      setImages(prev => prev.map(item => item.id === img.id ? { ...item, status: newStatus } : item));
      showToast(`Photo "${img.title}" is now ${newStatus === 'active' ? 'Active' : 'Inactive'}.`);
    } catch (err: any) {
      console.error('Error toggling status:', err);
      showToast('Error updating photo status.');
    }
  };

  // Action: Delete confirmed
  const handleConfirmDelete = async () => {
    if (!deletingImage) return;
    setIsDeleting(true);
    try {
      await deleteGalleryImage(deletingImage.id, deletingImage.storagePath);
      setImages(prev => prev.filter(item => item.id !== deletingImage.id));
      showToast(`Photo "${deletingImage.title}" deleted.`);
      setDeletingImage(null);
    } catch (err: any) {
      console.error('Error deleting photo:', err);
      showToast('Error deleting photo.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Action: Move photo order (Up or Down)
  const handleMoveOrder = async (indexInFiltered: number, direction: 'up' | 'down') => {
    const targetFiltered = filteredImages[indexInFiltered];
    const targetIdxInAll = images.findIndex(i => i.id === targetFiltered.id);
    if (targetIdxInAll === -1) return;

    const swapIdxInAll = direction === 'up' ? targetIdxInAll - 1 : targetIdxInAll + 1;
    if (swapIdxInAll < 0 || swapIdxInAll >= images.length) return;

    const reordered = [...images];
    const [moved] = reordered.splice(targetIdxInAll, 1);
    reordered.splice(swapIdxInAll, 0, moved);

    // Update local state immediately for snappy UI
    setImages(reordered);

    // Persist to Supabase
    setIsReordering(true);
    try {
      const ids = reordered.map(i => i.id);
      await reorderGalleryImages(ids);
      showToast('Gallery display order updated.');
    } catch (err) {
      console.error('Error updating order:', err);
      showToast('Failed to save reorder. Reverting.');
      loadImages();
    } finally {
      setIsReordering(false);
    }
  };

  // Callback on successful save from Editor modal
  const handleImageSaved = (saved: GalleryImage) => {
    setImages(prev => {
      const idx = prev.findIndex(i => i.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      } else {
        return [saved, ...prev];
      }
    });
    showToast(`Photo "${saved.title}" saved successfully.`);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Media & Gallery CMS
              </h1>
              <p className="text-xs text-slate-500">
                Manage visual assets, SEO ALT attributes, and display categories for Euro Spa Center
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadImages}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
            title="Refresh gallery images from database"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={() => {
              setEditingImage(null);
              setIsEditorOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Photo</span>
          </button>
        </div>
      </div>

      {/* High-Level SEO & Media Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500">Total Media</span>
            <FolderOpen className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{stats.total}</p>
          <span className="text-[11px] text-slate-400">Authentic spa photos</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500">Active Online</span>
            <Eye className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">{stats.active}</p>
          <span className="text-[11px] text-slate-400">Visible on public site</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500">Inactive / Hidden</span>
            <EyeOff className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-600">{stats.inactive}</p>
          <span className="text-[11px] text-slate-400">Draft or paused media</span>
        </div>

        <div className={`p-4 rounded-2xl border shadow-2xs ${stats.missingAlt > 0 ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold ${stats.missingAlt > 0 ? 'text-amber-800' : 'text-slate-500'}`}>
              Missing ALT (SEO)
            </span>
            <FileCheck className={`w-4 h-4 ${stats.missingAlt > 0 ? 'text-amber-600' : 'text-emerald-500'}`} />
          </div>
          <p className={`text-2xl font-extrabold ${stats.missingAlt > 0 ? 'text-amber-700' : 'text-emerald-600'}`}>
            {stats.missingAlt}
          </p>
          <span className={`text-[11px] ${stats.missingAlt > 0 ? 'text-amber-700 font-medium' : 'text-slate-400'}`}>
            {stats.missingAlt > 0 ? 'Action needed for SEO' : '100% ALT optimized!'}
          </span>
        </div>
      </div>

      {/* Search, Status Tabs & Category Filters */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3.5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search photos by title, ALT text, category, or filename..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({images.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({stats.active})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === 'inactive'
                  ? 'bg-white text-slate-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inactive ({stats.inactive})
            </button>
          </div>

          {/* SEO ALT Filter Toggle */}
          <button
            onClick={() => setFilterMissingAltOnly(!filterMissingAltOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              filterMissingAltOnly
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Missing ALT Only</span>
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category:
          </span>

          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>

          {uniqueCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Gallery Media Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium">Loading gallery assets...</p>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-slate-800 mb-1">No gallery photos match your filter</h3>
          <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
            Try adjusting your search query, changing the category, or clear filters to view all authentic photos.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setStatusFilter('all');
              setFilterMissingAltOnly(false);
            }}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Showing {filteredImages.length} of {images.length} photos</span>
            {isReordering && (
              <span className="text-blue-600 font-semibold flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Saving order...
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredImages.map((img, index) => {
              const hasAlt = Boolean(img.altText && img.altText.trim().length > 0);
              const isActive = img.status === 'active';

              return (
                <div
                  key={img.id}
                  className={`group bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col shadow-2xs hover:shadow-md ${
                    isActive ? 'border-slate-200 hover:border-blue-400' : 'border-slate-300/80 bg-slate-50/40 opacity-85'
                  }`}
                >
                  {/* Photo Thumbnail with Overlays */}
                  <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                    <img
                      src={img.image}
                      alt={img.altText || img.title}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Dark gradient shadow on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Top Status & ALT Badges */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
                      {/* Active / Inactive Badge */}
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs backdrop-blur-xs ${
                          isActive
                            ? 'bg-emerald-600/90 text-white'
                            : 'bg-slate-800/85 text-slate-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
                        {isActive ? 'Active' : 'Inactive'}
                      </span>

                      {/* ALT status badge */}
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs backdrop-blur-xs ${
                          hasAlt
                            ? 'bg-emerald-700/90 text-white'
                            : 'bg-amber-600/95 text-white animate-bounce'
                        }`}
                        title={hasAlt ? `ALT: ${img.altText}` : 'Missing ALT text! Please edit to add ALT description for SEO.'}
                      >
                        {hasAlt ? (
                          <>
                            <FileCheck className="w-3 h-3" />
                            <span>ALT OK</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3" />
                            <span>No ALT</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Quick Preview Button (Zoom) */}
                    <button
                      onClick={() => {
                        setPreviewImage(img);
                        setIsPreviewOpen(true);
                      }}
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer bg-black/20"
                      title="Inspect photo preview"
                    >
                      <span className="p-2 rounded-xl bg-white/90 text-slate-900 shadow-md transform group-hover:scale-105 transition-transform">
                        <Maximize2 className="w-4 h-4" />
                      </span>
                    </button>

                    {/* Bottom Order Badge */}
                    <div className="absolute bottom-2 left-2.5 pointer-events-none">
                      <span className="text-[10px] font-mono font-semibold bg-black/60 text-white px-2 py-0.5 rounded-md backdrop-blur-xs">
                        #{img.displayOrder ?? index}
                      </span>
                    </div>
                  </div>

                  {/* Card Content Details */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                          {img.category}
                        </span>
                        {img.fileSize && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {(img.fileSize / 1024).toFixed(0)} KB
                          </span>
                        )}
                      </div>

                      <h3 
                        className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 leading-snug cursor-pointer hover:text-blue-600"
                        onClick={() => {
                          setPreviewImage(img);
                          setIsPreviewOpen(true);
                        }}
                      >
                        {img.title}
                      </h3>

                      {img.caption && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {img.caption}
                        </p>
                      )}

                      {/* ALT preview snippet */}
                      <p className={`text-[10px] line-clamp-1 mt-1 font-sans ${hasAlt ? 'text-slate-400 italic' : 'text-amber-600 font-medium'}`}>
                        {hasAlt ? `ALT: "${img.altText}"` : '⚠️ Missing ALT text (SEO warning)'}
                      </p>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-slate-600">
                      {/* Reorder Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveOrder(index, 'up')}
                          disabled={index === 0}
                          className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 text-slate-500 hover:text-slate-900 cursor-pointer"
                          title="Move order earlier (Left/Up)"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveOrder(index, 'down')}
                          disabled={index === filteredImages.length - 1}
                          className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 text-slate-500 hover:text-slate-900 cursor-pointer"
                          title="Move order later (Right/Down)"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Status Toggle / Edit / Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleStatus(img)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isActive
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-slate-400 hover:bg-slate-100'
                          }`}
                          title={isActive ? 'Deactivate (Hide from public website)' : 'Activate (Show on public website)'}
                        >
                          {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => {
                            setEditingImage(img);
                            setIsEditorOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit Photo Details & ALT Text"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeletingImage(img)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 1. Edit / Upload Modal */}
      <AdminGalleryImageEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingImage(null);
        }}
        onSaved={handleImageSaved}
        editingImage={editingImage}
        existingCategories={uniqueCategories}
      />

      {/* 2. Photo Lightbox / Inspector Preview Modal */}
      <AdminGalleryPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewImage(null);
        }}
        image={previewImage}
        onEdit={(img) => {
          setEditingImage(img);
          setIsEditorOpen(true);
        }}
        onToggleStatus={handleToggleStatus}
      />

      {/* 3. Delete Confirmation Dialog */}
      {deletingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>

            <div>
              <h3 className="font-bold text-sm text-slate-900">Delete Photo?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete <strong className="text-slate-800">"{deletingImage.title}"</strong>? This will remove it from the public website and gallery database.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeletingImage(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
              >
                {isDeleting ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

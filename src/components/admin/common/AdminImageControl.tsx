import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { 
  Upload, 
  Trash2, 
  RefreshCw, 
  ExternalLink, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Link as LinkIcon,
  ShieldCheck
} from 'lucide-react';
import { 
  uploadToSupabaseStorage, 
  deleteFromSupabaseStorage, 
  extractSupabaseStoragePath,
  isSupabaseConfigured 
} from '../../../supabase';

export interface AdminImageControlProps {
  label: string;
  description?: string;
  imageUrl: string;
  defaultFallbackUrl?: string;
  altText?: string;
  onAltTextChange?: (alt: string) => void;
  storageFolder: 'homepage' | 'about';
  aspectRatio?: 'video' | 'square' | 'banner' | 'wide' | 'auto';
  recommendedDimensions?: string;
  onChange: (newUrl: string) => void;
  onSaveImmediate?: (newUrl: string) => Promise<void>;
  disabled?: boolean;
}

export function AdminImageControl({
  label,
  description,
  imageUrl,
  defaultFallbackUrl,
  altText,
  onAltTextChange,
  storageFolder,
  aspectRatio = 'video',
  recommendedDimensions = 'JPG, PNG, WEBP up to 10MB',
  onChange,
  onSaveImmediate,
  disabled = false
}: AdminImageControlProps) {
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [customUrlInput, setCustomUrlInput] = useState<string>(imageUrl || '');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<boolean>(false);
  const [savingImmediate, setSavingImmediate] = useState<boolean>(false);
  const [imgLoadError, setImgLoadError] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasImage = Boolean(imageUrl && imageUrl.trim().length > 0);
  const isSupabaseAsset = Boolean(imageUrl && (imageUrl.includes('/spa-assets/') || imageUrl.includes('supabase')));

  // Aspect ratio classes for preview
  const aspectClasses = {
    square: 'aspect-square max-w-[180px]',
    video: 'aspect-video w-full',
    banner: 'aspect-[2.8/1] w-full',
    wide: 'aspect-[21/9] w-full',
    auto: 'h-44 w-full'
  }[aspectRatio];

  const handleFileSelect = async (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 10MB limit. Please choose a smaller image.');
      return;
    }

    // Validate mime type
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WEBP, GIF, SVG).');
      return;
    }

    setUploading(true);
    setUploadProgress(15);

    const progressTimer = setInterval(() => {
      setUploadProgress(prev => (prev < 85 ? prev + 15 : prev));
    }, 150);

    try {
      const oldUrl = imageUrl;
      const { url: uploadedUrl, error } = await uploadToSupabaseStorage(
        storageFolder,
        file.name,
        file,
        'spa-assets'
      );

      clearInterval(progressTimer);

      if (error || !uploadedUrl) {
        throw new Error(error?.message || 'Failed to upload image to Supabase Storage.');
      }

      setUploadProgress(100);
      setImgLoadError(false);
      setSuccessMsg('Image uploaded to Supabase Storage (spa-assets)!');
      setCustomUrlInput(uploadedUrl);
      onChange(uploadedUrl);

      // Safe clean up of old Supabase asset if it was stored in spa-assets
      if (oldUrl && oldUrl !== uploadedUrl) {
        const oldStoragePath = extractSupabaseStoragePath(oldUrl, 'spa-assets');
        if (oldStoragePath) {
          deleteFromSupabaseStorage('spa-assets', oldStoragePath).catch(() => {});
        }
      }

      // If immediate save callback provided, trigger it
      if (onSaveImmediate) {
        setSavingImmediate(true);
        try {
          await onSaveImmediate(uploadedUrl);
          setSuccessMsg('Image uploaded and saved to Supabase database!');
        } catch (saveErr: any) {
          setErrorMsg(`Uploaded, but failed to auto-save: ${saveErr?.message || 'Error'}`);
        } finally {
          setSavingImmediate(false);
        }
      }

      setTimeout(() => {
        setSuccessMsg(null);
        setUploadProgress(0);
      }, 4000);
    } catch (err: any) {
      clearInterval(progressTimer);
      console.error('[AdminImageControl] Upload error:', err);
      setErrorMsg(err.message || 'Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || uploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleApplyCustomUrl = async () => {
    const trimmed = customUrlInput.trim();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (trimmed && !trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
      setErrorMsg('Please enter a valid HTTP or HTTPS image URL.');
      return;
    }

    const oldUrl = imageUrl;
    setImgLoadError(false);
    onChange(trimmed);
    setShowUrlInput(false);
    setSuccessMsg('Image URL updated!');

    // If changing away from old Supabase asset, clean up
    if (oldUrl && oldUrl !== trimmed) {
      const oldStoragePath = extractSupabaseStoragePath(oldUrl, 'spa-assets');
      if (oldStoragePath) {
        deleteFromSupabaseStorage('spa-assets', oldStoragePath).catch(() => {});
      }
    }

    if (onSaveImmediate) {
      setSavingImmediate(true);
      try {
        await onSaveImmediate(trimmed);
        setSuccessMsg('Image URL updated and saved to Supabase!');
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to save URL');
      } finally {
        setSavingImmediate(false);
      }
    }

    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleConfirmRemove = async () => {
    setShowRemoveConfirm(false);
    setErrorMsg(null);
    setSuccessMsg(null);

    const oldUrl = imageUrl;
    onChange('');
    setCustomUrlInput('');
    setImgLoadError(false);
    setSuccessMsg('Image removed. Public page will display the safe fallback.');

    // Delete from Supabase Storage if it was uploaded there
    if (oldUrl) {
      const oldStoragePath = extractSupabaseStoragePath(oldUrl, 'spa-assets');
      if (oldStoragePath) {
        try {
          await deleteFromSupabaseStorage('spa-assets', oldStoragePath);
        } catch (delErr) {
          console.warn('[AdminImageControl] File deletion notice:', delErr);
        }
      }
    }

    if (onSaveImmediate) {
      setSavingImmediate(true);
      try {
        await onSaveImmediate('');
        setSuccessMsg('Image removed and updated in Supabase database!');
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to save removal');
      } finally {
        setSavingImmediate(false);
      }
    }

    setTimeout(() => setSuccessMsg(null), 3500);
  };

  return (
    <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
      {/* Top Header & Labels */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-bold text-slate-900">{label}</span>
            {isSupabaseAsset ? (
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Supabase: spa-assets</span>
              </span>
            ) : hasImage ? (
              <span className="text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                External / CDN URL
              </span>
            ) : (
              <span className="text-[10px] font-medium bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded-full">
                No Image (Safe Fallback)
              </span>
            )}
          </div>
          {description && (
            <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
          )}
        </div>

        <div className="text-[10px] text-slate-400 font-mono">
          {recommendedDimensions}
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span className="flex-1">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="flex-1">{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Upload Progress Indicator */}
      {uploading && (
        <div className="p-3.5 bg-blue-50/90 border border-blue-200 rounded-xl space-y-2 animate-fade-in">
          <div className="flex items-center justify-between text-xs text-blue-900 font-semibold">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span>Uploading to Supabase Storage bucket &apos;spa-assets&apos;...</span>
            </div>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-blue-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-200 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Controls Split: Preview Card & Action Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* 1. Image Preview Box */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`relative ${aspectClasses} rounded-2xl overflow-hidden border-2 transition-all group ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50/50 scale-[1.01]' 
                : hasImage && !imgLoadError
                  ? 'border-slate-200 bg-slate-100 shadow-xs' 
                  : 'border-dashed border-slate-300 bg-white'
            }`}
          >
            {hasImage && !imgLoadError ? (
              <>
                <img
                  src={imageUrl}
                  alt={altText || label}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  onError={() => setImgLoadError(true)}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
                  <a
                    href={imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-white/90 hover:bg-white text-slate-800 rounded-xl shadow-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Open full size in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Full</span>
                  </a>
                </div>
              </>
            ) : (
              <div className="w-full h-full min-h-[140px] flex flex-col items-center justify-center p-4 text-center text-slate-400 space-y-1.5">
                <ImageIcon className="w-8 h-8 text-slate-300" />
                <span className="text-xs font-medium text-slate-500">
                  {imgLoadError ? 'Image failed to load' : 'No image selected'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {defaultFallbackUrl ? 'Using public fallback' : 'Drop a photo or click Upload'}
                </span>
              </div>
            )}
          </div>

          {hasImage && (
            <div className="w-full mt-1.5 text-center">
              <span className="text-[10px] text-slate-400 truncate block max-w-full" title={imageUrl}>
                {imageUrl.substring(imageUrl.lastIndexOf('/') + 1) || 'image'}
              </span>
            </div>
          )}
        </div>

        {/* 2. Action Controls: Upload, Replace, URL, Remove */}
        <div className="md:col-span-7 space-y-3">
          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif"
              className="hidden"
              disabled={disabled || uploading}
            />

            {/* Upload / Replace Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{hasImage ? 'Change / Replace Image' : 'Upload Image from Device'}</span>
            </button>

            {/* Direct URL Input Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setShowUrlInput(prev => !prev);
                setCustomUrlInput(imageUrl || '');
              }}
              disabled={disabled || uploading}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>{showUrlInput ? 'Hide URL Input' : 'Direct URL'}</span>
            </button>

            {/* Remove Image Button */}
            {hasImage && (
              <button
                type="button"
                onClick={() => setShowRemoveConfirm(true)}
                disabled={disabled || uploading}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
                title="Remove image from CMS and safe-delete from Supabase Storage"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Remove Image</span>
              </button>
            )}
          </div>

          {/* Optional Direct URL Input Field */}
          {showUrlInput && (
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 animate-fade-in shadow-2xs">
              <label className="block text-[11px] font-bold text-slate-700">
                Direct Image URL (External CDN or Web Link)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="https://images.example.com/photo.jpg"
                  className="flex-1 text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomUrl}
                  disabled={uploading || !customUrlInput.trim()}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                  Apply URL
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Tip: You can paste high-res CDN photos, Google Business image links, or custom URLs.
              </p>
            </div>
          )}

          {/* Alt Text (SEO) Field */}
          {onAltTextChange !== undefined && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Image Alt Text (for SEO & Accessibility)
              </label>
              <input
                type="text"
                value={altText || ''}
                onChange={(e) => onAltTextChange(e.target.value)}
                placeholder="Descriptive keywords (e.g. Euro Spa Luxury VIP Suite Banani)"
                className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Immediate Save Status if configured */}
          {savingImmediate && (
            <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Saving changes directly to Supabase...</span>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal: Remove Image */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Remove {label}?</h4>
                <p className="text-xs text-slate-500">This action will unbind the image from the CMS record.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-700">What happens on public website:</p>
              <p>• The public page will cleanly display an elegant wellness placeholder or default brand asset.</p>
              {isSupabaseAsset && (
                <p>• The asset file will be safely deleted from the &apos;spa-assets&apos; bucket to keep storage clean.</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRemoveConfirm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Remove Image</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

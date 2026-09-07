import { useState, useEffect, useRef, ChangeEvent, DragEvent, FormEvent } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Sparkles, 
  Link as LinkIcon, 
  RefreshCw,
  Eye,
  FileCheck
} from 'lucide-react';
import { GalleryImage } from '../../../types';
import { 
  STANDARD_GALLERY_CATEGORIES, 
  uploadGalleryFile, 
  createGalleryImage, 
  updateGalleryImage,
  generateSeoImageFilename
} from '../../../services/galleryService';
import { SPA_INFO } from '../../../data/spaData';

interface AdminGalleryImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (image: GalleryImage) => void;
  editingImage?: GalleryImage | null;
  existingCategories?: string[];
}

export function AdminGalleryImageEditorModal({
  isOpen,
  onClose,
  onSaved,
  editingImage,
  existingCategories = []
}: AdminGalleryImageEditorModalProps) {
  // Mode
  const isEditing = Boolean(editingImage);

  // Form states
  const [title, setTitle] = useState('');
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Spa Interior');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileWarning, setFileWarning] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // UI helpers
  const [isUrlInputMode, setIsUrlInputMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Combine standard categories with any custom ones already in use
  const allCategoryOptions = Array.from(
    new Set([...STANDARD_GALLERY_CATEGORIES, ...existingCategories])
  );

  // Populate form on open/change
  useEffect(() => {
    if (!isOpen) return;

    if (editingImage) {
      setTitle(editingImage.title || '');
      setAltText(editingImage.altText || '');
      setCaption(editingImage.caption || '');
      setDescription(editingImage.description || '');
      setImageUrl(editingImage.image || '');
      setFilePreview(editingImage.image || '');
      setDisplayOrder(editingImage.displayOrder ?? 0);
      setStatus(editingImage.status || 'active');

      if (allCategoryOptions.includes(editingImage.category)) {
        setCategory(editingImage.category);
        setIsCustomCategoryMode(false);
      } else {
        setCategory('custom');
        setCustomCategory(editingImage.category);
        setIsCustomCategoryMode(true);
      }
    } else {
      // Defaults for new image
      setTitle('');
      setAltText('');
      setCaption('');
      setDescription('');
      setImageUrl('');
      setFilePreview('');
      setDisplayOrder(0);
      setStatus('active');
      setCategory('Spa Interior');
      setIsCustomCategoryMode(false);
      setCustomCategory('');
    }

    setSelectedFile(null);
    setUploadProgress(null);
    setIsUploading(false);
    setFileError(null);
    setFileWarning(null);
    setErrorMessage(null);
    setIsUrlInputMode(false);
  }, [isOpen, editingImage]);

  if (!isOpen) return null;

  // Validate & handle file selection
  const handleFileValidationAndPreview = (file: File) => {
    setFileError(null);
    setFileWarning(null);

    // 1. Format check: WebP, JPEG, PNG
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setFileError('Unsupported file format. Please upload WebP, JPEG, or PNG images.');
      return;
    }

    // 2. Max size check (10MB)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setFileError('File size exceeds the 10 MB limit. Please compress or resize the photo.');
      return;
    }

    // 3. Large size warning (if > 2MB)
    const warnSizeBytes = 2 * 1024 * 1024;
    if (file.size > warnSizeBytes) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setFileWarning(`Photo is ${mb} MB. Large photos may slightly increase initial mobile page load times.`);
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFilePreview(objectUrl);

    // Auto-suggest title and ALT text if empty
    if (!title.trim()) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
      setTitle(cleanName);
      if (!altText.trim()) {
        setAltText(`${cleanName} at ${SPA_INFO.name}, Banani`);
      }
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileValidationAndPreview(e.target.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileValidationAndPreview(e.dataTransfer.files[0]);
    }
  };

  // Generate recommended ALT text
  const handleAutoSuggestAlt = () => {
    const finalCategory = isCustomCategoryMode ? customCategory : category;
    if (title.trim()) {
      setAltText(`${title.trim()} - ${finalCategory} suite at ${SPA_INFO.name}, Road 6 Banani`);
    } else {
      setAltText(`Relaxing spa ambience and therapy suites at ${SPA_INFO.name} Banani, Dhaka`);
    }
  };

  // Form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validations
    if (!title.trim()) {
      setErrorMessage('Please enter an image title.');
      return;
    }

    // Recommended ALT text
    if (!altText.trim()) {
      setErrorMessage('ALT text is required for SEO & accessibility compliance. Describe what is visible in the photo.');
      return;
    }

    const finalCategory = isCustomCategoryMode ? customCategory.trim() : category;
    if (!finalCategory) {
      setErrorMessage('Please select or specify an image category.');
      return;
    }

    // Need either an uploaded file or an image URL
    if (!selectedFile && !imageUrl.trim() && !filePreview) {
      setErrorMessage('Please upload an image file or provide an image URL.');
      return;
    }

    try {
      setSaving(true);

      let finalImageUrl = imageUrl.trim();
      let storagePath = editingImage?.storagePath || '';
      let fileName = editingImage?.fileName || '';
      let fileSize = editingImage?.fileSize;
      let mimeType = editingImage?.mimeType;

      // Handle file upload if a new file was chosen
      if (selectedFile) {
        setIsUploading(true);
        const imageDocId = editingImage?.id || `photo_${Date.now()}`;
        const uploadResult = await uploadGalleryFile(
          selectedFile,
          imageDocId,
          title,
          (pct) => setUploadProgress(pct)
        );

        finalImageUrl = uploadResult.downloadUrl;
        storagePath = uploadResult.storagePath;
        fileName = uploadResult.fileName;
        fileSize = uploadResult.fileSize;
        mimeType = uploadResult.mimeType;
      }

      if (!finalImageUrl) {
        throw new Error('Image URL could not be resolved. Please re-select the file or verify URL.');
      }

      const payload: Omit<GalleryImage, 'id'> = {
        title: title.trim(),
        altText: altText.trim(),
        caption: caption.trim(),
        description: description.trim(),
        category: finalCategory,
        image: finalImageUrl,
        displayOrder: Number(displayOrder) || 0,
        status,
        storagePath,
        fileName: fileName || generateSeoImageFilename(title),
        fileSize,
        mimeType
      };

      if (isEditing && editingImage) {
        await updateGalleryImage(editingImage.id, payload);
        onSaved({ ...payload, id: editingImage.id });
      } else {
        const newId = await createGalleryImage(payload);
        onSaved({ ...payload, id: newId });
      }

      onClose();
    } catch (err: any) {
      console.error('Error saving gallery image:', err);
      setErrorMessage(err.message || 'Failed to save image. Please check your connection.');
    } finally {
      setSaving(false);
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {isEditing ? 'Edit Gallery Media' : 'Upload New Gallery Photo'}
              </h2>
              <p className="text-xs text-slate-500">
                Configure SEO attributes, ALT text, and categorization for the Euro Spa Center gallery
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-sm">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Image Upload / Source Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span>Photo File / Source</span>
                <span className="text-rose-500">*</span>
              </label>

              <button
                type="button"
                onClick={() => setIsUrlInputMode(!isUrlInputMode)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>{isUrlInputMode ? 'Upload from Computer' : 'Enter Direct Image URL'}</span>
              </button>
            </div>

            {!isUrlInputMode ? (
              <div>
                {/* Drag & Drop Upload Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50/60 scale-[0.99]'
                      : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/webp, image/jpeg, image/png, image/jpg"
                    onChange={onFileInputChange}
                    className="hidden"
                  />

                  {filePreview ? (
                    <div className="flex flex-col sm:flex-row items-center gap-4 text-left">
                      <div className="relative w-36 h-28 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0 shadow-xs">
                        <img
                          src={filePreview}
                          alt="Preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-md font-mono">
                          Preview
                        </span>
                      </div>

                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <p className="font-semibold text-xs text-slate-800 truncate">
                            {selectedFile ? selectedFile.name : (editingImage?.fileName || 'Image Selected')}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500">
                          {selectedFile
                            ? `${(selectedFile.size / 1024).toFixed(0)} KB • ${selectedFile.type}`
                            : 'Existing gallery image loaded'}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                        >
                          Choose another file to replace
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-sm text-slate-800 mb-1">
                        Click to browse or drag and drop your photo here
                      </p>
                      <p className="text-xs text-slate-500 mb-2">
                        Supported formats: WebP, JPEG, PNG (Max 10 MB)
                      </p>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        Preserves crisp photographic clarity without quality loss
                      </span>
                    </div>
                  )}
                </div>

                {/* Upload Progress Bar */}
                {isUploading && uploadProgress !== null && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-blue-700">
                      <span>Uploading to Firebase Storage...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Warnings / Errors */}
                {fileError && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {fileError}
                  </p>
                )}
                {fileWarning && (
                  <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1 font-medium">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    {fileWarning}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setFilePreview(e.target.value);
                  }}
                  placeholder="https://images.fresha.com/... or https://lh3.googleusercontent.com/..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {filePreview && (
                  <div className="w-32 h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                    <img
                      src={filePreview}
                      alt="URL Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={() => setFileError('Image URL could not be loaded.')}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Title & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-800 text-xs uppercase tracking-wider mb-1.5">
                Image Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. VIP Double Therapy Suite"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Human-friendly name displayed in media library and modal headers
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 text-xs uppercase tracking-wider mb-1.5">
                Gallery Category <span className="text-rose-500">*</span>
              </label>
              {!isCustomCategoryMode ? (
                <div className="flex gap-2">
                  <select
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === '__add_custom__') {
                        setIsCustomCategoryMode(true);
                      } else {
                        setCategory(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    {allCategoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__add_custom__">+ Create Custom Category...</option>
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="e.g. Hydrotherapy, VIP Lounge"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomCategoryMode(false)}
                    className="px-2.5 py-2.5 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <span className="text-[11px] text-slate-400 mt-1 block">
                Controls filter tabs on the public website and admin dashboard
              </span>
            </div>
          </div>

          {/* 3. SEO & ACCESSIBILITY SECTION: ALT TEXT */}
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <label className="font-bold text-amber-900 text-xs uppercase tracking-wider">
                  ALT Text (SEO & Accessibility) <span className="text-rose-500">*</span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleAutoSuggestAlt}
                className="text-xs font-semibold text-amber-800 hover:text-amber-900 underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Auto-Suggest Clean ALT</span>
              </button>
            </div>

            <textarea
              rows={2}
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="e.g. Spotless twin massage suite with calming purple mood lighting, pristine linens, and armchairs at Euro Spa Center Banani."
              className="w-full px-3.5 py-2 border border-amber-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              required
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-amber-800 gap-1.5">
              <p className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                <span>
                  Describe what the photo genuinely depicts. Avoid unnatural keyword stuffing.
                </span>
              </p>
              <span className={`font-mono text-xs font-semibold ${altText.length > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {altText.length} characters
              </span>
            </div>
          </div>

          {/* 4. Caption & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-800 text-xs uppercase tracking-wider mb-1.5">
                Caption
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Short caption under photo preview"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Shown below the photo when enlarged in full-screen modal
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 text-xs uppercase tracking-wider mb-1.5">
                Display Order
              </label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Lower numbers appear first (0, 1, 2, 3...)
              </span>
            </div>
          </div>

          {/* 5. Detailed Description */}
          <div>
            <label className="block font-semibold text-slate-800 text-xs uppercase tracking-wider mb-1.5">
              Description (Contextual Details)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any additional background or operational details about this facility or treatment room..."
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* 6. Active / Inactive Status Switch */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <div>
                <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                  {status === 'active' ? 'Active on Public Website' : 'Inactive (Hidden from Public Website)'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {status === 'active'
                    ? 'Visitors will be able to browse this photo in the gallery.'
                    : 'Only visible to administrators in this CMS panel.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStatus(status === 'active' ? 'inactive' : 'active')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer ${
                status === 'active'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {status === 'active' ? 'Visible' : 'Hidden'}
            </button>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || isUploading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{isUploading ? 'Uploading & Saving...' : 'Saving Photo...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEditing ? 'Update Photo' : 'Upload & Save'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

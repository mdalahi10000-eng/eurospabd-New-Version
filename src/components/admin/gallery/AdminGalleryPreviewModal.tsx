import { useEffect } from 'react';
import { 
  X, 
  Tag, 
  FileText, 
  FileCheck, 
  Eye, 
  EyeOff, 
  Edit3, 
  ExternalLink, 
  Layers,
  Calendar,
  HardDrive
} from 'lucide-react';
import { GalleryImage } from '../../../types';

interface AdminGalleryPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: GalleryImage | null;
  onEdit: (image: GalleryImage) => void;
  onToggleStatus: (image: GalleryImage) => void;
}

export function AdminGalleryPreviewModal({
  isOpen,
  onClose,
  image,
  onEdit,
  onToggleStatus
}: AdminGalleryPreviewModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !image) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh] border border-slate-200">
        {/* Left Side: Enlarged Photo Display */}
        <div className="relative flex-1 bg-slate-900 flex items-center justify-center min-h-[300px] md:min-h-[460px] p-4 select-none">
          <img
            src={image.image}
            alt={image.altText || image.title}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
          />

          {/* Floating Status Badge */}
          <div className="absolute top-4 left-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                image.status === 'active'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700 text-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${image.status === 'active' ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
              {image.status === 'active' ? 'Active on Public Site' : 'Inactive / Hidden'}
            </span>
          </div>
        </div>

        {/* Right Side: Metadata Inspector */}
        <div className="w-full md:w-80 lg:w-96 flex flex-col border-t md:border-t-0 md:border-l border-slate-100 bg-white">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                Photo Inspection
              </span>
              <h3 className="text-sm font-bold text-slate-900 truncate max-w-[200px]">
                {image.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Details list */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs text-slate-600">
            {/* Category */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Category
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                <Tag className="w-3 h-3" />
                {image.category}
              </span>
            </div>

            {/* ALT Text */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-[11px]">
                <FileCheck className={`w-3.5 h-3.5 ${image.altText ? 'text-emerald-600' : 'text-amber-500'}`} />
                <span>ALT Attribute (SEO)</span>
              </div>
              <p className="text-slate-700 italic">
                {image.altText || <span className="text-amber-600 font-medium">Missing ALT text — Recommended to add for SEO</span>}
              </p>
            </div>

            {/* Caption */}
            {image.caption && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Caption
                </span>
                <p className="text-slate-800 font-medium">{image.caption}</p>
              </div>
            )}

            {/* Description */}
            {image.description && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Description
                </span>
                <p className="text-slate-700 leading-relaxed">{image.description}</p>
              </div>
            )}

            {/* Technical Metadata */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-400">
                  <Layers className="w-3 h-3" /> Display Order:
                </span>
                <span className="font-mono font-bold text-slate-800">{image.displayOrder ?? 0}</span>
              </div>

              {image.fileSize && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-400">
                    <HardDrive className="w-3 h-3" /> Size:
                  </span>
                  <span className="font-mono">{(image.fileSize / 1024).toFixed(1)} KB</span>
                </div>
              )}

              {image.updatedAt && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Calendar className="w-3 h-3" /> Last Updated:
                  </span>
                  <span>{new Date(image.updatedAt).toLocaleDateString()}</span>
                </div>
              )}

              <div className="pt-1">
                <a
                  href={image.image}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open raw image in new tab</span>
                </a>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(image);
              }}
              className="flex-1 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>

            <button
              onClick={() => onToggleStatus(image)}
              title={image.status === 'active' ? 'Hide from public website' : 'Make visible on public website'}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                image.status === 'active'
                  ? 'border-slate-200 text-slate-700 hover:bg-slate-100'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              {image.status === 'active' ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  <span>Deactivate</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Activate</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { PHOTOS_DATA } from '../data/spaData';
import { PhotoItem } from '../types';

interface PhotosSectionProps {
  onOpenPhotosModal: (index?: number) => void;
  syncedPhotos?: PhotoItem[];
}

export function PhotosSection({ onOpenPhotosModal, syncedPhotos }: PhotosSectionProps) {
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const photoSource = (syncedPhotos && syncedPhotos.length > 0) ? syncedPhotos : PHOTOS_DATA;
  const cleanPhotos = photoSource.filter(p => 
    p && 
    typeof p.image === 'string' && 
    p.image.trim() !== '' && 
    !p.image.includes('AF1QipMblTdN3tLJ-kcMbtMYZDKFJOLiiEUMr6enrV9g') &&
    !failedIds.has(p.id)
  );

  return (
    <section id="section-photos" className="px-4 py-5 border-b border-gray-100 bg-white">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            Photos
          </h2>
          <span className="text-xs font-medium text-gray-500">
            ({cleanPhotos.length})
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Google Business
          </span>
        </div>
        <button
          id="btn-view-all-photos"
          onClick={() => onOpenPhotosModal()}
          className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
        >
          <span>View All</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Smoothly scrollable/swipeable Photos Row showing all authentic photos */}
      <div className="flex gap-2 sm:gap-2.5 overflow-x-auto pb-1.5 pt-0.5 -mx-1 px-1 scroll-smooth snap-x snap-mandatory no-scrollbar">
        {cleanPhotos.map((photo, index) => (
          <button
            key={photo.id}
            id={`photo-thumb-${photo.id}`}
            onClick={() => onOpenPhotosModal(index)}
            aria-label={`View photo: ${photo.title}`}
            className="group relative shrink-0 w-[42%] sm:w-[32%] md:w-[24%] aspect-4/3 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 hover:border-blue-400 shadow-2xs hover:shadow-xs transition-all active:scale-97 cursor-pointer focus:outline-none snap-start"
          >
            <img
              src={photo.image}
              alt={photo.title}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={(e) => {
                if (photo.fallbackImage && e.currentTarget.src !== photo.fallbackImage) {
                  e.currentTarget.src = photo.fallbackImage;
                } else {
                  setFailedIds(prev => new Set(prev).add(photo.id));
                }
              }}
              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
          </button>
        ))}
      </div>
    </section>
  );
}


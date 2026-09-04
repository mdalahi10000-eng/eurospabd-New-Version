import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Navigation, MapPin, Copy, Check, Car, Clock, Phone } from 'lucide-react';
import { SPA_INFO } from '../../data/spaData';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCallClick: () => void;
}

export function LocationModal({ isOpen, onClose, onCallClick }: LocationModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(SPA_INFO.fullAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenGoogleMaps = () => {
    window.open(SPA_INFO.googleMapsUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/65 backdrop-blur-[2px]"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-neutral-50/80">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900">
                Location & Directions
              </h2>
              <p className="text-xs text-neutral-500 font-medium">
                {SPA_INFO.name} • {SPA_INFO.locationShort}
              </p>
            </div>

            <button
              id="btn-close-location-modal"
              onClick={onClose}
              aria-label="Close location modal"
              className="w-8 h-8 rounded-full bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Map Embed / Preview */}
          <div className="relative h-56 sm:h-64 w-full bg-neutral-100 overflow-hidden border-b border-neutral-200/80">
            <iframe
              title="Google Map Euro Spa Center Banani Dhaka"
              src="https://maps.google.com/maps?q=Euro+Spa+Center,+73+Road+No.+6,+Banani,+Dhaka+1213&t=&z=16&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            {/* Overlaid business pin card */}
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-xl shadow-md border border-neutral-200 pointer-events-none flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                <MapPin className="w-2.5 h-2.5 fill-white" />
              </div>
              <span className="text-xs font-bold text-neutral-900">{SPA_INFO.name}</span>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-5 overflow-y-auto space-y-4">
            {/* Address box with copy */}
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Physical Address
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-700 mt-0.5 font-medium leading-relaxed">
                    {SPA_INFO.fullAddress}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCopyAddress}
                className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-gray-700 bg-white border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Practical information pills */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 bg-white rounded-xl border border-gray-200/80 flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="block text-[10px] text-gray-400 font-medium">HOURS</span>
                  <span className="font-bold text-gray-800">{SPA_INFO.openingHours} Daily</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-gray-200/80 flex items-center gap-2.5">
                <Car className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="block text-[10px] text-gray-400 font-medium">PARKING</span>
                  <span className="font-bold text-gray-800">Valet & Street Spot</span>
                </div>
              </div>
            </div>

            {/* Landmark guidance */}
            <div className="text-xs text-gray-600 bg-blue-50/50 border border-blue-100 p-3 rounded-xl leading-relaxed">
              <strong className="text-gray-900 font-semibold">How to Reach:</strong> Near Banani Star Kabab, 73 Road No. 6, with easy access from Kemal Ataturk Avenue and Banani Road 11.
            </div>

            {/* Action Buttons */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                id="btn-navigate-google-maps"
                onClick={handleOpenGoogleMaps}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-100"
              >
                <Navigation className="w-4 h-4 fill-current" />
                <span>Get Turn-by-Turn Directions</span>
              </button>

              <button
                id="btn-call-reception"
                onClick={() => {
                  onClose();
                  onCallClick();
                }}
                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Phone className="w-4 h-4 text-gray-600" />
                <span>Call Reception</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

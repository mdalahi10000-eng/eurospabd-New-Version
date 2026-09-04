import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Check } from 'lucide-react';
import { Service, PriceOption } from '../../types';
import { SPA_INFO } from '../../data/spaData';

interface ServiceModalProps {
  service: Service | null;
  onClose: () => void;
  onOpenBookingWithService?: (service: Service, option: PriceOption) => void;
}

export function ServiceModal({
  service,
  onClose,
  onOpenBookingWithService
}: ServiceModalProps) {
  const [selectedOption, setSelectedOption] = useState<PriceOption | null>(null);

  if (!service) return null;

  // Default to first price option
  const activeOption = selectedOption || service.priceOptions[0];

  const handleConfirmOnWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello ${SPA_INFO.name}, I would like to confirm a booking for ${service.name} (${activeOption.duration} - ${activeOption.price}). Please share available slots!`
    );
    const url = `https://wa.me/${SPA_INFO.whatsappNumber}?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/65 backdrop-blur-[2px] transition-opacity"
        />

        {/* Modal Window matching Reference Image 2 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10 my-auto"
        >
          {/* Close Button floating over image */}
          <button
            id="btn-close-service-modal"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/95 text-neutral-800 flex items-center justify-center shadow-md hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Top Service Image matching Reference Screenshot */}
          <div className="relative h-44 sm:h-52 w-full bg-neutral-900 overflow-hidden">
            <img
              src={service.image}
              alt={service.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>

          {/* Content Body */}
          <div className="p-5 sm:p-6">
            {/* Title */}
            <h3 className="text-xl font-bold text-neutral-900 tracking-tight">
              {service.name}
            </h3>

            {/* Duration */}
            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-neutral-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{service.durationRange}</span>
            </div>

            {/* Description */}
            <p className="mt-2.5 text-xs sm:text-sm text-neutral-600 leading-relaxed">
              {service.fullDescription || service.shortDescription}
            </p>

            {/* Price section */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Select Option
              </span>

              <div className="mt-2 space-y-2">
                {service.priceOptions.map((opt) => {
                  const isSelected = activeOption.duration === opt.duration;
                  return (
                    <div
                      key={opt.duration}
                      id={`price-option-${opt.duration.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => setSelectedOption(opt)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50/60 shadow-2xs' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Radio circle */}
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected 
                            ? 'border-blue-600 bg-blue-600 text-white' 
                            : 'border-gray-300 bg-white'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-gray-800">
                          {opt.duration}
                        </span>
                      </div>

                      <span className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                        {opt.price}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mt-5 space-y-2">
              {/* WhatsApp Confirm Button */}
              <button
                id="btn-confirm-whatsapp-modal"
                onClick={handleConfirmOnWhatsApp}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 active:scale-[0.99] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-green-100"
              >
                <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2z"/>
                </svg>
                <span>Confirm on WhatsApp</span>
              </button>

              {/* Optional Book with calendar details */}
              {onOpenBookingWithService && (
                <button
                  id="btn-schedule-service-modal"
                  onClick={() => {
                    onClose();
                    onOpenBookingWithService(service, activeOption);
                  }}
                  className="w-full py-2.5 px-3 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 rounded-xl transition-colors cursor-pointer"
                >
                  Custom Date & Time Booking
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

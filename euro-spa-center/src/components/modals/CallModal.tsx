import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Phone, Copy, Check, Clock } from 'lucide-react';
import { SPA_INFO } from '../../data/spaData';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWhatsAppClick: () => void;
}

export function CallModal({ isOpen, onClose, onWhatsAppClick }: CallModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(SPA_INFO.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/65 backdrop-blur-[2px]"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden z-10 p-5 text-center my-auto"
        >
          <button
            onClick={onClose}
            aria-label="Close call modal"
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mt-2">
            <Phone className="w-7 h-7" />
          </div>

          <h3 className="text-lg font-bold text-gray-900 mt-3">
            Call Reception
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Reception Concierge at {SPA_INFO.name}
          </p>

          <div className="mt-4 p-3 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900 tracking-wide">
              {SPA_INFO.phone}
            </span>
            <button
              onClick={handleCopyPhone}
              className="text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-green-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-4 space-y-2">
            <a
              href={`tel:${SPA_INFO.phone.replace(/\s+/g, '')}`}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-100"
            >
              <Phone className="w-4 h-4 fill-current" />
              <span>Dial Directly</span>
            </a>

            <button
              onClick={() => {
                onClose();
                onWhatsAppClick();
              }}
              className="w-full py-2.5 px-4 bg-green-50 hover:bg-green-100/70 text-green-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Or WhatsApp Us Instead</span>
            </button>
          </div>

          <div className="mt-3 text-[11px] text-gray-400 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Open {SPA_INFO.openingHours} daily</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

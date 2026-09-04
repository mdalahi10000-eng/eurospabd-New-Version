import { Navigation, Phone, Mail, Clock, Calendar } from 'lucide-react';
import { SPA_INFO } from '../data/spaData';

interface LocationContactSectionProps {
  onDirectionsClick: () => void;
  onBookAppointmentClick: () => void;
  onCallClick: () => void;
  onWhatsAppClick: () => void;
}

export function LocationContactSection({
  onDirectionsClick,
  onBookAppointmentClick,
  onCallClick,
  onWhatsAppClick
}: LocationContactSectionProps) {
  return (
    <section id="section-location" className="px-4 py-5 pb-8 bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Card: Our Location */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-3">
            Our Location
          </h2>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden p-3.5 shadow-xs">
            {/* Map Preview Graphic */}
            <div
              onClick={onDirectionsClick}
              className="relative h-36 w-full rounded-xl overflow-hidden bg-gray-100 cursor-pointer group border border-gray-200/80"
            >
              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]" />

              {/* Decorative street grid lines */}
              <svg
                className="absolute inset-0 w-full h-full stroke-gray-300 fill-none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M-20 40 Q 120 70 300 30 T 600 60"
                  strokeWidth="4"
                  stroke="#d5ded7"
                />
                <path
                  d="M40 -20 L 80 180"
                  strokeWidth="3"
                  stroke="#d5ded7"
                />
                <path
                  d="M220 -20 L 190 180"
                  strokeWidth="3"
                  stroke="#d5ded7"
                />
                <path
                  d="M-10 110 L 400 110"
                  strokeWidth="2.5"
                  stroke="#cbd5e1"
                />
              </svg>

              {/* Pin Pill Label */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 bg-white/95 px-3 py-1.5 rounded-full shadow-md border border-gray-200 group-hover:scale-105 transition-transform">
                <div className="w-3.5 h-3.5 rounded-full bg-red-600 ring-4 ring-red-100 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>

                <div className="text-left">
                  <p className="text-xs font-bold text-gray-900 leading-tight">
                    {SPA_INFO.name}
                  </p>

                  <p className="text-[11px] text-gray-500 font-medium leading-tight">
                    {SPA_INFO.locationShort}
                  </p>
                </div>
              </div>

              {/* Tap to expand overlay */}
              <div className="absolute bottom-2 right-2 bg-gray-900/75 text-white text-[10px] font-medium px-2 py-0.5 rounded-md backdrop-blur-xs">
                Tap to explore
              </div>
            </div>

            {/* Get Directions Button */}
            <button
              id="btn-get-directions-bottom"
              onClick={onDirectionsClick}
              className="mt-3.5 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-100"
            >
              <Navigation className="w-4 h-4 fill-current" />
              <span>Get Directions</span>
            </button>
          </div>
        </div>

        {/* Right Card: Contact Us */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-3">
            Contact Us
          </h2>

          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col justify-between h-[calc(100%-2.25rem)]">
            <div className="space-y-3 pt-0.5">

              {/* Phone */}
              <button
                onClick={onCallClick}
                className="w-full flex items-center gap-3 text-gray-700 hover:text-gray-900 text-left cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-gray-200 transition-colors">
                  <Phone className="w-3.5 h-3.5 text-gray-700" />
                </div>

                <span className="text-xs sm:text-sm font-medium">
                  {SPA_INFO.phone}
                </span>
              </button>

              {/* WhatsApp */}
              <button
                onClick={onWhatsAppClick}
                className="w-full flex items-center gap-3 text-gray-700 hover:text-green-700 text-left cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center shrink-0 group-hover:bg-green-100 transition-colors">
                  <svg
                    className="w-3.5 h-3.5 text-green-600 fill-current"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2z" />
                  </svg>
                </div>

                <span className="text-xs sm:text-sm font-medium text-green-700">
                  {SPA_INFO.whatsappFormatted}
                </span>
              </button>

              {/* Email */}
              <a
                href={`mailto:${SPA_INFO.email}`}
                className="flex items-center gap-3 text-gray-700 hover:text-gray-900 group"
              >
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-gray-200 transition-colors">
                  <Mail className="w-3.5 h-3.5 text-gray-700" />
                </div>

                <span className="text-xs sm:text-sm font-medium">
                  {SPA_INFO.email}
                </span>
              </a>

              {/* Hours */}
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                </div>

                <span className="text-xs sm:text-sm font-medium">
                  {SPA_INFO.status}
                </span>
              </div>
            </div>

            {/* Book Appointment Button */}
            <button
              id="btn-book-appointment-bottom"
              onClick={onBookAppointmentClick}
              className="mt-4 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-100"
            >
              <Calendar className="w-4 h-4 fill-current" />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

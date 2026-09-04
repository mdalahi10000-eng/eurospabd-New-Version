import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, Phone, CheckCircle, Loader2, User as UserIcon } from 'lucide-react';
import { SERVICES_DATA, SPA_INFO } from '../../data/spaData';
import { Service, PriceOption } from '../../types';
import { saveAppointment, loginWithGoogle } from '../../firebase';
import { User } from 'firebase/auth';

interface BookNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onCallClick: () => void;
  preselectedService?: Service | null;
  preselectedOption?: PriceOption | null;
  onBookingSuccess?: () => void;
}

export function BookNowModal({
  isOpen,
  onClose,
  currentUser,
  onCallClick,
  preselectedService,
  preselectedOption,
  onBookingSuccess
}: BookNowModalProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    preselectedService?.id || SERVICES_DATA[0].id
  );
  const selectedService = SERVICES_DATA.find(s => s.id === selectedServiceId) || SERVICES_DATA[0];

  const [selectedDuration, setSelectedDuration] = useState<string>(
    preselectedOption?.duration || selectedService.priceOptions[0]?.duration || '60 Minutes'
  );
  const activePriceOption = selectedService.priceOptions.find(p => p.duration === selectedDuration) 
    || selectedService.priceOptions[0];

  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState<string>('02:00 PM');
  const [customerName, setCustomerName] = useState<string>(currentUser?.displayName || '');
  const [customerPhone, setCustomerPhone] = useState<string>('+880 ');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedSuccess, setConfirmedSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const timeSlots = [
    '10:00 AM', '11:30 AM', '01:00 PM', '02:30 PM', 
    '04:00 PM', '05:30 PM', '07:00 PM', '08:30 PM'
  ];

  const handleConfirmWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello ${SPA_INFO.name}, I'd like to book an appointment:\n\n• Treatment: ${selectedService.name}\n• Duration: ${activePriceOption.duration} (${activePriceOption.price})\n• Preferred Date: ${date}\n• Preferred Time: ${timeSlot}\n• Name: ${customerName.trim() || 'Guest'}\n• Contact: ${customerPhone}\n\nPlease confirm availability.`
    );
    window.open(`https://wa.me/${SPA_INFO.whatsappNumber}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleInstantOnlineBook = async (e: FormEvent) => {
    e.preventDefault();
    if (!customerPhone || customerPhone.trim().length < 8) {
      setErrorMsg('Please enter a valid phone number for confirmation.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await saveAppointment({
        userId: currentUser?.uid || 'guest',
        userName: customerName.trim() || currentUser?.displayName || 'Valued Guest',
        userEmail: currentUser?.email || '',
        phone: customerPhone.trim(),
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        duration: activePriceOption.duration,
        price: activePriceOption.price,
        preferredDate: date,
        preferredTime: timeSlot,
        status: 'confirmed'
      });

      setConfirmedSuccess(true);
      if (onBookingSuccess) onBookingSuccess();
    } catch (err) {
      console.error('Save appointment error:', err);
      setErrorMsg('Could not save booking online, but you can still book immediately via WhatsApp or Call.');
    } finally {
      setIsSubmitting(false);
    }
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
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-neutral-50/80">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900">
                Book an Appointment
              </h2>
              <p className="text-xs text-neutral-500 font-medium">
                Instant confirmation • Banani, Dhaka
              </p>
            </div>

            <button
              id="btn-close-book-modal"
              onClick={onClose}
              aria-label="Close book appointment"
              className="w-8 h-8 rounded-full bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {confirmedSuccess ? (
              <div className="py-8 px-4 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">
                    Appointment Requested!
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-xs mx-auto">
                    We have recorded your booking for <strong>{selectedService.name}</strong> on <strong>{date} at {timeSlot}</strong>.
                  </p>
                </div>

                <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80 text-left text-xs space-y-1">
                  <p className="font-semibold text-neutral-800">Booking Summary:</p>
                  <p className="text-neutral-600">• Duration: {activePriceOption.duration}</p>
                  <p className="text-neutral-600">• Total Price: {activePriceOption.price}</p>
                  <p className="text-neutral-600">• Location: {SPA_INFO.fullAddress}</p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleConfirmWhatsApp}
                    className="flex-1 py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Open in WhatsApp</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInstantOnlineBook} className="space-y-4">
                {/* 1. Service Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">
                    1. Select Service
                  </label>
                  <select
                    id="select-booking-service"
                    value={selectedServiceId}
                    onChange={(e) => {
                      setSelectedServiceId(e.target.value);
                      const svc = SERVICES_DATA.find(s => s.id === e.target.value);
                      if (svc && svc.priceOptions[0]) {
                        setSelectedDuration(svc.priceOptions[0].duration);
                      }
                    }}
                    className="w-full text-xs sm:text-sm font-semibold p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {SERVICES_DATA.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.name} ({svc.durationRange})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Duration & Price Options */}
                <div>
                  <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">
                    2. Duration & Pricing
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedService.priceOptions.map((opt) => {
                      const isSelected = activePriceOption.duration === opt.duration;
                      return (
                        <button
                          key={opt.duration}
                          type="button"
                          onClick={() => setSelectedDuration(opt.duration)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs'
                              : 'border-gray-200 bg-gray-50/60 hover:bg-gray-100 text-gray-800'
                          }`}
                        >
                          <span className={`block text-xs font-semibold ${isSelected ? 'text-blue-950' : 'text-gray-900'}`}>
                            {opt.duration}
                          </span>
                          <span className={`block text-xs font-bold mt-0.5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`}>
                            {opt.price}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Date & Time Slot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">
                      3. Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full text-xs sm:text-sm p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">
                      Preferred Time
                    </label>
                    <select
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className="w-full text-xs sm:text-sm p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {timeSlots.map((slot) => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. Contact Information */}
                <div className="space-y-2 pt-1 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
                      4. Guest Contact
                    </label>
                    {!currentUser && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const u = await loginWithGoogle();
                            if (u?.displayName) setCustomerName(u.displayName);
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="text-[11px] text-blue-600 hover:underline cursor-pointer font-medium"
                      >
                        Auto-fill with Google
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <input
                        type="text"
                        placeholder="Your Name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <input
                        type="tel"
                        required
                        placeholder="Phone: +880 1712-XXXXXX"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-600 font-medium">{errorMsg}</p>
                )}

                {/* Action Buttons */}
                <div className="pt-2 space-y-2">
                  {/* WhatsApp Booking (Requested in prompt) */}
                  <button
                    type="button"
                    id="btn-whatsapp-booking"
                    onClick={handleConfirmWhatsApp}
                    className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-green-100"
                  >
                    <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2z"/>
                    </svg>
                    <span>Confirm on WhatsApp ({activePriceOption.price})</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Call Now Button */}
                    <button
                      type="button"
                      id="btn-call-booking"
                      onClick={onCallClick}
                      className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5 text-gray-600" />
                      <span>Call Now</span>
                    </button>

                    {/* Instant Save Online Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-md shadow-blue-100"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Save Online</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

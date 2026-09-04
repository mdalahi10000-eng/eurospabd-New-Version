import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, LogOut, Calendar, Star, MapPin, Image, Sparkles, Phone, Clock, User as UserIcon } from 'lucide-react';
import { User } from 'firebase/auth';
import { loginWithGoogle, logoutUser, fetchUserAppointments, StoredAppointment } from '../../firebase';
import { SPA_INFO } from '../../data/spaData';
import { LotusIcon } from '../LotusIcon';

import euroSpaLogo from '../../assets/Untitled design (4).jpg';
interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onNavigateTab: (tab: 'overview' | 'services' | 'photos' | 'reviews' | 'location') => void;
  onBookNowClick: () => void;
  onWhatsAppClick: () => void;
  onCallClick: () => void;
}

export function MenuDrawer({
  isOpen,
  onClose,
  currentUser,
  onNavigateTab,
  onBookNowClick,
  onWhatsAppClick,
  onCallClick
}: MenuDrawerProps) {
  const [appointments, setAppointments] = useState<StoredAppointment[]>([]);
  const [loadingAppts, setLoadingAppts] = useState<boolean>(false);
  const [showAppointments, setShowAppointments] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser?.uid) {
      setLoadingAppts(true);
      fetchUserAppointments(currentUser.uid)
        .then(res => setAppointments(res))
        .catch(() => setAppointments([]))
        .finally(() => setLoadingAppts(false));
    } else {
      setAppointments([]);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
        />

        {/* Drawer Sliding from Left */}
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-y-0 left-0 max-w-xs sm:max-w-sm w-full bg-white shadow-2xl z-10 flex flex-col justify-between"
        >
          {/* Top Branding & User Section */}
          <div>
            <div className="p-5 bg-gray-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 font-bold">
                  <img
  src={euroSpaLogo}
  alt="Euro Spa Center"
  className="w-8 h-8 rounded-full object-contain bg-white"
/>
                </div>
                <div>
                  <h3 className="font-bold text-base text-white tracking-wide">
                    {SPA_INFO.name}
                  </h3>
                  <p className="text-[11px] text-gray-300">
                    {SPA_INFO.locationShort} • 10:00 AM – 10:00 PM
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                aria-label="Close menu"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Account / Google Sign-In Card */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/70">
              {currentUser ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt={currentUser.displayName || 'User'}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                        {currentUser.displayName?.[0] || 'U'}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-gray-900 leading-tight">
                        {currentUser.displayName || 'Signed In Guest'}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate max-w-[150px]">
                        {currentUser.email}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      await logoutUser();
                    }}
                    title="Sign Out"
                    className="p-2 text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-900">
                      Sign in with Google
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Save appointments & reviews
                    </p>
                  </div>
                  <button
                    id="btn-drawer-google-login"
                    onClick={async () => {
                      try {
                        await loginWithGoogle();
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="px-3 py-1.5 bg-white border border-gray-300 hover:border-gray-400 rounded-xl text-xs font-semibold text-gray-800 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                </div>
              )}
            </div>

            {/* Navigation links */}
            <div className="p-4 space-y-1">
              <span className="block text-[10px] font-bold tracking-wider text-gray-400 uppercase px-3 mb-2">
                Navigation
              </span>

              {[
                { label: 'Overview', tab: 'overview', icon: Sparkles },
                { label: 'Signature Services', tab: 'services', icon: Calendar },
                { label: 'Photos & Ambience', tab: 'photos', icon: Image },
                { label: 'Client Reviews', tab: 'reviews', icon: Star },
                { label: 'Location & Map', tab: 'location', icon: MapPin }
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.tab}
                    onClick={() => {
                      onClose();
                      onNavigateTab(item.tab as any);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors text-xs sm:text-sm font-semibold text-left cursor-pointer"
                  >
                    <Icon className="w-4 h-4 text-gray-400" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* Toggle User Appointments if logged in */}
              {currentUser && (
                <button
                  onClick={() => setShowAppointments(!showAppointments)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors text-xs sm:text-sm font-semibold text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>My Bookings ({appointments.length})</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {showAppointments ? 'Hide' : 'Show'}
                  </span>
                </button>
              )}

              {/* Appointments list */}
              {showAppointments && (
                <div className="mt-1 p-2 bg-gray-50 rounded-xl space-y-2 max-h-44 overflow-y-auto">
                  {loadingAppts ? (
                    <p className="text-[11px] text-gray-400 p-2">Loading bookings...</p>
                  ) : appointments.length === 0 ? (
                    <p className="text-[11px] text-gray-400 p-2">No bookings recorded yet.</p>
                  ) : (
                    appointments.map(appt => (
                      <div key={appt.id || Math.random()} className="p-2 bg-white rounded-lg border border-gray-200 text-xs">
                        <p className="font-bold text-gray-900">{appt.serviceName}</p>
                        <p className="text-[11px] text-gray-500">{appt.preferredDate} at {appt.preferredTime}</p>
                        <p className="text-[10px] text-blue-600 font-semibold">{appt.duration} • {appt.price}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Drawer Bottom Actions */}
          <div className="p-4 border-t border-gray-200 bg-gray-50/50 space-y-2">
            <button
              onClick={() => {
                onClose();
                onBookNowClick();
              }}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-100 transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onWhatsAppClick();
              }}
              className="w-full py-2 px-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span>WhatsApp Direct Chat</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

import { ShieldX, LogOut, ArrowLeft } from 'lucide-react';
import { logoutUser, AdminAuthUser } from '../../supabase';
import { navigate } from '../../router';
import { SPA_INFO } from '../../data/spaData';

interface AdminAccessDeniedPageProps {
  currentUser: AdminAuthUser;
  onLoggedOut: () => void;
}

export function AdminAccessDeniedPage({ currentUser, onLoggedOut }: AdminAccessDeniedPageProps) {
  const handleLogout = async () => {
    await logoutUser();
    onLoggedOut();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans p-4 sm:p-6">
      <header className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Public Website</span>
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md bg-slate-900 border border-red-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center mx-auto shadow-inner">
            <ShieldX className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Access Restricted
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your account does not have administrator privileges for the {SPA_INFO.name} CMS & Admin Panel.
            </p>
          </div>

          {/* Current Signed-in User Info */}
          <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 text-left flex items-center gap-3">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'User'}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border border-slate-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center">
                {currentUser.displayName?.[0] || currentUser.email?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-200 truncate">
                {currentUser.displayName || 'Logged In Account'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {currentUser.email}
              </p>
              <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                Role: Guest / Client
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleLogout}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>Sign Out & Switch Account</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Main Website
            </button>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-600">
        &copy; 2026 {SPA_INFO.name}. Security System
      </footer>
    </div>
  );
}

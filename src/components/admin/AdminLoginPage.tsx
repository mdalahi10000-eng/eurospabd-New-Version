import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles,
  Lock,
  CheckCircle2,
  Users
} from 'lucide-react';
import { 
  loginWithGoogle, 
  checkIsAdmin, 
  logoutUser 
} from '../../firebase';
import { navigate } from '../../router';
import { SPA_INFO } from '../../data/spaData';
import euroSpaLogo from '../../assets/Untitled design (4).jpg';

interface AdminLoginPageProps {
  onSuccess?: () => void;
}

export function AdminLoginPage({ onSuccess }: AdminLoginPageProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const user = await loginWithGoogle();
      if (!user) {
        // User dismissed the popup
        setLoading(false);
        return;
      }

      const isAdmin = await checkIsAdmin(user);
      if (!isAdmin) {
        await logoutUser();
        setErrorMessage(
          `Access Denied: The Google account (${user.email || 'provided'}) is not registered in the authorized /admins directory. Only authorized administrator accounts are permitted.`
        );
      } else if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Google Admin Sign-in error:', err);
      const code = err?.code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // Handled silently
      } else if (code === 'auth/unauthorized-domain') {
        setErrorMessage(
          'Firebase Authentication returned "auth/unauthorized-domain". If testing on an unauthorized custom domain or preview URL, ensure you authenticate via an authorized origin.'
        );
      } else if (code === 'auth/network-request-failed') {
        setErrorMessage('Network error while connecting to Firebase Authentication. Please check your internet connection.');
      } else {
        setErrorMessage(err?.message || 'Authentication failed. Please verify your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans p-4 sm:p-6 selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <header className="flex items-center justify-between max-w-5xl mx-auto w-full">
        <button
          id="btn-admin-return-home"
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Public Website</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <Lock className="w-3.5 h-3.5 text-blue-400" />
          <span>Restricted Area</span>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6"
          >
            {/* Brand Logo & Header */}
            <div className="text-center space-y-3">
              <div className="relative inline-block">
                <img
                  src={euroSpaLogo}
                  alt={SPA_INFO.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-700 mx-auto shadow-md"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full border-2 border-slate-900 flex items-center justify-center text-white">
                  <ShieldCheck className="w-3 h-3" />
                </div>
              </div>

              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-950/80 text-blue-400 border border-blue-800/80 uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" />
                  Protected Administrator Portal
                </span>
                <h1 className="text-2xl font-bold text-white tracking-tight mt-2">
                  {SPA_INFO.name}
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Sign in with your authorized administrator Google account to access CMS and booking controls.
                </p>
              </div>
            </div>

            {/* Error Notification */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 rounded-2xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5 shadow-inner"
                >
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">
                    {errorMessage}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Primary Google Login Button */}
            <div className="space-y-4 pt-1">
              <button
                id="btn-admin-google-login"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Authorization...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign In with Google Administrator Account</span>
                  </>
                )}
              </button>

              {/* Security & Access Notice */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span>Role-Based Access Control</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Only Google accounts designated in the secure <code>/admins</code> collection are granted administrative access. Unauthorized accounts are automatically denied and signed out.
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>Active Super-Admin: mdalahi10000@gmail.com</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-600 max-w-5xl mx-auto w-full py-2">
        <p>&copy; {new Date().getFullYear()} {SPA_INFO.name}. All administrative actions are encrypted and logged.</p>
      </footer>
    </div>
  );
}

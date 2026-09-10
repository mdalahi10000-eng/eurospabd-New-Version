import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles,
  Lock,
  Mail,
  Eye,
  EyeOff,
  User,
  CheckCircle2,
  Users,
  Info,
  RotateCw,
  KeyRound
} from 'lucide-react';
import { 
  loginWithPassword, 
  signUpWithPassword, 
  resetPasswordForEmail, 
  checkIsAdmin, 
  logoutUser 
} from '../../supabase';
import { navigate } from '../../router';
import { SPA_INFO } from '../../data/spaData';
import euroSpaLogo from '../../assets/Untitled design (4).jpg';

interface AdminLoginPageProps {
  onSuccess?: () => void;
  startupNotice?: string | null;
  onRetryConnection?: () => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot';

export function AdminLoginPage({ onSuccess, startupNotice, onRetryConnection }: AdminLoginPageProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetFormState = (newMode: AuthMode) => {
    setAuthMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your administrator email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { data, error } = await loginWithPassword(email, password);
      if (error) {
        throw error;
      }

      if (data?.user) {
        const isAdmin = await checkIsAdmin(data.user);
        if (!isAdmin) {
          await logoutUser();
          setErrorMessage(
            `Access Denied: The account (${email.trim()}) is not registered in the authorized /admins directory. Only authorized administrator accounts are permitted.`
          );
        } else if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err: any) {
      console.error('Admin Sign-in error:', err);
      const msg = err?.message || 'Authentication failed. Please verify your credentials and try again.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter an email and password for your new account.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters in length.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { data, error } = await signUpWithPassword(email, password, fullName);
      if (error) {
        throw error;
      }

      if (data?.session && data?.user) {
        const isAdmin = await checkIsAdmin(data.user);
        if (!isAdmin) {
          await logoutUser();
          setSuccessMessage(
            `Account successfully registered for ${email.trim()}! Please note: Your account is pending administrative authorization. An existing administrator must add ${email.trim()} to the /admins directory.`
          );
          setAuthMode('signin');
        } else if (onSuccess) {
          onSuccess();
        }
      } else {
        setSuccessMessage(
          `Account registration dispatched for ${email.trim()}! If email confirmation is enabled on your Supabase instance, please check your inbox to confirm your address before signing in.`
        );
        setAuthMode('signin');
      }
    } catch (err: any) {
      console.error('Admin Sign-up error:', err);
      const msg = err?.message || 'Registration failed. Please check your credentials and try again.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your administrator email address.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { error } = await resetPasswordForEmail(email);
      if (error) {
        throw error;
      }
      setSuccessMessage(
        `Password reset instructions have been sent to ${email.trim()}. Please check your inbox and follow the link to set a new password.`
      );
    } catch (err: any) {
      console.error('Password reset error:', err);
      const msg = err?.message || 'Failed to dispatch reset email. Please verify your address and try again.';
      setErrorMessage(msg);
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
                  {authMode === 'signin' && 'Sign in with your authorized email and password to access CMS & booking controls.'}
                  {authMode === 'signup' && 'Register a new administrator account with your email and password.'}
                  {authMode === 'forgot' && 'Enter your administrator email to receive a password reset link.'}
                </p>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
              <button
                id="tab-admin-signin"
                type="button"
                onClick={() => resetFormState('signin')}
                className={`flex-1 py-1.5 font-semibold rounded-lg transition-all cursor-pointer ${
                  authMode === 'signin'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                id="tab-admin-signup"
                type="button"
                onClick={() => resetFormState('signup')}
                className={`flex-1 py-1.5 font-semibold rounded-lg transition-all cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Account
              </button>
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

            {/* Success Notification */}
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 text-xs flex items-start gap-2.5 shadow-inner"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">
                    {successMessage}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Startup recovery notice if redirected due to timeout/idle period */}
            {startupNotice && !errorMessage && !successMessage && (
              <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-800/60 text-blue-200 text-xs flex items-start gap-2.5 shadow-sm">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <span>{startupNotice}</span>
                  {onRetryConnection && (
                    <button
                      id="btn-admin-retry-login-screen"
                      type="button"
                      onClick={onRetryConnection}
                      className="ml-2 inline-flex items-center gap-1 underline font-semibold text-blue-300 hover:text-blue-100 cursor-pointer"
                    >
                      <RotateCw className="w-3 h-3 inline" />
                      <span>Retry connection</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 1. SIGN IN FORM */}
            {authMode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="input-admin-email" className="block text-xs font-semibold text-slate-300">
                    Administrator Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="input-admin-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@eurospadhaka.com"
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="input-admin-password" className="block text-xs font-semibold text-slate-300">
                      Password
                    </label>
                    <button
                      id="btn-admin-forgot-password-link"
                      type="button"
                      onClick={() => resetFormState('forgot')}
                      className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="input-admin-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                    <button
                      id="btn-toggle-password-signin"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  id="btn-admin-submit-signin"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Sign In to Admin Portal</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* 2. SIGN UP FORM */}
            {authMode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="input-admin-fullname" className="block text-xs font-semibold text-slate-300">
                    Full Name (Optional)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="input-admin-fullname"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alahi"
                      autoComplete="name"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="input-admin-signup-email" className="block text-xs font-semibold text-slate-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="input-admin-signup-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@eurospadhaka.com"
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="input-admin-signup-password" className="block text-xs font-semibold text-slate-300">
                    Password (min 6 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="input-admin-signup-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                    <button
                      id="btn-toggle-password-signup"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="input-admin-signup-confirm" className="block text-xs font-semibold text-slate-300">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="input-admin-signup-confirm"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  id="btn-admin-submit-signup"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Create Administrator Account</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* 3. FORGOT PASSWORD FORM */}
            {authMode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="input-admin-forgot-email" className="block text-xs font-semibold text-slate-300">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="input-admin-forgot-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@eurospadhaka.com"
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  id="btn-admin-submit-reset"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending Link...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5" />
                      <span>Send Password Reset Link</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    id="btn-admin-back-to-signin"
                    type="button"
                    onClick={() => resetFormState('signin')}
                    className="text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    &larr; Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* Security & Access Notice */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Role-Based Access Control</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Administrative access is restricted to emails registered in the secure <code>/admins</code> directory. Unauthorized accounts cannot access CMS or booking features.
              </p>
              <div className="pt-1 flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>Supabase encrypted credentials &bull; Authorized administrators only</span>
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

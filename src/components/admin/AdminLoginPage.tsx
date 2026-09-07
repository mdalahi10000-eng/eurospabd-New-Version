import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Mail, 
  ArrowLeft, 
  ShieldAlert, 
  LogIn, 
  KeyRound, 
  CheckCircle2, 
  Eye, 
  EyeOff,
  Sparkles,
  Link2,
  ShieldCheck
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  loginWithEmailPassword, 
  sendAdminPasswordReset, 
  loginWithGoogle,
  linkEmailPasswordToAccount,
  isPasswordProviderLinked,
  checkIsAdmin, 
  logoutUser 
} from '../../firebase';
import { navigate } from '../../router';
import { SPA_INFO } from '../../data/spaData';
import euroSpaLogo from '../../assets/Untitled design (4).jpg';

interface AdminLoginPageProps {
  onSuccess?: () => void;
}

type AuthViewMode = 'login' | 'forgot-password' | 'link-account';

export function AdminLoginPage({ onSuccess }: AdminLoginPageProps) {
  const [viewMode, setViewMode] = useState<AuthViewMode>('login');
  
  // Standard Email/Password login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Account Linking flow state (preserves existing Google user UID)
  const [googleAuthenticatedUser, setGoogleAuthenticatedUser] = useState<User | null>(null);
  const [newLinkPassword, setNewLinkPassword] = useState('');
  const [confirmLinkPassword, setConfirmLinkPassword] = useState('');
  const [showLinkPassword, setShowLinkPassword] = useState(false);
  const [linkingSuccess, setLinkingSuccess] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // 1. Standard Email & Password Sign-In
  const handleEmailPasswordSignIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your administrator email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const user = await loginWithEmailPassword(email, password);
      if (user) {
        const isAdmin = await checkIsAdmin(user);
        if (!isAdmin) {
          await logoutUser();
          setErrorMessage(
            `Access Denied: The account (${user.email}) is not registered in the authorized /admins directory. Only designated administrators may access this console.`
          );
        } else if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err: any) {
      console.error('Admin login error:', err);
      const code = err?.code;
      if (code === 'auth/operation-not-allowed') {
        setErrorMessage(
          'Email & Password authentication failed with auth/operation-not-allowed. The Firebase Identity Toolkit backend for project affable-year-mghtt currently has password sign-in disabled.'
        );
      } else if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErrorMessage('Invalid administrator email or password. Please verify your credentials.');
      } else if (code === 'auth/invalid-email') {
        setErrorMessage('Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMessage('Access temporarily locked due to multiple failed login attempts. Please try again in a few minutes.');
      } else if (code === 'auth/user-disabled') {
        setErrorMessage('This administrator account has been disabled by security.');
      } else {
        setErrorMessage(err?.message || 'Authentication failed. Please verify your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Forgot Password / Password Reset Flow
  const handlePasswordReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your administrator email address to receive the password reset link.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setResetSuccessMessage(null);

    try {
      await sendAdminPasswordReset(email);
      setResetSuccessMessage(
        `A password reset link has been dispatched to ${email.trim()}. Please check your email inbox and spam folder.`
      );
    } catch (err: any) {
      console.error('Password reset error:', err);
      const code = err?.code;
      if (code === 'auth/operation-not-allowed') {
        setErrorMessage(
          'Password reset returned auth/operation-not-allowed. Email & Password provider is disabled on the backend for project affable-year-mghtt.'
        );
      } else if (code === 'auth/user-not-found') {
        setErrorMessage('No administrator account was found registered with this email address.');
      } else if (code === 'auth/invalid-email') {
        setErrorMessage('Please enter a valid email address.');
      } else {
        setErrorMessage(err?.message || 'Failed to dispatch password reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 4. Safe Account-Linking: Step 1 - Authenticate with Google
  const handleGoogleAuthenticateForLinking = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const user = await loginWithGoogle();
      if (user) {
        const isAdmin = await checkIsAdmin(user);
        if (!isAdmin) {
          await logoutUser();
          setErrorMessage(`The account ${user.email} is not authorized in /admins. Only authorized administrators may link credentials.`);
          setGoogleAuthenticatedUser(null);
          return;
        }

        // Check if password provider is already linked
        if (isPasswordProviderLinked(user)) {
          setErrorMessage(
            `Account ${user.email} already has Email/Password authentication active! Google Sign-In is disabled for the admin portal. Please sign in directly using your Email and Password.`
          );
          setGoogleAuthenticatedUser(null);
          return;
        }

        setGoogleAuthenticatedUser(user);
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        setErrorMessage(err?.message || 'Failed to authenticate with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 4. Safe Account-Linking: Step 2 - Link EmailAuthProvider to existing user UID
  const handleCompleteAccountLinking = async (e: FormEvent) => {
    e.preventDefault();
    if (!googleAuthenticatedUser) {
      setErrorMessage('Please authenticate with your Google admin account first.');
      return;
    }

    if (newLinkPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (newLinkPassword !== confirmLinkPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const updatedUser = await linkEmailPasswordToAccount(googleAuthenticatedUser, newLinkPassword);
      setLinkingSuccess(true);
      setGoogleAuthenticatedUser(updatedUser);
      // Pre-fill email for sign-in
      if (updatedUser.email) {
        setEmail(updatedUser.email);
      }
    } catch (err: any) {
      console.error('Account linking error:', err);
      const code = err?.code;
      if (code === 'auth/operation-not-allowed') {
        setErrorMessage(
          'Email & Password provider is disabled on the backend for project affable-year-mghtt (auth/operation-not-allowed).'
        );
      } else if (code === 'auth/provider-already-linked') {
        setLinkingSuccess(true);
      } else if (code === 'auth/credential-already-in-use') {
        setErrorMessage('An email/password credential already exists for this email address.');
      } else if (code === 'auth/weak-password') {
        setErrorMessage('The chosen password is too weak. Please use at least 6 characters with a combination of letters and numbers.');
      } else {
        setErrorMessage(err?.message || 'Failed to link password credential. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetAllModes = (targetMode: AuthViewMode) => {
    setErrorMessage(null);
    setResetSuccessMessage(null);
    setGoogleAuthenticatedUser(null);
    setNewLinkPassword('');
    setConfirmLinkPassword('');
    setLinkingSuccess(false);
    setViewMode(targetMode);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Subtle Background Lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="p-4 sm:p-6 flex items-center justify-between relative z-10">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Public Website</span>
        </button>
        <div className="text-right">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
            Admin CMS Console
          </span>
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md"
        >
          {/* Brand Header */}
          <div className="text-center space-y-3 mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700/80 shadow-inner p-1 mb-1">
              <img
                src={euroSpaLogo}
                alt="Euro Spa Center"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
              <Lock className="w-3 h-3" />
              <span>Protected Administrator Portal</span>
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight">
              {SPA_INFO.name}
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {viewMode === 'login' && 'Sign in with your administrator email and password to access CMS controls.'}
              {viewMode === 'forgot-password' && 'Request a password reset link sent to your registered administrator email.'}
              {viewMode === 'link-account' && 'Attach an Email & Password credential to your existing Google Admin account while preserving your exact UID.'}
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 rounded-2xl bg-red-950/60 border border-red-800/70 text-red-300 text-xs flex items-start gap-2.5"
            >
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{errorMessage}</p>
            </motion.div>
          )}

          {resetSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/70 text-emerald-300 text-xs flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{resetSuccessMessage}</p>
            </motion.div>
          )}

          {/* View Modes */}
          <AnimatePresence mode="wait">
            {/* 1. PRIMARY VIEW: Email & Password Authentication ONLY */}
            {viewMode === 'login' && (
              <motion.div
                key="login-view"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <form
                  onSubmit={handleEmailPasswordSignIn}
                  className="space-y-4"
                >
                  {/* Email Field */}
                  <div>
                    <label 
                      htmlFor="admin-email-input" 
                      className="block text-xs font-semibold text-slate-300 mb-1.5"
                    >
                      Administrator Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="admin-email-input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="mdalahi10000@gmail.com"
                        required
                        autoComplete="username"
                        disabled={loading}
                        className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 transition-all outline-none disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label 
                        htmlFor="admin-password-input" 
                        className="block text-xs font-semibold text-slate-300"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => resetAllModes('forgot-password')}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="admin-password-input"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        autoComplete="current-password"
                        disabled={loading}
                        className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 transition-all outline-none disabled:opacity-60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Action */}
                  <button
                    id="btn-admin-email-login"
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Sign In with Email & Password</span>
                      </>
                    )}
                  </button>

                  {/* Account-Linking One-Time Setup Button */}
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => resetAllModes('link-account')}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 font-medium transition-colors cursor-pointer"
                    >
                      <Link2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Existing Google Admin? Set up / Link Password</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* 2. FORGOT PASSWORD VIEW */}
            {viewMode === 'forgot-password' && (
              <motion.form
                key="forgot-password-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handlePasswordReset}
                className="space-y-4"
              >
                <div>
                  <label 
                    htmlFor="reset-email-input" 
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Registered Administrator Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reset-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mdalahi10000@gmail.com"
                      required
                      autoComplete="email"
                      disabled={loading}
                      className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 transition-all outline-none disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    id="btn-admin-send-reset-link"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending Reset Email...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Send Password Reset Link</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => resetAllModes('login')}
                    className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-medium text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700/50"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Email/Password Sign In</span>
                  </button>
                </div>
              </motion.form>
            )}

            {/* 3. SAFE ACCOUNT-LINKING FLOW (linkWithCredential) */}
            {viewMode === 'link-account' && (
              <motion.div
                key="link-account-view"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {linkingSuccess ? (
                  /* Successful Link State */
                  <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-800 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-900/60 border border-emerald-600 flex items-center justify-center mx-auto text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-emerald-200">
                        Email & Password Successfully Linked!
                      </h2>
                      <p className="text-xs text-emerald-400/90 mt-1 leading-relaxed">
                        Your existing user account ({googleAuthenticatedUser?.email}) has been linked with an Email/Password credential while preserving your exact Firebase UID and /admins permissions.
                      </p>
                      <p className="text-[11px] text-slate-400 mt-2">
                        Google Sign-In is now disabled for the admin console. Use your email and newly created password for all future administrator logins.
                      </p>
                    </div>

                    <div className="pt-2 space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (onSuccess) {
                            onSuccess();
                          } else {
                            resetAllModes('login');
                          }
                        }}
                        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-md"
                      >
                        Enter Admin Console Now
                      </button>
                      <button
                        type="button"
                        onClick={() => resetAllModes('login')}
                        className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Return to Sign In Page
                      </button>
                    </div>
                  </div>
                ) : !googleAuthenticatedUser ? (
                  /* Step 1: Authenticate with Google to verify identity of existing account */
                  <div className="space-y-4">
                    <div className="p-3.5 bg-blue-950/40 border border-blue-900/60 rounded-2xl text-left space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
                        <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>Preserve UID & Authorization</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        To add Email/Password credentials to your existing admin account (<span className="font-mono text-slate-300">mdalahi10000@gmail.com</span>) without creating a duplicate user, authenticate with Google once to verify ownership.
                      </p>
                    </div>

                    <button
                      id="btn-admin-verify-google"
                      type="button"
                      onClick={handleGoogleAuthenticateForLinking}
                      disabled={loading}
                      className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                          <span>Verifying Account...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.4 7.36 24 12 24z"/>
                            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.98 0 12s.45 3.84 1.24 5.42l4.04-3.15z"/>
                            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.6 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                          </svg>
                          <span>Step 1: Verify Google Account</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => resetAllModes('login')}
                      className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-medium text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700/50"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                ) : (
                  /* Step 2: Google Verified -> Enter Password and linkWithCredential */
                  <form onSubmit={handleCompleteAccountLinking} className="space-y-4 text-left">
                    {/* Verified User Pill */}
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-700 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Verified Admin Account:</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Authenticated
                        </span>
                      </div>
                      <p className="font-bold text-white truncate">{googleAuthenticatedUser.email}</p>
                      <p className="text-[10px] font-mono text-slate-500 truncate">
                        Firebase UID: {googleAuthenticatedUser.uid}
                      </p>
                    </div>

                    {/* New Password */}
                    <div>
                      <label 
                        htmlFor="link-password-input" 
                        className="block text-xs font-semibold text-slate-300 mb-1"
                      >
                        Create Administrator Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="link-password-input"
                          type={showLinkPassword ? 'text' : 'password'}
                          value={newLinkPassword}
                          onChange={(e) => setNewLinkPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          required
                          minLength={6}
                          disabled={loading}
                          className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-9 pr-9 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLinkPassword(!showLinkPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                        >
                          {showLinkPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label 
                        htmlFor="link-password-confirm" 
                        className="block text-xs font-semibold text-slate-300 mb-1"
                      >
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="link-password-confirm"
                          type={showLinkPassword ? 'text' : 'password'}
                          value={confirmLinkPassword}
                          onChange={(e) => setConfirmLinkPassword(e.target.value)}
                          placeholder="Re-enter password"
                          required
                          minLength={6}
                          disabled={loading}
                          className="w-full bg-slate-950 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-9 pr-9 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <button
                        id="btn-admin-complete-linking"
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Linking Credential to UID...</span>
                          </>
                        ) : (
                          <>
                            <Link2 className="w-4 h-4" />
                            <span>Step 2: Link Password to Account</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => resetAllModes('login')}
                        className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-medium text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700/50"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Security & Authorization Info */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center space-y-1">
            <p className="text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span>Firebase Email/Password Authentication</span>
            </p>
            <p className="text-[10px] text-slate-500">
              Only authorized staff listed in Firestore <span className="font-mono text-slate-400">/admins</span> may access management modules.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-4 sm:p-6 text-center text-xs text-slate-500 relative z-10">
        &copy; 2026 {SPA_INFO.name}. All administrative actions are securely logged.
      </footer>
    </div>
  );
}

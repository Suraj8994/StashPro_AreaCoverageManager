import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  authenticateWithPassword,
  authenticateWithGoogleAccount,
} from '../services/dataService';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { StashProLogo } from './StashProLogo';
import {
  Lock,
  Phone,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { setCurrentUser, users, firestorePermissionError, setIsRulesModalOpen } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLocked(false);

    if (!identifier.trim()) {
      setError('Please enter your mobile number, email, or username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    const result = await authenticateWithPassword(identifier.trim(), password);
    setLoading(false);

    if (result.success && result.user) {
      setCurrentUser(result.user);
    } else {
      setError(result.errorMessage || 'Login failed. Please check credentials.');
      if (result.isLocked) {
        setIsLocked(true);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLocked(false);
    setGoogleLoading(true);

    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const email = cred.user.email;
      if (!email) {
        throw new Error('Google account did not return an email address.');
      }

      const result = await authenticateWithGoogleAccount(email);
      setGoogleLoading(false);

      if (result.success && result.user) {
        setCurrentUser(result.user);
      } else {
        setError(result.errorMessage || 'Google account not authorized for this system.');
        if (result.isLocked) {
          setIsLocked(true);
        }
      }
    } catch (err: any) {
      setGoogleLoading(false);
      if (err.code === 'auth/popup-closed-by-user') {
        // Ignored
      } else if (err.code === 'auth/unauthorized-domain') {
        setError(
          'This domain is not authorized in Firebase Authentication. Please add it to Authorized Domains in Firebase Console.'
        );
      } else if (err.code === 'auth/operation-not-allowed') {
        setError(
          'Google Provider is not enabled in Firebase Authentication yet. Please enable it in Firebase Console -> Authentication -> Sign-in method.'
        );
      } else {
        setError(err.message || 'Google sign-in failed. Please check credentials or contact Admin.');
      }
    }
  };

  const selectQuickUser = (u: typeof users[0]) => {
    if (!u.active) {
      setError(`Account for ${u.name} is disabled.`);
      return;
    }
    // Prefer mobile or username
    setIdentifier(u.role === 'admin' ? (u.mobile || u.username) : (u.email || u.username));
    setPassword(u.pin || '1234');
    setError(null);
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-white text-slate-800 flex flex-col justify-center items-center px-4 py-8 sm:p-6">
      {/* Subtle crisp light green ambient glow */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="w-[350px] sm:w-[550px] h-[350px] sm:h-[550px] bg-emerald-100/50 rounded-full blur-3xl opacity-70" />
      </div>

      <div className="relative w-full max-w-md bg-white border border-emerald-200/80 rounded-3xl shadow-xl shadow-slate-100 p-6 sm:p-8">
        {/* Brand Header with uploaded stāsh-pro Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <StashProLogo variant="banner" size="xl" className="mb-3 shadow-md" />
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 mt-1 rounded-full bg-emerald-50 text-[#064e3b] border border-emerald-300 text-[11px] font-extrabold tracking-wide">
            <span>AREA COVERAGE</span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1.5">
            Field Visit & Territory Route Management
          </p>
        </div>

        {firestorePermissionError && (
          <button
            type="button"
            onClick={() => setIsRulesModalOpen(true)}
            className="w-full mb-4 p-2.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-2 hover:bg-amber-100 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-sm">⚠️</span>
              <span className="truncate">
                <strong>Firebase Rules:</strong> Click to view rules setup for <em>area-coverage-manager</em>
              </span>
            </div>
            <span className="shrink-0 text-emerald-800 font-bold underline text-[11px]">Fix Rules</span>
          </button>
        )}

        {error && (
          <div
            className={`mb-5 p-3.5 rounded-2xl text-xs sm:text-sm flex items-start gap-2.5 ${
              isLocked
                ? 'bg-rose-50 border border-rose-200 text-rose-800'
                : 'bg-rose-50 border border-rose-200 text-rose-700'
            }`}
          >
            {isLocked ? (
              <Clock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        {/* Password Login Form */}
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#064e3b] mb-1.5">
              Mobile Number, Email, or Username
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 8108941215, anil, or email"
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent focus:bg-white transition-all shadow-xs"
                autoCapitalize="none"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#064e3b] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent focus:bg-white transition-all shadow-xs"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-[#047857] hover:bg-[#065f46] active:bg-[#064e3b] text-white font-bold py-3.5 px-4 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer text-sm sm:text-base disabled:opacity-50"
          >
            <span>{loading ? 'Verifying...' : 'Log In with Password'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative bg-white px-3 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
            or continue with
          </span>
        </div>

        {/* Google Authentication Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50 shadow-xs"
        >
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
          <span className="truncate">{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
        </button>

        {/* Quick Demo Switcher - Prominently Featuring Anil Sakpal (Admin) */}
        <div className="mt-7 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#064e3b] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
              1-Tap Quick Fill (Demo Accounts)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Anil Sakpal Admin button */}
            {users
              .filter((u) => u.active && u.role === 'admin')
              .slice(0, 1)
              .map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => selectQuickUser(u)}
                  className="col-span-2 flex items-center justify-between p-2.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 rounded-xl text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#047857] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-[#064e3b] truncate">
                          {u.name}
                        </p>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-200 text-[#064e3b]">
                          Admin
                        </span>
                      </div>
                      <p className="text-[11px] text-[#047857] font-semibold truncate">
                        {u.mobile || '8108941215'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#047857] shrink-0">Tap to Fill</span>
                </button>
              ))}

            {/* Worker accounts */}
            {users
              .filter((u) => u.active && u.role === 'worker')
              .slice(0, 4)
              .map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => selectQuickUser(u)}
                  className="flex items-center gap-2 p-2 bg-[#f8fafc] hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-200 rounded-xl text-left transition-colors cursor-pointer group overflow-hidden"
                >
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-emerald-100 text-[#064e3b] border border-emerald-200">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="overflow-hidden min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {u.name.split(' ')[0]}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      Worker
                    </p>
                  </div>
                </button>
              ))}
          </div>
        </div>

        <div className="mt-5 text-center text-[10px] sm:text-[11px] text-slate-400">
          stāsh-pro Distribution Network • Asia/Kolkata
        </div>
      </div>
    </div>
  );
};

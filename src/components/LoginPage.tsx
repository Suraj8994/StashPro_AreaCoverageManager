import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { authenticateWithPassword } from '../services/dataService';
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
  Eye,
  EyeOff,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { setCurrentUser, users, firestorePermissionError, setIsRulesModalOpen } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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

  // Quick fill user credentials (auto-fills username/identifier only; password must be entered by user)
  const selectQuickUser = (u: typeof users[0]) => {
    if (!u.active) {
      setError(`Account for ${u.name} is disabled.`);
      return;
    }
    // Auto-fill identifier only
    setIdentifier(u.role === 'admin' ? (u.mobile || u.username) : (u.email || u.username));
    setPassword(''); // Password must be entered manually by the user
    setError(null);
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-white text-slate-800 flex flex-col justify-center items-center px-4 py-6 sm:p-8">
      {/* Subtle light green ambient glow */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="w-[350px] sm:w-[550px] h-[350px] sm:h-[550px] bg-emerald-100/50 rounded-full blur-3xl opacity-70" />
      </div>

      <div className="relative w-full max-w-md bg-white border border-emerald-200/80 rounded-3xl shadow-xl shadow-slate-100 p-6 sm:p-8">
        {/* Brand Header with uploaded stāsh-pro Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <StashProLogo variant="banner" size="xl" className="mb-3 shadow-md" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#064e3b] border border-emerald-300 text-xs font-black tracking-wide">
            <span>AREA COVERAGE</span>
          </div>
          <p className="text-sm font-semibold text-slate-600 mt-2">
            Field Visit & Territory Route Management
          </p>
        </div>

        {firestorePermissionError && (
          <button
            type="button"
            onClick={() => setIsRulesModalOpen(true)}
            className="w-full mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm flex items-center justify-between gap-2 hover:bg-amber-100 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="text-base">⚠️</span>
              <span className="truncate">
                <strong>Firebase Rules:</strong> Click to view rules setup for <em>area-coverage-manager</em>
              </span>
            </div>
            <span className="shrink-0 text-emerald-800 font-bold underline text-xs">Fix Rules</span>
          </button>
        )}

        {error && (
          <div
            className={`mb-5 p-4 rounded-2xl text-sm flex items-start gap-3 ${
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
            <span className="leading-relaxed font-semibold">{error}</span>
          </div>
        )}

        {/* Password Login Form */}
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-[#064e3b] mb-1.5">
              Mobile Number, Email, or Username
            </label>
            <div className="relative">
              <Phone className="w-5 h-5 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 8108941215, anil, or email"
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-slate-900 placeholder-slate-400 text-base focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent focus:bg-white transition-all shadow-xs"
                autoCapitalize="none"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-[#064e3b] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl pl-11 pr-12 py-3.5 text-slate-900 placeholder-slate-400 text-base focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent focus:bg-white transition-all shadow-xs"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg focus:outline-none cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-emerald-700" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 bg-[#047857] hover:bg-[#065f46] active:bg-[#064e3b] text-white font-bold py-4 px-5 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer text-base disabled:opacity-50 min-h-[48px]"
          >
            <span>{loading ? 'Verifying...' : 'Log In with Password'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        {/* Quick Demo Switcher - Auto-fills Username Only */}
        <div className="mt-7 pt-5 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#064e3b] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#10b981]" />
              1-Tap Quick Fill (Demo Accounts)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Anil Sakpal Admin button */}
            {users
              .filter((u) => u.active && u.role === 'admin')
              .slice(0, 1)
              .map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => selectQuickUser(u)}
                  className="col-span-2 flex items-center justify-between p-3 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 rounded-2xl text-left transition-colors cursor-pointer group min-h-[48px]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#047857] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[#064e3b] truncate">
                          {u.name}
                        </p>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-200 text-[#064e3b]">
                          Admin
                        </span>
                      </div>
                      <p className="text-xs text-[#047857] font-semibold truncate mt-0.5">
                        {u.mobile || '8108941215'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#047857] shrink-0 bg-white/80 px-2 py-1 rounded-lg border border-emerald-200">
                    Fill Username
                  </span>
                </button>
              ))}

            {/* Sales Representative accounts */}
            {users
              .filter((u) => u.active && u.role === 'worker')
              .slice(0, 4)
              .map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => selectQuickUser(u)}
                  className="flex items-center gap-2.5 p-2.5 bg-[#f8fafc] hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-2xl text-left transition-colors cursor-pointer group overflow-hidden min-h-[48px]"
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-emerald-100 text-[#064e3b] border border-emerald-200">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {u.name.split(' ')[0]}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-semibold truncate">
                      Sales Rep
                    </p>
                  </div>
                </button>
              ))}
          </div>

          <p className="text-[11px] text-slate-500 text-center mt-3 font-medium">
            * Quick fill enters the account identifier. Please enter the password to log in.
          </p>
        </div>

        <div className="mt-5 text-center text-xs text-slate-400 font-medium">
          stāsh-pro Distribution Network • Asia/Kolkata
        </div>
      </div>
    </div>
  );
};

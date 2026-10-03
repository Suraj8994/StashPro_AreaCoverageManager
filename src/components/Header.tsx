import React from 'react';
import { useApp } from '../context/AppContext';
import { StashProLogo } from './StashProLogo';
import { LogOut, Shield, Layers, Phone } from 'lucide-react';

export const Header: React.FC = () => {
  const { currentUser, logout, activeTab, setActiveTab, setIsProfileOpen, firestorePermissionError, setIsRulesModalOpen } = useApp();

  if (!currentUser) return null;

  return (
    <header className="sticky top-0 z-30 w-full max-w-full overflow-x-hidden bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2.5">
        {/* Logo and App Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <StashProLogo size="md" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-base sm:text-xl font-black tracking-tight text-[#064e3b] font-sans lowercase">
                stāsh<span className="text-[#10b981] font-bold">-pro</span>
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-extrabold bg-emerald-50 text-[#064e3b] border border-emerald-300">
                AREA COVERAGE
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block truncate font-medium">
              Field Visit & Territory Route Management • Asia/Kolkata
            </p>
          </div>
        </div>

        {/* User Info & Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {currentUser.role === 'admin' && (
            <div className="flex items-center bg-[#f1f5f9] p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('worker')}
                className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'worker'
                    ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                <span className="hidden xs:inline sm:inline">Sales Rep View</span>
                <span className="xs:hidden">Visits</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Admin</span>
              </button>
            </div>
          )}

          {/* Current User Badge & Profile Button */}
          <div className="flex items-center gap-2 sm:gap-2.5 pl-2 border-l border-slate-200">
            {firestorePermissionError && (
              <button
                type="button"
                onClick={() => setIsRulesModalOpen(true)}
                className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Cloud sync requires Firestore rules. Click for instructions."
              >
                <span>⚠️</span>
                <span className="hidden sm:inline">Firebase Rules</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 transition-colors text-left cursor-pointer group"
              title="View Profile & Settings"
            >
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                  currentUser.role === 'admin'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block max-w-[160px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 truncate">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-emerald-100 text-[#064e3b]">
                    {currentUser.role === 'admin' ? 'Admin' : 'Sales Rep'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 truncate flex items-center gap-1 font-medium">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <span>{currentUser.mobile || '8108941215'}</span>
                </div>
              </div>
            </button>

            {/* Logout button */}
            <button
              type="button"
              onClick={logout}
              title="Logout"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
export default Header;

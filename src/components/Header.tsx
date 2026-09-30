import React from 'react';
import { useApp } from '../context/AppContext';
import { StashProLogo } from './StashProLogo';
import { LogOut, Shield, Layers, Phone } from 'lucide-react';

export const Header: React.FC = () => {
  const { currentUser, logout, activeTab, setActiveTab, setIsProfileOpen, firestorePermissionError, setIsRulesModalOpen } = useApp();

  if (!currentUser) return null;

  return (
    <header className="sticky top-0 z-30 w-full max-w-full overflow-x-hidden bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        {/* Logo and App Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <StashProLogo size="md" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-lg font-black tracking-tight text-[#064e3b] font-sans lowercase">
                stāsh<span className="text-[#10b981] font-bold">-pro</span>
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-extrabold bg-emerald-50 text-[#064e3b] border border-emerald-300">
                AREA COVERAGE
              </span>
            </div>
            <p className="text-[10px] text-slate-500 hidden sm:block truncate">
              Field Visit & Territory Route Management • Asia/Kolkata
            </p>
          </div>
        </div>

        {/* User Info & Role Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {currentUser.role === 'admin' && (
            <div className="flex items-center bg-[#f1f5f9] p-0.5 sm:p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('worker')}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'worker'
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline sm:inline">Visits</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline sm:inline">Admin</span>
              </button>
            </div>
          )}

          {/* Current User Badge & Profile Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 border-l border-slate-200">
            {firestorePermissionError && (
              <button
                type="button"
                onClick={() => setIsRulesModalOpen(true)}
                className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Cloud sync requires Firestore rules. Click for instructions."
              >
                <span>⚠️</span>
                <span className="hidden sm:inline">Firebase Rules</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-50 transition-colors text-left cursor-pointer group"
              title="View Profile & Settings"
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  currentUser.role === 'admin'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-slate-100 text-slate-800 border border-slate-200'
                }`}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block max-w-[150px]">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 truncate">
                    {currentUser.name}
                  </span>
                  {currentUser.role === 'admin' && (
                    <span className="text-[9px] font-extrabold uppercase px-1 rounded bg-emerald-100 text-emerald-800">
                      Admin
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                  <Phone className="w-2.5 h-2.5 text-emerald-600" />
                  <span>{currentUser.mobile || '8108941215'}</span>
                </div>
              </div>
            </button>

            {/* Logout button */}
            <button
              type="button"
              onClick={logout}
              title="Logout"
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

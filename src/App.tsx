/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';
import { WorkerDashboard } from './components/WorkerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { ProfileModal } from './components/ProfileModal';
import { FirestoreRulesModal } from './components/FirestoreRulesModal';
import { Loader2, ShieldAlert } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser, loading, activeTab, firestorePermissionError, isRulesModalOpen, setIsRulesModalOpen } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-semibold text-slate-700">Connecting to Area Coverage Database...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-white text-slate-900 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Banner when Firestore security rules require setup */}
      {firestorePermissionError && (
        <div className="sticky top-0 z-50 bg-amber-400 text-slate-950 px-3 sm:px-4 py-2 text-xs font-semibold flex items-center justify-between gap-2 shadow-xs border-b border-amber-500">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldAlert className="w-4 h-4 text-slate-950 shrink-0" />
            <span className="truncate">
              <strong>Firebase Cloud Sync Setup:</strong> Project <em>area-coverage-manager</em> security rules need to be published. (Local sync active)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsRulesModalOpen(true)}
            className="shrink-0 bg-slate-950 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Fix in 1 Min
          </button>
        </div>
      )}

      {!currentUser ? (
        <LoginPage />
      ) : (
        <>
          <Header />
          <main className="flex-1 w-full max-w-full overflow-x-hidden bg-white">
            {activeTab === 'admin' && currentUser.role === 'admin' ? (
              <AdminDashboard />
            ) : (
              <WorkerDashboard />
            )}
          </main>
          <ProfileModal />
        </>
      )}

      {/* Security Rules Helper Modal */}
      <FirestoreRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        projectId="area-coverage-manager"
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

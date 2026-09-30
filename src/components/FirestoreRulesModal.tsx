import React, { useState } from 'react';
import { ShieldAlert, Copy, Check, ExternalLink, X, Info } from 'lucide-react';

interface FirestoreRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

const FIRESTORE_RULES_SNIPPET = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

export const FirestoreRulesModal: React.FC<FirestoreRulesModalProps> = ({
  isOpen,
  onClose,
  projectId = 'area-coverage-manager',
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(FIRESTORE_RULES_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const consoleUrl = `https://console.firebase.google.com/project/${projectId}/firestore/rules`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden text-slate-800">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-amber-50 border-b border-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Firestore Security Rules Setup
              </h2>
              <p className="text-xs text-amber-800 font-medium">
                Connected Project: <span className="font-mono font-semibold">{projectId}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Your Firebase project was connected, but Cloud Firestore rejected requests with{' '}
              <span className="font-semibold text-rose-700">"Missing or insufficient permissions"</span>.
              This occurs because newly initialized Firebase projects default to locking database access until rules are published in your Firebase Console.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Follow these 3 simple steps to enable full sync:
            </h3>
            <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside pl-1 font-medium">
              <li>
                Open the{' '}
                <a
                  href={consoleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline"
                >
                  Firebase Console Rules Editor <ExternalLink className="w-3 h-3" />
                </a>{' '}
                for your project.
              </li>
              <li>Replace the editor contents with the rules snippet below.</li>
              <li>
                Click <span className="font-bold text-emerald-800">Publish</span>.
              </li>
            </ol>
          </div>

          {/* Code snippet with copy button */}
          <div className="relative rounded-xl bg-slate-900 border border-slate-800 p-4 text-left overflow-hidden">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
              <span>firestore.rules</span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-300" />
                    <span>Copy Rules</span>
                  </>
                )}
              </button>
            </div>
            <pre className="text-xs font-mono text-emerald-400 whitespace-pre overflow-x-auto leading-relaxed">
              {FIRESTORE_RULES_SNIPPET}
            </pre>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2">
            <span className="text-sm">⚡</span>
            <p>
              <strong className="font-semibold text-emerald-800">Seamless Local Fallback Active:</strong>{' '}
              The app is currently functioning in resilient local mode with default Administrator (Anil Sakpal) and field worker accounts. You can test and use all area coverage features right now!
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            I'll do this later
          </button>
          <div className="flex items-center gap-2">
            <a
              href={consoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Open Firebase Console <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

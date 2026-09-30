import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
} from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const rawDbId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
const dbId = rawDbId && rawDbId !== '(default)' && rawDbId.trim() !== '' ? rawDbId : undefined;

let firestoreInstance;
try {
  firestoreInstance = dbId
    ? initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      }, dbId)
    : initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
} catch {
  // If already initialized (e.g., during fast refresh / re-imports)
  firestoreInstance = dbId ? getFirestore(app, dbId) : getFirestore(app);
}

// Initialize Firestore with local persistence & multi-tab synchronization
export const db = firestoreInstance;

// Test Firestore connection on boot
import('firebase/firestore').then(({ doc, getDocFromServer }) => {
  getDocFromServer(doc(db, 'test', 'connection')).catch((error) => {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  });
});

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export default app;

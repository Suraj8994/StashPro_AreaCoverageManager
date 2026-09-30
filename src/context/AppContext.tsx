import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Area, Visit, ActivityLog } from '../types';
import {
  subscribeAreas,
  subscribeUsers,
  subscribeVisits,
  subscribeActivityLogs,
  seedInitialDataIfNeeded,
  onPermissionErrorChange,
} from '../services/dataService';
import { auth } from '../firebase';
import { signInAnonymously } from 'firebase/auth';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  areas: Area[];
  visits: Visit[];
  activityLogs: ActivityLog[];
  loading: boolean;
  activeTab: 'worker' | 'admin';
  setActiveTab: (tab: 'worker' | 'admin') => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  logout: () => void;
  firestorePermissionError: boolean;
  setFirestorePermissionError: (val: boolean) => void;
  isRulesModalOpen: boolean;
  setIsRulesModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'area_coverage_manager_user';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState<User[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'worker' | 'admin'>('worker');
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [firestorePermissionError, setFirestorePermissionError] = useState<boolean>(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);

  // Subscribe to permission error status
  useEffect(() => {
    return onPermissionErrorChange((hasErr) => {
      setFirestorePermissionError(hasErr);
    });
  }, []);

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      setActiveTab('worker');
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // Keep currentUser synced in real time when users collection updates
  useEffect(() => {
    if (currentUser && users.length > 0) {
      const updated = users.find((u) => u.id === currentUser.id);
      if (updated) {
        if (!updated.active) {
          logout();
          alert('Your account has been disabled by Admin.');
          return;
        }
        if (JSON.stringify(updated) !== JSON.stringify(currentUser)) {
          setCurrentUserState(updated);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
        }
      }
    }
  }, [users]);

  // Seed on initial mount and setup subscriptions
  useEffect(() => {
    let unsubscribeAreas: (() => void) | undefined;
    let unsubscribeUsers: (() => void) | undefined;
    let unsubscribeVisits: (() => void) | undefined;
    let unsubscribeLogs: (() => void) | undefined;

    const init = async () => {
      // 1. Try anonymous login to satisfy rules if rules require auth != null
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch {
        // Ignored if anonymous auth provider is not enabled
      }

      // 2. Initial seed
      await seedInitialDataIfNeeded();

      // 3. Subscriptions (with immediate local fallback)
      unsubscribeAreas = subscribeAreas((fetchedAreas) => {
        setAreas(fetchedAreas);
        setLoading(false);
      });

      unsubscribeUsers = subscribeUsers((fetchedUsers) => {
        setUsers(fetchedUsers);
      });

      unsubscribeVisits = subscribeVisits((fetchedVisits) => {
        setVisits(fetchedVisits);
      });

      unsubscribeLogs = subscribeActivityLogs((fetchedLogs) => {
        setActivityLogs(fetchedLogs);
      });

      // 4. Safety watchdog: ensure loading is cleared even if network lags
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    };

    init();

    return () => {
      unsubscribeAreas?.();
      unsubscribeUsers?.();
      unsubscribeVisits?.();
      unsubscribeLogs?.();
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        areas,
        visits,
        activityLogs,
        loading,
        activeTab,
        setActiveTab,
        isProfileOpen,
        setIsProfileOpen,
        logout,
        firestorePermissionError,
        setFirestorePermissionError,
        isRulesModalOpen,
        setIsRulesModalOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

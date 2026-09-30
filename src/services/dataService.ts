import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  runTransaction,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import { User, Area, Visit, ActivityLog, LoginMethod } from '../types';
import { getKolkataDateString, addDays } from '../utils/dateUtils';
import { hashPassword, formatAndValidateMobile, validateEmail } from '../utils/securityUtils';

// Collections
const USERS_COLLECTION = 'users';
const AREAS_COLLECTION = 'areas';
const VISITS_COLLECTION = 'visits';
const ACTIVITY_COLLECTION = 'activity_logs';

// Local storage keys for resilient fallback
const STORAGE_KEY_USERS = 'area_coverage_local_users';
const STORAGE_KEY_AREAS = 'area_coverage_local_areas';
const STORAGE_KEY_VISITS = 'area_coverage_local_visits';
const STORAGE_KEY_LOGS = 'area_coverage_local_logs';

// Permission error detection & state management
let hasPermissionError = false;
const permissionListeners = new Set<(hasError: boolean) => void>();

export function isPermissionError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('Missing or insufficient permissions') ||
    msg.includes('permission-denied') ||
    (err as any)?.code === 'permission-denied'
  );
}

export function onPermissionErrorChange(listener: (hasError: boolean) => void) {
  permissionListeners.add(listener);
  listener(hasPermissionError);
  return () => {
    permissionListeners.delete(listener);
  };
}

export function notifyPermissionError(error: unknown) {
  if (isPermissionError(error)) {
    if (!hasPermissionError) {
      hasPermissionError = true;
      console.warn(
        '[Area Coverage] Cloud Firestore permission denied for project "area-coverage-manager". Using resilient local sync fallback. Please publish rules in Firebase Console.'
      );
      permissionListeners.forEach((fn) => fn(true));
    }
  }
}

// Initial seed data
const DEFAULT_HASH_1234 = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';

export const INITIAL_USERS: User[] = [
  {
    id: 'admin-1',
    name: 'Anil Sakpal',
    username: 'admin',
    email: 'anilsakpal@stashpro.com',
    mobile: '+91 8108941215',
    passwordHash: DEFAULT_HASH_1234,
    pin: '1234',
    role: 'admin',
    loginMethod: 'both',
    active: true,
    failedAttempts: 0,
    lockedUntil: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'worker-1',
    name: 'Rahul Sharma',
    username: 'rahul',
    email: 'rahul.sharma@field.com',
    mobile: '+91 9833445566',
    passwordHash: DEFAULT_HASH_1234,
    pin: '1234',
    role: 'worker',
    loginMethod: 'both',
    allocatedAreaIds: ['area-andheri', 'area-borivali'],
    active: true,
    failedAttempts: 0,
    lockedUntil: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'worker-2',
    name: 'Amit Patel',
    username: 'amit',
    email: 'amit.patel@field.com',
    mobile: '+91 9870123456',
    passwordHash: DEFAULT_HASH_1234,
    pin: '1234',
    role: 'worker',
    loginMethod: 'both',
    allocatedAreaIds: ['area-jogeshwari', 'area-goregaon'],
    active: true,
    failedAttempts: 0,
    lockedUntil: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'worker-3',
    name: 'Sunil Verma',
    username: 'sunil',
    email: 'sunil.verma@field.com',
    mobile: '+91 9819876543',
    passwordHash: DEFAULT_HASH_1234,
    pin: '1234',
    role: 'worker',
    loginMethod: 'both',
    allocatedAreaIds: ['area-malad', 'area-kandivali'],
    active: true,
    failedAttempts: 0,
    lockedUntil: null,
    createdAt: new Date().toISOString(),
  },
];

function getInitialAreas(): Area[] {
  const today = getKolkataDateString();
  const nowIso = new Date().toISOString();
  return [
    {
      id: 'area-andheri',
      name: 'Andheri East',
      visitIntervalDays: 7,
      active: true,
      currentStatus: 'WAIT',
      nextVisitDate: addDays(today, 5),
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'area-jogeshwari',
      name: 'Jogeshwari',
      visitIntervalDays: 5,
      active: true,
      currentStatus: 'WAIT',
      nextVisitDate: addDays(today, 1),
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'area-goregaon',
      name: 'Goregaon',
      visitIntervalDays: 10,
      active: true,
      currentStatus: 'WAIT',
      nextVisitDate: today,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'area-malad',
      name: 'Malad West',
      visitIntervalDays: 15,
      active: true,
      currentStatus: 'WAIT',
      nextVisitDate: addDays(today, -2),
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'area-borivali',
      name: 'Borivali Station',
      visitIntervalDays: 7,
      active: true,
      currentStatus: 'COMPLETED',
      completedByWorkerId: 'worker-1',
      completedByWorkerName: 'Rahul Sharma',
      completedAt: nowIso,
      nextVisitDate: addDays(today, 7),
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'area-kandivali',
      name: 'Kandivali Industrial',
      visitIntervalDays: 12,
      active: true,
      currentStatus: 'WAIT',
      nextVisitDate: addDays(today, 3),
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];
}

// Local cache helper functions
function getLocalUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [...INITIAL_USERS];
}

function saveLocalUsers(users: User[]) {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch {}
}

function getLocalAreas(): Area[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AREAS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return getInitialAreas();
}

function saveLocalAreas(areas: Area[]) {
  try {
    localStorage.setItem(STORAGE_KEY_AREAS, JSON.stringify(areas));
  } catch {}
}

function getLocalVisits(): Visit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VISITS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveLocalVisits(visits: Visit[]) {
  try {
    localStorage.setItem(STORAGE_KEY_VISITS, JSON.stringify(visits));
  } catch {}
}

function getLocalLogs(): ActivityLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveLocalLogs(logs: ActivityLog[]) {
  try {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
  } catch {}
}

// Active UI subscriber callbacks
const areaSubscribers = new Set<(areas: Area[]) => void>();
const userSubscribers = new Set<(users: User[]) => void>();
const visitSubscribers = new Set<(visits: Visit[]) => void>();
const logSubscribers = new Set<(logs: ActivityLog[]) => void>();

function notifyLocalAreas() {
  const data = getLocalAreas();
  areaSubscribers.forEach((fn) => fn(data));
}

function notifyLocalUsers() {
  const data = getLocalUsers();
  userSubscribers.forEach((fn) => fn(data));
}

function notifyLocalVisits() {
  const data = getLocalVisits();
  visitSubscribers.forEach((fn) => fn(data));
}

function notifyLocalLogs() {
  const data = getLocalLogs();
  logSubscribers.forEach((fn) => fn(data));
}

/**
 * Migration & Seed function:
 * Preserves all existing data, safely backfills mobile, email, loginMethod, passwordHash, and allocations
 */
export async function seedInitialDataIfNeeded(): Promise<void> {
  // Ensure local storage has baseline data first so local sync is instant
  if (!localStorage.getItem(STORAGE_KEY_USERS)) {
    saveLocalUsers(INITIAL_USERS);
  }
  if (!localStorage.getItem(STORAGE_KEY_AREAS)) {
    saveLocalAreas(getInitialAreas());
  }

  try {
    const usersSnap = await getDocs(collection(db, USERS_COLLECTION));
    const defaultHash = await hashPassword('1234');

    if (usersSnap.empty) {
      for (const u of INITIAL_USERS) {
        await setDoc(doc(db, USERS_COLLECTION, u.id), u);
      }
    } else {
      let hasAdmin = false;
      for (const userDoc of usersSnap.docs) {
        const u = userDoc.data() as User;
        const updates: Partial<User> = {};

        if (u.role === 'admin' || u.username === 'admin' || u.id === 'admin-1') {
          hasAdmin = true;
          if (u.name !== 'Anil Sakpal') updates.name = 'Anil Sakpal';
          if (u.mobile !== '+91 8108941215') updates.mobile = '+91 8108941215';
          if (u.role !== 'admin') updates.role = 'admin';
          if (!u.email) updates.email = 'anilsakpal@stashpro.com';
          if (!u.active) updates.active = true;
        }

        if (!u.email) updates.email = u.username === 'admin' ? 'anilsakpal@stashpro.com' : `${u.username}@field.com`;
        if (!u.mobile) updates.mobile = u.username === 'admin' ? '+91 8108941215' : '+91 9833445566';
        if (!u.loginMethod) updates.loginMethod = 'both';
        if (u.failedAttempts === undefined) updates.failedAttempts = 0;
        if (u.lockedUntil === undefined) updates.lockedUntil = null;
        if (!u.passwordHash) updates.passwordHash = await hashPassword(u.pin || '1234');
        if (!u.allocatedAreaIds) updates.allocatedAreaIds = [];

        if (Object.keys(updates).length > 0) {
          await updateDoc(doc(db, USERS_COLLECTION, userDoc.id), updates);
        }
      }

      if (!hasAdmin) {
        const adminUser: User = {
          id: 'admin-1',
          name: 'Anil Sakpal',
          username: 'admin',
          email: 'anilsakpal@stashpro.com',
          mobile: '+91 8108941215',
          passwordHash: defaultHash,
          pin: '1234',
          role: 'admin',
          loginMethod: 'both',
          active: true,
          failedAttempts: 0,
          lockedUntil: null,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, USERS_COLLECTION, adminUser.id), adminUser);
      }
    }

    const areasSnap = await getDocs(collection(db, AREAS_COLLECTION));
    if (areasSnap.empty) {
      const initialAreas = getInitialAreas();
      for (const a of initialAreas) {
        await setDoc(doc(db, AREAS_COLLECTION, a.id), a);
      }
    }
  } catch (err) {
    notifyPermissionError(err);
    // If not a permission error, log warning
    if (!isPermissionError(err)) {
      console.warn('Initial data check/seed notification:', err);
    }
  }
}

/**
 * Real-time listener for areas with automatic local fallback
 */
export function subscribeAreas(callback: (areas: Area[]) => void) {
  areaSubscribers.add(callback);
  // Immediately provide cached data to avoid UI freeze
  callback(getLocalAreas());

  const q = query(collection(db, AREAS_COLLECTION));
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const areas: Area[] = [];
      snapshot.forEach((docSnap) => {
        areas.push({ id: docSnap.id, ...(docSnap.data() as Omit<Area, 'id'>) });
      });
      areas.sort((a, b) => a.name.localeCompare(b.name));
      saveLocalAreas(areas);
      callback(areas);
    },
    (error) => {
      notifyPermissionError(error);
      // Serve local cache on error
      callback(getLocalAreas());
    }
  );

  return () => {
    areaSubscribers.delete(callback);
    unsubscribe();
  };
}

/**
 * Real-time listener for users with automatic local fallback
 */
export function subscribeUsers(callback: (users: User[]) => void) {
  userSubscribers.add(callback);
  // Immediately provide cached data
  callback(getLocalUsers());

  const q = query(collection(db, USERS_COLLECTION));
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((docSnap) => {
        users.push({ id: docSnap.id, ...(docSnap.data() as Omit<User, 'id'>) });
      });
      users.sort((a, b) => a.name.localeCompare(b.name));
      saveLocalUsers(users);
      callback(users);
    },
    (error) => {
      notifyPermissionError(error);
      callback(getLocalUsers());
    }
  );

  return () => {
    userSubscribers.delete(callback);
    unsubscribe();
  };
}

/**
 * Real-time listener for visits with automatic local fallback
 */
export function subscribeVisits(callback: (visits: Visit[]) => void, maxLimit = 100) {
  visitSubscribers.add(callback);
  callback(getLocalVisits());

  const q = query(collection(db, VISITS_COLLECTION), orderBy('createdAt', 'desc'), limit(maxLimit));
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const visits: Visit[] = [];
      snapshot.forEach((docSnap) => {
        visits.push({ id: docSnap.id, ...(docSnap.data() as Omit<Visit, 'id'>) });
      });
      saveLocalVisits(visits);
      callback(visits);
    },
    (error) => {
      notifyPermissionError(error);
      callback(getLocalVisits());
    }
  );

  return () => {
    visitSubscribers.delete(callback);
    unsubscribe();
  };
}

/**
 * Real-time listener for activity logs with automatic local fallback
 */
export function subscribeActivityLogs(callback: (logs: ActivityLog[]) => void, maxLimit = 50) {
  logSubscribers.add(callback);
  callback(getLocalLogs());

  const q = query(collection(db, ACTIVITY_COLLECTION), orderBy('createdAt', 'desc'), limit(maxLimit));
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const logs: ActivityLog[] = [];
      snapshot.forEach((docSnap) => {
        logs.push({ id: docSnap.id, ...(docSnap.data() as Omit<ActivityLog, 'id'>) });
      });
      saveLocalLogs(logs);
      callback(logs);
    },
    (error) => {
      notifyPermissionError(error);
      callback(getLocalLogs());
    }
  );

  return () => {
    logSubscribers.delete(callback);
    unsubscribe();
  };
}

// ================= AUTHENTICATION & SECURITY =================

export interface LoginResult {
  success: boolean;
  user?: User;
  errorMessage?: string;
  isLocked?: boolean;
  lockedUntil?: string;
  remainingAttempts?: number;
}

/**
 * Verify Email or Username + Password login with:
 * - 3 consecutive wrong attempts => 24-hour server lockout
 * - Reset attempts on successful login
 * - Check if password login is allowed for this user's loginMethod
 */
export async function authenticateWithPassword(
  identifier: string,
  passwordPlain: string
): Promise<LoginResult> {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = passwordPlain.trim();

  if (!cleanId || !cleanPass) {
    return { success: false, errorMessage: 'Please enter both your email/username and password.' };
  }

  const digitsOnly = cleanId.replace(/\D/g, '');

  let users: User[] = [];
  try {
    const usersSnap = await getDocs(collection(db, USERS_COLLECTION));
    users = usersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<User, 'id'>) }));
  } catch (err) {
    notifyPermissionError(err);
    users = getLocalUsers();
  }

  const user = users.find((data) => {
    const userDigits = (data.mobile || '').replace(/\D/g, '');
    const mobileMatches =
      digitsOnly.length >= 10 &&
      userDigits.length >= 10 &&
      (userDigits.endsWith(digitsOnly.slice(-10)) || digitsOnly.endsWith(userDigits.slice(-10)));
    const nameMatches = data.name && (data.name.toLowerCase() === cleanId || cleanId.includes(data.name.toLowerCase()));
    return (
      (data.email && data.email.toLowerCase() === cleanId) ||
      (data.username && data.username.toLowerCase() === cleanId) ||
      Boolean(mobileMatches) ||
      Boolean(nameMatches)
    );
  });

  if (!user) {
    return {
      success: false,
      errorMessage: 'Your account is not registered. Please contact Admin.',
    };
  }

  if (!user.active) {
    return {
      success: false,
      errorMessage: 'This account has been disabled by the admin. Please contact Admin.',
    };
  }

  if (user.loginMethod === 'google') {
    return {
      success: false,
      errorMessage: 'This account is configured for Google Login only. Please click "Continue with Google".',
    };
  }

  const now = new Date();

  // Check server-side 24-hour lockout
  if (user.lockedUntil) {
    const lockedUntilDate = new Date(user.lockedUntil);
    if (lockedUntilDate.getTime() > now.getTime()) {
      return {
        success: false,
        isLocked: true,
        lockedUntil: user.lockedUntil,
        errorMessage: `Password login is temporarily locked due to 3 incorrect attempts. Please try again after ${lockedUntilDate.toLocaleTimeString(
          'en-IN',
          { hour: '2-digit', minute: '2-digit', hour12: true }
        )} or contact Admin to unlock your account.`,
      };
    } else {
      user.failedAttempts = 0;
      user.lockedUntil = null;
      try {
        await updateDoc(doc(db, USERS_COLLECTION, user.id), {
          failedAttempts: 0,
          lockedUntil: null,
        });
      } catch (e) {
        notifyPermissionError(e);
      }
    }
  }

  // Compute password hash
  const computedHash = await hashPassword(cleanPass);
  const passwordMatches = user.passwordHash === computedHash || user.pin === cleanPass;

  if (!passwordMatches) {
    const currentFailed = (user.failedAttempts || 0) + 1;
    user.failedAttempts = currentFailed;

    if (currentFailed >= 3) {
      const lockExpire = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      user.lockedUntil = lockExpire;

      try {
        await updateDoc(doc(db, USERS_COLLECTION, user.id), {
          failedAttempts: currentFailed,
          lockedUntil: lockExpire,
        });
        const logRef = doc(collection(db, ACTIVITY_COLLECTION));
        await setDoc(logRef, {
          id: logRef.id,
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          areaId: '',
          areaName: '',
          action: 'ACCOUNT_LOCKED',
          details: 'Account temporarily locked for 24h after 3 failed password attempts.',
          createdAt: now.toISOString(),
        });
      } catch (e) {
        notifyPermissionError(e);
      }

      // Update local storage
      const localUsers = getLocalUsers().map((u) => (u.id === user.id ? { ...u, failedAttempts: currentFailed, lockedUntil: lockExpire } : u));
      saveLocalUsers(localUsers);
      notifyLocalUsers();

      return {
        success: false,
        isLocked: true,
        lockedUntil: lockExpire,
        errorMessage:
          'Account locked for 24 hours after 3 consecutive wrong password attempts. Please contact Admin to unlock or try again in 24 hours.',
      };
    } else {
      try {
        await updateDoc(doc(db, USERS_COLLECTION, user.id), {
          failedAttempts: currentFailed,
        });
      } catch (e) {
        notifyPermissionError(e);
      }

      const localUsers = getLocalUsers().map((u) => (u.id === user.id ? { ...u, failedAttempts: currentFailed } : u));
      saveLocalUsers(localUsers);
      notifyLocalUsers();

      const remaining = 3 - currentFailed;
      return {
        success: false,
        remainingAttempts: remaining,
        errorMessage: `Incorrect password. ${remaining} attempt${
          remaining === 1 ? '' : 's'
        } remaining before 24-hour lockout.`,
      };
    }
  }

  // Password correct!
  const updatedUser: User = {
    ...user,
    failedAttempts: 0,
    lockedUntil: null,
    lastLoginAt: now.toISOString(),
  };

  try {
    await updateDoc(doc(db, USERS_COLLECTION, user.id), {
      failedAttempts: 0,
      lockedUntil: null,
      lastLoginAt: now.toISOString(),
    });
  } catch (e) {
    notifyPermissionError(e);
  }

  const localUsers = getLocalUsers().map((u) => (u.id === user.id ? updatedUser : u));
  saveLocalUsers(localUsers);
  notifyLocalUsers();

  return {
    success: true,
    user: updatedUser,
  };
}

/**
 * Verify Google authentication:
 * Matches Google email to pre-registered account by Admin.
 */
export async function authenticateWithGoogleAccount(googleEmail: string): Promise<LoginResult> {
  const cleanEmail = googleEmail.trim().toLowerCase();

  let users: User[] = [];
  try {
    const usersSnap = await getDocs(collection(db, USERS_COLLECTION));
    users = usersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<User, 'id'>) }));
  } catch (err) {
    notifyPermissionError(err);
    users = getLocalUsers();
  }

  const user = users.find((data) => data.email && data.email.toLowerCase() === cleanEmail);

  if (!user) {
    return {
      success: false,
      errorMessage: 'Your account is not registered. Please contact Admin.',
    };
  }

  if (!user.active) {
    return {
      success: false,
      errorMessage: 'This account has been disabled by the admin. Please contact Admin.',
    };
  }

  if (user.loginMethod === 'password') {
    return {
      success: false,
      errorMessage:
        'This account is configured for Email & Password login only. Google Login is not enabled for your account.',
    };
  }

  const nowIso = new Date().toISOString();
  try {
    await updateDoc(doc(db, USERS_COLLECTION, user.id), {
      lastLoginAt: nowIso,
    });
  } catch (e) {
    notifyPermissionError(e);
  }

  return {
    success: true,
    user: { ...user, lastLoginAt: nowIso },
  };
}

/**
 * Admin: Unlock user account or reset failed password attempts
 */
export async function unlockUserAccount(userId: string, adminUser: User): Promise<{ success: boolean; message?: string }> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const nowIso = new Date().toISOString();

    await updateDoc(userRef, {
      failedAttempts: 0,
      lockedUntil: null,
      updatedAt: nowIso,
    });

    const logRef = doc(collection(db, ACTIVITY_COLLECTION));
    await setDoc(logRef, {
      id: logRef.id,
      userId: adminUser.id,
      userName: adminUser.name,
      userRole: adminUser.role,
      areaId: '',
      areaName: '',
      action: 'ACCOUNT_UNLOCKED',
      details: `Admin unlocked account for user ${userId}`,
      createdAt: nowIso,
    });
  } catch (err: any) {
    notifyPermissionError(err);
  }

  // Update local cache
  const localUsers = getLocalUsers().map((u) => (u.id === userId ? { ...u, failedAttempts: 0, lockedUntil: null } : u));
  saveLocalUsers(localUsers);
  notifyLocalUsers();

  return { success: true };
}

/**
 * Change password for current logged-in user
 */
export async function changeUserPassword(
  userId: string,
  currentPassPlain: string,
  newPassPlain: string
): Promise<{ success: boolean; message?: string }> {
  const users = getLocalUsers();
  const u = users.find((user) => user.id === userId);

  if (!u) {
    return { success: false, message: 'User not found.' };
  }

  if (u.loginMethod === 'google') {
    return {
      success: false,
      message: 'Your account is authenticated via Google. Password is managed by Google and cannot be changed here.',
    };
  }

  const currentHash = await hashPassword(currentPassPlain.trim());
  const isCurrentValid = u.passwordHash === currentHash || u.pin === currentPassPlain.trim();

  if (!isCurrentValid) {
    return { success: false, message: 'Current password does not match.' };
  }

  if (newPassPlain.length < 4) {
    return { success: false, message: 'New password must be at least 4 characters long.' };
  }

  const newHash = await hashPassword(newPassPlain.trim());
  const nowIso = new Date().toISOString();

  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      passwordHash: newHash,
      pin: newPassPlain.trim(),
      failedAttempts: 0,
      lockedUntil: null,
      updatedAt: nowIso,
    });
    const logRef = doc(collection(db, ACTIVITY_COLLECTION));
    await setDoc(logRef, {
      id: logRef.id,
      userId: u.id,
      userName: u.name,
      userRole: u.role,
      areaId: '',
      areaName: '',
      action: 'PASSWORD_CHANGED',
      details: `${u.name} successfully changed their password.`,
      createdAt: nowIso,
    });
  } catch (err: any) {
    notifyPermissionError(err);
  }

  const updatedUsers = users.map((user) =>
    user.id === userId
      ? { ...user, passwordHash: newHash, pin: newPassPlain.trim(), failedAttempts: 0, lockedUntil: null, updatedAt: nowIso }
      : user
  );
  saveLocalUsers(updatedUsers);
  notifyLocalUsers();

  return { success: true };
}

/**
 * Update Admin Mobile Number, Email Address & Profile
 */
export async function updateAdminProfile(
  adminId: string,
  updates: { mobile?: string; name?: string; email?: string }
): Promise<{ success: boolean; message?: string }> {
  const users = getLocalUsers();
  const finalUpdates: Partial<User> = {
    updatedAt: new Date().toISOString(),
  };

  if (updates.name !== undefined && updates.name.trim()) {
    finalUpdates.name = updates.name.trim();
  }

  if (updates.email !== undefined && updates.email.trim()) {
    const cleanEmail = updates.email.trim().toLowerCase();
    if (!validateEmail(cleanEmail)) {
      return { success: false, message: 'Invalid email address format.' };
    }
    const duplicateEmail = users.some((d) => d.id !== adminId && d.email?.toLowerCase() === cleanEmail);
    if (duplicateEmail) {
      return { success: false, message: `Email "${cleanEmail}" is already used by another account.` };
    }
    finalUpdates.email = cleanEmail;
  }

  if (updates.mobile !== undefined && updates.mobile.trim()) {
    const mobileCheck = formatAndValidateMobile(updates.mobile);
    if (!mobileCheck.valid) {
      return { success: false, message: mobileCheck.error };
    }
    finalUpdates.mobile = mobileCheck.formatted;
  }

  try {
    const userRef = doc(db, USERS_COLLECTION, adminId);
    await updateDoc(userRef, finalUpdates);
    const logRef = doc(collection(db, ACTIVITY_COLLECTION));
    await setDoc(logRef, {
      id: logRef.id,
      userId: adminId,
      userName: updates.name || 'Admin',
      userRole: 'admin',
      areaId: '',
      areaName: '',
      action: 'ADMIN_PROFILE_UPDATED',
      details: `Admin profile modified: ${JSON.stringify(finalUpdates)}`,
      createdAt: new Date().toISOString(),
    });
  } catch (err: any) {
    notifyPermissionError(err);
  }

  const updatedUsers = users.map((u) => (u.id === adminId ? { ...u, ...finalUpdates } : u));
  saveLocalUsers(updatedUsers);
  notifyLocalUsers();

  return { success: true };
}

// ================= WORKER MANAGEMENT =================

export interface WorkerFormData {
  name: string;
  username: string;
  email: string;
  mobile: string;
  allocatedAreaIds: string[];
  loginMethod: LoginMethod;
  active: boolean;
  pin?: string;
}

export async function createWorker(data: WorkerFormData, adminUser: User): Promise<{ success: boolean; message?: string }> {
  const cleanUsername = data.username.trim().toLowerCase();
  const cleanEmail = data.email.trim().toLowerCase();

  if (!cleanUsername || cleanUsername.length < 3) {
    return { success: false, message: 'Username must be at least 3 characters long.' };
  }

  if (!validateEmail(cleanEmail)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  const mobileCheck = formatAndValidateMobile(data.mobile);
  if (!mobileCheck.valid) {
    return { success: false, message: mobileCheck.error };
  }

  const users = getLocalUsers();
  const duplicate = users.some(
    (u) => u.username?.toLowerCase() === cleanUsername || u.email?.toLowerCase() === cleanEmail
  );

  if (duplicate) {
    return { success: false, message: 'A worker with this username or email already exists.' };
  }

  const passwordToUse = data.pin && data.pin.trim() ? data.pin.trim() : '1234';
  const passwordHash = await hashPassword(passwordToUse);
  const nowIso = new Date().toISOString();
  const workerId = `worker-${Date.now().toString(36)}`;

  const newWorker: User = {
    id: workerId,
    name: data.name.trim(),
    username: cleanUsername,
    email: cleanEmail,
    mobile: mobileCheck.formatted,
    role: 'worker',
    active: data.active,
    pin: passwordToUse,
    passwordHash,
    loginMethod: data.loginMethod,
    allocatedAreaIds: data.allocatedAreaIds || [],
    failedAttempts: 0,
    lockedUntil: null,
    createdAt: nowIso,
  };

  try {
    await setDoc(doc(db, USERS_COLLECTION, workerId), newWorker);
    const logRef = doc(collection(db, ACTIVITY_COLLECTION));
    await setDoc(logRef, {
      id: logRef.id,
      userId: adminUser.id,
      userName: adminUser.name,
      userRole: adminUser.role,
      areaId: '',
      areaName: '',
      action: 'WORKER_UPDATED',
      details: `Admin created new field worker: ${data.name} (@${cleanUsername})`,
      createdAt: nowIso,
    });
  } catch (err: any) {
    notifyPermissionError(err);
  }

  users.push(newWorker);
  saveLocalUsers(users);
  notifyLocalUsers();

  return { success: true };
}

export async function updateWorker(
  workerId: string,
  data: Partial<WorkerFormData>,
  adminUser: User
): Promise<{ success: boolean; message?: string }> {
  const users = getLocalUsers();
  const user = users.find((u) => u.id === workerId);
  if (!user) {
    return { success: false, message: 'Worker not found.' };
  }

  const updates: Partial<User> = {
    updatedAt: new Date().toISOString(),
  };

  if (data.name !== undefined) updates.name = data.name.trim();

  if (data.email !== undefined) {
    const cleanEmail = data.email.trim().toLowerCase();
    if (!validateEmail(cleanEmail)) {
      return { success: false, message: 'Invalid email address.' };
    }
    const duplicateEmail = users.some((d) => d.id !== workerId && d.email?.toLowerCase() === cleanEmail);
    if (duplicateEmail) {
      return { success: false, message: `Email "${cleanEmail}" is already used by another user.` };
    }
    updates.email = cleanEmail;
  }

  if (data.mobile !== undefined) {
    const mobileCheck = formatAndValidateMobile(data.mobile);
    if (!mobileCheck.valid) {
      return { success: false, message: mobileCheck.error };
    }
    updates.mobile = mobileCheck.formatted;
  }

  if (data.allocatedAreaIds !== undefined) {
    updates.allocatedAreaIds = data.allocatedAreaIds;
  }

  if (data.loginMethod !== undefined) {
    updates.loginMethod = data.loginMethod;
  }

  if (data.active !== undefined) {
    updates.active = data.active;
  }

  if (data.pin) {
    updates.pin = data.pin.trim();
    updates.passwordHash = await hashPassword(data.pin.trim());
    updates.failedAttempts = 0;
    updates.lockedUntil = null;
  }

  try {
    const userRef = doc(db, USERS_COLLECTION, workerId);
    await updateDoc(userRef, updates);
    const logRef = doc(collection(db, ACTIVITY_COLLECTION));
    await setDoc(logRef, {
      id: logRef.id,
      userId: adminUser.id,
      userName: adminUser.name,
      userRole: adminUser.role,
      areaId: '',
      areaName: '',
      action: 'WORKER_UPDATED',
      details: `Admin updated worker details for ${data.name || workerId}`,
      createdAt: new Date().toISOString(),
    });
  } catch (err: any) {
    notifyPermissionError(err);
  }

  const updatedUsers = users.map((u) => (u.id === workerId ? { ...u, ...updates } : u));
  saveLocalUsers(updatedUsers);
  notifyLocalUsers();

  return { success: true };
}

export async function toggleWorkerStatus(userId: string, active: boolean): Promise<{ success: boolean; message?: string }> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, { active, updatedAt: new Date().toISOString() });
  } catch (err: any) {
    notifyPermissionError(err);
  }

  const users = getLocalUsers().map((u) => (u.id === userId ? { ...u, active, updatedAt: new Date().toISOString() } : u));
  saveLocalUsers(users);
  notifyLocalUsers();

  return { success: true };
}

// ================= TRANSACTIONAL AREA ACTIONS =================

export async function startAreaVisit(areaId: string, worker: User): Promise<{ success: boolean; message?: string }> {
  const areas = getLocalAreas();
  const areaData = areas.find((a) => a.id === areaId);

  if (!areaData) {
    return { success: false, message: 'Area not found.' };
  }

  if (areaData.currentStatus === 'IN_PROGRESS') {
    const workerName = areaData.currentWorkerName || 'another worker';
    return {
      success: false,
      message: `This area is already in progress by ${workerName}.`,
    };
  }

  const nowIso = new Date().toISOString();

  // Try Firestore transaction
  try {
    const areaRef = doc(db, AREAS_COLLECTION, areaId);
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(areaRef);
      if (!snap.exists()) throw new Error('Area not found.');
      transaction.update(areaRef, {
        currentStatus: 'IN_PROGRESS',
        currentWorkerId: worker.id,
        currentWorkerName: worker.name,
        startedAt: nowIso,
        updatedAt: nowIso,
      });
      const logRef = doc(collection(db, ACTIVITY_COLLECTION));
      transaction.set(logRef, {
        id: logRef.id,
        userId: worker.id,
        userName: worker.name,
        userRole: worker.role,
        areaId,
        areaName: areaData.name,
        action: 'VISIT_STARTED',
        oldStatus: areaData.currentStatus,
        newStatus: 'IN_PROGRESS',
        details: `${worker.name} started visit`,
        createdAt: nowIso,
      });
    });
  } catch (err: any) {
    notifyPermissionError(err);
  }

  // Update local cache
  const updatedAreas = areas.map((a) =>
    a.id === areaId
      ? {
          ...a,
          currentStatus: 'IN_PROGRESS' as const,
          currentWorkerId: worker.id,
          currentWorkerName: worker.name,
          startedAt: nowIso,
          updatedAt: nowIso,
        }
      : a
  );
  saveLocalAreas(updatedAreas);
  notifyLocalAreas();

  const logs = getLocalLogs();
  logs.unshift({
    id: `log-${Date.now()}`,
    userId: worker.id,
    userName: worker.name,
    userRole: worker.role,
    areaId,
    areaName: areaData.name,
    action: 'VISIT_STARTED',
    oldStatus: areaData.currentStatus,
    newStatus: 'IN_PROGRESS',
    details: `${worker.name} started visit`,
    createdAt: nowIso,
  });
  saveLocalLogs(logs);
  notifyLocalLogs();

  return { success: true };
}

export async function completeAreaVisit(
  areaId: string,
  worker: User
): Promise<{ success: boolean; message?: string }> {
  const areas = getLocalAreas();
  const areaData = areas.find((a) => a.id === areaId);

  if (!areaData) {
    return { success: false, message: 'Area not found.' };
  }

  if (areaData.currentStatus === 'COMPLETED') {
    return {
      success: false,
      message: `This area is already marked as completed by ${areaData.completedByWorkerName || 'a worker'}.`,
    };
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const actualCompletionDate = getKolkataDateString(now);

  const isEarly = !!areaData.nextVisitDate && areaData.nextVisitDate > actualCompletionDate;
  const visitType = isEarly ? 'Early Visit' : 'Normal';
  const nextVisitDate = addDays(actualCompletionDate, areaData.visitIntervalDays || 7);

  // Try Firestore transaction
  try {
    const areaRef = doc(db, AREAS_COLLECTION, areaId);
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(areaRef);
      if (!snap.exists()) throw new Error('Area not found.');
      transaction.update(areaRef, {
        currentStatus: 'COMPLETED',
        currentWorkerId: null,
        currentWorkerName: null,
        completedAt: nowIso,
        completedByWorkerId: worker.id,
        completedByWorkerName: worker.name,
        nextVisitDate,
        isEarlyVisit: isEarly,
        updatedAt: nowIso,
      });

      const visitRef = doc(collection(db, VISITS_COLLECTION));
      transaction.set(visitRef, {
        id: visitRef.id,
        areaId,
        areaName: areaData.name,
        workerId: worker.id,
        workerName: worker.name,
        startTime: areaData.startedAt || nowIso,
        completionTime: nowIso,
        plannedVisitDate: areaData.nextVisitDate,
        actualCompletionDate,
        visitType,
        createdAt: nowIso,
      });

      const logRef = doc(collection(db, ACTIVITY_COLLECTION));
      transaction.set(logRef, {
        id: logRef.id,
        userId: worker.id,
        userName: worker.name,
        userRole: worker.role,
        areaId,
        areaName: areaData.name,
        action: 'VISIT_COMPLETED',
        oldStatus: areaData.currentStatus,
        newStatus: 'COMPLETED',
        details: `${worker.name} completed visit (${visitType}). Next visit scheduled for ${nextVisitDate}.`,
        createdAt: nowIso,
      });
    });
  } catch (err: any) {
    notifyPermissionError(err);
  }

  // Update local cache
  const updatedAreas = areas.map((a) =>
    a.id === areaId
      ? {
          ...a,
          currentStatus: 'COMPLETED' as const,
          currentWorkerId: undefined,
          currentWorkerName: undefined,
          completedAt: nowIso,
          completedByWorkerId: worker.id,
          completedByWorkerName: worker.name,
          nextVisitDate,
          isEarlyVisit: isEarly,
          updatedAt: nowIso,
        }
      : a
  );
  saveLocalAreas(updatedAreas);
  notifyLocalAreas();

  const visits = getLocalVisits();
  visits.unshift({
    id: `visit-${Date.now()}`,
    areaId,
    areaName: areaData.name,
    workerId: worker.id,
    workerName: worker.name,
    startTime: areaData.startedAt || nowIso,
    completionTime: nowIso,
    plannedVisitDate: areaData.nextVisitDate,
    actualCompletionDate,
    visitType,
    createdAt: nowIso,
  });
  saveLocalVisits(visits);
  notifyLocalVisits();

  const logs = getLocalLogs();
  logs.unshift({
    id: `log-${Date.now()}`,
    userId: worker.id,
    userName: worker.name,
    userRole: worker.role,
    areaId,
    areaName: areaData.name,
    action: 'VISIT_COMPLETED',
    oldStatus: areaData.currentStatus,
    newStatus: 'COMPLETED',
    details: `${worker.name} completed visit (${visitType}). Next visit scheduled for ${nextVisitDate}.`,
    createdAt: nowIso,
  });
  saveLocalLogs(logs);
  notifyLocalLogs();

  return { success: true };
}

export async function undoAreaCompletion(
  areaId: string,
  user: User
): Promise<{ success: boolean; message?: string }> {
  const areas = getLocalAreas();
  const areaData = areas.find((a) => a.id === areaId);

  if (!areaData) {
    return { success: false, message: 'Area not found.' };
  }

  if (areaData.currentStatus !== 'COMPLETED') {
    return { success: false, message: 'Area is not in completed state.' };
  }

  if (user.role !== 'admin' && areaData.completedByWorkerId !== user.id) {
    return {
      success: false,
      message: 'Only the worker who completed this visit or an Admin can undo this completion.',
    };
  }

  const nowIso = new Date().toISOString();

  try {
    const areaRef = doc(db, AREAS_COLLECTION, areaId);
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(areaRef);
      if (!snap.exists()) throw new Error('Area not found.');
      transaction.update(areaRef, {
        currentStatus: 'IN_PROGRESS',
        currentWorkerId: user.id,
        currentWorkerName: user.name,
        startedAt: areaData.startedAt || nowIso,
        completedAt: null,
        completedByWorkerId: null,
        completedByWorkerName: null,
        updatedAt: nowIso,
      });
      const logRef = doc(collection(db, ACTIVITY_COLLECTION));
      transaction.set(logRef, {
        id: logRef.id,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        areaId,
        areaName: areaData.name,
        action: 'COMPLETION_UNDONE',
        oldStatus: 'COMPLETED',
        newStatus: 'IN_PROGRESS',
        details: `${user.name} reverted completion back to IN PROGRESS`,
        createdAt: nowIso,
      });
    });
  } catch (err: any) {
    notifyPermissionError(err);
  }

  const updatedAreas = areas.map((a) =>
    a.id === areaId
      ? {
          ...a,
          currentStatus: 'IN_PROGRESS' as const,
          currentWorkerId: user.id,
          currentWorkerName: user.name,
          startedAt: a.startedAt || nowIso,
          completedAt: undefined,
          completedByWorkerId: undefined,
          completedByWorkerName: undefined,
          updatedAt: nowIso,
        }
      : a
  );
  saveLocalAreas(updatedAreas);
  notifyLocalAreas();

  return { success: true };
}

// ================= ADMIN AREA MANAGEMENT =================

export async function addArea(name: string, visitIntervalDays: number, adminUser: User): Promise<{ success: boolean; message?: string }> {
  const cleanName = name.trim();
  if (!cleanName) {
    return { success: false, message: 'Area name is required.' };
  }

  const areas = getLocalAreas();
  const duplicate = areas.some((a) => a.active && a.name.toLowerCase() === cleanName.toLowerCase());
  if (duplicate) {
    return { success: false, message: `An active area named "${cleanName}" already exists.` };
  }

  const todayStr = getKolkataDateString();
  const nowIso = new Date().toISOString();
  const areaId = `area-${Date.now().toString(36)}`;

  const newArea: Area = {
    id: areaId,
    name: cleanName,
    visitIntervalDays,
    active: true,
    currentStatus: 'WAIT',
    nextVisitDate: todayStr,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  try {
    const areaRef = doc(collection(db, AREAS_COLLECTION), areaId);
    await setDoc(areaRef, newArea);
    const logRef = doc(collection(db, ACTIVITY_COLLECTION));
    await setDoc(logRef, {
      id: logRef.id,
      userId: adminUser.id,
      userName: adminUser.name,
      userRole: adminUser.role,
      areaId,
      areaName: cleanName,
      action: 'AREA_CREATED',
      newStatus: 'WAIT',
      details: `Created area with ${visitIntervalDays}-day interval`,
      createdAt: nowIso,
    });
  } catch (err: any) {
    notifyPermissionError(err);
  }

  areas.push(newArea);
  saveLocalAreas(areas);
  notifyLocalAreas();

  return { success: true };
}

export async function updateArea(
  areaId: string,
  updates: { name?: string; visitIntervalDays?: number; active?: boolean },
  adminUser: User
): Promise<{ success: boolean; message?: string }> {
  const areas = getLocalAreas();
  const nowIso = new Date().toISOString();

  try {
    const areaRef = doc(db, AREAS_COLLECTION, areaId);
    await updateDoc(areaRef, {
      ...updates,
      updatedAt: nowIso,
    });
    const logRef = doc(collection(db, ACTIVITY_COLLECTION));
    await setDoc(logRef, {
      id: logRef.id,
      userId: adminUser.id,
      userName: adminUser.name,
      userRole: adminUser.role,
      areaId,
      areaName: updates.name || areaId,
      action: 'AREA_UPDATED',
      details: `Admin updated settings: ${JSON.stringify(updates)}`,
      createdAt: nowIso,
    });
  } catch (err: any) {
    notifyPermissionError(err);
  }

  const updatedAreas = areas.map((a) => (a.id === areaId ? { ...a, ...updates, updatedAt: nowIso } : a));
  saveLocalAreas(updatedAreas);
  notifyLocalAreas();

  return { success: true };
}

export async function deactivateArea(areaId: string, areaName: string, adminUser: User): Promise<{ success: boolean; message?: string }> {
  const areas = getLocalAreas();
  const nowIso = new Date().toISOString();

  try {
    const areaRef = doc(db, AREAS_COLLECTION, areaId);
    await updateDoc(areaRef, {
      active: false,
      updatedAt: nowIso,
    });
    const logRef = doc(collection(db, ACTIVITY_COLLECTION));
    await setDoc(logRef, {
      id: logRef.id,
      userId: adminUser.id,
      userName: adminUser.name,
      userRole: adminUser.role,
      areaId,
      areaName,
      action: 'AREA_DELETED',
      details: 'Area deactivated/removed from active view',
      createdAt: nowIso,
    });
  } catch (err: any) {
    notifyPermissionError(err);
  }

  const updatedAreas = areas.map((a) => (a.id === areaId ? { ...a, active: false, updatedAt: nowIso } : a));
  saveLocalAreas(updatedAreas);
  notifyLocalAreas();

  return { success: true };
}

export async function deleteArea(areaId: string, adminUser: User): Promise<{ success: boolean; message?: string }> {
  return deactivateArea(areaId, areaId, adminUser);
}

export const unlockWorkerAccount = unlockUserAccount;
export const addWorkerComplete = createWorker;
export const updateWorkerComplete = updateWorker;

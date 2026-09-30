export type LoginMethod = 'both' | 'password' | 'google';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  mobile: string; // India format (+91 default)
  role: 'admin' | 'worker';
  active: boolean;
  pin?: string; // used for backwards compat / password
  passwordHash?: string; // SHA-256 hashed password
  loginMethod: LoginMethod; // 'both' | 'password' | 'google'
  allocatedAreaIds?: string[]; // Array of area ids allocated to this worker
  failedAttempts?: number; // 0-3 failed consecutive password attempts
  lockedUntil?: string | null; // ISO timestamp if locked out for 24h
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export type AreaStatus = 'WAIT' | 'VISIT_TOMORROW' | 'VISIT_TODAY' | 'IN_PROGRESS' | 'COMPLETED';

export interface Area {
  id: string;
  name: string;
  visitIntervalDays: number;
  active: boolean;
  currentStatus: AreaStatus; // 'IN_PROGRESS' | 'COMPLETED' | 'WAIT' / computed
  currentWorkerId?: string;
  currentWorkerName?: string;
  startedAt?: string; // ISO string
  completedAt?: string; // ISO string
  completedByWorkerId?: string;
  completedByWorkerName?: string;
  nextVisitDate?: string; // YYYY-MM-DD
  isEarlyVisit?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Visit {
  id: string;
  areaId: string;
  areaName: string;
  workerId: string;
  workerName: string;
  startTime: string; // ISO
  completionTime: string; // ISO
  plannedVisitDate?: string; // YYYY-MM-DD
  actualCompletionDate: string; // YYYY-MM-DD
  visitType: 'Normal' | 'Early Visit';
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: 'admin' | 'worker';
  areaId: string;
  areaName: string;
  action: 'VISIT_STARTED' | 'VISIT_COMPLETED' | 'COMPLETION_UNDONE' | 'AREA_CREATED' | 'AREA_UPDATED' | 'AREA_DELETED' | 'PASSWORD_CHANGED' | 'ACCOUNT_LOCKED' | 'ACCOUNT_UNLOCKED' | 'WORKER_UPDATED';
  oldStatus?: string;
  newStatus?: string;
  details?: string;
  createdAt: string;
}

export interface AreaDisplayInfo {
  area: Area;
  computedStatus: AreaStatus;
  statusLabel: string;
  daysRemaining: number;
  formattedNextVisit: string;
  isOverdue: boolean;
  overdueDays: number;
}

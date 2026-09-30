import { Area, AreaStatus, AreaDisplayInfo } from '../types';

// Timezone: Asia/Kolkata
export const TIMEZONE = 'Asia/Kolkata';

/**
 * Returns current date formatted as YYYY-MM-DD in Asia/Kolkata
 */
export function getKolkataDateString(date: Date = new Date()): string {
  // Use Intl to format according to Asia/Kolkata
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date); // outputs YYYY-MM-DD
}

/**
 * Parses YYYY-MM-DD into a local midnight Date object for day difference calculation
 */
export function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Calculates calendar day difference (target - today)
 */
export function getDaysDifference(targetDateStr: string, fromDateStr: string = getKolkataDateString()): number {
  const target = parseDateOnly(targetDateStr);
  const from = parseDateOnly(fromDateStr);
  const diffTime = target.getTime() - from.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Adds interval days to a date string (YYYY-MM-DD)
 */
export function addDays(dateStr: string, days: number): string {
  const date = parseDateOnly(dateStr);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats date into readable string e.g. "29 Sep 2026"
 */
export function formatReadableDate(dateStr?: string): string {
  if (!dateStr) return 'Not Scheduled';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = parseDateOnly(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: TIMEZONE,
  });
}

/**
 * Formats ISO timestamp into readable Date & Time in IST
 * e.g. "29 Sep 2026, 10:30 AM"
 */
export function formatDateTimeIST(isoStr?: string): string {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  return d.toLocaleString('en-IN', {
    timeZone: TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats time only in IST e.g. "10:30 AM"
 */
export function formatTimeIST(isoStr?: string): string {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  return d.toLocaleTimeString('en-IN', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Evaluates the real-time display info for an Area
 */
export function getAreaDisplayInfo(area: Area): AreaDisplayInfo {
  const todayStr = getKolkataDateString();

  // If in progress, state is IN_PROGRESS
  if (area.currentStatus === 'IN_PROGRESS') {
    return {
      area,
      computedStatus: 'IN_PROGRESS',
      statusLabel: 'IN PROGRESS',
      daysRemaining: 0,
      formattedNextVisit: area.nextVisitDate ? formatReadableDate(area.nextVisitDate) : 'Today',
      isOverdue: false,
      overdueDays: 0,
    };
  }

  // If completed recently (within today or still in completed active cycle)
  if (area.currentStatus === 'COMPLETED') {
    if (!area.nextVisitDate) {
      return {
        area,
        computedStatus: 'COMPLETED',
        statusLabel: 'COMPLETED',
        daysRemaining: area.visitIntervalDays,
        formattedNextVisit: 'Completed',
        isOverdue: false,
        overdueDays: 0,
      };
    }

    const diffDays = getDaysDifference(area.nextVisitDate, todayStr);

    // If next visit date has arrived or passed, it becomes VISIT TODAY (or Overdue)
    if (diffDays < 0) {
      const overdue = Math.abs(diffDays);
      return {
        area,
        computedStatus: 'VISIT_TODAY',
        statusLabel: `VISIT TODAY (Overdue by ${overdue} day${overdue > 1 ? 's' : ''})`,
        daysRemaining: diffDays,
        formattedNextVisit: formatReadableDate(area.nextVisitDate),
        isOverdue: true,
        overdueDays: overdue,
      };
    } else if (diffDays === 0) {
      return {
        area,
        computedStatus: 'VISIT_TODAY',
        statusLabel: 'VISIT TODAY',
        daysRemaining: 0,
        formattedNextVisit: formatReadableDate(area.nextVisitDate),
        isOverdue: false,
        overdueDays: 0,
      };
    } else if (diffDays === 1) {
      return {
        area,
        computedStatus: 'VISIT_TOMORROW',
        statusLabel: 'VISIT TOMORROW',
        daysRemaining: 1,
        formattedNextVisit: formatReadableDate(area.nextVisitDate),
        isOverdue: false,
        overdueDays: 0,
      };
    } else {
      // Still in completed wait cycle
      return {
        area,
        computedStatus: 'COMPLETED',
        statusLabel: `COMPLETED (Next in ${diffDays} days)`,
        daysRemaining: diffDays,
        formattedNextVisit: formatReadableDate(area.nextVisitDate),
        isOverdue: false,
        overdueDays: 0,
      };
    }
  }

  // Otherwise, if area has a nextVisitDate:
  if (area.nextVisitDate) {
    const diffDays = getDaysDifference(area.nextVisitDate, todayStr);
    if (diffDays < 0) {
      const overdue = Math.abs(diffDays);
      return {
        area,
        computedStatus: 'VISIT_TODAY',
        statusLabel: `VISIT TODAY (Overdue by ${overdue} day${overdue > 1 ? 's' : ''})`,
        daysRemaining: diffDays,
        formattedNextVisit: formatReadableDate(area.nextVisitDate),
        isOverdue: true,
        overdueDays: overdue,
      };
    } else if (diffDays === 0) {
      return {
        area,
        computedStatus: 'VISIT_TODAY',
        statusLabel: 'VISIT TODAY',
        daysRemaining: 0,
        formattedNextVisit: formatReadableDate(area.nextVisitDate),
        isOverdue: false,
        overdueDays: 0,
      };
    } else if (diffDays === 1) {
      return {
        area,
        computedStatus: 'VISIT_TOMORROW',
        statusLabel: 'VISIT TOMORROW',
        daysRemaining: 1,
        formattedNextVisit: formatReadableDate(area.nextVisitDate),
        isOverdue: false,
        overdueDays: 0,
      };
    } else {
      return {
        area,
        computedStatus: 'WAIT',
        statusLabel: `WAIT – ${diffDays} days`,
        daysRemaining: diffDays,
        formattedNextVisit: formatReadableDate(area.nextVisitDate),
        isOverdue: false,
        overdueDays: 0,
      };
    }
  }

  // Default fallback if no visit scheduled yet
  return {
    area,
    computedStatus: 'VISIT_TODAY',
    statusLabel: 'VISIT TODAY',
    daysRemaining: 0,
    formattedNextVisit: 'Today',
    isOverdue: false,
    overdueDays: 0,
  };
}

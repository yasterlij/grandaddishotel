/**
 * Safe, timezone-independent date arithmetic and formatting for bookings and reservations.
 */

export function getTodayDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * "Today" in the hotel's business timezone (Addis Ababa, UTC+3), regardless of
 * the server's local timezone. Used for check-in validation so guests are never
 * rejected (or allowed) based on where the server happens to run.
 */
export function getHotelTodayDateStr(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Addis_Ababa',
  }).format(new Date());
}

/** True when the string is a valid ISO calendar date (YYYY-MM-DD). */
export function isIsoDateStr(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

export function addDays(dateStr: string, days: number): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return dateStr;
  }
  const [y, m, d] = parts;
  const date = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
  return date.toISOString().split('T')[0];
}

export function calculateStayNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 1;
  const p1 = checkIn.split('-').map(Number);
  const p2 = checkOut.split('-').map(Number);
  if (p1.length !== 3 || p2.length !== 3) return 1;
  const utc1 = Date.UTC(p1[0], p1[1] - 1, p1[2]);
  const utc2 = Date.UTC(p2[0], p2[1] - 1, p2[2]);
  const diffDays = Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
}

export function formatFriendlyDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3) return dateStr;
    const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return dateStr;
  }
}

/** Formats date as '08 Oct 2026' exactly matching hotel booking engines */
export function formatHotelDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3) return dateStr;
    const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
    const day = String(parts[2]).padStart(2, '0');
    const month = date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
    const year = parts[0];
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

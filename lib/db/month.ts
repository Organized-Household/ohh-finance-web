/**
 * Month utility functions for OHh-Finance
 * Handles month boundaries and date normalization
 * 
 * TIMEZONE SAFETY:
 * All functions return local calendar dates (YYYY-MM-DD) based on the user's
 * system timezone. This ensures a user entering a transaction on May 31st
 * at 11pm in UTC-5 sees May 31st stored, not June 1st.
 * 
 * The transactions.transaction_date column is DATE (not timestamptz), so we
 * must submit local calendar dates, never UTC-converted timestamps.
 */

/**
 * Get the current month start as YYYY-MM-01 in the user's local timezone
 * 
 * CRITICAL: Uses local date arithmetic to avoid UTC conversion issues.
 * A user in UTC-5 on May 31st at 11pm must get "2024-05-01", not "2024-06-01".
 * 
 * @returns {string} YYYY-MM-01 format string
 */
export function getCurrentMonthStart(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

/**
 * Get month boundaries for a given month start
 * 
 * @param monthStart - YYYY-MM-01 format string
 * @returns {object} { start: YYYY-MM-01, end: YYYY-MM-DD (last day of month) }
 */
export function getMonthBoundaries(monthStart: string): { start: string; end: string } {
  const [year, month] = monthStart.split('-').map(Number);
  
  // First day of month
  const start = monthStart;
  
  // Last day of month: use Date constructor to get correct day count
  // (handles Feb, 30/31 day months automatically)
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  
  return { start, end };
}

/**
 * Get the next month start from a given month start
 * 
 * @param monthStart - YYYY-MM-01 format string
 * @returns {string} YYYY-MM-01 format string for next month
 */
export function getNextMonthStart(monthStart: string): string {
  const [year, month] = monthStart.split('-').map(Number);
  
  if (month === 12) {
    return `${year + 1}-01-01`;
  }
  
  return `${year}-${String(month + 1).padStart(2, '0')}-01`;
}

/**
 * Get the previous month start from a given month start
 * 
 * @param monthStart - YYYY-MM-01 format string
 * @returns {string} YYYY-MM-01 format string for previous month
 */
export function getPreviousMonthStart(monthStart: string): string {
  const [year, month] = monthStart.split('-').map(Number);
  
  if (month === 1) {
    return `${year - 1}-12-01`;
  }
  
  return `${year}-${String(month - 1).padStart(2, '0')}-01`;
}

/**
 * Convert a Date object to YYYY-MM-DD in the user's local timezone
 * 
 * CRITICAL: Never use toISOString() for transaction dates, as it converts
 * to UTC and can shift the calendar date.
 * 
 * @param date - Date object
 * @returns {string} YYYY-MM-DD format string in local timezone
 */
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string into a Date object at local midnight
 * 
 * @param dateString - YYYY-MM-DD format string
 * @returns {Date} Date object at midnight local time
 */
export function parseDateLocal(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

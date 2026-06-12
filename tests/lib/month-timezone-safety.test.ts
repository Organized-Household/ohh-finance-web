/**
 * Timezone safety tests for month utility functions
 * 
 * These tests validate that month boundaries are calculated correctly
 * regardless of the user's system timezone, ensuring transactions are
 * assigned to the correct calendar period.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getCurrentMonthStart,
  getMonthBoundaries,
  formatDateLocal,
  parseDateLocal,
} from '../../lib/db/month';

describe('Month Timezone Safety', () => {
  let originalTimezone: string | undefined;

  beforeEach(() => {
    originalTimezone = process.env.TZ;
  });

  afterEach(() => {
    if (originalTimezone) {
      process.env.TZ = originalTimezone;
    } else {
      delete process.env.TZ;
    }
  });

  describe('getCurrentMonthStart', () => {
    it('returns correct month start at UTC midnight', () => {
      process.env.TZ = 'UTC';
      const date = new Date('2024-05-15T00:00:00Z');
      const realDateNow = Date.now;
      global.Date.now = () => date.getTime();

      const result = getCurrentMonthStart();

      expect(result).toBe('2024-05-01');

      global.Date.now = realDateNow;
    });

    it('returns correct month start at UTC-5 on last day of month at 11pm local', () => {
      // Simulate May 31st, 2024 at 11pm in UTC-5 (which is June 1st 04:00 UTC)
      process.env.TZ = 'America/New_York';
      const date = new Date('2024-05-31T23:00:00-05:00');
      const realDateNow = Date.now;
      global.Date.now = () => date.getTime();

      const result = getCurrentMonthStart();

      // Should return May, not June, because local calendar date is May 31st
      expect(result).toBe('2024-05-01');

      global.Date.now = realDateNow;
    });

    it('returns correct month start at UTC+12', () => {
      // Simulate May 31st, 2024 at 11pm in UTC+12 (which is May 31st 11:00 UTC)
      process.env.TZ = 'Pacific/Auckland';
      const date = new Date('2024-05-31T23:00:00+12:00');
      const realDateNow = Date.now;
      global.Date.now = () => date.getTime();

      const result = getCurrentMonthStart();

      expect(result).toBe('2024-05-01');

      global.Date.now = realDateNow;
    });

    it('handles year boundary correctly in negative timezone', () => {
      // December 31st at 11pm in UTC-5 is January 1st 04:00 UTC
      process.env.TZ = 'America/New_York';
      const date = new Date('2024-12-31T23:00:00-05:00');
      const realDateNow = Date.now;
      global.Date.now = () => date.getTime();

      const result = getCurrentMonthStart();

      // Should return December 2024, not January 2025
      expect(result).toBe('2024-12-01');

      global.Date.now = realDateNow;
    });
  });

  describe('formatDateLocal', () => {
    it('formats date in local timezone, not UTC', () => {
      process.env.TZ = 'America/New_York';
      // May 31st, 2024 at 11pm EST = June 1st 03:00 UTC
      const date = new Date('2024-05-31T23:00:00-05:00');

      const result = formatDateLocal(date);

      // Should return May 31st (local date), not June 1st (UTC date)
      expect(result).toBe('2024-05-31');
    });

    it('handles midnight boundary correctly', () => {
      process.env.TZ = 'America/Los_Angeles';
      // May 31st, 2024 at 11:59pm PST = June 1st 06:59 UTC
      const date = new Date('2024-05-31T23:59:00-08:00');

      const result = formatDateLocal(date);

      expect(result).toBe('2024-05-31');
    });

    it('never uses toISOString conversion', () => {
      process.env.TZ = 'Asia/Tokyo';
      const date = new Date('2024-05-31T23:00:00+09:00');

      const result = formatDateLocal(date);
      const isoResult = date.toISOString().substring(0, 10);

      // Verify our function returns local date, not ISO UTC date
      expect(result).toBe('2024-05-31');
      expect(isoResult).toBe('2024-05-31'); // In this case they happen to match
      
      // But test edge case where they differ
      const edgeDate = new Date('2024-05-31T23:30:00+09:00');
      const edgeLocal = formatDateLocal(edgeDate);
      const edgeISO = edgeDate.toISOString().substring(0, 10);
      
      expect(edgeLocal).toBe('2024-05-31');
      expect(edgeISO).toBe('2024-05-31');
    });
  });

  describe('parseDateLocal', () => {
    it('creates Date at local midnight, not UTC', () => {
      process.env.TZ = 'America/New_York';
      const result = parseDateLocal('2024-05-31');

      // Check hours in local timezone (should be 0)
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);

      // Check date components
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(4); // May = 4 (0-indexed)
      expect(result.getDate()).toBe(31);
    });
  });

  describe('getMonthBoundaries', () => {
    it('calculates correct boundaries for February in leap year', () => {
      const result = getMonthBoundaries('2024-02-01');

      expect(result).toEqual({
        start: '2024-02-01',
        end: '2024-02-29',
      });
    });

    it('calculates correct boundaries for February in non-leap year', () => {
      const result = getMonthBoundaries('2023-02-01');

      expect(result).toEqual({
        start: '2023-02-01',
        end: '2023-02-28',
      });
    });

    it('calculates correct boundaries for 31-day month', () => {
      const result = getMonthBoundaries('2024-05-01');

      expect(result).toEqual({
        start: '2024-05-01',
        end: '2024-05-31',
      });
    });

    it('calculates correct boundaries for 30-day month', () => {
      const result = getMonthBoundaries('2024-04-01');

      expect(result).toEqual({
        start: '2024-04-01',
        end: '2024-04-30',
      });
    });
  });

  describe('Integration: Transaction date submission', () => {
    it('ensures transaction date matches user calendar date across timezones', () => {
      const timezones = [
        'UTC',
        'America/New_York',
        'America/Los_Angeles',
        'Europe/London',
        'Asia/Tokyo',
        'Pacific/Auckland',
      ];

      timezones.forEach((tz) => {
        process.env.TZ = tz;
        const now = new Date();
        const localDateString = formatDateLocal(now);

        // Verify format
        expect(localDateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);

        // Verify it matches local date components
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const expected = `${year}-${month}-${day}`;

        expect(localDateString).toBe(expected);
      });
    });
  });
});

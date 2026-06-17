/**
 * Timezone safety tests for lib/db/month.ts (OHHFIN-164)
 *
 * Covers only what the PR changes:
 *   1. getCurrentMonthStart() — local month, not UTC month, near boundaries
 *   2. formatDateLocal()      — local calendar date, never UTC-shifted
 *   3. parseDateLocal()       — local midnight from YYYY-MM-DD
 *
 * TZ is pinned to America/New_York (UTC-5/-4) so the month-boundary cases are
 * discriminating on CI (Linux). Node on Windows ignores TZ, so all dates below
 * are built with the LOCAL Date constructor — assertions hold in any timezone.
 */
process.env.TZ = "America/New_York";

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getCurrentMonthStart,
  formatDateLocal,
  parseDateLocal,
} from "../../lib/db/month";

describe("getCurrentMonthStart", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a Date for the first of the current LOCAL month near a month boundary", () => {
    // May 31st, 11:00pm local — in UTC-5 this instant is already June 1st UTC.
    // The UTC-based implementation would return June; local arithmetic must return May.
    vi.setSystemTime(new Date(2024, 4, 31, 23, 0, 0));

    const result = getCurrentMonthStart();

    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toBe("2024-05-01T00:00:00.000Z");
  });

  it("returns the first of the month mid-month", () => {
    vi.setSystemTime(new Date(2024, 4, 15, 12, 0, 0));

    expect(getCurrentMonthStart().toISOString()).toBe("2024-05-01T00:00:00.000Z");
  });

  it("handles the start of January (year boundary)", () => {
    vi.setSystemTime(new Date(2025, 0, 1, 0, 30, 0));

    expect(getCurrentMonthStart().toISOString()).toBe("2025-01-01T00:00:00.000Z");
  });
});

describe("formatDateLocal", () => {
  it("returns the local calendar date late at night, never the UTC-shifted date", () => {
    // May 31st, 11:00pm local — toISOString() in UTC-5 would yield 2024-06-01.
    const lateNight = new Date(2024, 4, 31, 23, 0, 0);

    expect(formatDateLocal(lateNight)).toBe("2024-05-31");
  });

  it("zero-pads single-digit months and days", () => {
    expect(formatDateLocal(new Date(2024, 0, 5))).toBe("2024-01-05");
  });

  it("handles the last day of the year", () => {
    expect(formatDateLocal(new Date(2024, 11, 31, 23, 59, 59))).toBe("2024-12-31");
  });
});

describe("parseDateLocal", () => {
  it("returns a Date at local midnight with correct year/month/day", () => {
    const result = parseDateLocal("2024-05-31");

    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(4); // zero-based May
    expect(result.getDate()).toBe(31);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });

  it("round-trips with formatDateLocal", () => {
    expect(formatDateLocal(parseDateLocal("2024-12-31"))).toBe("2024-12-31");
    expect(formatDateLocal(parseDateLocal("2024-01-01"))).toBe("2024-01-01");
    expect(formatDateLocal(parseDateLocal("2024-02-29"))).toBe("2024-02-29");
  });
});

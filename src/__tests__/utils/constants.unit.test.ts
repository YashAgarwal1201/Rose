// src/__tests__/utils/constants.unit.test.ts
import { describe, expect, it } from "vitest";
import {
  DAYS_PER_MONTH,
  DAYS_PER_WEEK,
  DAYS_PER_YEAR,
  HOURS_PER_DAY,
  MINUTES_PER_HOUR,
  MS_PER_DAY,
  MS_PER_HOUR,
  MS_PER_MINUTE,
  MS_PER_MONTH,
  MS_PER_SECOND,
  MS_PER_WEEK,
  MS_PER_YEAR,
  SECONDS_PER_MINUTE,
  TOAST_AUTO_DISMISS_MS,
} from "../../utils/constants";

describe("constants", () => {
  // ─────────────────────────────────────────────
  // base constants
  // ─────────────────────────────────────────────
  describe("base constants", () => {
    it("MS_PER_SECOND is 1000", () => {
      expect.hasAssertions();
      expect(MS_PER_SECOND).toBe(1000);
    });

    it("SECONDS_PER_MINUTE is 60", () => {
      expect.hasAssertions();
      expect(SECONDS_PER_MINUTE).toBe(60);
    });

    it("MINUTES_PER_HOUR is 60", () => {
      expect.hasAssertions();
      expect(MINUTES_PER_HOUR).toBe(60);
    });

    it("HOURS_PER_DAY is 24", () => {
      expect.hasAssertions();
      expect(HOURS_PER_DAY).toBe(24);
    });

    it("DAYS_PER_WEEK is 7", () => {
      expect.hasAssertions();
      expect(DAYS_PER_WEEK).toBe(7);
    });

    it("DAYS_PER_MONTH is 30", () => {
      expect.hasAssertions();
      expect(DAYS_PER_MONTH).toBe(30);
    });

    it("DAYS_PER_YEAR is 365", () => {
      expect.hasAssertions();
      expect(DAYS_PER_YEAR).toBe(365);
    });
  });

  // ─────────────────────────────────────────────
  // derived constants
  // ─────────────────────────────────────────────
  describe("derived constants", () => {
    it("MS_PER_MINUTE equals 60,000", () => {
      expect.hasAssertions();
      expect(MS_PER_MINUTE).toBe(60_000);
    });

    it("MS_PER_HOUR equals 3,600,000", () => {
      expect.hasAssertions();
      expect(MS_PER_HOUR).toBe(3_600_000);
    });

    it("MS_PER_DAY equals 86,400,000", () => {
      expect.hasAssertions();
      expect(MS_PER_DAY).toBe(86_400_000);
    });

    it("MS_PER_WEEK equals 604,800,000", () => {
      expect.hasAssertions();
      expect(MS_PER_WEEK).toBe(604_800_000);
    });

    it("MS_PER_MONTH equals 2,592,000,000", () => {
      expect.hasAssertions();
      expect(MS_PER_MONTH).toBe(2_592_000_000);
    });

    it("MS_PER_YEAR equals 31,536,000,000", () => {
      expect.hasAssertions();
      expect(MS_PER_YEAR).toBe(31_536_000_000);
    });
  });

  // ─────────────────────────────────────────────
  // app constants
  // ─────────────────────────────────────────────
  describe("app constants", () => {
    it("TOAST_AUTO_DISMISS_MS is 8000", () => {
      expect.hasAssertions();
      expect(TOAST_AUTO_DISMISS_MS).toBe(8000);
    });
  });
});

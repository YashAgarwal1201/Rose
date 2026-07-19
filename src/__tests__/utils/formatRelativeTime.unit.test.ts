import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "../../utils/formatRelativeTime";
import {
  MS_PER_DAY,
  MS_PER_HOUR,
  MS_PER_MINUTE,
  MS_PER_MONTH,
  MS_PER_WEEK,
  MS_PER_YEAR,
} from "../../utils/constants";

function past(ms: number): number {
  return Date.now() - ms;
}

function future(ms: number): number {
  return Date.now() + ms;
}

describe("formatRelativeTime", () => {
  describe("just now", () => {
    it("returns 'just now' for 0ms difference", () => {
      expect.hasAssertions();
      expect(formatRelativeTime(Date.now())).toBe("just now");
    });

    it("returns 'just now' for 30 seconds ago", () => {
      expect.hasAssertions();
      expect(formatRelativeTime(past(30_000))).toBe("just now");
    });

    it("returns 'just now' for 59 seconds ago", () => {
      expect.hasAssertions();
      expect(formatRelativeTime(past(MS_PER_MINUTE - 1))).toBe("just now");
    });
  });

  describe("minutes", () => {
    it("returns '1 minute ago' at exactly 1 minute", () => {
      expect.hasAssertions();
      expect(formatRelativeTime(past(MS_PER_MINUTE))).toBe("1 minute ago");
    });

    it("returns '1 minute ago' at 90 seconds — regression guard", () => {
      expect.hasAssertions();
      expect(formatRelativeTime(past(MS_PER_MINUTE * 1.5))).toBe("1 minute ago");
    });

    it("returns '5 minutes ago' at 5 minutes", () => {
      expect.hasAssertions();
      expect(formatRelativeTime(past(MS_PER_MINUTE * 5))).toBe("5 minutes ago");
    });

    it("returns '59 minutes ago' at 59 minutes", () => {
      expect.hasAssertions();
      // Use exactly 59 minutes — NOT MS_PER_HOUR - 1 (which Math.rounds to 60)
      expect(formatRelativeTime(past(MS_PER_MINUTE * 59))).toBe("59 minutes ago");
    });
  });

  describe("hours", () => {
    it("returns '1 hour ago' at exactly 1 hour", () => {
      expect.hasAssertions();
      expect(formatRelativeTime(past(MS_PER_HOUR))).toBe("1 hour ago");
    });

    it("returns '1 hour ago' at 90 minutes", () => {
      expect.hasAssertions();
      expect(formatRelativeTime(past(MS_PER_HOUR * 1.5))).toBe("1 hour ago");
    });

    it("returns '23 hours ago' at 23 hours", () => {
      expect.hasAssertions();
      // Use exactly 23 hours — NOT MS_PER_DAY - 1 (Math.rounds to 24)
      expect(formatRelativeTime(past(MS_PER_HOUR * 23))).toBe("23 hours ago");
    });
  });

  describe("days", () => {
    it("returns 'yesterday' at exactly 1 day", () => {
      expect.hasAssertions();
      expect(formatRelativeTime(past(MS_PER_DAY))).toBe("yesterday");
    });

    it("returns '2 days ago' at 2 days", () => {
      expect.hasAssertions();
      expect(formatRelativeTime(past(MS_PER_DAY * 2))).toBe("2 days ago");
    });

    it("returns '6 days ago' at 6 days", () => {
      expect.hasAssertions();
      // Use exactly 6 days — NOT MS_PER_WEEK - 1 (Math.rounds to 7)
      expect(formatRelativeTime(past(MS_PER_DAY * 6))).toBe("6 days ago");
    });
  });

  describe("weeks", () => {
    it("returns 'last week' at exactly 1 week", () => {
      expect.hasAssertions();
      expect(formatRelativeTime(past(MS_PER_WEEK))).toBe("last week");
    });

    it("returns '3 weeks ago' at 3 weeks", () => {
      expect.hasAssertions();
      expect(formatRelativeTime(past(MS_PER_WEEK * 3))).toBe("3 weeks ago");
    });
  });

  describe("months", () => {
    it("returns 'last month' at exactly 1 month", () => {
      expect.hasAssertions();
      expect(formatRelativeTime(past(MS_PER_MONTH))).toBe("last month");
    });

    it("returns '3 months ago' at 3 months", () => {
      expect.hasAssertions();
      expect(formatRelativeTime(past(MS_PER_MONTH * 3))).toBe("3 months ago");
    });
  });

  describe("years", () => {
    it("returns 'last year' at exactly 1 year", () => {
      expect.hasAssertions();
      expect(formatRelativeTime(past(MS_PER_YEAR))).toBe("last year");
    });

    it("returns '2 years ago' at 2 years", () => {
      expect.hasAssertions();
      expect(formatRelativeTime(past(MS_PER_YEAR * 2))).toBe("2 years ago");
    });
  });

  describe("future", () => {
    it("returns 'in 1 minute' for 1 minute in the future", () => {
      expect.hasAssertions();
      expect(formatRelativeTime(future(MS_PER_MINUTE))).toBe("in 1 minute");
    });

    it("returns 'in 1 hour' for 1 hour in the future", () => {
      expect.hasAssertions();
      expect(formatRelativeTime(future(MS_PER_HOUR))).toBe("in 1 hour");
    });

    it("returns 'tomorrow' for 1 day in the future", () => {
      expect.hasAssertions();
      expect(formatRelativeTime(future(MS_PER_DAY))).toBe("tomorrow");
    });
  });
});

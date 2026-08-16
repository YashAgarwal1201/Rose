// src/__tests__/utils/formatBytes.unit.test.ts
import { describe, expect, it } from "vitest";
import { formatBytes } from "../../utils/formatBytes";

describe("formatBytes", () => {
  // ─────────────────────────────────────────────
  // zero / negative edge cases
  // ─────────────────────────────────────────────
  describe("edge cases", () => {
    it("returns '0 B' for 0", () => {
      expect.hasAssertions();
      expect(formatBytes(0)).toBe("0 B");
    });

    it("returns '0 B' for negative values", () => {
      expect.hasAssertions();
      expect(formatBytes(-100)).toBe("0 B");
    });
  });

  // ─────────────────────────────────────────────
  // bytes
  // ─────────────────────────────────────────────
  describe("bytes", () => {
    it("formats 1 byte", () => {
      expect.hasAssertions();
      expect(formatBytes(1)).toBe("1 B");
    });

    it("formats 512 bytes", () => {
      expect.hasAssertions();
      expect(formatBytes(512)).toBe("512 B");
    });

    it("formats 1023 bytes (just under 1 KB)", () => {
      expect.hasAssertions();
      expect(formatBytes(1023)).toBe("1023 B");
    });
  });

  // ─────────────────────────────────────────────
  // kilobytes
  // ─────────────────────────────────────────────
  describe("kilobytes", () => {
    it("formats exactly 1 KB", () => {
      expect.hasAssertions();
      expect(formatBytes(1024)).toBe("1.0 KB");
    });

    it("formats 1.5 KB with 1 decimal", () => {
      expect.hasAssertions();
      expect(formatBytes(1536)).toBe("1.5 KB");
    });

    it("formats 10 KB with 0 decimals", () => {
      expect.hasAssertions();
      expect(formatBytes(10_240)).toBe("10 KB");
    });
  });

  // ─────────────────────────────────────────────
  // megabytes
  // ─────────────────────────────────────────────
  describe("megabytes", () => {
    it("formats exactly 1 MB", () => {
      expect.hasAssertions();
      expect(formatBytes(1024 ** 2)).toBe("1.0 MB");
    });

    it("formats 5.5 MB with 1 decimal", () => {
      expect.hasAssertions();
      expect(formatBytes(5.5 * 1024 ** 2)).toBe("5.5 MB");
    });
  });

  // ─────────────────────────────────────────────
  // gigabytes
  // ─────────────────────────────────────────────
  describe("gigabytes", () => {
    it("formats exactly 1 GB", () => {
      expect.hasAssertions();
      expect(formatBytes(1024 ** 3)).toBe("1.0 GB");
    });
  });

  // ─────────────────────────────────────────────
  // terabytes
  // ─────────────────────────────────────────────
  describe("terabytes", () => {
    it("formats exactly 1 TB", () => {
      expect.hasAssertions();
      expect(formatBytes(1024 ** 4)).toBe("1.0 TB");
    });

    it("clamps to TB for values beyond TB", () => {
      expect.hasAssertions();
      // 1024 TB — should still display in TB
      expect(formatBytes(1024 ** 5)).toBe("1024 TB");
    });
  });
});

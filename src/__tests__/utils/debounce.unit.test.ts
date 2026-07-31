// src/__tests__/utils/debounce.unit.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { debounce } from "../../utils/debounce";

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─────────────────────────────────────────────
  // basic invocation
  // ─────────────────────────────────────────────
  describe("basic invocation", () => {
    it("does not call fn immediately", () => {
      expect.hasAssertions();
      const fn = vi.fn();
      const debounced = debounce(fn, 100);
      debounced();
      expect(fn).not.toHaveBeenCalled();
    });

    it("calls fn after the delay elapses", () => {
      expect.hasAssertions();
      const fn = vi.fn();
      const debounced = debounce(fn, 100);
      debounced();
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledOnce();
    });

    it("passes all arguments through to fn", () => {
      expect.hasAssertions();
      const fn = vi.fn<[string, number]>();
      const debounced = debounce(fn, 50);
      debounced("hello", 42);
      vi.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledWith("hello", 42);
    });

    it("resets the timer on successive calls — only latest args fire", () => {
      expect.hasAssertions();
      const fn = vi.fn<[string]>();
      const debounced = debounce(fn, 100);
      debounced("first");
      vi.advanceTimersByTime(80);
      debounced("second");
      vi.advanceTimersByTime(80);
      expect(fn).not.toHaveBeenCalled();
      vi.advanceTimersByTime(20);
      expect(fn).toHaveBeenCalledOnce();
      expect(fn).toHaveBeenCalledWith("second");
    });

    it("does not call fn a second time once the delay has passed", () => {
      expect.hasAssertions();
      const fn = vi.fn();
      const debounced = debounce(fn, 100);
      debounced();
      vi.advanceTimersByTime(200);
      expect(fn).toHaveBeenCalledOnce();
    });
  });

  // ─────────────────────────────────────────────
  // cancel
  // ─────────────────────────────────────────────
  describe("cancel", () => {
    it("prevents a pending call from executing", () => {
      expect.hasAssertions();
      const fn = vi.fn();
      const debounced = debounce(fn, 100);
      debounced();
      debounced.cancel();
      vi.advanceTimersByTime(200);
      expect(fn).not.toHaveBeenCalled();
    });

    it("is safe to call when nothing is pending", () => {
      expect.hasAssertions();
      const fn = vi.fn();
      const debounced = debounce(fn, 100);
      debounced.cancel(); // no-op
      expect(fn).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // flush
  // ─────────────────────────────────────────────
  describe("flush", () => {
    it("fires a pending call immediately", () => {
      expect.hasAssertions();
      const fn = vi.fn<[string]>();
      const debounced = debounce(fn, 100);
      debounced("flushed");
      debounced.flush();
      expect(fn).toHaveBeenCalledOnce();
      expect(fn).toHaveBeenCalledWith("flushed");
    });

    it("clears the pending timer so fn is not called again", () => {
      expect.hasAssertions();
      const fn = vi.fn();
      const debounced = debounce(fn, 100);
      debounced();
      debounced.flush();
      vi.advanceTimersByTime(200);
      expect(fn).toHaveBeenCalledOnce();
    });

    it("is a no-op when nothing is pending", () => {
      expect.hasAssertions();
      const fn = vi.fn();
      const debounced = debounce(fn, 100);
      debounced.flush();
      expect(fn).not.toHaveBeenCalled();
    });

    it("is a no-op after cancel", () => {
      expect.hasAssertions();
      const fn = vi.fn();
      const debounced = debounce(fn, 100);
      debounced();
      debounced.cancel();
      debounced.flush();
      expect(fn).not.toHaveBeenCalled();
    });
  });
});

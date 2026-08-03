// src/__tests__/composables/useToast.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useToast } from "@/composables/ui/useToast.ts";

describe("useToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Clear any lingering toasts from other tests
    const { toasts, dismissToast } = useToast();
    while (toasts.value.length > 0) {
      dismissToast(toasts.value[0]!.id);
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─────────────────────────────────────────────
  // showToast
  // ─────────────────────────────────────────────
  describe("showToast", () => {
    it("adds a toast to the list", () => {
      expect.hasAssertions();
      const { showToast, toasts } = useToast();
      showToast("Hello!", "info");
      expect(toasts.value).toHaveLength(1);
      expect(toasts.value[0]?.message).toBe("Hello!");
      expect(toasts.value[0]?.type).toBe("info");
    });

    it("defaults type to 'info'", () => {
      expect.hasAssertions();
      const { showToast, toasts } = useToast();
      showToast("Default type");
      expect(toasts.value[0]?.type).toBe("info");
    });

    it("assigns a unique id to each toast", () => {
      expect.hasAssertions();
      const { showToast, toasts } = useToast();
      showToast("First", "info");
      showToast("Second", "success");
      expect(toasts.value[0]?.id).not.toBe(toasts.value[1]?.id);
    });

    it("supports all toast types", () => {
      expect.hasAssertions();
      const { showToast, toasts } = useToast();
      showToast("Success", "success");
      showToast("Error", "error");
      showToast("Warning", "warning");
      showToast("Info", "info");
      expect(toasts.value.map((t) => t.type)).toEqual(["success", "error", "warning", "info"]);
    });
  });

  // ─────────────────────────────────────────────
  // auto-dismiss
  // ─────────────────────────────────────────────
  describe("auto-dismiss", () => {
    it("removes the toast after the specified duration", () => {
      expect.hasAssertions();
      const { showToast, toasts } = useToast();
      showToast("Temporary", "info", 2000);
      expect(toasts.value).toHaveLength(1);
      vi.advanceTimersByTime(2000);
      expect(toasts.value).toHaveLength(0);
    });

    it("uses default duration of 3000ms", () => {
      expect.hasAssertions();
      const { showToast, toasts } = useToast();
      showToast("Default duration");
      vi.advanceTimersByTime(2999);
      expect(toasts.value).toHaveLength(1);
      vi.advanceTimersByTime(1);
      expect(toasts.value).toHaveLength(0);
    });

    it("does not dismiss other toasts early", () => {
      expect.hasAssertions();
      const { showToast, toasts } = useToast();
      showToast("Short", "info", 1000);
      showToast("Long", "info", 5000);
      vi.advanceTimersByTime(1000);
      expect(toasts.value).toHaveLength(1);
      expect(toasts.value[0]?.message).toBe("Long");
    });
  });

  // ─────────────────────────────────────────────
  // dismissToast
  // ─────────────────────────────────────────────
  describe("dismissToast", () => {
    it("removes the toast immediately by id", () => {
      expect.hasAssertions();
      const { showToast, dismissToast, toasts } = useToast();
      showToast("To dismiss", "info");
      const id = toasts.value[0]!.id;
      dismissToast(id);
      expect(toasts.value).toHaveLength(0);
    });

    it("clears the auto-dismiss timer (toast is not removed twice)", () => {
      expect.hasAssertions();
      const { showToast, dismissToast, toasts } = useToast();
      showToast("Dismissed early", "info", 3000);
      const id = toasts.value[0]!.id;
      dismissToast(id);
      // Advancing past the original duration should be a no-op
      vi.advanceTimersByTime(3000);
      expect(toasts.value).toHaveLength(0);
    });

    it("is safe to call with a non-existent id", () => {
      expect.hasAssertions();
      const { dismissToast, toasts } = useToast();
      dismissToast(99999);
      expect(toasts.value).toHaveLength(0);
    });
  });

  // ─────────────────────────────────────────────
  // multiple toasts
  // ─────────────────────────────────────────────
  describe("multiple toasts", () => {
    it("maintains multiple toasts simultaneously", () => {
      expect.hasAssertions();
      const { showToast, toasts } = useToast();
      showToast("A", "info");
      showToast("B", "success");
      showToast("C", "error");
      expect(toasts.value).toHaveLength(3);
    });

    it("dismisses specific toast while keeping others", () => {
      expect.hasAssertions();
      const { showToast, dismissToast, toasts } = useToast();
      showToast("Keep 1", "info");
      showToast("Remove", "error");
      showToast("Keep 2", "success");
      const removeId = toasts.value[1]!.id;
      dismissToast(removeId);
      expect(toasts.value).toHaveLength(2);
      expect(toasts.value.map((t) => t.message)).toEqual(["Keep 1", "Keep 2"]);
    });
  });
});

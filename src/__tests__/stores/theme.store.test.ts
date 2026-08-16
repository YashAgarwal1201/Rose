// src/__tests__/stores/theme.store.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useThemeStore } from "../../stores/theme";

// Stub matchMedia so jsdom doesn't choke
function stubMatchMedia(prefersDark = false) {
  const listeners: ((e: { matches: boolean }) => void)[] = [];
  const mql = {
    matches: prefersDark,
    addEventListener: (_event: string, cb: (e: { matches: boolean }) => void) => {
      listeners.push(cb);
    },
    removeEventListener: vi.fn(),
  };
  globalThis.matchMedia = vi.fn().mockReturnValue(mql);
  return { mql, listeners };
}

describe("themeStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    stubMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─────────────────────────────────────────────
  // initial state
  // ─────────────────────────────────────────────
  describe("initial state", () => {
    it("defaults to 'system' when localStorage is empty", () => {
      expect.hasAssertions();
      const store = useThemeStore();
      expect(store.mode).toBe("system");
    });

    it("reads stored mode from localStorage", () => {
      expect.hasAssertions();
      localStorage.setItem("rose-theme-mode", "dark");
      // Need a fresh pinia after setting localStorage
      setActivePinia(createPinia());
      const store = useThemeStore();
      expect(store.mode).toBe("dark");
    });
  });

  // ─────────────────────────────────────────────
  // setMode
  // ─────────────────────────────────────────────
  describe("setMode", () => {
    it("updates the reactive mode ref", () => {
      expect.hasAssertions();
      const store = useThemeStore();
      store.setMode("dark");
      expect(store.mode).toBe("dark");
    });

    it("persists to localStorage", () => {
      expect.hasAssertions();
      const store = useThemeStore();
      store.setMode("light");
      expect(localStorage.getItem("rose-theme-mode")).toBe("light");
    });

    it("adds 'dark' class to <html> when set to 'dark'", () => {
      expect.hasAssertions();
      const store = useThemeStore();
      store.setMode("dark");
      expect(document.documentElement.classList.contains("dark")).toBeTruthy();
    });

    it("removes 'dark' class from <html> when set to 'light'", () => {
      expect.hasAssertions();
      document.documentElement.classList.add("dark");
      const store = useThemeStore();
      store.setMode("light");
      expect(document.documentElement.classList.contains("dark")).toBeFalsy();
    });

    it("applies system preference when set to 'system' (prefers dark)", () => {
      expect.hasAssertions();
      stubMatchMedia(true);
      setActivePinia(createPinia());
      const store = useThemeStore();
      store.setMode("system");
      expect(document.documentElement.classList.contains("dark")).toBeTruthy();
    });

    it("applies system preference when set to 'system' (prefers light)", () => {
      expect.hasAssertions();
      stubMatchMedia(false);
      setActivePinia(createPinia());
      const store = useThemeStore();
      store.setMode("system");
      expect(document.documentElement.classList.contains("dark")).toBeFalsy();
    });
  });

  // ─────────────────────────────────────────────
  // init
  // ─────────────────────────────────────────────
  describe("init", () => {
    it("applies the current mode on startup", () => {
      expect.hasAssertions();
      localStorage.setItem("rose-theme-mode", "dark");
      setActivePinia(createPinia());
      const store = useThemeStore();
      store.init();
      expect(document.documentElement.classList.contains("dark")).toBeTruthy();
    });

    it("registers a matchMedia listener for system preference changes", () => {
      expect.hasAssertions();
      const { listeners } = stubMatchMedia(false);
      setActivePinia(createPinia());
      const store = useThemeStore();
      store.init();
      // The store should have registered one listener
      expect(listeners).toHaveLength(1);
    });

    it("re-applies theme when system preference changes and mode is 'system'", () => {
      expect.hasAssertions();
      const { mql, listeners } = stubMatchMedia(false);
      setActivePinia(createPinia());
      const store = useThemeStore();
      store.setMode("system");
      store.init();
      // Simulate OS switching to dark mode
      mql.matches = true;
      listeners[0]?.({ matches: true });
      expect(document.documentElement.classList.contains("dark")).toBeTruthy();
    });
  });
});

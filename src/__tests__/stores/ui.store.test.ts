// src/__tests__/stores/ui.store.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useUiStore } from "../../stores/ui";

describe("uiStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  // ─────────────────────────────────────────────
  // initial state
  // ─────────────────────────────────────────────
  describe("initial state", () => {
    it("starts with menu closed", () => {
      expect.hasAssertions();
      const store = useUiStore();
      expect(store.isMenuOpen).toBe(false);
    });

    it("starts with search closed", () => {
      expect.hasAssertions();
      const store = useUiStore();
      expect(store.isSearchOpen).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // menu
  // ─────────────────────────────────────────────
  describe("menu", () => {
    it("openMenu sets isMenuOpen to true", () => {
      expect.hasAssertions();
      const store = useUiStore();
      store.openMenu();
      expect(store.isMenuOpen).toBe(true);
    });

    it("closeMenu sets isMenuOpen to false", () => {
      expect.hasAssertions();
      const store = useUiStore();
      store.openMenu();
      store.closeMenu();
      expect(store.isMenuOpen).toBe(false);
    });

    it("toggleMenu flips isMenuOpen from false to true", () => {
      expect.hasAssertions();
      const store = useUiStore();
      store.toggleMenu();
      expect(store.isMenuOpen).toBe(true);
    });

    it("toggleMenu flips isMenuOpen from true to false", () => {
      expect.hasAssertions();
      const store = useUiStore();
      store.openMenu();
      store.toggleMenu();
      expect(store.isMenuOpen).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // search
  // ─────────────────────────────────────────────
  describe("search", () => {
    it("openSearch sets isSearchOpen to true", () => {
      expect.hasAssertions();
      const store = useUiStore();
      store.openSearch();
      expect(store.isSearchOpen).toBe(true);
    });

    it("closeSearch sets isSearchOpen to false", () => {
      expect.hasAssertions();
      const store = useUiStore();
      store.openSearch();
      store.closeSearch();
      expect(store.isSearchOpen).toBe(false);
    });

    it("toggleSearch flips isSearchOpen from false to true", () => {
      expect.hasAssertions();
      const store = useUiStore();
      store.toggleSearch();
      expect(store.isSearchOpen).toBe(true);
    });

    it("toggleSearch flips isSearchOpen from true to false", () => {
      expect.hasAssertions();
      const store = useUiStore();
      store.openSearch();
      store.toggleSearch();
      expect(store.isSearchOpen).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // independence
  // ─────────────────────────────────────────────
  describe("independence", () => {
    it("menu and search states are independent", () => {
      expect.hasAssertions();
      const store = useUiStore();
      store.openMenu();
      store.openSearch();
      expect(store.isMenuOpen).toBe(true);
      expect(store.isSearchOpen).toBe(true);
      store.closeMenu();
      expect(store.isMenuOpen).toBe(false);
      expect(store.isSearchOpen).toBe(true);
    });
  });
});

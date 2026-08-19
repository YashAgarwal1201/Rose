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
      expect(store.isMenuOpen).toBeFalsy();
    });

    it("starts with search closed", () => {
      expect.hasAssertions();
      const store = useUiStore();
      expect(store.isSearchOpen).toBeFalsy();
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
      expect(store.isMenuOpen).toBeTruthy();
    });

    it("closeMenu sets isMenuOpen to false", () => {
      expect.hasAssertions();
      const store = useUiStore();
      store.openMenu();
      store.closeMenu();
      expect(store.isMenuOpen).toBeFalsy();
    });

    it("toggleMenu flips isMenuOpen from false to true", () => {
      expect.hasAssertions();
      const store = useUiStore();
      store.toggleMenu();
      expect(store.isMenuOpen).toBeTruthy();
    });

    it("toggleMenu flips isMenuOpen from true to false", () => {
      expect.hasAssertions();
      const store = useUiStore();
      store.openMenu();
      store.toggleMenu();
      expect(store.isMenuOpen).toBeFalsy();
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
      expect(store.isSearchOpen).toBeTruthy();
    });

    it("closeSearch sets isSearchOpen to false", () => {
      expect.hasAssertions();
      const store = useUiStore();
      store.openSearch();
      store.closeSearch();
      expect(store.isSearchOpen).toBeFalsy();
    });

    it("toggleSearch flips isSearchOpen from false to true", () => {
      expect.hasAssertions();
      const store = useUiStore();
      store.toggleSearch();
      expect(store.isSearchOpen).toBeTruthy();
    });

    it("toggleSearch flips isSearchOpen from true to false", () => {
      expect.hasAssertions();
      const store = useUiStore();
      store.openSearch();
      store.toggleSearch();
      expect(store.isSearchOpen).toBeFalsy();
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
      expect(store.isMenuOpen).toBeTruthy();
      expect(store.isSearchOpen).toBeTruthy();
      store.closeMenu();
      expect(store.isMenuOpen).toBeFalsy();
      expect(store.isSearchOpen).toBeTruthy();
    });
  });
});

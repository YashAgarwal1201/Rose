// src/__tests__/stores/settings.store.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { createPinia, setActivePinia } from "pinia";
import db from "../../db";
import { useSettingsStore } from "../../stores/settings";

async function freshDb(): Promise<void> {
  db.close();
  globalThis.indexedDB = new IDBFactory();
  await db.open();
}

describe("settingsStore", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await freshDb();
    await db.settings.clear();
  });

  // ─────────────────────────────────────────────
  // loadSettings
  // ─────────────────────────────────────────────
  describe("loadSettings", () => {
    it("creates default settings on first run", async () => {
      expect.hasAssertions();
      const store = useSettingsStore();
      await store.loadSettings();
      expect(store.isLoaded).toBeTruthy();
      expect(store.username).toBeNull();
      expect(store.onboardingCompleted).toBeFalsy();
      expect(store.onboardingStep).toBe(0);
      expect(store.showActivityChart).toBeTruthy();
    });

    it("persists default settings to DB on first run", async () => {
      expect.hasAssertions();
      const store = useSettingsStore();
      await store.loadSettings();
      const row = await db.settings.get(1);
      expect(row).toBeDefined();
      expect(row?.onboardingCompleted).toBeFalsy();
    });

    it("loads existing settings on subsequent runs", async () => {
      expect.hasAssertions();
      // First run: create defaults then modify
      const store1 = useSettingsStore();
      await store1.loadSettings();
      await store1.updateUsername("Yash");

      // Second run: fresh pinia, should load persisted data
      setActivePinia(createPinia());
      const store2 = useSettingsStore();
      await store2.loadSettings();
      expect(store2.username).toBe("Yash");
    });
  });

  // ─────────────────────────────────────────────
  // updateUsername
  // ─────────────────────────────────────────────
  describe("updateUsername", () => {
    it("persists a trimmed username", async () => {
      expect.hasAssertions();
      const store = useSettingsStore();
      await store.loadSettings();
      await store.updateUsername("  Alice  ");
      expect(store.username).toBe("Alice");
    });

    it("sets username to null for empty string", async () => {
      expect.hasAssertions();
      const store = useSettingsStore();
      await store.loadSettings();
      await store.updateUsername("Alice");
      await store.updateUsername("");
      expect(store.username).toBeNull();
    });

    it("sets username to null when passed null", async () => {
      expect.hasAssertions();
      const store = useSettingsStore();
      await store.loadSettings();
      await store.updateUsername("Alice");
      await store.updateUsername(null);
      expect(store.username).toBeNull();
    });
  });

  // ─────────────────────────────────────────────
  // setOnboardingStep
  // ─────────────────────────────────────────────
  describe("setOnboardingStep", () => {
    it("persists step number", async () => {
      expect.hasAssertions();
      const store = useSettingsStore();
      await store.loadSettings();
      await store.setOnboardingStep(3);
      expect(store.onboardingStep).toBe(3);
    });

    it("persists to DB", async () => {
      expect.hasAssertions();
      const store = useSettingsStore();
      await store.loadSettings();
      await store.setOnboardingStep(5);
      const row = await db.settings.get(1);
      expect(row?.onboardingStep).toBe(5);
    });
  });


  // ─────────────────────────────────────────────
  // toggleActivityChart
  // ─────────────────────────────────────────────
  describe("toggleActivityChart", () => {
    it("toggles the showActivityChart flag", async () => {
      expect.hasAssertions();
      const store = useSettingsStore();
      await store.loadSettings();
      expect(store.showActivityChart).toBeTruthy();
      
      await store.toggleActivityChart();
      expect(store.showActivityChart).toBeFalsy();
      
      await store.toggleActivityChart();
      expect(store.showActivityChart).toBeTruthy();
    });

    it("persists to DB", async () => {
      expect.hasAssertions();
      const store = useSettingsStore();
      await store.loadSettings();
      await store.toggleActivityChart();
      const row = await db.settings.get(1);
      expect(row?.showActivityChart).toBeFalsy();
    });
  });

  // ─────────────────────────────────────────────
  // completeOnboarding / resetOnboarding
  // ─────────────────────────────────────────────
  describe("completeOnboarding", () => {
    it("sets onboardingCompleted to true and resets step to 0", async () => {
      expect.hasAssertions();
      const store = useSettingsStore();
      await store.loadSettings();
      await store.setOnboardingStep(3);
      await store.completeOnboarding();
      expect(store.onboardingCompleted).toBeTruthy();
      expect(store.onboardingStep).toBe(0);
    });
  });

  describe("resetOnboarding", () => {
    it("sets onboardingCompleted to false and step to 0", async () => {
      expect.hasAssertions();
      const store = useSettingsStore();
      await store.loadSettings();
      await store.completeOnboarding();
      await store.resetOnboarding();
      expect(store.onboardingCompleted).toBeFalsy();
      expect(store.onboardingStep).toBe(0);
    });

    it("persists the reset to DB", async () => {
      expect.hasAssertions();
      const store = useSettingsStore();
      await store.loadSettings();
      await store.completeOnboarding();
      await store.resetOnboarding();
      const row = await db.settings.get(1);
      expect(row?.onboardingCompleted).toBeFalsy();
    });
  });
});

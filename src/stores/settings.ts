// src/stores/settings.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import db from "@/db";
import type { AppSettings } from "@/db/types";

const SETTINGS_ID = 1;

function createDefaultSettings(): AppSettings {
  return {
    createdAt: Date.now(),
    id: SETTINGS_ID,
    onboardingCompleted: false,
    onboardingStep: 0,
    showActivityChart: true,
    username: null,
  };
}

export const useSettingsStore = defineStore("settings", () => {
  const username = ref<string | null>(null);
  const onboardingCompleted = ref(false);
  const onboardingStep = ref(0);
  const showActivityChart = ref(true);
  const isLoaded = ref(false);

  function applySettings(settings: AppSettings) {
    username.value = settings.username;
    onboardingCompleted.value = settings.onboardingCompleted;
    onboardingStep.value = settings.onboardingStep;
    showActivityChart.value = settings.showActivityChart ?? true;
  }

  // Loads the singleton settings row, creating it with defaults on first run.
  // Call this once at app boot, before the router resolves its first route.
  async function loadSettings() {
    let settings = await db.settings.get(SETTINGS_ID);
    if (!settings) {
      settings = createDefaultSettings();
      await db.settings.add(settings);
    }
    applySettings(settings);
    isLoaded.value = true;
  }

  async function persist(changes: Partial<Omit<AppSettings, "id" | "createdAt">>) {
    await db.settings.update(SETTINGS_ID, changes);
    const settings = await db.settings.get(SETTINGS_ID);
    if (settings) {
      applySettings(settings);
    }
  }

  async function updateUsername(name: string | null) {
    const trimmed = name?.trim() || null;
    await persist({ username: trimmed });
  }

  async function setOnboardingStep(step: number) {
    await persist({ onboardingStep: step });
  }

  async function toggleActivityChart() {
    await persist({ showActivityChart: !showActivityChart.value });
  }

  async function completeOnboarding() {
    await persist({ onboardingCompleted: true, onboardingStep: 0 });
  }

  // Used by the "Replay onboarding" button and by "Reset app completely".
  async function resetOnboarding() {
    await persist({ onboardingCompleted: false, onboardingStep: 0 });
  }

  return {
    completeOnboarding,
    isLoaded,
    loadSettings,
    onboardingCompleted,
    onboardingStep,
    resetOnboarding,
    setOnboardingStep,
    showActivityChart,
    toggleActivityChart,
    updateUsername,
    username,
  };
});

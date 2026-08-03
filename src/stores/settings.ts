// src/stores/settings.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import db from "@/db";
import type { AppSettings, FeatureType } from "@/db/types";

const SETTINGS_ID = 1;

const DEFAULT_FEATURES: FeatureType[] = ["todo", "note", "doc"];

function createDefaultSettings(): AppSettings {
  return {
    createdAt: Date.now(),
    enabledFeatures: [...DEFAULT_FEATURES],
    id: SETTINGS_ID,
    onboardingCompleted: false,
    onboardingStep: 0,
    username: null,
  };
}

export const useSettingsStore = defineStore("settings", () => {
  const username = ref<string | null>(null);
  const enabledFeatures = ref<FeatureType[]>([...DEFAULT_FEATURES]);
  const onboardingCompleted = ref(false);
  const onboardingStep = ref(0);
  const isLoaded = ref(false);

  function applySettings(settings: AppSettings) {
    username.value = settings.username;
    enabledFeatures.value = settings.enabledFeatures;
    onboardingCompleted.value = settings.onboardingCompleted;
    onboardingStep.value = settings.onboardingStep;
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

  function isFeatureEnabled(feature: FeatureType): boolean {
    return enabledFeatures.value.includes(feature);
  }

  async function toggleFeature(feature: FeatureType) {
    const current = enabledFeatures.value;
    const isEnabled = current.includes(feature);
    if (isEnabled && current.length === 1) {
      // At least one feature must stay enabled.
      return;
    }
    const next = isEnabled ? current.filter((item) => item !== feature) : [...current, feature];
    await persist({ enabledFeatures: next });
  }

  async function setEnabledFeatures(features: FeatureType[]) {
    const next = features.length > 0 ? features : [...DEFAULT_FEATURES];
    await persist({ enabledFeatures: next });
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
    enabledFeatures,
    isFeatureEnabled,
    isLoaded,
    loadSettings,
    onboardingCompleted,
    onboardingStep,
    resetOnboarding,
    setEnabledFeatures,
    setOnboardingStep,
    toggleFeature,
    updateUsername,
    username,
  };
});

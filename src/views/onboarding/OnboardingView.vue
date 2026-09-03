<!-- src/views/OnboardingView.vue -->
<template>
  <div class="h-full flex flex-col">
    <div class="flex-1 overflow-y-auto flex items-center justify-center p-6">
      <div class="w-full max-w-sm">
        <WelcomeStep v-if="currentStep === 0" @skip="skipSetup" @restore="goToImport" />
        <ImportStep v-else-if="currentStep === 'import'" @ready="onImportReady" @not-ready="pendingImport = null" />
        <PrivacyStep v-else-if="currentStep === 1" />
        <ThemeStep v-else-if="currentStep === 2" />
        <UsernameStep v-else-if="currentStep === 3" v-model="draftUsername" />
        <FinishStep v-else-if="currentStep === 4" />
      </div>
    </div>

    <div class="border-t border-rose-border p-4 flex items-center justify-between shrink-0">
      <!-- Dot indicators (hide the 'import' pseudo-step from the dots) -->
      <div class="flex gap-1.5" role="presentation">
        <span v-for="(step, index) in steps" :key="step" class="h-1.5 rounded-full transition-all duration-200"
          :class="index === numericCurrentStep ? 'w-6 bg-rose-green-muted' : 'w-1.5 bg-rose-border'" />
      </div>

      <div class="flex gap-2">
        <button v-if="currentStep !== 0" type="button"
          class="px-4 py-2 rounded-lg text-sm font-medium text-rose-text-muted hover:bg-rose-surface-alt transition-colors"
          @click="goBack">
          Back
        </button>

        <!-- Import step: show an "Import & continue" action -->
        <button v-if="currentStep === 'import'" type="button" :disabled="!pendingImport || isImporting"
          class="px-4 py-2 rounded-lg bg-rose-primary text-white text-sm font-medium hover:bg-rose-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          @click="confirmImport">
          {{ isImporting ? "Importing…" : "Import & continue" }}
        </button>

        <!-- Normal steps -->
        <button v-else type="button"
          class="px-4 py-2 rounded-lg bg-rose-primary text-white text-sm font-medium hover:bg-rose-primary-hover transition-colors"
          @click="goNext">
          {{ isLastStep ? "Enter Rose" : "Continue" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useSettingsStore } from "@/stores/settings";
import { importData, type ImportOptions } from "@/utils/importData";
import { useToast } from "@/composables/ui/useToast.ts";
import type { ExportPayload } from "@/utils/exportData";
import WelcomeStep from "@/components/onboarding/WelcomeStep.vue";
import ImportStep from "@/components/onboarding/ImportStep.vue";
import PrivacyStep from "@/components/onboarding/PrivacyStep.vue";
import ThemeStep from "@/components/onboarding/ThemeStep.vue";
import UsernameStep from "@/components/onboarding/UsernameStep.vue";
import FinishStep from "@/components/onboarding/FinishStep.vue";

const router = useRouter();
const settingsStore = useSettingsStore();
const { showToast } = useToast();
const steps = ["welcome", "privacy", "theme", "username", "finish"] as const;

// `currentStep` can be a numeric index into `steps` or the string 'import'
// which is a pseudo-step branching off from step 0 (Welcome).
type Step = number | "import";

const currentStep = ref<Step>(
  Math.min(settingsStore.onboardingStep, steps.length - 1),
);
const draftUsername = ref(settingsStore.username ?? "");

// Reflects the dot-indicator index (the import pseudo-step stays at 0)
const numericCurrentStep = computed(() =>
  currentStep.value === "import" ? 0 : (currentStep.value as number),
);

const isLastStep = computed(
  () =>
    typeof currentStep.value === "number" &&
    currentStep.value === steps.length - 1,
);

// ── Import pseudo-step state ──────────────────────────────────────────────────
const pendingImport = ref<{
  payload: ExportPayload;
  options: ImportOptions;
} | null>(null);
const isImporting = ref(false);

function goToImport() {
  currentStep.value = "import";
}

function onImportReady(payload: ExportPayload, options: ImportOptions) {
  pendingImport.value = { options, payload };
}

async function confirmImport() {
  if (!pendingImport.value) { return; }
  isImporting.value = true;

  try {
    await importData(pendingImport.value.payload, pendingImport.value.options);

    // Reload settings from DB so the store reflects any imported profile.
    await settingsStore.loadSettings();

    showToast("Data imported successfully.", "success");

    // Jump straight to Finish step.
    currentStep.value = steps.length - 1;
    await settingsStore.setOnboardingStep(currentStep.value as number);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    showToast(`Import failed: ${message}`, "error");
  } finally {
    isImporting.value = false;
  }
}

// ── Normal navigation ─────────────────────────────────────────────────────────
async function goNext() {
  if (currentStep.value === "import") { return; } // handled by confirmImport

  const step = currentStep.value as number;

  // Username is the only step that isn't already writing straight to the
  // store as the user interacts (theme persists immediately),
  // so persist it here when leaving that step.
  if (step === 3) {
    await settingsStore.updateUsername(draftUsername.value);
  }

  if (isLastStep.value) {
    await settingsStore.completeOnboarding();
    await router.replace({ name: "home" });
    return;
  }

  currentStep.value = step + 1;
  await settingsStore.setOnboardingStep(currentStep.value as number);
}

async function goBack() {
  if (currentStep.value === "import") {
    // Return to Welcome
    currentStep.value = 0;
    return;
  }

  const step = currentStep.value as number;
  if (step === 0) { return; }

  currentStep.value = step - 1;
  await settingsStore.setOnboardingStep(currentStep.value as number);
}

async function skipSetup() {
  await settingsStore.completeOnboarding();
  await router.replace({ name: "home" });
}
</script>

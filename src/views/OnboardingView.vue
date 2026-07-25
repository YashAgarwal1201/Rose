<!-- src/views/OnboardingView.vue -->
<template>
  <div class="h-full flex flex-col">
    <div class="flex-1 overflow-y-auto flex items-center justify-center p-6">
      <div class="w-full max-w-sm">
        <WelcomeStep v-if="currentStep === 0" @skip="skipSetup" />
        <PrivacyStep v-else-if="currentStep === 1" />
        <ThemeStep v-else-if="currentStep === 2" />
        <UsernameStep v-else-if="currentStep === 3" v-model="draftUsername" />
        <FeaturesStep v-else-if="currentStep === 4" />
        <FinishStep v-else-if="currentStep === 5" />
      </div>
    </div>

    <div class="border-t border-rose-border p-4 flex items-center justify-between shrink-0">
      <div class="flex gap-1.5" role="presentation">
        <span
          v-for="(step, index) in steps"
          :key="step"
          class="h-1.5 rounded-full transition-all duration-200"
          :class="index === currentStep ? 'w-6 bg-rose-primary' : 'w-1.5 bg-rose-border'"
        />
      </div>

      <div class="flex gap-2">
        <button
          v-if="currentStep > 0"
          type="button"
          class="px-4 py-2 rounded-lg text-sm font-medium text-rose-text-muted hover:bg-rose-surface-alt transition-colors"
          @click="goBack"
        >
          Back
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-lg bg-rose-primary text-white text-sm font-medium hover:bg-rose-primary-hover transition-colors"
          @click="goNext"
        >
          {{ isLastStep ? "Enter Rose" : "Continue" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useSettingsStore } from "../stores/settings";
import WelcomeStep from "../components/onboarding/WelcomeStep.vue";
import PrivacyStep from "../components/onboarding/PrivacyStep.vue";
import ThemeStep from "../components/onboarding/ThemeStep.vue";
import UsernameStep from "../components/onboarding/UsernameStep.vue";
import FeaturesStep from "../components/onboarding/FeaturesStep.vue";
import FinishStep from "../components/onboarding/FinishStep.vue";

const router = useRouter();
const settingsStore = useSettingsStore();

const steps = ["welcome", "privacy", "theme", "username", "features", "finish"] as const;

// Resume mid-flow if the user closed the tab partway through, rather than
// restarting from Welcome every time.
const currentStep = ref(Math.min(settingsStore.onboardingStep, steps.length - 1));
const draftUsername = ref(settingsStore.username ?? "");

const isLastStep = computed(() => currentStep.value === steps.length - 1);

async function goNext() {
  // Username is the only step that isn't already writing straight to the
  // store as the user interacts (theme and features persist immediately),
  // so persist it here when leaving that step.
  if (currentStep.value === 3) {
    await settingsStore.updateUsername(draftUsername.value);
  }

  if (isLastStep.value) {
    await settingsStore.completeOnboarding();
    await router.replace({ name: "home" });
    return;
  }

  currentStep.value += 1;
  await settingsStore.setOnboardingStep(currentStep.value);
}

async function goBack() {
  if (currentStep.value === 0) {
    return;
  }
  currentStep.value -= 1;
  await settingsStore.setOnboardingStep(currentStep.value);
}

async function skipSetup() {
  await settingsStore.completeOnboarding();
  await router.replace({ name: "home" });
}
</script>

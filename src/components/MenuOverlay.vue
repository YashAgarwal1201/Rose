<!-- src/components/MenuOverlay.vue -->
<template>
  <Transition
    enter-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-300"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      @click="close"
      aria-hidden="true"
    ></div>
  </Transition>

  <Transition
    enter-active-class="transition-transform duration-300 ease-in-out"
    enter-from-class="translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transition-transform duration-300 ease-in-out"
    leave-from-class="translate-x-0"
    leave-to-class="translate-x-full"
  >
    <div
      v-if="isOpen"
      class="fixed top-0 right-0 h-full z-50 w-full max-w-3xl rounded-none md:rounded-l-xl! bg-rose-surface shadow-2xl flex flex-col"
    >
      <div class="flex items-center justify-between p-5 shrink-0">
        <h3 class="text-lg sm:text-xl md:text-2xl font-semibold text-rose-text">More Options</h3>
        <button
          class="p-2 hover:bg-rose-surface-alt rounded-full transition-colors"
          @click="close"
          aria-label="Close menu"
        >
          <XIcon class="w-5 h-5 text-rose-text" />
        </button>
      </div>
      <div class="grow overflow-y-auto px-5 pb-5">
        <div class="p-4 rounded-xl bg-rose-surface-alt border border-rose-border overflow-hidden">
          <!-- Appearance -->
          <PanelSection
            :icon="PaletteIcon"
            label="Appearance"
            :is-open="openPanel === 0"
            @toggle="togglePanel(0)"
          >
            <template #collapsed-preview>
              <MonitorIcon v-if="selectedMode === 'system'" class="w-4 h-4 text-rose-text-muted" />
              <SunIcon v-else-if="selectedMode === 'light'" class="w-4 h-4 text-rose-text-muted" />
              <MoonIcon v-else class="w-4 h-4 text-rose-text-muted" />
            </template>

            <div class="flex items-center justify-between gap-3 px-1 py-2">
              <span class="text-sm text-rose-text">Theme</span>
              <select
                v-model="selectedMode"
                class="text-sm bg-rose-surface border border-rose-border rounded-md px-2 py-1.5 text-rose-text focus:outline-none focus:ring-2 focus:ring-rose-primary cursor-pointer"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </PanelSection>

          <div class="divider" />

          <!-- Keyboard Shortcuts -->
          <PanelSection
            :icon="KeyboardIcon"
            label="Keyboard Shortcuts"
            :is-open="openPanel === 1"
            @toggle="togglePanel(1)"
          >
            <ul class="flex flex-col gap-y-2 px-1 py-2 text-sm">
              <li v-for="s in shortcuts" :key="s.action" class="flex items-center justify-between">
                <span class="text-rose-text-muted">{{ s.action }}</span>
                <kbd
                  class="px-2 py-0.5 rounded bg-rose-surface border border-rose-border text-rose-text text-xs font-mono"
                >
                  {{ s.keys }}
                </kbd>
              </li>
            </ul>
          </PanelSection>

          <div class="divider" />

          <button
            type="button"
            class="w-full flex items-center gap-3 px-2 py-4 rounded-xl bg-rose-surface-alt hover:bg-rose-surface/40 transition-colors"
            @click="goToSettings"
          >
            <SettingsIcon class="w-4 h-4 text-rose-primary" />
            <span class="font-medium text-rose-text">Settings</span>
          </button>

          <div class="divider" />

          <!-- Export & Sharing -->
          <PanelSection
            :icon="Share2Icon"
            label="Share"
            :is-open="openPanel === 2"
            @toggle="togglePanel(2)"
          >
            <div class="flex flex-col gap-y-3 px-1 py-2">
              <p class="text-sm text-rose-text-muted">Share Rose with others.</p>
              <div class="flex items-center gap-2">
                <button
                  class="flex-1 px-3 py-2 rounded-lg bg-rose-primary text-white text-sm font-medium hover:bg-rose-primary-hover transition-colors"
                  @click="handleShare"
                >
                  {{ copied ? "Copied!" : "Copy link" }}
                </button>
              </div>
            </div>
          </PanelSection>

          <div class="divider" />

          <!-- About This App -->
          <PanelSection
            :icon="InfoIcon"
            label="About This App"
            :is-open="openPanel === 3"
            @toggle="togglePanel(3)"
          >
            <div class="flex flex-col gap-y-4 px-1 py-2">
              <div class="flex items-center justify-between">
                <span class="text-sm text-rose-text-muted">Version</span>
                <span
                  class="px-3 py-1 rounded-full bg-rose-surface text-rose-cream text-xs font-mono"
                >
                  {{ appVersion }}
                </span>
              </div>

              <div class="divider" />

              <div class="flex flex-col gap-y-2">
                <span class="text-sm text-rose-text-muted">Built with</span>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="tech in techStack"
                    :key="tech.label"
                    class="flex items-center gap-x-1.5 px-2.5 py-1 rounded-full bg-rose-surface text-rose-text text-xs border border-rose-border"
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full shrink-0"
                      :style="{ backgroundColor: tech.color }"
                    ></span>
                    {{ tech.label }}
                  </span>
                </div>
              </div>
            </div>
          </PanelSection>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import {
  InfoIcon,
  KeyboardIcon,
  MonitorIcon,
  MoonIcon,
  PaletteIcon,
  SettingsIcon,
  Share2Icon,
  SunIcon,
  XIcon,
} from "@lucide/vue";
import { useThemeStore } from "../stores/theme";
import PanelSection from "./PanelSection.vue";
import { useRouter } from "vue-router";

defineProps<{ isOpen: boolean }>();
const emit = defineEmits<{ close: [] }>();

const themeStore = useThemeStore();
const router = useRouter();

const selectedMode = computed({
  get: () => themeStore.mode,
  set: (value: "light" | "dark" | "system") => themeStore.setMode(value),
});

const openPanel = ref(-1);
function togglePanel(index: number) {
  openPanel.value = openPanel.value === index ? -1 : index;
}

const copied = ref(false);
async function handleShare() {
  const url = globalThis.location.href;
  try {
    if (navigator.share) {
      await navigator.share({ title: "Rose", url });
      return;
    }
  } catch {
    // user cancelled native share — fall through to copy
  }
  await navigator.clipboard.writeText(url);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}

const shortcuts = [
  { action: "Bold", keys: "Ctrl+B" },
  { action: "Italic", keys: "Ctrl+I" },
  { action: "Strikethrough", keys: "Ctrl+Shift+X" },
  { action: "Undo", keys: "Ctrl+Z" },
  { action: "Redo", keys: "Ctrl+Shift+Z" },
  { action: "Link", keys: "Ctrl+K" },
];

const appVersion = __APP_VERSION__;

const techStack = [
  { label: "Vue 3", color: "#42b883" },
  { label: "TypeScript", color: "#3178C6" },
  { label: "Tailwind CSS v4", color: "#38BDF8" },
  { label: "Tiptap", color: "#6366F1" },
  { label: "Vite", color: "#A855F7" },
];

function goToSettings() {
  close();
  router.push({ name: "settings" });
}

function close() {
  emit("close");
}
</script>

<!-- src/App.vue -->
<template>
  <div
    class="flex flex-col-reverse md:flex-row h-dvh overflow-hidden bg-rose-bg text-rose-text antialiased"
  >
    <div class="w-full md:w-20 h-16 md:h-full shrink-0">
      <Sidebar @toggle-menu="isMenuOpen = true" />
    </div>

    <main class="grow h-full relative overflow-y-auto">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <MenuOverlay :is-open="isMenuOpen" :initial-panel="menuInitialPanel" @close="handleMenuClose" />
    <ToastContainer />
    <ConfirmDialog />
    <InputDialog />
    <GlobalSearchModal />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import { RouterView, useRouter } from "vue-router";
import Sidebar from "./components/Sidebar.vue";
import MenuOverlay from "./components/MenuOverlay.vue";
import ToastContainer from "./components/ToastContainer.vue";
import ConfirmDialog from "./components/ConfirmDialog.vue";
import InputDialog from "./components/InputDialog.vue";
import GlobalSearchModal from "./components/GlobalSearchModal.vue";

import { useUiStore } from "./stores/ui";
import { useToast } from "./composables/useToast";
import { useKeyboardShortcuts } from "./composables/useKeyboardShortcuts";
import { useThemeStore } from "./stores/theme";
import { useSettingsStore } from "./stores/settings";
import { TOAST_AUTO_DISMISS_MS } from "./utils/constants.ts";

const { showToast } = useToast();
const isMenuOpen = ref(false);
const menuInitialPanel = ref(-1);

const router = useRouter();
const themeStore = useThemeStore();
const settingsStore = useSettingsStore();
const uiStore = useUiStore();

function cycleTheme() {
  const modes = ["light", "dark", "system"] as const;
  const currentIndex = modes.indexOf(themeStore.mode);
  const nextMode = modes[(currentIndex + 1) % modes.length] ?? "light";
  themeStore.setMode(nextMode);
  showToast(`Theme: ${nextMode.charAt(0).toUpperCase() + nextMode.slice(1)}`, "info", TOAST_AUTO_DISMISS_MS);
}

// Close the menu overlay when route changes
watch(
  () => router.currentRoute.value.path,
  () => {
    isMenuOpen.value = false;
  },
);

useKeyboardShortcuts([
  // Ctrl + / → Open Global Search
  {
    key: "/",
    ctrl: true,
    handler: () => {
      uiStore.openSearch();
    },
  },
  // Global Ctrl + S → Prevent standard save-webpage dialog, let views handle it
  {
    key: "s",
    ctrl: true,
    handler: () => {
      const name = router.currentRoute.value.name;
      if (name === "docs-doc" || name === "notes-note") {
        return false; // let the specific view handler save the doc/note!
      }
      // Just prevent browser default Save webpage dialog on home, settings, folders list, etc.
    },
  },
  // Ctrl + , → Settings
  {
    key: ",",
    ctrl: true,
    handler: () => {
      router.push({ name: "settings" });
    },
  },
  // Ctrl + / → Open Menu Overlay with Keyboard Shortcuts panel focused
  {
    key: "/",
    ctrl: true,
    handler: () => {
      menuInitialPanel.value = 1; // index of the Keyboard Shortcuts panel
      isMenuOpen.value = true;
    },
  },
  // Ctrl + . → Cycle theme
  {
    key: ".",
    ctrl: true,
    handler: () => {
      cycleTheme();
    },
  },
  // Ctrl + Shift + 1 → Home
  {
    key: "1",
    ctrl: true,
    shift: true,
    handler: () => {
      router.push({ name: "home" });
    },
  },
  // Ctrl + Shift + 2 → Todos
  {
    key: "2",
    ctrl: true,
    shift: true,
    handler: () => {
      if (settingsStore.isFeatureEnabled("todo")) {
        router.push("/todos/folder");
      }
    },
  },
  // Ctrl + Shift + 3 → Notes
  {
    key: "3",
    ctrl: true,
    shift: true,
    handler: () => {
      if (settingsStore.isFeatureEnabled("note")) {
        router.push("/notes/folder");
      }
    },
  },
  // Ctrl + Shift + 4 → Docs
  {
    key: "4",
    ctrl: true,
    shift: true,
    handler: () => {
      if (settingsStore.isFeatureEnabled("doc")) {
        router.push("/docs/folder");
      }
    },
  },
  // Escape → Close menu overlay if open
  {
    key: "Escape",
    handler: () => {
      if (isMenuOpen.value) {
        isMenuOpen.value = false;
      } else {
        return false; // Decline handling Escape so local elements (modals, edit cancels) can use it!
      }
    },
  },
]);

function handleMenuClose() {
  isMenuOpen.value = false;
  menuInitialPanel.value = -1;
}

function onSWUpdate() {
  showToast("App updated — refresh to get the latest version.", "info", TOAST_AUTO_DISMISS_MS);
}

onMounted(() => globalThis.addEventListener("sw-update-available", onSWUpdate));
onUnmounted(() => globalThis.removeEventListener("sw-update-available", onSWUpdate));
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<!-- src/App.vue -->
<template>
  <div
    class="flex flex-col-reverse md:flex-row h-dvh overflow-hidden bg-rose-bg text-rose-text antialiased"
  >
    <div v-if="router.currentRoute.value.name !== 'onboarding'" class="w-full md:w-20 h-16 md:h-full shrink-0">
      <Navbar @toggle-menu="isMenuOpen = true" />
    </div>

    <div class="grow h-full relative overflow-hidden">
      <main ref="mainRef" class="h-full w-full overflow-y-auto">
        <RouterView v-slot="{ Component }">
          <ErrorBoundary>
            <Transition name="fade" mode="out-in">
              <component :is="Component" />
            </Transition>
          </ErrorBoundary>
        </RouterView>
      </main>

      <Transition name="fade">
        <button
          v-if="y > 300"
          @click="scrollToTop"
          class="absolute bottom-6 right-6 md:bottom-8 md:right-8 p-3 rounded-full bg-rose-primary text-white shadow-[0_4px_14px_0_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] hover:scale-105 transition-all duration-200 z-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
          aria-label="Scroll to top"
        >
          <ArrowUpIcon class="w-6 h-6" />
        </button>
      </Transition>
    </div>

    <SideMenu :is-open="isMenuOpen" :initial-panel="menuInitialPanel" @close="handleMenuClose" @open-feedback="handleOpenFeedback" />
    <FeedbackSidebar :is-open="isFeedbackOpen" @close="isFeedbackOpen = false" @cancel="handleFeedbackClose" />
    <ToastContainer />
    <ConfirmDialog />
    <InputDialog />
    <GlobalSearchModal />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import { RouterView, useRouter } from "vue-router";
import Navbar from "@/components/layout/Navbar.vue";
import SideMenu from "@/components/layout/SideMenu.vue";
import FeedbackSidebar from "@/components/layout/FeedbackSidebar.vue";
import ToastContainer from "@/components/ui/ToastContainer.vue";
import ConfirmDialog from "@/components/ui/ConfirmDialog.vue";
import InputDialog from "@/components/ui/InputDialog.vue";
import GlobalSearchModal from "@/components/explorer/GlobalSearchModal.vue";
import ErrorBoundary from "@/components/ui/ErrorBoundary.vue";

import { useUiStore } from "./stores/ui";
import { useToast } from "@/composables/ui/useToast.ts";
import { useKeyboardShortcuts } from "@/composables/app/useKeyboardShortcuts.ts";
import { useThemeStore } from "./stores/theme";
import { useBackButtonClose } from "@/composables/ui/useBackButtonClose.ts";
import { TOAST_AUTO_DISMISS_MS } from "./utils/constants.ts";
import { useScroll } from "@vueuse/core";
import { ArrowUpIcon } from "@lucide/vue";

const { showToast } = useToast();
const isMenuOpen = ref(false);
const isFeedbackOpen = ref(false);
const menuInitialPanel = ref(-1);
const mainRef = ref<HTMLElement | null>(null);
const { y } = useScroll(mainRef);

function scrollToTop() {
  mainRef.value?.scrollTo({ top: 0, behavior: 'smooth' });
}

const router = useRouter();
const themeStore = useThemeStore();
const uiStore = useUiStore();

useBackButtonClose(
  isMenuOpen,
  "menu",
  handleMenuClose,
  () => {
    // Only intercept back button for menu if feedback is not open
    if (!isFeedbackOpen.value) {
      isMenuOpen.value = true;
    }
  }
);

useBackButtonClose(
  isFeedbackOpen,
  "feedback",
  handleFeedbackClose,
  () => {
    isFeedbackOpen.value = true;
  }
);

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
      const { name } = router.currentRoute.value;
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
      router.push("/todos/folder");
    },
  },
  // Ctrl + Shift + 3 → Notes
  {
    key: "3",
    ctrl: true,
    shift: true,
    handler: () => {
      router.push("/notes/folder");
    },
  },
  // Ctrl + Shift + 4 → Docs
  {
    key: "4",
    ctrl: true,
    shift: true,
    handler: () => {
      router.push("/docs/folder");
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

function handleOpenFeedback() {
  isMenuOpen.value = false;
  setTimeout(() => {
    isFeedbackOpen.value = true;
  }, 100);
}

function handleFeedbackClose() {
  isFeedbackOpen.value = false;
  setTimeout(() => {
    isMenuOpen.value = true;
  }, 100);
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

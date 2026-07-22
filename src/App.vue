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

    <MenuOverlay :is-open="isMenuOpen" @close="isMenuOpen = false" />
    <ToastContainer />
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { RouterView } from "vue-router";
import Sidebar from "./components/Sidebar.vue";
import MenuOverlay from "./components/MenuOverlay.vue";
import ToastContainer from "./components/ToastContainer.vue";
import ConfirmDialog from "./components/ConfirmDialog.vue";

import { useToast } from "./composables/useToast";
import { TOAST_AUTO_DISMISS_MS } from "./utils/constants.ts";

const { showToast } = useToast();
const isMenuOpen = ref(false);

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

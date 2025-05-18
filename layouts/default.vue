<template>
  <div
    v-if="!isUnsupportedScreen"
    class="w-full h-full flex flex-col md:flex-row font-content"
  >
    <div class="w-full md:w-[70px] h-[60px] md:h-full"><Navbar /></div>
    <div
      class="w-full md:w-[calc(100%-70px)] max-w-[1440px] h-[calc(100%-60px)] md:h-full"
    >
      <slot />
    </div>

    <TransactionsHistoryModal />

    <SideMenu />

    <FeedbackDialog />
  </div>

  <div v-else class="h-full flex justify-center items-center p-2">
    <p class="text-center">
      Sorry this screen is not supported. Work is under progress
    </p>
  </div>
</template>

<script setup lang="ts">
import TransactionsHistoryModal from "~/components/expenseCalculator/TransactionsHistoryModal.vue";
import Navbar from "~/components/navbar/navbar.vue";
import SideMenu from "~/components/sideMenu/SideMenu.vue";

import { ref, onMounted } from "vue";

const isUnsupportedScreen = ref(false);

onMounted(() => {
  const checkScreenSize = () => {
    isUnsupportedScreen.value = window.innerWidth < 102;
  };

  checkScreenSize();
  window.addEventListener("resize", checkScreenSize);

  onUnmounted(() => {
    window.removeEventListener("resize", checkScreenSize);
  });
});

const route = useRoute();

useHead({
  meta: [{ property: "og:title", content: `Rose - ${route.meta.title}` }],
});

defineOptions({ ssr: false });

import { useNuxtApp } from "#app";

// Initialize the IndexedDB persistence
const { $piniaIndexedDB } = useNuxtApp();
$piniaIndexedDB();
</script>

<style lang="css">
@media (hover: hover) and (pointer: fine) {
  .p-button:hover,
  a:hover,
  .feedback-form .form-section:hover,
  .p-accordion .p-accordion-tab .p-accordion-header:hover,
  .custom-panel-header:hover {
    color: var(--primary-color) !important;
    background-color: var(--color3) !important;
    border-color: var(--color3) !important;
  }
}

.page-enter-active,
.page-leave-active {
  transition: all 0.4s;
}
.page-enter-from,
.page-leave-to {
  filter: blur(1rem);
  opacity: 0;
}
</style>

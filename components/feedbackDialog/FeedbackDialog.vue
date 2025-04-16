<template>
  <div>
    <Drawer
      v-model:visible="headerStore.showFeedback"
      position="right"
      :modal="true"
      :dismissable="true"
      class="!w-full !max-w-[768px] h-full rounded-none md:rounded-l-3xl"
    >
      <div class="flex flex-col h-full">
        <!-- Header -->
        <div class="flex justify-between items-start p-5">
          <h2 class="font-heading text-xl sm:text-2xl lg:text-3xl text-color5">
            Have some suggestions?
          </h2>
          <Button
            icon="pi pi-times"
            @click="closeFeedbackDialogHandle"
            class="p-button-rounded p-button-text"
          />
        </div>

        <!-- Content -->
        <div class="w-full px-5 pb-5">
          <!-- Your content goes here -->
        </div>
      </div>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { useHeaderStore } from "@/stores/headerStore";

import Button from "primevue/button";
import Drawer from "primevue/drawer";

const headerStore = useHeaderStore();

const closeFeedbackDialogHandle = () => {
  headerStore.showFeedback = false;
  headerStore.showSideMenu = true;
};
</script>

<style scoped></style>

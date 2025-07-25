<template>
  <div class="w-dvw h-dvh">
    <NuxtLayout>
      <NuxtPwaManifest />
      <NuxtPage />
    </NuxtLayout>

    <Toast />
  </div>
</template>

<script setup>
import { useToast } from "primevue/usetoast";

// Make toast service available globally
// This will allow you to call it from anywhere in your app
const toast = useToast();

// Optionally, you can provide it to your app via provide/inject
provide("toast", toast);
</script>

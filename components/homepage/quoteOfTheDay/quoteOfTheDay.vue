<template>
  <div class="w-full p-4 rounded-xl bg-rose-50 dark:bg-rose-950 font-content">
    <div v-if="quote" class="flex flex-col items-start gap-y-2">
      <p class="text-base italic text-rose-900 dark:text-rose-50">
        "{{ quote.text }}"
      </p>
      <p class="text-sm text-rose-800 dark:text-rose-100 font-medium self-end">
        — {{ quote.author }}
        <!-- <span>({{ quote.source }})</span> -->
      </p>
    </div>
    <div v-else class="text-center text-rose-100 italic">Loading quote...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { quotes, type Quote } from "~/constants/quotes";

const quote = ref<Quote | null>(null);
const lastDate = ref<string>("");

const pickQuoteForToday = () => {
  const today = new Date().toDateString();
  if (today === lastDate.value) return;

  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = today.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % quotes?.length;
  quote.value = quotes[index];
  lastDate.value = today;
};

onMounted(() => {
  pickQuoteForToday();

  // Check every hour if date has changed
  setInterval(() => {
    pickQuoteForToday();
  }, 1000 * 60 * 60); // every hour
});
</script>

<style scoped>
/* Optional styling if you want to customize more */
</style>

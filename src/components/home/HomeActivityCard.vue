<!-- src/components/home/HomeActivityCard.vue -->
<template>
  <div v-if="hasAnyActivity" class="mt-8 rounded-xl border border-rose-border p-4 sm:p-6">
    <p class="text-base text-rose-text">
      <span class="font-semibold">{{ totalCount }}</span>
      {{ totalCount === 1 ? "contribution" : "contributions" }} in the last year
    </p>

    <div class="mt-4 grid grid-cols-1 gap-6" :class="hasEnoughData ? 'lg:grid-cols-[minmax(0,1fr)_1px_260px]' : ''">
      <HomeActivityHeatmap :weeks="weeks" />

      <template v-if="hasEnoughData">
        <div class="hidden lg:block bg-rose-border" />
        <div class="border-t border-rose-border pt-6 lg:border-t-0 lg:pt-0">
          <HomeContributionAreaChart :segments="segments" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useActivityHeatmap } from "@/composables/home/useActivityHeatmap.ts";
import { useContributionDistribution } from "@/composables/home/useContributionDistribution.ts";
import HomeActivityHeatmap from "./HomeActivityHeatmap.vue";
import HomeContributionAreaChart from "./HomeContributionAreaChart.vue";

const { hasAnyActivity, totalCount, weeks, refresh: refreshHeatmap } = useActivityHeatmap();
const { hasEnoughData, segments, refresh: refreshDistribution } = useContributionDistribution();

onMounted(() => {
  refreshHeatmap();
  refreshDistribution();
});
</script>

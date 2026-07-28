<!-- src/components/home/HomeRecentScroller.vue -->
<template>
  <div v-if="items.length > 0" class="mt-8">
    <h2 class="text-sm font-semibold text-rose-text-muted uppercase tracking-wide">{{ title }}</h2>

    <div class="relative mt-3">
      <button
        type="button"
        aria-label="Scroll left"
        class="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-rose-surface border border-rose-border shadow-md flex items-center justify-center text-rose-text transition-opacity hover:bg-rose-surface-alt disabled:opacity-0 disabled:pointer-events-none"
        :disabled="!canScrollLeft"
        @click="scrollByPage(-1)"
      >
        <ChevronLeftIcon :size="16" />
      </button>

      <div
        ref="scrollerRef"
        class="no-scrollbar flex gap-2.5 overflow-x-auto scroll-smooth snap-x snap-mandatory px-1"
        @scroll="updateScrollState"
      >
        <div
          v-for="item in items"
          :key="`${item.type}-${item.id}`"
          class="shrink-0 w-40 sm:w-44 snap-start"
        >
          <HomeFileCard :item="item" timestamp-label="updated" @open="emit('open', item)" />
        </div>
      </div>

      <button
        type="button"
        aria-label="Scroll right"
        class="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-rose-surface border border-rose-border shadow-md flex items-center justify-center text-rose-text transition-opacity hover:bg-rose-surface-alt disabled:opacity-0 disabled:pointer-events-none"
        :disabled="!canScrollRight"
        @click="scrollByPage(1)"
      >
        <ChevronRightIcon :size="16" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ChevronLeftIcon, ChevronRightIcon } from "@lucide/vue";
import HomeFileCard from "./HomeFileCard.vue";
import type { HomeItem } from "../../composables/useHomeSummary";

const { title, items } = defineProps<{
  title: string;
  items: HomeItem[];
}>();

const emit = defineEmits<{ open: [item: HomeItem] }>();

const scrollerRef = ref<HTMLDivElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

function updateScrollState() {
  const el = scrollerRef.value;
  if (!el) {
    return;
  }
  canScrollLeft.value = el.scrollLeft > 4;
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
}

function scrollByPage(direction: 1 | -1) {
  const el = scrollerRef.value;
  if (!el) {
    return;
  }
  el.scrollBy({ behavior: "smooth", left: direction * el.clientWidth * 0.8 });
}

let resizeObserver: ResizeObserver | null = null;

onMounted(async () => {
  await nextTick();
  updateScrollState();
  if (scrollerRef.value) {
    resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(scrollerRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});

watch(
  () => items,
  () => nextTick().then(updateScrollState),
);
</script>

<style scoped>
.no-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>

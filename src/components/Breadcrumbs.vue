<!-- src/components/Breadcrumbs.vue -->
<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from "vue";
import { ChevronRightIcon, HomeIcon, MoreHorizontalIcon } from "@lucide/vue";
import type { Crumb } from "../types/explorer";

// Const props =
defineProps<{ crumbs: Crumb[] }>();
const emit = defineEmits<{ navigate: [id: string | null] }>();

const isPopoverOpen = ref(false);
const popoverRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const popoverStyle = ref({ left: "0px", top: "0px" });

async function openPopover() {
  isPopoverOpen.value = true;
  await nextTick();
  positionPopover();
}

function positionPopover() {
  if (!triggerRef.value) {return;}
  const rect = triggerRef.value.getBoundingClientRect();
  popoverStyle.value = {
    left: `${rect.left}px`,
    top: `${rect.bottom + 6}px`,
  };
}

function togglePopover() {
  if (isPopoverOpen.value) {
    isPopoverOpen.value = false;
  } else {
    openPopover();
  }
}

function selectCrumb(id: string | null) {
  isPopoverOpen.value = false;
  emit("navigate", id);
}

function handleOutsideClick(event: MouseEvent) {
  const target = event.target as Node;
  if (
    isPopoverOpen.value &&
    !popoverRef.value?.contains(target) &&
    !triggerRef.value?.contains(target)
  ) {
    isPopoverOpen.value = false;
  }
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === "Escape") {isPopoverOpen.value = false;}
}

function handleReposition() {
  if (isPopoverOpen.value) {positionPopover();}
}

onMounted(() => {
  document.addEventListener("click", handleOutsideClick);
  document.addEventListener("keydown", handleEscape);
  window.addEventListener("resize", handleReposition);
  window.addEventListener("scroll", handleReposition, true);
});
onUnmounted(() => {
  document.removeEventListener("click", handleOutsideClick);
  document.removeEventListener("keydown", handleEscape);
  window.removeEventListener("resize", handleReposition);
  window.removeEventListener("scroll", handleReposition, true);
});
</script>

<template>
  <nav
    class="flex items-center gap-0.5 text-sm mb-4 px-2 py-1.5 rounded-lg bg-rose-surface-alt/60 overflow-x-auto whitespace-nowrap no-scrollbar"
  >
    <button
      class="flex items-center gap-1 px-2 py-1 rounded-md text-rose-text-muted hover:bg-rose-surface-alt hover:text-rose-text transition-colors shrink-0"
      @click.stop="emit('navigate', null)"
    >
      <HomeIcon class="w-4 h-4" />
    </button>

    <!-- Small screens: collapsed view, entire trail is one tappable trigger -->
    <template v-if="crumbs.length > 0">
      <div
        v-if="crumbs.length > 1"
        ref="triggerRef"
        class="flex items-center gap-0.5 sm:hidden cursor-pointer rounded-md hover:bg-rose-surface px-1 py-1 -mx-1 transition-colors"
        @click="togglePopover"
      >
        <ChevronRightIcon class="w-3.5 h-3.5 text-rose-text-muted/50 shrink-0" />
        <span
          class="flex items-center justify-center px-1.5 py-0.5 rounded-md text-rose-text-muted shrink-0"
        >
          <MoreHorizontalIcon class="w-4 h-4" />
        </span>
        <ChevronRightIcon class="w-3.5 h-3.5 text-rose-text-muted/50 shrink-0" />
        <span
          class="px-2 py-1 rounded-md truncate max-w-40 bg-rose-surface-alt text-rose-text font-medium shrink-0"
        >
          {{ crumbs[crumbs.length - 1]?.name }}
        </span>
      </div>
      <div v-else class="flex items-center gap-0.5 sm:hidden">
        <ChevronRightIcon class="w-3.5 h-3.5 text-rose-text-muted/50 shrink-0" />
        <span
          class="px-2 py-1 rounded-md truncate max-w-40 bg-rose-surface-alt text-rose-text font-medium shrink-0"
        >
          {{ crumbs[crumbs.length - 1]?.name }}
        </span>
      </div>
    </template>

    <!-- Larger screens: full trail -->
    <template v-for="(crumb, index) in crumbs" :key="crumb.id ?? 'root'">
      <div class="hidden sm:flex items-center gap-0.5">
        <ChevronRightIcon class="w-3.5 h-3.5 text-rose-text-muted/50 shrink-0" />
        <button
          class="px-2 py-1 rounded-md truncate max-w-32 md:max-w-40 shrink-0 transition-colors"
          :class="
            index === crumbs.length - 1
              ? 'bg-rose-surface-alt text-rose-text font-medium'
              : 'text-rose-text-muted hover:bg-rose-surface hover:text-rose-text'
          "
          @click="emit('navigate', crumb.id)"
        >
          {{ crumb.name }}
        </button>
      </div>
    </template>
  </nav>

  <!-- Popover teleported to body so it's never clipped by the nav's overflow-x-auto -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-1 scale-95"
    >
      <div
        v-if="isPopoverOpen"
        ref="popoverRef"
        class="fixed min-w-40 max-w-56 bg-rose-surface border border-rose-border rounded-lg shadow-xl py-1 z-200"
        :style="popoverStyle"
      >
        <button
          v-for="crumb in crumbs.slice(0, -1)"
          :key="crumb.id ?? 'root'"
          class="flex items-center w-full text-left px-3 py-2 text-sm text-rose-text truncate hover:bg-rose-surface-alt transition-colors"
          @click="selectCrumb(crumb.id)"
        >
          {{ crumb.name }}
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
</style>

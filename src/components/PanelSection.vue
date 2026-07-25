<!-- src/components/PanelSection.vue -->
<template>
  <div>
    <button
      type="button"
      class="w-full flex items-center justify-between gap-2 px-2 py-4 cursor-pointer hover:bg-rose-surface/40 transition-colors rounded-xl"
      :aria-expanded="isOpen"
      @click="emit('toggle')"
    >
      <span class="flex items-center gap-3 font-medium text-rose-text">
        <component
          :is="icon"
          class="w-4 h-4 text-rose-primary shrink-0"
          :class="isOpen ? 'animate-icon-expand-nudge' : ''"
        />
        {{ label }}
      </span>

      <span class="flex items-center gap-2">
        <span v-if="!isOpen" class="flex items-center gap-2">
          <slot name="collapsed-preview" />
        </span>
        <ChevronDownIcon
          class="w-4 h-4 text-rose-text-muted transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          :class="isOpen ? 'rotate-180' : ''"
        />
      </span>
    </button>

    <Transition name="panel-slide">
      <div v-if="isOpen" class="panel-slide-outer px-4 pb-4">
        <div class="panel-slide-inner">
          <slot />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ChevronDownIcon } from "@lucide/vue";
import type { Component } from "vue";

defineProps<{
  icon: Component;
  label: string;
  isOpen: boolean;
}>();

const emit = defineEmits<{ toggle: [] }>();
</script>

<style scoped>
/* Outer wrapper — scales vertically from the top */
.panel-slide-outer {
  transform-origin: top;
  will-change: transform, opacity;
}

/* Inner wrapper — counter-scales to keep content undistorted */
.panel-slide-inner {
  transform-origin: top;
  will-change: transform;
}

/* Enter: collapsed → expanded */
.panel-slide-enter-active .panel-slide-outer {
  transition:
    transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.25s ease;
}
.panel-slide-enter-active .panel-slide-inner {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Leave: expanded → collapsed */
.panel-slide-leave-active .panel-slide-outer {
  transition:
    transform 0.22s cubic-bezier(0.4, 0, 1, 1),
    opacity 0.18s ease;
}
.panel-slide-leave-active .panel-slide-inner {
  transition: transform 0.22s cubic-bezier(0.4, 0, 1, 1);
}

.panel-slide-enter-from .panel-slide-outer,
.panel-slide-leave-to .panel-slide-outer {
  transform: scaleY(0);
  opacity: 0;
}
.panel-slide-enter-from .panel-slide-inner,
.panel-slide-leave-to .panel-slide-inner {
  transform: scaleY(9999); /* counter-scale cancels outer distortion */
}

.panel-slide-enter-to .panel-slide-outer,
.panel-slide-leave-from .panel-slide-outer {
  transform: scaleY(1);
  opacity: 1;
}
.panel-slide-enter-to .panel-slide-inner,
.panel-slide-leave-from .panel-slide-inner {
  transform: scaleY(1);
}
</style>

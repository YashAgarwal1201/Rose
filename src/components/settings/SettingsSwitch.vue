<!-- src/components/settings/SettingsSwitch.vue -->
<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-labelledby="ariaLabelledby"
    :aria-describedby="ariaDescribedby"
    class="relative inline-block h-6 w-11 shrink-0 rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary focus-visible:ring-offset-2 focus-visible:ring-offset-rose-surface"
    :class="modelValue ? 'bg-rose-primary' : 'bg-rose-border'"
    @click="emit('update:modelValue', !modelValue)"
  >
    <span
      class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-150"
      :class="modelValue ? 'translate-x-5' : 'translate-x-0'"
    />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
}>();

const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();
</script>

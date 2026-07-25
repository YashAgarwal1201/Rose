<!-- src/components/Sidebar.vue -->
<template>
  <aside
    class="w-full h-full z-40 bg-rose-surface border-t md:border-t-0 md:border-r border-rose-border flex flex-row md:flex-col items-center px-1 py-1 md:py-3"
  >
    <div
      class="flex flex-row md:flex-col justify-around md:justify-center items-center gap-1 md:gap-3 w-full h-full"
    >
      <router-link
        v-for="item in navItems"
        :key="item.name"
        :to="item.path"
        :aria-label="item.label"
        :aria-current="isActive(item.path) ? 'page' : undefined"
        class="flex flex-col justify-center items-center group cursor-pointer bg-transparent border-none"
      >
        <span
          class="rounded-full py-1 px-3 transition-all duration-200"
          :class="[
            isActive(item.path)
              ? 'bg-rose-primary text-white'
              : 'group-hover:bg-rose-surface-alt text-rose-text-muted group-hover:text-rose-text',
          ]"
        >
          <component
            :is="item.icon"
            :size="16"
            class="transition-colors duration-200"
            :class="isActive(item.path) ? 'animate-icon-pop' : ''"
          />
        </span>
        <span
          class="truncate text-xs font-medium mt-1 transition-all duration-200"
          :class="[
            isActive(item.path)
              ? 'text-rose-primary font-bold'
              : 'text-rose-text-muted group-hover:text-rose-text',
          ]"
        >
          {{ item.label }}
        </span>
      </router-link>

      <button
        type="button"
        aria-label="Menu"
        class="flex flex-col justify-center items-center group cursor-pointer bg-transparent border-none"
        @click="emit('toggleMenu')"
      >
        <span
          class="rounded-full py-1 px-3 transition-all duration-200 group-hover:bg-rose-surface-alt text-rose-text-muted group-hover:text-rose-text"
        >
          <MenuIcon :size="16" class="transition-colors duration-200" />
        </span>
        <span
          class="truncate text-xs font-medium mt-1 transition-all duration-200 text-rose-text-muted group-hover:text-rose-text"
        >
          Menu
        </span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import {
  FileTextIcon,
  HomeIcon,
  ListTodoIcon,
  MenuIcon,
  PenLineIcon,
  SettingsIcon,
} from "@lucide/vue";
import { useSettingsStore } from "../stores/settings";
import { computed } from "vue";

const route = useRoute();

// const navItems = [
//   { icon: HomeIcon, label: "Home", name: "home", path: "/" },
//   { icon: ListTodoIcon, label: "Todos", name: "todos", path: "/todos/folder" },
//   { icon: PenLineIcon, label: "Notes", name: "notes", path: "/notes/folder" },
//   { icon: FileTextIcon, label: "Docs", name: "docs", path: "/docs/folder" },
//   { icon: SettingsIcon, label: "Settings", name: "settings", path: "/settings" },
// ];

const settingsStore = useSettingsStore();

const featureNavItems = [
  {
    feature: "todo" as const,
    icon: ListTodoIcon,
    label: "Todos",
    name: "todos",
    path: "/todos/folder",
  },
  {
    feature: "note" as const,
    icon: PenLineIcon,
    label: "Notes",
    name: "notes",
    path: "/notes/folder",
  },
  {
    feature: "doc" as const,
    icon: FileTextIcon,
    label: "Docs",
    name: "docs",
    path: "/docs/folder",
  },
];

const navItems = computed(() => [
  { icon: HomeIcon, label: "Home", name: "home", path: "/" },
  ...featureNavItems.filter((item) => settingsStore.isFeatureEnabled(item.feature)),
  ...(settingsStore.enabledFeatures.length === 0
    ? [{ icon: SettingsIcon, label: "Settings", name: "settings", path: "/settings" }]
    : []),
]);

const emit = defineEmits<{ toggleMenu: [] }>();

function isActive(path: string): boolean {
  if (path === "/") {
    return route.path === "/";
  }
  return route.path.split("/")[1] === path.split("/")[1];
}
</script>

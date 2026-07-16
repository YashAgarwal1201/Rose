<!-- src/components/Sidebar.vue -->
<template>
  <aside
    class="w-full md:w-24 h-[72px] md:h-screen z-40 bg-rose-surface border-t md:border-t-0 md:border-r border-rose-border flex flex-row md:flex-col items-center py-2 md:py-3 px-2 md:px-0"
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
          <component :is="item.icon" class="w-5 h-5 transition-colors duration-200" />
        </span>
        <span
          class="truncate text-sm md:text-base font-medium mt-1 transition-all duration-200"
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
          <MenuIcon class="w-5 h-5 transition-colors duration-200" />
        </span>
        <span
          class="truncate text-sm md:text-base font-medium mt-1 transition-all duration-200 text-rose-text-muted group-hover:text-rose-text"
        >
          Menu
        </span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { FileTextIcon, ListTodoIcon, MenuIcon, PenLineIcon } from "@lucide/vue";

const route = useRoute();

const navItems = [
  { icon: ListTodoIcon, label: "Todos", name: "todos", path: "/todos/folder" },
  { icon: PenLineIcon, label: "Notes", name: "notes", path: "/notes/folder" },
  { icon: FileTextIcon, label: "Docs", name: "docs", path: "/docs/folder" },
];

const emit = defineEmits<{ toggleMenu: [] }>();

function isActive(path: string): boolean {
  return route.path.split("/")[1] === path.split("/")[1];
}
</script>

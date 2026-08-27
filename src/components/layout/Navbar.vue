<!-- src/components/Navbar.vue -->
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
  FolderIcon,
  HomeIcon,
  MenuIcon,
  LockIcon,
} from "@lucide/vue";
import { computed } from "vue";

const route = useRoute();

const navItems = computed(() => [
  { icon: HomeIcon, label: "Home", name: "home", path: "/" },
  { icon: FolderIcon, label: "Files", name: "files", path: "/files/folder" },
  { icon: LockIcon, label: "Vault", name: "vault", path: "/files/folder/Secure Vault" }
]);

const emit = defineEmits<{ toggleMenu: [] }>();

function isActive(path: string): boolean {
  if (path === "/") {
    return route.path === "/";
  }
  if (path === "/files/folder/Secure Vault") {
    return route.path.includes("/Secure Vault") || route.path.includes("/Secure%20Vault");
  }
  if (path === "/files/folder") {
    return route.path.split("/")[1] === "files" && !route.path.includes("/Secure Vault") && !route.path.includes("/Secure%20Vault");
  }
  return route.path.split("/")[1] === path.split("/")[1];
}
</script>

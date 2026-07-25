// src/stores/ui.ts
import { defineStore } from "pinia";
import { ref } from "vue";

export const useUiStore = defineStore("ui", () => {
  const isMenuOpen = ref(false);
  const isSearchOpen = ref(false);

  function openMenu() {
    isMenuOpen.value = true;
  }

  function closeMenu() {
    isMenuOpen.value = false;
  }

  function toggleMenu() {
    isMenuOpen.value = !isMenuOpen.value;
  }

  function openSearch() {
    isSearchOpen.value = true;
  }

  function closeSearch() {
    isSearchOpen.value = false;
  }

  function toggleSearch() {
    isSearchOpen.value = !isSearchOpen.value;
  }

  return {
    closeMenu,
    closeSearch,
    isMenuOpen,
    isSearchOpen,
    openMenu,
    openSearch,
    toggleMenu,
    toggleSearch,
  };
});

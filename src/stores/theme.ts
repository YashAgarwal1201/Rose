// Src/stores/theme.ts
import { defineStore } from "pinia";
import { ref } from "vue";

type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "rose-theme-mode";

function getSystemPrefersDark(): boolean {
  return globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(mode: ThemeMode) {
  const isDark = mode === "dark" || (mode === "system" && getSystemPrefersDark());
  document.documentElement.classList.toggle("dark", isDark);
}

export const useThemeStore = defineStore("theme", () => {
  const mode = ref<ThemeMode>((localStorage.getItem(STORAGE_KEY) as ThemeMode) || "system");

  function setMode(newMode: ThemeMode) {
    mode.value = newMode;
    localStorage.setItem(STORAGE_KEY, newMode);
    applyTheme(newMode);
  }

  function init() {
    applyTheme(mode.value);
    globalThis.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (mode.value === "system") {
        applyTheme("system");
      }
    });
  }

  return { init, mode, setMode };
});

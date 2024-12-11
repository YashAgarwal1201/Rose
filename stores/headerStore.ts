import { defineStore } from "pinia";
import { ref } from "vue";

export const useHeaderStore = defineStore("header", () => {
  const showSideMenu = ref(false);
  const headerTitle = ref<string>("");

  return { showSideMenu, headerTitle };
});

import { defineStore } from "pinia";
import { ref } from "vue";

export const useHeaderStore = defineStore("header", () => {
  const showSideMenu = ref(false);

  return { showSideMenu };
});

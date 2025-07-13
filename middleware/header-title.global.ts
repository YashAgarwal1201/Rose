import { defineNuxtRouteMiddleware } from "nuxt/app";

export default defineNuxtRouteMiddleware((to) => {
  const headerStore = useHeaderStore();

  const routeTitleMap: Record<string, string> = {
    home: "",
    "to-do-list": "Your To do lists",
    "sketch-notes": "Sketch Notes",
  };

  headerStore.headerTitle = routeTitleMap[to.name as string] ?? "";
});

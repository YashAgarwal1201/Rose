import { defineNuxtRouteMiddleware } from "nuxt/app";

export default defineNuxtRouteMiddleware((to) => {
  const headerStore = useHeaderStore();

  const baseName = to.name?.toString().split("-")[0]; // extract base route (e.g., "sketch" from "sketch-notes-id")

  const routeTitleMap: Record<string, string> = {
    home: "",
    "to-do-list": "Your To do lists",
    "sketch-notes": "Sketch Notes",
    "docs-generator": "Your Documents",
  };

  // Handle exact matches
  if (routeTitleMap[to.name as string]) {
    headerStore.headerTitle = routeTitleMap[to.name as string];
    return;
  }

  // Handle dynamic subroutes like sketch-notes/[id]
  if (to.name?.toString().startsWith("sketch-notes")) {
    headerStore.headerTitle = "New Sketch Note";
  } else if (to.name?.toString().startsWith("to-do-list")) {
    headerStore.headerTitle = "New To Do List";
  } else if (to.name?.toString().startsWith("docs-generator")) {
    headerStore.headerTitle = "New Document";
  } else {
    headerStore.headerTitle = ""; // fallback
  }
});

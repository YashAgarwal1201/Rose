// Src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import OnboardingView from "../views/OnboardingView.vue";
import SettingsView from "../views/SettingsView.vue";
import TodosView from "../views/TodosView.vue";
import TodoListView from "../views/TodoListView.vue";
import NotesView from "../views/NotesView.vue";
import DocsView from "../views/DocsView.vue";
import DocView from "../views/DocView.vue";
import { useSettingsStore } from "../stores/settings";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { component: HomeView, name: "home", path: "/" },
    { component: OnboardingView, name: "onboarding", path: "/onboarding" },
    { component: SettingsView, name: "settings", path: "/settings" },

    {
      component: TodosView,
      name: "todos-folder",
      path: "/todos/folder/:pathMatch(.*)*",
      props: true,
    },
    {
      component: TodoListView,
      name: "todos-list",
      path: "/todos/list/:pathMatch(.*)*",
      props: true,
    },

    {
      component: NotesView,
      name: "notes-folder",
      path: "/notes/folder/:pathMatch(.*)*",
      props: true,
    },
    { component: DocsView, name: "docs-folder", path: "/docs/folder/:pathMatch(.*)*", props: true },
    { component: DocView, name: "docs-doc", path: "/docs/doc/:pathMatch(.*)*", props: true },
  ],
});

// Onboarding gate: hydrate settings once (lazily, on first navigation), then
// force unonboarded users to /onboarding regardless of what they requested,
// and keep onboarded users out of /onboarding (e.g. a stale bookmark/back-nav)
// unless they've explicitly been sent back in via "Replay onboarding", which
// works by flipping onboardingCompleted back to false before navigating.
router.beforeEach(async (to) => {
  const settingsStore = useSettingsStore();

  if (!settingsStore.isLoaded) {
    await settingsStore.loadSettings();
  }

  if (!settingsStore.onboardingCompleted && to.name !== "onboarding") {
    return { name: "onboarding" };
  }

  if (settingsStore.onboardingCompleted && to.name === "onboarding") {
    return { name: "home" };
  }

  return true;
});

export default router;

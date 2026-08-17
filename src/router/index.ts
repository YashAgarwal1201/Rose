// Src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/home/HomeView.vue";
import OnboardingView from "@/views/onboarding/OnboardingView.vue";
import SettingsView from "@/views/settings/SettingsView.vue";
import TodosView from "@/views/todos/TodosView.vue";
import TodoListView from "@/views/todos/TodoListView.vue";
import NotesView from "@/views/notes/NotesView.vue";
import NoteView from "@/views/notes/NoteView.vue";
import DocsView from "@/views/docs/DocsView.vue";
import DocView from "@/views/docs/DocView.vue";
import { useSettingsStore } from "@/stores/settings";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { component: HomeView, meta: { title: "Home" }, name: "home", path: "/" },
    {
      component: OnboardingView,
      meta: { title: "Welcome" },
      name: "onboarding",
      path: "/onboarding",
    },
    { component: SettingsView, name: "settings", meta: { title: "Settings" }, path: "/settings" },

    {
      component: () => import("@/views/files/FilesView.vue"),
      name: "files-folder",
      meta: { title: "Files" },
      path: "/files/folder/:pathMatch(.*)*",
      props: true,
    },

    {
      component: TodosView,
      name: "todos-all",
      meta: { title: "Todos" },
      path: "/todos",
      props: true,
    },
    {
      component: TodoListView,
      name: "files-list",
      path: "/files/list/:pathMatch(.*)*",
      props: true,
    },

    {
      component: NotesView,
      name: "notes-all",
      meta: { title: "Notes" },
      path: "/notes",
      props: true,
    },
    {
      component: DocsView,
      name: "docs-all",
      meta: { title: "Docs" },
      path: "/docs",
      props: true,
    },
    { component: DocView, name: "files-doc", path: "/files/doc/:pathMatch(.*)*", props: true },
    { component: NoteView, name: "files-note", path: "/files/note/:pathMatch(.*)*", props: true },
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

router.afterEach((to) => {
  const title = to.meta.title as string | undefined;
  document.title = title ? `${title} · Rose` : "Rose";
});

export default router;

// Src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import { useSettingsStore } from "@/stores/settings";

const HomeView = () => import("@/views/home/HomeView.vue");
const OnboardingView = () => import("@/views/onboarding/OnboardingView.vue");
const SettingsView = () => import("@/views/settings/SettingsView.vue");
const TodosView = () => import("@/views/todos/TodosView.vue");
const TodoListView = () => import("@/views/todos/TodoListView.vue");
const NotesView = () => import("@/views/notes/NotesView.vue");
const NoteView = () => import("@/views/notes/NoteView.vue");
const DocsView = () => import("@/views/docs/DocsView.vue");
const DocView = () => import("@/views/docs/DocView.vue");
const FilesView = () => import("@/views/files/FilesView.vue");

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
      component: FilesView,
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

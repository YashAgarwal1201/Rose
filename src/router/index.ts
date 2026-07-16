// Src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import TodosView from "../views/TodosView.vue";
import TodoListView from "../views/TodoListView.vue";
import NotesView from "../views/NotesView.vue";
import DocsView from "../views/DocsView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", redirect: "/todos/folder" },

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
  ],
});

export default router;

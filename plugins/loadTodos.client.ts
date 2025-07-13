import { defineNuxtPlugin } from "#app";
import { useTodoStore } from "@/stores/todoStore";

export default defineNuxtPlugin(() => {
  const todoStore = useTodoStore();

  if (!todoStore.loaded) {
    todoStore.loadTodos();
  }
});

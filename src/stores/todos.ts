// src/stores/todos.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import db from "@/db";
import type { Todo, TodoList } from "@/db/types";
import { useActivityStore } from "./activity";

export const useTodosStore = defineStore("todos", () => {
  const todoLists = ref<TodoList[]>([]);
  const todos = ref<Todo[]>([]);
  const currentListId = ref<string | null>(null);

  async function loadTodoLists() {
    todoLists.value = await db.todoLists.toArray();
  }

  async function createTodoList(name: string, folderId: string | null) {
    const trimmed = name.trim();
    const duplicate = todoLists.value.find(
      (list) => list.folderId === folderId && list.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) {
      throw new Error(`A list named "${trimmed}" already exists here.`);
    }
    const now = Date.now();
    const list: TodoList = {
      createdAt: now,
      folderId,
      id: crypto.randomUUID(),
      lastOpenedAt: null,
      name: trimmed,
      updatedAt: now,
    };
    await db.todoLists.add(list);
    await loadTodoLists();
    return list.id;
  }

  async function renameTodoList(id: string, name: string) {
    const trimmed = name.trim();
    const target = todoLists.value.find((list) => list.id === id);
    if (!target) {
      return;
    }
    const duplicate = todoLists.value.find(
      (list) =>
        list.id !== id &&
        list.folderId === target.folderId &&
        list.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) {
      throw new Error(`A list named "${trimmed}" already exists here.`);
    }
    await db.todoLists.update(id, { name: trimmed, updatedAt: Date.now() });
    await loadTodoLists();
  }

  // Marks a list as opened "now" — powers Home's "recently opened" sort.
  // Call this once when a todo list is actually navigated into.
  async function touchTodoList(id: string) {
    await db.todoLists.update(id, { lastOpenedAt: Date.now() });
  }

  async function deleteTodosByList(listId: string) {
    const targets = await db.todos.where("listId").equals(listId).toArray();
    await db.todos.bulkDelete(targets.map((todo) => todo.id));
  }

  async function deleteTodoList(id: string) {
    await deleteTodosByList(id);
    await db.todoLists.delete(id);
    await loadTodoLists();
  }

  async function getTodoList(id: string): Promise<TodoList | undefined> {
    return db.todoLists.get(id);
  }

  async function deleteTodoListsByFolder(folderId: string) {
    const targets = await db.todoLists.where("folderId").equals(folderId).toArray();
    await Promise.all(targets.map((list) => deleteTodosByList(list.id)));
    await db.todoLists.bulkDelete(targets.map((list) => list.id));
  }

  async function getTodoCountForList(listId: string): Promise<number> {
    return db.todos.where("listId").equals(listId).count();
  }

  async function loadTodos(listId: string) {
    currentListId.value = listId;
    const result = await db.todos.where("listId").equals(listId).toArray();
    if (currentListId.value === listId) {
      todos.value = result;
    }
  }

  async function createTodo(title: string, listId: string) {
    const now = Date.now();
    const todo: Todo = {
      createdAt: now,
      done: false,
      dueDate: now + 24 * 60 * 60 * 1000,
      id: crypto.randomUUID(),
      listId,
      priority: null,
      title,
      updatedAt: now,
    };
    await db.todos.add(todo);
    await useActivityStore().record("todo_created", todo.id);
    if (listId === currentListId.value) {
      await loadTodos(listId);
    }
    return todo.id;
  }

  async function toggleDone(id: string) {
    const todo = todos.value.find((candidate) => candidate.id === id);
    if (!todo) {
      return;
    }
    await db.todos.update(id, { done: !todo.done, updatedAt: Date.now() });
    await useActivityStore().record("todo_toggled", id);
    if (todo.listId === currentListId.value) {
      await loadTodos(todo.listId);
    }
  }

  async function updateTodo(
    id: string,
    changes: Partial<Pick<Todo, "title" | "priority" | "dueDate">>,
  ) {
    await db.todos.update(id, { ...changes, updatedAt: Date.now() });
    await useActivityStore().record("todo_updated", id);
    const todo = todos.value.find((candidate) => candidate.id === id);
    if (todo && todo.listId === currentListId.value) {
      await loadTodos(todo.listId);
    }
  }

  async function deleteTodo(id: string) {
    const todo = todos.value.find((candidate) => candidate.id === id);
    if (!todo) {
      return;
    }
    await db.todos.delete(id);
    if (todo.listId === currentListId.value) {
      await loadTodos(todo.listId);
    }
  }

  return {
    createTodo,
    createTodoList,
    deleteTodo,
    deleteTodoList,
    deleteTodoListsByFolder,
    deleteTodosByList,
    getTodoCountForList,
    getTodoList,
    loadTodoLists,
    loadTodos,
    renameTodoList,
    todoLists,
    todos,
    toggleDone,
    touchTodoList,
    updateTodo,
  };
});

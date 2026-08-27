// src/stores/todos.ts
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import db from "@/db";
import type { Todo, TodoList } from "@/db/types";
import { useActivityStore } from "./activity";
import { useFoldersStore } from "./folders";

export const useTodosStore = defineStore("todos", () => {
  const todoLists = ref<TodoList[]>([]);
  const todos = ref<Todo[]>([]);
  const currentListId = ref<string | null>(null);

  const sortedTodos = computed(() => todos.value.toSorted((a, b) => {
    // 1. Status (Incomplete first)
    if (a.done !== b.done) {return a.done ? 1 : -1;}

    // 2. Priority (High > Medium > Low > None)
    const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1, null: 0 };
    const weightA = priorityWeight[a.priority ?? 'null'] ?? 0;
    const weightB = priorityWeight[b.priority ?? 'null'] ?? 0;
    if (weightA !== weightB) {return weightB - weightA;}

    // 3. Due Date (Earliest first)
    if (a.dueDate !== b.dueDate) {
      if (!a.dueDate) {return 1;}
      if (!b.dueDate) {return -1;}
      return a.dueDate - b.dueDate;
    }

    // 4. Creation Date (Newest first)
    return b.createdAt - a.createdAt;
  }));

  async function loadTodoLists() {
    todoLists.value = await db.todoLists.toArray();
  }

  async function createTodoList(name: string, folderId: string | null) {
    const trimmed = name.trim() || "Untitled list";
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
    await useActivityStore().record("todo_list_created", list.id);
    if (folderId) {
      await useFoldersStore().ensureFolderSupports(folderId, "todo");
    }
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

  async function moveTodoList(id: string, newFolderId: string | null, newName?: string) {
    const target = todoLists.value.find((list) => list.id === id);
    if (!target) {
      return;
    }

    if (target.folderId === newFolderId && (!newName || newName.trim() === target.name)) {
      return;
    }

    const nameToUse = (newName || target.name).trim();
    const duplicate = todoLists.value.find(
      (list) =>
        list.id !== id &&
        list.folderId === newFolderId &&
        list.name.toLowerCase() === nameToUse.toLowerCase(),
    );
    if (duplicate) {
      throw new Error(`A list named "${nameToUse}" already exists in the destination.`);
    }

    await db.todoLists.update(id, { folderId: newFolderId, name: nameToUse, updatedAt: Date.now() });
    if (newFolderId) {
      await useFoldersStore().ensureFolderSupports(newFolderId, "todo");
    }
    await loadTodoLists();
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
    moveTodoList,
    renameTodoList,
    todoLists,
    todos,
    sortedTodos,
    toggleDone,
    touchTodoList,
    updateTodo,
  };
});


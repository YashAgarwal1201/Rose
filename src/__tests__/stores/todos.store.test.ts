// src/__tests__/stores/todos.store.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { createPinia, setActivePinia } from "pinia";
import db from "../../db";
import { useTodosStore } from "../../stores/todos";

// beforeEach(async () => {
//   setActivePinia(createPinia());
//   await db.folders.clear(); // folders.store.test.ts only
//   await db.todoLists.clear();
//   await db.todos.clear();
// });

async function freshDb(): Promise<void> {
  db.close();
  globalThis.indexedDB = new IDBFactory();
  await db.open();
}

describe("todosStore", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await db.todoLists.clear();
    await db.todos.clear();
  });

  describe("createTodoList", () => {
    it("creates a list and reflects it in state", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      await store.createTodoList("Shopping", null);
      expect(store.todoLists).toHaveLength(1);
      expect(store.todoLists[0]?.name).toBe("Shopping");
    });

    it("persists the list to the DB", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      await store.createTodoList("Groceries", null);
      const rows = await db.todoLists.toArray();
      expect(rows).toHaveLength(1);
      expect(rows[0]?.name).toBe("Groceries");
    });

    it("sets folderId on the created list", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      await store.createTodoList("InFolder", "folder-abc");
      expect(store.todoLists[0]?.folderId).toBe("folder-abc");
    });

    it("throws on duplicate name within the same folder", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      await store.createTodoList("Dup", null);
      await expect(store.createTodoList("Dup", null)).rejects.toThrow("already exists");
    });

    it("is case-insensitive for duplicate detection", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      await store.createTodoList("Work", null);
      await expect(store.createTodoList("WORK", null)).rejects.toThrow("already exists");
    });

    it("allows duplicate names in different folders", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      await store.createTodoList("Same", "folder-1");
      await store.createTodoList("Same", "folder-2");
      expect(store.todoLists).toHaveLength(2);
    });
  });

  describe("renameTodoList", () => {
    it("renames a list successfully", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      const listId = await store.createTodoList("Old Name", null);
      await store.renameTodoList(listId, "New Name");
      const renamed = store.todoLists.find((list) => list.id === listId);
      expect(renamed?.name).toBe("New Name");
    });

    it("trims whitespace from new name", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      const listId = await store.createTodoList("Untrimmed", null);
      await store.renameTodoList(listId, "  Trimmed  ");
      const renamed = store.todoLists.find((list) => list.id === listId);
      expect(renamed?.name).toBe("Trimmed");
    });

    it("throws when renaming to a duplicate name in the same folder", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      await store.createTodoList("Taken", null);
      const otherId = await store.createTodoList("Other", null);
      await expect(store.renameTodoList(otherId, "Taken")).rejects.toThrow("already exists");
    });
  });

  describe("deleteTodoList", () => {
    it("deletes the list from state and DB", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      const listId = await store.createTodoList("ToDelete", null);
      await store.deleteTodoList(listId);
      expect(store.todoLists).toHaveLength(0);
      const row = await db.todoLists.get(listId);
      expect(row).toBeUndefined();
    });

    it("cascade-deletes all todos belonging to the deleted list", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      const listId = await store.createTodoList("WithTodos", null);
      await store.loadTodos(listId);
      await store.createTodo("Task 1", listId);
      await store.createTodo("Task 2", listId);
      await store.deleteTodoList(listId);
      const remaining = await db.todos.toArray();
      expect(remaining).toHaveLength(0);
    });
  });

  describe("getTodoList", () => {
    it("returns the list for a known id", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      const listId = await store.createTodoList("Known", null);
      const result = await store.getTodoList(listId);
      expect(result?.name).toBe("Known");
    });

    it("returns undefined for an unknown id", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      const result = await store.getTodoList("no-such-id");
      expect(result).toBeUndefined();
    });
  });

  describe("createTodo", () => {
    it("creates a todo with correct defaults", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      const listId = await store.createTodoList("List", null);
      await store.loadTodos(listId);
      const todoId = await store.createTodo("Buy milk", listId);
      const created = store.todos.find((todo) => todo.id === todoId);
      expect(created?.title).toBe("Buy milk");
      expect(created?.done).toBe(false);
      expect(created?.priority).toBeNull();
      expect(created?.dueDate).toBeNull();
    });

    it("populates todos state when the list is currently active", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      const listId = await store.createTodoList("Active", null);
      await store.loadTodos(listId);
      await store.createTodo("Do thing", listId);
      expect(store.todos).toHaveLength(1);
    });

    it("does not update todos state when a different list is active", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      const listA = await store.createTodoList("List A", null);
      const listB = await store.createTodoList("List B", null);
      await store.loadTodos(listA);
      await store.createTodo("Not visible", listB);
      expect(store.todos).toHaveLength(0);
    });
  });

  describe("toggleDone", () => {
    it("flips done from false to true", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      const listId = await store.createTodoList("L", null);
      await store.loadTodos(listId);
      const todoId = await store.createTodo("Flip me", listId);
      await store.toggleDone(todoId);
      const toggled = store.todos.find((todo) => todo.id === todoId);
      expect(toggled?.done).toBe(true);
    });

    it("flips done from true back to false", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      const listId = await store.createTodoList("L", null);
      await store.loadTodos(listId);
      const todoId = await store.createTodo("Flip twice", listId);
      await store.toggleDone(todoId);
      await store.toggleDone(todoId);
      const toggled = store.todos.find((todo) => todo.id === todoId);
      expect(toggled?.done).toBe(false);
    });

    it("updates updatedAt when toggled", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      const listId = await store.createTodoList("L", null);
      await store.loadTodos(listId);
      const todoId = await store.createTodo("Timestamp test", listId);
      const original = store.todos.find((todo) => todo.id === todoId);
      const createdAt = original?.updatedAt ?? 0;
      await new Promise((resolve) => setTimeout(resolve, 2));
      await store.toggleDone(todoId);
      const row = await db.todos.get(todoId);
      expect(row?.updatedAt).toBeGreaterThan(createdAt);
    });

    it("does nothing for a non-existent todo id", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      await store.toggleDone("ghost-todo-id");
      expect(store.todos).toHaveLength(0);
    });
  });

  describe("updateTodo", () => {
    it("updates the title", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      const listId = await store.createTodoList("L", null);
      await store.loadTodos(listId);
      const todoId = await store.createTodo("Original", listId);
      await store.updateTodo(todoId, { title: "Updated" });
      const updated = store.todos.find((todo) => todo.id === todoId);
      expect(updated?.title).toBe("Updated");
    });

    it("updates priority", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      const listId = await store.createTodoList("L", null);
      await store.loadTodos(listId);
      const todoId = await store.createTodo("Task", listId);
      await store.updateTodo(todoId, { priority: "high" });
      const updated = store.todos.find((todo) => todo.id === todoId);
      expect(updated?.priority).toBe("high");
    });

    it("updates dueDate", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      const listId = await store.createTodoList("L", null);
      await store.loadTodos(listId);
      const todoId = await store.createTodo("Task", listId);
      const due = Date.now() + 86_400_000;
      await store.updateTodo(todoId, { dueDate: due });
      const updated = store.todos.find((todo) => todo.id === todoId);
      expect(updated?.dueDate).toBe(due);
    });

    it("bumps updatedAt on every update", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      const listId = await store.createTodoList("L", null);
      await store.loadTodos(listId);
      const todoId = await store.createTodo("Task", listId);
      const original = store.todos.find((todo) => todo.id === todoId);
      const before = original?.updatedAt ?? 0;
      await new Promise((resolve) => setTimeout(resolve, 2));
      await store.updateTodo(todoId, { title: "Changed" });
      const row = await db.todos.get(todoId);
      expect(row?.updatedAt).toBeGreaterThan(before);
    });
  });

  describe("deleteTodo", () => {
    it("removes the todo from state and DB", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      const listId = await store.createTodoList("L", null);
      await store.loadTodos(listId);
      const todoId = await store.createTodo("Remove me", listId);
      await store.deleteTodo(todoId);
      expect(store.todos).toHaveLength(0);
      const row = await db.todos.get(todoId);
      expect(row).toBeUndefined();
    });

    it("does nothing for a non-existent id", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      await store.deleteTodo("no-id");
      expect(store.todos).toHaveLength(0);
    });
  });

  describe("getTodoCountForList", () => {
    it("returns 0 for an empty list", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      const listId = await store.createTodoList("Empty", null);
      const count = await store.getTodoCountForList(listId);
      expect(count).toBe(0);
    });

    it("returns the correct count after adding todos", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      const listId = await store.createTodoList("Counted", null);
      await store.loadTodos(listId);
      await store.createTodo("One", listId);
      await store.createTodo("Two", listId);
      const count = await store.getTodoCountForList(listId);
      expect(count).toBe(2);
    });

    it("only counts todos for the given list", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      const listA = await store.createTodoList("A", null);
      const listB = await store.createTodoList("B", null);
      await store.loadTodos(listA);
      await store.createTodo("For A", listA);
      const count = await store.getTodoCountForList(listB);
      expect(count).toBe(0);
    });
  });

  describe("deleteTodosByList", () => {
    it("deletes all todos for the given list", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      const listId = await store.createTodoList("Purge", null);
      await store.loadTodos(listId);
      await store.createTodo("X", listId);
      await store.createTodo("Y", listId);
      await store.deleteTodosByList(listId);
      const remaining = await db.todos.toArray();
      expect(remaining).toHaveLength(0);
    });

    it("does not delete todos from other lists", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      const listA = await store.createTodoList("A", null);
      const listB = await store.createTodoList("B", null);
      await store.loadTodos(listA);
      await store.createTodo("Keep me", listA);
      await store.deleteTodosByList(listB);
      const remaining = await db.todos.toArray();
      expect(remaining).toHaveLength(1);
    });
  });

  describe("deleteTodoListsByFolder", () => {
    it("deletes all lists belonging to a folder", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      await store.createTodoList("In folder", "folder-1");
      await store.createTodoList("Also in folder", "folder-1");
      await store.deleteTodoListsByFolder("folder-1");
      const remaining = await db.todoLists.toArray();
      expect(remaining).toHaveLength(0);
    });

    it("also deletes all todos within those lists", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      const listId = await store.createTodoList("In folder", "folder-1");
      await store.loadTodos(listId);
      await store.createTodo("Nested todo", listId);
      await store.deleteTodoListsByFolder("folder-1");
      const remaining = await db.todos.toArray();
      expect(remaining).toHaveLength(0);
    });

    it("does not affect lists in other folders", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useTodosStore();
      await store.createTodoList("Safe", "folder-2");
      await store.deleteTodoListsByFolder("folder-1");
      const remaining = await db.todoLists.toArray();
      expect(remaining).toHaveLength(1);
    });
  });
});

// Src/db/index.ts
import Dexie, { type EntityTable } from "dexie";
import type { Folder, Todo, TodoList } from "./types";

const db = new Dexie("RoseDatabase") as Dexie & {
  folders: EntityTable<Folder, "id">;
  todoLists: EntityTable<TodoList, "id">;
  todos: EntityTable<Todo, "id">;
};

db.version(1).stores({
  folders: "++id, parentId, type",
  todos: "++id, folderId, done",
});

db.version(2).stores({
  folders: "++id, parentId, type",
  todoLists: "++id, folderId",
  todos: "++id, listId, done",
});

db.version(3).stores({
  folders: "id, parentId, type",
  todoLists: "id, folderId",
  todos: "id, listId, done",
});

export default db;

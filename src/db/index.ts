// // Src/db/index.ts
// import Dexie, { type EntityTable } from "dexie";
// import type { Folder, Todo, TodoList } from "./types";

// const db = new Dexie("RoseDatabase") as Dexie & {
//   folders: EntityTable<Folder, "id">;
//   todoLists: EntityTable<TodoList, "id">;
//   todos: EntityTable<Todo, "id">;
// };

// db.version(1).stores({
//   folders: "++id, parentId, type",
//   todos: "++id, folderId, done",
// });

// db.version(2).stores({
//   folders: "++id, parentId, type",
//   todoLists: "++id, folderId",
//   todos: "++id, listId, done",
// });

// db.version(3).stores({
//   folders: "id, parentId, type",
//   todoLists: "id, folderId",
//   todos: "id, listId, done",
// });

// export default db;

import Dexie, { type EntityTable } from "dexie";
import type { ActivityEntry, AppSettings, Doc, Folder, Note, Todo, TodoList } from "./types";

const db = new Dexie("RoseDatabase") as Dexie & {
  folders: EntityTable<Folder, "id">;
  todoLists: EntityTable<TodoList, "id">;
  todos: EntityTable<Todo, "id">;
  docs: EntityTable<Doc, "id">;
  notes: EntityTable<Note, "id">;
  settings: EntityTable<AppSettings, "id">;
  activity: EntityTable<ActivityEntry, "id">;
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

db.version(4).stores({
  folders: "id, parentId, type",
  todoLists: "id, folderId",
  todos: "id, listId, done",
  docs: "id, folderId",
});

db.version(5)
  .stores({
    folders: "id, parentId, type",
    todoLists: "id, folderId",
    todos: "id, listId, done",
    docs: "id, folderId",
    settings: "id",
  })
  .upgrade(async (tx) => {
    // Backfill lastOpenedAt on existing rows so the shape is consistent
    // going forward (Home's "recently opened" sort relies on this field).
    await tx
      .table("todoLists")
      .toCollection()
      .modify((list: TodoList) => {
        list.lastOpenedAt ??= null;
      });
    await tx
      .table("docs")
      .toCollection()
      .modify((doc: Doc) => {
        doc.lastOpenedAt ??= null;
      });
  });

db.version(6).stores({
  activity: "id, timestamp, entityId",
  docs: "id, folderId",
  folders: "id, parentId, type",
  settings: "id",
  todoLists: "id, folderId",
  todos: "id, listId, done",
});

db.version(7).stores({
  activity: "id, timestamp, entityId",
  docs: "id, folderId",
  folders: "id, parentId, type",
  notes: "id, folderId",
  settings: "id",
  todoLists: "id, folderId",
  todos: "id, listId, done",
});

export default db;

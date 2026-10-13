// src/composables/useHomeSummary.ts
import { computed, ref } from "vue";
import db from "@/db";
import type { Doc, Folder, Note, Todo, TodoList } from "@/db/types";
import { MS_PER_WEEK } from "@/utils/constants";

export type RecentItemType = "todo" | "doc" | "note";

export interface HomeItem {
  id: string;
  type: RecentItemType;
  title: string;
  lastOpenedAt: number | null;
  updatedAt: number;
  folderName: string | null;
  path: string[];
}

export interface FolderSummary {
  id: string;
  type: Folder["type"];
  name: string;
  itemCount: number;
  updatedAt: number;
  path: string[]; // route pathMatch segments to navigate into this folder
}

export interface DueSoonItem {
  id: string;
  listId: string;
  title: string;
  dueDate: number;
  priority: "low" | "medium" | "high" | null;
  listName: string;
  listPath: string[];
}

const RECENT_ITEMS_LIMIT = 6;
const RECENT_BY_TYPE_LIMIT = 12;
const TOP_FOLDERS_LIMIT = 3;
const SEARCH_RESULTS_LIMIT = 6;

function buildFolderPath(folderId: string | null, folders: Folder[]): string[] {
  const path: string[] = [];
  let cursor = folderId;
  while (cursor !== null) {
    const folder = folders.find((candidate) => candidate.id === cursor);
    if (!folder) {
      break;
    }
    path.unshift(folder.name);
    cursor = folder.parentId;
  }
  return path;
}

function immediateFolderName(folderId: string | null, folders: Folder[]): string | null {
  if (folderId === null) {
    return null;
  }
  return folders.find((folder) => folder.id === folderId)?.name ?? null;
}

export function useHomeSummary() {
  const folders = ref<Folder[]>([]);
  const todoLists = ref<TodoList[]>([]);
  const todos = ref<Todo[]>([]);
  const openTodoCount = ref(0);
  const docs = ref<Doc[]>([]);
  const notes = ref<Note[]>([]);
  const isLoaded = ref(false);

  async function refresh() {
    const [folderRows, listRows, todoRows, docRows, noteRows] = await Promise.all([
      db.folders.toArray(),
      db.todoLists.toArray(),
      db.todos.toArray(),
      db.docs.toArray(),
      db.notes.toArray(),
    ]);

    folders.value = folderRows.filter(f => !f.isVaulted && f.id !== "vault" && (f.trashedAt ?? null) === null);
    todoLists.value = listRows.filter(l => !l.isVaulted && (l.trashedAt ?? null) === null);
    docs.value = docRows.filter(d => !d.isVaulted && (d.trashedAt ?? null) === null);
    notes.value = noteRows.filter(n => !n.isVaulted && (n.trashedAt ?? null) === null);
    todos.value = todoRows.filter(t => !t.isVaulted);
    const activeListIds = new Set(todoLists.value.map(l => l.id));
    openTodoCount.value = todos.value.filter((todo) => !todo.done && activeListIds.has(todo.listId)).length;
    isLoaded.value = true;
  }

  const allItems = computed<HomeItem[]>(() => [
    ...todoLists.value.map((list) => ({
      folderName: immediateFolderName(list.folderId, folders.value),
      id: list.id,
      lastOpenedAt: list.lastOpenedAt ?? null,
      path: [...buildFolderPath(list.folderId, folders.value), list.name],
      title: list.name,
      type: "todo" as const,
      updatedAt: list.updatedAt,
    })),
    ...docs.value.map((doc) => ({
      folderName: immediateFolderName(doc.folderId, folders.value),
      id: doc.id,
      lastOpenedAt: doc.lastOpenedAt ?? null,
      path: [...buildFolderPath(doc.folderId, folders.value), doc.title],
      title: doc.title,
      type: "doc" as const,
      updatedAt: doc.updatedAt,
    })),
    ...notes.value.map((note) => ({
      folderName: immediateFolderName(note.folderId, folders.value),
      id: note.id,
      lastOpenedAt: note.lastOpenedAt ?? null,
      path: [...buildFolderPath(note.folderId, folders.value), note.title],
      title: note.title,
      type: "note" as const,
      updatedAt: note.updatedAt,
    })),
  ]);

  const recentItems = computed(() =>
    allItems.value
      .filter((item) => item.lastOpenedAt !== null)
      .toSorted((a, b) => (b.lastOpenedAt as number) - (a.lastOpenedAt as number))
      .slice(0, RECENT_ITEMS_LIMIT),
  );
  function recentByType(type: RecentItemType): HomeItem[] {
    const cutoff = Date.now() - MS_PER_WEEK;
    return allItems.value
      .filter((item) => item.type === type && item.updatedAt >= cutoff)
      .toSorted((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, RECENT_BY_TYPE_LIMIT);
  }

  const recentTodos = computed(() => recentByType("todo"));
  const recentDocs = computed(() => recentByType("doc"));
  const recentNotes = computed(() => recentByType("note"));

  function countForFolder(folder: Folder): number {
    if (folder.type === "todo") {
      return todoLists.value.filter((list) => list.folderId === folder.id).length;
    }
    if (folder.type === "doc") {
      return docs.value.filter((doc) => doc.folderId === folder.id).length;
    }
    if (folder.type === "note") {
      return notes.value.filter((note) => note.folderId === folder.id).length;
    }
    if (folder.type === "mixed") {
      return (
        todoLists.value.filter((list) => list.folderId === folder.id).length +
        docs.value.filter((doc) => doc.folderId === folder.id).length +
        notes.value.filter((note) => note.folderId === folder.id).length
      );
    }
    return 0;
  }

  const allTopFolders = computed<FolderSummary[]>(() =>
    folders.value
      .filter((folder) => folder.parentId === null)
      .map((folder) => ({
        id: folder.id,
        itemCount: countForFolder(folder),
        name: folder.name,
        path: buildFolderPath(folder.id, folders.value),
        type: folder.type,
        updatedAt: folder.updatedAt,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt),
  );

  const topFolders = computed(() => allTopFolders.value.slice(0, TOP_FOLDERS_LIMIT));
  const overflowFolderCount = computed(() =>
    Math.max(allTopFolders.value.length - TOP_FOLDERS_LIMIT, 0),
  );

  const isEmpty = computed(
    () =>
      folders.value.length === 0 &&
      todoLists.value.length === 0 &&
      docs.value.length === 0 &&
      notes.value.length === 0,
  );

  function search(query: string): HomeItem[] {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return [];
    }
    return allItems.value
      .filter((item) => item.title.toLowerCase().includes(trimmed))
      .slice(0, SEARCH_RESULTS_LIMIT);
  }

  const dueSoonTodos = computed<DueSoonItem[]>(() => {
    const now = Date.now();
    const current = new Date(now);
    const endOfWindow = new Date(
      current.getFullYear(),
      current.getMonth(),
      current.getDate() + 3,
      23, 59, 59, 999
    ).getTime();

    const listMap = new Map(todoLists.value.map((list) => [list.id, list]));

    return todos.value
      .filter((t) => {
        if (t.done || t.isVaulted || !t.dueDate) {
          return false;
        }
        if (!listMap.has(t.listId)) {
          return false;
        }
        return t.dueDate <= endOfWindow;
      })
      .sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0))
      .slice(0, 5)
      .map((t) => {
        const list = listMap.get(t.listId)!;
        return {
          id: t.id,
          listId: t.listId,
          title: t.title || (t as any).text || "Untitled",
          dueDate: t.dueDate!,
          priority: t.priority ?? null,
          listName: list.name,
          listPath: [...buildFolderPath(list.folderId, folders.value), list.name],
        };
      });
  });

  const totalDueSoonCount = computed(() => {
    const now = Date.now();
    const current = new Date(now);
    const endOfWindow = new Date(
      current.getFullYear(),
      current.getMonth(),
      current.getDate() + 3,
      23, 59, 59, 999
    ).getTime();

    const listMap = new Map(todoLists.value.map((list) => [list.id, list]));

    return todos.value.filter((t) => {
      if (t.done || t.isVaulted || !t.dueDate) {
        return false;
      }
      if (!listMap.has(t.listId)) {
        return false;
      }
      return t.dueDate <= endOfWindow;
    }).length;
  });

  // return {
  //   docCount: computed(() => docs.value.length),
  //   folderCount: computed(() => folders.value.length),
  //   isEmpty,
  //   isLoaded,
  //   listCount: computed(() => todoLists.value.length),
  //   openTodoCount,
  //   overflowFolderCount,
  //   recentItems,
  //   refresh,
  //   search,
  //   topFolders,
  // };

  return {
    docCount: computed(() => docs.value.length),
    dueSoonTodos,
    folderCount: computed(() => folders.value.length),
    isEmpty,
    isLoaded,
    listCount: computed(() => todoLists.value.length),
    noteCount: computed(() => notes.value.length),
    openTodoCount,
    overflowFolderCount,
    recentDocs,
    recentItems,
    recentNotes,
    recentTodos,
    refresh,
    search,
    topFolders,
    totalDueSoonCount,
  };
}

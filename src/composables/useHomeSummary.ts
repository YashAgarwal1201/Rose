// src/composables/useHomeSummary.ts
import { computed, ref } from "vue";
import db from "../db";
import type { Doc, Folder, TodoList } from "../db/types";

export type RecentItemType = "todo" | "doc";

export interface HomeItem {
  id: string;
  type: RecentItemType;
  title: string;
  lastOpenedAt: number | null;
  folderName: string | null; // immediate parent folder name, for the card subtitle
  path: string[]; // full route pathMatch segments (folder path + item name)
}

export interface FolderSummary {
  id: string;
  type: Folder["type"];
  name: string;
  itemCount: number;
  updatedAt: number;
  path: string[]; // route pathMatch segments to navigate into this folder
}

const RECENT_ITEMS_LIMIT = 6;
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
  const openTodoCount = ref(0);
  const docs = ref<Doc[]>([]);
  const isLoaded = ref(false);

  async function refresh() {
    const [folderRows, listRows, todoRows, docRows] = await Promise.all([
      db.folders.toArray(),
      db.todoLists.toArray(),
      db.todos.toArray(),
      db.docs.toArray(),
    ]);

    folders.value = folderRows;
    todoLists.value = listRows;
    docs.value = docRows;
    openTodoCount.value = todoRows.filter((todo) => !todo.done).length;
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
    })),
    ...docs.value.map((doc) => ({
      folderName: immediateFolderName(doc.folderId, folders.value),
      id: doc.id,
      lastOpenedAt: doc.lastOpenedAt ?? null,
      path: [...buildFolderPath(doc.folderId, folders.value), doc.title],
      title: doc.title,
      type: "doc" as const,
    })),
  ]);

  const recentItems = computed(() =>
    allItems.value
      .filter((item) => item.lastOpenedAt !== null)
      .toSorted((a, b) => (b.lastOpenedAt as number) - (a.lastOpenedAt as number))
      .slice(0, RECENT_ITEMS_LIMIT),
  );

  const allTopFolders = computed<FolderSummary[]>(() =>
    folders.value
      .filter((folder) => folder.parentId === null)
      .map((folder) => ({
        id: folder.id,
        itemCount:
          folder.type === "todo"
            ? todoLists.value.filter((list) => list.folderId === folder.id).length
            : folder.type === "doc"
              ? docs.value.filter((doc) => doc.folderId === folder.id).length
              : 0,
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
    () => folders.value.length === 0 && todoLists.value.length === 0 && docs.value.length === 0,
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

  return {
    docCount: computed(() => docs.value.length),
    folderCount: computed(() => folders.value.length),
    isEmpty,
    isLoaded,
    listCount: computed(() => todoLists.value.length),
    openTodoCount,
    overflowFolderCount,
    recentItems,
    refresh,
    search,
    topFolders,
  };
}

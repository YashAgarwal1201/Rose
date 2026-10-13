// src/stores/trash.ts
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import db from "@/db";
import type { Doc, Folder, Note, TodoList } from "@/db/types";
import { useToast } from "@/composables/ui/useToast";
import { useFoldersStore } from "./folders";
import { useDocsStore } from "./docs";
import { useNotesStore } from "./notes";
import { useTodosStore } from "./todos";

export type TrashableKind = "folder" | "doc" | "note" | "todoList";

export interface TrashedItem {
  id: string;
  kind: TrashableKind;
  title: string;
  originalFolderId: string | null;
  originalFolderPath: string[];
  trashedAt: number;
  childCount: number;
  daysRemaining: number;
}

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export const useTrashStore = defineStore("trash", () => {
  const trashedItems = ref<TrashedItem[]>([]);
  const trashedCount = computed(() => trashedItems.value.length);

  function calculateDaysRemaining(trashedAt: number): number {
    const elapsedMs = Math.max(0, Date.now() - trashedAt);
    const daysSinceTrashed = Math.floor(elapsedMs / (24 * 60 * 60 * 1000));
    return Math.max(0, 30 - daysSinceTrashed);
  }

  function buildOriginalFolderPath(folderId: string | null, folderMap: Map<string, Folder>): string[] {
    const path: string[] = [];
    let cursor = folderId;
    const visited = new Set<string>();
    while (cursor && !visited.has(cursor)) {
      visited.add(cursor);
      const parent = folderMap.get(cursor);
      if (!parent) {
        break;
      }
      path.unshift(parent.name);
      cursor = parent.parentId;
    }
    return path;
  }

  async function loadTrash() {
    const [allFolders, allDocs, allNotes, allLists] = await Promise.all([
      db.folders.toArray(),
      db.docs.toArray(),
      db.notes.toArray(),
      db.todoLists.toArray(),
    ]);

    const folderMap = new Map(allFolders.map((f) => [f.id, f]));

    // Count cascaded children for folders
    const childCountMap = new Map<string, number>();
    const countCascaded = (item: { trashedByFolderId?: string | null }) => {
      if (item.trashedByFolderId) {
        childCountMap.set(
          item.trashedByFolderId,
          (childCountMap.get(item.trashedByFolderId) ?? 0) + 1
        );
      }
    };
    allFolders.forEach(countCascaded);
    allDocs.forEach(countCascaded);
    allNotes.forEach(countCascaded);
    allLists.forEach(countCascaded);

    const items: TrashedItem[] = [];

    // Top-level trashed folders
    for (const folder of allFolders) {
      if (typeof folder.trashedAt === "number" && !folder.trashedByFolderId) {
        items.push({
          id: folder.id,
          kind: "folder",
          title: folder.name,
          originalFolderId: folder.parentId,
          originalFolderPath: buildOriginalFolderPath(folder.parentId, folderMap),
          trashedAt: folder.trashedAt,
          childCount: childCountMap.get(folder.id) ?? 0,
          daysRemaining: calculateDaysRemaining(folder.trashedAt),
        });
      }
    }

    // Top-level trashed docs
    for (const doc of allDocs) {
      if (typeof doc.trashedAt === "number" && !doc.trashedByFolderId) {
        items.push({
          id: doc.id,
          kind: "doc",
          title: doc.title,
          originalFolderId: doc.folderId,
          originalFolderPath: buildOriginalFolderPath(doc.folderId, folderMap),
          trashedAt: doc.trashedAt,
          childCount: 0,
          daysRemaining: calculateDaysRemaining(doc.trashedAt),
        });
      }
    }

    // Top-level trashed notes
    for (const note of allNotes) {
      if (typeof note.trashedAt === "number" && !note.trashedByFolderId) {
        items.push({
          id: note.id,
          kind: "note",
          title: note.title,
          originalFolderId: note.folderId,
          originalFolderPath: buildOriginalFolderPath(note.folderId, folderMap),
          trashedAt: note.trashedAt,
          childCount: 0,
          daysRemaining: calculateDaysRemaining(note.trashedAt),
        });
      }
    }

    // Top-level trashed todoLists
    for (const list of allLists) {
      if (typeof list.trashedAt === "number" && !list.trashedByFolderId) {
        items.push({
          id: list.id,
          kind: "todoList",
          title: list.name,
          originalFolderId: list.folderId,
          originalFolderPath: buildOriginalFolderPath(list.folderId, folderMap),
          trashedAt: list.trashedAt,
          childCount: 0,
          daysRemaining: calculateDaysRemaining(list.trashedAt),
        });
      }
    }

    // Sort by trashedAt descending (most recently trashed first)
    items.sort((a, b) => b.trashedAt - a.trashedAt);
    trashedItems.value = items;
  }

  async function reloadActiveStores() {
    const foldersStore = useFoldersStore();
    const docsStore = useDocsStore();
    const notesStore = useNotesStore();
    const todosStore = useTodosStore();

    await Promise.all([
      foldersStore.loadFolders(),
      docsStore.loadDocs(),
      notesStore.loadNotes(),
      todosStore.loadTodoLists(),
      loadTrash(),
    ]);
  }

  async function moveToTrash(kind: TrashableKind, id: string) {
    if (id === "vault") {
      throw new Error("Vaulted items cannot be moved to Trash.");
    }

    const now = Date.now();

    if (kind === "folder") {
      const folder = await db.folders.get(id);
      if (!folder) {
        return;
      }
      if (folder.isVaulted) {
        throw new Error("Vaulted items cannot be moved to Trash.");
      }

      const allFolders = await db.folders.toArray();
      const descendantFolderIds: string[] = [];
      const queue = [id];

      while (queue.length > 0) {
        const parentId = queue.shift()!;
        const children = allFolders.filter(
          (f) => f.parentId === parentId && !f.trashedAt
        );
        for (const child of children) {
          descendantFolderIds.push(child.id);
          queue.push(child.id);
        }
      }

      const allTargetFolderIds = new Set([id, ...descendantFolderIds]);

      // Cascade trash to descendant folders
      for (const descId of descendantFolderIds) {
        await db.folders.update(descId, { trashedAt: now, trashedByFolderId: id });
      }

      // Cascade trash to active docs
      const [allDocs, allNotes, allLists] = await Promise.all([
        db.docs.toArray(),
        db.notes.toArray(),
        db.todoLists.toArray(),
      ]);

      for (const doc of allDocs) {
        if (!doc.trashedAt && doc.folderId && allTargetFolderIds.has(doc.folderId)) {
          await db.docs.update(doc.id, { trashedAt: now, trashedByFolderId: id });
        }
      }

      // Cascade trash to active notes
      for (const note of allNotes) {
        if (!note.trashedAt && note.folderId && allTargetFolderIds.has(note.folderId)) {
          await db.notes.update(note.id, { trashedAt: now, trashedByFolderId: id });
        }
      }

      // Cascade trash to active todoLists
      for (const list of allLists) {
        if (!list.trashedAt && list.folderId && allTargetFolderIds.has(list.folderId)) {
          await db.todoLists.update(list.id, { trashedAt: now, trashedByFolderId: id });
        }
      }

      // Mark the folder itself
      await db.folders.update(id, { trashedAt: now, trashedByFolderId: null });
    } else if (kind === "doc") {
      const doc = await db.docs.get(id);
      if (!doc) {
        return;
      }
      if (doc.isVaulted) {
        throw new Error("Vaulted items cannot be moved to Trash.");
      }
      await db.docs.update(id, { trashedAt: now, trashedByFolderId: null });
    } else if (kind === "note") {
      const note = await db.notes.get(id);
      if (!note) {
        return;
      }
      if (note.isVaulted) {
        throw new Error("Vaulted items cannot be moved to Trash.");
      }
      await db.notes.update(id, { trashedAt: now, trashedByFolderId: null });
    } else if (kind === "todoList") {
      const list = await db.todoLists.get(id);
      if (!list) {
        return;
      }
      if (list.isVaulted) {
        throw new Error("Vaulted items cannot be moved to Trash.");
      }
      await db.todoLists.update(id, { trashedAt: now, trashedByFolderId: null });
    }

    await reloadActiveStores();
  }

  async function restoreItem(kind: TrashableKind, id: string) {
    let item: Folder | Doc | Note | TodoList | undefined;
    if (kind === "folder") {
      item = await db.folders.get(id);
    } else if (kind === "doc") {
      item = await db.docs.get(id);
    } else if (kind === "note") {
      item = await db.notes.get(id);
    } else if (kind === "todoList") {
      item = await db.todoLists.get(id);
    }

    if (!item) {
      return;
    }

    let targetFolderId = kind === "folder" ? (item as Folder).parentId : (item as Doc | Note | TodoList).folderId;
    let isOrphan = false;

    if (targetFolderId !== null) {
      const parentFolder = await db.folders.get(targetFolderId);
      if (!parentFolder || parentFolder.trashedAt) {
        isOrphan = true;
        targetFolderId = null;
      }
    }

    const currentName = "title" in item ? item.title : item.name;
    let restoredName = currentName;
    let hadCollision = false;

    // Check for name collision among active items in target folder
    const siblingNames = new Set<string>();
    if (kind === "folder") {
      const activeFolders = (await db.folders.toArray()).filter(
        (f) => !f.trashedAt && f.parentId === targetFolderId && f.id !== id
      );
      activeFolders.forEach((f) => siblingNames.add(f.name.toLowerCase()));
    } else if (kind === "doc") {
      const activeDocs = (await db.docs.toArray()).filter(
        (d) => !d.trashedAt && d.folderId === targetFolderId && d.id !== id
      );
      activeDocs.forEach((d) => siblingNames.add(d.title.toLowerCase()));
    } else if (kind === "note") {
      const activeNotes = (await db.notes.toArray()).filter(
        (n) => !n.trashedAt && n.folderId === targetFolderId && n.id !== id
      );
      activeNotes.forEach((n) => siblingNames.add(n.title.toLowerCase()));
    } else if (kind === "todoList") {
      const activeLists = (await db.todoLists.toArray()).filter(
        (l) => !l.trashedAt && l.folderId === targetFolderId && l.id !== id
      );
      activeLists.forEach((l) => siblingNames.add(l.name.toLowerCase()));
    }

    if (siblingNames.has(restoredName.toLowerCase())) {
      hadCollision = true;
      let candidate = `${currentName} (Restored)`;
      let counter = 2;
      while (siblingNames.has(candidate.toLowerCase())) {
        candidate = `${currentName} (Restored ${counter})`;
        counter++;
      }
      restoredName = candidate;
    }

    const now = Date.now();

    if (kind === "folder") {
      await db.folders.update(id, {
        trashedAt: null,
        trashedByFolderId: null,
        parentId: targetFolderId,
        name: restoredName,
        updatedAt: now,
      });

      // Restore all cascaded items where trashedByFolderId === id
      await Promise.all([
        db.folders.where("trashedByFolderId").equals(id).modify({ trashedAt: null, trashedByFolderId: null }),
        db.docs.where("trashedByFolderId").equals(id).modify({ trashedAt: null, trashedByFolderId: null }),
        db.notes.where("trashedByFolderId").equals(id).modify({ trashedAt: null, trashedByFolderId: null }),
        db.todoLists.where("trashedByFolderId").equals(id).modify({ trashedAt: null, trashedByFolderId: null }),
      ]);
    } else if (kind === "doc") {
      await db.docs.update(id, {
        trashedAt: null,
        trashedByFolderId: null,
        folderId: targetFolderId,
        title: restoredName,
        updatedAt: now,
      });
    } else if (kind === "note") {
      await db.notes.update(id, {
        trashedAt: null,
        trashedByFolderId: null,
        folderId: targetFolderId,
        title: restoredName,
        updatedAt: now,
      });
    } else if (kind === "todoList") {
      await db.todoLists.update(id, {
        trashedAt: null,
        trashedByFolderId: null,
        folderId: targetFolderId,
        name: restoredName,
        updatedAt: now,
      });
    }

    const { showToast } = useToast();
    if (isOrphan) {
      showToast(`Original folder not found. Restored to Files root.`, "info");
    } else if (hadCollision) {
      showToast(`Restored as "${restoredName}" due to name collision.`, "info");
    } else {
      showToast(`Restored "${restoredName}".`, "success");
    }

    await reloadActiveStores();
  }

  async function deleteForever(kind: TrashableKind, id: string) {
    if (kind === "folder") {
      const [cascadedFolders, cascadedLists, cascadedDocs, cascadedNotes] = await Promise.all([
        db.folders.where("trashedByFolderId").equals(id).toArray(),
        db.todoLists.where("trashedByFolderId").equals(id).toArray(),
        db.docs.where("trashedByFolderId").equals(id).toArray(),
        db.notes.where("trashedByFolderId").equals(id).toArray(),
      ]);

      const cascadedListIds = cascadedLists.map((l) => l.id);
      if (cascadedListIds.length > 0) {
        await db.todos.where("listId").anyOf(cascadedListIds).delete();
      }

      await Promise.all([
        cascadedFolders.length > 0 ? db.folders.bulkDelete(cascadedFolders.map((f) => f.id)) : Promise.resolve(),
        cascadedListIds.length > 0 ? db.todoLists.bulkDelete(cascadedListIds) : Promise.resolve(),
        cascadedDocs.length > 0 ? db.docs.bulkDelete(cascadedDocs.map((d) => d.id)) : Promise.resolve(),
        cascadedNotes.length > 0 ? db.notes.bulkDelete(cascadedNotes.map((n) => n.id)) : Promise.resolve(),
        db.folders.delete(id),
      ]);
    } else if (kind === "doc") {
      await db.docs.delete(id);
    } else if (kind === "note") {
      await db.notes.delete(id);
    } else if (kind === "todoList") {
      await db.todos.where("listId").equals(id).delete();
      await db.todoLists.delete(id);
    }

    await loadTrash();
    const { showToast } = useToast();
    showToast("Item permanently deleted.", "info");
  }

  async function emptyTrash() {
    const [allFolders, allDocs, allNotes, allLists] = await Promise.all([
      db.folders.toArray(),
      db.docs.toArray(),
      db.notes.toArray(),
      db.todoLists.toArray(),
    ]);

    const trashedFolders = allFolders.filter((f) => Boolean(f.trashedAt));
    const trashedDocs = allDocs.filter((d) => Boolean(d.trashedAt));
    const trashedNotes = allNotes.filter((n) => Boolean(n.trashedAt));
    const trashedLists = allLists.filter((l) => Boolean(l.trashedAt));
    const trashedListIds = trashedLists.map((l) => l.id);

    if (trashedListIds.length > 0) {
      await db.todos.where("listId").anyOf(trashedListIds).delete();
    }

    await Promise.all([
      trashedFolders.length > 0 ? db.folders.bulkDelete(trashedFolders.map((f) => f.id)) : Promise.resolve(),
      trashedDocs.length > 0 ? db.docs.bulkDelete(trashedDocs.map((d) => d.id)) : Promise.resolve(),
      trashedNotes.length > 0 ? db.notes.bulkDelete(trashedNotes.map((n) => n.id)) : Promise.resolve(),
      trashedListIds.length > 0 ? db.todoLists.bulkDelete(trashedListIds) : Promise.resolve(),
    ]);

    await loadTrash();
    const { showToast } = useToast();
    showToast("Trash emptied.", "info");
  }

  async function purgeExpired() {
    const cutoff = Date.now() - RETENTION_MS;
    const [allFolders, allDocs, allNotes, allLists] = await Promise.all([
      db.folders.toArray(),
      db.docs.toArray(),
      db.notes.toArray(),
      db.todoLists.toArray(),
    ]);

    const expiredFolderIds = new Set(
      allFolders.filter((f) => typeof f.trashedAt === "number" && f.trashedAt < cutoff).map((f) => f.id)
    );

    const expiredLists = allLists.filter(
      (l) => (typeof l.trashedAt === "number" && l.trashedAt < cutoff) || (!!l.trashedByFolderId && expiredFolderIds.has(l.trashedByFolderId))
    );
    const expiredListIds = expiredLists.map((l) => l.id);

    if (expiredListIds.length > 0) {
      await db.todos.where("listId").anyOf(expiredListIds).delete();
    }

    const expiredFolders = allFolders.filter(
      (f) => (typeof f.trashedAt === "number" && f.trashedAt < cutoff) || (!!f.trashedByFolderId && expiredFolderIds.has(f.trashedByFolderId))
    );
    const expiredDocs = allDocs.filter(
      (d) => (typeof d.trashedAt === "number" && d.trashedAt < cutoff) || (!!d.trashedByFolderId && expiredFolderIds.has(d.trashedByFolderId))
    );
    const expiredNotes = allNotes.filter(
      (n) => (typeof n.trashedAt === "number" && n.trashedAt < cutoff) || (!!n.trashedByFolderId && expiredFolderIds.has(n.trashedByFolderId))
    );

    await Promise.all([
      expiredFolders.length > 0 ? db.folders.bulkDelete(expiredFolders.map((f) => f.id)) : Promise.resolve(),
      expiredDocs.length > 0 ? db.docs.bulkDelete(expiredDocs.map((d) => d.id)) : Promise.resolve(),
      expiredNotes.length > 0 ? db.notes.bulkDelete(expiredNotes.map((n) => n.id)) : Promise.resolve(),
      expiredListIds.length > 0 ? db.todoLists.bulkDelete(expiredListIds) : Promise.resolve(),
    ]);

    await loadTrash();
  }

  return {
    deleteForever,
    emptyTrash,
    loadTrash,
    moveToTrash,
    purgeExpired,
    restoreItem,
    trashedCount,
    trashedItems,
  };
});

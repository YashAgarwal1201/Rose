<!-- src/views/files/FilesView.vue -->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { FoldersIcon } from "@lucide/vue";
import FolderTree from "@/components/explorer/FolderTree.vue";
import MixedExplorerGrid, { type DisplayItem, type ItemKind } from "@/components/explorer/MixedExplorerGrid.vue";
import Breadcrumbs from "@/components/ui/Breadcrumbs.vue";
import FolderTreeDrawer from "@/components/explorer/FolderTreeDrawer.vue";
import MixedExplorerActions from "@/components/explorer/MixedExplorerActions.vue";
import type { Crumb } from "@/types/explorer";
import { useFoldersStore } from "@/stores/folders";
import { useTodosStore } from "@/stores/todos";
import { useDocsStore } from "@/stores/docs";
import { useNotesStore } from "@/stores/notes";
import { useToast } from "@/composables/ui/useToast.ts";
import { useKeyboardShortcuts } from "@/composables/app/useKeyboardShortcuts.ts";

const { pathMatch } = defineProps<{ pathMatch?: string[] }>();

const router = useRouter();
const foldersStore = useFoldersStore();
const todosStore = useTodosStore();
const docsStore = useDocsStore();
const notesStore = useNotesStore();
const { showToast } = useToast();

const isDrawerOpen = ref(false);
const listItemCounts = ref<Record<string, number>>({});
const explorerGridRef = ref<InstanceType<typeof MixedExplorerGrid> | null>(null);
let activeLoadToken = 0;

const filterMode = ref<"all" | "doc" | "note" | "todo">("all");

const segments = computed(() => pathMatch ?? []);

function resolveFolderId(segs: string[]): string | null | undefined {
  let cursor: string | null = null;
  for (const segment of segs) {
    const match = foldersStore.folders.find(
      (folder) =>
        folder.parentId === cursor &&
        folder.name.toLowerCase() === segment.toLowerCase(),
    );
    if (!match) {
      return undefined;
    }
    cursor = match.id;
  }
  return cursor;
}

function buildFolderPath(folderId: string | null): string[] {
  const path: string[] = [];
  let cursor = folderId;
  while (cursor !== null) {
    const folder = foldersStore.folders.find((candidate) => candidate.id === cursor);
    if (!folder) {
      break;
    }
    path.unshift(folder.name);
    cursor = folder.parentId;
  }
  return path;
}

const currentFolderId = computed<string | null | undefined>(() => resolveFolderId(segments.value));

const subfolders = computed(() => {
  if (currentFolderId.value === undefined) {
    return [];
  }
  return foldersStore.folders.filter((folder) => folder.parentId === currentFolderId.value);
});

const visibleLists = computed(() => {
  if (currentFolderId.value === undefined) {
    return [];
  }
  return todosStore.todoLists.filter((list) => list.folderId === currentFolderId.value);
});

const visibleDocs = computed(() => {
  if (currentFolderId.value === undefined) {
    return [];
  }
  return docsStore.docs.filter((doc) => doc.folderId === currentFolderId.value);
});

const visibleNotes = computed(() => {
  if (currentFolderId.value === undefined) {
    return [];
  }
  return notesStore.notes.filter((note) => note.folderId === currentFolderId.value);
});

const crumbs = computed<Crumb[]>(() => {
  if (currentFolderId.value === undefined || currentFolderId.value === null) {
    return [];
  }
  const chain: Crumb[] = [];
  let cursor: string | null = currentFolderId.value;
  while (cursor !== null) {
    const folder = foldersStore.folders.find((candidate) => candidate.id === cursor);
    if (!folder) {
      break;
    }
    chain.unshift({ id: folder.id, name: folder.name });
    cursor = folder.parentId;
  }
  return chain;
});

function countChildrenOf(folderId: string): number {
  const subfolderCount = foldersStore.folders.filter(
    (folder) => folder.parentId === folderId,
  ).length;
  const listCount = todosStore.todoLists.filter((list) => list.folderId === folderId).length;
  const docCount = docsStore.docs.filter((doc) => doc.folderId === folderId).length;
  const noteCount = notesStore.notes.filter((note) => note.folderId === folderId).length;
  return subfolderCount + listCount + docCount + noteCount;
}

async function loadListItemCounts() {
  const entries = await Promise.all(
    visibleLists.value.map(
      async (list) => [list.id, await todosStore.getTodoCountForList(list.id)] as const,
    ),
  );
  listItemCounts.value = Object.fromEntries(entries);
}

async function loadCurrentFolder() {
  const token = ++activeLoadToken;
  try {
    await foldersStore.loadFolders();
    await todosStore.loadTodoLists();
    await docsStore.loadDocs();
    await notesStore.loadNotes();
  } catch (error) {
    if (token === activeLoadToken) {
      showToast((error as Error).message, "error");
    }
    return;
  }

  if (token !== activeLoadToken) {
    return;
  }

  const resolved = resolveFolderId(segments.value);
  if (resolved === undefined) {
    showToast("That folder no longer exists.", "error");
    router.replace("/files/folder");
    return;
  }
  await loadListItemCounts();
}

function navigateToFolder(id: string | null) {
  router.push({ name: "files-folder", params: { pathMatch: buildFolderPath(id) } });
}

function openItem(kind: ItemKind, id: string) {
  if (kind === "folder") {
    const folder = foldersStore.folders.find((candidate) => candidate.id === id);
    if (folder) {
      router.push({ name: "files-folder", params: { pathMatch: buildFolderPath(id) } });
    }
  } else if (kind === "doc") {
    const doc = docsStore.docs.find((candidate) => candidate.id === id);
    if (doc) {
      router.push({
        name: "files-doc",
        params: { pathMatch: [...buildFolderPath(doc.folderId), doc.title] },
      });
    }
  } else if (kind === "note") {
    const note = notesStore.notes.find((candidate) => candidate.id === id);
    if (note) {
      router.push({
        name: "files-note",
        params: { pathMatch: [...buildFolderPath(note.folderId), note.title] },
      });
    }
  } else if (kind === "todo") {
    const list = todosStore.todoLists.find((candidate) => candidate.id === id);
    if (list) {
      router.push({
        name: "files-list",
        params: { pathMatch: [...buildFolderPath(list.folderId), list.name] },
      });
    }
  }
}

async function handleCreateItem(kind: ItemKind, name: string) {
  try {
    if (kind === "folder") {
      await foldersStore.createFolder(name, currentFolderId.value ?? null, "mixed");
    } else if (kind === "todo") {
      await todosStore.createTodoList(name, currentFolderId.value ?? null);
      await loadListItemCounts();
    } else if (kind === "doc") {
      await docsStore.createDoc(name, currentFolderId.value ?? null);
    } else if (kind === "note") {
      const id = await notesStore.createNote(name, currentFolderId.value ?? null);
      openItem("note", id);
    }
  } catch (error) {
    showToast((error as Error).message, "error");
  }
}

async function handleRenameItem(kind: ItemKind, id: string, name: string) {
  try {
    if (kind === "folder") {
      await foldersStore.renameFolder(id, name);
      if (id === currentFolderId.value) {
        navigateToFolder(id);
      }
    } else if (kind === "todo") {
      await todosStore.renameTodoList(id, name);
    } else if (kind === "doc") {
      await docsStore.updateDoc(id, { title: name.trim() || "Untitled" });
      await docsStore.loadDocs();
    } else if (kind === "note") {
      await notesStore.updateNote(id, { title: name.trim() || "Untitled" });
      await notesStore.loadNotes();
    }
  } catch (error) {
    showToast((error as Error).message, "error");
  }
}

async function handleDeleteItem(kind: ItemKind, id: string) {
  try {
    if (kind === "folder") {
      await foldersStore.deleteFolder(id);
    } else if (kind === "todo") {
      await todosStore.deleteTodoList(id);
      await loadListItemCounts();
    } else if (kind === "doc") {
      await docsStore.deleteDoc(id);
    } else if (kind === "note") {
      await notesStore.deleteNote(id);
    }
  } catch (error) {
    showToast((error as Error).message, "error");
  }
}

function handleMobileSelect(id: string | null) {
  navigateToFolder(id);
  isDrawerOpen.value = false;
}

const displayItems = computed<DisplayItem[]>(() => {
  const items: DisplayItem[] = [];
  if (filterMode.value === "all") {
    for (const f of subfolders.value) {
      items.push({
        id: f.id,
        name: f.name,
        kind: "folder",
        itemCount: countChildrenOf(f.id),
        updatedAt: f.updatedAt,
        createdAt: f.createdAt,
      });
    }
  }
  if (filterMode.value === "all" || filterMode.value === "todo") {
    for (const l of visibleLists.value) {
      items.push({
        id: l.id,
        name: l.name,
        kind: "todo",
        itemCount: listItemCounts.value[l.id] ?? 0,
        updatedAt: l.updatedAt,
        createdAt: l.createdAt,
      });
    }
  }
  if (filterMode.value === "all" || filterMode.value === "doc") {
    for (const d of visibleDocs.value) {
      items.push({
        id: d.id,
        name: d.title,
        kind: "doc",
        updatedAt: d.updatedAt,
        createdAt: d.createdAt,
      });
    }
  }
  if (filterMode.value === "all" || filterMode.value === "note") {
    for (const n of visibleNotes.value) {
      items.push({
        id: n.id,
        name: n.title,
        kind: "note",
        thumbnail: n.thumbnail,
        updatedAt: n.updatedAt,
        createdAt: n.createdAt,
      });
    }
  }
  return items;
});

onMounted(loadCurrentFolder);
watch(() => pathMatch, loadCurrentFolder);

useKeyboardShortcuts([
  {
    key: "f",
    ctrl: true,
    shift: true,
    handler: () => explorerGridRef.value?.startCreate("folder"),
  },
  {
    key: "d",
    ctrl: true,
    shift: true,
    handler: () => explorerGridRef.value?.startCreate("doc"),
  },
  {
    key: "n",
    ctrl: true,
    shift: true,
    handler: () => explorerGridRef.value?.startCreate("note"),
  },
  {
    key: "l",
    ctrl: true,
    shift: true,
    handler: () => explorerGridRef.value?.startCreate("todo"),
  },
]);
</script>
<template>
  <div class="flex h-full relative">
    <aside class="hidden md:block w-64 border-r border-rose-border p-4 overflow-y-auto shrink-0">
      <h2 class="text-lg font-semibold text-rose-text mb-3">Folders</h2>
      <FolderTree
        :active-folder-id="currentFolderId ?? null"
        @select="navigateToFolder"
      />
    </aside>

    <FolderTreeDrawer :is-open="isDrawerOpen" @close="isDrawerOpen = false">
      <FolderTree
        :active-folder-id="currentFolderId ?? null"
        @select="handleMobileSelect"
      />
    </FolderTreeDrawer>

    <main class="flex-1 p-4 md:p-6 overflow-y-auto min-w-0 pb-28 md:pb-6">
      <div class="flex items-center justify-between gap-2 mb-4">
        <h1 class="text-2xl font-bold text-rose-text">Files</h1>
        
        <div class="flex items-center gap-2">
          <!-- Filter pills for large screens -->
          <div class="hidden md:flex items-center gap-1 bg-rose-surface-alt p-1 rounded-lg">
            <button
              class="px-3 py-1 rounded-md text-sm font-medium transition-colors"
              :class="filterMode === 'all' ? 'bg-rose-surface shadow text-rose-text' : 'text-rose-text-muted hover:text-rose-text'"
              @click="filterMode = 'all'"
            >
              All
            </button>
            <button
              class="px-3 py-1 rounded-md text-sm font-medium transition-colors"
              :class="filterMode === 'doc' ? 'bg-rose-surface shadow text-rose-text' : 'text-rose-text-muted hover:text-rose-text'"
              @click="filterMode = 'doc'"
            >
              Docs
            </button>
            <button
              class="px-3 py-1 rounded-md text-sm font-medium transition-colors"
              :class="filterMode === 'note' ? 'bg-rose-surface shadow text-rose-text' : 'text-rose-text-muted hover:text-rose-text'"
              @click="filterMode = 'note'"
            >
              Notes
            </button>
            <button
              class="px-3 py-1 rounded-md text-sm font-medium transition-colors"
              :class="filterMode === 'todo' ? 'bg-rose-surface shadow text-rose-text' : 'text-rose-text-muted hover:text-rose-text'"
              @click="filterMode = 'todo'"
            >
              Lists
            </button>
          </div>

          <button
            class="md:hidden flex items-center gap-2 px-3 py-2 rounded-md bg-rose-surface-alt text-rose-text text-base shrink-0"
            @click="isDrawerOpen = true"
          >
            <FoldersIcon class="w-4 h-4" />
          </button>
          <MixedExplorerActions
            @create-folder="explorerGridRef?.startCreate('folder')"
            @create-todo="explorerGridRef?.startCreate('todo')"
            @create-note="explorerGridRef?.startCreate('note')"
            @create-doc="explorerGridRef?.startCreate('doc')"
          />
        </div>
      </div>
      <Breadcrumbs :crumbs="crumbs" @navigate="navigateToFolder" />
      <MixedExplorerGrid
        ref="explorerGridRef"
        :items="displayItems"
        @open-item="openItem"
        @create-item="handleCreateItem"
        @rename-item="handleRenameItem"
        @delete-item="handleDeleteItem"
      />
    </main>
    <!-- Mobile floating filter pills -->
    <div class="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
      <div class="flex items-center gap-1 bg-rose-surface/80 backdrop-blur-md p-1.5 rounded-full shadow-lg border border-rose-border">
        <button
          class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
          :class="filterMode === 'all' ? 'bg-rose-primary text-white shadow' : 'text-rose-text hover:bg-rose-surface-alt'"
          @click="filterMode = 'all'"
        >
          All
        </button>
        <button
          class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
          :class="filterMode === 'doc' ? 'bg-rose-primary text-white shadow' : 'text-rose-text hover:bg-rose-surface-alt'"
          @click="filterMode = 'doc'"
        >
          Docs
        </button>
        <button
          class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
          :class="filterMode === 'note' ? 'bg-rose-primary text-white shadow' : 'text-rose-text hover:bg-rose-surface-alt'"
          @click="filterMode = 'note'"
        >
          Notes
        </button>
        <button
          class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
          :class="filterMode === 'todo' ? 'bg-rose-primary text-white shadow' : 'text-rose-text hover:bg-rose-surface-alt'"
          @click="filterMode = 'todo'"
        >
          Lists
        </button>
      </div>
    </div>
  </div>
</template>

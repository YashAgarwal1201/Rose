<!-- src/views/NotesView.vue -->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { FoldersIcon, PenLineIcon } from "@lucide/vue";
import FolderTree from "../components/FolderTree.vue";
import ExplorerGrid from "../components/ExplorerGrid.vue";
import Breadcrumbs from "../components/Breadcrumbs.vue";
import FolderTreeDrawer from "../components/FolderTreeDrawer.vue";
import ExplorerActions from "../components/ExplorerActions.vue";
import type { Crumb } from "../types/explorer";
import { useFoldersStore } from "../stores/folders";
import { useNotesStore } from "../stores/notes";
import { useToast } from "../composables/useToast";
import { useKeyboardShortcuts } from "../composables/useKeyboardShortcuts";

const { pathMatch } = defineProps<{ pathMatch?: string[] }>();

const router = useRouter();
const foldersStore = useFoldersStore();
const notesStore = useNotesStore();
const { showToast } = useToast();

const isDrawerOpen = ref(false);
const explorerGridRef = ref<InstanceType<typeof ExplorerGrid> | null>(null);
let activeLoadToken = 0;

const segments = computed(() => pathMatch ?? []);

function resolveFolderId(segs: string[]): string | null | undefined {
  let cursor: string | null = null;
  for (const segment of segs) {
    const match = foldersStore.folders.find(
      (folder) =>
        folder.parentId === cursor &&
        folder.type === "note" &&
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
  const noteCount = notesStore.notes.filter((note) => note.folderId === folderId).length;
  return subfolderCount + noteCount;
}

async function loadCurrentFolder() {
  const token = ++activeLoadToken;
  try {
    await foldersStore.loadFolders("note");
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
    router.replace("/notes/folder");
  }
}

function navigateToFolder(id: string | null) {
  router.push({ name: "notes-folder", params: { pathMatch: buildFolderPath(id) } });
}

function openNote(id: string) {
  const note = notesStore.notes.find((candidate) => candidate.id === id);
  if (!note) {
    return;
  }
  router.push({
    name: "notes-note",
    params: { pathMatch: [...buildFolderPath(note.folderId), note.title] },
  });
}

async function handleCreateFolder(name: string) {
  try {
    await foldersStore.createFolder(name, currentFolderId.value ?? null, "note");
  } catch (error) {
    showToast((error as Error).message, "error");
  }
}

async function handleRenameFolder(id: string, name: string) {
  try {
    await foldersStore.renameFolder(id, name);
    if (id === currentFolderId.value) {
      navigateToFolder(id);
    }
  } catch (error) {
    showToast((error as Error).message, "error");
  }
}

async function handleDeleteFolder(id: string) {
  try {
    await foldersStore.deleteFolder(id);
  } catch (error) {
    showToast((error as Error).message, "error");
  }
}

async function handleCreateFile(name: string) {
  try {
    const id = await notesStore.createNote(name, currentFolderId.value ?? null);
    openNote(id);
  } catch (error) {
    showToast((error as Error).message, "error");
  }
}

async function handleRenameFile(id: string, name: string) {
  try {
    await notesStore.updateNote(id, { title: name.trim() || "Untitled" });
    await notesStore.loadNotes();
  } catch (error) {
    showToast((error as Error).message, "error");
  }
}

async function handleDeleteFile(id: string) {
  try {
    await notesStore.deleteNote(id);
  } catch (error) {
    showToast((error as Error).message, "error");
  }
}

function handleMobileSelect(id: string | null) {
  navigateToFolder(id);
  isDrawerOpen.value = false;
}

onMounted(loadCurrentFolder);
watch(() => pathMatch, loadCurrentFolder);

// Ctrl+Shift+F → new folder, Ctrl+Shift+E → new note
useKeyboardShortcuts([
  {
    key: "f",
    ctrl: true,
    shift: true,
    handler: () => {
      explorerGridRef.value?.startCreate("folder");
    },
  },
  {
    key: "e",
    ctrl: true,
    shift: true,
    handler: () => {
      explorerGridRef.value?.startCreate("file");
    },
  },
]);
</script>

<template>
  <div class="flex h-full">
    <aside class="hidden md:block w-64 border-r border-rose-border p-4 overflow-y-auto shrink-0">
      <h2 class="text-lg font-semibold text-rose-text mb-3">Folders</h2>
      <FolderTree
        type="note"
        :active-folder-id="currentFolderId ?? null"
        @select="navigateToFolder"
      />
    </aside>

    <FolderTreeDrawer :is-open="isDrawerOpen" @close="isDrawerOpen = false">
      <FolderTree
        type="note"
        :active-folder-id="currentFolderId ?? null"
        @select="handleMobileSelect"
      />
    </FolderTreeDrawer>

    <main class="flex-1 p-4 md:p-6 overflow-y-auto min-w-0">
      <div class="flex items-center justify-between gap-2 mb-4">
        <h1 class="text-2xl font-bold text-rose-text">Notes</h1>
        <div class="flex items-center gap-2">
          <button
            class="md:hidden flex items-center gap-2 px-3 py-2 rounded-md bg-rose-surface-alt text-rose-text text-base shrink-0"
            @click="isDrawerOpen = true"
          >
            <FoldersIcon class="w-4 h-4" />
          </button>
          <ExplorerActions
            file-label="note"
            @create-folder="explorerGridRef?.startCreate('folder')"
            @create-file="explorerGridRef?.startCreate('file')"
          />
        </div>
      </div>
      <Breadcrumbs :crumbs="crumbs" @navigate="navigateToFolder" />
      <ExplorerGrid
        ref="explorerGridRef"
        :folders="
          subfolders.map((f) => ({
            id: f.id,
            name: f.name,
            itemCount: countChildrenOf(f.id),
            updatedAt: f.updatedAt,
            createdAt: f.createdAt,
          }))
        "
        :files="
          visibleNotes.map((n) => ({
            id: n.id,
            name: n.title,
            updatedAt: n.updatedAt,
            createdAt: n.createdAt,
            thumbnail: n.thumbnail,
          }))
        "
        :file-icon="PenLineIcon"
        file-label="note"
        @open-folder="navigateToFolder"
        @open-file="openNote"
        @create-folder="handleCreateFolder"
        @rename-folder="handleRenameFolder"
        @delete-folder="handleDeleteFolder"
        @create-file="handleCreateFile"
        @rename-file="handleRenameFile"
        @delete-file="handleDeleteFile"
      />
    </main>
  </div>
</template>

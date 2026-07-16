<!-- src/views/TodosView.vue -->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { FoldersIcon, ListTodoIcon } from "@lucide/vue";
import FolderTree from "../components/FolderTree.vue";
import ExplorerGrid from "../components/ExplorerGrid.vue";
import Breadcrumbs from "../components/Breadcrumbs.vue";
import FolderTreeDrawer from "../components/FolderTreeDrawer.vue";
import ExplorerActions from "../components/ExplorerActions.vue";
import type { Crumb } from "../types/explorer";
import { useFoldersStore } from "../stores/folders";
import { useTodosStore } from "../stores/todos";
import { useToast } from "../composables/useToast";

const { pathMatch } = defineProps<{ pathMatch?: string[] }>();

const router = useRouter();
const foldersStore = useFoldersStore();
const todosStore = useTodosStore();
const { showToast } = useToast();

const isDrawerOpen = ref(false);
const listItemCounts = ref<Record<string, number>>({});
const explorerGridRef = ref<InstanceType<typeof ExplorerGrid> | null>(null);
let activeLoadToken = 0;

const segments = computed(() => pathMatch ?? []);

// Returns `null` for the root folder, a folder id if resolved, or `undefined` if the path segments don't match any real folder.
function resolveFolderId(segs: string[]): string | null | undefined {
  let cursor: string | null = null;
  for (const segment of segs) {
    const match = foldersStore.folders.find(
      (folder) =>
        folder.parentId === cursor &&
        folder.type === "todo" &&
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
  return subfolderCount + listCount;
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
    await foldersStore.loadFolders("todo");
    await todosStore.loadTodoLists();
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
    router.replace("/todos/folder");
    return;
  }
  await loadListItemCounts();
}

function navigateToFolder(id: string | null) {
  router.push({ name: "todos-folder", params: { pathMatch: buildFolderPath(id) } });
}

function openList(id: string) {
  const list = todosStore.todoLists.find((candidate) => candidate.id === id);
  if (!list) {
    return;
  }
  router.push({
    name: "todos-list",
    params: { pathMatch: [...buildFolderPath(list.folderId), list.name] },
  });
}

async function handleCreateFolder(name: string) {
  try {
    await foldersStore.createFolder(name, currentFolderId.value ?? null, "todo");
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
    await todosStore.createTodoList(name, currentFolderId.value ?? null);
    await loadListItemCounts();
  } catch (error) {
    showToast((error as Error).message, "error");
  }
}

async function handleRenameFile(id: string, name: string) {
  try {
    await todosStore.renameTodoList(id, name);
  } catch (error) {
    showToast((error as Error).message, "error");
  }
}

async function handleDeleteFile(id: string) {
  try {
    await todosStore.deleteTodoList(id);
    await loadListItemCounts();
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
</script>
<template>
  <div class="flex h-full">
    <aside class="hidden md:block w-64 border-r border-rose-border p-4 overflow-y-auto shrink-0">
      <h2 class="text-lg font-semibold text-rose-text mb-3">Folders</h2>
      <FolderTree
        type="todo"
        :active-folder-id="currentFolderId ?? null"
        @select="navigateToFolder"
      />
    </aside>

    <FolderTreeDrawer :is-open="isDrawerOpen" @close="isDrawerOpen = false">
      <FolderTree
        type="todo"
        :active-folder-id="currentFolderId ?? null"
        @select="handleMobileSelect"
      />
    </FolderTreeDrawer>

    <main class="flex-1 p-4 md:p-6 overflow-y-auto min-w-0">
      <div class="flex items-center justify-between gap-2 mb-4">
        <h1 class="text-2xl font-bold text-rose-text">Todos</h1>
        <!-- <button
          class="md:hidden flex items-center gap-2 px-3 py-2 rounded-md bg-rose-surface-alt text-rose-text text-base shrink-0"
          @click="isDrawerOpen = true"
        >
          <FolderIcon class="w-4 h-4" /> Folders
        </button> -->

        <div class="flex items-center gap-2">
          <button
            class="md:hidden flex items-center gap-2 px-3 py-2 rounded-md bg-rose-surface-alt text-rose-text text-base shrink-0"
            @click="isDrawerOpen = true"
          >
            <FoldersIcon class="w-4 h-4" />
          </button>
          <ExplorerActions
            file-label="list"
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
          visibleLists.map((l) => ({
            id: l.id,
            name: l.name,
            itemCount: listItemCounts[l.id] ?? 0,
            updatedAt: l.updatedAt,
            createdAt: l.createdAt,
          }))
        "
        :file-icon="ListTodoIcon"
        file-label="list"
        @open-folder="navigateToFolder"
        @open-file="openList"
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

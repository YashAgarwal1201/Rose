<!-- src/views/todos/TodosView.vue -->
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ListTodoIcon } from "@lucide/vue";
import ExplorerGrid from "@/components/explorer/ExplorerGrid.vue";
import { useTodosStore } from "@/stores/todos";
import { useFoldersStore } from "@/stores/folders";
import { useToast } from "@/composables/ui/useToast.ts";

const router = useRouter();
const todosStore = useTodosStore();
const foldersStore = useFoldersStore();
const { showToast } = useToast();

const explorerGridRef = ref<InstanceType<typeof ExplorerGrid> | null>(null);
const listItemCounts = ref<Record<string, number>>({});

async function loadListItemCounts() {
  const entries = await Promise.all(
    todosStore.todoLists.map(
      async (list) => [list.id, await todosStore.getTodoCountForList(list.id)] as const,
    ),
  );
  listItemCounts.value = Object.fromEntries(entries);
}

async function loadLists() {
  try {
    await todosStore.loadTodoLists();
    await loadListItemCounts();
  } catch (error) {
    showToast((error as Error).message, "error");
  }
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

function openList(id: string) {
  const list = todosStore.todoLists.find((candidate) => candidate.id === id);
  if (!list) { return; }
  router.push({
    name: "files-list",
    params: { pathMatch: [...buildFolderPath(list.folderId), list.name] },
  });
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

onMounted(async () => {
  await foldersStore.loadFolders();
  loadLists();
});
</script>

<template>
  <div class="flex h-full">
    <main class="flex-1 p-4 md:p-6 overflow-y-auto min-w-0">
      <div class="flex items-center justify-between gap-2 mb-8">
        <h1 class="text-2xl font-bold text-rose-text">Todos</h1>
      </div>

      <ExplorerGrid ref="explorerGridRef" :folders="[]" :files="todosStore.todoLists.map((l) => ({
        id: l.id,
        name: l.name,
        itemCount: listItemCounts[l.id] ?? 0,
        updatedAt: l.updatedAt,
        createdAt: l.createdAt,
      }))
        " :file-icon="ListTodoIcon" file-label="list" @open-file="openList" @rename-file="handleRenameFile"
        @delete-file="handleDeleteFile" />
    </main>
  </div>
</template>

<!-- src/views/todos/TodosView.vue -->
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ListTodoIcon } from "@lucide/vue";
import ExplorerGrid from "@/components/explorer/ExplorerGrid.vue";
import ExplorerActions from "@/components/explorer/ExplorerActions.vue";
import { useTodosStore } from "@/stores/todos";
import { useToast } from "@/composables/ui/useToast.ts";
import { useKeyboardShortcuts } from "@/composables/app/useKeyboardShortcuts.ts";

const router = useRouter();
const todosStore = useTodosStore();
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

function openList(id: string) {
  const list = todosStore.todoLists.find((candidate) => candidate.id === id);
  if (!list) return;
  router.push({
    name: "files-list",
    params: { pathMatch: [list.name] },
  });
}

async function handleCreateFile(name: string) {
  try {
    const newId = await todosStore.createTodoList(name, null);
    await loadListItemCounts();
    openList(newId);
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

onMounted(() => {
  loadLists();
});

useKeyboardShortcuts([
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
    <main class="flex-1 p-4 md:p-6 overflow-y-auto min-w-0 max-w-5xl mx-auto">
      <div class="flex items-center justify-between gap-2 mb-8">
        <h1 class="text-2xl font-bold text-rose-text">Todos</h1>
        <ExplorerActions
          file-label="list"
          :hide-folders="true"
          @create-file="explorerGridRef?.startCreate('file')"
        />
      </div>

      <ExplorerGrid
        ref="explorerGridRef"
        :folders="[]"
        :files="
          todosStore.todoLists.map((l) => ({
            id: l.id,
            name: l.name,
            itemCount: listItemCounts[l.id] ?? 0,
            updatedAt: l.updatedAt,
            createdAt: l.createdAt,
          }))
        "
        :file-icon="ListTodoIcon"
        file-label="list"
        @open-file="openList"
        @create-file="handleCreateFile"
        @rename-file="handleRenameFile"
        @delete-file="handleDeleteFile"
      />
    </main>
  </div>
</template>

<!-- src/views/TodoListView.vue -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowLeftIcon,
  CalendarIcon,
  InfoIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "@lucide/vue";
import { useTodosStore } from "../stores/todos";
import { useFoldersStore } from "../stores/folders";
import { useConfirm } from "../composables/useConfirm";
import { useToast } from "../composables/useToast";
import { formatRelativeTime } from "../utils/formatRelativeTime";
import type { Todo, TodoList } from "../db/types";

const MENU_WIDTH_PX = 220;
const MENU_OFFSET_PX = 6;

const { pathMatch } = defineProps<{ pathMatch?: string[] }>();

const router = useRouter();
const todosStore = useTodosStore();
const foldersStore = useFoldersStore();
const { confirm } = useConfirm();
const { showToast } = useToast();

const segments = computed(() => pathMatch ?? []);

const currentList = ref<TodoList | undefined>(undefined);
const isRenaming = ref(false);
const renameValue = ref("");
const newTodoTitle = ref("");
const editingId = ref<string | null>(null);
const editingTitle = ref("");
const openMenuTodoId = ref<string | null>(null);
const menuStyle = ref({ left: "0px", top: "0px" });
const isInfoOpen = ref(false);
let activeLoadToken = 0;

const priorityOptions: { value: Todo["priority"]; label: string }[] = [
  { label: "None", value: null },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

const totalCount = computed(() => todosStore.todos.length);
const completedCount = computed(() => todosStore.todos.filter((todo) => todo.done).length);
const pendingCount = computed(() => totalCount.value - completedCount.value);

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

function dateInputValue(dueDate: number | null): string {
  if (!dueDate) {
    return "";
  }
  return new Date(dueDate).toISOString().slice(0, 10);
}

async function loadList() {
  const token = ++activeLoadToken;
  try {
    await foldersStore.loadFolders("todo");
  } catch (error) {
    if (token === activeLoadToken) {
      showToast((error as Error).message, "error");
    }
    return;
  }

  const segs = segments.value;
  if (segs.length === 0) {
    showToast("List not found.", "error");
    router.replace("/todos/folder");
    return;
  }
  const folderSegments = segs.slice(0, -1);
  const listName = segs[segs.length - 1];
  const folderId = resolveFolderId(folderSegments);

  if (folderId === undefined) {
    showToast("That list no longer exists.", "error");
    router.replace("/todos/folder");
    return;
  }

  try {
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

  const match = todosStore.todoLists.find(
    (list) => list.folderId === folderId && list.name.toLowerCase() === listName?.toLowerCase(),
  );

  if (!match) {
    showToast("That list no longer exists.", "error");
    router.replace({ name: "todos-folder", params: { pathMatch: buildFolderPath(folderId) } });
    return;
  }

  currentList.value = match;
  todosStore.touchTodoList(match.id);
  try {
    await todosStore.loadTodos(match.id);
  } catch (error) {
    if (token === activeLoadToken) {
      showToast((error as Error).message, "error");
    }
  }
}

function goBack() {
  if (!currentList.value) {
    router.push("/todos/folder");
    return;
  }
  router.push({
    name: "todos-folder",
    params: { pathMatch: buildFolderPath(currentList.value.folderId) },
  });
}

function startRenameList() {
  isRenaming.value = true;
  renameValue.value = currentList.value?.name ?? "";
}

async function confirmRenameList() {
  const name = renameValue.value.trim();
  if (name && currentList.value?.id) {
    try {
      await todosStore.renameTodoList(currentList.value.id, name);
      const updated = await todosStore.getTodoList(currentList.value.id);
      currentList.value = updated;
      if (updated) {
        router.replace({
          name: "todos-list",
          params: { pathMatch: [...buildFolderPath(updated.folderId), updated.name] },
        });
      }
    } catch (error) {
      showToast((error as Error).message, "error");
    }
  }
  isRenaming.value = false;
}

function cancelRenameList() {
  isRenaming.value = false;
}

async function handleCreateTodo() {
  if (!currentList.value) {
    return;
  }
  const title = newTodoTitle.value.trim();
  if (!title) {
    return;
  }
  try {
    await todosStore.createTodo(title, currentList.value.id);
    newTodoTitle.value = "";
  } catch (error) {
    showToast((error as Error).message, "error");
  }
}

async function handleDeleteTodo(id: string, title: string) {
  const confirmed = await confirm({
    confirmLabel: "Delete",
    message: `Delete "${title}"?`,
    title: "Delete todo",
  });
  if (!confirmed) {
    return;
  }
  try {
    await todosStore.deleteTodo(id);
    showToast(`Deleted "${title}"`, "info");
  } catch (error) {
    showToast((error as Error).message, "error");
  }
}

function startEdit(id: string, currentTitle: string) {
  editingId.value = id;
  editingTitle.value = currentTitle;
}

async function confirmEdit() {
  if (editingId.value === null) {
    return;
  }
  const title = editingTitle.value.trim();
  if (title) {
    try {
      await todosStore.updateTodo(editingId.value, { title });
    } catch (error) {
      showToast((error as Error).message, "error");
    }
  }
  editingId.value = null;
}

function cancelEdit() {
  editingId.value = null;
}

function openTodoMenu(id: string, event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  menuStyle.value = {
    left: `${Math.min(rect.left, globalThis.innerWidth - MENU_WIDTH_PX)}px`,
    top: `${rect.bottom + MENU_OFFSET_PX}px`,
  };
  openMenuTodoId.value = openMenuTodoId.value === id ? null : id;
}

function closeTodoMenu() {
  openMenuTodoId.value = null;
}

async function setPriority(id: string, priority: Todo["priority"]) {
  try {
    await todosStore.updateTodo(id, { priority });
  } catch (error) {
    showToast((error as Error).message, "error");
  }
}

async function setDueDate(id: string, value: string) {
  const timestamp = value ? new Date(value).getTime() : null;
  try {
    await todosStore.updateTodo(id, { dueDate: timestamp });
  } catch (error) {
    showToast((error as Error).message, "error");
  }
}

function handleMenuEdit(todo: Todo) {
  closeTodoMenu();
  startEdit(todo.id, todo.title);
}

async function handleMenuDelete(todo: Todo) {
  closeTodoMenu();
  await handleDeleteTodo(todo.id, todo.title);
}

function handleOutsideMenuClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest("[data-todo-menu]") && !target.closest("[data-todo-menu-trigger]")) {
    closeTodoMenu();
  }
}

onMounted(loadList);
onMounted(() => {
  document.addEventListener("click", handleOutsideMenuClick);
});
onUnmounted(() => {
  document.removeEventListener("click", handleOutsideMenuClick);
});
watch(() => pathMatch, loadList);
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-4 md:p-6 pb-28 md:pb-6">
      <button
        class="flex items-center gap-1.5 text-sm text-rose-text-muted hover:text-rose-text transition-colors mb-4"
        @click="goBack"
      >
        <ArrowLeftIcon class="w-4 h-4" /> Back to folder
      </button>

      <div class="flex items-center gap-2 mb-6 group">
        <input
          v-if="isRenaming"
          v-model="renameValue"
          type="text"
          autofocus
          class="text-2xl font-bold bg-transparent border-b-2 border-rose-primary text-rose-text focus:outline-none"
          @keyup.enter="confirmRenameList"
          @keyup.escape="cancelRenameList"
          @blur="confirmRenameList"
        />
        <template v-else>
          <h1 class="text-2xl font-bold text-rose-text truncate">{{ currentList?.name }}</h1>
          <button
            class="opacity-0 group-hover:opacity-100 text-rose-text-muted hover:text-rose-primary transition-opacity shrink-0"
            @click="startRenameList"
          >
            <PencilIcon class="w-4 h-4" />
          </button>
        </template>

        <button
          class="ml-auto text-rose-text-muted hover:text-rose-primary transition-colors shrink-0"
          title="List info"
          @click="isInfoOpen = true"
        >
          <InfoIcon class="w-5 h-5" />
        </button>
      </div>

      <div class="hidden md:flex items-center gap-2 mb-4">
        <input
          v-model="newTodoTitle"
          type="text"
          placeholder="Add a todo..."
          class="flex-1 px-4 py-2.5 rounded-lg bg-rose-surface border border-rose-border text-rose-text placeholder:text-rose-text-muted focus:outline-none focus:ring-1 focus:ring-rose-primary"
          @keyup.enter="handleCreateTodo"
        />
        <button
          class="w-11 h-11 rounded-lg bg-rose-primary text-white hover:bg-rose-primary-hover transition-colors flex items-center justify-center shrink-0"
          @click="handleCreateTodo"
        >
          <PlusIcon class="w-5 h-5" />
        </button>
      </div>

      <div
        v-if="todosStore.todos.length === 0"
        class="text-base text-rose-text-muted italic py-12 text-center"
      >
        No todos yet. Add one to get started.
      </div>

      <div v-else class="flex flex-col gap-1.5">
        <div
          v-for="todo in todosStore.todos"
          :key="todo.id"
          class="flex items-center gap-3 px-4 py-3 rounded-lg bg-rose-surface hover:bg-rose-surface-alt transition-colors"
        >
          <button
            class="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors"
            :class="
              todo.done
                ? 'bg-rose-primary border-rose-primary'
                : 'border-rose-border hover:border-rose-primary'
            "
            @click="todosStore.toggleDone(todo.id)"
          >
            <svg v-if="todo.done" viewBox="0 0 20 20" fill="none" class="w-3 h-3 text-white">
              <path
                d="M4 10l4 4 8-8"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>

          <input
            v-if="editingId === todo.id"
            v-model="editingTitle"
            type="text"
            autofocus
            class="flex-1 text-base px-2 py-1 rounded border border-rose-primary bg-rose-bg text-rose-text focus:outline-none"
            @keyup.enter="confirmEdit"
            @keyup.escape="cancelEdit"
            @blur="confirmEdit"
          />
          <span
            v-else
            class="flex-1 text-base truncate"
            :class="todo.done ? 'text-rose-text-muted line-through' : 'text-rose-text'"
            @click="startEdit(todo.id, todo.title)"
          >
            {{ todo.title }}
          </span>

          <span v-if="todo.dueDate" class="hidden sm:inline text-xs text-rose-text-muted shrink-0">
            {{ formatRelativeTime(todo.dueDate) }}
          </span>

          <span
            v-if="todo.priority"
            class="text-xs px-2 py-0.5 rounded-full shrink-0"
            :class="{
              'bg-red-500/15 text-red-400': todo.priority === 'high',
              'bg-amber-500/15 text-amber-400': todo.priority === 'medium',
              'bg-sky-500/15 text-sky-400': todo.priority === 'low',
            }"
          >
            {{ todo.priority }}
          </span>

          <button
            data-todo-menu-trigger
            class="p-1.5 rounded text-rose-text-muted hover:text-rose-primary shrink-0"
            @click.stop="openTodoMenu(todo.id, $event)"
          >
            <MoreVerticalIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <div
      class="md:hidden fixed bottom-19 left-0 right-0 px-4 py-3 bg-rose-bg border-t border-rose-border flex items-center gap-2 z-20"
    >
      <input
        v-model="newTodoTitle"
        type="text"
        placeholder="Add a todo..."
        class="flex-1 px-4 py-2.5 rounded-lg bg-rose-surface border border-rose-border text-rose-text placeholder:text-rose-text-muted focus:outline-none focus:ring-1 focus:ring-rose-primary"
        @keyup.enter="handleCreateTodo"
      />
      <button
        class="w-11 h-11 rounded-lg bg-rose-primary text-white hover:bg-rose-primary-hover transition-colors flex items-center justify-center shrink-0"
        @click="handleCreateTodo"
      >
        <PlusIcon class="w-5 h-5" />
      </button>
    </div>

    <!-- Per-todo action popover -->
    <Teleport to="body">
      <div
        v-if="openMenuTodoId"
        data-todo-menu
        class="fixed w-52 bg-rose-surface border border-rose-border rounded-lg shadow-xl z-200 py-2"
        :style="menuStyle"
      >
        <div class="px-3 pb-2 mb-1 border-b border-rose-border">
          <p class="text-xs text-rose-text-muted mb-1.5">Priority</p>
          <div class="flex gap-1">
            <button
              v-for="opt in priorityOptions"
              :key="opt.label"
              class="flex-1 text-xs py-1 rounded-md transition-colors"
              :class="
                todosStore.todos.find((t) => t.id === openMenuTodoId)?.priority === opt.value
                  ? 'bg-rose-primary text-white'
                  : 'bg-rose-surface-alt text-rose-text-muted hover:text-rose-text'
              "
              @click="setPriority(openMenuTodoId!, opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="px-3 pb-2 mb-1 border-b border-rose-border">
          <p class="text-xs text-rose-text-muted mb-1.5 flex items-center gap-1">
            <CalendarIcon class="w-3.5 h-3.5" /> Due date
          </p>
          <input
            type="date"
            class="w-full text-sm px-2 py-1 rounded border border-rose-border bg-rose-bg text-rose-text focus:outline-none"
            :value="
              dateInputValue(todosStore.todos.find((t) => t.id === openMenuTodoId)?.dueDate ?? null)
            "
            @change="setDueDate(openMenuTodoId!, ($event.target as HTMLInputElement).value)"
          />
        </div>

        <button
          class="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-rose-text hover:bg-rose-surface-alt transition-colors"
          @click="handleMenuEdit(todosStore.todos.find((t) => t.id === openMenuTodoId)!)"
        >
          <PencilIcon class="w-4 h-4" /> Edit
        </button>
        <button
          class="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-rose-surface-alt transition-colors"
          @click="handleMenuDelete(todosStore.todos.find((t) => t.id === openMenuTodoId)!)"
        >
          <TrashIcon class="w-4 h-4" /> Delete
        </button>
      </div>
    </Teleport>

    <!-- List properties / info panel -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isInfoOpen"
          class="fixed inset-0 z-210 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4"
          @click.self="isInfoOpen = false"
        >
          <div
            class="bg-rose-surface rounded-xl shadow-2xl w-full max-w-sm p-6 border border-rose-border"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-rose-text">List properties</h3>
              <button class="text-rose-text-muted hover:text-rose-text" @click="isInfoOpen = false">
                <XIcon class="w-5 h-5" />
              </button>
            </div>
            <dl class="space-y-3 text-sm">
              <div class="flex justify-between">
                <dt class="text-rose-text-muted">Name</dt>
                <dd class="text-rose-text font-medium truncate max-w-48">
                  {{ currentList?.name }}
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-rose-text-muted">Total items</dt>
                <dd class="text-rose-text font-medium">{{ totalCount }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-rose-text-muted">Completed</dt>
                <dd class="text-rose-text font-medium">{{ completedCount }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-rose-text-muted">Pending</dt>
                <dd class="text-rose-text font-medium">{{ pendingCount }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-rose-text-muted">Created</dt>
                <dd class="text-rose-text font-medium">
                  {{ currentList?.createdAt ? formatRelativeTime(currentList.createdAt) : "—" }}
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-rose-text-muted">Last modified</dt>
                <dd class="text-rose-text font-medium">
                  {{ currentList?.updatedAt ? formatRelativeTime(currentList.updatedAt) : "—" }}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

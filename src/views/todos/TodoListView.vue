<!-- src/views/TodoListView.vue -->
<script setup lang="ts">
import { type Component, computed, nextTick, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ChevronsDownIcon,
  ChevronsUpIcon,
  CircleDashedIcon,
  EqualIcon,
  InfoIcon,
  MaximizeIcon,
  MinimizeIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "@lucide/vue";
import { useTodosStore } from "@/stores/todos";
import { useFoldersStore } from "@/stores/folders";
import { useConfirm } from "@/composables/ui/useConfirm.ts";
import { useToast } from "@/composables/ui/useToast.ts";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import type { Todo, TodoList } from "@/db/types";
import { useFocusTrap } from "@vueuse/integrations/useFocusTrap";
import ContextMenu from "@/components/ui/ContextMenu.vue";
import { useContextMenu, vLongPress } from "@/composables/ui/useContextMenu.ts";
import VaultAuthView from "@/components/ui/VaultAuthView.vue";

// const MENU_WIDTH_PX = 288;
// const MENU_OFFSET_PX = 8;

const { pathMatch } = defineProps<{ pathMatch?: string[] }>();

const router = useRouter();
const todosStore = useTodosStore();
const foldersStore = useFoldersStore();
const { confirm } = useConfirm();
const { showToast } = useToast();

const segments = computed(() => pathMatch ?? []);

const currentList = ref<TodoList | undefined>(undefined);
const isVaultLocked = ref(false);
const isRenaming = ref(false);
const renameValue = ref("");

const vFocus = {
  mounted: (el: HTMLElement) => el.focus()
};

const newTodoTitle = ref("");
const detailTodo = ref<Todo | null>(null);
const isDetailEditMode = ref(false);
const detailEditTitle = ref("");
const detailEditPriority = ref<Todo["priority"]>(null);
const detailEditDueDate = ref<string>("");
const isDetailMaximized = ref(false);
const isInfoOpen = ref(false);
let activeLoadToken = 0;

const infoRef = ref<HTMLElement | null>(null);
const detailRef = ref<HTMLElement | null>(null);

const contextMenu = useContextMenu<Todo>();

function handleContextMenu(todo: Todo, event: MouseEvent | PointerEvent | HTMLElement) {
  contextMenu.open(todo, event);
}

const { activate: activateInfo, deactivate: deactivateInfo } = useFocusTrap(infoRef, { escapeDeactivates: false });
watch(infoRef, (el) => el ? nextTick().then(() => activateInfo()) : deactivateInfo());

const { activate: activateDetail, deactivate: deactivateDetail } = useFocusTrap(detailRef, { escapeDeactivates: false });
watch(detailRef, (el) => el ? nextTick().then(() => activateDetail()) : deactivateDetail());

const priorityOptions: { value: Todo["priority"]; label: string; icon: Component }[] = [
  { label: "None", value: null, icon: CircleDashedIcon },
  { label: "Low", value: "low", icon: ChevronsDownIcon },
  { label: "Medium", value: "medium", icon: EqualIcon },
  { label: "High", value: "high", icon: ChevronsUpIcon },
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
        (folder.type === "todo" || folder.type === "mixed") &&
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
    router.replace("/todos");
    return;
  }
  const folderSegments = segs.slice(0, -1);
  const listName = segs[segs.length - 1];
  const folderId = resolveFolderId(folderSegments);

  if (folderId === undefined) {
    showToast("That list no longer exists.", "error");
    router.replace("/todos");
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
    router.replace({ name: "files-folder", params: { pathMatch: buildFolderPath(folderId) } });
    return;
  }

  currentList.value = match;
  todosStore.touchTodoList(match.id);
  
  isVaultLocked.value = false;
  try {
    await todosStore.loadTodos(match.id);
  } catch (err: any) {
    if (err.message === "Vault is locked") {
      isVaultLocked.value = true;
      return;
    }
    if (token === activeLoadToken) {
      showToast(err.message, "error");
    }
  }
}

function goBack() {
  if (globalThis.history.state && globalThis.history.state.back) {
    router.back();
    return;
  }
  if (!currentList.value) {
    router.push("/files/folder");
    return;
  }
  router.push({
    name: "files-folder",
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

function openDetail(todo: Todo) {
  detailTodo.value = todo;
  isDetailEditMode.value = false;
  isDetailMaximized.value = false;
}

function closeDetail() {
  detailTodo.value = null;
  isDetailEditMode.value = false;
  isDetailMaximized.value = false;
}

function startDetailEdit() {
  if (!detailTodo.value) { return; }
  isDetailEditMode.value = true;
  detailEditTitle.value = detailTodo.value.title;
  detailEditPriority.value = detailTodo.value.priority;
  detailEditDueDate.value = dateInputValue(detailTodo.value.dueDate);
}

async function saveDetailEdit() {
  if (!detailTodo.value) { return; }
  const title = detailEditTitle.value.trim();
  if (!title) { return; }

  const timestamp = detailEditDueDate.value ? new Date(detailEditDueDate.value).getTime() : null;

  try {
    await todosStore.updateTodo(detailTodo.value.id, {
      title,
      priority: detailEditPriority.value,
      dueDate: timestamp
    });
    // Update local detail view so it reflects changes immediately in view mode
    const updated = todosStore.todos.find((todo) => todo.id === detailTodo.value!.id);
    if (updated) {
      detailTodo.value = updated;
    }
    isDetailEditMode.value = false;
  } catch (error) {
    showToast((error as Error).message, "error");
  }
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

function handleMenuEdit() {
  const todo = contextMenu.activeItem.value;
  if (!todo) { return; }
  contextMenu.close();
  openDetail(todo);
  startDetailEdit();
}

async function handleMenuDelete() {
  const todo = contextMenu.activeItem.value;
  if (!todo) { return; }
  contextMenu.close();
  await handleDeleteTodo(todo.id, todo.title);
}

onMounted(loadList);
watch(() => pathMatch, loadList);
</script>

<template>
  <VaultAuthView v-if="isVaultLocked" @unlocked="loadList" />
  <template v-else>
    <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-4 md:p-6 pb-28 md:pb-6">
      <div class="flex items-center gap-3 mb-6 group">
        <button
          class="flex items-center justify-center p-1.5 rounded text-rose-text-muted hover:text-rose-text hover:bg-rose-surface-alt transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary shrink-0"
          @click="goBack" aria-label="Back to folder">
          <ArrowLeftIcon class="w-5 h-5" />
        </button>

        <input v-if="isRenaming" v-model="renameValue" type="text" v-focus aria-label="Rename list"
          class="flex-1 min-w-0 text-2xl font-bold bg-transparent border-b-2 border-rose-primary text-rose-text focus:outline-none"
          @keyup.enter="confirmRenameList" @keyup.escape="cancelRenameList" @blur="confirmRenameList" />
        <template v-else>
          <h1 class="text-2xl font-bold text-rose-text truncate">{{ currentList?.name }}</h1>
          <button type="button"
            class="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 text-rose-text-muted hover:text-rose-primary transition-opacity shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary rounded p-1.5"
            aria-label="Rename list" @click="startRenameList">
            <PencilIcon class="w-4 h-4" />
          </button>
        </template>

        <button class="ml-auto text-rose-text-muted hover:text-rose-primary transition-colors shrink-0"
          title="List info" @click="isInfoOpen = true">
          <InfoIcon class="w-5 h-5" />
        </button>
      </div>

      <div class="hidden md:flex items-center gap-2 mb-4">
        <input v-model="newTodoTitle" type="text" aria-label="Add a todo" placeholder="Add a todo..."
          class="flex-1 px-4 py-2.5 rounded-lg bg-rose-surface border border-rose-border text-rose-text placeholder:text-rose-text-muted focus:outline-none focus:ring-1 focus:ring-rose-primary"
          @keyup.enter="handleCreateTodo" />
        <button type="button" aria-label="Create todo"
          class="w-11 h-11 rounded-lg bg-rose-primary text-white hover:bg-rose-primary-hover transition-colors flex items-center justify-center shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary-hover"
          @click="handleCreateTodo">
          <PlusIcon class="w-5 h-5" />
        </button>
      </div>

      <div v-if="todosStore.todos.length === 0" class="text-base text-rose-text-muted italic py-12 text-center">
        No todos yet. Add one to get started.
      </div>

      <div v-else class="flex flex-col gap-3">
        <div v-for="todo in todosStore.sortedTodos" :key="todo.id"
          class="flex items-center gap-4 px-5 py-4 rounded-xl bg-rose-surface border border-rose-border shadow-sm hover:border-rose-primary/30 hover:shadow-md transition-all duration-200"
          :class="todo.done ? 'opacity-75' : ''"
          v-long-press="(e: PointerEvent | MouseEvent) => handleContextMenu(todo, e)">
          <button type="button"
            class="w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
            :class="todo.done
              ? 'bg-rose-green border-rose-green'
              : 'border-rose-border hover:border-rose-primary bg-rose-surface'
              " :aria-label="todo.done ? 'Mark as pending' : 'Mark as completed'"
            @click="todosStore.toggleDone(todo.id)">
            <svg v-if="todo.done" viewBox="0 0 20 20" fill="none" class="w-4 h-4 text-white">
              <path d="M4 10l4 4 8-8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </button>

          <div
            class="flex-1 min-w-0 flex flex-col gap-1 cursor-pointer group/item outline-none focus-visible:ring-2 focus-visible:ring-rose-primary rounded"
            role="button" tabindex="0" aria-label="View todo details" @click="openDetail(todo)"
            @keydown.enter.prevent="openDetail(todo)" @keydown.space.prevent="openDetail(todo)">
            <div v-if="todo.priority || todo.dueDate" class="flex items-center gap-2">
              <span v-if="todo.priority" class="text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
                :class="{
                  'bg-red-500/15 text-red-400': todo.priority === 'high',
                  'bg-amber-500/15 text-amber-400': todo.priority === 'medium',
                  'bg-sky-500/15 text-sky-400': todo.priority === 'low',
                }">
                <component :is="priorityOptions.find(o => o.value === todo.priority)?.icon" class="w-3 h-3" />
                {{ todo.priority }}
              </span>
              <span v-if="todo.dueDate" class="text-xs text-rose-text-muted flex items-center gap-1">
                <CalendarIcon class="w-3 h-3" /> {{ formatRelativeTime(todo.dueDate) }}
              </span>
            </div>
            <span class="text-base line-clamp-3 transition-colors"
              :class="todo.done ? 'text-rose-text-muted line-through' : 'text-rose-text group-hover/item:text-rose-primary'">
              {{ todo.title }}
            </span>
          </div>

          <button type="button"
            class="p-2 rounded text-rose-text-muted hover:text-rose-primary hover:bg-rose-surface-alt shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary transition-all duration-200"
            aria-label="Todo options" @click.stop="handleContextMenu(todo, $event.currentTarget as HTMLElement)">
            <MoreVerticalIcon class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <div
      class="md:hidden fixed bottom-19 left-0 right-0 px-4 py-3 bg-rose-bg border-t border-rose-border flex items-center gap-2 z-20">
      <input v-model="newTodoTitle" type="text" aria-label="Add a todo" placeholder="Add a todo..."
        class="flex-1 px-4 py-2.5 rounded-lg bg-rose-surface border border-rose-border text-rose-text placeholder:text-rose-text-muted focus:outline-none focus:ring-1 focus:ring-rose-primary"
        @keyup.enter="handleCreateTodo" />
      <button type="button" aria-label="Create todo"
        class="w-11 h-11 rounded-lg bg-rose-primary text-white hover:bg-rose-primary-hover transition-colors flex items-center justify-center shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary-hover"
        @click="handleCreateTodo">
        <PlusIcon class="w-5 h-5" />
      </button>
    </div>

    <!-- Per-todo action context menu -->
    <ContextMenu :is-open="contextMenu.isOpen.value" :x="contextMenu.x.value" :y="contextMenu.y.value"
      @close="contextMenu.close()">
      <div v-if="contextMenu.activeItem.value" class="w-72 flex flex-col">
        <div class="px-4 py-3 mb-1 border-b border-rose-border">
          <p id="popover-priority-label" class="text-sm font-medium text-rose-text-muted mb-2">Priority</p>
          <div class="flex gap-1.5" role="radiogroup" aria-labelledby="popover-priority-label">
            <button v-for="opt in priorityOptions" :key="opt.label" role="radio"
              :aria-checked="contextMenu.activeItem.value.priority === opt.value"
              class="flex-1 flex items-center justify-center gap-1.5 text-sm py-2 rounded-lg transition-colors font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
              :class="[
                contextMenu.activeItem.value.priority === opt.value
                  ? {
                    'bg-rose-text text-rose-bg shadow-sm': opt.value === null,
                    'bg-sky-500 text-white shadow-sm': opt.value === 'low',
                    'bg-amber-500 text-white shadow-sm': opt.value === 'medium',
                    'bg-red-500 text-white shadow-sm': opt.value === 'high'
                  }
                  : 'bg-rose-surface-alt text-rose-text-muted hover:text-rose-text hover:bg-rose-surface-alt/80'
              ]" @click="setPriority(contextMenu.activeItem.value.id, opt.value)">
              <component :is="opt.icon" class="w-4 h-4" />
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="px-4 py-3 mb-1 border-b border-rose-border">
          <label for="popover-due-date" class="text-sm font-medium text-rose-text-muted mb-2 flex items-center gap-1.5">
            <CalendarIcon class="w-4 h-4" /> Due date
          </label>
          <input type="date" id="popover-due-date"
            class="w-full text-base px-3 py-2.5 rounded-lg border border-rose-border bg-rose-bg text-rose-text focus:outline-none focus:ring-2 focus:ring-rose-primary transition-shadow cursor-pointer"
            :value="dateInputValue(contextMenu.activeItem.value.dueDate)"
            @change="setDueDate(contextMenu.activeItem.value.id, ($event.target as HTMLInputElement).value)" />
        </div>

        <button
          class="flex items-center gap-3 w-full text-left px-4 py-3 text-base text-rose-text hover:bg-rose-surface-alt transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rose-primary"
          @click="handleMenuEdit()">
          <PencilIcon class="w-5 h-5" /> Edit
        </button>
        <button
          class="flex items-center gap-3 w-full text-left px-4 py-3 text-base text-red-400 hover:bg-rose-surface-alt transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-400"
          @click="handleMenuDelete()">
          <TrashIcon class="w-5 h-5" /> Delete
        </button>
      </div>
    </ContextMenu>

    <!-- List properties / info panel -->
    <Teleport to="body">
      <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0"
        enter-to-class="opacity-100" leave-active-class="transition-opacity duration-200" leave-from-class="opacity-100"
        leave-to-class="opacity-0">
        <div v-if="isInfoOpen" role="dialog" aria-modal="true" aria-labelledby="info-dialog-title" ref="infoRef"
          class="fixed inset-0 z-210 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4"
          @click.self="isInfoOpen = false" @keydown.escape="isInfoOpen = false">
          <div class="bg-rose-surface rounded-xl shadow-2xl w-full max-w-sm p-6 border border-rose-border">
            <div class="flex items-center justify-between mb-4">
              <h3 id="info-dialog-title" class="text-lg font-semibold text-rose-text">List properties</h3>
              <button type="button" aria-label="Close properties"
                class="text-rose-text-muted hover:text-rose-text focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary rounded p-0.5"
                @click="isInfoOpen = false">
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
    <!-- Detail / Edit Dialog -->
    <Teleport to="body">
      <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0"
        enter-to-class="opacity-100" leave-active-class="transition-opacity duration-200" leave-from-class="opacity-100"
        leave-to-class="opacity-0">
        <div v-if="detailTodo" role="dialog" aria-modal="true" aria-labelledby="detail-dialog-title" ref="detailRef"
          class="fixed inset-0 z-210 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4"
          @click.self="closeDetail" @keydown.escape="closeDetail">
          <div
            class="bg-rose-surface shadow-2xl w-full border border-rose-border flex flex-col transition-all duration-200"
            :class="[
              isDetailMaximized
                ? 'max-w-none h-full max-h-none rounded-none p-6 md:p-10'
                : 'max-w-md max-h-[85vh] rounded-xl p-6'
            ]">
            <div class="flex items-center justify-between mb-4 shrink-0">
              <h3 id="detail-dialog-title" class="text-lg font-semibold text-rose-text">
                {{ isDetailEditMode ? 'Edit todo' : 'Todo details' }}
              </h3>
              <div class="flex items-center gap-1">
                <button type="button" aria-label="Toggle maximize"
                  class="text-rose-text-muted hover:text-rose-text focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary rounded p-1.5 transition-colors"
                  @click="isDetailMaximized = !isDetailMaximized">
                  <MinimizeIcon v-if="isDetailMaximized" class="w-5 h-5" />
                  <MaximizeIcon v-else class="w-5 h-5" />
                </button>
                <button type="button" aria-label="Close details"
                  class="text-rose-text-muted hover:text-rose-text focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary rounded p-1.5 transition-colors"
                  @click="closeDetail">
                  <XIcon class="w-5 h-5" />
                </button>
              </div>
            </div>

            <div class="overflow-y-auto flex-1 pr-2">
              <template v-if="!isDetailEditMode">
                <div class="mb-4">
                  <p class="text-rose-text whitespace-pre-wrap wrap-break-word text-lg">{{ detailTodo.title }}</p>
                </div>

                <dl class="space-y-4">
                  <div>
                    <dt class="text-sm font-medium text-rose-text-muted mb-1 flex items-center gap-1.5">
                      <CalendarIcon class="w-4 h-4" /> Due date
                    </dt>
                    <dd class="text-base text-rose-text">
                      {{ detailTodo.dueDate ? new Date(detailTodo.dueDate).toLocaleDateString(undefined, {
                        weekday:
                          'long', year: 'numeric', month: 'long', day: 'numeric'
                      }) : 'No due date' }}
                    </dd>
                  </div>

                  <div>
                    <dt class="text-sm font-medium text-rose-text-muted mb-1">Priority</dt>
                    <dd>
                      <span class="inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-full"
                        :class="{
                          'bg-rose-surface-alt text-rose-text': !detailTodo.priority,
                          'bg-sky-500/15 text-sky-400': detailTodo.priority === 'low',
                          'bg-amber-500/15 text-amber-400': detailTodo.priority === 'medium',
                          'bg-red-500/15 text-red-400': detailTodo.priority === 'high',
                        }">
                        <component :is="priorityOptions.find(o => o.value === detailTodo?.priority)?.icon"
                          class="w-4 h-4" />
                        {{ detailTodo.priority ? detailTodo.priority.charAt(0).toUpperCase() +
                          detailTodo.priority.slice(1) : 'None' }}
                      </span>
                    </dd>
                  </div>
                </dl>
              </template>

              <template v-else>
                <div class="flex flex-col h-full gap-4 pb-2">
                  <div class="flex-1 flex flex-col min-h-32">
                    <label for="detail-edit-title"
                      class="block text-sm font-medium text-rose-text-muted mb-1">Content</label>
                    <textarea v-model="detailEditTitle" id="detail-edit-title"
                      class="w-full flex-1 px-3 py-2 rounded-lg bg-rose-bg border border-rose-border text-rose-text focus:outline-none focus:ring-2 focus:ring-rose-primary resize-none"></textarea>
                  </div>

                  <div>
                    <label for="detail-edit-due-date"
                      class="text-sm font-medium text-rose-text-muted mb-1 flex items-center gap-1.5">
                      <CalendarIcon class="w-4 h-4" /> Due date
                    </label>
                    <input type="date" id="detail-edit-due-date" v-model="detailEditDueDate"
                      class="w-full text-base px-3 py-2 rounded-lg border border-rose-border bg-rose-bg text-rose-text focus:outline-none focus:ring-2 focus:ring-rose-primary" />
                  </div>

                  <div>
                    <p id="detail-edit-priority-label" class="block text-sm font-medium text-rose-text-muted mb-1">
                      Priority</p>
                    <div class="flex gap-2" role="radiogroup" aria-labelledby="detail-edit-priority-label">
                      <button v-for="opt in priorityOptions" :key="opt.label" type="button" role="radio"
                        :aria-checked="detailEditPriority === opt.value"
                        class="flex-1 flex items-center justify-center gap-1.5 text-sm py-2 rounded-lg transition-colors font-medium border focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
                        :class="[
                          detailEditPriority === opt.value
                            ? {
                              'border-rose-text bg-rose-text text-rose-bg': opt.value === null,
                              'border-sky-500 bg-sky-500 text-white': opt.value === 'low',
                              'border-amber-500 bg-amber-500 text-white': opt.value === 'medium',
                              'border-red-500 bg-red-500 text-white': opt.value === 'high'
                            }
                            : 'border-rose-border bg-rose-surface text-rose-text-muted hover:bg-rose-surface-alt'
                        ]" @click="detailEditPriority = opt.value">
                        <component :is="opt.icon" class="w-4 h-4" />
                        {{ opt.label }}
                      </button>
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <div class="mt-6 pt-4 border-t border-rose-border flex justify-end gap-3 shrink-0">
              <template v-if="!isDetailEditMode">
                <button type="button"
                  class="px-4 py-2 rounded-lg font-medium text-rose-text hover:bg-rose-surface-alt transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
                  @click="startDetailEdit">
                  Edit
                </button>
              </template>
              <template v-else>
                <button type="button"
                  class="px-4 py-2 rounded-lg font-medium text-rose-text hover:bg-rose-surface-alt transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
                  @click="isDetailEditMode = false">
                  Cancel
                </button>
                <button type="button"
                  class="px-4 py-2 rounded-lg font-medium bg-rose-primary text-white hover:bg-rose-primary-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary-hover"
                  @click="saveDetailEdit">
                  Save
                </button>
              </template>
            </div>
          </div>
        </div>
        </Transition>
      </Teleport>
    </div>
  </template>
</template>

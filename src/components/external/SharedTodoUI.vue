<!--
  src/components/external/SharedTodoUI.vue

  Microfrontend component exposed via Vite Module Federation.
  Enables external host applications (e.g. Blueberry / Tulip AI orchestrators) to mount
  and embed Rose's standalone todo manager UI without depending on internal routing.
-->
<script setup lang="ts">
import { type Component, computed, ref } from "vue";
import {
  CalendarIcon,
  ChevronsDownIcon,
  ChevronsUpIcon,
  CircleDashedIcon,
  EqualIcon,
  MaximizeIcon,
  MinimizeIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "@lucide/vue";
import ContextMenu from "./SharedContextMenu.vue";
import { useContextMenu, vLongPress } from "@/composables/ui/useContextMenu.ts";
import TodoListIllustration from "@/assets/illustrations/todo-list.svg";
import { formatRelativeTime } from "@/utils/formatRelativeTime";

export interface TodoItem {
  id: string;
  title: string;
  done: boolean;
  priority?: "low" | "medium" | "high" | null;
  dueDate?: number | null;
  [key: string]: unknown;
}

const { items = [] } = defineProps<{
  items?: TodoItem[]
}>();

const emit = defineEmits<{
  (e: 'change', items: TodoItem[]): void
}>();

const newTodoTitle = ref("");

const priorityOptions: { value: TodoItem["priority"]; label: string; icon: Component }[] = [
  { label: "None", value: null, icon: CircleDashedIcon },
  { label: "Low", value: "low", icon: ChevronsDownIcon },
  { label: "Medium", value: "medium", icon: EqualIcon },
  { label: "High", value: "high", icon: ChevronsUpIcon },
];

const contextMenu = useContextMenu<{ item: TodoItem, index: number }>();

function handleContextMenu(todo: TodoItem, index: number, event: MouseEvent | PointerEvent | HTMLElement) {
  contextMenu.open({ item: todo, index }, event);
}

function handleCreateTodo() {
  const title = newTodoTitle.value.trim();
  if (!title) { return; }

  const newItem: TodoItem = {
    id: crypto.randomUUID(),
    title,
    done: false,
    priority: null,
    dueDate: null,
  };

  const newItems = [...items, newItem];
  emit('change', newItems);
  newTodoTitle.value = "";
}

function handleDeleteTodo(index: number) {
  const newItems = [...items];
  newItems.splice(index, 1);
  emit('change', newItems);
}

function toggleDone(index: number) {
  const newItems = [...items];
  const item = newItems[index];
  if (!item) { return; }
  newItems[index] = { ...item, done: !item.done };
  emit('change', newItems);
}

function markAllDone() {
  const newItems = items.map(item => ({ ...item, done: true }));
  emit('change', newItems);
}

function setPriority(index: number, priority: TodoItem["priority"]) {
  const newItems = [...items];
  const item = newItems[index];
  if (!item) { return; }
  newItems[index] = { ...item, priority };
  emit('change', newItems);
}

function setDueDate(index: number, value: string) {
  const timestamp = value ? new Date(value).getTime() : null;
  const newItems = [...items];
  const item = newItems[index];
  if (!item) { return; }
  newItems[index] = { ...item, dueDate: timestamp };
  emit('change', newItems);
}

function dateInputValue(dueDate: number | null | undefined): string {
  if (!dueDate) { return ""; }
  return new Date(dueDate).toISOString().slice(0, 10);
}

// Detail View logic
const detailTodo = ref<{ item: TodoItem, index: number } | null>(null);
const isDetailEditMode = ref(false);
const detailEditTitle = ref("");
const detailEditPriority = ref<TodoItem["priority"]>(null);
const detailEditDueDate = ref<string>("");
const isDetailMaximized = ref(false);

function openDetail(todo: TodoItem, index: number) {
  detailTodo.value = { item: todo, index };
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
  detailEditTitle.value = detailTodo.value.item.title;
  detailEditPriority.value = detailTodo.value.item.priority;
  detailEditDueDate.value = dateInputValue(detailTodo.value.item.dueDate);
}

function saveDetailEdit() {
  if (!detailTodo.value) { return; }
  const title = detailEditTitle.value.trim();
  if (!title) { return; }

  const timestamp = detailEditDueDate.value ? new Date(detailEditDueDate.value).getTime() : null;

  const updatedItem = {
    ...detailTodo.value.item,
    title,
    priority: detailEditPriority.value,
    dueDate: timestamp
  };

  const newItems = [...items];
  newItems[detailTodo.value.index] = updatedItem;

  emit('change', newItems);

  detailTodo.value = { item: updatedItem, index: detailTodo.value.index };
  isDetailEditMode.value = false;
}

function handleMenuEdit() {
  const active = contextMenu.activeItem.value;
  if (!active) { return; }
  contextMenu.close();
  openDetail(active.item, active.index);
  startDetailEdit();
}

function handleMenuDelete() {
  const active = contextMenu.activeItem.value;
  if (!active) { return; }
  contextMenu.close();
  handleDeleteTodo(active.index);
}

const sortedTodos = computed(() => {
  const withIndex = items.map((item, index) => ({ item, index }));
  return withIndex.toSorted((a, b) => {
    if (a.item.done !== b.item.done) { return a.item.done ? 1 : -1; }
    return 0;
  });
});
</script>

<template>
  <div class="flex flex-col h-full relative">
    <div class="flex-1 overflow-y-auto p-4 md:p-6 pb-28 md:pb-6">
      <div class="flex items-center gap-2 mb-4">
        <input v-model="newTodoTitle" type="text" aria-label="Add a todo" placeholder="Add a todo..."
          class="flex-1 px-4 py-2.5 rounded-lg bg-rose-surface border border-rose-border text-rose-text placeholder:text-rose-text-muted focus:outline-none focus:ring-1 focus:ring-rose-primary"
          @keyup.enter="handleCreateTodo" />
        <button type="button" aria-label="Create todo"
          class="w-11 h-11 rounded-lg bg-rose-primary text-white hover:bg-rose-primary-hover transition-colors flex items-center justify-center shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary-hover"
          @click="handleCreateTodo">
          <PlusIcon class="w-5 h-5" />
        </button>
      </div>

      <div v-if="items.length > 0 && items.some(i => !i.done)" class="flex justify-end mb-3 px-1">
        <button type="button"
          class="text-sm font-medium text-rose-primary hover:text-rose-primary-hover transition-colors focus:outline-none focus-visible:underline"
          @click="markAllDone">
          Mark all done
        </button>
      </div>

      <div v-if="items.length === 0" class="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <img :src="TodoListIllustration" alt="No todos"
          class="w-48 md:w-56 h-auto mb-6 opacity-70 select-none pointer-events-none" />
        <p class="text-base text-rose-text-muted italic">No todos yet. Add one to get started.</p>
      </div>

      <div v-else class="flex flex-col gap-3">
        <div v-for="{ item: todo, index } in sortedTodos" :key="todo.id || index"
          class="flex items-center gap-4 px-5 py-4 rounded-xl bg-rose-surface border border-rose-border shadow-sm hover:border-rose-primary/30 hover:shadow-md transition-all duration-200"
          :class="todo.done ? 'opacity-75' : ''"
          v-long-press="(e: PointerEvent | MouseEvent) => handleContextMenu(todo, index, e)">
          <button type="button"
            class="w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
            :class="todo.done
              ? 'bg-rose-green border-rose-green'
              : 'border-rose-border hover:border-rose-primary bg-rose-surface'
              " :aria-label="todo.done ? 'Mark as pending' : 'Mark as completed'" @click="toggleDone(index)">
            <svg v-if="todo.done" viewBox="0 0 20 20" fill="none" class="w-4 h-4 text-white">
              <path d="M4 10l4 4 8-8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </button>

          <div
            class="flex-1 min-w-0 flex flex-col gap-1 cursor-pointer group/item outline-none focus-visible:ring-2 focus-visible:ring-rose-primary rounded"
            role="button" tabindex="0" aria-label="View todo details" @click="openDetail(todo, index)"
            @keydown.enter.prevent="openDetail(todo, index)" @keydown.space.prevent="openDetail(todo, index)">
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
            aria-label="Todo options" @click.stop="handleContextMenu(todo, index, $event.currentTarget as HTMLElement)">
            <MoreVerticalIcon class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <ContextMenu :is-open="contextMenu.isOpen.value" :x="contextMenu.x.value" :y="contextMenu.y.value"
      @close="contextMenu.close()">
      <div v-if="contextMenu.activeItem.value" class="w-72 flex flex-col">
        <div class="px-4 py-3 mb-1 border-b border-rose-border">
          <p id="popover-priority-label" class="text-sm font-medium text-rose-text-muted mb-2">Priority</p>
          <div class="flex gap-1.5" role="radiogroup" aria-labelledby="popover-priority-label">
            <button v-for="opt in priorityOptions" :key="opt.label" role="radio"
              :aria-checked="contextMenu.activeItem.value.item.priority === opt.value"
              class="flex-1 flex items-center justify-center gap-1.5 text-sm py-2 rounded-lg transition-colors font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
              :class="[
                contextMenu.activeItem.value.item.priority === opt.value
                  ? {
                    'bg-rose-text text-rose-bg shadow-sm': opt.value === null,
                    'bg-sky-500 text-white shadow-sm': opt.value === 'low',
                    'bg-amber-500 text-white shadow-sm': opt.value === 'medium',
                    'bg-red-500 text-white shadow-sm': opt.value === 'high'
                  }
                  : 'bg-rose-surface-alt text-rose-text-muted hover:text-rose-text hover:bg-rose-surface-alt/80'
              ]" @click="setPriority(contextMenu.activeItem.value.index, opt.value)">
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
            :value="dateInputValue(contextMenu.activeItem.value.item.dueDate)"
            @change="setDueDate(contextMenu.activeItem.value.index, ($event.target as HTMLInputElement).value)" />
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

    <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="transition-opacity duration-200" leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="detailTodo" role="dialog" aria-modal="true" aria-labelledby="detail-dialog-title"
        class="absolute inset-0 z-210 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
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
                <p class="text-rose-text whitespace-pre-wrap wrap-break-word text-lg">{{ detailTodo.item.title }}</p>
              </div>

              <dl class="space-y-4">
                <div>
                  <dt class="text-sm font-medium text-rose-text-muted mb-1 flex items-center gap-1.5">
                    <CalendarIcon class="w-4 h-4" /> Due date
                  </dt>
                  <dd class="text-base text-rose-text">
                    {{ detailTodo.item.dueDate ? new Date(detailTodo.item.dueDate).toLocaleDateString(undefined, {
                      weekday:
                        'long', year: 'numeric', month: 'long', day: 'numeric'
                    }) : 'No due date' }}
                  </dd>
                </div>

                <div>
                  <dt class="text-sm font-medium text-rose-text-muted mb-1">Priority</dt>
                  <dd>
                    <span class="inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-full" :class="{
                      'bg-rose-surface-alt text-rose-text': !detailTodo.item.priority,
                      'bg-sky-500/15 text-sky-400': detailTodo.item.priority === 'low',
                      'bg-amber-500/15 text-amber-400': detailTodo.item.priority === 'medium',
                      'bg-red-500/15 text-red-400': detailTodo.item.priority === 'high',
                    }">
                      <component :is="priorityOptions.find(o => o.value === detailTodo?.item?.priority)?.icon"
                        class="w-4 h-4" />
                      {{ detailTodo.item.priority ? detailTodo.item.priority.charAt(0).toUpperCase() +
                        detailTodo.item.priority.slice(1) : 'None' }}
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
  </div>
</template>

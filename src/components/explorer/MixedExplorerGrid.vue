<!-- src/components/explorer/MixedExplorerGrid.vue -->
<script setup lang="ts">
import { type Component, computed, nextTick, ref } from "vue";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  FileTextIcon,
  FolderIcon,
  FolderInputIcon,
  LayoutGridIcon,
  ListIcon,
  ListTodoIcon,
  MoreVerticalIcon,
  PencilIcon,
  PenLineIcon,
  TrashIcon,
  LockIcon,
  UnlockIcon
} from "@lucide/vue";
import { useConfirm } from "@/composables/ui/useConfirm.ts";
import ContextMenu from "@/components/ui/ContextMenu.vue";
import { useContextMenu, vLongPress } from "@/composables/ui/useContextMenu.ts";
import { useExplorerViewMode } from "@/composables/explorer/useExplorerViewMode.ts";
import { formatRelativeTime } from "@/utils/formatRelativeTime";

export type ItemKind = "folder" | "doc" | "note" | "todo";

export interface DisplayItem {
  kind: ItemKind;
  id: string;
  name: string;
  parentId?: string | null;
  itemCount?: number;
  updatedAt?: number;
  createdAt?: number;
  isNew?: boolean;
  thumbnail?: string | null;
  isVaulted?: boolean;
}

interface RenameOptions {
  kind: ItemKind;
  id: string;
  currentName: string;
  event: Event;
}

const { items } = defineProps<{
  items: DisplayItem[];
}>();

const emit = defineEmits<{
  openItem: [kind: ItemKind, id: string];
  createItem: [kind: ItemKind, name: string];
  renameItem: [kind: ItemKind, id: string, name: string];
  deleteItem: [kind: ItemKind, id: string, name: string];
  requestMove: [item: DisplayItem];
  moveItem: [kind: ItemKind, id: string, targetFolderId: string | null];
}>();


const { confirm } = useConfirm();
const { viewMode, sortKey, sortDir, toggleViewMode, setSortKey } = useExplorerViewMode();

const creatingType = ref<ItemKind | null>(null);
const newName = ref("");

const vFocus = {
  mounted: (el: HTMLElement) => el.focus()
};

const renamingId = ref<string | null>(null);
const renamingKind = ref<ItemKind | null>(null);
const renamingName = ref("");
const newItemInputRef = ref<HTMLInputElement | HTMLInputElement[] | null>(null);

function sortItems(itemsList: DisplayItem[]): DisplayItem[] {
  const sorted = [...itemsList].toSorted((itemA, itemB) => {
    // Folders always first
    if (itemA.kind === 'folder' && itemB.kind !== 'folder') { return -1; }
    if (itemA.kind !== 'folder' && itemB.kind === 'folder') { return 1; }

    if (sortKey.value === "name") {
      return itemA.name.localeCompare(itemB.name);
    }
    return (itemA.updatedAt ?? 0) - (itemB.updatedAt ?? 0);
  });
  return sortDir.value === "asc" ? sorted : sorted.toReversed();
}

const displayItems = computed<DisplayItem[]>(() => {
  const sorted = sortItems(items.filter(i => !i.isNew));

  const placeholder: DisplayItem | null = creatingType.value
    ? { id: "__new__", isNew: true, kind: creatingType.value, name: "" }
    : null;

  if (placeholder) {
    if (placeholder.kind === "folder") {
      return [placeholder, ...sorted];
    } else {
      // Put file placeholder after folders
      const firstFileIndex = sorted.findIndex(i => i.kind !== 'folder');
      if (firstFileIndex === -1) {
        return [...sorted, placeholder];
      }
      return [
        ...sorted.slice(0, firstFileIndex),
        placeholder,
        ...sorted.slice(firstFileIndex)
      ];
    }
  }

  return sorted;
});

const isEmpty = computed(() => items.length === 0 && !creatingType.value);

function typeLabel(kind: ItemKind): string {
  switch (kind) {
    case "folder": {
      return "Folder";
    }
    case "doc": {
      return "Doc";
    }
    case "note": {
      return "Note";
    }
    case "todo": {
      return "List";
    }
  }
}

function itemIcon(kind: ItemKind, id?: string): Component {
  if (id === "vault") {
    return LockIcon;
  }
  switch (kind) {
    case "folder": {
      return FolderIcon;
    }
    case "doc": {
      return FileTextIcon;
    }
    case "note": {
      return PenLineIcon;
    }
    case "todo": {
      return ListTodoIcon;
    }
  }
}

function itemIconClass(kind: ItemKind): string {
  switch (kind) {
    case "folder": {
      return "text-rose-primary";
    }
    case "doc": {
      return "text-rose-cream";
    }
    case "note": {
      return "text-rose-purple";
    }
    case "todo": {
      return "text-rose-blue";
    }
  }
}

function focusAndScrollToNewInput() {
  nextTick().then(() => {
    const el = Array.isArray(newItemInputRef.value)
      ? newItemInputRef.value[0]
      : newItemInputRef.value;
    if (!el) {
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus();
  });
}

function startCreate(type: ItemKind) {
  creatingType.value = type;
  newName.value = "";
  focusAndScrollToNewInput();
}

function confirmCreate() {
  const name = newName.value.trim();
  if (name && creatingType.value) {
    emit("createItem", creatingType.value, name);
  }
  creatingType.value = null;
}

function cancelCreate() {
  creatingType.value = null;
}

function startRename({ kind, id, currentName, event }: RenameOptions) {
  event.stopPropagation();
  renamingKind.value = kind;
  renamingId.value = id;
  renamingName.value = currentName;
}

function confirmRename() {
  const name = renamingName.value.trim();
  if (name && renamingId.value !== null && renamingKind.value !== null) {
    emit("renameItem", renamingKind.value, renamingId.value, name);
  }
  renamingId.value = null;
}

function cancelRename() {
  renamingId.value = null;
}

async function handleDelete(item: DisplayItem, event: Event) {
  event.stopPropagation();
  const confirmed = await confirm({
    confirmLabel: "Delete",
    message: item.kind === 'folder'
      ? `Delete "${item.name}" and everything inside it? This can't be undone.`
      : `Delete "${item.name}"? This can't be undone.`,
    title: `Delete ${typeLabel(item.kind)}`,
  });
  if (!confirmed) {
    return;
  }
  emit("deleteItem", item.kind, item.id, item.name);
}

function handleOpen(item: DisplayItem) {
  emit("openItem", item.kind, item.id);
}


function isRenaming(item: DisplayItem) {
  return renamingId.value === item.id && renamingKind.value === item.kind;
}

const contextMenu = useContextMenu<DisplayItem>();

function handleContextMenu(item: DisplayItem, event: MouseEvent | PointerEvent | HTMLElement) {
  if (item.isNew || isRenaming(item) || item.id === 'vault') { return; }
  contextMenu.open(item, event);
}

const mockEvent = { stopPropagation: () => { } } as Event;

function handleMenuRename() {
  const item = contextMenu.activeItem.value;
  if (!item) { return; }
  contextMenu.close();
  startRename({ currentName: item.name, event: mockEvent, id: item.id, kind: item.kind });
}

function handleMenuMove() {
  const item = contextMenu.activeItem.value;
  if (!item) { return; }
  contextMenu.close();
  emit("requestMove", item);
}

function handleMenuDelete() {
  const item = contextMenu.activeItem.value;
  if (!item) { return; }
  contextMenu.close();
  handleDelete(item, mockEvent);
}

function handleMenuMoveToVault() {
  const item = contextMenu.activeItem.value;
  if (!item) { return; }
  contextMenu.close();
  emit("moveItem", item.kind, item.id, "vault");
}

function handleMenuRemoveFromVault() {
  const item = contextMenu.activeItem.value;
  if (!item) { return; }
  contextMenu.close();
  emit("moveItem", item.kind, item.id, null);
}

const dragOverFolderId = ref<string | null>(null);

function handleDragStart(item: DisplayItem, event: DragEvent) {
  if (item.isNew || isRenaming(item)) { return; }
  if (!event.dataTransfer) { return; }
  event.dataTransfer.setData(
    "application/json",
    JSON.stringify({
      id: item.id,
      kind: item.kind,
      name: item.name,
      parentId: item.parentId ?? null,
    }),
  );
  event.dataTransfer.effectAllowed = "move";
}

function handleDragOver(targetItem: DisplayItem, event: DragEvent) {
  if (targetItem.kind !== "folder" || targetItem.isNew) { return; }
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
  dragOverFolderId.value = targetItem.id;
}

function handleDragLeave(targetItem: DisplayItem) {
  if (dragOverFolderId.value === targetItem.id) {
    dragOverFolderId.value = null;
  }
}

function handleDrop(targetFolder: DisplayItem, event: DragEvent) {
  dragOverFolderId.value = null;
  if (targetFolder.kind !== "folder" || targetFolder.isNew) { return; }
  event.preventDefault();
  const raw = event.dataTransfer?.getData("application/json");
  if (!raw) { return; }
  try {
    const data = JSON.parse(raw) as { id: string; kind: ItemKind; name: string; parentId: string | null };
    if (data.id === targetFolder.id && data.kind === "folder") { return; }
    emit("moveItem", data.kind, data.id, targetFolder.id);
  } catch {
    // ignore
  }
}

defineExpose({ startCreate });
</script>
<template>
  <div>
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center justify-end gap-2 mb-3">
      <div class="flex items-center gap-1">
        <button
          class="flex items-center gap-1 px-2 py-1.5 rounded-md text-sm text-rose-text-muted hover:bg-rose-surface-alt hover:text-rose-text transition-colors"
          @click="setSortKey('name')">
          Name
          <ChevronUpIcon v-if="sortKey === 'name' && sortDir === 'asc'" class="w-3.5 h-3.5" />
          <ChevronDownIcon v-else-if="sortKey === 'name'" class="w-3.5 h-3.5" />
        </button>
        <button
          class="flex items-center gap-1 px-2 py-1.5 rounded-md text-sm text-rose-text-muted hover:bg-rose-surface-alt hover:text-rose-text transition-colors"
          @click="setSortKey('updatedAt')">
          Modified
          <ChevronUpIcon v-if="sortKey === 'updatedAt' && sortDir === 'asc'" class="w-3.5 h-3.5" />
          <ChevronDownIcon v-else-if="sortKey === 'updatedAt'" class="w-3.5 h-3.5" />
        </button>

        <div class="w-px h-5 bg-rose-border mx-1"></div>

        <button class="p-1.5 rounded-md transition-colors" :class="viewMode === 'grid'
          ? 'bg-rose-surface-alt text-rose-primary'
          : 'text-rose-text-muted hover:bg-rose-surface-alt hover:text-rose-text'
          " title="Grid view" @click="viewMode = 'grid'">
          <LayoutGridIcon class="w-4 h-4" />
        </button>
        <button class="p-1.5 rounded-md transition-colors" :class="viewMode === 'list'
          ? 'bg-rose-surface-alt text-rose-primary'
          : 'text-rose-text-muted hover:bg-rose-surface-alt hover:text-rose-text'
          " title="List view" @click="
            toggleViewMode();
          viewMode = 'list';
          ">
          <ListIcon class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div v-if="isEmpty" class="text-base text-rose-text-muted italic py-8 text-center">
      This folder is empty.
    </div>

    <!-- Grid view -->
    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1"
      role="list">
      <div v-for="item in displayItems" :key="item.kind + '-' + item.id" :draggable="!item.isNew && !isRenaming(item)"
        @dragstart="handleDragStart(item, $event)" @dragover="handleDragOver(item, $event)"
        @dragleave="handleDragLeave(item)" @drop="handleDrop(item, $event)"
        class="group relative flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-rose-surface-alt transition-colors focus-within:bg-rose-surface-alt"
        :class="[
          dragOverFolderId === item.id ? 'ring-2 ring-rose-primary bg-rose-primary/10!' : '',
          item.id === 'vault' ? 'bg-rose-primary/5 border border-rose-primary shadow-[0_0_10px_rgba(225,29,72,0.1)]' : 'border border-transparent'
        ]" role="listitem" v-long-press="(e: PointerEvent | MouseEvent) => handleContextMenu(item, e)">
        <button v-if="!item.isNew && !isRenaming(item)" type="button"
          class="absolute inset-0 w-full h-full rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary z-0"
          :aria-label="'Open ' + item.name" @click="handleOpen(item)"></button>

        <img v-if="item.kind === 'note' && item.thumbnail && item.thumbnail.startsWith('data:image/')"
          :src="item.thumbnail"
          class="w-12 h-12 shrink-0 object-cover rounded border border-rose-border relative z-10 pointer-events-none"
          alt="" />
        <component v-else :is="itemIcon(item.kind, item.id)"
          class="w-12 h-12 shrink-0 relative z-10 pointer-events-none" :class="itemIconClass(item.kind)" />

        <input v-if="item.isNew" v-model="newName" ref="newItemInputRef" type="text" v-focus aria-label="New item name"
          :placeholder="typeLabel(item.kind) + ' name'"
          class="text-sm w-full text-center px-1 py-0.5 rounded border border-rose-primary bg-rose-surface text-rose-text focus:outline-none focus:ring-2 focus:ring-rose-primary/50 relative z-10"
          @click.stop @keyup.enter="confirmCreate" @keyup.escape="cancelCreate" @blur="confirmCreate" />
        <input v-else-if="isRenaming(item)" v-model="renamingName" type="text" v-focus aria-label="Rename item"
          class="text-sm w-full text-center px-1 py-0.5 rounded border border-rose-primary bg-rose-surface text-rose-text focus:outline-none focus:ring-2 focus:ring-rose-primary/50 relative z-10"
          @click.stop @keyup.enter="confirmRename" @keyup.escape="cancelRename" @blur="confirmRename" />
        <span v-else class="text-sm text-rose-text text-center truncate w-full relative z-10 pointer-events-none">{{
          item.name
          }}</span>

        <div v-if="!item.isNew" class="flex items-center gap-1 shrink-0 relative z-10">
          <button type="button" aria-label="More options"
            class="p-1.5 rounded text-rose-text-muted hover:text-rose-text hover:bg-rose-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
            @click.stop="handleContextMenu(item, $event.currentTarget as HTMLElement)">
            <MoreVerticalIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- List view -->
    <div v-else class="flex flex-col">
      <div
        class="flex items-center gap-3 px-3 py-1.5 text-xs font-medium text-rose-text-muted border-b border-rose-border">
        <span class="flex-1">Name</span>
        <span class="w-16 text-right shrink-0 hidden lg:block">Type</span>
        <span class="w-20 text-right shrink-0 hidden lg:block">Items</span>
        <span class="w-28 text-right shrink-0 hidden lg:block">Created</span>
        <span class="w-32 text-right shrink-0 hidden lg:block">Modified</span>
        <span class="w-14 shrink-0"></span>
      </div>

      <div role="list" class="flex flex-col">
        <div v-for="item in displayItems" :key="item.kind + '-' + item.id" :draggable="!item.isNew && !isRenaming(item)"
          @dragstart="handleDragStart(item, $event)" @dragover="handleDragOver(item, $event)"
          @dragleave="handleDragLeave(item)" @drop="handleDrop(item, $event)"
          class="group relative flex items-center gap-3 px-3 py-2 rounded-md hover:bg-rose-surface-alt transition-colors"
          :class="[
            dragOverFolderId === item.id ? 'ring-2 ring-rose-primary bg-rose-primary/10!' : '',
            item.id === 'vault' ? 'bg-rose-primary/5 border border-rose-primary/30 shadow-[0_0_8px_rgba(225,29,72,0.1)]' : 'border border-transparent'
          ]" role="listitem" v-long-press="(e: PointerEvent | MouseEvent) => handleContextMenu(item, e)">
          <button v-if="!item.isNew && !isRenaming(item)" type="button"
            class="absolute inset-0 w-full h-full rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary z-0"
            :aria-label="'Open ' + item.name" @click="handleOpen(item)"></button>

          <img v-if="item.kind === 'note' && item.thumbnail && item.thumbnail.startsWith('data:image/')"
            :src="item.thumbnail" class="w-5 h-5 shrink-0 object-cover rounded relative z-10 pointer-events-none"
            alt="" />
          <component v-else :is="itemIcon(item.kind, item.id)"
            class="w-5 h-5 shrink-0 relative z-10 pointer-events-none" :class="itemIconClass(item.kind)" />

          <input v-if="item.isNew" v-model="newName" ref="newItemInputRef" type="text" v-focus
            aria-label="New item name" :placeholder="typeLabel(item.kind) + ' name'"
            class="flex-1 text-sm px-2 py-1 rounded border border-rose-primary bg-rose-surface text-rose-text focus:outline-none focus:ring-2 focus:ring-rose-primary/50 relative z-10"
            @click.stop @keyup.enter="confirmCreate" @keyup.escape="cancelCreate" @blur="confirmCreate" />
          <input v-else-if="isRenaming(item)" v-model="renamingName" type="text" v-focus aria-label="Rename item"
            class="flex-1 text-sm px-2 py-1 rounded border border-rose-primary bg-rose-surface text-rose-text focus:outline-none focus:ring-2 focus:ring-rose-primary/50 relative z-10"
            @click.stop @keyup.enter="confirmRename" @keyup.escape="cancelRename" @blur="confirmRename" />
          <div v-else class="flex-1 min-w-0 flex flex-col relative z-10 pointer-events-none">
            <span class="text-sm text-rose-text truncate">{{ item.name }}</span>
            <span class="text-xs text-rose-text-muted truncate lg:hidden mt-0.5 flex items-center gap-1">
              <span>{{ typeLabel(item.kind) }}</span>
              <template v-if="item.itemCount !== undefined"> &bull; <span>{{ item.itemCount }} item{{ item.itemCount ===
                1 ? '' : 's' }}</span></template>
              <template v-if="item.createdAt"> &bull; <span>{{ formatRelativeTime(item.createdAt) }}</span></template>
            </span>
          </div>

          <template v-if="!item.isNew">
            <span class="w-16 text-right text-sm text-rose-text-muted shrink-0 truncate hidden lg:block">
              {{ typeLabel(item.kind) }}
            </span>
            <span class="w-20 text-right text-sm text-rose-text-muted shrink-0 hidden lg:block">
              {{ item.itemCount ?? "—" }}
            </span>
            <span class="w-28 text-right text-sm text-rose-text-muted shrink-0 truncate hidden lg:block">
              {{ item.createdAt ? formatRelativeTime(item.createdAt) : "—" }}
            </span>
            <span class="w-32 text-right text-sm text-rose-text-muted shrink-0 truncate hidden lg:block">
              {{ item.updatedAt ? formatRelativeTime(item.updatedAt) : "—" }}
            </span>
            <div class="w-14 flex justify-end gap-0.5 shrink-0 relative z-10">
              <button v-if="item.id !== 'vault'" type="button" aria-label="More options"
                class="p-1.5 rounded text-rose-text-muted hover:text-rose-text hover:bg-rose-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
                @click.stop="handleContextMenu(item, $event.currentTarget as HTMLElement)">
                <MoreVerticalIcon class="w-4 h-4" />
              </button>
            </div>
          </template>
          <template v-else>
            <span class="w-16 shrink-0 hidden lg:block"></span>
            <span class="w-20 shrink-0 hidden lg:block"></span>
            <span class="w-28 shrink-0 hidden lg:block"></span>
            <span class="w-32 shrink-0 hidden lg:block"></span>
            <div class="w-14 shrink-0"></div>
          </template>
        </div>
      </div>
    </div>
  </div>

  <ContextMenu :is-open="contextMenu.isOpen.value" :x="contextMenu.x.value" :y="contextMenu.y.value"
    @close="contextMenu.close()">
    <button v-if="contextMenu.activeItem.value?.id !== 'vault'"
      class="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-rose-text hover:bg-rose-surface-alt transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rose-primary"
      @click="handleMenuMove()">
      <FolderInputIcon class="w-4 h-4 text-rose-text-muted" /> Move to...
    </button>
    <button v-if="!contextMenu.activeItem.value?.isVaulted && contextMenu.activeItem.value?.id !== 'vault'"
      class="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-rose-text hover:bg-rose-surface-alt transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rose-primary"
      @click="handleMenuMoveToVault()">
      <LockIcon class="w-4 h-4 text-rose-text-muted" /> Move to Secure Vault
    </button>
    <button v-else-if="contextMenu.activeItem.value?.id !== 'vault'"
      class="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-rose-text hover:bg-rose-surface-alt transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rose-primary"
      @click="handleMenuRemoveFromVault()">
      <UnlockIcon class="w-4 h-4 text-rose-text-muted" /> Remove from Secure Vault
    </button>
    <button v-if="contextMenu.activeItem.value?.id !== 'vault'"
      class="flex items-center gap-2 px-3 py-2 text-sm text-rose-text hover:bg-rose-surface-alt w-full text-left focus:outline-none focus:bg-rose-surface-alt transition-colors"
      @click="handleMenuRename">
      <PencilIcon class="w-4 h-4" /> Rename
    </button>
    <button v-if="contextMenu.activeItem.value?.id !== 'vault'"
      class="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 w-full text-left focus:outline-none focus:bg-red-500/10 transition-colors"
      @click="handleMenuDelete">
      <TrashIcon class="w-4 h-4" /> Delete
    </button>
  </ContextMenu>
</template>

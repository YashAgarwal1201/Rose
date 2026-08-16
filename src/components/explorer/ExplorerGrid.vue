<!-- src/components/ExplorerGrid.vue -->
<script setup lang="ts">
import { type Component, computed, nextTick, ref } from "vue";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  FolderIcon,
  LayoutGridIcon,
  ListIcon,
  MoreVerticalIcon,
  PencilIcon,
  TrashIcon,
} from "@lucide/vue";
import { useConfirm } from "@/composables/ui/useConfirm.ts";
import { useToast } from "@/composables/ui/useToast.ts";
import ContextMenu from "@/components/ui/ContextMenu.vue";
import { useContextMenu, vLongPress } from "@/composables/ui/useContextMenu.ts";
import { useExplorerViewMode } from "@/composables/explorer/useExplorerViewMode.ts";
import { formatRelativeTime } from "@/utils/formatRelativeTime";

interface GridFolder {
  id: string;
  name: string;
  itemCount?: number;
  updatedAt?: number;
  createdAt?: number;
}
interface GridFile {
  id: string;
  name: string;
  itemCount?: number;
  updatedAt?: number;
  createdAt?: number;
  thumbnail?: string | null; // NEW
}

interface DisplayItem {
  kind: "folder" | "file";
  id: string;
  name: string;
  itemCount?: number;
  updatedAt?: number;
  createdAt?: number;
  isNew?: boolean;
  thumbnail?: string | null;
}
interface RenameOptions {
  kind: "folder" | "file";
  id: string;
  currentName: string;
  event: Event;
}

const { folders, files, fileIcon, fileLabel } = defineProps<{
  folders: GridFolder[];
  files: GridFile[];
  fileIcon: Component;
  fileLabel: string;
}>();

const emit = defineEmits<{
  openFolder: [id: string];
  openFile: [id: string];
  createFolder: [name: string];
  renameFolder: [id: string, name: string];
  deleteFolder: [id: string];
  createFile: [name: string];
  renameFile: [id: string, name: string];
  deleteFile: [id: string];
}>();

const { confirm } = useConfirm();
const { showToast } = useToast();
const { viewMode, sortKey, sortDir, toggleViewMode, setSortKey } = useExplorerViewMode();

const creatingType = ref<"folder" | "file" | null>(null);
const newName = ref("");

const vFocus = {
  mounted: (el: HTMLElement) => el.focus()
};

const renamingId = ref<string | null>(null);
const renamingKind = ref<"folder" | "file" | null>(null);
const renamingName = ref("");
const newItemInputRef = ref<HTMLInputElement | HTMLInputElement[] | null>(null);

function sortItems<Item extends { name: string; updatedAt?: number }>(items: Item[]): Item[] {
  const sorted = [...items].toSorted((itemA, itemB) => {
    if (sortKey.value === "name") {
      return itemA.name.localeCompare(itemB.name);
    }
    return (itemA.updatedAt ?? 0) - (itemB.updatedAt ?? 0);
  });
  return sortDir.value === "asc" ? sorted : sorted.toReversed();
}

const sortedFolders = computed(() => sortItems(folders));
const sortedFiles = computed(() => sortItems(files));

const displayItems = computed<DisplayItem[]>(() => {
  const folderItems: DisplayItem[] = sortedFolders.value.map((f) => ({
    createdAt: f.createdAt,
    id: f.id,
    itemCount: f.itemCount,
    kind: "folder",
    name: f.name,
    updatedAt: f.updatedAt,
  }));
  const fileItems: DisplayItem[] = sortedFiles.value.map((f) => ({
    createdAt: f.createdAt,
    id: f.id,
    itemCount: f.itemCount,
    kind: "file",
    name: f.name,
    thumbnail: f.thumbnail, // NEW
    updatedAt: f.updatedAt,
  }));

  const placeholder: DisplayItem | null = creatingType.value
    ? { id: "__new__", isNew: true, kind: creatingType.value, name: "" }
    : null;

  if (placeholder?.kind === "folder") {
    return [placeholder, ...folderItems, ...fileItems];
  }
  if (placeholder?.kind === "file") {
    return [...folderItems, placeholder, ...fileItems];
  }
  return [...folderItems, ...fileItems];
});

const isEmpty = computed(() => folders.length === 0 && files.length === 0 && !creatingType.value);

function typeLabel(kind: "folder" | "file"): string {
  return kind === "folder" ? "Folder" : fileLabel[0]?.toUpperCase() + fileLabel?.slice(1);
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

function startCreate(type: "folder" | "file") {
  creatingType.value = type;
  newName.value = "";
  focusAndScrollToNewInput();
}

function confirmCreate() {
  const name = newName.value.trim();
  if (name) {
    if (creatingType.value === "folder") {
      emit("createFolder", name);
    } else if (creatingType.value === "file") {
      emit("createFile", name);
    }
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
  if (name && renamingId.value !== null) {
    if (renamingKind.value === "folder") {
      emit("renameFolder", renamingId.value, name);
    } else {
      emit("renameFile", renamingId.value, name);
    }
  }
  renamingId.value = null;
}

function cancelRename() {
  renamingId.value = null;
}

async function handleDeleteFolder(id: string, name: string, event: Event) {
  event.stopPropagation();
  const confirmed = await confirm({
    confirmLabel: "Delete",
    message: `Delete "${name}" and everything inside it? This can't be undone.`,
    title: "Delete folder",
  });
  if (!confirmed) {
    return;
  }
  emit("deleteFolder", id);
  showToast(`Deleted "${name}"`, "info");
}

async function handleDeleteFile(id: string, name: string, event: Event) {
  event.stopPropagation();
  const confirmed = await confirm({
    confirmLabel: "Delete",
    message: `Delete "${name}"? This can't be undone.`,
    title: `Delete ${fileLabel}`,
  });
  if (!confirmed) {
    return;
  }
  emit("deleteFile", id);
  showToast(`Deleted "${name}"`, "info");
}

function handleOpen(item: DisplayItem) {
  if (item.kind === "folder") {
    emit("openFolder", item.id);
  } else {
    emit("openFile", item.id);
  }
}

function handleStartRename(item: DisplayItem, event: Event) {
  startRename({ currentName: item.name, event, id: item.id, kind: item.kind });
}

function handleDelete(item: DisplayItem, event: Event) {
  if (item.kind === "folder") {
    handleDeleteFolder(item.id, item.name, event);
  } else {
    handleDeleteFile(item.id, item.name, event);
  }
}

function isRenaming(item: DisplayItem) {
  return renamingId.value === item.id && renamingKind.value === item.kind;
}

const contextMenu = useContextMenu<DisplayItem>();

function handleContextMenu(item: DisplayItem, event: MouseEvent | PointerEvent | HTMLElement) {
  if (item.isNew || isRenaming(item)) return;
  contextMenu.open(item, event);
}

const mockEvent = { stopPropagation: () => {} } as Event;

function handleMenuRename() {
  const item = contextMenu.activeItem.value;
  if (!item) return;
  contextMenu.close();
  startRename({ currentName: item.name, event: mockEvent, id: item.id, kind: item.kind });
}

function handleMenuDelete() {
  const item = contextMenu.activeItem.value;
  if (!item) return;
  contextMenu.close();
  handleDelete(item, mockEvent);
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
          @click="setSortKey('name')"
        >
          Name
          <ChevronUpIcon v-if="sortKey === 'name' && sortDir === 'asc'" class="w-3.5 h-3.5" />
          <ChevronDownIcon v-else-if="sortKey === 'name'" class="w-3.5 h-3.5" />
        </button>
        <button
          class="flex items-center gap-1 px-2 py-1.5 rounded-md text-sm text-rose-text-muted hover:bg-rose-surface-alt hover:text-rose-text transition-colors"
          @click="setSortKey('updatedAt')"
        >
          Modified
          <ChevronUpIcon v-if="sortKey === 'updatedAt' && sortDir === 'asc'" class="w-3.5 h-3.5" />
          <ChevronDownIcon v-else-if="sortKey === 'updatedAt'" class="w-3.5 h-3.5" />
        </button>

        <div class="w-px h-5 bg-rose-border mx-1"></div>

        <button
          class="p-1.5 rounded-md transition-colors"
          :class="
            viewMode === 'grid'
              ? 'bg-rose-surface-alt text-rose-primary'
              : 'text-rose-text-muted hover:bg-rose-surface-alt hover:text-rose-text'
          "
          title="Grid view"
          @click="viewMode = 'grid'"
        >
          <LayoutGridIcon class="w-4 h-4" />
        </button>
        <button
          class="p-1.5 rounded-md transition-colors"
          :class="
            viewMode === 'list'
              ? 'bg-rose-surface-alt text-rose-primary'
              : 'text-rose-text-muted hover:bg-rose-surface-alt hover:text-rose-text'
          "
          title="List view"
          @click="
            toggleViewMode();
            viewMode = 'list';
          "
        >
          <ListIcon class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div v-if="isEmpty" class="text-base text-rose-text-muted italic py-8 text-center">
      This folder is empty.
    </div>

    <!-- Grid view -->
    <div
      v-else-if="viewMode === 'grid'"
      class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1"
      role="list"
    >
      <div
        v-for="item in displayItems"
        :key="item.kind + '-' + item.id"
        class="group relative flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-rose-surface-alt transition-colors focus-within:bg-rose-surface-alt"
        role="listitem"
        v-long-press="(e: PointerEvent | MouseEvent) => handleContextMenu(item, e)"
      >
        <button
          v-if="!item.isNew && !isRenaming(item)"
          type="button"
          class="absolute inset-0 w-full h-full rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary z-0"
          :aria-label="'Open ' + item.name"
          @click="handleOpen(item)"
        ></button>

        <img
          v-if="item.kind === 'file' && item.thumbnail"
          :src="item.thumbnail"
          class="w-12 h-12 shrink-0 object-cover rounded border border-rose-border relative z-10 pointer-events-none"
          alt=""
        />
        <component
          v-else
          :is="item.kind === 'folder' ? FolderIcon : fileIcon"
          class="w-12 h-12 shrink-0 relative z-10 pointer-events-none"
          :class="item.kind === 'folder' ? 'text-rose-primary' : 'text-rose-text-muted'"
        />

        <input
          v-if="item.isNew"
          v-model="newName"
          ref="newItemInputRef"
          type="text"
          v-focus
          aria-label="New item name"
          :placeholder="item.kind === 'folder' ? 'Folder name' : `${fileLabel} name`"
          class="text-sm w-full text-center px-1 py-0.5 rounded border border-rose-primary bg-rose-surface text-rose-text focus:outline-none focus:ring-2 focus:ring-rose-primary/50 relative z-10"
          @click.stop
          @keyup.enter="confirmCreate"
          @keyup.escape="cancelCreate"
          @blur="confirmCreate"
        />
        <input
          v-else-if="isRenaming(item)"
          v-model="renamingName"
          type="text"
          v-focus
          aria-label="Rename item"
          class="text-sm w-full text-center px-1 py-0.5 rounded border border-rose-primary bg-rose-surface text-rose-text focus:outline-none focus:ring-2 focus:ring-rose-primary/50 relative z-10"
          @click.stop
          @keyup.enter="confirmRename"
          @keyup.escape="cancelRename"
          @blur="confirmRename"
        />
        <span v-else class="text-sm text-rose-text text-center truncate w-full relative z-10 pointer-events-none">{{
          item.name
        }}</span>

        <div
          v-if="!item.isNew"
          class="flex items-center gap-1 shrink-0 relative z-10"
        >
          <button
            type="button"
            aria-label="More options"
            class="p-1.5 rounded text-rose-text-muted hover:text-rose-text hover:bg-rose-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
            @click.stop="handleContextMenu(item, $event.currentTarget as HTMLElement)"
          >
            <MoreVerticalIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- List view -->
    <div v-else class="flex flex-col">
      <div
        class="flex items-center gap-3 px-3 py-1.5 text-xs font-medium text-rose-text-muted border-b border-rose-border"
      >
        <span class="flex-1">Name</span>
        <span class="w-16 text-right shrink-0">Type</span>
        <span class="w-20 text-right shrink-0">Items</span>
        <span class="w-28 text-right shrink-0">Created</span>
        <span class="w-32 text-right shrink-0">Modified</span>
        <span class="w-14 shrink-0"></span>
      </div>

      <div role="list" class="flex flex-col">
        <div
          v-for="item in displayItems"
          :key="item.kind + '-' + item.id"
          class="group relative flex items-center gap-3 px-3 py-2 rounded-md hover:bg-rose-surface-alt transition-colors"
          role="listitem"
          v-long-press="(e: PointerEvent | MouseEvent) => handleContextMenu(item, e)"
        >
        <button
          v-if="!item.isNew && !isRenaming(item)"
          type="button"
          class="absolute inset-0 w-full h-full rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary z-0"
          :aria-label="'Open ' + item.name"
          @click="handleOpen(item)"
        ></button>

        <img
          v-if="item.kind === 'file' && item.thumbnail"
          :src="item.thumbnail"
          class="w-5 h-5 shrink-0 object-cover rounded relative z-10 pointer-events-none"
          alt=""
        />
        <component
          v-else
          :is="item.kind === 'folder' ? FolderIcon : fileIcon"
          class="w-5 h-5 shrink-0 relative z-10 pointer-events-none"
          :class="item.kind === 'folder' ? 'text-rose-primary' : 'text-rose-text-muted'"
        />

        <input
          v-if="item.isNew"
          v-model="newName"
          ref="newItemInputRef"
          type="text"
          v-focus
          aria-label="New item name"
          :placeholder="item.kind === 'folder' ? 'Folder name' : `${fileLabel} name`"
          class="flex-1 text-sm px-2 py-1 rounded border border-rose-primary bg-rose-surface text-rose-text focus:outline-none focus:ring-2 focus:ring-rose-primary/50 relative z-10"
          @click.stop
          @keyup.enter="confirmCreate"
          @keyup.escape="cancelCreate"
          @blur="confirmCreate"
        />
        <input
          v-else-if="isRenaming(item)"
          v-model="renamingName"
          type="text"
          v-focus
          aria-label="Rename item"
          class="flex-1 text-sm px-2 py-1 rounded border border-rose-primary bg-rose-surface text-rose-text focus:outline-none focus:ring-2 focus:ring-rose-primary/50 relative z-10"
          @click.stop
          @keyup.enter="confirmRename"
          @keyup.escape="cancelRename"
          @blur="confirmRename"
        />
        <span v-else class="flex-1 text-sm text-rose-text truncate relative z-10 pointer-events-none">{{ item.name }}</span>

        <template v-if="!item.isNew">
          <span class="w-16 text-right text-sm text-rose-text-muted shrink-0 truncate">
            {{ typeLabel(item.kind) }}
          </span>
          <span class="w-20 text-right text-sm text-rose-text-muted shrink-0">
            {{ item.itemCount ?? "—" }}
          </span>
          <span class="w-28 text-right text-sm text-rose-text-muted shrink-0 truncate">
            {{ item.createdAt ? formatRelativeTime(item.createdAt) : "—" }}
          </span>
          <span class="w-32 text-right text-sm text-rose-text-muted shrink-0 truncate">
            {{ item.updatedAt ? formatRelativeTime(item.updatedAt) : "—" }}
          </span>
          <div
            class="w-14 flex justify-end gap-0.5 shrink-0 relative z-10"
          >
            <button
              type="button"
              aria-label="More options"
              class="p-1.5 rounded text-rose-text-muted hover:text-rose-text hover:bg-rose-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
              @click.stop="handleContextMenu(item, $event.currentTarget as HTMLElement)"
            >
              <MoreVerticalIcon class="w-4 h-4" />
            </button>
          </div>
        </template>
        <template v-else>
          <span class="w-16 shrink-0"></span>
          <span class="w-20 shrink-0"></span>
          <span class="w-28 shrink-0"></span>
          <span class="w-32 shrink-0"></span>
          <span class="w-14 shrink-0"></span>
        </template>
      </div>
      </div>
    </div>
  </div>

  <ContextMenu
    :is-open="contextMenu.isOpen.value"
    :x="contextMenu.x.value"
    :y="contextMenu.y.value"
    @close="contextMenu.close()"
  >
    <button
      class="flex items-center gap-2 px-3 py-2 text-sm text-rose-text hover:bg-rose-surface-alt w-full text-left focus:outline-none focus:bg-rose-surface-alt transition-colors"
      @click="handleMenuRename"
    >
      <PencilIcon class="w-4 h-4" /> Rename
    </button>
    <button
      class="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 w-full text-left focus:outline-none focus:bg-red-500/10 transition-colors"
      @click="handleMenuDelete"
    >
      <TrashIcon class="w-4 h-4" /> Delete
    </button>
  </ContextMenu>
</template>

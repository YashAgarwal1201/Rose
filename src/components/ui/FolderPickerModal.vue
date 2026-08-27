<!-- src/components/ui/FolderPickerModal.vue -->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ChevronDownIcon, ChevronRightIcon, FolderIcon, HardDriveIcon, SearchIcon, XIcon } from "@lucide/vue";
import { useFoldersStore } from "@/stores/folders";
import type { ItemKind } from "@/components/explorer/MixedExplorerGrid.vue";

export interface ItemDescriptor {
  kind: ItemKind;
  id: string;
  name: string;
  parentId: string | null;
  isVaulted?: boolean;
}

const props = defineProps<{
  isOpen: boolean;
  itemsToMove: ItemDescriptor[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "selectTarget", targetFolderId: string | null): void;
}>();

const foldersStore = useFoldersStore();
const searchQuery = ref("");
const selectedTargetId = ref<string | null>(null);
const expanded = ref<Set<string>>(new Set());

const isVaultMove = computed(() => {
  if (props.itemsToMove.length === 0) return false;
  return props.itemsToMove.every((i) => i.isVaulted);
});

// Reset selection when modal opens
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      searchQuery.value = "";
      selectedTargetId.value = null;
      const rootFolders = foldersStore.folders.filter(
        (f) => f.parentId === null && (isVaultMove.value ? f.isVaulted : !f.isVaulted)
      );
      expanded.value = new Set(rootFolders.map((f) => f.id));
    }
  },
  { immediate: true },
);


function toggleExpand(folderId: string, e?: Event) {
  if (e) e.stopPropagation();
  const next = new Set(expanded.value);
  if (next.has(folderId)) {
    next.delete(folderId);
  } else {
    next.add(folderId);
  }
  expanded.value = next;
}

// Determines if moving into candidateFolderId is invalid
function isInvalidTarget(candidateFolderId: string | null): boolean {
  for (const item of props.itemsToMove) {
    if (item.kind === "folder") {
      if (candidateFolderId === item.id) return true;
      if (candidateFolderId !== null && foldersStore.isDescendantOf(candidateFolderId, item.id)) {
        return true;
      }
    }
  }
  return false;
}

// Determines if candidateFolderId is the current parent for all items
const isCurrentLocation = computed(() => (candidateFolderId: string | null): boolean => {
  if (props.itemsToMove.length === 0) return false;
  return props.itemsToMove.every((item) => item.parentId === candidateFolderId);
});

interface FolderTreeNode {
  id: string;
  name: string;
  depth: number;
  disabled: boolean;
  isCurrent: boolean;
}

const treeNodes = computed<FolderTreeNode[]>(() => {
  const nodes: FolderTreeNode[] = [];
  const q = searchQuery.value.trim().toLowerCase();

  if (q) {
    const matches = foldersStore.folders.filter(
      (f) => f.name.toLowerCase().includes(q) && (isVaultMove.value ? f.isVaulted : !f.isVaulted)
    );
    for (const folder of matches) {
      nodes.push({
        depth: 0,
        disabled: isInvalidTarget(folder.id),
        id: folder.id,
        isCurrent: isCurrentLocation.value(folder.id),
        name: folder.name,
      });
    }
  } else {
    function walk(parentId: string | null, depth: number) {
      const children = foldersStore.folders
        .filter((f) => f.parentId === parentId)
        .filter((f) => (isVaultMove.value ? f.isVaulted : !f.isVaulted))
        .toSorted((a, b) => a.name.localeCompare(b.name));

      for (const folder of children) {
        nodes.push({
          depth,
          disabled: isInvalidTarget(folder.id),
          id: folder.id,
          isCurrent: isCurrentLocation.value(folder.id),
          name: folder.name,
        });

        if (expanded.value.has(folder.id)) {
          walk(folder.id, depth + 1);
        }
      }
    }
    walk(null, 0);
  }

  return nodes;
});

function hasChildren(folderId: string): boolean {
  return foldersStore.folders.some((f) => f.parentId === folderId);
}

function handleSelect(folderId: string | null, disabled: boolean) {
  if (disabled) return;
  selectedTargetId.value = folderId;
}

function handleConfirm() {
  emit("selectTarget", selectedTargetId.value);
}

const modalTitle = computed(() => {
  if (props.itemsToMove.length === 1 && props.itemsToMove[0]) {
    return `Move "${props.itemsToMove[0].name}"`;
  }
  return `Move ${props.itemsToMove.length} items`;
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      @click.self="emit('close')"
      @keydown.escape="emit('close')"
    >
      <div
        class="bg-rose-surface border border-rose-border rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        :aria-label="modalTitle"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-rose-border shrink-0">
          <h2 class="text-lg font-bold text-rose-text truncate">{{ modalTitle }}</h2>
          <button
            type="button"
            class="p-1 rounded-md text-rose-text-muted hover:text-rose-text hover:bg-rose-surface-alt transition-colors"
            aria-label="Close modal"
            @click="emit('close')"
          >
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Search input -->
        <div class="px-5 pt-3 pb-2 shrink-0">
          <div class="relative">
            <SearchIcon class="w-4 h-4 text-rose-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search destination folder..."
              class="w-full pl-9 pr-3 py-2 rounded-lg bg-rose-surface-alt border border-rose-border text-sm text-rose-text placeholder:text-rose-text-muted focus:outline-none focus:ring-2 focus:ring-rose-primary"
            />
          </div>
        </div>

        <!-- Folder tree content -->
        <div class="flex-1 overflow-y-auto px-5 py-2 space-y-1">
          <!-- Root item ("Files") -->
          <button
            type="button"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors border"
            :class="[
              selectedTargetId === null
                ? 'bg-rose-primary/10 border-rose-primary text-rose-primary shadow-sm'
                : 'border-transparent text-rose-text hover:bg-rose-surface-alt',
              isCurrentLocation(null) && selectedTargetId !== null ? 'opacity-50' : '',
            ]"
            :disabled="isVaultMove"
            @click="handleSelect(null, isVaultMove)"
          >
            <div class="w-5 h-5 flex items-center justify-center shrink-0">
              <HardDriveIcon class="w-4.5 h-4.5" />
            </div>
            <span class="text-sm font-medium">Root</span>
            <span
              v-if="isCurrentLocation(null)"
              class="ml-auto text-xs font-medium text-rose-text-muted bg-rose-bg px-2 py-0.5 rounded-full"
            >
              Current
            </span>
          </button>

          <!-- Tree nodes -->
          <div
            v-for="node in treeNodes"
            :key="node.id"
            :data-folder-id="node.id"
            class="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors border select-none"

            :class="[
              selectedTargetId === node.id
                ? 'bg-rose-primary/10 border-rose-primary text-rose-primary font-medium'
                : 'border-transparent text-rose-text hover:bg-rose-surface-alt',
              node.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
            ]"
            :style="{ paddingLeft: searchQuery ? '0.75rem' : `${0.75 + node.depth * 1.25}rem` }"
            @click="handleSelect(node.id, node.disabled)"
          >
            <button
              v-if="!searchQuery && hasChildren(node.id)"
              type="button"
              class="text-rose-text-muted hover:text-rose-text shrink-0 p-0.5 rounded"
              @click.stop="toggleExpand(node.id, $event)"
            >
              <ChevronDownIcon v-if="expanded.has(node.id)" class="w-4 h-4" />
              <ChevronRightIcon v-else class="w-4 h-4" />
            </button>
            <span v-else-if="!searchQuery" class="w-4 h-4 shrink-0"></span>

            <FolderIcon class="w-4 h-4 shrink-0 text-rose-primary" />
            <span class="text-sm flex-1 truncate">{{ node.name }}</span>

            <span v-if="node.disabled" class="text-xs text-rose-text-muted italic shrink-0">
              (Invalid)
            </span>
            <span v-else-if="node.isCurrent" class="text-xs text-rose-text-muted italic shrink-0">
              (Current)
            </span>
          </div>

          <div v-if="treeNodes.length === 0 && searchQuery" class="text-center py-6 text-sm text-rose-text-muted italic">
            No folders matching "{{ searchQuery }}"
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-end gap-3 px-5 py-4 border-t border-rose-border shrink-0">
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-rose-text-muted hover:text-rose-text rounded-lg hover:bg-rose-surface-alt transition-colors"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-white bg-rose-primary hover:bg-rose-primary-hover rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isCurrentLocation(selectedTargetId)"
            @click="handleConfirm"
          >
            Move Here
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

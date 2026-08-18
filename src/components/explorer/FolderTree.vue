<!-- src/components/FolderTree.vue -->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ChevronDownIcon, ChevronRightIcon, FolderIcon, PlusIcon, XIcon } from "@lucide/vue";
import { useFoldersStore } from "@/stores/folders";
import { useConfirm } from "@/composables/ui/useConfirm.ts";
import { useToast } from "@/composables/ui/useToast.ts";
import type { FeatureType } from "@/db/types";

const { type, activeFolderId } = defineProps<{
  type?: FeatureType;
  activeFolderId: string | null;
}>();

const emit = defineEmits<{ select: [folderId: string | null] }>();

const foldersStore = useFoldersStore();
const { confirm } = useConfirm();
const { showToast } = useToast();

interface TreeNode {
  id: string;
  name: string;
  depth: number;
}

const expanded = ref<Set<string>>(new Set());
const creatingParentId = ref<string | null | undefined>(undefined);
const newFolderName = ref("");
const focusedNodeId = ref<string | null>(null);

function toggleExpand(id: string, event?: Event) {
  if (event) { event.stopPropagation(); }

  const next = new Set(expanded.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }

  expanded.value = next;
}

function hasChildren(id: string): boolean {
  return foldersStore.folders.some((folder) => folder.parentId === id && (!type || folder.type === type || folder.type === "mixed"));
}

const visibleNodes = computed<TreeNode[]>(() => {
  const nodes: TreeNode[] = [];
  function walk(parentId: string | null, depth: number) {
    const children = foldersStore.folders
      .filter((folder) => folder.parentId === parentId && (!type || folder.type === type || folder.type === "mixed"))
      .toSorted((folderA, folderB) => folderA.name.localeCompare(folderB.name));
    for (const folder of children) {
      nodes.push({ depth, id: folder.id, name: folder.name });
      if (expanded.value.has(folder.id)) {
        walk(folder.id, depth + 1);
      }
    }
  }
  walk(null, 0);
  return nodes;
});

watch(() => [visibleNodes.value, activeFolderId], () => {
  if (!focusedNodeId.value && visibleNodes.value.length > 0) {
    focusedNodeId.value = activeFolderId || visibleNodes.value[0]?.id || null;
  }
}, { immediate: true });

function focusNode(id: string) {
  import("vue").then(({ nextTick }) => {
    nextTick(() => {
      const el = document.getElementById(`tree-node-${id}`);
      if (el) { el.focus(); }
    });
  });
}

function handleTreeKeydown(event: KeyboardEvent, nodeId: string) {
  const index = visibleNodes.value.findIndex((node) => node.id === nodeId);
  if (index === -1) { return; }

  switch (event.key) {
    case "ArrowDown": {
      event.preventDefault();
      if (index < visibleNodes.value.length - 1) {
        const nextNode = visibleNodes.value[index + 1];
        if (nextNode) {
          focusedNodeId.value = nextNode.id;
          focusNode(focusedNodeId.value);
        }
      }
      break;
    }
    case "ArrowUp": {
      event.preventDefault();
      if (index > 0) {
        const prevNode = visibleNodes.value[index - 1];
        if (prevNode) {
          focusedNodeId.value = prevNode.id;
          focusNode(focusedNodeId.value);
        }
      }
      break;
    }
    case "ArrowRight": {
      event.preventDefault();
      if (hasChildren(nodeId)) {
        if (!expanded.value.has(nodeId)) {
          expanded.value = new Set(expanded.value).add(nodeId);
        } else if (index < visibleNodes.value.length - 1) {
          const nextNode = visibleNodes.value[index + 1];
          if (nextNode) {
            focusedNodeId.value = nextNode.id;
            focusNode(focusedNodeId.value);
          }
        }
      }
      break;
    }
    case "ArrowLeft": {
      event.preventDefault();
      if (expanded.value.has(nodeId)) {
        const next = new Set(expanded.value);
        next.delete(nodeId);
        expanded.value = next;
      } else {
        const parentId = foldersStore.folders.find((folder) => folder.id === nodeId)?.parentId;
        if (parentId) {
          focusedNodeId.value = parentId;
          focusNode(parentId);
        }
      }
      break;
    }
    case "Enter":
    case " ": {
      event.preventDefault();
      emit("select", nodeId);
      break;
    }
  }
}

function startCreating(parentId: string | null) {
  creatingParentId.value = parentId;
  newFolderName.value = "";
}

async function confirmCreate() {
  const name = newFolderName.value.trim();
  if (name && creatingParentId.value !== undefined) {
    try {
      await foldersStore.createFolder(name, creatingParentId.value, type || "mixed");
      if (creatingParentId.value) {
        expanded.value = new Set(expanded.value).add(creatingParentId.value);
      }
      showToast(`Created folder "${name}"`, "success");
    } catch (error) {
      showToast((error as Error).message, "error");
    }
  }
  creatingParentId.value = undefined;
}

function cancelCreate() {
  creatingParentId.value = undefined;
}

async function handleDelete(id: string, name: string, event: Event) {
  event.stopPropagation();
  const confirmed = await confirm({
    confirmLabel: "Delete",
    message: `Delete "${name}" and everything inside it? This can't be undone.`,
    title: "Delete folder",
  });
  if (!confirmed) {
    return;
  }
  await foldersStore.deleteFolder(id);
  showToast(`Deleted "${name}"`, "info");
}
</script>
<template>
  <div>
    <ul class="space-y-0.5" role="tree" aria-label="Folders">
      <li v-for="node in visibleNodes" :key="node.id" :id="`tree-node-${node.id}`" role="treeitem"
        :aria-level="node.depth + 1" :aria-selected="node.id === activeFolderId"
        :aria-expanded="hasChildren(node.id) ? expanded.has(node.id) : undefined"
        :tabindex="node.id === (focusedNodeId || visibleNodes[0]?.id) ? 0 : -1"
        class="rounded relative outline-none focus-visible:ring-2 focus-visible:ring-rose-primary cursor-pointer select-none"
        :class="node.id === activeFolderId ? 'bg-rose-surface-alt' : ''" @click="emit('select', node.id)"
        @keydown="handleTreeKeydown($event, node.id)">
        <div class="flex items-center gap-1 px-2 py-1.5 group"
          :style="{ paddingLeft: `${0.5 + node.depth * 1.25}rem` }">
          <button v-if="hasChildren(node.id)" type="button" tabindex="-1"
            class="text-rose-text-muted hover:text-rose-text shrink-0 relative z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary rounded"
            aria-label="Toggle folder expansion" @click.stop="toggleExpand(node.id)">
            <ChevronDownIcon v-if="expanded.has(node.id)" class="w-4 h-4" />
            <ChevronRightIcon v-else class="w-4 h-4" />
          </button>
          <span v-else class="w-4 h-4 shrink-0 relative z-10"></span>

          <FolderIcon class="w-4 h-4 text-rose-primary shrink-0 relative z-10 pointer-events-none" />
          <span class="text-base text-rose-text truncate flex-1 relative z-10 pointer-events-none">{{ node.name
          }}</span>

          <button type="button" tabindex="-1"
            class="opacity-100 text-rose-text-muted hover:text-rose-primary shrink-0 relative z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary rounded transition-opacity"
            :class="node.id === activeFolderId ? 'opacity-100!' : '[@media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-within:opacity-100'"
            title="New subfolder" aria-label="New subfolder" @click.stop="startCreating(node.id)">
            <PlusIcon class="w-4 h-4" />
          </button>
          <button type="button" tabindex="-1"
            class="opacity-100 text-rose-text-muted hover:text-rose-primary shrink-0 relative z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary rounded transition-opacity"
            :class="node.id === activeFolderId ? 'opacity-100!' : '[@media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-within:opacity-100'"
            title="Delete folder" aria-label="Delete folder" @click.stop="handleDelete(node.id, node.name, $event)">
            <XIcon class="w-4 h-4" />
          </button>
        </div>

        <div v-if="creatingParentId === node.id" class="flex items-center gap-1 py-1"
          :style="{ paddingLeft: `${0.5 + (node.depth + 1) * 1.25}rem` }">
          <input v-model="newFolderName" type="text" autofocus aria-label="New folder name" placeholder="Folder name"
            class="text-base px-2 py-1 rounded border border-rose-border bg-rose-surface text-rose-text focus:outline-none focus:ring-1 focus:ring-rose-primary w-36 relative z-10"
            @click.stop @keyup.enter="confirmCreate" @keyup.escape="cancelCreate" />
          <button type="button" aria-label="Confirm creation"
            class="text-sm text-rose-primary hover:text-rose-primary-hover relative z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary rounded px-1"
            @click.stop="confirmCreate">
            ✓
          </button>
          <button type="button" aria-label="Cancel creation"
            class="text-sm text-rose-text-muted hover:text-rose-text relative z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary rounded px-1"
            @click.stop="cancelCreate">
            ✕
          </button>
        </div>
      </li>
    </ul>

    <div v-if="creatingParentId === null" class="flex items-center gap-1 mt-1 px-2">
      <input v-model="newFolderName" type="text" autofocus aria-label="New folder name" placeholder="Folder name"
        class="text-base px-2 py-1 rounded border border-rose-border bg-rose-surface text-rose-text focus:outline-none focus:ring-1 focus:ring-rose-primary w-36"
        @keyup.enter="confirmCreate" @keyup.escape="cancelCreate" />
      <button type="button" aria-label="Confirm creation"
        class="text-sm text-rose-primary hover:text-rose-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary rounded px-1"
        @click="confirmCreate">
        ✓
      </button>
      <button type="button" aria-label="Cancel creation"
        class="text-sm text-rose-text-muted hover:text-rose-text focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary rounded px-1"
        @click="cancelCreate">
        ✕
      </button>
    </div>
    <button v-else class="text-sm text-rose-primary hover:text-rose-primary-hover mt-1 px-2"
      @click="startCreating(null)">
      + New folder
    </button>
  </div>
</template>

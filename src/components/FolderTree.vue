<!-- src/components/FolderTree.vue -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { ChevronDownIcon, ChevronRightIcon, FolderIcon, PlusIcon, XIcon } from "@lucide/vue";
import { useFoldersStore } from "../stores/folders";
import { useConfirm } from "../composables/useConfirm";
import { useToast } from "../composables/useToast";
import type { FeatureType } from "../db/types";

const { type, activeFolderId } = defineProps<{
  type: FeatureType;
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

function toggleExpand(id: string, event: Event) {
  event.stopPropagation();

  const next = new Set(expanded.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }

  expanded.value = next;
}

function hasChildren(id: string): boolean {
  return foldersStore.folders.some((folder) => folder.parentId === id && folder.type === type);
}

const visibleNodes = computed<TreeNode[]>(() => {
  const nodes: TreeNode[] = [];
  function walk(parentId: string | null, depth: number) {
    const children = foldersStore.folders
      .filter((folder) => folder.parentId === parentId && folder.type === type)
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

function startCreating(parentId: string | null) {
  creatingParentId.value = parentId;
  newFolderName.value = "";
}

async function confirmCreate() {
  const name = newFolderName.value.trim();
  if (name && creatingParentId.value !== undefined) {
    try {
      await foldersStore.createFolder(name, creatingParentId.value, type);
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
    <ul class="space-y-0.5">
      <li
        v-for="node in visibleNodes"
        :key="node.id"
        class="rounded"
        :class="node.id === activeFolderId ? 'bg-rose-surface-alt' : ''"
      >
        <div
          class="flex items-center gap-1 px-2 py-1.5 cursor-pointer group"
          :style="{ paddingLeft: `${0.5 + node.depth * 1.25}rem` }"
          @click="emit('select', node.id)"
        >
          <button
            v-if="hasChildren(node.id)"
            class="text-rose-text-muted hover:text-rose-text shrink-0"
            @click="toggleExpand(node.id, $event)"
          >
            <ChevronDownIcon v-if="expanded.has(node.id)" class="w-4 h-4" />
            <ChevronRightIcon v-else class="w-4 h-4" />
          </button>
          <span v-else class="w-4 h-4 shrink-0"></span>

          <FolderIcon class="w-4 h-4 text-rose-primary shrink-0" />
          <span class="text-base text-rose-text truncate flex-1">{{ node.name }}</span>

          <button
            class="opacity-0 group-hover:opacity-100 text-rose-text-muted hover:text-rose-primary shrink-0"
            title="New subfolder"
            @click.stop="startCreating(node.id)"
          >
            <PlusIcon class="w-4 h-4" />
          </button>
          <button
            class="opacity-0 group-hover:opacity-100 text-rose-text-muted hover:text-rose-primary shrink-0"
            title="Delete folder"
            @click="handleDelete(node.id, node.name, $event)"
          >
            <XIcon class="w-4 h-4" />
          </button>
        </div>

        <div
          v-if="creatingParentId === node.id"
          class="flex items-center gap-1 py-1"
          :style="{ paddingLeft: `${0.5 + (node.depth + 1) * 1.25}rem` }"
        >
          <input
            v-model="newFolderName"
            type="text"
            autofocus
            placeholder="Folder name"
            class="text-base px-2 py-1 rounded border border-rose-border bg-rose-surface text-rose-text focus:outline-none focus:ring-1 focus:ring-rose-primary w-36"
            @click.stop
            @keyup.enter="confirmCreate"
            @keyup.escape="cancelCreate"
          />
          <button
            class="text-sm text-rose-primary hover:text-rose-primary-hover"
            @click.stop="confirmCreate"
          >
            ✓
          </button>
          <button
            class="text-sm text-rose-text-muted hover:text-rose-text"
            @click.stop="cancelCreate"
          >
            ✕
          </button>
        </div>
      </li>
    </ul>

    <div v-if="creatingParentId === null" class="flex items-center gap-1 mt-1 px-2">
      <input
        v-model="newFolderName"
        type="text"
        autofocus
        placeholder="Folder name"
        class="text-base px-2 py-1 rounded border border-rose-border bg-rose-surface text-rose-text focus:outline-none focus:ring-1 focus:ring-rose-primary w-36"
        @keyup.enter="confirmCreate"
        @keyup.escape="cancelCreate"
      />
      <button
        class="text-sm text-rose-primary hover:text-rose-primary-hover"
        @click="confirmCreate"
      >
        ✓
      </button>
      <button class="text-sm text-rose-text-muted hover:text-rose-text" @click="cancelCreate">
        ✕
      </button>
    </div>
    <button
      v-else
      class="text-sm text-rose-primary hover:text-rose-primary-hover mt-1 px-2"
      @click="startCreating(null)"
    >
      + New folder
    </button>
  </div>
</template>

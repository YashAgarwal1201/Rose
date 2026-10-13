<!-- src/views/trash/TrashView.vue -->
<template>
  <div class="p-4 md:p-6 lg:p-8 w-full min-h-full flex flex-col">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <button
          @click="goBack"
          class="p-2 -ml-2 rounded-lg text-rose-text hover:bg-rose-surface-alt transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
          aria-label="Go back"
        >
          <ArrowLeftIcon class="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-2xl sm:text-3xl font-bold text-rose-text tracking-tight">Trash</h1>
            <span
              v-if="trashStore.trashedCount > 0"
              class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-primary/15 text-rose-primary"
            >
              {{ trashStore.trashedCount }}
            </span>

            <!-- Info button & Popover -->
            <div class="relative inline-block" ref="infoContainerRef">
              <button
                type="button"
                @click="isInfoOpen = !isInfoOpen"
                class="p-1 rounded-full text-rose-text-muted hover:text-rose-primary hover:bg-rose-surface-alt transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
                title="Trash Retention Policy"
                aria-label="Trash retention policy info"
              >
                <InfoIcon class="w-4 h-4" />
              </button>

              <div
                v-if="isInfoOpen"
                class="absolute left-0 mt-2 w-72 sm:w-80 p-3.5 rounded-xl bg-rose-surface border border-rose-border shadow-xl z-30 text-xs text-rose-text-muted"
              >
                <div class="flex items-start justify-between gap-2 mb-1.5">
                  <div class="flex items-center gap-1.5 text-rose-text font-semibold text-xs">
                    <InfoIcon class="w-3.5 h-3.5 text-rose-primary shrink-0" />
                    <span>Retention Policy</span>
                  </div>
                  <button
                    type="button"
                    @click="isInfoOpen = false"
                    class="text-rose-text-muted hover:text-rose-text p-0.5 rounded"
                    aria-label="Close retention info"
                  >
                    <XIcon class="w-3.5 h-3.5" />
                  </button>
                </div>
                <p class="leading-relaxed">
                  Items in Trash are retained for <strong class="text-rose-text">30 days</strong>, after which they are permanently deleted automatically.
                </p>
              </div>
            </div>
          </div>
          <p class="text-sm text-rose-text-muted mt-0.5">
            Recover deleted items or delete them permanently.
          </p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-3 self-end sm:self-center">
        <button
          type="button"
          :disabled="trashStore.trashedCount === 0"
          @click="handleEmptyTrash"
          class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          :class="
            trashStore.trashedCount > 0
              ? 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 active:scale-95 border border-red-500/20'
              : 'opacity-40 cursor-not-allowed bg-rose-surface-alt text-rose-text-muted border border-rose-border'
          "
        >
          <Trash2Icon class="w-4 h-4" />
          <span>Empty Trash</span>
        </button>
      </div>
    </div>

    <!-- Toolbar: Search filter on left, View toggle on right -->
    <div
      v-if="trashStore.trashedItems.length > 0"
      class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6"
    >
      <div class="relative w-full max-w-sm">
        <SearchIcon class="w-4 h-4 text-rose-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Filter trash..."
          class="w-full pl-9 pr-8 py-2 rounded-xl border border-rose-border bg-rose-surface text-sm text-rose-text placeholder:text-rose-text-muted focus:outline-none focus:ring-2 focus:ring-rose-primary transition-colors"
        />
        <button
          v-if="searchQuery"
          type="button"
          @click="searchQuery = ''"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-rose-text-muted hover:text-rose-text p-0.5 rounded"
          aria-label="Clear filter"
        >
          <XIcon class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- View Mode Toggle Buttons -->
      <div class="flex items-center self-end sm:self-auto bg-rose-surface-alt p-1 rounded-xl border border-rose-border/60">
        <button
          type="button"
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
          :class="
            viewMode === 'grid'
              ? 'bg-rose-surface text-rose-primary shadow-xs'
              : 'text-rose-text-muted hover:text-rose-text'
          "
          title="Cards view"
          aria-label="Cards view"
          @click="viewMode = 'grid'"
        >
          <LayoutGridIcon class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Cards</span>
        </button>
        <button
          type="button"
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
          :class="
            viewMode === 'list'
              ? 'bg-rose-surface text-rose-primary shadow-xs'
              : 'text-rose-text-muted hover:text-rose-text'
          "
          title="List view"
          aria-label="List view"
          @click="viewMode = 'list'"
        >
          <ListIcon class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">List</span>
        </button>
      </div>
    </div>

    <!-- Cards (Grid) view -->
    <div
      v-if="filteredItems.length > 0 && viewMode === 'grid'"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4"
    >
      <div
        v-for="item in filteredItems"
        :key="item.kind + '-' + item.id"
        class="group flex flex-col justify-between p-4 rounded-xl bg-rose-surface border border-rose-border hover:border-rose-primary/40 hover:shadow-md transition-all duration-150"
      >
        <div>
          <!-- Card Top: Icon + Days Remaining -->
          <div class="flex items-start justify-between gap-2 mb-3">
            <div class="p-2.5 rounded-lg shrink-0" :class="itemBgClass(item.kind)">
              <component :is="itemIcon(item.kind)" class="w-5 h-5" :class="itemIconClass(item.kind)" />
            </div>
            <span
              class="px-2 py-0.5 rounded-full text-[11px] font-medium border"
              :class="countdownBadgeClass(item.daysRemaining)"
            >
              {{ item.daysRemaining }} {{ item.daysRemaining === 1 ? 'day' : 'days' }} left
            </span>
          </div>

          <!-- Card Title & Kind Badge -->
          <h3 class="font-medium text-rose-text text-sm sm:text-base line-clamp-1 mb-1" :title="item.title">
            {{ item.title }}
          </h3>

          <div v-if="item.kind === 'folder' && item.childCount > 0" class="mb-2">
            <span class="inline-block px-1.5 py-0.5 rounded text-[11px] font-medium bg-rose-surface-alt text-rose-text-muted border border-rose-border">
              Folder &bull; {{ item.childCount }} {{ item.childCount === 1 ? 'item' : 'items' }}
            </span>
          </div>

          <!-- Card Metadata -->
          <div class="flex flex-col gap-0.5 text-xs text-rose-text-muted mb-4">
            <span class="truncate" :title="formatLocation(item.originalFolderPath)">
              Original: {{ formatLocation(item.originalFolderPath) }}
            </span>
            <span>Deleted {{ formatRelativeTime(item.trashedAt) }}</span>
          </div>
        </div>

        <!-- Card Actions: Restore & Delete Forever -->
        <div class="flex items-center gap-2 pt-3 border-t border-rose-border/60">
          <button
            type="button"
            @click="handleRestore(item)"
            class="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-surface-alt hover:bg-rose-surface-alt/80 text-rose-text border border-rose-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
            title="Restore to original location"
          >
            <RotateCcwIcon class="w-3.5 h-3.5 text-rose-primary" />
            <span>Restore</span>
          </button>

          <button
            type="button"
            @click="handleDeleteForever(item)"
            class="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            title="Delete permanently"
            aria-label="Delete permanently"
          >
            <Trash2Icon class="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>

    <!-- List view -->
    <div
      v-else-if="filteredItems.length > 0 && viewMode === 'list'"
      class="flex flex-col gap-2.5"
    >
      <div
        v-for="item in filteredItems"
        :key="item.kind + '-' + item.id"
        class="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-rose-surface border border-rose-border hover:border-rose-primary/40 hover:shadow-sm transition-all duration-150"
      >
        <!-- Left: Icon & Meta -->
        <div class="flex items-start sm:items-center gap-3.5 min-w-0">
          <div
            class="p-2.5 rounded-lg shrink-0"
            :class="itemBgClass(item.kind)"
          >
            <component :is="itemIcon(item.kind)" class="w-5 h-5" :class="itemIconClass(item.kind)" />
          </div>

          <div class="flex flex-col min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-medium text-rose-text text-sm sm:text-base truncate max-w-xs sm:max-w-md lg:max-w-2xl">
                {{ item.title }}
              </span>
              <span
                v-if="item.kind === 'folder' && item.childCount > 0"
                class="px-2 py-0.5 rounded-md text-xs font-medium bg-rose-surface-alt text-rose-text-muted border border-rose-border"
              >
                Folder &bull; {{ item.childCount }} {{ item.childCount === 1 ? 'item' : 'items' }}
              </span>
            </div>

            <div class="flex items-center gap-2 text-xs text-rose-text-muted mt-0.5 flex-wrap">
              <span>Original: {{ formatLocation(item.originalFolderPath) }}</span>
              <span>&bull;</span>
              <span>Deleted {{ formatRelativeTime(item.trashedAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Right: Badges & Action Buttons -->
        <div class="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-rose-border/50">
          <!-- Days Remaining Badge -->
          <span
            class="px-2.5 py-1 rounded-full text-xs font-medium border"
            :class="countdownBadgeClass(item.daysRemaining)"
          >
            {{ item.daysRemaining }} {{ item.daysRemaining === 1 ? 'day' : 'days' }} left
          </span>

          <!-- Actions -->
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              @click="handleRestore(item)"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-rose-surface-alt hover:bg-rose-surface-alt/80 text-rose-text border border-rose-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
              title="Restore to original location"
            >
              <RotateCcwIcon class="w-3.5 h-3.5 text-rose-primary" />
              <span>Restore</span>
            </button>

            <button
              type="button"
              @click="handleDeleteForever(item)"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              title="Delete permanently"
            >
              <Trash2Icon class="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="trashStore.trashedItems.length === 0"
      class="flex flex-col items-center justify-center py-24 text-center my-auto"
    >
      <div class="p-4 rounded-full bg-rose-surface-alt border border-rose-border mb-4">
        <Trash2Icon class="w-10 h-10 text-rose-text-muted" />
      </div>
      <h3 class="text-lg font-semibold text-rose-text">Trash is empty</h3>
      <p class="text-sm text-rose-text-muted max-w-sm mt-1">
        Items you delete will appear here for 30 days before being permanently removed.
      </p>
    </div>

    <!-- Search No Results -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-20 text-center text-rose-text-muted text-sm"
    >
      <p>No trashed items matching "{{ searchQuery }}"</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowLeftIcon,
  FileTextIcon,
  FolderIcon,
  InfoIcon,
  LayoutGridIcon,
  ListIcon,
  ListTodoIcon,
  PenLineIcon,
  RotateCcwIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
} from "@lucide/vue";
import { useTrashStore, type TrashableKind, type TrashedItem } from "@/stores/trash";
import { useConfirm } from "@/composables/ui/useConfirm";
import { useExplorerViewMode } from "@/composables/explorer/useExplorerViewMode";
import { formatRelativeTime } from "@/utils/formatRelativeTime";

const router = useRouter();
const trashStore = useTrashStore();
const { confirm } = useConfirm();
const { viewMode } = useExplorerViewMode();

const searchQuery = ref("");
const isInfoOpen = ref(false);
const infoContainerRef = ref<HTMLElement | null>(null);

function handleClickOutside(event: MouseEvent) {
  if (infoContainerRef.value && !infoContainerRef.value.contains(event.target as Node)) {
    isInfoOpen.value = false;
  }
}

const filteredItems = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    return trashStore.trashedItems;
  }
  return trashStore.trashedItems.filter((item) =>
    item.title.toLowerCase().includes(query)
  );
});

function goBack() {
  router.back();
}

function itemIcon(kind: TrashableKind) {
  switch (kind) {
    case "folder":
      return FolderIcon;
    case "doc":
      return FileTextIcon;
    case "note":
      return PenLineIcon;
    case "todoList":
      return ListTodoIcon;
  }
}

function itemIconClass(kind: TrashableKind): string {
  switch (kind) {
    case "folder":
      return "text-rose-primary";
    case "doc":
      return "text-rose-cream";
    case "note":
      return "text-rose-purple";
    case "todoList":
      return "text-rose-blue";
  }
}

function itemBgClass(kind: TrashableKind): string {
  switch (kind) {
    case "folder":
      return "bg-rose-primary/10";
    case "doc":
      return "bg-rose-cream/10";
    case "note":
      return "bg-rose-purple/10";
    case "todoList":
      return "bg-rose-blue/10";
  }
}

function countdownBadgeClass(daysRemaining: number): string {
  if (daysRemaining <= 7) {
    return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
  }
  if (daysRemaining <= 14) {
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
  }
  return "bg-rose-surface-alt text-rose-text-muted border-rose-border";
}

function formatLocation(path: string[]): string {
  if (!path || path.length === 0) {
    return "Files (Root)";
  }
  return path.join(" / ");
}

async function handleRestore(item: TrashedItem) {
  await trashStore.restoreItem(item.kind, item.id);
}

async function handleDeleteForever(item: TrashedItem) {
  const ok = await confirm({
    title: "Delete Forever",
    message: `Permanently delete "${item.title}"? This cannot be undone.`,
    confirmLabel: "Delete Forever",
  });
  if (ok) {
    await trashStore.deleteForever(item.kind, item.id);
  }
}

async function handleEmptyTrash() {
  const count = trashStore.trashedCount;
  const ok = await confirm({
    title: "Empty Trash",
    message: `Permanently delete all ${count} ${count === 1 ? 'item' : 'items'} in Trash? This cannot be undone.`,
    confirmLabel: "Empty Trash",
  });
  if (ok) {
    await trashStore.emptyTrash();
  }
}

onMounted(async () => {
  await trashStore.loadTrash();
  window.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener("click", handleClickOutside);
});
</script>

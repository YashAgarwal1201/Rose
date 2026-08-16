<!-- src/views/NoteView.vue -->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowLeftIcon,
  InfoIcon,
  PanelBottomIcon,
  PanelLeftIcon,
  PanelRightIcon,
  PanelTopIcon,
  PencilIcon,
  XIcon,
} from "@lucide/vue";
import { useNotesStore } from "@/stores/notes";
import { useFoldersStore } from "@/stores/folders";
import { useToast } from "@/composables/ui/useToast.ts";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import type { Note } from "@/db/types";
import NoteCanvas from "@/components/notes/NoteCanvas.vue";
import { type ToolbarPosition, useToolbarPosition } from "@/composables/ui/useToolbarPosition.ts";

const { pathMatch } = defineProps<{ pathMatch?: string[] }>();

const router = useRouter();
const notesStore = useNotesStore();
const foldersStore = useFoldersStore();
const { showToast } = useToast();

const segments = computed(() => pathMatch ?? []);
const currentNote = ref<Note | undefined>(undefined);
const isRenaming = ref(false);
const renameValue = ref("");

const vFocus = {
  mounted: (el: HTMLElement) => el.focus()
};

const { effectivePosition, savedPosition, isMobile, setPosition } = useToolbarPosition();

const isInfoOpen = ref(false);

let activeLoadToken = 0;

const noteSize = computed(() => {
  if (!currentNote.value) { return "0 KB"; }
  const jsonStr = currentNote.value.canvasJSON ? JSON.stringify(currentNote.value.canvasJSON) : "";
  const thumbStr = currentNote.value.thumbnail || "";
  const bytes = jsonStr.length + thumbStr.length;
  if (bytes < 1024) { return `${bytes} B`; }
  if (bytes < 1024 * 1024) { return `${(bytes / 1024).toFixed(1)} KB`; }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
});

function resolveFolderId(segs: string[]): string | null | undefined {
  let cursor: string | null = null;
  for (const segment of segs) {
    const match = foldersStore.folders.find(
      (folder) =>
        folder.parentId === cursor &&
        folder.type === "note" &&
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

async function loadNote() {
  const token = ++activeLoadToken;
  try {
    await foldersStore.loadFolders("note");
  } catch (error) {
    if (token === activeLoadToken) {
      showToast((error as Error).message, "error");
    }
    return;
  }

  const segs = segments.value;
  if (segs.length === 0) {
    showToast("Note not found.", "error");
    router.replace("/notes/folder");
    return;
  }

  const folderSegments = segs.slice(0, -1);
  const noteName = segs[segs.length - 1];
  const folderId = resolveFolderId(folderSegments);

  if (folderId === undefined) {
    showToast("That note no longer exists.", "error");
    router.replace("/notes/folder");
    return;
  }

  try {
    await notesStore.loadNotes();
  } catch (error) {
    if (token === activeLoadToken) {
      showToast((error as Error).message, "error");
    }
    return;
  }
  if (token !== activeLoadToken) {
    return;
  }

  const match = notesStore.notes.find(
    (note) => note.folderId === folderId && note.title.toLowerCase() === noteName?.toLowerCase(),
  );

  if (!match) {
    showToast("That note no longer exists.", "error");
    router.replace({ name: "notes-folder", params: { pathMatch: buildFolderPath(folderId) } });
    return;
  }

  currentNote.value = match;
  // console.log("loaded note, canvasJSON:", match.canvasJSON);
  notesStore.touchNote(match.id);
}

function goBack() {
  if (!currentNote.value) {
    router.push("/notes/folder");
    return;
  }
  router.push({
    name: "notes-folder",
    params: { pathMatch: buildFolderPath(currentNote.value.folderId) },
  });
}

function startRenameTitle() {
  isRenaming.value = true;
  renameValue.value = currentNote.value?.title ?? "";
}

async function confirmRenameTitle() {
  const title = renameValue.value.trim();
  if (title && currentNote.value?.id) {
    try {
      await notesStore.updateNote(currentNote.value.id, { title });
      const updated = await notesStore.getNote(currentNote.value.id);
      currentNote.value = updated;
      if (updated) {
        router.replace({
          name: "notes-note",
          params: { pathMatch: [...buildFolderPath(updated.folderId), updated.title] },
        });
      }
    } catch (error) {
      showToast((error as Error).message, "error");
    }
  }
  isRenaming.value = false;
}

function cancelRenameTitle() {
  isRenaming.value = false;
}

async function handleCanvasChange(
  canvasJSON: Record<string, unknown>,
  backgroundColor: string,
  thumbnail: string,
) {
  if (!currentNote.value) {
    return;
  }
  await notesStore.updateNote(currentNote.value.id, { canvasJSON, backgroundColor, thumbnail });
}

onMounted(loadNote);
watch(() => pathMatch, loadNote);
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <Teleport to="body">
      <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0"
        enter-to-class="opacity-100" leave-active-class="transition-opacity duration-200" leave-from-class="opacity-100"
        leave-to-class="opacity-0">
        <div v-if="isInfoOpen" role="dialog" aria-modal="true" aria-labelledby="info-dialog-title"
          class="fixed inset-0 z-210 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4"
          @click.self="isInfoOpen = false" @keydown.escape="isInfoOpen = false">
          <div class="bg-rose-surface rounded-xl shadow-2xl w-full max-w-sm p-6 border border-rose-border">
            <div class="flex items-center justify-between mb-4">
              <h3 id="info-dialog-title" class="text-lg font-semibold text-rose-text">Note properties</h3>
              <button type="button" aria-label="Close properties"
                class="text-rose-text-muted hover:text-rose-text focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary rounded p-0.5"
                @click="isInfoOpen = false">
                <XIcon class="w-5 h-5" />
              </button>
            </div>

            <dl class="space-y-3 text-sm">
              <div class="flex justify-between">
                <dt class="text-rose-text-muted">Created</dt>
                <dd class="text-rose-text font-medium">{{ new Date(currentNote?.createdAt ?? 0).toLocaleString() }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-rose-text-muted">Last modified</dt>
                <dd class="text-rose-text font-medium">{{ new Date(currentNote?.updatedAt ?? 0).toLocaleString() }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-rose-text-muted">Estimated size</dt>
                <dd class="text-rose-text font-medium">{{ noteSize }}</dd>
              </div>
            </dl>

            <div class="mt-6 pt-4 border-t border-rose-border">
              <h4 class="text-sm font-medium text-rose-text mb-2">Touch controls</h4>
              <p class="text-sm text-rose-text-muted">
                Use 2 fingers to pan and scroll the canvas on touch devices. Single finger is reserved for drawing.
              </p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <div class="flex items-center gap-2 px-4 pt-4 pb-2 md:px-6 shrink-0 relative z-20">
      <button class="flex items-center gap-1.5 text-sm text-rose-text-muted hover:text-rose-text transition-colors"
        @click="goBack">
        <ArrowLeftIcon class="w-4 h-4" />
      </button>

      <div class="flex items-center gap-2 flex-1 min-w-0 ml-2 group">
        <input v-if="isRenaming" v-model="renameValue" type="text" v-focus
          class="text-xl font-bold bg-transparent border-b-2 border-rose-primary text-rose-text focus:outline-none min-w-0 flex-1"
          @keyup.enter="confirmRenameTitle" @keyup.escape="cancelRenameTitle" @blur="confirmRenameTitle" />
        <template v-else>
          <h1 class="text-xl font-bold text-rose-text truncate">{{ currentNote?.title }}</h1>
          <button
            class="opacity-0 group-hover:opacity-100 text-rose-text-muted hover:text-rose-primary transition-opacity shrink-0"
            @click="startRenameTitle">
            <PencilIcon class="w-4 h-4" />
          </button>
        </template>
      </div>

      <span v-if="currentNote" class="text-xs text-rose-text-muted shrink-0">
        Saved {{ formatRelativeTime(currentNote.updatedAt) }}
      </span>

      <div v-if="!isMobile" class="flex items-center gap-0.5 ml-2 shrink-0">
        <button v-for="pos in ['top', 'left', 'right', 'bottom'] as ToolbarPosition[]" :key="pos"
          :title="`Toolbar ${pos}`" class="p-1 rounded transition-colors" :class="savedPosition === pos
            ? 'text-rose-primary'
            : 'text-rose-text-muted hover:text-rose-text'
            " @click="setPosition(pos)">
          <PanelTopIcon v-if="pos === 'top'" class="w-4 h-4" />
          <PanelBottomIcon v-else-if="pos === 'bottom'" class="w-4 h-4" />
          <PanelLeftIcon v-else-if="pos === 'left'" class="w-4 h-4" />
          <PanelRightIcon v-else-if="pos === 'right'" class="w-4 h-4" />
        </button>
      </div>

      <div class="relative ml-1">
        <button
          class="p-1.5 text-rose-text-muted hover:text-rose-text hover:bg-rose-surface-alt rounded-md transition-colors"
          title="Note information" @click="isInfoOpen = true">
          <InfoIcon class="w-4.5 h-4.5" />
        </button>
      </div>
    </div>

    <NoteCanvas v-if="currentNote" :key="currentNote.id" :initial-canvas-json="currentNote.canvasJSON"
      :initial-background-color="currentNote.backgroundColor" :toolbar-position="effectivePosition"
      :note-title="currentNote.title" @change="handleCanvasChange" />
  </div>
</template>

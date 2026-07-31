<!-- src/views/NoteView.vue -->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowLeftIcon,
  PanelBottomIcon,
  PanelLeftIcon,
  PanelRightIcon,
  PanelTopIcon,
  PencilIcon,
} from "@lucide/vue";
import { useNotesStore } from "../stores/notes";
import { useFoldersStore } from "../stores/folders";
import { useToast } from "../composables/useToast";
import { formatRelativeTime } from "../utils/formatRelativeTime";
import type { Note } from "../db/types";
import NoteCanvas from "../components/NoteCanvas.vue";
import { type ToolbarPosition, useToolbarPosition } from "../composables/useToolbarPosition";

const { pathMatch } = defineProps<{ pathMatch?: string[] }>();

const router = useRouter();
const notesStore = useNotesStore();
const foldersStore = useFoldersStore();
const { showToast } = useToast();

const segments = computed(() => pathMatch ?? []);
const currentNote = ref<Note | undefined>(undefined);
const isRenaming = ref(false);
const renameValue = ref("");

const { effectivePosition, savedPosition, isMobile, setPosition } = useToolbarPosition();

let activeLoadToken = 0;

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
    <div class="flex items-center gap-2 px-4 pt-4 pb-2 md:px-6 shrink-0">
      <button
        class="flex items-center gap-1.5 text-sm text-rose-text-muted hover:text-rose-text transition-colors"
        @click="goBack"
      >
        <ArrowLeftIcon class="w-4 h-4" />
      </button>

      <div class="flex items-center gap-2 flex-1 min-w-0 ml-2 group">
        <input
          v-if="isRenaming"
          v-model="renameValue"
          type="text"
          autofocus
          class="text-xl font-bold bg-transparent border-b-2 border-rose-primary text-rose-text focus:outline-none min-w-0 flex-1"
          @keyup.enter="confirmRenameTitle"
          @keyup.escape="cancelRenameTitle"
          @blur="confirmRenameTitle"
        />
        <template v-else>
          <h1 class="text-xl font-bold text-rose-text truncate">{{ currentNote?.title }}</h1>
          <button
            class="opacity-0 group-hover:opacity-100 text-rose-text-muted hover:text-rose-primary transition-opacity shrink-0"
            @click="startRenameTitle"
          >
            <PencilIcon class="w-4 h-4" />
          </button>
        </template>
      </div>

      <span v-if="currentNote" class="text-xs text-rose-text-muted shrink-0">
        Saved {{ formatRelativeTime(currentNote.updatedAt) }}
      </span>

      <div v-if="!isMobile" class="flex items-center gap-0.5 ml-2 shrink-0">
        <button
          v-for="pos in ['top', 'left', 'right', 'bottom'] as ToolbarPosition[]"
          :key="pos"
          :title="`Toolbar ${pos}`"
          class="p-1 rounded transition-colors"
          :class="
            savedPosition === pos
              ? 'text-rose-primary'
              : 'text-rose-text-muted hover:text-rose-text'
          "
          @click="setPosition(pos)"
        >
          <PanelTopIcon v-if="pos === 'top'" class="w-4 h-4" />
          <PanelBottomIcon v-else-if="pos === 'bottom'" class="w-4 h-4" />
          <PanelLeftIcon v-else-if="pos === 'left'" class="w-4 h-4" />
          <PanelRightIcon v-else-if="pos === 'right'" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <NoteCanvas
      v-if="currentNote"
      :key="currentNote.id"
      :initial-canvas-json="currentNote.canvasJSON"
      :initial-background-color="currentNote.backgroundColor"
      :toolbar-position="effectivePosition"
      :note-title="currentNote.title"
      @change="handleCanvasChange"
    />
  </div>
</template>

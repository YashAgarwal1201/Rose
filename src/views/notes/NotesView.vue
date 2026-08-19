<!-- src/views/notes/NotesView.vue -->
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { PenLineIcon } from "@lucide/vue";
import ExplorerGrid from "@/components/explorer/ExplorerGrid.vue";
import { useNotesStore } from "@/stores/notes";
import { useFoldersStore } from "@/stores/folders";
import { useToast } from "@/composables/ui/useToast.ts";

const router = useRouter();
const notesStore = useNotesStore();
const foldersStore = useFoldersStore();
const { showToast } = useToast();

const explorerGridRef = ref<InstanceType<typeof ExplorerGrid> | null>(null);

async function loadNotes() {
  try {
    await notesStore.loadNotes();
  } catch (error) {
    showToast((error as Error).message, "error");
  }
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

function openNote(id: string) {
  const note = notesStore.notes.find((candidate) => candidate.id === id);
  if (!note) return;
  router.push({
    name: "files-note",
    params: { pathMatch: [...buildFolderPath(note.folderId), note.title] },
  });
}



async function handleRenameFile(id: string, name: string) {
  try {
    await notesStore.updateNote(id, { title: name });
  } catch (error) {
    showToast((error as Error).message, "error");
  }
}

async function handleDeleteFile(id: string) {
  try {
    await notesStore.deleteNote(id);
  } catch (error) {
    showToast((error as Error).message, "error");
  }
}

onMounted(async () => {
  await foldersStore.loadFolders();
  loadNotes();
});
</script>

<template>
  <div class="flex h-full">
    <main class="flex-1 p-4 md:p-6 overflow-y-auto min-w-0">
      <div class="flex items-center justify-between gap-2 mb-8">
        <h1 class="text-2xl font-bold text-rose-text">Notes</h1>
      </div>

      <ExplorerGrid
        ref="explorerGridRef"
        :folders="[]"
        :files="
          notesStore.notes.map((n) => ({
            id: n.id,
            name: n.title,
            updatedAt: n.updatedAt,
            createdAt: n.createdAt,
            thumbnail: n.thumbnail,
          }))
        "
        :file-icon="PenLineIcon"
        file-label="note"
        @open-file="openNote"
        @rename-file="handleRenameFile"
        @delete-file="handleDeleteFile"
      />
    </main>
  </div>
</template>

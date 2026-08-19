<!-- src/views/notes/NotesView.vue -->
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { PenLineIcon } from "@lucide/vue";
import ExplorerGrid from "@/components/explorer/ExplorerGrid.vue";
import ExplorerActions from "@/components/explorer/ExplorerActions.vue";
import { useNotesStore } from "@/stores/notes";
import { useToast } from "@/composables/ui/useToast.ts";
import { useKeyboardShortcuts } from "@/composables/app/useKeyboardShortcuts.ts";

const router = useRouter();
const notesStore = useNotesStore();
const { showToast } = useToast();

const explorerGridRef = ref<InstanceType<typeof ExplorerGrid> | null>(null);

async function loadNotes() {
  try {
    await notesStore.loadNotes();
  } catch (error) {
    showToast((error as Error).message, "error");
  }
}

function openNote(id: string) {
  const note = notesStore.notes.find((candidate) => candidate.id === id);
  if (!note) return;
  router.push({
    name: "files-note",
    params: { pathMatch: [note.title] },
  });
}

async function handleCreateFile(name: string) {
  try {
    const newId = await notesStore.createNote(name, null);
    openNote(newId);
  } catch (error) {
    showToast((error as Error).message, "error");
  }
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

onMounted(() => {
  loadNotes();
});

useKeyboardShortcuts([
  {
    key: "e",
    ctrl: true,
    shift: true,
    handler: () => {
      explorerGridRef.value?.startCreate("file");
    },
  },
]);
</script>

<template>
  <div class="flex h-full">
    <main class="flex-1 p-4 md:p-6 overflow-y-auto min-w-0 max-w-5xl mx-auto">
      <div class="flex items-center justify-between gap-2 mb-8">
        <h1 class="text-2xl font-bold text-rose-text">Notes</h1>
        <ExplorerActions
          file-label="note"
          :hide-folders="true"
          @create-file="explorerGridRef?.startCreate('file')"
        />
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
        @create-file="handleCreateFile"
        @rename-file="handleRenameFile"
        @delete-file="handleDeleteFile"
      />
    </main>
  </div>
</template>

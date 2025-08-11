<!-- pages/handwritten-notes/[id].vue
<template>
  <div class="w-full h-full flex justify-center items-center py-2">
    <div class="w-full h-full flex flex-row">
      <div class="w-[350px] hidden lg:block flex-shrink-0 h-full">
        <ListOfHandNotes />
      </div>
      <div class="max-w-full flex-grow h-full mx-auto flex">
        <div class="flex w-full max-w-7xl h-full rounded-lg">
          <HandNotesContainer :note-id="noteId" :folder-id="folderId ?? ''" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import ListOfHandNotes from "~/components/handNotes/listOfHandNotes.vue";

const route = useRoute();
const router = useRouter();
const notesStore = useHandwrittenNotesStoreStore();

// For backward compatibility, treat the id as a noteId and find which folder it belongs to
const noteId = computed(() => route.params.noteId as string);

// Find the note across all folders to get the folder ID
const currentNote = computed(() => {
  for (const folder of notesStore.folders) {
    const note = folder.note.find((n) => n.id === noteId.value);
    if (note) return note;
  }
  return null;
});

const folderId = computed(() => {
  return currentNote.value?.folder || null;
});

// Redirect to new URL structure if note is found
watch(
  () => currentNote.value,
  (note) => {
    if (note) {
      const folderSlug = notesStore.getFolderSlug(note.folder);
      router.replace(`/handwritten-notes/${folderSlug}/${note.id}`);
    } else if (noteId.value !== "new") {
      // Note not found, redirect to notes list
      router.replace("/handwritten-notes");
    }
  },
  { immediate: true }
);

// Handle new note creation
onMounted(() => {
  if (noteId.value === "new" || !currentNote.value) {
    // Create new unlisted note
    const newNote = notesStore.createNote(null);
    router.replace(`/handwritten-notes/unlisted/${newNote.id}`);
  }
});
</script> -->

<template>
  <div class="w-full h-full flex justify-center items-center py-2">
    <div class="w-full h-full flex flex-row">
      <div class="w-[350px] hidden lg:block flex-shrink-0 h-full">
        <ListOfHandNotes />
      </div>
      <div class="max-w-full flex-grow h-full mx-auto flex">
        <div class="flex w-full max-w-7xl h-full rounded-lg">
          <HandNotesContainer :note-id="noteId" :folder-id="folderId ?? ''" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import HandNotesContainer from "~/components/handNotes/handNotesContainer.vue";
// import { useNotesStore } from '@/stores/notesStore'
import ListOfHandNotes from "~/components/handNotes/listOfHandNotes.vue";
// import NoteCanvas from "~/components/NoteCanvas.vue"

const route = useRoute();
const router = useRouter();
const notesStore = useHandwrittenNotesStoreStore();

const folderSlug = computed(() => route.params.folderSlug as string);
const noteId = computed(() => route.params.noteId as string);

const folderId = computed(() => {
  if (folderSlug.value === "unlisted") return null;
  const folder = notesStore.getFolderBySlug(folderSlug.value);
  return folder?.id || null;
});

const currentFolder = computed(() => {
  if (folderSlug.value === "unlisted") return null;
  return notesStore.getFolderBySlug(folderSlug.value);
});

onMounted(() => {
  notesStore.initializeStore();

  // Check if folder exists (except for 'unlisted')
  if (folderSlug.value !== "unlisted" && !currentFolder.value) {
    // Folder doesn't exist, redirect to main notes page
    router.push("/handwritten-notes");
  }
});
</script>

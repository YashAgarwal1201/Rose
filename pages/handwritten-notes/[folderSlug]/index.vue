<template>
  <div class="w-full h-full flex justify-center">
    <div class="w-full h-full px-3 py-2 sm:px-4 sm:py-4 flex flex-col gap-y-5">
      <!-- Header -->
      <div class="flex items-center gap-3">
        <Button class="text-white shadow-none !rounded-xl" @click="goBack">
          <ArrowLeft :size="16" />
        </Button>
        <div class="flex-grow">
          <h1 class="text-2xl lg:text-3xl font-heading">
            {{
              folderSlug === "unlisted" ? "Unlisted Notes" : currentFolder?.name
            }}
          </h1>
          <p class="text-sm text-gray-400">{{ notesInFolder.length }} notes</p>
        </div>
        <Button
          class="text-white shadow-none !rounded-xl"
          @click="createNoteInFolder"
        >
          <Plus :size="16" />
          <span class="ml-2">New Note</span>
        </Button>
      </div>

      <!-- Notes Grid -->
      <div v-if="notesInFolder.length > 0" class="flex-grow">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div
            v-for="note in notesInFolder"
            :key="note.id"
            class="bg-rose-800 rounded-xl p-4 cursor-pointer hover:bg-rose-700 transition-colors"
            @click="openNote(note)"
          >
            <h3 class="font-medium text-white truncate">{{ note.title }}</h3>
            <div class="text-xs text-rose-200 mt-1">
              {{ formatDate(note.lastUpdatedTimestamp) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="flex-grow flex flex-col justify-center items-center">
        <p class="text-lg mb-3 italic">No notes in this folder</p>
        <Button
          class="text-white shadow-none !rounded-xl flex items-center gap-2"
          @click="createNoteInFolder"
        >
          <Plus :size="16" />
          <span>Create First Note</span>
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
// import { useNotesStore } from '@/stores/notesStore'
import { ArrowLeft, Plus } from "lucide-vue-next";
import Button from "primevue/button";

const route = useRoute();
const router = useRouter();
const notesStore = useHandwrittenNotesStoreStore();

const folderSlug = computed(() => route.params.folderSlug as string);

const currentFolder = computed(() => {
  if (folderSlug.value === "unlisted") return null;
  return notesStore.getFolderBySlug(folderSlug.value);
});

const notesInFolder = computed(() => {
  if (folderSlug.value === "unlisted") {
    // Return unlisted notes
    return notesStore.folders.flatMap((f) => f.note).filter((n) => !n.folder);
  }
  return currentFolder.value?.note || [];
});

const goBack = () => {
  router.push("/handwritten-notes");
};

const createNoteInFolder = () => {
  const folderId =
    folderSlug.value === "unlisted" ? null : currentFolder.value?.id;
  const newNote = notesStore.createNote(folderId ?? "");
  openNote(newNote);
};

const openNote = (note: any) => {
  router.push(`/handwritten-notes/${folderSlug.value}/${note.id}`);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

onMounted(() => {
  notesStore.initializeStore();
});
</script>

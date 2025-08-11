<!-- components/NotesList.vue -->
<template>
  <div class="p-3 flex flex-col gap-y-4 w-full h-full">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <Button
        class="text-white shadow-none h-full flex-shrink-0 !rounded-xl"
        title="Go back"
        @click="goBack"
      >
        <ArrowLeft :size="16" />
      </Button>
      <Button
        class="text-white shadow-none !rounded-xl flex-grow"
        title="New handwritten note"
        @click="createNewNote"
      >
        <FileEdit :size="20" />
        <span class="ml-2">New Handwritten Note</span>
      </Button>
    </div>

    <!-- Folders and Notes -->
    <div class="flex flex-col gap-4">
      <!-- Folder Management -->
      <div class="flex items-center gap-2">
        <InputText
          v-model="newFolderName"
          placeholder="New folder name..."
          class="flex-1"
          @keyup.enter="createFolder"
        />
        <Button
          @click="createFolder"
          class="!rounded-xl"
          :disabled="!newFolderName.trim()"
        >
          <FolderPlus :size="16" />
        </Button>
      </div>

      <!-- Recent Notes -->
      <Accordion class="bg-rose-700 dark:bg-rose-900 rounded-2xl p-3">
        <AccordionPanel :value="0" class="!border-none !bg-transparent">
          <AccordionHeader class="!bg-transparent !rounded-2xl">
            <h3
              class="text-base font-medium text-slate-200 dark:text-slate-100"
            >
              Recent Notes (Last 7 days)
            </h3>
          </AccordionHeader>
          <AccordionContent class="!bg-transparent !rounded-b-2xl">
            <div v-if="recentNotes.length === 0" class="text-sm">
              No recent notes
            </div>
            <div v-else class="flex flex-col gap-y-2">
              <div
                v-for="note in recentNotes"
                :key="note.id"
                class="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors duration-200"
                @click="openNote(note)"
              >
                <div class="flex flex-col">
                  <span class="font-medium">{{ note.title }}</span>
                  <span class="text-xs text-gray-500">
                    {{ getFolderName(note.folder) }}
                  </span>
                </div>
                <span class="text-sm text-gray-500">
                  {{ formatDate(note.lastUpdatedTimestamp) }}
                </span>
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>

        <!-- Folders -->
        <div
          v-for="folder in folders"
          :key="folder.id"
          class="border-t border-rose-800 dark:border-rose-200 mt-2 pt-2"
        >
          <AccordionPanel
            :value="folder.id"
            class="!border-none !bg-transparent"
          >
            <AccordionHeader class="!bg-transparent !rounded-2xl">
              <div class="flex items-center justify-between w-full">
                <div class="flex items-center gap-2">
                  <Folder :size="16" />
                  <h3
                    class="text-base font-medium text-slate-200 dark:text-slate-100"
                  >
                    {{ folder.name }} ({{ folder.note.length }})
                  </h3>
                </div>
                <div class="flex items-center gap-1">
                  <Button
                    @click.stop="createNoteInFolder(folder.id)"
                    class="!bg-transparent !border-transparent !text-slate-200 hover:!bg-rose-600"
                    size="small"
                    title="Add note to folder"
                  >
                    <Plus :size="14" />
                  </Button>
                  <Button
                    @click.stop="deleteFolder(folder.id)"
                    class="!bg-transparent !border-transparent !text-red-400 hover:!bg-red-600"
                    size="small"
                    title="Delete folder"
                    :disabled="folder.note.length > 0"
                  >
                    <Trash :size="14" />
                  </Button>
                </div>
              </div>
            </AccordionHeader>
            <AccordionContent class="!bg-transparent !rounded-b-2xl">
              <div
                v-if="folder.note.length === 0"
                class="text-sm text-gray-400"
              >
                No notes in this folder
              </div>
              <div v-else class="flex flex-col gap-y-2">
                <div
                  v-for="note in folder.note"
                  :key="note.id"
                  class="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors duration-200 group"
                  @click="openNote(note)"
                >
                  <div class="flex items-center gap-2">
                    <Star
                      v-if="note.isStarred"
                      :size="14"
                      class="text-yellow-500"
                    />
                    <span>{{ note.title }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-gray-500">
                      {{ formatDate(note.lastUpdatedTimestamp) }}
                    </span>
                    <Button
                      @click.stop="toggleStar(note.id)"
                      class="!bg-transparent !border-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                      size="small"
                    >
                      <Star
                        :size="14"
                        :class="
                          note.isStarred ? 'text-yellow-500' : 'text-gray-400'
                        "
                      />
                    </Button>
                    <Button
                      @click.stop="deleteNote(note.id)"
                      class="!bg-transparent !border-transparent !text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      size="small"
                    >
                      <Trash :size="14" />
                    </Button>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionPanel>
        </div>
      </Accordion>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowLeft,
  FileEdit,
  FolderPlus,
  Folder,
  Plus,
  Trash,
  Star,
} from "lucide-vue-next";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Accordion from "primevue/accordion";
import AccordionPanel from "primevue/accordionpanel";
import AccordionHeader from "primevue/accordionheader";
import AccordionContent from "primevue/accordioncontent";
import type { HandNote } from "~/types/typesAndInterfaces";

const router = useRouter();
const notesStore = useHandwrittenNotesStoreStore();

// Reactive data
const newFolderName = ref("");

// Computed
const folders = computed(() => notesStore.getAllFolders);
const recentNotes = computed(() => notesStore.getRecentNotes(7));

// Methods
onMounted(() => {
  notesStore.initializeStore();
});

const goBack = () => {
  router.back();
};

const createFolder = () => {
  if (newFolderName.value.trim()) {
    notesStore.createFolder(newFolderName.value.trim());
    newFolderName.value = "";
  }
};

const deleteFolder = (folderId: string) => {
  if (confirm("Are you sure you want to delete this folder?")) {
    notesStore.deleteFolder(folderId);
  }
};

const createNewNote = () => {
  // If there's no default folder, create one
  if (folders.value.length === 0) {
    notesStore.createFolder("Default");
  }

  const defaultFolder = folders.value[0];
  const newNote = notesStore.createNote(defaultFolder.id);
  openNote(newNote);
};

const createNoteInFolder = (folderId: string) => {
  const newNote = notesStore.createNote(folderId);
  openNote(newNote);
};

// const openNote = (note: HandNote) => {
//   router.push(`/handwritten-notes/${note.folder}/${note.id}`);
// };

const openNote = (note: HandNote) => {
  const slug = notesStore.getFolderSlug(note.folder || null);
  router.push(`/handwritten-notes/${slug}/${note.id}`);
};

const deleteNote = (noteId: string) => {
  if (confirm("Are you sure you want to delete this note?")) {
    notesStore.deleteNote(noteId);
  }
};

const toggleStar = (noteId: string) => {
  // Find the note and toggle its starred status
  for (const folder of folders.value) {
    const note = folder.note.find((n) => n.id === noteId);
    if (note) {
      notesStore.updateNote(noteId, { isStarred: !note.isStarred });
      break;
    }
  }
};

const getFolderName = (folderId: string) => {
  const folder = folders.value.find((f) => f.id === folderId);
  return folder?.name || "Unknown";
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};
</script>

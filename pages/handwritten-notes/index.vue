<template>
  <div class="w-full h-full flex justify-center">
    <div
      class="w-full h-full px-3 py-2 sm:px-4 sm:py-4 flex flex-col gap-y-5 md:gap-y-7"
    >
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="hidden md:block text-2xl lg:text-3xl font-heading">
          Your Handwritten Notes
        </h1>
        <Button
          v-if="notesStore.folders.length > 0"
          class="text-white shadow-none !rounded-xl flex items-center justify-center gap-2 px-4 py-2"
          @click="createNewNote"
        >
          <Plus :size="16" />
          <span>New Handwritten Note</span>
        </Button>
      </div>

      <!-- Folder & Notes listing -->
      <div
        v-if="allNotes.length > 0"
        class="w-full flex flex-col gap-4 flex-grow"
      >
        <!-- Filters -->
        <div
          class="flex flex-wrap md:flex-nowrap flex-row items-center gap-3 mb-4 flex-shrink-0"
        >
          <InputText
            v-model="searchQuery"
            placeholder="Search Handwritten Notes..."
            class="flex-grow p-2 !rounded-xl font-content text-sm xl:text-base"
          />
          <Select
            v-model="completionFilter"
            :options="completionFilterOptions"
            optionLabel="label"
            optionValue="value"
            class="w-48 !rounded-xl font-content text-sm xl:text-base"
          />
          <Select
            v-model="sortOption"
            :options="sortOptions"
            optionLabel="label"
            optionValue="value"
            class="w-48 !rounded-xl font-content text-sm xl:text-base"
          />
        </div>

        <!-- Notes Grid -->
        <div
          v-if="filteredAndSortedNotes.length > 0"
          class="flex-grow grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto"
        >
          <div
            v-for="note in filteredAndSortedNotes"
            :key="note.id"
            class="h-fit flex flex-row items-start gap-x-3 p-2 md:p-3 rounded-lg sm:rounded-xl shadow-md bg-rose-800 font-content"
          >
            <div class="mt-1 flex-shrink-0">
              <Checkbox
                :value="note.isArchived"
                @change="toggleArchive(note.id)"
              />
            </div>
            <div class="flex-grow">
              <h3
                class="w-fit text-base sm:text-lg 2xl:text-xl underline cursor-pointer line-clamp-1"
                @click="openNote(note)"
              >
                {{ note.title }}
              </h3>
              <span class="text-xs sm:text-sm text-rose-200">
                {{ formatTimestamp(note.lastUpdatedTimestamp) }} —
                {{ getFolderName(note.folder) }}
              </span>
            </div>
            <div class="flex-shrink-0 flex gap-1">
              <Button
                class="!bg-transparent !p-1"
                @click.stop="toggleStar(note.id)"
                title="Toggle Star"
              >
                <Star
                  :size="16"
                  :class="note.isStarred ? 'text-yellow-400' : 'text-white'"
                />
              </Button>
              <Button
                class="!bg-transparent !p-1"
                @click.stop="confirmDelete(note)"
                title="Delete Note"
              >
                <Trash :size="16" />
              </Button>
            </div>
          </div>
        </div>

        <!-- No search results -->
        <div v-else class="flex-grow flex flex-col justify-center items-center">
          <img
            :src="NoRecordsImage"
            class="max-w-80 select-none pointer-events-none"
          />
          <p class="text-base lg:text-lg mb-3 italic">
            No Handwritten Notes match your search.
          </p>
        </div>
      </div>

      <!-- If no notes exist -->
      <div
        v-else
        class="w-full flex flex-col justify-center items-center font-content"
      >
        <img
          :src="EmptyBoxImage"
          class="max-w-80 select-none pointer-events-none"
        />
        <p class="text-base lg:text-lg mb-3 italic">
          No Handwritten Notes found.
        </p>
        <Button
          class="text-white shadow-none !rounded-xl flex items-center gap-2 px-4 py-2"
          @click="createNewNote"
        >
          <Plus :size="16" />
          <span>New Handwritten Note</span>
        </Button>
      </div>
    </div>

    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { Plus, Trash, Star } from "lucide-vue-next";
import EmptyBoxImage from "~/assets/illustrations/emptyBoxRose.svg";
import NoRecordsImage from "~/assets/illustrations/noRecordsRose.svg";
import { ref, computed, onMounted } from "vue";
// import { v4 as uuidv4 } from "uuid"
import { useRouter } from "vue-router";
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";
import type { HandNote } from "~/types/typesAndInterfaces";

const confirm = useConfirm();
const router = useRouter();
const notesStore = useHandwrittenNotesStoreStore();

// State
const searchQuery = ref("");
const sortOption = ref("timestamp_desc");
const sortOptions = [
  { label: "Title (A-Z)", value: "title_asc" },
  { label: "Title (Z-A)", value: "title_desc" },
  { label: "Date (Newest first)", value: "timestamp_desc" },
  { label: "Date (Oldest first)", value: "timestamp_asc" },
];
const completionFilter = ref("all");

// Computed
const allNotes = computed(() =>
  notesStore.folders.flatMap((folder) => folder.note)
);

const completionFilterOptions = computed(() => {
  const allCount = allNotes.value.length;
  const archivedCount = allNotes.value.filter((n) => n.isArchived).length;
  const activeCount = allCount - archivedCount;
  return [
    { label: `All (${allCount})`, value: "all" },
    { label: `Archived (${archivedCount})`, value: "archived" },
    { label: `Active (${activeCount})`, value: "active" },
  ];
});

const filteredAndSortedNotes = computed(() => {
  let result = [...allNotes.value];

  // Filter by search
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter((note) => note.title.toLowerCase().includes(query));
  }

  // Filter by archive status
  if (completionFilter.value === "archived") {
    result = result.filter((note) => note.isArchived);
  } else if (completionFilter.value === "active") {
    result = result.filter((note) => !note.isArchived);
  }

  // Sort
  const [field, dir] = sortOption.value.split("_");
  const asc = dir === "asc";
  result.sort((a, b) => {
    if (field === "title") {
      return asc
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    } else {
      const da = new Date(a.lastUpdatedTimestamp).getTime();
      const db = new Date(b.lastUpdatedTimestamp).getTime();
      return asc ? da - db : db - da;
    }
  });
  return result;
});

// Methods
const formatTimestamp = (ts: Date) => {
  return new Date(ts).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getFolderName = (folderId: string) => {
  const folder = notesStore.folders.find((f) => f.id === folderId);
  return folder?.name || "Unknown";
};

// const openNote = (note: any) => {
//   router.push(`/handwritten-notes/${note.folder}/${note.id}`);
// };

const openNote = (note: HandNote) => {
  const slug = notesStore.getFolderSlug(note.folder || null);
  router.push(`/handwritten-notes/${slug}/${note.id}`);
};

const createNewNote = () => {
  if (notesStore.folders.length === 0) {
    notesStore.createFolder("unlisted");
  }
  const folderId = notesStore.folders[0].id;
  const newNote = notesStore.createNote(folderId);
  openNote(newNote);
};

const toggleArchive = (noteId: string) => {
  const note = allNotes.value.find((n) => n.id === noteId);
  if (note) {
    notesStore.updateNote(noteId, { isArchived: !note.isArchived });
  }
};

const toggleStar = (noteId: string) => {
  const note = allNotes.value.find((n) => n.id === noteId);
  if (note) {
    notesStore.updateNote(noteId, { isStarred: !note.isStarred });
  }
};

const confirmDelete = (note: any) => {
  confirm.require({
    message: `Delete "${note.title}"?`,
    header: "Confirm Deletion",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    accept: () => notesStore.deleteNote(note.id),
  });
};

// Init
onMounted(() => {
  notesStore.initializeStore();
});
</script>

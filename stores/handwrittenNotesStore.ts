// Main store for handwritten notes
// stores/notesStore.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  Folder,
  HandNote,
  HandNoteSettings,
} from "~/types/typesAndInterfaces";

// export const useHandwrittenNotesStoreStore = defineStore(
//   "handwrittenNotesStore",
//   () => {}
// );

export const useHandwrittenNotesStoreStore = defineStore(
  "handwrittenNotesStore",
  () => {
    // State
    const folders = ref<Folder[]>([]);
    const currentNote = ref<HandNote | null>(null);
    const currentFolder = ref<Folder | null>(null);

    // Default settings for new notes
    const defaultSettings: HandNoteSettings = {
      penColor: "#000000",
      penWidth: 2,
      bgColor: "#ffffff",
      toolbarPosition: "top",
    };

    // Getters
    const getAllFolders = computed(() => folders.value);

    const getFolderById = computed(
      () => (id: string) => folders.value.find((folder) => folder.id === id)
    );

    const getNotesInFolder = computed(
      () => (folderId: string) =>
        folders.value.find((folder) => folder.id === folderId)?.note || []
    );

    const getRecentNotes = computed(() => (days: number) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return folders.value
        .flatMap((folder) =>
          folder.note.filter((note) => new Date(note.timestamp) >= cutoffDate)
        )
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    });

    // Actions
    const createFolder = (name: string): Folder => {
      const newFolder: Folder = {
        id: crypto.randomUUID(),
        name,
        documents: [],
        note: [],
        timestamp: new Date(),
        lastUpdatedTimestamp: new Date(),
      };

      folders.value.push(newFolder);
      return newFolder;
    };

    const updateFolder = (folderId: string, updates: Partial<Folder>) => {
      const folderIndex = folders.value.findIndex((f) => f.id === folderId);
      if (folderIndex !== -1) {
        folders.value[folderIndex] = {
          ...folders.value[folderIndex],
          ...updates,
          lastUpdatedTimestamp: new Date(),
        };
      }
    };

    const deleteFolder = (folderId: string) => {
      const index = folders.value.findIndex((f) => f.id === folderId);
      if (index !== -1) {
        folders.value.splice(index, 1);
      }
    };

    // const createNote = (
    //   folderId: string,
    //   title: string = "Untitled Note"
    // ): HandNote => {
    //   const newNote: HandNote = {
    //     id: crypto.randomUUID(),
    //     timestamp: new Date(),
    //     lastUpdatedTimestamp: new Date(),
    //     title,
    //     content: "", // Canvas data will be stored here
    //     folder: folderId,
    //     createdBy: "current-user", // Replace with actual user
    //     lastModifiedBy: "current-user",
    //     isStarred: false,
    //     isArchived: false,
    //     settings: { ...defaultSettings },
    //   };

    //   const folder = folders.value.find((f) => f.id === folderId);
    //   if (folder) {
    //     folder.note.push(newNote);
    //     folder.lastUpdatedTimestamp = new Date();
    //   }

    //   return newNote;
    // };

    const createNote = (
      folderId: string | null,
      title: string = "Untitled Note"
    ): HandNote => {
      const newNote: HandNote = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        lastUpdatedTimestamp: new Date(),
        title,
        content: "",
        folder: folderId ?? "", // Can be null for unlisted notes
        createdBy: "current-user",
        lastModifiedBy: "current-user",
        isStarred: false,
        isArchived: false,
        settings: { ...defaultSettings },
      };

      if (folderId) {
        // Add to specific folder
        const folder = folders.value.find((f) => f.id === folderId);
        if (folder) {
          folder.note.push(newNote);
          folder.lastUpdatedTimestamp = new Date();
        }
      } else {
        // For unlisted notes, we'll store them in a virtual way
        // You might want to create a special "unlisted" folder or handle differently
        // For now, let's create a default folder if none exists
        if (folders.value.length === 0) {
          createFolder("unlisted");
        }
        // But keep the note's folder as null to mark it as unlisted
      }

      return newNote;
    };

    const updateNote = (noteId: string, updates: Partial<HandNote>) => {
      for (const folder of folders.value) {
        const noteIndex = folder.note.findIndex((n) => n.id === noteId);
        if (noteIndex !== -1) {
          folder.note[noteIndex] = {
            ...folder.note[noteIndex],
            ...updates,
            lastUpdatedTimestamp: new Date(),
          };
          folder.lastUpdatedTimestamp = new Date();

          if (currentNote.value?.id === noteId) {
            currentNote.value = folder.note[noteIndex];
          }
          break;
        }
      }
    };

    const deleteNote = (noteId: string) => {
      for (const folder of folders.value) {
        const noteIndex = folder.note.findIndex((n) => n.id === noteId);
        if (noteIndex !== -1) {
          folder.note.splice(noteIndex, 1);
          folder.lastUpdatedTimestamp = new Date();

          if (currentNote.value?.id === noteId) {
            currentNote.value = null;
          }
          break;
        }
      }
    };

    const setCurrentNote = (note: HandNote | null) => {
      currentNote.value = note;
    };

    const setCurrentFolder = (folder: Folder | null) => {
      currentFolder.value = folder;
    };

    const saveNoteContent = (noteId: string, canvasData: string) => {
      updateNote(noteId, { content: canvasData });
    };

    // Initialize with default folder if none exists
    const initializeStore = () => {
      if (folders.value.length === 0) {
        createFolder("unlisted");
      }
    };

    function slugify(name: string): string {
      return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "") // remove special chars
        .replace(/\s+/g, "-"); // spaces -> dashes
    }

    const getFolderBySlug = (slug: string) => {
      if (slug === "unlisted") return null;
      return folders.value.find((f) => slugify(f.name) === slug);
    };

    const getFolderSlug = (folderId: string | null) => {
      if (!folderId) return "unlisted";
      const folder = folders.value.find((f) => f.id === folderId);
      return folder ? slugify(folder.name) : "unlisted";
    };

    return {
      // State
      folders,
      currentNote,
      currentFolder,

      // Getters
      getAllFolders,
      getFolderById,
      getNotesInFolder,
      getRecentNotes,

      // Actions
      createFolder,
      updateFolder,
      deleteFolder,
      createNote,
      updateNote,
      deleteNote,
      setCurrentNote,
      setCurrentFolder,
      saveNoteContent,
      initializeStore,
      getFolderBySlug,
      getFolderSlug,
    };
  }
);

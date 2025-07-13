import { defineStore } from "pinia";
import type {
  Document,
  Folder,
  ListOfDocuments,
} from "~/types/typesAndInterfaces";

// export interface Document {
//   id: string;
//   title: string;
//   content: string;
//   folder: string; // Folder/category name
//   createdAt: string;
//   updatedAt: string;
// }

export const useDocumentStore = defineStore("documentStore", {
  state: () => ({
    documents: [] as ListOfDocuments,
    folders: [] as Folder[],
  }),

  getters: {
    getDocumentsByFolder: (state) => (folder: string) =>
      state.documents.filter((doc) => doc.folder === folder),

    getDocumentById: (state) => (id: string) =>
      state.documents.find((doc) => doc.id === id),
  },

  actions: {
    loadDocuments() {
      const savedDocuments = localStorage.getItem("documents");
      const savedFolders = localStorage.getItem("folders");
      if (savedDocuments) this.documents = JSON.parse(savedDocuments);
      if (savedFolders) this.folders = JSON.parse(savedFolders);
    },

    saveDocuments() {
      localStorage.setItem("documents", JSON.stringify(this.documents));
      localStorage.setItem("folders", JSON.stringify(this.folders));
    },

    createDocument(title: string, folder: string = "Uncategorized") {
      const newDoc: Document = {
        id: crypto.randomUUID(),
        title,
        content: "",
        folder,
        timestamp: new Date(),
        lastUpdatedTimestamp: new Date(),
        isArchived: false,
        isStarred: false,
        createdBy: "Elsa",
        lastModifiedBy: "Elsa",
      };
      this.documents.push(newDoc);
      this.saveDocuments();
    },

    updateDocument(id: string, content: string) {
      const doc = this.documents.find((d) => d.id === id);
      if (doc) {
        doc.content = content;
        doc.lastUpdatedTimestamp = new Date();
        this.saveDocuments();
      }
    },

    deleteDocument(id: string) {
      this.documents = this.documents.filter((d) => d.id !== id);
      this.saveDocuments();
    },

    createFolder(folderName: string) {
      if (!this.folders.some((folder) => folder.name === folderName)) {
        const newFolder: Folder = {
          id: crypto.randomUUID(),
          name: folderName,
          documents: [],
          timestamp: new Date(),
          lastUpdatedTimestamp: new Date(),
        };
        this.folders.push(newFolder);
        this.saveDocuments();
      }
    },

    deleteFolder(folderName: string) {
      this.documents = this.documents.map((doc) =>
        doc.folder === folderName ? { ...doc, folder: "Uncategorized" } : doc
      );
      this.folders = this.folders.filter(
        (folder) => folder.name !== folderName
      );
      this.saveDocuments();
    },
  },
});

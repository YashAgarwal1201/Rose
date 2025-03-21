import { defineStore } from "pinia";

export interface Document {
  id: string;
  title: string;
  content: string;
  folder: string; // Folder/category name
  createdAt: string;
  updatedAt: string;
}

export const useDocumentStore = defineStore("documentStore", {
  state: () => ({
    documents: [] as Document[],
    folders: [] as string[],
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.documents.push(newDoc);
      this.saveDocuments();
    },

    updateDocument(id: string, content: string) {
      const doc = this.documents.find((d) => d.id === id);
      if (doc) {
        doc.content = content;
        doc.updatedAt = new Date().toISOString();
        this.saveDocuments();
      }
    },

    deleteDocument(id: string) {
      this.documents = this.documents.filter((d) => d.id !== id);
      this.saveDocuments();
    },

    createFolder(folderName: string) {
      if (!this.folders.includes(folderName)) {
        this.folders.push(folderName);
        this.saveDocuments();
      }
    },

    deleteFolder(folderName: string) {
      this.documents = this.documents.map((doc) =>
        doc.folder === folderName ? { ...doc, folder: "Uncategorized" } : doc
      );
      this.folders = this.folders.filter((folder) => folder !== folderName);
      this.saveDocuments();
    },
  },
});

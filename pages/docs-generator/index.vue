<script setup lang="ts">
import { onMounted, ref } from "vue";

const documentStore = useDocumentStore();
const newDocTitle = ref("");
const newFolderName = ref("");
const selectedFolder = ref("All");

onMounted(() => {
  documentStore.loadDocuments();
});

const createNewDocument = () => {
  if (newDocTitle.value.trim()) {
    documentStore.createDocument(newDocTitle.value, selectedFolder.value);
    newDocTitle.value = "";
  }
};

const createNewFolder = () => {
  if (newFolderName.value.trim()) {
    documentStore.createFolder(newFolderName.value);
    newFolderName.value = "";
  }
};

const deleteDocument = (id: string) => {
  documentStore.deleteDocument(id);
};
</script>

<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">📄 Document Manager</h1>

    <!-- Create New Document -->
    <div class="mb-4 flex gap-2">
      <input
        v-model="newDocTitle"
        placeholder="New Document Title"
        class="border p-2 rounded w-full"
      />
      <button
        @click="createNewDocument"
        class="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Create
      </button>
    </div>

    <!-- Create New Folder -->
    <div class="mb-4 flex gap-2">
      <input
        v-model="newFolderName"
        placeholder="New Folder Name"
        class="border p-2 rounded w-full"
      />
      <button
        @click="createNewFolder"
        class="bg-green-500 text-white px-4 py-2 rounded"
      >
        Add Folder
      </button>
    </div>

    <!-- Folder Filter -->
    <select v-model="selectedFolder" class="border p-2 rounded mb-4">
      <option value="All">All Documents</option>
      <option
        v-for="folder in documentStore.folders"
        :key="folder"
        :value="folder"
      >
        {{ folder }}
      </option>
    </select>

    <!-- Documents List -->
    <div v-if="documentStore.documents.length > 0">
      <h2 class="text-xl font-semibold mb-2">Your Documents</h2>
      <ul class="border p-4 rounded">
        <li
          v-for="doc in selectedFolder === 'All'
            ? documentStore.documents
            : documentStore.getDocumentsByFolder(selectedFolder)"
          :key="doc.id"
          class="flex justify-between border-b p-2"
        >
          <span>{{ doc.title }} ({{ doc.folder }})</span>
          <button @click="deleteDocument(doc.id)" class="text-red-500">
            Delete
          </button>
        </li>
      </ul>
    </div>

    <div v-else>
      <p>No documents found.</p>
    </div>
  </div>
</template>

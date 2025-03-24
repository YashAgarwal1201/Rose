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
  <div class="w-full h-full flex justify-center">
    <div
      class="w-full lg:w-[1024px] h-full py-4 flex flex-col gap-y-5 md:gap-y-7"
    >
      <div class="flex items-center justify-between">
        <h1 class="text-2xl lg:text-3xl font-heading">Documents</h1>
        <UButton
          v-if="documentStore?.documents?.length > 0"
          class="text-white shadow-none"
          title="Create a new document"
        >
          <UIcon name="material-symbols:edit-document-rounded" size="20px" />
          <span>New Document</span>
        </UButton>
      </div>

      <!-- Create New Document -->
      <!-- <div class="mb-4 flex gap-2">
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
      </div> -->

      <!-- Create New Folder -->
      <!-- <div class="mb-4 flex gap-2">
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
      </div> -->

      <!-- Folder Filter -->
      <!-- <select v-model="selectedFolder" class="border p-2 rounded mb-4">
        <option value="All">All Documents</option>
        <option
          v-for="folder in documentStore.folders"
          :key="folder.id"
          :value="folder"
        >
          {{ folder }}
        </option>
      </select> -->

      <div class="flex flex-row gap-x-3">
        <!-- TODO: context menu on these button, new ui for these buttons -->
        <UButton
          v-for="folder in documentStore.folders"
          :key="folder.id"
          class="w-36"
          @click="selectedFolder = folder.id"
          ><span>{{ folder.name }}</span></UButton
        >

        <UButton
          v-for="doc in documentStore.getDocumentsByFolder(selectedFolder)"
          :key="doc.id"
          class="w-36"
          ><span>{{ doc.title }}</span></UButton
        >
      </div>

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

      <div
        v-else
        class="w-full h-[calc(100%-40px)] flex flex-col justify-center items-center gap-y-3"
      >
        <p class="text-base lg:text-lg">No documents found</p>

        <UButton
          class="text-white shadow-none rounded-full px-4 py-2"
          title="Create a new document"
        >
          <UIcon name="material-symbols:edit-document-rounded" size="20px" />
          <span>New document</span>
        </UButton>
      </div>
    </div>
  </div>
</template>

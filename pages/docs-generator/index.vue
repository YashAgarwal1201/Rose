<template>
  <div class="w-full h-full flex justify-center">
    <div class="w-full h-full p-2 sm:p-4 flex flex-col gap-y-5 md:gap-y-7">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl lg:text-3xl font-heading">Documents</h1>
        <Button
          v-if="documentStore?.documents?.length > 0"
          class="text-white shadow-none"
          title="Create a new document"
          @click="navigateToNewDocument"
        >
          <FileEdit :size="16" />
          <span>New Document</span>
        </Button>
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
        <Button
          v-for="folder in documentStore.folders"
          :key="folder.id"
          class="w-36"
          @click="selectedFolder = folder.id"
          ><span>{{ folder.name }}</span></Button
        >

        <Button
          v-for="doc in documentStore.getDocumentsByFolder(selectedFolder)"
          :key="doc.id"
          class="w-36"
          @click="() => navigateToDocument(doc.id)"
          ><span>{{ doc.title }}</span></Button
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
        class="w-full h-[calc(100%-40px)] flex flex-col justify-center items-center"
      >
        <img
          :src="NotFoundImage"
          class="max-w-80 select-none pointer-events-none"
        />
        <!-- <NotFoundImage /> -->
        <p class="text-base lg:text-lg mb-3">No documents found</p>

        <Button
          class="text-white shadow-none rounded-full px-4 py-2"
          title="Create a new document"
          @click="navigateToNewDocument"
        >
          <FileEdit :size="16" />
          <span>New document</span>
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { v4 as uuidv4 } from "uuid";
import NotFoundImage from "~/assets/illustrations/pageNotFoundRose.svg";
import { FileEdit } from "lucide-vue-next";

const router = useRouter();

const documentStore = useDocumentStore();

const newDocTitle = ref("");
const newFolderName = ref("");
const selectedFolder = ref("All");

onMounted(() => {
  documentStore.loadDocuments();
});

const navigateToDocument = (documentId: string) => {
  router.push(`/docs-generator/${documentId}`);
};

// Navigation function for new list
const navigateToNewDocument = () => {
  const documentId = uuidv4(); // Generate a new UUID
  router.push(`/docs-generator/${documentId}`);
};

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

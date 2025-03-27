<!-- <template>
  <div class="w-full h-full flex justify-center">
    <div
      class="w-full lg:w-[1024px] h-full py-4 flex flex-col gap-y-5 md:gap-y-7"
    >
      <div class="flex items-center justify-between">
        <h1 class="text-2xl lg:text-3xl font-heading">Documents</h1>
        <UButton
          class="text-white shadow-none flex items-center gap-x-2"
          title="To do list"
        >
          <UIcon name="material-symbols:edit-document-rounded" size="20px" />
          <span>New Document</span>
        </UButton>
      </div>

      <div class="editor-container">
        <div
          id="editorjs"
          class="w-full border border-[#d1d5db] bg-transparent p-4 rounded-3xl"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount } from "vue";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Paragraph from "@editorjs/paragraph";

const editorRef = ref<EditorJS | null>(null);

onMounted(() => {
  editorRef.value = new EditorJS({
    holder: "editorjs",
    placeholder: "Start writing here...",
    autofocus: true,
    tools: {
      header: Header,
      paragraph: Paragraph,
      list: List,
    },
    onChange: async () => {
      const content = await editorRef.value?.save();
      console.log("Editor Content:", content);
    },
  });
});

onBeforeUnmount(() => {
  editorRef.value?.destroy();
});
</script>

<style scoped>
.editor-container {
  width: 100%;
  min-height: 300px;
}
</style> -->

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
        :key="folder.id"
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

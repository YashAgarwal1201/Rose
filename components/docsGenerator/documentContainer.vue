<template>
  <div class="w-full h-full flex justify-center">
    <div class="w-full h-full py-4 flex flex-col gap-y-5 md:gap-y-7">
      <div class="flex items-center justify-between flex-shrink-0">
        <InputText
          v-model="documentTitle"
          placeholder="Document Title"
          class="text-2xl lg:text-3xl font-heading border-none focus:outline-none focus:ring-0 bg-transparent p-0"
          @input="handleTitleChange"
        />
        <!-- <Button
          class="text-white shadow-none flex justify-center items-center gap-x-2 px-4 rounded-full"
          title="To do list"
        >
          <FileEdit :size="16" />
          <span>New Document</span>
        </Button> -->
      </div>

      <div class="editor-container w-full h-full flex-grow-1">
        <div
          id="editorjs"
          class="w-full h-full border border-[#d1d5db] bg-transparent p-4 rounded-3xl"
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
import InputText from "primevue/inputtext";
import { FileEdit } from "lucide-vue-next";

const editorRef = ref<EditorJS | null>(null);
const documentTitle = ref("");

const handleTitleChange = () => {
  // You can add any additional title change handling logic here
  // For example, autosaving the title to localStorage or sending to an API
  console.log("Title changed:", documentTitle.value);
};

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

/* Additional styles for the title input to make it look seamless */
:deep(.p-inputtext) {
  width: 100%;
}

:deep(.p-inputtext:focus) {
  box-shadow: none;
}

:deep(.p-inputtext::placeholder) {
  font-style: italic;
  opacity: 0.6;
}
</style>

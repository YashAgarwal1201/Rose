<template>
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
</style>

<!-- src/components/docs/DocContinuousViewSheet.vue -->
<script setup lang="ts">
import { type Editor, EditorContent } from "@tiptap/vue-3";

defineProps<{
  editor?: Editor;
  isReadMode: boolean;
  isFullWidth: boolean;
}>();
</script>

<template>
  <div
    class="continuous-doc-card w-full flex-1 flex flex-col"
    :class="[isFullWidth ? 'continuous-full-width' : 'continuous-standard-width']"
  >
    <EditorContent
      :editor="editor"
      class="prose prose-invert max-w-none rose-editor-content flex-1"
      :class="{ 'read-mode': isReadMode, 'full-width-content': isFullWidth }"
    />
  </div>
</template>

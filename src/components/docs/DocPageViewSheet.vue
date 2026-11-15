<!-- src/components/docs/DocPageViewSheet.vue -->
<script setup lang="ts">
import { type Editor, EditorContent } from "@tiptap/vue-3";
import { A4_SHEET_WIDTH_PX } from "@/composables/docs/usePageView";

defineProps<{
  editor?: Editor;
  isReadMode: boolean;
  effectiveScale: number;
  totalSheetHeight: number;
}>();
</script>

<template>
  <div
    class="page-view-sheet-wrapper"
    :style="{
      width: `${A4_SHEET_WIDTH_PX * effectiveScale}px`,
      minHeight: `${totalSheetHeight * effectiveScale}px`,
    }"
  >
    <div
      class="page-view-sheet-scaler"
      :style="{
        transform: `scale(${effectiveScale})`,
        transformOrigin: 'top center',
        width: `${A4_SHEET_WIDTH_PX}px`,
      }"
    >
      <div
        class="page-view-sheet"
        :style="{
          minHeight: `${totalSheetHeight}px`,
        }"
      >
        <EditorContent
          :editor="editor"
          class="prose prose-invert max-w-none rose-editor-content flex-1 page-view-content"
          :class="{ 'read-mode': isReadMode }"
        />
      </div>
    </div>
  </div>
</template>

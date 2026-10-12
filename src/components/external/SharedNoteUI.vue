<script setup lang="ts">
import NoteCanvas from "@/components/notes/NoteCanvas.vue";
import ErrorBoundary from "@/components/ui/ErrorBoundary.vue";
import { useToolbarPosition } from "@/composables/ui/useToolbarPosition.ts";
import type { BackgroundPattern } from "@/db/types";

const {
  canvasJSON = null,
  backgroundColor = "#ffffff",
  backgroundPattern = "solid",
  title = "Shared Note",
} = defineProps<{
  canvasJSON?: Record<string, unknown> | null;
  backgroundColor?: string;
  backgroundPattern?: BackgroundPattern;
  title?: string;
}>();

const emit = defineEmits<{
  (
    e: 'change',
    canvasJSON: Record<string, unknown>,
    backgroundColor: string,
    backgroundPattern: BackgroundPattern,
    thumbnail: string
  ): void
}>();

const { effectivePosition } = useToolbarPosition();

function handleCanvasChange(
  newCanvasJSON: Record<string, unknown>,
  newBackgroundColor: string,
  newBackgroundPattern: BackgroundPattern,
  thumbnail: string,
) {
  emit('change', newCanvasJSON, newBackgroundColor, newBackgroundPattern, thumbnail);
}
</script>

<template>
  <div class="flex h-full flex-col bg-rose-bg relative">
    <div class="flex-1 min-h-0 bg-rose-surface overflow-hidden relative">
      <ErrorBoundary>
        <NoteCanvas
          :initial-canvas-json="canvasJSON"
          :initial-background-color="backgroundColor"
          :initial-background-pattern="backgroundPattern"
          :toolbar-position="effectivePosition"
          :note-title="title"
          @change="handleCanvasChange"
        />
      </ErrorBoundary>
    </div>
  </div>
</template>

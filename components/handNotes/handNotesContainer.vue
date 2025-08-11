<!-- components/NoteCanvas.vue -->
<template>
  <div class="px-2 sm:px-3 md:px-4 py-2 sm:py-3 w-full h-full">
    <div
      class="w-full h-full flex gap-2"
      :class="{
        'flex-col': toolbarPosition === 'top',
        'flex-row': toolbarPosition === 'left',
        'flex-row-reverse': toolbarPosition === 'right',
        'flex-col-reverse': toolbarPosition === 'bottom',
      }"
    >
      <!-- Toolbar Component -->
      <CanvasToolbar
        :toolbar-position="toolbarPosition"
        :is-editable="isEditable"
        :can-undo="canUndo"
        :can-redo="canRedo"
        :pen-color="penColor"
        :pen-width="penWidth"
        :bg-color="bgColor"
        @toggle-editable="toggleEdit"
        @undo-canvas="undo"
        @redo-canvas="redo"
        @clear-canvas="clear"
        @save-note="saveNote"
        @pen-color-change="setPenColor"
        @pen-width-change="setPenWidth"
        @bg-color-change="setBgColor"
        @toolbar-position-change="setToolbarPosition"
        @image-upload="onImageUpload"
        @export-canvas="handleExport"
      />

      <div class="max-w-full flex-grow flex flex-col">
        <!-- Title Input -->
        <div
          class="w-full flex-shrink-0 border-b border-rose-400 dark:border-rose-950"
        >
          <InputText
            v-model="noteTitle"
            type="text"
            placeholder="Enter a title..."
            class="w-full !rounded-t-xl !rounded-b-none text-xl md:text-2xl text-slate-800 dark:text-slate-200 placeholder:!text-rose-300 !border-none !px-4 !py-3"
            :style="{ backgroundColor: bgColor }"
            @input="debouncedSave"
          />
        </div>

        <!-- Canvas -->
        <div class="flex-grow relative rounded-xl">
          <canvas ref="canvas" class="w-full h-full rounded-b-xl"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, computed, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import SignaturePad from "signature_pad";
import { debounce } from "lodash-es";
import { useCanvasStore } from "@/stores/canvasStore";
import CanvasToolbar from "./CanvasToolbar.vue";
import InputText from "primevue/inputtext";

// Props
interface Props {
  noteId?: string;
  folderId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  noteId: "",
  folderId: "",
});

// Stores
const notesStore = useHandwrittenNotesStoreStore();
const canvasStore = useCanvasStore();

// Store refs
const { penColor, penWidth, bgColor, toolbarPosition, isEditable } =
  storeToRefs(canvasStore);

// Router
const route = useRoute();
const router = useRouter();

// Refs
const canvas = ref<HTMLCanvasElement | null>(null);
const noteTitle = ref("");
let signaturePad: SignaturePad | null = null;

// Computed
const canUndo = computed(() => canvasStore.historyIndex > 0);
const canRedo = computed(
  () => canvasStore.historyIndex < canvasStore.history.length - 1
);

// Current note
const currentNote = computed(() => notesStore.currentNote);

// Initialize component
onMounted(async () => {
  await initializeNote();
  setupCanvas();
  resizeCanvas();
});

// Initialize note based on route params
const initializeNote = async () => {
  const noteId = props.noteId || (route.params.noteId as string);
  const folderId = props.folderId || (route.params.folderId as string);

  if (noteId && noteId !== "new") {
    // Load existing note
    const note = findNoteById(noteId);
    if (note) {
      notesStore.setCurrentNote(note);
      noteTitle.value = note.title;
      canvasStore.loadSettings(note.settings);

      // Load canvas content if exists
      if (note.content) {
        await loadCanvasContent(note.content);
      }
    } else {
      // Note not found, redirect to notes list
      router.push("/notes");
    }
  } else {
    // Create new note
    if (folderId) {
      const newNote = notesStore.createNote(folderId);
      notesStore.setCurrentNote(newNote);
      noteTitle.value = newNote.title;

      // Update route to include the new note ID
      router.replace(`/handwritten-notes/${folderId}/${newNote.id}`);
    }
  }
};

// Setup canvas
const setupCanvas = () => {
  if (!canvas.value) return;

  signaturePad = new SignaturePad(canvas.value, {
    penColor: penColor.value,
    backgroundColor: bgColor.value,
    minWidth: penWidth.value,
    maxWidth: penWidth.value,
  });

  signaturePad.off(); // Start with editing disabled
  fillBackground(bgColor.value);

  // Save initial state
  saveState();

  // Add event listener for signature end
  signaturePad.addEventListener("endStroke", () => {
    saveState();
    debouncedSave();
  });
};

// Find note by ID across all folders
const findNoteById = (noteId: string) => {
  for (const folder of notesStore.folders) {
    const note = folder.note.find((n) => n.id === noteId);
    if (note) return note;
  }
  return null;
};

// Load canvas content from saved data
const loadCanvasContent = async (content: string) => {
  if (!canvas.value || !content) return;

  const img = new Image();
  img.onload = () => {
    const ctx = canvas.value?.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.value!.width, canvas.value!.height);
      ctx.drawImage(img, 0, 0, canvas.value!.width, canvas.value!.height);
    }
  };
  img.src = content;
};

// Debounced save function
const debouncedSave = debounce(() => {
  saveNote();
}, 1000);

// Save note
const saveNote = () => {
  if (!currentNote.value || !canvas.value) return;

  const canvasData = canvas.value.toDataURL();

  notesStore.updateNote(currentNote.value.id, {
    title: noteTitle.value,
    content: canvasData,
    settings: canvasStore.getCurrentSettings(),
  });
};

// Canvas operations
const toggleEdit = () => {
  canvasStore.setIsEditable(!isEditable.value);

  if (signaturePad) {
    if (isEditable.value) {
      signaturePad.on();
    } else {
      signaturePad.off();
    }
  }
};

const clear = () => {
  if (!signaturePad || !canvas.value) return;

  const ctx = canvas.value.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
    ctx.fillStyle = bgColor.value;
    ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
  }

  signaturePad.clear();
  canvasStore.resetHistory();
  saveState();
  debouncedSave();
};

const undo = () => {
  if (!canUndo.value) return;
  canvasStore.historyIndex--;
  applyState(canvasStore.history[canvasStore.historyIndex]);
};

const redo = () => {
  if (!canRedo.value) return;
  canvasStore.historyIndex++;
  applyState(canvasStore.history[canvasStore.historyIndex]);
};

// Store state management functions
const saveState = () => {
  if (!canvas.value || !signaturePad) return;

  const imageData = canvas.value.toDataURL();
  const strokeData = signaturePad.toData();

  canvasStore.addToHistory({
    image: imageData,
    strokes: strokeData,
  });
};

const applyState = (state: any) => {
  if (!canvas.value || !signaturePad) return;

  const ctx = canvas.value.getContext("2d");
  if (!ctx) return;

  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.value!.width, canvas.value!.height);
    ctx.drawImage(img, 0, 0);

    signaturePad!.clear();
    if (state.strokes.length > 0) {
      signaturePad!.fromData(state.strokes);
    }
  };
  img.src = state.image;
};

const fillBackground = (color: string) => {
  const ctx = canvas.value?.getContext("2d");
  if (!ctx || !canvas.value) return;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
};

const resizeCanvas = () => {
  if (!canvas.value) return;

  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.value.width = canvas.value.offsetWidth * ratio;
  canvas.value.height = canvas.value.offsetHeight * ratio;
  canvas.value.getContext("2d")?.scale(ratio, ratio);
};

const onImageUpload = (event: any) => {
  const file = event.files[0];
  if (!file || !canvas.value) return;

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.value?.getContext("2d");
      ctx?.drawImage(img, 0, 0, canvas.value!.width, canvas.value!.height);
      saveState();
      debouncedSave();
    };
    img.src = reader.result as string;
  };
  reader.readAsDataURL(file);
};

const handleExport = async (format: string) => {
  if (!canvas.value) return;
  // Your existing export logic here
};

// Watchers
watch(penColor, (color) => {
  if (signaturePad) {
    signaturePad.penColor = color;
  }
});

watch(penWidth, (width) => {
  if (signaturePad) {
    signaturePad.minWidth = width;
    signaturePad.maxWidth = width;
  }
});

watch(bgColor, (newColor) => {
  if (!signaturePad || !canvas.value) return;

  const strokeData = signaturePad.toData();
  const imgDataUrl = canvas.value.toDataURL();
  const img = new Image();

  img.onload = () => {
    const ctx = canvas.value?.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.value!.width, canvas.value!.height);
    ctx.fillStyle = newColor;
    ctx.fillRect(0, 0, canvas.value!.width, canvas.value!.height);
    ctx.drawImage(img, 0, 0, canvas.value!.width, canvas.value!.height);

    signaturePad?.clear();
    signaturePad?.fromData(strokeData);

    saveState();
    debouncedSave();
  };
  img.src = imgDataUrl;
});

// Save before unmounting
onUnmounted(() => {
  saveNote();
});
</script>

<style scoped>
canvas {
  touch-action: none;
}
</style>

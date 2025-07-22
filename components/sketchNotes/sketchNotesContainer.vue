<template>
  <div class="px-2 sm:px-3 md:px-4 py-2 sm:py-3 w-full h-full">
    <div
      :v-show="false"
      class="w-full h-full flex gap-2 border-0 border-rose-900"
      :class="{
        'flex-col': toolbarPosition === 'top',
        'flex-row': toolbarPosition === 'left',
        'flex-row-reverse': toolbarPosition === 'right',
        'flex-col-reverse': toolbarPosition === 'bottom',
      }"
    >
      <!-- Toolbar -->
      <div
        class="w-full p-2 rounded-xl bg-rose-400 dark:bg-rose-950 flex flex-nowrap gap-1 overflow-x-auto flex-shrink-0"
        :class="{
          'flex-row items-center':
            toolbarPosition === 'top' || toolbarPosition === 'bottom',
          'flex-col items-start':
            toolbarPosition === 'left' || toolbarPosition === 'right',
        }"
      >
        <Button
          class="!flex-shrink-0 h-8 md:h-9 2xl:h-10 !rounded-xl !bg-transparent !border-transparent !text-slate-900 dark:!text-slate-100 hover:!bg-rose-100 dark:hover:!bg-slate-700"
          title="To do list info"
          @click="navigateToNewList"
        >
          <FileEdit :size="16" />
        </Button>

        <div
          class="bg-rose-100 dark:bg-rose-900 flex-shrink-0"
          :class="{
            'w-[1px] h-[calc(100%-0.5rem)]':
              toolbarPosition === 'top' || toolbarPosition === 'bottom',
            'mx-2 my-1 h-[1px] w-full':
              toolbarPosition === 'left' || toolbarPosition === 'right',
          }"
        ></div>

        <!-- Pen Color -->
        <Button
          type="button"
          class="!flex-shrink-0 h-8 md:h-9 2xl:h-10 !rounded-xl !bg-transparent !border-transparent !text-slate-900 dark:!text-slate-100 hover:!bg-rose-100 dark:hover:!bg-slate-700"
          @click="togglePenPopover"
          ><Pen :size="16"
        /></Button>
        <Popover ref="penPopover">
          <div class="flex flex-col gap-4 w-[25rem] bg-transparent p-2">
            <div class="flex items-center gap-2">
              <span
                class="text-sm font-medium text-slate-800 dark:text-slate-200"
                >Pen color:</span
              >
              <ColorPicker
                v-model="penColor"
                format="hex"
                class="border border-rose-200 dark:border-rose-800 rounded-lg"
              />
            </div>
          </div>

          <div
            class="mx-2 my-1 h-[1px] max-w-full bg-rose-800 dark:bg-rose-200 rounded"
          ></div>

          <div class="flex flex-col gap-2 w-48 bg-transparent p-2">
            <span class="text-sm font-medium text-slate-800 dark:text-slate-200"
              >Pen width:</span
            >
            <div class="flex justify-between gap-2">
              <Button
                v-for="width in [1, 2, 4, 6, 10]"
                :key="width"
                class="p-2 min-w-10 !bg-transparent !border-rose-200 dark:!border-rose-800 hover:!bg-rose-100 dark:hover:!bg-slate-600"
                :class="{
                  '!bg-rose-300 dark:!bg-rose-800 !text-white':
                    penWidth === width,
                }"
                @click="setPenWidth(width)"
              >
                <div
                  class="rounded-full"
                  :class="{
                    'bg-black dark:bg-white': penWidth !== width,
                    'bg-white dark:bg-white': penWidth === width,
                  }"
                  :style="{ width: width + 'px', height: width + 'px' }"
                ></div>
              </Button>
            </div>
          </div>
        </Popover>

        <div
          class="bg-rose-100 dark:bg-rose-900 flex-shrink-0"
          :class="{
            'w-[1px] h-[calc(100%-0.5rem)]':
              toolbarPosition === 'top' || toolbarPosition === 'bottom',
            'mx-2 my-1 h-[1px] w-full':
              toolbarPosition === 'left' || toolbarPosition === 'right',
          }"
        ></div>

        <!-- Background Color -->
        <Button
          type="button"
          class="!flex-shrink-0 h-8 md:h-9 2xl:h-10 !rounded-xl !bg-transparent !border-transparent !text-slate-900 dark:!text-slate-100 hover:!bg-rose-100 dark:hover:!bg-slate-700"
          @click="toggleBgPopover"
          ><PaintBucket :size="16"
        /></Button>
        <Popover ref="bgPopover">
          <div class="flex flex-col gap-4 w-[25rem] bg-transparent p-2">
            <div class="flex items-center gap-2 p-2">
              <span class="text-sm text-slate-800 dark:text-slate-200"
                >Background color:</span
              >
              <ColorPicker
                v-model="bgColor"
                format="hex"
                class="border border-rose-200 dark:border-rose-800 rounded-lg"
              />
            </div>

            <div
              class="mx-2 my-1 h-[1px] max-w-full bg-rose-800 dark:bg-rose-200 rounded"
            ></div>

            <div class="p-2 flex justify-start">
              <!-- Image Upload -->

              <FileUpload
                mode="basic"
                name="file"
                accept="image/*"
                :customUpload="true"
                chooseLabel="Upload Image"
                class="!rounded-xl !bg-transparent !border-transparent !text-slate-900 dark:!text-slate-100 hover:!bg-rose-100 dark:hover:!bg-slate-700"
                @select="onImageUpload"
              />
            </div>
          </div>
        </Popover>

        <div
          class="bg-rose-100 dark:bg-rose-900 flex-shrink-0"
          :class="{
            'w-[1px] h-[calc(100%-0.5rem)]':
              toolbarPosition === 'top' || toolbarPosition === 'bottom',
            'mx-2 my-1 h-[1px] w-full':
              toolbarPosition === 'left' || toolbarPosition === 'right',
          }"
        ></div>

        <!-- Undo/Redo Buttons -->
        <Button
          type="button"
          class="!flex-shrink-0 h-8 md:h-9 2xl:h-10 !rounded-xl !bg-transparent !border-transparent !text-slate-900 dark:!text-slate-100 hover:!bg-rose-100 dark:hover:!bg-slate-700"
          @click="undo"
          :disabled="!canUndo"
          :class="{ '!opacity-50 !cursor-not-allowed': !canUndo }"
        >
          <Undo :size="16" />
        </Button>

        <div
          class="bg-rose-100 dark:bg-rose-900 flex-shrink-0"
          :class="{
            'w-[1px] h-[calc(100%-0.5rem)]':
              toolbarPosition === 'top' || toolbarPosition === 'bottom',
            'mx-2 my-1 h-[1px] w-full':
              toolbarPosition === 'left' || toolbarPosition === 'right',
          }"
        ></div>

        <Button
          type="button"
          class="!flex-shrink-0 h-8 md:h-9 2xl:h-10 !rounded-xl !bg-transparent !border-transparent !text-slate-900 dark:!text-slate-100 hover:!bg-rose-100 dark:hover:!bg-slate-700"
          @click="redo"
          :disabled="!canRedo"
          :class="{ '!opacity-50 !cursor-not-allowed': !canRedo }"
        >
          <Redo :size="16" />
        </Button>

        <div
          class="bg-rose-100 dark:bg-rose-900 flex-shrink-0"
          :class="{
            'w-[1px] h-[calc(100%-0.5rem)]':
              toolbarPosition === 'top' || toolbarPosition === 'bottom',
            'mx-2 my-1 h-[1px] w-full':
              toolbarPosition === 'left' || toolbarPosition === 'right',
          }"
        ></div>

        <!-- Edit Toggle -->
        <Button
          title="Toggle Edit Mode"
          class="!flex-shrink-0 h-8 md:h-9 2xl:h-10 !rounded-xl px-4 py-2 flex items-center gap-x-2 !bg-transparent !border-transparent !text-slate-900 dark:!text-slate-100 hover:!bg-rose-100 dark:hover:!bg-slate-700"
          @click="toggleEdit"
          :class="{
            ' ml-auto':
              toolbarPosition === 'top' || toolbarPosition === 'bottom',
            'mt-auto':
              toolbarPosition === 'left' || toolbarPosition === 'right',
          }"
        >
          <component :is="isEditable ? Lock : FileEdit" :size="16" />
          <!-- <span>{{ isEditable ? "Lock" : "Edit" }}</span> -->
        </Button>

        <div
          class="bg-rose-100 dark:bg-rose-900 flex-shrink-0"
          :class="{
            'w-[1px] h-[calc(100%-0.5rem)]':
              toolbarPosition === 'top' || toolbarPosition === 'bottom',
            'mx-2 my-1 h-[1px] w-full':
              toolbarPosition === 'left' || toolbarPosition === 'right',
          }"
        ></div>

        <!-- Clear Canvas -->
        <Button
          title="Clear Canvas"
          class="!flex-shrink-0 h-8 md:h-9 2xl:h-10 !rounded-xl px-4 py-2 flex items-center gap-x-2 !bg-transparent !border-transparent !text-slate-900 dark:!text-slate-100 hover:!bg-rose-100 dark:hover:!bg-slate-700"
          @click="clear"
        >
          <Trash :size="16" />
          <!-- <span>Clear</span> -->
        </Button>

        <div
          class="bg-rose-100 dark:bg-rose-900 flex-shrink-0"
          :class="{
            'w-[1px] h-[calc(100%-0.5rem)]':
              toolbarPosition === 'top' || toolbarPosition === 'bottom',
            'mx-2 my-1 h-[1px] w-full':
              toolbarPosition === 'left' || toolbarPosition === 'right',
          }"
        ></div>

        <!-- Save Changes -->
        <Button
          title="Save Changes"
          class="!flex-shrink-0 h-8 md:h-9 2xl:h-10 !rounded-xl px-4 py-2 flex items-center gap-x-2 !bg-transparent !border-transparent !text-slate-900 dark:!text-slate-100 hover:!bg-rose-100 dark:hover:!bg-slate-700"
        >
          <Check :size="16" />
          <!-- <span>Save Changes</span> -->
        </Button>

        <div
          class="bg-rose-100 dark:bg-rose-900 flex-shrink-0"
          :class="{
            'w-[1px] h-[calc(100%-0.5rem)]':
              toolbarPosition === 'top' || toolbarPosition === 'bottom',
            'mx-2 my-1 h-[1px] w-full':
              toolbarPosition === 'left' || toolbarPosition === 'right',
          }"
        ></div>

        <!-- Export Button with Popover -->
        <Button
          title="Export Canvas"
          type="button"
          class="!flex-shrink-0 h-8 md:h-9 2xl:h-10 !rounded-xl !bg-transparent !border-transparent !text-slate-900 dark:!text-slate-100 hover:!bg-rose-100 dark:hover:!bg-slate-700"
          @click="toggleExportPopover"
        >
          <Download :size="20" />
        </Button>

        <Popover
          v-if="exportFormats?.length > 0"
          ref="exportPopover"
          class="!rounded-xl !bg-rose-300 dark:!bg-rose-950 !border-transparent"
        >
          <div class="flex flex-col gap-y-5 w-48 bg-transparent">
            <span class="text-sm font-medium text-slate-800 dark:text-slate-200"
              >Export format:</span
            >
            <div class="flex flex-col">
              <div v-for="(format, index) in exportFormats" :key="format.value">
                <Button
                  class="w-full flex !justify-start items-center gap-2 p-2 !text-slate-900 dark:!text-slate-100 !bg-transparent !border-transparent !rounded-xl cursor-pointer"
                  @click="
                    () => {
                      handleExport(format.value);
                      exportPopover.value.hide();
                    }
                  "
                >
                  <File :size="16" class="" />
                  <span class="text-xs md:text-sm">{{ format.label }}</span>
                </Button>
                <div
                  v-if="index !== exportFormats.length - 1"
                  class="mx-2 my-1 h-[1px] max-w-full bg-rose-800 dark:bg-rose-200 rounded"
                ></div>
              </div>
            </div>
          </div>
        </Popover>

        <div
          class="bg-rose-100 dark:bg-rose-900 flex-shrink-0"
          :class="{
            'w-[1px] h-[calc(100%-0.5rem)]':
              toolbarPosition === 'top' || toolbarPosition === 'bottom',
            'mx-2 my-1 h-[1px] w-full':
              toolbarPosition === 'left' || toolbarPosition === 'right',
          }"
        ></div>

        <!-- Change toolbar position -->
        <Button
          title="Change Toolbar Position"
          class="!flex-shrink-0 h-8 md:h-9 2xl:h-10 !rounded-xl px-4 py-2 flex items-center gap-x-2 !bg-transparent !border-transparent !text-slate-900 dark:!text-slate-100 hover:!bg-rose-100 dark:hover:!bg-slate-700"
          @click="toggleToolbarPositionPopover"
        >
          <Wrench :size="16" />
          <!-- <span>Clear</span> -->
        </Button>

        <Popover
          ref="toolbarPositionPopover"
          class="!rounded-xl !bg-rose-300 dark:!bg-rose-950 !border-transparent"
        >
          <div class="flex flex-col gap-y-2 p-2">
            <span
              class="text-sm font-medium text-slate-800 dark:text-slate-200"
            >
              Toolbar Position:
            </span>
            <div class="flex flex-col">
              <Button
                v-for="position in ['top', 'bottom', 'left', 'right']"
                :key="position"
                class="w-full flex !justify-start items-center gap-2 p-2 !text-slate-900 dark:!text-slate-100 !bg-transparent !border-transparent !rounded-xl cursor-pointer"
                :class="{
                  '!bg-rose-300 dark:!bg-rose-800 !text-white':
                    toolbarPosition === position,
                }"
                @click="handleToolbarPositionChange(position)"
              >
                <span class="text-xs md:text-sm capitalize">{{
                  position
                }}</span>
              </Button>
            </div>
          </div>
        </Popover>
      </div>

      <!-- <CanvasToolbar
        :toolbarPosition="toolbarPosition"
        :isEditable="isEditable"
        @navigateToNewList="navigateToNewList"
        @togglePenPopover="togglePenPopover"
        @toggleBrushWidthPopover="togglePenPopover"
        @toggleEditable="toggleEdit"
        @undoCanvas="undo"
        @redoCanvas="redo"
        @clearCanvas="clear"
        @toggleTitleInput="() => {}"
        @toggleToolbarPositionPopover="toggleToolbarPositionPopover"
      /> -->

      <div class="max-w-full flex-grow-1 flex flex-col">
        <!-- Title Input -->
        <div
          class="w-full flex-shrink-0 border-b border-rose-400 dark:border-rose-950"
        >
          <InputText
            v-model="title"
            type="text"
            placeholder="Enter a title..."
            class="w-full !rounded-t-xl !rounded-b-none text-xl md:text-2xl text-slate-800 dark:text-slate-200 placeholder:!text-rose-300 !border-none border-rose-300 dark:border-rose-700 focus:outline-none focus:border-rose-500 !px-4 !py-3"
            :style="{ backgroundColor: bgColor }"
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
import { onMounted, ref, watch } from "vue";
import SignaturePad from "signature_pad";
import {
  Check,
  Download,
  File,
  FileEdit,
  Lock,
  PaintBucket,
  Pen,
  Pencil,
  Redo,
  Trash,
  Undo,
  Wrench,
} from "lucide-vue-next";
import ColorPicker from "primevue/colorpicker";
import Button from "primevue/button";
import Select from "primevue/select";
import FileUpload from "primevue/fileupload";
import Popover from "primevue/popover";
import { useRouter } from "vue-router";
import { v4 as uuidv4 } from "uuid";

let signaturePad: SignaturePad | null = null;

const router = useRouter();

const canvas = ref<HTMLCanvasElement | null>(null);
// const isEditable = ref(false);
// const penColor = ref<string>("#000000");
// const bgColor = ref<string>("#0f0f0f");
const penPopover = ref();
const bgPopover = ref();
// const penWidth = ref<number>(2);
// const penWidthPopover = ref();
// const title = ref("");

// Undo/Redo history state
const history = ref<any[]>([]);
const historyIndex = ref(-1);
const canUndo = ref(false);
const canRedo = ref(false);
const exportPopover = ref();
const toolbarPositionPopover = ref();
// const toolbarPosition = ref("top");

import { storeToRefs } from "pinia";
import { useSkecthNotesStore } from "@/stores/sketchNotesStore";
import CanvasToolbar from "./CanvasToolbar.vue";

const canvasStore = useSkecthNotesStore();
const { penColor, penWidth, bgColor, title, toolbarPosition, isEditable } =
  storeToRefs(canvasStore);

const { exportFormats, isExporting, exportCanvas } = useCanvasExport();

const handleExport = async (format: string) => {
  if (!canvas.value) return;
  try {
    await exportCanvas(format, canvas.value, bgColor.value, title.value);
  } catch (error) {
    alert("Export failed: " + (error as Error).message);
  }
};

const handleToolbarPositionChange = (position: string) => {
  // toolbarPosition.value = position;
  canvasStore.setToolbarPosition(position);
  toolbarPositionPopover.value.hide();
};

// Update pen width
const setPenWidth = (width: number) => {
  penWidth.value = width;
  if (signaturePad) {
    signaturePad.minWidth = width;
    signaturePad.maxWidth = width;
  }
  penPopover.value.hide();
};

onMounted(() => {
  resizeCanvas();

  if (canvas.value) {
    signaturePad = new SignaturePad(canvas.value, {
      penColor: penColor.value,
      backgroundColor: bgColor.value,
      minWidth: penWidth?.value ?? 0,
      maxWidth: penWidth?.value,
    });
    signaturePad.off();
    // Manually fill background since SignaturePad's backgroundColor doesn't auto-fill
    fillBackground(bgColor.value);

    // Save initial state
    saveState();

    // Add event listener for signature end
    if (signaturePad) {
      signaturePad.addEventListener("endStroke", () => {
        saveState();
      });
    }
  }
});

// Update pen color
watch(penColor, (color) => {
  if (signaturePad) {
    signaturePad.penColor = color;
  }
});

// Update background color without erasing drawing
watch(bgColor, (newColor) => {
  if (!signaturePad || !canvas.value) return;

  const canvasEl = canvas.value;

  // Step 1: Save strokes from SignaturePad
  const strokeData = signaturePad.toData();

  // Step 2: Save full canvas image (drawing + image uploads)
  const imgDataUrl = canvasEl.toDataURL();
  const img = new Image();

  img.onload = () => {
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;

    // Step 3: Clear everything
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    // Step 4: Fill with new background color
    ctx.fillStyle = newColor;
    ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);

    // Step 5: Draw old image content on top
    ctx.drawImage(img, 0, 0, canvasEl.width, canvasEl.height);

    // Step 6: Re-apply SignaturePad strokes (must be after drawImage)
    signaturePad?.clear(); // only clears internal strokes
    signaturePad?.fromData(strokeData);

    // Save state after background change
    saveState();
  };

  img.src = imgDataUrl;
});

// Fill canvas background manually
const fillBackground = (color: string) => {
  const ctx = canvas.value?.getContext("2d");
  if (!ctx || !canvas.value) return;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
};

// Clear the canvas (and refill background)
const clear = () => {
  if (!signaturePad || !canvas.value) return;

  const ctx = canvas.value.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  ctx.fillStyle = bgColor.value;
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);

  signaturePad.clear();
  title.value = "";
};

// Export canvas as image
const exportImage = () => {
  if (!signaturePad || !canvas.value) return;

  if (!signaturePad.isEmpty()) {
    const dataUrl = canvas.value.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "note.png";
    link.click();
  } else {
    alert("Canvas is empty!");
  }
};

// Handle image upload and draw it on canvas
const onImageUpload = (event: any) => {
  const file = event.files[0];

  console.log(file);
  if (!file || !canvas.value) return;

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.value?.getContext("2d");
      ctx?.drawImage(img, 0, 0, canvas.value!.width, canvas.value!.height);
    };
    img.src = reader.result as string;
  };
  reader.readAsDataURL(file);

  // Save state after image upload
  saveState();
};

// Resize canvas to handle device pixel ratio
const resizeCanvas = () => {
  if (!canvas.value) return;

  const canvasEl = canvas.value;
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvasEl.width = canvasEl.offsetWidth * ratio;
  canvasEl.height = canvasEl.offsetHeight * ratio;
  canvasEl.getContext("2d")?.scale(ratio, ratio);
};

const toggleEdit = () => {
  isEditable.value = !isEditable.value;

  if (signaturePad && canvas.value) {
    if (isEditable.value) {
      signaturePad.on(); // enable drawing
    } else {
      signaturePad.off(); // disable drawing
    }
  }
};

const togglePenPopover = (event: any) => {
  penPopover.value.toggle(event);
};

const toggleBgPopover = (event: any) => {
  bgPopover.value.toggle(event);
};

const toggleExportPopover = (event: any) => {
  exportPopover.value.toggle(event);
};

const toggleToolbarPositionPopover = (event: any) => {
  toolbarPositionPopover.value.toggle(event);
};

// Undo/Redo functions
const saveState = () => {
  if (!canvas.value || !signaturePad) return;

  // Get the current canvas image
  const imageData = canvas.value.toDataURL();
  // Get SignaturePad data
  const strokeData = signaturePad.toData();

  // If we're in the middle of the history, remove everything after current index
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1);
  }

  // Add new state to history
  history.value.push({
    image: imageData,
    strokes: strokeData,
  });

  // Update index to point to latest state
  historyIndex.value = history.value.length - 1;

  // Update undo/redo availability
  updateUndoRedoState();
};

const updateUndoRedoState = () => {
  canUndo.value = historyIndex.value > 0;
  canRedo.value = historyIndex.value < history.value.length - 1;
};

const undo = () => {
  if (!canUndo.value || !canvas.value || !signaturePad) return;

  // Decrease history index
  historyIndex.value -= 1;

  // Apply the state at the new index
  applyState(history.value[historyIndex.value]);

  // Update undo/redo availability
  updateUndoRedoState();
};

const redo = () => {
  if (!canRedo.value || !canvas.value || !signaturePad) return;

  // Increase history index
  historyIndex.value += 1;

  // Apply the state at the new index
  applyState(history.value[historyIndex.value]);

  // Update undo/redo availability
  updateUndoRedoState();
};

const applyState = (state: any) => {
  if (!canvas.value || !signaturePad) return;

  const ctx = canvas.value.getContext("2d");
  if (!ctx) return;

  // Load the image
  const img = new Image();
  img.onload = () => {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.value!.width, canvas.value!.height);

    // Draw the saved image
    ctx.drawImage(img, 0, 0);

    // Restore SignaturePad data
    signaturePad!.clear();
    if (state.strokes.length > 0) {
      signaturePad!.fromData(state.strokes);
    }
  };
  img.src = state.image;
};

const navigateToNewList = () => {
  const newListId = uuidv4();
  router.push(`/to-do-list/${newListId}`);
};
</script>

<style lang="css" scoped>
canvas {
  touch-action: none; /* important for mobile/touch devices */
}
</style>

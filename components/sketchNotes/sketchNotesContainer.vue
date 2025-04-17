<template>
  <div
    class="px-4 py-2 w-full h-full flex flex-col gap-y-4 md:gap-y-5 2xl:gap-y-6"
  >
    <!-- Toolbar -->
    <div
      class="h-8 md:h-10 lg:h-11 flex-shrink-0 flex items-center gap-2 md:gap-3 2xl:gap-4 flex-wrap overflow-x-auto"
    >
      <Button
        type="button"
        
        @click="toggle"
      ><Pen :size="20" /></Button>
      <Popover ref="op">
        <div class="flex flex-col gap-4 w-[25rem] bg-white">
          <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600">Pen:</span>
        <ColorPicker v-model="penColor" format="hex" />
      </div>
        </div>
        </Popover
      >

      <!-- Pen Color -->
      

      <!-- Background Color -->
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600">Background:</span>
        <ColorPicker v-model="bgColor" format="hex" />
      </div>

      <!-- Image Upload -->

      <FileUpload
        mode="basic"
        name="file"
        accept="image/*"
        :customUpload="true"
        chooseLabel="Upload Image"
        class="p-button-rounded"
        @select="onImageUpload"
      />

      <!-- Edit Toggle -->
      <Button
        class="ml-auto !rounded-xl px-4 py-2 flex items-center gap-x-2"
        @click="toggleEdit"
      >
        <component :is="isEditable ? Lock : Pencil" :size="16" />
        <span>{{ isEditable ? "Lock" : "Edit" }}</span>
      </Button>

      <!-- Clear Canvas -->
      <Button
        class="!rounded-xl px-4 py-2 flex items-center gap-x-2"
        @click="clear"
      >
        <Trash :size="16" />
        <span>Clear</span>
      </Button>

      <!-- Export Options -->
      <Select
        :options="exportFormats"
        optionLabel="label"
        optionValue="value"
        class="!rounded-xl h-full"
        @change="(e: any) => handleExport(e.value)"
        placeholder="Export"
      >
        <template #value="slotProps">
          <Button
            class="rounded-full h-full flex items-center gap-x-2"
            :loading="isExporting"
            severity="secondary"
          >
            <Download :size="16" />
            <span>{{ slotProps.value ? slotProps.value : "Export" }}</span>
          </Button>
        </template>
      </Select>
    </div>

    <!-- Canvas -->
    <div class="max-w-full max-h-full flex-grow rounded-3xl relative">
      <canvas ref="canvas" class="w-full h-full rounded-3xl"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import SignaturePad from "signature_pad";
import { Download, Lock, Pen, Pencil, Trash } from "lucide-vue-next";
import ColorPicker from "primevue/colorpicker";
import Button from "primevue/button";
import Select from "primevue/select";
import FileUpload from "primevue/fileupload";

let signaturePad: SignaturePad | null = null;

const canvas = ref<HTMLCanvasElement | null>(null);
const isEditable = ref(false);
const penColor = ref<string>("#000000");
const bgColor = ref<string>("#ffffff");
const op = ref();

const { exportFormats, isExporting, exportCanvas } = useCanvasExport();

const handleExport = async (format: string) => {
  if (!canvas.value) return;
  try {
    await exportCanvas(format, canvas.value, bgColor.value);
  } catch (error) {
    alert("Export failed: " + (error as Error).message);
  }
};

onMounted(() => {
  resizeCanvas();

  if (canvas.value) {
    signaturePad = new SignaturePad(canvas.value, {
      penColor: penColor.value,
      backgroundColor: bgColor.value,
    });
    signaturePad.off();
    // Manually fill background since SignaturePad's backgroundColor doesn't auto-fill
    fillBackground(bgColor.value);
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
</script>

<style scoped>
canvas {
  touch-action: none; /* important for mobile/touch devices */
}
</style>

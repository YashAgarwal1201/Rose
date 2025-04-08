<template>
  <div class="px-4 py-2 w-full h-full flex flex-col gap-y-4">
    <!-- Toolbar -->
    <div class="flex-shrink-0 flex items-center gap-4">
      <label>
        Pen Color:
        <input type="color" v-model="penColor" />
      </label>

      <label>
        Background:
        <input type="color" v-model="bgColor" />
      </label>

      <!-- Pen Color -->
      <!-- <div class="flex flex-col items-start gap-1">
        <span class="text-sm text-gray-600">Pen Color</span>
        <UColorPicker
          v-model="penColor"
          :modes="['hex', 'rgb', 'hsl']"
          format="hex"
          alpha
        />
      </div> -->

      <!-- Background Color -->
      <!-- <div class="flex flex-col items-start gap-1">
        <span class="text-sm text-gray-600">Background</span>
        <UColorPicker
          v-model="bgColor"
          :modes="['hex', 'rgb', 'hsl']"
          format="hex"
          alpha
        />
      </div> -->

      <UPopover>
        <UButton label="Choose color" variant="outline">
          <template #leading>
            <span
              :style="[{ backgroundColor: penColor }]"
              class="size-3 rounded-full"
            />
          </template>
        </UButton>

        <template #content>
          <UColorPicker v-model="penColor" class="p-2" />
        </template>
      </UPopover>

      <!-- <input type="file" accept="image/*" @change="onImageUpload" /> -->

      <UInput
        type="file"
        @change="onImageUpload"
        accept="image/*"
        class="rounded-full *:rounded-full *:px-4 *:py-2"
      />
      <UButton
        class="rounded-full px-4 py-2"
        variant="outline"
        @click="toggleEdit"
      >
        <span v-if="isEditable" class="flex items-center justify-center gap-x-2"
          ><Lock :size="16" /> <span>Lock</span></span
        >
        <span v-else class="flex items-center justify-center gap-x-2"
          ><Pencil :size="16" /> <span>Edit</span></span
        >
      </UButton>

      <UButton
        class="ml-auto rounded-full flex items-center justify-center px-4 py-2"
        variant="outline"
        @click="clear"
      >
        <Trash :size="16" /> <span>Clear</span>
      </UButton>

      <UButton
        class="rounded-full flex items-center justify-center px-4 py-2"
        @click="exportImage"
      >
        <Download :size="16" /> <span>Export</span>
      </UButton>
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
import { Download, Lock, Pencil, Trash } from "lucide-vue-next";

let signaturePad: SignaturePad | null = null;

const canvas = ref<HTMLCanvasElement | null>(null);
const isEditable = ref(false);
const penColor = ref<string>("#000000");
const bgColor = ref<string>("#ffffff");

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
const onImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target?.files?.[0];
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

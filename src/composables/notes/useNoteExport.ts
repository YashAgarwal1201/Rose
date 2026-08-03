import type { Canvas } from "fabric";
import type { Ref } from "vue";

function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "-").trim() || "Untitled";
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function useNoteExport(
  canvas: Ref<Canvas | null>,
  noteTitle: Ref<string | undefined>,
  isExportMenuOpen: Ref<boolean>,
) {
  function exportAsPng() {
    if (!canvas.value || !noteTitle.value) {
      return;
    }
    const dataUrl = canvas.value.toDataURL({ format: "png", multiplier: 1 });
    downloadDataUrl(dataUrl, `${sanitizeFilename(noteTitle.value)}.png`);
    isExportMenuOpen.value = false;
  }

  function exportAsJpeg() {
    if (!canvas.value || !noteTitle.value) {
      return;
    }
    const dataUrl = canvas.value.toDataURL({ format: "jpeg", quality: 0.9, multiplier: 1 });
    downloadDataUrl(dataUrl, `${sanitizeFilename(noteTitle.value)}.jpg`);
    isExportMenuOpen.value = false;
  }

  function exportAsSvg() {
    if (!canvas.value || !noteTitle.value) {
      return;
    }
    const svg = canvas.value.toSVG();
    downloadFile(svg, `${sanitizeFilename(noteTitle.value)}.svg`, "image/svg+xml");
    isExportMenuOpen.value = false;
  }

  return { exportAsPng, exportAsJpeg, exportAsSvg };
}

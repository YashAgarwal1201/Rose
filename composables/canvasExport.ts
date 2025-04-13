// useCanvasExport.ts
import { ref } from "vue";
import { jsPDF } from "jspdf";
import { Image } from "lucide-vue-next";

export function useCanvasExport() {
  // Track last used export format
  const lastExportFormat = ref<string>("png");
  const isExporting = ref<boolean>(false);

  // Available export formats
  const exportFormats = [
    { label: "PNG Image", icon: "i-lucide-image", value: "png" },
    { label: "JPEG Image", icon: "i-lucide-file-image", value: "jpeg" },
    { label: "WebP Image", icon: "i-lucide-file-type-2", value: "webp" },
    { label: "SVG Vector", icon: "i-lucide-file-text", value: "svg" },
    { label: "PDF Document", icon: "i-lucide-file-down", value: "pdf" },
    ,
  ];

  // Generate a timestamped filename
  const generateFileName = (): string => {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:.]/g, "")
      .slice(0, 15);
    return `drawing_${timestamp}`;
  };

  // Trigger file download
  const downloadFile = (url: string, filename: string): void => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export as raster image (PNG, JPEG, WebP)
  const exportImage = (
    canvas: HTMLCanvasElement,
    fileName: string,
    mimeType: string
  ): void => {
    if (!canvas) return;

    // Set quality for JPEG (other formats ignore this)
    const quality = mimeType === "image/jpeg" ? 0.9 : undefined;
    const dataUrl = canvas.toDataURL(mimeType, quality);

    const extension = mimeType.split("/")[1];
    downloadFile(dataUrl, `${fileName}.${extension}`);
  };

  // Export as SVG
  const exportSVG = (
    canvas: HTMLCanvasElement,
    fileName: string,
    bgColor: string
  ): void => {
    if (!canvas) return;

    try {
      // Create SVG element
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      const width = canvas.width;
      const height = canvas.height;

      svg.setAttribute("width", width.toString());
      svg.setAttribute("height", height.toString());
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

      // Add background rect
      const rect = document.createElementNS(svgNS, "rect");
      rect.setAttribute("width", width.toString());
      rect.setAttribute("height", height.toString());
      rect.setAttribute("fill", bgColor);
      svg.appendChild(rect);

      // Convert canvas to SVG-compatible image
      const img = document.createElementNS(svgNS, "image");
      img.setAttribute("width", width.toString());
      img.setAttribute("height", height.toString());
      img.setAttribute("x", "0");
      img.setAttribute("y", "0");
      img.setAttribute("href", canvas.toDataURL("image/png"));
      svg.appendChild(img);

      // Create SVG blob and download
      const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
        type: "image/svg+xml;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);
      downloadFile(url, `${fileName}.svg`);

      // Clean up
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting SVG:", err);
      throw new Error("SVG export failed");
    }
  };

  // Export as PDF
  const exportPDF = (canvas: HTMLCanvasElement, fileName: string): void => {
    if (!canvas) return;

    try {
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Calculate PDF dimensions (convert to mm, assuming 72 DPI)
      const pdfWidth = (canvasWidth * 25.4) / 72;
      const pdfHeight = (canvasHeight * 25.4) / 72;

      // Create PDF with proper orientation
      const orientation = canvasWidth > canvasHeight ? "landscape" : "portrait";
      const pdf = new jsPDF({
        orientation,
        unit: "mm",
        format: [pdfWidth, pdfHeight],
      });

      // Get canvas data URL
      const dataUrl = canvas.toDataURL("image/jpeg", 1.0);

      // Add image to PDF, covering the entire page
      pdf.addImage(dataUrl, "JPEG", 0, 0, pdfWidth, pdfHeight);

      // Save PDF
      pdf.save(`${fileName}.pdf`);
    } catch (err) {
      console.error("Error exporting PDF:", err);
      throw new Error("PDF export failed. Is jsPDF installed?");
    }
  };

  // Main export handler
  const exportCanvas = async (
    format: string,
    canvas: HTMLCanvasElement,
    bgColor: string = "#ffffff",
    customFileName?: string
  ): Promise<void> => {
    if (!canvas) {
      throw new Error("No canvas provided for export");
    }

    try {
      isExporting.value = true;
      lastExportFormat.value = format;

      // Use custom filename if provided, otherwise generate one
      const fileName = customFileName || generateFileName();

      switch (format) {
        case "png":
          exportImage(canvas, fileName, "image/png");
          break;
        case "jpeg":
          exportImage(canvas, fileName, "image/jpeg");
          break;
        case "webp":
          exportImage(canvas, fileName, "image/webp");
          break;
        case "svg":
          exportSVG(canvas, fileName, bgColor);
          break;
        case "pdf":
          exportPDF(canvas, fileName);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error("Export failed:", error);
      throw error;
    } finally {
      isExporting.value = false;
    }
  };

  // Check if the canvas is empty (optional utility)
  const isCanvasEmpty = (canvas: HTMLCanvasElement): boolean => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return true;

    const pixelBuffer = new Uint32Array(
      ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer
    );

    // Check if all pixels are transparent or match the background color
    return !pixelBuffer.some((color) => color !== 0);
  };

  return {
    exportFormats,
    lastExportFormat,
    isExporting,
    exportCanvas,
    isCanvasEmpty,
  };
}

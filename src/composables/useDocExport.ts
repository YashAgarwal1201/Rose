import type { Editor } from "@tiptap/core";
import type { Ref } from "vue";

function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "-").trim() || "Untitled";
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

export function useDocExport(
  editor: Ref<Editor | undefined>,
  docTitle: Ref<string | undefined>,
  isExportMenuOpen: Ref<boolean>,
) {
  function exportAsHtml() {
    if (!editor.value || !docTitle.value) return;
    const html = `<!DOCTYPE html>\n<html>\n<head><meta charset="UTF-8"><title>${docTitle.value}</title></head>\n<body>\n${editor.value.getHTML()}\n</body>\n</html>`;
    downloadFile(html, `${sanitizeFilename(docTitle.value)}.html`, "text/html");
    isExportMenuOpen.value = false;
  }

  function exportAsMarkdown() {
    if (!editor.value || !docTitle.value) return;
    downloadFile(
      (editor.value as Editor & { getMarkdown(): string }).getMarkdown(),
      `${sanitizeFilename(docTitle.value)}.md`,
      "text/markdown",
    );
    isExportMenuOpen.value = false;
  }

  function exportAsText() {
    if (!editor.value || !docTitle.value) return;
    downloadFile(editor.value.getText(), `${sanitizeFilename(docTitle.value)}.txt`, "text/plain");
    isExportMenuOpen.value = false;
  }

  return { exportAsHtml, exportAsMarkdown, exportAsText };
}

// src/composables/docs/useDocFileImport.ts
import { ref, type ShallowRef } from "vue";
import type { Editor } from "@tiptap/core";
import Papa from "papaparse";
import { useToast } from "@/composables/ui/useToast";
import { MAX_TABLE_ROWS, MAX_TABLE_COLS } from "@/composables/docs/useDocTableActions";

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result as string));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

export function buildTableContentFromRows(rows: string[][], firstRowIsHeader: boolean) {
  const tableRows = rows.map((row, rowIndex) => ({
    type: "tableRow",
    content: row.map((cellText) => ({
      type: firstRowIsHeader && rowIndex === 0 ? "tableHeader" : "tableCell",
      content: cellText.trim()
        ? [{ type: "paragraph", content: [{ type: "text", text: cellText }] }]
        : [{ type: "paragraph" }],
    })),
  }));
  return { type: "table", content: tableRows };
}

export function useDocFileImport(params: {
  editor: ShallowRef<Editor | undefined>;
}) {
  const { editor } = params;
  const { showToast } = useToast();

  const fileInputRef = ref<HTMLInputElement | null>(null);
  const csvFileInputRef = ref<HTMLInputElement | null>(null);
  const csvFirstRowIsHeader = ref(true);

  function triggerImagePick(): void {
    fileInputRef.value?.click();
  }

  async function handleImageSelect(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    const src = await fileToDataUrl(file);
    editor.value?.chain().focus().setImage({ src }).run();
    (event.target as HTMLInputElement).value = "";
  }

  function triggerCsvPick(): void {
    csvFileInputRef.value?.click();
  }

  async function handleCsvSelect(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = "";
    if (!file) {
      return;
    }

    const text = await file.text();
    const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });

    if (parsed.errors.length > 0) {
      showToast("Couldn't read that CSV file.", "error");
      return;
    }

    let rows = parsed.data;
    if (rows.length === 0) {
      showToast("That CSV file is empty.", "error");
      return;
    }

    const totalRows = rows.length;
    const totalCols = Math.max(...rows.map((row) => row.length));
    const truncatedRows = totalRows > MAX_TABLE_ROWS;
    const truncatedCols = totalCols > MAX_TABLE_COLS;

    rows = rows.slice(0, MAX_TABLE_ROWS).map((row) => row.slice(0, MAX_TABLE_COLS));

    const tableContent = buildTableContentFromRows(rows, csvFirstRowIsHeader.value);
    editor.value?.chain().focus().insertContent(tableContent).run();

    if (truncatedRows || truncatedCols) {
      const parts = [
        truncatedRows ? `first ${MAX_TABLE_ROWS} of ${totalRows} rows` : null,
        truncatedCols ? `first ${MAX_TABLE_COLS} of ${totalCols} columns` : null,
      ].filter(Boolean);
      showToast(`CSV was larger than the table limit — imported ${parts.join(" and ")}.`, "error");
    }
  }

  return {
    fileInputRef,
    csvFileInputRef,
    csvFirstRowIsHeader,
    triggerImagePick,
    handleImageSelect,
    triggerCsvPick,
    handleCsvSelect,
  };
}

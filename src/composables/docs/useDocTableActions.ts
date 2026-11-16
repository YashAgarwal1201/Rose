// src/composables/docs/useDocTableActions.ts
import { ref } from "vue";
import type { Editor } from "@tiptap/core";
import { TableMap } from "@tiptap/pm/tables";
import { type PopoverPlacement, usePopoverPosition } from "@/composables/ui/usePopoverPosition";
import { useToast } from "@/composables/ui/useToast";

export const MAX_TABLE_ROWS = 20;
export const MAX_TABLE_COLS = 10;

export const CELL_BG_COLORS = [
  { label: "None", value: null },
  { label: "Yellow", value: "#fef9c3" },
  { label: "Green", value: "#dcfce7" },
  { label: "Blue", value: "#dbeafe" },
  { label: "Pink", value: "#fce7f3" },
  { label: "Orange", value: "#ffedd5" },
  { label: "Gray", value: "#e2e8f0" },
];

export function useDocTableActions(params: {
  editor: { value: Editor | undefined };
}) {
  const { editor } = params;
  const { showToast } = useToast();

  const isCellBgPickerOpen = ref(false);
  const cellBgRootRef = ref<HTMLElement | null>(null);
  const cellBgTriggerRef = ref<HTMLButtonElement | null>(null);
  const cellBgPopoverRef = ref<HTMLElement | null>(null);

  const cellBgAnchor = usePopoverPosition(
    cellBgRootRef,
    cellBgTriggerRef,
    cellBgPopoverRef,
    "bottom-start" as PopoverPlacement,
  );

  function getCurrentTableDimensions(): { rows: number; cols: number } | null {
    if (!editor.value) {
      return null;
    }
    const { $from } = editor.value.state.selection;
    for (let { depth } = $from; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.type.name === "table") {
        const map = TableMap.get(node);
        return { rows: map.height, cols: map.width };
      }
    }
    return null;
  }

  function isTableAtMaxRows(): boolean {
    return (getCurrentTableDimensions()?.rows ?? 0) >= MAX_TABLE_ROWS;
  }

  function isTableAtMaxCols(): boolean {
    return (getCurrentTableDimensions()?.cols ?? 0) >= MAX_TABLE_COLS;
  }

  function isCurrentTableBordered(): boolean {
    if (!editor.value) {
      return true;
    }
    const { $from } = editor.value.state.selection;
    for (let { depth } = $from; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.type.name === "table") {
        return node.attrs.bordered !== false;
      }
    }
    return true;
  }

  function toggleTableBorders(): void {
    if (!editor.value) {
      return;
    }
    const { state, view } = editor.value;
    const { $from } = state.selection;
    for (let { depth } = $from; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.type.name === "table") {
        const pos = $from.before(depth);
        view.dispatch(
          state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, bordered: !node.attrs.bordered }),
        );
        editor.value.commands.focus();
        return;
      }
    }
  }

  function addRowBeforeGuarded(): void {
    if (isTableAtMaxRows()) {
      showToast(`Tables are capped at ${MAX_TABLE_ROWS} rows.`, "error");
      return;
    }
    editor.value?.chain().focus().addRowBefore().run();
  }

  function addRowAfterGuarded(): void {
    if (isTableAtMaxRows()) {
      showToast(`Tables are capped at ${MAX_TABLE_ROWS} rows.`, "error");
      return;
    }
    editor.value?.chain().focus().addRowAfter().run();
  }

  function addColumnBeforeGuarded(): void {
    if (isTableAtMaxCols()) {
      showToast(`Tables are capped at ${MAX_TABLE_COLS} columns.`, "error");
      return;
    }
    editor.value?.chain().focus().addColumnBefore().run();
  }

  function addColumnAfterGuarded(): void {
    if (isTableAtMaxCols()) {
      showToast(`Tables are capped at ${MAX_TABLE_COLS} columns.`, "error");
      return;
    }
    editor.value?.chain().focus().addColumnAfter().run();
  }

  function toggleCellBgPicker(): void {
    isCellBgPickerOpen.value = !isCellBgPickerOpen.value;
    if (isCellBgPickerOpen.value) {
      cellBgAnchor.open();
    } else {
      cellBgAnchor.close();
    }
  }

  function applyCellBackground(color: string | null): void {
    if (!editor.value) {
      return;
    }
    const { state, view } = editor.value;
    const { $from } = state.selection;
    for (let { depth } = $from; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
        const pos = $from.before(depth);
        view.dispatch(
          state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, backgroundColor: color }),
        );
        editor.value.commands.focus();
        break;
      }
    }
    isCellBgPickerOpen.value = false;
    cellBgAnchor.close();
  }

  function insertTable(rows: number, cols: number): void {
    editor.value?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
  }

  return {
    isCellBgPickerOpen,
    cellBgRootRef,
    cellBgTriggerRef,
    cellBgPopoverRef,
    cellBgAnchor,
    CELL_BG_COLORS,
    isTableAtMaxRows,
    isTableAtMaxCols,
    isCurrentTableBordered,
    toggleTableBorders,
    addRowBeforeGuarded,
    addRowAfterGuarded,
    addColumnBeforeGuarded,
    addColumnAfterGuarded,
    toggleCellBgPicker,
    applyCellBackground,
    insertTable,
  };
}

// stores/canvasStore.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import type { HandNoteSettings } from "~/types/typesAndInterfaces";

export const useCanvasStore = defineStore("canvas", () => {
  // Canvas settings state
  const penColor = ref("#000000");
  const penWidth = ref(2);
  const bgColor = ref("#ffffff");
  const toolbarPosition = ref("top");
  const isEditable = ref(false);

  // Canvas history for undo/redo
  const history = ref<any[]>([]);
  const historyIndex = ref(-1);

  // Actions
  const setPenColor = (color: string) => {
    penColor.value = color;
  };

  const setPenWidth = (width: number) => {
    penWidth.value = width;
  };

  const setBgColor = (color: string) => {
    bgColor.value = color;
  };

  const setToolbarPosition = (position: string) => {
    toolbarPosition.value = position;
  };

  const setIsEditable = (editable: boolean) => {
    isEditable.value = editable;
  };

  const loadSettings = (settings: HandNoteSettings) => {
    penColor.value = settings.penColor;
    penWidth.value = settings.penWidth;
    bgColor.value = settings.bgColor;
    toolbarPosition.value = settings.toolbarPosition;
  };

  const getCurrentSettings = (): HandNoteSettings => ({
    penColor: penColor.value,
    penWidth: penWidth.value,
    bgColor: bgColor.value,
    toolbarPosition: toolbarPosition.value,
  });

  const resetHistory = () => {
    history.value = [];
    historyIndex.value = -1;
  };

  const addToHistory = (state: any) => {
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1);
    }
    history.value.push(state);
    historyIndex.value = history.value.length - 1;
  };

  return {
    // State
    penColor,
    penWidth,
    bgColor,
    toolbarPosition,
    isEditable,
    history,
    historyIndex,

    // Actions
    setPenColor,
    setPenWidth,
    setBgColor,
    setToolbarPosition,
    setIsEditable,
    loadSettings,
    getCurrentSettings,
    resetHistory,
    addToHistory,
  };
});

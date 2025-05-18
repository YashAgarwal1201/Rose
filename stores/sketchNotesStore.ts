// todo: store for sketch notes
import { defineStore } from "pinia";
import { ref } from "vue";

export const useSkecthNotesStore = defineStore("sketchNotes", () => {
  const penColor = ref<string>("#000000");
  const penWidth = ref<number>(2);
  const bgColor = ref<string>("#0f0f0f");
  const title = ref<string>("");
  const toolbarPosition = ref<string>("top");
  const isEditable = ref(false);

  function toggleEdit() {
    isEditable.value = !isEditable.value;
  }

  function setPenWidth(width: number) {
    penWidth.value = width;
  }

  function setPenColor(color: string) {
    penColor.value = color;
  }

  function setBgColor(color: string) {
    bgColor.value = color;
  }

  function setToolbarPosition(pos: typeof toolbarPosition.value) {
    toolbarPosition.value = pos;
  }

  return {
    penColor,
    penWidth,
    bgColor,
    title,
    toolbarPosition,
    isEditable,
    toggleEdit,
    setPenWidth,
    setPenColor,
    setBgColor,
    setToolbarPosition,
  };
});

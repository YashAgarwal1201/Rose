import { computed, onMounted, onUnmounted, ref } from "vue";

export type ToolbarPosition = "top" | "bottom" | "left" | "right";

const STORAGE_KEY = "doc-toolbar-position";

export function useToolbarPosition() {
  const savedPosition = ref<ToolbarPosition>(
    (localStorage.getItem(STORAGE_KEY) as ToolbarPosition) ?? "top",
  );
  const isMobile = ref(false);

  function checkMobile() {
    isMobile.value = window.innerWidth < 768;
  }

  onMounted(() => {
    checkMobile();
    window.addEventListener("resize", checkMobile);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", checkMobile);
  });

  // On mobile: always bottom. Left/right only on md+.
  const effectivePosition = computed<ToolbarPosition>(() => {
    if (isMobile.value) {
      return "bottom";
    }
    return savedPosition.value;
  });

  const isVertical = computed(
    () => effectivePosition.value === "left" || effectivePosition.value === "right",
  );

  const isHorizontal = computed(
    () => effectivePosition.value === "top" || effectivePosition.value === "bottom",
  );

  function setPosition(pos: ToolbarPosition) {
    savedPosition.value = pos;
    localStorage.setItem(STORAGE_KEY, pos);
  }

  return { effectivePosition, savedPosition, isVertical, isHorizontal, isMobile, setPosition };
}

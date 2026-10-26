import { computed, ref, watch } from "vue";

const STORAGE_PAGE_VIEW = "rose:doc:pageView";
const STORAGE_FULL_WIDTH = "rose:doc:fullWidth";
const STORAGE_ZOOM = "rose:doc:zoom";

export const A4_SHEET_WIDTH_PX = 794;
export const A4_SHEET_HEIGHT_PX = 1122;

export const ZOOM_PRESETS = [0.5, 0.75, 1, 1.25, 1.5] as const;
export type ZoomLevel = (typeof ZOOM_PRESETS)[number] | "fit";

export function usePageView() {
  const getInitialBool = (key: string): boolean => {
    try {
      if (typeof globalThis.localStorage === "undefined") {
        return false;
      }
      return globalThis.localStorage.getItem(key) === "true";
    } catch {
      return false;
    }
  };

  const getInitialZoom = (): ZoomLevel => {
    try {
      if (typeof globalThis.localStorage === "undefined") {
        return 1;
      }
      const val = globalThis.localStorage.getItem(STORAGE_ZOOM);
      if (val === "fit") {
        return "fit";
      }
      if (val) {
        const parsed = Number(val);
        if (Number.isFinite(parsed) && parsed > 0.2 && parsed < 3) {
          return parsed as ZoomLevel;
        }
      }
      return 1;
    } catch {
      return 1;
    }
  };

  const isPageView = ref<boolean>(getInitialBool(STORAGE_PAGE_VIEW));
  const isFullWidth = ref<boolean>(getInitialBool(STORAGE_FULL_WIDTH));
  const zoomLevel = ref<ZoomLevel>(getInitialZoom());
  const containerWidth = ref<number>(0);

  watch(isPageView, (newVal) => {
    try {
      if (typeof globalThis.localStorage !== "undefined") {
        globalThis.localStorage.setItem(STORAGE_PAGE_VIEW, String(newVal));
      }
    } catch {
      // Ignore localStorage errors
    }
  });

  watch(isFullWidth, (newVal) => {
    try {
      if (typeof globalThis.localStorage !== "undefined") {
        globalThis.localStorage.setItem(STORAGE_FULL_WIDTH, String(newVal));
      }
    } catch {
      // Ignore localStorage errors
    }
  });

  watch(zoomLevel, (newVal) => {
    try {
      if (typeof globalThis.localStorage !== "undefined") {
        globalThis.localStorage.setItem(STORAGE_ZOOM, String(newVal));
      }
    } catch {
      // Ignore localStorage errors
    }
  });

  function togglePageView() {
    isPageView.value = !isPageView.value;
  }

  function toggleFullWidth() {
    isFullWidth.value = !isFullWidth.value;
  }

  function setContainerWidth(width: number) {
    if (Number.isFinite(width) && width > 0) {
      containerWidth.value = width;
    }
  }

  const effectiveScale = computed<number>(() => {
    if (zoomLevel.value === "fit") {
      if (containerWidth.value <= 0) {
        return 1;
      }
      // Target 32px horizontal padding around paper sheet
      const rawScale = (containerWidth.value - 32) / A4_SHEET_WIDTH_PX;
      return Math.min(1.25, Math.max(0.35, Math.round(rawScale * 100) / 100));
    }
    return zoomLevel.value;
  });

  function setZoom(level: ZoomLevel) {
    zoomLevel.value = level;
  }

  function zoomIn() {
    const current = effectiveScale.value;
    const nextPreset = ZOOM_PRESETS.find((preset) => preset > current + 0.05);
    if (nextPreset) {
      zoomLevel.value = nextPreset;
    } else {
      zoomLevel.value = ZOOM_PRESETS[ZOOM_PRESETS.length - 1];
    }
  }

  function zoomOut() {
    const current = effectiveScale.value;
    const prevPreset = ZOOM_PRESETS.toReversed().find((preset) => preset < current - 0.05);
    if (prevPreset) {
      zoomLevel.value = prevPreset;
    } else {
      zoomLevel.value = ZOOM_PRESETS[0];
    }
  }

  return {
    isPageView,
    togglePageView,
    isFullWidth,
    toggleFullWidth,
    zoomLevel,
    effectiveScale,
    setContainerWidth,
    setZoom,
    zoomIn,
    zoomOut,
    ZOOM_PRESETS,
  };
}

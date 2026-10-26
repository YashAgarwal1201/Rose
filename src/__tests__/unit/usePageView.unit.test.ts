import { beforeEach, describe, expect, it } from "vitest";
import { usePageView } from "@/composables/docs/usePageView";
import { nextTick } from "vue";

describe("usePageView", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to false when localStorage is empty", () => {
    const { isPageView, isFullWidth, zoomLevel } = usePageView();
    expect(isPageView.value).toBe(false);
    expect(isFullWidth.value).toBe(false);
    expect(zoomLevel.value).toBe(1);
  });

  it("initializes from localStorage correctly", () => {
    localStorage.setItem("rose:doc:pageView", "true");
    localStorage.setItem("rose:doc:fullWidth", "true");
    localStorage.setItem("rose:doc:zoom", "fit");
    const { isPageView, isFullWidth, zoomLevel } = usePageView();
    expect(isPageView.value).toBe(true);
    expect(isFullWidth.value).toBe(true);
    expect(zoomLevel.value).toBe("fit");
  });

  it("toggles pageView value and updates localStorage", async () => {
    const { isPageView, togglePageView } = usePageView();
    expect(isPageView.value).toBe(false);

    togglePageView();
    expect(isPageView.value).toBe(true);
    await nextTick();
    expect(localStorage.getItem("rose:doc:pageView")).toBe("true");

    togglePageView();
    expect(isPageView.value).toBe(false);
    await nextTick();
    expect(localStorage.getItem("rose:doc:pageView")).toBe("false");
  });

  it("toggles fullWidth value and updates localStorage", async () => {
    const { isFullWidth, toggleFullWidth } = usePageView();
    expect(isFullWidth.value).toBe(false);

    toggleFullWidth();
    expect(isFullWidth.value).toBe(true);
    await nextTick();
    expect(localStorage.getItem("rose:doc:fullWidth")).toBe("true");

    toggleFullWidth();
    expect(isFullWidth.value).toBe(false);
    await nextTick();
    expect(localStorage.getItem("rose:doc:fullWidth")).toBe("false");
  });

  it("calculates effectiveScale for fit mode based on container width", () => {
    const { zoomLevel, effectiveScale, setContainerWidth } = usePageView();
    zoomLevel.value = "fit";

    // 400px mobile container: (400 - 32) / 794 ~= 0.46
    setContainerWidth(400);
    expect(effectiveScale.value).toBeCloseTo(0.46, 2);

    // 1200px desktop container: capped at 1.25 max
    setContainerWidth(1200);
    expect(effectiveScale.value).toBe(1.25);
  });

  it("steps zoom in and out through presets", () => {
    const { zoomLevel, setZoom, zoomIn, zoomOut } = usePageView();
    setZoom(1);

    zoomIn();
    expect(zoomLevel.value).toBe(1.25);

    zoomIn();
    expect(zoomLevel.value).toBe(1.5);

    zoomIn();
    expect(zoomLevel.value).toBe(1.5); // at max preset

    zoomOut();
    expect(zoomLevel.value).toBe(1.25);

    zoomOut();
    expect(zoomLevel.value).toBe(1);

    zoomOut();
    expect(zoomLevel.value).toBe(0.75);

    zoomOut();
    expect(zoomLevel.value).toBe(0.5);

    zoomOut();
    expect(zoomLevel.value).toBe(0.5); // at min preset
  });
});

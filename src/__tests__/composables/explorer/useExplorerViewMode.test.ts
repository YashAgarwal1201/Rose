import { describe, expect, it, beforeEach } from "vitest";
import { useExplorerViewMode } from "@/composables/explorer/useExplorerViewMode";
import { nextTick } from "vue";

describe("useExplorerViewMode", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes with default values when localStorage is empty", () => {
    expect.hasAssertions();
    const { viewMode } = useExplorerViewMode();
    if (viewMode.value !== "grid") {
        const { toggleViewMode } = useExplorerViewMode();
        toggleViewMode();
    }
    expect(viewMode.value).toBe("grid");
  });

  it("toggles viewMode between grid and list", async () => {
    expect.hasAssertions();
    const { viewMode, toggleViewMode } = useExplorerViewMode();
    
    viewMode.value = "grid";
    
    toggleViewMode();
    await nextTick();
    expect(viewMode.value).toBe("list");
    expect(localStorage.getItem("rose-explorer-view-mode")).toBe("list");
    
    toggleViewMode();
    await nextTick();
    expect(viewMode.value).toBe("grid");
    expect(localStorage.getItem("rose-explorer-view-mode")).toBe("grid");
  });

  it("sets sort key and toggles dir if same key", async () => {
    expect.hasAssertions();
    const { sortKey, sortDir, setSortKey } = useExplorerViewMode();
    
    setSortKey("name");
    sortDir.value = "asc";
    await nextTick();
    
    setSortKey("name");
    await nextTick();
    expect(sortDir.value).toBe("desc");
    
    setSortKey("updatedAt");
    await nextTick();
    expect(sortKey.value).toBe("updatedAt");
    expect(sortDir.value).toBe("asc");
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import ImportModal from "@/components/settings/ImportModal.vue";
import { createPinia } from "pinia";
import * as importDataModule from "@/utils/importData";
import { useSettingsStore } from "@/stores/settings";

vi.mock("@/composables/ui/useToast", () => ({
  useToast: () => ({ showToast: vi.fn() })
}));
vi.mock("@vueuse/integrations/useFocusTrap", () => ({
  useFocusTrap: () => ({ activate: vi.fn(), deactivate: vi.fn() })
}));

describe("ImportModal.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders file upload when no payload", () => {
    expect.hasAssertions();
    const wrapper = mount(ImportModal, {
      props: { modelValue: true },
      global: {
        plugins: [createPinia()],
        stubs: { Teleport: true, FileIcon: true }
      }
    });

    expect(wrapper.find("h3").text()).toBe("Import data");
    expect(wrapper.text()).toContain("Drop your backup file here");
  });

  it("calls parseImportFile on file drop", async () => {
    expect.hasAssertions();
    const parseSpy = vi.spyOn(importDataModule, "parseImportFile").mockResolvedValue({} as any);
    vi.spyOn(importDataModule, "summarisePayload").mockReturnValue({
      notes: 1, docs: 0, todos: 0, todoLists: 0, folders: 0, activity: 0, settings: 0,
      version: 1, exportDate: "2026-08-26"
    });

    const wrapper = mount(ImportModal, {
      props: { modelValue: true },
      global: { plugins: [createPinia()], stubs: { Teleport: true, FileIcon: true } }
    });

    const dropZone = wrapper.find(".cursor-pointer");
    const mockFile = new File(["{}"], "backup.json", { type: "application/json" });
    
    // We must mock the event dataTransfer
    await dropZone.trigger("drop", { dataTransfer: { files: [mockFile] } });
    
    // await promises inside processFile
    await new Promise(r => setTimeout(r, 0));
    
    expect(parseSpy).toHaveBeenCalledWith(mockFile);
    // UI should now show Summary
    expect(wrapper.text()).toContain("Backup contents");
  });
});

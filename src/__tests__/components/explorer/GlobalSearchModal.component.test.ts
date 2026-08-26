import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import GlobalSearchModal from "@/components/explorer/GlobalSearchModal.vue";
import { createPinia } from "pinia";
import { useUiStore } from "@/stores/ui";
import { useHomeSummary } from "@/composables/home/useHomeSummary";
import { ref } from "vue";
import { createRouter, createWebHistory } from "vue-router";

vi.mock("@/composables/home/useHomeSummary", () => ({
  useHomeSummary: vi.fn()
}));
vi.mock("@vueuse/integrations/useFocusTrap", () => ({
  useFocusTrap: () => ({ activate: vi.fn(), deactivate: vi.fn() })
}));

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: { template: "<div></div>" } },
    { path: "/todos/:pathMatch(.*)*", name: "todos-list", component: { template: "<div></div>" } }
  ]
});

describe("GlobalSearchModal.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when isSearchOpen is true and handles searching", async () => {
    expect.hasAssertions();
    
    const searchMock = vi.fn().mockReturnValue([
      { id: "1", title: "Test Todo", type: "todo", path: "folder/test-todo" }
    ]);
    const refreshMock = vi.fn();
    
    vi.mocked(useHomeSummary).mockReturnValue({
      search: searchMock,
      refresh: refreshMock,
      isLoaded: ref(true),
      folders: ref([]),
      todos: ref([]),
      docs: ref([]),
      notes: ref([])
    } as any);

    const pinia = createPinia();
    const wrapper = mount(GlobalSearchModal, {
      global: {
        plugins: [pinia, router],
        stubs: { Teleport: true, SearchIcon: true, XIcon: true, ListTodoIcon: true, PenLineIcon: true, FileTextIcon: true }
      }
    });

    const uiStore = useUiStore();
    uiStore.openSearch();
    await wrapper.vm.$nextTick();

    const input = wrapper.find("input");
    expect(input.exists()).toBeTruthy();

    await input.setValue("test");
    expect(searchMock).toHaveBeenCalledWith("test");

    // Click on the result
    const resultButtons = wrapper.findAll("button");
    // Find the one corresponding to the search result
    const todoResult = resultButtons.find(b => b.text().includes("Test Todo"));
    expect(todoResult).toBeDefined();
    
    // Simulate navigation
    vi.useFakeTimers();
    const routerPushSpy = vi.spyOn(router, "push");
    await todoResult?.trigger("click");
    
    vi.advanceTimersByTime(200);
    expect(routerPushSpy).toHaveBeenCalledWith({ name: "todos-list", params: { pathMatch: "folder/test-todo" } });
    expect(uiStore.isSearchOpen).toBeFalsy();
    vi.useRealTimers();
  });
});

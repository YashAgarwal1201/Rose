import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import TodoListView from "../../views/TodoListView.vue";
import { createPinia, setActivePinia } from "pinia";
import db from "../../db";
import "fake-indexeddb/auto";
import { ref } from "vue";
import { useTodosStore } from "../../stores/todos";

// Mock router
const pushMock = vi.fn();
const replaceMock = vi.fn();
vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
    currentRoute: ref({
      name: "todos-list",
      params: { pathMatch: ["My List"] },
    }),
  }),
}));

// Mock toast & confirm
const showToastMock = vi.fn();
vi.mock("../../composables/useToast", () => ({
  useToast: () => ({ showToast: showToastMock }),
} as any));

const confirmMock = vi.fn().mockResolvedValue(true);
vi.mock("../../composables/useConfirm", () => ({
  useConfirm: () => ({ confirm: confirmMock }),
} as any));

describe("TodoListView.vue", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await db.docs.clear();
    await db.folders.clear();
    await db.notes.clear();
    await db.todos.clear();
    await db.todoLists.clear();
    vi.clearAllMocks();
  });

  async function mountTodoListView(pathMatch: string[]) {
    const pinia = createPinia();
    setActivePinia(pinia);
    const wrapper = mount(TodoListView, {
      props: { pathMatch },
      global: { 
        plugins: [pinia],
        stubs: { Teleport: true }
      },
    });
    // Wait for onMounted loadList and loadTodos
    await new Promise((resolve) => setTimeout(resolve, 50));
    await flushPromises();
    return wrapper;
  }

  describe("List Loading", () => {
    it("redirects to /todos/folder when path is empty", async () => {
      await mountTodoListView([]);
      expect(showToastMock).toHaveBeenCalledWith("List not found.", "error");
      expect(replaceMock).toHaveBeenCalledWith("/todos/folder");
    });

    it("renders the list title and todos when it resolves", async () => {
      await db.todoLists.add({
        id: "list-1",
        name: "Test List",
        folderId: null,
        lastOpenedAt: null,
        createdAt: 1,
        updatedAt: 1,
      });
      await db.todos.add({
        id: "todo-1",
        listId: "list-1",
        title: "Test Task 1",
        done: false,
        priority: null,
        dueDate: null,
        createdAt: 1,
        updatedAt: 1,
      });
      const wrapper = await mountTodoListView(["Test List"]);
      expect(wrapper.find("h1").text()).toBe("Test List");
      // Find the task label
      const tasks = wrapper.findAll("span").filter(span => span.text().includes("Test Task 1"));
      expect(tasks).toHaveLength(1);
    });
  });

  describe("Renaming List", () => {
    it("renames the list and updates router on enter", async () => {
      await db.todoLists.add({
        id: "list-2",
        name: "Old Title",
        folderId: null,
        lastOpenedAt: null,
        createdAt: 1,
        updatedAt: 1,
      });
      const wrapper = await mountTodoListView(["Old Title"]);
      // Click rename icon
      await wrapper.find("button .lucide-pencil").trigger("click");
      const input = wrapper.find("input[type='text']");
      await input.setValue("New Title");
      await input.trigger("keyup.enter");
      
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(replaceMock).toHaveBeenCalledWith({
        name: "todos-list",
        params: { pathMatch: ["New Title"] },
      });
    });
  });

  describe("Todos Operations", () => {
    it("adds a new todo", async () => {
      await db.todoLists.add({
        id: "list-3",
        name: "My Tasks",
        folderId: null,
        lastOpenedAt: null,
        createdAt: 1,
        updatedAt: 1,
      });
      const wrapper = await mountTodoListView(["My Tasks"]);
      
      const input = wrapper.find("input[placeholder='Add a todo...']");
      await input.setValue("Buy Milk");
      await input.trigger("keyup.enter");
      
      await new Promise((resolve) => setTimeout(resolve, 50));
      const store = useTodosStore();
      expect(store.todos.some(t => t.title === "Buy Milk")).toBe(true);
    });

    it("toggles a todo checkbox", async () => {
      await db.todoLists.add({
        id: "list-4",
        name: "Toggle Tasks",
        folderId: null,
        lastOpenedAt: null,
        createdAt: 1,
        updatedAt: 1,
      });
      await db.todos.add({
        id: "todo-2",
        listId: "list-4",
        title: "Incomplete Task",
        done: false,
        priority: null,
        dueDate: null,
        createdAt: 1,
        updatedAt: 1,
      });
      const wrapper = await mountTodoListView(["Toggle Tasks"]);
      
      const toggleBtn = wrapper.find("button[aria-label='Mark as completed']");
      await toggleBtn.trigger("click");
      
      await new Promise((resolve) => setTimeout(resolve, 50));
      const updatedTodo = await db.todos.get("todo-2");
      expect(updatedTodo?.done).toBe(true);
    });

    it("deletes a todo", async () => {
      await db.todoLists.add({
        id: "list-5",
        name: "Delete Tasks",
        folderId: null,
        lastOpenedAt: null,
        createdAt: 1,
        updatedAt: 1,
      });
      await db.todos.add({
        id: "todo-3",
        listId: "list-5",
        title: "Task to delete",
        done: false,
        priority: null,
        dueDate: null,
        createdAt: 1,
        updatedAt: 1,
      });
      const wrapper = await mountTodoListView(["Delete Tasks"]);
      
      // The options menu logic isn't easily testable without triggering the popover,
      // but we can trigger it directly from the store for the delete part.
      // Wait, let's open the menu first!
      const menuBtn = wrapper.find("button[aria-label='Todo options']");
      await menuBtn.trigger("click");
      await new Promise((resolve) => setTimeout(resolve, 50));
      const buttons = wrapper.findAll("button.text-red-400");
      const deleteBtn = buttons.find((b) => b.text().includes("Delete"));
      await deleteBtn!.trigger("click");
      
      await flushPromises();
      const updatedTodo = await db.todos.get("todo-3");
      expect(updatedTodo).toBeUndefined();
    });
  });
});

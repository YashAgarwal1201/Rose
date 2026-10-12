import { beforeEach, describe, expect, it, vi } from "vitest";
import { useHomeSummary } from "@/composables/home/useHomeSummary";
import db from "@/db";

describe("useHomeSummary", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes and correctly aggregates empty states", async () => {
    expect.hasAssertions();
    vi.spyOn(db.folders, "toArray").mockResolvedValue([]);
    vi.spyOn(db.todoLists, "toArray").mockResolvedValue([]);
    vi.spyOn(db.todos, "toArray").mockResolvedValue([]);
    vi.spyOn(db.docs, "toArray").mockResolvedValue([]);
    vi.spyOn(db.notes, "toArray").mockResolvedValue([]);

    const summary = useHomeSummary();
    expect(summary.isLoaded.value).toBe(false);

    await summary.refresh();

    expect(summary.isLoaded.value).toBe(true);
    expect(summary.isEmpty.value).toBe(true);
    expect(summary.docCount.value).toBe(0);
    expect(summary.recentItems.value).toHaveLength(0);
    expect(summary.topFolders.value).toHaveLength(0);
  });

  it("aggregates recent items and top folders", async () => {
    expect.hasAssertions();
    vi.spyOn(db.folders, "toArray").mockResolvedValue([
      { id: "f1", name: "Folder 1", type: "mixed", parentId: null, createdAt: 1, updatedAt: 100 },
      { id: "f2", name: "Folder 2", type: "doc", parentId: null, createdAt: 1, updatedAt: 50 },
    ]);
    vi.spyOn(db.todoLists, "toArray").mockResolvedValue([
      { id: "tl1", name: "List 1", folderId: "f1", createdAt: 1, updatedAt: 200, lastOpenedAt: 1000 },
    ]);
    vi.spyOn(db.todos, "toArray").mockResolvedValue([
      { id: "t1", text: "t1", listId: "tl1", done: false, createdAt: 1 },
      { id: "t2", text: "t2", listId: "tl1", done: true, createdAt: 1 },
    ]);
    vi.spyOn(db.docs, "toArray").mockResolvedValue([
      { id: "d1", title: "Doc 1", folderId: "f2", createdAt: 1, updatedAt: 300, lastOpenedAt: 2000, content: "" },
    ]);
    vi.spyOn(db.notes, "toArray").mockResolvedValue([]);

    const summary = useHomeSummary();
    await summary.refresh();

    expect(summary.isEmpty.value).toBe(false);
    expect(summary.openTodoCount.value).toBe(1); // One false
    
    // Top folders sorted by updatedAt desc: f1(100), f2(50)
    expect(summary.topFolders.value).toHaveLength(2);
    expect(summary.topFolders.value[0]!.name).toBe("Folder 1");
    expect(summary.topFolders.value[0]!.itemCount).toBe(1); // List 1
    
    // Recent items sorted by lastOpenedAt desc: d1(2000), tl1(1000)
    expect(summary.recentItems.value).toHaveLength(2);
    expect(summary.recentItems.value[0]!.title).toBe("Doc 1");
    expect(summary.recentItems.value[1]!.title).toBe("List 1");
    
    // Search
    const searchRes = summary.search("doc");
    expect(searchRes).toHaveLength(1);
    expect(searchRes[0]!.title).toBe("Doc 1");
  });

  it("aggregates, filters, and sorts dueSoonTodos", async () => {
    expect.hasAssertions();
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    vi.spyOn(db.folders, "toArray").mockResolvedValue([
      { id: "f1", name: "Work", type: "todo", parentId: null, createdAt: 1, updatedAt: 100 },
    ]);
    vi.spyOn(db.todoLists, "toArray").mockResolvedValue([
      { id: "tl1", name: "Tasks", folderId: "f1", createdAt: 1, updatedAt: 200, lastOpenedAt: 1000, isVaulted: false },
      { id: "tl-vault", name: "Secret Tasks", folderId: null, createdAt: 1, updatedAt: 200, lastOpenedAt: 1000, isVaulted: true },
    ]);
    vi.spyOn(db.todos, "toArray").mockResolvedValue([
      // Overdue (yesterday) -> should be first
      { id: "t-overdue", title: "Overdue Task", listId: "tl1", done: false, priority: "high", dueDate: now - oneDay, isVaulted: false, createdAt: 1 },
      // Today -> should be second
      { id: "t-today", title: "Today Task", listId: "tl1", done: false, priority: "medium", dueDate: now, isVaulted: false, createdAt: 1 },
      // Tomorrow -> should be third
      { id: "t-tomorrow", title: "Tomorrow Task", listId: "tl1", done: false, priority: "low", dueDate: now + oneDay, isVaulted: false, createdAt: 1 },
      // In 2 days -> should be fourth
      { id: "t-day2", title: "Day 2 Task", listId: "tl1", done: false, priority: null, dueDate: now + 2 * oneDay, isVaulted: false, createdAt: 1 },
      // Completed -> excluded
      { id: "t-done", title: "Done Task", listId: "tl1", done: true, priority: "high", dueDate: now, isVaulted: false, createdAt: 1 },
      // No due date -> excluded
      { id: "t-nodate", title: "No Date Task", listId: "tl1", done: false, priority: "high", dueDate: null, isVaulted: false, createdAt: 1 },
      // Far future (in 10 days) -> excluded
      { id: "t-future", title: "Future Task", listId: "tl1", done: false, priority: null, dueDate: now + 10 * oneDay, isVaulted: false, createdAt: 1 },
      // Vaulted todo -> excluded
      { id: "t-vaulted", title: "Vaulted Task", listId: "tl1", done: false, priority: "high", dueDate: now, isVaulted: true, createdAt: 1 },
      // Todo in vaulted list -> excluded
      { id: "t-in-vault-list", title: "Secret List Task", listId: "tl-vault", done: false, priority: "high", dueDate: now, isVaulted: false, createdAt: 1 },
    ]);
    vi.spyOn(db.docs, "toArray").mockResolvedValue([]);
    vi.spyOn(db.notes, "toArray").mockResolvedValue([]);

    const summary = useHomeSummary();
    await summary.refresh();

    expect(summary.dueSoonTodos.value).toHaveLength(4);
    expect(summary.totalDueSoonCount.value).toBe(4);

    // Sorted by ascending dueDate (overdue first, then today, tomorrow, etc.)
    expect(summary.dueSoonTodos.value[0]!.title).toBe("Overdue Task");
    expect(summary.dueSoonTodos.value[0]!.priority).toBe("high");
    expect(summary.dueSoonTodos.value[0]!.listName).toBe("Tasks");
    expect(summary.dueSoonTodos.value[0]!.listPath).toEqual(["Work", "Tasks"]);

    expect(summary.dueSoonTodos.value[1]!.title).toBe("Today Task");
    expect(summary.dueSoonTodos.value[2]!.title).toBe("Tomorrow Task");
    expect(summary.dueSoonTodos.value[3]!.title).toBe("Day 2 Task");
  });
});

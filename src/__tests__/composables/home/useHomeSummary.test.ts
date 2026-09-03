import { describe, expect, it, vi, beforeEach } from "vitest";
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
    expect(summary.isLoaded.value).toBeFalsy();

    await summary.refresh();

    expect(summary.isLoaded.value).toBeTruthy();
    expect(summary.isEmpty.value).toBeTruthy();
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

    expect(summary.isEmpty.value).toBeFalsy();
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
});

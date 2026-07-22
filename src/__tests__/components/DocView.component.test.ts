// src/__tests__/components/DocView.component.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { createPinia, setActivePinia } from "pinia";
import { IDBFactory } from "fake-indexeddb";
import { ref } from "vue";
import db from "../../db";
import { useDocsStore } from "../../stores/docs";
import { useFoldersStore } from "../../stores/folders";
import DocView from "../../views/DocView.vue";

// \u2500\u2500\u2500 Fake TipTap editor \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const chainMethods = [
  "focus",
  "setImage",
  "insertTable",
  "setLink",
  "unsetLink",
  "addRowBefore",
  "addRowAfter",
  "deleteRow",
  "addColumnBefore",
  "addColumnAfter",
  "deleteColumn",
  "deleteTable",
  "insertContent",
];
function makeChain() {
  const chain: Record<string, unknown> = {};
  chainMethods.forEach((m) => {
    chain[m] = vi.fn(() => chain);
  });
  chain.run = vi.fn(() => true);
  return chain;
}

function makeFakeEditor() {
  return {
    commands: { setContent: vi.fn(), focus: vi.fn() },
    chain: vi.fn(() => makeChain()),
    isActive: vi.fn(() => false),
    getAttributes: vi.fn(() => ({})),
    getJSON: vi.fn(() => ({ type: "doc", content: [] })),
    state: {
      selection: {
        $from: { depth: 0, node: () => ({ type: { name: "" }, attrs: {} }), before: () => 0 },
      },
    },
    view: { dispatch: vi.fn() },
    destroy: vi.fn(),
  };
}

let fakeEditor: ReturnType<typeof makeFakeEditor>;

vi.mock(import("@tiptap/vue-3"), () => ({
  useEditor: () => ref(fakeEditor),
  EditorContent: { template: "<div data-testid='editor-content' />" },
}));

// \u2500\u2500\u2500 Extension stubs \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function extensionStub(name: string): Record<string, unknown> {
  const ext: Record<string, unknown> = { name };
  ext.configure = vi.fn(() => ext);
  ext.extend = vi.fn(() => extensionStub(name));
  return ext;
}
vi.mock(import("@tiptap/starter-kit"), () => ({ default: extensionStub("starterKit") }));
vi.mock(import("@tiptap/extension-task-list"), () => ({ default: extensionStub("taskList") }));
vi.mock(import("@tiptap/extension-task-item"), () => ({ default: extensionStub("taskItem") }));
vi.mock(import("@tiptap/extension-link"), () => ({ default: extensionStub("link") }));
vi.mock(import("@tiptap/extension-image"), () => ({ default: extensionStub("image") }));
vi.mock(import("@tiptap/extension-placeholder"), () => ({ default: extensionStub("placeholder") }));
vi.mock(import("@tiptap/extension-text-align"), () => ({ default: extensionStub("textAlign") }));
vi.mock(import("@tiptap/extension-text-style"), () => ({
  TextStyle: extensionStub("textStyle"),
  Color: extensionStub("color"),
}));
vi.mock(import("@tiptap/extension-highlight"), () => ({ Highlight: extensionStub("highlight") }));
vi.mock(import("@tiptap/extension-underline"), () => ({ default: extensionStub("underline") }));
vi.mock(import("@tiptap/extension-subscript"), () => ({ default: extensionStub("subscript") }));
vi.mock(import("@tiptap/extension-superscript"), () => ({ default: extensionStub("superscript") }));
vi.mock(import("@tiptap/extension-table"), () => ({
  Table: extensionStub("table"),
  TableCell: extensionStub("tableCell"),
  TableHeader: extensionStub("tableHeader"),
  TableRow: extensionStub("tableRow"),
}));
vi.mock(import("@tiptap/pm/tables"), () => ({
  TableMap: { get: vi.fn(() => ({ height: 0, width: 0 })) },
}));
vi.mock(import("@tiptap/markdown"), () => ({ Markdown: extensionStub("markdown") }));

// \u2500\u2500\u2500 Composable mocks \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
vi.mock(import("../../composables/useToast"), () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock(import("../../composables/useDocExport"), () => ({
  useDocExport: () => ({
    exportAsHtml: vi.fn(),
    exportAsMarkdown: vi.fn(),
    exportAsText: vi.fn(),
    exportAsPdf: vi.fn(),
  }),
}));
vi.mock(import("../../composables/useToolbarPosition"), () => ({
  useToolbarPosition: () => ({
    effectivePosition: ref("top"),
    savedPosition: ref("top"),
    isVertical: ref(false),
    isMobile: ref(false),
    setPosition: vi.fn(),
  }),
}));
vi.mock(import("../../composables/usePopoverPosition"), () => ({
  usePopoverPosition: () => ({
    style: ref({}),
    open: vi.fn(),
    close: vi.fn(),
  }),
}));
// debounce runs immediately in tests instead of waiting AUTOSAVE_DELAY_MS
vi.mock(import("../../utils/debounce"), () => ({
  debounce:
    (fn: (...args: unknown[]) => unknown) =>
    (...args: unknown[]) =>
      fn(...args),
}));
vi.mock(import("../../components/DocToolbar.vue"), () => ({
  default: { template: "<div data-testid='doc-toolbar' />" },
}));

// \u2500\u2500\u2500 Router factory \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const routerStub = { template: "<div />" };
function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", redirect: "/docs/folder" },
      {
        path: "/docs/folder/:pathMatch(.*)*",
        component: routerStub,
        name: "docs-folder",
        props: true,
      },
      { path: "/docs/doc/:pathMatch(.*)*", component: routerStub, name: "docs-doc", props: true },
    ],
  });
}

// \u2500\u2500\u2500 DB reset \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
async function freshDb() {
  db.close();
  globalThis.indexedDB = new IDBFactory();
  await db.open();
}

// \u2500\u2500\u2500 Mount helper \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
async function mountDocView(pathMatch: string[] = []) {
  const router = makeRouter();
  await router.push("/docs/folder");
  await router.isReady();
  const pinia = createPinia();
  setActivePinia(pinia);
  const wrapper = mount(DocView, {
    props: { pathMatch },
    global: { plugins: [router, pinia] },
  });
  await flushPromises();
  return { wrapper, router };
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
describe("DocView", () => {
  beforeEach(async () => {
    fakeEditor = makeFakeEditor();
    await freshDb();
  });

  // \u2500\u2500 loadDoc: redirects \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  describe("loadDoc redirects", () => {
    it("redirects to /docs/folder when pathMatch is empty", async () => {
      expect.hasAssertions();
      const { router } = await mountDocView([]);
      expect(router.currentRoute.value.path).toBe("/docs/folder");
    });

    it("redirects to /docs/folder when the folder segment doesn't resolve", async () => {
      expect.hasAssertions();
      const { router } = await mountDocView(["missing-folder", "SomeDoc"]);
      expect(router.currentRoute.value.path).toBe("/docs/folder");
    });

    it("redirects to the resolved folder when the doc name doesn't match any doc", async () => {
      expect.hasAssertions();
      await db.folders.add({
        id: "folder-redirect-1",
        name: "Notes",
        parentId: null,
        type: "doc",
        createdAt: 1,
        updatedAt: 1,
      });
      const { router } = await mountDocView(["Notes", "MissingDoc"]);
      expect(router.currentRoute.value.name).toBe("docs-folder");
      expect(router.currentRoute.value.params.pathMatch).toContain("Notes");
    });
  });

  // \u2500\u2500 loadDoc: success \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  describe("loadDoc success", () => {
    it("renders the doc title when the doc resolves at the root level", async () => {
      expect.hasAssertions();
      await db.docs.add({
        id: "doc-1",
        title: "My Doc",
        folderId: null,
        contentJSON: null,
        createdAt: 1,
        updatedAt: 1,
      });
      const { wrapper } = await mountDocView(["My Doc"]);
      expect(wrapper.find("h1").text()).toBe("My Doc");
    });

    it("resolves a doc nested inside a folder path", async () => {
      expect.hasAssertions();
      await db.folders.add({
        id: "folder-nested-1",
        name: "Work",
        parentId: null,
        type: "doc",
        createdAt: 1,
        updatedAt: 1,
      });
      await db.docs.add({
        id: "doc-nested-2",
        title: "Nested Doc",
        folderId: "folder-nested-1",
        contentJSON: null,
        createdAt: 1,
        updatedAt: 1,
      });
      const { wrapper } = await mountDocView(["Work", "Nested Doc"]);
      expect(wrapper.find("h1").text()).toBe("Nested Doc");
    });

    it("calls editor.commands.setContent with the doc's stored content", async () => {
      expect.hasAssertions();
      const content = { type: "doc", content: [{ type: "paragraph" }] };
      await db.docs.add({
        id: "doc-3",
        title: "Content Doc",
        folderId: null,
        contentJSON: content,
        createdAt: 1,
        updatedAt: 1,
      });
      await mountDocView(["Content Doc"]);
      expect(fakeEditor.commands.setContent).toHaveBeenCalledWith(content, { emitUpdate: false });
    });

    it("renders the EditorContent stub once a doc is loaded", async () => {
      expect.hasAssertions();
      await db.docs.add({
        id: "doc-4",
        title: "Editor Doc",
        folderId: null,
        contentJSON: null,
        createdAt: 1,
        updatedAt: 1,
      });
      const { wrapper } = await mountDocView(["Editor Doc"]);
      expect(wrapper.find("[data-testid='editor-content']").exists()).toBe(true);
    });
  });

  // \u2500\u2500 goBack \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  describe("goBack", () => {
    it("navigates to the doc's containing folder when a doc is loaded", async () => {
      expect.hasAssertions();
      await db.folders.add({
        id: "folder-2",
        name: "Personal",
        parentId: null,
        type: "doc",
        createdAt: 1,
        updatedAt: 1,
      });
      await db.docs.add({
        id: "doc-5",
        title: "Back Doc",
        folderId: "folder-2",
        contentJSON: null,
        createdAt: 1,
        updatedAt: 1,
      });
      const { wrapper, router } = await mountDocView(["Personal", "Back Doc"]);
      await wrapper.find("button").trigger("click");
      await flushPromises();
      expect(router.currentRoute.value.name).toBe("docs-folder");
      expect(router.currentRoute.value.params.pathMatch).toContain("Personal");
    });
  });

  // \u2500\u2500 rename title \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  describe("rename title", () => {
    it("enters rename mode and shows an input pre-filled with the current title", async () => {
      expect.hasAssertions();
      await db.docs.add({
        id: "doc-6",
        title: "Rename Me",
        folderId: null,
        contentJSON: null,
        createdAt: 1,
        updatedAt: 1,
      });
      const { wrapper } = await mountDocView(["Rename Me"]);
      const pencilBtn = wrapper.findAll("button")[1];
      await pencilBtn!.trigger("click");
      const input = wrapper.find("input[type='text']");
      expect(input.exists()).toBe(true);
      expect((input.element as HTMLInputElement).value).toBe("Rename Me");
    });

    it("commits the new title to the DB and exits rename mode on enter", async () => {
      expect.hasAssertions();
      await db.docs.add({
        id: "doc-7",
        title: "Old Title",
        folderId: null,
        contentJSON: null,
        createdAt: 1,
        updatedAt: 1,
      });
      const { wrapper } = await mountDocView(["Old Title"]);
      const pencilBtn = wrapper.findAll("button")[1];
      await pencilBtn!.trigger("click");
      const input = wrapper.find("input[type='text']");
      await input.setValue("New Title");
      await input.trigger("keyup.enter");
      await vi.waitFor(() => {
        expect(wrapper.find("input[type='text']").exists()).toBeFalsy();
      });
      expect((await db.docs.get("doc-7"))?.title).toBe("New Title");
    });

    it("cancels rename mode on escape without changing the title", async () => {
      expect.hasAssertions();
      await db.docs.add({
        id: "doc-8",
        title: "Untouched Title",
        folderId: null,
        contentJSON: null,
        createdAt: 1,
        updatedAt: 1,
      });
      const { wrapper } = await mountDocView(["Untouched Title"]);
      const pencilBtn = wrapper.findAll("button")[1];
      await pencilBtn!.trigger("click");
      const input = wrapper.find("input[type='text']");
      await input.setValue("Should Not Save");
      await input.trigger("keyup.escape");
      await flushPromises();
      expect((await db.docs.get("doc-8"))?.title).toBe("Untouched Title");
      expect(wrapper.find("input[type='text']").exists()).toBe(false);
    });
  });

  // \u2500\u2500 rendering \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  describe("rendering", () => {
    it("shows the saved-at timestamp label once a doc is loaded", async () => {
      expect.hasAssertions();
      await db.docs.add({
        id: "doc-9",
        title: "Timestamp Doc",
        folderId: null,
        contentJSON: null,
        createdAt: 1,
        updatedAt: Date.now(),
      });
      const { wrapper } = await mountDocView(["Timestamp Doc"]);
      expect(wrapper.text()).toContain("Saved");
    });

    it("renders the DocToolbar stub for the top toolbar position", async () => {
      expect.hasAssertions();
      await db.docs.add({
        id: "doc-10",
        title: "Toolbar Doc",
        folderId: null,
        contentJSON: null,
        createdAt: 1,
        updatedAt: 1,
      });
      const { wrapper } = await mountDocView(["Toolbar Doc"]);
      expect(wrapper.find("[data-testid='doc-toolbar']").exists()).toBe(true);
    });
  });

  // \u2500\u2500 unmount \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  describe("onBeforeUnmount", () => {
    it("destroys the editor instance when the component unmounts", async () => {
      expect.hasAssertions();
      await db.docs.add({
        id: "doc-11",
        title: "Unmount Doc",
        folderId: null,
        contentJSON: null,
        createdAt: 1,
        updatedAt: 1,
      });
      const { wrapper } = await mountDocView(["Unmount Doc"]);
      wrapper.unmount();
      expect(fakeEditor.destroy).toHaveBeenCalledWith();
    });
  });
});

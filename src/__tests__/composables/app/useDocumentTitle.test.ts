import { describe, expect, it, afterEach } from "vitest";
import { useDocumentTitle } from "@/composables/app/useDocumentTitle";
import { ref } from "vue";

describe("useDocumentTitle", () => {
  const defaultTitle = "Rose";

  afterEach(() => {
    document.title = "";
  });

  it("sets the document title to APP_NAME when source is null", () => {
    expect.hasAssertions();
    const source = ref<string | null>(null);
    useDocumentTitle(source);
    
    expect(document.title).toBe(defaultTitle);
  });

  it("sets the document title to APP_NAME when source is undefined", () => {
    expect.hasAssertions();
    const source = ref<string | undefined>(undefined);
    useDocumentTitle(source);
    
    expect(document.title).toBe(defaultTitle);
  });

  it("sets the document title with the prefix when source has a value immediately", () => {
    expect.hasAssertions();
    const source = ref<string>("My Folder");
    useDocumentTitle(source);
    
    expect(document.title).toBe(`My Folder · ${defaultTitle}`);
  });

  it("updates the document title reactively when source changes", async () => {
    expect.hasAssertions();
    const source = ref<string | null>(null);
    useDocumentTitle(source);
    
    expect(document.title).toBe(defaultTitle);
    
    source.value = "New Document";
    // watch is sync/pre by default depending on flush, but we can await nextTick if needed.
    // In Vue 3, if flush is not specified, it's 'pre'. But changes to refs are sometimes batched.
    // However, the test environment usually applies synchronously or we can await Promise.resolve()
    await Promise.resolve();
    
    expect(document.title).toBe(`New Document · ${defaultTitle}`);
    
    source.value = null;
    await Promise.resolve();
    
    expect(document.title).toBe(defaultTitle);
  });
});

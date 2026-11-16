// src/composables/docs/useDocPersistence.ts
import { ref, toRaw, nextTick, type ShallowRef } from "vue";
import type { Router } from "vue-router";
import type { Editor } from "@tiptap/core";
import { useDocsStore } from "@/stores/docs";
import { useFoldersStore } from "@/stores/folders";
import { useToast } from "@/composables/ui/useToast";
import { debounce } from "@/utils/debounce";
import type { Doc } from "@/db/types";

const AUTOSAVE_DELAY_MS = 500;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function useDocPersistence(params: {
  editor: ShallowRef<Editor | undefined>;
  router: Router;
  isPageView: ShallowRef<boolean> | { value: boolean };
  isReadMode: ShallowRef<boolean> | { value: boolean };
  isMobile: ShallowRef<boolean> | { value: boolean };
  segments: { value: string[] };
}) {
  const { editor, router, isPageView, isReadMode, isMobile, segments } = params;
  const docsStore = useDocsStore();
  const foldersStore = useFoldersStore();
  const { showToast } = useToast();

  const currentDoc = ref<Doc | undefined>(undefined);
  const isVaultLocked = ref(false);
  const isRenaming = ref(false);
  const renameValue = ref("");
  let activeLoadToken = 0;

  const saveContent = debounce(async (id: string, contentJSON: Record<string, unknown>) => {
    await docsStore.updateDoc(id, { contentJSON });
  }, AUTOSAVE_DELAY_MS);

  function resolveFolderId(segs: string[]): string | null | undefined {
    let cursor: string | null = null;
    for (const segment of segs) {
      const match = foldersStore.folders.find(
        (folder) =>
          folder.parentId === cursor &&
          (folder.type === "doc" || folder.type === "mixed") &&
          folder.name.toLowerCase() === segment.toLowerCase(),
      );
      if (!match) {
        return undefined;
      }
      cursor = match.id;
    }
    return cursor;
  }

  function buildFolderPath(folderId: string | null): string[] {
    const path: string[] = [];
    let cursor = folderId;
    while (cursor !== null) {
      const folder = foldersStore.folders.find((candidate) => candidate.id === cursor);
      if (!folder) {
        break;
      }
      path.unshift(folder.name);
      cursor = folder.parentId;
    }
    return path;
  }

  async function loadDoc(segs?: string[]): Promise<void> {
    const token = ++activeLoadToken;
    try {
      await foldersStore.loadFolders("doc");
    } catch (error: unknown) {
      console.error("Error:", error);
      if (token === activeLoadToken) {
        showToast(getErrorMessage(error), "error");
      }
      return;
    }

    const activeSegs = segs ?? segments.value;
    if (activeSegs.length === 0) {
      showToast("Doc not found.", "error");
      router.replace("/docs");
      return;
    }

    const folderSegments = activeSegs.slice(0, -1);
    const docName = activeSegs[activeSegs.length - 1];
    const folderId = resolveFolderId(folderSegments);

    if (folderId === undefined) {
      showToast("That doc no longer exists.", "error");
      router.replace("/docs");
      return;
    }

    try {
      await docsStore.loadDocs();
    } catch (error: unknown) {
      console.error("Error:", error);
      if (token === activeLoadToken) {
        showToast(getErrorMessage(error), "error");
      }
      return;
    }

    if (token !== activeLoadToken) {
      return;
    }

    const match = docsStore.docs.find(
      (doc) => doc.folderId === folderId && doc.title.toLowerCase() === docName?.toLowerCase(),
    );

    if (!match) {
      console.log("No match found for folderId", folderId, "and docName", docName);
      showToast("That doc no longer exists.", "error");
      router.replace({ name: "files-folder", params: { pathMatch: buildFolderPath(folderId) } });
      return;
    }

    isVaultLocked.value = false;
    try {
      const fullDoc = await docsStore.getDoc(match.id);
      if (!fullDoc) {
        throw new Error("Doc not found in db.");
      }
      currentDoc.value = fullDoc;
      console.log("currentDoc set to:", currentDoc.value.title);
      docsStore.touchDoc(fullDoc.id);
      const rawContent = fullDoc.contentJSON ? structuredClone(toRaw(fullDoc).contentJSON) : "";
      editor.value?.commands.setContent(rawContent, { emitUpdate: false });
      if (isPageView.value) {
        editor.value?.commands?.enablePagination?.();
      }
      if (!isReadMode.value && !isMobile.value) {
        nextTick().then(() => {
          editor.value?.commands.focus("end");
        });
      }
    } catch (error: unknown) {
      console.error("loadDoc Error:", error);
      if (getErrorMessage(error) === "Vault is locked") {
        isVaultLocked.value = true;
        return;
      }
      if (token === activeLoadToken) {
        showToast(getErrorMessage(error), "error");
      }
    }
  }

  function goBack(): void {
    if (globalThis.history.state && globalThis.history.state.back) {
      router.back();
      return;
    }
    if (!currentDoc.value) {
      router.push("/files/folder");
      return;
    }
    router.push({
      name: "files-folder",
      params: { pathMatch: buildFolderPath(currentDoc.value.folderId) },
    });
  }

  function startRenameTitle(): void {
    isRenaming.value = true;
    renameValue.value = currentDoc.value?.title ?? "";
  }

  async function confirmRenameTitle(): Promise<void> {
    const title = renameValue.value.trim();
    if (title && currentDoc.value?.id) {
      try {
        await docsStore.updateDoc(currentDoc.value.id, { title });
        const updated = await docsStore.getDoc(currentDoc.value.id);
        currentDoc.value = updated;
        if (updated) {
          router.replace({
            name: "docs-doc",
            params: { pathMatch: [...buildFolderPath(updated.folderId), updated.title] },
          });
        }
      } catch (error: unknown) {
        console.error("Error:", error);
        showToast(getErrorMessage(error), "error");
      }
    }
    isRenaming.value = false;
  }

  function cancelRenameTitle(): void {
    isRenaming.value = false;
  }

  function flushPendingSave(): void {
    if (currentDoc.value && editor.value) {
      saveContent(currentDoc.value.id, editor.value.getJSON());
    }
    saveContent.flush();
  }

  return {
    currentDoc,
    isVaultLocked,
    isRenaming,
    renameValue,
    saveContent,
    flushPendingSave,
    buildFolderPath,
    loadDoc,
    goBack,
    startRenameTitle,
    confirmRenameTitle,
    cancelRenameTitle,
  };
}

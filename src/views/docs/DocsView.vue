<!-- src/views/docs/DocsView.vue -->
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { FileTextIcon } from "@lucide/vue";
import ExplorerGrid from "@/components/explorer/ExplorerGrid.vue";
import ExplorerActions from "@/components/explorer/ExplorerActions.vue";
import { useDocsStore } from "@/stores/docs";
import { useToast } from "@/composables/ui/useToast.ts";
import { useKeyboardShortcuts } from "@/composables/app/useKeyboardShortcuts.ts";

const router = useRouter();
const docsStore = useDocsStore();
const { showToast } = useToast();

const explorerGridRef = ref<InstanceType<typeof ExplorerGrid> | null>(null);

async function loadDocs() {
  try {
    await docsStore.loadDocs();
  } catch (error) {
    showToast((error as Error).message, "error");
  }
}

function openDoc(id: string) {
  const doc = docsStore.docs.find((candidate) => candidate.id === id);
  if (!doc) return;
  router.push({
    name: "files-doc",
    params: { pathMatch: [doc.title] },
  });
}

async function handleCreateFile(name: string) {
  try {
    const newId = await docsStore.createDoc(name, null);
    openDoc(newId);
  } catch (error) {
    showToast((error as Error).message, "error");
  }
}

async function handleRenameFile(id: string, name: string) {
  try {
    await docsStore.updateDoc(id, { title: name.trim() || "Untitled" });
    await docsStore.loadDocs();
  } catch (error) {
    showToast((error as Error).message, "error");
  }
}

async function handleDeleteFile(id: string) {
  try {
    await docsStore.deleteDoc(id);
  } catch (error) {
    showToast((error as Error).message, "error");
  }
}

onMounted(() => {
  loadDocs();
});

useKeyboardShortcuts([
  {
    key: "e",
    ctrl: true,
    shift: true,
    handler: () => {
      explorerGridRef.value?.startCreate("file");
    },
  },
]);
</script>

<template>
  <div class="flex h-full">
    <main class="flex-1 p-4 md:p-6 overflow-y-auto min-w-0 max-w-5xl mx-auto">
      <div class="flex items-center justify-between gap-2 mb-8">
        <h1 class="text-2xl font-bold text-rose-text">Docs</h1>
        <ExplorerActions
          file-label="doc"
          :hide-folders="true"
          @create-file="explorerGridRef?.startCreate('file')"
        />
      </div>

      <ExplorerGrid
        ref="explorerGridRef"
        :folders="[]"
        :files="
          docsStore.docs.map((d) => ({
            id: d.id,
            name: d.title,
            updatedAt: d.updatedAt,
            createdAt: d.createdAt,
          }))
        "
        :file-icon="FileTextIcon"
        file-label="doc"
        @open-file="openDoc"
        @create-file="handleCreateFile"
        @rename-file="handleRenameFile"
        @delete-file="handleDeleteFile"
      />
    </main>
  </div>
</template>

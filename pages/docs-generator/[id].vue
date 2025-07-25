<template>
  <div class="w-full h-full flex justify-center items-center py-2">
    <div class="w-full h-full flex flex-row">
      <div class="w-[350px] h-full hidden lg:block flex-shrink-0">
        <LisOfDocuments />
      </div>
      <div class="w-fit h-full mx-auto flex flex-grow-1">
        <div class="flex w-full lg:max-w-4xl h-full rounded-lg">
          <DocumentContainer :current-list="currentList" />
        </div>

        <div
          class="h-full hidden sm:flex flex-col justify-end items-center gap-2 px-2"
        >
          <Button
            class="text-white w-10 h-10 shadow-none !rounded-2xl flex-shrink-0 !block lg:!hidden"
            title="List of todo lists"
            @click="toast.add({ detail: FEATURE_COMING_SOON, life: 1500 })"
            ><List :size="16" />
          </Button>
          <Button
            class="text-white w-10 h-10 shadow-none !rounded-2xl flex-shrink-0"
            title="To do list info"
            @click="toast.add({ detail: FEATURE_COMING_SOON, life: 1500 })"
            ><Info :size="16" />
          </Button>
          <Button
            class="text-white w-10 h-10 shadow-none !rounded-2xl"
            title="Mark all items as done"
            @click="toast.add({ detail: FEATURE_COMING_SOON, life: 1500 })"
            ><CheckCircle :size="16" />
          </Button>
          <Button
            class="text-white w-10 h-10 shadow-none !rounded-2xl"
            title="Delete to do list"
            @click="toast.add({ detail: FEATURE_COMING_SOON, life: 1500 })"
            ><Trash :size="16" />
          </Button>
          <!-- <Button
            class="text-white w-10 h-10 shadow-none !rounded-2xl"
            title="Download to do list"
            @click="(event) => downloadPanel?.toggle(event)"
            ><Download :size="16" />
          </Button> -->
          <Button
            class="text-white w-10 h-10 shadow-none !rounded-2xl"
            title="Download to do list"
            @click="toast.add({ detail: FEATURE_COMING_SOON, life: 1500 })"
            ><Download :size="16" />
          </Button>

          <OverlayPanel ref="downloadPanel">
            <div class="flex flex-col gap-2">
              <Button label="Download as JSON" @click="download('json')" />
              <Button label="Download as Text" @click="download('txt')" />
              <Button label="Download as Markdown" @click="download('md')" />
              <Button label="Download as CSV" @click="download('csv')" />
              <Button label="Download as HTML" @click="download('html')" />
            </div>
          </OverlayPanel>
        </div>
      </div>
    </div>

    <!-- Info Dialog -->
    <Dialog
      maximizable
      dismissable-mask
      :draggable="false"
      v-model:visible="infoDialogVisible"
      :modal="true"
      class="w-full sm:w-[30rem] h-auto !rounded-2xl"
    >
      <template #header
        ><h2 class="font-heading text-xl md:text-2xl">
          About document
        </h2></template
      >
    </Dialog>

    <!-- List of All Todo Lists Dialog -->
    <Drawer
      v-model:visible="listDialogVisible"
      position="right"
      :modal="true"
      class="!w-full !max-w-[768px] h-full rounded-none md:rounded-l-3xl"
    >
      <template #header>
        <h2 class="font-heading text-xl md:text-2xl">Your Documents</h2>
      </template>

      <LisOfDocuments />
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle, Download, Info, List, Trash } from "lucide-vue-next";
import DocumentContainer from "~/components/docsGenerator/documentContainer.vue";
import LisOfDocuments from "~/components/docsGenerator/lisOfDocuments.vue";
import { FEATURE_COMING_SOON } from "~/constants/defaultToastMessages";

const toast = useToast();

const route = useRoute();
const router = useRouter();
const documentStore = useDocumentStore();

const downloadPanel = ref();
const infoDialogVisible = ref(false);
const listDialogVisible = ref(false);

const listId = computed(() => route.params.id as string);

const currentList = computed(() =>
  documentStore.documents?.find((list) => list.id === listId.value)
);

const deleteList = () => {
  if (!currentList.value) {
    router.push("/to-do-list");

    toast.add({
      severity: "info",
      summary: "Info",
      detail: "No list found to delete, navigating to `To Do List home page`",
      life: 3000,
    });
    return;
  }

  documentStore.deleteDocument(currentList.value.id);
  router.push("/to-do-list");
  // showDeleteModal.value = false;
};

function download(format: string) {
  if (!currentList.value) return;

  let content = "";
  let mime = "text/plain";
  let extension = format;

  // switch (format) {
  //   case "json":
  //     content = generateJson(currentList.value);
  //     mime = "application/json";
  //     break;
  //   case "txt":
  //     content = generateTxt(currentList.value);
  //     mime = "text/plain";
  //     break;
  //   case "md":
  //     content = generateMarkdown(currentList.value);
  //     mime = "text/markdown";
  //     break;
  //   case "csv":
  //     content = generateCsv(currentList.value);
  //     mime = "text/csv";
  //     break;
  //   case "html":
  //     content = generateHtml(currentList.value);
  //     mime = "text/html";
  //     break;
  //   default:
  //     return;
  // }

  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${currentList.value.title || "todo-list"}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // downloadMenu.value?.hide();
}
</script>

<style scoped></style>

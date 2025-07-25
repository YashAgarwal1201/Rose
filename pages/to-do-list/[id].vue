<template>
  <div class="w-full h-full flex justify-center items-center py-2">
    <div class="w-full h-full flex flex-row">
      <div class="w-[350px] h-full hidden lg:block flex-shrink-0">
        <ToDoListOfTodos />
      </div>
      <div class="w-fit h-full mx-auto flex flex-grow-1">
        <div class="flex w-full lg:max-w-4xl h-full rounded-lg">
          <ToDoListContainer :current-list="currentList" />
        </div>

        <div
          class="h-full hidden sm:flex flex-col justify-end items-center gap-2 px-2"
        >
          <Button
            class="text-white w-10 h-10 shadow-none !rounded-2xl flex-shrink-0 !block lg:!hidden"
            title="List of todo lists"
            @click="listDialogVisible = true"
            ><List :size="16" />
          </Button>
          <Button
            class="text-white w-10 h-10 shadow-none !rounded-2xl flex-shrink-0"
            title="To do list info"
            @click="infoDialogVisible = true"
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
            @click="deleteList"
            ><Trash :size="16" />
          </Button>
          <Button
            class="text-white w-10 h-10 shadow-none !rounded-2xl"
            title="Download to do list"
            @click="(event) => downloadPanel?.toggle(event)"
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
          About todo list
        </h2></template
      >
      <div
        v-if="currentList"
        class="border border-rose-200 dark:border-rose-800 rounded-2xl font-content text-base"
      >
        <div class="w-full flex items-center justify-between px-4 py-2">
          <span class="font-subheading">Title:</span>
          <span>{{ currentList.title }}</span>
        </div>
        <div class="w-full h-[1px] bg-rose-200 dark:bg-rose-800"></div>

        <div class="w-full flex items-center justify-between px-4 py-2">
          <span class="font-subheading">ID:</span>
          <span>{{ currentList.id }}</span>
        </div>
        <div class="w-full h-[1px] bg-rose-200 dark:bg-rose-800"></div>

        <div class="w-full flex items-center justify-between px-4 py-2">
          <span class="font-subheading">Created At:</span>
          <span>{{ formatDate(currentList.timestamp) }}</span>
        </div>
        <div class="w-full h-[1px] bg-rose-200 dark:bg-rose-800"></div>

        <div class="w-full flex items-center justify-between px-4 py-2">
          <span class="font-subheading">Status:</span>
          <span>{{ currentList.isDone ? "Completed" : "In Progress" }}</span>
        </div>
        <div class="w-full h-[1px] bg-rose-200 dark:bg-rose-800"></div>

        <div class="w-full flex items-center justify-between px-4 py-2">
          <span class="font-subheading">Total Items:</span>
          <span>{{ currentList.list.length }}</span>
        </div>
        <div class="w-full h-[1px] bg-rose-200 dark:bg-rose-800"></div>

        <div class="w-full flex items-center justify-between px-4 py-2">
          <span class="font-subheading">Completed Items:</span>
          <span>{{ currentList.list.filter((i) => i.isDone).length }}</span>
        </div>
      </div>

      <div v-else>
        <p>No list selected.</p>
      </div>
    </Dialog>

    <!-- List of All Todo Lists Dialog -->
    <Drawer
      v-model:visible="listDialogVisible"
      position="right"
      :modal="true"
      class="!w-full !max-w-[768px] h-full rounded-none md:rounded-l-3xl"
    >
      <template #header>
        <h2 class="font-heading text-xl md:text-2xl">Your Todo Lists</h2>
      </template>

      <ToDoListOfTodos />
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle, Download, Info, List, Trash } from "lucide-vue-next";
import Button from "primevue/button";
import { FEATURE_COMING_SOON } from "~/constants/defaultToastMessages";
import OverlayPanel from "primevue/overlaypanel";
import { ref } from "vue";
import Dialog from "primevue/dialog";
import Drawer from "primevue/drawer";

const toast = useToast();

const route = useRoute();
const router = useRouter();
const todoStore = useTodoStore();

const downloadPanel = ref();
const infoDialogVisible = ref(false);
const listDialogVisible = ref(false);

function formatDate(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleString();
}

const listId = computed(() => route.params.id as string);

const currentList = computed(() =>
  todoStore.listOfTodos.find((list) => list.id === listId.value)
);

const deleteList = () => {
  if (!currentList.value) {
    router.push("/to-do-list");
    toast.add({
      severity: "warn",
      summary: "Warning",
      detail: "No list found to delete, navigating to `To Do List home page`",
      life: 700,
    });
    return;
  }

  todoStore.deleteTodoList(currentList.value.id);
  toast.add({
    severity: "success",
    summary: "Success",
    detail: "List deleted successfully",
    life: 700,
  });
  router.push("/to-do-list");
  // showDeleteModal.value = false;
};

function download(format: string) {
  if (!currentList.value) return;

  let content = "";
  let mime = "text/plain";
  let extension = format;

  switch (format) {
    case "json":
      content = generateJson(currentList.value);
      mime = "application/json";
      break;
    case "txt":
      content = generateTxt(currentList.value);
      mime = "text/plain";
      break;
    case "md":
      content = generateMarkdown(currentList.value);
      mime = "text/markdown";
      break;
    case "csv":
      content = generateCsv(currentList.value);
      mime = "text/csv";
      break;
    case "html":
      content = generateHtml(currentList.value);
      mime = "text/html";
      break;
    default:
      return;
  }

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

<template>
  <div class="w-full h-full flex justify-center items-center py-2">
    <div class="w-full h-full flex flex-row">
      <div class="w-[350px] h-full"><ToDoListOfTodos /></div>
      <div class="w-fit h-full mx-auto flex">
        <div class="flex w-full sm:w-[600px] h-full rounded-lg">
          <ToDoListContainer :current-list="currentList" />
        </div>

        <div class="h-full flex flex-col justify-end items-center gap-2 px-2">
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
  </div>
</template>

<script setup lang="ts">
import { CheckCircle, Download, Info, Trash } from "lucide-vue-next";
import Button from "primevue/button";
import { FEATURE_COMING_SOON } from "~/constants/defaultToastMessages";
import OverlayPanel from "primevue/overlaypanel";
import { ref } from "vue";

const toast = useToast();

const route = useRoute();
const router = useRouter();
const todoStore = useTodoStore();

const downloadPanel = ref();

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

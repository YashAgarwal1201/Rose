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
            class="text-white w-10 h-10 shadow-none rounded-2xl"
            title="To do list info"
            @click="toast.add({ title: FEATURE_COMING_SOON })"
            ><Info :size="16" />
          </Button>
          <Button
            class="text-white w-10 h-10 shadow-none rounded-2xl"
            title="Mark all items as done"
            @click="toast.add({ title: FEATURE_COMING_SOON })"
            ><CheckCircle :size="16" />
          </Button>
          <Button
            class="text-white w-10 h-10 shadow-none rounded-2xl"
            title="Delete to do list"
            @click="deleteList"
            ><Trash :size="16" />
          </Button>
          <Button
            class="text-white w-10 h-10 shadow-none rounded-2xl"
            title="Download to do list"
            @click="downloadList"
            ><Download :size="16" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle, Download, Info, Trash } from "lucide-vue-next";
import Button from "primevue/button";
import { FEATURE_COMING_SOON } from "~/constants/defaultToastMessages";

const toast = useToast();

const route = useRoute();
const router = useRouter();
const todoStore = useTodoStore();

const listId = computed(() => route.params.id as string);

const currentList = computed(() =>
  todoStore.listOfTodos.find((list) => list.id === listId.value)
);

const deleteList = () => {
  if (!currentList.value) {
    router.push("/to-do-list");
    toast.add({
      title: "No list found to delete, navigating to `To Do List home page`",
      timeout: 700,
    });
    return;
  }

  todoStore.deleteTodoList(currentList.value.id);
  router.push("/to-do-list");
  // showDeleteModal.value = false;
};

const downloadList = () => {
  if (!currentList.value) return;

  const listData = {
    title: currentList.value.title,
    items: currentList.value.list,
    created: currentList.value.timestamp,
  };

  const blob = new Blob([JSON.stringify(listData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${currentList.value.title || "todo-list"}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
</script>

<style scoped></style>

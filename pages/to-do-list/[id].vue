<template>
  <div class="w-full h-full flex justify-center items-center py-2">
    <div class="w-full h-full flex flex-row">
      <div class="w-[250px] h-full"><ToDoListOfTodos /></div>
      <div class="w-fit h-full mx-auto flex">
        <div class="flex w-full sm:w-[600px] h-full rounded-lg">
          <ToDoListContainer :current-list="currentList" />
        </div>

        <div class="h-full flex flex-col justify-end items-center gap-2 px-2">
          <UButton class="text-white shadow-none" title="To do list info"
            ><UIcon name="material-symbols:info-rounded" size="20px"></UIcon
          ></UButton>
          <UButton class="text-white shadow-none" title="Mark all items as done"
            ><UIcon name="material-symbols:done-all-rounded" size="20px"></UIcon
          ></UButton>
          <UButton class="text-white shadow-none" title="Delete to do list"
            ><UIcon
              name="material-symbols:delete-forever-rounded"
              size="20px"
            ></UIcon
          ></UButton>
          <UButton
            class="text-white shadow-none"
            title="Download to do list"
            @click="downloadList"
            ><UIcon
              name="material-symbols:download-2-rounded"
              size="20px"
            ></UIcon
          ></UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const todoStore = useTodoStore();

const listId = computed(() => route.params.id as string);

const currentList = computed(() =>
  todoStore.listOfTodos.find((list) => list.id === listId.value)
);

const deleteList = () => {
  if (!currentList.value) return;

  todoStore.deleteTodoList(currentList.value.id);
  router.push("/todos");
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

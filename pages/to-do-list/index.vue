<template>
  <div class="w-full h-full flex justify-center">
    <div
      class="w-full lg:w-[1024px] h-full py-4 flex flex-col gap-y-5 md:gap-y-7"
    >
      <div class="flex items-center justify-between">
        <h1 class="text-2xl lg:text-3xl font-heading">Notes</h1>
        <UButton
          class="text-white shadow-none"
          title="To do list"
          @click="navigateToNewList"
        >
          <UIcon name="material-symbols:edit-document-rounded" size="20px" />
          <span>New ToDo List</span>
        </UButton>
      </div>

      <div
        v-if="todoStore?.listOfTodos?.length > 0"
        class="w-full h-[calc(100%-40px)] grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto"
      >
        <div
          v-for="(listItem, index) in todoStore.listOfTodos"
          :key="index"
          class="h-fit flex flex-row gap-x-3 p-2 md:p-3 rounded-md shadow-md bg-rose-800"
        >
          <div class="mt-1">
            <UCheckbox :value="listItem.isDone" />
          </div>
          <div>
            <h3
              class="text-base sm:text-lg 2xl:text-xl underline cursor-pointer"
              @click="navigateToList(listItem.id)"
            >
              {{ listItem.title }}
            </h3>
            <span class="text-xs sm:text-sm text-rose-200">{{
              formatTimestamp(listItem.timestamp)
            }}</span>
          </div>
        </div>
      </div>

      <div
        v-else
        class="w-full h-[calc(100%-40px)] flex flex-col justify-center items-center"
      >
        <p>No To Do List is present</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { v4 as uuidv4 } from "uuid";

const router = useRouter();
const todoStore = useTodoStore();

// Format timestamp
const formatTimestamp = (timestamp: string | number | Date) => {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Navigation function
const navigateToList = (listId: string) => {
  router.push(`/to-do-list/${listId}`);
};

// Navigation function for new list
const navigateToNewList = () => {
  const newListId = uuidv4(); // Generate a new UUID
  router.push(`/to-do-list/${newListId}`);
};
</script>

<style scoped></style>

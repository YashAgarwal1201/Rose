<template>
  <div class="p-3 flex flex-col gap-y-4 w-full h-full">
    <Button
      class="text-white shadow-none"
      title="To do list info"
      @click="navigateToNewList"
    >
      <FileEdit :size="16" />
      <span>New ToDo List</span>
    </Button>

    <Accordion :multiple="true" class="todo-accordion">
      <AccordionPanel>
        <template #header>Last 7 days</template>
        <div class="p-3">
          <div v-if="recentListsWeek.length === 0">
            No lists in the last 7 days
          </div>
          <div v-else class="flex flex-col gap-y-2">
            <div
              v-for="list in recentListsWeek"
              :key="list.id"
              class="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors duration-200"
              @click="navigateToList(list.id)"
            >
              <span>{{ list.title }}</span>
              <span class="text-sm text-gray-500">{{
                new Date(list.timestamp).toLocaleDateString()
              }}</span>
            </div>
          </div>
        </div>
      </AccordionPanel>

      <AccordionPanel>
        <template #header>Last 30 days</template>
        <div class="p-3">
          <div v-if="recentListsMonth.length === 0">
            No lists in the last 30 days
          </div>
          <div v-else class="flex flex-col gap-y-2">
            <div
              v-for="list in recentListsMonth"
              :key="list.id"
              class="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors duration-200"
              @click="navigateToList(list.id)"
            >
              <span>{{ list.title }}</span>
              <span class="text-sm text-gray-500">{{
                new Date(list.timestamp).toLocaleDateString()
              }}</span>
            </div>
          </div>
        </div>
      </AccordionPanel>

      <AccordionPanel>
        <template #header>Older lists</template>
        <div class="p-3">
          <div v-if="olderLists.length === 0">No older lists</div>
          <div v-else class="flex flex-col gap-y-2">
            <div
              v-for="list in olderLists"
              :key="list.id"
              class="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors duration-200"
              @click="navigateToList(list.id)"
            >
              <span>{{ list.title }}</span>
              <span class="text-sm text-gray-500">{{
                new Date(list.timestamp).toLocaleDateString()
              }}</span>
            </div>
          </div>
        </div>
      </AccordionPanel>
    </Accordion>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { v4 as uuidv4 } from "uuid";
import { FileEdit } from "lucide-vue-next";
import { useTodoStore } from "@/stores/todoStore";

const router = useRouter();
const todoStore = useTodoStore();

// Navigation function
const navigateToList = (listId: string) => {
  router.push(`/to-do-list/${listId}`);
};

// Navigation function for new list
const navigateToNewList = () => {
  const newListId = uuidv4(); // Generate a new UUID
  router.push(`/to-do-list/${newListId}`);
};

// Helper function to create date objects for filtering
const getDateBefore = (days: number) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
};

// Lists from last 7 days
const recentListsWeek = computed(() => {
  const sevenDaysAgo = getDateBefore(7);
  return todoStore.listOfTodos?.filter((list) => {
    const listDate = new Date(list.timestamp);
    return listDate >= sevenDaysAgo;
  });
});

// Lists from last 30 days (excluding last 7 days)
const recentListsMonth = computed(() => {
  const thirtyDaysAgo = getDateBefore(30);
  const sevenDaysAgo = getDateBefore(7);

  return todoStore.listOfTodos?.filter((list) => {
    const listDate = new Date(list.timestamp);
    return listDate >= thirtyDaysAgo && listDate < sevenDaysAgo;
  });
});

// Lists older than 30 days
const olderLists = computed(() => {
  const thirtyDaysAgo = getDateBefore(30);

  return todoStore.listOfTodos?.filter((list) => {
    const listDate = new Date(list.timestamp);
    return listDate < thirtyDaysAgo;
  });
});
</script>

<style scoped>
.todo-accordion {
  width: 100%;
}

.todo-accordion :deep(.p-accordion-panel) {
  margin-bottom: 0.5rem;
}

.todo-accordion :deep(.p-accordion-header) {
  border-radius: 6px;
}

.todo-accordion :deep(.p-accordion-content) {
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
}
</style>

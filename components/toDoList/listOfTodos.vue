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

    <UAccordion
      :items="[
        {
          label: 'Last 7 days',
          content:
            recentListsWeek.length > 0
              ? recentListsWeek.map((list) => ({
                  id: list.id,
                  title: list.title,
                  timestamp: new Date(list.timestamp).toLocaleDateString(),
                }))
              : 'No lists in the last 7 days',
        },
        {
          label: 'Last 30 days',
          content:
            recentListsMonth.length > 0
              ? recentListsMonth.map((list) => ({
                  id: list.id,
                  title: list.title,
                  timestamp: new Date(list.timestamp).toLocaleDateString(),
                }))
              : 'No lists in the last 30 days',
        },
        {
          label: 'Older lists',
          content:
            olderLists.length > 0
              ? olderLists.map((list) => ({
                  id: list.id,
                  title: list.title,
                  timestamp: new Date(list.timestamp).toLocaleDateString(),
                }))
              : 'No older lists',
        },
      ]"
    >
      <template #item="{ item }">
        <div class="p-3">
          <div v-if="typeof item.content === 'string'">
            {{ item.content }}
          </div>
          <div v-else class="flex flex-col gap-y-2">
            <div
              v-for="list in item.content"
              :key="list.id"
              class="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors duration-200"
              @click="navigateToList(list.id)"
            >
              <span>{{ list.title }}</span>
              <span class="text-sm text-gray-500">{{ list.timestamp }}</span>
            </div>
          </div>
        </div>
      </template>
    </UAccordion>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { v4 as uuidv4 } from "uuid";
import { FileEdit } from "lucide-vue-next";

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
.u-accordion-item {
  margin-bottom: 0.5rem;
}
</style>

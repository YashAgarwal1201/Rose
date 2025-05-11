<template>
  <div class="p-3 flex flex-col gap-y-4 w-full h-full">
    <Button
      class="text-white shadow-none !rounded-xl"
      title="To do list info"
      @click="navigateToNewList"
    >
      <FileEdit :size="16" />
      <span>New ToDo List</span>
    </Button>

    <Accordion class="bg-rose-700 dark:bg-rose-900 rounded-2xl p-3">
      <AccordionPanel :value="0" class="!border-none !bg-transparent">
        <AccordionHeader class="!bg-transparent !rounded-2xl"
          ><h3 class="text-base font-medium text-slate-200 dark:text-slate-100">
            Last 7 days
          </h3></AccordionHeader
        ><AccordionContent class="!bg-transparent !rounded-b-2xl">
          <div class="bg-transparent font-content">
            <div v-if="recentListsWeek.length === 0">
              No lists in the last 7 days
            </div>
            <div v-else class="flex flex-col gap-y-2">
              <Button
                v-for="list in recentListsWeek"
                :key="list.id"
                class="flex !justify-between items-center p-2 rounded cursor-pointer transition-colors duration-200"
                @click="navigateToList(list.id)"
              >
                <span>{{ list.title }}</span>
                <span class="text-sm text-slate-600">{{
                  new Date(list.timestamp).toLocaleDateString()
                }}</span>
              </Button>
            </div>
          </div></AccordionContent
        >
      </AccordionPanel>
      <div
        class="mx-2 my-1 h-[1.5px] max-w-full bg-rose-800 dark:bg-rose-200 rounded"
      ></div>

      <AccordionPanel :value="1" class="!border-none">
        <AccordionHeader class="!bg-transparent !rounded-2xl"
          ><h3 class="text-base font-medium text-slate-200 dark:text-slate-100">
            Last 30 days
          </h3></AccordionHeader
        >
        <AccordionContent class="!bg-transparent"
          ><div class="bg-transparent font-content">
            <div v-if="recentListsMonth.length === 0">
              No lists in the last 30 days
            </div>
            <div v-else class="flex flex-col gap-y-2">
              <Button
                v-for="list in recentListsMonth"
                :key="list.id"
                class="flex !justify-between items-center p-2 rounded cursor-pointer transition-colors duration-200"
                @click="navigateToList(list.id)"
              >
                <span>{{ list.title }}</span>
                <span class="text-sm text-slate-600">{{
                  new Date(list.timestamp).toLocaleDateString()
                }}</span>
              </Button>
            </div>
          </div></AccordionContent
        >
      </AccordionPanel>
      <div
        class="mx-2 my-1 h-[1.5px] max-w-full bg-rose-800 dark:bg-rose-200 rounded"
      ></div>

      <AccordionPanel :value="2" class="!border-none">
        <AccordionHeader class="!bg-transparent !rounded-2xl"
          ><h3 class="text-base font-medium text-slate-200 dark:text-slate-100">
            Older Sketch Notes
          </h3></AccordionHeader
        >
        <AccordionContent class="!bg-transparent"
          ><div class="bg-transparent font-content">
            <div v-if="olderLists.length === 0">No older lists</div>
            <div v-else class="flex flex-col gap-y-2">
              <Button
                v-for="list in olderLists"
                :key="list.id"
                class="flex !justify-between items-center p-2 rounded cursor-pointer transition-colors duration-200"
                @click="navigateToList(list.id)"
              >
                <span>{{ list.title }}</span>
                <span class="text-sm text-gray-500">{{
                  new Date(list.timestamp).toLocaleDateString()
                }}</span>
              </Button>
            </div>
          </div>
        </AccordionContent>
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
import Accordion from "primevue/accordion";
import AccordionPanel from "primevue/accordionpanel";
import AccordionContent from "primevue/accordioncontent";
import Button from "primevue/button";

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

<style>
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

.p-accordioncontent-content {
  background-color: transparent !important;
}
</style>

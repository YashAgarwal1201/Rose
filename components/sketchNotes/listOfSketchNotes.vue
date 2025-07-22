<template>
  <div class="p-3 flex flex-col gap-y-4 w-full h-full">
    <div class="flex items-center gap-3">
      <Button
        class="text-white shadow-none h-full flex-shrink-0 !rounded-xl"
        title="Go back"
        @click="goBack"
        ><ArrowLeft :size="16" /> </Button
      ><Button
        class="text-white shadow-none !rounded-xl flex-grow"
        title="To do list info"
        @click="navigateToNewList"
      >
        <FileEdit :size="20" />
        <span class="ml-2">New Sketch Note</span>
      </Button>
    </div>

    <Accordion class="bg-rose-700 dark:bg-rose-900 rounded-2xl p-3">
      <!-- Last 7 Days -->
      <AccordionPanel :value="0" class="!border-none !bg-transparent">
        <AccordionHeader class="!bg-transparent !rounded-2xl"
          ><h3 class="text-base font-medium text-slate-200 dark:text-slate-100">
            Last 7 days
          </h3></AccordionHeader
        >
        <AccordionContent class="!bg-transparent !rounded-b-2xl"
          ><div v-if="recentListsWeek.length === 0" class="text-sm">
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
              <span class="text-sm text-gray-500">
                {{ new Date(list.timestamp).toLocaleDateString() }}
              </span>
            </div>
          </div></AccordionContent
        >
      </AccordionPanel>

      <div
        class="mx-2 my-1 h-[1.5px] max-w-full bg-rose-800 dark:bg-rose-200 rounded"
      ></div>
      <!-- Last 30 Days -->
      <AccordionPanel :value="1" class="!border-none">
        <AccordionHeader class="!bg-transparent !rounded-2xl"
          ><h3 class="text-base font-medium text-slate-200 dark:text-slate-100">
            Last 30 days
          </h3></AccordionHeader
        >
        <AccordionContent class="!bg-transparent"
          ><div v-if="recentListsMonth.length === 0" class="text-sm">
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
              <span class="text-sm text-gray-500">
                {{ new Date(list.timestamp).toLocaleDateString() }}
              </span>
            </div>
          </div></AccordionContent
        >
      </AccordionPanel>

      <div
        class="mx-2 my-1 h-[1.5px] max-w-full bg-rose-800 dark:bg-rose-200 rounded"
      ></div>
      <!-- Older Lists -->
      <AccordionPanel :value="2" class="!border-none">
        <AccordionHeader class="!bg-transparent !rounded-2xl"
          ><h3 class="text-base font-medium text-slate-200 dark:text-slate-100">
            Older Sketch Notes
          </h3></AccordionHeader
        >
        <AccordionContent class="!bg-transparent"
          ><div v-if="olderLists.length === 0" class="text-sm">
            No older lists
          </div>
          <div v-else class="flex flex-col gap-y-2">
            <div
              v-for="list in olderLists"
              :key="list.id"
              class="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors duration-200"
              @click="navigateToList(list.id)"
            >
              <span>{{ list.title }}</span>
              <span class="text-sm text-gray-500">
                {{ new Date(list.timestamp).toLocaleDateString() }}
              </span>
            </div>
          </div></AccordionContent
        >
      </AccordionPanel>
    </Accordion>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { v4 as uuidv4 } from "uuid";
import { ArrowLeft, FileEdit } from "lucide-vue-next";
import Button from "primevue/button";
import Accordion from "primevue/accordion";
import AccordionPanel from "primevue/accordionpanel";
import { useTodoStore } from "@/stores/todoStore"; // Make sure this import is correct

const router = useRouter();
const todoStore = useTodoStore();

const navigateToList = (listId: string) => {
  router.push(`/to-do-list/${listId}`);
};

const navigateToNewList = () => {
  const newListId = uuidv4();
  router.push(`/to-do-list/${newListId}`);
};

const goBack = () => {
  router.back();
};

const getDateBefore = (days: number) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
};

const recentListsWeek = computed(() => {
  const sevenDaysAgo = getDateBefore(7);
  return (
    todoStore.listOfTodos?.filter(
      (list) => new Date(list.timestamp) >= sevenDaysAgo
    ) ?? []
  );
});

const recentListsMonth = computed(() => {
  const thirtyDaysAgo = getDateBefore(30);
  const sevenDaysAgo = getDateBefore(7);
  return (
    todoStore.listOfTodos?.filter((list) => {
      const listDate = new Date(list.timestamp);
      return listDate >= thirtyDaysAgo && listDate < sevenDaysAgo;
    }) ?? []
  );
});

const olderLists = computed(() => {
  const thirtyDaysAgo = getDateBefore(30);
  return (
    todoStore.listOfTodos?.filter(
      (list) => new Date(list.timestamp) < thirtyDaysAgo
    ) ?? []
  );
});
</script>

<style lang="css">
/* Add styles for better accordion appearance if needed */
:deep(.p-accordion-panel) {
  margin-bottom: 0.5rem;
}

:deep(.p-accordion-header) {
  border-radius: 6px;
}

:deep(.p-accordion-content) {
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
}

.p-accordioncontent-content {
  background-color: transparent !important;
}
</style>

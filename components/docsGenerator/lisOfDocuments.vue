<template>
  <div class="p-3 flex flex-col gap-y-4 w-full h-full">
    <Button
      class="text-white shadow-none !rounded-xl"
      title="To do list info"
      @click="navigateToNewDocument"
    >
      <FileEdit :size="16" />
      <span>New Document</span>
    </Button>

    <Accordion class="bg-rose-700 dark:bg-rose-900 rounded-2xl p-3">
      <!-- Last 7 Days -->

      <AccordionPanel :value="0" class="!border-none !bg-transparent">
        <AccordionHeader class="!bg-transparent !rounded-2xl"
          ><h3 class="text-base font-medium text-slate-200 dark:text-slate-100">
            Last 7 days
          </h3></AccordionHeader
        ><AccordionContent class="!bg-transparent !rounded-b-2xl">
          <div v-if="recentListsWeek.length === 0">
            No lists in the last 7 days
          </div>
          <div v-else class="flex flex-col gap-y-2">
            <div
              v-for="document in recentListsWeek"
              :key="document.id"
              class="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors duration-200"
              @click="navigateToDocument(document.id)"
            >
              <span>{{ document.title }}</span>
              <span class="text-sm text-gray-500">
                {{ new Date(document.timestamp).toLocaleDateString() }}
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
        <AccordionContent class="!bg-transparent">
          <div v-if="recentListsMonth.length === 0">
            No lists in the last 30 days
          </div>
          <div v-else class="flex flex-col gap-y-2">
            <div
              v-for="document in recentListsMonth"
              :key="document.id"
              class="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors duration-200"
              @click="navigateToDocument(document.id)"
            >
              <span>{{ document.title }}</span>
              <span class="text-sm text-gray-500">
                {{ new Date(document.timestamp).toLocaleDateString() }}
              </span>
            </div>
          </div></AccordionContent
        >
      </AccordionPanel>
      <div
        class="mx-2 my-1 h-[1.5px] max-w-full bg-rose-800 dark:bg-rose-200 rounded"
      ></div>
      <!-- Older Documents -->
      <AccordionPanel :value="2" class="!border-none">
        <AccordionHeader class="!bg-transparent !rounded-2xl"
          ><h3 class="text-base font-medium text-slate-200 dark:text-slate-100">
            Older Docments
          </h3></AccordionHeader
        ><AccordionContent>
          <div v-if="olderLists.length === 0">No older documents</div>
          <div v-else class="flex flex-col gap-y-2">
            <div
              v-for="document in olderLists"
              :key="document.id"
              class="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors duration-200"
              @click="navigateToDocument(document.id)"
            >
              <span>{{ document.title }}</span>
              <span class="text-sm text-gray-500">
                {{ new Date(document.timestamp).toLocaleDateString() }}
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
import { FileEdit } from "lucide-vue-next";
import Button from "primevue/button";
import Accordion from "primevue/accordion";
import AccordionPanel from "primevue/accordionpanel";
import AccordionHeader from "primevue/accordionheader";
import AccordionContent from "primevue/accordioncontent";

const router = useRouter();
const documentStore = useDocumentStore();

const navigateToDocument = (documentId: string) => {
  router.push(`/docs-generator/${documentId}`);
};

const navigateToNewDocument = () => {
  const newDocumentId = uuidv4();
  router.push(`/docs-generator/${newDocumentId}`);
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
    documentStore.documents?.filter(
      (document) => new Date(document.timestamp) >= sevenDaysAgo
    ) ?? []
  );
});

const recentListsMonth = computed(() => {
  const thirtyDaysAgo = getDateBefore(30);
  const sevenDaysAgo = getDateBefore(7);
  return (
    documentStore.documents?.filter((document) => {
      const listDate = new Date(document.timestamp);
      return listDate >= thirtyDaysAgo && listDate < sevenDaysAgo;
    }) ?? []
  );
});

const olderLists = computed(() => {
  const thirtyDaysAgo = getDateBefore(30);
  return (
    documentStore.documents?.filter(
      (document) => new Date(document.timestamp) < thirtyDaysAgo
    ) ?? []
  );
});
</script>

<style>
.p-accordioncontent-content {
  background-color: transparent !important;
}
</style>

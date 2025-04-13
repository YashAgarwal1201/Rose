<template>
  <div class="p-3 flex flex-col gap-y-4 w-full h-full">
    <Button
      class="text-white shadow-none px-4 rounded-full justify-center flex items-center gap-x-2"
      title="To do list info"
      @click="navigateToNewDocument"
    >
      <FileEdit :size="16" />
      <span>New Document</span>
    </Button>

    <Accordion :multiple="true">
      <!-- Last 7 Days -->
      <AccordionTab header="Last 7 days">
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
        </div>
      </AccordionTab>

      <!-- Last 30 Days -->
      <AccordionTab header="Last 30 days">
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
        </div>
      </AccordionTab>

      <!-- Older Documents -->
      <AccordionTab header="Older documents">
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
        </div>
      </AccordionTab>
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
import AccordionTab from "primevue/accordiontab";

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

<style scoped></style>

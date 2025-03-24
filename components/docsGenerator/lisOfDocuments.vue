<template>
  <div class="p-3 flex flex-col gap-y-4 w-full h-full">
    <UButton
      class="text-white shadow-none"
      title="To do list info"
      @click="navigateToNewDocument"
    >
      <UIcon name="material-symbols:edit-document-rounded" size="20px" />
      <span>New Document</span>
    </UButton>

    <UAccordion
      :items="[
        {
          label: 'Last 7 days',
          content:
            recentListsWeek.length > 0
              ? recentListsWeek.map((document) => ({
                  id: document.id,
                  title: document.title,
                  timestamp: new Date(document.timestamp).toLocaleDateString(),
                }))
              : 'No lists in the last 7 days',
        },
        {
          label: 'Last 30 days',
          content:
            recentListsMonth.length > 0
              ? recentListsMonth.map((document) => ({
                  id: document.id,
                  title: document.title,
                  timestamp: new Date(document.timestamp).toLocaleDateString(),
                }))
              : 'No lists in the last 30 days',
        },
        {
          label: 'Older documents',
          content:
            olderLists.length > 0
              ? olderLists.map((document) => ({
                  id: document.id,
                  title: document.title,
                  timestamp: new Date(document.timestamp).toLocaleDateString(),
                }))
              : 'No older documents',
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
              v-for="document in item.content"
              :key="document.id"
              class="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors duration-200"
              @click="navigateToDocument(document.id)"
            >
              <span>{{ document.title }}</span>
              <span class="text-sm text-gray-500">{{
                document.timestamp
              }}</span>
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

const router = useRouter();
const documentStore = useDocumentStore();

// Navigation function
const navigateToDocument = (documentId: string) => {
  router.push(`/docs-generator/${documentId}`);
};

// Navigation function for new list
const navigateToNewDocument = () => {
  const newDocumentId = uuidv4(); // Generate a new UUID
  router.push(`/docs-generator/${newDocumentId}`);
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
  return documentStore.documents?.filter((document) => {
    const listDate = new Date(document.timestamp);
    return listDate >= sevenDaysAgo;
  });
});

// Lists from last 30 days (excluding last 7 days)
const recentListsMonth = computed(() => {
  const thirtyDaysAgo = getDateBefore(30);
  const sevenDaysAgo = getDateBefore(7);

  return documentStore.documents?.filter((document) => {
    const listDate = new Date(document.timestamp);
    return listDate >= thirtyDaysAgo && listDate < sevenDaysAgo;
  });
});

// Lists older than 30 days
const olderLists = computed(() => {
  const thirtyDaysAgo = getDateBefore(30);

  return documentStore.documents?.filter((document) => {
    const listDate = new Date(document.timestamp);
    return listDate < thirtyDaysAgo;
  });
});
</script>

<style scoped>
.u-accordion-item {
  margin-bottom: 0.5rem;
}
</style>

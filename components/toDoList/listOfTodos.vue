<template>
  <div class="p-3 flex flex-col gap-y-4 w-full h-full">
    <UButton class="text-white shadow-none" title="To do list info"
      ><UIcon name="material-symbols:edit-document-rounded" size="20px"></UIcon
      ><span>New ToDo List</span></UButton
    >

    <div class="flex flex-col gap-y-3">
      <span class="px-4 py-1 bg-rose-400 rounded">Last 7 days</span>

      <div v-if="recentListsWeek.length > 0">
        <span v-for="list in recentListsWeek">{{ list.title }}</span>
      </div>
      <div v-else>
        <span>No List to show</span>
      </div>
    </div>

    <div class="flex flex-col gap-y-3">
      <span class="px-4 py-1 bg-rose-400 rounded">Last 30 days</span>

      <div v-if="recentListsMonth.length > 0">
        <span v-for="list in recentListsMonth">{{ list.title }}</span>
      </div>
      <div v-else>
        <span>No List to show</span>
      </div>
    </div>

    <div class="flex flex-col gap-y-3">
      <span class="px-4 py-1 bg-rose-400 rounded">before 30 days</span>

      <div v-if="recentListsYear.length > 0">
        <span v-for="list in recentListsYear">{{ list.title }}</span>
      </div>
      <div v-else>
        <span>No List to show</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const todoStore = useTodoStore();

const recentListsWeek = computed(() => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return todoStore.activeLists.filter((list) => {
    const listDate = new Date(list.timestamp);
    return listDate >= sevenDaysAgo;
  });
});

const recentListsMonth = computed(() => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return todoStore.activeLists.filter((list) => {
    const listDate = new Date(list.timestamp);
    return listDate >= sevenDaysAgo;
  });
});

const recentListsYear = computed(() => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return todoStore.activeLists.filter((list) => {
    const listDate = new Date(list.timestamp);
    return listDate >= sevenDaysAgo;
  });
});
</script>

<style scoped></style>

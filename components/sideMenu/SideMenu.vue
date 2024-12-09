<template>
  <div>
    <USlideover
      :model-value="headerStore.showSideMenu"
      :appear="true"
      side="right"
    >
      <div class="flex flex-col">
        <div class="flex justify-between items-start p-5">
          <h2 class="font-heading text-xl sm:text-2xl lg:text-3xl text-color5">
            Menu
          </h2>
          <UButton
            icon="material-symbols:close-rounded"
            @click="headerStore.showSideMenu = false"
            class="self-end bg-transparent"
          />
        </div>
        <div class="w-full px-5 pb-5">
          <div class="w-full flex flex-col rounded-3xl bg-slate-500 p-4">
            <RouterLink to="/" :class="buttonStyles"
              ><UIcon name="material-symbols:house-rounded"></UIcon
              ><span>Home</span></RouterLink
            >
            <UDivider class="w-full mx-2 my-1 p-0 h-[1.5px]" />

            <RouterLink to="/expense-calculator" :class="buttonStyles"
              ><UIcon name="material-symbols:calculate-rounded"></UIcon
              ><span>Expense Calculator</span></RouterLink
            >
            <UDivider class="w-full mx-2 my-1 p-0 h-[1.5px]" />

            <RouterLink to="/to-do-list" :class="buttonStyles"
              ><UIcon
                name="material-symbols:format-list-bulleted-add-rounded"
              ></UIcon
              ><span>To Do List</span></RouterLink
            >
          </div>
        </div>
      </div>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
const buttonStyles =
  "px-2 py-4 bg-transparent flex items-center gap-x-3 rounded-xl *:text-lg";
// const { isSideMenuVisible, closeSideMenu } = useSideMenu();

const headerStore = useHeaderStore();
</script>

<style scoped></style>

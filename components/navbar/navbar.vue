<template>
  <div
    class="w-full h-full hidden md:flex flex-row md:flex-col justify-start items-center"
  >
    <RouterLink to="/" :class="buttonStyles"
      ><UIcon name="material-symbols:house-rounded" size="20px"></UIcon
    ></RouterLink>
    <RouterLink to="/expense-calculator" :class="buttonStyles"
      ><UIcon name="material-symbols:calculate-rounded" size="20px"></UIcon
    ></RouterLink>
    <RouterLink to="/to-do-list" :class="buttonStyles"
      ><UIcon
        name="material-symbols:format-list-bulleted-add-rounded"
        size="20px"
      ></UIcon
    ></RouterLink>
    <RouterLink to="/docs-generator" :class="buttonStyles"
      ><UIcon name="material-symbols:docs-rounded" size="20px"></UIcon
    ></RouterLink>
  </div>

  <div class="w-full h-full px-3 flex md:hidden justify-between items-center">
    <h3 class="text-lg sm:text-xl">{{ headerStore.headerTitle }}</h3>

    <UButton
      icon="material-symbols:menu-rounded"
      class="rounded-full"
      @click="headerStore.showSideMenu = true"
    />
  </div>
</template>

<script setup lang="ts">
const buttonStyles = "p-3 bg-transparent rounded-full *:text-lg";

const { openSideMenu } = useSideMenu();

const headerStore = useHeaderStore();
</script>

<style scoped></style>

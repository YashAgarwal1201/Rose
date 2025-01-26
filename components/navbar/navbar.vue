<template>
  <div
    class="w-full h-full p-1 hidden md:flex flex-row md:flex-col justify-start items-center"
  >
    <RouterLink
      to="/"
      :class="route.fullPath === '/' ? selectedButton : buttonStyles"
      ><UIcon name="material-symbols:house-rounded" size="20px"></UIcon
    ></RouterLink>
    <RouterLink
      to="/expense-calculator"
      :class="
        route.fullPath === '/expense-calculator' ? selectedButton : buttonStyles
      "
      ><UIcon name="material-symbols:calculate-rounded" size="20px"></UIcon
    ></RouterLink>
    <RouterLink
      to="/to-do-list"
      :class="route.fullPath === '/to-do-list' ? selectedButton : buttonStyles"
      ><UIcon
        name="material-symbols:format-list-bulleted-add-rounded"
        size="20px"
      ></UIcon
    ></RouterLink>
    <RouterLink
      to="/docs-generator"
      :class="
        route.fullPath === '/docs-generator' ? selectedButton : buttonStyles
      "
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
const headerStore = useHeaderStore();
const route = useRoute();

console.log(route.fullPath);
const buttonStyles =
  "w-full aspect-square flex justify-center items-center rounded-md bg-transparent *:text-lg pointer-events-auto";
const selectedButton =
  "w-full aspect-square flex justify-center items-center rounded-md bg-rose-500 *:text-lg pointer-events-none";
</script>

<style scoped>
.aspect-square {
  aspect-ratio: 1/1;
}
</style>

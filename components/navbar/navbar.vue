<template>
  <div
    class="w-full h-full p-1 flex flex-row md:flex-col justify-between items-center"
  >
    <div
      class="w-full hidden md:flex flex-row md:flex-col justify-start items-center"
    >
      <RouterLink
        to="/"
        :class="route.fullPath === '/' ? selectedButton : buttonStyles"
        ><UIcon name="material-symbols:house-rounded" size="20px"></UIcon
      ></RouterLink>
      <RouterLink
        to="/expense-calculator"
        :class="
          route.fullPath === '/expense-calculator'
            ? selectedButton
            : buttonStyles
        "
        ><UIcon name="material-symbols:calculate-rounded" size="20px"></UIcon
      ></RouterLink>
      <RouterLink
        to="/to-do-list"
        :class="
          route.fullPath === '/to-do-list' ? selectedButton : buttonStyles
        "
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

    <div
      class="w-full h-full md:h-fit flex justify-between items-center mt-0 md:mt-auto"
    >
      <h3 class="block md:hidden text-lg sm:text-xl">
        {{ headerStore.headerTitle }}
      </h3>

      <UButton
        icon="material-symbols:menu-rounded"
        class="w-auto md:w-full h-auto aspect-square flex justify-center items-center rounded-full md:rounded-md bg-transparent *:text-lg pointer-events-auto"
        @click="headerStore.showSideMenu = true"
      />
    </div>
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

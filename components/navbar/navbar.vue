<template>
  <div
    class="w-full h-full hidden md:flex flex-row md:flex-col justify-center items-center"
  >
    <RouterLink to="/" :class="buttonStyles"
      ><UIcon name="material-symbols:house-rounded"></UIcon
    ></RouterLink>
    <RouterLink to="/expense-calculator" :class="buttonStyles"
      ><UIcon name="material-symbols:calculate-rounded"></UIcon
    ></RouterLink>
    <RouterLink to="/to-do-list" :class="buttonStyles"
      ><UIcon name="material-symbols:format-list-bulleted-add-rounded"></UIcon
    ></RouterLink>
  </div>

  <div class="w-full h-full px-3 flex md:hidden justify-between items-center">
    <h3 class="text-lg sm:text-xl">heading</h3>

    <UButton icon="material-symbols:menu-rounded" class="rounded-full" />
  </div>
</template>

<script setup lang="ts">
const buttonStyles = "p-3 bg-transparent rounded-full *:text-lg";
</script>

<style scoped></style>

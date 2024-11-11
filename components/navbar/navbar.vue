<template>
  <div
    class="w-full h-full flex flex-row md:flex-col justify-center items-center"
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
</template>

<script setup lang="ts">
const buttonStyles = "p-3 bg-transparent rounded-full *:text-lg";
</script>

<style scoped></style>

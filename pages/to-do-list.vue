<template>
  <div class="w-full h-full flex justify-center items-center py-2">
    <div class="w-fit h-full flex flex-row">
      <div class="flex w-full sm:w-[600px] h-full border rounded-lg">
        <ToDoListContainer />
      </div>

      <div class="h-full flex flex-col justify-end items-center gap-2 px-2">
        <UButton class="text-white shadow-none"
          ><UIcon name="material-symbols:done-all-rounded" size="20px"></UIcon
        ></UButton>
        <UButton class="text-white shadow-none"
          ><UIcon
            name="material-symbols:delete-forever-rounded"
            size="20px"
          ></UIcon
        ></UButton>
        <UButton class="text-white shadow-none"
          ><UIcon name="material-symbols:download-2-rounded" size="20px"></UIcon
        ></UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped></style>

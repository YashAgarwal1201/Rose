<template>
  <div class="w-full h-full flex justify-center">
    <div
      class="w-full lg:w-[1024px] h-full border py-4 flex flex-col gap-y-5 md:gap-y-7"
    >
      <div class="flex items-center justify-between">
        <h1 class="text-2xl lg:text-3xl">Notes</h1>
        <UButton class="text-white shadow-none" title="To do list info">
          <UIcon name="material-symbols:edit-document-rounded" size="20px" />
          <span>New ToDo List</span>
        </UButton>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div
          v-for="i in 5"
          class="flex flex-col gap-y-3 p-2 md:p-3 rounded-md shadow-md border cursor-pointer"
        >
          temp
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped></style>

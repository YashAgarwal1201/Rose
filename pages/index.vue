<template>
  <div class="w-full h-full flex flex-col justify-start items-center">
    <div class="w-full h-[200px]">
      <HomepageDateAndTime />
    </div>

    <div class="w-full flex flex-col gap-y-3 sm:gap-y-4">
      <h2 class="font-heading text-xl md:text-2xl">Recent ToDos</h2>
      <div
        class="w-full flex flex-row flex-nowrap gap-x-2 sm:gap-x-3 pr-4 pl-2 pb-1 overflow-y-auto"
      >
        <div
          v-for="i in 20"
          class="w-[200px] flex-shrink-0 flex flex-row gap-x-3 p-3 md:p-4 rounded-md shadow-md bg-rose-800 cursor-pointer"
        >
          <div class="mt-1">
            <UCheckbox :value="false" />
          </div>
          <div>
            <h3 class="text-base sm:text-lg 2xl:text-xl font-heading">
              ToDo Title
            </h3>
            <span class="text-xs sm:text-sm text-rose-100">Time</span>
          </div>
        </div>
      </div>
    </div>

    <div class="w-full flex flex-col gap-y-3 sm:gap-y-4 mt-5 md:mt-7">
      <h2 class="font-heading text-xl md:text-2xl">Recent Transactions</h2>
      <div
        class="w-full flex flex-row flex-nowrap gap-x-2 sm:gap-x-3 pr-4 pl-2 pb-1 overflow-y-auto"
      >
        <div
          v-for="i in 20"
          class="w-[200px] flex-shrink-0 flex flex-row gap-x-3 p-3 md:p-4 rounded-md shadow-md bg-rose-800 cursor-pointer"
        >
          <div>
            <h3 class="text-base sm:text-lg 2xl:text-xl font-heading">
              Transaction Title
            </h3>
            <span class="text-xs sm:text-sm text-rose-100">Time</span>
          </div>
        </div>
      </div>
    </div>

    <div class="w-full flex flex-col gap-y-3 sm:gap-y-4 mt-5 md:mt-7">
      <h2 class="font-heading text-xl md:text-2xl">This Month at a glance</h2>
      <div class="w-full flex flex-col gap-y-2 sm:gap-y-3 pr-4 pl-2 pb-1">
        <span>Transactions Chart</span>

        <span>todos lists added</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped></style>

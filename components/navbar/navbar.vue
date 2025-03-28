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
        ><Home :size="16" />
      </RouterLink>
      <RouterLink
        to="/expense-calculator"
        :class="[
          route.fullPath === '/expense-calculator'
            ? selectedButton
            : buttonStyles,
        ]"
        ><Calculator :size="16" />
      </RouterLink>
      <RouterLink
        to="/to-do-list"
        :class="[
          route.fullPath === '/to-do-list' ? selectedButton : buttonStyles,
        ]"
      >
        <ListTodo :size="16" />
      </RouterLink>
      <RouterLink
        to="/docs-generator"
        :class="[
          route.fullPath === '/docs-generator' ? selectedButton : buttonStyles,
        ]"
        ><FileText :size="16"
      /></RouterLink>
    </div>

    <div
      class="w-full h-full md:h-fit flex justify-between items-center mt-0 md:mt-auto"
    >
      <h3 class="block md:hidden text-lg sm:text-xl">
        {{ headerStore.headerTitle }}
      </h3>

      <UButton
        class="w-auto md:w-full h-auto aspect-square flex justify-center items-center rounded-full md:rounded-3xl bg-transparent *:text-lg pointer-events-auto"
        @click="headerStore.showSideMenu = true"
        ><Menu :size="16"
      /></UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Calculator, ListTodo, FileText, Menu, Home } from "lucide-vue-next";

defineOptions({ ssr: false });

const headerStore = useHeaderStore();
const route = useRoute();

const buttonStyles =
  "w-full aspect-square flex justify-center items-center rounded-2xl bg-transparent *:text-lg pointer-events-auto";
const selectedButton =
  "w-full aspect-square flex justify-center items-center rounded-3xl bg-rose-500 *:text-lg pointer-events-none";
</script>

<style scoped>
.aspect-square {
  aspect-ratio: 1/1;
}
</style>

<template>
  <div
    class="w-full h-full p-1 flex flex-row md:flex-col justify-between items-center"
  >
    <div
      v-if="route.fullPath"
      class="w-full hidden md:flex flex-row md:flex-col justify-start items-center gap-2"
    >
      <RouterLink
        to="/"
        v-if="route.fullPath"
        :class="[route.fullPath === '/' ? selectedButton : buttonStyles]"
        ><Home :size="16" />
      </RouterLink>
      <!-- <RouterLink
        to="/expense-calculator"
        v-if="route.fullPath"
        :class="[
          route.fullPath === '/expense-calculator'
            ? selectedButton
            : buttonStyles,
        ]"
        ><Calculator :size="16" />
      </RouterLink> -->
      <RouterLink
        to="/to-do-list"
        v-if="userStore.enabledFeatures.includes('todo') && route.fullPath"
        :class="[
          route.fullPath === '/to-do-list' ? selectedButton : buttonStyles,
        ]"
      >
        <ListTodo :size="16" />
      </RouterLink>
      <!-- <RouterLink
        to="/docs-generator"
        v-if="route.fullPath"
        :class="[
          route.fullPath === '/docs-generator' ? selectedButton : buttonStyles,
        ]"
        ><FileText :size="16"
      /></RouterLink> -->

      <!-- <RouterLink
        to="/sketch-notes"
        v-if="route.fullPath"
        :class="[
          route.fullPath === '/sketch-notes' ? selectedButton : buttonStyles,
        ]"
        ><Signature :size="16"
      /></RouterLink> -->
    </div>

    <div
      class="w-full h-full md:h-fit flex justify-between items-center mt-0 md:mt-auto"
    >
      <div
        class="flex md:hidden items-center gap-x-3 pl-2 flex-grow-1 md:flex-grow-0"
      >
        <RouterLink
          to="/"
          class="!bg-transparent *:!bg-transparent dark:text-rose-200 hover:*:!text-rose-400 hover:*:!bg-transparent"
          v-if="route.fullPath !== '/'"
        >
          <Home :size="16"
        /></RouterLink>
        <ChevronRight
          :size="16"
          class="text-rose-950 dark:text-rose-50"
          v-if="route.fullPath !== '/'"
        />
        <h2 class="text-lg sm:text-xl font-heading">
          {{ headerStore.headerTitle }}
        </h2>
      </div>

      <Button
        class="w-auto md:w-full h-auto aspect-square flex justify-center items-center !border-none !bg-transparent !rounded-full md:!rounded-3xl *:text-lg pointer-events-auto"
        @click="headerStore.showSideMenu = true"
        severity="secondary"
        ><Menu :size="16"
      /></Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Calculator,
  ListTodo,
  FileText,
  Menu,
  Home,
  Signature,
  ArrowRight,
  ChevronRight,
} from "lucide-vue-next";

const userStore = useUserSetupStore();

// defineOptions({ ssr: false });
defineNuxtComponent({
  ssr: false,
});
const headerStore = useHeaderStore();
const route = useRoute();

const buttonStyles =
  "w-full aspect-square flex justify-center items-center rounded-3xl bg-transparent *:text-lg pointer-events-auto";
const selectedButton =
  "w-full aspect-square flex justify-center items-center rounded-3xl bg-rose-500 *:text-lg pointer-events-none";
</script>

<style scoped>
.aspect-square {
  aspect-ratio: 1/1;
}
</style>

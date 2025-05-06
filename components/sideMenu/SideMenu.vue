<template>
  <div>
    <Drawer
      v-model:visible="headerStore.showSideMenu"
      :dismissable="true"
      position="right"
      class="!w-full !max-w-[768px] h-full rounded-none md:rounded-l-3xl"
      header="Menu"
    >
      <div class="flex flex-col">
        <!-- <div class="flex justify-between items-start p-5">
          <h2 class="font-heading text-xl sm:text-2xl lg:text-3xl text-color5">
            Menu
          </h2>
          <Button
            icon="material-symbols:close-rounded"
            @click="headerStore.showSideMenu = false"
            class="self-end bg-transparent rounded-full"
            variant="outline"
          />
        </div> -->

        <div class="w-full px-5 pb-5">
          <div
            class="w-full flex flex-col rounded-3xl bg-rose-700 dark:bg-rose-900 p-4"
          >
            <RouterLink to="/" :class="buttonStyles">
              <Home :size="16" />
              <span>Home</span>
            </RouterLink>

            <div class="mx-2 my-1 p-0 max-w-full h-[1.5px] bg-black"></div>

            <!-- <RouterLink to="/expense-calculator" :class="buttonStyles">
              <Calculator :size="16" />
              <span>Expense Calculator</span>
            </RouterLink> -->

            <!-- <div class="mx-2 my-1 p-0 max-w-full h-[1.5px] bg-black"></div> -->

            <RouterLink to="/to-do-list" :class="buttonStyles">
              <ListTodo :size="16" />
              <span>To Do List</span>
            </RouterLink>

            <div class="mx-2 my-1 p-0 max-w-full h-[1.5px] bg-black"></div>

            <!-- <RouterLink to="/docs-generator" :class="buttonStyles">
              <FileText :size="16" />
              <span>Docs Generator</span>
            </RouterLink>

            <div class="mx-2 my-1 p-0 max-w-full h-[1.5px] bg-black"></div> -->

            <div :class="buttonStyles">
              <Moon :size="16" />
              <span>Dark Mode?</span>
              <ToggleSwitch
                v-model="darkMode"
                class="ml-auto"
                @change="toggleDarkMode"
              />
            </div>

            <div class="mx-2 my-1 p-0 max-w-full h-[1.5px] bg-black"></div>

            <Button
              @click="feedbackBtnHandle"
              :class="buttonStyles"
              class="text-white !border-none !flex !items-center !justify-start shadow-none"
            >
              <MessageCircle :size="16" />
              <span>Give Feedback</span>
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import Drawer from "primevue/drawer";
import {
  Home,
  Calculator,
  ListTodo,
  FileText,
  Moon,
  MessageCircle,
} from "lucide-vue-next";
import ToggleSwitch from "primevue/toggleswitch";

const darkMode = ref(true);

const headerStore = useHeaderStore();

const buttonStyles =
  "!px-2 !py-4 !bg-transparent !text-white flex items-center !gap-x-3 !rounded-xl *:text-lg font-normal";
// const { isSideMenuVisible, closeSideMenu } = useSideMenu();

const feedbackBtnHandle = () => {
  headerStore.showFeedback = true;
  headerStore.showSideMenu = false;
};

const toggleDarkMode = () => {
  // Get the current theme by checking the 'dark-theme' class on the html element

  console.log("darkMode", darkMode.value);
  const currentTheme = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";

  // Toggle the theme on the 'html' element
  if (currentTheme === "light") {
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  }
};
</script>

<style scoped></style>

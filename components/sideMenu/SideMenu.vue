<template>
  <div>
    <USlideover
      :model-value="headerStore.showSideMenu"
      :appear="true"
      side="right"
    >
      <div class="flex flex-col">
        <div class="flex justify-between items-start p-5">
          <h2 class="font-heading text-xl sm:text-2xl lg:text-3xl text-color5">
            Menu
          </h2>
          <UButton
            icon="material-symbols:close-rounded"
            @click="headerStore.showSideMenu = false"
            class="self-end bg-transparent rounded-full"
            variant="outline"
          />
        </div>
        <div class="w-full px-5 pb-5">
          <div class="w-full flex flex-col rounded-3xl bg-rose-900 p-4">
            <RouterLink to="/" :class="buttonStyles"
              ><UIcon name="material-symbols:house-rounded"></UIcon
              ><span>Home</span></RouterLink
            >
            <!-- <UDivider class="w-full mx-2 my-1 p-0 h-[1.5px]" /> -->
            <div class="mx-2 my-1 p-0 max-w-full h-[1.5px] bg-black"></div>

            <RouterLink to="/expense-calculator" :class="buttonStyles"
              ><UIcon name="material-symbols:calculate-rounded"></UIcon
              ><span>Expense Calculator</span></RouterLink
            >
            <!-- <UDivider class="w-full mx-2 my-1 p-0 h-[1.5px]" /> -->
            <div class="mx-2 my-1 p-0 max-w-full h-[1.5px] bg-black"></div>

            <RouterLink to="/to-do-list" :class="buttonStyles"
              ><UIcon
                name="material-symbols:format-list-bulleted-add-rounded"
              ></UIcon
              ><span>To Do List</span></RouterLink
            >

            <div class="mx-2 my-1 p-0 max-w-full h-[1.5px] bg-black"></div>

            <RouterLink to="/docs-generator" :class="buttonStyles"
              ><UIcon name="material-symbols:docs-rounded"></UIcon
              ><span>Docs Generator</span></RouterLink
            >

            <!-- <UDivider class="max-w-full mx-2 my-1 p-0 h-[1.5px]" /> -->
            <div class="mx-2 my-1 p-0 max-w-full h-[1.5px] bg-black"></div>

            <div :class="buttonStyles">
              <UIcon name="material-symbols:dark-mode-rounded"></UIcon
              ><span>Dark Mode?</span>
              <UToggle
                v-model="darkMode"
                class="ml-auto"
                @change="toggleDarkMode"
              />
            </div>

            <div class="mx-2 my-1 p-0 max-w-full h-[1.5px] bg-black"></div>
            <UButton
              @click="feedbackBtnHandle"
              :class="buttonStyles"
              class="text-white shadow-none"
              ><UIcon name="material-symbols:chat-bubble-rounded"></UIcon
              ><span>Give Feedback</span></UButton
            >
          </div>
        </div>
      </div>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
const darkMode = ref(true);

const headerStore = useHeaderStore();

const buttonStyles =
  "px-2 py-4 !bg-transparent !text-white flex items-center gap-x-3 rounded-xl *:text-lg font-normal";
// const { isSideMenuVisible, closeSideMenu } = useSideMenu();

const feedbackBtnHandle = () => {
  headerStore.showFeedback = true;
  headerStore.showSideMenu = false;
};

const toggleDarkMode = () => {
  // Get the current theme by checking the 'dark-theme' class on the html element
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

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

          <!-- <RouterLink to="/sketch-notes" :class="buttonStyles">
              <Signature :size="16" />
              <span>Sketch Notes</span>
            </RouterLink>

            <div class="mx-2 my-1 p-0 max-w-full h-[1.5px] bg-black"></div> -->

          <Panel
            toggleable
            :collapsed="isKeyboardPanelCollapsed"
            :class="buttonStyles"
            class="!border-none *:!p-0 !bg-transparent !text-white font-content"
          >
            <template #header>
              <div
                class="flex items-center w-full gap-x-3 cursor-pointer"
                @click="toggleKeyboardPanel"
              >
                <Keyboard :size="16" />
                <h3 class="text-lg font-medium text-white">
                  Keyboard Shortcuts
                </h3>
              </div>
            </template>

            <template #toggleicon><div></div></template>
            <div class="flex flex-col gap-2 py-2">
              <ul class="flex flex-col gap-1 !list-disc list-inside">
                <li class="flex items-center gap-x-3 !list-disc">
                  Press <kbd>Ctrl</kbd> + <kbd>H</kbd> for "Home" section
                </li>
                <li class="flex items-center gap-x-3 !list-disc">
                  Press <kbd>Ctrl</kbd> + <kbd>T</kbd> for "To-Do List" section
                </li>
                <li class="flex items-center gap-x-3 !list-disc">
                  Press <kbd>Ctrl</kbd> + <kbd>F</kbd> for "Feedback" section
                </li>
                <li class="flex items-center gap-x-3 !list-disc">
                  Press <kbd>Ctrl</kbd> + <kbd>M</kbd> for "Menu & others"
                </li>
              </ul>
            </div>
          </Panel>

          <div class="mx-2 my-1 p-0 max-w-full h-[1.5px] bg-black"></div>

          <div :class="buttonStyles">
            <Palette :size="16" />
            <span>Theme</span>
            <Select
              :modelValue="colorMode.preference"
              @update:modelValue="(val) => (colorMode.preference = val)"
              :options="[
                { label: 'System', value: 'system' },
                { label: 'Dark', value: 'dark' },
                { label: 'Light', value: 'light' },
              ]"
              optionLabel="label"
              optionValue="value"
              class="ml-auto w-auto !text-sm !rounded-xl"
            />
          </div>

          <div class="mx-2 my-1 p-0 max-w-full h-[1.5px] bg-black"></div>

          <Panel
            toggleable
            :collapsed="isPanelCollapsed"
            :class="buttonStyles"
            class="!border-none *:!p-0 !bg-transparent !text-white font-content"
          >
            <template #header>
              <div
                class="flex items-center w-full gap-x-3 cursor-pointer"
                @click="togglePanel"
              >
                <FolderX :size="16" />
                <h3 class="text-lg font-medium text-white">
                  Manage Application Storage
                </h3>
              </div>
            </template>

            <template #toggleicon><div></div></template>
            <div class="flex flex-col gap-2 py-2">
              <div class="flex items-center gap-x-3">
                <p class="flex flex-grow text-sm xl:text-base">
                  Clear entire application data?
                </p>
                <Button
                  label="Delete Entire App Data"
                  icon="pi pi-times"
                  severity="danger"
                  class="!rounded-xl flex-shrink-0"
                  size="small"
                  @click="deleteEntireDB"
                />
              </div>
              <div class="mx-0 my-1 p-0 max-w-full h-[1.5px] bg-black"></div>
              <div class="flex items-center gap-x-3">
                <p class="flex flex-grow text-sm xl:text-base">
                  Clear Todos data only?
                </p>
                <Button
                  label="Clear To-Do Store"
                  icon="pi pi-trash"
                  severity="secondary"
                  class="!rounded-xl flex-shrink-0"
                  size="small"
                  @click="clearStoreData"
                />
              </div>
            </div>
          </Panel>

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
  Signature,
  Palette,
  FolderX,
  Keyboard,
} from "lucide-vue-next";
import Select from "primevue/select";
import { onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const todoStore = useTodoStore();
const toast = useToast();
const headerStore = useHeaderStore();
const isPanelCollapsed = ref(true);
const isKeyboardPanelCollapsed = ref(true);

const buttonStyles =
  "!px-2 !py-4 !bg-transparent !text-white flex items-center !gap-x-3 !rounded-xl *:text-lg font-normal";

const feedbackBtnHandle = () => {
  headerStore.showFeedback = true;
  headerStore.showSideMenu = false;
};

// Toggle functions
const togglePanel = () => {
  isPanelCollapsed.value = !isPanelCollapsed.value;
};

const toggleKeyboardPanel = () => {
  isKeyboardPanelCollapsed.value = !isKeyboardPanelCollapsed.value;
};

const colorMode = useColorMode();

async function clearStoreData() {
  await todoStore.clearStoreData();
  toast.add({
    severity: "info",
    summary: "Store Cleared",
    detail: "All To-Do items deleted",
    life: 2000,
  });
}

async function deleteEntireDB() {
  await todoStore.nukeDatabase();
  toast.add({
    severity: "warn",
    summary: "Database Deleted",
    detail: "All App Data removed",
    life: 2000,
  });
}

function handleGlobalKeydown(event: KeyboardEvent) {
  if (event.shiftKey) {
    const key = event.key.toLowerCase();
    switch (key) {
      case "m":
        event.preventDefault();
        headerStore.showSideMenu = !headerStore.showSideMenu;
        break;
      case "h":
        event.preventDefault();
        router.push("/");
        headerStore.showSideMenu = false;
        break;
      case "t":
        event.preventDefault();
        router.push("/to-do-list");
        headerStore.showSideMenu = false;
        break;
      case "f":
        event.preventDefault();
        feedbackBtnHandle();
        break;
    }
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleGlobalKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleGlobalKeydown);
});
</script>

<style scoped>
kbd {
  padding-inline: 0.5rem;
  border-radius: 0.5rem;
  font-size: smaller;
  vertical-align: middle;
  background-color: var(--color-rose-950);
  color: var(--color-rose-100);
}
</style>

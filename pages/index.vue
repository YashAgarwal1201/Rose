<template>
  <div
    class="w-full max-w-[1440px] h-full flex flex-col justify-start items-center gap-y-5 px-2 md:px-4 py-2 overflow-y-auto font-content"
  >
    <div class="w-full flex-shrink-0">
      <HomepageDateAndTime />
    </div>

    <div class="w-full flex flex-col gap-y-3 sm:gap-y-4 flex-grow-1">
      <!-- <h2 class="font-heading text-xl md:text-2xl">This year at a glance</h2> -->
      <div class="w-full flex flex-col gap-y-5 sm:gap-y-6">
        <div class="w-full flex flex-nowrap items-center gap-3 overflow-x-auto">
          <div
            class="w-full max-w-80 flex-shrink-0 flex flex-col gap-y-3 rounded-2xl bg-rose-200 dark:bg-rose-900 text-rose-950 dark:text-rose-100 p-4"
          >
            <h4 class="font-heading text-3xl text-center">
              {{ todoStore.listOfTodos?.length ?? 0 }}
            </h4>
            <p class="text-base sm:text-lg font-content text-center">
              Todo lists created
            </p>
          </div>

          <!-- uncomment once document generator is ready
          <div class="w-full max-w-80 flex-shrink-0 flex flex-col gap-y-3 rounded-xl bg-rose-200 dark:bg-rose-900 text-rose-950 dark:text-rose-100 p-4">
            <h4 class="font-heading text-3xl text-center">{{ recentListsInCurrentMonth.length ?? 0 }}</h4>
            <p class="text-base sm:text-lg font-content text-center">Documentes created</p>
          </div> -->
        </div>

        <!-- <div class="w-full flex flex-col gap-y-3 sm:gap-y-4">
          <h3 class="font-heading text-lg md:text-xl">
            To Do Lists added this month
          </h3>
          <div
            v-if="recentListsInCurrentMonth.length > 0"
            class="w-full flex flex-row flex-nowrap gap-x-2 sm:gap-x-3 pr-4 pl-2 pb-1 overflow-y-auto"
          >
            <div
              v-for="(listItem, index) in recentListsInCurrentMonth"
              :key="index"
              class="w-60 h-fit flex flex-row items-start gap-x-3 p-2 md:p-3 rounded-lg sm:rounded-xl shadow-md bg-rose-800 font-content"
            >
              <div class="mt-1 flex-shrink-0">
                <Checkbox :value="listItem.isDone" />
              </div>
              <div class="flex-grow">
                <h3
                  class="w-fit text-base sm:text-lg 2xl:text-xl underline cursor-pointer line-clamp-1"
                  @click="navigateToList(listItem.id)"
                >
                  {{ listItem.title }}
                </h3>
                <span class="text-xs sm:text-sm text-rose-200">{{
                  formatTimestamp(listItem.timestamp)
                }}</span>
              </div>
              <div class="flex-shrink-0">
                <Button
                  class="text-white shadow-none rounded-2xl"
                  :text="true"
                  title="Delete to do list"
                  @click="confirmDelete(listItem)"
                >
                  <Trash :size="16" />
                </Button>
              </div>
            </div>
          </div>
          <div
            v-else
            class="h-[100px] pl-2 flex flex-col justify-center items-center gap-y-2"
          >
            <p class="italic text-xs md:text-sm">
              You have no todo list to show
            </p>
            <Button
              class="text-white shadow-none rounded-full px-4 py-2"
              title="To do list"
              @click="navigateToNewList"
            >
              <FileEdit :size="16" />
              <span>New ToDo List</span>
            </Button>
          </div>
        </div> -->
      </div>

      <div class="w-full flex flex-col sm:flex-row gap-5">
        <div
          class="max-w-full min-h-72 flex flex-col gap-y-3 rounded-xl border border-rose-200 dark:border-rose-900 p-4 font-content flex-grow-1 flex-shrink-0"
        >
          <div
            class="mb-4 w-full flex flex-col sm:flex-row flex-wrap justify-between items-center gap-x-10 flex-shrink-0"
          >
            <h3 class="font-heading text-lg md:text-xl lg:text-2xl mb-2">
              Recent To-Do Lists
            </h3>

            <SelectButton
              v-model="selectedFilter"
              :options="filterOptions"
              optionLabel="label"
              optionValue="value"
              class="mb-4"
            />
          </div>

          <!-- <div
          v-if="filteredLists.length > 0"
          class="w-full flex flex-col gap-4 flex-grow-1 overflow-y-auto"
        >
          <div
            v-for="(listItem, index) in filteredLists"
            :key="index"
            class="w-60 flex items-start gap-x-3 p-3 rounded-xl shadow bg-rose-800"
          >
            <Checkbox :value="listItem.isDone" />
            <div class="flex-grow">
              <h3
                class="text-base font-heading underline cursor-pointer line-clamp-1"
                @click="navigateToList(listItem.id)"
              >
                {{ listItem.title }}
              </h3>
              <p class="text-xs text-rose-200">
                {{ formatTimestamp(listItem.timestamp) }}
              </p>
            </div>
            <Button
              class="text-white shadow-none rounded-2xl"
              :text="true"
              title="Delete to-do list"
              @click="confirmDelete(listItem)"
            >
              <Trash :size="16" />
            </Button>
          </div>
        </div> -->

          <DataTable
            v-if="filteredLists.length > 0"
            :value="visibleRecentLists"
            tableStyle="min-width: 100%"
            stripedRows
            responsiveLayout="scroll"
          >
            <Column header="Completed">
              <template #body="{ data }">
                <Checkbox :binary="true" :modelValue="data.isDone" disabled />
              </template>
            </Column>

            <Column field="title" header="Title">
              <template #body="{ data }">
                <span
                  class="cursor-pointer underline"
                  @click="navigateToList(data.id)"
                >
                  {{ data.title }}
                </span>
              </template>
            </Column>

            <Column header="Created On">
              <template #body="{ data }">
                {{ formatTimestamp(data.timestamp) }}
              </template>
            </Column>

            <Column header="Actions" style="width: 4rem">
              <template #body="{ data }">
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  @click="confirmDelete(data)"
                />
              </template>
            </Column>
          </DataTable>

          <div v-else class="text-center italic text-sm sm:text-base m-auto">
            No to-do lists found for
            {{
              selectedFilter === "week"
                ? "this week"
                : selectedFilter === "month"
                ? "this month"
                : "this year"
            }}.
          </div>

          <div v-if="showViewAll" class="mt-4 text-center">
            <Button
              label="View All"
              icon="pi pi-eye"
              class="rounded-full px-4 py-2"
              @click="router.push('/to-do-list/')"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- <div class="p-4">
      <h1 class="text-xl font-bold mb-4">App B (Vue 3)</h1>
      <div class="p-4 border rounded bg-gray-100">
        Received message: <strong>{{ message || "No message yet." }}</strong>
      </div>
    </div> -->

    <ConfirmDialog></ConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { FileEdit, Receipt, Trash } from "lucide-vue-next";
import Checkbox from "primevue/checkbox";
import { v4 as uuidv4 } from "uuid";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";
import Card from "primevue/card";
import SelectButton from "primevue/selectbutton";

import { ref, computed } from "vue";

type FilterOption = "week" | "month" | "year";

const confirm = useConfirm();
const router = useRouter();
const todoStore = useTodoStore();
const userStore = useUserSetupStore();
const transactionStore = useExpenseCalculatorStore();

definePageMeta({
  title: "Project Rose - Home Page",
});

const selectedFilter = ref<FilterOption>("week");

const filterOptions = [
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "year" },
];

const MAX_VISIBLE_ROWS = 5;

const filteredLists = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lists = todoStore.activeLists;

  switch (selectedFilter.value) {
    case "week": {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      return lists.filter((list) => new Date(list.timestamp) >= sevenDaysAgo);
    }

    case "month": {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return lists.filter((list) => new Date(list.timestamp) >= startOfMonth);
    }

    case "year": {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      return lists.filter((list) => new Date(list.timestamp) >= startOfYear);
    }

    default: {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      return lists.filter((list) => new Date(list.timestamp) >= startOfYear);
    }
  }
});

const visibleRecentLists = computed(() => {
  return filteredLists.value.slice(0, MAX_VISIBLE_ROWS);
});

const showViewAll = computed(() => {
  return filteredLists.value.length > MAX_VISIBLE_ROWS;
});

// import { ref, onMounted, onBeforeUnmount } from "vue";

// const message = ref("");

// function handleMessage(event: any) {
//   if (event.origin !== "http://localhost:4500") return; // Validate origin
//   const { type, payload } = event.data;
//   if (type === "UPDATE_TEXT") {
//     message.value = payload;
//   }
// }

// onMounted(() => {
//   window.addEventListener("message", handleMessage);
// });

// onBeforeUnmount(() => {
//   window.removeEventListener("message", handleMessage);
// });

// Format timestamp
const formatTimestamp = (timestamp: string | number | Date) => {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Navigation function for new list
const navigateToNewList = () => {
  const newListId = uuidv4(); // Generate a new UUID
  router.push(`/to-do-list/${newListId}`);
};

// Navigation function
const navigateToList = (listId: string) => {
  router.push(`/to-do-list/${listId}`);
};

const getDateBefore = (days: number) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
};

const recentListsWeek = computed(() => {
  const sevenDaysAgo = getDateBefore(7);
  return todoStore.activeLists.filter((list) => {
    const listDate = new Date(list.timestamp);
    return listDate >= sevenDaysAgo;
  });
});

const recentListsInCurrentMonth = computed(() => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  return todoStore.activeLists.filter((list) => {
    const listDate = new Date(list.timestamp);
    return listDate >= startOfMonth;
  });
});

// Confirmation dialog for delete
const confirmDelete = (listItem: any) => {
  confirm.require({
    message: `Are you sure you want to delete "${listItem.title}"?`,
    header: "Confirm Deletion",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    accept: () => {
      todoStore.deleteTodoList(listItem.id);
    },
    reject: () => {
      // Optional: You can add a notification here if you want
    },
  });
};
</script>

<style scoped></style>

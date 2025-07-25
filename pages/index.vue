<template>
  <div
    class="w-full max-w-[1440px] h-full flex flex-col justify-start items-center gap-y-5 px-3 md:px-4 py-2 overflow-y-auto font-content"
  >
    <div class="w-full flex-shrink-0">
      <HomepageDateAndTime />
    </div>

    <div class="w-full flex flex-col gap-y-5 sm:gap-y-6 flex-grow-1">
      <!-- Data stats -->
      <div class="w-full flex flex-col gap-y-5 sm:gap-y-6">
        <div class="w-full flex flex-nowrap items-center gap-3 overflow-x-auto">
          <div
            class="w-full max-w-3xs aspect-video flex-shrink-0 flex flex-col justify-center items-center gap-y-3 rounded-2xl bg-rose-200 dark:bg-rose-900 text-rose-950 dark:text-rose-100 p-4"
          >
            <h4 class="font-heading text-3xl text-center">
              {{ todoStore.listOfTodos?.length ?? 0 }}
            </h4>
            <p class="text-base sm:text-lg font-content text-center">
              Todo lists created
            </p>
          </div>

          <!-- uncomment once sketch notes is ready -->
          <!-- <div
            class="w-full max-w-80 flex-shrink-0 flex flex-col gap-y-3 rounded-xl bg-rose-200 dark:bg-rose-900 text-rose-950 dark:text-rose-100 p-4"
          >
            <h4 class="font-heading text-3xl text-center">
              {{ todoStore.listOfTodos.length ?? 0 }}
            </h4>
            <p class="text-base sm:text-lg font-content text-center">
              Sketch notes created
            </p>
          </div> -->
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="flex md:hidden flex-col gap-y-4">
        <h2 class="font-heading text-xl sm:text-2xl">Quick Actions</h2>
        <div class="w-full flex items-center overflow-x-auto gap-x-3">
          <RouterLink
            to=""
            @click.prevent="navigateToNewList"
            class="w-3xs aspect-video flex flex-col justify-center items-center gap-y-2 rounded-2xl bg-rose-200 dark:bg-rose-900 text-rose-950 dark:text-rose-100 p-4 flex-shrink-0"
          >
            <ListTodo :size="24" />
            <span class="text-base sm:text-lg">Create a new todo list</span>
          </RouterLink>

          <RouterLink
            to="/sketch-notes"
            class="w-3xs aspect-video flex flex-col justify-center items-center gap-y-2 rounded-2xl bg-rose-200 dark:bg-rose-900 text-rose-950 dark:text-rose-100 p-4 flex-shrink-0"
          >
            <Signature :size="24" />
            <span class="text-base sm:text-lg">Create a sketch note</span>
          </RouterLink>

          <RouterLink
            to="/docs-generator"
            class="w-3xs aspect-video flex flex-col justify-center items-center gap-y-2 rounded-2xl bg-rose-200 dark:bg-rose-900 text-rose-950 dark:text-rose-100 p-4 flex-shrink-0"
          >
            <FileText :size="24" />
            <span class="text-base sm:text-lg">Create a new document</span>
          </RouterLink>
        </div>
      </div>

      <!-- Recent data -->
      <div class="w-full flex flex-col sm:flex-row gap-5">
        <div
          class="max-w-full min-h-72 flex flex-col gap-y-3 rounded-xl border border-rose-200 dark:border-rose-900 p-4 font-content flex-grow-1 flex-shrink-0"
        >
          <div
            class="mb-4 w-full flex flex-col sm:flex-row flex-wrap justify-between sm:items-center gap-x-10 flex-shrink-0"
          >
            <h3 class="font-heading text-lg md:text-xl lg:text-2xl mb-2">
              Recent To-Do Lists
            </h3>

            <SelectButton
              v-model="selectedFilter"
              :options="filterOptions"
              optionLabel="label"
              optionValue="value"
              class="mb-4 *:!text-xs sm:*:!text-sm md:*:!text-base"
            />
          </div>

          <DataTable
            v-if="filteredLists.length > 0"
            :value="visibleRecentLists"
            tableStyle="min-width: 100%"
            stripedRows
            responsiveLayout="scroll"
          >
            <Column header="Completed" header-class="font-heading">
              <template #body="{ data }">
                <Checkbox
                  :binary="true"
                  v-model="data.isDone"
                  @change="onListCompletionToggle(data)"
                />
              </template>
            </Column>

            <Column field="title" header="Title" header-class="font-heading">
              <template #body="{ data }">
                <span
                  class="cursor-pointer underline"
                  @click="navigateToList(data.id)"
                >
                  {{ data.title }}
                </span>
              </template>
            </Column>

            <Column header="Created On" header-class="font-heading">
              <template #body="{ data }">
                {{ formatTimestamp(data.timestamp) }}
              </template>
            </Column>

            <Column
              header="Actions"
              style="width: 4rem"
              header-class="font-heading text-center"
            >
              <template #body="{ data }">
                <div class="flex items-center gap-x-2">
                  <Button
                    severity="danger"
                    text
                    @click="confirmDelete(data)"
                    class="!rounded-xl"
                    ><Trash :size="16" />
                  </Button>
                  <Button
                    text
                    @click="navigateToList(data.id)"
                    class="!rounded-xl"
                    ><Eye :size="16" />
                  </Button>
                </div>
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
              class="!rounded-xl px-4 py-2 flex justify-center items-center gap-x-2"
              @click="router.push('/to-do-list/')"
              ><View :size="16" /><span>View all</span>
            </Button>
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialog></ConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import {
  Eye,
  FileEdit,
  FileText,
  ListTodo,
  Receipt,
  Signature,
  Trash,
  View,
} from "lucide-vue-next";
import Checkbox from "primevue/checkbox";
import { v4 as uuidv4 } from "uuid";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";

import SelectButton from "primevue/selectbutton";

import { ref, computed } from "vue";
import type { TodoList } from "~/types/typesAndInterfaces";

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

  const lists = todoStore.listOfTodos;

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
  return todoStore.listOfTodos?.filter((list) => {
    const listDate = new Date(list.timestamp);
    return listDate >= sevenDaysAgo;
  });
});

const recentListsInCurrentMonth = computed(() => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  return todoStore.listOfTodos?.filter((list) => {
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

const onListCompletionToggle = async (listItem: TodoList) => {
  await todoStore.updateTodoList(listItem.id, { isDone: listItem.isDone });
};
</script>

<style scoped></style>

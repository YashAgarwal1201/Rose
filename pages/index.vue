<template>
  <div
    class="w-full max-w-[1440px] h-full flex flex-col justify-start items-center gap-y-5 p-2"
  >
    <div class="w-full h-[200px]">
      <HomepageDateAndTime />
    </div>

    <div class="w-full flex flex-col gap-y-3 sm:gap-y-4">
      <h2 class="font-heading text-xl md:text-2xl">Recent ToDos</h2>
      <div
        v-if="recentListsWeek.length > 0"
        class="w-full flex flex-row flex-nowrap gap-x-2 sm:gap-x-3 pr-4 pl-2 pb-1 overflow-y-auto"
      >
        <div
          v-for="(listItem, index) in recentListsWeek"
          :key="index"
          class="w-[200px] flex-shrink-0 flex flex-row gap-x-3 p-3 md:p-4 rounded-md shadow-md bg-rose-800"
        >
          <div class="mt-1">
            <UCheckbox :value="false" />
          </div>
          <div>
            <h3
              class="text-base sm:text-lg 2xl:text-xl font-heading cursor-pointer underline text-rose-50"
              @click="navigateToList(listItem.id)"
            >
              {{ listItem.title }}
            </h3>
            <span class="text-xs sm:text-sm text-rose-200">{{
              formatTimestamp(listItem.timestamp)
            }}</span>
          </div>
        </div>
      </div>
      <div
        v-else
        class="h-[100px] pl-2 flex flex-col justify-center items-center gap-y-2"
      >
        <p class="italic text-xs md:text-sm">You have no todo list to show</p>
        <UButton
          class="text-white shadow-none rounded-full px-4 py-2"
          title="To do list"
          @click="navigateToNewList"
        >
          <UIcon name="material-symbols:edit-document-rounded" size="20px" />
          <span>New ToDo List</span>
        </UButton>
      </div>
    </div>

    <div class="w-full flex flex-col gap-y-3 sm:gap-y-4 mt-5 md:mt-7">
      <h2 class="font-heading text-xl md:text-2xl">Recent Transactions</h2>
      <div
        v-if="transactionStore?.history?.length > 0"
        class="w-full flex flex-row flex-nowrap gap-x-2 sm:gap-x-3 pr-4 pl-2 pb-1 overflow-y-auto"
      >
        <div
          v-for="transaction in transactionStore.history"
          class="w-[200px] flex-shrink-0 flex flex-row gap-x-3 p-3 md:p-4 rounded-md shadow-md bg-rose-800 cursor-pointer scrollbar-hide"
        >
          <div>
            <h3
              class="text-base sm:text-lg 2xl:text-xl font-heading text-rose-50"
            >
              {{ transaction.name }}
            </h3>
            <span class="text-xs sm:text-sm text-rose-100">{{
              formatTimestamp(transaction?.date)
            }}</span>
          </div>
        </div>
      </div>
      <div
        v-else
        class="h-[100px] pl-2 flex flex-col justify-center items-center gap-y-2"
      >
        <p class="italic text-xs md:text-sm">You have no transaction to show</p>
        <UButton
          class="text-white shadow-none rounded-full px-4 py-2"
          title="To do list"
          to="/expense-calculator"
        >
          <UIcon name="material-symbols:receipt-rounded" size="20px" />
          <span>Add Transaction</span>
        </UButton>
      </div>
    </div>

    <div class="w-full flex flex-col gap-y-3 sm:gap-y-4 mt-5 md:mt-7">
      <h2 class="font-heading text-xl md:text-2xl">This Month at a glance</h2>
      <div class="w-full flex flex-col gap-y-2 sm:gap-y-3">
        <div
          class="h-[100px] pl-2 flex flex-col justify-center items-center gap-y-2"
        >
          <p class="italic text-xs md:text-sm">
            You have no transaction to show
          </p>
          <UButton
            class="text-white shadow-none rounded-full px-4 py-2"
            title="To do list"
            to="/expense-calculator"
          >
            <UIcon name="material-symbols:receipt-rounded" size="20px" />
            <span>Add Transaction</span>
          </UButton>
        </div>

        <div class="w-full flex flex-col gap-y-3 sm:gap-y-4">
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
              class="w-[200px] flex-shrink-0 flex flex-row gap-x-3 p-3 md:p-4 rounded-md shadow-md bg-rose-900"
            >
              <div class="mt-1">
                <UCheckbox :value="false" />
              </div>
              <div>
                <h3
                  class="text-base sm:text-lg 2xl:text-xl font-heading cursor-pointer underline text-rose-50"
                  @click="navigateToList(listItem.id)"
                >
                  {{ listItem.title }}
                </h3>
                <span class="text-xs sm:text-sm text-rose-200">{{
                  formatTimestamp(listItem.timestamp)
                }}</span>
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
            <UButton
              class="text-white shadow-none rounded-full px-4 py-2"
              title="To do list"
              @click="navigateToNewList"
            >
              <UIcon
                name="material-symbols:edit-document-rounded"
                size="20px"
              />
              <span>New ToDo List</span>
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { v4 as uuidv4 } from "uuid";

const router = useRouter();
const todoStore = useTodoStore();
const transactionStore = useExpenseCalculatorStore();

definePageMeta({
  title: "Project Rose - Home Page",
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
</script>

<style scoped></style>

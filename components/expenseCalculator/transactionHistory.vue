<script setup lang="ts">
import { defineProps, ref, computed } from "vue";
import {
  useExpenseCalculatorStore,
  type Transaction,
} from "@/stores/expenseCalculatorStore";

const store = useExpenseCalculatorStore();
const value = ref("All");
const options = ref(["All", "Incomes", "Expenses"]);
const page = ref(1);
const pageCount = 5;

const rows = computed(() => {
  return store.history.slice(
    (page.value - 1) * pageCount,
    page.value * pageCount
  );
});

// const emit = defineEmits(["delete-transaction", "edit-transaction"]);

const props = defineProps<{
  // history: { name: string; value: number; id: string }[];
  title: string;
}>();

const { title } = props;

const green = "bg-green-100 border-green-500";
const red = "bg-red-100 border-red-500";

const filteredHistory = computed(() => {
  if (value.value === "Incomes") {
    return store.history.filter((item) => item.value > 0);
  } else if (value.value === "Expenses") {
    return store.history.filter((item) => item.value < 0);
  }
  return store.history;
});

const deleteTransaction = (transactionVal: Transaction) => {
  // emit("delete-transaction", transactionVal);

  store.handleDeleteTransaction(transactionVal);
};

const editTransaction = (transactionVal: Transaction) => {
  console.log(transactionVal);
  // emit("edit-transaction", transactionVal);
  store.handleEditTransaction(transactionVal);
};

const visibleTransactions = computed(() => {
  const filtered = filteredHistory.value;
  return filtered.slice(0, 5); // Show only the first 5 transactions
});
</script>

<template>
  <div class="w-full h-full">
    <h3
      v-if="title"
      class="font-medium text-xl md:text-2xl pb-2 border-b sm:border-b-2 flex items-center"
    >
      <UIcon name="material-symbols:history-2-rounded" class="mr-3"></UIcon
      >{{ title }}
    </h3>

    <!-- <div
      v-if="store.history.length > 0"
      class="w-full flex justify-end py-2 md:py-3"
    >
      <USelect
        :disabled="store.history.length < 1"
        v-model="value"
        :options="options"
      />
    </div> -->

    <div
      v-if="visibleTransactions.length >= 0"
      class="flex flex-col gap-y-2 py-4"
    >
      <!-- <div
        v-for="(historyItem, index) in visibleTransactions"
        :key="index"
        class="p-3 flex justify-between items-center text-base md:text-lg text-black rounded-xl shadow-md border-r-4"
        :class="historyItem.value > 0 ? green : red"
      >
        <span class="font-medium">{{ historyItem.name }}</span>
        <div class="flex items-center gap-x-2">
          <span
            :class="historyItem.value > 0 ? 'text-green-800' : 'text-red-800'"
            >$ {{ historyItem.value }}</span
          >
          <UButton
            icon="material-symbols:delete-forever-rounded"
            @click="deleteTransaction(historyItem)"
            class="rounded-full"
            color="red"
          />
          <UButton
            icon="material-symbols:edit-rounded"
            @click="editTransaction(historyItem)"
            class="rounded-full"
          />
        </div>
      </div> -->

      <UTable
        :rows="rows"
        :empty-state="{
          icon: 'i-heroicons-circle-stack-20-solid',
          label: 'No items.',
        }"
        :columns="[
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Name', sortable: store.history.length > 2 },
          { key: 'value', label: 'Amount', sortable: store.history.length > 2 },
          {
            key: 'category',
            label: 'Category',
            sortable: store.history.length > 2,
          },
          { key: 'type', label: 'Type', sortable: store.history.length > 2 },
          { key: 'date', label: 'Date', sortable: store.history.length > 2 },
        ]"
      ></UTable>
      <div
        class="flex justify-between items-center px-3 py-3.5 border-t border-gray-200 dark:border-gray-700"
      >
        <div>
          <UButton
            v-if="store.history?.length > 5"
            label="Show more"
            rounded
            icon="material-symbols:format-list-bulleted-rounded"
            @click="store.showTransactionsHistoryDialog = true"
          />
        </div>
        <UPagination
          v-model="page"
          :page-count="pageCount"
          :total="store.history.length"
        />
      </div>
    </div>
    <div v-else class="flex flex-col gap-y-2 py-4">
      <p class="italic">No transaction history to show</p>
    </div>
  </div>
</template>

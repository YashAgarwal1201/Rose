<script setup lang="ts">
import { defineProps, ref, computed } from "vue";
import {
  useExpenseCalculatorStore,
  type Transaction,
} from "@/stores/expenseCalculatorStore";

const store = useExpenseCalculatorStore();
const value = ref("All");
const options = ref(["All", "Incomes", "Expenses"]);

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

    <div
      v-if="store.history.length > 0"
      class="w-full flex justify-end py-2 md:py-3"
    >
      <USelect
        :disabled="store.history.length < 1"
        v-model="value"
        :options="options"
      />
    </div>

    <div
      v-if="visibleTransactions.length > 0"
      class="flex flex-col gap-y-2 py-4"
    >
      <div
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
            rounded
            icon="pi pi-trash"
            @click="deleteTransaction(historyItem)"
          />
          <UButton
            rounded
            icon="pi pi-pencil"
            @click="editTransaction(historyItem)"
          />
        </div>
      </div>

      <div v-if="filteredHistory?.length > 5" class="mt-5">
        <UButton
          label="Show more"
          rounded
          icon="pi pi-list"
          @click="store.showTransactionsHistoryDialog = true"
        />
      </div>
    </div>
    <div v-else class="flex flex-col gap-y-2 py-4">
      <p class="italic">No transaction history to show</p>
    </div>
  </div>
</template>

<template>
  <div class="w-full h-full p-2 md:p-4 flex flex-col gap-y-10 lg:gap-y-14">
    <h1 class="hidden md:block text-3xl md:text-4xl font-heading">
      Expense Calculator
    </h1>

    <div
      class="flex flex-col lg:flex-row items-center justify-between gap-y-10"
    >
      <h2 class="hidden lg:block text-xl sm:text-2xl md:text-3xl font-medium">
        Your Balance:
        <span
          :class="store.balance > 0 ? 'text-green-500' : 'text-red-500'"
          class="ml-5"
          >$ {{ store.balance }}</span
        >
      </h2>
      <div class="flex lg:hidden flex-col items-center justify-center">
        <h3 class="text-center text-xl sm:text-2xl">Your Balance</h3>
        <h2
          :class="store.balance > 0 ? 'text-green-500' : 'text-red-500'"
          class="text-center ml-5 text-2xl sm:text-3xl"
        >
          $ {{ store.balance }}
        </h2>
      </div>

      <UCard
        class="w-[97%] sm:w-[400px] bg-rose-900 text-rose-50 rounded-3xl mx-0 lg:mx-auto"
        ><div class="w-full flex justify-center rounded-3xl">
          <div class="w-1/2 flex flex-col items-center">
            <span class="text-xl md:text-2xl font-heading">Income</span>
            <span class="text-lg md:text-xl">$ {{ store.income }}</span>
          </div>

          <UDivider orientation="vertical" class="text-rose-100" />

          <div class="w-1/2 flex flex-col items-center">
            <span class="text-xl md:text-2xl font-heading">Expense</span>
            <span class="text-lg md:text-xl">$ {{ store.expense }}</span>
          </div>
        </div></UCard
      >
    </div>

    <div>
      <UTabs :items="tabs" class="w-full">
        <template #default="{ item, index, selected }">
          <span
            class="truncate"
            :class="[selected && 'text-primary-500 dark:text-primary-400']"
            >{{ item.label }}</span
          >
        </template>
        <template #icon="{ item, selected }">
          <UIcon
            :name="item.icon"
            class="w-4 h-4 flex-shrink-0 me-2"
            :class="[selected && 'text-primary-500 dark:text-primary-400']"
          />
        </template>
        <template #addTransaction="{ item, selected }">
          <ExpenseCalculatorAddTransaction
            title=""
            :selected="selected"
          ></ExpenseCalculatorAddTransaction>
        </template>

        <template #transactionHistory="{ item }">
          <ExpenseCalculatorTransactionHistory
            title=""
          ></ExpenseCalculatorTransactionHistory>
        </template>

        <template #charts="{ item }">
          <ExpenseCalculatorTrendsCharts />
        </template>
      </UTabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  useExpenseCalculatorStore,
  type Transaction,
} from "@/stores/expenseCalculatorStore";

const store = useExpenseCalculatorStore();

const tabs = [
  {
    label: "Add Transactions",
    icon: "material-symbols:add-2-rounded",
    slot: "addTransaction",
  },
  {
    label: "History",
    icon: "material-symbols:history-2-rounded",
    slot: "transactionHistory",
  },
  {
    label: "Charts",
    icon: "material-symbols:bar-chart-rounded",
    slot: "charts",
  },
];
</script>

<style scoped></style>

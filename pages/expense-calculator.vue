<template>
  <div class="w-full h-full p-2 md:p-4 flex flex-col gap-y-10 lg:gap-y-14">
    <h1 class="hidden md:block text-3xl md:text-4xl">Expense Calculator</h1>

    <h2 class="hidden lg:block text-xl sm:text-2xl md:text-3xl font-medium">
      Your Balance:
      <span
        :class="store.balance > 0 ? 'text-green-500' : 'text-red-500'"
        class="ml-5"
        >$ {{ store.balance }}</span
      >
    </h2>

    <div class="flex md:hidden flex-col items-center justify-center">
      <h3 class="text-center text-xl sm:text-2xl">Your Balance</h3>
      <h2
        :class="store.balance > 0 ? 'text-green-500' : 'text-red-500'"
        class="text-center ml-5 text-2xl sm:text-3xl"
      >
        $ {{ store.balance }}
      </h2>
    </div>

    <UCard class="w-[97%] sm:w-[400px] bg-yellow-900 rounded-3xl"
      ><div class="w-full flex justify-center rounded-3xl">
        <div class="w-1/2 flex flex-col items-center">
          <span class="text-xl md:text-2xl">Income</span>
          <span class="text-lg md:text-xl">$ {{ store.income }}</span>
        </div>

        <UDivider orientation="vertical" class="text-gray-500" />

        <div class="w-1/2 flex flex-col items-center">
          <span class="text-xl md:text-2xl">Expense</span>
          <span class="text-lg md:text-xl">$ {{ store.expense }}</span>
        </div>
      </div></UCard
    >

    <!-- <div class="w-full grid grid-cols-2 gap-x-5 lg:gap-x-7">
      <ExpenseCalculatorAddTransaction
        title="Add Transaction"
      ></ExpenseCalculatorAddTransaction>

      <ExpenseCalculatorTransactionHistory
        title="History"
      ></ExpenseCalculatorTransactionHistory>
    </div> -->

    <div>
      <UTabs :items="tabs" class="w-full">
        <template #addTransaction="{ item }">
          <ExpenseCalculatorAddTransaction
            title=""
          ></ExpenseCalculatorAddTransaction>
        </template>

        <template #transactionHistory="{ item }">
          <ExpenseCalculatorTransactionHistory
            title=""
          ></ExpenseCalculatorTransactionHistory>
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
  { label: "Charts", icon: "material-symbols:bar-chart-rounded" },
];
</script>

<style scoped></style>

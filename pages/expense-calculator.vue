<template>
  <div class="w-full h-full p-2 md:p-4 flex flex-col gap-y-10 lg:gap-y-14">
    <h1 class="hidden md:block text-3xl md:text-4xl">Expense Calculator</h1>

    <h2 class="text-xl sm:text-2xl md:text-3xl font-medium">
      Your Balance:
      <span
        :class="store.balance > 0 ? 'text-green-500' : 'text-red-500'"
        class="ml-5"
        >$ {{ store.balance }}</span
      >
    </h2>

    <div class="w-full grid grid-cols-2 gap-x-5 lg:gap-x-7">
      <ExpenseCalculatorAddTransaction
        title="Add Transaction"
      ></ExpenseCalculatorAddTransaction>

      <ExpenseCalculatorTransactionHistory
        title="History"
      ></ExpenseCalculatorTransactionHistory>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  useExpenseCalculatorStore,
  type Transaction,
} from "@/stores/expenseCalculatorStore";

const store = useExpenseCalculatorStore();
</script>

<style scoped></style>

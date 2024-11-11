<template>
  <div class="w-full h-full p-2 md:p-4 flex flex-col items-center">
    expense calculator

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

<script setup lang="ts"></script>

<style scoped></style>

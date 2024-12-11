<template>
  <div v-if="expenseCalculatorStore.history.length > 0">
    <LineChartAllTransactions />

    <div><PieChartExpenses /> <PieChartIncome /></div>
  </div>
  <div v-else class="flex justify-center items-center min-h-28">
    <p>No charts to show</p>
  </div>
</template>

<script setup lang="ts">
// import { ref, onMounted, watch } from "vue";
import { useExpenseCalculatorStore } from "@/stores/expenseCalculatorStore";
// import { chart, color } from "highcharts";
import PieChartExpenses from "./charts/PieChartExpenses.vue";
import PieChartIncome from "./charts/PieChartIncome.vue";
import LineChartAllTransactions from "./charts/LineChartAllTransactions.vue";

const expenseCalculatorStore = useExpenseCalculatorStore();
</script>

<style scoped></style>

<template>
  <div>
    <highcharts
      :options="pieChartOptions"
      ref="highchartsPie"
      class="!bg-transparent !rounded-3xl !text-white"
    />
  </div>
</template>

<script setup lang="ts">
import { useExpenseCalculatorStore } from "@/stores/expenseCalculatorStore";

const expenseCalculatorStore = useExpenseCalculatorStore();

const pieChartOptions = ref<any>({
  chart: {
    type: "pie",
    backgroundColor: null,
  },
  title: {
    text: "Income, Expense & Balance Overview",
  },
  series: [
    {
      name: "Amount",
      data: [
        { name: "Income", y: 0 },
        { name: "Expense", y: 0 },
        { name: "Balance", y: 0 },
      ],
    },
  ],
});

const updatePieChartData = () => {
  const expenseTransactions = expenseCalculatorStore.history.filter(
    (transaction) => transaction.type === "expense" // Use `type` to filter only expenses
  );

  // Group expenses by category and sum their values
  const expenseTotals: Record<string, number> = expenseTransactions.reduce(
    (acc, transaction) => {
      const category = transaction.category || "Uncategorized"; // Handle uncategorized transactions
      acc[category] = (acc[category] || 0) + Math.abs(transaction.value); // Use Math.abs to ensure positive values
      return acc;
    },
    {} as Record<string, number>
  );

  // Prepare data array for the pie chart
  const pieData = Object.entries(expenseTotals).map(([name, y]) => ({
    name,
    y,
  }));

  // Update the pie chart options
  pieChartOptions.value = {
    ...pieChartOptions.value,
    title: {
      text: "Expenses by Category", // Update the title for clarity
    },
    series: [
      {
        name: "Expenses",
        data: pieData,
      },
    ],
  };
};

watch(expenseCalculatorStore.history, () => {
  updatePieChartData();
});

onMounted(() => {
  updatePieChartData();
});
</script>

<style scoped></style>

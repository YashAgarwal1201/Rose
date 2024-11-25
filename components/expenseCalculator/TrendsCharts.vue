<template>
  <div v-if="expenseCalculatorStore.history.length > 0">
    <highcharts
      :options="chartOptions"
      ref="highcharts"
      class="!bg-transparent !rounded-3xl !text-white"
    />

    <highcharts
      :options="pieChartOptions"
      ref="highchartsPie"
      class="!bg-transparent !rounded-3xl !text-white"
    />
  </div>
  <div v-else class="flex justify-center items-center min-h-28">
    <p>No charts to show</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useExpenseCalculatorStore } from "@/stores/expenseCalculatorStore"; // adjust the path to your store
import { chart, color } from "highcharts";

// Pinia store for expense calculation
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

// Chart options as a reactive reference
const chartOptions = ref<any>({
  title: {
    text: "Transactions trend",
    color: "green",
  },
  xAxis: {
    categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  },
  yAxis: {
    title: {
      text: "Transaction Amount",
    },
  },
  series: [
    {
      name: "Transaction Name",
      data: [], // Initially empty, will be populated later
    },
  ],
  chart: {
    spacingBottom: 20,
    spacingTop: 20,
    spacingLeft: 20,
    spacingRight: 20,

    backgroundColor: null,
    color: "white",
    // borderWidth: 1,
    // borderRadius: 30,
    width: null,
    height: null,

    style: {
      color: "white",
      fontSize: "1rem",
    },
  },
  colors: ["yellow", "5685f2", "green"],
});

// const updatePieChartData = () => {
//   const history = expenseCalculatorStore.history;

//   // Group transactions by category and sum their values
//   const categoryTotals: Record<string, number> = history.reduce(
//     (acc, transaction) => {
//       const category = transaction.category || "Uncategorized"; // Use a default category if none is provided
//       acc[category] = (acc[category] || 0) + transaction.value;
//       return acc;
//     },
//     {} as Record<string, number>
//   );

//   // Create data array for the pie chart
//   const pieData = Object.entries(categoryTotals).map(([name, y]) => ({
//     name,
//     y,
//   }));

//   // Update pie chart options
//   pieChartOptions.value = {
//     ...pieChartOptions.value,
//     series: [
//       {
//         name: "Amount",
//         data: pieData,
//       },
//     ],
//   };
// };

// Update the chart's series based on transaction history

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

const updateChartData = () => {
  const history = expenseCalculatorStore.history;

  // You can modify how categories and data points are assigned based on the transaction history
  const categories = history.map((transaction) => transaction.name); // Assuming `name` is used as category
  const data = history.map((transaction) => transaction.value); // Assuming `value` is the data for the chart

  // Update chart options dynamically
  chartOptions.value = {
    ...chartOptions.value,
    xAxis: {
      categories,
    },
    series: [
      {
        name: "Transaction name",
        data,
      },
    ],
  };
};

// Watch for changes in the history array
watch(expenseCalculatorStore.history, () => {
  updateChartData();
  updatePieChartData();
});

onMounted(() => {
  // Ensure chart data is updated when component is mounted
  updateChartData();
  updatePieChartData();
});
</script>

<style scoped></style>

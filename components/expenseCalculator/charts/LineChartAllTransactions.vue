<template>
  <div>
    <highcharts
      :options="chartOptions"
      ref="highcharts"
      class="!bg-transparent !rounded-3xl !text-white"
    />
  </div>
</template>

<script setup lang="ts">
import { useExpenseCalculatorStore } from "@/stores/expenseCalculatorStore";

const expenseCalculatorStore = useExpenseCalculatorStore();

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
});

onMounted(() => {
  // Ensure chart data is updated when component is mounted
  updateChartData();
});
</script>

<style scoped></style>

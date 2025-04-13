<script setup lang="ts">
import { defineProps, ref, computed } from "vue";
import {
  useExpenseCalculatorStore,
  type Transaction,
} from "@/stores/expenseCalculatorStore";
import { History } from "lucide-vue-next";

const store = useExpenseCalculatorStore();
const value = ref("All");
const options = ref(["All", "Incomes", "Expenses"]);
const page = ref(1);
const pageCount = 5;
const first = ref(0);
const rows = ref(5);

const tableData = computed(() => {
  return store.history.slice(
    (page.value - 1) * pageCount,
    page.value * pageCount
  );
});

const props = defineProps<{
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
  store.handleDeleteTransaction(transactionVal);
};

const editTransaction = (transactionVal: Transaction) => {
  console.log(transactionVal);
  store.handleEditTransaction(transactionVal);
};

const visibleTransactions = computed(() => {
  const filtered = filteredHistory.value;
  return filtered.slice(0, 5); // Show only the first 5 transactions
});

const onPage = (event: any) => {
  first.value = event.first;
  rows.value = event.rows;
  page.value = Math.floor(event.first / event.rows) + 1;
};

const totalRecords = computed(() => store.history.length);

const columns = [
  { field: "id", header: "ID" },
  { field: "name", header: "Name", sortable: true },
  { field: "value", header: "Amount", sortable: true },
  { field: "category", header: "Category", sortable: true },
  { field: "type", header: "Type", sortable: true },
  { field: "date", header: "Date", sortable: true },
];
</script>

<template>
  <div class="w-full h-full">
    <h3
      v-if="title"
      class="font-medium text-xl md:text-2xl pb-2 border-b sm:border-b-2 flex items-center"
    >
      <History :size="16" class="mr-3" />{{ title }}
    </h3>

    <div
      v-if="visibleTransactions.length >= 0"
      class="flex flex-col gap-y-2 py-4"
    >
      <DataTable
        :value="tableData"
        :paginator="totalRecords > 5"
        :rows="5"
        :rowsPerPageOptions="[5, 10, 20]"
        v-model:first="first"
        :totalRecords="totalRecords"
        @page="onPage"
        :empty-message="'No transaction history to show'"
        class="p-datatable-sm"
        stripedRows
        responsiveLayout="scroll"
      >
        <Column
          v-for="col of columns"
          :key="col.field"
          :field="col.field"
          :header="col.header"
          :sortable="col.sortable"
        >
          <template #body="{ data, field }" v-if="field === 'value'">
            <span :class="data.value > 0 ? 'text-green-600' : 'text-red-600'">
              $ {{ data.value }}
            </span>
          </template>
        </Column>
        <Column :exportable="false" style="min-width: 8rem">
          <template #body="{ data }">
            <Button
              icon="pi pi-pencil"
              rounded
              outlined
              severity="info"
              class="mr-2"
              @click="editTransaction(data)"
            />
            <Button
              icon="pi pi-trash"
              rounded
              outlined
              severity="danger"
              @click="deleteTransaction(data)"
            />
          </template>
        </Column>
      </DataTable>

      <div
        class="flex justify-between items-center px-3 py-3.5 border-t border-gray-200 dark:border-gray-700"
        v-if="store.history?.length > 5"
      >
        <div>
          <Button
            label="Show more"
            rounded
            icon="pi pi-list"
            @click="store.showTransactionsHistoryDialog = true"
          />
        </div>
      </div>
    </div>
    <div v-else class="flex flex-col gap-y-2 py-4">
      <p class="italic">No transaction history to show</p>
    </div>
  </div>
</template>

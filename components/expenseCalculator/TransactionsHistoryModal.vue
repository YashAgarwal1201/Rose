<template>
  <div>
    <Dialog
      v-model:visible="expenseCalculatorStore.showTransactionsHistoryDialog"
      :style="{ width: '768px' }"
      :breakpoints="{ '768px': '90vw' }"
      maximizable
      modal
      class="transactions-dialog"
    >
      <template #header>
        <div class="flex justify-between items-center w-full">
          <h3 class="text-base md:text-lg font-medium">Transactions History</h3>
          <Button
            type="button"
            @click="
              expenseCalculatorStore.showTransactionsHistoryDialog = false
            "
            icon="pi pi-times"
            class="p-button-rounded p-button-outlined"
          />
        </div>
      </template>

      <DataTable
        :value="rows"
        :paginator="false"
        :emptyMessage="'No items.'"
        stripedRows
        responsiveLayout="scroll"
      >
        <Column field="id" header="ID"></Column>
        <Column
          field="name"
          header="Name"
          :sortable="expenseCalculatorStore.history.length > 2"
        ></Column>
        <Column
          field="value"
          header="Amount"
          :sortable="expenseCalculatorStore.history.length > 2"
        ></Column>
        <Column
          field="category"
          header="Category"
          :sortable="expenseCalculatorStore.history.length > 2"
        ></Column>
        <Column
          field="type"
          header="Type"
          :sortable="expenseCalculatorStore.history.length > 2"
        ></Column>
        <Column
          field="date"
          header="Date"
          :sortable="expenseCalculatorStore.history.length > 2"
        ></Column>
      </DataTable>

      <div
        class="flex justify-between items-center px-3 py-3.5 border-t border-gray-200 dark:border-gray-700"
      >
        <Paginator
          v-model:first="first"
          :rows="pageCount"
          :totalRecords="expenseCalculatorStore.history.length"
          @page="onPage"
        />
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useExpenseCalculatorStore } from "@/stores/expenseCalculatorStore";

const expenseCalculatorStore = useExpenseCalculatorStore();

const page = ref(1);
const pageCount = 5;
const first = ref(0);

const rows = computed(() => {
  return expenseCalculatorStore.history.slice(
    (page.value - 1) * pageCount,
    page.value * pageCount
  );
});

const onPage = (event: { first: number; rows: number }) => {
  first.value = event.first;
  page.value = Math.floor(event.first / event.rows) + 1;
};
</script>

<style scoped>
.transactions-dialog {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.transactions-dialog :deep(.p-dialog-content) {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  flex: 1;
}

@media (max-width: 768px) {
  .transactions-dialog {
    max-height: 100vh;
  }
}
</style>

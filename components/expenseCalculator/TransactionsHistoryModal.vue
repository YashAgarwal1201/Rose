<template>
  <div>
    <UModal
      v-model="expenseCalculatorStore.showTransactionsHistoryDialog"
      class="w-full md:w-[768px]"
      fullscreen
    >
      <UCard class="h-full">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-base md:text-lg">Transactions History</h3>
            <UButton
              type="button"
              @click="
                expenseCalculatorStore.showTransactionsHistoryDialog = false
              "
              icon="material-symbols:close-rounded"
              class="rounded-full"
              variant="outline"
            />
          </div>
        </template>

        <UTable
          :rows="rows"
          :empty-state="{
            icon: 'i-heroicons-circle-stack-20-solid',
            label: 'No items.',
          }"
          :columns="[
            { key: 'id', label: 'ID' },
            {
              key: 'name',
              label: 'Name',
              sortable: expenseCalculatorStore.history.length > 2,
            },
            {
              key: 'value',
              label: 'Amount',
              sortable: expenseCalculatorStore.history.length > 2,
            },
            {
              key: 'category',
              label: 'Category',
              sortable: expenseCalculatorStore.history.length > 2,
            },
            {
              key: 'type',
              label: 'Type',
              sortable: expenseCalculatorStore.history.length > 2,
            },
            {
              key: 'date',
              label: 'Date',
              sortable: expenseCalculatorStore.history.length > 2,
            },
          ]"
        ></UTable>
        <div
          class="flex justify-between items-center px-3 py-3.5 border-t border-gray-200 dark:border-gray-700"
        >
          <UPagination
            v-model="page"
            :page-count="pageCount"
            :total="expenseCalculatorStore.history.length"
          />
        </div>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useExpenseCalculatorStore } from "@/stores/expenseCalculatorStore";

const expenseCalculatorStore = useExpenseCalculatorStore();

const page = ref(1);
const pageCount = 5;

const rows = computed(() => {
  return expenseCalculatorStore.history.slice(
    (page.value - 1) * pageCount,
    page.value * pageCount
  );
});
</script>

<style scoped></style>

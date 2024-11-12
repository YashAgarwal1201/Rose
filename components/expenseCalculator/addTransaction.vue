<script setup lang="ts">
import { useExpenseCalculatorStore } from "@/stores/expenseCalculatorStore";

const store = useExpenseCalculatorStore();
import { ref, defineProps, watch } from "vue";

const props = defineProps<{
  title: string;
}>();

const transaction = ref<{
  name: string;
  value: number | null;
  id: string;
  type: "income" | "expense";
}>({
  name: "",
  value: null,
  id: "",
  type: "income",
});
const transactionType = ref<"Income" | "Expense">("Income");

const { title } = props;

watch(
  () => store.editingTransaction,
  (newVal) => {
    if (newVal) {
      transaction.value = {
        ...newVal,
        type: newVal.value > 0 ? "income" : "expense",
      };
      transactionType.value = newVal.value > 0 ? "Income" : "Expense";
    }
  },
  { immediate: true }
);

const addTransaction = () => {
  if (transaction.value.name && transaction.value.value !== 0) {
    const finalValue =
      transactionType.value === "Expense"
        ? -Math.abs(transaction.value.value ?? 0)
        : Math.abs(transaction.value.value ?? 0);

    store.handleAddTransaction({
      name: transaction.value.name,
      value: finalValue,
      id: transaction.value.id || Date.now().toString(),
      type: transactionType.value.toLowerCase() as "income" | "expense",
    });

    transaction.value = { name: "", value: null, id: "", type: "income" };
    transactionType.value = "Income";
  } else {
    console.warn("Transaction name and value are required.");
  }
};
</script>

<template>
  <div class="flex flex-col gap-y-0">
    <h3
      v-if="title"
      class="font-medium text-xl md:text-2xl pb-2 border-b sm:border-b-2 flex items-center"
    >
      <UIcon name="material-symbols:add-2-rounded" class="mr-3"></UIcon
      >{{ title }}
    </h3>

    <form class="w-full sm:w-[640px] py-5 flex flex-col gap-y-3 md:gap-y-5">
      <div class="flex flex-col gap-y-2 md:gap-y-3">
        <label class="text-lg md:text-xl">Transaction Type</label>
        <USelect
          v-model="transactionType"
          :options="['Income', 'Expense']"
          class="w-fit bg-white border-gray-500 text-base !rounded-full *:!rounded-xl"
        />
      </div>

      <div class="flex flex-col gap-y-3">
        <label class="text-lg md:text-xl">Transaction Name</label>

        <UInput
          v-model="transaction.name"
          type="text"
          maxlength="150"
          class="text-base !rounded-full *:!rounded-xl"
          placeholder="Enter transaction name"
          required
        />
      </div>

      <div class="flex flex-col gap-y-3">
        <label class="text-lg md:text-xl">Transaction Date</label>

        <UPopover :popper="{ placement: 'bottom-start' }">
          <UButton icon="i-heroicons-calendar-days-20-solid" />

          <template #panel="{ close }">
            <DatePicker v-model="date" is-required @close="close" />
          </template>
        </UPopover>
      </div>

      <div class="flex flex-col gap-y-3">
        <label class="text-lg md:text-xl">Transaction Amount</label>

        <UInput
          v-model.number="transaction.value"
          type="number"
          maxlength="10"
          class="text-base !rounded-full *:!rounded-xl"
          placeholder="0.00"
          :prefix="transactionType === 'Income' ? '$ +' : '$ -'"
        />
      </div>

      <div class="w-full flex justify-center mt-5 md:mt-8">
        <UButton
          title="click to add the transaction"
          :disabled="transaction.name === '' || transaction.value === 0"
          label="Add Transaction"
          class="rounded-full px-7"
          @click="addTransaction"
          rounded
        />
      </div>
    </form>
  </div>
</template>

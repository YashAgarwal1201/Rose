<script setup lang="ts">
import { useExpenseCalculatorStore } from "@/stores/expenseCalculatorStore";
import { ref, defineProps, watch } from "vue";

const store = useExpenseCalculatorStore();

const props = defineProps<{
  title: string;
}>();

// Define the transaction object including name, value, type, category, and date
const transaction = ref<{
  name: string;
  value: number | null;
  id: string;
  type: string;
  category: string;
  date: string;
}>({
  name: "",
  value: null,
  id: "",
  type: "",
  category: "",
  date: "",
});

// const transactionType = ref<"income" | "expense">("income");

const { title } = props;

watch(
  () => store.editingTransaction,
  (newVal) => {
    if (newVal) {
      transaction.value = {
        ...newVal,
        type: newVal.value > 0 ? "income" : "expense",
      };
      // transactionType.value = newVal.value > 0 ? "income" : "expense";
    }
  }
);

const addTransaction = () => {
  if (
    transaction.value.name &&
    transaction.value.value !== 0 &&
    transaction.value.category &&
    transaction.value.date
  ) {
    const finalValue =
      transaction.value.type === "expense"
        ? -Math.abs(transaction.value.value ?? 0)
        : Math.abs(transaction.value.value ?? 0);

    store.handleAddTransaction({
      name: transaction.value.name,
      value: finalValue,
      id: transaction.value.id || Date.now().toString(),
      type: transaction.value.type, //transactionType.value.toLowerCase() as "income" | "expense",
      category: transaction.value.category,
      date: new Date(transaction.value.date),
    });

    transaction.value = {
      name: "",
      value: null,
      id: "",
      type: "",
      category: "",
      date: "",
    };
    // transactionType.value = "income";
  } else {
    console.warn("Transaction name, value, category, and date are required.");
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

    <form
      class="w-full sm:w-[640px] mx-auto lg:mx-0 py-5 flex flex-col gap-y-4 md:gap-y-5"
    >
      <div class="grid grid-cols-2 gap-x-2 md:gap-x-3">
        <div class="flex flex-col gap-y-2 md:gap-y-3">
          <label class="text-base md:text-lg">Transaction Type</label>
          <USelect
            v-model="transaction.type"
            :options="['income', 'expense']"
            placeholder="Transaction type"
            class="w-full border-gray-500 text-base"
          />
        </div>

        <div class="flex flex-col gap-y-2 md:gap-y-3">
          <label class="text-base md:text-lg">Transaction Category</label>
          <USelect
            v-model="transaction.category"
            :options="['Food', 'Rent', 'Salary', 'Entertainment', 'Utilities']"
            class="w-full border-gray-500 text-base"
            placeholder="Select category"
            required
          />
        </div>
      </div>

      <div class="flex flex-col gap-y-3">
        <label class="text-base md:text-lg">Transaction Name</label>
        <UInput
          v-model="transaction.name"
          type="text"
          maxlength="150"
          class="text-base"
          placeholder="Enter transaction name"
          required
        />
      </div>

      <div class="flex flex-col gap-y-3">
        <label class="text-base md:text-lg">Transaction Date</label>
        <UInput
          v-model="transaction.date"
          type="date"
          class="text-base"
          placeholder="dd/mm/yyyy"
          required
        />
      </div>

      <div class="flex flex-col gap-y-3">
        <label class="text-base md:text-lg">Transaction Amount</label>
        <UInput
          v-model.number="transaction.value"
          type="number"
          maxlength="10"
          class="text-base"
          placeholder="0.00"
        />
      </div>

      <div class="w-full flex justify-center mt-5 md:mt-8">
        <UButton
          title="click to add the transaction"
          :disabled="
            transaction.name === '' ||
            transaction.value === 0 ||
            transaction.category === '' ||
            transaction.date === ''
          "
          label="Add Transaction"
          class="rounded-full px-7"
          @click="addTransaction"
          rounded
        />
      </div>
    </form>
  </div>
</template>

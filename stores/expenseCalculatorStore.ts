import { defineStore } from "pinia";
import { computed, ref } from "vue";

export type Transaction = {
  id: string;
  name: string;
  value: number;
  type: string;
};
export const useExpenseCalculatorStore = defineStore("expenses", () => {
  const history = ref<Transaction[]>([]);
  const editingTransaction = ref<Transaction | null>(null);
  const showTransactionsHistoryDialog = ref<boolean>(false);

  const balance = computed(() =>
    history.value.reduce((acc, curr) => acc + curr.value, 0)
  );

  const income = computed(() =>
    history.value
      .filter((item) => item.value > 0)
      .reduce((acc, item) => acc + item.value, 0)
  );

  const expense = computed(() =>
    history.value
      .filter((item) => item.value < 0)
      .reduce((acc, item) => acc + item.value, 0)
  );

  const handleAddTransaction = (newTransaction: Transaction) => {
    if (editingTransaction.value) {
      const index = history.value.findIndex(
        (item) => item.id === editingTransaction.value?.id
      );
      if (index !== -1) {
        history.value[index] = {
          ...newTransaction,
          id: editingTransaction.value.id,
        };
      }
      editingTransaction.value = null;
    } else {
      history.value.push(newTransaction);
      // console.log("Transaction added:", newTransaction);
    }

    // transaction.value.name = ''
    // transaction.value = 0
  };

  const handleDeleteTransaction = (transactionToDelete: Transaction) => {
    const index = history.value.findIndex(
      (transaction) => transaction.id === transactionToDelete.id
    );

    if (index !== -1) {
      history.value.splice(index, 1);
      // console.log("Transaction deleted:", transactionToDelete);
    }
  };

  const handleEditTransaction = (oldTransaction: Transaction) => {
    console.log(oldTransaction);
    editingTransaction.value = oldTransaction;

    showTransactionsHistoryDialog.value = false;
  };

  return {
    history,
    editingTransaction,
    showTransactionsHistoryDialog,
    expense,
    income,
    balance,
    handleAddTransaction,
    handleDeleteTransaction,
    handleEditTransaction,
  };
});

<template>
  <div class="w-full h-full flex flex-col gap-y-3 p-2">
    <UInput placeholder="Enter Title..." />

    <div class="space-y-2">
      <div
        v-for="(item, index) in todoItems"
        :key="index"
        class="flex items-center space-x-2"
      >
        <UCheckbox v-model="item.completed" :label="undefined" />
        <UInput
          ref="inputRefs"
          v-model="item.text"
          placeholder="Enter todo item..."
          @keyup.enter="addNewItem(index)"
          class="w-full"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";

interface TodoItem {
  text: string;
  completed: boolean;
}

const todoItems = ref<TodoItem[]>([{ text: "", completed: false }]);

const inputRefs = ref<any[]>([]);

const addNewItem = async (index: number) => {
  if (todoItems.value[index].text.trim() !== "") {
    todoItems.value.push({ text: "", completed: false });

    await nextTick(() => {
      const newInputIndex = inputRefs.value.length - 1;
      inputRefs.value[newInputIndex]?.focus();
    });
  }
};
</script>

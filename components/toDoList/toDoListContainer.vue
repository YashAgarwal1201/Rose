<template>
  <div class="w-full h-full flex flex-col gap-y-3 p-2">
    <UInput placeholder="Enter Title..." />

    <div class="space-y-2">
      <div
        v-for="(item, index) in todoItems"
        :key="index"
        class="flex items-center space-x-2"
      >
        <UCheckbox
          v-model="item.isDone"
          :label="undefined"
          title="mark to do item as done"
        />
        <UInput
          ref="inputRefs"
          v-model="item.text"
          placeholder="Enter todo item..."
          @keyup.enter="addNewItem(index)"
          class="w-full"
        />
        <UButton class="text-white shadow-none" title="Delete to do item"
          ><UIcon name="material-symbols:backspace-rounded" size="20px"></UIcon
        ></UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";
import type { TodoItem } from "~/types/typesAndInterfaces";
import { v4 as uuidv4 } from "uuid";

const todoItems = ref<TodoItem[]>([
  {
    id: uuidv4(),
    text: "",
    timestamp: new Date(),
    isDone: false,
  },
]);

const inputRefs = ref<any[]>([]);

const addNewItem = async (index: number) => {
  if (todoItems.value[index].text.trim() !== "") {
    todoItems.value.push({
      id: uuidv4(),
      text: "",
      timestamp: new Date(),
      isDone: false,
    });

    await nextTick(() => {
      const newInputIndex = inputRefs.value.length - 1;
      inputRefs.value[newInputIndex]?.focus();
    });
  }
};
</script>

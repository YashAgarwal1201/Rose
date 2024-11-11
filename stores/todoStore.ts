import { defineStore } from "pinia";
import { ref } from "vue";

export const useTodoStore = defineStore("todos", () => {
  const todos = ref<{ id: string; text: string; done: boolean }[]>([]);

  const addToDoItem = (val: { id: string; text: string; done: boolean }) => {
    // console.log(val);
    todos.value.push(val);
  };

  const deleteToDoItem = (todo: string) => {
    todos.value = todos.value.filter((t) => t.text !== todo);
  };

  const toggleTodoItem = (val: { text: string; done: boolean }) => {
    const todoItem = todos.value.find((t) => t.text === val.text);
    if (todoItem) {
      // console.log(todoItem.done);
      todoItem.done = !todoItem.done;
    }
  };

  return { todos, addToDoItem, deleteToDoItem, toggleTodoItem };
});

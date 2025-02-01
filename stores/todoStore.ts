import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { v4 as uuidv4 } from "uuid";
import type {
  ListOfTodos,
  TodoItem,
  TodoList,
} from "~/types/typesAndInterfaces";

export const useTodoStore = defineStore("todos", () => {
  const listOfTodos = ref<ListOfTodos>([]);

  // Create a new TodoItem
  const createTodoItem = (text: string): TodoItem => ({
    id: uuidv4(),
    text,
    isDone: false,
    timestamp: new Date(),
  });

  // Create a new TodoList
  const createTodoList = (id: string, title: string): TodoList => ({
    id, //uuidv4(),
    title,
    timestamp: new Date(),
    isDone: false,
    list: [],
  });

  // Add a new TodoList to the ListOfTodos.
  const addTodoList = (id: string, title: string) => {
    const newList = createTodoList(id, title);
    listOfTodos.value.push(newList);
    return newList;
  };

  // Add a new TodoItem to a specific TodoList.
  const addTodoItemToList = (listId: string, text: string) => {
    const targetList = listOfTodos.value.find((list) => list.id === listId);
    if (targetList) {
      const newTodo = createTodoItem(text);
      targetList.list.push(newTodo);
      updateListCompletionStatus(targetList);
      return newTodo;
    }
    return null;
  };

  // Update an existing TodoItem in a specific TodoList.
  const updateTodoItemInList = (
    listId: string,
    todoId: string,
    updates: Partial<TodoItem>
  ) => {
    const targetList = listOfTodos.value.find((list) => list.id === listId);
    if (targetList) {
      const itemIndex = targetList.list.findIndex((item) => item.id === todoId);
      if (itemIndex !== -1) {
        targetList.list[itemIndex] = {
          ...targetList.list[itemIndex],
          ...updates,
        };
        updateListCompletionStatus(targetList);
        return targetList.list[itemIndex];
      }
    }
    return null;
  };

  // Update an existing TodoList.
  const updateTodoList = (listId: string, updates: Partial<TodoList>) => {
    const listIndex = listOfTodos.value.findIndex((list) => list.id === listId);
    if (listIndex !== -1) {
      listOfTodos.value[listIndex] = {
        ...listOfTodos.value[listIndex],
        ...updates,
      };
      return listOfTodos.value[listIndex];
    }
    return null;
  };

  // Delete a TodoItem from a specific TodoList.
  const deleteTodoItemFromList = (listId: string, todoId: string) => {
    const targetList = listOfTodos.value.find((list) => list.id === listId);
    if (targetList) {
      targetList.list = targetList.list.filter((item) => item.id !== todoId);
      updateListCompletionStatus(targetList);
    }
  };

  // Delete an entire TodoList.
  const deleteTodoList = (listId: string) => {
    listOfTodos.value = listOfTodos.value.filter((list) => list.id !== listId);
  };

  // Update list completion status based on all todo items
  const updateListCompletionStatus = (list: TodoList) => {
    list.isDone =
      list.list.length > 0 && list.list.every((item) => item.isDone);
  };

  // Computed getter for completed lists
  const completedLists = computed(() =>
    listOfTodos.value.filter((list) => list.isDone)
  );

  // Computed getter for active lists
  const activeLists = computed(() =>
    listOfTodos.value.filter((list) => !list.isDone)
  );

  return {
    listOfTodos,
    completedLists,
    activeLists,
    addTodoList,
    addTodoItemToList,
    updateTodoItemInList,
    updateTodoList,
    deleteTodoItemFromList,
    deleteTodoList,
  };
});

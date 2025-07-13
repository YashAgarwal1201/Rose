import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { v4 as uuidv4 } from "uuid";
import type {
  ListOfTodos,
  TodoItem,
  TodoList,
} from "~/types/typesAndInterfaces";

function toRawData<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export const useTodoStore = defineStore("todos", () => {
  let listOfTodos = ref<ListOfTodos>([]);
  let loaded = ref<boolean>(false);

  const loadTodos = async () => {
    listOfTodos.value = await getAllLists();
    loaded.value = true;
  };

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
  const addTodoList = async (id: string, title: string) => {
    const newList = createTodoList(id, title);
    listOfTodos.value.push(newList);
    await saveList(toRawData(newList));
    return newList;
  };

  // Add a new TodoItem to a specific TodoList.
  const addTodoItemToList = async (listId: string, text: string) => {
    const targetList = listOfTodos.value.find((list) => list.id === listId);
    if (targetList) {
      const newTodo = createTodoItem(text);
      targetList.list.push(newTodo);
      updateListCompletionStatus(targetList);
      await saveList(toRawData(targetList));
      return newTodo;
    }
    return null;
  };

  // Update an existing TodoItem in a specific TodoList.
  const updateTodoItemInList = async (
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
        await saveList(toRawData(targetList));
        return targetList.list[itemIndex];
      }
    }
    return null;
  };

  // Update an existing TodoList.
  const updateTodoList = async (listId: string, updates: Partial<TodoList>) => {
    const listIndex = listOfTodos.value.findIndex((list) => list.id === listId);
    if (listIndex !== -1) {
      listOfTodos.value[listIndex] = {
        ...listOfTodos.value[listIndex],
        ...updates,
      };
      await saveList(toRawData(listOfTodos.value[listIndex]));
      return listOfTodos.value[listIndex];
    }
    return null;
  };

  // Delete a TodoItem from a specific TodoList.
  const deleteTodoItemFromList = async (listId: string, todoId: string) => {
    const targetList = listOfTodos.value?.find((list) => list.id === listId);
    if (targetList) {
      targetList.list = targetList.list?.filter((item) => item.id !== todoId);
      updateListCompletionStatus(targetList);
      await saveList(toRawData(targetList));
    }
  };

  // Delete an entire TodoList.
  const deleteTodoList = async (listId: string) => {
    listOfTodos.value = listOfTodos.value?.filter((list) => list.id !== listId);
    await deleteList(listId);
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

  const clearStoreData = async () => {
    await clearAllLists();
    listOfTodos.value = [];
  };

  const nukeDatabase = async () => {
    await deleteDatabase();
    listOfTodos.value = [];
    loaded.value = false;
  };

  return {
    listOfTodos,
    loaded,
    loadTodos,
    completedLists,
    activeLists,
    addTodoList,
    addTodoItemToList,
    updateTodoItemInList,
    updateTodoList,
    deleteTodoItemFromList,
    deleteTodoList,
    clearStoreData,
    nukeDatabase,
  };
});

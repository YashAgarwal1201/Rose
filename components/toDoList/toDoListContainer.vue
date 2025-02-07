<!-- <template>
  <div class="w-full h-full flex flex-col gap-y-3 p-2">
    <div class="flex gap-x-2">
      <UInput
        v-model="newListTitle"
        placeholder="Enter Title..."
        @keyup.enter="createNewTodoList"
      />
      <UButton
        :disabled="!newListTitle.trim()"
        @click="createNewTodoList"
        class="text-white shadow-none"
      >
        <UIcon name="material-symbols:add" size="20px" />
      </UButton>
    </div>

    <div class="space-y-2">
      <div
      v-for="item in list.list"
        
        class="flex items-center space-x-2"
      >
        <UCheckbox
          v-model="item.isDone"
          title="Mark to-do item as done"
          @change="toggleTodoItem(list.id, item.id, item.isDone)"
        />
        <UInput
          ref="inputRefs"
          v-model="item.text"
          placeholder="Enter todo item..."
          @keyup.enter="addTodoItem(list.id)"
          class="w-full"
        />
        <UButton class="text-white shadow-none" title="Delete to do item" @click="deleteTodoItem(list.id, item.id)"
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

const todoStore = useTodoStore();

const newListTitle = ref("");

const createNewTodoList = () => {
  if (newListTitle.value.trim() !== "") {
    todoStore.addTodoList(newListTitle.value);
    newListTitle.value = "";
  }
};

const addTodoItem = (listId: string) => {
  todoStore.addTodoItemToList(listId, "");
};

const updateTodoItem = (listId: string, itemId: string, text: string) => {
  todoStore.updateTodoItemInList(listId, itemId, { text });
};

const toggleTodoItem = (listId: string, itemId: string, isDone: boolean) => {
  todoStore.updateTodoItemInList(listId, itemId, { isDone });
};

const deleteTodoItem = (listId: string, itemId: string) => {
  todoStore.deleteTodoItemFromList(listId, itemId);
};

// const todoItems = ref<TodoItem[]>([
//   {
//     id: uuidv4(),
//     text: "",
//     timestamp: new Date(),
//     isDone: false,
//   },
// ]);

// const inputRefs = ref<any[]>([]);

// const addNewItem = async (index: number) => {
//   if (todoItems.value[index].text.trim() !== "") {
//     todoItems.value.push({
//       id: uuidv4(),
//       text: "",
//       timestamp: new Date(),
//       isDone: false,
//     });

//     await nextTick(() => {
//       const newInputIndex = inputRefs.value.length;

//       console.log(newInputIndex);
//       inputRefs.value[newInputIndex]?.focus();
//     });
//   }
// };
</script> -->

<template>
  <div class="w-full h-full flex flex-col gap-y-3 p-2">
    <div class="w-full flex gap-x-3">
      <UInput
        class="w-full"
        v-model="newListTitle"
        :value="props.currentList ? props.currentList.title : ''"
        :placeholder="
          props.currentList ? props.currentList.title : 'Enter Title...'
        "
        @keyup.enter="createNewTodoList"
      />
      <UButton
        class="text-white shadow-none"
        title="Delete to do item"
        @click="createNewTodoList"
      >
        <UIcon name="material-symbols:add-2-rounded" size="20px"
      /></UButton>
    </div>

    <!-- Todo Items -->
    <div class="space-y-2">
      <div
        v-for="(item, index) in currentList?.list || []"
        :key="item.id"
        class="flex items-center space-x-2"
      >
        <UCheckbox
          v-model="item.isDone"
          title="Mark to-do item as done"
          @change="toggleTodoItem(item.id, $event)"
        />
        <UInput
          ref="inputRefs"
          v-model="item.text"
          placeholder="Enter todo item..."
          @keyup.enter="
            props.currentList?.id &&
              handleEnterKey(index, props.currentList.id, item.id)
          "
          @blur="
            props.currentList?.id &&
              updateTodoItem(props.currentList.id, item.id, item.text)
          "
          class="w-full"
        />
        <UButton
          class="text-white shadow-none"
          title="Delete to do item"
          @click="deleteTodoItem(item.id)"
        >
          <UIcon name="material-symbols:backspace-rounded" size="20px" />
        </UButton>
      </div>
    </div>
    <!-- </div> -->
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";
import type { TodoList } from "~/types/typesAndInterfaces";

// Store
const todoStore = useTodoStore();
const router = useRouter();
const route = useRoute();
// Refs

const inputRefs = ref<(HTMLInputElement | null)[]>([]);

const props = defineProps<{
  currentList: TodoList | undefined;
}>();

const newListTitle = ref(props.currentList ? props.currentList.title : "");
const listId = computed(() => route.params.id as string);

// Methods
const createNewTodoList = () => {
  if (newListTitle.value.trim() !== "") {
    // Create new list
    const newList = todoStore.addTodoList(
      route.params.id as string,
      newListTitle.value
    );

    // Automatically add first empty item to the new list
    if (newList) {
      todoStore.addTodoItemToList(newList.id, "");
      // router.push(`/to-do-list/${newList.id}`);
    }
  }
};

const updateTodoItem = (listId: string, itemId: string, text: string) => {
  if (text.trim() === "") {
    // Only delete empty items if it's not the last item in the list
    const list = todoStore.listOfTodos.find((l) => l.id === listId);
    if (list && list.list.length > 1) {
      todoStore.deleteTodoItemFromList(listId, itemId);
    }
  } else {
    todoStore.updateTodoItemInList(listId, itemId, { text });
  }
};

const toggleTodoItem = (itemId: string, isDone: boolean) => {
  if (!props.currentList) return;
  todoStore.updateTodoItemInList(props.currentList.id, itemId, { isDone });
};

const deleteTodoItem = (itemId: string) => {
  if (!props.currentList) return;

  // Prevent deleting the last item
  if (props.currentList?.list.length > 1) {
    todoStore.deleteTodoItemFromList(props.currentList.id, itemId);
  }
};

const handleEnterKey = async (
  index: number,
  listId: string,
  itemId: string
) => {
  const list = todoStore.listOfTodos.find((l) => l.id === listId);
  if (!list) return;

  const currentItem = list.list[index];
  // Only add new item if current item has text
  if (currentItem.text.trim() !== "") {
    todoStore.addTodoItemToList(listId, "");

    // Wait for the DOM to update
    await nextTick();

    // Focus the new input
    const allInputs = inputRefs.value.filter((input) => input !== null);
    console.log("All Inputs", allInputs);
    const nextInput = allInputs[allInputs.length];

    console.log(nextInput?.firstChild);
    if (nextInput) {
      nextInput.focus();
      console.log("Focused");
    }
  }
};

// Clean up empty items when component unmounts
onBeforeUnmount(() => {
  todoStore.listOfTodos.forEach((list) => {
    // Keep at least one item in each list
    if (list.list.length > 1) {
      list.list.forEach((item) => {
        if (item.text.trim() === "") {
          todoStore.deleteTodoItemFromList(list.id, item.id);
        }
      });
    }
  });
});
</script>

<!-- <template>
  <div class="w-full h-full flex flex-col gap-y-3 p-2">
    <UInput
      v-model="newListTitle"
      placeholder="Enter Title..."
      @keyup.enter="createNewTodoList"
    />

    <div class="space-y-4">
      <div
        v-for="list in todoStore.activeLists"
        :key="list.id"
        class="p-4 border rounded shadow-sm"
      >
        <h3 class="font-bold text-lg">{{ list.title }}</h3>
        <div class="space-y-2">
          <div
            v-for="item in list.list"
            :key="item.id"
            class="flex items-center space-x-2"
          >
            <UCheckbox
              v-model="item.isDone"
              @change="toggleTodoItem(list.id, item.id, item.isDone)"
              title="Mark to-do item as done"
            />
            <UInput
              v-model="item.text"
              placeholder="Enter to-do item..."
              @blur="updateTodoItem(list.id, item.id, item.text)"
              class="w-full"
            />
            <UButton
              class="text-white shadow-none"
              title="Delete to-do item"
              @click="deleteTodoItem(list.id, item.id)"
            >
              <UIcon
                name="material-symbols:backspace-rounded"
                size="20px"
              ></UIcon>
            </UButton>
          </div>

          <UButton class="text-blue-500" @click="addTodoItem(list.id)">
            + Add Item
          </UButton>
        </div>

        <UButton class="text-red-500 mt-2" @click="deleteTodoList(list.id)">
          Delete List
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useTodoStore } from "~/stores/todoStore";

const todoStore = useTodoStore();

const newListTitle = ref("");

const createNewTodoList = () => {
  if (newListTitle.value.trim() !== "") {
    todoStore.addTodoList(newListTitle.value);
    newListTitle.value = "";
  }
};

const addTodoItem = (listId: string) => {
  todoStore.addTodoItemToList(listId, "");
};

const updateTodoItem = (listId: string, itemId: string, text: string) => {
  todoStore.updateTodoItemInList(listId, itemId, { text });
};

const toggleTodoItem = (listId: string, itemId: string, isDone: boolean) => {
  todoStore.updateTodoItemInList(listId, itemId, { isDone });
};

const deleteTodoItem = (listId: string, itemId: string) => {
  todoStore.deleteTodoItemFromList(listId, itemId);
};

const deleteTodoList = (listId: string) => {
  todoStore.deleteTodoList(listId);
};
</script>

<style scoped>
.border {
  border: 1px solid #ddd;
}
</style> -->

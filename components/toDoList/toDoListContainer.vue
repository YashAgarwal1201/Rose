<template>
  <div class="w-full h-full flex flex-col gap-y-10 p-2">
    <div class="w-full flex gap-x-2 sm:gap-x-3">
      <!-- <InputText
        class="w-full h-10 *:h-10"
        v-model="newListTitle"
        :value="props.currentList ? props.currentList.title : ''"
        :placeholder="
          props.currentList ? props.currentList.title : 'Enter Title...'
        "
        @keyup.enter="createNewTodoList"
      /> -->
      <InputText
        v-model="newListTitle"
        placeholder="Enter Title..."
        class="w-full !rounded-2xl"
        maxLength="200"
        @keyup.enter="createNewTodoList"
      />
      <Button
        class="text-white shadow-none !rounded-2xl"
        title="Delete to do item"
        @click="createNewTodoList"
      >
        <CornerDownLeft :size="20" />
      </Button>
      <!-- <Button
        class="text-white shadow-none !rounded-2xl"
        title="Delete to do item"
        @click="createNewTodoList"
      >
        <Plus :size="20" />
      </Button> -->
    </div>

    <!-- Todo Items -->
    <div class="space-y-2" ref="listContainer">
      <div
        v-for="(item, index) in currentList?.list || []"
        :key="item.id"
        class="flex items-center gap-x-2 sm:gap-x-3"
      >
        <!-- <Checkbox
          v-model="item.isDone"
          :binary="true"
          inputId="isDone"
          :aria-label="`Mark ${item.text} as done`"
          class="!mt-1"
        /> -->

        <Checkbox
          v-model="item.isDone"
          :binary="true"
          inputId="isDone"
          :aria-label="`Mark ${item.text} as done`"
          class="!mt-1"
          @change="toggleTodoItem(item.id, item.isDone)"
        />

        <InputText
          ref="inputRefs"
          v-model="item.text"
          placeholder="Enter todo item..."
          maxLength="500"
          @keyup.enter="
            props.currentList?.id &&
              handleEnterKey(index, props.currentList.id, item.id)
          "
          @blur="
            props.currentList?.id &&
              updateTodoItem(props.currentList.id, item.id, item.text)
          "
          class="w-full !rounded-2xl"
        />
        <Button
          class="text-white shadow-none !rounded-2xl flex-shrink-0"
          title="Delete to do item"
          @click="
            props.currentList?.id &&
              handleEnterKey(index, props.currentList.id, item.id)
          "
        >
          <CornerDownLeft :size="20" />
        </Button>
        <Button
          class="text-white shadow-none !rounded-2xl flex-shrink-0"
          title="Delete to do item"
          @click="deleteTodoItem(item.id)"
        >
          <Delete :size="20" />
        </Button>
      </div>
    </div>
    <!-- </div> -->
  </div>
</template>

<script setup lang="ts">
import { Plus, Delete, CornerDownLeft } from "lucide-vue-next";
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import InputText from "primevue/inputtext";
import { ref, nextTick } from "vue";
import type { TodoList } from "~/types/typesAndInterfaces";

// Store
const todoStore = useTodoStore();
const router = useRouter();
const route = useRoute();
// Refs

const inputRefs = ref<(HTMLInputElement | null)[]>([]);
const listContainer = ref<HTMLElement | null>(null);

const props = defineProps<{
  currentList: TodoList | undefined;
}>();

const newListTitle = ref(props.currentList ? props.currentList.title : "");
const listId = computed(() => route.params.id as string);

const setInputRefs = (el: HTMLInputElement | null) => {
  if (el && !inputRefs.value.includes(el)) {
    inputRefs.value.push(el);
  }
};

// Methods
const createNewTodoList = async () => {
  if (newListTitle.value.trim() !== "") {
    // Create new list
    const newList = todoStore.addTodoList(
      route.params.id as string,
      newListTitle.value
    );

    // Automatically add first empty item to the new list
    if (newList) {
      todoStore.addTodoItemToList((await newList).id, "");
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

// const toggleTodoItem = (itemId: string, isDone: boolean) => {
//   if (!props.currentList) return;
//   todoStore.updateTodoItemInList(props.currentList.id, itemId, { isDone });
// };

const toggleTodoItem = (itemId: string, isDone: boolean) => {
  if (!props.currentList) return;

  // Update item status
  todoStore.updateTodoItemInList(props.currentList.id, itemId, { isDone });

  // Recalculate entire list status
  const list = todoStore.listOfTodos.find(
    (l) => l.id === props.currentList?.id
  );
  if (list) {
    const allDone = list.list.every((item) => item.isDone);
    todoStore.updateTodoList(props.currentList.id, { isDone: allDone });
  }
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
    // const allInputs = inputRefs.value.filter((input) => input !== null);
    // console.log("All Inputs", allInputs);
    // const nextInput = allInputs[allInputs.length - 1];

    // console.log(nextInput?.firstChild);
    // if (nextInput) {
    //   nextInput.focus();
    //   console.log("Focused");
    // }

    // Query all input[type="text"] elements inside the list container
    const inputs = listContainer.value?.querySelectorAll('input[type="text"]');

    const lastInput = inputs?.[inputs.length - 1] as
      | HTMLInputElement
      | undefined;

    if (lastInput?.focus) {
      lastInput.focus();
    } else {
      console.warn("Could not find the new input to focus.");
    }
  }
};

onUpdated(() => {
  // Reset refs to match current rendered inputs
  inputRefs.value = inputRefs.value.filter(Boolean);
});

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

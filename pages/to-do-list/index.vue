<template>
  <div class="w-full h-full flex justify-center">
    <div class="w-full h-full p-2 sm:p-4 flex flex-col gap-y-5 md:gap-y-7">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="hidden md:block text-2xl lg:text-3xl font-heading">
          Your To Do Lists
        </h1>
        <Button
          v-if="todoStore?.listOfTodos?.length > 0"
          class="text-white shadow-none !rounded-xl flex items-center justify-center gap-2 px-4 py-2"
          title="To do list"
          @click="navigateToNewList"
        >
          <Plus :size="16" />
          <span>New ToDo List</span>
        </Button>
      </div>

      <!-- List of to dos -->
      <div
        v-if="todoStore?.listOfTodos?.length > 0"
        class="w-full h-[calc(100%-40px)] flex flex-col gap-4"
      >
        <!-- Filters -->
        <div
          class="flex flex-wrap md:flex-nowrap flex-row items-center gap-3 mb-4 flex-shrink-0"
        >
          <!-- Search Bar -->
          <div class="flex-grow flex items-center gap-2">
            <InputText
              v-model="searchQuery"
              placeholder="Search to-do lists..."
              class="w-full p-2 !rounded-xl font-content text-sm xl:text-base"
            />
          </div>

          <div class="max-w-full flex items-center gap-3">
            <!-- Sorting Options -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <Dropdown
                v-model="sortOption"
                :options="sortOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Sort lists"
                class="w-48 !rounded-xl font-content text-sm xl:text-base"
              />
            </div>

            <!-- Filter on the basis of completion status -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <Dropdown
                v-model="completionFilter"
                :options="completionFilterOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Filter by status"
                class="w-48 !rounded-xl font-content text-sm xl:text-base"
              />
            </div>
          </div>
        </div>

        <div
          v-if="filteredAndSortedTodos?.length > 0 && userStore?.enabledFeatures.includes('todo')"
          class="flex-grow grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto"
        >
          <div
            v-for="(listItem, index) in filteredAndSortedTodos"
            :key="index"
            class="h-fit flex flex-row items-start gap-x-3 p-2 md:p-3 rounded-lg sm:rounded-xl shadow-md bg-rose-800 font-content"
          >
            <div class="mt-1 flex-shrink-0">
              <Checkbox :value="listItem.isDone" />
            </div>
            <div class="flex-grow">
              <h3
                class="w-fit text-base sm:text-lg 2xl:text-xl underline cursor-pointer line-clamp-1"
                @click="navigateToList(listItem.id)"
              >
                {{ listItem.title }}
              </h3>
              <span class="text-xs sm:text-sm text-rose-200">{{
                formatTimestamp(listItem.timestamp)
              }}</span>
            </div>
            <div class="flex-shrink-0">
              <Button
                class="text-white shadow-none rounded-2xl"
                :text="true"
                title="Delete to do list"
                @click="confirmDelete(listItem)"
              >
                <Trash :size="16" />
              </Button>
            </div>
          </div>
        </div>

        <div v-else class="flex-grow flex flex-col justify-center items-center">
          <img
            :src="NoRecordsImage"
            class="max-w-80 select-none pointer-events-none"
          />
          <p class="text-base lg:text-lg mb-3 italic">
            No to-do list is found for this query
          </p>
        </div>
      </div>

      <!-- if no list of to dos is present -->
      <div
        v-else
        class="w-full h-[calc(100%-40px)] flex flex-col justify-center items-center font-content"
      >
        <img
          :src="EmptyBoxImage"
          class="max-w-80 select-none pointer-events-none"
        />
        <p class="text-base lg:text-lg mb-3 italic">No to-do list is present</p>
        <Button
          class="text-white shadow-none !rounded-xl flex items-center justify-center gap-2 px-4 py-2 font-content"
          title="To do list"
          @click="navigateToNewList"
        >
          <Plus :size="16" />
          <span>New To Do List</span>
        </Button>
      </div>
    </div>

    <ConfirmDialog></ConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { Plus, Trash } from "lucide-vue-next";
// import NotFoundImage from "~/assets/illustrations/pageNotFoundRose.svg";
import EmptyBoxImage from "~/assets/illustrations/emptyBoxRose.svg";
import NoRecordsImage from "~/assets/illustrations/noRecordsRose.svg";
import { v4 as uuidv4 } from "uuid";
import { ref, computed } from "vue";
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import InputText from "primevue/inputtext";
import Dropdown from "primevue/dropdown";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";

const confirm = useConfirm();

const router = useRouter();
  const todoStore = useTodoStore();
const userStore = useUserSetupStore();

// Search state
const searchQuery = ref("");

// Sort state
const sortOption = ref("timestamp_desc");
const sortOptions = [
  { label: "Title (A-Z)", value: "title_asc" },
  { label: "Title (Z-A)", value: "title_desc" },
  { label: "Date (Newest first)", value: "timestamp_desc" },
  { label: "Date (Oldest first)", value: "timestamp_asc" },
];

const completionFilter = ref("all");
const completionFilterOptions = computed(() => {
  const allCount = todoStore.listOfTodos.length;
  const completedCount = todoStore.completedLists.length;
  const activeCount = todoStore.activeLists.length;

  return [
    { label: `All (${allCount})`, value: "all" },
    { label: `Completed (${completedCount})`, value: "completed" },
    { label: `Active (${activeCount})`, value: "active" },
  ];
});

// Format timestamp
const formatTimestamp = (timestamp: string | number | Date) => {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Computed property for filtered and sorted todos
const filteredAndSortedTodos = computed(() => {
  // First, filter todos based on search query
  let result = [...todoStore.listOfTodos];

  // 1. Filter by search
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    result = result.filter((todo) => todo.title.toLowerCase().includes(query));
  }

  // 2. Filter by completion status
  if (completionFilter.value === "completed") {
    result = result.filter((todo) => todo.isDone);
  } else if (completionFilter.value === "active") {
    result = result.filter((todo) => !todo.isDone);
  }

  // Parse sort option to get field and direction
  const [field, direction] = sortOption.value.split("_");
  const isAscending = direction === "asc";

  // Then, sort the filtered results
  result?.sort((a, b) => {
    if (field === "title") {
      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();

      return isAscending
        ? titleA.localeCompare(titleB) // ascending (A-Z)
        : titleB.localeCompare(titleA); // descending (Z-A)
    } else {
      // Sort by timestamp
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();

      return isAscending
        ? dateA - dateB // ascending (older first)
        : dateB - dateA; // descending (newer first)
    }
  });

  return result;
});

// Confirmation dialog for delete
const confirmDelete = (listItem: any) => {
  confirm.require({
    message: `Are you sure you want to delete "${listItem.title}"?`,
    header: "Confirm Deletion",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    accept: () => {
      todoStore.deleteTodoList(listItem.id);
    },
    reject: () => {
      // Optional: You can add a notification here if you want
    },
  });
};

// Navigation function
const navigateToList = (listId: string) => {
  router.push(`/to-do-list/${listId}`);
};

// Navigation function for new list
const navigateToNewList = () => {
  const newListId = uuidv4(); // Generate a new UUID
  router.push(`/to-do-list/${newListId}`);
};
</script>

<style scoped></style>

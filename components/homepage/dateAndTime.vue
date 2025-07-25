<template>
  <div class="w-full h-full pt-5 flex">
    <!-- Optional: Time icon -->
    <!--
    <div class="aspect-square flex justify-center items-center">
      <img :src="icon" alt="time icon" class="w-full" />
    </div>
    -->
    <div class="w-full flex flex-col gap-y-4">
      <div class="flex flex-row justify-between items-center w-full">
        <!-- <h1 class="text-2xl md:text-4xl font-heading">{{ formattedDate }}</h1>
      <h2 class="text-xl md:text-3xl uppercase">{{ currentTime }}</h2> -->
        <h1 v-if="userName" class="text-2xl md:text-4xl font-heading">
          {{ greetingMessage }}, {{ userName }}!
        </h1>

        <!-- Search Button -->
        <Button
          class="w-fit px-4 py-2 !rounded-xl text-white"
          icon="pi pi-search"
          @click="showSearchModal = true"
          ><Search :size="20" />
        </Button>
      </div>

      <QuoteOfTheDay />
    </div>

    <!-- Search Modal -->
    <Dialog
      v-model:visible="showSearchModal"
      modal
      class="w-full sm:w-[30rem] absolute sm:static !bottom-0 h-full sm:h-[30rem]"
      maximizable
      dismissable-mask
      :draggable="false"
    >
      <template #header
        ><h2 class="font-heading text-xl md:text-2xl">Search</h2></template
      >
      <InputText
        v-model="searchQuery"
        placeholder="Type to search..."
        class="w-full p-2 !rounded-xl font-content text-base"
        autofocus
      />

      <div
        v-for="list in todoSearchResults"
        :key="list?.id"
        class="mt-3 p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl"
      >
        <h3 class="font-subheading text-lg mb-2">
          {{ list?.title }}
          <span
            v-if="list?._titleMatchOnly"
            class="text-xs text-zinc-500 dark:text-zinc-400 italic ml-2"
          >
            (title match)
          </span>
        </h3>

        <ul v-if="!list?._titleMatchOnly" class="space-y-1">
          <li
            v-for="item in list?.filteredItems"
            :key="item?.id"
            class="text-sm text-zinc-700 dark:text-zinc-200"
          >
            • {{ item?.text }}
          </li>
        </ul>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { Search } from "lucide-vue-next";
import { ref, onMounted } from "vue";
import QuoteOfTheDay from "./quoteOfTheDay/quoteOfTheDay.vue";

const userStore = useUserSetupStore();
const userName = userStore.userName;

const todoStore = useTodoStore();

const searchIndex = ref<
  {
    listId: string;
    title: string;
    items: { id: string; text: string }[];
  }[]
>([]);

const currentDate = ref("");
const currentTime = ref("");
const formattedDate = ref("");
const greetingMessage = ref("");
const icon = ref("");

// state for modal & search input
const showSearchModal = ref(false);
const searchQuery = ref("");
const rawQuery = ref("");

let debounceTimer: number | null = null;

watch(
  () => todoStore.listOfTodos,
  (lists) => {
    searchIndex.value = lists.map((list) => ({
      listId: list.id,
      title: list.title.toLowerCase(),
      items: list.list.map((item) => ({
        id: item.id,
        text: item.text.toLowerCase(),
      })),
    }));
  },
  { immediate: true, deep: true }
);

// Computed search results
const todoSearchResults = computed(() => {
  const query = searchQuery.value;
  if (!query) return [];

  return searchIndex.value
    .map(({ listId, title, items }) => {
      const titleMatches = title.includes(query);
      const matchingItems = items.filter((item) => item.text.includes(query));

      if (titleMatches || matchingItems.length > 0) {
        const fullList = todoStore.listOfTodos.find((l) => l.id === listId);
        return {
          ...fullList!,
          filteredItems: titleMatches
            ? fullList!.list
            : matchingItems.map((i) =>
                fullList!.list.find((item) => item.id === i.id)
              ),
          _titleMatchOnly: titleMatches && matchingItems.length === 0,
        };
      }

      return null;
    })
    .filter(Boolean);
});

const updateDateTime = () => {
  const now = new Date();
  currentDate.value = now.toLocaleDateString();
  currentTime.value = now.toLocaleTimeString();

  const day = now.getDate();
  let month = now.toLocaleString("default", { month: "long" }).toLowerCase();
  month = month.charAt(0).toUpperCase() + month.slice(1);
  const year = now.getFullYear();

  const daySuffix = (day: number) => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  formattedDate.value = `${day}${daySuffix(day)} of ${month}, ${year}`;

  const hours = now.getHours();
  if (hours >= 5 && hours < 12) {
    icon.value = "/sunrise.svg";
    greetingMessage.value = "Good Morning";
  } else if (hours >= 12 && hours < 17) {
    icon.value = "/sun.svg";
    greetingMessage.value = "Good Afternoon";
  } else if (hours >= 17 && hours < 20) {
    icon.value = "/sunset.svg";
    greetingMessage.value = "Good Evening";
  } else {
    icon.value = "/moon.svg";
    greetingMessage.value = "Good Night";
  }
};

onMounted(() => {
  updateDateTime();
  setInterval(updateDateTime, 1000);
});
</script>

<style scoped>
.aspect-square {
  aspect-ratio: 1/1;
}
</style>

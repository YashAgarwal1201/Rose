<template>
  <div class="w-full h-full pt-5 flex">
    <!-- Optional: Time icon -->
    <!--
    <div class="aspect-square flex justify-center items-center">
      <img :src="icon" alt="time icon" class="w-full" />
    </div>
    -->
    <div class="w-full flex flex-col gap-y-2">
      <div class="flex flex-row justify-between items-center w-full">
        <!-- <h1 class="text-2xl md:text-4xl font-heading">{{ formattedDate }}</h1>
      <h2 class="text-xl md:text-3xl uppercase">{{ currentTime }}</h2> -->
        <h1 v-if="userName" class="text-2xl md:text-4xl font-heading">
          {{ greetingMessage }}, {{ userName }}!
        </h1>

        <!-- Search Button -->
        <Button
          class="mt-3 w-fit px-4 py-2 !rounded-xl text-white"
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
      class="w-full md:w-[30rem] h-[30rem]"
      maximizable
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
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { Search } from "lucide-vue-next";
import { ref, onMounted } from "vue";
import QuoteOfTheDay from "../quoteOfTheDay/quoteOfTheDay.vue";

const userStore = useUserSetupStore();
const userName = userStore.userName;

const currentDate = ref("");
const currentTime = ref("");
const formattedDate = ref("");
const greetingMessage = ref("");
const icon = ref("");

// state for modal & search input
const showSearchModal = ref(false);
const searchQuery = ref("");

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

<template>
  <div class="w-full h-full p-3 flex">
    <div class="aspect-square flex justify-center items-center">
      <img :src="icon" alt="time icon" class="w-full" />
      <!-- <img :src="`/logo.svg`" alt="" /> -->
    </div>

    <div class="flex flex-col justify-center ml-4">
      <h1 class="text-2xl md:text-4xl font-heading">{{ formattedDate }}</h1>
      <h2 class="text-xl md:text-3xl uppercase">{{ currentTime }}</h2>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const currentDate = ref("");
const currentTime = ref("");
const formattedDate = ref("");
const icon = ref("");

const updateDateTime = () => {
  const now = new Date();
  currentDate.value = now.toLocaleDateString();
  currentTime.value = now.toLocaleTimeString();

  const day = now.getDate();
  let month = now.toLocaleString("default", { month: "long" }).toLowerCase(); // Convert month to lowercase
  month = month.charAt(0).toUpperCase() + month.slice(1); // Ensures lowercase month
  const year = now.getFullYear();

  const daySuffix = (day: number) => {
    if (day > 3 && day < 21) return "th"; // 4th-20th
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
    icon.value = "/sunrise.svg"; // Morning icon
  } else if (hours >= 12 && hours < 17) {
    icon.value = "/ll.svg"; // Afternoon icon
  } else if (hours >= 17 && hours < 20) {
    icon.value = "/sunset.svg"; // Evening icon
  } else {
    icon.value = "/sunset.svg"; // Night icon
  }
};

onMounted(() => {
  updateDateTime();
  setInterval(updateDateTime, 1000); // Update every second
});
</script>

<style scoped>
.aspect-square {
  aspect-ratio: 1/1;
}
</style>

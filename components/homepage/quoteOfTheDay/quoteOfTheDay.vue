<template>
  <div class="w-full p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 font-content">
    <div v-if="quote" class="flex flex-col items-start gap-y-2">
      <p class="text-lg italic text-zinc-800 dark:text-zinc-100">
        "{{ quote.text }}"
      </p>
      <p class="text-sm text-zinc-500 dark:text-zinc-400 font-medium self-end">
        — {{ quote.author }}
        <!-- <span>({{ quote.source }})</span> -->
      </p>
    </div>
    <div v-else class="text-center text-zinc-500 italic">Loading quote...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

type Quote = {
  text: string;
  author: string;
  source: "Star Wars" | "Marvel" | "Harry Potter";
};

const quotes: Quote[] = [
  // ⭐️ Star Wars
  {
    text: "Do. Or do not. There is no try.",
    author: "Yoda",
    source: "Star Wars",
  },
  { text: "I am your father.", author: "Darth Vader", source: "Star Wars" },
  {
    text: "I’ve got a bad feeling about this.",
    author: "Various",
    source: "Star Wars",
  },
  { text: "Never tell me the odds!", author: "Han Solo", source: "Star Wars" },
  {
    text: "The Force will be with you. Always.",
    author: "Obi-Wan Kenobi",
    source: "Star Wars",
  },
  {
    text: "Your focus determines your reality.",
    author: "Qui-Gon Jinn",
    source: "Star Wars",
  },
  {
    text: "So this is how liberty dies... with thunderous applause.",
    author: "Padmé Amidala",
    source: "Star Wars",
  },
  {
    text: "I find your lack of faith disturbing.",
    author: "Darth Vader",
    source: "Star Wars",
  },

  // 🦸 Marvel
  {
    text: "I can do this all day.",
    author: "Captain America",
    source: "Marvel",
  },
  { text: "I am Iron Man.", author: "Tony Stark", source: "Marvel" },
  { text: "Hulk smash!", author: "Hulk", source: "Marvel" },
  {
    text: "Genius, billionaire, playboy, philanthropist.",
    author: "Tony Stark",
    source: "Marvel",
  },
  { text: "Wakanda forever!", author: "T'Challa", source: "Marvel" },
  {
    text: "Whatever happens tomorrow, you must promise me one thing. That you will stay who you are.",
    author: "Dr. Erskine",
    source: "Marvel",
  },
  { text: "We are Groot.", author: "Groot", source: "Marvel" },
  {
    text: "With great power comes great responsibility.",
    author: "Uncle Ben",
    source: "Marvel",
  },

  // 🧙 Harry Potter
  {
    text: "It does not do to dwell on dreams and forget to live.",
    author: "Albus Dumbledore",
    source: "Harry Potter",
  },
  {
    text: "Happiness can be found even in the darkest of times, if one only remembers to turn on the light.",
    author: "Albus Dumbledore",
    source: "Harry Potter",
  },
  {
    text: "I solemnly swear that I am up to no good.",
    author: "Harry Potter",
    source: "Harry Potter",
  },
  {
    text: "After all this time? Always.",
    author: "Severus Snape",
    source: "Harry Potter",
  },
  {
    text: "Fear of a name increases fear of the thing itself.",
    author: "Hermione Granger",
    source: "Harry Potter",
  },
  {
    text: "We're all human, aren't we? Every human life is worth the same, and worth saving.",
    author: "Kingsley Shacklebolt",
    source: "Harry Potter",
  },
  {
    text: "The ones that love us never really leave us.",
    author: "Sirius Black",
    source: "Harry Potter",
  },
  {
    text: "Working hard is important, but there is something that matters even more: believing in yourself.",
    author: "Harry Potter",
    source: "Harry Potter",
  },

  // Add more quotes if needed (up to 100)
];

const quote = ref<Quote | null>(null);

const pickQuoteForToday = () => {
  const today = new Date().toDateString();
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = today.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % quotes.length;
  quote.value = quotes[index];
};

onMounted(() => {
  pickQuoteForToday();
});
</script>

<style scoped>
/* Optional styling if you want to customize more */
</style>

<template>
  <div class="w-full h-full flex justify-center items-center py-2">
    <div class="w-full h-full flex flex-row">
      <div class="w-[350px] hidden lg:block flex-shrink-0 h-full">
        <ListOfSketchNotes />
      </div>
      <div class="max-w-full flex-grow h-full mx-auto flex">
        <div class="flex w-full max-w-7xl h-full rounded-lg">
          <SketchNotesContainer />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ListOfSketchNotes from "~/components/sketchNotes/listOfSketchNotes.vue";

const toast = useToast();

const route = useRoute();
const router = useRouter();
const todoStore = useTodoStore();

const listId = computed(() => route.params.id as string);

const currentList = computed(() =>
  todoStore.listOfTodos.find((list) => list.id === listId.value)
);
</script>

<style scoped></style>

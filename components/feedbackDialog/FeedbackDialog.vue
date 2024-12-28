<template>
  <div>
    <USlideover
      :model-value="headerStore.showFeedback"
      :appear="true"
      side="right"
      ><div class="flex flex-col">
        <div class="flex justify-between items-start p-5">
          <h2 class="font-heading text-xl sm:text-2xl lg:text-3xl text-color5">
            Have some suggestions?
          </h2>
          <UButton
            icon="material-symbols:close-rounded"
            @click="closeFeedbackDialogHandle"
            class="self-end bg-transparent rounded-full"
            variant="outline"
          />
        </div>
        <div class="w-full px-5 pb-5"></div>
      </div>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
const headerStore = useHeaderStore();

const closeFeedbackDialogHandle = () => {
  headerStore.showFeedback = false;
  headerStore.showSideMenu = true;
};
</script>

<style scoped></style>

<template>
  <div>
    <USlideover :model-value="isSideMenuVisible" :appear="true" side="right">
      <UButton label="close" @click="closeSideMenu" />
      <div>sd</div>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
const { isSideMenuVisible, closeSideMenu } = useSideMenu();

watch(isSideMenuVisible, () => {
  console.log(isSideMenuVisible);
});
</script>

<style scoped></style>

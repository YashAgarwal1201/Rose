<template>
  <div class="w-full h-full flex flex-col md:flex-row">
    <div class="w-full md:w-[70px] h-[60px] md:h-full"><Navbar /></div>
    <div class="w-full md:w-[calc(100%-70px)] h-[calc(100%-60px)] md:h-full">
      <slot />
    </div>

    <TransactionsHistoryModal />

    <USlideover :visible="isSideMenuVisible">
      <div>sd</div>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
import TransactionsHistoryModal from "~/components/expenseCalculator/TransactionsHistoryModal.vue";
import Navbar from "~/components/navbar/navbar.vue";

const { isSideMenuVisible, toggleSideMenu, closeSideMenu } = useSideMenu();
</script>

<style lang="css">
.page-enter-active,
.page-leave-active {
  transition: all 0.4s;
}
.page-enter-from,
.page-leave-to {
  filter: blur(1rem);
  opacity: 0;
}
</style>

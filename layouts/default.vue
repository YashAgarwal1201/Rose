<template>
  <div class="w-full h-full flex flex-col md:flex-row font-content">
    <div class="w-full md:w-[70px] h-[60px] md:h-full"><Navbar /></div>
    <div class="w-full md:w-[calc(100%-70px)] h-[calc(100%-60px)] md:h-full">
      <slot />
    </div>

    <TransactionsHistoryModal />

    <SideMenu />

    <FeedbackDialog />
  </div>
</template>

<script setup lang="ts">
import TransactionsHistoryModal from "~/components/expenseCalculator/TransactionsHistoryModal.vue";
import Navbar from "~/components/navbar/navbar.vue";
import SideMenu from "~/components/sideMenu/SideMenu.vue";
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

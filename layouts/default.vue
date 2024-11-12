<template>
  <div class="w-full h-full flex flex-col md:flex-row">
    <div class="w-full md:w-[70px] h-[60px] md:h-full"><Navbar /></div>
    <div class="w-full md:w-[calc(100%-70px)] h-[calc(100%-60px)] md:h-full">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="css">
.page-enter-active,
.page-leave-active {
  transition: all 0.4s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(1rem);
}
</style>

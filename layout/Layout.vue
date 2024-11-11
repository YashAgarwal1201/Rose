<template>
  <div class="w-full h-full flex">
    <div class="w-full md:w-[70px] h-[60px] md:h-full">Navbar</div>
    <div class="w-full md:w-[calc(100%-70px)] h-[calc(100%-60px)] md:h-full">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped></style>

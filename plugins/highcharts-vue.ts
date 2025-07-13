// ~/plugins/highcharts-vue.ts
import { defineNuxtPlugin } from "#app";
import HighchartsVue from "highcharts-vue";

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.client) {
    nuxtApp.vueApp.use(HighchartsVue);
  }
});

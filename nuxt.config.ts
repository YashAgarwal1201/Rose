// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },

  devServer: {
    port: 5176,
    host: "0.0.0.0",
  },

  app: {
    pageTransition: { name: "page", mode: "out-in" },
    layoutTransition: {
      name: "slide",
      mode: "out-in",
    },
  },

  modules: ["@nuxt/ui", "@pinia/nuxt"],
  plugins: [
    { src: "~/plugins/highcharts-vue.ts", mode: "client" }, // Only include on the client
  ],
});

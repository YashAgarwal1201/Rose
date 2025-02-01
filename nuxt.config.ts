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
    layoutTransition: { name: "slide", mode: "out-in" },
  },

  ui: {
    safelistColors: ["orange"],
  },

  modules: ["@nuxt/ui", "@pinia/nuxt", "@nuxt/fonts"],
  plugins: [
    { src: "~/plugins/highcharts-vue.ts", mode: "client" }, // Only include on the client
  ],

  tailwindcss: {
    config: {
      theme: {
        extend: {
          fontFamily: {
            heading: ["Raleway", "sans-serif"], // Raleway for headings
            content: ["Inter", "sans-serif"], // Inter for content
          },
        },
      },
      plugins: [
        function ({
          addUtilities,
        }: {
          addUtilities: (utilities: object) => void;
        }) {
          addUtilities({
            ".scrollbar-hide": {
              "-ms-overflow-style": "none", // IE & Edge
              "scrollbar-width": "none", // Firefox
              "&::-webkit-scrollbar": { display: "none" }, // Chrome, Safari
            },
            ".scrollbar-default": {
              "-ms-overflow-style": "auto",
              "scrollbar-width": "auto",
              "&::-webkit-scrollbar": { display: "block" },
            },
          });
        },
      ],
    },
  },

  fonts: { families: [{ name: "Raleway", provider: "google" }] },
});

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

  modules: ["@nuxt/ui", "@pinia/nuxt", "@nuxt/fonts", "@vite-pwa/nuxt"],
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
              "-ms-overflow-style": "none",
              "scrollbar-width": "none",
              "&::-webkit-scrollbar": {
                display: "none",
              },
            },
            ".scrollbar-default": {
              "-ms-overflow-style": "auto",
              "scrollbar-width": "auto",
              "&::-webkit-scrollbar": {
                display: "block",
                width: "8px",
                height: "8px",
              },
              "&::-webkit-scrollbar-track": {
                background: "#f1f1f1",
                borderRadius: "100vh",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "#c1c1c1",
                borderRadius: "100vh",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                background: "#a8a8a8",
              },
            },
          });
        },
      ],
    },
  },

  fonts: { families: [{ name: "Raleway", provider: "google" }] },

  pwa: {
    // registerType: "autoUpdate",
    manifest: {
      name: "Project Rose",
      short_name: "Rose",
      description: "A Nuxt 3 Progressive Web App",
      theme_color: "#ffffff",
      background_color: "#ffffff",
      display: "standalone",
      icons: [
        {
          src: "/icon-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    },
  },
});

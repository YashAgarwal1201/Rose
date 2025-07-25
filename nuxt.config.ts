import MyPreset from "./MyPreset";
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },

  devServer: {
    port: 5176,
    host: "0.0.0.0",
  },
  build: {
    analyze: false,
  },
  css: ["~/assets/css/main.css"],
  ssr: false, // Disable server-side rendering (hack)

  app: {
    pageTransition: { name: "page", mode: "out-in" },
    layoutTransition: { name: "slide", mode: "out-in" },
    head: {
      title: "Project Rose",
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/logo.svg" },
        { rel: "apple-touch-icon", href: "/logo.svg" },
      ],
    },
  },

  modules: [
    "@pinia/nuxt",
    [
      "@nuxtjs/color-mode",
      {
        classSuffix: "", // so it adds `dark` or `light` directly (not `dark-mode`, etc.)
        preference: "dark", // default value (can be 'light', 'dark' or 'system')
        fallback: "light", // fallback when system preference can't be determined
        storageKey: "nuxt-color-mode", // key used in localStorage
      },
    ],
    "@nuxt/fonts",
    "@vite-pwa/nuxt",
    "@primevue/nuxt-module",
  ],
  plugins: [{ src: "~/plugins/highcharts-vue.ts", mode: "client" }],

  // fonts: { families: [{ name: "Raleway", provider: "google" }] },

  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "Project Rose",
      short_name: "Rose",
      description: "A Nuxt 3 Progressive Web App",
      theme_color: "#9f1239",
      background_color: "#0a0a0a",
      display: "standalone",
      icons: [
        {
          src: "/logo.svg",
          sizes: "any",
          type: "image/svg+xml",
        },
      ],
    },
    workbox: {
      globPatterns: ["**/*.{js,css,html,ico,png,svg,ts}"],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.bunny\.net\/.*/i,
          handler: "CacheFirst",
          method: "GET",
          options: {
            cacheName: "bunny-fonts",
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
          },
        },
        {
          urlPattern: /^https:\/\/projectt-rose.vercel\.app\/.*$/,
          handler: "NetworkFirst",
          options: {
            cacheName: "api-cache",
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 300,
            },
          },
        },
      ],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: true,
      type: "module",
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  primevue: {
    autoImport: true,
    options: {
      ripple: true,
      inputVariant: "filled",
      theme: {
        preset: MyPreset,
        options: {
          prefix: "p",
          darkModeSelector: "system",
          cssLayer: false,
        },
      },
    },
  },

  runtimeConfig: {
    // Private (only on server)
    // privateApiKey: process.env.PRIVATE_API_KEY,

    // Public (client + server)
    public: {
      devProfileUrl: process.env.NUXT_PUBLIC_DEVELOPER_PROFILE_URL,
    },
  },
});

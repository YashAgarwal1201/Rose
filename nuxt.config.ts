// https://nuxt.com/docs/api/configuration/nuxt-config
// import { definePreset } from "@primeuix/themes";
// import Aura from "@primeuix/themes/aura";
import MyPreset from "./MyPreset";
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },

  devServer: {
    port: 5176,
    host: "0.0.0.0",
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
    // "@nuxt/ui",
    "@pinia/nuxt",
    "@nuxt/fonts",
    "@vite-pwa/nuxt",
    "@primevue/nuxt-module",
  ],
  plugins: [
    { src: "~/plugins/highcharts-vue.ts", mode: "client" }, // Only include on the client
  ],

  // tailwindcss: {
  //   configPath: "tailwind.config.ts", // ✅ Reference the external Tailwind config
  //   quiet: true, // ✅ Suppresses warnings
  // },

  fonts: { families: [{ name: "Raleway", provider: "google" }] },

  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "Project Rose",
      short_name: "Rose",
      description: "A Nuxt 3 Progressive Web App",
      theme_color: "#ffffff",
      background_color: "#ffffff",
      display: "standalone",
      icons: [
        {
          src: "/logo.svg",
          sizes: "any",
          type: "image/svg+xml",
        },
      ],
    },
    // workbox: {
    //   navigateFallback: "/",
    //   globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
    // },
    client: {
      installPrompt: true,
      // Prompt PWA install on supported browsers
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
});

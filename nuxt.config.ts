import MyPreset from "./MyPreset";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";

const isLocalDev = process.env.NODE_ENV === "development";

export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },

  devServer: {
    port: 5176,
    host: "0.0.0.0",
    ...(isLocalDev &&
    fs.existsSync("./localhost-key.pem") &&
    fs.existsSync("./localhost.pem")
      ? {
          https: {
            key: fs.readFileSync("./localhost-key.pem", "utf8"),
            cert: fs.readFileSync("./localhost.pem", "utf8"),
          },
        }
      : {}),
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
    "@nuxt/fonts",
    "@vite-pwa/nuxt",
    "@primevue/nuxt-module",
  ],

  plugins: [{ src: "~/plugins/highcharts-vue.ts", mode: "client" }],

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
});

import { globalIgnores } from "eslint/config";
import { defineConfigWithVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";
import pluginVue from "eslint-plugin-vue";
import pluginPlaywright from "eslint-plugin-playwright";
import pluginVitest from "@vitest/eslint-plugin";
import pluginOxlint from "eslint-plugin-oxlint";
import skipFormatting from "eslint-config-prettier/flat";

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// Import { configureVueProject } from '@vue/eslint-config-typescript'
// ConfigureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    files: ["**/*.{vue,ts,mts,tsx}"],
    name: "app/files-to-lint",
  },

  globalIgnores(["**/dist/**", "**/dist-ssr/**", "**/coverage/**"]),

  ...pluginVue.configs["flat/essential"],
  vueTsConfigs.recommended,

  {
    ...pluginPlaywright.configs["flat/recommended"],
    files: ["e2e/**/*.{test,spec}.{js,ts,jsx,tsx}"],
  },

  {
    ...pluginVitest.configs.recommended,
    files: ["src/**/__tests__/*"],
    rules: {
      ...pluginVitest.configs.recommended.rules,
      "vitest/require-hook": "off", // ← add this
    },
  },

  {
    files: ["src/components/Breadcrumbs.vue", "src/components/Sidebar.vue"],
    rules: {
      "vue/multi-word-component-names": "off",
    },
  },

  ...pluginOxlint.buildFromOxlintConfigFile(".oxlintrc.json"),

  skipFormatting,
);

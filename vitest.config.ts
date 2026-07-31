// vitest.config.ts
import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default defineConfig((configEnv) =>
  mergeConfig(
    typeof viteConfig === "function" ? viteConfig(configEnv) : viteConfig,
    defineConfig({
      test: {
        environment: "jsdom",
        exclude: [...configDefaults.exclude, "e2e/**"],
        root: fileURLToPath(new URL("./", import.meta.url)),
        setupFiles: ["./src/__tests__/setup.ts"],
        reporters: ["default", "html"],
        coverage: {
          provider: "v8",
          reporter: ["text", "json", "html"],
        },
      },
    }),
  ),
);

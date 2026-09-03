// vite.config.ts
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { resolve } from "node:path";
import { defineConfig, type Plugin, type ResolvedConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

function getBuildVersion() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `v1.${day}.${month}.${year}`;
}

// Injects the emitted asset list into the built sw.js at build time.
// Runs after `writeBundle`, since public/sw.js is copied post-bundle
// and never appears in the Rollup bundle graph. Never touches dev server.
function swManifestPlugin(): Plugin {
  let resolvedConfig: ResolvedConfig | undefined = undefined;

  return {
    apply: "build",
    configResolved(config) {
      resolvedConfig = config;
    },
    name: "sw-manifest",
    writeBundle(_outputOptions, bundle) {
      if (!resolvedConfig) {
        return;
      }

      const assets = Object.keys(bundle)
        .filter((name) => !name.endsWith(".map") && name !== "sw.js")
        .map((name) => `/${name}`);
      const precacheList = JSON.stringify(["/", "/index.html", ...assets]);

      const swPath = resolve(resolvedConfig.root, resolvedConfig.build.outDir, "sw.js");
      if (!existsSync(swPath)) {
        this.warn(
          `sw-manifest: expected sw.js at ${swPath} but it was not found; skipping injection.`,
        );
        return;
      }

      const swCode = readFileSync(swPath, "utf8");
      if (!swCode.includes("__PRECACHE_MANIFEST__")) {
        this.warn(
          "sw-manifest: __PRECACHE_MANIFEST__ placeholder not found in sw.js; skipping injection.",
        );
        return;
      }

      writeFileSync(swPath, swCode.replace("__PRECACHE_MANIFEST__", precacheList));
    },
  };
}

export default defineConfig(({ command }) => {
  const isDev = command === "serve";

  return {
    define: {
      __APP_VERSION__: JSON.stringify(getBuildVersion()),
    },
    plugins: [vue(), tailwindcss(), swManifestPlugin()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@tiptap')) return 'vendor-editor';
              if (id.includes('fabric') || id.includes('perfect-freehand')) return 'vendor-canvas';
              if (id.includes('vue') || id.includes('pinia')) return 'vendor-vue';
              return 'vendor-utils';
            }
          }
        }
      }
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("src", import.meta.url)),
      },
    },
    server: {
      port: 5176,
      ...(isDev && {
        https: {
          cert: readFileSync("certs/localhost.pem"),
          key: readFileSync("certs/localhost-key.pem"),
        },
      }),
    },
  };
});

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, "../../..");

describe("Module Federation Build Verification", () => {
  it("vite.config.ts should contain the correct federation exposes", () => {
    const viteConfigContent = fs.readFileSync(path.resolve(rootDir, "vite.config.ts"), "utf8");

    expect(viteConfigContent).toMatch(/name:\s*["']rose_app["']/);
    expect(viteConfigContent).toMatch(/filename:\s*["']remoteEntry\.js["']/);
    expect(viteConfigContent).toMatch(
      /["']\.\/SharedTodoUI["']:\s*["']\.\/src\/components\/external\/SharedTodoUI\.ts["']/,
    );
    expect(viteConfigContent).toMatch(
      /["']\.\/SharedDocUI["']:\s*["']\.\/src\/components\/external\/SharedDocUI\.ts["']/,
    );
    expect(viteConfigContent).toMatch(
      /["']\.\/SharedNoteUI["']:\s*["']\.\/src\/components\/external\/SharedNoteUI\.ts["']/,
    );
  });

  it.runIf(fs.existsSync(path.resolve(rootDir, "dist")))(
    "dist/assets/remoteEntry.js should exist (if built)",
    () => {
      const remoteEntryPath = path.resolve(rootDir, "dist/assets/remoteEntry.js");
      expect(fs.existsSync(remoteEntryPath)).toBe(true);

      const content = fs.readFileSync(remoteEntryPath, "utf8");
      // Look for evidence of our exposed modules in the compiled bundle
      expect(content).toContain("SharedTodoUI");
      expect(content).toContain("SharedDocUI");
      expect(content).toContain("SharedNoteUI");
    },
  );
});

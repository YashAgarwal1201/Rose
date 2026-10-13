import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../..');

describe('Module Federation Build Verification', () => {
  it('vite.config.ts should contain the correct federation exposes', () => {
    const viteConfigContent = fs.readFileSync(path.resolve(rootDir, 'vite.config.ts'), 'utf-8');
    
    expect(viteConfigContent).toContain("name: 'rose_app'");
    expect(viteConfigContent).toContain("filename: 'remoteEntry.js'");
    expect(viteConfigContent).toContain("'./SharedTodoUI': './src/components/external/SharedTodoUI.ts'");
    expect(viteConfigContent).toContain("'./SharedDocUI': './src/components/external/SharedDocUI.ts'");
    expect(viteConfigContent).toContain("'./SharedNoteUI': './src/components/external/SharedNoteUI.ts'");
  });

  it('dist/assets/remoteEntry.js should exist (if built)', () => {
    const remoteEntryPath = path.resolve(rootDir, 'dist/assets/remoteEntry.js');
    
    // We only assert if the dist folder actually exists to avoid failing in environments where build hasn't run yet
    if (fs.existsSync(path.resolve(rootDir, 'dist'))) {
      expect(fs.existsSync(remoteEntryPath)).toBe(true);
      
      const content = fs.readFileSync(remoteEntryPath, 'utf-8');
      // Look for evidence of our exposed modules in the compiled bundle
      expect(content).toContain('SharedTodoUI');
      expect(content).toContain('SharedDocUI');
      expect(content).toContain('SharedNoteUI');
    } else {
      console.warn('dist/ folder not found, skipping remoteEntry.js verification. Run `npm run build` first.');
    }
  });
});

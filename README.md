# 🌹 Rose

A local-first, client-side productivity app combining todos, handwritten sketching, and lightweight document creation — organized into folders, themeable, and backed entirely by IndexedDB. No backend, no server, no accounts.

## Why "Rose"

Color palette and visual identity are inspired by the rose flower — deep reds/pinks for accents, soft neutrals for surfaces, in both light and dark variants.

## Features (Planned)

- **Todos** — nested folders, list view + inline edit, priorities, due dates
- **Notes** — freehand sketching/handwriting via canvas, with pointer-based palm rejection (pen vs. touch vs. mouse)
- **Docs** — lightweight rich-text document creation
- **Shared UX patterns** across all three: list view, edit view, folder navigation
- **Theming** — system / light / dark, rose-based color tokens
- **Persistence** — 100% client-side via IndexedDB (Dexie.js), no data ever leaves the browser

## Tech Stack

| Concern                   | Choice                                                             |
| ------------------------- | ------------------------------------------------------------------ |
| Framework                 | Vue 3 + TypeScript + Vite                                          |
| Routing                   | Vue Router                                                         |
| State                     | Pinia                                                              |
| Persistence               | Dexie.js (IndexedDB wrapper)                                       |
| Sketching/Handwriting     | Fabric.js                                                          |
| Rich text (Docs, Phase 3) | TipTap                                                             |
| Styling                   | Tailwind CSS (v4, Vite plugin) + CSS custom properties for theming |
| Unit/Component testing    | Vitest + Vue Testing Library + @vue/test-utils                     |
| E2E testing               | Playwright                                                         |
| Linting/Formatting        | ESLint, Prettier, oxlint, oxfmt                                    |

## Getting Started

```bash
npm install
npm run dev
```

## Testing

```bash
npm run test:unit     # Vitest
npm run test:e2e      # Playwright
```

## Project Structure (target)

```
src/
  db/            # Dexie schema + database instance
  stores/        # Pinia stores
  features/
    todos/
    notes/
    docs/
  components/    # Shared UI (folder tree, theme toggle, layout shell)
  router/
  styles/        # Theme tokens, Tailwind config
```

## Data Ownership & Backup

Rose stores everything in your browser's IndexedDB. There is no cloud sync by default. **Clearing browser data will delete your data.** A JSON export/import feature is planned (see ROADMAP.md) — until then, treat this as you would any local-only app: back up manually if the data matters.

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the phased development plan and checklist.

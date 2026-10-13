# Rose

A local-first, client-side productivity app combining todos, handwritten sketching, and lightweight document creation — organized into folders, themeable, and backed entirely by IndexedDB. No backend, no server, no accounts.

## Why "Rose"

Color palette and visual identity are inspired by the rose flower — deep reds/pinks for accents, soft neutrals for surfaces, in both light and dark variants.

## Features

- **Files & Folders** — unified explorer (`/files`) for organizing mixed collections of todos, docs, and notes with `@dnd-kit/vue` drag-and-drop
- **Todos** — nested folders, list view + inline edit, priorities, due dates, and Home "Due Soon" widget
- **Notes** — freehand sketching/handwriting via canvas, with pointer-based palm rejection (pen vs. touch vs. mouse) and vector shapes
- **Docs** — rich-text document editing with tables, CSV import, markdown/PDF export, autofocus, and distraction-free read/edit modes
- **Secure Vault** — zero-knowledge client-side encryption (PBKDF2 + AES-GCM 256-bit) with auto-lock and PIN authentication
- **Trash & Recovery** — safe soft deletion, restore directly to root files directory, and permanent purge
- **Dashboard** — personalized greeting, global search, activity heatmap, contribution breakdown, and due soon tasks
- **Module Federation** — embeddable standalone components (`SharedTodoUI`, `SharedDocUI`, `SharedNoteUI`) for host apps and AI orchestrators
- **Theming** — system / light / dark, rose-based color tokens
- **Persistence** — 100% client-side via IndexedDB (Dexie.js), no data ever leaves the browser

## Tech Stack

| Concern                   | Choice                                                             |
| ------------------------- | ------------------------------------------------------------------ |
| Framework                 | Vue 3 + TypeScript + Vite                                          |
| Routing                   | Vue Router                                                         |
| State                     | Pinia                                                              |
| Persistence               | Dexie.js (IndexedDB wrapper)                                       |
| Sketching/Handwriting     | Fabric.js + perfect-freehand                                       |
| Rich text (Docs)          | TipTap                                                             |
| Drag and Drop             | @dnd-kit/vue                                                       |
| Microfrontends            | @originjs/vite-plugin-federation                                   |
| Cryptography              | Web Crypto API (PBKDF2, AES-GCM 256-bit)                           |
| Styling                   | Tailwind CSS (v4, Vite plugin) + CSS custom properties for theming |
| Unit/Component testing    | Vitest + Vue Testing Library + @vue/test-utils                     |
| E2E testing               | Playwright                                                         |
| Linting/Formatting        | ESLint, Prettier, oxlint, oxfmt                                    |

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup local HTTPS (Required for development)**
   Rose uses HTTPS for local development. You'll need [mkcert](https://github.com/FiloSottile/mkcert) to generate valid local certificates.
   
   Install `mkcert` on your system (e.g., `brew install mkcert` on macOS, or see their [repo](https://github.com/FiloSottile/mkcert) for other OS instructions). Then, generate the certificates in a `certs/` directory:
   ```bash
   mkdir -p certs
   cd certs
   mkcert -install
   mkcert localhost
   cd ..
   ```

3. **Run the dev server**
   ```bash
   npm run dev
   ```

## Testing

```bash
npm run test:unit             # Run Vitest unit tests
npx vitest run --coverage     # Run Vitest with coverage report (V8 + HTML)
npm run test:e2e              # Run Playwright E2E tests
```

Test reports and coverage output are generated in `html/` and `coverage/` directories.

## Project Structure

```
src/
  components/    # Shared UI (folder tree, theme toggle, layout shell, external wrappers)
  composables/   # Shared logic and integrations (notes, docs, explorer, shortcuts, etc.)
  db/            # Dexie schema + database instance + migration types
  router/        # Vue Router setup and route definitions
  stores/        # Pinia stores for state management (todos, notes, docs, folders, trash, vault)
  styles/        # Theme tokens, Tailwind config
  types/         # TypeScript types/interfaces
  utils/         # Helper functions (crypto, formatters, export/import)
  views/         # Feature/Page components
    docs/
    files/
    home/
    notes/
    onboarding/
    settings/
    todos/
    trash/
```

## Data Ownership & Backup

Rose stores everything in your browser's IndexedDB. There is no external cloud dependency.

Built-in JSON backup and restore is available directly in Settings (`/settings`):
- **Export Data**: Download your entire database (or selected stores) into a portable JSON backup file.
- **Import Data**: Restore from backup using either **Merge** (upserts data preserving existing items) or **Replace** (complete clean restore). Legacy data format translation is automatically handled.

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the phased development plan and checklist.

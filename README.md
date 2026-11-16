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

| Concern                | Choice                                                             |
| ---------------------- | ------------------------------------------------------------------ |
| Framework              | Vue 3 + TypeScript + Vite                                          |
| Routing                | Vue Router                                                         |
| State                  | Pinia                                                              |
| Persistence            | Dexie.js (IndexedDB wrapper)                                       |
| Sketching/Handwriting  | Fabric.js + perfect-freehand                                       |
| Rich text (Docs)       | TipTap                                                             |
| Drag and Drop          | @dnd-kit/vue                                                       |
| Microfrontends         | @originjs/vite-plugin-federation                                   |
| Cryptography           | Web Crypto API (PBKDF2, AES-GCM 256-bit)                           |
| Styling                | Tailwind CSS (v4, Vite plugin) + CSS custom properties for theming |
| Unit/Component testing | Vitest + Vue Testing Library + @vue/test-utils                     |
| E2E testing            | Playwright                                                         |
| Linting/Formatting     | ESLint, Prettier, oxlint, oxfmt                                    |

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

## Module Federation Integration Guide

Rose exposes its core feature components as host-isolated microfrontends via [Vite Module Federation](https://github.com/originjs/vite-plugin-federation). Host applications and orchestrators can embed Rose's rich-text document editor, handwriting canvas, or todo lists without pulling in internal routing or conflicting with host styling.

### Exposed Modules

| Remote Export           | Description                                                                                                                            |
| :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| `rose_app/SharedDocUI`  | Standalone TipTap rich-text document editor with table tools, CSV import, markdown/PDF export, and self-contained input/toast dialogs. |
| `rose_app/SharedNoteUI` | Freehand drawing and sketch canvas with pointer-based palm rejection, vector shapes, backgrounds, and image insertion.                 |
| `rose_app/SharedTodoUI` | Todo list manager with task creation, priorities, completion toggles, and detail editing.                                              |

### Architecture & Isolation Guarantees

- **No CSS Pollution**: Layout constraints (`overflow: hidden`, `height: 100dvh`) are scoped to standalone Rose mode. Host `html` and `body` remain unlocked and scrollable.
- **Shortcut Scoping**: Rich-text and canvas shortcuts (`Ctrl+B`, `Ctrl+I`, `Ctrl+K`, `Ctrl+S`, `Ctrl+Z`, etc.) only execute when focus is inside Rose's container. Host global shortcuts (e.g. `Ctrl+K` command palettes) are never intercepted.
- **Multi-Instance Lifecycle**: Framework-agnostic `mount(el, props)` returns `{ app, update, unmount }` with element-keyed instance tracking, avoiding singleton collisions and DOM leaks.
- **Dynamic CORS & Bandwidth Protection**: In production on Cloudflare Pages, edge middleware restricts `/assets/*` access to authorized origins, blocking public hotlinking.

---

### Host Configuration

#### 1. Setup Environment Variables in Host

In your host application's `.env`:

```env
# Local Development (served via Rose's preview server)
VITE_ROSE_REMOTE_URL=http://localhost:4176/assets/remoteEntry.js

# Production (Cloudflare Pages)
# VITE_ROSE_REMOTE_URL=https://rosejournal.pages.dev/assets/remoteEntry.js
```

#### 2. Configure Host `vite.config.ts`

```ts
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const roseRemoteUrl = env.VITE_ROSE_REMOTE_URL || "http://localhost:4176/assets/remoteEntry.js";

  return {
    plugins: [
      vue(),
      federation({
        name: "host_app",
        remotes: {
          rose_app: roseRemoteUrl,
        },
        shared: ["vue"],
      }),
    ],
  };
});
```

> [!NOTE]
> `@originjs/vite-plugin-federation` generates `remoteEntry.js` during **production build**, not dev server mode. When testing integration locally, build and run Rose's preview server:
>
> ```bash
> # In the Rose repository:
> npm run build
> npm run preview -- --port 4176
> ```

---

### Component Contracts

#### `SharedDocUI`

- **Props**:
  - `contentJSON` (`Record<string, unknown> | null`, optional) — TipTap JSON document structure.
  - `title` (`string`, default: `"Shared Document"`) — Document title displayed in the header.
- **Emits / Callbacks**:
  - `change` (`content: Record<string, unknown>`) — Emitted whenever the document content is updated.
  - `notify` (`message: string, type: ToastType`) — Emitted when toasts/alerts fire.

#### `SharedNoteUI`

- **Props**:
  - `canvasJSON` (`Record<string, unknown> | null`, optional) — Fabric.js serialized canvas object.
  - `backgroundColor` (`string`, default: `"#ffffff"`) — Canvas background fill color.
  - `backgroundPattern` (`"solid" | "dots" | "grid" | "ruled"`, default: `"solid"`) — Canvas grid/guide pattern.
  - `title` (`string`, default: `"Shared Note"`) — Note title for export filenames.
- **Emits / Callbacks**:
  - `change` (`canvasJSON, backgroundColor, backgroundPattern, thumbnail`) — Emitted on stroke completion or pattern change.

#### `SharedTodoUI`

- **Props**:
  - `initialTodos` (`Todo[]`, optional) — Array of todo items to seed the component.
  - `title` (`string`, default: `"Shared Todos"`) — Heading for the list.
- **Emits / Callbacks**:
  - `change` (`todos: Todo[]`) — Emitted when todos are added, edited, toggled, or deleted.
  - `notify` (`message: string, type: ToastType`) — Emitted for notifications.

---

### Integration Examples

#### Vue 3 (Async Component)

```vue
<script setup lang="ts">
import { defineAsyncComponent, ref } from "vue";

// Remote component import
const SharedDocUI = defineAsyncComponent(() => import("rose_app/SharedDocUI"));

const docData = ref<Record<string, unknown> | null>(null);

function onDocChange(newContent: Record<string, unknown>) {
  docData.value = newContent;
}
</script>

<template>
  <div class="h-[650px] w-full rounded-xl border border-gray-200 overflow-hidden shadow-sm">
    <SharedDocUI :content-j-s-o-n="docData" title="Project Brief" @change="onDocChange" />
  </div>
</template>
```

#### Vanilla JS / React (`mount` Lifecycle Wrapper)

Every exposed module also exports framework-agnostic `mount(el, props)` and `unmount(el)` functions:

```ts
import { mount, unmount } from "rose_app/SharedDocUI";

const container = document.getElementById("editor-root")!;

// Mount instance
const instance = mount(container, {
  title: "Sprint Planning",
  onChange: (content) => {
    console.log("Updated document content:", content);
  },
});

// Update props dynamically
instance.update({ title: "Sprint Planning (Final)" });

// Clean up when unmounting / navigating away
instance.unmount();
// Or: unmount(container);
```

---

### Production Deployment & Access Control

Rose deploys to **Cloudflare Pages**. An edge function at `functions/assets/[[path]].ts` controls CORS on `/assets/*`:

- By default, requests from `http://localhost:*`, `https://localhost:*`, and `https://*.pages.dev` are allowed.
- To authorize additional production domains, add the `ALLOWED_ORIGINS` environment variable in the Cloudflare Pages dashboard:
  ```env
  ALLOWED_ORIGINS=https://app.mycompany.com, https://dashboard.mycompany.com
  ```
- Unauthorized origins receive an immediate `403 Forbidden`, protecting bandwidth from unauthorized scraping.

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the phased development plan and checklist.

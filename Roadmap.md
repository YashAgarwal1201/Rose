# Rose — Roadmap & Checklist

Development is organized into phases. Each phase should be shippable/usable on its own before moving to the next — this keeps the project honest and avoids a half-finished sprawl across all three features at once.

---

## Phase 0 — Project Foundation

- [x] Scaffold Vue 3 + TS + Vite project (`npm create vue@latest`)
- [x] Install core libraries (dexie, fabric, tiptap, tailwind)
- [x] Install testing tools (Vitest, Playwright, Testing Library)
- [x] Set up folder structure (`src/db`, `src/stores`, `src/features/*`, `src/components`)
- [x] Configure Tailwind v4 via Vite plugin
- [x] Set up base routing shell (`/todos`, `/notes`, `/docs`)
- [x] Set up Pinia store structure (one store per feature + one for UI/theme state)
- [x] Confirm ESLint/Prettier/oxlint all run cleanly on the empty scaffold
- [x] First commit + `.gitignore` sanity check (node_modules, dist, .env etc.)

## Phase 1 — Todos + Folders (V1 core)

- [x] Design Dexie schema for `folders` and `todos` tables
- [x] Dexie database instance + versioning setup (`src/db/index.ts`)
- [x] Pinia store wrapping Dexie CRUD (create/read/update/delete/reorder)
- [x] Folder tree component (nested folders, create/rename/delete/move)
- [x] Todo list view (per folder, with sub-folder navigation)
- [x] Todo inline edit (title, done toggle, priority, due date)
- [x] Basic in-feature search/filter (by title, done/not-done)
- [x] Empty states (no folders yet, empty folder, no todos)
- [x] Theme system: CSS custom property tokens for rose palette
- [x] Theme toggle: light / dark / system, persisted (localStorage) — `useThemeStore` + `MenuOverlay.vue`
- [x] Folder/list duplicate-name validation with user-facing error toasts
- [x] Explorer grid/list view toggle with sort by name/modified date (`ExplorerGrid.vue`, `useExplorerViewMode.ts`)
- [x] Reusable confirm dialog + toast notification system (`useConfirm`, `useToast`, `ConfirmDialog.vue`, `ToastContainer.vue`)
- [x] Breadcrumb navigation with mobile popover trail (`Breadcrumbs.vue`)
- [x] Mobile folder tree drawer + speed-dial create actions (`FolderTreeDrawer.vue`, `ExplorerActions.vue`)
- [x] Todo list "properties" info panel (counts, created/modified timestamps)
- [x] Fix relative-time formatting bug (premature unit rounding in `formatRelativeTime.ts`)
- [x] Surface "Created" date and item type (folder/list) columns in Explorer list view
- [ ] Unit tests: Dexie store logic (add/update/delete/move folder & todo)
- [ ] Component tests: folder tree interactions, todo list rendering
- [ ] E2E test: create folder → add todo → mark done → refresh page → data persists
- [ ] **Checkpoint: Rose is a usable todo app on its own**

## Phase 2 — Notes (Sketching/Handwriting)

- [ ] Dexie schema for `notes` table (folderId, title, canvasJSON, thumbnail, timestamps)
- [ ] Fabric.js canvas component (basic freehand drawing)
- [ ] Pointer event handling: detect `pointerType` (pen/touch/mouse), suppress touch input while pen is active (palm rejection)
- [ ] Toolbar: pen, eraser, color, stroke width, undo/redo
- [ ] Save canvas state to Dexie (`canvas.toJSON()`) on change (debounced)
- [ ] Load canvas state back on note open (`canvas.loadFromJSON()`)
- [ ] Thumbnail generation for notes list view (`canvas.toDataURL()` at low res)
- [ ] Notes list view + folder integration (reuse folder tree component / `ExplorerGrid.vue`)
- [ ] Test on at least one real touch+stylus device (iPad/Surface/Android tablet) — palm rejection behavior can't be fully validated in a desktop browser alone
- [ ] Unit/component tests for note store logic and canvas save/load round-trip
- [ ] **Checkpoint: Rose supports todos + handwritten notes**

## Phase 3 — Docs

- [ ] Dexie schema for `docs` table (folderId, title, contentJSON, timestamps)
- [ ] TipTap editor component with StarterKit extensions (bold, italic, headings, lists, etc.)
- [ ] Save/load document content to/from Dexie
- [ ] Docs list view + folder integration (reuse `ExplorerGrid.vue`)
- [ ] Basic formatting toolbar
- [ ] Unit/component tests for doc store logic and editor content round-trip
- [ ] **Checkpoint: All three core features are live**

## Phase 4 — Cross-Cutting Polish

- [x] PWA setup (installable, offline shell) — `registerSW.ts` in place
- [ ] JSON export/import (full backup & restore of all Dexie data) — important given zero cloud sync
- [ ] Global search across todos/notes/docs (at least by title)
- [x] Responsive layout pass across desktop and mobile widths (bottom nav sidebar, mobile drawers, FAB actions)
- [ ] Responsive layout validation on tablet widths
- [ ] Accessibility pass (keyboard nav for folder tree, focus states, ARIA labels)
- [ ] Performance check: large numbers of todos/notes/docs, IndexedDB query performance
- [ ] Final design pass on rose color palette across light/dark

## Backlog / Ideas (not committed to a phase yet)

- [ ] Drag-and-drop reordering across folders
- [ ] Tags in addition to folders
- [ ] Keyboard shortcuts (new item, search, toggle theme)
- [ ] Rich shape tools in Notes (rectangles, arrows) beyond freehand ink

---

### How to use this file

Check items off as you go (`- [x]`). Add new items under the relevant phase as they come up — don't let scope creep into "Backlog" silently disappear; revisit it at the start of each phase to decide what's actually in scope.

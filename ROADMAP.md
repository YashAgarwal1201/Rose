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
- [x] Unit tests: Dexie store logic (add/update/delete/move folder & todo)
- [x] Component tests: folder tree interactions, todo list rendering
- [ ] E2E test: create folder → add todo → mark done → refresh page → data persists
- [ ] **Checkpoint: Rose is a usable todo app on its own**

## Phase 2 — Home, Onboarding & Settings

Before Notes gets built, the app needs a real front door instead of hard-redirecting `/` → `/todos/folder`, plus a first-run experience and a proper settings surface (currently just `MenuOverlay.vue`, which is closer to a quick-settings drawer than a real Settings page — e.g. its "Clear all data" only clears `localStorage`/`sessionStorage`, not Dexie).

### Data layer

- [ ] Dexie `db.version(5)`: add `settings` table (single row, `id: 1`) — `username`, `enabledFeatures`, `onboardingCompleted`, `onboardingStep`, `createdAt`
- [ ] Add `lastOpenedAt: number | null` to `todoLists` and `docs` (and `notes` once it exists), updated on open — powers Home's "recently opened" without a separate log table
- [ ] `src/db/types.ts`: `AppSettings` interface

### Stores

- [ ] New `stores/ui.ts` — app-level UI state (`isMenuOpen`, `isSearchOpen`, drawer states); migrate `isMenuOpen` out of `App.vue`'s local ref
- [ ] New `stores/settings.ts` — wraps the `settings` Dexie row; actions: `completeOnboarding()`, `updateUsername()`, `toggleFeature()`, `resetOnboarding()`
- [ ] `theme.ts` stays as-is (no migration needed)
- [ ] `composables/useBackup.ts` — export/import logic across all tables (not a store; no reactive state needed)

### Onboarding flow

- [ ] Dedicated `/onboarding` route, gated by router guard on `settings.onboardingCompleted`
- [ ] Hydrate `settings` store from Dexie before the router resolves the first route
- [ ] Step 1 — Welcome (logo, one-liner, "Get Started" / "Skip setup")
- [ ] Step 2 — Privacy (local-first / no accounts / no cloud explanation, currently only in README)
- [ ] Step 3 — Theme picker (reuse existing light/dark/system logic)
- [ ] Step 4 — Username (skippable, falls back to a friendly default)
- [ ] Step 5 — Feature selection (Todos / Notes / Docs checkboxes, all on by default, ≥1 required)
- [ ] Step 6 — Finish (writes `settings`, routes to `/`)
- [ ] Persist `onboardingStep` so closing mid-flow resumes instead of restarting
- [ ] Clarify and keep distinct: "has completed onboarding" vs. "has any content data" — a returning user who clears all their todos/docs should land on Home's empty state, not get routed back into onboarding

### Home page

- [ ] New `HomeView.vue`, becomes the `/` route (replaces the `/todos/folder` redirect)
- [ ] Greeting + date, using `settings.username`
- [ ] Global search bar (lives only on Home for now)
- [ ] Quick-create row (New Todo List / New Doc / New Note), filtered by `enabledFeatures`
- [ ] "Recently opened" — merged list across enabled features via `lastOpenedAt`, icon-tagged by type
- [ ] Stats strip — open task count, folder count, doc count, `enabledFeatures`-aware
- [ ] Empty state for genuinely fresh installs (quick-create front and center, no recents/stats)
- [ ] Sidebar: add Home nav entry

### Settings page

- [ ] New `SettingsView.vue` + `/settings` route; migrate `MenuOverlay.vue`'s sections into it
- [ ] Profile section — username edit
- [ ] Appearance section — theme (existing)
- [ ] Features section — toggle Todos/Notes/Docs on/off post-onboarding
- [ ] Data & Storage section:
  - [ ] Storage usage indicator (`navigator.storage.estimate()`)
  - [ ] Export data → JSON download (all tables)
  - [ ] Import data → JSON upload, with **merge vs. overwrite** choice prompt at import time (overwrite requires extra confirmation); merge remaps imported IDs to avoid collisions and re-parents folders/lists/docs correctly
  - [ ] "Clear all content" — wipes folders/todos/docs/notes only, keeps `settings`/theme intact, lands on Home empty state
  - [ ] "Reset app completely" — wipes `settings` too, re-triggers onboarding; needs typed confirmation (not a plain `confirm()`), since it's more destructive than content-clear
- [ ] About section — version, tech stack, keyboard shortcuts, "Replay onboarding" button
- [ ] Sidebar: add Settings nav entry
- [ ] **Checkpoint: Rose has a real home screen, onboarding, and a proper settings page**

## Phase 3 — Notes (Sketching/Handwriting)

- [ ] Dexie schema for `notes` table (folderId, title, canvasJSON, thumbnail, timestamps, `lastOpenedAt`)
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

## Phase 4 — Docs

- [x] Dexie schema for `docs` table (folderId, title, contentJSON, timestamps)
- [x] TipTap editor component with StarterKit extensions (bold, italic, headings, lists, etc.)
- [x] Save/load document content to/from Dexie
- [x] Docs list view + folder integration (reuse `ExplorerGrid.vue`)
- [x] Basic formatting toolbar
- [ ] Unit/component tests for doc store logic and editor content round-trip
- [ ] **Checkpoint: All three core features are live**

## Phase 5 — Cross-Cutting Polish

- [x] PWA setup (installable, offline shell) — `registerSW.ts` in place
- [x] Responsive layout pass across desktop and mobile widths (bottom nav sidebar, mobile drawers, FAB actions)
- [ ] Global search across todos/notes/docs (at least by title) — surfaced beyond Home
- [ ] Responsive layout validation on tablet widths
- [ ] Accessibility pass (keyboard nav for folder tree, focus states, ARIA labels)
- [ ] Performance check: large numbers of todos/notes/docs, IndexedDB query performance
- [ ] Final design pass on rose color palette across light/dark

## Backlog / Ideas (not committed to a phase yet)

- [ ] Drag-and-drop reordering across folders
- [ ] Tags in addition to folders
- [ ] Keyboard shortcuts (new item, search, toggle theme)
- [ ] Rich shape tools in Notes (rectangles, arrows) beyond freehand ink
- [ ] "Haven't backed up in a while" nudge on Home, based on last export timestamp
- [ ] Pinned items section on Home (beyond recents)

---

### How to use this file

Check items off as you go (`- [x]`). Add new items under the relevant phase as they come up — don't let scope creep into "Backlog" silently disappear; revisit it at the start of each phase to decide what's actually in scope.

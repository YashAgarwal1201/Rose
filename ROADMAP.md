# Rose — Roadmap & Checklist

Development is organized by feature flows.

---

## Foundation & Architecture
- [x] Scaffold Vue 3 + TS + Vite project (`npm create vue@latest`)
- [x] Install core libraries (dexie, fabric, tiptap, tailwind)
- [x] Install testing tools (Vitest, Playwright, Testing Library)
- [x] Set up folder structure (`src/db`, `src/stores`, `src/features/*`, `src/components`)
- [x] Configure Tailwind v4 via Vite plugin
- [x] Set up base routing shell (`/todos`, `/notes`, `/docs`)
- [x] Set up Pinia store structure (one store per feature + one for UI/theme state)
- [x] Confirm ESLint/Prettier/oxlint all run cleanly on the empty scaffold
- [x] First commit + `.gitignore` sanity check (node_modules, dist, .env etc.)
- [x] Dexie database instance + versioning setup (`src/db/index.ts`)
- [x] Theme system: CSS custom property tokens for rose palette
- [x] Theme toggle: light / dark / system, persisted (localStorage) — `useThemeStore` + `MenuOverlay.vue`
- [x] Bunny Fonts integration — Manrope (content) / Petrona (headings) applied via `@theme` tokens and base layer
- [x] Final design pass on rose color palette across light/dark (added cream/green accents)
- [x] PWA setup (installable, offline shell) — `registerSW.ts` in place
- [x] Deployment setup (Cloudflare Pages SPA routing via \_redirects)
- [x] Add branding assets (favicon, logo, Open Graph tags)
- [x] Responsive layout pass across desktop and mobile widths (bottom nav sidebar, mobile drawers, FAB actions)
- [ ] Responsive layout validation on tablet widths
- [ ] Accessibility pass — partial: focus-visible rings and `aria-labelledby`/`aria-describedby` are used throughout Settings and dialogs, but folder tree keyboard navigation specifically hasn't been addressed
- [ ] Performance check: large numbers of todos/notes/docs, IndexedDB query performance

## Folders & Explorer
- [x] Design Dexie schema for `folders` table
- [x] Folder tree component (nested folders, create/rename/delete/move)
- [x] Basic in-feature search/filter (by title, done/not-done)
- [x] Empty states (no folders yet, empty folder, no todos)
- [x] Folder/list duplicate-name validation with user-facing error toasts
- [x] Explorer grid/list view toggle with sort by name/modified date (`ExplorerGrid.vue`, `useExplorerViewMode.ts`)
- [x] Reusable confirm dialog + toast notification system (`useConfirm`, `useToast`, `ConfirmDialog.vue`, `ToastContainer.vue`)
- [x] Breadcrumb navigation with mobile popover trail (`Breadcrumbs.vue`)
- [x] Mobile folder tree drawer + speed-dial create actions (`FolderTreeDrawer.vue`, `ExplorerActions.vue`)
- [x] Surface "Created" date and item type (folder/list) columns in Explorer list view
- [x] Fix relative-time formatting bug (premature unit rounding in `formatRelativeTime.ts`)

## Todos
- [x] Design Dexie schema for `todos` table
- [x] Pinia store wrapping Dexie CRUD (create/read/update/delete/reorder)
- [x] Todo list view (per folder, with sub-folder navigation)
- [x] Todo inline edit (title, done toggle, priority, due date)
- [x] Todo list "properties" info panel (counts, created/modified timestamps)
- [x] Unit tests: Dexie store logic (add/update/delete/move folder & todo)
- [x] Component tests: folder tree interactions, todo list rendering
- [ ] E2E test: create folder → add todo → mark done → refresh page → data persists
- [x] **Checkpoint: Rose is a usable todo app on its own**

## Notes (Sketching/Handwriting)
- [x] Dexie schema for `notes` table (folderId, title, canvasJSON, thumbnail, timestamps, `lastOpenedAt`)
- [x] Fabric.js canvas component (`NoteCanvas.vue`, `useHandwritingCanvas.ts`, using `perfect-freehand` for stroke rendering)
- [x] Pointer event handling: `pointerType` detection (pen/touch/mouse), touch suppressed while pen is active
- [x] Toolbar: pen, eraser, color, stroke width, undo/redo (`NoteToolbar.vue`)
- [x] Save canvas state to Dexie on change (debounced)
- [x] Load canvas state back on note open
- [x] Thumbnail generation for notes list view (low-res `canvas.toDataURL()`)
- [x] Notes list view + folder integration (`NotesView.vue`, `ExplorerGrid.vue`)
- [ ] Test on at least one real touch+stylus device (iPad/Surface/Android tablet) — can't be validated from code alone, still needs manual device QA
- [x] Unit/component tests for note store logic and canvas save/load round-trip

## Docs
- [x] Dexie schema for `docs` table (folderId, title, contentJSON, timestamps)
- [x] TipTap editor component with StarterKit extensions (bold, italic, headings, lists, etc.)
- [x] Save/load document content to/from Dexie
- [x] Docs list view + folder integration (reuse `ExplorerGrid.vue`)
- [x] Basic formatting toolbar (`DocToolbar.vue`)
- [x] Extended formatting: tables, color pickers, CSV import
- [x] Export: PDF / HTML / Markdown (`useDocExport.ts`)
- [x] Fixed doc content-loss bug (missing `saveContent.flush()` + `structuredClone(toRaw(...))` for Vue Proxy cloning)
- [x] Unit/component tests for doc store logic and editor content round-trip

## Global UI & App State
- [x] Dexie `db.version(5)`: add `settings` table (single row, `id: 1`) — `username`, `enabledFeatures`, `onboardingCompleted`, `onboardingStep`, `createdAt`
- [x] `src/db/types.ts`: `AppSettings` interface
- [x] New `stores/ui.ts` — app-level UI state
- [x] New `stores/settings.ts` — wraps the `settings` Dexie row; `completeOnboarding()`, `updateUsername()`, `toggleFeature()`, `resetOnboarding()`
- [x] Add `lastOpenedAt: number | null` to `todoLists`, `docs`, and `notes`, updated on open — powers Home's "recently opened"
- [x] Global search across todos/notes/docs (at least by title), surfaced beyond Home
- [x] Per-page browser tab titles — route `meta.title` + global `afterEach` baseline, refined per-item via `useDocumentTitle.ts` on detail/folder views

## Onboarding
- [x] Dedicated `/onboarding` route, gated by router guard on `settings.onboardingCompleted`
- [x] Hydrate `settings` store from Dexie before the router resolves the first route
- [x] Step 1 — Welcome (`WelcomeStep.vue`)
- [x] Step 2 — Privacy (`PrivacyStep.vue`)
- [x] Step 3 — Theme picker (`ThemeStep.vue`)
- [x] Step 4 — Username (`UsernameStep.vue`)
- [x] Step 5 — Feature selection (`FeaturesStep.vue`)
- [x] Step 6 — Finish (`FinishStep.vue`)
- [x] Persist `onboardingStep` so closing mid-flow resumes instead of restarting
- [x] Clarify and keep distinct: "has completed onboarding" vs. "has any content data"

## Home Page
- [x] New `HomeView.vue`, is now the `/` route
- [x] Greeting + date, using `settings.username`
- [x] Global search bar
- [x] Quick-create row (`QuickJumpCard.vue`), filtered by `enabledFeatures`
- [x] "Recently opened" — merged list across enabled features via `lastOpenedAt` (`HomeRecentScroller.vue`, `HomeFileCard.vue`, `HomeFolderTile.vue`)
- [x] Stats strip / folder + doc + list counts, `enabledFeatures`-aware
- [x] Empty state for genuinely fresh installs
- [x] Sidebar: Home nav entry
- [x] Activity heatmap — GitHub-style contribution calendar on Home (`activity` Dexie table + `stores/activity.ts` recording todo/doc/note create/update events, `useActivityHeatmap.ts`, `HomeActivityHeatmap.vue`)
- [x] Contribution distribution chart — radar-style area chart showing % split of activity across Todos/Docs/Notes (`useContributionDistribution.ts`, `HomeContributionAreaChart.vue`), unified with the heatmap into one card (`HomeActivityCard.vue`)

## Settings & Data Management
- [x] New `SettingsView.vue` + `/settings` route
- [x] Profile section — username edit
- [x] Appearance section — theme
- [x] Features section — toggle Todos/Notes/Docs on/off post-onboarding
- [x] Storage usage indicator (`navigator.storage.estimate()` via `useStorageEstimate.ts`)
- [x] `utils/exportData.ts` and `utils/importData.ts` — export/import logic across all tables
- [x] Export data → JSON download (all tables)
- [x] Import data → JSON upload with merge vs. replace
- [x] "Clear all content" — wipes folders/todos/docs/notes, keeps `settings`/theme intact, lands on Home empty state
- [x] "Reset app completely" — typed `RESET` confirmation, wipes settings too
- [x] Sidebar: Settings nav entry
- [ ] About section (version, tech stack, keyboard shortcuts) inside Settings — this info currently still only lives in `MenuOverlay.vue`, never migrated in

## Backlog / Ideas
- [ ] Drag-and-drop reordering across folders
- [ ] Tags in addition to folders
- [x] Keyboard shortcuts (new item, search, toggle theme)
- [x] Rich shape tools in Notes (rectangles, arrows) beyond freehand ink
- [ ] "Haven't backed up in a while" nudge on Home, based on last export timestamp (blocked on Export/Import existing first)
- [ ] Pinned items section on Home (beyond recents)
- [x] Fix: `notes` table omitted from both "Clear all content" and "Reset app completely" Dexie transactions in `SettingsView.vue`

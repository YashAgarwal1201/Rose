# Specification Document: Rose Journal

Rose is a private, local-first personal space application designed to manage todo lists, documents, and vector drawings. It prioritizes complete data ownership and privacy by storing all user content on the device and utilizing robust client-side encryption.

---

## 1. Core Architecture

### Frontend Stack
*   **Framework**: Vue 3 (Composition API)
*   **Styling**: Tailwind CSS & Custom CSS
*   **State Management**: Pinia
*   **Routing**: Vue Router
*   **PWA**: Service Worker caching (`sw.js` and `registerSW.ts`) for complete offline usability.

### Storage & Database
*   **IndexedDB**: Governed via Dexie.js for persistent, structured local storage.
*   **LocalStorage**: Stores the theme setting (light/dark/system).
*   **In-Memory**: Active encryption keys (`CryptoKey` object) are stored in memory and are discarded when the vault locks or the app is closed.

---

## 2. Data Schema (IndexedDB)

The database schema is defined as a Dexie.js instance with the following primary stores:

### 1. `folders`
Organizes notes, documents, and todo lists into a directory hierarchy.
*   `id` (string, UUID)
*   `name` (string)
*   `parentId` (string | null, referencing parent folder)
*   `type` (FeatureType | "mixed" - `"todo" | "note" | "doc" | "mixed"`)
*   `isVaulted` (boolean)
*   `iv` (string | null, initialization vector if folder metadata needs encryption)
*   `createdAt` (number)
*   `updatedAt` (number)

### 2. `todoLists`
Contains metadata for task lists.
*   `id` (string, UUID)
*   `folderId` (string | null)
*   `name` (string)
*   `isVaulted` (boolean)
*   `iv` (string | null)
*   `createdAt` (number)
*   `updatedAt` (number)
*   `lastOpenedAt` (number | null)

### 3. `todos`
Individual tasks linked to a `todoList`.
*   `id` (string, UUID)
*   `listId` (string)
*   `title` (string - encrypted if `isVaulted` is true)
*   `done` (boolean)
*   `priority` (`"low" | "medium" | "high" | null`)
*   `dueDate` (number | null)
*   `isVaulted` (boolean)
*   `iv` (string | null)
*   `createdAt` (number)
*   `updatedAt` (number)

### 4. `docs`
Rich text documents.
*   `id` (string, UUID)
*   `folderId` (string | null)
*   `title` (string)
*   `contentJSON` (Record<string, unknown> | null - TipTap content; encrypted if `isVaulted` is true)
*   `isVaulted` (boolean)
*   `iv` (string | null)
*   `createdAt` (number)
*   `updatedAt` (number)
*   `lastOpenedAt` (number | null)

### 5. `notes`
Vector drawings and sketch notes.
*   `id` (string, UUID)
*   `folderId` (string | null)
*   `title` (string)
*   `canvasJSON` (Record<string, unknown> | null - Fabric.js state; encrypted if `isVaulted` is true)
*   `backgroundColor` (string)
*   `backgroundPattern` (`"solid" | "dots" | "grid" | "ruled"`)
*   `thumbnail` (string | null - base64 preview; encrypted if `isVaulted` is true)
*   `isVaulted` (boolean)
*   `iv` (string | null)
*   `createdAt` (number)
*   `updatedAt` (number)
*   `lastOpenedAt` (number | null)

### 6. `settings`
Global configurations (singleton record, `id: 1`).
*   `id` (always `1`)
*   `username` (string | null)
*   `onboardingCompleted` (boolean)
*   `onboardingStep` (number)
*   `showActivityChart` (boolean)
*   `vaultPinSalt` (string | null)
*   `vaultPinHash` (string | null)
*   `vaultRecoveryHash` (string | null)
*   `createdAt` (number)

### 7. `activity`
Chronological activity log that powers the home chart.
*   `id` (string, UUID)
*   `type` (`"folder_created" | "todo_list_created" | "todo_created" | "todo_toggled" | "todo_updated" | "doc_created" | "doc_updated" | "note_created" | "note_updated"`)
*   `entityId` (string)
*   `timestamp` (number)

---

## 3. Cryptography & Security Model

Rose employs **Zero-Knowledge Client-Side Encryption** to keep sensitive data safe:

### Key Derivation & Setup
*   **PBKDF2**: Derives a 256-bit AES key (`derivedKey`) from the Master PIN and a unique salt (`vaultPinSalt`) using `100_000` iterations of PBKDF2-HMAC-SHA-256.
*   **Password Hashing**: Uses SHA-256 to hash the user's PIN (`vaultPinHash`) and a generated recovery key (`vaultRecoveryHash`) for validation.
*   **Recovery Key**: Generates a cryptographically strong 16-character string (`XXXX-XXXX-XXXX-XXXX`). If the user forgets their PIN, entering the recovery key allows them to reset it.

### Vault Encryption Mechanics
*   **AES-GCM (256-bit)**: Used for all content encryption.
*   **Vault Folder**: A special root folder named `"Secure Vault"` (with ID `vault`) is designated as the encrypted space.
*   **Inherited State**: Any folders or files created inside `Secure Vault` or moved into it automatically get marked as `isVaulted: true`.
*   **Encrypted Fields**:
    *   *Docs*: `contentJSON` (body content).
    *   *Notes*: `canvasJSON` (vector structure) and `thumbnail` (preview data URL).
    *   *Todos*: `title` (text description).
    *   *Folders / Lists*: Directory structures are unencrypted to enable browsing when locked, but their children's content remains encrypted.
*   **Encryption Transition**: When items are moved inside the vaulted space, they are encrypted in the background. When moved out, they are decrypted and their `iv` is cleared.

### Inactivity Auto-Lock
*   To prevent unauthorized access, the vault automatically locks after **5 minutes of inactivity**.
*   **Activity Resets**: Register listeners on `mousemove`, `keydown`, and `touchstart` to refresh the timer.
*   When locked, the memory reference to `derivedKey` is set to `null`, and pages displaying vaulted items prompt for the PIN via a `VaultAuthView`.

---

## 4. User Interaction & Core Features

### Onboarding Flow
*   Guarded by a router middleware to prevent unonboarded navigation.
    *   **Welcome**: Explains the local-first nature of the app. Provides a route to **Import data** from a backup file.
    *   **Privacy**: Declares data rules (offline storage, no external tracking).
    *   **Theme selection**: Light, Dark, or System.
    *   **Username setting**: Greeting customization.
    *   **Finish**: Transitions `onboardingCompleted` to true and logs entry.

### Home Dashboard
*   **Greeting**: Contextual based on the user's name and local time.
*   **Global Search**: Instantly searches names, titles, and text contents of unvaulted notes, docs, and todo items.
*   **Tiles & Quick Nav**: Display top folders, recently opened logs, and categorised lists of recent documents/notes/todo lists.
*   **Activity Heatmap**: A contribution chart visualizing the user's logged entries in the `activity` store over the last year. Can be toggled on/off.
*   **Stats Widget**: Summary counters.

### File Explorer
*   **Directory Grid**: Renders folder hierarchies using breadcrumbs and custom grids. Shows file sizes, item counts, and timestamps.
*   **Folder Tree Sidebar**: An expandable navigation menu, adapting into a slide-out drawer on mobile devices.
*   **Folder Creation & Upgrades**: Dynamically supports mixed contents.
*   **Drag & Drop / Picker Moves**: Move files or folders into nested subfolders.
*   **Name Collision Resolution**: If a moved file has a name mismatch, prompts the user to overwrite or automatically suffix (`(1)`).

### Rich Text Documents (Docs)
*   Built on the **TipTap** editor.
*   **Formats**: Paragraphs, Headings (H1-H4), Bold, Italic, Strikethrough, Code Blocks, blockquotes, horizontal lines, links, and bulleted/ordered lists.
*   **Advanced Tables**: Max size `20` rows by `10` columns. Supports column/row insertions before/after, custom cell color picker, border toggle, and table deletion.
*   **Image Import**: Drag-and-drop or select images, saving them as local data URLs.
*   **CSV Import**: Imports `.csv` data directly into formatted TipTap tables.
*   **Exports**: HTML, Markdown (`.md`), Plain Text (`.txt`), and formatted PDF (triggers browser print interface).

### Vector Sketchpads (Notes)
*   Powered by a **Fabric.js** canvas wrapper.
*   **Drawing Pens**: Pencil, Pen, Marker. Brush color and thickness controls.
*   **Canvas Controls**: Undo, Redo, Clear Canvas.
*   **Canvas Pan**: Mobile/touch layouts support 2-finger panning so drawing is reserved for a single finger.
*   **Vector Shapes**: Inserts Rectangles, Ellipses, Lines, Arrows, Triangles, Stars, and other common structures.
*   **Text & Images**: Inline text editing and image imports directly onto the vector board.
*   **Grid Settings**: Custom background colors and patterns (solid, dots, grid, ruled).
*   **Exports**: PNG, JPEG, SVG.

### Todo Lists (Todos)
*   **Multi-list Manager**: Multiple isolated todo boards.
*   **Quick Context Controls**: Mouse click or long press (mobile) triggers a context menu for quick priorities (None, Low, Medium, High) and calendar due dates.
*   **Task Details Editor**: Slide-out modal containing a text field, priority selector, due date calendar, and fullscreen toggle. Renders progress counts (total vs completed).

### Settings & Administration
*   **Username customisation**.
*   **Home Activity Chart Toggle**.
*   **Onboarding Replay**: Re-trigger welcome flow (retaining current data).
*   **Disk storage calculation**: Reads storage estimate using browser quota APIs.
*   **Import/Export Backups**:
    *   *Export*: Select which stores (Settings, Notes, Docs, Todos, Activity) to export into a consolidated JSON backup file.
    *   *Import*: Parse a backup JSON, verifying schema versions. Offers **Merge** (upserts data) or **Replace** (wipes existing databases before restoring) configurations.
*   **Cleanups**:
    *   *Clear Content*: Wipes folders, todos, notes, and docs; preserves profile.
    *   *Reset App*: Prompts user to type "RESET" to wipe database tables and re-trigger onboarding.

---

## 5. Security and Operational Rules

1.  **No Server Interaction**: The application must never attempt to transmit any data to a remote server. All data operations (sync, backup, encryption) occur strictly on the user's client device.
2.  **Zero Key Persistence**: The derived AES master key is never persisted in IndexedDB, SessionStorage, or LocalStorage. Locking or closing the window must immediately clear it from memory.
3.  **Graceful Fallbacks for Storage**: Storage estimate checks must fail silently if quota APIs are blocked by privacy-focused browsers (e.g. Brave).
4.  **Limits & Safety Measures**:
    *   Tables in documents are strictly capped at 20 rows and 10 columns to prevent browser lag.
    *   CSV files exceeding these limits will truncate with a warning toast explaining the limits.

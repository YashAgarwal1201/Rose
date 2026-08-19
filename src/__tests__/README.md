# Tests Directory

This directory contains the unit and component test suite for the Rose application. We use [Vitest](https://vitest.dev/) as our primary test runner, along with `@vue/test-utils` and Vue Testing Library for component testing.

## Directory Structure

The tests are organized by concern to map closely to the architecture in the `src/` directory.

- **`components/`** (`*.component.test.ts`)
  Tests for Vue components, including shared UI elements and page-level views. These focus on rendering, user interactions, and DOM event handling.

- **`composables/`** (`*.test.ts`)
  Tests for Vue composables (e.g., `useConfirm`, `useToast`). These verify reactive state encapsulation and integration with browser APIs.

- **`stores/`** (`*.store.test.ts`)
  Tests for Pinia state management. These ensure that state mutations, actions, and getters for features (todos, notes, docs, folders, etc.) work correctly, often using a fake IndexedDB environment.

- **`utils/`** (`*.unit.test.ts`)
  Unit tests for pure utility functions (e.g., `formatBytes`, `debounce`, `constants`). These verify data formatting, transformations, and other isolated logic.

- **Root Files**
  Contains root-level tests (like `App.test.ts` and `importData.spec.ts`) as well as `setup.ts`, which configures Vitest globals and mocks like `fake-indexeddb`.

## Naming Conventions

We use specific file suffixes to easily identify the type and scope of each test:
- `*.component.test.ts` — Vue components and UI views.
- `*.store.test.ts` — Pinia stores and state logic.
- `*.unit.test.ts` — Pure utilities and helper functions.
- `*.test.ts` / `*.spec.ts` — General tests and composables.

## Running Tests

You can run the tests using the scripts defined in `package.json`:

```bash
# Run the test suite once
npm run test:unit

# Run the test suite with coverage report
npx vitest run --coverage
```

// src/__tests__/setup.ts
import { vi } from "vitest";
import "fake-indexeddb/auto"; // ← use the auto-install version instead

window.HTMLElement.prototype.scrollIntoView = vi.fn();

window.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

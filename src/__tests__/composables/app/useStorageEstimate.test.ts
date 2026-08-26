import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStorageEstimate } from "@/composables/app/useStorageEstimate";

describe("useStorageEstimate", () => {
  const originalStorage = navigator.storage;

  beforeEach(() => {
    Object.defineProperty(navigator, "storage", {
      value: { estimate: vi.fn() },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, "storage", {
      value: originalStorage,
      writable: true,
      configurable: true,
    });
    vi.clearAllMocks();
  });

  it("sets status to unsupported if navigator.storage.estimate is missing", async () => {
    expect.hasAssertions();
    Object.defineProperty(navigator, "storage", {
      value: {}, // No estimate method
      writable: true,
      configurable: true,
    });

    const { refresh, status } = useStorageEstimate();
    await refresh();

    expect(status.value).toBe("unsupported");
  });

  it("sets status to ready and updates usage/quota on success", async () => {
    expect.hasAssertions();
    const mockEstimate = vi.fn().mockResolvedValue({ usage: 100, quota: 1000 });
    Object.defineProperty(navigator, "storage", {
      value: { estimate: mockEstimate },
      writable: true,
      configurable: true,
    });

    const { refresh, status, usageBytes, quotaBytes } = useStorageEstimate();
    
    expect(status.value).toBe("idle");
    
    const refreshPromise = refresh();
    expect(status.value).toBe("loading");
    
    await refreshPromise;
    
    expect(status.value).toBe("ready");
    expect(usageBytes.value).toBe(100);
    expect(quotaBytes.value).toBe(1000);
  });

  it("sets status to error on failure", async () => {
    expect.hasAssertions();
    const mockEstimate = vi.fn().mockRejectedValue(new Error("Storage error"));
    Object.defineProperty(navigator, "storage", {
      value: { estimate: mockEstimate },
      writable: true,
      configurable: true,
    });

    const { refresh, status } = useStorageEstimate();
    await refresh();

    expect(status.value).toBe("error");
  });

  it("handles race conditions by dropping stale responses", async () => {
    expect.hasAssertions();
    
    let resolveFirst: (v: any) => void;
    let resolveSecond: (v: any) => void;

    const firstPromise = new Promise((r) => { resolveFirst = r; });
    const secondPromise = new Promise((r) => { resolveSecond = r; });

    const mockEstimate = vi.fn()
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(secondPromise);

    Object.defineProperty(navigator, "storage", {
      value: { estimate: mockEstimate },
      writable: true,
      configurable: true,
    });

    const { refresh, status, usageBytes } = useStorageEstimate();

    // Trigger first request
    const req1 = refresh();
    // Trigger second request before first completes
    const req2 = refresh();

    // Resolve first (should be ignored)
    resolveFirst!({ usage: 10, quota: 100 });
    await req1;
    
    // Status should still be loading because the second request is pending
    expect(status.value).toBe("loading");
    expect(usageBytes.value).toBeNull();

    // Resolve second
    resolveSecond!({ usage: 20, quota: 200 });
    await req2;

    // Now it should be updated with second's values
    expect(status.value).toBe("ready");
    expect(usageBytes.value).toBe(20);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBackButtonClose } from "@/composables/ui/useBackButtonClose";
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";

vi.mock("vue-router", () => ({
  useRouter: vi.fn(),
  useRoute: vi.fn(),
}));

describe("useBackButtonClose", () => {
  let mockRouter: any;
  let mockRoute: any;

  beforeEach(() => {
    mockRouter = {
      push: vi.fn().mockResolvedValue(true),
      back: vi.fn(),
    };
    mockRoute = {
      hash: "",
    };

    (useRouter as any).mockReturnValue(mockRouter);
    (useRoute as any).mockReturnValue(mockRoute);
    
    vi.useFakeTimers();
  });

  it("pushes hash to URL when modal opens", async () => {
    expect.hasAssertions();
    const isOpen = ref(false);
    useBackButtonClose(isOpen, "modal-hash", vi.fn());

    // trigger watch
    isOpen.value = true;
    
    // vitest watches are async, so await nextTick or just flush
    await Promise.resolve();
    
    expect(mockRouter.push).toHaveBeenCalledWith({ hash: "#modal-hash" });
  });

  it("pops hash from URL when modal closes programmatically", async () => {
    expect.hasAssertions();
    mockRoute.hash = "#modal-hash";
    const isOpen = ref(true);
    useBackButtonClose(isOpen, "modal-hash", vi.fn());

    isOpen.value = false;
    
    await Promise.resolve();
    
    expect(mockRouter.back).toHaveBeenCalled();
  });
});

// src/__tests__/composables/useConfirm.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import { useConfirm } from "../../composables/useConfirm";

describe("useConfirm", () => {
  beforeEach(() => {
    // Reset shared state by cancelling any pending dialog
    const { isOpen, handleCancel } = useConfirm();
    if (isOpen.value) {
      handleCancel();
    }
  });

  // ─────────────────────────────────────────────
  // confirm() with string
  // ─────────────────────────────────────────────
  describe("confirm(string)", () => {
    it("opens the dialog", () => {
      expect.hasAssertions();
      const { confirm, isOpen } = useConfirm();
      confirm("Are you sure?");
      expect(isOpen.value).toBe(true);
    });

    it("wraps the string in an options object with message", () => {
      expect.hasAssertions();
      const { confirm, options } = useConfirm();
      confirm("Delete this?");
      expect(options.value.message).toBe("Delete this?");
    });
  });

  // ─────────────────────────────────────────────
  // confirm() with options object
  // ─────────────────────────────────────────────
  describe("confirm(opts)", () => {
    it("opens the dialog with full options", () => {
      expect.hasAssertions();
      const { confirm, isOpen, options } = useConfirm();
      confirm({
        title: "Delete folder",
        message: "This cannot be undone.",
        confirmLabel: "Delete",
        cancelLabel: "Keep",
      });
      expect(isOpen.value).toBe(true);
      expect(options.value.title).toBe("Delete folder");
      expect(options.value.message).toBe("This cannot be undone.");
      expect(options.value.confirmLabel).toBe("Delete");
      expect(options.value.cancelLabel).toBe("Keep");
    });
  });

  // ─────────────────────────────────────────────
  // handleConfirm
  // ─────────────────────────────────────────────
  describe("handleConfirm", () => {
    it("resolves the promise with true", async () => {
      expect.hasAssertions();
      const { confirm, handleConfirm } = useConfirm();
      const promise = confirm("Proceed?");
      handleConfirm();
      const result = await promise;
      expect(result).toBe(true);
    });

    it("closes the dialog", () => {
      expect.hasAssertions();
      const { confirm, handleConfirm, isOpen } = useConfirm();
      confirm("Proceed?");
      handleConfirm();
      expect(isOpen.value).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // handleCancel
  // ─────────────────────────────────────────────
  describe("handleCancel", () => {
    it("resolves the promise with false", async () => {
      expect.hasAssertions();
      const { confirm, handleCancel } = useConfirm();
      const promise = confirm("Proceed?");
      handleCancel();
      const result = await promise;
      expect(result).toBe(false);
    });

    it("closes the dialog", () => {
      expect.hasAssertions();
      const { confirm, handleCancel, isOpen } = useConfirm();
      confirm("Proceed?");
      handleCancel();
      expect(isOpen.value).toBe(false);
    });
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import { useInput } from "@/composables/ui/useInput";

describe("useInput", () => {
  beforeEach(() => {
    // Reset state before each test
    const { isOpen, handleCancel } = useInput();
    if (isOpen.value) {
      handleCancel();
    }
  });

  describe("requestInput(string)", () => {
    it("opens the dialog and sets the message", () => {
      expect.hasAssertions();
      const { requestInput, isOpen, options, inputValue } = useInput();
      
      requestInput("Enter your name:");
      
      expect(isOpen.value).toBeTruthy();
      expect(options.value.message).toBe("Enter your name:");
      expect(inputValue.value).toBe("");
    });
  });

  describe("requestInput(opts)", () => {
    it("opens the dialog with full options and sets initial value", () => {
      expect.hasAssertions();
      const { requestInput, isOpen, options, inputValue } = useInput();
      
      requestInput({
        title: "Rename",
        message: "Enter new name:",
        initialValue: "OldName",
        confirmLabel: "Save",
      });
      
      expect(isOpen.value).toBeTruthy();
      expect(options.value.title).toBe("Rename");
      expect(options.value.message).toBe("Enter new name:");
      expect(inputValue.value).toBe("OldName");
      expect(options.value.confirmLabel).toBe("Save");
    });
  });

  describe("handleConfirm", () => {
    it("resolves the promise with the input value and closes dialog", async () => {
      expect.hasAssertions();
      const { requestInput, handleConfirm, isOpen, inputValue } = useInput();
      
      const promise = requestInput("Enter name:");
      
      // Simulate user typing
      inputValue.value = "John Doe";
      
      handleConfirm();
      
      const result = await promise;
      expect(result).toBe("John Doe");
      expect(isOpen.value).toBeFalsy();
    });
  });

  describe("handleCancel", () => {
    it("resolves the promise with null and closes dialog", async () => {
      expect.hasAssertions();
      const { requestInput, handleCancel, isOpen } = useInput();
      
      const promise = requestInput("Enter name:");
      
      handleCancel();
      
      const result = await promise;
      expect(result).toBeNull();
      expect(isOpen.value).toBeFalsy();
    });
  });
});

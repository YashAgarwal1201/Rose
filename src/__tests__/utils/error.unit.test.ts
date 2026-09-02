import { describe, expect, it } from "vitest";
import { getErrorMessage, isVaultLockedError, toError } from "@/utils/error";

describe("error utility", () => {
  describe("getErrorMessage", () => {
    it("returns message from Error instances", () => {
      const err = new Error("Something went wrong");
      expect(getErrorMessage(err)).toBe("Something went wrong");
    });

    it("returns string errors as is", () => {
      expect(getErrorMessage("String error")).toBe("String error");
    });

    it("extracts message from error-like objects", () => {
      const customErr = { message: "Object error message" };
      expect(getErrorMessage(customErr)).toBe("Object error message");
    });

    it("returns fallback for null or undefined or non-string message", () => {
      expect(getErrorMessage(null)).toBe("An unexpected error occurred");
      expect(getErrorMessage(undefined)).toBe("An unexpected error occurred");
      expect(getErrorMessage(123)).toBe("An unexpected error occurred");
      expect(getErrorMessage({ message: 404 })).toBe("An unexpected error occurred");
      expect(getErrorMessage(null, "Custom fallback")).toBe("Custom fallback");
    });
  });

  describe("isVaultLockedError", () => {
    it("returns true when error message is 'Vault is locked'", () => {
      expect(isVaultLockedError(new Error("Vault is locked"))).toBe(true);
      expect(isVaultLockedError("Vault is locked")).toBe(true);
      expect(isVaultLockedError({ message: "Vault is locked" })).toBe(true);
    });

    it("returns false for other error messages", () => {
      expect(isVaultLockedError(new Error("Other error"))).toBe(false);
      expect(isVaultLockedError(null)).toBe(false);
    });
  });

  describe("toError", () => {
    it("returns the original Error instance if passed an Error", () => {
      const original = new Error("Original");
      expect(toError(original)).toBe(original);
    });

    it("converts unknown values to Error objects with extracted message", () => {
      const errStr = toError("Custom error string");
      expect(errStr).toBeInstanceOf(Error);
      expect(errStr.message).toBe("Custom error string");

      const errObj = toError({ message: "Object error" });
      expect(errObj).toBeInstanceOf(Error);
      expect(errObj.message).toBe("Object error");

      const errUnknown = toError(null, "Fallback error");
      expect(errUnknown).toBeInstanceOf(Error);
      expect(errUnknown.message).toBe("Fallback error");
    });
  });
});

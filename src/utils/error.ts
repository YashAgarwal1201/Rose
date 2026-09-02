/**
 * Utility functions for standardized error handling and type-safe extraction of error messages across catch blocks.
 */

/**
 * Safely extracts an error message from an unknown catch error.
 * Handles Error instances, error-like objects with a message property, string errors, and fallbacks.
 */
export function getErrorMessage(
  error: unknown,
  fallbackMessage = "An unexpected error occurred",
): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (
    error !== null &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return fallbackMessage;
}

/**
 * Checks if a caught error indicates that the vault is locked.
 */
export function isVaultLockedError(error: unknown): boolean {
  return getErrorMessage(error) === "Vault is locked";
}

/**
 * Normalizes any unknown caught value into a standard JavaScript Error instance.
 */
export function toError(error: unknown, fallbackMessage = "An unexpected error occurred"): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(getErrorMessage(error, fallbackMessage));
}

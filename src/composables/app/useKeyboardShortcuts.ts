// src/composables/useKeyboardShortcuts.ts
import { onMounted, onUnmounted } from "vue";

export interface ShortcutDefinition {
  /** The key to match (e.g. "s", ",", "/", "1"). Case-insensitive. */
  key: string;
  /** Whether Ctrl (Win/Linux) or ⌘ Cmd (Mac) must be held. */
  ctrl?: boolean;
  /** Whether Shift must be held. */
  shift?: boolean;
  /** Whether Alt (Win/Linux) or Option (Mac) must be held. */
  alt?: boolean;
  /**
   * Handler to call when the shortcut fires.
   * Return `false` to indicate "I didn't handle this" — the event will NOT
   * have `preventDefault()` called and the composable will continue trying
   * other shortcuts / let the event propagate normally.
   */
  handler: (event: KeyboardEvent) => void | false;
  /**
   * If true, this shortcut will NOT fire when the user is focused on an
   * interactive input element (input, textarea, select, contenteditable).
   * Defaults to false (shortcut fires regardless of focus).
   */
  skipInInput?: boolean;
}

/**
 * Returns true when the active element is an interactive text-entry element
 * where app-level keyboard shortcuts should generally not fire.
 */
function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) {return false;}

  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {return true;}
  if ((el as HTMLElement).isContentEditable) {return true;}

  return false;
}

/**
 * Returns true when the platform modifier key is pressed.
 * - Mac: ⌘ Cmd (metaKey)
 * - Win/Linux: Ctrl (ctrlKey)
 */
function isMod(e: KeyboardEvent): boolean {
  return e.metaKey || e.ctrlKey;
}

/**
 * Composable that registers a set of keyboard shortcuts on mount and
 * tears them down on unmount. Shortcuts are matched against `keydown`
 * events on `window`.
 *
 * Handler returning `false` means "I matched but chose not to act" — the
 * event's default behaviour is NOT suppressed and matching continues.
 *
 * Usage:
 * ```ts
 * useKeyboardShortcuts([
 *   { key: "s", ctrl: true, handler: () => save() },
 *   { key: ",", ctrl: true, handler: () => openSettings() },
 *   // Conditional: only act when relevant
 *   { key: "Escape", handler: () => {
 *       if (isOverlayOpen) { closeOverlay(); return; }
 *       return false; // not handled, let it propagate
 *     }
 *   },
 * ]);
 * ```
 */
export function useKeyboardShortcuts(shortcuts: ShortcutDefinition[]) {
  function handleKeydown(event: KeyboardEvent) {
    // Normalise the key to lowercase for comparison
    const pressedKey = event.key.toLowerCase();
    // event.code gives the physical key regardless of modifiers (e.g. "Digit1" for the 1 key)
    const pressedCode = event.code.toLowerCase();

    for (const shortcut of shortcuts) {
      // Check modifier requirements
      const wantCtrl = shortcut.ctrl ?? false;
      const wantShift = shortcut.shift ?? false;
      const wantAlt = shortcut.alt ?? false;

      const shortcutKey = shortcut.key.toLowerCase();

      // Match the key — try event.key first, then fall back to event.code
      // This handles Shift+number combos where event.key is "!" but we want "1"
      const keyMatches =
        pressedKey === shortcutKey ||
        pressedCode === `digit${shortcutKey}` ||
        pressedCode === `key${shortcutKey}`;
      if (!keyMatches) {continue;}

      // Match modifiers — isMod checks both ctrlKey and metaKey for cross-platform
      if (wantCtrl && !isMod(event)) {continue;}
      if (!wantCtrl && isMod(event)) {continue;}

      if (wantShift && !event.shiftKey) {continue;}
      if (!wantShift && event.shiftKey) {continue;}

      if (wantAlt && !event.altKey) {continue;}
      if (!wantAlt && event.altKey) {continue;}

      // Skip if focused on input and the shortcut says to
      if (shortcut.skipInInput && isInputFocused()) {continue;}

      // Call the handler FIRST — let it decide whether it wants to act
      const result = shortcut.handler(event);
      if (result === false) {
        // Handler declined — DON'T preventDefault, continue matching next
        // shortcuts or let the event propagate normally
        continue;
      }

      // Handler acted — prevent browser default and stop matching
      event.preventDefault();
      return;
    }
  }

  onMounted(() => {
    window.addEventListener("keydown", handleKeydown);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", handleKeydown);
  });
}

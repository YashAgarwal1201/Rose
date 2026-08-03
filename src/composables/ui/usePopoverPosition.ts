// src/composables/usePopoverPosition.ts
import { nextTick, onBeforeUnmount, reactive, type Ref } from "vue";

export type PopoverPlacement =
  | "bottom-start"
  | "bottom-end"
  | "top-start"
  | "top-end"
  | "left-start"
  | "left-end"
  | "right-start"
  | "right-end";

const GAP = 4;
const MARGIN = 8;

function computeStyle(
  rootEl: HTMLElement,
  triggerEl: HTMLElement,
  popoverEl: HTMLElement,
  placement: PopoverPlacement,
): { top: string; left: string } {
  const rootRect = rootEl.getBoundingClientRect();
  const t = triggerEl.getBoundingClientRect();
  const p = popoverEl.getBoundingClientRect();
  const [axis, align] = placement.split("-") as [
    "top" | "bottom" | "left" | "right",
    "start" | "end",
  ];

  let top: number;
  let left: number;

  if (axis === "bottom" || axis === "top") {
    top = axis === "bottom" ? t.bottom + GAP : t.top - p.height - GAP;
    left = align === "start" ? t.left : t.right - p.width;
  } else {
    left = axis === "right" ? t.right + GAP : t.left - p.width - GAP;
    top = align === "start" ? t.top : t.bottom - p.height;
  }

  // Clamp to the viewport so it never runs off-screen, at any size/orientation.
  const maxLeft = Math.max(window.innerWidth - p.width - MARGIN, MARGIN);
  const maxTop = Math.max(window.innerHeight - p.height - MARGIN, MARGIN);
  left = Math.min(Math.max(left, MARGIN), maxLeft);
  top = Math.min(Math.max(top, MARGIN), maxTop);

  // The popover is an absolutely-positioned child of `rootEl` (which does
  // NOT clip), rather than of the scrollable button row (which does) — so
  // we convert to root-relative coordinates.
  return {
    top: `${top - rootRect.top}px`,
    left: `${left - rootRect.left}px`,
  };
}

/**
 * Positions a popover panel that has been moved OUT of a toolbar's
 * scrollable button row and rendered as a sibling instead, so the button
 * row can keep overflow clipping (for its own scroll) without clipping
 * the popover. Position is measured from live bounding rects, so it's
 * correct regardless of screen size or orientation.
 */
export function usePopoverPosition(
  rootRef: Ref<HTMLElement | null>,
  triggerRef: Ref<HTMLElement | null>,
  popoverRef: Ref<HTMLElement | null>,
  placement: Ref<PopoverPlacement> | PopoverPlacement,
) {
  // Starts off-screen so there's never a flash at the wrong spot before
  // the first real position is computed.
  const style = reactive({ top: "-9999px", left: "-9999px" });

  function currentPlacement(): PopoverPlacement {
    return typeof placement === "string" ? placement : placement.value;
  }

  function reposition() {
    if (!rootRef.value || !triggerRef.value || !popoverRef.value) return;
    const next = computeStyle(
      rootRef.value,
      triggerRef.value,
      popoverRef.value,
      currentPlacement(),
    );
    style.top = next.top;
    style.left = next.left;
  }

  function handleResize() {
    reposition();
  }

  async function open() {
    // Wait for the v-if'd popover element to exist in the DOM before measuring it.
    await nextTick();
    reposition();
    window.addEventListener("resize", handleResize);
  }

  function close() {
    window.removeEventListener("resize", handleResize);
    style.top = "-9999px";
    style.left = "-9999px";
  }

  onBeforeUnmount(close);

  return { style, open, close, reposition };
}

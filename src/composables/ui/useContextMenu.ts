import { type ObjectDirective, ref, type Ref } from 'vue';

export interface ContextMenuOptions<TItem> {
  onOpen?: (item: TItem) => void;
  onClose?: () => void;
}

export function useContextMenu<TItem>(options?: ContextMenuOptions<TItem>) {
  const isOpen = ref(false);
  const activeItem = ref<TItem | null>(null) as Ref<TItem | null>;
  const x = ref(0);
  const y = ref(0);

  function open(item: TItem, event: MouseEvent | PointerEvent | HTMLElement) {
    activeItem.value = item;
    isOpen.value = true;

    if (event instanceof Event) {
      // It's a pointer or mouse event
      x.value = (event as MouseEvent).clientX;
      y.value = (event as MouseEvent).clientY;
    } else {
      // It's an HTML Element (e.g., "..." button)
      const rect = event.getBoundingClientRect();
      x.value = rect.right; // The menu component will anchor to this coordinate
      y.value = rect.bottom;
    }

    options?.onOpen?.(item);
  }

  function close() {
    isOpen.value = false;
    activeItem.value = null;
    options?.onClose?.();
  }

  return { isOpen, activeItem, x, y, open, close };
}

interface LongPressHandlers {
  pointerdown: (e: PointerEvent) => void;
  pointermove: (e: PointerEvent) => void;
  pointerup: (e: PointerEvent) => void;
  pointercancel: (e: PointerEvent) => void;
  contextmenu: (e: MouseEvent) => void;
}

interface LongPressElement extends HTMLElement {
  longPressHandlers?: LongPressHandlers;
}

export const vLongPress: ObjectDirective<HTMLElement, (e: PointerEvent | MouseEvent) => void> = {
  mounted(el, binding) {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let startX = 0;
    let startY = 0;

    const handler = binding.value;
    const element = el as LongPressElement;

    const clear = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    };

    function preventDefaultOnce(e: Event) {
      e.preventDefault();
      e.stopPropagation();
    }

    element.longPressHandlers = {
      pointerdown(e: PointerEvent) {
        if (e.pointerType !== 'touch') {return;}
        clear();
        startX = e.clientX;
        startY = e.clientY;
        timer = globalThis.setTimeout(() => {
          timer = null;
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }
          // Prevent the browser's native context menu from popping up after our long press
          el.addEventListener('contextmenu', preventDefaultOnce, { capture: true, once: true });

          handler(e);
        }, 500);
      },
      pointermove(e: PointerEvent) {
        if (e.pointerType !== 'touch' || !timer) {return;}
        if (Math.abs(e.clientX - startX) > 10 || Math.abs(e.clientY - startY) > 10) {
          clear();
        }
      },
      pointerup: clear,
      pointercancel: clear,
      contextmenu(e: MouseEvent) {
        // Only trigger for non-touch (mouse) contextmenu, since touch is handled by long-press
        // However, some mobile browsers trigger contextmenu on long press natively.
        // We handle that with preventDefaultOnce above, but just in case:
        e.preventDefault();
        // If it was a mouse right-click, handle it
        if ((e as PointerEvent).pointerType !== 'touch') {
          handler(e);
        }
      }
    };

    el.addEventListener('pointerdown', element.longPressHandlers.pointerdown);
    el.addEventListener('pointermove', element.longPressHandlers.pointermove);
    el.addEventListener('pointerup', element.longPressHandlers.pointerup);
    el.addEventListener('pointercancel', element.longPressHandlers.pointercancel);
    el.addEventListener('contextmenu', element.longPressHandlers.contextmenu);
  },
  unmounted(el) {
    const element = el as LongPressElement;
    if (element.longPressHandlers) {
      el.removeEventListener('pointerdown', element.longPressHandlers.pointerdown);
      el.removeEventListener('pointermove', element.longPressHandlers.pointermove);
      el.removeEventListener('pointerup', element.longPressHandlers.pointerup);
      el.removeEventListener('pointercancel', element.longPressHandlers.pointercancel);
      el.removeEventListener('contextmenu', element.longPressHandlers.contextmenu);
    }
  }
};

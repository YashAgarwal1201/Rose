import SharedTodoUI from "./SharedTodoUI.vue";
import { type App, createApp, h, reactive } from "vue";

export interface MountedComponent {
  app: App;
  update: (newProps: Record<string, unknown>) => void;
  unmount: () => void;
}

interface ComponentInstance {
  app: App;
  unmount: () => void;
}

const instances = new Map<HTMLElement, ComponentInstance>();

export function mount(
  el: HTMLElement,
  initialProps: Record<string, unknown> = {},
): MountedComponent {
  if (instances.has(el)) {
    instances.get(el)?.unmount();
  }

  const mediaQuery =
    typeof globalThis.matchMedia === "function"
      ? globalThis.matchMedia("(prefers-color-scheme: dark)")
      : null;

  const syncDarkMode = () => {
    const html = document.documentElement;
    const { body } = document;

    const isDark =
      html.classList.contains("dark") ||
      body.classList.contains("dark") ||
      html.getAttribute("data-theme") === "dark" ||
      html.getAttribute("data-mode") === "dark" ||
      html.getAttribute("theme") === "dark" ||
      html.style.colorScheme === "dark" ||
      Boolean(mediaQuery?.matches);

    el.classList.toggle("dark", isDark);
  };

  syncDarkMode();
  const observer = new MutationObserver(syncDarkMode);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme", "data-mode", "theme", "style"],
  });
  if (document.body) {
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }
  mediaQuery?.addEventListener?.("change", syncDarkMode);

  const state = reactive({ ...initialProps });

  const app = createApp({
    render: () => h(SharedTodoUI, state),
  });
  app.mount(el);

  const unmountInstance = () => {
    observer.disconnect();
    mediaQuery?.removeEventListener?.("change", syncDarkMode);
    app.unmount();
    el.classList.remove("dark");
    instances.delete(el);
  };

  instances.set(el, { app, unmount: unmountInstance });

  return {
    app,
    update: (newProps: Record<string, unknown>) => {
      Object.assign(state, newProps);
    },
    unmount: unmountInstance,
  };
}

export function unmount(el?: HTMLElement) {
  if (el) {
    instances.get(el)?.unmount();
  } else {
    for (const instance of instances.values()) {
      instance.unmount();
    }
  }
}

export default SharedTodoUI;

import SharedDocUI from './SharedDocUI.vue';
import { type App, createApp, h, reactive } from 'vue';

let app: App | null = null;
let observer: MutationObserver | null = null;

export function mount(el: HTMLElement, initialProps: Record<string, any>) {
  const syncDarkMode = () => {
    const html = document.documentElement;
    const {body} = document;

    // Check multiple common ways host apps signal dark mode
    const isDark =
      html.classList.contains('dark') ||
      body.classList.contains('dark') ||
      html.getAttribute('data-theme') === 'dark' ||
      html.getAttribute('data-mode') === 'dark' ||
      html.getAttribute('theme') === 'dark' ||
      html.style.colorScheme === 'dark' ||
      globalThis.matchMedia('(prefers-color-scheme: dark)').matches;

    el.classList.toggle('dark', isDark);
  };

  syncDarkMode();
  observer = new MutationObserver(syncDarkMode);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'data-mode', 'theme', 'style'] });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  globalThis.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncDarkMode);

  const state = reactive({ ...initialProps });

  app = createApp({
    render: () => h(SharedDocUI, state)
  });
  app.mount(el);

  return {
    app,
    update: (newProps: Record<string, any>) => {
      Object.assign(state, newProps);
    }
  };
}

export function unmount() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (app) {
    app.unmount();
    app = null;
  }
}

export default SharedDocUI;

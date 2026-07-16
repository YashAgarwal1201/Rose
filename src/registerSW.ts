// src/registerSW.ts
export function registerSW() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  if (import.meta.env.DEV) {
    // Dev mode: proactively unregister any previously-installed SW and
    // clear its caches, so stale precache entries never intercept HMR
    // traffic on this device — even if the dev SW got stuck before this fix.
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });

    if ("caches" in globalThis) {
      caches.keys().then((keys) => {
        for (const key of keys) {
          caches.delete(key);
        }
      });
    }

    return;
  }

  globalThis.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  });
}

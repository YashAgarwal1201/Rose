// plugins/pinia-indexeddb.client.ts
import { defineNuxtPlugin } from "#app";
import { openDB } from "idb";
import { type PiniaPluginContext, createPinia } from "pinia";

export default defineNuxtPlugin((nuxtApp) => {
  // Only run on client-side
  if (import.meta.server) return;

  // Create the database promise
  const dbPromise = openDB("pinia-storage", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("pinia")) {
        db.createObjectStore("pinia");
      }
    },
  });

  // Define the Pinia plugin
  const piniaIndexedDBPlugin = (context: PiniaPluginContext) => {
    const storeId = context.store.$id;
    const persistStores = ["todos", "header", "sketchNotes"]; // Stores to persist

    // Skip stores that shouldn't be persisted
    if (!persistStores.includes(storeId)) return;

    // Initialize store hydration after plugin is registered
    const initializeState = async () => {
      try {
        const db = await dbPromise;
        const data = await db.get("pinia", storeId);

        if (data) {
          // Use $patch with replaced state option to avoid reactivity issues
          context.store.$patch(JSON.parse(data));
        }
      } catch (error) {
        console.error(
          `Error loading store "${storeId}" from IndexedDB:`,
          error
        );
      }
    };

    // Load initial state
    initializeState();

    // Subscribe to store changes and save to IndexedDB
    context.store.$subscribe(
      async (_mutation, state) => {
        try {
          const db = await dbPromise;
          await db.put("pinia", JSON.stringify(state), storeId);
        } catch (error) {
          console.error(`Error saving store "${storeId}" to IndexedDB:`, error);
        }
      },
      // Make sure subscription persists across Pinia state resets
      { detached: true }
    );
  };

  // Get the Pinia instance using proper module imports
  // This avoids TypeScript errors from direct access
  return {
    provide: {
      piniaIndexedDB: () => {
        const pinia = nuxtApp.vueApp._context.provides.pinia;
        if (pinia) {
          pinia.use(piniaIndexedDBPlugin);
        } else {
          console.error("Pinia is not available");
        }
      },
    },
  };
});

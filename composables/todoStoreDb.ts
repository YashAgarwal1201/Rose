import { openDB } from "idb";

const DB_NAME = "todoApp";
const STORE_NAME = "todos";

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: "id" });
    }
  },
});

// CRUD methods:

export async function getAllLists() {
  const db = await dbPromise;
  return db.getAll(STORE_NAME);
}

export async function getList(id: string) {
  const db = await dbPromise;
  return db.get(STORE_NAME, id);
}

export async function saveList(list: any) {
  console.log("Saving list to IndexedDB:", JSON.stringify(list, null, 2));
  const db = await dbPromise;
  return db.put(STORE_NAME, list);
}

export async function deleteList(id: string) {
  const db = await dbPromise;
  return db.delete(STORE_NAME, id);
}

export async function clearAllLists() {
  const db = await dbPromise;
  return db.clear(STORE_NAME);
}

export async function deleteDatabase() {
  return indexedDB.deleteDatabase(DB_NAME);
}

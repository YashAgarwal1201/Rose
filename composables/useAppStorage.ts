// composables/useAppStorage.ts
export function useAppStorage() {
  const setItem = <T>(key: string, value: T) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const getItem = <T>(key: string): T | null => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  };

  return { setItem, getItem };
}

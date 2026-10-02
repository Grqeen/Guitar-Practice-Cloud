/** Polyfill / Mock for localStorage in Vitest / Node 22 environments */
const storageMap = new Map<string, string>();

export const mockLocalStorage: Storage = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storageMap.set(key, String(value));
  },
  removeItem: (key: string) => {
    storageMap.delete(key);
  },
  clear: () => {
    storageMap.clear();
  },
  get length() {
    return storageMap.size;
  },
  key: (index: number) => {
    return Array.from(storageMap.keys())[index] ?? null;
  },
};

try {
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    configurable: true,
    writable: true,
  });
} catch {
  // Ignored if already defined and not configurable
}

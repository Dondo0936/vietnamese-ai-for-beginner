import "@testing-library/jest-dom/vitest";

// Polyfill localStorage + sessionStorage — Vitest 4's jsdom env doesn't fully implement Storage.
function createStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
}

if (
  typeof localStorage === "undefined" ||
  typeof localStorage.setItem !== "function"
) {
  Object.defineProperty(globalThis, "localStorage", {
    value: createStorage(),
    writable: true,
  });
}
if (
  typeof sessionStorage === "undefined" ||
  typeof sessionStorage.setItem !== "function"
) {
  Object.defineProperty(globalThis, "sessionStorage", {
    value: createStorage(),
    writable: true,
  });
}

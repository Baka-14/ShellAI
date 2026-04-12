const KEY = "terp_v7";

/** Mirrors Claude artifact `window.storage` API using localStorage. */
export const storage = {
  async get(key) {
    try {
      const raw = localStorage.getItem(key);
      return { value: raw };
    } catch {
      return { value: null };
    }
  },
  async set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  },
  async delete(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export { KEY as STORAGE_KEY };

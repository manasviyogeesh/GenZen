const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const storage = {
  get<T>(key: string, fallback: T): T {
    return safeParse<T>(window.localStorage.getItem(key), fallback);
  },

  set<T>(key: string, value: T): void {
    window.localStorage.setItem(key, JSON.stringify(value));
  },

  remove(key: string): void {
    window.localStorage.removeItem(key);
  }
};

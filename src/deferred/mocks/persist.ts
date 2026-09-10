// A handful of MSW handler modules keep their "database" as an in-memory Map.
// That memory resets on every full page reload (Vite HMR re-evaluates the
// module from scratch), which silently breaks anything a user would expect
// to survive a refresh — a saved course, a trip they just generated. This
// backs those Maps with localStorage so state actually persists like a real
// backend's database would, without needing a real backend yet.

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // best-effort — a full/unavailable localStorage shouldn't crash the mock
  }
}

export function persistedMap<V>(key: string): Map<string, V> {
  const obj = loadJSON<Record<string, V>>(key, {});
  return new Map(Object.entries(obj));
}

export function persistMap<V>(key: string, map: Map<string, V>): void {
  saveJSON(key, Object.fromEntries(map));
}

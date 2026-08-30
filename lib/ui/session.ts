// A stateless MVP has no accounts, but still needs one stable id per browser session to
// (a) tie the server-computed analytics events in a single /api/diagnose call together and
// (b) double as Mixpanel's client-side distinct_id (Engineering/ADR/0004-analytics-via-mixpanel.md).
// Not a login, not persisted server-side — just a random id the browser remembers.

export const SESSION_ID_KEY = "epfo-sahayak-session-id";

/** The subset of the Storage API this needs — lets tests pass a plain object instead of
 * requiring a DOM/jsdom test environment for what's otherwise pure logic. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Returns the existing session id from `store`, or creates and persists a new one.
 * `generateId` defaults to crypto.randomUUID() but is injectable for deterministic tests. */
export function getOrCreateSessionId(
  store: KeyValueStore,
  generateId: () => string = () => crypto.randomUUID()
): string {
  try {
    const existing = store.getItem(SESSION_ID_KEY);
    if (existing) return existing;
    const id = generateId();
    store.setItem(SESSION_ID_KEY, id);
    return id;
  } catch {
    // Private browsing / storage quota exceeded — fall back to an unpersisted id for this
    // render rather than breaking the flow. Analytics/API calls still work, just without
    // cross-reload continuity.
    return generateId();
  }
}

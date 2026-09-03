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

// ─── Analytics opt-out ──────────────────────────────────────────────────────
// For internal/QA testing against the real deployed app without polluting real citizen
// analytics. `session_id` only ever exists to correlate/attribute analytics events (see the
// module comment above) — it's never read by the actual diagnose logic — so an empty session
// id is a safe, total kill switch: trackClientEvent (lib/ui/mixpanel-client.ts) and
// trackServerEvent (lib/analytics.ts) BOTH already no-op on a falsy session id, with no
// changes needed there. Wizard.tsx checks this before ever calling getOrCreateSessionId, so
// an opted-out browser never generates or persists a real one.

export const NO_TRACK_KEY = "epfo-sahayak-no-track";

/** True once this browser has opted out (see setTrackingDisabled). */
export function isTrackingDisabled(store: KeyValueStore): boolean {
  try {
    return store.getItem(NO_TRACK_KEY) === "1";
  } catch {
    return false; // storage unavailable — default to tracked, same fallback posture as getOrCreateSessionId
  }
}

/** The subset of the Storage API opting back in needs, beyond KeyValueStore. */
export interface RemovableKeyValueStore extends KeyValueStore {
  removeItem(key: string): void;
}

/** Persists the opt-out choice. Called once, from a `?notrack=1` / `?notrack=0` URL param
 * (Wizard.tsx) — after that the browser remembers it across reloads with no param needed. */
export function setTrackingDisabled(store: RemovableKeyValueStore, disabled: boolean): void {
  try {
    if (disabled) store.setItem(NO_TRACK_KEY, "1");
    else store.removeItem(NO_TRACK_KEY);
  } catch {
    // Private browsing / storage quota exceeded — the choice just won't persist across
    // reloads; not worth breaking the flow over.
  }
}

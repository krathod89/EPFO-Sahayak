import { describe, it, expect, vi } from "vitest";
import {
  getOrCreateSessionId,
  SESSION_ID_KEY,
  isTrackingDisabled,
  setTrackingDisabled,
  NO_TRACK_KEY,
  type KeyValueStore,
  type RemovableKeyValueStore,
} from "./session";

function fakeStore(initial: Record<string, string> = {}): KeyValueStore {
  const data = { ...initial };
  return {
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

function fakeRemovableStore(initial: Record<string, string> = {}): RemovableKeyValueStore {
  const data = { ...initial };
  return {
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
    removeItem: (key) => {
      delete data[key];
    },
  };
}

describe("getOrCreateSessionId", () => {
  it("returns the existing id when one is already stored", () => {
    const store = fakeStore({ [SESSION_ID_KEY]: "existing-id" });
    expect(getOrCreateSessionId(store)).toBe("existing-id");
  });

  it("generates and persists a new id when none is stored", () => {
    const store = fakeStore();
    const id = getOrCreateSessionId(store, () => "generated-id");
    expect(id).toBe("generated-id");
    expect(store.getItem(SESSION_ID_KEY)).toBe("generated-id");
  });

  it("returns the same id on a second call (persisted, not regenerated)", () => {
    const store = fakeStore();
    const generateId = vi.fn(() => "generated-id");
    getOrCreateSessionId(store, generateId);
    getOrCreateSessionId(store, generateId);
    expect(generateId).toHaveBeenCalledTimes(1);
  });

  it("falls back to a fresh id without throwing when storage access fails", () => {
    const brokenStore: KeyValueStore = {
      getItem: () => {
        throw new Error("storage disabled");
      },
      setItem: () => {
        throw new Error("storage disabled");
      },
    };
    expect(getOrCreateSessionId(brokenStore, () => "fallback-id")).toBe("fallback-id");
  });
});

// Internal/QA opt-out (?notrack=1 in Wizard.tsx) — session_id only ever correlates analytics
// events (never read by the actual diagnose logic), and both trackClientEvent and
// trackServerEvent already no-op on a falsy session id, so this is a total, safe kill switch.
describe("isTrackingDisabled / setTrackingDisabled", () => {
  it("is disabled by default (no flag set)", () => {
    const store = fakeStore();
    expect(isTrackingDisabled(store)).toBe(false);
  });

  it("reports disabled after setTrackingDisabled(true)", () => {
    const store = fakeRemovableStore();
    setTrackingDisabled(store, true);
    expect(isTrackingDisabled(store)).toBe(true);
    expect(store.getItem(NO_TRACK_KEY)).toBe("1");
  });

  it("opts back in — setTrackingDisabled(false) clears the flag", () => {
    const store = fakeRemovableStore({ [NO_TRACK_KEY]: "1" });
    expect(isTrackingDisabled(store)).toBe(true);
    setTrackingDisabled(store, false);
    expect(isTrackingDisabled(store)).toBe(false);
    expect(store.getItem(NO_TRACK_KEY)).toBeNull();
  });

  it("does not throw when storage access fails, and defaults to tracked", () => {
    const brokenStore: RemovableKeyValueStore = {
      getItem: () => {
        throw new Error("storage disabled");
      },
      setItem: () => {
        throw new Error("storage disabled");
      },
      removeItem: () => {
        throw new Error("storage disabled");
      },
    };
    expect(() => setTrackingDisabled(brokenStore, true)).not.toThrow();
    expect(isTrackingDisabled(brokenStore)).toBe(false);
  });
});

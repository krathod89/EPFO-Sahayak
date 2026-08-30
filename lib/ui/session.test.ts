import { describe, it, expect, vi } from "vitest";
import { getOrCreateSessionId, SESSION_ID_KEY, type KeyValueStore } from "./session";

function fakeStore(initial: Record<string, string> = {}): KeyValueStore {
  const data = { ...initial };
  return {
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
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

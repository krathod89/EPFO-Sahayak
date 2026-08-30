"use client";

// Client-side Mixpanel tracking (Engineering/ADR/0004-analytics-via-mixpanel.md). Only the
// four events that ADR names as client-owned live here: session_started,
// entry_point_selected, grievance_copied. (feedback_submitted needs a "was this helpful?"
// prompt that doesn't exist in the UI yet — not wired up until that's built.)
//
// Mixpanel project tokens are meant to be public/client-safe, the same way a publishable
// API key is — no backend proxy needed, matching lib/analytics.ts's server-side sibling.

import mixpanel from "mixpanel-browser";
import { BLOCKED_PROPERTY_KEYS } from "@/lib/blocked-analytics-keys";

const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
let initialized = false;

function ensureInit(distinctId: string) {
  if (!token || initialized) return;
  mixpanel.init(token, { autocapture: false, persistence: "localStorage" });
  mixpanel.identify(distinctId);
  initialized = true;
}

/** Best-effort client event tracking — never throws, and silently no-ops without a
 * configured token (e.g. local dev), matching the server tracker's fallback behavior. */
export function trackClientEvent(
  sessionId: string,
  eventType: string,
  properties: Record<string, unknown> = {}
): void {
  if (!sessionId || !token) return;

  const blocked = Object.keys(properties).filter((key) => BLOCKED_PROPERTY_KEYS.includes(key));
  if (blocked.length > 0) {
    console.warn(`trackClientEvent: dropped event "${eventType}" — blocked keys: ${blocked.join(", ")}`);
    return;
  }

  try {
    ensureInit(sessionId);
    mixpanel.track(eventType, properties);
  } catch {
    // Analytics must never break the core flow.
  }
}

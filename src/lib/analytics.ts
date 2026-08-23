"use client";

import posthog from "posthog-js";

export function trackEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  posthog.capture(event, properties);
}

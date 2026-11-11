"use client";

import posthog from "posthog-js";
import {
  canSendAnalytics,
  scrubAnalyticsValue,
} from "@/lib/analytics-policy";

export function trackEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  if (!canSendAnalytics()) return;
  const safe = scrubAnalyticsValue(properties);
  posthog.capture(
    event,
    safe && typeof safe === "object" ? (safe as Record<string, unknown>) : undefined,
  );
}

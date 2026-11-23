import posthog from "posthog-js";
import {
  canSendAnalytics,
  scrubAnalyticsValue,
} from "@/lib/analytics-policy";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

if (token && canSendAnalytics()) {
  posthog.init(token, {
    api_host: "/ingest",
    ui_host: "https://eu.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: true,
    debug: false,
    person_profiles: "identified_only",
    disable_session_recording: true,
    before_send: (event) => {
      if (!event) return event;
      return scrubAnalyticsValue(event) as typeof event;
    },
  });
}

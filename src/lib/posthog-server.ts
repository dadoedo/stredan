import { cookies, headers } from "next/headers";
import { PostHog } from "posthog-node";
import { analyticsAllowed } from "@/lib/analytics-policy";

let client: PostHog | null = null;

export function getPostHogClient(): PostHog | null {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!token) return null;
  if (!client) {
    client = new PostHog(token, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return client;
}

export async function getPostHogDistinctId(): Promise<string> {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!token) return "anonymous";
  const jar = await cookies();
  const raw = jar.get(`ph_${token}_posthog`)?.value;
  if (!raw) return "anonymous";
  try {
    const decoded = (() => {
      try {
        return JSON.parse(raw) as { distinct_id?: string };
      } catch {
        return JSON.parse(decodeURIComponent(raw)) as { distinct_id?: string };
      }
    })();
    return decoded.distinct_id || "anonymous";
  } catch {
    return "anonymous";
  }
}

export async function serverAnalyticsAllowed(): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") return false;
  const host = (await headers()).get("host") ?? "";
  return analyticsAllowed({
    nodeEnv: "production",
    hostname: host,
    optedOut: false,
  });
}

export async function captureServerEvent(
  event: string,
  properties?: Record<string, unknown>,
  distinctId?: string,
) {
  if (!(await serverAnalyticsAllowed())) return;
  const ph = getPostHogClient();
  if (!ph) return;
  ph.capture({
    distinctId: distinctId ?? (await getPostHogDistinctId()),
    event,
    properties,
  });
  await ph.flush();
}

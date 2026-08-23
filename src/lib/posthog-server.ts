import { cookies } from "next/headers";
import { PostHog } from "posthog-node";

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

export async function captureServerEvent(
  event: string,
  properties?: Record<string, unknown>,
  distinctId?: string,
) {
  const ph = getPostHogClient();
  if (!ph) return;
  ph.capture({
    distinctId: distinctId ?? (await getPostHogDistinctId()),
    event,
    properties,
  });
  await ph.flush();
}

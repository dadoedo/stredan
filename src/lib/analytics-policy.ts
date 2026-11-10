export const ANALYTICS_OPT_OUT_KEY = "stredan-analytics-opt-out";

const ANALYTICS_HOSTS = new Set(["stredan.sk", "www.stredan.sk"]);

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

const SENSITIVE_KEY =
  /email|e-mail|phone|tel|message|first_name|last_name|full_name|password/i;

export function analyticsAllowed(input: {
  nodeEnv: string | undefined;
  hostname: string;
  optedOut: boolean;
}): boolean {
  if (input.optedOut) return false;
  if (input.nodeEnv !== "production") return false;
  const hostname = input.hostname.split(":")[0]?.trim().toLowerCase() ?? "";
  return ANALYTICS_HOSTS.has(hostname);
}

export function scrubAnalyticsValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(EMAIL, "[redacted]");
  }
  if (Array.isArray(value)) return value.map(scrubAnalyticsValue);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value)) {
      if (SENSITIVE_KEY.test(key)) continue;
      out[key] = scrubAnalyticsValue(inner);
    }
    return out;
  }
  return value;
}

export function canSendAnalytics(): boolean {
  if (typeof window === "undefined") return false;
  let optedOut = false;
  try {
    optedOut = window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "1";
  } catch {
    optedOut = false;
  }
  return analyticsAllowed({
    nodeEnv: process.env.NODE_ENV,
    hostname: window.location.hostname,
    optedOut,
  });
}

const windows = new Map<string, number[]>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function loginAllowed(ip: string): boolean {
  prune(ip);
  const stamps = windows.get(ip) ?? [];
  return stamps.length < MAX_ATTEMPTS;
}

export function recordLoginAttempt(ip: string): void {
  prune(ip);
  const stamps = windows.get(ip) ?? [];
  stamps.push(Date.now());
  windows.set(ip, stamps);
}

export function remainingLoginAttempts(ip: string): number {
  prune(ip);
  const stamps = windows.get(ip) ?? [];
  return Math.max(0, MAX_ATTEMPTS - stamps.length);
}

function prune(ip: string): void {
  const cutoff = Date.now() - WINDOW_MS;
  const stamps = (windows.get(ip) ?? []).filter((t) => t >= cutoff);
  if (stamps.length === 0) windows.delete(ip);
  else windows.set(ip, stamps);
}

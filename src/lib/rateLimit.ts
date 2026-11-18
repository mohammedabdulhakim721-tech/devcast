// Simple in-memory limiter: ~10 generations per hour per IP.
// Note: on serverless this resets when instances restart. Fine for an MVP.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_HITS = 10;
const hits = new Map<string, number[]>();

export function allow(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_HITS) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  return true;
}

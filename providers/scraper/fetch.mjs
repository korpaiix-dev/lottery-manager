/**
 * providers/scraper/fetch.mjs
 * Shared fetch helpers with SSRF guard + LRU cache.
 * Extracted from server.js Phase B (2026-06-19).
 */

const SCRAPER_CACHE_TTL = 30 * 1000;
const SCRAPER_CACHE_MAX = 200;
const cache = new Map();

/** SSRF guard: block private/loopback IP ranges */
export function isPrivateHostname(hostname) {
  const h = String(hostname || "").toLowerCase();
  if (!h || h === "localhost" || h === "0.0.0.0") return true;
  if (/^127\./.test(h)) return true;
  if (/^10\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[01])\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true;
  if (h === "::1" || h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) return true;
  return false;
}

/** Strip cache-buster query params */
export function cacheKey(url) {
  try {
    const u = new URL(url);
    u.searchParams.delete("t");
    u.searchParams.delete("_");
    u.searchParams.delete("ts");
    return u.toString();
  } catch { return url; }
}

function evictIfFull() {
  if (cache.size <= SCRAPER_CACHE_MAX) return;
  const cutoff = cache.size - SCRAPER_CACHE_MAX + 10;
  let i = 0;
  for (const k of cache.keys()) {
    cache.delete(k);
    if (++i >= cutoff) break;
  }
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of cache.entries()) {
    if (now - v.ts > SCRAPER_CACHE_TTL) cache.delete(k);
  }
}, 5 * 60 * 1000).unref();

/** Fetch a URL with SSRF guard, timeout, and shared cache */
export async function fetchScraperUrl(url, headers = {}) {
  try {
    const u = new URL(url);
    if (!["http:", "https:"].includes(u.protocol)) throw new Error("bad_protocol");
    if (isPrivateHostname(u.hostname)) throw new Error("private_ip_blocked");
  } catch (e) {
    if (e.message === "bad_protocol" || e.message === "private_ip_blocked") {
      throw new Error("ssrf_" + e.message);
    }
    throw new Error("invalid_url");
  }

  const key = cacheKey(url);
  const cached = cache.get(key);
  if (cached && (Date.now() - cached.ts) < SCRAPER_CACHE_TTL) return cached.data;

  const ctrl = new AbortController();
  const tmr = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json,text/plain,*/*",
        ...headers,
      },
      signal: ctrl.signal,
    });
    clearTimeout(tmr);
    if (!r.ok) throw new Error("http_" + r.status);
    const data = await r.json();
    cache.set(key, { ts: Date.now(), data });
    evictIfFull();
    return data;
  } catch (e) {
    clearTimeout(tmr);
    throw new Error("fetch_" + (e.name === "AbortError" ? "timeout" : e.message));
  }
}

export function getCacheStats() {
  return { size: cache.size, max: SCRAPER_CACHE_MAX, ttl: SCRAPER_CACHE_TTL };
}

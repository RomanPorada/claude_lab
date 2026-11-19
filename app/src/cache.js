const { createClient } = require("redis");

const ENABLED = process.env.CACHE_ENABLED !== "false";
const TTL = Number(process.env.CACHE_TTL_SECONDS || 45);
const REDIS_URL = process.env.REDIS_URL;

let client = null;
if (REDIS_URL) {
  client = createClient({
    url: REDIS_URL,
    disableOfflineQueue: true,
    socket: { connectTimeout: 2000, reconnectStrategy: (n) => Math.min(n * 200, 3000) },
  });
  client.on("error", (e) => console.error("redis:", e.message));
  client.connect().catch(() => {});
}

const ready = () => Boolean(client && client.isReady);
const withTimeout = (p, ms = 250) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("redis timeout")), ms))]);

async function safe(fn) {
  try {
    return await withTimeout(fn());
  } catch {
    return null;
  }
}

function count(name) {
  if (ready()) safe(() => client.incr(name));
}

const queryKey = (prefix, query) =>
  `${prefix}:${new URLSearchParams(Object.entries(query).sort()).toString()}`;

const inflight = new Map();

async function cached(key, loader, ttl = TTL) {
  if (!ENABLED || !ready()) {
    count("stats:db_reads");
    return { value: await loader(), source: ENABLED ? "BYPASS" : "OFF" };
  }

  const hit = await safe(() => client.get(key));
  if (hit !== null) {
    count("stats:hits");
    return { value: JSON.parse(hit), source: "HIT" };
  }

  if (inflight.has(key)) {
    count("stats:coalesced");
    return { value: await inflight.get(key), source: "COALESCED" };
  }

  count("stats:misses");
  count("stats:db_reads");
  const p = (async () => {
    const value = await loader();
    const jitter = 1 + (Math.random() * 0.2 - 0.1);
    await safe(() => client.set(key, JSON.stringify(value), { EX: Math.max(1, Math.round(ttl * jitter)) }));
    return value;
  })();
  inflight.set(key, p);
  try {
    return { value: await p, source: "MISS" };
  } finally {
    inflight.delete(key);
  }
}

const invalidate = (key) => safe(() => (ready() ? client.del(key) : null));

const STAT_KEYS = ["hits", "misses", "coalesced", "db_reads"];

async function getStats() {
  if (!ready()) return { redis: "unavailable" };
  const vals = await safe(() => client.mGet(STAT_KEYS.map((k) => `stats:${k}`)));
  const s = Object.fromEntries(STAT_KEYS.map((k, i) => [k, Number(vals?.[i] || 0)]));
  const lookups = s.hits + s.misses + s.coalesced;
  return { cache_enabled: ENABLED, ttl_seconds: TTL, ...s, hit_ratio: lookups ? Number((s.hits / lookups).toFixed(4)) : null };
}

const resetStats = () => safe(() => client.del(STAT_KEYS.map((k) => `stats:${k}`)));

async function close() {
  if (client && client.isOpen) await safe(() => client.quit());
}

module.exports = { cached, invalidate, queryKey, getStats, resetStats, close };
import {
  REGIONS,
  EPIC_BASE,
  GOG_URL,
  UNITY_URL,
  FAB_URL,
  fetchText,
  parseEpic,
  parseGog,
  parseUnity,
  parseFab,
} from "./parsers.mjs";

const CACHE_TTL = 5 * 60 * 1000;

interface CacheEntry {
  at: number;
  data: unknown;
}

const cache = new Map<string, CacheEntry>();

async function cachedFetch(key: string, url: string, parse: (html: string) => unknown) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) {
    return { ok: true, data: hit.data, fetchedAt: hit.at, stale: false };
  }
  try {
    const html = await fetchText(url);
    const data = parse(html);
    const at = Date.now();
    cache.set(key, { at, data });
    return { ok: true, data, fetchedAt: at, stale: false };
  } catch (err) {
    if (hit) return { ok: true, data: hit.data, fetchedAt: hit.at, stale: true };
    const reason = err instanceof Error ? err.message : "unknown";
    return { ok: false, error: reason.startsWith("upstream_") ? reason : "upstream_unavailable", sourceUrl: url };
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }
  const url = new URL(request.url);
  const regionParam = (url.searchParams.get("region") || "US").toUpperCase();
  const region = REGIONS.includes(regionParam) ? regionParam : "US";
  const source = url.searchParams.get("source") || "all";

  const wantEpic = source === "all" || source === "epic";
  const wantGog = source === "all" || source === "gog";
  const wantUnity = source === "all" || source === "unity";
  const wantFab = source === "all" || source === "fab";

  const [epic, gog, unity, fab] = await Promise.all([
    wantEpic
      ? cachedFetch("epic:" + region, EPIC_BASE + region, (html) => ({ games: parseEpic(html) }))
      : Promise.resolve(null),
    wantGog ? cachedFetch("gog", GOG_URL, parseGog) : Promise.resolve(null),
    wantUnity ? cachedFetch("unity", UNITY_URL, parseUnity) : Promise.resolve(null),
    wantFab ? cachedFetch("fab", FAB_URL, parseFab) : Promise.resolve(null),
  ]);

  const body: Record<string, unknown> = { ok: true, region, serverTime: Date.now() };
  if (epic) {
    body.epic = epic.ok
      ? { ok: true, ...(epic.data as object), fetchedAt: epic.fetchedAt, stale: epic.stale, sourceUrl: EPIC_BASE + region }
      : epic;
  }
  if (gog) {
    body.gog = gog.ok
      ? { ok: true, ...(gog.data as object), fetchedAt: gog.fetchedAt, stale: gog.stale, sourceUrl: GOG_URL }
      : gog;
  }
  if (unity) {
    body.unity = unity.ok
      ? { ok: true, ...(unity.data as object), fetchedAt: unity.fetchedAt, stale: unity.stale, sourceUrl: UNITY_URL }
      : unity;
  }
  if (fab) {
    body.fab = fab.ok
      ? { ok: true, ...(fab.data as object), fetchedAt: fab.fetchedAt, stale: fab.stale, sourceUrl: FAB_URL }
      : fab;
  }
  return json(body);
}
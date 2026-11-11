import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
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
} from "../functions/parsers.mjs";

const OUT = fileURLToPath(new URL("../web/data.json", import.meta.url));
const CONCURRENCY = 4;

async function readPrev() {
  try {
    return JSON.parse(await readFile(OUT, "utf8"));
  } catch {
    return null;
  }
}

async function pool(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function fetchSource(url, parse, prevEntry) {
  const now = Date.now();
  try {
    const html = await fetchText(url);
    const data = parse(html);
    return { ok: true, ...data, fetchedAt: now, stale: false, sourceUrl: url };
  } catch (err) {
    if (prevEntry && prevEntry.ok) {
      return { ...prevEntry, stale: true };
    }
    const reason = err instanceof Error ? err.message : "unknown";
    return {
      ok: false,
      error: reason.startsWith("upstream_") ? reason : "upstream_unavailable",
      sourceUrl: url,
    };
  }
}

function summarize(label, entry) {
  if (!entry.ok) {
    console.log(`  ${label}: FAIL (${entry.error})`);
    return;
  }
  const count = entry.games ? entry.games.length : entry.items ? entry.items.length : entry.active ? 1 : 0;
  console.log(`  ${label}: ok${entry.stale ? " (stale)" : ""} · ${count} 条`);
}

async function main() {
  const prev = await readPrev();
  const prevRegions = (prev && prev.regions) || {};
  console.log("抓取限免数据…");

  const regionEntries = await pool(REGIONS, CONCURRENCY, async (region) => {
    const url = EPIC_BASE + region;
    const entry = await fetchSource(url, (html) => ({ games: parseEpic(html) }), prevRegions[region]);
    return [region, entry];
  });
  const regions = Object.fromEntries(regionEntries);

  const [gog, unity, fab] = await Promise.all([
    fetchSource(GOG_URL, parseGog, prev && prev.gog),
    fetchSource(UNITY_URL, parseUnity, prev && prev.unity),
    fetchSource(FAB_URL, parseFab, prev && prev.fab),
  ]);

  const data = { ok: true, generatedAt: Date.now(), regions, gog, unity, fab };
  await writeFile(OUT, JSON.stringify(data, null, 2) + "\n", "utf8");

  console.log("Epic 各区：");
  for (const region of REGIONS) summarize(region, regions[region]);
  console.log("其它平台：");
  summarize("GOG", gog);
  summarize("Unity", unity);
  summarize("Fab", fab);
  console.log(`已写入 ${OUT}`);
}

main().catch((err) => {
  console.error("同步脚本异常：", err);
  process.exit(1);
});
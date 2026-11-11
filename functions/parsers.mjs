export const REGIONS = ["US", "CN", "HK", "TW", "RU", "JP", "KR", "SG", "TR", "AR", "BR", "AU"];
export const EPIC_BASE = "https://www.dogfight360.com/tools/epic_free/?";
export const GOG_URL = "https://www.dogfight360.com/tools/gog_free/";
export const GOG_LIBRARY = "https://www.gog.com/zh/account";
export const GOG_CLAIM = "https://www.gog.com/giveaway/claim";
export const UNITY_URL = "https://assetstore.unity.com/zh-CN/publisher-sale";
export const UNITY_BASE = "https://assetstore.unity.com";
export const FAB_URL = "https://www.fab.com/limited-time-free";
export const FAB_BASE = "https://www.fab.com";
export const FETCH_TIMEOUT = 15000;

export function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

export function attr(tag, name) {
  const m = tag.match(new RegExp(name + '="([^"]*)"'));
  return m ? decodeEntities(m[1]) : "";
}

export async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "zh-CN,zh;q=0.9",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });
  if (!res.ok) throw new Error("upstream_http_" + res.status);
  return await res.text();
}

export function parseEpic(html) {
  const games = [];
  const chunks = html.split('<div class="game-card').slice(1);
  for (const chunk of chunks) {
    const tag = chunk.slice(0, chunk.indexOf(">"));
    const offerId = attr(tag, "data-offer-id");
    const sandboxId = attr(tag, "data-sandbox-id");
    const platform = attr(tag, "data-platform") || "pc";
    if (!offerId || !sandboxId) continue;
    const imgM = chunk.match(/<img[^>]*\ssrc="([^"]+)"/);
    const titleM = chunk.match(/<div class="game-title">([\s\S]*?)<\/div>/);
    const game = {
      id: offerId + "_" + sandboxId,
      title: titleM ? decodeEntities(titleM[1]).trim() : "未知游戏",
      img: imgM ? decodeEntities(imgM[1]) : "",
      url: attr(tag, "data-url"),
      offerId,
      sandboxId,
      platform,
      start: 0,
      end: 0,
      deadline: 0,
      status: /status-upcoming/.test(chunk) ? "upcoming" : "active",
      selectable: chunk.includes("game-checkbox"),
    };
    const dateRe = /<span class="date-label">([^<]*)<\/span><span class="timestamp" data-timestamp="(\d+)"/g;
    let dm;
    while ((dm = dateRe.exec(chunk)) !== null) {
      const label = dm[1].trim();
      const ts = Number(dm[2]);
      if (label.includes("开始")) game.start = ts;
      else if (label.includes("结束")) game.end = ts;
      else if (label.includes("截止")) game.deadline = ts;
    }
    games.push(game);
  }
  return games;
}

export function parseGog(html) {
  const endM = html.match(/data-end-time="(\d+)"/);
  const endTime = endM ? Number(endM[1]) : 0;
  const active = endTime * 1000 > Date.now();
  const updM = html.match(/上次更新\s*([0-9]{4}-[0-9]{2}-[0-9]{2}\s+[0-9]{2}:[0-9]{2})/);
  const linkTagM = html.match(/<a[^>]*js-claim-link[^>]*>/);
  let claimUrl = linkTagM ? attr(linkTagM[0], "href") : "";
  if (!claimUrl && active) claimUrl = GOG_CLAIM;
  let title = "";
  let img = "";
  if (active) {
    const mainM = html.match(/<main[\s\S]*?<\/main>/);
    const scope = mainM ? mainM[0] : html;
    const titleM = scope.match(/<div class="game-title">([\s\S]*?)<\/div>/) ||
      scope.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) ||
      scope.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    if (titleM) title = decodeEntities(titleM[1].replace(/<[^>]+>/g, "")).trim();
    const imgM = scope.match(/<img[^>]*\ssrc="([^"]+)"/);
    if (imgM) img = decodeEntities(imgM[1]);
  }
  return {
    active,
    endTime,
    title: title || "GOG 限时免费游戏",
    img,
    claimUrl,
    updatedAt: updM ? updM[1].replace(/\s+/g, " ") : "",
    libraryUrl: GOG_LIBRARY,
  };
}

export function parseUnity(html) {
  const secM = html.match(/<section data-type="CalloutSlim"[\s\S]*?<\/section>/);
  if (!secM) {
    return { active: false, caption: "", title: "", body: "", code: "", img: "", url: UNITY_URL, footnote: "", endTime: 0 };
  }
  const sec = secM[0];
  const strip = (s) => decodeEntities(s.replace(/<[^>]+>/g, "")).trim();
  const imgM = sec.match(/<img[^>]*\ssrc="([^"]+)"/);
  const captionM = sec.match(/<span class="caption[^"]*"[^>]*>([\s\S]*?)<\/span>/);
  const titleM = sec.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
  const bodyM = sec.match(/<span class="body[^"]*"[^>]*>([\s\S]*?)<\/span>/);
  const linkM = sec.match(/<a[^>]*\shref="([^"]+)"/);
  const footM = sec.match(/<p class="truncate[^"]*"[^>]*>([\s\S]*?)<\/p>/);
  const body = bodyM ? strip(bodyM[1]) : "";
  let code = "";
  const codeM = body.match(/(?:代码|code)\s+([A-Za-z0-9]+)/i) || body.match(/\b([A-Z][A-Z0-9]{3,})\b/);
  if (codeM) code = codeM[1].toUpperCase();
  const href = linkM ? decodeEntities(linkM[1]) : "";
  const url = href ? (href.startsWith("http") ? href : UNITY_BASE + href) : UNITY_URL;
  let endTime = 0;
  const un = html.replace(/\\"/g, '"');
  const em = un.match(/"trackAsPromo":true,"title":"[^"]+","visibilitySchedule":\{[^}]*?"endDate":"([^"]+)"/);
  if (em) {
    const t = new Date(em[1]).getTime();
    if (!Number.isNaN(t)) endTime = Math.floor(t / 1000);
  }
  return {
    active: true,
    caption: captionM ? strip(captionM[1]) : "发布者资源赠送",
    title: titleM ? strip(titleM[1]) : "Unity 每周精选资源",
    body,
    code,
    img: imgM ? decodeEntities(imgM[1]) : "",
    url,
    footnote: footM ? strip(footM[1]) : "",
    endTime,
  };
}

export function parseFab(html) {
  const empty = { active: false, items: [], endTime: 0 };
  const open = '<script id="js-json-data-prefetched-data" type="application/json">';
  const i = html.indexOf(open);
  if (i < 0) return empty;
  const start = i + open.length;
  const end = html.indexOf("</script>", start);
  if (end < 0) return empty;
  let data;
  try {
    data = JSON.parse(html.slice(start, end));
  } catch {
    return empty;
  }
  const blade = data["/i/blades/free_content_blade"];
  const tiles = blade && Array.isArray(blade.tiles) ? blade.tiles : [];
  let endTime = 0;
  const items = [];
  for (const tile of tiles) {
    const l = tile && tile.listing;
    if (!l || typeof l.uid !== "string") continue;
    const licenses = Array.isArray(l.licenses) ? l.licenses : [];
    const pt = licenses[0] && licenses[0].priceTier;
    const endIso = pt && typeof pt.discountEndDate === "string" ? pt.discountEndDate : "";
    if (endIso) {
      const ms = Date.parse(endIso);
      if (!Number.isNaN(ms)) endTime = Math.max(endTime, Math.floor(ms / 1000));
    }
    let img = "";
    const thumbs = Array.isArray(l.thumbnails) ? l.thumbnails : [];
    const images = (thumbs[0] && Array.isArray(thumbs[0].images) ? thumbs[0].images : []);
    const pick =
      images.find((im) => im.width === 640) ||
      images.find((im) => im.width === 960) ||
      images[images.length - 1];
    if (pick && pick.url) img = pick.url;
    const formats = (Array.isArray(l.assetFormats) ? l.assetFormats : [])
      .map((f) => {
        const t = f && f.assetFormatType;
        return t && typeof t.code === "string" ? t.code : "";
      })
      .filter(Boolean);
    const user = l.user;
    const startingPrice = l.startingPrice;
    items.push({
      id: l.uid,
      title: typeof l.title === "string" && l.title ? l.title : "未命名资源",
      img,
      url: FAB_BASE + "/listings/" + l.uid,
      seller: user && typeof user.sellerName === "string" ? user.sellerName : "",
      originalPrice: startingPrice && typeof startingPrice.price === "number" ? startingPrice.price : 0,
      formats,
      rating: typeof l.averageRating === "number" ? l.averageRating : 0,
      reviewCount: typeof l.reviewCount === "number" ? l.reviewCount : 0,
      productType:
        typeof l.listingType === "string"
          ? l.listingType
          : typeof l.productType === "string"
            ? l.productType
            : "",
    });
  }
  const active = items.length > 0 && endTime * 1000 > Date.now();
  return { active, items, endTime };
}
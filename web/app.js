/* ===== 喜加一雷达 ===== */
"use strict";

const REGIONS = [
  ["CN", "国区"], ["HK", "港区"], ["TW", "台区"], ["US", "美区"],
  ["RU", "俄区"], ["JP", "日区"], ["KR", "韩区"], ["SG", "新加坡"],
  ["TR", "土耳其"], ["AR", "阿根廷"], ["BR", "巴西"], ["AU", "澳大利亚"],
];
const EPIC_ORDERS_URL = "https://www.epicgames.com/account/transactions?productName=egs&historyType=PAYMENT_HISTORY";
const PLATFORM_LABEL = { pc: "PC 端", android: "Android 端", ios: "iOS 端" };
const FAB_FORMAT_LABEL = { "unreal-engine": "Unreal Engine", unity: "Unity", blender: "Blender", "3ds-max": "3ds Max", maya: "Maya", cinema4d: "Cinema 4D", houdini: "Houdini", godot: "Godot" };
const FAB_FORMAT_CLASS = { "unreal-engine": "ue", unity: "unity" };
const FAB_TYPE_LABEL = { "3d-model": "3D 模型", "game-system": "游戏系统", "game-template": "游戏模板", material: "材质", "smart-material": "智能材质", vfx: "特效", audio: "音频", animation: "动画", tool: "工具", environment: "环境", character: "角色", prop: "道具", vehicle: "载具", plant: "植物", decal: "贴花", hdri: "HDRI", brush: "笔刷" };
const PLATFORM_SVG = {
  pc: '<svg viewBox="0 0 24 24"><path d="M0 3.449L9.75 2.1v9.45H0V3.449zM0 12.45h9.75v9.45L0 20.55v-8.1zM11.25 1.899L24 0v11.55H11.25V1.899zM11.25 12.45H24v11.55l-12.75-1.9v-9.65z"/></svg>',
  android: '<svg viewBox="0 0 24 24"><path d="M17.528 14.583a1 1 0 1 1 0-2 1 1 0 0 1 0 2m-11.046 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2m11.405-6.02 1.997-3.46a.415.415 0 1 0-.72-.416L17.142 8.19a12.3 12.3 0 0 0-5.137-1.099c-1.854 0-3.59.394-5.137 1.1L4.846 4.686a.416.416 0 0 0-.72.416l1.997 3.46C2.693 10.428.348 13.9.005 18.003h24c-.343-4.103-2.69-7.575-6.118-9.44"/></svg>',
  ios: '<svg viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.56 2.95-1.39"/></svg>',
};
const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

const state = {
  region: localStorage.getItem("fr-region") || "US",
  theme: ["auto", "light", "dark"].includes(localStorage.getItem("fr-theme")) ? localStorage.getItem("fr-theme") : "auto",
  epic: null,
  gog: null,
  unity: null,
  fab: null,
  loading: false,
  gogTimer: null,
  unityTimer: null,
  fabTimer: null,
};
if (!REGIONS.some(([code]) => code === state.region)) state.region = "US";

/* ===== 主题：跟随系统 / 浅色 / 深色 ===== */
const THEME_ORDER = ["auto", "light", "dark"];
const THEME_LABEL = { auto: "跟随系统", light: "浅色", dark: "深色" };
const THEME_ICON = {
  auto: '<svg viewBox="0 0 24 24" class="i" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 20h8M12 16v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  light: '<svg viewBox="0 0 24 24" class="i" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  dark: '<svg viewBox="0 0 24 24" class="i" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
};
const themeMedia = window.matchMedia("(prefers-color-scheme: dark)");
function effectiveTheme() {
  return state.theme === "auto" ? (themeMedia.matches ? "dark" : "light") : state.theme;
}
const FAVICON_COLORS = {
  light: { bg: "#fafaf9", ink: "#1c1917", accent: "#b45309" },
  dark: { bg: "#1c1a19", ink: "#f5f5f4", accent: "#d97706" },
};
function faviconSvg(theme) {
  const c = FAVICON_COLORS[theme] || FAVICON_COLORS.light;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">'
    + '<rect width="40" height="40" rx="9" fill="' + c.bg + '"/>'
    + '<g fill="none" stroke="' + c.ink + '"><circle cx="20" cy="20" r="15" stroke-opacity=".25" stroke-width="2"/><circle cx="20" cy="20" r="9.5" stroke-opacity=".35" stroke-width="1.6"/><circle cx="20" cy="20" r="4" stroke-opacity=".45" stroke-width="1.4"/></g>'
    + '<path d="M20 20 L20 5 A15 15 0 0 1 30.6 9.4 Z" fill="' + c.accent + '" fill-opacity=".4"/>'
    + '<line x1="20" y1="20" x2="20" y2="5" stroke="' + c.accent + '" stroke-width="2.2" stroke-linecap="round"/>'
    + '<circle cx="26" cy="13" r="2.4" fill="' + c.accent + '"/>'
    + '<circle cx="13" cy="25" r="1.8" fill="' + c.ink + '" fill-opacity=".55"/>'
    + '<circle cx="20" cy="20" r="1.6" fill="' + c.ink + '"/></svg>';
}
function applyFavicon() {
  const link = document.querySelector('link[rel=icon]');
  if (link) link.href = "data:image/svg+xml," + encodeURIComponent(faviconSvg(effectiveTheme()));
}
function applyTheme() {
  document.documentElement.setAttribute("data-theme", effectiveTheme());
  document.documentElement.setAttribute("data-theme-mode", state.theme);
  applyFavicon();
  const btn = $("#theme-btn");
  if (!btn) return;
  const next = THEME_ORDER[(THEME_ORDER.indexOf(state.theme) + 1) % THEME_ORDER.length];
  btn.innerHTML = THEME_ICON[state.theme];
  btn.title = "主题：" + THEME_LABEL[state.theme] + " · 点击切换为" + THEME_LABEL[next];
  btn.setAttribute("aria-label", "切换主题，当前为" + THEME_LABEL[state.theme]);
}
function cycleTheme() {
  state.theme = THEME_ORDER[(THEME_ORDER.indexOf(state.theme) + 1) % THEME_ORDER.length];
  try { localStorage.setItem("fr-theme", state.theme); } catch (e) {}
  applyTheme();
  toast(state.theme === "auto" ? "已切换为跟随系统，随系统自动明暗" : "已切换为" + THEME_LABEL[state.theme] + "模式");
}
if (themeMedia.addEventListener) themeMedia.addEventListener("change", () => { if (state.theme === "auto") applyTheme(); });
else if (themeMedia.addListener) themeMedia.addListener(() => { if (state.theme === "auto") applyTheme(); });

/* ===== 工具 ===== */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function safeImg(url) {
  return typeof url === "string" && /^https:\/\//i.test(url) ? url : "";
}
function pad(n) { return String(n).padStart(2, "0"); }
function formatDateTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts * 1000);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function formatClock(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function remainParts(targetTs) {
  const ms = targetTs * 1000 - Date.now();
  if (ms <= 0) return null;
  const total = Math.floor(ms / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}
function remainText(targetTs) {
  const p = remainParts(targetTs);
  if (!p) return null;
  const hms = `${pad(p.hours)}:${pad(p.minutes)}:${pad(p.seconds)}`;
  return p.days > 0 ? `${p.days} 天 ${hms}` : hms;
}
let toastTimer = 0;
function toast(msg, isErr) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.toggle("err", !!isErr);
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

/* ===== 数据加载 ===== */
async function fetchJson(url) {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) {
    const err = new Error("http_" + res.status);
    err.status = res.status;
    throw err;
  }
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const err = new Error("not_json");
    err.status = 404;
    throw err;
  }
  const data = await res.json();
  if (!data || data.ok !== true) throw new Error("bad_payload");
  return data;
}

/* ===== 静态数据降级：GitHub Pages 无 Function 时读 data.json ===== */
let staticData = null;
let functionUnavailable = false;
async function getStaticData(force) {
  if (!staticData || force) staticData = await fetchJson("data.json");
  return staticData;
}
function payloadFromStatic(data, region, source) {
  const payload = { ok: true, region, serverTime: data.generatedAt, static: true };
  if (source === "all" || source === "epic") payload.epic = (data.regions && data.regions[region]) || { ok: false };
  if (source === "all" || source === "gog") payload.gog = data.gog || { ok: false };
  if (source === "all" || source === "unity") payload.unity = data.unity || { ok: false };
  if (source === "all" || source === "fab") payload.fab = data.fab || { ok: false };
  return payload;
}
async function fetchData(region, source, force) {
  if (!functionUnavailable) {
    try {
      return await fetchJson(`/functions/v1/app?region=${region}&source=${source}`);
    } catch (err) {
      if (err.status !== 404) throw err;
      functionUnavailable = true;
    }
  }
  return payloadFromStatic(await getStaticData(force), region, source);
}

function skeletonHtml(n) {
  let cards = "";
  for (let i = 0; i < n; i++) {
    cards += '<div class="skel-card"><div class="sk-img shimmer"></div><div class="sk-line shimmer"></div><div class="sk-line short shimmer"></div></div>';
  }
  return `<div class="skeleton-grid">${cards}</div>`;
}

function errorPanel(source, preview) {
  const sourceUrl = source === "epic"
    ? "https://www.dogfight360.com/tools/epic_free/?" + state.region
    : source === "unity"
      ? "https://assetstore.unity.com/zh-CN/publisher-sale"
      : source === "fab"
        ? "https://www.fab.com/limited-time-free"
        : "https://www.dogfight360.com/tools/gog_free/";
  const name = source === "epic" ? "Epic" : source === "unity" ? "Unity" : source === "fab" ? "Fab" : "GOG";
  const title = preview ? "设计预览 · 数据服务未连接" : name + " 雷达暂时失联";
  const desc = preview
    ? "当前为本地设计预览环境，实时限免数据将在站点发布后自动接入。界面与交互均可正常体验。"
    : "未能读取限免数据，可以重试或直接访问数据来源页。";
  return `<div class="error-panel${preview ? " preview" : ""}">
    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(desc)}</p>
    <div class="actions">
      <button class="btn ghost" type="button" data-retry="${source}">重新扫描</button>
      <a class="btn ghost" href="${sourceUrl}" target="_blank" rel="noopener noreferrer">打开数据来源页</a>
    </div>
  </div>`;
}

async function loadAll(showSkeleton, force) {
  if (state.loading) return;
  state.loading = true;
  const refreshBtn = $("#refresh-btn");
  refreshBtn.classList.add("spinning");
  if (showSkeleton) {
    $("#epic-content").innerHTML = skeletonHtml(4);
    $("#gog-content").innerHTML = '<div class="gog-panel"><div class="gog-empty"><div><div class="sk-line shimmer" style="width:40%"></div><div class="sk-line shimmer" style="width:75%"></div><div class="sk-line short shimmer" style="width:60%"></div></div></div></div>';
    $("#unity-content").innerHTML = '<div class="unity-panel"><div class="unity-empty"><div><div class="sk-line shimmer" style="width:40%"></div><div class="sk-line shimmer" style="width:75%"></div><div class="sk-line short shimmer" style="width:60%"></div></div></div></div>';
    $("#fab-content").innerHTML = '<div class="fab-panel"><div class="fab-grid">' + Array.from({ length: 3 }, () => '<div class="skel-card"><div class="sk-img shimmer" style="aspect-ratio:16/10"></div><div class="sk-line shimmer"></div><div class="sk-line short shimmer"></div></div>').join("") + '</div></div>';
  }
  try {
    const data = await fetchData(state.region, "all", force);
    state.epic = data.epic || { ok: false };
    state.gog = data.gog || { ok: false };
    state.unity = data.unity || { ok: false };
    state.fab = data.fab || { ok: false };
    clearSelection();
    renderEpic();
    renderGog();
    renderUnity();
    renderFab();
    renderStats();
    renderUpdated(data);
  } catch (err) {
    const preview = err.status === 404;
    state.epic = { ok: false, preview };
    state.gog = { ok: false, preview };
    state.unity = { ok: false, preview };
    state.fab = { ok: false, preview };
    renderEpic();
    renderGog();
    renderUnity();
    renderFab();
    renderStats();
    $("#last-updated").textContent = preview ? "设计预览模式 · 发布后接入实时数据" : "雷达连接失败，请稍后重试";
    if (!preview) toast("数据加载失败，请检查网络后重试", true);
  } finally {
    state.loading = false;
    refreshBtn.classList.remove("spinning");
  }
}

async function loadEpicOnly() {
  const overlay = $("#region-overlay");
  overlay.classList.add("active");
  overlay.setAttribute("aria-hidden", "false");
  try {
    const data = await fetchData(state.region, "epic", false);
    state.epic = data.epic || { ok: false };
    clearSelection();
    renderEpic();
    renderStats();
    renderUpdated(data);
  } catch (err) {
    state.epic = { ok: false, preview: err.status === 404 };
    renderEpic();
    renderStats();
    if (err.status !== 404) toast("区域数据加载失败", true);
  } finally {
    overlay.classList.remove("active");
    overlay.setAttribute("aria-hidden", "true");
    $("#region-dropdown").classList.remove("is-loading");
  }
}

/* ===== 渲染：Epic ===== */
function cardHtml(game, idx) {
  const img = safeImg(game.img);
  const selectable = game.selectable && game.status !== "upcoming";
  const upcoming = game.status === "upcoming";
  const dates = game.platform === "pc"
    ? `<div class="date-info"><span class="date-label">开始</span><span class="timestamp">${formatDateTime(game.start)}</span></div>
       <div class="date-info"><span class="date-label">结束</span><span class="timestamp">${formatDateTime(game.end)}</span></div>`
    : `<div class="date-info"><span class="date-label">领取截止</span><span class="timestamp">${formatDateTime(game.deadline || game.end)}</span></div>`;
  const statusHtml = upcoming
    ? '<div class="game-status status-upcoming"><span class="s-dot" aria-hidden="true"></span>即将推出</div>'
    : '<div class="game-status status-active"><span class="s-dot" aria-hidden="true"></span>正在进行</div>';
  const remainTarget = upcoming ? game.start : (game.end || game.deadline);
  const remainHtml = remainTarget ? `<div class="game-remain" data-remain="${remainTarget}" data-upcoming="${upcoming ? 1 : 0}"></div>` : "";
  return `<div class="game-card reveal${selectable ? " selectable" : ""}${upcoming ? " upcoming" : ""}" style="--i:${idx % 8}"
      data-id="${escapeHtml(game.id)}" data-offer-id="${escapeHtml(game.offerId)}" data-sandbox-id="${escapeHtml(game.sandboxId)}"
      data-platform="${escapeHtml(game.platform)}" data-url="${escapeHtml(game.url)}" data-title="${escapeHtml(game.title)}" data-img="${escapeHtml(img)}">
    <div class="game-image">
      ${img ? `<img loading="lazy" decoding="async" src="${escapeHtml(img)}" alt="${escapeHtml(game.title)}">` : ""}
      <a href="${escapeHtml(game.url)}" target="_blank" rel="noopener noreferrer" class="game-link-btn" title="查看详情" aria-label="查看 ${escapeHtml(game.title)} 详情">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>
      </a>
      ${selectable ? `<div class="checkbox-wrapper"><input type="checkbox" class="game-checkbox" aria-label="选择 ${escapeHtml(game.title)}"></div>` : ""}
      <span class="platform-tag">${PLATFORM_SVG[game.platform] || ""}${PLATFORM_LABEL[game.platform] || game.platform}</span>
    </div>
    <div class="game-info">
      <div class="game-title">${escapeHtml(game.title)}</div>
      <div class="game-dates">${dates}</div>
      ${statusHtml}
      ${remainHtml}
    </div>
  </div>`;
}

function renderEpic() {
  const host = $("#epic-content");
  const epic = state.epic;
  if (!epic || !epic.ok) {
    host.innerHTML = errorPanel("epic", epic && epic.preview);
    bindRetry(host);
    return;
  }
  const games = Array.isArray(epic.games) ? epic.games : [];
  if (games.length === 0) {
    host.innerHTML = '<div class="platform-empty">当前区域暂未扫描到限免游戏，换个区域或稍后再来看看。</div>';
    return;
  }
  let html = "";
  let idx = 0;
  for (const platform of ["pc", "android", "ios"]) {
    const list = games.filter((g) => g.platform === platform);
    html += `<div class="platform-section">
      <div class="platform-head">
        <span class="p-icon" aria-hidden="true">${PLATFORM_SVG[platform]}</span>
        <h3>${PLATFORM_LABEL[platform]}限免游戏</h3>
        <span class="count-chip">${list.length}</span>
      </div>
      ${list.length ? `<div class="games-grid">${list.map((g) => cardHtml(g, idx++)).join("")}</div>` : '<div class="platform-empty">该端暂无进行中的限免</div>'}
    </div>`;
  }
  host.innerHTML = html;
  bindCards(host);
  observeReveals(host);
  tickRemains();
}

/* ===== 渲染：GOG ===== */
function renderGog() {
  const host = $("#gog-content");
  const gog = state.gog;
  clearInterval(state.gogTimer);
  state.gogTimer = null;
  if (!gog || !gog.ok) {
    host.innerHTML = errorPanel("gog", gog && gog.preview);
    bindRetry(host);
    return;
  }
  if (!gog.active) {
    host.innerHTML = `<div class="gog-panel reveal"><div class="gog-empty">
      <div>
        <p class="state-line"><span class="s-dot" aria-hidden="true"></span>雷达扫描中 · 暂无进行中的限免</p>
        <h3>下一份礼物正在路上</h3>
        <p class="desc">暂未捕获可领取且未过期的 GOG 限免。GOG 的礼物不定期空降，稍后再来看看，或先检查你的游戏库。</p>
        <div class="gog-actions">
          <a class="btn ghost" href="${escapeHtml(gog.libraryUrl || "https://www.gog.com/zh/account")}" target="_blank" rel="noopener noreferrer">
            查看已入库游戏
            <svg viewBox="0 0 24 24" class="i" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
        </div>
        ${gog.updatedAt ? `<p class="gog-updated" style="margin-top:14px">数据更新于 ${escapeHtml(gog.updatedAt)}</p>` : ""}
      </div>
      <div class="empty-radar" role="img" aria-label="正在扫描下一份 GOG 限免"><div class="sweep"></div><div class="ping"></div></div>
    </div></div>`;
    observeReveals(host);
    return;
  }
  const img = safeImg(gog.img);
  host.innerHTML = `<div class="gog-panel reveal"><div class="gog-active">
    <div class="gog-cover">
      ${img ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(gog.title)}">` : '<div class="gog-cover-fallback"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-3.5 7.5A1.75 1.75 0 1 1 8.5 13a1.75 1.75 0 0 1 0-3.5Zm7 0A1.75 1.75 0 1 1 15.5 13a1.75 1.75 0 0 1 0-3.5ZM7 15.2c1.2 1.9 3 2.8 5 2.8s3.8-.9 5-2.8l-1.4-.9c-.9 1.4-2.2 2-3.6 2s-2.7-.6-3.6-2L7 15.2Z"/></svg></div>'}
    </div>
    <div class="gog-info">
      <p class="gog-status-line"><span class="s-dot" aria-hidden="true"></span>限免进行中 · 领取后永久入库</p>
      <h3 class="gog-title">${escapeHtml(gog.title)}</h3>
      <div>
        <p class="gog-countdown-label">距离领取截止</p>
        <div class="countdown" id="gog-countdown" aria-live="off"></div>
      </div>
      <div class="gog-actions">
        <button class="btn primary violet big" type="button" id="gog-claim-btn">
          <svg viewBox="0 0 24 24" class="i" aria-hidden="true"><path d="M20 7h-2.2A3.5 3.5 0 0 0 12 4.1 3.5 3.5 0 0 0 6.2 7H4a1 1 0 0 0-1 1v3h18V8a1 1 0 0 0-1-1ZM9.5 7A1.5 1.5 0 0 1 11 5.5c.9 0 1.5.7 1.5 1.5v1H9.5V7Zm3.5 1V7c0-.8.6-1.5 1.5-1.5A1.5 1.5 0 0 1 16 7v1h-3ZM4 13v7a1 1 0 0 0 1 1h6v-8H4Zm9 8h6a1 1 0 0 0 1-1v-7h-7v8Z" fill="currentColor"/></svg>
          一键领取
        </button>
        <a class="btn ghost big" href="${escapeHtml(gog.libraryUrl || "https://www.gog.com/zh/account")}" target="_blank" rel="noopener noreferrer">查看已入库游戏</a>
      </div>
      ${gog.updatedAt ? `<p class="gog-updated">数据更新于 ${escapeHtml(gog.updatedAt)}</p>` : ""}
    </div>
  </div></div>`;
  observeReveals(host);
  startGogCountdown(gog.endTime);
  $("#gog-claim-btn").addEventListener("click", (e) => openModal("gog-modal", e.currentTarget));
}

/* ===== 渲染：Unity ===== */
function renderUnity() {
  const host = $("#unity-content");
  const unity = state.unity;
  clearInterval(state.unityTimer);
  state.unityTimer = null;
  if (!unity || !unity.ok) {
    host.innerHTML = errorPanel("unity", unity && unity.preview);
    bindRetry(host);
    return;
  }
  if (!unity.active) {
    host.innerHTML = `<div class="unity-panel reveal"><div class="unity-empty">
      <div>
        <p class="state-line"><span class="s-dot" aria-hidden="true"></span>雷达扫描中 · 本周精选资源待更新</p>
        <h3>下一份开发者礼物正在路上</h3>
        <p class="desc">Unity Asset Store 每周轮换一款发布者免费资源。暂未捕获进行中的赠送，稍后再来看看，或先逛逛商店。</p>
        <div class="unity-actions">
          <a class="btn ghost" href="${escapeHtml(unity.url || "https://assetstore.unity.com/zh-CN/publisher-sale")}" target="_blank" rel="noopener noreferrer">
            打开 Unity 赠送页
            <svg viewBox="0 0 24 24" class="i" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
        </div>
      </div>
      <div class="empty-radar cyan" role="img" aria-label="正在扫描下一份 Unity 赠送"><div class="sweep"></div><div class="ping"></div></div>
    </div></div>`;
    observeReveals(host);
    return;
  }
  const img = safeImg(unity.img);
  const code = unity.code || "";
  host.innerHTML = `<div class="unity-panel reveal">
    <div class="unity-callout">
      ${img ? `<div class="unity-bg"><img src="${escapeHtml(img)}" alt="" loading="lazy" decoding="async"></div>` : ""}
      <div class="unity-scrim" aria-hidden="true"></div>
      <div class="unity-callout-grid">
        <div class="deadline-badge">
          <span class="deadline-label">距离领取截止</span>
          <div class="countdown" id="unity-countdown" aria-live="off"></div>
        </div>
        <div class="unity-copy">
          <span class="unity-caption">${escapeHtml(unity.caption || "发布者资源赠送")}</span>
          <h3 class="unity-title">${escapeHtml(unity.title)}</h3>
          <p class="unity-body">${escapeHtml(unity.body)}</p>
          ${code ? `<div class="unity-code-row">
            <span class="unity-code-label">结账优惠码</span>
            <button class="unity-code" type="button" id="unity-code-btn" data-code="${escapeHtml(code)}" aria-label="复制优惠码 ${escapeHtml(code)}">
              <span class="code-text">${escapeHtml(code)}</span>
              <svg viewBox="0 0 24 24" class="i" aria-hidden="true"><path d="M9 9h10v10H9zM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>` : ""}
        </div>
        <div class="unity-cta">
          <a class="btn primary cyan big" href="${escapeHtml(unity.url)}" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" class="i" aria-hidden="true"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13 5.4 5M7 13l-2.3 4.6a1 1 0 0 0 .9 1.4H19M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            前往领取
          </a>
          <span class="unity-cta-note">加入购物车 · 结账时输入优惠码</span>
        </div>
      </div>
    </div>
    ${unity.footnote ? `<p class="unity-footnote">${escapeHtml(unity.footnote)}</p>` : ""}
  </div>`;
  observeReveals(host);
  startUnityCountdown(unity.endTime);
  const codeBtn = $("#unity-code-btn");
  if (codeBtn) codeBtn.addEventListener("click", () => copyCode(codeBtn));
}

/* ===== 渲染：Fab ===== */
function fabCardHtml(item, idx) {
  const img = safeImg(item.img);
  const formats = Array.isArray(item.formats) ? item.formats : [];
  const formatHtml = formats.map((code) => {
    const label = FAB_FORMAT_LABEL[code] || code;
    const cls = FAB_FORMAT_CLASS[code] || "";
    return `<span class="fab-format ${cls}">${escapeHtml(label)}</span>`;
  }).join("");
  const price = typeof item.originalPrice === "number" && item.originalPrice > 0 ? "$" + item.originalPrice.toFixed(2) : "";
  const rating = item.reviewCount > 0
    ? `<span class="fab-rating"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z"/></svg>${Number(item.rating).toFixed(1)} <i>(${item.reviewCount})</i></span>`
    : "";
  const typeLabel = FAB_TYPE_LABEL[item.productType] || "";
  const typeHtml = typeLabel ? `<span class="fab-type">${escapeHtml(typeLabel)}</span>` : "";
  return `<div class="fab-card reveal" style="--i:${idx % 8}">
    <div class="fab-image">
      ${img ? `<img loading="lazy" decoding="async" src="${escapeHtml(img)}" alt="${escapeHtml(item.title)}">` : '<div class="fab-image-fallback"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2 2.5 7v10L12 22l9.5-5V7L12 2Zm0 2.3 7 3.7-7 3.7-7-3.7 7-3.7ZM4.5 9.6l6.5 3.4v6.7l-6.5-3.4V9.6Zm8.5 10.1v-6.7l6.5-3.4v6.7l-6.5 3.4Z"/></svg></div>'}
      ${formatHtml ? `<div class="fab-formats">${formatHtml}</div>` : ""}
      <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="fab-link-btn" title="在 Fab 查看" aria-label="在 Fab 查看 ${escapeHtml(item.title)}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>
      </a>
      <div class="fab-price-tag">${price ? `<span class="was">${escapeHtml(price)}</span>` : ""}<span class="now">免费</span></div>
    </div>
    <div class="fab-info">
      <div class="fab-title">${escapeHtml(item.title)}</div>
      ${item.seller ? `<div class="fab-seller"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" stroke-linecap="round"/></svg><span>${escapeHtml(item.seller)}</span></div>` : ""}
      <div class="fab-meta">${rating}${typeHtml}</div>
      <a class="btn primary rose fab-claim" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" class="i" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        前往领取
      </a>
    </div>
  </div>`;
}

function renderFab() {
  const host = $("#fab-content");
  const fab = state.fab;
  clearInterval(state.fabTimer);
  state.fabTimer = null;
  if (!fab || !fab.ok) {
    host.innerHTML = errorPanel("fab", fab && fab.preview);
    bindRetry(host);
    return;
  }
  const items = Array.isArray(fab.items) ? fab.items : [];
  if (!fab.active || items.length === 0) {
    host.innerHTML = `<div class="fab-panel reveal"><div class="fab-empty">
      <div>
        <p class="state-line"><span class="s-dot" aria-hidden="true"></span>雷达扫描中 · 本期限免待更新</p>
        <h3>下一批免费资源正在路上</h3>
        <p class="desc">Fab 会不定期上架限时免费的 3D 资源与游戏素材。暂未捕获进行中的赠送，稍后再来看看，或先逛逛 Fab。</p>
        <div class="fab-actions">
          <a class="btn ghost" href="https://www.fab.com/limited-time-free" target="_blank" rel="noopener noreferrer">
            打开 Fab 限免页
            <svg viewBox="0 0 24 24" class="i" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
        </div>
      </div>
      <div class="empty-radar rose" role="img" aria-label="正在扫描下一批 Fab 限免"><div class="sweep"></div><div class="ping"></div></div>
    </div></div>`;
    observeReveals(host);
    return;
  }
  host.innerHTML = `<div class="fab-panel">
    <div class="fab-head reveal">
      <div class="fab-head-copy">
        <span class="fab-caption">Limited-Time Free</span>
        <span class="fab-head-note">本期 <b>${items.length}</b> 款资源 · 领取后永久入库</span>
      </div>
      <div class="deadline-badge">
        <span class="deadline-label">距离本期截止</span>
        <div class="countdown" id="fab-countdown" aria-live="off"></div>
      </div>
    </div>
    <div class="fab-grid">${items.map((it, i) => fabCardHtml(it, i)).join("")}</div>
  </div>`;
  observeReveals(host);
  startFabCountdown(fab.endTime);
}

function copyCode(btn) {
  const code = btn.dataset.code || "";
  if (!code) return;
  const done = () => {
    btn.classList.add("copied");
    toast("优惠码 " + code + " 已复制，结账时粘贴即可");
    setTimeout(() => btn.classList.remove("copied"), 1600);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(done).catch(() => fallbackCopy(code, done));
  } else {
    fallbackCopy(code, done);
  }
}
function fallbackCopy(text, done) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); done(); }
  catch (e) { toast("复制失败，请手动复制优惠码", true); }
  ta.remove();
}

/* 滚动倒计时（多实例：GOG / Unity） */
const cdState = new WeakMap();
function rollCell(cell, ch) {
  if (cell.dataset.ch === ch) return;
  cell.dataset.ch = ch;
  const cur = cell.querySelector(".cd-v:not(.cd-out)");
  if (!cur || REDUCE_MOTION) {
    cell.innerHTML = '<span class="cd-v">' + ch + "</span>";
    return;
  }
  const out = cur.cloneNode(true);
  out.classList.add("cd-out");
  cur.textContent = ch;
  cur.classList.add("cd-in");
  cell.appendChild(out);
  requestAnimationFrame(() => requestAnimationFrame(() => cur.classList.remove("cd-in")));
  setTimeout(() => { if (out.parentNode) out.parentNode.removeChild(out); }, 380);
}
function renderCountdown(el, text) {
  const pattern = text.length + text.replace(/[0-9]/g, "#");
  const prev = cdState.get(el);
  if (!prev || prev.pattern !== pattern) {
    el.innerHTML = "";
    const cells = [];
    for (const ch of text) {
      if (/[0-9]/.test(ch)) {
        const cell = document.createElement("span");
        cell.className = "cd-cell";
        cell.dataset.ch = ch;
        cell.innerHTML = '<span class="cd-v">' + ch + "</span>";
        el.appendChild(cell);
        cells.push(cell);
      } else {
        const sep = document.createElement("span");
        sep.className = "cd-sep";
        sep.textContent = ch;
        el.appendChild(sep);
        cells.push(null);
      }
    }
    cdState.set(el, { pattern, cells });
    return;
  }
  for (let j = 0; j < text.length; j++) {
    if (prev.cells[j]) rollCell(prev.cells[j], text[j]);
  }
}
function startCountdown(el, endTime, timerKey) {
  if (!el || !endTime) return;
  cdState.delete(el);
  clearInterval(state[timerKey]);
  const update = () => {
    const text = remainText(endTime);
    if (text === null) {
      el.textContent = "已结束";
      clearInterval(state[timerKey]);
      state[timerKey] = null;
      return;
    }
    renderCountdown(el, text);
  };
  update();
  state[timerKey] = setInterval(update, 1000);
}
function startGogCountdown(endTime) { startCountdown($("#gog-countdown"), endTime, "gogTimer"); }
function startUnityCountdown(endTime) { startCountdown($("#unity-countdown"), endTime, "unityTimer"); }
function startFabCountdown(endTime) { startCountdown($("#fab-countdown"), endTime, "fabTimer"); }

/* ===== 统计与更新时间 ===== */
function renderStats() {
  const games = state.epic && state.epic.ok && Array.isArray(state.epic.games) ? state.epic.games : [];
  $("#stat-active").textContent = games.filter((g) => g.status !== "upcoming").length;
  $("#stat-upcoming").textContent = games.filter((g) => g.status === "upcoming").length;
  $("#stat-mobile").textContent = games.filter((g) => g.platform !== "pc").length;
  $("#stat-gog").textContent = state.gog && state.gog.ok ? (state.gog.active ? 1 : 0) : "–";
  $("#stat-unity").textContent = state.unity && state.unity.ok ? (state.unity.active ? 1 : 0) : "–";
  $("#stat-fab").textContent = state.fab && state.fab.ok ? (state.fab.active && Array.isArray(state.fab.items) ? state.fab.items.length : 0) : "–";
}
function renderUpdated(data) {
  const parts = [];
  const at = (state.epic && state.epic.fetchedAt) || (state.gog && state.gog.fetchedAt) || (state.unity && state.unity.fetchedAt) || (state.fab && state.fab.fetchedAt) || data.serverTime;
  if (data.static) {
    if (data.serverTime) parts.push("数据同步于 " + formatClock(data.serverTime));
    parts.push('<span class="stale-tag">静态托管 · 每 6 小时自动同步</span>');
  } else if (at) {
    parts.push("上次更新 " + formatClock(at));
  }
  if ((state.epic && state.epic.stale) || (state.gog && state.gog.stale) || (state.unity && state.unity.stale) || (state.fab && state.fab.stale)) {
    parts.push('<span class="stale-tag">上游暂不可达 · 展示缓存数据</span>');
  }
  $("#last-updated").innerHTML = parts.join(" · ") || "数据已更新";
}

/* ===== 选择 + 托盘 + 飞行动画 ===== */
const trayMap = new Map();
const inboundFlights = new Map();

function keyOf(card) { return card.dataset.offerId + "_" + card.dataset.sandboxId; }
function cardsByKey(key) { return $$(".game-card").filter((c) => keyOf(c) === key); }
function selectedItems() {
  const seen = new Set();
  const items = [];
  $$(".game-card").forEach((card) => {
    const cb = card.querySelector(".game-checkbox");
    if (!cb || !cb.checked) return;
    const key = keyOf(card);
    if (seen.has(key)) return;
    seen.add(key);
    items.push({
      key,
      card,
      img: card.dataset.img || "",
      title: card.dataset.title || "未知游戏",
      offerId: card.dataset.offerId,
      sandboxId: card.dataset.sandboxId,
      platform: card.dataset.platform || "pc",
    });
  });
  return items;
}
function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

function liveFlight(fromRect, getTarget, imgSrc, opts) {
  opts = opts || {};
  const duration = opts.duration || 560;
  const fadeOut = !!opts.fadeOut;
  const onDone = opts.onDone || function () {};
  if (REDUCE_MOTION || !fromRect || !imgSrc || fromRect.width <= 0) { onDone(); return null; }
  const clone = document.createElement("div");
  clone.className = "fly-clone";
  clone.style.width = fromRect.width + "px";
  clone.style.height = fromRect.height + "px";
  clone.style.backgroundImage = `url('${imgSrc}')`;
  clone.style.transform = `translate(${fromRect.left}px, ${fromRect.top}px)`;
  document.body.appendChild(clone);
  const w0 = fromRect.width, h0 = fromRect.height;
  const x0 = fromRect.left + w0 / 2, y0 = fromRect.top + h0 / 2;
  let rafId = 0, finished = false;
  const t0 = performance.now();
  function abort() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(rafId);
    clone.style.transition = "opacity .16s ease";
    clone.style.opacity = "0";
    setTimeout(() => clone.remove(), 180);
  }
  function frame(now) {
    if (finished) return;
    const to = getTarget();
    if (!to || to.width <= 0) { abort(); return; }
    const p = easeInOutCubic(Math.min(1, (now - t0) / duration));
    const x2 = to.left + to.width / 2, y2 = to.top + to.height / 2;
    const arc = Math.min(110, Math.max(36, Math.abs(y2 - y0) * 0.16));
    const cx = (x0 + x2) / 2, cy = Math.min(y0, y2) - arc;
    const mt = 1 - p;
    const x = mt * mt * x0 + 2 * mt * p * cx + p * p * x2;
    const y = mt * mt * y0 + 2 * mt * p * cy + p * p * y2;
    const w = w0 + (to.width - w0) * p, h = h0 + (to.height - h0) * p;
    const rot = Math.sin(p * Math.PI) * (x2 >= x0 ? 4 : -4);
    clone.style.transform = `translate(${x - w0 / 2}px, ${y - h0 / 2}px) rotate(${rot}deg) scale(${w / w0}, ${h / h0})`;
    if (fadeOut && p > 0.65) clone.style.opacity = String(1 - ((p - 0.65) / 0.35) * 0.95);
    if (p >= 1) {
      finished = true;
      onDone();
      clone.remove();
      return;
    }
    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
  return abort;
}

function makeTrayItem(item) {
  const el = document.createElement("div");
  el.className = "tray-item pre";
  el.dataset.key = item.key;
  el.title = item.title + "（点击移除）";
  el.innerHTML = `
    ${item.img ? `<img src="${escapeHtml(item.img)}" alt="">` : ""}
    <span class="remove-btn" aria-hidden="true">&times;</span>
    <div class="platform-badge">${PLATFORM_SVG[item.platform] || ""}</div>`;
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    cardsByKey(item.key).forEach((c) => {
      const cb = c.querySelector(".game-checkbox");
      if (cb) cb.checked = false;
      c.classList.remove("selected");
    });
    syncSelection({ flyBack: [item.key] });
  });
  return el;
}
function bumpClaimCount() {
  if (REDUCE_MOTION) return;
  const el = $("#claim-count");
  el.classList.remove("bump");
  void el.offsetWidth;
  el.classList.add("bump");
}
function revealTrayItem(el) {
  el.classList.remove("pre");
  el.classList.add("pop", "land");
  bumpClaimCount();
  setTimeout(() => el.classList.remove("pop", "land"), 560);
}

function syncSelection(options) {
  options = options || {};
  const tray = $("#selected-tray");
  const claimBtn = $("#claim-btn");
  const want = selectedItems();
  const wantKeys = new Set(want.map((i) => i.key));
  const flyNewKeys = new Set((options.flyNew || []).map(keyOf));
  const flyBackKeys = new Set(options.flyBack || []);

  trayMap.forEach((el, key) => {
    if (wantKeys.has(key)) return;
    trayMap.delete(key);
    const abortInbound = inboundFlights.get(key);
    if (abortInbound) {
      inboundFlights.delete(key);
      abortInbound();
    } else if (flyBackKeys.has(key)) {
      const card = cardsByKey(key)[0];
      const cardImg = card && card.querySelector(".game-image");
      if (cardImg) {
        const r = cardImg.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) {
          const imgEl = el.querySelector("img");
          liveFlight(el.getBoundingClientRect(), () => cardImg.getBoundingClientRect(), imgEl ? imgEl.src : "", { duration: 460, fadeOut: true });
        }
      }
    }
    el.classList.add("exit");
    setTimeout(() => el.remove(), 260);
  });

  const added = [];
  want.forEach((item) => {
    if (trayMap.has(item.key)) return;
    const el = makeTrayItem(item);
    tray.appendChild(el);
    trayMap.set(item.key, el);
    added.push({ item, el });
  });

  tray.classList.toggle("active", want.length > 0);
  claimBtn.disabled = want.length === 0;
  $("#claim-count").textContent = want.length;
  const allBtn = $("#select-all-btn");
  const boxes = $$(".game-checkbox");
  const allChecked = boxes.length > 0 && boxes.every((cb) => cb.checked);
  allBtn.lastChild.textContent = allChecked ? " 全不选" : " 全选";

  if (added.length > 0) {
    requestAnimationFrame(() => {
      if (tray.scrollWidth > tray.clientWidth) {
        tray.scrollTo({ left: tray.scrollWidth, behavior: REDUCE_MOTION ? "auto" : "smooth" });
      }
      added.forEach(({ item, el }, idx2) => {
        if (!flyNewKeys.has(item.key)) { revealTrayItem(el); return; }
        const start = () => {
          if (!el.isConnected || trayMap.get(item.key) !== el) return;
          const cardImg = item.card.querySelector(".game-image");
          const from = cardImg ? cardImg.getBoundingClientRect() : null;
          const abort = liveFlight(from, () => {
            if (!el.isConnected || trayMap.get(item.key) !== el) return null;
            return el.getBoundingClientRect();
          }, item.img, {
            duration: 560,
            onDone: () => {
              inboundFlights.delete(item.key);
              revealTrayItem(el);
            },
          });
          if (abort) inboundFlights.set(item.key, abort);
        };
        if (options.stagger) setTimeout(start, idx2 * 60);
        else start();
      });
    });
  }
}

function clearSelection() {
  trayMap.forEach((el) => el.remove());
  trayMap.clear();
  inboundFlights.forEach((abort) => abort());
  inboundFlights.clear();
  $("#selected-tray").classList.remove("active");
  $("#claim-count").textContent = "0";
  $("#claim-btn").disabled = true;
}

function bindCards(host) {
  $$(".game-checkbox", host).forEach((cb) => {
    cb.addEventListener("change", () => {
      const card = cb.closest(".game-card");
      card.classList.toggle("selected", cb.checked);
      if (cb.checked) syncSelection({ flyNew: [card] });
      else syncSelection({ flyBack: [keyOf(card)] });
    });
  });
  $$(".game-card.selectable", host).forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".game-link-btn") || e.target.classList.contains("game-checkbox")) return;
      const cb = card.querySelector(".game-checkbox");
      if (!cb) return;
      cb.checked = !cb.checked;
      card.classList.toggle("selected", cb.checked);
      if (cb.checked) syncSelection({ flyNew: [card] });
      else syncSelection({ flyBack: [keyOf(card)] });
    });
  });
}

function bindRetry(host) {
  $$("[data-retry]", host).forEach((btn) => {
    btn.addEventListener("click", () => loadAll(false, true));
  });
}

/* ===== 弹窗 ===== */
let pendingEpicUrl = "";
function openModal(id, trigger) {
  const modal = $("#" + id);
  const card = modal.querySelector(".m-card");
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  if (trigger && card) {
    const t = trigger.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    const ox = Math.min(Math.max(t.left + t.width / 2 - c.left, 0), c.width);
    const oy = Math.min(Math.max(t.top + t.height / 2 - c.top, 0), c.height);
    card.style.transformOrigin = ox + "px " + oy + "px";
  }
  const confirm = modal.querySelector(".m-actions .btn.primary");
  if (confirm) confirm.focus();
}
function closeModal(id) {
  const modal = $("#" + id);
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
}
$$(".m-overlay").forEach((modal) => {
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(modal.id); });
});
$$("[data-close]").forEach((btn) => btn.addEventListener("click", () => closeModal(btn.dataset.close)));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    $$(".m-overlay.active").forEach((m) => closeModal(m.id));
    $("#region-dropdown").classList.remove("open");
    $("#region-toggle").setAttribute("aria-expanded", "false");
  }
});

$("#epic-modal-confirm").addEventListener("click", () => {
  if (pendingEpicUrl) window.open(pendingEpicUrl, "_blank", "noopener");
  closeModal("epic-modal");
});
$("#gog-modal-confirm").addEventListener("click", () => {
  const url = state.gog && state.gog.ok && state.gog.claimUrl ? state.gog.claimUrl : "https://www.gog.com/giveaway/claim";
  window.open(url, "_blank", "noopener");
  closeModal("gog-modal");
});

/* ===== 底部停靠栏 ===== */
$("#view-orders-btn").addEventListener("click", () => window.open(EPIC_ORDERS_URL, "_blank", "noopener"));
$("#select-all-btn").addEventListener("click", () => {
  const boxes = $$(".game-checkbox");
  if (!boxes.length) return;
  const target = !boxes.every((cb) => cb.checked);
  const newCards = [];
  boxes.forEach((cb) => {
    if (target && !cb.checked) {
      const card = cb.closest(".game-card");
      if (card) newCards.push(card);
    }
    cb.checked = target;
    cb.closest(".game-card").classList.toggle("selected", target);
  });
  syncSelection({ flyNew: newCards, stagger: true });
});
$("#claim-btn").addEventListener("click", (e) => {
  const items = selectedItems();
  if (!items.length) return;
  $("#modal-count").textContent = items.length;
  $("#modal-tray").innerHTML = items.map((g) => `
    <div class="modal-tray-item" title="${escapeHtml(g.title)}">
      ${g.img ? `<img src="${escapeHtml(g.img)}" alt="${escapeHtml(g.title)}">` : ""}
      <div class="platform-badge">${PLATFORM_SVG[g.platform] || ""}</div>
    </div>`).join("");
  const offers = items.map((g) => `1-${g.sandboxId}-${g.offerId}`).join("&offers=");
  pendingEpicUrl = `https://store.epicgames.com/purchase?offers=${offers}#/purchase/payment-methods`;
  openModal("epic-modal", e.currentTarget);
});

/* ===== 区域切换 ===== */
(function initRegions() {
  const dropdown = $("#region-dropdown");
  const toggle = $("#region-toggle");
  const items = $("#region-items");
  const label = $("#region-label");

  function renderLabel() {
    const found = REGIONS.find(([code]) => code === state.region);
    label.textContent = found ? found[1] : "美区";
  }
  items.innerHTML = REGIONS.map(([code, name]) =>
    `<div role="option" data-value="${code}" aria-selected="${code === state.region}" class="${code === state.region ? "current" : ""}">${name}</div>`).join("");
  renderLabel();

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = dropdown.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
  items.addEventListener("click", (e) => {
    const item = e.target.closest("[data-value]");
    if (!item) return;
    e.stopPropagation();
    const value = item.dataset.value;
    dropdown.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    if (!value || value === state.region) return;
    state.region = value;
    localStorage.setItem("fr-region", value);
    $$("div", items).forEach((d) => {
      d.classList.toggle("current", d.dataset.value === value);
      d.setAttribute("aria-selected", String(d.dataset.value === value));
    });
    renderLabel();
    dropdown.classList.add("is-loading");
    loadEpicOnly();
  });
})();

/* ===== 刷新 ===== */
$("#refresh-btn").addEventListener("click", async () => {
  if (state.loading) return;
  await loadAll(false, true);
  if (state.epic && state.epic.ok) toast("雷达数据已更新");
});
$("#theme-btn").addEventListener("click", cycleTheme);

/* ===== 每秒跳动：卡片剩余时间 ===== */
function tickRemains() {
  $$("[data-remain]").forEach((el) => {
    const target = Number(el.dataset.remain);
    const upcoming = el.dataset.upcoming === "1";
    const text = remainText(target);
    if (text === null) {
      el.innerHTML = upcoming ? "<b>即将开始</b>" : "已结束";
    } else {
      el.innerHTML = upcoming ? `<b>${text}</b> 后开抢` : `剩余 <b>${text}</b>`;
    }
  });
}
setInterval(tickRemains, 1000);

/* ===== 滚动显现 & 导航高亮 ===== */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) {
      en.target.classList.add("in");
      revealObserver.unobserve(en.target);
    }
  });
}, { threshold: 0.08 });
function observeReveals(root) {
  $$(".reveal", root || document).forEach((el) => revealObserver.observe(el));
}
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    const id = en.target.id;
    $$(".nav-link").forEach((l) => l.classList.toggle("active", l.dataset.section === id));
  });
}, { rootMargin: "-30% 0px -55% 0px" });
["top", "epic", "gog", "unity", "fab"].forEach((id) => sectionObserver.observe(document.getElementById(id)));

/* ===== 启动 ===== */
applyTheme();
observeReveals(document);
loadAll(true);
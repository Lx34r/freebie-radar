# 喜加一雷达 · FREEBIE RADAR

一站扫齐 **Epic Games / GOG / Unity Asset Store / Fab** 四大平台的限时免费情报：Epic 12 区三端限免、GOG 不定期礼物、Unity 每周精选、Fab 限时免费资源。勾选封面批量跳转官方商店领取，倒计时提醒，明暗主题跟随系统。

**在线访问**：<https://lx34r.github.io/freebie-radar/>

> 所有领取均在 Epic / GOG / Unity / Fab 官方页面完成，本站不接触你的账号。

## 功能

- **四平台聚合**：Epic、GOG、Unity、Fab 限免各成页签，一屏总览正在进行 / 即将推出 / 移动端等统计。
- **Epic 12 区切换**：美 / 国 / 港 / 台 / 俄 / 日 / 韩 / 新 / 土 / 阿 / 巴 / 澳，区域选择仅作用于 Epic。
- **批量领取**：勾选或框选封面加入托盘，一键跳转 Epic 官方下单；GOG 一键领取接口；Unity 优惠码复制；Fab 直达资源页。
- **倒计时**：每张卡片实时跳动剩余时间，到期自动转「已结束」。
- **明暗主题**：跟随系统自动匹配，也可手动三态切换（跟随系统 / 浅色 / 深色），选择本地持久化。

## 数据如何保持新鲜

本站部署在 **GitHub Pages（纯静态）**，没有运行时服务器。限免数据由 GitHub Actions 定时抓取并写入 [`web/data.json`](web/data.json)，前端直接读取这份静态数据：

- [`scripts/sync-data.mjs`](scripts/sync-data.mjs) 抓取全部 12 区 Epic 与 GOG / Unity / Fab，解析后写入 `web/data.json`；某源抓取失败时沿用上一份好数据并标记 stale，避免上游抖动清空数据。
- [`.github/workflows/sync.yml`](.github/workflows/sync.yml) 每 6 小时运行一次同步，仅当数据实质变化时提交，并触发部署。
- [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 将 `web/` 发布到 GitHub Pages。

解析逻辑集中在 [`functions/parsers.mjs`](functions/parsers.mjs)，被抓取脚本与可选的实时 Function 共用。

> 若改用 [Qoder Sites](https://qoder.com) 托管，[`functions/handler.ts`](functions/handler.ts) 提供同源实时取数 Function（`/functions/v1/app`），前端会优先走实时接口、静态数据作为降级。同一份前端代码两种托管都能跑。

## 本地开发

需要 Node.js ≥ 20（用到内置 `fetch`）。

```bash
npm run sync   # 抓取最新限免数据，生成 web/data.json
npm run dev    # 启动本地预览 http://127.0.0.1:4173
```

`npm run dev` 会同时提供静态页面与实时取数 Function。只想看静态降级效果，可用任意静态服务器托管 `web/`（此时 `/functions/v1/app` 不存在，前端自动读 `data.json`）。

## 目录结构

```
web/                 静态前端（index.html / styles.css / app.js / favicon.svg / data.json）
functions/           parsers.mjs 共享解析；handler.ts + index.ts 实时取数 Function（Qoder Sites）
scripts/sync-data.mjs  构建时数据同步脚本
dev/server.mjs       本地预览服务器；dev/fixture.json 离线夹具
.github/workflows/   deploy.yml 部署；sync.yml 定时同步
```

## 数据来源

- Epic 限免情报：[Dogfight360](https://www.dogfight360.com/tools/epic_free/) · [Epic Games](https://store.epicgames.com/zh-CN/free-games)
- GOG：[Dogfight360](https://www.dogfight360.com/tools/gog_free/) · [GOG](https://www.gog.com/)
- Unity：[Unity Asset Store](https://assetstore.unity.com/zh-CN/publisher-sale)
- Fab：[Fab Limited-Time Free](https://www.fab.com/limited-time-free)

本站与上述平台无隶属关系，仅聚合公开限免情报；转载请注明数据来源。
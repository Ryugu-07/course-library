# 全栈 I · 请求的一生（Medusa 解剖）

> **对标**：Berkeley CS169 / MDN Web 全景 / 你自己的 Medusa 系统 ｜ **前置**：net 线（HTTP/TLS/DNS）、db 线、os 线
> 全栈线不从玩具讲起——**你已经在运营一个真实全栈系统**（Medusa：FastAPI + React SPA + Postgres + Docker + cloudflared + schtasks）。所以这条线拿它当解剖标本，每讲一层就回看你系统里对应那块。这一页是全景总纲：**追踪一个请求从你敲下 medusa.hhzi.eu.cc 到页面显示的完整旅程**，把 net/db/os 学的东西串成一条你每天都在跑的链路。

## 1. 全栈的分层地图（Medusa 实体对照）


<figure class="diagram" markdown="1">
![在线(用户读)vs离线(schtasks 抓取→聚类→分析→写库) 双路径，读写分离。](assets/img/web-01-online-offline.svg)
<figcaption><span class="fig-id">图 web-01.2</span>在线(用户读)vs离线(schtasks 抓取→聚类→分析→写库) 双路径，读写分离。</figcaption>
</figure>
<figure class="diagram" markdown="1">
![全栈分层 + Medusa 实体对照（React/Cloudflare/FastAPI/Postgres）。](assets/img/web-01-layers.svg)
<figcaption><span class="fig-id">图 web-01.3</span>全栈分层 + Medusa 实体对照（React/Cloudflare/FastAPI/Postgres）。</figcaption>
</figure>

一个现代 Web 系统的分层，和你的 Medusa 一一对应：

| 层 | 通用职责 | Medusa 里是谁 |
|---|---|---|
| **客户端** | 浏览器渲染 UI、发请求 | React 18.3.1 SPA（Vite 构建） |
| **边缘/网络** | DNS、CDN、TLS 终止、隧道 | Cloudflare + cloudflared 隧道 |
| **应用服务器** | 处理 HTTP、业务逻辑 | FastAPI（uvicorn :8000） |
| **数据层** | 存取数据 | Postgres（`medusa-postgres`, pgvector, Docker） |
| **离线管线** | 定时批处理 | schtasks 定时的 fetch/分析/预测脚本 |

**关键区分——在线 vs 离线**：Medusa 有两条路径。**在线**（用户访问）：浏览器 → FastAPI → 查 Postgres → 返回。**离线**（数据生产）：schtasks 定时跑 RSS 抓取 → 聚类 → 分析 → 写 Postgres。**用户请求只读那些离线预算好的结果**——这是"**读写分离、把重活挪到离线**"的经典架构（🔗 与 dist-03 系统设计、MLSys 训练/推理分离同构）。理解这个分工，Medusa 的整体设计就清晰了。

## 2. 请求的一生：一步步追踪


<figure class="diagram" markdown="1">
![重点图。Medusa 请求全链路：浏览器→DNS→Cloudflare 边缘→cloudflared 隧道→FastAPI→Postgres→响应→React 渲染，8 步标注。](assets/img/web-01-request-life.svg)
<figcaption><span class="fig-id">图 web-01.1</span>重点图。Medusa 请求全链路：浏览器→DNS→Cloudflare 边缘→cloudflared 隧道→FastAPI→Postgres→响应→React 渲染，8 步标注。</figcaption>
</figure>

你在浏览器整 `https://medusa.hhzi.eu.cc` 回车，发生了什么（把 net 线的知识走一遍实景）：

1. **DNS 解析**（net-02）：域名 → Cloudflare 边缘 IP。
2. **TCP + TLS 握手**（net-01/crypto-02）：与 Cloudflare 边缘建立加密连接。
3. **CDN / 边缘**：静态资源（JS/CSS bundle）可能直接由 Cloudflare 缓存返回（net-02），不回源。
4. **隧道回源**：动态请求经 cloudflared 隧道穿透到你 Win 机的 FastAPI :8000（**隧道让内网服务免公网 IP、免自己配证书**）。
5. **应用服务器**（web-02）：FastAPI 路由匹配 → 执行处理函数 → 可能查数据库。
6. **数据库查询**（db 线）：Postgres 执行 SQL（用上索引否？EXPLAIN！db-02）、返回结果。
7. **响应组装**：FastAPI 序列化成 JSON、加响应头、经隧道 → CDN → 浏览器。
8. **前端渲染**（web-03）：React 拿到数据、更新虚拟 DOM、浏览器绘制。

**"输入 URL 后发生了什么"是最经典的系统面试题**——现在你能拿自己的系统一口气讲完，每一步都摸得着。**这条链就是全栈的骨架，后面三页（web-02/03、se、cloud）分别深入其中的层。**

## 3. 前后端的契约：API

前端和后端通过 **API** 通信——最常见 **REST**（资源 + HTTP 方法：`GET /articles` 取列表、`GET /articles/42` 取一个、`POST` 建、`PUT/PATCH` 改、`DELETE` 删）。约定：
- **HTTP 方法语义**：GET 只读幂等（可缓存）、POST 有副作用（🔗 net-02 缓存、sec 线 CSRF 与方法安全性相关）。
- **状态码**：2xx 成功、4xx 客户端错（400 参数错、401 未认证、403 无权、404 没有）、5xx 服务端错——**正确用状态码是 API 设计的基本功**。
- **JSON 数据格式** + 版本化（`/api/v1/`）+ 分页（大列表别一次全返，🔗 db-02 keyset 分页）。

**替代方案**：**GraphQL**（客户端声明要哪些字段，避免 over/under-fetching）、**gRPC**（二进制、高性能、微服务间）、**WebSocket/SSE**（实时推送，net-02）。**REST 是默认，其余按需**——Medusa 这种读多写少的分析展示，REST 足够。

## 4. 无状态与状态放哪

HTTP 无状态（net-02），但应用需要状态（谁登录了、购物车）——**状态放哪是架构核心决策**：
- **会话状态**：认证信息放哪？服务端 session（存 Redis/DB）vs 客户端 token（JWT，自包含）——各有取舍（🔗 sec-02 会讲认证安全）。
- **应用服务器应尽量无状态**：这样能**水平扩展**（多个实例，请求分给任一个都行，🔗 dist 线）——状态外置到数据库/缓存。Medusa 现在是单实例，但"无状态应用 + 有状态数据层"是它未来扩展的正道。
- **缓存层**：热数据放 Redis/内存，减数据库压力（🔗 csapp-02 缓存思想的系统级放大，贯穿全栈）。

## 5. 练习与要点

**例 1（画你自己的请求链）** 把第 2 节的 8 步画成时序图，标出每步大概耗时（DNS ~20ms、TLS ~50ms、DB 查询 ~?ms）——**找出 Medusa 请求的瓶颈在哪层**，这是性能优化的起点。

**例 2（设计一个 API）** 为 Medusa 的"按 topic 取分析卡片"设计 REST 端点（路径、方法、参数、分页、状态码）——**把 API 设计原则用到你自己的系统**。

**例 3（状态该放哪）** 若 Medusa 要加用户登录，会话状态放服务端 session 还是 JWT？考虑单实例现状 vs 未来多实例——**理解"无状态应用易扩展"的权衡**。$\blacksquare$

---

*下一页：全栈 II——后端工程：FastAPI 那层深入，路由、ORM、异步、认证、错误处理，以及后端的常见陷阱。*

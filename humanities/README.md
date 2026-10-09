# 历史、社会与哲学研究现场

这是文史哲分馆的新阅读区，保留原有《重读王小波》入口。当前完整路线为历史35讲、社会28讲、哲学研究专题6篇，共69篇正文、73个阅读与导航页面。公开入口：[文史与社会](https://course.hhzi.eu.cc/humanities/)。分馆入口另接入世界现代文学6篇与传播新闻首批12讲，源码分别位于 `literature-course/` 与 `media-course/`。旧 `design-previews/` 保留为本地历史预览，不参与发布。

## 修改与构建

- `content/history/`：历史课程地图与讲义。
- `content/society/`：社会课程地图与讲义。
- `content/frontier/`：哲学研究专题与后续选题。
- 每个 `catalog.json` 是该栏目的注册表；只有 `ready` 项会生成课文，`planned` 项没有虚假的阅读链接。
- `assets/` 是共享排版与阅读增强。全部正文、目录、来源与参考解析均可在关闭 JavaScript 时阅读。

在仓库根目录执行：

```bash
python3 tools/rebuild_all.py humanities
python3 tools/check_humanities.py --complete
python3 tools/check_humanities_build.py
python3 tools/course_audit.py
python3 tools/learning_coverage.py --remaining
python3 tools/build_public_site.py
```

Python 依赖沿用根目录 `requirements-build.txt`。发布器仅打包 `index.html`、三个生成栏目的页面及共享资源，研究笔记和讲义源码不作为网页目录发布。

哲学栏目按每周检索、月度深读的节奏维护。研究追踪记录与待审草稿保存在课程仓库之外；新稿需核对原文、发表状态、实际阅读范围及论证归属，经审阅后再更新。监测任务本身不覆盖课程源码或触发部署。

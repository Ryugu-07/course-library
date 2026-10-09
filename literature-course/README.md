# 世界现代文学：原文细读

首批六篇完整课程，以中文讲清原文的语言选择、叙述与时代背景；涵盖卡夫卡、马蒂、易卜生、芥川龙之介、泰戈尔与普拉杰。原作语言、版本、作者自译与本课教学释义分别标明。六篇是课程起点，尚未覆盖全部地区、语言与当代写作。

- 正式入口：`site/index.html`。
- `content/catalog.json` 是发布清单；`content/` 另保存逐篇JSON（版本、原文与旁注）及Markdown正文；`assets/` 保存阅读界面。
- 构建：`python tools/rebuild_all.py literature-course`，沿用根目录Python依赖。
- 检查：`python tools/check_literature_course.py`；浏览器运行 `tools/check_literature_course.cjs`，需要Playwright与本地服务器，支持 `LITERATURE_URL`、`LITERATURE_QA_DIR`、`BROWSER_EXECUTABLE`。
- 发布器只收录注册文章、入口及阅读资源。原文旁注不得改写引文，诗行换行与响应式折行须区分；所有练习答案在关闭JavaScript时仍可阅读。

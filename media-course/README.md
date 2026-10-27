# 传播与新闻

采用传播学、新闻学、媒介与平台研究三条主线，加共享研究方法。

- 40 讲完整正文：每线 10 讲，目录均为 ready。
- 每讲包含案例、带答案练习、直接来源与实际核读范围；全课程共 123 道带解析练习。
- 方法线包含六节点网络图、扩散推演、模型评估表与可下载的原创合成研究材料 `assets/research-project.csv`。
- 入口：`site/index.html`。已纳入 `tools/build_public_site.py` 的发布白名单。
- 目录状态来自 `content/*/catalog.json`；只有 ready 生成正文及可点链接。

## 构建与验收

用有 Python Markdown 的环境运行 `tools/build_media_course.py`。阅读界面复用 `humanities/assets/reading.css` 和 `reading.js`，构建时写入本课程的 `site/assets/`；阅读存储使用独立键，避免污染既有分馆状态。课程专属样式与抽样演示源文件在 `assets/`。

运行 `tools/check_media_course.py` 检查目录、正文、内部链接和锚点；运行 `tools/check_media_course.cjs` 做浏览器验收。浏览器脚本需要 Playwright、已启动的本地服务器，支持 `MEDIA_URL`、`MEDIA_QA_DIR`、`BROWSER_EXECUTABLE` 环境变量。

## 内容边界与维护

题目、模型与虚构材料均标明身份；理论论证、经验研究、机构规范和平台自述分别使用。来源记录的是本次实际阅读范围，不表示复核过整部作品或重做过数据分析。平台条款保留核读日期，研究材料保留版本；修改具体条款须重新查证，不只刷新日期。

课程包含采访、田野及采编实践的说明和练习，但正文阅读不能替代真实实践和编辑反馈。平台政策、法律和模型能力按所引来源、地区与核查日期理解，后续修改须重新核读。没有定时任务随此批自动创建。

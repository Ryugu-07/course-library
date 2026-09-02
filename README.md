# 公开课程资料库

这个公开仓库汇总可在线阅读、离线运行和持续修订的课程。公网入口：

<https://course.hhzi.eu.cc/>

课程内容欢迎事实更正、解释改进、可视化建议和实验反馈。请使用 [GitHub Issues](https://github.com/Ryugu-07/course-library/issues/new/choose) 提交，参与方式见 [`CONTRIBUTING.md`](CONTRIBUTING.md)。

## Windows 首次使用

```powershell
E:
git clone https://github.com/Ryugu-07/course-library.git
cd course-library
start-courses.bat
```

脚本会优先使用 Windows Python 启动本地服务器，并打开：

```text
http://127.0.0.1:8778/
```

如果电脑没有 Python，脚本会直接打开根目录的 `index.html`。此时阅读功能仍可使用，但个别浏览器功能可能受到 `file://` 安全策略限制。

## 后续同步

```powershell
E:
cd course-library
git pull
start-courses.bat
```

## 分馆与课程

根目录 `index.html` 是数学、科学、工程与计算课程入口；`humanities/index.html` 是独立的文史哲分馆。

### 理工课程

- `agent-lab`：从最小 SWE Agent 到现代编程智能体
- `ai-course`：AI 原理、工程、研究与实验课程
- `comfyUI-course`：ComfyUI、扩散模型与 AIGC 工作流课程
- `math-course`：本科数学课程资料库
- `grad-math`：研究生数学与资格考试课程资料库
- `physics-course`：本科与研究生物理、实验测量、计算物理及前沿基础课程
- `earth-course`：地球系统、地质深时、大气海洋、碳循环与气候风险
- `ee-course`：电路、信号、测量、嵌入式接口、电源、EMC 与 PCB 工程基础
- `cs-course`：计算机科学全栈核心课程资料库
- `auto-course`：自动控制、状态估计、执行系统与控制前沿
- `bio-course`：生命科学、遗传演化、神经科学与生物技术
- `clinic-course`：临床推理、循证医学与医疗决策
- `lang-course`：语言学、信息论、心智、文明与语言智能
- `materials-course`：材料结构、缺陷、性能、制备与计算材料学
- `mech-course`：工程力学、振动、机械设计、制造与有限元
- `med-course`：基础医学、病理、药理与器官系统疾病机制
- `micro-course`：半导体器件、集成电路、制造与芯片产业
- `photo-course`：光学、激光、成像、光通信与光子技术
- `psych-course`：心理学方法、认知、社会、临床与应用心理学

### 文史哲分馆

- `wxb-course`：王小波作品、思想、文体与精神世界专题阅读

## 质量检查

课程源文件修改后，先重建对应站点，再执行结构审查：

```bash
python3 -m pip install -r requirements-build.txt
python3 tools/rebuild_all.py ai-course cs-course
python3 tools/course_audit.py
python3 tools/learning_coverage.py --remaining
python3 tools/check_external_links.py med-course/lectures clinic-course/lectures
```

不传课程名时，`rebuild_all.py` 会重建全部 20 个站点；若页面除了“构建于”时间外没有变化，它会保留原文件，避免无意义的全站差异。结构审查会检查本地资源、重复 ID、图片替代文本、SVG、ComfyUI 工作流 JSON，以及被错误渲染成普通段落的 Markdown 列表。`learning_coverage.py` 从十二站生成器的 `COURSE` 注册表读取正式讲义，分别统计数学/物理/AI、地球系统、自动控制/电气电子/材料/机械，以及光电/微电子/计算机科学中已达到完整“学习层 + 交互实验”契约的页面；各站导论、实验索引和课程显式排除的非核心页不进入分母。

## Mac 端更新仓库

各套原始课程仍保存在各自原目录。运行下面的脚本会把最新内容同步进本仓库，同时排除虚拟环境、模型、数据缓存、输出目录、真实 `.env` 和系统文件：

```bash
cd ~/course-library
./sync-from-mac.sh
git status
```

确认变更后再提交和推送。API Key 永远只放在未被 Git 跟踪的 `.env` 中。

## Cloudflare Pages 公开部署

仓库内已提供静态发布构建器。Cloudflare Pages 项目使用以下设置：

```text
Production branch: main
Build command: python tools/build_public_site.py
Build output directory: public
```

构建器会把 20 个已生成课程站点和文史哲分馆汇总到 `public/`，同时检查 Cloudflare Pages 的文件数量和单文件大小限制。GitHub Actions 会在每次推送和拉取请求时重建、审查并验证这份发布产物。

推荐把自定义域名设为 `course.hhzi.eu.cc`，以免影响现有的 `medusa.hhzi.eu.cc`。课程完全是静态内容，阅读进度仍保存在每台设备各自的浏览器中，不会跨设备同步。

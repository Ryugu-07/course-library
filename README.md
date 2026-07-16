# 本地课程资料库

这个私有仓库汇总六套本地课程，方便在 macOS 更新后推送到 GitHub，再在 Windows 的 `E:` 盘拉取和浏览。

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

## 六套课程

- `agent-lab`：从最小 SWE Agent 到现代编程智能体
- `ai-course`：AI 原理、工程、研究与实验课程
- `comfyUI-course`：ComfyUI、扩散模型与 AIGC 工作流课程
- `math-course`：本科数学课程资料库
- `grad-math`：研究生数学与资格考试课程资料库
- `physics-course`：本科、研究生理论物理与前沿基础课程

课程入口是仓库根目录的 `index.html`。

## Mac 端更新仓库

六套原始课程仍保存在各自原目录。运行下面的脚本会把最新内容同步进本仓库，同时排除虚拟环境、模型、数据缓存、输出目录、真实 `.env` 和系统文件：

```bash
cd ~/course-library
./sync-from-mac.sh
git status
```

确认变更后再提交和推送。API Key 永远只放在未被 Git 跟踪的 `.env` 中。

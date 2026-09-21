# 2026-09-21 Qwen-Image 2.1 课程更新来源核验

## 本次交付

新增ComfyUI第23讲及双路条件机制图，更新导览、架构、模型生态、AIGC地图、工作流入口和原有选择器。三组课程练习：中文海报、双参考换衣、透明PNG。没有下载模型或操作Win安装；没有本机推理、显存、速度或生成质量测量。

## 固定来源

`qwen-image-2-1-sources.json`记录两份官方UI模板和核心nodes_qwen.py的commit/SHA256。本次从固定commit重新下载并与最初读取字节比较一致。

- Qwen官方：https://github.com/QwenLM/Qwen-Image-2.1；模型卡 https://huggingface.co/Qwen/Qwen-Image-2.1 。确认9月20日权重发布、7B仅生成组件、统一生成/编辑、RGBA、64通道16倍VAE和Qwen3-VL。官方最多10参考图说明与实现端口可扩展到16分开记录。
- 三件套：https://huggingface.co/Comfy-Org/Qwen-Image-2.1 。确认模板默认INT8 convrot模型与编码器、专用BF16 VAE；BF16/W4A8可选项不是显存保证。
- 许可：https://huggingface.co/Qwen/Qwen-Image-2.1/blob/main/LICENSE 。为研究/评估许可，商业使用需另行许可。未写成Apache许可。
- 两份官方模板：25步、CFG1、Euler/simple；编辑外层resolution0、custom_size关闭；参考图先后顺序、种子randomize、SaveImageAdvanced PNG和子图格式逐项核对。模板结构核对不是GPU执行。
- 节点源码：resolution按R平方像素预算及宽高比缩放后32倍数取整；第一参考决定默认画布；RGBA参考图对视觉编码器合成白底，VAE保留alpha；latent为B×64×H/16×W/16。

## 到期维护项的实质复核

发布前发现旧账本Qwen3.8与ComfyUI通用条目到期，重新核对以下原来源后更新复核日期；没有假装所有旧讲义的新型号都重新跑过。

- https://huggingface.co/Qwen/Qwen3.8-27B 和 https://github.com/QwenLM/Qwen3.8 ：公开权重、Apache-2.0、27B稠密视觉语言模型和Transformers/SGLang/vLLM部署入口仍与AI第10/19讲描述一致，AI课程正文无需扩展。
- https://docs.comfy.org/interface/features/template ：内置和社区模板、缺模型提示和模型目录规则仍适用；提示检查不是运行证明。
- https://docs.comfy.org/installation/update_comfyui ：核心和依赖要一起更新，portable稳定/开发脚本不同；第06讲已明确这一区别。核心Releases API在核验时返回v0.37.0（9月21日），课程保留0.22/0.33.1为历史快照，不承诺机器升级，也不把最新标签当最低兼容版本。
- https://docs.comfy.org/manager/pack-management 、https://docs.comfy.org/registry/overview 、https://docs.comfy.org/registry/standards ：节点包搜索、版本选择及Registry语义化版本说明，与课程使用方式相符。
- https://docs.comfy.org/basic-concepts/models 和 https://docs.comfy.org/development/comfyui-server/comms_routes ：模型分类及/prompt的API角色仍适用。第23讲明确UI子图JSON须先导入、运行后再导出API格式。

## 验收记录

构建器对原7UI+7API工作流执行286项合同检查，原互动选择器11项自检通过。新课浏览器、公式、图片和无脚本检查及发布状态随实际完成追加，不能把本文件来源核验当作推理实测。

实际完成：新讲在1280/390/320宽度及390无脚本配置通过，3个原生答案可展开，20个公式实例无KaTeX错误，SVG正常；另人工检查手机深色机制图与浅色正文。现有模型选择器挂载正常。全站714源/780HTML/72480引用/2150SVG无结构错误；11条生态账本无过期。两份固定模板的六种关键节点、三件套文件与采样参数逐项比对通过，缩放算例复算1248×832。证据摘要见qwen-image-2-1-validation.json。发布结果另记任务记忆，不提前写成成功。

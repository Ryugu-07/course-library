(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;

  if (root && root.document) {
    if (root.document.readyState === "loading") {
      root.document.addEventListener("DOMContentLoaded", function () {
        exported.boot(root.document);
      });
    } else {
      exported.boot(root.document);
    }
  }

  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (browserRoot) {
  "use strict";

  var STYLE_ID = "comfy-ecosystem-labs-styles";
  var SERIAL = 0;
  var SNAPSHOT_DATE = "2026-08-20";

  var ARCHITECTURE_PROFILES = {
    sd15: {
      label: "SD1.5",
      encoder: "CLIP ViT-L/14；文本表示经 cross-attention 进入 U-Net。",
      conditioning: "CLIP Text Encode → CONDITIONING；控制件必须标明 SD1.5 基座。",
      denoiser: "U-Net：下采样、瓶颈、上采样与 skip connection。",
      latent: "SD VAE 形状示例：1024×1024 RGB → 128×128×4 latent。",
      vae: "VAE Encode/Decode 负责 RGB ↔ latent；通道和缩放以模型文件为准。",
      full: "CheckpointLoaderSimple：常见整包路线，输出 MODEL、CLIP、VAE。",
      split: "UNET/Model Loader + CLIP Loader + VAE Loader；三件套必须同家族。",
      memory: "16GB：作为低预算测试起点；需实测峰值、耗时、输出和 OOM。",
      evidence: "SD1.5 官方模型卡与 ComfyUI 文生图教程；具体微调版仍需独立核验。"
    },
    sdxl: {
      label: "SDXL",
      encoder: "双 text encoder；精确组合由 SDXL 权重与当前 ComfyUI 模板确定。",
      conditioning: "双编码器输出汇入 SDXL CONDITIONING；LoRA/ControlNet 需标明 SDXL。",
      denoiser: "U-Net：仍是潜空间中的逐步去噪骨架。",
      latent: "SD VAE 形状示例：1024×1024 RGB → 128×128×4 latent；不要外推到别家族。",
      vae: "SDXL VAE 负责对应 latent 与 RGB 的转换；外置 VAE 需同家族核对。",
      full: "CheckpointLoaderSimple：具体 checkpoint 是否包含三件套要看文件说明。",
      split: "UNET/Model Loader + DualCLIP/CLIP Loader + VAE Loader；以模板连线为准。",
      memory: "16GB：固定分辨率、精度和外挂后实测；不对速度或显存峰值作保证。",
      evidence: "Stability 官方 SDXL 权重仓库、ComfyUI 模板与具体变体许可证。"
    },
    flux: {
      label: "FLUX",
      encoder: "模型专用文本编码组合；FLUX.1-dev 官方模型卡与当前模板共同定义配对。",
      conditioning: "文本编码结果按 FLUX 工作流进入 Transformer；不要套用 SDXL 的 CFG/节点假设。",
      denoiser: "多模态 Diffusion Transformer 剖面；双流/单流 block 与 flow 采样规则以来源核验。",
      latent: "latent shape、patch/packing 和 VAE 由具体 FLUX 变体决定；不能套用 SD 的 4 通道账本。",
      vae: "常见分体 VAE Loader；文件名、精度和 decoder 输出必须来自同一模板。",
      full: "若某发行版提供整包 checkpoint，也只能按该发行版的节点契约加载。",
      split: "Model/UNET Loader + 文本编码 Loader + VAE Loader；官方模板是首要连线证据。",
      memory: "16GB：fp8/CPU offload 等只是待测变量，不能从文件名推断体验。",
      evidence: "FLUX.1-dev 官方模型卡、ComfyUI 当前模板、变体 LICENSE 和本机测试。"
    },
    qwen: {
      label: "Qwen-Image",
      encoder: "官方 ComfyUI 示例列出 Qwen 文本编码器；不要用任意 CLIP 替换。",
      conditioning: "文本编码器与模型专用 conditioning/节点配套；编辑与控制变体需另核对。",
      denoiser: "DiT-style diffusion model；具体实现名、采样和节点以模型卡/模板为准。",
      latent: "latent shape 和 VAE 通道由 Qwen-Image 变体定义；不要从 SD 1024 账本推断。",
      vae: "官方示例把 VAE 单独放在 vae/；VAE 输出与 diffusion model 必须配套。",
      full: "不要假设存在可互换的通用 checkpoint；先看官方模板是否采用整包。",
      split: "diffusion_models/ + text_encoders/ + vae/；节点和文件名以官方示例为准。",
      memory: "16GB：模板可加载不代表能运行；必须实测精度、分辨率、offload 与峰值。",
      evidence: "ComfyUI 官方 Qwen-Image 示例、Qwen 模型卡、当前模板与具体许可证。"
    }
  };

  var MODEL_RECORDS = [
    {
      id: "sd15",
      name: "SD1.5 系",
      family: "sd15",
      tasks: ["txt2img", "img2img", "control"],
      controls: ["text", "reference", "structure"],
      budgets: ["16gb-test", "24gb-test"],
      evidence: ["official-template", "official-card", "license"],
      loader: "CheckpointLoaderSimple 常见；分体 loader 需按具体发布核验",
      template: "ComfyUI 官方 Text to Image / 当前 SD1.5 模板入口",
      model: "具体 checkpoint、底模、版本、目录、哈希",
      precision: "模型卡/文件元数据给出的 fp16、fp32 或量化；本机对照测试",
      dependencies: "ComfyUI 核心与当前模板；ControlNet/adapter/custom node 逐项审查",
      source: "官方模型卡 + 官方模板；社区微调版需要自己的来源证据",
      license: "具体 checkpoint/微调版 LICENSE 或 model card 待核对",
      budgetNote: "加入预算实测队列，不代表已经通过该预算"
    },
    {
      id: "sdxl",
      name: "SDXL 系",
      family: "sdxl",
      tasks: ["txt2img", "img2img", "control"],
      controls: ["text", "reference", "structure"],
      budgets: ["16gb-test", "24gb-test"],
      evidence: ["official-template", "official-card", "license"],
      loader: "完整 checkpoint 或与模板配套的 Model/CLIP/VAE 分体 loader",
      template: "ComfyUI 官方 SDXL/Text to Image 模板；以本机模板版本为准",
      model: "具体 SDXL base/finetune、VAE、LoRA/ControlNet 文件与哈希",
      precision: "fp16/bf16/fp8/量化候选需结合显存和输出做实测",
      dependencies: "ComfyUI 核心、模板包；控制节点和 adapter 的版本/来源",
      source: "Stability 官方 SDXL 权重仓库 + 官方模板 + 具体变体页面",
      license: "具体 base/finetune/adaptor 的许可证分别核对",
      budgetNote: "加入预算实测队列，不代表已经通过该预算"
    },
    {
      id: "flux",
      name: "FLUX 系",
      family: "flux",
      tasks: ["txt2img", "img2img", "control"],
      controls: ["text", "reference", "structure"],
      budgets: ["16gb-test", "24gb-test"],
      evidence: ["official-template", "official-card", "license"],
      loader: "常见分体 Model/UNET + text encoder + VAE；精确节点按模板",
      template: "ComfyUI 官方 FLUX 相关模板；记录模板版本与缺模型清单",
      model: "具体 FLUX 变体、text encoder、VAE、adapter 文件与哈希",
      precision: "fp16/fp8/量化与 CPU offload 作为实验变量，不是运行承诺",
      dependencies: "ComfyUI/模板版本；FLUX 专用控制件与第三方节点需安全审查",
      source: "Black Forest Labs 官方模型卡 + 官方模板 + 变体 LICENSE",
      license: "以具体 FLUX 变体 LICENSE 为准，不能用“开放权重”替代许可",
      budgetNote: "加入预算实测队列，不代表已经通过该预算"
    },
    {
      id: "qwen",
      name: "Qwen-Image 系",
      family: "qwen",
      tasks: ["txt2img", "img2img", "control"],
      controls: ["text", "reference", "structure"],
      budgets: ["16gb-test", "24gb-test"],
      evidence: ["official-template", "official-card", "license"],
      loader: "diffusion model + Qwen text encoder + VAE；官方示例优先",
      template: "ComfyUI 官方 Qwen-Image 模板/示例；记录精确变体与缺模型列表",
      model: "diffusion_models、text_encoders、vae 具体文件、版本与哈希",
      precision: "官方示例给出的精度/量化与本机显存测试结果分别记录",
      dependencies: "ComfyUI 核心/模板包；编辑、控制和 LoRA 变体逐项核验",
      source: "ComfyUI 官方 Qwen-Image 示例 + Qwen 模型卡 + 具体许可证",
      license: "具体 Qwen-Image 变体与 adapter 的 LICENSE/model card 待核对",
      budgetNote: "加入预算实测队列，不代表已经通过该预算"
    }
  ];

  var AIGC_OPTIONS = {
    representation: [
      ["continuous-latent", "连续 latent"],
      ["discrete-token", "离散 token / codec"],
      ["video-latent", "3D 时空 latent"],
      ["geometry", "几何 / mesh / 场"],
      ["mixed", "混合表示"]
    ],
    generation: [
      ["autoregressive", "自回归 AR"],
      ["diffusion", "扩散"],
      ["flow-matching", "流匹配"],
      ["hybrid", "混合规则"]
    ],
    conditioning: [
      ["text", "文字"],
      ["image", "参考图 / 首帧"],
      ["structure", "姿态 / 边缘 / 深度 / 布局"],
      ["audio", "音频 / 韵律"],
      ["multimodal", "多模态上下文"]
    ],
    decoder: [
      ["vae-rgb", "VAE → RGB"],
      ["vocoder-audio", "vocoder / codec → 波形"],
      ["video-frames", "视频 decoder → 帧/容器"],
      ["mesh", "mesh / 材质输出"],
      ["other", "其他 decoder / 直接 token 输出"]
    ]
  };

  var STYLE_TEXT = [
    ".comfy-lab-shell{--lab-accent:var(--accent,#2f6b56);--lab-surface:var(--bg,#faf6ee);--lab-subtle:var(--block-bg,#f5f0e3);--lab-border:var(--border,#e0d7c4);--lab-fg:var(--fg,#2c2a26);--lab-muted:var(--fg-soft,#6b6557);--lab-warn:#a7532f;max-width:100%;min-width:0;margin:1.4em 0;padding:14px;border:1px solid var(--lab-border);border-radius:8px;background:var(--lab-subtle);color:var(--lab-fg);line-height:1.55;overflow-wrap:anywhere;word-break:break-word;}",
    "html[data-theme=\"dark\"] .comfy-lab-shell{--lab-accent:#8fd6bd;--lab-surface:#171a20;--lab-subtle:#22262d;--lab-border:#474c55;--lab-fg:#e1e2dd;--lab-muted:#b1b4ae;--lab-warn:#f0ad7c;}",
    ".comfy-lab-shell *,.comfy-lab-shell *::before,.comfy-lab-shell *::after{box-sizing:border-box;}.comfy-lab-shell [hidden]{display:none!important;}",
    ".comfy-lab-shell h3,.comfy-lab-shell h4{margin:0;color:var(--lab-fg);letter-spacing:0;}.comfy-lab-shell h3{font-size:1.18rem;}.comfy-lab-shell h4{font-size:1rem;}",
    ".comfy-lab-kicker,.comfy-lab-help,.comfy-lab-status,.comfy-lab-note{color:var(--lab-muted);font-size:13px;line-height:1.65;}.comfy-lab-kicker{margin:.2em 0 .6em;font-weight:700;color:var(--lab-accent);}.comfy-lab-help{margin:.5em 0 1em;}",
    ".comfy-lab-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:12px 0;}.comfy-lab-tabs button,.comfy-lab-shell button,.comfy-lab-shell select,.comfy-lab-shell input{min-height:44px;font:inherit;line-height:1.35;}",
    ".comfy-lab-shell button{min-width:0;padding:8px 10px;border:1px solid var(--lab-border);border-radius:6px;background:var(--lab-surface);color:var(--lab-fg);cursor:pointer;overflow-wrap:anywhere;}.comfy-lab-shell button:hover{border-color:var(--lab-accent);}.comfy-lab-shell button[aria-selected=\"true\"]{border-color:var(--lab-accent);background:var(--lab-accent);color:var(--lab-surface);font-weight:700;}.comfy-lab-shell button:focus-visible,.comfy-lab-shell select:focus-visible,.comfy-lab-shell input:focus-visible{outline:3px solid var(--lab-accent);outline-offset:2px;}",
    ".comfy-lab-shell select,.comfy-lab-shell input{width:100%;padding:8px 10px;border:1px solid var(--lab-border);border-radius:6px;background:var(--lab-surface);color:var(--lab-fg);}.comfy-lab-shell label{display:grid;gap:5px;min-width:0;color:var(--lab-muted);font-size:13px;font-weight:700;}",
    ".comfy-lab-architecture-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:12px;}.comfy-lab-layer{min-width:0;padding:11px;border:1px solid var(--lab-border);border-left:4px solid var(--lab-accent);background:var(--lab-surface);}.comfy-lab-layer h4{margin-bottom:5px;}.comfy-lab-layer p{margin:.35em 0;color:var(--lab-fg);font-size:13px;}",
    ".comfy-lab-detail-grid,.comfy-lab-field-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:12px;}.comfy-lab-detail,.comfy-lab-field{min-width:0;padding:10px;border-top:2px solid var(--lab-border);background:var(--lab-surface);}.comfy-lab-detail strong,.comfy-lab-field strong{display:block;margin-bottom:4px;color:var(--lab-muted);font-size:12px;}.comfy-lab-detail span,.comfy-lab-field span{display:block;font-size:13px;}",
    ".comfy-lab-ledger{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:12px;}.comfy-lab-ledger-item{min-width:0;padding:9px;border-top:3px solid var(--lab-accent);background:var(--lab-surface);}.comfy-lab-ledger-item strong{display:block;color:var(--lab-muted);font-size:11px;}.comfy-lab-ledger-item span{display:block;margin-top:3px;font-size:13px;font-variant-numeric:tabular-nums;}",
    ".comfy-lab-flow{margin-top:12px;padding:10px 12px;border-left:3px solid var(--lab-accent);background:var(--lab-surface);font-family:\"SF Mono\",Menlo,Consolas,monospace;font-size:12px;line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere;}",
    ".comfy-lab-form{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:12px 0;}.comfy-lab-results{display:grid;gap:8px;margin-top:12px;}.comfy-lab-result{min-width:0;padding:11px;border-top:3px solid var(--lab-accent);background:var(--lab-surface);}.comfy-lab-result h4{margin-bottom:5px;}.comfy-lab-result p{margin:.3em 0;color:var(--lab-muted);font-size:13px;}.comfy-lab-result dl{display:grid;grid-template-columns:minmax(100px,.38fr) minmax(0,1fr);gap:5px 9px;margin:.7em 0 0;font-size:13px;}.comfy-lab-result dt{color:var(--lab-muted);font-weight:700;}.comfy-lab-result dd{margin:0;min-width:0;}.comfy-lab-status{min-height:2em;margin:.6em 0;font-weight:700;}.comfy-lab-warning{color:var(--lab-warn);}",
    ".comfy-lab-questions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0;}.comfy-lab-question{min-width:0;padding:10px;border-top:3px solid var(--lab-accent);background:var(--lab-surface);}.comfy-lab-question label{margin:0;}.comfy-lab-maintenance{margin-top:12px;padding:10px 12px;border-left:3px solid var(--lab-accent);background:var(--lab-surface);font-family:\"SF Mono\",Menlo,Consolas,monospace;font-size:12px;line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere;}",
    ".comfy-lab-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}",
    "@media(max-width:760px){.comfy-lab-form{grid-template-columns:repeat(2,minmax(0,1fr));}.comfy-lab-questions{grid-template-columns:repeat(2,minmax(0,1fr));}.comfy-lab-ledger{grid-template-columns:repeat(2,minmax(0,1fr));}}",
    "@media(max-width:520px){.comfy-lab-shell{padding:11px;}.comfy-lab-tabs{grid-template-columns:repeat(2,minmax(0,1fr));}.comfy-lab-architecture-grid,.comfy-lab-detail-grid,.comfy-lab-field-grid,.comfy-lab-form,.comfy-lab-questions{grid-template-columns:minmax(0,1fr);}.comfy-lab-result dl{grid-template-columns:minmax(0,1fr);gap:2px;}.comfy-lab-result dd{margin-bottom:5px;}}",
    "@media(prefers-reduced-motion:reduce){.comfy-lab-shell *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
  ].join("\n");

  function element(doc, tag, className, text) {
    var node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function attr(node, name, value) {
    if (value !== undefined && value !== null) node.setAttribute(name, String(value));
    return node;
  }

  function append(parent) {
    for (var i = 1; i < arguments.length; i += 1) {
      if (arguments[i]) parent.appendChild(arguments[i]);
    }
    return parent;
  }

  function heading(doc, text) {
    return element(doc, "h3", "", text);
  }

  function paragraph(doc, text, className) {
    return element(doc, "p", className || "", text);
  }

  function makeShell(doc, title, intro) {
    var shell = element(doc, "section", "comfy-lab-shell");
    attr(shell, "aria-label", title);
    append(shell, heading(doc, title), paragraph(doc, intro, "comfy-lab-help"));
    return shell;
  }

  function ensureStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = element(doc, "style");
    attr(style, "id", STYLE_ID);
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function calculateShapeLedger(width, height, downsample, channels) {
    var latentWidth = width / downsample;
    var latentHeight = height / downsample;
    var inputSlots = width * height * 3;
    var latentSlots = latentWidth * latentHeight * channels;
    return {
      input: width + "×" + height + "×3",
      latent: latentWidth + "×" + latentHeight + "×" + channels,
      inputSlots: inputSlots,
      latentSlots: latentSlots,
      spatialRatio: downsample * downsample,
      totalRatio: inputSlots / latentSlots
    };
  }

  function architectureProfile(id) {
    return ARCHITECTURE_PROFILES[id] || ARCHITECTURE_PROFILES.sd15;
  }

  function hasValue(list, value) {
    return list.indexOf(value) !== -1;
  }

  function evidenceMatches(record, value) {
    if (value === "any" || value === "") return true;
    if (value === "official-both") {
      return hasValue(record.evidence, "official-template") && hasValue(record.evidence, "official-card");
    }
    return hasValue(record.evidence, value);
  }

  function selectModelCandidates(filters) {
    var chosen = filters || {};
    return MODEL_RECORDS.filter(function (record) {
      var taskOk = !chosen.task || chosen.task === "any" || hasValue(record.tasks, chosen.task);
      var familyOk = !chosen.family || chosen.family === "any" || record.family === chosen.family;
      var controlOk = !chosen.control || chosen.control === "any" || hasValue(record.controls, chosen.control);
      var budgetOk = !chosen.budget || chosen.budget === "any" || chosen.budget === "no-guarantee" || hasValue(record.budgets, chosen.budget);
      return taskOk && familyOk && controlOk && budgetOk && evidenceMatches(record, chosen.evidence || "any");
    });
  }

  function findOption(options, value) {
    for (var i = 0; i < options.length; i += 1) {
      if (options[i][0] === value) return options[i][1];
    }
    return value;
  }

  function classifyAigcAnswers(answers) {
    var chosen = answers || {};
    return {
      representation: findOption(AIGC_OPTIONS.representation, chosen.representation || "continuous-latent"),
      generation: findOption(AIGC_OPTIONS.generation, chosen.generation || "diffusion"),
      conditioning: findOption(AIGC_OPTIONS.conditioning, chosen.conditioning || "text"),
      decoder: findOption(AIGC_OPTIONS.decoder, chosen.decoder || "vae-rgb"),
      maintenance: {
        model: chosen.model || "待填新模型",
        last_verified: SNAPSHOT_DATE,
        source: chosen.source || "待填：官方模型卡/官方仓库/ComfyUI 官方模板",
        evidence_level: "待填：official-template / official-model-card / local-test",
        compatibility: "需核验：loader、template、assets、precision、dependencies、control、vram"
      }
    };
  }

  function setOptions(doc, select, options, selected) {
    options.forEach(function (option) {
      var node = element(doc, "option", "", option[1]);
      attr(node, "value", option[0]);
      if (option[0] === selected) node.selected = true;
      select.appendChild(node);
    });
  }

  function makeField(doc, labelText, id, options, selected) {
    var label = element(doc, "label", "");
    label.textContent = labelText;
    var select = element(doc, "select", "");
    attr(select, "id", id);
    attr(select, "aria-label", labelText);
    setOptions(doc, select, options, selected);
    label.appendChild(select);
    return { label: label, control: select };
  }

  function makeTextField(doc, labelText, id, value, type) {
    var label = element(doc, "label", "");
    label.textContent = labelText;
    var input = element(doc, "input", "");
    attr(input, "id", id);
    attr(input, "type", type || "text");
    attr(input, "value", value || "");
    label.appendChild(input);
    return { label: label, control: input };
  }

  function addDefinitionList(doc, parent, rows) {
    var dl = element(doc, "dl", "");
    rows.forEach(function (row) {
      var dt = element(doc, "dt", "", row[0]);
      var dd = element(doc, "dd", "", row[1]);
      append(dl, dt, dd);
    });
    parent.appendChild(dl);
  }

  function mountArchitecture(root) {
    var doc = root.ownerDocument;
    var shell = makeShell(doc, "架构剖面实验室", "切换模型家族，逐层观察文本/条件、denoiser、latent/VAE 和完整 checkpoint/分体 loader。16GB 只显示为待测边界。\n");
    var tabList = element(doc, "div", "comfy-lab-tabs");
    attr(tabList, "role", "tablist");
    attr(tabList, "aria-label", "模型家族");
    var panelId = "comfy-architecture-panel-" + SERIAL;
    SERIAL += 1;
    var panel = element(doc, "div", "");
    attr(panel, "id", panelId);
    attr(panel, "role", "tabpanel");
    attr(panel, "aria-live", "polite");
    var keys = ["sd15", "sdxl", "flux", "qwen"];
    var buttons = [];

    function selectTab(index) {
      var safeIndex = (index + keys.length) % keys.length;
      buttons.forEach(function (button, buttonIndex) {
        attr(button, "aria-selected", buttonIndex === safeIndex ? "true" : "false");
        attr(button, "tabindex", buttonIndex === safeIndex ? "0" : "-1");
      });
      renderProfile(keys[safeIndex]);
      buttons[safeIndex].focus();
    }

    function renderProfile(key) {
      var profile = architectureProfile(key);
      var ledger = calculateShapeLedger(1024, 1024, 8, 4);
      panel.replaceChildren();
      append(panel, element(doc, "p", "comfy-lab-kicker", profile.label + " · 四层剖面"));
      var layerGrid = element(doc, "div", "comfy-lab-architecture-grid");
      [
        ["1 · 文本编码 / 条件", profile.encoder, profile.conditioning],
        ["2 · denoiser", profile.denoiser, "条件在这里被消费；节点接口必须与模型家族一致。"],
        ["3 · latent / VAE", profile.latent, profile.vae],
        ["4 · 装载形态", profile.full, profile.split]
      ].forEach(function (layer) {
        var card = element(doc, "article", "comfy-lab-layer");
        append(card, element(doc, "h4", "", layer[0]), paragraph(doc, layer[1]), paragraph(doc, layer[2]));
        layerGrid.appendChild(card);
      });
      panel.appendChild(layerGrid);

      var details = element(doc, "div", "comfy-lab-detail-grid");
      [
        ["16GB 边界", profile.memory],
        ["证据入口", profile.evidence]
      ].forEach(function (row) {
        var item = element(doc, "div", "comfy-lab-detail");
        append(item, element(doc, "strong", "", row[0]), element(doc, "span", "", row[1]));
        details.appendChild(item);
      });
      panel.appendChild(details);

      var ledgerTitle = element(doc, "h4", "", "1024×1024 RGB → latent：SD VAE 形状账本");
      var ledgerGrid = element(doc, "div", "comfy-lab-ledger");
      [
        ["RGB 输入", ledger.input],
        ["latent 示例", ledger.latent],
        ["空间缩减", "1/" + ledger.spatialRatio],
        ["槽位缩减", "1/" + ledger.totalRatio]
      ].forEach(function (item) {
        var cell = element(doc, "div", "comfy-lab-ledger-item");
        append(cell, element(doc, "strong", "", item[0]), element(doc, "span", "", item[1]));
        ledgerGrid.appendChild(cell);
      });
      append(panel, ledgerTitle, ledgerGrid, paragraph(doc, "账本中的 128×128×4 是 Stable Diffusion VAE 示例；FLUX/Qwen-Image 的 latent shape、packing 和 VAE 必须回到当前模型卡/模板核验。", "comfy-lab-note"));
    }

    keys.forEach(function (key, index) {
      var button = element(doc, "button", "", ARCHITECTURE_PROFILES[key].label);
      attr(button, "type", "button");
      attr(button, "role", "tab");
      attr(button, "aria-controls", panelId);
      attr(button, "aria-selected", index === 0 ? "true" : "false");
      attr(button, "tabindex", index === 0 ? "0" : "-1");
      button.addEventListener("click", function () { selectTab(index); });
      button.addEventListener("keydown", function (event) {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          selectTab(index + 1);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          selectTab(index - 1);
        } else if (event.key === "Home") {
          event.preventDefault();
          selectTab(0);
        } else if (event.key === "End") {
          event.preventDefault();
          selectTab(keys.length - 1);
        }
      });
      buttons.push(button);
      tabList.appendChild(button);
    });

    append(shell, tabList, panel);
    root.replaceChildren(shell);
    renderProfile("sd15");
  }

  function mountModelSelector(root) {
    var doc = root.ownerDocument;
    var shell = makeShell(doc, "模型选择器", "按任务、家族、显存预算、控制需求和许可/来源证据筛选。结果是核验队列，不是模型排名。\n");
    var form = element(doc, "div", "comfy-lab-form");
    var prefix = "comfy-model-selector-" + SERIAL;
    SERIAL += 1;
    var fields = [
      makeField(doc, "任务", prefix + "-task", [["any", "全部任务"], ["txt2img", "文生图"], ["img2img", "图生图/编辑"], ["control", "结构控制"]], "any"),
      makeField(doc, "家族", prefix + "-family", [["any", "全部家族"], ["sd15", "SD1.5"], ["sdxl", "SDXL"], ["flux", "FLUX"], ["qwen", "Qwen-Image"]], "any"),
      makeField(doc, "显存预算", prefix + "-budget", [["any", "不限定"], ["16gb-test", "16GB 实测队列"], ["24gb-test", "24GB+ 实测队列"], ["no-guarantee", "只看未建立结论"]], "16gb-test"),
      makeField(doc, "控制需求", prefix + "-control", [["any", "文字或任意控制"], ["text", "文字"], ["reference", "参考图"], ["structure", "姿态/边缘/深度"]], "any"),
      makeField(doc, "许可/来源证据", prefix + "-evidence", [["any", "不限定"], ["official-both", "官方模板 + 模型卡"], ["official-template", "有官方模板"], ["official-card", "有官方模型卡"], ["license", "有许可证字段"]], "official-both")
    ];
    fields.forEach(function (field) { form.appendChild(field.label); });
    var status = paragraph(doc, "", "comfy-lab-status");
    attr(status, "aria-live", "polite");
    var results = element(doc, "div", "comfy-lab-results");

    function renderResults() {
      var filters = {
        task: fields[0].control.value,
        family: fields[1].control.value,
        budget: fields[2].control.value,
        control: fields[3].control.value,
        evidence: fields[4].control.value
      };
      var records = selectModelCandidates(filters);
      results.replaceChildren();
      status.textContent = "当前筛选得到 " + records.length + " 条核验队列；预算标签不等于运行结论。";
      if (!records.length) {
        results.appendChild(paragraph(doc, "没有同时满足这些证据与接口条件的静态候选；降低证据门槛或回到官方模板重新发现。", "comfy-lab-warning"));
        return;
      }
      records.forEach(function (record) {
        var card = element(doc, "article", "comfy-lab-result");
        append(card, element(doc, "h4", "", record.name), paragraph(doc, "待核验，不代表质量排名：" + record.budgetNote));
        addDefinitionList(doc, card, [
          ["Loader", record.loader],
          ["Template", record.template],
          ["Model files", record.model],
          ["Precision", record.precision],
          ["Dependencies", record.dependencies],
          ["License / source", record.license + "；" + record.source]
        ]);
        card.appendChild(paragraph(doc, "需实测：固定输入与 seed，记录分辨率、峰值显存、耗时、offload、OOM 和输出检查。", "comfy-lab-note"));
        results.appendChild(card);
      });
    }

    fields.forEach(function (field) { field.control.addEventListener("change", renderResults); });
    append(shell, form, status, results);
    root.replaceChildren(shell);
    renderResults();
  }

  function mountAigcMap(root) {
    var doc = root.ownerDocument;
    var shell = makeShell(doc, "AIGC 四问分类器", "选出一个新模型的表示、生成规则、条件和 decoder/output，再生成一条待维护记录。模型名称和来源只在本地文本框中使用，不会联网。\n");
    var prefix = "comfy-aigc-map-" + SERIAL;
    SERIAL += 1;
    var identity = element(doc, "div", "comfy-lab-field-grid");
    var modelField = makeTextField(doc, "模型条目名", prefix + "-model", "待填新模型", "text");
    var sourceField = makeTextField(doc, "官方来源", prefix + "-source", "", "url");
    identity.appendChild(modelField.label);
    identity.appendChild(sourceField.label);

    var questionGrid = element(doc, "div", "comfy-lab-questions");
    var specs = [
      ["representation", "Q1 · Representation", "continuous-latent"],
      ["generation", "Q2 · Generation rule", "diffusion"],
      ["conditioning", "Q3 · Conditioning", "text"],
      ["decoder", "Q4 · Decoder/output", "vae-rgb"]
    ];
    var controls = {};
    specs.forEach(function (spec) {
      var field = makeField(doc, spec[1], prefix + "-" + spec[0], AIGC_OPTIONS[spec[0]], spec[2]);
      controls[spec[0]] = field.control;
      var item = element(doc, "div", "comfy-lab-question");
      item.appendChild(field.label);
      questionGrid.appendChild(item);
    });
    var summary = element(doc, "div", "comfy-lab-detail-grid");
    var maintenance = element(doc, "pre", "comfy-lab-maintenance");
    attr(maintenance, "aria-live", "polite");
    var note = paragraph(doc, "产品名单会过期；保留来源和 last_verified，下一次更新先刷新证据，再决定是否保留名称。", "comfy-lab-note");

    function renderClassification() {
      var result = classifyAigcAnswers({
        model: modelField.control.value,
        source: sourceField.control.value,
        representation: controls.representation.value,
        generation: controls.generation.value,
        conditioning: controls.conditioning.value,
        decoder: controls.decoder.value
      });
      summary.replaceChildren();
      [["Representation", result.representation], ["Generation rule", result.generation], ["Conditioning", result.conditioning], ["Decoder/output", result.decoder]].forEach(function (row) {
        var item = element(doc, "div", "comfy-lab-detail");
        append(item, element(doc, "strong", "", row[0]), element(doc, "span", "", row[1]));
        summary.appendChild(item);
      });
      maintenance.textContent = [
        "model: " + result.maintenance.model,
        "last_verified: " + result.maintenance.last_verified,
        "source: " + result.maintenance.source,
        "evidence_level: " + result.maintenance.evidence_level,
        "compatibility: " + result.maintenance.compatibility,
        "classification: " + result.representation + " | " + result.generation + " | " + result.conditioning + " | " + result.decoder
      ].join("\n");
    }

    [modelField.control, sourceField.control, controls.representation, controls.generation, controls.conditioning, controls.decoder].forEach(function (control) {
      control.addEventListener("input", renderClassification);
      control.addEventListener("change", renderClassification);
    });
    append(shell, identity, questionGrid, summary, maintenance, note);
    root.replaceChildren(shell);
    renderClassification();
  }

  function mountOne(root) {
    if (root.getAttribute("data-comfy-lab-mounted") === "true") return;
    var name = root.getAttribute("data-comfy-lab");
    var builder = {
      architecture: mountArchitecture,
      "model-selector": mountModelSelector,
      "aigc-map": mountAigcMap
    }[name];
    if (!builder) return;
    root.setAttribute("data-comfy-lab-mounted", "true");
    try {
      builder(root);
    } catch (error) {
      root.removeAttribute("data-comfy-lab-mounted");
      root.textContent = "互动组件暂时无法加载；请按本节的静态矩阵和维护条目继续核验。";
      if (browserRoot && browserRoot.console && browserRoot.console.error) browserRoot.console.error("Comfy ecosystem lab failed:", name, error);
    }
  }

  function boot(doc) {
    if (!doc) return;
    ensureStyles(doc);
    var roots = doc.querySelectorAll("[data-comfy-lab]");
    for (var i = 0; i < roots.length; i += 1) mountOne(roots[i]);
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }

    var ledger = calculateShapeLedger(1024, 1024, 8, 4);
    assert(ledger.inputSlots === 3145728, "RGB slot count");
    assert(ledger.latentSlots === 65536, "latent slot count");
    assert(ledger.totalRatio === 48, "compression ratio");
    assert(architectureProfile("flux").label === "FLUX", "FLUX profile");
    assert(architectureProfile("missing").label === "SD1.5", "profile fallback");

    var flux = selectModelCandidates({ family: "flux", evidence: "official-template", budget: "16gb-test" });
    assert(flux.length === 1 && flux[0].id === "flux", "selector filters FLUX");
    var all = selectModelCandidates({ family: "any", evidence: "official-both", budget: "no-guarantee" });
    assert(all.length === 4, "selector keeps all evidence-backed families");
    var classified = classifyAigcAnswers({ representation: "geometry", generation: "hybrid", conditioning: "multimodal", decoder: "mesh" });
    assert(classified.representation === "几何 / mesh / 场", "AIGC representation");
    assert(classified.generation === "混合规则", "AIGC generation rule");
    assert(classified.decoder === "mesh / 材质输出", "AIGC decoder");
    assert(classified.maintenance.last_verified === SNAPSHOT_DATE, "snapshot date");

    return { checks: checks };
  }

  return {
    boot: boot,
    mountOne: mountOne,
    architectureProfile: architectureProfile,
    calculateShapeLedger: calculateShapeLedger,
    selectModelCandidates: selectModelCandidates,
    classifyAigcAnswers: classifyAigcAnswers,
    selfTest: selfTest,
    snapshotDate: SNAPSHOT_DATE
  };
});

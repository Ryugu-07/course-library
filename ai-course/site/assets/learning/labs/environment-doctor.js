(function (host) {
  "use strict";

  /*
   * A fictional, deterministic environment diagnosis ledger.
   *
   * The pure model is exported so the browser lab and direct Node self-test use
   * exactly the same evidence.  It deliberately never reads process.env,
   * opens a socket, or prints a credential.  The endpoint names and all
   * diagnostics below are teaching data only.
   */
  var STYLE_ID = "cl-environment-doctor-styles";
  var LAYER_DEFS = [
    { id: "project", label: "项目 / lock 元数据", kind: "repro" },
    { id: "runtime", label: "解释器 / runtime", kind: "repro" },
    { id: "isolation", label: "隔离环境", kind: "repro" },
    { id: "package", label: "包导入", kind: "repro" },
    { id: "accelerator", label: "加速器兼容性", kind: "repro" },
    { id: "endpoint", label: "endpoint / 网络", kind: "repro" },
    { id: "credential", label: "凭据 scope", kind: "security" },
    { id: "secret", label: "secret 泄漏", kind: "security" },
    { id: "smoke", label: "最小 smoke test", kind: "repro" }
  ];

  var LAYER_BY_ID = Object.create(null);
  LAYER_DEFS.forEach(function (layer) { LAYER_BY_ID[layer.id] = layer; });

  function evidence(id, status, detail, action) {
    var layer = LAYER_BY_ID[id];
    return {
      id: id,
      label: layer.label,
      kind: layer.kind,
      status: status,
      detail: detail,
      action: action
    };
  }

  var PRESETS = [
    {
      id: "wrong-interpreter",
      label: "错选 interpreter",
      title: "情境 A · 错选 interpreter",
      prompt: "两个终端都进入了同一项目目录，但其中一个启动的是项目声明之外的解释器。",
      minimalAction: "先按项目元数据选择声明的 interpreter / runtime，再确认其绝对路径和版本，重新运行后续检查。",
      expected: { firstIssue: "runtime", firstIssueStatus: "fail", reproducibility: "REVISE", security: "READY", overall: "REVISE" },
      ledger: [
        evidence("project", "pass", "fictional-lock-01 声明 runtime profile = lab-python；依赖集合有锁定摘要。", "保留这份项目声明，先不要凭系统默认值猜测。"),
        evidence("runtime", "fail", "当前终端选中 system-python；路径与 lock 元数据要求的 lab-python 不一致。", "切换到项目声明的 runtime，并记录路径与版本证据。"),
        evidence("isolation", "not-run", "先暂停：尚未证明正确 runtime 下的隔离边界。", "runtime 修正后再查环境前缀与 site-packages。"),
        evidence("package", "not-run", "未把当前 import 失败归因于包本身；解释器选择仍是更早的证据。", "在正确 runtime 中执行 import 检查。"),
        evidence("accelerator", "not-run", "尚未到硬件后端检查。", "只在包能导入后检查声明的 accelerator。"),
        evidence("endpoint", "not-run", "尚未进行任何网络访问。", "本地层通过后再核对 endpoint 配置。"),
        evidence("credential", "pass", "本情境只审查环境差异；凭据 scope 记录为 fictional-workspace-read。", "维持最小 scope，不把它当作 runtime 修复的替代品。"),
        evidence("secret", "pass", "ledger 只保留“未发现暴露”的结论，不记录任何 credential 值。", "继续避免把秘密写入源码、日志或 shell history。"),
        evidence("smoke", "not-run", "前置 runtime 不一致，最小 smoke test 尚不能比较两个终端。", "修正并重建环境后再跑同一个最小测试。")
      ]
    },
    {
      id: "global-package-ghost",
      label: "global-package ghost dependency",
      title: "情境 B · global-package ghost dependency",
      prompt: "终端甲能 import，终端乙在干净隔离环境中失败；项目文件却没有声明这个包。",
      minimalAction: "把真正需要的依赖写进项目声明并更新 lock；重建隔离环境，再用同一个 smoke test 比较。",
      expected: { firstIssue: "project", firstIssueStatus: "fail", reproducibility: "REVISE", security: "READY", overall: "REVISE" },
      ledger: [
        evidence("project", "fail", "fictional-lock-02 没有声明 ghostkit；它只存在于某个终端的全局包目录。", "补进项目声明并重新生成受审计的 lock 元数据。"),
        evidence("runtime", "pass", "两终端选择的 runtime profile 一致。", "保留 runtime 证据，不要把它误判成根因。"),
        evidence("isolation", "fail", "终端甲的 import 路径越过项目隔离边界；终端乙没有全局 ghostkit。", "让两个终端都使用同一隔离环境，禁止依赖未声明的全局包。"),
        evidence("package", "fail", "终端甲“装过”不等于项目可复现；终端乙在锁定集合中找不到 ghostkit。", "在隔离环境中按 lock 安装并验证 import。"),
        evidence("accelerator", "not-run", "包导入尚未稳定，先不谈 GPU/CPU 后端。", "import 通过后再检查可选后端。"),
        evidence("endpoint", "not-run", "尚未进行任何网络访问。", "依赖层修正后再核对 endpoint。"),
        evidence("credential", "pass", "scope 仅为 fictional-workspace-read，且未参与本地 import。", "把凭据问题与依赖问题分开记录。"),
        evidence("secret", "pass", "没有打印或保存 credential 值。", "继续使用占位符，避免秘密进入 shell history。"),
        evidence("smoke", "not-run", "依赖集合尚未在干净环境中重放。", "重建环境后运行无网络的最小 import smoke test。")
      ]
    },
    {
      id: "accelerator-cpu-fallback",
      label: "缺 accelerator，CPU fallback",
      title: "情境 C · missing accelerator backend with CPU fallback",
      prompt: "项目在一终端找不到可选 accelerator backend，但声明了 CPU fallback；核心小测试仍可运行。",
      minimalAction: "记录 backend 缺失与 CPU fallback 的性能边界；若任务允许 CPU，就继续并把后端选择写入诊断记录。",
      expected: { firstIssue: "accelerator", firstIssueStatus: "fallback", reproducibility: "READY", security: "READY", overall: "READY" },
      ledger: [
        evidence("project", "pass", "fictional-lock-03 声明 accelerator = optional，fallback = cpu。", "保留“可选后端 + fallback”这条明确契约。"),
        evidence("runtime", "pass", "runtime profile 与项目声明一致。", "保持两个终端使用同一 runtime。"),
        evidence("isolation", "pass", "环境前缀与依赖目录都在项目隔离边界内。", "继续保留隔离环境，不用全局安装补洞。"),
        evidence("package", "pass", "核心包可导入；这只说明本地包层通过。", "不要把 import 通过误称为远端 API 健康。"),
        evidence("accelerator", "fallback", "fictional-accelerator 未找到；CPU fallback 可用，GPU 不是本项目的必需条件。", "按 CPU 路径运行，或在需要性能时单独安排后端修复。"),
        evidence("endpoint", "pass", "endpoint 配置只是占位契约；本实验不发起网络请求。", "真实项目中另做 endpoint / 网络检查。"),
        evidence("credential", "pass", "scope 为 fictional-workspace-read，满足本示例的最小权限。", "凭据 scope 仍应与功能需求逐项核对。"),
        evidence("secret", "pass", "没有任何秘密值进入诊断输出。", "继续不把秘密放入代码或 shell history。"),
        evidence("smoke", "pass", "无网络 CPU smoke test 通过；它验证可运行性，不验证 GPU 性能。", "把 smoke 结果与后端性能结论分开保存。")
      ]
    },
    {
      id: "exposed-secret",
      label: "exposed secret",
      title: "情境 D · exposed secret",
      prompt: "功能输出看起来正常，但一次调试把 credential 带进了日志、截图或 shell history。",
      minimalAction: "立即撤销并轮换 fictional credential，清理日志/历史/工件并检查访问范围；不要把秘密值回显来“确认”。",
      expected: { firstIssue: "secret", firstIssueStatus: "fail", reproducibility: "READY", security: "BLOCKED", overall: "BLOCKED" },
      ledger: [
        evidence("project", "pass", "fictional-lock-04 的 runtime 与依赖摘要一致。", "保留可复现证据，但不要让它掩盖安全问题。"),
        evidence("runtime", "pass", "两个终端都选择了项目声明的 runtime profile。", "继续用路径与版本核对，而不是凭提示符判断。"),
        evidence("isolation", "pass", "依赖目录在隔离边界内。", "隔离并不能修复已经泄漏的秘密。"),
        evidence("package", "pass", "包导入通过。", "记住 package import 不是 credential 安全证明。"),
        evidence("accelerator", "pass", "本情境不依赖可选 accelerator。", "GPU 与 secret 处置没有因果关系。"),
        evidence("endpoint", "pass", "fictional endpoint 配置与项目声明一致；实验不访问它。", "endpoint 通过也不抵消 secret 泄漏。"),
        evidence("credential", "pass", "scope 本身是 fictional-workspace-read；范围小不等于泄漏后安全。", "轮换前按已泄漏处理，不要只缩小 scope。"),
        evidence("secret", "fail", "发现 credential 曾进入可见诊断材料；值已被省略，ledger 不回显它。", "撤销、轮换、清理并复核审计记录；绝不把真实秘密粘进命令行。"),
        evidence("smoke", "blocked", "安全门已阻断远端 smoke test；本实验不会为了验证而发送秘密。", "安全处置完成后，用安全注入方式做最小测试。")
      ]
    },
    {
      id: "endpoint-issue",
      label: "endpoint issue",
      title: "情境 E · endpoint issue",
      prompt: "包能导入，甚至安装步骤也通过；但最小远端调用在一个终端失败。",
      minimalAction: "先核对项目声明的 endpoint、代理/网络路径和凭据 scope；用不含秘密的最小请求重试，不要继续安装包碰运气。",
      expected: { firstIssue: "endpoint", firstIssueStatus: "fail", reproducibility: "REVISE", security: "READY", overall: "REVISE" },
      ledger: [
        evidence("project", "pass", "fictional-lock-05 锁定了依赖和 endpoint profile。", "以项目声明为基准逐项比较两个终端。"),
        evidence("runtime", "pass", "解释器 / runtime 选择一致。", "不要因远端失败而重装解释器。"),
        evidence("isolation", "pass", "两终端的隔离前缀一致。", "保留本地环境证据。"),
        evidence("package", "pass", "包安装与 import 都通过；这不代表 API endpoint 可达或协议正确。", "把本地包证据与远端 smoke 证据分开。"),
        evidence("accelerator", "pass", "请求路径不要求 GPU；accelerator 不是当前故障层。", "不要用 GPU 状态解释网络错误。"),
        evidence("endpoint", "fail", "终端乙解析到 fictional-endpoint.invalid；项目声明要求的 endpoint profile 未被采用。", "修正 endpoint / 网络配置，再运行最小 smoke test；本实验不访问该域名。"),
        evidence("credential", "pass", "scope 为 fictional-workspace-read；没有证据表明权限是本次根因。", "修复 endpoint 后仍要按 scope 复核。"),
        evidence("secret", "pass", "诊断从未回显 credential。", "保持秘密不进 shell history、日志或截图。"),
        evidence("smoke", "fail", "安装并 import 通过，但最小远端 smoke test 失败；这是 API 层的独立证据。", "endpoint 修正后重试同一无回显 smoke test。")
      ]
    },
    {
      id: "healthy-locked",
      label: "healthy locked environment",
      title: "情境 F · healthy locked environment",
      prompt: "两个终端都使用同一 lock、同一隔离环境约束；本地与最小 smoke 证据一致。",
      minimalAction: "保存 evidence ledger 与 lock 摘要；后续改变 runtime、依赖、后端或 endpoint 时重新运行这组检查。",
      expected: { firstIssue: null, firstIssueStatus: null, reproducibility: "READY", security: "READY", overall: "READY" },
      ledger: [
        evidence("project", "pass", "fictional-lock-06 的依赖、runtime、endpoint profile 均有明确声明。", "把 lock 摘要作为可复现证据保存。"),
        evidence("runtime", "pass", "两个终端的 interpreter / runtime 路径与声明一致。", "用机器可读记录保持比较可重复。"),
        evidence("isolation", "pass", "没有依赖全局 site-packages；项目隔离边界一致。", "避免日后从全局环境悄悄补包。"),
        evidence("package", "pass", "lock 集合中的包可导入。", "把 import 通过与 API smoke 通过分别记录。"),
        evidence("accelerator", "pass", "使用声明的 CPU 路径；GPU 不在项目必需条件中。", "性能需求变化时再审查可选 backend。"),
        evidence("endpoint", "pass", "endpoint profile 与项目声明一致；浏览器实验不发起请求。", "真实运行时按组织网络规则检查可达性。"),
        evidence("credential", "pass", "fictional-workspace-read scope 与最小测试需求匹配。", "保持最小权限与独立轮换流程。"),
        evidence("secret", "pass", "没有秘密值出现在代码、日志、截图或 shell history。", "继续只使用安全的 secret 注入方式。"),
        evidence("smoke", "pass", "同一无网络本地 smoke 断言在两个终端得到一致结果。", "环境 READY，但每次变更仍应重新诊断。")
      ]
    }
  ];

  var PRESETS_BY_ID = Object.create(null);
  PRESETS.forEach(function (preset) { PRESETS_BY_ID[preset.id] = preset; });

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getPreset(input) {
    var id = typeof input === "string" ? input : input && input.id;
    var preset = PRESETS_BY_ID[id];
    if (!preset) throw new Error("未知环境情境: " + id);
    return preset;
  }

  function firstIssue(ledger) {
    var issue = null;
    ledger.some(function (entry) {
      if (entry.status === "fail" || entry.status === "fallback") {
        issue = entry;
        return true;
      }
      return false;
    });
    return issue;
  }

  function hasFailure(ledger, kind) {
    return ledger.some(function (entry) {
      return entry.kind === kind && entry.status === "fail";
    });
  }

  function diagnose(input) {
    var preset = getPreset(input);
    var ledger = clone(preset.ledger);
    var issue = firstIssue(ledger);
    var reproducibilityStatus = hasFailure(ledger, "repro") ? "REVISE" : "READY";
    var securityStatus = hasFailure(ledger, "security") ? "BLOCKED" : "READY";
    var overallStatus = securityStatus === "BLOCKED" ? "BLOCKED" : reproducibilityStatus;
    var blocking = ledger.filter(function (entry) { return entry.status === "fail"; })[0] || null;
    return {
      id: preset.id,
      label: preset.label,
      title: preset.title,
      prompt: preset.prompt,
      ledger: ledger,
      firstIssueLayer: issue ? issue.id : null,
      firstIssueStatus: issue ? issue.status : null,
      firstBlockingLayer: blocking ? blocking.id : null,
      reproducibilityStatus: reproducibilityStatus,
      securityStatus: securityStatus,
      overallStatus: overallStatus,
      minimalAction: preset.minimalAction,
      expected: clone(preset.expected)
    };
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }

    check(PRESETS.length === 6, "six fictional presets");
    check(LAYER_DEFS.length === 9, "nine ordered diagnostic layers");
    check(LAYER_DEFS.map(function (layer) { return layer.id; }).join(",") === "project,runtime,isolation,package,accelerator,endpoint,credential,secret,smoke", "layer order");
    PRESETS.forEach(function (preset) {
      var result = diagnose(preset.id);
      var expected = preset.expected;
      check(result.ledger.length === LAYER_DEFS.length, preset.id + " complete ledger");
      check(result.ledger.every(function (entry, index) { return entry.id === LAYER_DEFS[index].id; }), preset.id + " ordered ledger");
      check(result.firstIssueLayer === expected.firstIssue, preset.id + " first issue");
      check(result.firstIssueStatus === expected.firstIssueStatus, preset.id + " issue status");
      check(result.reproducibilityStatus === expected.reproducibility, preset.id + " reproducibility");
      check(result.securityStatus === expected.security, preset.id + " security");
      check(result.overallStatus === expected.overall, preset.id + " overall status");
    });

    var fallback = diagnose("accelerator-cpu-fallback");
    check(fallback.firstIssueLayer === "accelerator" && fallback.firstIssueStatus === "fallback", "CPU fallback is the first non-blocking issue");
    check(fallback.reproducibilityStatus === "READY", "CPU fallback remains reproducibility-ready");
    check(fallback.ledger[3].status === "pass" && fallback.ledger[8].status === "pass", "package and smoke are separate passing checks");

    var endpoint = diagnose("endpoint-issue");
    check(endpoint.ledger[3].status === "pass" && endpoint.ledger[5].status === "fail", "package pass does not imply endpoint pass");
    check(endpoint.ledger[8].status === "fail", "endpoint issue reaches smoke evidence");

    var exposed = diagnose("exposed-secret");
    check(exposed.reproducibilityStatus === "READY" && exposed.securityStatus === "BLOCKED", "security is separate from reproducibility");
    check(exposed.ledger[7].detail.indexOf("已被省略") !== -1, "secret value is never echoed");

    var again = diagnose("healthy-locked");
    again.ledger[0].status = "fail";
    check(diagnose("healthy-locked").ledger[0].status === "pass", "diagnosis returns a fresh ledger");
    return { checks: checks, presets: PRESETS.length, layers: LAYER_DEFS.length };
  }

  var STYLE_TEXT = [
    ".ed-lab { --ed-panel: var(--block-bg, #f4f1e9); --ed-border: var(--border, #d7d0c2); --ed-muted: var(--fg-soft, #6b6557); --ed-accent: var(--accent, #315f9d); --ed-good: #39734d; --ed-warn: #9b6a12; --ed-bad: #b64335; min-width: 0; padding: 0; border: 0; background: transparent; color: var(--fg); color-scheme: light dark; line-height: 1.5; }",
    "html[data-theme=dark] .ed-lab { --ed-panel: #222833; --ed-border: #4b5565; --ed-muted: #b7bec9; --ed-good: #82d49e; --ed-warn: #e0c173; --ed-bad: #f08d83; }",
    "@media (prefers-color-scheme: dark) { html:not([data-theme=light]) .ed-lab { --ed-panel: #222833; --ed-border: #4b5565; --ed-muted: #b7bec9; --ed-good: #82d49e; --ed-warn: #e0c173; --ed-bad: #f08d83; } }",
    ".ed-lab *, .ed-lab *::before, .ed-lab *::after { box-sizing: border-box; }",
    ".ed-lab [hidden] { display: none !important; }",
    ".ed-lab .ed-shell { overflow: hidden; border: 1px solid var(--ed-border); border-radius: 8px; background: var(--bg); }",
    ".ed-lab .ed-header, .ed-lab .ed-panel { padding: 1rem 1.1rem; }",
    ".ed-lab .ed-header { border-bottom: 1px solid var(--ed-border); background: var(--ed-panel); }",
    ".ed-lab .ed-kicker { margin: 0 0 .25rem; color: var(--ed-accent); font-size: .75rem; font-weight: 800; letter-spacing: 0; text-transform: uppercase; }",
    ".ed-lab h3, .ed-lab h4 { margin: 0; color: var(--fg); }",
    ".ed-lab .ed-header h3 { font-size: 1.15rem; }",
    ".ed-lab .ed-header p, .ed-lab .ed-note { margin: .45rem 0 0; color: var(--ed-muted); }",
    ".ed-lab .ed-presets { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .55rem; margin-top: .85rem; }",
    ".ed-lab .ed-prediction { border-top: 1px solid var(--ed-border); }",
    ".ed-lab .ed-prediction-grid { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(230px, .75fr); gap: 1rem; align-items: start; }",
    ".ed-lab .ed-choice-block { min-width: 0; }",
    ".ed-lab .ed-choice-block + .ed-choice-block { margin-top: .9rem; }",
    ".ed-lab .ed-choice-block h4 { margin-bottom: .45rem; font-size: .9rem; }",
    ".ed-lab .ed-choice-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .45rem; }",
    ".ed-lab .ed-status-choice-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .45rem; }",
    ".ed-lab button, .ed-lab select { min-width: 0; min-height: 44px; border: 1px solid var(--ed-border); border-radius: 6px; background: var(--bg); color: var(--fg); font: inherit; }",
    ".ed-lab button { padding: .5rem .65rem; cursor: pointer; font-size: .8rem; font-weight: 700; line-height: 1.25; overflow-wrap: anywhere; }",
    ".ed-lab button:hover { border-color: var(--ed-accent); }",
    ".ed-lab button[aria-pressed=true], .ed-lab button.ed-primary { border-color: var(--ed-accent); background: var(--ed-accent); color: var(--bg); }",
    ".ed-lab button:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
    ".ed-lab .ed-actions { display: flex; flex-wrap: wrap; gap: .55rem; margin-top: 1rem; }",
    ".ed-lab .ed-actions button { flex: 1 1 180px; }",
    ".ed-lab .ed-feedback { min-height: 1.5em; margin: .65rem 0 0; color: var(--ed-muted); font-size: .82rem; }",
    ".ed-lab .ed-feedback.ed-warn { color: var(--ed-warn); }",
    ".ed-lab .ed-feedback.ed-good { color: var(--ed-good); }",
    ".ed-lab .ed-result { border-top: 1px solid var(--ed-border); }",
    ".ed-lab .ed-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .55rem; margin: .8rem 0; }",
    ".ed-lab .ed-card { min-width: 0; padding: .65rem .7rem; border-top: 2px solid var(--ed-border); background: var(--ed-panel); }",
    ".ed-lab .ed-card[data-status=READY] { border-top-color: var(--ed-good); }",
    ".ed-lab .ed-card[data-status=REVISE] { border-top-color: var(--ed-warn); }",
    ".ed-lab .ed-card[data-status=BLOCKED] { border-top-color: var(--ed-bad); }",
    ".ed-lab .ed-card span { display: block; color: var(--ed-muted); font-size: .72rem; }",
    ".ed-lab .ed-card strong { display: block; margin-top: .15rem; font-size: 1rem; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }",
    ".ed-lab .ed-issue, .ed-lab .ed-action { margin: .75rem 0 0; padding: .65rem .75rem; border-left: 3px solid var(--ed-accent); background: var(--ed-panel); color: var(--ed-muted); font-size: .82rem; }",
    ".ed-lab .ed-issue strong, .ed-lab .ed-action strong { color: var(--fg); }",
    ".ed-lab .ed-table-wrap { max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; border: 1px solid var(--ed-border); border-radius: 6px; }",
    ".ed-lab table { width: 100%; min-width: 720px; border-collapse: collapse; font-size: .76rem; font-variant-numeric: tabular-nums; }",
    ".ed-lab th, .ed-lab td { padding: .45rem .5rem; border-bottom: 1px solid var(--ed-border); text-align: left; vertical-align: top; }",
    ".ed-lab th { color: var(--ed-muted); font-weight: 750; white-space: nowrap; }",
    ".ed-lab tr:last-child td { border-bottom: 0; }",
    ".ed-lab .ed-badge { display: inline-block; padding: .12rem .35rem; border: 1px solid currentColor; border-radius: 4px; font-size: .7rem; line-height: 1.35; white-space: nowrap; }",
    ".ed-lab .ed-badge[data-status=pass] { color: var(--ed-good); }",
    ".ed-lab .ed-badge[data-status=fallback] { color: var(--ed-warn); }",
    ".ed-lab .ed-badge[data-status=fail], .ed-lab .ed-badge[data-status=blocked] { color: var(--ed-bad); }",
    ".ed-lab .ed-badge[data-status=not-run] { color: var(--ed-muted); }",
    ".ed-lab .ed-foot { margin: .75rem 0 0; color: var(--ed-muted); font-size: .76rem; }",
    "@media (max-width: 760px) { .ed-lab .ed-presets { grid-template-columns: repeat(2, minmax(0, 1fr)); } .ed-lab .ed-prediction-grid { grid-template-columns: 1fr; } }",
    "@media (max-width: 520px) { .ed-lab .ed-header, .ed-lab .ed-panel { padding: .8rem .75rem; } .ed-lab .ed-presets, .ed-lab .ed-choice-grid, .ed-lab .ed-status-choice-grid, .ed-lab .ed-summary { grid-template-columns: 1fr; } .ed-lab .ed-actions { display: grid; } .ed-lab .ed-actions button { width: 100%; } }",
    "@media (prefers-reduced-motion: reduce) { .ed-lab *, .ed-lab *::before, .ed-lab *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }"
  ].join("\n");

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function appendChildren(node, children) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
    });
    return node;
  }

  function make(api, doc, tag, attrs, children) {
    if (api && typeof api.el === "function") return api.el(tag, attrs || {}, children);
    return appendChildren(setAttributes(doc.createElement(tag), attrs || {}), children);
  }

  function installStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement).appendChild(style);
  }

  function statusLabel(status) {
    if (status === "pass") return "通过";
    if (status === "fallback") return "CPU fallback（非阻断）";
    if (status === "fail") return "失败";
    if (status === "blocked") return "安全阻断";
    return "未执行";
  }

  function resultStatusText(status) {
    return status;
  }

  function layerLabel(id) {
    return id && LAYER_BY_ID[id] ? LAYER_BY_ID[id].label : "全部层通过";
  }

  function statusBadge(api, doc, entry) {
    return make(api, doc, "span", { className: "ed-badge", "data-status": entry.status, text: statusLabel(entry.status) });
  }

  function buildLedger(api, doc, result) {
    var table = make(api, doc, "table", {});
    table.appendChild(make(api, doc, "caption", { className: "cl-sr-only", text: "按顺序展开的环境证据 ledger" }));
    var head = make(api, doc, "thead", {});
    var headRow = make(api, doc, "tr", {});
    ["顺序", "诊断层", "证据（fictional）", "判定", "最小动作"].forEach(function (label) {
      headRow.appendChild(make(api, doc, "th", { scope: "col", text: label }));
    });
    head.appendChild(headRow);
    table.appendChild(head);
    var body = make(api, doc, "tbody", {});
    result.ledger.forEach(function (entry, index) {
      var row = make(api, doc, "tr", {});
      row.appendChild(make(api, doc, "td", { text: String(index + 1) }));
      row.appendChild(make(api, doc, "th", { scope: "row", text: entry.label }));
      row.appendChild(make(api, doc, "td", { text: entry.detail }));
      var verdict = make(api, doc, "td", {});
      verdict.appendChild(statusBadge(api, doc, entry));
      row.appendChild(verdict);
      row.appendChild(make(api, doc, "td", { text: entry.action }));
      body.appendChild(row);
    });
    table.appendChild(body);
    return make(api, doc, "div", { className: "ed-table-wrap" }, [table]);
  }

  function buildResult(api, doc, result) {
    var issueText = result.firstIssueLayer === null
      ? "没有需修订或阻断的层；按顺序的证据全部通过。"
      : layerLabel(result.firstIssueLayer) + " · " + statusLabel(result.firstIssueStatus) +
        (result.firstIssueStatus === "fallback" ? "。它是可接受的 fallback，不等于 GPU 必须存在。" : "。先处理这里，再解释后续现象。");
    var summary = make(api, doc, "div", { className: "ed-summary" }, [
      make(api, doc, "div", { className: "ed-card", "data-status": result.reproducibilityStatus }, [
        make(api, doc, "span", { text: "可复现性 / reproducibility" }),
        make(api, doc, "strong", { text: resultStatusText(result.reproducibilityStatus) })
      ]),
      make(api, doc, "div", { className: "ed-card", "data-status": result.securityStatus }, [
        make(api, doc, "span", { text: "安全门 / security" }),
        make(api, doc, "strong", { text: resultStatusText(result.securityStatus) })
      ]),
      make(api, doc, "div", { className: "ed-card", "data-status": result.overallStatus }, [
        make(api, doc, "span", { text: "当前结论" }),
        make(api, doc, "strong", { text: resultStatusText(result.overallStatus) })
      ])
    ]);
    return [
      make(api, doc, "h4", { text: "Reveal：ordered evidence ledger" }),
      summary,
      make(api, doc, "p", { className: "ed-issue", text: "首个需要解释的层：" + issueText }),
      make(api, doc, "p", { className: "ed-action" }, [
        make(api, doc, "strong", { text: "最小动作：" }),
        " " + result.minimalAction
      ]),
      buildLedger(api, doc, result),
      make(api, doc, "p", { className: "ed-foot", text: "注意：package import 通过不等于 endpoint/API 通过；GPU 不是默认必需条件。安全 BLOCKED 与可复现性 READY 可以同时出现，必须分别处置。" })
    ];
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.classList.add("ed-lab");
    var state = {
      presetId: PRESETS[0].id,
      predictedLayer: null,
      predictedReproducibility: null,
      predictedSecurity: null,
      revealed: false,
      feedback: "先选定 failing layer、可复现性和安全门，再点击“核对预测”。"
    };
    var shell = make(api, doc, "div", { className: "ed-shell" });
    var header = make(api, doc, "div", { className: "ed-header" }, [
      make(api, doc, "p", { className: "ed-kicker", text: "CourseLearning · environment-doctor" }),
      make(api, doc, "h3", { text: "works in one terminal, fails in another" }),
      make(api, doc, "p", { text: "纯虚构的本地诊断题：先预测最早证据层，安全与可复现性分开判定。实验不会联网，也不会读取或回显任何真实 secret。" })
    ]);
    var presetRow = make(api, doc, "div", { className: "ed-presets", role: "group", "aria-label": "选择虚构情境" });
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = make(api, doc, "button", { type: "button", text: preset.label });
      button.addEventListener("click", function () {
        state.presetId = preset.id;
        state.predictedLayer = null;
        state.predictedReproducibility = null;
        state.predictedSecurity = null;
        state.revealed = false;
        state.feedback = "先选定 failing layer、可复现性和安全门，再点击“核对预测”。";
        render();
      });
      presetButtons.push({ id: preset.id, node: button });
      presetRow.appendChild(button);
    });
    header.appendChild(presetRow);
    shell.appendChild(header);

    var prompt = make(api, doc, "p", { className: "ed-note" });
    var predictionPanel = make(api, doc, "div", { className: "ed-panel ed-prediction" });
    var predictionGrid = make(api, doc, "div", { className: "ed-prediction-grid" });
    var layerChoice = make(api, doc, "div", { className: "ed-choice-block" }, [make(api, doc, "h4", { text: "1 · 先预测：哪个层最先需要解释？" })]);
    var layerGrid = make(api, doc, "div", { className: "ed-choice-grid", role: "group", "aria-label": "预测诊断层" });
    var layerChoices = [{ id: "none", label: "全部层通过" }].concat(LAYER_DEFS.map(function (layer) { return { id: layer.id, label: layer.label }; }));
    var layerButtons = [];
    layerChoices.forEach(function (choice) {
      var button = make(api, doc, "button", { type: "button", text: choice.label });
      button.addEventListener("click", function () { state.predictedLayer = choice.id; render(); });
      layerButtons.push({ id: choice.id, node: button });
      layerGrid.appendChild(button);
    });
    layerChoice.appendChild(layerGrid);
    var statusChoice = make(api, doc, "div", { className: "ed-choice-block" }, [make(api, doc, "h4", { text: "2 · 预测可复现性与安全门" })]);
    var reproTitle = make(api, doc, "p", { className: "ed-note", text: "可复现性：" });
    var reproGrid = make(api, doc, "div", { className: "ed-status-choice-grid", role: "group", "aria-label": "预测可复现性" });
    var reproButtons = [];
    ["READY", "REVISE"].forEach(function (status) {
      var button = make(api, doc, "button", { type: "button", text: status });
      button.addEventListener("click", function () { state.predictedReproducibility = status; render(); });
      reproButtons.push({ id: status, node: button });
      reproGrid.appendChild(button);
    });
    var securityTitle = make(api, doc, "p", { className: "ed-note", text: "安全门：" });
    var securityGrid = make(api, doc, "div", { className: "ed-status-choice-grid", role: "group", "aria-label": "预测安全门" });
    var securityButtons = [];
    ["READY", "BLOCKED"].forEach(function (status) {
      var button = make(api, doc, "button", { type: "button", text: status });
      button.addEventListener("click", function () { state.predictedSecurity = status; render(); });
      securityButtons.push({ id: status, node: button });
      securityGrid.appendChild(button);
    });
    statusChoice.appendChild(reproTitle);
    statusChoice.appendChild(reproGrid);
    statusChoice.appendChild(securityTitle);
    statusChoice.appendChild(securityGrid);
    predictionGrid.appendChild(layerChoice);
    predictionGrid.appendChild(statusChoice);
    predictionPanel.appendChild(predictionGrid);
    var actions = make(api, doc, "div", { className: "ed-actions" });
    var checkButton = make(api, doc, "button", { type: "button", className: "ed-primary", text: "核对预测并揭晓" });
    var resetButton = make(api, doc, "button", { type: "button", text: "重置本情境" });
    var feedback = make(api, doc, "p", { className: "ed-feedback", role: "status", "aria-live": "polite" });
    checkButton.addEventListener("click", function () {
      if (state.predictedLayer === null || state.predictedReproducibility === null || state.predictedSecurity === null) {
        state.feedback = "请先完成 1 个 failing layer、1 个可复现性状态和 1 个安全门状态。";
        state.revealed = false;
        render();
        if (api && api.announce) api.announce(root, state.feedback);
        return;
      }
      var result = diagnose(state.presetId);
      var correctLayer = (result.firstIssueLayer === null && state.predictedLayer === "none") || state.predictedLayer === result.firstIssueLayer;
      var correct = correctLayer && state.predictedReproducibility === result.reproducibilityStatus && state.predictedSecurity === result.securityStatus;
      state.revealed = true;
      state.feedback = (correct ? "预测命中。" : "已打开证据；逐行检查首个 issue 与两个独立状态。") +
        " 可复现性 " + result.reproducibilityStatus + "，安全门 " + result.securityStatus + "。";
      render();
      if (api && api.announce) api.announce(root, state.feedback);
    });
    resetButton.addEventListener("click", function () {
      state.predictedLayer = null;
      state.predictedReproducibility = null;
      state.predictedSecurity = null;
      state.revealed = false;
      state.feedback = "先选定 failing layer、可复现性和安全门，再点击“核对预测”。";
      render();
    });
    actions.appendChild(checkButton);
    actions.appendChild(resetButton);
    predictionPanel.appendChild(actions);
    predictionPanel.appendChild(feedback);
    shell.appendChild(predictionPanel);

    var resultPanel = make(api, doc, "div", { className: "ed-panel ed-result" });
    shell.appendChild(resultPanel);
    root.replaceChildren(shell);

    function render() {
      var preset = getPreset(state.presetId);
      prompt.textContent = "当前题面：" + preset.prompt;
      presetButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", item.id === state.presetId ? "true" : "false"); });
      layerButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", item.id === state.predictedLayer ? "true" : "false"); });
      reproButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", item.id === state.predictedReproducibility ? "true" : "false"); });
      securityButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", item.id === state.predictedSecurity ? "true" : "false"); });
      feedback.textContent = state.feedback;
      feedback.className = "ed-feedback" + (state.revealed ? " ed-good" : "");
      resultPanel.hidden = !state.revealed;
      if (state.revealed) resultPanel.replaceChildren.apply(resultPanel, buildResult(api, doc, diagnose(state.presetId)));
    }

    header.appendChild(prompt);
    render();
  }

  var exported = {
    LAYER_DEFS: LAYER_DEFS,
    PRESETS: PRESETS,
    diagnose: diagnose,
    selfTest: selfTest
  };

  if (typeof module !== "undefined" && module.exports) module.exports = exported;

  if (host && host.CourseLearning && typeof host.CourseLearning.register === "function") {
    host.CourseLearning.register("environment-doctor", mount);
  }

  if (typeof module !== "undefined" && module.exports && typeof require !== "undefined" && require.main === module) {
    try {
      var report = selfTest();
      console.log("environment-doctor self-test: PASS (" + report.checks + " checks, " + report.presets + " presets, " + report.layers + " layers)");
    } catch (error) {
      console.error("environment-doctor self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null);

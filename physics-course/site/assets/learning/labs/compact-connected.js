(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("compact-connected", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("compact-connected self-test: PASS (" + report.checks + " checks, " + report.models + " space models)");
    } catch (error) {
      console.error("compact-connected self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "compact-connected-lab-styles";
  var INSTANCE = 0;

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  var MODELS = [
    {
      id: "closed-interval",
      label: "[0,1]：闭区间",
      metric: true,
      compact: true,
      sequential: true,
      connected: true,
      pathConnected: true,
      coverCertificate: "Heine–Borel：R 中闭且有界",
      sequenceCertificate: "度量空间紧致与序列紧致等价",
      pathCertificate: "直线段 t -> (1-t)a+tb",
      imageCertificate: "连续像紧致；例如 t^2([0,1])=[0,1]"
    },
    {
      id: "open-interval",
      label: "(0,1)：开区间",
      metric: true,
      compact: false,
      sequential: false,
      connected: true,
      pathConnected: true,
      coverCertificate: "U_n=(1/n,1) 覆盖但任意有限子族漏掉一段",
      sequenceCertificate: "序列 1/n 在空间外的 0 处才有极限",
      pathCertificate: "仍是区间，任两点可用线段连接",
      imageCertificate: "非紧源不触发连续像定理；1/t 的像为 (1,∞)"
    },
    {
      id: "sine-closure",
      label: "闭正弦曲线",
      metric: true,
      compact: true,
      sequential: true,
      connected: true,
      pathConnected: false,
      coverCertificate: "R^2 中闭且有界，Heine–Borel",
      sequenceCertificate: "度量紧致，所以序列紧致",
      pathCertificate: "连通但不能从竖直段任一点沿路径到达振荡图像",
      imageCertificate: "投影等连续像仍紧致；连通像仍连通"
    },
    {
      id: "rational-subspace",
      label: "Q∩[0,1]：有理数子空间",
      metric: true,
      compact: false,
      sequential: false,
      connected: false,
      pathConnected: false,
      coverCertificate: "在 R 中不是闭集，故不是紧致",
      sequenceCertificate: "有理序列可逼近无理数，极限不在空间内",
      pathCertificate: "Q 的连通子集只有单点",
      imageCertificate: "连续像可能特殊变紧；恒等像仍非紧"
    },
    {
      id: "omega-one",
      label: "[0,ω1)：序数空间",
      metric: false,
      compact: false,
      sequential: true,
      connected: false,
      pathConnected: false,
      coverCertificate: "存在无有限子覆盖的序数开覆盖",
      sequenceCertificate: "每个序列落在某个可数初段，可抽收敛子列",
      pathCertificate: "序数空间有孤立后继点，不连通",
      imageCertificate: "非开覆盖紧致，不能直接套连续像紧致定理"
    }
  ];

  function modelById(id) {
    for (var index = 0; index < MODELS.length; index += 1) {
      if (MODELS[index].id === id) return MODELS[index];
    }
    return MODELS[0];
  }

  function imageReport(model, mapId) {
    if (mapId === "reciprocal" && model.id === "open-interval") {
      return {
        known: true,
        compact: false,
        text: "f(t)=1/t 的像是 (1,∞)，不紧；这是非紧源的反例演示。"
      };
    }
    if (mapId === "reciprocal") {
      return {
        known: false,
        compact: null,
        text: "1/t 只在 (0,1) 模型上作为连续像边界演示；当前模型不使用这张实值映射。"
      };
    }
    if (model.id === "open-interval") {
      return {
        known: true,
        compact: false,
        text: "取 f(t)=t^2，像是 (0,1)，仍非紧；非紧源不触发连续像紧致定理。"
      };
    }
    if (model.compact && model.id !== "omega-one") {
      return {
        known: true,
        compact: true,
        text: model.id === "sine-closure"
          ? "取横坐标投影：连续像是 [0,1]，保持紧致与连通。"
          : "取 f(t)=t^2：连续像是紧集，最值存在。"
      };
    }
    return {
      known: false,
      compact: null,
      text: "源空间不满足开覆盖紧致，连续像定理在这里不提供紧致结论；不能把未触发当成否定。"
    };
  }

  var STYLE_TEXT = [
    ".ccc-lab{--ccc-blue:var(--accent,#315f9d);--ccc-gold:var(--cl-gold,#9b6a12);--ccc-green:var(--cl-green,#39734d);--ccc-red:var(--cl-red,#b64335);--ccc-muted:var(--fg-soft,#6b6557);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".ccc-lab *,.ccc-lab *::before,.ccc-lab *::after{box-sizing:border-box}.ccc-lab [hidden]{display:none!important}",
    ".ccc-lab h3,.ccc-lab h4{margin:0;color:var(--fg);letter-spacing:0}.ccc-lab h3{font-size:1.18rem}.ccc-lab h4{font-size:1rem}.ccc-lab p{margin:7px 0}.ccc-lab .ccc-note,.ccc-lab .ccc-feedback{color:var(--ccc-muted);font-size:13px;line-height:1.7}",
    ".ccc-lab .ccc-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0}.ccc-lab .ccc-field{display:grid;gap:5px;min-width:0}.ccc-lab .ccc-field label{color:var(--ccc-muted);font-size:12.5px;font-weight:750}.ccc-lab select{width:100%;min-height:44px;padding:7px 9px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35}.ccc-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;font:inherit;line-height:1.35;overflow-wrap:anywhere}.ccc-lab button:hover{border-color:var(--ccc-blue)}.ccc-lab button:focus-visible,.ccc-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.ccc-lab button[aria-pressed=true],.ccc-lab .ccc-primary{border-color:var(--ccc-blue);background:var(--ccc-blue);color:var(--bg);font-weight:750}",
    ".ccc-lab .ccc-gate{margin:14px 0;padding:12px;border-left:3px solid var(--ccc-gold);background:var(--block-bg,var(--bg))}.ccc-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border);background:var(--bg)}.ccc-lab legend{max-width:100%;padding:0 3px;color:var(--fg);font-size:13px;font-weight:700;line-height:1.5}.ccc-lab .ccc-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.ccc-lab .ccc-options button{font-size:12px}.ccc-lab .ccc-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.ccc-lab .ccc-actions>*{flex:1 1 180px}.ccc-lab .ccc-feedback{min-height:1.7em;margin-top:9px;font-weight:700}.ccc-lab .ccc-pass{color:var(--ccc-green)}.ccc-lab .ccc-warn{color:var(--ccc-red)}",
    ".ccc-lab .ccc-result{display:grid;gap:12px;margin-top:15px}.ccc-lab .ccc-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px}.ccc-lab .ccc-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.ccc-lab .ccc-metric:nth-child(3n+1){border-color:var(--ccc-blue)}.ccc-lab .ccc-metric:nth-child(3n+2){border-color:var(--ccc-gold)}.ccc-lab .ccc-metric:nth-child(3n){border-color:var(--ccc-green)}.ccc-lab .ccc-metric span{display:block;color:var(--ccc-muted);font-size:11px}.ccc-lab .ccc-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".ccc-lab .ccc-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch}.ccc-lab .ccc-svg{display:block;width:100%;min-width:620px;height:auto;color:var(--fg)}.ccc-lab .ccc-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.ccc-lab .ccc-line{fill:none;stroke:var(--ccc-blue);stroke-width:4}.ccc-lab .ccc-dash{fill:none;stroke:var(--ccc-red);stroke-width:2;stroke-dasharray:6 5}.ccc-lab .ccc-point{fill:var(--ccc-green);stroke:var(--bg);stroke-width:3}.ccc-lab .ccc-hole{fill:var(--bg);stroke:var(--ccc-red);stroke-width:3}.ccc-lab .ccc-dot{fill:var(--ccc-blue)}.ccc-lab .ccc-ordinal{fill:var(--ccc-gold);stroke:var(--ccc-gold)}.ccc-lab .ccc-label{font-size:12px;text-anchor:middle}.ccc-lab .ccc-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.ccc-lab table{width:100%;min-width:700px;border-collapse:collapse;font-size:12px}.ccc-lab caption{padding:0 0 7px;text-align:left;color:var(--ccc-muted);font-size:12px;font-weight:700}.ccc-lab th,.ccc-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.ccc-lab th{color:var(--ccc-muted);font-size:11px}.ccc-lab .ccc-certificate{padding:10px 12px;border-left:3px solid var(--ccc-green);background:var(--block-bg,var(--bg));font-size:13px;line-height:1.7}.ccc-lab .ccc-certificate.ccc-fail{border-left-color:var(--ccc-red)}",
    "@media(max-width:700px){.ccc-lab .ccc-controls{grid-template-columns:minmax(0,1fr)}.ccc-lab .ccc-options{grid-template-columns:minmax(0,1fr)}.ccc-lab .ccc-frame{padding:5px}.ccc-lab table{font-size:11.5px}}@media(prefers-reduced-motion:reduce){.ccc-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function setAttributes(node, attributes) {
    Object.keys(attributes || {}).forEach(function (key) {
      var value = attributes[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function appendChildren(node, children, doc) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function element(doc, tag, attributes, children) {
    return appendChildren(setAttributes(doc.createElement(tag), attributes), children, doc);
  }

  function svgElement(doc, tag, attributes, children) {
    return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attributes), children, doc);
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function installStyles(doc) {
    if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement || doc.body).appendChild(style);
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function renderModelSvg(doc, svg, model, uid) {
    clear(svg);
    svg.setAttribute("viewBox", "0 0 720 300");
    svg.appendChild(svgElement(doc, "title", { id: uid + "-title", text: model.label + " 的紧致与连通示意" }));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-desc", text: "图形只提供直觉，精确结论在下方证书表中。" }));
    svg.appendChild(svgElement(doc, "text", { x: "360", y: "22", className: "ccc-label", text: model.label }));
    if (model.id === "closed-interval" || model.id === "open-interval") {
      svg.appendChild(svgElement(doc, "line", { x1: "90", y1: "145", x2: "610", y2: "145", className: "ccc-line" }));
      var leftClass = model.id === "closed-interval" ? "ccc-point" : "ccc-hole";
      var rightClass = leftClass;
      svg.appendChild(svgElement(doc, "circle", { cx: "90", cy: "145", r: "10", className: leftClass }));
      svg.appendChild(svgElement(doc, "circle", { cx: "610", cy: "145", r: "10", className: rightClass }));
      svg.appendChild(svgElement(doc, "text", { x: "90", y: "180", className: "ccc-label", text: model.id === "closed-interval" ? "0, included" : "0, missing" }));
      svg.appendChild(svgElement(doc, "text", { x: "610", y: "180", className: "ccc-label", text: model.id === "closed-interval" ? "1, included" : "1, missing" }));
      if (model.id === "open-interval") {
        svg.appendChild(svgElement(doc, "path", { d: "M130 225 C220 205 290 205 370 225 S520 245 590 225", className: "ccc-dash" }));
        svg.appendChild(svgElement(doc, "text", { x: "360", y: "260", className: "ccc-label", text: "U_n=(1/n,1) 的开覆盖不会有限收束" }));
      }
      return;
    }
    if (model.id === "sine-closure") {
      var points = [];
      for (var index = 0; index <= 80; index += 1) {
        var x = 160 + (index / 80) * 400;
        var t = 0.08 + (index / 80) * 0.84;
        var y = 145 - 76 * Math.sin(1 / t * 6);
        points.push(x.toFixed(1) + "," + y.toFixed(1));
      }
      svg.appendChild(svgElement(doc, "polyline", { points: points.join(" "), className: "ccc-line" }));
      svg.appendChild(svgElement(doc, "line", { x1: "110", y1: "65", x2: "110", y2: "225", className: "ccc-line" }));
      svg.appendChild(svgElement(doc, "text", { x: "360", y: "260", className: "ccc-label", text: "连通、紧致，但竖直段与振荡图像不可由一条路径连接" }));
      return;
    }
    if (model.id === "rational-subspace") {
      svg.appendChild(svgElement(doc, "line", { x1: "90", y1: "145", x2: "610", y2: "145", className: "ccc-dash" }));
      for (var rationalIndex = 0; rationalIndex < 25; rationalIndex += 1) {
        var rationalX = 95 + rationalIndex * 21;
        svg.appendChild(svgElement(doc, "circle", { cx: String(rationalX), cy: String(137 + (rationalIndex % 3) * 7), r: "3", className: "ccc-dot" }));
      }
      svg.appendChild(svgElement(doc, "text", { x: "360", y: "220", className: "ccc-label", text: "有理点稠密，但空间不完备且不连通" }));
      return;
    }
    var ordinalPoints = [110, 195, 280, 365, 450, 535];
    ordinalPoints.forEach(function (point, pointIndex) {
      if (pointIndex > 0) svg.appendChild(svgElement(doc, "line", { x1: String(point - 85), y1: "145", x2: String(point), y2: "145", className: "ccc-dash" }));
      svg.appendChild(svgElement(doc, "circle", { cx: String(point), cy: "145", r: "11", className: "ccc-ordinal" }));
      svg.appendChild(svgElement(doc, "text", { x: String(point), y: "180", className: "ccc-label", text: pointIndex === 5 ? "..." : String(pointIndex) }));
    });
    svg.appendChild(svgElement(doc, "text", { x: "620", y: "150", className: "ccc-label", text: "ω1" }));
    svg.appendChild(svgElement(doc, "text", { x: "360", y: "235", className: "ccc-label", text: "序列只看到可数初段；开覆盖可越过所有初段" }));
  }

  function metric(doc, label) {
    var value = element(doc, "strong", { text: "—" });
    return { node: element(doc, "div", { className: "ccc-metric" }, [element(doc, "span", { text: label }), value]), value: value };
  }

  function predictionSpecs(model) {
    return [
      {
        key: "compact",
        prompt: model.label + " 开覆盖紧致吗？",
        expected: model.compact ? "yes" : "no",
        choices: [{ value: "yes", label: "是" }, { value: "no", label: "不是" }]
      },
      {
        key: "sequential",
        prompt: model.label + " 序列紧致吗？",
        expected: model.sequential ? "yes" : "no",
        choices: [{ value: "yes", label: "是" }, { value: "no", label: "不是" }]
      },
      {
        key: "path",
        prompt: "当前模型的连通性 / 路径连通性是？",
        expected: model.connected && model.pathConnected ? "both" : (model.connected ? "connected-only" : "neither"),
        choices: [
          { value: "both", label: "两者都有" },
          { value: "connected-only", label: "连通但非路径连通" },
          { value: "neither", label: "两者都没有" }
        ]
      }
    ];
  }

  function renderPredictions(state, refs, model) {
    predictionSpecs(model).forEach(function (spec, index) {
      var question = refs.questions[index];
      question.legend.textContent = spec.prompt;
      question.buttons.forEach(function (button) {
        var selected = state.predictions[spec.key] === button.value;
        button.node.setAttribute("aria-pressed", selected ? "true" : "false");
        if (state.revealed) {
          var correct = button.value === spec.expected;
          button.node.textContent = (correct ? "✓ " : "") + button.label;
          button.node.className = correct ? "ccc-pass" : (selected ? "ccc-warn" : "");
        } else {
          button.node.textContent = button.label;
          button.node.className = "";
        }
      });
    });
  }

  function renderEvidence(doc, refs, model, mapId) {
    var image = imageReport(model, mapId);
    var metrics = [
      metric(doc, "开覆盖紧致"),
      metric(doc, "序列紧致"),
      metric(doc, "度量空间"),
      metric(doc, "连通"),
      metric(doc, "路径连通"),
      metric(doc, "当前连续像")
    ];
    clear(refs.metrics);
    metrics.forEach(function (item) { refs.metrics.appendChild(item.node); });
    metrics[0].value.textContent = model.compact ? "是" : "否";
    metrics[1].value.textContent = model.sequential ? "是" : "否";
    metrics[2].value.textContent = model.metric ? "是" : "否";
    metrics[3].value.textContent = model.connected ? "是" : "否";
    metrics[4].value.textContent = model.pathConnected ? "是" : "否";
    metrics[5].value.textContent = image.known ? (image.compact ? "紧" : "非紧") : "未由定理决定";

    refs.svg.setAttribute("aria-labelledby", refs.uid + "-title " + refs.uid + "-desc");
    renderModelSvg(doc, refs.svg, model, refs.uid);

    var relation = model.metric
      ? (model.compact === model.sequential ? "本模型是度量空间，二者等价" : "状态不同；需检查模型")
      : "一般空间：序列紧致不能替代开覆盖紧致";
    var pathRelation = model.connected && !model.pathConnected
      ? "连通但非路径连通，构成反例"
      : (model.pathConnected ? "路径连通，因此连通" : "不连通，当然不路径连通");
    var rows = [
      ["开覆盖紧致", model.compact ? "是" : "否", model.coverCertificate],
      ["序列紧致", model.sequential ? "是" : "否", model.sequenceCertificate],
      ["二者关系", relation, model.metric ? "度量空间条件已声明" : "非度量空间的边界"],
      ["连通 / 路径连通", (model.connected ? "连通" : "不连通") + " / " + (model.pathConnected ? "路径连通" : "非路径连通"), pathRelation],
      ["连续像", image.text, "连续像定理只从紧致源空间推出紧致像"]
    ];
    clear(refs.table);
    var table = element(doc, "table");
    table.appendChild(element(doc, "caption", { text: "拓扑性质证书：定义、条件与边界分栏" }));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
      element(doc, "th", { scope: "col", text: "项目" }),
      element(doc, "th", { scope: "col", text: "结果" }),
      element(doc, "th", { scope: "col", text: "证书读法" })
    ])));
    var body = element(doc, "tbody");
    rows.forEach(function (row) {
      body.appendChild(element(doc, "tr", {}, row.map(function (value) { return element(doc, "td", { text: value }); })));
    });
    table.appendChild(body);
    refs.table.appendChild(table);
    refs.certificate.className = "ccc-certificate" + (model.connected && !model.pathConnected ? " ccc-fail" : "");
    refs.certificate.textContent = model.connected && !model.pathConnected
      ? "当前模型给出关键失败边界：连通不推出路径连通。紧致性与序列紧致也必须先声明空间属于哪一类。"
      : "当前模型的有限证书已揭晓；请把模型的条件连同结论一起搬回定理，而不是只搬数值。";
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    var uid = "ccc-" + (++INSTANCE);
    var state = { modelId: "closed-interval", mapId: "square", revealed: false, predictions: {}, feedback: "" };
    var refs = { questions: [], uid: uid };
    installStyles(doc);

    var shell = element(doc, "div", { className: "ccc-lab" });
    shell.appendChild(element(doc, "h3", { text: "紧致与连通实验：同一张性质表不能混用判据" }));
    shell.appendChild(element(doc, "p", { className: "ccc-note", text: "选择一个空间模型和连续像演示；先预测，再读取开覆盖、序列、连通与路径连通证书。图形只作直觉，模型条件决定定理能否使用。" }));

    var modelSelect = element(doc, "select", { "aria-label": "拓扑空间模型" });
    MODELS.forEach(function (model) {
      modelSelect.appendChild(element(doc, "option", { value: model.id, text: model.label }));
    });
    var mapSelect = element(doc, "select", { "aria-label": "连续像演示" });
    mapSelect.appendChild(element(doc, "option", { value: "square", text: "连续像：f(t)=t^2 / 投影" }));
    mapSelect.appendChild(element(doc, "option", { value: "reciprocal", text: "边界像：f(t)=1/t（开区间）" }));
    shell.appendChild(element(doc, "div", { className: "ccc-controls" }, [
      element(doc, "div", { className: "ccc-field" }, [element(doc, "label", { htmlFor: uid + "-model", text: "空间模型" }), modelSelect]),
      element(doc, "div", { className: "ccc-field" }, [element(doc, "label", { htmlFor: uid + "-map", text: "连续像演示" }), mapSelect])
    ]));
    modelSelect.id = uid + "-model";
    mapSelect.id = uid + "-map";

    var gate = element(doc, "div", { className: "ccc-gate" });
    for (let questionIndex = 0; questionIndex < 3; questionIndex += 1) {
      var fieldset = element(doc, "fieldset");
      var legend = element(doc, "legend", { text: "预测" });
      var options = element(doc, "div", { className: "ccc-options" });
      refs.questions.push({ legend: legend, buttons: [] });
      fieldset.appendChild(legend);
      fieldset.appendChild(options);
      gate.appendChild(fieldset);
      (questionIndex === 2
        ? [{ value: "both", label: "连通且路径连通" }, { value: "connected-only", label: "连通但非路径连通" }, { value: "neither", label: "两者都没有" }]
        : [{ value: "yes", label: "是" }, { value: "no", label: "不是" }]
      ).forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice.label });
        button.addEventListener("click", function () {
          var specs = predictionSpecs(modelById(state.modelId));
          state.predictions[specs[questionIndex].key] = choice.value;
          state.feedback = "";
          render();
        });
        refs.questions[questionIndex].buttons.push({ value: choice.value, label: choice.label, node: button });
        options.appendChild(button);
      });
    }
    shell.appendChild(gate);

    var reveal = element(doc, "button", { type: "button", className: "ccc-primary", text: "核对预测并揭晓" });
    var reset = element(doc, "button", { type: "button", text: "重置实验" });
    var feedback = element(doc, "p", { className: "ccc-feedback", "aria-live": "polite" });
    shell.appendChild(element(doc, "div", { className: "ccc-actions" }, [reveal, reset]));
    shell.appendChild(feedback);

    var result = element(doc, "div", { className: "ccc-result", hidden: true });
    var svg = svgElement(doc, "svg", { className: "ccc-svg", role: "img", viewBox: "0 0 720 300" });
    var metrics = element(doc, "div", { className: "ccc-metrics" });
    var table = element(doc, "div", { className: "ccc-table-wrap" });
    var certificate = element(doc, "p", { className: "ccc-certificate" });
    result.appendChild(element(doc, "div", { className: "ccc-frame" }, svg));
    result.appendChild(metrics);
    result.appendChild(table);
    result.appendChild(certificate);
    shell.appendChild(result);
    refs.svg = svg;
    refs.metrics = metrics;
    refs.table = table;
    refs.certificate = certificate;
    clear(root);
    root.appendChild(shell);

    function lock() {
      state.revealed = false;
      state.predictions = {};
      state.feedback = "";
      render();
    }

    modelSelect.addEventListener("change", function () {
      state.modelId = modelSelect.value;
      lock();
    });
    mapSelect.addEventListener("change", function () {
      state.mapId = mapSelect.value;
      if (state.revealed) render();
    });
    reset.addEventListener("click", function () {
      state = { modelId: "closed-interval", mapId: "square", revealed: false, predictions: {}, feedback: "" };
      modelSelect.value = state.modelId;
      mapSelect.value = state.mapId;
      render();
      announce(api, root, "紧致与连通实验已重置。");
    });
    reveal.addEventListener("click", function () {
      var model = modelById(state.modelId);
      var specs = predictionSpecs(model);
      if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) {
        state.feedback = "请先完成三项预测。";
        render();
        return;
      }
      var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
      state.revealed = true;
      state.feedback = "已揭晓：" + correct + "/" + specs.length + " 命中；现在把空间类别和结论一起读。";
      render();
      announce(api, root, state.feedback);
    });

    function render() {
      var model = modelById(state.modelId);
      modelSelect.value = model.id;
      mapSelect.value = state.mapId;
      renderPredictions(state, refs, model);
      feedback.textContent = state.feedback;
      feedback.className = "ccc-feedback" + (state.feedback.indexOf("请先") === 0 ? " ccc-warn" : "");
      result.hidden = !state.revealed;
      if (state.revealed) renderEvidence(doc, refs, model, state.mapId);
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      assert(condition, message);
      checks += 1;
    }
    MODELS.forEach(function (model) {
      check(model.pathConnected ? model.connected : true, "path implies connected " + model.id);
      if (model.metric) check(model.compact === model.sequential, "metric equivalence " + model.id);
    });
    var closed = modelById("closed-interval");
    check(closed.compact && closed.sequential && closed.connected && closed.pathConnected, "closed interval certificate");
    var open = modelById("open-interval");
    check(!open.compact && !open.sequential && open.connected && open.pathConnected, "open interval boundary");
    var sine = modelById("sine-closure");
    check(sine.compact && sine.sequential && sine.connected && !sine.pathConnected, "sine curve boundary");
    var rationals = modelById("rational-subspace");
    check(!rationals.compact && !rationals.sequential && !rationals.connected, "rational subspace boundary");
    var ordinal = modelById("omega-one");
    check(!ordinal.metric && ordinal.sequential && !ordinal.compact, "ordinal separation");
    check(imageReport(closed, "square").compact === true, "compact continuous image");
    check(imageReport(open, "reciprocal").compact === false, "noncompact reciprocal image");
    check(imageReport(open, "square").compact === false, "noncompact square image");
    check(imageReport(closed, "reciprocal").known === false, "invalid reciprocal model boundary");
    check(imageReport(ordinal, "square").known === false, "untriggered image theorem");
    return { checks: checks, models: MODELS.length };
  }

  return {
    mount: mount,
    models: MODELS,
    imageReport: imageReport,
    selfTest: selfTest
  };
});

(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";

  var STEPS = [
    {
      label: "外部态",
      title: "先把问题钉在外腿上",
      prompt: "具体谜题：一个四价顶点怎样把两个入射粒子变成两个出射粒子？",
      body: "固定外部态 p₁、p₂ → p₃、p₄。它们是散射矩阵的输入和输出标签，不是图上沿着时间轴飞行的四条小球轨迹。",
      formula: "⟨p₃,p₄| S |p₁,p₂⟩",
      check: "预测：若只有一个局域 φ⁴ 顶点，树图应该有几处相互作用位置？"
    },
    {
      label: "Dyson 一阶",
      title: "只取一次相互作用插入",
      prompt: "最小模型的第一阶 Dyson 项是什么？",
      body: "对 L_int = −λφ⁴/4!，时间序列指数取一阶，得到一个时空点 x 上的四个场。此时还没有把外腿接到这个点上。",
      formula: "S⁽¹⁾ = i∫d⁴x L_int(x) = −iλ/4! ∫d⁴x φ(x)⁴",
      check: "注意：1/4! 不是额外的物理效应，而是相同场因子的组合学归一化。"
    },
    {
      label: "Wick 缩并",
      title: "把四条外腿接到四个 φ(x)",
      prompt: "四个外部场与 φ(x)⁴ 有多少种双射连接？",
      body: "Wick 定理把时序乘积改写成所有缩并之和。对这张无内线的树图，四个外腿接到四个 φ(x) 的方式有 4! 种；它们是同一拓扑图的记账重数。",
      formula: "(φ(x))⁴  →  4! × [p₁,p₂,p₃,p₄ 接到 x]",
      check: "图上的四条线表达一次连接模式；4! 表达这张模式在场算符展开中出现的次数。"
    },
    {
      label: "因子抵消",
      title: "4! 与 1/4! 正好相消",
      prompt: "组合学重数留下什么顶点因子？",
      body: "Wick 连接带来的 4! 与相互作用定义中的 1/4! 抵消。于是一个 φ⁴ 顶点的局部规则是 −iλ，而不是 −iλ/4!。",
      formula: "(−iλ/4!) × 4! = −iλ",
      check: "这一步是图形记账的核心：对称因子不能漏，也不能再除一次。"
    },
    {
      label: "顶点与 δ",
      title: "对顶点位置积分，得到动量守恒",
      prompt: "局域相互作用为什么知道总四动量要守恒？",
      body: "四条外腿带来的平面波在同一 x 处相乘。对 x 积分把相位变成四维 δ 函数；局域性因此在动量空间表现为总四动量守恒。",
      formula: "∫d⁴x e^{i(p₁+p₂−p₃−p₄)·x} = (2π)⁴δ⁴(p₁+p₂−p₃−p₄)",
      check: "去掉整体 δ 函数后，树级 φ⁴ 接触图的约化振幅满足 i𝓜 = −iλ。"
    },
    {
      label: "观测量边界",
      title: "费曼图给振幅，不直接给截面",
      prompt: "从 i𝓜 到实验计数，还差什么？",
      body: "图的乘积给 S 矩阵中的振幅因子。要得到截面或衰变率，还要平方、处理态归一化，并乘上相空间与通量因子；整体动量 δ 函数按约定处理。",
      formula: "dσ = |𝓜|² × dΦ₂ / flux  （省略约定相关常数）",
      check: "边界检查：图不是粒子轨迹的照片；它是从理论到可观测量的中间记账语言。"
    }
  ];

  function setAttrs(node, attrs) {
    Object.keys(attrs).forEach(function (key) {
      node.setAttribute(key, attrs[key]);
    });
    return node;
  }

  function makeElement(doc, tag, className, text) {
    var node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function makeSvgElement(doc, tag, attrs, text) {
    var node = doc.createElementNS(SVG_NS, tag);
    if (attrs) setAttrs(node, attrs);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function replaceContents(root, child) {
    while (root.firstChild) root.removeChild(root.firstChild);
    root.appendChild(child);
  }

  function injectStyles(doc) {
    if (doc.querySelector && doc.querySelector("style[data-cl-feynman-style]")) return;
    var style = doc.createElement("style");
    style.setAttribute("data-cl-feynman-style", "true");
    style.textContent = [
      ".cl-lab { --cl-bg: var(--block-bg, #f5f0e3); --cl-bg-deep: var(--code-bg, #f1ece0); --cl-fg: var(--fg, #2c2a26); --cl-muted: var(--fg-soft, #6b6557); --cl-border: var(--border, #e0d7c4); --cl-accent: var(--accent, #a03d3d); --cl-link: var(--link, #1f5f8b); --cl-good: #477a5a; --cl-warn: #a35b31; color: var(--cl-fg); margin: 2em 0; font-size: .96em; line-height: 1.65; }",
      ".cl-lab *, .cl-lab *::before, .cl-lab *::after { box-sizing: border-box; }",
      ".cl-lab button { font: inherit; color: var(--cl-fg); background: var(--cl-bg); border: 1px solid var(--cl-border); border-radius: 6px; cursor: pointer; line-height: 1.35; }",
      ".cl-lab button:hover:not(:disabled) { border-color: var(--cl-accent); color: var(--cl-accent); }",
      ".cl-lab button:focus-visible { outline: 3px solid color-mix(in srgb, var(--cl-link) 45%, transparent); outline-offset: 2px; }",
      ".cl-lab button:disabled { cursor: not-allowed; opacity: .48; }",
      ".cl-feynman-lab { border: 1px solid var(--cl-border); border-radius: 8px; background: var(--cl-bg); padding: clamp(1rem, 2.5vw, 1.6rem); }",
      ".cl-lab-title { margin: 0 0 .25rem; color: var(--cl-accent); font-size: 1.35rem; }",
      ".cl-lab-intro { margin: 0 0 1rem; color: var(--cl-muted); }",
      ".cl-stepper { margin: 1rem 0 1.15rem; overflow-x: auto; padding-bottom: .15rem; }",
      ".cl-step-list { display: flex; gap: .45rem; list-style: none; margin: 0; min-width: max-content; padding: 0; }",
      ".cl-step-item { display: flex; align-items: center; gap: .45rem; }",
      ".cl-step-item:not(:last-child)::after { color: var(--cl-muted); content: '→'; }",
      ".cl-step-button { padding: .42rem .65rem; white-space: nowrap; }",
      ".cl-step-button[aria-current='step'] { background: var(--cl-accent); border-color: var(--cl-accent); color: var(--cl-bg); font-weight: 700; }",
      ".cl-step-panel { border-left: 4px solid var(--cl-accent); background: color-mix(in srgb, var(--cl-bg-deep) 70%, transparent); border-radius: 2px 6px 6px 2px; padding: .85rem 1rem; }",
      ".cl-step-kicker { color: var(--cl-muted); font-size: .86em; letter-spacing: 0; margin: 0 0 .1rem; }",
      ".cl-step-heading { font-size: 1.13rem; margin: 0 0 .4rem; }",
      ".cl-step-question { color: var(--cl-accent); font-weight: 700; margin: .35rem 0; }",
      ".cl-step-body, .cl-step-check { margin: .45rem 0; }",
      ".cl-step-check { color: var(--cl-muted); font-size: .93em; }",
      ".cl-equation { background: var(--cl-bg-deep); border: 1px solid var(--cl-border); border-radius: 6px; font-family: 'SF Mono', Menlo, Consolas, monospace; font-size: .94em; margin: .75rem 0; overflow-x: auto; padding: .65rem .8rem; white-space: nowrap; }",
      ".cl-visual-grid { display: grid; gap: 1rem; grid-template-columns: minmax(0, 1.35fr) minmax(16rem, .9fr); margin-top: 1.1rem; }",
      ".cl-figure, .cl-ledger-card { border: 1px solid var(--cl-border); border-radius: 6px; margin: 0; min-width: 0; padding: .75rem; }",
      ".cl-figure { background: var(--cl-bg-deep); }",
      ".cl-figure figcaption { color: var(--cl-muted); font-size: .86em; line-height: 1.45; margin-top: .5rem; text-align: left; }",
      ".cl-svg { display: block; height: auto; max-width: 100%; width: 100%; }",
      ".cl-svg text { fill: var(--cl-fg); font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif; }",
      ".cl-svg-line { fill: none; stroke: var(--cl-link); stroke-linecap: round; stroke-width: 3; transition: opacity .2s; }",
      ".cl-svg-axis { stroke: var(--cl-border); stroke-dasharray: 4 5; stroke-width: 1.5; }",
      ".cl-svg-arrow { fill: var(--cl-link); }",
      ".cl-svg-label { fill: var(--cl-muted) !important; font-size: 18px; font-weight: 700; }",
      ".cl-svg-small { fill: var(--cl-muted) !important; font-size: 15px; }",
      ".cl-svg-vertex { fill: var(--cl-accent); stroke: var(--cl-bg); stroke-width: 4; transition: opacity .2s; }",
      ".cl-svg-vertex-text { fill: var(--cl-bg) !important; font-size: 12px; font-weight: 700; }",
      ".cl-svg-badge { fill: var(--cl-bg); stroke: var(--cl-accent); stroke-width: 2; transition: opacity .2s; }",
      ".cl-svg-badge-text { fill: var(--cl-accent) !important; font-size: 16px; font-weight: 700; }",
      ".cl-svg-delta { fill: var(--cl-good) !important; font-family: 'SF Mono', Menlo, Consolas, monospace !important; font-size: 15px; transition: opacity .2s; }",
      ".cl-svg-amplitude { fill: var(--cl-accent) !important; font-family: 'SF Mono', Menlo, Consolas, monospace !important; font-size: 17px; font-weight: 700; transition: opacity .2s; }",
      ".cl-ledger-card { background: var(--cl-bg); overflow-x: auto; }",
      ".cl-ledger-title { font-size: 1rem; margin: 0 0 .55rem; }",
      ".cl-ledger { border-collapse: collapse; font-size: .86em; width: 100%; }",
      ".cl-ledger th, .cl-ledger td { border-bottom: 1px solid var(--cl-border); padding: .45rem .38rem; text-align: left; vertical-align: top; }",
      ".cl-ledger th { color: var(--cl-muted); font-size: .9em; font-weight: 600; }",
      ".cl-ledger .cl-ledger-factor { font-family: 'SF Mono', Menlo, Consolas, monospace; white-space: nowrap; }",
      ".cl-ledger-row.cl-ledger-done { background: color-mix(in srgb, var(--cl-good) 9%, transparent); }",
      ".cl-ledger-row.cl-ledger-current { background: color-mix(in srgb, var(--cl-accent) 15%, transparent); box-shadow: inset 3px 0 var(--cl-accent); }",
      ".cl-ledger-row.cl-ledger-current td:first-child { color: var(--cl-accent); font-weight: 700; }",
      ".cl-note { background: color-mix(in srgb, var(--cl-warn) 10%, var(--cl-bg)); border: 1px solid color-mix(in srgb, var(--cl-warn) 45%, var(--cl-border)); border-radius: 6px; color: var(--cl-muted); margin: 1rem 0 0; padding: .7rem .85rem; }",
      ".cl-note strong { color: var(--cl-warn); }",
      ".cl-controls { align-items: center; display: flex; flex-wrap: wrap; gap: .55rem; justify-content: space-between; margin-top: 1rem; }",
      ".cl-control-group { display: flex; flex-wrap: wrap; gap: .5rem; }",
      ".cl-control { padding: .5rem .8rem; }",
      ".cl-control-primary { background: var(--cl-accent) !important; border-color: var(--cl-accent) !important; color: var(--cl-bg) !important; font-weight: 700; }",
      ".cl-live { color: var(--cl-muted); font-size: .86em; margin: .65rem 0 0; min-height: 1.3em; }",
      "@media (max-width: 700px) { .cl-visual-grid { grid-template-columns: 1fr; } .cl-feynman-lab { padding: 1rem .8rem; } }",
      "@media (prefers-reduced-motion: reduce) { .cl-lab * { scroll-behavior: auto !important; transition: none !important; } }"
    ].join("\n");
    var host = doc.head || doc.documentElement || doc.body;
    if (host) host.appendChild(style);
  }

  function makeDiagram(doc) {
    var figure = makeElement(doc, "figure", "cl-figure");
    var svg = makeSvgElement(doc, "svg", {
      "class": "cl-svg cl-feynman-svg",
      "viewBox": "0 0 640 300",
      "role": "img",
      "aria-labelledby": "cl-feynman-svg-title cl-feynman-svg-desc"
    });
    var title = makeSvgElement(doc, "title", { id: "cl-feynman-svg-title" }, "phi4 四价接触顶点");
    var desc = makeSvgElement(doc, "desc", { id: "cl-feynman-svg-desc" }, "四条带动量标签的外腿连接到一个顶点；图形是 Wick 记账，不是粒子轨迹。");
    svg.appendChild(title);
    svg.appendChild(desc);

    var defs = makeSvgElement(doc, "defs");
    var marker = makeSvgElement(doc, "marker", {
      id: "cl-feynman-arrow",
      markerWidth: "8",
      markerHeight: "8",
      refX: "6",
      refY: "4",
      orient: "auto",
      markerUnits: "strokeWidth"
    });
    marker.appendChild(makeSvgElement(doc, "path", { d: "M0,0 L8,4 L0,8 z", "class": "cl-svg-arrow" }));
    defs.appendChild(marker);
    svg.appendChild(defs);

    var axis = makeSvgElement(doc, "line", { x1: "320", y1: "32", x2: "320", y2: "266", "class": "cl-svg-axis" });
    svg.appendChild(axis);
    svg.appendChild(makeSvgElement(doc, "text", { x: "329", y: "48", "class": "cl-svg-small" }, "一次局域相互作用"));

    var lineData = [
      ["p₁", "52", "94", "309", "143", "cl-svg-line cl-svg-incoming"],
      ["p₂", "52", "206", "309", "157", "cl-svg-line cl-svg-incoming"],
      ["p₃", "331", "143", "588", "94", "cl-svg-line cl-svg-outgoing"],
      ["p₄", "331", "157", "588", "206", "cl-svg-line cl-svg-outgoing"]
    ];
    var lines = [];
    lineData.forEach(function (item) {
      var line = makeSvgElement(doc, "line", {
        x1: item[1], y1: item[2], x2: item[3], y2: item[4],
        "class": item[5], "marker-end": "url(#cl-feynman-arrow)"
      });
      lines.push(line);
      svg.appendChild(line);
      svg.appendChild(makeSvgElement(doc, "text", {
        x: item[1] === "52" ? "24" : "594",
        y: item[2] === "94" ? "87" : item[2] === "206" ? "225" : item[2] === "143" ? "136" : "225",
        "class": "cl-svg-label"
      }, item[0]));
    });

    var vertexGroup = makeSvgElement(doc, "g", { "class": "cl-svg-vertex-group" });
    vertexGroup.appendChild(makeSvgElement(doc, "circle", { cx: "320", cy: "150", r: "18", "class": "cl-svg-vertex" }));
    vertexGroup.appendChild(makeSvgElement(doc, "text", { x: "320", y: "156", "class": "cl-svg-vertex-text", "text-anchor": "middle" }, "φ⁴"));
    svg.appendChild(vertexGroup);

    var badge = makeSvgElement(doc, "g", { "class": "cl-svg-wick-badge" });
    badge.appendChild(makeSvgElement(doc, "rect", { x: "232", y: "68", width: "176", height: "34", rx: "9", "class": "cl-svg-badge" }));
    badge.appendChild(makeSvgElement(doc, "text", { x: "320", y: "91", "class": "cl-svg-badge-text", "text-anchor": "middle" }, "Wick 连接：4!"));
    svg.appendChild(badge);

    var delta = makeSvgElement(doc, "text", { x: "320", y: "250", "class": "cl-svg-delta", "text-anchor": "middle" }, "(2π)⁴ δ⁴(p₁+p₂−p₃−p₄)");
    svg.appendChild(delta);
    var amplitude = makeSvgElement(doc, "text", { x: "320", y: "286", "class": "cl-svg-amplitude", "text-anchor": "middle" }, "i𝓜 = −iλ");
    svg.appendChild(amplitude);
    var note = makeSvgElement(doc, "text", { x: "320", y: "23", "class": "cl-svg-small", "text-anchor": "middle" }, "图形语法：连接与因子");
    svg.appendChild(note);
    figure.appendChild(svg);
    figure.appendChild(makeElement(doc, "figcaption", "cl-figure-caption", "φ⁴ 的树级 2→2 接触图。线条和顶点记录 Wick 连接、动量与因子；它不是四个粒子的时空轨迹。"));

    return {
      node: figure,
      update: function (stepIndex) {
        var hasExternal = stepIndex >= 0;
        var hasVertex = stepIndex >= 1;
        var hasWick = stepIndex >= 2;
        lines.forEach(function (line) { line.setAttribute("opacity", hasExternal ? "1" : ".2"); });
        vertexGroup.setAttribute("opacity", hasVertex ? "1" : ".24");
        badge.setAttribute("opacity", hasWick ? "1" : ".12");
        delta.setAttribute("opacity", stepIndex >= 4 ? "1" : ".16");
        amplitude.setAttribute("opacity", stepIndex >= 5 ? "1" : ".16");
      }
    };
  }

  function makeLedger(doc) {
    var card = makeElement(doc, "aside", "cl-ledger-card");
    card.setAttribute("aria-labelledby", "cl-feynman-ledger-title");
    var ledgerTitle = makeElement(doc, "h3", "cl-ledger-title", "因子账本");
    ledgerTitle.id = "cl-feynman-ledger-title";
    card.appendChild(ledgerTitle);
    var table = makeElement(doc, "table", "cl-ledger");
    var caption = makeElement(doc, "caption", "cl-visually-hidden", "从 Dyson 项到可观测量的因子账本");
    table.appendChild(caption);
    var head = makeElement(doc, "thead");
    var headRow = makeElement(doc, "tr");
    ["来源", "因子", "它在记什么"].forEach(function (label) { headRow.appendChild(makeElement(doc, "th", "", label)); });
    head.appendChild(headRow);
    table.appendChild(head);
    var body = makeElement(doc, "tbody");
    var rows = [
      ["external", "外部态", "p₁,p₂ → p₃,p₄", "散射问题的边界条件"],
      ["dyson", "Dyson 一阶", "−iλ/4! ∫d⁴x", "一次相互作用插入"],
      ["wick", "Wick 连接", "4!", "四个外腿到四个 φ(x) 的双射"],
      ["cancel", "组合学抵消", "4!/4! = 1", "留下顶点因子 −iλ"],
      ["delta", "顶点位置积分", "(2π)⁴δ⁴(Σp)", "平移不变性 → 总四动量守恒"],
      ["observable", "观测量边界", "|𝓜|² × dΦ₂ / flux", "截面还需要相空间与归一化"]
    ];
    var rowNodes = {};
    rows.forEach(function (row) {
      var tr = makeElement(doc, "tr", "cl-ledger-row");
      tr.setAttribute("data-cl-ledger-key", row[0]);
      tr.appendChild(makeElement(doc, "td", "", row[1]));
      tr.appendChild(makeElement(doc, "td", "cl-ledger-factor", row[2]));
      tr.appendChild(makeElement(doc, "td", "", row[3]));
      body.appendChild(tr);
      rowNodes[row[0]] = tr;
    });
    table.appendChild(body);
    card.appendChild(table);
    card.appendChild(makeElement(doc, "p", "cl-ledger-foot", "同一张图的不同线条不是不同的历史；它们是同一项振幅的组合学标记。"));
    return {
      node: card,
      update: function (stepIndex) {
        var thresholds = { external: 0, dyson: 1, wick: 2, cancel: 3, delta: 4, observable: 5 };
        Object.keys(rowNodes).forEach(function (key) {
          var row = rowNodes[key];
          row.classList.remove("cl-ledger-current", "cl-ledger-done");
          if (stepIndex === thresholds[key]) row.classList.add("cl-ledger-current");
          else if (stepIndex > thresholds[key]) row.classList.add("cl-ledger-done");
        });
      }
    };
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument || !root.appendChild) return;
    var doc = root.ownerDocument;
    try {
      injectStyles(doc);
      var shell = makeElement(doc, "section", "cl-lab cl-feynman-lab");
      shell.setAttribute("aria-labelledby", "cl-feynman-title");
      var title = makeElement(doc, "h2", "cl-lab-title", "费曼记账台：φ⁴ 的树级 2→2");
      title.id = "cl-feynman-title";
      shell.appendChild(title);
      shell.appendChild(makeElement(doc, "p", "cl-lab-intro", "逐步追踪一张接触图怎样从 Dyson 展开变成约化振幅。可以点任意步骤回看；所有内容都是确定的组合学。"));

      var nav = makeElement(doc, "nav", "cl-stepper");
      nav.setAttribute("aria-label", "费曼图推导步骤");
      var list = makeElement(doc, "ol", "cl-step-list");
      var stepButtons = [];
      STEPS.forEach(function (step, index) {
        var item = makeElement(doc, "li", "cl-step-item");
        var button = makeElement(doc, "button", "cl-step-button", (index + 1) + ". " + step.label);
        button.type = "button";
        button.setAttribute("aria-label", "跳到步骤 " + (index + 1) + "：" + step.title);
        button.addEventListener("click", function () { setStep(index); });
        item.appendChild(button);
        list.appendChild(item);
        stepButtons.push(button);
      });
      nav.appendChild(list);
      shell.appendChild(nav);

      var panel = makeElement(doc, "section", "cl-step-panel");
      panel.setAttribute("aria-live", "polite");
      var kicker = makeElement(doc, "p", "cl-step-kicker");
      var heading = makeElement(doc, "h3", "cl-step-heading");
      var question = makeElement(doc, "p", "cl-step-question");
      var body = makeElement(doc, "p", "cl-step-body");
      var equation = makeElement(doc, "div", "cl-equation");
      equation.setAttribute("role", "img");
      equation.setAttribute("aria-label", "当前步骤公式");
      var check = makeElement(doc, "p", "cl-step-check");
      panel.appendChild(kicker);
      panel.appendChild(heading);
      panel.appendChild(question);
      panel.appendChild(body);
      panel.appendChild(equation);
      panel.appendChild(check);
      shell.appendChild(panel);

      var diagram = makeDiagram(doc);
      var ledger = makeLedger(doc);
      var visualGrid = makeElement(doc, "div", "cl-visual-grid");
      visualGrid.appendChild(diagram.node);
      visualGrid.appendChild(ledger.node);
      shell.appendChild(visualGrid);

      var note = makeElement(doc, "aside", "cl-note");
      note.appendChild(makeElement(doc, "strong", "", "图形 bookkeeping ≠ 粒子轨迹。"));
      note.appendChild(doc.createTextNode(" 费曼图把缩并、传播子、顶点因子和动量约束放在同一张账上；它不是探测器拍到的路径，也不要求虚粒子真的沿线运动。"));
      shell.appendChild(note);

      var controls = makeElement(doc, "div", "cl-controls");
      var controlGroup = makeElement(doc, "div", "cl-control-group");
      var back = makeElement(doc, "button", "cl-control", "← 上一步");
      var next = makeElement(doc, "button", "cl-control cl-control-primary", "下一步 →");
      var reset = makeElement(doc, "button", "cl-control", "重置");
      back.type = "button";
      next.type = "button";
      reset.type = "button";
      controlGroup.appendChild(back);
      controlGroup.appendChild(next);
      controlGroup.appendChild(reset);
      controls.appendChild(controlGroup);
      shell.appendChild(controls);
      var live = makeElement(doc, "p", "cl-live");
      live.setAttribute("aria-live", "polite");
      shell.appendChild(live);

      var current = 0;

      function announce(message) {
        live.textContent = message;
        if (api && typeof api.announce === "function") api.announce(root, message);
      }

      function setStep(index) {
        current = Math.max(0, Math.min(STEPS.length - 1, index));
        var step = STEPS[current];
        stepButtons.forEach(function (button, buttonIndex) {
          if (buttonIndex === current) button.setAttribute("aria-current", "step");
          else button.removeAttribute("aria-current");
        });
        kicker.textContent = "步骤 " + (current + 1) + " / " + STEPS.length + " · " + step.label;
        heading.textContent = step.title;
        question.textContent = step.prompt;
        body.textContent = step.body;
        equation.textContent = step.formula;
        check.textContent = "检查点：" + step.check;
        back.disabled = current === 0;
        next.disabled = current === STEPS.length - 1;
        diagram.update(current);
        ledger.update(current);
        announce("已到步骤 " + (current + 1) + "：" + step.title);
      }

      back.addEventListener("click", function () { setStep(current - 1); });
      next.addEventListener("click", function () { setStep(current + 1); });
      reset.addEventListener("click", function () { setStep(0); });
      setStep(0);

      replaceContents(root, shell);
    } catch (error) {
      /* 保留 Markdown 的 no-JS fallback；运行时失败不应让整页失去内容。 */
    }
  }

  if (window.CourseLearning && typeof window.CourseLearning.register === "function") {
    window.CourseLearning.register("feynman", function (root, api) {
      mount(root, api);
    });
  }
}());

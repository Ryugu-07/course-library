(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var ERROR_ORDER = ["I", "X1", "X2", "X3"];
  var ERROR_INFO = {
    I: {
      label: "I（无错误）",
      short: "I",
      state: "α|000⟩ + β|111⟩",
      syndrome: ["+", "+"],
      correction: "I",
      location: "没有需要定位的翻转"
    },
    X1: {
      label: "X₁（第 1 位翻转）",
      short: "X₁",
      state: "α|100⟩ + β|011⟩",
      syndrome: ["−", "+"],
      correction: "X₁",
      location: "第 1 位"
    },
    X2: {
      label: "X₂（第 2 位翻转）",
      short: "X₂",
      state: "α|010⟩ + β|101⟩",
      syndrome: ["−", "−"],
      correction: "X₂",
      location: "第 2 位"
    },
    X3: {
      label: "X₃（第 3 位翻转）",
      short: "X₃",
      state: "α|001⟩ + β|110⟩",
      syndrome: ["+", "−"],
      correction: "X₃",
      location: "第 3 位"
    }
  };

  var STAGES = [
    { label: "准备", title: "先保留一个逻辑 qubit", description: "把未知逻辑态写成 |ψ⟩ = α|0⟩ + β|1⟩。我们只会测错误的指纹，不测 α、β。" },
    { label: "Encode", title: "把逻辑态放进代码空间", description: "两个 CNOT 把逻辑信息编码为 |ψ_L⟩ = α|000⟩ + β|111⟩。这是关联的编码，不是制造三份独立的未知态。" },
    { label: "Error", title: "让一个可选的 X 错误发生", description: "选择 I、X₁、X₂ 或 X₃；实验只注入一个 bit-flip，并把对应的状态分支显示出来。" },
    { label: "Syndrome", title: "测两个奇偶校验", description: "测 Z₁Z₂ 与 Z₂Z₃ 的本征值。四种符号只依赖错误位置，不依赖逻辑振幅 α、β。" },
    { label: "Correct", title: "按指纹施加恢复门", description: "综合为 −+、--、+- 时分别施加 X₁、X₂、X₃；++ 对应 I。理想情况下回到代码空间。" }
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
    if (doc.querySelector && doc.querySelector("style[data-cl-qec-style]")) return;
    var style = doc.createElement("style");
    style.setAttribute("data-cl-qec-style", "true");
    style.textContent = [
      ".cl-lab { --cl-bg: var(--block-bg, #f5f0e3); --cl-bg-deep: var(--code-bg, #f1ece0); --cl-fg: var(--fg, #2c2a26); --cl-muted: var(--fg-soft, #6b6557); --cl-border: var(--border, #e0d7c4); --cl-accent: var(--accent, #a03d3d); --cl-link: var(--link, #1f5f8b); --cl-good: #477a5a; --cl-warn: #a35b31; color: var(--cl-fg); margin: 2em 0; font-size: .96em; line-height: 1.65; }",
      ".cl-lab *, .cl-lab *::before, .cl-lab *::after { box-sizing: border-box; }",
      ".cl-lab button { font: inherit; color: var(--cl-fg); background: var(--cl-bg); border: 1px solid var(--cl-border); border-radius: 6px; cursor: pointer; line-height: 1.35; }",
      ".cl-lab button:hover:not(:disabled) { border-color: var(--cl-accent); color: var(--cl-accent); }",
      ".cl-lab button:focus-visible, .cl-lab input:focus-visible + label { outline: 3px solid color-mix(in srgb, var(--cl-link) 45%, transparent); outline-offset: 2px; }",
      ".cl-lab button:disabled { cursor: not-allowed; opacity: .48; }",
      ".cl-qec-lab { border: 1px solid var(--cl-border); border-radius: 8px; background: var(--cl-bg); padding: clamp(1rem, 2.5vw, 1.6rem); }",
      ".cl-lab-title { margin: 0 0 .25rem; color: var(--cl-accent); font-size: 1.35rem; }",
      ".cl-lab-intro { margin: 0 0 1rem; color: var(--cl-muted); }",
      ".cl-error-fieldset { border: 1px solid var(--cl-border); border-radius: 6px; margin: 1rem 0; padding: .7rem .8rem .8rem; }",
      ".cl-error-fieldset legend { color: var(--cl-accent); font-weight: 700; padding: 0 .35rem; }",
      ".cl-radio-list { display: grid; gap: .5rem; grid-template-columns: repeat(4, minmax(0, 1fr)); }",
      ".cl-radio-option { align-items: center; background: var(--cl-bg-deep); border: 1px solid var(--cl-border); border-radius: 6px; display: flex; gap: .45rem; min-height: 2.75rem; padding: .45rem .55rem; }",
      ".cl-radio-option:focus-within, .cl-radio-option.cl-radio-selected { border-color: var(--cl-accent); box-shadow: inset 3px 0 var(--cl-accent); }",
      ".cl-radio-option input { accent-color: var(--cl-accent); margin: 0; }",
      ".cl-radio-option label { align-items: center; cursor: pointer; display: flex; flex: 1; font-size: .91em; line-height: 1.35; min-height: 44px; }",
      ".cl-qec-stage-controls { display: flex; flex-wrap: wrap; gap: .5rem; margin: 1rem 0; }",
      ".cl-qec-stage { flex: 1 1 8rem; min-width: 7rem; padding: .55rem .7rem; }",
      ".cl-qec-stage[aria-current='step'] { background: var(--cl-accent); border-color: var(--cl-accent); color: var(--cl-bg); font-weight: 700; }",
      ".cl-qec-stage.cl-stage-done { border-color: var(--cl-good); color: var(--cl-good); }",
      ".cl-qec-stage.cl-stage-done[aria-current='step'] { color: var(--cl-bg); }",
      ".cl-qec-grid { display: grid; gap: 1rem; grid-template-columns: minmax(0, 1.3fr) minmax(17rem, .9fr); margin-top: 1rem; }",
      ".cl-circuit-figure, .cl-state-card, .cl-syndrome-card { border: 1px solid var(--cl-border); border-radius: 6px; margin: 0; min-width: 0; padding: .75rem; }",
      ".cl-circuit-figure { background: var(--cl-bg-deep); }",
      ".cl-circuit-figure figcaption { color: var(--cl-muted); font-size: .86em; line-height: 1.45; margin-top: .5rem; }",
      ".cl-qec-svg { display: block; height: auto; max-width: 100%; width: 100%; }",
      ".cl-qec-svg text { fill: var(--cl-fg); font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif; }",
      ".cl-circuit-wire { fill: none; stroke: var(--cl-link); stroke-linecap: round; stroke-width: 3; }",
      ".cl-circuit-label { fill: var(--cl-muted) !important; font-size: 16px; font-weight: 700; }",
      ".cl-circuit-stage-label { fill: var(--cl-muted) !important; font-size: 15px; font-weight: 700; }",
      ".cl-circuit-stage-box { fill: var(--cl-bg); opacity: .35; stroke: var(--cl-border); stroke-width: 1.5; transition: opacity .2s, stroke .2s; }",
      ".cl-circuit-stage-box.cl-circuit-current { opacity: .95; stroke: var(--cl-accent); stroke-width: 2.5; }",
      ".cl-circuit-stage-box.cl-circuit-done { opacity: .62; stroke: var(--cl-good); }",
      ".cl-circuit-gate { fill: var(--cl-bg); stroke: var(--cl-link); stroke-width: 2; }",
      ".cl-circuit-gate-text { fill: var(--cl-link) !important; font-family: 'SF Mono', Menlo, Consolas, monospace !important; font-size: 15px; font-weight: 700; }",
      ".cl-circuit-gate.cl-circuit-recovery { stroke: var(--cl-good); }",
      ".cl-circuit-gate-text.cl-circuit-recovery { fill: var(--cl-good) !important; }",
      ".cl-circuit-control { fill: var(--cl-link); }",
      ".cl-circuit-target { fill: var(--cl-bg); stroke: var(--cl-link); stroke-width: 2; }",
      ".cl-circuit-target-text { fill: var(--cl-link) !important; font-size: 18px; font-weight: 700; }",
      ".cl-state-card { background: var(--cl-bg); }",
      ".cl-card-title { font-size: 1rem; margin: 0 0 .55rem; }",
      ".cl-state-expression { background: var(--cl-bg-deep); border-left: 4px solid var(--cl-accent); border-radius: 2px 6px 6px 2px; font-family: 'SF Mono', Menlo, Consolas, monospace; font-size: 1.02em; margin: 0 0 .75rem; overflow-x: auto; padding: .7rem .75rem; white-space: nowrap; }",
      ".cl-state-status { color: var(--cl-muted); font-size: .9em; margin: .35rem 0; }",
      ".cl-state-definition { display: grid; gap: .25rem .7rem; grid-template-columns: auto 1fr; margin: .7rem 0 0; }",
      ".cl-state-definition dt { color: var(--cl-muted); font-size: .86em; }",
      ".cl-state-definition dd { margin: 0; }",
      ".cl-syndrome-card { background: var(--cl-bg); margin-top: 1rem; }",
      ".cl-syndrome-readout { display: grid; gap: .5rem; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: .6rem 0; }",
      ".cl-measurement { background: var(--cl-bg-deep); border: 1px solid var(--cl-border); border-radius: .5rem; padding: .5rem .6rem; }",
      ".cl-measurement-label { color: var(--cl-muted); display: block; font-size: .82em; }",
      ".cl-measurement-value { color: var(--cl-accent); display: block; font-family: 'SF Mono', Menlo, Consolas, monospace; font-size: 1.25em; font-weight: 700; }",
      ".cl-syndrome-summary { color: var(--cl-muted); font-size: .88em; margin: .5rem 0 0; }",
      ".cl-map-card { border: 1px solid var(--cl-border); border-radius: 6px; margin-top: 1rem; overflow-x: auto; padding: .75rem; }",
      ".cl-map-title { font-size: 1rem; margin: 0 0 .55rem; }",
      ".cl-syndrome-map { border-collapse: collapse; font-size: .9em; width: 100%; }",
      ".cl-syndrome-map th, .cl-syndrome-map td { border-bottom: 1px solid var(--cl-border); padding: .45rem .55rem; text-align: left; }",
      ".cl-syndrome-map th { color: var(--cl-muted); font-weight: 600; }",
      ".cl-syndrome-map tr.cl-map-selected { background: color-mix(in srgb, var(--cl-accent) 15%, transparent); box-shadow: inset 3px 0 var(--cl-accent); }",
      ".cl-syndrome-map tr.cl-map-selected td:first-child { color: var(--cl-accent); font-weight: 700; }",
      ".cl-qec-boundary { background: color-mix(in srgb, var(--cl-warn) 10%, var(--cl-bg)); border: 1px solid color-mix(in srgb, var(--cl-warn) 45%, var(--cl-border)); border-radius: 6px; color: var(--cl-muted); margin: 1rem 0 0; padding: .7rem .85rem; }",
      ".cl-qec-boundary strong { color: var(--cl-warn); }",
      ".cl-qec-description { color: var(--cl-muted); margin: .35rem 0 .7rem; min-height: 3.2em; }",
      ".cl-qec-footer { align-items: center; display: flex; flex-wrap: wrap; gap: .5rem; justify-content: space-between; margin-top: 1rem; }",
      ".cl-qec-footer-group { display: flex; flex-wrap: wrap; gap: .5rem; }",
      ".cl-control { padding: .5rem .8rem; }",
      ".cl-control-primary { background: var(--cl-accent) !important; border-color: var(--cl-accent) !important; color: var(--cl-bg) !important; font-weight: 700; }",
      ".cl-live { color: var(--cl-muted); font-size: .86em; margin: .65rem 0 0; min-height: 1.3em; }",
      "@media (max-width: 720px) { .cl-radio-list { grid-template-columns: repeat(2, minmax(0, 1fr)); } .cl-qec-grid { grid-template-columns: 1fr; } .cl-qec-lab { padding: 1rem .8rem; } }",
      "@media (max-width: 420px) { .cl-radio-list { grid-template-columns: 1fr; } .cl-qec-stage { flex-basis: 45%; } }",
      "@media (prefers-reduced-motion: reduce) { .cl-lab * { scroll-behavior: auto !important; transition: none !important; } }"
    ].join("\n");
    var host = doc.head || doc.documentElement || doc.body;
    if (host) host.appendChild(style);
  }

  function makeGate(doc, x, y, text, extraClass) {
    var group = makeSvgElement(doc, "g", { "class": "cl-circuit-gate-group" });
    group.appendChild(makeSvgElement(doc, "rect", { x: String(x - 22), y: String(y - 19), width: "44", height: "38", rx: "7", "class": "cl-circuit-gate " + (extraClass || "") }));
    group.appendChild(makeSvgElement(doc, "text", { x: String(x), y: String(y + 6), "class": "cl-circuit-gate-text " + (extraClass || ""), "text-anchor": "middle" }, text));
    return group;
  }

  function makeCircuit(doc) {
    var figure = makeElement(doc, "figure", "cl-circuit-figure");
    var svg = makeSvgElement(doc, "svg", {
      "class": "cl-qec-svg",
      "viewBox": "0 0 720 260",
      "role": "img",
      "aria-labelledby": "cl-qec-svg-title cl-qec-svg-desc"
    });
    svg.appendChild(makeSvgElement(doc, "title", { id: "cl-qec-svg-title" }, "三比特 bit-flip repetition code 流程"));
    svg.appendChild(makeSvgElement(doc, "desc", { id: "cl-qec-svg-desc" }, "三条 qubit 线依次经过 Encode、Error、Syndrome 与 Correct 四个阶段；当前错误位置和综合符号会随选择更新。"));

    var ys = [82, 132, 182];
    var stageXs = [160, 325, 490, 630];
    var stageWidths = [125, 115, 120, 115];
    var stageLabels = ["Encode", "Error", "Syndrome", "Correct"];
    var stageBoxes = [];
    stageXs.forEach(function (x, index) {
      var box = makeSvgElement(doc, "rect", {
        x: String(x - stageWidths[index] / 2), y: "43", width: String(stageWidths[index]), height: "174", rx: "12", "class": "cl-circuit-stage-box"
      });
      stageBoxes.push(box);
      svg.appendChild(box);
      svg.appendChild(makeSvgElement(doc, "text", { x: String(x), y: "29", "class": "cl-circuit-stage-label", "text-anchor": "middle" }, stageLabels[index]));
    });

    ys.forEach(function (y, index) {
      svg.appendChild(makeSvgElement(doc, "line", { x1: "55", y1: String(y), x2: "684", y2: String(y), "class": "cl-circuit-wire" }));
      svg.appendChild(makeSvgElement(doc, "text", { x: "28", y: String(y + 5), "class": "cl-circuit-label", "text-anchor": "middle" }, "q" + (index + 1)));
    });

    /* Encode: q1 controls two CNOT targets, assuming q2 and q3 begin in |0⟩. */
    var encode = makeSvgElement(doc, "g", { "class": "cl-encode-gate" });
    encode.appendChild(makeSvgElement(doc, "line", { x1: "160", y1: String(ys[0]), x2: "160", y2: String(ys[2]), "class": "cl-circuit-wire" }));
    encode.appendChild(makeSvgElement(doc, "circle", { cx: "160", cy: String(ys[0]), r: "7", "class": "cl-circuit-control" }));
    [ys[1], ys[2]].forEach(function (y) {
      encode.appendChild(makeSvgElement(doc, "circle", { cx: "160", cy: String(y), r: "13", "class": "cl-circuit-target" }));
      encode.appendChild(makeSvgElement(doc, "line", { x1: "151", y1: String(y), x2: "169", y2: String(y), "class": "cl-circuit-wire" }));
      encode.appendChild(makeSvgElement(doc, "line", { x1: "160", y1: String(y - 9), x2: "160", y2: String(y + 9), "class": "cl-circuit-wire" }));
    });
    svg.appendChild(encode);

    var errorGates = {};
    ERROR_ORDER.forEach(function (key, index) {
      var group = makeGate(doc, 325, key === "I" ? 132 : ys[index - 1], key === "I" ? "I" : "X", "");
      errorGates[key] = group;
      svg.appendChild(group);
    });

    var syndromeGates = makeSvgElement(doc, "g", { "class": "cl-syndrome-gates" });
    var syndromeTop = makeGate(doc, 467, 105, "?", "");
    var syndromeBottom = makeGate(doc, 515, 160, "?", "");
    syndromeGates.appendChild(syndromeTop);
    syndromeGates.appendChild(syndromeBottom);
    svg.appendChild(syndromeGates);

    var recoveryGates = {};
    ERROR_ORDER.forEach(function (key, index) {
      var group = makeGate(doc, 630, key === "I" ? 132 : ys[index - 1], key === "I" ? "I" : "X", "cl-circuit-recovery");
      recoveryGates[key] = group;
      svg.appendChild(group);
    });

    svg.appendChild(makeSvgElement(doc, "text", { x: "467", y: "235", "class": "cl-circuit-label", "text-anchor": "middle" }, "Z₁Z₂"));
    svg.appendChild(makeSvgElement(doc, "text", { x: "515", y: "235", "class": "cl-circuit-label", "text-anchor": "middle" }, "Z₂Z₃"));
    figure.appendChild(svg);
    figure.appendChild(makeElement(doc, "figcaption", "cl-circuit-caption", "电路图只显示阶段和校验逻辑；综合测量的是关联，不是数据 qubit 的逻辑内容。"));

    function setGroupVisibility(groups, selectedKey) {
      Object.keys(groups).forEach(function (key) {
        groups[key].setAttribute("opacity", key === selectedKey ? "1" : ".08");
      });
    }

    return {
      node: figure,
      update: function (stepIndex, errorKey) {
        stageBoxes.forEach(function (box, index) {
          box.classList.remove("cl-circuit-current", "cl-circuit-done");
          var stageNumber = index + 1;
          if (stepIndex === stageNumber) box.classList.add("cl-circuit-current");
          else if (stepIndex > stageNumber) box.classList.add("cl-circuit-done");
        });
        setGroupVisibility(errorGates, errorKey);
        setGroupVisibility(recoveryGates, stepIndex >= 4 ? errorKey : "__none__");
        var info = ERROR_INFO[errorKey];
        syndromeTop.querySelector(".cl-circuit-gate-text").textContent = stepIndex >= 3 ? info.syndrome[0] : "?";
        syndromeBottom.querySelector(".cl-circuit-gate-text").textContent = stepIndex >= 3 ? info.syndrome[1] : "?";
        syndromeTop.setAttribute("opacity", stepIndex >= 3 ? "1" : ".22");
        syndromeBottom.setAttribute("opacity", stepIndex >= 3 ? "1" : ".22");
      }
    };
  }

  function makeStateCard(doc) {
    var card = makeElement(doc, "section", "cl-state-card");
    card.setAttribute("aria-labelledby", "cl-qec-state-title");
    var stateTitle = makeElement(doc, "h3", "cl-card-title", "状态账本");
    stateTitle.id = "cl-qec-state-title";
    card.appendChild(stateTitle);
    var expression = makeElement(doc, "div", "cl-state-expression");
    expression.setAttribute("role", "img");
    expression.setAttribute("aria-label", "当前三比特状态");
    var status = makeElement(doc, "p", "cl-state-status");
    var definition = makeElement(doc, "dl", "cl-state-definition");
    var logicalTerm = makeElement(doc, "dd");
    var locationTerm = makeElement(doc, "dd");
    definition.appendChild(makeElement(doc, "dt", "", "逻辑信息"));
    definition.appendChild(logicalTerm);
    definition.appendChild(makeElement(doc, "dt", "", "错误位置"));
    definition.appendChild(locationTerm);
    card.appendChild(expression);
    card.appendChild(status);
    card.appendChild(definition);
    return {
      node: card,
      update: function (stepIndex, errorKey) {
        var info = ERROR_INFO[errorKey];
        if (stepIndex === 0) {
          expression.textContent = "|ψ⟩ = α|0⟩ + β|1⟩";
          status.textContent = "还没有把逻辑态放进代码空间。";
          logicalTerm.textContent = "未知的 α、β 保持为振幅";
          locationTerm.textContent = "尚未注入错误";
        } else if (stepIndex === 1) {
          expression.textContent = "|ψ_L⟩ = α|000⟩ + β|111⟩";
          status.textContent = "Encode 完成：三比特共享一个逻辑信息。";
          logicalTerm.textContent = "α、β 仍然只描述一个逻辑 qubit";
          locationTerm.textContent = "等待一个 X 错误";
        } else if (stepIndex === 2 || stepIndex === 3) {
          expression.textContent = info.state;
          status.textContent = stepIndex === 2 ? "Error 已注入；现在只看编码字的关联。" : "Syndrome 只暴露错误指纹，不测量逻辑内容。";
          logicalTerm.textContent = "α、β 没有出现在 syndrome 中";
          locationTerm.textContent = info.location;
        } else {
          expression.textContent = "" + info.correction + "·(" + info.state + ") = α|000⟩ + β|111⟩";
          status.textContent = "Correct 完成：理想模型中回到代码空间。";
          logicalTerm.textContent = "逻辑态恢复为 α|0⟩ + β|1⟩ 的编码版本";
          locationTerm.textContent = info.location + "；已施加 " + info.correction;
        }
      }
    };
  }

  function makeSyndromeCard(doc) {
    var card = makeElement(doc, "section", "cl-syndrome-card");
    card.setAttribute("aria-labelledby", "cl-qec-syndrome-title");
    var syndromeTitle = makeElement(doc, "h3", "cl-card-title", "综合测量");
    syndromeTitle.id = "cl-qec-syndrome-title";
    card.appendChild(syndromeTitle);
    var readout = makeElement(doc, "div", "cl-syndrome-readout");
    var top = makeElement(doc, "div", "cl-measurement");
    var bottom = makeElement(doc, "div", "cl-measurement");
    top.appendChild(makeElement(doc, "span", "cl-measurement-label", "Z₁Z₂"));
    bottom.appendChild(makeElement(doc, "span", "cl-measurement-label", "Z₂Z₃"));
    var topValue = makeElement(doc, "span", "cl-measurement-value", "?");
    var bottomValue = makeElement(doc, "span", "cl-measurement-value", "?");
    top.appendChild(topValue);
    bottom.appendChild(bottomValue);
    readout.appendChild(top);
    readout.appendChild(bottom);
    var summary = makeElement(doc, "p", "cl-syndrome-summary", "尚未测量。综合是错误的指纹，不是 α、β 的测量。");
    card.appendChild(readout);
    card.appendChild(summary);
    return {
      node: card,
      update: function (stepIndex, errorKey) {
        var info = ERROR_INFO[errorKey];
        topValue.textContent = stepIndex >= 3 ? info.syndrome[0] : "?";
        bottomValue.textContent = stepIndex >= 3 ? info.syndrome[1] : "?";
        if (stepIndex < 3) summary.textContent = "尚未测量。综合是错误的指纹，不是 α、β 的测量。";
        else if (stepIndex === 3) summary.textContent = "综合映射：I(++), X1(-+), X2(--), X3(+-)。当前读数只告诉我们错误位置。";
        else summary.textContent = "已按综合施加 " + info.correction + "；理想情况下逻辑信息保持不变。";
      }
    };
  }

  function makeMapCard(doc) {
    var card = makeElement(doc, "section", "cl-map-card");
    card.setAttribute("aria-labelledby", "cl-qec-map-title");
    var mapTitle = makeElement(doc, "h3", "cl-map-title", "综合映射表");
    mapTitle.id = "cl-qec-map-title";
    card.appendChild(mapTitle);
    var table = makeElement(doc, "table", "cl-syndrome-map");
    var caption = makeElement(doc, "caption", "cl-visually-hidden", "I(++), X1(-+), X2(--), X3(+-)");
    table.appendChild(caption);
    var head = makeElement(doc, "thead");
    var headRow = makeElement(doc, "tr");
    ["错误", "Z₁Z₂, Z₂Z₃", "恢复"].forEach(function (label) { headRow.appendChild(makeElement(doc, "th", "", label)); });
    head.appendChild(headRow);
    table.appendChild(head);
    var body = makeElement(doc, "tbody");
    var rows = {};
    ERROR_ORDER.forEach(function (key) {
      var info = ERROR_INFO[key];
      var row = makeElement(doc, "tr");
      row.appendChild(makeElement(doc, "td", "", key));
      row.appendChild(makeElement(doc, "td", "", "(" + info.syndrome[0] + info.syndrome[1] + ")"));
      row.appendChild(makeElement(doc, "td", "", info.correction));
      body.appendChild(row);
      rows[key] = row;
    });
    table.appendChild(body);
    card.appendChild(table);
    card.appendChild(makeElement(doc, "p", "cl-state-status", "约定：综合顺序为 (Z₁Z₂, Z₂Z₃)，+ 表示 +1 本征值，− 表示 −1 本征值。"));
    return {
      node: card,
      update: function (errorKey) {
        Object.keys(rows).forEach(function (key) {
          rows[key].classList.toggle("cl-map-selected", key === errorKey);
        });
      }
    };
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument || !root.appendChild) return;
    var doc = root.ownerDocument;
    try {
      injectStyles(doc);
      var shell = makeElement(doc, "section", "cl-lab cl-qec-lab");
      shell.setAttribute("aria-labelledby", "cl-qec-title");
      var title = makeElement(doc, "h2", "cl-lab-title", "三比特纠错台：用综合定位一次 bit-flip");
      title.id = "cl-qec-title";
      shell.appendChild(title);
      shell.appendChild(makeElement(doc, "p", "cl-lab-intro", "先选一个确定的错误，再按 Encode → Error → Syndrome → Correct 走完一遍。每一步都显示状态；没有随机噪声，也不会偷看逻辑振幅。"));

      var fieldset = makeElement(doc, "fieldset", "cl-error-fieldset");
      fieldset.appendChild(makeElement(doc, "legend", "", "选择错误（I / X₁ / X₂ / X₃）"));
      var radioList = makeElement(doc, "div", "cl-radio-list");
      var radioLabels = {};
      var radios = {};
      ERROR_ORDER.forEach(function (key, index) {
        var option = makeElement(doc, "div", "cl-radio-option");
        var input = makeElement(doc, "input");
        var id = "cl-qec-error-" + key.toLowerCase();
        input.type = "radio";
        input.name = "cl-qec-error";
        input.id = id;
        input.value = key;
        input.checked = index === 0;
        var label = makeElement(doc, "label", "", ERROR_INFO[key].label);
        label.htmlFor = id;
        option.appendChild(input);
        option.appendChild(label);
        radioList.appendChild(option);
        radioLabels[key] = option;
        radios[key] = input;
        input.addEventListener("change", function () {
          if (input.checked) {
            errorKey = key;
            if (currentStep > 1) currentStep = 1;
            render();
            announce("已选择 " + ERROR_INFO[key].label + "；可以从 Error 步骤继续。");
          }
        });
      });
      fieldset.appendChild(radioList);
      shell.appendChild(fieldset);

      var description = makeElement(doc, "p", "cl-qec-description");
      shell.appendChild(description);

      var stageControls = makeElement(doc, "div", "cl-qec-stage-controls");
      stageControls.setAttribute("role", "group");
      stageControls.setAttribute("aria-label", "三比特纠错步骤控制");
      var stageButtons = [];
      [1, 2, 3, 4].forEach(function (stageIndex) {
        var button = makeElement(doc, "button", "cl-qec-stage", STAGES[stageIndex].label);
        button.type = "button";
        button.setAttribute("aria-label", "执行 " + STAGES[stageIndex].title);
        button.addEventListener("click", function () {
          if (stageIndex <= currentStep + 1) {
            currentStep = stageIndex;
            render();
            announce("已完成 " + STAGES[stageIndex].label + "：" + STAGES[stageIndex].title);
          }
        });
        stageControls.appendChild(button);
        stageButtons.push(button);
      });
      shell.appendChild(stageControls);

      var circuit = makeCircuit(doc);
      var stateCard = makeStateCard(doc);
      var syndromeCard = makeSyndromeCard(doc);
      var qecGrid = makeElement(doc, "div", "cl-qec-grid");
      qecGrid.appendChild(circuit.node);
      var rightColumn = makeElement(doc, "div", "cl-qec-right-column");
      rightColumn.appendChild(stateCard.node);
      rightColumn.appendChild(syndromeCard.node);
      qecGrid.appendChild(rightColumn);
      shell.appendChild(qecGrid);

      var mapCard = makeMapCard(doc);
      shell.appendChild(mapCard.node);

      var boundary = makeElement(doc, "aside", "cl-qec-boundary");
      boundary.appendChild(makeElement(doc, "strong", "", "边界 / 反例："));
      boundary.appendChild(doc.createTextNode(" 这个三比特重复码只纠正一个 bit-flip（X）错误。它不能保护任意相位错误 Z；两个 bit-flip 也可能被多数表决误判。要同时处理 X、Z，需要相位码、Shor 码或其他完整量子纠错码。编码的是逻辑关联，不是对未知态的三次独立复制，因此没有违反不可克隆定理。"));
      shell.appendChild(boundary);

      var footer = makeElement(doc, "div", "cl-qec-footer");
      var footerGroup = makeElement(doc, "div", "cl-qec-footer-group");
      var back = makeElement(doc, "button", "cl-control", "← 上一步");
      var reset = makeElement(doc, "button", "cl-control", "重置");
      back.type = "button";
      reset.type = "button";
      footerGroup.appendChild(back);
      footerGroup.appendChild(reset);
      footer.appendChild(footerGroup);
      shell.appendChild(footer);
      var live = makeElement(doc, "p", "cl-live");
      live.setAttribute("aria-live", "polite");
      shell.appendChild(live);

      var currentStep = 0;
      var errorKey = "I";

      function announce(message) {
        live.textContent = message;
        if (api && typeof api.announce === "function") api.announce(root, message);
      }

      function render() {
        var stage = STAGES[currentStep];
        description.textContent = stage.description;
        stageButtons.forEach(function (button, index) {
          var stageIndex = index + 1;
          button.disabled = stageIndex > currentStep + 1;
          if (stageIndex === currentStep) button.setAttribute("aria-current", "step");
          else button.removeAttribute("aria-current");
          if (stageIndex < currentStep) button.classList.add("cl-stage-done");
          else button.classList.remove("cl-stage-done");
        });
        Object.keys(radioLabels).forEach(function (key) {
          radioLabels[key].classList.toggle("cl-radio-selected", key === errorKey);
          radios[key].checked = key === errorKey;
        });
        circuit.update(currentStep, errorKey);
        stateCard.update(currentStep, errorKey);
        syndromeCard.update(currentStep, errorKey);
        mapCard.update(errorKey);
        back.disabled = currentStep === 0;
      }

      back.addEventListener("click", function () {
        currentStep = Math.max(0, currentStep - 1);
        render();
        announce("返回到 " + STAGES[currentStep].label + "：" + STAGES[currentStep].title);
      });
      reset.addEventListener("click", function () {
        currentStep = 0;
        errorKey = "I";
        render();
        announce("已重置：请选择一个错误并从 Encode 开始。");
      });

      render();
      replaceContents(root, shell);
    } catch (error) {
      /* 保留 Markdown 的 no-JS fallback；运行时失败不应让整页失去内容。 */
    }
  }

  if (window.CourseLearning && typeof window.CourseLearning.register === "function") {
    window.CourseLearning.register("qec", function (root, api) {
      mount(root, api);
    });
  }
}());

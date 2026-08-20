(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("qec", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("qec self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("qec self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-qec-syndrome-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;
  var STYLE_TEXT = [
    ".cl-qec-syndrome-lab{--qec-blue:#315f9d;--qec-gold:#9b6a12;--qec-green:#39734d;--qec-red:#b64335;max-width:100%;min-width:0;color:var(--fg);line-height:1.55;}",
    ".cl-qec-syndrome-lab *,.cl-qec-syndrome-lab *::before,.cl-qec-syndrome-lab *::after{box-sizing:border-box;}",
    ".cl-qec-syndrome-lab [hidden]{display:none!important;}.cl-qec-syndrome-lab h2,.cl-qec-syndrome-lab h3{margin:0;color:var(--fg);}.cl-qec-syndrome-lab h2{font-size:1.25rem;}.cl-qec-syndrome-lab h3{font-size:1.05rem;}",
    ".cl-qec-syndrome-lab p{overflow-wrap:anywhere;}.cl-qec-syndrome-lab .qec-note,.cl-qec-syndrome-lab .qec-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65;}",
    ".cl-qec-syndrome-lab .qec-control-grid{display:grid;grid-template-columns:minmax(190px,.85fr) minmax(0,1.15fr);gap:14px;align-items:start;}.cl-qec-syndrome-lab .qec-field{display:grid;gap:6px;min-width:0;}.cl-qec-syndrome-lab .qec-field label,.cl-qec-syndrome-lab legend{color:var(--fg-soft);font-size:13px;font-weight:700;}.cl-qec-syndrome-lab select{width:100%;min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;}",
    ".cl-qec-syndrome-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}.cl-qec-syndrome-lab output{color:var(--accent);font-variant-numeric:tabular-nums;}",
    ".cl-qec-syndrome-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}.cl-qec-syndrome-lab button:hover{border-color:var(--accent);}.cl-qec-syndrome-lab button[aria-pressed=true],.cl-qec-syndrome-lab button.qec-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:700;}.cl-qec-syndrome-lab button:focus-visible,.cl-qec-syndrome-lab select:focus-visible,.cl-qec-syndrome-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
    ".cl-qec-syndrome-lab .qec-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--qec-gold);background:var(--bg);}.cl-qec-syndrome-lab .qec-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:9px;}.cl-qec-syndrome-lab .qec-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}.cl-qec-syndrome-lab .qec-actions>*{flex:1 1 150px;}.cl-qec-syndrome-lab .qec-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}.cl-qec-syndrome-lab .qec-pass{color:var(--qec-green);}.cl-qec-syndrome-lab .qec-warn{color:var(--qec-red);}",
    ".cl-qec-syndrome-lab .qec-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.cl-qec-syndrome-lab .qec-layout{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(240px,.9fr);gap:16px;align-items:start;}.cl-qec-syndrome-lab .qec-stage{min-width:0;padding:9px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}.cl-qec-syndrome-lab svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg);}.cl-qec-syndrome-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}",
    ".cl-qec-syndrome-lab .qec-wire{stroke:currentColor;stroke-width:1.5;stroke-opacity:.72;}.cl-qec-syndrome-lab .qec-stage-box{fill:var(--bg);stroke:var(--border);stroke-width:1.2;}.cl-qec-syndrome-lab .qec-gate{fill:var(--qec-blue);stroke:var(--bg);stroke-width:2;}.cl-qec-syndrome-lab .qec-phase-gate{fill:var(--qec-gold);stroke:var(--bg);stroke-width:2;}.cl-qec-syndrome-lab .qec-correction{fill:var(--qec-green);stroke:var(--bg);stroke-width:2;}.cl-qec-syndrome-lab .qec-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.72;}.cl-qec-syndrome-lab .qec-axis{stroke:currentColor;stroke-width:1.2;stroke-opacity:.7;}.cl-qec-syndrome-lab .qec-independent{fill:none;stroke:var(--qec-blue);stroke-width:3;}.cl-qec-syndrome-lab .qec-correlated{fill:none;stroke:var(--qec-red);stroke-width:3;stroke-dasharray:8 5;}.cl-qec-syndrome-lab .qec-point{fill:var(--qec-gold);stroke:var(--bg);stroke-width:2;}",
    ".cl-qec-syndrome-lab .qec-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:12px 0;}.cl-qec-syndrome-lab .qec-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.cl-qec-syndrome-lab .qec-metric:nth-child(1){border-top-color:var(--qec-blue);}.cl-qec-syndrome-lab .qec-metric:nth-child(2){border-top-color:var(--qec-gold);}.cl-qec-syndrome-lab .qec-metric:nth-child(3){border-top-color:var(--qec-green);}.cl-qec-syndrome-lab .qec-metric:nth-child(4){border-top-color:var(--qec-red);}.cl-qec-syndrome-lab .qec-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4;}.cl-qec-syndrome-lab .qec-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
    ".cl-qec-syndrome-lab .qec-ledger{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:14px;}.cl-qec-syndrome-lab table{width:100%;min-width:720px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.cl-qec-syndrome-lab th,.cl-qec-syndrome-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere;}.cl-qec-syndrome-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750;}.cl-qec-syndrome-lab .qec-selected{background:var(--bg);box-shadow:inset 3px 0 0 var(--qec-red);}.cl-qec-syndrome-lab .qec-callout{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--qec-green);background:var(--bg);font-size:13px;line-height:1.7;overflow-wrap:anywhere;}.cl-qec-syndrome-lab .qec-boundary{border-left-color:var(--qec-red);}.cl-qec-syndrome-lab .qec-formula{max-width:100%;overflow-x:auto;padding:9px 11px;border-left:3px solid var(--accent);background:var(--bg);font-family:\"SF Mono\",Menlo,Consolas,monospace;font-size:12px;line-height:1.65;}",
    "@media(max-width:800px){.cl-qec-syndrome-lab .qec-layout{grid-template-columns:minmax(0,1fr);}.cl-qec-syndrome-lab .qec-control-grid{grid-template-columns:minmax(0,1fr);}}",
    "@media(max-width:620px){.cl-qec-syndrome-lab .qec-choice-row{grid-template-columns:minmax(0,1fr);}.cl-qec-syndrome-lab .qec-stage{padding:6px;}.cl-qec-syndrome-lab table{font-size:11.5px;}.cl-qec-syndrome-lab th,.cl-qec-syndrome-lab td{padding-left:5px;padding-right:5px;}}",
    "@media(prefers-reduced-motion:reduce){.cl-qec-syndrome-lab *{animation:none!important;transition:none!important;}}"
  ].join("\n");

  var ERROR_DEFINITIONS = [
    { id: "I", label: "I（无错误）", bitMask: [0, 0, 0], phaseMask: [0, 0, 0], group: "无错误" },
    { id: "X1", label: "X₁（第 1 位）", bitMask: [1, 0, 0], phaseMask: [0, 0, 0], group: "单 bit-flip" },
    { id: "X2", label: "X₂（第 2 位）", bitMask: [0, 1, 0], phaseMask: [0, 0, 0], group: "单 bit-flip" },
    { id: "X3", label: "X₃（第 3 位）", bitMask: [0, 0, 1], phaseMask: [0, 0, 0], group: "单 bit-flip" },
    { id: "X1X2", label: "X₁X₂（双错）", bitMask: [1, 1, 0], phaseMask: [0, 0, 0], group: "双/三 bit-flip" },
    { id: "X1X3", label: "X₁X₃（双错）", bitMask: [1, 0, 1], phaseMask: [0, 0, 0], group: "双/三 bit-flip" },
    { id: "X2X3", label: "X₂X₃（双错）", bitMask: [0, 1, 1], phaseMask: [0, 0, 0], group: "双/三 bit-flip" },
    { id: "X1X2X3", label: "X₁X₂X₃（三错）", bitMask: [1, 1, 1], phaseMask: [0, 0, 0], group: "双/三 bit-flip" },
    { id: "Z1", label: "Z₁（相位错）", bitMask: [0, 0, 0], phaseMask: [1, 0, 0], group: "相位 / Pauli" },
    { id: "Z2", label: "Z₂（相位错）", bitMask: [0, 0, 0], phaseMask: [0, 1, 0], group: "相位 / Pauli" },
    { id: "Z3", label: "Z₃（相位错）", bitMask: [0, 0, 0], phaseMask: [0, 0, 1], group: "相位 / Pauli" },
    { id: "Y2", label: "Y₂（X+Z）", bitMask: [0, 1, 0], phaseMask: [0, 1, 0], group: "相位 / Pauli" }
  ];
  var ERROR_BY_ID = Object.create(null);
  ERROR_DEFINITIONS.forEach(function (definition) { ERROR_BY_ID[definition.id] = definition; });
  var CORRECTION_BY_SYNDROME = {
    "++": { id: "I", mask: [0, 0, 0] },
    "-+": { id: "X1", mask: [1, 0, 0] },
    "--": { id: "X2", mask: [0, 1, 0] },
    "+-": { id: "X3", mask: [0, 0, 1] }
  };

  function finite(value) { return typeof value === "number" && isFinite(value); }
  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || EPS) * scale;
  }
  function validateProbability(probability) {
    if (!finite(probability) || probability < 0 || probability > 1) throw new RangeError("p must be in [0, 1]");
    return probability;
  }
  function validateMask(mask) {
    if (!Array.isArray(mask) || mask.length !== 3 || mask.some(function (value) { return value !== 0 && value !== 1; })) {
      throw new RangeError("mask must contain three binary entries");
    }
    return mask.slice();
  }
  function xorMask(left, right) { return left.map(function (value, index) { return value ^ right[index]; }); }
  function maskString(mask) { return validateMask(mask).join(""); }
  function maskWeight(mask) { return validateMask(mask).reduce(function (total, value) { return total + value; }, 0); }
  function syndromeForMask(mask) {
    var values = validateMask(mask);
    return [values[0] ^ values[1] ? "−" : "+", values[1] ^ values[2] ? "−" : "+"];
  }
  function syndromeKey(syndrome) {
    return syndrome.map(function (value) { return value === "−" ? "-" : value; }).join("");
  }
  function definition(errorId) {
    if (!ERROR_BY_ID[errorId]) throw new RangeError("unknown error id");
    return ERROR_BY_ID[errorId];
  }
  function stateExpression(errorId) {
    var item = definition(errorId);
    var first = maskString(item.bitMask);
    var second = item.bitMask.map(function (value) { return value ? 0 : 1; }).join("");
    var sign = maskWeight(item.phaseMask) % 2 ? "−" : "+";
    return "α|" + first + "⟩ " + sign + " β|" + second + "⟩";
  }
  function analyzeError(errorId) {
    var item = definition(errorId);
    var syndrome = syndromeForMask(item.bitMask);
    var correction = CORRECTION_BY_SYNDROME[syndromeKey(syndrome)];
    var correctedBitMask = xorMask(item.bitMask, correction.mask);
    var logicalX = maskWeight(correctedBitMask) === 3;
    var phaseResidual = maskWeight(item.phaseMask) > 0;
    var logicalFailure = logicalX || phaseResidual;
    var outcome = logicalX && phaseResidual ? "逻辑 X 与相位残留" : logicalX ? "恢复后成为逻辑 X" : phaseResidual ? "相位分量未被纠正" : "回到代码空间";
    return {
      id: item.id,
      label: item.label,
      group: item.group,
      bitMask: item.bitMask.slice(),
      phaseMask: item.phaseMask.slice(),
      bitWeight: maskWeight(item.bitMask),
      phaseWeight: maskWeight(item.phaseMask),
      state: stateExpression(errorId),
      syndrome: syndrome,
      correction: correction.id,
      correctedBitMask: correctedBitMask,
      logicalX: logicalX,
      phaseResidual: phaseResidual,
      logicalFailure: logicalFailure,
      outcome: outcome,
      syndromeLeaksLogicalAmplitudes: false
    };
  }
  function independentLogicalFailure(probability) {
    var p = validateProbability(probability);
    return 3 * p * p * (1 - p) + p * p * p;
  }
  function independentBreakdown(probability) {
    var p = validateProbability(probability);
    var zero = Math.pow(1 - p, 3);
    var one = 3 * p * Math.pow(1 - p, 2);
    var two = 3 * p * p * (1 - p);
    var three = p * p * p;
    return { zero: zero, one: one, two: two, three: three, success: zero + one, failure: two + three };
  }
  function correlatedLogicalFailure(probability) { return validateProbability(probability); }
  function predictionAnswer(probability) {
    var p = validateProbability(probability);
    if (near(p, 0, 1e-12) || near(p, 0.5, 1e-12) || near(p, 1, 1e-12)) return "equal";
    return p < 0.5 ? "correlated" : "independent";
  }
  function formatValue(value, digits) {
    if (!finite(value)) return "∞";
    var places = digits === undefined ? 5 : digits;
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }
  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }
  function makeTable(api, headers, rows, label) {
    var table = api.el("table", { "aria-label": label });
    var head = api.el("thead");
    var headRow = api.el("tr");
    headers.forEach(function (header) { headRow.appendChild(api.el("th", { scope: "col" }, header)); });
    head.appendChild(headRow);
    table.appendChild(head);
    var body = api.el("tbody");
    rows.forEach(function (row) {
      var tableRow = api.el("tr");
      row.forEach(function (cell, index) { tableRow.appendChild(api.el(index === 0 ? "th" : "td", index === 0 ? { scope: "row" } : {}, cell)); });
      body.appendChild(tableRow);
    });
    table.appendChild(body);
    return table;
  }
  function circuitSvg(api, analysis, instance) {
    var titleId = "qec-circuit-title-" + instance;
    var descId = "qec-circuit-desc-" + instance;
    var svg = api.svg("svg", { viewBox: "0 0 760 290", role: "img", "aria-labelledby": titleId + " " + descId });
    svg.appendChild(api.svg("title", { id: titleId }, "三比特纠错 Encode Error Syndrome Correct 电路"));
    svg.appendChild(api.svg("desc", { id: descId }, "显示错误位、两个综合符号和恢复门；综合只取决于错误指纹。"));
    var ys = [78, 140, 202];
    [{ x: 140, w: 122, label: "Encode" }, { x: 315, w: 112, label: "Error" }, { x: 480, w: 126, label: "Syndrome" }, { x: 650, w: 112, label: "Correct" }].forEach(function (stage) {
      svg.appendChild(api.svg("rect", { x: stage.x - stage.w / 2, y: 36, width: stage.w, height: 202, className: "qec-stage-box" }));
      svg.appendChild(api.svg("text", { x: stage.x, y: 24, "text-anchor": "middle", "font-size": "13", "font-weight": "700" }, stage.label));
    });
    ys.forEach(function (y, index) {
      svg.appendChild(api.svg("line", { x1: 32, y1: y, x2: 724, y2: y, className: "qec-wire" }));
      svg.appendChild(api.svg("text", { x: 18, y: y + 4, "text-anchor": "middle", "font-size": "12" }, "q" + (index + 1)));
    });
    var encode = api.svg("g");
    encode.appendChild(api.svg("line", { x1: 140, y1: ys[0], x2: 140, y2: ys[2], className: "qec-wire" }));
    encode.appendChild(api.svg("circle", { cx: 140, cy: ys[0], r: 7, className: "qec-gate" }));
    [ys[1], ys[2]].forEach(function (y) {
      encode.appendChild(api.svg("circle", { cx: 140, cy: y, r: 13, className: "qec-gate" }));
      encode.appendChild(api.svg("line", { x1: 131, y1: y, x2: 149, y2: y, className: "qec-wire" }));
      encode.appendChild(api.svg("line", { x1: 140, y1: y - 9, x2: 140, y2: y + 9, className: "qec-wire" }));
    });
    svg.appendChild(encode);
    analysis.bitMask.forEach(function (value, index) {
      if (!value) return;
      var x = 315;
      svg.appendChild(api.svg("circle", { cx: x, cy: ys[index], r: 17, className: "qec-gate" }));
      svg.appendChild(api.svg("line", { x1: x - 8, y1: ys[index] - 8, x2: x + 8, y2: ys[index] + 8, className: "qec-wire" }));
      svg.appendChild(api.svg("line", { x1: x - 8, y1: ys[index] + 8, x2: x + 8, y2: ys[index] - 8, className: "qec-wire" }));
    });
    analysis.phaseMask.forEach(function (value, index) {
      if (!value) return;
      var phaseX = 350;
      svg.appendChild(api.svg("circle", { cx: phaseX, cy: ys[index], r: 13, className: "qec-phase-gate" }));
      svg.appendChild(api.svg("text", { x: phaseX, y: ys[index] + 5, "text-anchor": "middle", "font-size": "12", "font-weight": "700" }, "Z"));
    });
    svg.appendChild(api.svg("rect", { x: 459, y: 72, width: 42, height: 28, rx: 5, className: "qec-gate" }));
    svg.appendChild(api.svg("rect", { x: 459, y: 180, width: 42, height: 28, rx: 5, className: "qec-gate" }));
    svg.appendChild(api.svg("text", { x: 480, y: 91, "text-anchor": "middle", "font-size": "12", "font-weight": "700" }, analysis.syndrome[0]));
    svg.appendChild(api.svg("text", { x: 480, y: 199, "text-anchor": "middle", "font-size": "12", "font-weight": "700" }, analysis.syndrome[1]));
    svg.appendChild(api.svg("text", { x: 480, y: 260, "text-anchor": "middle", "font-size": "11" }, "S₁=Z₁Z₂   S₂=Z₂Z₃"));
    if (analysis.correction !== "I") {
      var correctionIndex = CORRECTION_BY_SYNDROME[syndromeKey(analysis.syndrome)].mask.indexOf(1);
      var correctionX = 650;
      svg.appendChild(api.svg("circle", { cx: correctionX, cy: ys[correctionIndex], r: 17, className: "qec-correction" }));
      svg.appendChild(api.svg("line", { x1: correctionX - 8, y1: ys[correctionIndex] - 8, x2: correctionX + 8, y2: ys[correctionIndex] + 8, className: "qec-wire" }));
      svg.appendChild(api.svg("line", { x1: correctionX - 8, y1: ys[correctionIndex] + 8, x2: correctionX + 8, y2: ys[correctionIndex] - 8, className: "qec-wire" }));
    }
    return svg;
  }
  function probabilitySvg(api, probability, instance) {
    var titleId = "qec-probability-title-" + instance;
    var descId = "qec-probability-desc-" + instance;
    var svg = api.svg("svg", { viewBox: "0 0 760 335", role: "img", "aria-labelledby": titleId + " " + descId });
    svg.appendChild(api.svg("title", { id: titleId }, "独立与全相关 bit-flip 逻辑失败率"));
    svg.appendChild(api.svg("desc", { id: descId }, "蓝线为独立错误 3p²(1-p)+p³，红色虚线为全相关三重错误 p。"));
    var left = 62;
    var top = 30;
    var width = 640;
    var height = 240;
    var bottom = top + height;
    var x = function (p) { return left + p / 0.5 * width; };
    var y = function (failure) { return bottom - failure / 0.5 * height; };
    [0, 0.25, 0.5].forEach(function (tick) {
      var lineY = y(tick);
      svg.appendChild(api.svg("line", { x1: left, y1: lineY, x2: left + width, y2: lineY, className: "qec-grid" }));
      svg.appendChild(api.svg("text", { x: left - 8, y: lineY + 4, "text-anchor": "end", "font-size": "11" }, String(tick)));
    });
    [0, 0.25, 0.5].forEach(function (tick) {
      var lineX = x(tick);
      svg.appendChild(api.svg("line", { x1: lineX, y1: top, x2: lineX, y2: bottom, className: "qec-grid" }));
      svg.appendChild(api.svg("text", { x: lineX, y: bottom + 22, "text-anchor": "middle", "font-size": "11" }, String(tick)));
    });
    svg.appendChild(api.svg("line", { x1: left, y1: top, x2: left, y2: bottom, className: "qec-axis" }));
    svg.appendChild(api.svg("line", { x1: left, y1: bottom, x2: left + width, y2: bottom, className: "qec-axis" }));
    var independentPath = "";
    var correlatedPath = "";
    for (var index = 0; index <= 50; index += 1) {
      var p = index / 100;
      independentPath += (index === 0 ? "M" : "L") + x(p) + "," + y(independentLogicalFailure(p));
      correlatedPath += (index === 0 ? "M" : "L") + x(p) + "," + y(correlatedLogicalFailure(p));
    }
    svg.appendChild(api.svg("path", { d: independentPath, className: "qec-independent" }));
    svg.appendChild(api.svg("path", { d: correlatedPath, className: "qec-correlated" }));
    svg.appendChild(api.svg("circle", { cx: x(probability), cy: y(independentLogicalFailure(probability)), r: 5, className: "qec-point" }));
    svg.appendChild(api.svg("circle", { cx: x(probability), cy: y(correlatedLogicalFailure(probability)), r: 5, className: "qec-point" }));
    svg.appendChild(api.svg("text", { x: left + width, y: 18, "text-anchor": "end", "font-size": "12" }, "p 与逻辑失败率"));
    svg.appendChild(api.svg("text", { x: left + 12, y: top + 18, "font-size": "11" }, "蓝：独立   红虚线：全相关"));
    return svg;
  }
  function appendErrorOptions(api, select) {
    var groups = Object.create(null);
    ERROR_DEFINITIONS.forEach(function (item) {
      if (!groups[item.group]) {
        groups[item.group] = api.el("optgroup", { label: item.group });
        select.appendChild(groups[item.group]);
      }
      groups[item.group].appendChild(api.el("option", { value: item.id }, item.label));
    });
  }
  function renderErrorLedger(api, selectedId) {
    var table = api.el("table", { "aria-label": "三比特错误综合与恢复账本" });
    var head = api.el("thead");
    var headRow = api.el("tr");
    ["错误", "X 位掩码", "综合 (S₁,S₂)", "恢复", "恢复后"].forEach(function (header) { headRow.appendChild(api.el("th", { scope: "col" }, header)); });
    head.appendChild(headRow);
    table.appendChild(head);
    var body = api.el("tbody");
    ERROR_DEFINITIONS.forEach(function (item) {
      var result = analyzeError(item.id);
      var row = api.el("tr", { className: item.id === selectedId ? "qec-selected" : "" });
      [item.id, maskString(item.bitMask), "(" + result.syndrome.join(",") + ")", result.correction, result.outcome].forEach(function (cell, index) {
        row.appendChild(api.el(index === 0 ? "th" : "td", index === 0 ? { scope: "row" } : {}, cell));
      });
      body.appendChild(row);
    });
    table.appendChild(body);
    return table;
  }
  function mount(root, api) {
    if (!root || !root.ownerDocument || !api || typeof api.el !== "function" || typeof api.svg !== "function") return;
    installStyles(root.ownerDocument);
    var instance = INSTANCE += 1;
    var state = { errorId: "X2", probability: 0.1, prediction: null, revealed: false };
    var shell = api.el("section", { className: "cl-qec-syndrome-lab", "aria-labelledby": "qec-title-" + instance });
    shell.appendChild(api.el("h2", { id: "qec-title-" + instance }, "三比特纠错台：综合只看错误指纹"));
    shell.appendChild(api.el("p", { className: "qec-note" }, "先选择一个确定的 Pauli 错误，再预测独立与相关噪声的逻辑失败率。实验只维护 α、β 的符号分支，不读取它们的数值。"));
    var controls = api.el("div", { className: "qec-control-grid" });
    var errorField = api.el("div", { className: "qec-field" });
    errorField.appendChild(api.el("label", { htmlFor: "qec-error-" + instance }, "错误情景"));
    var errorSelect = api.el("select", { id: "qec-error-" + instance, "aria-label": "选择量子错误情景" });
    appendErrorOptions(api, errorSelect);
    errorSelect.value = "X2";
    errorField.appendChild(errorSelect);
    controls.appendChild(errorField);
    var probabilityField = api.el("div", { className: "qec-field" });
    var probabilityLabel = api.el("label", { htmlFor: "qec-p-" + instance }, "每位 bit-flip 边缘概率 p");
    var probabilityOutput = api.el("output", { id: "qec-p-value-" + instance, htmlFor: "qec-p-" + instance }, "0.10");
    probabilityLabel.appendChild(api.el("span", {}, "（"));
    probabilityLabel.appendChild(probabilityOutput);
    probabilityLabel.appendChild(api.el("span", {}, "）"));
    var probabilityRange = api.el("input", { id: "qec-p-" + instance, type: "range", min: "0", max: "0.5", step: "0.01", value: "0.1", "aria-label": "每位独立 bit-flip 概率 p" });
    probabilityField.appendChild(probabilityLabel);
    probabilityField.appendChild(probabilityRange);
    controls.appendChild(probabilityField);
    shell.appendChild(controls);
    var prompt = api.el("div", { className: "qec-prompt" });
    var promptTitle = api.el("strong", {}, "");
    prompt.appendChild(promptTitle);
    var choices = api.el("div", { className: "qec-choice-row", role: "group", "aria-label": "相关错误逻辑失败率预测" });
    var choiceButtons = {};
    [["independent", "独立错误更高"], ["correlated", "全相关错误更高"], ["equal", "二者相等"]].forEach(function (item) {
      var button = api.el("button", { type: "button", "data-choice": item[0] }, item[1]);
      button.addEventListener("click", function () { state.prediction = item[0]; renderPrediction(); });
      choices.appendChild(button);
      choiceButtons[item[0]] = button;
    });
    prompt.appendChild(choices);
    var actions = api.el("div", { className: "qec-actions" });
    var check = api.el("button", { type: "button", className: "qec-primary" }, "核对预测");
    var reset = api.el("button", { type: "button" }, "重置");
    var feedback = api.el("p", { className: "qec-feedback" }, "先选一个预测。");
    actions.appendChild(check);
    actions.appendChild(reset);
    prompt.appendChild(actions);
    prompt.appendChild(feedback);
    shell.appendChild(prompt);
    var revealed = api.el("section", { className: "qec-revealed", hidden: true, "aria-live": "polite" });
    shell.appendChild(revealed);
    root.replaceChildren(shell);

    function renderPrediction() {
      Object.keys(choiceButtons).forEach(function (key) { choiceButtons[key].setAttribute("aria-pressed", state.prediction === key ? "true" : "false"); });
    }
    function renderResults(analysis, probability) {
      var breakdown = independentBreakdown(probability);
      revealed.replaceChildren();
      revealed.appendChild(api.el("h3", {}, "Encode → Error → Syndrome → Correct"));
      var metrics = api.el("div", { className: "qec-metrics" });
      [["当前错误", analysis.label], ["综合", "(" + analysis.syndrome.join(",") + ")"], ["恢复", analysis.correction], ["逻辑内容泄露", analysis.syndromeLeaksLogicalAmplitudes ? "是" : "否（0 bits）"]].forEach(function (item) {
        var metric = api.el("div", { className: "qec-metric" });
        metric.appendChild(api.el("span", {}, item[0]));
        metric.appendChild(api.el("strong", {}, item[1]));
        metrics.appendChild(metric);
      });
      revealed.appendChild(metrics);
      var layout = api.el("div", { className: "qec-layout" });
      var circuitStage = api.el("div", { className: "qec-stage" });
      circuitStage.appendChild(circuitSvg(api, analysis, instance));
      circuitStage.appendChild(api.el("p", { className: "qec-note" }, analysis.state + "；综合是错误的指纹，不是 α、β 的测量。"));
      layout.appendChild(circuitStage);
      var probabilityStage = api.el("div", { className: "qec-stage" });
      probabilityStage.appendChild(probabilitySvg(api, probability, instance));
      layout.appendChild(probabilityStage);
      revealed.appendChild(layout);
      revealed.appendChild(api.el("h3", {}, "错误综合账本"));
      revealed.appendChild(api.el("p", { className: "qec-note" }, "双错的综合会伪装成另一种单错：例如 X₁X₂ 的 (+,−) 与 X₃ 相同，按表施 X₃ 后留下 X₁X₂X₃=X_L。"));
      var errorLedger = api.el("div", { className: "qec-ledger" });
      errorLedger.appendChild(renderErrorLedger(api, analysis.id));
      revealed.appendChild(errorLedger);
      revealed.appendChild(api.el("h3", {}, "概率账本"));
      var probabilityLedger = api.el("div", { className: "qec-ledger" });
      probabilityLedger.appendChild(makeTable(api, ["噪声模型 / 事件", "概率", "是否逻辑失败"], [
        ["独立：恰好 0 错", formatValue(breakdown.zero, 6), "否"],
        ["独立：恰好 1 错", formatValue(breakdown.one, 6), "否"],
        ["独立：恰好 2 错", formatValue(breakdown.two, 6), "是：伪装单错后成为 X_L"],
        ["独立：恰好 3 错", formatValue(breakdown.three, 6), "是：综合为 ++，留下 X_L"],
        ["独立总失败", formatValue(breakdown.failure, 6), "3p²(1−p)+p³"],
        ["全相关：I / X₁X₂X₃", "1−p / " + formatValue(probability, 6), "失败率 = p"]
      ], "独立与相关错误概率账本"));
      revealed.appendChild(probabilityLedger);
      revealed.appendChild(api.el("p", { className: "qec-formula" }, "P_fail,ind(p)=3p²(1−p)+p³=" + formatValue(independentLogicalFailure(probability), 6) + "; P_fail,corr(p)=p=" + formatValue(correlatedLogicalFailure(probability), 6)));
      revealed.appendChild(api.el("div", { className: analysis.logicalFailure ? "qec-callout qec-boundary" : "qec-callout" }, "边界：本码只纠正一个 X bit-flip。Z 与两个 Z 稳定子对易，综合为 ++；Y 含 Z 分量，也不能被本码完整纠正。综合不泄露 α、β，但它只区分本码设计的错误集合。"));
      revealed.appendChild(api.el("div", { className: "qec-callout" }, "相关反例：令每位边缘 bit-flip 概率都为 p，但以概率 p 同时施加 X₁X₂X₃、否则施加 I。三位边缘仍都是 p，实际逻辑失败率却是 p，而不是独立公式；相关结构必须进入噪声模型。"));
    }
    function render() {
      state.errorId = errorSelect.value;
      state.probability = Number(probabilityRange.value);
      probabilityOutput.textContent = formatValue(state.probability, 2);
      promptTitle.textContent = "先预测：当前 p=" + formatValue(state.probability, 2) + " 时，哪条噪声模型的逻辑失败率更高？";
      var analysis = analyzeError(state.errorId);
      var correct = state.prediction && state.prediction === predictionAnswer(state.probability);
      renderPrediction();
      if (!state.revealed) {
        revealed.hidden = true;
        feedback.className = "qec-feedback";
        feedback.textContent = state.prediction ? "预测已记录，点击“核对预测”查看综合与概率账本。" : "先选一个预测。";
        return;
      }
      revealed.hidden = false;
      feedback.className = "qec-feedback " + (correct ? "qec-pass" : "qec-warn");
      feedback.textContent = (correct ? "预测命中。" : "预测未命中。") + " 当前错误的综合为 (" + analysis.syndrome.join(",") + ")。";
      renderResults(analysis, state.probability);
      if (api.announce) api.announce(root, feedback.textContent);
    }
    errorSelect.addEventListener("change", function () { state.prediction = null; state.revealed = false; render(); });
    probabilityRange.addEventListener("input", function () { state.prediction = null; state.revealed = false; render(); });
    check.addEventListener("click", function () {
      if (!state.prediction) {
        feedback.className = "qec-feedback qec-warn";
        feedback.textContent = "请先作出预测。";
        return;
      }
      state.revealed = true;
      render();
    });
    reset.addEventListener("click", function () {
      state.errorId = "X2";
      state.probability = 0.1;
      state.prediction = null;
      state.revealed = false;
      errorSelect.value = "X2";
      probabilityRange.value = "0.1";
      render();
    });
    render();
  }
  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    function assertThrows(fn, message) {
      var threw = false;
      try { fn(); } catch (error) { threw = true; }
      assert(threw, message);
    }
    assert(syndromeKey(syndromeForMask([0, 0, 0])) === "++", "no-error syndrome");
    assert(syndromeKey(syndromeForMask([0, 1, 0])) === "--", "X2 syndrome");
    assert(analyzeError("X1").correction === "X1" && !analyzeError("X1").logicalFailure, "single X1 corrected");
    assert(analyzeError("X2").correction === "X2" && !analyzeError("X2").logicalFailure, "single X2 corrected");
    assert(analyzeError("X3").correction === "X3" && !analyzeError("X3").logicalFailure, "single X3 corrected");
    assert(syndromeKey(analyzeError("X1X2").syndrome) === "+-", "double X1X2 mimics X3");
    assert(analyzeError("X1X2").correction === "X3", "double X1X2 gets X3 recovery");
    assert(analyzeError("X1X2").logicalX, "double X1X2 becomes logical X");
    assert(analyzeError("X1X3").logicalX && analyzeError("X2X3").logicalX, "all double errors become logical X");
    assert(syndromeKey(analyzeError("X1X2X3").syndrome) === "++" && analyzeError("X1X2X3").logicalX, "triple error hides as no error");
    assert(syndromeKey(analyzeError("Z2").syndrome) === "++" && analyzeError("Z2").phaseResidual, "phase error invisible to syndrome");
    assert(syndromeKey(analyzeError("Y2").syndrome) === "--" && analyzeError("Y2").phaseResidual, "Y keeps phase residual");
    assert(analyzeError("X2").syndromeLeaksLogicalAmplitudes === false, "syndrome does not inspect amplitudes");
    assert(near(independentLogicalFailure(0), 0, 1e-12), "independent p=0");
    assert(near(independentLogicalFailure(0.1), 0.028, 1e-12), "independent p=.1 formula");
    assert(near(independentLogicalFailure(1), 1, 1e-12), "independent p=1");
    assert(near(correlatedLogicalFailure(0.1), 0.1, 1e-12), "correlated p=.1 counterexample");
    assert(predictionAnswer(0.1) === "correlated", "correlated model is higher below p=.5");
    assert(predictionAnswer(0.8) === "independent", "independent model is higher above p=.5");
    assert(predictionAnswer(0) === "equal" && predictionAnswer(0.5) === "equal" && predictionAnswer(1) === "equal", "prediction crossings");
    assertThrows(function () { independentLogicalFailure(-0.1); }, "reject negative p");
    assertThrows(function () { correlatedLogicalFailure(1.1); }, "reject p above one");
    return { checks: checks, presets: ERROR_DEFINITIONS.length };
  }
  return {
    ERROR_DEFINITIONS: ERROR_DEFINITIONS.slice(),
    syndromeForMask: syndromeForMask,
    analyzeError: analyzeError,
    independentLogicalFailure: independentLogicalFailure,
    independentBreakdown: independentBreakdown,
    correlatedLogicalFailure: correlatedLogicalFailure,
    predictionAnswer: predictionAnswer,
    mount: mount,
    selfTest: selfTest
  };
});

(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("canonical-field-modes", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("canonical-field-modes self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("canonical-field-modes self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-canonical-field-modes-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;

  var PRESETS = [
    { id: "vacuum", label: "真空：所有 q=0", mass: 1, length: 2 * Math.PI, cutoff: 4, profile: "vacuum" },
    { id: "one-particle", label: "单模激发：n=1", mass: 1, length: 2 * Math.PI, cutoff: 4, profile: "one" },
    { id: "low-band", label: "低频有限波包", mass: 0.75, length: 2 * Math.PI, cutoff: 5, profile: "packet" }
  ];
  var DEFAULT = {
    presetId: "one-particle",
    mass: 1,
    length: 2 * Math.PI,
    cutoff: 4,
    profile: "one"
  };

  var STYLE_TEXT = [
    ".cfm-lab{--cfm-blue:var(--cl-blue,#315f9d);--cfm-gold:var(--cl-gold,#9b6a12);--cfm-green:var(--cl-green,#39734d);--cfm-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;}",
    ".cfm-lab *,.cfm-lab *::before,.cfm-lab *::after{box-sizing:border-box;}.cfm-lab [hidden]{display:none!important;}.cfm-lab h3,.cfm-lab h4{margin:0;color:var(--fg);}.cfm-lab h3{font-size:1.18rem;}.cfm-lab h4{margin-top:16px;font-size:1rem;}",
    ".cfm-lab button,.cfm-lab input{font:inherit;}.cfm-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}.cfm-lab button:hover{border-color:var(--accent);}.cfm-lab button[aria-pressed='true'],.cfm-lab button.cfm-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:700;}.cfm-lab button:disabled{cursor:not-allowed;opacity:.55;}.cfm-lab button:focus-visible,.cfm-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
    ".cfm-lab .cfm-note,.cfm-lab .cfm-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65;overflow-wrap:anywhere;}.cfm-lab .cfm-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--cfm-gold);background:var(--bg);}.cfm-lab fieldset{min-width:0;margin:0;padding:0;border:0;}.cfm-lab legend{margin-bottom:8px;color:var(--fg-soft);font-size:13px;font-weight:750;}.cfm-lab .cfm-question-list{display:grid;gap:12px;}.cfm-lab .cfm-question{min-width:0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);}.cfm-lab .cfm-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}.cfm-lab .cfm-choice-grid button{font-size:12px;}.cfm-lab .cfm-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}.cfm-lab .cfm-actions>*{flex:1 1 170px;}.cfm-lab .cfm-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}.cfm-lab .cfm-pass{color:var(--cfm-green);}.cfm-lab .cfm-warn{color:var(--cfm-red);}",
    ".cfm-lab .cfm-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.cfm-lab .cfm-layout{display:grid;grid-template-columns:minmax(210px,.72fr) minmax(0,1.28fr);gap:16px;align-items:start;min-width:0;}.cfm-lab .cfm-controls,.cfm-lab .cfm-stage{min-width:0;}.cfm-lab .cfm-controls{display:grid;gap:12px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}.cfm-lab .cfm-control{display:grid;gap:5px;min-width:0;}.cfm-lab .cfm-control label,.cfm-lab .cfm-control-title{color:var(--fg-soft);font-size:13px;font-weight:700;}.cfm-lab .cfm-control output{color:var(--accent);font-variant-numeric:tabular-nums;}.cfm-lab .cfm-control input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}.cfm-lab .cfm-scale{display:flex;justify-content:space-between;gap:8px;color:var(--fg-soft);font-size:11px;}.cfm-lab .cfm-preset-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;}.cfm-lab .cfm-preset-grid button{font-size:12px;}",
    ".cfm-lab .cfm-stage-frame{min-width:0;padding:9px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}.cfm-lab .cfm-stage-title{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin:0 0 8px;color:var(--fg-soft);font-size:13px;}.cfm-lab .cfm-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg);}.cfm-lab .cfm-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.cfm-lab .cfm-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.68;}.cfm-lab .cfm-axis{stroke:currentColor;stroke-width:1.2;stroke-opacity:.72;}.cfm-lab .cfm-zero{fill:var(--cfm-blue);}.cfm-lab .cfm-exc{fill:var(--cfm-gold);}.cfm-lab .cfm-cutoff{stroke:var(--cfm-red);stroke-width:2;stroke-dasharray:6 4;}",
    ".cfm-lab .cfm-legend{display:flex;flex-wrap:wrap;gap:8px 14px;margin:8px 0 0;color:var(--fg-soft);font-size:12px;}.cfm-lab .cfm-legend span{display:inline-flex;align-items:center;gap:5px;}.cfm-lab .cfm-swatch{display:inline-block;width:18px;height:3px;background:currentColor;}.cfm-lab .cfm-swatch-blue{color:var(--cfm-blue);}.cfm-lab .cfm-swatch-gold{color:var(--cfm-gold);}.cfm-lab .cfm-swatch-red{color:var(--cfm-red);}.cfm-lab .cfm-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(122px,1fr));gap:8px;margin:12px 0;}.cfm-lab .cfm-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.cfm-lab .cfm-metric:nth-child(1),.cfm-lab .cfm-metric:nth-child(4){border-top-color:var(--cfm-blue);}.cfm-lab .cfm-metric:nth-child(2),.cfm-lab .cfm-metric:nth-child(5){border-top-color:var(--cfm-gold);}.cfm-lab .cfm-metric:nth-child(3),.cfm-lab .cfm-metric:nth-child(6){border-top-color:var(--cfm-red);}.cfm-lab .cfm-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4;}.cfm-lab .cfm-metric strong{display:block;margin-top:3px;color:var(--fg);font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
    ".cfm-lab .cfm-table-wrap{max-width:100%;margin-top:10px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.cfm-lab table{width:100%;min-width:760px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.cfm-lab th,.cfm-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere;}.cfm-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750;}.cfm-lab .cfm-interpretation{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--cfm-green);background:var(--bg);font-size:13px;line-height:1.7;overflow-wrap:anywhere;}",
    "@media(max-width:900px){.cfm-lab .cfm-layout{grid-template-columns:minmax(0,1fr);}}@media(max-width:760px){.cfm-lab .cfm-choice-grid{grid-template-columns:minmax(0,1fr);}.cfm-lab .cfm-preset-grid{grid-template-columns:minmax(0,1fr);}}@media(max-width:420px){.cfm-lab .cfm-stage-frame{padding:6px;}.cfm-lab table{font-size:11.5px;}.cfm-lab th,.cfm-lab td{padding-left:5px;padding-right:5px;}}@media(prefers-reduced-motion:reduce){.cfm-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || EPS) * scale;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function presetById(id) {
    for (var index = 0; index < PRESETS.length; index += 1) {
      if (PRESETS[index].id === id) return PRESETS[index];
    }
    return PRESETS[0];
  }

  function presetState(preset) {
    return {
      presetId: preset.id,
      mass: preset.mass,
      length: preset.length,
      cutoff: preset.cutoff,
      profile: preset.profile
    };
  }

  function degeneracy(n) {
    return n === 0 ? 1 : 2;
  }

  function occupationVector(n, count, profile) {
    var values = [];
    for (var index = 0; index < count; index += 1) values.push(0);
    if (profile === "one" && n === 1 && count > 0) values[0] = 1;
    if (profile === "packet") {
      if (n === 0 && count > 0) values[0] = 1;
      if (n === 1 && count > 0) values[0] = 1;
      if (n === 2 && count > 0) values[0] = 1;
    }
    return values;
  }

  function sum(values) {
    return values.reduce(function (total, value) { return total + value; }, 0);
  }

  function compute(spec) {
    var options = spec || {};
    var preset = presetById(options.presetId || DEFAULT.presetId);
    var mass = options.mass === undefined ? preset.mass : Number(options.mass);
    var length = options.length === undefined ? preset.length : Number(options.length);
    var cutoff = options.cutoff === undefined ? preset.cutoff : Math.round(Number(options.cutoff));
    var profile = options.profile === undefined ? preset.profile : options.profile;
    if (!finite(mass) || mass <= 0) throw new RangeError("mass must be positive");
    if (!finite(length) || length <= 0) throw new RangeError("length must be positive");
    if (!finite(cutoff) || cutoff < 0 || cutoff > 12) throw new RangeError("cutoff must be in [0, 12]");
    if (["vacuum", "one", "packet"].indexOf(profile) === -1) throw new RangeError("unknown occupation profile");

    var modes = [];
    var zeroPoint = 0;
    var excitation = 0;
    var total = 0;
    for (var n = 0; n <= cutoff; n += 1) {
      var k = 2 * Math.PI * n / length;
      var omega = Math.sqrt(k * k + mass * mass);
      var count = degeneracy(n);
      var occupations = occupationVector(n, count, profile);
      var levels = occupations.map(function (occupation) { return (occupation + 0.5) * omega; });
      var zeroShell = 0.5 * count * omega;
      var excitationShell = sum(occupations) * omega;
      var totalShell = zeroShell + excitationShell;
      modes.push({
        n: n,
        k: k,
        omega: omega,
        degeneracy: count,
        occupations: occupations,
        levels: levels,
        zeroPoint: zeroShell,
        excitation: excitationShell,
        total: totalShell
      });
      zeroPoint += zeroShell;
      excitation += excitationShell;
      total += totalShell;
    }
    return {
      label: options.presetId === "custom" ? "自定义" : preset.label,
      preset: preset,
      mass: mass,
      length: length,
      cutoff: cutoff,
      profile: profile,
      modes: modes,
      modeCount: 1 + 2 * cutoff,
      cutoffMomentum: 2 * Math.PI * cutoff / length,
      zeroPoint: zeroPoint,
      excitation: excitation,
      total: total,
      identityResidual: Math.abs(total - zeroPoint - excitation),
      lastZeroPoint: modes[modes.length - 1].zeroPoint,
      lastExcitation: modes[modes.length - 1].excitation
    };
  }

  function format(value, digits) {
    if (!finite(value)) return "—";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) < 0.0005 && value !== 0) return value.toExponential(Math.min(places, 4));
    var text = value.toFixed(places);
    return text.indexOf(".") === -1 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function formatOccupations(values) {
    return "[" + values.join(",") + "]";
  }

  function formatLevels(values) {
    return values.map(function (value) { return format(value, 5); }).join(", ");
  }

  function profileLabel(profile) {
    return profile === "vacuum" ? "真空 q=0" : profile === "one" ? "n=1 单模占据" : "n=0,1,2 低频有限占据";
  }

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function appendChildren(node, children) {
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
    });
    return node;
  }

  function element(doc, tag, attrs, children) {
    return appendChildren(setAttributes(doc.createElement(tag), attrs || {}), children || []);
  }

  function svgElement(doc, tag, attrs, children) {
    return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}), children || []);
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function metric(doc, label) {
    var value = element(doc, "strong", {}, ["—"]);
    return { node: element(doc, "div", { className: "cfm-metric" }, [element(doc, "span", {}, [label]), value]), value: value };
  }

  function table(doc, label, headers) {
    return element(doc, "table", { "aria-label": label }, [
      element(doc, "thead", {}, [element(doc, "tr", {}, headers.map(function (header) { return element(doc, "th", { scope: "col" }, [header]); }))]),
      element(doc, "tbody", {}, [])
    ]);
  }

  function replaceRows(target, rows) {
    var body = target.querySelector("tbody");
    clear(body);
    rows.forEach(function (row) {
      body.appendChild(element(target.ownerDocument, "tr", {}, row.map(function (value) {
        return element(target.ownerDocument, "td", {}, [value]);
      })));
    });
  }

  function drawSvg(doc, svg, data, uid) {
    clear(svg);
    svg.setAttribute("aria-labelledby", uid + "-svg-title " + uid + "-svg-desc");
    svg.appendChild(svgElement(doc, "title", { id: uid + "-svg-title" }, ["有限模式的零点项与占据项堆叠图"]));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-svg-desc" }, ["每个 n 壳的蓝色部分是零点项，金色部分是占据项；横轴到 cutoff 为止。"]));
    var left = 46;
    var right = 676;
    var top = 46;
    var bottom = 260;
    var maximum = Math.max(1, Math.max.apply(null, data.modes.map(function (mode) { return mode.total; })) * 1.18);
    var mapY = function (value) { return bottom - (bottom - top) * value / maximum; };
    svg.appendChild(svgElement(doc, "text", { x: left, y: 23, "font-size": 12, "font-weight": 700 }, ["H_K 的模式分账：蓝 E₀，金 E_exc"]));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, class: "cfm-axis" }, []));
    [0, maximum / 2, maximum].forEach(function (value) {
      var y = mapY(value);
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: y, x2: right, y2: y, class: "cfm-grid" }, []));
      svg.appendChild(svgElement(doc, "text", { x: left - 8, y: y + 4, "text-anchor": "end", "font-size": 10 }, [format(value, 1)]));
    });
    var group = (right - left) / data.modes.length;
    data.modes.forEach(function (mode, index) {
      var x = left + group * index + group * 0.2;
      var width = group * 0.6;
      var zeroY = mapY(mode.zeroPoint);
      var totalY = mapY(mode.total);
      svg.appendChild(svgElement(doc, "rect", { x: x, y: zeroY, width: width, height: bottom - zeroY, class: "cfm-zero" }, []));
      svg.appendChild(svgElement(doc, "rect", { x: x, y: totalY, width: width, height: zeroY - totalY, class: "cfm-exc" }, []));
      svg.appendChild(svgElement(doc, "text", { x: x + width / 2, y: bottom + 17, "text-anchor": "middle", "font-size": 10 }, ["n=" + mode.n]));
      svg.appendChild(svgElement(doc, "text", { x: x + width / 2, y: totalY - 6, "text-anchor": "middle", "font-size": 10 }, [format(mode.total, 2)]));
    });
    var cutoffX = left + group * (data.modes.length - 0.5);
    svg.appendChild(svgElement(doc, "line", { x1: cutoffX, y1: top, x2: cutoffX, y2: bottom, class: "cfm-cutoff" }, []));
    svg.appendChild(svgElement(doc, "text", { x: cutoffX + 5, y: top + 12, "font-size": 10 }, ["K=" + data.cutoff]));
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument || !root.appendChild) return;
    var doc = root.ownerDocument;
    installStyles(doc);
    INSTANCE += 1;
    var uid = "cl-cfm-" + INSTANCE;
    var shell = element(doc, "div", { className: "cfm-lab" }, []);
    var state = presetState(presetById(DEFAULT.presetId));
    var prediction = { oscillator: null, cutoff: null, boundary: null, antiparticle: null };
    var revealed = false;
    var score = 0;
    var refs = {};
    root.replaceChildren(shell);

    function announce(message) {
      if (api && typeof api.announce === "function") api.announce(root, message);
    }

    function complete() {
      return Object.keys(prediction).every(function (key) { return prediction[key] !== null; });
    }

    function addQuestion(container, key, prompt, options) {
      var fieldset = element(doc, "fieldset", { className: "cfm-question" }, [element(doc, "legend", {}, [prompt])]);
      var row = element(doc, "div", { className: "cfm-choice-grid", role: "group", "aria-label": prompt }, []);
      options.forEach(function (option) {
        var button = element(doc, "button", { type: "button", "aria-pressed": prediction[key] === option.value ? "true" : "false", disabled: revealed }, [option.label]);
        button.addEventListener("click", function () {
          if (revealed) return;
          prediction[key] = option.value;
          renderShell();
        });
        row.appendChild(button);
      });
      fieldset.appendChild(row);
      container.appendChild(fieldset);
    }

    function buildPrediction() {
      shell.appendChild(element(doc, "h3", {}, ["正则量子化分账台：有限盒、有限模式、有限声称"]));
      shell.appendChild(element(doc, "p", { className: "cfm-note" }, [revealed ? "预测已提交；现在可以调节质量、盒长、cutoff 与占据 profile。" : "先判断每一项能量和模型边界，再打开确定的模式账本。"]));
      shell.appendChild(element(doc, "div", { className: "cfm-prompt" }, [revealed ? "蓝色是零点项，金色是占据项；本模型是自由实标量场的有限正则化桥梁，不是相互作用 QFT 的非微扰构造。" : "预测门：把谐振子能级、占据数、零点能和 cutoff 分开。"]));
      var questions = element(doc, "div", { className: "cfm-question-list" }, []);
      addQuestion(questions, "oscillator", "1 · 每个独立实模式的能级怎样写？", [
        { value: "level", label: "E=(q+1/2)ω" }, { value: "classical", label: "E=qω，无零点项" }, { value: "linear", label: "E=q+ω/2 与 q 无关" }
      ]);
      addQuestion(questions, "cutoff", "2 · 增大 cutoff 时，哪笔账通常显式变化？", [
        { value: "zero", label: "零点项 E₀(K)" }, { value: "none", label: "所有总能量不变" }, { value: "particle", label: "每个已占据 q 自动变大" }
      ]);
      addQuestion(questions, "boundary", "3 · 这个有限模型的正确定位是？", [
        { value: "bridge", label: "自由场的调节桥梁" }, { value: "nonperturbative", label: "相互作用 QFT 的非微扰构造" }, { value: "continuum", label: "已经完成连续极限" }
      ]);
      addQuestion(questions, "antiparticle", "4 · 实标量场的 a† 产生什么？", [
        { value: "neutral", label: "同一种中性粒子" }, { value: "pair", label: "自动产生独立反粒子" }, { value: "charge", label: "一个带电粒子" }
      ]);
      shell.appendChild(questions);
      var actions = element(doc, "div", { className: "cfm-actions" }, []);
      var check = element(doc, "button", { type: "button", className: "cfm-primary", disabled: revealed || !complete() }, [revealed ? "已提交，账本已揭示" : "提交预测并揭示"]);
      check.addEventListener("click", function () {
        if (!complete()) return;
        var answers = { oscillator: "level", cutoff: "zero", boundary: "bridge", antiparticle: "neutral" };
        score = Object.keys(answers).reduce(function (total, key) { return total + (prediction[key] === answers[key] ? 1 : 0); }, 0);
        revealed = true;
        renderShell();
        announce("预测已提交，有限模式、零点和 cutoff 账本已揭示。");
      });
      var reset = element(doc, "button", { type: "button" }, [revealed ? "重新预测" : "重置"]);
      reset.addEventListener("click", resetToGate);
      actions.appendChild(check);
      actions.appendChild(reset);
      shell.appendChild(actions);
      var feedback = !complete() ? "请为四个判断各选一项。" : revealed ? "预测已提交，" + score + "/4 命中。" : "四项预测已记录，点击提交后才会显示模式表。";
      shell.appendChild(element(doc, "p", { className: "cfm-feedback " + (revealed ? (score === 4 ? "cfm-pass" : "cfm-warn") : ""), "aria-live": "polite" }, [feedback]));
    }

    function addRange(container, key, label, minimum, maximum, step, formatter) {
      var id = uid + "-" + key;
      var output = element(doc, "output", { for: id }, [""]);
      var input = element(doc, "input", { id: id, type: "range", min: String(minimum), max: String(maximum), step: String(step), value: String(state[key]), "aria-label": label }, []);
      input.addEventListener("input", function () {
        state[key] = clamp(Number(input.value), minimum, maximum);
        state.presetId = "custom";
        renderResults();
      });
      container.appendChild(element(doc, "div", { className: "cfm-control" }, [
        element(doc, "label", { htmlFor: id }, [label + " = ", output]), input,
        element(doc, "div", { className: "cfm-scale" }, [element(doc, "span", {}, [formatter(minimum)]), element(doc, "span", {}, [formatter((minimum + maximum) / 2)]), element(doc, "span", {}, [formatter(maximum)])])
      ]));
      return { input: input, output: output };
    }

    function buildControls() {
      var controls = element(doc, "section", { className: "cfm-controls", "aria-labelledby": uid + "-controls" }, [element(doc, "h4", { id: uid + "-controls" }, ["揭示后的参数"])]);
      refs.mass = addRange(controls, "mass", "质量 m", 0.5, 2, 0.25, function (value) { return format(value, 2); });
      refs.length = addRange(controls, "length", "盒长 L", 4, 12, 0.5, function (value) { return format(value, 1); });
      refs.cutoff = addRange(controls, "cutoff", "模式 cutoff K", 0, 8, 1, function (value) { return String(Math.round(value)); });
      var presetSet = element(doc, "fieldset", {}, [element(doc, "legend", {}, ["教学预设"])]);
      var presetGrid = element(doc, "div", { className: "cfm-preset-grid" }, []);
      PRESETS.forEach(function (preset) {
        var button = element(doc, "button", { type: "button", "aria-pressed": preset.id === state.presetId ? "true" : "false" }, [preset.label]);
        button.addEventListener("click", function () {
          state = presetState(preset);
          renderResults();
          announce("已切换到" + preset.label + "。");
        });
        presetGrid.appendChild(button);
      });
      presetSet.appendChild(presetGrid);
      controls.appendChild(presetSet);
      controls.appendChild(element(doc, "p", { className: "cfm-note" }, ["实场的 n>0 shell 用两个独立实模式计数；q 向量逐个振子列出，零点项是每个振子的 ω/2。"]));
      var reset = element(doc, "button", { type: "button" }, ["重新预测"]);
      reset.addEventListener("click", resetToGate);
      controls.appendChild(reset);
      return controls;
    }

    function buildStage() {
      var stage = element(doc, "section", { className: "cfm-stage", "aria-labelledby": uid + "-stage" }, []);
      refs.svg = svgElement(doc, "svg", { class: "cfm-svg", width: "720", height: "320", viewBox: "0 0 720 320", role: "img" }, []);
      stage.appendChild(element(doc, "div", { className: "cfm-stage-frame" }, [
        element(doc, "div", { className: "cfm-stage-title" }, [element(doc, "span", { id: uid + "-stage" }, ["零点项与占据项的 cutoff 分账"]), element(doc, "span", {}, ["蓝：E₀；金：E_exc；红虚线：K"])]),
        refs.svg,
        element(doc, "div", { className: "cfm-legend" }, [element(doc, "span", {}, [element(doc, "i", { className: "cfm-swatch cfm-swatch-blue" }, []), "零点项"]), element(doc, "span", {}, [element(doc, "i", { className: "cfm-swatch cfm-swatch-gold" }, []), "占据项"]), element(doc, "span", {}, [element(doc, "i", { className: "cfm-swatch cfm-swatch-red" }, []), "cutoff"])])
      ]));
      refs.metrics = [metric(doc, "独立实振子 M_K"), metric(doc, "cutoff K"), metric(doc, "零点 E₀(K)"), metric(doc, "占据 E_exc(K)"), metric(doc, "总 H_K"), metric(doc, "对账残差")];
      stage.appendChild(element(doc, "div", { className: "cfm-metrics" }, refs.metrics.map(function (item) { return item.node; })));
      stage.appendChild(element(doc, "h4", {}, ["cutoff / 零点 / 占据总账"]));
      refs.ledgerTable = table(doc, "有限模式总账", ["账本项", "数值", "读法"]);
      stage.appendChild(element(doc, "div", { className: "cfm-table-wrap" }, [refs.ledgerTable]));
      stage.appendChild(element(doc, "h4", {}, ["每个模式的谐振子能级与占据数"]));
      refs.modeTable = table(doc, "有限实模式逐项账本", ["n", "g_n", "|k_n|", "ω_n", "q_{n,r}", "能级 (q+1/2)ω", "E₀ 壳", "E_exc 壳", "合计"]);
      stage.appendChild(element(doc, "div", { className: "cfm-table-wrap" }, [refs.modeTable]));
      refs.interpretation = element(doc, "p", { className: "cfm-interpretation", "aria-live": "polite" }, [""]);
      stage.appendChild(refs.interpretation);
      return stage;
    }

    function renderResults() {
      if (!revealed) return;
      var data = compute(state);
      refs.mass.input.value = String(data.mass);
      refs.mass.output.textContent = format(data.mass, 2);
      refs.length.input.value = String(data.length);
      refs.length.output.textContent = format(data.length, 2);
      refs.cutoff.input.value = String(data.cutoff);
      refs.cutoff.output.textContent = String(data.cutoff);
      refs.metrics[0].value.textContent = String(data.modeCount);
      refs.metrics[1].value.textContent = String(data.cutoff);
      refs.metrics[2].value.textContent = format(data.zeroPoint, 6);
      refs.metrics[3].value.textContent = format(data.excitation, 6);
      refs.metrics[4].value.textContent = format(data.total, 6);
      refs.metrics[5].value.textContent = format(data.identityResidual, 3);
      drawSvg(doc, refs.svg, data, uid);
      replaceRows(refs.ledgerTable, [
        ["盒与 cutoff", "L=" + format(data.length, 5) + "；K=" + data.cutoff + "；Λ=" + format(data.cutoffMomentum, 5), "有限盒、有限模式；M_K=1+2K=" + data.modeCount],
        ["质量与 profile", "m=" + format(data.mass, 5) + "；" + profileLabel(data.profile), "自由实标量场的确定占据规则"],
        ["零点项", format(data.zeroPoint, 10), "E₀(K)=1/2 Σ g_nω_n；随 cutoff 改变"],
        ["占据项", format(data.excitation, 10), "E_exc(K)=Σ q_{n,r}ω_n；由占据数逐项决定"],
        ["总哈密顿量", format(data.total, 10), "H_K=E₀(K)+E_exc(K)"],
        ["代数残差", format(data.identityResidual, 10), "H_K−E₀(K)−E_exc(K)=0"],
        ["最后一壳增量", "ΔE₀=" + format(data.lastZeroPoint, 8) + "；ΔE_exc=" + format(data.lastExcitation, 8), "把 cutoff 账分到新增 shell"]
      ]);
      replaceRows(refs.modeTable, data.modes.map(function (mode) {
        return [String(mode.n), String(mode.degeneracy), format(mode.k, 5), format(mode.omega, 7), formatOccupations(mode.occupations), formatLevels(mode.levels), format(mode.zeroPoint, 7), format(mode.excitation, 7), format(mode.total, 7)];
      }));
      refs.interpretation.textContent = data.label + "：有限盒内共有 " + data.modeCount + " 个独立实振子，当前 cutoff Λ=" + format(data.cutoffMomentum, 5) + "。零点项、占据项和总能量逐项相加且残差为零；这只验证自由、有限、受监管模型的正则量子化账本，不是相互作用 QFT 的非微扰构造。";
    }

    function buildRevealed() {
      var panel = element(doc, "section", { className: "cfm-revealed" }, [element(doc, "h4", {}, ["结果与透明账本"]), element(doc, "p", { className: "cfm-note" }, ["调节 cutoff 会新增实模式和零点项；调节 profile 只改变占据项。改变盒长会移动离散动量和每个谐振子的频率。"])]);
      panel.appendChild(element(doc, "div", { className: "cfm-layout" }, [buildControls(), buildStage()]));
      shell.appendChild(panel);
      renderResults();
    }

    function renderShell() {
      refs = {};
      shell.replaceChildren();
      buildPrediction();
      if (revealed) buildRevealed();
    }

    function resetToGate() {
      state = presetState(presetById(DEFAULT.presetId));
      prediction = { oscillator: null, cutoff: null, boundary: null, antiparticle: null };
      revealed = false;
      score = 0;
      renderShell();
      announce("已重置；请重新完成有限场模式预测。");
    }

    renderShell();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }

    var vacuum = compute(presetState(PRESETS[0]));
    assert(vacuum.modeCount === 9, "vacuum mode count");
    assert(vacuum.modes.length === 5, "vacuum shell count");
    assert(vacuum.modes[0].degeneracy === 1 && vacuum.modes[1].degeneracy === 2, "real mode degeneracy");
    assert(near(vacuum.modes[1].k, 1, 1e-12), "L=2pi momentum");
    assert(near(vacuum.excitation, 0, 1e-12), "vacuum excitation zero");
    assert(vacuum.zeroPoint > 0, "vacuum zero point positive");
    assert(near(vacuum.identityResidual, 0, 1e-12), "vacuum ledger identity");

    var one = compute(presetState(PRESETS[1]));
    assert(one.modes[1].occupations[0] === 1, "one particle occupation");
    assert(one.modes[1].occupations[1] === 0, "one particle does not double count real partner");
    assert(near(one.excitation, one.modes[1].omega, 1e-12), "one particle excitation energy");
    one.modes.forEach(function (mode) {
      assert(mode.levels.length === mode.degeneracy, "level count for n=" + mode.n);
      mode.levels.forEach(function (level, index) {
        assert(near(level, (mode.occupations[index] + 0.5) * mode.omega, 1e-12), "oscillator level n=" + mode.n);
      });
      assert(near(mode.total, mode.zeroPoint + mode.excitation, 1e-12), "shell ledger n=" + mode.n);
    });

    var smallerCutoff = compute({ presetId: "custom", mass: 1, length: 2 * Math.PI, cutoff: 2, profile: "one" });
    var largerCutoff = compute({ presetId: "custom", mass: 1, length: 2 * Math.PI, cutoff: 4, profile: "one" });
    assert(largerCutoff.zeroPoint > smallerCutoff.zeroPoint, "zero point grows with cutoff");
    assert(near(largerCutoff.excitation, smallerCutoff.excitation, 1e-12), "fixed occupied mode excitation stable after cutoff");
    var zeroCutoff = compute({ presetId: "custom", mass: 1, length: 2 * Math.PI, cutoff: 0, profile: "one" });
    assert(near(zeroCutoff.excitation, 0, 1e-12), "occupied n=1 excluded by cutoff");

    var packet = compute(presetState(PRESETS[2]));
    assert(packet.excitation > one.excitation, "packet has more finite occupation");
    assert(packet.modes[0].occupations[0] === 1 && packet.modes[2].occupations[0] === 1, "packet profile deterministic");
    PRESETS.forEach(function (preset) {
      var data = compute(presetState(preset));
      assert(finite(data.total) && finite(data.cutoffMomentum), preset.id + " finite regulated totals");
      assert(near(data.identityResidual, 0, 1e-12), preset.id + " total ledger identity");
    });
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    DEFAULT: DEFAULT,
    PRESETS: PRESETS,
    degeneracy: degeneracy,
    occupationVector: occupationVector,
    compute: compute,
    mount: mount,
    selfTest: selfTest
  };
});

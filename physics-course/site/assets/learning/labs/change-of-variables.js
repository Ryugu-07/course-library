(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("change-of-variables", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("change-of-variables self-test: PASS (" + report.checks + " checks)\n");
    } catch (error) {
      process.stderr.write("change-of-variables self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var PI = Math.PI;
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-change-of-variables-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;
  var DEFAULT = { presetId: "polar-disk", radius: 1 };
  var PRESETS = [
    { id: "identity", label: "恒等：一一对应", mode: "identity", radius: 1 },
    { id: "reflection", label: "反射：J<0", mode: "reflection", radius: 1 },
    { id: "polar-disk", label: "极坐标：一圈", mode: "polar", turns: 1, radius: 1 },
    { id: "polar-double", label: "极坐标：两圈", mode: "polar", turns: 2, radius: 1 }
  ];

  var STYLE_TEXT = [
    ".cov-lab{--cov-blue:var(--cl-blue,#315f9d);--cov-gold:var(--cl-gold,#9b6a12);--cov-green:var(--cl-green,#39734d);--cov-red:var(--cl-red,#b64335);--cov-soft:var(--fg-soft,#6f6a60);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
    ".cov-lab *,.cov-lab *::before,.cov-lab *::after{box-sizing:border-box;}.cov-lab [hidden]{display:none!important;}.cov-lab h3,.cov-lab h4{margin:0;color:var(--fg);letter-spacing:0;}.cov-lab h3{font-size:1.18rem;}.cov-lab h4{font-size:1rem;}",
    ".cov-lab .cov-note,.cov-lab .cov-feedback{color:var(--cov-soft);font-size:13px;line-height:1.7;}.cov-lab .cov-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--cov-gold);background:var(--bg);}.cov-lab fieldset{min-width:0;margin:0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);}.cov-lab legend{max-width:100%;padding:0 4px;color:var(--cov-soft);font-size:13px;line-height:1.5;}.cov-lab .cov-question-list{display:grid;gap:10px;}.cov-lab .cov-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}",
    ".cov-lab button,.cov-lab input{font:inherit;}.cov-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}.cov-lab button:hover{border-color:var(--accent);}.cov-lab button[aria-pressed=\"true\"],.cov-lab button.cov-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}.cov-lab button:disabled{cursor:not-allowed;opacity:.55;}.cov-lab button:focus-visible,.cov-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}.cov-lab .cov-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}.cov-lab .cov-actions>*{flex:1 1 170px;}.cov-lab .cov-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}.cov-lab .cov-pass{color:var(--cov-green);}.cov-lab .cov-warn{color:var(--cov-red);}",
    ".cov-lab .cov-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.cov-lab .cov-preset-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:10px 0 12px;}.cov-lab .cov-preset-grid button{font-size:12px;}.cov-lab .cov-controls{display:grid;grid-template-columns:minmax(0,1fr) minmax(210px,1.35fr);gap:12px;align-items:end;}.cov-lab .cov-control{display:grid;gap:5px;min-width:0;}.cov-lab .cov-control label{color:var(--cov-soft);font-size:13px;font-weight:700;}.cov-lab .cov-control output{color:var(--accent);font-variant-numeric:tabular-nums;}.cov-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}",
    ".cov-lab .cov-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:13px 0;}.cov-lab .cov-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.cov-lab .cov-metric:nth-child(5n+1){border-top-color:var(--cov-blue);}.cov-lab .cov-metric:nth-child(5n+2){border-top-color:var(--cov-gold);}.cov-lab .cov-metric:nth-child(5n+3){border-top-color:var(--cov-green);}.cov-lab .cov-metric:nth-child(5n+4){border-top-color:var(--cov-red);}.cov-lab .cov-metric:nth-child(5n){border-top-color:var(--accent);}.cov-lab .cov-metric span{display:block;color:var(--cov-soft);font-size:11.5px;line-height:1.4;}.cov-lab .cov-metric strong{display:block;margin-top:3px;font-size:14px;line-height:1.45;overflow-wrap:anywhere;font-variant-numeric:tabular-nums;}",
    ".cov-lab .cov-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch;}.cov-lab .cov-svg{display:block;width:100%;min-width:650px;height:auto;color:var(--fg);}.cov-lab .cov-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.cov-lab .cov-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.65;}.cov-lab .cov-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.72;}.cov-lab .cov-domain{fill:var(--cov-blue);fill-opacity:.13;stroke:var(--cov-blue);stroke-width:2;}.cov-lab .cov-image{fill:var(--cov-green);fill-opacity:.16;stroke:var(--cov-green);stroke-width:2;}.cov-lab .cov-ray{stroke:var(--cov-gold);stroke-width:1.4;stroke-opacity:.75;}.cov-lab .cov-reflect{fill:var(--cov-red);fill-opacity:.14;stroke:var(--cov-red);stroke-width:2;}.cov-lab .cov-title{font-size:13px;font-weight:750;}.cov-lab .cov-label{font-size:11px;}",
    ".cov-lab .cov-table-wrap{max-width:100%;margin-top:13px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.cov-lab table{width:100%;min-width:700px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.cov-lab caption{padding:0 0 7px;text-align:left;color:var(--cov-soft);font-size:12px;}.cov-lab th,.cov-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;}.cov-lab th{color:var(--cov-soft);font-size:11.5px;font-weight:750;}.cov-lab .cov-interpretation{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--cov-green);background:var(--bg);font-size:13px;line-height:1.7;}",
    "@media(max-width:900px){.cov-lab .cov-preset-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.cov-lab .cov-controls{grid-template-columns:minmax(0,1fr);}.cov-lab .cov-metrics{grid-template-columns:repeat(3,minmax(0,1fr));}}@media(max-width:640px){.cov-lab .cov-choice-grid,.cov-lab .cov-preset-grid,.cov-lab .cov-metrics{grid-template-columns:minmax(0,1fr);}.cov-lab .cov-frame{padding:5px;}}@media(prefers-reduced-motion:reduce){.cov-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
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

  function findPreset(id) {
    return PRESETS.filter(function (preset) { return preset.id === id; })[0] || PRESETS[0];
  }

  function normalizeConfig(input) {
    var source = input || {};
    var preset = findPreset(source.presetId || DEFAULT.presetId);
    var radius = Number(source.radius);
    if (!finite(radius)) radius = preset.radius || DEFAULT.radius;
    return {
      presetId: preset.id,
      mode: preset.mode,
      turns: preset.mode === "polar" ? (preset.turns || 1) : 1,
      radius: clamp(radius, 0.25, 2.5)
    };
  }

  function mapPoint(mode, first, second) {
    if (mode === "polar") return [first * Math.cos(second), first * Math.sin(second)];
    if (mode === "reflection") return [-first, second];
    return [first, second];
  }

  function jacobian(mode, first) {
    if (mode === "polar") return first;
    return mode === "reflection" ? -1 : 1;
  }

  function coverageMultiplicity(config) {
    return config.mode === "polar" ? config.turns : 1;
  }

  function polarDiskArea(radius) {
    return PI * radius * radius;
  }

  function compute(input) {
    var config = normalizeConfig(input);
    var signed;
    var absolute;
    var imageArea;
    var multiplicity;
    var reading;
    if (config.mode === "polar") {
      imageArea = polarDiskArea(config.radius);
      multiplicity = coverageMultiplicity(config);
      signed = multiplicity * imageArea;
      absolute = signed;
      reading = multiplicity === 1 ? "几乎处处一一；原点/接缝是零测集例外" : "圆盘内部几乎处处二重覆盖";
    } else {
      imageArea = 1;
      multiplicity = 1;
      signed = jacobian(config.mode, 0);
      absolute = Math.abs(signed);
      reading = config.mode === "reflection" ? "一一对应，但方向反转" : "一一对应且方向保持";
    }
    return {
      config: config,
      signedJacobianIntegral: signed,
      absoluteJacobianIntegral: absolute,
      imageArea: imageArea,
      multiplicity: multiplicity,
      correctedArea: absolute / multiplicity,
      coverageReading: reading,
      samplePoints: samplePoints(config),
      rows: [
        { label: "有向 Jacobian 账", value: signed, note: "保留方向符号" },
        { label: "绝对 Jacobian 账", value: absolute, note: "普通面积积分" },
        { label: "像域一次面积", value: imageArea, note: "目标区域只数一次" },
        { label: "覆盖重数", value: multiplicity, note: reading },
        { label: "按重数校正", value: absolute / multiplicity, note: "参数账 ÷ 重数" }
      ]
    };
  }

  function samplePoints(config) {
    var points = [];
    var index;
    var angle;
    if (config.mode === "polar") {
      for (index = 1; index <= 8; index += 1) {
        angle = (2 * PI * index) / 8;
        points.push(mapPoint("polar", config.radius * 0.78, angle));
      }
      return points;
    }
    [[0, 0], [1, 0], [1, 1], [0, 1]].forEach(function (point) {
      points.push(mapPoint(config.mode, point[0], point[1]));
    });
    return points;
  }

  function format(value, digits) {
    if (value === null || value === undefined || !finite(value)) return "—";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.0005) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function appendChildren(node, children) {
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
    });
    return node;
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
    if (!doc || !doc.head || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function metric(doc, label, value) {
    return element(doc, "div", { className: "cov-metric" }, [
      element(doc, "span", {}, [label]),
      element(doc, "strong", {}, [value])
    ]);
  }

  function tableElement(doc, captionText, headers, rows) {
    var head = element(doc, "tr", {}, headers.map(function (header) {
      return element(doc, "th", { scope: "col" }, [header]);
    }));
    var body = element(doc, "tbody", {}, rows.map(function (row) {
      return element(doc, "tr", {}, row.map(function (cell, index) {
        return element(doc, index === 0 ? "th" : "td", index === 0 ? { scope: "row" } : {}, [cell]);
      }));
    }));
    return element(doc, "table", {}, [
      element(doc, "caption", {}, [captionText]),
      element(doc, "thead", {}, [head]),
      body
    ]);
  }

  function svgText(doc, x, y, text, attrs) {
    var merged = { x: x, y: y, className: "cov-label" };
    Object.keys(attrs || {}).forEach(function (key) { merged[key] = attrs[key]; });
    return svgElement(doc, "text", merged, [text]);
  }

  function drawSvg(doc, result, uid) {
    var svg = svgElement(doc, "svg", {
      className: "cov-svg",
      viewBox: "0 0 760 310",
      role: "img",
      "aria-labelledby": uid + "-title " + uid + "-desc"
    }, []);
    svg.appendChild(svgElement(doc, "title", { id: uid + "-title" }, ["换元 Jacobian 与覆盖账本"]));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-desc" }, [
      "左侧示意参数域，右侧示意像域；下方文字标出有向、绝对值和覆盖重数的区别。"
    ]));
    svg.appendChild(svgText(doc, 45, 28, "参数域 U", { className: "cov-title" }));
    svg.appendChild(svgText(doc, 445, 28, "像域 T(U)", { className: "cov-title" }));
    svg.appendChild(svgElement(doc, "line", { x1: 35, y1: 155, x2: 335, y2: 155, className: "cov-grid" }));
    svg.appendChild(svgElement(doc, "line", { x1: 430, y1: 155, x2: 700, y2: 155, className: "cov-grid" }));
    if (result.config.mode === "polar") {
      svg.appendChild(svgElement(doc, "rect", { x: 55, y: 70, width: 250, height: 170, className: "cov-domain" }));
      svg.appendChild(svgText(doc, 180, 260, "r × θ（" + result.config.turns + " 圈）", { "text-anchor": "middle" }));
      svg.appendChild(svgElement(doc, "circle", { cx: 565, cy: 155, r: 82, className: "cov-image" }));
      result.samplePoints.forEach(function (point) {
        var px = 565 + point[0] / Math.max(result.config.radius, 0.25) * 82;
        var py = 155 - point[1] / Math.max(result.config.radius, 0.25) * 82;
        svg.appendChild(svgElement(doc, "line", { x1: 565, y1: 155, x2: px, y2: py, className: "cov-ray" }));
        svg.appendChild(svgElement(doc, "circle", { cx: px, cy: py, r: 3, className: "cov-image" }));
      });
      svg.appendChild(svgText(doc, 565, 260, "圆盘：πR²，原点为退化点", { "text-anchor": "middle" }));
    } else {
      var className = result.config.mode === "reflection" ? "cov-reflect" : "cov-domain";
      svg.appendChild(svgElement(doc, "polygon", {
        points: "55,235 55,75 305,75 305,235",
        className: className
      }));
      var mapped = result.samplePoints.map(function (point) {
        return (result.config.mode === "reflection" ? 565 - point[0] * 82 : 480 + point[0] * 82) + "," + (235 - point[1] * 160);
      }).join(" ");
      svg.appendChild(svgElement(doc, "polygon", {
        points: mapped,
        className: result.config.mode === "reflection" ? "cov-reflect" : "cov-image"
      }));
      svg.appendChild(svgText(doc, 180, 260, "单位正方形", { "text-anchor": "middle" }));
      svg.appendChild(svgText(doc, 565, 260, result.config.mode === "reflection" ? "反射后的正方形" : "同一正方形", { "text-anchor": "middle" }));
    }
    svg.appendChild(svgText(doc, 380, 294, "J 的符号看方向；|J| 看面积；重数看参数域是否重复计数", { "text-anchor": "middle" }));
    return svg;
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
    var status = root.querySelector("[data-cov-status]");
    if (status) status.textContent = message;
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    installStyles(doc);
    var uid = "cov-" + (++INSTANCE);
    var state = { presetId: DEFAULT.presetId, radius: DEFAULT.radius };
    var prediction = { sign: null, origin: null, cover: null };
    var revealed = false;
    var score = 0;
    var shell = element(doc, "div", { className: "cov-lab" }, []);
    clear(root);
    root.appendChild(shell);

    function addPrediction(list, key, legendText, options) {
      var fieldset = element(doc, "fieldset", {}, []);
      fieldset.appendChild(element(doc, "legend", {}, [legendText]));
      var grid = element(doc, "div", { className: "cov-choice-grid" }, []);
      options.forEach(function (option) {
        var button = element(doc, "button", {
          type: "button",
          "aria-pressed": prediction[key] === option.value ? "true" : "false",
          disabled: revealed
        }, [option.label]);
        button.addEventListener("click", function () {
          if (!revealed) {
            prediction[key] = option.value;
            renderGate();
          }
        });
        grid.appendChild(button);
      });
      fieldset.appendChild(grid);
      list.appendChild(fieldset);
    }

    function complete() {
      return prediction.sign !== null && prediction.origin !== null && prediction.cover !== null;
    }

    function renderGate() {
      clear(shell);
      shell.appendChild(element(doc, "h3", {}, ["换元三账：方向、面积与覆盖"]));
      shell.appendChild(element(doc, "p", { className: "cov-note" }, [
        revealed
          ? "预测已提交；现在可以切换映射和半径，检查同一套账本如何重算。"
          : "先判断符号、原点和两圈覆盖；提交前不显示数值图与账本。"
      ]));
      shell.appendChild(element(doc, "div", { className: "cov-prompt" }, [
        revealed
          ? "当前输出是 f≡1 的有限 toy 计算：它展示公式的记账结构，不替代换元定理的正则性假设。"
          : "预测门：普通面积、极坐标的零测集退化、覆盖重数分别判断。"
      ]));
      var questions = element(doc, "div", { className: "cov-question-list" }, []);
      addPrediction(questions, "sign", "1 · 反射映射的普通面积账？", [
        { value: "signed", label: "使用 J=-1" },
        { value: "absolute", label: "使用 |J|=1" },
        { value: "zero", label: "面积为 0" }
      ]);
      addPrediction(questions, "origin", "2 · 极坐标原点退化？", [
        { value: "break", label: "公式失效" },
        { value: "null", label: "零测集例外" },
        { value: "double", label: "整盘重复" }
      ]);
      addPrediction(questions, "cover", "3 · 两圈极坐标多算几次？", [
        { value: "one", label: "一次" },
        { value: "two", label: "两次" },
        { value: "none", label: "没有覆盖" }
      ]);
      shell.appendChild(questions);
      var actions = element(doc, "div", { className: "cov-actions" }, []);
      var reveal = element(doc, "button", {
        type: "button",
        className: "cov-primary",
        disabled: revealed || !complete()
      }, [revealed ? "账本已揭示" : "提交预测并揭示"]);
      reveal.addEventListener("click", function () {
        if (!complete()) return;
        score = (prediction.sign === "absolute" ? 1 : 0) + (prediction.origin === "null" ? 1 : 0) + (prediction.cover === "two" ? 1 : 0);
        revealed = true;
        renderGate();
        announce(api, root, "预测已提交；换元账本已揭示。");
      });
      var reset = element(doc, "button", { type: "button" }, [revealed ? "重新预测" : "重置"]);
      reset.addEventListener("click", resetToGate);
      actions.appendChild(reveal);
      actions.appendChild(reset);
      shell.appendChild(actions);
      shell.appendChild(element(doc, "p", {
        className: "cov-feedback " + (revealed ? (score === 3 ? "cov-pass" : "cov-warn") : ""),
        "aria-live": "polite",
        "data-cov-status": true
      }, [
        !complete() ? "请为三个判断各选一项。" : revealed ? "预测得分 " + score + "/3；下面显示三本积分账。" : "三项预测已记录，点击提交后才显示结果。"
      ]));
      if (revealed) buildResults();
    }

    function buildResults() {
      var panel = element(doc, "section", { className: "cov-revealed" }, [
        element(doc, "h4", {}, ["结果与透明账本"]),
        element(doc, "p", { className: "cov-note" }, ["恒等/反射使用单位正方形；极坐标使用半径 R 的参数域。绝对 Jacobian 账除以覆盖重数后才与像域一次面积比较。"])
      ]);
      var presetGrid = element(doc, "div", { className: "cov-preset-grid" }, []);
      PRESETS.forEach(function (preset) {
        var button = element(doc, "button", {
          type: "button",
          "aria-pressed": state.presetId === preset.id ? "true" : "false"
        }, [preset.label]);
        button.addEventListener("click", function () {
          state.presetId = preset.id;
          renderGate();
        });
        presetGrid.appendChild(button);
      });
      panel.appendChild(presetGrid);
      var controls = element(doc, "div", { className: "cov-controls" }, []);
      var radiusId = uid + "-radius";
      var radiusOutput = element(doc, "output", { for: radiusId }, [format(state.radius, 2)]);
      var radiusInput = element(doc, "input", {
        id: radiusId,
        type: "range",
        min: "0.25",
        max: "2.5",
        step: "0.05",
        value: String(state.radius),
        "aria-label": "极坐标半径"
      });
      radiusInput.addEventListener("input", function () {
        state.radius = Number(radiusInput.value);
        radiusOutput.textContent = format(state.radius, 2);
        renderResults();
      });
      controls.appendChild(element(doc, "div", { className: "cov-control" }, [
        element(doc, "label", { htmlFor: radiusId }, ["极坐标半径 R = ", radiusOutput]), radiusInput
      ]));
      controls.appendChild(element(doc, "p", { className: "cov-note" }, ["恒等/反射模式中半径滑块不改变单位正方形账本。"]));
      panel.appendChild(controls);
      var stage = element(doc, "div", { className: "cov-stage" }, []);
      panel.appendChild(stage);
      shell.appendChild(panel);

      function renderResults() {
        var result = compute(state);
        clear(stage);
        stage.appendChild(element(doc, "div", { className: "cov-metrics" }, [
          metric(doc, "∫J（有向）", format(result.signedJacobianIntegral, 4)),
          metric(doc, "∫|J|", format(result.absoluteJacobianIntegral, 4)),
          metric(doc, "像域面积", format(result.imageArea, 4)),
          metric(doc, "覆盖重数", String(result.multiplicity)),
          metric(doc, "校正后", format(result.correctedArea, 4))
        ]));
        var frame = element(doc, "div", { className: "cov-frame" }, []);
        frame.appendChild(drawSvg(doc, result, uid));
        frame.appendChild(element(doc, "p", { className: "cov-note" }, [result.coverageReading + "。当前曲线是有限 toy 的可视化，不是一般换元定理的证明。"]));
        stage.appendChild(frame);
        stage.appendChild(element(doc, "div", { className: "cov-table-wrap" }, [
          tableElement(doc, "Jacobain / 覆盖账本（f≡1）", ["项目", "数值", "解释"], result.rows.map(function (row) {
            return [row.label, format(row.value, 5), row.note];
          }))
        ]));
        stage.appendChild(element(doc, "p", { className: "cov-interpretation", "aria-live": "polite" }, [
          result.config.mode === "reflection"
            ? "反射的 J 为负只表示方向翻转；普通面积仍取 |J|。"
            : result.config.mode === "polar" && result.multiplicity > 1
              ? "两圈极坐标的参数积分是像域面积的两倍；覆盖重数校正不是数值误差，而是映射结构。"
              : "普通面积使用绝对 Jacobian；极坐标一圈只在原点/接缝等零测集处失去逐点一一对应。"
        ]));
      }
      renderResults();
    }

    function resetToGate() {
      state = { presetId: DEFAULT.presetId, radius: DEFAULT.radius };
      prediction = { sign: null, origin: null, cover: null };
      revealed = false;
      score = 0;
      renderGate();
      announce(api, root, "换元实验已重置；请重新完成三个预测。");
    }

    renderGate();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    var identity = compute({ presetId: "identity" });
    assert(near(jacobian("identity", 0.4), 1), "identity Jacobian");
    assert(near(identity.signedJacobianIntegral, 1), "identity signed area");
    assert(near(identity.absoluteJacobianIntegral, 1), "identity absolute area");
    assert(near(identity.correctedArea, identity.imageArea), "identity area correction");
    var reflection = compute({ presetId: "reflection" });
    assert(near(jacobian("reflection", 0.4), -1), "reflection Jacobian sign");
    assert(near(reflection.signedJacobianIntegral, -1), "reflection signed area");
    assert(near(reflection.absoluteJacobianIntegral, 1), "reflection ordinary area");
    var polar = compute({ presetId: "polar-disk", radius: 1.4 });
    assert(near(jacobian("polar", 0), 0), "polar origin Jacobian");
    assert(near(jacobian("polar", 0.7), 0.7), "polar radial Jacobian");
    assert(near(polar.imageArea, PI * 1.4 * 1.4), "polar disk area");
    assert(polar.multiplicity === 1, "one-turn covering multiplicity");
    var double = compute({ presetId: "polar-double", radius: 1.4 });
    assert(double.multiplicity === 2, "two-turn covering multiplicity");
    assert(near(double.absoluteJacobianIntegral, 2 * double.imageArea), "two-turn parameter area");
    assert(near(double.correctedArea, double.imageArea), "two-turn corrected area");
    assert(mapPoint("polar", 0, 1.23)[0] === 0 && mapPoint("polar", 0, 1.23)[1] === 0, "polar origin map");
    assert(compute({ presetId: "polar-disk", radius: 99 }).config.radius === 2.5, "radius clamp");
    assert(compute({ presetId: "polar-disk" }).rows.length === 5, "nonempty ledger rows");
    assert(JSON.stringify(compute({ presetId: "polar-double" }).samplePoints) === JSON.stringify(compute({ presetId: "polar-double" }).samplePoints), "deterministic samples");
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    DEFAULT: DEFAULT,
    PRESETS: PRESETS,
    normalizeConfig: normalizeConfig,
    mapPoint: mapPoint,
    jacobian: jacobian,
    coverageMultiplicity: coverageMultiplicity,
    polarDiskArea: polarDiskArea,
    compute: compute,
    mount: mount,
    selfTest: selfTest
  };
});

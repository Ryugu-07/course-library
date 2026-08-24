(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }

  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("auto-digital-sampling", exported.mount);
  }

  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("auto-digital-sampling self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("auto-digital-sampling self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : null,
  function (host) {
    "use strict";

    var LAB_ID = "auto-digital-sampling";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "auto-digital-sampling-styles";
    var EPS = 1e-10;
    var DEFAULTS = {
      a: 1.4,
      b: 1,
      samplePeriod: 0.2,
      steps: 14,
      omega: 18
    };

    var STYLE_TEXT = [
      '[data-learning-lab="auto-digital-sampling"]{--dsp-blue:var(--cl-blue,#315f9d);--dsp-orange:var(--cl-gold,#9b6a12);--dsp-green:var(--cl-green,#39734d);--dsp-red:var(--cl-red,#b64335);display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-digital-sampling"] *{box-sizing:border-box}[data-learning-lab="auto-digital-sampling"] [hidden]{display:none!important}',
      '[data-learning-lab="auto-digital-sampling"] h3,[data-learning-lab="auto-digital-sampling"] h4{margin:0;letter-spacing:0}[data-learning-lab="auto-digital-sampling"] h3{font-size:1.16rem}[data-learning-lab="auto-digital-sampling"] h4{margin-top:16px;font-size:1rem}',
      '[data-learning-lab="auto-digital-sampling"] p{margin:8px 0}[data-learning-lab="auto-digital-sampling"] .dsp-note,[data-learning-lab="auto-digital-sampling"] .dsp-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="auto-digital-sampling"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="auto-digital-sampling"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
      '[data-learning-lab="auto-digital-sampling"] .dsp-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="auto-digital-sampling"] button,[data-learning-lab="auto-digital-sampling"] input{font:inherit;letter-spacing:0}',
      '[data-learning-lab="auto-digital-sampling"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="auto-digital-sampling"] button:hover{border-color:var(--accent,#315f9d)}[data-learning-lab="auto-digital-sampling"] button[aria-pressed="true"],[data-learning-lab="auto-digital-sampling"] .dsp-primary{border-color:var(--accent,#315f9d);background:var(--accent,#315f9d);color:var(--bg,#fff);font-weight:750}',
      '[data-learning-lab="auto-digital-sampling"] button:focus-visible,[data-learning-lab="auto-digital-sampling"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="auto-digital-sampling"] button:disabled{cursor:not-allowed;opacity:.55}',
      '[data-learning-lab="auto-digital-sampling"] .dsp-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="auto-digital-sampling"] .dsp-actions>*{flex:1 1 170px}[data-learning-lab="auto-digital-sampling"] .dsp-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="auto-digital-sampling"] .dsp-correct{color:var(--dsp-green)}[data-learning-lab="auto-digital-sampling"] .dsp-wrong{color:var(--dsp-red)}',
      '[data-learning-lab="auto-digital-sampling"] .dsp-layout{display:grid;grid-template-columns:minmax(220px,.7fr) minmax(0,1.3fr);gap:16px;align-items:start;min-width:0}[data-learning-lab="auto-digital-sampling"] .dsp-controls,[data-learning-lab="auto-digital-sampling"] .dsp-stage{min-width:0}[data-learning-lab="auto-digital-sampling"] .dsp-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="auto-digital-sampling"] .dsp-control{display:grid;gap:5px;min-width:0}[data-learning-lab="auto-digital-sampling"] .dsp-control label{color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}[data-learning-lab="auto-digital-sampling"] .dsp-control output{color:var(--accent,#315f9d);font-variant-numeric:tabular-nums}',
      '[data-learning-lab="auto-digital-sampling"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent,#315f9d)}[data-learning-lab="auto-digital-sampling"] .dsp-stage-frame{min-width:0;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent);overflow:hidden}[data-learning-lab="auto-digital-sampling"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="auto-digital-sampling"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="auto-digital-sampling"] .dsp-grid{stroke:var(--border,#cbd5e1);stroke-width:1;stroke-opacity:.7}[data-learning-lab="auto-digital-sampling"] .dsp-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.75}[data-learning-lab="auto-digital-sampling"] .dsp-zoh{fill:none;stroke:var(--dsp-blue);stroke-width:2.8}[data-learning-lab="auto-digital-sampling"] .dsp-euler{fill:none;stroke:var(--dsp-orange);stroke-width:2.4;stroke-dasharray:6 4}[data-learning-lab="auto-digital-sampling"] .dsp-true{fill:none;stroke:var(--dsp-blue);stroke-width:2.2}[data-learning-lab="auto-digital-sampling"] .dsp-alias{fill:none;stroke:var(--dsp-red);stroke-width:1.9;stroke-dasharray:5 4}[data-learning-lab="auto-digital-sampling"] .dsp-sample{fill:var(--dsp-green);stroke:var(--bg,#fff);stroke-width:1.2}[data-learning-lab="auto-digital-sampling"] .dsp-label{font-size:11px}[data-learning-lab="auto-digital-sampling"] .dsp-small{font-size:10px;fill:var(--fg-soft,currentColor)!important}',
      '[data-learning-lab="auto-digital-sampling"] .dsp-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:8px;margin:12px 0}[data-learning-lab="auto-digital-sampling"] .dsp-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#cbd5e1);background:var(--bg,transparent)}[data-learning-lab="auto-digital-sampling"] .dsp-metric:nth-child(3n+1){border-color:var(--dsp-blue)}[data-learning-lab="auto-digital-sampling"] .dsp-metric:nth-child(3n+2){border-color:var(--dsp-orange)}[data-learning-lab="auto-digital-sampling"] .dsp-metric:nth-child(3n){border-color:var(--dsp-green)}[data-learning-lab="auto-digital-sampling"] .dsp-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11.5px}[data-learning-lab="auto-digital-sampling"] .dsp-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-digital-sampling"] .dsp-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="auto-digital-sampling"] table{width:100%;min-width:760px;border-collapse:collapse;font-size:11.5px;font-variant-numeric:tabular-nums}[data-learning-lab="auto-digital-sampling"] th,[data-learning-lab="auto-digital-sampling"] td{padding:7px 6px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="auto-digital-sampling"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="auto-digital-sampling"] .dsp-certificate{margin-top:11px;padding:10px 12px;border-left:3px solid var(--dsp-green);background:var(--bg,transparent);font-size:13px;line-height:1.7}',
      '@media(max-width:900px){[data-learning-lab="auto-digital-sampling"] .dsp-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){[data-learning-lab="auto-digital-sampling"] .dsp-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:420px){[data-learning-lab="auto-digital-sampling"] .dsp-stage-frame{padding:4px}[data-learning-lab="auto-digital-sampling"] table{font-size:10.8px}[data-learning-lab="auto-digital-sampling"] th,[data-learning-lab="auto-digital-sampling"] td{padding-left:4px;padding-right:4px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="auto-digital-sampling"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
    ].join("");

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function finite(value, label) {
      var number = Number(value);
      if (!Number.isFinite(number)) throw new RangeError(label + " must be finite");
      return number;
    }

    function nearly(left, right, tolerance) {
      var scale = Math.max(1, Math.abs(left), Math.abs(right));
      return Math.abs(left - right) <= (tolerance || 1e-8) * scale;
    }

    function formatNumber(value, digits) {
      if (!Number.isFinite(value)) return "—";
      var places = digits === undefined ? 3 : digits;
      if (places === 0) return value.toFixed(0);
      if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) {
        return value.toExponential(Math.min(places, 4));
      }
      return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
    }

    function normalizeConfig(input) {
      var source = input || {};
      var a = finite(source.a === undefined ? DEFAULTS.a : source.a, "a");
      var b = finite(source.b === undefined ? DEFAULTS.b : source.b, "b");
      var samplePeriod = finite(source.samplePeriod === undefined ? DEFAULTS.samplePeriod : source.samplePeriod, "T");
      var steps = Math.round(finite(source.steps === undefined ? DEFAULTS.steps : source.steps, "steps"));
      var omega = finite(source.omega === undefined ? DEFAULTS.omega : source.omega, "omega");
      if (a < 0.1 || a > 3) throw new RangeError("a must be in [0.1, 3]");
      if (b < 0.2 || b > 2) throw new RangeError("b must be in [0.2, 2]");
      if (samplePeriod < 0.02 || samplePeriod > 1.4) throw new RangeError("T must be in [0.02, 1.4]");
      if (steps < 8 || steps > 24) throw new RangeError("steps must be in [8, 24]");
      if (omega < 0.5 || omega > 35) throw new RangeError("omega must be in [0.5, 35]");
      return { a: a, b: b, samplePeriod: samplePeriod, steps: steps, omega: omega };
    }

    function wrapPi(value) {
      var period = 2 * Math.PI;
      var wrapped = (value + Math.PI) % period;
      if (wrapped < 0) wrapped += period;
      return wrapped - Math.PI;
    }

    function discreteParameters(config) {
      var alpha = Math.exp(-config.a * config.samplePeriod);
      return {
        zohAlpha: alpha,
        zohBeta: config.b * (1 - alpha) / config.a,
        eulerAlpha: 1 - config.a * config.samplePeriod,
        eulerBeta: config.b * config.samplePeriod,
        eulerStable: Math.abs(1 - config.a * config.samplePeriod) < 1 - 1e-12,
        nyquist: Math.PI / config.samplePeriod,
        aliasSigned: wrapPi(config.omega * config.samplePeriod) / config.samplePeriod,
        aliasFrequency: Math.abs(wrapPi(config.omega * config.samplePeriod)) / config.samplePeriod
      };
    }

    function runExperiment(input) {
      var config = normalizeConfig(input);
      var parameters = discreteParameters(config);
      var zoh = 0;
      var euler = 0;
      var rows = [];
      var samples = [];
      var maxError = 0;
      for (var k = 0; k < config.steps; k += 1) {
        var u = 1;
        var error = euler - zoh;
        var trueSignal = Math.sin(config.omega * k * config.samplePeriod);
        var aliasSignal = Math.sin(parameters.aliasSigned * k * config.samplePeriod);
        rows.push({ k: k, u: u, zoh: zoh, euler: euler, error: error, trueSignal: trueSignal, aliasSignal: aliasSignal });
        samples.push({ k: k, trueSignal: trueSignal, aliasSignal: aliasSignal });
        maxError = Math.max(maxError, Math.abs(error));
        zoh = parameters.zohAlpha * zoh + parameters.zohBeta * u;
        euler = parameters.eulerAlpha * euler + parameters.eulerBeta * u;
      }
      return {
        config: config,
        parameters: parameters,
        rows: rows,
        samples: samples,
        metrics: {
          maxError: maxError,
          finalZoh: rows.length ? rows[rows.length - 1].zoh : 0,
          finalEuler: rows.length ? rows[rows.length - 1].euler : 0,
          eulerPoleMagnitude: Math.abs(parameters.eulerAlpha),
          sampledSignalDifference: samples.reduce(function (sum, row) { return sum + Math.abs(row.trueSignal - row.aliasSignal); }, 0),
          eulerStable: parameters.eulerStable
        }
      };
    }

    function element(doc, tag, attributes, children) {
      var node = doc.createElement(tag);
      Object.keys(attributes || {}).forEach(function (key) {
        var value = attributes[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.setAttribute("class", String(value));
        else if (key === "text") node.textContent = String(value);
        else if (value === true) node.setAttribute(key, "");
        else node.setAttribute(key, String(value));
      });
      if (children !== undefined && children !== null) {
        (Array.isArray(children) ? children : [children]).forEach(function (child) {
          if (child === undefined || child === null || child === false) return;
          node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
        });
      }
      return node;
    }

    function svgElement(doc, tag, attributes, children) {
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attributes || {}).forEach(function (key) {
        var value = attributes[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.setAttribute("class", String(value));
        else node.setAttribute(key, String(value));
      });
      if (children !== undefined && children !== null) {
        (Array.isArray(children) ? children : [children]).forEach(function (child) {
          if (child === undefined || child === null || child === false) return;
          node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
        });
      }
      return node;
    }

    function clear(node) {
      while (node.firstChild) node.removeChild(node.firstChild);
    }

    function installStyles(doc) {
      if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement).appendChild(style);
    }

    function announce(api, rootNode, message) {
      if (api && typeof api.announce === "function") api.announce(rootNode, message);
    }

    function linePath(rows, key, mapX, mapY) {
      return rows.map(function (row, index) {
        return (index ? "L" : "M") + mapX(row.k).toFixed(2) + " " + mapY(row[key]).toFixed(2);
      }).join(" ");
    }

    function drawSvg(doc, svg, result) {
      clear(svg);
      var width = 720;
      var height = 420;
      var left = 48;
      var right = 17;
      var top = 26;
      var middle = 222;
      var bottom = 38;
      var stateValues = [];
      result.rows.forEach(function (row) { stateValues.push(row.zoh, row.euler); });
      var stateMin = Math.min.apply(null, stateValues);
      var stateMax = Math.max.apply(null, stateValues);
      var statePad = Math.max(0.12, (stateMax - stateMin) * 0.15);
      var yStateMin = stateMin - statePad;
      var yStateMax = stateMax + statePad;
      var xMax = Math.max(1, result.rows.length - 1);
      var mapX = function (value) { return left + value / xMax * (width - left - right); };
      var mapState = function (value) { return top + (middle - top - 16) * (yStateMax - value) / (yStateMax - yStateMin); };
      var mapSignal = function (value) { return middle + 20 + (height - bottom - (middle + 20)) * (1.2 - value) / 2.4; };
      svg.appendChild(svgElement(doc, "title", {}, "ZOH、Euler 与采样混叠"));
      svg.appendChild(svgElement(doc, "desc", {}, "上图比较精确 ZOH 和前向 Euler 的阶跃响应，下图显示同一采样点上的真实正弦与混叠正弦。"));
      for (var i = 0; i <= 3; i += 1) {
        var stateY = top + (middle - top - 16) * i / 3;
        svg.appendChild(svgElement(doc, "line", { x1: left, y1: stateY, x2: width - right, y2: stateY, class: "dsp-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: left - 7, y: stateY + 4, "text-anchor": "end", class: "dsp-small" }, formatNumber(yStateMax - (yStateMax - yStateMin) * i / 3, 2)));
        var signalY = middle + 20 + (height - bottom - (middle + 20)) * i / 2;
        var signalLabel = 1.2 - 2.4 * i / 2;
        svg.appendChild(svgElement(doc, "line", { x1: left, y1: signalY, x2: width - right, y2: signalY, class: "dsp-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: left - 7, y: signalY + 4, "text-anchor": "end", class: "dsp-small" }, formatNumber(signalLabel, 1)));
      }
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: middle - 8, x2: width - right, y2: middle - 8, class: "dsp-axis" }));
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: mapSignal(0), x2: width - right, y2: mapSignal(0), class: "dsp-axis" }));
      svg.appendChild(svgElement(doc, "path", { d: linePath(result.rows, "zoh", mapX, mapState), class: "dsp-zoh" }));
      svg.appendChild(svgElement(doc, "path", { d: linePath(result.rows, "euler", mapX, mapState), class: "dsp-euler" }));
      svg.appendChild(svgElement(doc, "path", { d: linePath(result.samples, "trueSignal", mapX, mapSignal), class: "dsp-true" }));
      svg.appendChild(svgElement(doc, "path", { d: linePath(result.samples, "aliasSignal", mapX, mapSignal), class: "dsp-alias" }));
      result.samples.forEach(function (row) {
        svg.appendChild(svgElement(doc, "circle", { cx: mapX(row.k), cy: mapSignal(row.trueSignal), r: 3.4, class: "dsp-sample" }));
      });
      svg.appendChild(svgElement(doc, "text", { x: left + 4, y: top + 13, class: "dsp-label" }, "阶跃：ZOH 精确 / Euler"));
      svg.appendChild(svgElement(doc, "text", { x: left + 4, y: middle + 13, class: "dsp-label" }, "采样：真实 ω / 混叠 ω_alias"));
      svg.appendChild(svgElement(doc, "text", { x: width - right, y: height - 9, "text-anchor": "end", class: "dsp-small" }, "采样 k"));
    }

    function metric(doc, label, value) {
      return element(doc, "div", { className: "dsp-metric" }, [
        element(doc, "span", { text: label }),
        element(doc, "strong", { text: value })
      ]);
    }

    function renderLedger(doc, hostNode, result) {
      var body = element(doc, "tbody");
      result.rows.forEach(function (row) {
        body.appendChild(element(doc, "tr", {}, [
          element(doc, "th", { text: String(row.k) }),
          element(doc, "td", { text: formatNumber(row.u, 0) }),
          element(doc, "td", { text: formatNumber(row.zoh, 3) }),
          element(doc, "td", { text: formatNumber(row.euler, 3) }),
          element(doc, "td", { text: formatNumber(row.error, 3) }),
          element(doc, "td", { text: formatNumber(row.trueSignal, 3) }),
          element(doc, "td", { text: formatNumber(row.aliasSignal, 3) })
        ]));
      });
      clear(hostNode);
      hostNode.appendChild(element(doc, "table", {}, [
        element(doc, "caption", { text: "固定阶跃与正弦采样透明账本" }),
        element(doc, "thead", {}, [element(doc, "tr", {}, [
          element(doc, "th", { text: "k" }),
          element(doc, "th", { text: "u_k" }),
          element(doc, "th", { text: "x_ZOH" }),
          element(doc, "th", { text: "x_Euler" }),
          element(doc, "th", { text: "Euler−ZOH" }),
          element(doc, "th", { text: "sin(ωkT)" }),
          element(doc, "th", { text: "sin(ω_alias kT)" })
        ])]),
        body
      ]));
    }

    function questionSpecs() {
      return [
        {
          key: "zoh",
          prompt: "连续极点 s=−a 用 ZOH 精确离散后，离散极点是哪一个？",
          expected: "exact",
          choices: [
            { value: "exact", label: "z=e^(−aT)" },
            { value: "euler", label: "z=1−aT" },
            { value: "zero", label: "z=0 总是成立" }
          ]
        },
        {
          key: "euler",
          prompt: "对稳定连续极点，前向 Euler 在 aT>2 时会怎样？",
          expected: "unstable",
          choices: [
            { value: "unstable", label: "离开单位圆，离散不稳定" },
            { value: "stable", label: "仍无条件稳定" },
            { value: "same", label: "与 ZOH 完全相同" }
          ]
        },
        {
          key: "alias",
          prompt: "哪些连续频率会给出完全相同的采样序列？",
          expected: "family",
          choices: [
            { value: "family", label: "ω 与 ω+2πm/T" },
            { value: "half", label: "只差 π/T" },
            { value: "none", label: "不同频率永远不同" }
          ]
        }
      ];
    }

    function renderPredictions(state, refs) {
      var specs = questionSpecs();
      refs.questions.forEach(function (question, index) {
        var spec = specs[index];
        question.buttons.forEach(function (button) {
          var selected = state.predictions[spec.key] === button.value;
          button.node.setAttribute("aria-pressed", selected ? "true" : "false");
          if (!state.revealed) {
            button.node.textContent = button.label;
            button.node.className = "";
          } else {
            var correct = button.value === spec.expected;
            button.node.textContent = (correct ? "✓ " : "") + button.label;
            button.node.className = correct ? "dsp-correct" : selected ? "dsp-wrong" : "";
          }
        });
      });
    }

    function mount(rootNode, api) {
      if (!rootNode || !rootNode.ownerDocument) return;
      var doc = rootNode.ownerDocument;
      installStyles(doc);
      var state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
      var refs = { questions: [] };
      var shell = element(doc, "div", { className: "dsp-lab" });
      shell.appendChild(element(doc, "h3", { text: "数字控制实验：ZOH、Euler、z 映射与混叠" }));
      shell.appendChild(element(doc, "p", { className: "dsp-note", text: "一阶温控对象 dot(x)=−a x+b u 受到单位阶跃；同一采样周期下比较 ZOH 精确推进与前向 Euler，并用固定正弦采样展示混叠。没有随机噪声，改变参数只改变公式结果。" }));
      var predictionHost = element(doc, "div");
      questionSpecs().forEach(function (spec) {
        var fieldset = element(doc, "fieldset");
        fieldset.appendChild(element(doc, "legend", { text: spec.prompt }));
        var grid = element(doc, "div", { className: "dsp-choice-grid" });
        var question = { key: spec.key, buttons: [] };
        spec.choices.forEach(function (choice) {
          var button = element(doc, "button", { type: "button", text: choice.label, "aria-pressed": "false" });
          button.addEventListener("click", function () {
            state.predictions[spec.key] = choice.value;
            state.feedback = "";
            render();
          });
          question.buttons.push({ value: choice.value, label: choice.label, node: button });
          grid.appendChild(button);
        });
        fieldset.appendChild(grid);
        predictionHost.appendChild(fieldset);
        refs.questions.push(question);
      });
      var actions = element(doc, "div", { className: "dsp-actions" });
      var reveal = element(doc, "button", { type: "button", className: "dsp-primary", text: "提交预测并揭晓" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      var feedback = element(doc, "p", { className: "dsp-feedback", "aria-live": "polite" });
      var resultShell = element(doc, "div", { hidden: true });
      var controlRefs = {};

      function makeRange(key, label, min, max, step, digits) {
        var input = element(doc, "input", { type: "range", min: String(min), max: String(max), step: String(step), value: String(state.config[key]), "aria-label": label });
        var output = element(doc, "output", { text: formatNumber(state.config[key], digits) });
        controlRefs[key] = { input: input, output: output, digits: digits };
        return element(doc, "div", { className: "dsp-control" }, [
          element(doc, "label", {}, [label + " = ", output]),
          input
        ]);
      }

      var controls = element(doc, "div", { className: "dsp-controls" }, [
        makeRange("a", "连续衰减 a", 0.1, 3, 0.1, 1),
        makeRange("b", "输入增益 b", 0.2, 2, 0.1, 1),
        makeRange("samplePeriod", "采样周期 T", 0.02, 1.4, 0.02, 2),
        makeRange("steps", "观察步数", 8, 24, 1, 0),
        makeRange("omega", "正弦频率 ω", 0.5, 35, 0.5, 1),
        element(doc, "p", { className: "dsp-note", text: "ZOH：α=e^(−aT)，β=b(1−α)/a；Euler：α_E=1−aT，β_E=bT。采样频率为 2π/T，Nyquist 角频率为 π/T。" })
      ]);
      var svg = svgElement(doc, "svg", { viewBox: "0 0 720 420", role: "img", "aria-label": "数字离散化与混叠" });
      var svgFrame = element(doc, "div", { className: "dsp-stage-frame" }, [svg]);
      var metricsHost = element(doc, "div", { className: "dsp-metrics" });
      var tableHost = element(doc, "div", { className: "dsp-table-wrap" });
      var certificate = element(doc, "div", { className: "dsp-certificate" });
      resultShell.appendChild(element(doc, "div", { className: "dsp-layout" }, [
        controls,
        element(doc, "div", { className: "dsp-stage" }, [svgFrame, metricsHost, tableHost, certificate])
      ]));
      shell.appendChild(predictionHost);
      shell.appendChild(actions);
      shell.appendChild(feedback);
      shell.appendChild(resultShell);
      clear(rootNode);
      rootNode.appendChild(shell);

      reveal.addEventListener("click", function () {
        var specs = questionSpecs();
        if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) {
          state.feedback = "请先完成三项预测；离散响应、混叠图和逐采样账会在提交后出现。";
          render();
          return;
        }
        var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
        state.revealed = true;
        state.feedback = "已揭晓：" + correct + "/" + specs.length + " 命中。调 T 或 ω 不会重新上锁。";
        render();
        announce(api, rootNode, state.feedback);
      });
      reset.addEventListener("click", function () {
        state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
        render();
        announce(api, rootNode, "数字控制预测、图和账本已重置。");
      });
      ["a", "b", "samplePeriod", "steps", "omega"].forEach(function (key) {
        controlRefs[key].input.addEventListener("input", function () {
          var next = Object.assign({}, state.config);
          next[key] = Number(controlRefs[key].input.value);
          state.config = normalizeConfig(next);
          state.feedback = "";
          render();
        });
      });

      function render() {
        var result = runExperiment(state.config);
        ["a", "b", "samplePeriod", "steps", "omega"].forEach(function (key) {
          controlRefs[key].input.value = String(result.config[key]);
          controlRefs[key].output.textContent = formatNumber(result.config[key], controlRefs[key].digits);
        });
        feedback.textContent = state.feedback;
        feedback.className = "dsp-feedback" + (state.feedback.indexOf("请先") === 0 ? " dsp-wrong" : "");
        renderPredictions(state, refs);
        resultShell.hidden = !state.revealed;
        if (!state.revealed) return;
        drawSvg(doc, svg, result);
        clear(metricsHost);
        metricsHost.appendChild(metric(doc, "ZOH 极点 α", formatNumber(result.parameters.zohAlpha, 4)));
        metricsHost.appendChild(metric(doc, "Euler 极点 α_E", formatNumber(result.parameters.eulerAlpha, 4)));
        metricsHost.appendChild(metric(doc, "max |Euler−ZOH|", formatNumber(result.metrics.maxError, 3)));
        metricsHost.appendChild(metric(doc, "Nyquist ω_N", formatNumber(result.parameters.nyquist, 2)));
        metricsHost.appendChild(metric(doc, "混叠频率 |ω_alias|", formatNumber(result.parameters.aliasFrequency, 2)));
        metricsHost.appendChild(metric(doc, "Euler 稳定？", result.metrics.eulerStable ? "是" : "否"));
        renderLedger(doc, tableHost, result);
        clear(certificate);
        certificate.appendChild(element(doc, "p", { text: "离散化证书：连续极点 s=−a 的 ZOH 映射是 z=e^(sT)=e^(−aT)；前向 Euler 给 z_E=1−aT，只有 |1−aT|<1 时稳定，即 0<aT<2。" }));
        certificate.appendChild(element(doc, "p", { text: "混叠证书：ω_alias=wrap(ωT)/T，且 sin(ωkT)=sin((ω+2πm/T)kT)。当前两条正弦在所有采样点的累计差为 " + formatNumber(result.metrics.sampledSignalDifference, 6) + "；这不是说连续时间波形相同，而是采样后不可区分。" }));
      }

      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) {
        checks += 1;
        assert(condition, message);
      }
      var baseline = runExperiment(DEFAULTS);
      var repeat = runExperiment(DEFAULTS);
      var expectedAlpha = Math.exp(-DEFAULTS.a * DEFAULTS.samplePeriod);
      check(baseline.rows.length === DEFAULTS.steps, "fixed digital simulation length");
      check(JSON.stringify(baseline.rows) === JSON.stringify(repeat.rows), "deterministic sampling ledger");
      check(nearly(baseline.parameters.zohAlpha, expectedAlpha, 1e-12), "exact ZOH pole");
      check(nearly(baseline.rows[1].zoh, baseline.parameters.zohBeta, 1e-12), "exact ZOH first step");
      check(nearly(baseline.rows[1].euler, baseline.parameters.eulerBeta, 1e-12), "Euler first step");
      check(baseline.metrics.sampledSignalDifference < 1e-9, "alias samples coincide");
      check(runExperiment({ a: 1, b: 1, samplePeriod: 0.2, steps: 8, omega: 2 }).metrics.eulerStable, "Euler stable small step");
      check(!runExperiment({ a: 2.1, b: 1, samplePeriod: 1, steps: 8, omega: 2 }).metrics.eulerStable, "Euler unstable boundary");
      check(formatNumber(1000, 0) === "1000", "integer trailing zero formatting");
      return { checks: checks };
    }

    return {
      DEFAULTS: DEFAULTS,
      normalizeConfig: normalizeConfig,
      discreteParameters: discreteParameters,
      runExperiment: runExperiment,
      formatNumber: formatNumber,
      mount: mount,
      selfTest: selfTest
    };
  }
);

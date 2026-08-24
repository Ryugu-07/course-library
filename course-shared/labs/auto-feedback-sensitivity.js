(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }

  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("auto-feedback-sensitivity", exported.mount);
  }

  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("auto-feedback-sensitivity self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("auto-feedback-sensitivity self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
}) (
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : null,
  function (host) {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "auto-feedback-sensitivity-styles";
    var EPS = 1e-10;
    var INSTANCE = 0;
    var DEFAULTS = {
      gain: 8,
      omega: 0.5,
      tau: 1.2,
      injection: "output",
      amplitude: 1
    };

    var STYLE_TEXT = [
      '[data-learning-lab="auto-feedback-sensitivity"]{--fs-blue:var(--cl-blue,#315f9d);--fs-gold:var(--cl-gold,#9b6a12);--fs-green:var(--cl-green,#39734d);--fs-red:var(--cl-red,#b64335);display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-feedback-sensitivity"] *{box-sizing:border-box}[data-learning-lab="auto-feedback-sensitivity"] [hidden]{display:none!important}',
      '[data-learning-lab="auto-feedback-sensitivity"] h3,[data-learning-lab="auto-feedback-sensitivity"] h4{margin:0;color:var(--fg,currentColor);letter-spacing:0}[data-learning-lab="auto-feedback-sensitivity"] h3{font-size:1.16rem}[data-learning-lab="auto-feedback-sensitivity"] h4{margin-top:16px;font-size:1rem}',
      '[data-learning-lab="auto-feedback-sensitivity"] p{margin:8px 0}[data-learning-lab="auto-feedback-sensitivity"] .fs-note,[data-learning-lab="auto-feedback-sensitivity"] .fs-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="auto-feedback-sensitivity"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="auto-feedback-sensitivity"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
      '[data-learning-lab="auto-feedback-sensitivity"] .fs-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="auto-feedback-sensitivity"] button,[data-learning-lab="auto-feedback-sensitivity"] select,[data-learning-lab="auto-feedback-sensitivity"] input{font:inherit}',
      '[data-learning-lab="auto-feedback-sensitivity"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="auto-feedback-sensitivity"] button:hover{border-color:var(--accent,#315f9d)}[data-learning-lab="auto-feedback-sensitivity"] button[aria-pressed="true"],[data-learning-lab="auto-feedback-sensitivity"] .fs-primary{border-color:var(--accent,#315f9d);background:var(--accent,#315f9d);color:var(--bg,#fff);font-weight:750}',
      '[data-learning-lab="auto-feedback-sensitivity"] button:focus-visible,[data-learning-lab="auto-feedback-sensitivity"] select:focus-visible,[data-learning-lab="auto-feedback-sensitivity"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="auto-feedback-sensitivity"] button:disabled{cursor:not-allowed;opacity:.55}',
      '[data-learning-lab="auto-feedback-sensitivity"] .fs-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="auto-feedback-sensitivity"] .fs-actions>*{flex:1 1 170px}[data-learning-lab="auto-feedback-sensitivity"] .fs-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="auto-feedback-sensitivity"] .fs-pass{color:var(--fs-green)}[data-learning-lab="auto-feedback-sensitivity"] .fs-warn{color:var(--fs-red)}',
      '[data-learning-lab="auto-feedback-sensitivity"] .fs-layout{display:grid;grid-template-columns:minmax(220px,.72fr) minmax(0,1.28fr);gap:16px;align-items:start;min-width:0}[data-learning-lab="auto-feedback-sensitivity"] .fs-controls,[data-learning-lab="auto-feedback-sensitivity"] .fs-stage{min-width:0}[data-learning-lab="auto-feedback-sensitivity"] .fs-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="auto-feedback-sensitivity"] .fs-control{display:grid;gap:5px;min-width:0}[data-learning-lab="auto-feedback-sensitivity"] .fs-control label{color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}[data-learning-lab="auto-feedback-sensitivity"] .fs-control output{color:var(--accent,#315f9d);font-variant-numeric:tabular-nums}',
      '[data-learning-lab="auto-feedback-sensitivity"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent,#315f9d)}[data-learning-lab="auto-feedback-sensitivity"] .fs-stage-frame{min-width:0;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent);overflow:hidden}[data-learning-lab="auto-feedback-sensitivity"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="auto-feedback-sensitivity"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="auto-feedback-sensitivity"] .fs-grid{stroke:var(--border,#cbd5e1);stroke-width:1;stroke-opacity:.7}[data-learning-lab="auto-feedback-sensitivity"] .fs-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.75}[data-learning-lab="auto-feedback-sensitivity"] .fs-s-line{fill:none;stroke:var(--fs-blue);stroke-width:2.8}[data-learning-lab="auto-feedback-sensitivity"] .fs-t-line{fill:none;stroke:var(--fs-gold);stroke-width:2.8}[data-learning-lab="auto-feedback-sensitivity"] .fs-cursor{stroke:var(--fs-red);stroke-width:1.7;stroke-dasharray:5 4}[data-learning-lab="auto-feedback-sensitivity"] .fs-label{font-size:11px}[data-learning-lab="auto-feedback-sensitivity"] .fs-small{font-size:10px;fill:var(--fg-soft,currentColor)!important}',
      '[data-learning-lab="auto-feedback-sensitivity"] .fs-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:12px 0}[data-learning-lab="auto-feedback-sensitivity"] .fs-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#cbd5e1);background:var(--bg,transparent)}[data-learning-lab="auto-feedback-sensitivity"] .fs-metric:nth-child(4n+1){border-color:var(--fs-blue)}[data-learning-lab="auto-feedback-sensitivity"] .fs-metric:nth-child(4n+2){border-color:var(--fs-gold)}[data-learning-lab="auto-feedback-sensitivity"] .fs-metric:nth-child(4n+3){border-color:var(--fs-green)}[data-learning-lab="auto-feedback-sensitivity"] .fs-metric:nth-child(4n){border-color:var(--fs-red)}[data-learning-lab="auto-feedback-sensitivity"] .fs-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11.5px}[data-learning-lab="auto-feedback-sensitivity"] .fs-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-feedback-sensitivity"] .fs-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="auto-feedback-sensitivity"] table{width:100%;min-width:780px;border-collapse:collapse;font-size:11.5px;font-variant-numeric:tabular-nums}[data-learning-lab="auto-feedback-sensitivity"] th,[data-learning-lab="auto-feedback-sensitivity"] td{padding:7px 6px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="auto-feedback-sensitivity"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="auto-feedback-sensitivity"] .fs-certificate{margin-top:11px;padding:10px 12px;border-left:3px solid var(--fs-green);background:var(--bg,transparent);font-size:13px;line-height:1.7}[data-learning-lab="auto-feedback-sensitivity"] .fs-certificate.fs-blocked{border-color:var(--fs-red)}',
      '@media(max-width:900px){[data-learning-lab="auto-feedback-sensitivity"] .fs-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){[data-learning-lab="auto-feedback-sensitivity"] .fs-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:420px){[data-learning-lab="auto-feedback-sensitivity"] .fs-stage-frame{padding:4px}[data-learning-lab="auto-feedback-sensitivity"] table{font-size:10.8px}[data-learning-lab="auto-feedback-sensitivity"] th,[data-learning-lab="auto-feedback-sensitivity"] td{padding-left:4px;padding-right:4px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="auto-feedback-sensitivity"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
    ].join("");

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function finite(value, label) {
      var number = Number(value);
      if (!Number.isFinite(number)) throw new RangeError(label + " must be finite");
      return number;
    }

    function clamp(value, low, high) {
      return Math.max(low, Math.min(high, value));
    }

    function complex(re, im) {
      return { re: re, im: im };
    }

    function add(left, right) {
      return complex(left.re + right.re, left.im + right.im);
    }

    function sub(left, right) {
      return complex(left.re - right.re, left.im - right.im);
    }

    function multiply(left, right) {
      return complex(left.re * right.re - left.im * right.im, left.re * right.im + left.im * right.re);
    }

    function divide(left, right) {
      var denominator = right.re * right.re + right.im * right.im;
      if (denominator <= EPS) throw new RangeError("complex denominator is zero");
      return complex(
        (left.re * right.re + left.im * right.im) / denominator,
        (left.im * right.re - left.re * right.im) / denominator
      );
    }

    function magnitude(value) {
      return Math.sqrt(value.re * value.re + value.im * value.im);
    }

    function phaseDeg(value) {
      return Math.atan2(value.im, value.re) * 180 / Math.PI;
    }

    function normalizeConfig(input) {
      var source = input || {};
      var gain = finite(source.gain === undefined ? DEFAULTS.gain : source.gain, "gain");
      var omega = finite(source.omega === undefined ? DEFAULTS.omega : source.omega, "omega");
      var tau = finite(source.tau === undefined ? DEFAULTS.tau : source.tau, "tau");
      var amplitude = finite(source.amplitude === undefined ? DEFAULTS.amplitude : source.amplitude, "amplitude");
      var injection = source.injection === undefined ? DEFAULTS.injection : String(source.injection);
      if (gain < 0.1 || gain > 30) throw new RangeError("gain must be in [0.1, 30]");
      if (omega < 0.02 || omega > 30) throw new RangeError("omega must be in [0.02, 30]");
      if (tau <= 0 || tau > 5) throw new RangeError("tau must be in (0, 5]");
      if (amplitude < 0 || amplitude > 3) throw new RangeError("amplitude must be in [0, 3]");
      if (["reference", "input", "output", "sensor"].indexOf(injection) < 0) {
        throw new RangeError("unknown injection location");
      }
      return { gain: gain, omega: omega, tau: tau, injection: injection, amplitude: amplitude };
    }

    function evaluate(input) {
      var source = input || {};
      var config = normalizeConfig(source);
      var omega = config.omega;
      var plant = divide(complex(1, 0), complex(1, omega * config.tau));
      var controller = complex(config.gain, 0);
      var loop = multiply(controller, plant);
      var negativeFeedback = source.feedback !== "positive";
      var denominator = negativeFeedback ? add(complex(1, 0), loop) : sub(complex(1, 0), loop);
      var sensitivity = divide(complex(1, 0), denominator);
      var complementary = divide(loop, denominator);
      var paths = {
        reference: complementary,
        input: multiply(plant, sensitivity),
        output: sensitivity,
        sensor: complex(-complementary.re, -complementary.im)
      };
      var identity = negativeFeedback
        ? add(sensitivity, complementary)
        : complex(NaN, NaN);
      var selected = paths[config.injection];
      return {
        config: config,
        plant: plant,
        controller: controller,
        loop: loop,
        denominator: denominator,
        sensitivity: sensitivity,
        complementary: complementary,
        paths: paths,
        selectedPath: selected,
        selectedOutput: magnitude(selected) * config.amplitude,
        identity: identity,
        identityError: negativeFeedback ? magnitude(sub(identity, complex(1, 0))) : NaN,
        negativeFeedback: negativeFeedback
      };
    }

    function frequencySweep(input, count) {
      var config = normalizeConfig(input);
      var samples = Math.round(count === undefined ? 120 : count);
      if (samples < 20 || samples > 300) throw new RangeError("count must be in [20, 300]");
      var rows = [];
      var low = 0.02;
      var high = 30;
      for (var index = 0; index < samples; index += 1) {
        var fraction = index / (samples - 1);
        var omega = low * Math.pow(high / low, fraction);
        var result = evaluate({
          gain: config.gain,
          omega: omega,
          tau: config.tau,
          injection: config.injection,
          amplitude: config.amplitude
        });
        rows.push({
          omega: omega,
          sensitivityDb: 20 * Math.log10(magnitude(result.sensitivity)),
          complementaryDb: 20 * Math.log10(magnitude(result.complementary))
        });
      }
      return rows;
    }

    function formatNumber(value, digits) {
      if (!Number.isFinite(value)) return "—";
      var places = digits === undefined ? 3 : digits;
      if (Math.abs(value) < 5e-10) return "0";
      if (places === 0) return value.toFixed(0);
      return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
    }

    function formatComplex(value) {
      if (!value || !Number.isFinite(value.re) || !Number.isFinite(value.im)) return "—";
      var real = formatNumber(value.re, 3);
      var imag = formatNumber(Math.abs(value.im), 3);
      return real + (value.im < -EPS ? " − j" : " + j") + imag;
    }

    function element(doc, tag, attributes, children) {
      var node = doc.createElement(tag);
      Object.keys(attributes || {}).forEach(function (key) {
        var value = attributes[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.setAttribute("class", String(value));
        else if (key === "text") node.textContent = String(value);
        else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
        else node.setAttribute(key, String(value));
      });
      if (children !== undefined && children !== null) {
        (Array.isArray(children) ? children : [children]).forEach(function (child) {
          if (child === undefined || child === null || child === false) return;
          node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
        });
      }
      return node;
    }

    function svgElement(doc, tag, attributes, children) {
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attributes || {}).forEach(function (key) {
        var value = attributes[key];
        if (value === undefined || value === null || value === false) return;
        node.setAttribute(key, String(value));
      });
      if (children !== undefined && children !== null) {
        (Array.isArray(children) ? children : [children]).forEach(function (child) {
          if (child === undefined || child === null || child === false) return;
          node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
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

    function metric(doc, label, value) {
      return element(doc, "div", { className: "fs-metric" }, [
        element(doc, "span", { text: label }),
        element(doc, "strong", { text: value })
      ]);
    }

    function pathFor(rows, key, mapX, mapY) {
      return rows.map(function (row, index) {
        return (index ? "L" : "M") + mapX(row.omega).toFixed(2) + " " + mapY(row[key]).toFixed(2);
      }).join(" ");
    }

    function drawSweep(doc, svg, config) {
      var rows = frequencySweep(config, 120);
      clear(svg);
      var width = 720;
      var height = 330;
      var left = 50;
      var right = 16;
      var top = 26;
      var bottom = 36;
      var yMin = -42;
      var yMax = 12;
      var logLow = Math.log10(0.02);
      var logHigh = Math.log10(30);
      var mapX = function (omega) { return left + (Math.log10(omega) - logLow) / (logHigh - logLow) * (width - left - right); };
      var mapY = function (value) { return top + (yMax - value) / (yMax - yMin) * (height - top - bottom); };
      svg.appendChild(svgElement(doc, "title", {}, "灵敏度 S 与互补灵敏度 T 的频率曲线"));
      svg.appendChild(svgElement(doc, "desc", {}, "蓝线为 20 log10|S|，金线为 20 log10|T|，红色虚线为当前游标频率。"));
      [-40, -20, 0].forEach(function (value) {
        var y = mapY(value);
        svg.appendChild(svgElement(doc, "line", { x1: left, y1: y, x2: width - right, y2: y, class: "fs-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: left - 7, y: y + 4, "text-anchor": "end", class: "fs-small" }, value + " dB"));
      });
      [0.02, 0.1, 1, 10, 30].forEach(function (value) {
        var x = mapX(value);
        svg.appendChild(svgElement(doc, "line", { x1: x, y1: top, x2: x, y2: height - bottom, class: "fs-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: x, y: height - 14, "text-anchor": "middle", class: "fs-small" }, String(value)));
      });
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: mapY(0), x2: width - right, y2: mapY(0), class: "fs-axis" }));
      svg.appendChild(svgElement(doc, "path", { d: pathFor(rows, "sensitivityDb", mapX, mapY), class: "fs-s-line" }));
      svg.appendChild(svgElement(doc, "path", { d: pathFor(rows, "complementaryDb", mapX, mapY), class: "fs-t-line" }));
      svg.appendChild(svgElement(doc, "line", { x1: mapX(config.omega), y1: top, x2: mapX(config.omega), y2: height - bottom, class: "fs-cursor" }));
      svg.appendChild(svgElement(doc, "text", { x: left, y: 15, class: "fs-label" }, "蓝 |S|    金 |T|    纵轴：dB"));
      svg.appendChild(svgElement(doc, "text", { x: width - right, y: 15, "text-anchor": "end", class: "fs-label" }, "ω (rad/s)"));
    }

    function renderLedger(doc, hostNode, result) {
      clear(hostNode);
      var frequencies = [
        Math.max(0.02, result.config.omega / 4),
        result.config.omega,
        Math.min(30, result.config.omega * 4)
      ];
      var table = element(doc, "table", {}, [
        element(doc, "caption", { className: "fs-note", text: "逐频率复数 ledger（路径幅值包含单位注入）" }),
        element(doc, "thead", {}, element(doc, "tr", {}, [
          element(doc, "th", { text: "ω" }),
          element(doc, "th", { text: "P(jω)" }),
          element(doc, "th", { text: "L=PC" }),
          element(doc, "th", { text: "S" }),
          element(doc, "th", { text: "T" }),
          element(doc, "th", { text: "选定路径" })
        ])),
        element(doc, "tbody")
      ]);
      var body = table.querySelector("tbody");
      frequencies.forEach(function (omega) {
        var rowResult = evaluate({
          gain: result.config.gain,
          omega: omega,
          tau: result.config.tau,
          injection: result.config.injection,
          amplitude: result.config.amplitude
        });
        body.appendChild(element(doc, "tr", {}, [
          element(doc, "td", { text: formatNumber(omega, 3) }),
          element(doc, "td", { text: formatComplex(rowResult.plant) }),
          element(doc, "td", { text: formatComplex(rowResult.loop) }),
          element(doc, "td", { text: formatComplex(rowResult.sensitivity) }),
          element(doc, "td", { text: formatComplex(rowResult.complementary) }),
          element(doc, "td", { text: formatNumber(magnitude(rowResult.selectedPath) * result.config.amplitude, 3) })
        ]));
      });
      hostNode.appendChild(element(doc, "div", { className: "fs-table-wrap" }, table));
    }

    function renderPredictions(doc, hostNode, state) {
      clear(hostNode);
      var specs = [
        { key: "tracking", prompt: "|L| 很大时，参考通道接近？", choices: [["zero", "0"], ["one", "1"]] },
        { key: "path", prompt: "默认低频回路更容易压制？", choices: [["sensor", "高频传感器噪声"], ["disturbance", "低频对象扰动"]] },
        { key: "sign", prompt: "正反馈的分母是？", choices: [["plus", "1 + L"], ["minus", "1 − L"]] }
      ];
      specs.forEach(function (spec) {
        var field = element(doc, "fieldset", {}, element(doc, "legend", { text: spec.prompt }));
        var grid = element(doc, "div", { className: "fs-choice-grid" });
        spec.choices.forEach(function (choice) {
          grid.appendChild(element(doc, "button", {
            type: "button",
            "aria-pressed": state.predictions[spec.key] === choice[0] ? "true" : "false",
            text: choice[1],
            onclick: function () {
              state.predictions[spec.key] = choice[0];
              state.revealed = false;
              state.feedback = "";
              renderPredictions(doc, hostNode, state);
            }
          }));
        });
        field.appendChild(grid);
        hostNode.appendChild(field);
      });
    }

    function mount(rootNode, api) {
      var doc = rootNode.ownerDocument || host || document;
      installStyles(doc);
      INSTANCE += 1;
      var state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
      var shell = element(doc, "div", { className: "fs-shell" });
      var predictionHost = element(doc, "div", { className: "fs-predictions" });
      var feedback = element(doc, "p", { className: "fs-feedback", "aria-live": "polite" });
      var reveal = element(doc, "button", { type: "button", className: "fs-primary", text: "揭晓预测并计算" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      var controlHost = element(doc, "div", { className: "fs-controls" });
      var stage = element(doc, "div", { className: "fs-stage" });
      var svg = svgElement(doc, "svg", { viewBox: "0 0 720 330", role: "img", "aria-label": "S 和 T 的频率响应图" });
      var metricsHost = element(doc, "div", { className: "fs-metrics" });
      var ledgerHost = element(doc, "div");
      var certificate = element(doc, "p", { className: "fs-certificate" });
      var refs = {};
      var controls = [
        { key: "gain", label: "回路增益 K", min: 0.1, max: 30, step: 0.1, digits: 1 },
        { key: "omega", label: "游标频率 ω (rad/s)", min: 0.02, max: 30, step: 0.01, digits: 2 }
      ];
      controls.forEach(function (item) {
        var input = element(doc, "input", { type: "range", min: item.min, max: item.max, step: item.step, value: state.config[item.key], "aria-label": item.label });
        var output = element(doc, "output", { text: formatNumber(state.config[item.key], item.digits) });
        var label = element(doc, "label", { text: item.label + "：" }, [output]);
        var wrapper = element(doc, "div", { className: "fs-control" }, [label, input]);
        controlHost.appendChild(wrapper);
        refs[item.key] = { input: input, output: output, digits: item.digits };
      });
      var select = element(doc, "select", { "aria-label": "扰动注入位置" }, [
        element(doc, "option", { value: "reference", text: "参考输入 r" }),
        element(doc, "option", { value: "input", text: "对象输入 dᵢ" }),
        element(doc, "option", { value: "output", text: "对象输出 dₒ" }),
        element(doc, "option", { value: "sensor", text: "传感器噪声 n" })
      ]);
      select.value = state.config.injection;
      controlHost.appendChild(element(doc, "div", { className: "fs-control" }, [
        element(doc, "label", { text: "选择注入位置：" }), select
      ]));
      shell.appendChild(element(doc, "h3", { text: "交互实验：S/T 频率账本" }));
      shell.appendChild(element(doc, "p", { className: "fs-note", text: "先预测，再打开游标；默认采用负反馈 e=r−yₘ、P(s)=1/(1+1.2s)。" }));
      shell.appendChild(predictionHost);
      shell.appendChild(element(doc, "div", { className: "fs-actions" }, [reveal, reset]));
      shell.appendChild(feedback);
      var layout = element(doc, "div", { className: "fs-layout" }, [
        controlHost,
        element(doc, "div", { className: "fs-stage" }, [
          element(doc, "div", { className: "fs-stage-frame" }, svg),
          metricsHost,
          ledgerHost,
          certificate
        ])
      ]);
      shell.appendChild(layout);
      clear(rootNode);
      rootNode.appendChild(shell);

      function render() {
        var result = evaluate(state.config);
        Object.keys(refs).forEach(function (key) {
          refs[key].input.value = String(result.config[key]);
          refs[key].output.textContent = formatNumber(result.config[key], refs[key].digits);
        });
        select.value = result.config.injection;
        feedback.textContent = state.feedback;
        feedback.className = "fs-feedback" + (state.feedback.indexOf("请先") === 0 ? " fs-warn" : "");
        renderPredictions(doc, predictionHost, state);
        layout.hidden = !state.revealed;
        if (!state.revealed) {
          metricsHost.textContent = "";
          ledgerHost.textContent = "";
          certificate.textContent = "提交预测后才显示计算结果。";
          return;
        }
        drawSweep(doc, svg, result.config);
        clear(metricsHost);
        metricsHost.appendChild(metric(doc, "|S|", formatNumber(magnitude(result.sensitivity), 3)));
        metricsHost.appendChild(metric(doc, "|T|", formatNumber(magnitude(result.complementary), 3)));
        metricsHost.appendChild(metric(doc, "S+T−1", formatNumber(result.identityError, 3)));
        metricsHost.appendChild(metric(doc, "选定路径输出", formatNumber(result.selectedOutput, 3)));
        renderLedger(doc, ledgerHost, result);
        certificate.className = "fs-certificate" + (result.identityError < 1e-8 ? "" : " fs-blocked");
        certificate.textContent =
          "账本证书：在负反馈约定下 1+L=" + formatComplex(result.denominator) +
          "，S+T−1 的复数误差为 " + formatNumber(result.identityError, 4) +
          "。当前选定路径是 " + result.config.injection + "；若换成正反馈，分母会改为 1−L，不能沿用这张 S/T 证书。";
      }

      reveal.addEventListener("click", function () {
        var expected = { tracking: "one", path: "disturbance", sign: "minus" };
        var keys = Object.keys(expected);
        var answered = keys.filter(function (key) { return state.predictions[key] !== undefined; });
        if (answered.length < keys.length) {
          state.feedback = "请先完成三个预测，再揭晓账本。";
          render();
          return;
        }
        var correct = keys.filter(function (key) { return state.predictions[key] === expected[key]; }).length;
        state.revealed = true;
        state.feedback = "已揭晓：" + correct + "/" + keys.length + " 命中。现在拖动 K、ω 和注入位置，观察 trade-off。";
        render();
        if (api && typeof api.announce === "function") api.announce(rootNode, state.feedback);
      });
      reset.addEventListener("click", function () {
        state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
        render();
        if (api && typeof api.announce === "function") api.announce(rootNode, "灵敏度实验已重置。");
      });
      refs.gain.input.addEventListener("input", function () {
        state.config = normalizeConfig(Object.assign({}, state.config, { gain: Number(refs.gain.input.value) }));
        render();
      });
      refs.omega.input.addEventListener("input", function () {
        state.config = normalizeConfig(Object.assign({}, state.config, { omega: Number(refs.omega.input.value) }));
        render();
      });
      select.addEventListener("change", function () {
        state.config = normalizeConfig(Object.assign({}, state.config, { injection: select.value }));
        render();
      });
      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) {
        checks += 1;
        assert(condition, message);
      }
      var baseline = evaluate(DEFAULTS);
      check(Math.abs(baseline.identityError) < 1e-10, "negative-feedback S+T identity");
      check(Number.isFinite(baseline.selectedOutput), "selected path is finite");
      check(Math.abs(magnitude(baseline.paths.input) - magnitude(multiply(baseline.plant, baseline.sensitivity))) < 1e-10, "input disturbance path");
      var lowGain = evaluate({ gain: 0.5, omega: 0.2, injection: "output" });
      var highGain = evaluate({ gain: 12, omega: 0.2, injection: "output" });
      check(magnitude(highGain.sensitivity) < magnitude(lowGain.sensitivity), "higher loop gain reduces low-frequency S");
      var lowFrequency = evaluate({ gain: 8, omega: 0.1, injection: "sensor" });
      var highFrequency = evaluate({ gain: 8, omega: 10, injection: "sensor" });
      check(magnitude(highFrequency.complementary) < magnitude(lowFrequency.complementary), "stable plant rolls T off at high frequency");
      var positive = evaluate({ gain: 1, omega: 0.02, feedback: "positive" });
      check(Math.abs(positive.denominator.re - (1 - positive.loop.re)) < 1e-12, "positive-feedback denominator boundary");
      check(frequencySweep(DEFAULTS, 40).length === 40, "frequency sweep count");
      check(normalizeConfig({ injection: "sensor" }).injection === "sensor", "injection validation");
      check(formatNumber(1350, 0) === "1350" && formatNumber(60, 0) === "60", "integer formatter preserves trailing zeroes");
      var rejected = false;
      try { normalizeConfig({ omega: 0 }); } catch (error) { rejected = true; }
      check(rejected, "zero frequency is rejected");
      return { checks: checks };
    }

    return {
      DEFAULTS: DEFAULTS,
      complex: complex,
      add: add,
      multiply: multiply,
      divide: divide,
      magnitude: magnitude,
      formatNumber: formatNumber,
      normalizeConfig: normalizeConfig,
      evaluate: evaluate,
      frequencySweep: frequencySweep,
      mount: mount,
      selfTest: selfTest
    };
  }
);

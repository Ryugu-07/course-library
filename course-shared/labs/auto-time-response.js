(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }

  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("auto-time-response", exported.mount);
  }

  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("auto-time-response self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("auto-time-response self-test: FAIL\n" + error.stack);
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
    var STYLE_ID = "auto-time-response-styles";
    var EPS = 1e-9;
    var DEFAULTS = {
      zeta: 0.5,
      naturalFrequency: 4,
      horizon: 6,
      samples: 361,
      band: 0.02
    };

    var STYLE_TEXT = [
      '[data-learning-lab="auto-time-response"]{--tr-blue:var(--cl-blue,#315f9d);--tr-gold:var(--cl-gold,#9b6a12);--tr-green:var(--cl-green,#39734d);--tr-red:var(--cl-red,#b64335);display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-time-response"] *{box-sizing:border-box}[data-learning-lab="auto-time-response"] [hidden]{display:none!important}',
      '[data-learning-lab="auto-time-response"] h3,[data-learning-lab="auto-time-response"] h4{margin:0;color:var(--fg,currentColor);letter-spacing:0}[data-learning-lab="auto-time-response"] h3{font-size:1.16rem}[data-learning-lab="auto-time-response"] h4{margin-top:16px;font-size:1rem}',
      '[data-learning-lab="auto-time-response"] p{margin:8px 0}[data-learning-lab="auto-time-response"] .tr-note,[data-learning-lab="auto-time-response"] .tr-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="auto-time-response"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="auto-time-response"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
      '[data-learning-lab="auto-time-response"] .tr-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="auto-time-response"] button,[data-learning-lab="auto-time-response"] input{font:inherit}',
      '[data-learning-lab="auto-time-response"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="auto-time-response"] button:hover{border-color:var(--accent,#315f9d)}[data-learning-lab="auto-time-response"] button[aria-pressed="true"],[data-learning-lab="auto-time-response"] .tr-primary{border-color:var(--accent,#315f9d);background:var(--accent,#315f9d);color:var(--bg,#fff);font-weight:750}',
      '[data-learning-lab="auto-time-response"] button:focus-visible,[data-learning-lab="auto-time-response"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="auto-time-response"] button:disabled{cursor:not-allowed;opacity:.55}',
      '[data-learning-lab="auto-time-response"] .tr-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="auto-time-response"] .tr-actions>*{flex:1 1 170px}[data-learning-lab="auto-time-response"] .tr-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="auto-time-response"] .tr-pass{color:var(--tr-green)}[data-learning-lab="auto-time-response"] .tr-warn{color:var(--tr-red)}',
      '[data-learning-lab="auto-time-response"] .tr-layout{display:grid;grid-template-columns:minmax(220px,.72fr) minmax(0,1.28fr);gap:16px;align-items:start;min-width:0}[data-learning-lab="auto-time-response"] .tr-controls,[data-learning-lab="auto-time-response"] .tr-stage{min-width:0}[data-learning-lab="auto-time-response"] .tr-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="auto-time-response"] .tr-control{display:grid;gap:5px;min-width:0}[data-learning-lab="auto-time-response"] .tr-control label{color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}[data-learning-lab="auto-time-response"] .tr-control output{color:var(--accent,#315f9d);font-variant-numeric:tabular-nums}',
      '[data-learning-lab="auto-time-response"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent,#315f9d)}[data-learning-lab="auto-time-response"] .tr-stage-frame{min-width:0;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent);overflow:hidden}[data-learning-lab="auto-time-response"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="auto-time-response"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="auto-time-response"] .tr-grid{stroke:var(--border,#cbd5e1);stroke-width:1;stroke-opacity:.7}[data-learning-lab="auto-time-response"] .tr-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.75}[data-learning-lab="auto-time-response"] .tr-response{fill:none;stroke:var(--tr-blue);stroke-width:2.8}[data-learning-lab="auto-time-response"] .tr-band{fill:var(--tr-gold);fill-opacity:.14;stroke:none}[data-learning-lab="auto-time-response"] .tr-target{stroke:var(--tr-green);stroke-width:1.8;stroke-dasharray:5 4}[data-learning-lab="auto-time-response"] .tr-peak{stroke:var(--tr-red);stroke-width:1.6;stroke-dasharray:4 4}[data-learning-lab="auto-time-response"] .tr-label{font-size:11px}[data-learning-lab="auto-time-response"] .tr-small{font-size:10px;fill:var(--fg-soft,currentColor)!important}',
      '[data-learning-lab="auto-time-response"] .tr-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:12px 0}[data-learning-lab="auto-time-response"] .tr-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#cbd5e1);background:var(--bg,transparent)}[data-learning-lab="auto-time-response"] .tr-metric:nth-child(4n+1){border-color:var(--tr-blue)}[data-learning-lab="auto-time-response"] .tr-metric:nth-child(4n+2){border-color:var(--tr-gold)}[data-learning-lab="auto-time-response"] .tr-metric:nth-child(4n+3){border-color:var(--tr-green)}[data-learning-lab="auto-time-response"] .tr-metric:nth-child(4n){border-color:var(--tr-red)}[data-learning-lab="auto-time-response"] .tr-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11.5px}[data-learning-lab="auto-time-response"] .tr-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-time-response"] .tr-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="auto-time-response"] table{width:100%;min-width:650px;border-collapse:collapse;font-size:11.5px;font-variant-numeric:tabular-nums}[data-learning-lab="auto-time-response"] th,[data-learning-lab="auto-time-response"] td{padding:7px 6px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="auto-time-response"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="auto-time-response"] .tr-certificate{margin-top:11px;padding:10px 12px;border-left:3px solid var(--tr-green);background:var(--bg,transparent);font-size:13px;line-height:1.7}[data-learning-lab="auto-time-response"] .tr-certificate.tr-blocked{border-color:var(--tr-red)}',
      '@media(max-width:900px){[data-learning-lab="auto-time-response"] .tr-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){[data-learning-lab="auto-time-response"] .tr-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:420px){[data-learning-lab="auto-time-response"] .tr-stage-frame{padding:4px}[data-learning-lab="auto-time-response"] table{font-size:10.8px}[data-learning-lab="auto-time-response"] th,[data-learning-lab="auto-time-response"] td{padding-left:4px;padding-right:4px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="auto-time-response"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
    ].join("");

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function finite(value, label) {
      var number = Number(value);
      if (!Number.isFinite(number)) throw new RangeError(label + " must be finite");
      return number;
    }

    function normalizeConfig(input) {
      var source = input || {};
      var zeta = finite(source.zeta === undefined ? DEFAULTS.zeta : source.zeta, "zeta");
      var naturalFrequency = finite(source.naturalFrequency === undefined ? DEFAULTS.naturalFrequency : source.naturalFrequency, "naturalFrequency");
      var horizon = finite(source.horizon === undefined ? DEFAULTS.horizon : source.horizon, "horizon");
      var samples = Math.round(finite(source.samples === undefined ? DEFAULTS.samples : source.samples, "samples"));
      var band = finite(source.band === undefined ? DEFAULTS.band : source.band, "band");
      if (zeta < 0 || zeta > 2.5) throw new RangeError("zeta must be in [0, 2.5]");
      if (naturalFrequency < 0.5 || naturalFrequency > 10) throw new RangeError("naturalFrequency must be in [0.5, 10]");
      if (horizon < 1 || horizon > 30) throw new RangeError("horizon must be in [1, 30]");
      if (samples < 121 || samples > 1201) throw new RangeError("samples must be in [121, 1201]");
      if (band <= 0 || band >= 0.5) throw new RangeError("band must be in (0, 0.5)");
      return { zeta: zeta, naturalFrequency: naturalFrequency, horizon: horizon, samples: samples, band: band };
    }

    function classify(zeta) {
      var value = finite(zeta, "zeta");
      if (Math.abs(value - 1) < EPS) return "critical";
      if (value < 1) return "underdamped";
      return "overdamped";
    }

    function poles(zeta, naturalFrequency) {
      var z = finite(zeta, "zeta");
      var wn = finite(naturalFrequency, "naturalFrequency");
      if (z < 1 - EPS) {
        var wd = wn * Math.sqrt(1 - z * z);
        return [{ re: -z * wn, im: wd }, { re: -z * wn, im: -wd }];
      }
      if (Math.abs(z - 1) < EPS) return [{ re: -wn, im: 0 }, { re: -wn, im: 0 }];
      var root = Math.sqrt(z * z - 1);
      return [
        { re: -wn * (z - root), im: 0 },
        { re: -wn * (z + root), im: 0 }
      ];
    }

    function stepResponse(time, zeta, naturalFrequency) {
      var t = finite(time, "time");
      var z = finite(zeta, "zeta");
      var wn = finite(naturalFrequency, "naturalFrequency");
      if (t < 0) throw new RangeError("time must be nonnegative");
      if (z < 1 - EPS) {
        if (z < EPS) return 1 - Math.cos(wn * t);
        var root = Math.sqrt(1 - z * z);
        var wd = wn * root;
        return 1 - Math.exp(-z * wn * t) * (Math.cos(wd * t) + z / root * Math.sin(wd * t));
      }
      if (Math.abs(z - 1) < EPS) return 1 - Math.exp(-wn * t) * (1 + wn * t);
      var delta = Math.sqrt(z * z - 1);
      var p1 = -wn * (z - delta);
      var p2 = -wn * (z + delta);
      return 1 - (p2 * Math.exp(p1 * t) - p1 * Math.exp(p2 * t)) / (p2 - p1);
    }

    function heuristicSettlingTime(zeta, naturalFrequency) {
      var z = finite(zeta, "zeta");
      return z <= EPS ? Infinity : 4 / (z * finite(naturalFrequency, "naturalFrequency"));
    }

    function measuredSettlingTime(times, values, band) {
      var limit = finite(band, "band");
      if (!times.length || times.length !== values.length) throw new RangeError("time/value arrays must match");
      var lastOutside = -1;
      for (var index = 0; index < values.length; index += 1) {
        if (Math.abs(values[index] - 1) > limit) lastOutside = index;
      }
      if (lastOutside < 0) return 0;
      if (lastOutside >= values.length - 1) return null;
      var leftTime = times[lastOutside];
      var rightTime = times[lastOutside + 1];
      var leftError = Math.abs(values[lastOutside] - 1) - limit;
      var rightError = Math.abs(values[lastOutside + 1] - 1) - limit;
      var denominator = leftError - rightError;
      if (Math.abs(denominator) < EPS) return rightTime;
      return leftTime + (rightTime - leftTime) * leftError / denominator;
    }

    function analyze(input) {
      var config = normalizeConfig(input);
      var times = [];
      var values = [];
      for (var index = 0; index < config.samples; index += 1) {
        var time = config.horizon * index / (config.samples - 1);
        times.push(time);
        values.push(stepResponse(time, config.zeta, config.naturalFrequency));
      }
      var className = classify(config.zeta);
      var systemPoles = poles(config.zeta, config.naturalFrequency);
      var peakValue;
      var peakTime;
      var overshoot;
      if (className === "underdamped") {
        var root = Math.sqrt(1 - config.zeta * config.zeta);
        var peakRatio = Math.exp(-Math.PI * config.zeta / root);
        peakValue = 1 + peakRatio;
        peakTime = Math.PI / (config.naturalFrequency * root);
        overshoot = peakRatio;
      } else {
        peakValue = 1;
        peakTime = Infinity;
        overshoot = 0;
      }
      var measured = measuredSettlingTime(times, values, config.band);
      var samplePeak = Math.max.apply(Math, values);
      return {
        config: config,
        regime: className,
        poles: systemPoles,
        times: times,
        values: values,
        metrics: {
          peakValue: peakValue,
          samplePeakValue: samplePeak,
          peakTime: peakTime,
          overshoot: overshoot,
          heuristicSettling: heuristicSettlingTime(config.zeta, config.naturalFrequency),
          measuredSettling: measured,
          settledInWindow: measured !== null,
          finalValue: values[values.length - 1]
        }
      };
    }

    function formatNumber(value, digits) {
      if (value === Infinity) return "∞";
      if (value === null || value === undefined || !Number.isFinite(value)) return "未定义";
      var places = digits === undefined ? 3 : digits;
      if (Math.abs(value) < 5e-10) return "0";
      if (places === 0) return value.toFixed(0);
      return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
    }

    function formatPole(pole) {
      if (Math.abs(pole.im) < EPS) return formatNumber(pole.re, 3);
      return formatNumber(pole.re, 3) + (pole.im < 0 ? " − j" : " + j") + formatNumber(Math.abs(pole.im), 3);
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
      return element(doc, "div", { className: "tr-metric" }, [
        element(doc, "span", { text: label }),
        element(doc, "strong", { text: value })
      ]);
    }

    function pathFor(times, values, mapX, mapY) {
      return times.map(function (time, index) {
        return (index ? "L" : "M") + mapX(time).toFixed(2) + " " + mapY(values[index]).toFixed(2);
      }).join(" ");
    }

    function drawPlot(doc, svg, result) {
      clear(svg);
      var width = 720;
      var height = 370;
      var left = 48;
      var right = 16;
      var top = 24;
      var bottom = 34;
      var maxY = Math.max(1.1, result.metrics.peakValue * 1.12);
      var minY = result.regime === "underdamped" && result.config.zeta < EPS ? -0.15 : -0.03;
      var mapX = function (time) { return left + time / result.config.horizon * (width - left - right); };
      var mapY = function (value) { return top + (maxY - value) / (maxY - minY) * (height - top - bottom); };
      svg.appendChild(svgElement(doc, "title", {}, "标准二阶单位阶跃精确响应"));
      svg.appendChild(svgElement(doc, "desc", {}, "蓝线为解析单位阶跃响应，金色区域为 2% 稳态带，绿色虚线为目标值。"));
      for (var i = 0; i <= 4; i += 1) {
        var value = minY + (maxY - minY) * (4 - i) / 4;
        var y = mapY(value);
        svg.appendChild(svgElement(doc, "line", { x1: left, y1: y, x2: width - right, y2: y, class: "tr-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: left - 7, y: y + 4, "text-anchor": "end", class: "tr-small" }, formatNumber(value, 2)));
      }
      for (var step = 0; step <= 4; step += 1) {
        var time = result.config.horizon * step / 4;
        var x = mapX(time);
        svg.appendChild(svgElement(doc, "line", { x1: x, y1: top, x2: x, y2: height - bottom, class: "tr-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: x, y: height - 13, "text-anchor": "middle", class: "tr-small" }, formatNumber(time, 1)));
      }
      svg.appendChild(svgElement(doc, "rect", { x: left, y: mapY(1 + result.config.band), width: width - left - right, height: mapY(1 - result.config.band) - mapY(1 + result.config.band), class: "tr-band" }));
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: mapY(1), x2: width - right, y2: mapY(1), class: "tr-target" }));
      svg.appendChild(svgElement(doc, "path", { d: pathFor(result.times, result.values, mapX, mapY), class: "tr-response" }));
      if (Number.isFinite(result.metrics.peakTime)) {
        svg.appendChild(svgElement(doc, "line", { x1: mapX(result.metrics.peakTime), y1: top, x2: mapX(result.metrics.peakTime), y2: height - bottom, class: "tr-peak" }));
      }
      svg.appendChild(svgElement(doc, "text", { x: left, y: 14, class: "tr-label" }, "蓝 y(t)    金 2% 带    绿目标值"));
      svg.appendChild(svgElement(doc, "text", { x: width - right, y: 14, "text-anchor": "end", class: "tr-label" }, "t (s)"));
    }

    function renderLedger(doc, hostNode, result) {
      clear(hostNode);
      var indices = [0, Math.floor(result.rows ? result.rows.length * 0.2 : result.times.length * 0.2), Math.floor(result.times.length * 0.4), Math.floor(result.times.length * 0.6), Math.floor(result.times.length * 0.8), result.times.length - 1];
      var table = element(doc, "table", {}, [
        element(doc, "caption", { className: "tr-note", text: "解析曲线的抽样 ledger" }),
        element(doc, "thead", {}, element(doc, "tr", {}, [
          element(doc, "th", { text: "t" }),
          element(doc, "th", { text: "y(t)" }),
          element(doc, "th", { text: "|y−1|" }),
          element(doc, "th", { text: "2% 带内？" })
        ])),
        element(doc, "tbody")
      ]);
      var body = table.querySelector("tbody");
      indices.forEach(function (index) {
        var time = result.times[index];
        var value = result.values[index];
        if (time === undefined) return;
        body.appendChild(element(doc, "tr", {}, [
          element(doc, "td", { text: formatNumber(time, 3) }),
          element(doc, "td", { text: formatNumber(value, 4) }),
          element(doc, "td", { text: formatNumber(Math.abs(value - 1), 4) }),
          element(doc, "td", { text: Math.abs(value - 1) <= result.config.band ? "是" : "否" })
        ]));
      });
      hostNode.appendChild(element(doc, "div", { className: "tr-table-wrap" }, table));
      var poleTable = element(doc, "table", {}, [
        element(doc, "caption", { className: "tr-note", text: "极点与定义边界" }),
        element(doc, "tbody", {}, [
          element(doc, "tr", {}, [element(doc, "th", { text: "状态" }), element(doc, "td", { text: result.regime })]),
          element(doc, "tr", {}, [element(doc, "th", { text: "极点" }), element(doc, "td", { text: result.poles.map(formatPole).join("；") })])
        ])
      ]);
      hostNode.appendChild(element(doc, "div", { className: "tr-table-wrap" }, poleTable));
    }

    function renderPredictions(doc, hostNode, state) {
      clear(hostNode);
      var specs = [
        { key: "overshoot", prompt: "ζ=0.5、1、1.8 哪些有有限超调？", choices: [["all", "三者都有"], ["under", "只有 0.5"]] },
        { key: "speed", prompt: "ωₙ 加倍首先改变？", choices: [["shape", "超调形状"], ["time", "时间尺度"]] },
        { key: "heuristic", prompt: "4/(ζωₙ) 是最后 crossing 的精确值？", choices: [["yes", "是"], ["no", "不是"]] }
      ];
      specs.forEach(function (spec) {
        var field = element(doc, "fieldset", {}, element(doc, "legend", { text: spec.prompt }));
        var grid = element(doc, "div", { className: "tr-choice-grid" });
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
      var state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
      var shell = element(doc, "div", { className: "tr-shell" });
      var predictionHost = element(doc, "div", { className: "tr-predictions" });
      var feedback = element(doc, "p", { className: "tr-feedback", "aria-live": "polite" });
      var reveal = element(doc, "button", { type: "button", className: "tr-primary", text: "揭晓预测并计算" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      var controlHost = element(doc, "div", { className: "tr-controls" });
      var svg = svgElement(doc, "svg", { viewBox: "0 0 720 370", role: "img", "aria-label": "二阶单位阶跃响应图" });
      var metricsHost = element(doc, "div", { className: "tr-metrics" });
      var ledgerHost = element(doc, "div");
      var certificate = element(doc, "p", { className: "tr-certificate" });
      var refs = {};
      var controls = [
        { key: "zeta", label: "阻尼比 ζ", min: 0, max: 2.5, step: 0.01, digits: 2 },
        { key: "naturalFrequency", label: "自然频率 ωₙ (rad/s)", min: 0.5, max: 10, step: 0.1, digits: 1 },
        { key: "horizon", label: "观察窗口 (s)", min: 1, max: 30, step: 0.5, digits: 1 }
      ];
      controls.forEach(function (item) {
        var input = element(doc, "input", { type: "range", min: item.min, max: item.max, step: item.step, value: state.config[item.key], "aria-label": item.label });
        var output = element(doc, "output", { text: formatNumber(state.config[item.key], item.digits) });
        var label = element(doc, "label", { text: item.label + "：" }, [output]);
        controlHost.appendChild(element(doc, "div", { className: "tr-control" }, [label, input]));
        refs[item.key] = { input: input, output: output, digits: item.digits };
      });
      shell.appendChild(element(doc, "h3", { text: "交互实验：精确二阶时域响应" }));
      shell.appendChild(element(doc, "p", { className: "tr-note", text: "蓝线由闭式解直接计算；启发式 settling 与离散 crossing 分列显示。" }));
      shell.appendChild(predictionHost);
      shell.appendChild(element(doc, "div", { className: "tr-actions" }, [reveal, reset]));
      shell.appendChild(feedback);
      var layout = element(doc, "div", { className: "tr-layout" }, [
        controlHost,
        element(doc, "div", { className: "tr-stage" }, [
          element(doc, "div", { className: "tr-stage-frame" }, svg),
          metricsHost,
          ledgerHost,
          certificate
        ])
      ]);
      shell.appendChild(layout);
      clear(rootNode);
      rootNode.appendChild(shell);

      function render() {
        var result = analyze(state.config);
        Object.keys(refs).forEach(function (key) {
          refs[key].input.value = String(result.config[key]);
          refs[key].output.textContent = formatNumber(result.config[key], refs[key].digits);
        });
        feedback.textContent = state.feedback;
        feedback.className = "tr-feedback" + (state.feedback.indexOf("请先") === 0 ? " tr-warn" : "");
        renderPredictions(doc, predictionHost, state);
        layout.hidden = !state.revealed;
        if (!state.revealed) {
          clear(metricsHost);
          ledgerHost.textContent = "";
          certificate.textContent = "提交预测后才显示极点、峰值和 settling 账本。";
          return;
        }
        drawPlot(doc, svg, result);
        clear(metricsHost);
        metricsHost.appendChild(metric(doc, "状态", result.regime));
        metricsHost.appendChild(metric(doc, "超调 Mₚ", formatNumber(result.metrics.overshoot * 100, 2) + "%"));
        metricsHost.appendChild(metric(doc, "峰值时间", formatNumber(result.metrics.peakTime, 3) + " s"));
        metricsHost.appendChild(metric(doc, "启发式 tₛ", formatNumber(result.metrics.heuristicSettling, 3) + " s"));
        metricsHost.appendChild(metric(doc, "实测 crossing", result.metrics.measuredSettling === null ? "窗口内未找到" : formatNumber(result.metrics.measuredSettling, 3) + " s"));
        metricsHost.appendChild(metric(doc, "末端 y", formatNumber(result.metrics.finalValue, 4)));
        renderLedger(doc, ledgerHost, result);
        certificate.className = "tr-certificate" + (result.metrics.measuredSettling === null && result.config.zeta > EPS ? " tr-blocked" : "");
        certificate.textContent =
          "指标证书：当前极点为 " + result.poles.map(formatPole).join("、") +
          "；tₛ 启发式只由包络 4/(ζωₙ) 给出，而实测值是在 " + result.config.horizon +
          " s 窗口内对精确曲线最后一次进入 2% 带的线性 crossing。窗口不足时不能宣称已 settling。";
      }

      reveal.addEventListener("click", function () {
        var expected = { overshoot: "under", speed: "time", heuristic: "no" };
        var keys = Object.keys(expected);
        if (keys.some(function (key) { return state.predictions[key] === undefined; })) {
          state.feedback = "请先完成三个预测，再揭晓响应指标。";
          render();
          return;
        }
        var correct = keys.filter(function (key) { return state.predictions[key] === expected[key]; }).length;
        state.revealed = true;
        state.feedback = "已揭晓：" + correct + "/" + keys.length + " 命中。试试 ζ=0、1 和 1.8 的边界。";
        render();
        if (api && typeof api.announce === "function") api.announce(rootNode, state.feedback);
      });
      reset.addEventListener("click", function () {
        state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
        render();
        if (api && typeof api.announce === "function") api.announce(rootNode, "二阶时域实验已重置。");
      });
      controls.forEach(function (item) {
        refs[item.key].input.addEventListener("input", function () {
          var next = Object.assign({}, state.config);
          next[item.key] = Number(refs[item.key].input.value);
          state.config = normalizeConfig(next);
          render();
        });
      });
      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) {
        checks += 1;
        assert(condition, message);
      }
      check(Math.abs(stepResponse(0, 0.5, 4)) < EPS, "unit step starts at zero");
      var under = analyze(DEFAULTS);
      check(under.regime === "underdamped", "default regime");
      check(under.metrics.overshoot > 0.16 && under.metrics.overshoot < 0.17, "underdamped overshoot formula");
      check(under.metrics.measuredSettling !== null, "default settles in window");
      var critical = analyze({ zeta: 1, naturalFrequency: 4, horizon: 6 });
      check(critical.regime === "critical" && critical.poles[0].re === -4 && critical.poles[0].im === 0, "critical repeated pole");
      check(critical.metrics.overshoot === 0, "critical no overshoot");
      var over = analyze({ zeta: 1.8, naturalFrequency: 4, horizon: 12 });
      check(over.regime === "overdamped" && over.metrics.overshoot === 0, "overdamped no overshoot");
      var undamped = analyze({ zeta: 0, naturalFrequency: 4, horizon: 6 });
      check(undamped.metrics.measuredSettling === null, "undamped has no finite settling");
      check(undamped.metrics.overshoot === 1, "undamped first peak is 100 percent");
      check(heuristicSettlingTime(0, 4) === Infinity, "heuristic boundary at zero damping");
      check(measuredSettlingTime([0, 1], [1, 1], 0.02) === 0, "already-in-band boundary");
      var rejected = false;
      try { normalizeConfig({ zeta: 3 }); } catch (error) { rejected = true; }
      check(rejected, "zeta boundary validation");
      check(formatNumber(1350, 0) === "1350" && formatNumber(60, 0) === "60", "integer formatter preserves trailing zeroes");
      return { checks: checks };
    }

    return {
      DEFAULTS: DEFAULTS,
      normalizeConfig: normalizeConfig,
      classify: classify,
      poles: poles,
      stepResponse: stepResponse,
      heuristicSettlingTime: heuristicSettlingTime,
      measuredSettlingTime: measuredSettlingTime,
      analyze: analyze,
      formatNumber: formatNumber,
      mount: mount,
      selfTest: selfTest
    };
  }
);

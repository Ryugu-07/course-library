(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }

  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("auto-modeling-msd", exported.mount);
  }

  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("auto-modeling-msd self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("auto-modeling-msd self-test: FAIL\n" + error.stack);
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
    var STYLE_ID = "auto-modeling-msd-styles";
    var EPS = 1e-10;
    var DEFAULTS = {
      mass: 2,
      damping: 1,
      stiffness: 18,
      force: 1,
      mismatch: 0.2,
      noise: 0.02,
      dt: 0.02,
      steps: 220
    };

    var STYLE_TEXT = [
      '[data-learning-lab="auto-modeling-msd"]{--ms-blue:var(--cl-blue,#315f9d);--ms-gold:var(--cl-gold,#9b6a12);--ms-green:var(--cl-green,#39734d);--ms-red:var(--cl-red,#b64335);display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-modeling-msd"] *{box-sizing:border-box}[data-learning-lab="auto-modeling-msd"] [hidden]{display:none!important}',
      '[data-learning-lab="auto-modeling-msd"] h3,[data-learning-lab="auto-modeling-msd"] h4{margin:0;color:var(--fg,currentColor);letter-spacing:0}[data-learning-lab="auto-modeling-msd"] h3{font-size:1.16rem}[data-learning-lab="auto-modeling-msd"] h4{margin-top:16px;font-size:1rem}',
      '[data-learning-lab="auto-modeling-msd"] p{margin:8px 0}[data-learning-lab="auto-modeling-msd"] .ms-note,[data-learning-lab="auto-modeling-msd"] .ms-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="auto-modeling-msd"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="auto-modeling-msd"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
      '[data-learning-lab="auto-modeling-msd"] .ms-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="auto-modeling-msd"] button,[data-learning-lab="auto-modeling-msd"] input{font:inherit}',
      '[data-learning-lab="auto-modeling-msd"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="auto-modeling-msd"] button:hover{border-color:var(--accent,#315f9d)}[data-learning-lab="auto-modeling-msd"] button[aria-pressed="true"],[data-learning-lab="auto-modeling-msd"] .ms-primary{border-color:var(--accent,#315f9d);background:var(--accent,#315f9d);color:var(--bg,#fff);font-weight:750}',
      '[data-learning-lab="auto-modeling-msd"] button:focus-visible,[data-learning-lab="auto-modeling-msd"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="auto-modeling-msd"] button:disabled{cursor:not-allowed;opacity:.55}',
      '[data-learning-lab="auto-modeling-msd"] .ms-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="auto-modeling-msd"] .ms-actions>*{flex:1 1 170px}[data-learning-lab="auto-modeling-msd"] .ms-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="auto-modeling-msd"] .ms-pass{color:var(--ms-green)}[data-learning-lab="auto-modeling-msd"] .ms-warn{color:var(--ms-red)}',
      '[data-learning-lab="auto-modeling-msd"] .ms-layout{display:grid;grid-template-columns:minmax(225px,.72fr) minmax(0,1.28fr);gap:16px;align-items:start;min-width:0}[data-learning-lab="auto-modeling-msd"] .ms-controls,[data-learning-lab="auto-modeling-msd"] .ms-stage{min-width:0}[data-learning-lab="auto-modeling-msd"] .ms-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="auto-modeling-msd"] .ms-control{display:grid;gap:5px;min-width:0}[data-learning-lab="auto-modeling-msd"] .ms-control label{color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}[data-learning-lab="auto-modeling-msd"] .ms-control output{color:var(--accent,#315f9d);font-variant-numeric:tabular-nums}',
      '[data-learning-lab="auto-modeling-msd"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent,#315f9d)}[data-learning-lab="auto-modeling-msd"] .ms-stage-frame{min-width:0;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent);overflow:hidden}[data-learning-lab="auto-modeling-msd"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="auto-modeling-msd"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="auto-modeling-msd"] .ms-grid{stroke:var(--border,#cbd5e1);stroke-width:1;stroke-opacity:.7}[data-learning-lab="auto-modeling-msd"] .ms-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.75}[data-learning-lab="auto-modeling-msd"] .ms-true{fill:none;stroke:var(--ms-blue);stroke-width:2.8}[data-learning-lab="auto-modeling-msd"] .ms-model{fill:none;stroke:var(--ms-gold);stroke-width:2.4;stroke-dasharray:6 4}[data-learning-lab="auto-modeling-msd"] .ms-measurement{fill:var(--ms-red);stroke:var(--bg,#fff);stroke-width:1.2}[data-learning-lab="auto-modeling-msd"] .ms-label{font-size:11px}[data-learning-lab="auto-modeling-msd"] .ms-small{font-size:10px;fill:var(--fg-soft,currentColor)!important}',
      '[data-learning-lab="auto-modeling-msd"] .ms-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:12px 0}[data-learning-lab="auto-modeling-msd"] .ms-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#cbd5e1);background:var(--bg,transparent)}[data-learning-lab="auto-modeling-msd"] .ms-metric:nth-child(4n+1){border-color:var(--ms-blue)}[data-learning-lab="auto-modeling-msd"] .ms-metric:nth-child(4n+2){border-color:var(--ms-gold)}[data-learning-lab="auto-modeling-msd"] .ms-metric:nth-child(4n+3){border-color:var(--ms-green)}[data-learning-lab="auto-modeling-msd"] .ms-metric:nth-child(4n){border-color:var(--ms-red)}[data-learning-lab="auto-modeling-msd"] .ms-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11.5px}[data-learning-lab="auto-modeling-msd"] .ms-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-modeling-msd"] .ms-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="auto-modeling-msd"] table{width:100%;min-width:860px;border-collapse:collapse;font-size:11.5px;font-variant-numeric:tabular-nums}[data-learning-lab="auto-modeling-msd"] th,[data-learning-lab="auto-modeling-msd"] td{padding:7px 6px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="auto-modeling-msd"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="auto-modeling-msd"] .ms-certificate{margin-top:11px;padding:10px 12px;border-left:3px solid var(--ms-green);background:var(--bg,transparent);font-size:13px;line-height:1.7}[data-learning-lab="auto-modeling-msd"] .ms-certificate.ms-blocked{border-color:var(--ms-red)}',
      '@media(max-width:900px){[data-learning-lab="auto-modeling-msd"] .ms-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){[data-learning-lab="auto-modeling-msd"] .ms-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:420px){[data-learning-lab="auto-modeling-msd"] .ms-stage-frame{padding:4px}[data-learning-lab="auto-modeling-msd"] table{font-size:10.8px}[data-learning-lab="auto-modeling-msd"] th,[data-learning-lab="auto-modeling-msd"] td{padding-left:4px;padding-right:4px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="auto-modeling-msd"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
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

    function normalizeConfig(input) {
      var source = input || {};
      var mass = finite(source.mass === undefined ? DEFAULTS.mass : source.mass, "mass");
      var damping = finite(source.damping === undefined ? DEFAULTS.damping : source.damping, "damping");
      var stiffness = finite(source.stiffness === undefined ? DEFAULTS.stiffness : source.stiffness, "stiffness");
      var force = finite(source.force === undefined ? DEFAULTS.force : source.force, "force");
      var mismatch = finite(source.mismatch === undefined ? DEFAULTS.mismatch : source.mismatch, "mismatch");
      var noise = finite(source.noise === undefined ? DEFAULTS.noise : source.noise, "noise");
      var steps = Math.round(finite(source.steps === undefined ? DEFAULTS.steps : source.steps, "steps"));
      if (mass < 0.5 || mass > 5) throw new RangeError("mass must be in [0.5, 5]");
      if (damping < 0.05 || damping > 5) throw new RangeError("damping must be in [0.05, 5]");
      if (stiffness < 2 || stiffness > 40) throw new RangeError("stiffness must be in [2, 40]");
      if (force < 0 || force > 3) throw new RangeError("force must be in [0, 3]");
      if (mismatch < -0.4 || mismatch > 0.4) throw new RangeError("mismatch must be in [-0.4, 0.4]");
      if (noise < 0 || noise > 0.08) throw new RangeError("noise must be in [0, 0.08]");
      if (steps < 120 || steps > 400) throw new RangeError("steps must be in [120, 400]");
      return {
        mass: mass,
        damping: damping,
        stiffness: stiffness,
        force: force,
        mismatch: mismatch,
        noise: noise,
        dt: DEFAULTS.dt,
        steps: steps
      };
    }

    function modelParameters(config) {
      var source = normalizeConfig(config);
      var result = {
        mass: source.mass * (1 + source.mismatch),
        damping: source.damping * (1 - 0.6 * source.mismatch),
        stiffness: source.stiffness * (1 + 0.8 * source.mismatch)
      };
      assert(result.mass > 0 && result.damping > 0 && result.stiffness > 0, "model parameters must remain positive");
      return result;
    }

    function noiseAt(time, amplitude) {
      return amplitude * Math.sin(0.83 * time + 0.4);
    }

    function staticPosition(force, stiffness) {
      return finite(force, "force") / finite(stiffness, "stiffness");
    }

    function dynamicSummary(parameters) {
      var mass = finite(parameters.mass, "mass");
      var damping = finite(parameters.damping, "damping");
      var stiffness = finite(parameters.stiffness, "stiffness");
      return {
        naturalFrequency: Math.sqrt(stiffness / mass),
        dampingRatio: damping / (2 * Math.sqrt(mass * stiffness))
      };
    }

    function stepState(state, force, parameters, dt) {
      var acceleration = (force - parameters.damping * state.v - parameters.stiffness * state.x) / parameters.mass;
      var nextV = state.v + dt * acceleration;
      var nextX = state.x + dt * nextV;
      return { x: nextX, v: nextV, a: acceleration };
    }

    function simulate(input) {
      var config = normalizeConfig(input);
      var model = modelParameters(config);
      var trueState = { x: 0, v: 0 };
      var modelState = { x: 0, v: 0 };
      var rows = [];
      var squaredResidual = 0;
      var squaredNoise = 0;
      var maxAbsPosition = 0;
      for (var index = 0; index < config.steps; index += 1) {
        var time = index * config.dt;
        var trueStep = stepState(trueState, config.force, {
          mass: config.mass,
          damping: config.damping,
          stiffness: config.stiffness
        }, config.dt);
        var modelStep = stepState(modelState, config.force, model, config.dt);
        var measurementNoise = noiseAt(time, config.noise);
        var measurement = trueState.x + measurementNoise;
        var residual = measurement - modelState.x;
        squaredResidual += residual * residual;
        squaredNoise += measurementNoise * measurementNoise;
        maxAbsPosition = Math.max(maxAbsPosition, Math.abs(trueState.x));
        rows.push({
          t: time,
          force: config.force,
          x: trueState.x,
          v: trueState.v,
          acceleration: trueStep.a,
          xNext: trueStep.x,
          vNext: trueStep.v,
          measurementNoise: measurementNoise,
          measurement: measurement,
          modelX: modelState.x,
          modelV: modelState.v,
          modelAcceleration: modelStep.a,
          modelXNext: modelStep.x,
          residual: residual
        });
        trueState = { x: trueStep.x, v: trueStep.v };
        modelState = { x: modelStep.x, v: modelStep.v };
      }
      var trueSummary = dynamicSummary({ mass: config.mass, damping: config.damping, stiffness: config.stiffness });
      var modelSummary = dynamicSummary(model);
      var final = rows[rows.length - 1];
      var signalToNoise = config.noise > EPS ? maxAbsPosition / config.noise : Infinity;
      return {
        config: config,
        model: model,
        rows: rows,
        trueSummary: trueSummary,
        modelSummary: modelSummary,
        metrics: {
          rmse: Math.sqrt(squaredResidual / rows.length),
          noiseRms: Math.sqrt(squaredNoise / rows.length),
          finalPosition: final ? final.xNext : 0,
          finalModelPosition: final ? final.modelXNext : 0,
          maxAbsPosition: maxAbsPosition,
          signalToNoise: signalToNoise,
          trueStaticPosition: staticPosition(config.force, config.stiffness),
          modelStaticPosition: staticPosition(config.force, model.stiffness),
          evidence: config.force <= EPS || signalToNoise < 3 ? "弱：输入或测量信噪比不足" : "可用：过渡段含有动态证据"
        }
      };
    }

    function formatNumber(value, digits) {
      if (!Number.isFinite(value)) return "∞";
      var places = digits === undefined ? 3 : digits;
      if (Math.abs(value) < 5e-10) return "0";
      if (places === 0) return value.toFixed(0);
      return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
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
      return element(doc, "div", { className: "ms-metric" }, [
        element(doc, "span", { text: label }),
        element(doc, "strong", { text: value })
      ]);
    }

    function pathFor(rows, key, mapX, mapY) {
      return rows.map(function (row, index) {
        return (index ? "L" : "M") + mapX(row.t).toFixed(2) + " " + mapY(row[key]).toFixed(2);
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
      var timeMax = result.config.steps * result.config.dt;
      var maxY = Math.max(0.1, result.metrics.maxAbsPosition * 1.25, result.metrics.trueStaticPosition * 1.4);
      var minY = -Math.max(0.02, result.config.noise * 2.2);
      var mapX = function (time) { return left + time / timeMax * (width - left - right); };
      var mapY = function (value) { return top + (maxY - value) / (maxY - minY) * (height - top - bottom); };
      svg.appendChild(svgElement(doc, "title", {}, "质量弹簧阻尼器真实轨迹、偏差模型与测量"));
      svg.appendChild(svgElement(doc, "desc", {}, "蓝线是真实位移，金色虚线是偏差模型预测，红点是确定性带噪测量。"));
      for (var i = 0; i <= 4; i += 1) {
        var value = minY + (maxY - minY) * (4 - i) / 4;
        var y = mapY(value);
        svg.appendChild(svgElement(doc, "line", { x1: left, y1: y, x2: width - right, y2: y, class: "ms-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: left - 7, y: y + 4, "text-anchor": "end", class: "ms-small" }, formatNumber(value, 2)));
      }
      for (var step = 0; step <= 4; step += 1) {
        var time = timeMax * step / 4;
        var x = mapX(time);
        svg.appendChild(svgElement(doc, "line", { x1: x, y1: top, x2: x, y2: height - bottom, class: "ms-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: x, y: height - 13, "text-anchor": "middle", class: "ms-small" }, formatNumber(time, 1)));
      }
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: mapY(0), x2: width - right, y2: mapY(0), class: "ms-axis" }));
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: mapY(result.metrics.trueStaticPosition), x2: width - right, y2: mapY(result.metrics.trueStaticPosition), class: "ms-axis", "stroke-dasharray": "4 4" }));
      svg.appendChild(svgElement(doc, "path", { d: pathFor(result.rows, "x", mapX, mapY), class: "ms-true" }));
      svg.appendChild(svgElement(doc, "path", { d: pathFor(result.rows, "modelX", mapX, mapY), class: "ms-model" }));
      result.rows.forEach(function (row, index) {
        if (index % 8 !== 0) return;
        svg.appendChild(svgElement(doc, "circle", { cx: mapX(row.t), cy: mapY(row.measurement), r: 2.5, class: "ms-measurement" }));
      });
      svg.appendChild(svgElement(doc, "text", { x: left, y: 14, class: "ms-label" }, "蓝 真值 x    金 模型 x̂    红 测量 yₘ"));
      svg.appendChild(svgElement(doc, "text", { x: width - right, y: 14, "text-anchor": "end", class: "ms-label" }, "t (s)"));
    }

    function renderLedger(doc, hostNode, result) {
      clear(hostNode);
      var indices = [0, Math.floor(result.rows.length * 0.25), Math.floor(result.rows.length * 0.5), Math.floor(result.rows.length * 0.75), result.rows.length - 1];
      var table = element(doc, "table", {}, [
        element(doc, "caption", { className: "ms-note", text: "力平衡到观测的逐行 ledger" }),
        element(doc, "thead", {}, element(doc, "tr", {}, [
          element(doc, "th", { text: "t" }),
          element(doc, "th", { text: "F" }),
          element(doc, "th", { text: "a=(F−bv−kx)/m" }),
          element(doc, "th", { text: "x → x₊" }),
          element(doc, "th", { text: "v → v₊" }),
          element(doc, "th", { text: "yₘ" }),
          element(doc, "th", { text: "x̂" }),
          element(doc, "th", { text: "残差" })
        ])),
        element(doc, "tbody")
      ]);
      var body = table.querySelector("tbody");
      indices.forEach(function (index) {
        var row = result.rows[index];
        if (!row) return;
        body.appendChild(element(doc, "tr", {}, [
          element(doc, "td", { text: formatNumber(row.t, 2) }),
          element(doc, "td", { text: formatNumber(row.force, 2) }),
          element(doc, "td", { text: formatNumber(row.acceleration, 3) }),
          element(doc, "td", { text: formatNumber(row.x, 3) + " → " + formatNumber(row.xNext, 3) }),
          element(doc, "td", { text: formatNumber(row.v, 3) + " → " + formatNumber(row.vNext, 3) }),
          element(doc, "td", { text: formatNumber(row.measurement, 3) }),
          element(doc, "td", { text: formatNumber(row.modelX, 3) }),
          element(doc, "td", { text: formatNumber(row.residual, 3) })
        ]));
      });
      hostNode.appendChild(element(doc, "div", { className: "ms-table-wrap" }, table));
    }

    function renderPredictions(doc, hostNode, state) {
      clear(hostNode);
      var specs = [
        { key: "static", prompt: "恒力稳态主要由哪项平衡？", choices: [["mass", "m x¨"], ["damping", "b x˙"], ["spring", "k x"]] },
        { key: "identifiability", prompt: "只看最终位移能否分离 m 与 b？", choices: [["yes", "能"], ["no", "不能"]] },
        { key: "validity", prompt: "大位移时线性模型是？", choices: [["fact", "普遍事实"], ["local", "局部近似"]] }
      ];
      specs.forEach(function (spec) {
        var field = element(doc, "fieldset", {}, element(doc, "legend", { text: spec.prompt }));
        var grid = element(doc, "div", { className: "ms-choice-grid" });
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
      var shell = element(doc, "div", { className: "ms-shell" });
      var predictionHost = element(doc, "div", { className: "ms-predictions" });
      var feedback = element(doc, "p", { className: "ms-feedback", "aria-live": "polite" });
      var reveal = element(doc, "button", { type: "button", className: "ms-primary", text: "揭晓预测并模拟" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      var controlHost = element(doc, "div", { className: "ms-controls" });
      var svg = svgElement(doc, "svg", { viewBox: "0 0 720 370", role: "img", "aria-label": "质量弹簧阻尼器位移轨迹" });
      var metricsHost = element(doc, "div", { className: "ms-metrics" });
      var ledgerHost = element(doc, "div");
      var certificate = element(doc, "p", { className: "ms-certificate" });
      var refs = {};
      var controls = [
        { key: "mass", label: "真实质量 m (kg)", min: 0.5, max: 5, step: 0.1, digits: 1 },
        { key: "damping", label: "真实阻尼 b (N·s/m)", min: 0.05, max: 5, step: 0.05, digits: 2 },
        { key: "stiffness", label: "真实刚度 k (N/m)", min: 2, max: 40, step: 0.5, digits: 1 },
        { key: "force", label: "阶跃力 F (N)", min: 0, max: 3, step: 0.05, digits: 2 },
        { key: "mismatch", label: "模型偏差 ρ", min: -0.4, max: 0.4, step: 0.01, digits: 2 },
        { key: "noise", label: "测量偏差幅值 (m)", min: 0, max: 0.08, step: 0.002, digits: 3 }
      ];
      controls.forEach(function (item) {
        var input = element(doc, "input", { type: "range", min: item.min, max: item.max, step: item.step, value: state.config[item.key], "aria-label": item.label });
        var output = element(doc, "output", { text: formatNumber(state.config[item.key], item.digits) });
        var label = element(doc, "label", { text: item.label + "：" }, [output]);
        controlHost.appendChild(element(doc, "div", { className: "ms-control" }, [label, input]));
        refs[item.key] = { input: input, output: output, digits: item.digits };
      });
      shell.appendChild(element(doc, "h3", { text: "交互实验：质量—弹簧—阻尼建模账本" }));
      shell.appendChild(element(doc, "p", { className: "ms-note", text: "蓝线是真实力平衡，金色虚线是偏差模型，红点是可重复的测量证据。" }));
      shell.appendChild(predictionHost);
      shell.appendChild(element(doc, "div", { className: "ms-actions" }, [reveal, reset]));
      shell.appendChild(feedback);
      var layout = element(doc, "div", { className: "ms-layout" }, [
        controlHost,
        element(doc, "div", { className: "ms-stage" }, [
          element(doc, "div", { className: "ms-stage-frame" }, svg),
          metricsHost,
          ledgerHost,
          certificate
        ])
      ]);
      shell.appendChild(layout);
      clear(rootNode);
      rootNode.appendChild(shell);

      function render() {
        var result = simulate(state.config);
        Object.keys(refs).forEach(function (key) {
          refs[key].input.value = String(result.config[key]);
          refs[key].output.textContent = formatNumber(result.config[key], refs[key].digits);
        });
        feedback.textContent = state.feedback;
        feedback.className = "ms-feedback" + (state.feedback.indexOf("请先") === 0 ? " ms-warn" : "");
        renderPredictions(doc, predictionHost, state);
        layout.hidden = !state.revealed;
        if (!state.revealed) {
          clear(metricsHost);
          ledgerHost.textContent = "";
          certificate.textContent = "提交预测后才显示轨迹、偏差与证据强度。";
          return;
        }
        drawPlot(doc, svg, result);
        clear(metricsHost);
        metricsHost.appendChild(metric(doc, "ωₙ (rad/s)", formatNumber(result.trueSummary.naturalFrequency, 3)));
        metricsHost.appendChild(metric(doc, "ζ", formatNumber(result.trueSummary.dampingRatio, 3)));
        metricsHost.appendChild(metric(doc, "真实静态 x∞", formatNumber(result.metrics.trueStaticPosition, 4)));
        metricsHost.appendChild(metric(doc, "模型静态 x̂∞", formatNumber(result.metrics.modelStaticPosition, 4)));
        metricsHost.appendChild(metric(doc, "轨迹 RMSE", formatNumber(result.metrics.rmse, 4)));
        metricsHost.appendChild(metric(doc, "证据", result.metrics.evidence));
        renderLedger(doc, ledgerHost, result);
        certificate.className = "ms-certificate" + (result.metrics.evidence.indexOf("弱") === 0 ? " ms-blocked" : "");
        certificate.textContent =
          "模型证书：真实参数给出 m x¨+b x˙+k x=F，当前模型使用 ρ=" + formatNumber(result.config.mismatch, 2) +
          " 的结构化偏差，且测量是 x+ρₙ sin(0.83t+0.4)。RMSE 只衡量这个确定性观察窗，不证明参数已经唯一可辨识；改变激励与观测质量后应重新判断。";
      }

      reveal.addEventListener("click", function () {
        var expected = { static: "spring", identifiability: "no", validity: "local" };
        var keys = Object.keys(expected);
        if (keys.some(function (key) { return state.predictions[key] === undefined; })) {
          state.feedback = "请先完成三个预测，再揭晓模型轨迹。";
          render();
          return;
        }
        var correct = keys.filter(function (key) { return state.predictions[key] === expected[key]; }).length;
        state.revealed = true;
        state.feedback = "已揭晓：" + correct + "/" + keys.length + " 命中。拖动模型偏差与噪声，区分结构误差和观测误差。";
        render();
        if (api && typeof api.announce === "function") api.announce(rootNode, state.feedback);
      });
      reset.addEventListener("click", function () {
        state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
        render();
        if (api && typeof api.announce === "function") api.announce(rootNode, "质量弹簧阻尼建模实验已重置。");
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
      var baseline = simulate(DEFAULTS);
      check(baseline.rows.length === DEFAULTS.steps, "fixed simulation length");
      check(baseline.rows.every(function (row) {
        return Number.isFinite(row.xNext) && Number.isFinite(row.vNext) && Number.isFinite(row.residual);
      }), "finite state and measurement ledger");
      check(Math.abs(baseline.rows[0].xNext - DEFAULTS.dt * baseline.rows[0].vNext) < EPS, "semi-implicit position invariant");
      check(Math.abs(baseline.metrics.trueStaticPosition - 1 / 18) < EPS, "static stiffness mapping");
      check(baseline.model.mass > DEFAULTS.mass && baseline.model.stiffness > DEFAULTS.stiffness, "positive mismatch changes model");
      var noMismatch = simulate(Object.assign({}, DEFAULTS, { mismatch: 0, noise: 0 }));
      check(noMismatch.metrics.rmse < 1e-12, "matched noiseless model has zero residual");
      var noForce = simulate({ force: 0, mismatch: 0, noise: 0 });
      check(noForce.metrics.maxAbsPosition === 0, "zero force leaves zero state");
      check(noForce.metrics.evidence.indexOf("弱") === 0, "zero excitation is weak evidence");
      var noisy = simulate(Object.assign({}, DEFAULTS, { noise: 0.06 }));
      check(noisy.metrics.noiseRms > baseline.metrics.noiseRms, "measurement evidence varies with noise");
      var rejected = false;
      try { normalizeConfig({ mass: 0 }); } catch (error) { rejected = true; }
      check(rejected, "nonpositive mass is rejected");
      check(formatNumber(1350, 0) === "1350" && formatNumber(60, 0) === "60", "integer formatter preserves trailing zeroes");
      return { checks: checks };
    }

    return {
      DEFAULTS: DEFAULTS,
      normalizeConfig: normalizeConfig,
      modelParameters: modelParameters,
      dynamicSummary: dynamicSummary,
      staticPosition: staticPosition,
      stepState: stepState,
      simulate: simulate,
      formatNumber: formatNumber,
      mount: mount,
      selfTest: selfTest
    };
  }
);

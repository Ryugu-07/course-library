(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }

  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("auto-kalman-estimator", exported.mount);
  }

  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("auto-kalman-estimator self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("auto-kalman-estimator self-test: FAIL\n" + error.stack);
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

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "auto-kalman-estimator-styles";
    var EPS = 1e-10;
    var DEFAULTS = {
      q: 0.18,
      r: 0.56,
      steps: 24,
      dt: 1,
      seed: 20260824,
      measurementSigma: Math.sqrt(0.56),
      initialState: [0, 0],
      initialCovariance: [[4, 0], [0, 1]]
    };

    var STYLE_TEXT = [
      '[data-learning-lab="auto-kalman-estimator"]{--kf-blue:var(--cl-blue,#315f9d);--kf-gold:var(--cl-gold,#9b6a12);--kf-green:var(--cl-green,#39734d);--kf-red:var(--cl-red,#b64335);display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-kalman-estimator"] *{box-sizing:border-box}[data-learning-lab="auto-kalman-estimator"] [hidden]{display:none!important}',
      '[data-learning-lab="auto-kalman-estimator"] h3,[data-learning-lab="auto-kalman-estimator"] h4{margin:0;color:var(--fg,currentColor);letter-spacing:0}[data-learning-lab="auto-kalman-estimator"] h3{font-size:1.16rem}[data-learning-lab="auto-kalman-estimator"] h4{margin-top:16px;font-size:1rem}',
      '[data-learning-lab="auto-kalman-estimator"] p{margin:8px 0}[data-learning-lab="auto-kalman-estimator"] .kf-note,[data-learning-lab="auto-kalman-estimator"] .kf-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="auto-kalman-estimator"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="auto-kalman-estimator"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
      '[data-learning-lab="auto-kalman-estimator"] .kf-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="auto-kalman-estimator"] button,[data-learning-lab="auto-kalman-estimator"] select,[data-learning-lab="auto-kalman-estimator"] input{font:inherit}',
      '[data-learning-lab="auto-kalman-estimator"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="auto-kalman-estimator"] button:hover{border-color:var(--accent,#315f9d)}[data-learning-lab="auto-kalman-estimator"] button[aria-pressed="true"],[data-learning-lab="auto-kalman-estimator"] .kf-primary{border-color:var(--accent,#315f9d);background:var(--accent,#315f9d);color:var(--bg,#fff);font-weight:750}',
      '[data-learning-lab="auto-kalman-estimator"] button:focus-visible,[data-learning-lab="auto-kalman-estimator"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="auto-kalman-estimator"] button:disabled{cursor:not-allowed;opacity:.55}',
      '[data-learning-lab="auto-kalman-estimator"] .kf-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="auto-kalman-estimator"] .kf-actions>*{flex:1 1 170px}[data-learning-lab="auto-kalman-estimator"] .kf-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="auto-kalman-estimator"] .kf-pass{color:var(--kf-green)}[data-learning-lab="auto-kalman-estimator"] .kf-warn{color:var(--kf-red)}',
      '[data-learning-lab="auto-kalman-estimator"] .kf-layout{display:grid;grid-template-columns:minmax(220px,.72fr) minmax(0,1.28fr);gap:16px;align-items:start;min-width:0}[data-learning-lab="auto-kalman-estimator"] .kf-controls,[data-learning-lab="auto-kalman-estimator"] .kf-stage{min-width:0}[data-learning-lab="auto-kalman-estimator"] .kf-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="auto-kalman-estimator"] .kf-control{display:grid;gap:5px;min-width:0}[data-learning-lab="auto-kalman-estimator"] .kf-control label{color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}[data-learning-lab="auto-kalman-estimator"] .kf-control output{color:var(--accent,#315f9d);font-variant-numeric:tabular-nums}',
      '[data-learning-lab="auto-kalman-estimator"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent,#315f9d)}[data-learning-lab="auto-kalman-estimator"] .kf-stage-frame{min-width:0;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent);overflow:hidden}[data-learning-lab="auto-kalman-estimator"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="auto-kalman-estimator"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="auto-kalman-estimator"] .kf-grid{stroke:var(--border,#cbd5e1);stroke-width:1;stroke-opacity:.7}[data-learning-lab="auto-kalman-estimator"] .kf-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.75}[data-learning-lab="auto-kalman-estimator"] .kf-truth{fill:none;stroke:var(--kf-green);stroke-width:1.8;stroke-dasharray:6 4}[data-learning-lab="auto-kalman-estimator"] .kf-prediction{fill:none;stroke:var(--kf-gold);stroke-width:1.6;stroke-dasharray:3 3}[data-learning-lab="auto-kalman-estimator"] .kf-estimate{fill:none;stroke:var(--kf-blue);stroke-width:2.8}[data-learning-lab="auto-kalman-estimator"] .kf-band{fill:var(--kf-blue);fill-opacity:.14;stroke:none}[data-learning-lab="auto-kalman-estimator"] .kf-measurement{fill:var(--kf-red);stroke:var(--bg,#fff);stroke-width:1.5}[data-learning-lab="auto-kalman-estimator"] .kf-label{font-size:11px}[data-learning-lab="auto-kalman-estimator"] .kf-small{font-size:10px;fill:var(--fg-soft,currentColor)!important}',
      '[data-learning-lab="auto-kalman-estimator"] .kf-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:12px 0}[data-learning-lab="auto-kalman-estimator"] .kf-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#cbd5e1);background:var(--bg,transparent)}[data-learning-lab="auto-kalman-estimator"] .kf-metric:nth-child(3n+1){border-color:var(--kf-blue)}[data-learning-lab="auto-kalman-estimator"] .kf-metric:nth-child(3n+2){border-color:var(--kf-gold)}[data-learning-lab="auto-kalman-estimator"] .kf-metric:nth-child(3n){border-color:var(--kf-green)}[data-learning-lab="auto-kalman-estimator"] .kf-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11.5px}[data-learning-lab="auto-kalman-estimator"] .kf-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-kalman-estimator"] .kf-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="auto-kalman-estimator"] table{width:100%;min-width:850px;border-collapse:collapse;font-size:11.5px;font-variant-numeric:tabular-nums}[data-learning-lab="auto-kalman-estimator"] th,[data-learning-lab="auto-kalman-estimator"] td{padding:7px 6px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="auto-kalman-estimator"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="auto-kalman-estimator"] .kf-certificate{margin-top:11px;padding:10px 12px;border-left:3px solid var(--kf-green);background:var(--bg,transparent);font-size:13px;line-height:1.7}',
      '@media(max-width:900px){[data-learning-lab="auto-kalman-estimator"] .kf-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){[data-learning-lab="auto-kalman-estimator"] .kf-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:420px){[data-learning-lab="auto-kalman-estimator"] .kf-stage-frame{padding:4px}[data-learning-lab="auto-kalman-estimator"] table{font-size:10.8px}[data-learning-lab="auto-kalman-estimator"] th,[data-learning-lab="auto-kalman-estimator"] td{padding-left:4px;padding-right:4px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="auto-kalman-estimator"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
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

    function normalizeConfig(input) {
      var source = input || {};
      var q = finite(source.q === undefined ? DEFAULTS.q : source.q, "Q");
      var r = finite(source.r === undefined ? DEFAULTS.r : source.r, "R");
      var steps = Math.round(finite(source.steps === undefined ? DEFAULTS.steps : source.steps, "steps"));
      var seed = Math.floor(finite(source.seed === undefined ? DEFAULTS.seed : source.seed, "seed"));
      if (q < 0.001 || q > 3) throw new RangeError("Q must be in [0.001, 3]");
      if (r < 0.05 || r > 5) throw new RangeError("R must be in [0.05, 5]");
      if (steps < 8 || steps > 40) throw new RangeError("steps must be in [8, 40]");
      if (seed < 1 || seed > 4294967295) throw new RangeError("seed must be a uint32 seed");
      return {
        q: q,
        r: r,
        steps: steps,
        dt: DEFAULTS.dt,
        seed: seed,
        measurementSigma: DEFAULTS.measurementSigma,
        initialState: DEFAULTS.initialState.slice(),
        initialCovariance: [
          DEFAULTS.initialCovariance[0].slice(),
          DEFAULTS.initialCovariance[1].slice()
        ]
      };
    }

    function rng(seed) {
      var state = Math.floor(seed) >>> 0;
      return function () {
        state = (1664525 * state + 1013904223) >>> 0;
        return (state + 1) / 4294967297;
      };
    }

    function gaussian(random) {
      var u1 = Math.max(1e-12, random());
      var u2 = random();
      return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }

    function truthAt(step) {
      var position = 0.6 * step + 0.018 * step * step;
      return { position: position, velocity: 0.6 + 0.036 * step };
    }

    function generateMeasurements(input) {
      var source = input || {};
      var steps = Math.round(finite(source.steps === undefined ? DEFAULTS.steps : source.steps, "steps"));
      var seed = Math.floor(finite(source.seed === undefined ? DEFAULTS.seed : source.seed, "seed"));
      if (steps < 1 || steps > 80) throw new RangeError("measurement steps out of range");
      if (seed < 1 || seed > 4294967295) throw new RangeError("measurement seed out of range");
      var random = rng(seed);
      var rows = [];
      for (var k = 0; k < steps; k += 1) {
        var truth = truthAt(k);
        var noise = DEFAULTS.measurementSigma * gaussian(random);
        rows.push({
          k: k,
          truthPosition: truth.position,
          truthVelocity: truth.velocity,
          noise: noise,
          measurement: truth.position + noise
        });
      }
      return rows;
    }

    function processCovariance(q, dt) {
      var dt2 = dt * dt;
      var dt3 = dt2 * dt;
      var dt4 = dt2 * dt2;
      return [
        [q * dt4 / 4, q * dt3 / 2],
        [q * dt3 / 2, q * dt2]
      ];
    }

    function runFilter(input, providedMeasurements) {
      var config = normalizeConfig(input);
      var measurements = providedMeasurements || generateMeasurements(config);
      if (!measurements || measurements.length < config.steps) {
        throw new RangeError("not enough measurements for requested steps");
      }
      var qMatrix = processCovariance(config.q, config.dt);
      var x = config.initialState.slice();
      var p = [
        config.initialCovariance[0].slice(),
        config.initialCovariance[1].slice()
      ];
      var rows = [];
      var innovationSquared = 0;
      for (var k = 0; k < config.steps; k += 1) {
        var measurement = measurements[k];
        var predicted = [
          x[0] + config.dt * x[1],
          x[1]
        ];
        var predictedCovariance = [
          [
            p[0][0] + 2 * config.dt * p[0][1] + config.dt * config.dt * p[1][1] + qMatrix[0][0],
            p[0][1] + config.dt * p[1][1] + qMatrix[0][1]
          ],
          [
            p[1][0] + config.dt * p[1][1] + qMatrix[1][0],
            p[1][1] + qMatrix[1][1]
          ]
        ];
        predictedCovariance[1][0] = predictedCovariance[0][1];
        var innovation = measurement.measurement - predicted[0];
        var innovationVariance = predictedCovariance[0][0] + config.r;
        var gain = [
          predictedCovariance[0][0] / innovationVariance,
          predictedCovariance[1][0] / innovationVariance
        ];
        x = [
          predicted[0] + gain[0] * innovation,
          predicted[1] + gain[1] * innovation
        ];
        p = [
          [
            (1 - gain[0]) * predictedCovariance[0][0],
            (1 - gain[0]) * predictedCovariance[0][1]
          ],
          [
            predictedCovariance[1][0] - gain[1] * predictedCovariance[0][0],
            predictedCovariance[1][1] - gain[1] * predictedCovariance[0][1]
          ]
        ];
        p[1][0] = p[0][1];
        innovationSquared += innovation * innovation;
        rows.push({
          k: k,
          truthPosition: measurement.truthPosition,
          truthVelocity: measurement.truthVelocity,
          measurement: measurement.measurement,
          noise: measurement.noise,
          predictedPosition: predicted[0],
          predictedVelocity: predicted[1],
          predictedPPosition: predictedCovariance[0][0],
          predictedPVelocity: predictedCovariance[1][1],
          innovation: innovation,
          innovationVariance: innovationVariance,
          gainPosition: gain[0],
          gainVelocity: gain[1],
          estimatePosition: x[0],
          estimateVelocity: x[1],
          pPosition: p[0][0],
          pVelocity: p[1][1],
          pCross: p[0][1]
        });
      }
      var last = rows[rows.length - 1];
      var rms = Math.sqrt(innovationSquared / Math.max(1, rows.length));
      return {
        config: config,
        measurements: measurements.slice(0, config.steps),
        rows: rows,
        metrics: {
          finalPositionError: last ? last.estimatePosition - last.truthPosition : 0,
          finalPositionStd: last ? Math.sqrt(Math.max(0, last.pPosition)) : 0,
          finalGainPosition: last ? last.gainPosition : 0,
          innovationRms: rms,
          finalEstimatePosition: last ? last.estimatePosition : 0
        }
      };
    }

    function formatNumber(value, digits) {
      if (!Number.isFinite(value)) return "—";
      var places = digits === undefined ? 3 : digits;
      if (Math.abs(value) < 5e-10) return "0";
      if (places === 0) return value.toFixed(0);
      var output = value.toFixed(places);
      return output.replace(/0+$/, "").replace(/\.$/, "");
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

    function drawKalmanSvg(doc, svg, result) {
      clear(svg);
      var width = 720;
      var height = 400;
      var left = 48;
      var right = 17;
      var top = 30;
      var bottom = 38;
      var values = [];
      result.rows.forEach(function (row) {
        values.push(row.truthPosition, row.measurement, row.estimatePosition);
        values.push(row.estimatePosition + 2 * Math.sqrt(Math.max(0, row.pPosition)));
        values.push(row.estimatePosition - 2 * Math.sqrt(Math.max(0, row.pPosition)));
      });
      var minValue = Math.min.apply(null, values);
      var maxValue = Math.max.apply(null, values);
      var pad = Math.max(1, (maxValue - minValue) * 0.12);
      var yMin = minValue - pad;
      var yMax = maxValue + pad;
      var xMax = Math.max(1, result.rows.length - 1);
      var mapX = function (value) { return left + value / xMax * (width - left - right); };
      var mapY = function (value) { return top + (yMax - value) / (yMax - yMin) * (height - top - bottom); };
      svg.appendChild(svgElement(doc, "title", {}, "固定 seed 测量下的卡尔曼位置估计与不确定度带"));
      svg.appendChild(svgElement(doc, "desc", {}, "红点是带噪位置测量，绿虚线是真值，蓝线是估计，蓝色透明带是估计位置的两倍标准差。"));
      for (var i = 0; i <= 4; i += 1) {
        var y = top + (height - top - bottom) * i / 4;
        var value = yMax - (yMax - yMin) * i / 4;
        svg.appendChild(svgElement(doc, "line", { x1: left, y1: y, x2: width - right, y2: y, class: "kf-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: left - 7, y: y + 4, "text-anchor": "end", class: "kf-small" }, formatNumber(value, 1)));
      }
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: height - bottom, x2: width - right, y2: height - bottom, class: "kf-axis" }));
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: height - bottom, class: "kf-axis" }));
      var upper = result.rows.map(function (row) {
        return mapX(row.k).toFixed(2) + " " + mapY(row.estimatePosition + 2 * Math.sqrt(Math.max(0, row.pPosition))).toFixed(2);
      });
      var lower = result.rows.slice().reverse().map(function (row) {
        return mapX(row.k).toFixed(2) + " " + mapY(row.estimatePosition - 2 * Math.sqrt(Math.max(0, row.pPosition))).toFixed(2);
      });
      svg.appendChild(svgElement(doc, "path", { d: "M" + upper.concat(lower).join(" L"), class: "kf-band" }));
      svg.appendChild(svgElement(doc, "path", { d: linePath(result.rows, "truthPosition", mapX, mapY), class: "kf-truth" }));
      svg.appendChild(svgElement(doc, "path", { d: linePath(result.rows, "predictedPosition", mapX, mapY), class: "kf-prediction" }));
      svg.appendChild(svgElement(doc, "path", { d: linePath(result.rows, "estimatePosition", mapX, mapY), class: "kf-estimate" }));
      result.rows.forEach(function (row) {
        svg.appendChild(svgElement(doc, "circle", { cx: mapX(row.k), cy: mapY(row.measurement), r: 3.8, class: "kf-measurement" }));
      });
      svg.appendChild(svgElement(doc, "text", { x: left + 4, y: top + 13, class: "kf-label" }, "位置：真值 / 预测 / 估计 ±2σ"));
      svg.appendChild(svgElement(doc, "text", { x: width - right, y: height - 9, "text-anchor": "end", class: "kf-small" }, "采样 k"));
    }

    function metric(doc, label, value) {
      return element(doc, "div", { className: "kf-metric" }, [
        element(doc, "span", { text: label }),
        element(doc, "strong", { text: value })
      ]);
    }

    function renderLedger(doc, hostNode, result) {
      var body = element(doc, "tbody");
      result.rows.forEach(function (row) {
        body.appendChild(element(doc, "tr", {}, [
          element(doc, "th", { text: String(row.k) }),
          element(doc, "td", { text: formatNumber(row.measurement, 3) }),
          element(doc, "td", { text: formatNumber(row.predictedPosition, 3) }),
          element(doc, "td", { text: formatNumber(row.innovation, 3) }),
          element(doc, "td", { text: formatNumber(row.innovationVariance, 3) }),
          element(doc, "td", { text: formatNumber(row.gainPosition, 3) }),
          element(doc, "td", { text: formatNumber(row.gainVelocity, 3) }),
          element(doc, "td", { text: formatNumber(row.estimatePosition, 3) }),
          element(doc, "td", { text: formatNumber(row.pPosition, 3) })
        ]));
      });
      clear(hostNode);
      hostNode.appendChild(element(doc, "table", {}, [
        element(doc, "caption", { text: "Kalman 预测—创新—更新透明账本；测量来自固定 seed" }),
        element(doc, "thead", {}, [element(doc, "tr", {}, [
          element(doc, "th", { text: "k" }),
          element(doc, "th", { text: "z_k" }),
          element(doc, "th", { text: "p_pred" }),
          element(doc, "th", { text: "创新 ν" }),
          element(doc, "th", { text: "S" }),
          element(doc, "th", { text: "K_pos" }),
          element(doc, "th", { text: "K_vel" }),
          element(doc, "th", { text: "p_hat" }),
          element(doc, "th", { text: "P_pos" })
        ])]),
        body
      ]));
    }

    function questionSpecs() {
      return [
        {
          key: "r",
          prompt: "在同一模型下增大 R（测量方差），卡尔曼位置增益通常怎样变化？",
          expected: "small",
          choices: [
            { value: "small", label: "变小，更信模型" },
            { value: "large", label: "变大，更信测量" },
            { value: "same", label: "完全不变" }
          ]
        },
        {
          key: "innovation",
          prompt: "创新 ν_k 的正式定义是哪一个？",
          expected: "difference",
          choices: [
            { value: "difference", label: "z_k − C x̂_pred" },
            { value: "sum", label: "z_k + C x̂_pred" },
            { value: "cov", label: "P_pred + R" }
          ]
        },
        {
          key: "covariance",
          prompt: "一次有信息的测量更新后，位置 P_pos 相对于 P_pred 通常怎样？",
          expected: "down",
          choices: [
            { value: "down", label: "下降，表示不确定度收缩" },
            { value: "up", label: "上升，表示测量更吵" },
            { value: "zero", label: "必定变成 0" }
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
            button.node.className = correct ? "kf-pass" : selected ? "kf-warn" : "";
          }
        });
      });
    }

    function mount(rootNode, api) {
      if (!rootNode || !rootNode.ownerDocument) return;
      var doc = rootNode.ownerDocument;
      installStyles(doc);
      var state = {
        config: normalizeConfig(DEFAULTS),
        predictions: {},
        revealed: false,
        feedback: ""
      };
      var refs = { questions: [] };
      var shell = element(doc, "div", { className: "kf-lab" });
      shell.appendChild(element(doc, "h3", { text: "Kalman 估计实验：Q/R、创新、增益与协方差" }));
      shell.appendChild(element(doc, "p", {
        className: "kf-note",
        text: "一维位置测量 + 速度状态的常速度模型。测量序列由固定 seed 生成，改变 Q/R 只改变滤波器的信任权重，不重抽数据。"
      }));
      var predictionHost = element(doc, "div");
      questionSpecs().forEach(function (spec) {
        var fieldset = element(doc, "fieldset");
        fieldset.appendChild(element(doc, "legend", { text: spec.prompt }));
        var grid = element(doc, "div", { className: "kf-choice-grid" });
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
      var actions = element(doc, "div", { className: "kf-actions" });
      var reveal = element(doc, "button", { type: "button", className: "kf-primary", text: "提交预测并揭晓" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      var feedback = element(doc, "p", { className: "kf-feedback", "aria-live": "polite" });
      var resultShell = element(doc, "div", { hidden: true });
      var controlRefs = {};
      function makeRange(key, label, min, max, step, digits) {
        var input = element(doc, "input", {
          type: "range",
          min: String(min),
          max: String(max),
          step: String(step),
          value: String(state.config[key]),
          "aria-label": label
        });
        var output = element(doc, "output", { text: formatNumber(state.config[key], digits) });
        controlRefs[key] = { input: input, output: output, digits: digits };
        return element(doc, "div", { className: "kf-control" }, [
          element(doc, "label", {}, [label + " = ", output]),
          input
        ]);
      }
      var controls = element(doc, "div", { className: "kf-controls" }, [
        makeRange("q", "过程噪声 Q", 0.01, 1.2, 0.01, 2),
        makeRange("r", "测量噪声 R", 0.05, 2.5, 0.05, 2),
        makeRange("steps", "测量步数", 12, 32, 1, 0),
        element(doc, "p", { className: "kf-note", text: "固定输入：dt=1、初始 x̂=[0,0]、P0=diag(4,1)、seed=20260824。Q 是常速度模型对未知加速度的信任旋钮，R 不会重画测量点。" })
      ]);
      var svg = svgElement(doc, "svg", { viewBox: "0 0 720 400", role: "img", "aria-label": "卡尔曼估计曲线" });
      var svgFrame = element(doc, "div", { className: "kf-stage-frame" }, [svg]);
      var metricsHost = element(doc, "div", { className: "kf-metrics" });
      var tableHost = element(doc, "div", { className: "kf-table-wrap" });
      var certificate = element(doc, "p", { className: "kf-certificate" });
      resultShell.appendChild(element(doc, "div", { className: "kf-layout" }, [
        controls,
        element(doc, "div", { className: "kf-stage" }, [svgFrame, metricsHost, tableHost, certificate])
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
          state.feedback = "请先完成三项预测；结果图、Q/R 控件和创新账本会在提交后出现。";
          render();
          return;
        }
        var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
        state.revealed = true;
        state.feedback = "已揭晓：" + correct + "/" + specs.length + " 命中。拖动 Q 或 R，观察同一固定测量序列上的信任变化。";
        render();
        announce(api, rootNode, state.feedback);
      });
      reset.addEventListener("click", function () {
        state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
        render();
        announce(api, rootNode, "Kalman 预测、估计图和账本已重置。");
      });
      ["q", "r", "steps"].forEach(function (key) {
        controlRefs[key].input.addEventListener("input", function () {
          var next = Object.assign({}, state.config);
          next[key] = Number(controlRefs[key].input.value);
          state.config = normalizeConfig(next);
          state.feedback = "";
          render();
        });
      });

      function render() {
        var result = runFilter(state.config);
        ["q", "r", "steps"].forEach(function (key) {
          controlRefs[key].input.value = String(result.config[key]);
          controlRefs[key].output.textContent = formatNumber(result.config[key], controlRefs[key].digits);
        });
        feedback.textContent = state.feedback;
        feedback.className = "kf-feedback" + (state.feedback.indexOf("请先") === 0 ? " kf-warn" : "");
        renderPredictions(state, refs);
        resultShell.hidden = !state.revealed;
        if (!state.revealed) return;
        drawKalmanSvg(doc, svg, result);
        clear(metricsHost);
        metricsHost.appendChild(metric(doc, "末端位置误差", formatNumber(result.metrics.finalPositionError, 3)));
        metricsHost.appendChild(metric(doc, "末端 σ_pos", formatNumber(result.metrics.finalPositionStd, 3)));
        metricsHost.appendChild(metric(doc, "末端 K_pos", formatNumber(result.metrics.finalGainPosition, 3)));
        metricsHost.appendChild(metric(doc, "创新 RMS", formatNumber(result.metrics.innovationRms, 3)));
        metricsHost.appendChild(metric(doc, "固定 seed", String(result.config.seed)));
        renderLedger(doc, tableHost, result);
        certificate.textContent =
          "公式桥：ν_k=z_k−C x̂_{k|k−1}，S_k=C P^-_k C^T+R，" +
          "K_k=P^-_k C^T/S_k，随后 x̂_k=x̂^-_k+K_kν_k、P_k=(I−K_kC)P^-_k。" +
          "当前图把真值、固定测量、预测、估计和 ±2√P_pos 同时画出；线性/高斯、单一位置传感器和常速度近似是模型边界，不是对野值或非线性导航的保证。";
      }

      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) {
        checks += 1;
        assert(condition, message);
      }
      var first = generateMeasurements({ steps: 6, seed: DEFAULTS.seed });
      var second = generateMeasurements({ steps: 6, seed: DEFAULTS.seed });
      check(first.length === 6 && first[0].measurement === second[0].measurement, "fixed seed measurements");
      var baseline = runFilter(DEFAULTS);
      check(baseline.rows.length === DEFAULTS.steps, "fixed filter length");
      check(baseline.rows.every(function (row) {
        return Number.isFinite(row.innovation) && Number.isFinite(row.gainPosition) && Number.isFinite(row.pPosition);
      }), "finite Kalman ledger");
      check(baseline.rows.every(function (row) {
        return nearly(row.innovation, row.measurement - row.predictedPosition, 1e-9);
      }), "innovation definition");
      check(baseline.rows.every(function (row) {
        return row.pPosition <= row.predictedPPosition + 1e-9;
      }), "measurement update contracts position covariance");
      var noisy = runFilter({ q: DEFAULTS.q, r: 2.5, steps: DEFAULTS.steps });
      var quiet = runFilter({ q: DEFAULTS.q, r: 0.05, steps: DEFAULTS.steps });
      check(noisy.metrics.finalGainPosition < quiet.metrics.finalGainPosition, "larger R lowers gain");
      check(baseline.rows[0].innovationVariance > DEFAULTS.r, "innovation variance includes R");
      check(baseline.metrics.finalPositionStd > 0, "uncertainty remains explicit");
      check(normalizeConfig({ seed: DEFAULTS.seed }).seed === DEFAULTS.seed, "seed validation");
      return { checks: checks };
    }

    return {
      DEFAULTS: DEFAULTS,
      normalizeConfig: normalizeConfig,
      generateMeasurements: generateMeasurements,
      processCovariance: processCovariance,
      runFilter: runFilter,
      mount: mount,
      selfTest: selfTest
    };
  }
);

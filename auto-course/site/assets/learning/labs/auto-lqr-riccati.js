(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }

  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("auto-lqr-riccati", exported.mount);
  }

  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("auto-lqr-riccati self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("auto-lqr-riccati self-test: FAIL\n" + error.stack);
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

    var LAB_ID = "auto-lqr-riccati";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "auto-lqr-riccati-styles";
    var EPS = 1e-10;
    var A = [[1, 0.1], [0, 0.92]];
    var B = [[0], [0.1]];
    var QF = [[10, 0], [0, 2]];
    var DEFAULTS = {
      horizon: 12,
      qPosition: 6,
      qRate: 1,
      r: 0.7,
      initialAngle: 1
    };

    var STYLE_TEXT = [
      '[data-learning-lab="auto-lqr-riccati"]{--lqr-blue:var(--cl-blue,#315f9d);--lqr-orange:var(--cl-gold,#9b6a12);--lqr-green:var(--cl-green,#39734d);--lqr-red:var(--cl-red,#b64335);display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-lqr-riccati"] *{box-sizing:border-box}[data-learning-lab="auto-lqr-riccati"] [hidden]{display:none!important}',
      '[data-learning-lab="auto-lqr-riccati"] h3,[data-learning-lab="auto-lqr-riccati"] h4{margin:0;letter-spacing:0}[data-learning-lab="auto-lqr-riccati"] h3{font-size:1.16rem}[data-learning-lab="auto-lqr-riccati"] h4{margin-top:16px;font-size:1rem}',
      '[data-learning-lab="auto-lqr-riccati"] p{margin:8px 0}[data-learning-lab="auto-lqr-riccati"] .lqr-note,[data-learning-lab="auto-lqr-riccati"] .lqr-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="auto-lqr-riccati"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="auto-lqr-riccati"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
      '[data-learning-lab="auto-lqr-riccati"] .lqr-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="auto-lqr-riccati"] button,[data-learning-lab="auto-lqr-riccati"] input{font:inherit;letter-spacing:0}',
      '[data-learning-lab="auto-lqr-riccati"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="auto-lqr-riccati"] button:hover{border-color:var(--accent,#315f9d)}[data-learning-lab="auto-lqr-riccati"] button[aria-pressed="true"],[data-learning-lab="auto-lqr-riccati"] .lqr-primary{border-color:var(--accent,#315f9d);background:var(--accent,#315f9d);color:var(--bg,#fff);font-weight:750}',
      '[data-learning-lab="auto-lqr-riccati"] button:focus-visible,[data-learning-lab="auto-lqr-riccati"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="auto-lqr-riccati"] button:disabled{cursor:not-allowed;opacity:.55}',
      '[data-learning-lab="auto-lqr-riccati"] .lqr-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="auto-lqr-riccati"] .lqr-actions>*{flex:1 1 170px}[data-learning-lab="auto-lqr-riccati"] .lqr-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="auto-lqr-riccati"] .lqr-correct{color:var(--lqr-green)}[data-learning-lab="auto-lqr-riccati"] .lqr-wrong{color:var(--lqr-red)}',
      '[data-learning-lab="auto-lqr-riccati"] .lqr-layout{display:grid;grid-template-columns:minmax(220px,.7fr) minmax(0,1.3fr);gap:16px;align-items:start;min-width:0}[data-learning-lab="auto-lqr-riccati"] .lqr-controls,[data-learning-lab="auto-lqr-riccati"] .lqr-stage{min-width:0}[data-learning-lab="auto-lqr-riccati"] .lqr-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="auto-lqr-riccati"] .lqr-control{display:grid;gap:5px;min-width:0}[data-learning-lab="auto-lqr-riccati"] .lqr-control label{color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}[data-learning-lab="auto-lqr-riccati"] .lqr-control output{color:var(--accent,#315f9d);font-variant-numeric:tabular-nums}',
      '[data-learning-lab="auto-lqr-riccati"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent,#315f9d)}[data-learning-lab="auto-lqr-riccati"] .lqr-stage-frame{min-width:0;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent);overflow:hidden}[data-learning-lab="auto-lqr-riccati"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="auto-lqr-riccati"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="auto-lqr-riccati"] .lqr-grid{stroke:var(--border,#cbd5e1);stroke-width:1;stroke-opacity:.7}[data-learning-lab="auto-lqr-riccati"] .lqr-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.75}[data-learning-lab="auto-lqr-riccati"] .lqr-state-one{fill:none;stroke:var(--lqr-blue);stroke-width:2.8}[data-learning-lab="auto-lqr-riccati"] .lqr-state-two{fill:none;stroke:var(--lqr-orange);stroke-width:2.3}[data-learning-lab="auto-lqr-riccati"] .lqr-control-line{fill:none;stroke:var(--lqr-green);stroke-width:2.5}[data-learning-lab="auto-lqr-riccati"] .lqr-zero{stroke:currentColor;stroke-width:1;stroke-dasharray:4 4;opacity:.55}[data-learning-lab="auto-lqr-riccati"] .lqr-label{font-size:11px}[data-learning-lab="auto-lqr-riccati"] .lqr-small{font-size:10px;fill:var(--fg-soft,currentColor)!important}',
      '[data-learning-lab="auto-lqr-riccati"] .lqr-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:8px;margin:12px 0}[data-learning-lab="auto-lqr-riccati"] .lqr-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#cbd5e1);background:var(--bg,transparent)}[data-learning-lab="auto-lqr-riccati"] .lqr-metric:nth-child(3n+1){border-color:var(--lqr-blue)}[data-learning-lab="auto-lqr-riccati"] .lqr-metric:nth-child(3n+2){border-color:var(--lqr-orange)}[data-learning-lab="auto-lqr-riccati"] .lqr-metric:nth-child(3n){border-color:var(--lqr-green)}[data-learning-lab="auto-lqr-riccati"] .lqr-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11.5px}[data-learning-lab="auto-lqr-riccati"] .lqr-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
      '[data-learning-lab="auto-lqr-riccati"] .lqr-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="auto-lqr-riccati"] table{width:100%;min-width:720px;border-collapse:collapse;font-size:11.5px;font-variant-numeric:tabular-nums;margin-top:12px}[data-learning-lab="auto-lqr-riccati"] th,[data-learning-lab="auto-lqr-riccati"] td{padding:7px 6px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="auto-lqr-riccati"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="auto-lqr-riccati"] .lqr-certificate{margin-top:11px;padding:10px 12px;border-left:3px solid var(--lqr-green);background:var(--bg,transparent);font-size:13px;line-height:1.7}',
      '@media(max-width:900px){[data-learning-lab="auto-lqr-riccati"] .lqr-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){[data-learning-lab="auto-lqr-riccati"] .lqr-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:420px){[data-learning-lab="auto-lqr-riccati"] .lqr-stage-frame{padding:4px}[data-learning-lab="auto-lqr-riccati"] table{font-size:10.8px}[data-learning-lab="auto-lqr-riccati"] th,[data-learning-lab="auto-lqr-riccati"] td{padding-left:4px;padding-right:4px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="auto-lqr-riccati"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
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
      var horizon = Math.round(finite(source.horizon === undefined ? DEFAULTS.horizon : source.horizon, "horizon"));
      var qPosition = finite(source.qPosition === undefined ? DEFAULTS.qPosition : source.qPosition, "qPosition");
      var qRate = finite(source.qRate === undefined ? DEFAULTS.qRate : source.qRate, "qRate");
      var r = finite(source.r === undefined ? DEFAULTS.r : source.r, "R");
      var initialAngle = finite(source.initialAngle === undefined ? DEFAULTS.initialAngle : source.initialAngle, "initialAngle");
      if (horizon < 2 || horizon > 24) throw new RangeError("horizon must be in [2, 24]");
      if (qPosition < 0.2 || qPosition > 20) throw new RangeError("qPosition must be in [0.2, 20]");
      if (qRate < 0.05 || qRate > 8) throw new RangeError("qRate must be in [0.05, 8]");
      if (r < 0.05 || r > 8) throw new RangeError("R must be in [0.05, 8]");
      if (initialAngle < 0.2 || initialAngle > 2) throw new RangeError("initialAngle must be in [0.2, 2]");
      return { horizon: horizon, qPosition: qPosition, qRate: qRate, r: r, initialAngle: initialAngle };
    }

    function cloneMatrix(matrix) {
      return matrix.map(function (row) { return row.slice(); });
    }

    function addMatrix(left, right) {
      return left.map(function (row, i) {
        return row.map(function (value, j) { return value + right[i][j]; });
      });
    }

    function subMatrix(left, right) {
      return left.map(function (row, i) {
        return row.map(function (value, j) { return value - right[i][j]; });
      });
    }

    function scaleMatrix(matrix, factor) {
      return matrix.map(function (row) { return row.map(function (value) { return value * factor; }); });
    }

    function transpose(matrix) {
      return matrix[0].map(function (_, column) {
        return matrix.map(function (row) { return row[column]; });
      });
    }

    function multiply(left, right) {
      var output = [];
      for (var i = 0; i < left.length; i += 1) {
        output[i] = [];
        for (var j = 0; j < right[0].length; j += 1) {
          var sum = 0;
          for (var k = 0; k < right.length; k += 1) sum += left[i][k] * right[k][j];
          output[i][j] = sum;
        }
      }
      return output;
    }

    function vectorMultiply(matrix, vector) {
      return matrix.map(function (row) {
        return row.reduce(function (sum, value, index) { return sum + value * vector[index]; }, 0);
      });
    }

    function quadratic(vector, matrix) {
      var product = vectorMultiply(matrix, vector);
      return vector.reduce(function (sum, value, index) { return sum + value * product[index]; }, 0);
    }

    function normalizeSymmetric(matrix) {
      return [
        [matrix[0][0], (matrix[0][1] + matrix[1][0]) / 2],
        [(matrix[0][1] + matrix[1][0]) / 2, matrix[1][1]]
      ];
    }

    function runLqr(input) {
      var config = normalizeConfig(input);
      var Q = [[config.qPosition, 0], [0, config.qRate]];
      var P = cloneMatrix(QF);
      var backward = [];
      for (var k = config.horizon - 1; k >= 0; k -= 1) {
        var PA = multiply(P, A);
        var PB = multiply(P, B);
        var BT = transpose(B);
        var S = config.r + multiply(BT, PB)[0][0];
        if (S <= EPS) throw new Error("Riccati S is not positive");
        var BT_PA = multiply(BT, PA);
        var APB = multiply(transpose(A), PB);
        var correction = scaleMatrix(multiply(APB, BT_PA), 1 / S);
        var Pnext = normalizeSymmetric(addMatrix(Q, subMatrix(multiply(multiply(transpose(A), P), A), correction)));
        backward.push({
          k: k,
          p: cloneMatrix(Pnext),
          pNext: cloneMatrix(P),
          gain: [BT_PA[0][0] / S, BT_PA[0][1] / S],
          S: S
        });
        P = Pnext;
      }
      backward.reverse();
      var x = [config.initialAngle, 0];
      var forward = [];
      var stateCost = 0;
      var controlCost = 0;
      var controlEnergy = 0;
      var maxControl = 0;
      for (var step = 0; step < config.horizon; step += 1) {
        var row = backward[step];
        var u = -(row.gain[0] * x[0] + row.gain[1] * x[1]);
        var currentStateCost = quadratic(x, Q);
        var currentControlCost = config.r * u * u;
        var next = [
          A[0][0] * x[0] + A[0][1] * x[1] + B[0][0] * u,
          A[1][0] * x[0] + A[1][1] * x[1] + B[1][0] * u
        ];
        stateCost += currentStateCost;
        controlCost += currentControlCost;
        controlEnergy += u * u;
        maxControl = Math.max(maxControl, Math.abs(u));
        forward.push({
          k: step,
          x1: x[0],
          x2: x[1],
          u: u,
          stateCost: currentStateCost,
          controlCost: currentControlCost,
          cumulativeCost: stateCost + controlCost,
          nextX1: next[0],
          nextX2: next[1]
        });
        x = next;
      }
      var terminalCost = quadratic(x, QF);
      return {
        config: config,
        Q: Q,
        QF: cloneMatrix(QF),
        backward: backward,
        forward: forward,
        terminalState: x,
        metrics: {
          stateCost: stateCost,
          controlCost: controlCost,
          controlEnergy: controlEnergy,
          terminalCost: terminalCost,
          totalCost: stateCost + controlCost + terminalCost,
          maxControl: maxControl,
          initialP11: backward[0].p[0][0],
          minS: Math.min.apply(null, backward.map(function (row) { return row.S; }))
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
      var height = 400;
      var left = 48;
      var right = 17;
      var top = 28;
      var middle = 218;
      var bottom = 38;
      var stateValues = [];
      result.forward.forEach(function (row) { stateValues.push(row.x1, row.x2, row.nextX1, row.nextX2); });
      var stateMin = Math.min.apply(null, stateValues);
      var stateMax = Math.max.apply(null, stateValues);
      var statePad = Math.max(0.12, (stateMax - stateMin) * 0.15);
      var yStateMin = stateMin - statePad;
      var yStateMax = stateMax + statePad;
      var controlValues = result.forward.map(function (row) { return row.u; });
      var controlMax = Math.max(0.2, Math.max.apply(null, controlValues.map(Math.abs)) * 1.25);
      var xMax = Math.max(1, result.forward.length - 1);
      var mapX = function (value) { return left + value / xMax * (width - left - right); };
      var mapState = function (value) { return top + (middle - top - 18) * (yStateMax - value) / (yStateMax - yStateMin); };
      var mapControl = function (value) { return middle + 18 + (height - bottom - (middle + 18)) * (controlMax - value) / (2 * controlMax); };
      svg.appendChild(svgElement(doc, "title", {}, "有限时域 LQR 的状态与控制序列"));
      svg.appendChild(svgElement(doc, "desc", {}, "上图为角度误差和角速度，下图为有限时域 Riccati 反馈产生的控制输入。"));
      for (var i = 0; i <= 3; i += 1) {
        var yState = top + (middle - top - 18) * i / 3;
        svg.appendChild(svgElement(doc, "line", { x1: left, y1: yState, x2: width - right, y2: yState, class: "lqr-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: left - 7, y: yState + 4, "text-anchor": "end", class: "lqr-small" }, formatNumber(yStateMax - (yStateMax - yStateMin) * i / 3, 2)));
        var yControl = middle + 18 + (height - bottom - (middle + 18)) * i / 2;
        var controlLabel = controlMax - 2 * controlMax * i / 2;
        svg.appendChild(svgElement(doc, "line", { x1: left, y1: yControl, x2: width - right, y2: yControl, class: "lqr-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: left - 7, y: yControl + 4, "text-anchor": "end", class: "lqr-small" }, formatNumber(controlLabel, 1)));
      }
      var zeroControlY = mapControl(0);
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: zeroControlY, x2: width - right, y2: zeroControlY, class: "lqr-zero" }));
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: middle - 8, x2: width - right, y2: middle - 8, class: "lqr-axis" }));
      svg.appendChild(svgElement(doc, "path", { d: linePath(result.forward, "x1", mapX, mapState), class: "lqr-state-one" }));
      svg.appendChild(svgElement(doc, "path", { d: linePath(result.forward, "x2", mapX, mapState), class: "lqr-state-two" }));
      svg.appendChild(svgElement(doc, "path", { d: linePath(result.forward, "u", mapX, mapControl), class: "lqr-control-line" }));
      svg.appendChild(svgElement(doc, "text", { x: left + 4, y: top + 13, class: "lqr-label" }, "状态：角度误差 x1 / 角速度 x2"));
      svg.appendChild(svgElement(doc, "text", { x: left + 4, y: middle + 13, class: "lqr-label" }, "控制输入 u_k"));
      svg.appendChild(svgElement(doc, "text", { x: width - right, y: height - 9, "text-anchor": "end", class: "lqr-small" }, "离散时刻 k"));
    }

    function metric(doc, label, value) {
      return element(doc, "div", { className: "lqr-metric" }, [
        element(doc, "span", { text: label }),
        element(doc, "strong", { text: value })
      ]);
    }

    function renderForwardLedger(doc, hostNode, result) {
      var body = element(doc, "tbody");
      result.forward.forEach(function (row) {
        body.appendChild(element(doc, "tr", {}, [
          element(doc, "th", { text: String(row.k) }),
          element(doc, "td", { text: formatNumber(row.x1, 3) }),
          element(doc, "td", { text: formatNumber(row.x2, 3) }),
          element(doc, "td", { text: formatNumber(row.u, 3) }),
          element(doc, "td", { text: formatNumber(row.stateCost, 3) }),
          element(doc, "td", { text: formatNumber(row.controlCost, 3) }),
          element(doc, "td", { text: formatNumber(row.cumulativeCost, 3) })
        ]));
      });
      var backwardBody = element(doc, "tbody");
      result.backward.forEach(function (row) {
        backwardBody.appendChild(element(doc, "tr", {}, [
          element(doc, "th", { text: String(row.k) }),
          element(doc, "td", { text: formatNumber(row.p[0][0], 3) }),
          element(doc, "td", { text: formatNumber(row.p[0][1], 3) }),
          element(doc, "td", { text: formatNumber(row.p[1][1], 3) }),
          element(doc, "td", { text: formatNumber(row.gain[0], 3) }),
          element(doc, "td", { text: formatNumber(row.gain[1], 3) }),
          element(doc, "td", { text: formatNumber(row.S, 3) })
        ]));
      });
      clear(hostNode);
      hostNode.appendChild(element(doc, "table", {}, [
        element(doc, "caption", { text: "前向成本与控制能量账本" }),
        element(doc, "thead", {}, [element(doc, "tr", {}, [
          element(doc, "th", { text: "k" }),
          element(doc, "th", { text: "x1" }),
          element(doc, "th", { text: "x2" }),
          element(doc, "th", { text: "u_k" }),
          element(doc, "th", { text: "xᵀQx" }),
          element(doc, "th", { text: "Ru²" }),
          element(doc, "th", { text: "累计 stage" })
        ])]),
        body
      ]));
      hostNode.appendChild(element(doc, "table", {}, [
        element(doc, "caption", { text: "Riccati 后向证书：P_k、K_k 与 S_k" }),
        element(doc, "thead", {}, [element(doc, "tr", {}, [
          element(doc, "th", { text: "k" }),
          element(doc, "th", { text: "P11" }),
          element(doc, "th", { text: "P12" }),
          element(doc, "th", { text: "P22" }),
          element(doc, "th", { text: "K1" }),
          element(doc, "th", { text: "K2" }),
          element(doc, "th", { text: "S=R+BᵀPB" })
        ])]),
        backwardBody
      ]));
    }

    function questionSpecs() {
      return [
        {
          key: "terminal",
          prompt: "有限时域 Riccati 递推的终点应从哪里开始？",
          expected: "terminal",
          choices: [
            { value: "terminal", label: "P_N=Q_f" },
            { value: "zero", label: "P_N=0 总是正确" },
            { value: "gain", label: "P_N 直接等于 K_N" }
          ]
        },
        {
          key: "rWeight",
          prompt: "在同一模型和状态权重下增大 R，通常会怎样？",
          expected: "smaller",
          choices: [
            { value: "smaller", label: "K 变保守，控制能量下降" },
            { value: "larger", label: "K 必然变大，能量上升" },
            { value: "same", label: "K 完全不受影响" }
          ]
        },
        {
          key: "ledger",
          prompt: "前向总成本 J 的透明分账至少应包含什么？",
          expected: "both",
          choices: [
            { value: "both", label: "状态代价、控制代价和终端代价" },
            { value: "state", label: "只记状态偏差" },
            { value: "input", label: "只记控制峰值" }
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
            button.node.className = correct ? "lqr-correct" : selected ? "lqr-wrong" : "";
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
      var shell = element(doc, "div", { className: "lqr-lab" });
      shell.appendChild(element(doc, "h3", { text: "LQR 实验：Riccati 后向递推与前向成本" }));
      shell.appendChild(element(doc, "p", { className: "lqr-note", text: "对离散航向误差—角速度模型做有限时域调节。每一行前向账本都来自同一组 K_k；状态代价、加权控制代价与控制能量分开列出。" }));
      var predictionHost = element(doc, "div");
      questionSpecs().forEach(function (spec) {
        var fieldset = element(doc, "fieldset");
        fieldset.appendChild(element(doc, "legend", { text: spec.prompt }));
        var grid = element(doc, "div", { className: "lqr-choice-grid" });
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
      var actions = element(doc, "div", { className: "lqr-actions" });
      var reveal = element(doc, "button", { type: "button", className: "lqr-primary", text: "提交预测并揭晓" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      var feedback = element(doc, "p", { className: "lqr-feedback", "aria-live": "polite" });
      var resultShell = element(doc, "div", { hidden: true });
      var controlRefs = {};

      function makeRange(key, label, min, max, step, digits) {
        var input = element(doc, "input", { type: "range", min: String(min), max: String(max), step: String(step), value: String(state.config[key]), "aria-label": label });
        var output = element(doc, "output", { text: formatNumber(state.config[key], digits) });
        controlRefs[key] = { input: input, output: output, digits: digits };
        return element(doc, "div", { className: "lqr-control" }, [
          element(doc, "label", {}, [label + " = ", output]),
          input
        ]);
      }

      var controls = element(doc, "div", { className: "lqr-controls" }, [
        makeRange("horizon", "有限时域 N", 2, 24, 1, 0),
        makeRange("qPosition", "位置权重 q₁", 0.2, 20, 0.2, 1),
        makeRange("qRate", "速度权重 q₂", 0.05, 8, 0.05, 2),
        makeRange("r", "控制权重 R", 0.05, 8, 0.05, 2),
        makeRange("initialAngle", "初始角度误差", 0.2, 2, 0.1, 1),
        element(doc, "p", { className: "lqr-note", text: "A=[[1,0.1],[0,0.92]]，B=[0,0.1]ᵀ，Q=diag(q₁,q₂)，Q_f=diag(10,2)。本实验无输入饱和；max|u| 是诊断，不是约束处理。" })
      ]);
      var svg = svgElement(doc, "svg", { viewBox: "0 0 720 400", role: "img", "aria-label": "有限时域 LQR 状态与控制" });
      var svgFrame = element(doc, "div", { className: "lqr-stage-frame" }, [svg]);
      var metricsHost = element(doc, "div", { className: "lqr-metrics" });
      var tableHost = element(doc, "div", { className: "lqr-table-wrap" });
      var certificate = element(doc, "div", { className: "lqr-certificate" });
      resultShell.appendChild(element(doc, "div", { className: "lqr-layout" }, [
        controls,
        element(doc, "div", { className: "lqr-stage" }, [svgFrame, metricsHost, tableHost, certificate])
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
          state.feedback = "请先完成三项预测；Riccati 表、状态图和成本账会在提交后出现。";
          render();
          return;
        }
        var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
        state.revealed = true;
        state.feedback = "已揭晓：" + correct + "/" + specs.length + " 命中。调参不会重新上锁。";
        render();
        announce(api, rootNode, state.feedback);
      });
      reset.addEventListener("click", function () {
        state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
        render();
        announce(api, rootNode, "LQR 预测、图和成本账已重置。");
      });
      ["horizon", "qPosition", "qRate", "r", "initialAngle"].forEach(function (key) {
        controlRefs[key].input.addEventListener("input", function () {
          var next = Object.assign({}, state.config);
          next[key] = Number(controlRefs[key].input.value);
          state.config = normalizeConfig(next);
          state.feedback = "";
          render();
        });
      });

      function render() {
        var result = runLqr(state.config);
        ["horizon", "qPosition", "qRate", "r", "initialAngle"].forEach(function (key) {
          controlRefs[key].input.value = String(result.config[key]);
          controlRefs[key].output.textContent = formatNumber(result.config[key], controlRefs[key].digits);
        });
        feedback.textContent = state.feedback;
        feedback.className = "lqr-feedback" + (state.feedback.indexOf("请先") === 0 ? " lqr-wrong" : "");
        renderPredictions(state, refs);
        resultShell.hidden = !state.revealed;
        if (!state.revealed) return;
        drawSvg(doc, svg, result);
        clear(metricsHost);
        metricsHost.appendChild(metric(doc, "总成本 J", formatNumber(result.metrics.totalCost, 3)));
        metricsHost.appendChild(metric(doc, "状态代价 ΣxᵀQx", formatNumber(result.metrics.stateCost, 3)));
        metricsHost.appendChild(metric(doc, "控制代价 ΣRu²", formatNumber(result.metrics.controlCost, 3)));
        metricsHost.appendChild(metric(doc, "控制能量 Σu²", formatNumber(result.metrics.controlEnergy, 3)));
        metricsHost.appendChild(metric(doc, "终端代价", formatNumber(result.metrics.terminalCost, 3)));
        metricsHost.appendChild(metric(doc, "max |u|", formatNumber(result.metrics.maxControl, 3)));
        renderForwardLedger(doc, tableHost, result);
        clear(certificate);
        certificate.appendChild(element(doc, "p", { text: "递推证书：P_N=Q_f=diag(10,2)，S_k=R+BᵀP_{k+1}B 的最小值为 " + formatNumber(result.metrics.minS, 3) + "，因此每一步的一维控制子问题有唯一解。当前前向输入严格使用 u_k=−K_k x_k。" }));
        certificate.appendChild(element(doc, "p", { text: "账本核对：J=Σ(xᵀQx)+Σ(Ru²)+x_NᵀQ_fx_N；Σu² 另列为执行器能量指标。没有把饱和、模型误差或观测器误差偷偷算进这次 LQR 证书。" }));
      }

      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) {
        checks += 1;
        assert(condition, message);
      }
      var baseline = runLqr(DEFAULTS);
      var repeat = runLqr(DEFAULTS);
      check(baseline.backward.length === DEFAULTS.horizon, "Riccati horizon length");
      check(baseline.forward.length === DEFAULTS.horizon, "forward horizon length");
      check(JSON.stringify(baseline.forward) === JSON.stringify(repeat.forward), "deterministic LQR trajectory");
      check(nearly(baseline.backward[baseline.backward.length - 1].pNext[0][0], QF[0][0], 1e-10), "terminal P equals Qf");
      check(baseline.backward.every(function (row) { return row.S > 0 && Number.isFinite(row.gain[0]) && Number.isFinite(row.gain[1]); }), "positive Riccati S certificate");
      check(baseline.forward.every(function (row) { return nearly(row.nextX1, A[0][0] * row.x1 + A[0][1] * row.x2, 1e-9); }), "state transition x1");
      check(baseline.forward.every(function (row) { return nearly(row.nextX2, A[1][1] * row.x2 + B[1][0] * row.u, 1e-9); }), "state transition x2");
      check(nearly(baseline.metrics.totalCost, baseline.metrics.stateCost + baseline.metrics.controlCost + baseline.metrics.terminalCost, 1e-9), "cost ledger closes");
      var conservative = runLqr({ horizon: DEFAULTS.horizon, qPosition: DEFAULTS.qPosition, qRate: DEFAULTS.qRate, r: 8, initialAngle: DEFAULTS.initialAngle });
      check(Math.abs(conservative.backward[0].gain[0]) < Math.abs(baseline.backward[0].gain[0]), "larger R reduces first gain");
      check(formatNumber(100, 0) === "100", "integer trailing zero formatting");
      return { checks: checks };
    }

    return {
      DEFAULTS: DEFAULTS,
      normalizeConfig: normalizeConfig,
      runLqr: runLqr,
      formatNumber: formatNumber,
      mount: mount,
      selfTest: selfTest
    };
  }
);

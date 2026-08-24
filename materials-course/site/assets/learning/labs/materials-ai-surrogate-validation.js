(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("materials-ai-surrogate-validation", exported.mount);
  }
  if (typeof module === "object" && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("materials-ai-surrogate-validation self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("materials-ai-surrogate-validation self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var LAB_ID = "materials-ai-surrogate-validation";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "materials-ai-surrogate-validation-styles";
  var INITIAL_DATA = [
    { x: 0.15, y: 0.15, value: 0.55 },
    { x: 0.50, y: 0.15, value: 0.72 },
    { x: 0.85, y: 0.15, value: 0.82 },
    { x: 0.20, y: 0.65, value: 0.40 },
    { x: 0.55, y: 0.65, value: 0.63 },
    { x: 0.80, y: 0.65, value: 0.72 }
  ];
  var ACTIVE_POOL = [
    { x: 0.32, y: 0.35 },
    { x: 0.68, y: 0.35 },
    { x: 0.35, y: 0.50 },
    { x: 0.70, y: 0.50 },
    { x: 0.50, y: 0.80 }
  ];
  var DEFAULTS = { queryX: 0.50, queryY: 0.40 };
  var STYLE_TEXT = [
    '[data-learning-lab="' + LAB_ID + '"]{--ma-blue:#2563a6;--ma-red:#b64335;--ma-green:#39734d;--ma-gold:#9b6a12;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
    '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}',
    '[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.16rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}',
    '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
    '[data-learning-lab="' + LAB_ID + '"] .ma-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{font:inherit}',
    '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--ma-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .ma-primary{border-color:var(--ma-blue);background:var(--ma-blue);color:#fff;font-weight:750}',
    '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .ma-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .ma-actions>*{flex:1 1 170px}[data-learning-lab="' + LAB_ID + '"] .ma-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="' + LAB_ID + '"] .ma-warn{color:var(--ma-red)}',
    '[data-learning-lab="' + LAB_ID + '"] .ma-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px;align-items:end;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] .ma-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .ma-control label{font-size:13px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--ma-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--ma-blue)}',
    '[data-learning-lab="' + LAB_ID + '"] .ma-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(285px,.8fr);gap:16px;align-items:start;margin-top:16px}[data-learning-lab="' + LAB_ID + '"] .ma-chart{min-width:0;padding:6px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + LAB_ID + '"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
    '[data-learning-lab="' + LAB_ID + '"] .ma-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:560px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .ma-note{margin-top:11px;padding:10px 12px;border-left:3px solid var(--ma-gold);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
    '@media(max-width:920px){[data-learning-lab="' + LAB_ID + '"] .ma-grid{grid-template-columns:1fr}}@media(max-width:680px){[data-learning-lab="' + LAB_ID + '"] .ma-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .ma-choice-grid{grid-template-columns:1fr}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .ma-controls{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
  ].join("");

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function finite(value, label) {
    var number = Number(value);
    if (!Number.isFinite(number)) throw new RangeError(label + " must be finite");
    return number;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || 1e-8) * scale;
  }

  function format(value, digits) {
    if (!Number.isFinite(value)) return "—";
    var places = digits === undefined ? 3 : digits;
    if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) return value.toExponential(Math.min(places, 5));
    if (places === 0) return value.toFixed(0);
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function copyDefaults() {
    return { queryX: DEFAULTS.queryX, queryY: DEFAULTS.queryY };
  }

  function copyDataset(dataset) {
    return (dataset || INITIAL_DATA).map(function (point) { return { x: point.x, y: point.y, value: point.value }; });
  }

  function normalizeConfig(input) {
    var source = input || {};
    var queryX = finite(source.queryX === undefined ? DEFAULTS.queryX : source.queryX, "query x");
    var queryY = finite(source.queryY === undefined ? DEFAULTS.queryY : source.queryY, "query y");
    if (queryX < 0 || queryX > 1 || queryY < 0 || queryY > 1) throw new RangeError("query coordinates must be in [0, 1]");
    return { queryX: queryX, queryY: queryY };
  }

  function trueProperty(x, y) {
    var px = finite(x, "x");
    var py = finite(y, "y");
    if (px < 0 || px > 1 || py < 0 || py > 1) throw new RangeError("true-property coordinates must be in [0, 1]");
    return clamp(0.45 + 0.45 * px - 0.25 * py + 0.08 * Math.sin(4 * px + 2 * py), 0, 1);
  }

  function pointDistance(left, right) {
    return Math.sqrt(Math.pow(left.x - right.x, 2) + Math.pow(left.y - right.y, 2));
  }

  function cross(origin, left, right) {
    return (left.x - origin.x) * (right.y - origin.y) - (left.y - origin.y) * (right.x - origin.x);
  }

  function convexHull(points) {
    var sorted = points.map(function (point) { return { x: point.x, y: point.y }; }).sort(function (left, right) { return left.x === right.x ? left.y - right.y : left.x - right.x; });
    var unique = [];
    sorted.forEach(function (point) {
      if (!unique.length || point.x !== unique[unique.length - 1].x || point.y !== unique[unique.length - 1].y) unique.push(point);
    });
    if (unique.length <= 1) return unique;
    var lower = [];
    unique.forEach(function (point) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 1e-12) lower.pop();
      lower.push(point);
    });
    var upper = [];
    unique.slice().reverse().forEach(function (point) {
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 1e-12) upper.pop();
      upper.push(point);
    });
    lower.pop();
    upper.pop();
    return lower.concat(upper);
  }

  function pointInConvexHull(point, hull) {
    if (!Array.isArray(hull) || hull.length < 3) return false;
    var positive = false;
    var negative = false;
    for (var index = 0; index < hull.length; index += 1) {
      var value = cross(hull[index], hull[(index + 1) % hull.length], point);
      if (value > 1e-10) positive = true;
      if (value < -1e-10) negative = true;
    }
    return !(positive && negative);
  }

  function predictSurrogate(x, y, dataset) {
    var query = { x: finite(x, "query x"), y: finite(y, "query y") };
    var data = copyDataset(dataset);
    if (query.x < 0 || query.x > 1 || query.y < 0 || query.y > 1) throw new RangeError("query coordinates must be in [0, 1]");
    if (data.length < 3) throw new RangeError("at least three observations are required");
    var hull = convexHull(data);
    var inHull = pointInConvexHull(query, hull);
    var nearest = data.map(function (point, index) { return { point: point, index: index, distance: pointDistance(point, query) }; }).sort(function (left, right) { return left.distance - right.distance || left.index - right.index; });
    if (nearest[0].distance < 1e-12) {
      return { estimate: nearest[0].point.value, uncertaintyProxy: 0, inHull: inHull, status: inHull ? "训练点内插：观测值" : "观测点边界", nearestDistance: 0, hull: hull, neighbors: [nearest[0]] };
    }
    var neighborCount = Math.min(3, nearest.length);
    var weightSum = 0;
    var weightedValue = 0;
    for (var index = 0; index < neighborCount; index += 1) {
      var weight = 1 / (nearest[index].distance + 1e-6);
      weightSum += weight;
      weightedValue += weight * nearest[index].point.value;
    }
    var estimate = weightedValue / weightSum;
    var variance = 0;
    for (var varianceIndex = 0; varianceIndex < neighborCount; varianceIndex += 1) {
      var varianceWeight = 1 / (nearest[varianceIndex].distance + 1e-6);
      variance += varianceWeight * Math.pow(nearest[varianceIndex].point.value - estimate, 2);
    }
    variance /= weightSum;
    var distanceUncertainty = clamp(nearest[0].distance / 0.55, 0, 1);
    var spreadUncertainty = clamp(Math.sqrt(variance) / 0.25, 0, 1);
    var uncertainty = clamp(0.6 * distanceUncertainty + 0.4 * spreadUncertainty + (inHull ? 0 : 0.35), 0, 1);
    if (!inHull) uncertainty = Math.max(0.75, uncertainty);
    return {
      estimate: estimate,
      uncertaintyProxy: uncertainty,
      inHull: inHull,
      status: inHull ? "凸包内：局部内插代理" : "凸包外：OOD / 外推警告",
      nearestDistance: nearest[0].distance,
      hull: hull,
      neighbors: nearest.slice(0, neighborCount)
    };
  }

  function validationLedger(dataset) {
    var data = copyDataset(dataset);
    if (data.length < 4) throw new RangeError("at least four observations are required for leave-one-out validation");
    var rows = [];
    var squared = 0;
    var maximum = 0;
    data.forEach(function (point, index) {
      var others = data.filter(function (_, otherIndex) { return otherIndex !== index; });
      var prediction = predictSurrogate(point.x, point.y, others);
      var error = Math.abs(prediction.estimate - point.value);
      squared += error * error;
      maximum = Math.max(maximum, error);
      rows.push({ index: index, x: point.x, y: point.y, observed: point.value, predicted: prediction.estimate, absoluteError: error, ood: !prediction.inHull });
    });
    return { rows: rows, rmse: Math.sqrt(squared / data.length), maxAbsoluteError: maximum };
  }

  function nextActivePoint(dataset) {
    var data = copyDataset(dataset);
    var candidates = ACTIVE_POOL.filter(function (candidate) {
      return !data.some(function (point) { return point.x === candidate.x && point.y === candidate.y; });
    });
    if (!candidates.length) return null;
    var scored = candidates.map(function (candidate, index) {
      var prediction = predictSurrogate(candidate.x, candidate.y, data);
      return { x: candidate.x, y: candidate.y, uncertaintyProxy: prediction.uncertaintyProxy, inHull: prediction.inHull, order: index };
    });
    scored.sort(function (left, right) { return right.uncertaintyProxy - left.uncertaintyProxy || left.order - right.order; });
    return scored[0];
  }

  function surrogateLedger(input, dataset) {
    var config = normalizeConfig(input);
    var data = copyDataset(dataset);
    var prediction = predictSurrogate(config.queryX, config.queryY, data);
    var validation = validationLedger(data);
    var next = nextActivePoint(data);
    return { config: config, dataset: data, prediction: prediction, validation: validation, next: next, hull: prediction.hull };
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
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function svgElement(doc, tag, attributes, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attributes || {}).forEach(function (key) {
      var value = attributes[key];
      if (value === undefined || value === null || value === false) return;
      node.setAttribute(key, String(value));
    });
    (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
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

  function questionSpecs() {
    return [
      {
        key: "uncertainty",
        prompt: "在训练数据凸包内和凸包外查询时，哪种判断更稳妥？",
        expected: "hull",
        choices: [
          { value: "hull", label: "凸包内通常更像内插；凸包外必须提示 OOD" },
          { value: "outside", label: "凸包外因为新颖所以一定更准" },
          { value: "same", label: "两者不需要区分" }
        ]
      },
      {
        key: "validation",
        prompt: "为什么要做留一法验证，而不能只报告训练点上的拟合？",
        expected: "holdout",
        choices: [
          { value: "holdout", label: "拿未参与该次预测的点检查泛化误差" },
          { value: "fit", label: "训练点误差为零就足够证明模型可靠" },
          { value: "speed", label: "验证只为让图表运行更快" }
        ]
      },
      {
        key: "active",
        prompt: "主动学习的下一次测量优先选择什么位置？",
        expected: "uncertain",
        choices: [
          { value: "uncertain", label: "在已知空间内优先补高不确定性处" },
          { value: "random", label: "每次都必须随机，不看模型证据" },
          { value: "known", label: "只重复最熟悉的训练点" }
        ]
      }
    ];
  }

  function renderPredictions(doc, hostNode, state) {
    clear(hostNode);
    questionSpecs().forEach(function (spec, index) {
      var buttons = spec.choices.map(function (choice) {
        var button = element(doc, "button", { type: "button", text: choice.label, "aria-pressed": state.predictions[spec.key] === choice.value ? "true" : "false" });
        button.addEventListener("click", function () {
          state.predictions[spec.key] = choice.value;
          renderPredictions(doc, hostNode, state);
        });
        return button;
      });
      hostNode.appendChild(element(doc, "fieldset", {}, [element(doc, "legend", { text: (index + 1) + ". " + spec.prompt }), element(doc, "div", { className: "ma-choice-grid" }, buttons)]));
    });
  }

  function renderSvg(doc, result) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 840 470", role: "img", "aria-label": "材料代理模型凸包、查询点和留一法误差" });
    svg.appendChild(svgElement(doc, "title", {}, "确定性代理模型的凸包和验证证据"));
    svg.appendChild(svgElement(doc, "desc", {}, "左侧是归一化成分-工艺平面的训练点、凸包、查询点和主动学习候选；右侧是留一法绝对误差柱图。属性值是无量纲 proxy。"));
    var left = { x: 55, y: 58, width: 390, height: 320 };
    var right = { x: 505, y: 58, width: 280, height: 320 };
    svg.appendChild(svgElement(doc, "rect", { x: left.x, y: left.y, width: left.width, height: left.height, fill: "none", stroke: "currentColor" }));
    svg.appendChild(svgElement(doc, "rect", { x: right.x, y: right.y, width: right.width, height: right.height, fill: "none", stroke: "currentColor" }));
    svg.appendChild(svgElement(doc, "text", { x: left.x + 5, y: 30, "font-size": 15, "font-weight": 700 }, "成分 x / 工艺 y：凸包与查询"));
    svg.appendChild(svgElement(doc, "text", { x: right.x + 5, y: 30, "font-size": 15, "font-weight": 700 }, "留一法误差（无量纲）"));
    function mapX(value) { return left.x + 35 + (left.width - 58) * value; }
    function mapY(value) { return left.y + left.height - 38 - (left.height - 66) * value; }
    var hullPath = [];
    result.hull.forEach(function (point, index) { hullPath.push((index ? "L" : "M") + mapX(point.x).toFixed(2) + " " + mapY(point.y).toFixed(2)); });
    if (hullPath.length) hullPath.push("Z");
    svg.appendChild(svgElement(doc, "path", { d: hullPath.join(" "), fill: "none", stroke: "#9b6a12", "stroke-width": 2.5, "stroke-dasharray": "6 4" }));
    result.dataset.forEach(function (point) {
      svg.appendChild(svgElement(doc, "circle", { cx: mapX(point.x), cy: mapY(point.y), r: 6, fill: "#39734d", stroke: "Canvas", "stroke-width": 2 }));
    });
    var queryX = mapX(result.config.queryX);
    var queryY = mapY(result.config.queryY);
    svg.appendChild(svgElement(doc, "circle", { cx: queryX, cy: queryY, r: 8, fill: result.prediction.inHull ? "#2563a6" : "#b64335", stroke: "Canvas", "stroke-width": 2 }));
    if (result.next) {
      var nextX = mapX(result.next.x);
      var nextY = mapY(result.next.y);
      svg.appendChild(svgElement(doc, "path", { d: "M" + nextX + " " + (nextY - 9) + " L" + (nextX + 9) + " " + nextY + " L" + nextX + " " + (nextY + 9) + " L" + (nextX - 9) + " " + nextY + " Z", fill: "#9b6a12", stroke: "Canvas", "stroke-width": 2 }));
    }
    svg.appendChild(svgElement(doc, "text", { x: left.x + 7, y: left.y + 18, "font-size": 11 }, "绿训练点；金凸包/菱形下一测量；蓝内插查询；红 OOD"));
    svg.appendChild(svgElement(doc, "text", { x: left.x + left.width, y: left.y + left.height - 12, "font-size": 11, "text-anchor": "end" }, "x（无量纲）"));
    svg.appendChild(svgElement(doc, "text", { x: left.x - 8, y: left.y + 15, "font-size": 11, transform: "rotate(-90 " + (left.x - 8) + " " + (left.y + 15) + ")" }, "y（无量纲）"));
    var maxError = Math.max(0.05, result.validation.maxAbsoluteError * 1.2);
    var step = right.width / result.validation.rows.length;
    result.validation.rows.forEach(function (row, index) {
      var barWidth = step * 0.55;
      var barHeight = (right.height - 78) * row.absoluteError / maxError;
      var x = right.x + step * index + (step - barWidth) / 2;
      var y = right.y + right.height - 38 - barHeight;
      svg.appendChild(svgElement(doc, "rect", { x: x, y: y, width: barWidth, height: Math.max(1, barHeight), fill: row.ood ? "#b64335" : "#2563a6", opacity: 0.82 }));
      svg.appendChild(svgElement(doc, "text", { x: x + barWidth / 2, y: y - 6, "font-size": 10, "text-anchor": "middle" }, format(row.absoluteError, 2)));
      svg.appendChild(svgElement(doc, "text", { x: x + barWidth / 2, y: right.y + right.height - 13, "font-size": 10, "text-anchor": "middle" }, String(index + 1)));
    });
    svg.appendChild(svgElement(doc, "text", { x: right.x + 7, y: right.y + 18, "font-size": 11 }, "RMSE = " + format(result.validation.rmse, 4) + "（无量纲 proxy）"));
    svg.appendChild(svgElement(doc, "text", { x: right.x + right.width, y: right.y + right.height + 31, "font-size": 11, "text-anchor": "end" }, "柱序 = 留一法样本编号"));
    return svg;
  }

  function renderTable(doc, hostNode, result) {
    var body = element(doc, "tbody");
    result.dataset.forEach(function (point, index) {
      var validation = result.validation.rows[index];
      body.appendChild(element(doc, "tr", {}, [
        element(doc, "th", { scope: "row", text: "训练点 " + (index + 1) }),
        element(doc, "td", { text: format(point.x, 2) + ", " + format(point.y, 2) }),
        element(doc, "td", { text: format(point.value, 4) }),
        element(doc, "td", { text: format(validation.predicted, 4) }),
        element(doc, "td", { text: format(validation.absoluteError, 4) + (validation.ood ? "；OOD" : "") })
      ]));
    });
    body.appendChild(element(doc, "tr", {}, [
      element(doc, "th", { scope: "row", text: "当前查询" }),
      element(doc, "td", { text: format(result.config.queryX, 2) + ", " + format(result.config.queryY, 2) }),
      element(doc, "td", { text: format(result.prediction.estimate, 4) }),
      element(doc, "td", { text: format(result.prediction.uncertaintyProxy, 4) }),
      element(doc, "td", { text: result.prediction.status })
    ]));
    clear(hostNode);
    hostNode.appendChild(element(doc, "table", {}, [
      element(doc, "caption", { text: "观测、留一法验证与查询状态证据账本" }),
      element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "点" }), element(doc, "th", { text: "(x,y)" }), element(doc, "th", { text: "观测/估计" }), element(doc, "th", { text: "LOO 预测/不确定性" }), element(doc, "th", { text: "误差或状态" })])]),
      body
    ]));
  }

  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument;
    installStyles(doc);
    var state = { config: normalizeConfig(DEFAULTS), dataset: copyDataset(), predictions: {}, revealed: false, feedback: "" };
    var shell = element(doc, "div", { className: "ma-shell" });
    shell.appendChild(element(doc, "h3", { text: "互动实验：确定性代理模型、验证和主动学习" }));
    shell.appendChild(element(doc, "p", { className: "ma-note", text: "先预测凸包、留一法和下一测量点；揭示后可移动查询点，或把模型建议的位置加入确定性观测集。" }));
    var predictionHost = element(doc, "div");
    shell.appendChild(predictionHost);
    var actions = element(doc, "div", { className: "ma-actions" });
    var reveal = element(doc, "button", { type: "button", className: "ma-primary", text: "提交预测并揭示" });
    var acquire = element(doc, "button", { type: "button", text: "加入下一测量点" });
    var reset = element(doc, "button", { type: "button", text: "重置" });
    actions.appendChild(reveal);
    actions.appendChild(acquire);
    actions.appendChild(reset);
    shell.appendChild(actions);
    var feedback = element(doc, "p", { className: "ma-feedback", role: "status", "aria-live": "polite" });
    shell.appendChild(feedback);
    var resultPanel = element(doc, "div", { hidden: true });
    var controls = element(doc, "div", { className: "ma-controls" });
    var inputs = {};

    function addRange(key, label, min, max, step, digits) {
      var output = element(doc, "output", { text: format(state.config[key], digits) });
      var input = element(doc, "input", { type: "range", min: min, max: max, step: step, value: state.config[key], "aria-label": label });
      input.addEventListener("input", function () {
        state.config[key] = finite(input.value, label);
        state.feedback = state.revealed ? "查询点已更新；代理、验证和 OOD 状态已重算。" : "";
        render();
      });
      inputs[key] = { input: input, output: output, digits: digits };
      controls.appendChild(element(doc, "div", { className: "ma-control" }, [element(doc, "label", {}, [label, " = ", output]), input]));
    }

    addRange("queryX", "查询 x（无量纲）", "0", "1", "0.01", 2);
    addRange("queryY", "查询 y（无量纲）", "0", "1", "0.01", 2);
    resultPanel.appendChild(controls);
    var chart = element(doc, "div", { className: "ma-chart" });
    var tableWrap = element(doc, "div", { className: "ma-table-wrap" });
    var note = element(doc, "p", { className: "ma-note" });
    resultPanel.appendChild(element(doc, "div", { className: "ma-grid" }, [chart, tableWrap]));
    resultPanel.appendChild(note);
    shell.appendChild(resultPanel);
    clear(rootNode);
    rootNode.appendChild(shell);
    renderPredictions(doc, predictionHost, state);

    reveal.addEventListener("click", function () {
      var specs = questionSpecs();
      if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) {
        state.feedback = "请先完成三项预测；揭示前不显示凸包、验证误差和 OOD 状态。";
        render();
        return;
      }
      var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
      state.revealed = true;
      state.feedback = "已揭示：" + correct + "/" + specs.length + " 命中。模型只对数据覆盖的区域有内插证据。";
      render();
      announce(api, rootNode, state.feedback);
    });
    acquire.addEventListener("click", function () {
      if (!state.revealed) {
        state.feedback = "请先完成预测并揭示，再加入主动学习测量点。";
        render();
        return;
      }
      var next = nextActivePoint(state.dataset);
      if (!next) {
        state.feedback = "候选测量池已用尽；重置可重新开始。";
        render();
        return;
      }
      state.dataset.push({ x: next.x, y: next.y, value: trueProperty(next.x, next.y) });
      state.feedback = "已加入 (x, y) = (" + format(next.x, 2) + ", " + format(next.y, 2) + ") 的确定性观测；验证账本已更新。";
      render();
      announce(api, rootNode, state.feedback);
    });
    reset.addEventListener("click", function () {
      state = { config: normalizeConfig(DEFAULTS), dataset: copyDataset(), predictions: {}, revealed: false, feedback: "" };
      renderPredictions(doc, predictionHost, state);
      render();
      announce(api, rootNode, "代理模型、查询点、观测集和验证账本已重置。");
    });

    function render() {
      var result = null;
      var error = null;
      try { result = surrogateLedger(state.config, state.dataset); } catch (caught) { error = caught; }
      Object.keys(inputs).forEach(function (key) {
        inputs[key].input.value = String(state.config[key]);
        inputs[key].output.textContent = format(state.config[key], inputs[key].digits);
      });
      feedback.textContent = error ? "代理模型输入错误：" + error.message : state.feedback;
      feedback.className = "ma-feedback" + (error || state.feedback.indexOf("请先") === 0 ? " ma-warn" : "");
      resultPanel.hidden = !state.revealed;
      acquire.disabled = !state.revealed;
      if (!state.revealed || !result) {
        clear(chart);
        clear(tableWrap);
        note.textContent = error ? "请保持查询坐标在 [0,1] 内。" : "完成三项预测并揭示后显示训练凸包、验证和主动学习建议。";
        return;
      }
      clear(chart);
      chart.appendChild(renderSvg(doc, result));
      renderTable(doc, tableWrap, result);
      note.textContent = "边界：这是一个确定性、局部逆距离加权的教学 surrogate；不代表材料数据的真实噪声、因果结构或模型校准。凸包外的数值仍会计算，但必须读作 OOD/外推警告。LOO RMSE 是当前小数据集的验证证据，不是普遍泛化保证；属性本身是归一化 proxy。";
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var base = surrogateLedger(DEFAULTS);
    check(base.prediction.inHull, "default query lies inside the training convex hull");
    check(base.prediction.uncertaintyProxy >= 0 && base.prediction.uncertaintyProxy <= 1, "interpolation uncertainty proxy is normalized");
    check(base.validation.rows.length === INITIAL_DATA.length && Number.isFinite(base.validation.rmse), "leave-one-out validation returns finite evidence");
    var outside = surrogateLedger({ queryX: 0.02, queryY: 0.95 });
    check(!outside.prediction.inHull && outside.prediction.uncertaintyProxy >= 0.75, "convex-hull OOD warning raises uncertainty");
    var exact = predictSurrogate(INITIAL_DATA[0].x, INITIAL_DATA[0].y, INITIAL_DATA);
    check(near(exact.estimate, INITIAL_DATA[0].value) && near(exact.uncertaintyProxy, 0), "exact observation has zero interpolation uncertainty");
    check(pointInConvexHull({ x: 0.5, y: 0.4 }, convexHull(INITIAL_DATA)), "convex hull contains an interior point");
    check(!pointInConvexHull({ x: 0, y: 1 }, convexHull(INITIAL_DATA)), "convex hull rejects a distant point");
    var next = nextActivePoint(INITIAL_DATA);
    check(next && Number.isFinite(next.uncertaintyProxy), "active-learning candidate is deterministic and scored");
    var expanded = copyDataset(INITIAL_DATA);
    expanded.push({ x: next.x, y: next.y, value: trueProperty(next.x, next.y) });
    check(near(predictSurrogate(next.x, next.y, expanded).uncertaintyProxy, 0), "adding the selected observation closes its local uncertainty");
    check(near(trueProperty(0.5, 0.5), trueProperty(0.5, 0.5)), "ground truth toy is deterministic");
    check(JSON.stringify(base) === JSON.stringify(surrogateLedger(DEFAULTS)), "surrogate ledger is deterministic");
    var threw = false;
    try { normalizeConfig({ queryX: 2 }); } catch (error) { threw = true; }
    check(threw, "query outside normalized domain is rejected");
    threw = false;
    try { predictSurrogate(0.5, 0.5, INITIAL_DATA.slice(0, 2)); } catch (error2) { threw = true; }
    check(threw, "too-small training set is rejected");
    return { checks: checks };
  }

  return {
    DEFAULTS: copyDefaults(),
    INITIAL_DATA: copyDataset(),
    ACTIVE_POOL: ACTIVE_POOL.map(function (point) { return { x: point.x, y: point.y }; }),
    normalizeConfig: normalizeConfig,
    trueProperty: trueProperty,
    convexHull: convexHull,
    pointInConvexHull: pointInConvexHull,
    predictSurrogate: predictSurrogate,
    validationLedger: validationLedger,
    nextActivePoint: nextActivePoint,
    surrogateLedger: surrogateLedger,
    format: format,
    mount: mount,
    selfTest: selfTest
  };
});

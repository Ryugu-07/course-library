(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("lp-dp-certificates", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("lp-dp-certificates self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("lp-dp-certificates self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var EPS = 1e-8;
  var STYLE_ID = "cl-lp-dp-certificates-styles";
  var DEFAULTS = { a: 4, b: 12, c: 18 };
  var LABELS = {
    "r1-r3": "资源 1 + 混合资源",
    "r2-r3": "资源 2 + 混合资源",
    "r1-r2": "两条单资源边",
    axis: "坐标轴边界",
    interior: "内部点",
    single: "单条资源边",
    multiple: "退化：多条边"
  };

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(a, b, tolerance) {
    return Math.abs(a - b) <= (tolerance || 1e-8);
  }

  function format(value, digits) {
    if (!isFinite(value)) return "∞";
    var places = digits === undefined ? 3 : digits;
    if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) {
      return value.toExponential(Math.min(places, 4));
    }
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function uniquePoints(points) {
    var result = [];
    points.forEach(function (point) {
      var duplicate = result.some(function (other) {
        return near(point.x, other.x) && near(point.y, other.y);
      });
      if (!duplicate) result.push(point);
    });
    return result;
  }

  function feasible(point, params) {
    return point.x >= -EPS && point.y >= -EPS &&
      point.x <= params.a + EPS &&
      2 * point.y <= params.b + EPS &&
      3 * point.x + 2 * point.y <= params.c + EPS;
  }

  function objective(point) {
    return 3 * point.x + 5 * point.y;
  }

  function solvePrimal(params) {
    var a = Number(params.a);
    var b = Number(params.b);
    var c = Number(params.c);
    var raw = [
      { x: 0, y: 0 },
      { x: a, y: 0 },
      { x: 0, y: b / 2 },
      { x: a, y: b / 2 },
      { x: a, y: (c - 3 * a) / 2 },
      { x: (c - b) / 3, y: b / 2 },
      { x: 0, y: c / 2 },
      { x: c / 3, y: 0 }
    ];
    var candidates = uniquePoints(raw.filter(function (point) { return feasible(point, { a: a, b: b, c: c }); }));
    var best = candidates.reduce(function (current, point) {
      return current === null || objective(point) > objective(current) + EPS ? point : current;
    }, null);
    assert(best, "LP must have a feasible origin");
    var slacks = [a - best.x, b - 2 * best.y, c - 3 * best.x - 2 * best.y];
    var active = {
      r1: Math.abs(slacks[0]) <= EPS,
      r2: Math.abs(slacks[1]) <= EPS,
      r3: Math.abs(slacks[2]) <= EPS,
      x0: Math.abs(best.x) <= EPS,
      y0: Math.abs(best.y) <= EPS
    };
    return {
      x: best.x,
      y: best.y,
      value: objective(best),
      candidates: candidates,
      slacks: slacks,
      active: active,
      feasible: feasible(best, { a: a, b: b, c: c })
    };
  }

  function solveInteger(params) {
    var a = Number(params.a);
    var b = Number(params.b);
    var c = Number(params.c);
    var maxX = Math.floor(Math.min(a, c / 3) + EPS);
    var maxY = Math.floor(Math.min(b / 2, c / 2) + EPS);
    var best = { x: 0, y: 0, value: 0 };
    for (var x = 0; x <= maxX; x += 1) {
      for (var y = 0; y <= maxY; y += 1) {
        if (x <= a + EPS && 2 * y <= b + EPS && 3 * x + 2 * y <= c + EPS) {
          var value = 3 * x + 5 * y;
          if (value > best.value) best = { x: x, y: y, value: value };
        }
      }
    }
    return best;
  }

  function solveDynamic(params) {
    var maxX = Math.max(0, Math.floor(Number(params.a) + EPS));
    var maxY = Math.max(0, Math.floor(Number(params.b) / 2 + EPS));
    var capacity = Math.max(0, Math.floor(Number(params.c) + EPS));
    var items = [];
    for (var xCopy = 0; xCopy < maxX; xCopy += 1) items.push({ kind: "x", weight: 3, value: 3 });
    for (var yCopy = 0; yCopy < maxY; yCopy += 1) items.push({ kind: "y", weight: 2, value: 5 });
    var previous = [];
    for (var initialCapacity = 0; initialCapacity <= capacity; initialCapacity += 1) {
      previous.push({ value: 0, x: 0, y: 0 });
    }
    var table = [previous.map(function (entry) { return entry.value; })];
    items.forEach(function (item) {
      var current = previous.map(function (entry) { return { value: entry.value, x: entry.x, y: entry.y }; });
      for (var available = item.weight; available <= capacity; available += 1) {
        var base = previous[available - item.weight];
        var candidate = {
          value: base.value + item.value,
          x: base.x + (item.kind === "x" ? 1 : 0),
          y: base.y + (item.kind === "y" ? 1 : 0)
        };
        if (candidate.value > current[available].value + EPS) current[available] = candidate;
      }
      previous = current;
      table.push(current.map(function (entry) { return entry.value; }));
    });
    return {
      x: previous[capacity].x,
      y: previous[capacity].y,
      value: previous[capacity].value,
      capacity: capacity,
      stages: items.length,
      table: table,
      boundary: "V(0,w)=0；w<item weight 时沿用上一阶段"
    };
  }

  function solveDual(params) {
    var a = Number(params.a);
    var b = Number(params.b);
    var c = Number(params.c);
    var breakpoints = [0, 1, 2.5];
    var best = null;
    breakpoints.forEach(function (y3) {
      var y1 = Math.max(0, 3 - 3 * y3);
      var y2 = Math.max(0, (5 - 2 * y3) / 2);
      var value = a * y1 + b * y2 + c * y3;
      if (!best || value < best.value) best = { y1: y1, y2: y2, y3: y3, value: value };
    });
    best.slacks = [best.y1 + 3 * best.y3 - 3, 2 * best.y2 + 2 * best.y3 - 5];
    best.feasible = best.y1 >= -EPS && best.y2 >= -EPS && best.y3 >= -EPS &&
      best.slacks[0] >= -EPS && best.slacks[1] >= -EPS;
    return best;
  }

  function certificate(primal, dual) {
    var primalProducts = [
      dual.y1 * primal.slacks[0],
      dual.y2 * primal.slacks[1],
      dual.y3 * primal.slacks[2]
    ];
    var dualProducts = [
      primal.x * dual.slacks[0],
      primal.y * dual.slacks[1]
    ];
    var complementarity = Math.max.apply(null, primalProducts.concat(dualProducts).map(Math.abs));
    return {
      gap: Math.abs(primal.value - dual.value),
      complementarity: complementarity,
      primalProducts: primalProducts,
      dualProducts: dualProducts,
      primalFeasible: primal.feasible && primal.slacks.every(function (value) { return value >= -EPS; }),
      dualFeasible: dual.feasible
    };
  }

  function activeClass(primal) {
    var resources = [];
    if (primal.active.r1) resources.push("r1");
    if (primal.active.r2) resources.push("r2");
    if (primal.active.r3) resources.push("r3");
    if (resources.length >= 2) {
      if (resources.indexOf("r1") >= 0 && resources.indexOf("r2") >= 0 && resources.length === 2) return "r1-r2";
      if (resources.indexOf("r1") >= 0 && resources.indexOf("r3") >= 0 && resources.length === 2) return "r1-r3";
      if (resources.indexOf("r2") >= 0 && resources.indexOf("r3") >= 0 && resources.length === 2) return "r2-r3";
      return "multiple";
    }
    if (primal.active.x0 || primal.active.y0) return "axis";
    if (resources.length === 1) return "single";
    return "interior";
  }

  function polygonOrder(points) {
    var center = points.reduce(function (sum, point) {
      return { x: sum.x + point.x / points.length, y: sum.y + point.y / points.length };
    }, { x: 0, y: 0 });
    return points.slice().sort(function (left, right) {
      return Math.atan2(left.y - center.y, left.x - center.x) - Math.atan2(right.y - center.y, right.x - center.x);
    });
  }

  function renderSvg(primal, integer, params) {
    var maxX = Math.max(params.a, params.c / 3, primal.x, integer.x, 1) * 1.18;
    var maxY = Math.max(params.b / 2, params.c / 2, primal.y, integer.y, 1) * 1.18;
    function px(value) { return 52 + 520 * value / maxX; }
    function py(value) { return 286 - 224 * value / maxY; }
    var ordered = polygonOrder(primal.candidates);
    var path = ordered.map(function (point, index) {
      return (index ? "L" : "M") + px(point.x).toFixed(2) + " " + py(point.y).toFixed(2);
    }).join(" ") + " Z";
    var mixedX = px(params.c / 3);
    var mixedY = py(0);
    var mixedTopX = px(0);
    var mixedTopY = py(params.c / 2);
    return '<svg viewBox="0 0 620 330" role="img" aria-label="线性规划可行域与连续和整数最优点">' +
      '<line x1="52" y1="286" x2="584" y2="286" stroke="currentColor"/><line x1="52" y1="286" x2="52" y2="38" stroke="currentColor"/>' +
      '<path d="' + path + '" fill="#315f9d" fill-opacity=".14" stroke="#315f9d" stroke-width="2"/>' +
      '<line x1="' + px(params.a).toFixed(2) + '" y1="' + py(0) + '" x2="' + px(params.a).toFixed(2) + '" y2="' + py(maxY) + '" stroke="#95670d" stroke-dasharray="6 5"/>' +
      '<line x1="' + px(0) + '" y1="' + py(params.b / 2) + '" x2="' + px(maxX) + '" y2="' + py(params.b / 2) + '" stroke="#95670d" stroke-dasharray="6 5"/>' +
      '<line x1="' + mixedTopX.toFixed(2) + '" y1="' + mixedTopY.toFixed(2) + '" x2="' + mixedX.toFixed(2) + '" y2="' + mixedY.toFixed(2) + '" stroke="#b13d32" stroke-dasharray="6 5"/>' +
      '<circle cx="' + px(primal.x).toFixed(2) + '" cy="' + py(primal.y).toFixed(2) + '" r="7" fill="#b13d32"/>' +
      '<circle cx="' + px(integer.x).toFixed(2) + '" cy="' + py(integer.y).toFixed(2) + '" r="5" fill="#347247" stroke="white" stroke-width="2"/>' +
      '<text x="62" y="28" fill="currentColor">蓝：连续可行域　红：连续最优　绿：整数最优</text>' +
      '<text x="560" y="305">x</text><text x="34" y="48">y</text>' +
      '<text x="' + Math.min(560, px(primal.x) + 9).toFixed(2) + '" y="' + Math.max(50, py(primal.y) - 9).toFixed(2) + '" fill="#b13d32">LP</text>' +
      '<text x="' + Math.min(560, px(integer.x) + 9).toFixed(2) + '" y="' + Math.min(280, py(integer.y) + 18).toFixed(2) + '" fill="#347247">整数</text>' +
      '</svg>';
  }

  function ensureStyles() {
    if (!host || !host.document || host.document.getElementById(STYLE_ID)) return;
    var style = host.document.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="lp-dp-certificates"] .lpc-lab{--lpc-blue:#315f9d;--lpc-gold:#95670d;--lpc-red:#b13d32;--lpc-green:#347247;max-width:100%;min-width:0;color:var(--fg);line-height:1.55}' +
      '[data-learning-lab="lp-dp-certificates"] .lpc-lab *{box-sizing:border-box}' +
      '[data-learning-lab="lp-dp-certificates"] .lpc-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:end}' +
      '[data-learning-lab="lp-dp-certificates"] label{display:grid;gap:6px;font-weight:700}' +
      '[data-learning-lab="lp-dp-certificates"] input,[data-learning-lab="lp-dp-certificates"] select,[data-learning-lab="lp-dp-certificates"] button{min-height:44px;font:inherit}' +
      '[data-learning-lab="lp-dp-certificates"] input{width:100%}' +
      '[data-learning-lab="lp-dp-certificates"] select{width:100%;padding:8px}' +
      '[data-learning-lab="lp-dp-certificates"] button{border:1px solid currentColor;background:transparent;color:inherit;padding:8px 14px;cursor:pointer}' +
      '[data-learning-lab="lp-dp-certificates"] button:hover,[data-learning-lab="lp-dp-certificates"] button:focus-visible{border-color:var(--accent)}' +
      '[data-learning-lab="lp-dp-certificates"] .lpc-primary{background:var(--lpc-blue);border-color:var(--lpc-blue);color:white}' +
      '[data-learning-lab="lp-dp-certificates"] .lpc-question{margin:16px 0 8px;font-weight:700}' +
      '[data-learning-lab="lp-dp-certificates"] .lpc-actions{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}' +
      '[data-learning-lab="lp-dp-certificates"] .lpc-result[hidden]{display:none}' +
      '[data-learning-lab="lp-dp-certificates"] .lpc-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(250px,.8fr);gap:16px;align-items:start}' +
      '[data-learning-lab="lp-dp-certificates"] svg{display:block;width:100%;height:auto;aspect-ratio:620/330;border:1px solid color-mix(in srgb,currentColor 22%,transparent);background:color-mix(in srgb,Canvas 94%,var(--lpc-blue) 6%)}' +
      '[data-learning-lab="lp-dp-certificates"] .lpc-table-wrap{overflow-x:auto}' +
      '[data-learning-lab="lp-dp-certificates"] table{width:100%;border-collapse:collapse}' +
      '[data-learning-lab="lp-dp-certificates"] th,[data-learning-lab="lp-dp-certificates"] td{padding:8px;border-bottom:1px solid color-mix(in srgb,currentColor 20%,transparent);text-align:left;vertical-align:top}' +
      '[data-learning-lab="lp-dp-certificates"] .lpc-note{border-left:4px solid var(--lpc-gold);padding-left:12px;color:var(--fg-soft);font-size:13px}' +
      '@media(max-width:760px){[data-learning-lab="lp-dp-certificates"] .lpc-controls,[data-learning-lab="lp-dp-certificates"] .lpc-grid{grid-template-columns:1fr}}';
    host.document.head.appendChild(style);
  }

  function mount(root) {
    ensureStyles();
    root.innerHTML =
      '<div class="lpc-lab">' +
      '<div class="lpc-controls">' +
      '<label>资源 1 上限 a = <output data-role="a-output">4</output><input data-role="a" type="range" min="2" max="8" step="1" value="4"></label>' +
      '<label>资源 2 上限 b = <output data-role="b-output">12</output><input data-role="b" type="range" min="8" max="20" step="1" value="12"></label>' +
      '<label>混合资源上限 c = <output data-role="c-output">18</output><input data-role="c" type="range" min="12" max="30" step="1" value="18"></label>' +
      '</div>' +
      '<p class="lpc-question">揭示前预测：连续 LP 的最优点由哪组边界决定？</p>' +
      '<label>活动集预测<select data-role="prediction"><option value="">请选择</option><option value="r1-r3">资源 1 + 混合资源</option><option value="r2-r3">资源 2 + 混合资源</option><option value="r1-r2">两条单资源边</option><option value="axis">坐标轴边界</option><option value="interior">内部点</option><option value="single">单条资源边</option><option value="multiple">退化：多条边</option></select></label>' +
      '<div class="lpc-actions"><button class="lpc-primary" type="button" data-role="reveal">揭示证书</button><button type="button" data-role="reset">重置</button></div>' +
      '<div class="lpc-result" data-role="result" hidden aria-live="polite"></div>' +
      '</div>';

    var controls = {
      a: root.querySelector('[data-role="a"]'),
      b: root.querySelector('[data-role="b"]'),
      c: root.querySelector('[data-role="c"]')
    };
    var prediction = root.querySelector('[data-role="prediction"]');
    var result = root.querySelector('[data-role="result"]');

    function params() {
      return { a: Number(controls.a.value), b: Number(controls.b.value), c: Number(controls.c.value) };
    }

    function render() {
      root.querySelector('[data-role="a-output"]').textContent = controls.a.value;
      root.querySelector('[data-role="b-output"]').textContent = controls.b.value;
      root.querySelector('[data-role="c-output"]').textContent = controls.c.value;
      if (result.hidden) return;
      var current = params();
      var primal = solvePrimal(current);
      var integer = solveInteger(current);
      var dynamic = solveDynamic(current);
      var dual = solveDual(current);
      var cert = certificate(primal, dual);
      var expected = activeClass(primal);
      var predictionText = prediction.value === expected ? "预测命中" : "预测需修正";
      result.innerHTML =
        '<div class="lpc-grid"><div>' + renderSvg(primal, integer, current) + '</div><div>' +
        '<h4>' + predictionText + '：' + escapeHtml(LABELS[expected]) + '</h4>' +
        '<div class="lpc-table-wrap"><table><tbody>' +
        '<tr><th>连续 LP 最优</th><td>(' + format(primal.x) + ', ' + format(primal.y) + '), 目标 ' + format(primal.value) + '</td></tr>' +
        '<tr><th>整数可行最优</th><td>(' + integer.x + ', ' + integer.y + '), 目标 ' + integer.value + '</td></tr>' +
        '<tr><th>DP 复算证书</th><td>(' + dynamic.x + ', ' + dynamic.y + '), 目标 ' + dynamic.value + '；' + dynamic.stages + ' 阶段 × 容量 ' + dynamic.capacity + '</td></tr>' +
        '<tr><th>对偶解</th><td>(' + format(dual.y1) + ', ' + format(dual.y2) + ', ' + format(dual.y3) + '), 目标 ' + format(dual.value) + '</td></tr>' +
        '<tr><th>原始/对偶间隙</th><td>' + format(cert.gap) + '</td></tr>' +
        '<tr><th>原始可行</th><td>' + (cert.primalFeasible ? "是" : "否") + '；松弛 (' + primal.slacks.map(function (value) { return format(value); }).join(", ") + ')</td></tr>' +
        '<tr><th>对偶可行</th><td>' + (cert.dualFeasible ? "是" : "否") + '；松弛 (' + dual.slacks.map(function (value) { return format(value); }).join(", ") + ')</td></tr>' +
        '<tr><th>互补松弛最大积</th><td>' + format(cert.complementarity) + '</td></tr>' +
        '</tbody></table></div>' +
        '<p class="lpc-note">连续对偶证书证明的是连续 LP 最优性，最大化时给整数问题上界。DP 把 x/y 的可用份数展开成有界背包阶段，并用 V(0,w)=0 与容量不足时沿用上一行的边界复算整数最优；两本账相等才通过。数值可行不等于最优。</p>' +
        '</div></div>';
    }

    root.querySelector('[data-role="reveal"]').addEventListener("click", function () {
      if (!prediction.value) {
        prediction.focus();
        return;
      }
      result.hidden = false;
      render();
    });
    root.querySelector('[data-role="reset"]').addEventListener("click", function () {
      controls.a.value = String(DEFAULTS.a);
      controls.b.value = String(DEFAULTS.b);
      controls.c.value = String(DEFAULTS.c);
      prediction.value = "";
      result.hidden = true;
      result.innerHTML = "";
      render();
    });
    Object.keys(controls).forEach(function (key) {
      controls[key].addEventListener("input", render);
      controls[key].addEventListener("change", render);
    });
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }
    var primal = solvePrimal(DEFAULTS);
    var integer = solveInteger(DEFAULTS);
    var dynamic = solveDynamic(DEFAULTS);
    var dual = solveDual(DEFAULTS);
    var cert = certificate(primal, dual);
    check(near(primal.x, 2) && near(primal.y, 6), "default primal solution");
    check(near(primal.value, 36), "default primal objective");
    check(near(dual.y1, 0) && near(dual.y2, 1.5) && near(dual.y3, 1), "default dual certificate");
    check(near(dual.value, 36), "strong duality value");
    check(cert.primalFeasible && cert.dualFeasible, "feasibility certificate");
    check(cert.gap < EPS && cert.complementarity < EPS, "zero gap and complementarity");
    check(integer.x === 2 && integer.y === 6, "default integer solution");
    check(dynamic.value === integer.value && dynamic.x === integer.x && dynamic.y === integer.y, "DP matches default integer optimum");
    check(dynamic.table.length === dynamic.stages + 1 && dynamic.table[0].every(function (value) { return value === 0; }), "DP boundary row");
    var fractional = solvePrimal({ a: 4, b: 11, c: 18 });
    var fractionalInteger = solveInteger({ a: 4, b: 11, c: 18 });
    check(fractional.y > fractionalInteger.y, "integer boundary differs from continuous boundary");
    [{ a: 3, b: 7, c: 11 }, { a: 5, b: 9, c: 17 }, { a: 2, b: 20, c: 30 }].forEach(function (params) {
      check(solveDynamic(params).value === solveInteger(params).value, "DP matches enumeration " + JSON.stringify(params));
    });
    check(activeClass(primal) === "r2-r3", "default active set");
    check(solvePrimal({ a: 2, b: 20, c: 30 }).x <= 2 + EPS, "capacity changes primal result");
    return { checks: checks, presets: 3 };
  }

  return {
    mount: mount,
    solvePrimal: solvePrimal,
    solveInteger: solveInteger,
    solveDynamic: solveDynamic,
    solveDual: solveDual,
    certificate: certificate,
    selfTest: selfTest
  };
});

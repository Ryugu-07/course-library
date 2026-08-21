(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("geodesic-metric", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("geodesic-metric self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("geodesic-metric self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var EPS = 1e-10;
  var AFFINE_TOLERANCE = 1e-8;
  var PI = Math.PI;
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "geodesic-metric-lab-styles";
  var INSTANCE = 0;

  var PRESETS = [
    {
      id: "plane-cartesian",
      label: "平面直线",
      manifold: "plane",
      chart: "cartesian",
      duration: 2,
      time: 1,
      initial: [-1.2, -0.45],
      velocity: [1.1, 0.72],
      note: "Cartesian 图中 Γ=0；直线段同时是仿射测地线和全局最短路。"
    },
    {
      id: "plane-polar",
      label: "平面穿过极点",
      manifold: "plane",
      chart: "polar",
      duration: 2,
      time: 1,
      initial: [-1, 0],
      velocity: [1, 0],
      note: "同一条平面直线在 t=1 经过原点；极坐标失效，平面本身没有奇点。"
    },
    {
      id: "sphere-short",
      label: "球面短大圆弧",
      manifold: "sphere",
      chart: "spherical",
      duration: 2,
      time: 1,
      initial: [PI / 3, -0.4],
      velocity: [0.55, 0.9],
      note: "单位球上的大圆弧长度小于 π；它是仿射测地线，也连接两端的最短路。"
    },
    {
      id: "sphere-long",
      label: "球面长大圆弧",
      manifold: "sphere",
      chart: "spherical",
      duration: 4,
      time: 2,
      initial: [PI / 3, -0.4],
      velocity: [0.55, 0.9],
      note: "仍满足仿射测地线方程，但走过 π 后不再是端点间全局最短路。"
    },
    {
      id: "sphere-antipodal",
      label: "球面对跖点",
      manifold: "sphere",
      chart: "spherical",
      duration: PI,
      time: PI / 2,
      initial: [PI / 2, 0],
      velocity: [0, 1],
      note: "半大圆到达对跖点；仿射方程有解，最短路不唯一。"
    }
  ];

  var STYLE_TEXT = [
    ".gm-lab{max-width:100%;min-width:0;color:var(--fg,#20252b);line-height:1.55;overflow-wrap:anywhere}",
    ".gm-lab *,.gm-lab *::before,.gm-lab *::after{box-sizing:border-box}.gm-lab [hidden]{display:none!important}",
    ".gm-lab h3,.gm-lab h4{margin:0;color:var(--fg,#20252b);letter-spacing:0}.gm-lab h3{font-size:1.14rem}.gm-lab h4{font-size:1rem}.gm-lab p{margin:8px 0}",
    ".gm-lab .gm-note,.gm-lab .gm-feedback,.gm-lab .gm-status{color:var(--fg-soft,var(--muted,#5d6873));font-size:13px;line-height:1.65}",
    ".gm-lab button,.gm-lab input,.gm-lab select{font:inherit}.gm-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--bg,#fff);color:var(--fg,#20252b);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.gm-lab button:hover{border-color:var(--accent,#1769aa)}.gm-lab button:focus-visible,.gm-lab input:focus-visible,.gm-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.gm-lab button[aria-pressed=true],.gm-lab button.gm-primary{border-color:var(--accent,#1769aa);background:var(--accent,#1769aa);color:var(--bg,#fff);font-weight:750}.gm-lab button:disabled{opacity:.55;cursor:not-allowed}",
    ".gm-lab .gm-presets{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;margin:10px 0}.gm-lab .gm-presets button{font-size:12px}.gm-lab .gm-controls{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(170px,.8fr) minmax(0,1fr);gap:12px;margin:12px 0;align-items:end}.gm-lab .gm-control{display:grid;gap:4px;min-width:0}.gm-lab .gm-control label,.gm-lab .gm-control>span{color:var(--fg-soft,var(--muted,#5d6873));font-size:12.5px;font-weight:700}.gm-lab .gm-control output{color:var(--accent,#1769aa);font-variant-numeric:tabular-nums}.gm-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent,#1769aa)}.gm-lab select{width:100%;min-height:44px;padding:8px 10px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--bg,#fff);color:var(--fg,#20252b)}",
    ".gm-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#c8cdd3)}.gm-lab legend{max-width:100%;padding:0 4px;color:var(--fg,#20252b);font-size:13px;font-weight:750;line-height:1.5}.gm-lab .gm-choice-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.gm-lab .gm-choice-grid button{font-size:12px}",
    ".gm-lab .gm-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--cl-gold,#9a6b12);background:var(--block-bg,var(--bg,#fff))}.gm-lab .gm-prediction-title{display:block;margin-bottom:8px;font-size:13px}.gm-lab .gm-question{margin:10px 0}.gm-lab .gm-question legend{margin-bottom:6px}.gm-lab .gm-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.gm-lab .gm-pass{color:var(--cl-green,#2f7547)}.gm-lab .gm-warn{color:var(--cl-red,#b43d32)}.gm-lab .gm-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.gm-lab .gm-actions>*{flex:1 1 170px}",
    ".gm-lab .gm-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#c8cdd3)}.gm-lab .gm-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}.gm-lab .gm-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#c8cdd3);background:var(--block-bg,var(--bg,#fff))}.gm-lab .gm-metric:nth-child(4n+1){border-color:var(--cl-blue,#2c6aa0)}.gm-lab .gm-metric:nth-child(4n+2){border-color:var(--cl-green,#2f7547)}.gm-lab .gm-metric:nth-child(4n+3){border-color:var(--cl-gold,#9a6b12)}.gm-lab .gm-metric:nth-child(4n){border-color:var(--cl-red,#b43d32)}.gm-lab .gm-metric span{display:block;color:var(--fg-soft,var(--muted,#5d6873));font-size:11px;line-height:1.4}.gm-lab .gm-metric strong{display:block;margin-top:3px;font-size:13px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".gm-lab .gm-stage{min-width:0;padding:8px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--block-bg,var(--bg,#fff))}.gm-lab .gm-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg,#20252b)}.gm-lab .gm-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.gm-lab .gm-svg .gm-grid{stroke:currentColor;stroke-opacity:.14;stroke-width:1}.gm-lab .gm-svg .gm-axis{stroke:currentColor;stroke-opacity:.5;stroke-width:1.1}.gm-lab .gm-svg .gm-curve{fill:none;stroke:var(--cl-blue,#2c6aa0);stroke-width:2.6}.gm-lab .gm-svg .gm-end{fill:var(--cl-green,#2f7547);stroke:var(--bg,#fff);stroke-width:2}.gm-lab .gm-svg .gm-point{fill:var(--cl-red,#b43d32);stroke:var(--bg,#fff);stroke-width:2}.gm-lab .gm-svg .gm-singular{stroke:var(--cl-red,#b43d32);stroke-width:2;stroke-dasharray:5 4}.gm-lab .gm-svg .gm-label{font-size:12px;font-weight:750}.gm-lab .gm-svg .gm-small{font-size:10px;fill:var(--fg-soft,var(--muted,#5d6873))}",
    ".gm-lab .gm-ledger-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:12px}.gm-lab table{width:100%;min-width:760px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.gm-lab table caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,var(--muted,#5d6873));font-size:12px}.gm-lab th,.gm-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#c8cdd3);text-align:left;vertical-align:top}.gm-lab th{color:var(--fg-soft,var(--muted,#5d6873));font-size:11.5px}.gm-lab .gm-interpretation{margin-top:10px;padding:10px 12px;border-left:3px solid var(--cl-green,#2f7547);background:var(--block-bg,var(--bg,#fff));font-size:13px;line-height:1.65}",
    "@media(max-width:920px){.gm-lab .gm-presets{grid-template-columns:repeat(3,minmax(0,1fr))}.gm-lab .gm-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.gm-lab .gm-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}",
    "@media(max-width:620px){.gm-lab .gm-presets{grid-template-columns:repeat(2,minmax(0,1fr))}.gm-lab .gm-controls{grid-template-columns:minmax(0,1fr)}.gm-lab .gm-choice-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.gm-lab .gm-prediction{padding:10px}.gm-lab .gm-stage{padding:4px}}",
    "@media(max-width:420px){.gm-lab .gm-presets,.gm-lab .gm-metrics,.gm-lab .gm-choice-grid{grid-template-columns:minmax(0,1fr)}}",
    "@media(prefers-reduced-motion:reduce){.gm-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function close(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-9 : tolerance);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function add(a, b) {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  function scale(a, factor) {
    return [a[0] * factor, a[1] * factor, a[2] * factor];
  }

  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function norm(a) {
    return Math.sqrt(dot(a, a));
  }

  function unit(a) {
    var length = norm(a);
    return length > EPS ? scale(a, 1 / length) : null;
  }

  function presetById(id) {
    var fallback = PRESETS[0];
    PRESETS.forEach(function (preset) {
      if (preset.id === id) fallback = preset;
    });
    return fallback;
  }

  function zeroSymbols() {
    return [[[0, 0], [0, 0]], [[0, 0], [0, 0]]];
  }

  function metricTensor(manifold, chart, coordinates) {
    var q = coordinates || [0, 0];
    var first = Number(q[0]);
    var second = Number(q[1]);
    if (manifold === "plane" && chart === "cartesian") {
      return { matrix: [[1, 0], [0, 1]], determinant: 1, regular: true, manifoldRegular: true, note: "Cartesian 平面坐标处处正则。" };
    }
    if (manifold === "plane" && chart === "polar") {
      var r = Math.abs(first);
      return { matrix: [[1, 0], [0, r * r]], determinant: r * r, regular: r > EPS, manifoldRegular: true, note: "r=0 是极坐标的坐标奇异，不是平面的流形奇异。" };
    }
    if (manifold === "sphere" && chart === "spherical") {
      var sinTheta = Math.sin(first);
      var determinant = sinTheta * sinTheta;
      return { matrix: [[1, 0], [0, determinant]], determinant: determinant, regular: Math.abs(sinTheta) > EPS, manifoldRegular: true, note: "θ=0,π 是经纬坐标的极点奇异；球面仍是光滑流形。" };
    }
    if (manifold === "sphere" && chart === "stereographic") {
      var rhoSquared = first * first + second * second;
      var factor = 4 / Math.pow(1 + rhoSquared, 2);
      return { matrix: [[factor, 0], [0, factor]], determinant: factor * factor, regular: finite(factor) && factor > EPS, manifoldRegular: true, note: "北极被此 stereographic 图排除；有限坐标处度量正定。" };
    }
    throw new Error("unknown metric chart: " + manifold + "/" + chart);
  }

  function christoffelSymbols(manifold, chart, coordinates) {
    var q = coordinates || [0, 0];
    var first = Number(q[0]);
    var second = Number(q[1]);
    var symbols = zeroSymbols();
    var nonzero = [];
    var regular = true;
    function put(k, i, j, value, name) {
      symbols[k][i][j] = value;
      if (finite(value) && Math.abs(value) > EPS) nonzero.push({ component: name, value: value });
      if (!finite(value)) regular = false;
    }
    if (manifold === "plane" && chart === "cartesian") {
      return { symbols: symbols, nonzero: nonzero, regular: true, note: "所有 Γ^k_ij=0。" };
    }
    if (manifold === "plane" && chart === "polar") {
      put(0, 1, 1, -first, "Γ^r_θθ");
      put(1, 0, 1, Math.abs(first) > EPS ? 1 / first : null, "Γ^θ_rθ");
      put(1, 1, 0, Math.abs(first) > EPS ? 1 / first : null, "Γ^θ_θr");
      return { symbols: symbols, nonzero: nonzero, regular: regular, note: regular ? "Γ^r_θθ=-r，Γ^θ_rθ=Γ^θ_θr=1/r。" : "r=0 时坐标 Christoffel 失效；这不是流形数据。" };
    }
    if (manifold === "sphere" && chart === "spherical") {
      var sinTheta = Math.sin(first);
      var cosTheta = Math.cos(first);
      put(0, 1, 1, -sinTheta * cosTheta, "Γ^θ_φφ");
      var cotangent = Math.abs(sinTheta) > EPS ? cosTheta / sinTheta : null;
      put(1, 0, 1, cotangent, "Γ^φ_θφ");
      put(1, 1, 0, cotangent, "Γ^φ_φθ");
      return { symbols: symbols, nonzero: nonzero, regular: regular, note: regular ? "Γ^θ_φφ=-sinθ cosθ，Γ^φ_θφ=Γ^φ_φθ=cotθ。" : "极点处经纬 Christoffel 坐标式失效。" };
    }
    if (manifold === "sphere" && chart === "stereographic") {
      var denominator = 1 + first * first + second * second;
      var A = -2 * first / denominator;
      var B = -2 * second / denominator;
      put(0, 0, 0, A, "Γ^u_uu");
      put(0, 0, 1, B, "Γ^u_uv");
      put(0, 1, 0, B, "Γ^u_vu");
      put(0, 1, 1, -A, "Γ^u_vv");
      put(1, 0, 0, -B, "Γ^v_uu");
      put(1, 0, 1, A, "Γ^v_uv");
      put(1, 1, 0, A, "Γ^v_vu");
      put(1, 1, 1, B, "Γ^v_vv");
      return { symbols: symbols, nonzero: nonzero, regular: true, note: "g=4(1+u²+v²)⁻² I 的共形 Christoffel 分量。" };
    }
    throw new Error("unknown Christoffel chart: " + manifold + "/" + chart);
  }

  function planePolarToCartesian(coordinates) {
    var r = Number(coordinates[0]);
    var theta = Number(coordinates[1]);
    return [r * Math.cos(theta), r * Math.sin(theta), 0];
  }

  function planeCartesianToPolar(point) {
    var x = Number(point[0]);
    var y = Number(point[1]);
    var r = Math.hypot(x, y);
    return [r, r > EPS ? Math.atan2(y, x) : null];
  }

  function sphereSphericalToEmbedding(coordinates) {
    var theta = Number(coordinates[0]);
    var phi = Number(coordinates[1]);
    var sinTheta = Math.sin(theta);
    return [sinTheta * Math.cos(phi), sinTheta * Math.sin(phi), Math.cos(theta)];
  }

  function sphereEmbeddingToSpherical(point) {
    var p = unit(point);
    if (!p) throw new Error("sphere embedding point cannot be zero");
    var theta = Math.acos(clamp(p[2], -1, 1));
    var sinTheta = Math.hypot(p[0], p[1]);
    return [theta, sinTheta > EPS ? Math.atan2(p[1], p[0]) : null];
  }

  function sphereSphericalToStereographic(coordinates) {
    var point = sphereSphericalToEmbedding(coordinates);
    var denominator = 1 - point[2];
    if (denominator <= EPS) return null;
    return [point[0] / denominator, point[1] / denominator];
  }

  function sphereStereographicToEmbedding(coordinates) {
    var u = Number(coordinates[0]);
    var v = Number(coordinates[1]);
    var rhoSquared = u * u + v * v;
    return [2 * u / (1 + rhoSquared), 2 * v / (1 + rhoSquared), (1 - rhoSquared) / (1 + rhoSquared)];
  }

  function chartCoordinatesFromEmbedding(manifold, chart, point) {
    if (manifold === "plane" && chart === "cartesian") return [point[0], point[1]];
    if (manifold === "plane" && chart === "polar") return planeCartesianToPolar(point);
    if (manifold === "sphere" && chart === "spherical") return sphereEmbeddingToSpherical(point);
    if (manifold === "sphere" && chart === "stereographic") {
      var denominator = 1 - point[2];
      if (denominator <= EPS) return null;
      return [point[0] / denominator, point[1] / denominator];
    }
    throw new Error("unknown chart: " + manifold + "/" + chart);
  }

  function chartTransition(manifold, fromChart, toChart, coordinates) {
    var point;
    if (manifold === "plane") {
      point = fromChart === "cartesian" ? [Number(coordinates[0]), Number(coordinates[1]), 0] : planePolarToCartesian(coordinates);
    } else {
      point = fromChart === "spherical" ? sphereSphericalToEmbedding(coordinates) : sphereStereographicToEmbedding(coordinates);
    }
    var target = chartCoordinatesFromEmbedding(manifold, toChart, point);
    var sourceMetric = metricTensor(manifold, fromChart, coordinates);
    var targetMetric = target ? metricTensor(manifold, toChart, target) : null;
    return {
      manifold: manifold,
      fromChart: fromChart,
      toChart: toChart,
      source: coordinates.slice ? coordinates.slice() : coordinates,
      target: target,
      embedding: point,
      sourceRegular: sourceMetric.regular,
      targetRegular: !!(targetMetric && targetMetric.regular),
      manifoldRegular: true,
      note: sourceMetric.regular && targetMetric && targetMetric.regular
        ? "坐标分量改变，但嵌入点与度量长度不变。"
        : "至少一个坐标图在此点失效；嵌入点仍在光滑流形上。"
    };
  }

  function chartLabels(manifold, chart) {
    if (manifold === "plane" && chart === "cartesian") return ["x", "y"];
    if (manifold === "plane" && chart === "polar") return ["r", "θ"];
    if (manifold === "sphere" && chart === "spherical") return ["θ", "φ"];
    return ["u", "v"];
  }

  function coordinateVelocityAndAcceleration(manifold, chart, point, velocity, acceleration) {
    if (manifold === "plane" && chart === "cartesian") {
      return { velocity: [velocity[0], velocity[1]], acceleration: [acceleration[0], acceleration[1]] };
    }
    if (manifold === "plane" && chart === "polar") {
      var r = Math.hypot(point[0], point[1]);
      if (r <= EPS) return { velocity: null, acceleration: null };
      var rDot = (point[0] * velocity[0] + point[1] * velocity[1]) / r;
      var thetaDot = (point[0] * velocity[1] - point[1] * velocity[0]) / (r * r);
      var speedSquared = velocity[0] * velocity[0] + velocity[1] * velocity[1];
      var rSecond = (speedSquared - rDot * rDot) / r;
      var thetaSecond = -2 * rDot * thetaDot / r;
      return { velocity: [rDot, thetaDot], acceleration: [rSecond, thetaSecond] };
    }
    if (manifold === "sphere" && chart === "spherical") {
      var spherical = sphereEmbeddingToSpherical(point);
      var theta = spherical[0];
      var phi = spherical[1];
      var sinTheta = Math.sin(theta);
      if (Math.abs(sinTheta) <= EPS || phi === null) return { velocity: null, acceleration: null };
      var eTheta = [Math.cos(theta) * Math.cos(phi), Math.cos(theta) * Math.sin(phi), -Math.sin(theta)];
      var ePhi = [-Math.sin(phi), Math.cos(phi), 0];
      var thetaVelocity = dot(velocity, eTheta);
      var phiVelocity = dot(velocity, ePhi) / sinTheta;
      var thetaAcceleration = sinTheta * Math.cos(theta) * phiVelocity * phiVelocity;
      var phiAcceleration = -2 * Math.cos(theta) / sinTheta * thetaVelocity * phiVelocity;
      return { velocity: [thetaVelocity, phiVelocity], acceleration: [thetaAcceleration, phiAcceleration] };
    }
    if (manifold === "sphere" && chart === "stereographic") {
      var denominator = 1 - point[2];
      if (denominator <= EPS) return { velocity: null, acceleration: null };
      var x = point[0];
      var y = point[1];
      var vx = velocity[0];
      var vy = velocity[1];
      var vz = velocity[2];
      var ax = acceleration[0];
      var ay = acceleration[1];
      var az = acceleration[2];
      var uDot = vx / denominator + x * vz / (denominator * denominator);
      var vDot = vy / denominator + y * vz / (denominator * denominator);
      var uSecond = ax / denominator + 2 * vx * vz / (denominator * denominator) + x * az / (denominator * denominator) + 2 * x * vz * vz / Math.pow(denominator, 3);
      var vSecond = ay / denominator + 2 * vy * vz / (denominator * denominator) + y * az / (denominator * denominator) + 2 * y * vz * vz / Math.pow(denominator, 3);
      return { velocity: [uDot, vDot], acceleration: [uSecond, vSecond] };
    }
    throw new Error("unknown coordinate derivative chart: " + manifold + "/" + chart);
  }

  function geodesicResidual(christoffel, coordinateVelocity, coordinateAcceleration) {
    if (!christoffel || !christoffel.regular || !coordinateVelocity || !coordinateAcceleration) return null;
    var residual = [coordinateAcceleration[0], coordinateAcceleration[1]];
    var k;
    var i;
    var j;
    for (k = 0; k < 2; k += 1) {
      residual[k] = coordinateAcceleration[k];
      for (i = 0; i < 2; i += 1) {
        for (j = 0; j < 2; j += 1) {
          var component = christoffel.symbols[k][i][j];
          if (!finite(component)) return null;
          residual[k] += component * coordinateVelocity[i] * coordinateVelocity[j];
        }
      }
    }
    return Math.hypot(residual[0], residual[1]);
  }

  function analyticGeodesicResidual(manifold, point, acceleration, speed) {
    if (!point || !acceleration || !finite(speed)) return null;
    if (manifold === "plane") return Math.hypot(acceleration[0], acceleration[1]);
    if (manifold === "sphere") {
      return norm([
        acceleration[0] + speed * speed * point[0],
        acceleration[1] + speed * speed * point[1],
        acceleration[2] + speed * speed * point[2]
      ]);
    }
    return null;
  }

  function geodesicPoint(id, time, requestedChart) {
    var preset = presetById(id);
    var t = Number(time);
    if (!finite(t)) throw new Error("geodesic time must be finite");
    var chart = requestedChart || preset.chart;
    var point;
    var velocity;
    var acceleration;
    var speed;
    if (preset.manifold === "plane") {
      point = [preset.initial[0] + preset.velocity[0] * t, preset.initial[1] + preset.velocity[1] * t, 0];
      velocity = [preset.velocity[0], preset.velocity[1], 0];
      acceleration = [0, 0, 0];
      speed = Math.hypot(velocity[0], velocity[1]);
    } else {
      var theta0 = preset.initial[0];
      var phi0 = preset.initial[1];
      var p0 = sphereSphericalToEmbedding([theta0, phi0]);
      var eTheta0 = [Math.cos(theta0) * Math.cos(phi0), Math.cos(theta0) * Math.sin(phi0), -Math.sin(theta0)];
      var ePhi0 = [-Math.sin(phi0), Math.cos(phi0), 0];
      var tangent = add(scale(eTheta0, preset.velocity[0]), scale(ePhi0, Math.sin(theta0) * preset.velocity[1]));
      speed = norm(tangent);
      if (speed <= EPS) {
        point = p0;
        velocity = [0, 0, 0];
        acceleration = [0, 0, 0];
      } else {
        var angle = speed * t;
        point = add(scale(p0, Math.cos(angle)), scale(tangent, Math.sin(angle) / speed));
        velocity = add(scale(p0, -speed * Math.sin(angle)), scale(tangent, Math.cos(angle)));
        acceleration = scale(point, -speed * speed);
      }
    }
    var coordinates = chartCoordinatesFromEmbedding(preset.manifold, chart, point);
    var chartMetric = coordinates ? metricTensor(preset.manifold, chart, coordinates) : null;
    var chartChristoffel = coordinates ? christoffelSymbols(preset.manifold, chart, coordinates) : null;
    var coordinate = coordinates ? coordinateVelocityAndAcceleration(preset.manifold, chart, point, velocity, acceleration) : { velocity: null, acceleration: null };
    var energy = 0.5 * speed * speed;
    var coordinateEnergy = chartMetric && coordinate.velocity && chartMetric.regular
      ? 0.5 * (chartMetric.matrix[0][0] * coordinate.velocity[0] * coordinate.velocity[0] + 2 * chartMetric.matrix[0][1] * coordinate.velocity[0] * coordinate.velocity[1] + chartMetric.matrix[1][1] * coordinate.velocity[1] * coordinate.velocity[1])
      : null;
    var chartRegular = !!(chartMetric && chartMetric.regular && chartChristoffel && chartChristoffel.regular && coordinate.velocity && coordinate.acceleration);
    var residual = geodesicResidual(chartChristoffel, coordinate.velocity, coordinate.acceleration);
    var analyticResidual = analyticGeodesicResidual(preset.manifold, point, acceleration, speed);
    var affineStatus = !chartRegular
      ? "unavailable"
      : residual !== null && analyticResidual !== null && residual <= AFFINE_TOLERANCE && analyticResidual <= AFFINE_TOLERANCE
        ? "yes"
        : "no";
    return {
      id: id,
      manifold: preset.manifold,
      chart: chart,
      time: t,
      point: point,
      velocity: velocity,
      acceleration: acceleration,
      speed: speed,
      energy: energy,
      coordinates: coordinates,
      coordinateVelocity: coordinate.velocity,
      coordinateAcceleration: coordinate.acceleration,
      coordinateEnergy: coordinateEnergy,
      metric: chartMetric,
      christoffel: chartChristoffel,
      chartRegular: chartRegular,
      manifoldRegular: true,
      residual: residual,
      analyticResidual: analyticResidual,
      affineStatus: affineStatus,
      analyticAffineGeodesic: analyticResidual !== null && analyticResidual <= AFFINE_TOLERANCE,
      isAffineGeodesic: affineStatus === "yes"
    };
  }

  function globalDistance(manifold, firstPoint, secondPoint) {
    if (manifold === "plane") return Math.hypot(firstPoint[0] - secondPoint[0], firstPoint[1] - secondPoint[1]);
    return Math.acos(clamp(dot(unit(firstPoint), unit(secondPoint)), -1, 1));
  }

  function distanceClassification(manifold, firstPoint, secondPoint, length) {
    var distance = globalDistance(manifold, firstPoint, secondPoint);
    if (manifold === "plane") {
      return {
        distance: distance,
        status: close(length, distance, 1e-8) ? "minimizing" : "not-minimizing",
        globallyMinimizing: close(length, distance, 1e-8),
        note: "平面欧氏直线段是全局最短路。"
      };
    }
    if (close(distance, PI, 1e-8) && close(length, PI, 1e-8)) {
      return { distance: distance, status: "antipodal", globallyMinimizing: true, note: "对跖点有无穷多条长度 π 的最短大圆弧；最短路不唯一。" };
    }
    var minimizing = length <= PI + 1e-8 && close(length, distance, 1e-8);
    return {
      distance: distance,
      status: minimizing ? "minimizing" : "not-minimizing",
      globallyMinimizing: minimizing,
      note: minimizing ? "小于 π 的大圆弧是端点间最短路。" : "它仍是仿射测地线，但超过 cut locus 后不再是全局最短。"
    };
  }

  function geodesicLedger(id, requestedChart, sampleCount) {
    var preset = presetById(id);
    var chart = requestedChart || preset.chart;
    var count = Math.max(5, Math.round(sampleCount || 9));
    if (preset.id === "plane-polar" && count % 2) count += 1;
    var rows = [];
    var index;
    for (index = 0; index <= count; index += 1) {
      rows.push(geodesicPoint(id, preset.duration * index / count, chart));
    }
    var first = rows[0];
    var last = rows[rows.length - 1];
    var length = first.speed * preset.duration;
    var distance = distanceClassification(preset.manifold, first.point, last.point, length);
    var energies = rows.map(function (row) { return row.energy; });
    var energySpread = Math.max.apply(null, energies) - Math.min.apply(null, energies);
    var residuals = rows.map(function (row) { return row.residual; }).filter(finite);
    var affineStatuses = rows.map(function (row) { return row.affineStatus; });
    var affineVerdict = affineStatuses.indexOf("no") >= 0 ? "no" : affineStatuses.indexOf("unavailable") >= 0 ? "unavailable" : "yes";
    return {
      id: id,
      manifold: preset.manifold,
      chart: chart,
      duration: preset.duration,
      rows: rows,
      initial: first,
      endpoint: last,
      geodesicLength: length,
      globalDistance: distance.distance,
      distanceStatus: distance.status,
      globallyMinimizing: distance.globallyMinimizing,
      distanceNote: distance.note,
      affineVerdict: affineVerdict,
      affineGeodesic: affineVerdict === "yes",
      energySpread: energySpread,
      energyConserved: energySpread <= 1e-9,
      maxResidual: residuals.length ? Math.max.apply(null, residuals) : null,
      maxAnalyticResidual: Math.max.apply(null, rows.map(function (row) { return row.analyticResidual; })),
      chartSingularRows: rows.filter(function (row) { return !row.chartRegular; }).length
    };
  }

  function formatNumber(value, digits) {
    if (value === null || value === undefined || !finite(value)) return "未定义";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) < 1e-8) return "0";
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "").replace(/^-0$/, "0");
  }

  function formatCoordinates(value) {
    if (!value) return "无有限坐标";
    return "(" + value.map(function (entry) { return formatNumber(entry, 4); }).join(", ") + ")";
  }

  function formatMatrix(matrix) {
    if (!matrix) return "未定义";
    return "[" + matrix.map(function (row) {
      return "[" + row.map(function (value) { return formatNumber(value, 4); }).join(", ") + "]";
    }).join("; ") + "]";
  }

  function setAttributes(node, attributes) {
    Object.keys(attributes || {}).forEach(function (key) {
      var value = attributes[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function element(doc, tag, attributes, children) {
    var node = setAttributes(doc.createElement(tag), attributes);
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function svgElement(doc, tag, attributes, children) {
    var node = setAttributes(doc.createElementNS(SVG_NS, tag), attributes);
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function installStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    (doc.head || doc.documentElement).appendChild(element(doc, "style", { id: STYLE_ID }, STYLE_TEXT));
  }

  function makeMap(points) {
    var xy = points.map(function (point) { return [point[0] - 0.3 * point[2], point[1] - 0.18 * point[2]]; });
    var xs = xy.map(function (point) { return point[0]; });
    var ys = xy.map(function (point) { return point[1]; });
    var minX = Math.min.apply(null, xs);
    var maxX = Math.max.apply(null, xs);
    var minY = Math.min.apply(null, ys);
    var maxY = Math.max.apply(null, ys);
    var spanX = Math.max(maxX - minX, 1);
    var spanY = Math.max(maxY - minY, 1);
    return function (point) {
      var value = [point[0] - 0.3 * point[2], point[1] - 0.18 * point[2]];
      return [54 + (value[0] - minX) / spanX * 652, 304 - (value[1] - minY) / spanY * 252];
    };
  }

  function svgPath(points, map) {
    return points.map(function (point, index) {
      var mapped = map(point);
      return (index ? "L" : "M") + mapped[0].toFixed(2) + " " + mapped[1].toFixed(2);
    }).join(" ");
  }

  function geodesicSvg(doc, ledger, preset, id, currentTime) {
    var samples = [];
    var index;
    for (index = 0; index <= 100; index += 1) {
      samples.push(geodesicPoint(ledger.id, preset.duration * index / 100, ledger.chart).point);
    }
    var map = makeMap(samples);
    var svg = svgElement(doc, "svg", { class: "gm-svg", viewBox: "0 0 760 350", role: "img", "aria-labelledby": id + "-title " + id + "-desc" });
    svg.appendChild(svgElement(doc, "title", { id: id + "-title" }, preset.label + "的测地线图"));
    svg.appendChild(svgElement(doc, "desc", { id: id + "-desc" }, "蓝色为仿射测地线，红点为当前时刻，绿色为终点；红色叉号表示所选坐标图在此点失效，而不是流形破裂。"));
    [80, 150, 220, 290].forEach(function (y) { svg.appendChild(svgElement(doc, "line", { x1: "50", y1: String(y), x2: "710", y2: String(y), class: "gm-grid" })); });
    [160, 300, 440, 580].forEach(function (x) { svg.appendChild(svgElement(doc, "line", { x1: String(x), y1: "36", x2: String(x), y2: "315", class: "gm-grid" })); });
    svg.appendChild(svgElement(doc, "line", { x1: "50", y1: "315", x2: "710", y2: "315", class: "gm-axis" }));
    if (ledger.manifold === "sphere") svg.appendChild(svgElement(doc, "ellipse", { cx: "380", cy: "185", rx: "205", ry: "118", fill: "none", stroke: "currentColor", "stroke-opacity": ".18" }));
    svg.appendChild(svgElement(doc, "path", { d: svgPath(samples, map), class: "gm-curve" }));
    var currentRow = geodesicPoint(ledger.id, currentTime, ledger.chart);
    var current = map(currentRow.point);
    var end = map(ledger.endpoint.point);
    svg.appendChild(svgElement(doc, "circle", { cx: end[0], cy: end[1], r: "6", class: "gm-end" }));
    svg.appendChild(svgElement(doc, "circle", { cx: current[0], cy: current[1], r: "6", class: "gm-point" }));
    if (!currentRow.chartRegular) {
      svg.appendChild(svgElement(doc, "line", { x1: current[0] - 18, y1: current[1] - 18, x2: current[0] + 18, y2: current[1] + 18, class: "gm-singular" }));
      svg.appendChild(svgElement(doc, "line", { x1: current[0] - 18, y1: current[1] + 18, x2: current[0] + 18, y2: current[1] - 18, class: "gm-singular" }));
      svg.appendChild(svgElement(doc, "text", { x: Math.min(650, current[0] + 22), y: Math.max(25, current[1] - 22), class: "gm-label" }, "坐标图奇异，流形仍在"));
    }
    svg.appendChild(svgElement(doc, "text", { x: "54", y: "25", class: "gm-small" }, ledger.manifold === "sphere" ? "单位球嵌入投影：大圆保持在球面上" : "平面嵌入投影：坐标图只改变分量写法"));
    return svg;
  }

  function metricBlock(doc, label, value) {
    return element(doc, "div", { className: "gm-metric" }, [element(doc, "span", {}, label), element(doc, "strong", {}, value)]);
  }

  function question(doc, key, label, options, state, onChange) {
    var fieldset = element(doc, "fieldset", { className: "gm-question", "data-answer-key": key });
    fieldset.appendChild(element(doc, "legend", {}, label));
    var grid = element(doc, "div", { className: "gm-choice-grid" });
    options.forEach(function (option) {
      var button = element(doc, "button", { type: "button", "data-answer-value": option.value, "aria-pressed": state.answers[key] === option.value ? "true" : "false" }, option.label);
      button.addEventListener("click", function () {
        state.answers[key] = option.value;
        Array.prototype.forEach.call(grid.children, function (child) { child.setAttribute("aria-pressed", child === button ? "true" : "false"); });
        onChange();
      });
      grid.appendChild(button);
    });
    fieldset.appendChild(grid);
    return fieldset;
  }

  function chartOptions(manifold) {
    return manifold === "plane"
      ? [{ value: "cartesian", label: "Cartesian (x,y)" }, { value: "polar", label: "极坐标 (r,θ)" }]
      : [{ value: "spherical", label: "球坐标 (θ,φ)" }, { value: "stereographic", label: "立体投影 (u,v)" }];
  }

  function expectedAnswers(point, ledger) {
    return {
      affine: point.affineStatus,
      energy: ledger.energyConserved ? "constant" : "not-constant",
      global: ledger.distanceStatus === "minimizing" ? "minimizing" : ledger.distanceStatus === "antipodal" ? "multiple" : "not-minimizing",
      chart: point.chartRegular ? "regular" : "chart-only"
    };
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    var firstPreset = presetById("sphere-short");
    var state = {
      id: firstPreset.id,
      chart: firstPreset.chart,
      time: firstPreset.time,
      answers: { affine: null, energy: null, global: null, chart: null },
      revealed: false
    };
    var serial = INSTANCE += 1;
    var shell = element(doc, "div", { className: "gm-lab" });
    shell.appendChild(element(doc, "h3", {}, "测地线账本：Γ、能量与最短路是三件事"));
    shell.appendChild(element(doc, "p", { className: "gm-note" }, "同一条仿射测地线可以只是长度泛函的临界点，未必是端点间全局最短路。坐标图的奇异也不等于流形奇异。"));
    var presets = element(doc, "div", { className: "gm-presets" });
    PRESETS.forEach(function (preset) {
      var button = element(doc, "button", { type: "button", "aria-pressed": state.id === preset.id ? "true" : "false" }, preset.label);
      button.addEventListener("click", function () {
        state.id = preset.id;
        state.chart = preset.chart;
        state.time = preset.time;
        state.answers = { affine: null, energy: null, global: null, chart: null };
        state.revealed = false;
        render();
      });
      presets.appendChild(button);
    });
    shell.appendChild(presets);
    var controls = element(doc, "div", { className: "gm-controls" });
    var timeControl = element(doc, "div", { className: "gm-control" });
    var timeLabel = element(doc, "label", {}, "仿射时间 t = ");
    var timeOutput = element(doc, "output", {});
    var timeInput = element(doc, "input", { type: "range", "aria-label": "仿射时间 t" });
    timeLabel.appendChild(timeOutput);
    timeControl.appendChild(timeLabel);
    timeControl.appendChild(timeInput);
    controls.appendChild(timeControl);
    var chartControl = element(doc, "div", { className: "gm-control" });
    var chartLabel = element(doc, "label", { for: "gm-chart-" + serial }, "显示坐标图");
    var chartSelect = element(doc, "select", { id: "gm-chart-" + serial, "aria-label": "显示坐标图" });
    chartControl.appendChild(chartLabel);
    chartControl.appendChild(chartSelect);
    controls.appendChild(chartControl);
    var noteControl = element(doc, "div", { className: "gm-control" });
    noteControl.appendChild(element(doc, "span", {}, "模型说明"));
    noteControl.appendChild(element(doc, "output", { className: "gm-status", "aria-live": "polite" }, ""));
    controls.appendChild(noteControl);
    shell.appendChild(controls);
    var prediction = element(doc, "section", { className: "gm-prediction" });
    prediction.appendChild(element(doc, "strong", { className: "gm-prediction-title" }, "预测门：先区分仿射方程、能量和全局距离"));
    var questionNodes = [];
    questionNodes.push(question(doc, "affine", "1. 这条显式路径是否满足仿射测地线方程？", [{ value: "yes", label: "是" }, { value: "no", label: "否" }, { value: "unavailable", label: "坐标奇异：不可判定" }], state, renderPrediction));
    questionNodes.push(question(doc, "energy", "2. 沿仿射参数，E=½gᵢⱼvⁱvʲ 如何变化？", [{ value: "constant", label: "保持常数" }, { value: "not-constant", label: "会漂移" }], state, renderPrediction));
    questionNodes.push(question(doc, "global", "3. 当前端点之间的全局最短性？", [{ value: "minimizing", label: "全局最短" }, { value: "not-minimizing", label: "只是临界点" }, { value: "multiple", label: "最短但不唯一" }], state, renderPrediction));
    questionNodes.push(question(doc, "chart", "4. 坐标图在点上失效意味着？", [{ value: "regular", label: "图正则" }, { value: "chart-only", label: "仅坐标奇异" }], state, renderPrediction));
    questionNodes.forEach(function (node) { prediction.appendChild(node); });
    var actions = element(doc, "div", { className: "gm-actions" });
    var reveal = element(doc, "button", { type: "button", className: "gm-primary" }, "揭示账本");
    var reset = element(doc, "button", { type: "button" }, "重置本预设");
    var feedback = element(doc, "p", { className: "gm-feedback", "aria-live": "polite", "aria-atomic": "true" }, "");
    reveal.addEventListener("click", function () {
      var point = geodesicPoint(state.id, state.time, state.chart);
      var ledger = geodesicLedger(state.id, state.chart);
      var keys = Object.keys(state.answers);
      if (keys.some(function (key) { return state.answers[key] === null; })) {
        feedback.className = "gm-feedback gm-warn";
        feedback.textContent = "还有预测没有作答。";
        return;
      }
      var expected = expectedAnswers(point, ledger);
      var correct = keys.filter(function (key) { return state.answers[key] === expected[key]; }).length;
      state.revealed = true;
      feedback.className = "gm-feedback " + (correct === keys.length ? "gm-pass" : "gm-warn");
      feedback.textContent = "已揭示：命中 " + correct + "/" + keys.length + "；" + ledger.distanceNote;
      if (api && typeof api.announce === "function") api.announce(root, feedback.textContent);
      render();
    });
    reset.addEventListener("click", function () {
      var preset = presetById(state.id);
      state.chart = preset.chart;
      state.time = preset.time;
      state.answers = { affine: null, energy: null, global: null, chart: null };
      state.revealed = false;
      render();
    });
    actions.appendChild(reveal);
    actions.appendChild(reset);
    prediction.appendChild(actions);
    prediction.appendChild(feedback);
    shell.appendChild(prediction);
    var results = element(doc, "section", { className: "gm-results", hidden: true, "aria-live": "polite" });
    shell.appendChild(results);
    root.replaceChildren(shell);

    function renderPrediction() {
      reveal.disabled = Object.keys(state.answers).some(function (key) { return state.answers[key] === null; });
      questionNodes.forEach(function (fieldset) {
        var key = fieldset.getAttribute("data-answer-key");
        Array.prototype.forEach.call(fieldset.querySelectorAll("button"), function (button) {
          button.setAttribute("aria-pressed", state.answers[key] === button.getAttribute("data-answer-value") ? "true" : "false");
        });
      });
    }

    function resetGate(message) {
      state.answers = { affine: null, energy: null, global: null, chart: null };
      state.revealed = false;
      feedback.className = "gm-feedback gm-warn";
      feedback.textContent = message;
      renderPrediction();
    }

    function renderChartOptions(preset) {
      chartSelect.replaceChildren();
      chartOptions(preset.manifold).forEach(function (option) {
        chartSelect.appendChild(element(doc, "option", { value: option.value }, option.label));
      });
      chartSelect.value = state.chart;
    }

    function render() {
      var preset = presetById(state.id);
      timeInput.min = "0";
      timeInput.max = String(preset.duration);
      timeInput.step = "0.05";
      timeInput.value = String(state.time);
      timeOutput.textContent = formatNumber(state.time, 3) + " / " + formatNumber(preset.duration, 3);
      renderChartOptions(preset);
      noteControl.querySelector("output").textContent = preset.note;
      Array.prototype.forEach.call(presets.children, function (button, index) {
        button.setAttribute("aria-pressed", PRESETS[index].id === state.id ? "true" : "false");
      });
      renderPrediction();
      if (!state.revealed) {
        results.hidden = true;
        if (!feedback.textContent || feedback.className.indexOf("gm-warn") < 0) feedback.textContent = "先完成四项预测。";
        return;
      }
      results.hidden = false;
      results.replaceChildren();
      var point = geodesicPoint(state.id, state.time, state.chart);
      var ledger = geodesicLedger(state.id, state.chart);
      var labels = chartLabels(point.manifold, point.chart);
      var options = chartOptions(point.manifold);
      var otherChart = point.chart === options[0].value ? options[1].value : options[0].value;
      var transition = point.coordinates ? chartTransition(point.manifold, point.chart, otherChart, point.coordinates) : null;
      results.appendChild(element(doc, "h4", {}, preset.label + "：坐标与几何分层"));
      var metrics = element(doc, "div", { className: "gm-metrics" });
      metrics.appendChild(metricBlock(doc, "速度 |γ̇|", formatNumber(point.speed, 5)));
      metrics.appendChild(metricBlock(doc, "能量 E", formatNumber(point.energy, 5)));
      metrics.appendChild(metricBlock(doc, "测地线长度", formatNumber(ledger.geodesicLength, 5)));
      metrics.appendChild(metricBlock(doc, "全局距离", formatNumber(ledger.globalDistance, 5)));
      metrics.appendChild(metricBlock(doc, "最大方程残差", formatNumber(ledger.maxResidual, 5)));
      metrics.appendChild(metricBlock(doc, "仿射判定", point.affineStatus === "yes" ? "通过" : point.affineStatus === "unavailable" ? "不可用（坐标奇异）" : "失败"));
      metrics.appendChild(metricBlock(doc, "坐标图状态", point.chartRegular ? "正则" : "坐标奇异"));
      metrics.appendChild(metricBlock(doc, "最短性", ledger.distanceStatus === "minimizing" ? "全局最短" : ledger.distanceStatus === "antipodal" ? "最短但不唯一" : "非全局最短"));
      metrics.appendChild(metricBlock(doc, "流形状态", "正则"));
      results.appendChild(metrics);
      var stage = element(doc, "div", { className: "gm-stage" });
      stage.appendChild(geodesicSvg(doc, ledger, preset, "gm-stage-" + serial, state.time));
      results.appendChild(stage);
      var ledgerWrap = element(doc, "div", { className: "gm-ledger-wrap" });
      var table = element(doc, "table", { "aria-label": "测地线数值账本" });
      table.appendChild(element(doc, "caption", {}, "同一行同时记录坐标分量、能量与仿射方程残差。"));
      var header = element(doc, "tr");
      ["t", labels.join(", "), "|γ̇|", "E", "‖γ̈+Γ(γ̇,γ̇)‖", "仿射判定", "图状态"].forEach(function (value) {
        header.appendChild(element(doc, "th", { scope: "col" }, value));
      });
      table.appendChild(element(doc, "thead", {}, header));
      var body = element(doc, "tbody");
      ledger.rows.forEach(function (row) {
        body.appendChild(element(doc, "tr", {}, [
          element(doc, "td", {}, formatNumber(row.time, 3)),
          element(doc, "td", {}, formatCoordinates(row.coordinates)),
          element(doc, "td", {}, formatNumber(row.speed, 4)),
          element(doc, "td", {}, formatNumber(row.energy, 4)),
          element(doc, "td", {}, formatNumber(row.residual, 5)),
          element(doc, "td", {}, row.affineStatus === "yes" ? "通过" : row.affineStatus === "unavailable" ? "不可用" : "失败"),
          element(doc, "td", {}, row.chartRegular ? "正则" : "坐标奇异；流形正则")
        ]));
      });
      table.appendChild(body);
      ledgerWrap.appendChild(table);
      results.appendChild(ledgerWrap);
      var details = element(doc, "div", { className: "gm-ledger-wrap" });
      var detailTable = element(doc, "table", { "aria-label": "度量和 Christoffel 账本" });
      detailTable.appendChild(element(doc, "caption", {}, "当前 t=" + formatNumber(state.time, 3) + " 的度量张量、Christoffel 与坐标转换"));
      var detailBody = element(doc, "tbody");
      [
        ["坐标图", point.chart + " (" + labels.join(", ") + ")", point.metric ? point.metric.note : "无有限坐标"],
        ["gᵢⱼ", point.metric ? formatMatrix(point.metric.matrix) : "未定义", point.metric ? "det g=" + formatNumber(point.metric.determinant, 5) : "坐标图失效"],
        ["非零 Γ", point.christoffel ? (point.christoffel.nonzero.length ? point.christoffel.nonzero.map(function (item) { return item.component + "=" + formatNumber(item.value, 4); }).join("；") : "全为 0") : "未定义", point.christoffel ? point.christoffel.note : "坐标图失效"],
        ["当前坐标", formatCoordinates(point.coordinates), point.chartRegular ? "分量可用于方程残差" : "不要把缺坐标当成流形缺点"],
        ["转换到 " + otherChart, transition ? formatCoordinates(transition.target) : "无有限目标坐标", transition ? transition.note : "目标图在此点没有有限坐标"]
      ].forEach(function (row) {
        detailBody.appendChild(element(doc, "tr", {}, row.map(function (value) { return element(doc, "td", {}, value); })));
      });
      detailTable.appendChild(detailBody);
      details.appendChild(detailTable);
      results.appendChild(details);
      results.appendChild(element(doc, "p", { className: "gm-interpretation" }, ledger.distanceNote + " 仿射判定要求坐标残差与嵌入解析残差都通过；坐标奇异时标为不可用。仿射方程和全局最短性必须分开报告；在平面极点预设中，r=0 只让极坐标账本缺一行，笛卡尔嵌入点与能量仍然良好。"));
    }

    timeInput.addEventListener("input", function () {
      state.time = Number(timeInput.value);
      resetGate("时间改变；请重新预测最短性与坐标状态。");
      render();
    });
    chartSelect.addEventListener("change", function () {
      state.chart = chartSelect.value;
      resetGate("坐标图改变；请重新预测分量与几何是否分层。");
      render();
    });
    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    var planeCartesian = metricTensor("plane", "cartesian", [3, 4]);
    assert(planeCartesian.determinant === 1 && planeCartesian.regular, "Cartesian plane metric");
    var planePolar = metricTensor("plane", "polar", [2, 0.7]);
    assert(close(planePolar.matrix[1][1], 4) && close(planePolar.determinant, 4), "polar metric tensor");
    var polarGamma = christoffelSymbols("plane", "polar", [2, 0.7]);
    assert(close(polarGamma.symbols[0][1][1], -2) && close(polarGamma.symbols[1][0][1], 0.5), "polar Christoffel");
    var roundTrip = chartTransition("plane", "polar", "cartesian", [2, 0.7]);
    assert(close(roundTrip.embedding[0], 2 * Math.cos(0.7)) && roundTrip.targetRegular, "plane chart transition");
    var polarOrigin = metricTensor("plane", "polar", [0, 0]);
    assert(!polarOrigin.regular && polarOrigin.manifoldRegular, "polar origin is chart singular only");
    var originTransition = chartTransition("plane", "polar", "cartesian", [0, 0]);
    assert(!originTransition.sourceRegular && originTransition.targetRegular && originTransition.manifoldRegular, "origin transition preserves plane point");

    var planeLedger = geodesicLedger("plane-cartesian", "cartesian", 8);
    assert(planeLedger.affineGeodesic && planeLedger.affineVerdict === "yes" && planeLedger.energyConserved, "plane affine and energy ledger");
    assert(planeLedger.maxResidual < 1e-12 && planeLedger.distanceStatus === "minimizing", "plane residual and global minimum");
    var polarLedger = geodesicLedger("plane-polar", "polar", 8);
    assert(polarLedger.chartSingularRows >= 1 && polarLedger.affineVerdict === "unavailable" && close(polarLedger.globalDistance, polarLedger.geodesicLength), "polar path reaches coordinate origin without changing geometry");
    var polarAtOrigin = geodesicPoint("plane-polar", 1, "polar");
    assert(!polarAtOrigin.chartRegular && polarAtOrigin.affineStatus === "unavailable" && polarAtOrigin.manifoldRegular && close(polarAtOrigin.energy, 0.5), "polar coordinate singularity ledger");

    var sphereMetric = metricTensor("sphere", "spherical", [PI / 2, 0]);
    assert(close(sphereMetric.matrix[1][1], 1) && sphereMetric.regular, "equatorial sphere metric");
    var sphereGamma = christoffelSymbols("sphere", "spherical", [PI / 3, 0]);
    assert(close(sphereGamma.symbols[0][1][1], -Math.sin(PI / 3) * 0.5), "sphere Γ theta phiphi");
    assert(close(sphereGamma.symbols[1][0][1], 1 / Math.sqrt(3)), "sphere Γ phi thetaphi");
    var sphereRoundTrip = chartTransition("sphere", "spherical", "stereographic", [PI / 3, 0.4]);
    assert(sphereRoundTrip.targetRegular && close(norm(sphereRoundTrip.embedding), 1), "sphere chart transition");
    var north = chartTransition("sphere", "spherical", "stereographic", [0, 0]);
    assert(!north.targetRegular && north.manifoldRegular, "north pole absent from stereographic chart");
    var south = chartTransition("sphere", "spherical", "stereographic", [PI, 0]);
    assert(south.targetRegular && south.manifoldRegular, "south pole has finite stereographic coordinate");

    var shortPath = geodesicLedger("sphere-short", "spherical", 10);
    assert(shortPath.affineGeodesic && shortPath.affineVerdict === "yes" && shortPath.energyConserved, "short sphere affine/energy");
    assert(shortPath.maxResidual < 1e-8 && shortPath.distanceStatus === "minimizing", "short sphere equation and minimum");
    var longPath = geodesicLedger("sphere-long", "spherical", 10);
    assert(longPath.affineGeodesic && longPath.distanceStatus === "not-minimizing", "long sphere is geodesic not global minimum");
    var antipodal = geodesicLedger("sphere-antipodal", "spherical", 10);
    assert(antipodal.distanceStatus === "antipodal" && antipodal.globallyMinimizing, "antipodal multiplicity");
    var stereoPoint = geodesicPoint("sphere-short", 0.8, "stereographic");
    assert(stereoPoint.chartRegular && close(stereoPoint.energy, shortPath.initial.energy), "stereographic energy agrees");
    assert(stereoPoint.residual < 1e-7, "stereographic geodesic residual");
    PRESETS.forEach(function (preset) {
      var row = geodesicPoint(preset.id, preset.time, preset.chart);
      assert(row.manifoldRegular && finite(row.energy), preset.id + " finite manifold state");
    });
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    PRESETS: PRESETS,
    metricTensor: metricTensor,
    christoffelSymbols: christoffelSymbols,
    chartTransition: chartTransition,
    planePolarToCartesian: planePolarToCartesian,
    planeCartesianToPolar: planeCartesianToPolar,
    sphereSphericalToEmbedding: sphereSphericalToEmbedding,
    sphereEmbeddingToSpherical: sphereEmbeddingToSpherical,
    sphereSphericalToStereographic: sphereSphericalToStereographic,
    sphereStereographicToEmbedding: sphereStereographicToEmbedding,
    geodesicPoint: geodesicPoint,
    geodesicLedger: geodesicLedger,
    distanceClassification: distanceClassification,
    selfTest: selfTest,
    mount: mount
  };
});

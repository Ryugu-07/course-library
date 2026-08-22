(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("electrostatic-certificates", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("electrostatic-certificates self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("electrostatic-certificates self-test: FAIL", error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "electrostatic-certificates-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;
  var K = 1 / (4 * Math.PI);
  var PRESETS = [
    {
      id: "sphere",
      label: "球：均匀体电荷",
      kind: "spherical",
      Q: 1,
      R: 1,
      eps: 1,
      rho: 3 / (4 * Math.PI),
      fluxRadius: 1.5,
      probeRadius: 1.5,
      note: "球对称让球面上的 E 法向且大小相同，因此总通量可以恢复场强。"
    },
    {
      id: "plane",
      label: "平面：无限电荷片",
      kind: "planar",
      sigma: 1,
      eps: 1,
      pillboxArea: 1,
      fluxRadius: 1,
      probeRadius: 1,
      note: "平面对称让薄盒上下两面给出相等的法向场；电势只依赖到平面的距离。"
    },
    {
      id: "nonsymmetric",
      label: "非对称：两个点电荷",
      kind: "point-charges",
      eps: 1,
      charges: [
        { q: 1, position: [-0.55, 0, 0.15] },
        { q: -0.7, position: [0.5, 0.25, -0.1] }
      ],
      fluxRadius: 1.3,
      probeRadius: 1.3,
      note: "通量仍只由包围的总电荷决定；但没有对称性，不能把通量除以面积当作每一点的场。"
    }
  ];
  var STYLE_TEXT = [
    ".esc-lab{--esc-blue:var(--cl-blue,#315f9d);--esc-gold:var(--cl-gold,#9b6a12);--esc-green:var(--cl-green,#39734d);--esc-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg,#292722);line-height:1.55;overflow-wrap:anywhere}",
    ".esc-lab *,.esc-lab *::before,.esc-lab *::after{box-sizing:border-box}.esc-lab [hidden]{display:none!important}.esc-lab h3,.esc-lab h4{margin:0;color:var(--fg,#292722);letter-spacing:0}.esc-lab h3{font-size:1.16rem}.esc-lab p{margin:8px 0}.esc-lab .esc-note,.esc-lab .esc-feedback{color:var(--fg-soft,var(--muted,#6b6557));font-size:13px;line-height:1.65}",
    ".esc-lab button,.esc-lab input,.esc-lab select{font:inherit}.esc-lab button,.esc-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.esc-lab button:hover,.esc-lab select:hover{border-color:var(--esc-blue)}.esc-lab button:focus-visible,.esc-lab input:focus-visible,.esc-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.esc-lab button[aria-pressed=true],.esc-lab button.esc-primary{border-color:var(--esc-blue);background:var(--esc-blue);color:#fff;font-weight:750}.esc-lab .esc-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.esc-lab .esc-actions>*{flex:1 1 180px}",
    ".esc-lab .esc-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--esc-gold);background:var(--block-bg,var(--bg,#fff))}.esc-lab .esc-prediction-title{display:block;margin-bottom:9px;font-size:13px}.esc-lab fieldset{min-width:0;margin:9px 0;padding:9px 10px;border:1px solid var(--border,#d7d0c2)}.esc-lab legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.esc-lab .esc-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.esc-lab .esc-choice-grid button{font-size:12px}.esc-lab .esc-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.esc-lab .esc-pass{color:var(--esc-green)}.esc-lab .esc-warn{color:var(--esc-red)}",
    ".esc-lab .esc-reveal{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#d7d0c2)}.esc-lab .esc-presets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:10px 0}.esc-lab .esc-presets button{font-size:12px}.esc-lab .esc-controls{display:grid;grid-template-columns:minmax(180px,1fr) minmax(190px,1fr);gap:12px;align-items:end;margin:12px 0}.esc-lab .esc-control{display:grid;gap:5px;min-width:0}.esc-lab .esc-control label,.esc-lab .esc-control .esc-label{color:var(--fg-soft,var(--muted,#6b6557));font-size:12.5px;font-weight:700}.esc-lab .esc-control output{color:var(--esc-blue);font-variant-numeric:tabular-nums}.esc-lab input[type=range]{width:100%;min-width:0;min-height:44px;margin:0;accent-color:var(--esc-blue)}",
    ".esc-lab .esc-stage{min-width:0;padding:8px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);overflow:hidden}.esc-lab svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg,#292722)}.esc-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.esc-lab .esc-frame{fill:none;stroke:currentColor;stroke-width:1;stroke-opacity:.55}.esc-lab .esc-surface{fill:var(--esc-blue);fill-opacity:.08;stroke:var(--esc-blue);stroke-width:2}.esc-lab .esc-field{stroke:var(--esc-red);stroke-width:2;stroke-linecap:round}.esc-lab .esc-equipotential{fill:none;stroke:var(--esc-gold);stroke-width:1.5;stroke-dasharray:5 4}.esc-lab .esc-charge-positive{fill:var(--esc-red);stroke:#fff;stroke-width:1}.esc-lab .esc-charge-negative{fill:var(--esc-blue);stroke:#fff;stroke-width:1}.esc-lab .esc-small{font-size:11px;fill:var(--fg-soft,var(--muted,#6b6557))}.esc-lab .esc-title{font-size:13px;font-weight:750}",
    ".esc-lab .esc-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:10px 0}.esc-lab .esc-metric{min-width:0;padding:8px;border-top:2px solid var(--esc-blue);background:var(--block-bg,var(--bg,#fff))}.esc-lab .esc-metric:nth-child(2){border-color:var(--esc-red)}.esc-lab .esc-metric:nth-child(3){border-color:var(--esc-green)}.esc-lab .esc-metric:nth-child(4){border-color:var(--esc-gold)}.esc-lab .esc-metric span,.esc-lab .esc-metric small{display:block;color:var(--fg-soft,var(--muted,#6b6557));font-size:11px;line-height:1.4}.esc-lab .esc-metric strong{display:block;margin:2px 0;font-size:13px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".esc-lab .esc-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:12px}.esc-lab table{width:100%;min-width:850px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.esc-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,var(--muted,#6b6557));font-size:12px}.esc-lab th,.esc-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#d7d0c2);text-align:left;vertical-align:top}.esc-lab th{color:var(--fg-soft,var(--muted,#6b6557));font-size:11.5px}.esc-lab .esc-interpretation{margin-top:11px;padding:10px 12px;border-left:3px solid var(--esc-green);background:var(--block-bg,var(--bg,#fff));font-size:13px;line-height:1.7}",
    "@media(max-width:850px){.esc-lab .esc-presets{grid-template-columns:repeat(2,minmax(0,1fr))}.esc-lab .esc-choice-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.esc-lab .esc-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.esc-lab .esc-presets,.esc-lab .esc-choice-grid,.esc-lab .esc-controls{grid-template-columns:minmax(0,1fr)}.esc-lab .esc-stage{padding:4px}}@media(prefers-reduced-motion:reduce){.esc-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) { return typeof value === "number" && isFinite(value); }
  function near(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-8 : tolerance) * Math.max(1, Math.abs(left), Math.abs(right));
  }
  function formatNumber(value, digits) {
    if (value === null || value === undefined) return "—";
    if (!finite(value)) return "∞";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }
  function presetById(id) {
    for (var i = 0; i < PRESETS.length; i += 1) if (PRESETS[i].id === id) return PRESETS[i];
    return PRESETS[0];
  }
  function modelOf(input) {
    if (typeof input === "string") return presetById(input);
    if (input && input.id) return presetById(input.id);
    return PRESETS[0];
  }
  function vectorAdd(left, right) { return [left[0] + right[0], left[1] + right[1], left[2] + right[2]]; }
  function vectorSub(left, right) { return [left[0] - right[0], left[1] - right[1], left[2] - right[2]]; }
  function vectorScale(vector, scalar) { return [vector[0] * scalar, vector[1] * scalar, vector[2] * scalar]; }
  function vectorNorm(vector) { return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1] + vector[2] * vector[2]); }
  function vectorDot(left, right) { return left[0] * right[0] + left[1] * right[1] + left[2] * right[2]; }
  function pointOrOrigin(point) { return Array.isArray(point) && point.length >= 3 ? [Number(point[0]), Number(point[1]), Number(point[2])] : [0, 0, 0]; }
  function chargeField(charge, point, eps) {
    var displacement = vectorSub(point, charge.position);
    var distance = vectorNorm(displacement);
    if (distance < EPS) return [Infinity, Infinity, Infinity];
    return vectorScale(displacement, K * charge.q / (eps * Math.pow(distance, 3)));
  }
  function field(input, point) {
    var model = modelOf(input);
    var p = pointOrOrigin(point);
    if (model.kind === "spherical") {
      var radius = vectorNorm(p);
      if (radius < EPS) return [0, 0, 0];
      if (radius <= model.R) return vectorScale(p, model.Q / (4 * Math.PI * model.eps * Math.pow(model.R, 3)));
      return vectorScale(p, K * model.Q / (model.eps * Math.pow(radius, 3)));
    }
    if (model.kind === "planar") {
      if (Math.abs(p[2]) < EPS) return [0, 0, 0];
      return [0, 0, model.sigma / (2 * model.eps) * (p[2] > 0 ? 1 : -1)];
    }
    return model.charges.reduce(function (sum, charge) {
      return vectorAdd(sum, chargeField(charge, p, model.eps));
    }, [0, 0, 0]);
  }
  function potentialBase(input, point) {
    var model = modelOf(input);
    var p = pointOrOrigin(point);
    if (model.kind === "spherical") {
      var radius = vectorNorm(p);
      if (radius <= model.R) return K * model.Q / (model.eps * model.R) * (3 - radius * radius / (model.R * model.R)) / 2;
      return K * model.Q / (model.eps * radius);
    }
    if (model.kind === "planar") return -model.sigma * Math.abs(p[2]) / (2 * model.eps);
    return model.charges.reduce(function (sum, charge) {
      var distance = vectorNorm(vectorSub(p, charge.position));
      return distance < EPS ? Infinity : sum + K * charge.q / (model.eps * distance);
    }, 0);
  }
  function potential(input, point, gauge) {
    var constant = finite(Number(gauge)) ? Number(gauge) : 0;
    return potentialBase(input, point) + constant;
  }
  function sampleSphere(radius, latitudeSteps, longitudeSteps) {
    var points = [];
    var dTheta = Math.PI / latitudeSteps;
    var dPhi = 2 * Math.PI / longitudeSteps;
    for (var lat = 0; lat < latitudeSteps; lat += 1) {
      var theta = (lat + 0.5) * dTheta;
      var sinTheta = Math.sin(theta);
      for (var lon = 0; lon < longitudeSteps; lon += 1) {
        var phi = (lon + 0.5) * dPhi;
        var normal = [sinTheta * Math.cos(phi), sinTheta * Math.sin(phi), Math.cos(theta)];
        points.push({ point: vectorScale(normal, radius), normal: normal, area: radius * radius * sinTheta * dTheta * dPhi });
      }
    }
    return points;
  }
  function enclosedCharge(input, radius) {
    var model = modelOf(input);
    if (model.kind === "spherical") return model.Q * Math.pow(Math.min(Math.max(radius, 0), model.R) / model.R, 3);
    if (model.kind === "planar") return model.sigma * model.pillboxArea;
    return model.charges.reduce(function (sum, charge) {
      return sum + (vectorNorm(charge.position) <= radius ? charge.q : 0);
    }, 0);
  }
  function gaussFluxTruth(input, radius) {
    var model = modelOf(input);
    if (model.kind === "planar") return model.sigma * model.pillboxArea / model.eps;
    return enclosedCharge(model, radius) / model.eps;
  }
  function numericalFlux(input, radius, latitudeSteps, longitudeSteps) {
    var model = modelOf(input);
    if (model.kind === "planar") return model.sigma * model.pillboxArea / model.eps;
    return sampleSphere(radius, latitudeSteps || 18, longitudeSteps || 36).reduce(function (sum, sample) {
      return sum + vectorDot(field(model, sample.point), sample.normal) * sample.area;
    }, 0);
  }
  function fluxEvidence(input) {
    var model = modelOf(input);
    if (model.kind === "planar") {
      var planarTruth = gaussFluxTruth(model, model.fluxRadius);
      return [{ resolution: "pillbox 两面", numerical: planarTruth, truth: planarTruth, error: 0 }];
    }
    return [[8, 16], [18, 36], [28, 56]].map(function (resolution) {
      var numerical = numericalFlux(model, model.fluxRadius, resolution[0], resolution[1]);
      var truth = gaussFluxTruth(model, model.fluxRadius);
      return { resolution: resolution[0] + "×" + resolution[1], numerical: numerical, truth: truth, error: Math.abs(numerical - truth) };
    });
  }
  function fieldRecovery(input) {
    var model = modelOf(input);
    if (model.kind === "planar") {
      var planarFlux = gaussFluxTruth(model, model.fluxRadius);
      var planarMagnitude = planarFlux / (2 * model.pillboxArea);
      var planarPoint = [0, 0, model.probeRadius];
      var planarActual = field(model, planarPoint);
      var planarRecovered = [0, 0, planarMagnitude];
      return {
        valid: true,
        rule: "平面对称：通量 / (2A)",
        point: planarPoint,
        actual: planarActual,
        recovered: planarRecovered,
        error: vectorNorm(vectorSub(planarActual, planarRecovered))
      };
    }
    var radius = model.probeRadius;
    var point = [0, 0, radius];
    var truth = gaussFluxTruth(model, radius);
    var magnitude = truth / (4 * Math.PI * radius * radius);
    var actual = field(model, point);
    var recovered = [0, 0, magnitude];
    return {
      valid: model.kind === "spherical",
      rule: model.kind === "spherical" ? "球对称：通量 / (4πr²)" : "误用球对称：通量 / (4πr²)",
      point: point,
      actual: actual,
      recovered: recovered,
      error: vectorNorm(vectorSub(actual, recovered))
    };
  }
  function equipotentialCertificate(input) {
    var model = modelOf(input);
    var points = [];
    if (model.kind === "planar") {
      for (var i = -3; i <= 3; i += 1) {
        for (var j = -3; j <= 3; j += 1) points.push([i / 2, j / 2, model.probeRadius]);
      }
    } else {
      points = sampleSphere(model.probeRadius, 12, 24).map(function (sample) { return sample.point; });
    }
    var values = points.map(function (point) { return potentialBase(model, point); });
    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    return { spread: max - min, min: min, max: max, points: points.length, valid: model.kind !== "point-charges" || max - min > 1e-3 };
  }
  function finiteDifferenceLaplacian(input, point, step) {
    var model = modelOf(input);
    var h = step || 0.01;
    var center = potentialBase(model, point);
    var sum = -6 * center;
    for (var axis = 0; axis < 3; axis += 1) {
      var plus = point.slice();
      var minus = point.slice();
      plus[axis] += h;
      minus[axis] -= h;
      sum += potentialBase(model, plus) + potentialBase(model, minus);
    }
    return sum / (h * h);
  }
  function poissonCertificate(input) {
    var model = modelOf(input);
    if (model.kind === "spherical") {
      return {
        kind: "analytic",
        sourceDensity: model.rho,
        insideDivergence: model.rho / model.eps,
        outsideDivergence: 0,
        claim: "∇·E=ρ/ε 在球内，球外为 0；边界处按分片/分布解释。"
      };
    }
    if (model.kind === "planar") {
      return {
        kind: "distributional-interface",
        awayFromSheet: 0,
        normalJump: model.sigma / model.eps,
        claim: "平面两侧 Laplace=0，法向场跳跃 Eₙ(0+)-Eₙ(0-)=σ/ε。"
      };
    }
    var probe = [0, 0, 0.65];
    return {
      kind: "finite-away-from-point",
      probe: probe,
      step: 0.01,
      laplacian: finiteDifferenceLaplacian(model, probe, 0.01),
      claim: "避开点电荷的有限差分显示 Laplace≈0；点源处的 δ 贡献不是有限差分证明。"
    };
  }
  function gaugeCertificate(input, gauge) {
    var model = modelOf(input);
    var point = model.kind === "point-charges" ? [0.1, -0.2, 0.7] : [0.2, -0.15, 0.7];
    var constant = finite(Number(gauge)) ? Number(gauge) : 0.75;
    var zeroField = field(model, point);
    var shiftedField = field(model, point);
    var zeroPotential = potential(model, point, 0);
    var shiftedPotential = potential(model, point, constant);
    return {
      point: point,
      constant: constant,
      fieldDifference: vectorNorm(vectorSub(zeroField, shiftedField)),
      potentialShift: shiftedPotential - zeroPotential,
      zeroPotential: zeroPotential,
      shiftedPotential: shiftedPotential
    };
  }
  function boundaryCertificate(boundary) {
    var mode = boundary === "neumann" ? "neumann" : "dirichlet";
    return {
      boundary: mode,
      dirichlet: { constantFixed: mode === "dirichlet", statement: "给定边界电势时，规范常数被固定。" },
      neumann: { constantFixed: false, statement: "只给法向导数时，V 与 V+C 有相同 E；还差一个加法常数。" }
    };
  }
  function certificate(input) {
    var source = typeof input === "string" ? { modelId: input } : input || {};
    var model = modelOf(source.modelId || source.id);
    var flux = fluxEvidence(model);
    var recovery = fieldRecovery(model);
    var equipotential = equipotentialCertificate(model);
    var poisson = poissonCertificate(model);
    var gauge = gaugeCertificate(model, source.gauge);
    var boundary = boundaryCertificate(source.boundary);
    return {
      modelId: model.id,
      model: model,
      fluxEvidence: flux,
      fluxTruth: gaussFluxTruth(model, model.fluxRadius),
      recovery: recovery,
      equipotential: equipotential,
      poisson: poisson,
      gauge: gauge,
      boundary: boundary,
      finiteFluxError: flux[flux.length - 1].error
    };
  }

  function appendChildren(parent, doc, children) {
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      parent.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return parent;
  }
  function attrs(node, values) {
    Object.keys(values || {}).forEach(function (key) {
      var value = values[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }
  function element(doc, tag, values, children) { return appendChildren(attrs(doc.createElement(tag), values), doc, children); }
  function svgElement(doc, tag, values, children) { return appendChildren(attrs(doc.createElementNS(SVG_NS, tag), values), doc, children); }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }
  function metric(doc, label, value, note) {
    return element(doc, "div", { className: "esc-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value }), element(doc, "small", { text: note })]);
  }
  function svgLine(doc, x1, y1, x2, y2, className, markerEnd) {
    return svgElement(doc, "line", { x1: x1, y1: y1, x2: x2, y2: y2, className: className, "marker-end": markerEnd });
  }
  function chart(doc, result, prefix) {
    var model = result.model;
    var svg = svgElement(doc, "svg", { viewBox: "0 0 720 300", role: "img", "aria-labelledby": prefix + "-title " + prefix + "-desc" });
    svg.appendChild(svgElement(doc, "title", { id: prefix + "-title" }, "静电学 Gauss、Poisson 与等势证书"));
    svg.appendChild(svgElement(doc, "desc", { id: prefix + "-desc" }, "左侧是当前源模型和代表性电场方向，右侧是等势采样与证书解释；颜色和数值只表示有限模型证据。"));
    var defs = svgElement(doc, "defs");
    var marker = svgElement(doc, "marker", { id: prefix + "-arrow", viewBox: "0 0 10 10", refX: "8", refY: "5", markerWidth: "6", markerHeight: "6", orient: "auto-start-reverse" });
    marker.appendChild(svgElement(doc, "path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "var(--esc-red)" }));
    defs.appendChild(marker);
    svg.appendChild(defs);
    var left = 48, top = 48, width = 294, height = 190;
    svg.appendChild(svgElement(doc, "rect", { x: left, y: top, width: width, height: height, className: "esc-frame" }));
    if (model.kind === "spherical") {
      var cx = left + width / 2, cy = top + height / 2, radius = 58;
      svg.appendChild(svgElement(doc, "circle", { cx: cx, cy: cy, r: radius, className: "esc-surface" }));
      svg.appendChild(svgElement(doc, "circle", { cx: cx, cy: cy, r: 82, className: "esc-equipotential" }));
      for (var i = 0; i < 12; i += 1) {
        var angle = i * 2 * Math.PI / 12;
        svg.appendChild(svgLine(doc, cx + Math.cos(angle) * 64, cy + Math.sin(angle) * 64, cx + Math.cos(angle) * 89, cy + Math.sin(angle) * 89, "esc-field", "url(#" + prefix + "-arrow)"));
      }
      svg.appendChild(svgElement(doc, "text", { x: left + 10, y: top + 20, className: "esc-title" }, "球面高斯面 / 球对称 E"));
    } else if (model.kind === "planar") {
      var planeY = top + height / 2;
      svg.appendChild(svgElement(doc, "line", { x1: left + 16, y1: planeY, x2: left + width - 16, y2: planeY, className: "esc-surface" }));
      for (var row = 0; row < 4; row += 1) {
        var yTop = top + 28 + row * 30;
        var yBottom = top + height - 28 - row * 30;
        svg.appendChild(svgLine(doc, left + 42, yTop, left + 42, yTop - 18, "esc-field", "url(#" + prefix + "-arrow)"));
        svg.appendChild(svgLine(doc, left + 42, yBottom, left + 42, yBottom + 18, "esc-field", "url(#" + prefix + "-arrow)"));
      }
      svg.appendChild(svgElement(doc, "line", { x1: left + 34, y1: planeY - 2, x2: left + width - 34, y2: planeY - 2, className: "esc-equipotential" }));
      svg.appendChild(svgElement(doc, "text", { x: left + 10, y: top + 20, className: "esc-title" }, "薄片 / pillbox 上下两面"));
    } else {
      var scale = 190;
      model.charges.forEach(function (charge) {
        var x = left + width / 2 + charge.position[0] * scale;
        var y = top + height / 2 - charge.position[1] * scale;
        svg.appendChild(svgElement(doc, "circle", { cx: x, cy: y, r: 7, className: charge.q > 0 ? "esc-charge-positive" : "esc-charge-negative" }));
        svg.appendChild(svgElement(doc, "text", { x: x + 10, y: y + 4, className: "esc-small" }, charge.q > 0 ? "+q" : "−q"));
      });
      for (var ray = 0; ray < 10; ray += 1) {
        var angleRay = ray * 2 * Math.PI / 10;
        var startX = left + width / 2 + Math.cos(angleRay) * 36;
        var startY = top + height / 2 - Math.sin(angleRay) * 36;
        var endX = left + width / 2 + Math.cos(angleRay) * 112;
        var endY = top + height / 2 - Math.sin(angleRay) * 112;
        svg.appendChild(svgLine(doc, startX, startY, endX, endY, "esc-field", "url(#" + prefix + "-arrow)"));
      }
      svg.appendChild(svgElement(doc, "circle", { cx: left + width / 2, cy: top + height / 2, r: 112, className: "esc-equipotential" }));
      svg.appendChild(svgElement(doc, "text", { x: left + 10, y: top + 20, className: "esc-title" }, "非对称点源 / 球面只给总通量"));
    }
    var right = 390, rightWidth = 282, rightHeight = 190;
    svg.appendChild(svgElement(doc, "rect", { x: right, y: top, width: rightWidth, height: rightHeight, className: "esc-frame" }));
    svg.appendChild(svgElement(doc, "text", { x: right + 12, y: top + 22, className: "esc-title" }, "证书读法"));
    var textLines = [
      "Gauss 通量真值 = " + formatNumber(result.fluxTruth, 5),
      "最后一档通量误差 = " + formatNumber(result.finiteFluxError, 5),
      "场恢复误差 = " + formatNumber(result.recovery.error, 5),
      "等势采样 spread = " + formatNumber(result.equipotential.spread, 5),
      result.poisson.kind === "analytic" ? "Poisson：解析分片" : result.poisson.kind === "distributional-interface" ? "Poisson：界面跳跃" : "Poisson：避开点源的有限差分"
    ];
    textLines.forEach(function (line, index) {
      svg.appendChild(svgElement(doc, "text", { x: right + 12, y: top + 52 + index * 25, className: index === 0 ? "esc-title" : "esc-small" }, line));
    });
    svg.appendChild(svgElement(doc, "text", { x: left, y: 267, className: "esc-small" }, "红：E 方向；金虚线：代表性等势面；有限读数不替代定理条件"));
    return svg;
  }
  function tableFor(doc, result) {
    var table = element(doc, "table");
    table.appendChild(element(doc, "caption", { text: "Gauss / Poisson / 等势 / 规范证书；数值误差只对应当前采样" }));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, ["证书", "读数", "理论参照", "证据等级"].map(function (text) { return element(doc, "th", { text: text }); }))));
    var body = element(doc, "tbody");
    result.fluxEvidence.forEach(function (row) {
      body.appendChild(element(doc, "tr", {}, [
        "通量 · " + row.resolution,
        formatNumber(row.numerical, 6),
        formatNumber(row.truth, 6),
        "有限采样 / pillbox"
      ].map(function (text) { return element(doc, "td", { text: text }); })));
    });
    var rows = [
      ["对称性场恢复", formatNumber(result.recovery.error, 6), result.recovery.valid ? "应为 0" : "不应由通量单独推出", result.recovery.valid ? "模型内核对" : "反例证据"],
      ["等势面 spread", formatNumber(result.equipotential.spread, 6), result.model.kind === "point-charges" ? "一般不为 0" : "应为 0", "采样证据"],
      ["Poisson", result.poisson.kind === "analytic" ? "ρ/ε 分片" : result.poisson.kind === "distributional-interface" ? "跳跃 " + formatNumber(result.poisson.normalJump, 5) : formatNumber(result.poisson.laplacian, 6), "由 ∇·E=ρ/ε 或分布边界项", result.poisson.kind === "finite-away-from-point" ? "有限差分" : "解析/分布"],
      ["规范常数", "ΔE=" + formatNumber(result.gauge.fieldDifference, 6) + "，ΔV=" + formatNumber(result.gauge.potentialShift, 5), result.boundary.boundary === "dirichlet" ? "Dirichlet 固定 C" : "Neumann 留 C 自由", "代入核对"]
    ];
    rows.forEach(function (row) {
      body.appendChild(element(doc, "tr", {}, row.map(function (text) { return element(doc, "td", { text: text }); })));
    });
    table.appendChild(body);
    return table;
  }
  function interpretation(result) {
    if (result.model.kind === "spherical") return "球对称同时提供等势球面与恒定法向场，所以 Gauss 通量可以恢复 E；Dirichlet 边界会固定 V 的加法常数。";
    if (result.model.kind === "planar") return "平面对称把通量分到 pillbox 的两面，且平行面是等势面；平面上的源使 Poisson 方程出现法向跳跃。";
    return "非对称点源仍严格满足通量真值，但球面上 E 不恒定；把总通量除以面积当作局部场是超出 Gauss 定律的误用。点源的 δ 只在分布意义下恢复。";
  }
  function mount(root, api) {
    if (!root || !root.ownerDocument || root.getAttribute("data-esc-mounted") === "true") return;
    root.setAttribute("data-esc-mounted", "true");
    var doc = root.ownerDocument;
    installStyles(doc);
    INSTANCE += 1;
    var prefix = "esc-" + INSTANCE;
    var state = { modelId: "sphere", gauge: 0, boundary: "dirichlet", revealed: false, predictions: [null, null, null] };
    var shell = element(doc, "div", { className: "esc-lab" });
    shell.appendChild(element(doc, "h3", { text: "静电学证书：通量、场、等势与规范" }));
    shell.appendChild(element(doc, "p", { className: "esc-note", text: "先判断 Gauss 面能证明什么，再揭示三类源数据的通量、Poisson 与边界证书。有限采样不替代对称性和 PDE 定理。" }));
    var prediction = element(doc, "div", { className: "esc-prediction" });
    prediction.appendChild(element(doc, "strong", { className: "esc-prediction-title", text: "预测门：完成三项后揭晓" }));
    var questions = [
      { prompt: "1. Gauss 定律的总通量真值是否需要球对称？", choices: [["no", "不需要；只由包围电荷决定"], ["yes", "需要；否则通量也不成立"], ["field", "只要 E 处处相同"]], expected: "no" },
      { prompt: "2. 非对称点电荷的总通量能否直接恢复球面每一点的 E？", choices: [["no", "不能；缺少把 E 提出积分号的对称性"], ["yes", "能，除以球面积即可"], ["plane", "只能恢复平面场"]], expected: "no" },
      { prompt: "3. V→V+C 会改变 E 吗？Neumann 边界是否固定 C？", choices: [["gauge", "E 不变；Neumann 只确定到常数"], ["both", "E 改变且 C 固定"], ["dirichlet", "只有 Dirichlet 不固定 C"]], expected: "gauge" }
    ];
    var choices = [];
    questions.forEach(function (question, questionIndex) {
      var fieldset = element(doc, "fieldset");
      fieldset.appendChild(element(doc, "legend", { text: question.prompt }));
      var group = element(doc, "div", { className: "esc-choice-grid", role: "group", "aria-label": question.prompt });
      question.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" });
        button.addEventListener("click", function () { state.predictions[questionIndex] = choice[0]; renderPrediction(); });
        choices.push({ index: questionIndex, value: choice[0], node: button });
        group.appendChild(button);
      });
      fieldset.appendChild(group);
      prediction.appendChild(fieldset);
    });
    var actions = element(doc, "div", { className: "esc-actions" });
    var revealButton = element(doc, "button", { type: "button", className: "esc-primary", text: "核对预测并揭晓" });
    var resetButton = element(doc, "button", { type: "button", text: "重置" });
    actions.appendChild(revealButton);
    actions.appendChild(resetButton);
    prediction.appendChild(actions);
    var feedback = element(doc, "p", { className: "esc-feedback", role: "status", "aria-live": "polite", text: "请完成三项预测。" });
    prediction.appendChild(feedback);
    shell.appendChild(prediction);

    var reveal = element(doc, "section", { className: "esc-reveal", hidden: true, "aria-label": "静电学证书揭晓结果" });
    reveal.appendChild(element(doc, "h4", { text: "源模型、规范常数与边界类型" }));
    var presetRow = element(doc, "div", { className: "esc-presets", role: "group", "aria-label": "静电源模型预设" });
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = element(doc, "button", { type: "button", text: preset.label, "aria-pressed": "false" });
      button.addEventListener("click", function () { state.modelId = preset.id; render(); });
      presetButtons.push({ id: preset.id, node: button });
      presetRow.appendChild(button);
    });
    reveal.appendChild(presetRow);
    var controls = element(doc, "div", { className: "esc-controls" });
    var gaugeId = prefix + "-gauge";
    var gaugeOutput = element(doc, "output", { for: gaugeId, text: "0" });
    var gaugeLabel = element(doc, "label", { htmlFor: gaugeId });
    gaugeLabel.appendChild(doc.createTextNode("显示的规范常数 C："));
    gaugeLabel.appendChild(gaugeOutput);
    var gaugeInput = element(doc, "input", { id: gaugeId, type: "range", min: "-1", max: "1", step: "0.25", value: "0", "aria-label": "电势规范常数" });
    gaugeInput.addEventListener("input", function () { state.gauge = Number(gaugeInput.value); render(); });
    controls.appendChild(element(doc, "div", { className: "esc-control" }, [gaugeLabel, gaugeInput]));
    var boundaryId = prefix + "-boundary";
    var boundaryLabel = element(doc, "label", { htmlFor: boundaryId, text: "边界条件解释：" });
    var boundarySelect = element(doc, "select", { id: boundaryId, "aria-label": "边界条件类型" }, [
      element(doc, "option", { value: "dirichlet", text: "Dirichlet：给定 V" }),
      element(doc, "option", { value: "neumann", text: "Neumann：给定法向导数" })
    ]);
    boundarySelect.addEventListener("change", function () { state.boundary = boundarySelect.value; render(); });
    controls.appendChild(element(doc, "div", { className: "esc-control" }, [boundaryLabel, boundarySelect]));
    reveal.appendChild(controls);
    reveal.appendChild(element(doc, "p", { className: "esc-note", text: "改变 C 只改变 V 的零点；选择 Neumann 时，表格会明确显示解还可整体平移。" }));
    var stage = element(doc, "div", { className: "esc-stage" });
    var metrics = element(doc, "div", { className: "esc-metrics", "aria-label": "静电学证书读数" });
    var chartHolder = element(doc, "div");
    var tableHolder = element(doc, "div", { className: "esc-table-wrap" });
    var status = element(doc, "p", { className: "esc-interpretation", role: "status", "aria-live": "polite" });
    stage.appendChild(metrics);
    stage.appendChild(chartHolder);
    stage.appendChild(tableHolder);
    stage.appendChild(status);
    reveal.appendChild(stage);
    shell.appendChild(reveal);
    clear(root);
    root.appendChild(shell);

    function announce(message) { if (api && typeof api.announce === "function") api.announce(root, message); }
    function renderPrediction() {
      choices.forEach(function (item) { item.node.setAttribute("aria-pressed", state.predictions[item.index] === item.value ? "true" : "false"); });
    }
    function render() {
      var result = certificate(state);
      gaugeInput.value = String(state.gauge);
      gaugeOutput.textContent = formatNumber(state.gauge, 2);
      boundarySelect.value = state.boundary;
      presetButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", item.id === state.modelId ? "true" : "false"); });
      reveal.hidden = !state.revealed;
      if (!state.revealed) return;
      clear(metrics);
      metrics.appendChild(metric(doc, "通量真值", formatNumber(result.fluxTruth, 5), "Qenc / ε"));
      metrics.appendChild(metric(doc, "最后采样误差", formatNumber(result.finiteFluxError, 5), "有限球面 / pillbox"));
      metrics.appendChild(metric(doc, "场恢复误差", formatNumber(result.recovery.error, 5), result.recovery.valid ? "对称性适用" : "对称性不适用"));
      metrics.appendChild(metric(doc, "等势 spread", formatNumber(result.equipotential.spread, 5), "采样的 max−min"));
      clear(chartHolder);
      chartHolder.appendChild(chart(doc, result, prefix));
      clear(tableHolder);
      tableHolder.appendChild(tableFor(doc, result));
      status.textContent = interpretation(result);
    }
    revealButton.addEventListener("click", function () {
      var missing = state.predictions.filter(function (value) { return value === null; }).length;
      if (missing) {
        feedback.className = "esc-feedback esc-warn";
        feedback.textContent = "还差 " + missing + " 项预测。";
        announce(feedback.textContent);
        return;
      }
      var score = questions.reduce(function (sum, question, index) { return sum + (question.expected === state.predictions[index] ? 1 : 0); }, 0);
      state.revealed = true;
      feedback.className = "esc-feedback " + (score === 3 ? "esc-pass" : "esc-warn");
      feedback.textContent = "预测 " + score + "/3。现在比较通量真值、场恢复条件、等势面和规范自由。";
      render();
      announce(feedback.textContent);
    });
    resetButton.addEventListener("click", function () {
      state = { modelId: "sphere", gauge: 0, boundary: "dirichlet", revealed: false, predictions: [null, null, null] };
      feedback.className = "esc-feedback";
      feedback.textContent = "预测已重置，请重新作答。";
      renderPrediction();
      render();
      announce(feedback.textContent);
    });
    renderPrediction();
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      if (!condition) throw new Error("electrostatic-certificates self-test: " + message);
    }
    var sphere = certificate({ modelId: "sphere", boundary: "dirichlet", gauge: 0.75 });
    check(near(sphere.fluxTruth, 1), "sphere Gauss truth");
    check(sphere.finiteFluxError < 0.002, "sphere numerical flux");
    check(sphere.recovery.valid && sphere.recovery.error < 1e-10, "sphere symmetry recovery");
    check(sphere.equipotential.spread < 1e-10, "sphere equipotential");
    check(near(sphere.poisson.insideDivergence, sphere.poisson.sourceDensity), "sphere Poisson source");
    var plane = certificate({ modelId: "plane", boundary: "neumann" });
    check(near(plane.fluxTruth, 1) && plane.finiteFluxError < EPS, "plane pillbox flux");
    check(near(plane.poisson.normalJump, 1), "plane interface jump");
    check(plane.equipotential.spread < EPS, "plane equipotential");
    var nonsymmetric = certificate({ modelId: "nonsymmetric", boundary: "dirichlet" });
    check(Math.abs(nonsymmetric.fluxTruth - 0.3) < EPS, "nonsymmetric enclosed charge");
    check(nonsymmetric.finiteFluxError < 0.01, "nonsymmetric numerical flux");
    check(!nonsymmetric.recovery.valid && nonsymmetric.recovery.error > 0.01, "symmetry counterexample");
    check(nonsymmetric.equipotential.spread > 0.01, "nonsymmetric equipotential spread");
    check(Math.abs(nonsymmetric.poisson.laplacian) < 0.01, "finite away-from-point Poisson evidence");
    check(sphere.gauge.fieldDifference < EPS && near(sphere.gauge.potentialShift, 0.75), "gauge constant");
    check(plane.boundary.neumann.constantFixed === false && sphere.boundary.dirichlet.constantFixed === true, "boundary uniqueness labels");
    check(JSON.stringify(certificate({ modelId: "nonsymmetric", gauge: 0.25 })) === JSON.stringify(certificate({ modelId: "nonsymmetric", gauge: 0.25 })), "deterministic certificate");
    PRESETS.forEach(function (preset) { check(certificate({ modelId: preset.id }).modelId === preset.id, preset.id + " preset"); });
    return { checks: checks, presets: PRESETS.length, deterministic: true };
  }
  return {
    PRESETS: PRESETS,
    field: field,
    potentialBase: potentialBase,
    potential: potential,
    numericalFlux: numericalFlux,
    gaussFluxTruth: gaussFluxTruth,
    equipotentialCertificate: equipotentialCertificate,
    poissonCertificate: poissonCertificate,
    gaugeCertificate: gaugeCertificate,
    fieldRecovery: fieldRecovery,
    certificate: certificate,
    mount: mount,
    selfTest: selfTest
  };
});

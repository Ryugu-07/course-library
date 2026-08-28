(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("physics-lattice-monte-carlo", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("physics-lattice-monte-carlo self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("physics-lattice-monte-carlo self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var LAB_ID = "physics-lattice-monte-carlo";
  var STYLE_ID = "physics-lattice-monte-carlo-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var DEFAULTS = { L: 10, temperature: 2.3, burn: 250, sweeps: 1000, every: 2, seed: 20260827 };

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-9 : tolerance) * scale;
  }

  function finite(value, name) {
    var number = Number(value);
    if (!isFinite(number)) throw new RangeError(name + " must be finite");
    return number;
  }

  function integer(value, name, minimum, maximum) {
    var number = finite(value, name);
    if (Math.floor(number) !== number || number < minimum || number > maximum) throw new RangeError(name + " must be an integer in range");
    return number;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function normalize(options) {
    options = options || {};
    return {
      L: integer(options.L === undefined ? DEFAULTS.L : options.L, "L", 4, 24),
      temperature: clamp(finite(options.temperature === undefined ? DEFAULTS.temperature : options.temperature, "temperature"), 0.5, 5),
      burn: integer(options.burn === undefined ? DEFAULTS.burn : options.burn, "burn", 0, 5000),
      sweeps: integer(options.sweeps === undefined ? DEFAULTS.sweeps : options.sweeps, "sweeps", 40, 5000),
      every: integer(options.every === undefined ? DEFAULTS.every : options.every, "every", 1, 25),
      seed: integer(options.seed === undefined ? DEFAULTS.seed : options.seed, "seed", 1, 2147483647)
    };
  }

  function makeRng(seed) {
    var state = (seed >>> 0) || 1;
    return function () {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return (state >>> 0) / 4294967296;
    };
  }

  function at(spins, L, x, y) {
    return spins[(y + L) % L * L + (x + L) % L];
  }

  function deltaEnergy(spins, L, index) {
    var x = index % L;
    var y = Math.floor(index / L);
    var neighbourSum = at(spins, L, x - 1, y) + at(spins, L, x + 1, y) + at(spins, L, x, y - 1) + at(spins, L, x, y + 1);
    return 2 * spins[index] * neighbourSum;
  }

  function energyPerSpin(spins, L) {
    var energy = 0;
    for (var y = 0; y < L; y += 1) {
      for (var x = 0; x < L; x += 1) {
        var spin = at(spins, L, x, y);
        energy -= spin * (at(spins, L, x + 1, y) + at(spins, L, x, y + 1));
      }
    }
    return energy / (L * L);
  }

  function signedMagnetization(spins) {
    return spins.reduce(function (total, spin) { return total + spin; }, 0) / spins.length;
  }

  function magnetization(spins) {
    return Math.abs(signedMagnetization(spins));
  }

  function statistics(values) {
    var count = values.length;
    if (!count) return { n: 0, mean: NaN, variance: NaN, sd: NaN, se: NaN, lag1: NaN, tauInt: NaN, nEff: 0, autocorrelation: [] };
    var mean = values.reduce(function (sum, value) { return sum + value; }, 0) / count;
    var centered = values.map(function (value) { return value - mean; });
    var sumSquares = centered.reduce(function (sum, value) { return sum + value * value; }, 0);
    var variance = count > 1 ? sumSquares / (count - 1) : 0;
    var correlations = [];
    var maxLag = Math.min(60, count - 1);
    for (var lag = 0; lag <= maxLag; lag += 1) {
      var covariance = 0;
      for (var index = 0; index < count - lag; index += 1) covariance += centered[index] * centered[index + lag];
      correlations.push(sumSquares > 0 ? covariance / sumSquares : (lag === 0 ? 1 : 0));
    }
    var tauInt = 0.5;
    for (var correlationIndex = 1; correlationIndex < correlations.length; correlationIndex += 1) {
      if (!(correlations[correlationIndex] > 0)) break;
      tauInt += correlations[correlationIndex];
    }
    return {
      n: count,
      mean: mean,
      variance: variance,
      sd: Math.sqrt(Math.max(0, variance)),
      se: Math.sqrt(Math.max(0, variance) / Math.max(1, count / Math.max(1, 2 * tauInt))),
      lag1: correlations.length > 1 ? correlations[1] : NaN,
      tauInt: tauInt,
      nEff: count / Math.max(1, 2 * tauInt),
      autocorrelation: correlations
    };
  }

  function simulate(options) {
    var config = normalize(options);
    var L = config.L;
    var size = L * L;
    var rng = makeRng(config.seed);
    var spins = Array.from({ length: size }, function () { return rng() < 0.5 ? -1 : 1; });
    var accepted = 0;
    var attempted = 0;
    var energies = [];
    var signedMagnetizations = [];
    var magnetizations = [];
    var totalSweeps = config.burn + config.sweeps;
    for (var sweep = 0; sweep < totalSweeps; sweep += 1) {
      for (var attempt = 0; attempt < size; attempt += 1) {
        var index = Math.floor(rng() * size);
        var change = deltaEnergy(spins, L, index);
        attempted += 1;
        if (change <= 0 || rng() < Math.exp(-change / config.temperature)) {
          spins[index] *= -1;
          accepted += 1;
        }
      }
      if (sweep >= config.burn && (sweep - config.burn) % config.every === 0) {
        energies.push(energyPerSpin(spins, L));
        var signed = signedMagnetization(spins);
        signedMagnetizations.push(signed);
        magnetizations.push(Math.abs(signed));
      }
    }
    var energyStats = statistics(energies);
    var signedMagnetizationStats = statistics(signedMagnetizations);
    var magnetizationStats = statistics(magnetizations);
    return {
      config: config,
      spins: spins,
      energies: energies,
      signedMagnetizations: signedMagnetizations,
      magnetizations: magnetizations,
      energy: energyStats,
      signedMagnetization: signedMagnetizationStats,
      magnetization: magnetizationStats,
      acceptance: attempted ? accepted / attempted : 0,
      attempted: attempted,
      accepted: accepted
    };
  }

  function finiteSizeStudy(options) {
    var config = normalize(options);
    var sizes = [4, 6, 8, 10, 12];
    var burn = config.burn;
    var sweeps = config.sweeps;
    var rows = sizes.map(function (L, index) {
      var result = simulate({ L: L, temperature: config.temperature, burn: burn, sweeps: sweeps, every: config.every, seed: config.seed + 97 * (index + 1) });
      return { L: L, mean: result.magnetization.mean, meanAbs: result.magnetization.mean, signedMean: result.signedMagnetization.mean, se: result.magnetization.se, tauInt: result.magnetization.tauInt, nEff: result.magnetization.nEff, signedTauInt: result.signedMagnetization.tauInt, signedNEff: result.signedMagnetization.nEff, acceptance: result.acceptance };
    });
    return { rows: rows, burn: burn, sweeps: sweeps, every: config.every };
  }

  function format(value, digits) {
    if (!isFinite(value)) return "-";
    var places = digits === undefined ? 3 : digits;
    if (value !== 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) return value.toExponential(Math.min(places, 5));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", value);
      else if (key === "text") node.textContent = String(value);
      else node.setAttribute(key, value === true ? "" : String(value));
    });
    (children || []).forEach(function (child) {
      if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function svgElement(doc, tag, attrs, text) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value !== undefined && value !== null) node.setAttribute(key === "className" ? "class" : key, String(value));
    });
    if (text !== undefined) node.textContent = String(text);
    return node;
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function installStyles(doc) {
    if (!doc || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--plmc-blue:#2563a6;--plmc-green:#18734a;--plmc-orange:#b45309;--plmc-red:#a33b2f;--plmc-spin-plus:#2563a6;--plmc-spin-minus:#d6dbe3;max-width:100%;min-width:0;color:var(--fg,inherit);line-height:1.55}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}' +
      '[data-learning-lab="' + LAB_ID + '"] h3,[data-learning-lab="' + LAB_ID + '"] h4{margin:0;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .plmc-note,[data-learning-lab="' + LAB_ID + '"] .plmc-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{margin:11px 0;padding:10px 12px;border:1px solid var(--border,currentColor);border-radius:6px}' +
      '[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;line-height:1.5}' +
      '[data-learning-lab="' + LAB_ID + '"] .plmc-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}' +
      '[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input{min-width:0;min-height:44px;font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{padding:8px 12px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas);color:inherit;cursor:pointer;line-height:1.35}' +
      '[data-learning-lab="' + LAB_ID + '"] button:hover,[data-learning-lab="' + LAB_ID + '"] button:focus-visible{border-color:var(--plmc-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] button[aria-pressed=true],[data-learning-lab="' + LAB_ID + '"] .plmc-primary{background:var(--plmc-blue);border-color:var(--plmc-blue);color:#fff;font-weight:700}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + LAB_ID + '"] .plmc-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.plmc-actions>*{flex:1 1 170px}' +
      '[data-learning-lab="' + LAB_ID + '"] .plmc-feedback{min-height:2em;margin:7px 0;font-weight:700}.plmc-pass{color:var(--plmc-green)}.plmc-warn{color:var(--plmc-red)}' +
      '[data-learning-lab="' + LAB_ID + '"] .plmc-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:15px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] .plmc-control{display:grid;gap:5px;min-width:0}.plmc-control label{font-size:13px;font-weight:700}.plmc-control output{color:var(--plmc-blue);font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;accent-color:var(--plmc-blue)}' +
      '[data-learning-lab="' + LAB_ID + '"] .plmc-revealed{margin-top:18px;padding-top:15px;border-top:1px solid var(--border,currentColor)}' +
      '[data-learning-lab="' + LAB_ID + '"] .plmc-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin:12px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] .plmc-metric{min-width:0;padding:9px;border-top:3px solid var(--plmc-blue);background:var(--bg,Canvas)}.plmc-metric:nth-child(2){border-top-color:var(--plmc-green)}.plmc-metric:nth-child(3){border-top-color:var(--plmc-orange)}.plmc-metric:nth-child(4){border-top-color:var(--plmc-red)}.plmc-metric:nth-child(5){border-top-color:var(--plmc-green)}' +
      '[data-learning-lab="' + LAB_ID + '"] .plmc-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}.plmc-metric strong{display:block;margin-top:3px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + LAB_ID + '"] .plmc-chart-frame{min-width:0;max-width:100%;overflow-x:auto;overflow-y:hidden;padding:6px;border:1px solid var(--border,currentColor);border-radius:6px;background:var(--bg,Canvas)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;color:var(--fg,inherit)}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0;fill:currentColor;font-size:12px}' +
      '[data-learning-lab="' + LAB_ID + '"] .plmc-axis{stroke:currentColor;stroke-opacity:.68}.plmc-grid-line{stroke:var(--border,currentColor);stroke-opacity:.65}.plmc-energy{fill:none;stroke:var(--plmc-orange);stroke-width:2}.plmc-magnetization{fill:none;stroke:var(--plmc-blue);stroke-width:2}.plmc-autocorrelation{fill:none;stroke:var(--plmc-green);stroke-width:2.5}.plmc-study{fill:none;stroke:var(--plmc-red);stroke-width:2.5}.plmc-chart-title{font-size:13px;font-weight:700}.plmc-chart-muted{fill:var(--fg-soft,currentColor);font-size:11px}' +
      '[data-learning-lab="' + LAB_ID + '"] .plmc-table-wrap{max-width:100%;overflow-x:auto;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:570px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,currentColor);text-align:left;white-space:nowrap}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}' +
      'html[data-theme="dark"] [data-learning-lab="' + LAB_ID + '"]{--plmc-blue:#82b6ff;--plmc-green:#79d39a;--plmc-orange:#f0b15a;--plmc-red:#ff9f91;--plmc-spin-plus:#82b6ff;--plmc-spin-minus:#343b48}' +
      '@media(max-width:720px){[data-learning-lab="' + LAB_ID + '"] .plmc-controls{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + LAB_ID + '"] .plmc-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){[data-learning-lab="' + LAB_ID + '"] .plmc-chart-frame svg{min-width:760px}[data-learning-lab="' + LAB_ID + '"] .plmc-chart-frame svg text{font-size:22px}[data-learning-lab="' + LAB_ID + '"] .plmc-chart-frame svg .plmc-chart-title{font-size:20px}[data-learning-lab="' + LAB_ID + '"] .plmc-chart-frame svg .plmc-chart-muted{font-size:18px}}@media(max-width:560px){[data-learning-lab="' + LAB_ID + '"] .plmc-choice-grid,[data-learning-lab="' + LAB_ID + '"] .plmc-controls{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }

  function linePath(values, xMap, yMap) {
    return values.map(function (value, index) { return (index ? "L" : "M") + xMap(index).toFixed(2) + " " + yMap(value).toFixed(2); }).join(" ");
  }

  function drawDashboard(doc, svg, result, study) {
    clear(svg);
    svg.setAttribute("viewBox", "0 0 920 610");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "二维 Ising Monte Carlo 的轨迹、自相关、有限尺寸与最终格点");
    svg.appendChild(svgElement(doc, "title", {}, "格点蒙特卡洛诊断"));
    svg.appendChild(svgElement(doc, "desc", {}, "左上是能量和绝对磁化轨迹，右上是绝对磁化自相关，左下是有限尺寸研究，右下是最终自旋构型。"));
    var panels = [
      { x: 18, y: 18, w: 430, h: 260 },
      { x: 470, y: 18, w: 430, h: 260 },
      { x: 18, y: 316, w: 430, h: 260 },
      { x: 470, y: 316, w: 430, h: 260 }
    ];
    panels.forEach(function (panel) { svg.appendChild(svgElement(doc, "rect", { x: panel.x, y: panel.y, width: panel.w, height: panel.h, fill: "none", stroke: "var(--border,currentColor)", "stroke-width": 1 })); });
    var left = panels[0].x + 42;
    var right = panels[0].x + panels[0].w - 16;
    var top = panels[0].y + 36;
    var bottom = panels[0].y + panels[0].h - 35;
    var xTrace = function (index) { return left + (right - left) * index / Math.max(1, result.energies.length - 1); };
    var yEnergy = function (value) { return bottom - (bottom - top) * (value + 2) / 4; };
    var yMag = function (value) { return bottom - (bottom - top) * value; };
    svg.appendChild(svgElement(doc, "text", { x: panels[0].x + 14, y: panels[0].y + 23, className: "plmc-chart-title" }, "轨迹：e（橙）与 |m|（蓝）"));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, className: "plmc-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, className: "plmc-axis" }));
    svg.appendChild(svgElement(doc, "path", { d: linePath(result.energies, xTrace, yEnergy), className: "plmc-energy" }));
    svg.appendChild(svgElement(doc, "path", { d: linePath(result.magnetizations, xTrace, yMag), className: "plmc-magnetization" }));
    svg.appendChild(svgElement(doc, "text", { x: right, y: bottom + 22, className: "plmc-chart-muted", "text-anchor": "end" }, "测量序号"));
    svg.appendChild(svgElement(doc, "text", { x: left - 7, y: top + 4, className: "plmc-chart-muted", "text-anchor": "end" }, "e=2"));
    svg.appendChild(svgElement(doc, "text", { x: left - 7, y: bottom + 4, className: "plmc-chart-muted", "text-anchor": "end" }, "e=−2"));
    var acLeft = panels[1].x + 42;
    var acRight = panels[1].x + panels[1].w - 16;
    var acTop = panels[1].y + 36;
    var acBottom = panels[1].y + panels[1].h - 35;
    var correlations = result.magnetization.autocorrelation;
    var xAc = function (index) { return acLeft + (acRight - acLeft) * index / Math.max(1, correlations.length - 1); };
    var yAc = function (value) { return acBottom - (acBottom - acTop) * (value + 1) / 2; };
    svg.appendChild(svgElement(doc, "text", { x: panels[1].x + 14, y: panels[1].y + 23, className: "plmc-chart-title" }, "|m| 自相关 ρ(k)；τ_int(|m|)=" + format(result.magnetization.tauInt, 2)));
    svg.appendChild(svgElement(doc, "line", { x1: acLeft, y1: yAc(0), x2: acRight, y2: yAc(0), className: "plmc-grid-line" }));
    svg.appendChild(svgElement(doc, "line", { x1: acLeft, y1: acBottom, x2: acRight, y2: acBottom, className: "plmc-axis" }));
    svg.appendChild(svgElement(doc, "path", { d: linePath(correlations, xAc, yAc), className: "plmc-autocorrelation" }));
    svg.appendChild(svgElement(doc, "text", { x: acRight, y: acBottom + 22, className: "plmc-chart-muted", "text-anchor": "end" }, "lag k"));
    svg.appendChild(svgElement(doc, "text", { x: acLeft - 7, y: acTop + 4, className: "plmc-chart-muted", "text-anchor": "end" }, "1"));
    svg.appendChild(svgElement(doc, "text", { x: acLeft - 7, y: yAc(0) + 4, className: "plmc-chart-muted", "text-anchor": "end" }, "0"));
    var studyLeft = panels[2].x + 42;
    var studyRight = panels[2].x + panels[2].w - 16;
    var studyTop = panels[2].y + 36;
    var studyBottom = panels[2].y + panels[2].h - 35;
    var maxM = Math.max(1, Math.max.apply(null, study.rows.map(function (row) { return row.mean + row.se; })) * 1.15);
    var xStudy = function (value) { return studyLeft + (studyRight - studyLeft) * (value - 4) / 8; };
    var yStudy = function (value) { return studyBottom - (studyBottom - studyTop) * value / maxM; };
    svg.appendChild(svgElement(doc, "text", { x: panels[2].x + 14, y: panels[2].y + 23, className: "plmc-chart-title" }, "有限尺寸收敛：〈|m|〉 ± SE"));
    svg.appendChild(svgElement(doc, "line", { x1: studyLeft, y1: studyBottom, x2: studyRight, y2: studyBottom, className: "plmc-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: studyLeft, y1: studyTop, x2: studyLeft, y2: studyBottom, className: "plmc-axis" }));
    svg.appendChild(svgElement(doc, "path", { d: study.rows.map(function (row, index) { return (index ? "L" : "M") + xStudy(row.L).toFixed(2) + " " + yStudy(row.mean).toFixed(2); }).join(" "), className: "plmc-study" }));
    study.rows.forEach(function (row) {
      var xPoint = xStudy(row.L);
      svg.appendChild(svgElement(doc, "line", { x1: xPoint, y1: yStudy(row.mean - row.se), x2: xPoint, y2: yStudy(row.mean + row.se), stroke: "var(--plmc-red)", "stroke-width": 1.5 }));
      svg.appendChild(svgElement(doc, "circle", { cx: xPoint, cy: yStudy(row.mean), r: 4, fill: "var(--plmc-red)" }));
      svg.appendChild(svgElement(doc, "text", { x: xPoint, y: studyBottom + 19, className: "plmc-chart-muted", "text-anchor": "middle" }, String(row.L)));
    });
    svg.appendChild(svgElement(doc, "text", { x: studyRight, y: studyBottom + 37, className: "plmc-chart-muted", "text-anchor": "end" }, "L"));
    var latticePanel = panels[3];
    svg.appendChild(svgElement(doc, "text", { x: latticePanel.x + 14, y: latticePanel.y + 23, className: "plmc-chart-title" }, "最终构型（周期边界）"));
    var gridSize = Math.min(210, latticePanel.w - 70);
    var cell = gridSize / result.config.L;
    var gridX = latticePanel.x + 26;
    var gridY = latticePanel.y + 38;
    result.spins.forEach(function (spin, index) {
      var xCell = index % result.config.L;
      var yCell = Math.floor(index / result.config.L);
      svg.appendChild(svgElement(doc, "rect", { x: gridX + xCell * cell, y: gridY + yCell * cell, width: Math.max(1, cell - 0.7), height: Math.max(1, cell - 0.7), fill: spin > 0 ? "var(--plmc-spin-plus)" : "var(--plmc-spin-minus)", stroke: "var(--bg,Canvas)", "stroke-width": 0.5 }));
    });
    svg.appendChild(svgElement(doc, "text", { x: latticePanel.x + 250, y: latticePanel.y + 80, className: "plmc-chart-muted" }, "+1 / −1"));
    svg.appendChild(svgElement(doc, "text", { x: latticePanel.x + 250, y: latticePanel.y + 104, className: "plmc-chart-muted" }, "〈|m|〉=" + format(result.magnetization.mean, 3)));
    svg.appendChild(svgElement(doc, "text", { x: latticePanel.x + 250, y: latticePanel.y + 128, className: "plmc-chart-muted" }, "〈m〉=" + format(result.signedMagnetization.mean, 3)));
    svg.appendChild(svgElement(doc, "text", { x: latticePanel.x + 250, y: latticePanel.y + 152, className: "plmc-chart-muted" }, "seed=" + result.config.seed));
  }

  function metric(doc, label, value) {
    return element(doc, "div", { className: "plmc-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]);
  }

  function renderTable(doc, hostNode, study) {
    clear(hostNode);
    var table = element(doc, "table", {});
    table.appendChild(element(doc, "caption", { text: "每个 L 都重新热化；表中 SE、τ_int 和 N_eff 都针对绝对磁化 |m|；本次使用 burn=" + study.burn + "、sweeps=" + study.sweeps + "、每 " + study.every + " 个 sweep 测量一次。" }));
    var head = element(doc, "tr", {});
    ["L", "〈|m|〉", "〈m〉", "SE(|m|)", "τ_int(|m|)", "N_eff(|m|)", "接受率"].forEach(function (label) { head.appendChild(element(doc, "th", { scope: "col", text: label })); });
    table.appendChild(element(doc, "thead", {}, [head]));
    var body = element(doc, "tbody", {});
    study.rows.forEach(function (row) {
      body.appendChild(element(doc, "tr", {}, [
        element(doc, "td", { text: String(row.L) }),
        element(doc, "td", { text: format(row.mean, 4) }),
        element(doc, "td", { text: format(row.signedMean, 4) }),
        element(doc, "td", { text: format(row.se, 4) }),
        element(doc, "td", { text: format(row.tauInt, 2) }),
        element(doc, "td", { text: format(row.nEff, 1) }),
        element(doc, "td", { text: format(row.acceptance, 3) })
      ]));
    });
    table.appendChild(body);
    hostNode.appendChild(table);
  }

  function mount(rootNode, api) {
    var doc = rootNode && rootNode.ownerDocument;
    if (!doc) return;
    installStyles(doc);
    var prefix = "plmc-" + Math.floor(Math.random() * 1000000);
    var state = { revealed: false, predictions: {}, config: { L: DEFAULTS.L, temperature: DEFAULTS.temperature, burn: DEFAULTS.burn, sweeps: DEFAULTS.sweeps, every: DEFAULTS.every, seed: DEFAULTS.seed } };
    var questions = [
      { key: "acceptance", prompt: "在固定提议下，升高温度通常会怎样影响 Metropolis 接受率？", answer: "higher", choices: [{ value: "higher", label: "通常升高" }, { value: "lower", label: "通常降低" }, { value: "same", label: "严格不变" }] },
      { key: "independent", prompt: "满足细致平衡是否意味着相邻样本独立？", answer: "no", choices: [{ value: "yes", label: "是，自动独立" }, { value: "no", label: "否，仍可能相关" }, { value: "unknown", label: "只看接受率" }] },
      { key: "critical", prompt: "靠近二维 Ising 临界温度时，最需要警惕什么？", answer: "slow", choices: [{ value: "slow", label: "临界慢化与长自相关" }, { value: "none", label: "所有样本更独立" }, { value: "zero", label: "磁化严格为零" }] },
      { key: "seed", prompt: "固定随机种子最直接保证什么？", answer: "replay", choices: [{ value: "replay", label: "同一实现可重放" }, { value: "independent", label: "样本变独立" }, { value: "truth", label: "消除有限尺寸误差" }] }
    ];
    var gate = element(doc, "section", { className: "plmc-gate", "aria-labelledby": prefix + "-gate-title" });
    gate.appendChild(element(doc, "h3", { id: prefix + "-gate-title", text: "预测门：接受率不是采样质量的全部" }));
    gate.appendChild(element(doc, "p", { className: "plmc-note", text: "先作四个统计物理预测；提交后才显示轨迹、自相关、有效样本和有限尺寸研究。" }));
    questions.forEach(function (question) {
      var field = element(doc, "fieldset", {});
      field.appendChild(element(doc, "legend", { text: question.prompt }));
      var choices = element(doc, "div", { className: "plmc-choice-grid", role: "group", "aria-label": question.prompt });
      question.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice.label });
        button.addEventListener("click", function () { state.predictions[question.key] = choice.value; question.choices.forEach(function (item) { item.button.setAttribute("aria-pressed", item === choice ? "true" : "false"); }); });
        choice.button = button;
        choices.appendChild(button);
      });
      field.appendChild(choices);
      gate.appendChild(field);
    });
    var actions = element(doc, "div", { className: "plmc-actions" });
    var reveal = element(doc, "button", { type: "button", className: "plmc-primary", text: "提交预测并揭示" });
    var reset = element(doc, "button", { type: "button", text: "重置" });
    actions.appendChild(reveal);
    actions.appendChild(reset);
    gate.appendChild(actions);
    var feedback = element(doc, "p", { className: "plmc-feedback", "aria-live": "polite", text: "" });
    gate.appendChild(feedback);

    var stage = element(doc, "section", { className: "plmc-revealed", hidden: true, "aria-labelledby": prefix + "-result-title" });
    stage.appendChild(element(doc, "h4", { id: prefix + "-result-title", text: "揭示实验：从构型到有效样本" }));
    stage.appendChild(element(doc, "p", { className: "plmc-note", text: "J=1、周期边界、单点翻转；温度以 J/k_B 为单位。主统计量是绝对磁化 |m|，同时报告 signed m；有限尺寸研究沿用当前请求的 burn、sweeps 和测量间隔。" }));
    var controls = element(doc, "div", { className: "plmc-controls" });
    function rangeControl(label, key, min, max, stepSize, digits) {
      var output = element(doc, "output", { text: format(state.config[key], digits) });
      var input = element(doc, "input", { type: "range", min: String(min), max: String(max), step: String(stepSize), value: String(state.config[key]), "aria-label": label });
      input.addEventListener("input", function () { state.config[key] = Number(input.value); output.textContent = format(state.config[key], digits); });
      return element(doc, "div", { className: "plmc-control" }, [element(doc, "label", {}, [label + " = ", output]), input]);
    }
    controls.appendChild(rangeControl("边长 L", "L", 4, 24, 2, 0));
    controls.appendChild(rangeControl("温度 T/J", "temperature", 0.5, 5, 0.05, 2));
    controls.appendChild(rangeControl("测量 sweep", "sweeps", 300, 1800, 100, 0));
    var run = element(doc, "button", { type: "button", className: "plmc-primary", text: "重跑采样" });
    controls.appendChild(element(doc, "div", { className: "plmc-control" }, [element(doc, "label", { text: "固定种子 " + DEFAULTS.seed }), run]));
    stage.appendChild(controls);
    var metrics = element(doc, "div", { className: "plmc-metrics", "aria-label": "蒙特卡洛诊断" });
    stage.appendChild(metrics);
    var frame = element(doc, "div", { className: "plmc-chart-frame" });
    var chart = svgElement(doc, "svg", {});
    frame.appendChild(chart);
    stage.appendChild(frame);
    var tableHost = element(doc, "div", { className: "plmc-table-wrap" });
    stage.appendChild(tableHost);
    rootNode.replaceChildren(gate, stage);

    function renderResult() {
      var result = simulate(state.config);
      var study = finiteSizeStudy(state.config);
      metrics.replaceChildren(
        metric(doc, "〈e〉", format(result.energy.mean, 4)),
        metric(doc, "〈|m|〉", format(result.magnetization.mean, 4)),
        metric(doc, "〈m〉", format(result.signedMagnetization.mean, 4)),
        metric(doc, "接受率", format(result.acceptance, 3)),
        metric(doc, "τ_int(|m|)", format(result.magnetization.tauInt, 2)),
        metric(doc, "N_eff(|m|)", format(result.magnetization.nEff, 1))
      );
      drawDashboard(doc, chart, result, study);
      renderTable(doc, tableHost, study);
      return result;
    }

    reveal.addEventListener("click", function () {
      var missing = questions.filter(function (question) { return !state.predictions[question.key]; });
      if (missing.length) { feedback.textContent = "请先完成四个预测。"; feedback.className = "plmc-feedback plmc-warn"; return; }
      state.revealed = true;
      stage.hidden = false;
      var result = renderResult();
      var correct = questions.filter(function (question) { return state.predictions[question.key] === question.answer; }).length;
      feedback.textContent = "已揭示：" + correct + "/" + questions.length + " 个预测命中；当前 |m| 原始测量 " + result.magnetization.n + " 个，有效样本约 " + format(result.magnetization.nEff, 1) + " 个。";
      feedback.className = "plmc-feedback " + (correct === questions.length ? "plmc-pass" : "plmc-warn");
      announce(api, rootNode, feedback.textContent);
    });
    run.addEventListener("click", function () { if (state.revealed) { var result = renderResult(); announce(api, rootNode, "采样已重跑；|m| 有效样本约 " + format(result.magnetization.nEff, 1) + "。"); } });
    reset.addEventListener("click", function () {
      state.revealed = false;
      state.predictions = {};
      state.config = { L: DEFAULTS.L, temperature: DEFAULTS.temperature, burn: DEFAULTS.burn, sweeps: DEFAULTS.sweeps, every: DEFAULTS.every, seed: DEFAULTS.seed };
      controls.querySelectorAll("input[type=range]").forEach(function (input) { var label = input.getAttribute("aria-label"); var key = label === "边长 L" ? "L" : label === "温度 T/J" ? "temperature" : "sweeps"; input.value = String(state.config[key]); var output = input.parentNode.querySelector("output"); if (output) output.textContent = format(state.config[key], key === "temperature" ? 2 : 0); });
      stage.hidden = true;
      feedback.textContent = "已重置；答案与采样证据再次隐藏。";
      feedback.className = "plmc-feedback";
      questions.forEach(function (question) { question.choices.forEach(function (choice) { choice.button.setAttribute("aria-pressed", "false"); }); });
      announce(api, rootNode, "格点蒙特卡洛预测与实验已重置。");
    });
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var allPlus = Array(16).fill(1);
    var allMinus = Array(16).fill(-1);
    var checkerboard = Array.from({ length: 16 }, function (_, index) { return (Math.floor(index / 4) + index % 4) % 2 === 0 ? 1 : -1; });
    check(deltaEnergy(allPlus, 4, 0) === 8, "periodic all-plus flip cost");
    check(near(energyPerSpin(allPlus, 4), -2, 1e-12) && near(energyPerSpin(allMinus, 4), -2, 1e-12), "exact ferromagnetic small-lattice energy");
    check(near(energyPerSpin(checkerboard, 4), 2, 1e-12), "exact checkerboard small-lattice energy");
    var oneFlip = allPlus.slice();
    oneFlip[0] = -1;
    check(near(16 * (energyPerSpin(oneFlip, 4) - energyPerSpin(allPlus, 4)), deltaEnergy(allPlus, 4, 0), 1e-12), "flip energy invariant");
    var first = simulate({ L: 6, temperature: 2.3, burn: 20, sweeps: 100, every: 2, seed: 12345 });
    var second = simulate({ L: 6, temperature: 2.3, burn: 20, sweeps: 100, every: 2, seed: 12345 });
    check(JSON.stringify(first) === JSON.stringify(second), "seeded chain is reproducible");
    check(first.signedMagnetizations.length === first.magnetizations.length && first.magnetizations.every(function (value, index) { return near(value, Math.abs(first.signedMagnetizations[index]), 1e-12); }), "signed and absolute magnetization observables agree");
    check(first.acceptance > 0 && first.acceptance < 1, "acceptance is a probability");
    check(first.energy.mean >= -2 && first.energy.mean <= 2, "energy per spin range");
    check(first.magnetization.mean >= 0 && first.magnetization.mean <= 1, "absolute magnetization range");
    check(first.magnetization.tauInt >= 0.5, "integrated autocorrelation is defined");
    check(first.magnetization.nEff <= first.magnetization.n, "effective samples do not exceed raw samples");
    var study = finiteSizeStudy({ L: 10, temperature: 2.3, burn: 181, sweeps: 601, every: 2, seed: 12345 });
    check(study.rows.length === 5 && study.rows[0].L === 4 && study.rows[4].L === 12, "finite-size ladder");
    check(study.burn === 181 && study.sweeps === 601 && study.every === 2, "finite-size study honors requested budget");
    check(study.rows.every(function (row) { return row.nEff > 0 && row.se >= 0; }), "finite-size uncertainty rows");
    var highTemperature = simulate({ L: 6, temperature: 4, burn: 20, sweeps: 100, every: 2, seed: 12345 });
    check(highTemperature.acceptance > 0, "high-temperature chain moves");
    var known = statistics([1, 2, 3, 4]);
    check(known.mean === 2.5 && near(known.variance, 1.6666666666666667, 1e-12), "basic statistics");
    check(near(known.lag1, 0.25, 1e-12) && near(known.tauInt, 0.75, 1e-12), "autocorrelation estimator");
    return { checks: checks };
  }

  return {
    LAB_ID: LAB_ID,
    DEFAULTS: DEFAULTS,
    deltaEnergy: deltaEnergy,
    energyPerSpin: energyPerSpin,
    signedMagnetization: signedMagnetization,
    magnetization: magnetization,
    statistics: statistics,
    simulate: simulate,
    finiteSizeStudy: finiteSizeStudy,
    mount: mount,
    selfTest: selfTest
  };
});

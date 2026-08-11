(function () {
  "use strict";

  if (
    typeof window === "undefined" ||
    !window.CourseLearning ||
    typeof window.CourseLearning.register !== "function"
  ) {
    return;
  }

  var SVG_NS = "http://www.w3.org/2000/svg";
  var EPSILON = 1e-7;
  var ROOT_TOLERANCE = 1e-9;
  var ALLOWED_TOLERANCE = 2e-7;
  var PLOT_MIN = 2;
  var SAMPLE_MIN = 2.0001;
  var DEFAULT_PRESET = "bound";
  var SERIAL = 0;
  var VIEW = {
    width: 900,
    height: 510,
    left: 74,
    right: 34,
    top: 42,
    bottom: 72
  };
  var PLOT_WIDTH = VIEW.width - VIEW.left - VIEW.right;
  var PLOT_HEIGHT = VIEW.height - VIEW.top - VIEW.bottom;
  var PRESET_ORDER = ["noBarrier", "isco", "bound", "highAngular"];
  var PRESETS = {
    noBarrier: {
      label: "无势垒",
      ell: 2.5,
      energy: 1.05,
      note: "ℓ²<12：没有圆轨道极值。"
    },
    isco: {
      label: "ISCO",
      ell: Math.sqrt(12),
      energy: Math.sqrt(8 / 9),
      note: "ℓ²=12：两支在 r=6 合并，边缘稳定。"
    },
    bound: {
      label: "束缚轨道",
      ell: 4,
      energy: 0.975,
      note: "ℓ²=16：外支稳定势阱与有限允许区。"
    },
    highAngular: {
      label: "高角动量",
      ell: 6.5,
      energy: 1.02,
      note: "ℓ²=42.25：r−=3.25、r+=39。"
    }
  };

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function appendChildren(node, children, doc) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function makeElement(doc, tag, attrs, children) {
    return appendChildren(setAttributes(doc.createElement(tag), attrs), children, doc);
  }

  function makeSvg(doc, tag, attrs, children) {
    return appendChildren(
      setAttributes(doc.createElementNS(SVG_NS, tag), attrs),
      children,
      doc
    );
  }

  function clear(node) {
    if (!node) return;
    if (typeof node.replaceChildren === "function") {
      node.replaceChildren();
      return;
    }
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function formatNumber(api, value, digits) {
    if (api && typeof api.format === "function") return api.format(value, digits);
    if (!Number.isFinite(value)) return "−";
    var places = digits === undefined ? 3 : digits;
    var text = value.toFixed(places);
    if (text.indexOf(".") >= 0) {
      text = text.replace(/0+$/, "").replace(/\.$/, "");
    }
    return text === "-0" ? "0" : text;
  }

  function potential(r, ellSquared) {
    return -1 / r + ellSquared / (2 * r * r) - ellSquared / (r * r * r);
  }

  function circularEnergy(r) {
    var denominator = 1 - 3 / r;
    if (denominator <= 0) return NaN;
    return Math.sqrt(((1 - 2 / r) * (1 - 2 / r)) / denominator);
  }

  function secondDerivative(r, ellSquared) {
    return -2 / (r * r * r) +
      3 * ellSquared / (r * r * r * r) -
      12 * ellSquared / (r * r * r * r * r);
  }

  function circularOrbits(ell) {
    var ellSquared = ell * ell;
    if (ellSquared < 12 - EPSILON) return [];
    var discriminant = Math.max(0, ellSquared * (ellSquared - 12));
    var separation = Math.sqrt(discriminant);
    if (Math.abs(ellSquared - 12) <= EPSILON) {
      return [{
        r: 6,
        label: "ISCO",
        type: "isco",
        stability: "marginal",
        energy: Math.sqrt(8 / 9),
        level: potential(6, ellSquared),
        curvature: secondDerivative(6, ellSquared)
      }];
    }
    var inner = (ellSquared - separation) / 2;
    var outer = (ellSquared + separation) / 2;
    return [
      {
        r: inner,
        label: "r−",
        type: "unstable",
        stability: "不稳定",
        energy: circularEnergy(inner),
        level: potential(inner, ellSquared),
        curvature: secondDerivative(inner, ellSquared)
      },
      {
        r: outer,
        label: "r+",
        type: "stable",
        stability: "稳定",
        energy: circularEnergy(outer),
        level: potential(outer, ellSquared),
        curvature: secondDerivative(outer, ellSquared)
      }
    ];
  }

  function radialGap(r, ellSquared, level) {
    return level - potential(r, ellSquared);
  }

  function uniqueSorted(values) {
    var result = [];
    values
      .filter(function (value) { return Number.isFinite(value); })
      .sort(function (left, right) { return left - right; })
      .forEach(function (value) {
        if (!result.length || Math.abs(value - result[result.length - 1]) > 2e-5) {
          result.push(value);
        }
      });
    return result;
  }

  function bisectRoot(left, right, leftValue, rightValue, ellSquared, level) {
    var a = left;
    var b = right;
    var fa = leftValue;
    var fb = rightValue;
    for (var iteration = 0; iteration < 90; iteration += 1) {
      var middle = (a + b) / 2;
      var fm = radialGap(middle, ellSquared, level);
      if (fm === 0 || Math.abs(b - a) <= 1e-9) {
        return middle;
      }
      if (fa * fm <= 0) {
        b = middle;
        fb = fm;
      } else {
        a = middle;
        fa = fm;
      }
    }
    return (a + b) / 2;
  }

  function findTurningPoints(ell, level, domainMax, orbits) {
    var ellSquared = ell * ell;
    var cuts = [SAMPLE_MIN, domainMax];
    orbits.forEach(function (orbit) {
      if (orbit.r > SAMPLE_MIN && orbit.r < domainMax) cuts.push(orbit.r);
    });
    cuts = uniqueSorted(cuts);
    var roots = [];

    function addRoot(value) {
      if (value > SAMPLE_MIN - 1e-6 && value < domainMax + 1e-6) {
        roots.push(clamp(value, SAMPLE_MIN, domainMax));
      }
    }

    for (var index = 0; index < cuts.length - 1; index += 1) {
      var left = cuts[index];
      var right = cuts[index + 1];
      var leftValue = radialGap(left, ellSquared, level);
      var rightValue = radialGap(right, ellSquared, level);
      var leftIsRoot = Math.abs(leftValue) <= ROOT_TOLERANCE;
      var rightIsRoot = Math.abs(rightValue) <= ROOT_TOLERANCE;
      if (leftIsRoot) addRoot(left);
      if (rightIsRoot) addRoot(right);
      if (!leftIsRoot && !rightIsRoot && leftValue * rightValue < 0) {
        addRoot(bisectRoot(left, right, leftValue, rightValue, ellSquared, level));
      }
    }
    return uniqueSorted(roots);
  }

  function domainMaximum(level, orbits) {
    var maximum = 24;
    if (orbits.length) {
      maximum = Math.max(maximum, orbits[orbits.length - 1].r * 1.18);
    }
    if (level < -0.004) {
      maximum = Math.max(maximum, Math.min(72, 1.3 / Math.abs(level)));
    }
    return clamp(maximum, 24, 72);
  }

  function allowedIntervals(ell, level, domainMax, roots) {
    var ellSquared = ell * ell;
    var bounds = [SAMPLE_MIN].concat(roots, [domainMax]);
    var intervals = [];
    for (var index = 0; index < bounds.length - 1; index += 1) {
      var left = bounds[index];
      var right = bounds[index + 1];
      if (right - left < 1e-5) continue;
      var middle = (left + right) / 2;
      if (radialGap(middle, ellSquared, level) >= -ALLOWED_TOLERANCE) {
        intervals.push({ left: left, right: right });
      }
    }
    return intervals;
  }

  function intervalText(api, interval, domainMax) {
    var left = interval.left <= SAMPLE_MIN + 0.001
      ? "2+"
      : formatNumber(api, interval.left, 3);
    var right = interval.right >= domainMax - 0.001
      ? formatNumber(api, domainMax, 2) + "（图窗边界）"
      : formatNumber(api, interval.right, 3);
    return "[" + left + ", " + right + "]";
  }

  function niceStep(range, count) {
    var raw = range / count;
    if (!(raw > 0)) return 1;
    var power = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var fraction = raw / power;
    var unit = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
    return unit * power;
  }

  function ticks(minimum, maximum, count) {
    var step = niceStep(maximum - minimum, count);
    var first = Math.ceil(minimum / step - 1e-9) * step;
    var values = [];
    for (var value = first; value <= maximum + step * 0.25 && values.length < 40; value += step) {
      values.push(Math.abs(value) < step * 1e-8 ? 0 : value);
    }
    return values;
  }

  function xScale(r, domainMax) {
    return VIEW.left + (r - PLOT_MIN) / (domainMax - PLOT_MIN) * PLOT_WIDTH;
  }

  function yScale(value, yDomain) {
    return VIEW.top + (yDomain.maximum - value) /
      (yDomain.maximum - yDomain.minimum) * PLOT_HEIGHT;
  }

  function pathFor(values, domainMax, yDomain) {
    var pieces = [];
    values.forEach(function (item, index) {
      pieces.push((index ? "L" : "M") + xScale(item.r, domainMax).toFixed(2) + "," +
        yScale(item.value, yDomain).toFixed(2));
    });
    return pieces.join(" ");
  }

  function derive(state) {
    var ellSquared = state.ell * state.ell;
    var level = (state.energy * state.energy - 1) / 2;
    var orbits = circularOrbits(state.ell);
    var domainMax = domainMaximum(level, orbits);
    var turningPoints = findTurningPoints(state.ell, level, domainMax, orbits);
    var intervals = allowedIntervals(state.ell, level, domainMax, turningPoints);
    var samples = [];
    var minimum = Math.min(0, level);
    var maximum = Math.max(0, level);
    var sampleCount = 560;
    for (var index = 0; index <= sampleCount; index += 1) {
      var r = SAMPLE_MIN + (domainMax - SAMPLE_MIN) * index / sampleCount;
      var value = potential(r, ellSquared);
      samples.push({ r: r, value: value });
      minimum = Math.min(minimum, value);
      maximum = Math.max(maximum, value);
    }
    orbits.forEach(function (orbit) {
      minimum = Math.min(minimum, orbit.level);
      maximum = Math.max(maximum, orbit.level);
    });
    var padding = Math.max(0.035, (maximum - minimum) * 0.13);
    var yDomain = {
      minimum: minimum - padding,
      maximum: maximum + padding
    };
    var shape;
    if (ellSquared < 12 - EPSILON) {
      shape = "无势垒：ℓ²<12 时没有圆轨道极值。";
    } else if (Math.abs(ellSquared - 12) <= EPSILON) {
      shape = "临界势形：r=6 为 ISCO，二阶曲率为 0。";
    } else {
      shape = "有势垒：r− 为不稳定极大值，r+ 为稳定极小值。";
    }
    return {
      ellSquared: ellSquared,
      level: level,
      orbits: orbits,
      domainMax: domainMax,
      turningPoints: turningPoints,
      intervals: intervals,
      samples: samples,
      yDomain: yDomain,
      shape: shape
    };
  }

  function injectStyles(doc) {
    if (doc.querySelector && doc.querySelector("style[data-cl-schwarzschild-style]")) return;
    var style = doc.createElement("style");
    style.setAttribute("data-cl-schwarzschild-style", "true");
    style.textContent = [
      ".cl-schwarzschild-lab { --sch-bg: var(--bg, #fffdf8); --sch-panel: var(--block-bg, #f2f5f7); --sch-fg: var(--fg, #222b33); --sch-muted: var(--fg-soft, #586572); --sch-border: var(--border, #c9d2da); --sch-accent: var(--cl-blue, #1f5f96); --sch-energy: #a85b00; --sch-stable: #147a4b; --sch-unstable: #b4382e; --sch-reference: #714a99; --sch-allowed: #9bc9a6; color: var(--sch-fg); background: var(--sch-bg); font-size: .95em; line-height: 1.5; max-width: 100%; }",
      "html[data-theme=\"dark\"] .cl-schwarzschild-lab { --sch-bg: #111820; --sch-panel: #1c2731; --sch-fg: #edf3f8; --sch-muted: #b6c3ce; --sch-border: #526272; --sch-accent: #8bc8ff; --sch-energy: #ffc26b; --sch-stable: #78d39d; --sch-unstable: #ff9287; --sch-reference: #d6a9ff; --sch-allowed: #316342; }",
      ".cl-schwarzschild-lab *, .cl-schwarzschild-lab *::before, .cl-schwarzschild-lab *::after { box-sizing: border-box; }",
      ".cl-schwarzschild-heading { margin: 0 0 .25rem; color: var(--sch-accent); font-size: 1.25rem; }",
      ".cl-schwarzschild-intro, .cl-schwarzschild-note, .cl-schwarzschild-status, .cl-schwarzschild-small { color: var(--sch-muted); }",
      ".cl-schwarzschild-intro { margin: 0 0 1rem; }",
      ".cl-schwarzschild-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; align-items: start; width: 100%; }",
      ".cl-schwarzschild-controls { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; min-width: 0; width: 100%; }",
      ".cl-schwarzschild-controls > * { min-width: 0; }",
      ".cl-schwarzschild-fieldset { min-width: 0; margin: 0; padding: 12px; border: 1px solid var(--sch-border); border-radius: 7px; background: var(--sch-panel); }",
      ".cl-schwarzschild-fieldset legend { max-width: 100%; padding: 0 5px; color: var(--sch-muted); font-weight: 700; }",
      ".cl-schwarzschild-preset-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; }",
      ".cl-schwarzschild-action-row { display: grid; gap: 8px; align-content: start; }",
      ".cl-schwarzschild-button, .cl-schwarzschild-select { min-width: 0; min-height: 44px; padding: 8px 10px; border: 1px solid var(--sch-border); border-radius: 6px; background: var(--sch-bg); color: inherit; cursor: pointer; font: inherit; line-height: 1.3; overflow-wrap: anywhere; }",
      ".cl-schwarzschild-button:hover:not(:disabled), .cl-schwarzschild-select:hover { border-color: var(--sch-accent); }",
      ".cl-schwarzschild-button[aria-pressed=\"true\"], .cl-schwarzschild-primary { border-color: var(--sch-accent); background: var(--sch-accent); color: var(--sch-bg); font-weight: 750; }",
      ".cl-schwarzschild-button:focus-visible, .cl-schwarzschild-select:focus-visible, .cl-schwarzschild-range:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
      ".cl-schwarzschild-button:disabled { cursor: not-allowed; opacity: .55; }",
      ".cl-schwarzschild-field { display: grid; gap: 5px; margin-top: 10px; }",
      ".cl-schwarzschild-field:first-child { margin-top: 0; }",
      ".cl-schwarzschild-field-caption { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 7px; color: var(--sch-muted); font-size: .9em; font-weight: 700; }",
      ".cl-schwarzschild-output { color: var(--sch-accent); font-variant-numeric: tabular-nums; }",
      ".cl-schwarzschild-range { display: block; width: 100%; min-height: 44px; margin: 0; accent-color: var(--sch-accent); }",
      ".cl-schwarzschild-small { margin: .35rem 0 0; font-size: .84em; }",
      ".cl-schwarzschild-stage { min-width: 0; width: 100%; }",
      ".cl-schwarzschild-stage-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 7px; }",
      ".cl-schwarzschild-stage-title { color: var(--sch-muted); font-size: .9em; }",
      ".cl-schwarzschild-formula { margin: 0 0 9px; padding: 8px 10px; border-left: 3px solid var(--sch-accent); background: var(--sch-panel); color: var(--sch-fg); overflow-wrap: anywhere; }",
      ".cl-schwarzschild-svg-scroll { width: 100%; max-width: 100%; overflow: hidden; border: 1px solid var(--sch-border); border-radius: 7px; background: var(--sch-bg); -webkit-overflow-scrolling: touch; }",
      ".cl-schwarzschild-svg { display: block; width: 100%; max-width: 100%; height: auto; color: var(--sch-fg); }",
      ".cl-schwarzschild-svg text { fill: currentColor; font-family: inherit; letter-spacing: 0; }",
      ".cl-schwarzschild-chart-bg { fill: var(--sch-bg); }",
      ".cl-schwarzschild-grid-line { stroke: var(--sch-border); stroke-width: 1; opacity: .52; }",
      ".cl-schwarzschild-axis { stroke: var(--sch-fg); stroke-width: 1.5; }",
      ".cl-schwarzschild-tick { fill: var(--sch-muted) !important; font-size: 12px; }",
      ".cl-schwarzschild-axis-label { fill: var(--sch-muted) !important; font-size: 13px; font-weight: 700; }",
      ".cl-schwarzschild-potential { fill: none; stroke: var(--sch-accent); stroke-width: 3; stroke-linejoin: round; stroke-linecap: round; }",
      ".cl-schwarzschild-energy { stroke: var(--sch-energy); stroke-width: 2.5; stroke-dasharray: 8 5; }",
      ".cl-schwarzschild-zero { stroke: var(--sch-muted); stroke-width: 1.3; stroke-dasharray: 3 4; opacity: .8; }",
      ".cl-schwarzschild-allowed { fill: var(--sch-allowed); opacity: .22; }",
      ".cl-schwarzschild-turning-guide { stroke: var(--sch-energy); stroke-width: 1.4; stroke-dasharray: 3 4; opacity: .9; }",
      ".cl-schwarzschild-turning-point { fill: var(--sch-energy); stroke: var(--sch-bg); stroke-width: 2; }",
      ".cl-schwarzschild-horizon { stroke: var(--sch-unstable); stroke-width: 1.8; stroke-dasharray: 7 4; }",
      ".cl-schwarzschild-photon { stroke: var(--sch-reference); stroke-width: 1.8; stroke-dasharray: 2 5; }",
      ".cl-schwarzschild-reference-label { fill: var(--sch-reference) !important; font-size: 12px; font-weight: 700; }",
      ".cl-schwarzschild-horizon-label { fill: var(--sch-unstable) !important; font-size: 12px; font-weight: 700; }",
      ".cl-schwarzschild-energy-label { fill: var(--sch-energy) !important; font-size: 12px; font-weight: 750; }",
      ".cl-schwarzschild-orbit-stable { fill: var(--sch-stable); stroke: var(--sch-bg); stroke-width: 2; }",
      ".cl-schwarzschild-orbit-unstable { fill: var(--sch-unstable); stroke: var(--sch-bg); stroke-width: 2; }",
      ".cl-schwarzschild-orbit-isco { fill: var(--sch-reference); stroke: var(--sch-bg); stroke-width: 2; }",
      ".cl-schwarzschild-orbit-guide { stroke-width: 1.3; stroke-dasharray: 4 4; opacity: .8; }",
      ".cl-schwarzschild-orbit-guide.stable { stroke: var(--sch-stable); }",
      ".cl-schwarzschild-orbit-guide.unstable { stroke: var(--sch-unstable); }",
      ".cl-schwarzschild-orbit-guide.isco { stroke: var(--sch-reference); }",
      ".cl-schwarzschild-orbit-label { font-size: 12px; font-weight: 750; }",
      ".cl-schwarzschild-orbit-label.stable { fill: var(--sch-stable) !important; }",
      ".cl-schwarzschild-orbit-label.unstable { fill: var(--sch-unstable) !important; }",
      ".cl-schwarzschild-orbit-label.isco { fill: var(--sch-reference) !important; }",
      ".cl-schwarzschild-plot-note { fill: var(--sch-muted) !important; font-size: 12px; }",
      ".cl-schwarzschild-legend { display: flex; flex-wrap: wrap; gap: 7px 15px; margin-top: 8px; color: var(--sch-muted); font-size: .86em; }",
      ".cl-schwarzschild-legend-item { display: inline-flex; align-items: center; gap: 5px; }",
      ".cl-schwarzschild-swatch { display: inline-block; width: 18px; height: 0; border-top: 3px solid currentColor; }",
      ".cl-schwarzschild-swatch.energy { border-top-style: dashed; color: var(--sch-energy); }",
      ".cl-schwarzschild-swatch.allowed { width: 15px; height: 12px; border: 0; background: var(--sch-allowed); opacity: .65; }",
      ".cl-schwarzschild-swatch.stable { width: 11px; height: 11px; border: 0; border-radius: 50%; background: var(--sch-stable); }",
      ".cl-schwarzschild-swatch.unstable { width: 11px; height: 11px; border: 0; background: var(--sch-unstable); transform: rotate(45deg); }",
      ".cl-schwarzschild-swatch.reference { border-top-style: dotted; color: var(--sch-reference); }",
      ".cl-schwarzschild-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-top: 11px; }",
      ".cl-schwarzschild-metric { min-width: 0; padding: 9px; border-top: 2px solid var(--sch-border); background: var(--sch-panel); }",
      ".cl-schwarzschild-metric span { display: block; color: var(--sch-muted); font-size: 11px; }",
      ".cl-schwarzschild-metric strong { display: block; margin-top: 3px; overflow-wrap: anywhere; font-variant-numeric: tabular-nums; }",
      ".cl-schwarzschild-ledger-wrap { max-width: 100%; margin-top: 12px; }",
      ".cl-schwarzschild-ledger { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: .86em; }",
      ".cl-schwarzschild-ledger caption { margin-bottom: 5px; color: var(--sch-muted); text-align: left; font-weight: 700; }",
      ".cl-schwarzschild-ledger th, .cl-schwarzschild-ledger td { border-bottom: 1px solid var(--sch-border); padding: 6px 5px; text-align: left; vertical-align: top; overflow-wrap: anywhere; }",
      ".cl-schwarzschild-ledger th { width: 27%; color: var(--sch-muted); font-weight: 700; }",
      ".cl-schwarzschild-status { min-height: 1.6em; margin: .75rem 0 0; }",
      ".cl-schwarzschild-status strong { color: var(--sch-fg); }",
      ".cl-schwarzschild-migration-status { min-height: 1.5em; margin: .65rem 0 0; font-size: .88em; }",
      ".cl-schwarzschild-pass { color: var(--sch-stable) !important; font-weight: 750; }",
      ".cl-schwarzschild-fail { color: var(--sch-unstable) !important; font-weight: 750; }",
      "@media (max-width: 1050px) { .cl-schwarzschild-controls { grid-template-columns: repeat(2, minmax(0, 1fr)); } }",
      "@media (max-width: 700px) { .cl-schwarzschild-lab { margin-left: -8px; margin-right: -8px; padding: 14px; } .cl-schwarzschild-controls { grid-template-columns: minmax(0, 1fr); } .cl-schwarzschild-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } }",
      "@media (max-width: 600px) { .cl-schwarzschild-svg-scroll { overflow-x: auto; } .cl-schwarzschild-svg { width: 900px; min-width: 900px; max-width: none; } .cl-schwarzschild-metrics { grid-template-columns: minmax(0, 1fr); } }",
      "@media (prefers-reduced-motion: reduce) { .cl-schwarzschild-lab *, .cl-schwarzschild-lab *::before, .cl-schwarzschild-lab *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }"
    ].join("\n");
    var host = doc.head || doc.documentElement || doc.body;
    if (host) host.appendChild(style);
  }

  function makeMetric(doc, label, value) {
    var card = makeElement(doc, "div", { className: "cl-schwarzschild-metric" });
    card.appendChild(makeElement(doc, "span", {}, label));
    card.appendChild(makeElement(doc, "strong", {}, value));
    return card;
  }

  function describeOrbits(api, orbits) {
    if (!orbits.length) return "无圆轨道极值";
    return orbits.map(function (orbit) {
      if (orbit.type === "isco") return "ISCO r=6";
      return orbit.label + "=" + formatNumber(api, orbit.r, 3) + "（" + orbit.stability + "）";
    }).join("；");
  }

  function describeTurningPoints(api, turningPoints) {
    if (!turningPoints.length) return "图窗内无转向点";
    return turningPoints.map(function (value) {
      return "r≈" + formatNumber(api, value, 4);
    }).join("，");
  }

  function describeIntervals(api, intervals, domainMax) {
    if (!intervals.length) return "图窗内无允许区";
    return intervals.map(function (interval) {
      return "r∈" + intervalText(api, interval, domainMax);
    }).join("；");
  }

  function renderSvg(doc, refs, ids, api, state, derived) {
    clear(refs.svg);
    refs.svg.appendChild(makeSvg(doc, "title", { id: ids.svgTitle }, "Schwarzschild 类时赤道测地线有效势"));
    refs.svg.appendChild(makeSvg(
      doc,
      "desc",
      { id: ids.svgDesc },
      "横轴为无量纲半径 r，纵轴为有效势。蓝线是 V_eff，橙色虚线是 K=(E²−1)/2，绿色阴影为允许区；r=2 与 r=3 为参照线，圆轨道以稳定、不稳定或 ISCO 标记。"
    ));
    refs.svg.appendChild(makeSvg(doc, "rect", {
      x: VIEW.left,
      y: VIEW.top,
      width: PLOT_WIDTH,
      height: PLOT_HEIGHT,
      className: "cl-schwarzschild-chart-bg"
    }));

    var xTicks = ticks(PLOT_MIN, derived.domainMax, 7);
    var yTicks = ticks(derived.yDomain.minimum, derived.yDomain.maximum, 5);
    xTicks.forEach(function (value) {
      var x = xScale(value, derived.domainMax);
      refs.svg.appendChild(makeSvg(doc, "line", {
        x1: x,
        y1: VIEW.top,
        x2: x,
        y2: VIEW.top + PLOT_HEIGHT,
        className: "cl-schwarzschild-grid-line"
      }));
      refs.svg.appendChild(makeSvg(doc, "text", {
        x: x,
        y: VIEW.top + PLOT_HEIGHT + 22,
        "text-anchor": "middle",
        className: "cl-schwarzschild-tick"
      }, formatNumber(api, value, 0)));
    });
    yTicks.forEach(function (value) {
      var y = yScale(value, derived.yDomain);
      refs.svg.appendChild(makeSvg(doc, "line", {
        x1: VIEW.left,
        y1: y,
        x2: VIEW.left + PLOT_WIDTH,
        y2: y,
        className: "cl-schwarzschild-grid-line"
      }));
      refs.svg.appendChild(makeSvg(doc, "text", {
        x: VIEW.left - 9,
        y: y + 4,
        "text-anchor": "end",
        className: "cl-schwarzschild-tick"
      }, formatNumber(api, value, 3)));
    });

    derived.intervals.forEach(function (interval) {
      var left = xScale(interval.left, derived.domainMax);
      var right = xScale(interval.right, derived.domainMax);
      refs.svg.appendChild(makeSvg(doc, "rect", {
        x: left,
        y: VIEW.top,
        width: Math.max(0, right - left),
        height: PLOT_HEIGHT,
        className: "cl-schwarzschild-allowed"
      }));
    });

    var zeroY = yScale(0, derived.yDomain);
    if (zeroY >= VIEW.top && zeroY <= VIEW.top + PLOT_HEIGHT) {
      refs.svg.appendChild(makeSvg(doc, "line", {
        x1: VIEW.left,
        y1: zeroY,
        x2: VIEW.left + PLOT_WIDTH,
        y2: zeroY,
        className: "cl-schwarzschild-zero"
      }));
    }

    var horizonX = xScale(2, derived.domainMax);
    refs.svg.appendChild(makeSvg(doc, "line", {
      x1: horizonX,
      y1: VIEW.top,
      x2: horizonX,
      y2: VIEW.top + PLOT_HEIGHT,
      className: "cl-schwarzschild-horizon"
    }));
    refs.svg.appendChild(makeSvg(doc, "text", {
      x: horizonX + 5,
      y: VIEW.top - 12,
      className: "cl-schwarzschild-horizon-label"
    }, "r=2 horizon"));

    var photonX = xScale(3, derived.domainMax);
    refs.svg.appendChild(makeSvg(doc, "line", {
      x1: photonX,
      y1: VIEW.top,
      x2: photonX,
      y2: VIEW.top + PLOT_HEIGHT,
      className: "cl-schwarzschild-photon"
    }));
    refs.svg.appendChild(makeSvg(doc, "text", {
      x: photonX + 5,
      y: VIEW.top + 14,
      className: "cl-schwarzschild-reference-label"
    }, "r=3 photon sphere（null 参照）"));

    refs.svg.appendChild(makeSvg(doc, "path", {
      d: pathFor(derived.samples, derived.domainMax, derived.yDomain),
      className: "cl-schwarzschild-potential"
    }));

    var levelY = yScale(derived.level, derived.yDomain);
    refs.svg.appendChild(makeSvg(doc, "line", {
      x1: VIEW.left,
      y1: levelY,
      x2: VIEW.left + PLOT_WIDTH,
      y2: levelY,
      className: "cl-schwarzschild-energy"
    }));
    refs.svg.appendChild(makeSvg(doc, "text", {
      x: VIEW.left + PLOT_WIDTH - 5,
      y: levelY - 8,
      "text-anchor": "end",
      className: "cl-schwarzschild-energy-label"
    }, "K=" + formatNumber(api, derived.level, 4)));

    derived.turningPoints.forEach(function (value, index) {
      var x = xScale(value, derived.domainMax);
      refs.svg.appendChild(makeSvg(doc, "line", {
        x1: x,
        y1: VIEW.top,
        x2: x,
        y2: VIEW.top + PLOT_HEIGHT,
        className: "cl-schwarzschild-turning-guide"
      }));
      refs.svg.appendChild(makeSvg(doc, "circle", {
        cx: x,
        cy: levelY,
        r: 5.5,
        className: "cl-schwarzschild-turning-point"
      }));
      var turningLabelY = index % 2 ? levelY + 27 : levelY - 14;
      refs.svg.appendChild(makeSvg(doc, "text", {
        x: x + 7,
        y: clamp(turningLabelY, VIEW.top + 18, VIEW.top + PLOT_HEIGHT - 7),
        className: "cl-schwarzschild-energy-label"
      }, "转向点 " + formatNumber(api, value, 3)));
    });

    derived.orbits.forEach(function (orbit) {
      var x = xScale(orbit.r, derived.domainMax);
      var y = yScale(orbit.level, derived.yDomain);
      var kind = orbit.type;
      var guideClass = "cl-schwarzschild-orbit-guide " + kind;
      var labelClass = "cl-schwarzschild-orbit-label " + kind;
      refs.svg.appendChild(makeSvg(doc, "line", {
        x1: x,
        y1: VIEW.top,
        x2: x,
        y2: VIEW.top + PLOT_HEIGHT,
        className: guideClass
      }));
      if (kind === "unstable") {
        refs.svg.appendChild(makeSvg(doc, "polygon", {
          points: x + "," + (y - 8) + " " + (x + 8) + "," + y + " " +
            x + "," + (y + 8) + " " + (x - 8) + "," + y,
          className: "cl-schwarzschild-orbit-unstable"
        }));
      } else {
        refs.svg.appendChild(makeSvg(doc, "circle", {
          cx: x,
          cy: y,
          r: kind === "isco" ? 8 : 7,
          className: "cl-schwarzschild-orbit-" + kind
        }));
      }
      var anchorEnd = x > VIEW.left + PLOT_WIDTH - 125;
      var labelX = anchorEnd ? x - 10 : x + 10;
      var labelY = clamp(y - 12, VIEW.top + 18, VIEW.top + PLOT_HEIGHT - 10);
      refs.svg.appendChild(makeSvg(doc, "text", {
        x: labelX,
        y: labelY,
        "text-anchor": anchorEnd ? "end" : "start",
        className: labelClass
      }, orbit.label + "=" + formatNumber(api, orbit.r, 3)));
    });

    refs.svg.appendChild(makeSvg(doc, "line", {
      x1: VIEW.left,
      y1: VIEW.top + PLOT_HEIGHT,
      x2: VIEW.left + PLOT_WIDTH,
      y2: VIEW.top + PLOT_HEIGHT,
      className: "cl-schwarzschild-axis"
    }));
    refs.svg.appendChild(makeSvg(doc, "line", {
      x1: VIEW.left,
      y1: VIEW.top,
      x2: VIEW.left,
      y2: VIEW.top + PLOT_HEIGHT,
      className: "cl-schwarzschild-axis"
    }));
    refs.svg.appendChild(makeSvg(doc, "text", {
      x: VIEW.left + PLOT_WIDTH / 2,
      y: VIEW.height - 18,
      "text-anchor": "middle",
      className: "cl-schwarzschild-axis-label"
    }, "无量纲半径 r（r>2；单位 GM/c²）"));
    refs.svg.appendChild(makeSvg(doc, "text", {
      x: 18,
      y: VIEW.top + PLOT_HEIGHT / 2,
      "text-anchor": "middle",
      transform: "rotate(-90 18 " + (VIEW.top + PLOT_HEIGHT / 2) + ")",
      className: "cl-schwarzschild-axis-label"
    }, "V_eff 与 K"));
    refs.svg.appendChild(makeSvg(doc, "text", {
      x: VIEW.left + 8,
      y: VIEW.top + PLOT_HEIGHT - 10,
      className: "cl-schwarzschild-plot-note"
    }, "阴影：K≥V_eff 的允许区"));
  }

  function renderMetrics(doc, refs, api, state, derived) {
    clear(refs.metrics);
    refs.metrics.appendChild(makeMetric(
      doc,
      "角动量",
      "ℓ=" + formatNumber(api, state.ell, 4) + "；ℓ²=" + formatNumber(api, derived.ellSquared, 4)
    ));
    refs.metrics.appendChild(makeMetric(
      doc,
      "能量水平",
      "E=" + formatNumber(api, state.energy, 4) + "；K=" + formatNumber(api, derived.level, 5)
    ));
    refs.metrics.appendChild(makeMetric(doc, "圆轨道", describeOrbits(api, derived.orbits)));
    refs.metrics.appendChild(makeMetric(
      doc,
      "转向点",
      derived.turningPoints.length ? derived.turningPoints.length + " 个（图窗内）" : "0 个（图窗内）"
    ));
  }

  function addLedgerRow(doc, body, label, value) {
    var row = makeElement(doc, "tr");
    row.appendChild(makeElement(doc, "th", { scope: "row" }, label));
    row.appendChild(makeElement(doc, "td", {}, value));
    body.appendChild(row);
  }

  function renderLedger(doc, refs, api, state, derived) {
    clear(refs.ledger);
    refs.ledger.appendChild(makeElement(
      doc,
      "caption",
      {},
      "数值账本（确定性求根；允许区只在当前图窗 2<r≤" + formatNumber(api, derived.domainMax, 2) + " 内列出）"
    ));
    var body = makeElement(doc, "tbody");
    addLedgerRow(
      doc,
      body,
      "输入 ℓ、ℓ²",
      formatNumber(api, state.ell, 5) + "，" + formatNumber(api, derived.ellSquared, 5)
    );
    addLedgerRow(
      doc,
      body,
      "输入 E、K",
      formatNumber(api, state.energy, 5) + "，" + formatNumber(api, derived.level, 6)
    );
    addLedgerRow(doc, body, "势形", derived.shape);
    addLedgerRow(doc, body, "圆轨道", describeOrbits(api, derived.orbits));
    addLedgerRow(doc, body, "转向点 V_eff=K", describeTurningPoints(api, derived.turningPoints));
    addLedgerRow(
      doc,
      body,
      "允许区 K≥V_eff",
      describeIntervals(api, derived.intervals, derived.domainMax)
    );
    addLedgerRow(
      doc,
      body,
      "尺度边界",
      "r=2 是外部图边界；r=3 仅为 null photon sphere 参照；本实验的 ISCO 只在 ℓ²=12、r=6 出现。"
    );
    refs.ledger.appendChild(body);
  }

  function mount(root, api) {
    var doc = root.ownerDocument || (typeof document !== "undefined" ? document : null);
    if (!doc) return;
    injectStyles(doc);
    root.classList.add("cl-schwarzschild-lab");
    SERIAL += 1;
    var serial = SERIAL;
    var ids = {
      ell: "cl-schwarzschild-ell-" + serial,
      energy: "cl-schwarzschild-energy-" + serial,
      migration: "cl-schwarzschild-migration-" + serial,
      svgTitle: "cl-schwarzschild-svg-title-" + serial,
      svgDesc: "cl-schwarzschild-svg-desc-" + serial
    };
    var state = {
      presetId: DEFAULT_PRESET,
      ell: PRESETS[DEFAULT_PRESET].ell,
      energy: PRESETS[DEFAULT_PRESET].energy,
      message: "已载入“" + PRESETS[DEFAULT_PRESET].label + "”预设。"
    };
    var refs = { presetButtons: Object.create(null) };

    var shell = makeElement(doc, "div", { className: "cl-schwarzschild-shell" });
    shell.appendChild(makeElement(
      doc,
      "h3",
      { className: "cl-schwarzschild-heading" },
      "Schwarzschild 类时轨道：势垒、转向点与 ISCO"
    ));
    shell.appendChild(makeElement(
      doc,
      "p",
      { className: "cl-schwarzschild-intro" },
      "只画 G=M=c=1、r>2 的类时赤道测地线。拖动 ℓ 与 E：蓝线是 V_eff，橙色水平线是 K=(E²−1)/2，绿色阴影是径向速度平方非负的区域。"
    ));

    var grid = makeElement(doc, "div", { className: "cl-schwarzschild-grid" });
    var controls = makeElement(doc, "div", { className: "cl-schwarzschild-controls" });
    var stage = makeElement(doc, "div", { className: "cl-schwarzschild-stage" });
    grid.appendChild(controls);
    grid.appendChild(stage);
    shell.appendChild(grid);

    var presetSet = makeElement(doc, "fieldset", { className: "cl-schwarzschild-fieldset" });
    presetSet.appendChild(makeElement(doc, "legend", {}, "ℓ / E 预设"));
    var presetRow = makeElement(doc, "div", {
      className: "cl-schwarzschild-preset-row",
      role: "group",
      "aria-label": "Schwarzschild 轨道预设"
    });
    PRESET_ORDER.forEach(function (id) {
      var button = makeElement(doc, "button", {
        type: "button",
        className: "cl-schwarzschild-button",
        "aria-pressed": id === state.presetId ? "true" : "false"
      }, PRESETS[id].label);
      button.addEventListener("click", function () { loadPreset(id); });
      refs.presetButtons[id] = button;
      presetRow.appendChild(button);
    });
    presetSet.appendChild(presetRow);
    refs.presetNote = makeElement(doc, "p", { className: "cl-schwarzschild-small" }, PRESETS[DEFAULT_PRESET].note);
    presetSet.appendChild(refs.presetNote);
    controls.appendChild(presetSet);

    var parameterSet = makeElement(doc, "fieldset", { className: "cl-schwarzschild-fieldset" });
    parameterSet.appendChild(makeElement(doc, "legend", {}, "参数滑杆"));
    var ellField = makeElement(doc, "div", { className: "cl-schwarzschild-field" });
    var ellCaption = makeElement(doc, "div", { className: "cl-schwarzschild-field-caption" });
    ellCaption.appendChild(makeElement(doc, "label", { htmlFor: ids.ell }, "ℓ（无量纲）"));
    refs.ellOutput = makeElement(doc, "output", {
      className: "cl-schwarzschild-output",
      htmlFor: ids.ell
    });
    ellCaption.appendChild(refs.ellOutput);
    ellField.appendChild(ellCaption);
    refs.ell = makeElement(doc, "input", {
      id: ids.ell,
      className: "cl-schwarzschild-range",
      type: "range",
      min: "2",
      max: "8",
      step: "0.0001",
      value: String(state.ell),
      "aria-label": "无量纲角动量 ℓ"
    });
    refs.ell.addEventListener("input", function () {
      state.ell = clamp(number(refs.ell.value, state.ell), 2, 8);
      state.presetId = null;
      state.message = "已调整 ℓ；观察 ℓ²=12 的临界是否被越过。";
      render();
    });
    ellField.appendChild(refs.ell);
    ellField.appendChild(makeElement(
      doc,
      "p",
      { className: "cl-schwarzschild-small" },
      "阈值：ℓ²=12（ℓ=√12）；外部域只取 r>2。"
    ));
    parameterSet.appendChild(ellField);

    var energyField = makeElement(doc, "div", { className: "cl-schwarzschild-field" });
    var energyCaption = makeElement(doc, "div", { className: "cl-schwarzschild-field-caption" });
    energyCaption.appendChild(makeElement(doc, "label", { htmlFor: ids.energy }, "E（单位静质量）"));
    refs.energyOutput = makeElement(doc, "output", {
      className: "cl-schwarzschild-output",
      htmlFor: ids.energy
    });
    energyCaption.appendChild(refs.energyOutput);
    energyField.appendChild(energyCaption);
    refs.energy = makeElement(doc, "input", {
      id: ids.energy,
      className: "cl-schwarzschild-range",
      type: "range",
      min: "0.88",
      max: "1.16",
      step: "0.0001",
      value: String(state.energy),
      "aria-label": "单位静质量能量 E"
    });
    refs.energy.addEventListener("input", function () {
      state.energy = clamp(number(refs.energy.value, state.energy), 0.88, 1.16);
      state.presetId = null;
      state.message = "已调整 E；橙色水平线 K 决定转向点。";
      render();
    });
    energyField.appendChild(refs.energy);
    energyField.appendChild(makeElement(
      doc,
      "p",
      { className: "cl-schwarzschild-small" },
      "实验画的是 K=(E²−1)/2，而不是把 E 当作势能本身。"
    ));
    parameterSet.appendChild(energyField);
    controls.appendChild(parameterSet);

    var actionSet = makeElement(doc, "fieldset", { className: "cl-schwarzschild-fieldset" });
    actionSet.appendChild(makeElement(doc, "legend", {}, "操作"));
    var actionRow = makeElement(doc, "div", { className: "cl-schwarzschild-action-row" });
    refs.reset = makeElement(doc, "button", {
      type: "button",
      className: "cl-schwarzschild-button cl-schwarzschild-primary"
    }, "重置为束缚轨道");
    refs.reset.addEventListener("click", function () { loadPreset(DEFAULT_PRESET); });
    actionRow.appendChild(refs.reset);
    actionRow.appendChild(makeElement(
      doc,
      "p",
      { className: "cl-schwarzschild-small" },
      "重复拖动只重画固定节点集合；不会叠加曲线、标记或账本行。"
    ));
    actionSet.appendChild(actionRow);
    controls.appendChild(actionSet);

    var migrationSet = makeElement(doc, "fieldset", { className: "cl-schwarzschild-fieldset" });
    migrationSet.appendChild(makeElement(doc, "legend", {}, "迁移问题"));
    migrationSet.appendChild(makeElement(
      doc,
      "label",
      { htmlFor: ids.migration },
      "改成光子后，能否只复用这条类时势？"
    ));
    refs.migration = makeElement(doc, "select", {
      id: ids.migration,
      className: "cl-schwarzschild-select",
      "aria-label": "选择光子有效势迁移答案"
    });
    refs.migration.appendChild(makeElement(doc, "option", { value: "" }, "请选择…"));
    refs.migration.appendChild(makeElement(
      doc,
      "option",
      { value: "reuse" },
      "可以，只需把 E 改成另一个数值"
    ));
    refs.migration.appendChild(makeElement(
      doc,
      "option",
      { value: "null" },
      "不能，null 测地线需要另一套有效势"
    ));
    migrationSet.appendChild(refs.migration);
    refs.checkMigration = makeElement(doc, "button", {
      type: "button",
      className: "cl-schwarzschild-button"
    }, "检查迁移答案");
    refs.checkMigration.addEventListener("click", checkMigration);
    migrationSet.appendChild(refs.checkMigration);
    refs.migrationStatus = makeElement(doc, "p", {
      className: "cl-schwarzschild-migration-status",
      role: "status",
      "aria-live": "polite"
    });
    migrationSet.appendChild(refs.migrationStatus);
    controls.appendChild(migrationSet);

    var stageHead = makeElement(doc, "div", { className: "cl-schwarzschild-stage-head" });
    stageHead.appendChild(makeElement(doc, "strong", {}, "有效势图"));
    stageHead.appendChild(makeElement(
      doc,
      "span",
      { className: "cl-schwarzschild-stage-title" },
      "固定 ℓ 读势形；改变 E 只移动能量水平"
    ));
    stage.appendChild(stageHead);
    stage.appendChild(makeElement(
      doc,
      "p",
      { className: "cl-schwarzschild-formula" },
      "½(dr/dτ)² + V_eff = K，K=(E²−1)/2，V_eff=−1/r+ℓ²/(2r²)−ℓ²/r³"
    ));
    var svgScroll = makeElement(doc, "div", { className: "cl-schwarzschild-svg-scroll" });
    refs.svg = makeSvg(doc, "svg", {
      className: "cl-schwarzschild-svg",
      viewBox: "0 0 900 510",
      role: "img",
      "aria-labelledby": ids.svgTitle + " " + ids.svgDesc
    });
    svgScroll.appendChild(refs.svg);
    stage.appendChild(svgScroll);

    var legend = makeElement(doc, "div", {
      className: "cl-schwarzschild-legend",
      "aria-label": "图例"
    });
    [
      ["", "V_eff", "cl-schwarzschild-swatch"],
      ["energy", "K 能量水平", "cl-schwarzschild-swatch energy"],
      ["allowed", "允许区 K≥V_eff", "cl-schwarzschild-swatch allowed"],
      ["stable", "外支稳定", "cl-schwarzschild-swatch stable"],
      ["unstable", "内支不稳定", "cl-schwarzschild-swatch unstable"],
      ["reference", "r=2 / r=3 参照", "cl-schwarzschild-swatch reference"]
    ].forEach(function (item) {
      var legendItem = makeElement(doc, "span", { className: "cl-schwarzschild-legend-item" });
      legendItem.appendChild(makeElement(doc, "i", { className: item[2], "aria-hidden": "true" }));
      legendItem.appendChild(makeElement(doc, "span", {}, item[1]));
      legend.appendChild(legendItem);
    });
    stage.appendChild(legend);

    refs.metrics = makeElement(doc, "div", {
      className: "cl-schwarzschild-metrics",
      "aria-label": "轨道摘要"
    });
    stage.appendChild(refs.metrics);
    var ledgerWrap = makeElement(doc, "div", { className: "cl-schwarzschild-ledger-wrap" });
    refs.ledger = makeElement(doc, "table", { className: "cl-schwarzschild-ledger" });
    ledgerWrap.appendChild(refs.ledger);
    stage.appendChild(ledgerWrap);
    refs.status = makeElement(doc, "p", {
      className: "cl-schwarzschild-status",
      role: "status",
      "aria-live": "polite"
    });
    stage.appendChild(refs.status);
    refs.note = makeElement(
      doc,
      "p",
      { className: "cl-schwarzschild-note" },
      "提示：horizon r=2 是本实验外部域的边界，photon sphere r=3 只用于比较；ISCO 是类时稳定圆轨道族的边界 r=6。"
    );
    stage.appendChild(refs.note);

    clear(root);
    root.appendChild(shell);

    function announce(message) {
      if (api && typeof api.announce === "function") api.announce(root, message);
    }

    function loadPreset(id) {
      var preset = PRESETS[id] || PRESETS[DEFAULT_PRESET];
      state.presetId = id;
      state.ell = preset.ell;
      state.energy = preset.energy;
      state.message = "已载入“" + preset.label + "”预设。";
      refs.migration.value = "";
      refs.migrationStatus.className = "cl-schwarzschild-migration-status";
      refs.migrationStatus.textContent = "";
      render();
      announce(state.message);
    }

    function checkMigration() {
      if (refs.migration.value === "null") {
        refs.migrationStatus.className = "cl-schwarzschild-migration-status cl-schwarzschild-pass";
        refs.migrationStatus.textContent = "答对：光子满足 null 条件，需重新推导 null 有效势；r=3 不是本实验的 ISCO。";
        announce("迁移答案正确：光子需要另一套 null 有效势。");
      } else if (refs.migration.value === "reuse") {
        refs.migrationStatus.className = "cl-schwarzschild-migration-status cl-schwarzschild-fail";
        refs.migrationStatus.textContent = "还需区分粒子类型：不能把类时归一化势只靠改 E 复用到光子。";
        announce("迁移答案需要修正。");
      } else {
        refs.migrationStatus.className = "cl-schwarzschild-migration-status cl-schwarzschild-fail";
        refs.migrationStatus.textContent = "请选择一个答案，再检查它是否尊重 null 与 timelike 的区别。";
      }
    }

    function renderControls() {
      refs.ell.value = String(state.ell);
      refs.energy.value = String(state.energy);
      refs.ellOutput.textContent = "ℓ=" + formatNumber(api, state.ell, 4);
      refs.energyOutput.textContent = "E=" + formatNumber(api, state.energy, 4);
      PRESET_ORDER.forEach(function (id) {
        refs.presetButtons[id].setAttribute(
          "aria-pressed",
          id === state.presetId ? "true" : "false"
        );
      });
      refs.presetNote.textContent = state.presetId && PRESETS[state.presetId]
        ? PRESETS[state.presetId].note
        : "自定义参数：先看 ℓ² 是否越过 12，再读橙色水平线的交点。";
    }

    function render() {
      var derived = derive(state);
      renderControls();
      renderSvg(doc, refs, ids, api, state, derived);
      renderMetrics(doc, refs, api, state, derived);
      renderLedger(doc, refs, api, state, derived);
      refs.status.textContent = state.message + " " + derived.shape +
        " 图窗内允许区：" + describeIntervals(api, derived.intervals, derived.domainMax) + "。";
    }

    render();
  }

  window.CourseLearning.register("schwarzschild-orbits", function (root, api) {
    mount(root, api);
  });
}());

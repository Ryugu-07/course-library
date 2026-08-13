(function (host) {
  "use strict";

  var EPS = 1e-10;
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "wasserstein-geodesic-lab-styles";
  var INSTANCE = 0;

  /*
   * The model is deliberately one-dimensional.  Every entry is a probability
   * atom {x, mass}; the optimal W2 plan is the common-quantile coupling.  The
   * browser only renders the returned ledger, so the numerical core is usable
   * without a DOM.
   */
  var PRESETS = [
    {
      id: "split",
      label: "质量拆分",
      note: "一个源原子把质量分到两个目标原子；端点会重新合并。",
      source: [{ x: 0, mass: 1 }],
      target: [{ x: -2, mass: 0.35 }, { x: 2, mass: 0.65 }]
    },
    {
      id: "shift",
      label: "平移三峰",
      note: "每个分位数向右走相同距离，最接近‘形状平移’。",
      source: [{ x: -2, mass: 0.25 }, { x: 0, mass: 0.5 }, { x: 2, mass: 0.25 }],
      target: [{ x: -1, mass: 0.25 }, { x: 1, mass: 0.5 }, { x: 3, mass: 0.25 }]
    },
    {
      id: "merge",
      label: "质量汇合",
      note: "两个源原子汇到一个目标原子；目标端不是一个映射的反函数。",
      source: [{ x: -2, mass: 0.5 }, { x: 2, mass: 0.5 }],
      target: [{ x: 0, mass: 1 }]
    },
    {
      id: "same",
      label: "相同分布",
      note: "两端相同，W₂=0；不要用 D 作除数，整条路径是常值。",
      source: [{ x: -1, mass: 0.4 }, { x: 1.5, mass: 0.6 }],
      target: [{ x: -1, mass: 0.4 }, { x: 1.5, mass: 0.6 }]
    },
    {
      id: "atomic",
      label: "原子边界",
      note: "不等权原子同时发生拆分与汇合，专门检验分位数区间。",
      source: [{ x: -2, mass: 0.4 }, { x: 1, mass: 0.6 }],
      target: [{ x: -1, mass: 0.2 }, { x: 0, mass: 0.3 }, { x: 3, mass: 0.5 }]
    }
  ];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function sum(values) {
    return values.reduce(function (total, value) { return total + value; }, 0);
  }

  function cloneDistribution(distribution) {
    return distribution.map(function (atom) {
      return {
        x: atom.x,
        mass: atom.mass,
        label: atom.label
      };
    });
  }

  function normalizeDistribution(input) {
    if (!Array.isArray(input) || input.length === 0) {
      throw new Error("a distribution needs at least one atom");
    }
    var atoms = input.map(function (atom, index) {
      if (!atom || typeof atom !== "object") throw new Error("invalid atom " + index);
      var x = Number(atom.x !== undefined ? atom.x : atom.position);
      var mass = Number(atom.mass !== undefined ? atom.mass : atom.weight);
      if (!Number.isFinite(x) || !Number.isFinite(mass)) throw new Error("invalid atom " + index);
      if (mass < -EPS) throw new Error("negative mass at atom " + index);
      return {
        x: x,
        mass: Math.max(0, mass),
        index: index,
        label: atom.label || "atom " + index
      };
    }).filter(function (atom) { return atom.mass > EPS; });
    var total = sum(atoms.map(function (atom) { return atom.mass; }));
    if (!(total > EPS)) throw new Error("a distribution needs positive total mass");
    return atoms.map(function (atom) {
      return {
        x: atom.x,
        mass: atom.mass / total,
        index: atom.index,
        label: atom.label
      };
    });
  }

  function sortedAtoms(input) {
    return normalizeDistribution(input).sort(function (left, right) {
      return left.x - right.x || left.index - right.index;
    });
  }

  function quantileSegments(input) {
    var atoms = sortedAtoms(input);
    var cursor = 0;
    return atoms.map(function (atom, index) {
      var start = cursor;
      cursor += atom.mass;
      var end = index === atoms.length - 1 ? 1 : cursor;
      return {
        u0: start,
        u1: end,
        mass: end - start,
        x: atom.x,
        atomIndex: atom.index,
        label: atom.label
      };
    });
  }

  function buildCoupling(source, target) {
    var sourceSegments = quantileSegments(source);
    var targetSegments = quantileSegments(target);
    var sourceIndex = 0;
    var targetIndex = 0;
    var sourceRemaining = sourceSegments[0].mass;
    var targetRemaining = targetSegments[0].mass;
    var cursor = 0;
    var coupling = [];

    while (sourceIndex < sourceSegments.length && targetIndex < targetSegments.length) {
      if (sourceRemaining <= EPS) {
        sourceIndex += 1;
        if (sourceIndex < sourceSegments.length) sourceRemaining = sourceSegments[sourceIndex].mass;
        continue;
      }
      if (targetRemaining <= EPS) {
        targetIndex += 1;
        if (targetIndex < targetSegments.length) targetRemaining = targetSegments[targetIndex].mass;
        continue;
      }
      var mass = Math.min(sourceRemaining, targetRemaining);
      if (mass <= EPS) throw new Error("degenerate quantile overlap");
      var sourceAtom = sourceSegments[sourceIndex];
      var targetAtom = targetSegments[targetIndex];
      coupling.push({
        u0: cursor,
        u1: cursor + mass,
        mass: mass,
        x: sourceAtom.x,
        y: targetAtom.x,
        sourceIndex: sourceAtom.atomIndex,
        targetIndex: targetAtom.atomIndex,
        sourceLabel: sourceAtom.label,
        targetLabel: targetAtom.label
      });
      cursor += mass;
      sourceRemaining -= mass;
      targetRemaining -= mass;
    }

    if (Math.abs(cursor - 1) > 2e-8) throw new Error("quantile coupling lost mass");
    if (coupling.length) {
      coupling[coupling.length - 1].u1 = 1;
      coupling[coupling.length - 1].mass = 1 - coupling[coupling.length - 1].u0;
    }
    return coupling;
  }

  function mergeAtoms(atoms) {
    var sorted = atoms.filter(function (atom) {
      return atom && Number(atom.mass) > EPS;
    }).map(function (atom) {
      return { x: Number(atom.x !== undefined ? atom.x : atom.position), mass: Number(atom.mass) };
    }).sort(function (left, right) { return left.x - right.x; });
    var merged = [];
    sorted.forEach(function (atom) {
      var last = merged[merged.length - 1];
      if (last && Math.abs(last.x - atom.x) <= EPS) {
        last.mass += atom.mass;
      } else {
        merged.push({ x: atom.x, mass: atom.mass });
      }
    });
    return merged;
  }

  function displacementAt(coupling, t) {
    var time = clamp(Number(t), 0, 1);
    return mergeAtoms(coupling.map(function (edge) {
      return { x: (1 - time) * edge.x + time * edge.y, mass: edge.mass };
    }));
  }

  function mixtureAt(source, target, t) {
    var time = clamp(Number(t), 0, 1);
    var sourceAtoms = normalizeDistribution(source);
    var targetAtoms = normalizeDistribution(target);
    return mergeAtoms(sourceAtoms.map(function (atom) {
      return { x: atom.x, mass: (1 - time) * atom.mass };
    }).concat(targetAtoms.map(function (atom) {
      return { x: atom.x, mass: time * atom.mass };
    })));
  }

  function w2Squared(first, second) {
    var left = quantileSegments(first);
    var right = quantileSegments(second);
    var i = 0;
    var j = 0;
    var leftRemaining = left[0].mass;
    var rightRemaining = right[0].mass;
    var total = 0;
    while (i < left.length && j < right.length) {
      var overlap = Math.min(leftRemaining, rightRemaining);
      var difference = left[i].x - right[j].x;
      total += overlap * difference * difference;
      leftRemaining -= overlap;
      rightRemaining -= overlap;
      if (leftRemaining <= EPS) {
        i += 1;
        if (i < left.length) leftRemaining = left[i].mass;
      }
      if (rightRemaining <= EPS) {
        j += 1;
        if (j < right.length) rightRemaining = right[j].mass;
      }
    }
    return Math.max(0, total);
  }

  function w2(first, second) {
    return Math.sqrt(w2Squared(first, second));
  }

  function distanceAlongCoupling(coupling, firstTime, secondTime) {
    var first = clamp(Number(firstTime), 0, 1);
    var second = clamp(Number(secondTime), 0, 1);
    return Math.sqrt(Math.max(0, sum(coupling.map(function (edge) {
      var firstPosition = (1 - first) * edge.x + first * edge.y;
      var secondPosition = (1 - second) * edge.x + second * edge.y;
      var difference = firstPosition - secondPosition;
      return edge.mass * difference * difference;
    }))));
  }

  function presetById(id) {
    for (var i = 0; i < PRESETS.length; i += 1) {
      if (PRESETS[i].id === id) return PRESETS[i];
    }
    return PRESETS[0];
  }

  function buildState(id, time) {
    var preset = presetById(id);
    var source = normalizeDistribution(preset.source);
    var target = normalizeDistribution(preset.target);
    var t = clamp(Number(time), 0, 1);
    var coupling = buildCoupling(source, target);
    var displacement = displacementAt(coupling, t);
    var mixture = mixtureAt(source, target, t);
    var distance = w2(source, target);
    var startDistance = w2(source, displacement);
    var endDistance = w2(displacement, target);
    var mixtureStartDistance = w2(source, mixture);
    var mixtureEndDistance = w2(mixture, target);
    var same = distance <= EPS;
    return {
      preset: preset,
      t: t,
      source: source,
      target: target,
      coupling: coupling,
      displacement: displacement,
      mixture: mixture,
      distance: distance,
      distanceSquared: distance * distance,
      startDistance: startDistance,
      endDistance: endDistance,
      expectedStartDistance: t * distance,
      expectedEndDistance: (1 - t) * distance,
      mixtureStartDistance: mixtureStartDistance,
      mixtureEndDistance: mixtureEndDistance,
      quarterToThreeQuarterSpeed: distanceAlongCoupling(coupling, 0.25, 0.75) / 0.5,
      sameDistribution: same,
      sourceMass: sum(source.map(function (atom) { return atom.mass; })),
      targetMass: sum(target.map(function (atom) { return atom.mass; })),
      displacementMass: sum(displacement.map(function (atom) { return atom.mass; })),
      mixtureMass: sum(mixture.map(function (atom) { return atom.mass; }))
    };
  }

  function invariantReport(state) {
    var tolerance = 2e-8;
    var endpointSource = w2(state.source, displacementAt(state.coupling, 0));
    var endpointTarget = w2(state.target, displacementAt(state.coupling, 1));
    var speedIdentity = distanceAlongCoupling(state.coupling, 0.2, 0.8);
    return {
      mass: Math.abs(state.sourceMass - 1) <= tolerance &&
        Math.abs(state.targetMass - 1) <= tolerance &&
        Math.abs(state.displacementMass - 1) <= tolerance &&
        Math.abs(state.mixtureMass - 1) <= tolerance,
      endpoints: endpointSource <= tolerance && endpointTarget <= tolerance,
      constantSpeed: Math.abs(speedIdentity - 0.6 * state.distance) <= tolerance,
      startIdentity: Math.abs(state.startDistance - state.expectedStartDistance) <= tolerance,
      endIdentity: Math.abs(state.endDistance - state.expectedEndDistance) <= tolerance
    };
  }

  function assertClose(actual, expected, message) {
    if (Math.abs(actual - expected) > 3e-8) {
      throw new Error(message + ": got " + actual + ", expected " + expected);
    }
  }

  function assertInvariants(state) {
    var report = invariantReport(state);
    Object.keys(report).forEach(function (key) {
      if (!report[key]) throw new Error("invariant failed: " + key);
    });
    return true;
  }

  function runSelfTest() {
    if (PRESETS.length < 4) throw new Error("need at least four presets");
    var ids = {};
    PRESETS.forEach(function (preset) {
      if (ids[preset.id]) throw new Error("duplicate preset id");
      ids[preset.id] = true;
      [0, 0.25, 0.5, 0.75, 1].forEach(function (t) {
        var state = buildState(preset.id, t);
        assertInvariants(state);
        assertClose(w2(state.source, state.displacement), t * state.distance, preset.id + " start geodesic");
        assertClose(w2(state.displacement, state.target), (1 - t) * state.distance, preset.id + " end geodesic");
        assertClose(distanceAlongCoupling(state.coupling, 0.1, 0.9), 0.8 * state.distance, preset.id + " speed");
        assertClose(
          w2(displacementAt(state.coupling, 0.1), displacementAt(state.coupling, 0.9)),
          0.8 * state.distance,
          preset.id + " intermediate W2 speed"
        );
        if (t === 0) {
          assertClose(w2(state.displacement, state.source), 0, preset.id + " t=0");
          assertClose(w2(state.mixture, state.source), 0, preset.id + " mixture t=0");
        }
        if (t === 1) {
          assertClose(w2(state.displacement, state.target), 0, preset.id + " t=1");
          assertClose(w2(state.mixture, state.target), 0, preset.id + " mixture t=1");
        }
      });
    });
    var split = buildState("split", 0.5);
    if (split.coupling.length !== 2 || split.coupling[0].sourceIndex !== split.coupling[1].sourceIndex) {
      throw new Error("split preset did not split one source atom");
    }
    var merge = buildState("merge", 0.5);
    if (merge.coupling.length !== 2 || merge.coupling[0].targetIndex !== merge.coupling[1].targetIndex) {
      throw new Error("merge preset did not merge into one target atom");
    }
    var same = buildState("same", 0.37);
    assertClose(same.distance, 0, "same distribution distance");
    assertClose(w2(same.displacement, same.source), 0, "same distribution path");
    var deterministicA = JSON.stringify(buildState("atomic", 0.37));
    var deterministicB = JSON.stringify(buildState("atomic", 0.37));
    if (deterministicA !== deterministicB) {
      throw new Error("model is not deterministic");
    }
    return true;
  }

  var pureModel = {
    EPS: EPS,
    presets: PRESETS,
    normalizeDistribution: normalizeDistribution,
    quantileSegments: quantileSegments,
    buildCoupling: buildCoupling,
    displacementAt: displacementAt,
    mixtureAt: mixtureAt,
    w2Squared: w2Squared,
    w2: w2,
    distanceAlongCoupling: distanceAlongCoupling,
    buildState: buildState,
    invariantReport: invariantReport,
    assertInvariants: assertInvariants,
    runSelfTest: runSelfTest
  };

  if (typeof module === "object" && module.exports) {
    module.exports = pureModel;
    if (require.main === module && process.argv.indexOf("--self-test") !== -1) {
      runSelfTest();
      process.stdout.write("wasserstein-geodesic self-test: PASS (5 presets, endpoint/atom/speed checks)\n");
    }
    return;
  }

  if (!host || !host.CourseLearning || typeof host.CourseLearning.register !== "function") return;

  function makeElement(api, tag, attrs, children) {
    return api.el(tag, attrs || {}, children);
  }

  function makeSvg(api, tag, attrs, children) {
    return api.svg(tag, attrs || {}, children);
  }

  function replaceChildren(node, children) {
    if (node && typeof node.replaceChildren === "function") {
      node.replaceChildren.apply(node, Array.isArray(children) ? children : [children]);
      return;
    }
    while (node && node.firstChild) node.removeChild(node.firstChild);
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child) node.appendChild(child);
    });
  }

  function format(api, value, digits) {
    if (api && typeof api.format === "function") return api.format(value, digits);
    if (!Number.isFinite(value)) return "—";
    return Number(value).toFixed(digits === undefined ? 3 : digits);
  }

  function installStyles() {
    if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".cl-wg-lab { --wg-source:#2f6fa5; --wg-target:#a45e22; --wg-current:#277a54; --wg-mixture:#8a4b9d; --wg-warn:#a45e22; box-sizing:border-box; width:100%; max-width:100%; margin:0 auto; padding:14px; overflow:hidden; color:var(--fg); background:var(--bg); border:1px solid var(--border); border-radius:8px; font:14px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif; }",
      "html[data-theme=\"dark\"] .cl-wg-lab { --wg-source:#83c9ff; --wg-target:#ffc27a; --wg-current:#80ddb0; --wg-mixture:#dda0ef; --wg-warn:#ffc27a; }",
      ".cl-wg-lab *, .cl-wg-lab *:before, .cl-wg-lab *:after { box-sizing:border-box; }",
      ".cl-wg-lab h3 { margin:0 0 6px; color:var(--fg); font-size:18px; line-height:1.35; }",
      ".cl-wg-lab h4 { margin:15px 0 7px; color:var(--accent); font-size:14px; }",
      ".cl-wg-intro, .cl-wg-prompt, .cl-wg-note, .cl-wg-status { color:var(--fg-soft); margin:7px 0; }",
      ".cl-wg-prompt { padding:9px 10px; border-left:3px solid var(--wg-warn); background:var(--block-bg); }",
      ".cl-wg-controls { display:grid; gap:10px; margin:12px 0; }",
      ".cl-wg-control { display:grid; gap:5px; min-width:0; }",
      ".cl-wg-control label, .cl-wg-control span { color:var(--fg-soft); font-size:13px; font-weight:650; }",
      ".cl-wg-lab select, .cl-wg-lab button { min-height:44px; width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:8px; color:var(--fg); background:var(--block-bg); font:inherit; }",
      ".cl-wg-lab button { cursor:pointer; } .cl-wg-lab button:hover { border-color:var(--accent); }",
      ".cl-wg-lab button:focus-visible, .cl-wg-lab select:focus-visible, .cl-wg-lab input:focus-visible { outline:3px solid var(--accent); outline-offset:2px; }",
      ".cl-wg-lab input[type=range] { width:100%; min-height:44px; accent-color:var(--accent); }",
      ".cl-wg-time-row { display:grid; grid-template-columns:1fr auto; gap:10px; align-items:center; }",
      ".cl-wg-time-row output { min-width:52px; color:var(--wg-current); font-weight:750; font-variant-numeric:tabular-nums; text-align:right; }",
      ".cl-wg-button-row { display:grid; grid-template-columns:repeat(3,1fr); gap:7px; }",
      ".cl-wg-button-row button { padding:7px 4px; font-size:13px; } .cl-wg-button-row button[aria-pressed=true] { color:var(--bg); border-color:var(--accent); background:var(--accent); font-weight:750; }",
      ".cl-wg-stage { padding:6px; border:1px solid var(--border); border-radius:8px; background:var(--block-bg); }",
      ".cl-wg-stage svg { display:block; width:100%; height:auto; } .cl-wg-stage text { font-family:inherit; letter-spacing:0; }",
      ".cl-wg-axis { stroke:var(--border); stroke-width:1; } .cl-wg-grid { stroke:var(--border); stroke-width:1; stroke-dasharray:2 4; opacity:.75; }",
      ".cl-wg-coupling { stroke:var(--wg-source); fill:none; opacity:.55; } .cl-wg-source { fill:var(--wg-source); stroke:var(--bg); stroke-width:1.5; } .cl-wg-target { fill:var(--wg-target); stroke:var(--bg); stroke-width:1.5; }",
      ".cl-wg-current { fill:var(--wg-current); stroke:var(--bg); stroke-width:1.5; } .cl-wg-mixture { fill:var(--wg-mixture); stroke:var(--bg); stroke-width:1.5; }",
      ".cl-wg-label { fill:var(--fg); font-size:11px; font-weight:700; } .cl-wg-muted { fill:var(--fg-soft); font-size:10px; } .cl-wg-tick { fill:var(--fg-soft); font-size:9px; }",
      ".cl-wg-metrics { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:7px; margin-top:9px; }",
      ".cl-wg-metric { min-width:0; padding:8px; border:1px solid var(--border); border-radius:7px; background:var(--block-bg); } .cl-wg-metric span { display:block; color:var(--fg-soft); font-size:11px; } .cl-wg-metric strong { display:block; margin-top:2px; color:var(--fg); font-size:14px; font-variant-numeric:tabular-nums; overflow-wrap:anywhere; } .cl-wg-metric em { color:var(--wg-current); font-size:10px; font-style:normal; }",
      ".cl-wg-table-wrap { overflow-x:auto; } .cl-wg-table { width:100%; border-collapse:collapse; font-size:11px; font-variant-numeric:tabular-nums; } .cl-wg-table th, .cl-wg-table td { padding:6px 4px; border-bottom:1px solid var(--border); text-align:left; white-space:nowrap; } .cl-wg-table th { color:var(--fg-soft); font-weight:650; } .cl-wg-table td { color:var(--fg); }",
      ".cl-wg-formula { margin-top:9px; padding:9px 10px; overflow:auto; color:var(--fg-soft); border-left:3px solid var(--wg-current); background:var(--block-bg); font-family:'SF Mono',Menlo,Consolas,monospace; font-size:11px; line-height:1.6; }",
      ".cl-wg-lab .cl-wg-sr { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }",
      "@media (max-width:360px) { .cl-wg-lab { padding:11px; } .cl-wg-metrics { gap:5px; } .cl-wg-metric { padding:7px 6px; } }",
      "@media (prefers-reduced-motion:reduce) { .cl-wg-lab * { animation:none !important; transition:none !important; } }"
    ].join("\n");
    document.head.appendChild(style);
  }

  function drawText(api, text, x, y, className, extra) {
    var attrs = { x: String(x), y: String(y), className: className || "cl-wg-label", text: text };
    Object.keys(extra || {}).forEach(function (key) { attrs[key] = extra[key]; });
    return makeSvg(api, "text", attrs);
  }

  function drawLine(api, x1, y1, x2, y2, className, extra) {
    var attrs = { x1: String(x1), y1: String(y1), x2: String(x2), y2: String(y2), className: className };
    Object.keys(extra || {}).forEach(function (key) { attrs[key] = extra[key]; });
    return makeSvg(api, "line", attrs);
  }

  function atomCircle(api, atom, x, y, className, description) {
    var radius = 4 + 12 * Math.sqrt(Math.max(0, atom.mass));
    var circle = makeSvg(api, "circle", {
      cx: String(x), cy: String(y), r: String(radius), className: className
    });
    circle.appendChild(makeSvg(api, "title", { text: description }));
    return circle;
  }

  function drawScene(api, data, uid) {
    var width = 360;
    var height = 420;
    var svg = makeSvg(api, "svg", {
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      "aria-labelledby": uid + "-title " + uid + "-desc"
    });
    svg.appendChild(makeSvg(api, "title", { id: uid + "-title", text: "一维 Wasserstein 分位数耦合与两种插值" }));
    svg.appendChild(makeSvg(api, "desc", {
      id: uid + "-desc",
      text: "上方用线段显示共同分位数耦合，绿色点是当前 McCann 位移位置；下方分别显示位移插值和混合插值的原子分布。"
    }));
    var allPositions = data.source.concat(data.target).map(function (atom) { return atom.x; });
    var min = Math.min.apply(null, allPositions);
    var max = Math.max.apply(null, allPositions);
    var span = Math.max(1, max - min);
    min -= 0.14 * span + 0.2;
    max += 0.14 * span + 0.2;
    var left = 42;
    var right = 350;
    function mapX(value) { return left + (value - min) / (max - min) * (right - left); }
    var sourceY = 57;
    var targetY = 151;
    var currentY = sourceY + (targetY - sourceY) * data.t;
    var displacementY = 239;
    var mixtureY = 329;

    svg.appendChild(drawText(api, "分位数 / 粒子耦合", 8, 19, "cl-wg-label"));
    svg.appendChild(drawText(api, "x₀", 8, sourceY + 4, "cl-wg-muted"));
    svg.appendChild(drawText(api, "x₁", 8, targetY + 4, "cl-wg-muted"));
    svg.appendChild(drawText(api, "t", 8, currentY + 4, "cl-wg-muted"));
    svg.appendChild(drawLine(api, left, sourceY, right, sourceY, "cl-wg-grid"));
    svg.appendChild(drawLine(api, left, targetY, right, targetY, "cl-wg-grid"));
    data.coupling.forEach(function (edge) {
      var z = (1 - data.t) * edge.x + data.t * edge.y;
      var widthValue = 1.2 + 7 * Math.sqrt(edge.mass);
      svg.appendChild(drawLine(api, mapX(edge.x), sourceY, mapX(edge.y), targetY, "cl-wg-coupling", {
        strokeWidth: String(widthValue)
      }));
      svg.appendChild(atomCircle(api, { x: z, mass: edge.mass }, mapX(z), currentY, "cl-wg-current",
        "当前位移粒子：x=" + format(api, z, 3) + "，质量=" + format(api, edge.mass, 3)));
    });
    data.source.forEach(function (atom) {
      svg.appendChild(atomCircle(api, atom, mapX(atom.x), sourceY, "cl-wg-source",
        "源原子 x=" + format(api, atom.x, 3) + "，质量=" + format(api, atom.mass, 3)));
    });
    data.target.forEach(function (atom) {
      svg.appendChild(atomCircle(api, atom, mapX(atom.x), targetY, "cl-wg-target",
        "目标原子 y=" + format(api, atom.x, 3) + "，质量=" + format(api, atom.mass, 3)));
    });
    svg.appendChild(drawText(api, "位移 μt", 8, displacementY + 4, "cl-wg-label"));
    svg.appendChild(drawText(api, "混合 νt", 8, mixtureY + 4, "cl-wg-label"));
    svg.appendChild(drawLine(api, left, displacementY, right, displacementY, "cl-wg-axis"));
    svg.appendChild(drawLine(api, left, mixtureY, right, mixtureY, "cl-wg-axis"));
    data.displacement.forEach(function (atom) {
      svg.appendChild(atomCircle(api, atom, mapX(atom.x), displacementY, "cl-wg-current",
        "McCann 位移原子 x=" + format(api, atom.x, 3) + "，质量=" + format(api, atom.mass, 3)));
    });
    data.mixture.forEach(function (atom) {
      svg.appendChild(atomCircle(api, atom, mapX(atom.x), mixtureY, "cl-wg-mixture",
        "混合插值原子 x=" + format(api, atom.x, 3) + "，质量=" + format(api, atom.mass, 3)));
    });
    var tickValues = allPositions.filter(function (value, index, values) {
      return values.indexOf(value) === index;
    }).sort(function (a, b) { return a - b; });
    tickValues.forEach(function (value) {
      var x = mapX(value);
      svg.appendChild(drawLine(api, x, mixtureY, x, mixtureY + 5, "cl-wg-axis"));
      svg.appendChild(drawText(api, format(api, value, 2), x, mixtureY + 18, "cl-wg-tick", { textAnchor: "middle" }));
    });
    svg.appendChild(drawText(api, "蓝：源　橙：目标　绿：位移　紫：混合", 42, 389, "cl-wg-muted"));
    svg.appendChild(drawText(api, "粒子半径 ∝ √质量；耦合线宽同样编码质量", 42, 404, "cl-wg-muted"));
    return svg;
  }

  function couplingTable(api, data) {
    var head = makeElement(api, "thead", {}, [makeElement(api, "tr", {}, [
      makeElement(api, "th", {}, ["u 区间"]),
      makeElement(api, "th", {}, ["x₀ → x₁"]),
      makeElement(api, "th", {}, ["质量"]),
      makeElement(api, "th", {}, ["zₜ"])
    ])]);
    var body = data.coupling.map(function (edge) {
      var z = (1 - data.t) * edge.x + data.t * edge.y;
      return makeElement(api, "tr", {}, [
        makeElement(api, "td", {}, ["[" + format(api, edge.u0, 2) + ", " + format(api, edge.u1, 2) + ")"]),
        makeElement(api, "td", {}, [format(api, edge.x, 2) + " → " + format(api, edge.y, 2)]),
        makeElement(api, "td", {}, [format(api, edge.mass, 3)]),
        makeElement(api, "td", {}, [format(api, z, 3)])
      ]);
    });
    return makeElement(api, "div", { className: "cl-wg-table-wrap" }, [
      makeElement(api, "table", { className: "cl-wg-table" }, [
        makeElement(api, "caption", { className: "cl-wg-sr" }, ["共同分位数耦合表"]),
        head,
        makeElement(api, "tbody", {}, body)
      ])
    ]);
  }

  function atomSummary(api, atoms) {
    return atoms.map(function (atom) {
      return format(api, atom.x, 2) + "(" + format(api, atom.mass, 2) + ")";
    }).join(" · ");
  }

  function metric(api, label, value, note) {
    return makeElement(api, "div", { className: "cl-wg-metric" }, [
      makeElement(api, "span", {}, [label]),
      makeElement(api, "strong", {}, [value]),
      makeElement(api, "em", {}, [note])
    ]);
  }

  host.CourseLearning.register("wasserstein-geodesic", function (root, api) {
    if (!root || typeof document === "undefined") return;
    installStyles();
    root.classList.add("cl-wg-lab");
    var uid = "cl-wg-" + (INSTANCE += 1);
    var state = { presetId: "split", t: 0.5 };
    var presetSelect = makeElement(api, "select", { id: uid + "-preset", "aria-label": "选择一维离散预设" });
    PRESETS.forEach(function (preset) {
      presetSelect.appendChild(makeElement(api, "option", { value: preset.id, text: preset.label }));
    });
    var presetNote = makeElement(api, "p", { className: "cl-wg-note" }, [PRESETS[0].note]);
    var timeInput = makeElement(api, "input", {
      id: uid + "-time",
      type: "range",
      min: "0",
      max: "1",
      step: "0.01",
      value: "0.5",
      "aria-label": "插值时间 t"
    });
    var timeOutput = makeElement(api, "output", { htmlFor: uid + "-time" }, ["0.50"]);
    var timeButtons = [];
    var timeButtonRow = makeElement(api, "div", { className: "cl-wg-button-row", role: "group", "aria-label": "端点与中点" });
    [[0, "t=0"], [0.5, "t=1/2"], [1, "t=1"]].forEach(function (item) {
      var button = makeElement(api, "button", { type: "button", text: item[1], "aria-pressed": "false" });
      button.addEventListener("click", function () {
        state.t = item[0];
        render();
      });
      timeButtons.push({ value: item[0], button: button });
      timeButtonRow.appendChild(button);
    });
    var timeLabel = makeElement(api, "label", { htmlFor: uid + "-time" }, ["插值时间 t"]);
    var timeRow = makeElement(api, "div", { className: "cl-wg-time-row" }, [timeInput, timeOutput]);
    var controls = makeElement(api, "div", { className: "cl-wg-controls" }, [
      makeElement(api, "div", { className: "cl-wg-control" }, [
        makeElement(api, "label", { htmlFor: uid + "-preset" }, ["离散预设"]),
        presetSelect,
        presetNote
      ]),
      makeElement(api, "div", { className: "cl-wg-control" }, [timeLabel, timeRow, timeButtonRow])
    ]);
    var status = makeElement(api, "p", { className: "cl-wg-status", "aria-live": "polite" }, [""]);
    var sceneHost = makeElement(api, "div", { className: "cl-wg-stage" });
    var metricsHost = makeElement(api, "div", { className: "cl-wg-metrics" });
    var couplingHost = makeElement(api, "div");
    var formulaHost = makeElement(api, "div", { className: "cl-wg-formula" });
    var reset = makeElement(api, "button", { type: "button", text: "重置：质量拆分，t=1/2" });
    reset.addEventListener("click", function () {
      state.presetId = "split";
      state.t = 0.5;
      render();
      if (api && typeof api.announce === "function") api.announce(root, "已重置到质量拆分预设，t=1/2。");
    });
    presetSelect.addEventListener("change", function () {
      state.presetId = presetSelect.value;
      render();
      if (api && typeof api.announce === "function") api.announce(root, "已切换到" + presetById(state.presetId).label + "。");
    });
    timeInput.addEventListener("input", function () {
      state.t = Number(timeInput.value);
      render();
    });
    replaceChildren(root, [
      makeElement(api, "h3", {}, ["一维 Wasserstein：粒子走，还是质量混合？"]),
      makeElement(api, "p", { className: "cl-wg-intro" }, ["先猜：位移插值应保持峰形并匀速移动；混合插值会在端点保留两份质量。看上方耦合线，再看下方两行。"]),
      controls,
      status,
      sceneHost,
      metricsHost,
      makeElement(api, "h4", {}, ["共同分位数耦合（每一行是一段质量）"]),
      couplingHost,
      formulaHost,
      reset
    ]);

    function render() {
      state.t = clamp(Number(state.t), 0, 1);
      var data = buildState(state.presetId, state.t);
      presetSelect.value = data.preset.id;
      presetNote.textContent = data.preset.note;
      timeInput.value = String(data.t);
      timeOutput.textContent = format(api, data.t, 2);
      timeButtons.forEach(function (item) {
        item.button.setAttribute("aria-pressed", Math.abs(item.value - data.t) <= 0.005 ? "true" : "false");
      });
      var splitSources = {};
      var splitTargets = {};
      data.coupling.forEach(function (edge) {
        splitSources[edge.sourceIndex] = (splitSources[edge.sourceIndex] || 0) + 1;
        splitTargets[edge.targetIndex] = (splitTargets[edge.targetIndex] || 0) + 1;
      });
      var splitCount = Object.keys(splitSources).filter(function (key) { return splitSources[key] > 1; }).length;
      var mergeCount = Object.keys(splitTargets).filter(function (key) { return splitTargets[key] > 1; }).length;
      var structuralNote = data.sameDistribution
        ? "相同分布：D=0，路径恒定。"
        : "分位数段 " + data.coupling.length + " 段；拆分源 " + splitCount + " 个，汇合目标 " + mergeCount + " 个。";
      status.textContent = structuralNote + " 当前 t=" + format(api, data.t, 2) + "；绿色是 McCann，紫色是混合。";
      replaceChildren(sceneHost, drawScene(api, data, uid));
      replaceChildren(metricsHost, [
        metric(api, "W₂(μ₀, μ₁)", format(api, data.distance, 3), "总路程 D"),
        metric(api, "W₂(μ₀, μₜ)", format(api, data.startDistance, 3), "应为 tD=" + format(api, data.expectedStartDistance, 3)),
        metric(api, "W₂(μₜ, μ₁)", format(api, data.endDistance, 3), "应为 (1−t)D=" + format(api, data.expectedEndDistance, 3)),
        metric(api, "匀速检查", format(api, data.quarterToThreeQuarterSpeed, 3), "0.25→0.75 / 0.5；应为 D"),
        metric(api, "混合：起点距离", format(api, data.mixtureStartDistance, 3), "不是 tD"),
        metric(api, "混合：终点距离", format(api, data.mixtureEndDistance, 3), "不是 (1−t)D")
      ]);
      replaceChildren(couplingHost, couplingTable(api, data));
      formulaHost.textContent = "μₜ^disp = ((1−t)x + ty)_#π*； μₜ^mix = (1−t)μ₀ + tμ₁； W₂²(μ₀,μ₁)=Σ mass·(y−x)²。当前位移原子：" + atomSummary(api, data.displacement) + "；混合原子：" + atomSummary(api, data.mixture) + "。";
    }

    render();
  });
}(typeof window !== "undefined" ? window : null));

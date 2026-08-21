(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("second-quantization", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("second-quantization self-test: PASS (" + report.checks + " checks)" + String.fromCharCode(10));
    } catch (error) {
      process.stderr.write("second-quantization self-test: FAIL" + String.fromCharCode(10) + error.stack + String.fromCharCode(10));
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var STYLE_ID = "cl-second-quantization-styles";
  var SERIAL = 0;
  var DEFAULT_ALGEBRA = { statistics: "fermion", modeCount: 2, mode: 0, occupations: [1, 0] };
  var DEFAULT_HUBBARD = { t: 1, U: 4, epsilon0: 0, epsilon1: 0 };
  var STYLE_TEXT = [
    ".sq-lab{--sq-blue:#2f6f9f;--sq-green:#39734d;--sq-gold:#a36a16;--sq-red:#b3483b;--sq-soft:var(--fg-soft,#6f6a60);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    "html[data-theme=\"dark\"] .sq-lab{--sq-blue:#82c8ff;--sq-green:#7bc48c;--sq-gold:#e3b45f;--sq-red:#f08d7d;--sq-soft:#b8b2a7}",
    ".sq-lab *,.sq-lab *::before,.sq-lab *::after{box-sizing:border-box}.sq-lab [hidden]{display:none!important}.sq-lab h3,.sq-lab h4{margin:0;color:var(--fg);letter-spacing:0}.sq-lab h3{font-size:1.18rem}.sq-lab h4{font-size:1rem}.sq-lab p{margin:.65rem 0}.sq-intro,.sq-note,.sq-feedback,.sq-boundary{color:var(--sq-soft);font-size:13px;line-height:1.7}.sq-gate{margin:14px 0;padding:12px 14px;border-left:3px solid var(--sq-gold);background:var(--bg)}.sq-gate fieldset{border:0;min-width:0;margin:12px 0 0;padding:0}.sq-gate legend{margin-bottom:7px;font-weight:700;line-height:1.5}.sq-choice-row,.sq-actions,.sq-stats{display:flex;flex-wrap:wrap;gap:7px}.sq-actions{margin-top:12px}.sq-lab button{font:inherit;line-height:1.3;cursor:pointer;color:var(--fg);background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:7px 10px;min-height:44px}.sq-lab button:hover{border-color:var(--sq-blue)}.sq-lab button[aria-pressed=\"true\"]{border-color:var(--sq-blue);background:var(--bg);font-weight:700}.sq-lab button:disabled{cursor:default;opacity:.65}.sq-primary{border-color:var(--sq-blue)!important;background:var(--sq-blue)!important;color:#fff!important;font-weight:700}.sq-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin:11px 0}.sq-control{min-width:0}.sq-control label{display:block;font-size:13px;color:var(--sq-soft);margin-bottom:4px}.sq-control output{font-weight:700;color:var(--fg)}.sq-control input{display:block;width:100%;accent-color:var(--sq-blue)}.sq-scale{display:flex;justify-content:space-between;color:var(--sq-soft);font-size:11px}.sq-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:8px;margin:13px 0}.sq-metric{border-top:2px solid var(--sq-blue);padding:7px 8px;background:var(--bg)}.sq-metric span{display:block;color:var(--sq-soft);font-size:12px}.sq-metric strong{display:block;font-size:1.06rem;color:var(--fg);overflow-wrap:anywhere}.sq-frame{border:1px solid var(--border);background:var(--bg);padding:6px;min-width:0}.sq-chart{display:block;width:100%;height:auto}.sq-chart text{font-family:inherit;fill:var(--fg-soft,#6f6a60);font-size:11px}.sq-grid{stroke:var(--border);stroke-width:1;stroke-dasharray:3 4}.sq-axis{stroke:var(--border);stroke-width:1}.sq-boson{fill:var(--sq-gold)}.sq-fermion{fill:var(--sq-blue)}.sq-energy{fill:var(--sq-green)}.sq-interaction{fill:var(--sq-red)}.sq-title{fill:var(--fg)!important;font-weight:700}.sq-table-wrap{overflow-x:auto;max-width:100%;margin-top:10px}.sq-table{border-collapse:collapse;width:100%;min-width:650px;font-size:12px}.sq-table caption{text-align:left;color:var(--sq-soft);padding:5px 0}.sq-table th,.sq-table td{border:1px solid var(--border);padding:6px 7px;text-align:right;white-space:nowrap}.sq-table th:first-child,.sq-table td:first-child{text-align:left}.sq-table th{background:var(--block-bg);color:var(--fg)}.sq-boundary{border-left:3px solid var(--sq-green);padding-left:10px}.sq-footnote{font-size:12px;color:var(--sq-soft)}.sq-lab input:focus-visible,.sq-lab button:focus-visible{outline:2px solid var(--sq-blue);outline-offset:2px}@media(max-width:600px){.sq-choice-row,.sq-actions{display:grid;grid-template-columns:1fr}.sq-choice-row button,.sq-actions button{width:100%}.sq-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.sq-frame{padding:3px}.sq-table{font-size:11px}}"
  ].join("");

  function finite(value) {
    return Number.isFinite(value);
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function normalizeAlgebra(input) {
    var source = input || {};
    var statistics = source.statistics === "boson" ? "boson" : "fermion";
    var occupations = Array.isArray(source.occupations) ? source.occupations.slice(0, 2) : DEFAULT_ALGEBRA.occupations.slice();
    while (occupations.length < 2) occupations.push(0);
    occupations = occupations.map(function (value) {
      var integer = Math.max(0, Math.round(finite(Number(value)) ? Number(value) : 0));
      return statistics === "fermion" ? Math.min(1, integer) : Math.min(12, integer);
    });
    return {
      statistics: statistics,
      modeCount: 2,
      mode: Math.round(clamp(finite(Number(source.mode)) ? Number(source.mode) : 0, 0, 1)),
      occupations: occupations
    };
  }

  function signFor(occupations, mode) {
    var parity = occupations.slice(0, mode).reduce(function (sum, value) { return sum + value; }, 0);
    return parity % 2 === 0 ? 1 : -1;
  }

  function creationAction(input, mode, statistics) {
    var occupations = input.slice();
    var n = occupations[mode];
    if (statistics === "boson") {
      occupations[mode] = n + 1;
      return { allowed: true, occupations: occupations, factor: Math.sqrt(n + 1), magnitude: Math.sqrt(n + 1), sign: 1, blocked: false };
    }
    if (n === 1) return { allowed: false, occupations: occupations, factor: 0, magnitude: 0, sign: 0, blocked: true };
    occupations[mode] = 1;
    var sign = signFor(input, mode);
    return { allowed: true, occupations: occupations, factor: sign, magnitude: 1, sign: sign, blocked: false };
  }

  function annihilationAction(input, mode, statistics) {
    var occupations = input.slice();
    var n = occupations[mode];
    if (statistics === "boson") {
      if (n === 0) return { allowed: false, occupations: occupations, factor: 0, magnitude: 0, sign: 0, blocked: true };
      occupations[mode] = n - 1;
      return { allowed: true, occupations: occupations, factor: Math.sqrt(n), magnitude: Math.sqrt(n), sign: 1, blocked: false };
    }
    if (n === 0) return { allowed: false, occupations: occupations, factor: 0, magnitude: 0, sign: 0, blocked: true };
    occupations[mode] = 0;
    var sign = signFor(input, mode);
    return { allowed: true, occupations: occupations, factor: sign, magnitude: 1, sign: sign, blocked: false };
  }

  function occupationAlgebra(input) {
    var config = normalizeAlgebra(input);
    var mode = config.mode;
    var creation = creationAction(config.occupations, mode, config.statistics);
    var annihilation = annihilationAction(config.occupations, mode, config.statistics);
    var number = config.occupations.reduce(function (sum, value) { return sum + value; }, 0);
    var relation = config.statistics === "boson" ? "[a_i, a_j†] = delta_ij" : "{c_i, c_j†} = delta_ij";
    var relationCheck = config.statistics === "boson" ? bosonAlgebraCheck(config.occupations) : fermionAlgebraCheck(config.modeCount);
    return {
      config: config,
      number: number,
      creation: creation,
      annihilation: annihilation,
      creationFactor: creation.factor,
      annihilationFactor: annihilation.factor,
      relation: relation,
      relationCheck: relationCheck,
      pauliBlocked: config.statistics === "fermion" && creation.blocked,
      displayBoundary: config.statistics === "boson" ? "Boson occupations are unbounded; the displayed slider is only a visualization range." : "Fermion occupations are exactly 0/1, so creation on an occupied mode is zero."
    };
  }

  function basisStates() {
    return [[0, 0], [1, 0], [0, 1], [1, 1]];
  }

  function sameState(left, right) {
    return left && right && left[0] === right[0] && left[1] === right[1];
  }

  function applyFermion(state, kind, mode) {
    var action = kind === "create" ? creationAction(state, mode, "fermion") : annihilationAction(state, mode, "fermion");
    return action.allowed ? { state: action.occupations, coefficient: action.factor } : { state: null, coefficient: 0 };
  }

  function applyBoson(state, kind, mode) {
    var action = kind === "create" ? creationAction(state, mode, "boson") : annihilationAction(state, mode, "boson");
    return action.allowed ? { state: action.occupations, coefficient: action.factor } : { state: null, coefficient: 0 };
  }

  function composeFermion(state, first, second) {
    var afterSecond = applyFermion(state, second.kind, second.mode);
    if (!afterSecond.state) return { state: null, coefficient: 0 };
    var afterFirst = applyFermion(afterSecond.state, first.kind, first.mode);
    if (!afterFirst.state) return { state: null, coefficient: 0 };
    return { state: afterFirst.state, coefficient: afterSecond.coefficient * afterFirst.coefficient };
  }

  function composeBoson(state, first, second) {
    var afterSecond = applyBoson(state, second.kind, second.mode);
    if (!afterSecond.state) return { state: null, coefficient: 0 };
    var afterFirst = applyBoson(afterSecond.state, first.kind, first.mode);
    if (!afterFirst.state) return { state: null, coefficient: 0 };
    return { state: afterFirst.state, coefficient: afterSecond.coefficient * afterFirst.coefficient };
  }

  function addMappingTerm(mapping, action, scale) {
    if (!action || !action.state || action.coefficient === 0) return;
    var key = action.state.join(",");
    if (!mapping[key]) mapping[key] = { state: action.state.slice(), coefficient: 0 };
    mapping[key].coefficient += (scale === undefined ? 1 : scale) * action.coefficient;
  }

  function mappingResidual(terms, targetState, targetCoefficient) {
    var mapping = {};
    var targetKey = targetState ? targetState.join(",") : null;
    var keys;
    terms.forEach(function (term) { addMappingTerm(mapping, term.action || term, term.scale); });
    keys = Object.keys(mapping);
    if (targetKey && keys.indexOf(targetKey) === -1) keys.push(targetKey);
    return keys.reduce(function (maximum, key) {
      var actual = mapping[key] ? mapping[key].coefficient : 0;
      var expected = targetKey && key === targetKey ? (targetCoefficient === undefined ? 0 : targetCoefficient) : 0;
      return Math.max(maximum, Math.abs(actual - expected));
    }, 0);
  }

  function cleanResidual(value) {
    return value <= 1e-12 ? 0 : value;
  }

  function fermionAlgebraCheck(modeCount) {
    var states = modeCount === 2 ? basisStates() : [[0], [1]];
    var maximumResidual = 0;
    var annihilationResidual = 0;
    var creationResidual = 0;
    states.forEach(function (state) {
      for (var i = 0; i < modeCount; i += 1) {
        for (var j = 0; j < modeCount; j += 1) {
          maximumResidual = Math.max(maximumResidual, mappingResidual([
            { action: composeFermion(state, { kind: "annihilate", mode: i }, { kind: "create", mode: j }) },
            { action: composeFermion(state, { kind: "create", mode: j }, { kind: "annihilate", mode: i }) }
          ], state, i === j ? 1 : 0));
          annihilationResidual = Math.max(annihilationResidual, mappingResidual([
            { action: composeFermion(state, { kind: "annihilate", mode: i }, { kind: "annihilate", mode: j }) },
            { action: composeFermion(state, { kind: "annihilate", mode: j }, { kind: "annihilate", mode: i }) }
          ], null, 0));
          creationResidual = Math.max(creationResidual, mappingResidual([
            { action: composeFermion(state, { kind: "create", mode: i }, { kind: "create", mode: j }) },
            { action: composeFermion(state, { kind: "create", mode: j }, { kind: "create", mode: i }) }
          ], null, 0));
        }
      }
    });
    maximumResidual = cleanResidual(maximumResidual);
    annihilationResidual = cleanResidual(annihilationResidual);
    creationResidual = cleanResidual(creationResidual);
    return {
      relation: "{c_i, c_j†} = delta_ij; {c_i,c_j} = {c_i†,c_j†} = 0",
      residual: maximumResidual,
      annihilationResidual: annihilationResidual,
      creationResidual: creationResidual,
      checkedStates: states.length,
      checkedPairs: modeCount * modeCount,
      exact: maximumResidual === 0 && annihilationResidual === 0 && creationResidual === 0
    };
  }

  function bosonAlgebraCheck(occupations) {
    var values = Array.isArray(occupations) ? occupations.slice(0, 2) : [0, 0];
    while (values.length < 2) values.push(0);
    values = values.map(function (value) { return Math.max(0, Math.round(finite(Number(value)) ? Number(value) : 0)); });
    var maximumOccupation = Math.max(1, values[0], values[1]);
    var states = [];
    var maximumResidual = 0;
    var annihilationResidual = 0;
    var creationResidual = 0;
    var n0;
    var n1;
    for (n0 = 0; n0 <= maximumOccupation; n0 += 1) {
      for (n1 = 0; n1 <= maximumOccupation; n1 += 1) states.push([n0, n1]);
    }
    states.forEach(function (state) {
      for (var i = 0; i < 2; i += 1) {
        for (var j = 0; j < 2; j += 1) {
          maximumResidual = Math.max(maximumResidual, mappingResidual([
            { action: composeBoson(state, { kind: "annihilate", mode: i }, { kind: "create", mode: j }) },
            { action: composeBoson(state, { kind: "create", mode: j }, { kind: "annihilate", mode: i }), scale: -1 }
          ], state, i === j ? 1 : 0));
          annihilationResidual = Math.max(annihilationResidual, mappingResidual([
            { action: composeBoson(state, { kind: "annihilate", mode: i }, { kind: "annihilate", mode: j }) },
            { action: composeBoson(state, { kind: "annihilate", mode: j }, { kind: "annihilate", mode: i }), scale: -1 }
          ], null, 0));
          creationResidual = Math.max(creationResidual, mappingResidual([
            { action: composeBoson(state, { kind: "create", mode: i }, { kind: "create", mode: j }) },
            { action: composeBoson(state, { kind: "create", mode: j }, { kind: "create", mode: i }), scale: -1 }
          ], null, 0));
        }
      }
    });
    maximumResidual = cleanResidual(maximumResidual);
    annihilationResidual = cleanResidual(annihilationResidual);
    creationResidual = cleanResidual(creationResidual);
    return {
      relation: "[a_i, a_j†] = delta_ij; [a_i,a_j] = [a_i†,a_j†] = 0",
      residual: maximumResidual,
      annihilationResidual: annihilationResidual,
      creationResidual: creationResidual,
      checkedStates: states.length,
      checkedPairs: 4,
      exact: maximumResidual === 0 && annihilationResidual === 0 && creationResidual === 0
    };
  }

  function multiplyMatrix(left, right) {
    var size = left.length;
    var output = [];
    for (var i = 0; i < size; i += 1) {
      output[i] = [];
      for (var j = 0; j < size; j += 1) {
        var sum = 0;
        for (var k = 0; k < size; k += 1) sum += left[i][k] * right[k][j];
        output[i][j] = sum;
      }
    }
    return output;
  }

  function maxMatrixAbs(matrix) {
    return Math.max.apply(null, matrix.map(function (row) { return Math.max.apply(null, row.map(Math.abs)); }));
  }

  function hubbardLedger(input) {
    var source = input || {};
    var config = {
      t: clamp(finite(Number(source.t)) ? Number(source.t) : DEFAULT_HUBBARD.t, 0, 3),
      U: clamp(finite(Number(source.U)) ? Number(source.U) : DEFAULT_HUBBARD.U, 0, 10),
      epsilon0: clamp(finite(Number(source.epsilon0)) ? Number(source.epsilon0) : DEFAULT_HUBBARD.epsilon0, -3, 3),
      epsilon1: clamp(finite(Number(source.epsilon1)) ? Number(source.epsilon1) : DEFAULT_HUBBARD.epsilon1, -3, 3)
    };
    var states = basisStates();
    var matrix = states.map(function () { return [0, 0, 0, 0]; });
    var rows = [];
    states.forEach(function (state, column) {
      var n0 = state[0];
      var n1 = state[1];
      var diagonal = config.epsilon0 * n0 + config.epsilon1 * n1 + config.U * n0 * n1;
      matrix[column][column] += diagonal;
      var actions = [{ state: state, coefficient: diagonal, label: "diagonal" }];
      var remove1 = applyFermion(state, "annihilate", 1);
      if (remove1.state) {
        var add0 = applyFermion(remove1.state, "create", 0);
        if (add0.state) {
          matrix[states.findIndex(function (candidate) { return sameState(candidate, add0.state); })][column] += -config.t * remove1.coefficient * add0.coefficient;
          actions.push({ state: add0.state, coefficient: -config.t * remove1.coefficient * add0.coefficient, label: "-t c0†c1" });
        }
      }
      var remove0 = applyFermion(state, "annihilate", 0);
      if (remove0.state) {
        var add1 = applyFermion(remove0.state, "create", 1);
        if (add1.state) {
          matrix[states.findIndex(function (candidate) { return sameState(candidate, add1.state); })][column] += -config.t * remove0.coefficient * add1.coefficient;
          actions.push({ state: add1.state, coefficient: -config.t * remove0.coefficient * add1.coefficient, label: "-t c1†c0" });
        }
      }
      rows.push({ state: state.slice(), number: n0 + n1, diagonalEnergy: diagonal, actions: actions });
    });
    var numberMatrix = states.map(function (state, row) {
      return states.map(function (_, column) { return row === column ? state[0] + state[1] : 0; });
    });
    var commutator = multiplyMatrix(matrix, numberMatrix).map(function (row, i) {
      return row.map(function (value, j) { return value - multiplyMatrix(numberMatrix, matrix)[i][j]; });
    });
    var oneParticleCenter = (config.epsilon0 + config.epsilon1) / 2;
    var oneParticleGap = Math.sqrt(Math.pow((config.epsilon0 - config.epsilon1) / 2, 2) + config.t * config.t);
    return {
      config: config,
      basis: states,
      matrix: matrix,
      rows: rows,
      numberByBasis: states.map(function (state) { return state[0] + state[1]; }),
      commutatorResidual: maxMatrixAbs(commutator),
      oneParticleEigenvalues: [oneParticleCenter - oneParticleGap, oneParticleCenter + oneParticleGap],
      twoParticleEnergy: config.epsilon0 + config.epsilon1 + config.U,
      numberConserving: maxMatrixAbs(commutator) === 0,
      boundary: "This is a finite two-mode, spinless Hubbard-like ledger; it is not the thermodynamic interacting Hubbard theory."
    };
  }

  function format(value, digits) {
    if (!finite(value)) return "-";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function append(node, children) {
    if (children === undefined || children === null) return node;
    if (!Array.isArray(children)) children = [children];
    children.forEach(function (child) {
      if (child !== undefined && child !== null && child !== false) node.appendChild(child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
    });
    return node;
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", value);
      else if (key === "htmlFor") node.setAttribute("for", value);
      else if (key === "text") node.textContent = value;
      else node.setAttribute(key, value === true ? "" : String(value));
    });
    return append(node, children);
  }

  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value !== undefined && value !== null) node.setAttribute(key === "className" ? "class" : key, String(value));
    });
    return append(node, children);
  }

  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function metric(doc, label, value) {
    return element(doc, "div", { className: "sq-metric" }, [element(doc, "span", {}, label), element(doc, "strong", {}, value)]);
  }

  function stateLabel(state) {
    return "|" + state.join(",") + ">";
  }

  function actionText(action) {
    if (!action.allowed) return "0 (blocked)";
    return format(action.factor, 4) + " -> " + stateLabel(action.occupations);
  }

  function drawChart(doc, svg, algebra, hubbard, uid) {
    clear(svg);
    var width = 780;
    var height = 380;
    var leftA = 58;
    var rightA = 360;
    var leftB = 430;
    var rightB = 758;
    var top = 34;
    var split = 185;
    var bottom = 337;
    var maximumOccupation = Math.max(2, Math.max.apply(null, algebra.config.occupations) + 1);
    var maximumEnergy = Math.max(1, Math.max.apply(null, hubbard.oneParticleEigenvalues.concat([hubbard.twoParticleEnergy]).map(Math.abs))) * 1.2;
    function xA(index) { return leftA + 72 + index * 120; }
    function yA(value) { return split - value / maximumOccupation * (split - top); }
    function xB(index) { return leftB + (index + 0.5) / 4 * (rightB - leftB); }
    function yB(value) { return split + 30 + (maximumEnergy - value) / (2 * maximumEnergy) * (bottom - split - 35); }
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-labelledby", uid + "-chart-title " + uid + "-chart-desc");
    svg.appendChild(svgElement(doc, "title", { id: uid + "-chart-title" }, "有限占据账本与两模式 Hubbard 能级"));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-chart-desc" }, "左侧显示两个模式的占据数，右侧显示四个 Fock 基态的粒子数和对角能量；相互作用只抬高双占据态。"));
    [0, maximumOccupation / 2, maximumOccupation].forEach(function (value) {
      var y = yA(value);
      svg.appendChild(svgElement(doc, "line", { x1: leftA, y1: y, x2: rightA, y2: y, className: "sq-grid" }));
      svg.appendChild(svgElement(doc, "text", { x: leftA - 8, y: y + 4, "text-anchor": "end" }, format(value, 1)));
    });
    svg.appendChild(svgElement(doc, "line", { x1: leftA, y1: split, x2: rightA, y2: split, className: "sq-axis" }));
    algebra.config.occupations.forEach(function (occupation, index) {
      var x = xA(index);
      var y = yA(occupation);
      svg.appendChild(svgElement(doc, "rect", { x: x - 24, y: y, width: 48, height: split - y, className: algebra.config.statistics === "boson" ? "sq-boson" : "sq-fermion" }));
      svg.appendChild(svgElement(doc, "text", { x: x, y: split + 17, "text-anchor": "middle" }, "mode " + index));
      svg.appendChild(svgElement(doc, "text", { x: x, y: y - 6, "text-anchor": "middle" }, "n=" + occupation));
    });
    svg.appendChild(svgElement(doc, "text", { x: leftA, y: 19, className: "sq-title" }, algebra.config.statistics === "boson" ? "boson occupation" : "fermion occupation"));
    svg.appendChild(svgElement(doc, "text", { x: rightA, y: 19, "text-anchor": "end" }, "创建/湮灭因子"));
    [0, maximumEnergy, -maximumEnergy].forEach(function (value) {
      var y = yB(value);
      svg.appendChild(svgElement(doc, "line", { x1: leftB, y1: y, x2: rightB, y2: y, className: "sq-grid" }));
      svg.appendChild(svgElement(doc, "text", { x: leftB - 8, y: y + 4, "text-anchor": "end" }, format(value, 1)));
    });
    hubbard.rows.forEach(function (row, index) {
      var x = xB(index);
      var energy = row.diagonalEnergy;
      var y = yB(energy);
      var base = yB(-maximumEnergy);
      svg.appendChild(svgElement(doc, "rect", { x: x - 25, y: Math.min(y, base), width: 50, height: Math.max(2, Math.abs(base - y)), className: row.number === 2 ? "sq-interaction" : "sq-energy" }));
      svg.appendChild(svgElement(doc, "text", { x: x, y: bottom + 17, "text-anchor": "middle" }, stateLabel(row.state)));
      svg.appendChild(svgElement(doc, "text", { x: x, y: y - 6, "text-anchor": "middle" }, "N=" + row.number + ", E=" + format(energy, 2)));
    });
    svg.appendChild(svgElement(doc, "line", { x1: leftB, y1: split, x2: rightB, y2: split, className: "sq-axis" }));
    svg.appendChild(svgElement(doc, "text", { x: leftB, y: 19, className: "sq-title" }, "two-mode Hubbard-like diagonal ledger"));
    svg.appendChild(svgElement(doc, "text", { x: rightB, y: 19, "text-anchor": "end" }, "红：U n0 n1；绿：单占据"));
    svg.appendChild(svgElement(doc, "text", { x: rightB, y: bottom + 35, "text-anchor": "end" }, "canonical Fock basis"));
  }

  function algebraTable(doc, result) {
    var table = element(doc, "table", { className: "sq-table" });
    table.appendChild(element(doc, "caption", {}, "占据数表象的局部操作；fermion factor 的正负来自 canonical mode order。"));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, ["项目", "结果", "读法"].map(function (label) {
      return element(doc, "th", { scope: "col" }, label);
    }))));
    table.appendChild(element(doc, "tbody", {}, [
      element(doc, "tr", {}, [element(doc, "td", {}, "当前 Fock state"), element(doc, "td", {}, stateLabel(result.config.occupations)), element(doc, "td", {}, "N=" + result.number)]),
      element(doc, "tr", {}, [element(doc, "td", {}, "creation"), element(doc, "td", {}, actionText(result.creation)), element(doc, "td", {}, result.config.statistics === "boson" ? "sqrt(n+1)" : "occupied mode -> 0")]),
      element(doc, "tr", {}, [element(doc, "td", {}, "annihilation"), element(doc, "td", {}, actionText(result.annihilation)), element(doc, "td", {}, result.config.statistics === "boson" ? "sqrt(n)" : "Pauli sign")]),
      element(doc, "tr", {}, [element(doc, "td", {}, "exact relation"), element(doc, "td", {}, result.relation), element(doc, "td", {}, result.displayBoundary)])
    ]));
    return table;
  }

  function hubbardTable(doc, result) {
    var table = element(doc, "table", { className: "sq-table" });
    table.appendChild(element(doc, "caption", {}, "H=-t(c0†c1+c1†c0)+epsilon0 n0+epsilon1 n1+U n0 n1；每一列动作都在同一 N sector 内。"));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, ["basis", "N", "diagonal E", "H action"].map(function (label) {
      return element(doc, "th", { scope: "col" }, label);
    }))));
    var body = element(doc, "tbody");
    result.rows.forEach(function (row) {
      body.appendChild(element(doc, "tr", {}, [
        element(doc, "td", {}, stateLabel(row.state)),
        element(doc, "td", {}, String(row.number)),
        element(doc, "td", {}, format(row.diagonalEnergy, 4)),
        element(doc, "td", {}, row.actions.map(function (action) { return action.label + (action.label === "diagonal" ? "=" + format(action.coefficient, 3) : " -> " + format(action.coefficient, 3) + stateLabel(action.state)); }).join("; "))
      ]));
    });
    table.appendChild(body);
    return table;
  }

  function mount(rootNode, api) {
    var doc = rootNode.ownerDocument || document;
    installStyles(doc);
    SERIAL += 1;
    var uid = "sq-" + SERIAL;
    var algebraConfig = normalizeAlgebra(DEFAULT_ALGEBRA);
    var hubbardConfig = { t: DEFAULT_HUBBARD.t, U: DEFAULT_HUBBARD.U, epsilon0: DEFAULT_HUBBARD.epsilon0, epsilon1: DEFAULT_HUBBARD.epsilon1 };
    var predictions = { factor: null, pauli: null, number: null, boundary: null };
    var questions = [
      { key: "factor", prompt: "Boson a† 作用在 |n> 上的因子是什么？", choices: [["sqrt", "sqrt(n+1)"], ["one", "1"], ["n", "n+1"]], answer: "sqrt" },
      { key: "pauli", prompt: "fermion 在已占据模式上再 creation 会怎样？", choices: [["zero", "结果为 0：Pauli exclusion"], ["double", "得到双占据"], ["boson", "变成 boson"]], answer: "zero" },
      { key: "number", prompt: "两模式 hopping 项对总粒子数做什么？", choices: [["conserve", "保持 N 不变"], ["raise", "每次增加 1"], ["random", "不确定"]], answer: "conserve" },
      { key: "boundary", prompt: "有限两模式 ledger 的定位是什么？", choices: [["finite", "有限模式/有限基的精确代数桥梁"], ["thermo", "已经是热力学极限相互作用理论"], ["classical", "经典概率模型"]], answer: "finite" }
    ];
    var shell = element(doc, "div", { className: "sq-lab" });
    shell.appendChild(element(doc, "h3", {}, "二次量子化：占据数代数与两模式 Hubbard-like 账本"));
    shell.appendChild(element(doc, "p", { className: "sq-intro" }, "先预测 creation/annihilation 因子、Pauli exclusion 和 number conservation；揭示后可在 boson/fermion 间切换。所有结果由有限、确定的代数规则计算。"));
    var gate = element(doc, "form", { className: "sq-gate", "aria-labelledby": uid + "-gate-title" });
    gate.appendChild(element(doc, "strong", { id: uid + "-gate-title" }, "预测门：算符因子、反对易与模型边界"));
    var choiceNodes = [];
    var feedback = element(doc, "p", { className: "sq-feedback", "aria-live": "polite" }, "四项预测完成后才揭示模式账本。");
    questions.forEach(function (question, index) {
      var field = element(doc, "fieldset");
      field.appendChild(element(doc, "legend", {}, (index + 1) + ". " + question.prompt));
      var row = element(doc, "div", { className: "sq-choice-row" });
      question.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false" }, choice[1]);
        button.addEventListener("click", function () {
          predictions[question.key] = choice[0];
          choiceNodes.forEach(function (item) {
            if (item.key === question.key) item.button.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false");
          });
          feedback.textContent = "预测已记录；完成四项后提交。";
        });
        choiceNodes.push({ key: question.key, value: choice[0], button: button });
        row.appendChild(button);
      });
      field.appendChild(row);
      gate.appendChild(field);
    });
    var gateActions = element(doc, "div", { className: "sq-actions" });
    var reveal = element(doc, "button", { type: "submit", className: "sq-primary" }, "提交预测并揭示");
    var resetGate = element(doc, "button", { type: "button" }, "重置");
    gateActions.appendChild(reveal);
    gateActions.appendChild(resetGate);
    gate.appendChild(gateActions);
    gate.appendChild(feedback);
    shell.appendChild(gate);

    var experiment = element(doc, "section", { hidden: "hidden", "aria-labelledby": uid + "-results-title" });
    experiment.appendChild(element(doc, "h3", { id: uid + "-results-title" }, "确定性实验台：局部算符与两模式相互作用"));
    experiment.appendChild(element(doc, "p", { className: "sq-note" }, "boson 侧的占据 slider 只是显示范围，公式本身允许任意 n>=0；fermion 侧严格限制 n=0/1。Hubbard-like ledger 只有两个 spinless 模式，不能冒充热力学极限或完整相互作用电子理论。"));
    var stats = element(doc, "div", { className: "sq-stats", role: "group", "aria-label": "statistics selector" });
    [["fermion", "fermion"], ["boson", "boson"]].forEach(function (choice) {
      var button = element(doc, "button", { type: "button", "aria-pressed": algebraConfig.statistics === choice[0] ? "true" : "false" }, choice[1]);
      button.addEventListener("click", function () { algebraConfig.statistics = choice[0]; algebraConfig.occupations = choice[0] === "fermion" ? algebraConfig.occupations.map(function (value) { return Math.min(1, value); }) : algebraConfig.occupations; render(); });
      stats.appendChild(button);
    });
    experiment.appendChild(stats);
    var controls = element(doc, "div", { className: "sq-controls" });
    var inputs = {};
    function addRange(key, label, min, max, step, digits, target) {
      var id = uid + "-" + key;
      var input = element(doc, "input", { id: id, type: "range", min: min, max: max, step: step, "aria-label": label });
      var output = element(doc, "output", { for: id });
      var scaleMin = element(doc, "span", {}, String(min));
      var scaleMax = element(doc, "span", {}, String(max));
      input.addEventListener("input", function () { target[key] = Number(input.value); render(); });
      inputs[key] = { input: input, output: output, scaleMin: scaleMin, scaleMax: scaleMax, digits: digits };
      controls.appendChild(element(doc, "div", { className: "sq-control" }, [
        element(doc, "label", { htmlFor: id }, [label + " = ", output]),
        input,
        element(doc, "div", { className: "sq-scale" }, [scaleMin, scaleMax])
      ]));
    }
    addRange("mode", "操作模式 index", 0, 1, 1, 0, algebraConfig);
    addRange("occupation0", "mode 0 occupation", 0, 8, 1, 0, { get occupation0() { return algebraConfig.occupations[0]; }, set occupation0(value) { algebraConfig.occupations[0] = algebraConfig.statistics === "fermion" ? Math.min(1, value) : value; } });
    addRange("occupation1", "mode 1 occupation", 0, 8, 1, 0, { get occupation1() { return algebraConfig.occupations[1]; }, set occupation1(value) { algebraConfig.occupations[1] = algebraConfig.statistics === "fermion" ? Math.min(1, value) : value; } });
    addRange("t", "hopping t", 0, 3, 0.1, 2, hubbardConfig);
    addRange("U", "interaction U", 0, 10, 0.25, 2, hubbardConfig);
    experiment.appendChild(controls);
    var metrics = element(doc, "div", { className: "sq-metrics" });
    var boundary = element(doc, "p", { className: "sq-boundary", "aria-live": "polite" });
    var frame = element(doc, "div", { className: "sq-frame" });
    var svg = svgElement(doc, "svg", { className: "sq-chart", viewBox: "0 0 780 380" });
    frame.appendChild(svg);
    var algebraWrap = element(doc, "div", { className: "sq-table-wrap" });
    var hubbardWrap = element(doc, "div", { className: "sq-table-wrap" });
    var interpretation = element(doc, "p", { className: "sq-footnote", "aria-live": "polite" });
    var reset = element(doc, "button", { type: "button" }, "重新预测");
    reset.addEventListener("click", resetAll);
    experiment.appendChild(metrics);
    experiment.appendChild(boundary);
    experiment.appendChild(frame);
    experiment.appendChild(element(doc, "h4", {}, "局部占据代数"));
    experiment.appendChild(algebraWrap);
    experiment.appendChild(element(doc, "h4", {}, "Hubbard-like 两模式总账"));
    experiment.appendChild(hubbardWrap);
    experiment.appendChild(interpretation);
    experiment.appendChild(reset);
    shell.appendChild(experiment);
    rootNode.replaceChildren(shell);

    function syncControls() {
      inputs.mode.input.value = String(algebraConfig.mode);
      inputs.mode.output.textContent = format(algebraConfig.mode, 0);
      var occupationMax = algebraConfig.statistics === "fermion" ? "1" : "8";
      inputs.occupation0.input.max = occupationMax;
      inputs.occupation1.input.max = occupationMax;
      inputs.occupation0.scaleMax.textContent = occupationMax;
      inputs.occupation1.scaleMax.textContent = occupationMax;
      inputs.occupation0.input.value = String(algebraConfig.occupations[0]);
      inputs.occupation0.output.textContent = format(algebraConfig.occupations[0], 0);
      inputs.occupation1.input.value = String(algebraConfig.occupations[1]);
      inputs.occupation1.output.textContent = format(algebraConfig.occupations[1], 0);
      inputs.t.input.value = String(hubbardConfig.t);
      inputs.t.output.textContent = format(hubbardConfig.t, 2);
      inputs.U.input.value = String(hubbardConfig.U);
      inputs.U.output.textContent = format(hubbardConfig.U, 2);
      stats.querySelectorAll("button").forEach(function (button, index) { button.setAttribute("aria-pressed", (index === 0 ? "fermion" : "boson") === algebraConfig.statistics ? "true" : "false"); });
    }

    function render() {
      var algebra = occupationAlgebra(algebraConfig);
      var hubbard = hubbardLedger(hubbardConfig);
      syncControls();
      metrics.replaceChildren(
        metric(doc, "statistics", algebra.config.statistics),
        metric(doc, "state", stateLabel(algebra.config.occupations)),
        metric(doc, "total N", String(algebra.number)),
        metric(doc, "creation factor", format(algebra.creationFactor, 4)),
        metric(doc, "annihilation factor", format(algebra.annihilationFactor, 4)),
        metric(doc, "occupation relation residual", format(algebra.relationCheck.residual, 4)),
        metric(doc, "[H,N] residual", format(hubbard.commutatorResidual, 4)),
        metric(doc, "N=1 eigenvalues", hubbard.oneParticleEigenvalues.map(function (value) { return format(value, 2); }).join(" / "))
      );
      boundary.textContent = algebra.displayBoundary + " " + hubbard.boundary;
      drawChart(doc, svg, algebra, hubbard, uid);
      algebraWrap.replaceChildren(algebraTable(doc, algebra));
      hubbardWrap.replaceChildren(hubbardTable(doc, hubbard));
      interpretation.textContent = hubbard.numberConserving
        ? "矩阵级 [H,N]=0：hopping 只在 N=1 的两个基态之间交换粒子，U 只给 |1,1> 加相互作用能。有限账本验证的是代数和守恒，不是热力学极限相图。"
        : "当前矩阵的 number conservation 检查失败；请回到默认参数审计算符顺序。";
    }

    function resetAll() {
      var freshAlgebra = normalizeAlgebra(DEFAULT_ALGEBRA);
      algebraConfig.statistics = freshAlgebra.statistics;
      algebraConfig.mode = freshAlgebra.mode;
      algebraConfig.occupations = freshAlgebra.occupations;
      hubbardConfig.t = DEFAULT_HUBBARD.t;
      hubbardConfig.U = DEFAULT_HUBBARD.U;
      hubbardConfig.epsilon0 = DEFAULT_HUBBARD.epsilon0;
      hubbardConfig.epsilon1 = DEFAULT_HUBBARD.epsilon1;
      predictions = { factor: null, pauli: null, number: null, boundary: null };
      choiceNodes.forEach(function (item) { item.button.setAttribute("aria-pressed", "false"); });
      reveal.disabled = false;
      experiment.setAttribute("hidden", "hidden");
      feedback.className = "sq-feedback";
      feedback.textContent = "四项预测完成后才揭示模式账本。";
      syncControls();
    }

    gate.addEventListener("submit", function (event) {
      event.preventDefault();
      var missing = questions.filter(function (question) { return predictions[question.key] === null; });
      if (missing.length) {
        feedback.className = "sq-feedback sq-boundary";
        feedback.textContent = "还缺 " + missing.length + " 项预测。";
        return;
      }
      var correct = questions.reduce(function (sum, question) { return sum + (predictions[question.key] === question.answer ? 1 : 0); }, 0);
      reveal.disabled = true;
      experiment.removeAttribute("hidden");
      feedback.textContent = "已揭示：" + correct + "/" + questions.length + " 项命中；现在可切换统计类型和相互作用。";
      render();
      if (api && typeof api.announce === "function") api.announce(rootNode, feedback.textContent);
    });
    resetGate.addEventListener("click", resetAll);
    render();
  }

  function predictionAnswers() {
    return { factor: "sqrt", pauli: "zero", number: "conserve", boundary: "finite" };
  }

  function close(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-10 : tolerance);
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    var boson = occupationAlgebra({ statistics: "boson", occupations: [2, 1], mode: 0 });
    assert(boson.creation.allowed && close(boson.creation.factor, Math.sqrt(3)), "boson creation factor");
    assert(boson.annihilation.allowed && close(boson.annihilation.factor, Math.sqrt(2)), "boson annihilation factor");
    assert(boson.number === 3, "boson number");
    assert(boson.relation === "[a_i, a_j†] = delta_ij", "boson commutator label");
    var vacuumBoson = occupationAlgebra({ statistics: "boson", occupations: [0, 0], mode: 0 });
    assert(vacuumBoson.annihilation.blocked && vacuumBoson.annihilation.factor === 0, "boson vacuum annihilation");
    var fermion = occupationAlgebra({ statistics: "fermion", occupations: [1, 0], mode: 0 });
    assert(fermion.pauliBlocked && fermion.creation.factor === 0, "Pauli exclusion");
    assert(fermion.annihilation.allowed && fermion.annihilation.factor === 1, "fermion annihilation on first mode");
    var signed = occupationAlgebra({ statistics: "fermion", occupations: [1, 0], mode: 1 });
    assert(signed.creation.factor === -1, "canonical fermion creation sign");
    assert(signed.annihilation.blocked, "empty fermion annihilation");
    var relation = fermionAlgebraCheck(2);
    assert(relation.exact && close(relation.residual, 0) && close(relation.annihilationResidual, 0) && close(relation.creationResidual, 0), "finite CAR relation");
    assert(relation.checkedStates === 4 && relation.checkedPairs === 4, "CAR checks every state and mode pair");
    var bosonRelation = bosonAlgebraCheck([0, 7]);
    assert(bosonRelation.exact && close(bosonRelation.residual, 0) && close(bosonRelation.annihilationResidual, 0) && close(bosonRelation.creationResidual, 0), "finite-mode boson CCR relation");
    assert(bosonRelation.checkedStates === 64 && bosonRelation.checkedPairs === 4, "CCR checks a finite state grid and every mode pair");
    var fermionCrossLeft = composeFermion([1, 0], { kind: "annihilate", mode: 0 }, { kind: "create", mode: 1 });
    var fermionCrossRight = composeFermion([1, 0], { kind: "create", mode: 1 }, { kind: "annihilate", mode: 0 });
    assert(close(mappingResidual([{ action: fermionCrossLeft }, { action: fermionCrossRight }], null, 0), 0), "fermion cross-mode signs cancel by mapped state");
    assert(mappingResidual([{ action: fermionCrossLeft }, { action: { state: fermionCrossRight.state, coefficient: fermionCrossRight.coefficient + 0.25 } }], null, 0) > 0, "fermion coefficient perturbation is detected");
    var bosonCrossLeft = composeBoson([2, 1], { kind: "annihilate", mode: 0 }, { kind: "create", mode: 1 });
    var bosonCrossRight = composeBoson([2, 1], { kind: "create", mode: 1 }, { kind: "annihilate", mode: 0 });
    assert(close(mappingResidual([{ action: bosonCrossLeft }, { action: bosonCrossRight, scale: -1 }], null, 0), 0), "boson cross-mode coefficients cancel by mapped state");
    assert(mappingResidual([{ action: bosonCrossLeft }, { action: { state: bosonCrossRight.state, coefficient: bosonCrossRight.coefficient + 0.25 }, scale: -1 }], null, 0) > 0, "boson coefficient perturbation is detected");
    var vacuum = occupationAlgebra({ statistics: "fermion", occupations: [0, 0], mode: 1 });
    assert(vacuum.creation.factor === 1 && sameState(vacuum.creation.occupations, [0, 1]), "fermion vacuum creation");
    var fermionBoundary = normalizeAlgebra({ statistics: "fermion", occupations: [8, -1] });
    assert(fermionBoundary.occupations[0] === 1 && fermionBoundary.occupations[1] === 0, "fermion occupation boundary");
    var bosonBoundary = occupationAlgebra({ statistics: "boson", occupations: [8, 0], mode: 0 });
    assert(bosonBoundary.creation.allowed && close(bosonBoundary.creation.factor, 3), "boson displayed boundary factor");
    var hubbard = hubbardLedger(DEFAULT_HUBBARD);
    assert(hubbard.basis.length === 4 && hubbard.matrix.length === 4, "two-mode basis size");
    assert(hubbard.numberByBasis.join(",") === "0,1,1,2", "Fock number sectors");
    assert(close(hubbard.matrix[1][2], -1) && close(hubbard.matrix[2][1], -1), "hopping matrix entries");
    assert(close(hubbard.matrix[3][3], 4), "double occupation U energy");
    assert(hubbard.commutatorResidual === 0 && hubbard.numberConserving, "H-N number conservation");
    assert(close(hubbard.oneParticleEigenvalues[0], -1) && close(hubbard.oneParticleEigenvalues[1], 1), "one-particle eigenvalues");
    var interacting = hubbardLedger({ t: 0.5, U: 7, epsilon0: 1, epsilon1: -1 });
    assert(close(interacting.twoParticleEnergy, 7), "two-particle interaction ledger");
    assert(interacting.rows.every(function (row) { return row.actions.every(function (action) { return action.state[0] + action.state[1] === row.number; }); }), "every Hubbard action preserves N");
    assert(JSON.stringify(hubbardLedger(DEFAULT_HUBBARD)) === JSON.stringify(hubbardLedger(DEFAULT_HUBBARD)), "Hubbard determinism");
    var answers = predictionAnswers();
    assert(answers.factor === "sqrt" && answers.pauli === "zero", "algebra gate answers");
    assert(answers.number === "conserve" && answers.boundary === "finite", "Hubbard gate answers");
    return { checks: checks, basisStates: 4 };
  }

  return {
    DEFAULT_ALGEBRA: DEFAULT_ALGEBRA,
    DEFAULT_HUBBARD: DEFAULT_HUBBARD,
    normalizeAlgebra: normalizeAlgebra,
    creationAction: creationAction,
    annihilationAction: annihilationAction,
    applyFermion: applyFermion,
    applyBoson: applyBoson,
    composeFermion: composeFermion,
    composeBoson: composeBoson,
    mappingResidual: mappingResidual,
    occupationAlgebra: occupationAlgebra,
    fermionAlgebraCheck: fermionAlgebraCheck,
    bosonAlgebraCheck: bosonAlgebraCheck,
    hubbardLedger: hubbardLedger,
    predictionAnswers: predictionAnswers,
    selfTest: selfTest,
    mount: mount
  };
});

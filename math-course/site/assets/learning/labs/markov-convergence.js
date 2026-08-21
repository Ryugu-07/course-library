(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("markov-convergence", exported.mount);
  }
  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log(
        "markov-convergence self-test: PASS (" +
          report.checks +
          " checks, " +
          report.presets +
          " presets)"
      );
    } catch (error) {
      console.error("markov-convergence self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-markov-convergence-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;
  var DEFAULT = { presetId: "mixing", time: 4, initialIndex: 0 };

  var PRESETS = [
    {
      id: "mixing",
      label: "不可约 + 非周期",
      matrix: [[0.8, 0.2], [0.3, 0.7]],
      stationary: [0.6, 0.4],
      family: "唯一平稳分布",
      note: "可逆、满支撑；从每个初态混合。"
    },
    {
      id: "periodic",
      label: "不可约 + 周期",
      matrix: [[0, 1, 0], [0, 0, 1], [1, 0, 0]],
      stationary: [1 / 3, 1 / 3, 1 / 3],
      family: "唯一平稳分布",
      note: "三循环；平稳存在但逐步分布不收敛。"
    },
    {
      id: "reducible",
      label: "可约 + 两个吸收类",
      matrix: [[1, 0, 0], [0, 1, 0], [0.5, 0.5, 0]],
      stationary: [0.5, 0.5, 0],
      family: "π_a=(a,1-a,0)",
      note: "闭类 {0}、{1}；长期行为依赖初始质量。"
    }
  ];

  var STYLE_TEXT = [
    ".mc-lab{--mc-blue:var(--cl-blue,#315f9d);--mc-gold:var(--cl-gold,#9b6a12);--mc-green:var(--cl-green,#39734d);--mc-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;}",
    ".mc-lab *,.mc-lab *::before,.mc-lab *::after{box-sizing:border-box;}",
    ".mc-lab [hidden]{display:none!important;}.mc-lab h3,.mc-lab h4{margin:0;color:var(--fg);}.mc-lab h3{font-size:1.18rem;}.mc-lab h4{margin-top:16px;font-size:1rem;}",
    ".mc-lab button,.mc-lab input,.mc-lab select{font:inherit;}.mc-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}.mc-lab button:hover{border-color:var(--accent);}.mc-lab button[aria-pressed=\"true\"],.mc-lab button.mc-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:700;}.mc-lab button:disabled{cursor:not-allowed;opacity:.55;}.mc-lab button:focus-visible,.mc-lab input:focus-visible,.mc-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
    ".mc-lab .mc-note,.mc-lab .mc-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65;overflow-wrap:anywhere;}.mc-lab .mc-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--mc-gold);background:var(--bg);}.mc-lab fieldset{min-width:0;margin:0;padding:0;border:0;}.mc-lab legend{margin-bottom:8px;color:var(--fg-soft);font-size:13px;font-weight:750;}.mc-lab .mc-question-list{display:grid;gap:12px;}.mc-lab .mc-question{min-width:0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);}.mc-lab .mc-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}.mc-lab .mc-choice-grid button{font-size:12px;}.mc-lab .mc-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}.mc-lab .mc-actions>*{flex:1 1 170px;}.mc-lab .mc-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}.mc-lab .mc-pass{color:var(--mc-green);}.mc-lab .mc-warn{color:var(--mc-red);}",
    ".mc-lab .mc-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.mc-lab .mc-layout{display:grid;grid-template-columns:minmax(210px,.72fr) minmax(0,1.28fr);gap:16px;align-items:start;min-width:0;}.mc-lab .mc-controls,.mc-lab .mc-stage{min-width:0;}.mc-lab .mc-controls{display:grid;gap:12px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}.mc-lab .mc-control{display:grid;gap:5px;min-width:0;}.mc-lab .mc-control label,.mc-lab .mc-control-title{color:var(--fg-soft);font-size:13px;font-weight:700;}.mc-lab .mc-control output{color:var(--accent);font-variant-numeric:tabular-nums;}.mc-lab .mc-control input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}.mc-lab .mc-option-grid,.mc-lab .mc-preset-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;}.mc-lab .mc-option-grid button,.mc-lab .mc-preset-grid button{font-size:12px;}",
    ".mc-lab .mc-stage-frame{min-width:0;padding:9px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}.mc-lab .mc-stage-title{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin:0 0 8px;color:var(--fg-soft);font-size:13px;}.mc-lab .mc-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg);}.mc-lab .mc-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.mc-lab .mc-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.68;}.mc-lab .mc-axis{stroke:currentColor;stroke-width:1.2;stroke-opacity:.72;}.mc-lab .mc-curve{fill:none;stroke:var(--mc-blue);stroke-width:3;}.mc-lab .mc-point{fill:var(--mc-blue);stroke:var(--bg);stroke-width:2;}.mc-lab .mc-current{fill:var(--mc-red);stroke:var(--bg);stroke-width:2;}.mc-lab .mc-bar-mu{fill:var(--mc-blue);}.mc-lab .mc-bar-pi{fill:var(--mc-gold);}",
    ".mc-lab .mc-legend{display:flex;flex-wrap:wrap;gap:8px 14px;margin:8px 0 0;color:var(--fg-soft);font-size:12px;}.mc-lab .mc-legend span{display:inline-flex;align-items:center;gap:5px;}.mc-lab .mc-swatch{display:inline-block;width:18px;height:3px;background:currentColor;}.mc-lab .mc-swatch-blue{color:var(--mc-blue);}.mc-lab .mc-swatch-gold{color:var(--mc-gold);}.mc-lab .mc-swatch-red{color:var(--mc-red);}.mc-lab .mc-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(122px,1fr));gap:8px;margin:12px 0;}.mc-lab .mc-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.mc-lab .mc-metric:nth-child(3n+1){border-top-color:var(--mc-blue);}.mc-lab .mc-metric:nth-child(3n+2){border-top-color:var(--mc-gold);}.mc-lab .mc-metric:nth-child(3n){border-top-color:var(--mc-red);}.mc-lab .mc-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4;}.mc-lab .mc-metric strong{display:block;margin-top:3px;color:var(--fg);font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
    ".mc-lab .mc-table-wrap{max-width:100%;margin-top:10px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.mc-lab table{width:100%;min-width:760px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.mc-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft);font-size:12px;}.mc-lab th,.mc-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere;}.mc-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750;}.mc-lab .mc-interpretation{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--mc-green);background:var(--bg);font-size:13px;line-height:1.7;overflow-wrap:anywhere;}",
    "@media(max-width:900px){.mc-lab .mc-layout{grid-template-columns:minmax(0,1fr);}}@media(max-width:760px){.mc-lab .mc-choice-grid{grid-template-columns:minmax(0,1fr);}.mc-lab .mc-preset-grid{grid-template-columns:minmax(0,1fr);}}@media(max-width:420px){.mc-lab .mc-stage-frame{padding:6px;}.mc-lab table{font-size:11.5px;}.mc-lab th,.mc-lab td{padding-left:5px;padding-right:5px;}}@media(prefers-reduced-motion:reduce){.mc-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || EPS) * scale;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function sum(values) {
    return values.reduce(function (total, value) { return total + value; }, 0);
  }

  function gcd(left, right) {
    var a = Math.abs(Math.round(left));
    var b = Math.abs(Math.round(right));
    while (b) {
      var next = a % b;
      a = b;
      b = next;
    }
    return a;
  }

  function identity(size) {
    var result = [];
    for (var row = 0; row < size; row += 1) {
      result.push([]);
      for (var column = 0; column < size; column += 1) {
        result[row].push(row === column ? 1 : 0);
      }
    }
    return result;
  }

  function cloneMatrix(matrix) {
    return matrix.map(function (row) { return row.slice(); });
  }

  function multiplyMatrices(left, right) {
    var size = left.length;
    var result = [];
    for (var row = 0; row < size; row += 1) {
      result.push([]);
      for (var column = 0; column < size; column += 1) {
        var total = 0;
        for (var inner = 0; inner < size; inner += 1) {
          total += left[row][inner] * right[inner][column];
        }
        result[row].push(total);
      }
    }
    return result;
  }

  function matrixPower(matrix, exponent) {
    var power = Math.max(0, Math.floor(Number(exponent)));
    var result = identity(matrix.length);
    var base = cloneMatrix(matrix);
    while (power > 0) {
      if (power % 2 === 1) result = multiplyMatrices(result, base);
      base = multiplyMatrices(base, base);
      power = Math.floor(power / 2);
    }
    return result;
  }

  function rowTimesMatrix(row, matrix) {
    return matrix[0].map(function (_, column) {
      return row.reduce(function (total, value, index) {
        return total + value * matrix[index][column];
      }, 0);
    });
  }

  function l1Distance(left, right) {
    return left.reduce(function (total, value, index) {
      return total + Math.abs(value - right[index]);
    }, 0);
  }

  function totalVariation(left, right) {
    return 0.5 * l1Distance(left, right);
  }

  function validateMatrix(matrix) {
    if (!Array.isArray(matrix) || matrix.length === 0) throw new RangeError("matrix must be non-empty");
    var size = matrix.length;
    matrix.forEach(function (row) {
      if (!Array.isArray(row) || row.length !== size) throw new RangeError("matrix must be square");
      row.forEach(function (value) {
        if (!finite(value) || value < -EPS) throw new RangeError("matrix entries must be nonnegative");
      });
      if (!near(sum(row), 1, 1e-9)) throw new RangeError("matrix rows must sum to one");
    });
  }

  function reachability(matrix) {
    var size = matrix.length;
    var result = [];
    for (var start = 0; start < size; start += 1) {
      var seen = [];
      var queue = [start];
      for (var index = 0; index < size; index += 1) seen.push(false);
      seen[start] = true;
      while (queue.length) {
        var current = queue.shift();
        for (var next = 0; next < size; next += 1) {
          if (!seen[next] && matrix[current][next] > EPS) {
            seen[next] = true;
            queue.push(next);
          }
        }
      }
      result.push(seen);
    }
    return result;
  }

  function periodOfClass(matrix, states) {
    if (!states.length) return 0;
    var rootState = states[0];
    var distance = {};
    var queue = [rootState];
    distance[rootState] = 0;
    while (queue.length) {
      var current = queue.shift();
      for (var index = 0; index < states.length; index += 1) {
        var next = states[index];
        if (matrix[current][next] > EPS && distance[next] === undefined) {
          distance[next] = distance[current] + 1;
          queue.push(next);
        }
      }
    }
    var period = 0;
    states.forEach(function (from) {
      states.forEach(function (to) {
        if (matrix[from][to] > EPS && distance[to] !== undefined) {
          period = gcd(period, distance[from] + 1 - distance[to]);
        }
      });
    });
    return period;
  }

  function structureOf(matrix) {
    validateMatrix(matrix);
    var size = matrix.length;
    var reach = reachability(matrix);
    var classes = [];
    var assigned = [];
    for (var index = 0; index < size; index += 1) assigned.push(false);
    for (var state = 0; state < size; state += 1) {
      if (assigned[state]) continue;
      var classStates = [];
      for (var other = 0; other < size; other += 1) {
        if (reach[state][other] && reach[other][state]) {
          classStates.push(other);
          assigned[other] = true;
        }
      }
      classes.push(classStates);
    }
    var classInfo = classes.map(function (states) {
      var closed = true;
      states.forEach(function (from) {
        for (var to = 0; to < size; to += 1) {
          if (states.indexOf(to) === -1 && matrix[from][to] > EPS) closed = false;
        }
      });
      return { states: states, closed: closed, period: closed ? periodOfClass(matrix, states) : 0 };
    });
    var irreducible = classes.length === 1;
    return {
      classes: classes,
      classInfo: classInfo,
      irreducible: irreducible,
      period: irreducible ? classInfo[0].period : 0,
      aperiodic: irreducible && classInfo[0].period === 1,
      closedClasses: classInfo.filter(function (info) { return info.closed; }).map(function (info) { return info.states; })
    };
  }

  function eigenvaluesOf(matrix) {
    validateMatrix(matrix);
    var size = matrix.length;
    if (size === 2) {
      var trace2 = matrix[0][0] + matrix[1][1];
      return [1, trace2 - 1];
    }
    if (size === 3) {
      var trace = matrix[0][0] + matrix[1][1] + matrix[2][2];
      var second =
        matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0] +
        matrix[0][0] * matrix[2][2] - matrix[0][2] * matrix[2][0] +
        matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1];
      var coefficientB = 1 - trace;
      var coefficientC = second + 1 - trace;
      var discriminant = coefficientB * coefficientB - 4 * coefficientC;
      if (discriminant >= -EPS) {
        var root = Math.sqrt(Math.max(0, discriminant));
        return [1, (-coefficientB + root) / 2, (-coefficientB - root) / 2];
      }
      var real = -coefficientB / 2;
      var imaginary = Math.sqrt(-discriminant) / 2;
      return [
        1,
        { real: real, imaginary: imaginary },
        { real: real, imaginary: -imaginary }
      ];
    }
    throw new RangeError("teaching spectrum supports 2x2 and 3x3 matrices");
  }

  function eigenAbsolute(value) {
    return typeof value === "number"
      ? Math.abs(value)
      : Math.sqrt(value.real * value.real + value.imaginary * value.imaginary);
  }

  function spectralInfo(matrix) {
    var eigenvalues = eigenvaluesOf(matrix);
    var removedOne = false;
    var nontrivial = [];
    eigenvalues.forEach(function (value) {
      if (!removedOne && typeof value === "number" && near(value, 1, 1e-8)) {
        removedOne = true;
      } else {
        nontrivial.push(value);
      }
    });
    var slem = 0;
    nontrivial.forEach(function (value) { slem = Math.max(slem, eigenAbsolute(value)); });
    return {
      eigenvalues: eigenvalues,
      nontrivial: nontrivial,
      rhoStar: slem,
      absoluteGap: 1 - slem
    };
  }

  function stationaryResidual(matrix, stationary) {
    if (!Array.isArray(stationary) || stationary.length !== matrix.length ||
        !stationary.every(function (value) { return finite(value); })) return Infinity;
    return l1Distance(rowTimesMatrix(stationary, matrix), stationary);
  }

  function detailedBalanceResidual(matrix, stationary) {
    if (!Array.isArray(stationary) || stationary.length !== matrix.length ||
        !stationary.every(function (value) { return finite(value); })) return Infinity;
    var residual = 0;
    for (var from = 0; from < matrix.length; from += 1) {
      for (var to = 0; to < matrix.length; to += 1) {
        residual = Math.max(
          residual,
          Math.abs(stationary[from] * matrix[from][to] - stationary[to] * matrix[to][from])
        );
      }
    }
    return residual;
  }

  function isReversible(matrix, stationary, tolerance) {
    var threshold = tolerance || 1e-9;
    if (!Array.isArray(stationary) || stationary.length !== matrix.length) return false;
    if (!stationary.every(function (value) { return finite(value) && value >= 0; })) return false;
    if (Math.abs(sum(stationary) - 1) > threshold) return false;
    if (stationaryResidual(matrix, stationary) > threshold) return false;
    return detailedBalanceResidual(matrix, stationary) <= threshold;
  }

  function spectralCertificate(matrix, stationary, initialIndex, time, structure, spectrum) {
    var info = structure || structureOf(matrix);
    var spectral = spectrum || spectralInfo(matrix);
    var validShape = Array.isArray(stationary) && stationary.length === matrix.length;
    var finiteNonnegative = validShape && stationary.every(function (value) { return finite(value) && value >= 0; });
    var normalized = finiteNonnegative && Math.abs(sum(stationary) - 1) <= 1e-9;
    var invariant = normalized && stationaryResidual(matrix, stationary) <= 1e-9;
    var reversible = invariant && isReversible(matrix, stationary);
    var fullSupport = invariant && stationary.every(function (value) { return value > EPS; });
    var reason = "";
    if (!validShape) reason = "平稳向量维数不匹配，不能发概率证书。";
    else if (!finiteNonnegative) reason = "平稳向量必须由有限非负概率组成。";
    else if (!normalized) reason = "候选平稳向量没有归一化为概率分布。";
    else if (!invariant) reason = "候选概率不满足 pi P = pi。";
    else if (!reversible) reason = "细致平衡失败：不把 rho* 当作 TV 证书。";
    else if (!info.irreducible) reason = "链可约：没有全局满支撑的唯一平稳证书。";
    else if (!info.aperiodic) reason = "链有周期：rho*=1，不给逐步收敛证书。";
    else if (!fullSupport) reason = "平稳分布没有满支撑，当前 bound 的初始因子不适用。";
    else if (spectral.rhoStar >= 1 - EPS) reason = "非平凡谱模不小于 1，不能给衰减证书。";
    if (reason) {
      return {
        available: false,
        reversible: reversible,
        rhoStar: spectral.rhoStar,
        absoluteGap: spectral.absoluteGap,
        bound: null,
        reason: reason
      };
    }
    var index = clamp(Math.round(Number(initialIndex)), 0, stationary.length - 1);
    var factor = 0.5 * Math.sqrt(Math.max(0, 1 / stationary[index] - 1));
    return {
      available: true,
      reversible: true,
      rhoStar: spectral.rhoStar,
      absoluteGap: spectral.absoluteGap,
      initialFactor: factor,
      bound: factor * Math.pow(spectral.rhoStar, Math.max(0, time)),
      reason: "可逆 L2(pi) 收缩转成 TV 上界；不是任意非可逆链的结论。"
    };
  }

  function delta(size, index) {
    var result = [];
    for (var state = 0; state < size; state += 1) result.push(state === index ? 1 : 0);
    return result;
  }

  function presetById(id) {
    for (var index = 0; index < PRESETS.length; index += 1) {
      if (PRESETS[index].id === id) return PRESETS[index];
    }
    return PRESETS[0];
  }

  function compute(options) {
    var settings = options || {};
    var preset = presetById(settings.presetId || DEFAULT.presetId);
    var matrix = cloneMatrix(preset.matrix);
    var time = clamp(Math.round(Number(settings.time === undefined ? DEFAULT.time : settings.time)), 0, 12);
    var initialIndex = clamp(
      Math.round(Number(settings.initialIndex === undefined ? DEFAULT.initialIndex : settings.initialIndex)),
      0,
      matrix.length - 1
    );
    var initial = delta(matrix.length, initialIndex);
    var power = matrixPower(matrix, time);
    var distribution = rowTimesMatrix(initial, power);
    var structure = structureOf(matrix);
    var spectrum = spectralInfo(matrix);
    var stationary = preset.stationary.slice();
    var trajectory = [];
    for (var step = 0; step <= 12; step += 1) {
      var stepDistribution = rowTimesMatrix(initial, matrixPower(matrix, step));
      trajectory.push({
        time: step,
        distribution: stepDistribution,
        tv: totalVariation(stepDistribution, stationary)
      });
    }
    var certificate = spectralCertificate(
      matrix,
      stationary,
      initialIndex,
      time,
      structure,
      spectrum
    );
    return {
      preset: preset,
      matrix: matrix,
      time: time,
      initialIndex: initialIndex,
      initial: initial,
      power: power,
      distribution: distribution,
      stationary: stationary,
      structure: structure,
      spectrum: spectrum,
      trajectory: trajectory,
      tv: totalVariation(distribution, stationary),
      stationaryResidual: stationaryResidual(matrix, stationary),
      detailedBalanceResidual: detailedBalanceResidual(matrix, stationary),
      reversible: isReversible(matrix, stationary),
      spectralCertificate: certificate,
      rowSums: power.map(sum)
    };
  }

  function format(value, digits) {
    if (value === null || value === undefined || !finite(value)) return "—";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.0005) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function formatVector(values) {
    return "(" + values.map(function (value) { return format(value, 4); }).join(", ") + ")";
  }

  function formatEigen(value) {
    if (typeof value === "number") return format(value, 4);
    return format(value.real, 4) + (value.imaginary >= 0 ? "+" : "") + format(value.imaginary, 4) + "i";
  }

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function appendChildren(node, children) {
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
    });
    return node;
  }

  function element(doc, tag, attrs, children) {
    return appendChildren(setAttributes(doc.createElement(tag), attrs || {}), children || []);
  }

  function svgElement(doc, tag, attrs, children) {
    return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}), children || []);
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function metric(doc, label, value) {
    var valueNode = element(doc, "strong", {}, [value]);
    return element(doc, "div", { className: "mc-metric" }, [
      element(doc, "span", {}, [label]),
      valueNode
    ]);
  }

  function buttonGroup(doc, label, choices, selected, onSelect, className) {
    var fieldset = element(doc, "fieldset", {});
    var grid = element(doc, "div", {
      className: className || "mc-option-grid",
      role: "group",
      "aria-label": label
    }, []);
    fieldset.appendChild(element(doc, "legend", {}, [label]));
    choices.forEach(function (choice) {
      var button = element(doc, "button", {
        type: "button",
        "aria-pressed": selected === choice.value ? "true" : "false"
      }, [choice.label]);
      button.addEventListener("click", function () { onSelect(choice.value); });
      grid.appendChild(button);
    });
    fieldset.appendChild(grid);
    return fieldset;
  }

  function tableElement(doc, captionText, headers, rows) {
    var head = element(doc, "tr", {}, headers.map(function (header) {
      return element(doc, "th", { scope: "col" }, [header]);
    }));
    var body = element(doc, "tbody", {}, rows.map(function (row) {
      return element(doc, "tr", {}, row.map(function (cell, index) {
        return element(doc, index === 0 ? "th" : "td", index === 0 ? { scope: "row" } : {}, [cell]);
      }));
    }));
    return element(doc, "table", {}, [
      element(doc, "caption", {}, [captionText]),
      element(doc, "thead", {}, [head]),
      body
    ]);
  }

  function drawSvg(doc, data, uid) {
    var svg = svgElement(doc, "svg", {
      className: "mc-svg",
      viewBox: "0 0 720 330",
      role: "img",
      "aria-labelledby": uid + "-title " + uid + "-desc"
    }, []);
    svg.appendChild(svgElement(doc, "title", { id: uid + "-title" }, ["Markov TV 曲线与分布对照"]));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-desc" }, [
      "左侧为 t 从 0 到 12 的 TV 距离轨迹，右侧为当前分布和选定平稳分布的柱状比较。"
    ]));
    var left = 48;
    var right = 355;
    var top = 42;
    var bottom = 250;
    var mapX = function (time) { return left + (right - left) * time / 12; };
    var mapY = function (value) { return bottom - (bottom - top) * clamp(value, 0, 1); };
    [0, 0.5, 1].forEach(function (value) {
      var y = mapY(value);
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: y, x2: right, y2: y, class: "mc-grid" }, []));
      svg.appendChild(svgElement(doc, "text", { x: left - 8, y: y + 4, "text-anchor": "end", "font-size": 11 }, [format(value, 1)]));
    });
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, class: "mc-axis" }, []));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, class: "mc-axis" }, []));
    svg.appendChild(svgElement(doc, "text", { x: left, y: 21, "font-size": 12, "font-weight": 700 }, ["TV(μ_t, π)"]));
    svg.appendChild(svgElement(doc, "text", { x: right, y: bottom + 25, "text-anchor": "end", "font-size": 11 }, ["t"]));
    var path = data.trajectory.map(function (row, index) {
      return (index === 0 ? "M" : "L") + mapX(row.time) + " " + mapY(row.tv);
    }).join(" ");
    svg.appendChild(svgElement(doc, "path", { d: path, class: "mc-curve" }, []));
    data.trajectory.forEach(function (row) {
      svg.appendChild(svgElement(doc, "circle", {
        cx: mapX(row.time),
        cy: mapY(row.tv),
        r: row.time === data.time ? 5 : 3,
        class: row.time === data.time ? "mc-current" : "mc-point"
      }, []));
    });
    svg.appendChild(svgElement(doc, "text", {
      x: mapX(data.time) + 7,
      y: mapY(data.trajectory[data.time].tv) - 8,
      "font-size": 11
    }, ["t=" + data.time]));

    var chartLeft = 432;
    var chartRight = 684;
    var chartTop = 54;
    var chartBottom = 250;
    var groupWidth = (chartRight - chartLeft) / Math.max(1, data.distribution.length);
    var barWidth = Math.min(25, groupWidth * 0.28);
    var barY = function (value) { return chartBottom - (chartBottom - chartTop) * clamp(value, 0, 1); };
    svg.appendChild(svgElement(doc, "text", { x: chartLeft, y: 21, "font-size": 12, "font-weight": 700 }, ["μ_t 与 π"]));
    svg.appendChild(svgElement(doc, "line", { x1: chartLeft, y1: chartBottom, x2: chartRight, y2: chartBottom, class: "mc-axis" }, []));
    [0, 0.5, 1].forEach(function (value) {
      var yGrid = barY(value);
      svg.appendChild(svgElement(doc, "line", { x1: chartLeft, y1: yGrid, x2: chartRight, y2: yGrid, class: "mc-grid" }, []));
    });
    data.distribution.forEach(function (value, index) {
      var center = chartLeft + groupWidth * (index + 0.5);
      svg.appendChild(svgElement(doc, "rect", {
        x: center - barWidth - 2,
        y: barY(value),
        width: barWidth,
        height: chartBottom - barY(value),
        class: "mc-bar-mu"
      }, []));
      svg.appendChild(svgElement(doc, "rect", {
        x: center + 2,
        y: barY(data.stationary[index]),
        width: barWidth,
        height: chartBottom - barY(data.stationary[index]),
        class: "mc-bar-pi"
      }, []));
      svg.appendChild(svgElement(doc, "text", { x: center, y: chartBottom + 18, "text-anchor": "middle", "font-size": 11 }, ["状态 " + index]));
    });
    return svg;
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument || !root.appendChild) return;
    var doc = root.ownerDocument;
    installStyles(doc);
    INSTANCE += 1;
    var uid = "cl-mc-" + INSTANCE;
    var state = {
      presetId: DEFAULT.presetId,
      time: DEFAULT.time,
      initialIndex: DEFAULT.initialIndex
    };
    var prediction = { stationary: null, convergence: null, periodic: null, spectrum: null };
    var revealed = false;
    var score = 0;
    var shell = element(doc, "div", { className: "mc-lab" }, []);
    root.replaceChildren(shell);

    function announce(message) {
      if (api && typeof api.announce === "function") api.announce(root, message);
    }

    function predictionComplete() {
      return Object.keys(prediction).every(function (key) { return prediction[key] !== null; });
    }

    function addPrediction(container, key, prompt, options) {
      var fieldset = element(doc, "fieldset", { className: "mc-question" }, [
        element(doc, "legend", {}, [prompt])
      ]);
      var grid = element(doc, "div", {
        className: "mc-choice-grid",
        role: "group",
        "aria-label": prompt
      }, []);
      options.forEach(function (option) {
        var button = element(doc, "button", {
          type: "button",
          "aria-pressed": prediction[key] === option.value ? "true" : "false",
          disabled: revealed
        }, [option.label]);
        button.addEventListener("click", function () {
          if (!revealed) {
            prediction[key] = option.value;
            renderGate();
          }
        });
        grid.appendChild(button);
      });
      fieldset.appendChild(grid);
      container.appendChild(fieldset);
    }

    function renderGate() {
      clear(shell);
      shell.appendChild(element(doc, "h3", {}, ["Markov 收敛审计：平稳、周期、可约分开"]));
      shell.appendChild(element(doc, "p", { className: "mc-note" }, [
        revealed
          ? "预测已提交；可以切换链、初态和时间，逐项核对精确账本。"
          : "先完成四项结构预测。提交前不显示矩阵幂、TV 曲线或谱数值。"
      ]));
      shell.appendChild(element(doc, "div", { className: "mc-prompt" }, [
        revealed
          ? "不变性、可逆性和混合性是三种不同的证书。"
          : "预测门：看到 πP=π 时，先问它到底证明了什么。"
      ]));
      var questions = element(doc, "div", { className: "mc-question-list" }, []);
      addPrediction(questions, "stationary", "1 · πP=π 直接证明？", [
        { value: "invariance", label: "π 是平稳分布" },
        { value: "convergence", label: "任意初态收敛" },
        { value: "structure", label: "链不可约" }
      ]);
      addPrediction(questions, "convergence", "2 · 有限不可约且非周期？", [
        { value: "yes", label: "趋向唯一 π" },
        { value: "no", label: "没有平稳分布" },
        { value: "oscillate", label: "必然振荡" }
      ]);
      addPrediction(questions, "periodic", "3 · 不可约周期链可以？", [
        { value: "yes-no", label: "有 π 但 TV 不趋 0" },
        { value: "no-stationary", label: "无 π" },
        { value: "reducible", label: "因此可约" }
      ]);
      addPrediction(questions, "spectrum", "4 · 何时可把 rho* 变成 TV 上界？", [
        { value: "reversible", label: "可逆且条件齐全" },
        { value: "arbitrary", label: "任意有限链" },
        { value: "stationary", label: "只要有 π" }
      ]);
      shell.appendChild(questions);
      var actions = element(doc, "div", { className: "mc-actions" }, []);
      var reveal = element(doc, "button", {
        type: "button",
        className: "mc-primary",
        disabled: revealed || !predictionComplete()
      }, [revealed ? "账本已揭示" : "提交预测并揭示"]);
      reveal.addEventListener("click", function () {
        if (!predictionComplete()) return;
        var answers = {
          stationary: "invariance",
          convergence: "yes",
          periodic: "yes-no",
          spectrum: "reversible"
        };
        score = Object.keys(answers).reduce(function (total, key) {
          return total + (prediction[key] === answers[key] ? 1 : 0);
        }, 0);
        revealed = true;
        renderGate();
        announce("预测已提交；结构、TV、细致平衡和谱账本已揭示。");
      });
      var reset = element(doc, "button", { type: "button" }, [revealed ? "重新预测" : "重置"]);
      reset.addEventListener("click", resetToGate);
      actions.appendChild(reveal);
      actions.appendChild(reset);
      shell.appendChild(actions);
      shell.appendChild(element(doc, "p", {
        className: "mc-feedback " + (revealed ? (score === 4 ? "mc-pass" : "mc-warn") : ""),
        "aria-live": "polite"
      }, [
        !predictionComplete()
          ? "请为四个判断各选一项。"
          : revealed
            ? "预测得分 " + score + "/4；下面打开透明账本。"
            : "四项预测已记录，点击提交后才显示结果。"
      ]));
      if (revealed) buildRevealed();
    }

    function buildRevealed() {
      var panel = element(doc, "section", { className: "mc-revealed" }, [
        element(doc, "h4", {}, ["结果与透明账本"]),
        element(doc, "p", { className: "mc-note" }, [
          "当前平稳分布是预设中的一个精确代表；可约链的完整平稳族会在结构栏单独标出。"
        ])
      ]);
      var layout = element(doc, "div", { className: "mc-layout" }, []);
      var controls = element(doc, "div", { className: "mc-controls" }, []);
      var stage = element(doc, "div", { className: "mc-stage" }, []);
      controls.appendChild(buttonGroup(
        doc,
        "链的结构预设",
        PRESETS.map(function (preset) { return { value: preset.id, label: preset.label }; }),
        state.presetId,
        function (value) { state.presetId = value; state.initialIndex = 0; renderGate(); },
        "mc-preset-grid"
      ));
      var preset = presetById(state.presetId);
      controls.appendChild(buttonGroup(
        doc,
        "初始点质量",
        preset.matrix.map(function (_, index) { return { value: index, label: "δ" + index }; }),
        state.initialIndex,
        function (value) { state.initialIndex = value; renderGate(); },
        "mc-option-grid"
      ));
      var timeId = uid + "-time";
      var timeOutput = element(doc, "output", { for: timeId }, [String(state.time)]);
      var timeInput = element(doc, "input", {
        id: timeId,
        type: "range",
        min: "0",
        max: "12",
        step: "1",
        value: String(state.time),
        "aria-label": "时间 t"
      });
      timeInput.addEventListener("input", function () {
        state.time = Number(timeInput.value);
        timeOutput.textContent = String(state.time);
        renderResults();
      });
      controls.appendChild(element(doc, "div", { className: "mc-control" }, [
        element(doc, "label", { htmlFor: timeId }, ["时间 t = ", timeOutput]),
        timeInput
      ]));
      var reset = element(doc, "button", { type: "button" }, ["重置实验"]);
      reset.addEventListener("click", resetToGate);
      controls.appendChild(reset);
      layout.appendChild(controls);
      layout.appendChild(stage);
      panel.appendChild(layout);
      shell.appendChild(panel);
      renderResults();

      function renderResults() {
        var data = compute(state);
        clear(stage);
        var cert = data.spectralCertificate;
        var metrics = element(doc, "div", { className: "mc-metrics" }, [
          metric(doc, "结构", data.structure.irreducible ? (data.structure.aperiodic ? "不可约 / d=1" : "不可约 / d=" + data.structure.period) : "可约"),
          metric(doc, "πP−π 的 L1 残差", format(data.stationaryResidual, 10)),
          metric(doc, "细致平衡残差", format(data.detailedBalanceResidual, 10)),
          metric(doc, "可逆性", data.reversible ? "通过" : "失败"),
          metric(doc, "ρ* / 绝对谱隙", format(data.spectrum.rhoStar, 5) + " / " + format(data.spectrum.absoluteGap, 5)),
          metric(doc, "TV(μ_t,π)", format(data.tv, 8)),
          metric(doc, "谱 TV 证书", cert.available ? "可用" : "不适用")
        ]);
        stage.appendChild(metrics);
        var frame = element(doc, "div", { className: "mc-stage-frame" }, [
          element(doc, "div", { className: "mc-stage-title" }, [
            element(doc, "strong", {}, [data.preset.label]),
            element(doc, "span", {}, ["μ_" + data.time + " = " + formatVector(data.distribution)])
          ])
        ]);
        frame.appendChild(drawSvg(doc, data, uid));
        frame.appendChild(element(doc, "div", { className: "mc-legend" }, [
          element(doc, "span", {}, [element(doc, "i", { className: "mc-swatch mc-swatch-blue" }, []), "TV 轨迹"]),
          element(doc, "span", {}, [element(doc, "i", { className: "mc-swatch mc-swatch-gold" }, []), "平稳分布"]),
          element(doc, "span", {}, [element(doc, "i", { className: "mc-swatch mc-swatch-red" }, []), "当前 t"])
        ]));
        stage.appendChild(frame);
        var spectralText = cert.available
          ? "TV ≤ " + format(cert.initialFactor, 5) + " × " + format(cert.rhoStar, 5) + "^t = " + format(cert.bound, 8) + "；这是可逆 L2(pi) 证书。"
          : cert.reason;
        var rows = [
          ["P^t", formatMatrix(data.power), "每行和 " + formatVector(data.rowSums)],
          ["μ_t", formatVector(data.distribution), "从 δ" + data.initialIndex + " 出发"],
          ["π", formatVector(data.stationary), data.preset.family],
          ["结构", data.structure.classes.map(function (states) { return "{" + states.join(",") + "}"; }).join("；"), data.preset.note],
          ["特征值", data.spectrum.eigenvalues.map(formatEigen).join("，"), "ρ*=" + format(data.spectrum.rhoStar, 6)],
          ["细致平衡", format(data.detailedBalanceResidual, 10), data.reversible ? "π_i P_ij = π_j P_ji" : "不能用可逆链谱理论"],
          ["谱证书", cert.available ? format(cert.bound, 8) : "—", spectralText]
        ];
        stage.appendChild(element(doc, "div", { className: "mc-table-wrap" }, [
          tableElement(doc, "Markov 逐项审计账本", ["检查", "读数", "解释"], rows)
        ]));
        var interpretation;
        if (data.preset.id === "mixing") {
          interpretation = "当前链不可约且非周期，且确实可逆；本 toy 从 δ" + data.initialIndex + " 的 TV 还可精确对账。";
        } else if (data.preset.id === "periodic") {
          interpretation = "当前链有唯一 π，但 d=3 的循环模式不衰减；平稳残差为零不能替 TV 收敛。";
        } else {
          interpretation = "当前链有两个闭类；改变初始状态会改变长期闭类，代表 π 只是平稳族中的一个成员。";
        }
        stage.appendChild(element(doc, "p", { className: "mc-interpretation", "aria-live": "polite" }, [interpretation]));
      }
    }

    function resetToGate() {
      state = { presetId: DEFAULT.presetId, time: DEFAULT.time, initialIndex: DEFAULT.initialIndex };
      prediction = { stationary: null, convergence: null, periodic: null, spectrum: null };
      revealed = false;
      score = 0;
      renderGate();
      announce("Markov 收敛实验已重置；请重新完成四项预测。");
    }

    renderGate();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    PRESETS.forEach(function (preset) {
      validateMatrix(preset.matrix);
      var structure = structureOf(preset.matrix);
      var spectrum = spectralInfo(preset.matrix);
      assert(structure.classes.length >= 1, preset.id + " has communicating classes");
      assert(spectrum.eigenvalues.length === preset.matrix.length, preset.id + " spectrum length");
      assert(stationaryResidual(preset.matrix, preset.stationary) < 1e-12, preset.id + " stationary residual");
      assert(preset.matrix.every(function (row) { return near(sum(row), 1, 1e-12); }), preset.id + " row stochastic");
    });
    var mixing = compute({ presetId: "mixing", time: 4, initialIndex: 0 });
    assert(mixing.structure.irreducible, "mixing irreducible");
    assert(mixing.structure.aperiodic && mixing.structure.period === 1, "mixing aperiodic");
    assert(near(mixing.power[0][0], 0.625, 1e-12), "mixing P^4 entry");
    assert(near(mixing.distribution[0], 0.625, 1e-12), "mixing distribution");
    assert(near(mixing.tv, 0.4 * Math.pow(0.5, 4), 1e-12), "mixing exact TV");
    assert(mixing.reversible, "mixing detailed balance");
    assert(near(mixing.spectrum.rhoStar, 0.5, 1e-12), "mixing rho star");
    assert(mixing.spectralCertificate.available, "mixing spectral certificate");
    assert(mixing.spectralCertificate.bound >= mixing.tv - 1e-12, "mixing bound dominates TV");
    var unnormalized = spectralCertificate(
      PRESETS[0].matrix,
      [0.9, 0.6],
      0,
      20,
      mixing.structure,
      mixing.spectrum
    );
    assert(!unnormalized.available && unnormalized.reason.indexOf("归一化") !== -1,
      "unnormalized invariant vector is not a probability certificate");
    assert(!isReversible(PRESETS[0].matrix, [0.9, 0.6]), "reversibility requires a probability distribution");

    var periodic = compute({ presetId: "periodic", time: 1, initialIndex: 0 });
    assert(periodic.structure.irreducible, "periodic irreducible");
    assert(!periodic.structure.aperiodic && periodic.structure.period === 3, "periodic period three");
    assert(near(periodic.distribution[1], 1, 1e-12), "periodic one step");
    assert(near(periodic.tv, 2 / 3, 1e-12), "periodic TV");
    assert(!periodic.reversible, "periodic detailed balance fails");
    assert(near(periodic.spectrum.rhoStar, 1, 1e-12), "periodic rho star");
    assert(!periodic.spectralCertificate.available, "periodic no certificate");
    assert(periodic.trajectory.every(function (row) { return near(row.tv, 2 / 3, 1e-12); }), "periodic TV trajectory");

    var reducible = compute({ presetId: "reducible", time: 1, initialIndex: 2 });
    assert(!reducible.structure.irreducible, "reducible structure");
    assert(reducible.structure.closedClasses.length === 2, "reducible closed classes");
    assert(near(reducible.distribution[0], 0.5, 1e-12), "reducible transient split");
    assert(near(reducible.distribution[1], 0.5, 1e-12), "reducible transient split second state");
    assert(near(reducible.stationaryResidual, 0, 1e-12), "reducible selected stationary residual");
    assert(near(reducible.detailedBalanceResidual, 0, 1e-12), "reducible selected detailed balance");
    assert(!reducible.spectralCertificate.available, "reducible no certificate");
    var absorbingZero = compute({ presetId: "reducible", time: 8, initialIndex: 0 });
    var absorbingOne = compute({ presetId: "reducible", time: 8, initialIndex: 1 });
    assert(near(absorbingZero.distribution[0], 1, 1e-12), "absorbing zero");
    assert(near(absorbingOne.distribution[1], 1, 1e-12), "absorbing one");
    var identityPower = matrixPower(PRESETS[0].matrix, 0);
    assert(near(identityPower[0][0], 1, 1e-12) && near(identityPower[1][1], 1, 1e-12), "P zero identity");
    return { checks: checks, presets: PRESETS.length };
  }

  function formatMatrix(matrix) {
    return "[" + matrix.map(function (row) { return "[" + row.map(function (value) { return format(value, 4); }).join(",") + "]"; }).join("; ") + "]";
  }

  return {
    DEFAULT: DEFAULT,
    PRESETS: PRESETS,
    matrixPower: matrixPower,
    structureOf: structureOf,
    eigenvaluesOf: eigenvaluesOf,
    spectralInfo: spectralInfo,
    stationaryResidual: stationaryResidual,
    detailedBalanceResidual: detailedBalanceResidual,
    isReversible: isReversible,
    spectralCertificate: spectralCertificate,
    totalVariation: totalVariation,
    compute: compute,
    mount: mount,
    selfTest: selfTest
  };
});

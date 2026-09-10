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
  var DEFAULT = Object.freeze({ presetId: "mixing", time: 4, initialIndex: 0 });

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

  PRESETS.push(
    {id:"lazy-cycle",label:"非可逆，也能混合",matrix:[[.5,.5,0],[0,.5,.5],[.5,0,.5]],stationary:[1/3,1/3,1/3],family:"唯一平稳分布",note:"有自环的单向三循环；不可约非周期，却不满足细致平衡。"},
    {id:"reversible-periodic",label:"可逆，却有周期",matrix:[[0,1],[1,0]],stationary:[.5,.5],family:"唯一平稳分布",note:"二状态互换；细致平衡成立，周期仍为2。"},
    {id:"unique-absorbing",label:"可约，也能同极限",matrix:[[1,0],[1,0]],stationary:[1,0],family:"唯一平稳分布 δ₀",note:"只有一个闭吸收类；从任意初态一步到 δ₀。"}
  );
  PRESETS.forEach(function (p) {p.matrix.forEach(Object.freeze);Object.freeze(p.matrix);Object.freeze(p.stationary);Object.freeze(p);});
  Object.freeze(PRESETS);
  function integer(value,lo,hi,label) {
    if(!Number.isInteger(value)||value<lo||value>hi)throw new RangeError(label+" must be an integer in ["+lo+","+hi+"]");
    return value;
  }

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

  STYLE_TEXT += "\n.mc-lab .mc-layout{grid-template-columns:minmax(0,1fr)}.mc-lab .mc-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.mc-lab .mc-stage-frame{overflow:visible}.mc-lab .mc-scroll{max-width:100%;overflow-x:auto}.mc-lab .mc-svg{width:720px;min-width:720px;max-width:none}.mc-lab table{display:table!important;overflow:visible!important;max-width:none!important}.mc-lab .mc-average{fill:none;stroke:var(--mc-green);stroke-width:2.5;stroke-dasharray:7 4}.mc-lab .mc-bound{fill:none;stroke:var(--mc-gold);stroke-width:2;stroke-dasharray:3 4}.mc-lab .mc-scroll:focus-visible,.mc-lab .mc-table-wrap:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}@media(max-width:600px){.mc-lab .mc-controls{grid-template-columns:minmax(0,1fr)}}@media(prefers-reduced-motion:reduce){html:has(.mc-lab){scroll-behavior:auto!important}}";

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
    validateMatrix(matrix);
    var power = integer(exponent,0,4096,"exponent");
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
    if (!Array.isArray(matrix) || matrix.length === 0 || matrix.length > 32) throw new RangeError("matrix must be non-empty");
    var size = matrix.length;
    matrix.forEach(function (row) {
      if (!Array.isArray(row) || row.length !== size) throw new RangeError("matrix must be square");
      row.forEach(function (value) {
        if (!finite(value) || value < 0 || value > 1) throw new RangeError("matrix entries must be nonnegative");
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
          if (!seen[next] && matrix[current][next] > 0) {
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
        if (matrix[current][next] > 0 && distance[next] === undefined) {
          distance[next] = distance[current] + 1;
          queue.push(next);
        }
      }
    }
    var period = 0;
    states.forEach(function (from) {
      states.forEach(function (to) {
        if (matrix[from][to] > 0 && distance[to] !== undefined) {
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
          if (states.indexOf(to) === -1 && matrix[from][to] > 0) closed = false;
        }
      });
      return { states: states, closed: closed, period: periodOfClass(matrix, states) };
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
      if (discriminant >= 0) {
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
    var nontrivial = eigenvalues.slice(1); // eigenvaluesOf explicitly places the known root 1 first.
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
    validateMatrix(matrix);
    var threshold = tolerance === undefined ? 1e-9 : tolerance;
    if(!finite(threshold)||threshold<0)throw new RangeError("tolerance must be finite and nonnegative");
    if (!Array.isArray(stationary) || stationary.length !== matrix.length) return false;
    if (!stationary.every(function (value) { return finite(value) && value >= 0; })) return false;
    if (Math.abs(sum(stationary) - 1) > threshold) return false;
    if (stationaryResidual(matrix, stationary) > threshold) return false;
    return detailedBalanceResidual(matrix, stationary) <= threshold;
  }

  function spectralCertificate(matrix, stationary, initialIndex, time, structure, spectrum) {
    validateMatrix(matrix);
    integer(initialIndex,0,matrix.length,"initialIndex"); integer(time,0,4096,"time");
    var info = structureOf(matrix);
    var spectral = spectralInfo(matrix);
    var validShape = Array.isArray(stationary) && stationary.length === matrix.length;
    var finiteNonnegative = validShape && stationary.every(function (value) { return finite(value) && value >= 0; });
    var normalized = finiteNonnegative && Math.abs(sum(stationary) - 1) <= 1e-9;
    var invariant = normalized && stationaryResidual(matrix, stationary) <= 1e-9;
    var reversible = invariant && isReversible(matrix, stationary);
    var fullSupport = invariant && stationary.every(function (value) { return value > 0; });
    var reason = "";
    if (!validShape) reason = "平稳向量维数不匹配，不能发概率证书。";
    else if (!finiteNonnegative) reason = "平稳向量必须由有限非负概率组成。";
    else if (!normalized) reason = "候选平稳向量没有归一化为概率分布。";
    else if (!invariant) reason = "候选概率不满足 pi P = pi。";
    else if (!reversible) reason = "细致平衡失败：不把 rho* 当作 TV 证书。";
    else if (!info.irreducible) reason = "本可逆谱证书要求不可约；当前链可约，需另行判断唯一性与收敛。";
    else if (!info.aperiodic) reason = "链有周期：rho*=1，不给逐步收敛证书。";
    else if (!fullSupport) reason = "平稳分布没有满支撑，当前 bound 的初始因子不适用。";
    else if (spectral.rhoStar >= 1) reason = "非平凡谱模不小于 1，不能给衰减证书。";
    // A small floating residual does not prove exact detailed balance.
    // Publish a theorem-backed numerical bound only for the prescribed, algebraically verified model.
    var known = PRESETS.some(function (p) {
      return JSON.stringify(p.matrix) === JSON.stringify(matrix) && JSON.stringify(p.stationary) === JSON.stringify(stationary);
    });
    if(!reason && !known) reason="数值残差通过，但这不是已给出精确代数证明的预设；不据容差自动发定理证书。";
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
    var index = initialIndex;
    var factor = index === stationary.length ? 0 : 0.5 * Math.sqrt((1-stationary[index])/stationary[index]);
    return {
      available: true,
      reversible: true,
      rhoStar: spectral.rhoStar,
      absoluteGap: spectral.absoluteGap,
      initialFactor: factor,
      bound: factor * Math.pow(spectral.rhoStar, time),
      reason: "预设的精确代数条件已核对；显示的是可逆 L2(pi) 理论上界的浮点求值，不是向外舍入的严格区间。"
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
    throw new RangeError("unknown preset");
  }

  function compute(options) {
    var settings = options === undefined ? {} : options;
    if(!settings||typeof settings!=="object"||Array.isArray(settings))throw new TypeError("configuration must be an object");
    var preset = presetById(settings.presetId === undefined ? DEFAULT.presetId : settings.presetId);
    var matrix = cloneMatrix(preset.matrix);
    var time = integer(settings.time === undefined ? DEFAULT.time : settings.time,0,12,"time");
    var initialIndex = integer(settings.initialIndex === undefined ? DEFAULT.initialIndex : settings.initialIndex,0,matrix.length,"initialIndex");
    var initial = initialIndex === matrix.length ? preset.stationary.slice() : delta(matrix.length,initialIndex);
    var power = matrixPower(matrix, time);
    var distribution = rowTimesMatrix(initial, power);
    var structure = structureOf(matrix);
    var spectrum = spectralInfo(matrix);
    var stationary = preset.stationary.slice();
    var trajectory = [];
    var sums = matrix.map(function(){return 0;});
    for (var step = 0; step <= 12; step += 1) {
      var stepDistribution = rowTimesMatrix(initial, matrixPower(matrix, step));
      stepDistribution.forEach(function(v,i){sums[i]+=v;});
      var average=sums.map(function(v){return v/(step+1);});
      trajectory.push({
        time: step,
        distribution: stepDistribution,
        tv: totalVariation(stepDistribution, stationary),
        average: average, averageTv: totalVariation(average,stationary)
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
      cesaro: trajectory[time].average,
      cesaroTv: trajectory[time].averageTv,
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
    var text=value.toFixed(places);
    return text.indexOf(".")<0?text:text.replace(/0+$/, "").replace(/\.$/, "");
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
        "aria-pressed": selected === choice.value ? "true" : "false",
        "data-option": label + "-" + choice.value
      }, [choice.label]);
      button.addEventListener("click", function () { onSelect(choice.value); var q=doc.querySelector('[data-option="' + label + '-' + choice.value + '"]'); if(q)q.focus({preventScroll:true}); });
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
      "蓝线为逐步分布TV，绿虚线为从0到t共t+1步的Cesàro平均TV；金点线仅在定理条件成立的预设显示谱上界。连线只辅助读离散时间点。右侧比较当前分布与π。"
    ]));
    var left = 48;
    var right = 355;
    var top = 42;
    var bottom = 250;
    var mapX = function (time) { return left + (right - left) * time / 12; };
    var mapY = function (value) { return bottom - (bottom - top) * value; };
    [0, 0.5, 1].forEach(function (value) {
      var y = mapY(value);
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: y, x2: right, y2: y, class: "mc-grid" }, []));
      svg.appendChild(svgElement(doc, "text", { x: left - 8, y: y + 4, "text-anchor": "end", "font-size": 11 }, [format(value, 1)]));
    });
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, class: "mc-axis" }, []));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, class: "mc-axis" }, []));
    svg.appendChild(svgElement(doc, "text", { x: left, y: 21, "font-size": 12, "font-weight": 700 }, ["TV(μ_t, π)"]));
    svg.appendChild(svgElement(doc, "text", { x: right, y: bottom + 25, "text-anchor": "end", "font-size": 11 }, ["t"]));
    [0,3,6,9,12].forEach(function(t){svg.appendChild(svgElement(doc,"text",{x:mapX(t),y:bottom+19,"text-anchor":"middle","font-size":12},[String(t)]));});
    var averagePath=data.trajectory.map(function(r,i){return(i?"L":"M")+mapX(r.time)+" "+mapY(r.averageTv);}).join(" ");
    svg.appendChild(svgElement(doc,"path",{d:averagePath,class:"mc-average"},[]));
    if(data.spectralCertificate.available){
      var cert=data.spectralCertificate;
      var boundPath=data.trajectory.map(function(r,i){return(i?"L":"M")+mapX(r.time)+" "+mapY(cert.initialFactor*Math.pow(cert.rhoStar,r.time));}).join(" ");
      svg.appendChild(svgElement(doc,"path",{d:boundPath,class:"mc-bound"},[]));
    }
    var path = data.trajectory.map(function (row, index) {
      return (index === 0 ? "M" : "L") + mapX(row.time) + " " + mapY(row.tv);
    }).join(" ");
    svg.appendChild(svgElement(doc, "path", { d: path, class: "mc-curve" }, []));
    data.trajectory.forEach(function (row) {
      svg.appendChild(svgElement(doc, "circle", {
        cx: mapX(row.time),
        cy: mapY(row.tv),
        r: row.time === data.time ? 5 : 3,
        "data-time": row.time, "data-tv": row.tv,
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
    var barY = function (value) { return chartBottom - (chartBottom - chartTop) * value; };
    svg.appendChild(svgElement(doc, "text", { x: chartLeft, y: 21, "font-size": 12, "font-weight": 700 }, ["μ_t 与 π"]));
    svg.appendChild(svgElement(doc, "line", { x1: chartLeft, y1: chartBottom, x2: chartRight, y2: chartBottom, class: "mc-axis" }, []));
    [0, 0.5, 1].forEach(function (value) {
      var yGrid = barY(value);
      svg.appendChild(svgElement(doc,"text",{x:chartLeft-8,y:yGrid+4,"text-anchor":"end","font-size":12},[format(value,1)]));
      svg.appendChild(svgElement(doc, "line", { x1: chartLeft, y1: yGrid, x2: chartRight, y2: yGrid, class: "mc-grid" }, []));
    });
    data.distribution.forEach(function (value, index) {
      var center = chartLeft + groupWidth * (index + 0.5);
      svg.appendChild(svgElement(doc, "rect", {
        x: center - barWidth - 2,
        y: barY(value),
        width: barWidth,
        height: chartBottom - barY(value),
        "data-state": index, "data-value": value, class: "mc-bar-mu"
      }, []));
      svg.appendChild(svgElement(doc, "rect", {
        x: center + 2,
        y: barY(data.stationary[index]),
        width: barWidth,
        height: chartBottom - barY(data.stationary[index]),
        "data-state": index, "data-value": data.stationary[index], class: "mc-bar-pi"
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
          "data-choice": key + "-" + option.value
        }, [option.label]);
        button.addEventListener("click", function () {
          prediction[key] = option.value; revealed=false;score=0;
          renderGate();
          shell.querySelector('[data-choice="' + key + '-' + option.value + '"]').focus({preventScroll:true});
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
          ? "预测已提交；可以切换链、初态和时间，逐项核对理论与浮点数值账本。"
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
        { value: "yes-no", label: "有 π，TV 仍可能不趋 0" },
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
        shell.querySelector(".mc-revealed").focus({preventScroll:true});
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
      var panel = element(doc, "section", { className: "mc-revealed", tabindex:"-1", "aria-label":"Markov 收敛结果与账本" }, [
        element(doc, "h4", {}, ["结果与透明账本"]),
        element(doc, "p", { className: "mc-note" }, [
          "预设平稳分布的代数关系见正文；残差与矩阵幂用浮点运算核对。图和账本可横向滚动，键盘聚焦区域后用左右方向键。可约链的平稳族另列。"
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
        "初始分布",
        preset.matrix.map(function (_, index) { return { value: index, label: "δ" + index }; }).concat([{value:preset.matrix.length,label:"所选 π"}]),
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
          metric(doc, "细致平衡数值核对", data.reversible ? "残差通过" : "残差不通过"),
          metric(doc, "ρ* / 绝对谱隙", format(data.spectrum.rhoStar, 5) + " / " + format(data.spectrum.absoluteGap, 5)),
          metric(doc, "TV(μ_t,π)", format(data.tv, 8)),
          metric(doc, "TV(Cesàro 平均,π)",format(data.cesaroTv,8)),
          metric(doc, "谱 TV 证书", cert.available ? "可用" : "不适用")
        ]);
        stage.appendChild(metrics);
        var frame = element(doc, "div", { className: "mc-stage-frame" }, [
          element(doc, "div", { className: "mc-stage-title" }, [
            element(doc, "strong", {}, [data.preset.label]),
            element(doc, "span", {}, ["μ_" + data.time + " = " + formatVector(data.distribution)])
          ])
        ]);
        frame.appendChild(element(doc,"div",{className:"mc-scroll",role:"region",tabindex:"0","aria-label":"收敛图表，可横向滚动"},[drawSvg(doc,data,uid)]));
        frame.appendChild(element(doc, "div", { className: "mc-legend" }, [
          element(doc, "span", {}, [element(doc, "i", { className: "mc-swatch mc-swatch-blue" }, []), "TV 轨迹"]),
          element(doc, "span", {}, ["绿虚线：Cesàro 平均 TV"]),
          element(doc, "span", {}, [element(doc, "i", { className: "mc-swatch mc-swatch-gold" }, []), "金点线：谱上界；金柱：π"]),
          element(doc, "span", {}, [element(doc, "i", { className: "mc-swatch mc-swatch-red" }, []), "当前 t"])
        ]));
        stage.appendChild(frame);
        var spectralText = cert.available
          ? "TV ≤ " + format(cert.initialFactor, 5) + " × " + format(cert.rhoStar, 5) + "^t = " + format(cert.bound, 8) + "；这是可逆 L2(pi) 证书。"
          : cert.reason;
        var rows = [
          ["P",formatMatrix(data.matrix),"原始一步矩阵；P⁰=I"],
          ["P^t", formatMatrix(data.power), "每行和 " + formatVector(data.rowSums)],
          ["μ_t", formatVector(data.distribution), "初始分布 "+formatVector(data.initial)],
          ["Cesàro 平均",formatVector(data.cesaro),"平均 μ₀,…,μ_t 共 "+(data.time+1)+" 项；TV="+format(data.cesaroTv,8)],
          ["π", formatVector(data.stationary), data.preset.family],
          ["结构", data.structure.classes.map(function (states) { return "{" + states.join(",") + "}"; }).join("；"), data.preset.note],
          ["特征值", data.spectrum.eigenvalues.map(formatEigen).join("，"), "ρ*=" + format(data.spectrum.rhoStar, 6)],
          ["细致平衡", format(data.detailedBalanceResidual, 10), data.reversible ? "π_i P_ij = π_j P_ji" : "不能用可逆链谱理论"],
          ["谱证书", cert.available ? format(cert.bound, 8) : "—", spectralText]
        ];
        stage.appendChild(element(doc, "div", { className: "mc-table-wrap", role:"region", tabindex:"0", "aria-label":"收敛账本，可横向滚动" }, [
          tableElement(doc, "Markov 逐项审计账本", ["检查", "读数", "解释"], rows)
        ]));
        var interpretation = data.preset.note + " 初态为 " + formatVector(data.initial) + "。";
        if(data.initialIndex===data.matrix.length)interpretation+="从所选 π 出发，逐步分布和平均都保持 π；数值可能有舍入残差。";
        else if(data.preset.id==="lazy-cycle")interpretation+="细致平衡失败不妨碍分布收敛；本页的可逆谱公式不适用，不能据此宣布不混合。";
        else if(data.preset.id==="periodic"||data.preset.id==="reversible-periodic")interpretation+="点质量初态的逐步TV不衰减，Cesàro平均却趋π。";
        else if(data.preset.id==="reducible")interpretation+="到所选 π 的TV不趋0，并不等于分布本身没有极限。";
        else if(data.preset.id==="unique-absorbing")interpretation+="这里有唯一极限，但不可约条件不成立；充分条件不是必要条件。";
        else interpretation+="蓝线是实际TV；金线是带初态因子的上界，并非两条相等的曲线。";
        stage.appendChild(element(doc, "p", { className: "mc-interpretation", "aria-live": "polite" }, [interpretation]));
      }
    }

    function resetToGate() {
      state = { presetId: DEFAULT.presetId, time: DEFAULT.time, initialIndex: DEFAULT.initialIndex };
      prediction = { stationary: null, convergence: null, periodic: null, spectrum: null };
      revealed = false;
      score = 0;
      renderGate();
      shell.querySelector("[data-choice]").focus({preventScroll:true});
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
    PRESETS.forEach(function(p) {
      var r=compute({presetId:p.id,time:12,initialIndex:p.matrix.length});
      assert(near(r.tv,0,1e-12)&&near(r.cesaroTv,0,1e-12),"stationary initial: "+p.id);
    });
    var lazy=compute({presetId:"lazy-cycle",time:12});
    assert(lazy.structure.aperiodic&&!lazy.reversible&&lazy.tv<.001,"nonreversible mixing counterexample");
    assert(!lazy.spectralCertificate.available,"no reversible bound for lazy directed cycle");
    var revperiodic=compute({presetId:"reversible-periodic",time:3});
    assert(revperiodic.reversible&&revperiodic.structure.period===2&&!revperiodic.spectralCertificate.available,"reversible is not aperiodic");
    assert(revperiodic.cesaroTv===0&&revperiodic.tv===.5,"average and step differ");
    var unique=compute({presetId:"unique-absorbing",time:1,initialIndex:1});
    assert(!unique.structure.irreducible&&unique.tv===0,"reducible unique limit");
    assert(format(0,0)==="0"&&format(10,0)==="10","integer labels keep zeros");
    assert(structureOf([[0,1,0],[1e-300,0,1],[0,1,0]]).period===2,"positive tiny edge retained");
    return { checks: checks, presets: PRESETS.length };
  }

  function formatMatrix(matrix) {
    return "[" + matrix.map(function (row) { return "[" + row.map(function (value) { return format(value, 4); }).join(",") + "]"; }).join("; ") + "]";
  }

  return {
    drawSvg: drawSvg,
    format: format,
    validateMatrix: validateMatrix,
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

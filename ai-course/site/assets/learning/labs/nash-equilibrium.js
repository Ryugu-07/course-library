(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("nash-equilibrium", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("nash-equilibrium self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)\n");
    } catch (error) {
      process.stderr.write("nash-equilibrium self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-nash-equilibrium-styles";
  var EPS = 1e-9;
  var RELATIVE_EPS = 8 * Number.EPSILON;
  var ULP_FACTOR = 4;
  var INSTANCE = 0;

  var PRESETS = [
    {
      id: "dominant",
      label: "预设 A",
      rowLabels: ["合作", "背叛"],
      columnLabels: ["合作", "背叛"],
      payoffs: [
        [[3, 3], [0, 5]],
        [[5, 0], [1, 1]]
      ]
    },
    {
      id: "coordination",
      label: "预设 B",
      rowLabels: ["左", "右"],
      columnLabels: ["左", "右"],
      payoffs: [
        [[4, 4], [0, 0]],
        [[0, 0], [2, 2]]
      ]
    },
    {
      id: "matching-pennies",
      label: "预设 C",
      rowLabels: ["正面", "反面"],
      columnLabels: ["正面", "反面"],
      payoffs: [
        [[1, -1], [-1, 1]],
        [[-1, 1], [1, -1]]
      ]
    },
    {
      id: "degenerate",
      label: "预设 D",
      rowLabels: ["甲", "乙"],
      columnLabels: ["左", "右"],
      payoffs: [
        [[1, 3], [1, 0]],
        [[1, 3], [1, 0]]
      ]
    }
  ];

  var DEFAULT = { presetId: "dominant" };

  var STYLE_TEXT = [
    ".nash-lab{--nash-blue:var(--cl-blue,#315f9d);--nash-gold:var(--cl-gold,#9b6a12);--nash-green:var(--cl-green,#39734d);--nash-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
    ".nash-lab *,.nash-lab *::before,.nash-lab *::after{box-sizing:border-box}.nash-lab [hidden]{display:none!important}.nash-lab h3,.nash-lab h4{margin:0;color:var(--fg);letter-spacing:0}.nash-lab h3{font-size:1.18rem}.nash-lab h4{font-size:1rem}",
    ".nash-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.nash-lab button:hover{border-color:var(--accent)}.nash-lab button[aria-pressed='true'],.nash-lab button.nash-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.nash-lab button:disabled{cursor:not-allowed;opacity:.55}.nash-lab button:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
    ".nash-lab .nash-note,.nash-lab .nash-feedback{color:var(--fg-soft);font-size:13px;line-height:1.7}.nash-lab .nash-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--nash-gold);background:var(--bg)}.nash-lab fieldset{min-width:0;margin:0;padding:0;border:0}.nash-lab legend{margin-bottom:8px;color:var(--fg-soft);font-size:13px;font-weight:750}.nash-lab .nash-preset-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.nash-lab .nash-preset-grid button,.nash-lab .nash-choice-grid button{font-size:12px}.nash-lab .nash-question-list{display:grid;gap:10px;margin-top:13px}.nash-lab .nash-question{min-width:0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.nash-lab .nash-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:7px}.nash-lab .nash-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.nash-lab .nash-actions>*{flex:1 1 170px}.nash-lab .nash-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.nash-lab .nash-pass{color:var(--nash-green)}.nash-lab .nash-warn{color:var(--nash-red)}",
    ".nash-lab .nash-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.nash-lab .nash-layout{display:grid;grid-template-columns:minmax(230px,.7fr) minmax(0,1.3fr);gap:16px;align-items:start;min-width:0}.nash-lab .nash-stage,.nash-lab .nash-ledger{min-width:0}.nash-lab .nash-stage-frame{padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch}.nash-lab .nash-svg{display:block;width:100%;min-width:560px;height:auto;color:var(--fg)}.nash-lab .nash-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.nash-lab .nash-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:8px;margin:12px 0}.nash-lab .nash-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.nash-lab .nash-metric:nth-child(1),.nash-lab .nash-metric:nth-child(4){border-top-color:var(--nash-blue)}.nash-lab .nash-metric:nth-child(2),.nash-lab .nash-metric:nth-child(5){border-top-color:var(--nash-gold)}.nash-lab .nash-metric:nth-child(3),.nash-lab .nash-metric:nth-child(6){border-top-color:var(--nash-green)}.nash-lab .nash-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4}.nash-lab .nash-metric strong{display:block;margin-top:3px;color:var(--fg);font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.nash-lab .nash-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.nash-lab table{width:100%;min-width:680px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.nash-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft);font-size:12px;line-height:1.55}.nash-lab th,.nash-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.nash-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750}.nash-lab .nash-good{color:var(--nash-green);font-weight:750}.nash-lab .nash-warn{color:var(--nash-red);font-weight:750}.nash-lab .nash-interpretation{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--nash-green);background:var(--bg);font-size:13px;line-height:1.7}",
    "@media(max-width:900px){.nash-lab .nash-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:760px){.nash-lab .nash-preset-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.nash-lab .nash-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:430px){.nash-lab .nash-preset-grid{grid-template-columns:minmax(0,1fr)}.nash-lab .nash-stage-frame{padding:5px}}@media(prefers-reduced-motion:reduce){.nash-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(Math.abs(left), Math.abs(right));
    var relative = tolerance === undefined ? EPS : tolerance;
    return Math.abs(left - right) <= relative * Math.max(scale, Number.MIN_VALUE) +
      ULP_FACTOR * Math.max(ulp(left), ulp(right));
  }

  function ulp(value) {
    if (!finite(value)) return Infinity;
    if (value === 0) return Number.MIN_VALUE;
    return Math.max(Number.MIN_VALUE, Math.abs(value) * Number.EPSILON);
  }

  function scalarStats(values) {
    var minimum = Math.min.apply(Math, values);
    var maximum = Math.max.apply(Math, values);
    return {
      minimum: minimum,
      maximum: maximum,
      range: maximum - minimum,
      ulp: values.reduce(function (maximumUlp, value) {
        return Math.max(maximumUlp, ulp(value));
      }, Number.MIN_VALUE)
    };
  }

  function payoffStats(game, player) {
    var values = [];
    for (var row = 0; row < 2; row += 1) {
      for (var column = 0; column < 2; column += 1) {
        values.push(payoff(game, row, column, player));
      }
    }
    return scalarStats(values);
  }

  function differenceTolerance(stats, values) {
    var rounding = Math.max(stats ? stats.ulp : Number.MIN_VALUE,
      (values || []).reduce(function (maximumUlp, value) {
        return Math.max(maximumUlp, ulp(value));
      }, Number.MIN_VALUE));
    var range = stats && finite(stats.range) ? Math.abs(stats.range) : 0;
    return RELATIVE_EPS * range + ULP_FACTOR * rounding;
  }

  function differenceSign(value, stats, values) {
    var tolerance = differenceTolerance(stats, values || [value]);
    if (value > tolerance) return 1;
    if (value < -tolerance) return -1;
    return 0;
  }

  function compareValues(left, right, stats) {
    return differenceSign(left - right, stats, [left, right]);
  }

  function isZeroDifference(value, stats, values) {
    return differenceSign(value, stats, values) === 0;
  }

  function clampProbability(value) {
    var result = clamp(value, 0, 1);
    if (near(result, 0, EPS)) return 0;
    if (near(result, 1, EPS)) return 1;
    return result;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function copy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function presetById(id) {
    for (var index = 0; index < PRESETS.length; index += 1) {
      if (PRESETS[index].id === id) return PRESETS[index];
    }
    return PRESETS[0];
  }

  function normalizeGame(input) {
    var source = input || {};
    var preset = presetById(source.presetId || DEFAULT.presetId);
    var raw = source.payoffs || preset.payoffs;
    if (!Array.isArray(raw) || raw.length !== 2 || raw.some(function (row) {
      return !Array.isArray(row) || row.length !== 2;
    })) throw new RangeError("payoffs must be a 2x2 array");
    var payoffs = raw.map(function (row) {
      return row.map(function (cell) {
        if (!Array.isArray(cell) || cell.length !== 2 || !finite(Number(cell[0])) || !finite(Number(cell[1]))) {
          throw new RangeError("each payoff cell must contain two finite numbers");
        }
        return [Number(cell[0]), Number(cell[1])];
      });
    });
    return {
      id: source.id || preset.id,
      label: source.label || preset.label,
      rowLabels: copy(source.rowLabels || preset.rowLabels),
      columnLabels: copy(source.columnLabels || preset.columnLabels),
      payoffs: payoffs
    };
  }

  function payoff(game, row, column, player) {
    return game.payoffs[row][column][player];
  }

  function expectedPayoffs(game, p, q) {
    var result = [0, 0];
    for (var row = 0; row < 2; row += 1) {
      for (var column = 0; column < 2; column += 1) {
        var probability = (row === 0 ? p : 1 - p) * (column === 0 ? q : 1 - q);
        result[0] += probability * payoff(game, row, column, 0);
        result[1] += probability * payoff(game, row, column, 1);
      }
    }
    return result;
  }

  function rowDifference(game, q) {
    return q * (payoff(game, 0, 0, 0) - payoff(game, 1, 0, 0)) +
      (1 - q) * (payoff(game, 0, 1, 0) - payoff(game, 1, 1, 0));
  }

  function columnDifference(game, p) {
    return p * (payoff(game, 0, 0, 1) - payoff(game, 0, 1, 1)) +
      (1 - p) * (payoff(game, 1, 0, 1) - payoff(game, 1, 1, 1));
  }

  function bestResponses(game) {
    var rowStats = payoffStats(game, 0);
    var columnStats = payoffStats(game, 1);
    var rowByColumn = [];
    var columnByRow = [];
    for (var column = 0; column < 2; column += 1) {
      var rowValues = [payoff(game, 0, column, 0), payoff(game, 1, column, 0)];
      var rowComparison = compareValues(rowValues[0], rowValues[1], rowStats);
      rowByColumn.push(rowComparison === 0 ? [0, 1] : rowComparison > 0 ? [0] : [1]);
    }
    for (var row = 0; row < 2; row += 1) {
      var columnValues = [payoff(game, row, 0, 1), payoff(game, row, 1, 1)];
      var columnComparison = compareValues(columnValues[0], columnValues[1], columnStats);
      columnByRow.push(columnComparison === 0 ? [0, 1] : columnComparison > 0 ? [0] : [1]);
    }
    return {
      rowByColumn: rowByColumn,
      columnByRow: columnByRow,
      forRowPlayer: rowByColumn,
      forColumnPlayer: columnByRow
    };
  }

  function pureEquilibria(game) {
    var responses = bestResponses(game);
    var result = [];
    for (var row = 0; row < 2; row += 1) {
      for (var column = 0; column < 2; column += 1) {
        if (responses.rowByColumn[column].indexOf(row) >= 0 &&
            responses.columnByRow[row].indexOf(column) >= 0) {
          result.push({
            row: row,
            column: column,
            p: row === 0 ? 1 : 0,
            q: column === 0 ? 1 : 0,
            payoffs: [payoff(game, row, column, 0), payoff(game, row, column, 1)]
          });
        }
      }
    }
    return result;
  }

  function linearInterval(valueAtZero, valueAtOne, sign, stats) {
    var first = sign * valueAtZero;
    var last = sign * valueAtOne;
    var firstSign = differenceSign(first, stats, [valueAtZero]);
    var lastSign = differenceSign(last, stats, [valueAtOne]);
    if (firstSign >= 0 && lastSign >= 0) return [0, 1];
    if (firstSign < 0 && lastSign < 0) return null;
    var denominator = first - last;
    if (isZeroDifference(denominator, stats, [first, last])) return firstSign >= 0 ? [0, 1] : null;
    var crossing = clampProbability(first / denominator);
    return firstSign >= 0 ? [0, crossing] : [crossing, 1];
  }

  function linearZeroSet(valueAtZero, valueAtOne, stats) {
    var firstSign = differenceSign(valueAtZero, stats, [valueAtZero]);
    var lastSign = differenceSign(valueAtOne, stats, [valueAtOne]);
    if (firstSign === 0 && lastSign === 0) return [0, 1];
    if (firstSign === 0) return [0, 0];
    if (lastSign === 0) return [1, 1];
    if (firstSign === lastSign) return null;
    var denominator = valueAtZero - valueAtOne;
    if (isZeroDifference(denominator, stats, [valueAtZero, valueAtOne])) return null;
    var root = valueAtZero / denominator;
    if (root < -EPS || root > 1 + EPS) return null;
    root = clampProbability(root);
    return [root, root];
  }

  function addFamily(families, pRange, qRange, description) {
    if (!pRange || !qRange) return;
    if (pRange[1] - pRange[0] <= EPS && qRange[1] - qRange[0] <= EPS) return;
    var signature = pRange.map(function (value) { return value.toFixed(10); }).join(",") +
      "|" + qRange.map(function (value) { return value.toFixed(10); }).join(",");
    if (families.some(function (family) { return family.signature === signature; })) return;
    families.push({
      type: pRange[1] - pRange[0] > EPS && qRange[1] - qRange[0] > EPS ? "region" :
        pRange[1] - pRange[0] > EPS ? "p-line" : "q-line",
      pRange: pRange,
      qRange: qRange,
      description: description,
      signature: signature
    });
  }

  function mixedEquilibrium(input) {
    var game = normalizeGame(input);
    var rowStats = payoffStats(game, 0);
    var columnStats = payoffStats(game, 1);
    var a00 = payoff(game, 0, 0, 0);
    var a01 = payoff(game, 0, 1, 0);
    var a10 = payoff(game, 1, 0, 0);
    var a11 = payoff(game, 1, 1, 0);
    var b00 = payoff(game, 0, 0, 1);
    var b01 = payoff(game, 0, 1, 1);
    var b10 = payoff(game, 1, 0, 1);
    var b11 = payoff(game, 1, 1, 1);
    var rowAtColumn0 = a00 - a10;
    var rowAtColumn1 = a01 - a11;
    var columnAtRow0 = b00 - b01;
    var columnAtRow1 = b10 - b11;
    var rowDenominator = rowAtColumn0 - rowAtColumn1;
    var columnDenominator = columnAtRow0 - columnAtRow1;
    var q = isZeroDifference(rowDenominator, rowStats, [rowAtColumn0, rowAtColumn1])
      ? null : -rowAtColumn1 / rowDenominator;
    var p = isZeroDifference(columnDenominator, columnStats, [columnAtRow0, columnAtRow1])
      ? null : -columnAtRow1 / columnDenominator;
    var interior = p !== null && q !== null && p > EPS && p < 1 - EPS && q > EPS && q < 1 - EPS &&
      isZeroDifference(rowDifference(game, q), rowStats, [rowAtColumn0, rowAtColumn1]) &&
      isZeroDifference(columnDifference(game, p), columnStats, [columnAtRow0, columnAtRow1]);
    var boundary = p !== null && q !== null && p >= -EPS && p <= 1 + EPS && q >= -EPS && q <= 1 + EPS && !interior
      ? { p: clampProbability(p), q: clampProbability(q),
        payoffs: expectedPayoffs(game, clampProbability(p), clampProbability(q)) }
      : null;
    var families = [];
    var rowZeroSet = linearZeroSet(rowAtColumn1, rowAtColumn0, rowStats);
    var columnZeroSet = linearZeroSet(columnAtRow1, columnAtRow0, columnStats);
    var rowIsIndifferentEverywhere = rowZeroSet && rowZeroSet[1] - rowZeroSet[0] > EPS;
    var columnIsIndifferentEverywhere = columnZeroSet && columnZeroSet[1] - columnZeroSet[0] > EPS;

    if (rowIsIndifferentEverywhere && columnIsIndifferentEverywhere) {
      addFamily(families, [0, 1], [0, 1], "双方在所有混合概率上都无差异：整个单位方形都是 Nash 均衡。");
    } else if (rowIsIndifferentEverywhere) {
      addFamily(families, linearInterval(columnAtRow1, columnAtRow0, -1, columnStats), [0, 0],
        "行玩家在所有 q 上无差异；q=0 时列玩家的最佳回应是一段区间。");
      addFamily(families, linearInterval(columnAtRow1, columnAtRow0, 1, columnStats), [1, 1],
        "行玩家在所有 q 上无差异；q=1 时列玩家的最佳回应是一段区间。");
      if (columnZeroSet) {
        addFamily(families, columnZeroSet, [0, 1],
          "行玩家在所有 q 上无差异；列玩家在该 p 上也无差异，形成竖直交叉线。");
      }
    } else if (columnIsIndifferentEverywhere) {
      addFamily(families, [0, 0], linearInterval(rowAtColumn1, rowAtColumn0, -1, rowStats),
        "列玩家在所有 p 上无差异；p=0 时行玩家的最佳回应是一段区间。");
      addFamily(families, [1, 1], linearInterval(rowAtColumn1, rowAtColumn0, 1, rowStats),
        "列玩家在所有 p 上无差异；p=1 时行玩家的最佳回应是一段区间。");
      if (rowZeroSet) {
        addFamily(families, [0, 1], rowZeroSet,
          "列玩家在所有 p 上无差异；行玩家在该 q 上也无差异，形成水平交叉线。");
      }
    } else {
      if (rowZeroSet) {
        var qRoot = rowZeroSet[0];
        var pRange = qRoot <= EPS
          ? linearInterval(columnAtRow1, columnAtRow0, -1, columnStats)
          : qRoot >= 1 - EPS
            ? linearInterval(columnAtRow1, columnAtRow0, 1, columnStats)
            : columnZeroSet;
        addFamily(families, pRange, [qRoot, qRoot],
          "行玩家在该 q 上无差异；列玩家的最佳回应区间与之重合。");
      }
      if (columnZeroSet) {
        var pRoot = columnZeroSet[0];
        var qRange = pRoot <= EPS
          ? linearInterval(rowAtColumn1, rowAtColumn0, -1, rowStats)
          : pRoot >= 1 - EPS
            ? linearInterval(rowAtColumn1, rowAtColumn0, 1, rowStats)
            : rowZeroSet;
        addFamily(families, [pRoot, pRoot], qRange,
          "列玩家在该 p 上无差异；行玩家的最佳回应区间与之重合。");
      }
    }
    var result = {
      p: interior ? p : null,
      q: interior ? q : null,
      interior: interior ? {
        p: p,
        q: q,
        payoffs: expectedPayoffs(game, p, q)
      } : null,
      boundary: boundary,
      families: families,
      rowIndifferenceDenominator: rowDenominator,
      columnIndifferenceDenominator: columnDenominator,
      rowIndifferenceAt: q,
      columnIndifferenceAt: p
    };
    result.status = families.length ? "continuum" : interior ? "interior" : boundary ? "boundary" : "none";
    return result;
  }

  function socialOptima(input) {
    var game = normalizeGame(input);
    var totals = [];
    for (var row = 0; row < 2; row += 1) {
      for (var column = 0; column < 2; column += 1) {
        var total = payoff(game, row, column, 0) + payoff(game, row, column, 1);
        totals.push({ row: row, column: column, total: total });
      }
    }
    var stats = scalarStats(totals.map(function (cell) { return cell.total; }));
    var maximum = totals.reduce(function (current, cell) {
      return compareValues(cell.total, current, stats) > 0 ? cell.total : current;
    }, totals[0].total);
    return {
      maximum: maximum,
      cells: totals.filter(function (cell) { return compareValues(cell.total, maximum, stats) === 0; }),
      all: totals,
      objective: "payoff-sum-maximizer",
      normalization: "current payoff units; not independently affine-invariant"
    };
  }

  function rowPayoffAgainstColumns(game, p) {
    return [
      p * payoff(game, 0, 0, 0) + (1 - p) * payoff(game, 1, 0, 0),
      p * payoff(game, 0, 1, 0) + (1 - p) * payoff(game, 1, 1, 0)
    ];
  }

  function columnPayoffAgainstRows(game, q) {
    return [
      q * payoff(game, 0, 0, 0) + (1 - q) * payoff(game, 0, 1, 0),
      q * payoff(game, 1, 0, 0) + (1 - q) * payoff(game, 1, 1, 0)
    ];
  }

  function minimax(input) {
    var game = normalizeGame(input);
    if (!isZeroSum(game)) {
      return { applicable: false, reason: "minimax value is a zero-sum certificate, not a general-sum shortcut" };
    }
    var rowCandidates = [0, 1];
    var columnCandidates = [0, 1];
    var rowStats = payoffStats(game, 0);
    var rowAtColumn0 = payoff(game, 0, 0, 0) - payoff(game, 1, 0, 0);
    var rowAtColumn1 = payoff(game, 0, 1, 0) - payoff(game, 1, 1, 0);
    var denominator = rowAtColumn0 - rowAtColumn1;
    if (!isZeroDifference(denominator, rowStats, [rowAtColumn0, rowAtColumn1])) {
      var crossing = (payoff(game, 1, 1, 0) - payoff(game, 1, 0, 0)) / denominator;
      if (crossing >= -EPS && crossing <= 1 + EPS) rowCandidates.push(clampProbability(crossing));
      var columnCrossing = (payoff(game, 1, 1, 0) - payoff(game, 0, 1, 0)) / denominator;
      if (columnCrossing >= -EPS && columnCrossing <= 1 + EPS) {
        columnCandidates.push(clampProbability(columnCrossing));
      }
    }
    var rowChoice = rowCandidates.map(function (p) {
      var values = rowPayoffAgainstColumns(game, p);
      return { p: p, value: Math.min(values[0], values[1]) };
    }).sort(function (left, right) { return right.value - left.value; })[0];
    var columnChoice = columnCandidates.map(function (q) {
      var values = columnPayoffAgainstRows(game, q);
      return { q: q, value: Math.max(values[0], values[1]) };
    }).sort(function (left, right) { return left.value - right.value; })[0];
    return {
      applicable: true,
      row: rowChoice,
      column: columnChoice,
      value: (rowChoice.value + columnChoice.value) / 2,
      dualityGap: Math.abs(rowChoice.value - columnChoice.value)
    };
  }

  function isZeroSum(input) {
    var game = normalizeGame(input);
    var totals = [];
    for (var row = 0; row < 2; row += 1) {
      for (var column = 0; column < 2; column += 1) {
        totals.push(payoff(game, row, column, 0) + payoff(game, row, column, 1));
      }
    }
    var stats = scalarStats(totals);
    return totals.every(function (total) {
      return isZeroDifference(total, stats, [total]);
    });
  }

  function analyze(input) {
    var game = normalizeGame(input);
    var pure = pureEquilibria(game);
    var mixed = mixedEquilibrium(game);
    var social = socialOptima(game);
    var continuum = mixed.families.length > 0;
    var finitePointCount = pure.length + (mixed.interior ? 1 : 0);
    var uniqueness = continuum ? "continuum" : finitePointCount === 1 ? "unique" : "multiple";
    var socialIsNash = social.cells.every(function (cell) {
      return pure.some(function (equilibrium) {
        return equilibrium.row === cell.row && equilibrium.column === cell.column;
      });
    });
    var result = {
      game: game,
      bestResponses: bestResponses(game),
      pure: pure,
      mixed: mixed,
      socialOptima: social,
      payoffSumMaximizer: social,
      socialOptimumIsNash: socialIsNash,
      payoffSumMaximizerIsPureNash: socialIsNash,
      zeroSum: isZeroSum(game),
      minimax: minimax(game),
      existence: {
        exists: continuum || pure.length > 0 || Boolean(mixed.interior),
        reason: continuum ? "a continuum of best-response fixed points" :
          pure.length > 0 ? "a pure best-response intersection" :
            mixed.interior ? "an interior indifference intersection" : "no equilibrium detected"
      },
      uniqueness: uniqueness,
      equilibriumCount: continuum ? "continuum" : finitePointCount
    };
    result.nashAndSocialOptimumOverlap = social.cells.filter(function (cell) {
      return pure.some(function (equilibrium) {
        return equilibrium.row === cell.row && equilibrium.column === cell.column;
      });
    });
    result.nashAndPayoffSumMaximizerOverlap = result.nashAndSocialOptimumOverlap;
    return result;
  }

  function format(value, digits) {
    if (value === null || value === undefined) return "—";
    if (!finite(value)) return "∞";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) {
      return value.toExponential(Math.min(places, 4));
    }
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", value);
      else if (key === "text") node.textContent = value;
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    append(node, children, doc);
    return node;
  }

  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (key === "className") key = "class";
      if (value !== undefined && value !== null && value !== false) node.setAttribute(key, String(value));
    });
    append(node, children, doc);
    return node;
  }

  function append(node, children, doc) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function installStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement).appendChild(style);
  }

  function metric(doc, label, value) {
    return element(doc, "div", { className: "nash-metric" }, [
      element(doc, "span", { text: label }),
      element(doc, "strong", { text: value })
    ]);
  }

  function equilibriumAt(data, row, column) {
    return data.pure.some(function (cell) { return cell.row === row && cell.column === column; });
  }

  function socialAt(data, row, column) {
    return data.socialOptima.cells.some(function (cell) { return cell.row === row && cell.column === column; });
  }

  function drawMatrix(doc, svg, data, uid) {
    clear(svg);
    var width = 660;
    var height = 320;
    var left = 195;
    var top = 78;
    var cellWidth = 190;
    var cellHeight = 85;
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("role", "img");
    svg.appendChild(svgElement(doc, "title", { id: uid + "-title" }, "2×2 收益矩阵与最佳回应"));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-desc" },
      "每格显示行玩家和列玩家收益；绿色边框是纯 Nash 均衡，金色底线标出当前基数下的 payoff-sum 最大格。"));
    svg.setAttribute("aria-labelledby", uid + "-title " + uid + "-desc");
    svg.appendChild(svgElement(doc, "text", { x: left + cellWidth, y: 25, "text-anchor": "middle", "font-size": 14 }, "列玩家动作"));
    svg.appendChild(svgElement(doc, "text", { x: 25, y: top + cellHeight, "text-anchor": "middle", "font-size": 14,
      transform: "rotate(-90 25 " + (top + cellHeight) + ")" }, "行玩家动作"));
    data.game.columnLabels.forEach(function (label, column) {
      svg.appendChild(svgElement(doc, "text", {
        x: left + column * cellWidth + cellWidth / 2,
        y: top - 20,
        "text-anchor": "middle",
        "font-size": 13
      }, label));
    });
    data.game.rowLabels.forEach(function (label, row) {
      svg.appendChild(svgElement(doc, "text", {
        x: left - 18,
        y: top + row * cellHeight + cellHeight / 2 + 5,
        "text-anchor": "end",
        "font-size": 13
      }, label));
    });
    for (var row = 0; row < 2; row += 1) {
      for (var column = 0; column < 2; column += 1) {
        var isNash = equilibriumAt(data, row, column);
        var isSocial = socialAt(data, row, column);
        var x = left + column * cellWidth;
        var y = top + row * cellHeight;
        svg.appendChild(svgElement(doc, "rect", {
          x: x,
          y: y,
          width: cellWidth - 7,
          height: cellHeight - 7,
          rx: 5,
          fill: isSocial ? "var(--nash-gold)" : "var(--bg)",
          "fill-opacity": isSocial ? 0.12 : 1,
          stroke: isNash ? "var(--nash-green)" : "var(--border)",
          "stroke-width": isNash ? 3 : 1.2
        }));
        var cell = data.game.payoffs[row][column];
        svg.appendChild(svgElement(doc, "text", {
          x: x + (cellWidth - 7) / 2,
          y: y + 38,
          "text-anchor": "middle",
          "font-size": 18,
          "font-weight": isNash ? 750 : 500
        }, "(" + format(cell[0], 3) + ", " + format(cell[1], 3) + ")"));
        svg.appendChild(svgElement(doc, "text", {
          x: x + (cellWidth - 7) / 2,
          y: y + 62,
          "text-anchor": "middle",
          "font-size": 11,
          fill: isNash ? "var(--nash-green)" : isSocial ? "var(--nash-gold)" : "var(--fg-soft)"
        }, isNash && isSocial ? "Nash + payoff-sum 最大格" : isNash ? "Nash 均衡" : isSocial ? "payoff-sum 最大格" : ""));
      }
    }
    svg.appendChild(svgElement(doc, "text", { x: left, y: height - 22, "font-size": 12, fill: "var(--fg-soft)" },
      "绿色边框：纯 NE　金色底：当前基数下 payoff-sum 最大"));
  }

  function buildTable(doc, data) {
    var table = element(doc, "table", {});
    table.appendChild(element(doc, "caption", { text: "逐格最佳回应与均衡账本" }));
    var head = element(doc, "thead", {});
    head.appendChild(element(doc, "tr", {}, [
      element(doc, "th", { scope: "col", text: "行动作" }),
      element(doc, "th", { scope: "col", text: "列动作" }),
      element(doc, "th", { scope: "col", text: "收益 (u,v)" }),
      element(doc, "th", { scope: "col", text: "行 BR" }),
      element(doc, "th", { scope: "col", text: "列 BR" }),
      element(doc, "th", { scope: "col", text: "身份" })
    ]));
    table.appendChild(head);
    var body = element(doc, "tbody", {});
    for (var row = 0; row < 2; row += 1) {
      for (var column = 0; column < 2; column += 1) {
        var rowBest = data.bestResponses.rowByColumn[column].indexOf(row) >= 0;
        var columnBest = data.bestResponses.columnByRow[row].indexOf(column) >= 0;
        var nash = equilibriumAt(data, row, column);
        var social = socialAt(data, row, column);
        var identity = nash && social ? "Nash + payoff-sum 最大格" : nash ? "Nash" : social ? "payoff-sum 最大格" : "—";
        body.appendChild(element(doc, "tr", {}, [
          element(doc, "th", { scope: "row", text: data.game.rowLabels[row] }),
          element(doc, "td", { text: data.game.columnLabels[column] }),
          element(doc, "td", { text: "(" + format(payoff(data.game, row, column, 0), 3) + ", " +
            format(payoff(data.game, row, column, 1), 3) + ")" }),
          element(doc, "td", { className: rowBest ? "nash-good" : "", text: rowBest ? "是" : "否" }),
          element(doc, "td", { className: columnBest ? "nash-good" : "", text: columnBest ? "是" : "否" }),
          element(doc, "td", { className: nash ? "nash-good" : social ? "nash-warn" : "", text: identity })
        ]));
      }
    }
    table.appendChild(body);
    return table;
  }

  function buildLedger(doc, data) {
    var table = element(doc, "table", {});
    table.appendChild(element(doc, "caption", { text: "存在性、唯一性、payoff-sum maximizer 与 minimax 分栏" }));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
      element(doc, "th", { scope: "col", text: "账目" }),
      element(doc, "th", { scope: "col", text: "结果" }),
      element(doc, "th", { scope: "col", text: "读法" })
    ])));
    var pureText = data.pure.length ? data.pure.map(function (cell) {
      return "(" + data.game.rowLabels[cell.row] + ", " + data.game.columnLabels[cell.column] + ")";
    }).join("；") : "无";
    var mixedText = data.mixed.interior
      ? "p=" + format(data.mixed.interior.p, 5) + "，q=" + format(data.mixed.interior.q, 5)
      : data.mixed.families.length
        ? "连续族 " + data.mixed.families.length + " 条"
        : "无内点解";
    var minimaxText = data.minimax.applicable
      ? "值 " + format(data.minimax.value, 5) + "；p=" + format(data.minimax.row.p, 5) +
        "，q=" + format(data.minimax.column.q, 5)
      : "不适用";
    var rows = [
      ["存在性", data.existence.exists ? "存在" : "未找到", data.existence.reason],
      ["唯一性", data.uniqueness === "unique" ? "唯一" : data.uniqueness === "continuum" ? "连续多重" : "有限多重",
        "均衡点数：" + data.equilibriumCount],
      ["纯 Nash", pureText, "最佳回应交集"],
      ["混合求解", mixedText, data.mixed.status === "interior" ? "双方无差异" : "检查边界/退化条件"],
      ["payoff-sum 最大格", data.socialOptima.cells.map(function (cell) {
        return "(" + data.game.rowLabels[cell.row] + ", " + data.game.columnLabels[cell.column] + ")";
      }).join("；"), "当前基数下收益和最大值 " + format(data.socialOptima.maximum, 4) +
        (data.socialOptimumIsNash ? "；全部也是纯 NE" : "；不等同于纯 NE") + "；独立正缩放可能改变该排序"],
      ["零和 minimax", minimaxText, data.zeroSum ? "零和结构可用" : "一般和博弈保留两位收益"]
    ];
    var body = element(doc, "tbody", {});
    rows.forEach(function (row) {
      body.appendChild(element(doc, "tr", {}, [
        element(doc, "th", { scope: "row", text: row[0] }),
        element(doc, "td", { text: row[1] }),
        element(doc, "td", { text: row[2] })
      ]));
    });
    table.appendChild(body);
    return table;
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    var instanceId = "cl-nash-" + (++INSTANCE);
    var state = {
      presetId: DEFAULT.presetId,
      predictions: { uniqueness: null, mixed: null, social: null },
      revealed: false,
      score: null
    };

    function current() {
      return analyze({ presetId: state.presetId });
    }

    function choiceButton(docRef, group, value, label) {
      var button = element(docRef, "button", {
        type: "button",
        "aria-pressed": state.predictions[group] === value ? "true" : "false",
        text: label
      });
      button.addEventListener("click", function () {
        state.predictions[group] = value;
        render();
      });
      return button;
    }

    function render() {
      var data = current();
      var shell = element(doc, "div", { className: "nash-lab" });
      shell.appendChild(element(doc, "h3", { text: "2×2 最佳回应扫描器" }));
      shell.appendChild(element(doc, "p", { className: "nash-note", text:
        "先选一个确定性预设并提交三项预测；结果、矩阵和逐格账本会在提交后出现。" }));

      var presetField = element(doc, "fieldset", {});
      presetField.appendChild(element(doc, "legend", { text: "预设（切换会重新锁住答案）" }));
      var presetGrid = element(doc, "div", { className: "nash-preset-grid", role: "group", "aria-label": "博弈预设" });
      PRESETS.forEach(function (preset) {
        var button = element(doc, "button", {
          type: "button",
          "aria-pressed": state.presetId === preset.id ? "true" : "false",
          title: preset.label,
          text: preset.label
        });
        button.addEventListener("click", function () {
          state.presetId = preset.id;
          state.predictions = { uniqueness: null, mixed: null, social: null };
          state.revealed = false;
          state.score = null;
          render();
        });
        presetGrid.appendChild(button);
      });
      presetField.appendChild(presetGrid);
      shell.appendChild(presetField);

      if (!state.revealed) {
        shell.appendChild(element(doc, "div", { className: "nash-prompt" }, [
          element(doc, "strong", { text: "预测门：" }),
          element(doc, "span", { text: "不要先看矩阵。对“存在/唯一”“内点混合”和“所有收益和最大格是否都是纯 NE”分别下注。" })
        ]));
        var questions = element(doc, "div", { className: "nash-question-list" });
        var q1 = element(doc, "div", { className: "nash-question" }, [
          element(doc, "strong", { text: "1. 均衡结构是什么？" }),
          element(doc, "div", { className: "nash-choice-grid", role: "group", "aria-label": "均衡结构预测" }, [
            choiceButton(doc, "uniqueness", "unique", "唯一"),
            choiceButton(doc, "uniqueness", "multiple", "有限多个"),
            choiceButton(doc, "uniqueness", "continuum", "连续一族")
          ])
        ]);
        var q2 = element(doc, "div", { className: "nash-question" }, [
          element(doc, "strong", { text: "2. 混合求解的读法是什么？" }),
          element(doc, "div", { className: "nash-choice-grid", role: "group", "aria-label": "混合均衡预测" }, [
            choiceButton(doc, "mixed", "interior", "内点 p,q"),
            choiceButton(doc, "mixed", "none", "没有内点"),
            choiceButton(doc, "mixed", "continuum", "边界/连续族")
          ])
        ]);
        var q3 = element(doc, "div", { className: "nash-question" }, [
          element(doc, "strong", { text: "3. 所有收益和最大格是否都是纯 NE？" }),
          element(doc, "div", { className: "nash-choice-grid", role: "group", "aria-label": "收益和最大格是否都是纯 NE" }, [
            choiceButton(doc, "social", "yes", "是"),
            choiceButton(doc, "social", "no", "不一定")
          ])
        ]);
        questions.appendChild(q1);
        questions.appendChild(q2);
        questions.appendChild(q3);
        shell.appendChild(questions);
        var actions = element(doc, "div", { className: "nash-actions" });
        var check = element(doc, "button", { type: "button", className: "nash-primary", text: "核对预测" });
        var reset = element(doc, "button", { type: "button", text: "重置" });
        var feedback = element(doc, "p", { className: "nash-feedback", role: "status", "aria-live": "polite" });
        check.addEventListener("click", function () {
          if (!state.predictions.uniqueness || !state.predictions.mixed || !state.predictions.social) {
            feedback.className = "nash-feedback nash-warn";
            feedback.textContent = "三项预测都要先选择。";
            return;
          }
          var expected = {
            uniqueness: data.uniqueness === "unique" ? "unique" : data.uniqueness === "continuum" ? "continuum" : "multiple",
            mixed: data.mixed.interior ? "interior" : data.mixed.families.length ? "continuum" : "none",
            social: data.socialOptimumIsNash ? "yes" : "no"
          };
          var correct = Object.keys(expected).filter(function (key) {
            return expected[key] === state.predictions[key];
          }).length;
          state.score = correct;
          state.revealed = true;
          render();
          api && api.announce && api.announce(root, "预测已核对：" + correct + " / 3；结果账本已揭示。");
        });
        reset.addEventListener("click", function () {
          state.presetId = DEFAULT.presetId;
          state.predictions = { uniqueness: null, mixed: null, social: null };
          state.revealed = false;
          state.score = null;
          render();
          api && api.announce && api.announce(root, "已重置；结果重新隐藏。");
        });
        actions.appendChild(check);
        actions.appendChild(reset);
        shell.appendChild(actions);
        shell.appendChild(feedback);
      } else {
        var panel = element(doc, "section", { className: "nash-revealed", "aria-labelledby": instanceId + "-result-title" });
        panel.appendChild(element(doc, "h4", { id: instanceId + "-result-title", text: "结果与透明账本" }));
        var revealedActions = element(doc, "div", { className: "nash-actions" });
        var revealedReset = element(doc, "button", { type: "button", text: "重置并重新预测" });
        revealedReset.addEventListener("click", function () {
          state.presetId = DEFAULT.presetId;
          state.predictions = { uniqueness: null, mixed: null, social: null };
          state.revealed = false;
          state.score = null;
          render();
          api && api.announce && api.announce(root, "已重置；结果重新隐藏。");
        });
        revealedActions.appendChild(revealedReset);
        panel.appendChild(revealedActions);
        panel.appendChild(element(doc, "p", {
          className: "nash-feedback nash-pass",
          role: "status",
          "aria-live": "polite",
          text: "本次得分：" + (state.score === null ? "—" : state.score + " / 3")
        }));
        panel.appendChild(element(doc, "p", { className: "nash-note", text:
          "绿色边框是纯 Nash 均衡；金色底是当前基数下的 payoff-sum 最大格。混合解、存在性和 minimax 单独列出。" }));
        var layout = element(doc, "div", { className: "nash-layout" });
        var stage = element(doc, "div", { className: "nash-stage" });
        var frame = element(doc, "div", { className: "nash-stage-frame" });
        var svg = svgElement(doc, "svg", { className: "nash-svg" });
        drawMatrix(doc, svg, data, instanceId + "-matrix");
        frame.appendChild(svg);
        stage.appendChild(frame);
        layout.appendChild(stage);
        layout.appendChild(element(doc, "div", { className: "nash-ledger" }, buildTable(doc, data)));
        panel.appendChild(layout);
        panel.appendChild(element(doc, "div", { className: "nash-metrics" }, [
          metric(doc, "存在性", data.existence.exists ? "存在" : "未找到"),
          metric(doc, "唯一性", data.uniqueness === "unique" ? "唯一" : data.uniqueness === "continuum" ? "连续多重" : "有限多重"),
          metric(doc, "纯 NE 数", String(data.pure.length)),
          metric(doc, "内点混合", data.mixed.interior ? "有" : "无"),
          metric(doc, "payoff-sum 最大格", format(data.socialOptima.maximum, 3)),
          metric(doc, "本次得分", state.score === null ? "—" : state.score + " / 3"),
          metric(doc, "零和 minimax", data.minimax.applicable ? format(data.minimax.value, 3) : "不适用")
        ]));
        var ledger = element(doc, "div", { className: "nash-table-wrap" });
        ledger.appendChild(buildLedger(doc, data));
        panel.appendChild(ledger);
        var interpretation = data.mixed.families.length
          ? "退化条件让最佳回应在一段概率区间上重合；这是连续均衡族，不是数值误差。"
          : data.socialOptimumIsNash
            ? "本预设的 payoff-sum 最大纯格也属于纯 NE，但这只是当前收益基数下的事实，不是 Nash 定义。"
            : "当前基数下的 payoff-sum 最大格不在纯 NE 交集中；个体无偏离条件与收益和最大必须分栏报告。";
        panel.appendChild(element(doc, "p", { className: "nash-interpretation", text: interpretation }));
        shell.appendChild(panel);
      }
      root.replaceChildren(shell);
    }

    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    var dominant = analyze({ presetId: "dominant" });
    assert(dominant.pure.length === 1, "dominant has one pure NE");
    assert(dominant.pure[0].row === 1 && dominant.pure[0].column === 1, "dominant NE cell");
    assert(dominant.uniqueness === "unique" && dominant.existence.exists, "dominant existence/uniqueness");
    assert(!dominant.mixed.interior && !dominant.mixed.families.length, "dominant has no interior or continuum");
    assert(!dominant.socialOptimumIsNash && dominant.socialOptima.maximum === 6, "dominant separates social optimum");
    assert(!dominant.zeroSum && !dominant.minimax.applicable, "general-sum minimax is rejected");

    var coordination = analyze({ presetId: "coordination" });
    assert(coordination.pure.length === 2, "coordination has two pure NE");
    assert(coordination.mixed.interior && near(coordination.mixed.p, 1 / 3, 1e-8), "coordination mixed p");
    assert(near(coordination.mixed.q, 1 / 3, 1e-8), "coordination mixed q");
    assert(coordination.uniqueness === "multiple" && coordination.existence.exists, "coordination multiple");
    assert(coordination.socialOptimumIsNash, "coordination efficient equilibrium");

    var pennies = analyze({ presetId: "matching-pennies" });
    assert(pennies.pure.length === 0, "matching pennies has no pure NE");
    assert(pennies.mixed.interior && near(pennies.mixed.p, 0.5, 1e-10) && near(pennies.mixed.q, 0.5, 1e-10),
      "matching pennies mixed half");
    assert(pennies.uniqueness === "unique" && pennies.zeroSum, "matching pennies unique zero-sum");
    assert(pennies.minimax.applicable && near(pennies.minimax.value, 0, 1e-10) &&
      pennies.minimax.dualityGap < 1e-10, "matching pennies minimax value");
    var scaledPennies = analyze({
      payoffs: pennies.game.payoffs.map(function (row) {
        return row.map(function (cell) { return [cell[0] * 1e-12, cell[1] * 1e-12]; });
      })
    });
    assert(scaledPennies.mixed.interior && near(scaledPennies.mixed.p, 0.5, 1e-10) &&
      near(scaledPennies.mixed.q, 0.5, 1e-10) && scaledPennies.minimax.applicable &&
      near(scaledPennies.minimax.row.p, 0.5, 1e-10) && near(scaledPennies.minimax.column.q, 0.5, 1e-10),
    "positive scaling preserves mixed and minimax strategies");

    var degenerate = analyze({ presetId: "degenerate" });
    assert(degenerate.pure.length === 2, "degenerate boundary pure endpoints");
    assert(degenerate.mixed.families.length >= 1, "degenerate continuum detected");
    assert(degenerate.uniqueness === "continuum" && degenerate.existence.exists, "degenerate existence/uniqueness");
    assert(degenerate.mixed.families[0].pRange[0] === 0 && degenerate.mixed.families[0].pRange[1] === 1,
      "degenerate full p range");
    assert(degenerate.mixed.families[0].qRange[0] === 1 && degenerate.mixed.families[0].qRange[1] === 1,
      "degenerate dominant column boundary");

    PRESETS.forEach(function (preset) {
      var result = analyze({ presetId: preset.id });
      assert(result.bestResponses.rowByColumn.length === 2 && result.bestResponses.columnByRow.length === 2,
        preset.id + " best-response shape");
      result.pure.forEach(function (cell) {
        assert(result.bestResponses.rowByColumn[cell.column].indexOf(cell.row) >= 0, preset.id + " row BR");
        assert(result.bestResponses.columnByRow[cell.row].indexOf(cell.column) >= 0, preset.id + " column BR");
      });
      assert(result.socialOptima.cells.length >= 1, preset.id + " social optimum");
      assert(result.existence.exists, preset.id + " Nash existence");
    });
    var custom = analyze({
      payoffs: [
        [[2, 1], [0, 0]],
        [[0, 0], [1, 2]]
      ],
      rowLabels: ["a", "b"],
      columnLabels: ["x", "y"]
    });
    assert(custom.mixed.interior && finite(custom.mixed.p) && finite(custom.mixed.q), "custom mixed solve");
    assert(near(custom.mixed.p, 2 / 3, 1e-10) && near(custom.mixed.q, 1 / 3, 1e-10),
      "custom mixed probabilities use the opponent payoff differences");
    assert(expectedPayoffs(custom.game, custom.mixed.p, custom.mixed.q).length === 2, "expected payoff vector");

    function affinePayoffs(payoffs, rowScale, rowShift, columnScale, columnShift) {
      return payoffs.map(function (row) {
        return row.map(function (cell) {
          return [cell[0] * rowScale + rowShift, cell[1] * columnScale + columnShift];
        });
      });
    }

    function hasFamily(families, pRange, qRange) {
      return families.some(function (family) {
        return near(family.pRange[0], pRange[0], 1e-10) && near(family.pRange[1], pRange[1], 1e-10) &&
          near(family.qRange[0], qRange[0], 1e-10) && near(family.qRange[1], qRange[1], 1e-10);
      });
    }

    var crossLine = analyze({
      payoffs: [
        [[0, 1], [0, 0]],
        [[0, 0], [0, 1]]
      ]
    });
    assert(crossLine.mixed.families.length === 3, "cross-line returns both horizontal segments and vertical line");
    assert(hasFamily(crossLine.mixed.families, [0.5, 0.5], [0, 1]), "cross-line keeps internal vertical family");
    assert(hasFamily(crossLine.mixed.families, [0, 0.5], [0, 0]), "cross-line keeps lower horizontal family");
    assert(hasFamily(crossLine.mixed.families, [0.5, 1], [1, 1]), "cross-line keeps upper horizontal family");

    var shiftedDominant = analyze({
      payoffs: affinePayoffs(dominant.game.payoffs, 1, 1e12, 1, 1e12)
    });
    assert(shiftedDominant.pure.length === 1 && shiftedDominant.pure[0].row === 1 &&
      shiftedDominant.pure[0].column === 1, "large translation preserves prisoner dilemma pure NE");
    assert(shiftedDominant.bestResponses.rowByColumn[0][0] === 1 &&
      shiftedDominant.bestResponses.columnByRow[0][0] === 1, "large translation preserves strict best responses");
    assert(shiftedDominant.socialOptima.cells.length === 1 && shiftedDominant.socialOptima.cells[0].row === 0 &&
      shiftedDominant.socialOptima.cells[0].column === 0 && !shiftedDominant.socialOptimumIsNash,
    "large translation preserves payoff-sum maximizer and separation");

    var scaledCustom = analyze({
      payoffs: affinePayoffs(custom.game.payoffs, 7, 1e12, 0.25, -1e12)
    });
    assert(scaledCustom.pure.length === custom.pure.length && scaledCustom.pure.every(function (cell, index) {
      return cell.row === custom.pure[index].row && cell.column === custom.pure[index].column;
    }), "independent positive affine transforms preserve pure NE");
    assert(scaledCustom.mixed.interior && near(scaledCustom.mixed.p, custom.mixed.p, 1e-10) &&
      near(scaledCustom.mixed.q, custom.mixed.q, 1e-10),
    "independent positive affine transforms preserve mixed probabilities");

    var scaledCrossLine = analyze({
      payoffs: affinePayoffs(crossLine.game.payoffs, 13, 1e12, 0.125, -1e12)
    });
    assert(hasFamily(scaledCrossLine.mixed.families, [0.5, 0.5], [0, 1]),
      "positive scaling preserves an internal degenerate cross-line");
    assert(scaledCrossLine.pure.length === crossLine.pure.length, "positive scaling preserves cross-line pure endpoints");

    var commonAffine = analyze({
      payoffs: affinePayoffs(dominant.game.payoffs, 5, 1e12, 5, -1e12)
    });
    assert(commonAffine.socialOptima.cells.length === dominant.socialOptima.cells.length &&
      commonAffine.socialOptima.cells[0].row === dominant.socialOptima.cells[0].row &&
      commonAffine.socialOptima.cells[0].column === dominant.socialOptima.cells[0].column,
    "common positive scaling and translations preserve payoff-sum maximizer");
    var independentlyScaledSocial = analyze({
      payoffs: affinePayoffs(dominant.game.payoffs, 100, 0, 1, 0)
    });
    assert(independentlyScaledSocial.socialOptima.cells[0].row === 1 &&
      independentlyScaledSocial.socialOptima.cells[0].column === 0 &&
      independentlyScaledSocial.socialOptima.normalization.indexOf("not independently affine-invariant") >= 0,
    "payoff-sum maximizer records its current normalization caveat");
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    DEFAULT: DEFAULT,
    PRESETS: PRESETS,
    normalizeGame: normalizeGame,
    expectedPayoffs: expectedPayoffs,
    bestResponses: bestResponses,
    pureEquilibria: pureEquilibria,
    mixedEquilibrium: mixedEquilibrium,
    solveMixedEquilibrium: mixedEquilibrium,
    socialOptima: socialOptima,
    payoffSumMaximizer: socialOptima,
    isZeroSum: isZeroSum,
    minimax: minimax,
    analyze: analyze,
    compute: analyze,
    mount: mount,
    selfTest: selfTest
  };
});

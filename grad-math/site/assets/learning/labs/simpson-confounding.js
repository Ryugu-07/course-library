(function (host) {
  "use strict";

  var STYLE_ID = "cl-simpson-confounding-styles";
  var INSTANCE_COUNT = 0;
  var EPSILON = 1e-9;
  var STRATA = [
    { id: "simple", label: "简单任务" },
    { id: "hard", label: "困难任务" }
  ];
  var METHODS = [
    { id: "baseline", label: "基线" },
    { id: "ai", label: "AI 辅助" }
  ];
  var DEFAULT_TARGET_COUNTS = { simple: 100, hard: 100 };

  /*
   * Every observation in this lab is a count.  The four cells are the
   * method × difficulty half of the 2×2×2 ledger; failure is total-success.
   * The reversal preset is deliberately constructed so that the AI arm has
   * more difficult tasks, while its within-stratum rates are higher.
   */
  var PRESETS = {
    reversal: {
      id: "reversal",
      label: "反转（默认）",
      description: "AI 组被分配了更多困难任务，粗合并方向反转。",
      cells: [
        { method: "baseline", stratum: "simple", successes: 80, total: 100 },
        { method: "baseline", stratum: "hard", successes: 5, total: 50 },
        { method: "ai", stratum: "simple", successes: 90, total: 100 },
        { method: "ai", stratum: "hard", successes: 24, total: 150 }
      ]
    },
    "no-reversal": {
      id: "no-reversal",
      label: "无反转",
      description: "同样的层内成功率，但困难任务的分配差距不够大，粗差不反转。",
      cells: [
        { method: "baseline", stratum: "simple", successes: 80, total: 100 },
        { method: "baseline", stratum: "hard", successes: 5, total: 50 },
        { method: "ai", stratum: "simple", successes: 90, total: 100 },
        { method: "ai", stratum: "hard", successes: 12, total: 75 }
      ]
    },
    balanced: {
      id: "balanced",
      label: "平衡分配",
      description: "两种方法各自拥有相同的简单/困难任务构成。",
      cells: [
        { method: "baseline", stratum: "simple", successes: 80, total: 100 },
        { method: "baseline", stratum: "hard", successes: 5, total: 50 },
        { method: "ai", stratum: "simple", successes: 90, total: 100 },
        { method: "ai", stratum: "hard", successes: 8, total: 50 }
      ]
    }
  };

  function isFiniteNumber(value) {
    return typeof value === "number" && isFinite(value);
  }

  function isInteger(value) {
    return isFiniteNumber(value) && Math.floor(value) === value;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function copyObject(source) {
    var copy = {};
    Object.keys(source || {}).forEach(function (key) {
      copy[key] = source[key];
    });
    return copy;
  }

  function stratumLabel(id) {
    var item = STRATA.filter(function (stratum) { return stratum.id === id; })[0];
    return item ? item.label : id;
  }

  function methodLabel(id) {
    var item = METHODS.filter(function (method) { return method.id === id; })[0];
    return item ? item.label : id;
  }

  function cellKey(method, stratum) {
    return method + "|" + stratum;
  }

  function validateCount(value, label) {
    if (!isInteger(value) || value < 0) {
      throw new Error(label + " 必须是非负整数");
    }
  }

  function validateCell(cell) {
    if (!cell || METHODS.map(function (item) { return item.id; }).indexOf(cell.method) < 0) {
      throw new Error("未知方法单元格");
    }
    if (STRATA.map(function (item) { return item.id; }).indexOf(cell.stratum) < 0) {
      throw new Error("未知任务层单元格");
    }
    validateCount(cell.successes, "成功数");
    validateCount(cell.total, "总数");
    if (cell.successes > cell.total) {
      throw new Error("成功数不能大于总数");
    }
  }

  function validateTargetCounts(targetCounts) {
    STRATA.forEach(function (stratum) {
      var count = targetCounts && targetCounts[stratum.id];
      if (!isInteger(count) || count <= 0) {
        throw new Error("标准化目标计数必须是正整数");
      }
    });
  }

  function ledgerForPreset(id) {
    var definition = PRESETS[id];
    if (!definition) throw new Error("未知预设: " + id);
    return {
      id: definition.id,
      label: definition.label,
      description: definition.description,
      targetCounts: copyObject(DEFAULT_TARGET_COUNTS),
      cells: definition.cells.map(function (cell) { return copyObject(cell); })
    };
  }

  function normalizeLedger(input) {
    var ledger = typeof input === "string" ? ledgerForPreset(input) : input;
    if (!ledger || !Array.isArray(ledger.cells)) {
      throw new Error("账本必须包含 cells 数组");
    }
    var seen = Object.create(null);
    ledger.cells.forEach(function (cell) {
      validateCell(cell);
      var key = cellKey(cell.method, cell.stratum);
      if (seen[key]) throw new Error("重复的账本单元格: " + key);
      seen[key] = true;
    });
    STRATA.forEach(function (stratum) {
      METHODS.forEach(function (method) {
        if (!seen[cellKey(method.id, stratum.id)]) {
          throw new Error("缺少账本单元格: " + method.id + " × " + stratum.id);
        }
      });
    });
    var targetCounts = ledger.targetCounts || DEFAULT_TARGET_COUNTS;
    validateTargetCounts(targetCounts);
    return {
      id: ledger.id || "custom",
      label: ledger.label || "自定义账本",
      description: ledger.description || "",
      targetCounts: copyObject(targetCounts),
      cells: ledger.cells.map(function (cell) { return copyObject(cell); })
    };
  }

  function getCell(ledger, method, stratum) {
    return ledger.cells.filter(function (cell) {
      return cell.method === method && cell.stratum === stratum;
    })[0];
  }

  function rate(successes, total) {
    return total > 0 ? successes / total : null;
  }

  function check(id, label, pass, detail) {
    return { id: id, label: label, pass: Boolean(pass), detail: detail || "" };
  }

  function summarizeCell(cell) {
    return {
      method: cell.method,
      methodLabel: methodLabel(cell.method),
      stratum: cell.stratum,
      stratumLabel: stratumLabel(cell.stratum),
      successes: cell.successes,
      failures: cell.total - cell.successes,
      total: cell.total,
      rate: rate(cell.successes, cell.total)
    };
  }

  function analyze(input, targetCounts) {
    var ledger = normalizeLedger(input);
    var targets = targetCounts || ledger.targetCounts;
    validateTargetCounts(targets);

    var cells = ledger.cells.map(summarizeCell);
    var methods = METHODS.map(function (method) {
      var methodCells = STRATA.map(function (stratum) {
        return cells.filter(function (cell) {
          return cell.method === method.id && cell.stratum === stratum.id;
        })[0];
      });
      var successes = methodCells.reduce(function (sum, cell) { return sum + cell.successes; }, 0);
      var total = methodCells.reduce(function (sum, cell) { return sum + cell.total; }, 0);
      return {
        id: method.id,
        label: method.label,
        cells: methodCells,
        successes: successes,
        failures: total - successes,
        total: total,
        rate: rate(successes, total)
      };
    });

    var strata = STRATA.map(function (stratum) {
      var baseline = cells.filter(function (cell) {
        return cell.method === "baseline" && cell.stratum === stratum.id;
      })[0];
      var ai = cells.filter(function (cell) {
        return cell.method === "ai" && cell.stratum === stratum.id;
      })[0];
      var difference = ai.rate !== null && baseline.rate !== null ? ai.rate - baseline.rate : null;
      return {
        id: stratum.id,
        label: stratum.label,
        baseline: baseline,
        ai: ai,
        difference: difference
      };
    });

    var baselineMethod = methods.filter(function (method) { return method.id === "baseline"; })[0];
    var aiMethod = methods.filter(function (method) { return method.id === "ai"; })[0];
    var crudeDifference = aiMethod.rate !== null && baselineMethod.rate !== null
      ? aiMethod.rate - baselineMethod.rate
      : null;
    var crude = {
      baseline: baselineMethod,
      ai: aiMethod,
      difference: crudeDifference
    };

    var targetTotal = STRATA.reduce(function (sum, stratum) {
      return sum + targets[stratum.id];
    }, 0);
    var standardizedMethods = methods.map(function (method) {
      var projectedCells = method.cells.map(function (cell) {
        if (cell.total === 0) {
          return {
            stratum: cell.stratum,
            stratumLabel: cell.stratumLabel,
            total: targets[cell.stratum],
            successes: null,
            failures: null,
            rate: null,
            integerProjection: false
          };
        }
        var numerator = cell.successes * targets[cell.stratum];
        var projectedSuccesses = numerator / cell.total;
        return {
          stratum: cell.stratum,
          stratumLabel: cell.stratumLabel,
          total: targets[cell.stratum],
          successes: projectedSuccesses,
          failures: targets[cell.stratum] - projectedSuccesses,
          rate: cell.rate,
          integerProjection: isInteger(projectedSuccesses)
        };
      });
      var hasCompleteRates = projectedCells.every(function (cell) { return cell.successes !== null; });
      var integerProjection = projectedCells.every(function (cell) { return cell.integerProjection; });
      var successes = hasCompleteRates
        ? projectedCells.reduce(function (sum, cell) { return sum + cell.successes; }, 0)
        : null;
      return {
        id: method.id,
        label: method.label,
        cells: projectedCells,
        successes: successes,
        failures: successes === null ? null : targetTotal - successes,
        total: targetTotal,
        rate: successes === null ? null : successes / targetTotal,
        integerProjection: integerProjection
      };
    });
    var standardizedBaseline = standardizedMethods.filter(function (method) { return method.id === "baseline"; })[0];
    var standardizedAi = standardizedMethods.filter(function (method) { return method.id === "ai"; })[0];
    var standardizedDifference = standardizedAi.rate !== null && standardizedBaseline.rate !== null
      ? standardizedAi.rate - standardizedBaseline.rate
      : null;
    var standardized = {
      targetCounts: copyObject(targets),
      targetTotal: targetTotal,
      targetWeights: STRATA.map(function (stratum) {
        return {
          stratum: stratum.id,
          label: stratum.label,
          count: targets[stratum.id],
          weight: targets[stratum.id] / targetTotal
        };
      }),
      methods: standardizedMethods,
      baseline: standardizedBaseline,
      ai: standardizedAi,
      difference: standardizedDifference
    };

    var allocation = methods.map(function (method) {
      var simpleCell = method.cells.filter(function (cell) { return cell.stratum === "simple"; })[0];
      var hardCell = method.cells.filter(function (cell) { return cell.stratum === "hard"; })[0];
      return {
        id: method.id,
        label: method.label,
        total: method.total,
        simple: simpleCell.total,
        hard: hardCell.total,
        simpleShare: rate(simpleCell.total, method.total),
        hardShare: rate(hardCell.total, method.total)
      };
    });
    var baselineAllocation = allocation.filter(function (item) { return item.id === "baseline"; })[0];
    var aiAllocation = allocation.filter(function (item) { return item.id === "ai"; })[0];
    var allocationDifference = aiAllocation.hardShare !== null && baselineAllocation.hardShare !== null
      ? aiAllocation.hardShare - baselineAllocation.hardShare
      : null;

    var positivity = cells.every(function (cell) { return cell.total > 0; });
    var integerProjection = standardizedMethods.every(function (method) { return method.integerProjection; });
    var allStrataBetter = strata.every(function (stratum) {
      return stratum.difference !== null && stratum.difference > EPSILON;
    });
    var checks = [
      check(
        "count-integrity",
        "四个 A×任务层单元格都是整数，且成功数不超过总数",
        cells.every(function (cell) {
          return isInteger(cell.successes) && isInteger(cell.failures) && isInteger(cell.total) &&
            cell.successes >= 0 && cell.failures >= 0 && cell.total >= 0;
        }),
        "失败数 = 总数 − 成功数"
      ),
      check(
        "totals-conserve",
        "分层计数加总后等于每个方法的总计数",
        methods.every(function (method) {
          return method.successes + method.failures === method.total;
        }),
        "成功 + 失败 = 总数"
      ),
      check(
        "positivity",
        "每个方法×任务层都有观测（positivity）",
        positivity,
        positivity ? "4/4 个单元格的总数 > 0" : "存在空单元格，不能从该层外推"
      ),
      check(
        "standardized-integers",
        "固定目标构成投影出的成功数仍是整数",
        integerProjection,
        integerProjection ? "本教学账本选择了可手算的目标计数" : "真实数据不要偷偷四舍五入"
      ),
      check(
        "within-stratum-direction",
        "每个任务层中 AI 成功率都高于基线",
        allStrataBetter,
        allStrataBetter ? "教学条件成立" : "当前账本不是“每层更好”的反转例"
      )
    ];

    return {
      ledger: ledger,
      cells: cells,
      methods: methods,
      strata: strata,
      crude: crude,
      standardized: standardized,
      allocation: allocation,
      allocationDifference: allocationDifference,
      assumptions: {
        positivity: positivity,
        conditionalRatesAvailable: positivity,
        exchangeabilityObserved: false,
        consistencyObserved: false
      },
      allStrataBetter: allStrataBetter,
      reversal: allStrataBetter && crudeDifference !== null && crudeDifference < -EPSILON,
      checks: checks
    };
  }

  function assertInvariants(input) {
    var result = analyze(input);
    var failed = result.checks.filter(function (item) { return !item.pass; });
    if (failed.length) {
      throw new Error("Simpson 账本不变量失败: " + failed.map(function (item) { return item.id; }).join(", "));
    }
    return result;
  }

  function formatNumber(value, digits) {
    if (!isFiniteNumber(value)) return "—";
    var places = digits === undefined ? 1 : digits;
    var text = value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
    return text === "-0" ? "0" : text;
  }

  function formatPercent(value, digits) {
    return value === null || !isFiniteNumber(value) ? "—" : formatNumber(value * 100, digits === undefined ? 1 : digits) + "%";
  }

  function formatPercentagePoints(value, digits) {
    if (value === null || !isFiniteNumber(value)) return "—";
    var number = value * 100;
    return (number > 0 ? "+" : "") + formatNumber(number, digits === undefined ? 1 : digits) + " 个百分点";
  }

  var pureModel = {
    strata: STRATA.map(function (item) { return copyObject(item); }),
    methods: METHODS.map(function (item) { return copyObject(item); }),
    targetCounts: copyObject(DEFAULT_TARGET_COUNTS),
    presets: Object.keys(PRESETS).map(function (id) { return ledgerForPreset(id); }),
    ledgerForPreset: ledgerForPreset,
    analyze: analyze,
    assertInvariants: assertInvariants,
    formatPercent: formatPercent,
    formatPercentagePoints: formatPercentagePoints
  };

  if (typeof module === "object" && module.exports) {
    module.exports = pureModel;
    return;
  }

  if (!host || !host.CourseLearning || typeof host.CourseLearning.register !== "function") return;

  function installStyles() {
    var doc = host.document;
    if (!doc || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".cl-simpson-confounding { --sc-base: #356f9b; --sc-ai: #39734d; --sc-warn: #b64335; --sc-gold: #9b6a12; max-width: 100%; min-width: 0; margin: 1.4rem 0 2rem; color: var(--fg); }",
      "html[data-theme=\"dark\"] .cl-simpson-confounding { --sc-base: #86c8f1; --sc-ai: #79c798; --sc-warn: #f08c7d; --sc-gold: #e2b458; }",
      ".cl-simpson-confounding *, .cl-simpson-confounding *::before, .cl-simpson-confounding *::after { box-sizing: border-box; }",
      ".cl-simpson-confounding .sc-shell { max-width: 100%; min-width: 0; overflow: hidden; border: 1px solid var(--border); border-radius: 8px; background: var(--bg); }",
      ".cl-simpson-confounding .sc-header { padding: 1rem 1.1rem .9rem; border-bottom: 1px solid var(--border); background: var(--block-bg); }",
      ".cl-simpson-confounding .sc-kicker { margin: 0 0 .25rem; color: var(--accent); font-size: .74rem; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }",
      ".cl-simpson-confounding h3, .cl-simpson-confounding h4 { color: var(--fg); }",
      ".cl-simpson-confounding .sc-header h3 { margin: 0; font-size: 1.18rem; }",
      ".cl-simpson-confounding .sc-header p { margin: .42rem 0 0; color: var(--fg-soft); line-height: 1.55; }",
      ".cl-simpson-confounding .sc-controls { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr); gap: .75rem; padding: .85rem 1.05rem; border-bottom: 1px solid var(--border); background: var(--block-bg); }",
      ".cl-simpson-confounding .sc-fieldset { min-width: 0; margin: 0; padding: .65rem .7rem .72rem; border: 1px solid var(--border); border-radius: 6px; }",
      ".cl-simpson-confounding .sc-fieldset legend { padding: 0 .25rem; color: var(--fg-soft); font-size: .78rem; font-weight: 750; }",
      ".cl-simpson-confounding .sc-fieldset-note { margin: .55rem 0 0; color: var(--fg-soft); font-size: .75rem; line-height: 1.45; }",
      ".cl-simpson-confounding .sc-button-row { display: flex; flex-wrap: wrap; gap: .45rem; }",
      ".cl-simpson-confounding button { min-height: 44px; max-width: 100%; padding: .45rem .68rem; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--fg); cursor: pointer; font: inherit; font-size: .8rem; font-weight: 700; }",
      ".cl-simpson-confounding button:hover { border-color: var(--accent); }",
      ".cl-simpson-confounding button[aria-pressed=\"true\"] { border-color: var(--accent); background: var(--accent); color: var(--bg); }",
      ".cl-simpson-confounding button:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
      ".cl-simpson-confounding .sc-body { min-width: 0; padding: 1rem 1.05rem 1.1rem; }",
      ".cl-simpson-confounding .sc-feedback { margin: 0 0 .85rem; padding: .65rem .75rem; border-left: 4px solid var(--sc-gold); background: var(--block-bg); color: var(--fg-soft); font-size: .82rem; line-height: 1.55; }",
      ".cl-simpson-confounding .sc-feedback.sc-correct { border-left-color: var(--sc-ai); }",
      ".cl-simpson-confounding .sc-feedback.sc-incorrect { border-left-color: var(--sc-warn); }",
      ".cl-simpson-confounding .sc-layout { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(270px, .85fr); gap: .85rem; align-items: start; }",
      ".cl-simpson-confounding .sc-card { min-width: 0; padding: .75rem; border: 1px solid var(--border); border-radius: 7px; background: var(--block-bg); }",
      ".cl-simpson-confounding .sc-card h4 { margin: 0 0 .55rem; font-size: .9rem; }",
      ".cl-simpson-confounding .sc-card-intro { margin: -.15rem 0 .65rem; color: var(--fg-soft); font-size: .78rem; line-height: 1.5; }",
      ".cl-simpson-confounding .sc-chart { min-width: 0; display: grid; gap: .55rem; }",
      ".cl-simpson-confounding .sc-chart-legend { display: flex; flex-wrap: wrap; gap: .45rem .85rem; margin: 0 0 .15rem; color: var(--fg-soft); font-size: .74rem; }",
      ".cl-simpson-confounding .sc-key { display: inline-flex; align-items: center; gap: .32rem; }",
      ".cl-simpson-confounding .sc-swatch { display: inline-block; width: .85rem; height: .55rem; border-radius: 2px; background: var(--sc-base); }",
      ".cl-simpson-confounding .sc-swatch[data-method=\"ai\"] { background: var(--sc-ai); }",
      ".cl-simpson-confounding .sc-chart-row { min-width: 0; padding: .55rem .6rem; border: 1px solid var(--border); border-radius: 5px; background: var(--bg); }",
      ".cl-simpson-confounding .sc-chart-row.sc-overall-row { margin-top: .25rem; border: 2px solid var(--sc-warn); }",
      ".cl-simpson-confounding .sc-chart-label { display: flex; align-items: baseline; justify-content: space-between; gap: .5rem; margin-bottom: .4rem; }",
      ".cl-simpson-confounding .sc-chart-label strong { font-size: .84rem; }",
      ".cl-simpson-confounding .sc-chart-label span { color: var(--fg-soft); font-size: .72rem; text-align: right; }",
      ".cl-simpson-confounding .sc-bar-row { display: grid; grid-template-columns: 3.7rem minmax(0, 1fr) 5.6rem; gap: .4rem; align-items: center; min-width: 0; margin-top: .32rem; }",
      ".cl-simpson-confounding .sc-bar-method { color: var(--fg-soft); font-size: .74rem; }",
      ".cl-simpson-confounding .sc-bar-track { min-width: 0; height: 1rem; overflow: hidden; border: 1px solid var(--border); border-radius: 3px; background: var(--block-bg); }",
      ".cl-simpson-confounding .sc-bar-fill { display: block; height: 100%; min-width: 2px; border-radius: 2px; background: var(--sc-base); }",
      ".cl-simpson-confounding .sc-bar-fill[data-method=\"ai\"] { background: var(--sc-ai); }",
      ".cl-simpson-confounding .sc-bar-value { color: var(--fg); font-size: .75rem; font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; }",
      ".cl-simpson-confounding .sc-chart-note { margin: .55rem 0 0; color: var(--fg-soft); font-size: .74rem; line-height: 1.5; }",
      ".cl-simpson-confounding .sc-comparison { display: grid; gap: .6rem; }",
      ".cl-simpson-confounding .sc-rate-block { padding: .6rem .65rem; border-top: 2px solid var(--border); background: var(--bg); }",
      ".cl-simpson-confounding .sc-rate-block[data-kind=\"crude\"] { border-top-color: var(--sc-warn); }",
      ".cl-simpson-confounding .sc-rate-block[data-kind=\"standardized\"] { border-top-color: var(--sc-ai); }",
      ".cl-simpson-confounding .sc-rate-title { margin: 0 0 .45rem; color: var(--fg-soft); font-size: .76rem; font-weight: 750; }",
      ".cl-simpson-confounding .sc-rate-lines { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .4rem; }",
      ".cl-simpson-confounding .sc-rate-line { min-width: 0; }",
      ".cl-simpson-confounding .sc-rate-line span { display: block; color: var(--fg-soft); font-size: .72rem; }",
      ".cl-simpson-confounding .sc-rate-line strong { display: block; margin-top: .12rem; overflow-wrap: anywhere; color: var(--fg); font-size: .95rem; font-variant-numeric: tabular-nums; }",
      ".cl-simpson-confounding .sc-difference { margin: .5rem 0 0; padding-top: .45rem; border-top: 1px solid var(--border); color: var(--fg); font-size: .78rem; font-variant-numeric: tabular-nums; }",
      ".cl-simpson-confounding .sc-difference strong { font-size: .98rem; }",
      ".cl-simpson-confounding .sc-positive { color: var(--sc-ai); } .cl-simpson-confounding .sc-negative { color: var(--sc-warn); }",
      ".cl-simpson-confounding .sc-table-card { margin-top: .85rem; }",
      ".cl-simpson-confounding .sc-table-scroll { max-width: 100%; overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch; border: 1px solid var(--border); border-radius: 5px; }",
      ".cl-simpson-confounding table { border-collapse: collapse; font-size: .74rem; font-variant-numeric: tabular-nums; }",
      ".cl-simpson-confounding .sc-ledger-table { width: 100%; min-width: 760px; }",
      ".cl-simpson-confounding th, .cl-simpson-confounding td { padding: .42rem .45rem; border-bottom: 1px solid var(--border); text-align: right; white-space: nowrap; }",
      ".cl-simpson-confounding th:first-child, .cl-simpson-confounding td:first-child { text-align: left; }",
      ".cl-simpson-confounding th { color: var(--fg-soft); font-size: .7rem; font-weight: 750; }",
      ".cl-simpson-confounding .sc-ledger-table thead tr:first-child th { border-bottom: 0; background: var(--block-bg); }",
      ".cl-simpson-confounding .sc-ledger-table tbody tr:last-child td { border-bottom: 0; }",
      ".cl-simpson-confounding .sc-ledger-table .sc-ai-row td:first-child { color: var(--sc-ai); font-weight: 750; }",
      ".cl-simpson-confounding .sc-ledger-caption { margin: 0 0 .55rem; color: var(--fg-soft); font-size: .76rem; line-height: 1.5; }",
      ".cl-simpson-confounding .sc-lower-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .85rem; margin-top: .85rem; }",
      ".cl-simpson-confounding .sc-metric-list { display: grid; gap: .45rem; margin: 0; }",
      ".cl-simpson-confounding .sc-metric-line { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: .6rem; align-items: baseline; padding-bottom: .42rem; border-bottom: 1px solid var(--border); }",
      ".cl-simpson-confounding .sc-metric-line:last-child { padding-bottom: 0; border-bottom: 0; }",
      ".cl-simpson-confounding .sc-metric-line dt { color: var(--fg-soft); font-size: .75rem; }",
      ".cl-simpson-confounding .sc-metric-line dd { margin: 0; color: var(--fg); font-size: .82rem; font-variant-numeric: tabular-nums; text-align: right; }",
      ".cl-simpson-confounding .sc-note { margin: .65rem 0 0; color: var(--fg-soft); font-size: .75rem; line-height: 1.55; }",
      ".cl-simpson-confounding .sc-assumptions { margin: 0; padding-left: 1.1rem; color: var(--fg-soft); font-size: .77rem; line-height: 1.6; }",
      ".cl-simpson-confounding .sc-assumptions strong { color: var(--fg); }",
      ".cl-simpson-confounding .sc-checks { display: grid; gap: .35rem; margin: .65rem 0 0; padding: 0; list-style: none; }",
      ".cl-simpson-confounding .sc-checks li { display: grid; grid-template-columns: 1.1rem minmax(0, 1fr); gap: .35rem; color: var(--fg-soft); font-size: .74rem; line-height: 1.45; }",
      ".cl-simpson-confounding .sc-check-pass { color: var(--sc-ai); font-weight: 800; }",
      ".cl-simpson-confounding .sc-check-fail { color: var(--sc-warn); font-weight: 800; }",
      ".cl-simpson-confounding .sc-sr-only { position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip: rect(0, 0, 0, 0) !important; white-space: nowrap !important; border: 0 !important; }",
      "@media (max-width: 760px) { .cl-simpson-confounding .sc-controls, .cl-simpson-confounding .sc-layout, .cl-simpson-confounding .sc-lower-grid { grid-template-columns: minmax(0, 1fr); } }",
      "@media (max-width: 430px) { .cl-simpson-confounding .sc-header, .cl-simpson-confounding .sc-body { padding-left: .7rem; padding-right: .7rem; } .cl-simpson-confounding .sc-controls { padding-left: .7rem; padding-right: .7rem; } .cl-simpson-confounding .sc-rate-lines { grid-template-columns: minmax(0, 1fr); } .cl-simpson-confounding .sc-bar-row { grid-template-columns: 3.1rem minmax(0, 1fr) 5.3rem; gap: .3rem; } .cl-simpson-confounding .sc-bar-value { font-size: .7rem; } }",
      "@media (prefers-reduced-motion: reduce) { .cl-simpson-confounding *, .cl-simpson-confounding *::before, .cl-simpson-confounding *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }"
    ].join("\n");
    (doc.head || doc.documentElement).appendChild(style);
  }

  function countText(summary) {
    return summary.successes + "/" + summary.total;
  }

  function rateText(summary) {
    return countText(summary) + " = " + formatPercent(summary.rate);
  }

  function differenceClass(value) {
    if (value === null) return "";
    return value > 0 ? "sc-positive" : value < 0 ? "sc-negative" : "";
  }

  function makeBarRow(summary, api) {
    var percentage = summary.rate === null ? 0 : clamp(summary.rate * 100, 0, 100);
    var methodId = summary.method || summary.id;
    var displayedMethod = summary.methodLabel || summary.label || methodLabel(methodId);
    var displayedStratum = summary.stratumLabel || "总体";
    var trackAttrs = {
      className: "sc-bar-track",
      role: "progressbar",
      "aria-label": displayedMethod + "在" + displayedStratum + "的成功率",
      "aria-valuemin": "0",
      "aria-valuemax": "100",
      "aria-valuetext": summary.rate === null ? "无可用观测" : rateText(summary)
    };
    if (summary.rate !== null) trackAttrs["aria-valuenow"] = formatNumber(percentage, 1);
    return api.el("div", { className: "sc-bar-row" }, [
      api.el("span", { className: "sc-bar-method", text: displayedMethod }),
      api.el("div", trackAttrs, [
        api.el("span", {
          className: "sc-bar-fill",
          "data-method": methodId,
          style: "width: " + percentage + "%"
        })
      ]),
      api.el("strong", { className: "sc-bar-value", text: rateText(summary) })
    ]);
  }

  function makeChartRow(label, baseline, ai, difference, api, overall) {
    var differenceText = overall
      ? "AI − 基线 " + formatPercentagePoints(difference)
      : "层内 AI − 基线 " + formatPercentagePoints(difference);
    var rowClass = "sc-chart-row" + (overall ? " sc-overall-row" : "");
    return api.el("div", { className: rowClass }, [
      api.el("div", { className: "sc-chart-label" }, [
        api.el("strong", { text: label }),
        api.el("span", { text: differenceText })
      ]),
      makeBarRow(baseline, api),
      makeBarRow(ai, api)
    ]);
  }

  function buildChart(result, api) {
    var chartRows = [
      api.el("div", { className: "sc-chart-legend", "aria-label": "柱状图图例" }, [
        api.el("span", { className: "sc-key" }, [
          api.el("i", { className: "sc-swatch", "aria-hidden": "true" }),
          api.el("span", { text: "基线" })
        ]),
        api.el("span", { className: "sc-key" }, [
          api.el("i", { className: "sc-swatch", "data-method": "ai", "aria-hidden": "true" }),
          api.el("span", { text: "AI 辅助" })
        ])
      ])
    ];
    result.strata.forEach(function (stratum) {
      chartRows.push(makeChartRow(stratum.label, stratum.baseline, stratum.ai, stratum.difference, api, false));
    });
    chartRows.push(makeChartRow("粗合并", result.crude.baseline, result.crude.ai, result.crude.difference, api, true));
    chartRows.push(api.el("p", {
      className: "sc-chart-note",
      text: "看绿色条与蓝色条的相对长度：前两行 AI 较长，最后一行因任务构成不同而较短。"
    }));
    return api.el("div", {
      className: "sc-chart",
      role: "group",
      "aria-label": "按简单任务、困难任务和粗合并比较基线与 AI 辅助的成功率"
    }, chartRows);
  }

  function makeRateBlock(title, kind, baseline, ai, difference, intro, api) {
    var differenceLabel = difference === null
      ? "差异暂不可计算"
      : "差异（AI − 基线）";
    var differenceNode = api.el("p", {
      className: "sc-difference " + differenceClass(difference)
    }, [
      api.el("span", { text: differenceLabel + (difference === null ? "" : "：") }),
      difference === null ? null : api.el("strong", { text: formatPercentagePoints(difference) })
    ]);
    return api.el("div", { className: "sc-rate-block", "data-kind": kind }, [
      api.el("p", { className: "sc-rate-title", text: title }),
      intro ? api.el("p", { className: "sc-card-intro", text: intro }) : null,
      api.el("div", { className: "sc-rate-lines" }, [
        api.el("div", { className: "sc-rate-line" }, [
          api.el("span", { text: "基线" }),
          api.el("strong", { text: rateText(baseline) })
        ]),
        api.el("div", { className: "sc-rate-line" }, [
          api.el("span", { text: "AI 辅助" }),
          api.el("strong", { text: rateText(ai) })
        ])
      ]),
      differenceNode
    ]);
  }

  function buildComparison(result, api) {
    var targetSummary = "目标构成：简单 " + result.standardized.targetCounts.simple + "/" +
      result.standardized.targetTotal + "，困难 " + result.standardized.targetCounts.hard + "/" +
      result.standardized.targetTotal + "（固定 50% / 50%）";
    return api.el("section", { className: "sc-card" }, [
      api.el("h4", { text: "同一账本的两种合并方式" }),
      api.el("div", { className: "sc-comparison" }, [
        makeRateBlock(
          "粗合并：保留观察到的任务构成",
          "crude",
          result.crude.baseline,
          result.crude.ai,
          result.crude.difference,
          "直接把各方法收到的所有任务相加；这是描述性总体率。",
          api
        ),
        makeRateBlock(
          "标准化：固定目标构成后再合并",
          "standardized",
          result.standardized.baseline,
          result.standardized.ai,
          result.standardized.difference,
          targetSummary + "；投影成功数保持为整数。",
          api
        )
      ]),
      api.el("p", {
        className: "sc-note",
        text: "标准化回答“若两边都面对同一目标构成，层内观察率会拼出什么描述性总体率？”；它不是自动获得的因果效果。"
      })
    ]);
  }

  function buildLedgerTable(result, api) {
    function cell(method, stratum) {
      return result.cells.filter(function (item) {
        return item.method === method && item.stratum === stratum;
      })[0];
    }
    function textCell(value) { return api.el("td", { text: String(value) }); }
    var table = api.el("table", { className: "sc-ledger-table" });
    table.appendChild(api.el("caption", {
      className: "sc-sr-only",
      text: "2×2×2 计数账本：方法 × 任务难度 × 成功或失败"
    }));
    table.appendChild(api.el("thead", {}, [
      api.el("tr", {}, [
        api.el("th", { rowspan: "2", scope: "col", text: "方法" }),
        api.el("th", { colspan: "3", scope: "colgroup", text: "简单任务" }),
        api.el("th", { colspan: "3", scope: "colgroup", text: "困难任务" }),
        api.el("th", { colspan: "2", scope: "colgroup", text: "合计" }),
        api.el("th", { rowspan: "2", scope: "col", text: "粗率" })
      ]),
      api.el("tr", {}, [
        api.el("th", { scope: "col", text: "成功" }),
        api.el("th", { scope: "col", text: "失败" }),
        api.el("th", { scope: "col", text: "总数" }),
        api.el("th", { scope: "col", text: "成功" }),
        api.el("th", { scope: "col", text: "失败" }),
        api.el("th", { scope: "col", text: "总数" }),
        api.el("th", { scope: "col", text: "成功" }),
        api.el("th", { scope: "col", text: "失败" })
      ])
    ]));
    table.appendChild(api.el("tbody", {}, result.methods.map(function (method) {
      var simple = cell(method.id, "simple");
      var hard = cell(method.id, "hard");
      var rowClass = method.id === "ai" ? "sc-ai-row" : "";
      return api.el("tr", { className: rowClass }, [
        api.el("th", { scope: "row", text: method.label }),
        textCell(simple.successes), textCell(simple.failures), textCell(simple.total),
        textCell(hard.successes), textCell(hard.failures), textCell(hard.total),
        textCell(method.successes), textCell(method.failures), textCell(formatPercent(method.rate))
      ]);
    })));
    return api.el("div", { className: "sc-table-scroll" }, [table]);
  }

  function buildAllocation(result, api) {
    var baseline = result.allocation.filter(function (item) { return item.id === "baseline"; })[0];
    var ai = result.allocation.filter(function (item) { return item.id === "ai"; })[0];
    var metrics = [
      { label: "基线：简单任务构成", value: baseline.simple + "/" + baseline.total + " = " + formatPercent(baseline.simpleShare) },
      { label: "基线：困难任务构成", value: baseline.hard + "/" + baseline.total + " = " + formatPercent(baseline.hardShare) },
      { label: "AI：简单任务构成", value: ai.simple + "/" + ai.total + " = " + formatPercent(ai.simpleShare) },
      { label: "AI：困难任务构成", value: ai.hard + "/" + ai.total + " = " + formatPercent(ai.hardShare) },
      { label: "困难任务构成差（AI − 基线）", value: formatPercentagePoints(result.allocationDifference) }
    ];
    return api.el("section", { className: "sc-card" }, [
      api.el("h4", { text: "分配不平衡：混杂从哪里来" }),
      api.el("dl", { className: "sc-metric-list" }, metrics.map(function (metric) {
        return api.el("div", { className: "sc-metric-line" }, [
          api.el("dt", { text: metric.label }),
          api.el("dd", { text: metric.value })
        ]);
      })),
      api.el("p", {
        className: "sc-note",
        text: "困难任务本身更难；当 AI 组承担了更多困难任务，任务难度就是方法与结果之间的混杂变量。"
      })
    ]);
  }

  function buildChecks(result, api) {
    return api.el("section", { className: "sc-card" }, [
      api.el("h4", { text: "计算自检与识别边界" }),
      api.el("ul", { className: "sc-checks" }, result.checks.map(function (item) {
        return api.el("li", {}, [
          api.el("span", {
            className: item.pass ? "sc-check-pass" : "sc-check-fail",
            text: item.pass ? "✓" : "!",
            "aria-hidden": "true"
          }),
          api.el("span", {}, [
            api.el("strong", { text: item.label }),
            api.el("span", { text: "（" + item.detail + "）" })
          ])
        ]);
      })),
      api.el("p", {
        className: "sc-note",
        text: "本算术能检查 positivity 的计数条件，却不能从计数本身证明 exchangeability 或 consistency。"
      })
    ]);
  }

  function buildAssumptions(api) {
    return api.el("section", { className: "sc-card" }, [
      api.el("h4", { text: "三种读法：描述、标准化、因果" }),
      api.el("ul", { className: "sc-assumptions" }, [
        api.el("li", {}, [
          api.el("strong", { text: "描述性分层：" }),
          api.el("span", { text: "在简单/困难层内报告成功率；不声称 AI 导致了差异。" })
        ]),
        api.el("li", {}, [
          api.el("strong", { text: "标准化：" }),
          api.el("span", { text: "把观察到的层内率放到固定目标权重；是构成可比的描述，目标权重要在看结果前固定。" })
        ]),
        api.el("li", {}, [
          api.el("strong", { text: "因果识别还需要：" }),
          api.el("span", { text: "positivity（每个方法×层都有支持）、exchangeability/无未测混杂（Yᵃ ⟂ A | 层）、consistency（实际方法与定义的处理一致），以及可靠的结果测量。" })
        ]),
        api.el("li", {}, [
          api.el("strong", { text: "随机试验：" }),
          api.el("span", { text: "在每层内随机分配方法可由设计支持 exchangeability；仍要检查实施、脱落、干扰与评分一致性。观察性标准化不能冒充随机试验。" })
        ])
      ])
    ]);
  }

  function actualDirection(result) {
    if (result.crude.difference === null) return "unknown";
    return result.crude.difference > EPSILON ? "ai-higher" : result.crude.difference < -EPSILON ? "ai-lower" : "tie";
  }

  function actualDirectionText(direction) {
    if (direction === "ai-higher") return "AI 辅助总体更高";
    if (direction === "ai-lower") return "AI 辅助总体更低";
    if (direction === "tie") return "总体相同";
    return "总体不可计算";
  }

  function buildFeedback(result, prediction, api) {
    var direction = actualDirection(result);
    var text;
    var className = "sc-feedback";
    if (!prediction) {
      text = "先预测粗合并方向：如果只看总数，你会认为 AI 辅助更高、更低，还是暂时不能判断？选完后再核对计数账本。";
    } else if (prediction === "unknown") {
      text = "你的选择是“无法判断”；账本一旦展开其实可以计算。粗合并结论：" + actualDirectionText(direction) + "（" + formatPercentagePoints(result.crude.difference) + "）。";
      className += " sc-incorrect";
    } else if (prediction === direction) {
      text = "预测命中。粗合并结论：" + actualDirectionText(direction) + "（" + formatPercentagePoints(result.crude.difference) + "）。再看层内条形，确认这不是“AI 在每层都更差”。";
      className += " sc-correct";
    } else {
      text = "预测未命中。粗合并结论：" + actualDirectionText(direction) + "（" + formatPercentagePoints(result.crude.difference) + "）；请回到账本检查每个分母和困难任务占比。";
      className += " sc-incorrect";
    }
    return api.el("p", { className: className, "aria-live": "polite", text: text });
  }

  function buildReport(result, state, api) {
    var tableCard = api.el("section", { className: "sc-card sc-table-card" }, [
      api.el("h4", { text: "2×2×2 计数账本：方法 × 难度 × 成功/失败" }),
      api.el("p", {
        className: "sc-ledger-caption",
        text: "每个单元格都保留成功、失败、总数；百分比只是整数计数相除。表格可在窄屏内横向滚动。"
      }),
      buildLedgerTable(result, api)
    ]);
    return api.el("div", { className: "sc-body" }, [
      buildFeedback(result, state.prediction, api),
      api.el("div", { className: "sc-layout" }, [
        api.el("section", { className: "sc-card" }, [
          api.el("h4", { text: "层内成功率 vs 粗合并成功率" }),
          api.el("p", { className: "sc-card-intro", text: result.ledger.description }),
          buildChart(result, api)
        ]),
        buildComparison(result, api)
      ]),
      tableCard,
      api.el("div", { className: "sc-lower-grid" }, [
        buildAllocation(result, api),
        buildAssumptions(api),
        buildChecks(result, api)
      ])
    ]);
  }

  function buildLab(root, api) {
    installStyles();
    INSTANCE_COUNT += 1;
    var instanceId = "cl-simpson-" + INSTANCE_COUNT;
    var state = { preset: "reversal", prediction: null };
    var presetButtons = [];
    var predictionButtons = [];
    var body;

    root.classList.add("cl-simpson-confounding");

    var presetGroup = api.el("div", {
      className: "sc-button-row",
      role: "group",
      "aria-label": "账本预设"
    });
    pureModel.presets.forEach(function (preset) {
      var button = api.el("button", {
        type: "button",
        text: preset.label,
        "data-preset": preset.id,
        "aria-pressed": preset.id === state.preset ? "true" : "false",
        onclick: function () {
          state.preset = preset.id;
          state.prediction = null;
          render();
          api.announce(root, "已切换到账本预设：" + preset.label + "。请重新预测粗合并方向。");
        }
      });
      presetButtons.push(button);
      presetGroup.appendChild(button);
    });

    var predictionGroup = api.el("div", {
      className: "sc-button-row",
      role: "group",
      "aria-label": "总体结果预测"
    });
    [
      { id: "ai-higher", label: "AI 总体更高" },
      { id: "ai-lower", label: "AI 总体更低" },
      { id: "unknown", label: "暂时不能判断" }
    ].forEach(function (definition) {
      var button = api.el("button", {
        type: "button",
        text: definition.label,
        "data-prediction": definition.id,
        "aria-pressed": "false",
        onclick: function () {
          state.prediction = definition.id;
          render();
          api.announce(root, "已记录你的预测：" + definition.label + "。");
        }
      });
      predictionButtons.push(button);
      predictionGroup.appendChild(button);
    });

    var header = api.el("header", { className: "sc-header" }, [
      api.el("p", { className: "sc-kicker", text: "2×2×2 integer ledger · Simpson confounding" }),
      api.el("h3", { text: "每层都更好，合并却更差？" }),
      api.el("p", {
        text: "先用一个具体科研比较做预测，再把方法×任务难度×成功/失败的整数账本展开；所有率、差异和标准化结果都能回到分子与分母。"
      })
    ]);
    var controls = api.el("div", { className: "sc-controls" }, [
      api.el("fieldset", { className: "sc-fieldset" }, [
        api.el("legend", { text: "切换分配情景" }),
        presetGroup,
        api.el("p", { className: "sc-fieldset-note", text: "反转 / 无反转 / 平衡；每次切换都会清空预测。" })
      ]),
      api.el("fieldset", { className: "sc-fieldset" }, [
        api.el("legend", { text: "先预测粗合并方向" }),
        predictionGroup,
        api.el("p", { className: "sc-fieldset-note", text: "不要只凭一个总体百分比判断方法优劣；先写下你的方向，再核对层内分母。" })
      ])
    ]);
    body = api.el("div", {});
    root.replaceChildren(api.el("div", { className: "sc-shell" }, [header, controls, body]));

    function render() {
      var result = pureModel.analyze(state.preset);
      presetButtons.forEach(function (button) {
        button.setAttribute("aria-pressed", button.getAttribute("data-preset") === state.preset ? "true" : "false");
      });
      predictionButtons.forEach(function (button) {
        button.setAttribute("aria-pressed", button.getAttribute("data-prediction") === state.prediction ? "true" : "false");
      });
      body.replaceChildren(buildReport(result, state, api));
    }

    render();
  }

  host.CourseLearning.register("simpson-confounding", buildLab);
})(typeof window !== "undefined" ? window : null);

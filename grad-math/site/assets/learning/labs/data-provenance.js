(function (host) {
  "use strict";

  /*
   * A deterministic, intentionally small ledger for teaching data lineage.
   * The pure model is exported first so Node can run the same assertions that
   * the browser lab uses.  Nothing here calls a network or a random source.
   */
  var EPSILON = 1e-12;
  var STYLE_ID = "cl-data-provenance-styles";
  var INSTANCE_COUNT = 0;
  var GUARD_STAGES = [
    { id: "join-unique", label: "validate join" },
    { id: "row-count", label: "行数检查" },
    { id: "missing-report", label: "缺失报告" },
    { id: "denominator-declared", label: "分母声明" }
  ];

  var ORDERS = [
    { order_id: "o1", customer_id: "c1", region: "north", amount: 10, qualified: true },
    { order_id: "o2", customer_id: "c2", region: "south", amount: 20, qualified: true },
    { order_id: "o3", customer_id: "c3", region: "north", amount: 30, qualified: false },
    { order_id: "o4", customer_id: "c4", region: "south", amount: 40, qualified: true },
    { order_id: "o5", customer_id: "c5", region: "north", amount: 50, qualified: true },
    { order_id: "o6", customer_id: "c6", region: "south", amount: 60, qualified: true }
  ];

  var CUSTOMERS = [
    { customer_id: "c1", segment: "new" },
    { customer_id: "c2", segment: "new" },
    { customer_id: "c3", segment: "returning" },
    { customer_id: "c4", segment: "returning" },
    { customer_id: "c5", segment: "new" },
    { customer_id: "c6", segment: "returning" }
  ];

  var PRESETS = {
    baseline: {
      id: "baseline",
      label: "正确基线",
      description: "一对一 join、全量记录、全量分母：north 的合格率 = 2/3。",
      customers: CUSTOMERS
    },
    duplicate: {
      id: "duplicate",
      label: "重复键 → 一对多膨胀",
      description: "事实表订单键仍唯一，但维表把 c5 键写了两次；naive join 会把 o5 算两次。",
      customers: CUSTOMERS.concat([{ customer_id: "c5", segment: "new-copy" }])
    },
    missing: {
      id: "missing",
      label: "缺失被静默删除",
      description: "维表缺少 c6；inner join 丢掉一条 south 记录，结果看似仍正常。",
      customers: CUSTOMERS.slice(0, 5)
    },
    denominator: {
      id: "denominator",
      label: "分母 / 筛选口径变化",
      description: "同一记录若先筛 qualified，再计算“合格率”，分母变成合格记录数。",
      customers: CUSTOMERS
    }
  };

  function cloneRows(rows) {
    return rows.map(function (row) {
      var copy = {};
      Object.keys(row).forEach(function (key) { copy[key] = row[key]; });
      return copy;
    });
  }

  function finiteNumber(value) {
    return typeof value === "number" && isFinite(value);
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function getPreset(id) {
    var preset = PRESETS[id];
    if (!preset) throw new Error("未知预设: " + id);
    return {
      id: preset.id,
      label: preset.label,
      description: preset.description,
      orders: cloneRows(ORDERS),
      customers: cloneRows(preset.customers)
    };
  }

  function keyCounts(rows, key) {
    var counts = Object.create(null);
    rows.forEach(function (row) {
      var value = row[key];
      counts[value] = (counts[value] || 0) + 1;
    });
    return counts;
  }

  function duplicateKeys(rows, key) {
    var counts = keyCounts(rows, key);
    return Object.keys(counts).filter(function (value) { return counts[value] > 1; });
  }

  function joinRows(orders, customers, mode) {
    var joined = [];
    orders.forEach(function (order) {
      customers.forEach(function (customer) {
        if (order.customer_id !== customer.customer_id) return;
        joined.push({
          order_id: order.order_id,
          customer_id: order.customer_id,
          region: order.region,
          amount: order.amount,
          qualified: order.qualified,
          segment: customer.segment,
          join_mode: mode
        });
      });
    });
    return joined;
  }

  function dedupeCustomers(customers) {
    var seen = Object.create(null);
    return customers.filter(function (customer) {
      if (seen[customer.customer_id]) return false;
      seen[customer.customer_id] = true;
      return true;
    });
  }

  function missingKeys(orders, customers) {
    var customerKeys = keyCounts(customers, "customer_id");
    return orders.map(function (order) { return order.customer_id; }).filter(function (key, index, all) {
      return !customerKeys[key] && all.indexOf(key) === index;
    });
  }

  function ratio(numerator, denominator) {
    return denominator === 0 ? null : numerator / denominator;
  }

  function guardStageOf(options) {
    var rawStage = options && options.guardStage !== undefined ? options.guardStage : options && options.guardLevel;
    if (rawStage !== undefined) {
      var stage = Number(rawStage);
      if (isFinite(stage)) return Math.max(0, Math.min(GUARD_STAGES.length, Math.floor(stage)));
    }
    return options && options.guarded ? GUARD_STAGES.length : 0;
  }

  function metric(rows, denominatorMode) {
    var selected = rows;
    if (denominatorMode === "qualified-only") {
      selected = rows.filter(function (row) { return row.qualified; });
    }
    var north = selected.filter(function (row) { return row.region === "north"; });
    var numerator = north.filter(function (row) { return row.qualified; }).length;
    return {
      denominatorMode: denominatorMode,
      region: "north",
      numerator: numerator,
      denominator: north.length,
      rate: ratio(numerator, north.length),
      rows: selected.length
    };
  }

  function rowIds(rows) {
    return rows.map(function (row) { return row.order_id; });
  }

  function analyze(input, options) {
    var preset = typeof input === "string" ? getPreset(input) : input;
    assert(preset && Array.isArray(preset.orders) && Array.isArray(preset.customers), "输入必须包含 orders 与 customers");
    options = options || {};
    var guardStage = guardStageOf(options);
    var deduped = Boolean(options.deduped);
    var denominatorMode = options.denominatorMode || (preset.id === "denominator" ? "qualified-only" : "all-records");
    var customerRows = deduped ? dedupeCustomers(preset.customers) : cloneRows(preset.customers);
    var duplicateCustomerKeys = duplicateKeys(customerRows, "customer_id");
    var missingCustomerKeys = missingKeys(preset.orders, customerRows);
    var duplicateGuard = duplicateCustomerKeys.length === 0;
    var missingGuard = missingCustomerKeys.length === 0;
    var duplicateBlocked = guardStage >= 1 && !duplicateGuard;
    var joined = joinRows(preset.orders, customerRows, "inner");
    var rowCountCheck = joined.length === preset.orders.length;
    var rowCountBlocked = guardStage >= 2 && !rowCountCheck;
    var missingReport = {
      sourceRows: preset.orders.length,
      joinedRows: joined.length,
      missingKeys: missingCustomerKeys,
      droppedRows: preset.orders.length - new Set(rowIds(joined)).size
    };
    var missingBlocked = guardStage >= 3 && !missingGuard;
    var blocked = duplicateBlocked || rowCountBlocked || missingBlocked;
    var naiveMetric = metric(joined, denominatorMode);
    var auditedDenominatorMode = options.auditedDenominatorMode || "all-records";
    var auditedRows = joinRows(preset.orders, customerRows, "audited");
    var auditedMetric = blocked ? null : metric(auditedRows, auditedDenominatorMode);
    var denominatorMatch = denominatorMode === auditedDenominatorMode;
    var auditedConfirmed = Boolean(auditedMetric) && guardStage >= GUARD_STAGES.length && denominatorMatch && duplicateGuard && rowCountCheck && missingGuard;
    if (auditedMetric) {
      auditedMetric.auditStatus = auditedConfirmed ? "confirmed" : "unconfirmed";
      auditedMetric.auditLabel = auditedConfirmed ? "已确认" : "口径未确认";
      auditedMetric.auditReason = auditedConfirmed
        ? "四项护栏已启用且分母口径一致。"
        : (denominatorMatch ? "护栏尚未全部启用，当前值只作参考。" : "naive 与 audited 的分母口径不同，当前值只作参考。");
    }
    var warnings = [];
    if (!duplicateGuard) warnings.push("validate join：维表键不唯一，先去重或修复来源；当前 join 会发生一对多膨胀。");
    if (!missingGuard) warnings.push("缺失报告：inner join 丢失订单键 " + missingCustomerKeys.join(", ") + "；不能把 joined 行当全量记录。");
    if (!rowCountCheck) warnings.push("行数检查失败：join 后行数与订单源不一致。");
    if (!denominatorMatch) warnings.push("口径未确认：naive 使用“" + denominatorMode + "”，audited 使用“" + auditedDenominatorMode + "”；audited 数值只作参考。");
    if (duplicateBlocked) warnings.push("护栏已停在 validate join：先修复一对多键，再审计指标。");
    if (rowCountBlocked) warnings.push("护栏已停在行数检查：先解释 join 后的行数变化，暂不下结论。");
    if (missingBlocked) warnings.push("护栏已停在缺失报告：先决定补齐、排除并报告，暂不下结论。");
    if (blocked) warnings.push("审计结果：暂不下结论；naive 数值仍保留作对照。");
    var guardItems = [
      { id: "join-unique", label: "validate join", enabled: guardStage >= 1, pass: duplicateGuard, detail: duplicateGuard ? "customer_id 1→1" : "重复键: " + duplicateCustomerKeys.join(", ") },
      { id: "row-count", label: "行数检查", enabled: guardStage >= 2, pass: rowCountCheck, detail: preset.orders.length + " → " + joined.length },
      { id: "missing-report", label: "缺失报告", enabled: guardStage >= 3, pass: missingGuard, detail: missingGuard ? "未发现缺失键" : "缺失键: " + missingCustomerKeys.join(", ") },
      { id: "denominator-declared", label: "分母声明", enabled: guardStage >= 4, pass: denominatorMatch, detail: denominatorMode + " vs " + auditedDenominatorMode }
    ];
    var assertions = [
      { id: "join-unique", label: "join key 唯一", enabled: guardItems[0].enabled, pass: duplicateGuard, detail: guardItems[0].detail },
      { id: "row-count", label: "行数守恒", enabled: guardItems[1].enabled, pass: rowCountCheck, detail: guardItems[1].detail },
      { id: "missing-reported", label: "缺失已报告", enabled: guardItems[2].enabled, pass: missingGuard, detail: guardItems[2].detail },
      { id: "denominator-declared", label: "分母已声明", enabled: guardItems[3].enabled, pass: denominatorMatch, detail: guardItems[3].detail }
    ];
    return {
      preset: { id: preset.id, label: preset.label, description: preset.description },
      source: { orders: cloneRows(preset.orders), customers: cloneRows(preset.customers) },
      transformed: {
        customers: customerRows,
        joined: joined,
        auditedJoined: auditedRows
      },
      steps: [
        { id: "source", label: "原始记录", orders: preset.orders.length, customers: preset.customers.length },
        { id: "join", label: "inner join", orders: preset.orders.length, customers: customerRows.length, joined: joined.length },
        { id: "metric", label: "指标", denominatorMode: denominatorMode, metric: naiveMetric }
      ],
      guards: {
        stage: guardStage,
        enabledCount: guardStage,
        items: guardItems,
        validateJoin: duplicateGuard,
        rowCount: rowCountCheck,
        missingReport: missingGuard,
        denominatorDeclaration: denominatorMatch,
        denominatorConfirmed: auditedConfirmed,
        blocked: blocked
      },
      duplicateCustomerKeys: duplicateCustomerKeys,
      missingCustomerKeys: missingCustomerKeys,
      missingReport: missingReport,
      naive: naiveMetric,
      audited: auditedMetric,
      auditedStatus: blocked ? "blocked" : (auditedConfirmed ? "confirmed" : "unconfirmed"),
      warnings: warnings,
      assertions: assertions,
      conclusion: blocked
        ? (duplicateBlocked ? "审计结果被阻断：先修复一对多重复键，暂不下结论。"
          : (rowCountBlocked ? "结论被阻断：先解释 join 后的行数变化，暂不下结论。"
            : "结论被阻断：先处理缺失键并声明保留规则，暂不下结论。"))
        : (!denominatorMatch
          ? "口径未确认：audited 数值保留作参考，不称为已通过。"
          : (!auditedConfirmed
            ? "护栏未全部启用：audited 数值仍是未确认参考值。"
            : (naiveMetric && auditedMetric && Math.abs(naiveMetric.rate - auditedMetric.rate) > EPSILON
          ? "naive 与 audited 不一致：差异来自变换或分母口径，不是数据自然变化。"
              : (naiveMetric ? "当前两条路径数值一致，四项护栏与分母口径均已确认。" : "暂无可计算指标。"))))
    };
  }

  function selfTest() {
    var baseline = analyze("baseline", { denominatorMode: "all-records", auditedDenominatorMode: "all-records" });
    assert(baseline.source.orders.length === 6, "baseline source row count");
    assert(baseline.naive.numerator === 2 && baseline.naive.denominator === 3, "baseline north metric");
    assert(Math.abs(baseline.naive.rate - 2 / 3) < EPSILON, "baseline rate");
    assert(baseline.assertions.every(function (item) { return item.pass; }), "baseline assertions");

    var duplicate = analyze("duplicate", { denominatorMode: "all-records", auditedDenominatorMode: "all-records" });
    assert(duplicate.duplicateCustomerKeys.join(",") === "c5", "duplicate key discovery");
    assert(duplicate.transformed.joined.length === 7, "one-to-many expansion");
    assert(duplicate.naive.numerator === 3 && duplicate.naive.denominator === 4, "duplicate naive metric");
    assert(duplicate.warnings.some(function (warning) { return warning.indexOf("一对多膨胀") >= 0; }), "one-to-many warning");
    var duplicateGuarded = analyze("duplicate", { guardStage: 1, denominatorMode: "all-records" });
    assert(duplicateGuarded.naive.rate === 3 / 4 && duplicateGuarded.audited === null && duplicateGuarded.conclusion.indexOf("阻断") >= 0, "validate join blocks audited result");
    var duplicateFixed = analyze("duplicate", { deduped: true, denominatorMode: "all-records", auditedDenominatorMode: "all-records" });
    assert(duplicateFixed.transformed.joined.length === 6 && duplicateFixed.audited.rate === 2 / 3, "dedupe repair");

    var missing = analyze("missing", { denominatorMode: "all-records", auditedDenominatorMode: "all-records" });
    assert(missing.missingCustomerKeys.join(",") === "c6", "missing key discovery");
    assert(missing.transformed.joined.length === 5 && missing.missingReport.droppedRows === 1, "inner join drop");
    var missingGuarded = analyze("missing", { guardStage: 3, denominatorMode: "all-records" });
    assert(missingGuarded.naive.rate === 2 / 3 && missingGuarded.audited === null, "missing blocks audited result");
    assert(missingGuarded.conclusion.indexOf("暂不下结论") >= 0, "missing blocked conclusion");
    assert(missingGuarded.warnings.some(function (warning) { return warning.indexOf("缺失报告") >= 0; }), "missing warning");

    var denominator = analyze("denominator", { denominatorMode: "qualified-only", auditedDenominatorMode: "all-records" });
    assert(denominator.naive.numerator === 2 && denominator.naive.denominator === 2, "filtered denominator");
    assert(denominator.audited.numerator === 2 && denominator.audited.denominator === 3 && denominator.audited.auditStatus === "unconfirmed", "audited denominator is unconfirmed");
    assert(denominator.warnings.some(function (warning) { return warning.indexOf("口径未确认") >= 0; }), "denominator warning");

    var progressiveMissing = analyze("missing", { guardStage: 1, denominatorMode: "all-records" });
    assert(progressiveMissing.naive !== null, "first guard leaves missing example inspectable");
    progressiveMissing = analyze("missing", { guardStage: 2, denominatorMode: "all-records" });
    assert(progressiveMissing.naive.rate === 2 / 3 && progressiveMissing.audited === null && progressiveMissing.guards.blocked, "row-count guard blocks missing audited result");
    var confirmed = analyze("baseline", { guardStage: 4, denominatorMode: "all-records", auditedDenominatorMode: "all-records" });
    assert(confirmed.audited.auditStatus === "confirmed" && confirmed.auditedStatus === "confirmed", "fully guarded baseline confirms audited result");

    return { checks: 17, presets: Object.keys(PRESETS).length, status: "ok" };
  }

  var pureModel = {
    ORDERS: ORDERS,
    CUSTOMERS: CUSTOMERS,
    PRESETS: PRESETS,
    GUARD_STAGES: GUARD_STAGES,
    getPreset: getPreset,
    analyze: analyze,
    selfTest: selfTest
  };

  if (typeof module === "object" && module.exports) {
    module.exports = pureModel;
    if (typeof require !== "undefined" && require.main === module && process.argv.indexOf("--self-test") !== -1) {
      var report = selfTest();
      console.log("data-provenance self-test: " + report.status + " (" + report.checks + " checks, " + report.presets + " presets)");
    }
  }

  if (!host || !host.CourseLearning || typeof host.CourseLearning.register !== "function") return;

  var doc = host.document;
  var api = host.CourseLearning.api || {};

  function append(node, children) {
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function el(tag, attrs, children) {
    if (api && typeof api.el === "function") return api.el(tag, attrs || {}, children);
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", value);
      else if (key === "text") node.textContent = value;
      else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
      else node.setAttribute(key, value === true ? "" : String(value));
    });
    return append(node, children);
  }

  function fmtRate(value) {
    return finiteNumber(value) ? (value * 100).toFixed(1) + "%" : "—";
  }

  function fmtValue(value) {
    return value === null || value === undefined ? "—" : String(value);
  }

  function installStyles() {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".cl-data-provenance { --dp-bg: var(--bg, #15181d); --dp-panel: var(--block-bg, #20252c); --dp-fg: var(--fg, #eef2f5); --dp-soft: var(--fg-soft, #b1bcc7); --dp-border: var(--border, #3a4652); --dp-accent: var(--accent, #8fd3ff); --dp-good: #72bd8b; --dp-warn: #e2b458; --dp-bad: #f08c7d; color: var(--dp-fg); background: var(--dp-bg); border: 1px solid var(--dp-border); border-radius: 8px; overflow: hidden; font-size: .92rem; line-height: 1.5; }",
      ".cl-data-provenance *, .cl-data-provenance *::before, .cl-data-provenance *::after { box-sizing: border-box; }",
      ".cl-data-provenance .dp-header { padding: 1rem; border-bottom: 1px solid var(--dp-border); background: var(--dp-panel); }",
      ".cl-data-provenance h3, .cl-data-provenance h4 { margin: 0; color: var(--dp-fg); }",
      ".cl-data-provenance .dp-kicker { margin: 0 0 .25rem; color: var(--dp-accent); font-size: .76rem; font-weight: 700; letter-spacing: .04em; }",
      ".cl-data-provenance .dp-header p, .cl-data-provenance .dp-note { margin: .45rem 0 0; color: var(--dp-soft); }",
      ".cl-data-provenance .dp-controls { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, .8fr); gap: .7rem; padding: .8rem 1rem; border-bottom: 1px solid var(--dp-border); background: var(--dp-panel); }",
      ".cl-data-provenance .dp-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)) auto; align-items: center; gap: .7rem; padding: .8rem 1rem; border-bottom: 1px solid var(--dp-border); background: var(--dp-panel); }",
      ".cl-data-provenance label { display: grid; gap: .25rem; color: var(--dp-soft); font-size: .8rem; font-weight: 650; }",
      ".cl-data-provenance select, .cl-data-provenance button { min-height: 44px; border: 1px solid var(--dp-border); border-radius: 6px; background: var(--dp-bg); color: var(--dp-fg); font: inherit; }",
      ".cl-data-provenance select { width: 100%; padding: .5rem .6rem; }",
      ".cl-data-provenance button { padding: .5rem .7rem; cursor: pointer; }",
      ".cl-data-provenance button:hover { border-color: var(--dp-accent); }",
      ".cl-data-provenance button[aria-pressed=true], .cl-data-provenance .dp-primary { background: var(--dp-accent); border-color: var(--dp-accent); color: var(--dp-bg); font-weight: 700; }",
      ".cl-data-provenance button:focus-visible, .cl-data-provenance select:focus-visible { outline: 3px solid var(--dp-accent); outline-offset: 2px; }",
      ".cl-data-provenance .dp-guards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .45rem; padding: .7rem 1rem; border-bottom: 1px solid var(--dp-border); }",
      ".cl-data-provenance .dp-guard { display: grid; gap: .15rem; min-width: 0; padding: .45rem .5rem; border: 1px solid var(--dp-border); background: var(--dp-bg); color: var(--dp-soft); font-size: .72rem; }",
      ".cl-data-provenance .dp-guard strong { color: var(--dp-fg); font-size: .78rem; }",
      ".cl-data-provenance .dp-guard[data-pass=true] strong { color: var(--dp-good); }",
      ".cl-data-provenance .dp-guard[data-pass=false] strong { color: var(--dp-bad); }",
      ".cl-data-provenance .dp-guard[data-pass=pending] strong { color: var(--dp-soft); }",
      ".cl-data-provenance .dp-guard-status { align-self: center; color: var(--dp-soft); font-size: .78rem; font-variant-numeric: tabular-nums; }",
      ".cl-data-provenance .dp-main { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(280px, .9fr); gap: .85rem; padding: 1rem; }",
      ".cl-data-provenance .dp-card { min-width: 0; padding: .75rem; border: 1px solid var(--dp-border); background: var(--dp-panel); }",
      ".cl-data-provenance .dp-card + .dp-card { margin-top: .7rem; }",
      ".cl-data-provenance .dp-card h4 { margin-bottom: .5rem; font-size: .9rem; }",
      ".cl-data-provenance .dp-table-wrap { max-width: 100%; overflow-x: auto; }",
      ".cl-data-provenance table { width: 100%; min-width: 420px; border-collapse: collapse; font-size: .74rem; font-variant-numeric: tabular-nums; }",
      ".cl-data-provenance th, .cl-data-provenance td { padding: .36rem .4rem; border-bottom: 1px solid var(--dp-border); text-align: left; white-space: nowrap; }",
      ".cl-data-provenance th { color: var(--dp-soft); font-weight: 650; }",
      ".cl-data-provenance td { color: var(--dp-fg); }",
      ".cl-data-provenance .dp-duplicate { color: var(--dp-warn); font-weight: 700; }",
      ".cl-data-provenance .dp-missing { color: var(--dp-bad); font-weight: 700; }",
      ".cl-data-provenance .dp-metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .5rem; }",
      ".cl-data-provenance .dp-metric { min-width: 0; padding: .55rem; border-top: 2px solid var(--dp-accent); background: var(--dp-bg); }",
      ".cl-data-provenance .dp-metric span { display: block; color: var(--dp-soft); font-size: .72rem; }",
      ".cl-data-provenance .dp-metric strong { display: block; margin-top: .1rem; font-size: 1rem; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }",
      ".cl-data-provenance .dp-callout { margin-top: .65rem; padding: .6rem .7rem; border-left: 3px solid var(--dp-accent); background: var(--dp-bg); color: var(--dp-soft); font-size: .8rem; }",
      ".cl-data-provenance .dp-callout[data-kind=warn] { border-color: var(--dp-warn); }",
      ".cl-data-provenance .dp-callout[data-kind=bad] { border-color: var(--dp-bad); }",
      ".cl-data-provenance .dp-assertions { display: grid; gap: .4rem; margin: 0; padding: 0; list-style: none; }",
      ".cl-data-provenance .dp-assertions li { display: flex; justify-content: space-between; gap: .6rem; padding: .45rem .5rem; border-bottom: 1px solid var(--dp-border); font-size: .78rem; }",
      ".cl-data-provenance .dp-assertions li span:last-child { color: var(--dp-soft); text-align: right; }",
      ".cl-data-provenance .dp-pass { color: var(--dp-good) !important; font-weight: 700; }",
      ".cl-data-provenance .dp-fail { color: var(--dp-bad) !important; font-weight: 700; }",
      ".cl-data-provenance .dp-pending { color: var(--dp-soft) !important; font-weight: 700; }",
      ".cl-data-provenance .dp-steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .4rem; margin-top: .7rem; }",
      ".cl-data-provenance .dp-step { min-width: 0; padding: .5rem; border-top: 2px solid var(--dp-border); background: var(--dp-bg); color: var(--dp-soft); font-size: .72rem; }",
      ".cl-data-provenance .dp-step strong { display: block; color: var(--dp-fg); font-size: .8rem; }",
      ".cl-data-provenance .dp-sr-only { position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip: rect(0, 0, 0, 0) !important; white-space: nowrap !important; border: 0 !important; }",
      "@media (max-width: 700px) { .cl-data-provenance .dp-main { grid-template-columns: minmax(0, 1fr); } .cl-data-provenance .dp-guards { grid-template-columns: repeat(2, minmax(0, 1fr)); } .cl-data-provenance .dp-actions { grid-template-columns: repeat(2, minmax(0, 1fr)); } .cl-data-provenance .dp-guard-status { grid-column: 1 / -1; } }",
      "@media (max-width: 390px) { .cl-data-provenance { font-size: .88rem; } .cl-data-provenance .dp-header, .cl-data-provenance .dp-controls, .cl-data-provenance .dp-actions, .cl-data-provenance .dp-guards, .cl-data-provenance .dp-main { padding-left: .7rem; padding-right: .7rem; } .cl-data-provenance .dp-controls, .cl-data-provenance .dp-actions { grid-template-columns: minmax(0, 1fr); } .cl-data-provenance .dp-metrics { grid-template-columns: minmax(0, 1fr); } .cl-data-provenance .dp-steps { grid-template-columns: minmax(0, 1fr); } }"
    ].join("\n");
    doc.head.appendChild(style);
  }

  function renderTable(title, rows, columns, options) {
    options = options || {};
    return el("section", { className: "dp-card" }, [
      el("h4", { text: title }),
      el("div", { className: "dp-table-wrap" }, [
        el("table", {}, [
          el("thead", {}, [el("tr", {}, columns.map(function (column) { return el("th", { scope: "col", text: column.label }); }))]),
          el("tbody", {}, rows.map(function (row) {
            return el("tr", {}, columns.map(function (column) {
              var value = typeof column.value === "function" ? column.value(row) : row[column.value];
              var className = typeof options.cellClass === "function" ? options.cellClass(row, column) : "";
              return el("td", { className: className, text: fmtValue(value) });
            }));
          }))
        ])
      ])
    ]);
  }

  function mount(root) {
    installStyles();
    INSTANCE_COUNT += 1;
    var id = "dp-" + INSTANCE_COUNT;
    var state = { presetId: "baseline", guardStage: 0, deduped: false, denominatorMode: "all-records" };
    var shell = el("div", { className: "cl-data-provenance", id: id });
    var header = el("header", { className: "dp-header" }, [
      el("p", { className: "dp-kicker", text: "DATA PROVENANCE LEDGER" }),
      el("h3", { text: "数据分析溯源账本" }),
      el("p", { text: "先预测结论，再逐步打开护栏；每个数字都回指原始行与变换步骤。" })
    ]);
    var presetSelect = el("select", { id: id + "-preset", "aria-label": "选择预设" }, Object.keys(PRESETS).map(function (key) {
      return el("option", { value: key, text: PRESETS[key].label });
    }));
    var denominatorSelect = el("select", { id: id + "-denominator", "aria-label": "选择分母口径" }, [
      el("option", { value: "all-records", text: "分母：所有 north 记录" }),
      el("option", { value: "qualified-only", text: "分母：筛选后记录" })
    ]);
    var controls = el("div", { className: "dp-controls" }, [
      el("label", {}, ["预设", presetSelect]),
      el("label", {}, ["naive 指标分母", denominatorSelect])
    ]);
    var guardNames = ["validate join", "行数检查", "缺失报告", "分母声明"];
    var guardPanel = el("div", { className: "dp-guards", "aria-label": "审计护栏状态" }, guardNames.map(function (name) {
      return el("div", { className: "dp-guard" }, [el("strong", { text: name }), el("span", { text: "—" })]);
    }));
    var actionRow = el("div", { className: "dp-actions" }, [
      el("button", { type: "button", className: "dp-primary", text: "启用下一项护栏" }),
      el("button", { type: "button", text: "去重后重跑" }),
      el("span", { className: "dp-guard-status", "aria-live": "polite", text: "已启用护栏 0/4" })
    ]);
    var main = el("div", { className: "dp-main" });
    shell.appendChild(header);
    shell.appendChild(controls);
    shell.appendChild(guardPanel);
    shell.appendChild(actionRow);
    shell.appendChild(main);
    root.replaceChildren(shell);

    function update() {
      var preset = getPreset(state.presetId);
      var result = analyze(preset, {
        guardStage: state.guardStage,
        deduped: state.deduped,
        denominatorMode: state.denominatorMode,
        auditedDenominatorMode: "all-records"
      });
      presetSelect.value = state.presetId;
      denominatorSelect.value = state.denominatorMode;
      var flags = [result.guards.validateJoin, result.guards.rowCount, result.guards.missingReport, result.guards.denominatorDeclaration];
      guardPanel.querySelectorAll(".dp-guard").forEach(function (node, index) {
        var enabled = result.guards.items[index].enabled;
        node.setAttribute("data-pass", !enabled ? "pending" : (flags[index] ? "true" : "false"));
        node.querySelector("strong").textContent = guardNames[index];
        node.querySelector("span").textContent = !enabled ? "未启用" : (flags[index] ? "通过" : "需处理");
      });
      var nextButton = actionRow.querySelector("button");
      var dedupeButton = actionRow.querySelectorAll("button")[1];
      nextButton.textContent = state.guardStage < GUARD_STAGES.length
        ? "启用下一项护栏（" + state.guardStage + "/" + GUARD_STAGES.length + "）"
        : "全部护栏已启用（4/4）";
      nextButton.setAttribute("aria-pressed", state.guardStage === GUARD_STAGES.length ? "true" : "false");
      nextButton.disabled = state.guardStage === GUARD_STAGES.length;
      dedupeButton.textContent = state.deduped ? "已去重重跑" : "去重后重跑";
      dedupeButton.disabled = result.duplicateCustomerKeys.length === 0;
      actionRow.querySelector(".dp-guard-status").textContent = "已启用护栏 " + state.guardStage + "/" + GUARD_STAGES.length;
      var sourceOrderColumns = [
        { label: "order", value: "order_id" },
        { label: "customer", value: "customer_id" },
        { label: "region", value: "region" },
        { label: "qualified", value: function (row) { return row.qualified ? "是" : "否"; } },
        { label: "amount", value: "amount" }
      ];
      var customerColumns = [
        { label: "customer", value: "customer_id" },
        { label: "segment", value: "segment" }
      ];
      var joinedColumns = [
        { label: "order", value: "order_id" },
        { label: "customer", value: "customer_id" },
        { label: "segment", value: "segment" },
        { label: "region", value: "region" }
      ];
      var left = el("div", {}, [
        renderTable("原始订单（6 行）", result.source.orders, sourceOrderColumns, {
          cellClass: function (row) { return result.missingCustomerKeys.indexOf(row.customer_id) >= 0 ? "dp-missing" : ""; }
        }),
        renderTable("客户维表（当前预设）", result.source.customers, customerColumns, {
          cellClass: function (row) { return result.duplicateCustomerKeys.indexOf(row.customer_id) >= 0 ? "dp-duplicate" : ""; }
        }),
        renderTable(result.guards.blocked ? "join：审计被阻断" : "join 后记录", result.transformed.joined, joinedColumns, {
          cellClass: function (row) { return result.missingCustomerKeys.indexOf(row.customer_id) >= 0 ? "dp-missing" : ""; }
        })
      ]);
      var naive = result.naive;
      var audited = result.audited;
      var auditedText = audited
        ? fmtRate(audited.rate) + "（" + audited.numerator + "/" + audited.denominator + "） · " + audited.auditLabel
        : "阻断 · 暂不下结论";
      var right = el("div", {}, [
        el("section", { className: "dp-card" }, [
          el("h4", { text: "指标 / 断言" }),
          el("div", { className: "dp-metrics" }, [
            el("div", { className: "dp-metric" }, [el("span", { text: "naive north 合格率" }), el("strong", { text: naive ? fmtRate(naive.rate) + "（" + naive.numerator + "/" + naive.denominator + "）" : "阻断" })]),
            el("div", { className: "dp-metric" }, [el("span", { text: "audited north 合格率" }), el("strong", { text: auditedText })])
          ]),
          el("div", { className: "dp-callout", "data-kind": result.warnings.length ? "warn" : "", text: result.warnings.length ? result.warnings.join(" ") : result.conclusion }),
          el("ul", { className: "dp-assertions" }, result.assertions.map(function (item) {
            var className = !item.enabled ? "dp-pending" : (item.pass ? "dp-pass" : "dp-fail");
            var symbol = !item.enabled ? "· " : (item.pass ? "✓ " : "! ");
            var detail = item.enabled ? item.detail : "尚未启用";
            return el("li", {}, [el("span", { className: className, text: symbol + item.label }), el("span", { text: detail })]);
          }))
        ]),
        el("section", { className: "dp-card" }, [
          el("h4", { text: "变换步骤账本" }),
          el("div", { className: "dp-steps" }, [
            el("div", { className: "dp-step" }, [el("strong", { text: "1 · 原始" }), "orders=" + result.source.orders.length]),
            el("div", { className: "dp-step" }, [el("strong", { text: "2 · join" }), "joined=" + result.transformed.joined.length]),
            el("div", { className: "dp-step" }, [el("strong", { text: "3 · 指标" }), "分母=" + state.denominatorMode])
          ]),
          el("p", { className: "dp-note", text: "审计结果固定使用全量 north 记录作为分母；若业务问题要改口径，必须在报告中同时改名、改公式并保留计数。" })
        ])
      ]);
      main.replaceChildren(left, right);
    }

    presetSelect.addEventListener("change", function () {
      state.presetId = presetSelect.value;
      state.guardStage = 0;
      state.deduped = false;
      state.denominatorMode = state.presetId === "denominator" ? "qualified-only" : "all-records";
      update();
    });
    denominatorSelect.addEventListener("change", function () {
      state.denominatorMode = denominatorSelect.value;
      update();
    });
    actionRow.querySelector("button").addEventListener("click", function () {
      state.guardStage = Math.min(GUARD_STAGES.length, state.guardStage + 1);
      update();
    });
    actionRow.querySelectorAll("button")[1].addEventListener("click", function () {
      state.deduped = true;
      state.guardStage = Math.max(1, state.guardStage);
      update();
    });
    update();
  }

  host.CourseLearning.register("data-provenance", mount);
})(typeof window !== "undefined" ? window : null);

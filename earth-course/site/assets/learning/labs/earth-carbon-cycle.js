(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("earth-carbon-cycle", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("earth-carbon-cycle self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("earth-carbon-cycle self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var NAME = "earth-carbon-cycle";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var DEFAULTS = { emissions: 8, oceanRate: 0.02, landRate: 0.03, years: 100 };

  function clamp(value, low, high, fallback) {
    var number = Number(value);
    if (!Number.isFinite(number)) number = fallback;
    return Math.min(high, Math.max(low, number));
  }

  function integer(value, low, high, fallback) {
    return Math.round(clamp(value, low, high, fallback));
  }

  function format(value, digits) {
    if (!Number.isFinite(value)) return "-";
    var places = digits === undefined ? 2 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.01) return value.toExponential(2);
    return value.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }

  function assert(condition, message) {
    if (!condition) throw new Error(NAME + " self-test failed: " + message);
  }

  function near(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance || 1e-8) * Math.max(1, Math.abs(left), Math.abs(right));
  }

  function calculate(input) {
    var source = input || {};
    var emissions = clamp(source.emissions, 0, 20, DEFAULTS.emissions);
    var oceanRate = clamp(source.oceanRate, 0.005, 0.06, DEFAULTS.oceanRate);
    var landRate = clamp(source.landRate, 0.005, 0.06, DEFAULTS.landRate);
    var years = integer(source.years, 1, 200, DEFAULTS.years);
    var atmosphere = 0;
    var ocean = 0;
    var land = 0;
    var lastOceanFlux = 0;
    var lastLandFlux = 0;
    var year;
    for (year = 0; year < years; year += 1) {
      atmosphere += emissions;
      lastOceanFlux = atmosphere * oceanRate;
      lastLandFlux = atmosphere * landRate;
      atmosphere -= lastOceanFlux + lastLandFlux;
      ocean += lastOceanFlux;
      land += lastLandFlux;
    }
    var emitted = emissions * years;
    var balanceResidual = emitted - atmosphere - ocean - land;
    return {
      emissions: emissions,
      oceanRate: oceanRate,
      landRate: landRate,
      years: years,
      emitted: emitted,
      atmosphere: atmosphere,
      ocean: ocean,
      land: land,
      balanceResidual: balanceResidual,
      atmosphereShare: emitted ? atmosphere / emitted : 0,
      oceanShare: emitted ? ocean / emitted : 0,
      landShare: emitted ? land / emitted : 0,
      oceanTau: 1 / oceanRate,
      landTau: 1 / landRate,
      lastOceanFlux: lastOceanFlux,
      lastLandFlux: lastLandFlux
    };
  }

  function el(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (key === "text") node.textContent = value;
      else if (key === "className") node.className = value;
      else if (key === "checked") node.checked = Boolean(value);
      else if (value !== undefined && value !== null) node.setAttribute(key, String(value));
    });
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function svgEl(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key]));
    });
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function announce(api, rootNode, message) {
    if (api && typeof api.announce === "function") api.announce(rootNode, message);
  }

  function installStyles(doc) {
    var styleId = "cl-" + NAME + "-styles";
    if (doc.getElementById(styleId)) return;
    var style = doc.createElement("style");
    style.id = styleId;
    style.textContent =
      '[data-learning-lab="' + NAME + '"]{--ec-blue:#315f9d;--ec-green:#39734d;--ec-gold:#a36a16;--ec-red:#b64335;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;letter-spacing:0;font-size:1.16rem}[data-learning-lab="' + NAME + '"] p{margin:8px 0}[data-learning-lab="' + NAME + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + NAME + '"] legend{max-width:100%;padding:0 5px;font-size:13px;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;font:inherit;cursor:pointer}[data-learning-lab="' + NAME + '"] button{flex:1 1 150px}[data-learning-lab="' + NAME + '"] button[aria-pressed=true],[data-learning-lab="' + NAME + '"] .ec-primary{background:var(--ec-blue);border-color:var(--ec-blue);color:#fff;font-weight:750}[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{outline:3px solid #1769aa;outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] .ec-choices,[data-learning-lab="' + NAME + '"] .ec-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .ec-feedback,[data-learning-lab="' + NAME + '"] .ec-note{min-height:2em;color:var(--fg-soft,currentColor);font-size:13px}[data-learning-lab="' + NAME + '"] .ec-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:15px}[data-learning-lab="' + NAME + '"] .ec-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + NAME + '"] .ec-control>span{color:var(--fg-soft,currentColor);font-size:12.5px;font-weight:700}[data-learning-lab="' + NAME + '"] output{color:var(--ec-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--ec-blue)}' +
      '[data-learning-lab="' + NAME + '"] .ec-revealed[hidden]{display:none!important}[data-learning-lab="' + NAME + '"] .ec-stage{margin-top:15px;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + NAME + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + NAME + '"] .ec-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .ec-metric{min-width:0;padding:8px;border-top:2px solid var(--ec-blue)}[data-learning-lab="' + NAME + '"] .ec-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + NAME + '"] .ec-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] .ec-table{max-width:100%;overflow-x:auto}[data-learning-lab="' + NAME + '"] table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="' + NAME + '"] th{color:var(--fg-soft,currentColor)}' +
      '@media(max-width:620px){[data-learning-lab="' + NAME + '"] .ec-controls{grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] .ec-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){[data-learning-lab="' + NAME + '"] .ec-choices,[data-learning-lab="' + NAME + '"] .ec-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button{width:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + NAME + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}';
    doc.head.appendChild(style);
  }

  function draw(doc, svg, result) {
    clear(svg);
    svg.setAttribute("viewBox", "0 0 720 290");
    svg.appendChild(svgEl(doc, "title", {}, "三储库碳循环过程图"));
    svg.appendChild(svgEl(doc, "desc", {}, "排放进入大气，大气超额碳通过两条交换路径进入陆地和海洋；下方按储库显示累计账本。"));
    var defs = svgEl(doc, "defs", {});
    var marker = svgEl(doc, "marker", { id: "ec-arrow", viewBox: "0 0 10 10", refX: "8", refY: "5", markerWidth: "6", markerHeight: "6", orient: "auto-start-reverse" });
    marker.appendChild(svgEl(doc, "path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "currentColor" }));
    defs.appendChild(marker);
    svg.appendChild(defs);
    var cards = [
      { x: 22, label: "大气", value: format(result.atmosphere) + " PgC", fill: "var(--ec-blue)" },
      { x: 258, label: "陆地", value: format(result.land) + " PgC", fill: "var(--ec-green)" },
      { x: 494, label: "海洋", value: format(result.ocean) + " PgC", fill: "var(--ec-gold)" }
    ];
    cards.forEach(function (card) {
      svg.appendChild(svgEl(doc, "rect", { x: card.x, y: 46, width: 204, height: 70, rx: 6, fill: card.fill, "fill-opacity": ".88" }));
      svg.appendChild(svgEl(doc, "text", { x: card.x + 102, y: 70, "text-anchor": "middle", "font-size": "14", fill: "#fff" }, card.label));
      svg.appendChild(svgEl(doc, "text", { x: card.x + 102, y: 94, "text-anchor": "middle", "font-size": "12", fill: "#fff" }, card.value));
    });
    svg.appendChild(svgEl(doc, "line", { x1: 123, y1: 28, x2: 123, y2: 45, stroke: "var(--ec-red)", "stroke-width": "3", "marker-end": "url(#ec-arrow)" }));
    svg.appendChild(svgEl(doc, "text", { x: 123, y: 18, "text-anchor": "middle", "font-size": "11" }, "外部排放"));
    svg.appendChild(svgEl(doc, "line", { x1: 226, y1: 81, x2: 253, y2: 81, stroke: "var(--ec-blue)", "stroke-width": "2.5", "marker-end": "url(#ec-arrow)" }));
    svg.appendChild(svgEl(doc, "line", { x1: 462, y1: 92, x2: 489, y2: 92, stroke: "var(--ec-blue)", "stroke-width": "2.5", "marker-end": "url(#ec-arrow)" }));
    svg.appendChild(svgEl(doc, "text", { x: 240, y: 72, "text-anchor": "middle", "font-size": "10" }, "陆地通量"));
    svg.appendChild(svgEl(doc, "text", { x: 476, y: 83, "text-anchor": "middle", "font-size": "10" }, "海气通量"));
    svg.appendChild(svgEl(doc, "text", { x: 22, y: 145, "font-size": "11" }, result.years + " 年累计排放 = " + format(result.emitted) + " PgC；箱子显示扰动余额"));
    svg.appendChild(svgEl(doc, "rect", { x: 22, y: 166, width: 676, height: 22, rx: 3, fill: "var(--border,#cbd5e1)", "fill-opacity": ".55" }));
    var totalWidth = result.emitted ? 676 : 0;
    var atmWidth = totalWidth * result.atmosphereShare;
    var landWidth = totalWidth * result.landShare;
    svg.appendChild(svgEl(doc, "rect", { x: 22, y: 166, width: atmWidth, height: 22, fill: "var(--ec-blue)" }));
    svg.appendChild(svgEl(doc, "rect", { x: 22 + atmWidth, y: 166, width: landWidth, height: 22, fill: "var(--ec-green)" }));
    svg.appendChild(svgEl(doc, "rect", { x: 22 + atmWidth + landWidth, y: 166, width: totalWidth * result.oceanShare, height: 22, fill: "var(--ec-gold)" }));
    svg.appendChild(svgEl(doc, "text", { x: 22, y: 210, "font-size": "11" }, "大气 " + format(result.atmosphereShare * 100, 1) + "%"));
    svg.appendChild(svgEl(doc, "text", { x: 230, y: 210, "font-size": "11" }, "陆地 " + format(result.landShare * 100, 1) + "%"));
    svg.appendChild(svgEl(doc, "text", { x: 430, y: 210, "font-size": "11" }, "海洋 " + format(result.oceanShare * 100, 1) + "%"));
    svg.appendChild(svgEl(doc, "text", { x: 22, y: 252, "font-size": "11" }, "交换时间代理：海洋 " + format(result.oceanTau, 0) + " yr · 陆地 " + format(result.landTau, 0) + " yr"));
  }

  function ledger(doc, result) {
    var wrap = el(doc, "div", { className: "ec-table" });
    var table = el(doc, "table", { "aria-label": "三储库碳循环结果账本" });
    table.appendChild(el(doc, "caption", { text: "累计碳收支账本" }));
    table.appendChild(el(doc, "thead", {}, [el(doc, "tr", {}, [el(doc, "th", { text: "量" }), el(doc, "th", { text: "当前值" }), el(doc, "th", { text: "读法" })])]));
    var body = el(doc, "tbody");
    [
      ["外部排放", format(result.emitted) + " PgC", "E × t"],
      ["大气超额碳", format(result.atmosphere) + " PgC", "仍在大气箱"],
      ["海洋累计吸收", format(result.ocean) + " PgC", "表层交换代理"],
      ["陆地累计吸收", format(result.land) + " PgC", "陆地交换代理"],
      ["守恒残差", format(result.balanceResidual, 6) + " PgC", "应接近 0"]
    ].forEach(function (row) {
      body.appendChild(el(doc, "tr", {}, [el(doc, "th", { scope: "row", text: row[0] }), el(doc, "td", { text: row[1] }), el(doc, "td", { text: row[2] })]));
    });
    table.appendChild(body);
    wrap.appendChild(table);
    return wrap;
  }

  function addQuestion(doc, fieldset, key, prompt, choices, answers, groups) {
    fieldset.appendChild(el(doc, "p", { text: prompt }));
    var row = el(doc, "div", { className: "ec-choices", role: "group", "aria-label": prompt });
    choices.forEach(function (choice) {
      var button = el(doc, "button", { type: "button", "aria-pressed": "false", text: choice[1] });
      button.addEventListener("click", function () {
        answers[key] = choice[0];
        groups.forEach(function (group) {
          group.button.setAttribute("aria-pressed", answers[group.key] === group.value ? "true" : "false");
        });
      });
      groups.push({ key: key, value: choice[0], button: button });
      row.appendChild(button);
    });
    fieldset.appendChild(row);
  }

  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument;
    installStyles(doc);
    var state = { emissions: DEFAULTS.emissions, oceanRate: DEFAULTS.oceanRate, landRate: DEFAULTS.landRate, years: DEFAULTS.years, revealed: false, feedback: "" };
    var answers = { ocean: null, pulse: null };
    var groups = [];
    var shell = el(doc, "div", {});
    shell.appendChild(el(doc, "h3", { text: "三储库碳循环：先算余额，再谈碳汇" }));
    shell.appendChild(el(doc, "p", { className: "ec-note", text: "先回答大气余额与排放停止后的预测，再调节教学参数。单位是 PgC 或年。" }));
    var form = el(doc, "form", {});
    var fieldset = el(doc, "fieldset", {});
    fieldset.appendChild(el(doc, "legend", { text: "预测门" }));
    addQuestion(doc, fieldset, "ocean", "海气交换率提高，固定时间后的大气剩余量？", [["lower", "减少"], ["same", "不变"], ["higher", "增加"]], answers, groups);
    addQuestion(doc, fieldset, "pulse", "排放停止后的下一年，大气超额碳会立即归零吗？", [["yes", "会归零"], ["no", "不会归零"]], answers, groups);
    form.appendChild(fieldset);
    var actions = el(doc, "div", { className: "ec-actions" });
    actions.appendChild(el(doc, "button", { type: "submit", className: "ec-primary", text: "提交预测并揭示" }));
    actions.appendChild(el(doc, "button", { type: "button", text: "重置", "data-reset": "true" }));
    form.appendChild(actions);
    var feedback = el(doc, "p", { className: "ec-feedback", role: "status", "aria-live": "polite" });
    form.appendChild(feedback);
    shell.appendChild(form);
    var controls = el(doc, "div", { className: "ec-controls" });
    var emissions = el(doc, "input", { type: "range", min: "0", max: "16", step: "1", value: String(DEFAULTS.emissions), "aria-label": "年度排放 PgC" });
    var emissionsOut = el(doc, "output", { text: "8 PgC/yr" });
    var oceanRate = el(doc, "input", { type: "range", min: "0.005", max: "0.06", step: "0.005", value: String(DEFAULTS.oceanRate), "aria-label": "海气交换率" });
    var oceanOut = el(doc, "output", { text: "2.0%/yr" });
    var landRate = el(doc, "input", { type: "range", min: "0.005", max: "0.06", step: "0.005", value: String(DEFAULTS.landRate), "aria-label": "陆地交换率" });
    var landOut = el(doc, "output", { text: "3.0%/yr" });
    var years = el(doc, "select", { "aria-label": "时间跨度" });
    [20, 50, 100, 200].forEach(function (year) { years.appendChild(el(doc, "option", { value: String(year), text: year + " 年" })); });
    controls.appendChild(el(doc, "label", { className: "ec-control" }, [el(doc, "span", {}, ["年度排放 ", emissionsOut]), emissions]));
    controls.appendChild(el(doc, "label", { className: "ec-control" }, [el(doc, "span", {}, ["海气交换率 ", oceanOut]), oceanRate]));
    controls.appendChild(el(doc, "label", { className: "ec-control" }, [el(doc, "span", {}, ["陆地交换率 ", landOut]), landRate]));
    controls.appendChild(el(doc, "label", { className: "ec-control" }, [el(doc, "span", { text: "记账时间跨度" }), years]));
    shell.appendChild(controls);
    var revealed = el(doc, "section", { className: "ec-revealed", hidden: "hidden" });
    var stage = el(doc, "div", { className: "ec-stage" });
    var svg = doc.createElementNS(SVG_NS, "svg");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "大气、陆地和海洋三储库过程图");
    stage.appendChild(svg);
    revealed.appendChild(stage);
    var metrics = el(doc, "div", { className: "ec-metrics" });
    revealed.appendChild(metrics);
    var tableHost = el(doc, "div", {});
    revealed.appendChild(tableHost);
    revealed.appendChild(el(doc, "p", { className: "ec-note", text: "边界提醒：真实海洋碳还受温度、碱度、分层、碳酸盐平衡和生物泵影响；这里的 k 只是线性交换代理。" }));
    shell.appendChild(revealed);
    rootNode.replaceChildren(shell);

    function metric(label, value) {
      return el(doc, "div", { className: "ec-metric" }, [el(doc, "span", { text: label }), el(doc, "strong", { text: value })]);
    }

    function render() {
      var result = calculate(state);
      emissions.value = String(state.emissions);
      emissionsOut.textContent = format(state.emissions, 0) + " PgC/yr";
      oceanRate.value = String(state.oceanRate);
      oceanOut.textContent = format(state.oceanRate * 100, 1) + "%/yr";
      landRate.value = String(state.landRate);
      landOut.textContent = format(state.landRate * 100, 1) + "%/yr";
      years.value = String(state.years);
      groups.forEach(function (group) { group.button.setAttribute("aria-pressed", answers[group.key] === group.value ? "true" : "false"); });
      feedback.textContent = state.feedback;
      revealed.hidden = !state.revealed;
      if (!state.revealed) return;
      draw(doc, svg, result);
      clear(metrics);
      metrics.appendChild(metric("累计排放", format(result.emitted) + " PgC"));
      metrics.appendChild(metric("大气余额", format(result.atmosphere) + " PgC"));
      metrics.appendChild(metric("海洋占比", format(result.oceanShare * 100, 1) + "%"));
      metrics.appendChild(metric("守恒残差", format(result.balanceResidual, 5) + " PgC"));
      clear(tableHost);
      tableHost.appendChild(ledger(doc, result));
    }

    function change(key, value) {
      state[key] = value;
      state.revealed = false;
      state.feedback = "参数已改变，请重新提交预测。";
      render();
    }

    emissions.addEventListener("input", function () { change("emissions", Number(emissions.value)); });
    oceanRate.addEventListener("input", function () { change("oceanRate", Number(oceanRate.value)); });
    landRate.addEventListener("input", function () { change("landRate", Number(landRate.value)); });
    years.addEventListener("change", function () { change("years", Number(years.value)); });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (answers.ocean === null || answers.pulse === null) {
        state.feedback = "请先完成两项预测。";
        render();
        return;
      }
      var score = (answers.ocean === "lower" ? 1 : 0) + (answers.pulse === "no" ? 1 : 0);
      state.revealed = true;
      state.feedback = "已揭示：" + score + "/2 命中。现在调一个速率，观察守恒账本如何重分配。";
      render();
      announce(api, rootNode, state.feedback);
    });
    form.querySelector("[data-reset]").addEventListener("click", function () {
      state = { emissions: DEFAULTS.emissions, oceanRate: DEFAULTS.oceanRate, landRate: DEFAULTS.landRate, years: DEFAULTS.years, revealed: false, feedback: "" };
      answers = { ocean: null, pulse: null };
      render();
      announce(api, rootNode, "碳循环预测和账本已重置。");
    });
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    check(format(1200, 0) === "1200", "integer formatting preserves significant trailing zeros");
    var base = calculate(DEFAULTS);
    var fasterOcean = calculate({ emissions: 8, oceanRate: 0.04, landRate: 0.03, years: 100 });
    check(near(base.emitted, 800), "annual emissions times years");
    check(Math.abs(base.balanceResidual) < 1e-8, "mass balance closes");
    check(base.land > base.ocean, "higher land exchange rate gives higher land uptake in default case");
    check(near(base.lastLandFlux / base.lastOceanFlux, DEFAULTS.landRate / DEFAULTS.oceanRate), "both exchange fluxes use the same atmospheric state");
    check(fasterOcean.atmosphere < base.atmosphere, "faster ocean uptake lowers atmospheric remainder");
    check(calculate({ emissions: 0, years: 100 }).emitted === 0 && calculate({ emissions: 0, years: 100 }).atmosphere === 0, "zero source remains zero");
    check(JSON.stringify(calculate(DEFAULTS)) === JSON.stringify(calculate(DEFAULTS)), "deterministic carbon ledger");
    return { checks: checks };
  }

  return { calculate: calculate, mount: mount, selfTest: selfTest };
});

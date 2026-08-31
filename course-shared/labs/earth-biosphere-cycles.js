(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("earth-biosphere-cycles", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("earth-biosphere-cycles self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("earth-biosphere-cycles self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function (host) {
  "use strict";

  var NAME = "earth-biosphere-cycles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var DEFAULTS = { light: 0.75, nitrogen: 0.55, moisture: 0.8, temperature: 20, years: 20 };
  var LIMIT_LABELS = { light: "光", nitrogen: "氮", moisture: "水分" };

  function clamp(value, low, high, fallback) {
    var number = Number(value);
    if (!Number.isFinite(number)) number = fallback;
    return Math.min(high, Math.max(low, number));
  }

  function integer(value, low, high, fallback) { return Math.round(clamp(value, low, high, fallback)); }

  function format(value, digits) {
    if (!Number.isFinite(value)) return "-";
    var places = digits === undefined ? 2 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.01) return value.toExponential(2);
    return value.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }

  function assert(condition, message) {
    if (!condition) throw new Error(NAME + " self-test failed: " + message);
  }

  function calculate(input) {
    var source = input || {};
    var light = clamp(source.light, 0, 1, DEFAULTS.light);
    var nitrogen = clamp(source.nitrogen, 0, 1, DEFAULTS.nitrogen);
    var moisture = clamp(source.moisture, 0, 1, DEFAULTS.moisture);
    var temperature = clamp(source.temperature, 0, 40, DEFAULTS.temperature);
    var years = integer(source.years, 1, 80, DEFAULTS.years);
    var limitation = Math.min(light, nitrogen, moisture);
    var limitingKey = light <= nitrogen && light <= moisture ? "light" : nitrogen <= moisture ? "nitrogen" : "moisture";
    var q10Factor = Math.pow(2, (temperature - 20) / 10);
    var stock = 100;
    var cumulativeNetEcosystemProduction = 0;
    var gpp = 0;
    var totalRespiration = 0;
    var netEcosystemProduction = 0;
    var year;
    for (year = 0; year < years; year += 1) {
      gpp = 120 * limitation;
      totalRespiration = 55 * q10Factor * (stock / 100);
      netEcosystemProduction = gpp - totalRespiration;
      stock = Math.max(0, stock + 0.08 * netEcosystemProduction);
      cumulativeNetEcosystemProduction += netEcosystemProduction;
    }
    return {
      light: light,
      nitrogen: nitrogen,
      moisture: moisture,
      temperature: temperature,
      years: years,
      limitation: limitation,
      limitingKey: limitingKey,
      limitingLabel: LIMIT_LABELS[limitingKey],
      q10Factor: q10Factor,
      stock: stock,
      gpp: gpp,
      totalRespiration: totalRespiration,
      netEcosystemProduction: netEcosystemProduction,
      nee: -netEcosystemProduction,
      cumulativeNetEcosystemProduction: cumulativeNetEcosystemProduction,
      stockChange: stock - 100
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

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function announce(api, rootNode, message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); }

  function installStyles(doc) {
    var styleId = "cl-" + NAME + "-styles";
    if (doc.getElementById(styleId)) return;
    var style = doc.createElement("style");
    style.id = styleId;
    style.textContent =
      '[data-learning-lab="' + NAME + '"]{--eb-blue:#315f9d;--eb-green:#39734d;--eb-gold:#a36a16;--eb-red:#b64335;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;letter-spacing:0;font-size:1.16rem}[data-learning-lab="' + NAME + '"] p{margin:8px 0}[data-learning-lab="' + NAME + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + NAME + '"] legend{max-width:100%;padding:0 5px;font-size:13px;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,Canvas);color:inherit;font:inherit;cursor:pointer}[data-learning-lab="' + NAME + '"] button{flex:1 1 150px}[data-learning-lab="' + NAME + '"] button[aria-pressed=true],[data-learning-lab="' + NAME + '"] .eb-primary{background:var(--eb-blue);border-color:var(--eb-blue);color:#fff;font-weight:750}[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{outline:3px solid #1769aa;outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] .eb-choices,[data-learning-lab="' + NAME + '"] .eb-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .eb-feedback,[data-learning-lab="' + NAME + '"] .eb-note{min-height:2em;color:var(--fg-soft,currentColor);font-size:13px}[data-learning-lab="' + NAME + '"] .eb-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:15px}[data-learning-lab="' + NAME + '"] .eb-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + NAME + '"] .eb-control>span{color:var(--fg-soft,currentColor);font-size:12.5px;font-weight:700}[data-learning-lab="' + NAME + '"] output{color:var(--eb-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--eb-blue)}' +
      '[data-learning-lab="' + NAME + '"] .eb-revealed[hidden]{display:none!important}[data-learning-lab="' + NAME + '"] .eb-stage{margin-top:15px;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:6px;overflow:hidden}[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto;max-width:100%}[data-learning-lab="' + NAME + '"] svg text:not([fill]){fill:currentColor;font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + NAME + '"] .eb-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .eb-metric{min-width:0;padding:8px;border-top:2px solid var(--eb-blue)}[data-learning-lab="' + NAME + '"] .eb-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + NAME + '"] .eb-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] .eb-table{max-width:100%;overflow-x:auto}[data-learning-lab="' + NAME + '"] table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="' + NAME + '"] th{color:var(--fg-soft,currentColor)}' +
      '@media(max-width:620px){[data-learning-lab="' + NAME + '"] .eb-controls{grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] .eb-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){[data-learning-lab="' + NAME + '"] .eb-choices,[data-learning-lab="' + NAME + '"] .eb-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button{width:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + NAME + '"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}';
    doc.head.appendChild(style);
  }

  function draw(doc, svg, result) {
    clear(svg);
    svg.setAttribute("viewBox", "0 0 720 300");
    svg.appendChild(svgEl(doc, "title", {}, "生物地球化学循环过程图"));
    svg.appendChild(svgEl(doc, "desc", {}, "光、氮和水分进入生产者，碳进入生物量，再由植物和微生物呼吸返回大气。"));
    var defs = svgEl(doc, "defs", {});
    var marker = svgEl(doc, "marker", { id: "eb-arrow", viewBox: "0 0 10 10", refX: "8", refY: "5", markerWidth: "6", markerHeight: "6", orient: "auto" });
    marker.appendChild(svgEl(doc, "path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "currentColor" }));
    defs.appendChild(marker);
    svg.appendChild(defs);
    var inputs = [
      { x: 18, label: "光", value: format(result.light * 100, 0) + "%", fill: "var(--eb-gold)" },
      { x: 18, label: "氮", value: format(result.nitrogen * 100, 0) + "%", fill: "var(--eb-blue)" },
      { x: 18, label: "水", value: format(result.moisture * 100, 0) + "%", fill: "var(--eb-green)" }
    ];
    inputs.forEach(function (item, index) {
      var y = 42 + index * 50;
      svg.appendChild(svgEl(doc, "rect", { x: item.x, y: y, width: 126, height: 32, rx: 5, fill: item.fill, "fill-opacity": ".88" }));
      svg.appendChild(svgEl(doc, "text", { x: item.x + 63, y: y + 20, "text-anchor": "middle", "font-size": "12", fill: "#fff" }, item.label + " " + item.value));
      svg.appendChild(svgEl(doc, "line", { x1: 144, y1: y + 16, x2: 238, y2: 115, stroke: item.fill, "stroke-width": "2", "marker-end": "url(#eb-arrow)" }));
    });
    svg.appendChild(svgEl(doc, "rect", { x: 242, y: 78, width: 180, height: 74, rx: 6, fill: "var(--eb-blue)", "fill-opacity": ".88" }));
    svg.appendChild(svgEl(doc, "text", { x: 332, y: 104, "text-anchor": "middle", "font-size": "14", fill: "#fff" }, "生产者"));
    svg.appendChild(svgEl(doc, "text", { x: 332, y: 128, "text-anchor": "middle", "font-size": "11", fill: "#fff" }, "GPP " + format(result.gpp) + " / 年"));
    svg.appendChild(svgEl(doc, "line", { x1: 424, y1: 115, x2: 510, y2: 115, stroke: "var(--eb-green)", "stroke-width": "3", "marker-end": "url(#eb-arrow)" }));
    svg.appendChild(svgEl(doc, "rect", { x: 514, y: 78, width: 184, height: 74, rx: 6, fill: "var(--eb-green)", "fill-opacity": ".88" }));
    svg.appendChild(svgEl(doc, "text", { x: 606, y: 104, "text-anchor": "middle", "font-size": "14", fill: "#fff" }, "生物量"));
    svg.appendChild(svgEl(doc, "text", { x: 606, y: 128, "text-anchor": "middle", "font-size": "11", fill: "#fff" }, format(result.stock) + " 相对单位"));
    svg.appendChild(svgEl(doc, "line", { x1: 606, y1: 154, x2: 606, y2: 212, stroke: "var(--eb-red)", "stroke-width": "3", "marker-end": "url(#eb-arrow)" }));
    svg.appendChild(svgEl(doc, "text", { x: 606, y: 230, "text-anchor": "middle", "font-size": "11" }, "总呼吸回大气 " + format(result.totalRespiration) + "/年"));
    svg.appendChild(svgEl(doc, "rect", { x: 242, y: 250, width: 456, height: 24, rx: 4, fill: result.nee < 0 ? "var(--eb-green)" : "var(--eb-red)", "fill-opacity": ".85" }));
    svg.appendChild(svgEl(doc, "text", { x: 470, y: 267, "text-anchor": "middle", "font-size": "11", fill: "#fff" }, "NEP = " + format(result.netEcosystemProduction) + " · NEE = " + format(result.nee)));
    svg.appendChild(svgEl(doc, "text", { x: 18, y: 218, "font-size": "11" }, "资源门 min = " + format(result.limitation * 100, 0) + "%；Q10 = " + format(result.q10Factor, 2)));
  }

  function ledger(doc, result) {
    var wrap = el(doc, "div", { className: "eb-table" });
    var table = el(doc, "table", { "aria-label": "生物地球化学循环结果账本" });
    table.appendChild(el(doc, "caption", { text: "生产力与净交换账本" }));
    table.appendChild(el(doc, "thead", {}, [el(doc, "tr", {}, [el(doc, "th", { text: "量" }), el(doc, "th", { text: "当前值" }), el(doc, "th", { text: "读法" })])]));
    var body = el(doc, "tbody");
    [
      ["限制因子", result.limitingLabel, "min(L, N, W)"],
      ["GPP", format(result.gpp) + " / 年", "总初级生产力"],
      ["总生态系统呼吸", format(result.totalRespiration) + " / 年", "植物 + 微生物等呼吸"],
      ["净生态系统生产（GPP - 总呼吸）", format(result.netEcosystemProduction) + " / 年", "GPP - 总生态系统呼吸"],
      ["NEE", format(result.nee) + " / 年", "NEE = -NEP；正值是净排碳"],
      ["生物量变化", format(result.stockChange), "20 年离散教学积分"]
    ].forEach(function (row) {
      body.appendChild(el(doc, "tr", {}, [el(doc, "th", { scope: "row", text: row[0] }), el(doc, "td", { text: row[1] }), el(doc, "td", { text: row[2] })]));
    });
    table.appendChild(body);
    wrap.appendChild(table);
    return wrap;
  }

  function addQuestion(doc, fieldset, key, prompt, choices, answers, groups) {
    fieldset.appendChild(el(doc, "p", { text: prompt }));
    var row = el(doc, "div", { className: "eb-choices", role: "group", "aria-label": prompt });
    choices.forEach(function (choice) {
      var button = el(doc, "button", { type: "button", "aria-pressed": "false", text: choice[1] });
      button.addEventListener("click", function () {
        answers[key] = choice[0];
        groups.forEach(function (group) { group.button.setAttribute("aria-pressed", answers[group.key] === group.value ? "true" : "false"); });
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
    var state = { light: DEFAULTS.light, nitrogen: DEFAULTS.nitrogen, moisture: DEFAULTS.moisture, temperature: DEFAULTS.temperature, years: DEFAULTS.years, revealed: false, feedback: "" };
    var answers = { nitrogen: null, warming: null, nee: null };
    var groups = [];
    var shell = el(doc, "div", {});
    shell.appendChild(el(doc, "h3", { text: "生物圈循环：找瓶颈，别把 GPP 当净碳汇" }));
    shell.appendChild(el(doc, "p", { className: "eb-note", text: "先预测限制因子、呼吸响应和 NEE 符号，再改变资源与温度。" }));
    var form = el(doc, "form", {});
    var fieldset = el(doc, "fieldset", {});
    fieldset.appendChild(el(doc, "legend", { text: "预测门" }));
    addQuestion(doc, fieldset, "nitrogen", "如果氮已低于光，继续增加光，GPP 会显著增加吗？", [["yes", "会"], ["no", "不会"]], answers, groups);
    addQuestion(doc, fieldset, "warming", "在 Q10 代理下升温，呼吸项会？", [["rise", "增加"], ["fall", "减少"]], answers, groups);
    addQuestion(doc, fieldset, "nee", "若 NEE < 0，生态系统对大气是？", [["sink", "净吸收"], ["source", "净排放"]], answers, groups);
    form.appendChild(fieldset);
    var actions = el(doc, "div", { className: "eb-actions" });
    actions.appendChild(el(doc, "button", { type: "submit", className: "eb-primary", text: "提交预测并揭示" }));
    actions.appendChild(el(doc, "button", { type: "button", text: "重置", "data-reset": "true" }));
    form.appendChild(actions);
    var feedback = el(doc, "p", { className: "eb-feedback", role: "status", "aria-live": "polite" });
    form.appendChild(feedback);
    shell.appendChild(form);
    var controls = el(doc, "div", { className: "eb-controls" });
    var light = el(doc, "input", { type: "range", min: "0", max: "1", step: "0.05", value: String(DEFAULTS.light), "aria-label": "相对光照" });
    var lightOut = el(doc, "output", { text: "75%" });
    var nitrogen = el(doc, "input", { type: "range", min: "0", max: "1", step: "0.05", value: String(DEFAULTS.nitrogen), "aria-label": "相对氮供给" });
    var nitrogenOut = el(doc, "output", { text: "55%" });
    var moisture = el(doc, "input", { type: "range", min: "0", max: "1", step: "0.05", value: String(DEFAULTS.moisture), "aria-label": "相对水分" });
    var moistureOut = el(doc, "output", { text: "80%" });
    var temperature = el(doc, "input", { type: "range", min: "0", max: "40", step: "1", value: String(DEFAULTS.temperature), "aria-label": "温度摄氏度" });
    var temperatureOut = el(doc, "output", { text: "20 °C" });
    controls.appendChild(el(doc, "label", { className: "eb-control" }, [el(doc, "span", {}, ["相对光照 ", lightOut]), light]));
    controls.appendChild(el(doc, "label", { className: "eb-control" }, [el(doc, "span", {}, ["相对氮供给 ", nitrogenOut]), nitrogen]));
    controls.appendChild(el(doc, "label", { className: "eb-control" }, [el(doc, "span", {}, ["相对水分 ", moistureOut]), moisture]));
    controls.appendChild(el(doc, "label", { className: "eb-control" }, [el(doc, "span", {}, ["温度 ", temperatureOut]), temperature]));
    shell.appendChild(controls);
    var revealed = el(doc, "section", { className: "eb-revealed", hidden: "hidden" });
    var stage = el(doc, "div", { className: "eb-stage" });
    var svg = doc.createElementNS(SVG_NS, "svg");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "光、营养、水分到生物量和呼吸的过程图");
    stage.appendChild(svg);
    revealed.appendChild(stage);
    var metrics = el(doc, "div", { className: "eb-metrics" });
    revealed.appendChild(metrics);
    var tableHost = el(doc, "div", {});
    revealed.appendChild(tableHost);
    revealed.appendChild(el(doc, "p", { className: "eb-note", text: "边界提醒：真实生态系统还需分解、火灾、收获、磷、甲烷、土壤水文和物种替换等过程。" }));
    shell.appendChild(revealed);
    rootNode.replaceChildren(shell);

    function metric(label, value) { return el(doc, "div", { className: "eb-metric" }, [el(doc, "span", { text: label }), el(doc, "strong", { text: value })]); }
    function render() {
      var result = calculate(state);
      light.value = String(state.light); lightOut.textContent = format(state.light * 100, 0) + "%";
      nitrogen.value = String(state.nitrogen); nitrogenOut.textContent = format(state.nitrogen * 100, 0) + "%";
      moisture.value = String(state.moisture); moistureOut.textContent = format(state.moisture * 100, 0) + "%";
      temperature.value = String(state.temperature); temperatureOut.textContent = format(state.temperature, 0) + " °C";
      groups.forEach(function (group) { group.button.setAttribute("aria-pressed", answers[group.key] === group.value ? "true" : "false"); });
      feedback.textContent = state.feedback;
      revealed.hidden = !state.revealed;
      if (!state.revealed) return;
      draw(doc, svg, result);
      clear(metrics);
      metrics.appendChild(metric("当前限制", result.limitingLabel));
      metrics.appendChild(metric("年 GPP", format(result.gpp)));
      metrics.appendChild(metric("年 NEE", format(result.nee)));
      metrics.appendChild(metric("生物量", format(result.stock)));
      clear(tableHost); tableHost.appendChild(ledger(doc, result));
    }
    function change(key, value) { state[key] = value; state.revealed = false; state.feedback = "参数已改变，请重新提交预测。"; render(); }
    light.addEventListener("input", function () { change("light", Number(light.value)); });
    nitrogen.addEventListener("input", function () { change("nitrogen", Number(nitrogen.value)); });
    moisture.addEventListener("input", function () { change("moisture", Number(moisture.value)); });
    temperature.addEventListener("input", function () { change("temperature", Number(temperature.value)); });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (answers.nitrogen === null || answers.warming === null || answers.nee === null) { state.feedback = "请先完成三项预测。"; render(); return; }
      var result = calculate(state);
      var score = (answers.nitrogen === "no" ? 1 : 0) + (answers.warming === "rise" ? 1 : 0) + ((result.nee < 0 && answers.nee === "sink") || (result.nee >= 0 && answers.nee === "source") ? 1 : 0);
      state.revealed = true;
      state.feedback = "已揭示：" + score + "/3 命中。当前瓶颈是" + result.limitingLabel + "，再调一个不是瓶颈的资源试试。";
      render(); announce(api, rootNode, state.feedback);
    });
    form.querySelector("[data-reset]").addEventListener("click", function () {
      state = { light: DEFAULTS.light, nitrogen: DEFAULTS.nitrogen, moisture: DEFAULTS.moisture, temperature: DEFAULTS.temperature, years: DEFAULTS.years, revealed: false, feedback: "" };
      answers = { nitrogen: null, warming: null, nee: null }; render(); announce(api, rootNode, "生物圈循环预测已重置。");
    });
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    check(format(1200, 0) === "1200", "integer formatting preserves significant trailing zeros");
    var base = calculate(DEFAULTS);
    check(base.limitingKey === "nitrogen", "nitrogen limits the default case");
    check(calculate({ light: 1, nitrogen: 0.55, moisture: 0.8 }).gpp === base.gpp, "non-limiting light does not change GPP");
    check(base.netEcosystemProduction === base.gpp - base.totalRespiration, "NEP subtracts total ecosystem respiration");
    check(base.cumulativeNetEcosystemProduction > 0, "default cumulative NEP is a net sink");
    check(calculate({ temperature: 30, nitrogen: 0.55, light: 0.75, moisture: 0.8 }).totalRespiration > base.totalRespiration, "warming increases Q10 respiration");
    check(calculate({ moisture: 0, nitrogen: 0.55, light: 0.75 }).gpp === 0, "zero moisture closes production gate");
    check(JSON.stringify(calculate(DEFAULTS)) === JSON.stringify(calculate(DEFAULTS)), "deterministic biosphere ledger");
    return { checks: checks };
  }

  return { calculate: calculate, mount: mount, selfTest: selfTest };
});

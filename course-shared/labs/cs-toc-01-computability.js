(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-toc-01-computability", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-toc-01-computability self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-toc-01-computability self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-toc-01-computability";
  var INPUTS = ["110", "101", "1001", "1110"];

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function runDfa(input) {
    var state = 0;
    var trace = [{ symbol: "开始", state: state }];
    for (var i = 0; i < input.length; i += 1) {
      var bit = Number(input[i]);
      if (bit !== 0 && bit !== 1) throw new Error("DFA input must be binary");
      state = (state * 2 + bit) % 3;
      trace.push({ symbol: input[i], state: state });
    }
    return { input: input, state: state, accepted: state === 0, trace: trace };
  }

  function balancedWord(n) {
    return new Array(n + 1).join("a") + new Array(n + 1).join("b");
  }

  function pump(n, extra) {
    var original = balancedWord(n);
    var pumped = new Array(n + extra + 1).join("a") + new Array(n + 1).join("b");
    return { original: original, pumped: pumped, originalValid: true, pumpedValid: false };
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "text") node.textContent = attrs[key];
      else if (key === "className") node.className = attrs[key];
      else if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key]));
    });
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key]));
    });
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function installStyles(doc) {
    var styleId = "cl-" + NAME + "-styles";
    if (doc.getElementById(styleId)) return;
    var style = doc.createElement("style");
    style.id = styleId;
    style.textContent =
      '[data-learning-lab="' + NAME + '"]{--ctc-blue:#315f9d;--ctc-gold:#a36a16;--ctc-green:#39734d;--ctc-red:#b64335;display:block;max-width:100%;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3,[data-learning-lab="' + NAME + '"] h4{margin:0;letter-spacing:0}' +
      '[data-learning-lab="' + NAME + '"] p{margin:8px 0}[data-learning-lab="' + NAME + '"] fieldset{border:0;min-width:0;margin:0;padding:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:8px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,transparent);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:hover,[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{border-color:var(--accent);outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .ctc-primary{background:var(--ctc-blue);border-color:var(--ctc-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .ctc-choices,[data-learning-lab="' + NAME + '"] .ctc-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .ctc-actions{margin-top:12px}' +
      '[data-learning-lab="' + NAME + '"] .ctc-feedback,[data-learning-lab="' + NAME + '"] .ctc-note{min-height:2em;color:var(--fg-soft);font-size:13px}' +
      '[data-learning-lab="' + NAME + '"] .ctc-revealed[hidden]{display:none}[data-learning-lab="' + NAME + '"] .ctc-layout{display:grid;grid-template-columns:minmax(190px,.55fr) minmax(0,1.45fr);gap:16px;align-items:start;margin-top:16px}' +
      '[data-learning-lab="' + NAME + '"] .ctc-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border);border-radius:7px}[data-learning-lab="' + NAME + '"] .ctc-control{display:grid;gap:5px}[data-learning-lab="' + NAME + '"] .ctc-control label{font-size:13px;font-weight:700;color:var(--fg-soft)}[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--ctc-blue)}' +
      '[data-learning-lab="' + NAME + '"] .ctc-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;overflow:hidden}[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto}' +
      '[data-learning-lab="' + NAME + '"] .ctc-state{fill:var(--bg);stroke:var(--ctc-blue);stroke-width:2}[data-learning-lab="' + NAME + '"] .ctc-current{fill:var(--ctc-gold);stroke:var(--ctc-gold)}[data-learning-lab="' + NAME + '"] .ctc-accept{stroke:var(--ctc-green);stroke-width:4}[data-learning-lab="' + NAME + '"] .ctc-label{font-size:14px;font-weight:750;text-anchor:middle;dominant-baseline:middle}[data-learning-lab="' + NAME + '"] .ctc-small{font-size:11px;fill:var(--fg-soft)!important}' +
      '[data-learning-lab="' + NAME + '"] .ctc-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .ctc-metric{padding:8px;border-top:2px solid var(--ctc-blue)}[data-learning-lab="' + NAME + '"] .ctc-metric span{display:block;color:var(--fg-soft);font-size:12px}[data-learning-lab="' + NAME + '"] .ctc-metric strong{display:block;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + NAME + '"] table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:6px;border-bottom:1px solid var(--border);text-align:left}' +
      '@media(max-width:760px){[data-learning-lab="' + NAME + '"] .ctc-layout{grid-template-columns:1fr}}@media(max-width:520px){[data-learning-lab="' + NAME + '"] .ctc-choices,[data-learning-lab="' + NAME + '"] .ctc-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select{width:100%}}';
    doc.head.appendChild(style);
  }

  function renderDfa(doc, result, cursor) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 520 180", role: "img", "aria-label": "三状态二进制模三 DFA" });
    var positions = [[100, 90], [260, 90], [420, 90]];
    svg.appendChild(svgElement(doc, "line", { x1: 100, y1: 90, x2: 260, y2: 90, stroke: "var(--border)" }));
    svg.appendChild(svgElement(doc, "line", { x1: 260, y1: 90, x2: 420, y2: 90, stroke: "var(--border)" }));
    svg.appendChild(svgElement(doc, "path", { d: "M420 90 C260 15 100 15 100 90", fill: "none", stroke: "var(--ctc-blue)", "stroke-dasharray": "5 4" }));
    [0, 1, 2].forEach(function (state) {
      var className = "ctc-state" + (state === 0 ? " ctc-accept" : "") + (state === result.trace[cursor].state ? " ctc-current" : "");
      svg.appendChild(svgElement(doc, "circle", { cx: positions[state][0], cy: positions[state][1], r: 28, class: className }));
      svg.appendChild(svgElement(doc, "text", { x: positions[state][0], y: positions[state][1], class: "ctc-label" }, "r=" + state));
    });
    svg.appendChild(svgElement(doc, "text", { x: 12, y: 22, class: "ctc-small" }, "转移：r'=(2r+b) mod 3；双圈 r=0 为接受态"));
    svg.appendChild(svgElement(doc, "text", { x: 12, y: 160, class: "ctc-small" }, "已读：" + result.trace.slice(1, cursor + 1).map(function (item) { return item.symbol; }).join("") + "；当前状态 " + result.trace[cursor].state));
    return svg;
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "自动机账本：状态压缩与泵引理" }));
    shell.appendChild(element(doc, "p", { className: "ctc-note", text: "先预测 DFA 是否接受以及泵出后的归属，揭示后逐字符观察有限状态如何更新。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { accept: null, pump: null };
    var groupItems = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { className: "ctc-question", text: prompt }));
      var row = element(doc, "div", { className: "ctc-choices", role: "group", "aria-label": prompt });
      choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice[1] });
        button.addEventListener("click", function () {
          answers[key] = choice[0];
          groupItems.forEach(function (item) { item.node.setAttribute("aria-pressed", answers[item.key] === item.value ? "true" : "false"); });
        });
        groupItems.push({ key: key, value: choice[0], node: button });
        row.appendChild(button);
      });
      fieldset.appendChild(row);
    }
    question("accept", "二进制 110 的模 3 DFA 最终状态？", [["accept", "r=0，接受"], ["reject", "r=1，拒绝"], ["two", "r=2，拒绝"]]);
    question("pump", "对 a^3b^3 泵出一个 a 后？", [["stay", "仍在语言"], ["leave", "变为 a^4b^3，离开"], ["unknown", "无法判断"]]);
    form.appendChild(fieldset);
    form.appendChild(element(doc, "div", { className: "ctc-actions" }, [element(doc, "button", { type: "submit", className: "ctc-primary", text: "提交预测并揭示" })]));
    var feedback = element(doc, "p", { className: "ctc-feedback", role: "status", "aria-live": "polite", text: "请完成两项预测。" });
    form.appendChild(feedback);
    shell.appendChild(form);

    var revealed = element(doc, "section", { className: "ctc-revealed", hidden: "hidden" });
    var layout = element(doc, "div", { className: "ctc-layout" });
    var controls = element(doc, "div", { className: "ctc-controls" });
    var input = element(doc, "select", { "aria-label": "二进制输入" });
    INPUTS.forEach(function (value) { input.appendChild(element(doc, "option", { value: value, text: value })); });
    var nInput = element(doc, "input", { type: "range", min: "2", max: "7", value: "3", step: "1" });
    var pInput = element(doc, "input", { type: "range", min: "1", max: "3", value: "1", step: "1" });
    var nOutput = element(doc, "output", { text: "3" });
    var pOutput = element(doc, "output", { text: "1" });
    controls.appendChild(element(doc, "label", { className: "ctc-control" }, ["二进制输入 ", input]));
    controls.appendChild(element(doc, "div", { className: "ctc-control" }, [element(doc, "label", {}, ["n = ", nOutput]), nInput]));
    controls.appendChild(element(doc, "div", { className: "ctc-control" }, [element(doc, "label", {}, ["泵出额外 a 数 ", pOutput]), pInput]));
    var actions = element(doc, "div", { className: "ctc-actions" });
    var stepButton = element(doc, "button", { type: "button", className: "ctc-primary", text: "读入下一位" });
    var runButton = element(doc, "button", { type: "button", text: "读完整串" });
    var resetButton = element(doc, "button", { type: "button", text: "重置" });
    actions.appendChild(stepButton);
    actions.appendChild(runButton);
    actions.appendChild(resetButton);
    controls.appendChild(actions);
    layout.appendChild(controls);
    var stage = element(doc, "div", { className: "ctc-stage" });
    layout.appendChild(stage);
    revealed.appendChild(layout);
    var metrics = element(doc, "div", { className: "ctc-metrics" });
    var statusMetric = element(doc, "div", { className: "ctc-metric" });
    var pumpMetric = element(doc, "div", { className: "ctc-metric" });
    var diagonalMetric = element(doc, "div", { className: "ctc-metric" });
    metrics.appendChild(statusMetric);
    metrics.appendChild(pumpMetric);
    metrics.appendChild(diagonalMetric);
    revealed.appendChild(metrics);
    var table = element(doc, "table", { "aria-label": "DFA 状态追踪" });
    table.innerHTML = "<thead><tr><th>步</th><th>读入</th><th>状态</th><th>余数解释</th></tr></thead><tbody></tbody>";
    revealed.appendChild(table);
    var note = element(doc, "p", { className: "ctc-note" });
    revealed.appendChild(note);
    shell.appendChild(revealed);
    root.appendChild(shell);

    var result = runDfa(INPUTS[0]);
    var cursor = 0;
    function render() {
      result = runDfa(input.value);
      cursor = Math.min(cursor, result.trace.length - 1);
      var pumped = pump(Number(nInput.value), Number(pInput.value));
      nOutput.textContent = nInput.value;
      pOutput.textContent = pInput.value;
      stage.replaceChildren(renderDfa(doc, result, cursor));
      statusMetric.innerHTML = "<span>已读状态</span><strong>r=" + result.trace[cursor].state + (cursor === result.trace.length - 1 ? (result.accepted ? "，接受" : "，拒绝") : "，未完") + "</strong>";
      pumpMetric.innerHTML = "<span>泵引理反例</span><strong>" + pumped.original + " → " + pumped.pumped + "</strong>";
      diagonalMetric.innerHTML = "<span>泵后归属</span><strong>不在 a^n b^n</strong>";
      table.querySelector("tbody").innerHTML = result.trace.slice(0, cursor + 1).map(function (item, index) {
        return "<tr><th>" + index + "</th><td>" + item.symbol + "</td><td>" + item.state + "</td><td>" + (index === 0 ? "空前缀" : "前缀模 3") + "</td></tr>";
      }).join("");
      note.textContent = "转移只保留前缀模 3；泵引理则利用长度至少为状态数时必有重复状态。它证明的是有限记忆的边界，不是停机判定器。";
      stepButton.disabled = cursor === result.trace.length - 1;
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.accept || !answers.pump) {
        feedback.textContent = "两项都要先下注。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.accept === "accept" ? 1 : 0) + (answers.pump === "leave" ? 1 : 0);
      feedback.textContent = "预测已记录：" + score + " / 2 命中；现在逐步读取状态。";
      render();
    });
    input.addEventListener("change", function () { cursor = 0; render(); });
    nInput.addEventListener("input", render);
    pInput.addEventListener("input", render);
    stepButton.addEventListener("click", function () { cursor += 1; render(); });
    runButton.addEventListener("click", function () { cursor = result.trace.length - 1; render(); });
    resetButton.addEventListener("click", function () { cursor = 0; input.value = "110"; nInput.value = "3"; pInput.value = "1"; render(); });
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }
    var accepted = runDfa("110");
    var rejected = runDfa("101");
    check(accepted.state === 0 && accepted.accepted, "110 is divisible by 3");
    check(rejected.state === 2 && !rejected.accepted, "101 is not divisible by 3");
    check(accepted.trace.length === 4, "trace includes start state");
    var witness = pump(3, 1);
    check(witness.original === "aaabbb" && witness.pumped === "aaaabbb", "pump witness");
    check(witness.originalValid && !witness.pumpedValid, "pumping leaves the balanced language");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, runDfa: runDfa, pump: pump };
});

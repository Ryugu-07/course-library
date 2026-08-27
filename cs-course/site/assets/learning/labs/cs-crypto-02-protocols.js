(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-crypto-02-protocols", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-crypto-02-protocols self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-crypto-02-protocols self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-crypto-02-protocols";
  var CHALLENGES = ["L", "R", "R", "L", "R", "L", "L", "R"];

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function transcript(rounds, strategy) {
    var rows = [];
    for (var i = 0; i < rounds; i += 1) {
      var challenge = CHALLENGES[i % CHALLENGES.length];
      var response = strategy === "honest" ? challenge : "L";
      rows.push({ round: i + 1, challenge: challenge, response: response, passed: response === challenge });
    }
    return { rounds: rounds, strategy: strategy, rows: rows, successes: rows.filter(function (row) { return row.passed; }).length, soundnessError: Math.pow(0.5, rounds) };
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
      '[data-learning-lab="' + NAME + '"]{--cpp-blue:#315f9d;--cpp-gold:#a36a16;--cpp-green:#39734d;--cpp-red:#b64335;display:block;max-width:100%;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3,[data-learning-lab="' + NAME + '"] h4{margin:0;letter-spacing:0}' +
      '[data-learning-lab="' + NAME + '"] p{margin:8px 0}[data-learning-lab="' + NAME + '"] fieldset{border:0;min-width:0;margin:0;padding:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:8px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,transparent);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:hover,[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{border-color:var(--accent);outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .cpp-primary{background:var(--cpp-blue);border-color:var(--cpp-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .cpp-choices,[data-learning-lab="' + NAME + '"] .cpp-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .cpp-actions{margin-top:12px}' +
      '[data-learning-lab="' + NAME + '"] .cpp-feedback,[data-learning-lab="' + NAME + '"] .cpp-note{min-height:2em;color:var(--fg-soft);font-size:13px}' +
      '[data-learning-lab="' + NAME + '"] .cpp-revealed[hidden]{display:none}[data-learning-lab="' + NAME + '"] .cpp-layout{display:grid;grid-template-columns:minmax(200px,.55fr) minmax(0,1.45fr);gap:16px;align-items:start;margin-top:16px}' +
      '[data-learning-lab="' + NAME + '"] .cpp-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border);border-radius:7px}[data-learning-lab="' + NAME + '"] .cpp-control{display:grid;gap:5px}[data-learning-lab="' + NAME + '"] .cpp-control label{font-size:13px;font-weight:700;color:var(--fg-soft)}[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--cpp-blue)}' +
      '[data-learning-lab="' + NAME + '"] .cpp-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;overflow:hidden}[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto}[data-learning-lab="' + NAME + '"] .cpp-door{fill:var(--bg);stroke:var(--cpp-blue);stroke-width:3}[data-learning-lab="' + NAME + '"] .cpp-door.cpp-challenge{stroke:var(--cpp-gold);stroke-width:5}[data-learning-lab="' + NAME + '"] .cpp-pass{fill:var(--cpp-green)}[data-learning-lab="' + NAME + '"] .cpp-fail{fill:var(--cpp-red)}[data-learning-lab="' + NAME + '"] .cpp-label{font-size:14px;font-weight:750;text-anchor:middle;dominant-baseline:middle}[data-learning-lab="' + NAME + '"] .cpp-small{font-size:11px;fill:var(--fg-soft)!important}' +
      '[data-learning-lab="' + NAME + '"] .cpp-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .cpp-metric{padding:8px;border-top:2px solid var(--cpp-blue)}[data-learning-lab="' + NAME + '"] .cpp-metric span{display:block;color:var(--fg-soft);font-size:12px}[data-learning-lab="' + NAME + '"] .cpp-metric strong{display:block;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + NAME + '"] table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:6px;border-bottom:1px solid var(--border);text-align:left}' +
      '@media(max-width:760px){[data-learning-lab="' + NAME + '"] .cpp-layout{grid-template-columns:1fr}}@media(max-width:520px){[data-learning-lab="' + NAME + '"] .cpp-choices,[data-learning-lab="' + NAME + '"] .cpp-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select{width:100%}}';
    doc.head.appendChild(style);
  }

  function renderCave(doc, result, cursor) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 560 270", role: "img", "aria-label": "零知识洞穴挑战响应状态" });
    svg.appendChild(svgElement(doc, "path", { d: "M70 210 L70 90 Q70 45 130 45 L430 45 Q490 45 490 90 L490 210", fill: "none", stroke: "var(--border)", "stroke-width": 20 }));
    svg.appendChild(svgElement(doc, "circle", { cx: 280, cy: 100, r: 28, fill: "var(--cpp-gold)" }));
    svg.appendChild(svgElement(doc, "text", { x: 280, y: 105, class: "cpp-label" }, "门"));
    var row = result.rows[Math.max(0, cursor - 1)];
    if (row) {
      var left = row.response === "L" ? 115 : 445;
      var right = row.challenge === "L" ? 115 : 445;
      svg.appendChild(svgElement(doc, "circle", { cx: left, cy: 210, r: 18, fill: "var(--cpp-blue)" }));
      svg.appendChild(svgElement(doc, "circle", { cx: right, cy: 210, r: 18, class: row.passed ? "cpp-pass" : "cpp-fail" }));
      svg.appendChild(svgElement(doc, "text", { x: left, y: 215, class: "cpp-label", fill: "#fff" }, "P"));
      svg.appendChild(svgElement(doc, "text", { x: right, y: 215, class: "cpp-label", fill: "#fff" }, row.challenge));
      svg.appendChild(svgElement(doc, "text", { x: 280, y: 250, class: "cpp-small", "text-anchor": "middle" }, "第 " + row.round + " 轮：挑战 " + row.challenge + "，响应 " + row.response + "，" + (row.passed ? "通过" : "失败")));
    } else {
      svg.appendChild(svgElement(doc, "text", { x: 280, y: 220, class: "cpp-small", "text-anchor": "middle" }, "点击“下一轮”开始揭示挑战"));
    }
    return svg;
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "零知识洞穴：可靠性如何指数放大" }));
    shell.appendChild(element(doc, "p", { className: "cpp-note", text: "挑战序列固定以便复盘；先预测全中概率和泄露量，再逐轮查看 transcript。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { probability: null, leakage: null };
    var groupItems = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { className: "cpp-question", text: prompt }));
      var row = element(doc, "div", { className: "cpp-choices", role: "group", "aria-label": prompt });
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
    question("probability", "六轮全猜中的概率？", [["half", "1/2"], ["sixty-fourth", "1/64"], ["certain", "1"]]);
    question("leakage", "正确 transcript 是否公开密码？", [["yes", "会公开"], ["no", "不公开"], ["unclear", "无法判断"]]);
    form.appendChild(fieldset);
    form.appendChild(element(doc, "div", { className: "cpp-actions" }, [element(doc, "button", { type: "submit", className: "cpp-primary", text: "提交预测并揭示" })]));
    var feedback = element(doc, "p", { className: "cpp-feedback", role: "status", "aria-live": "polite", text: "请完成两项预测。" });
    form.appendChild(feedback);
    shell.appendChild(form);

    var revealed = element(doc, "section", { className: "cpp-revealed", hidden: "hidden" });
    var layout = element(doc, "div", { className: "cpp-layout" });
    var controls = element(doc, "div", { className: "cpp-controls" });
    var strategy = element(doc, "select", { "aria-label": "证明者策略" });
    strategy.appendChild(element(doc, "option", { value: "honest", text: "知道密码：按挑战响应" }));
    strategy.appendChild(element(doc, "option", { value: "guess", text: "不知道：固定从 L 出来" }));
    var roundsInput = element(doc, "input", { type: "range", min: "1", max: "8", value: "6", step: "1" });
    var roundsOutput = element(doc, "output", { text: "6" });
    controls.appendChild(element(doc, "label", { className: "cpp-control" }, ["证明者策略 ", strategy]));
    controls.appendChild(element(doc, "div", { className: "cpp-control" }, [element(doc, "label", {}, ["轮数 r = ", roundsOutput]), roundsInput]));
    var actions = element(doc, "div", { className: "cpp-actions" });
    var previous = element(doc, "button", { type: "button", text: "上一轮" });
    var next = element(doc, "button", { type: "button", className: "cpp-primary", text: "下一轮" });
    var run = element(doc, "button", { type: "button", text: "显示全部" });
    actions.appendChild(previous);
    actions.appendChild(next);
    actions.appendChild(run);
    controls.appendChild(actions);
    layout.appendChild(controls);
    var stage = element(doc, "div", { className: "cpp-stage" });
    layout.appendChild(stage);
    revealed.appendChild(layout);
    var metrics = element(doc, "div", { className: "cpp-metrics" });
    var successMetric = element(doc, "div", { className: "cpp-metric" });
    var errorMetric = element(doc, "div", { className: "cpp-metric" });
    var viewMetric = element(doc, "div", { className: "cpp-metric" });
    metrics.appendChild(successMetric);
    metrics.appendChild(errorMetric);
    metrics.appendChild(viewMetric);
    revealed.appendChild(metrics);
    var table = element(doc, "table", { "aria-label": "挑战响应 transcript" });
    table.innerHTML = "<thead><tr><th>轮</th><th>挑战</th><th>响应</th><th>结果</th></tr></thead><tbody></tbody>";
    revealed.appendChild(table);
    var note = element(doc, "p", { className: "cpp-note" });
    revealed.appendChild(note);
    shell.appendChild(revealed);
    root.appendChild(shell);

    var cursor = 0;
    function render() {
      var rounds = Number(roundsInput.value);
      var result = transcript(rounds, strategy.value);
      cursor = Math.min(cursor, rounds);
      roundsOutput.textContent = String(rounds);
      stage.replaceChildren(renderCave(doc, result, cursor));
      var visible = result.rows.slice(0, cursor);
      successMetric.innerHTML = "<span>已揭示通过</span><strong>" + visible.filter(function (row) { return row.passed; }).length + " / " + visible.length + "</strong>";
      errorMetric.innerHTML = "<span>全程作弊概率</span><strong>" + result.soundnessError.toExponential(2) + "</strong>";
      viewMetric.innerHTML = "<span>当前视图</span><strong>" + (cursor === rounds ? "完整" : "第 " + cursor + " 轮") + "</strong>";
      table.querySelector("tbody").innerHTML = visible.map(function (row) {
        return "<tr><th>" + row.round + "</th><td>" + row.challenge + "</td><td>" + row.response + "</td><td>" + (row.passed ? "通过" : "失败") + "</td></tr>";
      }).join("");
      note.textContent = strategy.value === "honest" ? "诚实证明者每次都能响应；验证者只看到挑战—响应关系，不看到门的密码。" : "固定从 L 出来只能在挑战为 L 时通过；每轮独立时全中概率为 2^-r。";
      previous.disabled = cursor === 0;
      next.disabled = cursor === rounds;
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.probability || !answers.leakage) {
        feedback.textContent = "两项都要先下注。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.probability === "sixty-fourth" ? 1 : 0) + (answers.leakage === "no" ? 1 : 0);
      feedback.textContent = "预测已记录：" + score + " / 2 命中；现在逐轮查看 transcript。";
      render();
    });
    strategy.addEventListener("change", function () { cursor = 0; render(); });
    roundsInput.addEventListener("input", function () { cursor = 0; render(); });
    previous.addEventListener("click", function () { cursor -= 1; render(); });
    next.addEventListener("click", function () { cursor += 1; render(); });
    run.addEventListener("click", function () { cursor = Number(roundsInput.value); render(); });
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }
    var honest = transcript(6, "honest");
    var guess = transcript(6, "guess");
    check(honest.successes === 6, "honest prover passes every challenge");
    check(guess.successes === 3, "fixed guess follows deterministic challenges");
    check(honest.soundnessError === 1 / 64, "six-round soundness error");
    var longHonest = transcript(20, "honest");
    var longGuess = transcript(20, "guess");
    check(longHonest.successes === 20 && longGuess.successes === 10, "long transcript repeats challenge schedule");
    check(longGuess.soundnessError === 1 / 1048576, "twenty-round probability");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, transcript: transcript };
});

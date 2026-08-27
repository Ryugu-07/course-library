(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-toc-02-complexity", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-toc-02-complexity self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-toc-02-complexity self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-toc-02-complexity";
  var FORMULAS = {
    sat: {
      label: "SAT：三条子句有见证",
      clauses: [[1, 2], [-1, 3], [-2, -3]],
      note: "文字 1 表示 x0，-1 表示 ¬x0；给出一组赋值即可快速验收。"
    },
    unsat: {
      label: "UNSAT：x0 与 ¬x0 冲突",
      clauses: [[1], [-1]],
      note: "没有满足赋值；穷举只能把 2^n 个候选都拒绝。"
    }
  };

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function assignment(mask, variables) {
    var values = [];
    for (var index = 0; index < variables; index += 1) values.push((mask >> index) & 1);
    return values;
  }

  function verify(values, clauses) {
    return clauses.every(function (clause) {
      return clause.some(function (literal) {
        var index = Math.abs(literal) - 1;
        return literal > 0 ? values[index] === 1 : values[index] === 0;
      });
    });
  }

  function search(formula, variables) {
    var total = Math.pow(2, variables);
    for (var mask = 0; mask < total; mask += 1) {
      var values = assignment(mask, variables);
      if (verify(values, formula.clauses)) {
        return { found: true, attempts: mask + 1, values: values, total: total };
      }
    }
    return { found: false, attempts: total, values: null, total: total };
  }

  function literalText(literal) {
    return literal > 0 ? "x" + (literal - 1) : "¬x" + (-literal - 1);
  }

  function formulaText(formula) {
    return formula.clauses.map(function (clause) { return "(" + clause.map(literalText).join(" ∨ ") + ")"; }).join(" ∧ ");
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

  function renderBars(doc, formula, variables, result) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 560 245", role: "img", "aria-label": "SAT 证书验证与搜索成本" });
    var max = Math.max(result.attempts, formula.clauses.length, 1);
    var verifyWidth = 380 * formula.clauses.length / max;
    var searchWidth = 380 * result.attempts / max;
    svg.appendChild(svgElement(doc, "text", { x: 12, y: 32, class: "ctt-small" }, "验证给定证书：逐条检查 " + formula.clauses.length + " 条子句"));
    svg.appendChild(svgElement(doc, "rect", { x: 150, y: 14, width: verifyWidth, height: 28, fill: "var(--ctt-green)" }));
    svg.appendChild(svgElement(doc, "text", { x: 158, y: 33, class: "ctt-bar-label" }, String(formula.clauses.length)));
    svg.appendChild(svgElement(doc, "text", { x: 12, y: 92, class: "ctt-small" }, "从零开始搜索：检查 " + result.attempts + " / 2^" + variables + " 个赋值"));
    svg.appendChild(svgElement(doc, "rect", { x: 150, y: 74, width: searchWidth, height: 28, fill: "var(--ctt-gold)" }));
    svg.appendChild(svgElement(doc, "text", { x: 158, y: 93, class: "ctt-bar-label" }, String(result.attempts)));
    svg.appendChild(svgElement(doc, "line", { x1: 150 + 380 * Math.min(1, formula.clauses.length / max), y1: 122, x2: 150 + 380 * Math.min(1, formula.clauses.length / max), y2: 198, stroke: "var(--ctt-red)", "stroke-dasharray": "5 4" }));
    svg.appendChild(svgElement(doc, "text", { x: 12, y: 155, class: "ctt-small" }, "变量数 n=" + variables + "；最坏候选空间 = " + result.total));
    svg.appendChild(svgElement(doc, "text", { x: 12, y: 190, class: "ctt-small" }, result.found ? "搜索找到见证：" + result.values.join("") : "搜索完所有候选，确认无见证"));
    return svg;
  }

  function installStyles(doc) {
    var styleId = "cl-" + NAME + "-styles";
    if (doc.getElementById(styleId)) return;
    var style = doc.createElement("style");
    style.id = styleId;
    style.textContent =
      '[data-learning-lab="' + NAME + '"]{--ctt-blue:#315f9d;--ctt-gold:#a36a16;--ctt-green:#39734d;--ctt-red:#b64335;display:block;max-width:100%;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3,[data-learning-lab="' + NAME + '"] h4{margin:0;letter-spacing:0}' +
      '[data-learning-lab="' + NAME + '"] p{margin:8px 0}[data-learning-lab="' + NAME + '"] fieldset{border:0;min-width:0;margin:0;padding:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:8px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,transparent);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:hover,[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{border-color:var(--accent);outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .ctt-primary{background:var(--ctt-blue);border-color:var(--ctt-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .ctt-choices,[data-learning-lab="' + NAME + '"] .ctt-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .ctt-actions{margin-top:12px}' +
      '[data-learning-lab="' + NAME + '"] .ctt-feedback,[data-learning-lab="' + NAME + '"] .ctt-note{min-height:2em;color:var(--fg-soft);font-size:13px}' +
      '[data-learning-lab="' + NAME + '"] .ctt-revealed[hidden]{display:none}[data-learning-lab="' + NAME + '"] .ctt-layout{display:grid;grid-template-columns:minmax(190px,.55fr) minmax(0,1.45fr);gap:16px;align-items:start;margin-top:16px}' +
      '[data-learning-lab="' + NAME + '"] .ctt-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border);border-radius:7px}[data-learning-lab="' + NAME + '"] .ctt-control{display:grid;gap:5px}[data-learning-lab="' + NAME + '"] .ctt-control label{font-size:13px;font-weight:700;color:var(--fg-soft)}[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--ctt-blue)}' +
      '[data-learning-lab="' + NAME + '"] .ctt-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;overflow:hidden}[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto}[data-learning-lab="' + NAME + '"] .ctt-small{font-size:11px;fill:var(--fg-soft)!important}[data-learning-lab="' + NAME + '"] .ctt-bar-label{font-size:12px;fill:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .ctt-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .ctt-metric{padding:8px;border-top:2px solid var(--ctt-blue)}[data-learning-lab="' + NAME + '"] .ctt-metric span{display:block;color:var(--fg-soft);font-size:12px}[data-learning-lab="' + NAME + '"] .ctt-metric strong{display:block;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + NAME + '"] table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:6px;border-bottom:1px solid var(--border);text-align:left}' +
      '@media(max-width:760px){[data-learning-lab="' + NAME + '"] .ctt-layout{grid-template-columns:1fr}}@media(max-width:520px){[data-learning-lab="' + NAME + '"] .ctt-choices,[data-learning-lab="' + NAME + '"] .ctt-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select{width:100%}}';
    doc.head.appendChild(style);
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "复杂度账本：验证器与搜索器" }));
    shell.appendChild(element(doc, "p", { className: "ctt-note", text: "先预测证书检查和穷举搜索的增长，再切换 SAT/UNSAT 与变量数。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { verifier: null, search: null };
    var groupItems = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { className: "ctt-question", text: prompt }));
      var row = element(doc, "div", { className: "ctt-choices", role: "group", "aria-label": prompt });
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
    question("verifier", "给定赋值时，验证三条子句的成本随 n？", [["exp", "指数增长"], ["poly", "随输入多项式增长"], ["zero", "零成本"]]);
    question("search", "UNSAT 且 n=13，最坏候选数？", [["13", "13"], ["169", "13²"], ["8192", "2¹³=8192"]]);
    form.appendChild(fieldset);
    form.appendChild(element(doc, "div", { className: "ctt-actions" }, [element(doc, "button", { type: "submit", className: "ctt-primary", text: "提交预测并揭示" })]));
    var feedback = element(doc, "p", { className: "ctt-feedback", role: "status", "aria-live": "polite", text: "请完成两项预测。" });
    form.appendChild(feedback);
    shell.appendChild(form);

    var revealed = element(doc, "section", { className: "ctt-revealed", hidden: "hidden" });
    var layout = element(doc, "div", { className: "ctt-layout" });
    var controls = element(doc, "div", { className: "ctt-controls" });
    var formula = element(doc, "select", { "aria-label": "公式预设" });
    Object.keys(FORMULAS).forEach(function (id) { formula.appendChild(element(doc, "option", { value: id, text: FORMULAS[id].label })); });
    var nInput = element(doc, "input", { type: "range", min: "3", max: "16", value: "13", step: "1" });
    var nOutput = element(doc, "output", { text: "13" });
    controls.appendChild(element(doc, "label", { className: "ctt-control" }, ["公式 ", formula]));
    controls.appendChild(element(doc, "div", { className: "ctt-control" }, [element(doc, "label", {}, ["变量数 n = ", nOutput]), nInput]));
    var note = element(doc, "p", { className: "ctt-note" });
    controls.appendChild(note);
    layout.appendChild(controls);
    var stage = element(doc, "div", { className: "ctt-stage" });
    layout.appendChild(stage);
    revealed.appendChild(layout);
    var metrics = element(doc, "div", { className: "ctt-metrics" });
    var verifierMetric = element(doc, "div", { className: "ctt-metric" });
    var searchMetric = element(doc, "div", { className: "ctt-metric" });
    var resultMetric = element(doc, "div", { className: "ctt-metric" });
    metrics.appendChild(verifierMetric);
    metrics.appendChild(searchMetric);
    metrics.appendChild(resultMetric);
    revealed.appendChild(metrics);
    var table = element(doc, "table", { "aria-label": "公式与证书账本" });
    table.innerHTML = "<thead><tr><th>对象</th><th>值</th><th>含义</th></tr></thead><tbody></tbody>";
    revealed.appendChild(table);
    shell.appendChild(revealed);
    root.appendChild(shell);

    function render() {
      var current = FORMULAS[formula.value];
      var variables = Number(nInput.value);
      var result = search(current, variables);
      nOutput.textContent = String(variables);
      stage.replaceChildren(renderBars(doc, current, variables, result));
      verifierMetric.innerHTML = "<span>验证器检查</span><strong>" + current.clauses.length + " 条子句</strong>";
      searchMetric.innerHTML = "<span>搜索尝试</span><strong>" + result.attempts + " / " + result.total + "</strong>";
      resultMetric.innerHTML = "<span>判定结果</span><strong>" + (result.found ? "SAT" : "UNSAT") + "</strong>";
      note.textContent = current.note + " 公式：" + formulaText(current);
      table.querySelector("tbody").innerHTML =
        "<tr><th>证书</th><td>" + (result.found ? result.values.join("") : "不存在") + "</td><td>验证器逐条检查子句</td></tr>" +
        "<tr><th>输入变量</th><td>" + variables + "</td><td>候选空间 2^" + variables + " = " + result.total + "</td></tr>" +
        "<tr><th>搜索停止</th><td>" + result.attempts + "</td><td>" + (result.found ? "找到第一组见证" : "穷举后排除全部") + "</td></tr>";
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.verifier || !answers.search) {
        feedback.textContent = "两项都要先下注。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.verifier === "poly" ? 1 : 0) + (answers.search === "8192" ? 1 : 0);
      feedback.textContent = "预测已记录：" + score + " / 2 命中；现在改变资源规模。";
      render();
    });
    formula.addEventListener("change", render);
    nInput.addEventListener("input", render);
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }
    var sat = FORMULAS.sat;
    check(verify([0, 1, 0], sat.clauses), "known SAT certificate verifies");
    check(!verify([0, 0, 0], sat.clauses), "invalid certificate rejects");
    var satSearch = search(sat, 3);
    var unsatSearch = search(FORMULAS.unsat, 5);
    check(satSearch.found && satSearch.attempts <= 8, "SAT search finds a witness");
    check(!unsatSearch.found && unsatSearch.attempts === 32, "UNSAT search exhausts 2^n");
    check(Math.pow(2, 13) === 8192, "candidate count arithmetic");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, verify: verify, search: search };
});

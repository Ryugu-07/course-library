(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-crypto-01-foundations", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-crypto-01-foundations self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-crypto-01-foundations self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-crypto-01-foundations";
  var GENERATOR = 5;

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function modPow(base, exponent, modulus) {
    var result = 1 % modulus;
    var factor = ((base % modulus) + modulus) % modulus;
    var power = Math.floor(exponent);
    while (power > 0) {
      if (power % 2 === 1) result = (result * factor) % modulus;
      factor = (factor * factor) % modulus;
      power = Math.floor(power / 2);
    }
    return result;
  }

  function modPowTrace(base, exponent, modulus) {
    var rows = [{ exponent: 0, value: 1 % modulus }];
    for (var i = 1; i <= exponent; i += 1) rows.push({ exponent: i, value: modPow(base, i, modulus) });
    return rows;
  }

  function discreteLog(modulus, generator, target) {
    for (var exponent = 0; exponent < modulus; exponent += 1) {
      if (modPow(generator, exponent, modulus) === target) return exponent;
    }
    return null;
  }

  function exchange(params) {
    var p = Number(params.p);
    var a = Number(params.a);
    var b = Number(params.b);
    var A = modPow(GENERATOR, a, p);
    var B = modPow(GENERATOR, b, p);
    var aliceShared = modPow(B, a, p);
    var bobShared = modPow(A, b, p);
    return {
      p: p,
      g: GENERATOR,
      a: a,
      b: b,
      A: A,
      B: B,
      aliceShared: aliceShared,
      bobShared: bobShared,
      attackerExponent: discreteLog(p, GENERATOR, A),
      attackerWork: Math.min(p, Math.max(1, a + 1)),
      agree: aliceShared === bobShared
    };
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
      '[data-learning-lab="' + NAME + '"]{--ccf-blue:#315f9d;--ccf-gold:#a36a16;--ccf-green:#39734d;--ccf-red:#b64335;display:block;max-width:100%;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3,[data-learning-lab="' + NAME + '"] h4{margin:0;letter-spacing:0}' +
      '[data-learning-lab="' + NAME + '"] p{margin:8px 0}[data-learning-lab="' + NAME + '"] fieldset{border:0;min-width:0;margin:0;padding:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:8px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,transparent);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:hover,[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{border-color:var(--accent);outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .ccf-primary{background:var(--ccf-blue);border-color:var(--ccf-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .ccf-choices,[data-learning-lab="' + NAME + '"] .ccf-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .ccf-actions{margin-top:12px}' +
      '[data-learning-lab="' + NAME + '"] .ccf-feedback,[data-learning-lab="' + NAME + '"] .ccf-note{min-height:2em;color:var(--fg-soft);font-size:13px}' +
      '[data-learning-lab="' + NAME + '"] .ccf-revealed[hidden]{display:none}[data-learning-lab="' + NAME + '"] .ccf-layout{display:grid;grid-template-columns:minmax(200px,.55fr) minmax(0,1.45fr);gap:16px;align-items:start;margin-top:16px}' +
      '[data-learning-lab="' + NAME + '"] .ccf-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border);border-radius:7px}[data-learning-lab="' + NAME + '"] .ccf-control{display:grid;gap:5px}[data-learning-lab="' + NAME + '"] .ccf-control label{font-size:13px;font-weight:700;color:var(--fg-soft)}[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--ccf-blue)}' +
      '[data-learning-lab="' + NAME + '"] .ccf-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;overflow:hidden}[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto}' +
      '[data-learning-lab="' + NAME + '"] .ccf-arrow{stroke:var(--ccf-blue);stroke-width:2.5;fill:none}[data-learning-lab="' + NAME + '"] .ccf-secret{fill:var(--ccf-gold);stroke:var(--ccf-gold);stroke-width:2}[data-learning-lab="' + NAME + '"] .ccf-public{fill:var(--ccf-green);stroke:var(--ccf-green);stroke-width:2}[data-learning-lab="' + NAME + '"] .ccf-label{font-size:13px;font-weight:750;text-anchor:middle;dominant-baseline:middle}[data-learning-lab="' + NAME + '"] .ccf-small{font-size:11px;fill:var(--fg-soft)!important}' +
      '[data-learning-lab="' + NAME + '"] .ccf-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .ccf-metric{padding:8px;border-top:2px solid var(--ccf-blue)}[data-learning-lab="' + NAME + '"] .ccf-metric span{display:block;color:var(--fg-soft);font-size:12px}[data-learning-lab="' + NAME + '"] .ccf-metric strong{display:block;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + NAME + '"] table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:6px;border-bottom:1px solid var(--border);text-align:left}' +
      '@media(max-width:760px){[data-learning-lab="' + NAME + '"] .ccf-layout{grid-template-columns:1fr}}@media(max-width:520px){[data-learning-lab="' + NAME + '"] .ccf-choices,[data-learning-lab="' + NAME + '"] .ccf-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select{width:100%}}';
    doc.head.appendChild(style);
  }

  function renderExchange(doc, data) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 560 230", role: "img", "aria-label": "Diffie-Hellman 公开交换与共享秘密" });
    svg.appendChild(svgElement(doc, "line", { x1: 102, y1: 80, x2: 458, y2: 80, class: "ccf-arrow" }));
    svg.appendChild(svgElement(doc, "line", { x1: 458, y1: 150, x2: 102, y2: 150, class: "ccf-arrow" }));
    svg.appendChild(svgElement(doc, "circle", { cx: 72, cy: 115, r: 30, class: "ccf-secret" }));
    svg.appendChild(svgElement(doc, "circle", { cx: 488, cy: 115, r: 30, class: "ccf-secret" }));
    svg.appendChild(svgElement(doc, "text", { x: 72, y: 115, class: "ccf-label" }, "Alice"));
    svg.appendChild(svgElement(doc, "text", { x: 488, y: 115, class: "ccf-label" }, "Bob"));
    svg.appendChild(svgElement(doc, "text", { x: 280, y: 66, class: "ccf-small", "text-anchor": "middle" }, "公开 A = g^a mod p = " + data.A));
    svg.appendChild(svgElement(doc, "text", { x: 280, y: 170, class: "ccf-small", "text-anchor": "middle" }, "公开 B = g^b mod p = " + data.B));
    svg.appendChild(svgElement(doc, "rect", { x: 208, y: 188, width: 144, height: 28, rx: 5, fill: "var(--ccf-green)" }));
    svg.appendChild(svgElement(doc, "text", { x: 280, y: 206, class: "ccf-label", fill: "#fff" }, "共享值 = " + data.aliceShared));
    return svg;
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "Diffie–Hellman：公开值如何汇合成秘密" }));
    shell.appendChild(element(doc, "p", { className: "ccf-note", text: "小群版本可完整枚举，正适合检查交换律和安全边界。先预测，再改变两边私密指数。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { equality: null, small: null };
    var groupItems = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { className: "ccf-question", text: prompt }));
      var row = element(doc, "div", { className: "ccf-choices", role: "group", "aria-label": prompt });
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
    question("equality", "Alice 与 Bob 的共享值会？", [["different", "不同"], ["same", "相同"], ["zero", "总是 0"]]);
    question("small", "p=23 时旁观者能否枚举私密指数？", [["no", "不能"], ["yes", "能，最多试 23 次"], ["only-bob", "只有 Bob 能"]]);
    form.appendChild(fieldset);
    form.appendChild(element(doc, "div", { className: "ccf-actions" }, [element(doc, "button", { type: "submit", className: "ccf-primary", text: "提交预测并揭示" })]));
    var feedback = element(doc, "p", { className: "ccf-feedback", role: "status", "aria-live": "polite", text: "请完成两项预测。" });
    form.appendChild(feedback);
    shell.appendChild(form);

    var revealed = element(doc, "section", { className: "ccf-revealed", hidden: "hidden" });
    var layout = element(doc, "div", { className: "ccf-layout" });
    var controls = element(doc, "div", { className: "ccf-controls" });
    var pSelect = element(doc, "select", { "aria-label": "模数 p" });
    [23, 29].forEach(function (p) { pSelect.appendChild(element(doc, "option", { value: p, text: "p = " + p })); });
    var aInput = element(doc, "input", { type: "range", min: "1", max: "15", value: "6", step: "1" });
    var bInput = element(doc, "input", { type: "range", min: "1", max: "15", value: "15", step: "1" });
    var aOutput = element(doc, "output", { text: "6" });
    var bOutput = element(doc, "output", { text: "15" });
    controls.appendChild(element(doc, "label", { className: "ccf-control" }, ["模数 ", pSelect]));
    controls.appendChild(element(doc, "div", { className: "ccf-control" }, [element(doc, "label", {}, ["Alice 私密 a = ", aOutput]), aInput]));
    controls.appendChild(element(doc, "div", { className: "ccf-control" }, [element(doc, "label", {}, ["Bob 私密 b = ", bOutput]), bInput]));
    layout.appendChild(controls);
    var stage = element(doc, "div", { className: "ccf-stage" });
    layout.appendChild(stage);
    revealed.appendChild(layout);
    var metrics = element(doc, "div", { className: "ccf-metrics" });
    var sharedMetric = element(doc, "div", { className: "ccf-metric" });
    var agreeMetric = element(doc, "div", { className: "ccf-metric" });
    var attackMetric = element(doc, "div", { className: "ccf-metric" });
    metrics.appendChild(sharedMetric);
    metrics.appendChild(agreeMetric);
    metrics.appendChild(attackMetric);
    revealed.appendChild(metrics);
    var table = element(doc, "table", { "aria-label": "Diffie-Hellman 计算账本" });
    table.innerHTML = "<thead><tr><th>量</th><th>值</th><th>计算</th></tr></thead><tbody></tbody>";
    revealed.appendChild(table);
    var note = element(doc, "p", { className: "ccf-note" });
    revealed.appendChild(note);
    shell.appendChild(revealed);
    root.appendChild(shell);

    function render() {
      var data = exchange({ p: Number(pSelect.value), a: Number(aInput.value), b: Number(bInput.value) });
      aOutput.textContent = String(data.a);
      bOutput.textContent = String(data.b);
      stage.replaceChildren(renderExchange(doc, data));
      sharedMetric.innerHTML = "<span>共享值</span><strong>" + data.aliceShared + " = " + data.bobShared + "</strong>";
      agreeMetric.innerHTML = "<span>交换律检查</span><strong>" + (data.agree ? "通过" : "失败") + "</strong>";
      attackMetric.innerHTML = "<span>小群枚举 a</span><strong>" + (data.attackerExponent === null ? "无解" : "找到 " + data.attackerExponent) + "</strong>";
      table.querySelector("tbody").innerHTML =
        "<tr><th>公开参数</th><td>p=" + data.p + ", g=" + data.g + "</td><td>所有人可见</td></tr>" +
        "<tr><th>Alice</th><td>a=" + data.a + "；A=" + data.A + "</td><td>B^a mod p = " + data.aliceShared + "</td></tr>" +
        "<tr><th>Bob</th><td>b=" + data.b + "；B=" + data.B + "</td><td>A^b mod p = " + data.bobShared + "</td></tr>" +
        "<tr><th>旁观者</th><td>a=" + (data.attackerExponent === null ? "未枚举到" : data.attackerExponent) + "</td><td>玩具群可逐次试指数</td></tr>";
      note.textContent = "真实安全来自大群上的离散对数/计算 DH 假设；本实验只展示正确性，不把小 p 当作安全参数。";
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.equality || !answers.small) {
        feedback.textContent = "两项都要先下注。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.equality === "same" ? 1 : 0) + (answers.small === "yes" ? 1 : 0);
      feedback.textContent = "预测已记录：" + score + " / 2 命中；现在观察公开值与共享值。";
      render();
    });
    pSelect.addEventListener("change", render);
    aInput.addEventListener("input", render);
    bInput.addEventListener("input", render);
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }
    var data = exchange({ p: 23, a: 6, b: 15 });
    check(data.A === 8 && data.B === 19, "public DH values");
    check(data.aliceShared === 2 && data.bobShared === 2, "shared DH value");
    check(data.agree, "commutative agreement");
    check(discreteLog(23, 5, 8) === 6, "toy discrete log can be enumerated");
    check(modPow(5, 0, 23) === 1 && modPow(5, 1, 23) === 5, "modular exponent base cases");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, modPow: modPow, exchange: exchange };
});

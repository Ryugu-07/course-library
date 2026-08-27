(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-mlsys-01-training", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-mlsys-01-training self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-mlsys-01-training self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-mlsys-01-training";

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function memoryLedger(options) {
    var paramsB = Math.max(0.1, Number(options.paramsB));
    var cards = Math.max(1, Math.floor(Number(options.cards)));
    var bytes = options.precision === "fp32" ? { parameter: 4, gradient: 4, master: 4, momentum: 4, variance: 4 } : { parameter: 2, gradient: 2, master: 4, momentum: 4, variance: 4 };
    var scale = paramsB * 1000000000;
    var parameter = scale * bytes.parameter / 1000000000;
    var gradient = scale * bytes.gradient / 1000000000;
    var master = scale * bytes.master / 1000000000;
    var momentum = scale * bytes.momentum / 1000000000;
    var variance = scale * bytes.variance / 1000000000;
    var activationBase = paramsB * 0.5;
    var activation = activationBase * (options.checkpoint ? 0.35 : 1);
    var staticTotal = parameter + gradient + master + momentum + variance;
    var perCard = (options.shard ? staticTotal / cards : staticTotal) + activation;
    var allReduce = gradient * (cards <= 1 ? 0 : 2 * (cards - 1) / cards);
    return {
      paramsB: paramsB,
      cards: cards,
      precision: options.precision,
      checkpoint: Boolean(options.checkpoint),
      shard: Boolean(options.shard),
      parameter: parameter,
      gradient: gradient,
      master: master,
      momentum: momentum,
      variance: variance,
      activation: activation,
      staticTotal: staticTotal,
      perCard: perCard,
      allReduce: allReduce
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

  function installStyles(doc) {
    var id = "cl-" + NAME + "-styles";
    if (doc.getElementById(id)) return;
    var style = doc.createElement("style");
    style.id = id;
    style.textContent =
      '[data-learning-lab="' + NAME + '"]{--cmt-blue:#245a9b;--cmt-green:#2d7a4b;--cmt-orange:#a86213;--cmt-red:#b23a32;display:block;max-width:100%;line-height:1.55;color:var(--fg,currentColor);overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;letter-spacing:0}[data-learning-lab="' + NAME + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + NAME + '"] fieldset{border:0;padding:0;margin:0;min-width:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:7px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,Canvas);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] input[type=checkbox]{min-height:20px;width:20px;padding:0;accent-color:var(--cmt-blue)}[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .cmt-primary{background:var(--cmt-blue);border-color:var(--cmt-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .cmt-choices,[data-learning-lab="' + NAME + '"] .cmt-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .cmt-actions{margin-top:11px}' +
      '[data-learning-lab="' + NAME + '"] .cmt-feedback{min-height:2em;color:var(--fg-soft);font-size:13px}[data-learning-lab="' + NAME + '"] .cmt-revealed[hidden]{display:none}' +
      '[data-learning-lab="' + NAME + '"] .cmt-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:11px;border:1px solid var(--border);border-radius:7px;margin-top:14px}[data-learning-lab="' + NAME + '"] .cmt-control{display:grid;gap:4px;font-size:13px;font-weight:700}' +
      '[data-learning-lab="' + NAME + '"] .cmt-check{display:flex;align-items:center;gap:7px;min-height:44px}[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--cmt-blue)}' +
      '[data-learning-lab="' + NAME + '"] .cmt-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .cmt-metric{padding:7px;border-top:3px solid var(--cmt-blue);min-width:0}[data-learning-lab="' + NAME + '"] .cmt-metric span{display:block;color:var(--fg-soft);font-size:11px}[data-learning-lab="' + NAME + '"] .cmt-metric strong{display:block;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] .cmt-bar{display:grid;gap:6px;margin:12px 0}[data-learning-lab="' + NAME + '"] .cmt-bar-row{display:grid;grid-template-columns:100px minmax(0,1fr) 90px;gap:8px;align-items:center;font-size:12px}[data-learning-lab="' + NAME + '"] .cmt-track{height:16px;background:var(--block-bg,#eef2f6);border:1px solid var(--border);overflow:hidden}[data-learning-lab="' + NAME + '"] .cmt-fill{height:100%;background:var(--cmt-blue);min-width:1px}' +
      '[data-learning-lab="' + NAME + '"] table{border-collapse:collapse;width:100%;font-size:12px;font-variant-numeric:tabular-nums;margin-top:12px}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:6px 7px;text-align:left;border-bottom:1px solid var(--border)}' +
      '@media(max-width:760px){[data-learning-lab="' + NAME + '"] .cmt-controls{grid-template-columns:repeat(2,minmax(0,1fr)}}@media(max-width:500px){[data-learning-lab="' + NAME + '"] .cmt-choices,[data-learning-lab="' + NAME + '"] .cmt-actions,[data-learning-lab="' + NAME + '"] .cmt-controls{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button{width:100%}[data-learning-lab="' + NAME + '"] .cmt-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="' + NAME + '"] .cmt-bar-row{grid-template-columns:76px minmax(0,1fr) 72px}}';
    doc.head.appendChild(style);
  }

  function mount(root) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "训练显存账本：参数、激活与分片" }));
    shell.appendChild(element(doc, "p", { className: "cmt-note", text: "先判断 7B 是否装得下，再改变精度、卡数与 checkpointing。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { memory: null, strategy: null };
    var buttons = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { text: prompt }));
      var row = element(doc, "div", { className: "cmt-choices", role: "group", "aria-label": prompt });
      choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice[1] });
        button.addEventListener("click", function () {
          answers[key] = choice[0];
          buttons.forEach(function (item) { if (item.key === key) item.node.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false"); });
        });
        buttons.push({ key: key, value: choice[0], node: button });
        row.appendChild(button);
      });
      fieldset.appendChild(row);
    }
    question("memory", "7B × 16 bytes/parameter 约需？", [["large", "112 GB"], ["small", "14 GB"]]);
    question("strategy", "激活显存可以用什么换？", [["recompute", "checkpointing 重算"], ["shard", "只复制参数"]]);
    form.appendChild(fieldset);
    var feedback = element(doc, "p", { className: "cmt-feedback", role: "status", "aria-live": "polite", text: "请完成两项预测。" });
    form.appendChild(feedback);
    form.appendChild(element(doc, "div", { className: "cmt-actions" }, [element(doc, "button", { type: "submit", className: "cmt-primary", text: "提交预测并揭示" })]));
    shell.appendChild(form);
    var revealed = element(doc, "section", { className: "cmt-revealed", hidden: "hidden" });
    var controls = element(doc, "div", { className: "cmt-controls" });
    var params = element(doc, "input", { type: "range", min: "1", max: "20", value: "7", step: "1" });
    var paramsOut = element(doc, "output", { text: "7" });
    var cards = element(doc, "input", { type: "range", min: "1", max: "16", value: "8", step: "1" });
    var cardsOut = element(doc, "output", { text: "8" });
    var precision = element(doc, "select", { "aria-label": "训练精度" });
    [["mixed", "mixed fp16 + fp32 state"], ["fp32", "全 fp32"]].forEach(function (option) { precision.appendChild(element(doc, "option", { value: option[0], text: option[1] })); });
    var shard = element(doc, "input", { type: "checkbox", checked: "checked" });
    var checkpoint = element(doc, "input", { type: "checkbox" });
    controls.appendChild(element(doc, "label", { className: "cmt-control" }, ["参数量 = ", paramsOut, "B", params]));
    controls.appendChild(element(doc, "label", { className: "cmt-control" }, ["卡数 = ", cardsOut, cards]));
    controls.appendChild(element(doc, "label", { className: "cmt-control" }, ["数值精度", precision]));
    controls.appendChild(element(doc, "label", { className: "cmt-check" }, [shard, "ZeRO 风格静态分片"]));
    controls.appendChild(element(doc, "label", { className: "cmt-check" }, [checkpoint, "checkpointing"]));
    revealed.appendChild(controls);
    var metrics = element(doc, "div", { className: "cmt-metrics" });
    var metricStatic = element(doc, "div", { className: "cmt-metric" });
    var metricCard = element(doc, "div", { className: "cmt-metric" });
    var metricActivation = element(doc, "div", { className: "cmt-metric" });
    var metricComm = element(doc, "div", { className: "cmt-metric" });
    [metricStatic, metricCard, metricActivation, metricComm].forEach(function (node) { metrics.appendChild(node); });
    revealed.appendChild(metrics);
    var bar = element(doc, "div", { className: "cmt-bar", "aria-label": "训练显存组成" });
    revealed.appendChild(bar);
    var table = element(doc, "table", { "aria-label": "训练显存与通信账本" });
    table.innerHTML = "<thead><tr><th>项目</th><th>GB</th><th>是否由 checkpointing 减少</th></tr></thead><tbody></tbody>";
    revealed.appendChild(table);
    shell.appendChild(revealed);
    root.appendChild(shell);
    function render() {
      var data = memoryLedger({ paramsB: Number(params.value), cards: Number(cards.value), precision: precision.value, shard: shard.checked, checkpoint: checkpoint.checked });
      paramsOut.textContent = params.value;
      cardsOut.textContent = cards.value;
      metricStatic.innerHTML = "<span>静态总账</span><strong>" + data.staticTotal.toFixed(1) + " GB</strong>";
      metricCard.innerHTML = "<span>每卡估算</span><strong>" + data.perCard.toFixed(1) + " GB</strong>";
      metricActivation.innerHTML = "<span>激活</span><strong>" + data.activation.toFixed(1) + " GB</strong>";
      metricComm.innerHTML = "<span>all-reduce 近似</span><strong>" + data.allReduce.toFixed(1) + " GB</strong>";
      var parts = [["参数", data.parameter], ["梯度", data.gradient], ["master", data.master], ["momentum", data.momentum], ["variance", data.variance], ["激活", data.activation]];
      var max = Math.max(data.perCard, 1);
      bar.replaceChildren.apply(bar, parts.map(function (part) {
        var row = element(doc, "div", { className: "cmt-bar-row" });
        row.appendChild(element(doc, "span", { text: part[0] }));
        row.appendChild(element(doc, "div", { className: "cmt-track" }, [element(doc, "div", { className: "cmt-fill", style: "width:" + Math.min(100, part[1] / max * 100) + "%" })]));
        row.appendChild(element(doc, "span", { text: part[1].toFixed(1) + " GB" }));
        return row;
      }));
      table.querySelector("tbody").innerHTML = parts.map(function (part) {
        return "<tr><th>" + part[0] + "</th><td>" + part[1].toFixed(2) + "</td><td>" + (part[0] === "激活" ? (data.checkpoint ? "是，重算换显存" : "否") : "否") + "</td></tr>";
      }).join("");
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.memory || !answers.strategy) {
        feedback.textContent = "两项都要先下注。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.memory === "large" ? 1 : 0) + (answers.strategy === "recompute" ? 1 : 0);
      feedback.textContent = "预测命中 " + score + " / 2；现在切换分片与 checkpointing。";
      render();
    });
    [params, cards].forEach(function (input) { input.addEventListener("input", render); });
    precision.addEventListener("change", render);
    shard.addEventListener("change", render);
    checkpoint.addEventListener("change", render);
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var base = memoryLedger({ paramsB: 7, cards: 1, precision: "mixed", shard: false, checkpoint: false });
    var sharded = memoryLedger({ paramsB: 7, cards: 8, precision: "mixed", shard: true, checkpoint: false });
    var saved = memoryLedger({ paramsB: 7, cards: 8, precision: "mixed", shard: true, checkpoint: true });
    check(Math.abs(base.staticTotal - 112) < 1e-9, "7B mixed precision ledger");
    check(sharded.staticTotal === base.staticTotal && sharded.perCard < base.perCard, "static state sharding");
    check(saved.activation < sharded.activation, "checkpointing reduces activation");
    check(sharded.allReduce > 0, "multi-card all reduce volume");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, memoryLedger: memoryLedger };
});

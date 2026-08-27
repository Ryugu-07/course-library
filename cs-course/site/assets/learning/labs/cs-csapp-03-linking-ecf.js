(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-csapp-03-linking-ecf", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-csapp-03-linking-ecf self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-csapp-03-linking-ecf self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-csapp-03-linking-ecf";
  var SCENARIOS = {
    clean: {
      label: "正常解析",
      defs: [{ symbol: "main", object: "main.o" }, { symbol: "foo", object: "a.o" }, { symbol: "puts", object: "libc.a" }],
      refs: [{ symbol: "foo", object: "main.o" }, { symbol: "puts", object: "main.o" }]
    },
    missing: {
      label: "漏掉 foo 定义",
      defs: [{ symbol: "main", object: "main.o" }, { symbol: "puts", object: "libc.a" }],
      refs: [{ symbol: "foo", object: "main.o" }, { symbol: "puts", object: "main.o" }]
    },
    duplicate: {
      label: "两个强定义",
      defs: [{ symbol: "main", object: "main.o" }, { symbol: "foo", object: "a.o" }, { symbol: "foo", object: "b.o" }, { symbol: "puts", object: "libc.a" }],
      refs: [{ symbol: "foo", object: "main.o" }, { symbol: "puts", object: "main.o" }]
    }
  };

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function resolve(id) {
    var source = SCENARIOS[id] || SCENARIOS.clean;
    var bindings = [];
    var errors = [];
    source.refs.forEach(function (ref) {
      var matches = source.defs.filter(function (definition) { return definition.symbol === ref.symbol; });
      if (!matches.length) errors.push({ symbol: ref.symbol, kind: "undefined reference", object: ref.object });
      else if (matches.length > 1) errors.push({ symbol: ref.symbol, kind: "multiple definition", object: matches.map(function (item) { return item.object; }).join(", ") });
      else bindings.push({ symbol: ref.symbol, from: ref.object, to: matches[0].object });
    });
    return { id: id || "clean", label: source.label, defs: source.defs.slice(), refs: source.refs.slice(), bindings: bindings, errors: errors, linked: errors.length === 0 };
  }

  function processCount(forks) {
    return Math.pow(2, Number(forks));
  }

  function processLevels(forks) {
    var levels = [];
    for (var depth = 0; depth <= forks; depth += 1) levels.push(processCount(depth));
    return levels;
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

  function renderSvg(doc, result, forks) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 580 350", role: "img", "aria-label": "符号解析与 fork 进程树" });
    svg.appendChild(svgElement(doc, "text", { x: 12, y: 20, class: "cfl-small" }, "符号解析"));
    result.defs.forEach(function (definition, index) {
      var y = 45 + index * 28;
      svg.appendChild(svgElement(doc, "rect", { x: 12, y: y - 17, width: 175, height: 22, rx: 3, class: "cfl-def" }));
      svg.appendChild(svgElement(doc, "text", { x: 20, y: y - 2, class: "cfl-label" }, definition.symbol + " ← " + definition.object));
    });
    result.refs.forEach(function (ref, index) {
      var y = 45 + index * 28;
      var binding = result.bindings.filter(function (item) { return item.symbol === ref.symbol; })[0];
      var error = result.errors.filter(function (item) { return item.symbol === ref.symbol; })[0];
      svg.appendChild(svgElement(doc, "rect", { x: 240, y: y - 17, width: 310, height: 22, rx: 3, class: error ? "cfl-error" : "cfl-ref" }));
      svg.appendChild(svgElement(doc, "text", { x: 248, y: y - 2, class: "cfl-label" }, ref.symbol + " @ " + ref.object + " → " + (error ? error.kind : binding.to)));
    });
    svg.appendChild(svgElement(doc, "line", { x1: 12, y1: 135, x2: 550, y2: 135, stroke: "var(--border)" }));
    svg.appendChild(svgElement(doc, "text", { x: 12, y: 158, class: "cfl-small" }, "fork() 进程树：深度 " + forks + "，进程数 " + processCount(forks)));
    var levels = processLevels(forks);
    levels.forEach(function (count, depth) {
      var spacing = Math.min(60, 500 / count);
      for (var index = 0; index < count; index += 1) {
        var x = 40 + (index + 0.5) * spacing;
        var y = 190 + depth * 34;
        if (depth > 0) {
          var parentX = 40 + (Math.floor(index / 2) + 0.5) * Math.min(60, 500 / levels[depth - 1]);
          svg.appendChild(svgElement(doc, "line", { x1: parentX, y1: y - 25, x2: x, y2: y - 10, stroke: "var(--border)" }));
        }
        svg.appendChild(svgElement(doc, "circle", { cx: x, cy: y, r: 10, class: depth === 0 ? "cfl-root" : "cfl-process" }));
      }
    });
    svg.appendChild(svgElement(doc, "text", { x: 12, y: 330, class: "cfl-small" }, "trap / interrupt 会保存现场后转入处理路径；exec 替换地址空间，wait 回收子进程"));
    return svg;
  }

  function installStyles(doc) {
    var styleId = "cl-" + NAME + "-styles";
    if (doc.getElementById(styleId)) return;
    var style = doc.createElement("style");
    style.id = styleId;
    style.textContent =
      '[data-learning-lab="' + NAME + '"]{--cfl-blue:#315f9d;--cfl-gold:#a36a16;--cfl-green:#39734d;--cfl-red:#b64335;display:block;max-width:100%;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3,[data-learning-lab="' + NAME + '"] h4{margin:0;letter-spacing:0}' +
      '[data-learning-lab="' + NAME + '"] p{margin:8px 0}[data-learning-lab="' + NAME + '"] fieldset{border:0;min-width:0;margin:0;padding:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:8px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,transparent);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:hover,[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{border-color:var(--accent);outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .cfl-primary{background:var(--cfl-blue);border-color:var(--cfl-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .cfl-choices,[data-learning-lab="' + NAME + '"] .cfl-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .cfl-actions{margin-top:12px}' +
      '[data-learning-lab="' + NAME + '"] .cfl-feedback,[data-learning-lab="' + NAME + '"] .cfl-note{min-height:2em;color:var(--fg-soft);font-size:13px}' +
      '[data-learning-lab="' + NAME + '"] .cfl-revealed[hidden]{display:none}[data-learning-lab="' + NAME + '"] .cfl-layout{display:grid;grid-template-columns:minmax(190px,.55fr) minmax(0,1.45fr);gap:16px;align-items:start;margin-top:16px}' +
      '[data-learning-lab="' + NAME + '"] .cfl-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border);border-radius:7px}[data-learning-lab="' + NAME + '"] .cfl-control{display:grid;gap:5px}[data-learning-lab="' + NAME + '"] .cfl-control label{font-size:13px;font-weight:700;color:var(--fg-soft)}[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--cfl-blue)}' +
      '[data-learning-lab="' + NAME + '"] .cfl-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;overflow:auto}[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto}[data-learning-lab="' + NAME + '"] .cfl-def{fill:color-mix(in srgb,var(--cfl-green) 20%,transparent);stroke:var(--cfl-green)}[data-learning-lab="' + NAME + '"] .cfl-ref{fill:color-mix(in srgb,var(--cfl-blue) 16%,transparent);stroke:var(--cfl-blue)}[data-learning-lab="' + NAME + '"] .cfl-error{fill:color-mix(in srgb,var(--cfl-red) 16%,transparent);stroke:var(--cfl-red)}[data-learning-lab="' + NAME + '"] .cfl-root{fill:var(--cfl-gold)}[data-learning-lab="' + NAME + '"] .cfl-process{fill:var(--cfl-blue)}[data-learning-lab="' + NAME + '"] .cfl-label{font-size:11px}[data-learning-lab="' + NAME + '"] .cfl-small{font-size:11px;fill:var(--fg-soft)!important}' +
      '[data-learning-lab="' + NAME + '"] .cfl-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .cfl-metric{padding:8px;border-top:2px solid var(--cfl-blue)}[data-learning-lab="' + NAME + '"] .cfl-metric span{display:block;color:var(--fg-soft);font-size:12px}[data-learning-lab="' + NAME + '"] .cfl-metric strong{display:block;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + NAME + '"] table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:6px;border-bottom:1px solid var(--border);text-align:left}' +
      '@media(max-width:760px){[data-learning-lab="' + NAME + '"] .cfl-layout{grid-template-columns:1fr}}@media(max-width:520px){[data-learning-lab="' + NAME + '"] .cfl-choices,[data-learning-lab="' + NAME + '"] .cfl-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select{width:100%}}';
    doc.head.appendChild(style);
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "链接与 ECF：从名字绑定到现场切换" }));
    shell.appendChild(element(doc, "p", { className: "cfl-note", text: "先预测三种符号情境与 fork 次数，揭示后切换解析结果和进程树深度。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { missing: null, duplicate: null, fork: null };
    var groupItems = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { className: "cfl-question", text: prompt }));
      var row = element(doc, "div", { className: "cfl-choices", role: "group", "aria-label": prompt });
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
    question("missing", "没有 foo 定义时的结果？", [["run", "运行时通过"], ["undefined", "undefined reference"], ["duplicate", "multiple definition"]]);
    question("duplicate", "两个强 foo 定义时的结果？", [["ok", "任选一个成功"], ["undefined", "undefined reference"], ["multiple", "multiple definition"]]);
    question("fork", "fork(); fork(); 进程数？", [["2", "2"], ["4", "4"], ["8", "8"]]);
    form.appendChild(fieldset);
    form.appendChild(element(doc, "div", { className: "cfl-actions" }, [element(doc, "button", { type: "submit", className: "cfl-primary", text: "提交预测并揭示" })]));
    var feedback = element(doc, "p", { className: "cfl-feedback", role: "status", "aria-live": "polite", text: "请完成三项预测。" });
    form.appendChild(feedback);
    shell.appendChild(form);

    var revealed = element(doc, "section", { className: "cfl-revealed", hidden: "hidden" });
    var layout = element(doc, "div", { className: "cfl-layout" });
    var controls = element(doc, "div", { className: "cfl-controls" });
    var scenario = element(doc, "select", { "aria-label": "符号情境" });
    Object.keys(SCENARIOS).forEach(function (id) { scenario.appendChild(element(doc, "option", { value: id, text: SCENARIOS[id].label })); });
    var forks = element(doc, "input", { type: "range", min: "0", max: "4", value: "2", step: "1" });
    var forksOutput = element(doc, "output", { text: "2" });
    controls.appendChild(element(doc, "label", { className: "cfl-control" }, ["符号情境 ", scenario]));
    controls.appendChild(element(doc, "div", { className: "cfl-control" }, [element(doc, "label", {}, ["fork 次数 ", forksOutput]), forks]));
    layout.appendChild(controls);
    var stage = element(doc, "div", { className: "cfl-stage" });
    layout.appendChild(stage);
    revealed.appendChild(layout);
    var metrics = element(doc, "div", { className: "cfl-metrics" });
    var linkMetric = element(doc, "div", { className: "cfl-metric" });
    var errorMetric = element(doc, "div", { className: "cfl-metric" });
    var processMetric = element(doc, "div", { className: "cfl-metric" });
    metrics.appendChild(linkMetric);
    metrics.appendChild(errorMetric);
    metrics.appendChild(processMetric);
    revealed.appendChild(metrics);
    var table = element(doc, "table", { "aria-label": "符号解析账本" });
    table.innerHTML = "<thead><tr><th>引用</th><th>目标/错误</th><th>阶段</th></tr></thead><tbody></tbody>";
    revealed.appendChild(table);
    var note = element(doc, "p", { className: "cfl-note" });
    revealed.appendChild(note);
    shell.appendChild(revealed);
    root.appendChild(shell);

    function render() {
      var result = resolve(scenario.value);
      var count = Number(forks.value);
      forksOutput.textContent = String(count);
      stage.replaceChildren(renderSvg(doc, result, count));
      linkMetric.innerHTML = "<span>链接状态</span><strong>" + (result.linked ? "成功" : "失败") + "</strong>";
      errorMetric.innerHTML = "<span>解析错误</span><strong>" + result.errors.length + "</strong>";
      processMetric.innerHTML = "<span>进程数</span><strong>" + processCount(count) + "</strong>";
      table.querySelector("tbody").innerHTML = result.refs.map(function (ref) {
        var binding = result.bindings.filter(function (item) { return item.symbol === ref.symbol; })[0];
        var error = result.errors.filter(function (item) { return item.symbol === ref.symbol; })[0];
        return "<tr><th>" + ref.symbol + "</th><td>" + (error ? error.kind : binding.to) + "</td><td>" + (error ? "解析失败" : "绑定后重定位") + "</td></tr>";
      }).join("");
      note.textContent = result.linked ? "解析成功后还要重定位；fork 复制的是执行状态，exec 才替换程序映像。" : "错误停在符号解析阶段；动态库还可能把同类问题延后到装载或首次调用。";
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.missing || !answers.duplicate || !answers.fork) {
        feedback.textContent = "三项都要先下注。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.missing === "undefined" ? 1 : 0) + (answers.duplicate === "multiple" ? 1 : 0) + (answers.fork === "4" ? 1 : 0);
      feedback.textContent = "预测已记录：" + score + " / 3 命中；现在按阶段检查。";
      render();
    });
    scenario.addEventListener("change", render);
    forks.addEventListener("input", render);
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }
    check(resolve("clean").linked, "clean symbols link");
    check(resolve("missing").errors[0].kind === "undefined reference", "missing symbol error");
    check(resolve("duplicate").errors[0].kind === "multiple definition", "duplicate symbol error");
    check(processCount(2) === 4 && processCount(4) === 16, "fork doubling");
    check(processLevels(3).join(",") === "1,2,4,8", "fork level ledger");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, resolve: resolve, processCount: processCount };
});

(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-pl-01-lambda-types", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-pl-01-lambda-types self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-pl-01-lambda-types self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-pl-01-lambda-types";

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function variable(name) { return { tag: "var", name: name }; }
  function abstraction(name, body) { return { tag: "abs", name: name, body: body }; }
  function application(fn, arg) { return { tag: "app", fn: fn, arg: arg }; }

  function clone(term) {
    if (term.tag === "var") return variable(term.name);
    if (term.tag === "abs") return abstraction(term.name, clone(term.body));
    return application(clone(term.fn), clone(term.arg));
  }

  function freeVariables(term, bound) {
    var scope = bound || Object.create(null);
    if (term.tag === "var") return scope[term.name] ? [] : [term.name];
    if (term.tag === "abs") {
      var next = Object.create(scope);
      next[term.name] = true;
      return freeVariables(term.body, next);
    }
    return freeVariables(term.fn, scope).concat(freeVariables(term.arg, scope)).filter(function (name, index, all) { return all.indexOf(name) === index; });
  }

  function freshName(base, used) {
    var candidate = base;
    var suffix = 0;
    while (used[candidate]) {
      suffix += 1;
      candidate = base + suffix;
    }
    return candidate;
  }

  function renameBound(term, from, to) {
    if (term.tag === "var") return variable(term.name === from ? to : term.name);
    if (term.tag === "abs") {
      if (term.name === from) return abstraction(term.name, term.body);
      return abstraction(term.name, renameBound(term.body, from, to));
    }
    return application(renameBound(term.fn, from, to), renameBound(term.arg, from, to));
  }

  function substitute(term, name, replacement) {
    if (term.tag === "var") return term.name === name ? clone(replacement) : variable(term.name);
    if (term.tag === "app") return application(substitute(term.fn, name, replacement), substitute(term.arg, name, replacement));
    if (term.name === name) return abstraction(term.name, clone(term.body));
    var replacementFree = Object.create(null);
    freeVariables(replacement).forEach(function (item) { replacementFree[item] = true; });
    if (replacementFree[term.name] && freeVariables(term.body).indexOf(name) !== -1) {
      var used = Object.create(null);
      freeVariables(term.body).concat(freeVariables(replacement)).forEach(function (item) { used[item] = true; });
      used[name] = true;
      var fresh = freshName(term.name, used);
      return abstraction(fresh, substitute(renameBound(term.body, term.name, fresh), name, replacement));
    }
    return abstraction(term.name, substitute(term.body, name, replacement));
  }

  function reduceOnce(term) {
    if (term.tag === "app" && term.fn.tag === "abs") return { term: substitute(term.fn.body, term.fn.name, term.arg), changed: true };
    if (term.tag === "app") {
      var left = reduceOnce(term.fn);
      if (left.changed) return { term: application(left.term, term.arg), changed: true };
      var right = reduceOnce(term.arg);
      if (right.changed) return { term: application(term.fn, right.term), changed: true };
      return { term: term, changed: false };
    }
    if (term.tag === "abs") {
      var body = reduceOnce(term.body);
      return body.changed ? { term: abstraction(term.name, body.term), changed: true } : { term: term, changed: false };
    }
    return { term: term, changed: false };
  }

  function normalize(term, limit) {
    var current = clone(term);
    var trace = [current];
    var max = limit || 12;
    for (var step = 0; step < max; step += 1) {
      var next = reduceOnce(current);
      if (!next.changed) break;
      current = next.term;
      trace.push(current);
    }
    return { term: current, trace: trace, normal: !reduceOnce(current).changed };
  }

  function termToString(term) {
    if (term.tag === "var") return term.name;
    if (term.tag === "abs") return "λ" + term.name + "." + termToString(term.body);
    return "(" + termToString(term.fn) + " " + termToString(term.arg) + ")";
  }

  function typeVariable(id) { return { kind: "var", id: id }; }
  function arrow(from, to) { return { kind: "arrow", from: from, to: to }; }

  function dereference(type, substitution) {
    if (type.kind === "var" && substitution[type.id]) {
      substitution[type.id] = dereference(substitution[type.id], substitution);
      return substitution[type.id];
    }
    return type;
  }

  function occurs(id, type, substitution) {
    var current = dereference(type, substitution);
    return current.kind === "var" ? current.id === id : occurs(id, current.from, substitution) || occurs(id, current.to, substitution);
  }

  function unify(left, right, substitution) {
    var a = dereference(left, substitution);
    var b = dereference(right, substitution);
    if (a.kind === "var") {
      if (b.kind === "var" && a.id === b.id) return;
      if (occurs(a.id, b, substitution)) throw new Error("occurs check");
      substitution[a.id] = b;
      return;
    }
    if (b.kind === "var") return unify(b, a, substitution);
    unify(a.from, b.from, substitution);
    unify(a.to, b.to, substitution);
  }

  function infer(term) {
    var counter = 0;
    var substitution = Object.create(null);
    function fresh() { counter += 1; return typeVariable(counter); }
    function visit(node, env) {
      if (node.tag === "var") {
        if (!env[node.name]) env[node.name] = fresh();
        return env[node.name];
      }
      if (node.tag === "abs") {
        var next = Object.create(env);
        var input = fresh();
        next[node.name] = input;
        return arrow(input, visit(node.body, next));
      }
      var fn = visit(node.fn, env);
      var arg = visit(node.arg, env);
      var result = fresh();
      unify(fn, arrow(arg, result), substitution);
      return result;
    }
    var raw = visit(term, Object.create(null));
    return { type: dereference(raw, substitution), substitution: substitution };
  }

  function typeToString(type, substitution, names) {
    var current = dereference(type, substitution || Object.create(null));
    var labels = names || Object.create(null);
    if (current.kind === "var") {
      if (!labels[current.id]) labels[current.id] = "α" + Object.keys(labels).length;
      return labels[current.id];
    }
    var left = typeToString(current.from, substitution, labels);
    var right = typeToString(current.to, substitution, labels);
    return "(" + left + " → " + right + ")";
  }

  function presets() {
    return {
      first: application(application(abstraction("x", abstraction("y", variable("x"))), abstraction("z", variable("z"))), variable("3")),
      twice: abstraction("f", abstraction("x", application(variable("f"), application(variable("f"), variable("x"))))),
      capture: application(abstraction("x", abstraction("y", variable("x"))), variable("y"))
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
      '[data-learning-lab="' + NAME + '"]{--clt-blue:#245a9b;--clt-green:#2d7a4b;--clt-orange:#a86213;--clt-red:#b23a32;display:block;max-width:100%;line-height:1.55;color:var(--fg,currentColor);overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3{margin:0;letter-spacing:0}[data-learning-lab="' + NAME + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + NAME + '"] fieldset{border:0;padding:0;margin:0;min-width:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:7px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,Canvas);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .clt-primary{background:var(--clt-blue);border-color:var(--clt-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .clt-choices,[data-learning-lab="' + NAME + '"] .clt-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .clt-actions{margin-top:11px}' +
      '[data-learning-lab="' + NAME + '"] .clt-feedback{min-height:2em;color:var(--fg-soft);font-size:13px}[data-learning-lab="' + NAME + '"] .clt-revealed[hidden]{display:none}' +
      '[data-learning-lab="' + NAME + '"] .clt-controls{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin-top:14px}[data-learning-lab="' + NAME + '"] .clt-control{display:grid;gap:4px;font-size:13px;font-weight:700}' +
      '[data-learning-lab="' + NAME + '"] table{border-collapse:collapse;width:100%;font-size:12px;margin-top:12px}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:6px 7px;text-align:left;border-bottom:1px solid var(--border);vertical-align:top}[data-learning-lab="' + NAME + '"] .clt-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .clt-metric{padding:7px;border-top:3px solid var(--clt-blue);min-width:0}[data-learning-lab="' + NAME + '"] .clt-metric span{display:block;color:var(--fg-soft);font-size:11px}[data-learning-lab="' + NAME + '"] .clt-metric strong{display:block;overflow-wrap:anywhere}' +
      '@media(max-width:500px){[data-learning-lab="' + NAME + '"] .clt-choices,[data-learning-lab="' + NAME + '"] .clt-actions,[data-learning-lab="' + NAME + '"] .clt-controls{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button{width:100%}[data-learning-lab="' + NAME + '"] .clt-metrics{grid-template-columns:1fr}}';
    doc.head.appendChild(style);
  }

  function mount(root) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var all = presets();
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "β 归约与类型推断：计算和证明的同一棵树" }));
    shell.appendChild(element(doc, "p", { className: "clt-note", text: "先猜结果与类型，再逐步显示 capture-avoiding substitution 和统一约束。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { result: null, type: null };
    var buttons = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { text: prompt }));
      var row = element(doc, "div", { className: "clt-choices", role: "group", "aria-label": prompt });
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
    question("result", "first 函数的归约结果？", [["id", "λz.z"], ["three", "3"]]);
    question("type", "twice 的最一般类型？", [["twice", "(α→α)→α→α"], ["any", "任意字符串"]]);
    form.appendChild(fieldset);
    var feedback = element(doc, "p", { className: "clt-feedback", role: "status", "aria-live": "polite", text: "请完成两项预测。" });
    form.appendChild(feedback);
    form.appendChild(element(doc, "div", { className: "clt-actions" }, [element(doc, "button", { type: "submit", className: "clt-primary", text: "提交预测并揭示" })]));
    shell.appendChild(form);
    var revealed = element(doc, "section", { className: "clt-revealed", hidden: "hidden" });
    var controls = element(doc, "div", { className: "clt-controls" });
    var termSelect = element(doc, "select", { "aria-label": "lambda 预设" });
    [["first", "first：选择第一个参数"], ["twice", "twice：应用两次"], ["capture", "capture：需要 α-renaming"]].forEach(function (option) { termSelect.appendChild(element(doc, "option", { value: option[0], text: option[1] })); });
    var stepSelect = element(doc, "select", { "aria-label": "显示步数" });
    [3, 6, 10, 12].forEach(function (value) { stepSelect.appendChild(element(doc, "option", { value: value, text: "最多 " + value + " 步" })); });
    controls.appendChild(element(doc, "label", { className: "clt-control" }, ["项", termSelect]));
    controls.appendChild(element(doc, "label", { className: "clt-control" }, ["trace 上限", stepSelect]));
    revealed.appendChild(controls);
    var metrics = element(doc, "div", { className: "clt-metrics" });
    var metricTerm = element(doc, "div", { className: "clt-metric" });
    var metricSteps = element(doc, "div", { className: "clt-metric" });
    var metricType = element(doc, "div", { className: "clt-metric" });
    [metricTerm, metricSteps, metricType].forEach(function (node) { metrics.appendChild(node); });
    revealed.appendChild(metrics);
    var table = element(doc, "table", { "aria-label": "beta 归约 trace" });
    table.innerHTML = "<thead><tr><th>步骤</th><th>项</th><th>动作/观察</th></tr></thead><tbody></tbody>";
    revealed.appendChild(table);
    shell.appendChild(revealed);
    root.appendChild(shell);
    function render() {
      var term = all[termSelect.value];
      var result = normalize(term, Number(stepSelect.value));
      var typed = infer(term);
      var typeText = typeToString(typed.type, typed.substitution);
      metricTerm.innerHTML = "<span>当前项</span><strong>" + termToString(result.term) + "</strong>";
      metricSteps.innerHTML = "<span>归约步数</span><strong>" + (result.trace.length - 1) + (result.normal ? "；已到范式" : "；达到上限") + "</strong>";
      metricType.innerHTML = "<span>推断类型</span><strong>" + typeText + "</strong>";
      table.querySelector("tbody").innerHTML = result.trace.map(function (item, index) {
        return "<tr><th>" + index + "</th><td><code>" + termToString(item) + "</code></td><td>" + (index === 0 ? "初始项" : "一次 β 归约（必要时先 α-renaming）") + "</td></tr>";
      }).join("");
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.result || !answers.type) {
        feedback.textContent = "两项都要先下注。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.result === "id" ? 1 : 0) + (answers.type === "twice" ? 1 : 0);
      feedback.textContent = "预测命中 " + score + " / 2；现在换一个项观察类型约束。";
      render();
    });
    termSelect.addEventListener("change", render);
    stepSelect.addEventListener("change", render);
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var all = presets();
    var first = normalize(all.first);
    check(termToString(first.term) === "λz.z", "beta normal form");
    var captured = substitute(abstraction("y", variable("x")), "x", variable("y"));
    check(termToString(captured) === "λy1.y", "capture avoiding alpha rename");
    var inferred = typeToString(infer(all.twice).type, infer(all.twice).substitution);
    check(inferred.indexOf("→") !== -1 && inferred.indexOf("α") !== -1, "function type inference");
    check(first.normal && first.trace.length === 3, "normalization trace length");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, substitute: substitute, normalize: normalize, infer: infer, typeToString: typeToString, termToString: termToString, presets: presets };
});

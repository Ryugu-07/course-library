(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-csapp-01-representation", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-csapp-01-representation self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-csapp-01-representation self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-csapp-01-representation";
  var TYPES = {
    char: { size: 1, align: 1 },
    int: { size: 4, align: 4 }
  };

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function unsigned(value, width) {
    var modulus = Math.pow(2, width);
    return ((Number(value) % modulus) + modulus) % modulus;
  }

  function bits(value, width) {
    var number = unsigned(value, width);
    var output = "";
    for (var index = width - 1; index >= 0; index -= 1) output += ((number >> index) & 1) ? "1" : "0";
    return output;
  }

  function signed(value, width) {
    var number = unsigned(value, width);
    var pivot = Math.pow(2, width - 1);
    return number >= pivot ? number - Math.pow(2, width) : number;
  }

  function add8(left, right) {
    var raw = Number(left) + Number(right);
    var wrapped = unsigned(raw, 8);
    return { left: Number(left), right: Number(right), raw: raw, unsigned: wrapped, signed: signed(wrapped, 8), bits: bits(wrapped, 8), signedOverflow: raw < -128 || raw > 127 };
  }

  function layout(order) {
    var offset = 0;
    var maxAlign = 1;
    var fields = order.map(function (type, index) {
      var info = TYPES[type];
      maxAlign = Math.max(maxAlign, info.align);
      var alignedOffset = Math.ceil(offset / info.align) * info.align;
      var field = { index: index, type: type, offset: alignedOffset, size: info.size, paddingBefore: alignedOffset - offset };
      offset = alignedOffset + info.size;
      return field;
    });
    var size = Math.ceil(offset / maxAlign) * maxAlign;
    return { fields: fields, size: size, alignment: maxAlign };
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

  function renderBits(doc, result) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 560 220", role: "img", "aria-label": "八位补码加法位模式" });
    [["A", bits(result.left, 8), "var(--crp-blue)"], ["B", bits(result.right, 8), "var(--crp-gold)"], ["S", result.bits, "var(--crp-green)"]].forEach(function (row, rowIndex) {
      svg.appendChild(svgElement(doc, "text", { x: 12, y: 48 + rowIndex * 52, class: "crp-label" }, row[0]));
      row[1].split("").forEach(function (bit, index) {
        var x = 52 + index * 56;
        svg.appendChild(svgElement(doc, "rect", { x: x, y: 25 + rowIndex * 52, width: 42, height: 32, rx: 4, fill: row[2] }));
        svg.appendChild(svgElement(doc, "text", { x: x + 21, y: 47 + rowIndex * 52, class: "crp-bit", fill: "#fff" }, bit));
      });
    });
    svg.appendChild(svgElement(doc, "text", { x: 12, y: 195, class: "crp-small" }, "A + B = " + result.raw + "；8 位模式按模 256 保留，补码读数为 " + result.signed));
    return svg;
  }

  function installStyles(doc) {
    var styleId = "cl-" + NAME + "-styles";
    if (doc.getElementById(styleId)) return;
    var style = doc.createElement("style");
    style.id = styleId;
    style.textContent =
      '[data-learning-lab="' + NAME + '"]{--crp-blue:#315f9d;--crp-gold:#a36a16;--crp-green:#39734d;--crp-red:#b64335;display:block;max-width:100%;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3,[data-learning-lab="' + NAME + '"] h4{margin:0;letter-spacing:0}' +
      '[data-learning-lab="' + NAME + '"] p{margin:8px 0}[data-learning-lab="' + NAME + '"] fieldset{border:0;min-width:0;margin:0;padding:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:8px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,transparent);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:hover,[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{border-color:var(--accent);outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .crp-primary{background:var(--crp-blue);border-color:var(--crp-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .crp-choices,[data-learning-lab="' + NAME + '"] .crp-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .crp-actions{margin-top:12px}' +
      '[data-learning-lab="' + NAME + '"] .crp-feedback,[data-learning-lab="' + NAME + '"] .crp-note{min-height:2em;color:var(--fg-soft);font-size:13px}' +
      '[data-learning-lab="' + NAME + '"] .crp-revealed[hidden]{display:none}[data-learning-lab="' + NAME + '"] .crp-layout{display:grid;grid-template-columns:minmax(190px,.55fr) minmax(0,1.45fr);gap:16px;align-items:start;margin-top:16px}' +
      '[data-learning-lab="' + NAME + '"] .crp-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border);border-radius:7px}[data-learning-lab="' + NAME + '"] .crp-control{display:grid;gap:5px}[data-learning-lab="' + NAME + '"] .crp-control label{font-size:13px;font-weight:700;color:var(--fg-soft)}[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--crp-blue)}' +
      '[data-learning-lab="' + NAME + '"] .crp-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;overflow:hidden}[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto}[data-learning-lab="' + NAME + '"] .crp-label{font-size:15px;font-weight:750}[data-learning-lab="' + NAME + '"] .crp-bit{font-size:19px;font-weight:800;text-anchor:middle}[data-learning-lab="' + NAME + '"] .crp-small{font-size:11px;fill:var(--fg-soft)!important}' +
      '[data-learning-lab="' + NAME + '"] .crp-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .crp-metric{padding:8px;border-top:2px solid var(--crp-blue)}[data-learning-lab="' + NAME + '"] .crp-metric span{display:block;color:var(--fg-soft);font-size:12px}[data-learning-lab="' + NAME + '"] .crp-metric strong{display:block;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + NAME + '"] table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:6px;border-bottom:1px solid var(--border);text-align:left}' +
      '@media(max-width:760px){[data-learning-lab="' + NAME + '"] .crp-layout{grid-template-columns:1fr}}@media(max-width:520px){[data-learning-lab="' + NAME + '"] .crp-choices,[data-learning-lab="' + NAME + '"] .crp-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select{width:100%}}';
    doc.head.appendChild(style);
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "位模式账本：解释协议决定数值" }));
    shell.appendChild(element(doc, "p", { className: "crp-note", text: "先预测 8 位加法与对齐布局，揭示后改变操作数并比较两种字段顺序。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { overflow: null, layout: null };
    var groupItems = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { className: "crp-question", text: prompt }));
      var row = element(doc, "div", { className: "crp-choices", role: "group", "aria-label": prompt });
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
    question("overflow", "8 位补码 127 + 1 的读数？", [["minus", "-128"], ["plus", "128"], ["zero", "0"]]);
    question("layout", "char,int,char 在 4 字节对齐下大小？", [["8", "8 字节"], ["12", "12 字节"], ["9", "9 字节"]]);
    form.appendChild(fieldset);
    form.appendChild(element(doc, "div", { className: "crp-actions" }, [element(doc, "button", { type: "submit", className: "crp-primary", text: "提交预测并揭示" })]));
    var feedback = element(doc, "p", { className: "crp-feedback", role: "status", "aria-live": "polite", text: "请完成两项预测。" });
    form.appendChild(feedback);
    shell.appendChild(form);

    var revealed = element(doc, "section", { className: "crp-revealed", hidden: "hidden" });
    var layoutShell = element(doc, "div", { className: "crp-layout" });
    var controls = element(doc, "div", { className: "crp-controls" });
    var aInput = element(doc, "input", { type: "range", min: "-128", max: "127", value: "127", step: "1" });
    var bInput = element(doc, "input", { type: "range", min: "-128", max: "127", value: "1", step: "1" });
    var aOutput = element(doc, "output", { text: "127" });
    var bOutput = element(doc, "output", { text: "1" });
    var order = element(doc, "select", { "aria-label": "结构体字段顺序" });
    order.appendChild(element(doc, "option", { value: "char,int,char", text: "char, int, char" }));
    order.appendChild(element(doc, "option", { value: "int,char,char", text: "int, char, char" }));
    controls.appendChild(element(doc, "div", { className: "crp-control" }, [element(doc, "label", {}, ["A = ", aOutput]), aInput]));
    controls.appendChild(element(doc, "div", { className: "crp-control" }, [element(doc, "label", {}, ["B = ", bOutput]), bInput]));
    controls.appendChild(element(doc, "label", { className: "crp-control" }, ["字段顺序 ", order]));
    layoutShell.appendChild(controls);
    var stage = element(doc, "div", { className: "crp-stage" });
    layoutShell.appendChild(stage);
    revealed.appendChild(layoutShell);
    var metrics = element(doc, "div", { className: "crp-metrics" });
    var sumMetric = element(doc, "div", { className: "crp-metric" });
    var modeMetric = element(doc, "div", { className: "crp-metric" });
    var structMetric = element(doc, "div", { className: "crp-metric" });
    metrics.appendChild(sumMetric);
    metrics.appendChild(modeMetric);
    metrics.appendChild(structMetric);
    revealed.appendChild(metrics);
    var table = element(doc, "table", { "aria-label": "机器级表示账本" });
    table.innerHTML = "<thead><tr><th>对象</th><th>位/偏移</th><th>解释</th></tr></thead><tbody></tbody>";
    revealed.appendChild(table);
    var note = element(doc, "p", { className: "crp-note" });
    revealed.appendChild(note);
    shell.appendChild(revealed);
    root.appendChild(shell);

    function render() {
      var result = add8(Number(aInput.value), Number(bInput.value));
      var fields = layout(order.value.split(","));
      aOutput.textContent = aInput.value;
      bOutput.textContent = bInput.value;
      stage.replaceChildren(renderBits(doc, result));
      sumMetric.innerHTML = "<span>原始和</span><strong>" + result.raw + "</strong>";
      modeMetric.innerHTML = "<span>8 位读数</span><strong>u=" + result.unsigned + "；s=" + result.signed + "</strong>";
      structMetric.innerHTML = "<span>结构体大小</span><strong>" + fields.size + " 字节</strong>";
      table.querySelector("tbody").innerHTML =
        "<tr><th>A + B</th><td>" + result.bits + "</td><td>" + (result.signedOverflow ? "补码范围溢出风险" : "落在 -128..127") + "</td></tr>" +
        "<tr><th>字段偏移</th><td>" + fields.fields.map(function (field) { return field.type + "@" + field.offset; }).join(", ") + "</td><td>对齐 " + fields.alignment + " 字节</td></tr>" +
        "<tr><th>尾部</th><td>" + (fields.size - (fields.fields[fields.fields.length - 1].offset + fields.fields[fields.fields.length - 1].size)) + " 字节</td><td>结构体总大小取最大对齐倍数</td></tr>";
      note.textContent = "同一模式可按 unsigned 或 two's complement 解释；C 的有符号溢出不能自动当作模 256 运算。";
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.overflow || !answers.layout) {
        feedback.textContent = "两项都要先下注。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.overflow === "minus" ? 1 : 0) + (answers.layout === "12" ? 1 : 0);
      feedback.textContent = "预测已记录：" + score + " / 2 命中；现在查看位模式和 padding。";
      render();
    });
    aInput.addEventListener("input", render);
    bInput.addEventListener("input", render);
    order.addEventListener("change", render);
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }
    var result = add8(127, 1);
    check(result.bits === "10000000" && result.signed === -128 && result.unsigned === 128, "127 plus 1 representation");
    check(add8(250, 10).unsigned === 4, "unsigned wraparound");
    check(signed(255, 8) === -1 && bits(-1, 8) === "11111111", "negative complement encoding");
    var padded = layout(["char", "int", "char"]);
    var compact = layout(["int", "char", "char"]);
    check(padded.size === 12 && padded.fields[1].offset === 4 && padded.fields[1].paddingBefore === 3 && padded.fields[2].paddingBefore === 0, "padded struct layout");
    check(compact.size === 8 && compact.fields[1].offset === 4, "reordered struct layout");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, add8: add8, layout: layout };
});

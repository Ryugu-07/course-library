(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }

  if (
    root &&
    root.CourseLearning &&
    typeof root.CourseLearning.register === "function"
  ) {
    root.CourseLearning.register("source-coding", exported.mount);
  }

  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log(
        "source-coding self-test: PASS (" +
          report.checks +
          " checks, " +
          report.presets +
          " presets)"
      );
    } catch (error) {
      console.error("source-coding self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-source-coding-styles";
  var SYMBOLS = ["A", "B", "C", "D"];
  var DEFAULT_PROBABILITIES = [0.4, 0.3, 0.2, 0.1];
  var EPS = 1e-10;

  var STYLE_TEXT = [
    ".cl-source-lab{--sc-blue:#315f9d;--sc-gold:#9b6a12;--sc-green:#39734d;--sc-red:#b64335;max-width:100%;min-width:0;color:var(--fg);line-height:1.55;}",
    ".cl-source-lab *,.cl-source-lab *::before,.cl-source-lab *::after{box-sizing:border-box;}",
    ".cl-source-lab [hidden]{display:none!important;}",
    ".cl-source-lab h2,.cl-source-lab h3{margin:0;color:var(--fg);}",
    ".cl-source-lab h2{font-size:1.25rem;}.cl-source-lab h3{font-size:1.05rem;}",
    ".cl-source-lab p{overflow-wrap:anywhere;}",
    ".cl-source-lab .sc-note,.cl-source-lab .sc-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65;}",
    ".cl-source-lab .sc-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--sc-gold);background:var(--bg);}",
    ".cl-source-lab fieldset{min-width:0;margin:0;padding:0;border:0;}",
    ".cl-source-lab legend{margin-bottom:8px;color:var(--fg-soft);font-size:13px;font-weight:750;}",
    ".cl-source-lab .sc-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}",
    ".cl-source-lab button,.cl-source-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}",
    ".cl-source-lab select{width:100%;}.cl-source-lab button:hover{border-color:var(--accent);}",
    ".cl-source-lab button[aria-pressed=true],.cl-source-lab button.sc-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:700;}",
    ".cl-source-lab button:focus-visible,.cl-source-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
    ".cl-source-lab .sc-controls{display:grid;grid-template-columns:minmax(150px,.5fr) minmax(0,1.5fr);gap:14px;align-items:start;}",
    ".cl-source-lab .sc-field{display:grid;gap:6px;min-width:0;}.cl-source-lab .sc-field label{color:var(--fg-soft);font-size:13px;font-weight:700;}",
    ".cl-source-lab .sc-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}.cl-source-lab .sc-actions>*{flex:1 1 150px;}",
    ".cl-source-lab .sc-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}.cl-source-lab .sc-pass{color:var(--sc-green);}.cl-source-lab .sc-warn{color:var(--sc-red);}",
    ".cl-source-lab .sc-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}",
    ".cl-source-lab .sc-layout{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(240px,.9fr);gap:16px;align-items:start;}",
    ".cl-source-lab .sc-stage{min-width:0;padding:9px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}",
    ".cl-source-lab .sc-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg);}",
    ".cl-source-lab .sc-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}",
    ".cl-source-lab .sc-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.72;}.cl-source-lab .sc-axis{stroke:currentColor;stroke-width:1.2;stroke-opacity:.7;}",
    ".cl-source-lab .sc-bar-h{fill:var(--sc-gold);}.cl-source-lab .sc-bar-fixed{fill:var(--sc-red);}.cl-source-lab .sc-bar-one{fill:var(--sc-blue);}.cl-source-lab .sc-bar-group{fill:var(--sc-green);}",
    ".cl-source-lab .sc-ledger{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;}.cl-source-lab table{width:100%;min-width:620px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}",
    ".cl-source-lab th,.cl-source-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere;}.cl-source-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750;}",
    ".cl-source-lab .sc-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0;}.cl-source-lab .sc-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}",
    ".cl-source-lab .sc-metric:nth-child(1){border-top-color:var(--sc-gold);}.cl-source-lab .sc-metric:nth-child(2){border-top-color:var(--sc-blue);}.cl-source-lab .sc-metric:nth-child(3){border-top-color:var(--sc-green);}.cl-source-lab .sc-metric:nth-child(4){border-top-color:var(--sc-red);}",
    ".cl-source-lab .sc-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4;}.cl-source-lab .sc-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
    ".cl-source-lab .sc-callout{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--sc-green);background:var(--bg);font-size:13px;line-height:1.7;overflow-wrap:anywhere;}",
    ".cl-source-lab .sc-formula{max-width:100%;overflow-x:auto;padding:9px 11px;border-left:3px solid var(--accent);background:var(--bg);font-family:\"SF Mono\",Menlo,Consolas,monospace;font-size:12px;line-height:1.65;}",
    "@media(max-width:780px){.cl-source-lab .sc-layout{grid-template-columns:minmax(0,1fr);}.cl-source-lab .sc-controls{grid-template-columns:minmax(0,1fr);}}",
    "@media(max-width:600px){.cl-source-lab .sc-choice-row{grid-template-columns:minmax(0,1fr);}.cl-source-lab .sc-stage{padding:6px;}.cl-source-lab table{font-size:11.5px;}.cl-source-lab th,.cl-source-lab td{padding-left:5px;padding-right:5px;}}",
    "@media(prefers-reduced-motion:reduce){.cl-source-lab *{animation:none!important;transition:none!important;}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || EPS) * scale;
  }

  function validateDistribution(probabilities) {
    if (!Array.isArray(probabilities) || probabilities.length < 2) {
      throw new TypeError("probabilities must contain at least two entries");
    }
    var total = 0;
    var positive = 0;
    probabilities.forEach(function (probability) {
      if (!finite(probability) || probability < 0) {
        throw new RangeError("probabilities must be finite and non-negative");
      }
      total += probability;
      if (probability > 0) positive += 1;
    });
    if (!near(total, 1, 1e-9) || positive === 0) {
      throw new RangeError("probabilities must sum to one");
    }
    return probabilities.slice();
  }

  function log2(value) {
    return Math.log(value) / Math.LN2;
  }

  function entropy(probabilities) {
    var values = validateDistribution(probabilities);
    return values.reduce(function (total, probability) {
      return total + (probability === 0 ? 0 : -probability * log2(probability));
    }, 0);
  }

  function validateSymbols(symbols, length) {
    var values = symbols || SYMBOLS.slice(0, length);
    if (!Array.isArray(values) || values.length !== length) {
      throw new RangeError("symbols must match the probability vector");
    }
    var seen = Object.create(null);
    values.forEach(function (symbol) {
      if (typeof symbol !== "string" || !symbol || seen[symbol]) {
        throw new RangeError("symbols must be non-empty and unique");
      }
      seen[symbol] = true;
    });
    return values.slice();
  }

  function huffmanCodes(probabilities, symbols) {
    var values = validateDistribution(probabilities);
    var names = validateSymbols(symbols, values.length);
    var nodes = values.map(function (probability, index) {
      return {
        weight: probability,
        order: index,
        symbolIndex: index,
        left: null,
        right: null
      };
    });

    while (nodes.length > 1) {
      nodes.sort(function (left, right) {
        return left.weight - right.weight || left.order - right.order;
      });
      var left = nodes.shift();
      var right = nodes.shift();
      if (right.order < left.order) {
        var childSwap = left;
        left = right;
        right = childSwap;
      }
      nodes.push({
        weight: left.weight + right.weight,
        order: Math.min(left.order, right.order),
        symbolIndex: null,
        left: left,
        right: right
      });
    }

    var result = Object.create(null);
    function visit(node, prefix) {
      if (node.symbolIndex !== null) {
        result[names[node.symbolIndex]] = prefix || "0";
        return;
      }
      visit(node.left, prefix + "0");
      visit(node.right, prefix + "1");
    }
    visit(nodes[0], "");
    return result;
  }

  function codeValues(codes) {
    if (!codes || typeof codes !== "object") {
      throw new TypeError("codes must be an object or array");
    }
    var values = Array.isArray(codes) ? codes : Object.keys(codes).map(function (key) {
      return codes[key];
    });
    values.forEach(function (code) {
      if (typeof code !== "string" || !/^[01]+$/.test(code)) {
        throw new RangeError("codes must be non-empty binary strings");
      }
    });
    return values;
  }

  function kraftSum(codes) {
    return codeValues(codes).reduce(function (total, code) {
      return total + Math.pow(2, -code.length);
    }, 0);
  }

  function averageLength(probabilities, codes, symbols) {
    var values = validateDistribution(probabilities);
    var names = validateSymbols(symbols, values.length);
    return values.reduce(function (total, probability, index) {
      var code = codes[names[index]];
      if (typeof code !== "string") throw new RangeError("missing codeword");
      return total + probability * code.length;
    }, 0);
  }

  function fixedLengthCodes(length, symbols) {
    var names = validateSymbols(symbols, length);
    var bits = Math.ceil(log2(length));
    var result = Object.create(null);
    names.forEach(function (name, index) {
      var code = index.toString(2);
      while (code.length < bits) code = "0" + code;
      result[name] = code;
    });
    return result;
  }

  function blockDistribution(probabilities, blockSize, symbols) {
    var values = validateDistribution(probabilities);
    if (!Number.isInteger(blockSize) || blockSize < 1 || blockSize > 3) {
      throw new RangeError("blockSize must be an integer in [1, 3]");
    }
    var names = validateSymbols(symbols, values.length);
    var count = Math.pow(values.length, blockSize);
    var blocks = [];
    var probabilitiesByBlock = [];
    var index;
    for (index = 0; index < count; index += 1) {
      var remainder = index;
      var digits = [];
      var probability = 1;
      var position;
      for (position = 0; position < blockSize; position += 1) {
        var digit = remainder % values.length;
        remainder = Math.floor(remainder / values.length);
        digits.unshift(digit);
      }
      digits.forEach(function (digit) {
        probability *= values[digit];
      });
      blocks.push(digits.map(function (digit) { return names[digit]; }).join(""));
      probabilitiesByBlock.push(probability);
    }
    return { symbols: blocks, probabilities: probabilitiesByBlock };
  }

  function summarize(probabilities, blockSize) {
    var values = validateDistribution(probabilities);
    var names = validateSymbols(null, values.length);
    var oneCodes = huffmanCodes(values, names);
    var fixedCodes = fixedLengthCodes(values.length, names);
    var block = blockDistribution(values, blockSize, names);
    var blockCodes = huffmanCodes(block.probabilities, block.symbols);
    var fixedBits = Math.ceil(log2(values.length));
    var oneLength = averageLength(values, oneCodes, names);
    var blockLength = averageLength(block.probabilities, blockCodes, block.symbols);
    return {
      symbols: names,
      probabilities: values,
      entropy: entropy(values),
      huffman: {
        codes: oneCodes,
        kraft: kraftSum(oneCodes),
        averageLength: oneLength
      },
      fixed: {
        codes: fixedCodes,
        kraft: kraftSum(fixedCodes),
        bitsPerSymbol: fixedBits
      },
      block: {
        blockSize: blockSize,
        symbols: block.symbols,
        probabilities: block.probabilities,
        codes: blockCodes,
        kraft: kraftSum(blockCodes),
        averageBitsPerBlock: blockLength,
        averageBitsPerSymbol: blockLength / blockSize
      }
    };
  }

  function comparison(summary) {
    return [
      { id: "fixed", label: "定长码", value: summary.fixed.bitsPerSymbol },
      { id: "one", label: "一符号 Huffman", value: summary.huffman.averageLength },
      { id: "group", label: "分组 Huffman（g=" + summary.block.blockSize + "）", value: summary.block.averageBitsPerSymbol }
    ];
  }

  function bestMode(summary) {
    return comparison(summary).reduce(function (best, item) {
      return item.value < best.value - EPS ? item : best;
    }, comparison(summary)[0]).id;
  }

  function formatValue(value, digits) {
    if (!finite(value)) return "-";
    var places = digits === undefined ? 4 : digits;
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function makeTable(api, headers, rows, label) {
    var table = api.el("table", { "aria-label": label });
    var head = api.el("thead");
    var headRow = api.el("tr");
    headers.forEach(function (header) {
      headRow.appendChild(api.el("th", { scope: "col" }, header));
    });
    head.appendChild(headRow);
    table.appendChild(head);
    var body = api.el("tbody");
    rows.forEach(function (row) {
      var tableRow = api.el("tr");
      row.forEach(function (cell, index) {
        tableRow.appendChild(api.el(index === 0 ? "th" : "td", index === 0 ? { scope: "row" } : {}, cell));
      });
      body.appendChild(tableRow);
    });
    table.appendChild(body);
    return table;
  }

  function chart(api, summary) {
    var svg = api.svg("svg", {
      className: "sc-svg",
      viewBox: "0 0 760 330",
      role: "img",
      "aria-labelledby": "sc-chart-title sc-chart-desc"
    });
    svg.appendChild(api.svg("title", { id: "sc-chart-title" }, "熵与平均码长比较"));
    svg.appendChild(api.svg("desc", { id: "sc-chart-desc" }, "比较熵、定长码、一符号 Huffman 和分组 Huffman 的每符号平均比特数。"));
    var values = [
      { label: "H", value: summary.entropy, className: "sc-bar-h" },
      { label: "定长", value: summary.fixed.bitsPerSymbol, className: "sc-bar-fixed" },
      { label: "一符号", value: summary.huffman.averageLength, className: "sc-bar-one" },
      { label: "分组", value: summary.block.averageBitsPerSymbol, className: "sc-bar-group" }
    ];
    var maxValue = Math.max(summary.entropy + 0.35, summary.fixed.bitsPerSymbol + 0.2, summary.block.averageBitsPerSymbol + 0.2);
    var left = 62;
    var top = 34;
    var plotHeight = 232;
    var plotWidth = 640;
    var bottom = top + plotHeight;
    var scaleY = function (value) { return bottom - (value / maxValue) * plotHeight; };
    [0, 1, 2].forEach(function (tick) {
      var y = scaleY(tick);
      svg.appendChild(api.svg("line", { x1: left, y1: y, x2: left + plotWidth, y2: y, className: "sc-grid" }));
      svg.appendChild(api.svg("text", { x: left - 9, y: y + 4, "text-anchor": "end", "font-size": "11" }, String(tick)));
    });
    svg.appendChild(api.svg("line", { x1: left, y1: top, x2: left, y2: bottom, className: "sc-axis" }));
    svg.appendChild(api.svg("line", { x1: left, y1: bottom, x2: left + plotWidth, y2: bottom, className: "sc-axis" }));
    var barWidth = 94;
    var gap = 58;
    values.forEach(function (item, index) {
      var x = left + 48 + index * (barWidth + gap);
      var y = scaleY(item.value);
      svg.appendChild(api.svg("rect", { x: x, y: y, width: barWidth, height: bottom - y, className: item.className }));
      svg.appendChild(api.svg("text", { x: x + barWidth / 2, y: y - 8, "text-anchor": "middle", "font-size": "12", "font-weight": "700" }, formatValue(item.value, 3)));
      svg.appendChild(api.svg("text", { x: x + barWidth / 2, y: bottom + 24, "text-anchor": "middle", "font-size": "12" }, item.label));
    });
    svg.appendChild(api.svg("text", { x: left + plotWidth, y: 18, "text-anchor": "end", "font-size": "12" }, "bits / source symbol"));
    return svg;
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument || !api || typeof api.el !== "function" || typeof api.svg !== "function") return;
    var doc = root.ownerDocument;
    installStyles(doc);
    var state = { blockSize: 2, prediction: null, revealed: false };
    var shell = api.el("section", { className: "cl-source-lab", "aria-labelledby": "sc-title" });
    shell.appendChild(api.el("h2", { id: "sc-title" }, "信源编码台：先猜平均码长，再看 Kraft 账"));
    shell.appendChild(api.el("p", { className: "sc-note" }, "固定分布 P=(0.4,0.3,0.2,0.1)。先判断哪种编码的每符号平均长度最低，核对后再打开确定性 Huffman 树、分组账本和反例。"));

    var controls = api.el("div", { className: "sc-controls" });
    var field = api.el("div", { className: "sc-field" });
    var groupLabel = api.el("label", { htmlFor: "sc-block-size" }, "分组长度 g");
    var groupSelect = api.el("select", { id: "sc-block-size", "aria-label": "Huffman 分组长度" });
    [2, 3].forEach(function (size) {
      groupSelect.appendChild(api.el("option", { value: String(size) }, String(size) + " 个源符号"));
    });
    field.appendChild(groupLabel);
    field.appendChild(groupSelect);
    controls.appendChild(field);

    var prediction = api.el("div", { className: "sc-prompt" });
    var predictionTitle = api.el("strong", {}, "先预测：当前分组长度下，哪一档每符号平均码长最低？");
    var choices = api.el("div", { className: "sc-choice-row", role: "group", "aria-label": "平均码长预测" });
    var choiceButtons = {};
    [
      ["fixed", "定长码"],
      ["one", "一符号 Huffman"],
      ["group", "分组 Huffman"]
    ].forEach(function (item) {
      var button = api.el("button", { type: "button", "data-choice": item[0] }, item[1]);
      button.addEventListener("click", function () {
        state.prediction = item[0];
        renderPrediction();
      });
      choices.appendChild(button);
      choiceButtons[item[0]] = button;
    });
    prediction.appendChild(predictionTitle);
    prediction.appendChild(choices);
    var actions = api.el("div", { className: "sc-actions" });
    var check = api.el("button", { type: "button", className: "sc-primary" }, "核对预测");
    var reset = api.el("button", { type: "button" }, "重置");
    var feedback = api.el("p", { className: "sc-feedback" }, "先选一个预测。");
    actions.appendChild(check);
    actions.appendChild(reset);
    prediction.appendChild(actions);
    prediction.appendChild(feedback);
    controls.appendChild(prediction);
    shell.appendChild(controls);

    var revealed = api.el("section", { className: "sc-revealed", hidden: true, "aria-live": "polite" });
    shell.appendChild(revealed);
    root.replaceChildren(shell);

    function currentSummary() {
      return summarize(DEFAULT_PROBABILITIES, state.blockSize);
    }

    function renderPrediction() {
      Object.keys(choiceButtons).forEach(function (key) {
        choiceButtons[key].setAttribute("aria-pressed", state.prediction === key ? "true" : "false");
      });
    }

    function renderResults(summary) {
      revealed.replaceChildren();
      var comparisonRows = comparison(summary).map(function (item) {
        return [item.label, formatValue(item.value, 6), item.id === bestMode(summary) ? "当前最低" : ""];
      });
      var codeRows = summary.symbols.map(function (symbol, index) {
        var code = summary.huffman.codes[symbol];
        var ideal = -log2(summary.probabilities[index]);
        return [symbol, formatValue(summary.probabilities[index], 2), code, String(code.length), formatValue(ideal, 3)];
      });
      var metrics = api.el("div", { className: "sc-metrics" });
      [
        ["熵 H", formatValue(summary.entropy, 6) + " bit"],
        ["Kraft（单符号）", formatValue(summary.huffman.kraft, 6)],
        ["一符号平均 L", formatValue(summary.huffman.averageLength, 6) + " bit"],
        ["H+1", formatValue(summary.entropy + 1, 6) + " bit"]
      ].forEach(function (item) {
        var metric = api.el("div", { className: "sc-metric" });
        metric.appendChild(api.el("span", {}, item[0]));
        metric.appendChild(api.el("strong", {}, item[1]));
        metrics.appendChild(metric);
      });
      revealed.appendChild(api.el("h3", {}, "透明账本"));
      revealed.appendChild(metrics);
      revealed.appendChild(api.el("p", { className: "sc-formula" }, "H=" + formatValue(summary.entropy, 6) + "; H≤L=" + formatValue(summary.huffman.averageLength, 6) + "<H+1=" + formatValue(summary.entropy + 1, 6) + "; Kraft=" + formatValue(summary.huffman.kraft, 6)));
      var layout = api.el("div", { className: "sc-layout" });
      var codeLedger = api.el("div", { className: "sc-ledger" });
      codeLedger.appendChild(api.el("h3", {}, "确定性 Huffman（一个源符号）"));
      codeLedger.appendChild(makeTable(api, ["符号", "P", "码字", "长度", "理想长度 −log₂P"], codeRows, "确定性 Huffman 码表"));
      codeLedger.appendChild(api.el("h3", {}, "每符号平均长度比较"));
      codeLedger.appendChild(makeTable(api, ["方案", "bits / source symbol", "读法"], comparisonRows, "编码方案平均长度比较"));
      codeLedger.appendChild(api.el("p", { className: "sc-note" }, "分组 Huffman 先对独立的 " + state.blockSize + "-符号块编码，再把块平均到一个源符号；它利用了块级整数码长来逼近熵。"));
      layout.appendChild(codeLedger);
      var stage = api.el("div", { className: "sc-stage" });
      stage.appendChild(chart(api, summary));
      layout.appendChild(stage);
      revealed.appendChild(layout);
      revealed.appendChild(api.el("div", { className: "sc-callout" }, "反例：A 的单符号码长是 1 bit，D 是 3 bit，而 H≈" + formatValue(summary.entropy, 3) + "；熵是长序列的平均极限，不是每条消息的整数长度，也不是“每条消息都能无损压到 H bit”的承诺。迁移：把四符号块换成实际字符流时，先检查独立同分布假设；若符号有上下文，模型和码表也必须随之改变。"));
    }

    function render() {
      state.blockSize = Number(groupSelect.value);
      var summary = currentSummary();
      var answer = bestMode(summary);
      groupSelect.value = String(state.blockSize);
      choiceButtons.group.textContent = "分组 Huffman（g=" + state.blockSize + "）";
      renderPrediction();
      if (!state.revealed) {
        revealed.hidden = true;
        feedback.className = "sc-feedback";
        feedback.textContent = state.prediction ? "预测已记录，点击“核对预测”查看账本。" : "先选一个预测。";
        return;
      }
      revealed.hidden = false;
      var correct = state.prediction === answer;
      feedback.className = "sc-feedback " + (correct ? "sc-pass" : "sc-warn");
      feedback.textContent = (correct ? "预测命中。" : "预测未命中。") + " 当前最低的是“" + comparison(summary).filter(function (item) { return item.id === answer; })[0].label + "”。";
      renderResults(summary);
      if (api.announce) api.announce(root, feedback.textContent);
    }

    groupSelect.addEventListener("change", function () {
      state.blockSize = Number(groupSelect.value);
      state.prediction = null;
      state.revealed = false;
      render();
    });
    check.addEventListener("click", function () {
      if (!state.prediction) {
        feedback.className = "sc-feedback sc-warn";
        feedback.textContent = "请先作出预测。";
        return;
      }
      state.revealed = true;
      render();
    });
    reset.addEventListener("click", function () {
      state.blockSize = 2;
      state.prediction = null;
      state.revealed = false;
      groupSelect.value = "2";
      render();
    });
    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    function assertThrows(fn, message) {
      var threw = false;
      try { fn(); } catch (error) { threw = true; }
      assert(threw, message);
    }
    var summary = summarize(DEFAULT_PROBABILITIES, 2);
    assert(near(summary.entropy, 1.8464393446710154, 1e-12), "entropy value");
    assert(summary.huffman.codes.A === "0", "deterministic A code");
    assert(summary.huffman.codes.B === "10", "deterministic B code");
    assert(summary.huffman.codes.C === "110", "deterministic C code");
    assert(summary.huffman.codes.D === "111", "deterministic D code");
    assert(near(summary.huffman.kraft, 1, 1e-12), "Kraft equality");
    assert(near(summary.huffman.averageLength, 1.9, 1e-12), "average Huffman length");
    assert(summary.entropy <= summary.huffman.averageLength + EPS, "entropy lower bound");
    assert(summary.huffman.averageLength < summary.entropy + 1 - EPS, "Huffman upper bound");
    assert(near(summary.fixed.bitsPerSymbol, 2, 1e-12), "fixed length");
    assert(summary.block.averageBitsPerSymbol < summary.huffman.averageLength, "block coding improves default");
    assert(near(entropy([1, 0]), 0, 1e-12), "entropy endpoint zero");
    assert(near(entropy([0.5, 0.5]), 1, 1e-12), "entropy endpoint maximum");
    assertThrows(function () { entropy([0.5, 0.6]); }, "reject non-normalized distribution");
    assertThrows(function () { entropy([0.5, -0.5, 1]); }, "reject negative probability");
    assertThrows(function () { huffmanCodes([0.5, 0.5], ["A", "A"]); }, "reject duplicate symbols");
    assertThrows(function () { blockDistribution(DEFAULT_PROBABILITIES, 4); }, "reject oversized block");
    assert(bestMode(summary) === "group", "prediction answer is block coding");
    return { checks: checks, presets: 2 };
  }

  return {
    SYMBOLS: SYMBOLS.slice(),
    DEFAULT_PROBABILITIES: DEFAULT_PROBABILITIES.slice(),
    entropy: entropy,
    huffmanCodes: huffmanCodes,
    kraftSum: kraftSum,
    averageLength: averageLength,
    fixedLengthCodes: fixedLengthCodes,
    blockDistribution: blockDistribution,
    summarize: summarize,
    comparison: comparison,
    bestMode: bestMode,
    mount: mount,
    selfTest: selfTest
  };
});

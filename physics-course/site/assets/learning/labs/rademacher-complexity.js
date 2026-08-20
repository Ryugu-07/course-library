(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("rademacher-complexity", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("rademacher-complexity self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("rademacher-complexity self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : this,
  function (host) {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "rademacher-complexity-lab-styles";
    var INSTANCE = 0;
    var EPS = 1e-12;

    function bits(mask, length) {
      var output = [];
      var index;
      for (index = 0; index < length; index += 1) output.push((mask >> index) & 1);
      return output;
    }

    function targetAt(x) {
      return [0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1][x];
    }

    function referenceBit(mask, x) {
      var value = (mask >> (x % 6)) & 1;
      if (x >= 6 && ((mask + 2 * x) % 5 === 0)) value = 1 - value;
      return value;
    }

    function makeFunction(mask, index, length) {
      var sample = bits(mask, length);
      var population = [];
      var x;
      for (x = 0; x < 12; x += 1) population.push(referenceBit(mask, x));
      return {
        id: "h" + index,
        label: "h" + index + "（mask=" + mask + "）",
        sample: sample,
        population: population
      };
    }

    var PRESETS = [
      {
        id: "small",
        label: "小类：4 个候选",
        note: "固定 6 点样本上只允许四种预测行为。",
        sampleX: [0, 1, 2, 3, 4, 5],
        sampleY: [0, 0, 1, 1, 1, 0],
        populationX: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        populationY: [0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1],
        functions: [0, 28, 7, 63].map(function (mask, index) { return makeFunction(mask, index, 6); })
      },
      {
        id: "rich",
        label: "丰富类：8 个候选",
        note: "同一固定样本上允许更多符号行为；本固定构造中有一个样本风险很低但在参考分布上失配的候选。",
        sampleX: [0, 1, 2, 3, 4, 5],
        sampleY: [0, 0, 1, 1, 1, 0],
        populationX: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        populationY: [0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1],
        functions: [0, 7, 14, 21, 28, 35, 42, 63].map(function (mask, index) { return makeFunction(mask, index, 6); })
      }
    ];

    var STYLE_TEXT = [
      ".rc-lab{max-width:100%;min-width:0;color:var(--fg,#20252b);line-height:1.55;overflow-wrap:anywhere}.rc-lab *,.rc-lab *::before,.rc-lab *::after{box-sizing:border-box}.rc-lab [hidden]{display:none!important}",
      ".rc-lab h3,.rc-lab h4{margin:0;color:var(--fg,#20252b);letter-spacing:0}.rc-lab h3{font-size:1.12rem}.rc-lab h4{font-size:1rem}.rc-lab p{margin:8px 0}.rc-lab .rc-note,.rc-lab .rc-feedback,.rc-lab .rc-status{color:var(--fg-soft,var(--muted,#5d6873));font-size:13px;line-height:1.65}",
      ".rc-lab button,.rc-lab input{font:inherit}.rc-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--bg,#fff);color:var(--fg,#20252b);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.rc-lab button:hover{border-color:var(--accent,#1769aa)}.rc-lab button:focus-visible,.rc-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.rc-lab button[aria-pressed=true],.rc-lab button.rc-primary{border-color:var(--accent,#1769aa);background:var(--accent,#1769aa);color:var(--bg,#fff);font-weight:750}.rc-lab button:disabled{cursor:not-allowed;opacity:.55}",
      ".rc-lab .rc-presets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:10px 0}.rc-lab .rc-presets button{font-size:12px}.rc-lab .rc-controls{display:grid;grid-template-columns:minmax(0,1fr) minmax(210px,.7fr);gap:12px;align-items:end;margin:12px 0}.rc-lab .rc-control{min-width:0;display:grid;gap:4px}.rc-lab .rc-control label{color:var(--fg-soft,var(--muted,#5d6873));font-size:12.5px;font-weight:700}.rc-lab .rc-control output{color:var(--accent,#1769aa);font-variant-numeric:tabular-nums}.rc-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent,#1769aa)}",
      ".rc-lab .rc-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--cl-gold,#9a6b12);background:var(--block-bg,var(--bg,#fff))}.rc-lab .rc-prediction-title{display:block;margin-bottom:8px;font-size:13px}.rc-lab .rc-question{margin:10px 0}.rc-lab .rc-question-label{display:block;margin-bottom:6px;font-size:13px;font-weight:700}.rc-lab .rc-choice-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.rc-lab .rc-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.rc-lab .rc-pass{color:var(--cl-green,#2f7547)}.rc-lab .rc-warn{color:var(--cl-red,#b43d32)}.rc-lab .rc-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.rc-lab .rc-actions>*{flex:1 1 160px}",
      ".rc-lab .rc-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#c8cdd3)}.rc-lab .rc-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}.rc-lab .rc-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#c8cdd3);background:var(--block-bg,var(--bg,#fff))}.rc-lab .rc-metric:nth-child(5n+1){border-color:var(--cl-blue,#2c6aa0)}.rc-lab .rc-metric:nth-child(5n+2){border-color:var(--cl-green,#2f7547)}.rc-lab .rc-metric:nth-child(5n+3){border-color:var(--cl-gold,#9a6b12)}.rc-lab .rc-metric:nth-child(5n+4){border-color:var(--cl-red,#b43d32)}.rc-lab .rc-metric:nth-child(5n){border-color:var(--cl-purple,#7052a3)}.rc-lab .rc-metric span{display:block;color:var(--fg-soft,var(--muted,#5d6873));font-size:11px;line-height:1.4}.rc-lab .rc-metric strong{display:block;margin-top:3px;font-size:13px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
      ".rc-lab .rc-chart-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;min-width:0}.rc-lab .rc-stage{min-width:0;padding:8px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--block-bg,var(--bg,#fff))}.rc-lab .rc-frame{max-width:100%;overflow-x:auto}.rc-lab .rc-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg,#20252b)}.rc-lab .rc-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.rc-lab .rc-grid-line{stroke:currentColor;stroke-opacity:.15;stroke-width:1}.rc-lab .rc-axis-line{stroke:currentColor;stroke-opacity:.65;stroke-width:1.1}.rc-lab .rc-bar{fill:var(--cl-blue,#2c6aa0);opacity:.8}.rc-lab .rc-bar-hot{fill:var(--cl-green,#2f7547);opacity:.9}.rc-lab .rc-risk-emp{fill:var(--cl-blue,#2c6aa0)}.rc-lab .rc-risk-pop{fill:var(--cl-green,#2f7547)}.rc-lab .rc-risk-cert{fill:var(--cl-gold,#9a6b12);opacity:.75}.rc-lab .rc-tick{font-size:10px;fill:var(--fg-soft,var(--muted,#5d6873))}.rc-lab .rc-title{font-size:12px;font-weight:750}.rc-lab .rc-label{font-size:10px}.rc-lab .rc-stage-note{font-size:10px;fill:var(--fg-soft,var(--muted,#5d6873))}",
      ".rc-lab .rc-ledger-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:12px}.rc-lab table{width:100%;min-width:780px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.rc-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,var(--muted,#5d6873));font-size:12px}.rc-lab th,.rc-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#c8cdd3);text-align:left;vertical-align:top}.rc-lab th{color:var(--fg-soft,var(--muted,#5d6873));font-size:11.5px}.rc-lab td strong{font-weight:750}.rc-lab .rc-selected{color:var(--cl-green,#2f7547);font-weight:750}.rc-lab .rc-interpretation{margin-top:10px;padding:10px 12px;border-left:3px solid var(--cl-green,#2f7547);background:var(--block-bg,var(--bg,#fff));font-size:13px;line-height:1.65}",
      "@media(max-width:920px){.rc-lab .rc-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.rc-lab .rc-choice-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}",
      "@media(max-width:700px){.rc-lab .rc-chart-grid{grid-template-columns:minmax(0,1fr)}.rc-lab .rc-controls{grid-template-columns:minmax(0,1fr)}}",
      "@media(max-width:460px){.rc-lab .rc-presets,.rc-lab .rc-metrics,.rc-lab .rc-choice-grid{grid-template-columns:minmax(0,1fr)}.rc-lab .rc-prediction{padding:10px}.rc-lab .rc-stage{padding:4px}}",
      "@media(prefers-reduced-motion:reduce){.rc-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
    ].join("\n");

    function finite(value) {
      return typeof value === "number" && Number.isFinite(value);
    }

    function clamp(value, minimum, maximum) {
      return Math.max(minimum, Math.min(maximum, value));
    }

    function close(a, b, tolerance) {
      return Math.abs(a - b) <= (tolerance === undefined ? 1e-10 : tolerance);
    }

    function presetById(id) {
      var found = PRESETS[1];
      PRESETS.forEach(function (preset) {
        if (preset.id === id) found = preset;
      });
      return found;
    }

    function lossVector(predictions, labels) {
      return predictions.map(function (prediction, index) { return prediction === labels[index] ? 0 : 1; });
    }

    function average(values) {
      return values.reduce(function (total, value) { return total + value; }, 0) / values.length;
    }

    function enumerateSigns(lossVectors) {
      var sampleSize = lossVectors[0].length;
      var count = Math.pow(2, sampleSize);
      var rows = [];
      var total = 0;
      var mask;
      for (mask = 0; mask < count; mask += 1) {
        var signs = [];
        var bestValue = -Infinity;
        var bestIndex = 0;
        var functionIndex;
        var coordinate;
        for (coordinate = 0; coordinate < sampleSize; coordinate += 1) signs.push((mask >> coordinate) & 1 ? 1 : -1);
        for (functionIndex = 0; functionIndex < lossVectors.length; functionIndex += 1) {
          var sum = 0;
          for (coordinate = 0; coordinate < sampleSize; coordinate += 1) sum += signs[coordinate] * lossVectors[functionIndex][coordinate];
          if (sum > bestValue) {
            bestValue = sum;
            bestIndex = functionIndex;
          }
        }
        total += bestValue / sampleSize;
        rows.push({ mask: mask, signs: signs, supremum: bestValue, normalized: bestValue / sampleSize, argmax: bestIndex });
      }
      return { rows: rows, count: count, value: total / count };
    }

    function normalizeInput(input) {
      var raw = input || {};
      var delta = Number(raw.delta === undefined ? 0.05 : raw.delta);
      return {
        preset: presetById(raw.preset || raw.presetId),
        delta: clamp(finite(delta) ? delta : 0.05, 0.01, 0.25)
      };
    }

    function evaluate(input) {
      var config = normalizeInput(input);
      var preset = config.preset;
      var sampleLosses = preset.functions.map(function (fn) { return lossVector(fn.sample, preset.sampleY); });
      var populationLosses = preset.functions.map(function (fn) { return lossVector(fn.population, preset.populationY); });
      var enumeration = enumerateSigns(sampleLosses);
      var slack = 3 * Math.sqrt(Math.log(2 / config.delta) / (2 * preset.sampleX.length));
      var rows = preset.functions.map(function (fn, index) {
        var empiricalRisk = average(sampleLosses[index]);
        var populationRisk = average(populationLosses[index]);
        var rawCertificate = empiricalRisk + 2 * enumeration.value + slack;
        var certificate = Math.min(1, rawCertificate);
        return {
          id: fn.id,
          label: fn.label,
          empiricalRisk: empiricalRisk,
          populationRisk: populationRisk,
          realizedGap: populationRisk - empiricalRisk,
          rawCertificate: rawCertificate,
          certificate: certificate,
          certificateVacuous: rawCertificate >= 1,
          sampleLoss: sampleLosses[index],
          populationLoss: populationLosses[index]
        };
      });
      var ermIndex = 0;
      rows.forEach(function (row, index) {
        if (row.empiricalRisk < rows[ermIndex].empiricalRisk - EPS) ermIndex = index;
      });
      return {
        config: config,
        sampleSize: preset.sampleX.length,
        classSize: preset.functions.length,
        signCount: enumeration.count,
        signs: enumeration.rows,
        empiricalComplexity: enumeration.value,
        slack: slack,
        rows: rows,
        ermIndex: ermIndex,
        erm: rows[ermIndex],
        referenceDistribution: "12 个固定点的均匀分布（教学用精确总体）"
      };
    }

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) {
        checks += 1;
        assert(condition, "rademacher-complexity self-test failed: " + message);
      }

      var toy = enumerateSigns([[1, 0], [0, 1]]);
      check(toy.count === 4 && toy.rows.length === 4, "enumerates every sign vector");
      check(close(toy.value, 0.25, 1e-12), "two-vector exact enumeration");

      var small = evaluate({ preset: "small", delta: 0.05 });
      var rich = evaluate({ preset: "rich", delta: 0.05 });
      [small, rich].forEach(function (result) {
        check(result.signCount === Math.pow(2, result.sampleSize), result.config.preset.id + " has 2^m signs");
        check(result.signs.length === result.signCount, result.config.preset.id + " sign ledger length");
        check(result.rows.length === result.classSize, result.config.preset.id + " finite class ledger");
        check(result.empiricalComplexity >= -EPS, result.config.preset.id + " nonnegative empirical complexity");
        check(result.rows.every(function (row) { return row.certificate + EPS >= row.populationRisk; }), result.config.preset.id + " certificate covers finite reference risks");
        check(result.rows.every(function (row) { return row.rawCertificate + EPS >= row.certificate; }), result.config.preset.id + " raw certificate precedes clipping");
        check(result.rows.every(function (row) { return close(row.realizedGap, row.populationRisk - row.empiricalRisk, 1e-12); }), result.config.preset.id + " realized gap is a separate difference");
      });
      check(rich.empiricalComplexity >= small.empiricalComplexity - 1e-12, "richer finite class does not reduce the supremum average here");
      var strict = evaluate({ preset: "rich", delta: 0.01 });
      check(strict.slack > rich.slack, "smaller delta enlarges certificate slack");
      check(strict.erm.certificate >= rich.erm.certificate - 1e-12, "smaller delta does not shrink certificate");
      check(rich.erm.rawCertificate > 1 && rich.erm.certificate === 1, "m=6 ERM certificate is visibly vacuous after clipping");
      check(rich.erm && finite(rich.erm.realizedGap), "ERM realized gap is finite");
      return { checks: checks, presets: PRESETS.length };
    }

    function setAttributes(node, attrs) {
      Object.keys(attrs || {}).forEach(function (key) {
        var value = attrs[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.setAttribute("class", String(value));
        else if (key === "text") node.textContent = String(value);
        else if (key === "value") node.value = String(value);
        else node.setAttribute(key, String(value));
      });
    }

    function element(doc, tag, attrs, children) {
      var node = doc.createElement(tag);
      setAttributes(node, attrs || {});
      (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) {
        if (child === null || child === undefined) return;
        node.appendChild(typeof child === "string" ? doc.createTextNode(child) : child);
      });
      return node;
    }

    function svgElement(doc, tag, attrs, children) {
      var node = doc.createElementNS(SVG_NS, tag);
      setAttributes(node, attrs || {});
      (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) {
        if (child === null || child === undefined) return;
        node.appendChild(typeof child === "string" ? doc.createTextNode(child) : child);
      });
      return node;
    }

    function clear(node) {
      while (node.firstChild) node.removeChild(node.firstChild);
    }

    function injectStyles(doc) {
      if (doc.getElementById && doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement || doc.body).appendChild(style);
    }

    function format(value, digits) {
      return finite(value) ? value.toFixed(digits === undefined ? 4 : digits) : "—";
    }

    function makeMetric(doc, label) {
      var value = element(doc, "strong", {}, "-");
      return { card: element(doc, "div", { className: "rc-metric" }, [element(doc, "span", {}, label), value]), value: value };
    }

    function svgText(doc, x, y, text, attrs) {
      var merged = { x: x, y: y, className: "rc-label" };
      Object.keys(attrs || {}).forEach(function (key) { merged[key] = attrs[key]; });
      return svgElement(doc, "text", merged, text);
    }

    function drawSignChart(doc, result) {
      var svg = svgElement(doc, "svg", { className: "rc-svg", viewBox: "0 0 720 270", role: "img", "aria-label": "固定样本全部符号向量的 supremum 条形图" });
      var left = 46;
      var top = 28;
      var width = 570;
      var height = 175;
      var values = result.signs.map(function (row) { return row.normalized; });
      var minimum = Math.min.apply(Math, values.concat([0]));
      var maximum = Math.max.apply(Math, values.concat([1 / result.sampleSize]));
      var span = Math.max(maximum - minimum, 0.1);
      var mapY = function (value) { return top + height - ((value - minimum) / span) * height; };
      var zeroY = mapY(0);
      svg.appendChild(svgElement(doc, "rect", { x: left, y: top, width: width, height: height, fill: "var(--bg,#fff)", stroke: "var(--border,#c8cdd3)" }));
      [minimum, 0, maximum].forEach(function (tick) {
        if (tick < minimum - EPS || tick > maximum + EPS) return;
        svg.appendChild(svgElement(doc, "line", { className: "rc-grid-line", x1: left, y1: mapY(tick), x2: left + width, y2: mapY(tick) }));
        svg.appendChild(svgText(doc, left - 7, mapY(tick) + 4, format(tick, 2), { className: "rc-tick", "text-anchor": "end" }));
      });
      svg.appendChild(svgElement(doc, "line", { className: "rc-axis-line", x1: left, y1: zeroY, x2: left + width, y2: zeroY }));
      var barWidth = width / result.signs.length;
      result.signs.forEach(function (row, index) {
        var y = mapY(Math.max(row.normalized, 0));
        var barY = row.normalized >= 0 ? y : zeroY;
        var barHeight = Math.max(1, Math.abs(mapY(row.normalized) - zeroY));
        svg.appendChild(svgElement(doc, "rect", { className: row.argmax === result.ermIndex ? "rc-bar-hot" : "rc-bar", x: left + index * barWidth + 0.4, y: barY, width: Math.max(1, barWidth - 0.8), height: barHeight }));
      });
      svg.appendChild(svgText(doc, left + width / 2, 224, "符号向量 σ 的枚举序号（共 2^m=" + result.signCount + " 个）", { className: "rc-stage-note", "text-anchor": "middle" }));
      svg.appendChild(svgText(doc, left + width / 2, 18, "每个 σ 上的 sup_h〈σ, loss_h〉/m；绿色表示该 σ 选中了 ERM 行", { className: "rc-title", "text-anchor": "middle" }));
      return svg;
    }

    function drawRiskChart(doc, result) {
      var svg = svgElement(doc, "svg", { className: "rc-svg", viewBox: "0 0 720 300", role: "img", "aria-label": "每个有限函数的经验风险、参考风险与高概率证书" });
      var left = 190;
      var top = 38;
      var width = 440;
      var rowHeight = 30;
      var maxValue = 1;
      svg.appendChild(svgElement(doc, "rect", { x: left, y: top - 16, width: width, height: rowHeight * result.rows.length + 18, fill: "var(--bg,#fff)", stroke: "var(--border,#c8cdd3)" }));
      [0, 0.5, 1].forEach(function (tick) {
        var x = left + width * tick;
        svg.appendChild(svgElement(doc, "line", { className: "rc-grid-line", x1: x, y1: top - 16, x2: x, y2: top + rowHeight * result.rows.length + 2 }));
        svg.appendChild(svgText(doc, x, top - 21, format(tick, 1), { className: "rc-tick", "text-anchor": "middle" }));
      });
      result.rows.forEach(function (row, index) {
        var y = top + index * rowHeight;
        svg.appendChild(svgText(doc, left - 9, y + 12, (index === result.ermIndex ? "★ " : "") + row.label, { className: index === result.ermIndex ? "rc-title" : "rc-label", "text-anchor": "end" }));
        svg.appendChild(svgElement(doc, "rect", { className: "rc-risk-emp", x: left, y: y, width: width * clamp(row.empiricalRisk / maxValue, 0, 1), height: 7 }));
        svg.appendChild(svgElement(doc, "rect", { className: "rc-risk-pop", x: left, y: y + 9, width: width * clamp(row.populationRisk / maxValue, 0, 1), height: 7 }));
        svg.appendChild(svgElement(doc, "rect", { className: "rc-risk-cert", x: left, y: y + 18, width: width * clamp(row.certificate / maxValue, 0, 1), height: 5 }));
      });
      svg.appendChild(svgText(doc, left + width / 2, 286, "风险 / 裁剪证书（0 到 1）；原始证书可能 >1", { className: "rc-stage-note", "text-anchor": "middle" }));
      svg.appendChild(svgText(doc, 18, 24, "每行：经验 / 参考 / 证书", { className: "rc-title" }));
      return svg;
    }

    function buildLab(root, api) {
      var doc = root.ownerDocument || document;
      var state = { presetId: "rich", delta: 0.05, answers: { source: null, richness: null, certificate: null, delta: null }, revealed: false };
      var presetButtons = [];
      var questionButtons = {};
      var deltaInput;
      var deltaOutput;
      var feedback;
      var results;
      var metrics;
      var chartGrid;
      var ledger;
      var status;

      INSTANCE += 1;
      injectStyles(doc);
      root.classList.add("rc-lab");

      function announce(message) {
        if (api && typeof api.announce === "function") api.announce(root, message);
      }

      function lock(message) {
        state.answers = { source: null, richness: null, certificate: null, delta: null };
        state.revealed = false;
        if (results) results.hidden = true;
        if (feedback) {
          feedback.className = "rc-feedback";
          feedback.textContent = message || "参数已改变；预测门重新上锁。";
        }
        renderQuestionButtons();
      }

      function makeQuestion(key, label, choices) {
        var grid = element(doc, "div", { className: "rc-choice-grid", role: "group", "aria-label": label });
        var entries = [];
        choices.forEach(function (choice) {
          var button = element(doc, "button", { type: "button", "aria-pressed": "false" }, choice.label);
          button.addEventListener("click", function () {
            state.answers[key] = choice.value;
            renderQuestionButtons();
          });
          entries.push({ button: button, value: choice.value });
          grid.appendChild(button);
        });
        questionButtons[key] = entries;
        return element(doc, "div", { className: "rc-question" }, [element(doc, "span", { className: "rc-question-label" }, label), grid]);
      }

      function renderQuestionButtons() {
        Object.keys(questionButtons).forEach(function (key) {
          questionButtons[key].forEach(function (entry) {
            entry.button.setAttribute("aria-pressed", state.answers[key] === entry.value ? "true" : "false");
          });
        });
      }

      function addLedgerRow(body, cells, selected) {
        var row = element(doc, "tr");
        cells.forEach(function (cell, index) {
          row.appendChild(element(doc, index === 0 ? "th" : "td", index === 0 ? { scope: "row", className: selected ? "rc-selected" : "" } : {}, cell));
        });
        body.appendChild(row);
      }

      function renderResult(result) {
        metrics[0].value.textContent = format(result.empiricalComplexity, 5);
        metrics[1].value.textContent = String(result.signCount);
        metrics[2].value.textContent = format(result.erm.empiricalRisk, 3);
        metrics[3].value.textContent = format(result.erm.populationRisk, 3);
        metrics[4].value.textContent = format(result.erm.rawCertificate, 3);
        metrics[5].value.textContent = format(result.erm.certificate, 3);
        metrics[6].value.textContent = (result.erm.realizedGap >= 0 ? "+" : "") + format(result.erm.realizedGap, 3);
        clear(chartGrid);
        var signStage = element(doc, "div", { className: "rc-stage" }, [element(doc, "h4", {}, "精确符号枚举"), element(doc, "div", { className: "rc-frame" }, drawSignChart(doc, result))]);
        var riskStage = element(doc, "div", { className: "rc-stage" }, [element(doc, "h4", {}, "三种不同读数"), element(doc, "div", { className: "rc-frame" }, drawRiskChart(doc, result))]);
        chartGrid.appendChild(signStage);
        chartGrid.appendChild(riskStage);
        clear(ledger);
        ledger.appendChild(element(doc, "caption", {}, "经验风险、固定参考分布风险、realized gap、原始证书与裁剪证书逐行对照"));
        ledger.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, ["函数", "R_S", "R_D（12点）", "R_D−R_S", "原始证书", "显示证书"].map(function (label) { return element(doc, "th", {}, label); }))));
        var body = element(doc, "tbody");
        result.rows.forEach(function (row, index) {
          addLedgerRow(body, [row.label, format(row.empiricalRisk, 3), format(row.populationRisk, 3), (row.realizedGap >= 0 ? "+" : "") + format(row.realizedGap, 3), format(row.rawCertificate, 3), format(row.certificate, 3) + (row.certificateVacuous ? "（裁到 1）" : "")], index === result.ermIndex);
        });
        ledger.appendChild(body);
        status.textContent = "经验 Rademacher 复杂度 R̂=" + format(result.empiricalComplexity, 5) + " 来自固定样本的 " + result.signCount + " 个符号向量；realized gap=" + format(result.erm.realizedGap, 3) + " 只描述这次固定参考账本；m=" + result.sampleSize + " 时 ERM 原始证书=" + format(result.erm.rawCertificate, 3) + "，显示值裁到 1，因此这个统一证书是 vacuous（空泛）的。";
      }

      var shell = element(doc, "div", { className: "rc-shell" });
      shell.appendChild(element(doc, "h3", {}, "Rademacher 复杂度：三本不能合并的账"));
      shell.appendChild(element(doc, "p", { className: "rc-note" }, "固定 6 点样本、有限函数类和 12 点参考分布全部写死在纯模型中；没有随机抽样。符号枚举对每个 σ 计算 sup，再平均得到经验复杂度。"));
      var presetSection = element(doc, "section", {}, [element(doc, "h4", {}, "固定函数类")]);
      var presetGrid = element(doc, "div", { className: "rc-presets", role: "group", "aria-label": "有限函数类预设" });
      PRESETS.forEach(function (preset) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false" }, preset.label);
        button.addEventListener("click", function () {
          state.presetId = preset.id;
          lock("已切换到" + preset.label + "；预测门重新上锁。");
          renderControls();
        });
        presetButtons.push(button);
        presetGrid.appendChild(button);
      });
      presetSection.appendChild(presetGrid);
      presetSection.appendChild(element(doc, "p", { className: "rc-note" }, "样本与 12 点参考分布均固定；参考分布只是为了把 realized gap 变成可复核的确定性量，不替代高概率定理中的总体随机性。"));
      shell.appendChild(presetSection);

      var controls = element(doc, "div", { className: "rc-controls" });
      var deltaControl = element(doc, "div", { className: "rc-control" });
      deltaOutput = element(doc, "output", {}, "0.05");
      deltaInput = element(doc, "input", { type: "range", min: "0.01", max: "0.25", step: "0.01", value: "0.05", "aria-label": "高概率证书 delta" });
      deltaInput.addEventListener("input", function () {
        state.delta = Number(deltaInput.value);
        lock("δ 已改变；证书的置信参数需要重新预测。");
        renderControls();
      });
      deltaControl.appendChild(element(doc, "label", {}, ["证书参数 δ=", deltaOutput]));
      deltaControl.appendChild(deltaInput);
      controls.appendChild(deltaControl);
      controls.appendChild(element(doc, "p", { className: "rc-note" }, "显示的证书是经验 Rademacher 版本：R_D(h) ≤ R_S(h)+2R̂_S+3√(log(2/δ)/(2m))。实验同时保留原始右端与裁到 1 的显示值；本页 m=6 时原始值会超过 1，故证书是 vacuous，而不是一个有用的数值预测。"));
      shell.appendChild(controls);

      var prediction = element(doc, "section", { className: "rc-prediction" });
      prediction.appendChild(element(doc, "strong", { className: "rc-prediction-title" }, "预测门：先分清三种泛化语言，再打开枚举账本"));
      prediction.appendChild(makeQuestion("source", "1. 经验 Rademacher 复杂度在本实验中怎样得到？", [
        { value: "enumerate", label: "枚举全部 σ" }, { value: "train", label: "只看训练风险" }, { value: "population", label: "先知道总体风险" }, { value: "sample", label: "随机抽一次" }
      ]));
      prediction.appendChild(makeQuestion("richness", "2. 有限类增加候选行为，sup 后平均通常怎样？", [
        { value: "increase", label: "不减，常会增大" }, { value: "decrease", label: "必然减小" }, { value: "same", label: "与函数类无关" }, { value: "undefined", label: "无法定义" }
      ]));
      prediction.appendChild(makeQuestion("certificate", "3. 高概率泛化证书与 realized gap 的关系？", [
        { value: "separate", label: "证书是上界，gap 是实测差" }, { value: "equal", label: "两者恒相等" }, { value: "gap", label: "证书就是 gap" }, { value: "none", label: "都不是风险" }
      ]));
      prediction.appendChild(makeQuestion("delta", "4. δ 从 0.05 降到 0.01，证书的松弛项怎样？", [
        { value: "larger", label: "变大，更保守" }, { value: "smaller", label: "变小" }, { value: "same", label: "不变" }, { value: "random", label: "随机跳动" }
      ]));
      feedback = element(doc, "p", { className: "rc-feedback", "aria-live": "polite", "aria-atomic": "true" }, "");
      prediction.appendChild(feedback);
      var actions = element(doc, "div", { className: "rc-actions" });
      var reveal = element(doc, "button", { type: "button", className: "rc-primary" }, "揭示账本");
      reveal.addEventListener("click", function () {
        var keys = Object.keys(state.answers);
        if (keys.some(function (key) { return state.answers[key] === null; })) {
          feedback.className = "rc-feedback rc-warn";
          feedback.textContent = "还有预测没有作答。";
          return;
        }
        var expected = { source: "enumerate", richness: "increase", certificate: "separate", delta: "larger" };
        var correct = keys.filter(function (key) { return state.answers[key] === expected[key]; }).length;
        state.revealed = true;
        results.hidden = false;
        feedback.className = "rc-feedback " + (correct === keys.length ? "rc-pass" : "rc-warn");
        feedback.textContent = "预测得分 " + correct + "/" + keys.length + "；现在分别查看 R̂、证书和 realized gap。";
        renderResult(evaluate({ preset: state.presetId, delta: state.delta }));
        announce(feedback.textContent);
      });
      var reset = element(doc, "button", { type: "button" }, "重置实验");
      reset.addEventListener("click", function () {
        state.presetId = "rich";
        state.delta = 0.05;
        deltaInput.value = "0.05";
        lock("已重置；预测门重新上锁。");
        renderControls();
        announce("Rademacher 实验已重置。");
      });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      prediction.appendChild(actions);
      shell.appendChild(prediction);

      results = element(doc, "section", { className: "rc-results", hidden: "hidden" });
      results.appendChild(element(doc, "h4", {}, "精确枚举、风险账本与证书"));
      metrics = [makeMetric(doc, "经验 R̂_S"), makeMetric(doc, "符号数 2^m"), makeMetric(doc, "ERM R_S"), makeMetric(doc, "ERM R_D"), makeMetric(doc, "ERM 原始证书"), makeMetric(doc, "ERM 显示证书"), makeMetric(doc, "ERM realized gap")];
      results.appendChild(element(doc, "div", { className: "rc-metrics" }, metrics.map(function (metric) { return metric.card; })));
      chartGrid = element(doc, "div", { className: "rc-chart-grid" });
      results.appendChild(chartGrid);
      ledger = element(doc, "table", { "aria-label": "有限函数类风险账本" });
      results.appendChild(element(doc, "div", { className: "rc-ledger-wrap" }, ledger));
      status = element(doc, "p", { className: "rc-status", "aria-live": "polite" }, "");
      results.appendChild(status);
      results.appendChild(element(doc, "p", { className: "rc-interpretation" }, "R̂_S 是固定样本上的符号平均；R_D 是这里声明的 12 点均匀参考分布风险；R_D−R_S 是一次 realized gap；证书则带有 iid 抽样与 1−δ 的概率量词。m=6 使原始证书超过 1，裁剪后的 1 只是说明本界没有给出非平凡信息。不要用一次随机标签可拟合的观察替代符号平均与上确界：那只能作为高容量证据，不能单独断言 R̂ 接近上限。"));
      shell.appendChild(results);
      root.replaceChildren(shell);

      function renderControls() {
        presetButtons.forEach(function (button, index) {
          button.setAttribute("aria-pressed", PRESETS[index].id === state.presetId ? "true" : "false");
        });
        deltaOutput.textContent = state.delta.toFixed(2);
        renderQuestionButtons();
      }

      renderControls();
      feedback.textContent = "选择有限函数类，先作答四项预测。";
    }

    return {
      PRESETS: PRESETS,
      enumerateSigns: enumerateSigns,
      evaluate: evaluate,
      selfTest: selfTest,
      mount: buildLab
    };
  }
);

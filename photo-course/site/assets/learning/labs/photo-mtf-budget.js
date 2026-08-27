(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("photo-mtf-budget", exported.mount);
  }
  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("photo-mtf-budget self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("photo-mtf-budget self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-photo-mtf-budget-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var DEFAULT = { frequency: 80, pixelPitch: 5, lensQuality: 90, blur: 150 };
  var TRANSFER_MODEL = "incoherent-intensity pre-sampling MTF";

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function near(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance || 1e-9) * Math.max(1, Math.abs(left), Math.abs(right));
  }

  function sinc(value) {
    if (Math.abs(value) < 1e-9) return 1;
    return Math.sin(Math.PI * value) / (Math.PI * value);
  }

  function lensMtf(frequency, quality) {
    return Math.exp(-0.5 * Math.pow(frequency / quality, 2));
  }

  function pixelMtf(frequency, pixelPitch) {
    return Math.abs(sinc(frequency * pixelPitch / 1000));
  }

  function blurMtf(frequency, blurScale) {
    return Math.exp(-0.5 * Math.pow(frequency / blurScale, 2));
  }

  function experiment(options) {
    var frequency = clamp(Number(options.frequency), 0, 220);
    var pixelPitch = clamp(Number(options.pixelPitch), 1, 20);
    var lensQuality = clamp(Number(options.lensQuality), 20, 220);
    var blur = clamp(Number(options.blur), 30, 300);
    var nyquist = 1000 / (2 * pixelPitch);
    var lens = lensMtf(frequency, lensQuality);
    var pixel = pixelMtf(frequency, pixelPitch);
    var blurValue = blurMtf(frequency, blur);
    var system = lens * pixel * blurValue;
    var alias = Math.abs(frequency - 2 * nyquist * Math.round(frequency / (2 * nyquist)));
    return {
      frequency: frequency,
      pixelPitch: pixelPitch,
      lensQuality: lensQuality,
      blur: blur,
      nyquist: nyquist,
      lens: lens,
      pixel: pixel,
      blurValue: blurValue,
      system: system,
      alias: alias,
      mixed: frequency > nyquist + 1e-9,
      transferModel: TRANSFER_MODEL
    };
  }

  function fmt(value, digits) {
    if (!finite(value)) return "—";
    var places = digits === undefined ? 2 : Number(digits);
    var text = value.toFixed(places);
    return places === 0 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function element(api, tag, attrs, children) {
    return api.el(tag, attrs || {}, children);
  }

  function svgElement(api, tag, attrs, children) {
    return api.svg(tag, attrs || {}, children);
  }

  function clear(node) {
    if (node.replaceChildren) node.replaceChildren();
    else while (node.firstChild) node.removeChild(node.firstChild);
  }

  function installStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".pmtf-lab{--pmtf-blue:var(--cl-blue,#315f9d);--pmtf-gold:var(--cl-gold,#9b6a12);--pmtf-red:var(--cl-red,#b64335);--pmtf-green:var(--cl-green,#39734d);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;}",
      ".pmtf-lab *{box-sizing:border-box}.pmtf-lab h3,.pmtf-lab h4{margin:0}.pmtf-lab h3{font-size:1.18rem}.pmtf-lab h4{margin-top:14px;font-size:1rem}.pmtf-lab p{margin:.65em 0}.pmtf-lab .pmtf-note,.pmtf-lab .pmtf-feedback{color:var(--fg-soft);font-size:13px;line-height:1.6;overflow-wrap:anywhere}.pmtf-lab .pmtf-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--pmtf-gold);background:var(--bg)}",
      ".pmtf-lab fieldset{min-width:0;margin:0 0 11px;padding:0;border:0}.pmtf-lab legend{margin-bottom:7px;color:var(--fg);font-size:13px;font-weight:750;line-height:1.5}.pmtf-lab .pmtf-choice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.pmtf-lab button,.pmtf-lab input{font:inherit;letter-spacing:0}.pmtf-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere}.pmtf-lab button:hover{border-color:var(--accent)}.pmtf-lab button[aria-pressed=true],.pmtf-lab button.pmtf-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:700}.pmtf-lab button:disabled{cursor:not-allowed;opacity:.55}.pmtf-lab button:focus-visible,.pmtf-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.pmtf-lab .pmtf-actions{display:flex;flex-wrap:wrap;gap:8px}.pmtf-lab .pmtf-actions>*{flex:1 1 160px}.pmtf-lab .pmtf-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.pmtf-lab .pmtf-pass{color:var(--pmtf-green)}.pmtf-lab .pmtf-warn{color:var(--pmtf-red)}",
      ".pmtf-lab .pmtf-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.pmtf-lab .pmtf-layout{display:grid;grid-template-columns:minmax(205px,.72fr) minmax(0,1.28fr);gap:14px;align-items:start}.pmtf-lab .pmtf-controls,.pmtf-lab .pmtf-stage{min-width:0}.pmtf-lab .pmtf-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.pmtf-lab .pmtf-control{display:grid;gap:5px;min-width:0}.pmtf-lab .pmtf-control label{color:var(--fg-soft);font-size:13px;font-weight:700}.pmtf-lab .pmtf-control output{color:var(--accent);font-variant-numeric:tabular-nums}.pmtf-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}.pmtf-lab .pmtf-scale{display:flex;justify-content:space-between;color:var(--fg-soft);font-size:11px}.pmtf-lab .pmtf-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.pmtf-lab svg{display:block;width:100%;height:auto;color:var(--fg)}.pmtf-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.pmtf-lab .pmtf-legend{display:flex;flex-wrap:wrap;gap:7px 14px;margin:8px 0 0;color:var(--fg-soft);font-size:12px}.pmtf-lab .pmtf-legend span{display:inline-flex;align-items:center;gap:5px}.pmtf-lab .pmtf-swatch{display:inline-block;width:18px;height:3px;background:currentColor}.pmtf-lab .pmtf-blue{color:var(--pmtf-blue)}.pmtf-lab .pmtf-gold{color:var(--pmtf-gold)}.pmtf-lab .pmtf-red{color:var(--pmtf-red)}.pmtf-lab .pmtf-green{color:var(--pmtf-green)}.pmtf-lab .pmtf-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:11px 0}.pmtf-lab .pmtf-metric{min-width:0;padding:8px;border-top:2px solid var(--border);background:var(--bg)}.pmtf-lab .pmtf-metric:nth-child(4n+1){border-top-color:var(--pmtf-blue)}.pmtf-lab .pmtf-metric:nth-child(4n+2){border-top-color:var(--pmtf-gold)}.pmtf-lab .pmtf-metric:nth-child(4n+3){border-top-color:var(--pmtf-red)}.pmtf-lab .pmtf-metric:nth-child(4n){border-top-color:var(--pmtf-green)}.pmtf-lab .pmtf-metric span{display:block;color:var(--fg-soft);font-size:11.5px}.pmtf-lab .pmtf-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.pmtf-lab table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.pmtf-lab th,.pmtf-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.pmtf-lab th{color:var(--fg-soft);font-weight:750}.pmtf-lab .pmtf-interpretation{margin:11px 0 0;padding:10px 12px;border-left:3px solid var(--pmtf-green);background:var(--bg);font-size:13px;line-height:1.65;overflow-wrap:anywhere}",
      "@media(max-width:820px){.pmtf-lab .pmtf-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:520px){.pmtf-lab .pmtf-choice-grid{grid-template-columns:minmax(0,1fr)}.pmtf-lab .pmtf-frame{padding:5px}.pmtf-lab th,.pmtf-lab td{padding-left:5px;padding-right:5px}}@media(prefers-reduced-motion:reduce){.pmtf-lab *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}"
    ].join("");
    style.textContent += ".pmtf-lab .cl-grid{stroke:var(--border);stroke-width:1;opacity:.72}.pmtf-lab .cl-axis{stroke:var(--fg-soft);stroke-width:1.2}.pmtf-lab .pmtf-line{fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.pmtf-lab .pmtf-boundary{stroke:var(--pmtf-red);stroke-width:2;stroke-dasharray:6 4}.pmtf-lab .pmtf-marker{stroke:var(--pmtf-gold);stroke-width:1.5;stroke-dasharray:3 3}.pmtf-lab .pmtf-point{fill:var(--pmtf-green);stroke:var(--bg);stroke-width:2}";
    (doc.head || doc.documentElement).appendChild(style);
  }

  function pathFor(points, xMap, yMap) {
    return points.map(function (point, index) {
      return (index ? "L" : "M") + xMap(point.x).toFixed(2) + "," + yMap(point.y).toFixed(2);
    }).join(" ");
  }

  function buildChart(api, data) {
    var svg = svgElement(api, "svg", {
      viewBox: "0 0 720 300",
      role: "img",
      "aria-label": "镜头、像素、离焦和系统 MTF 曲线"
    });
    svg.appendChild(svgElement(api, "title", {}, "MTF 级联与奈奎斯特边界"));
    var left = 48, right = 692, top = 28, bottom = 245;
    var xMap = function (value) { return left + value / 180 * (right - left); };
    var yMap = function (value) { return bottom - clamp(value, 0, 1) * (bottom - top); };
    [0, .25, .5, .75, 1].forEach(function (value) {
      var y = yMap(value);
      svg.appendChild(svgElement(api, "line", { x1: left, y1: y, x2: right, y2: y, "class": "cl-grid" }));
      svg.appendChild(svgElement(api, "text", { x: left - 8, y: y + 4, "text-anchor": "end", "font-size": 11 }, fmt(value, 2)));
    });
    [0, 45, 90, 135, 180].forEach(function (value) {
      var x = xMap(value);
      svg.appendChild(svgElement(api, "line", { x1: x, y1: top, x2: x, y2: bottom, "class": "cl-grid" }));
      svg.appendChild(svgElement(api, "text", { x: x, y: bottom + 22, "text-anchor": "middle", "font-size": 11 }, String(value)));
    });
    svg.appendChild(svgElement(api, "line", { x1: left, y1: bottom, x2: right, y2: bottom, "class": "cl-axis" }));
    svg.appendChild(svgElement(api, "line", { x1: left, y1: top, x2: left, y2: bottom, "class": "cl-axis" }));
    var curves = [
      { cls: "pmtf-blue", fn: function (f) { return lensMtf(f, data.lensQuality); } },
      { cls: "pmtf-gold", fn: function (f) { return pixelMtf(f, data.pixelPitch); } },
      { cls: "pmtf-red", fn: function (f) { return blurMtf(f, data.blur); } },
      { cls: "pmtf-green", fn: function (f) { return curves[0].fn(f) * curves[1].fn(f) * curves[2].fn(f); } }
    ];
    curves.forEach(function (curve) {
      var points = [];
      for (var index = 0; index <= 72; index += 1) {
        var frequency = index * 2.5;
        points.push({ x: frequency, y: curve.fn(frequency) });
      }
      svg.appendChild(svgElement(api, "path", {
        d: pathFor(points, xMap, yMap),
        "class": "pmtf-line " + curve.cls
      }));
    });
    var nyquistX = xMap(Math.min(180, data.nyquist));
    svg.appendChild(svgElement(api, "line", { x1: nyquistX, y1: top, x2: nyquistX, y2: bottom, "class": "pmtf-boundary" }));
    svg.appendChild(svgElement(api, "text", { x: nyquistX + 5, y: top + 14, "font-size": 11 }, "fN=" + fmt(data.nyquist, 0)));
    var markerX = xMap(data.frequency);
    svg.appendChild(svgElement(api, "line", { x1: markerX, y1: top, x2: markerX, y2: bottom, "class": "pmtf-marker" }));
    svg.appendChild(svgElement(api, "circle", { cx: markerX, cy: yMap(data.system), r: 5, "class": "pmtf-point" }));
    svg.appendChild(svgElement(api, "text", { x: right, y: 18, "text-anchor": "end", "font-size": 12 }, "MTF"));
    svg.appendChild(svgElement(api, "text", { x: right, y: bottom + 42, "text-anchor": "end", "font-size": 11 }, "空间频率（lp/mm）"));
    return svg;
  }

  function appendMetric(api, parent, label, value) {
    parent.appendChild(element(api, "div", { className: "pmtf-metric" }, [
      element(api, "span", { text: label }),
      element(api, "strong", { text: value })
    ]));
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    var state = {
      frequency: DEFAULT.frequency,
      pixelPitch: DEFAULT.pixelPitch,
      lensQuality: DEFAULT.lensQuality,
      blur: DEFAULT.blur,
      revealed: false,
      answers: {}
    };
    var shell = element(api, "div", { className: "pmtf-lab" });
    shell.appendChild(element(api, "h3", { text: "MTF 预算：哪一环先让细节消失？" }));
    shell.appendChild(element(api, "p", { className: "pmtf-note", text: "固定解析模型：这是非相干强度成像的预采样 MTF 代理；先预测默认条纹是否混叠，再查看各级 OTF 相乘后的系统响应。镜头质量尺度不是由 NA 与波长计算的硬截止。" }));
    var gate = element(api, "div", { className: "pmtf-prompt" });
    var questions = [
      { id: "nyquist", title: "默认 p=5 μm、f=80 lp/mm：它是否低于奈奎斯特？", choices: [["safe", "低于，尚未混叠"], ["alias", "高于，已经混叠"]] },
      { id: "cascade", title: "0.67、0.76、0.87 级联后的 MTF 应如何判断？", choices: [["product", "相乘，不能超过最差一环"], ["sum", "相加，可能超过 1"]] },
      { id: "recover", title: "120 lp/mm 超过奈奎斯特后，算法能否无条件恢复原始高频？", choices: [["no", "不能，先发生频率折叠"], ["yes", "能，MTF 越高就能恢复"]] }
    ];
    var questionButtons = {};
    questions.forEach(function (question) {
      var field = element(api, "fieldset");
      field.appendChild(element(api, "legend", { text: question.title }));
      var choices = element(api, "div", { className: "pmtf-choice-grid" });
      questionButtons[question.id] = [];
      question.choices.forEach(function (choice) {
        var button = element(api, "button", { type: "button", text: choice[1], "aria-pressed": "false" });
        button.addEventListener("click", function () {
          state.answers[question.id] = choice[0];
          renderGate();
        });
        questionButtons[question.id].push({ value: choice[0], node: button });
        choices.appendChild(button);
      });
      field.appendChild(choices);
      gate.appendChild(field);
    });
    var actions = element(api, "div", { className: "pmtf-actions" });
    var check = element(api, "button", { type: "button", className: "pmtf-primary", text: "核对预测" });
    var reset = element(api, "button", { type: "button", text: "重置预测" });
    var feedback = element(api, "p", { className: "pmtf-feedback", "aria-live": "polite" });
    actions.appendChild(check);
    actions.appendChild(reset);
    gate.appendChild(actions);
    gate.appendChild(feedback);
    shell.appendChild(gate);
    var results = element(api, "div", { className: "pmtf-results" });
    results.hidden = true;
    shell.appendChild(results);
    root.replaceChildren(shell);

    function renderGate() {
      questions.forEach(function (question) {
        questionButtons[question.id].forEach(function (entry) {
          entry.node.setAttribute("aria-pressed", state.answers[question.id] === entry.value ? "true" : "false");
        });
      });
      var complete = questions.every(function (question) { return state.answers[question.id]; });
      check.disabled = !complete;
      if (!state.revealed) {
        feedback.textContent = complete ? "预测已记录，点击“核对预测”查看曲线。" : "请先回答三个判断。";
        feedback.className = "pmtf-feedback";
      } else {
        var expected = { nyquist: "safe", cascade: "product", recover: "no" };
        var score = questions.reduce(function (total, question) {
          return total + (state.answers[question.id] === expected[question.id] ? 1 : 0);
        }, 0);
        feedback.textContent = "预测得分 " + score + "/" + questions.length + "。现在拖动参数，观察哪一环先成为瓶颈。";
        feedback.className = "pmtf-feedback " + (score === questions.length ? "pmtf-pass" : "pmtf-warn");
      }
    }

    function renderResults() {
      var data = experiment(state);
      clear(results);
      var layout = element(api, "div", { className: "pmtf-layout" });
      var controls = element(api, "div", { className: "pmtf-controls" });
      [
        ["frequency", "条纹频率", 10, 180, 5, " lp/mm", 0],
        ["pixelPitch", "像素间距", 2, 10, .5, " μm", 1],
        ["lensQuality", "镜头质量尺度", 45, 130, 5, " lp/mm", 0]
      ].forEach(function (spec) {
        var control = element(api, "div", { className: "pmtf-control" });
        var label = element(api, "label", { htmlFor: "pmtf-" + spec[0], text: spec[1] + "：" });
        var output = element(api, "output", { text: fmt(state[spec[0]], spec[6]) + spec[5] });
        label.appendChild(output);
        var input = element(api, "input", {
          id: "pmtf-" + spec[0],
          type: "range",
          min: spec[2],
          max: spec[3],
          step: spec[4],
          value: state[spec[0]],
          "aria-label": spec[1]
        });
        input.addEventListener("input", function () {
          state[spec[0]] = Number(input.value);
          renderResults();
        });
        control.appendChild(label);
        control.appendChild(input);
        controls.appendChild(control);
      });
      controls.appendChild(element(api, "p", { className: "pmtf-note", text: "离焦尺度固定为 150 lp/mm；改变像素间距会同时移动奈奎斯特边界。" }));
      var stage = element(api, "div", { className: "pmtf-stage" });
      var frame = element(api, "div", { className: "pmtf-frame" });
      frame.appendChild(buildChart(api, data));
      stage.appendChild(frame);
      stage.appendChild(element(api, "div", { className: "pmtf-legend" }, [
        element(api, "span", { className: "pmtf-blue" }, [element(api, "i", { className: "pmtf-swatch" }), "镜头"]),
        element(api, "span", { className: "pmtf-gold" }, [element(api, "i", { className: "pmtf-swatch" }), "像素"]),
        element(api, "span", { className: "pmtf-red" }, [element(api, "i", { className: "pmtf-swatch" }), "离焦"]),
        element(api, "span", { className: "pmtf-green" }, [element(api, "i", { className: "pmtf-swatch" }), "系统"])
      ]));
      layout.appendChild(controls);
      layout.appendChild(stage);
      results.appendChild(layout);
      var metrics = element(api, "div", { className: "pmtf-metrics" });
      appendMetric(api, metrics, "奈奎斯特", fmt(data.nyquist, 1) + " lp/mm");
      appendMetric(api, metrics, "当前预采样 MTF", fmt(data.system, 3));
      appendMetric(api, metrics, "折回频率", fmt(data.alias, 1) + " lp/mm");
      appendMetric(api, metrics, "采样状态", data.mixed ? "发生混叠" : "低于奈奎斯特");
      results.appendChild(metrics);
      var table = element(api, "table", { "aria-label": "当前 MTF 级联账本" });
      var head = element(api, "tr");
      ["环节", "响应", "解释"].forEach(function (label) { head.appendChild(element(api, "th", { scope: "col", text: label })); });
      table.appendChild(element(api, "thead", {}, [head]));
      var body = element(api, "tbody");
      [
        ["镜头", fmt(data.lens, 3), "质量尺度 " + fmt(data.lensQuality, 0) + " lp/mm"],
        ["像素孔径", fmt(data.pixel, 3), "p=" + fmt(data.pixelPitch, 1) + " μm"],
        ["离焦/抖动", fmt(data.blurValue, 3), "固定尺度 150 lp/mm"],
        ["系统乘积", fmt(data.system, 3), data.mixed ? "频率已超过采样边界" : "未发生折叠"]
      ].forEach(function (row) {
        var tr = element(api, "tr");
        row.forEach(function (value) { tr.appendChild(element(api, "td", { text: value })); });
        body.appendChild(tr);
      });
      table.appendChild(body);
      results.appendChild(table);
      results.appendChild(element(api, "p", { className: "pmtf-interpretation", text: data.mixed
        ? "当前频率已经超过奈奎斯特：系统 MTF 仍可能是非零的，但数字图像中的低频纹理不再能证明它来自原始高频。"
        : "当前频率尚未混叠；系统 MTF 是三环相乘后的对比度传递，不是把每一环的清晰度相加。" }));
    }

    check.addEventListener("click", function () {
      if (check.disabled) return;
      state.revealed = true;
      results.hidden = false;
      renderGate();
      renderResults();
      if (api.announce) api.announce(root, "MTF 预测已核对，曲线与频率账本已展开。");
    });
    reset.addEventListener("click", function () {
      state.revealed = false;
      state.answers = {};
      results.hidden = true;
      renderGate();
    });
    renderGate();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    var data = experiment(DEFAULT);
    assert(near(data.nyquist, 100), "default Nyquist frequency");
    assert(data.system <= data.lens + 1e-12, "cascade does not exceed lens MTF");
    assert(data.system <= data.pixel + 1e-12, "cascade does not exceed pixel MTF");
    assert(data.system <= data.blurValue + 1e-12, "cascade does not exceed blur MTF");
    assert(experiment({ frequency: 120, pixelPitch: 5, lensQuality: 90, blur: 150 }).mixed, "alias boundary");
    assert(near(experiment({ frequency: 120, pixelPitch: 5, lensQuality: 90, blur: 150 }).alias, 80), "folded frequency");
    assert(pixelMtf(0, 5) === 1, "pixel DC response");
    assert(data.transferModel === TRANSFER_MODEL, "transfer model is explicit");
    return { checks: checks };
  }

  return {
    experiment: experiment,
    lensMtf: lensMtf,
    pixelMtf: pixelMtf,
    TRANSFER_MODEL: TRANSFER_MODEL,
    mount: mount,
    selfTest: selfTest
  };
});

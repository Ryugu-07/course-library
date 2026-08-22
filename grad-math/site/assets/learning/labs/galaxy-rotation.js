(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("galaxy-rotation", exported.mount);
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
        "galaxy-rotation self-test: PASS (" +
          report.checks +
          " checks, " +
          report.radii +
          " radii)"
      );
    } catch (error) {
      console.error("galaxy-rotation self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : null,
  function () {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "cl-galaxy-rotation-style";
    var INSTANCE = 0;
    var DEFAULTS = {
      baryonMass: 4,
      diskScale: 1.5,
      haloSpeed: 1.15,
      coreRadius: 1.2,
      mondA0: 0.12,
      outerRadius: 12
    };

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function finite(value, name) {
      var number = Number(value);
      if (!Number.isFinite(number)) throw new TypeError(name + " must be finite");
      return number;
    }

    function range(value, min, max, name) {
      var number = finite(value, name);
      if (number < min || number > max) throw new RangeError(name + " must be in [" + min + ", " + max + "]");
      return number;
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function baryonEnclosed(radius, mass, scale) {
      var r = Math.max(0, finite(radius, "radius"));
      var m = range(mass, 0.1, 20, "baryonMass");
      var rd = range(scale, 0.2, 6, "diskScale");
      var x = r / rd;
      return m * (1 - Math.exp(-x) * (1 + x));
    }

    function baryonSpeed(radius, mass, scale) {
      var r = Math.max(1e-9, finite(radius, "radius"));
      return Math.sqrt(baryonEnclosed(r, mass, scale) / r);
    }

    function haloSpeed(radius, asymptoticSpeed, coreRadius) {
      var r = Math.max(0, finite(radius, "radius"));
      var speed = range(asymptoticSpeed, 0, 3, "haloSpeed");
      var core = range(coreRadius, 0.2, 6, "coreRadius");
      return speed * r / Math.sqrt(r * r + core * core);
    }

    function mondSpeed(radius, mass, scale, a0) {
      var r = Math.max(1e-9, finite(radius, "radius"));
      var acceleration0 = range(a0, 0.005, 1, "mondA0");
      var aNewton = baryonEnclosed(r, mass, scale) / (r * r);
      var acceleration = 0.5 * (aNewton + Math.sqrt(aNewton * aNewton + 4 * aNewton * acceleration0));
      return Math.sqrt(acceleration * r);
    }

    function logSlope(points, key) {
      var n = points.length;
      var first = points[Math.max(0, n - 8)];
      var last = points[n - 1];
      return Math.log(last[key] / first[key]) / Math.log(last.r / first.r);
    }

    function evaluate(input) {
      var source = input || {};
      var baryonMass = range(source.baryonMass === undefined ? DEFAULTS.baryonMass : source.baryonMass, 0.1, 20, "baryonMass");
      var diskScale = range(source.diskScale === undefined ? DEFAULTS.diskScale : source.diskScale, 0.2, 6, "diskScale");
      var haloSpeedValue = range(source.haloSpeed === undefined ? DEFAULTS.haloSpeed : source.haloSpeed, 0, 3, "haloSpeed");
      var coreRadius = range(source.coreRadius === undefined ? DEFAULTS.coreRadius : source.coreRadius, 0.2, 6, "coreRadius");
      var mondA0 = range(source.mondA0 === undefined ? DEFAULTS.mondA0 : source.mondA0, 0.005, 1, "mondA0");
      var outerRadius = range(source.outerRadius === undefined ? DEFAULTS.outerRadius : source.outerRadius, 6, 20, "outerRadius");
      var points = [];
      var count = 72;
      for (var i = 0; i < count; i += 1) {
        var r = 0.2 + (outerRadius - 0.2) * i / (count - 1);
        var vb = baryonSpeed(r, baryonMass, diskScale);
        var vh = haloSpeed(r, haloSpeedValue, coreRadius);
        var total = Math.sqrt(vb * vb + vh * vh);
        var mond = mondSpeed(r, baryonMass, diskScale, mondA0);
        points.push({
          r: r,
          baryon: vb,
          halo: vh,
          total: total,
          mond: mond,
          baryonMass: baryonEnclosed(r, baryonMass, diskScale),
          inferredMass: r * total * total
        });
      }
      var last = points[points.length - 1];
      return {
        baryonMass: baryonMass,
        diskScale: diskScale,
        haloSpeed: haloSpeedValue,
        coreRadius: coreRadius,
        mondA0: mondA0,
        outerRadius: outerRadius,
        points: points,
        baryonSlope: logSlope(points, "baryon"),
        totalSlope: logSlope(points, "total"),
        mondSlope: logSlope(points, "mond"),
        outerMassRatio: last.inferredMass / last.baryonMass,
        outerInferredMass: last.inferredMass,
        outerBaryonMass: last.baryonMass
      };
    }

    function expectedAnswers() {
      return {
        flatMass: "linear",
        identity: "not-particle",
        lensing: "projected",
        mond: "partial"
      };
    }

    function questions() {
      return [
        {
          key: "flatMass",
          prompt: "在球对称、圆轨道、Newton 引力 toy 中，平坦旋转曲线要求 M(<r) 如何增长？",
          choices: [
            { value: "linear", label: "近似正比于 r" },
            { value: "constant", label: "趋于常数" },
            { value: "inverse", label: "正比于 1/r" }
          ]
        },
        {
          key: "identity",
          prompt: "旋转曲线的质量缺口能否直接确定暗物质的粒子身份？",
          choices: [
            { value: "not-particle", label: "不能，只约束引力分布" },
            { value: "wimp", label: "能，必定是 WIMP" },
            { value: "axis", label: "能，必定是轴子" }
          ]
        },
        {
          key: "lensing",
          prompt: "引力透镜最直接给出的是什么？",
          choices: [
            { value: "projected", label: "模型下的投影引力质量" },
            { value: "orbit", label: "每颗恒星的三维轨道" },
            { value: "particle", label: "暗物质粒子种类" }
          ]
        },
        {
          key: "mond",
          prompt: "MOND 对许多星系曲线拟合成功，最稳妥的读法是什么？",
          choices: [
            { value: "partial", label: "是真实经验规律，但非全尺度判决" },
            { value: "all", label: "已解释所有宇宙证据" },
            { value: "none", label: "完全没有科学价值" }
          ]
        }
      ];
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) { checks += 1; assert(condition, message); }
      var report = evaluate(DEFAULTS);
      check(report.points.length === 72, "fixed radial grid");
      check(report.points.every(function (point) { return Number.isFinite(point.total) && point.total >= 0; }), "finite nonnegative speeds");
      check(report.points.every(function (point, index, list) { return index === 0 || point.baryonMass >= list[index - 1].baryonMass; }), "enclosed baryon mass is monotone");
      check(report.outerBaryonMass < DEFAULTS.baryonMass, "finite radius contains less than asymptotic baryon mass");
      check(report.outerBaryonMass > 0.99 * DEFAULTS.baryonMass, "default outer radius nearly saturates baryons");
      check(report.baryonSlope < -0.45 && report.baryonSlope > -0.55, "outer baryon curve is Keplerian");
      check(Math.abs(report.totalSlope) < 0.12, "halo-dominated default is nearly flat");
      check(report.outerMassRatio > 3, "flat toy infers more mass than visible baryons");
      var noHalo = evaluate({ haloSpeed: 0 });
      check(Math.abs(noHalo.totalSlope - noHalo.baryonSlope) < 1e-12, "zero halo reproduces baryon curve");
      check(Math.abs(noHalo.outerMassRatio - 1) < 1e-12, "Newtonian baryon-only inferred mass closes");
      var deepMond = evaluate({ baryonMass: 0.5, diskScale: 0.3, mondA0: 1, outerRadius: 20 });
      var end = deepMond.points[deepMond.points.length - 1];
      check(Math.abs(Math.pow(end.mond, 4) / (deepMond.baryonMass * deepMond.mondA0) - 1) < 0.08, "deep-MOND asymptotic v^4 relation");
      check(Math.abs(end.inferredMass - end.r * end.total * end.total) < 1e-12, "circular Newtonian mass identity");
      var answers = expectedAnswers();
      check(answers.flatMass === "linear", "flat-curve mass answer");
      check(answers.identity === "not-particle", "particle identity boundary");
      check(answers.lensing === "projected", "lensing answer");
      check(answers.mond === "partial", "MOND scope answer");
      var threw = false;
      try { evaluate({ diskScale: 0 }); } catch (error) { threw = error instanceof RangeError; }
      check(threw, "degenerate scale is rejected");
      threw = false;
      try { evaluate({ baryonMass: NaN }); } catch (error2) { threw = error2 instanceof TypeError; }
      check(threw, "non-finite mass is rejected");
      return { checks: checks, radii: report.points.length };
    }

    function element(doc, tag, attrs, children) {
      var node = doc.createElement(tag);
      Object.keys(attrs || {}).forEach(function (key) {
        if (key === "className") node.className = attrs[key];
        else node.setAttribute(key, attrs[key]);
      });
      if (children !== undefined && children !== null) {
        (Array.isArray(children) ? children : [children]).forEach(function (child) {
          node.appendChild(typeof child === "string" ? doc.createTextNode(child) : child);
        });
      }
      return node;
    }

    function svg(doc, tag, attrs) {
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
      return node;
    }

    function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

    function ensureStyle(doc) {
      if (doc.getElementById(STYLE_ID)) return;
      var style = element(doc, "style", { id: STYLE_ID });
      style.textContent = [
        ".gr-lab *,.gr-lab *::before,.gr-lab *::after{box-sizing:border-box}.gr-lab [hidden]{display:none!important}",
        ".gr-lab{--gr-blue:#2b6f91;--gr-red:#ad4747;--gr-green:#327d58;--gr-gold:#9d6d1b;min-width:0}.gr-lab h3,.gr-lab h4{margin:0;color:var(--fg);letter-spacing:0}.gr-lab h3{font-size:1.12rem}.gr-lab h4{margin-top:14px;font-size:1rem}.gr-lab p{margin:8px 0}.gr-lab .gr-note,.gr-lab .gr-feedback{font-size:13px;line-height:1.65;color:var(--fg-soft)}",
        ".gr-lab button,.gr-lab input{font:inherit;letter-spacing:0}.gr-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.gr-lab button:hover{border-color:var(--accent)}.gr-lab button:focus-visible,.gr-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.gr-lab button[aria-pressed=true],.gr-lab button.gr-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}",
        ".gr-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border)}.gr-lab legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.gr-lab .gr-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.gr-lab .gr-options button{font-size:12px}",
        ".gr-lab .gr-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--gr-gold);background:var(--block-bg,var(--bg))}.gr-lab .gr-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.gr-lab .gr-actions>*{flex:1 1 180px}",
        ".gr-lab .gr-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0}.gr-lab .gr-control{min-width:0;padding:9px;border:1px solid var(--border);border-radius:6px}.gr-lab .gr-control label{display:block;font-size:13px;font-weight:750}.gr-lab .gr-control output{float:right;font-variant-numeric:tabular-nums}.gr-lab .gr-control input{width:100%;min-height:44px;margin-top:4px}",
        ".gr-lab .gr-results{margin-top:14px}.gr-lab .gr-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,.8fr);gap:12px}.gr-lab .gr-panel{min-width:0;padding:11px;border:1px solid var(--border);border-radius:6px;background:var(--block-bg,var(--bg))}.gr-lab svg{display:block;width:100%;height:auto;min-height:260px}",
        ".gr-lab .gr-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:10px 0}.gr-lab .gr-metrics div{min-width:0;padding:9px;border:1px solid var(--border);border-radius:5px}.gr-lab .gr-metrics strong{display:block;font-size:1.06rem;overflow-wrap:anywhere}.gr-lab table{width:100%;border-collapse:collapse;font-size:13px}.gr-lab th,.gr-lab td{padding:7px;border:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere}.gr-lab .gr-pass{color:var(--gr-green);font-weight:750}.gr-lab .gr-warn{color:var(--gr-red);font-weight:750}",
        "@media(max-width:820px){.gr-lab .gr-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.gr-lab .gr-grid{grid-template-columns:1fr}}@media(max-width:560px){.gr-lab .gr-controls,.gr-lab .gr-options,.gr-lab .gr-metrics{grid-template-columns:1fr}.gr-lab svg{min-height:220px}}"
      ].join("");
      (doc.head || doc.documentElement).appendChild(style);
    }

    function renderChart(doc, host, report) {
      clear(host);
      var chart = svg(doc, "svg", { viewBox: "0 0 660 340", role: "img", "aria-label": "可见物质、暗晕与 MOND 的旋转曲线 toy" });
      var title = svg(doc, "title", {});
      title.textContent = "旋转曲线模型比较";
      chart.appendChild(title);
      var left = 58, right = 628, top = 28, bottom = 292;
      var maxV = Math.max.apply(null, report.points.map(function (point) { return Math.max(point.baryon, point.total, point.mond); })) * 1.12;
      function x(r) { return left + (right - left) * (r - 0.2) / (report.outerRadius - 0.2); }
      function y(v) { return bottom - (bottom - top) * v / maxV; }
      chart.appendChild(svg(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, stroke: "currentColor" }));
      chart.appendChild(svg(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, stroke: "currentColor" }));
      [0, 0.5, 1].forEach(function (fraction) {
        var value = fraction * maxV;
        chart.appendChild(svg(doc, "line", { x1: left - 5, y1: y(value), x2: right, y2: y(value), stroke: "currentColor", opacity: fraction === 0 ? 1 : 0.13 }));
        var label = svg(doc, "text", { x: left - 9, y: y(value) + 4, "text-anchor": "end", fill: "currentColor", "font-size": 11 });
        label.textContent = value.toFixed(1);
        chart.appendChild(label);
      });
      function pathFor(key, color, dash) {
        var d = report.points.map(function (point, index) { return (index ? "L" : "M") + x(point.r).toFixed(2) + " " + y(point[key]).toFixed(2); }).join(" ");
        var attrs = { d: d, fill: "none", stroke: color, "stroke-width": 3 };
        if (dash) attrs["stroke-dasharray"] = dash;
        chart.appendChild(svg(doc, "path", attrs));
      }
      pathFor("baryon", "#ad4747", "7 5");
      pathFor("total", "#2b6f91", null);
      pathFor("mond", "#327d58", "3 4");
      [["可见物质", "#ad4747", 86], ["可见+暗晕", "#2b6f91", 210], ["MOND toy", "#327d58", 350]].forEach(function (item) {
        chart.appendChild(svg(doc, "line", { x1: item[2], y1: 316, x2: item[2] + 28, y2: 316, stroke: item[1], "stroke-width": 4 }));
        var textNode = svg(doc, "text", { x: item[2] + 35, y: 320, fill: "currentColor", "font-size": 12 });
        textNode.textContent = item[0];
        chart.appendChild(textNode);
      });
      var xLabel = svg(doc, "text", { x: (left + right) / 2, y: 330, "text-anchor": "middle", fill: "currentColor", "font-size": 12 });
      xLabel.textContent = "半径 r（任意单位）";
      chart.appendChild(xLabel);
      host.appendChild(chart);
    }

    function renderResults(doc, host, report) {
      clear(host);
      var metrics = element(doc, "div", { className: "gr-metrics" });
      [
        ["可见曲线外缘斜率", report.baryonSlope.toFixed(3)],
        ["暗晕合成外缘斜率", report.totalSlope.toFixed(3)],
        ["推断/可见质量", report.outerMassRatio.toFixed(2) + "×"]
      ].forEach(function (item) {
        metrics.appendChild(element(doc, "div", {}, [element(doc, "span", { className: "gr-note" }, item[0]), element(doc, "strong", {}, item[1])]));
      });
      host.appendChild(metrics);
      var grid = element(doc, "div", { className: "gr-grid" });
      var chartPanel = element(doc, "section", { className: "gr-panel" }, [element(doc, "h4", {}, "三条模型曲线")]);
      var chart = element(doc, "div");
      chartPanel.appendChild(chart);
      renderChart(doc, chart, report);
      grid.appendChild(chartPanel);
      var ledger = element(doc, "section", { className: "gr-panel" }, [element(doc, "h4", {}, "结论分层")]);
      var table = element(doc, "table");
      var body = element(doc, "tbody");
      [
        ["观测量", "视线速度、光度、透镜剪切等原始/校准数据"],
        ["动力学反演", "在圆轨道、几何、倾角与引力模型下得到 M(<r)"],
        ["现象结论", "可见重子不足以同时解释多尺度引力证据"],
        ["尚未知", "额外成分的粒子身份，或最终引力理论的微观来源"]
      ].forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", {}, row[0]), element(doc, "td", {}, row[1])])); });
      table.appendChild(body);
      ledger.appendChild(table);
      ledger.appendChild(element(doc, "p", { className: "gr-note" }, "可见物质使用球对称化指数盘的 enclosed-mass toy，不是精确薄盘势；暗晕使用有核平坦速度 toy；MOND 使用 simple interpolation。模型比较服务于量纲与证据边界。"));
      grid.appendChild(ledger);
      host.appendChild(grid);
    }

    function mount(root, api) {
      if (!root || !root.ownerDocument) return;
      var doc = root.ownerDocument;
      ensureStyle(doc);
      INSTANCE += 1;
      var serial = INSTANCE;
      var state = {
        baryonMass: DEFAULTS.baryonMass,
        diskScale: DEFAULTS.diskScale,
        haloSpeed: DEFAULTS.haloSpeed,
        coreRadius: DEFAULTS.coreRadius,
        mondA0: DEFAULTS.mondA0,
        outerRadius: DEFAULTS.outerRadius,
        answers: { flatMass: null, identity: null, lensing: null, mond: null }
      };
      clear(root);
      root.classList.add("gr-lab");
      var shell = element(doc, "div");
      shell.appendChild(element(doc, "h3", {}, "旋转曲线反演台：观测、引力质量与粒子身份不是同一本账"));
      shell.appendChild(element(doc, "p", { className: "gr-note" }, "先回答四个判读问题，再调节重子盘、暗晕和 MOND toy。结果展示的是模型条件下的曲线与质量反演，不是暗物质粒子的直接成像。"));
      var prediction = element(doc, "section", { className: "gr-prediction", "aria-labelledby": "gr-prediction-title-" + serial });
      prediction.appendChild(element(doc, "strong", { id: "gr-prediction-title-" + serial }, "预测门：平坦曲线究竟证明了哪一层？"));
      var questionList = element(doc, "div");
      prediction.appendChild(questionList);
      var reveal = element(doc, "button", { type: "button", className: "gr-primary" }, "核对预测并揭示");
      var reset = element(doc, "button", { type: "button" }, "重置实验");
      prediction.appendChild(element(doc, "div", { className: "gr-actions" }, [reveal, reset]));
      var status = element(doc, "p", { className: "gr-feedback", "aria-live": "polite" }, "先回答四项预测。" );
      prediction.appendChild(status);
      shell.appendChild(prediction);

      var controls = element(doc, "section", { className: "gr-controls", "aria-label": "旋转曲线 toy 参数" });
      function rangeControl(key, label, min, max, step) {
        var box = element(doc, "div", { className: "gr-control" });
        var id = "gr-" + key + "-" + serial;
        var output = element(doc, "output", { for: id });
        box.appendChild(element(doc, "label", { for: id }, [label, output]));
        var input = element(doc, "input", { id: id, type: "range", min: min, max: max, step: step });
        box.appendChild(input);
        controls.appendChild(box);
        return { key: key, input: input, output: output };
      }
      var ranges = [
        rangeControl("baryonMass", "可见质量", 0.5, 12, 0.1),
        rangeControl("diskScale", "盘尺度", 0.3, 5, 0.1),
        rangeControl("haloSpeed", "暗晕渐近速度", 0, 2.5, 0.05),
        rangeControl("coreRadius", "暗晕核半径", 0.3, 5, 0.1),
        rangeControl("mondA0", "MOND a0", 0.01, 0.6, 0.01),
        rangeControl("outerRadius", "观测外缘", 6, 20, 1)
      ];
      shell.appendChild(controls);
      var results = element(doc, "section", { className: "gr-results", hidden: "hidden", "aria-live": "polite" });
      shell.appendChild(results);
      root.appendChild(shell);

      function renderQuestions() {
        clear(questionList);
        questions().forEach(function (question) {
          var fieldset = element(doc, "fieldset");
          fieldset.appendChild(element(doc, "legend", {}, question.prompt));
          var options = element(doc, "div", { className: "gr-options", role: "group", "aria-label": question.prompt });
          question.choices.forEach(function (choice) {
            var button = element(doc, "button", { type: "button", "aria-pressed": state.answers[question.key] === choice.value ? "true" : "false" }, choice.label);
            button.addEventListener("click", function () {
              state.answers[question.key] = choice.value;
              results.hidden = true;
              status.className = "gr-feedback";
              status.textContent = "预测已记录；完成四项后再揭示。";
              renderQuestions();
            });
            options.appendChild(button);
          });
          fieldset.appendChild(options);
          questionList.appendChild(fieldset);
        });
      }

      function renderControls() {
        ranges.forEach(function (item) {
          item.input.value = state[item.key];
          item.output.textContent = Number(state[item.key]).toFixed(item.key === "outerRadius" ? 0 : 2);
        });
      }

      ranges.forEach(function (item) {
        item.input.addEventListener("input", function () {
          state[item.key] = Number(item.input.value);
          item.output.textContent = Number(state[item.key]).toFixed(item.key === "outerRadius" ? 0 : 2);
          results.hidden = true;
          status.className = "gr-feedback";
          status.textContent = "模型参数已改变，请重新核对预测。";
        });
      });

      reveal.addEventListener("click", function () {
        var keys = Object.keys(state.answers);
        if (keys.some(function (key) { return state.answers[key] === null; })) {
          status.className = "gr-feedback gr-warn";
          status.textContent = "请先回答四项预测。";
          if (api && typeof api.announce === "function") api.announce(root, status.textContent);
          return;
        }
        var expected = expectedAnswers();
        var score = keys.reduce(function (total, key) { return total + (state.answers[key] === expected[key] ? 1 : 0); }, 0);
        renderResults(doc, results, evaluate(state));
        results.hidden = false;
        status.className = "gr-feedback " + (score === keys.length ? "gr-pass" : "gr-warn");
        status.textContent = "已揭示：命中 " + score + "/" + keys.length + "；曲线、质量反演与微观身份已分账。";
        if (api && typeof api.announce === "function") api.announce(root, status.textContent);
      });

      reset.addEventListener("click", function () {
        state = {
          baryonMass: DEFAULTS.baryonMass,
          diskScale: DEFAULTS.diskScale,
          haloSpeed: DEFAULTS.haloSpeed,
          coreRadius: DEFAULTS.coreRadius,
          mondA0: DEFAULTS.mondA0,
          outerRadius: DEFAULTS.outerRadius,
          answers: { flatMass: null, identity: null, lensing: null, mond: null }
        };
        renderQuestions();
        renderControls();
        results.hidden = true;
        status.className = "gr-feedback";
        status.textContent = "已重置到延展暗晕 toy。";
        if (api && typeof api.announce === "function") api.announce(root, status.textContent);
      });

      renderQuestions();
      renderControls();
    }

    return {
      DEFAULTS: DEFAULTS,
      baryonEnclosed: baryonEnclosed,
      baryonSpeed: baryonSpeed,
      haloSpeed: haloSpeed,
      mondSpeed: mondSpeed,
      evaluate: evaluate,
      expectedAnswers: expectedAnswers,
      mount: mount,
      selfTest: selfTest
    };
  }
);

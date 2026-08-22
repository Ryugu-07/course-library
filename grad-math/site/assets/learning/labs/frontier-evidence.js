(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("frontier-evidence", exported.mount);
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
        "frontier-evidence self-test: PASS (" +
          report.checks +
          " checks, " +
          report.claims +
          " claims)"
      );
    } catch (error) {
      console.error("frontier-evidence self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : null,
  function (host) {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "cl-frontier-evidence-style";
    var INSTANCE = 0;

    var DEFAULTS = {
      claimId: "quantum-gravity",
      energyExp: 4,
      scaleExp: 19,
      couplingExp: 0,
      precisionExp: 15
    };

    var CLAIMS = [
      {
        id: "quantum-gravity",
        label: "Planck 尺度量子引力",
        phenomenon: "GR 与量子理论都指向需要更高能的统一描述。",
        evidence: "问题与低能有效场论成立；UV 完成尚无实验判决。",
        boundary: "候选框架的内部自洽或数学产出不等于自然界已选择它。"
      },
      {
        id: "dark-matter",
        label: "暗物质粒子身份",
        phenomenon: "旋转曲线、透镜、CMB 与结构形成给出共同引力证据。",
        evidence: "额外引力源这一现象证据强；微观粒子身份仍未知。",
        boundary: "确认现象不能自动确认任一 WIMP、轴子或其他候选。"
      },
      {
        id: "supersymmetry",
        label: "低能超对称",
        phenomenon: "它可改善部分自然性问题并提供候选暗物质粒子。",
        evidence: "搜索的零结果排除了被检验的质量与耦合区域。",
        boundary: "零结果压缩参数空间，不等于逻辑上排除全部 SUSY 实现。"
      },
      {
        id: "proton-decay",
        label: "质子衰变与简单 GUT",
        phenomenon: "许多统一模型给出可检验的质子衰变通道。",
        evidence: "寿命下限能够排除作出过快衰变预言的模型区域。",
        boundary: "一个 GUT 实现失败，不推出所有统一思想都失败。"
      },
      {
        id: "holography",
        label: "全息对偶",
        phenomenon: "特定引力理论与低维量子场论存在精确或受控对偶。",
        evidence: "在规定模型中的数学/理论证据很强，并可作计算工具。",
        boundary: "特定 AdS/CFT 对偶不直接证明真实宇宙就是该模型。"
      }
    ];

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function finiteNumber(value, name) {
      var number = Number(value);
      if (!Number.isFinite(number)) throw new TypeError(name + " must be finite");
      return number;
    }

    function inRange(value, min, max, name) {
      var number = finiteNumber(value, name);
      if (number < min || number > max) {
        throw new RangeError(name + " must be in [" + min + ", " + max + "]");
      }
      return number;
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function findClaim(id) {
      for (var i = 0; i < CLAIMS.length; i += 1) {
        if (CLAIMS[i].id === id) return CLAIMS[i];
      }
      throw new RangeError("unknown claim: " + id);
    }

    function evaluate(input) {
      var source = input || {};
      var claim = findClaim(source.claimId || DEFAULTS.claimId);
      var energyExp = inRange(
        source.energyExp === undefined ? DEFAULTS.energyExp : source.energyExp,
        0,
        19,
        "energyExp"
      );
      var scaleExp = inRange(
        source.scaleExp === undefined ? DEFAULTS.scaleExp : source.scaleExp,
        3,
        19,
        "scaleExp"
      );
      var couplingExp = inRange(
        source.couplingExp === undefined ? DEFAULTS.couplingExp : source.couplingExp,
        -6,
        0,
        "couplingExp"
      );
      var precisionExp = inRange(
        source.precisionExp === undefined ? DEFAULTS.precisionExp : source.precisionExp,
        1,
        18,
        "precisionExp"
      );

      var ratioLog = energyExp - scaleExp;
      var logSignal = couplingExp + 2 * ratioLog;
      var logFloor = -precisionExp;
      // A visible teaching threshold, not a universal EFT convergence theorem.
      var controlled = ratioLog <= -0.5;
      var testable = controlled && logSignal >= logFloor;
      var status = !controlled
        ? "out-of-domain"
        : testable
          ? "detectable"
          : "below-sensitivity";
      var maxIndirectScaleExp = energyExp + (precisionExp + couplingExp) / 2;

      return {
        claim: claim,
        energyExp: energyExp,
        scaleExp: scaleExp,
        couplingExp: couplingExp,
        precisionExp: precisionExp,
        ratioLog: ratioLog,
        logSignal: logSignal,
        logFloor: logFloor,
        controlled: controlled,
        testable: testable,
        status: status,
        maxIndirectScaleExp: maxIndirectScaleExp
      };
    }

    function expectedAnswers() {
      return {
        distinct: "required",
        nullResult: "region",
        consistency: "not-evidence",
        indirect: "conditional"
      };
    }

    function questionSpecs() {
      return [
        {
          key: "distinct",
          prompt: "一个框架要获得新的经验支持，是否需要可区分于既有理论的预言？",
          choices: [
            { value: "required", label: "需要可区分预言" },
            { value: "beauty", label: "数学优美就足够" },
            { value: "citation", label: "引用很多就足够" }
          ]
        },
        {
          key: "nullResult",
          prompt: "一次搜索没有发现信号，最直接排除的是什么？",
          choices: [
            { value: "region", label: "被检验的参数区域" },
            { value: "all", label: "整个思想家族" },
            { value: "nothing", label: "什么也没学到" }
          ]
        },
        {
          key: "consistency",
          prompt: "理论内部自洽与经验确认之间是什么关系？",
          choices: [
            { value: "not-evidence", label: "必要但不是经验确认" },
            { value: "same", label: "二者完全相同" },
            { value: "irrelevant", label: "自洽毫无意义" }
          ]
        },
        {
          key: "indirect",
          prompt: "低能精密实验能否约束更高能的新物理？",
          choices: [
            { value: "conditional", label: "可在模型桥梁下约束" },
            { value: "never", label: "绝对不可能" },
            { value: "always", label: "总能直接发现" }
          ]
        }
      ];
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) {
        checks += 1;
        assert(condition, message);
      }

      var baseline = evaluate(DEFAULTS);
      check(baseline.status === "below-sensitivity", "Planck baseline is below sensitivity");
      check(baseline.controlled, "Planck baseline stays inside the EFT toy domain");
      check(baseline.logSignal === -30, "dimension-six toy scaling is exact");
      check(baseline.logFloor === -15, "precision floor uses the declared exponent");
      check(baseline.maxIndirectScaleExp === 11.5, "indirect reach solves the signal inequality");

      var detectable = evaluate({ energyExp: 4, scaleExp: 8, couplingExp: -2, precisionExp: 12 });
      check(detectable.logSignal === -10, "detectable fixture signal");
      check(detectable.status === "detectable", "detectable fixture classification");
      check(detectable.testable, "detectable fixture boolean");

      var boundary = evaluate({ energyExp: 4, scaleExp: 8, couplingExp: -2, precisionExp: 10 });
      check(boundary.status === "detectable", "equality with the floor is detectable");
      var hidden = evaluate({ energyExp: 4, scaleExp: 8, couplingExp: -2, precisionExp: 9 });
      check(hidden.status === "below-sensitivity", "signal below the floor stays hidden");

      var outside = evaluate({ energyExp: 10, scaleExp: 9, couplingExp: 0, precisionExp: 8 });
      check(outside.status === "out-of-domain", "E at or above the scale invalidates the EFT toy");
      check(!outside.testable, "out-of-domain arithmetic is not a test certificate");

      var answers = expectedAnswers();
      check(answers.distinct === "required", "distinct prediction answer");
      check(answers.nullResult === "region", "null-result answer");
      check(answers.consistency === "not-evidence", "consistency answer");
      check(answers.indirect === "conditional", "indirect constraint answer");
      check(findClaim("dark-matter").evidence.indexOf("现象证据强") >= 0, "phenomenon and identity are separated");
      check(findClaim("supersymmetry").boundary.indexOf("全部") >= 0, "parameter-region boundary is explicit");

      var threw = false;
      try { evaluate({ claimId: "missing" }); } catch (error) { threw = error instanceof RangeError; }
      check(threw, "unknown claims are rejected");
      threw = false;
      try { evaluate({ precisionExp: NaN }); } catch (error2) { threw = error2 instanceof TypeError; }
      check(threw, "non-finite inputs are rejected");
      threw = false;
      try { evaluate({ couplingExp: 1 }); } catch (error3) { threw = error3 instanceof RangeError; }
      check(threw, "out-of-range couplings are rejected");

      return { checks: checks, claims: CLAIMS.length };
    }

    function element(doc, tag, attributes, children) {
      var node = doc.createElement(tag);
      var attrs = attributes || {};
      Object.keys(attrs).forEach(function (key) {
        if (key === "className") node.className = attrs[key];
        else if (key === "textContent") node.textContent = attrs[key];
        else node.setAttribute(key, attrs[key]);
      });
      if (children !== undefined && children !== null) {
        var list = Array.isArray(children) ? children : [children];
        list.forEach(function (child) {
          node.appendChild(typeof child === "string" ? doc.createTextNode(child) : child);
        });
      }
      return node;
    }

    function svgElement(doc, tag, attributes) {
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attributes || {}).forEach(function (key) {
        node.setAttribute(key, attributes[key]);
      });
      return node;
    }

    function clear(node) {
      while (node.firstChild) node.removeChild(node.firstChild);
    }

    function ensureStyle(doc) {
      if (doc.getElementById(STYLE_ID)) return;
      var style = element(doc, "style", { id: STYLE_ID });
      style.textContent = [
        ".fe-lab *,.fe-lab *::before,.fe-lab *::after{box-sizing:border-box}",
        ".fe-lab [hidden]{display:none!important}",
        ".fe-lab{--fe-blue:#246b91;--fe-green:#2f7d55;--fe-red:#aa3e3e;--fe-gold:#9b6b16;min-width:0}",
        ".fe-lab h3,.fe-lab h4{margin:0;color:var(--fg);letter-spacing:0}.fe-lab h3{font-size:1.12rem}.fe-lab h4{margin-top:14px;font-size:1rem}",
        ".fe-lab p{margin:8px 0}.fe-lab .fe-note,.fe-lab .fe-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65}",
        ".fe-lab button,.fe-lab select,.fe-lab input{font:inherit;letter-spacing:0}.fe-lab button,.fe-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}",
        ".fe-lab button:hover{border-color:var(--accent)}.fe-lab button:focus-visible,.fe-lab select:focus-visible,.fe-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
        ".fe-lab button[aria-pressed=true],.fe-lab button.fe-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}",
        ".fe-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border)}.fe-lab legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}",
        ".fe-lab .fe-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.fe-lab .fe-options button{font-size:12px}",
        ".fe-lab .fe-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--fe-gold);background:var(--block-bg,var(--bg))}.fe-lab .fe-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.fe-lab .fe-actions>*{flex:1 1 180px}",
        ".fe-lab .fe-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px}.fe-lab .fe-control{min-width:0;padding:10px;border:1px solid var(--border);border-radius:6px}.fe-lab .fe-control label{display:block;font-size:13px;font-weight:750}.fe-lab .fe-control output{float:right;font-variant-numeric:tabular-nums}.fe-lab .fe-control input{width:100%;min-height:44px;margin-top:4px}.fe-lab .fe-control select{width:100%;margin-top:6px}",
        ".fe-lab .fe-results{margin-top:14px}.fe-lab .fe-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:12px}.fe-lab .fe-panel{min-width:0;padding:11px;border:1px solid var(--border);border-radius:6px;background:var(--block-bg,var(--bg))}",
        ".fe-lab svg{display:block;width:100%;height:auto;min-height:220px}.fe-lab .fe-metric{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:10px 0}.fe-lab .fe-metric div{min-width:0;padding:9px;border:1px solid var(--border);border-radius:5px}.fe-lab .fe-metric strong{display:block;font-size:1.05rem;overflow-wrap:anywhere}",
        ".fe-lab table{width:100%;border-collapse:collapse;font-size:13px}.fe-lab th,.fe-lab td{padding:7px;border:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere}.fe-lab .fe-pass{color:var(--fe-green);font-weight:750}.fe-lab .fe-warn{color:var(--fe-red);font-weight:750}",
        "@media(max-width:760px){.fe-lab .fe-grid,.fe-lab .fe-controls{grid-template-columns:1fr}.fe-lab .fe-options{grid-template-columns:1fr}.fe-lab .fe-metric{grid-template-columns:1fr}.fe-lab svg{min-height:190px}}"
      ].join("");
      (doc.head || doc.documentElement).appendChild(style);
    }

    function formatPower(exp) {
      return "10^" + Number(exp).toFixed(Number(exp) % 1 ? 1 : 0);
    }

    function renderEnergyChart(doc, container, report) {
      clear(container);
      var svg = svgElement(doc, "svg", {
        viewBox: "0 0 640 230",
        role: "img",
        "aria-label": "实验能标、新物理尺度与间接灵敏度范围"
      });
      var title = svgElement(doc, "title", {});
      title.textContent = "能标账本：直接能量、候选尺度和精密实验的间接触及";
      svg.appendChild(title);
      var left = 52;
      var right = 606;
      var y = 118;
      function x(exp) { return left + (right - left) * clamp(exp / 19, 0, 1); }
      var axis = svgElement(doc, "line", { x1: left, y1: y, x2: right, y2: y, stroke: "currentColor", "stroke-width": 2 });
      svg.appendChild(axis);
      [0, 4, 8, 12, 16, 19].forEach(function (tick) {
        svg.appendChild(svgElement(doc, "line", { x1: x(tick), y1: y - 6, x2: x(tick), y2: y + 7, stroke: "currentColor" }));
        var label = svgElement(doc, "text", { x: x(tick), y: y + 25, "text-anchor": "middle", fill: "currentColor", "font-size": 12 });
        label.textContent = "10^" + tick;
        svg.appendChild(label);
      });
      var reach = report.maxIndirectScaleExp;
      var reachPlot = clamp(reach, 0, 19);
      var reachOutsideAxis = reach < 0 || reach > 19;
      svg.appendChild(svgElement(doc, "rect", { x: left, y: 72, width: Math.max(1, x(reachPlot) - left), height: 18, rx: 4, fill: "#2f7d55", opacity: 0.35 }));
      var reachLabel = svgElement(doc, "text", { x: x(reachPlot), y: 66, "text-anchor": reach < 0 ? "start" : "end", fill: "currentColor", "font-size": 12 });
      reachLabel.textContent = "toy 间接触及 ≤ 10^" + reach.toFixed(1) + " GeV" + (reachOutsideAxis ? "（超出图轴）" : "");
      svg.appendChild(reachLabel);
      [
        { exp: report.energyExp, y: 104, color: "#246b91", label: "直接能量 E" },
        { exp: report.scaleExp, y: 104, color: "#aa3e3e", label: "候选尺度 Λ" }
      ].forEach(function (mark) {
        svg.appendChild(svgElement(doc, "circle", { cx: x(mark.exp), cy: mark.y, r: 7, fill: mark.color }));
        var textNode = svgElement(doc, "text", { x: x(mark.exp), y: mark.y - 16, "text-anchor": "middle", fill: "currentColor", "font-size": 12 });
        textNode.textContent = mark.label;
        svg.appendChild(textNode);
      });
      var note = svgElement(doc, "text", { x: left, y: 184, fill: "currentColor", "font-size": 13 });
      note.textContent = "绿色区不是直接生产粒子，而是给定算符与耦合假设后的精密约束范围。";
      svg.appendChild(note);
      var domain = svgElement(doc, "text", { x: left, y: 207, fill: report.controlled ? "#2f7d55" : "#aa3e3e", "font-size": 13, "font-weight": 700 });
      domain.textContent = report.controlled
        ? "通过教学阈值 E/Λ≤10^-0.5；真实误差仍需 Wilson 系数与截断阶数"
        : "未通过教学阈值；本 toy 不再签发 EFT 适用证书";
      svg.appendChild(domain);
      container.appendChild(svg);
    }

    function renderResults(doc, container, report) {
      clear(container);
      var statusText = report.status === "detectable"
        ? "在 toy 假设下可检验"
        : report.status === "below-sensitivity"
          ? "信号低于当前 toy 灵敏度"
          : "已越过 EFT toy 适用域";
      var metrics = element(doc, "div", { className: "fe-metric" });
      [
        ["信号量级", formatPower(report.logSignal)],
        ["测量底噪", formatPower(report.logFloor)],
        ["判决", statusText]
      ].forEach(function (item) {
        metrics.appendChild(element(doc, "div", {}, [
          element(doc, "span", { className: "fe-note" }, item[0]),
          element(doc, "strong", {}, item[1])
        ]));
      });
      container.appendChild(metrics);

      var grid = element(doc, "div", { className: "fe-grid" });
      var chartPanel = element(doc, "section", { className: "fe-panel" }, [element(doc, "h4", {}, "能标与灵敏度")]);
      var chart = element(doc, "div");
      chartPanel.appendChild(chart);
      renderEnergyChart(doc, chart, report);
      grid.appendChild(chartPanel);

      var ledger = element(doc, "section", { className: "fe-panel" }, [element(doc, "h4", {}, report.claim.label)]);
      var table = element(doc, "table");
      var body = element(doc, "tbody");
      [
        ["现象/动机", report.claim.phenomenon],
        ["当前证据", report.claim.evidence],
        ["不能越过", report.claim.boundary],
        ["toy 结论", statusText]
      ].forEach(function (row) {
        body.appendChild(element(doc, "tr", {}, [element(doc, "th", {}, row[0]), element(doc, "td", {}, row[1])]));
      });
      table.appendChild(body);
      ledger.appendChild(table);
      ledger.appendChild(element(doc, "p", { className: "fe-note" }, "公式使用一个维数六算符的透明缩放：log10(signal)=log10(c)+2 log10(E/Λ)。它教学的是量纲与可检验性，不是任何具体实验的实时排除曲线。"));
      grid.appendChild(ledger);
      container.appendChild(grid);
    }

    function mount(root, api) {
      if (!root || !root.ownerDocument) return;
      var doc = root.ownerDocument;
      ensureStyle(doc);
      INSTANCE += 1;
      var serial = INSTANCE;
      var state = {
        claimId: DEFAULTS.claimId,
        energyExp: DEFAULTS.energyExp,
        scaleExp: DEFAULTS.scaleExp,
        couplingExp: DEFAULTS.couplingExp,
        precisionExp: DEFAULTS.precisionExp,
        answers: { distinct: null, nullResult: null, consistency: null, indirect: null },
        revealed: false
      };

      clear(root);
      root.classList.add("fe-lab");
      var shell = element(doc, "div");
      shell.appendChild(element(doc, "h3", {}, "证据分级台：能标差距不等于无法做科学"));
      shell.appendChild(element(doc, "p", { className: "fe-note" }, "先判读四条认识论命题，再用透明的有效算符 toy 检查直接能量、测量精度与新物理尺度如何共同决定可检验性。"));

      var prediction = element(doc, "section", { className: "fe-prediction", "aria-labelledby": "fe-prediction-title-" + serial });
      prediction.appendChild(element(doc, "strong", { id: "fe-prediction-title-" + serial }, "预测门：先把理论价值与经验证据分账"));
      var questionList = element(doc, "div");
      prediction.appendChild(questionList);
      var reveal = element(doc, "button", { type: "button", className: "fe-primary" }, "核对预测并揭示");
      var reset = element(doc, "button", { type: "button" }, "重置实验");
      prediction.appendChild(element(doc, "div", { className: "fe-actions" }, [reveal, reset]));
      var status = element(doc, "p", { className: "fe-feedback", "aria-live": "polite", "aria-atomic": "true" }, "先回答四项预测。" );
      prediction.appendChild(status);
      shell.appendChild(prediction);

      var controls = element(doc, "section", { className: "fe-controls", "aria-label": "有效场论 toy 参数" });
      var claimControl = element(doc, "div", { className: "fe-control" });
      claimControl.appendChild(element(doc, "label", { for: "fe-claim-" + serial }, "判读对象"));
      var claimSelect = element(doc, "select", { id: "fe-claim-" + serial });
      CLAIMS.forEach(function (claim) { claimSelect.appendChild(element(doc, "option", { value: claim.id }, claim.label)); });
      claimControl.appendChild(claimSelect);
      controls.appendChild(claimControl);

      function rangeControl(key, label, min, max, step, formatter) {
        var box = element(doc, "div", { className: "fe-control" });
        var id = "fe-" + key + "-" + serial;
        var output = element(doc, "output", { for: id });
        var labelNode = element(doc, "label", { for: id }, [label, output]);
        var input = element(doc, "input", { id: id, type: "range", min: min, max: max, step: step });
        box.appendChild(labelNode);
        box.appendChild(input);
        controls.appendChild(box);
        return { key: key, input: input, output: output, formatter: formatter };
      }

      var ranges = [
        rangeControl("energyExp", "直接实验 log10(E/GeV)", 0, 19, 1, function (value) { return Number(value).toFixed(0); }),
        rangeControl("scaleExp", "新物理 log10(Λ/GeV)", 3, 19, 1, function (value) { return Number(value).toFixed(0); }),
        rangeControl("couplingExp", "耦合 log10(c)", -6, 0, 1, function (value) { return Number(value).toFixed(0); }),
        rangeControl("precisionExp", "精度 10^-p 中的 p", 1, 18, 1, function (value) { return Number(value).toFixed(0); })
      ];
      shell.appendChild(controls);

      var results = element(doc, "section", { className: "fe-results", hidden: "hidden", "aria-live": "polite" });
      shell.appendChild(results);
      root.appendChild(shell);

      function renderQuestions() {
        clear(questionList);
        questionSpecs().forEach(function (question) {
          var fieldset = element(doc, "fieldset");
          fieldset.appendChild(element(doc, "legend", {}, question.prompt));
          var options = element(doc, "div", { className: "fe-options", role: "group", "aria-label": question.prompt });
          question.choices.forEach(function (choice) {
            var button = element(doc, "button", { type: "button", "aria-pressed": state.answers[question.key] === choice.value ? "true" : "false" }, choice.label);
            button.addEventListener("click", function () {
              state.answers[question.key] = choice.value;
              state.revealed = false;
              results.hidden = true;
              renderQuestions();
              status.className = "fe-feedback";
              status.textContent = "预测已记录；四项完成后再揭示。";
            });
            options.appendChild(button);
          });
          fieldset.appendChild(options);
          questionList.appendChild(fieldset);
        });
      }

      function renderControls() {
        claimSelect.value = state.claimId;
        ranges.forEach(function (item) {
          item.input.value = state[item.key];
          item.output.textContent = item.formatter(state[item.key]);
        });
      }

      function resetReveal(message) {
        state.revealed = false;
        results.hidden = true;
        status.className = "fe-feedback";
        status.textContent = message;
      }

      claimSelect.addEventListener("change", function () {
        state.claimId = claimSelect.value;
        resetReveal("判读对象已改变，请重新核对预测。" );
      });
      ranges.forEach(function (item) {
        item.input.addEventListener("input", function () {
          state[item.key] = Number(item.input.value);
          item.output.textContent = item.formatter(state[item.key]);
          resetReveal("参数已改变，请重新核对预测。" );
        });
      });

      reveal.addEventListener("click", function () {
        var keys = Object.keys(state.answers);
        if (keys.some(function (key) { return state.answers[key] === null; })) {
          status.className = "fe-feedback fe-warn";
          status.textContent = "请先回答四项预测。";
          if (api && typeof api.announce === "function") api.announce(root, status.textContent);
          return;
        }
        var expected = expectedAnswers();
        var score = keys.reduce(function (total, key) { return total + (state.answers[key] === expected[key] ? 1 : 0); }, 0);
        var report = evaluate(state);
        state.revealed = true;
        results.hidden = false;
        renderResults(doc, results, report);
        status.className = "fe-feedback " + (score === keys.length ? "fe-pass" : "fe-warn");
        status.textContent = "已揭示：命中 " + score + "/" + keys.length + "；结论只属于声明的 toy 与证据层级。";
        if (api && typeof api.announce === "function") api.announce(root, status.textContent);
      });

      reset.addEventListener("click", function () {
        state = {
          claimId: DEFAULTS.claimId,
          energyExp: DEFAULTS.energyExp,
          scaleExp: DEFAULTS.scaleExp,
          couplingExp: DEFAULTS.couplingExp,
          precisionExp: DEFAULTS.precisionExp,
          answers: { distinct: null, nullResult: null, consistency: null, indirect: null },
          revealed: false
        };
        renderQuestions();
        renderControls();
        results.hidden = true;
        status.className = "fe-feedback";
        status.textContent = "已重置到 LHC 与 Planck 能标 toy。";
        if (api && typeof api.announce === "function") api.announce(root, status.textContent);
      });

      renderQuestions();
      renderControls();
    }

    return {
      CLAIMS: CLAIMS,
      DEFAULTS: DEFAULTS,
      evaluate: evaluate,
      expectedAnswers: expectedAnswers,
      mount: mount,
      selfTest: selfTest
    };
  }
);

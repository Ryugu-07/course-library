(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("quantum-occupancy", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("quantum-occupancy self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("quantum-occupancy self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-quantum-occupancy-styles";
  var INSTANCE = 0;
  var LEVELS = [
    { energy: 0, degeneracy: 1 },
    { energy: 0.5, degeneracy: 2 },
    { energy: 1, degeneracy: 3 },
    { energy: 1.5, degeneracy: 4 },
    { energy: 2, degeneracy: 5 }
  ];
  var EPS = 1e-12;

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance || 1e-9) * Math.max(1, Math.abs(left), Math.abs(right));
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function occupation(kind, energy, chemicalPotential, temperature) {
    var T = Math.max(EPS, Number(temperature));
    var x = (Number(energy) - Number(chemicalPotential)) / T;
    if (kind === "bose") {
      if (x <= 0) return Infinity;
      if (x > 700) return 0;
      return 1 / Math.expm1(x);
    }
    if (kind === "fermi") {
      if (x > 700) return 0;
      if (x < -700) return 1;
      return 1 / (Math.exp(x) + 1);
    }
    if (x > 700) return 0;
    return Math.exp(-x);
  }

  function finiteLevelLedger(kind, temperature, chemicalPotential, levels) {
    var chosen = levels || LEVELS;
    var rows = chosen.map(function (level) {
      var mean = occupation(kind, level.energy, chemicalPotential, temperature);
      return {
        energy: level.energy,
        degeneracy: level.degeneracy,
        perState: mean,
        particles: level.degeneracy * mean,
        energyContribution: level.degeneracy * level.energy * mean
      };
    });
    return {
      kind: kind,
      temperature: Number(temperature),
      chemicalPotential: Number(chemicalPotential),
      rows: rows,
      particles: rows.reduce(function (sum, row) { return sum + row.particles; }, 0),
      energy: rows.reduce(function (sum, row) { return sum + row.energyContribution; }, 0),
      maximumPerState: Math.max.apply(null, rows.map(function (row) { return row.perState; }))
    };
  }

  function classicalRelativeError(kind, x) {
    var exact = kind === "bose" ? 1 / Math.expm1(x) : 1 / (Math.exp(x) + 1);
    var classical = Math.exp(-x);
    return Math.abs(exact - classical) / Math.max(exact, EPS);
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }

    check(near(occupation("fermi", 1, 1, 2), 0.5), "Fermi occupation at energy mu");
    check(occupation("fermi", -10, 0, 1) < 1 && occupation("fermi", -10, 0, 1) > 0.999, "Fermi saturation");
    check(occupation("fermi", 10, 0, 1) > 0 && occupation("fermi", 10, 0, 1) < 0.001, "Fermi high-energy tail");
    check(near(occupation("bose", 1, 0, 1), 1 / Math.expm1(1)), "Bose formula");
    check(occupation("bose", 0, 0, 1) === Infinity, "Bose boundary diverges");
    check(occupation("bose", 0, 0.1, 1) === Infinity, "invalid Bose mu above ground flagged");
    check(classicalRelativeError("bose", 10) < 0.001, "Bose classical limit");
    check(classicalRelativeError("fermi", 10) < 0.001, "Fermi classical limit");

    [0.2, 0.7, 1.5, 3].forEach(function (temperature) {
      var fermi = finiteLevelLedger("fermi", temperature, 0.4);
      check(fermi.rows.every(function (row) { return row.perState >= 0 && row.perState <= 1; }), "Pauli bound");
      check(fermi.particles >= 0 && fermi.energy >= 0, "finite Fermi totals");
      var bose = finiteLevelLedger("bose", temperature, -0.2);
      check(bose.rows.every(function (row) { return isFinite(row.perState) && row.perState >= 0; }), "valid Bose totals");
      check(bose.particles >= 0 && bose.energy >= 0, "finite Bose totals nonnegative");
    });

    var lowT = finiteLevelLedger("fermi", 0.05, 0.75);
    check(lowT.rows[0].perState > 0.999, "low-T Fermi level below mu filled");
    check(lowT.rows[4].perState < 1e-9, "low-T Fermi level above mu empty");
    check(finiteLevelLedger("bose", 1, -0.01).rows[0].perState > finiteLevelLedger("bose", 1, -0.5).rows[0].perState, "Bose ground occupancy rises as mu approaches ground");
    return { checks: checks };
  }

  var STYLE_TEXT = [
    ".qo-lab{--qo-blue:var(--cl-blue,#315f9d);--qo-gold:var(--cl-gold,#9b6a12);--qo-green:var(--cl-green,#39734d);--qo-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55}.qo-lab *,.qo-lab *::before,.qo-lab *::after{box-sizing:border-box}.qo-lab [hidden]{display:none!important}",
    ".qo-lab button,.qo-lab input{font:inherit}.qo-lab button{min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.qo-lab button:hover{border-color:var(--accent)}.qo-lab button:focus-visible,.qo-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.qo-lab button[aria-pressed=true],.qo-lab .qo-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}",
    ".qo-lab fieldset{min-width:0;margin:0;padding:0;border:0}.qo-lab legend{margin-bottom:8px;color:var(--fg-soft);font-size:13px;font-weight:750}.qo-lab .qo-questions{display:grid;gap:10px}.qo-lab .qo-question{padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.qo-lab .qo-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:7px}.qo-lab .qo-choices button{font-size:12px}",
    ".qo-lab .qo-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.qo-lab .qo-actions>*{flex:1 1 170px}.qo-lab .qo-feedback{min-height:2em;margin:8px 0;color:var(--fg-soft);font-size:13px;font-weight:700}.qo-lab .qo-pass{color:var(--qo-green)}.qo-lab .qo-warn{color:var(--qo-red)}",
    ".qo-lab .qo-reveal{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.qo-lab .qo-layout{display:grid;grid-template-columns:minmax(220px,.68fr) minmax(0,1.32fr);gap:16px;align-items:start;min-width:0}.qo-lab .qo-controls{display:grid;gap:12px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}",
    ".qo-lab .qo-control{display:grid;gap:4px}.qo-lab label{color:var(--fg-soft);font-size:13px;font-weight:700}.qo-lab output{color:var(--accent);font-variant-numeric:tabular-nums}.qo-lab input[type=range]{width:100%;min-height:44px;margin:0;accent-color:var(--accent)}.qo-lab .qo-kind{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}",
    ".qo-lab .qo-stage{min-width:0;padding:9px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.qo-lab svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg)}.qo-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.qo-lab .qo-axis{stroke:currentColor;stroke-width:1.2;opacity:.7}.qo-lab .qo-grid{stroke:var(--border);stroke-width:1}.qo-lab .qo-exact{fill:none;stroke:var(--qo-blue);stroke-width:3}.qo-lab .qo-classical{fill:none;stroke:var(--qo-gold);stroke-width:2;stroke-dasharray:6 5}.qo-lab .qo-mu{stroke:var(--qo-red);stroke-width:2;stroke-dasharray:3 4}",
    ".qo-lab .qo-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:10px 0}.qo-lab .qo-metric{padding:8px;border-top:2px solid var(--border);background:var(--bg)}.qo-lab .qo-metric span{display:block;color:var(--fg-soft);font-size:11.5px}.qo-lab .qo-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".qo-lab .qo-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.qo-lab table{width:100%;min-width:620px;border-collapse:collapse;font-size:12px}.qo-lab th,.qo-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.qo-lab th{color:var(--fg-soft)}.qo-lab .qo-note{margin-top:10px;padding:10px 12px;border-left:3px solid var(--qo-green);background:var(--bg);font-size:13px;line-height:1.65}",
    "@media(max-width:900px){.qo-lab .qo-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:700px){.qo-lab .qo-choices{grid-template-columns:minmax(0,1fr)}}"
  ].join("\n");

  function injectStyles(documentObject) {
    if (!documentObject || documentObject.getElementById(STYLE_ID)) return;
    var style = documentObject.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    documentObject.head.appendChild(style);
  }

  function format(value, digits) {
    if (!isFinite(value)) return "∞";
    if (value !== 0 && Math.abs(value) < 0.001) return Number(value).toExponential(2);
    return Number(value).toFixed(digits == null ? 3 : digits);
  }

  function mount(container) {
    if (!container || container.getAttribute("data-qo-mounted") === "true") return;
    container.setAttribute("data-qo-mounted", "true");
    injectStyles(container.ownerDocument);
    INSTANCE += 1;
    var prefix = "qo-" + INSTANCE;
    var selected = [null, null, null];
    var kind = "fermi";

    container.innerHTML = [
      '<div class="qo-lab"><h3>量子占据账本：同一能级，两个分母，三种极限</h3>',
      '<p class="qo-note">先判断 Pauli 上限、玻色化学势边界与有限能级图能否证明 BEC。</p>',
      '<fieldset><legend>预测区</legend><div class="qo-questions">',
      '<div class="qo-question" data-question="0"><strong>1. 单个费米单粒子态的平均占据能否超过 1？</strong><div class="qo-choices"><button type="button" data-choice="0">能，低温时超过</button><button type="button" data-choice="1">不能</button><button type="button" data-choice="2">只在 μ=0 时能</button></div></div>',
      '<div class="qo-question" data-question="1"><strong>2. 理想守恒玻色气体中，μ 能否高于最低单粒子能量？</strong><div class="qo-choices"><button type="button" data-choice="0">能</button><button type="button" data-choice="1">不能</button><button type="button" data-choice="2">与谱无关</button></div></div>',
      '<div class="qo-question" data-question="2"><strong>3. 五个能级里基态占据很大，是否已经证明热力学极限 BEC？</strong><div class="qo-choices"><button type="button" data-choice="0">是</button><button type="button" data-choice="1">只要 N&gt;10 就是</button><button type="button" data-choice="2">否，只是有限谱现象</button></div></div>',
      '</div></fieldset><div class="qo-actions"><button class="qo-primary" type="button" data-action="submit">提交预测并揭示</button><button type="button" data-action="reset">重置</button></div><p class="qo-feedback" role="status" aria-live="polite"></p>',
      '<div class="qo-reveal" hidden><div class="qo-layout"><div class="qo-controls">',
      '<div class="qo-kind"><button type="button" data-kind="fermi" aria-pressed="true">Fermi–Dirac</button><button type="button" data-kind="bose">Bose–Einstein</button></div>',
      '<div class="qo-control"><label for="' + prefix + '-temp">温度 kBT：<output data-output="temp">0.60</output></label><input id="' + prefix + '-temp" data-input="temp" type="range" min="0.08" max="2" step="0.02" value="0.6"></div>',
      '<div class="qo-control"><label for="' + prefix + '-mu">化学势 μ：<output data-output="mu">0.50</output></label><input id="' + prefix + '-mu" data-input="mu" type="range" min="-1.5" max="2" step="0.02" value="0.5"></div>',
      '<p class="qo-note" data-boundary></p></div><div class="qo-stage">',
      '<svg viewBox="0 0 640 310" role="img" aria-labelledby="' + prefix + '-title ' + prefix + '-desc"><title id="' + prefix + '-title">量子与经典占据曲线</title><desc id="' + prefix + '-desc">实线是当前量子统计，虚线是 Boltzmann 近似，红线标记化学势。</desc><g data-svg></g></svg>',
      '<div class="qo-metrics" data-metrics></div><div class="qo-table-wrap"><table><thead><tr><th>ε</th><th>简并度 g</th><th>每态占据</th><th>该层粒子数</th><th>能量贡献</th></tr></thead><tbody data-ledger></tbody></table></div><p class="qo-note" data-note></p>',
      '</div></div></div></div>'
    ].join("");

    var lab = container.querySelector(".qo-lab");
    var reveal = lab.querySelector(".qo-reveal");
    var feedback = lab.querySelector(".qo-feedback");
    var tempInput = lab.querySelector('[data-input="temp"]');
    var muInput = lab.querySelector('[data-input="mu"]');

    function normalizedMu() {
      var mu = Number(muInput.value);
      if (kind === "bose" && mu > -0.02) {
        mu = -0.02;
        muInput.value = String(mu);
      }
      return mu;
    }

    function render() {
      var temperature = Number(tempInput.value);
      var mu = normalizedMu();
      var ledger = finiteLevelLedger(kind, temperature, mu);
      lab.querySelector('[data-output="temp"]').textContent = format(temperature, 2);
      lab.querySelector('[data-output="mu"]').textContent = format(mu, 2);
      lab.querySelector("[data-boundary]").textContent = kind === "bose"
        ? "玻色模式强制 μ<ε₀=0；靠近 0 时有限谱基态占据会变大，但这不是热力学极限凝聚证明。"
        : "费米模式允许 μ 穿过能级；每态占据始终在 0 与 1 之间。";

      var exactPoints = [];
      var classicalPoints = [];
      var maxY = kind === "fermi" ? 1 : Math.min(12, Math.max(1, occupation(kind, 0, mu, temperature)));
      for (var index = 0; index <= 120; index += 1) {
        var energy = 3 * index / 120;
        exactPoints.push(Math.min(maxY, occupation(kind, energy, mu, temperature)));
        classicalPoints.push(Math.min(maxY, occupation("classical", energy, mu, temperature)));
      }
      function path(values) {
        return values.map(function (value, index) {
          var x = 52 + 536 * index / (values.length - 1);
          var y = 266 - 212 * value / Math.max(maxY, EPS);
          return (index ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
        }).join(" ");
      }
      var muX = 52 + 536 * clamp(mu / 3, 0, 1);
      lab.querySelector("[data-svg]").innerHTML = [
        '<line class="qo-axis" x1="52" y1="266" x2="588" y2="266"></line><line class="qo-axis" x1="52" y1="54" x2="52" y2="266"></line>',
        '<path class="qo-exact" d="' + path(exactPoints) + '"></path><path class="qo-classical" d="' + path(classicalPoints) + '"></path>',
        mu >= 0 ? '<line class="qo-mu" x1="' + muX.toFixed(1) + '" y1="54" x2="' + muX.toFixed(1) + '" y2="266"></line>' : '',
        '<text x="52" y="290" font-size="12">ε=0</text><text x="558" y="290" font-size="12">ε=3</text><text x="62" y="70" font-size="12">每态平均占据</text>',
        '<text x="370" y="36" font-size="12">实线：' + (kind === "fermi" ? "FD" : "BE") + '　虚线：Boltzmann</text>'
      ].join("");

      var tailX = (3 - mu) / temperature;
      lab.querySelector("[data-metrics]").innerHTML = [
        ["有限谱总粒子数", format(ledger.particles, 3)],
        ["有限谱总能量", format(ledger.energy, 3)],
        ["最大每态占据", format(ledger.maximumPerState, 3)],
        ["ε=3 经典相对误差", format(classicalRelativeError(kind, tailX), 4)]
      ].map(function (entry) { return '<div class="qo-metric"><span>' + entry[0] + '</span><strong>' + entry[1] + '</strong></div>'; }).join("");
      lab.querySelector("[data-ledger]").innerHTML = ledger.rows.map(function (row) {
        return "<tr><td>" + format(row.energy, 1) + "</td><td>" + row.degeneracy + "</td><td>" + format(row.perState, 4) + "</td><td>" + format(row.particles, 4) + "</td><td>" + format(row.energyContribution, 4) + "</td></tr>";
      }).join("");
      lab.querySelector("[data-note]").textContent = kind === "fermi"
        ? "FD 的上限来自每个单粒子态的 0/1 允许占据；表中的简并度只是把多个不同态相加，不违反 Pauli。"
        : "BE 的大基态占据来自 μ 接近最低能量时分母变小；真正 BEC 还要固定总粒子数、取体积极限并检查激发态容量。";
    }

    lab.addEventListener("click", function (event) {
      var choice = event.target.closest("button[data-choice]");
      if (choice) {
        var question = choice.closest("[data-question]");
        var index = Number(question.getAttribute("data-question"));
        selected[index] = Number(choice.getAttribute("data-choice"));
        question.querySelectorAll("button[data-choice]").forEach(function (button) { button.setAttribute("aria-pressed", button === choice ? "true" : "false"); });
        return;
      }
      var kindButton = event.target.closest("button[data-kind]");
      if (kindButton) {
        kind = kindButton.getAttribute("data-kind");
        lab.querySelectorAll("button[data-kind]").forEach(function (button) { button.setAttribute("aria-pressed", button === kindButton ? "true" : "false"); });
        if (kind === "bose" && Number(muInput.value) > -0.02) muInput.value = "-0.2";
        render();
        return;
      }
      var action = event.target.closest("button[data-action]");
      if (!action) return;
      if (action.getAttribute("data-action") === "submit") {
        if (selected.some(function (value) { return value == null; })) {
          feedback.className = "qo-feedback qo-warn";
          feedback.textContent = "请先完成三项预测。";
          return;
        }
        var correct = [1, 1, 2];
        var score = selected.reduce(function (sum, value, index) { return sum + (value === correct[index] ? 1 : 0); }, 0);
        feedback.className = "qo-feedback " + (score === 3 ? "qo-pass" : "qo-warn");
        feedback.textContent = "预测 " + score + "/3。现在查看有限能级账本与适用域。";
        reveal.hidden = false;
        render();
      } else {
        selected = [null, null, null];
        kind = "fermi";
        lab.querySelectorAll("button[data-choice]").forEach(function (button) { button.removeAttribute("aria-pressed"); });
        lab.querySelectorAll("button[data-kind]").forEach(function (button) { button.setAttribute("aria-pressed", button.getAttribute("data-kind") === "fermi" ? "true" : "false"); });
        tempInput.value = "0.6";
        muInput.value = "0.5";
        reveal.hidden = true;
        feedback.className = "qo-feedback";
        feedback.textContent = "";
      }
    });
    tempInput.addEventListener("input", render);
    muInput.addEventListener("input", render);
  }

  return {
    LEVELS: LEVELS.map(function (level) { return { energy: level.energy, degeneracy: level.degeneracy }; }),
    occupation: occupation,
    finiteLevelLedger: finiteLevelLedger,
    classicalRelativeError: classicalRelativeError,
    mount: mount,
    selfTest: selfTest
  };
});

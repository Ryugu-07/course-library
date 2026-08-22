(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("linear-ode-resonance", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("linear-ode-resonance self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("linear-ode-resonance self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-linear-ode-resonance-styles";

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(a, b, tolerance) {
    return Math.abs(a - b) <= (tolerance || 1e-9);
  }

  function rootClassification(zeta, omega0) {
    var scale = omega0 || 1;
    if (zeta < 1 - 1e-12) {
      return {
        type: "underdamped",
        label: "欠阻尼：共轭复根",
        roots: [
          { re: -zeta * scale, im: scale * Math.sqrt(1 - zeta * zeta) },
          { re: -zeta * scale, im: -scale * Math.sqrt(1 - zeta * zeta) }
        ]
      };
    }
    if (zeta > 1 + 1e-12) {
      return {
        type: "overdamped",
        label: "过阻尼：两个负实根",
        roots: [
          { re: scale * (-zeta + Math.sqrt(zeta * zeta - 1)), im: 0 },
          { re: scale * (-zeta - Math.sqrt(zeta * zeta - 1)), im: 0 }
        ]
      };
    }
    return {
      type: "critical",
      label: "临界阻尼：负重根",
      roots: [{ re: -scale, im: 0 }, { re: -scale, im: 0 }]
    };
  }

  function undampedResponse(omega0, omega, force, t) {
    var delta = omega0 * omega0 - omega * omega;
    if (Math.abs(delta) < 1e-10) {
      return force * t * Math.sin(omega0 * t) / (2 * omega0);
    }
    return force * (Math.cos(omega * t) - Math.cos(omega0 * t)) / delta;
  }

  function wronskian(omega0) {
    return omega0;
  }

  function resonanceIdentity(omega0, force, t) {
    var y = force * t * Math.sin(omega0 * t) / (2 * omega0);
    var second = force * Math.cos(omega0 * t) -
      force * omega0 * t * Math.sin(omega0 * t) / 2;
    return second + omega0 * omega0 * y;
  }

  function trace(omega0, ratio, force, horizon, samples) {
    var omega = ratio * omega0;
    var points = [];
    for (var i = 0; i <= samples; i += 1) {
      var t = horizon * i / samples;
      points.push({ t: t, y: undampedResponse(omega0, omega, force, t) });
    }
    return points;
  }

  function classifyForcing(ratio) {
    var distance = Math.abs(ratio - 1);
    if (distance < 1e-9) return "exact";
    if (distance <= 0.08) return "near";
    return "off";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function format(value) {
    return (Math.round(value * 1000) / 1000).toString();
  }

  function ensureStyles() {
    if (!host || !host.document || host.document.getElementById(STYLE_ID)) return;
    var style = host.document.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="linear-ode-resonance"]{--lor-accent:#7c3aed;--lor-force:#dc2626;--lor-warn:#a16207;color:inherit}' +
      '[data-learning-lab="linear-ode-resonance"] .lor-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:end}' +
      '[data-learning-lab="linear-ode-resonance"] label{display:grid;gap:6px;font-weight:700}' +
      '[data-learning-lab="linear-ode-resonance"] select,[data-learning-lab="linear-ode-resonance"] input,[data-learning-lab="linear-ode-resonance"] button{min-height:44px;font:inherit}' +
      '[data-learning-lab="linear-ode-resonance"] button{border:1px solid currentColor;background:transparent;color:inherit;padding:8px 14px;cursor:pointer}' +
      '[data-learning-lab="linear-ode-resonance"] .lor-primary{background:var(--lor-accent);border-color:var(--lor-accent);color:white}' +
      '[data-learning-lab="linear-ode-resonance"] .lor-actions{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}' +
      '[data-learning-lab="linear-ode-resonance"] .lor-result[hidden]{display:none}' +
      '[data-learning-lab="linear-ode-resonance"] .lor-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(240px,.8fr);gap:16px;align-items:start}' +
      '[data-learning-lab="linear-ode-resonance"] svg{display:block;width:100%;height:auto;aspect-ratio:16/9;border:1px solid color-mix(in srgb,currentColor 22%,transparent);background:color-mix(in srgb,Canvas 94%,var(--lor-accent) 6%)}' +
      '[data-learning-lab="linear-ode-resonance"] .lor-table-wrap{overflow-x:auto}' +
      '[data-learning-lab="linear-ode-resonance"] table{width:100%;border-collapse:collapse}' +
      '[data-learning-lab="linear-ode-resonance"] th,[data-learning-lab="linear-ode-resonance"] td{padding:8px;border-bottom:1px solid color-mix(in srgb,currentColor 20%,transparent);text-align:left;vertical-align:top}' +
      '[data-learning-lab="linear-ode-resonance"] .lor-note{border-left:4px solid var(--lor-warn);padding-left:12px}' +
      '@media(max-width:760px){[data-learning-lab="linear-ode-resonance"] .lor-controls,[data-learning-lab="linear-ode-resonance"] .lor-grid{grid-template-columns:1fr}}';
    host.document.head.appendChild(style);
  }

  function renderSvg(points, horizon) {
    var maxAbs = Math.max.apply(null, points.map(function (point) { return Math.abs(point.y); }));
    maxAbs = Math.max(0.5, maxAbs);
    var path = points.map(function (point, index) {
      var x = 46 + 530 * point.t / horizon;
      var y = 160 - 118 * point.y / maxAbs;
      return (index ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2);
    }).join(" ");
    return '<svg viewBox="0 0 620 320" role="img" aria-label="无阻尼受迫振子的解析位移">' +
      '<line x1="46" y1="160" x2="584" y2="160" stroke="currentColor"/><line x1="46" y1="36" x2="46" y2="284" stroke="currentColor"/>' +
      '<path d="' + path + '" fill="none" stroke="#7c3aed" stroke-width="3"/>' +
      '<line x1="46" y1="42" x2="584" y2="42" stroke="#dc2626" stroke-dasharray="5 5" opacity=".55"/>' +
      '<line x1="46" y1="278" x2="584" y2="278" stroke="#dc2626" stroke-dasharray="5 5" opacity=".55"/>' +
      '<text x="52" y="306">0</text><text x="548" y="306">t=' + format(horizon) + '</text>' +
      '<text x="62" y="62" fill="#7c3aed">解析响应；纵轴按当前窗口自动缩放</text>' +
      '</svg>';
  }

  function mount(root) {
    ensureStyles();
    root.innerHTML =
      '<div class="lor-controls">' +
      '<label>forcing 比 ω/ω₀ <output data-role="ratio-output">0.98</output><input data-role="ratio" type="range" min="0.5" max="1.5" step="0.01" value="0.98"></label>' +
      '<label>观察终点 <output data-role="horizon-output">40</output><input data-role="horizon" type="range" min="10" max="80" step="2" value="40"></label>' +
      '<label>阻尼根分类 ζ<select data-role="zeta"><option value="0.3">0.3 欠阻尼</option><option value="1">1 临界</option><option value="1.4">1.4 过阻尼</option></select></label>' +
      '</div>' +
      '<label>揭示前预测<select data-role="prediction"><option value="">请选择</option><option value="exact">精确共振</option><option value="near">近共振拍频</option><option value="off">离共振有界响应</option></select></label>' +
      '<div class="lor-actions"><button class="lor-primary" type="button" data-role="reveal">揭示轨迹</button><button type="button" data-role="reset">重置</button></div>' +
      '<div class="lor-result" data-role="result" hidden aria-live="polite"></div>';

    var ratio = root.querySelector('[data-role="ratio"]');
    var horizon = root.querySelector('[data-role="horizon"]');
    var zeta = root.querySelector('[data-role="zeta"]');
    var prediction = root.querySelector('[data-role="prediction"]');
    var result = root.querySelector('[data-role="result"]');

    function render() {
      root.querySelector('[data-role="ratio-output"]').textContent = ratio.value;
      root.querySelector('[data-role="horizon-output"]').textContent = horizon.value;
      if (result.hidden) return;
      var r = Number(ratio.value);
      var h = Number(horizon.value);
      var points = trace(1, r, 1, h, 500);
      var maxAbs = Math.max.apply(null, points.map(function (point) { return Math.abs(point.y); }));
      var forcingClass = classifyForcing(r);
      var roots = rootClassification(Number(zeta.value), 1);
      var predictionText = prediction.value === forcingClass ? "预测命中" : "预测需修正";
      var boundary = forcingClass === "exact"
        ? "线性增长只属于无阻尼线性模型；任意正阻尼都会给有限稳态幅值。"
        : forcingClass === "near"
          ? "当前是有限观察窗中的慢拍频，不是精确共振。"
          : "有界结论针对当前无阻尼、固定 forcing 的解析模型。";
      result.innerHTML =
        '<div class="lor-grid"><div>' + renderSvg(points, h) + '</div><div>' +
        '<h4>' + predictionText + '</h4><div class="lor-table-wrap"><table><tbody>' +
        '<tr><th>forcing 身份</th><td>' + escapeHtml(forcingClass) + '</td></tr>' +
        '<tr><th>窗口最大 |y|</th><td>' + format(maxAbs) + '</td></tr>' +
        '<tr><th>齐次根类型</th><td>' + escapeHtml(roots.label) + '</td></tr>' +
        '<tr><th>Wronskian</th><td>W(cos t,sin t)=1</td></tr>' +
        '<tr><th>零初值</th><td>y(0)=y&#39;(0)=0</td></tr>' +
        '</tbody></table></div><p class="lor-note">' + escapeHtml(boundary) + '</p></div></div>';
    }

    root.querySelector('[data-role="reveal"]').addEventListener("click", function () {
      if (!prediction.value) {
        prediction.focus();
        return;
      }
      result.hidden = false;
      render();
    });
    root.querySelector('[data-role="reset"]').addEventListener("click", function () {
      ratio.value = "0.98";
      horizon.value = "40";
      zeta.value = "0.3";
      prediction.value = "";
      result.hidden = true;
      result.innerHTML = "";
      render();
    });
    [ratio, horizon, zeta].forEach(function (control) {
      control.addEventListener("input", render);
      control.addEventListener("change", render);
    });
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }
    check(rootClassification(0.2, 1).type === "underdamped", "underdamped roots");
    check(rootClassification(1, 1).type === "critical", "critical roots");
    check(rootClassification(2, 1).type === "overdamped", "overdamped roots");
    check(near(wronskian(2), 2), "Wronskian certificate");
    check(near(undampedResponse(1, 0.7, 1, 0), 0), "zero displacement initial condition");
    check(near(resonanceIdentity(2, 3, 0.4), 3 * Math.cos(0.8), 1e-9), "resonant equation identity");
    check(classifyForcing(1) === "exact", "exact resonance class");
    check(classifyForcing(0.96) === "near", "near resonance class");
    check(classifyForcing(0.7) === "off", "off resonance class");
    var t = 1.3;
    check(near(undampedResponse(1, 1 + 1e-6, 1, t), undampedResponse(1, 1, 1, t), 2e-6), "nonresonant limit approaches resonant response");
    check(trace(1, 1, 1, 10, 100).length === 101, "trace includes endpoints");
    return { checks: checks };
  }

  return {
    rootClassification: rootClassification,
    undampedResponse: undampedResponse,
    wronskian: wronskian,
    resonanceIdentity: resonanceIdentity,
    trace: trace,
    classifyForcing: classifyForcing,
    mount: mount,
    selfTest: selfTest
  };
});

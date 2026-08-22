(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("special-function-boundaries", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("special-function-boundaries self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("special-function-boundaries self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-special-function-boundaries-styles";

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(a, b, tolerance) {
    return Math.abs(a - b) <= (tolerance || 1e-9);
  }

  function besselJ0(x) {
    var term = 1;
    var sum = 1;
    for (var m = 1; m <= 80; m += 1) {
      term *= -(x * x) / (4 * m * m);
      sum += term;
      if (Math.abs(term) < 1e-16 * Math.max(1, Math.abs(sum))) break;
    }
    return sum;
  }

  function bisectRoot(fn, left, right) {
    var fLeft = fn(left);
    var fRight = fn(right);
    if (fLeft === 0) return left;
    if (fLeft * fRight > 0) throw new Error("root is not bracketed");
    for (var i = 0; i < 80; i += 1) {
      var middle = (left + right) / 2;
      var fMiddle = fn(middle);
      if (Math.abs(fMiddle) < 1e-14) return middle;
      if (fLeft * fMiddle <= 0) {
        right = middle;
        fRight = fMiddle;
      } else {
        left = middle;
        fLeft = fMiddle;
      }
    }
    return (left + right) / 2;
  }

  function besselJ0Roots(count) {
    var roots = [];
    var left = 0;
    var fLeft = besselJ0(left);
    for (var right = 0.05; right <= 20 && roots.length < count; right += 0.05) {
      var fRight = besselJ0(right);
      if (fLeft * fRight < 0) roots.push(bisectRoot(besselJ0, left, right));
      left = right;
      fLeft = fRight;
    }
    return roots;
  }

  function legendreP(degree, x) {
    if (degree === 0) return 1;
    if (degree === 1) return x;
    var previous = 1;
    var current = x;
    for (var n = 1; n < degree; n += 1) {
      var next = ((2 * n + 1) * x * current - n * previous) / (n + 1);
      previous = current;
      current = next;
    }
    return current;
  }

  function legendreInnerProduct(a, b, panels) {
    var n = panels || 2000;
    if (n % 2) n += 1;
    var h = 2 / n;
    var sum = 0;
    for (var i = 0; i <= n; i += 1) {
      var x = -1 + i * h;
      var weight = i === 0 || i === n ? 1 : i % 2 ? 4 : 2;
      sum += weight * legendreP(a, x) * legendreP(b, x);
    }
    return sum * h / 3;
  }

  function greenValue(x, source, length) {
    return x <= source
      ? x * (length - source) / length
      : source * (length - x) / length;
  }

  function greenCertificate(source, length) {
    var leftSlope = (length - source) / length;
    var rightSlope = -source / length;
    return {
      leftBoundary: greenValue(0, source, length),
      rightBoundary: greenValue(length, source, length),
      continuityValue: greenValue(source, source, length),
      leftSlope: leftSlope,
      rightSlope: rightSlope,
      derivativeJump: rightSlope - leftSlope
    };
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function format(value) {
    return (Math.round(value * 100000) / 100000).toString();
  }

  function ensureStyles() {
    if (!host || !host.document || host.document.getElementById(STYLE_ID)) return;
    var style = host.document.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="special-function-boundaries"]{--sfb-accent:#0369a1;--sfb-root:#be123c;--sfb-warn:#a16207;color:inherit}' +
      '[data-learning-lab="special-function-boundaries"] .sfb-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:end}' +
      '[data-learning-lab="special-function-boundaries"] label{display:grid;gap:6px;font-weight:700}' +
      '[data-learning-lab="special-function-boundaries"] select,[data-learning-lab="special-function-boundaries"] input,[data-learning-lab="special-function-boundaries"] button{min-height:44px;font:inherit}' +
      '[data-learning-lab="special-function-boundaries"] button{border:1px solid currentColor;background:transparent;color:inherit;padding:8px 14px;cursor:pointer}' +
      '[data-learning-lab="special-function-boundaries"] .sfb-primary{background:var(--sfb-accent);border-color:var(--sfb-accent);color:white}' +
      '[data-learning-lab="special-function-boundaries"] .sfb-actions{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}' +
      '[data-learning-lab="special-function-boundaries"] .sfb-result[hidden]{display:none}' +
      '[data-learning-lab="special-function-boundaries"] .sfb-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(250px,.85fr);gap:16px;align-items:start}' +
      '[data-learning-lab="special-function-boundaries"] svg{display:block;width:100%;height:auto;aspect-ratio:16/9;border:1px solid color-mix(in srgb,currentColor 22%,transparent);background:color-mix(in srgb,Canvas 94%,var(--sfb-accent) 6%)}' +
      '[data-learning-lab="special-function-boundaries"] .sfb-table-wrap{overflow-x:auto}' +
      '[data-learning-lab="special-function-boundaries"] table{width:100%;border-collapse:collapse}' +
      '[data-learning-lab="special-function-boundaries"] th,[data-learning-lab="special-function-boundaries"] td{padding:8px;border-bottom:1px solid color-mix(in srgb,currentColor 20%,transparent);text-align:left;vertical-align:top}' +
      '[data-learning-lab="special-function-boundaries"] .sfb-note{border-left:4px solid var(--sfb-warn);padding-left:12px}' +
      '@media(max-width:760px){[data-learning-lab="special-function-boundaries"] .sfb-controls,[data-learning-lab="special-function-boundaries"] .sfb-grid{grid-template-columns:1fr}}';
    host.document.head.appendChild(style);
  }

  function graphPath(values, xMin, xMax, yMin, yMax) {
    return values.map(function (point, index) {
      var x = 48 + 526 * (point.x - xMin) / (xMax - xMin);
      var y = 274 - 224 * (point.y - yMin) / (yMax - yMin);
      return (index ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2);
    }).join(" ");
  }

  function renderBessel(index) {
    var roots = besselJ0Roots(Math.max(index, 4));
    var selected = roots[index - 1];
    var values = [];
    for (var i = 0; i <= 240; i += 1) {
      var x = 12 * i / 240;
      values.push({ x: x, y: besselJ0(x) });
    }
    var rootX = 48 + 526 * selected / 12;
    return {
      svg: '<svg viewBox="0 0 620 320" role="img" aria-label="Bessel J0 与固定边缘零点">' +
        '<line x1="48" y1="162" x2="584" y2="162" stroke="currentColor"/><line x1="48" y1="42" x2="48" y2="282" stroke="currentColor"/>' +
        '<path d="' + graphPath(values, 0, 12, -1.05, 1.05) + '" fill="none" stroke="#0369a1" stroke-width="4"/>' +
        '<line x1="' + rootX.toFixed(2) + '" x2="' + rootX.toFixed(2) + '" y1="40" y2="282" stroke="#be123c" stroke-width="3" stroke-dasharray="6 5"/>' +
        '<text x="64" y="66">J₀(kR)</text><text x="' + Math.min(500, rootX + 8).toFixed(2) + '" y="92" fill="#be123c">第 ' + index + ' 根</text></svg>',
      rows: [
        ["选中 kR", format(selected)],
        ["边界残差 J₀(kR)", besselJ0(selected).toExponential(2)],
        ["第一根", format(roots[0])],
        ["证书", "固定边缘 J₀(kR)=0"]
      ],
      note: "低阶零点由扫描括区间后二分得到；曲线不证明 Sturm–Liouville 完备性。"
    };
  }

  function renderLegendre(degree) {
    var values = [];
    for (var i = 0; i <= 240; i += 1) {
      var x = -1 + 2 * i / 240;
      values.push({ x: x, y: legendreP(degree, x) });
    }
    var compare = degree === 0 ? 1 : degree - 1;
    return {
      svg: '<svg viewBox="0 0 620 320" role="img" aria-label="Legendre 多项式在负一到一的曲线">' +
        '<line x1="48" y1="162" x2="584" y2="162" stroke="currentColor"/><line x1="316" y1="42" x2="316" y2="282" stroke="currentColor"/>' +
        '<path d="' + graphPath(values, -1, 1, -1.1, 1.1) + '" fill="none" stroke="#0369a1" stroke-width="4"/>' +
        '<text x="64" y="66">P_' + degree + '(x)，区间 [-1,1]、权重 1</text></svg>',
      rows: [
        ["次数 ℓ", String(degree)],
        ["Pℓ(1)", format(legendreP(degree, 1))],
        ["对照次数", String(compare)],
        ["数值内积", legendreInnerProduct(degree, compare, 2000).toExponential(2)]
      ],
      note: "正交性连同区间、权重与正则边界一起陈述；有限 Simpson 积分只是数值对账。"
    };
  }

  function renderGreen(fraction) {
    var length = 1;
    var source = fraction * length;
    var cert = greenCertificate(source, length);
    var values = [];
    for (var i = 0; i <= 200; i += 1) {
      var x = i / 200;
      values.push({ x: x, y: greenValue(x, source, length) });
    }
    var sourceX = 48 + 526 * source;
    return {
      svg: '<svg viewBox="0 0 620 320" role="img" aria-label="两端固定的一维 Green 函数">' +
        '<line x1="48" y1="274" x2="584" y2="274" stroke="currentColor"/><line x1="48" y1="42" x2="48" y2="282" stroke="currentColor"/>' +
        '<path d="' + graphPath(values, 0, 1, 0, 0.3) + '" fill="none" stroke="#0369a1" stroke-width="4"/>' +
        '<line x1="' + sourceX.toFixed(2) + '" x2="' + sourceX.toFixed(2) + '" y1="42" y2="282" stroke="#be123c" stroke-width="3" stroke-dasharray="6 5"/>' +
        '<text x="64" y="66">-G″=δ(x-ξ)，ξ=' + format(source) + '</text></svg>',
      rows: [
        ["G(0,ξ)", format(cert.leftBoundary)],
        ["G(1,ξ)", format(cert.rightBoundary)],
        ["左导数 G'₋", format(cert.leftSlope)],
        ["右导数 G'₊", format(cert.rightSlope)],
        ["跳跃 G'₊-G'₋", format(cert.derivativeJump)]
      ],
      note: "跳跃为 -1 才与 -G″=δ 的符号一致；换成 +u″，跳跃符号随之反转。"
    };
  }

  function mount(root) {
    ensureStyles();
    root.innerHTML =
      '<div class="sfb-controls">' +
      '<label>边界问题<select data-role="mode"><option value="bessel">圆膜 Bessel</option><option value="legendre">球面 Legendre</option><option value="green">一维 Green</option></select></label>' +
      '<label>阶/根编号 <output data-role="index-output">1</output><input data-role="index" type="range" min="1" max="4" step="1" value="1"></label>' +
      '<label>点源位置 ξ/L <output data-role="source-output">0.4</output><input data-role="source" type="range" min="0.1" max="0.9" step="0.05" value="0.4"></label>' +
      '</div>' +
      '<label>揭示前预测<select data-role="prediction"><option value="">请选择</option><option value="zero-boundary">边界残差为零</option><option value="orthogonal">指定权重下正交</option><option value="negative-jump">导数跳跃为 -1</option></select></label>' +
      '<div class="sfb-actions"><button class="sfb-primary" type="button" data-role="reveal">揭示边界证书</button><button type="button" data-role="reset">重置</button></div>' +
      '<div class="sfb-result" data-role="result" hidden aria-live="polite"></div>';

    var mode = root.querySelector('[data-role="mode"]');
    var index = root.querySelector('[data-role="index"]');
    var source = root.querySelector('[data-role="source"]');
    var prediction = root.querySelector('[data-role="prediction"]');
    var result = root.querySelector('[data-role="result"]');

    function expected() {
      return mode.value === "bessel" ? "zero-boundary" : mode.value === "legendre" ? "orthogonal" : "negative-jump";
    }

    function render() {
      root.querySelector('[data-role="index-output"]').textContent = index.value;
      root.querySelector('[data-role="source-output"]').textContent = source.value;
      index.disabled = mode.value === "green";
      source.disabled = mode.value !== "green";
      if (result.hidden) return;
      var entry = mode.value === "bessel"
        ? renderBessel(Number(index.value))
        : mode.value === "legendre"
          ? renderLegendre(Number(index.value))
          : renderGreen(Number(source.value));
      var predictionText = prediction.value === expected() ? "预测命中" : "预测需修正";
      result.innerHTML =
        '<div class="sfb-grid"><div>' + entry.svg + '</div><div><h4>' + predictionText + '</h4>' +
        '<div class="sfb-table-wrap"><table><tbody>' +
        entry.rows.map(function (row) {
          return '<tr><th>' + escapeHtml(row[0]) + '</th><td>' + escapeHtml(row[1]) + '</td></tr>';
        }).join("") +
        '</tbody></table></div><p class="sfb-note">' + escapeHtml(entry.note) + '</p></div></div>';
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
      mode.value = "bessel";
      index.value = "1";
      source.value = "0.4";
      prediction.value = "";
      result.hidden = true;
      result.innerHTML = "";
      render();
    });
    [mode, index, source].forEach(function (control) {
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
    check(near(besselJ0(0), 1), "J0 at zero");
    var roots = besselJ0Roots(3);
    check(roots.length === 3, "three J0 roots found");
    check(near(roots[0], 2.4048255577, 1e-8), "first J0 root");
    check(Math.abs(besselJ0(roots[2])) < 1e-10, "third root residual");
    check(near(legendreP(2, 0), -0.5), "P2 at zero");
    check(near(legendreP(4, 1), 1), "Legendre endpoint");
    check(Math.abs(legendreInnerProduct(2, 3, 2000)) < 1e-10, "Legendre orthogonality");
    check(near(legendreInnerProduct(2, 2, 2000), 2 / 5, 1e-10), "Legendre norm");
    var cert = greenCertificate(0.4, 1);
    check(cert.leftBoundary === 0 && cert.rightBoundary === 0, "Green boundary values");
    check(near(cert.derivativeJump, -1), "Green derivative jump sign");
    check(near(greenValue(0.4, 0.4, 1), 0.24), "Green continuity value");
    return { checks: checks };
  }

  return {
    besselJ0: besselJ0,
    besselJ0Roots: besselJ0Roots,
    legendreP: legendreP,
    legendreInnerProduct: legendreInnerProduct,
    greenValue: greenValue,
    greenCertificate: greenCertificate,
    mount: mount,
    selfTest: selfTest
  };
});

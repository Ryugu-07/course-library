(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("galois-insolvability", exported.mount);
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
        "galois-insolvability self-test: PASS (" +
          report.checks +
          " checks, " +
          report.examples +
          " examples, " +
          report.primes +
          " primes)"
      );
    } catch (error) {
      console.error("galois-insolvability self-test: FAIL\n" + error.stack);
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
    var STYLE_ID = "galois-insolvability-lab-styles";
    var INSTANCE = 0;
    var PRIMES = [2, 3, 5, 7, 11];
    var PRESETS = [
      {
        id: "s5-main",
        label: "x^5 - 6x + 3",
        expression: "x^5 - 6x + 3",
        coefficients: [3, -6, 0, 0, 0, 1],
        context: "具体五次的 S5 证书练习；实验本身不替代完整 Galois 群证明。"
      },
      {
        id: "radical-control",
        label: "x^5 - 2",
        expression: "x^5 - 2",
        coefficients: [-2, 0, 0, 0, 0, 1],
        context: "可解群控制例；五次次数本身不等于不可根式解。"
      },
      {
        id: "s5-second",
        label: "x^5 - 4x + 2",
        expression: "x^5 - 4x + 2",
        coefficients: [2, -4, 0, 0, 0, 1],
        context: "另一个具体五次；p=2 的重因子演示坏素数不能直接给循环型证书。"
      }
    ];

    var PREDICTIONS = [
      {
        id: "single",
        prompt: "一个好素数的分解型最直接提供什么？",
        options: [
          { id: "certificate", label: "群中一个元素的循环型证书" },
          { id: "whole-group", label: "整个 Galois 群的完整同构" },
          { id: "root-formula", label: "一条根式公式" }
        ],
        answer: "certificate"
      },
      {
        id: "many",
        prompt: "收集多个素数的证书后，仍然需要什么？",
        options: [
          { id: "group-proof", label: "不可约性、判别式和群论收口" },
          { id: "nothing", label: "不需要任何额外假设" },
          { id: "numeric-only", label: "只要更多小数位" }
        ],
        answer: "group-proof"
      },
      {
        id: "numeric",
        prompt: "数值算法找到五个近似根，是否等于根式公式？",
        options: [
          { id: "different", label: "不等于；数值近似和根式表达不同" },
          { id: "same", label: "等于；精度足够就自动成为根式" },
          { id: "s5", label: "等于 Galois 群为 S5" }
        ],
        answer: "different"
      }
    ];

    var STYLE_TEXT = [
      ".gi-lab{box-sizing:border-box;max-width:100%;min-width:0;color:var(--fg,#1f2933);font-size:14px;line-height:1.55;}",
      ".gi-lab *{box-sizing:border-box;}",
      ".gi-lab [hidden]{display:none!important;}",
      ".gi-lab button,.gi-lab select{font:inherit;}",
      ".gi-lab button{min-height:46px;padding:9px 12px;border:1px solid var(--border,#bbc7d1);border-radius:6px;background:var(--bg,#fff);color:inherit;cursor:pointer;}",
      ".gi-lab button:hover:not(:disabled){border-color:var(--accent,#1769aa);}",
      ".gi-lab button:focus-visible,.gi-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
      ".gi-lab button[aria-pressed=true],.gi-lab .gi-primary{border-color:var(--accent,#1769aa);background:var(--accent,#1769aa);color:#fff;font-weight:700;}",
      ".gi-lab button:disabled{cursor:not-allowed;opacity:.55;}",
      ".gi-lab .gi-heading{margin:0 0 5px;font-size:1.18rem;line-height:1.35;}",
      ".gi-lab .gi-note,.gi-lab .gi-feedback,.gi-lab .gi-disclaimer{margin:7px 0;color:var(--fg-soft,#52606d);}",
      ".gi-lab .gi-controls,.gi-lab .gi-preset-grid,.gi-lab .gi-action-row{display:flex;flex-wrap:wrap;gap:8px;}",
      ".gi-lab .gi-controls{align-items:end;margin:13px 0;}",
      ".gi-lab .gi-control{display:grid;flex:1 1 220px;min-width:180px;gap:5px;}",
      ".gi-lab .gi-control label{color:var(--fg-soft,#52606d);font-size:12px;font-weight:700;}",
      ".gi-lab select{min-height:46px;width:100%;padding:8px 10px;border:1px solid var(--border,#bbc7d1);border-radius:6px;background:var(--bg,#fff);color:inherit;}",
      ".gi-lab .gi-preset-grid{margin:12px 0;}",
      ".gi-lab .gi-preset-grid button{flex:1 1 170px;text-align:left;}",
      ".gi-lab .gi-preset-grid small{display:block;margin-top:3px;color:var(--fg-soft,#52606d);font-size:11px;font-weight:400;line-height:1.3;}",
      ".gi-lab .gi-preset-grid button[aria-pressed=true] small{color:#e7f3fb;}",
      ".gi-lab .gi-predict{margin:14px 0;padding:12px 14px;border-left:3px solid var(--cl-gold,#b7791f);background:var(--bg-soft,#f5f7f9);}",
      ".gi-lab .gi-predict-title{margin:0 0 8px;font-weight:700;}",
      ".gi-lab .gi-question{margin:12px 0 0;padding:0;border:0;}",
      ".gi-lab .gi-question legend{margin-bottom:7px;color:var(--fg,#1f2933);font-weight:700;}",
      ".gi-lab .gi-choice{display:flex;flex-wrap:wrap;gap:8px;}",
      ".gi-lab .gi-choice button{flex:1 1 190px;min-width:0;text-align:left;}",
      ".gi-lab .gi-feedback{min-height:1.7em;font-weight:700;}",
      ".gi-lab .gi-pass{color:var(--cl-green,#087f5b);}",
      ".gi-lab .gi-warn{color:var(--cl-red,#b42318);}",
      ".gi-lab .gi-result{margin-top:16px;padding-top:14px;border-top:1px solid var(--border,#bbc7d1);}",
      ".gi-lab .gi-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0;}",
      ".gi-lab .gi-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#bbc7d1);background:var(--bg-soft,#f5f7f9);}",
      ".gi-lab .gi-metric span{display:block;color:var(--fg-soft,#52606d);font-size:11px;}",
      ".gi-lab .gi-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
      ".gi-lab .gi-result-grid{display:grid;grid-template-columns:minmax(220px,.9fr) minmax(0,1.1fr);gap:14px;align-items:start;}",
      ".gi-lab svg{display:block;width:100%;height:auto;border:1px solid var(--border,#bbc7d1);border-radius:6px;background:var(--bg-soft,#f5f7f9);}",
      ".gi-lab svg text{fill:var(--fg,#1f2933);font-family:inherit;letter-spacing:0;}",
      ".gi-lab .gi-group-0{fill:var(--cl-blue-soft,#dceef8);stroke:var(--accent,#1769aa);}",
      ".gi-lab .gi-group-1{fill:#fbe4d5;stroke:#c05621;}",
      ".gi-lab .gi-group-2{fill:#e5f4e3;stroke:#2f855a;}",
      ".gi-lab .gi-group-3{fill:#eee5f8;stroke:#805ad5;}",
      ".gi-lab .gi-group{stroke-width:2;}",
      ".gi-lab .gi-root{fill:var(--bg,#fff);stroke:var(--fg,#1f2933);stroke-width:1.5;}",
      ".gi-lab .gi-ledger{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:14px;}",
      ".gi-lab table{width:100%;min-width:720px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}",
      ".gi-lab th,.gi-lab td{padding:7px 8px;border-bottom:1px solid var(--border,#bbc7d1);text-align:left;vertical-align:top;}",
      ".gi-lab th{color:var(--fg-soft,#52606d);font-size:11px;}",
      ".gi-lab .gi-formula{margin:10px 0;padding:10px 12px;overflow:auto;background:var(--bg-soft,#f5f7f9);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere;}",
      ".gi-lab .gi-check{margin:10px 0;padding:9px 11px;border-left:3px solid var(--cl-green,#087f5b);background:var(--bg-soft,#f5f7f9);}",
      "@media(max-width:760px){.gi-lab .gi-result-grid{grid-template-columns:minmax(0,1fr);}.gi-lab .gi-metrics{grid-template-columns:repeat(2,minmax(0,1fr));}}",
      "@media(max-width:430px){.gi-lab .gi-metrics{grid-template-columns:minmax(0,1fr);}.gi-lab .gi-choice button{flex-basis:100%;}.gi-lab table{font-size:11px;}}",
      "@media(prefers-reduced-motion:reduce){.gi-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
    ].join("\n");

    function fail(message) {
      throw new Error("galois-insolvability: " + message);
    }

    function mod(value, prime) {
      var result = Number(value) % prime;
      return result < 0 ? result + prime : result;
    }

    function isPrime(value) {
      var number = Math.floor(Number(value));
      var divisor;
      if (number < 2 || number !== Number(value)) return false;
      for (divisor = 2; divisor * divisor <= number; divisor += 1) {
        if (number % divisor === 0) return false;
      }
      return true;
    }

    function normalize(poly, prime) {
      var result = poly.map(function (coefficient) { return mod(coefficient, prime); });
      while (result.length > 1 && result[result.length - 1] === 0) result.pop();
      return result;
    }

    function degree(poly, prime) {
      return normalize(poly, prime).length - 1;
    }

    function isZero(poly, prime) {
      return normalize(poly, prime).length === 1 && normalize(poly, prime)[0] === 0;
    }

    function inverse(value, prime) {
      var candidate;
      var target = mod(value, prime);
      for (candidate = 1; candidate < prime; candidate += 1) {
        if (mod(target * candidate, prime) === 1) return candidate;
      }
      fail("nonzero modular inverse does not exist");
    }

    function monic(poly, prime) {
      var normalized = normalize(poly, prime);
      if (isZero(normalized, prime)) return [0];
      var factor = inverse(normalized[normalized.length - 1], prime);
      return normalized.map(function (coefficient) { return mod(coefficient * factor, prime); });
    }

    function subtract(left, right, prime) {
      var length = Math.max(left.length, right.length);
      var result = [];
      var index;
      for (index = 0; index < length; index += 1) {
        result[index] = mod((left[index] || 0) - (right[index] || 0), prime);
      }
      return normalize(result, prime);
    }

    function multiply(left, right, prime) {
      var result = [];
      var i;
      var j;
      for (i = 0; i < left.length + right.length - 1; i += 1) result[i] = 0;
      for (i = 0; i < left.length; i += 1) {
        for (j = 0; j < right.length; j += 1) {
          result[i + j] = mod(result[i + j] + left[i] * right[j], prime);
        }
      }
      return normalize(result, prime);
    }

    function divide(left, right, prime) {
      var remainder = normalize(left, prime);
      var divisor = normalize(right, prime);
      if (isZero(divisor, prime)) fail("division by zero polynomial");
      var quotient = [];
      var divisorDegree = divisor.length - 1;
      var divisorLead = divisor[divisorDegree];
      var index;
      for (index = 0; index <= Math.max(0, remainder.length - divisor.length); index += 1) quotient[index] = 0;
      while (!isZero(remainder, prime) && remainder.length - 1 >= divisorDegree) {
        var shift = remainder.length - 1 - divisorDegree;
        var factor = mod(remainder[remainder.length - 1] * inverse(divisorLead, prime), prime);
        quotient[shift] = mod((quotient[shift] || 0) + factor, prime);
        var term = [];
        for (index = 0; index < shift; index += 1) term[index] = 0;
        for (index = 0; index < divisor.length; index += 1) term[index + shift] = mod(divisor[index] * factor, prime);
        remainder = subtract(remainder, term, prime);
      }
      return { quotient: normalize(quotient, prime), remainder: normalize(remainder, prime) };
    }

    function derivative(poly, prime) {
      var result = [];
      var index;
      if (poly.length <= 1) return [0];
      for (index = 1; index < poly.length; index += 1) result[index - 1] = mod(index * poly[index], prime);
      return normalize(result, prime);
    }

    function gcd(left, right, prime) {
      var a = normalize(left, prime);
      var b = normalize(right, prime);
      while (!isZero(b, prime)) {
        var remainder = divide(a, b, prime).remainder;
        a = b;
        b = remainder;
      }
      return monic(a, prime);
    }

    function enumerateMonicDivisor(poly, divisorDegree, prime) {
      var limit = Math.pow(prime, divisorDegree);
      var code;
      var coefficientIndex;
      for (code = 0; code < limit; code += 1) {
        var candidate = [];
        var value = code;
        for (coefficientIndex = 0; coefficientIndex < divisorDegree; coefficientIndex += 1) {
          candidate[coefficientIndex] = value % prime;
          value = Math.floor(value / prime);
        }
        candidate[divisorDegree] = 1;
        var result = divide(poly, candidate, prime);
        if (isZero(result.remainder, prime)) return candidate;
      }
      return null;
    }

    function findFactor(poly, prime) {
      var polynomialDegree = degree(poly, prime);
      var divisorDegree;
      for (divisorDegree = 1; divisorDegree <= Math.floor(polynomialDegree / 2); divisorDegree += 1) {
        var factor = enumerateMonicDivisor(poly, divisorDegree, prime);
        if (factor) return factor;
      }
      return null;
    }

    function factorPolynomial(poly, prime) {
      var normalized = monic(poly, prime);
      if (degree(normalized, prime) <= 1) return [normalized];
      var factor = findFactor(normalized, prime);
      if (!factor) return [normalized];
      var quotient = divide(normalized, factor, prime).quotient;
      var factors = factorPolynomial(factor, prime).concat(factorPolynomial(quotient, prime));
      factors.sort(function (left, right) { return degree(left, prime) - degree(right, prime); });
      return factors;
    }

    function presetById(id) {
      var index;
      for (index = 0; index < PRESETS.length; index += 1) {
        if (PRESETS[index].id === id) return PRESETS[index];
      }
      fail("unknown polynomial: " + id);
    }

    function factorType(factors, prime) {
      return "(" + factors.map(function (factor) { return degree(factor, prime); }).join(",") + ")";
    }

    function formatPolynomial(poly, prime) {
      var terms = [];
      var index;
      for (index = poly.length - 1; index >= 0; index -= 1) {
        var coefficient = mod(poly[index], prime);
        if (coefficient === 0) continue;
        var monomial;
        if (index === 0) monomial = String(coefficient);
        else if (index === 1) monomial = (coefficient === 1 ? "" : coefficient + " ") + "x";
        else monomial = (coefficient === 1 ? "" : coefficient + " ") + "x^" + index;
        terms.push(monomial);
      }
      return terms.length ? terms.join(" + ") : "0";
    }

    function formatIntegerPolynomial(poly) {
      var terms = [];
      var index;
      for (index = poly.length - 1; index >= 0; index -= 1) {
        var coefficient = poly[index];
        if (coefficient === 0) continue;
        var absolute = Math.abs(coefficient);
        var monomial;
        if (index === 0) monomial = String(absolute);
        else if (index === 1) monomial = (absolute === 1 ? "" : absolute + " ") + "x";
        else monomial = (absolute === 1 ? "" : absolute + " ") + "x^" + index;
        if (terms.length === 0) terms.push(coefficient < 0 ? "-" + monomial : monomial);
        else terms.push((coefficient < 0 ? " - " : " + ") + monomial);
      }
      return terms.length ? terms.join("") : "0";
    }

    function samePolynomial(left, right, prime) {
      var a = normalize(left, prime);
      var b = normalize(right, prime);
      if (a.length !== b.length) return false;
      return a.every(function (coefficient, index) { return coefficient === b[index]; });
    }

    function analyze(id, prime) {
      var preset = presetById(id);
      var p = Math.floor(Number(prime));
      if (!isPrime(p)) fail("prime must be prime");
      var reduced = normalize(preset.coefficients, p);
      var derivativePoly = derivative(reduced, p);
      var repeated = degree(gcd(reduced, derivativePoly, p), p) > 0;
      var factors = factorPolynomial(reduced, p);
      var product = factors.reduce(function (left, right) { return multiply(left, right, p); }, [1]);
      var goodPrime = !repeated;
      return {
        id: id,
        expression: preset.expression,
        context: preset.context,
        prime: p,
        reduced: reduced,
        reducedText: formatPolynomial(reduced, p),
        factors: factors,
        factorTexts: factors.map(function (factor) { return formatPolynomial(factor, p); }),
        factorization: factors.map(function (factor) { return "(" + formatPolynomial(factor, p) + ")"; }).join(" * "),
        type: factorType(factors, p),
        repeated: repeated,
        squareFree: !repeated,
        goodPrime: goodPrime,
        productMatches: samePolynomial(product, reduced, p),
        certificate: goodPrime ? "cycle-type certificate" : "bad-prime warning"
      };
    }

    function ledger(id) {
      return PRIMES.map(function (prime) { return analyze(id, prime); });
    }

    function element(doc, tag, className, text) {
      var node = doc.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    }

    function svgElement(doc, tag, attributes, text) {
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attributes || {}).forEach(function (key) {
        node.setAttribute(key, String(attributes[key]));
      });
      if (text !== undefined) node.textContent = text;
      return node;
    }

    function installStyles(doc) {
      if (doc.getElementById(STYLE_ID)) return;
      var style = element(doc, "style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement).appendChild(style);
    }

    function metric(doc, label, value) {
      var node = element(doc, "div", "gi-metric");
      node.appendChild(element(doc, "span", "", label));
      node.appendChild(element(doc, "strong", "", value));
      return node;
    }

    function announce(api, root, message) {
      if (api && typeof api.announce === "function") api.announce(root, message);
    }

    function addOption(doc, select, value, label) {
      var option = element(doc, "option", "", label);
      option.value = value;
      select.appendChild(option);
    }

    function buildSvg(doc, report) {
      var svg = svgElement(doc, "svg", {
        viewBox: "0 0 640 280",
        role: "img",
        "aria-label": report.expression + " 模素数 " + report.prime + " 的循环型分组"
      });
      svg.appendChild(svgElement(doc, "title", {}, report.expression + " 的 Frobenius 循环型证书"));
      svg.appendChild(svgElement(doc, "text", { x: 28, y: 28, "font-size": 14, "font-weight": 700 }, "factor degrees = cycle lengths"));
      svg.appendChild(svgElement(doc, "text", { x: 28, y: 51, "font-size": 12 }, "only a certificate when the reduction is square-free"));
      var startX = 70;
      var totalWidth = 510;
      var cursor = startX;
      var rootIndex = 1;
      report.factors.forEach(function (factor, factorIndex) {
        var size = degree(factor, report.prime);
        var width = totalWidth * size / 5;
        svg.appendChild(svgElement(doc, "rect", {
          x: cursor,
          y: 84,
          width: width - 6,
          height: 116,
          rx: 6,
          class: "gi-group gi-group-" + (factorIndex % 4)
        }));
        svg.appendChild(svgElement(doc, "text", {
          x: cursor + (width - 6) / 2,
          y: 105,
          "text-anchor": "middle",
          "font-size": 12,
          "font-weight": 700
        }, "degree " + size));
        var pointIndex;
        for (pointIndex = 0; pointIndex < size; pointIndex += 1) {
          var centerX = cursor + (width - 6) * (pointIndex + 1) / (size + 1);
          var centerY = 150;
          svg.appendChild(svgElement(doc, "circle", { cx: centerX, cy: centerY, r: 18, class: "gi-root" }));
          svg.appendChild(svgElement(doc, "text", {
            x: centerX,
            y: centerY + 4,
            "text-anchor": "middle",
            "font-size": 11
          }, "a" + rootIndex));
          rootIndex += 1;
        }
        cursor += width;
      });
      svg.appendChild(svgElement(doc, "text", { x: 28, y: 238, "font-size": 12 }, "当前型：" + report.type + "；群元素的循环型，不是整个群的标签"));
      svg.appendChild(svgElement(doc, "text", { x: 28, y: 259, "font-size": 12 }, report.goodPrime ? "好素数：可作为 Frobenius 证书" : "重因子：此处不作为普通 Frobenius 证书"));
      return svg;
    }

    function buildLedger(doc, reports) {
      var wrapper = element(doc, "div", "gi-ledger");
      var table = element(doc, "table");
      var head = element(doc, "thead");
      var headRow = element(doc, "tr");
      ["素数 p", "模 p 分解", "分解型", "平方自由", "证书状态"].forEach(function (label) {
        headRow.appendChild(element(doc, "th", "", label));
      });
      head.appendChild(headRow);
      table.appendChild(head);
      var body = element(doc, "tbody");
      reports.forEach(function (report) {
        var row = element(doc, "tr");
        [
          String(report.prime),
          report.factorization,
          report.type,
          report.squareFree ? "是" : "否，有重因子",
          report.goodPrime ? "循环型证书" : "不是普通证书"
        ].forEach(function (value) { row.appendChild(element(doc, "td", "", value)); });
        body.appendChild(row);
      });
      table.appendChild(body);
      wrapper.appendChild(table);
      return wrapper;
    }

    function buildResult(doc, report) {
      var section = element(doc, "section", "gi-result");
      section.appendChild(element(doc, "h4", "", "揭示后的有限域证书账本"));
      var metrics = element(doc, "div", "gi-metrics");
      metrics.appendChild(metric(doc, "当前素数 p", String(report.prime)));
      metrics.appendChild(metric(doc, "模 p 分解型", report.type));
      metrics.appendChild(metric(doc, "平方自由", report.squareFree ? "是" : "否"));
      metrics.appendChild(metric(doc, "证书", report.goodPrime ? "可用" : "暂停"));
      section.appendChild(metrics);
      var resultGrid = element(doc, "div", "gi-result-grid");
      resultGrid.appendChild(buildSvg(doc, report));
      var textColumn = element(doc, "div");
      textColumn.appendChild(element(doc, "div", "gi-formula", report.expression + "\nmod " + report.prime + ": " + report.reducedText + "\n" + report.factorization));
      var interpretation;
      if (report.goodPrime) {
        interpretation = "好素数证书：分解型 " + report.type + " 只说明 Galois 群中存在一个相应循环型的元素。它是证据集合中的一张证书，不单独等于整个 Galois 群。";
      } else {
        interpretation = "失败边界：约化式有重因子，当前 p 不是无分歧的普通循环型证书；先换好素数，不能把这一行硬解释成 Frobenius 型。";
      }
      textColumn.appendChild(element(doc, "p", "gi-check", interpretation));
      textColumn.appendChild(buildLedger(doc, ledger(report.id)));
      textColumn.appendChild(element(doc, "p", "gi-disclaimer", "即使多张证书共同指向 S5，仍需不可约性、判别式和有限群论的收口；实验不执行数值求根，也不生成根式公式。"));
      resultGrid.appendChild(textColumn);
      section.appendChild(resultGrid);
      return section;
    }

    function freshState() {
      return { presetId: "s5-main", prime: 2, answers: {}, revealed: false };
    }

    function mount(root, api) {
      if (!root || !root.ownerDocument) return;
      var doc = root.ownerDocument;
      INSTANCE += 1;
      installStyles(doc);
      var state = freshState();

      function reset() {
        state = freshState();
        render();
        announce(api, root, "已重置为默认五次和 p=2，证书重新隐藏。");
      }

      function choosePreset(id) {
        state.presetId = id;
        state.answers = {};
        state.revealed = false;
        render();
        announce(api, root, "已切换具体多项式；请重新预测证书边界。");
      }

      function choosePrime(value) {
        state.prime = Number(value);
        state.answers = {};
        state.revealed = false;
        render();
        announce(api, root, "已切换素数；请重新预测当前约化的证书含义。");
      }

      function render() {
        var report = analyze(state.presetId, state.prime);
        var shell = element(doc, "div", "gi-lab");
        shell.appendChild(element(doc, "h3", "gi-heading", "不可解性：先押证书，再看群论边界"));
        shell.appendChild(element(doc, "p", "gi-note", "有限域分解是精确的离散证据，但只显示群元素的循环型；结果揭示前不显示因子账本。"));

        var presets = element(doc, "div", "gi-preset-grid");
        PRESETS.forEach(function (item) {
          var button = element(doc, "button", "", item.label);
          button.type = "button";
          button.setAttribute("aria-pressed", item.id === state.presetId ? "true" : "false");
          button.setAttribute("aria-label", "选择" + item.label);
          button.appendChild(element(doc, "small", "", item.context));
          button.addEventListener("click", function () { choosePreset(item.id); });
          presets.appendChild(button);
        });
        shell.appendChild(presets);

        var controls = element(doc, "div", "gi-controls");
        var polynomialControl = element(doc, "div", "gi-control");
        polynomialControl.appendChild(element(doc, "label", "", "具体多项式"));
        var polynomialSelect = element(doc, "select");
        PRESETS.forEach(function (item) { addOption(doc, polynomialSelect, item.id, item.expression); });
        polynomialSelect.value = state.presetId;
        polynomialSelect.addEventListener("change", function (event) { choosePreset(event.target.value); });
        polynomialControl.appendChild(polynomialSelect);
        controls.appendChild(polynomialControl);

        var primeControl = element(doc, "div", "gi-control");
        primeControl.appendChild(element(doc, "label", "", "检验素数 p"));
        var primeSelect = element(doc, "select");
        PRIMES.forEach(function (prime) { addOption(doc, primeSelect, String(prime), "p = " + prime); });
        primeSelect.value = String(state.prime);
        primeSelect.addEventListener("change", function (event) { choosePrime(event.target.value); });
        primeControl.appendChild(primeSelect);
        controls.appendChild(primeControl);
        shell.appendChild(controls);

        var prediction = element(doc, "div", "gi-predict");
        prediction.appendChild(element(doc, "p", "gi-predict-title", "先预测：三道题全部选择后，结果才可揭示。"));
        PREDICTIONS.forEach(function (question, questionIndex) {
          var fieldset = element(doc, "fieldset", "gi-question");
          fieldset.appendChild(element(doc, "legend", "", (questionIndex + 1) + ". " + question.prompt));
          var choices = element(doc, "div", "gi-choice");
          question.options.forEach(function (option) {
            var choice = element(doc, "button", "", option.label);
            choice.type = "button";
            choice.setAttribute("aria-pressed", state.answers[question.id] === option.id ? "true" : "false");
            choice.addEventListener("click", function () {
              state.answers[question.id] = option.id;
              state.revealed = false;
              render();
            });
            choices.appendChild(choice);
          });
          fieldset.appendChild(choices);
          prediction.appendChild(fieldset);
        });
        shell.appendChild(prediction);

        var complete = PREDICTIONS.every(function (question) { return state.answers[question.id]; });
        var actionRow = element(doc, "div", "gi-action-row");
        var reveal = element(doc, "button", "gi-primary", "揭示证书");
        reveal.type = "button";
        reveal.disabled = !complete;
        reveal.addEventListener("click", function () {
          if (!complete) return;
          state.revealed = true;
          render();
          announce(api, root, "证书已揭示：请区分循环型、完整群判定和根式公式。");
        });
        actionRow.appendChild(reveal);
        var resetButton = element(doc, "button", "", "重置");
        resetButton.type = "button";
        resetButton.addEventListener("click", reset);
        actionRow.appendChild(resetButton);
        shell.appendChild(actionRow);

        var feedback = element(doc, "p", "gi-feedback");
        if (!complete) feedback.textContent = "预测尚未完成，因子与循环型保持隐藏。";
        else if (!state.revealed) feedback.textContent = "三道预测已提交；现在可以揭示证书账本。";
        else {
          var score = PREDICTIONS.reduce(function (total, question) {
            return total + (state.answers[question.id] === question.answer ? 1 : 0);
          }, 0);
          feedback.className = "gi-feedback " + (score === PREDICTIONS.length ? "gi-pass" : "gi-warn");
          feedback.textContent = "预测得分 " + score + "/" + PREDICTIONS.length + "；先读假设，再读分解型。";
        }
        shell.appendChild(feedback);
        if (state.revealed) shell.appendChild(buildResult(doc, report));
        else shell.appendChild(element(doc, "p", "gi-disclaimer", "结果锁定：提交预测后才能看到 SVG、因子和跨素数表格。"));
        while (root.firstChild) root.removeChild(root.firstChild);
        root.appendChild(shell);
      }

      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) {
        checks += 1;
        if (!condition) fail(message);
      }
      check(PRESETS.length === 3, "three polynomial examples");
      check(PRIMES.length === 5 && PRIMES.every(isPrime), "prime menu");
      var mainAtTwo = analyze("s5-main", 2);
      check(mainAtTwo.goodPrime, "main p=2 is square-free");
      check(mainAtTwo.type === "(1,4)", "main p=2 gives (1,4)");
      check(mainAtTwo.productMatches, "main factor reconstruction");
      var mainLedger = ledger("s5-main");
      check(mainLedger.every(function (report) { return report.factors.reduce(function (sum, factor) { return sum + degree(factor, report.prime); }, 0) === 5; }), "factor degrees sum to five");
      check(mainLedger.some(function (report) { return report.goodPrime && report.type === "(2,3)"; }), "a second cycle type certificate exists");
      var bad = analyze("s5-second", 2);
      check(bad.repeated && !bad.goodPrime, "repeated factor is a bad-prime warning");
      var radical = analyze("radical-control", 3);
      check(radical.productMatches, "radical control reconstruction");
      check(ledger("radical-control").length === PRIMES.length, "ledger covers all selected primes");
      check(formatIntegerPolynomial([3, -6, 0, 0, 0, 1]) === "x^5 - 6 x + 3", "integer polynomial display");
      check(formatPolynomial(mainAtTwo.reduced, 2).length > 0, "finite-field display");
      return { ok: true, checks: checks, examples: PRESETS.length, primes: PRIMES.length };
    }

    var exported = {
      PRIMES: PRIMES,
      PRESETS: PRESETS,
      PREDICTIONS: PREDICTIONS,
      analyze: analyze,
      factorPolynomial: factorPolynomial,
      ledger: ledger,
      formatPolynomial: formatPolynomial,
      selfTest: selfTest,
      mount: mount
    };

    return exported;
  }
);

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
    root.CourseLearning.register("information-processing", exported.mount);
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
        "information-processing self-test: PASS (" +
          report.checks +
          " checks, " +
          report.grid +
          " grid points)"
      );
    } catch (error) {
      console.error("information-processing self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-information-processing-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;
  var DEFAULT = Object.freeze({ eta: 0.1, rho: 0.2 });
  var PRESETS = [
    {
      id: "default",
      label: "默认 η=.10, ρ=.20",
      eta: 0.1,
      rho: 0.2
    },
    {
      id: "recover",
      label: "可恢复：ρ=0",
      eta: 0.1,
      rho: 0
    },
    {
      id: "scramble",
      label: "完全打散：ρ=.50",
      eta: 0.1,
      rho: 0.5
    },
    {
      id: "support",
      label: "支持端点：η=0, ρ=0",
      eta: 0,
      rho: 0
    },
    {
      id: "uninformative",
      label: "第一次已无信息：η=.50",
      eta: 0.5,
      rho: 0.2
    }
  ];

  PRESETS.push({id: "rare", label: "微弱信息：η=ρ=.4999", eta: 0.4999, rho: 0.4999});
  PRESETS.forEach(Object.freeze);
  Object.freeze(PRESETS);

  var STYLE_TEXT = [
    ".ip-lab{--ip-blue:var(--cl-blue,#315f9d);--ip-gold:var(--cl-gold,#9b6a12);--ip-green:var(--cl-green,#39734d);--ip-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;}",
    ".ip-lab *,.ip-lab *::before,.ip-lab *::after{box-sizing:border-box;}",
    ".ip-lab [hidden]{display:none!important;}",
    ".ip-lab h3,.ip-lab h4{color:var(--fg);}",
    ".ip-lab h3{margin:0 0 8px;font-size:1.2rem;}",
    ".ip-lab h4{margin:16px 0 8px;font-size:1rem;}",
    ".ip-lab .ip-note,.ip-lab .ip-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65;overflow-wrap:anywhere;}",
    ".ip-lab .ip-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--ip-gold);background:var(--bg);}",
    ".ip-lab fieldset{min-width:0;margin:0;padding:0;border:0;}",
    ".ip-lab legend{margin-bottom:8px;color:var(--fg-soft);font-size:13px;font-weight:750;}",
    ".ip-lab .ip-question-list{display:grid;gap:12px;}",
    ".ip-lab .ip-question{min-width:0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);}",
    ".ip-lab .ip-question-title{display:block;margin-bottom:8px;color:var(--fg);font-size:13px;font-weight:700;overflow-wrap:anywhere;}",
    ".ip-lab .ip-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}",
    ".ip-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}",
    ".ip-lab button:hover{border-color:var(--accent);}",
    ".ip-lab button[aria-pressed=\"true\"],.ip-lab button.ip-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:700;}",
    ".ip-lab button:disabled{cursor:not-allowed;opacity:.52;}",
    ".ip-lab button:focus-visible,.ip-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
    ".ip-lab .ip-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}",
    ".ip-lab .ip-actions>*{flex:1 1 160px;}",
    ".ip-lab .ip-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}",
    ".ip-lab .ip-pass{color:var(--ip-green);}",
    ".ip-lab .ip-warn{color:var(--ip-red);}",
    ".ip-lab .ip-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}",
    ".ip-lab .ip-layout{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;align-items:start;min-width:0;}",
    ".ip-lab .ip-controls,.ip-lab .ip-stage{min-width:0;}",
    ".ip-lab .ip-controls{display:grid;gap:12px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}",
    ".ip-lab .ip-control{display:grid;gap:5px;min-width:0;}",
    ".ip-lab .ip-control label{color:var(--fg-soft);font-size:13px;font-weight:700;}",
    ".ip-lab .ip-control output{color:var(--accent);font-variant-numeric:tabular-nums;}",
    ".ip-lab .ip-control input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}",
    ".ip-lab .ip-scale{display:flex;justify-content:space-between;gap:8px;color:var(--fg-soft);font-size:11px;}",
    ".ip-lab .ip-preset-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;}",
    ".ip-lab .ip-preset-row button{font-size:12px;}",
    ".ip-lab .ip-stage-frame{min-width:0;padding:9px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}",
    ".ip-lab .ip-stage-title{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin:0 0 8px;color:var(--fg-soft);font-size:13px;}",
    ".ip-lab .ip-svg{display:block;width:560px;max-width:none!important;height:320px;color:var(--fg);}",
    ".ip-lab .ip-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}",
    ".ip-lab .ip-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.7;}",
    ".ip-lab .ip-axis{stroke:currentColor;stroke-width:1.3;stroke-opacity:.75;}",
    ".ip-lab .ip-bar-y{fill:var(--ip-blue);fill-opacity:.78;}",
    ".ip-lab .ip-bar-z{fill:var(--ip-gold);fill-opacity:.82;}",
    ".ip-lab .ip-value-y{fill:var(--ip-blue)!important;font-weight:800;}",
    ".ip-lab .ip-value-z{fill:var(--ip-gold)!important;font-weight:800;}",
    ".ip-lab .ip-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:8px;margin:12px 0;}",
    ".ip-lab .ip-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}",
    ".ip-lab .ip-metric:nth-child(1),.ip-lab .ip-metric:nth-child(3){border-top-color:var(--ip-blue);}",
    ".ip-lab .ip-metric:nth-child(2),.ip-lab .ip-metric:nth-child(4){border-top-color:var(--ip-gold);}",
    ".ip-lab .ip-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4;}",
    ".ip-lab .ip-metric strong{display:block;margin-top:3px;color:var(--fg);font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
    ".ip-lab .ip-table-wrap{max-width:100%;margin-top:10px;overflow-x:auto;-webkit-overflow-scrolling:touch;}",
    ".ip-lab table{width:100%;min-width:900px;display:table!important;max-width:none!important;overflow:visible!important;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}",
    ".ip-lab th,.ip-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere;}",
    ".ip-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750;}",
    ".ip-lab .ip-interpretation{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--ip-green);background:var(--bg);color:var(--fg);font-size:13px;line-height:1.7;overflow-wrap:anywhere;}",
    "@media(max-width:760px){.ip-lab .ip-choice-row{grid-template-columns:minmax(0,1fr);}.ip-lab .ip-layout{grid-template-columns:minmax(0,1fr);}.ip-lab .ip-preset-row{grid-template-columns:minmax(0,1fr);}}",
    "@media(prefers-reduced-motion:reduce){.ip-lab *{animation:none!important;transition:none!important;}}",
    ".ip-lab .ip-scroll{max-width:100%;overflow-x:auto;overscroll-behavior-x:contain;}.ip-lab .ip-scroll:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}\n@media(prefers-reduced-motion:reduce){html:has(.ip-lab){scroll-behavior:auto!important;}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function near(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance || EPS);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function validateNoise(value, name) {
    if (!finite(value) || value < 0 || value > 0.5) {
      throw new RangeError(name + " must be in [0, 0.5]");
    }
  }

  function h2(p) {
    if (!finite(p) || p < 0 || p > 1) {
      throw new RangeError("h2 expects p in [0, 1]");
    }
    if (p === 0 || p === 1) {
      return 0;
    }
    p = Math.min(p, 1 - p);
    return -(p * Math.log(p) + (1 - p) * Math.log1p(-p)) / Math.LN2;
  }

  function tau(eta, rho) {
    validateNoise(eta, "eta");
    validateNoise(rho, "rho");
    return eta + (1 - 2 * eta) * rho;
  }

  function binaryRow(input, noise) {
    validateNoise(noise, "noise");
    if (input !== 0 && input !== 1) {
      throw new RangeError("input bit must be 0 or 1");
    }
    return input === 0 ? [1 - noise, noise] : [noise, 1 - noise];
  }

  // Public KL API: accept probability rows only. Normalize their permitted
  // (<=1e-12) summation roundoff explicitly; never turn arbitrary weights into rows.
  function probabilityRow(row) {
    if (!Array.isArray(row) || row.length === 0 || row.length > 256) {
      throw new TypeError("probability row must have 1..256 entries");
    }
    row.forEach(function (v) {
      if (!finite(v) || v < 0 || v > 1) throw new RangeError("invalid probability");
    });
    var mass = compensatedSum(row);
    if (Math.abs((mass[0] - 1) + mass[1]) > 1e-12) throw new RangeError("probabilities must sum to 1");
    return {values: row.slice(), mass: mass};
  }

  function compensatedSum(values) {
    var total = 0, error = 0;
    values.forEach(function (v) {
      var next = total + v;
      error += Math.abs(total) >= Math.abs(v) ? (total - next) + v : (v - next) + total;
      total = next;
    });
    return [total, error];
  }

  function productParts(a, b) {
    var value = a * b;
    var ca = 134217729 * a, cb = 134217729 * b;
    var ah = ca - (ca - a), al = a - ah, bh = cb - (cb - b), bl = b - bh;
    return [value, ((ah * bh - value) + ah * bl + al * bh) + al * bl];
  }

  function kl(p, q) {
    var pp = probabilityRow(p), qq = probabilityRow(q);
    p = pp.values; q = qq.values;
    if (p.length !== q.length) throw new TypeError("KL row lengths differ");
    var A = pp.mass, B = qq.mass;
    var massP = A[0] + A[1], massQ = B[0] + B[1];
    // f-divergence form: p*log(p/q)-p+q is nonnegative term by term.
    // Its sum equals KL for normalized rows, without cancellation between signs.
    var total = 0;
    for (var i = 0; i < p.length; i += 1) {
      if (p[i] === 0) { total += q[i] / massQ; continue; }
      if (q[i] === 0) return Infinity;
      // Relative difference of the normalized probabilities. Retain the low
      // parts of the row masses and products before cancellation.
      var pb = productParts(p[i], B[0]), qa = productParts(q[i], A[0]);
      var delta = compensatedSum([pb[0], -qa[0], pb[1], -qa[1], p[i] * B[1], -q[i] * A[1]]);
      var d = (delta[0] + delta[1]) / (q[i] * massP), term;
      if (Math.abs(d) <= 0.5) {
        var power = d * d, value = power / 2;
        for (var n = 3; n < 256; n += 1) {
          power *= -d;
          var next = value + power / (n * (n - 1));
          if (next === value) break;
          value = next;
        }
        term = (q[i] / massQ) * value;
      } else {
        var x = p[i] / massP, y = q[i] / massQ;
        var logRatio = Math.log(p[i]) - Math.log(q[i]) + Math.log(B[0]) + Math.log1p(B[1] / B[0]) - Math.log(A[0]) - Math.log1p(A[1] / A[0]);
        term = x * logRatio - (x - y);
      }
      total += term;
    }
    return total / Math.LN2;
  }

  function informationFromBias(bias, noise) {
    if (bias <= 0.5) {
      var power = bias * bias, value = power / 2;
      for (var k = 2; k < 128; k += 1) {
        power *= bias * bias;
        var next = value + power / ((2 * k) * (2 * k - 1));
        if (next === value) break;
        value = next;
      }
      return value / Math.LN2;
    }
    return 1 - h2(noise);
  }

  function conditionalKL(bias, noise) {
    if (noise === 0) return Infinity;
    var logRatio = bias <= 0.5
      ? Math.log1p(bias) - Math.log1p(-bias)
      : Math.log1p(-noise) - Math.log(noise);
    return bias * logRatio / Math.LN2;
  }

  function sum(values) {
    return values.reduce(function (total, value) {
      return total + value;
    }, 0);
  }

  function summarize(eta, rho) {
    validateNoise(eta, "eta");
    validateNoise(rho, "rho");

    var totalNoise = tau(eta, rho);
    var biasY = 1 - 2 * eta;
    var biasZ = biasY * (1 - 2 * rho);
    var iXY = informationFromBias(biasY, eta);
    var iXZ = informationFromBias(biasZ, totalNoise);
    var pY = [0.5, 0.5];
    var pZ = [0.5, 0.5];
    var yRows = [binaryRow(0, eta), binaryRow(1, eta)];
    var zGivenYRows = [binaryRow(0, rho), binaryRow(1, rho)];
    var zRows = [binaryRow(0, totalNoise), binaryRow(1, totalNoise)];
    var yMiRows = yRows.map(function (row, x) {
      var rowKl = iXY;
      return {
        x: x,
        pX: 0.5,
        row: row,
        marginal: pY.slice(),
        kl: rowKl,
        contribution: 0.5 * rowKl
      };
    });
    var zMiRows = zRows.map(function (row, x) {
      var rowKl = iXZ;
      return {
        x: x,
        pX: 0.5,
        row: row,
        marginal: pZ.slice(),
        kl: rowKl,
        contribution: 0.5 * rowKl
      };
    });

    return {
      eta: eta,
      rho: rho,
      tau: totalNoise,
      hEta: h2(eta),
      hTau: h2(totalNoise),
      iXY: iXY,
      iXZ: iXZ,
      biasY: biasY,
      biasZ: biasZ,
      dpiEquality: rho === 0 || eta === 0.5,
      pY: pY,
      pZ: pZ,
      yRows: yRows,
      zGivenYRows: zGivenYRows,
      zRows: zRows,
      yMiRows: yMiRows,
      zMiRows: zMiRows,
      inputConditionalKL: conditionalKL(biasY, eta),
      outputConditionalKL: conditionalKL(biasZ, totalNoise)
    };
  }

  function assertNoNaN(value, path, assert) {
    if (typeof value === "number") {
      assert(!isNaN(value), path + " is NaN");
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(function (item, index) {
        assertNoNaN(item, path + "[" + index + "]", assert);
      });
      return;
    }
    if (value && typeof value === "object") {
      Object.keys(value).forEach(function (key) {
        assertNoNaN(value[key], path + "." + key, assert);
      });
    }
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) {
        throw new Error(message);
      }
    }

    assert(h2(0) === 0, "h2(0) endpoint");
    assert(h2(1) === 0, "h2(1) endpoint");
    assert(near(h2(0.5), 1), "h2(0.5)");
    assert(near(tau(0.1, 0.2), 0.26), "tau default");
    assert(near(kl([1, 0], [0.5, 0.5]), 1), "finite endpoint KL");
    assert(kl([1, 0], [0, 1]) === Infinity, "support KL infinity");

    var grid = [0, Number.MIN_VALUE, 1e-20, 0.01, 0.1, 0.25, 0.4999, 0.49999999999999994, 0.5];
    grid.forEach(function (eta) {
      grid.forEach(function (rho) {
        var data = summarize(eta, rho);
        assertNoNaN(data, "summary", assert);
        assert(data.iXY >= -EPS && data.iXY <= 1 + EPS, "I(X;Y) bounds");
        assert(data.iXZ >= -EPS && data.iXZ <= 1 + EPS, "I(X;Z) bounds");
        assert(
          data.iXZ <= data.iXY + EPS,
          "DPI at eta=" + eta + ", rho=" + rho
        );
        assert(
          near(
            sum(data.yMiRows.map(function (row) {
              return row.contribution;
            })),
            data.iXY
          ),
          "I(X;Y) conditional-KL decomposition"
        );
        assert(
          near(
            sum(data.zMiRows.map(function (row) {
              return row.contribution;
            })),
            data.iXZ
          ),
          "I(X;Z) conditional-KL decomposition"
        );
        assert(near(sum(data.yRows[0]), 1), "Y row 0 normalization");
        assert(near(sum(data.yRows[1]), 1), "Y row 1 normalization");
        assert(near(sum(data.zRows[0]), 1), "Z row 0 normalization");
        assert(near(sum(data.zRows[1]), 1), "Z row 1 normalization");

        if (rho === 0) {
          assert(near(data.iXZ, data.iXY), "rho=0 equality");
        }
        if (rho === 0.5) {
          assert(near(data.iXZ, 0), "rho=.5 gives zero");
        }
        if (eta === 0.5) {
          assert(near(data.iXY, 0) && near(data.iXZ, 0), "eta=.5 equality");
        }
        if (finite(data.inputConditionalKL)) {
          assert(
            data.outputConditionalKL <= data.inputConditionalKL + EPS,
            "conditional KL contraction"
          );
        }
        if (eta === 0 && rho === 0) {
          assert(
            data.inputConditionalKL === Infinity &&
              data.outputConditionalKL === Infinity,
            "identity preserves endpoint infinity"
          );
        }
        if (eta === 0 && rho > 0 && rho < 0.5) {
          assert(
            finite(data.outputConditionalKL),
            "positive second noise repairs support"
          );
        }
      });
    });

    var defaultData = summarize(DEFAULT.eta, DEFAULT.rho);
    assert(near(defaultData.iXY, 0.5310044064107188), "default I(X;Y)");
    assert(near(defaultData.iXZ, 0.17325362750738216), "default I(X;Z)");
    assert(defaultData.inputConditionalKL > defaultData.outputConditionalKL, "default KL strict contraction");

    assert(summarize(0.4999, 0.4999).iXZ > 1e-15, "small nonzero cascade MI");
    assert(summarize(0.49999999999999994, 0.49999999999999994).iXZ > 1e-65, "bias survives rounded tau");
    assert(!summarize(0.1, Number.MIN_VALUE).dpiEquality, "exact strictness without EPS");
    assert(finite(summarize(Number.MIN_VALUE, 0).inputConditionalKL), "tiny positive support finite");
    assert(Math.abs(kl([0.5, 0.49999999999999994], [0.5, 0.5]) / 2.222823663893618e-33 - 1) < 1e-13, "retain normalization residual in tiny KL");
    assert(format(0.0001, 3) !== "0", "small chart label remains nonzero");
    var invalid = [
      function () { return kl([], []); },
      function () { return kl([1, 0], [0, NaN]); },
      function () { return kl([2, 0], [1, 0]); },
      function () { return kl([0.2, 0.2], [0.5, 0.5]); },
      function () { return summarize(-1, 0); }
    ];
    invalid.forEach(function (call) {
      var failed = false; try { call(); } catch (_) { failed = true; }
      assert(failed, "strict validation");
    });
    return { checks: checks, grid: grid.length * grid.length };
  }

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) {
        return;
      }
      if (key === "className") {
        node.setAttribute("class", String(value));
      } else if (key === "htmlFor") {
        node.setAttribute("for", String(value));
      } else if (key.slice(0, 2) === "on" && typeof value === "function") {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (value === true) {
        node.setAttribute(key, "");
      } else {
        node.setAttribute(key, String(value));
      }
    });
    return node;
  }

  function appendChildren(doc, node, children) {
    if (children === undefined || children === null) {
      return node;
    }
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) {
        return;
      }
      node.appendChild(
        child && child.nodeType ? child : doc.createTextNode(String(child))
      );
    });
    return node;
  }

  function element(doc, tag, attrs, children) {
    return appendChildren(
      doc,
      setAttributes(doc.createElement(tag), attrs || {}),
      children
    );
  }

  function svgNode(doc, tag, attrs, children) {
    return appendChildren(
      doc,
      setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}),
      children
    );
  }

  function clear(node) {
    while (node && node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) {
      return;
    }
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function format(value, digits) {
    if (value === Infinity) {
      return "∞";
    }
    if (value === -Infinity) {
      return "-∞";
    }
    if (!finite(value)) {
      return "—";
    }
    if (value === 0) return "0";
    if (Math.abs(value) < 0.0001 || Math.abs(value) >= 1e6) return value.toExponential(5);
    var places = digits === undefined ? 4 : digits;
    var text = value.toFixed(places);
    if (Number(text) === 0) return value.toExponential(5);
    return text.indexOf(".") === -1
      ? text
      : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function probabilityText(row) {
    return "(" + format(row[0], 4) + ", " + format(row[1], 4) + ")";
  }

  function metric(doc, label) {
    var value = element(doc, "strong", {}, ["—"]);
    return {
      node: element(doc, "div", { className: "ip-metric" }, [
        element(doc, "span", {}, [label]),
        value
      ]),
      value: value
    };
  }

  function makeTable(doc, ariaLabel, headers) {
    var table = element(doc, "table", { "aria-label": ariaLabel });
    var headRow = element(doc, "tr", {}, []);
    headers.forEach(function (header) {
      headRow.appendChild(element(doc, "th", { scope: "col" }, [header]));
    });
    table.appendChild(element(doc, "thead", {}, [headRow]));
    table.appendChild(element(doc, "tbody", {}, []));
    return table;
  }

  function replaceTableRows(table, rows) {
    var body = table.querySelector("tbody");
    clear(body);
    rows.forEach(function (row) {
      var tr = element(table.ownerDocument, "tr", {}, []);
      row.forEach(function (value) {
        tr.appendChild(element(table.ownerDocument, "td", {}, [value]));
      });
      body.appendChild(tr);
    });
  }

  function drawChart(doc, svg, data, uid) {
    clear(svg);
    var left = 72;
    var top = 38;
    var width = 430;
    var height = 210;
    var bottom = top + height;
    var right = left + width;
    var titleId = uid + "-chart-title";
    var descId = uid + "-chart-desc";
    svg.setAttribute("aria-labelledby", titleId + " " + descId);
    svg.appendChild(
      svgNode(doc, "title", { id: titleId }, [
        "二元信道互信息，纵轴固定为 0 到 1 bits"
      ])
    );
    svg.appendChild(
      svgNode(doc, "desc", { id: descId }, [
        "蓝柱表示 I(X;Y)，金柱表示 I(X;Z)，第二柱不超过第一柱。"
      ])
    );
    svg.appendChild(
      svgNode(doc, "text", {
        x: 18,
        y: 145,
        "font-size": 12,
        "text-anchor": "middle",
        transform: "rotate(-90 18 145)"
      }, ["bits"])
    );
    svg.appendChild(
      svgNode(doc, "text", {
        x: left,
        y: 20,
        "font-size": 13,
        "font-weight": 750
      }, ["互信息（固定 0 到 1 bits）"])
    );

    [0, 0.25, 0.5, 0.75, 1].forEach(function (tick) {
      var y = bottom - tick * height;
      svg.appendChild(
        svgNode(doc, "line", {
          x1: left,
          y1: y,
          x2: right,
          y2: y,
          class: "ip-grid"
        })
      );
      svg.appendChild(
        svgNode(doc, "text", {
          x: left - 10,
          y: y + 4,
          "font-size": 11,
          "text-anchor": "end"
        }, [format(tick, 2)])
      );
    });

    svg.appendChild(
      svgNode(doc, "line", {
        x1: left,
        y1: top,
        x2: left,
        y2: bottom,
        class: "ip-axis"
      })
    );
    svg.appendChild(
      svgNode(doc, "line", {
        x1: left,
        y1: bottom,
        x2: right,
        y2: bottom,
        class: "ip-axis"
      })
    );

    var values = [
      {
        x: 156,
        value: data.iXY,
        label: "I(X;Y)",
        barClass: "ip-bar-y",
        valueClass: "ip-value-y"
      },
      {
        x: 346,
        value: data.iXZ,
        label: "I(X;Z)",
        barClass: "ip-bar-z",
        valueClass: "ip-value-z"
      }
    ];
    values.forEach(function (item) {
      var barHeight = item.value * height;
      var y = bottom - barHeight;
      svg.appendChild(
        svgNode(doc, "rect", {
          x: item.x,
          y: y,
          width: 96,
          height: barHeight,
          rx: 3,
          class: item.barClass
        })
      );
      svg.appendChild(
        svgNode(doc, "text", {
          x: item.x + 48,
          y: Math.max(top - 5, y - 8),
          "font-size": 12,
          "text-anchor": "middle",
          class: item.valueClass
        }, [format(item.value, 3)])
      );
      svg.appendChild(
        svgNode(doc, "text", {
          x: item.x + 48,
          y: bottom + 24,
          "font-size": 12,
          "font-weight": 700,
          "text-anchor": "middle"
        }, [item.label])
      );
    });

    svg.appendChild(
      svgNode(doc, "text", {
        x: right,
        y: bottom + 46,
        "font-size": 11,
        "text-anchor": "end"
      }, ["第二段是对 Y 的后处理"])
    );
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") {
      api.announce(root, message);
    }
  }

  function mount(root, api) {
    if (!root || typeof document === "undefined") {
      return;
    }

    var doc = root.ownerDocument || document;
    installStyles(doc);
    INSTANCE += 1;
    var uid = "cl-ip-" + INSTANCE;
    var state = { eta: DEFAULT.eta, rho: DEFAULT.rho, presetId: "default" };
    var prediction = {
      comparison: null,
      halfNoise: null,
      dpi: null
    };
    var revealed = false;
    var shell = element(doc, "div", { className: "ip-lab" }, []);
    root.replaceChildren(shell);

    var predictionButtons = [];
    var refs = {};

    function copyDefaultState() {
      return { eta: DEFAULT.eta, rho: DEFAULT.rho, presetId: "default" };
    }

    function predictionComplete() {
      return (
        prediction.comparison !== null &&
        prediction.halfNoise !== null &&
        prediction.dpi !== null
      );
    }

    function buildQuestion(question, options, key) {
      var fieldset = element(doc, "fieldset", { className: "ip-question" }, []);
      fieldset.appendChild(
        element(doc, "legend", { className: "ip-question-title" }, [
          question
        ])
      );
      var choiceRow = element(
        doc,
        "div",
        {
          className: "ip-choice-row",
          role: "group",
          "aria-label": question
        },
        []
      );
      options.forEach(function (option) {
        var button = element(
          doc,
          "button",
          {
            type: "button",
            "aria-pressed": "false"
          },
          [option.label]
        );
        button.addEventListener("click", function () {
          prediction[key] = option.value;
          revealed = false;
          state = copyDefaultState();
          if (refs.revealedPanel) { refs.revealedPanel.remove(); refs.revealedPanel = null; }
          renderPrediction();
        });
        predictionButtons.push({
          key: key,
          value: option.value,
          node: button
        });
        choiceRow.appendChild(button);
      });
      fieldset.appendChild(choiceRow);
      return fieldset;
    }

    function renderPrediction() {
      predictionButtons.forEach(function (item) {
        item.node.setAttribute(
          "aria-pressed",
          prediction[item.key] === item.value ? "true" : "false"
        );
      });
      if (refs.checkButton) {
        refs.checkButton.disabled = !predictionComplete() || revealed;
      }
      if (refs.gateFeedback && !revealed) {
        refs.gateFeedback.textContent = predictionComplete()
          ? "三项预测已记录。提交后才会显示参数、曲线和数值账本。"
          : "请为三个判断各选一项。";
        refs.gateFeedback.className = "ip-feedback";
      }
    }

    function buildGate() {
      predictionButtons = [];
      refs = {};
      shell.replaceChildren();
      shell.appendChild(
        element(doc, "h3", {}, ["二元信道：信息经过第二段会怎样？"])
      );
      shell.appendChild(
        element(doc, "p", { className: "ip-note" }, [
          "模型固定为 X 为均匀比特，Y=X xor Nη，Z=Y xor Nρ。先预测三个结论；提交前不显示滑块、预设、图表或结果。"
        ])
      );
      var prompt = element(doc, "div", { className: "ip-prompt" }, [
        "预测门：默认 η=.10、ρ=.20。请先判断关系，再点击“提交预测并揭示”。"
      ]);
      shell.appendChild(prompt);
      var questionList = element(
        doc,
        "div",
        { className: "ip-question-list" },
        []
      );
      questionList.appendChild(
        buildQuestion(
          "1 · 默认参数下，I(X;Z) 与 I(X;Y) 的关系是？",
          [
            { value: "strict", label: "I(X;Z) < I(X;Y)" },
            { value: "equal", label: "I(X;Z) = I(X;Y)" },
            { value: "greater", label: "I(X;Z) > I(X;Y)" }
          ],
          "comparison"
        )
      );
      questionList.appendChild(
        buildQuestion(
          "2 · 固定 η，若 ρ=.50，I(X;Z) 会是多少？",
          [
            { value: "zero", label: "0 bit" },
            { value: "one", label: "1 bit" },
            { value: "depends", label: "随 η 变化" }
          ],
          "halfNoise"
        )
      );
      questionList.appendChild(
        buildQuestion(
          "3 · 在 Markov 链 X→Y→Z 下，后处理能否增加关于 X 的信息？",
          [
            { value: "cannot", label: "不能增加" },
            { value: "can", label: "可能增加" },
            { value: "deterministic", label: "只有确定后处理才不能" }
          ],
          "dpi"
        )
      );
      shell.appendChild(questionList);

      var checkButton = element(
        doc,
        "button",
        { type: "button", className: "ip-primary", disabled: true },
        ["提交预测并揭示"]
      );
      refs.checkButton = checkButton;
      checkButton.addEventListener("click", function () {
        if (!predictionComplete()) {
          refs.gateFeedback.textContent = "请先为三个判断各选一项。";
          refs.gateFeedback.className = "ip-feedback ip-warn";
          return;
        }
        revealed = true;
        buildRevealed();
        var correct =
          (prediction.comparison === "strict" ? 1 : 0) +
          (prediction.halfNoise === "zero" ? 1 : 0) +
          (prediction.dpi === "cannot" ? 1 : 0);
        refs.gateFeedback.textContent =
          "预测已提交，" +
          correct +
          "/3 命中。下面显示解析公式、条件行和 KL 收缩账本。";
        refs.gateFeedback.className =
          "ip-feedback " + (correct === 3 ? "ip-pass" : "ip-warn");
        announce(
          api,
          root,
          "预测已提交，结果和参数控制已揭示。"
        );
      });
      var resetButton = element(
        doc,
        "button",
        { type: "button" },
        ["重置并重新预测"]
      );
      resetButton.addEventListener("click", function () {
        state = copyDefaultState();
        prediction = {
          comparison: null,
          halfNoise: null,
          dpi: null
        };
        revealed = false;
        buildGate();
        predictionButtons[0].node.focus();
        announce(api, root, "已重置；请重新完成三个预测。");
      });
      refs.gateFeedback = element(
        doc,
        "p",
        { className: "ip-feedback", "aria-live": "polite" },
        ["请为三个判断各选一项。"]
      );
      shell.appendChild(
        element(doc, "div", { className: "ip-actions" }, [
          checkButton,
          resetButton
        ])
      );
      shell.appendChild(refs.gateFeedback);
      renderPrediction();
    }

    function addRangeControl(container, key, label, inputRef, outputRef) {
      var id = uid + "-" + key;
      var output = element(doc, "output", { id: id + "-value", htmlFor: id }, [""]);
      var labelNode = element(doc, "label", { htmlFor: id }, [
        label + " = ",
        output
      ]);
      var input = element(doc, "input", {
        id: id,
        type: "range",
        min: "0",
        max: "0.5",
        step: "0.0001",
        value: String(state[key]),
        "aria-label": label
      });
      input.addEventListener("input", function () {
        state[key] = clamp(Number(input.value), 0, 0.5);
        var matching = PRESETS.find(function (p) { return p.eta === state.eta && p.rho === state.rho; });
        state.presetId = matching ? matching.id : "custom";
        renderResults();
      });
      inputRef.value = input;
      outputRef.value = output;
      container.appendChild(
        element(doc, "div", { className: "ip-control" }, [
          labelNode,
          input,
          element(doc, "div", { className: "ip-scale" }, [
            element(doc, "span", {}, ["0"]),
            element(doc, "span", {}, ["0.25"]),
            element(doc, "span", {}, ["0.50"])
          ])
        ])
      );
    }

    function buildControls() {
      var controls = element(doc, "section", {
        className: "ip-controls",
        "aria-labelledby": uid + "-controls-title"
      }, []);
      controls.appendChild(
        element(doc, "h4", { id: uid + "-controls-title" }, [
          "揭示后的参数"
        ])
      );
      addRangeControl(controls, "eta", "第一段噪声 η", {}, {});
      addRangeControl(controls, "rho", "第二段噪声 ρ", {}, {});
      refs.etaInput = controls.querySelector("#" + uid + "-eta");
      refs.rhoInput = controls.querySelector("#" + uid + "-rho");
      refs.etaOutput = controls.querySelector("#" + uid + "-eta-value");
      refs.rhoOutput = controls.querySelector("#" + uid + "-rho-value");
      controls.appendChild(
        element(doc, "p", { className: "ip-note" }, [
          "滑块只在揭示后出现；模型使用解析公式和级联偏差乘积，不做 Monte Carlo 抽样。"
        ])
      );

      var presetBox = element(doc, "fieldset", {}, []);
      presetBox.appendChild(
        element(doc, "legend", {}, ["教学预设"])
      );
      var presetRow = element(
        doc,
        "div",
        { className: "ip-preset-row" },
        []
      );
      refs.presetButtons = [];
      PRESETS.forEach(function (preset) {
        var button = element(
          doc,
          "button",
          { type: "button", "aria-pressed": "false" },
          [preset.label]
        );
        button.addEventListener("click", function () {
          state.eta = preset.eta;
          state.rho = preset.rho;
          state.presetId = preset.id;
          renderResults();
          announce(api, root, "已切换到" + preset.label + "。");
        });
        refs.presetButtons.push({ id: preset.id, node: button });
        presetRow.appendChild(button);
      });
      presetBox.appendChild(presetRow);
      controls.appendChild(presetBox);

      var resetButton = element(
        doc,
        "button",
        { type: "button" },
        ["重新预测"]
      );
      resetButton.addEventListener("click", function () {
        state = copyDefaultState();
        prediction = {
          comparison: null,
          halfNoise: null,
          dpi: null
        };
        revealed = false;
        buildGate();
        predictionButtons[0].node.focus();
        announce(api, root, "已重置；请重新完成三个预测。");
      });
      controls.appendChild(
        element(doc, "div", { className: "ip-actions" }, [resetButton])
      );
      return controls;
    }

    function buildStage() {
      var stage = element(doc, "section", {
        className: "ip-stage",
        "aria-labelledby": uid + "-stage-title"
      }, []);
      var svg = svgNode(doc, "svg", {
        className: "ip-svg",
        width: "560",
        height: "320",
        viewBox: "0 0 560 320",
        role: "img",
        "aria-label": "互信息固定 0 到 1 bits 的柱状图"
      }, []);
      refs.svg = svg;
      stage.appendChild(
        element(doc, "div", { className: "ip-stage-frame" }, [
          element(doc, "div", { className: "ip-stage-title" }, [
            element(doc, "span", { id: uid + "-stage-title" }, [
              "信息刻度"
            ]),
            element(doc, "span", {}, ["bits"])
          ]),
          element(doc, "div", {className: "ip-scroll", role: "region", tabindex: 0, "aria-label": "互信息图，可横向滚动"}, [svg])
        ])
      );

      var metrics = [
        metric(doc, "τ：总翻转概率"),
        metric(doc, "h₂(η)"),
        metric(doc, "I(X;Y)"),
        metric(doc, "I(X;Z)")
      ];
      refs.metrics = metrics;
      stage.appendChild(
        element(
          doc,
          "div",
          { className: "ip-metrics" },
          metrics.map(function (item) {
            return item.node;
          })
        )
      );

      stage.appendChild(
        element(doc, "h4", {}, ["条件信道行（显示经过舍入）"])
      );
      stage.appendChild(
        element(doc, "p", { className: "ip-note" }, [
          "每一行都是条件概率，P(Y) 和 P(Z) 均为 (0.5, 0.5)。接近 0.5 的数可能显示相同；互信息保留偏差乘积计算，不从已舍入的表格反算。"
        ])
      );
      refs.channelTable = makeTable(doc, "二元信道的条件行", [
        "条件",
        "P(0)",
        "P(1)",
        "阶段"
      ]);
      stage.appendChild(
        element(doc, "div", { className: "ip-table-wrap ip-scroll", role: "region", tabindex: 0, "aria-label": "概率或 KL 账本，可横向滚动" }, [
          refs.channelTable
        ])
      );

      stage.appendChild(
        element(doc, "h4", {}, ["互信息的条件 KL 账本"])
      );
      stage.appendChild(
        element(doc, "p", { className: "ip-note" }, [
          "I(X;Y)=Σₓ p(x)D(P(Y|X=x)||P(Y))；右侧贡献列加总才是互信息。"
        ])
      );
      refs.miTable = makeTable(doc, "互信息条件 KL 账本", [
        "项",
        "p(x)",
        "条件行",
        "边缘行",
        "KL（bits）",
        "p(x)×KL（bits）"
      ]);
      stage.appendChild(
        element(doc, "div", { className: "ip-table-wrap ip-scroll", role: "region", tabindex: 0, "aria-label": "概率或 KL 账本，可横向滚动" }, [refs.miTable])
      );

      stage.appendChild(
        element(doc, "h4", {}, ["第二段 BSC 的 KL 收缩"])
      );
      refs.contractionTable = makeTable(doc, "第二段信道的 KL 收缩账本", [
        "阶段",
        "第一分布",
        "第二分布",
        "D（bits）",
        "判读"
      ]);
      stage.appendChild(
        element(doc, "div", { className: "ip-table-wrap ip-scroll", role: "region", tabindex: 0, "aria-label": "概率或 KL 账本，可横向滚动" }, [
          refs.contractionTable
        ])
      );
      refs.interpretation = element(
        doc,
        "p",
        { className: "ip-interpretation", "aria-live": "polite" },
        [""]
      );
      stage.appendChild(refs.interpretation);
      return stage;
    }

    function renderResults() {
      if (!revealed) {
        return;
      }
      var data = summarize(state.eta, state.rho);
      refs.etaInput.value = String(state.eta);
      refs.rhoInput.value = String(state.rho);
      refs.etaOutput.textContent = format(state.eta, 4);
      refs.rhoOutput.textContent = format(state.rho, 4);
      refs.presetButtons.forEach(function (item) {
        item.node.setAttribute(
          "aria-pressed",
          state.presetId === item.id ? "true" : "false"
        );
      });
      refs.metrics[0].value.textContent = format(data.tau, 4);
      refs.metrics[1].value.textContent = format(data.hEta, 4);
      refs.metrics[2].value.textContent = format(data.iXY, 4) + " bit";
      refs.metrics[3].value.textContent = format(data.iXZ, 4) + " bit";
      drawChart(doc, refs.svg, data, uid);

      replaceTableRows(refs.channelTable, [
        ["P(Y|X=0)", format(data.yRows[0][0], 4), format(data.yRows[0][1], 4), "X→Y"],
        ["P(Y|X=1)", format(data.yRows[1][0], 4), format(data.yRows[1][1], 4), "X→Y"],
        ["P(Z|Y=0)", format(data.zGivenYRows[0][0], 4), format(data.zGivenYRows[0][1], 4), "Y→Z"],
        ["P(Z|Y=1)", format(data.zGivenYRows[1][0], 4), format(data.zGivenYRows[1][1], 4), "Y→Z"],
        ["P(Z|X=0)", format(data.zRows[0][0], 4), format(data.zRows[0][1], 4), "级联 X→Z"],
        ["P(Z|X=1)", format(data.zRows[1][0], 4), format(data.zRows[1][1], 4), "级联 X→Z"]
      ]);

      var miRows = [];
      [["Y", data.yMiRows, data.iXY], ["Z", data.zMiRows, data.iXZ]].forEach(function (stage) {
        stage[1].forEach(function (row) {
          miRows.push([stage[0] + " | X=" + row.x, "0.5", probabilityText(row.row),
            probabilityText(row.marginal), format(row.kl, 6), format(row.contribution, 6)]);
        });
        miRows.push(["合计 I(X;" + stage[0] + ")", "", "", "", "", format(stage[2], 6) + " bit"]);
      });
      replaceTableRows(refs.miTable, miRows);

      replaceTableRows(refs.contractionTable, [
        [
          "经过前",
          probabilityText(data.yRows[0]),
          probabilityText(data.yRows[1]),
          format(data.inputConditionalKL, 4),
          "P(Y|X=0) vs P(Y|X=1)"
        ],
        [
          "经过 BSC(ρ)",
          probabilityText(data.zRows[0]),
          probabilityText(data.zRows[1]),
          format(data.outputConditionalKL, 4),
          "D 输出 ≤ D 输入"
        ]
      ]);

      var strict = data.dpiEquality ? "相等" : "严格变小（按参数判定，不以显示差值是否为零判定）";
      var endpointNote =
        data.inputConditionalKL === Infinity
          ? "输入条件行的 KL 为 ∞；这是真实的支持不匹配。"
          : "两行条件分布支持匹配，KL 数值有限。";
      refs.interpretation.textContent =
        "当前 η=" +
        format(data.eta, 4) +
        "、ρ=" +
        format(data.rho, 4) +
        "，τ=" +
        format(data.tau, 4) +
        "。I(X;Z)=" +
        format(data.iXZ, 4) +
        " bit，相对 I(X;Y)=" +
        format(data.iXY, 4) +
        " bit 是" +
        strict +
        "。这里的结论依赖 X→Y→Z 的 Markov 条件；ρ=0 或第一次已经无信息时可以出现等号。KL 账本：" +
        endpointNote;
    }

    function buildRevealed() {
      var revealedPanel = element(doc, "div", { className: "ip-revealed", tabindex: -1, role: "region", "aria-label": "信道实验结果" }, []);
      refs.revealedPanel = revealedPanel;
      revealedPanel.appendChild(
        element(doc, "h4", {}, ["结果与解析账本"])
      );
      revealedPanel.appendChild(
        element(doc, "p", { className: "ip-note" }, [
          "现在可以调整参数。纵轴固定为 0 到 1 bit，极小柱可能看不见，请同时看科学计数读数；未给柱子设置假高度。表格与图可横向滚动，聚焦后使用方向键。改答会返回默认参数并隐藏结果。"
        ])
      );
      var controls = buildControls();
      var stage = buildStage();
      revealedPanel.appendChild(
        element(doc, "div", { className: "ip-layout" }, [
          controls,
          stage
        ])
      );
      shell.appendChild(revealedPanel);
      renderResults();
      renderPrediction();
      revealedPanel.focus();
    }

    buildGate();
  }

  return {
    DEFAULT: DEFAULT,
    PRESETS: PRESETS,
    h2: h2,
    tau: tau,
    binaryRow: binaryRow,
    kl: kl,
    summarize: summarize,
    format: format,
    drawChart: drawChart,
    selfTest: selfTest,
    mount: mount
  };
});

(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }

  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("materials-bonding-ledger", exported.mount);
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
        "materials-bonding-ledger self-test: PASS (" +
          report.checks +
          " checks)"
      );
    } catch (error) {
      console.error("materials-bonding-ledger self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : null,
  function (host) {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "materials-bonding-ledger-styles";
    var KB_EV_PER_K = 8.617333262145e-5;
    var EV_NM2_TO_N_M = 0.1602176634;
    var EPS = 1e-10;
    var DEFAULTS = {
      family: "metallic-like",
      r0Nm: 0.286,
      wellDepthEv: 0.35,
      aNmInv: 18,
      temperatureK: 300
    };
    var PRESETS = {
      "ionic-like": { r0Nm: 0.220, wellDepthEv: 2.00, aNmInv: 16 },
      "covalent-like": { r0Nm: 0.154, wellDepthEv: 4.00, aNmInv: 20 },
      "metallic-like": { r0Nm: 0.286, wellDepthEv: 0.35, aNmInv: 18 },
      "van-der-waals-like": { r0Nm: 0.340, wellDepthEv: 0.05, aNmInv: 10 }
    };
    var FAMILY_LABELS = {
      "ionic-like": "离子型参数示意",
      "covalent-like": "共价型参数示意",
      "metallic-like": "金属型参数示意",
      "van-der-waals-like": "范德华型参数示意"
    };
    var STYLE_TEXT = [
      '[data-learning-lab="materials-bonding-ledger"]{--mb-blue:var(--cl-blue,#315f9d);--mb-gold:var(--cl-gold,#9b6a12);--mb-green:var(--cl-green,#39734d);--mb-red:var(--cl-red,#b64335);display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="materials-bonding-ledger"] *{box-sizing:border-box}[data-learning-lab="materials-bonding-ledger"] [hidden]{display:none!important}',
      '[data-learning-lab="materials-bonding-ledger"] h3,[data-learning-lab="materials-bonding-ledger"] h4{margin:0;color:var(--fg,currentColor);letter-spacing:0}[data-learning-lab="materials-bonding-ledger"] h3{font-size:1.16rem}',
      '[data-learning-lab="materials-bonding-ledger"] p{margin:8px 0}[data-learning-lab="materials-bonding-ledger"] .mb-note,[data-learning-lab="materials-bonding-ledger"] .mb-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="materials-bonding-ledger"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="materials-bonding-ledger"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
      '[data-learning-lab="materials-bonding-ledger"] .mb-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="materials-bonding-ledger"] button,[data-learning-lab="materials-bonding-ledger"] select,[data-learning-lab="materials-bonding-ledger"] input{font:inherit}',
      '[data-learning-lab="materials-bonding-ledger"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="materials-bonding-ledger"] button:hover{border-color:var(--mb-blue)}[data-learning-lab="materials-bonding-ledger"] button[aria-pressed="true"],[data-learning-lab="materials-bonding-ledger"] .mb-primary{border-color:var(--mb-blue);background:var(--mb-blue);color:var(--bg,#fff);font-weight:750}',
      '[data-learning-lab="materials-bonding-ledger"] button:focus-visible,[data-learning-lab="materials-bonding-ledger"] select:focus-visible,[data-learning-lab="materials-bonding-ledger"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="materials-bonding-ledger"] .mb-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="materials-bonding-ledger"] .mb-actions>*{flex:1 1 170px}[data-learning-lab="materials-bonding-ledger"] .mb-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="materials-bonding-ledger"] .mb-pass{color:var(--mb-green)}[data-learning-lab="materials-learning-ledger"] .mb-warn,[data-learning-lab="materials-bonding-ledger"] .mb-warn{color:var(--mb-red)}',
      '[data-learning-lab="materials-bonding-ledger"] .mb-layout{display:grid;grid-template-columns:minmax(205px,.7fr) minmax(0,1.3fr);gap:16px;align-items:start;min-width:0}[data-learning-lab="materials-bonding-ledger"] .mb-controls,[data-learning-lab="materials-bonding-ledger"] .mb-stage{min-width:0}[data-learning-lab="materials-bonding-ledger"] .mb-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="materials-bonding-ledger"] .mb-control{display:grid;gap:5px;min-width:0}[data-learning-lab="materials-bonding-ledger"] .mb-control label{color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}[data-learning-lab="materials-bonding-ledger"] .mb-control output{color:var(--mb-blue);font-variant-numeric:tabular-nums}',
      '[data-learning-lab="materials-bonding-ledger"] input[type="range"],[data-learning-lab="materials-bonding-ledger"] select{display:block;width:100%;min-height:44px;accent-color:var(--mb-blue)}[data-learning-lab="materials-bonding-ledger"] select{padding:7px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor)}[data-learning-lab="materials-bonding-ledger"] .mb-stage-frame{min-width:0;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent);overflow:hidden}[data-learning-lab="materials-bonding-ledger"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="materials-bonding-ledger"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="materials-bonding-ledger"] .mb-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.8}[data-learning-lab="materials-bonding-ledger"] .mb-grid{stroke:var(--border,#cbd5e1);stroke-width:1;stroke-opacity:.7}[data-learning-lab="materials-bonding-ledger"] .mb-curve{fill:none;stroke:var(--mb-blue);stroke-width:2.7}[data-learning-lab="materials-bonding-ledger"] .mb-shift{stroke:var(--mb-gold);stroke-width:2;stroke-dasharray:5 4}[data-learning-lab="materials-bonding-ledger"] .mb-mark{fill:var(--mb-red);stroke:var(--bg,#fff);stroke-width:2}[data-learning-lab="materials-bonding-ledger"] .mb-small{font-size:10px;fill:var(--fg-soft,currentColor)!important}[data-learning-lab="materials-bonding-ledger"] .mb-label{font-size:11px}',
      '[data-learning-lab="materials-bonding-ledger"] .mb-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-top:12px}[data-learning-lab="materials-bonding-ledger"] .mb-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#cbd5e1);background:var(--bg,transparent)}[data-learning-lab="materials-bonding-ledger"] .mb-metric:nth-child(3n+1){border-color:var(--mb-blue)}[data-learning-lab="materials-bonding-ledger"] .mb-metric:nth-child(3n+2){border-color:var(--mb-gold)}[data-learning-lab="materials-bonding-ledger"] .mb-metric:nth-child(3n){border-color:var(--mb-green)}[data-learning-lab="materials-bonding-ledger"] .mb-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11.5px}[data-learning-lab="materials-bonding-ledger"] .mb-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
      '[data-learning-lab="materials-bonding-ledger"] .mb-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:12px}[data-learning-lab="materials-bonding-ledger"] table{width:100%;min-width:520px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="materials-bonding-ledger"] th,[data-learning-lab="materials-bonding-ledger"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="materials-bonding-ledger"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="materials-bonding-ledger"] .mb-certificate{margin-top:11px;padding:10px 12px;border-left:3px solid var(--mb-gold);background:var(--bg,transparent);font-size:13px;line-height:1.7}',
      '@media(max-width:900px){[data-learning-lab="materials-bonding-ledger"] .mb-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){[data-learning-lab="materials-bonding-ledger"] .mb-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:420px){[data-learning-lab="materials-bonding-ledger"] .mb-stage-frame{padding:4px}[data-learning-lab="materials-bonding-ledger"] table{font-size:11px}[data-learning-lab="materials-bonding-ledger"] th,[data-learning-lab="materials-bonding-ledger"] td{padding-left:4px;padding-right:4px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="materials-bonding-ledger"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
    ].join("");

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function finite(value, label) {
      var number = Number(value);
      if (!Number.isFinite(number)) throw new RangeError(label + " must be finite");
      return number;
    }

    function near(left, right, tolerance) {
      var scale = Math.max(1, Math.abs(left), Math.abs(right));
      return Math.abs(left - right) <= (tolerance || 1e-8) * scale;
    }

    function format(value, digits) {
      if (!Number.isFinite(value)) return "—";
      var places = digits === undefined ? 3 : digits;
      if (places === 0) return value.toFixed(0);
      if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) {
        return value.toExponential(Math.min(places, 5));
      }
      return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
    }

    function copyDefaults() {
      var copy = {};
      Object.keys(DEFAULTS).forEach(function (key) { copy[key] = DEFAULTS[key]; });
      return copy;
    }

    function normalizeConfig(input) {
      var source = input || {};
      var family = source.family === undefined ? DEFAULTS.family : String(source.family);
      if (!PRESETS[family]) throw new RangeError("unknown illustrative family preset");
      var r0Nm = finite(source.r0Nm === undefined ? DEFAULTS.r0Nm : source.r0Nm, "r0");
      var wellDepthEv = finite(source.wellDepthEv === undefined ? DEFAULTS.wellDepthEv : source.wellDepthEv, "De");
      var aNmInv = finite(source.aNmInv === undefined ? DEFAULTS.aNmInv : source.aNmInv, "a");
      var temperatureK = finite(source.temperatureK === undefined ? DEFAULTS.temperatureK : source.temperatureK, "temperature");
      if (r0Nm <= 0 || r0Nm > 1) throw new RangeError("r0 must be in (0, 1] nm");
      if (wellDepthEv <= 0 || wellDepthEv > 20) throw new RangeError("De must be in (0, 20] eV");
      if (aNmInv <= 0 || aNmInv > 100) throw new RangeError("a must be in (0, 100] nm^-1");
      if (temperatureK < 0 || temperatureK > 10000) throw new RangeError("temperature must be in [0, 10000] K");
      return { family: family, r0Nm: r0Nm, wellDepthEv: wellDepthEv, aNmInv: aNmInv, temperatureK: temperatureK };
    }

    function morsePotential(rNm, r0Nm, wellDepthEv, aNmInv) {
      var r = finite(rNm, "r");
      var r0 = finite(r0Nm, "r0");
      var depth = finite(wellDepthEv, "De");
      var width = finite(aNmInv, "a");
      if (r <= 0 || r0 <= 0 || depth <= 0 || width <= 0) throw new RangeError("Morse inputs must be positive");
      var exponential = Math.exp(-width * (r - r0));
      return depth * Math.pow(1 - exponential, 2) - depth;
    }

    function curvatureEvPerNm2(wellDepthEv, aNmInv) {
      var depth = finite(wellDepthEv, "De");
      var width = finite(aNmInv, "a");
      if (depth <= 0 || width <= 0) throw new RangeError("De and a must be positive");
      return 2 * depth * width * width;
    }

    function thermalExpansionProxy(config) {
      var p = normalizeConfig(config);
      var curvature = curvatureEvPerNm2(p.wellDepthEv, p.aNmInv);
      var thirdDerivative = -6 * p.wellDepthEv * Math.pow(p.aNmInv, 3);
      var varianceNm2 = KB_EV_PER_K * p.temperatureK / curvature;
      var meanShiftNm = -thirdDerivative / (2 * curvature) * varianceNm2;
      return {
        varianceNm2: varianceNm2,
        meanShiftNm: meanShiftNm,
        alphaProxyPerK: p.temperatureK === 0 ? 0 : meanShiftNm / (p.r0Nm * p.temperatureK),
        thirdDerivativeEvPerNm3: thirdDerivative
      };
    }

    function ledger(input) {
      var p = normalizeConfig(input);
      var curvature = curvatureEvPerNm2(p.wellDepthEv, p.aNmInv);
      var thermal = thermalExpansionProxy(p);
      return {
        family: p.family,
        familyLabel: FAMILY_LABELS[p.family],
        r0Nm: p.r0Nm,
        wellDepthEv: p.wellDepthEv,
        wellDepthJ: p.wellDepthEv * 1.602176634e-19,
        aNmInv: p.aNmInv,
        temperatureK: p.temperatureK,
        equilibriumEnergyEv: -p.wellDepthEv,
        curvatureEvPerNm2: curvature,
        radialStiffnessNm: curvature * EV_NM2_TO_N_M,
        varianceNm2: thermal.varianceNm2,
        meanShiftNm: thermal.meanShiftNm,
        relativeShift: thermal.meanShiftNm / p.r0Nm,
        alphaProxyPerK: thermal.alphaProxyPerK,
        thirdDerivativeEvPerNm3: thermal.thirdDerivativeEvPerNm3
      };
    }

    function element(doc, tag, attributes, children) {
      var node = doc.createElement(tag);
      Object.keys(attributes || {}).forEach(function (key) {
        var value = attributes[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.setAttribute("class", String(value));
        else if (key === "text") node.textContent = String(value);
        else if (value === true) node.setAttribute(key, "");
        else node.setAttribute(key, String(value));
      });
      if (children !== undefined && children !== null) {
        (Array.isArray(children) ? children : [children]).forEach(function (child) {
          if (child === undefined || child === null || child === false) return;
          node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
        });
      }
      return node;
    }

    function svgElement(doc, tag, attributes, children) {
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attributes || {}).forEach(function (key) {
        var value = attributes[key];
        if (value === undefined || value === null || value === false) return;
        node.setAttribute(key, String(value));
      });
      if (children !== undefined && children !== null) {
        (Array.isArray(children) ? children : [children]).forEach(function (child) {
          if (child === undefined || child === null || child === false) return;
          node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
        });
      }
      return node;
    }

    function clear(node) {
      while (node.firstChild) node.removeChild(node.firstChild);
    }

    function installStyles(doc) {
      if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement).appendChild(style);
    }

    function announce(api, rootNode, message) {
      if (api && typeof api.announce === "function") api.announce(rootNode, message);
    }

    function renderSvg(doc, svg, result) {
      clear(svg);
      var width = 680;
      var height = 360;
      var left = 58;
      var right = 18;
      var top = 28;
      var bottom = 45;
      var xMin = Math.max(0.02, result.r0Nm * 0.52);
      var xMax = result.r0Nm + Math.max(0.16, result.r0Nm * 0.75);
      var yMin = -result.wellDepthEv * 1.08;
      var yMax = result.wellDepthEv * 1.4;
      var mapX = function (value) { return left + (value - xMin) / (xMax - xMin) * (width - left - right); };
      var mapY = function (value) { return top + (yMax - value) / (yMax - yMin) * (height - top - bottom); };
      var clampY = function (value) { return Math.max(yMin, Math.min(yMax, value)); };
      var points = [];
      for (var i = 0; i <= 120; i += 1) {
        var r = xMin + (xMax - xMin) * i / 120;
        points.push((i ? "L" : "M") + mapX(r).toFixed(2) + " " + mapY(clampY(morsePotential(r, result.r0Nm, result.wellDepthEv, result.aNmInv))).toFixed(2));
      }
      svg.appendChild(svgElement(doc, "title", {}, "Morse 势阱与非对称热膨胀代理"));
      svg.appendChild(svgElement(doc, "desc", {}, "蓝线是以电子伏特为单位的玩具径向势能，红点是平衡间距，金色虚线是小振幅近似下的平均间距偏移。"));
      [-result.wellDepthEv, 0].forEach(function (value) {
        svg.appendChild(svgElement(doc, "line", { x1: left, y1: mapY(value), x2: width - right, y2: mapY(value), class: "mb-grid" }));
      });
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: mapY(0), x2: width - right, y2: mapY(0), class: "mb-axis" }));
      svg.appendChild(svgElement(doc, "line", { x1: mapX(result.r0Nm), y1: top, x2: mapX(result.r0Nm), y2: height - bottom, class: "mb-grid" }));
      var shifted = result.r0Nm + result.meanShiftNm;
      svg.appendChild(svgElement(doc, "line", { x1: mapX(shifted), y1: top + 10, x2: mapX(shifted), y2: height - bottom, class: "mb-shift" }));
      svg.appendChild(svgElement(doc, "path", { d: points.join(" "), class: "mb-curve" }));
      svg.appendChild(svgElement(doc, "circle", { cx: mapX(result.r0Nm), cy: mapY(-result.wellDepthEv), r: 5.5, class: "mb-mark" }));
      svg.appendChild(svgElement(doc, "circle", { cx: mapX(shifted), cy: mapY(clampY(morsePotential(shifted, result.r0Nm, result.wellDepthEv, result.aNmInv))), r: 4.5, class: "mb-mark" }));
      svg.appendChild(svgElement(doc, "text", { x: left, y: 16, class: "mb-label" }, "U(r) / eV"));
      svg.appendChild(svgElement(doc, "text", { x: width - right, y: height - 8, "text-anchor": "end", class: "mb-label" }, "r / nm"));
      svg.appendChild(svgElement(doc, "text", { x: mapX(result.r0Nm) + 6, y: top + 16, class: "mb-small" }, "r₀"));
      svg.appendChild(svgElement(doc, "text", { x: mapX(shifted) + 6, y: top + 31, class: "mb-small" }, "平均 r"));
      svg.appendChild(svgElement(doc, "text", { x: left + 6, y: mapY(-result.wellDepthEv) - 7, class: "mb-small" }, "−Dₑ"));
    }

    function metric(doc, label, value) {
      return element(doc, "div", { className: "mb-metric" }, [
        element(doc, "span", { text: label }),
        element(doc, "strong", { text: value })
      ]);
    }

    function renderTable(doc, hostNode, result) {
      var rows = [
        ["平衡间距 r₀", format(result.r0Nm, 3), "nm"],
        ["井深 Dₑ", format(result.wellDepthEv, 3), "eV / pair（玩具参数）"],
        ["曲率 Uʺ(r₀)", format(result.curvatureEvPerNm2, 2), "eV·nm⁻²"],
        ["径向刚度代理", format(result.radialStiffnessNm, 2), "N·m⁻¹；不是杨氏模量"],
        ["kBT", format(KB_EV_PER_K * result.temperatureK, 4), "eV"],
        ["〈(r−r₀)²〉", format(result.varianceNm2, 5), "nm²；经典谐振近似"],
        ["平均偏移代理", format(result.meanShiftNm, 5), "nm；正值来自势阱右侧较缓"],
        ["α* = Δr/(r₀T)", format(result.alphaProxyPerK, 3), "K⁻¹；只作非对称性代理"]
      ];
      var body = element(doc, "tbody");
      rows.forEach(function (row) {
        body.appendChild(element(doc, "tr", {}, [
          element(doc, "th", { text: row[0] }),
          element(doc, "td", { text: row[1] }),
          element(doc, "td", { text: row[2] })
        ]));
      });
      clear(hostNode);
      hostNode.appendChild(element(doc, "table", {}, [
        element(doc, "caption", { text: "Morse 势阱的有量纲透明账本" }),
        element(doc, "thead", {}, [element(doc, "tr", {}, [
          element(doc, "th", { text: "量" }),
          element(doc, "th", { text: "数值" }),
          element(doc, "th", { text: "单位 / 读法" })
        ])]),
        body
      ]));
    }

    function questionSpecs() {
      return [
        {
          key: "curvature",
          prompt: "固定 r₀ 与 a 时，把 Dₑ 加倍，井底曲率 Uʺ(r₀) 会怎样？",
          expected: "double",
          choices: [
            { value: "double", label: "加倍" },
            { value: "same", label: "不变" },
            { value: "half", label: "减半" }
          ]
        },
        {
          key: "expansion",
          prompt: "在 T > 0 的 Morse 小振幅代理中，平均间距相对 r₀ 的偏移方向是？",
          expected: "positive",
          choices: [
            { value: "positive", label: "向右增大" },
            { value: "zero", label: "严格为零" },
            { value: "negative", label: "向左减小" }
          ]
        },
        {
          key: "boundary",
          prompt: "这个径向 Morse 账本最诚实的身份是什么？",
          expected: "toy",
          choices: [
            { value: "toy", label: "可审计的成对势玩具模型" },
            { value: "complete", label: "所有固体的完整键合理论" },
            { value: "modulus", label: "直接等于杨氏模量" }
          ]
        }
      ];
    }

    function mount(rootNode, api) {
      if (!rootNode || !rootNode.ownerDocument) return;
      var doc = rootNode.ownerDocument;
      installStyles(doc);
      var state = {
        config: normalizeConfig(DEFAULTS),
        predictions: {},
        revealed: false,
        feedback: ""
      };
      var shell = element(doc, "div", { className: "mb-lab" });
      shell.appendChild(element(doc, "h3", { text: "键合实验：从一口 Morse 势阱读出间距、刚度和热膨胀代理" }));
      shell.appendChild(element(doc, "p", { className: "mb-note", text: "先判断曲率、非对称偏移和模型边界；揭示后再改 r₀、Dₑ、a 与温度，观察每一项如何进入账本。" }));
      var predictionHost = element(doc, "div");
      var predictionButtons = [];
      questionSpecs().forEach(function (spec) {
        var fieldset = element(doc, "fieldset");
        fieldset.appendChild(element(doc, "legend", { text: spec.prompt }));
        var grid = element(doc, "div", { className: "mb-choice-grid" });
        var refs = { key: spec.key, buttons: [] };
        spec.choices.forEach(function (choice) {
          var button = element(doc, "button", { type: "button", text: choice.label, "aria-pressed": "false" });
          button.addEventListener("click", function () {
            state.predictions[spec.key] = choice.value;
            state.feedback = "";
            render();
          });
          refs.buttons.push({ node: button, value: choice.value, label: choice.label });
          grid.appendChild(button);
        });
        predictionButtons.push(refs);
        fieldset.appendChild(grid);
        predictionHost.appendChild(fieldset);
      });
      var actions = element(doc, "div", { className: "mb-actions" });
      var reveal = element(doc, "button", { type: "button", className: "mb-primary", text: "提交预测并揭晓" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      var feedback = element(doc, "p", { className: "mb-feedback", "aria-live": "polite" });
      var resultShell = element(doc, "div", { hidden: true });
      var familySelect = element(doc, "select", { "aria-label": "参数示意家族" });
      Object.keys(PRESETS).forEach(function (key) {
        familySelect.appendChild(element(doc, "option", { value: key, text: FAMILY_LABELS[key] }));
      });
      var controls = element(doc, "div", { className: "mb-controls" });
      var inputs = {};
      function rangeControl(key, label, min, max, step, digits) {
        var input = element(doc, "input", { type: "range", min: min, max: max, step: step, value: state.config[key], "aria-label": label });
        var output = element(doc, "output", { text: format(state.config[key], digits) });
        var wrapper = element(doc, "div", { className: "mb-control" }, [element(doc, "label", {}, [label, " = ", output]), input]);
        inputs[key] = { input: input, output: output, digits: digits };
        controls.appendChild(wrapper);
      }
      controls.appendChild(element(doc, "div", { className: "mb-control" }, [element(doc, "label", { text: "参数示意家族" }), familySelect]));
      rangeControl("r0Nm", "平衡间距 r₀ / nm", "0.120", "0.400", "0.001", 3);
      rangeControl("wellDepthEv", "井深 Dₑ / eV", "0.05", "4.00", "0.05", 2);
      rangeControl("aNmInv", "形状参数 a / nm⁻¹", "5", "30", "0.5", 1);
      rangeControl("temperatureK", "温度 T / K", "0", "1200", "25", 0);
      var svg = svgElement(doc, "svg", { viewBox: "0 0 680 360", role: "img", "aria-label": "Morse 势阱图" });
      var svgFrame = element(doc, "div", { className: "mb-stage-frame" }, [svg]);
      var metricsHost = element(doc, "div", { className: "mb-metrics" });
      var tableHost = element(doc, "div", { className: "mb-table-wrap" });
      var certificate = element(doc, "p", { className: "mb-certificate" });
      resultShell.appendChild(element(doc, "div", { className: "mb-layout" }, [
        controls,
        element(doc, "div", { className: "mb-stage" }, [svgFrame, metricsHost, tableHost, certificate])
      ]));
      shell.appendChild(predictionHost);
      shell.appendChild(actions);
      shell.appendChild(feedback);
      shell.appendChild(resultShell);
      clear(rootNode);
      rootNode.appendChild(shell);

      familySelect.addEventListener("change", function () {
        var preset = PRESETS[familySelect.value];
        state.config = normalizeConfig({ family: familySelect.value, r0Nm: preset.r0Nm, wellDepthEv: preset.wellDepthEv, aNmInv: preset.aNmInv, temperatureK: state.config.temperatureK });
        state.feedback = "";
        render();
      });
      Object.keys(inputs).forEach(function (key) {
        inputs[key].input.addEventListener("input", function () {
          var next = copyDefaults();
          Object.keys(state.config).forEach(function (name) { next[name] = state.config[name]; });
          next[key] = Number(inputs[key].input.value);
          state.config = normalizeConfig(next);
          state.feedback = "";
          render();
        });
      });
      reveal.addEventListener("click", function () {
        var specs = questionSpecs();
        var complete = specs.every(function (spec) { return state.predictions[spec.key] !== undefined; });
        if (!complete) {
          state.feedback = "请先完成三项预测；揭示后才显示可操纵的势阱和数字账本。";
          render();
          return;
        }
        var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
        state.revealed = true;
        state.feedback = "已揭晓：" + correct + "/" + specs.length + " 命中。现在改一个参数，追踪它在账本中的单位和工程含义。";
        render();
        announce(api, rootNode, state.feedback);
      });
      reset.addEventListener("click", function () {
        state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
        render();
        announce(api, rootNode, "键合预测和 Morse 账本已重置。");
      });

      function render() {
        var result = ledger(state.config);
        familySelect.value = result.family;
        Object.keys(inputs).forEach(function (key) {
          inputs[key].input.value = String(state.config[key]);
          inputs[key].output.textContent = format(state.config[key], inputs[key].digits);
        });
        predictionButtons.forEach(function (group) {
          var spec = questionSpecs().filter(function (item) { return item.key === group.key; })[0];
          group.buttons.forEach(function (button) {
            var selected = state.predictions[group.key] === button.value;
            button.node.setAttribute("aria-pressed", selected ? "true" : "false");
            button.node.textContent = state.revealed && button.value === spec.expected ? "✓ " + button.label : button.label;
            button.node.className = state.revealed && button.value === spec.expected ? "mb-pass" : state.revealed && selected ? "mb-warn" : "";
          });
        });
        feedback.textContent = state.feedback;
        feedback.className = "mb-feedback" + (state.feedback.indexOf("请先") === 0 ? " mb-warn" : "");
        resultShell.hidden = !state.revealed;
        if (!state.revealed) return;
        renderSvg(doc, svg, result);
        clear(metricsHost);
        metricsHost.appendChild(metric(doc, "当前势阱", result.familyLabel));
        metricsHost.appendChild(metric(doc, "曲率", format(result.curvatureEvPerNm2, 1) + " eV/nm²"));
        metricsHost.appendChild(metric(doc, "径向刚度", format(result.radialStiffnessNm, 1) + " N/m"));
        metricsHost.appendChild(metric(doc, "平均偏移", format(result.meanShiftNm, 4) + " nm"));
        renderTable(doc, tableHost, result);
        certificate.textContent = "工程读法：Dₑ 与 a 只把这条一维成对势的曲率和非对称性改掉；径向刚度不是直接的杨氏模量。真实离子、共价、金属和范德华固体还要加入多体、角度、长程或电子结构项。";
      }

      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) { checks += 1; assert(condition, message); }
      var base = ledger(DEFAULTS);
      check(format(1350, 0) === "1350" && format(60, 0) === "60", "zero-decimal formatter preserves trailing integer zeros");
      check(near(morsePotential(base.r0Nm, base.r0Nm, base.wellDepthEv, base.aNmInv), -base.wellDepthEv, 1e-12), "Morse minimum equals -De");
      check(near(base.curvatureEvPerNm2, 2 * base.wellDepthEv * base.aNmInv * base.aNmInv, 1e-12), "curvature formula");
      check(base.radialStiffnessNm > 0, "radial stiffness is positive");
      check(base.meanShiftNm > 0, "Morse asymmetry shifts the classical mean to larger r");
      check(base.alphaProxyPerK > 0, "positive temperature proxy");
      var cold = ledger({ family: DEFAULTS.family, r0Nm: DEFAULTS.r0Nm, wellDepthEv: DEFAULTS.wellDepthEv, aNmInv: DEFAULTS.aNmInv, temperatureK: 0 });
      check(cold.meanShiftNm === 0 && cold.varianceNm2 === 0, "zero-temperature classical proxy boundary");
      var doubled = ledger({ family: DEFAULTS.family, r0Nm: DEFAULTS.r0Nm, wellDepthEv: 2 * DEFAULTS.wellDepthEv, aNmInv: DEFAULTS.aNmInv, temperatureK: DEFAULTS.temperatureK });
      check(near(doubled.curvatureEvPerNm2, 2 * base.curvatureEvPerNm2, 1e-12), "doubling De doubles curvature");
      check(near(morsePotential(0.1, 0.2, 1, 10), morsePotential(0.1, 0.2, 1, 10), 1e-12), "deterministic potential evaluation");
      var threw = false;
      try { ledger({ family: DEFAULTS.family, r0Nm: 0, wellDepthEv: 1, aNmInv: 10, temperatureK: 300 }); } catch (error) { threw = true; }
      check(threw, "zero equilibrium spacing rejected");
      threw = false;
      try { morsePotential(0, 0.2, 1, 10); } catch (error2) { threw = true; }
      check(threw, "non-positive separation rejected");
      return { checks: checks };
    }

    return {
      DEFAULTS: copyDefaults(),
      PRESETS: PRESETS,
      morsePotential: morsePotential,
      curvatureEvPerNm2: curvatureEvPerNm2,
      thermalExpansionProxy: thermalExpansionProxy,
      ledger: ledger,
      format: format,
      mount: mount,
      selfTest: selfTest
    };
  }
);

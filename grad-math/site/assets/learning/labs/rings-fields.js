(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("rings-fields", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("rings-fields self-test: PASS (" + report.checks + " checks, " + report.moduli + " moduli, " + report.extensions + " extensions)");
    } catch (error) {
      console.error("rings-fields self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "rings-fields-lab-styles";
  var INSTANCE = 0;

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function mod(value, modulus) {
    return ((value % modulus) + modulus) % modulus;
  }

  function gcd(a, b) {
    var x = Math.abs(a);
    var y = Math.abs(b);
    while (y) {
      var next = x % y;
      x = y;
      y = next;
    }
    return x;
  }

  function isPrime(value) {
    if (value < 2 || value % 1 !== 0) return false;
    for (var divisor = 2; divisor * divisor <= value; divisor += 1) {
      if (value % divisor === 0) return false;
    }
    return true;
  }

  function divisors(value) {
    var result = [];
    for (var divisor = 1; divisor <= value; divisor += 1) {
      if (value % divisor === 0) result.push(divisor);
    }
    return result;
  }

  function range(count) {
    var values = [];
    for (var index = 0; index < count; index += 1) values.push(index);
    return values;
  }

  function contains(values, value) {
    return values.indexOf(value) !== -1;
  }

  function uniquePairs(values) {
    var seen = Object.create(null);
    return values.filter(function (pair) {
      var key = pair[0] + ":" + pair[1];
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function normalizeModulus(value) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed)) return 12;
    return Math.max(4, Math.min(15, Math.round(parsed)));
  }

  function zeroDivisorWitness(n, element) {
    for (var other = 1; other < n; other += 1) {
      if (mod(element * other, n) === 0) return other;
    }
    return null;
  }

  function analyzeZMod(n) {
    var modulus = normalizeModulus(n);
    var elements = range(modulus);
    var units = elements.filter(function (element) { return gcd(element, modulus) === 1; });
    var zeroDivisors = elements.filter(function (element) {
      return element !== 0 && gcd(element, modulus) > 1;
    });
    var fieldFromEnumeration = units.length === modulus - 1 && zeroDivisors.length === 0;
    var ideals = divisors(modulus).map(function (generator) {
      return {
        generator: generator,
        members: elements.filter(function (element) { return element % generator === 0; }),
        quotientOrder: generator,
        quotientLabel: generator === 1 ? "平凡环" : "Z_" + generator
      };
    });
    return {
      modulus: modulus,
      elements: elements,
      units: units,
      zeroDivisors: zeroDivisors,
      witnesses: zeroDivisors.map(function (element) {
        return { element: element, other: zeroDivisorWitness(modulus, element) };
      }),
      ideals: ideals,
      field: fieldFromEnumeration,
      probe: 2 % modulus,
      probeUnit: gcd(2, modulus) === 1,
      characteristic: modulus
    };
  }

  var EXTENSIONS = [
    {
      id: "f2-field",
      label: "F2[x]/(x^2+x+1)",
      base: "F2",
      prime: 2,
      polynomial: "x^2+x+1",
      relation: [1, 1],
      irreducible: true,
      note: "x^2=x+1；不可约二次式给出 F4"
    },
    {
      id: "f2-repeated",
      label: "F2[x]/(x^2+1)",
      base: "F2",
      prime: 2,
      polynomial: "x^2+1",
      relation: [1, 0],
      irreducible: false,
      note: "x^2=1；x^2+1=(x+1)^2"
    },
    {
      id: "f3-field",
      label: "F3[x]/(x^2+1)",
      base: "F3",
      prime: 3,
      polynomial: "x^2+1",
      relation: [2, 0],
      irreducible: true,
      note: "x^2=2；不可约二次式给出 F9"
    }
  ];

  function extensionById(id) {
    for (var index = 0; index < EXTENSIONS.length; index += 1) {
      if (EXTENSIONS[index].id === id) return EXTENSIONS[index];
    }
    return EXTENSIONS[0];
  }

  function pairKey(pair) {
    return pair[0] + ":" + pair[1];
  }

  function pairEqual(left, right) {
    return left[0] === right[0] && left[1] === right[1];
  }

  function extensionAdd(spec, left, right) {
    return [mod(left[0] + right[0], spec.prime), mod(left[1] + right[1], spec.prime)];
  }

  function extensionMultiply(spec, left, right) {
    var constant = left[0] * right[0] + left[1] * right[1] * spec.relation[0];
    var linear = left[0] * right[1] + left[1] * right[0] + left[1] * right[1] * spec.relation[1];
    return [mod(constant, spec.prime), mod(linear, spec.prime)];
  }

  function extensionLabel(spec, pair) {
    if (pair[0] === 0 && pair[1] === 0) return "0";
    var terms = [];
    if (pair[0] !== 0) terms.push(pair[0] === 1 ? "1" : String(pair[0]));
    if (pair[1] !== 0) {
      terms.push(pair[1] === 1 ? "x" : String(pair[1]) + "x");
    }
    return terms.join("+");
  }

  function hasMultiplicativeInverse(spec, element, elements) {
    if (pairEqual(element, [0, 0])) return false;
    return elements.some(function (other) {
      return pairEqual(extensionMultiply(spec, element, other), [1, 0]);
    });
  }

  function hasZeroProduct(spec, element, elements) {
    if (pairEqual(element, [0, 0])) return false;
    return elements.some(function (other) {
      return !pairEqual(other, [0, 0]) && pairEqual(extensionMultiply(spec, element, other), [0, 0]);
    });
  }

  function analyzeExtension(id) {
    var spec = extensionById(id);
    var elements = [];
    for (var a = 0; a < spec.prime; a += 1) {
      for (var b = 0; b < spec.prime; b += 1) elements.push([a, b]);
    }
    var units = elements.filter(function (element) { return hasMultiplicativeInverse(spec, element, elements); });
    var zeroDivisors = elements.filter(function (element) { return hasZeroProduct(spec, element, elements); });
    var generator = zeroDivisors.length ? zeroDivisors[0] : null;
    var idealMembers = generator
      ? uniquePairs(elements.map(function (element) { return extensionMultiply(spec, generator, element); }))
      : [];
    return {
      id: spec.id,
      label: spec.label,
      base: spec.base,
      prime: spec.prime,
      polynomial: spec.polynomial,
      relation: spec.relation,
      irreducible: spec.irreducible,
      note: spec.note,
      elements: elements,
      units: units,
      zeroDivisors: zeroDivisors,
      field: zeroDivisors.length === 0 && units.length === elements.length - 1,
      order: elements.length,
      degree: 2,
      properIdeal: generator ? {
        generator: generator,
        generatorLabel: extensionLabel(spec, generator),
        members: idealMembers
      } : null,
      labelOf: function (pair) { return extensionLabel(spec, pair); },
      multiply: function (left, right) { return extensionMultiply(spec, left, right); },
      add: function (left, right) { return extensionAdd(spec, left, right); }
    };
  }

  var STYLE_TEXT = [
    ".rfl-lab{--rfl-blue:var(--accent,#315f9d);--rfl-gold:var(--cl-gold,#9b6a12);--rfl-green:var(--cl-green,#39734d);--rfl-red:var(--cl-red,#b64335);--rfl-muted:var(--fg-soft,#6b6557);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".rfl-lab *,.rfl-lab *::before,.rfl-lab *::after{box-sizing:border-box}.rfl-lab [hidden]{display:none!important}",
    ".rfl-lab h3,.rfl-lab h4{margin:0;color:var(--fg);letter-spacing:0}.rfl-lab h3{font-size:1.18rem}.rfl-lab h4{font-size:1rem}.rfl-lab p{margin:7px 0}.rfl-lab .rfl-note,.rfl-lab .rfl-feedback{color:var(--rfl-muted);font-size:13px;line-height:1.7}",
    ".rfl-lab .rfl-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0}.rfl-lab .rfl-field{display:grid;gap:5px;min-width:0}.rfl-lab .rfl-field label{color:var(--rfl-muted);font-size:12.5px;font-weight:750}.rfl-lab select,.rfl-lab input{width:100%;min-height:44px;padding:7px 9px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35}.rfl-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;font:inherit;line-height:1.35;overflow-wrap:anywhere}.rfl-lab button:hover{border-color:var(--rfl-blue)}.rfl-lab button:focus-visible,.rfl-lab select:focus-visible,.rfl-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.rfl-lab button[aria-pressed=true],.rfl-lab .rfl-primary{border-color:var(--rfl-blue);background:var(--rfl-blue);color:var(--bg);font-weight:750}",
    ".rfl-lab .rfl-gate{margin:14px 0;padding:12px;border-left:3px solid var(--rfl-gold);background:var(--block-bg,var(--bg))}.rfl-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border);background:var(--bg)}.rfl-lab legend{max-width:100%;padding:0 3px;color:var(--fg);font-size:13px;font-weight:700;line-height:1.5}.rfl-lab .rfl-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.rfl-lab .rfl-options button{font-size:12px}.rfl-lab .rfl-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.rfl-lab .rfl-actions>*{flex:1 1 180px}.rfl-lab .rfl-feedback{min-height:1.7em;margin-top:9px;font-weight:700}.rfl-lab .rfl-pass{color:var(--rfl-green)}.rfl-lab .rfl-warn{color:var(--rfl-red)}",
    ".rfl-lab .rfl-result{display:grid;gap:12px;margin-top:15px}.rfl-lab .rfl-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px}.rfl-lab .rfl-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.rfl-lab .rfl-metric:nth-child(3n+1){border-color:var(--rfl-blue)}.rfl-lab .rfl-metric:nth-child(3n+2){border-color:var(--rfl-gold)}.rfl-lab .rfl-metric:nth-child(3n){border-color:var(--rfl-green)}.rfl-lab .rfl-metric span{display:block;color:var(--rfl-muted);font-size:11px}.rfl-lab .rfl-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".rfl-lab .rfl-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch}.rfl-lab .rfl-svg{display:block;width:100%;min-width:620px;height:auto;color:var(--fg)}.rfl-lab .rfl-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.rfl-lab .rfl-ring-unit{fill:var(--rfl-green);stroke:var(--rfl-green)}.rfl-lab .rfl-ring-zero{fill:var(--rfl-red);stroke:var(--rfl-red)}.rfl-lab .rfl-ring-other{fill:var(--rfl-blue);stroke:var(--rfl-blue)}.rfl-lab .rfl-ext-unit{fill:var(--rfl-green);stroke:var(--rfl-green)}.rfl-lab .rfl-ext-zero{fill:var(--rfl-red);stroke:var(--rfl-red)}.rfl-lab .rfl-ext-other{fill:var(--rfl-blue);stroke:var(--rfl-blue)}.rfl-lab .rfl-svg text.rfl-inverse{fill:var(--bg);font-size:11px;font-weight:700;text-anchor:middle;dominant-baseline:middle}.rfl-lab .rfl-svg text.rfl-label{font-size:12px;text-anchor:middle}.rfl-lab .rfl-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.rfl-lab table{width:100%;min-width:680px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.rfl-lab caption{padding:0 0 7px;text-align:left;color:var(--rfl-muted);font-size:12px;font-weight:700}.rfl-lab th,.rfl-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.rfl-lab th{color:var(--rfl-muted);font-size:11px}.rfl-lab .rfl-certificate{padding:10px 12px;border-left:3px solid var(--rfl-green);background:var(--block-bg,var(--bg));font-size:13px;line-height:1.7}.rfl-lab .rfl-certificate.rfl-fail{border-left-color:var(--rfl-red)}",
    "@media(max-width:760px){.rfl-lab .rfl-controls{grid-template-columns:minmax(0,1fr)}.rfl-lab .rfl-options{grid-template-columns:minmax(0,1fr)}.rfl-lab .rfl-frame{padding:5px}.rfl-lab table{font-size:11.5px}}@media(prefers-reduced-motion:reduce){.rfl-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function setAttributes(node, attributes) {
    Object.keys(attributes || {}).forEach(function (key) {
      var value = attributes[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function appendChildren(node, children, doc) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function element(doc, tag, attributes, children) {
    return appendChildren(setAttributes(doc.createElement(tag), attributes), children, doc);
  }

  function svgElement(doc, tag, attributes, children) {
    return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attributes), children, doc);
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function installStyles(doc) {
    if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement || doc.body).appendChild(style);
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function joinValues(values) {
    return values.length ? values.join("，") : "无";
  }

  function renderRingSvg(doc, svg, ring, extension, uid) {
    clear(svg);
    svg.setAttribute("viewBox", "0 0 720 330");
    svg.appendChild(svgElement(doc, "title", { id: uid + "-title", text: "模环与有限域扩张的元素证书" }));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-desc", text: "左侧圆环按单位、零因子和其他元素着色；右侧网格展示二次商环元素。" }));
    var centerX = 185;
    var centerY = 145;
    var radius = 95;
    svg.appendChild(svgElement(doc, "text", { x: "185", y: "22", className: "rfl-label", text: "Z_" + ring.modulus }));
    ring.elements.forEach(function (value, index) {
      var angle = -Math.PI / 2 + (2 * Math.PI * index) / ring.modulus;
      var x = centerX + radius * Math.cos(angle);
      var y = centerY + radius * Math.sin(angle);
      var className = contains(ring.units, value) ? "rfl-ring-unit" : (contains(ring.zeroDivisors, value) ? "rfl-ring-zero" : "rfl-ring-other");
      svg.appendChild(svgElement(doc, "circle", { cx: String(x), cy: String(y), r: "15", className: className }));
      svg.appendChild(svgElement(doc, "text", { x: String(x), y: String(y), className: "rfl-inverse", text: String(value) }));
    });
    svg.appendChild(svgElement(doc, "text", { x: "70", y: "285", className: "rfl-label", text: "绿=单位  红=非零零因子  蓝=其他" }));

    var startX = 390;
    var startY = 62;
    var columns = extension.prime === 2 ? 2 : 3;
    var cellWidth = 88;
    var cellHeight = 66;
    svg.appendChild(svgElement(doc, "text", { x: "530", y: "22", className: "rfl-label", text: extension.label }));
    extension.elements.forEach(function (pair, index) {
      var column = index % columns;
      var row = Math.floor(index / columns);
      var x = startX + column * cellWidth;
      var y = startY + row * cellHeight;
      var isUnit = contains(extension.units.map(function (item) { return pairKey(item); }), pairKey(pair));
      var isZero = contains(extension.zeroDivisors.map(function (item) { return pairKey(item); }), pairKey(pair));
      var className = isUnit ? "rfl-ext-unit" : (isZero ? "rfl-ext-zero" : "rfl-ext-other");
      svg.appendChild(svgElement(doc, "rect", { x: String(x), y: String(y), width: "70", height: "48", rx: "5", className: className }));
      svg.appendChild(svgElement(doc, "text", { x: String(x + 35), y: String(y + 24), className: "rfl-inverse", text: extension.labelOf(pair) }));
    });
    svg.appendChild(svgElement(doc, "text", { x: "530", y: "288", className: "rfl-label", text: extension.field ? "所有非零元可逆：域" : "出现非零零因子：非域" }));
  }

  function metric(doc, label) {
    var value = element(doc, "strong", { text: "—" });
    return { node: element(doc, "div", { className: "rfl-metric" }, [element(doc, "span", { text: label }), value]), value: value };
  }

  function renderEvidence(doc, refs, ring, extension) {
    var metrics = [
      metric(doc, "Z_n 的阶"),
      metric(doc, "单位数"),
      metric(doc, "非零零因子数"),
      metric(doc, "Z_n 是域"),
      metric(doc, "扩张阶"),
      metric(doc, "扩张是域")
    ];
    clear(refs.metrics);
    metrics.forEach(function (item) { refs.metrics.appendChild(item.node); });
    metrics[0].value.textContent = String(ring.modulus);
    metrics[1].value.textContent = String(ring.units.length);
    metrics[2].value.textContent = String(ring.zeroDivisors.length);
    metrics[3].value.textContent = ring.field ? "是" : "否";
    metrics[4].value.textContent = extension.base + "^2=" + extension.order;
    metrics[5].value.textContent = extension.field ? "是" : "否";

    refs.svg.setAttribute("aria-labelledby", refs.uid + "-title " + refs.uid + "-desc");
    renderRingSvg(doc, refs.svg, ring, extension, refs.uid);

    var rows = [
      ["单位", joinValues(ring.units), "a 的逆元存在，当且仅当 gcd(a,n)=1"],
      ["非零零因子", joinValues(ring.zeroDivisors), ring.zeroDivisors.length ? "每个都有乘积为 0 的非零见证" : "当前模环没有非零零因子"],
      ["理想与商环", ring.ideals.map(function (ideal) {
        return "(" + ideal.generator + ") -> Z_" + ring.modulus + "/(" + ideal.generator + ") ≅ " + ideal.quotientLabel;
      }).join("；"), "只对当前 Z_n 的有限理想分类"],
      ["扩张关系", extension.label + "；阶 " + extension.order, extension.note],
      ["扩张理想", extension.properIdeal
        ? "(" + extension.properIdeal.generatorLabel + ") = {" + extension.properIdeal.members.map(extension.labelOf).join("，") + "}"
        : "只有零理想与全环", extension.properIdeal ? "可约多项式留下真理想" : "域的理想只有两种"],
      ["扩张单位 / 零因子", joinValues(extension.units.map(extension.labelOf)) + " / " + joinValues(extension.zeroDivisors.map(extension.labelOf)), extension.field ? "不可约二次式：所有非零元可逆" : "可约多项式：存在非零零因子"]
    ];
    clear(refs.table);
    var table = element(doc, "table");
    table.appendChild(element(doc, "caption", { text: "有限代数证书：逐项结果与逻辑角色" }));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
      element(doc, "th", { scope: "col", text: "项目" }),
      element(doc, "th", { scope: "col", text: "结果" }),
      element(doc, "th", { scope: "col", text: "读法" })
    ])));
    var body = element(doc, "tbody");
    rows.forEach(function (row) {
      body.appendChild(element(doc, "tr", {}, row.map(function (value) { return element(doc, "td", { text: value }); })));
    });
    table.appendChild(body);
    refs.table.appendChild(table);

    var certificate = ring.field && extension.field
      ? "当前两层都通过域证书：Z_" + ring.modulus + " 的素数判据与不可约二次式的扩张判据同时成立。"
      : "失败边界已显示：模数合成或多项式可约时出现非零零因子，不能把商环称作域。";
    refs.certificate.className = "rfl-certificate" + (ring.field && extension.field ? "" : " rfl-fail");
    refs.certificate.textContent = certificate;
  }

  function predictionSpecs(ring, extension) {
    return [
      {
        key: "probe",
        prompt: "在 Z_" + ring.modulus + " 中，余数 2 是单位吗？",
        expected: ring.probeUnit ? "yes" : "no",
        choices: [{ value: "yes", label: "是" }, { value: "no", label: "不是" }]
      },
      {
        key: "criterion",
        prompt: "Z_n 成为域的充要条件是 n 为？",
        expected: "prime",
        choices: [{ value: "prime", label: "素数" }, { value: "composite", label: "合数" }, { value: "even", label: "偶数" }]
      },
      {
        key: "extension",
        prompt: extension.label + " 是域吗？",
        expected: extension.field ? "yes" : "no",
        choices: [{ value: "yes", label: "是" }, { value: "no", label: "不是" }]
      }
    ];
  }

  function renderPredictions(state, refs, ring, extension) {
    predictionSpecs(ring, extension).forEach(function (spec, index) {
      var question = refs.questions[index];
      question.legend.textContent = spec.prompt;
      question.buttons.forEach(function (button) {
        var selected = state.predictions[spec.key] === button.value;
        button.node.setAttribute("aria-pressed", selected ? "true" : "false");
        if (state.revealed) {
          var correct = button.value === spec.expected;
          button.node.textContent = (correct ? "✓ " : "") + button.label;
          button.node.className = correct ? "rfl-pass" : (selected ? "rfl-warn" : "");
        } else {
          button.node.textContent = button.label;
          button.node.className = "";
        }
      });
    });
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    var uid = "rfl-" + (++INSTANCE);
    var state = { modulus: 12, extensionId: "f2-field", revealed: false, predictions: {}, feedback: "" };
    var refs = { questions: [], uid: uid };
    installStyles(doc);

    var shell = element(doc, "div", { className: "rfl-lab" });
    shell.appendChild(element(doc, "h3", { text: "有限环与域扩张实验：先判单位，再看商环" }));
    shell.appendChild(element(doc, "p", { className: "rfl-note", text: "可变参数的有限证书；结果先隐藏，核对后再打开 SVG 与表格。有限枚举只审计当前模型，不代替一般证明。" }));

    var modulusInput = element(doc, "input", { type: "number", min: "4", max: "15", step: "1", value: "12", "aria-label": "模数 n" });
    var extensionSelect = element(doc, "select", { "aria-label": "有限域扩张模型" });
    EXTENSIONS.forEach(function (spec) {
      extensionSelect.appendChild(element(doc, "option", { value: spec.id, text: spec.label }));
    });
    var controls = element(doc, "div", { className: "rfl-controls" }, [
      element(doc, "div", { className: "rfl-field" }, [element(doc, "label", { htmlFor: uid + "-n", text: "模数 n（4–15）" }), modulusInput]),
      element(doc, "div", { className: "rfl-field" }, [element(doc, "label", { htmlFor: uid + "-extension", text: "二次商环" }), extensionSelect])
    ]);
    modulusInput.id = uid + "-n";
    extensionSelect.id = uid + "-extension";
    shell.appendChild(controls);

    var gate = element(doc, "div", { className: "rfl-gate" });
    for (let questionIndex = 0; questionIndex < 3; questionIndex += 1) {
      var fieldset = element(doc, "fieldset");
      var legend = element(doc, "legend", { text: "预测" });
      var options = element(doc, "div", { className: "rfl-options" });
      refs.questions.push({ legend: legend, buttons: [] });
      fieldset.appendChild(legend);
      fieldset.appendChild(options);
      gate.appendChild(fieldset);
      (questionIndex === 1
        ? [{ value: "prime", label: "素数" }, { value: "composite", label: "合数" }, { value: "even", label: "偶数" }]
        : [{ value: "yes", label: "是" }, { value: "no", label: "不是" }]
      ).forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice.label });
        button.addEventListener("click", function () {
          var specs = predictionSpecs(analyzeZMod(state.modulus), analyzeExtension(state.extensionId));
          state.predictions[specs[questionIndex].key] = choice.value;
          state.feedback = "";
          render();
        });
        refs.questions[questionIndex].buttons.push({ value: choice.value, label: choice.label, node: button });
        options.appendChild(button);
      });
    }
    shell.appendChild(gate);

    var reveal = element(doc, "button", { type: "button", className: "rfl-primary", text: "核对预测并揭晓" });
    var reset = element(doc, "button", { type: "button", text: "重置实验" });
    var feedback = element(doc, "p", { className: "rfl-feedback", "aria-live": "polite" });
    shell.appendChild(element(doc, "div", { className: "rfl-actions" }, [reveal, reset]));
    shell.appendChild(feedback);

    var result = element(doc, "div", { className: "rfl-result", hidden: true });
    var svg = svgElement(doc, "svg", { className: "rfl-svg", role: "img", viewBox: "0 0 720 330" });
    var metrics = element(doc, "div", { className: "rfl-metrics" });
    var table = element(doc, "div", { className: "rfl-table-wrap" });
    var certificate = element(doc, "p", { className: "rfl-certificate" });
    result.appendChild(element(doc, "div", { className: "rfl-frame" }, svg));
    result.appendChild(metrics);
    result.appendChild(table);
    result.appendChild(certificate);
    shell.appendChild(result);
    refs.metrics = metrics;
    refs.table = table;
    refs.certificate = certificate;
    refs.svg = svg;
    clear(root);
    root.appendChild(shell);

    function lock() {
      state.revealed = false;
      state.predictions = {};
      state.feedback = "";
      render();
    }

    modulusInput.addEventListener("change", function () {
      state.modulus = normalizeModulus(modulusInput.value);
      modulusInput.value = String(state.modulus);
      lock();
    });
    extensionSelect.addEventListener("change", function () {
      state.extensionId = extensionSelect.value;
      lock();
    });
    reset.addEventListener("click", function () {
      state = { modulus: 12, extensionId: "f2-field", revealed: false, predictions: {}, feedback: "" };
      modulusInput.value = "12";
      extensionSelect.value = "f2-field";
      render();
      announce(api, root, "环与域扩张实验已重置。");
    });
    reveal.addEventListener("click", function () {
      var ring = analyzeZMod(state.modulus);
      var extension = analyzeExtension(state.extensionId);
      var specs = predictionSpecs(ring, extension);
      if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) {
        state.feedback = "请先完成三项预测。";
        render();
        return;
      }
      var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
      state.revealed = true;
      state.feedback = "已揭晓：" + correct + "/" + specs.length + " 命中；现在把有限证书和一般定理分开读。";
      render();
      announce(api, root, state.feedback);
    });

    function render() {
      var ring = analyzeZMod(state.modulus);
      var extension = analyzeExtension(state.extensionId);
      modulusInput.value = String(ring.modulus);
      extensionSelect.value = extension.id;
      renderPredictions(state, refs, ring, extension);
      feedback.textContent = state.feedback;
      feedback.className = "rfl-feedback" + (state.feedback.indexOf("请先") === 0 ? " rfl-warn" : "");
      result.hidden = !state.revealed;
      if (state.revealed) renderEvidence(doc, refs, ring, extension);
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      assert(condition, message);
      checks += 1;
    }
    var moduli = [4, 5, 6, 7, 8, 12];
    moduli.forEach(function (modulus) {
      var report = analyzeZMod(modulus);
      check(report.units.every(function (element) { return gcd(element, modulus) === 1; }), "unit criterion " + modulus);
      check(report.zeroDivisors.every(function (element) { return element !== 0 && gcd(element, modulus) > 1; }), "zero divisor criterion " + modulus);
      check(report.units.length + report.zeroDivisors.length === modulus - 1, "every nonzero element classified " + modulus);
      check(report.witnesses.every(function (item) { return item.other !== null && mod(item.element * item.other, modulus) === 0; }), "zero divisor witness " + modulus);
      check(report.ideals.every(function (ideal) { return ideal.members.length * ideal.quotientOrder === modulus; }), "ideal quotient size " + modulus);
      check(report.field === (report.units.length === modulus - 1 && report.zeroDivisors.length === 0), "enumerated field status " + modulus);
      check(report.field === isPrime(modulus), "enumeration agrees with prime criterion " + modulus);
    });
    var extensionIds = EXTENSIONS.map(function (spec) { return spec.id; });
    extensionIds.forEach(function (id) {
      var report = analyzeExtension(id);
      check(report.order === report.prime * report.prime, "extension order " + id);
      check(report.elements.every(function (element) {
        return report.elements.every(function (other) {
          var product = report.multiply(element, other);
          return product[0] >= 0 && product[0] < report.prime && product[1] >= 0 && product[1] < report.prime;
        });
      }), "extension closure " + id);
      check(report.field === extensionById(id).irreducible, "irreducible field status " + id);
      check(report.zeroDivisors.every(function (element) {
        return report.elements.some(function (other) {
          return !pairEqual(other, [0, 0]) && pairEqual(report.multiply(element, other), [0, 0]);
        });
      }), "extension zero divisor witness " + id);
    });
    var repeated = analyzeExtension("f2-repeated");
    check(repeated.properIdeal !== null, "repeated polynomial proper ideal");
    check(repeated.properIdeal.members.length === 2, "repeated polynomial ideal size");
    var field = analyzeExtension("f2-field");
    check(field.units.length === 3 && field.zeroDivisors.length === 0, "F4 unit certificate");
    return { checks: checks, moduli: moduli.length, extensions: extensionIds.length };
  }

  return {
    mount: mount,
    analyzeZMod: analyzeZMod,
    analyzeExtension: analyzeExtension,
    selfTest: selfTest
  };
});

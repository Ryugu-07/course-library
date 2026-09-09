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
    if (value === undefined) return 12;
    assert(Number.isInteger(value) && value >= 2 && value <= 15, "modulus must be an integer from 2 to 15");
    return value;
  }
  function deepFreeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.keys(value).forEach(function (key) { deepFreeze(value[key]); }); Object.freeze(value);
    } return value;
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
      inverses: units.map(function(a){return {element:a,inverse:elements.find(function(b){return mod(a*b,modulus)===1;})};}),
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
      note: "α²=α+1；不可约二次式给出 F4"
    },
    {
      id: "f2-repeated",
      label: "F2[x]/(x^2+1)",
      base: "F2",
      prime: 2,
      polynomial: "x^2+1",
      relation: [1, 0],
      irreducible: false,
      note: "α²=1；x^2+1=(x+1)^2"
    },
    {
      id: "f3-field",
      label: "F3[x]/(x^2+1)",
      base: "F3",
      prime: 3,
      polynomial: "x^2+1",
      relation: [2, 0],
      irreducible: true,
      note: "α²=2；不可约二次式给出 F9"
    },
    {
      id: "f3-split", label: "F3[x]/(x^2-1)", base: "F3", prime: 3,
      polynomial: "x^2-1", relation: [1,0], irreducible: false,
      note: "α²=1；(x-1)(x+1)，商环同构于 F3×F3"
    }
  ];

  deepFreeze(EXTENSIONS);
  function extensionById(id) {
    if (id === undefined) id = "f2-field";
    for (var index = 0; index < EXTENSIONS.length; index += 1) {
      if (EXTENSIONS[index].id === id) return EXTENSIONS[index];
    }
    throw new Error("unknown quadratic quotient model");
  }

  function pairKey(pair) {
    return pair[0] + ":" + pair[1];
  }

  function pairEqual(left, right) {
    return left[0] === right[0] && left[1] === right[1];
  }

  function validPair(spec, pair) {
    assert(Array.isArray(pair) && pair.length === 2 && pair.every(function(v){return Number.isInteger(v)&&v>=0&&v<spec.prime;}), "canonical pair required");
  }
  function extensionAdd(spec, left, right) {
    validPair(spec,left);validPair(spec,right);
    return [mod(left[0] + right[0], spec.prime), mod(left[1] + right[1], spec.prime)];
  }

  function extensionMultiply(spec, left, right) {
    validPair(spec,left);validPair(spec,right);
    var constant = left[0] * right[0] + left[1] * right[1] * spec.relation[0];
    var linear = left[0] * right[1] + left[1] * right[0] + left[1] * right[1] * spec.relation[1];
    return [mod(constant, spec.prime), mod(linear, spec.prime)];
  }

  function extensionLabel(spec, pair) {
    if (pair[0] === 0 && pair[1] === 0) return "0";
    var terms = [];
    if (pair[0] !== 0) terms.push(pair[0] === 1 ? "1" : String(pair[0]));
    if (pair[1] !== 0) {
      terms.push(pair[1] === 1 ? "α" : String(pair[1]) + "α");
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

  var EXT_CACHE = Object.create(null);
  function analyzeExtension(id) {
    var spec = extensionById(id);
    if (EXT_CACHE[spec.id]) return EXT_CACHE[spec.id];
    var elements = [];
    for (var a = 0; a < spec.prime; a += 1) {
      for (var b = 0; b < spec.prime; b += 1) elements.push([a, b]);
    }
    var units = elements.filter(function (element) { return hasMultiplicativeInverse(spec, element, elements); });
    var zeroDivisors = elements.filter(function (element) { return hasZeroProduct(spec, element, elements); });
    var roots = range(spec.prime).filter(function(a){return mod(a*a-spec.relation[1]*a-spec.relation[0],spec.prime)===0;});
    var ideals = [];
    for (var mask=1;mask<Math.pow(2,elements.length);mask+=2) {
      var members=elements.filter(function(_,i){return (mask>>i)&1;});
      var memberKeys=members.map(pairKey);
      var included=function(v){return contains(memberKeys,pairKey(v));};
      if (members.every(function(a){return members.every(function(b){return included(extensionAdd(spec,a,b));}) &&
        elements.every(function(b){return included(extensionMultiply(spec,a,b));});})) ideals.push(members);
    }
    var witnesses=zeroDivisors.map(function(a){return {element:a,other:elements.find(function(b){return !pairEqual(b,[0,0])&&pairEqual(extensionMultiply(spec,a,b),[0,0]);})};});
    var inverses=units.map(function(a){return {element:a,inverse:elements.find(function(b){return pairEqual(extensionMultiply(spec,a,b),[1,0]);})};});
    function power(a,k){var value=[1,0];for(var i=0;i<k;i++)value=extensionMultiply(spec,value,a);return value;}
    var nilpotents=elements.filter(function(a){return !pairEqual(a,[0,0])&&pairEqual(power(a,elements.length),[0,0]);});
    var frobenius=elements.map(function(a){return {element:a,image:power(a,spec.prime)};});
    var generator = zeroDivisors.length ? zeroDivisors[0] : null;
    var idealMembers = generator ? uniquePairs(elements.map(function(a){return extensionMultiply(spec,generator,a);})) : [];

    var report = {
      roots:roots, ideals:ideals, inverses:inverses, witnesses:witnesses, nilpotents:nilpotents, frobenius:frobenius,
      id: spec.id,
      label: spec.label,
      base: spec.base,
      prime: spec.prime,
      polynomial: spec.polynomial,
      relation: spec.relation,
      irreducible: roots.length === 0,
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
    assert(report.field === report.irreducible, "enumeration and root criterion disagree");
    EXT_CACHE[spec.id]=deepFreeze(report); return EXT_CACHE[spec.id];
  }

  function quotientReport(n,d) {
    var ring=analyzeZMod(n);
    assert(Number.isInteger(d)&&d>=1&&ring.modulus%d===0,"quotient generator must divide n");
    return {
      n:ring.modulus,d:d,members:ring.ideals.find(function(i){return i.generator===d;}).members,
      map:ring.elements.map(function(a){return a%d;}),
      addition:range(d).map(function(a){return range(d).map(function(b){return (a+b)%d;});}),
      multiplication:range(d).map(function(a){return range(d).map(function(b){return a*b%d;});})
    };
  }
  var GAL_OPS=deepFreeze([
    {label:"e",signs:[1,1,1,1]}, {label:"σ",signs:[1,-1,1,-1]},
    {label:"τ",signs:[1,1,-1,-1]}, {label:"στ",signs:[1,-1,-1,1]}
  ]);
  var GAL_SUBGROUPS=deepFreeze([
    {label:"{e}",ops:[0],field:"E = Q(√2,√3)"},
    {label:"{e,σ}",ops:[0,1],field:"Q(√3)"},
    {label:"{e,τ}",ops:[0,2],field:"Q(√2)"},
    {label:"{e,στ}",ops:[0,3],field:"Q(√6)"},
    {label:"G = {e,σ,τ,στ}",ops:[0,1,2,3],field:"Q"}
  ]);
  function galoisReport(h,coefficients) {
    if(h===undefined)h=1;if(coefficients===undefined)coefficients=[1,1,1,1];
    assert(Number.isInteger(h)&&h>=0&&h<GAL_SUBGROUPS.length,"unknown V4 subgroup");
    assert(Array.isArray(coefficients)&&coefficients.length===4&&coefficients.every(function(c){return Number.isInteger(c)&&Math.abs(c)<=9;}),"four integer coefficients from -9 to 9 required");
    var subgroup=GAL_SUBGROUPS[h];
    var basis=range(4).filter(function(j){return subgroup.ops.every(function(i){return GAL_OPS[i].signs[j]===1;});});
    var images=GAL_OPS.map(function(op,i){var c=coefficients.map(function(v,j){return v*op.signs[j];});
      return {label:op.label,member:contains(subgroup.ops,i),coefficients:c,fixed:c.every(function(v,j){return v===coefficients[j];})};});
    return {subgroup:subgroup,basis:basis,degree:basis.length,relativeDegree:subgroup.ops.length,images:images,
      fixed:images.every(function(i){return !i.member||i.fixed;})};
  }

  var STYLE_TEXT = [
    ".rfl-lab .rfl-frame:focus-visible,.rfl-lab .rfl-table-wrap:focus-visible{outline:3px solid var(--rfl-blue);outline-offset:2px}.rfl-lab .rfl-galois{min-width:0;padding:12px;border:1px solid var(--border)}.rfl-lab .rfl-coefficients{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.rfl-lab .rfl-operation-table td,.rfl-lab .rfl-operation-table th{min-width:42px;text-align:center}.rfl-lab .rfl-operation-table{width:auto}",
    ".rfl-lab{--rfl-blue:var(--accent,#315f9d);--rfl-gold:var(--cl-gold,#9b6a12);--rfl-green:var(--cl-green,#39734d);--rfl-red:var(--cl-red,#b64335);--rfl-muted:var(--fg-soft,#6b6557);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".rfl-lab *,.rfl-lab *::before,.rfl-lab *::after{box-sizing:border-box}.rfl-lab [hidden]{display:none!important}",
    ".rfl-lab h3,.rfl-lab h4{margin:0;color:var(--fg);letter-spacing:0}.rfl-lab h3{font-size:1.18rem}.rfl-lab h4{font-size:1rem}.rfl-lab p{margin:7px 0}.rfl-lab .rfl-note,.rfl-lab .rfl-feedback{color:var(--rfl-muted);font-size:13px;line-height:1.7}",
    ".rfl-lab .rfl-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0}.rfl-lab .rfl-field{display:grid;gap:5px;min-width:0}.rfl-lab .rfl-field label{color:var(--rfl-muted);font-size:12.5px;font-weight:750}.rfl-lab select,.rfl-lab input{width:100%;min-height:44px;padding:7px 9px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35}.rfl-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;font:inherit;line-height:1.35;overflow-wrap:anywhere}.rfl-lab button:hover{border-color:var(--rfl-blue)}.rfl-lab button:focus-visible,.rfl-lab select:focus-visible,.rfl-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.rfl-lab button[aria-pressed=true],.rfl-lab .rfl-primary{border-color:var(--rfl-blue);background:var(--rfl-blue);color:var(--bg);font-weight:750}",
    ".rfl-lab .rfl-gate{margin:14px 0;padding:12px;border-left:3px solid var(--rfl-gold);background:var(--block-bg,var(--bg))}.rfl-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border);background:var(--bg)}.rfl-lab legend{max-width:100%;padding:0 3px;color:var(--fg);font-size:13px;font-weight:700;line-height:1.5}.rfl-lab .rfl-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.rfl-lab .rfl-options button{font-size:12px}.rfl-lab .rfl-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.rfl-lab .rfl-actions>*{flex:1 1 180px}.rfl-lab .rfl-feedback{min-height:1.7em;margin-top:9px;font-weight:700}.rfl-lab .rfl-pass{color:var(--rfl-green)}.rfl-lab .rfl-warn{color:var(--rfl-red)}",
    ".rfl-lab .rfl-result{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;margin-top:15px}.rfl-lab .rfl-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px}.rfl-lab .rfl-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.rfl-lab .rfl-metric:nth-child(3n+1){border-color:var(--rfl-blue)}.rfl-lab .rfl-metric:nth-child(3n+2){border-color:var(--rfl-gold)}.rfl-lab .rfl-metric:nth-child(3n){border-color:var(--rfl-green)}.rfl-lab .rfl-metric span{display:block;color:var(--rfl-muted);font-size:11px}.rfl-lab .rfl-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".rfl-lab .rfl-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch}.rfl-lab .rfl-svg{display:block;width:100%;min-width:760px;max-width:none;height:auto;color:var(--fg)}.rfl-lab .rfl-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.rfl-lab .rfl-ring-unit{fill:var(--rfl-green);stroke:var(--rfl-green)}.rfl-lab .rfl-ring-zero{fill:var(--rfl-red);stroke:var(--rfl-red)}.rfl-lab .rfl-ring-other{fill:var(--rfl-blue);stroke:var(--rfl-blue)}.rfl-lab .rfl-ext-unit{fill:var(--rfl-green);stroke:var(--rfl-green)}.rfl-lab .rfl-ext-zero{fill:var(--rfl-red);stroke:var(--rfl-red)}.rfl-lab .rfl-ext-other{fill:var(--rfl-blue);stroke:var(--rfl-blue)}.rfl-lab .rfl-svg text.rfl-inverse{fill:var(--bg);font-size:11px;font-weight:700;text-anchor:middle;dominant-baseline:middle}.rfl-lab .rfl-svg text.rfl-label{font-size:12px;text-anchor:middle}.rfl-lab .rfl-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.rfl-lab table{display:table;width:100%;min-width:760px;white-space:normal;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.rfl-lab caption{padding:0 0 7px;text-align:left;color:var(--rfl-muted);font-size:12px;font-weight:700}.rfl-lab th,.rfl-lab td{white-space:normal;overflow-wrap:anywhere;padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.rfl-lab th{color:var(--rfl-muted);font-size:11px}.rfl-lab .rfl-certificate{padding:10px 12px;border-left:3px solid var(--rfl-green);background:var(--block-bg,var(--bg));font-size:13px;line-height:1.7}.rfl-lab .rfl-certificate.rfl-fail{border-left-color:var(--rfl-red)}",
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
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-desc", text: "左侧圆环只是按余数顺序排列，颜色表示代数分类而非距离；右侧按系数a分行、b分列，元素为a+bα。" }));
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
    svg.appendChild(svgElement(doc, "text", { x: "185", y: "285", className: "rfl-label", text: "绿=单位  红=非零零因子  蓝=其他" }));

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
    svg.appendChild(svgElement(doc,"text",{x:"530",y:"314",className:"rfl-label",text:"行 a、列 b：a+bα；α=[x]"}));
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
      metric(doc, "二次商环元素数"),
      metric(doc, "二次商环是域")
    ];
    clear(refs.metrics);
    metrics.forEach(function (item) { refs.metrics.appendChild(item.node); });
    metrics[0].value.textContent = String(ring.modulus);
    metrics[1].value.textContent = String(ring.units.length);
    metrics[2].value.textContent = String(ring.zeroDivisors.length);
    metrics[3].value.textContent = ring.field ? "是" : "否";
    metrics[4].value.textContent = String(extension.prime) + "²=" + extension.order;
    metrics[5].value.textContent = extension.field ? "是" : "否";

    refs.svg.setAttribute("aria-labelledby", refs.uid + "-title " + refs.uid + "-desc");
    renderRingSvg(doc, refs.svg, ring, extension, refs.uid);

    var rows = [
      ["单位与逆元", ring.inverses.map(function(w){return w.element+" × "+w.inverse+" ≡ 1";}).join("；"), "a 的逆元存在，当且仅当 gcd(a,n)=1"],
      ["非零零因子与见证", ring.witnesses.map(function(w){return w.element+" × "+w.other+" ≡ 0";}).join("；")||"无", ring.zeroDivisors.length ? "每个都有乘积为 0 的非零见证" : "当前模环没有非零零因子"],
      ["理想与商环", ring.ideals.map(function (ideal) {
        return "(" + ideal.generator + ") -> Z_" + ring.modulus + "/(" + ideal.generator + ") ≅ " + ideal.quotientLabel;
      }).join("；"), "只对当前 Z_n 的有限理想分类"],
      ["扩张关系", extension.label + "；阶 " + extension.order, extension.note],
      ["二次商环全部理想", extension.ideals.map(function(I){return "{"+I.map(extension.labelOf).join("，")+"}";}).join("；"), "有限枚举逐项验证加法封闭和乘法吸收；不是任意环的一般分类"],
      ["二次商环逆元", extension.inverses.map(function(w){return extension.labelOf(w.element)+" · ("+extension.labelOf(w.inverse)+") = 1";}).join("；"), "乘法先按 α² 的关系约化"],
      ["二次商环零乘积", extension.witnesses.map(function(w){return "("+extension.labelOf(w.element)+")("+extension.labelOf(w.other)+") = 0";}).join("；")||"无", "两因子均非零"],
      ["非零幂零元", joinValues(extension.nilpotents.map(extension.labelOf)), "某个正整数次幂为零；这四个模型中，只有二重根模型存在"],
      ["Frobenius z ↦ z^"+extension.prime, extension.frobenius.map(function(w){return extension.labelOf(w.element)+" ↦ "+extension.labelOf(w.image);}).join("；"), "域中为自同构；二重根模型里不单射"],
      ["二次式在基域的根", joinValues(extension.roots), extension.irreducible ? "二次式无根，故不可约" : "有根，故可约；此判据不能直接推广到任意次数"]

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

    var certificate = "Z_"+ring.modulus+"："+(ring.field?"素数模数，是域":"合数模数，有非零零因子，不是域")+
      "。二次商环："+(extension.field?"多项式不可约，是域":"多项式可约，有非零零因子，不是域")+
      "。这是两个独立模型，不是把左边的模环作为右边的基域。";
    refs.certificate.className = "rfl-certificate" + (ring.field && extension.field ? "" : " rfl-fail");
    refs.certificate.textContent = certificate;
  }

  function operationTable(doc,title,labels,values) {
    var wrap=element(doc,"div",{className:"rfl-table-wrap",role:"region",tabindex:"0","aria-label":title});
    var table=element(doc,"table",{className:"rfl-operation-table"});
    table.appendChild(element(doc,"caption",{text:title+"（行左操作数，列右操作数）"}));
    table.appendChild(element(doc,"thead",{},element(doc,"tr",{},[title.indexOf("加法")>=0?"+":"·"].concat(labels).map(function(v){return element(doc,"th",{scope:"col",text:v});}))));
    var body=element(doc,"tbody");values.forEach(function(row,i){body.appendChild(element(doc,"tr",{},[element(doc,"th",{scope:"row",text:labels[i]})].concat(row.map(function(v){return element(doc,"td",{text:v});}))));});
    table.appendChild(body);wrap.appendChild(table);return wrap;
  }
  function renderQuotient(doc,container,n,d,extension) {
    clear(container);var q=quotientReport(n,d);
    container.appendChild(element(doc,"h4",{text:"理想 (d) 与商环的实际运算"}));
    container.appendChild(element(doc,"p",{text:"n="+n+"，d="+d+"；理想 {"+q.members.join("，")+"}；映射 a ↦ a mod d。余数 a=0,…,"+(n-1)+" 依次映到："+q.map.join("，")+"。商有 "+d+" 个元素"+(d===1?"；它是 1=0 的零环。":"。")}));
    container.appendChild(operationTable(doc,"商环加法",range(d),q.addition));
    container.appendChild(operationTable(doc,"商环乘法",range(d),q.multiplication));
    container.appendChild(operationTable(doc,"二次商环乘法",extension.elements.map(extension.labelOf),extension.elements.map(function(a){return extension.elements.map(function(b){return extension.labelOf(extension.multiply(a,b));});})));
  }
  function formatVector(c) {
    var basis=["","√2","√3","√6"],text="";
    c.forEach(function(v,i){if(!v)return;text+=(text?(v<0?" − ":" + "):(v<0?"−":""))+((Math.abs(v)===1&&i>0)?"":Math.abs(v))+basis[i];});
    return text||"0";
  }
  function galoisWidget(doc) {
    var box=element(doc,"section",{className:"rfl-galois","aria-label":"Galois 固定域坐标实验"});
    box.appendChild(element(doc,"h4",{text:"Galois 固定域：逐项检查哪些系数被迫为零"}));
    box.appendChild(element(doc,"p",{text:"E=Q(√2,√3)，σ 只翻 √2，τ 只翻 √3。选子群，再检验 a+b√2+c√3+d√6 是否被每个成员固定。界面提供整数系数；一般结论对全部有理系数成立。"}));
    var select=element(doc,"select",{"aria-label":"固定域对应子群"});
    GAL_SUBGROUPS.forEach(function(h,i){select.appendChild(element(doc,"option",{value:String(i),text:h.label}));});select.value="1";box.appendChild(select);
    var controls=element(doc,"div",{className:"rfl-coefficients"}),inputs=[];
    ["a","b","c","d"].forEach(function(label){var input=element(doc,"select",{"aria-label":"有理基系数 "+label});for(var i=-3;i<=3;i++)input.appendChild(element(doc,"option",{value:String(i),text:String(i)}));input.value="1";inputs.push(input);controls.appendChild(element(doc,"label",{},[label,input]));});
    box.appendChild(controls);var output=element(doc,"div",{"aria-live":"polite"});box.appendChild(output);
    function render() {
      var c=inputs.map(function(i){return Number(i.value);}),r=galoisReport(Number(select.value),c);clear(output);
      var basis=["1","√2","√3","√6"];
      output.appendChild(element(doc,"p",{text:"固定域 "+r.subgroup.field+"；可保留的基向量："+r.basis.map(function(i){return basis[i];}).join("，")+"。其余系数必须为零。"}));
      output.appendChild(element(doc,"p",{text:"[E:E^H]="+r.relativeDegree+"， [E^H:Q]="+r.degree+"，乘积 4；z="+formatVector(c)+"，"+(r.fixed?"属于":"不属于")+"这个固定域。"}));
      var wrap=element(doc,"div",{className:"rfl-table-wrap",tabindex:"0",role:"region","aria-label":"四个自同构的坐标计算"});
      var table=element(doc,"table");table.appendChild(element(doc,"thead",{},element(doc,"tr",{},["自同构","属于所选 H","z 的像","像等于 z"].map(function(v){return element(doc,"th",{scope:"col",text:v});}))));
      var body=element(doc,"tbody");r.images.forEach(function(i){body.appendChild(element(doc,"tr",{},[i.label,i.member?"是":"否",formatVector(i.coefficients),i.fixed?"是":"否"].map(function(v){return element(doc,"td",{text:v});})));});table.appendChild(body);wrap.appendChild(table);output.appendChild(wrap);
    }
    select.addEventListener("change",render);inputs.forEach(function(i){i.addEventListener("change",render);});render();return box;
  }

  function predictionSpecs(ring, extension) {
    return [
      {
        key: "probe",
        prompt: "在 Z_" + ring.modulus + " 中，整数 2 的剩余类 [2] 是单位吗？",
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
      },
      {key:"fixed",prompt:"σ 只翻转 √2 时，{e,σ} 的固定域是哪一个？",expected:"sqrt3",
        choices:[{value:"sqrt2",label:"Q(√2)"},{value:"sqrt3",label:"Q(√3)"},{value:"sqrt6",label:"Q(√6)"}]}
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
    var state = { divisor:3, modulus: 12, extensionId: "f2-field", revealed: false, predictions: {}, feedback: "" };
    var refs = { questions: [], uid: uid };
    installStyles(doc);

    var shell = element(doc, "div", { className: "rfl-lab" });
    shell.appendChild(element(doc, "h3", { text: "有限环与域扩张实验：先判单位，再看商环" }));
    shell.appendChild(element(doc, "p", { className: "rfl-note", text: "可变参数的有限证书；结果先隐藏，核对后再打开 SVG 与表格。有限枚举只审计当前模型，不代替一般证明。" }));

    var modulusInput = element(doc, "select", { "aria-label": "模数 n" });
    range(14).forEach(function(i){modulusInput.appendChild(element(doc,"option",{value:String(i+2),text:String(i+2)}));});modulusInput.value="12";
    var divisorSelect=element(doc,"select",{"aria-label":"理想生成元 d"});
    function updateDivisors(){clear(divisorSelect);divisors(state.modulus).forEach(function(d){divisorSelect.appendChild(element(doc,"option",{value:String(d),text:String(d)}));});divisorSelect.value=String(state.divisor);}
    updateDivisors();
    var extensionSelect = element(doc, "select", { "aria-label": "有限域扩张模型" });
    EXTENSIONS.forEach(function (spec) {
      extensionSelect.appendChild(element(doc, "option", { value: spec.id, text: spec.label }));
    });
    var controls = element(doc, "div", { className: "rfl-controls" }, [
      element(doc, "div", { className: "rfl-field" }, [element(doc, "label", { htmlFor: uid + "-n", text: "模数 n（2–15）" }), modulusInput]),
      element(doc, "div", { className: "rfl-field" }, [element(doc, "label", { htmlFor: uid + "-extension", text: "二次商环" }), extensionSelect]),
      element(doc,"div",{className:"rfl-field"},[element(doc,"label",{htmlFor:uid+"-d",text:"理想生成元 d（整除 n）"}),divisorSelect])
    ]);
    divisorSelect.id=uid+"-d";
    modulusInput.id = uid + "-n";
    extensionSelect.id = uid + "-extension";
    shell.appendChild(controls);

    var gate = element(doc, "div", { className: "rfl-gate" });
    for (let questionIndex = 0; questionIndex < 4; questionIndex += 1) {
      var fieldset = element(doc, "fieldset");
      var legend = element(doc, "legend", { text: "预测" });
      var options = element(doc, "div", { className: "rfl-options" });
      refs.questions.push({ legend: legend, buttons: [] });
      fieldset.appendChild(legend);
      fieldset.appendChild(options);
      gate.appendChild(fieldset);
      (questionIndex === 3 ? [{value:"sqrt2",label:"Q(√2)"},{value:"sqrt3",label:"Q(√3)"},{value:"sqrt6",label:"Q(√6)"}] : questionIndex === 1
        ? [{ value: "prime", label: "素数" }, { value: "composite", label: "合数" }, { value: "even", label: "偶数" }]
        : [{ value: "yes", label: "是" }, { value: "no", label: "不是" }]
      ).forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice.label });
        button.addEventListener("click", function () {
          var specs = predictionSpecs(analyzeZMod(state.modulus), analyzeExtension(state.extensionId));
          state.predictions[specs[questionIndex].key] = choice.value;
          state.revealed = false;
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

    var result = element(doc, "div", { className: "rfl-result", hidden: true, tabindex:"-1","aria-label":"环域实验结果" });
    var svg = svgElement(doc, "svg", { className: "rfl-svg", role: "img", viewBox: "0 0 720 330" });
    var metrics = element(doc, "div", { className: "rfl-metrics" });
    var table = element(doc, "div", { className: "rfl-table-wrap",role:"region",tabindex:"0","aria-label":"有限环域运算证书" });
    var certificate = element(doc, "p", { className: "rfl-certificate" });
    result.appendChild(element(doc, "div", { className: "rfl-frame",role:"region",tabindex:"0","aria-label":"余数与二次商环元素图" }, svg));
    result.appendChild(metrics);
    result.appendChild(table);
    result.appendChild(certificate);
    var quotient=element(doc,"section",{"aria-label":"商环运算表"});result.appendChild(quotient);
    var galContainer=element(doc,"div");result.appendChild(galContainer);
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
      state.modulus = normalizeModulus(Number(modulusInput.value));
      state.divisor=1;updateDivisors();
      modulusInput.value = String(state.modulus);
      lock();
    });
    divisorSelect.addEventListener("change",function(){state.divisor=Number(divisorSelect.value);lock();});
    extensionSelect.addEventListener("change", function () {
      state.extensionId = extensionSelect.value;
      lock();
    });
    reset.addEventListener("click", function () {
      state = { divisor:3, modulus: 12, extensionId: "f2-field", revealed: false, predictions: {}, feedback: "" };
      updateDivisors();
      modulusInput.value = "12";
      extensionSelect.value = "f2-field";
      render();
      refs.questions[0].buttons[0].node.focus();
      announce(api, root, "环与域扩张实验已重置。");
    });
    reveal.addEventListener("click", function () {
      var ring = analyzeZMod(state.modulus);
      var extension = analyzeExtension(state.extensionId);
      var specs = predictionSpecs(ring, extension);
      if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) {
        state.feedback = "请先完成四项预测。";
        render();
        return;
      }
      var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
      state.revealed = true;
      state.feedback = "已揭晓：" + correct + "/" + specs.length + " 命中；现在把有限证书和一般定理分开读。";
      render();
      result.focus();
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
      if (state.revealed) {
        renderEvidence(doc, refs, ring, extension);renderQuotient(doc,quotient,state.modulus,state.divisor,extension);
        if(!galContainer.firstChild)galContainer.appendChild(galoisWidget(doc));
      } else clear(galContainer);
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      assert(condition, message);
      checks += 1;
    }
    var moduli = range(14).map(function(i){return i+2;});
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
    quotientReport: quotientReport,
    galoisReport: galoisReport,
    EXTENSIONS: EXTENSIONS,
    GAL_OPS:GAL_OPS,
    GAL_SUBGROUPS:GAL_SUBGROUPS,
    renderRingSvg:renderRingSvg,
    selfTest: selfTest
  };
});

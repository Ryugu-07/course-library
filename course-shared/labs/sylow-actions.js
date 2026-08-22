(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("sylow-actions", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("sylow-actions self-test: PASS (" + report.checks + " checks, " + report.groups + " groups, " + report.subgroupCases + " subgroup checks)");
    } catch (error) {
      console.error("sylow-actions self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "sylow-actions-lab-styles";
  var INSTANCE = 0;

  function key(permutation) { return permutation.join(","); }

  function compose(left, right) {
    return left.map(function (_, index) { return left[right[index]]; });
  }

  function inverse(permutation) {
    var result = new Array(permutation.length);
    permutation.forEach(function (value, index) { result[value] = index; });
    return result;
  }

  function identity(size) {
    return Array.apply(null, Array(size)).map(function (_, index) { return index; });
  }

  function permutations(size) {
    if (size === 0) return [[]];
    var result = [];
    function extend(prefix, remaining) {
      if (!remaining.length) { result.push(prefix.slice()); return; }
      remaining.forEach(function (value, index) {
        var nextRemaining = remaining.slice(0, index).concat(remaining.slice(index + 1));
        extend(prefix.concat([value]), nextRemaining);
      });
    }
    extend([], Array.apply(null, Array(size)).map(function (_, index) { return index; }));
    return result;
  }

  function parity(permutation) {
    var inversions = 0;
    for (var left = 0; left < permutation.length; left += 1) {
      for (var right = left + 1; right < permutation.length; right += 1) {
        if (permutation[left] > permutation[right]) inversions += 1;
      }
    }
    return inversions % 2;
  }

  function closure(generators, size) {
    var elements = [identity(size)];
    var seen = Object.create(null);
    seen[key(elements[0])] = true;
    var changed = true;
    while (changed) {
      changed = false;
      elements.slice().forEach(function (element) {
        generators.concat(elements.slice()).forEach(function (generator) {
          [compose(element, generator), compose(generator, element), inverse(element)].forEach(function (candidate) {
            var candidateKey = key(candidate);
            if (!seen[candidateKey]) {
              seen[candidateKey] = true;
              elements.push(candidate);
              changed = true;
            }
          });
        });
      });
    }
    return elements.sort(function (left, right) { return key(left).localeCompare(key(right)); });
  }

  function cycleLabel(permutation) {
    var visited = Object.create(null);
    var cycles = [];
    for (var start = 0; start < permutation.length; start += 1) {
      if (visited[start]) continue;
      var cycle = [];
      var current = start;
      while (!visited[current]) {
        visited[current] = true;
        cycle.push(String(current + 1));
        current = permutation[current];
      }
      if (cycle.length > 1) cycles.push("(" + cycle.join("") + ")");
    }
    return cycles.length ? cycles.join("") : "e";
  }

  function makeGroup(id, label, values, focusPrime) {
    var group = { id: id, label: label, values: values, labels: values.map(cycleLabel), focusPrime: focusPrime };
    group.indexOf = function (value) {
      var valueKey = key(value);
      for (var index = 0; index < group.values.length; index += 1) if (key(group.values[index]) === valueKey) return index;
      return -1;
    };
    group.identity = group.indexOf(identity(values[0].length));
    group.mul = group.values.map(function (left) { return group.values.map(function (right) { return group.indexOf(compose(left, right)); }); });
    group.inv = group.values.map(function (value) { return group.indexOf(inverse(value)); });
    group.points = values[0].length;
    return group;
  }

  var allFour = permutations(4);
  var A4Values = allFour.filter(function (permutation) { return parity(permutation) === 0; });
  var D4Values = closure([[1, 2, 3, 0], [0, 3, 2, 1]], 4);
  var GROUPS = [
    makeGroup("s3", "S3：三点自然作用", permutations(3), 2),
    makeGroup("a4", "A4：四点自然作用", A4Values, 3),
    makeGroup("d4", "D4：正方形的八个对称", D4Values, 2)
  ];

  var STYLE_TEXT = [
    ".sa-lab{--sa-blue:var(--accent,#315f9d);--sa-gold:var(--cl-gold,#9b6a12);--sa-green:var(--cl-green,#39734d);--sa-red:var(--cl-red,#b64335);--sa-muted:var(--fg-soft,#6b6557);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".sa-lab *,.sa-lab *::before,.sa-lab *::after{box-sizing:border-box}.sa-lab [hidden]{display:none!important}.sa-lab h3,.sa-lab h4{margin:0;color:var(--fg);letter-spacing:0}.sa-lab h3{font-size:1.18rem}.sa-lab h4{font-size:1rem}.sa-lab p{margin:7px 0}.sa-lab .sa-intro,.sa-lab .sa-note,.sa-lab .sa-status{color:var(--sa-muted);font-size:13px;line-height:1.7}",
    ".sa-lab .sa-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0}.sa-lab .sa-field{display:grid;gap:5px;min-width:0}.sa-lab .sa-field label{color:var(--sa-muted);font-size:12.5px;font-weight:750}.sa-lab select{width:100%;min-height:44px;padding:7px 9px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35}.sa-lab button{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;font:inherit;line-height:1.35;overflow-wrap:anywhere}.sa-lab button:hover{border-color:var(--sa-blue)}.sa-lab button:focus-visible,.sa-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.sa-lab button[aria-pressed=true],.sa-lab button.sa-primary{border-color:var(--sa-blue);background:var(--sa-blue);color:var(--bg);font-weight:750}",
    ".sa-lab .sa-prediction{margin:14px 0;padding:12px;border-left:3px solid var(--sa-gold);background:var(--block-bg,var(--bg))}.sa-lab .sa-prediction h4{margin-bottom:6px}.sa-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border);background:var(--bg)}.sa-lab legend{max-width:100%;padding:0 3px;color:var(--fg);font-size:13px;font-weight:700;line-height:1.5}.sa-lab .sa-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.sa-lab .sa-options button{font-size:12px}.sa-lab .sa-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.sa-lab .sa-actions>*{flex:1 1 170px}.sa-lab .sa-status{min-height:1.7em;margin-top:9px;font-weight:700}.sa-lab .sa-pass{color:var(--sa-green)}.sa-lab .sa-warn{color:var(--sa-red)}",
    ".sa-lab .sa-evidence{display:grid;gap:12px;margin-top:15px}.sa-lab .sa-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px}.sa-lab .sa-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.sa-lab .sa-metric:nth-child(3n+1){border-color:var(--sa-blue)}.sa-lab .sa-metric:nth-child(3n+2){border-color:var(--sa-gold)}.sa-lab .sa-metric:nth-child(3n){border-color:var(--sa-green)}.sa-lab .sa-metric span{display:block;color:var(--sa-muted);font-size:11px}.sa-lab .sa-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".sa-lab .sa-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch}.sa-lab .sa-svg{display:block;width:100%;min-width:600px;height:auto;color:var(--fg)}.sa-lab .sa-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.sa-lab .sa-svg .sa-class{fill:var(--sa-blue);fill-opacity:.13;stroke:var(--sa-blue);stroke-width:1.5}.sa-lab .sa-svg .sa-center-class{fill:var(--sa-gold);fill-opacity:.16;stroke:var(--sa-gold);stroke-width:1.5}.sa-lab .sa-svg .sa-orbit{fill:var(--sa-green);stroke:var(--bg);stroke-width:2}.sa-lab .sa-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.sa-lab table{width:100%;min-width:760px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.sa-lab caption{padding:0 0 7px;text-align:left;color:var(--sa-muted);font-size:12px;font-weight:700}.sa-lab th,.sa-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;white-space:nowrap}.sa-lab th{color:var(--sa-muted);font-size:11px}.sa-lab .sa-certificate{padding:10px 12px;border-left:3px solid var(--sa-green);background:var(--block-bg,var(--bg));font-size:13px;line-height:1.7}",
    "@media(max-width:680px){.sa-lab .sa-controls{grid-template-columns:minmax(0,1fr)}.sa-lab .sa-options{grid-template-columns:minmax(0,1fr)}.sa-lab .sa-frame{padding:5px}.sa-lab table{font-size:11.5px}}@media(prefers-reduced-motion:reduce){.sa-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function getGroup(id) {
    for (var index = 0; index < GROUPS.length; index += 1) if (GROUPS[index].id === id) return GROUPS[index];
    return GROUPS[0];
  }

  function sameSet(left, right) {
    var a = left.slice().sort(function (x, y) { return x - y; });
    var b = right.slice().sort(function (x, y) { return x - y; });
    return a.length === b.length && a.every(function (value, index) { return value === b[index]; });
  }

  function orbitStabilizer(group, point) {
    var orbit = [];
    var stabilizer = [];
    group.values.forEach(function (permutation, index) {
      if (orbit.indexOf(permutation[point]) < 0) orbit.push(permutation[point]);
      if (permutation[point] === point) stabilizer.push(index);
    });
    orbit.sort(function (left, right) { return left - right; });
    return { point: point, orbit: orbit, stabilizer: stabilizer, orbitSize: orbit.length, stabilizerSize: stabilizer.length, product: orbit.length * stabilizer.length };
  }

  function conjugacyClasses(group) {
    var classes = [];
    var seen = Object.create(null);
    for (var element = 0; element < group.values.length; element += 1) {
      if (seen[element]) continue;
      var members = [];
      group.values.forEach(function (_, conjugator) {
        var conjugate = group.mul[group.mul[conjugator][element]][group.inv[conjugator]];
        if (members.indexOf(conjugate) < 0) members.push(conjugate);
      });
      members.sort(function (left, right) { return left - right; });
      members.forEach(function (member) { seen[member] = true; });
      classes.push({ representative: element, members: members, size: members.length, centralizerSize: group.values.length / members.length });
    }
    return classes.sort(function (left, right) { return left.size - right.size || left.representative - right.representative; });
  }

  function enumerateSubgroups(group) {
    var count = group.values.length;
    var result = [];
    var limit = Math.pow(2, count);
    for (var mask = 1; mask < limit; mask += 1) {
      if (!(mask & (1 << group.identity))) continue;
      var elements = [];
      for (var index = 0; index < count; index += 1) if (mask & (1 << index)) elements.push(index);
      var valid = elements.every(function (left) {
        if (elements.indexOf(group.inv[left]) < 0) return false;
        return elements.every(function (right) { return elements.indexOf(group.mul[left][right]) >= 0; });
      });
      if (valid) result.push(elements);
    }
    return result;
  }

  function primes(n) {
    var value = n;
    var result = [];
    for (var candidate = 2; candidate * candidate <= value; candidate += 1) {
      if (value % candidate !== 0) continue;
      result.push(candidate);
      while (value % candidate === 0) value /= candidate;
    }
    if (value > 1) result.push(value);
    return result;
  }

  function sylowConstraints(group, allSubgroups) {
    return primes(group.values.length).map(function (prime) {
      var power = 1;
      var remainder = group.values.length;
      while (remainder % prime === 0) { power *= prime; remainder /= prime; }
      var candidates = [];
      for (var possible = 1; possible <= remainder; possible += 1) if (remainder % possible === 0 && possible % prime === 1) candidates.push(possible);
      var actual = allSubgroups.filter(function (subgroup) { return subgroup.length === power; });
      return { prime: prime, pPower: power, cofactor: remainder, candidates: candidates, subgroups: actual, actualCount: actual.length, congruenceAndDivisibility: candidates.indexOf(actual.length) >= 0 };
    });
  }

  function classEquation(classes) {
    return classes.map(function (item) { return item.size; }).join(" + ");
  }

  function analyze(groupId) {
    var group = getGroup(groupId);
    var subgroups = enumerateSubgroups(group);
    var classes = conjugacyClasses(group);
    var center = classes.filter(function (item) { return item.size === 1; }).reduce(function (all, item) { return all.concat(item.members); }, []);
    var orbit = orbitStabilizer(group, 0);
    var sylow = sylowConstraints(group, subgroups);
    return {
      groupId: group.id,
      groupLabel: group.label,
      order: group.values.length,
      pointCount: group.points,
      orbit: orbit,
      classes: classes,
      center: center,
      classEquation: group.values.length + " = " + classEquation(classes),
      subgroups: subgroups,
      sylow: sylow,
      focusPrime: group.focusPrime
    };
  }

  function installStyles(doc) {
    if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement || doc.body).appendChild(style);
  }

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

  function element(doc, tag, attributes, children) { return appendChildren(setAttributes(doc.createElement(tag), attributes), children, doc); }
  function svgElement(doc, tag, attributes, children) { return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attributes), children, doc); }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }

  function classMembers(report, group, item) {
    return item.members.map(function (index) { return group.labels[index]; }).join(", ");
  }

  function renderSvg(doc, report, group, serial) {
    var svg = svgElement(doc, "svg", { className: "sa-svg", viewBox: "0 0 760 315", role: "img", "aria-labelledby": "sa-svg-title-" + serial + " sa-svg-desc-" + serial });
    svg.appendChild(svgElement(doc, "title", { id: "sa-svg-title-" + serial }, "轨道和共轭类的有限群作用图"));
    svg.appendChild(svgElement(doc, "desc", { id: "sa-svg-desc-" + serial }, "上方圆点表示自然作用在顶点上的轨道；下方色块表示共轭类，单点色块组成中心。"));
    svg.appendChild(svgElement(doc, "text", { x: "16", y: "23", className: "sa-svg-heading" }, "自然轨道：点 1 的 orbit"));
    var orbitStart = 75;
    report.orbit.orbit.forEach(function (point, index) {
      var x = orbitStart + index * 78;
      svg.appendChild(svgElement(doc, "circle", { cx: String(x), cy: "57", r: "18", className: "sa-orbit" }));
      svg.appendChild(svgElement(doc, "text", { x: String(x), y: "62", "text-anchor": "middle" }, String(point + 1)));
    });
    svg.appendChild(svgElement(doc, "text", { x: "365", y: "62", className: "sa-svg-note" }, "|orbit|=" + report.orbit.orbitSize + "，|stabilizer|=" + report.orbit.stabilizerSize));
    svg.appendChild(svgElement(doc, "text", { x: "16", y: "108", className: "sa-svg-heading" }, "共轭作用：classes"));
    var cursorX = 16;
    report.classes.forEach(function (item) {
      var width = Math.max(92, item.size * 82);
      svg.appendChild(svgElement(doc, "rect", { x: String(cursorX), y: "124", width: String(width - 8), height: "70", rx: "5", className: item.size === 1 ? "sa-center-class" : "sa-class" }));
      svg.appendChild(svgElement(doc, "text", { x: String(cursorX + 8), y: "146", className: "sa-svg-label" }, "size " + item.size));
      svg.appendChild(svgElement(doc, "text", { x: String(cursorX + 8), y: "169", className: "sa-svg-note" }, classMembers(report, group, item)));
      cursorX += width;
    });
    svg.appendChild(svgElement(doc, "text", { x: "16", y: "230", className: "sa-svg-heading" }, "类方程：" + report.classEquation));
    svg.appendChild(svgElement(doc, "text", { x: "16", y: "263", className: "sa-svg-note" }, "中心由单点共轭类组成；其余色块只是本群的有限枚举，不是一般证明。"));
    return svg;
  }

  function renderEvidence(doc, evidence, report, group) {
    clear(evidence);
    evidence.appendChild(element(doc, "div", { className: "sa-metrics" }, [
      element(doc, "div", { className: "sa-metric" }, [element(doc, "span", { text: "群阶 |G|" }), element(doc, "strong", { text: String(report.order) })]),
      element(doc, "div", { className: "sa-metric" }, [element(doc, "span", { text: "轨道大小" }), element(doc, "strong", { text: String(report.orbit.orbitSize) })]),
      element(doc, "div", { className: "sa-metric" }, [element(doc, "span", { text: "稳定子大小" }), element(doc, "strong", { text: String(report.orbit.stabilizerSize) })]),
      element(doc, "div", { className: "sa-metric" }, [element(doc, "span", { text: "中心大小" }), element(doc, "strong", { text: String(report.center.length) })])
    ]));
    var frame = element(doc, "div", { className: "sa-frame" }); frame.appendChild(renderSvg(doc, report, group, evidence.getAttribute("data-sa-serial"))); evidence.appendChild(frame);
    var tableWrap = element(doc, "div", { className: "sa-table-wrap" });
    var table = element(doc, "table"); table.appendChild(element(doc, "caption", { text: "作用、类方程与 Sylow 约束账本" }));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [element(doc, "th", { scope: "col", text: "层" }), element(doc, "th", { scope: "col", text: "有限结果" }), element(doc, "th", { scope: "col", text: "读法" })])));
    var body = element(doc, "tbody");
    body.appendChild(element(doc, "tr", {}, [element(doc, "td", { text: "轨道-稳定子" }), element(doc, "td", { text: report.orbit.orbitSize + " × " + report.orbit.stabilizerSize + " = " + report.order }), element(doc, "td", { text: "自然作用点 1 的精确枚举" })]));
    body.appendChild(element(doc, "tr", {}, [element(doc, "td", { text: "类方程" }), element(doc, "td", { text: report.classEquation }), element(doc, "td", { text: "共轭作用的轨道分解" })]));
    body.appendChild(element(doc, "tr", {}, [element(doc, "td", { text: "中心" }), element(doc, "td", { text: report.center.map(function (index) { return group.labels[index]; }).join(", ") }), element(doc, "td", { text: "单点共轭类的并" })]));
    report.sylow.forEach(function (item) {
      body.appendChild(element(doc, "tr", {}, [
        element(doc, "td", { text: "Sylow p=" + item.prime }),
        element(doc, "td", { text: "n_p=" + item.actualCount + "；子群阶 " + item.pPower }),
        element(doc, "td", { text: "n_p | " + item.cofactor + "，n_p ≡ 1 (mod " + item.prime + ")；候选 " + item.candidates.join(", ") + "。实际值来自有限子集枚举。" })
      ]));
    });
    table.appendChild(body); tableWrap.appendChild(table); evidence.appendChild(tableWrap);
    evidence.appendChild(element(doc, "div", { className: "sa-certificate", text: "诊断边界：轨道、类方程与 Sylow 的同余/整除条件在这里被逐项核对；这个小群的枚举只是证书，不能替代对任意有限群的 Sylow 定理证明。" }));
  }

  function questionSpecs(report) {
    var focus = report.sylow.filter(function (item) { return item.prime === report.focusPrime; })[0];
    var orbitOptions = Array.from ? Array.from(new Set([report.orbit.orbitSize, report.orbit.stabilizerSize, report.order])).map(String) : [String(report.orbit.orbitSize), String(report.orbit.stabilizerSize), String(report.order)];
    var sylowOptions = [String(focus.actualCount), "1", String(focus.candidates[focus.candidates.length - 1] || focus.actualCount + 1)].filter(function (value, index, list) { return list.indexOf(value) === index; });
    while (sylowOptions.length < 3) sylowOptions.push(String(sylowOptions.length + 2));
    return [
      { key: "orbit", prompt: "自然作用中，点 1 的轨道大小是多少？", options: orbitOptions, answer: String(report.orbit.orbitSize) },
      { key: "classes", prompt: "共轭类大小之和应写成哪一个类方程？", options: [report.classEquation, report.order + " = 1 + " + (report.order - 1), report.order + " = " + report.order + ""], answer: report.classEquation },
      { key: "sylow", prompt: "焦点素数 p=" + report.focusPrime + " 时，实际 n_p 是多少？", options: sylowOptions, answer: String(focus.actualCount) }
    ];
  }

  function mount(root, api) {
    var doc = root.ownerDocument || (typeof document !== "undefined" ? document : null);
    if (!doc) return;
    installStyles(doc); root.classList.add("sa-lab"); INSTANCE += 1;
    var serial = INSTANCE;
    var state = { groupId: "s3", predictions: Object.create(null), revealed: false };
    var shell = element(doc, "div", { className: "sa-shell" });
    shell.appendChild(element(doc, "h3", { text: "群作用诊断台：轨道、类方程与 Sylow 计数" }));
    shell.appendChild(element(doc, "p", { className: "sa-intro", text: "选择一个固定的小群。脚本精确枚举自然轨道、共轭类和子群；预测揭晓后，把必要条件与有限证书分开。" }));
    var controls = element(doc, "div", { className: "sa-controls" });
    var field = element(doc, "div", { className: "sa-field" });
    field.appendChild(element(doc, "label", { htmlFor: "sa-group-" + serial, text: "有限群预设" }));
    var select = element(doc, "select", { id: "sa-group-" + serial, "aria-label": "选择群作用预设" });
    GROUPS.forEach(function (group) { select.appendChild(element(doc, "option", { value: group.id, text: group.label })); });
    field.appendChild(select); controls.appendChild(field); shell.appendChild(controls);
    var prediction = element(doc, "section", { className: "sa-prediction", "aria-labelledby": "sa-prediction-title-" + serial });
    prediction.appendChild(element(doc, "h4", { id: "sa-prediction-title-" + serial, text: "先预测：不要让枚举替你证明定理" }));
    var questionList = element(doc, "div"); prediction.appendChild(questionList);
    var actions = element(doc, "div", { className: "sa-actions" });
    var reveal = element(doc, "button", { type: "button", className: "sa-primary", text: "核对预测并揭晓" });
    var reset = element(doc, "button", { type: "button", text: "重置实验" });
    actions.appendChild(reveal); actions.appendChild(reset); prediction.appendChild(actions);
    var status = element(doc, "p", { className: "sa-status", "aria-live": "polite", "aria-atomic": "true" }); prediction.appendChild(status); shell.appendChild(prediction);
    var evidence = element(doc, "section", { className: "sa-evidence", hidden: true, "data-sa-serial": String(serial), "aria-label": "群作用与 Sylow 证书结果" }); shell.appendChild(evidence); root.replaceChildren(shell);

    function announce(message) { if (api && typeof api.announce === "function") api.announce(root, message); }
    function clearState() { state.predictions = Object.create(null); state.revealed = false; evidence.hidden = true; clear(evidence); }
    function renderQuestions(report) {
      clear(questionList);
      questionSpecs(report).forEach(function (question, index) {
        var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + question.prompt }));
        var options = element(doc, "div", { className: "sa-options", role: "group", "aria-label": question.prompt });
        question.options.forEach(function (option) {
          var button = element(doc, "button", { type: "button", "aria-pressed": state.predictions[question.key] === option ? "true" : "false", text: option });
          button.addEventListener("click", function () { state.predictions[question.key] = option; state.revealed = false; evidence.hidden = true; renderQuestions(report); }); options.appendChild(button);
        });
        fieldset.appendChild(options); questionList.appendChild(fieldset);
      });
    }
    function render() {
      var report = analyze(state.groupId); select.value = state.groupId; renderQuestions(report);
      if (state.revealed) { evidence.hidden = false; renderEvidence(doc, evidence, report, getGroup(state.groupId)); }
    }
    select.addEventListener("change", function () { state.groupId = select.value; clearState(); render(); status.textContent = "已切换群；请重新预测。"; status.className = "sa-status"; announce("已切换群作用预设，请重新预测。"); });
    reveal.addEventListener("click", function () {
      var report = analyze(state.groupId); var questions = questionSpecs(report);
      if (!questions.every(function (question) { return state.predictions[question.key] !== undefined; })) { status.textContent = "请先回答三道预测题。"; status.className = "sa-status sa-warn"; announce("还有预测题未回答。"); return; }
      var score = questions.reduce(function (total, question) { return total + (state.predictions[question.key] === question.answer ? 1 : 0); }, 0);
      state.revealed = true; evidence.hidden = false; renderEvidence(doc, evidence, report, getGroup(state.groupId));
      status.textContent = "预测得分 " + score + "/3；类方程和 Sylow 条件已显示，实际子群数仍只是此有限模型的证书。"; status.className = "sa-status " + (score === 3 ? "sa-pass" : "sa-warn"); announce("证书已揭晓，预测得分 " + score + "/3。");
    });
    reset.addEventListener("click", function () { state.groupId = "s3"; clearState(); render(); status.textContent = "已回到 S3；预测状态已清空。"; status.className = "sa-status"; announce("实验已重置。"); });
    render();
  }

  function assert(condition, message) { if (!condition) throw new Error("sylow-actions: " + message); }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    check(GROUPS.length === 3, "three finite group presets");
    var subgroupCases = 0;
    GROUPS.forEach(function (group) {
      group.values.forEach(function (_, index) {
        check(group.mul[group.identity][index] === index && group.mul[index][group.identity] === index, group.id + " identity");
        check(group.mul[index][group.inv[index]] === group.identity, group.id + " inverse");
      });
      var report = analyze(group.id); subgroupCases += report.subgroups.length;
      check(report.orbit.product === group.values.length, group.id + " orbit stabilizer");
      check(report.classes.reduce(function (sum, item) { return sum + item.size; }, 0) === group.values.length, group.id + " class partition");
      check(report.center.every(function (index) { return report.classes.filter(function (item) { return item.size === 1 && item.members.indexOf(index) >= 0; }).length === 1; }), group.id + " center classes");
      report.sylow.forEach(function (item) {
        check(item.actualCount > 0, group.id + " Sylow p=" + item.prime + " exists in finite enumeration");
        check(item.congruenceAndDivisibility, group.id + " Sylow p=" + item.prime + " constraints");
      });
    });
    check(analyze("s3").classes.map(function (item) { return item.size; }).sort(function (a, b) { return a - b; }).join(",") === "1,2,3", "S3 class sizes");
    check(analyze("a4").classes.map(function (item) { return item.size; }).sort(function (a, b) { return a - b; }).join(",") === "1,3,4,4", "A4 class sizes");
    check(analyze("d4").classes.map(function (item) { return item.size; }).sort(function (a, b) { return a - b; }).join(",") === "1,1,2,2,2", "D4 class sizes");
    check(analyze("s3").sylow.filter(function (item) { return item.prime === 2; })[0].actualCount === 3, "S3 n2");
    check(analyze("s3").sylow.filter(function (item) { return item.prime === 3; })[0].actualCount === 1, "S3 n3");
    check(analyze("a4").sylow.filter(function (item) { return item.prime === 2; })[0].actualCount === 1, "A4 n2");
    check(analyze("a4").sylow.filter(function (item) { return item.prime === 3; })[0].actualCount === 4, "A4 n3");
    check(analyze("d4").sylow[0].actualCount === 1, "D4 n2");
    check(enumerateSubgroups(getGroup("s3")).length === 6, "S3 subgroup enumeration count");
    check(enumerateSubgroups(getGroup("a4")).length === 10, "A4 subgroup enumeration count");
    check(enumerateSubgroups(getGroup("d4")).length === 10, "D4 subgroup enumeration count");
    return { checks: checks, groups: GROUPS.length, subgroupCases: subgroupCases };
  }

  return { GROUPS: GROUPS, getGroup: getGroup, orbitStabilizer: orbitStabilizer, conjugacyClasses: conjugacyClasses, classEquation: classEquation, enumerateSubgroups: enumerateSubgroups, sylowConstraints: sylowConstraints, analyze: analyze, mount: mount, selfTest: selfTest };
});

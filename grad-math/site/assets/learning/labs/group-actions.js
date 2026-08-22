(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("group-actions", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("group-actions self-test: PASS (" + report.checks + " checks, " + report.groups + " groups, " + report.subgroupCases + " subgroup cases)");
    } catch (error) {
      console.error("group-actions self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "group-actions-lab-styles";
  var INSTANCE = 0;

  function valueKey(value) {
    return Array.isArray(value) ? value.join(",") : String(value);
  }

  function composePermutation(left, right) {
    return left.map(function (_, index) { return left[right[index]]; });
  }

  function inversePermutation(permutation) {
    var inverse = new Array(permutation.length);
    permutation.forEach(function (value, index) { inverse[value] = index; });
    return inverse;
  }

  function makeGroup(spec) {
    var group = {
      id: spec.id,
      label: spec.label,
      values: spec.values,
      labels: spec.labels,
      identity: spec.identity,
      pointCount: spec.pointCount || 0,
      subgroups: spec.subgroups || []
    };
    group.indexOf = function (value) {
      var key = valueKey(value);
      for (var index = 0; index < group.values.length; index += 1) {
        if (valueKey(group.values[index]) === key) return index;
      }
      return -1;
    };
    group.mul = group.values.map(function (left) {
      return group.values.map(function (right) {
        return group.indexOf(spec.multiply(left, right));
      });
    });
    group.inv = group.values.map(function (value) { return group.indexOf(spec.inverse(value)); });
    return group;
  }

  var GROUPS = [
    makeGroup({
      id: "c4",
      label: "C4：旋转四次回到原位",
      values: [0, 1, 2, 3],
      labels: ["0", "1", "2", "3"],
      identity: 0,
      multiply: function (left, right) { return (left + right) % 4; },
      inverse: function (value) { return (4 - value) % 4; },
      subgroups: [
        { id: "half-turn", label: "H={0,2}（半圈子群）", elements: [0, 2], quotient: "C2" },
        { id: "trivial", label: "{0}（平凡子群）", elements: [0], quotient: "C4" },
        { id: "whole", label: "C4（整个群）", elements: [0, 1, 2, 3], quotient: "1" }
      ]
    }),
    makeGroup({
      id: "v4",
      label: "V4：四元 Klein 群",
      values: [0, 1, 2, 3],
      labels: ["e", "a", "b", "c"],
      identity: 0,
      multiply: function (left, right) { return left ^ right; },
      inverse: function (value) { return value; },
      subgroups: [
        { id: "a-line", label: "H={e,a}", elements: [0, 1], quotient: "C2" },
        { id: "b-line", label: "H={e,b}", elements: [0, 2], quotient: "C2" },
        { id: "trivial", label: "{e}（平凡子群）", elements: [0], quotient: "V4" },
        { id: "whole", label: "V4（整个群）", elements: [0, 1, 2, 3], quotient: "1" }
      ]
    }),
    makeGroup({
      id: "s3",
      label: "S3：三个对象的置换群",
      values: [
        [0, 1, 2],
        [1, 0, 2],
        [2, 1, 0],
        [0, 2, 1],
        [1, 2, 0],
        [2, 0, 1]
      ],
      labels: ["e", "s=(12)", "t=(13)", "u=(23)", "r=(123)", "r2=(132)"],
      identity: 0,
      pointCount: 3,
      multiply: composePermutation,
      inverse: inversePermutation,
      subgroups: [
        { id: "transposition", label: "H=<s>={e,(12)}", elements: [0, 1], quotient: null },
        { id: "a3", label: "A3=<r>={e,r,r2}", elements: [0, 4, 5], quotient: "C2" },
        { id: "trivial", label: "{e}（平凡子群）", elements: [0], quotient: "S3" },
        { id: "whole", label: "S3（整个群）", elements: [0, 1, 2, 3, 4, 5], quotient: "1" }
      ]
    })
  ];

  var STYLE_TEXT = [
    ".ga-lab{--ga-blue:var(--accent,#315f9d);--ga-gold:var(--cl-gold,#9b6a12);--ga-green:var(--cl-green,#39734d);--ga-red:var(--cl-red,#b64335);--ga-muted:var(--fg-soft,#6b6557);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".ga-lab *,.ga-lab *::before,.ga-lab *::after{box-sizing:border-box}.ga-lab [hidden]{display:none!important}",
    ".ga-lab h3,.ga-lab h4{margin:0;color:var(--fg);letter-spacing:0}.ga-lab h3{font-size:1.18rem}.ga-lab h4{font-size:1rem}.ga-lab p{margin:7px 0}.ga-lab .ga-intro,.ga-lab .ga-note,.ga-lab .ga-status{color:var(--ga-muted);font-size:13px;line-height:1.7}",
    ".ga-lab .ga-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0}.ga-lab .ga-field{display:grid;gap:5px;min-width:0}.ga-lab .ga-field label{color:var(--ga-muted);font-size:12.5px;font-weight:750}.ga-lab select{width:100%;min-height:44px;padding:7px 9px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35}.ga-lab button{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;font:inherit;line-height:1.35;overflow-wrap:anywhere}.ga-lab button:hover{border-color:var(--ga-blue)}.ga-lab button:focus-visible,.ga-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.ga-lab button[aria-pressed=true],.ga-lab button.ga-primary{border-color:var(--ga-blue);background:var(--ga-blue);color:var(--bg);font-weight:750}",
    ".ga-lab .ga-prediction{margin:14px 0;padding:12px;border-left:3px solid var(--ga-gold);background:var(--block-bg,var(--bg))}.ga-lab .ga-prediction h4{margin-bottom:6px}.ga-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border);background:var(--bg)}.ga-lab legend{max-width:100%;padding:0 3px;color:var(--fg);font-size:13px;font-weight:700;line-height:1.5}.ga-lab .ga-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.ga-lab .ga-options button{font-size:12px}.ga-lab .ga-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.ga-lab .ga-actions>*{flex:1 1 170px}.ga-lab .ga-status{min-height:1.7em;margin-top:9px;font-weight:700}.ga-lab .ga-pass{color:var(--ga-green)}.ga-lab .ga-warn{color:var(--ga-red)}",
    ".ga-lab .ga-evidence{display:grid;gap:12px;margin-top:15px}.ga-lab .ga-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px}.ga-lab .ga-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.ga-lab .ga-metric:nth-child(3n+1){border-color:var(--ga-blue)}.ga-lab .ga-metric:nth-child(3n+2){border-color:var(--ga-gold)}.ga-lab .ga-metric:nth-child(3n){border-color:var(--ga-green)}.ga-lab .ga-metric span{display:block;color:var(--ga-muted);font-size:11px}.ga-lab .ga-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".ga-lab .ga-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch}.ga-lab .ga-svg{display:block;width:100%;min-width:560px;height:auto;color:var(--fg)}.ga-lab .ga-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.ga-lab .ga-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.ga-lab table{width:100%;min-width:620px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.ga-lab caption{padding:0 0 7px;text-align:left;color:var(--ga-muted);font-size:12px;font-weight:700}.ga-lab th,.ga-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;white-space:nowrap}.ga-lab th{color:var(--ga-muted);font-size:11px}.ga-lab .ga-certificate{padding:10px 12px;border-left:3px solid var(--ga-green);background:var(--block-bg,var(--bg));font-size:13px;line-height:1.7}.ga-lab .ga-certificate.ga-fail{border-left-color:var(--ga-red)}",
    "@media(max-width:680px){.ga-lab .ga-controls{grid-template-columns:minmax(0,1fr)}.ga-lab .ga-options{grid-template-columns:minmax(0,1fr)}.ga-lab .ga-frame{padding:5px}.ga-lab table{font-size:11.5px}}@media(prefers-reduced-motion:reduce){.ga-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function getGroup(id) {
    for (var index = 0; index < GROUPS.length; index += 1) if (GROUPS[index].id === id) return GROUPS[index];
    return GROUPS[0];
  }

  function getSubgroup(group, id) {
    for (var index = 0; index < group.subgroups.length; index += 1) if (group.subgroups[index].id === id) return group.subgroups[index];
    return group.subgroups[0];
  }

  function sortedUnique(values) {
    var seen = Object.create(null);
    return values.filter(function (value) {
      var key = String(value);
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function sameSet(left, right) {
    var a = left.slice().sort(function (x, y) { return x - y; });
    var b = right.slice().sort(function (x, y) { return x - y; });
    return a.length === b.length && a.every(function (value, index) { return value === b[index]; });
  }

  function cosetPartition(group, subgroup) {
    var left = [];
    var right = [];
    var leftSeen = Object.create(null);
    var rightSeen = Object.create(null);
    for (var representative = 0; representative < group.values.length; representative += 1) {
      if (!leftSeen[representative]) {
        var leftMembers = sortedUnique(subgroup.elements.map(function (member) { return group.mul[representative][member]; }));
        left.push({ representative: representative, members: leftMembers });
        leftMembers.forEach(function (member) { leftSeen[member] = true; });
      }
      if (!rightSeen[representative]) {
        var rightMembers = sortedUnique(subgroup.elements.map(function (member) { return group.mul[member][representative]; }));
        right.push({ representative: representative, members: rightMembers });
        rightMembers.forEach(function (member) { rightSeen[member] = true; });
      }
    }
    return { left: left, right: right };
  }

  function normalityCertificate(group, subgroup, partition) {
    for (var element = 0; element < group.values.length; element += 1) {
      var conjugated = subgroup.elements.map(function (member) {
        return group.mul[group.mul[element][member]][group.inv[element]];
      });
      if (!sameSet(conjugated, subgroup.elements)) {
        var leftCoset = partition.left.filter(function (coset) { return coset.members.indexOf(element) >= 0; })[0];
        var rightCoset = partition.right.filter(function (coset) { return coset.members.indexOf(element) >= 0; })[0];
        return { normal: false, witness: element, leftCoset: leftCoset.members, rightCoset: rightCoset.members };
      }
    }
    return { normal: true, witness: null, leftCoset: null, rightCoset: null };
  }

  function quotientCertificate(group, subgroup, partition, normal) {
    if (!normal) return { available: false, wellDefined: false, table: [], cosetLabels: [] };
    var cosetOf = new Array(group.values.length);
    partition.left.forEach(function (coset, index) {
      coset.members.forEach(function (member) { cosetOf[member] = index; });
    });
    var table = partition.left.map(function (leftCoset) {
      return partition.left.map(function (rightCoset) {
        return cosetOf[group.mul[leftCoset.representative][rightCoset.representative]];
      });
    });
    var wellDefined = partition.left.every(function (leftCoset, leftIndex) {
      return partition.left.every(function (rightCoset, rightIndex) {
        var target = table[leftIndex][rightIndex];
        return leftCoset.members.every(function (leftMember) {
          return rightCoset.members.every(function (rightMember) {
            return cosetOf[group.mul[leftMember][rightMember]] === target;
          });
        });
      });
    });
    return {
      available: true,
      wellDefined: wellDefined,
      table: table,
      cosetLabels: partition.left.map(function (coset) { return "C" + coset.representative; })
    };
  }

  function analyze(groupId, subgroupId) {
    var group = getGroup(groupId);
    var subgroup = getSubgroup(group, subgroupId);
    var partition = cosetPartition(group, subgroup);
    var normality = normalityCertificate(group, subgroup, partition);
    var quotient = quotientCertificate(group, subgroup, partition, normality.normal);
    return {
      groupId: group.id,
      groupLabel: group.label,
      subgroupId: subgroup.id,
      subgroupLabel: subgroup.label,
      groupOrder: group.values.length,
      subgroupOrder: subgroup.elements.length,
      index: partition.left.length,
      lagrange: group.values.length === subgroup.elements.length * partition.left.length,
      leftCosets: partition.left,
      rightCosets: partition.right,
      normal: normality.normal,
      normalWitness: normality.witness,
      normalWitnessLeft: normality.leftCoset,
      normalWitnessRight: normality.rightCoset,
      quotient: quotient,
      quotientName: subgroup.quotient
    };
  }

  function installStyles(doc) {
    if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
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

  function element(doc, tag, attributes, children) {
    return appendChildren(setAttributes(doc.createElement(tag), attributes), children, doc);
  }

  function svgElement(doc, tag, attributes, children) {
    return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attributes), children, doc);
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function labelMembers(group, members) {
    return members.map(function (member) { return group.labels[member]; }).join(" · ");
  }

  function renderCosetSvg(doc, report, serial) {
    var svg = svgElement(doc, "svg", { className: "ga-svg", viewBox: "0 0 700 310", role: "img", "aria-labelledby": "ga-svg-title-" + serial + " ga-svg-desc-" + serial });
    svg.appendChild(svgElement(doc, "title", { id: "ga-svg-title-" + serial }, "左陪集与右陪集的有限分块图"));
    svg.appendChild(svgElement(doc, "desc", { id: "ga-svg-desc-" + serial }, "上半部分显示左陪集，下半部分显示右陪集；每个彩色方框是一个大小相同的有限陪集。"));
    var columns = Math.min(3, Math.max(1, report.leftCosets.length));
    var blockWidth = 210;
    var blockHeight = 62;
    function drawRow(cosets, y, title, className) {
      svg.appendChild(svgElement(doc, "text", { x: "16", y: String(y - 10), className: "ga-svg-title" }, title));
      cosets.forEach(function (coset, index) {
        var x = 16 + (index % columns) * blockWidth;
        var row = Math.floor(index / columns);
        var top = y + row * (blockHeight + 12);
        svg.appendChild(svgElement(doc, "rect", { x: String(x), y: String(top), width: String(blockWidth - 16), height: String(blockHeight), rx: "5", className: className }));
        svg.appendChild(svgElement(doc, "text", { x: String(x + 9), y: String(top + 22), className: "ga-svg-label" }, "代表 " + report.groupLabel.split("：")[0] + "[" + coset.representative + "]"));
        svg.appendChild(svgElement(doc, "text", { x: String(x + 9), y: String(top + 45), className: "ga-svg-members" }, labelMembers(getGroup(report.groupId), coset.members)));
      });
    }
    drawRow(report.leftCosets, 29, "左陪集 aH", "ga-left-coset");
    var secondY = 170 + Math.ceil(report.leftCosets.length / columns) * 5;
    drawRow(report.rightCosets, secondY, "右陪集 Ha", "ga-right-coset");
    return svg;
  }

  function renderEvidence(doc, evidence, report, group) {
    clear(evidence);
    evidence.appendChild(element(doc, "div", { className: "ga-metrics" }, [
      element(doc, "div", { className: "ga-metric" }, [element(doc, "span", { text: "群阶 |G|" }), element(doc, "strong", { text: String(report.groupOrder) })]),
      element(doc, "div", { className: "ga-metric" }, [element(doc, "span", { text: "子群阶 |H|" }), element(doc, "strong", { text: String(report.subgroupOrder) })]),
      element(doc, "div", { className: "ga-metric" }, [element(doc, "span", { text: "指数 [G:H]" }), element(doc, "strong", { text: String(report.index) })]),
      element(doc, "div", { className: "ga-metric" }, [element(doc, "span", { text: "Lagrange 证书" }), element(doc, "strong", { text: report.lagrange ? "通过" : "失败" })])
    ]));
    var frame = element(doc, "div", { className: "ga-frame" });
    frame.appendChild(renderCosetSvg(doc, report, evidence.getAttribute("data-ga-serial")));
    evidence.appendChild(frame);
    var tableWrap = element(doc, "div", { className: "ga-table-wrap" });
    var table = element(doc, "table");
    table.appendChild(element(doc, "caption", { text: "有限操作账本：左/右陪集与商结构" }));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
      element(doc, "th", { scope: "col", text: "项目" }), element(doc, "th", { scope: "col", text: "结果" }), element(doc, "th", { scope: "col", text: "证书读法" })
    ])));
    var rows = [
      ["左陪集", report.leftCosets.map(function (coset) { return "{" + labelMembers(group, coset.members) + "}"; }).join("；"), "互不相交且覆盖 G"],
      ["右陪集", report.rightCosets.map(function (coset) { return "{" + labelMembers(group, coset.members) + "}"; }).join("；"), report.normal ? "与左陪集一致" : "与左陪集不必一致"],
      ["正规性", report.normal ? "是" : "否", report.normal ? "所有 gHg⁻¹=H" : "见 witness " + group.labels[report.normalWitness] + ""],
      ["商群", report.quotient.available && report.quotient.wellDefined ? (report.quotientName || ("阶 " + report.index)) : "不存在群商", report.quotient.available ? (report.quotient.wellDefined ? "陪集乘法良定义" : "良定义检查失败") : "H 非正规，只有陪集集合"]
    ];
    var body = element(doc, "tbody");
    rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, row.map(function (value) { return element(doc, "td", { text: value }); }))); });
    table.appendChild(body);
    tableWrap.appendChild(table);
    evidence.appendChild(tableWrap);
    var certificateText = report.normal && report.quotient.wellDefined
      ? "商群证书通过：每个余类用一个代表元相乘，结果仍落在唯一余类中。这里的“通过”是该有限模型的可计算证书；正规子群才是一般商群定理的假设。"
      : "商群证书停止：发现左陪集与右陪集不同，因此当前 H 不是正规子群；可以保留陪集分划，但不能把它当作群。";
    evidence.appendChild(element(doc, "div", { className: "ga-certificate " + (report.normal ? "" : "ga-fail") }, certificateText));
  }

  function questionSpecs(report) {
    var blockOptions = sortedUnique([report.index, report.subgroupOrder, report.groupOrder]).map(String);
    var normalOptions = ["是，H 正规", "否，H 不正规"];
    var quotientOptions = ["可以定义群商", "只能得到陪集集合"];
    return [
      { key: "blocks", prompt: "这组 H 会把 G 分成几块等大的左陪集？", options: blockOptions, answer: String(report.index) },
      { key: "normal", prompt: "这个 H 是否正规？", options: normalOptions, answer: report.normal ? normalOptions[0] : normalOptions[1] },
      { key: "quotient", prompt: "是否能在陪集上定义商群乘法？", options: quotientOptions, answer: report.normal ? quotientOptions[0] : quotientOptions[1] }
    ];
  }

  function mount(root, api) {
    var doc = root.ownerDocument || (typeof document !== "undefined" ? document : null);
    if (!doc) return;
    installStyles(doc);
    root.classList.add("ga-lab");
    INSTANCE += 1;
    var serial = INSTANCE;
    var state = { groupId: "c4", subgroupId: "half-turn", predictions: Object.create(null), revealed: false };
    var shell = element(doc, "div", { className: "ga-shell" });
    shell.appendChild(element(doc, "h3", { text: "有限群证书台：陪集、正规性与商群" }));
    shell.appendChild(element(doc, "p", { className: "ga-intro", text: "选择一个小群和子群；所有乘法、逆元与陪集都由固定的离散表逐项计算。先预测，再揭晓证书。" }));
    var controls = element(doc, "div", { className: "ga-controls" });
    var groupField = element(doc, "div", { className: "ga-field" });
    var groupLabel = element(doc, "label", { htmlFor: "ga-group-" + serial, text: "有限群" });
    var groupSelect = element(doc, "select", { id: "ga-group-" + serial, "aria-label": "选择有限群" });
    GROUPS.forEach(function (group) { groupSelect.appendChild(element(doc, "option", { value: group.id, text: group.label })); });
    groupField.appendChild(groupLabel); groupField.appendChild(groupSelect);
    var subgroupField = element(doc, "div", { className: "ga-field" });
    var subgroupLabel = element(doc, "label", { htmlFor: "ga-subgroup-" + serial, text: "子群 H" });
    var subgroupSelect = element(doc, "select", { id: "ga-subgroup-" + serial, "aria-label": "选择子群" });
    subgroupField.appendChild(subgroupLabel); subgroupField.appendChild(subgroupSelect);
    controls.appendChild(groupField); controls.appendChild(subgroupField); shell.appendChild(controls);

    var prediction = element(doc, "section", { className: "ga-prediction", "aria-labelledby": "ga-prediction-title-" + serial });
    prediction.appendChild(element(doc, "h4", { id: "ga-prediction-title-" + serial, text: "先预测：把证书写在揭晓前" }));
    var questionList = element(doc, "div");
    prediction.appendChild(questionList);
    var actionRow = element(doc, "div", { className: "ga-actions" });
    var revealButton = element(doc, "button", { type: "button", className: "ga-primary", text: "核对预测并揭晓" });
    var resetButton = element(doc, "button", { type: "button", text: "重置实验" });
    actionRow.appendChild(revealButton); actionRow.appendChild(resetButton); prediction.appendChild(actionRow);
    var status = element(doc, "p", { className: "ga-status", "aria-live": "polite", "aria-atomic": "true" });
    prediction.appendChild(status); shell.appendChild(prediction);

    var evidence = element(doc, "section", { className: "ga-evidence", hidden: true, "data-ga-serial": String(serial), "aria-label": "有限群证书结果" });
    shell.appendChild(evidence);
    root.replaceChildren(shell);

    function announce(message) {
      if (api && typeof api.announce === "function") api.announce(root, message);
    }

    function resetPredictions() {
      state.predictions = Object.create(null);
      state.revealed = false;
      evidence.hidden = true;
      clear(evidence);
    }

    function renderSubgroups() {
      var group = getGroup(state.groupId);
      clear(subgroupSelect);
      group.subgroups.forEach(function (subgroup) { subgroupSelect.appendChild(element(doc, "option", { value: subgroup.id, text: subgroup.label })); });
      subgroupSelect.value = state.subgroupId;
    }

    function renderQuestions(report) {
      clear(questionList);
      questionSpecs(report).forEach(function (question, questionIndex) {
        var fieldset = element(doc, "fieldset");
        fieldset.appendChild(element(doc, "legend", { text: (questionIndex + 1) + ". " + question.prompt }));
        var options = element(doc, "div", { className: "ga-options", role: "group", "aria-label": question.prompt });
        question.options.forEach(function (option) {
          var button = element(doc, "button", { type: "button", "aria-pressed": state.predictions[question.key] === option ? "true" : "false", text: option });
          button.addEventListener("click", function () {
            state.predictions[question.key] = option;
            state.revealed = false;
            evidence.hidden = true;
            renderQuestions(report);
          });
          options.appendChild(button);
        });
        fieldset.appendChild(options); questionList.appendChild(fieldset);
      });
    }

    function render() {
      var group = getGroup(state.groupId);
      var report = analyze(state.groupId, state.subgroupId);
      groupSelect.value = state.groupId;
      renderSubgroups();
      renderQuestions(report);
      if (state.revealed) {
        evidence.hidden = false;
        renderEvidence(doc, evidence, report, group);
      }
    }

    groupSelect.addEventListener("change", function () {
      state.groupId = groupSelect.value;
      state.subgroupId = getGroup(state.groupId).subgroups[0].id;
      resetPredictions(); render();
      status.textContent = "已切换模型；请重新预测。"; status.className = "ga-status";
      announce("已切换有限群模型，请重新预测。");
    });
    subgroupSelect.addEventListener("change", function () {
      state.subgroupId = subgroupSelect.value;
      resetPredictions(); render();
      status.textContent = "已切换子群；请重新预测正规性与商群条件。"; status.className = "ga-status";
      announce("已切换子群，请重新预测。");
    });
    revealButton.addEventListener("click", function () {
      var report = analyze(state.groupId, state.subgroupId);
      var questions = questionSpecs(report);
      var answered = questions.every(function (question) { return state.predictions[question.key] !== undefined; });
      if (!answered) {
        status.textContent = "请先回答三道预测题，再揭晓有限证书。"; status.className = "ga-status ga-warn";
        announce("还有预测题未回答。");
        return;
      }
      var score = questions.reduce(function (total, question) { return total + (state.predictions[question.key] === question.answer ? 1 : 0); }, 0);
      state.revealed = true; evidence.hidden = false;
      renderEvidence(doc, evidence, report, getGroup(state.groupId));
      status.textContent = "预测得分 " + score + "/3；现在把枚举证书与一般定理的假设分开阅读。"; status.className = "ga-status " + (score === 3 ? "ga-pass" : "ga-warn");
      announce("证书已揭晓，预测得分 " + score + "/3。");
    });
    resetButton.addEventListener("click", function () {
      state.groupId = "c4"; state.subgroupId = "half-turn"; resetPredictions(); render();
      status.textContent = "已回到 C4 与 H={0,2}；预测状态已清空。"; status.className = "ga-status";
      announce("实验已重置。");
    });
    render();
  }

  function assert(condition, message) {
    if (!condition) throw new Error("group-actions: " + message);
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    check(GROUPS.length === 3, "three exact group presets");
    var subgroupCases = 0;
    GROUPS.forEach(function (group) {
      check(group.mul.length === group.values.length, group.id + " multiplication rows");
      group.values.forEach(function (value, index) {
        check(group.mul[group.identity][index] === index && group.mul[index][group.identity] === index, group.id + " identity law");
        check(group.mul[index][group.inv[index]] === group.identity, group.id + " inverse law");
      });
      group.subgroups.forEach(function (subgroup) {
        subgroupCases += 1;
        var report = analyze(group.id, subgroup.id);
        check(report.lagrange, group.id + "/" + subgroup.id + " Lagrange product");
        check(report.leftCosets.every(function (coset) { return coset.members.length === subgroup.elements.length; }), group.id + "/" + subgroup.id + " left coset size");
        check(report.rightCosets.every(function (coset) { return coset.members.length === subgroup.elements.length; }), group.id + "/" + subgroup.id + " right coset size");
        check(report.leftCosets.reduce(function (all, coset) { return all.concat(coset.members); }, []).sort().join(",") === group.values.map(function (_, index) { return index; }).sort().join(","), group.id + "/" + subgroup.id + " partition");
      });
    });
    var c4 = analyze("c4", "half-turn");
    check(c4.normal && c4.quotient.available && c4.quotient.wellDefined, "C4 half-turn quotient certificate");
    check(c4.leftCosets.length === 2 && c4.leftCosets[0].members.length === 2, "C4 coset count and size");
    var v4 = analyze("v4", "a-line");
    check(v4.normal && v4.quotient.wellDefined, "V4 subgroup normality");
    var s3Bad = analyze("s3", "transposition");
    check(!s3Bad.normal && !s3Bad.quotient.available, "S3 transposition blocks quotient");
    check(s3Bad.normalWitness !== null && !sameSet(s3Bad.normalWitnessLeft, s3Bad.normalWitnessRight), "S3 left/right witness differs");
    var s3Good = analyze("s3", "a3");
    check(s3Good.normal && s3Good.quotient.available && s3Good.quotient.wellDefined, "S3 A3 quotient certificate");
    return { checks: checks, groups: GROUPS.length, subgroupCases: subgroupCases };
  }

  return {
    GROUPS: GROUPS,
    getGroup: getGroup,
    cosetPartition: cosetPartition,
    analyze: analyze,
    quotientCertificate: quotientCertificate,
    mount: mount,
    selfTest: selfTest
  };
});

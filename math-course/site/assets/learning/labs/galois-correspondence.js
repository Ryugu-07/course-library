(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("galois-correspondence", exported.mount);
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
        "galois-correspondence self-test: PASS (" +
          report.checks +
          " checks, " +
          report.examples +
          " examples, " +
          report.subgroups +
          " subgroups)"
      );
    } catch (error) {
      console.error("galois-correspondence self-test: FAIL\n" + error.stack);
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

    var STYLE_ID = "cl-galois-correspondence-styles";
    var SERIAL = 0;

    var V4_ELEMENTS = [
      { id: "e", label: "e", action: "(a,b) -> (a,b)", order: 1 },
      { id: "s", label: "sigma", action: "(a,b) -> (-a,b)", order: 2 },
      { id: "t", label: "tau", action: "(a,b) -> (a,-b)", order: 2 },
      { id: "st", label: "sigma tau", action: "(a,b) -> (-a,-b)", order: 2 }
    ];

    var S3_ELEMENTS = [
      { id: "e", label: "e", action: "e", order: 1 },
      { id: "r", label: "r=(123)", action: "(123)", order: 3 },
      { id: "r2", label: "r^2=(132)", action: "(132)", order: 3 },
      { id: "t12", label: "t12=(12)", action: "(12)", order: 2 },
      { id: "t13", label: "t13=(13)", action: "(13)", order: 2 },
      { id: "t23", label: "t23=(23)", action: "(23)", order: 2 }
    ];

    var EXAMPLES = [
      {
        id: "v4",
        label: "V4",
        title: "V4 example",
        baseField: "Q",
        extensionField: "K = Q(sqrt(2), sqrt(3))",
        fieldDegree: 4,
        groupElements: V4_ELEMENTS,
        defaultSubgroup: "s",
        subgroups: [
          {
            id: "trivial",
            label: "{e}",
            elements: ["e"],
            order: 1,
            index: 4,
            fixedField: "K = Q(sqrt(2), sqrt(3))",
            graphField: "K",
            fieldDegree: 4,
            normal: true,
            quotient: "V4",
            reason: "V4 is abelian; every subgroup is normal."
          },
          {
            id: "s",
            label: "<sigma>",
            elements: ["e", "s"],
            order: 2,
            index: 2,
            fixedField: "Q(sqrt(3))",
            graphField: "Q(sqrt(3))",
            fieldDegree: 2,
            normal: true,
            quotient: "C2",
            reason: "V4 is abelian; every subgroup is normal."
          },
          {
            id: "t",
            label: "<tau>",
            elements: ["e", "t"],
            order: 2,
            index: 2,
            fixedField: "Q(sqrt(2))",
            graphField: "Q(sqrt(2))",
            fieldDegree: 2,
            normal: true,
            quotient: "C2",
            reason: "V4 is abelian; every subgroup is normal."
          },
          {
            id: "st",
            label: "<sigma tau>",
            elements: ["e", "st"],
            order: 2,
            index: 2,
            fixedField: "Q(sqrt(6))",
            graphField: "Q(sqrt(6))",
            fieldDegree: 2,
            normal: true,
            quotient: "C2",
            reason: "V4 is abelian; every subgroup is normal."
          },
          {
            id: "whole",
            label: "V4",
            elements: ["e", "s", "t", "st"],
            order: 4,
            index: 1,
            fixedField: "Q",
            graphField: "F = Q",
            fieldDegree: 1,
            normal: true,
            quotient: "1",
            reason: "The whole group is normal."
          }
        ],
        latticeEdges: [
          ["whole", "s"],
          ["whole", "t"],
          ["whole", "st"],
          ["s", "trivial"],
          ["t", "trivial"],
          ["st", "trivial"]
        ]
      },
      {
        id: "s3",
        label: "S3",
        title: "S3 example",
        baseField: "Q",
        extensionField: "K = Q(alpha, omega)",
        fieldDegree: 6,
        groupElements: S3_ELEMENTS,
        defaultSubgroup: "a3",
        subgroups: [
          {
            id: "trivial",
            label: "{e}",
            elements: ["e"],
            order: 1,
            index: 6,
            fixedField: "K = Q(alpha, omega)",
            graphField: "K",
            fieldDegree: 6,
            normal: true,
            quotient: "S3",
            reason: "The trivial subgroup is normal."
          },
          {
            id: "t12",
            label: "<t12>",
            elements: ["e", "t12"],
            order: 2,
            index: 3,
            fixedField: "Q(alpha_3) = Q(omega^2 alpha)",
            graphField: "Q(alpha_3)",
            fieldDegree: 3,
            normal: false,
            quotient: null,
            reason: "r <t12> r^(-1) = <t23> != <t12>."
          },
          {
            id: "t13",
            label: "<t13>",
            elements: ["e", "t13"],
            order: 2,
            index: 3,
            fixedField: "Q(alpha_2) = Q(omega alpha)",
            graphField: "Q(alpha_2)",
            fieldDegree: 3,
            normal: false,
            quotient: null,
            reason: "r <t13> r^(-1) = <t12> != <t13>."
          },
          {
            id: "t23",
            label: "<t23>",
            elements: ["e", "t23"],
            order: 2,
            index: 3,
            fixedField: "Q(alpha_1) = Q(alpha)",
            graphField: "Q(alpha_1)",
            fieldDegree: 3,
            normal: false,
            quotient: null,
            reason: "r <t23> r^(-1) = <t13> != <t23>."
          },
          {
            id: "a3",
            label: "A3=<r>",
            elements: ["e", "r", "r2"],
            order: 3,
            index: 2,
            fixedField: "Q(omega)",
            graphField: "Q(omega)",
            fieldDegree: 2,
            normal: true,
            quotient: "C2",
            reason: "A3 = ker(sign), so S3/A3 is C2."
          },
          {
            id: "whole",
            label: "S3",
            elements: ["e", "r", "r2", "t12", "t13", "t23"],
            order: 6,
            index: 1,
            fixedField: "Q",
            graphField: "F = Q",
            fieldDegree: 1,
            normal: true,
            quotient: "1",
            reason: "The whole group is normal."
          }
        ],
        latticeEdges: [
          ["whole", "t12"],
          ["whole", "t13"],
          ["whole", "t23"],
          ["whole", "a3"],
          ["t12", "trivial"],
          ["t13", "trivial"],
          ["t23", "trivial"],
          ["a3", "trivial"]
        ]
      }
    ];

    var QUESTIONS = [
      {
        key: "v4-field",
        prompt: "V4: K^<sigma> 应该是哪一个固定域？",
        options: [
          { id: "sqrt2", label: "Q(sqrt(2))" },
          { id: "sqrt3", label: "Q(sqrt(3))" },
          { id: "sqrt6", label: "Q(sqrt(6))" }
        ],
        answer: "sqrt3"
      },
      {
        key: "s3-a3",
        prompt: "S3: A3 的指数和固定域是哪一组？",
        options: [
          { id: "three-alpha", label: "3 与 Q(alpha)" },
          { id: "two-omega", label: "2 与 Q(omega)" },
          { id: "six-q", label: "6 与 Q" }
        ],
        answer: "two-omega"
      },
      {
        key: "s3-transposition",
        prompt: "S3: 对换子群 <t12> 的正规性与商群？",
        options: [
          { id: "normal-c2", label: "正规，商群 C2" },
          { id: "not-normal", label: "不正规，不存在群商" },
          { id: "normal-c3", label: "正规，商群 C3" }
        ],
        answer: "not-normal"
      },
      {
        key: "boundary",
        prompt: "E=Q(cuberoot(2))/Q 为什么不能直接套用对应？",
        options: [
          { id: "galois", label: "它是 Galois，群阶为 3" },
          { id: "normal-closure", label: "它不正规，应先取正规闭包" },
          { id: "inseparable", label: "它不可分" }
        ],
        answer: "normal-closure"
      }
    ];

    var STYLE_TEXT = [
      ".cl-galois{--gc-blue:var(--cl-blue,#315f9d);--gc-gold:var(--cl-gold,#9b6a12);--gc-green:var(--cl-green,#39734d);--gc-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
      "html[data-theme=\"dark\"] .cl-galois{--gc-blue:#83c8ff;--gc-gold:#e2b458;--gc-green:#72bd8b;--gc-red:#f08c7d;}",
      ".cl-galois *,.cl-galois *::before,.cl-galois *::after{box-sizing:border-box}.cl-galois [hidden]{display:none!important}",
      ".cl-galois h3,.cl-galois h4{margin:0;color:var(--fg);letter-spacing:0}.cl-galois h3{font-size:1.18rem}.cl-galois h4{margin-top:16px;font-size:1rem}",
      ".cl-galois button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.cl-galois button:hover{border-color:var(--accent)}.cl-galois button[aria-pressed=\"true\"],.cl-galois button.gc-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.cl-galois button:disabled{cursor:not-allowed;opacity:.55}.cl-galois button:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
      ".cl-galois fieldset{min-width:0;margin:0;padding:0;border:0}.cl-galois legend{margin-bottom:8px;color:var(--fg);font-weight:750}.gc-shell{display:grid;gap:14px}.gc-intro,.gc-note,.gc-feedback{color:var(--fg-soft);font-size:13px;line-height:1.7}.gc-prediction-box,.gc-control-box{padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.gc-question{margin:10px 0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.gc-question legend{max-width:100%;color:var(--fg-soft);font-size:13px;line-height:1.5}.gc-option-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.gc-option-grid button{font-size:12px}.gc-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.gc-actions>*{flex:1 1 170px}.gc-feedback{min-height:2em;margin:9px 0 0;font-weight:700}.gc-pass{color:var(--gc-green)}.gc-warn{color:var(--gc-red)}",
      ".gc-layout{display:grid;grid-template-columns:minmax(220px,.72fr) minmax(0,1.28fr);gap:14px;align-items:start;min-width:0}.gc-layout>div{min-width:0}.gc-preset-grid,.gc-subgroup-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.gc-preset-grid button,.gc-subgroup-grid button{font-size:12px}.gc-subgroup-grid button small{display:block;margin-top:3px;color:var(--fg-soft);font-size:10.5px;line-height:1.35}.gc-subgroup-grid button[aria-pressed=\"true\"] small{color:inherit}.gc-stage-frame{min-width:0;padding:10px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden}.gc-stage-heading{display:flex;flex-wrap:wrap;justify-content:space-between;gap:7px;align-items:baseline}.gc-stage-heading span{color:var(--fg-soft);font-size:12px}.gc-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:8px;margin:11px 0}.gc-metric{min-width:0;padding:8px;border-top:2px solid var(--border);background:var(--bg)}.gc-metric:nth-child(1),.gc-metric:nth-child(4){border-top-color:var(--gc-blue)}.gc-metric:nth-child(2),.gc-metric:nth-child(5){border-top-color:var(--gc-gold)}.gc-metric:nth-child(3){border-top-color:var(--gc-green)}.gc-metric span{display:block;color:var(--fg-soft);font-size:11px;line-height:1.4}.gc-metric strong{display:block;margin-top:3px;font-size:14px;line-height:1.45;overflow-wrap:anywhere}",
      ".gc-certificate{margin:10px 0;padding:10px 12px;border-left:3px solid var(--gc-green);background:var(--bg);font-size:13px;line-height:1.7}.gc-certificate.gc-not-normal{border-left-color:var(--gc-red)}.gc-certificate p{margin:4px 0}.gc-certificate strong{color:var(--fg)}.gc-graph-frame{max-width:100%;margin-top:12px;padding:7px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch}.gc-svg{display:block;width:100%;min-width:620px;height:auto;color:var(--fg)}.gc-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.gc-svg .gc-edge{stroke:var(--border);stroke-width:1.4;fill:none}.gc-svg .gc-pair{stroke:var(--gc-gold);stroke-width:1;stroke-dasharray:4 4;stroke-opacity:.55}.gc-svg .gc-selected-pair{stroke:var(--gc-gold);stroke-width:2;stroke-opacity:1}.gc-svg .gc-node{fill:var(--bg);stroke:var(--border);stroke-width:1.3}.gc-svg .gc-node-selected{fill:color-mix(in srgb,var(--gc-blue) 16%,var(--bg));stroke:var(--gc-blue);stroke-width:2}.gc-svg .gc-title{font-size:13px;font-weight:750}.gc-svg .gc-note{font-size:10.5px;fill:var(--fg-soft)}.gc-svg .gc-label{font-size:11px;font-weight:700}.gc-svg .gc-subnote{font-size:9.5px;fill:var(--fg-soft)}.gc-svg .gc-axis-note{font-size:10px;fill:var(--fg-soft)}",
      ".gc-table-wrap{max-width:100%;margin-top:13px;overflow-x:auto;-webkit-overflow-scrolling:touch}.gc-table{width:100%;min-width:650px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.gc-table caption{padding:0 0 7px;text-align:left;color:var(--fg-soft);font-size:12px;line-height:1.55}.gc-table th,.gc-table td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;white-space:nowrap}.gc-table th{color:var(--fg-soft);font-size:11.5px;font-weight:750}.gc-table tr.gc-selected{background:color-mix(in srgb,var(--gc-blue) 9%,transparent)}.gc-boundary{margin-top:14px;padding:11px 12px;border-left:3px solid var(--gc-red);background:var(--bg);font-size:13px;line-height:1.7}.gc-boundary p{margin:5px 0}.gc-boundary strong{color:var(--gc-red)}.gc-check{margin-top:12px;padding:9px 11px;border-left:3px solid var(--gc-gold);background:var(--bg);font-size:12.5px;line-height:1.7}",
      "@media(max-width:860px){.gc-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:520px){.gc-option-grid,.gc-preset-grid,.gc-subgroup-grid{grid-template-columns:minmax(0,1fr)}.gc-stage-frame{padding:7px}.gc-table{font-size:11.5px}.gc-table th,.gc-table td{padding-left:5px;padding-right:5px}}@media(prefers-reduced-motion:reduce){.cl-galois *{animation:none!important;transition:none!important}}"
    ].join("\n");

    function findExample(id) {
      var match = EXAMPLES.filter(function (example) { return example.id === id; })[0];
      return match || EXAMPLES[0];
    }

    function findSubgroup(example, id) {
      var match = example.subgroups.filter(function (subgroup) { return subgroup.id === id; })[0];
      return match || example.subgroups[0];
    }

    function findElement(example, id) {
      return example.groupElements.filter(function (element) { return element.id === id; })[0];
    }

    function analyze(exampleId, subgroupId) {
      var example = findExample(exampleId);
      var subgroup = findSubgroup(example, subgroupId);
      return {
        exampleId: example.id,
        exampleLabel: example.label,
        baseField: example.baseField,
        extensionField: example.extensionField,
        groupOrder: example.groupElements.length,
        subgroupId: subgroup.id,
        subgroupLabel: subgroup.label,
        subgroupElements: subgroup.elements.slice(),
        subgroupOrder: subgroup.order,
        index: subgroup.index,
        fixedField: subgroup.fixedField,
        fieldDegree: subgroup.fieldDegree,
        normal: subgroup.normal,
        quotient: subgroup.quotient,
        reason: subgroup.reason
      };
    }

    function reverseInclusion(exampleId) {
      var example = findExample(exampleId);
      return example.latticeEdges.map(function (edge) {
        var larger = findSubgroup(example, edge[0]);
        var smaller = findSubgroup(example, edge[1]);
        return {
          largerSubgroup: larger.id,
          smallerSubgroup: smaller.id,
          smallerField: larger.fixedField,
          largerField: smaller.fixedField
        };
      });
    }

    function assert(condition, message) {
      if (!condition) throw new Error(message);
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) {
        checks += 1;
        assert(condition, message);
      }

      check(EXAMPLES.length === 2, "there must be exactly two finite Galois examples");
      var v4 = findExample("v4");
      var s3 = findExample("s3");
      check(v4.groupElements.length === 4, "V4 must enumerate four elements");
      check(v4.subgroups.length === 5, "V4 must enumerate five subgroups");
      check(s3.groupElements.length === 6, "S3 must enumerate six elements");
      check(s3.subgroups.length === 6, "S3 must enumerate six subgroups");

      EXAMPLES.forEach(function (example) {
        var groupIds = example.groupElements.map(function (element) { return element.id; });
        example.subgroups.forEach(function (subgroup) {
          check(subgroup.elements.length === subgroup.order, example.id + " subgroup order");
          check(subgroup.elements.every(function (id) { return groupIds.indexOf(id) >= 0; }), example.id + " subgroup elements");
          check(subgroup.order * subgroup.index === example.groupElements.length, example.id + " order-index identity");
          check(subgroup.index === subgroup.fieldDegree, example.id + " index-degree identity");
          var report = analyze(example.id, subgroup.id);
          check(report.groupOrder === example.groupElements.length, example.id + " report group order");
        });
        example.latticeEdges.forEach(function (edge) {
          var larger = findSubgroup(example, edge[0]);
          var smaller = findSubgroup(example, edge[1]);
          check(smaller.elements.every(function (id) { return larger.elements.indexOf(id) >= 0; }), example.id + " subgroup inclusion");
          check(reverseInclusion(example.id).some(function (item) {
            return item.largerSubgroup === larger.id && item.smallerSubgroup === smaller.id;
          }), example.id + " reverse-inclusion record");
        });
      });

      check(analyze("v4", "s").fixedField === "Q(sqrt(3))", "V4 <s> fixed field");
      check(analyze("v4", "s").index === 2, "V4 <s> index");
      check(analyze("v4", "st").fixedField === "Q(sqrt(6))", "V4 <st> fixed field");
      check(analyze("s3", "a3").fixedField === "Q(omega)", "S3 A3 fixed field");
      check(analyze("s3", "a3").quotient === "C2", "S3 A3 quotient");
      check(analyze("s3", "t23").fixedField === "Q(alpha_1) = Q(alpha)", "S3 transposition fixed field");
      check(!analyze("s3", "t23").normal, "S3 transposition is not normal");
      check(analyze("s3", "t23").quotient === null, "non-normal subgroup has no quotient certificate");
      check(v4.subgroups.every(function (subgroup) { return subgroup.normal; }), "V4 all subgroups normal");

      var boundary = {
        field: "Q(alpha)",
        degree: 3,
        normal: false,
        separable: true,
        automorphismOrder: 1,
        normalClosure: "Q(alpha, omega)"
      };
      check(boundary.degree === 3 && !boundary.normal, "boundary must be non-Galois");
      check(boundary.automorphismOrder !== boundary.degree, "boundary must fail |Aut| = degree");
      return { checks: checks, examples: EXAMPLES.length, subgroups: 11 };
    }

    function installStyles(doc) {
      if (!doc || !doc.getElementById || doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement || doc.body).appendChild(style);
    }

    function appendChildren(node, children) {
      if (children === undefined || children === null) return node;
      var list = Array.isArray(children) ? children : [children];
      list.forEach(function (child) {
        if (child === undefined || child === null || child === false) return;
        node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
      });
      return node;
    }

    function setAttributes(node, attrs) {
      Object.keys(attrs || {}).forEach(function (key) {
        var value = attrs[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.setAttribute("class", String(value));
        else if (key === "text") node.textContent = String(value);
        else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
        else if (value === true) node.setAttribute(key, "");
        else node.setAttribute(key, String(value));
      });
      return node;
    }

    function element(doc, tag, attrs, children) {
      return appendChildren(setAttributes(doc.createElement(tag), attrs), children);
    }

    function svgElement(doc, tag, attrs, children) {
      return appendChildren(setAttributes(doc.createElementNS("http://www.w3.org/2000/svg", tag), attrs), children);
    }

    function announce(api, root, message) {
      if (api && typeof api.announce === "function") api.announce(root, message);
    }

    function elementLabels(example, ids) {
      return ids.map(function (id) { return findElement(example, id).label; }).join(", ");
    }

    function quotientText(subgroup) {
      return subgroup.normal ? "G/H ≅ " + subgroup.quotient : "不存在群商（H 非正规）";
    }

    function normalText(example, subgroup) {
      if (example.id === "v4") return subgroup.normal ? "是：V4 为交换群，所有子群都正规。" : "否。";
      if (subgroup.id === "a3") return "是：A3 = ker(sign)，所以 S3/A3 ≅ C2。";
      if (subgroup.id === "trivial" || subgroup.id === "whole") return "是：平凡子群或整个群总是正规。";
      return "否：" + subgroup.reason.replace("r ", "r·").replace(" != ", " ≠ ") + "。";
    }

    function middlePositions(count, center) {
      var width = count === 3 ? 170 : 220;
      var start = center - width / 2;
      var step = count === 1 ? 0 : width / (count - 1);
      return Array.apply(null, Array(count)).map(function (_, index) {
        return start + step * index;
      });
    }

    function graphPositions(example) {
      var middle = example.subgroups.filter(function (subgroup) {
        return subgroup.id !== "whole" && subgroup.id !== "trivial";
      });
      var groupXs = middlePositions(middle.length, 180);
      var fieldXs = middlePositions(middle.length, 660);
      var positions = {
        whole: { group: { x: 180, y: 54 }, field: { x: 660, y: 54 } },
        trivial: { group: { x: 180, y: 316 }, field: { x: 660, y: 316 } }
      };
      middle.forEach(function (subgroup, index) {
        positions[subgroup.id] = {
          group: { x: groupXs[index], y: 185 },
          field: { x: fieldXs[index], y: 185 }
        };
      });
      return positions;
    }

    function drawGraphNode(doc, svg, position, label, note, selected) {
      var width = label.length > 13 ? 128 : 106;
      var group = svgElement(doc, "g", { "aria-label": label + (note ? " " + note : "") });
      group.appendChild(svgElement(doc, "rect", {
        x: position.x - width / 2,
        y: position.y - 19,
        width: width,
        height: 38,
        rx: 5,
        className: selected ? "gc-node gc-node-selected" : "gc-node"
      }));
      group.appendChild(svgElement(doc, "text", {
        x: position.x,
        y: position.y + 4,
        "text-anchor": "middle",
        className: "gc-label"
      }, label));
      if (note) {
        group.appendChild(svgElement(doc, "text", {
          x: position.x,
          y: position.y + 32,
          "text-anchor": "middle",
          className: "gc-subnote"
        }, note));
      }
      svg.appendChild(group);
    }

    function renderGraph(doc, example, selectedId, serial) {
      var positions = graphPositions(example);
      var svg = svgElement(doc, "svg", {
        className: "gc-svg",
        viewBox: "0 0 840 370",
        role: "img",
        "aria-labelledby": "gc-svg-title-" + serial + " gc-svg-desc-" + serial
      });
      svg.appendChild(svgElement(doc, "title", { id: "gc-svg-title-" + serial }, "Galois correspondence lattices"));
      svg.appendChild(svgElement(doc, "desc", { id: "gc-svg-desc-" + serial }, "The subgroup lattice and fixed-field lattice have reverse inclusion; the selected pair is highlighted."));
      var defs = svgElement(doc, "defs", {});
      var marker = svgElement(doc, "marker", {
        id: "gc-arrow-" + serial,
        viewBox: "0 0 10 10",
        refX: 8,
        refY: 5,
        markerWidth: 5,
        markerHeight: 5,
        orient: "auto-start-reverse"
      });
      marker.appendChild(svgElement(doc, "path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "currentColor" }));
      defs.appendChild(marker);
      svg.appendChild(defs);
      svg.appendChild(svgElement(doc, "text", { x: 180, y: 18, "text-anchor": "middle", className: "gc-title" }, "Subgroup lattice"));
      svg.appendChild(svgElement(doc, "text", { x: 660, y: 18, "text-anchor": "middle", className: "gc-title" }, "Fixed-field lattice"));
      svg.appendChild(svgElement(doc, "text", { x: 180, y: 35, "text-anchor": "middle", className: "gc-axis-note" }, "superset direction"));
      svg.appendChild(svgElement(doc, "text", { x: 660, y: 35, "text-anchor": "middle", className: "gc-axis-note" }, "subset direction"));
      svg.appendChild(svgElement(doc, "text", { x: 420, y: 35, "text-anchor": "middle", className: "gc-axis-note" }, "anti-isomorphism"));

      example.latticeEdges.forEach(function (edge) {
        var larger = positions[edge[0]].group;
        var smaller = positions[edge[1]].group;
        svg.appendChild(svgElement(doc, "line", {
          x1: larger.x,
          y1: larger.y + 20,
          x2: smaller.x,
          y2: smaller.y - 20,
          className: "gc-edge",
          "marker-end": "url(#gc-arrow-" + serial + ")"
        }));
        var largerField = positions[edge[0]].field;
        var smallerField = positions[edge[1]].field;
        svg.appendChild(svgElement(doc, "line", {
          x1: largerField.x,
          y1: largerField.y + 20,
          x2: smallerField.x,
          y2: smallerField.y - 20,
          className: "gc-edge",
          "marker-end": "url(#gc-arrow-" + serial + ")"
        }));
      });

      example.subgroups.forEach(function (subgroup) {
        var selected = subgroup.id === selectedId;
        var groupPosition = positions[subgroup.id].group;
        var fieldPosition = positions[subgroup.id].field;
        svg.appendChild(svgElement(doc, "line", {
          x1: groupPosition.x + 60,
          y1: groupPosition.y,
          x2: fieldPosition.x - 60,
          y2: fieldPosition.y,
          className: selected ? "gc-pair gc-selected-pair" : "gc-pair"
        }));
      });

      example.subgroups.forEach(function (subgroup) {
        var selected = subgroup.id === selectedId;
        var note = subgroup.normal ? "normal" : "not normal";
        var groupLabel = subgroup.id === "whole" ? "G = " + example.label : subgroup.id === "trivial" ? "{e}" : subgroup.label;
        var fieldLabel = subgroup.id === "whole" ? "F = Q" : subgroup.id === "trivial" ? "K" : subgroup.graphField;
        drawGraphNode(doc, svg, positions[subgroup.id].group, groupLabel, note, selected);
        drawGraphNode(doc, svg, positions[subgroup.id].field, fieldLabel, "fixed by " + groupLabel, selected);
      });
      return svg;
    }

    function table(doc, caption, headers, rows, selectedIndex) {
      var wrap = element(doc, "div", { className: "gc-table-wrap" });
      var node = element(doc, "table", { className: "gc-table" });
      node.appendChild(element(doc, "caption", { text: caption }));
      var head = element(doc, "tr");
      headers.forEach(function (header) { head.appendChild(element(doc, "th", { scope: "col", text: header })); });
      node.appendChild(element(doc, "thead", {}, head));
      var body = element(doc, "tbody");
      rows.forEach(function (row, rowIndex) {
        var tr = element(doc, "tr", { className: rowIndex === selectedIndex ? "gc-selected" : "" });
        row.forEach(function (value) { tr.appendChild(element(doc, "td", { text: value })); });
        body.appendChild(tr);
      });
      node.appendChild(body);
      wrap.appendChild(node);
      return wrap;
    }

    function renderPrediction(doc, state, render) {
      var box = element(doc, "fieldset", { className: "gc-prediction-box" });
      box.appendChild(element(doc, "legend", { text: "预测门：四项都回答后才揭示对应实验" }));
      var buttons = [];
      QUESTIONS.forEach(function (question) {
        var field = element(doc, "fieldset", { className: "gc-question" });
        field.appendChild(element(doc, "legend", { text: question.prompt }));
        var choices = element(doc, "div", { className: "gc-option-grid", role: "group", "aria-label": question.prompt });
        question.options.forEach(function (option) {
          var button = element(doc, "button", {
            type: "button",
            "aria-pressed": state.predictions[question.key] === option.id ? "true" : "false",
            text: option.label
          });
          button.addEventListener("click", function () {
            state.predictions[question.key] = option.id;
            buttons.forEach(function (item) {
              item.button.setAttribute("aria-pressed", state.predictions[item.question.key] === item.option.id ? "true" : "false");
            });
            revealButton.disabled = QUESTIONS.some(function (item) { return !state.predictions[item.key]; });
            feedback.textContent = "已记录这一项预测。";
            feedback.className = "gc-feedback";
          });
          buttons.push({ button: button, question: question, option: option });
          choices.appendChild(button);
        });
        field.appendChild(choices);
        box.appendChild(field);
      });
      var feedback = element(doc, "p", { className: "gc-feedback", "aria-live": "polite", text: "四项都回答后，揭示按钮才会可用。" });
      var actions = element(doc, "div", { className: "gc-actions" });
      var revealButton = element(doc, "button", { type: "button", className: "gc-primary", text: "揭示对应与证书" });
      revealButton.disabled = QUESTIONS.some(function (item) { return !state.predictions[item.key]; });
      revealButton.addEventListener("click", function () {
        var correct = QUESTIONS.filter(function (item) { return state.predictions[item.key] === item.answer; }).length;
        state.revealed = true;
        render();
        announce(state.api, state.root, "预测门已揭示，" + correct + " 项与证书一致。");
      });
      var clearButton = element(doc, "button", { type: "button", text: "清空预测" });
      clearButton.addEventListener("click", function () {
        QUESTIONS.forEach(function (question) { state.predictions[question.key] = null; });
        buttons.forEach(function (item) { item.button.setAttribute("aria-pressed", "false"); });
        revealButton.disabled = true;
        feedback.textContent = "预测已清空。";
        feedback.className = "gc-feedback";
      });
      actions.appendChild(revealButton);
      actions.appendChild(clearButton);
      box.appendChild(feedback);
      box.appendChild(actions);
      return box;
    }

    function renderExplorer(doc, state, render) {
      var example = findExample(state.exampleId);
      var selected = findSubgroup(example, state.selectedSubgroupId);
      var report = analyze(example.id, selected.id);
      var layout = element(doc, "div", { className: "gc-layout" });
      var controls = element(doc, "div", { className: "gc-control-box" });
      controls.appendChild(element(doc, "h4", { text: "选择有限 Galois 例子" }));
      var presets = element(doc, "div", { className: "gc-preset-grid", role: "group", "aria-label": "选择例子" });
      EXAMPLES.forEach(function (item) {
        var button = element(doc, "button", {
          type: "button",
          "aria-pressed": item.id === example.id ? "true" : "false"
        });
        button.appendChild(doc.createTextNode(item.label));
        button.appendChild(element(doc, "small", { text: item.extensionField }));
        button.addEventListener("click", function () {
          state.exampleId = item.id;
          state.selectedSubgroupId = item.defaultSubgroup;
          render();
          announce(state.api, state.root, "已切换到" + item.label + "，默认选择" + findSubgroup(item, item.defaultSubgroup).label + "。");
        });
        presets.appendChild(button);
      });
      controls.appendChild(presets);
      controls.appendChild(element(doc, "h4", { text: "枚举全部子群" }));
      var subgroupGrid = element(doc, "div", { className: "gc-subgroup-grid", role: "group", "aria-label": "选择子群" });
      example.subgroups.forEach(function (subgroup) {
        var button = element(doc, "button", {
          type: "button",
          "aria-pressed": subgroup.id === selected.id ? "true" : "false"
        });
        button.appendChild(doc.createTextNode(subgroup.label));
        button.appendChild(element(doc, "small", { text: "{" + elementLabels(example, subgroup.elements) + "}" }));
        button.addEventListener("click", function () {
          state.selectedSubgroupId = subgroup.id;
          render();
          announce(state.api, state.root, "已选择" + subgroup.label + "；固定域为" + subgroup.fixedField + "。");
        });
        subgroupGrid.appendChild(button);
      });
      controls.appendChild(subgroupGrid);
      controls.appendChild(element(doc, "p", { className: "gc-note", text: "每个按钮都是预先列出的真实子群；脚本不搜索任意群或多项式。" }));

      var stage = element(doc, "div", { className: "gc-stage-frame" });
      var stageHeading = element(doc, "div", { className: "gc-stage-heading" });
      stageHeading.appendChild(element(doc, "h3", { text: "Galois 对应账本" }));
      stageHeading.appendChild(element(doc, "span", { text: example.title }));
      stage.appendChild(stageHeading);
      stage.appendChild(element(doc, "p", { className: "gc-intro", text: "选中 H 后，左右图的同一行是对应对；左图按子群包含向下，右图按固定域包含向下。" }));

      var metrics = element(doc, "div", { className: "gc-metrics" });
      [
        ["|G|", String(report.groupOrder)],
        ["|H|", String(report.subgroupOrder)],
        ["[G:H]", String(report.index)],
        ["[K^H:F]", String(report.fieldDegree)],
        ["K^H", report.fixedField]
      ].forEach(function (item) {
        var metric = element(doc, "div", { className: "gc-metric" });
        metric.appendChild(element(doc, "span", { text: item[0] }));
        metric.appendChild(element(doc, "strong", { text: item[1] }));
        metrics.appendChild(metric);
      });
      stage.appendChild(metrics);

      var certificate = element(doc, "section", { className: report.normal ? "gc-certificate" : "gc-certificate gc-not-normal" });
      certificate.appendChild(element(doc, "strong", { text: "当前选择：H = " + report.subgroupLabel }));
      certificate.appendChild(element(doc, "p", { text: "H 的全部元素：{" + elementLabels(example, report.subgroupElements) + "}；固定域：" + report.fixedField + "。" }));
      certificate.appendChild(element(doc, "p", { text: "正规性：" + normalText(example, selected) }));
      certificate.appendChild(element(doc, "p", { text: "商群证书：" + quotientText(selected) + "。" }));
      stage.appendChild(certificate);

      var graphFrame = element(doc, "div", { className: "gc-graph-frame" });
      graphFrame.appendChild(renderGraph(doc, example, selected.id, SERIAL));
      stage.appendChild(graphFrame);

      var elementRows = example.groupElements.map(function (item) {
        return [item.label, item.action, String(item.order)];
      });
      stage.appendChild(table(doc, "群元素的完整枚举", ["元素", "作用 / 置换", "阶"], elementRows, -1));
      var subgroupRows = example.subgroups.map(function (subgroup) {
        return [
          subgroup.label,
          "{" + elementLabels(example, subgroup.elements) + "}",
          subgroup.fixedField,
          String(subgroup.order),
          String(subgroup.index),
          subgroup.normal ? "是" : "否",
          quotientText(subgroup)
        ];
      });
      stage.appendChild(table(doc, "子群、固定域与次数的完整枚举", ["H", "全部元素", "K^H", "|H|", "[G:H]", "正规?", "G/H"], subgroupRows, example.subgroups.map(function (item) { return item.id; }).indexOf(selected.id)));

      var boundary = element(doc, "section", { className: "gc-boundary" });
      boundary.appendChild(element(doc, "strong", { text: "失败边界：E = Q(cuberoot(2))" }));
      boundary.appendChild(element(doc, "p", { text: "x^3-2 的实根 alpha 生成 E，且 [E:Q]=3；但 omega alpha 与 omega^2 alpha 不在 E，所以 E/Q 可分而不正规。" }));
      boundary.appendChild(element(doc, "p", { text: "Aut_Q(E) 只有恒等，不能把它当作阶 3 的 Galois 群；对应定理应改在正规闭包 K=Q(alpha, omega) 上使用，E=K^<t23>。" }));
      stage.appendChild(boundary);
      layout.appendChild(controls);
      layout.appendChild(stage);
      return layout;
    }

    function mount(root, api) {
      var doc = root && root.ownerDocument ? root.ownerDocument : null;
      if (!doc) return;
      installStyles(doc);
      SERIAL += 1;
      var state = {
        exampleId: "v4",
        selectedSubgroupId: "s",
        revealed: false,
        predictions: {},
        root: root,
        api: api
      };
      QUESTIONS.forEach(function (question) { state.predictions[question.key] = null; });

      function render() {
        var shell = element(doc, "div", { className: "gc-shell" });
        shell.appendChild(element(doc, "h3", { text: "Galois 对应：V4 与 S3 的完整账本" }));
        shell.appendChild(element(doc, "p", { className: "gc-intro", text: "先预测，再查看固定域格、子群格、次数和正规子群证书。所有计算都来自两个固定例子的有限模型。" }));
        shell.appendChild(renderPrediction(doc, state, render));
        if (state.revealed) shell.appendChild(renderExplorer(doc, state, render));
        root.replaceChildren(shell);
      }

      render();
    }

    return {
      EXAMPLES: EXAMPLES,
      QUESTIONS: QUESTIONS,
      analyze: analyze,
      reverseInclusion: reverseInclusion,
      selfTest: selfTest,
      mount: mount
    };
  }
);

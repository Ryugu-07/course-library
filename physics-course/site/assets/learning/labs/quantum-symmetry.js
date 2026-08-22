(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("quantum-symmetry", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("quantum-symmetry self-test: PASS (" + report.checks + " checks, " + report.representations + " representations, " + report.hamiltonians + " Hamiltonians)");
    } catch (error) {
      console.error("quantum-symmetry self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "quantum-symmetry-lab-styles";
  var INSTANCE = 0;
  var EPSILON = 1e-9;

  function c(re, im) { return { re: re || 0, im: im || 0 }; }
  function cAdd(left, right) { return c(left.re + right.re, left.im + right.im); }
  function cSub(left, right) { return c(left.re - right.re, left.im - right.im); }
  function cMul(left, right) { return c(left.re * right.re - left.im * right.im, left.re * right.im + left.im * right.re); }
  function cScale(value, factor) { return typeof factor === "number" ? c(value.re * factor, value.im * factor) : cMul(value, factor); }
  function cAbs(value) { return Math.sqrt(value.re * value.re + value.im * value.im); }
  function cConjugate(value) { return c(value.re, -value.im); }

  function zeroMatrix(size) {
    return Array.apply(null, Array(size)).map(function () { return Array.apply(null, Array(size)).map(function () { return c(0, 0); }); });
  }

  function identityMatrix(size) {
    var matrix = zeroMatrix(size);
    for (var index = 0; index < size; index += 1) matrix[index][index] = c(1, 0);
    return matrix;
  }

  function matrixAdd(left, right) {
    return left.map(function (row, rowIndex) { return row.map(function (value, columnIndex) { return cAdd(value, right[rowIndex][columnIndex]); }); });
  }

  function matrixSubtract(left, right) {
    return left.map(function (row, rowIndex) { return row.map(function (value, columnIndex) { return cSub(value, right[rowIndex][columnIndex]); }); });
  }

  function matrixScale(matrix, factor) {
    return matrix.map(function (row) { return row.map(function (value) { return cScale(value, factor); }); });
  }

  function matrixMultiply(left, right) {
    var size = left.length;
    var result = zeroMatrix(size);
    for (var row = 0; row < size; row += 1) {
      for (var column = 0; column < size; column += 1) {
        var sum = c(0, 0);
        for (var inner = 0; inner < size; inner += 1) sum = cAdd(sum, cMul(left[row][inner], right[inner][column]));
        result[row][column] = sum;
      }
    }
    return result;
  }

  function matrixMaxAbs(matrix) {
    var maximum = 0;
    matrix.forEach(function (row) { row.forEach(function (value) { maximum = Math.max(maximum, cAbs(value)); }); });
    return maximum;
  }

  function commutator(left, right) { return matrixSubtract(matrixMultiply(left, right), matrixMultiply(right, left)); }

  function spinMatrices(j) {
    var value = Number(j);
    var doubled = 2 * value;
    if (!Number.isFinite(value) || doubled < 1 || !Number.isInteger(doubled)) throw new Error("j must be a positive half-integer");
    var dimension = doubled + 1;
    var mValues = [];
    for (var index = 0; index < dimension; index += 1) mValues.push(value - index);
    var raising = zeroMatrix(dimension);
    var lowering = zeroMatrix(dimension);
    mValues.forEach(function (m, column) {
      if (column > 0) raising[column - 1][column] = c(Math.sqrt(Math.max(0, value * (value + 1) - m * (m + 1))), 0);
      if (column < dimension - 1) lowering[column + 1][column] = c(Math.sqrt(Math.max(0, value * (value + 1) - m * (m - 1))), 0);
    });
    var z = zeroMatrix(dimension);
    mValues.forEach(function (m, diagonal) { z[diagonal][diagonal] = c(m, 0); });
    var x = matrixScale(matrixAdd(raising, lowering), 0.5);
    var y = matrixScale(matrixSubtract(raising, lowering), -0.5);
    y = y.map(function (row) { return row.map(function (value) { return cScale(value, c(0, 1)); }); });
    return { j: value, dimension: dimension, mValues: mValues, Jplus: raising, Jminus: lowering, Jx: x, Jy: y, Jz: z, casimir: matrixAdd(matrixAdd(matrixMultiply(x, x), matrixMultiply(y, y)), matrixMultiply(z, z)) };
  }

  function representationDiagnostics(j) {
    var matrices = spinMatrices(j);
    var iJx = matrices.Jx.map(function (row) { return row.map(function (value) { return cScale(value, c(0, 1)); }); });
    var iJy = matrices.Jy.map(function (row) { return row.map(function (value) { return cScale(value, c(0, 1)); }); });
    var iJz = matrices.Jz.map(function (row) { return row.map(function (value) { return cScale(value, c(0, 1)); }); });
    var expectedCasimir = matrixScale(identityMatrix(matrices.dimension), j * (j + 1));
    return {
      j: j,
      dimension: matrices.dimension,
      matrices: matrices,
      commutatorResiduals: {
        xy: matrixMaxAbs(matrixSubtract(commutator(matrices.Jx, matrices.Jy), iJz)),
        yz: matrixMaxAbs(matrixSubtract(commutator(matrices.Jy, matrices.Jz), iJx)),
        zx: matrixMaxAbs(matrixSubtract(commutator(matrices.Jz, matrices.Jx), iJy))
      },
      casimirResidual: matrixMaxAbs(matrixSubtract(matrices.casimir, expectedCasimir))
    };
  }

  var HAMILTONIANS = [
    { id: "degenerate", label: "H0=2I（等距 toy）", base: 2, z: 0, x: 0, note: "完整的自旋空间保持同一能量。" },
    { id: "axial", label: "Hz=2I+0.6Jz（轴向）", base: 2, z: 0.6, x: 0, note: "与 Jz 对易，但两个 m 能级分裂。" },
    { id: "tilted", label: "Htilt=2I+0.6Jz+0.08Jx（微扰）", base: 2, z: 0.6, x: 0.08, note: "有限参数 toy；Jz 对称被倾斜项破坏。" }
  ];

  function hamiltonianById(id) {
    for (var index = 0; index < HAMILTONIANS.length; index += 1) if (HAMILTONIANS[index].id === id) return HAMILTONIANS[index];
    return HAMILTONIANS[0];
  }

  function hamiltonianMatrix(id) {
    var model = hamiltonianById(id);
    var matrices = spinMatrices(0.5);
    return matrixAdd(matrixScale(identityMatrix(2), model.base), matrixAdd(matrixScale(matrices.Jz, model.z), matrixScale(matrices.Jx, model.x)));
  }

  function eigenvaluesHermitian2(matrix) {
    var a = matrix[0][0].re;
    var d = matrix[1][1].re;
    var offDiagonalSquared = Math.pow(cAbs(matrix[0][1]), 2);
    var center = (a + d) / 2;
    var radius = Math.sqrt(Math.pow((a - d) / 2, 2) + offDiagonalSquared);
    return [center - radius, center + radius];
  }

  function distinctCount(values, tolerance) {
    var sorted = values.slice().sort(function (left, right) { return left - right; });
    var count = 0;
    sorted.forEach(function (value) { if (!count || Math.abs(value - sorted[count - 1]) > (tolerance || EPSILON)) count += 1; });
    return count;
  }

  function hamiltonianAnalysis(id) {
    var model = hamiltonianById(id);
    var matrices = spinMatrices(0.5);
    var matrix = hamiltonianMatrix(id);
    var commutatorResidual = matrixMaxAbs(commutator(matrix, matrices.Jz));
    var eigenvalues = eigenvaluesHermitian2(matrix);
    return { id: model.id, label: model.label, note: model.note, matrix: matrix, commutatorResidual: commutatorResidual, commutesWithJz: commutatorResidual <= EPSILON, eigenvalues: eigenvalues, distinctEnergies: distinctCount(eigenvalues), degeneracy: 2 / distinctCount(eigenvalues) };
  }

  function selectionOperator(j, q) {
    var matrices = spinMatrices(j);
    if (q === 1) return matrices.Jplus;
    if (q === -1) return matrices.Jminus;
    return matrices.Jz;
  }

  function selectionLedger(j, q) {
    var matrices = spinMatrices(j);
    var operator = selectionOperator(j, q);
    var rows = [];
    matrices.mValues.forEach(function (fromM, fromIndex) {
      matrices.mValues.forEach(function (toM, toIndex) {
        var predicted = Math.abs(toM - (fromM + q)) <= EPSILON;
        var magnitude = cAbs(operator[toIndex][fromIndex]);
        rows.push({ q: q, from: fromM, to: toM, predictedAllowed: predicted, magnitude: magnitude, exactZero: magnitude <= EPSILON });
      });
    });
    return rows;
  }

  function allSelectionRows(j) {
    return [-1, 0, 1].reduce(function (all, q) { return all.concat(selectionLedger(j, q)); }, []);
  }

  var STYLE_TEXT = [
    ".qs-lab{--qs-blue:var(--accent,#315f9d);--qs-gold:var(--cl-gold,#9b6a12);--qs-green:var(--cl-green,#39734d);--qs-red:var(--cl-red,#b64335);--qs-muted:var(--fg-soft,#6b6557);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".qs-lab *,.qs-lab *::before,.qs-lab *::after{box-sizing:border-box}.qs-lab [hidden]{display:none!important}.qs-lab h3,.qs-lab h4{margin:0;color:var(--fg);letter-spacing:0}.qs-lab h3{font-size:1.18rem}.qs-lab h4{font-size:1rem}.qs-lab p{margin:7px 0}.qs-lab .qs-intro,.qs-lab .qs-note,.qs-lab .qs-status{color:var(--qs-muted);font-size:13px;line-height:1.7}",
    ".qs-lab .qs-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0}.qs-lab .qs-field{display:grid;gap:5px;min-width:0}.qs-lab .qs-field label{color:var(--qs-muted);font-size:12.5px;font-weight:750}.qs-lab select{width:100%;min-height:44px;padding:7px 9px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35}.qs-lab button{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;font:inherit;line-height:1.35;overflow-wrap:anywhere}.qs-lab button:hover{border-color:var(--qs-blue)}.qs-lab button:focus-visible,.qs-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.qs-lab button[aria-pressed=true],.qs-lab button.qs-primary{border-color:var(--qs-blue);background:var(--qs-blue);color:var(--bg);font-weight:750}",
    ".qs-lab .qs-prediction{margin:14px 0;padding:12px;border-left:3px solid var(--qs-gold);background:var(--block-bg,var(--bg))}.qs-lab .qs-prediction h4{margin-bottom:6px}.qs-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border);background:var(--bg)}.qs-lab legend{max-width:100%;padding:0 3px;color:var(--fg);font-size:13px;font-weight:700;line-height:1.5}.qs-lab .qs-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.qs-lab .qs-options button{font-size:12px}.qs-lab .qs-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.qs-lab .qs-actions>*{flex:1 1 170px}.qs-lab .qs-status{min-height:1.7em;margin-top:9px;font-weight:700}.qs-lab .qs-pass{color:var(--qs-green)}.qs-lab .qs-warn{color:var(--qs-red)}",
    ".qs-lab .qs-evidence{display:grid;gap:12px;margin-top:15px}.qs-lab .qs-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch}.qs-lab .qs-svg{display:block;width:100%;min-width:620px;height:auto;color:var(--fg)}.qs-lab .qs-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.qs-lab .qs-svg .qs-cell{fill:var(--qs-blue);fill-opacity:.14;stroke:var(--qs-blue);stroke-width:1}.qs-lab .qs-svg .qs-nonzero{fill:var(--qs-gold);fill-opacity:.5}.qs-lab .qs-svg .qs-label{font-size:11px}.qs-lab .qs-svg .qs-note{fill:var(--qs-muted);font-size:11px}.qs-lab .qs-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.qs-lab table{width:100%;min-width:760px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.qs-lab caption{padding:0 0 7px;text-align:left;color:var(--qs-muted);font-size:12px;font-weight:700}.qs-lab th,.qs-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;white-space:nowrap}.qs-lab th{color:var(--qs-muted);font-size:11px}.qs-lab .qs-certificate{padding:10px 12px;border-left:3px solid var(--qs-green);background:var(--block-bg,var(--bg));font-size:13px;line-height:1.7}",
    "@media(max-width:680px){.qs-lab .qs-controls{grid-template-columns:minmax(0,1fr)}.qs-lab .qs-options{grid-template-columns:minmax(0,1fr)}.qs-lab .qs-frame{padding:5px}.qs-lab table{font-size:11.5px}}@media(prefers-reduced-motion:reduce){.qs-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function format(value, digits) {
    var text = Number(value).toFixed(digits === undefined ? 6 : digits);
    return text.replace(/0+$/, "").replace(/\.$/, "") || "0";
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

  function labelM(value) { return value > 0 ? "+" + format(value, 1) : format(value, 1); }

  function heatmap(svg, matrix, labels, x, y, title, cell, prefix) {
    svg.appendChild(svgElement(svg.ownerDocument, "text", { x: String(x), y: String(y), className: "qs-svg-heading" }, title));
    var doc = svg.ownerDocument;
    labels.forEach(function (label, row) {
      svg.appendChild(svgElement(doc, "text", { x: String(x + 36), y: String(y + 28 + row * cell + cell / 2 + 4), "text-anchor": "end", className: "qs-label" }, label));
      svg.appendChild(svgElement(doc, "text", { x: String(x + 48 + row * cell + cell / 2), y: String(y + 19), "text-anchor": "middle", className: "qs-label" }, label));
      labels.forEach(function (_, column) {
        var value = matrix[row][column];
        var magnitude = cAbs(value);
        var attrs = { x: String(x + 48 + column * cell), y: String(y + 28 + row * cell), width: String(cell - 3), height: String(cell - 3), className: "qs-cell" };
        if (magnitude > EPSILON) attrs.className += " qs-nonzero";
        svg.appendChild(svgElement(doc, "rect", attrs));
        svg.appendChild(svgElement(doc, "text", { x: String(x + 48 + column * cell + (cell - 3) / 2), y: String(y + 28 + row * cell + (cell - 3) / 2 + 4), "text-anchor": "middle", className: "qs-label" }, format(value.re, 2) + (Math.abs(value.im) > EPSILON ? (value.im > 0 ? "+" : "") + format(value.im, 2) + "i" : "")));
      });
    });
    svg.appendChild(svgElement(doc, "text", { x: String(x), y: String(y + 44 + labels.length * cell), className: "qs-note" }, prefix));
  }

  function renderSvg(doc, representation, hamiltonian, serial) {
    var svg = svgElement(doc, "svg", { className: "qs-svg", viewBox: "0 0 760 360", role: "img", "aria-labelledby": "qs-svg-title-" + serial + " qs-svg-desc-" + serial });
    svg.appendChild(svgElement(doc, "title", { id: "qs-svg-title-" + serial }, "角动量矩阵与有限 Hamiltonian 热图"));
    svg.appendChild(svgElement(doc, "desc", { id: "qs-svg-desc-" + serial }, "左侧显示所选自旋表示的 Jz 矩阵，右侧显示自旋二分之一 toy Hamiltonian 的矩阵；金色格表示非零矩阵元。"));
    var labels = representation.matrices.mValues.map(labelM);
    heatmap(svg, representation.matrices.Jz, labels, 16, 28, "Jz（j=" + representation.j + "）", 48, "表示维数 " + representation.dimension + "；金色格为非零元");
    var hLabels = ["+1/2", "-1/2"];
    heatmap(svg, hamiltonian.matrix, hLabels, 385, 28, hamiltonian.label, 62, "[H,Jz] 残差=" + format(hamiltonian.commutatorResidual, 5));
    svg.appendChild(svgElement(doc, "text", { x: "16", y: "340", className: "qs-note" }, "矩阵热图是有限数值显示；表示恒等式的残差与 toy Hamiltonian 的物理诊断分开读取。"));
    return svg;
  }

  function renderTable(doc, caption, headers, rows) {
    var wrap = element(doc, "div", { className: "qs-table-wrap" });
    var table = element(doc, "table"); table.appendChild(element(doc, "caption", { text: caption }));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, headers.map(function (header) { return element(doc, "th", { scope: "col", text: header }); }))));
    var body = element(doc, "tbody"); rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, row.map(function (value) { return element(doc, "td", { text: String(value) }); }))); });
    table.appendChild(body); wrap.appendChild(table); return wrap;
  }

  function renderEvidence(doc, evidence, representation, hamiltonian) {
    clear(evidence);
    var allH = HAMILTONIANS.map(function (model) { return hamiltonianAnalysis(model.id); });
    evidence.appendChild(element(doc, "div", { className: "qs-frame" }, renderSvg(doc, representation, hamiltonian, evidence.getAttribute("data-qs-serial"))));
    evidence.appendChild(renderTable(doc, "表示恒等式账本（有限矩阵残差）", ["表示", "维数", "[Jx,Jy]−iJz", "[Jy,Jz]−iJx", "[Jz,Jx]−iJy", "Casimir 残差"], [
      ["j=" + representation.j, representation.dimension, format(representation.commutatorResiduals.xy, 8), format(representation.commutatorResiduals.yz, 8), format(representation.commutatorResiduals.zx, 8), format(representation.casimirResidual, 8)]
    ]));
    evidence.appendChild(renderTable(doc, "对称性与简并账本（自旋 1/2 toy Hamiltonian）", ["模型", "[H,Jz] 范数", "是否对易", "能量", "简并读法"], allH.map(function (item) {
      return [item.label, format(item.commutatorResidual, 6), item.commutesWithJz ? "是" : "否", item.eigenvalues.map(function (value) { return format(value, 4); }).join(", "), item.degeneracy + " 重（数值）"];
    })));
    var selectionRows = allSelectionRows(0.5);
    evidence.appendChild(renderTable(doc, "选择定则 ledger：j=j'=1/2 的矢量分量", ["q", "初态 m", "末态 m'", "几何预测", "|矩阵元|", "有限矩阵读法"], selectionRows.map(function (row) {
      return [row.q, labelM(row.from), labelM(row.to), row.predictedAllowed ? "允许候选" : "禁戒", format(row.magnitude, 5), row.exactZero ? "严格零（在此表示）" : "非零"];
    })));
    evidence.appendChild(element(doc, "div", { className: "qs-certificate", text: "分账提醒：su(2) 交换子与 Casimir 是表示恒等式；H 的对易范数、能量和简并数只属于这里给定的有限 toy 参数。对称性对易不自动制造简并，Kramers 成对简并还需要反酉时间反演满足 T²=-1；选择定则的零元也依赖不可约张量假设。" }));
  }

  var QUESTIONS = [
    { key: "commutator", prompt: "标准角动量表示中，[Jx,Jy] 等于什么？", options: ["iJz", "Jz", "0"], answer: "iJz" },
    { key: "degeneracy", prompt: "下面三种模型中，哪一个明确保留二重简并？", options: ["H0=2I", "Hz=2I+0.6Jz", "Htilt=Hz+0.08Jx"], answer: "H0=2I" },
    { key: "selection", prompt: "从 m=+1/2 出发，矢量分量的几何选择定则如何读？", options: ["q=-1 到 -1/2；q=0 到 +1/2；q=+1 超出空间", "三个 q 都到两个末态", "只有 q=0 允许"], answer: "q=-1 到 -1/2；q=0 到 +1/2；q=+1 超出空间" }
  ];

  function mount(root, api) {
    var doc = root.ownerDocument || (typeof document !== "undefined" ? document : null);
    if (!doc) return;
    installStyles(doc); root.classList.add("qs-lab"); INSTANCE += 1;
    var serial = INSTANCE;
    var state = { j: 0.5, hamiltonianId: "degenerate", predictions: Object.create(null), revealed: false };
    var shell = element(doc, "div", { className: "qs-shell" });
    shell.appendChild(element(doc, "h3", { text: "量子对称性账本：表示、对易与选择定则" }));
    shell.appendChild(element(doc, "p", { className: "qs-intro", text: "矩阵使用固定的有限 spin-j 表示。先预测三条结构关系，再把精确表示身份、toy Hamiltonian 数值和选择定则逐层核对。" }));
    var controls = element(doc, "div", { className: "qs-controls" });
    var repField = element(doc, "div", { className: "qs-field" }); repField.appendChild(element(doc, "label", { htmlFor: "qs-j-" + serial, text: "表示 j" }));
    var repSelect = element(doc, "select", { id: "qs-j-" + serial, "aria-label": "选择自旋表示" });
    repSelect.appendChild(element(doc, "option", { value: "0.5", text: "j=1/2（2×2）" })); repSelect.appendChild(element(doc, "option", { value: "1", text: "j=1（3×3）" })); repField.appendChild(repSelect);
    var hField = element(doc, "div", { className: "qs-field" }); hField.appendChild(element(doc, "label", { htmlFor: "qs-h-" + serial, text: "toy Hamiltonian" }));
    var hSelect = element(doc, "select", { id: "qs-h-" + serial, "aria-label": "选择 toy Hamiltonian" }); HAMILTONIANS.forEach(function (model) { hSelect.appendChild(element(doc, "option", { value: model.id, text: model.label })); }); hField.appendChild(hSelect);
    controls.appendChild(repField); controls.appendChild(hField); shell.appendChild(controls);
    var prediction = element(doc, "section", { className: "qs-prediction", "aria-labelledby": "qs-prediction-title-" + serial }); prediction.appendChild(element(doc, "h4", { id: "qs-prediction-title-" + serial, text: "先预测：别把对易性、简并和允许跃迁混成一句话" }));
    var questionList = element(doc, "div"); prediction.appendChild(questionList);
    var actions = element(doc, "div", { className: "qs-actions" }); var reveal = element(doc, "button", { type: "button", className: "qs-primary", text: "核对预测并揭晓" }); var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); prediction.appendChild(actions);
    var status = element(doc, "p", { className: "qs-status", "aria-live": "polite", "aria-atomic": "true" }); prediction.appendChild(status); shell.appendChild(prediction);
    var evidence = element(doc, "section", { className: "qs-evidence", hidden: true, "data-qs-serial": String(serial), "aria-label": "量子对称性结果" }); shell.appendChild(evidence); root.replaceChildren(shell);

    function announce(message) { if (api && typeof api.announce === "function") api.announce(root, message); }
    function clearState() { state.predictions = Object.create(null); state.revealed = false; evidence.hidden = true; clear(evidence); }
    function renderQuestions() {
      clear(questionList);
      QUESTIONS.forEach(function (question, index) {
        var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + question.prompt }));
        var options = element(doc, "div", { className: "qs-options", role: "group", "aria-label": question.prompt });
        question.options.forEach(function (option) { var button = element(doc, "button", { type: "button", "aria-pressed": state.predictions[question.key] === option ? "true" : "false", text: option }); button.addEventListener("click", function () { state.predictions[question.key] = option; state.revealed = false; evidence.hidden = true; renderQuestions(); }); options.appendChild(button); });
        fieldset.appendChild(options); questionList.appendChild(fieldset);
      });
    }
    function render() {
      repSelect.value = String(state.j); hSelect.value = state.hamiltonianId; renderQuestions();
      if (state.revealed) { evidence.hidden = false; renderEvidence(doc, evidence, representationDiagnostics(state.j), hamiltonianAnalysis(state.hamiltonianId)); }
    }
    repSelect.addEventListener("change", function () { state.j = Number(repSelect.value); clearState(); render(); status.textContent = "已切换表示；请重新预测。"; status.className = "qs-status"; announce("已切换自旋表示，请重新预测。"); });
    hSelect.addEventListener("change", function () { state.hamiltonianId = hSelect.value; clearState(); render(); status.textContent = "已切换 toy Hamiltonian；请重新预测。"; status.className = "qs-status"; announce("已切换 toy Hamiltonian，请重新预测。"); });
    reveal.addEventListener("click", function () {
      if (!QUESTIONS.every(function (question) { return state.predictions[question.key] !== undefined; })) { status.textContent = "请先回答三道预测题。"; status.className = "qs-status qs-warn"; announce("还有预测题未回答。"); return; }
      var score = QUESTIONS.reduce(function (total, question) { return total + (state.predictions[question.key] === question.answer ? 1 : 0); }, 0);
      state.revealed = true; evidence.hidden = false; renderEvidence(doc, evidence, representationDiagnostics(state.j), hamiltonianAnalysis(state.hamiltonianId));
      status.textContent = "预测得分 " + score + "/3；表示恒等式与 toy Hamiltonian 诊断已分开显示。"; status.className = "qs-status " + (score === 3 ? "qs-pass" : "qs-warn"); announce("量子对称性证书已揭晓，预测得分 " + score + "/3。");
    });
    reset.addEventListener("click", function () { state.j = 0.5; state.hamiltonianId = "degenerate"; clearState(); render(); status.textContent = "已回到 j=1/2 与 H0；预测状态已清空。"; status.className = "qs-status"; announce("实验已重置。"); });
    render();
  }

  function assert(condition, message) { if (!condition) throw new Error("quantum-symmetry: " + message); }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    [0.5, 1].forEach(function (j) {
      var report = representationDiagnostics(j);
      check(report.dimension === 2 * j + 1, "j=" + j + " dimension");
      check(report.commutatorResiduals.xy < 1e-10 && report.commutatorResiduals.yz < 1e-10 && report.commutatorResiduals.zx < 1e-10, "j=" + j + " su(2) commutators");
      check(report.casimirResidual < 1e-10, "j=" + j + " Casimir");
    });
    var h0 = hamiltonianAnalysis("degenerate");
    var hz = hamiltonianAnalysis("axial");
    var tilt = hamiltonianAnalysis("tilted");
    check(h0.commutatorResidual < EPSILON && h0.degeneracy === 2, "H0 commuting doublet");
    check(hz.commutatorResidual < EPSILON && hz.degeneracy === 1, "Hz commutes without degeneracy");
    check(tilt.commutatorResidual > 0.01 && tilt.degeneracy === 1, "tilted symmetry breaking");
    [-1, 0, 1].forEach(function (q) {
      var rows = selectionLedger(0.5, q);
      check(rows.some(function (row) { return row.predictedAllowed && !row.exactZero; }), "q=" + q + " has allowed matrix element");
      check(rows.filter(function (row) { return row.predictedAllowed; }).every(function (row) { return !row.exactZero; }), "q=" + q + " allowed selection entries");
      check(rows.filter(function (row) { return !row.predictedAllowed; }).every(function (row) { return row.exactZero; }), "q=" + q + " forbidden selection entries");
    });
    check(allSelectionRows(0.5).length === 12, "selection ledger row count");
    check(JSON.stringify(hamiltonianAnalysis("tilted").eigenvalues) === JSON.stringify(hamiltonianAnalysis("tilted").eigenvalues), "fixed Hamiltonian replay");
    var rejected = false;
    try { spinMatrices(0.6); } catch (error) { rejected = true; }
    check(rejected, "non-half-integer spin rejected");
    return { checks: checks, representations: 2, hamiltonians: HAMILTONIANS.length };
  }

  return { HAMILTONIANS: HAMILTONIANS, spinMatrices: spinMatrices, representationDiagnostics: representationDiagnostics, hamiltonianMatrix: hamiltonianMatrix, hamiltonianAnalysis: hamiltonianAnalysis, selectionLedger: selectionLedger, allSelectionRows: allSelectionRows, mount: mount, selfTest: selfTest };
});

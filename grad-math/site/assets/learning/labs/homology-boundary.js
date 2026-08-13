(function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "homology-boundary-lab-styles";
  var INSTANCE = 0;

  /*
   * This lab is intentionally a finite, 2-dimensional simplicial-complex
   * model over F_2.  Orientation and signs are not stored: every boundary
   * matrix is a 0/1 matrix and all arithmetic below is modulo two.
   */
  var PRESETS = [
    {
      id: "solid-triangle",
      label: "实心三角形",
      description: "三条边加一个 2-simplex；环被面填掉。",
      vertices: [
        { id: "v0", label: "v₀", x: 105, y: 58 },
        { id: "v1", label: "v₁", x: 285, y: 58 },
        { id: "v2", label: "v₂", x: 195, y: 220 }
      ],
      edges: [
        { id: "e01", label: "e₀₁", vertices: [0, 1] },
        { id: "e12", label: "e₁₂", vertices: [1, 2] },
        { id: "e20", label: "e₂₀", vertices: [2, 0] }
      ],
      faces: [
        { id: "f012", label: "f₀₁₂", vertices: [0, 1, 2] }
      ],
      defaultChain: ["e01", "e12", "e20"]
    },
    {
      id: "hollow-triangle",
      label: "只有三角边界",
      description: "三条边没有 2-simplex；同一条圈不能填。",
      vertices: [
        { id: "v0", label: "v₀", x: 105, y: 58 },
        { id: "v1", label: "v₁", x: 285, y: 58 },
        { id: "v2", label: "v₂", x: 195, y: 220 }
      ],
      edges: [
        { id: "e01", label: "e₀₁", vertices: [0, 1] },
        { id: "e12", label: "e₁₂", vertices: [1, 2] },
        { id: "e20", label: "e₂₀", vertices: [2, 0] }
      ],
      faces: [],
      defaultChain: ["e01", "e12", "e20"]
    },
    {
      id: "triangle-plus-isolated",
      label: "三角环 + 孤立点",
      description: "一个 1-cycle 与一个不相连的顶点；β₀ 变成 2。",
      vertices: [
        { id: "v0", label: "v₀", x: 105, y: 58 },
        { id: "v1", label: "v₁", x: 285, y: 58 },
        { id: "v2", label: "v₂", x: 195, y: 220 },
        { id: "v3", label: "v₃", x: 455, y: 140 }
      ],
      edges: [
        { id: "e01", label: "e₀₁", vertices: [0, 1] },
        { id: "e12", label: "e₁₂", vertices: [1, 2] },
        { id: "e20", label: "e₂₀", vertices: [2, 0] }
      ],
      faces: [],
      defaultChain: ["e01", "e12", "e20"]
    },
    {
      id: "tetrahedron-surface",
      label: "四面体表面",
      description: "四个三角面组成 S² 的三角剖分；存在 2-cycle。",
      vertices: [
        { id: "v0", label: "v₀", x: 112, y: 64 },
        { id: "v1", label: "v₁", x: 292, y: 64 },
        { id: "v2", label: "v₂", x: 342, y: 220 },
        { id: "v3", label: "v₃", x: 170, y: 250 }
      ],
      edges: [
        { id: "e01", label: "e₀₁", vertices: [0, 1] },
        { id: "e02", label: "e₀₂", vertices: [0, 2] },
        { id: "e03", label: "e₀₃", vertices: [0, 3] },
        { id: "e12", label: "e₁₂", vertices: [1, 2] },
        { id: "e13", label: "e₁₃", vertices: [1, 3] },
        { id: "e23", label: "e₂₃", vertices: [2, 3] }
      ],
      faces: [
        { id: "f012", label: "f₀₁₂", vertices: [0, 1, 2] },
        { id: "f013", label: "f₀₁₃", vertices: [0, 1, 3] },
        { id: "f023", label: "f₀₂₃", vertices: [0, 2, 3] },
        { id: "f123", label: "f₁₂₃", vertices: [1, 2, 3] }
      ],
      defaultChain: ["e01", "e12", "e02"]
    }
  ];

  function fail(message) {
    throw new Error("homology-boundary: " + message);
  }

  function isInteger(value) {
    return Number.isInteger ? Number.isInteger(value) : isFinite(value) && Math.floor(value) === value;
  }

  function bit(value) {
    var number = Number(value);
    if (!isFinite(number)) fail("matrix entries must be finite");
    return Math.abs(Math.floor(number)) % 2;
  }

  function zeros(rows, columns) {
    var result = [];
    for (var row = 0; row < rows; row += 1) {
      result.push(new Array(columns).fill(0));
    }
    return result;
  }

  function cloneMatrix(matrix) {
    return matrix.map(function (row) { return row.slice(); });
  }

  function clonePreset(preset) {
    return {
      id: preset.id,
      label: preset.label,
      description: preset.description,
      vertices: preset.vertices.map(function (vertex) {
        return { id: vertex.id, label: vertex.label, x: vertex.x, y: vertex.y };
      }),
      edges: preset.edges.map(function (edge) {
        return { id: edge.id, label: edge.label, vertices: edge.vertices.slice() };
      }),
      faces: preset.faces.map(function (face) {
        return { id: face.id, label: face.label, vertices: face.vertices.slice() };
      }),
      defaultChain: preset.defaultChain.slice()
    };
  }

  function presetById(id) {
    for (var index = 0; index < PRESETS.length; index += 1) {
      if (PRESETS[index].id === id) return PRESETS[index];
    }
    fail("unknown preset: " + id);
  }

  function sourceComplex(input) {
    if (typeof input === "string") return presetById(input);
    if (input && input.complex) return input.complex;
    if (input && Array.isArray(input.vertices) && Array.isArray(input.edges)) return input;
    fail("expected a preset id or a simplicial complex");
  }

  function pairKey(left, right) {
    return left < right ? left + ":" + right : right + ":" + left;
  }

  function vertexIndex(value, count, label) {
    var index = typeof value === "number" ? value : Number(value);
    if (!isInteger(index) || index < 0 || index >= count) fail(label + " has an invalid vertex");
    return index;
  }

  function normalizeComplex(input) {
    var source = sourceComplex(input);
    var rawVertices = Array.isArray(source.vertices) ? source.vertices : [];
    if (rawVertices.length === 0) fail("a complex needs at least one vertex");

    var vertices = rawVertices.map(function (vertex, index) {
      var object = vertex && typeof vertex === "object" ? vertex : { label: String(vertex) };
      return {
        id: object.id === undefined ? "v" + index : String(object.id),
        label: object.label === undefined ? "v" + index : String(object.label),
        x: Number.isFinite(Number(object.x)) ? Number(object.x) : 80 + (index % 4) * 150,
        y: Number.isFinite(Number(object.y)) ? Number(object.y) : 70 + Math.floor(index / 4) * 120
      };
    });

    var edgeMap = Object.create(null);
    var edges = (source.edges || []).map(function (edge, index) {
      var raw = edge && typeof edge === "object" && Array.isArray(edge.vertices) ? edge.vertices : edge;
      if (!Array.isArray(raw) || raw.length !== 2) fail("edge " + index + " must have two vertices");
      var left = vertexIndex(raw[0], vertices.length, "edge " + index);
      var right = vertexIndex(raw[1], vertices.length, "edge " + index);
      if (left === right) fail("edge " + index + " has repeated vertices");
      var key = pairKey(left, right);
      if (edgeMap[key] !== undefined) fail("duplicate edge " + key);
      edgeMap[key] = index;
      return {
        id: edge && typeof edge === "object" && edge.id !== undefined ? String(edge.id) : "e" + index,
        label: edge && typeof edge === "object" && edge.label !== undefined ? String(edge.label) : "e" + index,
        vertices: [left, right]
      };
    });

    var faces = (source.faces || []).map(function (face, index) {
      var raw = face && typeof face === "object" && Array.isArray(face.vertices) ? face.vertices : face;
      if (!Array.isArray(raw) || raw.length !== 3) fail("face " + index + " must be a triangle");
      var faceVertices = raw.map(function (value) { return vertexIndex(value, vertices.length, "face " + index); });
      if (faceVertices[0] === faceVertices[1] || faceVertices[1] === faceVertices[2] || faceVertices[0] === faceVertices[2]) {
        fail("face " + index + " has repeated vertices");
      }
      var boundaryPairs = [
        [faceVertices[0], faceVertices[1]],
        [faceVertices[1], faceVertices[2]],
        [faceVertices[2], faceVertices[0]]
      ];
      var edgeIndices = boundaryPairs.map(function (pair) {
        var edgeIndex = edgeMap[pairKey(pair[0], pair[1])];
        if (edgeIndex === undefined) fail("face " + index + " uses a missing edge");
        return edgeIndex;
      });
      return {
        id: face && typeof face === "object" && face.id !== undefined ? String(face.id) : "f" + index,
        label: face && typeof face === "object" && face.label !== undefined ? String(face.label) : "f" + index,
        vertices: faceVertices,
        edgeIndices: edgeIndices
      };
    });

    var defaultChain = Array.isArray(source.defaultChain) ? source.defaultChain.slice() : [];
    return {
      id: source.id === undefined ? "custom" : String(source.id),
      label: source.label === undefined ? "自定义复形" : String(source.label),
      description: source.description === undefined ? "" : String(source.description),
      vertices: vertices,
      edges: edges,
      faces: faces,
      defaultChain: defaultChain
    };
  }

  function buildBoundaryMatrices(input) {
    var complex = normalizeComplex(input);
    var boundary1 = zeros(complex.vertices.length, complex.edges.length);
    complex.edges.forEach(function (edge, edgeIndex) {
      boundary1[edge.vertices[0]][edgeIndex] = 1;
      boundary1[edge.vertices[1]][edgeIndex] = 1;
    });

    var boundary2 = zeros(complex.edges.length, complex.faces.length);
    complex.faces.forEach(function (face, faceIndex) {
      face.edgeIndices.forEach(function (edgeIndex) {
        boundary2[edgeIndex][faceIndex] = 1;
      });
    });

    return {
      complex: complex,
      boundary1: boundary1,
      boundary2: boundary2,
      rowLabels1: complex.vertices.map(function (vertex) { return vertex.label; }),
      columnLabels1: complex.edges.map(function (edge) { return edge.label; }),
      rowLabels2: complex.edges.map(function (edge) { return edge.label; }),
      columnLabels2: complex.faces.map(function (face) { return face.label; })
    };
  }

  function rrefGF2(matrix) {
    var result = cloneMatrix(matrix).map(function (row) { return row.map(bit); });
    var rows = result.length;
    var columns = rows === 0 ? 0 : result[0].length;
    var pivotColumns = [];
    var pivotRow = 0;

    for (var column = 0; column < columns && pivotRow < rows; column += 1) {
      var found = -1;
      for (var row = pivotRow; row < rows; row += 1) {
        if (result[row][column] === 1) {
          found = row;
          break;
        }
      }
      if (found === -1) continue;
      if (found !== pivotRow) {
        var swap = result[found];
        result[found] = result[pivotRow];
        result[pivotRow] = swap;
      }
      for (var eliminate = 0; eliminate < rows; eliminate += 1) {
        if (eliminate === pivotRow || result[eliminate][column] === 0) continue;
        for (var entry = column; entry < columns; entry += 1) {
          result[eliminate][entry] = (result[eliminate][entry] + result[pivotRow][entry]) % 2;
        }
      }
      pivotColumns.push(column);
      pivotRow += 1;
    }

    return { matrix: result, rank: pivotRow, pivotColumns: pivotColumns };
  }

  function rankGF2(matrix) {
    return rrefGF2(matrix).rank;
  }

  function columnCount(matrix) {
    return matrix.length === 0 ? 0 : matrix[0].length;
  }

  function kernelDimensionGF2(matrix) {
    return columnCount(matrix) - rankGF2(matrix);
  }

  function multiplyMod2(left, right) {
    var leftRows = left.length;
    var leftColumns = leftRows === 0 ? 0 : left[0].length;
    var rightRows = right.length;
    var rightColumns = rightRows === 0 ? 0 : right[0].length;
    if (leftColumns !== rightRows) fail("matrix dimensions do not multiply");
    var result = zeros(leftRows, rightColumns);
    for (var row = 0; row < leftRows; row += 1) {
      for (var column = 0; column < rightColumns; column += 1) {
        var total = 0;
        for (var middle = 0; middle < leftColumns; middle += 1) {
          total += bit(left[row][middle]) * bit(right[middle][column]);
        }
        result[row][column] = total % 2;
      }
    }
    return result;
  }

  function multiplyVectorMod2(matrix, vector) {
    var columns = columnCount(matrix);
    if (columns !== vector.length) fail("matrix and vector dimensions do not match");
    return matrix.map(function (row) {
      var total = 0;
      for (var index = 0; index < columns; index += 1) total += bit(row[index]) * bit(vector[index]);
      return total % 2;
    });
  }

  function solveMod2(matrix, vector) {
    if (matrix.length !== vector.length) fail("linear-system dimensions do not match");
    var columns = columnCount(matrix);
    var augmented = matrix.map(function (row, index) {
      return row.map(bit).concat([bit(vector[index])]);
    });
    var reduced = rrefGF2(augmented).matrix;
    var solution = new Array(columns).fill(0);
    for (var row = 0; row < reduced.length; row += 1) {
      var pivot = -1;
      for (var column = 0; column < columns; column += 1) {
        if (reduced[row][column] === 1) {
          pivot = column;
          break;
        }
      }
      if (pivot === -1 && reduced[row][columns] === 1) {
        return { consistent: false, solution: null };
      }
      if (pivot !== -1) solution[pivot] = reduced[row][columns];
    }
    return { consistent: true, solution: solution };
  }

  function matrixIsZero(matrix) {
    return matrix.every(function (row) {
      return row.every(function (entry) { return bit(entry) === 0; });
    });
  }

  function edgeVector(complex, chain) {
    var vector = new Array(complex.edges.length).fill(0);
    if (chain === undefined || chain === null) chain = complex.defaultChain;
    if (Array.isArray(chain)) {
      var isBitVector = chain.length === complex.edges.length && chain.every(function (entry) {
        return typeof entry === "number" || entry === 0 || entry === 1;
      });
      if (isBitVector) return chain.map(bit);
      chain.forEach(function (edgeId) {
        var index = complex.edges.findIndex(function (edge) { return edge.id === String(edgeId); });
        if (index === -1) fail("unknown chain edge: " + edgeId);
        vector[index] = 1;
      });
      return vector;
    }
    if (chain && typeof chain === "object") {
      complex.edges.forEach(function (edge, index) { vector[index] = bit(chain[edge.id]); });
      return vector;
    }
    fail("chain must be an edge id list or a bit vector");
  }

  function analyze(input, chain) {
    var matrices = buildBoundaryMatrices(input);
    var complex = matrices.complex;
    var chainVector = edgeVector(complex, chain);
    var boundaryOfChain = multiplyVectorMod2(matrices.boundary1, chainVector);
    var boundaryWitness = solveMod2(matrices.boundary2, chainVector);
    var isCycle = boundaryOfChain.every(function (entry) { return entry === 0; });
    var inImage = boundaryWitness.consistent;
    var classification = !isCycle ? "not-cycle" : inImage ? "boundary" : "homology-class";
    var rank1 = rankGF2(matrices.boundary1);
    var rank2 = rankGF2(matrices.boundary2);
    var product = multiplyMod2(matrices.boundary1, matrices.boundary2);
    var betti = {
      beta0: complex.vertices.length - rank1,
      beta1: complex.edges.length - rank1 - rank2,
      beta2: complex.faces.length - rank2
    };
    var euler = complex.vertices.length - complex.edges.length + complex.faces.length;
    return {
      complex: complex,
      matrices: {
        boundary1: matrices.boundary1,
        boundary2: matrices.boundary2,
        product: product
      },
      labels: {
        boundary1Rows: matrices.rowLabels1,
        boundary1Columns: matrices.columnLabels1,
        boundary2Rows: matrices.rowLabels2,
        boundary2Columns: matrices.columnLabels2
      },
      ranks: { boundary1: rank1, boundary2: rank2 },
      kernelDimensions: {
        boundary1: complex.edges.length - rank1,
        boundary2: complex.faces.length - rank2
      },
      betti: betti,
      euler: euler,
      eulerFromBetti: betti.beta0 - betti.beta1 + betti.beta2,
      boundarySquareZero: matrixIsZero(product),
      chain: chainVector,
      boundaryOfChain: boundaryOfChain,
      isCycle: isCycle,
      inImage: inImage,
      isBoundary: isCycle && inImage,
      classification: classification,
      boundaryWitness: inImage ? boundaryWitness.solution : null
    };
  }

  function closeEnough(left, right) {
    return left === right;
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      if (!condition) fail("self-test failed: " + message);
    }
    function allBinary(matrix) {
      return matrix.every(function (row) {
        return row.every(function (entry) { return entry === 0 || entry === 1; });
      });
    }
    function expected(id, beta) {
      var report = analyze(id);
      check(JSON.stringify([report.betti.beta0, report.betti.beta1, report.betti.beta2]) === JSON.stringify(beta), id + " Betti numbers");
      check(report.boundarySquareZero, id + " boundary square zero");
      check(allBinary(report.matrices.boundary1) && allBinary(report.matrices.boundary2), id + " binary boundary matrices");
      check(report.euler === report.eulerFromBetti, id + " Euler reconciliation");
      check(report.kernelDimensions.boundary1 + report.ranks.boundary1 === report.complex.edges.length, id + " rank-nullity for boundary1");
      check(report.kernelDimensions.boundary2 + report.ranks.boundary2 === report.complex.faces.length, id + " rank-nullity for boundary2");
      return report;
    }

    check(PRESETS.length >= 4, "at least four presets");
    var solid = expected("solid-triangle", [1, 0, 0]);
    var hollow = expected("hollow-triangle", [1, 1, 0]);
    var ring = expected("triangle-plus-isolated", [2, 1, 0]);
    var tetra = expected("tetrahedron-surface", [1, 0, 1]);

    check(solid.ranks.boundary1 === 2 && solid.ranks.boundary2 === 1, "solid ranks");
    check(hollow.ranks.boundary1 === 2 && hollow.ranks.boundary2 === 0, "hollow ranks");
    check(ring.ranks.boundary1 === 2 && ring.ranks.boundary2 === 0, "ring ranks");
    check(tetra.ranks.boundary1 === 3 && tetra.ranks.boundary2 === 3, "tetrahedron ranks");
    check(tetra.kernelDimensions.boundary2 === 1, "tetrahedron has a 2-cycle");

    var solidChain = analyze("solid-triangle", ["e01", "e12", "e20"]);
    var hollowChain = analyze("hollow-triangle", ["e01", "e12", "e20"]);
    var ringChain = analyze("triangle-plus-isolated", ["e01", "e12", "e20"]);
    var tetraFace = analyze("tetrahedron-surface", ["e01", "e12", "e02"]);
    var oneEdge = analyze("hollow-triangle", ["e01"]);
    check(solidChain.isCycle && solidChain.isBoundary && solidChain.classification === "boundary", "solid triangle is a boundary");
    check(hollowChain.isCycle && !hollowChain.isBoundary && hollowChain.classification === "homology-class", "hollow triangle is a non-boundary cycle");
    check(ringChain.isCycle && !ringChain.isBoundary && ringChain.classification === "homology-class", "ring cycle survives");
    check(tetraFace.isCycle && tetraFace.isBoundary, "tetrahedron face boundary");
    check(!oneEdge.isCycle && oneEdge.classification === "not-cycle", "one edge is not a cycle");
    check(closeEnough(solidChain.boundaryOfChain[0], 0) && solidChain.boundaryOfChain[1] === 0 && solidChain.boundaryOfChain[2] === 0, "solid chain has zero boundary");
    check(JSON.stringify(solidChain.boundaryWitness) === "[1]", "solid chain has the face as witness");
    check(JSON.stringify(hollow.matrices.boundary1) === JSON.stringify([
      [1, 0, 1],
      [1, 1, 0],
      [0, 1, 1]
    ]), "triangle boundary1 matrix");
    check(JSON.stringify(solid.matrices.boundary2) === JSON.stringify([[1], [1], [1]]), "solid triangle boundary2 matrix");

    return { ok: true, checks: checks, presets: PRESETS.length };
  }

  var pureModel = {
    PRESETS: PRESETS.map(clonePreset),
    getPreset: function (id) { return clonePreset(presetById(id)); },
    normalizeComplex: normalizeComplex,
    buildBoundaryMatrices: buildBoundaryMatrices,
    rrefGF2: rrefGF2,
    rankGF2: rankGF2,
    kernelDimensionGF2: kernelDimensionGF2,
    multiplyMod2: multiplyMod2,
    analyze: analyze,
    selfTest: selfTest
  };

  if (typeof module === "object" && module.exports) {
    module.exports = pureModel;
    if (typeof require !== "undefined" && require.main === module && process.argv.indexOf("--self-test") !== -1) {
      try {
        var report = selfTest();
        console.log("homology-boundary self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
      } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
      }
    }
    return;
  }

  if (!host || !host.CourseLearning || typeof host.CourseLearning.register !== "function") return;

  function setAttributes(node, attributes) {
    Object.keys(attributes || {}).forEach(function (key) {
      var value = attributes[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
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

  function installStyles(doc) {
    if (doc.getElementById && doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".cl-homology { --hb-bg: var(--bg, #fff); --hb-panel: var(--block-bg, #f4f1e9); --hb-fg: var(--fg, #292722); --hb-muted: var(--fg-soft, #6b6557); --hb-border: var(--border, #d7d0c2); --hb-accent: var(--accent, #315f9d); --hb-good: var(--cl-green, #39734d); --hb-warn: var(--cl-red, #b64335); --hb-gold: var(--cl-gold, #9b6a12); width: 100%; max-width: 100%; box-sizing: border-box; margin: 0; padding: 16px; border: 1px solid var(--hb-border); border-radius: 8px; background: var(--hb-bg); color: var(--hb-fg); font-size: 14px; line-height: 1.55; overflow: hidden; }",
      "html[data-theme=dark] .cl-homology { --hb-accent: var(--accent, #83c8ff); --hb-good: var(--cl-green, #72bd8b); --hb-warn: var(--cl-red, #f08c7d); --hb-gold: var(--cl-gold, #e2b458); }",
      ".cl-homology *, .cl-homology *::before, .cl-homology *::after { box-sizing: border-box; }",
      ".cl-homology .hb-shell, .cl-homology .hb-controls, .cl-homology .hb-stage { min-width: 0; }",
      ".cl-homology .hb-heading { margin: 0 0 5px; color: var(--hb-fg); font-size: 1.22rem; line-height: 1.35; }",
      ".cl-homology .hb-intro, .cl-homology .hb-note { margin: 7px 0; color: var(--hb-muted); }",
      ".cl-homology .hb-preset-box { margin: 14px 0; padding: 0; border: 0; }",
      ".cl-homology .hb-preset-box legend { margin-bottom: 7px; color: var(--hb-muted); font-weight: 700; }",
      ".cl-homology .hb-preset-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }",
      ".cl-homology button { min-width: 0; min-height: 44px; padding: 8px 10px; border: 1px solid var(--hb-border); border-radius: 6px; background: var(--hb-panel); color: var(--hb-fg); font: inherit; line-height: 1.3; cursor: pointer; }",
      ".cl-homology button:hover:not(:disabled) { border-color: var(--hb-accent); }",
      ".cl-homology button[aria-pressed=true], .cl-homology .hb-primary { border-color: var(--hb-accent); background: var(--hb-accent); color: var(--hb-bg); font-weight: 700; }",
      ".cl-homology button:disabled { cursor: not-allowed; opacity: .55; }",
      ".cl-homology button:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
      ".cl-homology .hb-preset { min-height: 58px; text-align: left; }",
      ".cl-homology .hb-preset small { display: block; margin-top: 3px; color: var(--hb-muted); font-size: 11px; line-height: 1.3; }",
      ".cl-homology .hb-preset[aria-pressed=true] small { color: var(--hb-bg); }",
      ".cl-homology .hb-layout { display: grid; grid-template-columns: minmax(200px, .78fr) minmax(0, 1.22fr); gap: 16px; align-items: start; }",
      ".cl-homology .hb-section { margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--hb-border); }",
      ".cl-homology .hb-section:first-child { margin-top: 0; padding-top: 0; border-top: 0; }",
      ".cl-homology h4 { margin: 0 0 7px; color: var(--hb-fg); font-size: 1rem; }",
      ".cl-homology .hb-edge-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; }",
      ".cl-homology .hb-edge-button { min-height: 48px; }",
      ".cl-homology .hb-action-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; margin-top: 8px; }",
      ".cl-homology .hb-selection { margin: 9px 0 0; padding: 9px 10px; border-left: 3px solid var(--hb-gold); background: var(--hb-panel); color: var(--hb-muted); overflow-wrap: anywhere; }",
      ".cl-homology .hb-stage-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px; }",
      ".cl-homology .hb-stage-title { color: var(--hb-muted); font-size: 12.5px; }",
      ".cl-homology .hb-graph-wrap { max-width: 100%; padding: 7px; border: 1px solid var(--hb-border); border-radius: 7px; background: var(--hb-bg); overflow: hidden; }",
      ".cl-homology .hb-svg { display: block; width: 100%; max-width: 100%; height: auto; color: var(--hb-fg); }",
      ".cl-homology .hb-svg text { fill: currentColor; font-family: inherit; letter-spacing: 0; }",
      ".cl-homology .hb-face { fill: var(--hb-accent); fill-opacity: .14; stroke: var(--hb-border); stroke-width: 1.5; }",
      ".cl-homology .hb-face-1 { fill: var(--hb-good); } .cl-homology .hb-face-2 { fill: var(--hb-gold); } .cl-homology .hb-face-3 { fill: var(--hb-warn); }",
      ".cl-homology .hb-edge { stroke: var(--hb-muted); stroke-width: 4; stroke-linecap: round; }",
      ".cl-homology .hb-edge-selected { stroke: var(--hb-warn); stroke-width: 7; }",
      ".cl-homology .hb-vertex { fill: var(--hb-bg); stroke: var(--hb-accent); stroke-width: 3; }",
      ".cl-homology .hb-vertex-boundary { fill: var(--hb-gold); stroke: var(--hb-warn); stroke-width: 4; }",
      ".cl-homology .hb-vertex-label { font-size: 16px; font-weight: 750; }",
      ".cl-homology .hb-edge-label { fill: var(--hb-muted) !important; font-size: 12px; font-weight: 650; }",
      ".cl-homology .hb-face-label { fill: var(--hb-muted) !important; font-size: 12px; }",
      ".cl-homology .hb-graph-legend { display: flex; flex-wrap: wrap; gap: 5px 12px; margin: 7px 2px 0; color: var(--hb-muted); font-size: 11.5px; }",
      ".cl-homology .hb-legend-item { display: inline-flex; align-items: center; gap: 5px; }",
      ".cl-homology .hb-swatch { display: inline-block; width: 14px; height: 10px; border-radius: 2px; background: var(--hb-muted); }",
      ".cl-homology .hb-swatch-selected { background: var(--hb-warn); } .cl-homology .hb-swatch-face { background: var(--hb-accent); opacity: .55; } .cl-homology .hb-swatch-boundary { background: var(--hb-gold); border: 2px solid var(--hb-warn); }",
      ".cl-homology .hb-verdict { margin-top: 12px; padding: 10px 11px; border-left: 4px solid var(--hb-gold); background: var(--hb-panel); }",
      ".cl-homology .hb-verdict[data-kind=boundary] { border-color: var(--hb-good); } .cl-homology .hb-verdict[data-kind=homology-class] { border-color: var(--hb-accent); } .cl-homology .hb-verdict[data-kind=not-cycle] { border-color: var(--hb-warn); }",
      ".cl-homology .hb-verdict strong { color: var(--hb-fg); }",
      ".cl-homology .hb-verdict p { margin: 4px 0; }",
      ".cl-homology .hb-good { color: var(--hb-good); font-weight: 700; } .cl-homology .hb-warn { color: var(--hb-warn); font-weight: 700; }",
      ".cl-homology .hb-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; margin: 12px 0; }",
      ".cl-homology .hb-metric { min-width: 0; padding: 9px; border-top: 2px solid var(--hb-border); background: var(--hb-panel); }",
      ".cl-homology .hb-metric span { display: block; color: var(--hb-muted); font-size: 11px; line-height: 1.35; }",
      ".cl-homology .hb-metric strong { display: block; margin-top: 3px; color: var(--hb-fg); font-size: 16px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }",
      ".cl-homology .hb-matrix-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 13px; }",
      ".cl-homology .hb-matrix-card { min-width: 0; padding: 10px; border: 1px solid var(--hb-border); border-radius: 6px; background: var(--hb-panel); }",
      ".cl-homology .hb-matrix-card h4 { margin-bottom: 2px; }",
      ".cl-homology .hb-matrix-note { margin: 5px 0 0; color: var(--hb-muted); font-size: 11.5px; }",
      ".cl-homology .hb-table-wrap { max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }",
      ".cl-homology table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 11.5px; font-variant-numeric: tabular-nums; }",
      ".cl-homology th, .cl-homology td { padding: 5px 3px; border-bottom: 1px solid var(--hb-border); text-align: center; overflow-wrap: anywhere; }",
      ".cl-homology th { color: var(--hb-muted); font-weight: 700; } .cl-homology th:first-child { text-align: left; }",
      ".cl-homology td { color: var(--hb-fg); }",
      ".cl-homology .hb-ledger { margin-top: 13px; } .cl-homology .hb-ledger table th:first-child, .cl-homology .hb-ledger table td:first-child { text-align: left; width: 27%; } .cl-homology .hb-ledger table th:last-child, .cl-homology .hb-ledger table td:last-child { text-align: left; width: 47%; }",
      ".cl-homology .hb-check { margin-top: 9px; color: var(--hb-good); font-weight: 700; }",
      ".cl-homology .hb-check-fail { color: var(--hb-warn); }",
      ".cl-homology .hb-sr-only { position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip: rect(0, 0, 0, 0) !important; white-space: nowrap !important; border: 0 !important; }",
      "@media (max-width: 700px) { .cl-homology { margin-left: -8px; margin-right: -8px; width: calc(100% + 16px); padding: 14px; } .cl-homology .hb-layout { grid-template-columns: minmax(0, 1fr); } .cl-homology .hb-matrix-grid { grid-template-columns: minmax(0, 1fr); } .cl-homology .hb-metrics { grid-template-columns: repeat(3, minmax(0, 1fr)); } }",
      "@media (max-width: 390px) { .cl-homology .hb-preset-grid, .cl-homology .hb-edge-grid, .cl-homology .hb-action-row { grid-template-columns: minmax(0, 1fr); } .cl-homology .hb-metrics { grid-template-columns: minmax(0, 1fr); } .cl-homology table { font-size: 10.5px; } }",
      "@media (prefers-reduced-motion: reduce) { .cl-homology * { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }"
    ].join("\n");
    (doc.head || doc.documentElement).appendChild(style);
  }

  function textVector(values) {
    return "(" + values.join(", ") + ")";
  }

  function selectedLabels(report) {
    return report.complex.edges.filter(function (edge, index) { return report.chain[index] === 1; }).map(function (edge) { return edge.label; });
  }

  function classificationLabel(classification) {
    if (classification === "boundary") return "boundary（边界）∈ B₁ = im ∂₂";
    if (classification === "homology-class") return "homology class（非边界 cycle，代表非零 [c] ∈ H₁）";
    return "not a cycle（不是 cycle，不属于 Z₁）";
  }

  function renderMatrix(doc, title, subtitle, rows, columns, matrix, rank, kernelDimension) {
    var card = element(doc, "section", { className: "hb-matrix-card" });
    card.appendChild(element(doc, "h4", { text: title }));
    card.appendChild(element(doc, "p", { className: "hb-matrix-note", text: subtitle }));
    if (columns.length === 0) {
      card.appendChild(element(doc, "p", { className: "hb-matrix-note", text: "矩阵形状 " + rows.length + " × 0：C₂=0，因此没有面列。" }));
    } else {
      var wrapper = element(doc, "div", { className: "hb-table-wrap" });
      var table = element(doc, "table", { className: "hb-matrix" });
      table.appendChild(element(doc, "caption", { className: "hb-sr-only", text: title + " 矩阵" }));
      var head = element(doc, "tr");
      head.appendChild(element(doc, "th", { scope: "col", text: "" }));
      columns.forEach(function (column) { head.appendChild(element(doc, "th", { scope: "col", text: column })); });
      table.appendChild(element(doc, "thead", {}, head));
      var body = element(doc, "tbody");
      matrix.forEach(function (row, rowIndex) {
        var tableRow = element(doc, "tr");
        tableRow.appendChild(element(doc, "th", { scope: "row", text: rows[rowIndex] }));
        row.forEach(function (entry) { tableRow.appendChild(element(doc, "td", { text: String(entry) })); });
        body.appendChild(tableRow);
      });
      table.appendChild(body);
      wrapper.appendChild(table);
      card.appendChild(wrapper);
    }
    card.appendChild(element(doc, "p", { className: "hb-matrix-note", text: "rank = " + rank + "；ker 维数 = " + kernelDimension }));
    return card;
  }

  function replaceRenderedRoot(root, next) {
    var liveRegion = root.querySelector ? root.querySelector("[data-cl-live]") : null;
    var current = root.querySelector ? root.querySelector(":scope > .hb-shell") : null;
    if (current) root.replaceChild(next, current);
    else if (liveRegion && liveRegion.parentNode === root) root.insertBefore(next, liveRegion);
    else root.appendChild(next);
  }

  function renderGraph(doc, report, serial) {
    var complex = report.complex;
    var positions = complex.vertices.map(function (vertex) { return { x: vertex.x, y: vertex.y }; });
    var svg = svgElement(doc, "svg", {
      className: "hb-svg",
      viewBox: "0 0 640 300",
      role: "img",
      "aria-label": complex.label + " 的顶点、边、面和当前 1-chain"
    });
    svg.appendChild(svgElement(doc, "title", { id: "hb-svg-title-" + serial }, complex.label + " 的单纯复形"));
    svg.appendChild(svgElement(doc, "desc", { id: "hb-svg-desc-" + serial }, "橙色边是当前选择的 1-chain；金色顶点是其边界 ∂₁c 的非零位置。"));

    complex.faces.forEach(function (face, faceIndex) {
      var points = face.vertices.map(function (vertexIndex) { return positions[vertexIndex].x + "," + positions[vertexIndex].y; }).join(" ");
      svg.appendChild(svgElement(doc, "polygon", { points: points, className: "hb-face hb-face-" + (faceIndex % 4), "aria-label": face.label }));
      var center = face.vertices.reduce(function (sum, vertexIndex) {
        return { x: sum.x + positions[vertexIndex].x / 3, y: sum.y + positions[vertexIndex].y / 3 };
      }, { x: 0, y: 0 });
      svg.appendChild(svgElement(doc, "text", { x: center.x, y: center.y, className: "hb-face-label", "text-anchor": "middle" }, face.label));
    });

    complex.edges.forEach(function (edge, edgeIndex) {
      var left = positions[edge.vertices[0]];
      var right = positions[edge.vertices[1]];
      var selected = report.chain[edgeIndex] === 1;
      svg.appendChild(svgElement(doc, "line", {
        x1: left.x,
        y1: left.y,
        x2: right.x,
        y2: right.y,
        className: selected ? "hb-edge hb-edge-selected" : "hb-edge",
        "aria-label": edge.label + (selected ? "，已选" : "，未选")
      }));
      svg.appendChild(svgElement(doc, "text", {
        x: (left.x + right.x) / 2,
        y: (left.y + right.y) / 2 - 7,
        className: "hb-edge-label",
        "text-anchor": "middle"
      }, edge.label));
    });

    complex.vertices.forEach(function (vertex, vertexIndex) {
      var position = positions[vertexIndex];
      var nonzero = report.boundaryOfChain[vertexIndex] === 1;
      svg.appendChild(svgElement(doc, "circle", {
        cx: position.x,
        cy: position.y,
        r: nonzero ? 10 : 8,
        className: nonzero ? "hb-vertex hb-vertex-boundary" : "hb-vertex",
        "aria-label": vertex.label + (nonzero ? "，∂₁c 非零" : "，∂₁c 为零位置")
      }));
      svg.appendChild(svgElement(doc, "text", {
        x: position.x,
        y: position.y - 14,
        className: "hb-vertex-label",
        "text-anchor": "middle"
      }, vertex.label));
    });
    return svg;
  }

  function mount(root, api) {
    var doc = root.ownerDocument || (typeof document !== "undefined" ? document : null);
    if (!doc) return;
    installStyles(doc);
    root.classList.add("cl-homology");
    INSTANCE += 1;
    var serial = INSTANCE;
    var initial = pureModel.getPreset("solid-triangle");
    var state = { presetId: initial.id, chain: initial.defaultChain.slice() };
    var announce = function (message) {
      if (api && typeof api.announce === "function") api.announce(root, message);
    };

    function firstFaceChain(report) {
      var chain = new Array(report.complex.edges.length).fill(0);
      if (report.complex.faces.length > 0) {
        report.complex.faces[0].edgeIndices.forEach(function (edgeIndex) { chain[edgeIndex] = 1; });
      }
      return chain;
    }

    function render() {
      var report = pureModel.analyze(state.presetId, state.chain);
      var preset = report.complex;
      var shell = element(doc, "div", { className: "hb-shell" });
      shell.appendChild(element(doc, "h3", { className: "hb-heading", text: "同调边界账本：在 F₂ 上记账" }));
      shell.appendChild(element(doc, "p", { className: "hb-intro", text: "选择有限二维单纯复形，再点选边组成 1-chain c。脚本只做 F₂ 运算：1+1=0，精确显示 ∂₁c、im ∂₂ 与 β₀, β₁, β₂。" }));

      var presetBox = element(doc, "fieldset", { className: "hb-preset-box" });
      presetBox.appendChild(element(doc, "legend", { text: "选择复形（所有数值均在 F₂ 上）" }));
      var presetGrid = element(doc, "div", { className: "hb-preset-grid", role: "group", "aria-label": "选择单纯复形预设" });
      pureModel.PRESETS.forEach(function (item) {
        var button = element(doc, "button", {
          type: "button",
          className: "hb-preset",
          "aria-pressed": item.id === state.presetId ? "true" : "false",
          "aria-label": "载入" + item.label
        });
        button.appendChild(doc.createTextNode(item.label));
        button.appendChild(element(doc, "small", { text: item.description }));
        button.addEventListener("click", function () {
          var next = pureModel.getPreset(item.id);
          state.presetId = item.id;
          state.chain = next.defaultChain.slice();
          render();
          announce("已载入" + item.label + "；当前链为" + textVector(pureModel.analyze(item.id, state.chain).chain) + "。");
        });
        presetGrid.appendChild(button);
      });
      presetBox.appendChild(presetGrid);

      var layout = element(doc, "div", { className: "hb-layout" });
      var controls = element(doc, "div", { className: "hb-controls" });
      var stage = element(doc, "div", { className: "hb-stage" });
      layout.appendChild(controls);
      layout.appendChild(stage);

      var chainSection = element(doc, "section", { className: "hb-section" });
      chainSection.appendChild(element(doc, "h4", { text: "点选 1-chain 的边" }));
      chainSection.appendChild(element(doc, "p", { className: "hb-note", text: "选中边的系数为 1，未选边为 0；顺序只用于记账，不代表 F₂ 中的 orientation。" }));
      var edgeGrid = element(doc, "div", { className: "hb-edge-grid", role: "group", "aria-label": "选择边组成一链" });
      preset.edges.forEach(function (edge, edgeIndex) {
        var selected = report.chain[edgeIndex] === 1;
        var button = element(doc, "button", {
          type: "button",
          className: "hb-edge-button",
          "aria-pressed": selected ? "true" : "false",
          "aria-label": (selected ? "取消选择 " : "选择 ") + edge.label
        }, (selected ? "✓ " : "") + edge.label);
        button.addEventListener("click", function () {
          var nextChain = report.chain.slice();
          nextChain[edgeIndex] = nextChain[edgeIndex] ? 0 : 1;
          state.chain = nextChain;
          render();
          announce(edge.label + (nextChain[edgeIndex] ? " 已加入" : " 已移出") + "当前 1-chain。");
        });
        edgeGrid.appendChild(button);
      });
      chainSection.appendChild(edgeGrid);
      var actionRow = element(doc, "div", { className: "hb-action-row" });
      var clearButton = element(doc, "button", { type: "button", text: "清空链" });
      clearButton.addEventListener("click", function () {
        state.chain = new Array(preset.edges.length).fill(0);
        render();
        announce("当前 1-chain 已清空。");
      });
      var defaultButton = element(doc, "button", { type: "button", className: "hb-primary", text: "恢复默认链" });
      defaultButton.addEventListener("click", function () {
        state.chain = preset.defaultChain.slice();
        render();
        announce("已恢复" + preset.label + "的默认链。");
      });
      actionRow.appendChild(clearButton);
      actionRow.appendChild(defaultButton);
      chainSection.appendChild(actionRow);
      var faceButton = element(doc, "button", { type: "button", text: "取第一面边界" });
      faceButton.disabled = preset.faces.length === 0;
      faceButton.addEventListener("click", function () {
        state.chain = firstFaceChain(report);
        render();
        announce("已选择第一面的边界。");
      });
      chainSection.appendChild(faceButton);
      chainSection.appendChild(element(doc, "p", { className: "hb-selection", text: "当前 c = " + (selectedLabels(report).length ? selectedLabels(report).join(" + ") : "0") + "；坐标 = " + textVector(report.chain) }));
      controls.appendChild(chainSection);

      var stageHead = element(doc, "div", { className: "hb-stage-head" });
      stageHead.appendChild(element(doc, "h4", { text: "复形与当前边界" }));
      stageHead.appendChild(element(doc, "span", { className: "hb-stage-title", text: preset.label + " · " + preset.vertices.length + " 个顶点，" + preset.edges.length + " 条边，" + preset.faces.length + " 个面" }));
      stage.appendChild(stageHead);
      var graphWrap = element(doc, "div", { className: "hb-graph-wrap" });
      graphWrap.appendChild(renderGraph(doc, report, serial));
      var legend = element(doc, "div", { className: "hb-graph-legend" });
      [["hb-swatch-face", "面（2-simplex）"], ["hb-swatch-selected", "当前 c 的边"], ["hb-swatch-boundary", "∂₁c 的非零顶点"]].forEach(function (item) {
        var legendItem = element(doc, "span", { className: "hb-legend-item" });
        legendItem.appendChild(element(doc, "i", { className: "hb-swatch " + item[0], "aria-hidden": "true" }));
        legendItem.appendChild(doc.createTextNode(item[1]));
        legend.appendChild(legendItem);
      });
      graphWrap.appendChild(legend);
      stage.appendChild(graphWrap);

      var verdict = element(doc, "section", { className: "hb-verdict", "data-kind": report.classification });
      verdict.appendChild(element(doc, "strong", { text: classificationLabel(report.classification) }));
      verdict.appendChild(element(doc, "p", { text: "∂₁c = " + textVector(report.boundaryOfChain) + (report.isCycle ? "，所以 c ∈ Z₁。" : "，所以 c ∉ Z₁。") }));
      verdict.appendChild(element(doc, "p", { text: "c ∈ im ∂₂ = B₁？ " + (report.inImage ? "是。" : "否。") + (report.boundaryWitness ? " 一个见证 2-chain 的坐标是 " + textVector(report.boundaryWitness) + "。" : "") }));
      if (report.classification === "not-cycle") verdict.appendChild(element(doc, "p", { className: "hb-warn", text: "只有 cycle 才能代表 H₁ 中的类；当前链有非零边界。" }));
      stage.appendChild(verdict);

      var metrics = element(doc, "div", { className: "hb-metrics" });
      [["β₀", report.betti.beta0, "dim H₀(F₂)"], ["β₁", report.betti.beta1, "dim Z₁/B₁"], ["β₂", report.betti.beta2, "dim ker ∂₂"]].forEach(function (metric) {
        var card = element(doc, "div", { className: "hb-metric" });
        card.appendChild(element(doc, "span", { text: metric[0] + "（F₂）" }));
        card.appendChild(element(doc, "strong", { text: String(metric[1]) }));
        card.appendChild(element(doc, "span", { text: metric[2] }));
        metrics.appendChild(card);
      });
      stage.appendChild(metrics);

      var matrixGrid = element(doc, "div", { className: "hb-matrix-grid" });
      matrixGrid.appendChild(renderMatrix(doc, "∂₁：C₁ → C₀", "行是顶点，列是边；每列有两个 1。", report.labels.boundary1Rows, report.labels.boundary1Columns, report.matrices.boundary1, report.ranks.boundary1, report.kernelDimensions.boundary1));
      matrixGrid.appendChild(renderMatrix(doc, "∂₂：C₂ → C₁", "行是边，列是面；F₂ 中方向符号被忘掉。", report.labels.boundary2Rows, report.labels.boundary2Columns, report.matrices.boundary2, report.ranks.boundary2, report.kernelDimensions.boundary2));
      stage.appendChild(matrixGrid);

      var ledger = element(doc, "section", { className: "hb-ledger" });
      ledger.appendChild(element(doc, "h4", { text: "矩阵—秩—Betti—Euler 账本" }));
      var ledgerTable = element(doc, "table");
      ledgerTable.appendChild(element(doc, "caption", { className: "hb-sr-only", text: "同调边界账本" }));
      var ledgerHead = element(doc, "tr");
      ["量", "值", "意义"].forEach(function (label) { ledgerHead.appendChild(element(doc, "th", { scope: "col", text: label })); });
      ledgerTable.appendChild(element(doc, "thead", {}, ledgerHead));
      var ledgerBody = element(doc, "tbody");
      [
        ["rank ∂₁", report.ranks.boundary1, "顶点边界的像维数"],
        ["ker 维数 ∂₁", report.kernelDimensions.boundary1, "Z₁ 的维数"],
        ["rank ∂₂", report.ranks.boundary2, "B₁ 的维数"],
        ["ker 维数 ∂₂", report.kernelDimensions.boundary2, "H₂（此处无 C₃）的维数"],
        ["χ = V−E+F", report.euler, "链群维数的交替和"],
        ["β₀−β₁+β₂", report.eulerFromBetti, "同调维数的交替和"]
      ].forEach(function (row) {
        var tr = element(doc, "tr");
        row.forEach(function (value) { tr.appendChild(element(doc, "td", { text: String(value) })); });
        ledgerBody.appendChild(tr);
      });
      ledgerTable.appendChild(ledgerBody);
      ledger.appendChild(element(doc, "div", { className: "hb-table-wrap" }, ledgerTable));
      ledger.appendChild(element(doc, "p", { className: report.boundarySquareZero ? "hb-check" : "hb-check hb-check-fail", text: "数值验证 ∂₁∂₂ = 0：" + (report.boundarySquareZero ? "通过。" : "失败，请检查复形的面—边关系。") }));
      stage.appendChild(ledger);
      shell.appendChild(presetBox);
      shell.appendChild(layout);
      replaceRenderedRoot(root, shell);
    }

    render();
  }

  host.CourseLearning.register("homology-boundary", mount);
})(typeof window !== "undefined" ? window : null);

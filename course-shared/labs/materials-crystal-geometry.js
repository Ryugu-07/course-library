(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }

  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("materials-crystal-geometry", exported.mount);
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
        "materials-crystal-geometry self-test: PASS (" +
          report.checks +
          " checks)"
      );
    } catch (error) {
      console.error("materials-crystal-geometry self-test: FAIL\n" + error.stack);
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
    var STYLE_ID = "materials-crystal-geometry-styles";
    var AVOGADRO = 6.02214076e23;
    var NM3_TO_CM3 = 1e-21;
    var EPS = 1e-9;
    var DEFAULTS = {
      structure: "FCC",
      radiusNm: 0.124,
      molarMassGPerMol: 55.845,
      h: 1,
      k: 1,
      l: 1
    };
    var STRUCTURES = {
      SC: { label: "简单立方 SC", atoms: 1, coordination: 6, apf: Math.PI / 6, latticeFactor: 2 },
      BCC: { label: "体心立方 BCC", atoms: 2, coordination: 8, apf: Math.sqrt(3) * Math.PI / 8, latticeFactor: 4 / Math.sqrt(3) },
      FCC: { label: "面心立方 FCC", atoms: 4, coordination: 12, apf: Math.PI / (3 * Math.sqrt(2)), latticeFactor: 2 * Math.sqrt(2) }
    };
    var STRUCTURE_POINTS = {
      SC: {
        corners: true,
        faceCenters: false,
        bodyCenter: false
      },
      BCC: {
        corners: true,
        faceCenters: false,
        bodyCenter: true
      },
      FCC: {
        corners: true,
        faceCenters: true,
        bodyCenter: false
      }
    };
    var PLANE_PRESETS = [
      { value: "100", label: "(100)", h: 1, k: 0, l: 0 },
      { value: "110", label: "(110)", h: 1, k: 1, l: 0 },
      { value: "111", label: "(111)", h: 1, k: 1, l: 1 },
      { value: "210", label: "(210)", h: 2, k: 1, l: 0 },
      { value: "custom", label: "自定义 hkl", h: DEFAULTS.h, k: DEFAULTS.k, l: DEFAULTS.l }
    ];
    var STYLE_TEXT = [
      '[data-learning-lab="materials-crystal-geometry"]{--mc-blue:var(--cl-blue,#315f9d);--mc-gold:var(--cl-gold,#9b6a12);--mc-green:var(--cl-green,#39734d);--mc-red:var(--cl-red,#b64335);display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="materials-crystal-geometry"] *{box-sizing:border-box}[data-learning-lab="materials-crystal-geometry"] [hidden]{display:none!important}',
      '[data-learning-lab="materials-crystal-geometry"] h3{margin:0;font-size:1.16rem;letter-spacing:0}[data-learning-lab="materials-crystal-geometry"] p{margin:8px 0}[data-learning-lab="materials-crystal-geometry"] .mc-note,[data-learning-lab="materials-crystal-geometry"] .mc-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="materials-crystal-geometry"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="materials-crystal-geometry"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
      '[data-learning-lab="materials-crystal-geometry"] .mc-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="materials-crystal-geometry"] button,[data-learning-lab="materials-crystal-geometry"] select,[data-learning-lab="materials-crystal-geometry"] input{font:inherit}',
      '[data-learning-lab="materials-crystal-geometry"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="materials-crystal-geometry"] button:hover{border-color:var(--mc-blue)}[data-learning-lab="materials-crystal-geometry"] button[aria-pressed="true"],[data-learning-lab="materials-crystal-geometry"] .mc-primary{border-color:var(--mc-blue);background:var(--mc-blue);color:var(--bg,#fff);font-weight:750}',
      '[data-learning-lab="materials-crystal-geometry"] button:focus-visible,[data-learning-lab="materials-crystal-geometry"] select:focus-visible,[data-learning-lab="materials-crystal-geometry"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="materials-crystal-geometry"] .mc-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="materials-crystal-geometry"] .mc-actions>*{flex:1 1 170px}[data-learning-lab="materials-crystal-geometry"] .mc-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="materials-crystal-geometry"] .mc-pass{color:var(--mc-green)}[data-learning-lab="materials-crystal-geometry"] .mc-warn{color:var(--mc-red)}',
      '[data-learning-lab="materials-crystal-geometry"] .mc-layout{display:grid;grid-template-columns:minmax(215px,.72fr) minmax(0,1.28fr);gap:16px;align-items:start;min-width:0}[data-learning-lab="materials-crystal-geometry"] .mc-controls,[data-learning-lab="materials-crystal-geometry"] .mc-stage{min-width:0}[data-learning-lab="materials-crystal-geometry"] .mc-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="materials-crystal-geometry"] .mc-control{display:grid;gap:5px;min-width:0}[data-learning-lab="materials-crystal-geometry"] .mc-control label{color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}[data-learning-lab="materials-crystal-geometry"] .mc-control output{color:var(--mc-blue);font-variant-numeric:tabular-nums}',
      '[data-learning-lab="materials-crystal-geometry"] input[type="range"],[data-learning-lab="materials-crystal-geometry"] input[type="number"],[data-learning-lab="materials-crystal-geometry"] select{width:100%;min-height:44px;accent-color:var(--mc-blue)}[data-learning-lab="materials-crystal-geometry"] input[type="number"],[data-learning-lab="materials-crystal-geometry"] select{padding:7px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor)}[data-learning-lab="materials-crystal-geometry"] .mc-hkl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}[data-learning-lab="materials-crystal-geometry"] .mc-hkl label{min-width:0}',
      '[data-learning-lab="materials-crystal-geometry"] .mc-stage-frame{min-width:0;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent);overflow:hidden}[data-learning-lab="materials-crystal-geometry"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="materials-crystal-geometry"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}[data-learning-lab="materials-crystal-geometry"] .mc-cube{fill:none;stroke:currentColor;stroke-width:1.1;stroke-opacity:.7}[data-learning-lab="materials-crystal-geometry"] .mc-plane{fill:var(--mc-blue);fill-opacity:.28;stroke:var(--mc-blue);stroke-width:2}[data-learning-lab="materials-crystal-geometry"] .mc-atom{fill:var(--mc-gold);stroke:var(--bg,#fff);stroke-width:1.4}[data-learning-lab="materials-crystal-geometry"] .mc-face-atom{fill:var(--mc-green);stroke:var(--bg,#fff);stroke-width:1.4}[data-learning-lab="materials-crystal-geometry"] .mc-body-atom{fill:var(--mc-red);stroke:var(--bg,#fff);stroke-width:1.4}[data-learning-lab="materials-crystal-geometry"] .mc-label{font-size:11px}[data-learning-lab="materials-crystal-geometry"] .mc-small{font-size:10px;fill:var(--fg-soft,currentColor)!important}',
      '[data-learning-lab="materials-crystal-geometry"] .mc-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-top:12px}[data-learning-lab="materials-crystal-geometry"] .mc-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#cbd5e1);background:var(--bg,transparent)}[data-learning-lab="materials-crystal-geometry"] .mc-metric:nth-child(3n+1){border-color:var(--mc-blue)}[data-learning-lab="materials-crystal-geometry"] .mc-metric:nth-child(3n+2){border-color:var(--mc-gold)}[data-learning-lab="materials-crystal-geometry"] .mc-metric:nth-child(3n){border-color:var(--mc-green)}[data-learning-lab="materials-crystal-geometry"] .mc-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11.5px}[data-learning-lab="materials-crystal-geometry"] .mc-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
      '[data-learning-lab="materials-crystal-geometry"] .mc-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:12px}[data-learning-lab="materials-crystal-geometry"] table{width:100%;min-width:620px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="materials-crystal-geometry"] th,[data-learning-lab="materials-crystal-geometry"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="materials-crystal-geometry"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="materials-crystal-geometry"] .mc-certificate{margin-top:11px;padding:10px 12px;border-left:3px solid var(--mc-gold);background:var(--bg,transparent);font-size:13px;line-height:1.7}',
      '@media(max-width:900px){[data-learning-lab="materials-crystal-geometry"] .mc-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){[data-learning-lab="materials-crystal-geometry"] .mc-choice-grid{grid-template-columns:minmax(0,1fr)}[data-learning-lab="materials-crystal-geometry"] .mc-hkl{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:420px){[data-learning-lab="materials-crystal-geometry"] .mc-stage-frame{padding:4px}[data-learning-lab="materials-crystal-geometry"] table{font-size:11px}[data-learning-lab="materials-crystal-geometry"] th,[data-learning-lab="materials-crystal-geometry"] td{padding-left:4px;padding-right:4px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="materials-crystal-geometry"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
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
      if (!Number.isFinite(value)) return "∞";
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
      var structure = source.structure === undefined ? DEFAULTS.structure : String(source.structure);
      if (!STRUCTURES[structure]) throw new RangeError("unknown cubic structure");
      var radiusNm = finite(source.radiusNm === undefined ? DEFAULTS.radiusNm : source.radiusNm, "radius");
      var molarMassGPerMol = finite(source.molarMassGPerMol === undefined ? DEFAULTS.molarMassGPerMol : source.molarMassGPerMol, "molar mass");
      var h = finite(source.h === undefined ? DEFAULTS.h : source.h, "h");
      var k = finite(source.k === undefined ? DEFAULTS.k : source.k, "k");
      var l = finite(source.l === undefined ? DEFAULTS.l : source.l, "l");
      if (radiusNm <= 0 || radiusNm > 2) throw new RangeError("radius must be in (0, 2] nm");
      if (molarMassGPerMol <= 0 || molarMassGPerMol > 1000) throw new RangeError("molar mass must be in (0, 1000] g/mol");
      [h, k, l].forEach(function (index, position) {
        if (!Number.isInteger(index) || Math.abs(index) > 20) throw new RangeError("Miller index " + position + " must be an integer in [-20, 20]");
      });
      return { structure: structure, radiusNm: radiusNm, molarMassGPerMol: molarMassGPerMol, h: h, k: k, l: l };
    }

    function structureLedger(structure, radiusNm, molarMassGPerMol) {
      var key = String(structure);
      if (!STRUCTURES[key]) throw new RangeError("unknown cubic structure");
      var radius = finite(radiusNm, "radius");
      var molarMass = finite(molarMassGPerMol, "molar mass");
      if (radius <= 0 || molarMass <= 0) throw new RangeError("radius and molar mass must be positive");
      var data = STRUCTURES[key];
      var aNm = data.latticeFactor * radius;
      var volumeNm3 = aNm * aNm * aNm;
      var massG = data.atoms * molarMass / AVOGADRO;
      var densityGPerCm3 = massG / (volumeNm3 * NM3_TO_CM3);
      return {
        structure: key,
        label: data.label,
        radiusNm: radius,
        molarMassGPerMol: molarMass,
        atomsPerCell: data.atoms,
        coordination: data.coordination,
        packingFactor: data.apf,
        latticeConstantNm: aNm,
        cellVolumeNm3: volumeNm3,
        cellMassG: massG,
        densityGPerCm3: densityGPerCm3,
        densityKgPerM3: densityGPerCm3 * 1000
      };
    }

    function vectorDot(left, right) {
      return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
    }

    function vectorSub(left, right) {
      return [left[0] - right[0], left[1] - right[1], left[2] - right[2]];
    }

    function vectorCross(left, right) {
      return [left[1] * right[2] - left[2] * right[1], left[2] * right[0] - left[0] * right[2], left[0] * right[1] - left[1] * right[0]];
    }

    function vectorScale(value, factor) {
      return [value[0] * factor, value[1] * factor, value[2] * factor];
    }

    function vectorNorm(value) {
      return Math.sqrt(vectorDot(value, value));
    }

    function uniquePoints(points) {
      var out = [];
      points.forEach(function (point) {
        var duplicate = out.some(function (other) {
          return vectorNorm(vectorSub(point, other)) < 1e-7;
        });
        if (!duplicate) out.push(point);
      });
      return out;
    }

    function cubeVertices() {
      var vertices = [];
      for (var x = 0; x <= 1; x += 1) {
        for (var y = 0; y <= 1; y += 1) {
          for (var z = 0; z <= 1; z += 1) vertices.push([x, y, z]);
        }
      }
      return vertices;
    }

    function cubeEdges() {
      var edges = [];
      var vertices = cubeVertices();
      vertices.forEach(function (vertex, index) {
        vertices.forEach(function (other, otherIndex) {
          var differences = Math.abs(vertex[0] - other[0]) + Math.abs(vertex[1] - other[1]) + Math.abs(vertex[2] - other[2]);
          if (differences === 1 && index < otherIndex) edges.push([index, otherIndex]);
        });
      });
      return { vertices: vertices, edges: edges };
    }

    function intersectionsForOffset(h, k, l, offset) {
      var cube = cubeEdges();
      var points = [];
      cube.edges.forEach(function (edge) {
        var first = cube.vertices[edge[0]];
        var second = cube.vertices[edge[1]];
        var firstValue = h * first[0] + k * first[1] + l * first[2] - offset;
        var secondValue = h * second[0] + k * second[1] + l * second[2] - offset;
        if (Math.abs(firstValue) <= EPS) points.push(first.slice());
        if (Math.abs(secondValue) <= EPS) points.push(second.slice());
        if (firstValue * secondValue < -EPS * EPS) {
          var fraction = firstValue / (firstValue - secondValue);
          points.push([
            first[0] + fraction * (second[0] - first[0]),
            first[1] + fraction * (second[1] - first[1]),
            first[2] + fraction * (second[2] - first[2])
          ]);
        }
      });
      return uniquePoints(points);
    }

    function orderedPolygon(points, normal) {
      if (points.length < 3) return points;
      var center = [0, 0, 0];
      points.forEach(function (point) {
        center[0] += point[0]; center[1] += point[1]; center[2] += point[2];
      });
      center = vectorScale(center, 1 / points.length);
      var reference = Math.abs(normal[0]) < 0.8 ? [1, 0, 0] : [0, 1, 0];
      var u = vectorCross(normal, reference);
      u = vectorScale(u, 1 / vectorNorm(u));
      var v = vectorCross(normal, u);
      return points.slice().sort(function (left, right) {
        var leftOffset = vectorSub(left, center);
        var rightOffset = vectorSub(right, center);
        var leftAngle = Math.atan2(vectorDot(leftOffset, v), vectorDot(leftOffset, u));
        var rightAngle = Math.atan2(vectorDot(rightOffset, v), vectorDot(rightOffset, u));
        return leftAngle - rightAngle;
      });
    }

    function millerGeometry(h, k, l, latticeConstantNm) {
      var indices = [finite(h, "h"), finite(k, "k"), finite(l, "l")];
      indices.forEach(function (index) {
        if (!Number.isInteger(index)) throw new RangeError("Miller indices must be integers");
      });
      if (indices[0] === 0 && indices[1] === 0 && indices[2] === 0) {
        throw new RangeError("(000) is degenerate: it has no plane normal or spacing");
      }
      var aNm = finite(latticeConstantNm, "lattice constant");
      if (aNm <= 0) throw new RangeError("lattice constant must be positive");
      var hValue = indices[0];
      var kValue = indices[1];
      var lValue = indices[2];
      var normSquared = hValue * hValue + kValue * kValue + lValue * lValue;
      var normalLength = Math.sqrt(normSquared);
      var planeSpacingNm = aNm / normalLength;
      var interceptsNm = [hValue === 0 ? null : aNm / hValue, kValue === 0 ? null : aNm / kValue, lValue === 0 ? null : aNm / lValue];
      var cube = cubeVertices();
      var projections = cube.map(function (vertex) { return hValue * vertex[0] + kValue * vertex[1] + lValue * vertex[2]; });
      var minimum = Math.min.apply(Math, projections);
      var maximum = Math.max.apply(Math, projections);
      var offset = 1;
      var shifted = false;
      var polygon = intersectionsForOffset(hValue, kValue, lValue, offset);
      if (offset < minimum - EPS || offset > maximum + EPS || polygon.length < 3) {
        offset = (minimum + maximum) / 2;
        polygon = intersectionsForOffset(hValue, kValue, lValue, offset);
        shifted = true;
      }
      polygon = orderedPolygon(polygon, [hValue, kValue, lValue]);
      return {
        h: hValue,
        k: kValue,
        l: lValue,
        indexText: "(" + hValue + " " + kValue + " " + lValue + ")",
        normal: [hValue, kValue, lValue],
        normalLength: normalLength,
        spacingNm: planeSpacingNm,
        interceptsNm: interceptsNm,
        representativeOffset: offset,
        representativeShifted: shifted,
        polygon: polygon
      };
    }

    function evaluate(input) {
      var config = normalizeConfig(input);
      var selected = structureLedger(config.structure, config.radiusNm, config.molarMassGPerMol);
      var structures = Object.keys(STRUCTURES).map(function (key) {
        return structureLedger(key, config.radiusNm, config.molarMassGPerMol);
      });
      var plane = millerGeometry(config.h, config.k, config.l, selected.latticeConstantNm);
      return { config: config, selected: selected, structures: structures, plane: plane };
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

    function project(point) {
      return [100 + 260 * point[0] - 120 * point[1], 258 - 94 * point[2] - 52 * point[0] - 38 * point[1]];
    }

    function atomPoints(structure) {
      var points = [];
      if (STRUCTURE_POINTS[structure].corners) {
        cubeVertices().forEach(function (point) { points.push({ point: point, className: "mc-atom", radius: 5 }); });
      }
      if (STRUCTURE_POINTS[structure].faceCenters) {
        [[0.5, 0.5, 0], [0.5, 0.5, 1], [0.5, 0, 0.5], [0.5, 1, 0.5], [0, 0.5, 0.5], [1, 0.5, 0.5]].forEach(function (point) {
          points.push({ point: point, className: "mc-face-atom", radius: 7 });
        });
      }
      if (STRUCTURE_POINTS[structure].bodyCenter) points.push({ point: [0.5, 0.5, 0.5], className: "mc-body-atom", radius: 8 });
      return points;
    }

    function renderSvg(doc, svg, result) {
      clear(svg);
      var cube = cubeEdges();
      var polygonPoints = result.plane.polygon.map(project);
      svg.appendChild(svgElement(doc, "title", {}, result.selected.label + " 原子占位、(" + result.plane.h + " " + result.plane.k + " " + result.plane.l + ") 平面与晶胞"));
      svg.appendChild(svgElement(doc, "desc", {}, "金色为角点原子，绿色为面心原子，红色为体心原子，蓝色多边形是与晶胞相交的 Miller 平面代表。"));
      if (polygonPoints.length >= 3) {
        svg.appendChild(svgElement(doc, "polygon", { points: polygonPoints.map(function (point) { return point[0].toFixed(2) + "," + point[1].toFixed(2); }).join(" "), class: "mc-plane" }));
      }
      cube.edges.forEach(function (edge) {
        var first = project(cube.vertices[edge[0]]);
        var second = project(cube.vertices[edge[1]]);
        svg.appendChild(svgElement(doc, "line", { x1: first[0], y1: first[1], x2: second[0], y2: second[1], class: "mc-cube" }));
      });
      atomPoints(result.selected.structure).forEach(function (item) {
        var point = project(item.point);
        svg.appendChild(svgElement(doc, "circle", { cx: point[0], cy: point[1], r: item.radius, class: item.className }));
      });
      svg.appendChild(svgElement(doc, "text", { x: 24, y: 26, class: "mc-label" }, result.selected.structure + "：" + result.selected.atomsPerCell + " atoms/cell"));
      svg.appendChild(svgElement(doc, "text", { x: 650, y: 326, "text-anchor": "end", class: "mc-small" }, "蓝面法向 ∥ [" + result.plane.h + " " + result.plane.k + " " + result.plane.l + "]"));
      if (result.plane.representativeShifted) svg.appendChild(svgElement(doc, "text", { x: 24, y: 344, class: "mc-small" }, "为使负/零指数代表在此晶胞内可见，蓝面沿法向平移；d 不变"));
    }

    function metric(doc, label, value) {
      return element(doc, "div", { className: "mc-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]);
    }

    function renderTable(doc, hostNode, result) {
      var body = element(doc, "tbody");
      result.structures.forEach(function (item) {
        body.appendChild(element(doc, "tr", {}, [
          element(doc, "th", { scope: "row", text: item.structure }),
          element(doc, "td", { text: String(item.atomsPerCell) }),
          element(doc, "td", { text: String(item.coordination) }),
          element(doc, "td", { text: format(item.packingFactor, 4) }),
          element(doc, "td", { text: format(item.latticeConstantNm, 4) }),
          element(doc, "td", { text: format(item.densityGPerCm3, 3) })
        ]));
      });
      var interceptText = result.plane.interceptsNm.map(function (value, index) {
        return value === null ? ["x", "y", "z"][index] + " ∥ 面（指数 0）" : format(value, 3) + " nm";
      }).join("；");
      clear(hostNode);
      hostNode.appendChild(element(doc, "table", {}, [
        element(doc, "caption", { text: "立方结构精确计数、堆积与密度账本" }),
        element(doc, "thead", {}, [element(doc, "tr", {}, [
          element(doc, "th", { scope: "col", text: "结构" }),
          element(doc, "th", { scope: "col", text: "每胞原子数" }),
          element(doc, "th", { scope: "col", text: "配位数" }),
          element(doc, "th", { scope: "col", text: "APF" }),
          element(doc, "th", { scope: "col", text: "a / nm" }),
          element(doc, "th", { scope: "col", text: "ρ / g·cm⁻³" })
        ])]),
        body
      ]));
      hostNode.appendChild(element(doc, "p", { className: "mc-certificate", text: "Miller 账本：" + result.plane.indexText + "，d = a/√(h²+k²+l²) = " + format(result.plane.spacingNm, 4) + " nm；截距为 " + interceptText + "。 (0 0 0) 没有法向，不能当作一个平面。" }));
    }

    function questionSpecs() {
      return [
        {
          key: "count",
          prompt: "一个常规 FCC 晶胞的净原子数是多少？",
          expected: "four",
          choices: [{ value: "one", label: "1" }, { value: "two", label: "2" }, { value: "four", label: "4" }]
        },
        {
          key: "density",
          prompt: "固定原子半径 r 与摩尔质量 M 时，SC/BCC/FCC 哪个密度最高？",
          expected: "fcc",
          choices: [{ value: "sc", label: "SC" }, { value: "bcc", label: "BCC" }, { value: "fcc", label: "FCC" }]
        },
        {
          key: "degenerate",
          prompt: "Miller 指数 (0 0 0) 应怎样处理？",
          expected: "invalid",
          choices: [{ value: "plane", label: "合法平面" }, { value: "invalid", label: "退化/拒绝" }, { value: "spacing", label: "d = ∞" }]
        }
      ];
    }

    function mount(rootNode, api) {
      if (!rootNode || !rootNode.ownerDocument) return;
      var doc = rootNode.ownerDocument;
      installStyles(doc);
      var state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" };
      var shell = element(doc, "div", { className: "mc-lab" });
      shell.appendChild(element(doc, "h3", { text: "晶体结构实验：把占位数、配位、APF、密度和 Miller 平面放进同一晶胞" }));
      shell.appendChild(element(doc, "p", { className: "mc-note", text: "先预测净原子数、同半径密度排序和退化指数；揭示后再切换 SC/BCC/FCC、半径、摩尔质量与平面。" }));
      var predictionHost = element(doc, "div");
      var predictionGroups = [];
      questionSpecs().forEach(function (spec) {
        var fieldset = element(doc, "fieldset");
        fieldset.appendChild(element(doc, "legend", { text: spec.prompt }));
        var grid = element(doc, "div", { className: "mc-choice-grid" });
        var group = { key: spec.key, buttons: [] };
        spec.choices.forEach(function (choice) {
          var button = element(doc, "button", { type: "button", text: choice.label, "aria-pressed": "false" });
          button.addEventListener("click", function () { state.predictions[spec.key] = choice.value; state.feedback = ""; render(); });
          group.buttons.push({ node: button, value: choice.value, label: choice.label });
          grid.appendChild(button);
        });
        predictionGroups.push(group);
        fieldset.appendChild(grid);
        predictionHost.appendChild(fieldset);
      });
      var actions = element(doc, "div", { className: "mc-actions" });
      var reveal = element(doc, "button", { type: "button", className: "mc-primary", text: "提交预测并揭晓" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      actions.appendChild(reveal); actions.appendChild(reset);
      var feedback = element(doc, "p", { className: "mc-feedback", "aria-live": "polite" });
      var resultShell = element(doc, "div", { hidden: true });
      var controls = element(doc, "div", { className: "mc-controls" });
      var structureSelect = element(doc, "select", { "aria-label": "晶体结构" });
      Object.keys(STRUCTURES).forEach(function (key) { structureSelect.appendChild(element(doc, "option", { value: key, text: STRUCTURES[key].label })); });
      var planeSelect = element(doc, "select", { "aria-label": "Miller 平面预设" });
      PLANE_PRESETS.forEach(function (plane) { planeSelect.appendChild(element(doc, "option", { value: plane.value, text: plane.label })); });
      controls.appendChild(element(doc, "div", { className: "mc-control" }, [element(doc, "label", { text: "晶体结构" }), structureSelect]));
      var inputs = {};
      function rangeControl(key, label, min, max, step, digits) {
        var input = element(doc, "input", { type: "range", min: min, max: max, step: step, value: state.config[key], "aria-label": label });
        var output = element(doc, "output", { text: format(state.config[key], digits) });
        inputs[key] = { input: input, output: output, digits: digits };
        controls.appendChild(element(doc, "div", { className: "mc-control" }, [element(doc, "label", {}, [label, " = ", output]), input]));
      }
      rangeControl("radiusNm", "原子半径 r / nm", "0.080", "0.220", "0.001", 3);
      rangeControl("molarMassGPerMol", "摩尔质量 M / g·mol⁻¹", "10", "200", "0.1", 1);
      controls.appendChild(element(doc, "div", { className: "mc-control" }, [element(doc, "label", { text: "Miller 平面预设" }), planeSelect]));
      var hkl = element(doc, "div", { className: "mc-hkl" });
      var hklInputs = {};
      ["h", "k", "l"].forEach(function (key) {
        var input = element(doc, "input", { type: "number", min: "-3", max: "3", step: "1", value: state.config[key], "aria-label": key + " Miller index" });
        hklInputs[key] = input;
        hkl.appendChild(element(doc, "label", {}, [key, input]));
      });
      controls.appendChild(element(doc, "div", { className: "mc-control" }, [element(doc, "label", { text: "自定义指数 h, k, l" }), hkl]));
      var svg = svgElement(doc, "svg", { viewBox: "0 0 680 360", role: "img", "aria-label": "立方晶胞与 Miller 平面" });
      var stage = element(doc, "div", { className: "mc-stage" }, [element(doc, "div", { className: "mc-stage-frame" }, [svg])]);
      var metricsHost = element(doc, "div", { className: "mc-metrics" });
      var tableHost = element(doc, "div", { className: "mc-table-wrap" });
      stage.appendChild(metricsHost); stage.appendChild(tableHost);
      resultShell.appendChild(element(doc, "div", { className: "mc-layout" }, [controls, stage]));
      shell.appendChild(predictionHost); shell.appendChild(actions); shell.appendChild(feedback); shell.appendChild(resultShell);
      clear(rootNode); rootNode.appendChild(shell);

      function setPlaneInputs(h, k, l) {
        hklInputs.h.value = String(h); hklInputs.k.value = String(k); hklInputs.l.value = String(l);
      }
      function readPlane() {
        return { h: Number(hklInputs.h.value), k: Number(hklInputs.k.value), l: Number(hklInputs.l.value) };
      }
      structureSelect.addEventListener("change", function () { state.config.structure = structureSelect.value; state.feedback = ""; render(); });
      planeSelect.addEventListener("change", function () {
        var selected = PLANE_PRESETS.filter(function (item) { return item.value === planeSelect.value; })[0];
        if (selected) setPlaneInputs(selected.h, selected.k, selected.l);
        var next = readPlane(); state.config.h = next.h; state.config.k = next.k; state.config.l = next.l; state.feedback = ""; render();
      });
      Object.keys(inputs).forEach(function (key) {
        inputs[key].input.addEventListener("input", function () { state.config[key] = Number(inputs[key].input.value); state.feedback = ""; render(); });
      });
      ["h", "k", "l"].forEach(function (key) {
        hklInputs[key].addEventListener("input", function () { state.config[key] = Number(hklInputs[key].value); planeSelect.value = "custom"; state.feedback = ""; render(); });
      });
      reveal.addEventListener("click", function () {
        var specs = questionSpecs();
        if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) { state.feedback = "请先完成三项结构预测；揭示后才显示晶胞和平面账本。"; render(); return; }
        var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
        state.revealed = true; state.feedback = "已揭晓：" + correct + "/" + specs.length + " 命中。改半径或指数，检查公式和图面是否同步。"; render(); announce(api, rootNode, state.feedback);
      });
      reset.addEventListener("click", function () { state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, feedback: "" }; render(); announce(api, rootNode, "晶体结构预测和账本已重置。"); });

      function render() {
        var result = null;
        try {
          result = evaluate(state.config);
          state.feedback = state.feedback.indexOf("当前指数") === 0 ? "" : state.feedback;
        } catch (error) {
          state.feedback = "当前指数无效：" + error.message + "；(000) 没有合法平面。";
        }
        structureSelect.value = state.config.structure;
        Object.keys(inputs).forEach(function (key) { inputs[key].input.value = String(state.config[key]); inputs[key].output.textContent = format(state.config[key], inputs[key].digits); });
        hklInputs.h.value = String(state.config.h); hklInputs.k.value = String(state.config.k); hklInputs.l.value = String(state.config.l);
        var preset = PLANE_PRESETS.filter(function (item) { return item.h === state.config.h && item.k === state.config.k && item.l === state.config.l; })[0];
        planeSelect.value = preset ? preset.value : "custom";
        predictionGroups.forEach(function (group) {
          var spec = questionSpecs().filter(function (item) { return item.key === group.key; })[0];
          group.buttons.forEach(function (button) {
            var selected = state.predictions[group.key] === button.value;
            button.node.setAttribute("aria-pressed", selected ? "true" : "false");
            button.node.textContent = state.revealed && button.value === spec.expected ? "✓ " + button.label : button.label;
            button.node.className = state.revealed && button.value === spec.expected ? "mc-pass" : state.revealed && selected ? "mc-warn" : "";
          });
        });
        feedback.textContent = state.feedback;
        feedback.className = "mc-feedback" + (state.feedback.indexOf("无效") >= 0 || state.feedback.indexOf("请先") === 0 ? " mc-warn" : "");
        resultShell.hidden = !state.revealed;
        if (!state.revealed || !result) return;
        renderSvg(doc, svg, result);
        clear(metricsHost);
        metricsHost.appendChild(metric(doc, "当前结构", result.selected.label));
        metricsHost.appendChild(metric(doc, "净原子数", String(result.selected.atomsPerCell)));
        metricsHost.appendChild(metric(doc, "配位数 / APF", result.selected.coordination + " / " + format(result.selected.packingFactor, 4)));
        metricsHost.appendChild(metric(doc, "密度", format(result.selected.densityGPerCm3, 3) + " g/cm³"));
        renderTable(doc, tableHost, result);
      }
      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) { checks += 1; assert(condition, message); }
      check(format(1350, 0) === "1350" && format(60, 0) === "60", "zero-decimal formatter preserves trailing integer zeros");
      check(structureLedger("SC", 0.1, 50).atomsPerCell === 1, "SC atom count");
      check(structureLedger("BCC", 0.1, 50).atomsPerCell === 2, "BCC atom count");
      check(structureLedger("FCC", 0.1, 50).atomsPerCell === 4, "FCC atom count");
      check(structureLedger("SC", 0.1, 50).coordination === 6, "SC coordination");
      check(structureLedger("BCC", 0.1, 50).coordination === 8, "BCC coordination");
      check(structureLedger("FCC", 0.1, 50).coordination === 12, "FCC coordination");
      check(near(structureLedger("FCC", 0.1, 50).packingFactor, Math.PI / (3 * Math.sqrt(2)), 1e-12), "FCC packing factor");
      var density = ["SC", "BCC", "FCC"].map(function (key) { return structureLedger(key, 0.1, 50).densityGPerCm3; });
      check(density[0] < density[1] && density[1] < density[2], "density follows n/a^3 at fixed radius and molar mass");
      var plane111 = millerGeometry(1, 1, 1, 0.4);
      check(near(plane111.spacingNm, 0.4 / Math.sqrt(3), 1e-12), "(111) spacing");
      check(plane111.polygon.length >= 3, "(111) visible polygon");
      var plane100 = millerGeometry(1, 0, 0, 0.4);
      check(plane100.interceptsNm[1] === null && plane100.interceptsNm[2] === null, "zero indices mean parallel intercepts");
      var negative = millerGeometry(-1, 1, 0, 0.4);
      check(near(negative.spacingNm, plane100.spacingNm / Math.sqrt(2), 1e-12), "negative indices preserve spacing norm");
      var threw = false;
      try { millerGeometry(0, 0, 0, 0.4); } catch (error) { threw = true; }
      check(threw, "(000) rejected as degenerate");
      threw = false;
      try { millerGeometry(1.5, 0, 0, 0.4); } catch (error2) { threw = true; }
      check(threw, "non-integer index rejected");
      var smaller = structureLedger("FCC", 0.2, 50).densityGPerCm3;
      check(near(smaller / density[2], 1 / 8, 1e-12), "density scales as radius^-3");
      return { checks: checks };
    }

    return {
      DEFAULTS: copyDefaults(),
      STRUCTURES: STRUCTURES,
      structureLedger: structureLedger,
      millerGeometry: millerGeometry,
      evaluate: evaluate,
      format: format,
      mount: mount,
      selfTest: selfTest
    };
  }
);

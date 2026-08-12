(function () {
  "use strict";

  if (
    typeof window === "undefined" ||
    !window.CourseLearning ||
    typeof window.CourseLearning.register !== "function"
  ) {
    return;
  }

  var SVG_NS = "http://www.w3.org/2000/svg";
  var RANK_TOL = 1e-8;
  var ASSERT_TOL = 2e-7;
  var INSTANCE = 0;

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
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
      node.appendChild(
        child && child.nodeType ? child : doc.createTextNode(String(child))
      );
    });
    return node;
  }

  function makeElement(doc, tag, attrs, children) {
    return appendChildren(
      setAttributes(doc.createElement(tag), attrs || {}),
      children,
      doc
    );
  }

  function makeSvg(doc, tag, attrs, children) {
    return appendChildren(
      setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}),
      children,
      doc
    );
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function formatNumber(api, value, digits) {
    if (!Number.isFinite(value)) return "∞";
    if (Math.abs(value) < 0.0005) value = 0;
    if (api && typeof api.format === "function") {
      return api.format(value, digits === undefined ? 3 : digits);
    }
    return value.toFixed(digits === undefined ? 3 : digits)
      .replace(/0+$/, "")
      .replace(/\.$/, "");
  }

  function formatList(api, values, digits) {
    return values.map(function (value) {
      return formatNumber(api, value, digits);
    }).join(", ");
  }

  function assertCondition(condition, message) {
    if (!condition) throw new Error("entanglement-cut assertion failed: " + message);
  }

  function injectStyles(doc) {
    if (doc.querySelector && doc.querySelector("style[data-ent-cut-style]")) return;
    var style = doc.createElement("style");
    style.setAttribute("data-ent-cut-style", "true");
    style.textContent = [
      ".ent-cut-lab{--ec-fg:var(--fg,#292722);--ec-muted:var(--fg-soft,#6b6557);--ec-bg:var(--bg,#fff);--ec-panel:var(--block-bg,#f4f1e9);--ec-border:var(--border,#ded7c7);--ec-accent:var(--accent,#315f9d);--ec-gold:var(--cl-gold,#9b6a12);--ec-green:var(--cl-green,#39734d);--ec-red:var(--cl-red,#b64335);box-sizing:border-box;color:var(--ec-fg);font-size:.95em;line-height:1.5}",
      ".ent-cut-lab *,.ent-cut-lab *::before,.ent-cut-lab *::after{box-sizing:border-box}",
      ".ent-cut-lab .ent-cut-shell{min-width:0}",
      ".ent-cut-lab .ent-cut-heading{margin:0 0 .25rem;color:var(--ec-accent);font-size:1.25rem}",
      ".ent-cut-lab .ent-cut-intro,.ent-cut-lab .ent-cut-note,.ent-cut-lab .ent-cut-status{color:var(--ec-muted)}",
      ".ent-cut-lab .ent-cut-intro{margin:0 0 1rem}",
      ".ent-cut-lab .ent-cut-layout{display:grid;grid-template-columns:minmax(205px,.72fr) minmax(0,1.28fr);gap:18px;align-items:start}",
      ".ent-cut-lab .ent-cut-controls,.ent-cut-lab .ent-cut-stage{min-width:0}",
      ".ent-cut-lab .ent-cut-control-section{margin-top:1rem;padding-top:.8rem;border-top:1px solid var(--ec-border)}",
      ".ent-cut-lab .ent-cut-control-section:first-child{margin-top:0;padding-top:0;border-top:0}",
      ".ent-cut-lab h4{margin:0 0 .45rem;font-size:1rem}",
      ".ent-cut-lab .ent-cut-field{display:grid;gap:4px;margin-top:.65rem}",
      ".ent-cut-lab .ent-cut-field-caption{display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px;color:var(--ec-muted);font-size:.9em;font-weight:650}",
      ".ent-cut-lab .ent-cut-output{color:var(--ec-accent);font-variant-numeric:tabular-nums}",
      ".ent-cut-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--ec-accent)}",
      ".ent-cut-lab .ent-cut-button-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}",
      ".ent-cut-lab .ent-cut-button{min-width:0;min-height:44px;padding:7px 9px;border:1px solid var(--ec-border);border-radius:6px;background:var(--ec-bg);color:inherit;cursor:pointer;font:inherit;line-height:1.35;overflow-wrap:anywhere}",
      ".ent-cut-lab .ent-cut-button:hover:not(:disabled){border-color:var(--ec-accent)}",
      ".ent-cut-lab .ent-cut-button[aria-pressed=true],.ent-cut-lab .ent-cut-button.ent-cut-primary{border-color:var(--ec-accent);background:var(--ec-accent);color:var(--ec-bg)}",
      ".ent-cut-lab .ent-cut-button:disabled{cursor:not-allowed;opacity:.55}",
      ".ent-cut-lab .ent-cut-button:focus-visible,.ent-cut-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
      ".ent-cut-lab .ent-cut-formula{margin:.6rem 0 0;padding:8px 10px;overflow-x:auto;border-left:3px solid var(--ec-accent);background:var(--ec-bg);font-family:\"SF Mono\",Menlo,Consolas,monospace;font-size:.86em;line-height:1.55}",
      ".ent-cut-lab .ent-cut-small{color:var(--ec-muted);font-size:.86em}",
      ".ent-cut-lab .ent-cut-stage-frame{padding:10px;border:1px solid var(--ec-border);border-radius:6px;background:var(--ec-bg)}",
      ".ent-cut-lab .ent-cut-stage-title{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin-bottom:8px;color:var(--ec-muted);font-size:.88em}",
      ".ent-cut-lab .ent-cut-figure{margin:0;min-width:0}",
      ".ent-cut-lab .ent-cut-svg{display:block;width:100%;height:auto;max-width:100%;color:var(--ec-fg)}",
      ".ent-cut-lab .ent-cut-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}",
      ".ent-cut-lab .ent-cut-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-top:12px}",
      ".ent-cut-lab .ent-cut-metric{min-width:0;padding:9px;border-top:2px solid var(--ec-border);background:var(--ec-panel)}",
      ".ent-cut-lab .ent-cut-metric span{display:block;color:var(--ec-muted);font-size:11.5px;line-height:1.35}",
      ".ent-cut-lab .ent-cut-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
      ".ent-cut-lab .ent-cut-checks{margin:.7rem 0 0;color:var(--ec-muted);font-size:.84em;line-height:1.55}",
      ".ent-cut-lab .ent-cut-checks strong{color:var(--ec-green)}",
      ".ent-cut-lab .ent-cut-status{min-height:1.5em;margin:.7rem 0 0}",
      ".ent-cut-lab .ent-cut-legend{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px;color:var(--ec-muted);font-size:.82em}",
      ".ent-cut-lab .ent-cut-legend-item{display:inline-flex;align-items:center;gap:5px}",
      ".ent-cut-lab .ent-cut-swatch{display:inline-block;width:22px;height:0;border-top:3px solid var(--ec-accent)}",
      ".ent-cut-lab .ent-cut-swatch-gold{border-color:var(--ec-gold)}",
      ".ent-cut-lab .ent-cut-swatch-green{border-color:var(--ec-green)}",
      ".ent-cut-lab .ent-cut-swatch-red{border-color:var(--ec-red)}",
      "@media (max-width:760px){.ent-cut-lab .ent-cut-layout{grid-template-columns:minmax(0,1fr)}.ent-cut-lab .ent-cut-stage-frame{padding:7px}}",
      "@media (max-width:520px){.ent-cut-lab .ent-cut-figure{overflow-x:auto;-webkit-overflow-scrolling:touch}.ent-cut-lab .ent-cut-svg{min-width:720px;max-width:none}.ent-cut-lab .ent-cut-button-grid{grid-template-columns:minmax(0,1fr)}}",
      "@media (prefers-reduced-motion:reduce){.ent-cut-lab *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}"
    ].join("\n");
    var host = doc.head || doc.documentElement || doc.body;
    if (host) host.appendChild(style);
  }

  function rangeField(doc, id, label, min, max, step, value) {
    var wrapper = makeElement(doc, "label", {
      className: "ent-cut-field",
      htmlFor: id
    });
    var caption = makeElement(doc, "span", {
      className: "ent-cut-field-caption"
    });
    var output = makeElement(doc, "output", {
      className: "ent-cut-output",
      htmlFor: id
    });
    caption.appendChild(makeElement(doc, "span", { text: label }));
    caption.appendChild(output);
    wrapper.appendChild(caption);
    var input = makeElement(doc, "input", {
      id: id,
      type: "range",
      min: min,
      max: max,
      step: step,
      value: value,
      "aria-label": label
    });
    wrapper.appendChild(input);
    return { wrapper: wrapper, input: input, output: output };
  }

  function actionButton(doc, label, primary) {
    return makeElement(doc, "button", {
      type: "button",
      className: primary ? "ent-cut-button ent-cut-primary" : "ent-cut-button",
      text: label
    });
  }

  function metricGrid(doc, items) {
    var grid = makeElement(doc, "div", { className: "ent-cut-metrics" });
    var refs = {};
    items.forEach(function (item) {
      var card = makeElement(doc, "div", { className: "ent-cut-metric" });
      card.appendChild(makeElement(doc, "span", { text: item.label }));
      var value = makeElement(doc, "strong", { text: "—" });
      card.appendChild(value);
      grid.appendChild(card);
      refs[item.id] = value;
    });
    return { node: grid, refs: refs };
  }

  function svgText(doc, svg, x, y, value, attrs) {
    var merged = {
      x: x,
      y: y,
      "font-size": "11",
      className: "ent-cut-svg-text"
    };
    Object.keys(attrs || {}).forEach(function (key) {
      merged[key] = attrs[key];
    });
    svg.appendChild(makeSvg(doc, "text", merged, value));
  }

  function svgLine(doc, svg, x1, y1, x2, y2, className, extra) {
    var attrs = { x1: x1, y1: y1, x2: x2, y2: y2 };
    if (className) attrs.className = className;
    Object.keys(extra || {}).forEach(function (key) { attrs[key] = extra[key]; });
    svg.appendChild(makeSvg(doc, "line", attrs));
  }

  function svgRect(doc, svg, x, y, width, height, attrs) {
    var merged = { x: x, y: y, width: width, height: height };
    Object.keys(attrs || {}).forEach(function (key) { merged[key] = attrs[key]; });
    svg.appendChild(makeSvg(doc, "rect", merged));
  }

  function svgCircle(doc, svg, cx, cy, radius, attrs) {
    var merged = { cx: cx, cy: cy, r: radius };
    Object.keys(attrs || {}).forEach(function (key) { merged[key] = attrs[key]; });
    svg.appendChild(makeSvg(doc, "circle", merged));
  }

  function svgPath(doc, svg, d, attrs) {
    var merged = { d: d, fill: "none" };
    Object.keys(attrs || {}).forEach(function (key) { merged[key] = attrs[key]; });
    svg.appendChild(makeSvg(doc, "path", merged));
  }

  function panel(doc, svg, x, y, width, height, title) {
    svgRect(doc, svg, x, y, width, height, {
      fill: "var(--ec-panel)",
      stroke: "var(--ec-border)",
      "stroke-width": 1
    });
    svgText(doc, svg, x + 12, y + 22, title, {
      "font-size": 13,
      "font-weight": 700,
      fill: "var(--ec-fg)"
    });
  }

  function zeroMatrix(rows, columns) {
    var matrix = [];
    for (var row = 0; row < rows; row += 1) {
      matrix.push(new Array(columns).fill(0));
    }
    return matrix;
  }

  function matrixFromState(amplitudes, n, cut) {
    var leftSize = 1 << cut;
    var rightSize = 1 << (n - cut);
    var matrix = zeroMatrix(leftSize, rightSize);
    for (var index = 0; index < amplitudes.length; index += 1) {
      var rightMask = rightSize - 1;
      var row = index >> (n - cut);
      var column = index & rightMask;
      matrix[row][column] = amplitudes[index];
    }
    return matrix;
  }

  function normalizeAmplitudes(values) {
    var normSquared = values.reduce(function (sum, value) {
      return sum + value * value;
    }, 0);
    var norm = Math.sqrt(normSquared);
    assertCondition(norm > 0, "state norm must be positive");
    return values.map(function (value) { return value / norm; });
  }

  function makeProductState(n) {
    var values = new Array(1 << n).fill(0);
    values[0] = 1;
    return values;
  }

  function makeGHZState(n) {
    var values = new Array(1 << n).fill(0);
    var amplitude = 1 / Math.sqrt(2);
    values[0] = amplitude;
    values[values.length - 1] = amplitude;
    return values;
  }

  function makeClusterState(n) {
    var size = 1 << n;
    var amplitude = 1 / Math.sqrt(size);
    var values = [];
    for (var index = 0; index < size; index += 1) {
      var phaseParity = 0;
      for (var site = 0; site < n - 1; site += 1) {
        var leftBit = (index >> (n - 1 - site)) & 1;
        var rightBit = (index >> (n - 2 - site)) & 1;
        phaseParity += leftBit * rightBit;
      }
      values.push(phaseParity % 2 === 0 ? amplitude : -amplitude);
    }
    return values;
  }

  function makeRandomState(n) {
    var seed = (0x51a7c0de + 1009 * n) >>> 0;
    function next() {
      seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    var values = [];
    for (var index = 0; index < (1 << n); index += 1) {
      values.push(2 * next() - 1);
    }
    return normalizeAmplitudes(values);
  }

  function amplitudesForPreset(preset, n) {
    if (preset === "product") return makeProductState(n);
    if (preset === "ghz") return makeGHZState(n);
    if (preset === "cluster") return makeClusterState(n);
    return makeRandomState(n);
  }

  /*
   * Symmetric Jacobi rotations are sufficient for the Gram matrices here
   * (at most 8 by 8). The returned vectors are row-wise eigenvectors.
   */
  function jacobiSymmetric(input) {
    var n = input.length;
    var matrix = input.map(function (row) { return row.slice(); });
    var vectors = [];
    var i;
    var j;
    for (i = 0; i < n; i += 1) {
      vectors.push(new Array(n).fill(0));
      vectors[i][i] = 1;
    }
    var limit = Math.max(120, 50 * n * n);
    var iterations = 0;
    for (; iterations < limit; iterations += 1) {
      var p = 0;
      var q = n > 1 ? 1 : 0;
      var largest = 0;
      for (i = 0; i < n; i += 1) {
        for (j = i + 1; j < n; j += 1) {
          if (Math.abs(matrix[i][j]) > largest) {
            largest = Math.abs(matrix[i][j]);
            p = i;
            q = j;
          }
        }
      }
      if (largest < 1e-13 || n < 2) break;
      var app = matrix[p][p];
      var aqq = matrix[q][q];
      var apq = matrix[p][q];
      var tau = (aqq - app) / (2 * apq);
      var tangent = (tau >= 0 ? 1 : -1) /
        (Math.abs(tau) + Math.sqrt(1 + tau * tau));
      var cosine = 1 / Math.sqrt(1 + tangent * tangent);
      var sine = tangent * cosine;
      for (i = 0; i < n; i += 1) {
        if (i === p || i === q) continue;
        var aip = matrix[i][p];
        var aiq = matrix[i][q];
        matrix[i][p] = cosine * aip - sine * aiq;
        matrix[p][i] = matrix[i][p];
        matrix[i][q] = sine * aip + cosine * aiq;
        matrix[q][i] = matrix[i][q];
      }
      matrix[p][p] =
        cosine * cosine * app - 2 * sine * cosine * apq + sine * sine * aqq;
      matrix[q][q] =
        sine * sine * app + 2 * sine * cosine * apq + cosine * cosine * aqq;
      matrix[p][q] = 0;
      matrix[q][p] = 0;
      for (i = 0; i < n; i += 1) {
        var vip = vectors[i][p];
        var viq = vectors[i][q];
        vectors[i][p] = cosine * vip - sine * viq;
        vectors[i][q] = sine * vip + cosine * viq;
      }
    }
    var order = [];
    for (i = 0; i < n; i += 1) order.push(i);
    order.sort(function (left, right) {
      return matrix[right][right] - matrix[left][left];
    });
    var values = order.map(function (index) {
      return Math.max(0, matrix[index][index]);
    });
    var sortedVectors = order.map(function (index) {
      var vector = [];
      for (var row = 0; row < n; row += 1) vector.push(vectors[row][index]);
      return vector;
    });
    return {
      values: values,
      vectors: sortedVectors,
      iterations: iterations
    };
  }

  function dot(left, right) {
    var total = 0;
    for (var i = 0; i < left.length; i += 1) total += left[i] * right[i];
    return total;
  }

  function maxAbs(values) {
    var maximum = 0;
    values.forEach(function (value) {
      maximum = Math.max(maximum, Math.abs(value));
    });
    return maximum;
  }

  function computeSVD(matrix) {
    var rows = matrix.length;
    var columns = matrix[0].length;
    var useLeftGram = rows <= columns;
    var gramDimension = useLeftGram ? rows : columns;
    var gram = zeroMatrix(gramDimension, gramDimension);
    var row;
    var column;
    var other;
    if (useLeftGram) {
      for (row = 0; row < rows; row += 1) {
        for (other = 0; other < rows; other += 1) {
          var leftTotal = 0;
          for (column = 0; column < columns; column += 1) {
            leftTotal += matrix[row][column] * matrix[other][column];
          }
          gram[row][other] = leftTotal;
        }
      }
    } else {
      for (column = 0; column < columns; column += 1) {
        for (other = 0; other < columns; other += 1) {
          var rightTotal = 0;
          for (row = 0; row < rows; row += 1) {
            rightTotal += matrix[row][column] * matrix[row][other];
          }
          gram[column][other] = rightTotal;
        }
      }
    }
    var eigensystem = jacobiSymmetric(gram);
    var rawSingular = eigensystem.values.map(function (value) {
      return Math.sqrt(Math.max(0, value));
    });
    var normSquared = rawSingular.reduce(function (sum, value) {
      return sum + value * value;
    }, 0);
    assertCondition(normSquared > 0, "SVD norm must be positive");
    var probabilities = rawSingular.map(function (value) {
      return (value * value) / normSquared;
    });
    var singular = probabilities.map(function (value) { return Math.sqrt(value); });
    var leftVectors = [];
    var rightVectors = [];
    var singularResidual = 0;
    var transposeResidual = 0;
    for (var index = 0; index < singular.length; index += 1) {
      if (rawSingular[index] <= RANK_TOL) {
        leftVectors.push(new Array(rows).fill(0));
        rightVectors.push(new Array(columns).fill(0));
        continue;
      }
      var leftVector;
      var rightVector;
      if (useLeftGram) {
        leftVector = eigensystem.vectors[index].slice();
        rightVector = new Array(columns).fill(0);
        for (column = 0; column < columns; column += 1) {
          for (row = 0; row < rows; row += 1) {
            rightVector[column] += matrix[row][column] * leftVector[row];
          }
          rightVector[column] /= rawSingular[index];
        }
      } else {
        rightVector = eigensystem.vectors[index].slice();
        leftVector = new Array(rows).fill(0);
        for (row = 0; row < rows; row += 1) {
          for (column = 0; column < columns; column += 1) {
            leftVector[row] += matrix[row][column] * rightVector[column];
          }
          leftVector[row] /= rawSingular[index];
        }
      }
      leftVectors.push(leftVector);
      rightVectors.push(rightVector);
      for (row = 0; row < rows; row += 1) {
        var av = 0;
        for (column = 0; column < columns; column += 1) {
          av += matrix[row][column] * rightVector[column];
        }
        singularResidual = Math.max(
          singularResidual,
          Math.abs(av - rawSingular[index] * leftVector[row])
        );
      }
      for (column = 0; column < columns; column += 1) {
        var atU = 0;
        for (row = 0; row < rows; row += 1) {
          atU += matrix[row][column] * leftVector[row];
        }
        transposeResidual = Math.max(
          transposeResidual,
          Math.abs(atU - rawSingular[index] * rightVector[column])
        );
      }
    }
    var eigenResidual = 0;
    var orthogonalityResidual = 0;
    for (index = 0; index < gramDimension; index += 1) {
      var vector = eigensystem.vectors[index];
      for (var coordinate = 0; coordinate < gramDimension; coordinate += 1) {
        var gramVector = 0;
        for (other = 0; other < gramDimension; other += 1) {
          gramVector += gram[coordinate][other] * vector[other];
        }
        eigenResidual = Math.max(
          eigenResidual,
          Math.abs(gramVector - eigensystem.values[index] * vector[coordinate])
        );
      }
      for (other = 0; other < columns; other += 1) {
        if (other >= gramDimension) break;
        orthogonalityResidual = Math.max(
          orthogonalityResidual,
          Math.abs(dot(vector, eigensystem.vectors[other]) -
            (index === other ? 1 : 0))
        );
      }
    }
    var reconstructionResidual = 0;
    for (row = 0; row < rows; row += 1) {
      for (column = 0; column < columns; column += 1) {
        var reconstruction = 0;
        for (index = 0; index < singular.length; index += 1) {
          reconstruction += rawSingular[index] *
            leftVectors[index][row] * rightVectors[index][column];
        }
        reconstructionResidual = Math.max(
          reconstructionResidual,
          Math.abs(reconstruction - matrix[row][column])
        );
      }
    }
    var rank = rawSingular.reduce(function (count, value) {
      return count + (value > RANK_TOL ? 1 : 0);
    }, 0);
    var entropy = probabilities.reduce(function (sum, probability) {
      return probability > RANK_TOL
        ? sum - probability * Math.log(probability)
        : sum;
    }, 0);
    var spectrum = probabilities.map(function (probability) {
      return probability > RANK_TOL ? -Math.log(probability) : Infinity;
    });
    return {
      rows: rows,
      columns: columns,
      gram: gram,
      gramDimension: gramDimension,
      singular: singular,
      probabilities: probabilities,
      spectrum: spectrum,
      rank: rank,
      entropy: entropy,
      residuals: {
        eigen: eigenResidual,
        orthogonality: orthogonalityResidual,
        singular: singularResidual,
        transpose: transposeResidual,
        reconstruction: reconstructionResidual
      },
      iterations: eigensystem.iterations
    };
  }

  function analyzeState(amplitudes, n, cut, chi) {
    var matrix = matrixFromState(amplitudes, n, cut);
    var svd = computeSVD(matrix);
    var keptProbability = svd.probabilities.slice(0, chi).reduce(function (sum, value) {
      return sum + value;
    }, 0);
    var truncationError = clamp(1 - keptProbability, 0, 1);
    var fidelitySquared = clamp(keptProbability, 0, 1);
    var fidelity = Math.sqrt(fidelitySquared);
    return {
      cut: cut,
      matrix: matrix,
      svd: svd,
      keptProbability: keptProbability,
      truncationError: truncationError,
      fidelitySquared: fidelitySquared,
      fidelity: fidelity,
      entropyCapacity: Math.log(chi)
    };
  }

  function analyzeAll(amplitudes, n, chi) {
    var cuts = [];
    for (var cut = 1; cut < n; cut += 1) {
      cuts.push(analyzeState(amplitudes, n, cut, chi));
    }
    var exactBondDimension = cuts.reduce(function (maximum, item) {
      return Math.max(maximum, item.svd.rank);
    }, 0);
    var minimumRank = Math.min.apply(null, cuts.map(function (item) {
      return item.svd.rank;
    }));
    var minimumEntropy = Math.min.apply(null, cuts.map(function (item) {
      return item.svd.entropy;
    }));
    var minimumRankCuts = cuts.filter(function (item) {
      return item.svd.rank === minimumRank;
    }).map(function (item) { return item.cut; });
    var minimumEntropyCuts = cuts.filter(function (item) {
      return Math.abs(item.svd.entropy - minimumEntropy) < 1e-9;
    }).map(function (item) { return item.cut; });
    return {
      cuts: cuts,
      exactBondDimension: exactBondDimension,
      minimumRank: minimumRank,
      minimumRankCuts: minimumRankCuts,
      minimumEntropy: minimumEntropy,
      minimumEntropyCuts: minimumEntropyCuts,
      maximumTruncationError: Math.max.apply(null, cuts.map(function (item) {
        return item.truncationError;
      })),
      minimumFidelitySquared: Math.min.apply(null, cuts.map(function (item) {
        return item.fidelitySquared;
      }))
    };
  }

  function validateData(data, preset, n) {
    data.cuts.forEach(function (item) {
      var totalProbability = item.svd.probabilities.reduce(function (sum, value) {
        return sum + value;
      }, 0);
      assertCondition(Math.abs(totalProbability - 1) < ASSERT_TOL,
        "Schmidt probabilities must sum to 1");
      assertCondition(item.svd.residuals.eigen < ASSERT_TOL,
        "Gram eigen residual is too large");
      assertCondition(item.svd.residuals.orthogonality < ASSERT_TOL,
        "right singular vectors are not orthogonal");
      assertCondition(item.svd.residuals.singular < ASSERT_TOL,
        "A v = sigma u residual is too large");
      assertCondition(item.svd.residuals.transpose < ASSERT_TOL,
        "A^T u = sigma v residual is too large");
      assertCondition(item.svd.residuals.reconstruction < ASSERT_TOL,
        "SVD reconstruction residual is too large");
      assertCondition(item.svd.entropy <= Math.log(Math.max(1, item.svd.rank)) + ASSERT_TOL,
        "entropy exceeds log exact rank");
      assertCondition(Math.abs(
        item.truncationError + item.fidelitySquared - 1
      ) < ASSERT_TOL, "truncation and squared fidelity must complement");
    });
    assertCondition(data.cuts.length === n - 1, "all chain cuts must be present");
    if (preset === "product") {
      data.cuts.forEach(function (item) {
        assertCondition(item.svd.rank === 1, "product state rank must be one");
        assertCondition(item.svd.entropy < ASSERT_TOL, "product entropy must vanish");
      });
    }
    if (preset === "ghz" || preset === "cluster") {
      data.cuts.forEach(function (item) {
        assertCondition(item.svd.rank === 2, "fixed entangled preset rank must be two");
      });
    }
    if (preset === "random") {
      data.cuts.forEach(function (item) {
        var fullRank = Math.min(item.svd.rows, item.svd.columns);
        assertCondition(item.svd.rank === fullRank,
          "deterministic random toy must have full finite-cut rank");
      });
    }
  }

  function drawCoefficientPanel(doc, svg, x, y, width, height, data, state, api) {
    panel(doc, svg, x, y, width, height, "① coefficient matrix C^(k)");
    svgText(doc, svg, x + 12, y + 43,
      "cut k=" + state.cut + "：2^" + state.cut + " × 2^" +
      (state.n - state.cut) + " = " + data.svd.rows + " × " + data.svd.columns, {
        fill: "var(--ec-muted)"
      });
    var left = x + 58;
    var top = y + 68;
    var plotWidth = width - 78;
    var plotHeight = height - 96;
    var cellWidth = plotWidth / data.svd.columns;
    var cellHeight = plotHeight / data.svd.rows;
    var maximum = 0;
    data.matrix.forEach(function (row) {
      row.forEach(function (value) { maximum = Math.max(maximum, Math.abs(value)); });
    });
    maximum = Math.max(maximum, 1e-12);
    svgText(doc, svg, left + plotWidth / 2, y + 58, "右侧基底 β", {
      "text-anchor": "middle",
      "font-size": 10,
      fill: "var(--ec-muted)"
    });
    svgText(doc, svg, x + 20, top + plotHeight / 2, "左侧 α", {
      "text-anchor": "middle",
      "font-size": 10,
      fill: "var(--ec-muted)",
      transform: "rotate(-90 " + (x + 20) + " " + (top + plotHeight / 2) + ")"
    });
    for (var row = 0; row < data.matrix.length; row += 1) {
      for (var column = 0; column < data.matrix[row].length; column += 1) {
        var value = data.matrix[row][column];
        var magnitude = Math.abs(value) / maximum;
        var fill = value >= 0 ? "var(--ec-accent)" : "var(--ec-red)";
        svgRect(doc, svg, left + column * cellWidth, top + row * cellHeight,
          Math.max(1, cellWidth - 1), Math.max(1, cellHeight - 1), {
            fill: fill,
            "fill-opacity": value === 0 ? 0.045 : 0.18 + 0.82 * magnitude,
            stroke: "var(--ec-border)",
            "stroke-width": 0.6
          });
        if (cellWidth >= 27 && cellHeight >= 19) {
          svgText(doc, svg, left + column * cellWidth + cellWidth / 2,
            top + row * cellHeight + cellHeight * 0.65,
            formatNumber(api, value, 2), {
              "text-anchor": "middle",
              "font-size": 9,
              fill: value === 0 ? "var(--ec-muted)" : "var(--ec-fg)"
            });
        }
      }
    }
    for (column = 0; column < data.svd.columns; column += 1) {
      svgText(doc, svg, left + (column + 0.5) * cellWidth, top - 5,
        String(column), {
          "text-anchor": "middle",
          "font-size": 9,
          fill: "var(--ec-muted)"
        });
    }
    for (row = 0; row < data.svd.rows; row += 1) {
      svgText(doc, svg, left - 7, top + (row + 0.65) * cellHeight,
        String(row), {
          "text-anchor": "end",
          "font-size": 9,
          fill: "var(--ec-muted)"
        });
    }
    svgText(doc, svg, x + 12, y + height - 10,
      "颜色：正/负振幅；透明度：|Cαβ| · ||C||F²=1", {
        fill: "var(--ec-muted)",
        "font-size": 10
      });
  }

  function drawSpectrumPanel(doc, svg, x, y, width, height, data, state, api) {
    panel(doc, svg, x, y, width, height, "② Schmidt / SVD：σᵢ、pᵢ、ξᵢ");
    var svd = data.svd;
    svgText(doc, svg, x + 12, y + 43,
      "rank r=" + svd.rank + " · S=" + formatNumber(api, svd.entropy, 3) +
      " · capacity lnχ=" + formatNumber(api, data.entropyCapacity, 3), {
        fill: "var(--ec-muted)"
      });
    var left = x + 42;
    var top = y + 66;
    var right = x + width - 16;
    var bottom = y + 185;
    var plotWidth = right - left;
    var plotHeight = bottom - top;
    var maxProbability = Math.max.apply(null, svd.probabilities);
    var barSlot = plotWidth / svd.probabilities.length;
    var barWidth = Math.max(5, barSlot * 0.64);
    [0, maxProbability / 2, maxProbability].forEach(function (tick) {
      var tickY = bottom - (tick / Math.max(maxProbability, 1e-12)) * plotHeight;
      svgLine(doc, svg, left, tickY, right, tickY, null, {
        stroke: "var(--ec-border)",
        "stroke-width": 0.8,
        "stroke-dasharray": tick === 0 ? "" : "3 4"
      });
      svgText(doc, svg, left - 7, tickY + 4, formatNumber(api, tick, 2), {
        "text-anchor": "end",
        "font-size": 9,
        fill: "var(--ec-muted)"
      });
    });
    svgLine(doc, svg, left, top, left, bottom, null, {
      stroke: "var(--ec-muted)",
      "stroke-width": 1
    });
    svgLine(doc, svg, left, bottom, right, bottom, null, {
      stroke: "var(--ec-muted)",
      "stroke-width": 1
    });
    svd.probabilities.forEach(function (probability, index) {
      var barX = left + index * barSlot + (barSlot - barWidth) / 2;
      var barHeight = probability / Math.max(maxProbability, 1e-12) * plotHeight;
      svgRect(doc, svg, barX, bottom - barHeight, barWidth, barHeight, {
        fill: index < state.chi ? "var(--ec-accent)" : "var(--ec-red)",
        "fill-opacity": probability < RANK_TOL ? 0.18 : 0.86,
        stroke: index < state.chi ? "var(--ec-accent)" : "var(--ec-red)",
        "stroke-width": 0.8
      });
      svgText(doc, svg, barX + barWidth / 2, bottom + 16,
        String(index + 1), {
          "text-anchor": "middle",
          "font-size": 9,
          fill: "var(--ec-muted)"
        });
    });
    var cutX = left + Math.min(state.chi, svd.probabilities.length) * barSlot;
    svgLine(doc, svg, cutX, top - 5, cutX, bottom + 4, null, {
      stroke: "var(--ec-gold)",
      "stroke-width": 2,
      "stroke-dasharray": "4 3"
    });
    svgText(doc, svg, cutX, top - 9, "χ", {
      "text-anchor": "middle",
      "font-size": 10,
      "font-weight": 700,
      fill: "var(--ec-gold)"
    });
    var sigmaText = "σ: " + formatList(api, svd.singular, 3);
    var xiText = "ξ=-ln p: " + svd.spectrum.map(function (value) {
      return Number.isFinite(value) ? formatNumber(api, value, 2) : "∞";
    }).join(", ");
    svgText(doc, svg, x + 12, y + 220, sigmaText, {
      "font-size": 10,
      fill: "var(--ec-muted)"
    });
    svgText(doc, svg, x + 12, y + 240, xiText, {
      "font-size": 10,
      fill: "var(--ec-muted)"
    });
    svgText(doc, svg, x + 12, y + height - 31,
      "εχ=" + formatNumber(api, data.truncationError, 4) +
      " · Fχ=" + formatNumber(api, data.fidelity, 4) +
      " · Fχ²=" + formatNumber(api, data.fidelitySquared, 4), {
        "font-size": 11,
        "font-weight": 700,
        fill: data.truncationError < ASSERT_TOL ? "var(--ec-green)" : "var(--ec-fg)"
      });
    svgText(doc, svg, x + 12, y + height - 11,
      "蓝色保留前 χ 条；红色是丢弃尾部 · pᵢ=σᵢ²", {
        "font-size": 10,
        fill: "var(--ec-muted)"
      });
  }

  function drawBridgePanel(doc, svg, x, y, width, height, allData, state, api) {
    panel(doc, svg, x, y, width, height, "③ 链上每个 cut：Schmidt rank / entropy 的桥");
    var cuts = allData.cuts;
    var left = x + 46;
    var right = x + width - 46;
    var siteY = y + 245;
    var bridgeBase = y + 205;
    var spacing = (right - left) / Math.max(1, state.n - 1);
    var maxRank = Math.max.apply(null, cuts.map(function (item) {
      return item.svd.rank;
    }));
    var maxEntropy = Math.max.apply(null, cuts.map(function (item) {
      return item.svd.entropy;
    }));
    var minimumRank = allData.minimumRank;
    var minimumEntropy = allData.minimumEntropy;
    for (var site = 0; site < state.n - 1; site += 1) {
      svgLine(doc, svg, left + site * spacing, siteY,
        left + (site + 1) * spacing, siteY, null, {
          stroke: "var(--ec-muted)",
          "stroke-width": 2
        });
    }
    for (site = 0; site < state.n; site += 1) {
      svgCircle(doc, svg, left + site * spacing, siteY, 7, {
        fill: "var(--ec-bg)",
        stroke: "var(--ec-accent)",
        "stroke-width": 2
      });
      svgText(doc, svg, left + site * spacing, siteY + 24, String(site + 1), {
        "text-anchor": "middle",
        "font-size": 10,
        fill: "var(--ec-muted)"
      });
    }
    cuts.forEach(function (item, index) {
      var leftX = left + index * spacing;
      var rightX = left + (index + 1) * spacing;
      var isSelected = item.cut === state.cut;
      var isMinRank = item.svd.rank === minimumRank;
      var isMinEntropy = Math.abs(item.svd.entropy - minimumEntropy) < 1e-9;
      var bridgeHeight = 37 + 22 * item.svd.rank / Math.max(1, maxRank);
      var path = "M" + leftX.toFixed(2) + "," + bridgeBase.toFixed(2) +
        " C" + leftX.toFixed(2) + "," + (bridgeBase - bridgeHeight).toFixed(2) +
        " " + rightX.toFixed(2) + "," + (bridgeBase - bridgeHeight).toFixed(2) +
        " " + rightX.toFixed(2) + "," + bridgeBase.toFixed(2);
      svgPath(doc, svg, path, {
        stroke: isSelected ? "var(--ec-accent)" :
          isMinRank ? "var(--ec-gold)" : "var(--ec-muted)",
        "stroke-width": isSelected ? 5 : 2 + 2 * item.svd.rank / Math.max(1, maxRank),
        opacity: isSelected ? 1 : 0.78
      });
      var labelY = bridgeBase - bridgeHeight - 12;
      svgText(doc, svg, (leftX + rightX) / 2, labelY,
        "k" + item.cut + "  r" + item.svd.rank, {
          "text-anchor": "middle",
          "font-size": 10,
          "font-weight": isSelected ? 700 : 500,
          fill: isSelected ? "var(--ec-accent)" :
            isMinRank ? "var(--ec-gold)" : "var(--ec-fg)"
        });
      svgText(doc, svg, (leftX + rightX) / 2, labelY + 13,
        "S=" + formatNumber(api, item.svd.entropy, 2), {
          "text-anchor": "middle",
          "font-size": 9,
          fill: isMinEntropy ? "var(--ec-green)" : "var(--ec-muted)"
        });
      if (isMinEntropy) {
        svgCircle(doc, svg, (leftX + rightX) / 2, bridgeBase + 7, 3.5, {
          fill: "var(--ec-green)"
        });
      }
    });
    svgText(doc, svg, x + 16, y + 42,
      "蓝色=当前 cut · 金色=局部最小 rank（最窄 rank 桥）· 绿色点=最小熵 cut", {
        "font-size": 10,
        fill: "var(--ec-muted)"
      });
    svgText(doc, svg, x + 16, y + 73,
      "统一 exact MPS χ*=max r=" + allData.exactBondDimension +
      " · 当前固定 χ=" + state.chi +
      " · 熵容量 lnχ=" + formatNumber(api, Math.log(state.chi), 3), {
        "font-size": 11,
        "font-weight": 700,
        fill: state.chi >= allData.exactBondDimension
          ? "var(--ec-green)" : "var(--ec-fg)"
      });
    svgText(doc, svg, x + 16, y + height - 47,
      "min rank cuts: " + allData.minimumRankCuts.join(", ") +
      " · min S cuts: " + allData.minimumEntropyCuts.join(", "), {
        "font-size": 10,
        fill: "var(--ec-muted)"
      });
    svgText(doc, svg, x + 16, y + height - 25,
      "全链固定 χ 的最坏截断 ε=" +
      formatNumber(api, allData.maximumTruncationError, 4) +
      " · 最小 F²=" + formatNumber(api, allData.minimumFidelitySquared, 4), {
        "font-size": 10,
        fill: "var(--ec-muted)"
      });
    svgText(doc, svg, x + 16, y + height - 8,
      "桥的 rank 与熵是两本账；熵小不自动保证谱尾小。", {
        "font-size": 10,
        fill: "var(--ec-muted)"
      });
  }

  function drawDashboard(doc, stage, allData, state, api) {
    var svg = stage.svg;
    clear(svg);
    var titleId = stage.id + "-title";
    var descId = stage.id + "-desc";
    svg.appendChild(makeSvg(doc, "title", { id: titleId },
      "双分割系数矩阵、Schmidt SVD、纠缠谱、截断与链上桥宽"));
    svg.appendChild(makeSvg(doc, "desc", { id: descId },
      state.presetLabel + "，N=" + state.n + "，当前 cut=" + state.cut +
      "，固定 bond dimension chi=" + state.chi +
      "；图中显示 coefficient matrix、Schmidt weights、entanglement spectrum " +
      "和每个 cut 的 rank 与 entropy。"));
    svg.setAttribute("aria-labelledby", titleId + " " + descId);
    svgRect(doc, svg, 0, 0, 900, 760, {
      fill: "var(--ec-bg)",
      stroke: "none"
    });
    var current = allData.cuts[state.cut - 1];
    drawCoefficientPanel(doc, svg, 12, 12, 426, 310, current, state, api);
    drawSpectrumPanel(doc, svg, 462, 12, 426, 310, current, state, api);
    drawBridgePanel(doc, svg, 12, 334, 876, 414, allData, state, api);
  }

  function buildLab(root, api) {
    var doc = root.ownerDocument || document;
    injectStyles(doc);
    root.classList.add("ent-cut-lab");
    INSTANCE += 1;
    var serial = INSTANCE;
    var ids = {
      n: "ent-cut-n-" + serial,
      cut: "ent-cut-cut-" + serial,
      chi: "ent-cut-chi-" + serial,
      stage: "ent-cut-stage-" + serial
    };
    var presets = [
      { id: "product", label: "product |000…0⟩" },
      { id: "ghz", label: "GHZ" },
      { id: "cluster", label: "cluster-like" },
      { id: "random", label: "固定随机 toy" }
    ];
    var state = {
      preset: "ghz",
      presetLabel: "GHZ",
      n: 6,
      cut: 3,
      chi: 2
    };
    var shell = makeElement(doc, "div", { className: "ent-cut-shell" });
    shell.appendChild(makeElement(doc, "h3", {
      className: "ent-cut-heading",
      text: "Entanglement cut lab：从 C 到 Schmidt 桥宽"
    }));
    shell.appendChild(makeElement(doc, "p", {
      className: "ent-cut-intro",
      text: "所有态与数字都由固定公式/固定种子重算：先选一条态，再选 cut，最后固定 bond dimension χ。蓝色柱是保留谱，红色柱是截断尾；链图同时显示每个 cut 的 exact rank 与 entropy。"
    }));

    var layout = makeElement(doc, "div", { className: "ent-cut-layout" });
    var controls = makeElement(doc, "aside", {
      className: "ent-cut-controls",
      "aria-label": "纠缠切分控制"
    });
    var presetSection = makeElement(doc, "div", {
      className: "ent-cut-control-section"
    });
    presetSection.appendChild(makeElement(doc, "h4", {
      text: "确定性态预设（先预测）"
    }));
    var presetButtons = {};
    var presetGrid = makeElement(doc, "div", {
      className: "ent-cut-button-grid",
      role: "group",
      "aria-label": "态预设"
    });
    presets.forEach(function (preset) {
      var button = actionButton(doc, preset.label, preset.id === state.preset);
      button.setAttribute("aria-pressed", preset.id === state.preset ? "true" : "false");
      button.addEventListener("click", function () {
        state.preset = preset.id;
        state.presetLabel = preset.label;
        render("已切换到“" + preset.label + "”；先比较五个 cut 的 rank，再看谱尾。");
      });
      presetButtons[preset.id] = button;
      presetGrid.appendChild(button);
    });
    presetSection.appendChild(presetGrid);
    controls.appendChild(presetSection);

    var dimensionSection = makeElement(doc, "div", {
      className: "ent-cut-control-section"
    });
    dimensionSection.appendChild(makeElement(doc, "h4", { text: "切分与接口容量" }));
    var nField = rangeField(doc, ids.n, "qubit 数 N", 4, 8, 1, state.n);
    var cutField = rangeField(doc, ids.cut, "当前 cut k", 1, state.n - 1, 1, state.cut);
    var chiField = rangeField(doc, ids.chi, "固定 bond dimension χ", 1,
      1 << Math.floor(state.n / 2), 1, state.chi);
    dimensionSection.appendChild(nField.wrapper);
    dimensionSection.appendChild(cutField.wrapper);
    dimensionSection.appendChild(chiField.wrapper);
    dimensionSection.appendChild(makeElement(doc, "div", {
      className: "ent-cut-formula",
      text: "C^(k) ∈ R^(2^k×2^(N−k))；p_i=σ_i²；S=−Σp_i ln p_i；εχ=Σ_{i>χ}p_i"
    }));
    controls.appendChild(dimensionSection);

    var actionSection = makeElement(doc, "div", {
      className: "ent-cut-control-section"
    });
    var resetButton = actionButton(doc, "重置为 N=6 的 GHZ / k=3 / χ=2", true);
    resetButton.addEventListener("click", function () {
      state.preset = "ghz";
      state.presetLabel = "GHZ";
      state.n = 6;
      state.cut = 3;
      state.chi = 2;
      render("已重置：GHZ，N=6，cut k=3，固定 χ=2。");
    });
    actionSection.appendChild(resetButton);
    actionSection.appendChild(makeElement(doc, "p", {
      className: "ent-cut-note",
      text: "χ 是统一的表示容量；它不是某个 cut 的 exact rank，也不是唯一的 MPS 参数坐标。固定 χ 时，实验按每个 cut 的谱分别计算最优截断。"
    }));
    controls.appendChild(actionSection);

    var stage = makeElement(doc, "section", {
      className: "ent-cut-stage",
      "aria-labelledby": ids.stage
    });
    var stageFrame = makeElement(doc, "div", { className: "ent-cut-stage-frame" });
    var stageTitle = makeElement(doc, "div", { className: "ent-cut-stage-title" }, [
      makeElement(doc, "strong", {
        id: ids.stage,
        text: "三面板对账：C → SVD → 桥宽"
      }),
      makeElement(doc, "span", { text: "原生 SVG · 可重复 · 无远程依赖" })
    ]);
    var figure = makeElement(doc, "figure", {
      className: "ent-cut-figure",
      "aria-label": "纠缠切分三面板图"
    });
    var svg = makeSvg(doc, "svg", {
      className: "ent-cut-svg",
      viewBox: "0 0 900 760",
      role: "img",
      preserveAspectRatio: "xMidYMid meet"
    });
    figure.appendChild(svg);
    stageFrame.appendChild(stageTitle);
    stageFrame.appendChild(figure);
    stage.appendChild(stageFrame);
    var metrics = metricGrid(doc, [
      { id: "rank", label: "当前 exact rank r_k" },
      { id: "entropy", label: "当前 entropy S_k" },
      { id: "capacity", label: "固定 χ 的 ln χ" },
      { id: "tail", label: "当前截断 εχ" },
      { id: "fidelity", label: "overlap Fχ" },
      { id: "fidelitySquared", label: "squared fidelity Fχ²" },
      { id: "exactChi", label: "全链 exact χ*" },
      { id: "worstTail", label: "全链最坏 εχ" }
    ]);
    stage.appendChild(metrics.node);
    var legend = makeElement(doc, "div", { className: "ent-cut-legend" }, [
      makeElement(doc, "span", { className: "ent-cut-legend-item" }, [
        makeElement(doc, "i", { className: "ent-cut-swatch" }), "当前 cut / 保留谱"
      ]),
      makeElement(doc, "span", { className: "ent-cut-legend-item" }, [
        makeElement(doc, "i", { className: "ent-cut-swatch ent-cut-swatch-red" }), "截断尾"
      ]),
      makeElement(doc, "span", { className: "ent-cut-legend-item" }, [
        makeElement(doc, "i", { className: "ent-cut-swatch ent-cut-swatch-gold" }), "最窄 rank 桥"
      ]),
      makeElement(doc, "span", { className: "ent-cut-legend-item" }, [
        makeElement(doc, "i", { className: "ent-cut-swatch ent-cut-swatch-green" }), "最小 entropy"
      ])
    ]);
    stage.appendChild(legend);
    var checks = makeElement(doc, "p", { className: "ent-cut-checks" });
    stage.appendChild(checks);
    var status = makeElement(doc, "p", {
      className: "ent-cut-status",
      "data-cl-live": true,
      "aria-live": "polite",
      "aria-atomic": "true"
    });
    stage.appendChild(status);
    layout.appendChild(controls);
    layout.appendChild(stage);
    shell.appendChild(layout);
    root.replaceChildren(shell);

    function maximumChi(n) {
      return 1 << Math.floor(n / 2);
    }

    function presetId() {
      return state.preset;
    }

    function render(message) {
      state.n = clamp(Math.round(number(state.n, 6)), 4, 8);
      state.cut = clamp(Math.round(number(state.cut, 3)), 1, state.n - 1);
      state.chi = clamp(Math.round(number(state.chi, 2)), 1, maximumChi(state.n));
      var amplitudes = amplitudesForPreset(state.preset, state.n);
      var allData = analyzeAll(amplitudes, state.n, state.chi);
      validateData(allData, state.preset, state.n);
      var current = allData.cuts[state.cut - 1];
      nField.input.value = String(state.n);
      cutField.input.max = String(state.n - 1);
      cutField.input.value = String(state.cut);
      chiField.input.max = String(maximumChi(state.n));
      chiField.input.value = String(state.chi);
      nField.output.textContent = String(state.n);
      cutField.output.textContent = "k=" + state.cut +
        "（" + state.cut + " | " + (state.n - state.cut) + "）";
      chiField.output.textContent = "χ=" + state.chi +
        "，lnχ=" + formatNumber(api, Math.log(state.chi), 3);
      metrics.refs.rank.textContent = String(current.svd.rank);
      metrics.refs.entropy.textContent = formatNumber(api, current.svd.entropy, 4);
      metrics.refs.capacity.textContent = formatNumber(api, Math.log(state.chi), 4);
      metrics.refs.tail.textContent = formatNumber(api, current.truncationError, 5);
      metrics.refs.fidelity.textContent = formatNumber(api, current.fidelity, 5);
      metrics.refs.fidelitySquared.textContent = formatNumber(api, current.fidelitySquared, 5);
      metrics.refs.exactChi.textContent = String(allData.exactBondDimension);
      metrics.refs.worstTail.textContent = formatNumber(api, allData.maximumTruncationError, 5);
      checks.replaceChildren(
        doc.createTextNode(
          "数值核对：每个 cut 都通过 Gram→Jacobi→SVD；"
        ),
        makeElement(doc, "strong", {
          text: "本征残差 " + formatNumber(api, Math.max.apply(null,
            allData.cuts.map(function (item) { return item.svd.residuals.eigen; })), 2) +
            " · 正交残差 " + formatNumber(api, Math.max.apply(null,
              allData.cuts.map(function (item) {
                return item.svd.residuals.orthogonality;
              })), 2) +
            " · 重构残差 " + formatNumber(api, Math.max.apply(null,
              allData.cuts.map(function (item) {
                return item.svd.residuals.reconstruction;
              })), 2)
        }),
        doc.createTextNode("；归一化、奇异向量残差与 εχ+Fχ²=1 也已断言。")
      );
      drawDashboard(doc, { svg: svg, id: "ent-cut-stage-" + serial },
        allData, {
          n: state.n,
          cut: state.cut,
          chi: state.chi,
          presetLabel: state.presetLabel
        }, api);
      Object.keys(presetButtons).forEach(function (id) {
        var active = id === presetId();
        presetButtons[id].setAttribute("aria-pressed", active ? "true" : "false");
        presetButtons[id].classList.toggle("ent-cut-primary", active);
      });
      var capacityMessage = current.svd.entropy <= Math.log(state.chi) + ASSERT_TOL
        ? "当前 S≤lnχ 容量上界成立；仍需看 exact rank 与谱尾。"
        : "当前 S>lnχ：固定 χ 的容量不足以承载该 cut 的熵。";
      var exactMessage = state.chi >= allData.exactBondDimension
        ? "全链 χ≥χ*，此预设可被统一 MPS 精确表示。"
        : "全链 χ<χ*，至少一个 cut 需要截断；比较最坏 ε 与 F²。";
      status.textContent = message || (
        "当前为“" + state.presetLabel + "”，cut k=" + state.cut +
        "；" + capacityMessage + " " + exactMessage
      );
      if (message && api && typeof api.announce === "function") {
        api.announce(root, message);
      }
    }

    nField.input.addEventListener("input", function () {
      state.n = number(nField.input.value, state.n);
      state.cut = clamp(state.cut, 1, Math.round(state.n) - 1);
      state.chi = clamp(state.chi, 1, maximumChi(Math.round(state.n)));
      render("");
    });
    cutField.input.addEventListener("input", function () {
      state.cut = number(cutField.input.value, state.cut);
      render("");
    });
    chiField.input.addEventListener("input", function () {
      state.chi = number(chiField.input.value, state.chi);
      render("");
    });
    render("已准备 GHZ 预设：先预测五个 cut 的 rank，再调 χ 看截断。");
  }

  window.CourseLearning.register("entanglement-cut", buildLab);
}());

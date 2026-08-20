(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }

  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("markov-mixing", exported.mount);
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
        "markov-mixing self-test: PASS (" +
          report.checks +
          " checks, " +
          report.presets +
          " presets)"
      );
    } catch (error) {
      console.error("markov-mixing self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-markov-mixing-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;

  var DEFAULT = {
    presetId: "mixing",
    t: 4,
    initialIndex: 0
  };

  var PRESETS = [
    {
      id: "mixing",
      label: "不可约 + 非周期：混合",
      matrix: [
        [0.8, 0.2],
        [0.3, 0.7]
      ],
      stationary: [0.6, 0.4],
      eigenvalues: [1, 0.5],
      periodLabel: "d=1",
      structureLabel: "一个互通类；不可约、非周期",
      note: "唯一平稳分布；从任意初始分布收敛。"
    },
    {
      id: "periodic",
      label: "不可约 + 周期：来回跳",
      matrix: [
        [0, 1],
        [1, 0]
      ],
      stationary: [0.5, 0.5],
      eigenvalues: [1, -1],
      periodLabel: "d=2",
      structureLabel: "一个互通类；不可约、周期",
      note: "平稳分布存在且唯一，但 δ₀Pᵗ 在两个点之间振荡。"
    },
    {
      id: "reducible",
      label: "可约：两个吸收类",
      matrix: [
        [1, 0, 0],
        [0, 1, 0],
        [0.5, 0.5, 0]
      ],
      stationary: [0.5, 0.5, 0],
      eigenvalues: [1, 1, 0],
      periodLabel: "闭类各 d=1；全链不可约性失败",
      structureLabel: "三个互通类；{0}、{1} 为闭吸收类",
      note: "平稳分布不唯一：任意 (a,1-a,0) 都平稳；极限依赖初始类。"
    }
  ];

  var STYLE_TEXT = [
    ".mm-lab{--mm-blue:var(--cl-blue,#315f9d);--mm-gold:var(--cl-gold,#9b6a12);--mm-green:var(--cl-green,#39734d);--mm-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;}",
    ".mm-lab *,.mm-lab *::before,.mm-lab *::after{box-sizing:border-box;}",
    ".mm-lab [hidden]{display:none!important;}",
    ".mm-lab h3,.mm-lab h4{margin:0;color:var(--fg);}",
    ".mm-lab h3{font-size:1.18rem;}",
    ".mm-lab h4{margin-top:16px;font-size:1rem;}",
    ".mm-lab button,.mm-lab input{font:inherit;}",
    ".mm-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}",
    ".mm-lab button:hover{border-color:var(--accent);}",
    ".mm-lab button[aria-pressed=\"true\"],.mm-lab button.mm-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:700;}",
    ".mm-lab button:disabled{cursor:not-allowed;opacity:.55;}",
    ".mm-lab button:focus-visible,.mm-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
    ".mm-lab .mm-note,.mm-lab .mm-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65;overflow-wrap:anywhere;}",
    ".mm-lab .mm-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--mm-gold);background:var(--bg);}",
    ".mm-lab fieldset{min-width:0;margin:0;padding:0;border:0;}",
    ".mm-lab legend{margin-bottom:8px;color:var(--fg-soft);font-size:13px;font-weight:750;}",
    ".mm-lab .mm-question-list{display:grid;gap:12px;}",
    ".mm-lab .mm-question{min-width:0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);}",
    ".mm-lab .mm-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}",
    ".mm-lab .mm-choice-grid button{font-size:12px;}",
    ".mm-lab .mm-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}",
    ".mm-lab .mm-actions>*{flex:1 1 170px;}",
    ".mm-lab .mm-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}",
    ".mm-lab .mm-pass{color:var(--mm-green);}.mm-lab .mm-warn{color:var(--mm-red);}",
    ".mm-lab .mm-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}",
    ".mm-lab .mm-layout{display:grid;grid-template-columns:minmax(210px,.72fr) minmax(0,1.28fr);gap:16px;align-items:start;min-width:0;}",
    ".mm-lab .mm-controls,.mm-lab .mm-stage{min-width:0;}",
    ".mm-lab .mm-controls{display:grid;gap:12px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}",
    ".mm-lab .mm-control{display:grid;gap:5px;min-width:0;}",
    ".mm-lab .mm-control label,.mm-lab .mm-control-title{color:var(--fg-soft);font-size:13px;font-weight:700;}",
    ".mm-lab .mm-control output{color:var(--accent);font-variant-numeric:tabular-nums;}",
    ".mm-lab .mm-control input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}",
    ".mm-lab .mm-scale{display:flex;justify-content:space-between;gap:8px;color:var(--fg-soft);font-size:11px;}",
    ".mm-lab .mm-option-grid,.mm-lab .mm-preset-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;}",
    ".mm-lab .mm-option-grid button,.mm-lab .mm-preset-grid button{font-size:12px;}",
    ".mm-lab .mm-stage-frame{min-width:0;padding:9px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}",
    ".mm-lab .mm-stage-title{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin:0 0 8px;color:var(--fg-soft);font-size:13px;}",
    ".mm-lab .mm-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg);}",
    ".mm-lab .mm-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}",
    ".mm-lab .mm-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.68;}",
    ".mm-lab .mm-axis{stroke:currentColor;stroke-width:1.2;stroke-opacity:.72;}",
    ".mm-lab .mm-curve{fill:none;stroke:var(--mm-blue);stroke-width:3;}",
    ".mm-lab .mm-point{fill:var(--mm-blue);stroke:var(--bg);stroke-width:2;}",
    ".mm-lab .mm-current{fill:var(--mm-red);stroke:var(--bg);stroke-width:2;}",
    ".mm-lab .mm-stationary{fill:var(--mm-gold);stroke:var(--bg);stroke-width:2;}",
    ".mm-lab .mm-bar-mu{fill:var(--mm-blue);}.mm-lab .mm-bar-pi{fill:var(--mm-gold);}",
    ".mm-lab .mm-legend{display:flex;flex-wrap:wrap;gap:8px 14px;margin:8px 0 0;color:var(--fg-soft);font-size:12px;}",
    ".mm-lab .mm-legend span{display:inline-flex;align-items:center;gap:5px;}.mm-lab .mm-swatch{display:inline-block;width:18px;height:3px;background:currentColor;}",
    ".mm-lab .mm-swatch-blue{color:var(--mm-blue);}.mm-lab .mm-swatch-gold{color:var(--mm-gold);}.mm-lab .mm-swatch-red{color:var(--mm-red);}",
    ".mm-lab .mm-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(122px,1fr));gap:8px;margin:12px 0;}",
    ".mm-lab .mm-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}",
    ".mm-lab .mm-metric:nth-child(1),.mm-lab .mm-metric:nth-child(4){border-top-color:var(--mm-blue);}.mm-lab .mm-metric:nth-child(2),.mm-lab .mm-metric:nth-child(5){border-top-color:var(--mm-gold);}.mm-lab .mm-metric:nth-child(3),.mm-lab .mm-metric:nth-child(6){border-top-color:var(--mm-red);}",
    ".mm-lab .mm-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4;}.mm-lab .mm-metric strong{display:block;margin-top:3px;color:var(--fg);font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
    ".mm-lab .mm-table-wrap{max-width:100%;margin-top:10px;overflow-x:auto;-webkit-overflow-scrolling:touch;}",
    ".mm-lab table{width:100%;min-width:620px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}",
    ".mm-lab th,.mm-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere;}.mm-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750;}",
    ".mm-lab .mm-interpretation{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--mm-green);background:var(--bg);font-size:13px;line-height:1.7;overflow-wrap:anywhere;}",
    "@media(max-width:900px){.mm-lab .mm-layout{grid-template-columns:minmax(0,1fr);}}",
    "@media(max-width:760px){.mm-lab .mm-choice-grid{grid-template-columns:minmax(0,1fr);}.mm-lab .mm-preset-grid{grid-template-columns:minmax(0,1fr);}}",
    "@media(max-width:420px){.mm-lab .mm-stage-frame{padding:6px;}.mm-lab table{font-size:11.5px;}.mm-lab th,.mm-lab td{padding-left:5px;padding-right:5px;}}",
    "@media(prefers-reduced-motion:reduce){.mm-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || EPS) * scale;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function gcd(left, right) {
    var a = Math.abs(Math.round(left));
    var b = Math.abs(Math.round(right));
    while (b) {
      var next = a % b;
      a = b;
      b = next;
    }
    return a;
  }

  function identity(size) {
    var result = [];
    for (var row = 0; row < size; row += 1) {
      result.push([]);
      for (var column = 0; column < size; column += 1) {
        result[row].push(row === column ? 1 : 0);
      }
    }
    return result;
  }

  function cloneMatrix(matrix) {
    return matrix.map(function (row) { return row.slice(); });
  }

  function multiplyMatrices(left, right) {
    var size = left.length;
    var result = [];
    for (var row = 0; row < size; row += 1) {
      result.push([]);
      for (var column = 0; column < size; column += 1) {
        var total = 0;
        for (var inner = 0; inner < size; inner += 1) {
          total += left[row][inner] * right[inner][column];
        }
        result[row].push(total);
      }
    }
    return result;
  }

  function matrixPower(matrix, exponent) {
    var power = Math.max(0, Math.round(Number(exponent)));
    var result = identity(matrix.length);
    var base = cloneMatrix(matrix);
    while (power > 0) {
      if (power % 2 === 1) result = multiplyMatrices(result, base);
      base = multiplyMatrices(base, base);
      power = Math.floor(power / 2);
    }
    return result;
  }

  function rowTimesMatrix(row, matrix) {
    return matrix[0].map(function (_, column) {
      return row.reduce(function (total, value, index) {
        return total + value * matrix[index][column];
      }, 0);
    });
  }

  function sum(values) {
    return values.reduce(function (total, value) { return total + value; }, 0);
  }

  function totalVariation(left, right) {
    return 0.5 * left.reduce(function (total, value, index) {
      return total + Math.abs(value - right[index]);
    }, 0);
  }

  function vectorResidual(left, right) {
    return left.reduce(function (total, value, index) {
      return total + Math.abs(value - right[index]);
    }, 0);
  }

  function presetById(id) {
    for (var index = 0; index < PRESETS.length; index += 1) {
      if (PRESETS[index].id === id) return PRESETS[index];
    }
    return PRESETS[0];
  }

  function deltaVector(size, index) {
    var result = [];
    for (var state = 0; state < size; state += 1) result.push(state === index ? 1 : 0);
    return result;
  }

  function initialChoices(preset) {
    var size = preset.matrix.length;
    var choices = [];
    for (var index = 0; index < size; index += 1) {
      choices.push({ index: index, label: "δ" + index, vector: deltaVector(size, index) });
    }
    return choices;
  }

  function validateMatrix(matrix) {
    if (!Array.isArray(matrix) || matrix.length === 0) throw new RangeError("matrix must be non-empty");
    var size = matrix.length;
    matrix.forEach(function (row) {
      if (!Array.isArray(row) || row.length !== size) throw new RangeError("matrix must be square");
      row.forEach(function (value) {
        if (!finite(value) || value < -EPS) throw new RangeError("matrix entries must be finite and nonnegative");
      });
      if (!near(sum(row), 1, 1e-9)) throw new RangeError("matrix rows must sum to one");
    });
  }

  function reachability(matrix) {
    var size = matrix.length;
    var reachable = [];
    for (var start = 0; start < size; start += 1) {
      var seen = [];
      var queue = [start];
      for (var i = 0; i < size; i += 1) seen.push(false);
      seen[start] = true;
      while (queue.length) {
        var current = queue.shift();
        for (var next = 0; next < size; next += 1) {
          if (!seen[next] && matrix[current][next] > EPS) {
            seen[next] = true;
            queue.push(next);
          }
        }
      }
      reachable.push(seen);
    }
    return reachable;
  }

  function structureOf(matrix) {
    validateMatrix(matrix);
    var size = matrix.length;
    var reach = reachability(matrix);
    var assigned = [];
    var classes = [];
    for (var index = 0; index < size; index += 1) assigned.push(false);
    for (var state = 0; state < size; state += 1) {
      if (assigned[state]) continue;
      var classStates = [];
      for (var other = 0; other < size; other += 1) {
        if (reach[state][other] && reach[other][state]) {
          classStates.push(other);
          assigned[other] = true;
        }
      }
      classes.push(classStates);
    }

    var classInfo = classes.map(function (classStates) {
      var closed = true;
      classStates.forEach(function (from) {
        for (var to = 0; to < size; to += 1) {
          if (classStates.indexOf(to) === -1 && matrix[from][to] > EPS) closed = false;
        }
      });
      var period = 0;
      if (classStates.length > 0) {
        var power = identity(size);
        var limit = Math.max(12, 2 * size * size + 4);
        for (var time = 1; time <= limit; time += 1) {
          power = multiplyMatrices(power, matrix);
          if (power[classStates[0]][classStates[0]] > EPS) period = gcd(period, time);
        }
      }
      return { states: classStates, closed: closed, period: period };
    });

    var irreducible = classes.length === 1;
    var period = irreducible ? classInfo[0].period : 0;
    return {
      classes: classes,
      classInfo: classInfo,
      irreducible: irreducible,
      period: period,
      aperiodic: irreducible && period === 1
    };
  }

  function eigenvaluesOf(matrix) {
    var size = matrix.length;
    if (size === 2) {
      var trace2 = matrix[0][0] + matrix[1][1];
      return [1, trace2 - 1].sort(function (left, right) { return Math.abs(right) - Math.abs(left); });
    }
    if (size === 3) {
      var trace = matrix[0][0] + matrix[1][1] + matrix[2][2];
      var second =
        matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0] +
        matrix[0][0] * matrix[2][2] - matrix[0][2] * matrix[2][0] +
        matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1];
      var coefficientB = 1 - trace;
      var coefficientC = second + 1 - trace;
      var discriminant = coefficientB * coefficientB - 4 * coefficientC;
      if (discriminant >= -EPS) {
        var root = Math.sqrt(Math.max(0, discriminant));
        return [1, (-coefficientB + root) / 2, (-coefficientB - root) / 2].sort(function (left, right) {
          return Math.abs(right) - Math.abs(left);
        });
      }
      var real = -coefficientB / 2;
      var imaginary = Math.sqrt(-discriminant) / 2;
      return [1, { real: real, imaginary: imaginary }, { real: real, imaginary: -imaginary }];
    }
    throw new RangeError("spectrum supports 2x2 and 3x3 teaching models");
  }

  function eigenAbsolute(value) {
    return typeof value === "number" ? Math.abs(value) : Math.sqrt(value.real * value.real + value.imaginary * value.imaginary);
  }

  function spectralInfo(matrix) {
    var eigenvalues = eigenvaluesOf(matrix);
    var slem = 0;
    for (var index = 1; index < eigenvalues.length; index += 1) {
      slem = Math.max(slem, eigenAbsolute(eigenvalues[index]));
    }
    return { eigenvalues: eigenvalues, slem: slem };
  }

  function compute(spec) {
    var options = spec || {};
    var preset = presetById(options.presetId || DEFAULT.presetId);
    var matrix = cloneMatrix(preset.matrix);
    var choices = initialChoices(preset);
    var initialIndex = options.initialIndex === undefined ? DEFAULT.initialIndex : Math.round(Number(options.initialIndex));
    initialIndex = clamp(initialIndex, 0, choices.length - 1);
    var time = options.t === undefined ? DEFAULT.t : Math.round(Number(options.t));
    time = clamp(time, 0, 12);
    var initial = choices[initialIndex].vector;
    var power = matrixPower(matrix, time);
    var distribution = rowTimesMatrix(initial, power);
    var stationary = preset.stationary.slice();
    var structure = structureOf(matrix);
    var spectrum = spectralInfo(matrix);
    var tv = totalVariation(distribution, stationary);
    var tvAtZero = totalVariation(initial, stationary);
    var stationaryResidual = vectorResidual(rowTimesMatrix(stationary, matrix), stationary);
    var rowSums = power.map(sum);
    var spectralPower = Math.pow(spectrum.slem, time);
    var spectralBound = preset.id === "mixing" ? tvAtZero * spectralPower : null;
    return {
      preset: preset,
      matrix: matrix,
      time: time,
      initialIndex: initialIndex,
      initial: initial,
      power: power,
      distribution: distribution,
      stationary: stationary,
      tv: tv,
      tvAtZero: tvAtZero,
      spectralPower: spectralPower,
      spectralBound: spectralBound,
      spectralComparisonScope: preset.id === "mixing"
        ? "仅对当前二维混合 toy：TV=TV₀×SLEMᵗ"
        : "当前反例不提供通用 TV 上界或收敛证书",
      structure: structure,
      spectrum: spectrum,
      stationaryResidual: stationaryResidual,
      rowSums: rowSums,
      initialChoices: choices
    };
  }

  function format(value, digits) {
    if (value === Infinity) return "∞";
    if (value === -Infinity) return "-∞";
    if (!finite(value)) return "—";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) < 0.0005 && value !== 0) return value.toExponential(Math.min(places, 4));
    var text = value.toFixed(places);
    return text.indexOf(".") === -1 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function formatVector(values) {
    return "(" + values.map(function (value) { return format(value, 5); }).join(", ") + ")";
  }

  function formatEigen(value) {
    if (typeof value === "number") return format(value, 4);
    return format(value.real, 4) + (value.imaginary >= 0 ? "+" : "") + format(value.imaginary, 4) + "i";
  }

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

  function appendChildren(node, children) {
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
    });
    return node;
  }

  function element(doc, tag, attrs, children) {
    return appendChildren(setAttributes(doc.createElement(tag), attrs || {}), children || []);
  }

  function svgElement(doc, tag, attrs, children) {
    return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}), children || []);
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function metric(doc, label) {
    var value = element(doc, "strong", {}, ["—"]);
    return {
      node: element(doc, "div", { className: "mm-metric" }, [
        element(doc, "span", {}, [label]),
        value
      ]),
      value: value
    };
  }

  function table(doc, label, headers) {
    var header = element(doc, "tr", {}, headers.map(function (item) {
      return element(doc, "th", { scope: "col" }, [item]);
    }));
    return element(doc, "table", { "aria-label": label }, [
      element(doc, "thead", {}, [header]),
      element(doc, "tbody", {}, [])
    ]);
  }

  function replaceRows(target, rows) {
    var body = target.querySelector("tbody");
    clear(body);
    rows.forEach(function (row) {
      body.appendChild(element(target.ownerDocument, "tr", {}, row.map(function (value) {
        return element(target.ownerDocument, "td", {}, [value]);
      })));
    });
  }

  function drawSvg(doc, svg, data, uid) {
    clear(svg);
    svg.setAttribute("aria-labelledby", uid + "-svg-title " + uid + "-svg-desc");
    svg.appendChild(svgElement(doc, "title", { id: uid + "-svg-title" }, ["Markov 链的 TV 距离与当前分布"]));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-svg-desc" }, [
      "左图显示 TV 距离随时间的精确序列；右图比较当前分布与所选平稳分布。"
    ]));

    var left = 46;
    var right = 358;
    var top = 38;
    var bottom = 250;
    var series = [];
    for (var time = 0; time <= 12; time += 1) {
      series.push(compute({ presetId: data.preset.id, t: time, initialIndex: data.initialIndex }).tv);
    }
    var mapX = function (time) { return left + (right - left) * time / 12; };
    var mapY = function (value) { return bottom - (bottom - top) * clamp(value, 0, 1); };
    [0, 0.5, 1].forEach(function (value) {
      var y = mapY(value);
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: y, x2: right, y2: y, class: "mm-grid" }, []));
      svg.appendChild(svgElement(doc, "text", { x: left - 8, y: y + 4, "text-anchor": "end", "font-size": 11 }, [format(value, 1)]));
    });
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, class: "mm-axis" }, []));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: top, x2: left, y2: bottom, class: "mm-axis" }, []));
    svg.appendChild(svgElement(doc, "text", { x: left, y: 20, "font-size": 12, "font-weight": 700 }, ["TV(μ_t, π)"]));
    svg.appendChild(svgElement(doc, "text", { x: right, y: bottom + 26, "text-anchor": "end", "font-size": 11 }, ["t"]));
    var path = series.map(function (value, index) {
      return (index === 0 ? "M" : "L") + mapX(index) + " " + mapY(value);
    }).join(" ");
    svg.appendChild(svgElement(doc, "path", { d: path, class: "mm-curve" }, []));
    series.forEach(function (value, index) {
      svg.appendChild(svgElement(doc, "circle", {
        cx: mapX(index),
        cy: mapY(value),
        r: index === data.time ? 5 : 3,
        class: index === data.time ? "mm-current" : "mm-point"
      }, []));
    });
    svg.appendChild(svgElement(doc, "text", { x: mapX(data.time) + 7, y: mapY(series[data.time]) - 8, "font-size": 11 }, ["t=" + data.time]));

    var chartLeft = 432;
    var chartRight = 674;
    var chartTop = 54;
    var chartBottom = 250;
    var count = data.distribution.length;
    var groupWidth = (chartRight - chartLeft) / Math.max(1, count);
    var barWidth = Math.min(28, groupWidth * 0.28);
    var barY = function (value) { return chartBottom - (chartBottom - chartTop) * clamp(value, 0, 1); };
    svg.appendChild(svgElement(doc, "text", { x: chartLeft, y: 20, "font-size": 12, "font-weight": 700 }, ["当前分布 vs 平稳分布"]));
    svg.appendChild(svgElement(doc, "line", { x1: chartLeft, y1: chartBottom, x2: chartRight, y2: chartBottom, class: "mm-axis" }, []));
    [0, 0.5, 1].forEach(function (value) {
      var gridY = barY(value);
      svg.appendChild(svgElement(doc, "line", { x1: chartLeft, y1: gridY, x2: chartRight, y2: gridY, class: "mm-grid" }, []));
    });
    data.distribution.forEach(function (value, index) {
      var center = chartLeft + groupWidth * (index + 0.5);
      var muHeight = chartBottom - barY(value);
      var piHeight = chartBottom - barY(data.stationary[index]);
      svg.appendChild(svgElement(doc, "rect", { x: center - barWidth - 2, y: barY(value), width: barWidth, height: muHeight, class: "mm-bar-mu" }, []));
      svg.appendChild(svgElement(doc, "rect", { x: center + 2, y: barY(data.stationary[index]), width: barWidth, height: piHeight, class: "mm-bar-pi" }, []));
      svg.appendChild(svgElement(doc, "text", { x: center, y: chartBottom + 18, "text-anchor": "middle", "font-size": 11 }, ["状态 " + index]));
    });
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument || !root.appendChild) return;
    var doc = root.ownerDocument;
    installStyles(doc);
    INSTANCE += 1;
    var uid = "cl-mm-" + INSTANCE;
    var shell = element(doc, "div", { className: "mm-lab" }, []);
    var state = {
      presetId: DEFAULT.presetId,
      t: DEFAULT.t,
      initialIndex: DEFAULT.initialIndex
    };
    var prediction = { stationary: null, convergence: null, periodic: null, reducible: null };
    var revealed = false;
    var score = 0;
    var refs = {};
    root.replaceChildren(shell);

    function announce(message) {
      if (api && typeof api.announce === "function") api.announce(root, message);
    }

    function predictionComplete() {
      return Object.keys(prediction).every(function (key) { return prediction[key] !== null; });
    }

    function addQuestion(container, key, prompt, options) {
      var fieldset = element(doc, "fieldset", { className: "mm-question" }, [
        element(doc, "legend", {}, [prompt])
      ]);
      var row = element(doc, "div", { className: "mm-choice-grid", role: "group", "aria-label": prompt }, []);
      options.forEach(function (option) {
        var button = element(doc, "button", { type: "button", "aria-pressed": prediction[key] === option.value ? "true" : "false", disabled: revealed }, [option.label]);
        button.addEventListener("click", function () {
          if (revealed) return;
          prediction[key] = option.value;
          renderShell();
        });
        row.appendChild(button);
      });
      fieldset.appendChild(row);
      container.appendChild(fieldset);
    }

    function buildPrediction() {
      shell.appendChild(element(doc, "h3", {}, ["Markov 混合台：平稳、周期与可约要分开"]));
      shell.appendChild(element(doc, "p", { className: "mm-note" }, [
        revealed
          ? "预测已提交；现在可以切换链、初始状态和时间，逐项核对 Pᵗ、TV 距离与谱信息。"
          : "先判断结构条件，再看数字。提交前隐藏矩阵幂、图表、预设和数值账本。"
      ]));
      shell.appendChild(element(doc, "div", { className: "mm-prompt" }, [
        revealed ? "账本已打开：平稳性是方程 πP=π，混合还需要不可约与非周期。" : "预测门：不要把“有平稳分布”直接读成“从任意初态收敛”。"
      ]));
      var questions = element(doc, "div", { className: "mm-question-list" }, []);
      addQuestion(questions, "stationary", "1 · πP=π 直接证成哪一件事？", [
        { value: "stationary", label: "π 是平稳分布" },
        { value: "irreducible", label: "链不可约" },
        { value: "aperiodic", label: "链非周期" }
      ]);
      addQuestion(questions, "convergence", "2 · 有限链不可约且非周期时，正确的长期结论是？", [
        { value: "all", label: "任意初态趋向唯一 π" },
        { value: "none", label: "没有平稳分布" },
        { value: "oscillate", label: "必然周期振荡" }
      ]);
      addQuestion(questions, "periodic", "3 · 不可约周期链可以怎样反例？", [
        { value: "stationary-no-mix", label: "有 π，但 TV 可不趋 0" },
        { value: "no-stationary", label: "没有 π" },
        { value: "reducible", label: "它因此可约" }
      ]);
      addQuestion(questions, "reducible", "4 · 可约链最需要保留哪条警告？", [
        { value: "many", label: "可能多平稳、依赖闭类" },
        { value: "unique", label: "总有唯一 π" },
        { value: "same", label: "所有初态必同极限" }
      ]);
      shell.appendChild(questions);
      var actions = element(doc, "div", { className: "mm-actions" }, []);
      var check = element(doc, "button", { type: "button", className: "mm-primary", disabled: revealed || !predictionComplete() }, [revealed ? "已提交，账本已揭示" : "提交预测并揭示"]);
      check.addEventListener("click", function () {
        if (!predictionComplete()) return;
        score = ["stationary", "convergence", "periodic", "reducible"].reduce(function (total, key) {
          var answers = { stationary: "stationary", convergence: "all", periodic: "stationary-no-mix", reducible: "many" };
          return total + (prediction[key] === answers[key] ? 1 : 0);
        }, 0);
        revealed = true;
        renderShell();
        announce("预测已提交，P 的结构、矩阵幂、TV 距离与谱账本已揭示。");
      });
      var reset = element(doc, "button", { type: "button" }, [revealed ? "重新预测" : "重置"]);
      reset.addEventListener("click", resetToGate);
      actions.appendChild(check);
      actions.appendChild(reset);
      shell.appendChild(actions);
      var feedbackText = !predictionComplete()
        ? "请为四个判断各选一项。"
        : revealed
          ? "预测已提交，" + score + "/4 命中。"
          : "四项预测已记录，点击提交后才会显示结果。";
      shell.appendChild(element(doc, "p", { className: "mm-feedback " + (revealed ? (score === 4 ? "mm-pass" : "mm-warn") : ""), "aria-live": "polite" }, [feedbackText]));
    }

    function addRange(container, key, label, minimum, maximum, step, formatter) {
      var id = uid + "-" + key;
      var output = element(doc, "output", { for: id }, [""]);
      var input = element(doc, "input", {
        id: id,
        type: "range",
        min: String(minimum),
        max: String(maximum),
        step: String(step),
        value: String(state[key]),
        "aria-label": label
      }, []);
      input.addEventListener("input", function () {
        state[key] = clamp(Number(input.value), minimum, maximum);
        renderResults();
      });
      container.appendChild(element(doc, "div", { className: "mm-control" }, [
        element(doc, "label", { htmlFor: id }, [label + " = ", output]),
        input,
        element(doc, "div", { className: "mm-scale" }, [
          element(doc, "span", {}, [formatter(minimum)]),
          element(doc, "span", {}, [formatter((minimum + maximum) / 2)]),
          element(doc, "span", {}, [formatter(maximum)])
        ])
      ]));
      return { input: input, output: output };
    }

    function buildControls() {
      var controls = element(doc, "section", { className: "mm-controls", "aria-labelledby": uid + "-controls" }, [
        element(doc, "h4", { id: uid + "-controls" }, ["揭示后的参数"])
      ]);
      refs.time = addRange(controls, "t", "步数 t", 0, 12, 1, function (value) { return String(Math.round(value)); });
      var presetSet = element(doc, "fieldset", {}, [element(doc, "legend", {}, ["链的结构预设"]) ]);
      var presetGrid = element(doc, "div", { className: "mm-preset-grid" }, []);
      PRESETS.forEach(function (preset) {
        var button = element(doc, "button", { type: "button", "aria-pressed": preset.id === state.presetId ? "true" : "false" }, [preset.label]);
        button.addEventListener("click", function () {
          state.presetId = preset.id;
          state.initialIndex = 0;
          renderResults();
          announce("已切换到" + preset.label + "。");
        });
        presetGrid.appendChild(button);
      });
      presetSet.appendChild(presetGrid);
      controls.appendChild(presetSet);
      var currentPreset = presetById(state.presetId);
      var startSet = element(doc, "fieldset", {}, [element(doc, "legend", {}, ["初始状态"]) ]);
      var startGrid = element(doc, "div", { className: "mm-option-grid" }, []);
      initialChoices(currentPreset).forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": choice.index === state.initialIndex ? "true" : "false" }, [choice.label]);
        button.addEventListener("click", function () {
          state.initialIndex = choice.index;
          renderResults();
        });
        startGrid.appendChild(button);
      });
      startSet.appendChild(startGrid);
      controls.appendChild(startSet);
      controls.appendChild(element(doc, "p", { className: "mm-note" }, [
        "当前表中的 π 是一个明确选定的平稳分布；可约预设会额外显示平稳分布不唯一的证书。"
      ]));
      var reset = element(doc, "button", { type: "button" }, ["重新预测"]);
      reset.addEventListener("click", resetToGate);
      controls.appendChild(reset);
      return controls;
    }

    function buildStage() {
      var stage = element(doc, "section", { className: "mm-stage", "aria-labelledby": uid + "-stage" }, []);
      refs.svg = svgElement(doc, "svg", {
        class: "mm-svg",
        width: "700",
        height: "300",
        viewBox: "0 0 700 300",
        role: "img",
        "aria-labelledby": uid + "-svg-title"
      }, []);
      stage.appendChild(element(doc, "div", { className: "mm-stage-frame" }, [
        element(doc, "div", { className: "mm-stage-title" }, [
          element(doc, "span", { id: uid + "-stage" }, ["Pᵗ、TV 距离与当前分布"]),
          element(doc, "span", {}, ["蓝：μ_t；金：π；红点：当前 t"])
        ]),
        refs.svg,
        element(doc, "div", { className: "mm-legend" }, [
          element(doc, "span", {}, [element(doc, "i", { className: "mm-swatch mm-swatch-blue" }, []), "TV 序列 / μ_t"]),
          element(doc, "span", {}, [element(doc, "i", { className: "mm-swatch mm-swatch-gold" }, []), "平稳 π"]),
          element(doc, "span", {}, [element(doc, "i", { className: "mm-swatch mm-swatch-red" }, []), "当前 t"])
        ])
      ]));
      refs.metrics = [metric(doc, "当前 t"), metric(doc, "TV(μ_t,π)"), metric(doc, "|λ*|^t"), metric(doc, "二维 toy 参照"), metric(doc, "πP−π 残差"), metric(doc, "Pᵗ 行和最大误差")];
      stage.appendChild(element(doc, "div", { className: "mm-metrics" }, refs.metrics.map(function (item) { return item.node; })));
      stage.appendChild(element(doc, "h4", {}, ["矩阵幂与分布账本"]));
      refs.matrixTable = table(doc, "P 的 t 次幂", ["Pᵗ 的行", "数值", "行和"]);
      stage.appendChild(element(doc, "div", { className: "mm-table-wrap" }, [refs.matrixTable]));
      refs.distributionTable = table(doc, "分布和总变差距离", ["状态", "μ₀", "μ_t", "π", "|μ_t−π|"]);
      stage.appendChild(element(doc, "div", { className: "mm-table-wrap" }, [refs.distributionTable]));
      refs.spectrumTable = table(doc, "Markov 结构与谱账本", ["账本项", "当前值", "读法"]);
      stage.appendChild(element(doc, "div", { className: "mm-table-wrap" }, [refs.spectrumTable]));
      refs.interpretation = element(doc, "p", { className: "mm-interpretation", "aria-live": "polite" }, [""]);
      stage.appendChild(refs.interpretation);
      return stage;
    }

    function renderResults() {
      if (!revealed) return;
      var data = compute(state);
      refs.time.input.value = String(data.time);
      refs.time.output.textContent = format(data.time, 0);
      refs.metrics[0].value.textContent = String(data.time);
      refs.metrics[1].value.textContent = format(data.tv, 6);
      refs.metrics[2].value.textContent = format(data.spectralPower, 6);
      refs.metrics[3].value.textContent = format(data.spectralBound, 6);
      refs.metrics[4].value.textContent = format(data.stationaryResidual, 3);
      refs.metrics[5].value.textContent = format(Math.max.apply(null, data.rowSums.map(function (value) { return Math.abs(value - 1); })), 3);
      drawSvg(doc, refs.svg, data, uid);
      replaceRows(refs.matrixTable, data.power.map(function (row, index) {
        return ["row " + index, formatVector(row), format(sum(row), 8)];
      }));
      replaceRows(refs.distributionTable, data.distribution.map(function (value, index) {
        return [String(index), format(data.initial[index], 5), format(value, 5), format(data.stationary[index], 5), format(Math.abs(value - data.stationary[index]), 5)];
      }));
      var eigenText = data.spectrum.eigenvalues.map(formatEigen).join(", ");
      var classText = data.structure.classes.map(function (values) { return "{" + values.join(",") + "}"; }).join("、");
      var closedText = data.structure.classInfo.filter(function (item) { return item.closed; }).map(function (item) { return "{" + item.states.join(",") + "}"; }).join("、") || "无";
      replaceRows(refs.spectrumTable, [
        ["互通类", classText, data.preset.structureLabel],
        ["不可约 / 非周期", (data.structure.irreducible ? "是" : "否") + " / " + (data.structure.aperiodic ? "是" : "否"), "有限链从任意初态趋 π 需要两者"],
        ["闭类与周期", closedText + "；" + (data.structure.period || "分类") , data.preset.periodLabel],
        ["平稳证书", formatVector(data.stationary), "πP=π 残差=" + format(data.stationaryResidual, 3)],
        ["特征值", eigenText, "当前小 toy 用 λ^t 对账；一般非正规/Jordan 情形还需额外分析；SLEM=" + format(data.spectrum.slem, 5)],
        ["TV 对账", data.spectralBound === null ? "不宣称通用谱上界" : "TV=" + format(data.tv, 8) + "；参照=" + format(data.spectralBound, 8), data.spectralComparisonScope],
        ["可约边界", data.preset.id === "reducible" ? "π_a=(a,1-a,0)" : "—", data.preset.id === "reducible" ? "平稳分布不唯一；初态选择闭类" : "当前链唯一平稳"]
      ]);
      var longTerm;
      if (data.preset.id === "mixing") longTerm = "不可约且非周期：在当前二维 toy、当前初态下，TV 按 0.4×0.5ᵗ 精确衰减；这不是任意非可逆有限链的通用 TV 上界。";
      else if (data.preset.id === "periodic") longTerm = "周期反例：λ=-1 的模不衰减，Pᵗ 交替，TV 保持 0.5。";
      else longTerm = "可约反例：SLEM=1 且存在多个闭类；改变初始状态会改变长期落入的平稳组合。";
      refs.interpretation.textContent = "当前为“" + data.preset.label + "”，初态 " + formatVector(data.initial) + "，t=" + data.time + "。" + longTerm + " 这里同时检查 Pᵗ 行和、πP=π、TV 距离和非平凡特征值；周期与可约反例不被当作收敛证书。";
    }

    function buildRevealed() {
      var panel = element(doc, "section", { className: "mm-revealed" }, [
        element(doc, "h4", {}, ["结果与透明账本"]),
        element(doc, "p", { className: "mm-note" }, ["切换链和初始状态后，Pᵗ、μ_t、TV、平稳残差与谱栏会一起重算；可约预设的 π 只是平稳族中的一个代表。"])
      ]);
      panel.appendChild(element(doc, "div", { className: "mm-layout" }, [buildControls(), buildStage()]));
      shell.appendChild(panel);
      renderResults();
    }

    function renderShell() {
      refs = {};
      shell.replaceChildren();
      buildPrediction();
      if (revealed) buildRevealed();
    }

    function resetToGate() {
      state = { presetId: DEFAULT.presetId, t: DEFAULT.t, initialIndex: DEFAULT.initialIndex };
      prediction = { stationary: null, convergence: null, periodic: null, reducible: null };
      revealed = false;
      score = 0;
      renderShell();
      announce("已重置；请重新完成 Markov 结构预测。");
    }

    renderShell();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }

    PRESETS.forEach(function (preset) {
      validateMatrix(preset.matrix);
      var info = structureOf(preset.matrix);
      var spectral = spectralInfo(preset.matrix);
      assert(info.classes.length >= 1, preset.id + " has classes");
      assert(spectral.eigenvalues.length === preset.matrix.length, preset.id + " spectrum length");
      assert(preset.matrix.every(function (row) { return near(sum(row), 1, 1e-12); }), preset.id + " stochastic rows");
      assert(vectorResidual(rowTimesMatrix(preset.stationary, preset.matrix), preset.stationary) < 1e-12, preset.id + " stationary residual");
    });

    var mixing = compute({ presetId: "mixing", t: 4, initialIndex: 0 });
    assert(mixing.structure.irreducible, "mixing irreducible");
    assert(mixing.structure.aperiodic, "mixing aperiodic");
    assert(near(mixing.power[0][0], 0.625, 1e-12), "mixing P^4 entry");
    assert(near(mixing.distribution[0], 0.625, 1e-12), "mixing mu_t");
    assert(near(mixing.tv, 0.4 * Math.pow(0.5, 4), 1e-12), "mixing exact TV decay");
    assert(near(mixing.spectrum.slem, 0.5, 1e-12), "mixing SLEM");
    assert(near(mixing.tv, mixing.spectralBound, 1e-12), "mixing spectral ledger");

    var periodic = compute({ presetId: "periodic", t: 1, initialIndex: 0 });
    assert(periodic.structure.irreducible, "periodic irreducible");
    assert(!periodic.structure.aperiodic && periodic.structure.period === 2, "periodic period two");
    assert(near(periodic.distribution[0], 0, 1e-12) && near(periodic.distribution[1], 1, 1e-12), "periodic P^1");
    assert(near(periodic.tv, 0.5, 1e-12), "periodic TV does not decay");
    assert(near(periodic.spectrum.slem, 1, 1e-12), "periodic SLEM one");
    assert(periodic.spectralBound === null, "periodic has no TV convergence certificate");
    var periodicEven = compute({ presetId: "periodic", t: 2, initialIndex: 0 });
    assert(near(periodicEven.distribution[0], 1, 1e-12), "periodic P^2 returns");

    var reducible = compute({ presetId: "reducible", t: 1, initialIndex: 2 });
    assert(!reducible.structure.irreducible, "reducible class certificate");
    assert(reducible.structure.classes.length === 3, "reducible communicating classes");
    assert(near(reducible.distribution[0], 0.5, 1e-12) && near(reducible.distribution[1], 0.5, 1e-12), "reducible transient split");
    assert(near(reducible.stationaryResidual, 0, 1e-12), "reducible selected stationary residual");
    assert(near(reducible.spectrum.slem, 1, 1e-12), "reducible SLEM one");
    assert(reducible.spectralBound === null, "reducible has no TV convergence certificate");
    var absorbingZero = compute({ presetId: "reducible", t: 6, initialIndex: 0 });
    var absorbingOne = compute({ presetId: "reducible", t: 6, initialIndex: 1 });
    assert(near(absorbingZero.distribution[0], 1, 1e-12), "absorbing class zero");
    assert(near(absorbingOne.distribution[1], 1, 1e-12), "absorbing class one");

    var identityPower = matrixPower([[0.8, 0.2], [0.3, 0.7]], 0);
    assert(near(identityPower[0][0], 1, 1e-12) && near(identityPower[1][1], 1, 1e-12), "P^0 identity");
    assert(near(sum(identityPower[0]), 1, 1e-12) && near(sum(identityPower[1]), 1, 1e-12), "P^0 rows");
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    DEFAULT: DEFAULT,
    PRESETS: PRESETS,
    matrixPower: matrixPower,
    totalVariation: totalVariation,
    structureOf: structureOf,
    spectralInfo: spectralInfo,
    compute: compute,
    mount: mount,
    selfTest: selfTest
  };
});

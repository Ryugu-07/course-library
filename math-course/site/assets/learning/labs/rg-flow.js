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
  var STYLE_ATTR = "data-cl-rg-flow-style";
  var INSTANCE_COUNT = 0;

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return finite(parsed) ? parsed : fallback;
  }

  function format(api, value, digits) {
    if (!finite(value)) return "—";
    if (api && typeof api.format === "function") {
      return api.format(value, digits);
    }
    var places = digits === undefined ? 3 : digits;
    if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) {
      return value.toExponential(Math.min(places, 4));
    }
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function formatSigned(api, value, digits) {
    if (!finite(value)) return "—";
    var text = format(api, value, digits);
    return value > 0 ? "+" + text : text;
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

  function appendChildren(node, children, doc) {
    if (children === undefined || children === null) return node;
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function makeElement(api, doc, tag, attrs, children) {
    if (api && typeof api.el === "function") {
      return api.el(tag, attrs || {}, children);
    }
    return appendChildren(setAttributes(doc.createElement(tag), attrs || {}), children, doc);
  }

  function makeSvg(api, doc, tag, attrs, children) {
    if (api && typeof api.svg === "function") {
      return api.svg(tag, attrs || {}, children);
    }
    return appendChildren(
      setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}),
      children,
      doc
    );
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function append(parent, child) {
    parent.appendChild(child);
    return child;
  }

  function svgText(api, doc, x, y, text, attrs) {
    var values = {
      x: x,
      y: y,
      "font-size": 12,
      fill: "var(--fg-soft)",
      "aria-hidden": "true"
    };
    Object.keys(attrs || {}).forEach(function (key) {
      values[key] = attrs[key];
    });
    return makeSvg(api, doc, "text", values, [text]);
  }

  function atanh(value) {
    return 0.5 * Math.log((1 + value) / (1 - value));
  }

  function nextK(k) {
    var tanhK = Math.tanh(k);
    return atanh(tanhK * tanhK);
  }

  function correlationLength(k) {
    if (k <= 0) return 0;
    var tanhK = Math.tanh(k);
    if (tanhK >= 1) return Infinity;
    return -1 / Math.log(tanhK);
  }

  function computeA(k0, steps) {
    var rows = [];
    var k = clamp(number(k0, 1), 0.05, 3);
    var count = clamp(Math.round(number(steps, 4)), 0, 8);
    var n;
    for (n = 0; n <= count; n += 1) {
      var xi = correlationLength(k);
      rows.push({
        n: n,
        k: k,
        temperature: 1 / k,
        xi: xi,
        physicalXi: Math.pow(2, n) * xi
      });
      k = nextK(k);
    }
    return rows;
  }

  function computeB(config) {
    var rows = [];
    var b = clamp(number(config.b, 2), 1.2, 4);
    var yt = clamp(number(config.yt, 1), 0.2, 2);
    var yi = clamp(number(config.yi, -1), -2, -0.1);
    var u = clamp(number(config.u, 0.25), -1, 1);
    var v = clamp(number(config.v, 0.8), -1, 1);
    var count = clamp(Math.round(number(config.steps, 4)), 0, 8);
    var uFactor = Math.pow(b, yt);
    var vFactor = Math.pow(b, yi);
    var n;
    for (n = 0; n <= count; n += 1) {
      rows.push({ n: n, u: u, v: v });
      u *= uFactor;
      v *= vFactor;
    }
    return {
      rows: rows,
      b: b,
      yt: yt,
      yi: yi,
      uFactor: uFactor,
      vFactor: vFactor,
      nu: 1 / yt
    };
  }

  function installStyles(doc) {
    if (doc.querySelector("style[" + STYLE_ATTR + "]")) return;
    var style = doc.createElement("style");
    style.setAttribute(STYLE_ATTR, "");
    style.textContent = [
      ".cl-rg-flow{--cl-rg-flow:var(--accent,#6e56a4);--cl-rg-relevant:var(--cl-red,#b85448);--cl-rg-irrelevant:var(--cl-blue,#3d789c);--cl-rg-critical:var(--fg-soft,#6d7178);margin:1.4rem 0 2rem;color:var(--fg,#202124);min-width:0}",
      ".cl-rg-flow *{box-sizing:border-box}",
      ".cl-rg-flow .cl-rg-shell{overflow:hidden;border:1px solid var(--border,#c9cdd3);border-radius:8px;background:var(--bg,#fff)}",
      ".cl-rg-flow .cl-rg-header{padding:1rem 1.1rem .9rem;border-bottom:1px solid var(--border,#c9cdd3);background:var(--block-bg,var(--bg,#fff))}",
      ".cl-rg-flow .cl-rg-kicker{margin:0 0 .25rem;color:var(--accent,#6e56a4);font-size:.75rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase}",
      ".cl-rg-flow .cl-rg-header h3{margin:0;color:var(--fg,#202124);font-size:1.15rem}",
      ".cl-rg-flow .cl-rg-header p:last-child{margin:.4rem 0 0;color:var(--fg-soft,#5d626a);line-height:1.55}",
      ".cl-rg-flow .cl-rg-tabs{display:flex;gap:.35rem;padding:.65rem 1.1rem 0;border-bottom:1px solid var(--border,#c9cdd3);background:var(--block-bg,var(--bg,#fff))}",
      ".cl-rg-flow .cl-rg-tab{min-height:48px;padding:.55rem .8rem;border:1px solid transparent;border-bottom:0;border-radius:6px 6px 0 0;background:transparent;color:var(--fg-soft,#5d626a);cursor:pointer;font:inherit;font-size:.86rem;font-weight:750}",
      ".cl-rg-flow .cl-rg-tab[aria-selected=\"true\"]{border-color:var(--border,#c9cdd3);background:var(--bg,#fff);color:var(--fg,#202124)}",
      ".cl-rg-flow .cl-rg-tab:hover{color:var(--fg,#202124)}",
      ".cl-rg-flow button:focus-visible,.cl-rg-flow input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
      ".cl-rg-flow .cl-rg-panel{padding:1rem 1.1rem 1.1rem;min-width:0}",
      ".cl-rg-flow .cl-rg-panel[hidden]{display:none}",
      ".cl-rg-flow .cl-rg-panel-intro{margin:0 0 .85rem;color:var(--fg-soft,#5d626a);font-size:.86rem;line-height:1.55}",
      ".cl-rg-flow .cl-rg-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem;margin-bottom:.85rem}",
      ".cl-rg-flow .cl-rg-fieldset{min-width:0;margin:0;padding:.7rem .75rem .75rem;border:1px solid var(--border,#c9cdd3);border-radius:6px;background:var(--block-bg,var(--bg,#fff))}",
      ".cl-rg-flow .cl-rg-fieldset legend{padding:0 .25rem;color:var(--fg-soft,#5d626a);font-size:.78rem;font-weight:750}",
      ".cl-rg-flow .cl-rg-control{display:grid;gap:.2rem;min-width:0;margin-top:.45rem}",
      ".cl-rg-flow .cl-rg-control:first-child{margin-top:0}",
      ".cl-rg-flow .cl-rg-control-head{display:flex;align-items:baseline;justify-content:space-between;gap:.75rem;color:var(--fg-soft,#5d626a);font-size:.82rem}",
      ".cl-rg-flow .cl-rg-control-head output{color:var(--accent,#6e56a4);font-weight:750;font-variant-numeric:tabular-nums;text-align:right}",
      ".cl-rg-flow input[type=\"range\"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent,#6e56a4)}",
      ".cl-rg-flow .cl-rg-scale{display:flex;justify-content:space-between;color:var(--fg-soft,#5d626a);font-size:.7rem;font-variant-numeric:tabular-nums}",
      ".cl-rg-flow .cl-rg-presets{display:flex;flex-wrap:wrap;gap:.5rem;margin:-.15rem 0 .85rem}",
      ".cl-rg-flow button.cl-rg-preset{min-height:44px;padding:.5rem .75rem;border:1px solid var(--border,#c9cdd3);border-radius:6px;background:var(--bg,#fff);color:var(--fg,#202124);cursor:pointer;font:inherit;font-size:.8rem;font-weight:700}",
      ".cl-rg-flow button.cl-rg-preset:hover{border-color:var(--accent,#6e56a4)}",
      ".cl-rg-flow .cl-rg-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.55rem;margin-bottom:.85rem}",
      ".cl-rg-flow .cl-rg-metric{min-width:0;padding:.58rem .62rem;border-top:2px solid var(--border,#c9cdd3);background:var(--block-bg,var(--bg,#fff))}",
      ".cl-rg-flow .cl-rg-metric[data-kind=\"relevant\"]{border-top-color:var(--cl-rg-relevant)}",
      ".cl-rg-flow .cl-rg-metric[data-kind=\"irrelevant\"]{border-top-color:var(--cl-rg-irrelevant)}",
      ".cl-rg-flow .cl-rg-metric[data-kind=\"flow\"]{border-top-color:var(--cl-rg-flow)}",
      ".cl-rg-flow .cl-rg-metric span{display:block;color:var(--fg-soft,#5d626a);font-size:.71rem;line-height:1.4}",
      ".cl-rg-flow .cl-rg-metric strong{display:block;margin-top:.18rem;overflow-wrap:anywhere;color:var(--fg,#202124);font-size:.94rem;font-variant-numeric:tabular-nums}",
      ".cl-rg-flow .cl-rg-status{margin:0 0 .85rem;padding:.65rem .75rem;border-left:3px solid var(--accent,#6e56a4);background:var(--block-bg,var(--bg,#fff));color:var(--fg,#202124);font-size:.84rem;line-height:1.55}",
      ".cl-rg-flow .cl-rg-chart-card,.cl-rg-flow .cl-rg-table-card{min-width:0;margin-top:.75rem;padding:.75rem;border:1px solid var(--border,#c9cdd3);border-radius:6px;background:var(--block-bg,var(--bg,#fff))}",
      ".cl-rg-flow .cl-rg-card-title{margin:0 0 .5rem;color:var(--fg-soft,#5d626a);font-size:.82rem;font-weight:750}",
      ".cl-rg-flow .cl-rg-chart-wrap{max-width:100%;overflow:hidden;border:1px solid var(--border,#c9cdd3);border-radius:5px;background:var(--bg,#fff)}",
      ".cl-rg-flow .cl-rg-svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,#202124)}",
      ".cl-rg-flow .cl-rg-svg text{font-family:inherit;letter-spacing:0}",
      ".cl-rg-flow .cl-rg-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}",
      ".cl-rg-flow table{width:100%;border-collapse:collapse;font-size:.78rem;font-variant-numeric:tabular-nums}",
      ".cl-rg-flow th,.cl-rg-flow td{padding:.48rem .55rem;border-bottom:1px solid var(--border,#c9cdd3);text-align:right;white-space:nowrap}",
      ".cl-rg-flow th:first-child,.cl-rg-flow td:first-child{text-align:left}",
      ".cl-rg-flow th{color:var(--fg-soft,#5d626a);font-weight:750}",
      ".cl-rg-flow td{color:var(--fg,#202124)}",
      ".cl-rg-flow .cl-rg-note{margin:.65rem 0 0;color:var(--fg-soft,#5d626a);font-size:.75rem;line-height:1.55}",
      ".cl-rg-flow .cl-rg-legend{display:flex;flex-wrap:wrap;gap:.55rem 1rem;margin:.6rem 0 0;color:var(--fg-soft,#5d626a);font-size:.75rem}",
      ".cl-rg-flow .cl-rg-key{display:inline-flex;align-items:center;gap:.35rem}",
      ".cl-rg-flow .cl-rg-swatch{display:inline-block;width:.85rem;height:.2rem;border-radius:99px;background:var(--cl-rg-flow)}",
      ".cl-rg-flow .cl-rg-swatch[data-kind=\"relevant\"]{background:var(--cl-rg-relevant)}",
      ".cl-rg-flow .cl-rg-swatch[data-kind=\"irrelevant\"]{background:var(--cl-rg-irrelevant)}",
      ".cl-rg-flow .cl-rg-swatch[data-kind=\"critical\"]{height:0;border-top:2px dashed var(--cl-rg-critical);border-radius:0;background:transparent}",
      "@media (max-width:680px){.cl-rg-flow .cl-rg-controls{grid-template-columns:1fr}.cl-rg-flow .cl-rg-panel{padding:.8rem}.cl-rg-flow .cl-rg-header{padding:.85rem}.cl-rg-flow .cl-rg-tabs{padding-left:.8rem;padding-right:.8rem}.cl-rg-flow .cl-rg-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}",
      "@media (max-width:390px){.cl-rg-flow .cl-rg-tab{padding-left:.55rem;padding-right:.55rem;font-size:.78rem}.cl-rg-flow .cl-rg-panel{padding:.7rem}.cl-rg-flow .cl-rg-header{padding:.75rem}.cl-rg-flow .cl-rg-metric strong{font-size:.86rem}.cl-rg-flow th,.cl-rg-flow td{padding-left:.42rem;padding-right:.42rem}}"
    ].join("\n");
    (doc.head || doc.documentElement || doc.body).appendChild(style);
  }

  function makeRangeField(api, doc, config) {
    var output = makeElement(api, doc, "output", { for: config.id, text: "" });
    var title = makeElement(api, doc, "span", { text: config.label });
    var head = makeElement(api, doc, "span", { className: "cl-rg-control-head" }, [
      title,
      output
    ]);
    var input = makeElement(api, doc, "input", {
      id: config.id,
      type: "range",
      min: config.min,
      max: config.max,
      step: config.step,
      value: config.value,
      "aria-label": config.label
    });
    var scale = makeElement(api, doc, "span", { className: "cl-rg-scale" }, [
      makeElement(api, doc, "span", { text: String(config.minLabel || config.min) }),
      makeElement(api, doc, "span", { text: String(config.maxLabel || config.max) })
    ]);
    var control = makeElement(api, doc, "label", { className: "cl-rg-control", htmlFor: config.id }, [
      head,
      input,
      scale
    ]);
    return { control: control, input: input, output: output };
  }

  function makeFieldset(api, doc, legend, fields) {
    var children = [makeElement(api, doc, "legend", { text: legend })];
    fields.forEach(function (field) { children.push(field.control); });
    return makeElement(api, doc, "fieldset", { className: "cl-rg-fieldset" }, children);
  }

  function makeMetric(api, doc, label, kind) {
    var value = makeElement(api, doc, "strong", { text: "—" });
    var card = makeElement(api, doc, "div", { className: "cl-rg-metric", "data-kind": kind }, [
      makeElement(api, doc, "span", { text: label }),
      value
    ]);
    return { card: card, value: value };
  }

  function makeTable(api, doc, headers, rows, rowRenderer, ariaLabel) {
    var headRow = makeElement(api, doc, "tr", {}, headers.map(function (header) {
      return makeElement(api, doc, "th", { scope: "col", text: header });
    }));
    var bodyRows = rows.map(function (row) {
      return makeElement(api, doc, "tr", {}, rowRenderer(row).map(function (cell, index) {
        return makeElement(api, doc, "td", {
          text: cell,
          "data-column": String(index)
        });
      }));
    });
    var table = makeElement(api, doc, "table", { "aria-label": ariaLabel }, [
      makeElement(api, doc, "thead", {}, [headRow]),
      makeElement(api, doc, "tbody", {}, bodyRows)
    ]);
    return makeElement(api, doc, "div", { className: "cl-rg-table-wrap" }, [table]);
  }

  function pathFromPoints(points, xScale, yScale, xKey, yKey) {
    return points.map(function (point, index) {
      var command = index === 0 ? "M" : "L";
      return command + xScale(point[xKey]).toFixed(2) + "," + yScale(point[yKey]).toFixed(2);
    }).join(" ");
  }

  function drawAChart(api, doc, rows, chartId) {
    var width = 760;
    var height = 370;
    var left = 62;
    var right = 22;
    var top = 28;
    var bottom = 42;
    var gap = 32;
    var plotWidth = width - left - right;
    var plotHeight = (height - top - bottom - gap) / 2;
    var firstTop = top;
    var secondTop = top + plotHeight + gap;
    var maxK = Math.max(0.001, rows.reduce(function (max, row) { return Math.max(max, row.k); }, 0));
    var maxXi = Math.max(0.001, rows.reduce(function (max, row) { return Math.max(max, row.xi); }, 0));
    var maxStep = Math.max(1, rows.length - 1);
    var titleId = chartId + "-title";
    var descId = chartId + "-desc";
    var svg = makeSvg(api, doc, "svg", {
      className: "cl-rg-svg",
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      "aria-labelledby": titleId + " " + descId,
      preserveAspectRatio: "xMidYMid meet"
    });
    append(svg, makeSvg(api, doc, "title", { id: titleId }, ["一维 Ising decimation 的 K 与关联长度流"]));
    append(svg, makeSvg(api, doc, "desc", { id: descId }, [
      "横轴为粗粒化步数；上图显示 K_n 向零流动，下图显示当前粗粒格单位的 connected correlation length。"
    ]));
    append(svg, makeSvg(api, doc, "rect", {
      x: 0,
      y: 0,
      width: width,
      height: height,
      fill: "var(--bg)",
      stroke: "var(--border)"
    }));

    function xScale(value) {
      return left + (value / maxStep) * plotWidth;
    }

    function drawPanel(panelTop, maximum, key, label, color) {
      var panelBottom = panelTop + plotHeight;
      function yScale(value) {
        return panelBottom - (value / maximum) * (plotHeight - 18);
      }
      append(svg, makeSvg(api, doc, "rect", {
        x: left,
        y: panelTop,
        width: plotWidth,
        height: plotHeight,
        fill: "var(--block-bg)",
        stroke: "var(--border)"
      }));
      [0, 0.5, 1].forEach(function (ratio) {
        var y = yScale(maximum * ratio);
        append(svg, makeSvg(api, doc, "line", {
          x1: left,
          y1: y,
          x2: width - right,
          y2: y,
          stroke: "var(--border)",
          "stroke-dasharray": "3 5",
          "stroke-opacity": "0.8"
        }));
        append(svg, svgText(api, doc, left - 8, y + 4, format(api, maximum * ratio, 2), {
          "text-anchor": "end",
          "font-size": 10
        }));
      });
      append(svg, svgText(api, doc, left + 8, panelTop + 16, label, {
        fill: color,
        "font-size": 12,
        "font-weight": 750
      }));
      append(svg, makeSvg(api, doc, "path", {
        d: pathFromPoints(rows, xScale, yScale, "n", key),
        fill: "none",
        stroke: color,
        "stroke-width": 3,
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }));
      rows.forEach(function (row) {
        append(svg, makeSvg(api, doc, "circle", {
          cx: xScale(row.n),
          cy: yScale(row[key]),
          r: 3.6,
          fill: color,
          stroke: "var(--bg)",
          "stroke-width": 1.5
        }));
      });
    }

    drawPanel(firstTop, maxK, "k", "耦合 K_n（流向 K=0）", "var(--cl-rg-flow)");
    drawPanel(secondTop, maxXi, "xi", "connected 关联长度 ξ_c/a_n", "var(--cl-rg-irrelevant)");
    rows.forEach(function (row) {
      var x = xScale(row.n);
      append(svg, makeSvg(api, doc, "line", {
        x1: x,
        y1: secondTop + plotHeight,
        x2: x,
        y2: secondTop + plotHeight + 5,
        stroke: "var(--fg-soft)"
      }));
      append(svg, svgText(api, doc, x, height - 20, String(row.n), {
        "text-anchor": "middle",
        "font-size": 10
      }));
    });
    append(svg, svgText(api, doc, left + plotWidth / 2, height - 4, "迭代步 n（每一步 a_n=2^n a_0）", {
      "text-anchor": "middle",
      "font-size": 11
    }));
    return svg;
  }

  function drawBChart(api, doc, result, chartId) {
    var rows = result.rows;
    var width = 760;
    var height = 430;
    var left = 72;
    var right = 24;
    var top = 28;
    var bottom = 54;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var maxAbs = rows.reduce(function (max, row) {
      return Math.max(max, Math.abs(row.u), Math.abs(row.v));
    }, 0);
    var limit = Math.max(1, maxAbs * 1.18);
    var titleId = chartId + "-title";
    var descId = chartId + "-desc";
    var svg = makeSvg(api, doc, "svg", {
      className: "cl-rg-svg",
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      "aria-labelledby": titleId + " " + descId,
      preserveAspectRatio: "xMidYMid meet"
    });
    append(svg, makeSvg(api, doc, "title", { id: titleId }, ["二维 toy linearized RG flow"]));
    append(svg, makeSvg(api, doc, "desc", { id: descId }, [
      "横轴是 relevant 热方向 u，纵轴是 irrelevant 方向 v；虚线 u=0 是 toy 临界流形，轨迹点按迭代步连接。"
    ]));
    append(svg, makeSvg(api, doc, "rect", {
      x: 0,
      y: 0,
      width: width,
      height: height,
      fill: "var(--bg)",
      stroke: "var(--border)"
    }));

    function xScale(value) {
      return left + ((value + limit) / (2 * limit)) * plotWidth;
    }

    function yScale(value) {
      return top + ((limit - value) / (2 * limit)) * plotHeight;
    }

    var zeroX = xScale(0);
    var zeroY = yScale(0);
    append(svg, makeSvg(api, doc, "rect", {
      x: left,
      y: top,
      width: plotWidth,
      height: plotHeight,
      fill: "var(--block-bg)",
      stroke: "var(--border)"
    }));
    append(svg, makeSvg(api, doc, "line", {
      x1: zeroX,
      y1: top,
      x2: zeroX,
      y2: top + plotHeight,
      stroke: "var(--cl-rg-critical)",
      "stroke-width": 2,
      "stroke-dasharray": "7 5"
    }));
    append(svg, makeSvg(api, doc, "line", {
      x1: left,
      y1: zeroY,
      x2: left + plotWidth,
      y2: zeroY,
      stroke: "var(--fg-soft)",
      "stroke-opacity": "0.75"
    }));
    append(svg, makeSvg(api, doc, "line", {
      x1: left,
      y1: top,
      x2: left,
      y2: top + plotHeight,
      stroke: "var(--fg-soft)"
    }));
    append(svg, makeSvg(api, doc, "line", {
      x1: left,
      y1: top + plotHeight,
      x2: left + plotWidth,
      y2: top + plotHeight,
      stroke: "var(--fg-soft)"
    }));
    append(svg, svgText(api, doc, zeroX + 7, top + 16, "u=0：toy 临界流形", {
      fill: "var(--cl-rg-critical)",
      "font-size": 11
    }));
    append(svg, svgText(api, doc, left + plotWidth - 4, zeroY - 8, "u（relevant）→", {
      "text-anchor": "end",
      fill: "var(--cl-rg-relevant)",
      "font-size": 11
    }));
    append(svg, svgText(api, doc, zeroX + 8, top + 30, "v（irrelevant）", {
      fill: "var(--cl-rg-irrelevant)",
      "font-size": 11
    }));
    append(svg, svgText(api, doc, left + plotWidth / 2, height - 8, "u：偏离临界流形的热方向", {
      "text-anchor": "middle",
      "font-size": 11
    }));
    append(svg, svgText(api, doc, left - 12, top + plotHeight / 2, "v", {
      "text-anchor": "middle",
      "font-size": 12,
      transform: "rotate(-90 " + (left - 12) + " " + (top + plotHeight / 2) + ")"
    }));
    append(svg, makeSvg(api, doc, "path", {
      d: pathFromPoints(rows, xScale, yScale, "u", "v"),
      fill: "none",
      stroke: "var(--cl-rg-flow)",
      "stroke-width": 3,
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    }));
    rows.forEach(function (row, index) {
      append(svg, makeSvg(api, doc, "circle", {
        cx: xScale(row.u),
        cy: yScale(row.v),
        r: index === rows.length - 1 ? 5.2 : 3.8,
        fill: index === 0 ? "var(--cl-rg-relevant)" : "var(--cl-rg-flow)",
        stroke: "var(--bg)",
        "stroke-width": 1.5
      }));
      append(svg, svgText(api, doc, xScale(row.u) + 7, yScale(row.v) - 7, "n=" + row.n, {
        "font-size": 10
      }));
    });
    append(svg, makeSvg(api, doc, "circle", {
      cx: zeroX,
      cy: zeroY,
      r: 4.5,
      fill: "var(--fg)",
      stroke: "var(--bg)",
      "stroke-width": 1.5
    }));
    return svg;
  }

  function mount(root, api) {
    var doc = root.ownerDocument || document;
    var instanceId = INSTANCE_COUNT += 1;
    var ids = {
      aTab: "cl-rg-flow-" + instanceId + "-tab-a",
      bTab: "cl-rg-flow-" + instanceId + "-tab-b",
      aPanel: "cl-rg-flow-" + instanceId + "-panel-a",
      bPanel: "cl-rg-flow-" + instanceId + "-panel-b",
      aChart: "cl-rg-flow-" + instanceId + "-chart-a",
      bChart: "cl-rg-flow-" + instanceId + "-chart-b"
    };
    var state = {
      tab: "a",
      a: { k0: 1, steps: 4 },
      b: { b: 2, yt: 1, yi: -1, u: 0.25, v: 0.8, steps: 4 }
    };

    installStyles(doc);

    var header = makeElement(api, doc, "div", { className: "cl-rg-header" }, [
      makeElement(api, doc, "p", { className: "cl-rg-kicker", text: "确定性 RG 实验" }),
      makeElement(api, doc, "h3", { text: "RG flow · 逐尺度读出" }),
      makeElement(api, doc, "p", {
        text: "A 是无外场一维 Ising decimation 的精确流；B 是明确标注的临界点附近二维 toy 线性化流。"
      })
    ]);

    var tabA = makeElement(api, doc, "button", {
      id: ids.aTab,
      className: "cl-rg-tab",
      type: "button",
      role: "tab",
      "aria-selected": "true",
      "aria-controls": ids.aPanel,
      tabindex: "0",
      text: "A · 1D Ising 精确流"
    });
    var tabB = makeElement(api, doc, "button", {
      id: ids.bTab,
      className: "cl-rg-tab",
      type: "button",
      role: "tab",
      "aria-selected": "false",
      "aria-controls": ids.bPanel,
      tabindex: "-1",
      text: "B · 二维 toy 线性流"
    });
    var tablist = makeElement(api, doc, "div", {
      className: "cl-rg-tabs",
      role: "tablist",
      "aria-label": "重整化群实验页签"
    }, [tabA, tabB]);

    var aKField = makeRangeField(api, doc, {
      id: "cl-rg-flow-" + instanceId + "-k0",
      label: "初始耦合 K₀",
      min: 0.05,
      max: 3,
      step: 0.05,
      value: 1,
      minLabel: "0.05",
      maxLabel: "3"
    });
    var aStepField = makeRangeField(api, doc, {
      id: "cl-rg-flow-" + instanceId + "-a-steps",
      label: "迭代步数 n",
      min: 0,
      max: 8,
      step: 1,
      value: 4,
      minLabel: "0",
      maxLabel: "8"
    });
    var aControls = makeElement(api, doc, "div", { className: "cl-rg-controls" }, [
      makeFieldset(api, doc, "A · 无外场一维最近邻链", [aKField]),
      makeFieldset(api, doc, "粗粒化记录", [aStepField])
    ]);
    var aPresetLow = makeElement(api, doc, "button", {
      className: "cl-rg-preset",
      type: "button",
      text: "低温起点 K₀=2.4"
    });
    var aPresetDefault = makeElement(api, doc, "button", {
      className: "cl-rg-preset",
      type: "button",
      text: "默认 K₀=1"
    });
    var aPresets = makeElement(api, doc, "div", {
      className: "cl-rg-presets",
      "aria-label": "A 页签预设"
    }, [aPresetLow, aPresetDefault]);
    var aStatus = makeElement(api, doc, "p", { className: "cl-rg-status", role: "status" });
    var aMetricK0 = makeMetric(api, doc, "K₀", "flow");
    var aMetricK = makeMetric(api, doc, "末步 Kₙ", "flow");
    var aMetricT = makeMetric(api, doc, "末步 Tₙ/J", "relevant");
    var aMetricXi = makeMetric(api, doc, "末步 ξ_c/aₙ", "irrelevant");
    var aMetrics = makeElement(api, doc, "div", { className: "cl-rg-metrics" }, [
      aMetricK0.card,
      aMetricK.card,
      aMetricT.card,
      aMetricXi.card
    ]);
    var aChartHost = makeElement(api, doc, "div", { className: "cl-rg-chart-wrap" });
    var aChartCard = makeElement(api, doc, "section", {
      className: "cl-rg-chart-card",
      "aria-label": "A 页签的流图"
    }, [
      makeElement(api, doc, "h4", { className: "cl-rg-card-title", text: "流向：K 与当前粗粒格的 connected 关联长度" }),
      aChartHost,
      makeElement(api, doc, "p", {
        className: "cl-rg-note",
        text: "ξ_c/aₙ 每次约减半；换回原始单位的物理长度 2ⁿξ_c/aₙ 应保持不变。"
      })
    ]);
    var aTableHost = makeElement(api, doc, "div");
    var aTableCard = makeElement(api, doc, "section", {
      className: "cl-rg-table-card",
      "aria-label": "A 页签的迭代表"
    }, [
      makeElement(api, doc, "h4", { className: "cl-rg-card-title", text: "逐步读数" }),
      aTableHost
    ]);
    var aPanel = makeElement(api, doc, "section", {
      id: ids.aPanel,
      className: "cl-rg-panel",
      role: "tabpanel",
      "aria-labelledby": ids.aTab
    }, [
      makeElement(api, doc, "p", {
        className: "cl-rg-panel-intro",
        text: "精确使用 tanh K′=tanh²K（忽略自由能加性常数）；K 越小表示 T/J 越高。关联长度严格按 connected correlation 计算。"
      }),
      aControls,
      aPresets,
      aStatus,
      aMetrics,
      aChartCard,
      aTableCard
    ]);

    var bField = makeRangeField(api, doc, {
      id: "cl-rg-flow-" + instanceId + "-b",
      label: "尺度因子 b",
      min: 1.2,
      max: 4,
      step: 0.1,
      value: 2,
      minLabel: "1.2",
      maxLabel: "4"
    });
    var bYtField = makeRangeField(api, doc, {
      id: "cl-rg-flow-" + instanceId + "-yt",
      label: "y_t > 0（relevant）",
      min: 0.2,
      max: 2,
      step: 0.1,
      value: 1,
      minLabel: "0.2",
      maxLabel: "2"
    });
    var bYiField = makeRangeField(api, doc, {
      id: "cl-rg-flow-" + instanceId + "-yi",
      label: "y_i < 0（irrelevant）",
      min: -2,
      max: -0.1,
      step: 0.1,
      value: -1,
      minLabel: "-2",
      maxLabel: "-0.1"
    });
    var bUField = makeRangeField(api, doc, {
      id: "cl-rg-flow-" + instanceId + "-u",
      label: "初值 u₀",
      min: -1,
      max: 1,
      step: 0.01,
      value: 0.25,
      minLabel: "-1",
      maxLabel: "1"
    });
    var bVField = makeRangeField(api, doc, {
      id: "cl-rg-flow-" + instanceId + "-v",
      label: "初值 v₀",
      min: -1,
      max: 1,
      step: 0.05,
      value: 0.8,
      minLabel: "-1",
      maxLabel: "1"
    });
    var bStepField = makeRangeField(api, doc, {
      id: "cl-rg-flow-" + instanceId + "-b-steps",
      label: "迭代步数 n",
      min: 0,
      max: 8,
      step: 1,
      value: 4,
      minLabel: "0",
      maxLabel: "8"
    });
    var bControls = makeElement(api, doc, "div", { className: "cl-rg-controls" }, [
      makeFieldset(api, doc, "B · toy 线性化参数", [bField, bYtField, bYiField]),
      makeFieldset(api, doc, "初值与步数", [bUField, bVField, bStepField])
    ]);
    var bPresetCritical = makeElement(api, doc, "button", {
      className: "cl-rg-preset",
      type: "button",
      text: "临界流形 u₀=0"
    });
    var bPresetNear = makeElement(api, doc, "button", {
      className: "cl-rg-preset",
      type: "button",
      text: "近临界 u₀=0.02"
    });
    var bPresets = makeElement(api, doc, "div", {
      className: "cl-rg-presets",
      "aria-label": "B 页签预设"
    }, [bPresetCritical, bPresetNear]);
    var bStatus = makeElement(api, doc, "p", { className: "cl-rg-status", role: "status" });
    var bMetricU = makeMetric(api, doc, "末步 uₙ", "relevant");
    var bMetricV = makeMetric(api, doc, "末步 vₙ", "irrelevant");
    var bMetricNu = makeMetric(api, doc, "toy ν=1/y_t", "flow");
    var bMetricUFactor = makeMetric(api, doc, "b^{y_t}", "relevant");
    var bMetrics = makeElement(api, doc, "div", { className: "cl-rg-metrics" }, [
      bMetricU.card,
      bMetricV.card,
      bMetricNu.card,
      bMetricUFactor.card
    ]);
    var bChartHost = makeElement(api, doc, "div", { className: "cl-rg-chart-wrap" });
    var bChartCard = makeElement(api, doc, "section", {
      className: "cl-rg-chart-card",
      "aria-label": "B 页签的二维 toy 流图"
    }, [
      makeElement(api, doc, "h4", { className: "cl-rg-card-title", text: "二维 toy 相图：临界流形与两个线性化方向" }),
      bChartHost,
      makeElement(api, doc, "div", { className: "cl-rg-legend" }, [
        makeElement(api, doc, "span", { className: "cl-rg-key" }, [
          makeElement(api, doc, "i", { className: "cl-rg-swatch", "data-kind": "relevant" }),
          "起点 / relevant：|u| 放大"
        ]),
        makeElement(api, doc, "span", { className: "cl-rg-key" }, [
          makeElement(api, doc, "i", { className: "cl-rg-swatch", "data-kind": "irrelevant" }),
          "v 方向：|v| 衰减"
        ]),
        makeElement(api, doc, "span", { className: "cl-rg-key" }, [
          makeElement(api, doc, "i", { className: "cl-rg-swatch", "data-kind": "critical" }),
          "u=0：toy 临界流形"
        ])
      ])
    ]);
    var bTableHost = makeElement(api, doc, "div");
    var bTableCard = makeElement(api, doc, "section", {
      className: "cl-rg-table-card",
      "aria-label": "B 页签的迭代表"
    }, [
      makeElement(api, doc, "h4", { className: "cl-rg-card-title", text: "逐步读数" }),
      bTableHost
    ]);
    var bPanel = makeElement(api, doc, "section", {
      id: ids.bPanel,
      className: "cl-rg-panel",
      role: "tabpanel",
      "aria-labelledby": ids.bTab,
      hidden: true
    }, [
      makeElement(api, doc, "p", {
        className: "cl-rg-panel-intro",
        text: "明确标注：这是临界点附近的二维 toy linearized flow，不是具体材料或具体模型的指数预测；u′=b^{y_t}u，v′=b^{y_i}v。"
      }),
      bControls,
      bPresets,
      bStatus,
      bMetrics,
      bChartCard,
      bTableCard
    ]);

    var shell = makeElement(api, doc, "div", { className: "cl-rg-shell" }, [
      header,
      tablist,
      aPanel,
      bPanel
    ]);
    var wrapper = makeElement(api, doc, "div", { className: "cl-rg-flow" }, [shell]);
    clear(root);
    root.appendChild(wrapper);

    function updateA(announce) {
      state.a.k0 = clamp(number(aKField.input.value, 1), 0.05, 3);
      state.a.steps = clamp(Math.round(number(aStepField.input.value, 4)), 0, 8);
      var rows = computeA(state.a.k0, state.a.steps);
      var last = rows[rows.length - 1];
      aKField.output.textContent = format(api, state.a.k0, 2);
      aStepField.output.textContent = String(state.a.steps);
      aMetricK0.value.textContent = format(api, state.a.k0, 3);
      aMetricK.value.textContent = format(api, last.k, 5);
      aMetricT.value.textContent = format(api, last.temperature, 3);
      aMetricXi.value.textContent = format(api, last.xi, 4);
      aStatus.textContent =
        "第 " + last.n + " 步：K=" + format(api, last.k, 5) +
        "，T/J=" + format(api, last.temperature, 3) +
        "；当前粗粒格 ξ_c/a_n=" + format(api, last.xi, 4) +
        "，原始单位 ξ_phys/a_0=" + format(api, last.physicalXi, 4) +
        "。有限 K 始终向高温固定点 K=0 流。";
      clear(aChartHost);
      append(aChartHost, drawAChart(api, doc, rows, ids.aChart));
      clear(aTableHost);
      append(aTableHost, makeTable(api, doc, [
        "n", "K_n", "T_n/J", "ξ_c/a_n", "2ⁿξ_c/a₀"
      ], rows, function (row) {
        return [
          String(row.n),
          format(api, row.k, 6),
          format(api, row.temperature, 6),
          format(api, row.xi, 6),
          format(api, row.physicalXi, 6)
        ];
      }, "一维 Ising decimation 迭代表"));
      if (announce && api && typeof api.announce === "function") {
        api.announce(root, "A 页签已更新：K 向零流，connected 关联长度在粗粒格单位中缩短。");
      }
    }

    function updateB(announce) {
      state.b.b = clamp(number(bField.input.value, 2), 1.2, 4);
      state.b.yt = clamp(number(bYtField.input.value, 1), 0.2, 2);
      state.b.yi = clamp(number(bYiField.input.value, -1), -2, -0.1);
      state.b.u = clamp(number(bUField.input.value, 0.25), -1, 1);
      state.b.v = clamp(number(bVField.input.value, 0.8), -1, 1);
      state.b.steps = clamp(Math.round(number(bStepField.input.value, 4)), 0, 8);
      var result = computeB(state.b);
      var rows = result.rows;
      var last = rows[rows.length - 1];
      bField.output.textContent = format(api, result.b, 1);
      bYtField.output.textContent = format(api, result.yt, 1);
      bYiField.output.textContent = format(api, result.yi, 1);
      bUField.output.textContent = formatSigned(api, state.b.u, 2);
      bVField.output.textContent = formatSigned(api, state.b.v, 2);
      bStepField.output.textContent = String(state.b.steps);
      bMetricU.value.textContent = formatSigned(api, last.u, 4);
      bMetricV.value.textContent = formatSigned(api, last.v, 4);
      bMetricNu.value.textContent = format(api, result.nu, 3);
      bMetricUFactor.value.textContent = format(api, result.uFactor, 3);
      var manifold = Math.abs(state.b.u) < 1e-12
        ? "u₀=0：轨迹留在 toy 临界流形。"
        : "u₀≠0：relevant 方向会把轨迹推出线性化邻域。";
      bStatus.textContent =
        "第 " + last.n + " 步：u=" + formatSigned(api, last.u, 4) +
        "，v=" + formatSigned(api, last.v, 4) +
        "；b^{y_t}=" + format(api, result.uFactor, 3) +
        "，b^{y_i}=" + format(api, result.vFactor, 3) +
        "，toy ν=1/y_t=" + format(api, result.nu, 3) + "。" + manifold;
      clear(bChartHost);
      append(bChartHost, drawBChart(api, doc, result, ids.bChart));
      clear(bTableHost);
      append(bTableHost, makeTable(api, doc, [
        "n", "u_n · relevant", "v_n · irrelevant"
      ], rows, function (row) {
        return [
          String(row.n),
          formatSigned(api, row.u, 6),
          formatSigned(api, row.v, 6)
        ];
      }, "二维 toy linearized flow 迭代表"));
      if (announce && api && typeof api.announce === "function") {
        api.announce(root, "B 页签已更新：u 是 relevant 方向，v 是 irrelevant 方向；toy ν 已按 1/y_t 重算。");
      }
    }

    function setTab(tab, announce) {
      state.tab = tab === "b" ? "b" : "a";
      var isA = state.tab === "a";
      tabA.setAttribute("aria-selected", isA ? "true" : "false");
      tabB.setAttribute("aria-selected", isA ? "false" : "true");
      tabA.setAttribute("tabindex", isA ? "0" : "-1");
      tabB.setAttribute("tabindex", isA ? "-1" : "0");
      aPanel.hidden = !isA;
      bPanel.hidden = isA;
      if (announce && api && typeof api.announce === "function") {
        api.announce(root, isA ? "已切换到 A：一维 Ising 精确流。" : "已切换到 B：二维 toy 线性化流。");
      }
    }

    function setInput(input, value, update) {
      input.value = String(value);
      update(true);
    }

    aKField.input.addEventListener("input", function () { updateA(true); });
    aStepField.input.addEventListener("input", function () { updateA(true); });
    aPresetLow.addEventListener("click", function () { setInput(aKField.input, 2.4, updateA); });
    aPresetDefault.addEventListener("click", function () { setInput(aKField.input, 1, updateA); });

    bField.input.addEventListener("input", function () { updateB(true); });
    bYtField.input.addEventListener("input", function () { updateB(true); });
    bYiField.input.addEventListener("input", function () { updateB(true); });
    bUField.input.addEventListener("input", function () { updateB(true); });
    bVField.input.addEventListener("input", function () { updateB(true); });
    bStepField.input.addEventListener("input", function () { updateB(true); });
    bPresetCritical.addEventListener("click", function () { setInput(bUField.input, 0, updateB); });
    bPresetNear.addEventListener("click", function () { setInput(bUField.input, 0.02, updateB); });

    tabA.addEventListener("click", function () { setTab("a", true); });
    tabB.addEventListener("click", function () { setTab("b", true); });
    tablist.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      var next = event.key === "ArrowLeft" ? "a" : "b";
      setTab(next, true);
      (next === "a" ? tabA : tabB).focus();
    });

    updateA(false);
    updateB(false);
    setTab("a", false);
  }

  window.CourseLearning.register("rg-flow", function (root, api) {
    mount(root, api);
  });
}());

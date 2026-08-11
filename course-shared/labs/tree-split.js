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
  var EPS = 1e-12;
  var INSTANCE = 0;
  var DATA = [
    { id: "A", x1: 1, x2: 1, label: 1 },
    { id: "B", x1: 2, x2: 1, label: 1 },
    { id: "C", x1: 3, x2: 2, label: 1 },
    { id: "D", x1: 4, x2: 2, label: 1 },
    { id: "E", x1: 1, x2: 4, label: 0 },
    { id: "F", x1: 2, x2: 4, label: 0 },
    { id: "G", x1: 3, x2: 3, label: 0 },
    { id: "H", x1: 4, x2: 3, label: 0 }
  ];
  var FEATURES = [
    { key: "x1", short: "x₁", label: "x₁：机翼展开度" },
    { key: "x2", short: "x₂", label: "x₂：尾翼折角" }
  ];
  var DEFAULT_STATE = {
    feature: "x1",
    threshold: 2.5,
    criterion: "entropy"
  };
  var PLOT = {
    left: 54,
    top: 62,
    width: 344,
    height: 302,
    min: 0.5,
    max: 4.5
  };
  var STYLE_TEXT = [
    ".tree-split-lab { --tree-positive: var(--cl-green, #39734d); --tree-negative: var(--cl-red, #b64335); --tree-gold: var(--cl-gold, #9b6a12); line-height: 1.5; }",
    "html[data-theme=\"dark\"] .tree-split-lab { --tree-positive: #72bd8b; --tree-negative: #f08c7d; --tree-gold: #e2b458; }",
    ".tree-split-lab .tree-split-layout { display: grid; grid-template-columns: minmax(185px, .72fr) minmax(0, 1.28fr); gap: 18px; align-items: start; }",
    ".tree-split-lab .tree-split-controls, .tree-split-lab .tree-split-stage { min-width: 0; }",
    ".tree-split-lab .tree-split-controls { display: grid; gap: 12px; }",
    ".tree-split-lab .tree-split-control { display: grid; gap: 5px; }",
    ".tree-split-lab .tree-split-control label { color: var(--fg-soft); font-size: 13px; font-weight: 650; }",
    ".tree-split-lab select { width: 100%; min-height: 44px; padding: 7px 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--fg); font: inherit; }",
    ".tree-split-lab button { min-height: 44px; padding: 8px 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--fg); font: inherit; cursor: pointer; }",
    ".tree-split-lab button:hover, .tree-split-lab select:hover { border-color: var(--accent); }",
    ".tree-split-lab button:focus-visible, .tree-split-lab select:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
    ".tree-split-lab .tree-split-primary { border-color: var(--accent); background: var(--accent); color: var(--bg); font-weight: 700; }",
    ".tree-split-lab .tree-split-button-row { display: flex; flex-wrap: wrap; gap: 8px; }",
    ".tree-split-lab .tree-split-button-row > * { flex: 1 1 150px; }",
    ".tree-split-lab .tree-split-note, .tree-split-lab .tree-split-candidate-note, .tree-split-lab .tree-split-search-info, .tree-split-lab .tree-split-plot-note { margin: 0; color: var(--fg-soft); font-size: 13px; overflow-wrap: anywhere; }",
    ".tree-split-lab .tree-split-search-info { padding-left: 10px; border-left: 3px solid var(--tree-gold); }",
    ".tree-split-lab .tree-split-stage-frame { padding: 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); }",
    ".tree-split-lab .tree-split-svg { display: block; width: 100%; max-width: 100%; height: auto; color: var(--fg); }",
    ".tree-split-lab .tree-split-svg text { fill: currentColor; font-family: inherit; letter-spacing: 0; }",
    ".tree-split-lab .tree-split-panel { fill: none; stroke: var(--border); stroke-width: 1; }",
    ".tree-split-lab .tree-split-grid { stroke: currentColor; stroke-opacity: .12; stroke-width: 1; }",
    ".tree-split-lab .tree-split-axis { stroke: currentColor; stroke-opacity: .48; stroke-width: 1.2; }",
    ".tree-split-lab .tree-split-region-left { fill: var(--accent); opacity: .08; }",
    ".tree-split-lab .tree-split-region-right { fill: var(--tree-gold); opacity: .08; }",
    ".tree-split-lab .tree-split-boundary { stroke: var(--accent); stroke-width: 2.8; }",
    ".tree-split-lab .tree-split-positive { fill: var(--tree-positive); }",
    ".tree-split-lab .tree-split-negative { fill: var(--tree-negative); }",
    ".tree-split-lab .tree-split-point { stroke: var(--bg); stroke-width: 1.5; }",
    ".tree-split-lab .tree-split-point.tree-split-near { stroke: var(--tree-gold); stroke-width: 3; }",
    ".tree-split-lab .tree-split-tree-line { stroke: currentColor; stroke-opacity: .55; stroke-width: 1.5; }",
    ".tree-split-lab .tree-split-tree-node, .tree-split-lab .tree-split-tree-leaf { fill: var(--bg); stroke: var(--border); stroke-width: 1.2; }",
    ".tree-split-lab .tree-split-tree-node { stroke: var(--accent); stroke-width: 2; }",
    ".tree-split-lab .tree-split-bar-positive { fill: var(--tree-positive); }",
    ".tree-split-lab .tree-split-bar-negative { fill: var(--tree-negative); }",
    ".tree-split-lab .tree-split-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(118px, 1fr)); gap: 8px; margin-top: 12px; }",
    ".tree-split-lab .tree-split-metric { min-width: 0; padding: 9px; border-top: 2px solid var(--border); background: var(--bg); }",
    ".tree-split-lab .tree-split-metric span { display: block; color: var(--fg-soft); font-size: 11.5px; line-height: 1.4; }",
    ".tree-split-lab .tree-split-metric strong { display: block; margin-top: 3px; color: var(--fg); font-size: 14px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }",
    ".tree-split-lab .tree-split-formula { margin-top: 13px; padding: 10px 12px; border-left: 3px solid var(--accent); background: var(--bg); color: var(--fg-soft); font-size: 13px; overflow-wrap: anywhere; }",
    ".tree-split-lab .tree-split-legend { display: flex; flex-wrap: wrap; gap: 7px 14px; margin-top: 7px; color: var(--fg-soft); font-size: 12.5px; }",
    ".tree-split-lab .tree-split-legend-item { display: inline-flex; align-items: center; gap: 5px; }",
    ".tree-split-lab .tree-split-legend-line { display: inline-block; width: 22px; border-top: 2px solid var(--accent); }",
    ".tree-split-lab .tree-split-legend-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }",
    ".tree-split-lab .tree-split-legend-square { display: inline-block; width: 10px; height: 10px; border-radius: 2px; }",
    ".tree-split-lab .tree-split-legend-near { display: inline-block; width: 10px; height: 10px; border: 3px solid var(--tree-gold); border-radius: 50%; }",
    ".tree-split-lab .tree-split-candidates { margin-top: 16px; }",
    ".tree-split-lab .tree-split-candidate-grid { display: grid; gap: 0; margin-top: 7px; }",
    ".tree-split-lab .tree-split-candidate-row { display: grid; grid-template-columns: minmax(62px, .6fr) minmax(145px, 1.7fr) minmax(78px, .8fr) minmax(72px, .7fr); gap: 8px; align-items: baseline; padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 12.5px; }",
    ".tree-split-lab .tree-split-candidate-head { color: var(--fg-soft); font-size: 11.5px; }",
    ".tree-split-lab .tree-split-candidate-row > span:nth-child(n+3) { text-align: right; font-variant-numeric: tabular-nums; }",
    ".tree-split-lab .tree-split-candidate-active { padding-left: 6px; padding-right: 6px; background: color-mix(in srgb, var(--accent) 9%, transparent); }",
    "@media (max-width: 700px) {",
    "  .tree-split-lab .tree-split-layout { grid-template-columns: minmax(0, 1fr); }",
    "  .tree-split-lab .tree-split-stage-frame { padding: 5px; }",
    "  .tree-split-lab .tree-split-candidate-head { display: none; }",
    "  .tree-split-lab .tree-split-candidate-row { grid-template-columns: minmax(0, 1fr) auto; gap: 3px 10px; }",
    "  .tree-split-lab .tree-split-candidate-row > span:nth-child(2) { grid-column: 1 / -1; grid-row: 2; text-align: left; color: var(--fg-soft); }",
    "  .tree-split-lab .tree-split-candidate-row > span:nth-child(3) { grid-column: 1 / -1; grid-row: 3; text-align: left; }",
    "  .tree-split-lab .tree-split-candidate-row > span:nth-child(4) { grid-column: 2; grid-row: 1; text-align: right; }",
    "}"
  ].join("\n");

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function appendChildren(node, children) {
    var list;
    if (children === undefined || children === null) return node;
    list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : document.createTextNode(String(child)));
    });
    return node;
  }

  function makeElement(api, tag, attrs, children) {
    if (api && typeof api.el === "function") return api.el(tag, attrs || {}, children);
    return appendChildren(setAttributes(document.createElement(tag), attrs || {}), children);
  }

  function makeSvg(api, tag, attrs, children) {
    if (api && typeof api.svg === "function") return api.svg(tag, attrs || {}, children);
    return appendChildren(
      setAttributes(document.createElementNS(SVG_NS, tag), attrs || {}),
      children
    );
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function formatNumber(api, value, digits) {
    if (api && typeof api.format === "function") return api.format(value, digits);
    if (!Number.isFinite(value)) return "-";
    var text = value.toFixed(digits === undefined ? 3 : digits);
    return text.indexOf(".") === -1
      ? text
      : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function featureInfo(key) {
    var found = FEATURES[0];
    FEATURES.forEach(function (feature) {
      if (feature.key === key) found = feature;
    });
    return found;
  }

  function criterionName(criterion) {
    return criterion === "gini" ? "Gini" : "Entropy";
  }

  function countLabels(points) {
    var positive = 0;
    points.forEach(function (point) {
      if (point.label === 1) positive += 1;
    });
    return {
      positive: positive,
      negative: points.length - positive,
      total: points.length
    };
  }

  function countText(points) {
    var counts = countLabels(points);
    return "+ " + counts.positive + " / − " + counts.negative;
  }

  function entropy(points) {
    var counts = countLabels(points);
    var p;
    var term;
    if (!counts.total) return 0;
    p = counts.positive / counts.total;
    term = function (q) {
      return q === 0 ? 0 : -q * Math.log2(q);
    };
    return term(p) + term(1 - p);
  }

  function gini(points) {
    var counts = countLabels(points);
    var p;
    if (!counts.total) return 0;
    p = counts.positive / counts.total;
    return 1 - p * p - (1 - p) * (1 - p);
  }

  function impurity(points, criterion) {
    return criterion === "gini" ? gini(points) : entropy(points);
  }

  function candidateThresholds(featureKey) {
    var values = [];
    var thresholds = [];
    DATA.forEach(function (point) {
      var value = point[featureKey];
      if (Number.isFinite(value) && values.indexOf(value) === -1) values.push(value);
    });
    values.sort(function (a, b) { return a - b; });
    values.forEach(function (value, index) {
      if (index >= values.length - 1 || value === values[index + 1]) return;
      thresholds.push({
        lower: value,
        upper: values[index + 1],
        threshold: (value + values[index + 1]) / 2
      });
    });
    return thresholds;
  }

  function evaluateSplit(featureKey, threshold, criterion) {
    var left = [];
    var right = [];
    var candidate = null;
    var thresholds = candidateThresholds(featureKey);
    var parent;
    var leftImpurity;
    var rightImpurity;
    var weighted;
    thresholds.forEach(function (item) {
      if (Math.abs(item.threshold - threshold) <= EPS) candidate = item;
    });
    DATA.forEach(function (point) {
      (point[featureKey] <= threshold ? left : right).push(point);
    });
    parent = impurity(DATA, criterion);
    leftImpurity = impurity(left, criterion);
    rightImpurity = impurity(right, criterion);
    weighted =
      left.length / DATA.length * leftImpurity +
      right.length / DATA.length * rightImpurity;
    return {
      feature: featureKey,
      threshold: threshold,
      lowerValue: candidate ? candidate.lower : null,
      upperValue: candidate ? candidate.upper : null,
      criterion: criterion,
      left: left,
      right: right,
      parent: parent,
      leftImpurity: leftImpurity,
      rightImpurity: rightImpurity,
      weighted: weighted,
      gain: parent - weighted
    };
  }

  function enumerateBest(criterion) {
    var best = null;
    FEATURES.forEach(function (feature) {
      candidateThresholds(feature.key).forEach(function (candidate) {
        var result = evaluateSplit(feature.key, candidate.threshold, criterion);
        if (best === null || result.gain > best.gain + EPS) {
          best = result;
        }
        /* Equal gains keep the earlier feature/threshold by construction. */
      });
    });
    return best;
  }

  function sx(value) {
    return PLOT.left + (value - PLOT.min) / (PLOT.max - PLOT.min) * PLOT.width;
  }

  function sy(value) {
    return PLOT.top + (PLOT.max - value) / (PLOT.max - PLOT.min) * PLOT.height;
  }

  function svgText(api, x, y, text, attrs) {
    var merged = Object.assign({
      x: x,
      y: y,
      "font-size": "11.5",
      "text-anchor": "middle",
      fill: "currentColor"
    }, attrs || {});
    return makeSvg(api, "text", merged, [text]);
  }

  function drawLeaf(api, children, x, y, width, height, title, points) {
    var counts = countLabels(points);
    var barX = x + 14;
    var barY = y + 61;
    var barWidth = width - 28;
    var barHeight = 18;
    var positiveWidth = points.length
      ? barWidth * counts.positive / points.length
      : 0;
    var prediction = counts.positive === counts.negative
      ? "预测：平票"
      : counts.positive > counts.negative ? "预测：+1" : "预测：−1";
    var group = makeSvg(api, "g", {});
    group.appendChild(makeSvg(api, "title", {}, [
      title + "，" + countText(points) + "，" + prediction
    ]));
    group.appendChild(makeSvg(api, "rect", {
      className: "tree-split-tree-leaf",
      x: x,
      y: y,
      width: width,
      height: height,
      rx: 6
    }));
    group.appendChild(svgText(api, x + 12, y + 23, title, {
      "text-anchor": "start",
      "font-size": "12",
      "font-weight": "700"
    }));
    group.appendChild(svgText(api, x + 12, y + 43, "类别组成：" + countText(points), {
      "text-anchor": "start",
      "font-size": "10.5",
      fill: "currentColor"
    }));
    if (positiveWidth > 0) {
      group.appendChild(makeSvg(api, "rect", {
        className: "tree-split-bar-positive",
        x: barX,
        y: barY,
        width: positiveWidth,
        height: barHeight,
        rx: 3
      }));
    }
    if (barWidth - positiveWidth > 0) {
      group.appendChild(makeSvg(api, "rect", {
        className: "tree-split-bar-negative",
        x: barX + positiveWidth,
        y: barY,
        width: barWidth - positiveWidth,
        height: barHeight,
        rx: 3
      }));
    }
    group.appendChild(svgText(api, x + width / 2, y + 95, "样本托盘", {
      "font-size": "10.5",
      fill: "currentColor"
    }));
    points.forEach(function (point, index) {
      var trayX = x + 23 + index * 20;
      var trayY = y + 116;
      if (point.label === 1) {
        group.appendChild(makeSvg(api, "circle", {
          className: "tree-split-positive",
          cx: trayX,
          cy: trayY,
          r: 6
        }));
      } else {
        group.appendChild(makeSvg(api, "rect", {
          className: "tree-split-negative",
          x: trayX - 5,
          y: trayY - 5,
          width: 10,
          height: 10,
          rx: 2
        }));
      }
    });
    group.appendChild(svgText(api, x + 12, y + 151, prediction, {
      "text-anchor": "start",
      "font-size": "11.5",
      "font-weight": "700",
      fill: counts.positive === counts.negative
        ? "currentColor"
        : counts.positive > counts.negative
          ? "var(--tree-positive)"
          : "var(--tree-negative)"
    }));
    return group;
  }

  function drawStage(api, svg, result, titleId, descId) {
    clear(svg);
    var children = [
      makeSvg(api, "title", { id: titleId }, [
        "决策树切分实验：二维样本、切分线与一层树桩"
      ]),
      makeSvg(api, "desc", { id: descId }, [
        "左侧是八个带标签的二维样本和当前竖直或水平切分；右侧是同一切分形成的树桩，显示左右叶子的类别组成条与样本托盘。"
      ]),
      makeSvg(api, "rect", {
        className: "tree-split-panel",
        x: 20,
        y: 25,
        width: 398,
        height: 375,
        rx: 6
      }),
      makeSvg(api, "rect", {
        className: "tree-split-panel",
        x: 432,
        y: 25,
        width: 368,
        height: 375,
        rx: 6
      }),
      svgText(api, 219, 47, "二维样本空间", {
        "font-size": "13",
        "font-weight": "700"
      }),
      svgText(api, 616, 47, "一层树桩：同一候选切分", {
        "font-size": "13",
        "font-weight": "700"
      })
    ];
    var plotBottom = PLOT.top + PLOT.height;
    var plotRight = PLOT.left + PLOT.width;
    var thresholdX = sx(result.threshold);
    var thresholdY = sy(result.threshold);
    var leftRegion;
    var rightRegion;
    if (result.feature === "x1") {
      leftRegion = { x: PLOT.left, y: PLOT.top, width: thresholdX - PLOT.left, height: PLOT.height };
      rightRegion = { x: thresholdX, y: PLOT.top, width: plotRight - thresholdX, height: PLOT.height };
    } else {
      leftRegion = { x: PLOT.left, y: thresholdY, width: PLOT.width, height: plotBottom - thresholdY };
      rightRegion = { x: PLOT.left, y: PLOT.top, width: PLOT.width, height: thresholdY - PLOT.top };
    }
    children.push(
      makeSvg(api, "rect", Object.assign({ className: "tree-split-region-left" }, leftRegion)),
      makeSvg(api, "rect", Object.assign({ className: "tree-split-region-right" }, rightRegion))
    );
    for (var tick = 1; tick <= 4; tick += 1) {
      children.push(
        makeSvg(api, "line", {
          className: "tree-split-grid",
          x1: sx(tick),
          y1: PLOT.top,
          x2: sx(tick),
          y2: plotBottom
        }),
        makeSvg(api, "line", {
          className: "tree-split-grid",
          x1: PLOT.left,
          y1: sy(tick),
          x2: plotRight,
          y2: sy(tick)
        }),
        svgText(api, sx(tick), plotBottom + 19, String(tick), { "font-size": "10.5" }),
        svgText(api, PLOT.left - 13, sy(tick) + 4, String(tick), {
          "font-size": "10.5",
          "text-anchor": "end"
        })
      );
    }
    children.push(
      makeSvg(api, "line", {
        className: "tree-split-axis",
        x1: PLOT.left,
        y1: plotBottom,
        x2: plotRight,
        y2: plotBottom
      }),
      makeSvg(api, "line", {
        className: "tree-split-axis",
        x1: PLOT.left,
        y1: PLOT.top,
        x2: PLOT.left,
        y2: plotBottom
      }),
      svgText(api, plotRight - 2, plotBottom + 36, "x₁", {
        "font-size": "12",
        "text-anchor": "end"
      }),
      svgText(api, PLOT.left - 22, PLOT.top + 2, "x₂", {
        "font-size": "12",
        "text-anchor": "end"
      })
    );
    if (result.feature === "x1") {
      children.push(
        makeSvg(api, "line", {
          className: "tree-split-boundary",
          x1: thresholdX,
          y1: PLOT.top,
          x2: thresholdX,
          y2: plotBottom
        }),
        svgText(api, thresholdX + 5, PLOT.top + 16, "x₁≤" + formatNumber(api, result.threshold, 2), {
          "text-anchor": "start",
          "font-size": "10.5",
          "font-weight": "700"
        })
      );
    } else {
      children.push(
        makeSvg(api, "line", {
          className: "tree-split-boundary",
          x1: PLOT.left,
          y1: thresholdY,
          x2: plotRight,
          y2: thresholdY
        }),
        svgText(api, PLOT.left + 7, thresholdY - 7, "x₂≤" + formatNumber(api, result.threshold, 2), {
          "text-anchor": "start",
          "font-size": "10.5",
          "font-weight": "700"
        })
      );
    }
    DATA.forEach(function (point) {
      var near = point[result.feature] === result.lowerValue ||
        point[result.feature] === result.upperValue;
      var pointClass = "tree-split-point " +
        (point.label === 1 ? "tree-split-positive" : "tree-split-negative") +
        (near ? " tree-split-near" : "");
      var px = sx(point.x1);
      var py = sy(point.x2);
      var labelY = py + (point.id.charCodeAt(0) % 2 ? -9 : 17);
      var group = makeSvg(api, "g", {
        role: "img",
        "aria-label": "样本 " + point.id + "，" +
          featureInfo(result.feature).short + "值 " + point[result.feature] +
          "，标签 " + (point.label === 1 ? "正类" : "负类")
      });
      group.appendChild(makeSvg(api, "title", {}, [
        "样本 " + point.id + "：" + (point.label === 1 ? "正类" : "负类")
      ]));
      if (point.label === 1) {
        group.appendChild(makeSvg(api, "circle", {
          className: pointClass,
          cx: px,
          cy: py,
          r: near ? 8 : 6
        }));
      } else {
        group.appendChild(makeSvg(api, "rect", {
          className: pointClass,
          x: px - (near ? 8 : 6),
          y: py - (near ? 8 : 6),
          width: near ? 16 : 12,
          height: near ? 16 : 12,
          rx: 2
        }));
      }
      group.appendChild(svgText(api, px + 8, labelY, point.id, {
        "text-anchor": "start",
        "font-size": "10.5",
        "font-weight": "700"
      }));
      children.push(group);
    });

    var rootX = 525;
    var rootY = 68;
    var rootWidth = 182;
    var rootHeight = 52;
    var rootCenter = rootX + rootWidth / 2;
    var leafY = 176;
    var leafWidth = 158;
    var leafHeight = 184;
    var leftX = 448;
    var rightX = 626;
    children.push(
      makeSvg(api, "line", {
        className: "tree-split-tree-line",
        x1: rootCenter,
        y1: rootY + rootHeight,
        x2: leftX + leafWidth / 2,
        y2: leafY
      }),
      makeSvg(api, "line", {
        className: "tree-split-tree-line",
        x1: rootCenter,
        y1: rootY + rootHeight,
        x2: rightX + leafWidth / 2,
        y2: leafY
      }),
      svgText(api, 527, 151, "≤ 阈值", {
        "font-size": "10.5",
        fill: "var(--accent)"
      }),
      svgText(api, 706, 151, "> 阈值", {
        "font-size": "10.5",
        fill: "var(--tree-gold)"
      }),
      makeSvg(api, "rect", {
        className: "tree-split-tree-node",
        x: rootX,
        y: rootY,
        width: rootWidth,
        height: rootHeight,
        rx: 6
      }),
      svgText(api, rootCenter, rootY + 22,
        featureInfo(result.feature).short + "≤" + formatNumber(api, result.threshold, 2) + "？",
        { "font-size": "12", "font-weight": "700" }
      ),
      svgText(api, rootCenter, rootY + 40, "轴对齐二叉问题", { "font-size": "10.5" }),
      drawLeaf(api, [], leftX, leafY, leafWidth, leafHeight,
        "左叶（≤阈值，n=" + result.left.length + "）", result.left),
      drawLeaf(api, [], rightX, leafY, leafWidth, leafHeight,
        "右叶（>阈值，n=" + result.right.length + "）", result.right)
    );
    appendChildren(svg, children);
  }

  function buildLab(root, api) {
    INSTANCE += 1;
    var instanceId = "tree-split-" + INSTANCE;
    var featureId = instanceId + "-feature";
    var thresholdId = instanceId + "-threshold";
    var criterionId = instanceId + "-criterion";
    var titleId = instanceId + "-svg-title";
    var descId = instanceId + "-svg-desc";
    var state = {
      feature: DEFAULT_STATE.feature,
      threshold: DEFAULT_STATE.threshold,
      criterion: DEFAULT_STATE.criterion,
      searchRan: false
    };
    var featureSelect;
    var thresholdSelect;
    var criterionSelect;
    var thresholdOutput;
    var thresholdControl;
    var candidateNote;
    var searchInfo;
    var plotNote;
    var svg;
    var parentMetric;
    var leftMetric;
    var rightMetric;
    var weightedMetric;
    var gainMetric;
    var candidateList;

    clear(root);
    root.classList.add("tree-split-lab");
    var style = document.createElement("style");
    style.textContent = STYLE_TEXT;
    root.appendChild(style);
    root.appendChild(makeElement(api, "p", {
      className: "tree-split-note"
    }, [
      "固定八个纸飞机试飞样本：正类 A–D，负类 E–H；无随机数。"
    ]));

    featureSelect = makeElement(api, "select", {
      id: featureId,
      "aria-label": "选择切分特征"
    });
    FEATURES.forEach(function (feature) {
      featureSelect.appendChild(makeElement(api, "option", {
        value: feature.key
      }, [feature.label]));
    });
    criterionSelect = makeElement(api, "select", {
      id: criterionId,
      "aria-label": "选择杂质准则"
    }, [
      makeElement(api, "option", { value: "entropy" }, ["Entropy（熵，bit）"]),
      makeElement(api, "option", { value: "gini" }, ["Gini（基尼）"])
    ]);
    thresholdSelect = makeElement(api, "select", {
      id: thresholdId,
      "aria-label": "选择合法候选阈值"
    });
    thresholdOutput = makeElement(api, "output", { for: thresholdId });
    thresholdControl = makeElement(api, "div", {
      className: "tree-split-control"
    }, [
      makeElement(api, "label", { htmlFor: thresholdId }, [
        "合法阈值 t = ",
        thresholdOutput
      ]),
      thresholdSelect
    ]);
    candidateNote = makeElement(api, "p", { className: "tree-split-candidate-note" });
    searchInfo = makeElement(api, "p", {
      className: "tree-split-search-info",
      "aria-live": "polite"
    });

    function control(label, id, input) {
      return makeElement(api, "div", { className: "tree-split-control" }, [
        makeElement(api, "label", { htmlFor: id }, [label]),
        input
      ]);
    }

    var searchButton = makeElement(api, "button", {
      type: "button",
      className: "tree-split-primary"
    }, ["寻找最佳切分"]);
    var resetButton = makeElement(api, "button", {
      type: "button"
    }, ["重置"]);
    var buttonRow = makeElement(api, "div", {
      className: "tree-split-button-row"
    }, [searchButton, resetButton]);
    var controls = makeElement(api, "div", {
      className: "tree-split-controls",
      "aria-label": "决策树切分控制"
    }, [
      makeElement(api, "h4", {}, ["操作"]),
      control("特征", featureId, featureSelect),
      thresholdControl,
      control("杂质准则", criterionId, criterionSelect),
      buttonRow,
      searchInfo,
      candidateNote,
      makeElement(api, "p", { className: "tree-split-note" }, [
        "枚举顺序固定为 x₁、x₂；每个特征的中点按升序；gain 并列保留先遇到者。"
      ])
    ]);

    svg = makeSvg(api, "svg", {
      className: "tree-split-svg",
      viewBox: "0 0 820 420",
      role: "img",
      "aria-labelledby": titleId + " " + descId
    });
    plotNote = makeElement(api, "p", { className: "tree-split-plot-note" });
    var legend = makeElement(api, "div", {
      className: "tree-split-legend",
      "aria-label": "图例"
    }, [
      makeElement(api, "span", { className: "tree-split-legend-item" }, [
        makeElement(api, "span", { className: "tree-split-legend-line" }),
        "当前切分"
      ]),
      makeElement(api, "span", { className: "tree-split-legend-item" }, [
        makeElement(api, "span", { className: "tree-split-legend-dot tree-split-positive" }),
        "+1 正类"
      ]),
      makeElement(api, "span", { className: "tree-split-legend-item" }, [
        makeElement(api, "span", { className: "tree-split-legend-square tree-split-negative" }),
        "−1 负类"
      ]),
      makeElement(api, "span", { className: "tree-split-legend-item" }, [
        makeElement(api, "span", { className: "tree-split-legend-near" }),
        "相邻观测值，不是支持向量"
      ])
    ]);
    var metrics = makeElement(api, "div", {
      className: "tree-split-metrics"
    });

    function makeMetric(label) {
      var value = makeElement(api, "strong");
      metrics.appendChild(makeElement(api, "div", {
        className: "tree-split-metric"
      }, [
        makeElement(api, "span", {}, [label]),
        value
      ]));
      return value;
    }

    parentMetric = makeMetric("父节点 I(S)");
    leftMetric = makeMetric("左叶 I(S_L)");
    rightMetric = makeMetric("右叶 I(S_R)");
    weightedMetric = makeMetric("加权后杂质");
    gainMetric = makeMetric("gain");
    var formula = makeElement(api, "div", {
      className: "tree-split-formula"
    }, [
      "Gain = 父节点 I − (左叶样本数 / 总数)×左叶 I − (右叶样本数 / 总数)×右叶 I；当前准则："
    ]);
    var formulaCriterion = makeElement(api, "strong");
    formula.appendChild(formulaCriterion);
    var candidatesHeading = makeElement(api, "h4", {}, ["当前特征的全部合法候选"]);
    candidateList = makeElement(api, "div", {
      className: "tree-split-candidate-grid",
      role: "list",
      "aria-label": "当前特征的合法阈值与切分得分"
    });
    var candidatesSection = makeElement(api, "div", {
      className: "tree-split-candidates"
    }, [candidatesHeading, candidateList]);
    var stage = makeElement(api, "div", { className: "tree-split-stage" }, [
      makeElement(api, "div", { className: "tree-split-stage-frame" }, [svg]),
      plotNote,
      legend,
      metrics,
      formula,
      candidatesSection
    ]);
    var layout = makeElement(api, "div", {
      className: "tree-split-layout"
    }, [controls, stage]);
    root.appendChild(layout);

    function updateThresholdOptions() {
      var candidates = candidateThresholds(state.feature);
      var hasCurrent = false;
      clear(thresholdSelect);
      candidates.forEach(function (candidate) {
        var selected = Math.abs(candidate.threshold - state.threshold) <= EPS;
        if (selected) hasCurrent = true;
        thresholdSelect.appendChild(makeElement(api, "option", {
          value: String(candidate.threshold),
          selected: selected
        }, [
          "中点 " + formatNumber(api, candidate.threshold, 2) +
          "（" + candidate.lower + " 与 " + candidate.upper + " 之间）"
        ]));
      });
      if (!hasCurrent && candidates.length) state.threshold = candidates[0].threshold;
      thresholdSelect.value = String(state.threshold);
    }

    function renderCandidates() {
      var candidates = candidateThresholds(state.feature);
      var header = makeElement(api, "div", {
        className: "tree-split-candidate-row tree-split-candidate-head",
        role: "presentation"
      }, ["阈值 t", "左右叶组成", "加权 I", "gain"].map(function (text) {
        return makeElement(api, "span", {}, [text]);
      }));
      var selectedResult = evaluateSplit(state.feature, state.threshold, state.criterion);
      clear(candidateList);
      candidateList.appendChild(header);
      candidates.forEach(function (candidate) {
        var result = evaluateSplit(state.feature, candidate.threshold, state.criterion);
        var active = Math.abs(candidate.threshold - state.threshold) <= EPS;
        var row = makeElement(api, "div", {
          className: "tree-split-candidate-row" +
            (active ? " tree-split-candidate-active" : ""),
          role: "listitem"
        }, [
          makeElement(api, "span", {}, [
            "≤ " + formatNumber(api, candidate.threshold, 2)
          ]),
          makeElement(api, "span", {}, [
            countText(result.left) + "  |  " + countText(result.right)
          ]),
          makeElement(api, "span", {}, [
            formatNumber(api, result.weighted, 4)
          ]),
          makeElement(api, "span", {}, [
            formatNumber(api, result.gain, 4)
          ])
        ]);
        row.setAttribute("aria-label",
          featureInfo(state.feature).short + " 小于等于 " +
          formatNumber(api, candidate.threshold, 2) + "；加权杂质 " +
          formatNumber(api, result.weighted, 4) + "；gain " +
          formatNumber(api, result.gain, 4) +
          (active ? "；当前选择" : "")
        );
        candidateList.appendChild(row);
      });
      candidateNote.textContent =
        featureInfo(state.feature).short + " 的排序值为 1、2、3、4；合法中点： " +
        candidates.map(function (candidate) {
          return formatNumber(api, candidate.threshold, 2);
        }).join("、") + "。当前只显示该特征，搜索按钮会枚举两个特征共 " +
        (candidateThresholds("x1").length + candidateThresholds("x2").length) + " 个候选。";
      return selectedResult;
    }

    function render() {
      var result = renderCandidates();
      var best = enumerateBest(state.criterion);
      var selectedCountsLeft = countText(result.left);
      var selectedCountsRight = countText(result.right);
      featureSelect.value = state.feature;
      criterionSelect.value = state.criterion;
      thresholdSelect.value = String(state.threshold);
      thresholdOutput.textContent = formatNumber(api, state.threshold, 2);
      parentMetric.textContent =
        formatNumber(api, result.parent, 4) + "（" + criterionName(state.criterion) + "）";
      leftMetric.textContent =
        formatNumber(api, result.leftImpurity, 4) + " · " + selectedCountsLeft;
      rightMetric.textContent =
        formatNumber(api, result.rightImpurity, 4) + " · " + selectedCountsRight;
      weightedMetric.textContent = formatNumber(api, result.weighted, 4);
      gainMetric.textContent = formatNumber(api, result.gain, 4);
      formulaCriterion.textContent = criterionName(state.criterion);
      plotNote.textContent =
        "当前：" + featureInfo(state.feature).short + "≤" +
        formatNumber(api, state.threshold, 2) +
        "；金色描边是阈值两侧相邻观测值（" +
        result.lowerValue + " 与 " + result.upperValue +
        "），它们不是 SVM 支持向量。";
      if (!state.searchRan) {
        searchInfo.textContent =
          "尚未执行全特征枚举；当前先观察你选中的候选。";
      } else {
        searchInfo.textContent =
          "已枚举 " + (candidateThresholds("x1").length + candidateThresholds("x2").length) +
          " 个候选。最优：" + featureInfo(best.feature).short + "≤" +
          formatNumber(api, best.threshold, 2) + "，" +
          criterionName(state.criterion) + " gain=" +
          formatNumber(api, best.gain, 4) + "。";
      }
      drawStage(api, svg, result, titleId, descId);
    }

    featureSelect.addEventListener("change", function () {
      state.feature = featureSelect.value;
      state.searchRan = false;
      updateThresholdOptions();
      render();
    });
    thresholdSelect.addEventListener("change", function () {
      state.threshold = Number(thresholdSelect.value);
      state.searchRan = false;
      render();
    });
    criterionSelect.addEventListener("change", function () {
      state.criterion = criterionSelect.value;
      state.searchRan = false;
      render();
    });
    searchButton.addEventListener("click", function () {
      var best = enumerateBest(state.criterion);
      state.feature = best.feature;
      state.threshold = best.threshold;
      state.searchRan = true;
      updateThresholdOptions();
      render();
      if (api && typeof api.announce === "function") {
        api.announce(root, "已按固定顺序枚举全部候选，并切换到 gain 最大的切分。");
      }
    });
    resetButton.addEventListener("click", function () {
      state.feature = DEFAULT_STATE.feature;
      state.threshold = DEFAULT_STATE.threshold;
      state.criterion = DEFAULT_STATE.criterion;
      state.searchRan = false;
      updateThresholdOptions();
      render();
      if (api && typeof api.announce === "function") {
        api.announce(root, "已重置为 Entropy、x₁ 小于等于 2.5。");
      }
    });

    featureSelect.value = state.feature;
    criterionSelect.value = state.criterion;
    updateThresholdOptions();
    render();
  }

  window.CourseLearning.register("tree-split", buildLab);
})();

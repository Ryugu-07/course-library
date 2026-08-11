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
  var TRIALS = 2000;
  var BINS = 32;
  var X_MIN = -4;
  var X_MAX = 4;
  var BASE_SEED = 0xc17a5eed;

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) {
        return;
      }
      if (key === "className") {
        node.setAttribute("class", String(value));
      } else if (key === "htmlFor") {
        node.setAttribute("for", String(value));
      } else if (key.slice(0, 2) === "on" && typeof value === "function") {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (value === true) {
        node.setAttribute(key, "");
      } else {
        node.setAttribute(key, String(value));
      }
    });
    return node;
  }

  function appendChildren(node, children) {
    if (children === undefined || children === null) {
      return node;
    }
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) {
        return;
      }
      node.appendChild(
        child && child.nodeType
          ? child
          : document.createTextNode(String(child))
      );
    });
    return node;
  }

  function makeElement(api, tag, attrs, children) {
    if (api && typeof api.el === "function") {
      return api.el(tag, attrs || {}, children);
    }
    return appendChildren(
      setAttributes(document.createElement(tag), attrs || {}),
      children
    );
  }

  function makeSvg(api, tag, attrs, children) {
    if (api && typeof api.svg === "function") {
      return api.svg(tag, attrs || {}, children);
    }
    return appendChildren(
      setAttributes(document.createElementNS(SVG_NS, tag), attrs || {}),
      children
    );
  }

  function clear(node) {
    while (node && node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function replaceChildren(node, children) {
    clear(node);
    appendChildren(node, children);
  }

  function formatNumber(api, value, digits) {
    if (api && typeof api.format === "function") {
      return api.format(value, digits);
    }
    if (!Number.isFinite(value)) {
      return "—";
    }
    var text = value.toFixed(digits === undefined ? 3 : digits);
    return text.indexOf(".") === -1
      ? text
      : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") {
      api.announce(root, message);
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function svgText(api, x, y, text, attrs) {
    var merged = Object.assign(
      {
        x: x,
        y: y,
        "font-size": "12",
        "text-anchor": "middle",
        fill: "currentColor"
      },
      attrs || {}
    );
    return makeSvg(api, "text", merged, [text]);
  }

  function hashSeed(text) {
    var hash = 2166136261;
    for (var i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) || 1;
  }

  function makeRng(seed) {
    var state = seed >>> 0;
    return function () {
      state = (state + 0x6d2b79f5) | 0;
      var value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function normalDensity(z) {
    return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
  }

  var DISTRIBUTIONS = {
    uniform: {
      label: "均匀 U(0,1)",
      shortLabel: "均匀",
      mean: 0.5,
      variance: 1 / 12,
      sample: function (rng) {
        return rng();
      },
      note: "母分布平坦且有界；n=1 时离钟形最直观。"
    },
    skewed: {
      label: "偏斜：指数 Exp(1)",
      shortLabel: "偏斜",
      mean: 1,
      variance: 1,
      sample: function (rng) {
        return -Math.log(Math.max(1e-12, 1 - rng()));
      },
      note: "右偏且有长尾；有限 n 的近似通常比均匀分布更慢。"
    },
    bimodal: {
      label: "双峰：两簇对称均匀分布",
      shortLabel: "双峰",
      mean: 0,
      variance: 76 / 75,
      sample: function (rng) {
        var center = rng() < 0.5 ? -1 : 1;
        return center + (rng() - 0.5) * 0.4;
      },
      note: "两个窄区间对称出现；n 增大后两峰会被平均机制抹平。"
    }
  };

  function runExperiment(distributionKey, n) {
    var distribution = DISTRIBUTIONS[distributionKey];
    var seed = hashSeed(
      "clt-fixed-v1:" + BASE_SEED + ":" + distributionKey + ":" + n
    );
    var rng = makeRng(seed);
    var values = [];
    var total = 0;
    var totalSquare = 0;
    var inCentralBand = 0;

    for (var trial = 0; trial < TRIALS; trial += 1) {
      var sum = 0;
      for (var sample = 0; sample < n; sample += 1) {
        sum += distribution.sample(rng);
      }
      var standardized =
        (sum / n - distribution.mean) *
        Math.sqrt(n) /
        Math.sqrt(distribution.variance);
      values.push(standardized);
      total += standardized;
      totalSquare += standardized * standardized;
      if (Math.abs(standardized) <= 1) {
        inCentralBand += 1;
      }
    }

    var empiricalMean = total / TRIALS;
    var empiricalVariance = Math.max(
      0,
      totalSquare / TRIALS - empiricalMean * empiricalMean
    );
    var counts = [];
    for (var bin = 0; bin < BINS; bin += 1) {
      counts.push(0);
    }
    var outside = 0;
    var maxDensity = 0;
    var binWidth = (X_MAX - X_MIN) / BINS;
    values.forEach(function (value) {
      if (value < X_MIN || value >= X_MAX) {
        outside += 1;
        return;
      }
      var index = clamp(
        Math.floor(((value - X_MIN) / (X_MAX - X_MIN)) * BINS),
        0,
        BINS - 1
      );
      counts[index] += 1;
    });
    counts.forEach(function (count) {
      maxDensity = Math.max(maxDensity, count / (TRIALS * binWidth));
    });

    return {
      distribution: distribution,
      counts: counts,
      binWidth: binWidth,
      maxDensity: maxDensity,
      seed: seed,
      empiricalMean: empiricalMean,
      empiricalSd: Math.sqrt(empiricalVariance),
      centralCoverage: inCentralBand / TRIALS,
      outside: outside,
      rawMeanSd: Math.sqrt(distribution.variance / n),
      n: n
    };
  }

  function drawPlot(api, svg, experiment) {
    var left = 58;
    var top = 28;
    var width = 600;
    var height = 230;
    var bottom = top + height;
    var right = left + width;
    var yMax = Math.max(0.45, experiment.maxDensity * 1.2);
    var children = [
      makeSvg(api, "title", { id: "clt-plot-title" }, [
        "标准化样本均值的经验直方图"
      ]),
      makeSvg(api, "desc", { id: "clt-plot-desc" }, [
        experiment.distribution.shortLabel +
          "母分布，样本量 n=" +
          experiment.n +
          "；柱形表示 " +
          TRIALS +
          " 次重复实验的 Z_n，金色曲线表示标准正态密度。"
      ])
    ];

    function sx(value) {
      return left + ((value - X_MIN) / (X_MAX - X_MIN)) * width;
    }

    function sy(value) {
      return bottom - (clamp(value, 0, yMax) / yMax) * height;
    }

    for (var xTick = 0; xTick <= 4; xTick += 1) {
      var xValue = X_MIN + ((X_MAX - X_MIN) * xTick) / 4;
      var x = sx(xValue);
      children.push(
        makeSvg(api, "line", {
          x1: x,
          y1: top,
          x2: x,
          y2: bottom,
          stroke: "currentColor",
          "stroke-opacity": "0.12"
        }),
        svgText(api, x, bottom + 23, String(xValue), {
          "font-size": "11"
        })
      );
    }

    for (var yTick = 0; yTick <= 2; yTick += 1) {
      var yValue = (yMax * yTick) / 2;
      var y = sy(yValue);
      children.push(
        makeSvg(api, "line", {
          x1: left,
          y1: y,
          x2: right,
          y2: y,
          stroke: "currentColor",
          "stroke-opacity": yTick === 0 ? "0.32" : "0.1"
        }),
        svgText(api, left - 10, y + 4, formatNumber(api, yValue, 2), {
          "font-size": "11",
          "text-anchor": "end"
        })
      );
    }

    children.push(
      makeSvg(api, "line", {
        x1: left,
        y1: bottom,
        x2: right,
        y2: bottom,
        stroke: "currentColor",
        "stroke-width": "1.5"
      }),
      makeSvg(api, "line", {
        x1: left,
        y1: top,
        x2: left,
        y2: bottom,
        stroke: "currentColor",
        "stroke-width": "1.5"
      }),
      makeSvg(api, "line", {
        x1: sx(0),
        y1: top,
        x2: sx(0),
        y2: bottom,
        stroke: "currentColor",
        "stroke-dasharray": "4 4",
        "stroke-opacity": "0.42"
      })
    );

    for (var barIndex = 0; barIndex < BINS; barIndex += 1) {
      var density = experiment.counts[barIndex] / (TRIALS * experiment.binWidth);
      var barX = left + (width * barIndex) / BINS + 1;
      var barWidth = Math.max(1, width / BINS - 2);
      var barY = sy(density);
      children.push(
        makeSvg(api, "rect", {
          x: barX,
          y: barY,
          width: barWidth,
          height: Math.max(0, bottom - barY),
          fill: "currentColor",
          "fill-opacity": "0.32"
        })
      );
    }

    var curvePoints = [];
    for (var point = 0; point <= 160; point += 1) {
      var z = X_MIN + ((X_MAX - X_MIN) * point) / 160;
      curvePoints.push(sx(z) + "," + sy(normalDensity(z)));
    }
    children.push(
      makeSvg(api, "polyline", {
        points: curvePoints.join(" "),
        fill: "none",
        stroke: "var(--cl-gold, #9b6a12)",
        "stroke-width": "2.5",
        "stroke-linejoin": "round",
        "stroke-linecap": "round"
      }),
      svgText(api, right, bottom + 23, "z", {
        "font-size": "12",
        "text-anchor": "end"
      }),
      svgText(api, left - 10, top - 9, "密度", {
        "font-size": "12",
        "text-anchor": "end"
      }),
      makeSvg(api, "rect", {
        x: right - 154,
        y: top + 4,
        width: 12,
        height: 12,
        fill: "currentColor",
        "fill-opacity": "0.32"
      }),
      svgText(api, right - 136, top + 14, "经验直方图", {
        "font-size": "11",
        "text-anchor": "start"
      }),
      makeSvg(api, "line", {
        x1: right - 154,
        y1: top + 31,
        x2: right - 142,
        y2: top + 31,
        stroke: "var(--cl-gold, #9b6a12)",
        "stroke-width": "2.5"
      }),
      svgText(api, right - 136, top + 35, "φ(z)", {
        "font-size": "11",
        "text-anchor": "start"
      })
    );

    replaceChildren(svg, children);
    svg.setAttribute(
      "aria-label",
      experiment.distribution.shortLabel +
        "母分布、n=" +
        experiment.n +
        " 时标准化样本均值的经验直方图与标准正态曲线"
    );
  }

  function makeMetric(api, label) {
    var value = makeElement(api, "strong", {}, ["—"]);
    var card = makeElement(api, "div", { className: "cl-metric" }, [
      makeElement(api, "span", {}, [label]),
      value
    ]);
    return { card: card, value: value };
  }

  window.CourseLearning.register("clt", function (root, api) {
    if (!root || typeof document === "undefined") {
      return;
    }

    var state = {
      distribution: "bimodal",
      n: 1
    };

    var heading = makeElement(api, "h3", {}, [
      "中心极限定理实验：平均的形状如何改变？"
    ]);
    var intro = makeElement(api, "p", { className: "cl-note" }, [
      "先预测，再调节分布和 n。每个设置都用固定伪随机数做 " +
        TRIALS +
        " 次重复实验；柱形是 Z_n 的经验密度，金色曲线是标准正态密度 φ(z)。"
    ]);

    var distributionSelect = makeElement(api, "select", {
      id: "cl-clt-distribution",
      "aria-label": "选择母分布"
    });
    Object.keys(DISTRIBUTIONS).forEach(function (key) {
      distributionSelect.appendChild(
        makeElement(api, "option", { value: key }, [
          DISTRIBUTIONS[key].label
        ])
      );
    });
    distributionSelect.value = state.distribution;

    var distributionLabel = makeElement(api, "label", {
      htmlFor: "cl-clt-distribution"
    }, ["母分布"]);
    var nOutput = makeElement(api, "output", { htmlFor: "cl-clt-n" }, [
      String(state.n)
    ]);
    var nLabel = makeElement(api, "label", { htmlFor: "cl-clt-n" }, [
      "每次平均的样本量 n = ",
      nOutput
    ]);
    var nInput = makeElement(api, "input", {
      id: "cl-clt-n",
      type: "range",
      min: "1",
      max: "128",
      step: "1",
      value: String(state.n),
      "aria-label": "每次平均的样本量 n"
    });

    var controlSection = makeElement(api, "section", {
      className: "cl-controls",
      "aria-labelledby": "cl-clt-controls-title"
    }, [
      makeElement(api, "h4", { id: "cl-clt-controls-title" }, ["参数"]),
      makeElement(api, "div", { className: "cl-control" }, [
        distributionLabel,
        distributionSelect
      ]),
      makeElement(api, "div", { className: "cl-control" }, [
        nLabel,
        nInput
      ]),
      makeElement(api, "p", { className: "cl-note" }, [
        "三种母分布均有有限且非零方差；R = ",
        String(TRIALS),
        " 只是重复次数，不是 n。"
      ])
    ]);

    var svg = makeSvg(api, "svg", {
      className: "cl-plot",
      viewBox: "0 0 700 360",
      role: "img",
      "aria-labelledby": "clt-plot-title clt-plot-desc",
      "aria-label": "标准化样本均值的经验直方图"
    });
    var stageTitle = makeElement(api, "span", {
      id: "cl-clt-stage-title"
    }, ["标准化样本均值 Z_n"]);
    var plotNote = makeElement(api, "p", { className: "cl-note" }, []);
    var status = makeElement(api, "p", {
      className: "cl-note",
      "aria-live": "polite"
    }, []);

    var meanMetric = makeMetric(api, "经验均值 Ê[Z_n]");
    var sdMetric = makeMetric(api, "经验标准差 sd(Z_n)");
    var coverageMetric = makeMetric(api, "经验 P̂(|Z_n| ≤ 1)");
    var rawWidthMetric = makeMetric(api, "理论 sd(X̄_n) = σ/√n");
    var formula = makeElement(api, "div", { className: "cl-formula" }, []);
    var checklist = makeElement(api, "ul", {
      className: "cl-checklist",
      "aria-label": "实验读数与定理边界"
    });

    var stageSection = makeElement(api, "section", {
      className: "cl-stage",
      "aria-labelledby": "cl-clt-stage-title"
    }, [
      makeElement(api, "div", { className: "cl-stage-frame" }, [
        makeElement(api, "div", { className: "cl-stage-title" }, [
          stageTitle,
          makeElement(api, "span", {}, ["−4 ≤ z ≤ 4"])
        ]),
        svg
      ]),
      plotNote,
      makeElement(api, "div", { className: "cl-metrics" }, [
        meanMetric.card,
        sdMetric.card,
        coverageMetric.card,
        rawWidthMetric.card
      ]),
      status,
      formula,
      makeElement(api, "h4", {}, ["LLN / CLT 条件速查"]),
      checklist
    ]);

    var grid = makeElement(api, "div", { className: "cl-grid" }, [
      controlSection,
      stageSection
    ]);

    replaceChildren(root, [heading, intro, grid]);

    function updateChecklist(experiment) {
      var nText = formatNumber(api, experiment.n, 0);
      var approximationText =
        experiment.n === 1
          ? "n=1 时这就是母分布的标准化形状，不能期待它已经是正态。"
          : "有限 n 只给近似；偏斜或双峰母分布的接近速度可能不同。";
      replaceChildren(checklist, [
        makeElement(api, "li", {}, [
          makeElement(api, "span", { className: "cl-pass" }, ["✓"]),
          makeElement(api, "span", {}, [
            "LLN 看位置：理论上 sd(X̄_n) = ",
            formatNumber(api, experiment.rawMeanSd, 3),
            "，n 增大时平均更集中；这不是形状结论。"
          ])
        ]),
        makeElement(api, "li", {}, [
          makeElement(api, "span", { className: "cl-pass" }, ["✓"]),
          makeElement(api, "span", {}, [
            "CLT 看形状：本图已经先减去 μ、再除以 σ/√n，比较的是 Z_n 与 N(0,1)。"
          ])
        ]),
        makeElement(api, "li", {}, [
          makeElement(api, "span", { className: "cl-pass" }, ["✓"]),
          makeElement(api, "span", {}, [
            "前提：独立同分布，且本实验母分布满足 0 < σ² < ∞。"
          ])
        ]),
        makeElement(api, "li", {}, [
          makeElement(api, "span", { className: "cl-warn" }, ["!"]),
          makeElement(api, "span", {}, [nText + "：" + approximationText])
        ])
      ]);
    }

    function render() {
      var experiment = runExperiment(state.distribution, state.n);
      var distribution = experiment.distribution;
      nOutput.textContent = String(state.n);
      stageTitle.textContent =
        "标准化样本均值 Z_n（" + distribution.shortLabel + "）";
      plotNote.textContent =
        distribution.note +
        " 柱高按全部 " +
        TRIALS +
        " 次实验归一化；金色曲线只是 N(0,1) 的参考极限。";
      status.textContent =
        "固定种子 " +
        experiment.seed +
        " · " +
        distribution.label +
        " · n = " +
        state.n +
        " · 每次平均取 " +
        state.n +
        " 个样本 · 区间外（±4 之外）" +
        experiment.outside +
        " / " +
        TRIALS +
        " 个值未画出。";
      meanMetric.value.textContent = formatNumber(
        api,
        experiment.empiricalMean,
        3
      );
      sdMetric.value.textContent = formatNumber(api, experiment.empiricalSd, 3);
      coverageMetric.value.textContent =
        formatNumber(api, experiment.centralCoverage, 3) + "（正态约 0.683）";
      rawWidthMetric.value.textContent = formatNumber(
        api,
        experiment.rawMeanSd,
        3
      );
      formula.textContent =
        "Z_n = √n( X̄_n − μ ) / σ    ·    φ(z) = exp(−z²/2) / √(2π)";
      drawPlot(api, svg, experiment);
      updateChecklist(experiment);
    }

    distributionSelect.addEventListener("change", function () {
      state.distribution = distributionSelect.value;
      render();
      announce(api, root, "已切换到" + DISTRIBUTIONS[state.distribution].label);
    });
    nInput.addEventListener("input", function () {
      state.n = clamp(Number(nInput.value) || 1, 1, 128);
      render();
    });
    nInput.addEventListener("change", function () {
      announce(api, root, "样本量 n 已设为 " + state.n);
    });

    render();
  });
})();

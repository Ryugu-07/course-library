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
  var COHORT = 10000;
  var serial = 0;

  var PRESETS = {
    baseline: {
      label: "默认 · 低基率",
      prevalence: 1,
      sensitivity: 99,
      specificity: 95
    },
    specificity: {
      label: "高特异度 · 99.9%",
      prevalence: 1,
      sensitivity: 99,
      specificity: 99.9
    },
    prevalence: {
      label: "高基率 · 10%",
      prevalence: 10,
      sensitivity: 99,
      specificity: 95
    }
  };

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

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function trimNumber(value, digits) {
    var text = Number(value).toFixed(digits);
    return text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function formatRate(value) {
    return trimNumber(value, 2) + "%";
  }

  function formatProbability(value) {
    if (!Number.isFinite(value)) {
      return "—";
    }
    return formatRate(value * 100);
  }

  function formatCount(value) {
    if (!Number.isFinite(value)) {
      return "—";
    }
    var rounded = Math.abs(value - Math.round(value)) < 1e-9
      ? String(Math.round(value))
      : trimNumber(value, 1);
    return rounded.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatScalar(value) {
    if (value === Infinity) {
      return "∞";
    }
    if (!Number.isFinite(value)) {
      return "—";
    }
    return trimNumber(value, 4);
  }

  function calculate(state) {
    var pi = state.prevalence / 100;
    var sensitivity = state.sensitivity / 100;
    var specificity = state.specificity / 100;
    var tp = COHORT * pi * sensitivity;
    var fn = COHORT * pi * (1 - sensitivity);
    var fp = COHORT * (1 - pi) * (1 - specificity);
    var tn = COHORT * (1 - pi) * specificity;
    var positive = tp + fp;
    var negative = tn + fn;
    var ppv = positive > 0 ? tp / positive : NaN;
    var npv = negative > 0 ? tn / negative : NaN;
    var priorOdds = pi > 0 && pi < 1 ? pi / (1 - pi) : NaN;
    var lrPlus = specificity < 1 ? sensitivity / (1 - specificity) : Infinity;
    var posteriorOdds = ppv >= 1 ? Infinity : ppv / (1 - ppv);

    return {
      pi: pi,
      sensitivity: sensitivity,
      specificity: specificity,
      diseased: tp + fn,
      healthy: fp + tn,
      tp: tp,
      fn: fn,
      fp: fp,
      tn: tn,
      positive: positive,
      negative: negative,
      ppv: ppv,
      npv: npv,
      priorOdds: priorOdds,
      lrPlus: lrPlus,
      posteriorOdds: posteriorOdds
    };
  }

  function injectStyles() {
    if (document.getElementById("cl-bayes-styles")) {
      return;
    }
    var style = document.createElement("style");
    style.id = "cl-bayes-styles";
    style.textContent = [
      ".cl-bayes { min-width: 0; }",
      ".cl-bayes fieldset { min-width: 0; margin: 0; padding: 0; border: 0; }",
      ".cl-bayes legend { padding: 0; color: var(--fg-soft); font-size: 13px; font-weight: 650; }",
      ".cl-bayes .cl-bayes-presets { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; margin-top: 6px; }",
      ".cl-bayes .cl-bayes-presets button { width: 100%; min-height: 44px; }",
      ".cl-bayes .cl-bayes-range { display: grid; gap: 5px; }",
      ".cl-bayes .cl-bayes-range input[type=range] { display: block; width: 100%; min-height: 44px; }",
      ".cl-bayes .cl-bayes-range small { color: var(--fg-soft); line-height: 1.45; }",
      ".cl-bayes .cl-bayes-ledger { width: 100%; margin: 14px 0 0; border-collapse: collapse; table-layout: fixed; }",
      ".cl-bayes .cl-bayes-ledger caption { margin-bottom: 6px; color: var(--fg-soft); text-align: left; font-size: 13px; }",
      ".cl-bayes .cl-bayes-ledger th, .cl-bayes .cl-bayes-ledger td { padding: 7px 5px; border-bottom: 1px solid var(--border); text-align: right; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }",
      ".cl-bayes .cl-bayes-ledger th:first-child, .cl-bayes .cl-bayes-ledger td:first-child { text-align: left; }",
      ".cl-bayes .cl-bayes-ledger thead th { color: var(--fg-soft); font-size: 12px; font-weight: 650; }",
      ".cl-bayes .cl-bayes-ledger tbody th { font-weight: 700; }",
      ".cl-bayes .cl-bayes-ledger .cl-bayes-tp { color: var(--cl-green); }",
      ".cl-bayes .cl-bayes-ledger .cl-bayes-fp { color: var(--cl-red); }",
      ".cl-bayes .cl-bayes-ledger .cl-bayes-fn { color: var(--cl-gold); }",
      ".cl-bayes .cl-bayes-ledger .cl-bayes-tn { color: var(--cl-blue); }",
      ".cl-bayes .cl-bayes-posterior { margin-top: 16px; }",
      ".cl-bayes .cl-bayes-posterior h4 { margin-bottom: 5px; }",
      ".cl-bayes .cl-bayes-bar-row { display: grid; grid-template-columns: minmax(120px, .7fr) minmax(0, 1.5fr) auto; gap: 8px; align-items: center; margin: 9px 0; }",
      ".cl-bayes .cl-bayes-bar-label { color: var(--fg-soft); font-size: 12.5px; }",
      ".cl-bayes .cl-bayes-bar-track { display: flex; min-width: 0; min-height: 18px; overflow: hidden; border: 1px solid var(--border); border-radius: 999px; background: var(--block-bg); }",
      ".cl-bayes .cl-bayes-bar-true, .cl-bayes .cl-bayes-bar-false { min-width: 0; height: 18px; }",
      ".cl-bayes .cl-bayes-bar-true { background: var(--cl-green); }",
      ".cl-bayes .cl-bayes-bar-false { background: var(--cl-red); }",
      ".cl-bayes .cl-bayes-bar-value { color: var(--fg); font-variant-numeric: tabular-nums; white-space: nowrap; }",
      ".cl-bayes .cl-bayes-legend { margin-top: 7px; }",
      ".cl-bayes .cl-bayes-formula { margin-top: 12px; }",
      "@media (max-width: 700px) { .cl-bayes .cl-bayes-bar-row { grid-template-columns: minmax(0, 1fr) auto; } .cl-bayes .cl-bayes-bar-track { grid-column: 1 / -1; grid-row: 2; } .cl-bayes .cl-bayes-bar-value { grid-column: 2; grid-row: 1; } }"
    ].join("");
    document.head.appendChild(style);
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

  function flowWidth(count) {
    return clamp(2.5 + 24 * Math.sqrt(Math.max(0, count) / COHORT), 2.5, 28);
  }

  function drawBox(api, svg, box) {
    var group = makeSvg(api, "g", {
      "aria-label": box.title + "：" + box.lineOne + "；" + box.lineTwo
    });
    group.appendChild(
      makeSvg(api, "rect", {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        rx: 8,
        fill: "var(--bg)",
        stroke: box.color,
        "stroke-width": 2
      })
    );
    group.appendChild(
      svgText(api, box.x + box.width / 2, box.y + 29, box.title, {
        "font-size": "14",
        "font-weight": "700",
        fill: box.color
      })
    );
    group.appendChild(
      svgText(api, box.x + box.width / 2, box.y + 55, box.lineOne, {
        "font-size": "14",
        "font-weight": "700"
      })
    );
    group.appendChild(
      svgText(api, box.x + box.width / 2, box.y + 78, box.lineTwo, {
        "font-size": "12",
        fill: "var(--fg-soft)"
      })
    );
    svg.appendChild(group);
  }

  function drawFlow(api, svg, definition) {
    svg.appendChild(
      makeSvg(api, "path", {
        d: definition.path,
        fill: "none",
        stroke: definition.color,
        "stroke-width": flowWidth(definition.count),
        "stroke-linecap": "round",
        opacity: "0.72",
        "aria-label": definition.label
      })
    );
    svg.appendChild(
      svgText(api, definition.labelX, definition.labelY, definition.label, {
        "font-size": "12",
        "font-weight": "700",
        fill: definition.color
      })
    );
  }

  function drawDiagram(api, svg, ids, data) {
    clear(svg);
    var title = makeSvg(api, "title", { id: ids.svgTitle }, [
      "10,000 人的 Bayes 概率树"
    ]);
    var description = makeSvg(api, "desc", { id: ids.svgDesc }, [
      "固定队列从人口分到患病与健康，再分到阳性与阴性。当前患病率为 " +
        formatRate(data.pi * 100) +
        "，灵敏度为 " +
        formatRate(data.sensitivity * 100) +
        "，特异度为 " +
        formatRate(data.specificity * 100) +
        "。TP " +
        formatCount(data.tp) +
        "，FN " +
        formatCount(data.fn) +
        "，FP " +
        formatCount(data.fp) +
        "，TN " +
        formatCount(data.tn) +
        "；数字由公式确定，不使用随机抽样。"
    ]);
    svg.appendChild(title);
    svg.appendChild(description);

    var headings = [
      ["人口", 80],
      ["真实状态", 295],
      ["检测结果", 630]
    ];
    headings.forEach(function (heading) {
      svg.appendChild(
        svgText(api, heading[1], 22, heading[0], {
          "font-size": "13",
          "font-weight": "700",
          fill: "var(--fg-soft)"
        })
      );
    });
    svg.appendChild(
      svgText(api, 177, 205, "→", {
        "font-size": "19",
        fill: "var(--fg-soft)"
      })
    );
    svg.appendChild(
      svgText(api, 461, 205, "→", {
        "font-size": "19",
        fill: "var(--fg-soft)"
      })
    );

    drawFlow(api, svg, {
      path: "M 140 195 C 166 195 183 110 215 110",
      count: data.diseased,
      color: "var(--cl-red)",
      label: "D · " + formatCount(data.diseased),
      labelX: 174,
      labelY: 128
    });
    drawFlow(api, svg, {
      path: "M 140 195 C 166 195 183 310 215 310",
      count: data.healthy,
      color: "var(--cl-blue)",
      label: "¬D · " + formatCount(data.healthy),
      labelX: 174,
      labelY: 284
    });
    drawFlow(api, svg, {
      path: "M 375 100 C 430 100 475 100 535 100",
      count: data.tp,
      color: "var(--cl-green)",
      label: "TP · " + formatCount(data.tp),
      labelX: 450,
      labelY: 83
    });
    drawFlow(api, svg, {
      path: "M 375 135 C 430 185 475 270 535 310",
      count: data.fn,
      color: "var(--cl-gold)",
      label: "FN · " + formatCount(data.fn),
      labelX: 464,
      labelY: 247
    });
    drawFlow(api, svg, {
      path: "M 375 285 C 430 235 475 150 535 130",
      count: data.fp,
      color: "var(--cl-red)",
      label: "FP · " + formatCount(data.fp),
      labelX: 465,
      labelY: 180
    });
    drawFlow(api, svg, {
      path: "M 375 325 C 430 325 475 325 535 325",
      count: data.tn,
      color: "var(--cl-blue)",
      label: "TN · " + formatCount(data.tn),
      labelX: 454,
      labelY: 350
    });

    drawBox(api, svg, {
      x: 20,
      y: 145,
      width: 120,
      height: 100,
      color: "var(--cl-gold)",
      title: "总队列",
      lineOne: formatCount(COHORT) + " 人",
      lineTwo: "固定人群"
    });
    drawBox(api, svg, {
      x: 215,
      y: 60,
      width: 160,
      height: 100,
      color: "var(--cl-red)",
      title: "患病 D",
      lineOne: formatCount(data.diseased) + " 人",
      lineTwo: "π = " + formatProbability(data.pi)
    });
    drawBox(api, svg, {
      x: 215,
      y: 260,
      width: 160,
      height: 100,
      color: "var(--cl-blue)",
      title: "健康 ¬D",
      lineOne: formatCount(data.healthy) + " 人",
      lineTwo: "1 − π = " + formatProbability(1 - data.pi)
    });
    drawBox(api, svg, {
      x: 535,
      y: 60,
      width: 190,
      height: 100,
      color: "var(--cl-gold)",
      title: "阳性 +",
      lineOne: formatCount(data.positive) + " 人",
      lineTwo: "P(+) = " + formatProbability(data.positive / COHORT)
    });
    drawBox(api, svg, {
      x: 535,
      y: 260,
      width: 190,
      height: 100,
      color: "var(--cl-blue)",
      title: "阴性 −",
      lineOne: formatCount(data.negative) + " 人",
      lineTwo: "P(−) = " + formatProbability(data.negative / COHORT)
    });

    var legend = [
      ["var(--cl-green)", "TP 真阳性"],
      ["var(--cl-red)", "FP 假阳性"],
      ["var(--cl-gold)", "FN 假阴性"],
      ["var(--cl-blue)", "TN 真阴性"]
    ];
    legend.forEach(function (item, index) {
      var x = 24 + index * 181;
      svg.appendChild(
        makeSvg(api, "rect", {
          x: x,
          y: 390,
          width: 10,
          height: 10,
          rx: 2,
          fill: item[0]
        })
      );
      svg.appendChild(
        svgText(api, x + 17, 399, item[1], {
          "text-anchor": "start",
          "font-size": "10.5",
          fill: "var(--fg-soft)"
        })
      );
    });
  }

  function makeRange(api, ids, key, labelText, min, max, step, state, refs, note) {
    var output = makeElement(api, "output", { htmlFor: ids[key] }, [
      formatRate(state[key])
    ]);
    var label = makeElement(api, "label", { htmlFor: ids[key] }, [
      labelText + " = ",
      output
    ]);
    var input = makeElement(api, "input", {
      id: ids[key],
      type: "range",
      min: min,
      max: max,
      step: step,
      value: state[key],
      "aria-label": labelText
    });
    refs.inputs[key] = { input: input, output: output };
    var children = [label, input];
    if (note) {
      children.push(makeElement(api, "small", {}, [note]));
    }
    return makeElement(api, "div", { className: "cl-control cl-bayes-range" }, children);
  }

  function makeLedger(api, refs) {
    var table = makeElement(api, "table", {
      className: "cl-bayes-ledger",
      "aria-label": "真实状态与检测结果的四格计数"
    });
    table.appendChild(
      makeElement(api, "caption", {}, ["四格计数（固定队列的确定性更新）"])
    );
    var head = makeElement(api, "thead", {}, [
      makeElement(api, "tr", {}, [
        makeElement(api, "th", { scope: "col" }, ["真实状态"]),
        makeElement(api, "th", { scope: "col" }, ["阳性 +"]),
        makeElement(api, "th", { scope: "col" }, ["阴性 −"]),
        makeElement(api, "th", { scope: "col" }, ["合计"])
      ])
    ]);
    table.appendChild(head);

    function cell(key, className) {
      var node = makeElement(api, "td", { className: className || "" }, ["—"]);
      refs.counts[key] = node;
      return node;
    }

    var body = makeElement(api, "tbody");
    body.appendChild(
      makeElement(api, "tr", {}, [
        makeElement(api, "th", { scope: "row" }, ["患病 D"]),
        cell("tp", "cl-bayes-tp"),
        cell("fn", "cl-bayes-fn"),
        cell("diseased")
      ])
    );
    body.appendChild(
      makeElement(api, "tr", {}, [
        makeElement(api, "th", { scope: "row" }, ["健康 ¬D"]),
        cell("fp", "cl-bayes-fp"),
        cell("tn", "cl-bayes-tn"),
        cell("healthy")
      ])
    );
    body.appendChild(
      makeElement(api, "tr", {}, [
        makeElement(api, "th", { scope: "row" }, ["合计"]),
        cell("positive"),
        cell("negative"),
        cell("cohort")
      ])
    );
    table.appendChild(body);
    return table;
  }

  function makePosteriorRow(api, label, trueLabel, falseLabel) {
    var trueSegment = makeElement(api, "span", {
      className: "cl-bayes-bar-true",
      title: trueLabel
    });
    var falseSegment = makeElement(api, "span", {
      className: "cl-bayes-bar-false",
      title: falseLabel
    });
    var track = makeElement(api, "div", {
      className: "cl-bayes-bar-track",
      role: "img",
      "aria-label": label
    }, [trueSegment, falseSegment]);
    var value = makeElement(api, "strong", {
      className: "cl-bayes-bar-value"
    }, ["—"]);
    return {
      row: makeElement(api, "div", { className: "cl-bayes-bar-row" }, [
        makeElement(api, "span", { className: "cl-bayes-bar-label" }, [label]),
        track,
        value
      ]),
      track: track,
      trueSegment: trueSegment,
      falseSegment: falseSegment,
      value: value
    };
  }

  function updatePosteriorBar(bar, trueProbability, valueText, ariaText) {
    var truePercent = Number.isFinite(trueProbability)
      ? clamp(trueProbability * 100, 0, 100)
      : 0;
    bar.trueSegment.style.width = truePercent + "%";
    bar.falseSegment.style.width = (100 - truePercent) + "%";
    bar.value.textContent = valueText;
    bar.track.setAttribute("aria-label", ariaText);
  }

  function syncPresetButtons(refs, state) {
    Object.keys(refs.presets).forEach(function (key) {
      refs.presets[key].setAttribute(
        "aria-pressed",
        state.preset === key ? "true" : "false"
      );
    });
  }

  function updateReadouts(refs, state, data) {
    Object.keys(refs.inputs).forEach(function (key) {
      refs.inputs[key].output.textContent = formatRate(state[key]);
      refs.inputs[key].input.setAttribute("aria-valuetext", formatRate(state[key]));
    });

    refs.counts.tp.textContent = formatCount(data.tp);
    refs.counts.fn.textContent = formatCount(data.fn);
    refs.counts.fp.textContent = formatCount(data.fp);
    refs.counts.tn.textContent = formatCount(data.tn);
    refs.counts.diseased.textContent = formatCount(data.diseased);
    refs.counts.healthy.textContent = formatCount(data.healthy);
    refs.counts.positive.textContent = formatCount(data.positive);
    refs.counts.negative.textContent = formatCount(data.negative);
    refs.counts.cohort.textContent = formatCount(COHORT);

    refs.ppv.textContent = formatProbability(data.ppv);
    refs.npv.textContent = formatProbability(data.npv);
    refs.priorOdds.textContent = formatScalar(data.priorOdds);
    refs.lrPlus.textContent = formatScalar(data.lrPlus);
    refs.posteriorOdds.textContent = formatScalar(data.posteriorOdds);
    refs.contrast.textContent =
      "方向检查：P(+|D) = " +
      formatRate(data.sensitivity * 100) +
      "，而 P(D|+) = " +
      formatProbability(data.ppv) +
      "；两者通常不同。";
    refs.formula.textContent =
      "PPV = TP / (TP + FP) ≈ " +
      formatProbability(data.ppv) +
      "；赔率核对（显示值已四舍五入）：" +
      formatScalar(data.priorOdds) +
      " × " +
      formatScalar(data.lrPlus) +
      " ≈ " +
      formatScalar(data.posteriorOdds);
    refs.status.textContent =
      "当前队列：阳性 " +
      formatCount(data.positive) +
      " 人，其中真阳性 " +
      formatCount(data.tp) +
      " 人；后验 P(D|+) = " +
      formatProbability(data.ppv) +
      "。";

    updatePosteriorBar(
      refs.positiveBar,
      data.ppv,
      "PPV " + formatProbability(data.ppv),
      "阳性者构成：真阳性占 " +
        formatProbability(data.ppv) +
        "，假阳性占 " +
        formatProbability(1 - data.ppv)
    );
    updatePosteriorBar(
      refs.negativeBar,
      data.npv,
      "NPV " + formatProbability(data.npv),
      "阴性者构成：真阴性占 " +
        formatProbability(data.npv) +
        "，假阴性占 " +
        formatProbability(1 - data.npv)
    );
  }

  window.CourseLearning.register("bayes", function (root, api) {
    if (!root || typeof document === "undefined") {
      return;
    }

    injectStyles();
    serial += 1;
    var prefix = "cl-bayes-" + serial;
    var ids = {
      controls: prefix + "-controls",
      svg: prefix + "-svg",
      svgTitle: prefix + "-svg-title",
      svgDesc: prefix + "-svg-desc",
      prevalence: prefix + "-prevalence",
      sensitivity: prefix + "-sensitivity",
      specificity: prefix + "-specificity",
      stage: prefix + "-stage"
    };
    var state = {
      prevalence: PRESETS.baseline.prevalence,
      sensitivity: PRESETS.baseline.sensitivity,
      specificity: PRESETS.baseline.specificity,
      preset: "baseline"
    };
    var refs = {
      inputs: {},
      presets: {},
      counts: {}
    };

    var heading = makeElement(api, "h3", {}, [
      "确定性 Bayes 更新器：看见阳性之后再数一遍"
    ]);
    var intro = makeElement(api, "p", { className: "cl-note" }, [
      "固定 10,000 人，不抽样、不掷骰子；调参数只会让同一组公式重新计算。先看左侧的真实状态分流，再比较阳性条里的 TP 与 FP。"
    ]);

    var presetFieldset = makeElement(api, "fieldset", {}, [
      makeElement(api, "legend", {}, ["教学预设"])
    ]);
    var presetGroup = makeElement(api, "div", {
      className: "cl-button-row cl-bayes-presets",
      role: "group",
      "aria-label": "Bayes 参数预设"
    });
    Object.keys(PRESETS).forEach(function (key) {
      var button = makeElement(api, "button", {
        type: "button",
        "aria-pressed": key === state.preset ? "true" : "false"
      }, [PRESETS[key].label]);
      button.addEventListener("click", function () {
        var preset = PRESETS[key];
        state.prevalence = preset.prevalence;
        state.sensitivity = preset.sensitivity;
        state.specificity = preset.specificity;
        state.preset = key;
        refs.inputs.prevalence.input.value = preset.prevalence;
        refs.inputs.sensitivity.input.value = preset.sensitivity;
        refs.inputs.specificity.input.value = preset.specificity;
        syncPresetButtons(refs, state);
        render();
        if (api && typeof api.announce === "function") {
          api.announce(apiRoot, "已切换预设：" + preset.label + "。");
        }
      });
      refs.presets[key] = button;
      presetGroup.appendChild(button);
    });
    presetFieldset.appendChild(presetGroup);

    var controls = makeElement(api, "section", {
      className: "cl-controls",
      "aria-labelledby": ids.controls
    }, [
      makeElement(api, "h4", { id: ids.controls }, [
        "调整先验与检测特性"
      ]),
      presetFieldset
    ]);

    var rangeParts = [
      makeRange(
        api,
        ids,
        "prevalence",
        "患病率 π",
        0.1,
        20,
        0.1,
        state,
        refs,
        "范围 0.1%–20%；它决定先验中有多少人进入 D。"
      ),
      makeRange(
        api,
        ids,
        "sensitivity",
        "灵敏度 s",
        80,
        100,
        0.1,
        state,
        refs,
        "s = P(+|D)：患病者中测得阳性的比例。"
      ),
      makeRange(
        api,
        ids,
        "specificity",
        "特异度 c",
        80,
        100,
        0.1,
        state,
        refs,
        "c = P(−|¬D)；假阳性率是 1 − c。"
      )
    ];
    rangeParts.forEach(function (part) {
      controls.appendChild(part);
    });
    controls.appendChild(
      makeElement(api, "p", { className: "cl-note" }, [
        "提示：先点击预设形成对照，再拖动一个参数；按钮会取消选中，表示当前是自定义组合。"
      ])
    );

    var svg = makeSvg(api, "svg", {
      className: "cl-plot cl-bayes-svg",
      viewBox: "0 0 760 420",
      role: "img",
      id: ids.svg,
      "aria-labelledby": ids.svgTitle + " " + ids.svgDesc,
      "aria-label": "人口到真实状态再到检测结果的 Bayes 概率树"
    });

    var stage = makeElement(api, "section", {
      className: "cl-stage",
      "aria-labelledby": ids.stage
    }, [
      makeElement(api, "div", { className: "cl-stage-frame" }, [
        makeElement(api, "div", { className: "cl-stage-title" }, [
          makeElement(api, "strong", { id: ids.stage }, [
            "人口 → 真实状态 → 检测结果"
          ]),
          makeElement(api, "span", {}, ["线宽示意，计数精确"])
        ]),
        svg
      ])
    ]);

    var ledger = makeLedger(api, refs);
    var positiveBar = makePosteriorRow(
      api,
      "阳性者：D / ¬D",
      "TP 真阳性",
      "FP 假阳性"
    );
    var negativeBar = makePosteriorRow(
      api,
      "阴性者：¬D / D",
      "TN 真阴性",
      "FN 假阴性"
    );
    refs.positiveBar = positiveBar;
    refs.negativeBar = negativeBar;
    refs.ppv = makeElement(api, "strong", {}, ["—"]);
    refs.npv = makeElement(api, "strong", {}, ["—"]);
    refs.priorOdds = makeElement(api, "strong", {}, ["—"]);
    refs.lrPlus = makeElement(api, "strong", {}, ["—"]);
    refs.posteriorOdds = makeElement(api, "strong", {}, ["—"]);
    refs.contrast = makeElement(api, "p", { className: "cl-note" }, []);
    refs.formula = makeElement(api, "p", {
      className: "cl-formula cl-bayes-formula"
    }, []);
    refs.status = makeElement(api, "p", {
      className: "cl-note",
      role: "status",
      "aria-live": "polite"
    }, []);

    var readouts = makeElement(api, "dl", { className: "cl-metrics" }, [
      makeElement(api, "div", { className: "cl-metric" }, [
        makeElement(api, "dt", {}, ["PPV = P(D|+)"]),
        refs.ppv
      ]),
      makeElement(api, "div", { className: "cl-metric" }, [
        makeElement(api, "dt", {}, ["NPV = P(¬D|−)"]),
        refs.npv
      ]),
      makeElement(api, "div", { className: "cl-metric" }, [
        makeElement(api, "dt", {}, ["先验赔率"]),
        refs.priorOdds
      ]),
      makeElement(api, "div", { className: "cl-metric" }, [
        makeElement(api, "dt", {}, ["LR+"]),
        refs.lrPlus
      ]),
      makeElement(api, "div", { className: "cl-metric" }, [
        makeElement(api, "dt", {}, ["后验赔率"]),
        refs.posteriorOdds
      ])
    ]);

    var posterior = makeElement(api, "section", {
      className: "cl-bayes-posterior",
      "aria-labelledby": prefix + "-posterior-title"
    }, [
      makeElement(api, "h4", { id: prefix + "-posterior-title" }, [
        "Posterior 条：观察到结果后，队伍如何重新分层"
      ]),
      positiveBar.row,
      negativeBar.row,
      makeElement(api, "p", { className: "cl-note cl-bayes-legend" }, [
        "绿色为真正的目标状态（TP 或 TN），红色为错误分支（FP 或 FN）。"
      ])
    ]);

    stage.appendChild(ledger);
    stage.appendChild(posterior);
    stage.appendChild(readouts);
    stage.appendChild(refs.contrast);
    stage.appendChild(refs.formula);
    stage.appendChild(refs.status);

    var apiRoot = makeElement(api, "div", {
      className: "cl-grid cl-bayes-grid"
    }, [controls, stage]);

    function render() {
      var data = calculate(state);
      drawDiagram(api, svg, {
        svgTitle: ids.svgTitle,
        svgDesc: ids.svgDesc
      }, data);
      updateReadouts(refs, state, data);
    }

    Object.keys(refs.inputs).forEach(function (key) {
      refs.inputs[key].input.addEventListener("input", function () {
        state[key] = Number(refs.inputs[key].input.value);
        state.preset = "";
        syncPresetButtons(refs, state);
        render();
      });
    });

    root.replaceChildren(heading, intro, apiRoot);
    render();
  });
})();

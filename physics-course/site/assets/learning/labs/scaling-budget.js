(function () {
  "use strict";

  if (
    !window.CourseLearning ||
    typeof window.CourseLearning.register !== "function"
  ) {
    return;
  }

  var STYLE_ID = "cl-scaling-budget-styles";
  var INSTANCE_COUNT = 0;
  var LOG_R_MIN = -2;
  var LOG_R_MAX = 4;
  var CURVE_POINTS = 181;
  var MODEL = {
    E: 1.69,
    A: 406.4,
    B: 410.7,
    alpha: 0.34,
    beta: 0.28
  };

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function log10(value) {
    return Math.log(value) / Math.LN10;
  }

  function formatNumber(value, digits, api) {
    if (!finite(value)) return "—";
    if (api && typeof api.format === "function") {
      return api.format(value, digits);
    }
    return value.toFixed(typeof digits === "number" ? digits : 3);
  }

  function formatScientific(value) {
    if (!finite(value)) return "—";
    var magnitude = Math.abs(value);
    if (magnitude === 0) return "0";
    if (magnitude >= 1000 || magnitude < 0.01) {
      var exponent = Math.floor(log10(magnitude));
      var mantissa = value / Math.pow(10, exponent);
      return mantissa.toFixed(2) + "e" + (exponent >= 0 ? "+" : "") + exponent;
    }
    return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  }

  function formatLoss(value) {
    if (!finite(value)) return "—";
    return value.toFixed(5).replace(/0+$/, "").replace(/\.$/, "");
  }

  function formatRatio(value) {
    if (!finite(value)) return "—";
    if (Math.abs(value) >= 1000 || (Math.abs(value) > 0 && Math.abs(value) < 0.01)) {
      return formatScientific(value);
    }
    return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  }

  function formatLog(value) {
    return (value >= 0 ? "+" : "") + value.toFixed(2);
  }

  function formatCompute(logCompute) {
    return "10^" + logCompute.toFixed(2);
  }

  function lossFromLogs(logN, logD) {
    var parameterTerm = MODEL.A * Math.exp(-MODEL.alpha * logN);
    var dataTerm = MODEL.B * Math.exp(-MODEL.beta * logD);
    return {
      parameterTerm: parameterTerm,
      dataTerm: dataTerm,
      loss: MODEL.E + parameterTerm + dataTerm
    };
  }

  function allocationFromLogRatio(compute, logRatio10) {
    var logCompute = Math.log(compute);
    var logRatio = logRatio10 * Math.LN10;
    var logN = 0.5 * (logCompute - Math.log(6) - logRatio);
    var logD = logRatio + logN;
    var terms = lossFromLogs(logN, logD);
    return {
      compute: compute,
      logCompute: logCompute / Math.LN10,
      logRatio: logRatio10,
      ratio: Math.exp(logRatio),
      logN: logN,
      logD: logD,
      parameters: Math.exp(logN),
      data: Math.exp(logD),
      parameterTerm: terms.parameterTerm,
      dataTerm: terms.dataTerm,
      loss: terms.loss
    };
  }

  function optimumForCompute(compute) {
    var logCompute = Math.log(compute);
    var logN =
      (
        Math.log((MODEL.alpha * MODEL.A) / (MODEL.beta * MODEL.B)) +
        MODEL.beta * (logCompute - Math.log(6))
      ) /
      (MODEL.alpha + MODEL.beta);
    var logD = logCompute - Math.log(6) - logN;
    var logRatio10 = (logD - logN) / Math.LN10;
    var result = allocationFromLogRatio(compute, logRatio10);
    result.logN = logN;
    result.logD = logD;
    result.parameters = Math.exp(logN);
    result.data = Math.exp(logD);
    result.ratio = Math.exp(logD - logN);
    result.logRatio = logRatio10;
    return result;
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".cl-scaling-budget { --cl-sb-param: #a8563c; --cl-sb-data: #356f9b; --cl-sb-opt: #39734d; --cl-sb-current: #9b6a12; margin: 1.5rem 0 2rem; color: var(--fg); }",
      "html[data-theme=\"dark\"] .cl-scaling-budget { --cl-sb-param: #f09a82; --cl-sb-data: #82bde8; --cl-sb-opt: #79c798; --cl-sb-current: #e3bd6d; }",
      ".cl-scaling-budget * { box-sizing: border-box; }",
      ".cl-scaling-budget .cl-sb-shell { overflow: hidden; border: 1px solid var(--border); border-radius: 8px; background: var(--bg); }",
      ".cl-scaling-budget .cl-sb-header { padding: 1.1rem 1.25rem .95rem; border-bottom: 1px solid var(--border); background: var(--block-bg); }",
      ".cl-scaling-budget .cl-sb-kicker { margin: 0 0 .25rem; color: var(--accent); font-size: .75rem; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }",
      ".cl-scaling-budget .cl-sb-header h3 { margin: 0; color: var(--fg); font-size: 1.2rem; }",
      ".cl-scaling-budget .cl-sb-header p { margin: .4rem 0 0; color: var(--fg-soft); }",
      ".cl-scaling-budget .cl-sb-controls { display: grid; grid-template-columns: minmax(250px, 1fr) minmax(250px, 1fr); gap: .85rem; padding: .9rem 1.1rem; border-bottom: 1px solid var(--border); background: var(--block-bg); }",
      ".cl-scaling-budget .cl-sb-fieldset { min-width: 0; margin: 0; padding: .7rem .75rem .8rem; border: 1px solid var(--border); border-radius: 6px; }",
      ".cl-scaling-budget .cl-sb-fieldset legend { padding: 0 .25rem; color: var(--fg-soft); font-size: .78rem; font-weight: 750; }",
      ".cl-scaling-budget .cl-sb-control-head { display: flex; align-items: baseline; justify-content: space-between; gap: .75rem; color: var(--fg-soft); font-size: .84rem; }",
      ".cl-scaling-budget .cl-sb-control-head output { color: var(--accent); font-weight: 750; font-variant-numeric: tabular-nums; text-align: right; }",
      ".cl-scaling-budget input[type=\"range\"] { display: block; width: 100%; min-height: 44px; margin: .25rem 0 0; accent-color: var(--accent); }",
      ".cl-scaling-budget .cl-sb-scale { display: flex; justify-content: space-between; color: var(--fg-soft); font-size: .72rem; font-variant-numeric: tabular-nums; }",
      ".cl-scaling-budget .cl-sb-presets { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .75rem; }",
      ".cl-scaling-budget button { min-height: 44px; padding: .5rem .75rem; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--fg); cursor: pointer; font: inherit; font-size: .84rem; font-weight: 700; }",
      ".cl-scaling-budget button:hover { border-color: var(--accent); }",
      ".cl-scaling-budget button[aria-pressed=\"true\"] { border-color: var(--accent); background: var(--accent); color: var(--bg); }",
      ".cl-scaling-budget button:focus-visible, .cl-scaling-budget input:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
      ".cl-scaling-budget .cl-sb-body { padding: 1rem 1.1rem 1.1rem; }",
      ".cl-scaling-budget .cl-sb-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1rem; align-items: start; }",
      ".cl-scaling-budget .cl-sb-chart-card, .cl-scaling-budget .cl-sb-readout { min-width: 0; padding: .85rem; border: 1px solid var(--border); border-radius: 6px; background: var(--block-bg); }",
      ".cl-scaling-budget .cl-sb-card-title { display: flex; justify-content: space-between; gap: .75rem; margin: 0 0 .55rem; color: var(--fg-soft); font-size: .82rem; font-weight: 750; }",
      ".cl-scaling-budget .cl-sb-chart-scroll { max-width: 100%; overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch; border: 1px solid var(--border); border-radius: 5px; background: var(--bg); }",
      ".cl-scaling-budget .cl-sb-chart { display: block; width: 100%; min-width: 600px; height: auto; padding: .25rem; color: var(--fg); }",
      ".cl-scaling-budget .cl-sb-chart text { fill: currentColor; font-family: inherit; }",
      ".cl-scaling-budget .cl-sb-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .55rem; }",
      ".cl-scaling-budget .cl-sb-metric { min-width: 0; padding: .6rem .65rem; border-top: 2px solid var(--border); background: var(--bg); }",
      ".cl-scaling-budget .cl-sb-metric span { display: block; color: var(--fg-soft); font-size: .72rem; line-height: 1.4; }",
      ".cl-scaling-budget .cl-sb-metric strong { display: block; margin-top: .18rem; overflow-wrap: anywhere; color: var(--fg); font-size: .98rem; font-variant-numeric: tabular-nums; }",
      ".cl-scaling-budget .cl-sb-metric[data-kind=\"param\"] { border-top-color: var(--cl-sb-param); }",
      ".cl-scaling-budget .cl-sb-metric[data-kind=\"data\"] { border-top-color: var(--cl-sb-data); }",
      ".cl-scaling-budget .cl-sb-metric[data-kind=\"optimal\"] { border-top-color: var(--cl-sb-opt); }",
      ".cl-scaling-budget .cl-sb-metric[data-kind=\"current\"] { border-top-color: var(--cl-sb-current); }",
      ".cl-scaling-budget .cl-sb-note { margin: .75rem 0 0; color: var(--fg-soft); font-size: .78rem; line-height: 1.55; }",
      ".cl-scaling-budget .cl-sb-legend { display: flex; flex-wrap: wrap; gap: .65rem 1rem; margin: .6rem 0 0; color: var(--fg-soft); font-size: .76rem; }",
      ".cl-scaling-budget .cl-sb-key { display: inline-flex; align-items: center; gap: .35rem; }",
      ".cl-scaling-budget .cl-sb-swatch { display: inline-block; width: .8rem; height: .2rem; border-radius: 99px; background: var(--cl-sb-curve); }",
      ".cl-scaling-budget .cl-sb-swatch[data-kind=\"current\"] { width: .65rem; height: .65rem; border-radius: 50%; background: var(--cl-sb-current); }",
      ".cl-scaling-budget .cl-sb-swatch[data-kind=\"optimal\"] { width: .65rem; height: .65rem; border-radius: 50%; background: var(--cl-sb-opt); }",
      ".cl-scaling-budget .cl-sb-equation { margin: .75rem 0 0; padding: .6rem .7rem; border-left: 3px solid var(--accent); background: var(--bg); color: var(--fg); font-family: \"SF Mono\", Menlo, Consolas, monospace; font-size: .78rem; line-height: 1.55; overflow-x: auto; }",
      "@media (max-width: 820px) { .cl-scaling-budget .cl-sb-controls, .cl-scaling-budget .cl-sb-grid { grid-template-columns: 1fr; } .cl-scaling-budget .cl-sb-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } }",
      "@media (max-width: 560px) { .cl-scaling-budget .cl-sb-controls, .cl-scaling-budget .cl-sb-body { padding: .75rem; } .cl-scaling-budget .cl-sb-header { padding: .9rem; } .cl-scaling-budget .cl-sb-metrics { grid-template-columns: 1fr 1fr; } }"
    ].join("\n");
    (document.head || document.documentElement).appendChild(style);
  }

  function metric(label, kind, instance) {
    var value = instance.api.el("strong", { text: "—" });
    var card = instance.api.el(
      "div",
      { className: "cl-sb-metric", "data-kind": kind },
      [instance.api.el("span", { text: label }), value]
    );
    return { card: card, value: value };
  }

  function svgText(api, x, y, text, attrs) {
    var values = Object.assign(
      { x: x, y: y, "font-size": 12, "aria-hidden": "true" },
      attrs || {}
    );
    return api.svg("text", values, [text]);
  }

  function buildChart(current, optimum, api, chartId) {
    var width = 800;
    var height = 370;
    var left = 68;
    var right = 20;
    var top = 24;
    var bottom = 54;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var curve = [];
    var minimum = Infinity;
    var maximum = -Infinity;
    var index;

    for (index = 0; index < CURVE_POINTS; index += 1) {
      var ratioPosition = index / (CURVE_POINTS - 1);
      var logRatio = LOG_R_MIN + (LOG_R_MAX - LOG_R_MIN) * ratioPosition;
      var point = allocationFromLogRatio(current.compute, logRatio);
      curve.push(point);
      minimum = Math.min(minimum, point.loss);
      maximum = Math.max(maximum, point.loss);
    }
    minimum = Math.min(minimum, current.loss, optimum.loss);
    maximum = Math.max(maximum, current.loss, optimum.loss);
    var span = Math.max(maximum - minimum, 0.0001);
    var yMin = minimum - span * 0.12;
    var yMax = maximum + span * 0.12;

    function xScale(logRatio) {
      return left + ((logRatio - LOG_R_MIN) / (LOG_R_MAX - LOG_R_MIN)) * plotWidth;
    }

    function yScale(loss) {
      return top + ((yMax - loss) / (yMax - yMin)) * plotHeight;
    }

    var titleId = chartId + "-title";
    var descId = chartId + "-desc";
    var svg = api.svg("svg", {
      className: "cl-sb-chart",
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      "aria-labelledby": titleId + " " + descId,
      preserveAspectRatio: "xMinYMin meet"
    });
    svg.appendChild(api.svg("title", { id: titleId }, ["固定算力下的损失与数据/参数配比"]));
    svg.appendChild(
      api.svg("desc", { id: descId }, [
        "横轴为 log10(D/N)，曲线为模型预测损失；当前配比与解析最优配比分别用两个点标记。"
      ])
    );
    svg.appendChild(
      api.svg("rect", {
        x: 0,
        y: 0,
        width: width,
        height: height,
        rx: 4,
        fill: "var(--bg)",
        stroke: "var(--border)"
      })
    );

    var grid = api.svg("g", { "aria-hidden": "true" });
    for (index = 0; index <= 5; index += 1) {
      var yValue = yMin + ((yMax - yMin) * index) / 5;
      var y = yScale(yValue);
      grid.appendChild(
        api.svg("line", {
          x1: left,
          y1: y,
          x2: width - right,
          y2: y,
          stroke: "var(--border)",
          "stroke-opacity": "0.75",
          "stroke-dasharray": "3 5"
        })
      );
      grid.appendChild(
        svgText(api, left - 9, y + 4, formatLoss(yValue), {
          "text-anchor": "end",
          "font-size": 11,
          fill: "var(--fg-soft)"
        })
      );
    }
    for (index = 0; index <= 6; index += 1) {
      var xValue = LOG_R_MIN + ((LOG_R_MAX - LOG_R_MIN) * index) / 6;
      var x = xScale(xValue);
      grid.appendChild(
        api.svg("line", {
          x1: x,
          y1: top,
          x2: x,
          y2: height - bottom,
          stroke: "var(--border)",
          "stroke-opacity": "0.55",
          "stroke-dasharray": "3 5"
        })
      );
      grid.appendChild(
        svgText(api, x, height - bottom + 20, formatLog(xValue), {
          "text-anchor": "middle",
          "font-size": 11,
          fill: "var(--fg-soft)"
        })
      );
    }
    svg.appendChild(grid);
    svg.appendChild(
      api.svg("line", {
        x1: left,
        y1: height - bottom,
        x2: width - right,
        y2: height - bottom,
        stroke: "currentColor",
        "stroke-width": 1.2
      })
    );
    svg.appendChild(
      api.svg("line", {
        x1: left,
        y1: top,
        x2: left,
        y2: height - bottom,
        stroke: "currentColor",
        "stroke-width": 1.2
      })
    );
    svg.appendChild(
      svgText(api, left + plotWidth / 2, height - 12, "log10 r，其中 r = D/N", {
        "text-anchor": "middle",
        "font-size": 12,
        fill: "var(--fg-soft)"
      })
    );
    svg.appendChild(
      svgText(api, 17, top + plotHeight / 2, "预测损失 L", {
        transform: "rotate(-90 17 " + (top + plotHeight / 2) + ")",
        "text-anchor": "middle",
        "font-size": 12,
        fill: "var(--fg-soft)"
      })
    );

    var pathData = "";
    curve.forEach(function (point, curveIndex) {
      var pointX = xScale(point.logRatio);
      var pointY = yScale(point.loss);
      pathData += (curveIndex === 0 ? "M" : "L") + pointX.toFixed(2) + " " + pointY.toFixed(2) + " ";
    });
    svg.appendChild(
      api.svg("path", {
        d: pathData.trim(),
        fill: "none",
        stroke: "var(--accent)",
        "stroke-width": 3,
        "stroke-linejoin": "round",
        "stroke-linecap": "round",
        "aria-label": "固定算力下的预测损失曲线"
      })
    );

    function marker(point, color, label, labelOffset, ariaLabel) {
      var pointX = xScale(point.logRatio);
      var pointY = yScale(point.loss);
      var group = api.svg("g", {
        role: "img",
        "aria-label": ariaLabel
      });
      group.appendChild(
        api.svg("line", {
          x1: pointX,
          y1: top,
          x2: pointX,
          y2: height - bottom,
          stroke: color,
          "stroke-width": 1.4,
          "stroke-dasharray": "5 5",
          "stroke-opacity": "0.8"
        })
      );
      group.appendChild(
        api.svg("circle", {
          cx: pointX,
          cy: pointY,
          r: 6,
          fill: "var(--bg)",
          stroke: color,
          "stroke-width": 3
        })
      );
      group.appendChild(
        svgText(api, pointX + labelOffset, Math.max(top + 15, pointY - 12), label, {
          "font-size": 12,
          "font-weight": 750,
          fill: color
        })
      );
      return group;
    }

    if (Math.abs(current.logRatio - optimum.logRatio) < 0.005) {
      svg.appendChild(
        marker(
          optimum,
          "var(--cl-sb-opt)",
          "当前 = 最优",
          10,
          "当前配比与解析最优重合，log10 r=" + formatLog(optimum.logRatio) + "，预测损失 " + formatLoss(optimum.loss)
        )
      );
    } else {
      svg.appendChild(
        marker(
          current,
          "var(--cl-sb-current)",
          "当前",
          current.logRatio > optimum.logRatio ? -42 : 10,
          "当前配比，log10 r=" + formatLog(current.logRatio) + "，预测损失 " + formatLoss(current.loss)
        )
      );
      svg.appendChild(
        marker(
          optimum,
          "var(--cl-sb-opt)",
          "最优",
          optimum.logRatio > current.logRatio ? -42 : 10,
          "解析最优配比，log10 r=" + formatLog(optimum.logRatio) + "，预测损失 " + formatLoss(optimum.loss)
        )
      );
    }
    return svg;
  }

  function buildLab(root, api) {
    installStyles();
    INSTANCE_COUNT += 1;
    var instanceId = "cl-sb-" + INSTANCE_COUNT;
    var initialCompute = Math.pow(10, 21);
    var initialOptimum = optimumForCompute(initialCompute);
    var instance = { api: api };
    var state = {
      logCompute: 21,
      logRatio: initialOptimum.logRatio,
      preset: "optimal"
    };

    root.classList.add("cl-scaling-budget");

    var computeRange = api.el("input", {
      type: "range",
      id: instanceId + "-compute",
      min: "18",
      max: "24",
      step: "0.01",
      value: state.logCompute,
      "aria-label": "log10 算力预算 C"
    });
    var ratioRange = api.el("input", {
      type: "range",
      id: instanceId + "-ratio",
      min: String(LOG_R_MIN),
      max: String(LOG_R_MAX),
      step: "0.01",
      value: state.logRatio,
      "aria-label": "log10 数据与参数比 r"
    });
    var computeOutput = api.el("output", {
      htmlFor: computeRange.id,
      "aria-live": "polite",
      text: "—"
    });
    var ratioOutput = api.el("output", {
      htmlFor: ratioRange.id,
      "aria-live": "polite",
      text: "—"
    });

    function controlField(legend, label, range, output, minimum, maximum) {
      return api.el("fieldset", { className: "cl-sb-fieldset" }, [
        api.el("legend", { text: legend }),
        api.el("div", { className: "cl-sb-control-head" }, [
          api.el("span", { text: label }),
          output
        ]),
        range,
        api.el("div", { className: "cl-sb-scale" }, [
          api.el("span", { text: minimum }),
          api.el("span", { text: maximum })
        ])
      ]);
    }

    var presetButtons = [];
    var presetDefinitions = [
      { key: "parameter", label: "参数偏重", ratio: 0.2 },
      { key: "optimal", label: "计算最优", ratio: null },
      { key: "data", label: "数据偏重", ratio: 500 }
    ];
    var presetGroup = api.el("div", {
      className: "cl-sb-presets",
      role: "group",
      "aria-label": "配比预设"
    });
    presetDefinitions.forEach(function (definition) {
      var button = api.el("button", {
        type: "button",
        text: definition.label,
        "aria-pressed": definition.key === state.preset ? "true" : "false",
        "data-preset": definition.key,
        onclick: function () {
          state.preset = definition.key;
          if (definition.key === "optimal") {
            state.logRatio = optimumForCompute(Math.pow(10, state.logCompute)).logRatio;
          } else {
            state.logRatio = log10(definition.ratio);
          }
          ratioRange.value = state.logRatio;
          render();
          api.announce(root, "已切换到" + definition.label + "预设。");
        }
      });
      presetButtons.push(button);
      presetGroup.appendChild(button);
    });

    var controls = api.el("div", { className: "cl-sb-controls" }, [
      controlField("算力预算", "log10 C（FLOPs）", computeRange, computeOutput, "18", "24"),
      api.el("fieldset", { className: "cl-sb-fieldset" }, [
        api.el("legend", { text: "资源配比" }),
        api.el("div", { className: "cl-sb-control-head" }, [
          api.el("span", { text: "log10 r，其中 r=D/N" }),
          ratioOutput
        ]),
        ratioRange,
        api.el("div", { className: "cl-sb-scale" }, [
          api.el("span", { text: "r=0.01（参数偏重）" }),
          api.el("span", { text: "r=10,000（数据偏重）" })
        ]),
        presetGroup
      ])
    ]);

    var header = api.el("header", { className: "cl-sb-header" }, [
      api.el("p", { className: "cl-sb-kicker", text: "empirical fit · compute allocation" }),
      api.el("h3", { text: "固定算力：参数与数据如何分账？" }),
      api.el("p", {
        text: "拖动 log10 C 与 log10 r，查看历史损失面下的当前点、解析最优点和两者差距。"
      })
    ]);

    var chartHost = api.el("div", { "data-cl-sb-chart": true });
    var legend = api.el("div", { className: "cl-sb-legend", "aria-label": "图例" }, [
      api.el("span", { className: "cl-sb-key" }, [
        api.el("i", { className: "cl-sb-swatch", style: "--cl-sb-curve: var(--accent)" }),
        api.el("span", { text: "损失曲线" })
      ]),
      api.el("span", { className: "cl-sb-key" }, [
        api.el("i", { className: "cl-sb-swatch", "data-kind": "current" }),
        api.el("span", { text: "当前配比" })
      ]),
      api.el("span", { className: "cl-sb-key" }, [
        api.el("i", { className: "cl-sb-swatch", "data-kind": "optimal" }),
        api.el("span", { text: "解析最优" })
      ])
    ]);
    var chartScroll = api.el("div", { className: "cl-sb-chart-scroll" }, [chartHost]);
    var chartCard = api.el("section", { className: "cl-sb-chart-card" }, [
      api.el("p", { className: "cl-sb-card-title", text: "固定算力下的损失—配比曲线" }),
      chartScroll,
      legend
    ]);

    var metricRefs = {
      currentN: metric("当前 N", "current", instance),
      currentD: metric("当前 D", "current", instance),
      currentR: metric("当前 r=D/N", "current", instance),
      parameterTerm: metric("参数项 A/N^α", "param", instance),
      dataTerm: metric("数据项 B/D^β", "data", instance),
      currentLoss: metric("当前总损失 L", "current", instance),
      optimumN: metric("最优 N*", "optimal", instance),
      optimumD: metric("最优 D*", "optimal", instance),
      optimumR: metric("最优 r*", "optimal", instance),
      optimumLoss: metric("最优损失 L*", "optimal", instance),
      relativeExtra: metric("相对最优额外损失", "data", instance)
    };
    var readout = api.el("section", { className: "cl-sb-readout" }, [
      api.el("p", { className: "cl-sb-card-title", text: "计算结果" }),
      api.el("div", { className: "cl-sb-metrics" }, [
        metricRefs.currentN.card,
        metricRefs.currentD.card,
        metricRefs.currentR.card,
        metricRefs.parameterTerm.card,
        metricRefs.dataTerm.card,
        metricRefs.currentLoss.card,
        metricRefs.optimumN.card,
        metricRefs.optimumD.card,
        metricRefs.optimumR.card,
        metricRefs.optimumLoss.card,
        metricRefs.relativeExtra.card
      ]),
      api.el("div", {
        className: "cl-sb-equation",
        "data-cl-sb-equation": true,
        "aria-live": "polite"
      }),
      api.el("p", {
        className: "cl-sb-note",
        text: "相对最优额外损失 = (L−L*)/L*；E 只作为拟合渐近项计入总损失，不是英文熵。"
      })
    ]);

    var body = api.el("div", { className: "cl-sb-body" }, [
      api.el("div", { className: "cl-sb-grid" }, [chartCard, readout])
    ]);
    root.replaceChildren(
      api.el("div", { className: "cl-sb-shell" }, [header, controls, body])
    );

    var equation = root.querySelector("[data-cl-sb-equation]");

    function revealCurrentRatio(logRatio) {
      window.requestAnimationFrame(function () {
        var visibleWidth = chartScroll.clientWidth;
        var totalWidth = chartScroll.scrollWidth;
        if (totalWidth <= visibleWidth) return;
        var plotPosition =
          68 + ((clamp(logRatio, LOG_R_MIN, LOG_R_MAX) - LOG_R_MIN) /
            (LOG_R_MAX - LOG_R_MIN)) * (800 - 68 - 20);
        var target = (plotPosition / 800) * totalWidth;
        var guard = 44;
        var visibleLeft = chartScroll.scrollLeft;
        var visibleRight = visibleLeft + visibleWidth;
        if (target < visibleLeft + guard || target > visibleRight - guard) {
          chartScroll.scrollLeft = clamp(
            target - visibleWidth / 2,
            0,
            totalWidth - visibleWidth
          );
        }
      });
    }

    function render() {
      var compute = Math.pow(10, state.logCompute);
      var current = allocationFromLogRatio(compute, Number(state.logRatio));
      var optimum = optimumForCompute(compute);
      var relativeExtra = ((current.loss - optimum.loss) / optimum.loss) * 100;
      computeOutput.textContent = formatCompute(state.logCompute) + " FLOPs";
      ratioOutput.textContent =
        "log10 r=" + formatLog(Number(state.logRatio)) + "，r=" + formatRatio(current.ratio);
      computeRange.setAttribute("aria-valuetext", computeOutput.textContent);
      ratioRange.setAttribute("aria-valuetext", ratioOutput.textContent);
      presetButtons.forEach(function (button) {
        button.setAttribute(
          "aria-pressed",
          button.getAttribute("data-preset") === state.preset ? "true" : "false"
        );
      });

      metricRefs.currentN.value.textContent = formatScientific(current.parameters);
      metricRefs.currentD.value.textContent = formatScientific(current.data);
      metricRefs.currentR.value.textContent = formatRatio(current.ratio);
      metricRefs.parameterTerm.value.textContent = formatLoss(current.parameterTerm);
      metricRefs.dataTerm.value.textContent = formatLoss(current.dataTerm);
      metricRefs.currentLoss.value.textContent = formatLoss(current.loss);
      metricRefs.optimumN.value.textContent = formatScientific(optimum.parameters);
      metricRefs.optimumD.value.textContent = formatScientific(optimum.data);
      metricRefs.optimumR.value.textContent = formatRatio(optimum.ratio);
      metricRefs.optimumLoss.value.textContent = formatLoss(optimum.loss);
      metricRefs.relativeExtra.value.textContent =
        (relativeExtra < 0.005 ? "0" : relativeExtra.toFixed(2)) + "%";
      equation.textContent =
        "N=√(C/(6r))=" +
        formatScientific(current.parameters) +
        "，D=rN=" +
        formatScientific(current.data) +
        "；L=E+" +
        formatLoss(current.parameterTerm) +
        "+" +
        formatLoss(current.dataTerm) +
        "=" +
        formatLoss(current.loss);
      chartHost.replaceChildren(
        buildChart(current, optimum, api, instanceId + "-chart")
      );
      revealCurrentRatio(Number(state.logRatio));
    }

    computeRange.addEventListener("input", function () {
      state.logCompute = clamp(Number(computeRange.value), 18, 24);
      if (state.preset === "optimal") {
        state.logRatio = optimumForCompute(Math.pow(10, state.logCompute)).logRatio;
        ratioRange.value = state.logRatio;
      }
      render();
    });
    ratioRange.addEventListener("input", function () {
      state.logRatio = clamp(Number(ratioRange.value), LOG_R_MIN, LOG_R_MAX);
      state.preset = "custom";
      render();
    });
    render();
  }

  window.CourseLearning.register("scaling-budget", buildLab);
})();

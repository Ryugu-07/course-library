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

  function localFormat(value, digits) {
    if (!Number.isFinite(value)) {
      return "—";
    }
    var places = digits === undefined ? 3 : digits;
    var text = value.toFixed(places);
    return text.indexOf(".") === -1
      ? text
      : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function formatNumber(api, value, digits) {
    if (api && typeof api.format === "function") {
      return api.format(value, digits);
    }
    return localFormat(value, digits);
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") {
      api.announce(root, message);
    }
  }

  function replaceChildren(node, children) {
    if (node && typeof node.replaceChildren === "function") {
      node.replaceChildren.apply(node, Array.isArray(children) ? children : [children]);
      return;
    }
    clear(node);
    appendChildren(node, children);
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

  var SCENARIOS = {
    indicator: {
      label: "单调指标：1_[1/n,1]",
      formula: function (n) {
        return "f_n = 1_[1/n,1]";
      },
      integral: function (n) {
        return 1 - 1 / n;
      },
      limitText: "1（a.e.；x = 0 是例外）",
      dominatorText: "g(x) = 1 ∈ L¹(0,1)",
      monotone: true,
      dominated: true,
      note: "区间从左侧逐步扩张；面积随 n 增大而增加并趋向 1。"
    },
    spike: {
      label: "移动尖峰：n·1_(0,1/n)",
      formula: function (n) {
        return "f_n = n·1_(0,1/n)";
      },
      integral: function () {
        return 1;
      },
      limitText: "0（a.e.；在此开区间定义下事实上处处为 0）",
      dominatorText: "约 g(x) = 1/x；不属于 L¹(0,1)",
      monotone: false,
      dominated: false,
      note: "高度上升、底座收窄；点点看似消失，但总面积始终为 1。"
    },
    power: {
      label: "支配衰减：x^n",
      formula: function (n) {
        return "f_n(x) = x^" + n;
      },
      integral: function (n) {
        return 1 / (n + 1);
      },
      limitText: "0（a.e.；x = 1 是例外）",
      dominatorText: "g(x) = 1 ∈ L¹(0,1)",
      monotone: false,
      dominated: true,
      note: "函数逐点下降到 0；常数 1 是所有 f_n 的可积天花板。"
    }
  };

  window.CourseLearning.register("lebesgue", function (root, api) {
    if (!root || typeof document === "undefined") {
      return;
    }

    var state = {
      scenario: "indicator",
      n: 10
    };
    var refs = {};

    var heading = makeElement(api, "h3", {}, ["三种收敛方式：把“面积”与“点值”分开看"]);
    var intro = makeElement(api, "p", { className: "cl-note" }, [
      "固定定义域 [0,1]，拖动 n 或切换序列，观察积分、逐点极限和定理条件是否同步。图中填色是 f_n，虚线是极限的形状。"
    ]);

    var scenarioLabel = makeElement(api, "label", { htmlFor: "cl-lebesgue-scenario" }, [
      "序列"
    ]);
    var scenarioSelect = makeElement(api, "select", {
      id: "cl-lebesgue-scenario",
      "aria-label": "选择函数序列"
    });
    Object.keys(SCENARIOS).forEach(function (key) {
      scenarioSelect.appendChild(
        makeElement(api, "option", { value: key }, [SCENARIOS[key].label])
      );
    });
    scenarioSelect.value = state.scenario;
    refs.scenario = scenarioSelect;

    var nOutput = makeElement(api, "output", { htmlFor: "cl-lebesgue-n" }, [
      String(state.n)
    ]);
    var nLabel = makeElement(api, "label", { htmlFor: "cl-lebesgue-n" }, [
      "n = ",
      nOutput
    ]);
    var nInput = makeElement(api, "input", {
      id: "cl-lebesgue-n",
      type: "range",
      min: "1",
      max: "40",
      step: "1",
      value: String(state.n),
      "aria-label": "序号 n"
    });
    refs.nInput = nInput;
    refs.nOutput = nOutput;

    var controlSection = makeElement(
      api,
      "section",
      { className: "cl-controls", "aria-labelledby": "cl-lebesgue-controls-title" },
      [
        makeElement(api, "h4", { id: "cl-lebesgue-controls-title" }, ["参数"]),
        makeElement(api, "div", { className: "cl-control" }, [
          scenarioLabel,
          scenarioSelect
        ]),
        makeElement(api, "div", { className: "cl-control" }, [
          nLabel,
          nInput
        ]),
        makeElement(api, "p", { className: "cl-note" }, [
          "定义域固定为 [0,1]，端点的取值不影响 Lebesgue 积分。"
        ])
      ]
    );

    var svg = makeSvg(api, "svg", {
      className: "cl-plot",
      viewBox: "0 0 640 320",
      role: "img",
      "aria-label": "函数序列图像"
    });
    refs.svg = svg;
    refs.plotTitle = makeElement(api, "span", {}, []);
    refs.plotNote = makeElement(api, "p", { className: "cl-note" }, []);

    function metric(label) {
      var value = makeElement(api, "strong", {}, ["—"]);
      var card = makeElement(api, "div", { className: "cl-metric" }, [
        makeElement(api, "span", {}, [label]),
        value
      ]);
      return { card: card, value: value };
    }

    var integralMetric = metric("∫₀¹ f_n dx");
    var limitMetric = metric("点态极限（a.e.）");
    var dominatorMetric = metric("候选控制函数 g");
    refs.integral = integralMetric.value;
    refs.limit = limitMetric.value;
    refs.dominator = dominatorMetric.value;

    var formula = makeElement(api, "div", { className: "cl-formula" }, []);
    refs.formula = formula;

    var checklist = makeElement(api, "ul", {
      className: "cl-checklist",
      "aria-label": "收敛定理条件检查"
    });
    refs.checklist = checklist;

    var stageSection = makeElement(
      api,
      "section",
      { className: "cl-stage", "aria-labelledby": "cl-lebesgue-stage-title" },
      [
        makeElement(api, "div", { className: "cl-stage-frame" }, [
          makeElement(api, "div", { className: "cl-stage-title" }, [
            makeElement(api, "span", { id: "cl-lebesgue-stage-title" }, [
              refs.plotTitle
            ]),
            makeElement(api, "span", {}, ["[0,1]"])
          ]),
          svg
        ]),
        refs.plotNote,
        makeElement(api, "div", { className: "cl-metrics" }, [
          integralMetric.card,
          limitMetric.card,
          dominatorMetric.card
        ]),
        formula,
        makeElement(api, "h4", {}, ["MCT / Fatou / DCT 条件速查"]),
        checklist
      ]
    );

    var grid = makeElement(api, "div", { className: "cl-grid" }, [
      controlSection,
      stageSection
    ]);

    replaceChildren(root, [heading, intro, grid]);

    function drawAxes(scenarioKey, n, yMax) {
      var left = 52;
      var top = 22;
      var width = 566;
      var height = 232;
      var bottom = top + height;
      var right = left + width;
      var children = [];

      for (var i = 0; i <= 4; i += 1) {
        var x = left + (width * i) / 4;
        children.push(
          makeSvg(api, "line", {
            x1: x,
            y1: top,
            x2: x,
            y2: bottom,
            stroke: "currentColor",
            "stroke-opacity": "0.12"
          })
        );
        children.push(
          svgText(api, x, bottom + 24, (i / 4).toFixed(2), {
            "font-size": "11"
          })
        );
      }

      for (var j = 0; j <= 4; j += 1) {
        var y = bottom - (height * j) / 4;
        children.push(
          makeSvg(api, "line", {
            x1: left,
            y1: y,
            x2: right,
            y2: y,
            stroke: "currentColor",
            "stroke-opacity": j === 0 ? "0.32" : "0.1"
          })
        );
        children.push(
          svgText(api, left - 9, y + 4, localFormat((yMax * j) / 4, 1), {
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
        svgText(api, right, bottom + 24, "x", {
          "font-size": "12",
          "text-anchor": "end"
        }),
        svgText(api, left - 10, top - 7, "f_n(x)", {
          "font-size": "12",
          "text-anchor": "end"
        })
      );

      if (scenarioKey === "indicator") {
        var indicatorBreak = left + width / n;
        children.push(
          makeSvg(api, "line", {
            x1: indicatorBreak,
            y1: top,
            x2: indicatorBreak,
            y2: bottom,
            stroke: "var(--cl-gold, #9b6a12)",
            "stroke-dasharray": "4 4",
            "stroke-opacity": "0.8"
          })
        );
      }

      return {
        children: children,
        left: left,
        top: top,
        width: width,
        height: height,
        bottom: bottom
      };
    }

    function drawFunction(scenarioKey, n, plot) {
      var left = plot.left;
      var top = plot.top;
      var width = plot.width;
      var height = plot.height;
      var bottom = plot.bottom;
      var yMax = scenarioKey === "spike" ? Math.max(1, n) * 1.12 : 1.12;
      var children = [];

      function sx(x) {
        return left + width * clamp(x, 0, 1);
      }

      function sy(y) {
        return bottom - (height * clamp(y, 0, yMax)) / yMax;
      }

      if (scenarioKey === "indicator") {
        var breakX = sx(1 / n);
        children.push(
          makeSvg(api, "path", {
            d:
              "M " +
              left +
              " " +
              bottom +
              " L " +
              breakX +
              " " +
              bottom +
              " L " +
              breakX +
              " " +
              sy(1) +
              " L " +
              sx(1) +
              " " +
              sy(1) +
              " L " +
              sx(1) +
              " " +
              bottom,
            fill: "currentColor",
            "fill-opacity": "0.18",
            stroke: "currentColor",
            "stroke-width": "2.5"
          }),
          svgText(api, Math.min(sx(1 / n) + 24, sx(1) - 6), sy(1) - 10, "f_n", {
            "font-size": "12",
            "text-anchor": "end"
          })
        );
      } else if (scenarioKey === "spike") {
        var spikeEnd = sx(1 / n);
        children.push(
          makeSvg(api, "path", {
            d:
              "M " +
              left +
              " " +
              bottom +
              " L " +
              left +
              " " +
              sy(n) +
              " L " +
              spikeEnd +
              " " +
              sy(n) +
              " L " +
              spikeEnd +
              " " +
              bottom,
            fill: "currentColor",
            "fill-opacity": "0.18",
            stroke: "currentColor",
            "stroke-width": "2.5"
          }),
          svgText(api, Math.min(spikeEnd + 22, sx(0.42)), sy(n) + 16, "n", {
            "font-size": "12",
            "text-anchor": "start"
          })
        );
      } else {
        var points = [];
        for (var k = 0; k <= 160; k += 1) {
          var x = k / 160;
          points.push(sx(x) + "," + sy(Math.pow(x, n)));
        }
        children.push(
          makeSvg(api, "polyline", {
            points: points.join(" "),
            fill: "none",
            stroke: "currentColor",
            "stroke-width": "2.5",
            "stroke-linejoin": "round",
            "stroke-linecap": "round"
          }),
          makeSvg(api, "circle", {
            cx: sx(1),
            cy: sy(1),
            r: "4",
            fill: "var(--cl-gold, #9b6a12)"
          }),
          svgText(api, sx(0.88), sy(Math.pow(0.88, n)) - 12, "f_n", {
            "font-size": "12",
            "text-anchor": "start"
          })
        );
      }

      var limitY = scenarioKey === "indicator" ? 1 : 0;
      children.push(
        makeSvg(api, "line", {
          x1: sx(0),
          y1: sy(limitY),
          x2: sx(1),
          y2: sy(limitY),
          stroke: "var(--cl-gold, #9b6a12)",
          "stroke-dasharray": "7 5",
          "stroke-width": "2"
        }),
        svgText(api, sx(0.98), sy(limitY) - 9, "极限（a.e.）", {
          "font-size": "11",
          "text-anchor": "end",
          fill: "var(--cl-gold, #9b6a12)"
        })
      );

      return children;
    }

    function drawPlot(scenarioKey, n) {
      clear(svg);
      var yMax = scenarioKey === "spike" ? Math.max(1, n) * 1.12 : 1.12;
      var plot = drawAxes(scenarioKey, n, yMax);
      plot.children.forEach(function (child) {
        svg.appendChild(child);
      });
      drawFunction(scenarioKey, n, plot).forEach(function (child) {
        svg.appendChild(child);
      });
      svg.setAttribute(
        "aria-label",
        SCENARIOS[scenarioKey].label + "，n = " + n + " 的函数图像"
      );
    }

    function statusItem(label, ok, detail) {
      return makeElement(api, "li", {}, [
        makeElement(
          api,
          "span",
          {
            className: ok ? "cl-pass" : "cl-fail",
            "aria-hidden": "true"
          },
          [ok ? "✓" : "×"]
        ),
        makeElement(api, "span", {}, [
          makeElement(api, "strong", {}, [label + "："]),
          detail
        ])
      ]);
    }

    function updateChecklist(scenarioKey, n) {
      var scenario = SCENARIOS[scenarioKey];
      replaceChildren(refs.checklist, [
        statusItem(
          "MCT",
          scenario.monotone,
          scenario.monotone
            ? "满足 0 ≤ f_n ↑，可换序，且极限积分为 1。"
            : "需要非负且单调递增；本例缺少单调递增条件。"
        ),
        statusItem(
          "Fatou",
          true,
          "三例都非负，因此 ∫ liminf f_n ≤ liminf ∫ f_n 成立。"
        ),
        statusItem(
          "DCT",
          scenario.dominated,
          scenario.dominated
            ? "有可积 g 且 f_n → f a.e.，所以积分也收敛到极限积分。"
            : "没有可积的统一控制函数；点态收敛不能单独交换积分号。"
        )
      ]);
    }

    function update() {
      var scenario = SCENARIOS[state.scenario];
      var n = state.n;
      refs.nOutput.textContent = String(n);
      refs.plotTitle.textContent = scenario.label;
      refs.plotNote.textContent = scenario.note;
      refs.formula.textContent =
        scenario.formula(n) + "；  ∫₀¹ f_n dx = " + formatNumber(api, scenario.integral(n), 4);
      refs.integral.textContent = formatNumber(api, scenario.integral(n), 4);
      refs.limit.textContent = scenario.limitText;
      refs.dominator.textContent = scenario.dominatorText;
      drawPlot(state.scenario, n);
      updateChecklist(state.scenario, n);
    }

    scenarioSelect.addEventListener("change", function () {
      if (!SCENARIOS[scenarioSelect.value]) {
        scenarioSelect.value = state.scenario;
        return;
      }
      state.scenario = scenarioSelect.value;
      update();
      announce(api, root, "已切换到" + SCENARIOS[state.scenario].label);
    });

    nInput.addEventListener("input", function () {
      var next = parseInt(nInput.value, 10);
      state.n = clamp(Number.isFinite(next) ? next : 1, 1, 40);
      update();
    });

    nInput.addEventListener("change", function () {
      announce(api, root, "当前 n = " + state.n);
    });

    update();
  });
}());

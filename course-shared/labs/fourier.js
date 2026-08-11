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
  var PI = Math.PI;
  var X_MIN = -PI;
  var X_MAX = PI;
  var SAMPLE_COUNT = 480;
  var WAVE_VIEWBOX_WIDTH = 720;
  var WAVE_PLOT_LEFT = 54;
  var WAVE_PLOT_RIGHT = 664;

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
    var places = digits === undefined ? 3 : digits;
    var text = value.toFixed(places);
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

  function formatX(value) {
    var landmarks = [
      [-PI, "−π"],
      [-PI / 2, "−π/2"],
      [0, "0"],
      [PI / 2, "π/2"],
      [PI, "π"]
    ];
    for (var i = 0; i < landmarks.length; i += 1) {
      if (Math.abs(value - landmarks[i][0]) < 0.006) {
        return landmarks[i][1];
      }
    }
    var ratio = value / PI;
    var text = ratio.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    return text.replace("-", "−") + "π";
  }

  function xTickLabel(value) {
    if (Math.abs(value + PI) < 0.001) return "−π";
    if (Math.abs(value + PI / 2) < 0.001) return "−π/2";
    if (Math.abs(value) < 0.001) return "0";
    if (Math.abs(value - PI / 2) < 0.001) return "π/2";
    return "π";
  }

  var FUNCTIONS = {
    square: {
      label: "方波：sign(sin x)",
      shortLabel: "方波",
      yMax: 1.35,
      jumpThreshold: 0.4,
      jumpPoints: [-PI, 0, PI],
      target: function (x) {
        var sine = Math.sin(x);
        if (Math.abs(sine) < 1e-8) {
          return 0;
        }
        return sine > 0 ? 1 : -1;
      },
      coefficient: function (n) {
        return n % 2 === 1 ? 4 / (PI * n) : 0;
      },
      coefficientText:
        "a₀ = aₙ = 0；bₙ = 4/(πn)（n 奇），偶数 bₙ = 0",
      note:
        "跳跃在 x = kπ；蓝线在跳跃处取 0，表示左右极限的平均。"
    },
    saw: {
      label: "锯齿波：x（−π < x < π），周期延拓",
      shortLabel: "锯齿波",
      yMax: 3.85,
      jumpThreshold: 1,
      jumpPoints: [-PI, PI],
      target: function (x) {
        if (Math.abs(Math.abs(x) - PI) < 1e-8) {
          return 0;
        }
        return x;
      },
      coefficient: function (n) {
        return (2 * (n % 2 === 1 ? 1 : -1)) / n;
      },
      coefficientText:
        "a₀ = aₙ = 0；bₙ = 2(−1)ⁿ⁺¹/n",
      note:
        "周期端点从 π 跳到 −π；蓝线端点取 0，表示两侧极限的平均。"
    }
  };

  function isJump(spec, x) {
    for (var i = 0; i < spec.jumpPoints.length; i += 1) {
      if (Math.abs(x - spec.jumpPoints[i]) < 1e-6) {
        return true;
      }
    }
    return false;
  }

  function snapObservation(spec, value) {
    var closest = value;
    var distance = 0.025;
    var landmarks = [-PI, -PI / 2, 0, PI / 2, PI];
    spec.jumpPoints.concat(landmarks).forEach(function (landmark) {
      if (Math.abs(value - landmark) < distance) {
        closest = landmark;
        distance = Math.abs(value - landmark);
      }
    });
    return clamp(closest, X_MIN, X_MAX);
  }

  function partialSum(spec, x, harmonicCount) {
    var total = 0;
    for (var n = 1; n <= harmonicCount; n += 1) {
      total += spec.coefficient(n) * Math.sin(n * x);
    }
    return total;
  }

  function limitValue(spec, x) {
    return isJump(spec, x) ? 0 : spec.target(x);
  }

  function pathForFunction(evaluator, jumpThreshold, scaleX, scaleY) {
    var path = "";
    var previous = null;
    for (var i = 0; i <= SAMPLE_COUNT; i += 1) {
      var x = X_MIN + ((X_MAX - X_MIN) * i) / SAMPLE_COUNT;
      var value = evaluator(x);
      var command =
        previous !== null && Math.abs(value - previous) <= jumpThreshold
          ? "L"
          : "M";
      path +=
        command +
        scaleX(x).toFixed(2) +
        " " +
        scaleY(value).toFixed(2) +
        " ";
      previous = value;
    }
    return path;
  }

  function makeMetric(api, label) {
    var labelNode = makeElement(api, "span", {}, [label]);
    var valueNode = makeElement(api, "strong", {}, ["—"]);
    var card = makeElement(api, "div", {
      className: "cl-metric cl-fourier-metric"
    }, [labelNode, valueNode]);
    return { card: card, label: labelNode, value: valueNode };
  }

  function drawWave(api, svg, key, harmonicCount, observation) {
    var spec = FUNCTIONS[key];
    var left = WAVE_PLOT_LEFT;
    var top = 30;
    var width = WAVE_PLOT_RIGHT - WAVE_PLOT_LEFT;
    var height = 214;
    var bottom = top + height;
    var right = left + width;
    var yMax = spec.yMax;

    function scaleX(value) {
      return left + ((value - X_MIN) / (X_MAX - X_MIN)) * width;
    }

    function scaleY(value) {
      return bottom - (clamp(value, -yMax, yMax) + yMax) * (height / (2 * yMax));
    }

    var children = [
      makeSvg(api, "title", { id: "cl-fourier-wave-title" }, [
        spec.shortLabel + "目标函数与第 " + harmonicCount + " 项部分和"
      ]),
      makeSvg(api, "desc", { id: "cl-fourier-wave-desc" }, [
        "蓝线为" + spec.shortLabel + "目标，金线为 Fourier 部分和；竖线和圆点标出可移动观察点 x₀=" +
          formatX(observation) + "。"
      ])
    ];

    var xTicks = [-PI, -PI / 2, 0, PI / 2, PI];
    xTicks.forEach(function (value) {
      var x = scaleX(value);
      children.push(
        makeSvg(api, "line", {
          x1: x,
          y1: top,
          x2: x,
          y2: bottom,
          stroke: "currentColor",
          "stroke-opacity": "0.11"
        }),
        svgText(api, x, bottom + 22, xTickLabel(value), {
          "font-size": "11"
        })
      );
    });

    var yTicks = key === "square" ? [-1, 0, 1] : [-PI, 0, PI];
    yTicks.forEach(function (value) {
      var y = scaleY(value);
      children.push(
        makeSvg(api, "line", {
          x1: left,
          y1: y,
          x2: right,
          y2: y,
          stroke: "currentColor",
          "stroke-opacity": value === 0 ? "0.3" : "0.11"
        }),
        svgText(api, left - 9, y + 4, key === "saw" && value !== 0
          ? (value < 0 ? "−π" : "π")
          : String(value), {
          "font-size": "11",
          "text-anchor": "end"
        })
      );
    });

    children.push(
      makeSvg(api, "line", {
        x1: left,
        y1: bottom,
        x2: right,
        y2: bottom,
        stroke: "currentColor",
        "stroke-width": "1.4"
      }),
      makeSvg(api, "line", {
        x1: left,
        y1: top,
        x2: left,
        y2: bottom,
        stroke: "currentColor",
        "stroke-width": "1.4"
      }),
      svgText(api, right, bottom + 22, "x", {
        "font-size": "11",
        "text-anchor": "end"
      }),
      svgText(api, left - 9, top - 9, "f, S_N", {
        "font-size": "11",
        "text-anchor": "end"
      })
    );

    spec.jumpPoints.forEach(function (jump) {
      if (jump <= X_MIN + 1e-5 || jump >= X_MAX - 1e-5) {
        return;
      }
      var jumpX = scaleX(jump);
      children.push(
        makeSvg(api, "line", {
          x1: jumpX,
          y1: top,
          x2: jumpX,
          y2: bottom,
          stroke: "var(--cl-red, #b64335)",
          "stroke-dasharray": "4 4",
          "stroke-opacity": "0.65"
        }),
        svgText(api, jumpX + 5, top + 13, "跳跃", {
          "font-size": "10",
          "text-anchor": "start",
          fill: "var(--cl-red, #b64335)"
        })
      );
    });

    children.push(
      makeSvg(api, "path", {
        d: pathForFunction(
          spec.target,
          spec.jumpThreshold,
          scaleX,
          scaleY
        ),
        fill: "none",
        stroke: "var(--cl-blue, #315f9d)",
        "stroke-width": "2.6",
        "stroke-linejoin": "round"
      }),
      makeSvg(api, "path", {
        d: pathForFunction(
          function (x) {
            return partialSum(spec, x, harmonicCount);
          },
          Infinity,
          scaleX,
          scaleY
        ),
        fill: "none",
        stroke: "var(--cl-gold, #9b6a12)",
        "stroke-width": "2.2",
        "stroke-linejoin": "round"
      })
    );

    var observationX = scaleX(observation);
    var observationTarget = spec.target(observation);
    var observationSum = partialSum(spec, observation, harmonicCount);
    children.push(
      makeSvg(api, "line", {
        x1: observationX,
        y1: top,
        x2: observationX,
        y2: bottom,
        stroke: "var(--accent, #315f9d)",
        "stroke-dasharray": "3 4",
        "stroke-width": "1.6"
      }),
      makeSvg(api, "circle", {
        cx: observationX,
        cy: scaleY(observationSum),
        r: "5.5",
        fill: "var(--cl-gold, #9b6a12)",
        stroke: "var(--bg, #fff)",
        "stroke-width": "2",
        "data-fourier-observation-point": "sum"
      }),
      makeSvg(api, "circle", {
        cx: observationX,
        cy: scaleY(observationTarget),
        r: "4.5",
        fill: "var(--cl-blue, #315f9d)",
        stroke: "var(--bg, #fff)",
        "stroke-width": "2",
        "data-fourier-observation-point": "target"
      }),
      makeSvg(api, "line", {
        x1: left + 10,
        y1: top + 12,
        x2: left + 34,
        y2: top + 12,
        stroke: "var(--cl-blue, #315f9d)",
        "stroke-width": "2.6"
      }),
      svgText(api, left + 40, top + 16, "目标 f(x)", {
        "font-size": "11",
        "text-anchor": "start"
      }),
      makeSvg(api, "line", {
        x1: left + 126,
        y1: top + 12,
        x2: left + 150,
        y2: top + 12,
        stroke: "var(--cl-gold, #9b6a12)",
        "stroke-width": "2.2"
      }),
      svgText(api, left + 156, top + 16, "部分和 S_N", {
        "font-size": "11",
        "text-anchor": "start"
      })
    );

    replaceChildren(svg, children);
    svg.setAttribute(
      "aria-label",
      spec.shortLabel + "目标函数和 Fourier 部分和，谐波数 N=" + harmonicCount
    );
  }

  function drawSpectrum(api, svg, key, harmonicCount) {
    var spec = FUNCTIONS[key];
    var left = 54;
    var top = 24;
    var width = 610;
    var height = 126;
    var bottom = top + height;
    var right = left + width;
    var maxAbs = key === "square" ? 4 / PI : 2;
    var yMax = maxAbs * 1.16;

    function scaleX(n) {
      return left + ((n - 0.5) / harmonicCount) * width;
    }

    function scaleY(value) {
      return bottom - (value + yMax) * (height / (2 * yMax));
    }

    var children = [
      makeSvg(api, "title", { id: "cl-fourier-spectrum-title" }, [
        spec.shortLabel + "的 Fourier 正弦系数频谱"
      ]),
      makeSvg(api, "desc", { id: "cl-fourier-spectrum-desc" }, [
        "每根竖线表示 b_n，横轴为谐波编号 n；本实验中的余弦系数全部为零。"
      ])
    ];

    [-maxAbs, 0, maxAbs].forEach(function (value) {
      var y = scaleY(value);
      children.push(
        makeSvg(api, "line", {
          x1: left,
          y1: y,
          x2: right,
          y2: y,
          stroke: "currentColor",
          "stroke-opacity": value === 0 ? "0.32" : "0.11"
        }),
        svgText(api, left - 9, y + 4, formatNumber(api, value, 2), {
          "font-size": "10",
          "text-anchor": "end"
        })
      );
    });

    children.push(
      makeSvg(api, "line", {
        x1: left,
        y1: bottom,
        x2: right,
        y2: bottom,
        stroke: "currentColor",
        "stroke-width": "1.2"
      }),
      makeSvg(api, "line", {
        x1: left,
        y1: scaleY(0),
        x2: right,
        y2: scaleY(0),
        stroke: "currentColor",
        "stroke-width": "1.4"
      }),
      svgText(api, right, bottom + 21, "n", {
        "font-size": "11",
        "text-anchor": "end"
      }),
      svgText(api, left - 9, top - 8, "b_n", {
        "font-size": "11",
        "text-anchor": "end"
      })
    );

    for (var n = 1; n <= harmonicCount; n += 1) {
      var coefficient = spec.coefficient(n);
      var x = scaleX(n);
      var y = scaleY(coefficient);
      children.push(
        makeSvg(api, "line", {
          x1: x,
          y1: scaleY(0),
          x2: x,
          y2: y,
          stroke: coefficient === 0
            ? "currentColor"
            : "var(--cl-gold, #9b6a12)",
          "stroke-opacity": coefficient === 0 ? "0.3" : "0.9",
          "stroke-width": Math.max(1.5, Math.min(7, 0.42 * width / harmonicCount)),
          "stroke-linecap": "round"
        }),
        makeSvg(api, "circle", {
          cx: x,
          cy: y,
          r: "2.6",
          fill: coefficient === 0
            ? "currentColor"
            : "var(--cl-gold, #9b6a12)"
        })
      );
      if (
        harmonicCount <= 15 ||
        n === 1 ||
        n === harmonicCount ||
        n % 5 === 0
      ) {
        children.push(
          svgText(api, x, bottom + 21, String(n), {
            "font-size": "10"
          })
        );
      }
    }

    replaceChildren(svg, children);
    svg.setAttribute(
      "aria-label",
      spec.shortLabel + "的正弦系数频谱，显示到第 " + harmonicCount + " 次谐波"
    );
  }

  function checklistItem(api, pass, text) {
    return makeElement(api, "li", {}, [
      makeElement(api, "span", {
        className: pass ? "cl-pass" : "cl-warn",
        "aria-hidden": "true"
      }, [pass ? "✓" : "!" ]),
      makeElement(api, "span", {}, [text])
    ]);
  }

  window.CourseLearning.register("fourier", function (root, api) {
    if (!root || typeof document === "undefined") {
      return;
    }

    var state = {
      functionKey: "square",
      harmonicCount: 5,
      observation: PI / 2
    };
    var refs = {};

    var heading = makeElement(api, "h3", {}, [
      "Fourier 级数实验：投影、跳跃与 Gibbs 过冲"
    ]);
    var intro = makeElement(api, "p", { className: "cl-note cl-fourier-intro" }, [
      "先预测，再切换函数和参数。蓝线是目标函数，金线是有限部分和；下方的有符号频谱直接显示 b_n。可拖动图中的观察线，也可用 x₀ 滑块精确落在跳跃点。"
    ]);

    var functionSelect = makeElement(api, "select", {
      id: "cl-fourier-function",
      "aria-label": "选择周期函数"
    });
    Object.keys(FUNCTIONS).forEach(function (key) {
      functionSelect.appendChild(
        makeElement(api, "option", { value: key }, [FUNCTIONS[key].label])
      );
    });
    functionSelect.value = state.functionKey;

    var harmonicOutput = makeElement(api, "output", {
      htmlFor: "cl-fourier-harmonics"
    }, [String(state.harmonicCount)]);
    var harmonicInput = makeElement(api, "input", {
      id: "cl-fourier-harmonics",
      type: "range",
      min: "1",
      max: "41",
      step: "1",
      value: String(state.harmonicCount),
      "aria-label": "谐波数 N"
    });

    var observationOutput = makeElement(api, "output", {
      htmlFor: "cl-fourier-observation"
    }, [formatX(state.observation)]);
    var observationInput = makeElement(api, "input", {
      id: "cl-fourier-observation",
      type: "range",
      min: String(X_MIN),
      max: String(X_MAX),
      step: String(PI / 200),
      value: String(state.observation),
      "aria-label": "观察点 x₀"
    });

    var controlSection = makeElement(api, "section", {
      className: "cl-controls cl-fourier-controls",
      "aria-labelledby": "cl-fourier-controls-title"
    }, [
      makeElement(api, "h4", { id: "cl-fourier-controls-title" }, ["参数"]),
      makeElement(api, "div", { className: "cl-control cl-fourier-control" }, [
        makeElement(api, "label", { htmlFor: "cl-fourier-function" }, ["周期函数"]),
        functionSelect
      ]),
      makeElement(api, "div", { className: "cl-control cl-fourier-control" }, [
        makeElement(api, "label", { htmlFor: "cl-fourier-harmonics" }, [
          "谐波数 N = ",
          harmonicOutput
        ]),
        harmonicInput
      ]),
      makeElement(api, "div", { className: "cl-control cl-fourier-control" }, [
        makeElement(api, "label", { htmlFor: "cl-fourier-observation" }, [
          "观察点 x₀ = ",
          observationOutput
        ]),
        observationInput
      ]),
      makeElement(api, "p", { className: "cl-note cl-fourier-control-note" }, [
        "滑块可用键盘操作；拖动主图中的竖线会把 x₀ 吸附到附近的跳跃点。"
      ])
    ]);

    var waveSvg = makeSvg(api, "svg", {
      className: "cl-plot cl-fourier-wave",
      viewBox: "0 0 720 286",
      role: "img",
      "aria-labelledby": "cl-fourier-wave-title cl-fourier-wave-desc",
      "aria-label": "Fourier 目标函数与部分和",
      style: "touch-action: none"
    });
    var spectrumSvg = makeSvg(api, "svg", {
      className: "cl-plot cl-fourier-spectrum",
      viewBox: "0 0 720 184",
      role: "img",
      "aria-labelledby": "cl-fourier-spectrum-title cl-fourier-spectrum-desc",
      "aria-label": "Fourier 系数频谱"
    });
    var stageTitle = makeElement(api, "span", {
      id: "cl-fourier-stage-title"
    }, ["目标函数与部分和"]);
    var plotNote = makeElement(api, "p", {
      className: "cl-note cl-fourier-plot-note"
    }, []);
    var spectrumTitle = makeElement(api, "div", {
      className: "cl-fourier-spectrum-title"
    }, ["系数频谱：有符号的 bₙ（本实验 aₙ=0）"]);
    var spectrumNote = makeElement(api, "p", {
      className: "cl-note cl-fourier-spectrum-note"
    }, ["柱子的符号表示投影方向；柱高显示该频率在部分和中的权重。"]);

    var targetMetric = makeMetric(api, "极限目标");
    var partialMetric = makeMetric(api, "当前 S_N(x₀)");
    var errorMetric = makeMetric(api, "与极限目标的差");
    var coefficientMetric = makeMetric(api, "当前 b_N");
    var status = makeElement(api, "p", {
      className: "cl-note cl-fourier-status",
      "aria-live": "polite"
    }, []);
    var formula = makeElement(api, "div", {
      className: "cl-formula cl-fourier-formula"
    }, []);
    var checklist = makeElement(api, "ul", {
      className: "cl-checklist cl-fourier-checklist",
      "aria-label": "Fourier 实验读数与定理边界"
    }, []);

    var stageSection = makeElement(api, "section", {
      className: "cl-stage cl-fourier-stage",
      "aria-labelledby": "cl-fourier-stage-title"
    }, [
      makeElement(api, "div", { className: "cl-stage-frame cl-fourier-frame" }, [
        makeElement(api, "div", { className: "cl-stage-title" }, [
          stageTitle,
          makeElement(api, "span", {}, ["−π ≤ x ≤ π"])
        ]),
        waveSvg,
        spectrumTitle,
        spectrumSvg
      ]),
      plotNote,
      spectrumNote,
      makeElement(api, "div", { className: "cl-metrics cl-fourier-metrics" }, [
        targetMetric.card,
        partialMetric.card,
        errorMetric.card,
        coefficientMetric.card
      ]),
      status,
      formula,
      makeElement(api, "h4", {}, ["读数速查"]),
      checklist
    ]);

    var grid = makeElement(api, "div", {
      className: "cl-grid cl-fourier-grid"
    }, [controlSection, stageSection]);

    replaceChildren(root, [heading, intro, grid]);

    function update() {
      var spec = FUNCTIONS[state.functionKey];
      var pointIsJump = isJump(spec, state.observation);
      var limit = limitValue(spec, state.observation);
      var currentSum = partialSum(spec, state.observation, state.harmonicCount);
      var currentCoefficient = spec.coefficient(state.harmonicCount);

      harmonicOutput.textContent = String(state.harmonicCount);
      observationOutput.textContent = formatX(state.observation);
      observationInput.value = String(state.observation);
      targetMetric.label.textContent = pointIsJump ? "跳跃点平均极限" : "连续点 f(x₀)";
      targetMetric.value.textContent = formatNumber(api, limit, 3);
      partialMetric.value.textContent = formatNumber(api, currentSum, 3);
      errorMetric.value.textContent = formatNumber(
        api,
        Math.abs(currentSum - limit),
        3
      );
      coefficientMetric.value.textContent = formatNumber(api, currentCoefficient, 3);

      drawWave(api, waveSvg, state.functionKey, state.harmonicCount, state.observation);
      drawSpectrum(api, spectrumSvg, state.functionKey, state.harmonicCount);
      plotNote.textContent =
        spec.note +
        " 当前观察点 x₀=" +
        formatX(state.observation) +
        "：蓝点是目标取值，金点是 S_N。";
      spectrumNote.textContent =
        "每根竖线是 b_n；当前显示 n=1,…," +
        state.harmonicCount +
        "，余弦投影 a_n 全为 0。";
      status.textContent = pointIsJump
        ? "x₀=" +
          formatX(state.observation) +
          " 是跳跃点：左右极限平均为 " +
          formatNumber(api, limit, 3) +
          "；该点邻域仍有 Gibbs 过冲（精确跳跃点的 S_N 是平均值）。"
        : "x₀=" +
          formatX(state.observation) +
          " 是连续点：目标值为 " +
          formatNumber(api, limit, 3) +
          "；增大 N 观察部分和逐点靠近，但这不是含跳跃区间的一致收敛保证。";
      replaceChildren(formula, [
        "函数：" + spec.label,
        makeElement(api, "br"),
        "投影系数：" + spec.coefficientText,
        makeElement(api, "br"),
        "本次部分和：S_N(x)=Σₙ≤" + state.harmonicCount + " bₙ sin(nx)（aₙ=a₀=0）"
      ]);
      replaceChildren(checklist, [
        checklistItem(api, true, "系数读法：bₙ 是 f 在 sin(nx) 方向上的正交投影。"),
        checklistItem(
          api,
          true,
          pointIsJump
            ? "当前是跳跃点，比较对象是左右极限平均，而不是某一侧的函数值。"
            : "当前是连续点，Dirichlet 极限与函数值 f(x₀) 相同。"
        ),
        checklistItem(
          api,
          false,
          "边界提醒：含跳跃时，连续的 S_N 不可能在整周期上一致收敛到不连续目标。"
        )
      ]);
    }

    functionSelect.addEventListener("change", function () {
      state.functionKey = functionSelect.value;
      update();
    });
    harmonicInput.addEventListener("input", function () {
      state.harmonicCount = Number(harmonicInput.value);
      update();
    });
    observationInput.addEventListener("input", function () {
      var spec = FUNCTIONS[state.functionKey];
      state.observation = snapObservation(spec, Number(observationInput.value));
      update();
    });

    var dragging = false;
    function setObservationFromPointer(event) {
      if (!event || !Number.isFinite(event.clientX)) {
        return;
      }
      var rect = waveSvg.getBoundingClientRect();
      if (!rect.width) {
        return;
      }
      var svgX =
        ((event.clientX - rect.left) / rect.width) * WAVE_VIEWBOX_WIDTH;
      var plotRatio = clamp(
        (svgX - WAVE_PLOT_LEFT) / (WAVE_PLOT_RIGHT - WAVE_PLOT_LEFT),
        0,
        1
      );
      var value = X_MIN + plotRatio * (X_MAX - X_MIN);
      state.observation = snapObservation(FUNCTIONS[state.functionKey], value);
      update();
    }
    function stopDragging(event) {
      if (!dragging) {
        return;
      }
      dragging = false;
      if (
        event &&
        event.pointerId !== undefined &&
        waveSvg.releasePointerCapture
      ) {
        try {
          waveSvg.releasePointerCapture(event.pointerId);
        } catch (error) {
          /* Pointer capture is optional; the slider remains available. */
        }
      }
    }
    waveSvg.addEventListener("pointerdown", function (event) {
      dragging = true;
      if (waveSvg.setPointerCapture && event.pointerId !== undefined) {
        try {
          waveSvg.setPointerCapture(event.pointerId);
        } catch (error) {
          /* Pointer capture is optional. */
        }
      }
      event.preventDefault();
      setObservationFromPointer(event);
    });
    waveSvg.addEventListener("pointermove", function (event) {
      if (dragging) {
        event.preventDefault();
        setObservationFromPointer(event);
      }
    });
    waveSvg.addEventListener("pointerup", stopDragging);
    waveSvg.addEventListener("pointercancel", stopDragging);

    update();
    announce(api, root, "Fourier 实验已加载：当前为方波、N=5、观察点 x₀=π/2。");
  });
})();

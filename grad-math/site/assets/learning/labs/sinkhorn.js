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
  var COST = [
    [0, 1, 4],
    [1, 0, 1],
    [4, 1, 0]
  ];
  var SOURCE = [0.5, 0.3, 0.2];
  var TARGET = [0.2, 0.3, 0.5];
  var DEFAULT_EPSILON = 0.8;
  var MIN_EPSILON = 0.1;
  var MAX_EPSILON = 2;
  var TOLERANCE = 1e-6;
  var MAX_AUTO_STEPS = 500;

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
    if (node && typeof node.replaceChildren === "function") {
      node.replaceChildren.apply(node, Array.isArray(children) ? children : [children]);
      return;
    }
    clear(node);
    appendChildren(node, children);
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

  function kernel(epsilon) {
    return COST.map(function (row) {
      return row.map(function (cost) {
        return Math.exp(-cost / epsilon);
      });
    });
  }

  function coupling(k, u, v) {
    return k.map(function (row, i) {
      return row.map(function (value, j) {
        return u[i] * value * v[j];
      });
    });
  }

  function rowSums(pi) {
    return pi.map(function (row) {
      return row.reduce(function (sum, value) {
        return sum + value;
      }, 0);
    });
  }

  function columnSums(pi) {
    return [0, 1, 2].map(function (j) {
      return pi.reduce(function (sum, row) {
        return sum + row[j];
      }, 0);
    });
  }

  function marginalError(pi) {
    var rows = rowSums(pi);
    var columns = columnSums(pi);
    var error = 0;
    rows.forEach(function (value, i) {
      error = Math.max(error, Math.abs(value - SOURCE[i]));
    });
    columns.forEach(function (value, j) {
      error = Math.max(error, Math.abs(value - TARGET[j]));
    });
    return error;
  }

  function sum(values) {
    return values.reduce(function (total, value) {
      return total + value;
    }, 0);
  }

  window.CourseLearning.register("sinkhorn", function (root, api) {
    if (!root || typeof document === "undefined") {
      return;
    }

    var state = {
      epsilon: DEFAULT_EPSILON,
      k: kernel(DEFAULT_EPSILON),
      u: [1, 1, 1],
      v: [1, 1, 1],
      iterations: 0,
      autoTimer: null
    };
    var refs = {};

    var heading = makeElement(api, "h3", {}, [
      "Sinkhorn 矩阵缩放：让两组边缘同时对账"
    ]);
    var intro = makeElement(api, "p", { className: "cl-note" }, [
      "固定成本矩阵 C、源分布 a 和目标分布 b。每次迭代先缩放行，再缩放列；拖动 ε，比较“贴近低成本”与“保持平滑”之间的取舍。"
    ]);

    var epsilonOutput = makeElement(api, "output", { htmlFor: "cl-sinkhorn-epsilon" }, [
      formatNumber(api, state.epsilon, 1)
    ]);
    var epsilonLabel = makeElement(api, "label", { htmlFor: "cl-sinkhorn-epsilon" }, [
      "ε = ",
      epsilonOutput
    ]);
    var epsilonInput = makeElement(api, "input", {
      id: "cl-sinkhorn-epsilon",
      type: "range",
      min: String(MIN_EPSILON),
      max: String(MAX_EPSILON),
      step: "0.1",
      value: String(DEFAULT_EPSILON),
      "aria-label": "熵正则化强度 epsilon"
    });
    refs.epsilonInput = epsilonInput;
    refs.epsilonOutput = epsilonOutput;

    function costTable() {
      var head = makeElement(api, "thead", {}, [
        makeElement(api, "tr", {}, [
          makeElement(api, "th", { scope: "col" }, ["C"]),
          makeElement(api, "th", { scope: "col" }, ["目标 1"]),
          makeElement(api, "th", { scope: "col" }, ["目标 2"]),
          makeElement(api, "th", { scope: "col" }, ["目标 3"])
        ])
      ]);
      var bodyRows = COST.map(function (row, i) {
        var cells = [
          makeElement(api, "th", { scope: "row" }, ["源 " + (i + 1)])
        ];
        row.forEach(function (value) {
          cells.push(makeElement(api, "td", {}, [String(value)]));
        });
        return makeElement(api, "tr", {}, cells);
      });
      return makeElement(api, "table", {
        className: "cl-matrix",
        "aria-label": "固定运输成本矩阵"
      }, [head, makeElement(api, "tbody", {}, bodyRows)]);
    }

    var stepButton = makeElement(api, "button", {
      type: "button",
      className: "cl-primary"
    }, ["单步迭代"]);
    var autoButton = makeElement(api, "button", {
      type: "button",
      "aria-pressed": "false"
    }, ["自动迭代"]);
    var resetButton = makeElement(api, "button", { type: "button" }, ["重置"]);
    refs.stepButton = stepButton;
    refs.autoButton = autoButton;

    function metric(label) {
      var value = makeElement(api, "strong", {}, ["—"]);
      return {
        card: makeElement(api, "div", { className: "cl-metric" }, [
          makeElement(api, "span", {}, [label]),
          value
        ]),
        value: value
      };
    }

    var iterationMetric = metric("完整迭代次数");
    var errorMetric = metric("最大边缘误差");
    var massMetric = metric("当前总质量");
    refs.iterations = iterationMetric.value;
    refs.error = errorMetric.value;
    refs.mass = massMetric.value;

    var controlSection = makeElement(
      api,
      "section",
      { className: "cl-controls", "aria-labelledby": "cl-sinkhorn-controls-title" },
      [
        makeElement(api, "h4", { id: "cl-sinkhorn-controls-title" }, ["操作台"]),
        makeElement(api, "div", { className: "cl-control" }, [
          epsilonLabel,
          epsilonInput
        ]),
        makeElement(api, "p", { className: "cl-note" }, [
          "C_ij = |位置_i − 位置_j|²。ε 越小，K_ij = exp(−C_ij/ε) 越偏好低成本格子；ε 越大，耦合越平滑。"
        ]),
        makeElement(api, "div", { className: "cl-button-row" }, [
          stepButton,
          autoButton,
          resetButton
        ]),
        makeElement(api, "div", { className: "cl-metrics" }, [
          iterationMetric.card,
          errorMetric.card,
          massMetric.card
        ]),
        makeElement(api, "h4", {}, ["固定数据"]),
        costTable(),
        makeElement(api, "p", { className: "cl-note" }, [
          "源 a = (0.5, 0.3, 0.2)，目标 b = (0.2, 0.3, 0.5)。两者总质量都为 1。"
        ])
      ]
    );

    var svg = makeSvg(api, "svg", {
      className: "cl-plot",
      viewBox: "0 0 600 300",
      role: "img",
      "aria-label": "Sinkhorn 耦合矩阵热图"
    });
    refs.svg = svg;
    refs.status = makeElement(api, "p", { className: "cl-note" }, []);
    refs.marginalTable = makeElement(api, "table", {
      className: "cl-matrix",
      "aria-label": "耦合矩阵及其行列边缘"
    });

    var stageSection = makeElement(
      api,
      "section",
      { className: "cl-stage", "aria-labelledby": "cl-sinkhorn-stage-title" },
      [
        makeElement(api, "div", { className: "cl-stage-frame" }, [
          makeElement(api, "div", { className: "cl-stage-title" }, [
            makeElement(api, "span", { id: "cl-sinkhorn-stage-title" }, [
              "π = diag(u) K diag(v)"
            ]),
            makeElement(api, "span", {}, ["颜色越深，质量越大"])
          ]),
          svg
        ]),
        refs.status,
        refs.marginalTable
      ]
    );

    var grid = makeElement(api, "div", { className: "cl-grid" }, [
      controlSection,
      stageSection
    ]);

    replaceChildren(root, [heading, intro, grid]);

    function goodClass(value, target) {
      return Math.abs(value - target) <= 1e-4 ? "cl-good" : "cl-warn";
    }

    function drawHeatmap(pi) {
      clear(svg);
      var left = 128;
      var top = 58;
      var cellWidth = 126;
      var cellHeight = 62;
      var maxValue = Math.max.apply(
        null,
        pi.reduce(function (all, row) {
          return all.concat(row);
        }, [])
      );
      maxValue = Math.max(maxValue, 1e-12);

      svg.appendChild(
        makeSvg(api, "title", {}, [
          "三乘三耦合矩阵热图；第 " + state.iterations + " 次迭代"
        ])
      );
      svg.appendChild(
        svgText(api, 300, 24, "目标分布 b", {
          "font-size": "13",
          "font-weight": "700"
        })
      );
      svg.appendChild(
        svgText(api, 30, 154, "源分布 a", {
          "font-size": "13",
          "font-weight": "700",
          transform: "rotate(-90 30 154)"
        })
      );

      for (var j = 0; j < 3; j += 1) {
        svg.appendChild(
          svgText(api, left + cellWidth * j + cellWidth / 2, 45, "目标 " + (j + 1), {
            "font-size": "12"
          })
        );
      }

      for (var i = 0; i < 3; i += 1) {
        svg.appendChild(
          svgText(api, left - 14, top + cellHeight * i + cellHeight / 2 + 4, "源 " + (i + 1), {
            "font-size": "12",
            "text-anchor": "end"
          })
        );
        for (var col = 0; col < 3; col += 1) {
          var value = pi[i][col];
          var opacity = 0.12 + 0.88 * (value / maxValue);
          var x = left + cellWidth * col;
          var y = top + cellHeight * i;
          svg.appendChild(
            makeSvg(api, "rect", {
              x: x + 3,
              y: y + 3,
              width: cellWidth - 6,
              height: cellHeight - 6,
              rx: "5",
              fill: "var(--accent, #3a5fa0)",
              "fill-opacity": opacity,
              stroke: "currentColor",
              "stroke-opacity": "0.2"
            })
          );
          svg.appendChild(
            svgText(api, x + cellWidth / 2, y + cellHeight / 2 + 5, formatNumber(api, value, 3), {
              "font-size": "14",
              "font-weight": "700"
            })
          );
        }
      }
    }

    function renderMarginals(pi) {
      var rows = rowSums(pi);
      var columns = columnSums(pi);
      var head = makeElement(api, "thead", {}, [
        makeElement(api, "tr", {}, [
          makeElement(api, "th", { scope: "col" }, ["π"]),
          makeElement(api, "th", { scope: "col" }, ["目标 1"]),
          makeElement(api, "th", { scope: "col" }, ["目标 2"]),
          makeElement(api, "th", { scope: "col" }, ["目标 3"]),
          makeElement(api, "th", { scope: "col" }, ["行和 / a_i"])
        ])
      ]);
      var body = [];

      for (var i = 0; i < 3; i += 1) {
        var rowCells = [
          makeElement(api, "th", { scope: "row" }, ["源 " + (i + 1)])
        ];
        pi[i].forEach(function (value) {
          rowCells.push(makeElement(api, "td", {}, [formatNumber(api, value, 3)]));
        });
        rowCells.push(
          makeElement(api, "td", { className: goodClass(rows[i], SOURCE[i]) }, [
            formatNumber(api, rows[i], 3) + " / " + formatNumber(api, SOURCE[i], 3)
          ])
        );
        body.push(makeElement(api, "tr", {}, rowCells));
      }

      var footerCells = [
        makeElement(api, "th", { scope: "row" }, ["列和 / b_j"])
      ];
      columns.forEach(function (value, j) {
        footerCells.push(
          makeElement(api, "td", { className: goodClass(value, TARGET[j]) }, [
            formatNumber(api, value, 3) + " / " + formatNumber(api, TARGET[j], 3)
          ])
        );
      });
      footerCells.push(makeElement(api, "td", {}, ["—"]));
      body.push(makeElement(api, "tr", {}, footerCells));
      replaceChildren(refs.marginalTable, [
        head,
        makeElement(api, "tbody", {}, body)
      ]);
    }

    function update() {
      var pi = coupling(state.k, state.u, state.v);
      var error = marginalError(pi);
      refs.epsilonOutput.textContent = formatNumber(api, state.epsilon, 1);
      refs.iterations.textContent = String(state.iterations);
      refs.error.textContent = formatNumber(api, error, 6);
      refs.mass.textContent = formatNumber(api, sum(rowSums(pi)), 4);
      refs.status.textContent =
        state.iterations === 0
          ? "第 0 步：显示未缩放的 K；点击“单步迭代”执行一次行缩放和一次列缩放。"
          : "第 " +
            state.iterations +
            " 步：行和、列和交替逼近 a、b；最大误差为 " +
            formatNumber(api, error, 6) +
            "。";
      autoButton.textContent =
        state.autoTimer === null ? "自动迭代" : "暂停自动迭代";
      autoButton.setAttribute(
        "aria-pressed",
        state.autoTimer === null ? "false" : "true"
      );
      drawHeatmap(pi);
      renderMarginals(pi);
    }

    function stopAuto() {
      if (state.autoTimer !== null) {
        window.clearInterval(state.autoTimer);
        state.autoTimer = null;
      }
    }

    function reset() {
      stopAuto();
      state.k = kernel(state.epsilon);
      state.u = [1, 1, 1];
      state.v = [1, 1, 1];
      state.iterations = 0;
      update();
    }

    function step() {
      var i;
      var j;
      for (i = 0; i < 3; i += 1) {
        var rowDenominator = 0;
        for (j = 0; j < 3; j += 1) {
          rowDenominator += state.k[i][j] * state.v[j];
        }
        state.u[i] = SOURCE[i] / Math.max(rowDenominator, 1e-300);
      }
      for (j = 0; j < 3; j += 1) {
        var columnDenominator = 0;
        for (i = 0; i < 3; i += 1) {
          columnDenominator += state.k[i][j] * state.u[i];
        }
        state.v[j] = TARGET[j] / Math.max(columnDenominator, 1e-300);
      }
      state.iterations += 1;
      update();
    }

    function toggleAuto() {
      if (state.autoTimer !== null) {
        stopAuto();
        update();
        announce(api, root, "自动迭代已暂停");
        return;
      }
      var currentPi = coupling(state.k, state.u, state.v);
      if (marginalError(currentPi) <= TOLERANCE) {
        announce(api, root, "边缘误差已低于阈值，无需继续迭代");
        return;
      }
      state.autoTimer = window.setInterval(function () {
        var pi = coupling(state.k, state.u, state.v);
        if (state.iterations >= MAX_AUTO_STEPS || marginalError(pi) <= TOLERANCE) {
          stopAuto();
          update();
          return;
        }
        step();
      }, 420);
      update();
      announce(api, root, "自动迭代开始");
    }

    epsilonInput.addEventListener("input", function () {
      var next = parseFloat(epsilonInput.value);
      if (!Number.isFinite(next)) {
        next = DEFAULT_EPSILON;
      }
      state.epsilon = Math.max(MIN_EPSILON, Math.min(MAX_EPSILON, next));
      reset();
    });

    epsilonInput.addEventListener("change", function () {
      announce(
        api,
        root,
        "ε 已设为 " + formatNumber(api, state.epsilon, 1) + "，迭代状态已重置"
      );
    });

    stepButton.addEventListener("click", function () {
      stopAuto();
      step();
      announce(
        api,
        root,
        "完成第 " + state.iterations + " 次 Sinkhorn 迭代"
      );
    });

    autoButton.addEventListener("click", toggleAuto);

    resetButton.addEventListener("click", function () {
      reset();
      announce(api, root, "已重置到未缩放的 K");
    });

    update();
  });
}());

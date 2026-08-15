(function () {
  "use strict";

  var PI = Math.PI;
  var SINGULARITY_EPSILON = 1e-8;
  var SAMPLE_COUNT = 420;
  var VIEWBOX_WIDTH = 520;
  var VIEWBOX_HEIGHT = 250;
  var PLOT_LEFT = 48;
  var PLOT_RIGHT = 500;
  var PLOT_TOP = 28;
  var PLOT_BOTTOM = 194;
  var mountCount = 0;
  var selfTestCount = 0;

  function complex(re, im) {
    return { re: re, im: im };
  }

  function sinc(value) {
    if (value === 0) {
      return 1;
    }
    if (Math.abs(value) < 1e-5) {
      var square = value * value;
      return 1 - square / 6 + (square * square) / 120;
    }
    return Math.sin(value) / value;
  }

  function rectangularSlitAmplitude(u, width) {
    return complex(width * sinc(PI * width * u), 0);
  }

  function arrayFactorAtPhase(phase, slitCount) {
    var denominator = Math.sin(phase);
    if (Math.abs(denominator) > SINGULARITY_EPSILON) {
      return Math.sin(slitCount * phase) / denominator;
    }

    // Centered equally spaced slits have a finite limit at every m*pi.
    var multiple = Math.round(phase / PI);
    var sign = Math.cos(slitCount * multiple * PI) / Math.cos(multiple * PI);
    return slitCount * sign;
  }

  function arrayFactor(u, spacing, slitCount) {
    return arrayFactorAtPhase(PI * spacing * u, slitCount);
  }

  function normalizedArrayFactor(u, spacing, slitCount) {
    return arrayFactor(u, spacing, slitCount) / slitCount;
  }

  function doubleSlitAmplitude(u, width, spacing) {
    var slit = rectangularSlitAmplitude(u, width);
    var modulation = 2 * Math.cos(PI * spacing * u);
    return complex(slit.re * modulation, slit.im * modulation);
  }

  function gratingAmplitude(u, width, spacing, slitCount) {
    var slit = rectangularSlitAmplitude(u, width);
    var factor = arrayFactor(u, spacing, slitCount);
    return complex(slit.re * factor, slit.im * factor);
  }

  function intensityFromAmplitude(amplitude) {
    return amplitude.re * amplitude.re + amplitude.im * amplitude.im;
  }

  function amplitudeFor(pattern, u, width, spacing, slitCount) {
    if (pattern === "single") {
      return rectangularSlitAmplitude(u, width);
    }
    if (pattern === "double") {
      return doubleSlitAmplitude(u, width, spacing);
    }
    return gratingAmplitude(u, width, spacing, slitCount);
  }

  function normalizedAmplitude(pattern, u, width, spacing, slitCount) {
    var amplitude = amplitudeFor(pattern, u, width, spacing, slitCount);
    var onAxis = amplitudeFor(pattern, 0, width, spacing, slitCount);
    return complex(amplitude.re / onAxis.re, amplitude.im / onAxis.re);
  }

  function normalizedIntensity(pattern, u, width, spacing, slitCount) {
    return intensityFromAmplitude(
      normalizedAmplitude(pattern, u, width, spacing, slitCount)
    );
  }

  function apertureCenters(pattern, spacing, slitCount) {
    if (pattern === "single") {
      return [0];
    }
    if (pattern === "double") {
      return [-spacing / 2, spacing / 2];
    }
    var centers = [];
    for (var index = 0; index < slitCount; index += 1) {
      centers.push((index - (slitCount - 1) / 2) * spacing);
    }
    return centers;
  }

  function patternCount(pattern, slitCount) {
    return pattern === "single" ? 1 : pattern === "double" ? 2 : slitCount;
  }

  function formatNumber(api, value, digits) {
    if (api && typeof api.format === "function") {
      return api.format(value, digits);
    }
    if (!Number.isFinite(value)) {
      return "-";
    }
    return value.toFixed(digits === undefined ? 2 : digits).replace(/0+$/, "").replace(/\.$/, "");
  }

  function assertClose(actual, expected, message, tolerance) {
    selfTestCount += 1;
    var allowed = tolerance === undefined ? 1e-9 : tolerance;
    if (!Number.isFinite(actual) || Math.abs(actual - expected) > allowed) {
      throw new Error(
        message + " (expected " + expected + ", got " + actual + ")"
      );
    }
  }

  function assertTrue(condition, message) {
    selfTestCount += 1;
    if (!condition) {
      throw new Error(message);
    }
  }

  function runSelfTests() {
    selfTestCount = 0;
    var width = 0.4;
    var spacing = 1.3;
    var slitCount = 5;

    assertClose(sinc(0), 1, "sinc limit at zero");
    assertClose(sinc(1e-7), 1, "sinc small-argument limit", 1e-12);
    assertClose(sinc(-0.73), sinc(0.73), "sinc symmetry");
    assertClose(sinc(PI), 0, "sinc zero at pi", 1e-15);
    assertClose(sinc(-PI), 0, "sinc zero at -pi", 1e-15);

    assertClose(
      rectangularSlitAmplitude(0, width).re,
      width,
      "rectangular slit on-axis amplitude"
    );
    assertClose(
      normalizedIntensity("single", -0.61, width, spacing, slitCount),
      normalizedIntensity("single", 0.61, width, spacing, slitCount),
      "single-slit intensity symmetry"
    );

    var doubleZero = 1 / (2 * spacing);
    assertClose(
      doubleSlitAmplitude(doubleZero, width, spacing).re,
      0,
      "double-slit cosine zero",
      1e-12
    );
    assertClose(
      normalizedIntensity("double", -0.47, width, spacing, slitCount),
      normalizedIntensity("double", 0.47, width, spacing, slitCount),
      "double-slit intensity symmetry"
    );

    assertClose(
      arrayFactor(0, spacing, slitCount),
      slitCount,
      "grating array-factor limit at zero"
    );
    for (var order = -2; order <= 2; order += 1) {
      var maximum = arrayFactor(order / spacing, spacing, slitCount);
      var expectedSign =
        Math.cos(slitCount * order * PI) / Math.cos(order * PI);
      assertClose(
        maximum,
        slitCount * expectedSign,
        "grating maximum at order " + order
      );
      assertClose(
        normalizedArrayFactor(order / spacing, spacing, slitCount),
        expectedSign,
        "normalized grating maximum at order " + order
      );
    }
    assertClose(
      normalizedIntensity("grating", 0, width, spacing, slitCount),
      1,
      "normalized grating on-axis intensity"
    );
    assertClose(
      normalizedIntensity(
        "grating",
        1 / spacing,
        width,
        spacing,
        slitCount
      ),
      sinc(PI * width / spacing) * sinc(PI * width / spacing),
      "finite-slit envelope at a grating maximum"
    );
    assertClose(
      normalizedIntensity("grating", 1 / width, width, spacing, slitCount),
      0,
      "finite-slit envelope zero",
      1e-12
    );

    assertClose(
      normalizedIntensity("single", 1 / width, width, spacing, slitCount),
      0,
      "single-slit first zero",
      1e-12
    );
    assertTrue(
      normalizedIntensity("single", 2, 0.2, spacing, slitCount) >
        normalizedIntensity("single", 2, 0.6, spacing, slitCount),
      "narrower slit has broader fixed-u envelope"
    );
    assertClose(
      normalizedArrayFactor(1 / (slitCount * spacing), spacing, slitCount),
      0,
      "first array-factor zero",
      1e-12
    );

    return { checks: selfTestCount };
  }

  function makeElement(api, tag, attrs, children) {
    return api.el(tag, attrs || {}, children);
  }

  function makeSvg(api, tag, attrs, children) {
    return api.svg(tag, attrs || {}, children);
  }

  function clear(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function text(api, x, y, value, attrs) {
    var merged = Object.assign(
      {
        x: x,
        y: y,
        fill: "currentColor",
        "font-size": "11",
        "text-anchor": "middle"
      },
      attrs || {}
    );
    return makeSvg(api, "text", merged, [value]);
  }

  function plotScale(value, min, max) {
    return PLOT_LEFT + ((value - min) / (max - min)) * (PLOT_RIGHT - PLOT_LEFT);
  }

  function appendAxis(api, svg, xMin, xMax, yLabel, xLabel, yTicks) {
    var children = [];
    var yRange = yTicks[yTicks.length - 1] || 1;
    yTicks.forEach(function (tick) {
      var y = PLOT_BOTTOM - (tick / yRange) * (PLOT_BOTTOM - PLOT_TOP);
      children.push(
        makeSvg(api, "line", {
          x1: PLOT_LEFT,
          y1: y,
          x2: PLOT_RIGHT,
          y2: y,
          stroke: "currentColor",
          "stroke-opacity": tick === 0 ? "0.34" : "0.12"
        }),
        text(api, PLOT_LEFT - 8, y + 4, formatNumber(api, tick, 1), {
          "text-anchor": "end",
          "font-size": "10"
        })
      );
    });

    [-1, 0, 1].forEach(function (fraction) {
      var value = fraction === -1 ? xMin : fraction === 0 ? 0 : xMax;
      var x = plotScale(value, xMin, xMax);
      children.push(
        makeSvg(api, "line", {
          x1: x,
          y1: PLOT_TOP,
          x2: x,
          y2: PLOT_BOTTOM,
          stroke: "currentColor",
          "stroke-opacity": "0.1"
        }),
        text(api, x, PLOT_BOTTOM + 20, formatNumber(api, value, 1), {
          "font-size": "10"
        })
      );
    });

    children.push(
      makeSvg(api, "line", {
        x1: PLOT_LEFT,
        y1: PLOT_BOTTOM,
        x2: PLOT_RIGHT,
        y2: PLOT_BOTTOM,
        stroke: "currentColor",
        "stroke-width": "1.3"
      }),
      text(api, PLOT_LEFT, PLOT_TOP - 9, yLabel, {
        "text-anchor": "start",
        "font-size": "11"
      }),
      text(api, PLOT_RIGHT, PLOT_BOTTOM + 39, xLabel, {
        "text-anchor": "end",
        "font-size": "10"
      })
    );
    return children;
  }

  function plotSvg(api, uid, title, description) {
    return makeSvg(api, "svg", {
      viewBox: "0 0 " + VIEWBOX_WIDTH + " " + VIEWBOX_HEIGHT,
      role: "img",
      "aria-labelledby": uid + "-title " + uid + "-desc",
      preserveAspectRatio: "xMidYMid meet"
    }, [
      makeSvg(api, "title", { id: uid + "-title" }, [title]),
      makeSvg(api, "desc", { id: uid + "-desc" }, [description])
    ]);
  }

  function drawAperture(api, svg, state) {
    clear(svg);
    var count = patternCount(state.pattern, state.slitCount);
    var centers = apertureCenters(state.pattern, state.spacing, state.slitCount);
    var extent = state.pattern === "single" ? 1 : state.pattern === "double" ? 2.2 : 10.5;
    var title =
      state.pattern === "single"
        ? "单缝孔径透射"
        : state.pattern === "double"
          ? "双缝孔径透射"
          : "光栅孔径透射";
    var description =
      "横轴是无量纲孔径坐标 xi=x/a；蓝色矩形表示 " +
      count +
      " 个透射缝，缝宽 w=" +
      state.width.toFixed(2) +
      "，中心距 d=" +
      state.spacing.toFixed(2) +
      "。";
    var chart = plotSvg(api, "fo-" + state.uid + "-aperture", title, description);
    appendAxis(api, chart, -extent, extent, "t(xi)", "xi = x/a", [0, 1]).forEach(function (node) {
      chart.appendChild(node);
    });
    var y = PLOT_BOTTOM - (PLOT_BOTTOM - PLOT_TOP) * 0.84;
    var height = (PLOT_BOTTOM - PLOT_TOP) * 0.84;
    centers.forEach(function (center, index) {
      var x = plotScale(center - state.width / 2, -extent, extent);
      var right = plotScale(center + state.width / 2, -extent, extent);
      chart.appendChild(
        makeSvg(api, "rect", {
          x: x,
          y: y,
          width: Math.max(1, right - x),
          height: height,
          fill: "var(--accent, #315f9d)",
          "fill-opacity": "0.78",
          stroke: "currentColor",
          "stroke-width": "1"
        })
      );
      if (index === 0 && centers.length === 1) {
        chart.appendChild(text(api, (x + right) / 2, y - 8, "w", { "font-size": "10" }));
      }
    });
    chart.appendChild(
      text(api, PLOT_LEFT + 8, y + 15, "透射 = 1", {
        "text-anchor": "start",
        "font-size": "10"
      })
    );
    svg.appendChild(chart.firstChild);
    while (chart.firstChild) {
      svg.appendChild(chart.firstChild);
    }
  }

  function drawIntensity(api, svg, state) {
    clear(svg);
    var uMax = 9;
    var title = "远场归一化强度";
    var description =
      "横轴是无量纲观察坐标 u=(a/lambda)sin(theta)；曲线是归一化强度 I(u)/I(0)，由复振幅的模平方计算。";
    var chart = plotSvg(api, "fo-" + state.uid + "-intensity", title, description);
    appendAxis(api, chart, -uMax, uMax, "I(u)/I(0)", "u = (a/lambda) sin(theta)", [0, 0.5, 1]).forEach(function (node) {
      chart.appendChild(node);
    });

    var firstZero = 1 / state.width;
    if (firstZero < uMax) {
      [-firstZero, firstZero].forEach(function (zero) {
        var zeroX = plotScale(zero, -uMax, uMax);
        chart.appendChild(
          makeSvg(api, "line", {
            x1: zeroX,
            y1: PLOT_TOP,
            x2: zeroX,
            y2: PLOT_BOTTOM,
            stroke: "var(--cl-gold, #9b6a12)",
            "stroke-dasharray": "4 4",
            "stroke-opacity": "0.72"
          }),
          text(api, zeroX, PLOT_TOP + 12, "±1/w", {
            "font-size": "9",
            fill: "var(--cl-gold, #9b6a12)"
          })
        );
      });
    }
    if (state.pattern !== "single") {
      for (var order = -4; order <= 4; order += 1) {
        if (order === 0) {
          continue;
        }
        var maximum = order / state.spacing;
        if (Math.abs(maximum) > uMax) {
          continue;
        }
        var maximumX = plotScale(maximum, -uMax, uMax);
        chart.appendChild(
          makeSvg(api, "line", {
            x1: maximumX,
            y1: PLOT_TOP + 20,
            x2: maximumX,
            y2: PLOT_BOTTOM,
            stroke: "var(--cl-red, #b64335)",
            "stroke-dasharray": "2 4",
            "stroke-opacity": "0.35"
          })
        );
      }
    }

    var path = "";
    for (var index = 0; index <= SAMPLE_COUNT; index += 1) {
      var u = -uMax + (2 * uMax * index) / SAMPLE_COUNT;
      var intensity = Math.min(
        1.05,
        normalizedIntensity(
          state.pattern,
          u,
          state.width,
          state.spacing,
          state.slitCount
        )
      );
      var x = plotScale(u, -uMax, uMax);
      var y = PLOT_BOTTOM - (intensity / 1.05) * (PLOT_BOTTOM - PLOT_TOP);
      path += (index === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2) + " ";
    }
    chart.appendChild(
      makeSvg(api, "path", {
        d: path,
        fill: "none",
        stroke: "var(--accent, #315f9d)",
        "stroke-width": "2.4",
        "stroke-linejoin": "round"
      })
    );
    chart.appendChild(text(api, PLOT_LEFT + 8, PLOT_TOP + 15, "强度 = |A|²", {
      "text-anchor": "start",
      "font-size": "10"
    }));
    while (chart.firstChild) {
      svg.appendChild(chart.firstChild);
    }
  }

  function makeMetric(api, label, value) {
    return makeElement(api, "div", { className: "cl-metric" }, [
      makeElement(api, "span", {}, [label]),
      makeElement(api, "strong", {}, [value])
    ]);
  }

  function formulaText(state) {
    if (state.pattern === "single") {
      return "A1(u) = sinc(pi*w*u)\nI(u)/I(0) = |A1(u)|^2";
    }
    if (state.pattern === "double") {
      return "A2(u) = sinc(pi*w*u) * cos(pi*d*u)\nI(u)/I(0) = |A2(u)|^2";
    }
    return "AN(u) = sinc(pi*w*u) * sin(N*pi*d*u)/(N*sin(pi*d*u))\nI(u)/I(0) = |AN(u)|^2\nAt sin(pi*d*u)=0 use the continuous limit.";
  }

  function createChoice(api, uid, name, value, labelText) {
    var id = uid + "-" + name + "-" + value;
    var input = makeElement(api, "input", {
      type: "radio",
      id: id,
      name: name,
      value: value
    });
    return makeElement(api, "label", {
      htmlFor: id,
      style: "display:flex;align-items:center;gap:8px;min-height:44px;padding:3px 0;overflow-wrap:anywhere;"
    }, [input, labelText]);
  }

  function selectedValue(form, name) {
    var selected = form.querySelector('input[name="' + name + '"]:checked');
    return selected ? selected.value : "";
  }

  function register(CourseLearning) {
    if (!CourseLearning || typeof CourseLearning.register !== "function") {
      return;
    }
    CourseLearning.register("fourier-optics", function (root, api) {
      mount(root, api);
    });
  }

  function mount(root, api) {
    mountCount += 1;
    var uid = "fourier-optics-" + mountCount;
    var state = {
      uid: uid,
      pattern: "double",
      width: 0.42,
      spacing: 1.4,
      slitCount: 5
    };

    clear(root);
    root.setAttribute("aria-labelledby", uid + "-heading");

    var heading = makeElement(api, "h3", { id: uid + "-heading" }, [
      "归一化一维夫琅禾费实验台"
    ]);
    var intro = makeElement(api, "p", { className: "cl-note" }, [
      "先在上方提交预测，再改变参数。蓝色图形分别表示孔径透射和归一化远场强度；坐标都没有单位。"
    ]);

    var predictionForm = makeElement(api, "form", {
      className: "cl-prompt",
      "aria-describedby": uid + "-prediction-note"
    });
    predictionForm.appendChild(
      makeElement(api, "p", { id: uid + "-prediction-note" }, [
        makeElement(api, "strong", {}, ["先预测，答案提交后揭示"]),
        "：不要把归一化峰值与实际通光量混为一谈。"
      ])
    );
    var widthFieldset = makeElement(api, "fieldset", {
      style: "border:0;padding:0;margin:0 0 10px;"
    }, [
      makeElement(api, "legend", {}, ["缝宽 w 变小后，中央包络如何变化？"]),
      createChoice(api, uid, "width-prediction", "wider", "中央主瓣变宽，首零点移得更远"),
      createChoice(api, uid, "width-prediction", "narrower", "中央主瓣变窄，首零点移得更近"),
      createChoice(api, uid, "width-prediction", "same", "形状和首零点都不变")
    ]);
    var spacingFieldset = makeElement(api, "fieldset", {
      style: "border:0;padding:0;margin:0 0 10px;"
    }, [
      makeElement(api, "legend", {}, ["中心距 d 变大后，双缝条纹间距如何变化？"]),
      createChoice(api, uid, "spacing-prediction", "closer", "条纹变密，Δu=1/d 变小"),
      createChoice(api, uid, "spacing-prediction", "farther", "条纹变疏，Δu=1/d 变大"),
      createChoice(api, uid, "spacing-prediction", "same", "条纹间距不变")
    ]);
    var submitButton = makeElement(api, "button", {
      type: "submit",
      className: "cl-primary"
    }, ["提交预测并揭示"]);
    var resetButton = makeElement(api, "button", {
      type: "button"
    }, ["重置实验"]);
    var buttonRow = makeElement(api, "div", { className: "cl-button-row" }, [
      submitButton,
      resetButton
    ]);
    var feedback = makeElement(api, "p", {
      className: "cl-note",
      role: "status",
      "aria-live": "polite",
      hidden: true
    });
    predictionForm.appendChild(widthFieldset);
    predictionForm.appendChild(spacingFieldset);
    predictionForm.appendChild(buttonRow);
    predictionForm.appendChild(feedback);

    var patternSelect = makeElement(api, "select", { id: uid + "-pattern" }, [
      makeElement(api, "option", { value: "single" }, ["单缝"]),
      makeElement(api, "option", { value: "double", selected: true }, ["双缝"]),
      makeElement(api, "option", { value: "grating" }, ["N 缝光栅"])
    ]);
    var widthInput = makeElement(api, "input", {
      id: uid + "-width",
      type: "range",
      min: "0.12",
      max: "0.72",
      step: "0.02",
      value: state.width,
      "aria-label": "单缝归一化宽度 w"
    });
    var widthOutput = makeElement(api, "output", { for: uid + "-width" }, ["-"]);
    var spacingInput = makeElement(api, "input", {
      id: uid + "-spacing",
      type: "range",
      min: "0.85",
      max: "2.40",
      step: "0.05",
      value: state.spacing,
      "aria-label": "归一化中心距 d"
    });
    var spacingOutput = makeElement(api, "output", { for: uid + "-spacing" }, ["-"]);
    var countInput = makeElement(api, "input", {
      id: uid + "-count",
      type: "range",
      min: "3",
      max: "8",
      step: "1",
      value: state.slitCount,
      "aria-label": "光栅缝数 N"
    });
    var countOutput = makeElement(api, "output", { for: uid + "-count" }, ["-"]);

    function labeledControl(label, input, output) {
      return makeElement(api, "div", { className: "cl-control" }, [
        makeElement(api, "label", { className: "cl-label", htmlFor: input.id }, [
          label,
          " = ",
          output
        ]),
        input
      ]);
    }

    var controls = makeElement(api, "div", { className: "cl-controls" }, [
      makeElement(api, "div", { className: "cl-control" }, [
        makeElement(api, "label", { className: "cl-label", htmlFor: patternSelect.id }, ["孔径类型"]),
        patternSelect
      ]),
      labeledControl("缝宽 w", widthInput, widthOutput),
      labeledControl("中心距 d", spacingInput, spacingOutput),
      labeledControl("缝数 N", countInput, countOutput)
    ]);
    var modelNote = makeElement(api, "div", { className: "cl-note" }, [
      makeElement(api, "p", {}, ["模型：" ]),
      makeElement(api, "div", { className: "cl-formula", "aria-label": "当前复振幅和强度公式" }, [formulaText(state)]),
      makeElement(api, "p", {}, ["A 是复场振幅；右图只画 I/I(0)=|A|²。阵因子分母为零时使用可去奇点极限。"])
    ]);
    var controlGrid = makeElement(api, "div", { className: "cl-grid" }, [
      controls,
      modelNote
    ]);

    var apertureSvg = plotSvg(api, uid + "-aperture-initial", "", "");
    var intensitySvg = plotSvg(api, uid + "-intensity-initial", "", "");
    var apertureStage = makeElement(api, "div", { className: "cl-stage" }, [
      makeElement(api, "div", { className: "cl-stage-frame" }, [
        makeElement(api, "div", { className: "cl-stage-title" }, [
          makeElement(api, "strong", {}, ["孔径透射 t(ξ)"]),
          makeElement(api, "span", {}, ["ξ = x/a"])
        ]),
        apertureSvg
      ])
    ]);
    var intensityStage = makeElement(api, "div", { className: "cl-stage" }, [
      makeElement(api, "div", { className: "cl-stage-frame" }, [
        makeElement(api, "div", { className: "cl-stage-title" }, [
          makeElement(api, "strong", {}, ["远场强度 I(u)/I(0)"]),
          makeElement(api, "span", {}, ["u 无量纲"])
        ]),
        intensitySvg
      ])
    ]);
    var plotGrid = makeElement(api, "div", { className: "cl-grid" }, [
      apertureStage,
      intensityStage
    ]);
    var metrics = makeElement(api, "div", { className: "cl-metrics" });
    var status = makeElement(api, "p", {
      className: "cl-note",
      role: "status",
      "aria-live": "polite"
    });

    root.appendChild(heading);
    root.appendChild(intro);
    root.appendChild(predictionForm);
    var bench = makeElement(api, "div", { hidden: true }, [
      controlGrid,
      plotGrid,
      metrics,
      status
    ]);
    root.appendChild(bench);

    function update() {
      state.pattern = patternSelect.value;
      state.width = Number(widthInput.value);
      state.spacing = Number(spacingInput.value);
      state.slitCount = Number(countInput.value);
      widthOutput.textContent = state.width.toFixed(2);
      spacingOutput.textContent = state.spacing.toFixed(2);
      countOutput.textContent = String(state.slitCount);
      spacingInput.disabled = state.pattern === "single";
      countInput.disabled = state.pattern !== "grating";
      modelNote.querySelector(".cl-formula").textContent = formulaText(state);
      drawAperture(api, apertureSvg, state);
      drawIntensity(api, intensitySvg, state);
      clear(metrics);
      metrics.appendChild(
        makeMetric(api, "单缝首零点 |u|", formatNumber(api, 1 / state.width, 2))
      );
      if (state.pattern !== "single") {
        metrics.appendChild(
          makeMetric(api, "阵因子级次间距 Δu", formatNumber(api, 1 / state.spacing, 2))
        );
      } else {
        metrics.appendChild(makeMetric(api, "归一化中心强度", "1"));
      }
      metrics.appendChild(
        makeMetric(api, "当前缝数", String(patternCount(state.pattern, state.slitCount)))
      );
      var label = state.pattern === "single" ? "单缝" : state.pattern === "double" ? "双缝" : "N 缝光栅";
      status.textContent =
        label +
        "：w=" +
        state.width.toFixed(2) +
        "，d=" +
        state.spacing.toFixed(2) +
        "，N=" +
        state.slitCount +
        "。窄缝使有限宽度包络变宽；增大 d 使阵因子条纹在 u 轴上变密。";
    }

    predictionForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var widthAnswer = selectedValue(predictionForm, "width-prediction");
      var spacingAnswer = selectedValue(predictionForm, "spacing-prediction");
      if (!widthAnswer || !spacingAnswer) {
        feedback.hidden = false;
        feedback.textContent = "请先完成两个预测；答案仍未揭示。";
        return;
      }
      var widthCorrect = widthAnswer === "wider";
      var spacingCorrect = spacingAnswer === "closer";
      feedback.hidden = false;
      bench.hidden = false;
      feedback.textContent =
        (widthCorrect && spacingCorrect ? "两个预测都对。" : "答案揭示：") +
        "缝宽变窄使首零点 |u|=1/w 变大，中央包络变宽，但未归一化通光量下降；中心距变大使 Δu=1/d 变小，条纹变密，有限缝宽的 sinc 包络不随 d 移动。";
      if (api && typeof api.announce === "function") {
        api.announce(root, "预测已提交，答案和原因已经显示。");
      }
    });

    resetButton.addEventListener("click", function () {
      patternSelect.value = "double";
      widthInput.value = "0.42";
      spacingInput.value = "1.40";
      countInput.value = "5";
      predictionForm.reset();
      feedback.hidden = true;
      feedback.textContent = "";
      bench.hidden = true;
      update();
      if (api && typeof api.announce === "function") {
        api.announce(root, "实验已重置；预测答案再次隐藏。");
      }
    });
    patternSelect.addEventListener("change", update);
    widthInput.addEventListener("input", update);
    spacingInput.addEventListener("input", update);
    countInput.addEventListener("input", update);

    update();
    if (api && typeof api.announce === "function") {
      api.announce(root, "傅里叶光学实验已加载；答案隐藏，先完成两个预测。");
    }
  }

  var exported = {
    sinc: sinc,
    rectangularSlitAmplitude: rectangularSlitAmplitude,
    singleSlitAmplitude: rectangularSlitAmplitude,
    arrayFactor: arrayFactor,
    normalizedArrayFactor: normalizedArrayFactor,
    doubleSlitAmplitude: doubleSlitAmplitude,
    gratingAmplitude: gratingAmplitude,
    intensityFromAmplitude: intensityFromAmplitude,
    normalizedAmplitude: normalizedAmplitude,
    normalizedIntensity: normalizedIntensity,
    apertureCenters: apertureCenters,
    runSelfTests: runSelfTests,
    register: register
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exported;
  }
  if (typeof window !== "undefined" && window.CourseLearning) {
    register(window.CourseLearning);
  }
  if (
    typeof require === "function" &&
    typeof module !== "undefined" &&
    require.main === module
  ) {
    var report = runSelfTests();
    process.stdout.write("fourier-optics self-test: PASS (" + report.checks + " checks)\n");
  }
})();

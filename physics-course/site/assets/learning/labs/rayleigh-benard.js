(function () {
  "use strict";

  if (
    !window.CourseLearning ||
    typeof window.CourseLearning.register !== "function"
  ) {
    return;
  }

  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var PI = Math.PI;
  var A_CRITICAL = PI / Math.sqrt(2);
  var RA_CRITICAL = 27 * Math.pow(PI, 4) / 4;
  var A_MIN = 0.8;
  var A_MAX = 5.8;
  var RA_MIN = 400;
  var RA_MAX = 1400;
  var TIME_MAX = 12;
  var G = 1.2;
  var DISPLAY_LENGTH = 10;

  var PRESETS = [
    {
      id: "subcritical",
      label: "亚临界衰减",
      ra: 500,
      a: A_CRITICAL,
      a0: 0.65,
      time: 5,
      description: "Ra 低于中性值：振幅确定性衰减"
    },
    {
      id: "critical",
      label: "临界模式",
      ra: RA_CRITICAL,
      a: A_CRITICAL,
      a0: 0.4,
      time: 6,
      description: "落在自由滑移解析临界点：正规形控制量为零"
    },
    {
      id: "selected",
      label: "超临界选模",
      ra: 900,
      a: A_CRITICAL,
      a0: 0.12,
      time: 5,
      description: "Ra 高于最低点且 a 接近最优值：振幅趋向饱和"
    },
    {
      id: "restabilized",
      label: "离开最优波数后重新稳定",
      ra: 900,
      a: 4.4,
      a0: 0.55,
      time: 5,
      description: "同一个 Ra 下把 a 移到中性曲线之上：该模式重新稳定"
    }
  ];

  function setAttrs(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else node.setAttribute(key, value === true ? "" : String(value));
    });
    return node;
  }

  function element(doc, tag, attrs, text) {
    var node = doc.createElement(tag);
    setAttrs(node, attrs);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function svgElement(doc, tag, attrs, text) {
    var node = doc.createElementNS(SVG_NS, tag);
    setAttrs(node, attrs);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function append(parent, child) {
    parent.appendChild(child);
    return child;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

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
    if (api && typeof api.format === "function") {
      return api.format(value, digits);
    }
    if (!finite(value)) return "—";
    var places = digits === undefined ? 3 : digits;
    var text = value.toFixed(places);
    return text.indexOf(".") === -1
      ? text
      : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function signed(api, value, digits) {
    if (Math.abs(value) < 0.5 * Math.pow(10, -(digits || 3))) return "0";
    return value > 0 ? "+" + format(api, value, digits) : format(api, value, digits);
  }

  function neutralRayleigh(a) {
    var a2 = a * a;
    return Math.pow(a2 + PI * PI, 3) / a2;
  }

  function controlMu(ra, a) {
    return ra / neutralRayleigh(a) - 1;
  }

  /*
   * The normal form is integrated analytically.  Writing q=A^2 gives
   * q' = 2 mu q - 2 g q^2, so the expression below is the stable logistic
   * solution for any sign of mu.  tau is a dimensionless model time, not a
   * dimensional growth-rate clock.
   */
  function amplitudeAt(mu, g, initial, time) {
    var q0 = Math.max(0, initial * initial);
    if (q0 === 0 || time <= 0) return Math.sqrt(q0);
    if (Math.abs(mu) < 1e-8) {
      return Math.sqrt(q0 / (1 + 2 * g * q0 * time));
    }
    var exponential = Math.exp(2 * mu * time);
    var denominator = 1 + (g * q0 / mu) * (exponential - 1);
    if (!finite(denominator) || denominator <= 0) {
      return mu > 0 ? Math.sqrt(Math.max(mu / g, 0)) : 0;
    }
    return Math.sqrt(Math.max(0, q0 * exponential / denominator));
  }

  function saturation(mu, g) {
    return Math.sqrt(Math.max(mu / g, 0));
  }

  function regime(mu) {
    if (mu > 1e-4) return "按该近临界正规形，该模式超临界且会向有限振幅靠近";
    if (mu < -1e-4) return "按该近临界正规形，该模式亚临界并衰减回静止态";
    return "该模式处在中性边界；正规形的一次项消失";
  }

  function setRangeValue(control, value) {
    control.input.value = String(value);
  }

  function makeRange(doc, id, label, min, max, step, value, refs) {
    var wrapper = element(doc, "label", { className: "cl-control", htmlFor: id });
    var labelLine = element(doc, "span");
    labelLine.appendChild(doc.createTextNode(label + "："));
    var output = element(doc, "output", { for: id });
    labelLine.appendChild(output);
    var input = element(doc, "input", {
      id: id,
      type: "range",
      min: min,
      max: max,
      step: step,
      value: value,
      "aria-label": label
    });
    wrapper.appendChild(labelLine);
    wrapper.appendChild(input);
    refs[id] = { input: input, output: output };
    return wrapper;
  }

  function metric(doc, parent, label, refs, key) {
    var box = element(doc, "div", { className: "cl-metric" });
    var labelNode = element(doc, "span", {}, label);
    var valueNode = element(doc, "strong", { "aria-live": "polite" }, "—");
    box.appendChild(labelNode);
    box.appendChild(valueNode);
    parent.appendChild(box);
    refs[key] = valueNode;
  }

  function chartPanel(doc, id, title, svg, note) {
    var section = element(doc, "section", {
      className: "cl-stage",
      "aria-labelledby": id + "-title"
    });
    var titleNode = element(doc, "h4", { id: id + "-title" }, title);
    var frame = element(doc, "div", {
      className: "cl-stage-frame",
      style: "max-width:100%; overflow:hidden;"
    });
    var scroll = element(doc, "div", {
      style: "max-width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch;"
    });
    svg.setAttribute("style", "display:block; width:100%; min-width:620px; height:auto;");
    scroll.appendChild(svg);
    frame.appendChild(scroll);
    section.appendChild(titleNode);
    section.appendChild(frame);
    if (note) section.appendChild(element(doc, "p", { className: "cl-note" }, note));
    return section;
  }

  function addSvgTitle(doc, svg, titleId, descId, title, description) {
    append(svg, svgElement(doc, "title", { id: titleId }, title));
    append(svg, svgElement(doc, "desc", { id: descId }, description));
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-labelledby", titleId + " " + descId);
  }

  function drawAxis(doc, svg, left, top, right, bottom, xTicks, yTicks, xScale, yScale, xLabel, yLabel) {
    xTicks.forEach(function (tick) {
      var x = xScale(tick);
      append(svg, svgElement(doc, "line", {
        x1: x, y1: top, x2: x, y2: bottom,
        stroke: "var(--border)", "stroke-width": 1, "stroke-dasharray": "2 5",
        opacity: 0.72
      }));
      append(svg, svgElement(doc, "text", {
        x: x, y: bottom + 21, "text-anchor": "middle",
        "font-size": 12, fill: "var(--fg-soft)"
      }, format(null, tick, 1)));
    });
    yTicks.forEach(function (tick) {
      var y = yScale(tick);
      append(svg, svgElement(doc, "line", {
        x1: left, y1: y, x2: right, y2: y,
        stroke: "var(--border)", "stroke-width": 1, "stroke-dasharray": "2 5",
        opacity: 0.72
      }));
      append(svg, svgElement(doc, "text", {
        x: left - 10, y: y + 4, "text-anchor": "end",
        "font-size": 12, fill: "var(--fg-soft)"
      }, format(null, tick, tick >= 1000 ? 0 : 0)));
    });
    append(svg, svgElement(doc, "line", {
      x1: left, y1: bottom, x2: right, y2: bottom,
      stroke: "var(--fg-soft)", "stroke-width": 1.35
    }));
    append(svg, svgElement(doc, "line", {
      x1: left, y1: top, x2: left, y2: bottom,
      stroke: "var(--fg-soft)", "stroke-width": 1.35
    }));
    append(svg, svgElement(doc, "text", {
      x: (left + right) / 2, y: bottom + 43, "text-anchor": "middle",
      "font-size": 13, fill: "var(--fg)"
    }, xLabel));
    append(svg, svgElement(doc, "text", {
      x: 17, y: (top + bottom) / 2, "text-anchor": "middle",
      "font-size": 13, fill: "var(--fg)",
      transform: "rotate(-90 17 " + ((top + bottom) / 2) + ")"
    }, yLabel));
  }

  function pathFor(points) {
    if (!points.length) return "";
    return points.map(function (point, index) {
      return (index === 0 ? "M" : "L") + point[0].toFixed(2) + "," + point[1].toFixed(2);
    }).join(" ");
  }

  function drawNeutral(svg, state, ids) {
    var doc = svg.ownerDocument;
    var width = 760;
    var height = 390;
    var left = 75;
    var right = 724;
    var top = 28;
    var bottom = 303;
    var yMax = 2600;
    var xScale = function (a) {
      return left + (a - A_MIN) / (A_MAX - A_MIN) * (right - left);
    };
    var yScale = function (ra) {
      return bottom - clamp(ra, 0, yMax) / yMax * (bottom - top);
    };
    clear(svg);
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    addSvgTitle(
      doc,
      svg,
      ids + "-title",
      ids + "-desc",
      "自由滑移边界的 Rayleigh–Bénard 中性曲线",
      "曲线表示 Ra_N(a)。圆点是当前 Ra 与 a，绿色标记是曲线最低点；点在曲线之上时该模式的 mu 为正。"
    );
    drawAxis(
      doc,
      svg,
      left,
      top,
      right,
      bottom,
      [1, 2, 3, 4, 5],
      [0, 500, 1000, 1500, 2000, 2500],
      xScale,
      yScale,
      "水平无量纲波数 a",
      "Ra"
    );

    var curve = [];
    for (var i = 0; i <= 240; i += 1) {
      var a = A_MIN + (A_MAX - A_MIN) * i / 240;
      curve.push([xScale(a), yScale(neutralRayleigh(a))]);
    }
    append(svg, svgElement(doc, "path", {
      d: pathFor(curve),
      fill: "none",
      stroke: "var(--rb-current)",
      "stroke-width": 3
    }));

    var criticalX = xScale(A_CRITICAL);
    var criticalY = yScale(RA_CRITICAL);
    append(svg, svgElement(doc, "line", {
      x1: criticalX, y1: criticalY, x2: criticalX, y2: bottom,
      stroke: "var(--rb-stable)", "stroke-width": 1.2, "stroke-dasharray": "4 4",
      opacity: 0.78
    }));
    append(svg, svgElement(doc, "circle", {
      cx: criticalX, cy: criticalY, r: 6,
      fill: "var(--rb-stable)", stroke: "var(--bg)", "stroke-width": 2
    }));
    append(svg, svgElement(doc, "text", {
      x: criticalX + 9, y: criticalY - 13,
      "font-size": 12.5, fill: "var(--rb-stable)"
    }, "最低点 (a_c, Ra_c)"));

    var currentX = xScale(state.a);
    var currentNeutral = neutralRayleigh(state.a);
    var currentY = yScale(state.ra);
    var neutralY = yScale(currentNeutral);
    append(svg, svgElement(doc, "line", {
      x1: currentX, y1: bottom, x2: currentX, y2: currentY,
      stroke: "var(--rb-current)", "stroke-width": 1.1, "stroke-dasharray": "3 5",
      opacity: 0.72
    }));
    append(svg, svgElement(doc, "line", {
      x1: currentX, y1: currentY, x2: currentX, y2: neutralY,
      stroke: state.mu >= 0 ? "var(--rb-warn)" : "var(--rb-stable)",
      "stroke-width": 2, "stroke-dasharray": "5 4", opacity: 0.84
    }));
    append(svg, svgElement(doc, "circle", {
      cx: currentX, cy: neutralY, r: 5,
      fill: "var(--bg)", stroke: "var(--rb-current)", "stroke-width": 2
    }));
    append(svg, svgElement(doc, "circle", {
      cx: currentX, cy: currentY, r: 7,
      fill: state.mu > 1e-4 ? "var(--rb-warn)" : "var(--rb-stable)",
      stroke: "var(--bg)", "stroke-width": 2
    }));
    var labelY = clamp(currentY - 13, top + 15, bottom - 28);
    append(svg, svgElement(doc, "text", {
      x: clamp(currentX + 10, left + 8, right - 110), y: labelY,
      "font-size": 12.5, fill: "var(--fg)"
    }, "当前点"));
    append(svg, svgElement(doc, "text", {
      x: right - 5, y: top + 14, "text-anchor": "end",
      "font-size": 12, fill: "var(--fg-soft)"
    }, "曲线之上：μ>0；曲线之下：μ<0"));
    append(svg, svgElement(doc, "rect", {
      x: 84, y: 347, width: 16, height: 4, rx: 2,
      fill: "var(--rb-current)"
    }));
    append(svg, svgElement(doc, "text", {
      x: 106, y: 352, "font-size": 12, fill: "var(--fg-soft)"
    }, "Ra_N(a)"));
    append(svg, svgElement(doc, "circle", {
      cx: 204, cy: 349, r: 4, fill: "var(--rb-warn)"
    }));
    append(svg, svgElement(doc, "text", {
      x: 215, y: 352, "font-size": 12, fill: "var(--fg-soft)"
    }, "当前 Ra,a"));
    append(svg, svgElement(doc, "circle", {
      cx: 323, cy: 349, r: 4, fill: "var(--rb-stable)"
    }));
    append(svg, svgElement(doc, "text", {
      x: 334, y: 352, "font-size": 12, fill: "var(--fg-soft)"
    }, "自由滑移临界最小点"));
  }

  function drawContourFamily(doc, svg, sign, fraction, a, xMap, yMap, visibility) {
    var branches = [[], []];
    var steps = 440;
    for (var i = 0; i <= steps; i += 1) {
      var x = DISPLAY_LENGTH * i / steps;
      var sine = Math.sin(a * x);
      if (sign * sine <= 1e-5) {
        branches.forEach(function (points) {
          if (points.length > 1) {
            append(svg, svgElement(doc, "path", {
              d: pathFor(points), fill: "none", stroke: "var(--rb-current)",
              "stroke-width": 1.15, opacity: (0.55 + fraction * 0.25) * visibility
            }));
          }
          points.length = 0;
        });
        continue;
      }
      var ratio = fraction / Math.abs(sine);
      if (ratio > 1) {
        branches.forEach(function (points) {
          if (points.length > 1) {
            append(svg, svgElement(doc, "path", {
              d: pathFor(points), fill: "none", stroke: "var(--rb-current)",
              "stroke-width": 1.15, opacity: (0.55 + fraction * 0.25) * visibility
            }));
          }
          points.length = 0;
        });
        continue;
      }
      var lowZ = Math.asin(ratio) / PI;
      branches[0].push([xMap(x), yMap(lowZ)]);
      branches[1].push([xMap(x), yMap(1 - lowZ)]);
    }
    branches.forEach(function (points) {
      if (points.length > 1) {
        append(svg, svgElement(doc, "path", {
          d: pathFor(points), fill: "none", stroke: "var(--rb-current)",
          "stroke-width": 1.15, opacity: (0.55 + fraction * 0.25) * visibility
        }));
      }
    });
  }

  function drawCells(svg, state, amplitude, ids) {
    var doc = svg.ownerDocument;
    var width = 760;
    var height = 390;
    var left = 70;
    var right = 724;
    var top = 46;
    var bottom = 300;
    var xMap = function (x) {
      return left + x / DISPLAY_LENGTH * (right - left);
    };
    var yMap = function (z) {
      return bottom - z * (bottom - top);
    };
    var amplitudeVisibility = clamp(amplitude / 0.35, 0, 1);
    clear(svg);
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    addSvgTitle(
      doc,
      svg,
      ids + "-title",
      ids + "-desc",
      "由 streamfunction 构造的 Rayleigh–Bénard 对流胞",
      "固定展示长度 L 除以厚度 d 等于 10。流线来自 psi=A sin(pi z) sin(a x)，箭头由 u=偏导 psi 除以偏导 z、w=-偏导 psi 除以偏导 x 给出；红蓝阴影表示与上升和下降方向一致的热冷符号。"
    );
    var defs = append(svg, svgElement(doc, "defs"));
    var clipId = ids + "-clip";
    var markerId = ids + "-arrow";
    append(defs, svgElement(doc, "clipPath", { id: clipId }));
    append(defs.lastChild, svgElement(doc, "rect", {
      x: left, y: top, width: right - left, height: bottom - top
    }));
    var marker = append(defs, svgElement(doc, "marker", {
      id: markerId, viewBox: "0 0 10 10", refX: 8, refY: 5,
      markerWidth: 5, markerHeight: 5, orient: "auto-start-reverse"
    }));
    append(marker, svgElement(doc, "path", {
      d: "M 0 0 L 10 5 L 0 10 z", fill: "var(--rb-ink)"
    }));

    append(svg, svgElement(doc, "rect", {
      x: left, y: top, width: right - left, height: bottom - top,
      fill: "var(--bg)", stroke: "var(--fg-soft)", "stroke-width": 1.3,
      "clip-path": "url(#" + clipId + ")"
    }));
    var bandCount = 180;
    for (var band = 0; band < bandCount; band += 1) {
      var x = DISPLAY_LENGTH * (band + 0.5) / bandCount;
      var thermal = -Math.cos(state.a * x);
      append(svg, svgElement(doc, "rect", {
        x: xMap(DISPLAY_LENGTH * band / bandCount), y: top,
        width: (right - left) / bandCount + 0.8, height: bottom - top,
        fill: thermal >= 0 ? "var(--rb-hot)" : "var(--rb-cold)",
        opacity: amplitudeVisibility * (0.11 + 0.25 * Math.abs(thermal)),
        "clip-path": "url(#" + clipId + ")"
      }));
    }
    [0.25, 0.5, 0.75].forEach(function (z) {
      append(svg, svgElement(doc, "line", {
        x1: left, y1: yMap(z), x2: right, y2: yMap(z),
        stroke: "var(--border)", "stroke-width": 1, "stroke-dasharray": "2 5",
        opacity: 0.68
      }));
    });
    var boundaryCount = Math.ceil(state.a * DISPLAY_LENGTH / PI);
    for (var boundary = 0; boundary <= boundaryCount; boundary += 1) {
      var boundaryX = boundary * PI / state.a;
      if (boundaryX > DISPLAY_LENGTH + 1e-6) continue;
      append(svg, svgElement(doc, "line", {
        x1: xMap(boundaryX), y1: top, x2: xMap(boundaryX), y2: bottom,
        stroke: "var(--rb-current)", "stroke-width": 0.8, "stroke-dasharray": "2 4",
        opacity: 0.34
      }));
    }

    if (amplitude > 1e-7) {
      [0.22, 0.46, 0.7].forEach(function (fraction) {
        drawContourFamily(doc, svg, 1, fraction, state.a, xMap, yMap, amplitudeVisibility);
        drawContourFamily(doc, svg, -1, fraction, state.a, xMap, yMap, amplitudeVisibility);
      });
    }

    var arrowColumns = Math.max(9, Math.min(18, Math.round(state.a * DISPLAY_LENGTH / PI) + 3));
    var arrowScale = 17 * amplitudeVisibility;
    for (var column = 0; column < arrowColumns; column += 1) {
      var xPosition = DISPLAY_LENGTH * (column + 0.5) / arrowColumns;
      [0.18, 0.36, 0.54, 0.72, 0.86].forEach(function (zPosition) {
        var u = PI * Math.cos(PI * zPosition) * Math.sin(state.a * xPosition);
        var w = -state.a * Math.sin(PI * zPosition) * Math.cos(state.a * xPosition);
        var magnitude = Math.sqrt(u * u + w * w);
        if (magnitude < 1e-6) return;
        var length = arrowScale;
        append(svg, svgElement(doc, "line", {
          x1: xMap(xPosition), y1: yMap(zPosition),
          x2: xMap(xPosition) + u / magnitude * length,
          y2: yMap(zPosition) - w / magnitude * length,
          stroke: "var(--rb-ink)", "stroke-width": 1.25, opacity: 0.84 * amplitudeVisibility,
          "marker-end": "url(#" + markerId + ")"
        }));
      });
    }

    append(svg, svgElement(doc, "line", {
      x1: left, y1: top, x2: right, y2: top,
      stroke: "var(--rb-cold)", "stroke-width": 4
    }));
    append(svg, svgElement(doc, "line", {
      x1: left, y1: bottom, x2: right, y2: bottom,
      stroke: "var(--rb-hot)", "stroke-width": 4
    }));
    append(svg, svgElement(doc, "text", {
      x: left, y: top - 14, "font-size": 12.5, fill: "var(--rb-cold)"
    }, "冷端 z=1"));
    append(svg, svgElement(doc, "text", {
      x: left, y: bottom + 19, "font-size": 12.5, fill: "var(--rb-hot)"
    }, "热端 z=0"));
    append(svg, svgElement(doc, "text", {
      x: (left + right) / 2, y: bottom + 43, "text-anchor": "middle",
      "font-size": 13, fill: "var(--fg)"
    }, "x/d（固定 L/d=10；a 增大 ⇒ 胞宽变窄、胞数增多）"));
    append(svg, svgElement(doc, "rect", {
      x: 79, y: 350, width: 16, height: 9, rx: 2,
      fill: "var(--rb-hot)", opacity: 0.7
    }));
    append(svg, svgElement(doc, "text", {
      x: 101, y: 359, "font-size": 12, fill: "var(--fg-soft)"
    }, "热上升区（θ' 与 w 同号）"));
    append(svg, svgElement(doc, "rect", {
      x: 275, y: 350, width: 16, height: 9, rx: 2,
      fill: "var(--rb-cold)", opacity: 0.7
    }));
    append(svg, svgElement(doc, "text", {
      x: 297, y: 359, "font-size": 12, fill: "var(--fg-soft)"
    }, "冷下降区"));
    append(svg, svgElement(doc, "line", {
      x1: 405, y1: 354, x2: 432, y2: 354,
      stroke: "var(--rb-ink)", "stroke-width": 1.25,
      "marker-end": "url(#" + markerId + ")"
    }));
    append(svg, svgElement(doc, "text", {
      x: 440, y: 359, "font-size": 12, fill: "var(--fg-soft)"
    }, "速度方向（长度为可读性归一化）"));
  }

  function drawAmplitude(svg, state, ids) {
    var doc = svg.ownerDocument;
    var width = 760;
    var height = 300;
    var left = 75;
    var right = 724;
    var top = 28;
    var bottom = 224;
    var sat = saturation(state.mu, G);
    var yMax = Math.max(0.8, state.a0 * 1.18, sat * 1.18);
    var xScale = function (time) {
      return left + time / TIME_MAX * (right - left);
    };
    var yScale = function (amplitude) {
      return bottom - clamp(amplitude, 0, yMax) / yMax * (bottom - top);
    };
    clear(svg);
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    addSvgTitle(
      doc,
      svg,
      ids + "-title",
      ids + "-desc",
      "近临界正规形的振幅演化",
      "曲线是 dA 除以 d tau 等于 mu A 减去 g A 的三次方的解析解，横轴是无量纲模型时间；竖线标出当前演化进度。"
    );
    var yTicks = [0, yMax / 2, yMax];
    [0, 3, 6, 9, 12].forEach(function (tick) {
      var x = xScale(tick);
      append(svg, svgElement(doc, "line", {
        x1: x, y1: top, x2: x, y2: bottom,
        stroke: "var(--border)", "stroke-width": 1, "stroke-dasharray": "2 5",
        opacity: 0.72
      }));
      append(svg, svgElement(doc, "text", {
        x: x, y: bottom + 19, "text-anchor": "middle",
        "font-size": 12, fill: "var(--fg-soft)"
      }, format(null, tick, 0)));
    });
    yTicks.forEach(function (tick) {
      var y = yScale(tick);
      append(svg, svgElement(doc, "line", {
        x1: left, y1: y, x2: right, y2: y,
        stroke: "var(--border)", "stroke-width": 1, "stroke-dasharray": "2 5",
        opacity: 0.72
      }));
      append(svg, svgElement(doc, "text", {
        x: left - 10, y: y + 4, "text-anchor": "end",
        "font-size": 12, fill: "var(--fg-soft)"
      }, format(null, tick, 2)));
    });
    append(svg, svgElement(doc, "line", {
      x1: left, y1: bottom, x2: right, y2: bottom,
      stroke: "var(--fg-soft)", "stroke-width": 1.35
    }));
    append(svg, svgElement(doc, "line", {
      x1: left, y1: top, x2: left, y2: bottom,
      stroke: "var(--fg-soft)", "stroke-width": 1.35
    }));
    var points = [];
    for (var i = 0; i <= 180; i += 1) {
      var time = TIME_MAX * i / 180;
      points.push([xScale(time), yScale(amplitudeAt(state.mu, G, state.a0, time))]);
    }
    append(svg, svgElement(doc, "path", {
      d: pathFor(points), fill: "none", stroke: "var(--rb-current)", "stroke-width": 3
    }));
    if (sat > 1e-7) {
      append(svg, svgElement(doc, "line", {
        x1: left, y1: yScale(sat), x2: right, y2: yScale(sat),
        stroke: "var(--rb-stable)", "stroke-width": 1.4, "stroke-dasharray": "6 5",
        opacity: 0.84
      }));
      append(svg, svgElement(doc, "text", {
        x: right - 3, y: yScale(sat) - 8, "text-anchor": "end",
        "font-size": 12, fill: "var(--rb-stable)"
      }, "A∞"));
    }
    var currentX = xScale(state.time);
    var currentA = amplitudeAt(state.mu, G, state.a0, state.time);
    append(svg, svgElement(doc, "line", {
      x1: currentX, y1: top, x2: currentX, y2: bottom,
      stroke: "var(--rb-warn)", "stroke-width": 1.2, "stroke-dasharray": "4 4"
    }));
    append(svg, svgElement(doc, "circle", {
      cx: currentX, cy: yScale(currentA), r: 6,
      fill: "var(--rb-warn)", stroke: "var(--bg)", "stroke-width": 2
    }));
    append(svg, svgElement(doc, "circle", {
      cx: xScale(0), cy: yScale(state.a0), r: 4,
      fill: "var(--bg)", stroke: "var(--rb-current)", "stroke-width": 2
    }));
    append(svg, svgElement(doc, "text", {
      x: (left + right) / 2, y: bottom + 42, "text-anchor": "middle",
      "font-size": 13, fill: "var(--fg)"
    }, "正规形模型时间 τ（无量纲）"));
    append(svg, svgElement(doc, "text", {
      x: 17, y: (top + bottom) / 2, "text-anchor": "middle",
      "font-size": 13, fill: "var(--fg)",
      transform: "rotate(-90 17 " + ((top + bottom) / 2) + ")"
    }, "归一化振幅 A"));
    append(svg, svgElement(doc, "text", {
      x: right - 4, y: top + 14, "text-anchor": "end",
      "font-size": 12, fill: "var(--fg-soft)"
    }, "A(t) 只展示选定正规形，不是全局 RBC 动力学"));
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    var instanceId = "cl-rb-" + (++INSTANCE);
    var refs = {};
    var state = { preset: "selected", ra: 900, a: A_CRITICAL, a0: 0.12, time: 5 };
    var shell = element(doc, "div", {
      className: "cl-rb-shell",
      style: "display:grid; gap:16px; max-width:100%; overflow:hidden; --rb-current:var(--accent,#315f9d); --rb-warn:var(--cl-red,#b64335); --rb-stable:var(--cl-green,#39734d); --rb-hot:var(--cl-red,#b64335); --rb-cold:var(--cl-blue,#315f9d); --rb-ink:var(--fg,#222);"
    });
    var heading = element(doc, "h3", {}, "确定性实验：中性曲线与实际对流胞联动");
    var intro = element(
      doc,
      "p",
      { className: "cl-note" },
      "模型只采用自由滑移、等温边界的解析中性曲线。改变 a 不只是移动曲线上的点：右图在固定 L/d=10 的水平窗口内重画同一个 streamfunction，因此胞宽与胞数都会随波数改变。"
    );
    shell.appendChild(heading);
    shell.appendChild(intro);

    var presetField = element(doc, "fieldset", {
      style: "display:grid; gap:8px; border:0; padding:0; margin:0; min-width:0;"
    });
    var presetLegend = element(doc, "legend", { className: "cl-label" }, "预设（可再拖动任意控制）");
    var presetGroup = element(doc, "div", {
      className: "cl-button-row",
      role: "group",
      "aria-label": "Rayleigh–Bénard 实验预设"
    });
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = element(doc, "button", {
        type: "button",
        "data-preset": preset.id,
        "aria-pressed": "false",
        title: preset.description
      }, preset.label);
      button.addEventListener("click", function () {
        state.preset = preset.id;
        setRangeValue(refs[instanceId + "-ra"], preset.ra);
        setRangeValue(refs[instanceId + "-a"], preset.a);
        setRangeValue(refs[instanceId + "-a0"], preset.a0);
        setRangeValue(refs[instanceId + "-time"], preset.time);
        render(true);
      });
      presetButtons.push(button);
      presetGroup.appendChild(button);
    });
    presetField.appendChild(presetLegend);
    presetField.appendChild(presetGroup);
    shell.appendChild(presetField);

    var controls = element(doc, "div", {
      className: "cl-controls",
      style: "grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:12px;"
    });
    var raControl = makeRange(doc, instanceId + "-ra", "Rayleigh 数 Ra", RA_MIN, RA_MAX, 0.01, state.ra, refs);
    var aControl = makeRange(doc, instanceId + "-a", "水平无量纲波数 a", A_MIN, A_MAX, 0.001, state.a, refs);
    var a0Control = makeRange(doc, instanceId + "-a0", "初始振幅 A₀", 0.05, 0.9, 0.01, state.a0, refs);
    var timeControl = makeRange(doc, instanceId + "-time", "演化进度 τ", 0, TIME_MAX, 0.05, state.time, refs);
    controls.appendChild(raControl);
    controls.appendChild(aControl);
    controls.appendChild(a0Control);
    controls.appendChild(timeControl);
    shell.appendChild(controls);

    var formula = element(
      doc,
      "div",
      { className: "cl-formula" },
      "Ra_N(a)=(a²+π²)³/a²； μ=Ra/Ra_N(a)−1； dA/dτ=μA−gA³，g=" + G + "（A 是无量纲教学归一化）"
    );
    shell.appendChild(formula);

    var chartGrid = element(doc, "div", {
      className: "cl-grid",
      style: "grid-template-columns:minmax(0,1fr);"
    });
    var neutralSvg = svgElement(doc, "svg", { viewBox: "0 0 760 390" });
    var cellSvg = svgElement(doc, "svg", { viewBox: "0 0 760 390" });
    chartGrid.appendChild(chartPanel(
      doc,
      instanceId + "-neutral",
      "1. 中性曲线：当前模式是否可长大？",
      neutralSvg,
      "空心点是同一 a 处的中性值 Ra_N(a)，实心点是当前 Ra；两点的上下关系只给出 μ 的符号。"
    ));
    chartGrid.appendChild(chartPanel(
      doc,
      instanceId + "-cells",
      "2. 对流胞：同一个 a 如何改变图案尺度？",
      cellSvg,
      "ψ=A sin(πz)sin(ax)，u=∂ψ/∂z，w=−∂ψ/∂x；热冷阴影按 θ′=−A sin(πz)cos(ax) 的符号绘制。"
    ));
    shell.appendChild(chartGrid);

    var amplitudeSection = element(doc, "section", {
      className: "cl-stage",
      "aria-labelledby": instanceId + "-amplitude-title"
    });
    amplitudeSection.appendChild(element(doc, "h4", {
      id: instanceId + "-amplitude-title"
    }, "3. 近临界正规形：振幅 A(t) 如何响应 μ？"));
    var amplitudeFrame = element(doc, "div", {
      className: "cl-stage-frame",
      style: "max-width:100%; overflow:hidden;"
    });
    var amplitudeScroll = element(doc, "div", {
      style: "max-width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch;"
    });
    var amplitudeSvg = svgElement(doc, "svg", { viewBox: "0 0 760 300" });
    amplitudeSvg.setAttribute("style", "display:block; width:100%; min-width:620px; height:auto;");
    amplitudeScroll.appendChild(amplitudeSvg);
    amplitudeFrame.appendChild(amplitudeScroll);
    amplitudeSection.appendChild(amplitudeFrame);
    amplitudeSection.appendChild(element(
      doc,
      "p",
      { className: "cl-note" },
      "这里的 μ 是符号正确的近临界控制量/增长倾向指标，不是带物理单位的精确增长率；τ 和 A 都属于这个教学正规形的归一化变量。"
    ));
    shell.appendChild(amplitudeSection);

    var metrics = element(doc, "div", { className: "cl-metrics" });
    metric(doc, metrics, "当前中性值 Ra_N(a)", refs, "neutral");
    metric(doc, metrics, "μ=Ra/Ra_N−1（无量纲）", refs, "mu");
    metric(doc, metrics, "波长 λ/d=2π/a", refs, "lambda");
    metric(doc, metrics, "当前 A(τ)", refs, "amplitude");
    metric(doc, metrics, "正规形饱和值 A∞", refs, "saturation");
    metric(doc, metrics, "L/d=10 内约胞数", refs, "rolls");
    shell.appendChild(metrics);

    var status = element(doc, "p", {
      className: "cl-note",
      role: "status",
      "aria-live": "polite",
      "aria-atomic": "true"
    });
    shell.appendChild(status);
    root.replaceChildren(shell);

    function readState() {
      state.ra = clamp(number(refs[instanceId + "-ra"].input.value, 900), RA_MIN, RA_MAX);
      state.a = clamp(number(refs[instanceId + "-a"].input.value, A_CRITICAL), A_MIN, A_MAX);
      state.a0 = clamp(number(refs[instanceId + "-a0"].input.value, 0.12), 0.05, 0.9);
      state.time = clamp(number(refs[instanceId + "-time"].input.value, 5), 0, TIME_MAX);
      state.mu = controlMu(state.ra, state.a);
      state.neutral = neutralRayleigh(state.a);
      state.lambda = 2 * PI / state.a;
      state.amplitude = amplitudeAt(state.mu, G, state.a0, state.time);
      state.saturation = saturation(state.mu, G);
    }

    function updateOutputs() {
      refs[instanceId + "-ra"].output.textContent = format(api, state.ra, 2);
      refs[instanceId + "-a"].output.textContent = format(api, state.a, 3);
      refs[instanceId + "-a0"].output.textContent = format(api, state.a0, 2);
      refs[instanceId + "-time"].output.textContent = format(api, state.time, 2);
      refs[instanceId + "-ra"].input.setAttribute("aria-valuetext", "Ra=" + format(api, state.ra, 2));
      refs[instanceId + "-a"].input.setAttribute("aria-valuetext", "a=" + format(api, state.a, 3));
      refs[instanceId + "-a0"].input.setAttribute("aria-valuetext", "初始振幅 A0=" + format(api, state.a0, 2));
      refs[instanceId + "-time"].input.setAttribute("aria-valuetext", "模型时间 tau=" + format(api, state.time, 2));
      refs.neutral.textContent = format(api, state.neutral, 2);
      refs.mu.textContent = signed(api, state.mu, 4);
      refs.lambda.textContent = format(api, state.lambda, 3) + " d";
      refs.amplitude.textContent = format(api, state.amplitude, 4);
      refs.saturation.textContent = state.mu > 0 ? format(api, state.saturation, 4) : "0（μ≤0）";
      refs.rolls.textContent = format(null, Math.max(1, Math.round(state.a * DISPLAY_LENGTH / PI)), 0);
      presetButtons.forEach(function (button) {
        button.setAttribute(
          "aria-pressed",
          button.getAttribute("data-preset") === state.preset ? "true" : "false"
        );
      });
      status.textContent =
        "Ra=" + format(api, state.ra, 2) + "，a=" + format(api, state.a, 3) +
        "；" + regime(state.mu) + "。" +
        " 当前点在中性曲线" + (state.mu > 1e-4 ? "之上" : state.mu < -1e-4 ? "之下" : "上") +
        "，这只是在选定模型中的稳定性判读。";
    }

    function render(announce) {
      readState();
      updateOutputs();
      drawNeutral(neutralSvg, state, instanceId + "-neutral-svg");
      drawCells(cellSvg, state, state.amplitude, instanceId + "-cells-svg");
      drawAmplitude(amplitudeSvg, state, instanceId + "-amplitude-svg");
      if (announce && api && typeof api.announce === "function") {
        api.announce(root, status.textContent);
      }
    }

    [refs[instanceId + "-ra"], refs[instanceId + "-a"], refs[instanceId + "-a0"], refs[instanceId + "-time"]].forEach(function (control) {
      control.input.addEventListener("input", function () {
        state.preset = "custom";
        render(false);
      });
    });
    render(false);
  }

  window.CourseLearning.register("rayleigh-benard", function (root, api) {
    mount(root, api);
  });
}());

(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("retarded-radiation", exported.mount);
  }
  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log(
        "retarded-radiation self-test: PASS (" +
          report.checks +
          " checks, " +
          report.presets +
          " presets)"
      );
    } catch (error) {
      console.error("retarded-radiation self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-retarded-radiation-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;
  var PI = Math.PI;
  var DEFAULT = {
    presetId: "radiation",
    kr: 8,
    theta: PI / 3,
    observationTime: 5,
    sourceEventTime: 2
  };

  var PRESETS = [
    { id: "near", label: "近场 kr=0.2", kr: 0.2, note: "1/r^3 反应性项显著。" },
    { id: "induction", label: "感应区 kr=1", kr: 1, note: "1/r^3、1/r^2 与 1/r 项处在过渡竞争区。" },
    { id: "radiation", label: "辐射区 kr=8", kr: 8, note: "除方向图节点外，1/r 项主导，适合局部辨认远场。" }
  ];

  var STYLE_TEXT = [
    ".rr-lab{--rr-blue:var(--cl-blue,#315f9d);--rr-gold:var(--cl-gold,#9b6a12);--rr-green:var(--cl-green,#39734d);--rr-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;}.rr-lab *,.rr-lab *::before,.rr-lab *::after{box-sizing:border-box;}.rr-lab [hidden]{display:none!important;}.rr-lab h3,.rr-lab h4{margin:0;color:var(--fg);}.rr-lab h3{font-size:1.18rem;}.rr-lab h4{margin-top:16px;font-size:1rem;}",
    ".rr-lab button,.rr-lab input{font:inherit;}.rr-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}.rr-lab button:hover{border-color:var(--accent);}.rr-lab button[aria-pressed=\"true\"],.rr-lab button.rr-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:700;}.rr-lab button:disabled{cursor:not-allowed;opacity:.55;}.rr-lab button:focus-visible,.rr-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}.rr-lab .rr-note,.rr-lab .rr-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65;overflow-wrap:anywhere;}.rr-lab .rr-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--rr-gold);background:var(--bg);}.rr-lab fieldset{min-width:0;margin:0;padding:0;border:0;}.rr-lab legend{margin-bottom:8px;color:var(--fg-soft);font-size:13px;font-weight:750;}.rr-lab .rr-question-list{display:grid;gap:12px;}.rr-lab .rr-question{min-width:0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);}.rr-lab .rr-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}.rr-lab .rr-choice-grid button{font-size:12px;}.rr-lab .rr-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}.rr-lab .rr-actions>*{flex:1 1 170px;}.rr-lab .rr-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}.rr-lab .rr-pass{color:var(--rr-green);}.rr-lab .rr-warn{color:var(--rr-red);}",
    ".rr-lab .rr-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.rr-lab .rr-layout{display:grid;grid-template-columns:minmax(210px,.72fr) minmax(0,1.28fr);gap:16px;align-items:start;min-width:0;}.rr-lab .rr-controls,.rr-lab .rr-stage{min-width:0;}.rr-lab .rr-controls{display:grid;gap:12px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}.rr-lab .rr-control{display:grid;gap:5px;min-width:0;}.rr-lab .rr-control label,.rr-lab .rr-control-title{color:var(--fg-soft);font-size:13px;font-weight:700;}.rr-lab .rr-control output{color:var(--accent);font-variant-numeric:tabular-nums;}.rr-lab .rr-control input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}.rr-lab .rr-option-grid,.rr-lab .rr-preset-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;}.rr-lab .rr-option-grid button,.rr-lab .rr-preset-grid button{font-size:12px;}",
    ".rr-lab .rr-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(122px,1fr));gap:8px;margin:12px 0;}.rr-lab .rr-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.rr-lab .rr-metric:nth-child(3n+1){border-top-color:var(--rr-blue);}.rr-lab .rr-metric:nth-child(3n+2){border-top-color:var(--rr-gold);}.rr-lab .rr-metric:nth-child(3n){border-top-color:var(--rr-red);}.rr-lab .rr-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4;}.rr-lab .rr-metric strong{display:block;margin-top:3px;color:var(--fg);font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}.rr-lab .rr-frame{min-width:0;padding:9px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}.rr-lab .rr-svg{display:block;width:100%;max-width:100%;height:auto;color:var(--fg);}.rr-lab .rr-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.rr-lab .rr-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.68;}.rr-lab .rr-axis{stroke:currentColor;stroke-width:1.2;stroke-opacity:.72;}.rr-lab .rr-curve{fill:none;stroke:var(--rr-blue);stroke-width:3;}.rr-lab .rr-current{fill:var(--rr-red);stroke:var(--bg);stroke-width:2;}.rr-lab .rr-source{stroke:var(--rr-gold);stroke-width:2;stroke-dasharray:5 4;}.rr-lab .rr-observe{stroke:var(--rr-green);stroke-width:2;}.rr-lab .rr-zone-near{fill:var(--rr-red);}.rr-lab .rr-zone-induction{fill:var(--rr-gold);}.rr-lab .rr-zone-radiation{fill:var(--rr-green);}",
    ".rr-lab .rr-table-wrap{max-width:100%;margin-top:12px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.rr-lab table{width:100%;min-width:760px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.rr-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft);font-size:12px;}.rr-lab th,.rr-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere;}.rr-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750;}.rr-lab .rr-interpretation{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--rr-green);background:var(--bg);font-size:13px;line-height:1.7;overflow-wrap:anywhere;}",
    "@media(max-width:900px){.rr-lab .rr-layout{grid-template-columns:minmax(0,1fr);}}@media(max-width:760px){.rr-lab .rr-choice-grid{grid-template-columns:minmax(0,1fr);}.rr-lab .rr-preset-grid{grid-template-columns:minmax(0,1fr);}}@media(max-width:420px){.rr-lab .rr-frame{padding:6px;}.rr-lab table{font-size:11.5px;}.rr-lab th,.rr-lab td{padding-left:5px;padding-right:5px;}}@media(prefers-reduced-motion:reduce){.rr-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || EPS) * scale;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function retardedTime(observationTime, distance, speed) {
    if (!finite(observationTime) || !finite(distance) || distance < 0) {
      throw new RangeError("observation time and nonnegative distance are required");
    }
    if (!finite(speed) || speed <= 0) throw new RangeError("speed must be positive");
    return observationTime - distance / speed;
  }

  function causalLedger(options) {
    var settings = options || {};
    var observationTime = Number(settings.observationTime === undefined ? 5 : settings.observationTime);
    var sourceEventTime = Number(settings.sourceEventTime === undefined ? 2 : settings.sourceEventTime);
    var speed = Number(settings.speed === undefined ? 1 : settings.speed);
    var distances = settings.distances || [1, 2, 4];
    return distances.map(function (distance) {
      var numericDistance = Number(distance);
      var travelTime = numericDistance / speed;
      var arrivalTime = sourceEventTime + travelTime;
      return {
        distance: numericDistance,
        travelTime: travelTime,
        retardedSourceTime: retardedTime(observationTime, numericDistance, speed),
        arrivalTime: arrivalTime,
        eventSeen: arrivalTime <= observationTime + EPS
      };
    });
  }

  function zoneOf(kr) {
    var value = Math.max(0, Number(kr));
    if (value < 0.3) {
      return { id: "near", label: "近场", note: "kr 很小；1/r^3 反应性项显著。" };
    }
    if (value < 3) {
      return { id: "induction", label: "感应区", note: "kr 约为 1；1/r^3、1/r^2 与 1/r 项共同过渡。" };
    }
    return { id: "radiation", label: "辐射区", note: "kr 较大；除角分布节点外，1/r 辐射项主导。" };
  }

  function zoneScalings(kr) {
    var value = Math.max(Number(kr), 1e-9);
    return {
      near: 1 / Math.pow(value, 3),
      induction: 1 / Math.pow(value, 2),
      radiation: 1 / value,
      reference: "相对于同一谐偶极尺度的教学标度；不是全场精确系数。"
    };
  }

  function angularFactor(theta) {
    return Math.pow(Math.sin(Number(theta)), 2);
  }

  function instantaneousDifferentialPower(pddot, theta, epsilon0, speed) {
    var eps = epsilon0 === undefined ? 1 : Number(epsilon0);
    var c = speed === undefined ? 1 : Number(speed);
    return Math.pow(Number(pddot), 2) * angularFactor(theta) / (16 * Math.pow(PI, 2) * eps * Math.pow(c, 3));
  }

  function larmorPower(charge, acceleration, epsilon0, speed) {
    var eps = epsilon0 === undefined ? 1 : Number(epsilon0);
    var c = speed === undefined ? 1 : Number(speed);
    return Math.pow(Number(charge) * Number(acceleration), 2) / (6 * PI * eps * Math.pow(c, 3));
  }

  function harmonicDifferentialPower(amplitude, omega, theta, epsilon0, speed) {
    var eps = epsilon0 === undefined ? 1 : Number(epsilon0);
    var c = speed === undefined ? 1 : Number(speed);
    return Math.pow(Number(amplitude), 2) * Math.pow(Number(omega), 4) * angularFactor(theta) /
      (32 * Math.pow(PI, 2) * eps * Math.pow(c, 3));
  }

  function harmonicPower(amplitude, omega, epsilon0, speed) {
    var eps = epsilon0 === undefined ? 1 : Number(epsilon0);
    var c = speed === undefined ? 1 : Number(speed);
    return Math.pow(Number(amplitude), 2) * Math.pow(Number(omega), 4) / (12 * PI * eps * Math.pow(c, 3));
  }

  function radiationFieldAmplitude(amplitude, omega, radius, theta, epsilon0, speed) {
    var eps = epsilon0 === undefined ? 1 : Number(epsilon0);
    var c = speed === undefined ? 1 : Number(speed);
    return Math.abs(Number(amplitude) * Math.pow(Number(omega), 2) * Math.sin(Number(theta))) /
      (4 * PI * eps * Math.pow(c, 2) * Number(radius));
  }

  function evaluate(options) {
    var settings = options || {};
    var c = Number(settings.speed === undefined ? 1 : settings.speed);
    var epsilon0 = Number(settings.epsilon0 === undefined ? 1 : settings.epsilon0);
    var amplitude = Number(settings.amplitude === undefined ? 1 : settings.amplitude);
    var omega = Number(settings.omega === undefined ? 1 : settings.omega);
    var theta = Number(settings.theta === undefined ? PI / 3 : settings.theta);
    var kr = Math.max(0, Number(settings.kr === undefined ? DEFAULT.kr : settings.kr));
    var radius = omega > 0 ? kr * c / omega : Infinity;
    var pddotAmplitude = amplitude * Math.pow(omega, 2);
    var zone = zoneOf(kr);
    var ledger = causalLedger({
      observationTime: settings.observationTime === undefined ? DEFAULT.observationTime : settings.observationTime,
      sourceEventTime: settings.sourceEventTime === undefined ? DEFAULT.sourceEventTime : settings.sourceEventTime,
      speed: c
    });
    return {
      speed: c,
      epsilon0: epsilon0,
      amplitude: amplitude,
      omega: omega,
      theta: theta,
      kr: kr,
      radius: radius,
      pddotAmplitude: pddotAmplitude,
      zone: zone,
      scalings: zoneScalings(kr),
      ledger: ledger,
      angleFactor: angularFactor(theta),
      instantaneousPeakPower: instantaneousDifferentialPower(pddotAmplitude, theta, epsilon0, c),
      harmonicDifferentialPower: harmonicDifferentialPower(amplitude, omega, theta, epsilon0, c),
      harmonicTotalPower: harmonicPower(amplitude, omega, epsilon0, c),
      larmorPower: larmorPower(1, pddotAmplitude, epsilon0, c),
      fieldAmplitude: radiationFieldAmplitude(amplitude, omega, radius, theta, epsilon0, c),
      fluxScaling: 1 / Math.pow(radius, 2),
      modelScope: "非相对论、短偶极、远场/谐稳态功率账；不含完整 Liénard–Wiechert 或自力方程。"
    };
  }

  function format(value, digits) {
    if (value === null || value === undefined || !finite(value)) return "—";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.0005) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
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

  function appendChildren(node, children) {
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
    });
    return node;
  }

  function element(doc, tag, attrs, children) {
    return appendChildren(setAttributes(doc.createElement(tag), attrs || {}), children || []);
  }

  function svgElement(doc, tag, attrs, children) {
    return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {}), children || []);
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function metric(doc, label, value) {
    return element(doc, "div", { className: "rr-metric" }, [
      element(doc, "span", {}, [label]),
      element(doc, "strong", {}, [value])
    ]);
  }

  function tableElement(doc, captionText, headers, rows) {
    var head = element(doc, "tr", {}, headers.map(function (header) {
      return element(doc, "th", { scope: "col" }, [header]);
    }));
    var body = element(doc, "tbody", {}, rows.map(function (row) {
      return element(doc, "tr", {}, row.map(function (cell, index) {
        return element(doc, index === 0 ? "th" : "td", index === 0 ? { scope: "row" } : {}, [cell]);
      }));
    }));
    return element(doc, "table", {}, [
      element(doc, "caption", {}, [captionText]),
      element(doc, "thead", {}, [head]),
      body
    ]);
  }

  function drawSvg(doc, data, uid) {
    var svg = svgElement(doc, "svg", {
      className: "rr-svg",
      viewBox: "0 0 720 360",
      role: "img",
      "aria-labelledby": uid + "-title " + uid + "-desc"
    }, []);
    svg.appendChild(svgElement(doc, "title", { id: uid + "-title" }, ["推迟时间、偶极角分布与区域标尺"]));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-desc" }, [
      "左侧为源事件、传播路径和观测时刻的因果时间线；右侧为 sin² theta 角分布和近场、感应区、辐射区标尺。"
    ]));
    var left = 48;
    var right = 350;
    var top = 70;
    var bottom = 220;
    var times = data.ledger.reduce(function (values, row) {
      return values.concat([row.arrivalTime, row.retardedSourceTime]);
    }, [data.observationTime, data.sourceEventTime]);
    var minTime = Math.min.apply(null, times) - 0.5;
    var maxTime = Math.max.apply(null, times) + 0.5;
    var mapTime = function (time) { return left + (right - left) * (time - minTime) / (maxTime - minTime); };
    svg.appendChild(svgElement(doc, "text", { x: left, y: 25, "font-size": 12, "font-weight": 700 }, ["因果时间线"]));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: 150, x2: right, y2: 150, class: "rr-axis" }, []));
    svg.appendChild(svgElement(doc, "line", { x1: mapTime(data.sourceEventTime), y1: top, x2: mapTime(data.sourceEventTime), y2: bottom, class: "rr-source" }, []));
    svg.appendChild(svgElement(doc, "line", { x1: mapTime(data.observationTime), y1: top, x2: mapTime(data.observationTime), y2: bottom, class: "rr-observe" }, []));
    svg.appendChild(svgElement(doc, "text", { x: mapTime(data.sourceEventTime), y: 52, "text-anchor": "middle", "font-size": 11 }, ["源事件 t=" + format(data.sourceEventTime, 1)]));
    svg.appendChild(svgElement(doc, "text", { x: mapTime(data.observationTime), y: 52, "text-anchor": "middle", "font-size": 11 }, ["观测 t=" + format(data.observationTime, 1)]));
    data.ledger.forEach(function (row, index) {
      var y = 92 + index * 34;
      var xRet = mapTime(row.retardedSourceTime);
      var xArr = mapTime(row.arrivalTime);
      var xObs = mapTime(data.observationTime);
      var xEvent = mapTime(data.sourceEventTime);
      svg.appendChild(svgElement(doc, "line", { x1: xRet, y1: y - 3, x2: xObs, y2: y - 3, class: "rr-observe" }, []));
      svg.appendChild(svgElement(doc, "line", { x1: xEvent, y1: y + 3, x2: xArr, y2: y + 3, class: "rr-source" }, []));
      svg.appendChild(svgElement(doc, "circle", { cx: xRet, cy: y - 3, r: 4, fill: "var(--rr-gold)" }, []));
      svg.appendChild(svgElement(doc, "circle", { cx: xArr, cy: y + 3, r: 4, fill: row.eventSeen ? "var(--rr-green)" : "var(--rr-red)" }, []));
      svg.appendChild(svgElement(doc, "text", { x: left, y: y - 8, "font-size": 10.5 }, ["R=" + format(row.distance, 1) + "  t_ret=" + format(row.retardedSourceTime, 2)]));
    });
    svg.appendChild(svgElement(doc, "text", { x: left, y: bottom + 22, "font-size": 10.5 }, ["上轨：t_ret → t_obs；下轨：t_event → t_arr"]));

    var chartLeft = 432;
    var chartRight = 684;
    var chartTop = 70;
    var chartBottom = 210;
    var mapAngleX = function (theta) { return chartLeft + (chartRight - chartLeft) * theta / PI; };
    var mapAngleY = function (value) { return chartBottom - (chartBottom - chartTop) * value; };
    svg.appendChild(svgElement(doc, "text", { x: chartLeft, y: 25, "font-size": 12, "font-weight": 700 }, ["远场角分布 sin²θ"]));
    [0, 0.5, 1].forEach(function (value) {
      var yGrid = mapAngleY(value);
      svg.appendChild(svgElement(doc, "line", { x1: chartLeft, y1: yGrid, x2: chartRight, y2: yGrid, class: "rr-grid" }, []));
    });
    svg.appendChild(svgElement(doc, "line", { x1: chartLeft, y1: chartBottom, x2: chartRight, y2: chartBottom, class: "rr-axis" }, []));
    var points = [];
    for (var index = 0; index <= 40; index += 1) {
      var angle = PI * index / 40;
      points.push((index === 0 ? "M" : "L") + mapAngleX(angle) + " " + mapAngleY(Math.pow(Math.sin(angle), 2)));
    }
    svg.appendChild(svgElement(doc, "path", { d: points.join(" "), class: "rr-curve" }, []));
    svg.appendChild(svgElement(doc, "circle", {
      cx: mapAngleX(data.theta),
      cy: mapAngleY(data.angleFactor),
      r: 5,
      class: "rr-current"
    }, []));
    svg.appendChild(svgElement(doc, "text", { x: chartLeft, y: chartBottom + 18, "font-size": 10.5 }, ["θ=0"]));
    svg.appendChild(svgElement(doc, "text", { x: chartRight, y: chartBottom + 18, "text-anchor": "end", "font-size": 10.5 }, ["θ=π"]));
    svg.appendChild(svgElement(doc, "text", { x: (chartLeft + chartRight) / 2, y: chartBottom + 18, "text-anchor": "middle", "font-size": 10.5 }, ["赤道面最强"]));
    var zoneY = 285;
    var zoneWidth = (chartRight - chartLeft) / 3;
    ["near", "induction", "radiation"].forEach(function (id, zoneIndex) {
      svg.appendChild(svgElement(doc, "rect", {
        x: chartLeft + zoneWidth * zoneIndex,
        y: zoneY,
        width: zoneWidth - 2,
        height: 18,
        class: "rr-zone-" + id
      }, []));
      svg.appendChild(svgElement(doc, "text", {
        x: chartLeft + zoneWidth * (zoneIndex + 0.5),
        y: zoneY + 13,
        "text-anchor": "middle",
        "font-size": 10.5
      }, [id === "near" ? "近场" : id === "induction" ? "感应区" : "辐射区"]));
    });
    svg.appendChild(svgElement(doc, "text", { x: chartLeft, y: zoneY - 8, "font-size": 10.5 }, ["kr 区域标尺"]));
    return svg;
  }

  function buttonGroup(doc, label, choices, selected, onSelect, className) {
    var fieldset = element(doc, "fieldset", {});
    fieldset.appendChild(element(doc, "legend", {}, [label]));
    var grid = element(doc, "div", {
      className: className || "rr-option-grid",
      role: "group",
      "aria-label": label
    }, []);
    choices.forEach(function (choice) {
      var button = element(doc, "button", {
        type: "button",
        "data-choice-value": choice.value,
        "aria-pressed": selected === choice.value ? "true" : "false"
      }, [choice.label]);
      button.addEventListener("click", function () { onSelect(choice.value); });
      grid.appendChild(button);
    });
    fieldset.appendChild(grid);
    return fieldset;
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument || !root.appendChild) return;
    var doc = root.ownerDocument;
    installStyles(doc);
    INSTANCE += 1;
    var uid = "cl-rr-" + INSTANCE;
    var state = {
      presetId: DEFAULT.presetId,
      kr: DEFAULT.kr,
      theta: DEFAULT.theta,
      observationTime: DEFAULT.observationTime,
      sourceEventTime: DEFAULT.sourceEventTime
    };
    var prediction = { causal: null, axis: null, zone: null, frequency: null, scaling: null };
    var revealed = false;
    var score = 0;
    var shell = element(doc, "div", { className: "rr-lab" }, []);
    root.replaceChildren(shell);

    function announce(message) {
      if (api && typeof api.announce === "function") api.announce(root, message);
    }

    function predictionComplete() {
      return Object.keys(prediction).every(function (key) { return prediction[key] !== null; });
    }

    function addPrediction(container, key, prompt, options) {
      var fieldset = element(doc, "fieldset", { className: "rr-question" }, [
        element(doc, "legend", {}, [prompt])
      ]);
      var grid = element(doc, "div", { className: "rr-choice-grid", role: "group", "aria-label": prompt }, []);
      options.forEach(function (option) {
        var button = element(doc, "button", {
          type: "button",
          "aria-pressed": prediction[key] === option.value ? "true" : "false",
          disabled: revealed
        }, [option.label]);
        button.addEventListener("click", function () {
          if (!revealed) {
            prediction[key] = option.value;
            renderGate();
          }
        });
        grid.appendChild(button);
      });
      fieldset.appendChild(grid);
      container.appendChild(fieldset);
    }

    function renderGate() {
      clear(shell);
      shell.appendChild(element(doc, "h3", {}, ["推迟辐射审计：时间戳、区域与角分布"]));
      shell.appendChild(element(doc, "p", { className: "rr-note" }, [
        revealed
          ? "预测已提交；可以改变 kr、角度和观测时刻，重算因果与偶极账本。"
          : "先完成五项预测。提交前不显示时间线、区域系数或辐射功率。"
      ]));
      shell.appendChild(element(doc, "div", { className: "rr-prompt" }, [
        revealed
          ? "当前模型只覆盖非相对论短偶极：远场功率与推迟时间分开审计。"
          : "预测门：先决定源的过去状态，再决定哪些场项可被叫作辐射。"
      ]));
      var questions = element(doc, "div", { className: "rr-question-list" }, []);
      addPrediction(questions, "causal", "1 · 观测时刻 t 对应的源时间？", [
        { value: "retarded", label: "t−R/c" },
        { value: "advanced", label: "t+R/c" },
        { value: "same", label: "t" }
      ]);
      addPrediction(questions, "axis", "2 · 偶极轴向 θ=0 的远场功率？", [
        { value: "zero", label: "零" },
        { value: "max", label: "最大" },
        { value: "same", label: "不变" }
      ]);
      addPrediction(questions, "zone", "3 · kr≫1 主要读哪一层？", [
        { value: "radiation", label: "辐射区 1/r" },
        { value: "near", label: "近场 1/r³" },
        { value: "induction", label: "感应区 1/r²" }
      ]);
      addPrediction(questions, "frequency", "4 · 固定 p₀ 的谐稳态功率？", [
        { value: "omega4", label: "ω⁴" },
        { value: "omega2", label: "ω²" },
        { value: "none", label: "不依赖 ω" }
      ]);
      addPrediction(questions, "scaling", "5 · 远场幅度/平均通量随 r？", [
        { value: "one/two", label: "1/r；1/r²" },
        { value: "two/one", label: "1/r²；1/r" },
        { value: "same", label: "都不变" }
      ]);
      shell.appendChild(questions);
      var actions = element(doc, "div", { className: "rr-actions" }, []);
      var reveal = element(doc, "button", {
        type: "button",
        className: "rr-primary",
        disabled: revealed || !predictionComplete()
      }, [revealed ? "账本已揭示" : "提交预测并揭示"]);
      reveal.addEventListener("click", function () {
        if (!predictionComplete()) return;
        var answers = {
          causal: "retarded",
          axis: "zero",
          zone: "radiation",
          frequency: "omega4",
          scaling: "one/two"
        };
        score = Object.keys(answers).reduce(function (total, key) {
          return total + (prediction[key] === answers[key] ? 1 : 0);
        }, 0);
        revealed = true;
        renderGate();
        announce("预测已提交；推迟时间、区域、角分布和功率账本已揭示。");
      });
      var reset = element(doc, "button", { type: "button" }, [revealed ? "重新预测" : "重置"]);
      reset.addEventListener("click", resetToGate);
      actions.appendChild(reveal);
      actions.appendChild(reset);
      shell.appendChild(actions);
      shell.appendChild(element(doc, "p", {
        className: "rr-feedback " + (revealed ? (score === 5 ? "rr-pass" : "rr-warn") : ""),
        "aria-live": "polite"
      }, [
        !predictionComplete()
          ? "请为五个判断各选一项。"
          : revealed
            ? "预测得分 " + score + "/5；下面打开因果与辐射账本。"
            : "五项预测已记录，点击提交后才显示结果。"
      ]));
      if (revealed) buildRevealed();
    }

    function buildRevealed() {
      var panel = element(doc, "section", { className: "rr-revealed" }, [
        element(doc, "h4", {}, ["结果与透明账本"]),
        element(doc, "p", { className: "rr-note" }, [
          "数值采用 c=ε0=p0=ω=1 的归一化教学单位；区域是连续的尺度判断，不是场的硬切换。"
        ])
      ]);
      var layout = element(doc, "div", { className: "rr-layout" }, []);
      var controls = element(doc, "div", { className: "rr-controls" }, []);
      var stage = element(doc, "div", { className: "rr-stage" }, []);
      controls.appendChild(buttonGroup(
        doc,
        "观察区域预设",
        PRESETS.map(function (preset) { return { value: preset.id, label: preset.label }; }),
        state.presetId,
        function (value) {
          state.presetId = value;
          state.kr = PRESETS.filter(function (preset) { return preset.id === value; })[0].kr;
          renderGate();
        },
        "rr-preset-grid"
      ));
      addRange(controls, "kr", "无量纲距离 kr", "0.1", "12", "0.1", state.kr, function (value) {
        state.kr = value;
        state.presetId = "custom";
        Array.prototype.forEach.call(controls.querySelectorAll(".rr-preset-grid button"), function (button) {
          button.setAttribute("aria-pressed", "false");
        });
        renderResults();
      }, function (value) { return format(value, 1); });
      addRange(controls, "theta", "观察角 θ", "0", "180", "1", state.theta * 180 / PI, function (value) {
        state.theta = value * PI / 180;
        renderResults();
      }, function (value) { return format(value, 0) + "°"; });
      addRange(controls, "observationTime", "观测时刻 t", "1", "8", "0.5", state.observationTime, function (value) {
        state.observationTime = value;
        renderResults();
      }, function (value) { return format(value, 1); });
      addRange(controls, "sourceEventTime", "源事件时刻", "-1", "5", "0.5", state.sourceEventTime, function (value) {
        state.sourceEventTime = value;
        renderResults();
      }, function (value) { return format(value, 1); });
      var reset = element(doc, "button", { type: "button" }, ["重置实验"]);
      reset.addEventListener("click", resetToGate);
      controls.appendChild(reset);
      layout.appendChild(controls);
      layout.appendChild(stage);
      panel.appendChild(layout);
      shell.appendChild(panel);
      renderResults();

      function addRange(container, key, label, minimum, maximum, step, initialValue, onChange, formatter) {
        var id = uid + "-" + key;
        var output = element(doc, "output", { for: id }, [formatter(initialValue)]);
        var input = element(doc, "input", {
          id: id,
          type: "range",
          min: minimum,
          max: maximum,
          step: step,
          value: String(initialValue),
          "aria-label": label
        });
        input.addEventListener("input", function () {
          var value = Number(input.value);
          output.textContent = formatter(value);
          onChange(value);
        });
        container.appendChild(element(doc, "div", { className: "rr-control" }, [
          element(doc, "label", { htmlFor: id }, [label + " = ", output]),
          input
        ]));
      }

      function renderResults() {
        var data = evaluate({
          kr: state.kr,
          theta: state.theta,
          observationTime: state.observationTime,
          sourceEventTime: state.sourceEventTime
        });
        clear(stage);
        var selectedRetarded = data.ledger[1].retardedSourceTime;
        stage.appendChild(element(doc, "div", { className: "rr-metrics" }, [
          metric(doc, "区域", data.zone.label),
          metric(doc, "t_ret (R=2)", format(selectedRetarded, 3)),
          metric(doc, "sin²θ", format(data.angleFactor, 5)),
          metric(doc, "平均 dP/dΩ", format(data.harmonicDifferentialPower, 7)),
          metric(doc, "平均 P", format(data.harmonicTotalPower, 7)),
          metric(doc, "远场 |E|", format(data.fieldAmplitude, 7)),
          metric(doc, "⟨S⟩ 的 r 标度", "1/r²")
        ]));
        var frame = element(doc, "div", { className: "rr-frame" }, []);
        frame.appendChild(drawSvg(doc, {
          ledger: data.ledger,
          observationTime: state.observationTime,
          sourceEventTime: state.sourceEventTime,
          theta: state.theta,
          angleFactor: data.angleFactor
        }, uid));
        stage.appendChild(frame);
        var rows = data.ledger.map(function (row) {
          return [
            "R=" + format(row.distance, 2),
            format(row.travelTime, 3),
            format(row.retardedSourceTime, 3),
            format(row.arrivalTime, 3),
            row.eventSeen ? "已到达" : "尚未到达"
          ];
        });
        rows.push(["区域项", format(data.scalings.near, 5) + " / " + format(data.scalings.induction, 5) + " / " + format(data.scalings.radiation, 5), "近 / 感应 / 辐射", data.zone.label, "教学标度"]);
        rows.push(["角分布", "sin²θ=" + format(data.angleFactor, 5), "轴向零点", "赤道面最大", "远场式"]);
        rows.push(["功率", "Larmor=" + format(data.larmorPower, 7), "平均偶极=" + format(data.harmonicTotalPower, 7), "ω⁴", "固定 p₀、短偶极、非相对论"]);
        stage.appendChild(element(doc, "div", { className: "rr-table-wrap" }, [
          tableElement(doc, "推迟时间与辐射账本", ["检查", "传播/读数", "源时间或项", "结果", "条件"], rows)
        ]));
        stage.appendChild(element(doc, "p", { className: "rr-interpretation", "aria-live": "polite" }, [
          data.zone.id === "radiation"
            ? "当前 kr 进入辐射区：1/r 项主导，平均远场通量可以读成净辐射；推迟时间仍单独由 t−R/c 决定。"
            : "当前未进入纯辐射区：近场或感应项仍显著，不能把局部瞬时能流直接当作总辐射功率。"
        ]));
      }
    }

    function resetToGate() {
      state = {
        presetId: DEFAULT.presetId,
        kr: DEFAULT.kr,
        theta: DEFAULT.theta,
        observationTime: DEFAULT.observationTime,
        sourceEventTime: DEFAULT.sourceEventTime
      };
      prediction = { causal: null, axis: null, zone: null, frequency: null, scaling: null };
      revealed = false;
      score = 0;
      renderGate();
      announce("推迟辐射实验已重置；请重新完成五项预测。");
    }

    renderGate();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    assert(near(retardedTime(5, 2, 1), 3, 1e-12), "retarded time");
    var ledger = causalLedger({ observationTime: 5, sourceEventTime: 2, speed: 1, distances: [1, 2, 4] });
    assert(near(ledger[0].arrivalTime, 3, 1e-12), "arrival R one");
    assert(near(ledger[1].retardedSourceTime, 3, 1e-12), "retarded R two");
    assert(!ledger[2].eventSeen, "far event not arrived");
    assert(zoneOf(0.2).id === "near", "near zone");
    assert(zoneOf(1).id === "induction", "induction zone");
    assert(zoneOf(8).id === "radiation", "radiation zone");
    assert(near(angularFactor(0), 0, 1e-12), "axis angular node");
    assert(near(angularFactor(PI / 2), 1, 1e-12), "equator angular maximum");
    var instantaneous = instantaneousDifferentialPower(1, PI / 2, 1, 1);
    assert(near(larmorPower(1, 1, 1, 1) / instantaneous, 8 * PI / 3, 1e-12), "angular integral factor");
    assert(near(harmonicPower(1, 2, 1, 1) / harmonicPower(1, 1, 1, 1), 16, 1e-12), "omega four scaling");
    assert(near(harmonicPower(2, 1, 1, 1) / harmonicPower(1, 1, 1, 1), 4, 1e-12), "dipole amplitude squared scaling");
    assert(near(
      harmonicDifferentialPower(2, 3, PI / 2, 1, 1),
      0.5 * instantaneousDifferentialPower(2 * 9, PI / 2, 1, 1),
      1e-12
    ), "harmonic average is half the peak instantaneous power");
    assert(near(
      radiationFieldAmplitude(1, 1, 2, PI / 2, 1, 1) /
      radiationFieldAmplitude(1, 1, 1, PI / 2, 1, 1),
      0.5,
      1e-12
    ), "far field one over r");
    var result = evaluate({ kr: 8, theta: PI / 3, observationTime: 5, sourceEventTime: 2 });
    assert(result.zone.id === "radiation", "evaluate radiation zone");
    assert(near(result.angleFactor, 0.75, 1e-12), "evaluate angle");
    assert(result.modelScope.indexOf("Liénard") !== -1, "scope boundary");
    assert(result.scalings.radiation > result.scalings.induction && result.scalings.induction > result.scalings.near, "zone scaling order");
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    DEFAULT: DEFAULT,
    PRESETS: PRESETS,
    retardedTime: retardedTime,
    causalLedger: causalLedger,
    zoneOf: zoneOf,
    zoneScalings: zoneScalings,
    angularFactor: angularFactor,
    instantaneousDifferentialPower: instantaneousDifferentialPower,
    larmorPower: larmorPower,
    harmonicDifferentialPower: harmonicDifferentialPower,
    harmonicPower: harmonicPower,
    radiationFieldAmplitude: radiationFieldAmplitude,
    evaluate: evaluate,
    mount: mount,
    selfTest: selfTest
  };
});

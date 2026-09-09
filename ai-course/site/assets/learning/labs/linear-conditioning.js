(function (root, factory) {
  "use strict";

  var exported = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = exported;
  }

  if (
    root &&
    root.CourseLearning &&
    typeof root.CourseLearning.register === "function"
  ) {
    root.CourseLearning.register("linear-conditioning", exported.mount);
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
        "linear-conditioning self-test: PASS (" +
          report.checks +
          " checks, " +
          report.presets +
          " presets)"
      );
    } catch (error) {
      console.error("linear-conditioning self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-linear-conditioning-styles";
  var INSTANCE = 0;
  var SQRT_HALF = 1 / Math.sqrt(2);
  var EPS = 1e-10;

  var DEFAULT = {
    presetId: "near-parallel",
    thetaDeg: 5,
    perturbation: 0.01,
    direction: "min",
    xMode: "reference",
    xScale: 1
  };

  var PRESETS = [
    {
      id: "well-conditioned",
      label: "良态：直角",
      thetaDeg: 90,
      perturbation: 0.01,
      direction: "min",
      xMode: "reference",
      xScale: 1
    },
    {
      id: "near-parallel",
      label: "近乎平行：敏感方向",
      thetaDeg: 5,
      perturbation: 0.01,
      direction: "min",
      xMode: "reference",
      xScale: 1
    },
    {
      id: "direction-exception",
      label: "方向例外：同 κ，非敏感",
      thetaDeg: 5,
      perturbation: 0.01,
      direction: "max",
      xMode: "reference",
      xScale: 1
    },
    {
      id: "small-b",
      label: "缩放陷阱：b/x 很小",
      thetaDeg: 5,
      perturbation: 0.01,
      direction: "min",
      xMode: "small-b",
      xScale: 1
    }
  ];

  Object.freeze(DEFAULT);
  PRESETS.forEach(Object.freeze); Object.freeze(PRESETS);

  var STYLE_TEXT = [
    ".lc-lab{--lc-blue:var(--cl-blue,#315f9d);--lc-gold:var(--cl-gold,#9b6a12);--lc-green:var(--cl-green,#39734d);--lc-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;}",
    ".lc-lab *,.lc-lab *::before,.lc-lab *::after{box-sizing:border-box;}",
    ".lc-lab [hidden]{display:none!important;}",
    ".lc-lab h3,.lc-lab h4{margin:0;color:var(--fg);}",
    ".lc-lab h3{font-size:1.18rem;}",
    ".lc-lab h4{margin-top:16px;font-size:1rem;}",
    ".lc-lab .lc-note,.lc-lab .lc-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65;overflow-wrap:anywhere;}",
    ".lc-lab .lc-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--lc-gold);background:var(--bg);}",
    ".lc-lab fieldset{min-width:0;margin:0;padding:0;border:0;}",
    ".lc-lab legend{margin-bottom:8px;color:var(--fg-soft);font-size:13px;font-weight:750;}",
    ".lc-lab .lc-question-list{display:grid;gap:12px;}",
    ".lc-lab .lc-question{min-width:0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);}",
    ".lc-lab .lc-question-title{display:block;margin-bottom:8px;color:var(--fg);font-size:13px;font-weight:700;overflow-wrap:anywhere;}",
    ".lc-lab .lc-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}",
    ".lc-lab button,.lc-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}",
    ".lc-lab select{width:100%;}",
    ".lc-lab button:hover{border-color:var(--accent);}",
    ".lc-lab button[aria-pressed=\"true\"],.lc-lab button.lc-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:700;}",
    ".lc-lab button:disabled{cursor:not-allowed;opacity:.55;}",
    ".lc-lab :focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
    ".lc-lab .lc-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}",
    ".lc-lab .lc-actions>*{flex:1 1 170px;}",
    ".lc-lab .lc-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}",
    ".lc-lab .lc-pass{color:var(--lc-green);}",
    ".lc-lab .lc-warn{color:var(--lc-red);}",
    ".lc-lab .lc-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}",
    ".lc-lab .lc-layout{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;align-items:start;min-width:0;}",
    ".lc-lab .lc-controls,.lc-lab .lc-stage{min-width:0;}",
    ".lc-lab .lc-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}",
    ".lc-lab .lc-control{display:grid;gap:5px;min-width:0;}",
    ".lc-lab .lc-control label,.lc-lab .lc-control-title{color:var(--fg-soft);font-size:13px;font-weight:700;}",
    ".lc-lab .lc-control output{color:var(--accent);font-variant-numeric:tabular-nums;}",
    ".lc-lab .lc-control input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}",
    ".lc-lab .lc-scale{display:flex;justify-content:space-between;gap:8px;color:var(--fg-soft);font-size:11px;}",
    ".lc-lab .lc-option-row,.lc-lab .lc-preset-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;}",
    ".lc-lab .lc-option-row button,.lc-lab .lc-preset-row button{font-size:12px;}",
    ".lc-lab .lc-stage-frame{min-width:0;padding:9px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow-x:auto;}",
    ".lc-lab .lc-stage-title{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin:0 0 8px;color:var(--fg-soft);font-size:13px;}",
    ".lc-lab .lc-svg{display:block;width:100%;min-width:640px;height:auto;color:var(--fg);}",
    ".lc-lab .lc-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}",
    ".lc-lab .lc-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.68;}",
    ".lc-lab .lc-axis{stroke:currentColor;stroke-width:1.2;stroke-opacity:.7;}",
    ".lc-lab .lc-line-one{stroke:var(--lc-blue);stroke-width:2.5;fill:none;}",
    ".lc-lab .lc-line-two{stroke:var(--lc-gold);stroke-width:2.5;fill:none;}",
    ".lc-lab .lc-shift{stroke-dasharray:7 5;stroke-width:2;stroke-opacity:.82;}",
    ".lc-lab .lc-error-vector{stroke:var(--lc-red);stroke-width:2;stroke-dasharray:4 4;}",
    ".lc-lab .lc-true-point{fill:none;stroke:var(--lc-green);stroke-width:2;}",
    ".lc-lab .lc-computed-point{fill:var(--lc-red);stroke:var(--bg);stroke-width:2;}",
    ".lc-lab .lc-legend{display:flex;flex-wrap:wrap;gap:8px 14px;margin:8px 0 0;color:var(--fg-soft);font-size:12px;}",
    ".lc-lab .lc-legend span{display:inline-flex;align-items:center;gap:5px;}",
    ".lc-lab .lc-swatch{display:inline-block;width:18px;height:3px;background:currentColor;}",
    ".lc-lab .lc-swatch-blue{color:var(--lc-blue);}.lc-lab .lc-swatch-gold{color:var(--lc-gold);}.lc-lab .lc-swatch-red{color:var(--lc-red);}",
    ".lc-lab .lc-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(122px,1fr));gap:8px;margin:12px 0;}",
    ".lc-lab .lc-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}",
    ".lc-lab .lc-metric:nth-child(1),.lc-lab .lc-metric:nth-child(4){border-top-color:var(--lc-blue);}",
    ".lc-lab .lc-metric:nth-child(2),.lc-lab .lc-metric:nth-child(5){border-top-color:var(--lc-gold);}",
    ".lc-lab .lc-metric:nth-child(3),.lc-lab .lc-metric:nth-child(6){border-top-color:var(--lc-red);}",
    ".lc-lab .lc-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4;}",
    ".lc-lab .lc-metric strong{display:block;margin-top:3px;color:var(--fg);font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
    ".lc-lab .lc-table-wrap{max-width:100%;margin-top:10px;overflow-x:auto;-webkit-overflow-scrolling:touch;}",
    ".lc-lab table{display:table;white-space:normal;width:100%;min-width:760px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}",
    ".lc-lab th,.lc-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere;}",
    ".lc-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750;}",
    ".lc-lab .lc-interpretation{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--lc-green);background:var(--bg);font-size:13px;line-height:1.7;overflow-wrap:anywhere;}",
    ".lc-lab .lc-formula{overflow-x:auto;padding:9px 11px;border-left:3px solid var(--accent);background:var(--bg);font-family:\"SF Mono\",Menlo,Consolas,monospace;font-size:12px;line-height:1.65;}",
    ".lc-lab .lc-controls>h4,.lc-lab .lc-controls>p,.lc-lab .lc-controls>.lc-actions{grid-column:1/-1;}",
    "@media(max-width:700px){.lc-lab .lc-controls{grid-template-columns:minmax(0,1fr);}}",
    "@media(max-width:900px){.lc-lab .lc-layout{grid-template-columns:minmax(0,1fr);}}",
    "@media(max-width:760px){.lc-lab .lc-choice-row{grid-template-columns:minmax(0,1fr);}.lc-lab .lc-preset-row{grid-template-columns:minmax(0,1fr);}}",
    "@media(max-width:420px){.lc-lab .lc-stage-frame{padding:6px;}.lc-lab .lc-table-wrap{margin-left:0;margin-right:0;}.lc-lab table{font-size:11.5px;}.lc-lab th,.lc-lab td{padding-left:5px;padding-right:5px;}}",
    "@media(prefers-reduced-motion:reduce){html:has(.lc-lab){scroll-behavior:auto!important}.lc-lab *{animation:none!important;transition:none!important;}}"
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

  function copyVector(values) {
    return values.slice();
  }

  function add(a, b) {
    return a.map(function (value, index) {
      return value + b[index];
    });
  }

  function subtract(a, b) {
    return a.map(function (value, index) {
      return value - b[index];
    });
  }

  function scaleVector(values, scale) {
    return values.map(function (value) {
      return value * scale;
    });
  }

  function dot(a, b) {
    return a.reduce(function (total, value, index) {
      return total + value * b[index];
    }, 0);
  }

  function norm2(values) {
    return Math.hypot.apply(Math, values);
  }

  function degreesToRadians(degrees) {
    return (degrees * Math.PI) / 180;
  }

  function validateTheta(thetaDeg) {
    if (!finite(thetaDeg) || thetaDeg < 0 || thetaDeg > 90) {
      throw new RangeError("thetaDeg must be in [0, 90]");
    }
  }

  function matrix(thetaDeg) {
    validateTheta(thetaDeg);
    var theta = degreesToRadians(thetaDeg);
    return [
      [1, 0],
      [thetaDeg === 90 ? 0 : Math.cos(theta), thetaDeg === 90 ? 1 : Math.sin(theta)]
    ];
  }

  function matrixVectorMultiply(a, vector) {
    return a.map(function (row) {
      return dot(row, vector);
    });
  }

  function solve2x2(a, b) {
    if (!Array.isArray(a) || a.length !== 2 || !Array.isArray(b) || b.length !== 2 ||
        a.some(function(row){return !Array.isArray(row) || row.length !== 2 || Array.from(row).some(function(x){return !finite(x);});}) ||
        Array.from(b).some(function(x){return !finite(x);})) throw new TypeError("finite 2x2 matrix and length-2 vector required");
    var scale=Math.max.apply(Math,a[0].concat(a[1]).map(Math.abs));
    if(scale===0)throw new RangeError("zero matrix");
    var rows=a.map(function(row,i){return [row[0]/scale,row[1]/scale,b[i]/scale];});
    if(rows.some(function(row){return row.some(function(x){return !finite(x);});}))throw new RangeError("scaled system outside finite working range");
    if(Math.abs(rows[1][0])>Math.abs(rows[0][0])){var swap=rows[0];rows[0]=rows[1];rows[1]=swap;}
    if(rows[0][0]===0)throw new RangeError("zero working-precision pivot");
    var m=rows[1][0]/rows[0][0],pivot=rows[1][1]-m*rows[0][1],rhs=rows[1][2]-m*rows[0][2];
    if(pivot===0)throw new RangeError("zero working-precision pivot");
    var x2=rhs/pivot,x1=(rows[0][2]-rows[0][1]*x2)/rows[0][0];
    if(!finite(x1)||!finite(x2))throw new RangeError("solution outside finite working range");
    return [x1,x2];
  }

  function singularValues(thetaDeg) {
    validateTheta(thetaDeg);
    var half=degreesToRadians(thetaDeg)/2;
    var sigmaMax=thetaDeg===90?1:Math.SQRT2*Math.cos(half);
    var sigmaMin=thetaDeg===90?1:Math.SQRT2*Math.sin(half);
    return {thetaDeg:thetaDeg,lambdaMax:sigmaMax*sigmaMax,lambdaMin:sigmaMin*sigmaMin,
      sigmaMax:sigmaMax,sigmaMin:sigmaMin,kappa:sigmaMin===0?Infinity:sigmaMax/sigmaMin};
  }

  function singularDirections(thetaDeg) {
    validateTheta(thetaDeg);
    var half = degreesToRadians(thetaDeg) / 2;
    return {
      vMax: [Math.cos(half), Math.sin(half)],
      vMin: [-Math.sin(half), Math.cos(half)],
      uMax: [SQRT_HALF, SQRT_HALF],
      uMin: [-SQRT_HALF, SQRT_HALF]
    };
  }

  function baseTrueSolution(xMode) {
    if (xMode !== "small-b" && xMode !== "reference") throw new RangeError("unknown true-solution direction");
    return xMode === "small-b" ? [0, 1] : [1, 0];
  }

  function copyState(state) {
    return {
      presetId: state.presetId,
      thetaDeg: state.thetaDeg,
      perturbation: state.perturbation,
      direction: state.direction,
      xMode: state.xMode,
      xScale: state.xScale
    };
  }

  function stateFromPreset(preset) {
    return copyState(preset);
  }

  function presetById(id) {
    for (var index = 0; index < PRESETS.length; index += 1) {
      if (PRESETS[index].id === id) return PRESETS[index];
    }
    if (id === undefined) return PRESETS[0];
    throw new RangeError("unknown preset");
  }

  function compute(spec) {
    if(spec===undefined)spec={};
    if(!spec||typeof spec!=="object"||Array.isArray(spec))throw new TypeError("parameter object required");
    var thetaDeg=spec.thetaDeg===undefined?DEFAULT.thetaDeg:spec.thetaDeg;
    var perturbation=spec.perturbation===undefined?DEFAULT.perturbation:spec.perturbation;
    var directionName=spec.direction===undefined?DEFAULT.direction:spec.direction;
    var xMode=spec.xMode===undefined?DEFAULT.xMode:spec.xMode;
    var xScale=spec.xScale===undefined?DEFAULT.xScale:spec.xScale;
    validateTheta(thetaDeg);
    if(thetaDeg<1e-12)throw new RangeError("model angle must be at least 1e-12 degrees");
    if(!finite(perturbation)||perturbation<0||perturbation>1)throw new RangeError("perturbation must be in [0,1]");
    if(directionName!=="min"&&directionName!=="max")throw new RangeError("direction must be min or max");
    if(!finite(xScale)||xScale<1e-100||xScale>1e100)throw new RangeError("xScale must be in [1e-100,1e100]");
    var a=matrix(thetaDeg),spectrum=singularValues(thetaDeg),directions=singularDirections(thetaDeg);
    var xTrue=scaleVector(baseTrueSolution(xMode),xScale),b=matrixVectorMultiply(a,xTrue),bNorm=norm2(b),xNorm=norm2(xTrue);
    var direction=directionName==="min"?directions.uMin:directions.uMax;
    var rightDirection=directionName==="min"?directions.vMin:directions.vMax;
    var gain=1/(directionName==="min"?spectrum.sigmaMin:spectrum.sigmaMax);
    var deltaB=scaleVector(direction,perturbation*bNorm),deltaBNorm=norm2(deltaB);
    // The mathematical perturbation is computed independently of rounded xHat-xTrue.
    var deltaX=scaleVector(rightDirection,deltaBNorm*gain),xHat=add(xTrue,deltaX);
    var residual=scaleVector(deltaB,-1),residualNorm=deltaBNorm;
    var xHatNorm=norm2(xHat),rho=deltaBNorm/bNorm,forward=norm2(deltaX)/xNorm;
    var exactForward=rho*(bNorm/xNorm)*gain;
    var bPerturbed=add(b,deltaB),actualX=solve2x2(a,bPerturbed),actualDeltaX=subtract(actualX,xTrue);
    var actualResidual=subtract(b,matrixVectorMultiply(a,actualX)),actualResidualNorm=norm2(actualResidual);
    var realizedDeltaB=subtract(bPerturbed,b);
    return {
      thetaDeg:thetaDeg,thetaRad:degreesToRadians(thetaDeg),A:a,xTrue:xTrue,b:b,deltaB:deltaB,
      bPerturbed:bPerturbed,xHat:xHat,deltaX:deltaX,residual:residual,directionName:directionName,
      direction:copyVector(direction),xMode:xMode,xScale:xScale,perturbation:perturbation,
      bNorm:bNorm,xNorm:xNorm,xHatNorm:xHatNorm,residualNorm:residualNorm,deltaBNorm:deltaBNorm,
      spectrum:spectrum,rawRelativeResidual:rho,relativePerturbation:rho,
      backwardError:residualNorm/(spectrum.sigmaMax*xHatNorm+bNorm),forwardError:forward,
      directionGain:gain,aInvDirectionGain:gain,bOverX:bNorm/xNorm,exactForward:exactForward,
      conditionBound:spectrum.kappa*rho,identityError:Math.abs(forward-exactForward),
      residualIdentityError:norm2(add(matrixVectorMultiply(a,deltaX),residual)),
      solutionIdentityError:norm2(subtract(matrixVectorMultiply(a,xHat),bPerturbed)),
      actualX:actualX,actualDeltaX:actualDeltaX,actualResidual:actualResidual,
      actualRelativeResidual:actualResidualNorm/bNorm,
      actualForwardError:norm2(actualDeltaX)/xNorm,
      actualBackwardError:actualResidualNorm/(spectrum.sigmaMax*norm2(actualX)+bNorm),
      realizedDeltaB:realizedDeltaB,inputRoundingLoss:deltaBNorm===0?0:norm2(subtract(realizedDeltaB,deltaB))/deltaBNorm,
      actualSolveResidual:norm2(subtract(bPerturbed,matrixVectorMultiply(a,actualX)))
    };
  }

  function format(value, digits) {
    if (value === Infinity) return "∞";
    if (value === -Infinity) return "-∞";
    if (!finite(value)) return "—";
    var places = digits === undefined ? 4 : digits;
    if (value === 0) return "0";
    if (Math.abs(value) < 0.001 || Math.abs(value) >= 10000) {
      return value.toExponential(Math.min(places, 4));
    }
    var text = value.toFixed(places);
    return text.indexOf(".") === -1
      ? text
      : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function formatPercent(value) {
    return format(value * 100, 3) + "%";
  }

  function formatVector(values) {
    return "(" + values.map(function (value) { return format(value, 5); }).join(", ") + ")";
  }

  function directionLabel(directionName) {
    return directionName === "min" ? "u_min（敏感左奇异方向）" : "u_max（非敏感方向）";
  }

  function xModeLabel(xMode) {
    return xMode === "small-b" ? "基方向 (0, 1)，整体尺度由 s 指定" : "基方向 (1, 0)，整体尺度由 s 指定";
  }

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (key.slice(0, 2) === "on" && typeof value === "function") {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function appendChildren(node, children) {
    if (children === undefined || children === null) return node;
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
    });
    return node;
  }

  function makeElement(doc, tag, attrs, children) {
    var node = setAttributes(doc.createElement(tag), attrs || {});
    return appendChildren(node, children);
  }

  function svgNode(doc, tag, attrs, children) {
    var node = setAttributes(doc.createElementNS(SVG_NS, tag), attrs || {});
    return appendChildren(node, children);
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

  function metric(doc, label) {
    var value = makeElement(doc, "strong", {}, ["—"]);
    return {
      node: makeElement(doc, "div", { className: "lc-metric" }, [
        makeElement(doc, "span", {}, [label]),
        value
      ]),
      value: value
    };
  }

  function makeTable(doc, ariaLabel, headers) {
    var table = makeElement(doc, "table", { "aria-label": ariaLabel }, []);
    var headRow = makeElement(doc, "tr", {}, []);
    headers.forEach(function (header) {
      headRow.appendChild(makeElement(doc, "th", { scope: "col" }, [header]));
    });
    table.appendChild(makeElement(doc, "thead", {}, [headRow]));
    table.appendChild(makeElement(doc, "tbody", {}, []));
    return table;
  }

  function replaceTableRows(table, rows) {
    var body = table.querySelector("tbody");
    clear(body);
    rows.forEach(function (row) {
      var tr = makeElement(table.ownerDocument, "tr", {}, []);
      row.forEach(function (value) {
        tr.appendChild(makeElement(table.ownerDocument, "td", {}, [value]));
      });
      body.appendChild(tr);
    });
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function drawGeometry(doc, svg, data, uid) {
    clear(svg);
    var titleId = uid + "-geometry-title";
    var descId = uid + "-geometry-desc";
    svg.setAttribute("aria-labelledby", titleId + " " + descId);
    svg.appendChild(svgNode(doc, "title", { id: titleId }, ["两条直线与解的漂移"]));
    svg.appendChild(svgNode(doc, "desc", { id: descId }, [
      "实线是 Ax=b 的两条直线，虚线是右端加上 delta b 后的两条直线；绿色圈是真解，红色点是扰动后的解。"
    ]));

    var plotLeft = 58;
    var plotRight = 620;
    var plotTop = 32;
    var plotBottom = 298;
    var points = [data.xTrue, data.xHat];
    var minX = Math.min(0, points[0][0], points[1][0]);
    var maxX = Math.max(0, points[0][0], points[1][0]);
    var minY = Math.min(0, points[0][1], points[1][1]);
    var maxY = Math.max(0, points[0][1], points[1][1]);
    var spanX = Math.max(1, maxX - minX);
    var spanY = Math.max(1, maxY - minY);
    var pad = 0.18 * Math.max(spanX, spanY);
    spanX += 2 * pad;
    spanY += 2 * pad;
    var scale = Math.min((plotRight - plotLeft) / spanX, (plotBottom - plotTop) / spanY);
    var centerX = (minX + maxX) / 2;
    var centerY = (minY + maxY) / 2;
    var worldWidth = (plotRight - plotLeft) / scale;
    var worldHeight = (plotBottom - plotTop) / scale;
    minX = centerX - worldWidth / 2;
    maxX = centerX + worldWidth / 2;
    minY = centerY - worldHeight / 2;
    maxY = centerY + worldHeight / 2;
    var mapX = function (value) { return plotLeft + (value - minX) * scale; };
    var mapY = function (value) { return plotBottom - (value - minY) * scale; };
    var theta = data.thetaRad;
    var cosine = data.A[1][0];
    var sine = data.A[1][1];
    var lineY = function (rightHandSide, x) {
      return (rightHandSide - cosine * x) / sine;
    };

    var defs = svgNode(doc, "defs", {}, []);
    var clip = svgNode(doc, "clipPath", { id: uid + "-plot-clip" }, []);
    clip.appendChild(svgNode(doc, "rect", {
      x: plotLeft,
      y: plotTop,
      width: plotRight - plotLeft,
      height: plotBottom - plotTop
    }, []));
    defs.appendChild(clip);
    svg.appendChild(defs);

    [0, data.xTrue[0], data.xHat[0]].forEach(function (value) {
      if (value >= minX && value <= maxX) {
        svg.appendChild(svgNode(doc, "line", {
          x1: mapX(value), y1: plotTop, x2: mapX(value), y2: plotBottom, class: "lc-grid"
        }, []));
      }
    });
    [0, data.xTrue[1], data.xHat[1]].forEach(function (value) {
      if (value >= minY && value <= maxY) {
        svg.appendChild(svgNode(doc, "line", {
          x1: plotLeft, y1: mapY(value), x2: plotRight, y2: mapY(value), class: "lc-grid"
        }, []));
      }
    });
    if (0 >= minX && 0 <= maxX) {
      svg.appendChild(svgNode(doc, "line", { x1: mapX(0), y1: plotTop, x2: mapX(0), y2: plotBottom, class: "lc-axis" }, []));
    }
    if (0 >= minY && 0 <= maxY) {
      svg.appendChild(svgNode(doc, "line", { x1: plotLeft, y1: mapY(0), x2: plotRight, y2: mapY(0), class: "lc-axis" }, []));
    }

    var lineGroup = svgNode(doc, "g", { "clip-path": "url(#" + uid + "-plot-clip)" }, []);
    function addLine(x1, y1, x2, y2, className) {
      lineGroup.appendChild(svgNode(doc, "line", {
        x1: mapX(x1), y1: mapY(y1), x2: mapX(x2), y2: mapY(y2), class: className
      }, []));
    }
    addLine(data.b[0], minY, data.b[0], maxY, "lc-line-one");
    addLine(data.bPerturbed[0], minY, data.bPerturbed[0], maxY, "lc-line-one lc-shift");
    addLine(minX, lineY(data.b[1], minX), maxX, lineY(data.b[1], maxX), "lc-line-two");
    addLine(minX, lineY(data.bPerturbed[1], minX), maxX, lineY(data.bPerturbed[1], maxX), "lc-line-two lc-shift");
    lineGroup.appendChild(svgNode(doc, "line", {
      x1: mapX(data.xTrue[0]), y1: mapY(data.xTrue[1]),
      x2: mapX(data.xHat[0]), y2: mapY(data.xHat[1]), class: "lc-error-vector"
    }, []));
    svg.appendChild(lineGroup);
    for(var ti=0;ti<=4;ti+=1){
      var wx=minX+(maxX-minX)*ti/4,wy=minY+(maxY-minY)*ti/4;
      svg.appendChild(svgNode(doc,"text",{x:mapX(wx),y:plotBottom+16,"font-size":10,"text-anchor":"middle"},[format(wx,3)]));
      svg.appendChild(svgNode(doc,"text",{x:plotLeft-6,y:mapY(wy)+4,"font-size":10,"text-anchor":"end"},[format(wy,3)]));
    }
    svg.setAttribute("data-world-scale",scale);svg.setAttribute("data-world-min-x",minX);svg.setAttribute("data-world-min-y",minY);

    svg.appendChild(svgNode(doc, "circle", {
      cx: mapX(data.xTrue[0]), cy: mapY(data.xTrue[1]), r: 7, class: "lc-true-point"
    }, []));
    svg.appendChild(svgNode(doc, "circle", {
      cx: mapX(data.xHat[0]), cy: mapY(data.xHat[1]), r: 5, class: "lc-computed-point"
    }, []));
    svg.appendChild(svgNode(doc, "text", {
      x: mapX(data.xTrue[0]) + 8, y: mapY(data.xTrue[1]) - 8, "font-size": 12, "font-weight": 700
    }, ["x*"]));
    svg.appendChild(svgNode(doc, "text", {
      x: mapX(data.xHat[0]) + 8, y: mapY(data.xHat[1]) + 16, "font-size": 12, "font-weight": 700
    }, ["x_hat"]));
    svg.appendChild(svgNode(doc, "text", {
      x: plotLeft, y: 18, "font-size": 12, "font-weight": 700
    }, ["theta=" + format(data.thetaDeg, 1) + " deg; solid: b, dashed: b+delta b"]));
    svg.appendChild(svgNode(doc, "text", {
      x: plotRight, y: plotBottom + 28, "font-size": 11, "text-anchor": "end"
    }, ["x1"]));
    svg.appendChild(svgNode(doc, "text", {
      x: plotLeft - 10, y: 18, "font-size": 11, "text-anchor": "end"
    }, ["x2"]));
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }

    var endpoint = singularValues(0);
    assert(endpoint.sigmaMax === Math.sqrt(2), "theta=0 sigma max");
    assert(endpoint.sigmaMin === 0, "theta=0 sigma min");
    assert(endpoint.kappa === Infinity, "theta=0 kappa infinity");

    var right = singularValues(90);
    assert(near(right.sigmaMax, 1, 1e-12), "theta=90 sigma max");
    assert(near(right.sigmaMin, 1, 1e-12), "theta=90 sigma min");
    assert(near(right.kappa, 1, 1e-12), "theta=90 kappa one");

    var five = singularValues(5);
    assert(near(five.sigmaMax, Math.sqrt(1 + Math.cos(degreesToRadians(5))), 1e-12), "analytic sigma max");
    assert(near(five.sigmaMin, Math.sqrt(1 - Math.cos(degreesToRadians(5))), 1e-12), "analytic sigma min");
    assert(near(five.kappa, 1 / Math.tan(degreesToRadians(2.5)), 1e-10), "analytic kappa");
    assert(near(five.lambdaMax, five.sigmaMax * five.sigmaMax, 1e-12), "A transpose A max eigenvalue");
    assert(near(five.lambdaMin, five.sigmaMin * five.sigmaMin, 1e-12), "A transpose A min eigenvalue");
    assert(near(five.lambdaMax / five.lambdaMin, five.kappa * five.kappa, 1e-10), "normal-equation condition square");

    var a = matrix(30);
    var knownX = [1.25, -0.75];
    var knownB = matrixVectorMultiply(a, knownX);
    var solvedX = solve2x2(a, knownB);
    assert(near(solvedX[0], knownX[0], 1e-12) && near(solvedX[1], knownX[1], 1e-12), "2x2 solve identity");
    var singularThrown = false;
    try {
      solve2x2(matrix(0), [1, 1]);
    } catch (error) {
      singularThrown = true;
    }
    assert(singularThrown, "singular boundary rejects solve");

    var defaultData = compute(DEFAULT);
    assert(defaultData.residualIdentityError < 1e-12, "residual equals negative delta b");
    assert(defaultData.solutionIdentityError < 1e-12, "perturbed solution solves perturbed rhs");
    assert(defaultData.identityError < 1e-12, "forward error exact ledger identity");
    assert(near(defaultData.relativePerturbation, defaultData.rawRelativeResidual, 1e-12), "raw residual tracks rhs perturbation");
    assert(defaultData.forwardError <= defaultData.conditionBound + 1e-12, "condition bound");
    assert(near(defaultData.directionGain, defaultData.aInvDirectionGain, 1e-10), "sensitive direction gain");

    var zeroData = compute({
      thetaDeg: 5,
      perturbation: 0,
      direction: "min",
      xMode: "reference",
      xScale: 1
    });
    assert(zeroData.directionGain === zeroData.aInvDirectionGain, "zero perturbation uses analytic direction gain");
    assert(zeroData.forwardError === 0, "zero perturbation forward error is zero");
    assert(zeroData.exactForward === 0, "zero perturbation exact forward error is zero");
    assert(zeroData.identityError === 0, "zero perturbation identity error is zero");
    assert(finite(zeroData.forwardError) && finite(zeroData.exactForward) && finite(zeroData.identityError), "zero perturbation ledger is finite");

    var exceptionData = compute(presetById("direction-exception"));
    assert(exceptionData.forwardError < defaultData.forwardError, "non-sensitive direction is an exception");
    assert(near(exceptionData.directionGain, 1 / exceptionData.spectrum.sigmaMax, 1e-10), "max direction gain");

    var smallBData = compute(presetById("small-b"));
    assert(smallBData.bOverX < defaultData.bOverX, "small b over x scaling trap");
    assert(smallBData.identityError < 1e-12, "small b exact identity");

    PRESETS.forEach(function (preset) {
      var data = compute(preset);
      assert(finite(data.spectrum.sigmaMax), preset.id + " sigma max finite");
      assert(finite(data.spectrum.sigmaMin), preset.id + " sigma min finite");
      assert(data.spectrum.kappa >= 1, preset.id + " kappa lower bound");
      assert(data.residualIdentityError < 1e-12, preset.id + " residual identity");
      assert(data.solutionIdentityError < 1e-12, preset.id + " solution identity");
      assert(data.identityError < 1e-12, preset.id + " forward identity");
    });

    return { checks: checks, presets: PRESETS.length };
  }

  function mount(root, api) {
    if (!root || typeof document === "undefined") return;
    var doc = root.ownerDocument || document;
    installStyles(doc);
    INSTANCE += 1;
    var uid = "cl-lc-" + INSTANCE;
    var state = stateFromPreset(presetById(DEFAULT.presetId));
    var prediction = {
      amplification: null,
      direction: null,
      residual: null,
      stability: null
    };
    var revealed = false;
    var shell = makeElement(doc, "div", { className: "lc-lab" }, []);
    var refs = {};
    var predictionButtons = [];
    root.replaceChildren(shell);

    function predictionComplete() {
      return Object.keys(prediction).every(function (key) {
        return prediction[key] !== null;
      });
    }

    function buildQuestion(question, options, key) {
      var fieldset = makeElement(doc, "fieldset", { className: "lc-question" }, []);
      fieldset.appendChild(makeElement(doc, "legend", { className: "lc-question-title" }, [question]));
      var row = makeElement(doc, "div", {
        className: "lc-choice-row",
        role: "group",
        "aria-label": question
      }, []);
      options.forEach(function (option) {
        var button = makeElement(doc, "button", {
          type: "button",
          "aria-pressed": "false"
        }, [option.label]);
        button.addEventListener("click", function () {
          prediction[key] = option.value;
          renderPrediction();
        });
        predictionButtons.push({ key: key, value: option.value, node: button });
        row.appendChild(button);
      });
      fieldset.appendChild(row);
      return fieldset;
    }

    function renderPrediction() {
      predictionButtons.forEach(function (item) {
        item.node.disabled = revealed;
        item.node.setAttribute(
          "aria-pressed",
          prediction[item.key] === item.value ? "true" : "false"
        );
      });
      if (refs.checkButton) {
        refs.checkButton.disabled = revealed || !predictionComplete();
      }
      if (refs.gateFeedback && !revealed) {
        refs.gateFeedback.textContent = predictionComplete()
          ? "四项预测已记录。提交后才会显示参数、预设、图表和数值账本。"
          : "请为四个判断各选一项。";
        refs.gateFeedback.className = "lc-feedback";
      }
    }

    function resetToGate() {
      state = stateFromPreset(presetById(DEFAULT.presetId));
      prediction = {
        amplification: null,
        direction: null,
        residual: null,
        stability: null
      };
      revealed = false;
      buildGate();
      predictionButtons[0].node.focus();
      announce(api, root, "已重置；请重新完成四个预测。");
    }

    function buildGate() {
      predictionButtons = [];
      refs = {};
      shell.replaceChildren();
      shell.appendChild(makeElement(doc, "h3", {}, ["小残差为什么不保证小前向误差？"]));
      shell.appendChild(makeElement(doc, "p", { className: "lc-note" }, [
        revealed
          ? "预测已提交。现在可以调参；结果会保持揭示，只有“重新预测”才会重新门控。"
          : "模型和计算方法已固定，但参数、预设、图表与结果先锁住。请先预测四个关系。"
      ]));
      shell.appendChild(makeElement(doc, "div", { className: "lc-prompt" }, [
        revealed
          ? "预测门已完成：回看你的判断，再用下方账本检查每个归一化因子。"
          : "预测门：不要先猜某个数字；先判断“最坏方向”“残差归一化”和“算法稳定性”的关系。"
      ]));
      var questionList = makeElement(doc, "div", { className: "lc-question-list" }, []);
      questionList.appendChild(buildQuestion(
        "1 · 两行法向接近平行时，一个很小的右端扰动沿敏感方向，前向误差会怎样？",
        [
          { value: "large", label: "可能远大于残差" },
          { value: "same", label: "始终与残差相当" },
          { value: "exact-kappa", label: "必正好 κ 倍" }
        ],
        "amplification"
      ));
      questionList.appendChild(buildQuestion(
        "2 · 同一个病态 A，扰动换到非敏感奇异方向后，κ 会强制放大这一次误差吗？",
        [
          { value: "bound", label: "不会；κ 是最坏方向上界" },
          { value: "force", label: "会正好放大 κ 倍" },
          { value: "zero", label: "残差会变成 0" }
        ],
        "direction"
      ));
      questionList.appendChild(buildQuestion(
        "3 · 报告 ||b-A x_hat||/||b|| 很小时，下一步最必要的检查是什么？",
        [
          { value: "normalize", label: "连同 κ 与 b/x 归一化一起看" },
          { value: "residual-only", label: "只看残差就够了" },
          { value: "inverse", label: "改成显式求逆" }
        ],
        "residual"
      ));
      questionList.appendChild(buildQuestion(
        "4 · 部分选主元对病态 A 的作用更接近哪一句？",
        [
          { value: "stability", label: "改善算法稳定性，不治病态" },
          { value: "cure", label: "把 κ 降到 1" },
          { value: "spd-only", label: "只对 SPD 矩阵适用" }
        ],
        "stability"
      ));
      shell.appendChild(questionList);

      var checkButton = makeElement(doc, "button", {
        type: "button",
        className: "lc-primary",
        disabled: revealed
      }, [revealed ? "已提交，结果已揭示" : "提交预测并揭示"]);
      refs.checkButton = checkButton;
      checkButton.addEventListener("click", function () {
        if (!predictionComplete()) {
          refs.gateFeedback.textContent = "请先为四个判断各选一项。";
          refs.gateFeedback.className = "lc-feedback lc-warn";
          return;
        }
        revealed = true;
        buildRevealed();
        var answers = {
          amplification: "large",
          direction: "bound",
          residual: "normalize",
          stability: "stability"
        };
        var correct = Object.keys(answers).reduce(function (total, key) {
          return total + (prediction[key] === answers[key] ? 1 : 0);
        }, 0);
        refs.gateFeedback.textContent = "预测已提交，" + correct + "/4 命中。下方显示解析奇异值的近似求值、几何交点和误差账本。";
        refs.gateFeedback.className = "lc-feedback " + (correct === 4 ? "lc-pass" : "lc-warn");
        refs.revealedPanel.focus();
        announce(api, root, "预测已提交，参数、几何和误差账本已揭示。");
      });

      var resetButton = makeElement(doc, "button", { type: "button" }, [
        revealed ? "重新预测" : "重置"
      ]);
      resetButton.addEventListener("click", resetToGate);
      refs.gateFeedback = makeElement(doc, "p", {
        className: "lc-feedback",
        "aria-live": "polite"
      }, [revealed ? "预测已提交。" : "请为四个判断各选一项。"]);
      shell.appendChild(makeElement(doc, "div", { className: "lc-actions" }, [checkButton, resetButton]));
      shell.appendChild(refs.gateFeedback);
      renderPrediction();
    }

    function addRangeControl(container, key, label, minimum, maximum, step, formatter) {
      var id = uid + "-" + key;
      var output = makeElement(doc, "output", { id: id + "-value" }, [""]);
      var labelNode = makeElement(doc, "label", { htmlFor: id }, [label + " = ", output]);
      var input = makeElement(doc, "input", {
        id: id,
        type: "range",
        min: String(minimum),
        max: String(maximum),
        step: String(step),
        value: String(state[key]),
        "aria-label": label
      });
      input.addEventListener("input", function () {
        state[key] = clamp(Number(input.value), minimum, maximum);
        state.presetId = "custom";
        renderResults();
      });
      container.appendChild(makeElement(doc, "div", { className: "lc-control" }, [
        labelNode,
        input,
        makeElement(doc, "div", { className: "lc-scale" }, [
          makeElement(doc, "span", {}, [formatter(minimum)]),
          makeElement(doc, "span", {}, [formatter((minimum + maximum) / 2)]),
          makeElement(doc, "span", {}, [formatter(maximum)])
        ])
      ]));
      return { input: input, output: output };
    }

    function buildControls() {
      var controls = makeElement(doc, "section", {
        className: "lc-controls",
        "aria-labelledby": uid + "-controls-title"
      }, []);
      controls.appendChild(makeElement(doc, "h4", { id: uid + "-controls-title" }, ["揭示后的参数"]));
      refs.theta = addRangeControl(controls, "thetaDeg", "法向夹角 θ（度）", 2, 90, 0.5, function (value) { return format(value, 1); });
      var perturbBox=makeElement(doc,"div",{className:"lc-control"},[]);
      var perturbId=uid+"-perturbation";
      var perturbOutput=makeElement(doc,"output",{},[]);
      var perturbInput=makeElement(doc,"input",{id:perturbId,type:"range",min:"-18",max:"-1",step:"0.25","aria-label":"右端扰动十进制指数"},[]);
      perturbInput.addEventListener("input",function(){state.perturbation=Math.pow(10,Number(perturbInput.value));state.presetId="custom";renderResults();});
      perturbBox.appendChild(makeElement(doc,"label",{htmlFor:perturbId},["相对右端扰动 η=10^e；e 从 −18 到 −1：",perturbOutput]));
      perturbBox.appendChild(perturbInput);
      var zero=makeElement(doc,"button",{type:"button","aria-pressed":"false"},["切换零扰动"]);
      zero.addEventListener("click",function(){state.perturbation=state.perturbation===0?DEFAULT.perturbation:0;state.presetId="custom";renderResults();});
      perturbBox.appendChild(zero);controls.appendChild(perturbBox);refs.perturbation={input:perturbInput,output:perturbOutput,zero:zero};
      refs.xScale = addRangeControl(controls, "xScale", "真解整体尺度 s", 0.25, 2, 0.05, function (value) { return format(value, 2); });

      var directionSet = makeElement(doc, "fieldset", {}, [makeElement(doc, "legend", {}, ["扰动方向"]) ]);
      var directionRow = makeElement(doc, "div", { className: "lc-option-row" }, []);
      [
        ["min", "u_min：敏感"],
        ["max", "u_max：非敏感"]
      ].forEach(function (item) {
        var button = makeElement(doc, "button", { type: "button", "aria-pressed": "false" }, [item[1]]);
        button.addEventListener("click", function () {
          state.direction = item[0];
          state.presetId = "custom";
          renderResults();
        });
        if (!refs.directionButtons) refs.directionButtons = [];
        refs.directionButtons.push({ value: item[0], node: button });
        directionRow.appendChild(button);
      });
      directionSet.appendChild(directionRow);
      controls.appendChild(directionSet);

      var xSet = makeElement(doc, "fieldset", {}, [makeElement(doc, "legend", {}, ["固定真解 x*"]) ]);
      var xRow = makeElement(doc, "div", { className: "lc-option-row" }, []);
      [
        ["reference", "(1, 0)：参考"],
        ["small-b", "(0, 1)：b 较小"]
      ].forEach(function (item) {
        var button = makeElement(doc, "button", { type: "button", "aria-pressed": "false" }, [item[1]]);
        button.addEventListener("click", function () {
          state.xMode = item[0];
          state.presetId = "custom";
          renderResults();
        });
        if (!refs.xModeButtons) refs.xModeButtons = [];
        refs.xModeButtons.push({ value: item[0], node: button });
        xRow.appendChild(button);
      });
      xSet.appendChild(xRow);
      controls.appendChild(xSet);

      var presetSet = makeElement(doc, "fieldset", {}, [makeElement(doc, "legend", {}, ["教学预设"]) ]);
      var presetRow = makeElement(doc, "div", { className: "lc-preset-row" }, []);
      refs.presetButtons = [];
      PRESETS.forEach(function (preset) {
        var button = makeElement(doc, "button", { type: "button", "aria-pressed": "false" }, [preset.label]);
        button.addEventListener("click", function () {
          state = stateFromPreset(preset);
          renderResults();
          announce(api, root, "已切换到" + preset.label + "。");
        });
        refs.presetButtons.push({ id: preset.id, node: button });
        presetRow.appendChild(button);
      });
      presetSet.appendChild(presetRow);
      controls.appendChild(presetSet);
      controls.appendChild(makeElement(doc, "p", { className: "lc-note" }, [
        "整体缩放会改变绝对漂移，但相对误差的精确关系还要看 ||b||/||x*||；换方向则改变 ||A⁻¹δb||/||δb||。"
      ]));
      var resetButton = makeElement(doc, "button", { type: "button" }, ["重新预测"]);
      resetButton.addEventListener("click", resetToGate);
      controls.appendChild(makeElement(doc, "div", { className: "lc-actions" }, [resetButton]));
      return controls;
    }

    function buildStage() {
      var stage = makeElement(doc, "section", {
        className: "lc-stage",
        "aria-labelledby": uid + "-stage-title"
      }, []);
      var svg = svgNode(doc, "svg", {
        class: "lc-svg",
        width: "640",
        height: "360",
        viewBox: "0 0 640 360",
        role: "img",
        "aria-label": "两条直线交点与解漂移几何图"
      }, []);
      refs.svg = svg;
      stage.appendChild(makeElement(doc, "div", { className: "lc-stage-frame", role:"region", tabindex:"0", "aria-label":"可滚动的交点几何图" }, [
        makeElement(doc, "div", { className: "lc-stage-title" }, [
          makeElement(doc, "span", { id: uid + "-stage-title" }, ["两条直线的交点几何"]),
          makeElement(doc, "span", {}, ["实线 b；虚线 b+δb"])
        ]),
        svg,
        makeElement(doc, "div", { className: "lc-legend" }, [
          makeElement(doc, "span", {}, [makeElement(doc, "i", { className: "lc-swatch lc-swatch-blue" }, []), "第一条方程直线"]),
          makeElement(doc, "span", {}, [makeElement(doc, "i", { className: "lc-swatch lc-swatch-gold" }, []), "第二条方程直线"]),
          makeElement(doc, "span", {}, [makeElement(doc, "i", { className: "lc-swatch lc-swatch-red" }, []), "解的漂移"])
        ])
      ]));

      refs.metrics = [
        metric(doc, "σmax(A)"),
        metric(doc, "σmin(A)"),
        metric(doc, "κ₂(A)"),
        metric(doc, "||b||/||x*||"),
        metric(doc, "原始相对残差"),
        metric(doc, "相对前向误差")
      ];
      stage.appendChild(makeElement(doc, "div", { className: "lc-metrics" }, refs.metrics.map(function (item) { return item.node; })));

      stage.appendChild(makeElement(doc, "h4", {}, ["解析扰动账本"]));
      refs.vectorTable = makeTable(doc, "线性方程组向量账本", ["对象", "当前值", "恒等式 / 读法"]);
      stage.appendChild(makeElement(doc, "div", { className: "lc-table-wrap", role:"region", tabindex:"0", "aria-label":"可滚动的解析向量表" }, [refs.vectorTable]));
      stage.appendChild(makeElement(doc, "h4", {}, ["残差、后向误差与前向误差"]));
      refs.errorTable = makeTable(doc, "残差后向前向误差账本", ["账本项", "模型数值（双精度求值）", "与 κ 的关系"]);
      stage.appendChild(makeElement(doc, "div", { className: "lc-table-wrap", role:"region", tabindex:"0", "aria-label":"可滚动的解析误差表" }, [refs.errorTable]));
      stage.appendChild(makeElement(doc,"h4",{},["实际 binary64 求解：最后几位可能改变故事"]));
      refs.actualTable=makeTable(doc,"实际浮点求解账本",["对象","实际数值","含义"]);
      stage.appendChild(makeElement(doc,"div",{className:"lc-table-wrap",role:"region",tabindex:"0","aria-label":"可滚动的实际浮点表"},[refs.actualTable]));
      stage.appendChild(makeElement(doc,"p",{className:"lc-note"},["上表是解析扰动模型的双精度求值；下表真正形成 b+δb 并做带部分选主元的2×2消元。很小的扰动可能在输入加法时就被舍掉。实际残差也用双精度计算，不能当作已认证的误差界。图中点太接近时会重合，请读数值。"]));
      refs.interpretation = makeElement(doc, "p", { className: "lc-interpretation", "aria-live": "polite" }, [""]);
      stage.appendChild(refs.interpretation);
      return stage;
    }

    function renderResults() {
      if (!revealed) return;
      var data = compute(state);
      refs.theta.input.value = String(state.thetaDeg);
      refs.theta.output.textContent = format(state.thetaDeg, 1) + "°";
      refs.perturbation.input.value = state.perturbation===0?"-18":String(Math.log10(state.perturbation));
      refs.perturbation.input.disabled = state.perturbation===0;
      refs.perturbation.zero.setAttribute("aria-pressed",String(state.perturbation===0));
      refs.perturbation.output.textContent = formatPercent(state.perturbation);
      refs.xScale.input.value = String(state.xScale);
      refs.xScale.output.textContent = format(state.xScale, 2);
      (refs.directionButtons || []).forEach(function (item) {
        item.node.setAttribute("aria-pressed", item.value === state.direction ? "true" : "false");
      });
      (refs.xModeButtons || []).forEach(function (item) {
        item.node.setAttribute("aria-pressed", item.value === state.xMode ? "true" : "false");
      });
      (refs.presetButtons || []).forEach(function (item) {
        item.node.setAttribute("aria-pressed", item.id === state.presetId ? "true" : "false");
      });
      refs.metrics[0].value.textContent = format(data.spectrum.sigmaMax, 6);
      refs.metrics[1].value.textContent = format(data.spectrum.sigmaMin, 6);
      refs.metrics[2].value.textContent = format(data.spectrum.kappa, 5);
      refs.metrics[3].value.textContent = format(data.bOverX, 5);
      refs.metrics[4].value.textContent = formatPercent(data.rawRelativeResidual);
      refs.metrics[5].value.textContent = formatPercent(data.forwardError);
      drawGeometry(doc, refs.svg, data, uid);

      replaceTableRows(refs.vectorTable, [
        ["θ 与 A", format(data.thetaDeg, 2) + "°；[[1,0],[" + format(data.A[1][0], 6) + "," + format(data.A[1][1], 6) + "]]", "A 的两行法向夹角为 θ"],
        ["x*", formatVector(data.xTrue), xModeLabel(data.xMode) + "；保持不变"],
        ["b=A x*", formatVector(data.b), "模型右端；||b||/||x*||=" + format(data.bOverX, 6)],
        ["δb", formatVector(data.deltaB), directionLabel(data.directionName) + "；||δb||/||b||=" + formatPercent(data.relativePerturbation)],
        ["x_hat", formatVector(data.xHat), "x*+解析 δx；最后坐标加法仍会舍入"],
        ["r=b-A x_hat", formatVector(data.residual), "模型 r=-δb；Aδx-δb 核算残差=" + format(data.residualIdentityError, 3)]
      ]);

      replaceTableRows(refs.errorTable, [
        ["σmax, σmin", format(data.spectrum.sigmaMax, 8) + "；" + format(data.spectrum.sigmaMin, 8), "σ² 是 AᵀA 的特征值 1±cosθ"],
        ["κ₂(A)", format(data.spectrum.kappa, 8), "σmax/σmin；最坏方向，不是本次必然放大"],
        ["原始相对残差 ρ", formatPercent(data.rawRelativeResidual), "||r||/||b||；这里等于 ||δb||/||b||"],
        ["相对后向误差 η_b", formatPercent(data.backwardError), "||r||/(||A||₂||x_hat||+||b||)"],
        ["相对前向误差 η_f", formatPercent(data.forwardError), "||x_hat-x*||/||x*||"],
        ["方向增益", format(data.directionGain, 8), "||A⁻¹δb||/||δb||；理论值=" + format(data.aInvDirectionGain, 8)],
        ["精确关系", formatPercent(data.exactForward), "ρ × (||b||/||x*||) × 方向增益；与 η_f 差=" + format(data.identityError, 3)],
        ["κ 上界", formatPercent(data.conditionBound), "η_f ≤ κ₂(A)ρ；实际值可远低于上界"]
      ]);

      replaceTableRows(refs.actualTable,[
        ["实际形成的 δb",formatVector(data.realizedDeltaB),"fl(b+δb)-b；请求扰动相对损失="+formatPercent(data.inputRoundingLoss)],
        ["浮点消元解",formatVector(data.actualX),"对存入的 A 与 fl(b+δb) 做部分选主元消元"],
        ["实际相对前向误差",formatPercent(data.actualForwardError),"||x_float-x*||/||x*||；与模型值 "+formatPercent(data.forwardError)+" 分开"],
        ["实际相对残差",formatPercent(data.actualRelativeResidual),"对原始 b：||fl(b-Ax_float)||/||b||"],
        ["实际共同后向误差估计",formatPercent(data.actualBackwardError),"允许同时扰动A和b的2-范数模型；残差仍可能舍入"],
        ["已存扰动系统求解残差",format(data.actualSolveResidual,6),"||fl(b_perturbed-Ax_float)||；0不证明不存在误差"]
      ]);
      var directionText = data.directionName === "min"
        ? "扰动沿最小左奇异方向；增益为1/σmin。"
        : "扰动沿最大左奇异方向；同一个 κ 并没有强迫这次扰动达到最坏放大。";
      var scaleText = data.xMode === "small-b"
        ? "当前 ||b||/||x*|| 较小，所以只报 ||r||/||b|| 会改变直觉；要同时看 b/x 归一化。"
        : "当前真解取参考方向；整体尺度变化会同时改变绝对量，不能替代相对账本。";
      refs.interpretation.textContent =
        "θ=" + format(data.thetaDeg, 2) + "°，κ₂=" + format(data.spectrum.kappa, 5) + "；" +
        directionText + " " + scaleText + " 解析模型核对：η_f=" + formatPercent(data.forwardError) +
        "，κ₂ρ=" + formatPercent(data.conditionBound) + "。小的归一化残差有助于判断后向误差；前向可信度还要结合条件数、扰动方向及实际浮点求解表。";
    }

    function buildRevealed() {
      buildGate();
      var revealedPanel = makeElement(doc, "section", { className: "lc-revealed", tabindex:"-1" }, []);
      refs.revealedPanel = revealedPanel;
      revealedPanel.appendChild(makeElement(doc, "h4", {}, ["理想模型与浮点求解"]));
      revealedPanel.appendChild(makeElement(doc, "p", { className: "lc-note" }, [
        "现在可连续调节 θ、扰动大小、扰动方向、真解尺度和真解方向；图表与账本保持揭示。"
      ]));
      var controls = buildControls();
      var stage = buildStage();
      revealedPanel.appendChild(makeElement(doc, "div", { className: "lc-layout" }, [controls, stage]));
      shell.appendChild(revealedPanel);
      renderResults();
    }

    buildGate();
  }

  return {
    drawGeometry: drawGeometry,
    DEFAULT: DEFAULT,
    PRESETS: PRESETS,
    matrix: matrix,
    singularValues: singularValues,
    singularDirections: singularDirections,
    solve2x2: solve2x2,
    compute: compute,
    selfTest: selfTest,
    mount: mount
  };
});

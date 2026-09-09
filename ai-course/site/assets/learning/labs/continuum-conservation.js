(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("continuum-conservation", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("continuum-conservation self-test: PASS (" + report.checks + " checks)\n");
    } catch (error) {
      process.stderr.write("continuum-conservation self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-continuum-conservation-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;
  var DEFAULT = { densityMode: "constant", samples: 21, massFlow: 1, x0: 0.2, x1: 0.8 };
  var PRESETS = [
    { id: "constant", label: "恒密度：不可压运动", densityMode: "constant" },
    { id: "variable", label: "变密度：仍守恒质量", densityMode: "variable" }
  ];

  var STYLE_TEXT = [
    ".cc-lab{--cc-blue:var(--cl-blue,#315f9d);--cc-gold:var(--cl-gold,#9b6a12);--cc-green:var(--cl-green,#39734d);--cc-red:var(--cl-red,#b64335);--cc-soft:var(--fg-soft,#6f6a60);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
    ".cc-lab *,.cc-lab *::before,.cc-lab *::after{box-sizing:border-box;}.cc-lab [hidden]{display:none!important;}.cc-lab h3,.cc-lab h4{margin:0;color:var(--fg);letter-spacing:0;}.cc-lab h3{font-size:1.18rem;}.cc-lab h4{font-size:1rem;}.cc-lab .cc-note,.cc-lab .cc-feedback{color:var(--cc-soft);font-size:13px;line-height:1.7;}.cc-lab .cc-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--cc-gold);background:var(--bg);}.cc-lab fieldset{min-width:0;margin:0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);}.cc-lab legend{max-width:100%;padding:0 4px;color:var(--cc-soft);font-size:13px;line-height:1.5;}.cc-lab .cc-question-list{display:grid;gap:10px;}.cc-lab .cc-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}",
    ".cc-lab button,.cc-lab input{font:inherit;}.cc-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}.cc-lab button:hover{border-color:var(--accent);}.cc-lab button[aria-pressed=\"true\"],.cc-lab button.cc-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}.cc-lab button:disabled{cursor:not-allowed;opacity:.55;}.cc-lab button:focus-visible,.cc-lab input:focus-visible,.cc-lab [tabindex]:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}.cc-lab .cc-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}.cc-lab .cc-actions>*{flex:1 1 170px;}.cc-lab .cc-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}.cc-lab .cc-pass{color:var(--cc-green);}.cc-lab .cc-warn{color:var(--cc-red);}",
    ".cc-lab .cc-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.cc-lab .cc-preset-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:10px 0 12px;}.cc-lab .cc-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 16px;align-items:end;}.cc-lab .cc-control{display:grid;gap:5px;min-width:0;}.cc-lab .cc-control label{color:var(--cc-soft);font-size:13px;font-weight:700;}.cc-lab .cc-control output{color:var(--accent);font-variant-numeric:tabular-nums;}.cc-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}",
    ".cc-lab .cc-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin:13px 0;}.cc-lab .cc-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.cc-lab .cc-metric:nth-child(3n+1){border-top-color:var(--cc-blue);}.cc-lab .cc-metric:nth-child(3n+2){border-top-color:var(--cc-gold);}.cc-lab .cc-metric:nth-child(3n){border-top-color:var(--cc-green);}.cc-lab .cc-metric span{display:block;color:var(--cc-soft);font-size:11.5px;line-height:1.4;}.cc-lab .cc-metric strong{display:block;margin-top:3px;font-size:14px;line-height:1.45;overflow-wrap:anywhere;font-variant-numeric:tabular-nums;}",
    ".cc-lab .cc-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch;}.cc-lab .cc-svg{display:block;width:100%;min-width:700px;height:auto;color:var(--fg);}.cc-lab .cc-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.cc-lab .cc-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.68;}.cc-lab .cc-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.72;}.cc-lab .cc-area{fill:none;stroke:var(--cc-blue);stroke-width:2;}.cc-lab .cc-velocity{fill:none;stroke:var(--cc-green);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;}.cc-lab .cc-density{fill:none;stroke:var(--cc-gold);stroke-width:2;stroke-dasharray:5 4;}.cc-lab .cc-bar-mass{fill:var(--cc-blue);fill-opacity:.72;}.cc-lab .cc-bar-momentum{fill:var(--cc-red);fill-opacity:.72;}.cc-lab .cc-bar-force{fill:var(--cc-green);fill-opacity:.72;}.cc-lab .cc-title{font-size:13px;font-weight:750;}.cc-lab .cc-label{font-size:11px;}",
    ".cc-lab .cc-table-wrap{max-width:100%;margin-top:13px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.cc-lab table{width:100%;min-width:900px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.cc-lab caption{padding:0 0 7px;text-align:left;color:var(--cc-soft);font-size:12px;}.cc-lab th,.cc-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;}.cc-lab th{color:var(--cc-soft);font-size:11.5px;font-weight:750;}.cc-lab .cc-interpretation{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--cc-green);background:var(--bg);font-size:13px;line-height:1.7;}",
    "@media(max-width:980px){.cc-lab .cc-metrics{grid-template-columns:repeat(3,minmax(0,1fr));}.cc-lab .cc-controls{grid-template-columns:repeat(2,minmax(0,1fr));}}@media(max-width:680px){.cc-lab .cc-choice-grid,.cc-lab .cc-preset-grid,.cc-lab .cc-controls,.cc-lab .cc-metrics{grid-template-columns:minmax(0,1fr);}.cc-lab .cc-frame{padding:5px;}}@media(prefers-reduced-motion:reduce){.cc-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
    , '[data-theme="dark"] .cc-lab{--cc-blue:#90baff;--cc-green:#91dba4;--cc-gold:#efc976;--cc-red:#ffab9c;--cc-soft:#c4c0b8;}'
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || EPS) * scale;
  }

  function number(value,lo,hi,name) { if (!finite(value)||value<lo||value>hi) throw new RangeError(name+" outside domain"); return value; }
  function modeCheck(mode) { if(mode!=="constant"&&mode!=="variable")throw new RangeError("Unknown density mode"); }
  function position(x) { return number(x,0,1,"x"); }
  function flowCheck(flow) { if(flow===undefined)return 1;if(flow!==1)throw new RangeError("This model fixes mass flow at 1");return flow; }
  function normalizeConfig(input) {
    var source=input===undefined?{}:input;
    if(!source||typeof source!=="object"||Array.isArray(source))throw new TypeError("Expected configuration");
    var mode=source.densityMode===undefined?DEFAULT.densityMode:source.densityMode;modeCheck(mode);
    var samples=source.samples===undefined?DEFAULT.samples:source.samples;number(samples,9,41,"samples");if(!Number.isInteger(samples))throw new RangeError("Integer sample count required");
    var x0=source.x0===undefined?DEFAULT.x0:source.x0,x1=source.x1===undefined?DEFAULT.x1:source.x1;
    number(x0,.05,.8,"x0");number(x1,.2,.95,"x1");if(x1<=x0)throw new RangeError("Outlet must follow inlet");
    return {densityMode:mode,samples:samples,massFlow:flowCheck(source.massFlow),x0:x0,x1:x1};
  }

  function area(x) {
    position(x);
    var z = (x - 0.5) / 0.22;
    return 1 - 0.45 * Math.exp(-z * z);
  }

  function areaDerivative(x) {
    position(x);
    var z = (x - 0.5) / 0.22;
    return 0.9 * (x - 0.5) / (0.22 * 0.22) * Math.exp(-z * z);
  }

  function density(mode, x) {
    modeCheck(mode);position(x);
    return mode === "variable" ? 1 + 0.2 * x : 1;
  }

  function densityDerivative(mode) {
    modeCheck(mode);
    return mode === "variable" ? 0.2 : 0;
  }

  function velocity(mode, x, massFlow) {
    var flow = flowCheck(massFlow);
    return flow / (density(mode, x) * area(x));
  }

  function velocityDerivative(mode, x, massFlow) {
    var speed = velocity(mode, x, massFlow);
    return -speed * (densityDerivative(mode) / density(mode, x) + areaDerivative(x) / area(x));
  }

  function materialDerivativeDensity(mode, x, massFlow) {
    return velocity(mode, x, massFlow) * densityDerivative(mode);
  }

  function quasiOneDDivergence(mode, x, massFlow) {
    var speed = velocity(mode, x, massFlow);
    var derivative = velocityDerivative(mode, x, massFlow);
    return areaDerivative(x) / area(x) * speed + derivative;
  }

  function continuityResidual(mode, x, massFlow) {
    return materialDerivativeDensity(mode, x, massFlow) + density(mode, x) * quasiOneDDivergence(mode, x, massFlow);
  }

  function pressure(x) {
    position(x);
    return 1.4 - 0.3 * x;
  }

  function momentumFlux(mode, x, massFlow) {
    return density(mode, x) * area(x) * velocity(mode, x, massFlow) * velocity(mode, x, massFlow);
  }

  function controlVolumeLedger(input) {
    var config = normalizeConfig(input);
    var rhoIn = density(config.densityMode, config.x0);
    var rhoOut = density(config.densityMode, config.x1);
    var speedIn = velocity(config.densityMode, config.x0, config.massFlow);
    var speedOut = velocity(config.densityMode, config.x1, config.massFlow);
    var massIn = rhoIn * area(config.x0) * speedIn;
    var massOut = rhoOut * area(config.x1) * speedOut;
    var momentumIn = momentumFlux(config.densityMode, config.x0, config.massFlow);
    var momentumOut = momentumFlux(config.densityMode, config.x1, config.massFlow);
    var pressureForce = pressure(config.x0) * area(config.x0) - pressure(config.x1) * area(config.x1);
    var momentumChange = momentumOut - momentumIn;
    var wallForce = momentumChange - pressureForce;
    return {
      x0: config.x0,
      x1: config.x1,
      massIn: massIn,
      massOut: massOut,
      accumulation: 0,
      massResidual: massOut - massIn,
      momentumIn: momentumIn,
      momentumOut: momentumOut,
      momentumChange: momentumChange,
      pressureForce: pressureForce,
      wallForce: wallForce,
      bodyForce: 0,
      momentumResidual: pressureForce + wallForce - momentumChange
    };
  }

  function sampleField(input) {
    var config = normalizeConfig(input);
    var rows = [];
    var index;
    var x;
    for (index = 0; index < config.samples; index += 1) {
      x = index / (config.samples - 1);
      rows.push({
        x: x,
        area: area(x),
        rho: density(config.densityMode, x),
        velocity: velocity(config.densityMode, x, config.massFlow),
        massFlux: density(config.densityMode, x) * area(x) * velocity(config.densityMode, x, config.massFlow),
        materialDensityRate: materialDerivativeDensity(config.densityMode, x, config.massFlow),
        divergence: quasiOneDDivergence(config.densityMode, x, config.massFlow),
        continuityResidual: continuityResidual(config.densityMode, x, config.massFlow)
      });
    }
    return rows;
  }

  function compute(input) {
    var config = normalizeConfig(input);
    var field = sampleField(config);
    var ledger = controlVolumeLedger(config);
    var maxResidual = field.reduce(function (maximum, row) { return Math.max(maximum, Math.abs(row.continuityResidual)); }, 0);
    var massFluxRange = field.reduce(function (range, row) {
      return [Math.min(range[0], row.massFlux), Math.max(range[1], row.massFlux)];
    }, [Infinity, -Infinity]);
    var throat = { x:.5, area:area(.5), rho:density(config.densityMode,.5), velocity:velocity(config.densityMode,.5,1), materialDensityRate:materialDerivativeDensity(config.densityMode,.5,1), divergence:quasiOneDDivergence(config.densityMode,.5,1) };
    return {
      config: config,
      field: field,
      throat: throat,
      ledger: ledger,
      maxContinuityResidual: maxResidual,
      massFluxRange: massFluxRange,
      incompressibleModel: config.densityMode === "constant",
      evidenceLabel: "有限网格与控制体积算术：数值证据，不是连续介质定理证明"
    };
  }

  function format(value, digits) {
    if (value === null || value === undefined || !finite(value)) return "—";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.0005) return value.toExponential(Math.min(places, 4));
    return places===0?value.toFixed(0):value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function appendChildren(node, children) {
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
    });
    return node;
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
    if (!doc || !doc.head || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function metric(doc, label, value) {
    return element(doc, "div", { className: "cc-metric" }, [element(doc, "span", {}, [label]), element(doc, "strong", {}, [value])]);
  }

  function tableElement(doc, captionText, headers, rows) {
    var head = element(doc, "tr", {}, headers.map(function (header) { return element(doc, "th", { scope: "col" }, [header]); }));
    var body = element(doc, "tbody", {}, rows.map(function (row) {
      return element(doc, "tr", {}, row.map(function (cell, index) { return element(doc, index === 0 ? "th" : "td", index === 0 ? { scope: "row" } : {}, [cell]); }));
    }));
    return element(doc, "table", {}, [element(doc, "caption", {}, [captionText]), element(doc, "thead", {}, [head]), body]);
  }

  function svgText(doc, x, y, text, attrs) {
    var merged = { x: x, y: y, className: "cc-label" };
    Object.keys(attrs || {}).forEach(function (key) { merged[key] = attrs[key]; });
    return svgElement(doc, "text", merged, [text]);
  }

  function pathFor(rows, field, x, y) {
    return rows.map(function (row, index) { return (index ? "L" : "M") + x(row.x) + " " + y(row[field]); }).join(" ");
  }

  function drawSvg(doc, result, uid) {
    var svg=svgElement(doc,"svg",{className:"cc-svg",viewBox:"0 0 740 660",role:"img","aria-labelledby":uid+"-title "+uid+"-desc"},[]);
    svg.appendChild(svgElement(doc,"title",{id:uid+"-title"},["分量纲的喷管场量与有符号力"]));
    svg.appendChild(svgElement(doc,"desc",{id:uid+"-desc"},["左侧面积、速度、密度分别使用标明的纵轴；虚线表示控制体积端点。右侧质量流率单列，动量通量和力使用共同有符号纵轴，负力向下。"]));
    function shape(tag,attrs){var e=svgElement(doc,tag,attrs,[]);svg.appendChild(e);return e;}
    function text(x,y,t,attrs){svg.appendChild(svgText(doc,x,y,t,attrs));}
    var panels=[{key:"area",label:"A / A₀",max:1.25,cls:"cc-area"},{key:"velocity",label:"u / U₀",max:2,cls:"cc-velocity"},{key:"rho",label:"ρ / ρ₀",max:1.25,cls:"cc-density"}];
    panels.forEach(function(p,i){var top=65+185*i,bottom=top+110;function x(v){return 50+290*v}function y(v){return bottom-110*v/p.max}
      text(50,top-20,p.label+"（独立纵轴）",{className:"cc-title"});
      [0,p.max/2,p.max].forEach(function(v){shape("line",{x1:50,y1:y(v),x2:340,y2:y(v),className:"cc-grid"});text(43,y(v)+4,format(v,3),{"text-anchor":"end"});});
      shape("line",{x1:50,y1:top,x2:50,y2:bottom,className:"cc-axis"});shape("line",{x1:50,y1:bottom,x2:340,y2:bottom,className:"cc-axis"});
      [0,.5,1].forEach(function(v){text(x(v),bottom+18,String(v),{"text-anchor":"middle"});});text(265,bottom+36,"x / L₀");
      shape("path",{d:pathFor(result.field,p.key,x,y),className:p.cls,"data-field":p.key,fill:"none"});
      [result.config.x0,result.config.x1].forEach(function(v,j){shape("line",{x1:x(v),y1:top,x2:x(v),y2:bottom,stroke:"var(--cc-red)","stroke-dasharray":"4 4","data-endpoint":p.key+":"+j});});
    });
    text(400,45,"动量通量与力：同一单位",{className:"cc-title"});
    text(400,75,"质量流率另列：入 "+format(result.ledger.massIn,4)+"；出 "+format(result.ledger.massOut,4));
    text(400,100,"质量单位 ρ₀U₀A₀；下图单位 ρ₀U₀²A₀");
    var l=result.ledger,bars=[{id:"in",label:"动量入",value:l.momentumIn,cls:"cc-bar-momentum"},{id:"out",label:"动量出",value:l.momentumOut,cls:"cc-bar-momentum"},{id:"net",label:"净流出",value:l.momentumChange,cls:"cc-bar-momentum"},{id:"pressure",label:"端压力",value:l.pressureForce,cls:"cc-bar-force"},{id:"wall",label:"壁面力",value:l.wallForce,cls:"cc-bar-force"}],zero=350,scale=70;
    [-2,-1,0,1,2].forEach(function(v){var y=zero-scale*v;shape("line",{x1:420,y1:y,x2:715,y2:y,className:v===0?"cc-axis":"cc-grid"});text(410,y+4,String(v),{"text-anchor":"end"});});
    bars.forEach(function(bar,i){var x=430+58*i,y=zero-scale*bar.value;shape("rect",{x:x,y:Math.min(y,zero),width:32,height:Math.abs(bar.value)*scale,className:bar.cls,"data-bar":bar.id});text(x+16,bar.value>=0?y-9:y+17,format(bar.value,3),{"text-anchor":"middle"});text(x+16,535,bar.label,{"text-anchor":"middle"});});
    text(400,565,"正：向右；负：向左（柱形向下）。");
    text(400,590,"净流出 = 端压力 + 壁面力，体力 = 0。");
    text(50,625,"红虚线：x₀ = "+format(result.config.x0,2)+"，x₁ = "+format(result.config.x1,2)+"；曲线为 "+result.config.samples+" 点连线，导数采用解析式。");
    text(50,647,"壁面合力由差额定义，残差小只检查算术一致性；不构成完整流场的动力学验证。");
    return svg;
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
    var status = root.querySelector("[data-cc-status]");
    if (status) status.textContent = message;
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    installStyles(doc);
    var uid = "cc-" + (++INSTANCE);
    var state = { densityMode: DEFAULT.densityMode, samples: DEFAULT.samples, x0: DEFAULT.x0, x1: DEFAULT.x1 };
    var prediction = { speed: null, density: null, momentum: null };
    var revealed = false;
    var score = 0;
    var shell = element(doc, "div", { className: "cc-lab" }, []);
    clear(root);
    root.appendChild(shell);

    function addPrediction(list, key, legendText, options) {
      var fieldset = element(doc, "fieldset", {}, [element(doc, "legend", {}, [legendText])]);
      var grid = element(doc, "div", { className: "cc-choice-grid" }, []);
      options.forEach(function (option) {
        var button = element(doc, "button", { type: "button", "aria-pressed": prediction[key] === option.value ? "true" : "false", "data-cc-choice": key+":"+option.value }, [option.label]);
        button.addEventListener("click", function () {
          prediction[key]=option.value;revealed=false;renderGate();
          shell.querySelector('[data-cc-choice="'+key+':'+option.value+'"]').focus();
        });
        grid.appendChild(button);
      });
      fieldset.appendChild(grid);
      list.appendChild(fieldset);
    }

    function complete() {
      return prediction.speed !== null && prediction.density !== null && prediction.momentum !== null;
    }

    function renderGate() {
      clear(shell);
      shell.appendChild(element(doc, "h3", {}, ["连续介质守恒审计：随体与控制体积"]));
      shell.appendChild(element(doc, "p", { className: "cc-note" }, [revealed ? "预测已提交；可以切换恒密度/变密度模式和控制体积端点。" : "先判断喷管速度、不可压条件和动量通量，再打开数值账本。"]));
      shell.appendChild(element(doc, "div", { className: "cc-prompt" }, [revealed ? "这里是平滑准一维喷管的有限算术；图形展示守恒账如何对账，不把采样点当作连续方程的证明。" : "预测门：物质导数与散度、恒密度与不可压、控制体积动量通量分别判断。"]));
      var questions = element(doc, "div", { className: "cc-question-list" }, []);
      addPrediction(questions, "speed", "1 · 恒密度喷管变窄且质量流率不变时，速度？", [
        { value: "up", label: "变大" },
        { value: "down", label: "变小" },
        { value: "none", label: "不由连续性决定" }
      ]);
      addPrediction(questions, "density", "2 · 连续性成立且 ρ>0，Dρ/Dt=0 意味着？", [
        { value: "yes", label: "全空间密度相同" },
        { value: "coupled", label: "div u=0，密度可不均匀" },
        { value: "opposite", label: "总是相反" }
      ]);
      addPrediction(questions, "momentum", "3 · 控制体积动量账是否必须列净通量？", [
        { value: "flux", label: "必须列 ρu²A" },
        { value: "pressure", label: "只列压力" },
        { value: "local", label: "只列 ρDu/Dt" }
      ]);
      shell.appendChild(questions);
      var actions = element(doc, "div", { className: "cc-actions" }, []);
      var reveal = element(doc, "button", { type: "button", className: "cc-primary", disabled: revealed || !complete() }, [revealed ? "账本已揭示" : "提交预测并揭示"]);
      reveal.addEventListener("click", function () {
        if (!complete()) return;
        score = (prediction.speed === "up" ? 1 : 0) + (prediction.density === "coupled" ? 1 : 0) + (prediction.momentum === "flux" ? 1 : 0);
        revealed = true;
        renderGate();
        shell.querySelector('[data-cc-mode="'+state.densityMode+'"]').focus();
        announce(api, root, "预测已提交；连续介质质量与动量账本已揭示。");
      });
      var reset = element(doc, "button", { type: "button" }, [revealed ? "重新预测" : "重置"]);
      reset.addEventListener("click", resetToGate);
      actions.appendChild(reveal);
      actions.appendChild(reset);
      shell.appendChild(actions);
      shell.appendChild(element(doc, "p", { className: "cc-feedback " + (revealed ? (score === 3 ? "cc-pass" : "cc-warn") : ""), "aria-live": "polite", "data-cc-status": true }, [
        !complete() ? "请为三个判断各选一项。" : revealed ? "预测得分 " + score + "/3；下面显示场量和两个控制体积账。" : "三项预测已记录，点击提交后才显示结果。"
      ]));
      if (revealed) buildResults();
    }

    function buildResults() {
      var panel = element(doc, "section", { className: "cc-revealed" }, [
        element(doc, "h4", {}, ["结果与透明账本"]),
        element(doc, "p", { className: "cc-note" }, ["恒密度模式把 ρ 固定为 1；变密度模式仍固定质量流率，但让 Dρ/Dt 与准一维散度分别显示出来。"])
      ]);
      var presetGrid = element(doc, "div", { className: "cc-preset-grid" }, []);
      PRESETS.forEach(function (preset) {
        var button = element(doc, "button", { type: "button", "aria-pressed": state.densityMode === preset.densityMode ? "true" : "false", "data-cc-mode":preset.densityMode }, [preset.label]);
        button.addEventListener("click", function () { state.densityMode = preset.densityMode; renderGate();shell.querySelector('[data-cc-mode="'+state.densityMode+'"]').focus(); });
        presetGrid.appendChild(button);
      });
      panel.appendChild(presetGrid);
      var controls = element(doc, "div", { className: "cc-controls" }, []);
      var sampleId = uid + "-samples";
      var sampleOutput = element(doc, "output", { for: sampleId }, [String(state.samples)]);
      var sampleInput = element(doc, "input", { id: sampleId, type: "range", min: "9", max: "41", step: "2", value: String(state.samples), "aria-label": "空间采样点数" });
      sampleInput.addEventListener("input", function () { state.samples = Number(sampleInput.value); sampleOutput.textContent = String(state.samples); renderResults(); });
      controls.appendChild(element(doc, "div", { className: "cc-control" }, [element(doc, "label", { htmlFor: sampleId }, ["采样点 = ", sampleOutput]), sampleInput]));
      var x0Id = uid + "-x0";
      var x0Output = element(doc, "output", { for: x0Id }, [format(state.x0, 2)]);
      var x0Input = element(doc, "input", { id: x0Id, type: "range", min: "0.05", max: "0.8", step: "0.05", value: String(state.x0), "aria-label": "控制体积入口位置" });
      x0Input.addEventListener("input", function () { state.x0 = Number(x0Input.value); if (state.x1 <= state.x0) state.x1 = Number((state.x0 + 0.05).toFixed(2)); x0Output.textContent = format(state.x0, 2); renderResults(); });
      controls.appendChild(element(doc, "div", { className: "cc-control" }, [element(doc, "label", { htmlFor: x0Id }, ["入口 x₀ = ", x0Output]), x0Input]));
      var x1Id = uid + "-x1";
      var x1Output = element(doc, "output", { for: x1Id }, [format(state.x1, 2)]);
      var x1Input = element(doc, "input", { id: x1Id, type: "range", min: "0.2", max: "0.95", step: "0.05", value: String(state.x1), "aria-label": "控制体积出口位置" });
      x1Input.addEventListener("input", function () { state.x1 = Math.max(Number(x1Input.value), Number((state.x0 + 0.05).toFixed(2))); x1Output.textContent = format(state.x1, 2); renderResults(); });
      controls.appendChild(element(doc, "div", { className: "cc-control" }, [element(doc, "label", { htmlFor: x1Id }, ["出口 x₁ = ", x1Output]), x1Input]));
      panel.appendChild(controls);
      var stage = element(doc, "div", { className: "cc-stage" }, []);
      panel.appendChild(stage);
      shell.appendChild(panel);

      function renderResults() {
        var result = compute(state);
        x0Input.value=String(state.x0);x1Input.value=String(state.x1);x0Output.textContent=format(state.x0,2);x1Output.textContent=format(state.x1,2);
        clear(stage);
        stage.appendChild(element(doc, "div", { className: "cc-metrics" }, [
          metric(doc, "最大连续性残差", format(result.maxContinuityResidual, 6)),
          metric(doc, "质量流率范围", format(result.massFluxRange[0], 4) + "–" + format(result.massFluxRange[1], 4)),
          metric(doc, "喉部速度", format(result.throat.velocity, 4)),
          metric(doc, "Dρ/Dt（喉部）", format(result.throat.materialDensityRate, 4)),
          metric(doc, "动量净流出", format(result.ledger.momentumChange, 4)),
          metric(doc, "动量账残差", format(result.ledger.momentumResidual, 6))
        ]));
        var frame = element(doc, "div", { className: "cc-frame", tabindex:"0",role:"region","aria-label":"喷管场量与力图，可横向滚动" }, []);
        frame.appendChild(drawSvg(doc, result, uid));
        frame.appendChild(element(doc, "p", { className: "cc-note" }, [result.incompressibleModel ? "恒密度模式：Dρ/Dt=0 与准一维散度为零在本模型中同时出现。对称通量约 10⁻¹⁶ 的差为浮点舍入。" : "变密度模式：质量通量仍恒定，但 Dρ/Dt 与散度项相互抵消；这不是恒密度不可压模型。"]));
        stage.appendChild(frame);
        var stride = Math.max(1, Math.ceil(result.field.length / 10));
        var fieldRows = result.field.filter(function (row, index) { return index % stride === 0 || index === result.field.length - 1; }).map(function (row) {
          return [format(row.x, 2), format(row.area, 4), format(row.rho, 4), format(row.velocity, 4), format(row.massFlux, 4), format(row.materialDensityRate, 5), format(row.divergence, 5), format(row.continuityResidual, 6)];
        });
        stage.appendChild(element(doc, "div", { className: "cc-table-wrap", tabindex:"0",role:"region","aria-label":"守恒数据表，可横向滚动" }, [tableElement(doc, "场量与连续性账", ["x", "A", "ρ", "u", "ρAu", "Dρ/Dt", "准一维 div", "残差"], fieldRows)]));
        var ledger = result.ledger;
        var ledgerRows = [
          ["质量入口/出口", format(ledger.massIn, 5), format(ledger.massOut, 5), format(ledger.massResidual, 6), "稳态积累 = 0"],
          ["动量净流出", format(ledger.momentumIn, 5), format(ledger.momentumOut, 5), format(ledger.momentumChange, 5), "出口 − 入口"],
          ["外力账", format(ledger.pressureForce, 5), format(ledger.wallForce, 5), format(ledger.bodyForce, 5), "压力 + 壁面 + 体力"],
          ["动量平衡残差", "—", "—", format(ledger.momentumResidual, 6), "外力 − 动量净流出"]
        ];
        stage.appendChild(element(doc, "div", { className: "cc-table-wrap", tabindex:"0",role:"region","aria-label":"守恒数据表，可横向滚动" }, [tableElement(doc, "固定控制体积质量/动量账本", ["项目", "入口或压力", "出口或壁面", "数值", "含义"], ledgerRows)]));
        stage.appendChild(element(doc, "p", { className: "cc-interpretation", "aria-live": "polite" }, [
          result.incompressibleModel
            ? "当前恒密度只是一种更强的模型假设；连续性方程的本体仍是 Dρ/Dt + ρ div u = 0。控制体积动量账同时需要净通量，不能只看局部物质导数。"
            : "当前模式展示变密度的可压缩运动也满足质量守恒：质量守恒不要求 ρ 在所有位置相同。图表与解析导数的浮点残差是数值证据，连续介质定律还依赖光滑场、准一维和无激波等模型边界。"
        ]));
      }
      renderResults();
    }

    function resetToGate() {
      state = { densityMode: DEFAULT.densityMode, samples: DEFAULT.samples, x0: DEFAULT.x0, x1: DEFAULT.x1 };
      prediction = { speed: null, density: null, momentum: null };
      revealed = false;
      score = 0;
      renderGate();
      shell.querySelector("fieldset button").focus();
      announce(api, root, "连续介质实验已重置；请重新完成三个预测。");
    }

    renderGate();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    assert(area(0.5) < area(0.1), "throat has smaller area");
    assert(near(density("constant", 0.7), 1), "constant density");
    assert(near(density("variable", 0.7), 1.14), "variable density");
    assert(near(materialDerivativeDensity("constant", 0.5, 1), 0), "constant material density rate");
    assert(materialDerivativeDensity("variable", 0.5, 1) > 0, "variable material density rate");
    var constant = compute({ densityMode: "constant", samples: 21, x0: 0.2, x1: 0.8 });
    assert(constant.incompressibleModel, "constant model label");
    assert(constant.maxContinuityResidual < 1e-8, "constant continuity residual");
    assert(constant.throat.velocity > constant.field[0].velocity, "narrow nozzle accelerates flow");
    assert(constant.massFluxRange[1] - constant.massFluxRange[0] < 1e-12, "constant mass flux");
    assert(near(constant.ledger.massIn, constant.ledger.massOut), "constant mass ledger");
    assert(Math.abs(constant.ledger.momentumResidual) < 1e-10, "constant momentum ledger");
    var variable = compute({ densityMode: "variable", samples: 21, x0: 0.2, x1: 0.8 });
    assert(!variable.incompressibleModel, "variable model label");
    assert(variable.maxContinuityResidual < 1e-8, "variable continuity residual");
    assert(variable.throat.materialDensityRate > 0, "variable density material rate");
    assert(variable.throat.divergence < 0, "variable divergence compensates density increase at throat");
    assert(variable.massFluxRange[1] - variable.massFluxRange[0] < 1e-12, "variable mass flux");
    assert(Math.abs(variable.ledger.massResidual) < 1e-12, "variable mass ledger");
    assert(Math.abs(variable.ledger.momentumResidual) < 1e-10, "variable momentum ledger");
    assert(near(momentumFlux("constant", 0.4, 1), velocity("constant", 0.4, 1)), "momentum flux relation");
    var rejected=false;try{normalizeConfig({samples:999})}catch(e){rejected=true}assert(rejected,"sample domain enforced");
    assert(JSON.stringify(compute({ densityMode: "variable" })) === JSON.stringify(compute({ densityMode: "variable" })), "deterministic field");
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    DEFAULT: DEFAULT,
    PRESETS: PRESETS,
    normalizeConfig: normalizeConfig,
    area: area,
    areaDerivative: areaDerivative,
    density: density,
    densityDerivative: densityDerivative,
    velocity: velocity,
    velocityDerivative: velocityDerivative,
    materialDerivativeDensity: materialDerivativeDensity,
    quasiOneDDivergence: quasiOneDDivergence,
    continuityResidual: continuityResidual,
    momentumFlux: momentumFlux,
    controlVolumeLedger: controlVolumeLedger,
    sampleField: sampleField,
    compute: compute,
    drawSvg: drawSvg,
    pressure: pressure,
    format: format,
    mount: mount,
    selfTest: selfTest
  };
});

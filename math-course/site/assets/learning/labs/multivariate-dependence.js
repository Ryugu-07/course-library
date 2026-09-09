(function (root, factory) {
  "use strict";

  var exported = factory();
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("multivariate-dependence", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("multivariate-dependence self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("multivariate-dependence self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-multivariate-dependence-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;

  var PRESETS = [
    {
      id: "independent",
      label: "矩形 · 独立均匀",
      xDomain: [-1, 1],
      yDomain: [-1, 1],
      probe: 0.5,
      note: "矩形支持与因子化联合密度共同给出独立。"
    },
    {
      id: "parabola",
      label: "曲线 · 零协方差依赖",
      xDomain: [-1, 1],
      yDomain: [0, 1],
      probe: 0.5,
      note: "Y=X^2；协方差为零，但条件分布是点质量。"
    },
    {
      id: "triangle",
      label: "三角 · 支持约束",
      xDomain: [0, 1],
      probeDomain: [0.02, 0.98],
      yDomain: [0, 1],
      probe: 0.5,
      note: "f=8xy 只在 0<x<y<1 有效；非矩形支持制造依赖。"
    },
    {
      id: "normal",
      label: "椭圆 · 二维正态",
      xDomain: [-3, 3],
      yDomain: [-3, 3],
      probe: 0.8,
      rho: 0.65,
      note: "标准二维正态；条件均值 rho*x，条件方差 1-rho^2。"
    }
  ];

  var STYLE_TEXT = [
    ".md-lab{--md-blue:#315f9d;--md-gold:var(--cl-gold,#9b6a12);--md-green:var(--cl-green,#39734d);--md-red:var(--cl-red,#b64335);--md-muted:var(--fg-soft,#706b62);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;}",
    ".md-lab [hidden]{display:none!important;}",
    ".md-lab *,.md-lab *::before,.md-lab *::after{box-sizing:border-box;}",
    ".md-lab h3,.md-lab h4{margin:0;color:var(--fg);letter-spacing:0;}.md-lab h3{font-size:1.18rem;}.md-lab h4{font-size:1rem;}",
    ".md-lab button,.md-lab input,.md-lab select{font:inherit;}.md-lab button,.md-lab select{min-height:44px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);}.md-lab button{min-width:0;padding:8px 11px;cursor:pointer;line-height:1.35;overflow-wrap:anywhere;}.md-lab button:hover{border-color:var(--accent);}.md-lab button:disabled{cursor:not-allowed;opacity:.55;}.md-lab button[aria-pressed=true],.md-lab .md-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}",
    ".md-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}.md-lab button:focus-visible,.md-lab input:focus-visible,.md-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
    ".md-lab .md-intro,.md-lab .md-note,.md-lab .md-feedback,.md-lab .md-chart-note{color:var(--md-muted);font-size:13px;line-height:1.65;overflow-wrap:anywhere;}.md-lab .md-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--md-gold);background:var(--block-bg,var(--bg));}.md-lab fieldset{min-width:0;margin:0;padding:0;border:0;}.md-lab legend{max-width:100%;padding:0;font-weight:750;line-height:1.45;overflow-wrap:anywhere;}.md-lab .md-question-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}.md-lab .md-question{min-width:0;padding:9px;border:1px solid var(--border);border-radius:6px;background:var(--bg);}.md-lab .md-choice-list{display:grid;gap:6px;margin-top:8px;}.md-lab .md-choice-list button{width:100%;min-height:44px;text-align:left;font-size:12.5px;}.md-lab .md-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px;}.md-lab .md-actions>*{flex:1 1 160px;}.md-lab .md-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}.md-lab .md-pass{color:var(--md-green);}.md-lab .md-warn{color:var(--md-red);}",
    ".md-lab .md-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.md-lab .md-layout{display:grid;grid-template-columns:minmax(0,1fr);gap:15px;align-items:start;min-width:0;}.md-lab .md-controls,.md-lab .md-stage{min-width:0;}.md-lab .md-controls{display:grid;gap:11px;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}.md-lab .md-control{display:grid;gap:5px;min-width:0;}.md-lab .md-control label,.md-lab .md-control-title{color:var(--md-muted);font-size:13px;font-weight:700;}.md-lab .md-control output{color:var(--accent);font-variant-numeric:tabular-nums;}.md-lab .md-preset-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;}.md-lab .md-preset-grid button{font-size:12px;}.md-lab .md-scale{display:flex;justify-content:space-between;color:var(--md-muted);font-size:11px;}",
    ".md-lab .md-stage-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow:hidden;}.md-lab .md-stage-title{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin:0 0 8px;color:var(--md-muted);font-size:13px;}.md-lab .md-svg{display:block;width:100%;min-width:720px;max-width:none;height:auto;color:var(--fg);}.md-lab .md-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.md-lab .md-grid{stroke:currentColor;stroke-opacity:.14;stroke-width:1;}.md-lab .md-axis{stroke:currentColor;stroke-opacity:.62;stroke-width:1.2;}.md-lab .md-support{fill:var(--md-gold);fill-opacity:.2;stroke:var(--md-gold);stroke-width:1.4;}.md-lab .md-line{fill:none;stroke:var(--md-blue);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;}.md-lab .md-point{fill:var(--md-blue);fill-opacity:.58;stroke:var(--bg);stroke-width:1;}.md-lab .md-contour{fill:none;stroke:var(--md-blue);stroke-opacity:.7;stroke-width:1.5;}.md-lab .md-probe{stroke:var(--md-red);stroke-width:2;stroke-dasharray:6 4;}.md-lab .md-condition{stroke:var(--md-green);stroke-width:3;stroke-linecap:round;}.md-lab .md-marker{fill:var(--md-red);stroke:var(--bg);stroke-width:2;}.md-lab .md-label{font-size:13px;fill:var(--md-muted)!important;}.md-lab .md-title{font-size:13px;font-weight:750;}",
    ".md-lab .md-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 12px;}.md-lab .md-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.md-lab .md-metric:nth-child(4n+1){border-color:var(--md-blue);}.md-lab .md-metric:nth-child(4n+2){border-color:var(--md-gold);}.md-lab .md-metric:nth-child(4n+3){border-color:var(--md-green);}.md-lab .md-metric:nth-child(4n){border-color:var(--md-red);}.md-lab .md-metric span{display:block;color:var(--md-muted);font-size:11px;line-height:1.4;}.md-lab .md-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}.md-lab .md-table-wrap{max-width:100%;margin-top:12px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.md-lab table{display:table;width:100%;min-width:720px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.md-lab caption{padding:0 0 7px;text-align:left;color:var(--md-muted);font-size:12px;}.md-lab th,.md-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere;}.md-lab th{color:var(--md-muted);font-size:11.5px;font-weight:750;}.md-lab .md-interpretation{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--md-green);background:var(--bg);font-size:13px;line-height:1.7;overflow-wrap:anywhere;}.md-lab .md-caution{margin:10px 0 0;color:var(--md-muted);font-size:12px;line-height:1.65;}",
    ".md-lab .md-chart-scroll{overflow-x:auto;max-width:100%;}.md-lab .md-chart-scroll:focus-visible,.md-lab .md-table-wrap:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}[data-theme=dark] .md-lab{--md-blue:#89b8f5;--md-green:#92c7a0;--md-red:#ef998c;--md-gold:#d9bb73;}@media(max-width:900px){.md-lab .md-layout{grid-template-columns:minmax(0,1fr);}}@media(max-width:720px){.md-lab .md-question-grid{grid-template-columns:minmax(0,1fr);}.md-lab .md-preset-grid{grid-template-columns:minmax(0,1fr);}.md-lab .md-metrics{grid-template-columns:repeat(2,minmax(0,1fr));}}@media(max-width:430px){.md-lab .md-stage-frame{padding:5px;}.md-lab table{font-size:11.5px;}.md-lab th,.md-lab td{padding-left:5px;padding-right:5px;}}@media(prefers-reduced-motion:reduce){.md-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || EPS) * scale;
  }

  function format(value, digits) {
    if (!finite(value)) return "-";
    var places = digits === undefined ? 3 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
    var text = value.toFixed(places);
    return text.indexOf(".") === -1 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function integer(value, fallback, min, max) {
    var number = finite(Number(value)) ? Number(value) : fallback;
    return Math.round(clamp(number, min, max));
  }

  function presetById(id) {
    var model = PRESETS.filter(function (preset) { return preset.id === id; })[0];
    if (!model) throw new RangeError("未知联合模型");
    return model;
  }

  function normalizeRho(value) {
    if (value === undefined) return 0.65;
    if (!finite(value) || Math.abs(value) > 0.85) throw new RangeError("rho 必须在 [-0.85,0.85]");
    return value;
  }

  function inside(value, domain) {
    return value >= domain[0] && value <= domain[1];
  }

  function normalDensity(value) {
    return Math.exp(-0.5 * value * value) / Math.sqrt(2 * Math.PI);
  }

  function jointDensity(modelId, x, y, rho) {
    presetById(modelId);
    if (!finite(x) || !finite(y)) throw new RangeError("坐标必须有限");
    normalizeRho(rho);
    if (modelId === "independent") return inside(x, [-1, 1]) && inside(y, [-1, 1]) ? 0.25 : 0;
    if (modelId === "triangle") return x > 0 && x < 1 && y > x && y < 1 ? 8 * x * y : 0;
    if (modelId === "normal") {
      var correlation = normalizeRho(rho);
      var denominator = 2 * Math.PI * Math.sqrt(1 - correlation * correlation);
      var exponent = 0.5 * (x * x + Math.pow((y - correlation * x) / Math.sqrt(1 - correlation * correlation), 2));
      return Math.exp(-exponent) / denominator;
    }
    return null;
  }

  function marginalText(modelId) {
    if (modelId === "independent") return "X,Y 均为 U(-1,1)";
    if (modelId === "parabola") return "X~U(-1,1)；Y 的密度为 1/(2√y)";
    if (modelId === "triangle") return "f_X(x)=4x(1-x^2)；f_Y(y)=4y^3";
    return "X,Y~N(0,1)；边缘不随 rho 改变";
  }

  function supportText(modelId) {
    if (modelId === "independent") return "矩形 -1<x<1，-1<y<1";
    if (modelId === "parabola") return "曲线 y=x^2，二维面积为 0";
    if (modelId === "triangle") return "三角形 0<x<y<1";
    return "整个平面；等密度线为椭圆";
  }

  function covariance(modelId, rho) {
    presetById(modelId); normalizeRho(rho);
    if (modelId === "independent" || modelId === "parabola") return 0;
    if (modelId === "triangle") return 4 / 225;
    return normalizeRho(rho);
  }

  function variances(modelId, rho) {
    if (modelId === "independent") return { x: 1 / 3, y: 1 / 3 };
    if (modelId === "parabola") return { x: 1 / 3, y: 4 / 45 };
    if (modelId === "triangle") return { x: 11 / 225, y: 2 / 75 };
    return { x: 1, y: 1 };
  }

  function conditional(modelId, x, rho) {
    presetById(modelId); normalizeRho(rho);
    if (!finite(x) || (modelId === "triangle" ? !(x > 0 && x < 1) : modelId !== "normal" && !(x >= -1 && x <= 1))) throw new RangeError("条件探针不在允许域内");
    if (modelId === "independent") {
      return { mean: 0, variance: 1 / 3, support: [-1, 1], kind: "density", text: "Y|X=x 仍为 U(-1,1)" };
    }
    if (modelId === "parabola") {
      var square = x * x;
      return { mean: square, variance: 0, support: [square, square], kind: "point", text: "Y|X=x 集中在 y=x^2" };
    }
    if (modelId === "triangle") {
      var mean = 2 * (1 + x + x * x) / (3 * (1 + x));
      var variance = (1 - x) * (1 - x) * (x * x + 4 * x + 1) / (18 * (1 + x) * (1 + x));
      return { mean: mean, variance: variance, support: [x, 1], kind: "density", text: "f(y|x)=2y/(1-x^2)，支持从 x 到 1" };
    }
    var correlation = normalizeRho(rho);
    return { mean: correlation * x, variance: 1 - correlation * correlation, support: [-Infinity, Infinity], kind: "density", text: "Y|X=x 为 N(rho*x, 1-rho^2)" };
  }

  function isIndependent(modelId, rho) {
    presetById(modelId); normalizeRho(rho);
    return modelId === "independent" || (modelId === "normal" && normalizeRho(rho) === 0);
  }

  function evaluate(input) {
    if (input === undefined) input = {};
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("参数需为对象");
    var modelId = input.modelId === undefined ? "parabola" : input.modelId;
    var model = presetById(modelId);
    var domain = model.probeDomain || model.xDomain;
    var x = input.probe === undefined ? model.probe : input.probe;
    if (!finite(x) || !inside(x, domain)) throw new RangeError("探针超出实验范围");
    var rho = normalizeRho(input.rho);
    var condition = conditional(modelId, x, rho);
    var variance = variances(modelId, rho);
    var cov = covariance(modelId, rho);
    return {
      model: model,
      modelId: modelId,
      probe: x,
      rho: rho,
      condition: condition,
      covariance: cov,
      correlation: cov / Math.sqrt(variance.x * variance.y),
      independent: isIndependent(modelId, rho),
      support: supportText(modelId),
      marginal: marginalText(modelId),
      densityAtProbe: jointDensity(modelId, x, condition.mean, rho)
    };
  }

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "text") node.textContent = String(value);
      else if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function appendChildren(node, children) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
    });
    return node;
  }

  function element(doc, tag, attrs, children) {
    return appendChildren(setAttributes(doc.createElement(tag), attrs), children);
  }

  function svgElement(doc, tag, attrs, children) {
    return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs), children);
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function ensureStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement).appendChild(style);
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function metric(doc, label, value) {
    var node = element(doc, "div", { className: "md-metric" }, [
      element(doc, "span", { text: label }),
      element(doc, "strong", { text: value })
    ]);
    return { node: node, value: node.lastChild };
  }

  function chartScale(value, domain, start, length) {
    return start + (value - domain[0]) * length / (domain[1] - domain[0]);
  }

  function pathFromPoints(points) {
    return points.map(function (point, index) { return (index ? "L" : "M") + format(point[0], 2) + "," + format(point[1], 2); }).join(" ");
  }

  function marginalDensity(modelId, axis, value) {
    presetById(modelId);
    if ((axis !== 'x' && axis !== 'y') || !finite(value)) throw new RangeError('边缘坐标无效');
    if (modelId === 'normal') return normalDensity(value);
    if (modelId === 'independent' || (modelId === 'parabola' && axis === 'x')) return inside(value, [-1,1]) ? .5 : 0;
    if (modelId === 'parabola') return value > 0 && value <= 1 ? 1/(2*Math.sqrt(value)) : value === 0 ? Infinity : 0;
    if (!inside(value,[0,1])) return 0;
    return axis === 'x' ? 4*value*(1-value)*(1+value) : 4*value*value*value;
  }
  function conditionalDensity(modelId, x, y, rho) {
    var c = conditional(modelId,x,rho);
    if (!finite(y)) throw new RangeError('y 必须有限');
    if (modelId === 'parabola') return null;
    if (modelId === 'normal') return normalDensity((y-c.mean)/Math.sqrt(c.variance))/Math.sqrt(c.variance);
    if (modelId === 'independent') return inside(y,[-1,1]) ? .5 : 0;
    return y > x && y < 1 ? 2*y/((1-x)*(1+x)) : 0;
  }
  function drawSvg(doc, data, uid) {
    var domain = data.modelId === 'normal' ? [-3.5,3.5] : data.modelId === 'triangle' ? [-.1,1.1] : [-1.1,1.1];
    var yd = data.modelId === 'parabola' ? [-.6,1.6] : domain;
    var left=65, top=58, size=340;
    function px(x){return chartScale(x,domain,left,size);}
    function py(y){return top+size-(y-yd[0])*size/(yd[1]-yd[0]);}
    var svg=svgElement(doc,'svg',{className:'md-svg',viewBox:'0 0 760 460',role:'img','aria-labelledby':uid+'-joint-title'});
    function add(tag,attr,txt){var n=svgElement(doc,tag,attr,txt===undefined?[]:[txt]);svg.appendChild(n);return n;}
    add('title',{id:uid+'-joint-title'},'联合支持与条件探针；两坐标使用相同单位长度');
    add('text',{x:65,y:26,class:'md-title'},data.model.label+' · X、Y 等比例');
    var ticks=data.modelId==='normal'?[-3,-2,-1,0,1,2,3]:data.modelId==='triangle'?[0,.25,.5,.75,1]:[-1,-.5,0,.5,1];
    ticks.forEach(function(v){add('line',{class:'md-grid',x1:px(v),x2:px(v),y1:top,y2:top+size});add('text',{class:'md-label',x:px(v),y:top+size+22,'text-anchor':'middle'},format(v,2));});
    (data.modelId==='parabola'?[-.5,0,.5,1,1.5]:ticks).forEach(function(v){add('line',{class:'md-grid',x1:left,x2:left+size,y1:py(v),y2:py(v)});add('text',{class:'md-label',x:left-10,y:py(v)+4,'text-anchor':'end'},format(v,2));});
    add('rect',{x:left,y:top,width:size,height:size,fill:'none',class:'md-axis'});
    add('text',{class:'md-label',x:left+size/2,y:445,'text-anchor':'middle'},'X');
    add('text',{class:'md-label',x:18,y:top+size/2},'Y');
    if(data.modelId==='independent') add('rect',{class:'md-support',x:px(-1),y:py(1),width:px(1)-px(-1),height:py(-1)-py(1)});
    else if(data.modelId==='triangle') add('path',{class:'md-support',d:pathFromPoints([[px(0),py(0)],[px(0),py(1)],[px(1),py(1)]])+' Z'});
    else if(data.modelId==='parabola'){
      var pts=[];for(var j=0;j<=160;j++){var x=-1+j/80;pts.push([px(x),py(x*x)]);}add('path',{class:'md-line',d:pathFromPoints(pts)});
    } else {
      [1,2,3].forEach(function(q,k){var pts=[];for(var i=0;i<=160;i++){var t=2*Math.PI*i/160;var u=Math.sqrt(q)*Math.cos(t),v=Math.sqrt(q)*Math.sin(t);pts.push([px(u),py(data.rho*u+Math.sqrt(1-data.rho*data.rho)*v)]);}add('path',{class:'md-contour',d:pathFromPoints(pts)+' Z','data-q':q});add('text',{class:'md-label',x:435,y:160+24*k},'q='+q+'，密度 '+format(Math.exp(-q/2)/(2*Math.PI*Math.sqrt(1-data.rho*data.rho)),4));});
    }
    var c=data.condition;
    add('line',{class:'md-probe',x1:px(data.probe),x2:px(data.probe),y1:top,y2:top+size});
    if(c.variance>0)add('line',{class:'md-condition',x1:px(data.probe),x2:px(data.probe),y1:py(c.mean-Math.sqrt(c.variance)),y2:py(c.mean+Math.sqrt(c.variance))});
    add('circle',{class:'md-marker',cx:px(data.probe),cy:py(c.mean),r:5});
    ['探针 x = '+format(data.probe,2),'条件均值 = '+format(c.mean,4),'绿色段：均值 ± 标准差'].forEach(function(t,i){add('text',{class:'md-label',x:435,y:65+25*i},t);});
    var notes=data.modelId==='normal'?['q=(x²−2ρxy+y²)/(1−ρ²)','蓝线为等密度线，不是散点','正态支持为整个平面']:data.modelId==='parabola'?['所有概率集中在蓝色曲线','曲线面积为零，仍有总概率 1','红点是条件点质量']:['金色只标出允许区域','填色深浅不表示概率密度','这里没有随机抽样'];
    notes.forEach(function(t,i){add('text',{class:'md-label',x:435,y:255+26*i},t);});
    return svg;
  }
  function drawCondition(doc,data,uid){
    var point=data.modelId==='parabola', domain=data.modelId==='normal'?[-4,4]:data.modelId==='independent'?[-1.25,1.25]:[-.05,1.05];
    var left=65,top=68,w=640,h=185;
    var max=point?1.1:data.modelId==='normal'?normalDensity(0)/Math.sqrt(data.condition.variance)*1.12:data.modelId==='triangle'?Math.max(4,2/((1-data.probe)*(1+data.probe)))*1.12:.6;
    function px(y){return chartScale(y,domain,left,w);}function py(f){return top+h-f/max*h;}
    var svg=svgElement(doc,'svg',{className:'md-svg',viewBox:'0 0 760 330',role:'img','aria-labelledby':uid+'-conditional-title'});
    function add(tag,a,t){var n=svgElement(doc,tag,a,t===undefined?[]:[t]);svg.appendChild(n);return n;}
    add('title',{id:uid+'-conditional-title'},point?'Y 的边缘累积分布与条件点质量':'Y 的边缘密度与条件密度');
    add('text',{class:'md-title',x:65,y:25},point?'边缘 CDF 与条件 CDF（跳跃大小为 1）':'边缘密度与条件密度（全支持上的积分各为 1）');
    add('text',{class:'md-label',x:65,y:48},'蓝线：未知 X 时的 Y；绿线：已知 X='+format(data.probe,2)+' 时的 Y');
    for(var k=0;k<=4;k++){var y=domain[0]+(domain[1]-domain[0])*k/4;add('line',{class:'md-grid',x1:px(y),x2:px(y),y1:top,y2:top+h});add('text',{class:'md-label',x:px(y),y:top+h+20,'text-anchor':'middle'},format(y,2));var v=max*k/4;add('line',{class:'md-grid',x1:left,x2:left+w,y1:py(v),y2:py(v)});add('text',{class:'md-label',x:55,y:py(v)+4,'text-anchor':'end'},format(v,2));}
    add('text',{class:'md-label',x:380,y:300},'Y');
    add('text',{class:'md-label',x:65,y:321},point?'条件 CDF 在 y=x² 处跳到 1；竖虚线标出跳跃，不是连续上升。':'高度是密度；一个点的概率仍为零。绿色均值与方差由整条分布计算。');
    function curve(fn,a,b,cls){var pts=[];for(var i=0;i<=240;i++){var y=a+(b-a)*i/240;pts.push([px(y),py(fn(y))]);}add('path',{class:cls,d:pathFromPoints(pts),style:cls==='md-condition'?'fill:none;stroke-width:2.5;stroke-dasharray:7 5':null});}
    if(point){curve(function(y){return y<=0?0:y>=1?1:Math.sqrt(y);},domain[0],domain[1],'md-line');var v=data.condition.mean;add('path',{class:'md-condition',style:'fill:none',d:pathFromPoints([[px(domain[0]),py(0)],[px(v),py(0)]])});add('path',{class:'md-condition',style:'fill:none',d:pathFromPoints([[px(v),py(1)],[px(domain[1]),py(1)]])});add('line',{class:'md-condition',style:'stroke-dasharray:4 4',x1:px(v),x2:px(v),y1:py(0),y2:py(1)});add('circle',{cx:px(v),cy:py(0),r:4,fill:'var(--bg)',stroke:'var(--md-green)'});add('circle',{cx:px(v),cy:py(1),r:4,fill:'var(--md-green)'});}
    else if(data.modelId==='normal'){curve(function(y){return normalDensity(y);},domain[0],domain[1],'md-line');curve(function(y){return conditionalDensity('normal',data.probe,y,data.rho);},domain[0],domain[1],'md-condition');}
    else if(data.modelId==='independent'){curve(function(){return .5;},-1,1,'md-line');var n=add('path',{class:'md-condition',style:'fill:none;stroke-dasharray:7 5',d:pathFromPoints([[px(-1),py(.5)],[px(1),py(.5)]])});}
    else {add('path',{d:pathFromPoints([[px(data.probe),py(0)],[px(data.probe),py(2*data.probe/((1-data.probe)*(1+data.probe)))],[px(1),py(2/((1-data.probe)*(1+data.probe)))],[px(1),py(0)]])+' Z',fill:'var(--md-green)','fill-opacity':'0.12'});curve(function(y){return 4*y*y*y;},0,1,'md-line');curve(function(y){return 2*y/((1-data.probe)*(1+data.probe));},data.probe,1,'md-condition');}
    return svg;
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    ensureStyles(doc);
    var uid = "md-" + (++INSTANCE);
    var state = {
      modelId: "parabola",
      probe: 0.5,
      rho: 0.65,
      predictions: { support: null, covariance: null, normal: null, copula: null },
      revealed: false,
      score: 0
    };
    var shell = element(doc, "div", { className: "md-lab" });
    var form = element(doc, "form", { className: "md-prediction" });
    var revealed = element(doc, "section", { className: "md-revealed", hidden: true, tabindex: "-1", "aria-label": "多维分布实验结果" });
    var feedback = element(doc, "p", { className: "md-feedback", role: "status", "aria-live": "polite", text: "请先完成四项预测。" });
    var questions = [
      { key: "support", prompt: "1 · 仅区域内的公式可分，还需检查什么？", expected: "support", choices: [["support", "联合支持也要与边缘相容"], ["factor", "区域内公式可分就足够"], ["marginal", "只需检查两个均值"]] },
      { key: "covariance", prompt: "2 · Y=X^2 且 Cov=0 说明什么？", expected: "dependent", choices: [["dependent", "仍可能强依赖，不等于独立"], ["independent", "因此一定独立"], ["unknown", "说明 Y 没有分布"]] },
      { key: "normal", prompt: "3 · 二维正态中 rho=0？", expected: "normal", choices: [["normal", "此特殊族中等价于独立"], ["general", "任意分布都如此"], ["conditional", "只说明条件方差为 0"]] },
      { key: "copula", prompt: "4 · 两个边缘之外还缺什么？", expected: "copula", choices: [["copula", "依赖结构，可由 copula 编码"], ["mean", "只缺一个共同均值"], ["sample", "缺的是一次观测"]] }
    ];
    var choiceButtons = [];

    shell.appendChild(element(doc, "h3", { text: "联合、边缘、条件：同一个点的四种读法" }));
    shell.appendChild(element(doc, "p", { className: "md-intro", text: "提交前结果图与审计表保持隐藏。提交后，切换模型、探针 x 和二维正态的 rho，观察同一份联合结构如何改写条件预测。" }));
    var prompt = element(doc, "p", { className: "md-prompt", text: "预测门：先判断支持、协方差、二维正态和 copula，再打开解析账本。" });
    form.appendChild(prompt);
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "四项都回答后才揭示结果" }));
    var questionGrid = element(doc, "div", { className: "md-question-grid" });
    questions.forEach(function (question) {
      var questionSet = element(doc, "fieldset", { className: "md-question" });
      questionSet.appendChild(element(doc, "legend", { text: question.prompt }));
      var choices = element(doc, "div", { className: "md-choice-list", role: "group", "aria-label": question.prompt });
      question.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false" }, [choice[1]]);
        button.addEventListener("click", function () {
          state.predictions[question.key] = choice[0];
          state.revealed = false; revealed.hidden = true;
          choiceButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", state.predictions[item.key] === item.value ? "true" : "false"); });
          feedback.textContent = "已记录当前选择；四项完成后提交。";
          feedback.className = "md-feedback";
        });
        choiceButtons.push({ key: question.key, value: choice[0], node: button });
        choices.appendChild(button);
      });
      questionSet.appendChild(choices);
      questionGrid.appendChild(questionSet);
    });
    fieldset.appendChild(questionGrid);
    form.appendChild(fieldset);
    var actions = element(doc, "div", { className: "md-actions" });
    var submit = element(doc, "button", { type: "submit", className: "md-primary", text: "提交预测并揭示" });
    var clearPredictions = element(doc, "button", { type: "button", text: "清空预测" });
    actions.appendChild(submit);
    actions.appendChild(clearPredictions);
    form.appendChild(actions);
    form.appendChild(feedback);
    shell.appendChild(form);

    var layout = element(doc, "div", { className: "md-layout" });
    var controls = element(doc, "div", { className: "md-controls" });
    var stage = element(doc, "div", { className: "md-stage" });
    layout.appendChild(controls);
    layout.appendChild(stage);
    revealed.appendChild(layout);
    shell.appendChild(revealed);
    clear(root);
    root.appendChild(shell);

    var presetGrid = element(doc, "div", { className: "md-preset-grid", role: "group", "aria-label": "联合模型预设" });
    var presetButtons = [];
    PRESETS.forEach(function (preset) {
      var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: preset.label });
      button.addEventListener("click", function () {
        state.modelId = preset.id;
        state.probe = preset.probe;
        if (preset.rho !== undefined) state.rho = preset.rho;
        render();
      });
      presetButtons.push({ id: preset.id, node: button });
      presetGrid.appendChild(button);
    });
    controls.appendChild(element(doc, "h4", { text: "揭示后的操作参数" }));
    controls.appendChild(presetGrid);
    controls.appendChild(element(doc, "p", { className: "md-note", text: "图中金色填充仅表示支持；蓝线为确定关系或等密度线，红线固定 x。下图对比边缘密度与归一化后的条件密度。" }));

    var probeId = uid + "-probe";
    var probeOutput = element(doc, "output", { for: probeId, text: "" });
    var probeInput = element(doc, "input", { id: probeId, type: "range", min: "-1", max: "1", step: "0.01", "aria-label": "条件探针 x" });
    controls.appendChild(element(doc, "div", { className: "md-control" }, [element(doc, "label", { htmlFor: probeId }, ["条件探针 x：", probeOutput]), probeInput, element(doc, "div", { className: "md-scale" }, [element(doc, "span", { text: "最小值" }), element(doc, "span", { text: "最大值" })])]));

    var rhoId = uid + "-rho";
    var rhoOutput = element(doc, "output", { for: rhoId, text: "" });
    var rhoInput = element(doc, "input", { id: rhoId, type: "range", min: "-85", max: "85", step: "5", "aria-label": "二维正态相关系数 rho" });
    var rhoControl = element(doc, "div", { className: "md-control", hidden: true }, [element(doc, "label", { htmlFor: rhoId }, ["二维正态 rho：", rhoOutput]), rhoInput, element(doc, "div", { className: "md-scale" }, [element(doc, "span", { text: "-0.85" }), element(doc, "span", { text: "0.85" })])]);
    controls.appendChild(rhoControl);
    var relock = element(doc, "button", { type: "button", text: "重新预测" });
    controls.appendChild(relock);

    function ratioFor(value, domain) { return 100 * (value - domain[0]) / (domain[1] - domain[0]); }
    function valueFor(ratio, domain) { return domain[0] + (domain[1] - domain[0]) * Number(ratio) / 100; }
    function syncControls(data) {
      var domain = data.model.probeDomain || data.model.xDomain;
      probeInput.min = String(domain[0]); probeInput.max = String(domain[1]);
      probeInput.value = String(data.probe);
      probeOutput.textContent = format(data.probe, 2);
      rhoInput.value = String(Math.round(data.rho * 100));
      rhoOutput.textContent = format(data.rho, 2);
      rhoControl.hidden = data.modelId !== "normal";
      presetButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", item.id === data.modelId ? "true" : "false"); });
    }

    function renderTable(data) {
      var table = element(doc, "table");
      table.appendChild(element(doc, "caption", { text: "联合分布逐项审计账本" }));
      table.appendChild(element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { scope: "col", text: "账本" }), element(doc, "th", { scope: "col", text: "当前读数" }), element(doc, "th", { scope: "col", text: "解释与边界" })])]));
      var condition = data.condition;
      var rows = [
        ["联合 / 支持", data.modelId === "normal" ? "二维正态密度；rho=" + format(data.rho, 2) : data.modelId === "parabola" ? "Y=X^2 的曲线支持" : data.modelId === "triangle" ? "f=8xy 于 0<x<y<1" : "f=1/4 于矩形支持", data.support],
        ["边缘", data.marginal, "边缘相同不能决定联合；copula 仍可能不同。"],
        ["条件 Y|X=x", condition.text, "当前 x=" + format(data.probe, 2) + "；E[Y|X=x]=" + format(condition.mean, 4) + "，Var=" + format(condition.variance, 4)],
        ["协方差 / 相关", format(data.covariance, 5) + " / " + format(data.correlation, 5), "协方差只读线性联动；零值不能消除非线性依赖。"],
        ["独立性", data.independent ? "是" : "否", data.modelId === "normal" ? "二维正态仅在 rho=0 时成立。" : data.modelId === "independent" ? "矩形支持与因子化共同成立。" : "支持或确定性关系阻止独立。"]
      ];
      var body = element(doc, "tbody");
      rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, row.map(function (value) { return element(doc, "td", { text: value }); }))); });
      table.appendChild(body);
      return element(doc, "div", { className: "md-table-wrap", tabindex: "0", role: "region", "aria-label": "可横向滚动的分布读数表" }, [table]);
    }

    function render() {
      var data = evaluate({ modelId: state.modelId, probe: state.probe, rho: state.rho });
      state.probe = data.probe;
      state.rho = data.rho;
      syncControls(data);
      clear(stage);
      var cards = [metric(doc, "E[Y|X=x]", format(data.condition.mean, 4)), metric(doc, "Var[Y|X=x]", format(data.condition.variance, 4)), metric(doc, "Cov(X,Y)", format(data.covariance, 5)), metric(doc, "独立？", data.independent ? "是" : "否")];
      stage.appendChild(element(doc, "div", { className: "md-metrics", "aria-label": "条件与依赖读数" }, cards.map(function (card) { return card.node; })));
      var frame = element(doc, "div", { className: "md-stage-frame" }, [element(doc, "div", { className: "md-stage-title" }, [element(doc, "strong", { text: data.model.label }), element(doc, "span", { text: "条件探针 x=" + format(data.probe, 2) })])]);
      frame.appendChild(element(doc, "div", {className:"md-chart-scroll", tabindex:"0", role:"region", "aria-label":"可横向滚动的联合分布图"}, [drawSvg(doc, data, uid)]));
      frame.appendChild(element(doc, "div", {className:"md-chart-scroll", tabindex:"0", role:"region", "aria-label":"可横向滚动的条件密度图"}, [drawCondition(doc, data, uid)]));
      frame.appendChild(element(doc, "p", { className: "md-chart-note", text: data.model.note + " 上图绿色段是条件均值±一个标准差，不是支持区间或通用68%概率区间。下图概率来自曲线下的面积；抛物线条件是点质量，不画成有限高密度。正态图只显示有限视窗。" }));
      stage.appendChild(frame);
      stage.appendChild(renderTable(data));
      var interpretation = data.modelId === "independent"
        ? "当前模型的条件分布不随 x 改变；这是独立性的操作性表现。"
        : data.modelId === "parabola"
          ? "当前模型把一个二维随机点压在曲线上；零协方差只是对称抵消，条件读数却完全确定。"
          : data.modelId === "triangle"
            ? "当前模型的非矩形支持让 y 的下界随 x 移动；即使密度写成乘积，也不能忽略支持条件。"
            : "当前模型的边缘始终是标准正态；只有 rho=0 时联合密度才分解为两个边缘密度的乘积。";
      stage.appendChild(element(doc, "p", { className: "md-interpretation", role: "status", "aria-live": "polite", text: interpretation }));
      stage.appendChild(element(doc, "p", { className: "md-caution", text: "这是固定解析模型的结构审计，不是从有限散点反推独立性的统计检验。" }));
    }

    probeInput.addEventListener("input", function () {
      var model = presetById(state.modelId);
      state.probe = Number(probeInput.value);
      render();
    });
    rhoInput.addEventListener("input", function () {
      state.rho = normalizeRho(Number(rhoInput.value) / 100);
      render();
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var missing = questions.filter(function (question) { return !state.predictions[question.key]; });
      if (missing.length) {
        feedback.className = "md-feedback md-warn";
        feedback.textContent = "还差 " + missing.length + " 项预测。";
        return;
      }
      var answers = { support: "support", covariance: "dependent", normal: "normal", copula: "copula" };
      state.score = questions.reduce(function (total, question) { return total + (state.predictions[question.key] === answers[question.key] ? 1 : 0); }, 0);
      state.revealed = true;
      revealed.removeAttribute("hidden");
      feedback.className = "md-feedback " + (state.score === questions.length ? "md-pass" : "md-warn");
      feedback.textContent = "已揭示：" + state.score + "/" + questions.length + " 项预测与解析账本一致。";
      render();
      revealed.focus();
      announce(api, root, feedback.textContent);
    });
    function clearPredictionChoices() {
      state.predictions = { support: null, covariance: null, normal: null, copula: null };
      choiceButtons.forEach(function (item) { item.node.setAttribute("aria-pressed", "false"); });
    }
    clearPredictions.addEventListener("click", function () {
      clearPredictionChoices();
      state.revealed = false; revealed.hidden = true;
      choiceButtons[0].node.focus();
      feedback.className = "md-feedback";
      feedback.textContent = "预测已清空。";
    });
    function reset() {
      state.modelId = "parabola";
      state.probe = 0.5;
      state.rho = 0.65;
      state.revealed = false;
      state.score = 0;
      clearPredictionChoices();
      revealed.setAttribute("hidden", "hidden");
      feedback.className = "md-feedback";
      feedback.textContent = "已重新上锁，请再完成四项预测。";
      choiceButtons[0].node.focus();
      announce(api, root, "多维分布实验已重置。");
    }
    relock.addEventListener("click", reset);
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    check(PRESETS.length === 4, "four presets");
    check(near(jointDensity("independent", 0, 0, 0.2), 0.25), "independent joint density");
    check(jointDensity("independent", 2, 0, 0) === 0, "independent support");
    check(near(covariance("independent", 0), 0) && isIndependent("independent", 0), "independent covariance");
    var parabola = evaluate({ modelId: "parabola", probe: 0.5 });
    check(near(parabola.covariance, 0), "parabola zero covariance");
    check(!parabola.independent && near(parabola.condition.mean, 0.25), "parabola dependence and condition");
    check(near(parabola.condition.variance, 0), "parabola conditional variance");
    check(jointDensity("triangle", 0.4, 0.7, 0) > 0 && jointDensity("triangle", 0.7, 0.4, 0) === 0, "triangle support");
    var triangle = evaluate({ modelId: "triangle", probe: 0.5 });
    check(near(triangle.condition.mean, 0.7777777777777778), "triangle conditional mean");
    check(near(covariance("triangle", 0), 4 / 225), "triangle covariance");
    check(marginalText("triangle").indexOf("4y^3") !== -1, "triangle marginal density");
    check(near(variances("triangle", 0).x, 11 / 225) && near(variances("triangle", 0).y, 2 / 75), "triangle variances");
    check(conditional("triangle", 1-1e-12).variance > 0, "triangle near-end variance stable");
    check(near(jointDensity("normal", 0, 0, 0), 1 / (2 * Math.PI)), "normal density");
    var normalIndependent = evaluate({ modelId: "normal", probe: 0.8, rho: 0 });
    var normalDependent = evaluate({ modelId: "normal", probe: 0.8, rho: 0.7 });
    check(normalIndependent.independent && near(normalIndependent.condition.mean, 0), "normal rho zero independence");
    check(!normalDependent.independent && near(normalDependent.condition.mean, 0.56), "normal rho condition");
    check(near(normalDependent.condition.variance, 0.51), "normal conditional variance");
    check(near(normalDependent.correlation, 0.7), "normal correlation");
    check(!evaluate({modelId:"normal",rho:1e-12}).independent, "nonzero correlation never means independence");
    PRESETS.forEach(function (preset) {
      var result = evaluate({ modelId: preset.id, probe: preset.probe, rho: preset.rho });
      check(result.model.id === preset.id && finite(result.condition.mean), preset.id + " evaluates");
      check(result.support.length > 0 && result.marginal.length > 0, preset.id + " text ledger");
    });
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    PRESETS: PRESETS,
    jointDensity: jointDensity,
    conditional: conditional,
    covariance: covariance,
    marginalDensity: marginalDensity,
    conditionalDensity: conditionalDensity,
    drawSvg: drawSvg,
    drawCondition: drawCondition,
    evaluate: evaluate,
    mount: mount,
    selfTest: selfTest
  };
});

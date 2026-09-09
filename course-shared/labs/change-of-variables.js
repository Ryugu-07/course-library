(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("change-of-variables", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("change-of-variables self-test: PASS (" + report.checks + " checks)\n");
    } catch (error) {
      process.stderr.write("change-of-variables self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var PI = Math.PI;
  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-change-of-variables-styles";
  var INSTANCE = 0;
  var EPS = 1e-10;
  var DEFAULT = { presetId: "polar-disk", radius: 1 };
  var PRESETS = [
    { id: "identity", label: "恒等：一一对应", mode: "identity", radius: 1 },
    { id: "reflection", label: "反射：J<0", mode: "reflection", radius: 1 },
    { id: "polar-disk", label: "极坐标：一圈", mode: "polar", turns: 1, radius: 1 },
    { id: "polar-double", label: "极坐标：两圈", mode: "polar", turns: 2, radius: 1 }
  ];

  var STYLE_TEXT = [
    ".cov-lab{--cov-blue:var(--cl-blue,#315f9d);--cov-gold:var(--cl-gold,#9b6a12);--cov-green:var(--cl-green,#39734d);--cov-red:var(--cl-red,#b64335);--cov-soft:var(--fg-soft,#6f6a60);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
    ".cov-lab *,.cov-lab *::before,.cov-lab *::after{box-sizing:border-box;}.cov-lab [hidden]{display:none!important;}.cov-lab h3,.cov-lab h4{margin:0;color:var(--fg);letter-spacing:0;}.cov-lab h3{font-size:1.18rem;}.cov-lab h4{font-size:1rem;}",
    ".cov-lab .cov-note,.cov-lab .cov-feedback{color:var(--cov-soft);font-size:13px;line-height:1.7;}.cov-lab .cov-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--cov-gold);background:var(--bg);}.cov-lab fieldset{min-width:0;margin:0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);}.cov-lab legend{max-width:100%;padding:0 4px;color:var(--cov-soft);font-size:13px;line-height:1.5;}.cov-lab .cov-question-list{display:grid;gap:10px;}.cov-lab .cov-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}",
    ".cov-lab button,.cov-lab input{font:inherit;}.cov-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}.cov-lab button:hover{border-color:var(--accent);}.cov-lab button[aria-pressed=\"true\"],.cov-lab button.cov-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}.cov-lab button:disabled{cursor:not-allowed;opacity:.55;}.cov-lab button:focus-visible,.cov-lab input:focus-visible,.cov-lab [tabindex]:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}.cov-lab .cov-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}.cov-lab .cov-actions>*{flex:1 1 170px;}.cov-lab .cov-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}.cov-lab .cov-pass{color:var(--cov-green);}.cov-lab .cov-warn{color:var(--cov-red);}",
    ".cov-lab .cov-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.cov-lab .cov-preset-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:10px 0 12px;}.cov-lab .cov-preset-grid button{font-size:12px;}.cov-lab .cov-controls{display:grid;grid-template-columns:minmax(0,1fr) minmax(210px,1.35fr);gap:12px;align-items:end;}.cov-lab .cov-control{display:grid;gap:5px;min-width:0;}.cov-lab .cov-control label{color:var(--cov-soft);font-size:13px;font-weight:700;}.cov-lab .cov-control output{color:var(--accent);font-variant-numeric:tabular-nums;}.cov-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}",
    ".cov-lab .cov-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:13px 0;}.cov-lab .cov-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.cov-lab .cov-metric:nth-child(5n+1){border-top-color:var(--cov-blue);}.cov-lab .cov-metric:nth-child(5n+2){border-top-color:var(--cov-gold);}.cov-lab .cov-metric:nth-child(5n+3){border-top-color:var(--cov-green);}.cov-lab .cov-metric:nth-child(5n+4){border-top-color:var(--cov-red);}.cov-lab .cov-metric:nth-child(5n){border-top-color:var(--accent);}.cov-lab .cov-metric span{display:block;color:var(--cov-soft);font-size:11.5px;line-height:1.4;}.cov-lab .cov-metric strong{display:block;margin-top:3px;font-size:14px;line-height:1.45;overflow-wrap:anywhere;font-variant-numeric:tabular-nums;}",
    ".cov-lab .cov-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch;}.cov-lab .cov-svg{display:block;width:100%;min-width:700px;height:auto;color:var(--fg);}.cov-lab .cov-svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.cov-lab .cov-grid{stroke:var(--border);stroke-width:1;stroke-opacity:.65;}.cov-lab .cov-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.72;}.cov-lab .cov-domain{fill:var(--cov-blue);fill-opacity:.13;stroke:var(--cov-blue);stroke-width:2;}.cov-lab .cov-image{fill:var(--cov-green);fill-opacity:.16;stroke:var(--cov-green);stroke-width:2;}.cov-lab .cov-ray{stroke:var(--cov-gold);stroke-width:1.4;stroke-opacity:.75;}.cov-lab .cov-reflect{fill:var(--cov-red);fill-opacity:.14;stroke:var(--cov-red);stroke-width:2;}.cov-lab .cov-title{font-size:13px;font-weight:750;}.cov-lab .cov-label{font-size:11px;}",
    ".cov-lab .cov-table-wrap{max-width:100%;margin-top:13px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.cov-lab table{width:100%;min-width:700px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.cov-lab caption{padding:0 0 7px;text-align:left;color:var(--cov-soft);font-size:12px;}.cov-lab th,.cov-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;}.cov-lab th{color:var(--cov-soft);font-size:11.5px;font-weight:750;}.cov-lab .cov-interpretation{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--cov-green);background:var(--bg);font-size:13px;line-height:1.7;}",
    "@media(max-width:900px){.cov-lab .cov-preset-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.cov-lab .cov-controls{grid-template-columns:minmax(0,1fr);}.cov-lab .cov-metrics{grid-template-columns:repeat(3,minmax(0,1fr));}}@media(max-width:640px){.cov-lab .cov-choice-grid,.cov-lab .cov-preset-grid,.cov-lab .cov-metrics{grid-template-columns:minmax(0,1fr);}.cov-lab .cov-frame{padding:5px;}}@media(prefers-reduced-motion:reduce){.cov-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
    , '[data-theme="dark"] .cov-lab{--cov-blue:#90baff;--cov-green:#91dba4;--cov-gold:#efc976;--cov-red:#ffab9c;--cov-soft:#c4c0b8;}'
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function near(left, right, tolerance) {
    var scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= (tolerance || EPS) * scale;
  }

  function findPreset(id) {
    var preset = PRESETS.filter(function (p) { return p.id === id; })[0];
    if (!preset) throw new RangeError("Unknown mapping");
    return preset;
  }
  function normalizeConfig(input) {
    var source = input === undefined ? {} : input;
    if (!source || typeof source !== "object" || Array.isArray(source)) throw new TypeError("Expected configuration");
    var preset = findPreset(source.presetId === undefined ? DEFAULT.presetId : source.presetId);
    var radius = source.radius === undefined ? DEFAULT.radius : source.radius;
    if (!finite(radius) || radius < .25 || radius > 2.5) throw new RangeError("Radius must be finite in [0.25,2.5]");
    return { presetId: preset.id, mode: preset.mode, turns: preset.turns || 1, radius: radius };
  }
  function checkMode(mode) {
    if (["polar", "identity", "reflection"].indexOf(mode) < 0) throw new RangeError("Unknown mode");
  }
  function mapPoint(mode, first, second) {
    checkMode(mode);
    if (!finite(first) || !finite(second)) throw new TypeError("Finite coordinates required");
    if (mode === "polar") return [first * Math.cos(second), first * Math.sin(second)];
    return [mode === "reflection" ? -first : first, second];
  }
  function jacobian(mode, first) {
    checkMode(mode);
    if (!finite(first)) throw new TypeError("Finite coordinate required");
    return mode === "polar" ? first : mode === "reflection" ? -1 : 1;
  }
  function coverageMultiplicity(config) { return normalizeConfig(config).turns; }
  function polarDiskArea(radius) {
    if (!finite(radius) || radius < 0 || !finite(PI * radius * radius)) throw new RangeError("Finite nonnegative area required");
    return PI * radius * radius;
  }

  function compute(input) {
    var config = normalizeConfig(input);
    var signed;
    var absolute;
    var imageArea;
    var multiplicity;
    var reading;
    if (config.mode === "polar") {
      imageArea = polarDiskArea(config.radius);
      multiplicity = coverageMultiplicity(config);
      signed = multiplicity * imageArea;
      absolute = signed;
      reading = multiplicity === 1 ? "几乎处处一一；原点/接缝是零测集例外" : "圆盘内部几乎处处二重覆盖";
    } else {
      imageArea = 1;
      multiplicity = 1;
      signed = jacobian(config.mode, 0);
      absolute = Math.abs(signed);
      reading = config.mode === "reflection" ? "一一对应，但方向反转" : "一一对应且方向保持";
    }
    return {
      config: config,
      signedJacobianIntegral: signed,
      absoluteJacobianIntegral: absolute,
      imageArea: imageArea,
      multiplicity: multiplicity,
      correctedArea: absolute / multiplicity,
      coverageReading: reading,
      samplePoints: samplePoints(config),
      preimages: config.mode === "polar" ? Array.from({ length: multiplicity }, function (_, j) { return [.75 * config.radius, PI / 4 + 2 * PI * j]; }) : [[.75, .5]],
      markedImage: mapPoint(config.mode, config.mode === "polar" ? .75 * config.radius : .75, config.mode === "polar" ? PI / 4 : .5),
      sectorArea: config.mode === "polar" ? PI * config.radius * config.radius / 16 : null,
      rows: [
        { label: "有向 Jacobian 账", value: signed, note: "保留方向符号" },
        { label: "绝对 Jacobian 账", value: absolute, note: "普通面积积分" },
        { label: "像域一次面积", value: imageArea, note: "目标区域只数一次" },
        { label: "覆盖重数", value: multiplicity, note: reading },
        { label: "按重数校正", value: absolute / multiplicity, note: "参数账 ÷ 重数" }
      ]
    };
  }

  function samplePoints(config) {
    var points = [];
    var index;
    var angle;
    if (config.mode === "polar") {
      for (index = 1; index <= 8; index += 1) {
        angle = (2 * PI * index) / 8;
        points.push(mapPoint("polar", config.radius * 0.78, angle));
      }
      return points;
    }
    [[0, 0], [1, 0], [1, 1], [0, 1]].forEach(function (point) {
      points.push(mapPoint(config.mode, point[0], point[1]));
    });
    return points;
  }

  function format(value, digits) {
    if (value === null || value === undefined || !finite(value)) return "—";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.0005) return value.toExponential(Math.min(places, 4));
    return places === 0 ? value.toFixed(0) : value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
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
    return element(doc, "div", { className: "cov-metric" }, [
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

  function svgText(doc, x, y, text, attrs) {
    var merged = { x: x, y: y, className: "cov-label" };
    Object.keys(attrs || {}).forEach(function (key) { merged[key] = attrs[key]; });
    return svgElement(doc, "text", merged, [text]);
  }

  function drawSvg(doc, result, uid) {
    var svg = svgElement(doc, "svg", { className: "cov-svg", viewBox: "0 0 740 500", role: "img", "aria-labelledby": uid + "-title " + uid + "-desc" }, []);
    svg.appendChild(svgElement(doc, "title", { id: uid + "-title" }, ["换元的方向、面积与原像"]));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-desc" }, ["左侧画参数点与参数片，右侧画其像；极坐标两圈的两个参数片重合到同一个扇环。右图坐标比例随半径保持不变。"]));
    function text(x,y,t,attrs) { svg.appendChild(svgText(doc,x,y,t,attrs)); }
    function shape(tag,attrs) { var e=svgElement(doc,tag,attrs,[]); svg.appendChild(e); return e; }
    function point(x,y,attrs) { return shape("circle",Object.assign({cx:x,cy:y,r:4,fill:"var(--cov-gold)",stroke:"currentColor"},attrs)); }
    function axes(cx,cy,scale,max,horizontal,vertical) {
      shape("line",{x1:cx-max*scale,y1:cy,x2:cx+max*scale,y2:cy,className:"cov-axis"});
      shape("line",{x1:cx,y1:cy-max*scale,x2:cx,y2:cy+max*scale,className:"cov-axis"});
      for(var k=-Math.floor(max);k<=max;k++) { if(k===0)continue;
        shape("line",{x1:cx+k*scale,y1:cy-3,x2:cx+k*scale,y2:cy+3,className:"cov-axis"}); text(cx+k*scale-4,cy+17,String(k));
        shape("line",{x1:cx-3,y1:cy-k*scale,x2:cx+3,y2:cy-k*scale,className:"cov-axis"}); text(cx+6,cy-k*scale+4,String(k));
      }
      text(cx+max*scale+7,cy+4,horizontal||"x");text(cx+7,cy-max*scale-8,vertical||"y");
    }
    text(45,30,"参数域：每个记录都参与积分",{className:"cov-title"});
    text(405,30,"像域：几何区域只数一次",{className:"cov-title"});
    var c=result.config,R=c.radius;
    if(c.mode!=="polar") {
      axes(170,265,85,1.5,"u","v");axes(550,265,85,1.5);
      var original=[[0,0],[1,0],[1,1],[0,1]];
      function poly(points,cx,kind) { shape("polygon",{points:points.map(function(p){return (cx+85*p[0])+","+(265-85*p[1]);}).join(" "),className:kind,"data-polygon":cx===170?"domain":"image"}); }
      poly(original,170,"cov-domain");poly(original.map(function(p){return mapPoint(c.mode,p[0],p[1]);}),550,c.mode==="reflection"?"cov-reflect":"cov-image");
      point(170+85*.75,265-85*.5,{"data-preimage":"0"});
      point(550+85*result.markedImage[0],265-85*result.markedImage[1],{"data-image-point":"true"});
      text(45,385,"(u,v) = (0.75, 0.5)");text(405,385,"(x,y) = ("+format(result.markedImage[0],2)+", 0.5)");
      text(45,415,"左右横、纵轴都使用同一单位长度。");
      text(45,445,c.mode==="reflection"?"反射后 x ≤ 0；J = −1，普通面积 |J| = 1。":"恒等映射保留每个坐标；J = 1，面积 = 1。");
    } else {
      var top=95,bottom=345,left=55,w=250,h=250,thetaMax=2*PI*c.turns;
      function param(r,t){return [left+w*r/R,bottom-h*t/thetaMax];}
      shape("rect",{x:left,y:top,width:w,height:h,className:"cov-domain"});
      text(left,365,"0");text(left+w-4,365,"R");text(left+w+15,350,"r");text(25,top+4,c.turns===1?"2π":"4π");text(30,bottom+4,"0");text(48,75,"θ");
      if(c.turns===2){shape("line",{x1:left,y1:220,x2:left+w,y2:220,className:"cov-axis","stroke-dasharray":"5 4"});text(25,224,"2π");}
      result.preimages.forEach(function(p,j){
        var lo=param(R/2,PI/3+2*PI*j),hi=param(R,PI/6+2*PI*j);
        shape("rect",{x:lo[0],y:lo[1],width:hi[0]-lo[0],height:hi[1]-lo[1],fill:"var(--cov-gold)","fill-opacity":.4,stroke:"var(--cov-gold)","data-sector-input":j});
        var q=param(p[0],p[1]);point(q[0],q[1],{"data-preimage":j});text(q[0]+8,q[1]-8,String(j+1));
      });
      axes(550,235,43,3);
      shape("circle",{cx:550,cy:235,r:43*R,className:"cov-image","data-image-disk":"true"});
      var boundary=[];
      for(var j=0;j<=64;j++)boundary.push(mapPoint("polar",R,PI/6+j*PI/6/64));
      for(var j=64;j>=0;j--)boundary.push(mapPoint("polar",R/2,PI/6+j*PI/6/64));
      shape("polygon",{points:boundary.map(function(p){return (550+43*p[0]).toFixed(4)+","+(235-43*p[1]).toFixed(4);}).join(" "),fill:"var(--cov-gold)","fill-opacity":.5,stroke:"var(--cov-gold)","data-sector-image":"true"});
      point(550+43*result.markedImage[0],235-43*result.markedImage[1],{"data-image-point":"true"});
      text(405,385,"像点 = ("+format(result.markedImage[0],3)+", "+format(result.markedImage[1],3)+")");
      text(45,395,"点 1：(3R/4, π/4)"+(c.turns===2?"；点 2：θ = 9π/4":""));
      text(45,425,"金色扇环一次面积 = πR²/16 ≈ "+format(result.sectorArea,4));
      text(45,450,c.turns===2?"两个参数片 → 同一扇环；图中一个像点有两个参数记录。":"一个参数片 → 一个扇环；面积缩放率随 r 改变。");
      text(45,478,"左图 r 与 θ 使用各自刻度；右图 x、y 同尺度，R = "+format(R,2));
    }
    return svg;
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
    var status = root.querySelector("[data-cov-status]");
    if (status) status.textContent = message;
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    installStyles(doc);
    var uid = "cov-" + (++INSTANCE);
    var state = { presetId: DEFAULT.presetId, radius: DEFAULT.radius };
    var prediction = { sign: null, origin: null, cover: null };
    var revealed = false;
    var score = 0;
    var shell = element(doc, "div", { className: "cov-lab" }, []);
    clear(root);
    root.appendChild(shell);

    function addPrediction(list, key, legendText, options) {
      var fieldset = element(doc, "fieldset", {}, []);
      fieldset.appendChild(element(doc, "legend", {}, [legendText]));
      var grid = element(doc, "div", { className: "cov-choice-grid" }, []);
      options.forEach(function (option) {
        var button = element(doc, "button", {
          type: "button",
          "aria-pressed": prediction[key] === option.value ? "true" : "false",
          "data-cov-choice": key + ":" + option.value
        }, [option.label]);
        button.addEventListener("click", function () {
          prediction[key] = option.value;
          revealed = false;
          renderGate();
          shell.querySelector('[data-cov-choice="' + key + ':' + option.value + '"]').focus();
        });
        grid.appendChild(button);
      });
      fieldset.appendChild(grid);
      list.appendChild(fieldset);
    }

    function complete() {
      return prediction.sign !== null && prediction.origin !== null && prediction.cover !== null;
    }

    function renderGate() {
      clear(shell);
      shell.appendChild(element(doc, "h3", {}, ["换元三账：方向、面积与覆盖"]));
      shell.appendChild(element(doc, "p", { className: "cov-note" }, [
        revealed
          ? "预测已提交；现在可以切换映射和半径，检查同一套账本如何重算。"
          : "先判断符号、原点和两圈覆盖；提交前不显示数值图与账本。"
      ]));
      shell.appendChild(element(doc, "div", { className: "cov-prompt" }, [
        revealed
          ? "当前输出是 f≡1 的固定映射的解析计算：它展示公式的记账结构，不替代换元定理的正则性假设。"
          : "预测门：普通面积、极坐标的零测集退化、覆盖重数分别判断。"
      ]));
      var questions = element(doc, "div", { className: "cov-question-list" }, []);
      addPrediction(questions, "sign", "1 · 反射映射的普通面积账？", [
        { value: "signed", label: "使用 J=-1" },
        { value: "absolute", label: "使用 |J|=1" },
        { value: "zero", label: "面积为 0" }
      ]);
      addPrediction(questions, "origin", "2 · 极坐标原点退化？", [
        { value: "break", label: "公式失效" },
        { value: "null", label: "零测集例外" },
        { value: "double", label: "整盘重复" }
      ]);
      addPrediction(questions, "cover", "3 · 两圈极坐标使一般像点被计数几次？", [
        { value: "one", label: "一次" },
        { value: "two", label: "两次" },
        { value: "none", label: "没有覆盖" }
      ]);
      shell.appendChild(questions);
      var actions = element(doc, "div", { className: "cov-actions" }, []);
      var reveal = element(doc, "button", {
        type: "button",
        className: "cov-primary",
        disabled: revealed || !complete()
      }, [revealed ? "账本已揭示" : "提交预测并揭示"]);
      reveal.addEventListener("click", function () {
        if (!complete()) return;
        score = (prediction.sign === "absolute" ? 1 : 0) + (prediction.origin === "null" ? 1 : 0) + (prediction.cover === "two" ? 1 : 0);
        revealed = true;
        renderGate();
        shell.querySelector('[data-cov-preset="' + state.presetId + '"]').focus();
        announce(api, root, "预测已提交；换元账本已揭示。");
      });
      var reset = element(doc, "button", { type: "button" }, [revealed ? "重新预测" : "重置"]);
      reset.addEventListener("click", resetToGate);
      actions.appendChild(reveal);
      actions.appendChild(reset);
      shell.appendChild(actions);
      shell.appendChild(element(doc, "p", {
        className: "cov-feedback " + (revealed ? (score === 3 ? "cov-pass" : "cov-warn") : ""),
        "aria-live": "polite",
        "data-cov-status": true
      }, [
        !complete() ? "请为三个判断各选一项。" : revealed ? "预测得分 " + score + "/3；下面显示三本积分账。" : "三项预测已记录，点击提交后才显示结果。"
      ]));
      if (revealed) buildResults();
    }

    function buildResults() {
      var panel = element(doc, "section", { className: "cov-revealed" }, [
        element(doc, "h4", {}, ["结果与透明账本"]),
        element(doc, "p", { className: "cov-note" }, ["恒等/反射使用单位正方形；极坐标使用半径 R 的参数域。绝对 Jacobian 账除以覆盖重数后才与像域一次面积比较。"])
      ]);
      var presetGrid = element(doc, "div", { className: "cov-preset-grid" }, []);
      PRESETS.forEach(function (preset) {
        var button = element(doc, "button", {
          type: "button",
          "aria-pressed": state.presetId === preset.id ? "true" : "false",
          "data-cov-preset": preset.id
        }, [preset.label]);
        button.addEventListener("click", function () {
          state.presetId = preset.id;
          renderGate();
          shell.querySelector('[data-cov-preset="' + preset.id + '"]').focus();
        });
        presetGrid.appendChild(button);
      });
      panel.appendChild(presetGrid);
      var controls = element(doc, "div", { className: "cov-controls" }, []);
      var radiusId = uid + "-radius";
      var radiusOutput = element(doc, "output", { for: radiusId }, [format(state.radius, 2)]);
      var radiusInput = element(doc, "input", {
        id: radiusId,
        type: "range",
        min: "0.25",
        max: "2.5",
        step: "0.05",
        value: String(state.radius),
        "aria-label": "极坐标半径",
        disabled: findPreset(state.presetId).mode !== "polar"
      });
      radiusInput.addEventListener("input", function () {
        state.radius = Number(radiusInput.value);
        radiusOutput.textContent = format(state.radius, 2);
        renderResults();
      });
      controls.appendChild(element(doc, "div", { className: "cov-control" }, [
        element(doc, "label", { htmlFor: radiusId }, ["极坐标半径 R = ", radiusOutput]), radiusInput
      ]));
      controls.appendChild(element(doc, "p", { className: "cov-note" }, ["恒等/反射模式中半径滑块不改变单位正方形账本。"]));
      panel.appendChild(controls);
      var stage = element(doc, "div", { className: "cov-stage" }, []);
      panel.appendChild(stage);
      shell.appendChild(panel);

      function renderResults() {
        var result = compute(state);
        clear(stage);
        stage.appendChild(element(doc, "div", { className: "cov-metrics" }, [
          metric(doc, "∫J（有向）", format(result.signedJacobianIntegral, 4)),
          metric(doc, "∫|J|", format(result.absoluteJacobianIntegral, 4)),
          metric(doc, "像域面积", format(result.imageArea, 4)),
          metric(doc, "覆盖重数", String(result.multiplicity)),
          metric(doc, "校正后", format(result.correctedArea, 4))
        ]));
        var frame = element(doc, "div", { className: "cov-frame", tabindex: "0", role: "region", "aria-label": "换元坐标图，可横向滚动" }, []);
        frame.appendChild(drawSvg(doc, result, uid));
        frame.appendChild(element(doc, "p", { className: "cov-note" }, [result.coverageReading + "。面积采用解析公式；扇环弧线用折线显示。一般换元仍须检查正文定理条件。"]));
        stage.appendChild(frame);
        stage.appendChild(element(doc, "div", { className: "cov-table-wrap", tabindex: "0", role: "region", "aria-label": "积分账本，可横向滚动" }, [
          tableElement(doc, "Jacobian / 覆盖账本（f≡1）", ["项目", "数值", "解释"], result.rows.map(function (row) {
            return [row.label, format(row.value, 5), row.note];
          }))
        ]));
        stage.appendChild(element(doc, "p", { className: "cov-interpretation", "aria-live": "polite" }, [
          result.config.mode === "reflection"
            ? "反射的 J 为负只表示方向翻转；普通面积仍取 |J|。"
            : result.config.mode === "polar" && result.multiplicity > 1
              ? "两圈极坐标的参数积分是像域面积的两倍；覆盖重数校正不是数值误差，而是映射结构。"
              : "普通面积使用绝对 Jacobian；极坐标一圈只在原点/接缝等零测集处失去逐点一一对应。"
        ]));
      }
      renderResults();
    }

    function resetToGate() {
      state = { presetId: DEFAULT.presetId, radius: DEFAULT.radius };
      prediction = { sign: null, origin: null, cover: null };
      revealed = false;
      score = 0;
      renderGate();
      shell.querySelector("fieldset button").focus();
      announce(api, root, "换元实验已重置；请重新完成三个预测。");
    }

    renderGate();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    var identity = compute({ presetId: "identity" });
    assert(near(jacobian("identity", 0.4), 1), "identity Jacobian");
    assert(near(identity.signedJacobianIntegral, 1), "identity signed area");
    assert(near(identity.absoluteJacobianIntegral, 1), "identity absolute area");
    assert(near(identity.correctedArea, identity.imageArea), "identity area correction");
    var reflection = compute({ presetId: "reflection" });
    assert(near(jacobian("reflection", 0.4), -1), "reflection Jacobian sign");
    assert(near(reflection.signedJacobianIntegral, -1), "reflection signed area");
    assert(near(reflection.absoluteJacobianIntegral, 1), "reflection ordinary area");
    var polar = compute({ presetId: "polar-disk", radius: 1.4 });
    assert(near(jacobian("polar", 0), 0), "polar origin Jacobian");
    assert(near(jacobian("polar", 0.7), 0.7), "polar radial Jacobian");
    assert(near(polar.imageArea, PI * 1.4 * 1.4), "polar disk area");
    assert(polar.multiplicity === 1, "one-turn covering multiplicity");
    var double = compute({ presetId: "polar-double", radius: 1.4 });
    assert(double.multiplicity === 2, "two-turn covering multiplicity");
    assert(near(double.absoluteJacobianIntegral, 2 * double.imageArea), "two-turn parameter area");
    assert(near(double.correctedArea, double.imageArea), "two-turn corrected area");
    assert(mapPoint("polar", 0, 1.23)[0] === 0 && mapPoint("polar", 0, 1.23)[1] === 0, "polar origin map");
    var rejected=false;try{compute({radius:99});}catch(e){rejected=true;}assert(rejected,"invalid radius rejected");
    assert(compute({ presetId: "polar-disk" }).rows.length === 5, "nonempty ledger rows");
    assert(JSON.stringify(compute({ presetId: "polar-double" }).samplePoints) === JSON.stringify(compute({ presetId: "polar-double" }).samplePoints), "deterministic samples");
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    DEFAULT: DEFAULT,
    PRESETS: PRESETS,
    normalizeConfig: normalizeConfig,
    mapPoint: mapPoint,
    jacobian: jacobian,
    coverageMultiplicity: coverageMultiplicity,
    polarDiskArea: polarDiskArea,
    compute: compute,
    drawSvg: drawSvg,
    format: format,
    mount: mount,
    selfTest: selfTest
  };
});

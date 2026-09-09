(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("linear-space-coordinates", exported.mount);
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
        "linear-space-coordinates self-test: PASS (" +
          report.checks +
          " checks, " +
          report.presets +
          " presets)"
      );
    } catch (error) {
      console.error("linear-space-coordinates self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : null,
  function (host) {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "cl-linear-space-coordinates-style";
    var INSTANCE = 0;
    var DEFAULTS = { presetId: "parameter", t: 0, px: 3, py: 2 };

    var PRESETS = [
      {
        id: "parameter",
        label: "参数族：u=(1,1), v=(2,t)",
        dimension: 2,
        vectors: function (t) { return [[1, 1], [2, t]]; },
        labels: ["u", "v"]
      },
      {
        id: "redundant",
        label: "生成但冗余：e₁, e₂, (t,1)",
        dimension: 2,
        vectors: function (t) { return [[1, 0], [0, 1], [t, 1]]; },
        labels: ["e₁", "e₂", "w"]
      },
      {
        id: "collinear",
        label: "一维退化：u, 2u, tu",
        dimension: 2,
        vectors: function (t) { return [[1, 1], [2, 2], [t, t]]; },
        labels: ["u", "2u", "tu"]
      }
    ];

    var STYLE_TEXT = [
      ".lsc-lab{--lsc-blue:var(--cl-blue,#315f9d);--lsc-gold:var(--cl-gold,#9b6a12);--lsc-green:var(--cl-green,#39734d);--lsc-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
      ".lsc-lab *,.lsc-lab *::before,.lsc-lab *::after{box-sizing:border-box;}.lsc-lab [hidden]{display:none!important;}",
      ".lsc-lab h3,.lsc-lab h4{margin:0;color:var(--fg);letter-spacing:0;}.lsc-lab h3{font-size:1.18rem;}.lsc-lab h4{margin-top:16px;font-size:1rem;}",
      ".lsc-lab p{margin:.65em 0;}.lsc-lab .lsc-note,.lsc-lab .lsc-feedback,.lsc-lab .lsc-boundary{color:var(--fg-soft);font-size:13px;line-height:1.7;}",
      ".lsc-lab button,.lsc-lab select,.lsc-lab input{font:inherit;letter-spacing:0;}.lsc-lab button,.lsc-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere;}",
      ".lsc-lab input[type=range],.lsc-lab input[type=number]{min-height:44px;}.lsc-lab input[type=range]{display:block;width:100%;margin:0;accent-color:var(--accent);}.lsc-lab input[type=number]{width:100%;padding:7px 9px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);}",
      ".lsc-lab button:hover{border-color:var(--accent);}.lsc-lab button[aria-pressed=\"true\"],.lsc-lab button.lsc-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}.lsc-lab button:focus-visible,.lsc-lab select:focus-visible,.lsc-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
      ".lsc-lab .lsc-predict{margin:14px 0;padding:13px 14px;border-left:3px solid var(--lsc-gold);background:var(--bg);}.lsc-lab .lsc-predict-title{display:block;margin-bottom:10px;font-size:13px;}.lsc-lab .lsc-question-list{display:grid;gap:12px;}.lsc-lab .lsc-question{min-width:0;margin:0;padding:0;border:0;}.lsc-lab .lsc-question legend{max-width:100%;margin-bottom:7px;color:var(--fg);font-size:12.5px;font-weight:700;overflow-wrap:anywhere;}.lsc-lab .lsc-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}.lsc-lab .lsc-choice-row button{font-size:12px;}",
      ".lsc-lab .lsc-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}.lsc-lab .lsc-actions>*{flex:1 1 155px;}.lsc-lab .lsc-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}.lsc-lab .lsc-pass,.lsc-lab .lsc-ok{color:var(--lsc-green);}.lsc-lab .lsc-warn,.lsc-lab .lsc-fail{color:var(--lsc-red);}",
      ".lsc-lab .lsc-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 16px;margin:14px 0;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}.lsc-lab .lsc-control{display:grid;gap:5px;min-width:0;}.lsc-lab .lsc-control label{color:var(--fg-soft);font-size:13px;font-weight:700;}.lsc-lab .lsc-control output{color:var(--accent);font-variant-numeric:tabular-nums;}",
      ".lsc-lab .lsc-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:12px 0;}.lsc-lab .lsc-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.lsc-lab .lsc-metric.lsc-blue{border-top-color:var(--lsc-blue);}.lsc-lab .lsc-metric.lsc-gold{border-top-color:var(--lsc-gold);}.lsc-lab .lsc-metric.lsc-green{border-top-color:var(--lsc-green);}.lsc-lab .lsc-metric.lsc-red{border-top-color:var(--lsc-red);}.lsc-lab .lsc-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4;}.lsc-lab .lsc-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
      ".lsc-lab .lsc-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.lsc-lab .lsc-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;margin-top:12px;}.lsc-lab .lsc-chart-frame{min-width:0;padding:7px;border:1px solid var(--border);border-radius:7px;background:var(--bg);max-width:100%;overflow-x:auto;}.lsc-lab svg{display:block;width:100%;min-width:700px;height:auto;color:var(--fg);}.lsc-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.lsc-lab .lsc-ledger{max-width:100%;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.lsc-lab table{width:100%;min-width:600px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.lsc-lab th,.lsc-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere;}.lsc-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750;}.lsc-lab .lsc-interpretation{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--lsc-green);background:var(--bg);font-size:13px;line-height:1.7;}",
      "@media(max-width:760px){.lsc-lab .lsc-controls,.lsc-lab .lsc-grid{grid-template-columns:minmax(0,1fr);}.lsc-lab .lsc-choice-row{grid-template-columns:minmax(0,1fr);}}",
      "@media(max-width:420px){.lsc-lab .lsc-predict{padding-left:11px;padding-right:11px;}.lsc-lab th,.lsc-lab td{padding-left:5px;padding-right:5px;}}",
      '[data-theme="dark"] .lsc-lab{--lsc-blue:#60a5fa;--lsc-gold:#fbbf24;--lsc-green:#4ade80;--lsc-red:#fca5a5}.lsc-lab [tabindex]:focus-visible{outline:3px solid var(--accent);outline-offset:-3px;}',
      "@media(prefers-reduced-motion:reduce){.lsc-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
    ].join("\n");

    function finite(value) {
      return typeof value === "number" && isFinite(value);
    }

    function number(value) {
      if(!finite(value))throw new RangeError("expected a finite number");return value;
    }
    function bounded(value,low,high){number(value);if(value<low||value>high)throw new RangeError("outside teaching domain");return value;}
    function formatNumber(value,digits){
      number(value);var places=digits===undefined?3:digits;if(value===0)return "0";
      if(Math.abs(value)<Math.pow(10,-places)||Math.abs(value)>=1e6)return value.toExponential(3);
      var text=value.toFixed(places);return places?text.replace(/0+$/,"").replace(/\.$/,""):text;
    }
    function checked(matrix){
      if(!Array.isArray(matrix)||matrix.length!==2||!Array.isArray(matrix[0])||matrix[0].length<1||matrix[0].length>64)throw new TypeError("expected 2 rows and 1 to 64 columns");
      var n=matrix[0].length;
      for(var i=0;i<2;i++){if(!Array.isArray(matrix[i])||matrix[i].length!==n)throw new TypeError("ragged matrix");for(var j=0;j<n;j++)number(matrix[i][j]);}
      return matrix;
    }
    function check2(matrix){checked(matrix);if(matrix[0].length!==2)throw new TypeError("expected 2 by 2 matrix");return matrix;}

    function presetById(id) {
      for (var i = 0; i < PRESETS.length; i += 1) {
        if (PRESETS[i].id === id) return PRESETS[i];
      }
      throw new Error("Unknown vector preset: " + id);
    }

    function matrixFromColumns(vectors){
      if(!Array.isArray(vectors)||vectors.length<1||vectors.length>64)throw new TypeError("expected 1 to 64 two-dimensional vectors");
      for(var i=0;i<vectors.length;i++){if(!Array.isArray(vectors[i])||vectors[i].length!==2)throw new TypeError("expected two-dimensional vector");number(vectors[i][0]);number(vectors[i][1]);}
      return [vectors.map(function(v){return v[0];}),vectors.map(function(v){return v[1];})];
    }
    function dyadic(value) {
      number(value); if (value===0) return {n:0n,e:0};
      var view=new DataView(new ArrayBuffer(8));view.setFloat64(0,value,false);
      var high=view.getUint32(0,false),low=view.getUint32(4,false),exponent=(high>>>20)&2047;
      var mantissa=(BigInt(high&1048575)<<32n)|BigInt(low);
      if(exponent)mantissa|=1n<<52n;
      return {n:high>>>31?-mantissa:mantissa,e:exponent?exponent-1075:-1074};
    }
    function exactDet(matrix) {
      check2(matrix);var a=dyadic(matrix[0][0]),b=dyadic(matrix[0][1]),c=dyadic(matrix[1][0]),d=dyadic(matrix[1][1]);
      var e1=a.e+d.e,e2=b.e+c.e,e=Math.min(e1,e2);
      return {n:((a.n*d.n)<<BigInt(e1-e))-((b.n*c.n)<<BigInt(e2-e)),e:e};
    }
    function ratio(numerator,denominator,requireNonzero) {
      if(denominator.n===0n)throw new RangeError("division by zero");
      if(numerator.n===0n)return 0;
      function parts(pair) {
        var n=pair.n<0n?-pair.n:pair.n,bits=n.toString(2).length,shift=Math.max(0,bits-54);
        return {mantissa:Number(n>>BigInt(shift))/Math.pow(2,Math.min(bits,54)-1),exponent:pair.e+bits-1};
      }
      var a=parts(numerator),b=parts(denominator),m=a.mantissa/b.mantissa,e=a.exponent-b.exponent;
      if(m<1){m*=2;e--;}
      if(m>=2){m/=2;e++;}
      var pivot=Math.max(-1022,Math.min(1023,e));
      var value=(m*Math.pow(2,pivot))*Math.pow(2,e-pivot);
      if(!Number.isFinite(value)||(requireNonzero&&value===0))throw new RangeError("result outside floating-point representation");
      return (numerator.n<0n)!==(denominator.n<0n)?-value:value;
    }
    function matrixRank(matrix){
      checked(matrix);var n=matrix[0].length;
      if(matrix.every(function(row){return row.every(function(v){return v===0;});}))return 0;
      for(var i=0;i<n;i++)for(var j=i+1;j<n;j++)if(exactDet([[matrix[0][i],matrix[0][j]],[matrix[1][i],matrix[1][j]]]).n!==0n)return 2;
      return 1;
    }
    function determinant2(a,b){return ratio(exactDet(matrixFromColumns([a,b])),{n:1n,e:0},false);}
    function solve2(a,b,target){
      var det=exactDet(matrixFromColumns([a,b]));matrixFromColumns([target]);
      if(det.n===0n)return null;
      return [ratio(exactDet(matrixFromColumns([target,b])),det,true),ratio(exactDet(matrixFromColumns([a,target])),det,true)];
    }
    function analyze(options){
      if(options!==undefined&&(options===null||typeof options!=="object"))throw new TypeError("expected coordinate options");
      var settings=options||{},preset=presetById(settings.presetId===undefined?DEFAULTS.presetId:settings.presetId);
      var t=bounded(settings.t===undefined?DEFAULTS.t:settings.t,-2,4);
      var px=bounded(settings.px===undefined?DEFAULTS.px:settings.px,-8,8),py=bounded(settings.py===undefined?DEFAULTS.py:settings.py,-8,8);
      var vectors=preset.vectors(t),matrix=matrixFromColumns(vectors),target=[px,py];
      var rank=preset.id==="redundant"?2:preset.id==="collinear"||t===2?1:2;
      var nullity=vectors.length-rank,independent=nullity===0,spans=rank===2,basis=independent&&spans;
      var inSpan=rank===2||px===py,coordinates=solve2(vectors[0],vectors[1],target);
      var relations=preset.id==="redundant"?[[-t,-1,1]]:preset.id==="collinear"?[[-2,1,0],[-t,0,1]]:t===2?[[-2,1]]:[];
      var particular=!inSpan?null:preset.id==="redundant"?[px,py,0]:preset.id==="collinear"?[px,0,0]:rank===1?[px,0]:coordinates;
      var reconstructed=particular?[0,1].map(function(j){return vectors.reduce(function(sum,v,i){return sum+v[j]*particular[i];},0);}):null;
      var residual=reconstructed?Math.hypot(reconstructed[0]-px,reconstructed[1]-py):null;
      var condition=null;
      if(preset.id==="redundant")condition=1;
      else if(basis){var trace=6+t*t;condition=(trace+Math.hypot(2-(4+t*t),2*(2+t)))/(2*Math.abs(t-2));}
      return {preset:preset,t:t,vectors:vectors,labels:preset.labels,matrix:matrix,rank:rank,dimension:2,nullity:nullity,independent:independent,spans:spans,basis:basis,target:target,coordinates:coordinates,relations:relations,inSpan:inSpan,particular:particular,reconstructed:reconstructed,residual:residual,condition:condition,representation:!inSpan?"无表示":nullity?"无穷多种表示":"唯一表示"};
    }

    function element(doc, tag, attrs, children) {
      var node = doc.createElement(tag);
      Object.keys(attrs || {}).forEach(function (key) {
        var value = attrs[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.setAttribute("class", value);
        else if (key === "text") node.textContent = value;
        else if (key.slice(0, 2) === "on" && typeof value === "function") {
          node.addEventListener(key.slice(2).toLowerCase(), value);
        } else if (value === true) node.setAttribute(key, "");
        else node.setAttribute(key, String(value));
      });
      if (children !== undefined && children !== null) {
        (Array.isArray(children) ? children : [children]).forEach(function (child) {
          if (child === null || child === undefined) return;
          node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
        });
      }
      return node;
    }

    function replaceChildren(node, children) {
      while (node.firstChild) node.removeChild(node.firstChild);
      (Array.isArray(children) ? children : [children]).forEach(function (child) {
        if (child === null || child === undefined) return;
        node.appendChild(child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
      });
    }

    function svgNode(doc, tag, attrs, text) {
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, String(attrs[key])); });
      if (text !== undefined) node.textContent = text;
      return node;
    }

    function installStyle(doc) {
      if (doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement).appendChild(style);
    }

    function metric(doc, label, value, color) {
      return element(doc, "div", { className: "lsc-metric " + (color || "") }, [
        element(doc, "span", { text: label }),
        element(doc, "strong", { text: value })
      ]);
    }

    function choiceQuestion(doc, refs, key, legendText, choices) {
      var fieldset = element(doc, "fieldset", { className: "lsc-question" });
      fieldset.appendChild(element(doc, "legend", { text: legendText }));
      var row = element(doc, "div", { className: "lsc-choice-row" });
      refs[key] = [];
      choices.forEach(function (choice) {
        var button = element(doc, "button", {
          type: "button",
          "aria-pressed": "false",
          text: choice.label
        });
        button.addEventListener("click", function () {
          refs.state.predictions[key] = choice.value;
          refs.state.revealed=false;
          refs.render();
        });
        refs[key].push({ value: choice.value, node: button });
        row.appendChild(button);
      });
      fieldset.appendChild(row);
      return fieldset;
    }

    function renderPrediction(refs) {
      ["span", "redundancy", "coordinates"].forEach(function (key) {
        (refs[key] || []).forEach(function (item) {
          item.node.setAttribute(
            "aria-pressed",
            refs.state.predictions[key] === item.value ? "true" : "false"
          );
        });
      });
      var answered = ["span", "redundancy", "coordinates"].every(function (key) {
        return refs.state.predictions[key] !== null;
      });
      refs.feedback.textContent = answered ? "三个预测已记录，可以揭示结果。" : "请先完成三个预测。";
      refs.feedback.className = "lsc-feedback";
    }

    function arrowSvg(doc,data,uid){
      var svg=svgNode(doc,"svg",{viewBox:"0 0 700 470",role:"img","aria-labelledby":uid+"-svg-title "+uid+"-svg-desc"});
      svg.appendChild(svgNode(doc,"title",{id:uid+"-svg-title"},"列向量、生成空间与目标"));
      svg.appendChild(svgNode(doc,"desc",{id:uid+"-svg-desc"},"同一等比例标准坐标；淡色平面或斜线表示生成空间，右侧图例保留重合向量的身份。"));
      var limit=2;data.vectors.concat([data.target]).forEach(function(v){limit=Math.max(limit,Math.ceil(Math.max(Math.abs(v[0]),Math.abs(v[1]))+.5));});
      var pixels=165/limit,ox=240,oy=235,mapX=function(x){return ox+pixels*x;},mapY=function(y){return oy-pixels*y;};
      if(data.rank===2)svg.appendChild(svgNode(doc,"rect",{x:75,y:70,width:330,height:330,fill:"var(--lsc-blue)","fill-opacity":.06}));
      else svg.appendChild(svgNode(doc,"line",{x1:75,y1:400,x2:405,y2:70,stroke:"var(--lsc-blue)","stroke-width":8,"stroke-opacity":.2}));
      [-limit,0,limit].forEach(function(t){svg.appendChild(svgNode(doc,"line",{x1:mapX(t),y1:70,x2:mapX(t),y2:400,stroke:"currentColor","stroke-opacity":.12}));svg.appendChild(svgNode(doc,"line",{x1:75,y1:mapY(t),x2:405,y2:mapY(t),stroke:"currentColor","stroke-opacity":.12}));svg.appendChild(svgNode(doc,"text",{x:mapX(t),y:422,"text-anchor":"middle","font-size":13},String(t)));svg.appendChild(svgNode(doc,"text",{x:63,y:mapY(t)+4,"text-anchor":"end","font-size":13},String(t)));});
      svg.appendChild(svgNode(doc,"line",{x1:70,y1:oy,x2:415,y2:oy,stroke:"currentColor","stroke-opacity":.6}));svg.appendChild(svgNode(doc,"line",{x1:ox,y1:65,x2:ox,y2:405,stroke:"currentColor","stroke-opacity":.6}));
      var colors=["var(--lsc-blue)","var(--lsc-gold)","var(--lsc-green)"];
      data.vectors.forEach(function(v,i){var color=colors[i];svg.appendChild(svgNode(doc,"line",{x1:ox,y1:oy,x2:mapX(v[0]),y2:mapY(v[1]),stroke:color,"stroke-width":3}));svg.appendChild(svgNode(doc,"circle",{cx:mapX(v[0]),cy:mapY(v[1]),r:4.5,fill:color}));svg.appendChild(svgNode(doc,"circle",{cx:444,cy:94+i*37,r:4,fill:color}));svg.appendChild(svgNode(doc,"text",{x:456,y:99+i*37,"font-size":13},data.labels[i]+"=("+v.map(function(x){return formatNumber(x);}).join(", ")+")"));});
      svg.appendChild(svgNode(doc,"circle",{cx:mapX(data.target[0]),cy:mapY(data.target[1]),r:5,fill:"var(--lsc-red)"}));
      svg.appendChild(svgNode(doc,"text",{x:440,y:231,"font-size":13},"红点 p=("+data.target.map(function(x){return formatNumber(x);}).join(", ")+")"));
      svg.appendChild(svgNode(doc,"text",{x:440,y:261,"font-size":13},data.rank===2?"淡色区域：span = R²":"淡色直线：span = {(a,a)}"));
      svg.appendChild(svgNode(doc,"text",{x:440,y:292,"font-size":13},"目标："+data.representation));
      svg.appendChild(svgNode(doc,"text",{x:24,y:28,"font-size":16,"font-weight":700},"先看目标是否在生成空间，再问表示是否唯一"));
      svg.appendChild(svgNode(doc,"text",{x:24,y:49,"font-size":13},"等比例标准坐标；重合向量和零向量请结合图例与系数关系读。"));
      svg.appendChild(svgNode(doc,"text",{x:423,y:oy+5,"font-size":13},"x"));svg.appendChild(svgNode(doc,"text",{x:ox+8,y:66,"font-size":13},"y"));
      return svg;
    }

    function renderResults(refs) {
      var state = refs.state;
      var data = analyze({
        presetId: state.presetId,
        t: state.t,
        px: state.px,
        py: state.py
      });
      refs.presetSelect.value = state.presetId;
      refs.tInput.value = String(state.t);
      refs.tOutput.textContent = formatNumber(state.t, 2);
      refs.pxInput.value = String(state.px);
      refs.pyInput.value = String(state.py);
      refs.summary.textContent =
        (data.basis ? "基" : data.spans ? "生成但不构成基" : "只生成真子空间") +
        "：列秩为 " + data.rank + "，当前列数为 " + data.vectors.length + "。";
      refs.summary.className = "lsc-interpretation " + (data.basis ? "lsc-ok" : "lsc-warn");
      replaceChildren(refs.metrics, [
        metric(refs.doc, "当前向量列", data.vectors.length + " 个", "lsc-blue"),
        metric(refs.doc, "列秩", String(data.rank), data.rank === data.dimension ? "lsc-green" : "lsc-red"),
        metric(refs.doc, "生成空间维数", String(data.rank), "lsc-gold"),
        metric(refs.doc, "线性无关", data.independent ? "是" : "否", data.independent ? "lsc-green" : "lsc-red"),
        metric(refs.doc, "基", data.basis ? "是" : "否", data.basis ? "lsc-green" : "lsc-red"),
        metric(refs.doc,"列关系空间维数",String(data.nullity),"lsc-gold"),
        metric(refs.doc,"目标 p 的表示",data.representation,"lsc-blue"),
        metric(refs.doc,"前两列基的 κ₂",data.condition===null?"不适用（非基）":formatNumber(data.condition),"lsc-gold")
      ]);
      replaceChildren(refs.chart, [
        element(refs.doc, "h4", { text: "向量箭头与坐标对象" }),
        element(refs.doc, "div", { className: "lsc-chart-frame", tabindex:"0", role:"region", "aria-label":"向量与生成空间图，可横向滚动" }, arrowSvg(refs.doc, data, refs.uid))
      ]);
      var rows = data.vectors.map(function (vector, index) {
        return element(refs.doc, "tr", {}, [
          element(refs.doc, "th", { scope: "row", text: data.labels[index] }),
          element(refs.doc, "td", { text: "(" + vector.map(function (value) { return formatNumber(value, 2); }).join(", ") + ")" }),
          element(refs.doc, "td", { text: "列 " + (index + 1) }),
          element(refs.doc, "td", { text: data.independent ? "当前列组无冗余" : "确定存在线性关系，见下方关系基" })
        ]);
      });
      rows.push(element(refs.doc, "tr", {}, [
        element(refs.doc, "th", { scope: "row", text: "p" }),
        element(refs.doc, "td", { text: "(" + formatNumber(data.target[0], 2) + ", " + formatNumber(data.target[1], 2) + ")" }),
        element(refs.doc, "td", { text: "标准坐标" }),
        element(refs.doc, "td", { text: data.coordinates ? "前两列坐标 = (" + formatNumber(data.coordinates[0], 3) + ", " + formatNumber(data.coordinates[1], 3) + ")" : "前两列不能唯一坐标化" })
      ]));
      function row(label,value,role,meaning){rows.push(element(refs.doc,"tr",{},[element(refs.doc,"th",{scope:"row",text:label}),element(refs.doc,"td",{text:value}),element(refs.doc,"td",{text:role}),element(refs.doc,"td",{text:meaning})]));}
      var list=function(v){return "("+v.map(function(x){return formatNumber(x);}).join(", ")+")";};
      row("系数特解 c₀",data.particular?list(data.particular):"不存在","A c₀ = p",data.representation);
      data.relations.forEach(function(relation,i){row("关系基 z"+(i+1),list(relation),"A z"+(i+1)+" = 0","所有解可加此方向的任意倍数（有解时）");});
      row("重新合成 p",data.reconstructed?list(data.reconstructed):"不适用","按当前浮点系数复算",data.residual===null?"目标不在 span 内":"残差二范数 = "+formatNumber(data.residual));
      replaceChildren(refs.ledgerBody, rows);
      refs.boundary.textContent="当前列矩阵 A:R^"+data.vectors.length+"→R²：秩 "+data.rank+" + 关系空间维数 "+data.nullity+" = 列数 "+data.vectors.length+"。这些有限列的完整代数计算可以证明是否生成指定的 R²；不能据此推断未给出的函数空间。"+(data.inSpan?(data.nullity?" 全部表示为 c₀ 加上所列关系基的任意线性组合；选定子列的坐标不能用来断言整组系数唯一。":" 当前是基，坐标唯一；接近 t=2 时基会病态，浮点重新合成残差应单独查看。") : " 目标 p 不在生成直线上，所以没有任何系数解，不能仅说坐标不唯一。");

    }

    function mount(root, api) {
      if (!root || !root.ownerDocument) return;
      var doc = root.ownerDocument;
      installStyle(doc);
      var uid = "lsc-" + (INSTANCE += 1);
      var state = {
        presetId: DEFAULTS.presetId,
        t: DEFAULTS.t,
        px: DEFAULTS.px,
        py: DEFAULTS.py,
        revealed: false,
        predictions: { span: null, redundancy: null, coordinates: null }
      };
      var refs = { doc: doc, uid: uid, state: state };
      var shell = element(doc, "div", { className: "lsc-shell" });
      shell.appendChild(element(doc, "h3", { text: "生成、独立与坐标实验" }));
      shell.appendChild(element(doc, "p", { className: "lsc-note", text: "先预测，再揭示列秩、生成空间和坐标换算。完整列关系可判定这些向量是否生成指定空间。" }));

      var prediction = element(doc, "section", {
        className: "lsc-predict",
        "aria-labelledby": uid + "-predict-title"
      });
      prediction.appendChild(element(doc, "strong", { className: "lsc-predict-title", id: uid + "-predict-title", text: "先预测，再揭示" }));
      var questionList = element(doc, "div", { className: "lsc-question-list" });
      questionList.appendChild(choiceQuestion(doc, refs, "span", "1. u=(1,1), v=(2,2) 能生成 R² 吗？", [
        { value: "no-span", label: "不能，秩为 1" },
        { value: "span", label: "能，两个非零向量即可" },
        { value: "unknown", label: "只能看长度" }
      ]));
      questionList.appendChild(choiceQuestion(doc, refs, "redundancy", "2. 三列向量生成 R²，是否必然线性无关？", [
        { value: "span-dependent", label: "必然相关，生成仍有冗余" },
        { value: "always-independent", label: "是，生成就独立" },
        { value: "same-count", label: "只要长度相同" }
      ]));
      questionList.appendChild(choiceQuestion(doc, refs, "coordinates", "3. 换基后改变的是？", [
        { value: "coordinates-change", label: "向量不变，坐标按基换算" },
        { value: "vector-change", label: "向量变，坐标不变" },
        { value: "both-fixed", label: "两者都不变" }
      ]));
      prediction.appendChild(questionList);
      var actions = element(doc, "div", { className: "lsc-actions" });
      var reveal = element(doc, "button", { type: "button", className: "lsc-primary", text: "揭示并核对" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      prediction.appendChild(actions);
      refs.feedback = element(doc, "p", { className: "lsc-feedback", "aria-live": "polite", text: "请先完成三个预测。" });
      prediction.appendChild(refs.feedback);
      shell.appendChild(prediction);

      var controls = element(doc, "section", { className: "lsc-controls", hidden: true, "aria-label": "实验参数" });
      refs.presetSelect = element(doc, "select", { "aria-label": "选择向量族" });
      PRESETS.forEach(function (preset) {
        refs.presetSelect.appendChild(element(doc, "option", { value: preset.id, text: preset.label }));
      });
      refs.tInput = element(doc, "input", { type: "range", min: "-2", max: "4", step: "0.25", value: String(DEFAULTS.t), "aria-label": "参数 t" });
      refs.tOutput = element(doc, "output", { text: formatNumber(DEFAULTS.t, 2) });
      refs.pxInput = element(doc, "input", { type: "number", min:"-8", max:"8", step: "0.5", value: String(DEFAULTS.px), "aria-label": "目标向量 p 的 x 坐标" });
      refs.pyInput = element(doc, "input", { type: "number", min:"-8", max:"8", step: "0.5", value: String(DEFAULTS.py), "aria-label": "目标向量 p 的 y 坐标" });
      controls.appendChild(element(doc, "div", { className: "lsc-control" }, [
        element(doc, "label", { text: "向量族" }), refs.presetSelect
      ]));
      controls.appendChild(element(doc, "div", { className: "lsc-control" }, [
        element(doc, "label", {}, ["参数 t = ", refs.tOutput]), refs.tInput
      ]));
      controls.appendChild(element(doc, "div", { className: "lsc-control" }, [
        element(doc, "label", { text: "目标 p 的 x 坐标" }), refs.pxInput
      ]));
      controls.appendChild(element(doc, "div", { className: "lsc-control" }, [
        element(doc, "label", { text: "目标 p 的 y 坐标" }), refs.pyInput
      ]));
      shell.appendChild(controls);

      var results = element(doc, "section", { className: "lsc-results", hidden: true, "aria-labelledby": uid + "-results-title" });
      refs.results = results;
      results.appendChild(element(doc, "h4", { id: uid + "-results-title", text: "揭示后的证据账本" }));
      refs.summary = element(doc, "p", { className: "lsc-interpretation", "aria-live": "polite" });
      results.appendChild(refs.summary);
      refs.metrics = element(doc, "div", { className: "lsc-metrics" });
      results.appendChild(refs.metrics);
      var grid = element(doc, "div", { className: "lsc-grid" });
      refs.chart = element(doc, "div");
      grid.appendChild(refs.chart);
      var ledger = element(doc, "div", { className: "lsc-ledger", tabindex:"0", role:"region", "aria-label":"系数与关系账本，可横向滚动" });
      var table = element(doc, "table", { "aria-label": "向量列与坐标账本" });
      table.appendChild(element(doc, "caption", { text: "当前列向量、对象身份与目标坐标" }));
      table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
        element(doc, "th", { scope: "col", text: "对象" }),
        element(doc, "th", { scope: "col", text: "坐标记录" }),
        element(doc, "th", { scope: "col", text: "矩阵角色" }),
        element(doc, "th", { scope: "col", text: "读法" })
      ])));
      refs.ledgerBody = element(doc, "tbody");
      table.appendChild(refs.ledgerBody);
      ledger.appendChild(table);
      grid.appendChild(ledger);
      results.appendChild(grid);
      refs.boundary = element(doc, "p", { className: "lsc-boundary" });
      results.appendChild(refs.boundary);
      shell.appendChild(results);
      root.classList.add("lsc-lab");
      root.replaceChildren(shell);

      function render() {
        controls.hidden = !state.revealed;
        results.hidden = !state.revealed;
        renderPrediction(refs);
        if (state.revealed) renderResults(refs);
      }

      refs.render=render;
      reveal.addEventListener("click", function () {
        var answers = { span: "no-span", redundancy: "span-dependent", coordinates: "coordinates-change" };
        var keys = ["span", "redundancy", "coordinates"];
        var missing = keys.filter(function (key) { return state.predictions[key] === null; });
        if (missing.length) {
          refs.feedback.textContent = "还缺少 " + missing.length + " 个预测。";
          refs.feedback.className = "lsc-feedback lsc-warn";
          return;
        }
        state.revealed = true;
        render();
        var hits = keys.filter(function (key) { return state.predictions[key] === answers[key]; }).length;
        refs.feedback.textContent = "已揭示：" + hits + "/3 个预测命中；列秩只证明当前列组的结论。";
        refs.feedback.className = "lsc-feedback " + (hits === 3 ? "lsc-pass" : "lsc-warn");
        if (api && typeof api.announce === "function") api.announce(root, refs.feedback.textContent);
      });
      reset.addEventListener("click", function () {
        state = {
          presetId: DEFAULTS.presetId,
          t: DEFAULTS.t,
          px: DEFAULTS.px,
          py: DEFAULTS.py,
          revealed: false,
          predictions: { span: null, redundancy: null, coordinates: null }
        };
        refs.state = state;
        render();
        refs.span[0].node.focus();
      });
      refs.presetSelect.addEventListener("change", function () {
        state.presetId = refs.presetSelect.value;
        if (state.revealed) renderResults(refs);
      });
      refs.tInput.addEventListener("input", function () {
        state.t = Number(refs.tInput.value);
        if (state.revealed) renderResults(refs);
      });
      function targetChanged(key,input){
        var value=input.valueAsNumber;
        if(!finite(value)||value< -8||value>8){input.value=String(state[key]);refs.feedback.textContent="目标坐标须为 −8 到 8 的有限数；已保留上次有效值。";refs.feedback.className="lsc-feedback lsc-warn";return;}
        state[key]=value;refs.feedback.textContent="目标已更新，查看是否有解与是否唯一。";refs.feedback.className="lsc-feedback";if(state.revealed)renderResults(refs);
      }
      refs.pxInput.addEventListener("change",function(){targetChanged("px",refs.pxInput);});
      refs.pyInput.addEventListener("change",function(){targetChanged("py",refs.pyInput);});
      render();
    }

    function selfTest() {
      var checks = 0;
      function assert(condition, message) {
        checks += 1;
        if (!condition) throw new Error(message);
      }
      function close(actual, expected, tolerance, message) {
        checks += 1;
        if (!finite(actual) || Math.abs(actual - expected) > tolerance) {
          throw new Error(message + ": " + actual + " vs " + expected);
        }
      }

      assert(PRESETS.length === 3, "preset count");
      var regular = analyze({ presetId: "parameter", t: 0, px: 3, py: 2 });
      assert(regular.rank === 2, "parameter rank at t=0");
      assert(regular.independent && regular.spans && regular.basis, "parameter basis at t=0");
      close(determinant2(regular.vectors[0], regular.vectors[1]), -2, 1e-12, "parameter determinant");
      close(regular.coordinates[0], 2, 1e-12, "target first coordinate");
      close(regular.coordinates[1], 0.5, 1e-12, "target second coordinate");

      var singular = analyze({ presetId: "parameter", t: 2 });
      assert(singular.rank === 1, "parameter rank at singular t");
      assert(!singular.independent && !singular.spans && !singular.basis, "singular status");
      assert(singular.coordinates === null, "singular coordinates rejected");

      var redundant = analyze({ presetId: "redundant", t: 2 });
      assert(redundant.rank === 2 && redundant.spans, "redundant set spans");
      assert(!redundant.independent && !redundant.basis, "redundant set is not a basis");
      assert(redundant.nullity === 1, "redundant nullity");

      var collinear = analyze({ presetId: "collinear", t: -2 });
      assert(collinear.rank === 1 && !collinear.spans, "collinear span");
      var rejected = false;
      try { analyze({ presetId: "missing" }); } catch (error) { rejected = true; }
      assert(rejected, "unknown preset rejected");
      rejected = false;
      try { analyze({ presetId: "parameter", t: NaN, px: 1, py: 1 }); } catch (error) { rejected = error instanceof RangeError; }
      assert(rejected, "nonfinite coordinate parameter rejected");
      return { checks: checks, presets: PRESETS.length };
    }

    return {
      DEFAULTS: DEFAULTS,
      PRESETS: PRESETS,
      matrixRank: matrixRank,
      determinant2: determinant2,
      solve2: solve2,
      analyze: analyze,
      formatNumber: formatNumber,
      mount: mount,
      selfTest: selfTest
    };
  }
);

(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("frenet-frame", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("frenet-frame self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("frenet-frame self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "frenet-frame-lab-styles";
  var INSTANCE = 0;

  var PRESETS = [
    {
      id: "line",
      label: "直线",
      note: "正则但 κ=0：切向量存在，主法向量与副法向量没有 Frenet 定义。",
      parameter: 0.8,
      minimum: -2,
      maximum: 2,
      step: 0.05
    },
    {
      id: "circle",
      label: "圆",
      note: "半径 R=2；同点改变参数速率会改变 speed，κ=1/R、τ=0 不变；固定 t 时到达的位置也可能改变。",
      parameter: 0.8,
      minimum: -3.2,
      maximum: 3.2,
      step: 0.05
    },
    {
      id: "helix",
      label: "圆柱螺旋线",
      note: "a=2,b=1；κ=2/5、τ=1/5 同时非零，展示真正三维扭转。",
      parameter: 0.8,
      minimum: -3.2,
      maximum: 3.2,
      step: 0.05
    },
    {
      id: "inflection",
      label: "拐点三次曲线",
      note: "r(t)=(t,t³,0) 在 t=0 处正则但 κ=0；这是 N 失败的结构性边界。",
      parameter: 0.8,
      minimum: -1.25,
      maximum: 1.25,
      step: 0.05
    }
  ];

  var STYLE_TEXT = [
    ".ff-lab .ff-frame:focus-visible,.ff-lab .ff-ledger-wrap:focus-visible{outline:3px solid var(--accent);outline-offset:2px}.ff-lab select{min-height:44px;width:100%;font:inherit;background:var(--bg);color:var(--fg);border:1px solid var(--border);border-radius:6px}",
    ".ff-lab{max-width:100%;min-width:0;color:var(--fg,#20252b);line-height:1.55;overflow-wrap:anywhere}",
    ".ff-lab *,.ff-lab *::before,.ff-lab *::after{box-sizing:border-box}.ff-lab [hidden]{display:none!important}",
    ".ff-lab h3,.ff-lab h4{margin:0;color:var(--fg,#20252b);letter-spacing:0}.ff-lab h3{font-size:1.14rem}.ff-lab h4{font-size:1rem}.ff-lab p{margin:8px 0}",
    ".ff-lab .ff-note,.ff-lab .ff-feedback,.ff-lab .ff-status{color:var(--fg-soft,var(--muted,#5d6873));font-size:13px;line-height:1.65}",
    ".ff-lab button,.ff-lab input{font:inherit}.ff-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--bg,#fff);color:var(--fg,#20252b);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.ff-lab button:hover{border-color:var(--accent,#1769aa)}.ff-lab button:focus-visible,.ff-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.ff-lab button[aria-pressed=true],.ff-lab button.ff-primary{border-color:var(--accent,#1769aa);background:var(--accent,#1769aa);color:var(--bg,#fff);font-weight:750}.ff-lab button:disabled{opacity:.55;cursor:not-allowed}",
    ".ff-lab .ff-presets{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:10px 0}.ff-lab .ff-presets button{font-size:12px}",
    ".ff-lab .ff-controls{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;margin:12px 0}.ff-lab .ff-control{display:grid;gap:4px;min-width:0}.ff-lab .ff-control label{color:var(--fg-soft,var(--muted,#5d6873));font-size:12.5px;font-weight:700}.ff-lab .ff-control output{color:var(--accent,#1769aa);font-variant-numeric:tabular-nums}.ff-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent,#1769aa)}",
    ".ff-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#c8cdd3)}.ff-lab legend{max-width:100%;padding:0 4px;color:var(--fg,#20252b);font-size:13px;font-weight:750;line-height:1.5}.ff-lab .ff-choice-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.ff-lab .ff-choice-grid button{font-size:12px}",
    ".ff-lab .ff-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--cl-gold,#9a6b12);background:var(--block-bg,var(--bg,#fff))}.ff-lab .ff-prediction-title{display:block;margin-bottom:8px;font-size:13px}.ff-lab .ff-question{margin:10px 0}.ff-lab .ff-question legend{margin-bottom:6px}.ff-lab .ff-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.ff-lab .ff-pass{color:var(--cl-green,#2f7547)}.ff-lab .ff-warn{color:var(--cl-red,#b43d32)}.ff-lab .ff-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.ff-lab .ff-actions>*{flex:1 1 170px}",
    ".ff-lab .ff-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#c8cdd3)}.ff-lab .ff-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}.ff-lab .ff-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#c8cdd3);background:var(--block-bg,var(--bg,#fff))}.ff-lab .ff-metric:nth-child(4n+1){border-color:var(--cl-blue,#2c6aa0)}.ff-lab .ff-metric:nth-child(4n+2){border-color:var(--cl-green,#2f7547)}.ff-lab .ff-metric:nth-child(4n+3){border-color:var(--cl-gold,#9a6b12)}.ff-lab .ff-metric:nth-child(4n){border-color:var(--cl-red,#b43d32)}.ff-lab .ff-metric span{display:block;color:var(--fg-soft,var(--muted,#5d6873));font-size:11px;line-height:1.4}.ff-lab .ff-metric strong{display:block;margin-top:3px;font-size:13px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".ff-lab .ff-stage{min-width:0;padding:8px;border:1px solid var(--border,#c8cdd3);border-radius:6px;background:var(--block-bg,var(--bg,#fff))}.ff-lab .ff-frame{max-width:100%;overflow-x:auto}.ff-lab .ff-svg{display:block;width:100%;min-width:760px;max-width:none;height:auto;color:var(--fg,#20252b)}.ff-lab .ff-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.ff-lab .ff-svg .ff-grid{stroke:currentColor;stroke-opacity:.14;stroke-width:1}.ff-lab .ff-svg .ff-axis{stroke:currentColor;stroke-opacity:.5;stroke-width:1.1}.ff-lab .ff-svg .ff-curve{fill:none;stroke:var(--cl-blue,#2c6aa0);stroke-width:2.5}.ff-lab .ff-svg .ff-point{fill:var(--cl-red,#b43d32);stroke:var(--bg,#fff);stroke-width:2}.ff-lab .ff-svg .ff-tangent{stroke:var(--cl-blue,#2c6aa0);stroke-width:2.6}.ff-lab .ff-svg .ff-normal{stroke:var(--cl-green,#2f7547);stroke-width:2.6}.ff-lab .ff-svg .ff-binormal{stroke:var(--cl-gold,#9a6b12);stroke-width:2.6}.ff-lab .ff-svg .ff-undefined{stroke:var(--cl-red,#b43d32);stroke-width:1.8;stroke-dasharray:5 4}.ff-lab .ff-svg .ff-label{font-size:12px;font-weight:750}.ff-lab .ff-svg .ff-small{font-size:12px;fill:var(--fg-soft,var(--muted,#5d6873))}.ff-lab .ff-legend{display:flex;flex-wrap:wrap;gap:8px 14px;margin:7px 0 0;color:var(--fg-soft,var(--muted,#5d6873));font-size:12px}.ff-lab .ff-legend span{display:inline-flex;align-items:center;gap:5px}.ff-lab .ff-swatch{display:inline-block;width:18px;height:3px}.ff-lab .ff-swatch-t{background:var(--cl-blue,#2c6aa0)}.ff-lab .ff-swatch-n{background:var(--cl-green,#2f7547)}.ff-lab .ff-swatch-b{background:var(--cl-gold,#9a6b12)}.ff-lab .ff-swatch-p{width:10px;height:10px;border-radius:50%;background:var(--cl-red,#b43d32)}",
    ".ff-lab .ff-ledger-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:12px}.ff-lab table{display:table;white-space:normal;width:100%;min-width:760px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.ff-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,var(--muted,#5d6873));font-size:12px}.ff-lab th,.ff-lab td{white-space:normal;overflow-wrap:anywhere;padding:7px 8px;border-bottom:1px solid var(--border,#c8cdd3);text-align:left;vertical-align:top}.ff-lab th{color:var(--fg-soft,var(--muted,#5d6873));font-size:11.5px}.ff-lab .ff-interpretation{margin-top:10px;padding:10px 12px;border-left:3px solid var(--cl-green,#2f7547);background:var(--block-bg,var(--bg,#fff));font-size:13px;line-height:1.65}",
    "@media(max-width:820px){.ff-lab .ff-presets{grid-template-columns:repeat(2,minmax(0,1fr))}.ff-lab .ff-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.ff-lab .ff-choice-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}",
    "@media(max-width:560px){.ff-lab .ff-controls{grid-template-columns:minmax(0,1fr)}.ff-lab .ff-choice-grid{grid-template-columns:minmax(0,1fr)}.ff-lab .ff-prediction{padding:10px}.ff-lab .ff-stage{padding:4px}}",
    "@media(max-width:420px){.ff-lab .ff-presets,.ff-lab .ff-metrics{grid-template-columns:minmax(0,1fr)}}",
    "@media(prefers-reduced-motion:reduce){html:has(.ff-lab){scroll-behavior:auto!important}.ff-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function close(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-9 : tolerance);
  }

  function vector(x, y, z) {
    return [x, y, z];
  }

  function add(a, b) {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  function scale(a, factor) {
    return [a[0] * factor, a[1] * factor, a[2] * factor];
  }

  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }

  function norm(a) {
    return Math.hypot(a[0],a[1],a[2]);
  }

  function presetById(id){
    if(id===undefined)id="helix";
    var found=PRESETS.find(function(p){return p.id===id;});
    if(!found)throw new Error("unknown curve: "+id);return found;
  }
  PRESETS.forEach(function(p){Object.freeze(p);});Object.freeze(PRESETS);
  function normalizeRate(value){
    if(value===undefined)return 1;
    if(!finite(value)||Math.abs(value)<.1||Math.abs(value)>5)throw new Error("rate must be a number with 0.1 ≤ |rate| ≤ 5");
    return value;
  }
  function checkedParameter(t){
    if(!finite(t)||Math.abs(t)>100)throw new Error("parameter must be a number in [-100,100]");return t;
  }
  function inflectionArcReport(u){
    checkedParameter(u);if(u===0)return {value:0,errorEstimate:0,evaluations:0,converged:true};
    var end=Math.abs(u),evaluations=0,converged=true;
    function f(z){evaluations++;return Math.hypot(1,3*(end*z)*(end*z));}
    function sim(a,b,fa,fm,fb){return (b-a)*(fa+4*fm+fb)/6;}
    var a=0,b=1,fa=f(a),fb=f(b),fm=f(.5),whole=sim(a,b,fa,fm,fb),tol=1e-11*Math.max(1,Math.abs(whole));
    function visit(a,b,fa,fm,fb,S,tolerance,depth){
      var mid=(a+b)/2,fl=f((a+mid)/2),fr=f((mid+b)/2),L=sim(a,mid,fa,fl,fm),R=sim(mid,b,fm,fr,fb),delta=L+R-S,err=Math.abs(delta)/15;
      if(err<=tolerance||depth===0){if(depth===0&&err>tolerance)converged=false;return {value:L+R+delta/15,error:err};}
      var left=visit(a,mid,fa,fl,fm,L,tolerance/2,depth-1),right=visit(mid,b,fm,fr,fb,R,tolerance/2,depth-1);
      return {value:left.value+right.value,error:left.error+right.error};
    }
    var answer=visit(a,b,fa,fm,fb,whole,tol,20);
    return {value:u*answer.value,errorEstimate:end*answer.error,evaluations:evaluations,converged:converged};
  }
  function signedInflectionArcLength(u){return inflectionArcReport(u).value;}
  function baseKinematics(id,parameter,needArc){
    presetById(id);var u=checkedParameter(parameter),s=Math.sin(u),c=Math.cos(u);
    if(id==="line")return {point:[u,0,0],first:[1,0,0],second:[0,0,0],third:[0,0,0],arcLength:u,arcLengthFormula:"s(u)=u",arcError:0};
    if(id==="circle"||id==="helix"){
      var b=id==="helix"?1:0;
      return {point:[2*c,2*s,b*u],first:[-2*s,2*c,b],second:[-2*c,-2*s,0],third:[2*s,-2*c,0],
        arcLength:Math.hypot(2,b)*u,arcLengthFormula:b?"s(u)=√5 u":"s(u)=2u",arcError:0};
    }
    var arc=needArc===false?{value:null,errorEstimate:null,converged:true}:inflectionArcReport(u);
    return {point:[u,u*u*u,0],first:[1,3*u*u,0],second:[0,6*u,0],third:[0,6,0],
      arcLength:arc.value,arcLengthFormula:"s(u)=∫₀ᵘ √(1+9q⁴)dq",arcError:arc.errorEstimate,arcConverged:arc.converged};
  }
  function evaluateCurve(id,parameter,speedScale){
    var rate=normalizeRate(speedScale),t=checkedParameter(parameter),u=rate*t;
    if(!finite(u)||Math.abs(u)>100||(u===0&&t!==0))throw new Error("transformed parameter must be representable in [-100,100]");
    var base=baseKinematics(id,u),direction=Math.sign(rate),baseSpeed=norm(base.first),first=scale(base.first,rate),second=scale(base.second,rate*rate),third=scale(base.third,rate*rate*rate);
    var tangent=scale(base.first,direction/baseSpeed),curvature=id==="line"?0:id==="circle"?.5:id==="helix"?.4:6*Math.abs(u)/Math.pow(Math.hypot(1,3*u*u),3);
    // These analytic models know the exact zero set; a small nonzero curvature
    // must not be reclassified as an undefined Frenet frame by an EPS cutoff.
    var defined=id!=="line"&&(id!=="inflection"||u!==0),normal=null,binormal=null,torsion=null;
    if(defined){
      normal=id==="inflection"?scale([-3*u*u,1,0],Math.sign(u)/Math.hypot(1,3*u*u)):[-Math.cos(u),-Math.sin(u),0];
      binormal=cross(tangent,normal);torsion=id==="helix"?.2:0;
    }
    return {id:id,parameter:t,baseParameter:u,speedScale:rate,point:base.point,firstDerivative:first,secondDerivative:second,thirdDerivative:third,
      speed:Math.abs(rate)*baseSpeed,arcLength:direction*base.arcLength,arcLengthError:base.arcError||0,arcLengthConverged:base.arcConverged!==false,
      arcLengthFormula:id==="inflection"?"sλ(t)=sgn(λ)∫₀^(λt)√(1+9q⁴)dq；自适应积分近似":"sλ(t)="+(id==="line"?"":id==="circle"?"2":"√5")+"|λ|t",
      curvature:curvature,signedCurvature:id==="helix"?null:direction*(id==="inflection"?Math.sign(u):1)*curvature,
      torsion:torsion,tangent:tangent,normal:normal,binormal:binormal,regular:true,frenetDefined:defined,
      normalStatus:defined?"κ>0，N=(dT/ds)/κ 唯一确定":"N 未定义：κ=0，不能把 0/0 当成向量",
      torsionStatus:defined?"τ 在本点已定义":"τ 未定义：r′×r″=0",
      divisionStatus:defined?"允许除以非零 κ":"拒绝除以 κ=0"};
  }
  function parameterizationReport(id,parameter,speedScale){
    var rate=normalizeRate(speedScale),changed=evaluateCurve(id,parameter,rate),base=evaluateCurve(id,changed.baseParameter,1),sameClock=evaluateCurve(id,parameter,1);
    return {id:id,parameter:parameter,speedScale:rate,base:base,changed:changed,sameClock:sameClock,
      samePoint:base.point.every(function(x,i){return x===changed.point[i];}),invariantsValid:base.frenetDefined,
      curvatureInvariant:close(base.curvature,changed.curvature,1e-12),
      torsionInvariant:base.frenetDefined?close(base.torsion,changed.torsion,1e-12):null,
      speedRatio:changed.speed/base.speed,arcLengthRatio:base.arcLength===0?null:changed.arcLength/base.arcLength,
      statement:"同一几何点：基曲线 u=λt="+formatNumber(changed.baseParameter,5)+"，重参数曲线 t="+formatNumber(parameter,5)+"；κ 包括零值都保持。"+
       (base.frenetDefined?"τ 也保持；λ<0 时 T、B 反向，N 不变。":"本点 N、B、τ 未定义，不能把未定义值说成 τ=0。")};
  }
  function curveSample(id,minimum,maximum,count,speedScale){
    checkedParameter(minimum);checkedParameter(maximum);
    if(minimum>maximum)throw new Error("sample interval must be ordered");
    if(count===undefined)count=120;
    if(!Number.isInteger(count)||count<16||count>2000)throw new Error("sample count must be an integer in [16,2000]");
    var rate=normalizeRate(speedScale),points=[];
    for(var i=0;i<=count;i++)points.push(baseKinematics(id,rate*(minimum+(maximum-minimum)*i/count),false).point);
    return points;
  }

  function finiteVector(value) {
    return Array.isArray(value) && value.length === 3 && value.every(finite);
  }

  function formatNumber(value, digits) {
    if (value === null || value === undefined || !finite(value)) return "未定义";
    var places = digits === undefined ? 4 : digits;
    if(value===0)return "0";
    if(Math.abs(value)<Math.pow(10,-places)||Math.abs(value)>=1e7)return value.toExponential(3);
    var text = value.toFixed(places);
    return text.replace(/0+$/, "").replace(/\.$/, "").replace(/^-0$/, "0");
  }

  function formatVector(value) {
    return value ? "(" + value.map(function (entry) { return formatNumber(entry, 3); }).join(", ") + ")" : "未定义";
  }

  function setAttributes(node, attributes) {
    Object.keys(attributes || {}).forEach(function (key) {
      var value = attributes[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function element(doc, tag, attributes, children) {
    var node = setAttributes(doc.createElement(tag), attributes);
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function svgElement(doc, tag, attributes, children) {
    var node = setAttributes(doc.createElementNS(SVG_NS, tag), attributes);
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function installStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = element(doc, "style", { id: STYLE_ID }, STYLE_TEXT);
    (doc.head || doc.documentElement).appendChild(style);
  }

  function projection(p){return [(p[0]-p[1])/Math.SQRT2,(p[0]+p[1]-2*p[2])/Math.sqrt(6)];}
  function makeProjection(points,box){
    box=box||{x:35,y:65,width:440,height:265};
    var pp=points.map(projection),xs=pp.map(p=>p[0]),ys=pp.map(p=>p[1]),loX=Math.min(...xs),hiX=Math.max(...xs),loY=Math.min(...ys),hiY=Math.max(...ys);
    var scale=Math.min(box.width/Math.max(hiX-loX,1),box.height/Math.max(hiY-loY,1)),cx=(loX+hiX)/2,cy=(loY+hiY)/2;
    var map=function(p){var q=projection(p);return [box.x+box.width/2+scale*(q[0]-cx),box.y+box.height/2-scale*(q[1]-cy)];};
    map.scale=scale;return map;
  }
  function pointPath(points,map){return points.map(function(p,i){var q=map(p);return (i?"L":"M")+q[0].toFixed(7)+" "+q[1].toFixed(7);}).join(" ");}
  function curveSvg(doc,data,preset,id){
    var samples=curveSample(data.id,preset.minimum,preset.maximum,240,data.speedScale),vectors=[data.tangent,data.normal,data.binormal],length=.6;
    var bounds=samples.concat([data.point]);vectors.filter(Boolean).forEach(v=>bounds.push(add(data.point,scale(v,length))));
    var map=makeProjection(bounds),svg=svgElement(doc,"svg",{class:"ff-svg",viewBox:"0 0 760 420",role:"img","aria-labelledby":id+"-title "+id+"-desc"});
    svg.appendChild(svgElement(doc,"title",{id:id+"-title"},preset.label+"：等比例正投影与局部单位标架"));
    svg.appendChild(svgElement(doc,"desc",{id:id+"-desc"},"左图是曲线和同一点的标架，箭头世界长度0.6。右图把单位向量移到原点，放大查看。两图均使用正交单位投影行和相同横纵尺度；投影不保留三维向量夹角。"));
    function text(x,y,s,cls,anchor){svg.appendChild(svgElement(doc,"text",{x:x,y:y,class:cls||"ff-label","text-anchor":anchor||"start"},s));}
    function line(a,b,cls,extra){svg.appendChild(svgElement(doc,"line",Object.assign({x1:a[0],y1:a[1],x2:b[0],y2:b[1],class:cls},extra||{})));}
    var defs=svgElement(doc,"defs");
    ["tangent","normal","binormal"].forEach(function(name){
      var color=name==="tangent"?"var(--cl-blue,#2c6aa0)":name==="normal"?"var(--cl-green,#2f7547)":"var(--cl-gold,#9a6b12)";
      var marker=svgElement(doc,"marker",{id:id+"-"+name,markerWidth:7,markerHeight:7,refX:6,refY:3.5,orient:"auto",markerUnits:"userSpaceOnUse"});
      marker.appendChild(svgElement(doc,"path",{d:"M0 0 L7 3.5 L0 7z",fill:color}));defs.appendChild(marker);
    });svg.appendChild(defs);
    text(30,29,"曲线与当前点（箭头长度 0.6）");text(510,29,"单位标架单独放大");
    svg.appendChild(svgElement(doc,"path",{d:pointPath(samples,map),class:"ff-curve","data-curve-sample":data.id}));
    var current=map(data.point);
    svg.appendChild(svgElement(doc,"circle",{cx:current[0],cy:current[1],r:5,class:"ff-point","data-probe":""}));
    // Both displays use exactly the same orthographic projection. The right
    // display has its own uniform scale, openly labelled, with no curve shift.
    var local=function(v){var q=projection(v);return [620+95*q[0],205-95*q[1]];};
    [[1,0,0],[0,1,0],[0,0,1]].forEach(function(v,i){var q=local(v);line(local([0,0,0]),q,"ff-axis");text(q[0]+8,q[1]+7,["x","y","z"][i],"ff-small");});
    ["tangent","normal","binormal"].forEach(function(name,i){
      var v=vectors[i];if(!v)return;
      var end=map(add(data.point,scale(v,length)));
      line(current,end,"ff-"+name,{"marker-end":"url(#"+id+"-"+name+")","data-world-vector":name});
      var q=local(v);line(local([0,0,0]),q,"ff-"+name,{"marker-end":"url(#"+id+"-"+name+")","data-unit-vector":name});
      text(q[0]+8,q[1]-9,["T","N","B"][i]);
    });
    if(!data.frenetDefined){text(510,345,"κ=0：N、B 未定义");text(510,366,"T 仍是合法单位切向量","ff-small");}
    text(30,366,"u=λt="+formatNumber(data.baseParameter,4)+"；每世界单位 "+formatNumber(map.scale,2)+" 像素","ff-small");
    text(30,392,"两图均为等比例正投影；三维直角在屏幕上不必仍是直角。","ff-small");
    return svg;
  }

  function metricBlock(doc, label, value) {
    return element(doc, "div", { className: "ff-metric" }, [
      element(doc, "span", {}, label),
      element(doc, "strong", {}, value)
    ]);
  }

  function vectorQuestion(doc, key, label, options, state, onChange) {
    var fieldset = element(doc, "fieldset", { className: "ff-question", "data-answer-key": key });
    fieldset.appendChild(element(doc, "legend", {}, label));
    var grid = element(doc, "div", { className: "ff-choice-grid" });
    options.forEach(function (option) {
      var button = element(doc, "button", {
        type: "button",
        "data-answer-value": option.value,
        "aria-pressed": state.answers[key] === option.value ? "true" : "false"
      }, option.label);
      button.addEventListener("click", function () {
        state.answers[key] = option.value;
        Array.prototype.forEach.call(grid.children, function (child) {
          child.setAttribute("aria-pressed", child === button ? "true" : "false");
        });
        onChange();
      });
      grid.appendChild(button);
    });
    fieldset.appendChild(grid);
    return fieldset;
  }

  function expectedAnswers(data) {
    return {
      regular: data.regular ? "yes" : "no",
      invariant: "yes",
      torsion: data.torsion !== null && data.torsion !== 0 ? "nonzero" : data.torsion === null ? "undefined" : "zero",
      normal: data.frenetDefined ? "defined" : "undefined"
    };
  }

  function ledgerRows(data,report){
    return [
      ["对应参数","u="+formatNumber(report.base.baseParameter,6)+"；t="+formatNumber(data.parameter,6),"基曲线 r(u) 与重参数曲线 r(λt) 是同一个几何点"],
      ["speed |r′|",formatNumber(data.speed,6),"同点基准速度 "+formatNumber(report.base.speed,6)+"；比值 |λ|="+formatNumber(report.speedRatio,6)],
      ["有向弧长 s",formatNumber(data.arcLength,6),data.arcLengthFormula],
      ["积分误差估计",data.id==="inflection"?formatNumber(data.arcLengthError,3):"解析弧长",data.id==="inflection"?"自适应 Simpson 估计，不是严格误差上界；"+(data.arcLengthConverged?"已满足停止条件":"未达到停止条件"):"当前模型有解析弧长公式，不需要数值积分误差估计。"],
      ["κ",formatNumber(data.curvature,6),data.frenetDefined?"非零，N 可定义":"精确为0；曲率本身仍有定义且重参数化不变"],
      ["τ",formatNumber(data.torsion,6),data.torsionStatus],
      ["T",formatVector(data.tangent),"与运动方向一致，λ<0 时反向"],
      ["N",formatVector(data.normal),data.normalStatus],
      ["B",formatVector(data.binormal),data.frenetDefined?"T×N；λ<0 时反向":"随 N 一起未定义"],
      ["同点不变量","κ "+(report.curvatureInvariant?"保持":"不符")+"；τ "+(report.torsionInvariant===null?"未定义":report.torsionInvariant?"保持":"不符"),report.statement],
      ["若误用同一时刻 t","基曲线 r(t) 的 κ="+formatNumber(report.sameClock.curvature,6),"它对应 u=t，通常不是当前 u=λt 的点；不同点的曲率不必相同"]
    ];
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    var state = {
      id: "helix",
      parameter: presetById("helix").parameter,
      speedScale: 1,
      answers: { regular: null, invariant: null, torsion: null, normal: null },
      revealed: false
    };
    var serial = INSTANCE += 1;
    var shell = element(doc, "div", { className: "ff-lab" });
    shell.appendChild(element(doc, "h3", {}, "Frenet 标架：先判断定义域，再读三本几何账"));
    shell.appendChild(element(doc, "p", { className: "ff-note" }, "四个解析曲线模型。先选 t 与非零 λ，再在同一几何点 u=λt 对照：κ 包括零值都不变，τ 在有定义处也不变；λ<0 时 T、B 反向。拐点曲线的弧长使用数值积分并单列误差估计。"));

    var presets = element(doc, "div", { className: "ff-presets" });
    PRESETS.forEach(function (preset) {
      var button = element(doc, "button", { type: "button", "aria-pressed": state.id === preset.id ? "true" : "false" }, preset.label);
      button.addEventListener("click", function () {
        state.id = preset.id;
        state.parameter = preset.parameter;
        state.speedScale = 1;
        state.answers = { regular: null, invariant: null, torsion: null, normal: null };
        state.revealed = false;
        render();
      });
      presets.appendChild(button);
    });
    shell.appendChild(presets);

    var controls = element(doc, "div", { className: "ff-controls" });
    var parameterControl = element(doc, "div", { className: "ff-control" });
    var parameterLabel = element(doc, "label", {}, "参数 t = ");
    var parameterOutput = element(doc, "output", {});
    var parameterInput = element(doc, "input", { type: "range", "aria-label": "曲线参数 t" });
    parameterLabel.appendChild(parameterOutput);
    parameterControl.appendChild(parameterLabel);
    parameterControl.appendChild(parameterInput);
    controls.appendChild(parameterControl);
    var rateControl = element(doc, "div", { className: "ff-control" });
    var rateLabel = element(doc, "label", {}, "参数速率 λ = ");
    var rateOutput = element(doc, "output", {});
    var rateInput = element(doc, "input", { type: "range", min: "0.5", max: "3", step: "0.1", value: "1", "aria-label": "参数速率大小" });
    rateLabel.appendChild(rateOutput);
    rateControl.appendChild(rateLabel);
    rateControl.appendChild(rateInput);
    var directionInput=element(doc,"select",{"aria-label":"参数方向"},[element(doc,"option",{value:"1"},"顺向 λ>0"),element(doc,"option",{value:"-1"},"反向 λ<0")]);
    rateControl.appendChild(directionInput);
    controls.appendChild(rateControl);
    shell.appendChild(controls);

    var prediction = element(doc, "section", { className: "ff-prediction" });
    prediction.appendChild(element(doc, "strong", { className: "ff-prediction-title" }, "预测门：四项都回答后才揭示 Frenet 账本"));
    var questionNodes = [];
    questionNodes.push(vectorQuestion(doc, "regular", "1. 当前参数点的曲线是否正则？", [
      { value: "yes", label: "是，|r′|>0" }, { value: "no", label: "否，速度为 0" }
    ], state, predictionChanged));
    questionNodes.push(vectorQuestion(doc, "invariant", "2. 在同一几何点，正则重参数化是否保持 κ（包括零值）？", [
      { value: "yes", label: "保持" }, { value: "no", label: "速率会改变曲率" }
    ], state, predictionChanged));
    questionNodes.push(vectorQuestion(doc, "torsion", "3. 当前曲线的 τ 应读作？", [
      { value: "nonzero", label: "非零" }, { value: "zero", label: "0" }, { value: "undefined", label: "未定义" }
    ], state, predictionChanged));
    questionNodes.push(vectorQuestion(doc, "normal", "4. 当前点的 Frenet 主法向 N 如何确定？", [
      { value: "defined", label: "κ>0，由导数唯一确定" }, { value: "undefined", label: "未定义，拒绝除零" }
    ], state, predictionChanged));
    questionNodes.forEach(function (node) { prediction.appendChild(node); });
    var actions = element(doc, "div", { className: "ff-actions" });
    var reveal = element(doc, "button", { type: "button", className: "ff-primary" }, "揭示账本");
    var reset = element(doc, "button", { type: "button" }, "重置本曲线");
    var feedback = element(doc, "p", { className: "ff-feedback", "aria-live": "polite", "aria-atomic": "true" }, "");
    reveal.addEventListener("click", function () {
      var data = evaluateCurve(state.id, state.parameter, state.speedScale);
      var keys = Object.keys(state.answers);
      if (keys.some(function (key) { return state.answers[key] === null; })) {
        feedback.className = "ff-feedback ff-warn";
        feedback.textContent = "还有预测没有作答。";
        return;
      }
      var expected = expectedAnswers(data);
      var correct = keys.filter(function (key) { return expected[key] === state.answers[key]; }).length;
      state.revealed = true;
      feedback.className = "ff-feedback " + (correct === keys.length ? "ff-pass" : "ff-warn");
      feedback.textContent = "已揭示：命中 " + correct + "/" + keys.length + "；" + data.normalStatus + "。";
      if (api && typeof api.announce === "function") api.announce(root, feedback.textContent);
      render();
      results.focus();
    });
    reset.addEventListener("click", function () {
      var preset = presetById(state.id);
      state.parameter = preset.parameter;
      state.speedScale = 1;
      state.answers = { regular: null, invariant: null, torsion: null, normal: null };
      state.revealed = false;
      render();
      questionNodes[0].querySelector("button").focus();
    });
    actions.appendChild(reveal);
    actions.appendChild(reset);
    prediction.appendChild(actions);
    prediction.appendChild(feedback);
    shell.appendChild(prediction);

    var results = element(doc, "section", { className: "ff-results", hidden: true, tabindex:"-1", "aria-label":"Frenet 实验结果" });
    shell.appendChild(results);
    root.replaceChildren(shell);

    function resetGate(message) {
      state.answers = { regular: null, invariant: null, torsion: null, normal: null };
      state.revealed = false;
      feedback.className = "ff-feedback ff-warn";
      feedback.textContent = message;
      renderPrediction();
    }

    function predictionChanged(){state.revealed=false;results.hidden=true;feedback.textContent="预测已变更，请重新核对。";renderPrediction();}

    function renderPrediction() {
      reveal.disabled = Object.keys(state.answers).some(function (key) { return state.answers[key] === null; });
      questionNodes.forEach(function (fieldset) {
        var key = fieldset.getAttribute("data-answer-key");
        Array.prototype.forEach.call(fieldset.querySelectorAll("button"), function (button) {
          button.setAttribute("aria-pressed", state.answers[key] === button.getAttribute("data-answer-value") ? "true" : "false");
        });
      });
    }

    function render() {
      var preset = presetById(state.id);
      parameterInput.min = String(preset.minimum);
      parameterInput.max = String(preset.maximum);
      parameterInput.step = String(preset.step);
      parameterInput.value = String(state.parameter);
      parameterOutput.textContent = formatNumber(state.parameter, 3);
      rateInput.value = String(Math.abs(state.speedScale));
      directionInput.value=String(Math.sign(state.speedScale));
      rateOutput.textContent = formatNumber(state.speedScale, 1);
      Array.prototype.forEach.call(presets.children, function (button, index) {
        button.setAttribute("aria-pressed", PRESETS[index].id === state.id ? "true" : "false");
      });
      renderPrediction();
      if (!state.revealed) {
        results.hidden = true;
        if (!feedback.textContent || feedback.className.indexOf("ff-warn") < 0) feedback.textContent = "先完成四项预测。";
        return;
      }
      results.hidden = false;
      results.replaceChildren();
      var data = evaluateCurve(state.id, state.parameter, state.speedScale);
      var report = parameterizationReport(state.id, state.parameter, state.speedScale);
      results.appendChild(element(doc, "h4", {}, preset.label + "：精确几何账"));
      var metrics = element(doc, "div", { className: "ff-metrics" });
      metrics.appendChild(metricBlock(doc, "speed |r′|", formatNumber(data.speed, 5)));
      metrics.appendChild(metricBlock(doc, "弧长 s", formatNumber(data.arcLength, 5)));
      metrics.appendChild(metricBlock(doc, "曲率 κ", formatNumber(data.curvature, 5)));
      metrics.appendChild(metricBlock(doc, "挠率 τ", formatNumber(data.torsion, 5)));
      results.appendChild(metrics);
      var stageId = "ff-stage-" + serial;
      var stage = element(doc, "div", { className: "ff-stage" });
      stage.appendChild(element(doc,"div",{className:"ff-frame",role:"region",tabindex:"0","aria-label":"曲线与单位标架正投影图"},curveSvg(doc, data, preset, stageId)));
      stage.appendChild(element(doc, "div", { className: "ff-legend" }, [
        element(doc, "span", {}, [element(doc, "i", { className: "ff-swatch ff-swatch-t" }), "T 切向"]),
        element(doc, "span", {}, [element(doc, "i", { className: "ff-swatch ff-swatch-n" }), "N 主法向"]),
        element(doc, "span", {}, [element(doc, "i", { className: "ff-swatch ff-swatch-b" }), "B 副法向"]),
        element(doc, "span", {}, [element(doc, "i", { className: "ff-swatch ff-swatch-p" }), "当前点"])
      ]));
      results.appendChild(stage);
      var tableWrap = element(doc, "div", { className: "ff-ledger-wrap",role:"region",tabindex:"0","aria-label":"Frenet 定义与同点对照表" });
      var table = element(doc, "table", { "aria-label": "Frenet 几何账本" });
      table.appendChild(element(doc, "caption", {}, "导数、弧长与标架状态；未定义量保留为“未定义”。"));
      var head = element(doc, "tr");
      ["量", "当前值", "解释 / 边界"].forEach(function (value) {
        head.appendChild(element(doc, "th", { scope: "col" }, value));
      });
      table.appendChild(element(doc, "thead", {}, head));
      var body = element(doc, "tbody");
      ledgerRows(data, report).forEach(function (row) {
        body.appendChild(element(doc, "tr", {}, row.map(function (value) { return element(doc, "td", {}, value); })));
      });
      table.appendChild(body);
      tableWrap.appendChild(table);
      results.appendChild(tableWrap);
      results.appendChild(element(doc, "p", { className: "ff-interpretation" }, data.frenetDefined
        ? "这里的 N、B 来自真实除法与归一化；非零 λ 改变参数钟表；本表在 u=λt 的同一点检查几何不变量。"
        : "当前点正则但 κ=0。T 仍然存在，而 N=T′/κ 与 B=T×N 不存在；这不是数值精度问题，而是 Frenet 标架的定义域边界。"));
    }

    parameterInput.addEventListener("input", function () {
      state.parameter = Number(parameterInput.value);
      resetGate("参数改变；请重新作出四项预测。");
      render();
    });
    rateInput.addEventListener("input", function () {
      state.speedScale = normalizeRate(Number(rateInput.value)*Number(directionInput.value));
      resetGate("参数速度改变；请重新作出四项预测。");
      render();
    });
    directionInput.addEventListener("change",function(){state.speedScale=normalizeRate(Math.abs(state.speedScale)*Number(directionInput.value));resetGate("方向改变，请重新预测同一点的标架。");render();});
    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    var line = evaluateCurve("line", 2, 1);
    assert(line.regular, "line is regular");
    assert(close(line.speed, 1) && close(line.arcLength, 2), "line speed and arc length");
    assert(close(line.curvature, 0) && line.torsion === null, "line curvature/torsion boundary");
    assert(line.normal === null && line.binormal === null && line.divisionStatus.indexOf("拒绝") >= 0, "line Frenet normal must stay undefined");
    assert(close(line.tangent[0], 1) && close(line.tangent[1], 0), "line tangent");

    var circle = evaluateCurve("circle", 0.7, 1);
    assert(close(circle.speed, 2) && close(circle.arcLength, 1.4), "circle speed and arc length");
    assert(close(circle.curvature, 0.5) && close(circle.torsion, 0), "circle curvature/torsion");
    assert(circle.frenetDefined && finiteVector(circle.normal) && finiteVector(circle.binormal), "circle frame");
    var circleReparam = parameterizationReport("circle", 0.7, 2.5);
    assert(circleReparam.speedRatio === 2.5 && circleReparam.arcLengthRatio === 1, "circle speed/arc-length reparameterization");
    assert(circleReparam.curvatureInvariant && circleReparam.torsionInvariant, "circle invariants");

    var helix = evaluateCurve("helix", 0.4, 1);
    assert(close(helix.speed, Math.sqrt(5)) && close(helix.arcLength, 0.4 * Math.sqrt(5)), "helix speed and arc length");
    assert(close(helix.curvature, 2 / 5) && close(helix.torsion, 1 / 5), "helix exact invariants");
    assert(close(dot(helix.tangent, helix.normal), 0) && close(dot(helix.tangent, helix.binormal), 0), "helix orthogonality");
    assert(close(norm(helix.tangent), 1) && close(norm(helix.normal), 1) && close(norm(helix.binormal), 1), "helix unit frame");
    var helixReparam = parameterizationReport("helix", 0.4, 3);
    assert(helixReparam.curvatureInvariant && helixReparam.torsionInvariant, "helix reparameterization invariants");
    assert(close(helixReparam.changed.speed, 3 * Math.sqrt(5)), "helix speed changes with rate");

    var inflection = evaluateCurve("inflection", 0, 1);
    assert(inflection.regular && close(inflection.speed, 1), "inflection is regular at zero");
    assert(close(inflection.curvature, 0) && inflection.normal === null && inflection.binormal === null, "inflection normal failure at zero curvature");
    var positive = evaluateCurve("inflection", 0.5, 1);
    var negative = evaluateCurve("inflection", -0.5, 1);
    assert(positive.frenetDefined && negative.frenetDefined, "inflection frame away from zero");
    assert(positive.signedCurvature > 0 && negative.signedCurvature < 0, "inflection signed curvature changes sign");
    assert(close(positive.torsion, 0) && close(negative.torsion, 0), "planar inflection torsion away from zero");
    assert(parameterizationReport("line", 0.5, 2).invariantsValid === false, "line has no Frenet invariant claim");
    assert(parameterizationReport("inflection", 0, 2).invariantsValid === false, "inflection boundary has no Frenet invariant claim");
    assert(signedInflectionArcLength(0.5) > 0 && signedInflectionArcLength(-0.5) < 0, "inflection arc-length orientation");
    var rateSamples = curveSample("helix", -0.5, 0.5, 16, 2);
    assert(close(rateSamples[0][2], -1) && close(rateSamples[rateSamples.length - 1][2], 1), "plot samples apply rate");
    PRESETS.forEach(function (preset) {
      var sample = evaluateCurve(preset.id, preset.parameter, 1);
      assert(sample.regular && finite(sample.speed) && finite(sample.arcLength), preset.id + " preset finite");
    });
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    PRESETS: PRESETS,
    evaluateCurve: evaluateCurve,
    curvePoint: function (id, parameter) { return baseKinematics(id, parameter,false).point; },
    projection:projection,
    makeProjection:makeProjection,
    curveSvg:curveSvg,
    inflectionArcReport:inflectionArcReport,
    parameterizationReport: parameterizationReport,
    curveSample: curveSample,
    selfTest: selfTest,
    mount: mount
  };
});

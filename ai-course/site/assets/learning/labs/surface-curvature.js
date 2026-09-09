(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("surface-curvature", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("surface-curvature self-test: PASS (" + report.checks + " checks, " + report.surfaces + " surfaces)");
    } catch (error) {
      console.error("surface-curvature self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "surface-curvature-lab-styles";
  var INSTANCE = 0;

  var SURFACES = [
    {
      id: "plane",
      label: "平面",
      note: "两个主曲率都为 0：这是 K=0 的平面点。",
      u: 0.3,
      v: -0.2,
      uMin: -1,
      uMax: 1,
      step: 0.05
    },
    {
      id: "sphere",
      label: "球面",
      note: "这里取半径 R=2 的外向法向；按 II=⟨rᵢⱼ,n⟩ 约定，H 为负。",
      u: 0.25,
      v: 0.65,
      uMin: -1.05,
      uMax: 1.05,
      step: 0.05
    },
    {
      id: "cylinder",
      label: "圆柱",
      note: "一个主曲率为 0、另一个不为 0：这是 K=0 的抛物点。",
      u: 0.8,
      v: 0.4,
      uMin: -3.2,
      uMax: 3.2,
      step: 0.05
    },
    {
      id: "saddle",
      label: "鞍面",
      note: "原点附近 z=u²−v²；两条主方向反向弯，K<0。",
      u: 0,
      v: 0,
      uMin: -0.8,
      uMax: 0.8,
      step: 0.05
    }
  ];

  var STYLE_TEXT = [
    ".sc-lab .sc-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:12px 0}.sc-lab .sc-metric{padding:9px;border-top:2px solid var(--sc-blue);background:var(--bg)}.sc-lab .sc-metric span{display:block;font-size:12px}.sc-lab .sc-metric span+span{font-weight:700;font-size:15px}.sc-lab .sc-table-wrap{min-width:0;overflow-x:auto}.sc-lab table{display:table;white-space:normal;min-width:760px;width:100%;border-collapse:collapse;font-size:12px}.sc-lab th,.sc-lab td{white-space:normal;overflow-wrap:anywhere;padding:8px;border-bottom:1px solid var(--border);text-align:left}.sc-lab .sc-frame:focus-visible,.sc-lab .sc-table-wrap:focus-visible{outline:3px solid var(--accent);outline-offset:2px}.sc-lab .sc-direction{min-width:0;padding:12px;border:1px solid var(--border);margin:12px 0}",
    ".sc-lab{--sc-blue:var(--cl-blue,#315f9d);--sc-green:var(--cl-green,#39734d);--sc-gold:var(--cl-gold,#9b6a12);--sc-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".sc-lab *,.sc-lab *::before,.sc-lab *::after{box-sizing:border-box}.sc-lab [hidden]{display:none!important}.sc-lab h3,.sc-lab h4{margin:0;color:var(--fg);letter-spacing:0}.sc-lab h3{font-size:1.16rem}.sc-lab h4{margin-top:16px;font-size:1rem}.sc-lab p{margin:8px 0}.sc-lab .sc-note,.sc-lab .sc-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65}.sc-lab button,.sc-lab select,.sc-lab input{font:inherit;letter-spacing:0}.sc-lab button,.sc-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.sc-lab button:hover{border-color:var(--accent)}.sc-lab button:focus-visible,.sc-lab select:focus-visible,.sc-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.sc-lab button[aria-pressed=true],.sc-lab button.sc-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.sc-lab button:disabled{opacity:.55;cursor:not-allowed}",
    ".sc-lab .sc-presets{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:12px 0}.sc-lab .sc-presets button{font-size:12.5px}.sc-lab .sc-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:12px 0}.sc-lab .sc-control{display:grid;gap:5px;min-width:0}.sc-lab .sc-control label{color:var(--fg-soft);font-size:12.5px;font-weight:700}.sc-lab .sc-control output{color:var(--accent);font-variant-numeric:tabular-nums}.sc-lab .sc-control select{width:100%}.sc-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
    ".sc-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border)}.sc-lab legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}.sc-lab .sc-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.sc-lab .sc-options button{font-size:12px}.sc-lab .sc-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--sc-gold);background:var(--block-bg,var(--bg))}.sc-lab .sc-prediction-title{display:block;margin-bottom:7px;font-size:13px}.sc-lab .sc-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.sc-lab .sc-actions>*{flex:1 1 170px}.sc-lab .sc-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.sc-lab .sc-pass{color:var(--sc-green)}.sc-lab .sc-warn{color:var(--sc-red)}",
    ".sc-lab .sc-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.sc-lab .sc-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow-x:auto}.sc-lab .sc-svg{display:block;width:100%;min-width:760px;max-width:none;height:auto;color:var(--fg)}.sc-lab .sc-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.sc-lab .sc-svg .sc-grid{stroke:currentColor;stroke-opacity:.17;stroke-width:1}.sc-lab .sc-svg .sc-axis{stroke:currentColor;stroke-opacity:.55;stroke-width:1.2}.sc-lab .sc-svg .sc-shape{fill:var(--sc-blue);fill-opacity:.15;stroke:var(--sc-blue);stroke-width:3}.sc-lab .sc-svg .sc-kbar{fill:var(--sc-blue)}.sc-lab .sc-svg .sc-hbar{fill:var(--sc-red)}.sc-lab .sc-svg .sc-zero{stroke:currentColor;stroke-width:1.5}.sc-lab .sc-svg .sc-title{font-size:13px;font-weight:750}.sc-lab .sc-svg .sc-small{font-size:12px;fill:var(--fg-soft)!important}.sc-lab .sc-svg .sc-value{font-size:12px;font-weight:750}.sc-lab .sc-legend{display:flex;flex-wrap:wrap;gap:8px 16px;margin:7px 0 0;color:var(--fg-soft);font-size:12px}.sc-lab .sc-legend span{display:inline-flex;align-items:center;gap:5px}.sc-lab .sc-swatch{display:inline-block;width:18px;height:4px}.sc-lab .sc-swatch-k{background:var(--sc-blue)}.sc-lab .sc-swatch-h{background:var(--sc-red)}",
    "@media(max-width:820px){.sc-lab .sc-presets{grid-template-columns:repeat(2,minmax(0,1fr))}.sc-lab .sc-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.sc-lab .sc-options{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.sc-lab .sc-controls{grid-template-columns:minmax(0,1fr)}.sc-lab .sc-options{grid-template-columns:minmax(0,1fr)}.sc-lab .sc-prediction{padding:10px}.sc-lab .sc-frame{padding:4px}}@media(max-width:420px){.sc-lab .sc-presets{grid-template-columns:minmax(0,1fr)}}@media(prefers-reduced-motion:reduce){html:has(.sc-lab){scroll-behavior:auto!important}.sc-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function near(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance || 1e-8) * Math.max(1, Math.abs(left), Math.abs(right));
  }

  function vec(x, y, z) { return [x, y, z]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norm(a) { return Math.hypot(a[0],a[1],a[2]); }
  function scale(a, factor) { return [a[0] * factor, a[1] * factor, a[2] * factor]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }

  SURFACES.forEach(function(x){x.vMin=x.id==="sphere"?-3.2:x.id==="cylinder"?-2:-1;x.vMax=-x.vMin;Object.freeze(x);});Object.freeze(SURFACES);
  function surfaceById(id){
    if(id===undefined)id="plane";
    var model=SURFACES.find(function(x){return x.id===id;});
    if(!model)throw new Error("unknown surface: "+id);return model;
  }
  function parameter(value,fallback){
    if(value===undefined)value=fallback;
    if(!finite(value)||Math.abs(value)>100)throw new Error("surface parameters must be numbers in [-100,100]");
    return value;
  }

  function evaluateSurface(id, u, v, normalSign) {
    var model=surfaceById(id),name=model.id,uu=parameter(u,model.u),vv=parameter(v,model.v);
    var sign=normalSign===undefined?1:normalSign;
    if(sign!==1&&sign!==-1)throw new Error("normal sign must be exactly +1 or -1");
    if(name==="sphere"&&Math.abs(uu)>=Math.PI/2)throw new Error("sphere chart requires |u|<pi/2; poles need another chart");
    var point;
    var ru;
    var rv;
    var ruu;
    var ruv;
    var rvv;
    var normal;
    var R;
    var a;

    if (name === "sphere") {
      R = 2;
      point = vec(R * Math.cos(uu) * Math.cos(vv), R * Math.cos(uu) * Math.sin(vv), R * Math.sin(uu));
      ru = vec(-R * Math.sin(uu) * Math.cos(vv), -R * Math.sin(uu) * Math.sin(vv), R * Math.cos(uu));
      rv = vec(-R * Math.cos(uu) * Math.sin(vv), R * Math.cos(uu) * Math.cos(vv), 0);
      ruu = vec(-R * Math.cos(uu) * Math.cos(vv), -R * Math.cos(uu) * Math.sin(vv), -R * Math.sin(uu));
      ruv = vec(R * Math.sin(uu) * Math.sin(vv), -R * Math.sin(uu) * Math.cos(vv), 0);
      rvv = vec(-R * Math.cos(uu) * Math.cos(vv), -R * Math.cos(uu) * Math.sin(vv), 0);
      normal = scale(point, sign / R);
    } else if (name === "cylinder") {
      a = 1.5;
      point = vec(a * Math.cos(uu), a * Math.sin(uu), vv);
      ru = vec(-a * Math.sin(uu), a * Math.cos(uu), 0);
      rv = vec(0, 0, 1);
      ruu = vec(-a * Math.cos(uu), -a * Math.sin(uu), 0);
      ruv = vec(0, 0, 0);
      rvv = vec(0, 0, 0);
      normal = vec(sign * Math.cos(uu), sign * Math.sin(uu), 0);
    } else if (name === "saddle") {
      point = vec(uu, vv, uu * uu - vv * vv);
      ru = vec(1, 0, 2 * uu);
      rv = vec(0, 1, -2 * vv);
      ruu = vec(0, 0, 2);
      ruv = vec(0, 0, 0);
      rvv = vec(0, 0, -2);
      normal = scale(cross(ru, rv), sign / norm(cross(ru, rv)));
    } else {
      point = vec(uu, vv, 0);
      ru = vec(1, 0, 0);
      rv = vec(0, 1, 0);
      ruu = vec(0, 0, 0);
      ruv = vec(0, 0, 0);
      rvv = vec(0, 0, 0);
      normal = vec(0, 0, sign);
    }

    // Use the known analytic forms to preserve exact zero/repeated-curvature
    // cases and avoid cancellation in E*G-F*F for steep graph patches.
    var E,F,G,L,M,N,determinant,K,H,principal;
    if(name==="sphere"){
      E=4;F=0;G=4*Math.cos(uu)**2;L=-2*sign;M=0;N=-2*sign*Math.cos(uu)**2;
      determinant=16*Math.cos(uu)**2;K=.25;H=-sign/2;principal=[H,H];
    }else if(name==="cylinder"){
      E=2.25;F=0;G=1;L=-1.5*sign;M=0;N=0;determinant=2.25;K=0;H=-sign/3;principal=[0,-2*sign/3].sort((a,b)=>b-a);
    }else if(name==="plane"){
      E=G=determinant=1;F=L=M=N=K=H=0;principal=[0,0];
    }else{
      var q=1+4*uu*uu+4*vv*vv,D=Math.sqrt(q);
      E=1+4*uu*uu;F=-4*uu*vv;G=1+4*vv*vv;L=2*sign/D;M=0;N=-2*sign/D;determinant=q;
      K=-4/(q*q);H=4*sign*(vv*vv-uu*uu)/(q*D);
      var large=H+(H<0?-1:1)*Math.hypot(H,Math.sqrt(-K));principal=[large,K/large].sort((a,b)=>b-a);
    }
    var e1=scale(ru,1/Math.sqrt(E)),e2=scale(add(rv,scale(ru,-F/E)),Math.sqrt(E/determinant));
    var A=L/E,B=(M-F*L/E)/Math.sqrt(determinant),C=(E*N-2*F*M+F*F*L/E)/determinant;
    if(name==="saddle")C=-2*sign*(1+8*uu*uu+16*uu*uu*(uu*uu-vv*vv))/(E*determinant*Math.sqrt(determinant));
    var umbilic=principal[0]===principal[1],angle=umbilic?0:.5*Math.atan2(2*B,A-C);
    function direction(t){return add(scale(e1,Math.cos(t)),scale(e2,Math.sin(t)));}
    return {id:name,u:uu,v:vv,point:point,normal:normal,normalSign:sign,ru:ru,rv:rv,ruu:ruu,ruv:ruv,rvv:rvv,
      first:{E:E,F:F,G:G,determinant:determinant},second:{L:L,M:M,N:N},K:K,H:H,principal:principal,
      type:classifyPoint(principal[0],principal[1],K),tangentFrame:[e1,e2],orthogonalSecond:[[A,B],[B,C]],principalAngle:angle,
      principalDirections:[direction(angle),direction(angle+Math.PI/2)],umbilic:umbilic};
  }
  function classifyPoint(k1,k2,K){
    if(![k1,k2,K].every(finite))throw new Error("finite principal/Gaussian curvatures required");
    if(K===0)return k1===0&&k2===0?"平面点":"抛物点";
    return K>0?"椭圆点":"双曲点";
  }
  function normalCurvature(data,theta){
    if(!finite(theta)||Math.abs(theta)>2*Math.PI)throw new Error("direction angle must lie in [-2pi,2pi]");
    var c=Math.cos(theta),s=Math.sin(theta),w=add(scale(data.tangentFrame[0],c),scale(data.tangentFrame[1],s));
    var h=data.orthogonalSecond,direct=h[0][0]*c*c+2*h[0][1]*c*s+h[1][1]*s*s;
    var euler=data.principal[1]+(data.principal[0]-data.principal[1])*Math.cos(theta-data.principalAngle)**2;
    return {theta:theta,direction:w,value:euler,direct:direct,residual:direct-euler};
  }
  function surfacePoint(id,u,v){
    id=surfaceById(id).id;u=parameter(u,0);v=parameter(v,0);
    return id==="sphere"?[2*Math.cos(u)*Math.cos(v),2*Math.cos(u)*Math.sin(v),2*Math.sin(u)]
      :id==="cylinder"?[1.5*Math.cos(u),1.5*Math.sin(u),v]
      :id==="saddle"?[u,v,u*u-v*v]:[u,v,0];
  }

  function formatNumber(value, digits) {
    if (!finite(value)) return "—";
    var places = digits === undefined ? 4 : digits;
    if(value===0)return "0";
    if(Math.abs(value)<Math.pow(10,-places)||Math.abs(value)>=1e7)return value.toExponential(3);
    var text = value.toFixed(places);
    return text.replace(/0+$/, "").replace(/\.$/, "") || "0";
  }

  function installStyles(doc) {
    if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement || doc.body).appendChild(style);
  }

  function setAttrs(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function append(node, children, doc) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function element(doc, tag, attrs, children) {
    return append(setAttrs(doc.createElement(tag), attrs), children, doc);
  }

  function svgElement(doc, tag, attrs, children) {
    return append(setAttrs(doc.createElementNS(SVG_NS, tag), attrs), children, doc);
  }

  function clear(node) {
    if (!node) return;
    if (typeof node.replaceChildren === "function") node.replaceChildren();
    else while (node.firstChild) node.removeChild(node.firstChild);
  }

  function announce(root, api, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function expectedAnswers(data) {
    var sign = data.K > 0 ? "positive" : data.K < 0 ? "negative" : "zero";
    var pattern = data.type === "平面点" ? "both-zero" : data.type === "抛物点" ? "one-zero" : data.K > 0 ? "same-sign" : "opposite-sign";
    return { sign: sign, zeroType: data.type === "平面点" ? "plane" : data.type === "抛物点" ? "parabolic" : "not-zero", pattern: pattern, normal: "flip-h" };
  }

  function project(p){return [(p[0]-p[1])/Math.SQRT2,(p[0]+p[1]-2*p[2])/Math.sqrt(6)];}
  function surfaceGrid(data){
    var model=surfaceById(data.id),ur=data.id==="sphere"?[-1.45,1.45]:[model.uMin,model.uMax],vr=[model.vMin,model.vMax],lines=[];
    for(var axis=0;axis<2;axis++)for(var i=0;i<=16;i++){
      var line=[];for(var j=0;j<=60;j++){
        var u=ur[0]+(ur[1]-ur[0])*(axis===0?i/16:j/60),v=vr[0]+(vr[1]-vr[0])*(axis===0?j/60:i/16);
        line.push(surfacePoint(data.id,u,v));
      }lines.push(line);
    }return {lines:lines,uRange:ur,vRange:vr};
  }
  function renderSvg(doc,data,serial,theta){
    if(theta===undefined)theta=0;var grid=surfaceGrid(data),points=grid.lines.flat();
    // Fixed probe-centered cube accommodates both signs of normal and all unit
    // directions, so flipping the normal does not alter the viewing scale.
    for(var x of [-1,1])for(var y of [-1,1])for(var z of [-1,1])points.push(add(data.point,[x,y,z]));
    var pp=points.map(project),xx=pp.map(p=>p[0]),yy=pp.map(p=>p[1]),loX=Math.min(...xx),hiX=Math.max(...xx),loY=Math.min(...yy),hiY=Math.max(...yy);
    var scale=Math.min(435/(hiX-loX),285/(hiY-loY)),cx=(hiX+loX)/2,cy=(hiY+loY)/2;
    var map=function(p){var q=project(p);return [252+scale*(q[0]-cx),215-scale*(q[1]-cy)];};
    var svg=svgElement(doc,"svg",{className:"sc-svg",viewBox:"0 0 760 465",role:"img","aria-labelledby":"sc-title-"+serial+" sc-desc-"+serial});
    svg.appendChild(svgElement(doc,"title",{id:"sc-title-"+serial},"真实参数曲面、法向与本点主方向"));
    svg.appendChild(svgElement(doc,"desc",{id:"sc-desc-"+serial},"等比例正投影的参数网格，线条全部显示，不模拟前后遮挡；红点是当前点。右侧单位向量独立放大，屏幕角度不是三维角度。"));
    function text(x,y,t,small){svg.appendChild(svgElement(doc,"text",{x:x,y:y,className:small?"sc-small":"sc-title"},t));}
    function line(a,b,color,extra){svg.appendChild(svgElement(doc,"line",Object.assign({x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:color,"stroke-width":2},extra||{})));}
    text(30,29,surfaceById(data.id).label+"：实际参数网格");text(510,29,"本点单位方向单独放大");
    grid.lines.forEach(function(line,i){
      var d=line.map(function(p,j){var q=map(p);return(j?"L":"M")+q[0].toFixed(7)+" "+q[1].toFixed(7);}).join(" ");
      svg.appendChild(svgElement(doc,"path",{d:d,fill:"none",stroke:"var(--sc-blue)","stroke-opacity":.47,"stroke-width":1,"data-grid-line":i}));
    });
    var current=map(data.point);svg.appendChild(svgElement(doc,"circle",{cx:current[0],cy:current[1],r:4,fill:"var(--sc-red)","data-surface-probe":""}));
    var defs=svgElement(doc,"defs"),dirs=[data.normal,data.principalDirections[0],data.principalDirections[1],normalCurvature(data,theta).direction],colors=["var(--sc-red)","var(--sc-blue)","var(--sc-gold)","var(--sc-green)"],names=["n","e₁主","e₂主","w"];
    dirs.forEach(function(v,i){
      var id="sc-arrow-"+serial+"-"+i,marker=svgElement(doc,"marker",{id:id,markerWidth:7,markerHeight:7,refX:6,refY:3.5,orient:"auto",markerUnits:"userSpaceOnUse"});
      marker.appendChild(svgElement(doc,"path",{d:"M0 0L7 3.5L0 7z",fill:colors[i]}));defs.appendChild(marker);
      var end=map(add(data.point,scaleVector(v,.55)));
      line(current,end,colors[i],{"marker-end":"url(#"+id+")","data-surface-vector":i});
      var q=project(v),to=[620+90*q[0],215-90*q[1]];
      // The chosen direction is shown separately below the principal vectors
      // in the legend as well, since coincident directions are meaningful.
      line([620,215],to,colors[i],{"marker-end":"url(#"+id+")","stroke-dasharray":i===3?"4 3":undefined,"data-local-vector":i});
      if(i<3)text(to[0]+8,to[1]-8,names[i],true);
    });svg.appendChild(defs);
    text(30,391,"图示 u∈["+grid.uRange.map(v=>formatNumber(v,2)).join(",")+"]，v∈["+grid.vRange.map(v=>formatNumber(v,2)).join(",")+"]",true);
    text(30,419,"红 n；蓝/金为主方向；绿虚线 w 是下方所选方向。网格全显，无遮挡。",true);
    text(30,447,"投影会缩短或重合向量；正交性与法曲率请读数值表。",true);
    return svg;
  }
  function scaleVector(v,k){return v.map(x=>x*k);}
  function directionWorkbench(doc,data,onChange){
    var section=element(doc,"section",{className:"sc-direction","aria-label":"法曲率方向工作台"}),theta=0;
    section.appendChild(element(doc,"h4",{},"转动切方向：法曲率怎样在两个主曲率之间变化？"));
    section.appendChild(element(doc,"p",{className:"sc-note"},"θ 相对正交单位基 (r_u/√E, 正交化后的 r_v) 测量；不是直接在通常不正交的参数坐标里转角。绿虚线 w 显示所选单位切向。"));
    var label=element(doc,"label",{},"切方向角 θ（度）"),input=element(doc,"input",{type:"range",min:0,max:180,step:1,value:0,"aria-label":"法曲率方向角 θ"}),output=element(doc,"output"),body=element(doc,"div",{"aria-live":"polite"});
    label.appendChild(input);label.appendChild(output);section.appendChild(label);section.appendChild(body);
    function render(){
      clear(body);var r=normalCurvature(data,theta),a=data.principal[0],b=data.principal[1],magnitude=Math.max(Math.abs(a),Math.abs(b))||1;
      output.textContent=Math.round(theta*180/Math.PI)+"°";
      body.appendChild(element(doc,"p",{"data-normal-curvature":""},"κₙ="+formatNumber(r.value,6)+"；II/I 直接计算="+formatNumber(r.direct,6)+"；单位方向 w=("+r.direction.map(v=>formatNumber(v,4)).join(", ")+")"));
      body.appendChild(element(doc,"p",{className:"sc-note"},data.umbilic?"这是脐点：所有切方向都是主方向，法曲率相同；图中两条主方向只是任选的一组正交基。":"主曲率按 k₁≥k₂ 排序。法向翻转时排序标签会互换；保持同一几何方向看，法曲率才是逐项变号。"));
      var svg=svgElement(doc,"svg",{className:"sc-svg",viewBox:"0 0 760 340",role:"img","aria-label":"法曲率随切方向变化的精确函数图"}),X=d=>80+610*d/180,Y=k=>165-100*k/magnitude;
      function text(x,y,t,anchor){svg.appendChild(svgElement(doc,"text",{x:x,y:y,"text-anchor":anchor||"middle",className:"sc-small"},t));}
      for(const k of [-magnitude,0,magnitude]){
        svg.appendChild(svgElement(doc,"line",{x1:80,y1:Y(k),x2:690,y2:Y(k),className:"sc-grid"}));text(68,Y(k)+5,formatNumber(k,4),"end");
      }
      var d=[];for(var deg=0;deg<=180;deg++){var value=normalCurvature(data,deg*Math.PI/180).value;d.push((deg?"L":"M")+X(deg).toFixed(7)+" "+Y(value).toFixed(7));}
      svg.appendChild(svgElement(doc,"path",{d:d.join(" "),fill:"none",stroke:"var(--sc-green)","stroke-width":2,"data-normal-curve":""}));
      for(const deg of [0,45,90,135,180])text(X(deg),296,deg+"°");
      svg.appendChild(svgElement(doc,"circle",{cx:X(theta*180/Math.PI),cy:Y(r.value),r:5,fill:"var(--sc-red)","data-normal-probe":""}));
      text(380,25,"κₙ(θ)=k₁ cos²(θ−θ₁)+k₂ sin²(θ−θ₁)");text(380,325,"横轴是正交切平面中的角度，纵轴是法曲率（长度⁻¹）。");
      body.appendChild(element(doc,"div",{className:"sc-frame",role:"region",tabindex:"0","aria-label":"可滚动的方向法曲率图"},svg));
    }
    input.addEventListener("input",function(){theta=Number(this.value)*Math.PI/180;render();onChange(theta);});render();return section;
  }

  function renderResults(doc, hostNode, data, serial) {
    clear(hostNode);
    var metrics = element(doc, "div", { className: "sc-metrics" });
    [
      ["点型", data.type],
      ["主曲率 k₁", formatNumber(data.principal[0], 5)],
      ["主曲率 k₂", formatNumber(data.principal[1], 5)],
      ["K（内在）", formatNumber(data.K, 5)],
      ["H（外在）", formatNumber(data.H, 5)]
    ].forEach(function (row) {
      metrics.appendChild(element(doc, "div", { className: "sc-metric" }, [element(doc, "span", {}, row[0]), element(doc, "strong", {}, row[1])]));
    });
    hostNode.appendChild(metrics);
    var frame = element(doc, "div", { className: "sc-frame",role:"region",tabindex:"0","aria-label":"曲面网格与单位方向图" });
    frame.appendChild(renderSvg(doc, data, serial));
    frame.appendChild(element(doc, "div", { className: "sc-legend" }, [
      element(doc, "span", {}, [element(doc, "i", { className: "sc-swatch sc-swatch-k" }), "K 由内在度量决定"]),
      element(doc, "span", {}, [element(doc, "i", { className: "sc-swatch sc-swatch-h" }), "H 与法曲率的单位为长度⁻¹，K 为长度⁻²"])
    ]));
    hostNode.appendChild(frame);
    hostNode.appendChild(directionWorkbench(doc,data,function(theta){frame.querySelector("svg").replaceWith(renderSvg(doc,data,serial,theta));}));
    var tableWrap = element(doc, "div", { className: "sc-table-wrap",role:"region",tabindex:"0","aria-label":"曲面基本形式与主曲率表" });
    var table = element(doc, "table");
    table.appendChild(element(doc, "caption", {}, "第一、第二基本形式与主曲率对账"));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
      element(doc, "th", { scope: "col" }, "账本"), element(doc, "th", { scope: "col" }, "公式"), element(doc, "th", { scope: "col" }, "当前值"), element(doc, "th", { scope: "col" }, "读法")
    ])));
    var rows = [
      ["I", "E du² + 2F du dv + G dv²", "E=" + formatNumber(data.first.E, 5) + ", F=" + formatNumber(data.first.F, 5) + ", G=" + formatNumber(data.first.G, 5), "长度、角度、面积；内在"],
      ["II", "L du² + 2M du dv + N dv²", "L=" + formatNumber(data.second.L, 5) + ", M=" + formatNumber(data.second.M, 5) + ", N=" + formatNumber(data.second.N, 5), "相对所选 n 的外在弯曲"],
      ["主曲率", "eig(I⁻¹II)", formatNumber(data.principal[0], 5) + ", " + formatNumber(data.principal[1], 5), "按数值从大到小排列；法向翻转时排序标签可能互换"],
      ["K", "(LN−M²)/(EG−F²)=k₁k₂", formatNumber(data.K, 5), "内在高斯曲率；n 翻转不变"],
      ["H", "(EN−2FM+GL)/(2(EG−F²))=(k₁+k₂)/2", formatNumber(data.H, 5), "外在平均曲率；n 翻转变号"],
      ["分类", "按 K 与 (k₁,k₂)", data.type, data.K === 0 ? "K=0 还要看零主曲率的个数" : "K 的符号区分椭圆点/双曲点"]
    ];
    var body = element(doc, "tbody");
    rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, row.map(function (value) { return element(doc, "td", {}, value); }))); });
    table.appendChild(body);
    tableWrap.appendChild(table);
    hostNode.appendChild(tableWrap);
    var boundary = data.type === "平面点"
      ? "当前是平面点：k₁=k₂=0。它不是“可展/抛物”标签的替代品。"
      : data.type === "抛物点"
        ? "当前是抛物点：恰有一个主曲率为 0；圆柱在正则点属于此类。K=0 本身没有告诉你是哪一种。"
        : "这是有限参数点的恒等式对账；它展示公式如何相容，不是由四个模型推出任意曲面的分类定理。";
    hostNode.appendChild(element(doc, "div", { className: "sc-certificate" }, boundary + " 法向 sign=" + data.normalSign + "；若换成 −n，K 保持而 H 变号；固定同一主方向时，其主曲率变号。"));
  }

  function mount(root, api) {
    var doc = root && root.ownerDocument;
    if (!doc) return;
    installStyles(doc);
    root.classList.add("sc-lab");
    var serial = INSTANCE += 1;
    var state = {
      id: "plane",
      u: surfaceById("plane").u,
      v: surfaceById("plane").v,
      normalSign: 1,
      answers: { sign: null, zeroType: null, pattern: null, normal: null },
      revealed: false
    };
    var shell = element(doc, "div", { className: "sc-shell" });
    shell.appendChild(element(doc, "h3", {}, "曲率对账台：先判点型，再揭示 I、II、K、H"));
    shell.appendChild(element(doc, "p", { className: "sc-note" }, "四个固定模型只做可计算的局部示范。第一基本形式负责内在测量；第二基本形式随法向改变。先预测，结果区会保持隐藏。"));

    var presets = element(doc, "div", { className: "sc-presets" });
    SURFACES.forEach(function (surface) {
      var button = element(doc, "button", { type: "button", "aria-pressed": surface.id === state.id ? "true" : "false" }, surface.label);
      button.addEventListener("click", function () {
        state.id = surface.id;
        state.u = surface.u;
        state.v = surface.v;
        state.answers = { sign: null, zeroType: null, pattern: null, normal: null };
        state.revealed = false;
        render();
        status.textContent = "已切换到" + surface.label + "；请重新预测。";
        announce(root, api, status.textContent);
      });
      presets.appendChild(button);
    });
    shell.appendChild(presets);

    var controls = element(doc, "div", { className: "sc-controls" });
    var uControl = element(doc, "div", { className: "sc-control" });
    var uLabel = element(doc, "label", {}, "参数 u = ");
    var uOutput = element(doc, "output", {});
    var uInput = element(doc, "input", { type: "range", "aria-label": "曲面参数 u" });
    uLabel.appendChild(uOutput); uControl.appendChild(uLabel); uControl.appendChild(uInput);
    var vControl = element(doc, "div", { className: "sc-control" });
    var vLabel = element(doc, "label", {}, "参数 v = ");
    var vOutput = element(doc, "output", {});
    var vInput = element(doc, "input", { type: "range", min: "-3.2", max: "3.2", step: "0.05", "aria-label": "曲面参数 v" });
    vLabel.appendChild(vOutput); vControl.appendChild(vLabel); vControl.appendChild(vInput);
    var normalControl = element(doc, "div", { className: "sc-control" });
    var normalLabel = element(doc, "label", { htmlFor: "sc-normal-" + serial }, "法向方向");
    var normalSelect = element(doc, "select", { id: "sc-normal-" + serial, "aria-label": "选择法向方向" }, [
      element(doc, "option", { value: "1" }, "+n（当前约定）"),
      element(doc, "option", { value: "-1" }, "−n（反向）")
    ]);
    normalControl.appendChild(normalLabel); normalControl.appendChild(normalSelect);
    controls.appendChild(uControl); controls.appendChild(vControl); controls.appendChild(normalControl); shell.appendChild(controls);

    var prediction = element(doc, "section", { className: "sc-prediction", "aria-labelledby": "sc-prediction-title-" + serial });
    prediction.appendChild(element(doc, "strong", { className: "sc-prediction-title", id: "sc-prediction-title-" + serial }, "预测门：四项回答后才揭示曲率账本"));
    var questionList = element(doc, "div");
    prediction.appendChild(questionList);
    var reveal = element(doc, "button", { type: "button", className: "sc-primary" }, "核对预测并揭示");
    var reset = element(doc, "button", { type: "button" }, "重置实验");
    var actionRow = element(doc, "div", { className: "sc-actions" }, [reveal, reset]);
    prediction.appendChild(actionRow);
    var status = element(doc, "p", { className: "sc-feedback", "aria-live": "polite", "aria-atomic": "true" }, "先回答四项预测。");
    prediction.appendChild(status); shell.appendChild(prediction);
    var results = element(doc, "section", { className: "sc-results", hidden: true, tabindex:"-1", "aria-label": "曲率计算结果" });
    shell.appendChild(results);
    root.replaceChildren(shell);

    function questions(data) {
      return [
        { key: "sign", prompt: "1. 当前 K 的符号？", choices: [{ value: "positive", label: "正" }, { value: "zero", label: "零" }, { value: "negative", label: "负" }] },
        { key: "zeroType", prompt: "2. 若 K=0，当前应区分为？", choices: [{ value: "plane", label: "平面点" }, { value: "parabolic", label: "抛物点" }, { value: "not-zero", label: "本题不适用" }] },
        { key: "pattern", prompt: "3. 两个主曲率的模式？", choices: [{ value: "both-zero", label: "都为 0" }, { value: "one-zero", label: "恰一个为 0" }, { value: "same-sign", label: "同号且非零" }, { value: "opposite-sign", label: "异号" }] },
        { key: "normal", prompt: "4. 法向翻转的一般变换律是什么（零值仍为零）？", choices: [{ value: "flip-h", label: "II、H、同方向法曲率变号；K 不变" }, { value: "flip-k", label: "K 变号，H 不变" }, { value: "nothing", label: "任意曲面所有读数都不变" }] }
      ];
    }

    function renderQuestions(data) {
      clear(questionList);
      questions(data).forEach(function (question, index) {
        var fieldset = element(doc, "fieldset",{"data-question":question.key});
        fieldset.appendChild(element(doc, "legend", {}, question.prompt));
        var options = element(doc, "div", { className: "sc-options", role: "group", "aria-label": question.prompt });
        question.choices.forEach(function (choice) {
          var button = element(doc, "button", { type: "button", "aria-pressed": state.answers[question.key] === choice.value ? "true" : "false","data-choice":choice.value }, choice.label);
          button.addEventListener("click", function () {
            state.answers[question.key] = choice.value;
            state.revealed = false;
            results.hidden = true;
            renderQuestions(data);
            renderGate();
            questionList.querySelector('[data-question="'+question.key+'"] [data-choice="'+choice.value+'"]').focus();
          });
          options.appendChild(button);
        });
        fieldset.appendChild(options); questionList.appendChild(fieldset);
      });
    }

    function renderGate() {
      var ready = Object.keys(state.answers).every(function (key) { return state.answers[key] !== null; });
      reveal.disabled = !ready;
    }

    function render() {
      var surface = surfaceById(state.id);
      var data = evaluateSurface(state.id, state.u, state.v, state.normalSign);
      Array.prototype.forEach.call(presets.children, function (button, index) { button.setAttribute("aria-pressed", SURFACES[index].id === state.id ? "true" : "false"); });
      uInput.min = String(surface.uMin); uInput.max = String(surface.uMax); uInput.step = String(surface.step); uInput.value = String(state.u); uOutput.textContent = formatNumber(state.u, 2);
      vInput.min=String(surface.vMin);vInput.max=String(surface.vMax);
      vInput.value = String(state.v); vOutput.textContent = formatNumber(state.v, 2);
      normalSelect.value = String(state.normalSign);
      renderQuestions(data); renderGate();
      results.hidden = !state.revealed;
      if (state.revealed) renderResults(doc, results, data, serial);
    }

    function resetPredictions(message) {
      state.answers = { sign: null, zeroType: null, pattern: null, normal: null };
      state.revealed = false; results.hidden = true; renderGate();
      if (message) { status.className = "sc-feedback sc-warn"; status.textContent = message; announce(root, api, message); }
    }

    uInput.addEventListener("input", function () { state.u = Number(uInput.value); resetPredictions("参数已改变，请重新预测。"); render(); });
    vInput.addEventListener("input", function () { state.v = Number(vInput.value); resetPredictions("参数已改变，请重新预测。"); render(); });
    normalSelect.addEventListener("change", function () { state.normalSign = Number(normalSelect.value); resetPredictions("法向已改变，请重新预测 H 的符号。"); render(); });
    reveal.addEventListener("click", function () {
      var data = evaluateSurface(state.id, state.u, state.v, state.normalSign);
      var expected = expectedAnswers(data);
      var keys = Object.keys(state.answers);
      if (keys.some(function (key) { return state.answers[key] === null; })) {
        status.className = "sc-feedback sc-warn"; status.textContent = "请先回答四项预测。"; announce(root, api, status.textContent); return;
      }
      var score = keys.reduce(function (total, key) { return total + (state.answers[key] === expected[key] ? 1 : 0); }, 0);
      state.revealed = true; results.hidden = false; renderResults(doc, results, data, serial);
      status.className = "sc-feedback " + (score === keys.length ? "sc-pass" : "sc-warn");
      status.textContent = "已揭示：命中 " + score + "/" + keys.length + "；" + data.type + " 的 K/H 已分别对账。";
      announce(root, api, status.textContent);
      results.focus();
    });
    reset.addEventListener("click", function () {
      state.id = "plane"; state.u = surfaceById("plane").u; state.v = surfaceById("plane").v; state.normalSign = 1; state.answers = { sign: null, zeroType: null, pattern: null, normal: null }; state.revealed = false;
      status.className = "sc-feedback"; status.textContent = "已重置到平面点；请重新预测。"; render(); announce(root, api, status.textContent);
      questionList.querySelector("button").focus();
    });
    render();
  }

  function assert(condition, message) {
    if (!condition) throw new Error("surface-curvature: " + message);
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var expectedTypes = { plane: "平面点", sphere: "椭圆点", cylinder: "抛物点", saddle: "双曲点" };
    SURFACES.forEach(function (surface) {
      var data = evaluateSurface(surface.id, surface.u, surface.v, 1);
      check(finite(data.first.determinant) && data.first.determinant > 0, surface.id + " regular parameterization");
      check(near(data.K, data.principal[0] * data.principal[1], 2e-8), surface.id + " K product");
      check(near(data.H, (data.principal[0] + data.principal[1]) / 2, 2e-8), surface.id + " H average");
      check(data.type === expectedTypes[surface.id], surface.id + " point classification");
      var flipped = evaluateSurface(surface.id, surface.u, surface.v, -1);
      check(near(flipped.K, data.K, 2e-8), surface.id + " K normal invariance");
      check(near(flipped.H, -data.H, 2e-8), surface.id + " H normal sign");
      check(near(flipped.second.L, -data.second.L, 2e-8) && near(flipped.second.N, -data.second.N, 2e-8), surface.id + " II normal sign");
    });
    var saddle = evaluateSurface("saddle", 0, 0, 1);
    check(near(saddle.second.L, 2) && near(saddle.second.N, -2), "saddle II at origin");
    var cylinder = evaluateSurface("cylinder", 0, 0, 1);
    check(Math.abs(cylinder.K) < 1e-10 && ((Math.abs(cylinder.principal[0]) > 1e-6 && Math.abs(cylinder.principal[1]) < 1e-10) || (Math.abs(cylinder.principal[1]) > 1e-6 && Math.abs(cylinder.principal[0]) < 1e-10)), "cylinder separates parabolic from plane");
    return { checks: checks, surfaces: SURFACES.length };
  }

  return {
    SURFACES: SURFACES,
    renderSvg:renderSvg,
    surfaceGrid:surfaceGrid,
    evaluateSurface: evaluateSurface,
    surfaceById:surfaceById,
    surfacePoint:surfacePoint,
    normalCurvature:normalCurvature,
    classifyPoint: classifyPoint,
    expectedAnswers: expectedAnswers,
    mount: mount,
    selfTest: selfTest
  };
});

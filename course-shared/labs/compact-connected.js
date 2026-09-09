(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("compact-connected", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("compact-connected self-test: PASS (" + report.checks + " checks, " + report.models + " space models)");
    } catch (error) {
      console.error("compact-connected self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "compact-connected-lab-styles";
  var INSTANCE = 0;

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  var MODELS = [
    {
      id: "closed-interval",
      label: "[0,1]：闭区间",
      metric: true,
      compact: true,
      sequential: true,
      connected: true,
      pathConnected: true,
      coverCertificate: "Heine–Borel：R 中闭且有界",
      sequenceCertificate: "度量空间紧致与序列紧致等价",
      pathCertificate: "直线段 t -> (1-t)a+tb",
      imageCertificate: "连续像紧致；例如 t^2([0,1])=[0,1]"
    },
    {
      id: "open-interval",
      label: "(0,1)：开区间",
      metric: true,
      compact: false,
      sequential: false,
      connected: true,
      pathConnected: true,
      coverCertificate: "U_n=(1/n,1) 覆盖但任意有限子族漏掉一段",
      sequenceCertificate: "序列 1/(n+1)，n≥1，在空间外的 0 处才有极限",
      pathCertificate: "仍是区间，任两点可用线段连接",
      imageCertificate: "非紧源不触发连续像定理；1/t 的像为 (1,∞)"
    },
    {
      id: "sine-closure",
      label: "闭正弦曲线（0<x≤1 加竖直段）",
      metric: true,
      compact: true,
      sequential: true,
      connected: true,
      pathConnected: false,
      coverCertificate: "R^2 中闭且有界，Heine–Borel",
      sequenceCertificate: "度量紧致，所以序列紧致",
      pathCertificate: "连通但不能从竖直段任一点沿路径到达振荡图像",
      imageCertificate: "投影等连续像仍紧致；连通像仍连通"
    },
    {
      id: "rational-subspace",
      label: "Q∩[0,1]：有理数子空间",
      metric: true,
      compact: false,
      sequential: false,
      connected: false,
      pathConnected: false,
      coverCertificate: "在 R 中不是闭集，故不是紧致",
      sequenceCertificate: "有理序列可逼近无理数，极限不在空间内",
      pathCertificate: "Q 的连通子集只有单点",
      imageCertificate: "连续像可能特殊变紧；恒等像仍非紧"
    },
    {
      id: "omega-one",
      label: "[0,ω1)：序数空间",
      metric: false,
      compact: false,
      sequential: true,
      connected: false,
      pathConnected: false,
      coverCertificate: "存在无有限子覆盖的序数开覆盖",
      sequenceCertificate: "每个序列落在某个可数初段，可抽收敛子列",
      pathCertificate: "序数空间有孤立后继点，不连通",
      imageCertificate: "非开覆盖紧致，不能直接套连续像紧致定理"
    },
    {
      id:"cantor-cube",label:"{0,1}^P(N)：不可数二点积",metric:false,compact:true,sequential:false,connected:false,pathConnected:false,
      coverCertificate:"Tychonoff：二点紧因子的任意积紧致（ZFC）",
      sequenceCertificate:"x_n(A)=1 当且仅当 n∈A；任取子列，以偶数项指标集作坐标，值0/1交替",
      pathCertificate:"每个坐标投影到离散二点集，连续路径每坐标都常值，故路径为常值",
      imageCertificate:"常值像是单点紧集"
    }
  ];

  function freeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.keys(value).forEach(function(k){freeze(value[k]);});Object.freeze(value);}return value;}
  freeze(MODELS);
  function modelById(id) {
    if(id===undefined)id="closed-interval";
    for (var index = 0; index < MODELS.length; index += 1) {
      if (MODELS[index].id === id) return MODELS[index];
    }
    throw new Error("unknown topology space model");
  }

  function imageReport(model,mapId){
    assert(model&&typeof model.id==="string","a known space model is required");model=modelById(model.id);
    if(mapId===undefined)mapId="square";
    assert(["square","reciprocal","constant"].indexOf(mapId)>=0,"unknown continuous map");
    if(mapId==="constant")return {known:true,applicable:true,compact:true,text:"f≡0：像为单点 {0}，总是紧致；不论源空间是否紧致。"};
    if(mapId==="reciprocal"){
      if(model.id==="open-interval")return {known:true,applicable:true,compact:false,text:"f(t)=1/t 的像为 (1,∞)，不紧。它在 (0,1) 连续。"};
      return {known:false,applicable:false,compact:null,text:"本实验只在 (0,1) 上定义倒数映射；当前模型没有选择这张映射，不能谈它的像。"};
    }
    if(model.id==="closed-interval")return {known:true,applicable:true,compact:true,text:"f(t)=t² 的像为 [0,1]，紧致且能取到最值。"};
    if(model.id==="open-interval")return {known:true,applicable:true,compact:false,text:"f(t)=t² 的像为 (0,1)，不紧；非紧源也可有紧的常值像。"};
    if(model.id==="sine-closure")return {known:true,applicable:true,compact:true,text:"横坐标投影 (x,y)↦x 的像为 [0,1]，保持紧致和连通。"};
    if(model.id==="rational-subspace")return {known:true,applicable:true,compact:false,text:"f(q)=q² 的像是 {q²:q∈Q∩[0,1]}；有理q趋于1/√2时像趋于缺失的1/2，所以在R非闭、不紧。"};
    return {known:false,applicable:false,compact:null,text:"平方/横坐标投影只用于前四个实模型；这里应选择常值映射，不能把未定义解释成已证明非紧。"};
  }
  function range(n){return Array.from({length:n},function(_,i){return i;});}
  function coverReport(m,k,selected){
    assert(Number.isInteger(m)&&m>=1&&m<=12,"m must be an integer from 1 to 12");
    assert(Number.isInteger(k)&&k>=1&&k<=30,"radius numerator k must be an integer from 1 to 30");
    if(selected===undefined)selected=range(m+1);
    assert(Array.isArray(selected)&&new Set(selected).size===selected.length&&selected.every(function(j){return Number.isInteger(j)&&j>=0&&j<=m;}),"selected interval indices must be distinct and valid");
    var denominator=20*m,intervals=range(m+1).map(function(j){return {index:j,lo:20*j-k,hi:20*j+k,selected:selected.indexOf(j)>=0};});
    var chosen=intervals.filter(function(I){return I.selected;}),cuts=[0,denominator];
    chosen.forEach(function(I){[I.lo,I.hi].forEach(function(x){if(x>0&&x<denominator)cuts.push(x);});});
    cuts=Array.from(new Set(cuts)).sort(function(a,b){return a-b;});
    // Doubled integer coordinates inspect every endpoint and one point in each
    // interval between consecutive endpoints. Strict membership is exact.
    var probes=cuts.map(function(x){return 2*x;});for(var i=1;i<cuts.length;i++)probes.push(cuts[i-1]+cuts[i]);
    var missing=probes.sort(function(a,b){return a-b;}).find(function(q){return !chosen.some(function(I){return 2*I.lo<q&&q<2*I.hi;});});
    return {m:m,k:k,denominator:denominator,intervals:intervals,selected:selected.slice(),covers:missing===undefined,
      witness:missing===undefined?null:{numerator:missing,denominator:2*denominator,value:missing/(2*denominator)}};
  }
  function pruneCover(m,k,selected){
    var initial=coverReport(m,k,selected),kept=initial.selected.slice();if(!initial.covers)return initial;
    initial.selected.forEach(function(j){var candidate=kept.filter(function(v){return v!==j;});if(coverReport(m,k,candidate).covers)kept=candidate;});
    return coverReport(m,k,kept);
  }
  function openCoverReport(N){
    assert(Number.isInteger(N)&&N>=2&&N<=100,"N must be an integer from 2 to 100");
    return {N:N,left:1/N,right:1,witness:1/(2*N),witnessNumerator:1,witnessDenominator:2*N,covers:false};
  }
  function sineSamples(epsilon){
    if(epsilon===undefined)epsilon=.02;
    assert(typeof epsilon==="number"&&Number.isFinite(epsilon)&&epsilon>=.005&&epsilon<=.2,"cutoff epsilon must lie in [.005,.2]");
    var maxPhase=1/epsilon,steps=Math.ceil((maxPhase-1)/(Math.PI/16)),points=[];
    for(var i=0;i<=steps;i++){var phase=1+(maxPhase-1)*i/steps;points.push({x:1/phase,y:Math.sin(phase),phase:phase});}
    return {epsilon:epsilon,points:points,maxPhaseStep:(maxPhase-1)/steps};
  }
  function integerSqrt(value){
    var lo=0n,hi=value+1n;while(hi-lo>1n){var mid=(lo+hi)/2n;if(mid*mid<=value)lo=mid;else hi=mid;}return lo;
  }
  function rationalApproximation(n){
    assert(Number.isInteger(n)&&n>=1&&n<=8,"decimal precision must be an integer from 1 to 8");
    var D=10n**BigInt(n),P=integerSqrt(D*D/2n);
    return {n:n,numerator:Number(P),denominator:Number(D),value:Number(P)/Number(D),decimal:"0."+P.toString().padStart(n,"0"),errorUpper:1/Number(D)};
  }

  var STYLE_TEXT = [
    ".ccc-lab .ccc-frame:focus-visible,.ccc-lab .ccc-table-wrap:focus-visible{outline:3px solid var(--ccc-blue);outline-offset:2px}.ccc-lab .ccc-workbench{min-width:0;border:1px solid var(--border);padding:12px}.ccc-lab .ccc-members{display:flex;flex-wrap:wrap;gap:6px}.ccc-lab input[type=range]{width:100%;margin:0;accent-color:var(--ccc-blue)}",
    ".ccc-lab{--ccc-blue:var(--accent,#315f9d);--ccc-gold:var(--cl-gold,#9b6a12);--ccc-green:var(--cl-green,#39734d);--ccc-red:var(--cl-red,#b64335);--ccc-muted:var(--fg-soft,#6b6557);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".ccc-lab *,.ccc-lab *::before,.ccc-lab *::after{box-sizing:border-box}.ccc-lab [hidden]{display:none!important}",
    ".ccc-lab h3,.ccc-lab h4{margin:0;color:var(--fg);letter-spacing:0}.ccc-lab h3{font-size:1.18rem}.ccc-lab h4{font-size:1rem}.ccc-lab p{margin:7px 0}.ccc-lab .ccc-note,.ccc-lab .ccc-feedback{color:var(--ccc-muted);font-size:13px;line-height:1.7}",
    ".ccc-lab .ccc-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0}.ccc-lab .ccc-field{display:grid;gap:5px;min-width:0}.ccc-lab .ccc-field label{color:var(--ccc-muted);font-size:12.5px;font-weight:750}.ccc-lab select{width:100%;min-height:44px;padding:7px 9px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35}.ccc-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;font:inherit;line-height:1.35;overflow-wrap:anywhere}.ccc-lab button:hover{border-color:var(--ccc-blue)}.ccc-lab button:focus-visible,.ccc-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.ccc-lab button[aria-pressed=true],.ccc-lab .ccc-primary{border-color:var(--ccc-blue);background:var(--ccc-blue);color:var(--bg);font-weight:750}",
    ".ccc-lab .ccc-gate{margin:14px 0;padding:12px;border-left:3px solid var(--ccc-gold);background:var(--block-bg,var(--bg))}.ccc-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border);background:var(--bg)}.ccc-lab legend{max-width:100%;padding:0 3px;color:var(--fg);font-size:13px;font-weight:700;line-height:1.5}.ccc-lab .ccc-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.ccc-lab .ccc-options button{font-size:12px}.ccc-lab .ccc-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.ccc-lab .ccc-actions>*{flex:1 1 180px}.ccc-lab .ccc-feedback{min-height:1.7em;margin-top:9px;font-weight:700}.ccc-lab .ccc-pass{color:var(--ccc-green)}.ccc-lab .ccc-warn{color:var(--ccc-red)}",
    ".ccc-lab .ccc-result{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;margin-top:15px}.ccc-lab .ccc-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px}.ccc-lab .ccc-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.ccc-lab .ccc-metric:nth-child(3n+1){border-color:var(--ccc-blue)}.ccc-lab .ccc-metric:nth-child(3n+2){border-color:var(--ccc-gold)}.ccc-lab .ccc-metric:nth-child(3n){border-color:var(--ccc-green)}.ccc-lab .ccc-metric span{display:block;color:var(--ccc-muted);font-size:11px}.ccc-lab .ccc-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".ccc-lab .ccc-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch}.ccc-lab .ccc-svg{display:block;width:100%;min-width:760px;max-width:none;height:auto;color:var(--fg)}.ccc-lab .ccc-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.ccc-lab .ccc-line{fill:none;stroke:var(--ccc-blue);stroke-width:4}.ccc-lab .ccc-dash{fill:none;stroke:var(--ccc-red);stroke-width:2;stroke-dasharray:6 5}.ccc-lab .ccc-point{fill:var(--ccc-green);stroke:var(--bg);stroke-width:3}.ccc-lab .ccc-hole{fill:var(--bg);stroke:var(--ccc-red);stroke-width:3}.ccc-lab .ccc-dot{fill:var(--ccc-blue)}.ccc-lab .ccc-ordinal{fill:var(--ccc-gold);stroke:var(--ccc-gold)}.ccc-lab .ccc-label{font-size:12px;text-anchor:middle}.ccc-lab .ccc-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.ccc-lab table{display:table;white-space:normal;width:100%;min-width:760px;border-collapse:collapse;font-size:12px}.ccc-lab caption{padding:0 0 7px;text-align:left;color:var(--ccc-muted);font-size:12px;font-weight:700}.ccc-lab th,.ccc-lab td{white-space:normal;overflow-wrap:anywhere;padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.ccc-lab th{color:var(--ccc-muted);font-size:11px}.ccc-lab .ccc-certificate{padding:10px 12px;border-left:3px solid var(--ccc-green);background:var(--block-bg,var(--bg));font-size:13px;line-height:1.7}.ccc-lab .ccc-certificate.ccc-fail{border-left-color:var(--ccc-red)}",
    "@media(max-width:700px){.ccc-lab .ccc-controls{grid-template-columns:minmax(0,1fr)}.ccc-lab .ccc-options{grid-template-columns:minmax(0,1fr)}.ccc-lab .ccc-frame{padding:5px}.ccc-lab table{font-size:11.5px}}@media(prefers-reduced-motion:reduce){.ccc-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function setAttributes(node, attributes) {
    Object.keys(attributes || {}).forEach(function (key) {
      var value = attributes[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function appendChildren(node, children, doc) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function element(doc, tag, attributes, children) {
    return appendChildren(setAttributes(doc.createElement(tag), attributes), children, doc);
  }

  function svgElement(doc, tag, attributes, children) {
    return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attributes), children, doc);
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function installStyles(doc) {
    if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement || doc.body).appendChild(style);
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") api.announce(root, message);
  }

  function renderModelSvg(doc,svg,model,uid,options){
    model=modelById(model.id);options=options||{};clear(svg);
    svg.setAttribute("viewBox","0 0 760 370");
    svg.appendChild(svgElement(doc,"title",{id:uid+"-title",text:model.label+"：对象与证据边界"}));
    svg.appendChild(svgElement(doc,"desc",{id:uid+"-desc",text:"实模型按标出的坐标绘制；不可数空间使用符号论证图，不伪装成有限采样。"}));
    function text(x,y,value,size,anchor){svg.appendChild(svgElement(doc,"text",{x:x,y:y,"font-size":size||14,"text-anchor":anchor||"middle",text:value}));}
    function line(x,y,X,Y,color,width,extra){svg.appendChild(svgElement(doc,"line",Object.assign({x1:x,y1:y,x2:X,y2:Y,stroke:color||"var(--ccc-muted)","stroke-width":width||1.5},extra||{})));}
    function dot(x,y,included,attrs){svg.appendChild(svgElement(doc,"circle",Object.assign({cx:x,cy:y,r:6,className:included?"ccc-point":"ccc-hole"},attrs||{})));}
    text(380,26,model.label,16);
    if(model.id==="closed-interval"||model.id==="open-interval"){
      var X=function(x){return 60+640*x;};line(60,150,700,150,"var(--ccc-blue)",3);var closed=model.id==="closed-interval";dot(60,150,closed);dot(700,150,closed);
      text(60,185,closed?"0（包含）":"0（不含）");text(700,185,closed?"1（包含）":"1（不含）");
      if(closed){text(380,246,"下方工作台逐项检查一组给定开覆盖；",15);text(380,280,"[0,1] 的一般紧致性另由 Heine–Borel 证明。",15);}
      else{
        var cover=openCoverReport(options.N===undefined?8:options.N),w=X(cover.witness);
        line(X(cover.left),228,700,228,"var(--ccc-green)",5);dot(X(cover.left),228,false);dot(700,228,false);
        dot(w,150,true,{"data-open-cover-witness":cover.N});line(w,140,w,104,"var(--ccc-red)",1);
        text(210,88,"漏点 x=1/"+cover.witnessDenominator+"="+cover.witness.toPrecision(4),14);
        text(380,275,"U₂,…,U_"+cover.N+" 的并 = (1/"+cover.N+",1)",15);
        text(380,316,"任意有限子族取最大指标 N，1/(2N) 仍被漏掉。",14);
      }return;
    }
    if(model.id==="sine-closure"){
      var sample=sineSamples(options.epsilon),X=function(x){return 60+640*x;},Y=function(y){return 184-96*y;};
      svg.appendChild(svgElement(doc,"rect",{x:60,y:70,width:640*sample.epsilon,height:225,fill:"var(--ccc-muted)","fill-opacity":.14,"data-omitted-tail":sample.epsilon}));
      line(60,Y(0),700,Y(0));[-1,0,1].forEach(function(y){text(40,Y(y)+5,String(y),12);});
      [0,.25,.5,.75,1].forEach(function(x){line(X(x),292,X(x),298);text(X(x),317,String(x),12);});
      line(60,Y(-1),60,Y(1),"var(--ccc-green)",3,{"data-vertical-segment":""});
      svg.appendChild(svgElement(doc,"polyline",{points:sample.points.map(function(p){return X(p.x).toFixed(7)+","+Y(p.y).toFixed(7);}).join(" "),fill:"none",stroke:"var(--ccc-blue)","stroke-width":2,"data-sine-curve":""}));
      dot(700,Y(Math.sin(1)),true);
      text(38,66,"y",13);text(724,318,"x",13);
      text(380,343,"蓝线：sin(1/x)，仅画 x≥"+sample.epsilon+"；灰带 0<x<ε 的无限尾部未画。",13);
      text(380,366,"绿色竖直段 x=0、−1≤y≤1 属于闭包；采样折线不是路径不可能性的证明。",12);
      return;
    }
    if(model.id==="rational-subspace"){
      var q=rationalApproximation(options.precision===undefined?4:options.precision),alpha=Math.SQRT1_2;
      var gap=alpha-q.value,lo=q.value-gap,hi=alpha+gap,X=function(x){return 60+640*(x-lo)/(hi-lo);};
      line(60,160,700,160);dot(X(q.value),160,true,{"data-rational-point":q.n});dot(X(alpha),160,false,{"data-irrational-target":""});
      text(380,87,"实线局部放大：绿色 qₙ∈Q，空心 α=1/√2 不在 Q 中",14);
      text(X(q.value),123,"q_"+q.n+"="+q.decimal,14);
      text(X(alpha),207,"α≈0.7071067812",14);
      text(60,247,lo.toFixed(q.n+2),12,"start");text(700,247,hi.toFixed(q.n+2),12,"end");
      text(380,285,"qₙ="+q.numerator+"/"+q.denominator+"；0<α−qₙ<10^(−"+q.n+")。",14);
      text(380,321,"qₙ→α；任何子列在实线中的极限仍是这个空间外的点。",14);
      text(380,351,"窗口按 qₙ 与 α 的间距缩放；刻度显示当前真实坐标范围。",12);return;
    }
    if(model.id==="omega-one"){
      var labels=[["任取一个序列 αₙ","每个 αₙ 都是可数序数"],["β=supₙ αₙ < ω₁","可数个可数初段的并仍可数"],["在 [0,β] 中","取单调子列，极限仍在空间内"]];
      labels.forEach(function(row,i){var x=24+i*246;svg.appendChild(svgElement(doc,"rect",{x:x,y:81,width:224,height:102,rx:5,fill:"var(--bg)",stroke:"var(--ccc-blue)"}));text(x+112,118,row[0],15);text(x+112,152,row[1],12);if(i<2)text(x+235,136,"→",18);});
      text(380,235,"开覆盖：[0,α)，0<α<ω₁；有限子族最大指标为 α_max。",14);
      text(380,274,"它们的并只有 [0,α_max)，仍漏掉 α_max∈[0,ω₁)。",14);
      text(380,326,"ω₁ 不属于空间。这是论证流程，不是有限点列或距离图。",14);return;
    }
    text(380,77,"任取子列 x_(nₖ)，选择坐标 A={n₂,n₄,n₆,…}",15);
    for(var i=0;i<6;i++){
      var x=62+i*110;
      svg.appendChild(svgElement(doc,"rect",{x:x,y:119,width:96,height:105,fill:"var(--bg)",stroke:"var(--border)"}));
      text(x+48,151,"k="+(i+1),14);text(x+48,199,i%2===0?"0":"1",22);
    }
    text(380,270,"在这个坐标，任意晚仍有 0 与 1；所以所取子列不能收敛。",14);
    text(380,310,"每个因子紧致 → 全积紧致（Tychonoff）；上表只显示无限构造的前六项。",13);
    text(380,348,"一个适配子列的坐标，已经足以否定积中的收敛。",14);
  }

  function modelFigure(doc,model,uid){
    var box=element(doc,"section",{"aria-label":"当前模型的图与尺度"}),options={N:8,epsilon:.02,precision:4};
    var svg=svgElement(doc,"svg",{className:"ccc-svg",role:"img","aria-labelledby":uid+"-title "+uid+"-desc"});
    var frame=element(doc,"div",{className:"ccc-frame",role:"region",tabindex:"0","aria-label":"拓扑空间模型图"},svg);
    var choices=model.id==="sine-closure"?[[".1","0.1"],[".05","0.05"],[".02","0.02"],[".01","0.01"],[".005","0.005"]]
      :model.id==="rational-subspace"?range(8).map(function(i){return [String(i+1),String(i+1)];})
      :model.id==="open-interval"?[["2","2"],["4","4"],["8","8"],["16","16"],["32","32"],["100","100"]]:null;
    if(choices){
      var key=model.id==="sine-closure"?"epsilon":model.id==="rational-subspace"?"precision":"N";
      var label=key==="epsilon"?"正弦曲线截断 ε":key==="precision"?"有理逼近小数位 n":"有限子族最大指标 N";
      var select=element(doc,"select",{"aria-label":label});
      choices.forEach(function(c){select.appendChild(element(doc,"option",{value:c[0],text:c[1]}));});select.value=String(options[key]);
      // Decimal string spelling differs for epsilon options; use numeric equality.
      for(var i=0;i<select.options.length;i++)if(Number(select.options[i].value)===options[key])select.selectedIndex=i;
      select.addEventListener("change",function(){options[key]=Number(this.value);renderModelSvg(doc,svg,model,uid,options);});
      box.appendChild(element(doc,"label",{},[label,select]));
    }
    box.appendChild(frame);renderModelSvg(doc,svg,model,uid,options);return box;
  }

  function coverageWorkbench(doc,uid){
    var state={m:6,k:26,selected:range(7)},box=element(doc,"section",{className:"ccc-workbench","aria-label":"闭区间有限覆盖工作台"});
    box.appendChild(element(doc,"h4",{text:"区间覆盖工作台：检查端点，再删冗余成员"}));
    box.appendChild(element(doc,"p",{className:"ccc-note",text:"这里单独在[0,1]上计算给定开覆盖，不模拟上方的不可数模型。U_j=(j/m−r,j/m+r)∩[0,1]，r=k/(20m)。实心端点属于集合，空心端点不属于。先预测半径刚好等于间距一半时能否覆盖，再调 k=10 核对。"}));
    var controls=element(doc,"div",{className:"ccc-controls"}),ms=element(doc,"select",{"aria-label":"覆盖分格数 m"}),ks=element(doc,"input",{type:"range",min:1,max:30,step:1,value:26,"aria-label":"半径整数 k"}),label=element(doc,"output");
    range(12).forEach(function(i){ms.appendChild(element(doc,"option",{value:String(i+1),text:String(i+1)}));});ms.value="6";
    controls.appendChild(element(doc,"label",{},["分格数 m",ms]));controls.appendChild(element(doc,"label",{},["半径 k",ks,label]));box.appendChild(controls);
    var buttons=element(doc,"div",{className:"ccc-members",role:"group","aria-label":"选择覆盖成员"}),body=element(doc,"div",{"aria-live":"polite"});box.appendChild(buttons);
    var prune=element(doc,"button",{type:"button",text:"删去冗余成员"}),all=element(doc,"button",{type:"button",text:"选回全部成员"});box.appendChild(element(doc,"div",{className:"ccc-actions"},[prune,all]));box.appendChild(body);
    function members(focus){
      clear(buttons);range(state.m+1).forEach(function(j){var button=element(doc,"button",{type:"button","aria-pressed":state.selected.indexOf(j)>=0?"true":"false","data-cover-index":j,text:"U_"+j});
        button.addEventListener("click",function(){state.selected=state.selected.indexOf(j)>=0?state.selected.filter(function(v){return v!==j;}):state.selected.concat(j).sort(function(a,b){return a-b;});members(j);render();});buttons.appendChild(button);
      });if(focus!==undefined)buttons.querySelector('[data-cover-index="'+focus+'"]').focus();
    }
    function render(){
      var report=coverReport(state.m,state.k,state.selected),D=report.denominator;clear(body);
      label.textContent="k="+state.k+"，r="+state.k+"/"+D+"；相邻中心间距 1/"+state.m;
      body.appendChild(element(doc,"p",{"data-cover-result":"",text:report.covers?"所选 "+state.selected.length+" 个成员覆盖整个[0,1]。":"未覆盖：点 x="+report.witness.numerator+"/"+report.witness.denominator+" 属于[0,1]，却不在任何所选开区间里。"}));
      var height=120+34*(state.m+1),svg=svgElement(doc,"svg",{className:"ccc-svg",role:"img",viewBox:"0 0 760 "+height,"aria-label":"各开区间与所选子覆盖的准确端点"});
      var X=function(n){return 90+620*n/D;};
      svg.appendChild(svgElement(doc,"line",{x1:90,y1:35,x2:710,y2:35,stroke:"var(--fg)","stroke-width":2}));
      [0,D].forEach(function(n){svg.appendChild(svgElement(doc,"circle",{cx:X(n),cy:35,r:4,fill:"var(--fg)"}));svg.appendChild(svgElement(doc,"text",{x:X(n),y:23,"text-anchor":"middle","font-size":13,text:n===0?"0":"1"}));});
      report.intervals.forEach(function(I){var y=77+34*I.index,left=Math.max(0,I.lo),right=Math.min(D,I.hi),color=I.selected?"var(--ccc-blue)":"var(--ccc-muted)";
        svg.appendChild(svgElement(doc,"text",{x:65,y:y+5,"font-size":13,"text-anchor":"end",text:"U_"+I.index}));
        svg.appendChild(svgElement(doc,"line",{x1:X(left),y1:y,x2:X(right),y2:y,stroke:color,"stroke-width":I.selected?4:1.5,"stroke-opacity":I.selected?1:.45,"data-interval":I.index}));
        [[left,I.lo<0],[right,I.hi>D]].forEach(function(end){svg.appendChild(svgElement(doc,"circle",{cx:X(end[0]),cy:y,r:4,stroke:color,"stroke-width":2,fill:end[1]?color:"var(--bg)"}));});
      });
      if(report.witness){svg.appendChild(svgElement(doc,"line",{x1:X(report.witness.value*D),y1:39,x2:X(report.witness.value*D),y2:height-26,stroke:"var(--ccc-red)","stroke-width":1.5,"stroke-dasharray":"4 4","data-uncovered-point":report.witness.value}));}
      body.appendChild(element(doc,"div",{className:"ccc-frame",role:"region",tabindex:"0","aria-label":"可滚动的区间覆盖图"},svg));
      var table=element(doc,"table");table.appendChild(element(doc,"caption",{text:"成员的严格不等式：端点数字都以共同分母 "+D+" 表示"}));
      table.appendChild(element(doc,"thead",{},element(doc,"tr",{},["成员","原始开区间","选中？"].map(function(v){return element(doc,"th",{scope:"col",text:v});}))));
      var tbody=element(doc,"tbody");report.intervals.forEach(function(I){tbody.appendChild(element(doc,"tr",{},["U_"+I.index,"("+I.lo+"/"+D+", "+I.hi+"/"+D+") ∩ [0,1]",I.selected?"是":"否"].map(function(v){return element(doc,"td",{text:v});})));});table.appendChild(tbody);
      body.appendChild(element(doc,"div",{className:"ccc-table-wrap",role:"region",tabindex:"0","aria-label":"区间覆盖成员表"},table));
      body.appendChild(element(doc,"p",{className:"ccc-note",text:"“删去冗余成员”得到按包含关系不可再删的子覆盖，不保证成员数最少。若当前没有覆盖，按钮保留原选择和漏点。一个有限族的检查不能替代任意开覆盖的紧致定义。"}));
    }
    ms.addEventListener("change",function(){state.m=Number(this.value);state.selected=range(state.m+1);members();render();});
    ks.addEventListener("input",function(){state.k=Number(this.value);render();});
    prune.addEventListener("click",function(){state.selected=pruneCover(state.m,state.k,state.selected).selected;members();render();});
    all.addEventListener("click",function(){state.selected=range(state.m+1);members();render();});members();render();return box;
  }

  function metric(doc, label) {
    var value = element(doc, "strong", { text: "—" });
    return { node: element(doc, "div", { className: "ccc-metric" }, [element(doc, "span", { text: label }), value]), value: value };
  }

  function predictionSpecs(model) {
    return [
      {
        key: "compact",
        prompt: model.label + " 开覆盖紧致吗？",
        expected: model.compact ? "yes" : "no",
        choices: [{ value: "yes", label: "是" }, { value: "no", label: "不是" }]
      },
      {
        key: "sequential",
        prompt: model.label + " 序列紧致吗？",
        expected: model.sequential ? "yes" : "no",
        choices: [{ value: "yes", label: "是" }, { value: "no", label: "不是" }]
      },
      {
        key: "path",
        prompt: "当前模型的连通性 / 路径连通性是？",
        expected: model.connected && model.pathConnected ? "both" : (model.connected ? "connected-only" : "neither"),
        choices: [
          { value: "both", label: "两者都有" },
          { value: "connected-only", label: "连通但非路径连通" },
          { value: "neither", label: "两者都没有" }
        ]
      }
    ];
  }

  function renderPredictions(state, refs, model) {
    predictionSpecs(model).forEach(function (spec, index) {
      var question = refs.questions[index];
      question.legend.textContent = spec.prompt;
      question.buttons.forEach(function (button) {
        var selected = state.predictions[spec.key] === button.value;
        button.node.setAttribute("aria-pressed", selected ? "true" : "false");
        if (state.revealed) {
          var correct = button.value === spec.expected;
          button.node.textContent = (correct ? "✓ " : "") + button.label;
          button.node.className = correct ? "ccc-pass" : (selected ? "ccc-warn" : "");
        } else {
          button.node.textContent = button.label;
          button.node.className = "";
        }
      });
    });
  }

  function renderEvidence(doc, refs, model, mapId) {
    var image = imageReport(model, mapId);
    var metrics = [
      metric(doc, "开覆盖紧致"),
      metric(doc, "序列紧致"),
      metric(doc, "度量空间"),
      metric(doc, "连通"),
      metric(doc, "路径连通"),
      metric(doc, "当前连续像")
    ];
    clear(refs.metrics);
    metrics.forEach(function (item) { refs.metrics.appendChild(item.node); });
    metrics[0].value.textContent = model.compact ? "是" : "否";
    metrics[1].value.textContent = model.sequential ? "是" : "否";
    metrics[2].value.textContent = model.metric ? "是" : "否";
    metrics[3].value.textContent = model.connected ? "是" : "否";
    metrics[4].value.textContent = model.pathConnected ? "是" : "否";
    metrics[5].value.textContent = image.known ? (image.compact ? "紧" : "非紧") : "当前未定义此映射";

    if(refs.visualModel!==model.id){clear(refs.visual);refs.visual.appendChild(modelFigure(doc,model,refs.uid));refs.visualModel=model.id;}

    var relation = model.metric
      ? (model.compact === model.sequential ? "本模型是度量空间，二者等价" : "状态不同；需检查模型")
      : "一般空间：序列紧致不能替代开覆盖紧致";
    var pathRelation = model.connected && !model.pathConnected
      ? "连通但非路径连通，构成反例"
      : (model.pathConnected ? "路径连通，因此连通" : "不连通，当然不路径连通");
    var rows = [
      ["开覆盖紧致", model.compact ? "是" : "否", model.coverCertificate],
      ["序列紧致", model.sequential ? "是" : "否", model.sequenceCertificate],
      ["二者关系", relation, model.metric ? "度量空间条件已声明" : "非度量空间的边界"],
      ["连通 / 路径连通", (model.connected ? "连通" : "不连通") + " / " + (model.pathConnected ? "路径连通" : "非路径连通"), pathRelation],
      ["连续像", image.text, "连续像定理只从紧致源空间推出紧致像"]
    ];
    clear(refs.table);
    var table = element(doc, "table");
    table.appendChild(element(doc, "caption", { text: "拓扑性质证书：定义、条件与边界分栏" }));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
      element(doc, "th", { scope: "col", text: "项目" }),
      element(doc, "th", { scope: "col", text: "结果" }),
      element(doc, "th", { scope: "col", text: "证书读法" })
    ])));
    var body = element(doc, "tbody");
    rows.forEach(function (row) {
      body.appendChild(element(doc, "tr", {}, row.map(function (value) { return element(doc, "td", { text: value }); })));
    });
    table.appendChild(body);
    refs.table.appendChild(table);
    refs.certificate.className = "ccc-certificate" + (model.connected && !model.pathConnected ? " ccc-fail" : "");
    refs.certificate.textContent = model.connected && !model.pathConnected
      ? "当前模型给出关键失败边界：连通不推出路径连通。紧致性与序列紧致也必须先声明空间属于哪一类。"
      : "当前空间的性质与理由已列出；这些无限空间的结论来自证明，不是从有限张图中枚举得出。";
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument;
    var uid = "ccc-" + (++INSTANCE);
    var state = { modelId: "closed-interval", mapId: "square", revealed: false, predictions: {}, feedback: "" };
    var refs = { questions: [], uid: uid };
    installStyles(doc);

    var shell = element(doc, "div", { className: "ccc-lab" });
    shell.appendChild(element(doc, "h3", { text: "紧致与连通实验：同一张性质表不能混用判据" }));
    shell.appendChild(element(doc, "p", { className: "ccc-note", text: "选择一个空间模型和连续像演示；先预测，再读取开覆盖、序列、连通与路径连通证书。图形只作直觉，模型条件决定定理能否使用。" }));

    var modelSelect = element(doc, "select", { "aria-label": "拓扑空间模型" });
    MODELS.forEach(function (model) {
      modelSelect.appendChild(element(doc, "option", { value: model.id, text: model.label }));
    });
    var mapSelect = element(doc, "select", { "aria-label": "连续像演示" });
    mapSelect.appendChild(element(doc, "option", { value: "square", text: "连续像：f(t)=t^2 / 投影" }));
    mapSelect.appendChild(element(doc, "option", { value: "reciprocal", text: "边界像：f(t)=1/t（仅开区间）" }));
    mapSelect.appendChild(element(doc,"option",{value:"constant",text:"常值像：f≡0（所有模型）"}));
    shell.appendChild(element(doc, "div", { className: "ccc-controls" }, [
      element(doc, "div", { className: "ccc-field" }, [element(doc, "label", { htmlFor: uid + "-model", text: "空间模型" }), modelSelect]),
      element(doc, "div", { className: "ccc-field" }, [element(doc, "label", { htmlFor: uid + "-map", text: "连续像演示" }), mapSelect])
    ]));
    modelSelect.id = uid + "-model";
    mapSelect.id = uid + "-map";

    var gate = element(doc, "div", { className: "ccc-gate" });
    for (let questionIndex = 0; questionIndex < 3; questionIndex += 1) {
      var fieldset = element(doc, "fieldset");
      var legend = element(doc, "legend", { text: "预测" });
      var options = element(doc, "div", { className: "ccc-options" });
      refs.questions.push({ legend: legend, buttons: [] });
      fieldset.appendChild(legend);
      fieldset.appendChild(options);
      gate.appendChild(fieldset);
      (questionIndex === 2
        ? [{ value: "both", label: "连通且路径连通" }, { value: "connected-only", label: "连通但非路径连通" }, { value: "neither", label: "两者都没有" }]
        : [{ value: "yes", label: "是" }, { value: "no", label: "不是" }]
      ).forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice.label });
        button.addEventListener("click", function () {
          var specs = predictionSpecs(modelById(state.modelId));
          state.predictions[specs[questionIndex].key] = choice.value;
          state.revealed=false;
          state.feedback = "";
          render();
        });
        refs.questions[questionIndex].buttons.push({ value: choice.value, label: choice.label, node: button });
        options.appendChild(button);
      });
    }
    shell.appendChild(gate);

    var reveal = element(doc, "button", { type: "button", className: "ccc-primary", text: "核对预测并揭晓" });
    var reset = element(doc, "button", { type: "button", text: "重置实验" });
    var feedback = element(doc, "p", { className: "ccc-feedback", "aria-live": "polite" });
    shell.appendChild(element(doc, "div", { className: "ccc-actions" }, [reveal, reset]));
    shell.appendChild(feedback);

    var result = element(doc, "div", { className: "ccc-result", hidden: true,tabindex:"-1","aria-label":"紧致连通实验结果" });
    var metrics = element(doc, "div", { className: "ccc-metrics" });
    var table = element(doc, "div", { className: "ccc-table-wrap",role:"region",tabindex:"0","aria-label":"紧致连通定理与前提表" });
    var certificate = element(doc, "p", { className: "ccc-certificate" });
    var visual=element(doc,"div");result.appendChild(visual);refs.visual=visual;refs.visualModel=null;
    result.appendChild(metrics);
    result.appendChild(table);
    result.appendChild(certificate);
    result.appendChild(coverageWorkbench(doc,uid+"-cover"));
    shell.appendChild(result);
    refs.metrics = metrics;
    refs.table = table;
    refs.certificate = certificate;
    clear(root);
    root.appendChild(shell);

    function lock() {
      state.revealed = false;
      state.predictions = {};
      state.feedback = "";
      render();
    }

    modelSelect.addEventListener("change", function () {
      state.modelId = modelSelect.value;
      if(!imageReport(modelById(state.modelId),state.mapId).applicable)state.mapId="constant";
      lock();
    });
    mapSelect.addEventListener("change", function () {
      state.mapId = mapSelect.value;
      if (state.revealed) render();
    });
    reset.addEventListener("click", function () {
      state = { modelId: "closed-interval", mapId: "square", revealed: false, predictions: {}, feedback: "" };
      refs.visualModel=null;
      var oldWorkbench=result.querySelector(".ccc-workbench");oldWorkbench.replaceWith(coverageWorkbench(doc,uid+"-cover"));
      modelSelect.value = state.modelId;
      mapSelect.value = state.mapId;
      render();
      refs.questions[0].buttons[0].node.focus();
      announce(api, root, "紧致与连通实验已重置。");
    });
    reveal.addEventListener("click", function () {
      var model = modelById(state.modelId);
      var specs = predictionSpecs(model);
      if (!specs.every(function (spec) { return state.predictions[spec.key] !== undefined; })) {
        state.feedback = "请先完成三项预测。";
        render();
        return;
      }
      var correct = specs.filter(function (spec) { return state.predictions[spec.key] === spec.expected; }).length;
      state.revealed = true;
      state.feedback = "已揭晓：" + correct + "/" + specs.length + " 命中；现在把空间类别和结论一起读。";
      render();
      result.focus();
      announce(api, root, state.feedback);
    });

    function render() {
      var model = modelById(state.modelId);
      modelSelect.value = model.id;
      Array.from(mapSelect.options).forEach(function(option){option.disabled=!imageReport(model,option.value).applicable;});
      mapSelect.value = state.mapId;
      renderPredictions(state, refs, model);
      feedback.textContent = state.feedback;
      feedback.className = "ccc-feedback" + (state.feedback.indexOf("请先") === 0 ? " ccc-warn" : "");
      result.hidden = !state.revealed;
      if (state.revealed) renderEvidence(doc, refs, model, state.mapId);
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      assert(condition, message);
      checks += 1;
    }
    MODELS.forEach(function (model) {
      check(model.pathConnected ? model.connected : true, "path implies connected " + model.id);
      if (model.metric) check(model.compact === model.sequential, "metric equivalence " + model.id);
    });
    var closed = modelById("closed-interval");
    check(closed.compact && closed.sequential && closed.connected && closed.pathConnected, "closed interval certificate");
    var open = modelById("open-interval");
    check(!open.compact && !open.sequential && open.connected && open.pathConnected, "open interval boundary");
    var sine = modelById("sine-closure");
    check(sine.compact && sine.sequential && sine.connected && !sine.pathConnected, "sine curve boundary");
    var rationals = modelById("rational-subspace");
    check(!rationals.compact && !rationals.sequential && !rationals.connected, "rational subspace boundary");
    var ordinal = modelById("omega-one");
    check(!ordinal.metric && ordinal.sequential && !ordinal.compact, "ordinal separation");
    check(imageReport(closed, "square").compact === true, "compact continuous image");
    check(imageReport(open, "reciprocal").compact === false, "noncompact reciprocal image");
    check(imageReport(open, "square").compact === false, "noncompact square image");
    check(imageReport(closed, "reciprocal").known === false, "invalid reciprocal model boundary");
    check(imageReport(ordinal, "square").known === false, "untriggered image theorem");
    return { checks: checks, models: MODELS.length };
  }

  return {
    mount: mount,
    models: MODELS,
    imageReport: imageReport,
    modelById:modelById,
    coverReport:coverReport,
    pruneCover:pruneCover,
    openCoverReport:openCoverReport,
    sineSamples:sineSamples,
    rationalApproximation:rationalApproximation,
    renderModelSvg:renderModelSvg,
    selfTest: selfTest
  };
});

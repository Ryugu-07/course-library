(function (host) {
  "use strict";
  var NS = "http://www.w3.org/2000/svg", serial = 0;
  var MODES = Object.freeze(["angle", "slow", "fast", "almost-slow"]);
  var PRESETS = Object.freeze([
    {id:"round",label:"良态",kappa:4,beta:.8,rotation:35,angle:20,steps:18,expected:"converge"},
    {id:"ill",label:"病态",kappa:25,beta:1,rotation:-35,angle:25,steps:48,expected:"converge"},
    {id:"cautious",label:"保守小步",kappa:10,beta:.5,rotation:25,angle:40,steps:34,expected:"converge"},
    {id:"oscillate",label:"换号收敛",kappa:10,beta:1.85,rotation:28,angle:-20,steps:30,expected:"oscillate"},
    {id:"edge",label:"边界等幅",kappa:10,beta:2,rotation:28,angle:-20,steps:30,expected:"neutral"},
    {id:"diverge",label:"越界发散",kappa:10,beta:2.2,rotation:28,angle:-20,steps:30,expected:"diverge"},
    {id:"slow-only",label:"越界但只有慢轴",kappa:10,beta:2.4,rotation:28,angle:28,initial:"slow",steps:120,expected:"converge"},
    {id:"tiny-fast",label:"加入 10⁻¹⁴ 快轴",kappa:10,beta:2.4,rotation:28,angle:28,initial:"almost-slow",steps:120,expected:"diverge"}
  ].map(function(p){return Object.freeze(Object.assign({initial:"angle"},p));}));
  function finite(v,name,lo,hi) {
    if(typeof v!=="number" || !Number.isFinite(v) || v<lo || v>hi) throw new RangeError(name+" outside ["+lo+", "+hi+"]");
    return v;
  }
  function factors(c) {
    if(!c || typeof c!=="object") throw new TypeError("configuration required");
    var k=finite(c.kappa,"kappa",1,10000), b=finite(c.beta,"beta",0,3);
    return {mu:1,L:k,alpha:b/k,slow:1-b/k,fast:1-b};
  }
  function trig(degrees) {
    var d=((degrees%360)+360)%360;
    if(degrees%90===0){
      if(d===0)return [1,0]; if(d===90)return [0,1];
      if(d===180)return [-1,0]; if(d===270)return [0,-1];
    }
    // Use the original angle here: adding 360 can erase tiny nonzero angles.
    var t=degrees*Math.PI/180;return [Math.cos(t),Math.sin(t)];
  }
  function fromEigen(z,rotation) {
    var q=trig(rotation);return [q[0]*z[0]-q[1]*z[1],q[1]*z[0]+q[0]*z[1]];
  }
  function initial(c) {
    var mode=c.initial===undefined?"angle":c.initial;
    if(MODES.indexOf(mode)<0)throw new RangeError("unknown initial direction");
    if(mode==="slow")return [1,0];if(mode==="fast")return [0,1];
    if(mode==="almost-slow")return [Math.sqrt(1-1e-28),1e-14];
    return trig(c.angle-c.rotation);
  }
  function simulate(c) {
    var f=factors(c);finite(c.rotation,"rotation",-90,90);finite(c.angle,"angle",-180,180);
    finite(c.steps,"steps",1,500);if(!Number.isInteger(c.steps))throw new RangeError("steps must be integer");
    var z=initial(c), start=z.slice(), e0=.5*(z[0]*z[0]+f.L*z[1]*z[1]),d0=Math.hypot(z[0],z[1]),rows=[];
    for(var k=0;k<=c.steps;k++){
      var x=fromEigen(z,c.rotation), e=.5*(z[0]*z[0]+f.L*z[1]*z[1]),d=Math.hypot(z[0],z[1]);
      rows.push({k:k,x:x[0],y:x[1],slow:z[0],fast:z[1],distance:d,relativeDistance:d/d0,energy:e,relative:e/e0,gradNorm:Math.hypot(z[0],f.L*z[1])});
      z=[f.slow*z[0],f.fast*z[1]];
    }
    var active=[];if(start[0]!==0)active.push(f.slow);if(start[1]!==0)active.push(f.fast);
    var rhoActive=Math.max.apply(null,active.map(Math.abs)),rhoAll=Math.max(Math.abs(f.slow),Math.abs(f.fast));
    var kind=rhoActive>1?"diverge":rhoActive===1?"neutral":active.some(function(r){return r<0;})?"oscillate":"converge";
    return {factors:f,rows:rows,rhoAll:rhoAll,rhoActive:rhoActive,kind:kind,
      allInitialConverge:c.beta>0&&c.beta<2,
      monotoneEnergy:rows.every(function(r,i){return !i||r.energy<=rows[i-1].energy;})};
  }
  function optimumBeta(k){finite(k,"kappa",1,10000);return 2*k/(k+1);}
  function optimumRho(k){finite(k,"kappa",1,10000);return (k-1)/(k+1);}
  function format(v,digits){
    if(!Number.isFinite(v))throw new RangeError("nonfinite display");
    if(v===0)return "0";
    if(Math.abs(v)<.001||Math.abs(v)>=1e5)return v.toExponential(5);
    var s=v.toFixed(digits===undefined?4:digits);return s.indexOf(".")<0?s:s.replace(/0+$/,"").replace(/\.$/,"");
  }
  function kindLabel(k){return {converge:"不换号收敛",oscillate:"换号但收敛",neutral:"有界但不趋零",diverge:"增长发散"}[k];}
  function el(doc,tag,cls,text){var e=doc.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
  function sv(doc,tag,attrs,text){var e=doc.createElementNS(NS,tag);Object.keys(attrs||{}).forEach(function(k){e.setAttribute(k,String(attrs[k]));});if(text!==undefined)e.textContent=text;return e;}
  function add(parent,doc,tag,attrs,text){var e=sv(doc,tag,attrs,text);parent.appendChild(e);return e;}
  function path(points,mx,my){return points.map(function(p,i){return(i?"L":"M")+mx(p)+" "+my(p);}).join(" ");}
  function contourSvg(doc,c,r,local){
    var s=sv(doc,"svg",{viewBox:"0 0 600 540",role:"img","aria-label":"等比例坐标下的二次型等高线与完整迭代数据"});
    add(s,doc,"title",{},"旋转主轴、等高线与梯度下降轨迹");
    var extent=1.25;
    if(!local){extent=Math.max(extent,1.08*Math.sqrt(2*r.rows[0].energy));r.rows.forEach(function(p){extent=Math.max(extent,1.08*Math.abs(p.x),1.08*Math.abs(p.y));});}
    var mx=function(x){return 300+200*x/extent;},my=function(y){return 274-200*y/extent;};
    s.setAttribute("data-extent",String(extent));
    add(s,doc,"text",{x:30,y:26,"font-size":17,"font-weight":700},local?"初始视野：窗外轨迹真实裁切":"完整轨迹：横纵轴单位长度相同");
    add(s,doc,"text",{x:30,y:51,"font-size":13},"慢轴 μ=1；快轴 L="+format(c.kappa)+"；四条曲线为初始能量的 4%、16%、45%、100%");
    var defs=add(s,doc,"defs"),id="opl-clip-"+(++serial),clip=add(defs,doc,"clipPath",{id:id});
    add(clip,doc,"rect",{x:100,y:74,width:400,height:400});
    [-1,-.5,0,.5,1].forEach(function(t){
      var v=t*extent;add(s,doc,"line",{x1:mx(v),x2:mx(v),y1:74,y2:474,class:"opl-grid"});
      add(s,doc,"line",{x1:100,x2:500,y1:my(v),y2:my(v),class:"opl-grid"});
      add(s,doc,"text",{x:mx(v),y:493,"text-anchor":"middle","font-size":12},format(v,2));
      add(s,doc,"text",{x:93,y:my(v)+4,"text-anchor":"end","font-size":12},format(v,2));
    });
    var g=add(s,doc,"g",{"clip-path":"url(#"+id+")"});
    [0,1].forEach(function(axis){
      var a=[0,0],b=[0,0];a[axis]=-extent*2;b[axis]=extent*2;
      var p=fromEigen(a,c.rotation),q=fromEigen(b,c.rotation);
      add(g,doc,"line",{x1:mx(p[0]),y1:my(p[1]),x2:mx(q[0]),y2:my(q[1]),class:"opl-axis","data-axis":axis});
    });
    [.04,.16,.45,1].forEach(function(frac){
      var radius=Math.sqrt(2*r.rows[0].energy*frac),points=[];
      for(var i=0;i<=160;i++){var t=2*Math.PI*i/160;points.push(fromEigen([radius*Math.cos(t),radius*Math.sin(t)/Math.sqrt(c.kappa)],c.rotation));}
      add(g,doc,"path",{d:path(points,function(p){return mx(p[0]);},function(p){return my(p[1]);}),class:"opl-contour","data-fraction":frac});
    });
    add(g,doc,"path",{d:path(r.rows,function(p){return mx(p.x);},function(p){return my(p.y);}),class:"opl-path"});
    r.rows.forEach(function(p){add(g,doc,"circle",{cx:mx(p.x),cy:my(p.y),r:2,class:"opl-iterate","data-k":p.k});});
    var first=r.rows[0],last=r.rows[r.rows.length-1];
    add(g,doc,"circle",{cx:mx(first.x),cy:my(first.y),r:7,class:"opl-start"});
    add(g,doc,"circle",{cx:mx(last.x),cy:my(last.y),r:4,class:"opl-end"});
    var outside=r.rows.filter(function(p){return Math.abs(p.x)>extent||Math.abs(p.y)>extent;}).length;
    add(s,doc,"text",{x:300,y:518,"text-anchor":"middle","font-size":13},"绿环：x₀；红点：xₙ；虚线：主轴；窗外迭代点 "+outside+" 个");
    add(s,doc,"text",{x:507,y:474,"font-size":13},"x₁");add(s,doc,"text",{x:100,y:68,"font-size":13},"x₂");
    return s;
  }
  function energySvg(doc,r){
    var s=sv(doc,"svg",{viewBox:"0 0 600 440",role:"img","aria-label":"相对距离与相对目标值的完整对数曲线，浮点零另列"});
    add(s,doc,"title",{},"距离与目标值：正数取常用对数，零另列");
    var logs=[];r.rows.forEach(function(p){[p.relative,p.relativeDistance].forEach(function(v){if(v>0)logs.push(Math.log10(v));});});
    var lo=Math.min(-1,Math.min.apply(null,logs)),hi=Math.max(0,Math.max.apply(null,logs));
    var mx=function(k){return 82+460*k/(r.rows.length-1);},my=function(v){return v===0?362:320-240*(Math.log10(v)-lo)/(hi-lo);};
    s.setAttribute("data-log-min",lo);s.setAttribute("data-log-max",hi);
    add(s,doc,"text",{x:30,y:26,"font-size":17,"font-weight":700},"两本账：log₁₀(相对量)，不设人为误差地板");
    add(s,doc,"text",{x:30,y:52,"font-size":13},"金色实心：f/f₀；蓝色空心：‖x‖/‖x₀‖；刻度数值是对数");
    [0,.25,.5,.75,1].forEach(function(t){
      var value=lo+t*(hi-lo),y=320-240*t;
      add(s,doc,"line",{x1:82,x2:542,y1:y,y2:y,class:"opl-grid"});
      add(s,doc,"text",{x:72,y:y+4,"text-anchor":"end","font-size":12},format(value,2));
    });
    add(s,doc,"line",{x1:82,x2:542,y1:362,y2:362,class:"opl-grid"});
    add(s,doc,"text",{x:72,y:366,"text-anchor":"end","font-size":12},"浮点零");
    ["relative","relativeDistance"].forEach(function(key){
      var d="",prev=false;
      r.rows.forEach(function(p){if(p[key]===0){prev=false;return;}d+=(prev?" L":" M")+mx(p.k)+" "+my(p[key]);prev=true;});
      add(s,doc,"path",{d:d,class:key==="relative"?"opl-energy":"opl-distance","data-series":key});
      r.rows.forEach(function(p){add(s,doc,"circle",{cx:mx(p.k),cy:my(p[key]),r:key==="relative"?2.3:4,class:key==="relative"?"opl-energy-dot":"opl-distance-dot","data-series":key,"data-k":p.k,"data-value":p[key]});});
    });
    [0,.5,1].forEach(function(t){add(s,doc,"text",{x:mx(t*(r.rows.length-1)),y:388,"text-anchor":"middle","font-size":12},format(t*(r.rows.length-1),1));});
    add(s,doc,"text",{x:580,y:388,"font-size":13},"k");
    add(s,doc,"text",{x:30,y:420,"font-size":13},"浮点零可能来自精确消去或下溢；不能单凭它证明有限步精确收敛。");
    return s;
  }
  var CSS=[
    ".opl-lab{max-width:100%;min-width:0;color:var(--fg)}.opl-lab *{box-sizing:border-box}.opl-lab [hidden]{display:none!important}",
    ".opl-note,.opl-feedback{font-size:14px;line-height:1.75;color:var(--fg-soft)}.opl-lab button{min-height:44px}",
    ".opl-presets,.opl-choice,.opl-modes,.opl-actions{display:flex;flex-wrap:wrap;gap:8px}.opl-presets button,.opl-modes button,.opl-choice button{flex:1 1 180px}",
    ".opl-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:16px 0}.opl-control{display:grid;gap:6px;min-width:0}.opl-control input{width:100%;min-width:0;margin:0}.opl-control label{font-weight:700}.opl-control output{color:var(--accent)}",
    ".opl-predict{padding:14px;border-left:3px solid var(--cl-gold);background:var(--bg);margin:16px 0}.opl-choice{margin:12px 0}",
    ".opl-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:10px;margin:16px 0}.opl-metric{padding:10px;border-top:2px solid var(--border);background:var(--bg)}.opl-metric span,.opl-metric strong{display:block;overflow-wrap:anywhere}.opl-metric span{font-size:13px;color:var(--fg-soft)}",
    ".opl-chart,.opl-ledger{max-width:100%;overflow:auto;margin:16px 0;border:1px solid var(--border);border-radius:6px}.opl-chart svg{display:block;width:100%;min-width:600px;height:auto;background:var(--bg)}.opl-lab svg text{fill:var(--fg);font-family:inherit;letter-spacing:0}",
    ".opl-grid{stroke:var(--border);stroke-width:1;fill:none}.opl-axis{stroke:var(--fg-soft);stroke-width:1.2;stroke-dasharray:6 5}.opl-contour{stroke:var(--fg-soft);stroke-width:1;fill:none;opacity:.6}",
    ".opl-path,.opl-distance{stroke:var(--accent);stroke-width:2;fill:none}.opl-energy{stroke:var(--cl-gold);stroke-width:2;fill:none}.opl-iterate{fill:var(--accent)}.opl-start{fill:var(--bg);stroke:var(--cl-green);stroke-width:3}.opl-end{fill:var(--cl-red)}",
    ".opl-energy-dot{fill:var(--cl-gold)}.opl-distance-dot{fill:none;stroke:var(--accent);stroke-width:1.3}.opl-ledger{max-height:420px}.opl-lab table{min-width:1080px;width:100%;font-size:13px;border-collapse:collapse;font-variant-numeric:tabular-nums}.opl-lab th,.opl-lab td{padding:8px;border-bottom:1px solid var(--border);text-align:left}.opl-lab th{position:sticky;top:0;background:var(--bg)}",
    ".opl-lab :focus-visible{outline:3px solid var(--cl-focus);outline-offset:3px}.opl-pass{color:var(--cl-green)}.opl-warn{color:var(--cl-red)}",
    "@media(max-width:760px){.opl-controls{grid-template-columns:1fr}}",
    "@media(prefers-reduced-motion:reduce){html:has(.opl-lab){scroll-behavior:auto!important}.opl-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");
  function mount(root,api){
    var doc=root.ownerDocument;if(!doc.getElementById("optimization-landscape-styles")){var style=el(doc,"style");style.id="optimization-landscape-styles";style.textContent=CSS;doc.head.appendChild(style);}
    var state=Object.assign({},PRESETS[1]),base=PRESETS[1],prediction=null,revealed=false,local=false,prefix="opl-"+(++serial);
    var shell=el(doc,"div","opl-lab"),inputs={},pb=[],mb=[],cb=[];
    shell.appendChild(el(doc,"p","opl-note","先比较所有初值的保证与当前初值的行为。非零的 10⁻¹⁴ 模态也会参与判断；它可能在很久以后才显露增长。"));
    function button(parent,label,fn){var b=el(doc,"button","",label);b.type="button";b.addEventListener("click",fn);parent.appendChild(b);return b;}
    function relock(){prediction=null;revealed=false;}
    var presets=el(doc,"div","opl-presets");PRESETS.forEach(function(p){var b=button(presets,p.label,function(){base=p;state=Object.assign({},p);local=false;relock();render();});pb.push({id:p.id,node:b});});shell.appendChild(presets);
    var controls=el(doc,"div","opl-controls");
    [["kappa","条件数 κ",1,100,1],["beta","无量纲步长 β=αL",0,3,.01],["rotation","主轴旋转角 θ",-90,90,1],["angle","初始方向角 φ",-180,180,1],["steps","迭代步数",1,120,1]].forEach(function(a){
      var wrap=el(doc,"div","opl-control"),label=el(doc,"label","",a[1]+"："),out=el(doc,"output"),input=el(doc,"input");
      input.type="range";input.id=prefix+"-"+a[0];input.min=a[2];input.max=a[3];input.step=a[4];input.setAttribute("aria-label",a[1]);label.htmlFor=input.id;out.htmlFor=input.id;label.appendChild(out);
      input.addEventListener("input",function(){state[a[0]]=Number(input.value);state.id="custom";relock();render();});
      wrap.appendChild(label);wrap.appendChild(input);controls.appendChild(wrap);inputs[a[0]]={input:input,output:out};
    });shell.appendChild(controls);
    shell.appendChild(el(doc,"p","opl-note","初始主轴分量 z₀（选择精确主轴时不使用角度近似）："));
    var modes=el(doc,"div","opl-modes");
    [["angle","由角度决定"],["slow","精确慢轴 (1,0)"],["fast","精确快轴 (0,1)"],["almost-slow","慢轴 + 10⁻¹⁴ 快轴"]].forEach(function(a){var b=button(modes,a[1],function(){state.initial=a[0];state.id="custom";relock();render();});mb.push({id:a[0],node:b});});shell.appendChild(modes);
    var initNote=el(doc,"p","opl-note opl-initial");shell.appendChild(initNote);
    var predict=el(doc,"div","opl-predict");predict.appendChild(el(doc,"strong","","先预测：当前初始方向的整体行为是什么？"));
    var choices=el(doc,"div","opl-choice");["converge","oscillate","neutral","diverge"].forEach(function(k){var b=button(choices,kindLabel(k),function(){prediction=k;revealed=false;render();});cb.push({id:k,node:b});});predict.appendChild(choices);
    var actions=el(doc,"div","opl-actions"),check=button(actions,"核对预测",function(){if(!prediction)return;revealed=true;render();results.focus();}),reset=button(actions,"重置本预设",function(){state=Object.assign({},base);local=false;relock();render();cb[0].node.focus();});
    var feedback=el(doc,"p","opl-feedback");feedback.setAttribute("aria-live","polite");predict.appendChild(actions);predict.appendChild(feedback);shell.appendChild(predict);
    var results=el(doc,"div","opl-results");results.tabIndex=-1;results.setAttribute("aria-label","实验结果");shell.appendChild(results);root.replaceChildren(shell);
    function metric(parent,label,value){var m=el(doc,"div","opl-metric");m.appendChild(el(doc,"span","",label));m.appendChild(el(doc,"strong","",value));parent.appendChild(m);}
    function region(cls,label){var e=el(doc,"div",cls);e.tabIndex=0;e.setAttribute("role","region");e.setAttribute("aria-label",label);return e;}
    function render(){
      Object.keys(inputs).forEach(function(k){inputs[k].input.value=state[k];inputs[k].output.textContent=String(state[k])+(k==="angle"||k==="rotation"?"°":"");});
      inputs.angle.input.disabled=state.initial!=="angle";
      pb.forEach(function(b){b.node.setAttribute("aria-pressed",String(b.id===state.id));});mb.forEach(function(b){b.node.setAttribute("aria-pressed",String(b.id===state.initial));});cb.forEach(function(b){b.node.setAttribute("aria-pressed",String(b.id===prediction));});
      var r=simulate(state),f=r.factors,z=r.rows[0];
      initNote.textContent="z₀ = ("+format(z.slow)+", "+format(z.fast)+")。数值采用双精度；微小非零值以科学记数法显示。";
      check.disabled=!prediction||revealed;results.hidden=!revealed;
      if(!revealed){feedback.className="opl-feedback";feedback.textContent=prediction?"预测已记录，核对后查看全部数据。":"先选一个判断。";return;}
      feedback.className="opl-feedback "+(prediction===r.kind?"opl-pass":"opl-warn");
      feedback.textContent=(prediction===r.kind?"预测命中。":"请重新比较活跃模态。")+" 当前为“"+kindLabel(r.kind)+"”；这里的分类按双精度乘子，等号边界单列。";
      if(api&&api.announce)api.announce(root,feedback.textContent);results.replaceChildren();
      var metrics=el(doc,"div","opl-metrics");
      metric(metrics,"慢轴乘子 1−αμ",String(f.slow));metric(metrics,"快轴乘子 1−αL",String(f.fast));metric(metrics,"全矩阵谱半径",String(r.rhoAll));metric(metrics,"当前活跃模态最大模",String(r.rhoActive));
      metric(metrics,"理论上所有初值趋零？",r.allInitialConverge?"是：0<β<2":"无此保证");metric(metrics,"本次目标值",r.monotoneEnergy?"逐步不增":"存在上升");metric(metrics,"最坏方向最优 β*",format(optimumBeta(state.kappa)));metric(metrics,"相应最坏收缩因子",format(optimumRho(state.kappa)));results.appendChild(metrics);
      results.appendChild(el(doc,"p","opl-note","活跃模态指初始分量严格非零的方向。全矩阵谱半径不随初值改变。β=2 且含快轴时等幅不趋零；β>2 的纯慢轴仍可能收敛。小到被浮点舍入抹去的步长可能使乘子变成 1，不能据屏幕分类推翻实数定理。"));
      var view=el(doc,"div","opl-actions"),toggle=button(view,local?"显示完整轨迹":"固定初始视野",function(){local=!local;render();results.querySelector(".opl-view-toggle").focus();});toggle.className="opl-view-toggle";toggle.setAttribute("aria-pressed",String(local));results.appendChild(view);
      var c1=region("opl-chart","可横向滚动的等高线图"),c2=region("opl-chart","可横向滚动的距离与目标值图");c1.appendChild(contourSvg(doc,state,r,local));c2.appendChild(energySvg(doc,r));results.appendChild(c1);results.appendChild(c2);
      results.appendChild(el(doc,"p","opl-note","两幅图可以横向滚动；先聚焦图框，再用方向键。表格列出全部 "+r.rows.length+" 个迭代点，可横向及纵向滚动。零值表示本次浮点计算结果。"));
      var wrap=region("opl-ledger","可滚动的全部迭代账本"),table=el(doc,"table"),thead=el(doc,"thead"),head=el(doc,"tr");
      ["k","x₁","x₂","慢轴 zμ","快轴 zL","‖x‖₂","f(x)","f/f₀","‖∇f‖₂"].forEach(function(t){var th=el(doc,"th","",t);th.scope="col";head.appendChild(th);});thead.appendChild(head);table.appendChild(thead);
      var tbody=el(doc,"tbody");r.rows.forEach(function(p){var tr=el(doc,"tr");[String(p.k),format(p.x),format(p.y),format(p.slow),format(p.fast),format(p.distance),format(p.energy),format(p.relative),format(p.gradNorm)].forEach(function(v){tr.appendChild(el(doc,"td","",v));});tbody.appendChild(tr);});table.appendChild(tbody);wrap.appendChild(table);results.appendChild(wrap);
    }
    render();
  }
  function selfTest(){
    var n=0;function ok(c,msg){n++;if(!c)throw new Error(msg);}
    PRESETS.forEach(function(p){var r=simulate(p);ok(r.kind===p.expected,p.id);ok(r.rows.length===p.steps+1,"rows");});
    var a=simulate({kappa:1,beta:1,rotation:37,angle:11,steps:2});ok(a.rows[1].distance===0,"one step");
    ok(simulate(PRESETS[7]).rows[0].fast===1e-14,"tiny retained");
    ok(simulate(PRESETS[6]).rhoAll>1&&simulate(PRESETS[6]).rhoActive<1,"global versus active");
    ok(optimumBeta(9)===1.8&&optimumRho(9)===.8,"minimax");
    ok(format(1e-14)!=="0","small display");ok(format(100,0)==="100","integer display");
    return {checks:n,presets:PRESETS.length};
  }
  var exported={PRESETS:PRESETS,factors:factors,simulate:simulate,initial:initial,fromEigen:fromEigen,optimumBeta:optimumBeta,optimumRho:optimumRho,format:format,contourSvg:contourSvg,energySvg:energySvg,mount:mount,selfTest:selfTest};
  if(typeof module!=="undefined"&&module.exports)module.exports=exported;
  if(host&&host.CourseLearning&&typeof host.CourseLearning.register==="function")host.CourseLearning.register("optimization-landscape",mount);
  if(typeof module!=="undefined"&&module.exports&&typeof require!=="undefined"&&require.main===module){try{console.log("optimization-landscape self-test: PASS",selfTest());}catch(e){console.error(e);process.exitCode=1;}}
})(typeof window!=="undefined"?window:null);

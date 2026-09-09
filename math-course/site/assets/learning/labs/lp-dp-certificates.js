(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("lp-dp-certificates", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("lp-dp-certificates self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("lp-dp-certificates self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var EPS = 1e-8;
  var STYLE_ID = "cl-lp-dp-certificates-styles";
  var DEFAULTS = Object.freeze({ a: 4, b: 12, c: 18 });
  var PRESETS=Object.freeze([
    {id:"default",label:"默认：连续整数相同",a:4,b:12,c:18},
    {id:"fractional",label:"连续与整数有间隙",a:4,b:11,c:18},
    {id:"redundant",label:"混合资源有剩余",a:2,b:8,c:30},
    {id:"kink",label:"三条资源同时绷紧",a:4,b:12,c:24},
    {id:"zero",label:"零容量与退化",a:0,b:0,c:0}
  ].map(Object.freeze));
  function validate(p){
    if(!p||typeof p!=="object")throw new TypeError("capacities required");
    [["a",20],["b",40],["c",60]].forEach(function(a){if(typeof p[a[0]]!=="number"||!Number.isInteger(p[a[0]])||p[a[0]]<0||p[a[0]]>a[1])throw new RangeError(a[0]+" must be an integer in [0,"+a[1]+"]");});
    return p;
  }
  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(a, b, tolerance) {
    return Math.abs(a - b) <= (tolerance || 1e-8);
  }

  function format(value, digits) {
    if (!isFinite(value)) return "∞";
    var places = digits === undefined ? 3 : digits;
    if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) {
      return value.toExponential(Math.min(places, 4));
    }
    var text=value.toFixed(places);return text.indexOf(".")<0?text:text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function objective(p){return 3*p.x+5*p.y;}
  function solvePrimal(params){
    validate(params);var a=params.a,b=params.b,c=params.c;
    // Every vertex lies on a 1/6 grid: retain integer numerators for all decisions.
    var raw=[[0,0],[6*a,0],[0,3*b],[6*a,3*b],[6*a,3*(c-3*a)],[2*(c-b),3*b],[0,3*c],[2*c,0]],seen={},candidates=[];
    raw.forEach(function(q){var X=q[0],Y=q[1],key=X+":"+Y;if(X>=0&&Y>=0&&X<=6*a&&2*Y<=6*b&&3*X+2*Y<=6*c&&!seen[key]){seen[key]=true;candidates.push({x:X/6,y:Y/6,X:X,Y:Y});}});
    var best=candidates.reduce(function(u,v){return 3*v.X+5*v.Y>3*u.X+5*u.Y?v:u;});
    var nums=[6*a-best.X,6*b-2*best.Y,6*c-3*best.X-2*best.Y];
    return {x:best.x,y:best.y,X:best.X,Y:best.Y,value:(3*best.X+5*best.Y)/6,valueNumerator:3*best.X+5*best.Y,
      candidates:candidates,slackNumerators:nums,slacks:nums.map(function(n){return n/6;}),feasible:true,
      active:{r1:nums[0]===0,r2:nums[1]===0,r3:nums[2]===0,x0:best.X===0,y0:best.Y===0}};
  }
  function solveInteger(params){
    validate(params);var best={x:0,y:0,value:0},ties=[];
    for(var x=0;x<=params.a;x++)for(var y=0;y<=Math.floor(params.b/2);y++){
      if(3*x+2*y>params.c)continue;var value=3*x+5*y;
      if(value>best.value){best={x:x,y:y,value:value};ties=[];}
      if(value===best.value)ties.push({x:x,y:y});
    }
    best.ties=ties;return best;
  }

  function solveDynamic(params) {
    validate(params);
    var maxX = params.a;
    var maxY = Math.floor(params.b / 2);
    var capacity = params.c;
    var items = [];
    for (var xCopy = 0; xCopy < maxX; xCopy += 1) items.push({ kind: "x", weight: 3, value: 3 });
    for (var yCopy = 0; yCopy < maxY; yCopy += 1) items.push({ kind: "y", weight: 2, value: 5 });
    var previous = [];
    for (var initialCapacity = 0; initialCapacity <= capacity; initialCapacity += 1) {
      previous.push({ value: 0, x: 0, y: 0 });
    }
    var table = [previous.map(function (entry) { return entry.value; })];
    items.forEach(function (item) {
      var current = previous.map(function (entry) { return { value: entry.value, x: entry.x, y: entry.y }; });
      for (var available = item.weight; available <= capacity; available += 1) {
        var base = previous[available - item.weight];
        var candidate = {
          value: base.value + item.value,
          x: base.x + (item.kind === "x" ? 1 : 0),
          y: base.y + (item.kind === "y" ? 1 : 0)
        };
        if (candidate.value > current[available].value) current[available] = candidate;
      }
      previous = current;
      table.push(current.map(function (entry) { return entry.value; }));
    });
    return {
      x: previous[capacity].x,
      y: previous[capacity].y,
      value: previous[capacity].value,
      capacity: capacity,
      stages: items.length,
      table: table,
      items: items,
      boundary: "V(0,w)=0；w<item weight 时沿用上一阶段"
    };
  }

  function solveDual(params){
    validate(params);var best=null;
    [0,2,5].forEach(function(U3){var U=[Math.max(0,6-3*U3),Math.max(0,5-U3),U3],num=params.a*U[0]+params.b*U[1]+params.c*U[2];if(!best||num<best.valueNumerator)best={y1:U[0]/2,y2:U[1]/2,y3:U[2]/2,U:U,value:num/2,valueNumerator:num};});
    var U=best.U;best.slackNumerators=[U[0]+3*U[2]-6,2*U[1]+2*U[2]-10];best.slacks=best.slackNumerators.map(function(n){return n/2;});best.feasible=U.every(function(n){return n>=0;})&&best.slackNumerators.every(function(n){return n>=0;});return best;
  }
  function certificate(primal,dual){
    var pn=primal.slackNumerators.map(function(n,i){return dual.U[i]*n;}),dn=[primal.X*dual.slackNumerators[0],primal.Y*dual.slackNumerators[1]];
    var gapNumerator=3*dual.valueNumerator-primal.valueNumerator;
    var comp=Math.max.apply(null,pn.concat(dn).map(Math.abs));
    return {gap:gapNumerator/6,gapNumerator:gapNumerator,complementarity:comp/12,
      primalProducts:pn.map(function(n){return n/12;}),dualProducts:dn.map(function(n){return n/12;}),
      primalFeasible:primal.X>=0&&primal.Y>=0&&primal.slackNumerators.every(function(n){return n>=0;}),dualFeasible:dual.feasible,
      exact:gapNumerator===0&&comp===0&&primal.feasible&&dual.feasible};
  }
  function transition(dynamic,i,w){
    if(!Number.isInteger(i)||i<0||i>dynamic.stages||!Number.isInteger(w)||w<0||w>dynamic.capacity)throw new RangeError("invalid DP cell");
    if(i===0)return {i:i,w:w,value:0,skip:null,take:null,item:null,choice:"boundary"};
    var item=dynamic.items[i-1],skip=dynamic.table[i-1][w],take=w<item.weight?null:dynamic.table[i-1][w-item.weight]+item.value;
    return {i:i,w:w,value:dynamic.table[i][w],skip:skip,take:take,item:item,choice:take!==null&&take>skip?"take":"skip"};
  }
  function shadowValue(params,c){
    validate(params);if(typeof c!=="number"||!Number.isFinite(c)||c<0||c>60)throw new RangeError("c range");
    return Math.min(3*params.a+2.5*params.b,1.5*params.b+c,2.5*c);
  }

  function polygonOrder(points) {
    var center = points.reduce(function (sum, point) {
      return { x: sum.x + point.x / points.length, y: sum.y + point.y / points.length };
    }, { x: 0, y: 0 });
    return points.slice().sort(function (left, right) {
      return Math.atan2(left.y - center.y, left.x - center.x) - Math.atan2(right.y - center.y, right.x - center.x);
    });
  }

  function renderSvg(primal,integer,params){
    validate(params);var extent=Math.max(params.a,params.b/2,params.c/2,1)*1.12;
    var px=function(x){return 100+440*x/extent;},py=function(y){return 510-440*y/extent;};
    var out=['<svg viewBox="0 0 680 600" role="img" aria-label="有数值刻度的连续可行域、整数格点及最优点" data-extent="'+extent+'">',
      '<title>连续区域与整数格点，横纵单位长度相同</title>',
      '<text x="30" y="28" font-size="18">连续可行域与整数格点：横纵等比例</text>',
      '<text x="30" y="52" font-size="14">红心：LP 最优；绿环：一个整数最优；金虚线：最优目标等值线</text>',
      '<defs><clipPath id="lpc-clip"><rect x="100" y="70" width="440" height="440"/></clipPath></defs>'];
    [0,.25,.5,.75,1].forEach(function(t){var v=extent*t;out.push('<path d="M'+px(v)+' 70V510 M100 '+py(v)+'H540" fill="none" class="lpc-gridline"/>','<text x="'+px(v)+'" y="534" text-anchor="middle" font-size="12">'+format(v,2)+'</text>','<text x="92" y="'+(py(v)+4)+'" text-anchor="end" font-size="12">'+format(v,2)+'</text>');});
    var ordered=polygonOrder(primal.candidates),path=ordered.map(function(p,i){return(i?"L":"M")+px(p.x)+" "+py(p.y);}).join(" ")+" Z";
    out.push('<g clip-path="url(#lpc-clip)">','<path class="lpc-polygon" d="'+path+'" fill="#315f9d" fill-opacity=".14" stroke="#315f9d" stroke-width="2"/>');
    for(var x=0;x<=params.a;x++)for(var y=0;y<=Math.floor(params.b/2);y++){
      var feasible=3*x+2*y<=params.c;
      out.push('<circle class="lpc-lattice" data-x="'+x+'" data-y="'+y+'" data-feasible="'+feasible+'" cx="'+px(x)+'" cy="'+py(y)+'" r="2.5" fill="'+(feasible?'#315f9d':'#999')+'" opacity="'+(feasible?'1':'.35')+'"/>');
    }
    [[params.a,0,params.a,extent],[0,params.b/2,extent,params.b/2],[0,params.c/2,params.c/3,0]].forEach(function(v,i){out.push('<line class="lpc-boundary" data-index="'+i+'" x1="'+px(v[0])+'" y1="'+py(v[1])+'" x2="'+px(v[2])+'" y2="'+py(v[3])+'" stroke="#b13d32" stroke-dasharray="6 5"/>');});
    out.push('<line class="lpc-objective" x1="'+px(0)+'" y1="'+py(primal.value/5)+'" x2="'+px(primal.value/3)+'" y2="'+py(0)+'" stroke="#95670d" stroke-width="2" stroke-dasharray="4 5"/>');
    out.push('</g>','<circle class="lpc-integer" cx="'+px(integer.x)+'" cy="'+py(integer.y)+'" r="8" fill="none" stroke="#347247" stroke-width="3"/>','<circle class="lpc-primal" cx="'+px(primal.x)+'" cy="'+py(primal.y)+'" r="4.5" fill="#b13d32"/>');
    out.push('<text x="552" y="510" font-size="14">x</text><text x="100" y="64" font-size="14">y</text>',
      '<text x="30" y="565" font-size="14">LP ('+format(primal.x)+', '+format(primal.y)+')；整数 ('+integer.x+', '+integer.y+')；整数最优点共 '+integer.ties.length+' 个</text>',
      '<text x="30" y="589" font-size="13">灰点违反混合资源约束；零容量时可行域可以退化为线段或一个点。</text></svg>');
    return out.join("");
  }

  function ensureStyles(doc) {
    if(doc.getElementById(STYLE_ID))return;
    var style=doc.createElement("style");style.id=STYLE_ID;
    style.textContent=[
      ".lpc-lab{max-width:100%;min-width:0;color:var(--fg);line-height:1.7}.lpc-lab *{box-sizing:border-box}.lpc-lab [hidden]{display:none!important}",
      ".lpc-presets,.lpc-actions,.lpc-choices{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.lpc-presets button{flex:1 1 180px}.lpc-lab button{min-height:44px}.lpc-lab :focus-visible{outline:3px solid var(--cl-focus);outline-offset:3px}",
      ".lpc-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:16px 0}.lpc-control{display:grid;gap:6px;min-width:0}.lpc-control input{width:100%;min-width:0;margin:0}.lpc-control label{font-weight:700}.lpc-control output{color:var(--accent)}",
      ".lpc-choices label{display:flex;align-items:center;gap:8px;min-height:44px;flex:1 1 200px;border:1px solid var(--border);padding:8px}.lpc-choices input{width:20px;height:20px}",
      ".lpc-note{font-size:14px;color:var(--fg-soft);line-height:1.8}.lpc-feedback{font-weight:700}.lpc-region{max-width:100%;overflow:auto;border:1px solid var(--border);border-radius:6px;margin:16px 0}.lpc-region svg{display:block;width:100%;min-width:680px;height:auto;background:var(--bg)}.lpc-region svg text{fill:var(--fg);font-family:inherit;letter-spacing:0}.lpc-gridline{stroke:var(--border)}",
      ".lpc-lab table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;font-size:13px}.lpc-lab th,.lpc-lab td{padding:8px;border-bottom:1px solid var(--border);text-align:left}.lpc-ledger table{min-width:660px}.lpc-dp{max-height:440px}.lpc-dp th{background:var(--bg);white-space:nowrap}.lpc-dp thead th{position:sticky;top:0;z-index:1}.lpc-dp td{padding:1px}.lpc-dp button{min-width:44px;width:100%;border-radius:0}.lpc-dp button[aria-pressed=true]{outline:3px solid var(--accent);outline-offset:-3px}.lpc-dp button[data-parent=true]{background:color-mix(in srgb,var(--cl-gold) 22%,var(--bg))}",
      ".lpc-inspector{padding:12px;border-left:3px solid var(--cl-gold);background:var(--bg);font-size:14px;overflow-wrap:anywhere}",
      ".lpc-dp table{display:table!important;overflow:visible!important;width:max-content;max-width:none!important;min-width:100%}",
      "@media(max-width:760px){.lpc-controls{grid-template-columns:1fr}}",
      "@media(prefers-reduced-motion:reduce){html:has(.lpc-lab){scroll-behavior:auto!important}.lpc-lab *{scroll-behavior:auto!important;animation:none!important;transition:none!important}}"
    ].join("\n");doc.head.appendChild(style);
  }
  function mount(root){
    var doc=root.ownerDocument;ensureStyles(doc);
    var params=Object.assign({},DEFAULTS),base=PRESETS[0],revealed=false,selected=[],uid="lpc-"+Math.random().toString(36).slice(2),inputs={},checks={};
    function el(tag,cls,text){var e=doc.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
    function button(parent,text,fn){var b=el("button","",text);b.type="button";b.addEventListener("click",fn);parent.appendChild(b);return b;}
    function region(cls,label){var e=el("div","lpc-region "+cls);e.tabIndex=0;e.setAttribute("role","region");e.setAttribute("aria-label",label);return e;}
    var shell=el("div","lpc-lab"),presets=el("div","lpc-presets");
    shell.appendChild(el("p","lpc-note","容量以整数单位调整；LP 顶点保留六倍整数坐标，证书用整数分子精确检查。显示的小数可能舍入。"));
    PRESETS.forEach(function(p){button(presets,p.label,function(){base=p;params={a:p.a,b:p.b,c:p.c};invalidate();});});shell.appendChild(presets);
    var controls=el("div","lpc-controls");
    [["a","资源 1 上限 a",8],["b","资源 2 上限 b",20],["c","混合资源上限 c",30]].forEach(function(a){
      var wrap=el("div","lpc-control"),label=el("label","",a[1]+" = "),out=el("output"),input=el("input");
      input.type="range";input.min=0;input.max=a[2];input.step=1;input.id=uid+"-"+a[0];input.setAttribute("aria-label",a[1]);label.htmlFor=input.id;out.htmlFor=input.id;label.appendChild(out);wrap.appendChild(label);wrap.appendChild(input);controls.appendChild(wrap);
      input.addEventListener("input",function(){params[a[0]]=Number(input.value);invalidate();});inputs[a[0]]={input:input,out:out};
    });shell.appendChild(controls);
    shell.appendChild(el("strong","","先预测：最优点上哪些约束恰好取等号？请选出全部。"));
    var choices=el("div","lpc-choices"),names={r1:"x = a",r2:"2y = b",r3:"3x + 2y = c",x0:"x = 0",y0:"y = 0"};
    Object.keys(names).forEach(function(key){var label=el("label"),input=el("input");input.type="checkbox";input.setAttribute("aria-label",names[key]);label.appendChild(input);label.appendChild(el("span","",names[key]));choices.appendChild(label);checks[key]=input;input.addEventListener("change",function(){selected=Object.keys(checks).filter(function(k){return checks[k].checked;});revealed=false;render();});});shell.appendChild(choices);
    var actions=el("div","lpc-actions"),reveal=button(actions,"揭示证书",function(){revealed=true;render();result.focus();});
    button(actions,"重置本预设",function(){params={a:base.a,b:base.b,c:base.c};invalidate();checks.r1.focus();});shell.appendChild(actions);
    var feedback=el("p","lpc-feedback");feedback.setAttribute("aria-live","polite");shell.appendChild(feedback);
    var result=el("div","lpc-result");result.tabIndex=-1;result.setAttribute("aria-label","LP 与 DP 结果");shell.appendChild(result);root.replaceChildren(shell);
    function invalidate(){selected=[];revealed=false;render();}
    function render(){
      Object.keys(inputs).forEach(function(k){inputs[k].input.value=params[k];inputs[k].out.textContent=params[k];});Object.keys(checks).forEach(function(k){checks[k].checked=selected.indexOf(k)>=0;});
      reveal.disabled=!selected.length||revealed;result.hidden=!revealed;
      if(!revealed){feedback.textContent=selected.length?"预测已记录，揭示后核对全部活动约束。":"请选择全部活动约束；容量改变后旧预测失效。";return;}
      var p=solvePrimal(params),integer=solveInteger(params),dp=solveDynamic(params),d=solveDual(params),cert=certificate(p,d);
      var expected=Object.keys(p.active).filter(function(k){return p.active[k];}),correct=expected.length===selected.length&&expected.every(function(k){return selected.indexOf(k)>=0;});
      feedback.textContent=(correct?"预测命中。":"活动约束需要修正。")+" 实际为："+expected.map(function(k){return names[k];}).join("，")+"。";
      result.replaceChildren();
      var chart=region("lpc-chart","可横向滚动的 LP 几何图");chart.innerHTML=renderSvg(p,integer,params);result.appendChild(chart);
      var ledger=region("lpc-ledger","可横向滚动的最优证书账本"),table=el("table"),body=el("tbody");
      var rows=[
        ["连续最优点", "("+format(p.x)+", "+format(p.y)+")；精确坐标 ("+p.X+"/6, "+p.Y+"/6)"],
        ["连续目标值",format(p.value)+"；精确值 "+p.valueNumerator+"/6"],
        ["一个整数最优点","("+integer.x+", "+integer.y+")，目标 "+integer.value+"；最优格点共 "+integer.ties.length+" 个"],
        ["DP 独立复算","("+dp.x+", "+dp.y+")，目标 "+dp.value+"；与整数枚举目标"+(dp.value===integer.value?"一致":"不一致")],
        ["对偶解及目标","("+format(d.y1)+", "+format(d.y2)+", "+format(d.y3)+")，目标 "+format(d.value)],
        ["原始松弛",p.slacks.map(function(v){return format(v);}).join("，")],
        ["对偶松弛",d.slacks.map(function(v){return format(v);}).join("，")],
        ["对偶 − 原始目标",cert.gapNumerator+"/6 = "+format(cert.gap)],
        ["互补乘积",cert.primalProducts.concat(cert.dualProducts).map(function(v){return format(v);}).join("，")],
        ["精确连续证书",cert.exact?"原始可行、对偶可行、零间隙及互补均通过":"未通过"],
        ["整数最优性", "穷尽所有允许格点；LP 上界减整数值 = "+format(p.value-integer.value)]
      ];rows.forEach(function(row){var tr=el("tr");var th=el("th","",row[0]);th.scope="row";tr.appendChild(th);tr.appendChild(el("td","",row[1]));body.appendChild(tr);});table.appendChild(body);ledger.appendChild(table);result.appendChild(ledger);
      result.appendChild(el("p","lpc-note","活动约束的乘子可以为零；有剩余资源的乘子才必须为零。零间隙加双侧可行已经足够证明连续最优，互补是等价的逐项解释。整数枚举和 DP 可以返回不同的最优点，目标相同且各自可行即可。"));
      result.appendChild(el("h4","","把整数问题展开为有界背包"));
      result.appendChild(el("p","lpc-note","共有 "+params.a+" 份 x（重 3、值 3）及 "+Math.floor(params.b/2)+" 份 y（重 2、值 5），每份最多取一次，混合容量 "+params.c+"。V(i,w) 表示只用前 i 份、总重量至多 w 的最大利润；可留下空余容量。"));
      var inspect=el("div","lpc-inspector");inspect.setAttribute("aria-live","polite");result.appendChild(inspect);
      var grid=region("lpc-dp","可横向纵向滚动的完整 DP 表"),tab=el("table"),head=el("thead"),tr=el("tr");
      var th=el("th","","阶段 / 容量");th.scope="col";tr.appendChild(th);
      for(var w=0;w<=dp.capacity;w++){th=el("th","",String(w));th.scope="col";tr.appendChild(th);}head.appendChild(tr);tab.appendChild(head);var tb=el("tbody"),cells=[];
      dp.table.forEach(function(row,i){var tr=el("tr"),th=el("th","",i===0?"0：没有物品":i+"："+dp.items[i-1].kind+"（重"+dp.items[i-1].weight+"）");th.scope="row";tr.appendChild(th);cells[i]=[];
        row.forEach(function(value,w){var td=el("td"),b=button(td,String(value),function(){selectCell(i,w,false);});b.tabIndex=-1;b.dataset.i=i;b.dataset.w=w;b.setAttribute("aria-label","V("+i+","+w+") = "+value);b.addEventListener("keydown",function(e){var ni=i,nw=w;if(e.key==="ArrowLeft")nw=Math.max(0,w-1);else if(e.key==="ArrowRight")nw=Math.min(dp.capacity,w+1);else if(e.key==="ArrowUp")ni=Math.max(0,i-1);else if(e.key==="ArrowDown")ni=Math.min(dp.stages,i+1);else if(e.key==="Home")nw=0;else if(e.key==="End")nw=dp.capacity;else return;e.preventDefault();selectCell(ni,nw,true);});cells[i][w]=b;tr.appendChild(td);});tb.appendChild(tr);});tab.appendChild(tb);grid.appendChild(tab);result.appendChild(grid);
      result.appendChild(el("p","lpc-note","选中一个格子即可查看前驱。金色是上一阶段被比较的格子；当前格子有蓝框。用方向键移动，Home/End 到行首/行尾；表格支持横向与纵向滚动。"));
      function selectCell(i,w,focus){
        var t=transition(dp,i,w);
        cells.forEach(function(row,ri){row.forEach(function(b,cw){var active=ri===i&&cw===w;b.tabIndex=active?0:-1;b.setAttribute("aria-pressed",String(active));b.dataset.parent=String(i>0&&ri===i-1&&(cw===w||(t.take!==null&&cw===w-t.item.weight)));});});
        inspect.textContent=i===0?"V(0,"+w+")=0：没有物品，允许不装满，所以所有容量的初始值都是零。":
          "V("+i+","+w+")：不取第 "+i+" 份 → V("+(i-1)+","+w+")="+t.skip+"；"+
          (t.take===null?"容量不足，不能取。":"取这份 → V("+(i-1)+","+(w-t.item.weight)+")+"+t.item.value+"="+t.take+"。")+
          " 本格取最大值 "+t.value+"；"+(t.take===t.skip?"两种选择并列，演示保留“不取”。":t.choice==="take"?"这一步选择“取”。":"这一步选择“不取”。");
        if(focus)cells[i][w].focus();
      }
      selectCell(dp.stages,dp.capacity,false);
      result.appendChild(el("p","lpc-note","影子价格只在相应区间内给边际增益。当前固定 a、b 时，连续最优值 V(c)=min("+format(3*params.a+2.5*params.b)+", "+format(1.5*params.b)+"+c, 2.5c)。改变 c 不破坏旧对偶解的可行性，但它可能不再给最紧的上界。"));
    }
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }
    var primal = solvePrimal(DEFAULTS);
    var integer = solveInteger(DEFAULTS);
    var dynamic = solveDynamic(DEFAULTS);
    var dual = solveDual(DEFAULTS);
    var cert = certificate(primal, dual);
    check(near(primal.x, 2) && near(primal.y, 6), "default primal solution");
    check(near(primal.value, 36), "default primal objective");
    check(near(dual.y1, 0) && near(dual.y2, 1.5) && near(dual.y3, 1), "default dual certificate");
    check(near(dual.value, 36), "strong duality value");
    check(cert.primalFeasible && cert.dualFeasible, "feasibility certificate");
    check(cert.gap < EPS && cert.complementarity < EPS, "zero gap and complementarity");
    check(integer.x === 2 && integer.y === 6, "default integer solution");
    check(dynamic.value === integer.value && dynamic.x === integer.x && dynamic.y === integer.y, "DP matches default integer optimum");
    check(dynamic.table.length === dynamic.stages + 1 && dynamic.table[0].every(function (value) { return value === 0; }), "DP boundary row");
    var fractional = solvePrimal({ a: 4, b: 11, c: 18 });
    var fractionalInteger = solveInteger({ a: 4, b: 11, c: 18 });
    check(fractional.y > fractionalInteger.y, "integer boundary differs from continuous boundary");
    [{ a: 3, b: 7, c: 11 }, { a: 5, b: 9, c: 17 }, { a: 2, b: 20, c: 30 }].forEach(function (params) {
      check(solveDynamic(params).value === solveInteger(params).value, "DP matches enumeration " + JSON.stringify(params));
    });
    check(!primal.active.r1 && primal.active.r2 && primal.active.r3 && !primal.active.x0 && !primal.active.y0, "default full active set");
    check(solvePrimal({ a: 2, b: 20, c: 30 }).x <= 2 + EPS, "capacity changes primal result");
    return { checks: checks, presets: 3 };
  }

  return {
    mount: mount,
    PRESETS: PRESETS,
    DEFAULTS: DEFAULTS,
    renderSvg: renderSvg,
    transition: transition,
    shadowValue: shadowValue,
    solvePrimal: solvePrimal,
    solveInteger: solveInteger,
    solveDynamic: solveDynamic,
    solveDual: solveDual,
    certificate: certificate,
    selfTest: selfTest
  };
});

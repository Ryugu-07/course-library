(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("nash-equilibrium", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("nash-equilibrium self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)\n");
    } catch (error) {
      process.stderr.write("nash-equilibrium self-test: FAIL\n" + error.stack + "\n");
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-nash-equilibrium-styles";
  var INSTANCE = 0;

  var PRESETS = [
    {
      id: "dominant",
      label: "预设 A",
      rowLabels: ["合作", "背叛"],
      columnLabels: ["合作", "背叛"],
      payoffs: [
        [[3, 3], [0, 5]],
        [[5, 0], [1, 1]]
      ]
    },
    {
      id: "coordination",
      label: "预设 B",
      rowLabels: ["左", "右"],
      columnLabels: ["左", "右"],
      payoffs: [
        [[4, 4], [0, 0]],
        [[0, 0], [2, 2]]
      ]
    },
    {
      id: "matching-pennies",
      label: "预设 C",
      rowLabels: ["正面", "反面"],
      columnLabels: ["正面", "反面"],
      payoffs: [
        [[1, -1], [-1, 1]],
        [[-1, 1], [1, -1]]
      ]
    },
    {
      id: "degenerate",
      label: "预设 D",
      rowLabels: ["甲", "乙"],
      columnLabels: ["左", "右"],
      payoffs: [
        [[1, 3], [1, 0]],
        [[1, 3], [1, 0]]
      ]
    }
  ];

  PRESETS.push(
    {id:"cross",label:"预设 E",rowLabels:["甲","乙"],columnLabels:["左","右"],
      payoffs:[[[0,1],[0,0]],[[0,0],[0,1]]]},
    {id:"all-tied",label:"预设 F",rowLabels:["甲","乙"],columnLabels:["左","右"],
      payoffs:[[[1,1],[1,1]],[[1,1],[1,1]]]}
  );

  var DEFAULT = { presetId: "dominant" };

  var STYLE_TEXT = [
    ".nash-lab{--nash-blue:var(--cl-blue,#315f9d);--nash-gold:var(--cl-gold,#9b6a12);--nash-green:var(--cl-green,#39734d);--nash-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
    ".nash-lab *,.nash-lab *::before,.nash-lab *::after{box-sizing:border-box}.nash-lab [hidden]{display:none!important}.nash-lab h3,.nash-lab h4{margin:0;color:var(--fg);letter-spacing:0}.nash-lab h3{font-size:1.18rem}.nash-lab h4{font-size:1rem}",
    ".nash-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.nash-lab button:hover{border-color:var(--accent)}.nash-lab button[aria-pressed='true'],.nash-lab button.nash-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.nash-lab button:disabled{cursor:not-allowed;opacity:.55}.nash-lab button:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
    ".nash-lab .nash-note,.nash-lab .nash-feedback{color:var(--fg-soft);font-size:13px;line-height:1.7}.nash-lab .nash-prompt{margin:14px 0;padding:12px 14px;border-left:3px solid var(--nash-gold);background:var(--bg)}.nash-lab fieldset{min-width:0;margin:0;padding:0;border:0}.nash-lab legend{margin-bottom:8px;color:var(--fg-soft);font-size:13px;font-weight:750}.nash-lab .nash-preset-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.nash-lab .nash-preset-grid button,.nash-lab .nash-choice-grid button{font-size:12px}.nash-lab .nash-question-list{display:grid;gap:10px;margin-top:13px}.nash-lab .nash-question{min-width:0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.nash-lab .nash-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:7px}.nash-lab .nash-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.nash-lab .nash-actions>*{flex:1 1 170px}.nash-lab .nash-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.nash-lab .nash-pass{color:var(--nash-green)}.nash-lab .nash-warn{color:var(--nash-red)}",
    ".nash-lab .nash-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.nash-lab .nash-layout{display:grid;grid-template-columns:minmax(230px,.7fr) minmax(0,1.3fr);gap:16px;align-items:start;min-width:0}.nash-lab .nash-stage,.nash-lab .nash-ledger{min-width:0}.nash-lab .nash-stage-frame{padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch}.nash-lab .nash-svg{display:block;width:100%;min-width:560px;height:auto;color:var(--fg)}.nash-lab .nash-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.nash-lab .nash-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:8px;margin:12px 0}.nash-lab .nash-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.nash-lab .nash-metric:nth-child(1),.nash-lab .nash-metric:nth-child(4){border-top-color:var(--nash-blue)}.nash-lab .nash-metric:nth-child(2),.nash-lab .nash-metric:nth-child(5){border-top-color:var(--nash-gold)}.nash-lab .nash-metric:nth-child(3),.nash-lab .nash-metric:nth-child(6){border-top-color:var(--nash-green)}.nash-lab .nash-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4}.nash-lab .nash-metric strong{display:block;margin-top:3px;color:var(--fg);font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.nash-lab .nash-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.nash-lab table{width:100%;min-width:680px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.nash-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft);font-size:12px;line-height:1.55}.nash-lab th,.nash-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.nash-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750}.nash-lab .nash-good{color:var(--nash-green);font-weight:750}.nash-lab .nash-warn{color:var(--nash-red);font-weight:750}.nash-lab .nash-interpretation{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--nash-green);background:var(--bg);font-size:13px;line-height:1.7}",
    "@media(max-width:900px){.nash-lab .nash-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:760px){.nash-lab .nash-preset-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.nash-lab .nash-choice-grid{grid-template-columns:minmax(0,1fr)}}@media(max-width:430px){.nash-lab .nash-preset-grid{grid-template-columns:minmax(0,1fr)}.nash-lab .nash-stage-frame{padding:5px}}@media(prefers-reduced-motion:reduce){.nash-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  STYLE_TEXT += "\n"+[
    ".nash-lab .nash-scroll{max-width:100%;overflow:auto;max-height:650px;margin:14px 0;border:1px solid var(--border);border-radius:6px;background:var(--bg)}",
    ".nash-lab .nash-svg{width:900px;min-width:900px;max-width:none}.nash-lab .nash-scroll:focus-visible,.nash-lab input:focus-visible,.nash-lab select:focus-visible,.nash-lab [tabindex='-1']:focus{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
    ".nash-lab input,.nash-lab select{font:inherit;color:var(--fg);background:var(--bg);border:1px solid var(--border);border-radius:4px;min-height:44px;max-width:100%;margin:0}.nash-lab select{display:block;width:100%;margin:6px 0 14px;padding:8px}.nash-lab input[type=number]{width:100%;padding:6px}",
    ".nash-lab .nash-payoff-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:10px 0 16px}.nash-lab .nash-payoff-grid label{display:grid;gap:5px;font-size:12px}.nash-lab .nash-payoff-grid legend{grid-column:1/-1}",
    ".nash-lab .nash-probability{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:14px 0}.nash-lab .nash-probability label{display:grid;gap:8px}.nash-lab input[type=range]{width:100%;padding:0}.nash-lab output{font-variant-numeric:tabular-nums;font-size:13px}.nash-lab .nash-question{margin:12px 0}",
    "@media(max-width:600px){.nash-lab .nash-payoff-grid,.nash-lab .nash-probability{grid-template-columns:repeat(2,minmax(0,1fr))}.nash-lab .nash-probability{grid-template-columns:1fr}}",
    "@media(prefers-reduced-motion:reduce){html:has(.nash-lab){scroll-behavior:auto!important}}"
  ].join("\n");

  // Exact rational arithmetic for the finite binary numbers supplied to this API.
  // No epsilon is used in equilibrium membership, dimension or endpoint tests.
  function finite(x) { return typeof x === "number" && Number.isFinite(x); }
  function gcd(a,b) { a=a<0n?-a:a; b=b<0n?-b:b; while(b){var t=a%b;a=b;b=t;}return a; }
  function rat(n,d) {
    if(d===undefined)d=1n;
    if(d===0n)throw new RangeError("zero rational denominator");
    if(d<0n){n=-n;d=-d;} var g=gcd(n,d);return {n:n/g,d:d/g};
  }
  var ZERO=rat(0n),ONE=rat(1n),TWO=rat(2n);
  function add(a,b){return rat(a.n*b.d+b.n*a.d,a.d*b.d);}
  function neg(a){return {n:-a.n,d:a.d};}
  function sub(a,b){return add(a,neg(b));}
  function mul(a,b){return rat(a.n*b.n,a.d*b.d);}
  function div(a,b){return rat(a.n*b.d,a.d*b.n);}
  function cmp(a,b){var x=a.n*b.d-b.n*a.d;return x<0n?-1:x>0n?1:0;}
  function fromNumber(x) {
    if(!finite(x))throw new RangeError("a finite number is required");
    if(x===0)return ZERO;
    var v=new DataView(new ArrayBuffer(8));v.setFloat64(0,x);
    var hi=v.getUint32(0),lo=v.getUint32(4),e=(hi>>>20)&2047;
    var n=(BigInt(hi&1048575)<<32n)+BigInt(lo);
    if(e)n+=1n<<52n;
    var power=e?e-1075:-1074;
    if(hi>>>31)n=-n;
    return power>=0?rat(n<<BigInt(power)):rat(n,1n<<BigInt(-power));
  }
  function asNumber(a) {
    if(a.n===0n)return 0;
    var sign=a.n<0n?-1:1,n=a.n<0n?-a.n:a.n,d=a.d;
    var e=n.toString(2).length-d.toString(2).length;
    if(e>=0 ? n<(d<<BigInt(e)) : (n<<BigInt(-e))<d)e--;
    if(e>1023)return null;
    var shift=e<-1022?1074:52-e;
    var nn=shift>=0?n<<BigInt(shift):n,dd=shift<0?d<<BigInt(-shift):d;
    var q=nn/dd,r=nn%dd;
    if(2n*r>dd || (2n*r===dd && q%2n))q++;
    var value=sign*Number(q)*Math.pow(2,e<-1022?-1074:e-52);
    return Number.isFinite(value)?value:null;
  }
  function exact(a){return a.d===1n?String(a.n):String(a.n)+"/"+String(a.d);}
  function packet(a){return {value:asNumber(a),exact:exact(a)};}
  function parseExact(s){
    if(typeof s!=="string" || !/^-?\d+(\/[1-9]\d*)?$/.test(s) || s.length>3000)
      throw new RangeError("invalid exact fraction");
    var parts=s.split("/");return rat(BigInt(parts[0]),parts.length===2?BigInt(parts[1]):1n);
  }
  function probability(x){
    var a=typeof x==="string"?parseExact(x):fromNumber(x);
    if(cmp(a,ZERO)<0 || cmp(a,ONE)>0)throw new RangeError("probability must be in [0,1]");
    return a;
  }
  function near(a,b,t){return Math.abs(a-b)<=(t||1e-10)*Math.max(Math.abs(a),Math.abs(b),1);}
  function copy(x){return JSON.parse(JSON.stringify(x));}
  function presetById(id){
    var p=PRESETS.find(function(x){return x.id===id;});
    if(!p)throw new RangeError("unknown Nash preset");return p;
  }
  function normalizeGame(input){
    if(input===undefined)input={};
    if(!input || typeof input!=="object" || Array.isArray(input))throw new TypeError("game must be an object");
    var p=presetById(input.presetId===undefined?DEFAULT.presetId:input.presetId);
    var raw=input.payoffs===undefined?p.payoffs:input.payoffs;
    if(!Array.isArray(raw)||raw.length!==2)throw new RangeError("payoffs must be 2x2");
    var payoffs=[];
    for(var i=0;i<2;i++){
      if(!Array.isArray(raw[i])||raw[i].length!==2)throw new RangeError("payoffs must be 2x2");
      payoffs[i]=[];
      for(var j=0;j<2;j++){
        if(!Array.isArray(raw[i][j])||raw[i][j].length!==2)throw new RangeError("each cell needs two numbers");
        payoffs[i][j]=[];
        for(var k=0;k<2;k++){
          if(!finite(raw[i][j][k]))throw new RangeError("payoffs must be finite numbers without coercion");
          payoffs[i][j][k]=raw[i][j][k];
        }
      }
    }
    function labels(key){
      var a=input[key]===undefined?p[key]:input[key];
      if(!Array.isArray(a)||a.length!==2)throw new RangeError(key+" must contain two labels");
      for(var k=0;k<2;k++)if(typeof a[k]!=="string"||!a[k].trim()||a[k].length>24)
        throw new RangeError("labels must contain 1–24 characters");
      return a.slice();
    }
    return {id:input.id===undefined?p.id:input.id,label:input.label===undefined?p.label:input.label,
      rowLabels:labels("rowLabels"),columnLabels:labels("columnLabels"),payoffs:payoffs};
  }
  function payoff(g,i,j,k){return g.payoffs[i][j][k];}
  function rationalGame(g){return g.payoffs.map(function(row){return row.map(function(c){return c.map(fromNumber);});});}
  function lerp(a,b,t){return add(mul(sub(ONE,t),a),mul(t,b));}
  function expectedR(g,p,q,k){
    return lerp(lerp(g[1][1][k],g[1][0][k],q),lerp(g[0][1][k],g[0][0][k],q),p);
  }
  function expectedPayoffs(input,p,q){
    var g=rationalGame(normalizeGame(input)),pr=probability(p),qr=probability(q);
    return [asNumber(expectedR(g,pr,qr,0)),asNumber(expectedR(g,pr,qr,1))];
  }
  function bestResponses(input){
    var g=normalizeGame(input),rows=[],cols=[];
    for(var j=0;j<2;j++){
      var a=payoff(g,0,j,0),b=payoff(g,1,j,0);
      rows.push(a===b?[0,1]:a>b?[0]:[1]);
    }
    for(var i=0;i<2;i++){
      var a=payoff(g,i,0,1),b=payoff(g,i,1,1);
      cols.push(a===b?[0,1]:a>b?[0]:[1]);
    }
    return {rowByColumn:rows,columnByRow:cols,forRowPlayer:rows,forColumnPlayer:cols};
  }
  function pureEquilibria(input){
    var g=normalizeGame(input),br=bestResponses(g),out=[];
    for(var i=0;i<2;i++)for(var j=0;j<2;j++)
      if(br.rowByColumn[j].indexOf(i)>=0&&br.columnByRow[i].indexOf(j)>=0)
        out.push({row:i,column:j,p:1-i,q:1-j,payoffs:g.payoffs[i][j].slice()});
    return out;
  }
  // Solve f(t)=0 or sign*f(t)>=0 on the CLOSED unit interval.
  function linearSet(a,b,sign){
    if(sign===0){
      var sa=cmp(a,ZERO),sb=cmp(b,ZERO);
      if(!sa&&!sb)return [ZERO,ONE];
      if(!sa)return [ZERO,ZERO];if(!sb)return [ONE,ONE];
      if(sa===sb)return null;
      var r=div(a,sub(a,b));return [r,r];
    }
    if(sign<0){a=neg(a);b=neg(b);}
    var sa=cmp(a,ZERO),sb=cmp(b,ZERO);
    if(sa>=0&&sb>=0)return [ZERO,ONE];
    if(sa<0&&sb<0)return null;
    var r=div(a,sub(a,b));return sa>=0?[ZERO,r]:[r,ONE];
  }
  function intersect(a,b){
    if(!a||!b)return null;
    var l=cmp(a[0],b[0])>=0?a[0]:b[0],h=cmp(a[1],b[1])<=0?a[1]:b[1];
    return cmp(l,h)<=0?[l,h]:null;
  }
  function contained(a,b){
    return cmp(a.p[0],b.p[0])>=0&&cmp(a.p[1],b.p[1])<=0&&
      cmp(a.q[0],b.q[0])>=0&&cmp(a.q[1],b.q[1])<=0;
  }
  function rawEquilibria(game){
    var g=rationalGame(game);
    var row0=sub(g[0][1][0],g[1][1][0]),row1=sub(g[0][0][0],g[1][0][0]);
    var col0=sub(g[1][0][1],g[1][1][1]),col1=sub(g[0][0][1],g[0][1][1]);
    // 0: pure action 0; 1: pure action 1; 2: both actions are best replies.
    // Allowing endpoints in case 2 closes the sets without adding false equilibria.
    var domains=[[ONE,ONE],[ZERO,ZERO],[ZERO,ONE]],signs=[1,-1,0],sets=[];
    for(var r=0;r<3;r++)for(var c=0;c<3;c++){
      var p=intersect(domains[r],linearSet(col0,col1,signs[c]));
      var q=intersect(domains[c],linearSet(row0,row1,signs[r]));
      if(p&&q)sets.push({p:p,q:q});
    }
    sets=sets.filter(function(a,i){return !sets.some(function(b,j){
      return i!==j&&contained(a,b)&&(!contained(b,a)||j<i);
    });});
    if(!sets.length)throw new Error("finite Nash existence invariant failed");
    return {sets:sets,g:g,row0:row0,row1:row1,col0:col0,col1:col1};
  }
  function describeSet(a){
    var pd=cmp(a.p[0],a.p[1])<0,qd=cmp(a.q[0],a.q[1])<0;
    return {type:pd&&qd?"region":pd?"p-line":qd?"q-line":"point",
      pRange:a.p.map(asNumber),qRange:a.q.map(asNumber),
      exactP:a.p.map(exact),exactQ:a.q.map(exact),
      description:"闭区间的笛卡尔积；端点也属于均衡集合"};
  }
  function isInteriorPoint(a){
    return !cmp(a.p[0],a.p[1])&&!cmp(a.q[0],a.q[1])&&cmp(a.p[0],ZERO)>0&&cmp(a.p[0],ONE)<0&&
      cmp(a.q[0],ZERO)>0&&cmp(a.q[0],ONE)<0;
  }
  function mixedFromRaw(raw){
    var sets=raw.sets.map(describeSet),families=sets.filter(function(s){return s.type!=="point";});
    var point=raw.sets.find(isInteriorPoint),interior=null;
    if(point)interior={p:asNumber(point.p[0]),q:asNumber(point.q[0]),exactP:exact(point.p[0]),exactQ:exact(point.q[0]),
      payoffs:[asNumber(expectedR(raw.g,point.p[0],point.q[0],0)),asNumber(expectedR(raw.g,point.p[0],point.q[0],1))]};
    var rz=linearSet(raw.row0,raw.row1,0),cz=linearSet(raw.col0,raw.col1,0);
    var hasInterior=raw.sets.some(function(a){return cmp(a.p[1],ZERO)>0&&cmp(a.p[0],ONE)<0&&
      cmp(a.q[1],ZERO)>0&&cmp(a.q[0],ONE)<0;});
    return {p:interior?interior.p:null,q:interior?interior.q:null,interior:interior,boundary:null,
      families:families,sets:sets,hasInterior:hasInterior,
      rowIndifferenceDenominator:asNumber(sub(raw.row1,raw.row0)),
      columnIndifferenceDenominator:asNumber(sub(raw.col1,raw.col0)),
      rowIndifferenceAt:rz&&!cmp(rz[0],rz[1])?asNumber(rz[0]):null,
      columnIndifferenceAt:cz&&!cmp(cz[0],cz[1])?asNumber(cz[0]):null,
      status:families.length?"continuum":interior?"interior":"none"};
  }
  function mixedEquilibrium(input){return mixedFromRaw(rawEquilibria(normalizeGame(input)));}
  function socialOptima(input){
    var g=rationalGame(normalizeGame(input)),all=[],maximum=null;
    for(var i=0;i<2;i++)for(var j=0;j<2;j++){
      var total=add(g[i][j][0],g[i][j][1]);
      all.push({row:i,column:j,r:total});
      if(maximum===null||cmp(total,maximum)>0)maximum=total;
    }
    function out(a){return {row:a.row,column:a.column,total:asNumber(a.r),exactTotal:exact(a.r)};}
    return {maximum:asNumber(maximum),exactMaximum:exact(maximum),
      cells:all.filter(function(a){return !cmp(a.r,maximum);}).map(out),all:all.map(out),
      objective:"payoff-sum-maximizer",normalization:"current payoff units; not independently affine-invariant"};
  }
  function isZeroSum(input){
    var g=normalizeGame(input);
    return g.payoffs.every(function(row){return row.every(function(c){return c[0]===-c[1];});});
  }
  function minimaxFromRaw(game,raw){
    if(!isZeroSum(game))return {applicable:false,reason:"zero-sum only"};
    var a=raw.sets[0],p=div(add(a.p[0],a.p[1]),TWO),q=div(add(a.q[0],a.q[1]),TWO),g=raw.g;
    var lo0=lerp(g[1][0][0],g[0][0][0],p),lo1=lerp(g[1][1][0],g[0][1][0],p);
    var hi0=lerp(g[0][1][0],g[0][0][0],q),hi1=lerp(g[1][1][0],g[1][0][0],q);
    var lower=cmp(lo0,lo1)<0?lo0:lo1,upper=cmp(hi0,hi1)>0?hi0:hi1;
    if(cmp(lower,upper))throw new Error("exact zero-sum saddle certificate failed");
    return {applicable:true,row:{p:asNumber(p),exactP:exact(p),value:asNumber(lower)},
      column:{q:asNumber(q),exactQ:exact(q),value:asNumber(upper)},
      value:asNumber(lower),exactValue:exact(lower),lower:packet(lower),upper:packet(upper),dualityGap:0,exactGap:"0"};
  }
  function minimax(input){var game=normalizeGame(input);return minimaxFromRaw(game,rawEquilibria(game));}
  function deviationLedger(input,p,q){
    var game=normalizeGame(input),g=rationalGame(game),pr=probability(p),qr=probability(q),rows=[];
    for(var k=0;k<2;k++){
      var a=k===0?lerp(g[0][1][0],g[0][0][0],qr):lerp(g[1][0][1],g[0][0][1],pr);
      var b=k===0?lerp(g[1][1][0],g[1][0][0],qr):lerp(g[1][1][1],g[0][1][1],pr);
      var current=expectedR(g,pr,qr,k),best=cmp(a,b)>=0?a:b,gain=sub(best,current);
      if(cmp(gain,ZERO)<0)throw new Error("negative unilateral gain");
      rows.push({player:k,action0:packet(a),action1:packet(b),current:packet(current),best:packet(best),gain:packet(gain),
        bestActions:!cmp(a,b)?[0,1]:cmp(a,b)>0?[0]:[1]});
    }
    return {p:packet(pr),q:packet(qr),players:rows,isNash:rows.every(function(r){return r.gain.exact==="0";})};
  }
  function analyze(input){
    var game=normalizeGame(input),raw=rawEquilibria(game),mixed=mixedFromRaw(raw),pure=pureEquilibria(game),social=socialOptima(game);
    var continuum=mixed.families.length>0,overlap=social.cells.filter(function(c){return pure.some(function(p){return p.row===c.row&&p.column===c.column;});});
    var all=overlap.length===social.cells.length;
    return {game:game,bestResponses:bestResponses(game),pure:pure,mixed:mixed,equilibriumSets:mixed.sets,
      socialOptima:social,payoffSumMaximizer:social,socialOptimumIsNash:all,payoffSumMaximizerIsPureNash:all,
      zeroSum:isZeroSum(game),minimax:minimaxFromRaw(game,raw),existence:{exists:true,reason:"complete exact best-response intersections"},
      uniqueness:continuum?"continuum":raw.sets.length===1?"unique":"multiple",
      equilibriumCount:continuum?"continuum":raw.sets.length,
      nashAndSocialOptimumOverlap:overlap,nashAndPayoffSumMaximizerOverlap:overlap};
  }
  function format(value,digits){
    if(value===null||value===undefined)return "—";
    if(!finite(value))return String(value);
    var places=digits===undefined?4:digits;
    if(value!==0&&(Math.abs(value)<.001||Math.abs(value)>=10000))return value.toExponential(Math.min(places,4));
    var s=value.toFixed(places);return places?s.replace(/0+$/,"").replace(/\.$/,""):s;
  }


  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", value);
      else if (key === "text") node.textContent = value;
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    append(node, children, doc);
    return node;
  }

  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (key === "className") key = "class";
      if (value !== undefined && value !== null && value !== false) node.setAttribute(key, String(value));
    });
    append(node, children, doc);
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

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function installStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement).appendChild(style);
  }

  function metric(doc, label, value) {
    return element(doc, "div", { className: "nash-metric" }, [
      element(doc, "span", { text: label }),
      element(doc, "strong", { text: value })
    ]);
  }

  function equilibriumAt(data, row, column) {
    return data.pure.some(function (cell) { return cell.row === row && cell.column === column; });
  }

  function socialAt(data, row, column) {
    return data.socialOptima.cells.some(function (cell) { return cell.row === row && cell.column === column; });
  }

  function buildTable(doc, data) {
    var table = element(doc, "table", {});
    table.appendChild(element(doc, "caption", { text: "逐格最佳回应与均衡账本" }));
    var head = element(doc, "thead", {});
    head.appendChild(element(doc, "tr", {}, [
      element(doc, "th", { scope: "col", text: "行动作" }),
      element(doc, "th", { scope: "col", text: "列动作" }),
      element(doc, "th", { scope: "col", text: "收益 (u,v)" }),
      element(doc, "th", { scope: "col", text: "行 BR" }),
      element(doc, "th", { scope: "col", text: "列 BR" }),
      element(doc, "th", { scope: "col", text: "身份" })
    ]));
    table.appendChild(head);
    var body = element(doc, "tbody", {});
    for (var row = 0; row < 2; row += 1) {
      for (var column = 0; column < 2; column += 1) {
        var rowBest = data.bestResponses.rowByColumn[column].indexOf(row) >= 0;
        var columnBest = data.bestResponses.columnByRow[row].indexOf(column) >= 0;
        var nash = equilibriumAt(data, row, column);
        var social = socialAt(data, row, column);
        var identity = nash && social ? "Nash + payoff-sum 最大格" : nash ? "Nash" : social ? "payoff-sum 最大格" : "—";
        body.appendChild(element(doc, "tr", {}, [
          element(doc, "th", { scope: "row", text: data.game.rowLabels[row] }),
          element(doc, "td", { text: data.game.columnLabels[column] }),
          element(doc, "td", { text: "(" + format(payoff(data.game, row, column, 0), 3) + ", " +
            format(payoff(data.game, row, column, 1), 3) + ")" }),
          element(doc, "td", { className: rowBest ? "nash-good" : "", text: rowBest ? "是" : "否" }),
          element(doc, "td", { className: columnBest ? "nash-good" : "", text: columnBest ? "是" : "否" }),
          element(doc, "td", { className: nash ? "nash-good" : social ? "nash-warn" : "", text: identity })
        ]));
      }
    }
    table.appendChild(body);
    return table;
  }

  function scrollRegion(doc,label,node){
    return element(doc,"div",{className:"nash-scroll",tabindex:0,role:"region","aria-label":label},node);
  }
  function tableOf(doc,caption,headers,rows){
    var t=element(doc,"table",{},element(doc,"caption",{text:caption}));
    t.appendChild(element(doc,"thead",{},element(doc,"tr",{},headers.map(function(h){return element(doc,"th",{scope:"col",text:h});}))));
    t.appendChild(element(doc,"tbody",{},rows.map(function(row){return element(doc,"tr",{},row.map(function(v,i){
      return element(doc,i?"td":"th",i?{text:v}:{scope:"row",text:v});
    }));})));return t;
  }
  function rangeText(a){return a[0]===a[1]?a[0]:"["+a[0]+", "+a[1]+"]";}
  function drawMatrix(doc,svg,data,uid,revealed){
    clear(svg);svg.setAttribute("viewBox","0 0 900 370");svg.setAttribute("role","img");
    svg.setAttribute("aria-labelledby",uid+"-title "+uid+"-desc");
    svg.appendChild(svgElement(doc,"title",{id:uid+"-title"},"2×2 收益矩阵"));
    svg.appendChild(svgElement(doc,"desc",{id:uid+"-desc"},revealed?
      "每格先行收益后列收益；行 BR 表示固定本列时行玩家的最佳回应，列 BR 表示固定本行时列玩家的最佳回应。两者都有才是纯均衡。":"先读收益，每格先行玩家后列玩家；判定结果在提交预测后显示。"));
    function tx(x,y,s,size){svg.appendChild(svgElement(doc,"text",{x:x,y:y,"text-anchor":"middle","font-size":size||15},s));}
    tx(480,26,"列玩家：固定行，只比较第二个收益");
    data.game.columnLabels.forEach(function(s,j){tx(330+j*310,60,"C"+j+" · "+s,13);});
    data.game.rowLabels.forEach(function(s,i){
      tx(85,128+i*120,"R"+i,15);
      // Preserve the complete label without letting a 24-character name enter a cell.
      var chunks=Array.from(s).join("").match(/.{1,10}/gu)||[];
      chunks.forEach(function(c,k){tx(85,149+i*120+k*17,c,12);});
    });
    for(var i=0;i<2;i++)for(var j=0;j<2;j++){
      var ne=revealed&&equilibriumAt(data,i,j),social=revealed&&socialAt(data,i,j),x=180+j*310,y=80+i*120;
      svg.appendChild(svgElement(doc,"rect",{x:x,y:y,width:300,height:110,rx:6,fill:social?"var(--nash-gold)":"var(--bg)",
        "fill-opacity":social?.13:1,stroke:ne?"var(--nash-green)":"var(--border)","stroke-width":ne?3:1,"data-cell":i+","+j}));
      tx(x+150,y+37,"("+String(data.game.payoffs[i][j][0])+", "+String(data.game.payoffs[i][j][1])+")",16);
      if(revealed){
        var rb=data.bestResponses.rowByColumn[j].indexOf(i)>=0,cb=data.bestResponses.columnByRow[i].indexOf(j)>=0;
        tx(x+150,y+65,"行 BR："+(rb?"是":"否")+"　列 BR："+(cb?"是":"否"),13);
        tx(x+150,y+90,(ne?"纯 NE":"非纯 NE")+(social?" · 当前收益和最大":""),12);
      }
    }
    tx(450,350,revealed?"绿色框：纯 NE；金色底：当前收益和最大。两种标记分别判断。":"收益已经可见。请先逐列比较行收益，再逐行比较列收益。",13);
  }
  function drawEquilibria(doc,svg,data,trial,uid){
    clear(svg);svg.setAttribute("viewBox","0 0 900 600");svg.setAttribute("role","img");
    svg.setAttribute("aria-labelledby",uid+"-title "+uid+"-desc");
    svg.appendChild(svgElement(doc,"title",{id:uid+"-title"},"完整 Nash 均衡集合与当前策略点"));
    svg.appendChild(svgElement(doc,"desc",{id:uid+"-desc"},"横轴 p 是行玩家选 R0 的概率，纵轴 q 是列玩家选 C0 的概率。绿色是精确求得的点、线段或区域；橙色空心圆是当前策略。精确端点列在表中，图像不承担数值相等的判定。"));
    function tx(x,y,s,size,anchor){svg.appendChild(svgElement(doc,"text",{x:x,y:y,"font-size":size||14,"text-anchor":anchor||"middle"},s));}
    var X=function(p){return 110+440*p;},Y=function(q){return 490-440*q;};
    [0,.25,.5,.75,1].forEach(function(t){
      svg.appendChild(svgElement(doc,"line",{x1:X(t),x2:X(t),y1:50,y2:490,stroke:"var(--border)"}));
      svg.appendChild(svgElement(doc,"line",{x1:110,x2:550,y1:Y(t),y2:Y(t),stroke:"var(--border)"}));
      tx(X(t),515,String(t),13);tx(94,Y(t)+5,String(t),13,"end");
    });
    tx(330,552,"p = P(行玩家选择 R₀)",15);tx(110,28,"q = P(列玩家选择 C₀)",15,"start");
    data.equilibriumSets.forEach(function(s,i){
      var x=X(s.pRange[0]),x2=X(s.pRange[1]),y=Y(s.qRange[1]),y2=Y(s.qRange[0]);
      var attrs={"data-set":i,"data-type":s.type,stroke:"var(--nash-green)","stroke-width":5};
      var n;
      if(s.type==="point")n=svgElement(doc,"circle",Object.assign(attrs,{cx:x,cy:y,r:6,fill:"var(--nash-green)"}));
      else if(s.type==="region")n=svgElement(doc,"rect",Object.assign(attrs,{x:x,y:y,width:x2-x,height:y2-y,fill:"var(--nash-green)","fill-opacity":.13}));
      else n=svgElement(doc,"line",Object.assign(attrs,{x1:x,x2:x2,y1:y,y2:y2}));
      n.appendChild(svgElement(doc,"title",{},"集合 "+(i+1)+": p="+rangeText(s.exactP)+", q="+rangeText(s.exactQ)));svg.appendChild(n);
    });
    svg.appendChild(svgElement(doc,"circle",{"data-trial":true,cx:X(trial.p.value),cy:Y(trial.q.value),r:10,fill:"none",stroke:"var(--nash-gold)","stroke-width":3}));
    ["绿色：全部均衡集合","空心圆：当前策略点","p 与 q 是两人的不同概率","端点与交点请核对下表","小于像素的差别仍按分数判定"].forEach(function(s,i){tx(590,110+i*40,s,14,"start");});
    tx(450,586,"此图显示静态无偏离条件，不表示玩家会沿某条轨迹走到均衡。",14);
  }
  function mount(root,options,api){
    if(!root||root.getAttribute("data-nash-mounted"))return;
    root.setAttribute("data-nash-mounted","true");
    var doc=root.ownerDocument;installStyles(doc);
    var uid="nash-"+(++INSTANCE),state={predictions:[null,null,null],revealed:false,p:"1/2",q:"1/2"},data=null;
    var shell=element(doc,"div",{className:"nash-lab"});
    shell.appendChild(element(doc,"h3",{text:"先读收益，再检验单方面偏离"}));
    shell.appendChild(element(doc,"p",{className:"nash-note",text:"每格 (u,v) 先行后列。收益控件允许 −9 到 9 的整数；p、q 分别是两位玩家选第一个动作的概率。预设和自定义都按同一套最佳回应条件计算。"}));
    var select=element(doc,"select",{id:uid+"-preset","aria-label":"选择收益预设"});
    PRESETS.forEach(function(p){select.appendChild(element(doc,"option",{value:p.id,text:p.label}));});
    shell.appendChild(element(doc,"label",{for:select.id,text:"收益预设"}));shell.appendChild(select);
    var grid=element(doc,"fieldset",{className:"nash-payoff-grid"},element(doc,"legend",{text:"可编辑收益（R 表示行，C 表示列）"})),inputs=[];
    for(var i=0;i<2;i++)for(var j=0;j<2;j++)for(var k=0;k<2;k++){
      var id=uid+"-payoff-"+i+j+k,label="R"+i+" C"+j+" · "+(k===0?"行收益 u":"列收益 v");
      var input=element(doc,"input",{id:id,type:"number",min:-9,max:9,step:1,"data-payoff":i+","+j+","+k});
      grid.appendChild(element(doc,"label",{for:id},[element(doc,"span",{text:label}),input]));inputs.push(input);
      input.addEventListener("input",function(){state.revealed=false;render();});
    }
    shell.appendChild(grid);
    var matrix=svgElement(doc,"svg",{className:"nash-svg"});
    var matrixRegion=scrollRegion(doc,"收益矩阵，可横向滚动",matrix);shell.appendChild(matrixRegion);
    var questions=[
      ["全部 Nash 均衡有多少？",[["unique","恰好一个"],["multiple","有限多个"],["continuum","连续无穷多个"]]],
      ["是否存在 0 < p,q < 1 的均衡？",[["yes","存在"],["no","不存在"]]],
      ["当前收益和最大的每个纯格都是 NE 吗？",[["yes","全部都是"],["no","至少有一个不是"]]]
    ],buttons=[];
    questions.forEach(function(q,i){
      var field=element(doc,"fieldset",{className:"nash-question"},element(doc,"legend",{text:(i+1)+". "+q[0]}));
      var choices=element(doc,"div",{className:"nash-choice-grid"});
      q[1].forEach(function(pair){
        var b=element(doc,"button",{type:"button","data-question":i,"data-answer":pair[0],"aria-pressed":"false",text:pair[1]});
        b.addEventListener("click",function(){state.predictions[i]=pair[0];state.revealed=false;render();});
        choices.appendChild(b);buttons.push(b);
      });field.appendChild(choices);shell.appendChild(field);
    });
    var reveal=element(doc,"button",{type:"button",className:"nash-primary",text:"核对预测与完整均衡"});
    var reset=element(doc,"button",{type:"button",text:"重置实验"});
    shell.appendChild(element(doc,"div",{className:"nash-actions"},[reveal,reset]));
    var feedback=element(doc,"p",{className:"nash-feedback",role:"status","aria-live":"polite"});shell.appendChild(feedback);
    var panel=element(doc,"section",{className:"nash-revealed",hidden:true,"aria-labelledby":uid+"-result"});
    var heading=element(doc,"h4",{id:uid+"-result",tabindex:-1,text:"均衡、收益和与偏离收益分别核对"});panel.appendChild(heading);
    var metrics=element(doc,"div",{className:"nash-metrics"});panel.appendChild(metrics);
    var brRegion=scrollRegion(doc,"逐格最佳回应账本，可横向滚动");panel.appendChild(brRegion);
    var setRegion=scrollRegion(doc,"完整均衡概率范围，可横向滚动");panel.appendChild(setRegion);
    panel.appendChild(element(doc,"p",{className:"nash-note",text:"每行是一个闭集合 p 区间 × q 区间；不同集合可以相交，取它们的并集。纯均衡可能是线段端点，不要重复计数。分数是判定依据，图像只是定位。"}));
    var pointChoices=element(doc,"div",{className:"nash-actions"});panel.appendChild(pointChoices);
    var sliders=element(doc,"div",{className:"nash-probability"}),pInput=element(doc,"input",{id:uid+"-p",type:"range",min:0,max:100,step:1,value:50}),
      qInput=element(doc,"input",{id:uid+"-q",type:"range",min:0,max:100,step:1,value:50});
    var pOut=element(doc,"output",{for:pInput.id}),qOut=element(doc,"output",{for:qInput.id});
    sliders.appendChild(element(doc,"label",{for:pInput.id},["行玩家选 R₀ 的概率 p",pInput,pOut]));
    sliders.appendChild(element(doc,"label",{for:qInput.id},["列玩家选 C₀ 的概率 q",qInput,qOut]));panel.appendChild(sliders);
    panel.appendChild(element(doc,"p",{className:"nash-note",text:"滑块每次改变 1/100；“取集合中点”可选中 1/3 等精确分数，因此读数可能不在滑块刻度上。移动一人的滑块时，另一人的策略保持不变。"}));
    var diagram=svgElement(doc,"svg",{className:"nash-svg"});panel.appendChild(scrollRegion(doc,"概率平面均衡图，可横向滚动",diagram));
    var deviation=scrollRegion(doc,"当前策略的单方面偏离账本，可横向滚动");panel.appendChild(deviation);
    var verdict=element(doc,"p",{className:"nash-interpretation",role:"status","aria-live":"polite"});panel.appendChild(verdict);
    var minNote=element(doc,"p",{className:"nash-note"});panel.appendChild(minNote);
    shell.appendChild(panel);root.replaceChildren(shell);
    function fillPreset(){
      var p=presetById(select.value);
      inputs.forEach(function(x){var c=x.dataset.payoff.split(",").map(Number);x.value=p.payoffs[c[0]][c[1]][c[2]];});
      state.predictions=[null,null,null];state.revealed=false;state.p="1/2";state.q="1/2";render();
    }
    function readGame(){
      var p=presetById(select.value),g=copy(p.payoffs);
      inputs.forEach(function(x){
        if(x.value.trim()===""||!x.checkValidity())throw new RangeError("请保留并修正输入：每个收益必须是 −9 到 9 的整数。");
        var c=x.dataset.payoff.split(",").map(Number);g[c[0]][c[1]][c[2]]=Number(x.value);
      });
      return {presetId:select.value,payoffs:g};
    }
    function renderTrial(){
      if(!data||!state.revealed)return;
      var trial=deviationLedger(data.game,state.p,state.q);
      pInput.value=Math.round(trial.p.value*100);qInput.value=Math.round(trial.q.value*100);
      pOut.textContent="p = "+trial.p.exact+" ≈ "+format(trial.p.value,6);
      qOut.textContent="q = "+trial.q.exact+" ≈ "+format(trial.q.value,6);
      drawEquilibria(doc,diagram,data,trial,uid+"-plane");
      deviation.replaceChildren(tableOf(doc,"固定对手概率，只允许自己换策略；所有收益列均为精确分数",
        ["玩家","当前期望收益","全选动作 0","全选动作 1","最大可增加收益"],trial.players.map(function(x){
          return [x.player?"列玩家":"行玩家",x.current.exact,x.action0.exact,x.action1.exact,x.gain.exact];
        })));
      verdict.textContent=trial.isNash?"两人的最大可增加收益都严格等于 0：当前策略是 Nash 均衡。":
        "至少一人可以单方面增加收益：当前策略不是 Nash 均衡。图上的距离不能替代这两项检查。";
    }
    function render(){
      buttons.forEach(function(b){b.setAttribute("aria-pressed",String(state.predictions[Number(b.dataset.question)]===b.dataset.answer));});
      try{data=analyze(readGame());}catch(e){
        data=null;state.revealed=false;panel.hidden=true;matrixRegion.hidden=true;reveal.disabled=true;feedback.textContent=e.message;return;
      }
      matrixRegion.hidden=false;drawMatrix(doc,matrix,data,uid+"-matrix",state.revealed);
      reveal.disabled=state.predictions.some(function(p){return p===null;});panel.hidden=!state.revealed;
      if(!state.revealed){feedback.textContent="先看收益矩阵，完成三项预测后核对。";return;}
      var answers=[data.uniqueness,data.mixed.hasInterior?"yes":"no",data.socialOptimumIsNash?"yes":"no"];
      var score=answers.reduce(function(n,a,i){return n+(state.predictions[i]===a?1:0);},0);
      feedback.textContent="本次预测 "+score+" / 3。逐项结果："+questions.map(function(q,i){
        return (i+1)+". "+q[1].find(function(p){return p[0]===answers[i];})[1];
      }).join("；")+"。";
      metrics.replaceChildren(metric(doc,"全部均衡",data.equilibriumCount==="continuum"?"连续无穷多个":String(data.equilibriumCount)),
        metric(doc,"纯均衡数",String(data.pure.length)),metric(doc,"存在双方随机化",data.mixed.hasInterior?"是":"否"),
        metric(doc,"当前收益和最大值",data.socialOptima.exactMaximum));
      brRegion.replaceChildren(buildTable(doc,data));
      setRegion.replaceChildren(tableOf(doc,"全部均衡集合（精确闭区间；点为相同端点）",["集合","类型","p 范围","q 范围"],
        data.equilibriumSets.map(function(s,i){return [i+1,{"point":"点","p-line":"水平线段","q-line":"竖直线段","region":"二维区域"}[s.type],rangeText(s.exactP),rangeText(s.exactQ)];})));
      pointChoices.replaceChildren();
      data.equilibriumSets.forEach(function(s,i){
        var b=element(doc,"button",{type:"button",text:"取集合 "+(i+1)+" 的中点","data-midpoint":i});
        b.addEventListener("click",function(){
          state.p=exact(div(add(parseExact(s.exactP[0]),parseExact(s.exactP[1])),TWO));
          state.q=exact(div(add(parseExact(s.exactQ[0]),parseExact(s.exactQ[1])),TWO));renderTrial();
        });pointChoices.appendChild(b);
      });
      minNote.textContent=data.minimax.applicable?"零和核对：行方保底 "+data.minimax.lower.exact+"，列方上界 "+data.minimax.upper.exact+
        "，差为 "+data.minimax.exactGap+"。本表的值按行玩家收益计。":
        "此矩阵不是零和。两位玩家各自的收益与最佳回应已分开列出；这里不把 minimax 值当作一般和均衡的证书。";
      renderTrial();
    }
    select.addEventListener("change",fillPreset);
    reveal.addEventListener("click",function(){if(!reveal.disabled&&data){state.revealed=true;render();heading.focus();}});
    reset.addEventListener("click",function(){select.value=DEFAULT.presetId;fillPreset();buttons[0].focus();});
    pInput.addEventListener("input",function(){state.p=exact(rat(BigInt(pInput.value),100n));renderTrial();});
    qInput.addEventListener("input",function(){state.q=exact(rat(BigInt(qInput.value),100n));renderTrial();});
    fillPreset();
  }


  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    var dominant = analyze({ presetId: "dominant" });
    assert(dominant.pure.length === 1, "dominant has one pure NE");
    assert(dominant.pure[0].row === 1 && dominant.pure[0].column === 1, "dominant NE cell");
    assert(dominant.uniqueness === "unique" && dominant.existence.exists, "dominant existence/uniqueness");
    assert(!dominant.mixed.interior && !dominant.mixed.families.length, "dominant has no interior or continuum");
    assert(!dominant.socialOptimumIsNash && dominant.socialOptima.maximum === 6, "dominant separates social optimum");
    assert(!dominant.zeroSum && !dominant.minimax.applicable, "general-sum minimax is rejected");

    var coordination = analyze({ presetId: "coordination" });
    assert(coordination.pure.length === 2, "coordination has two pure NE");
    assert(coordination.mixed.interior && near(coordination.mixed.p, 1 / 3, 1e-8), "coordination mixed p");
    assert(near(coordination.mixed.q, 1 / 3, 1e-8), "coordination mixed q");
    assert(coordination.uniqueness === "multiple" && coordination.existence.exists, "coordination multiple");
    assert(coordination.socialOptimumIsNash, "coordination efficient equilibrium");

    var pennies = analyze({ presetId: "matching-pennies" });
    assert(pennies.pure.length === 0, "matching pennies has no pure NE");
    assert(pennies.mixed.interior && near(pennies.mixed.p, 0.5, 1e-10) && near(pennies.mixed.q, 0.5, 1e-10),
      "matching pennies mixed half");
    assert(pennies.uniqueness === "unique" && pennies.zeroSum, "matching pennies unique zero-sum");
    assert(pennies.minimax.applicable && near(pennies.minimax.value, 0, 1e-10) &&
      pennies.minimax.dualityGap < 1e-10, "matching pennies minimax value");
    var scaledPennies = analyze({
      payoffs: pennies.game.payoffs.map(function (row) {
        return row.map(function (cell) { return [cell[0] * 1e-12, cell[1] * 1e-12]; });
      })
    });
    assert(scaledPennies.mixed.interior && near(scaledPennies.mixed.p, 0.5, 1e-10) &&
      near(scaledPennies.mixed.q, 0.5, 1e-10) && scaledPennies.minimax.applicable &&
      near(scaledPennies.minimax.row.p, 0.5, 1e-10) && near(scaledPennies.minimax.column.q, 0.5, 1e-10),
    "positive scaling preserves mixed and minimax strategies");

    var degenerate = analyze({ presetId: "degenerate" });
    assert(degenerate.pure.length === 2, "degenerate boundary pure endpoints");
    assert(degenerate.mixed.families.length >= 1, "degenerate continuum detected");
    assert(degenerate.uniqueness === "continuum" && degenerate.existence.exists, "degenerate existence/uniqueness");
    assert(degenerate.mixed.families[0].pRange[0] === 0 && degenerate.mixed.families[0].pRange[1] === 1,
      "degenerate full p range");
    assert(degenerate.mixed.families[0].qRange[0] === 1 && degenerate.mixed.families[0].qRange[1] === 1,
      "degenerate dominant column boundary");

    PRESETS.forEach(function (preset) {
      var result = analyze({ presetId: preset.id });
      assert(result.bestResponses.rowByColumn.length === 2 && result.bestResponses.columnByRow.length === 2,
        preset.id + " best-response shape");
      result.pure.forEach(function (cell) {
        assert(result.bestResponses.rowByColumn[cell.column].indexOf(cell.row) >= 0, preset.id + " row BR");
        assert(result.bestResponses.columnByRow[cell.row].indexOf(cell.column) >= 0, preset.id + " column BR");
      });
      assert(result.socialOptima.cells.length >= 1, preset.id + " social optimum");
      assert(result.existence.exists, preset.id + " Nash existence");
    });
    var custom = analyze({
      payoffs: [
        [[2, 1], [0, 0]],
        [[0, 0], [1, 2]]
      ],
      rowLabels: ["a", "b"],
      columnLabels: ["x", "y"]
    });
    assert(custom.mixed.interior && finite(custom.mixed.p) && finite(custom.mixed.q), "custom mixed solve");
    assert(near(custom.mixed.p, 2 / 3, 1e-10) && near(custom.mixed.q, 1 / 3, 1e-10),
      "custom mixed probabilities use the opponent payoff differences");
    assert(expectedPayoffs(custom.game, custom.mixed.p, custom.mixed.q).length === 2, "expected payoff vector");

    function affinePayoffs(payoffs, rowScale, rowShift, columnScale, columnShift) {
      return payoffs.map(function (row) {
        return row.map(function (cell) {
          return [cell[0] * rowScale + rowShift, cell[1] * columnScale + columnShift];
        });
      });
    }

    function hasFamily(families, pRange, qRange) {
      return families.some(function (family) {
        return near(family.pRange[0], pRange[0], 1e-10) && near(family.pRange[1], pRange[1], 1e-10) &&
          near(family.qRange[0], qRange[0], 1e-10) && near(family.qRange[1], qRange[1], 1e-10);
      });
    }

    var crossLine = analyze({
      payoffs: [
        [[0, 1], [0, 0]],
        [[0, 0], [0, 1]]
      ]
    });
    assert(crossLine.mixed.families.length === 3, "cross-line returns both horizontal segments and vertical line");
    assert(hasFamily(crossLine.mixed.families, [0.5, 0.5], [0, 1]), "cross-line keeps internal vertical family");
    assert(hasFamily(crossLine.mixed.families, [0, 0.5], [0, 0]), "cross-line keeps lower horizontal family");
    assert(hasFamily(crossLine.mixed.families, [0.5, 1], [1, 1]), "cross-line keeps upper horizontal family");

    var shiftedDominant = analyze({
      payoffs: affinePayoffs(dominant.game.payoffs, 1, 1e12, 1, 1e12)
    });
    assert(shiftedDominant.pure.length === 1 && shiftedDominant.pure[0].row === 1 &&
      shiftedDominant.pure[0].column === 1, "large translation preserves prisoner dilemma pure NE");
    assert(shiftedDominant.bestResponses.rowByColumn[0][0] === 1 &&
      shiftedDominant.bestResponses.columnByRow[0][0] === 1, "large translation preserves strict best responses");
    assert(shiftedDominant.socialOptima.cells.length === 1 && shiftedDominant.socialOptima.cells[0].row === 0 &&
      shiftedDominant.socialOptima.cells[0].column === 0 && !shiftedDominant.socialOptimumIsNash,
    "large translation preserves payoff-sum maximizer and separation");

    var scaledCustom = analyze({
      payoffs: affinePayoffs(custom.game.payoffs, 7, 1e12, 0.25, -1e12)
    });
    assert(scaledCustom.pure.length === custom.pure.length && scaledCustom.pure.every(function (cell, index) {
      return cell.row === custom.pure[index].row && cell.column === custom.pure[index].column;
    }), "independent positive affine transforms preserve pure NE");
    assert(scaledCustom.mixed.interior && near(scaledCustom.mixed.p, custom.mixed.p, 1e-10) &&
      near(scaledCustom.mixed.q, custom.mixed.q, 1e-10),
    "independent positive affine transforms preserve mixed probabilities");

    var scaledCrossLine = analyze({
      payoffs: affinePayoffs(crossLine.game.payoffs, 13, 1e12, 0.125, -1e12)
    });
    assert(hasFamily(scaledCrossLine.mixed.families, [0.5, 0.5], [0, 1]),
      "positive scaling preserves an internal degenerate cross-line");
    assert(scaledCrossLine.pure.length === crossLine.pure.length, "positive scaling preserves cross-line pure endpoints");

    var commonAffine = analyze({
      payoffs: affinePayoffs(dominant.game.payoffs, 5, 1e12, 5, -1e12)
    });
    assert(commonAffine.socialOptima.cells.length === dominant.socialOptima.cells.length &&
      commonAffine.socialOptima.cells[0].row === dominant.socialOptima.cells[0].row &&
      commonAffine.socialOptima.cells[0].column === dominant.socialOptima.cells[0].column,
    "common positive scaling and translations preserve payoff-sum maximizer");
    var independentlyScaledSocial = analyze({
      payoffs: affinePayoffs(dominant.game.payoffs, 100, 0, 1, 0)
    });
    assert(independentlyScaledSocial.socialOptima.cells[0].row === 1 &&
      independentlyScaledSocial.socialOptima.cells[0].column === 0 &&
      independentlyScaledSocial.socialOptima.normalization.indexOf("not independently affine-invariant") >= 0,
    "payoff-sum maximizer records its current normalization caveat");
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    DEFAULT: DEFAULT,
    PRESETS: PRESETS,
    normalizeGame: normalizeGame,
    expectedPayoffs: expectedPayoffs,
    deviationLedger: deviationLedger,
    drawMatrix: drawMatrix,
    drawEquilibria: drawEquilibria,
    bestResponses: bestResponses,
    pureEquilibria: pureEquilibria,
    mixedEquilibrium: mixedEquilibrium,
    solveMixedEquilibrium: mixedEquilibrium,
    socialOptima: socialOptima,
    payoffSumMaximizer: socialOptima,
    isZeroSum: isZeroSum,
    minimax: minimax,
    analyze: analyze,
    compute: analyze,
    mount: mount,
    selfTest: selfTest
  };
});

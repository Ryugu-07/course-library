(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("zero-sum-dynamic", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("zero-sum-dynamic self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("zero-sum-dynamic self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-zero-sum-dynamic-lab-styles";
  var INSTANCE = 0;
  var STAGE_PRESETS = [
    { id: "pennies", label: "Matching pennies：纯策略无鞍点", matrix: [[1, -1], [-1, 1]] },
    { id: "mixed", label: "一般混合：值不在格点", matrix: [[3, 0], [1, 2]] },
    { id: "saddle", label: "纯鞍点：混合退化", matrix: [[3, 0], [5, 1]] }
  ];
  // Probability of next state 0, in exact twentieths.
  var TRANSITION_ZERO=[[[18,4],[5,15]],[[14,3],[7,16]]];
  var DEFAULTS={preset:"pennies",gamma:0.8,mobility:1,iterations:24,samples:240,initial:0,seed:20260722};
  var STYLE_TEXT = [
    ".zero-sum-dynamic-lab{--zsd-blue:var(--cl-blue,#315f9d);--zsd-gold:var(--cl-gold,#9b6a12);--zsd-green:var(--cl-green,#39734d);--zsd-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".zero-sum-dynamic-lab *{box-sizing:border-box}.zero-sum-dynamic-lab [hidden]{display:none!important}.zero-sum-dynamic-lab h3,.zero-sum-dynamic-lab h4{margin:0 0 8px;line-height:1.35}.zero-sum-dynamic-lab p{margin:8px 0}.zero-sum-dynamic-lab button,.zero-sum-dynamic-lab input,.zero-sum-dynamic-lab select{font:inherit}.zero-sum-dynamic-lab button,.zero-sum-dynamic-lab select{min-height:44px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg)}.zero-sum-dynamic-lab button{padding:8px 12px;cursor:pointer}.zero-sum-dynamic-lab button:hover,.zero-sum-dynamic-lab select:hover{border-color:var(--accent)}.zero-sum-dynamic-lab button[aria-pressed='true'],.zero-sum-dynamic-lab .zsd-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750}.zero-sum-dynamic-lab button:focus-visible,.zero-sum-dynamic-lab select:focus-visible,.zero-sum-dynamic-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
    ".zero-sum-dynamic-lab .zsd-note,.zero-sum-dynamic-lab .zsd-feedback{color:var(--fg-soft);font-size:13px;line-height:1.7}.zero-sum-dynamic-lab .zsd-presets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}.zero-sum-dynamic-lab .zsd-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:14px 0;padding:12px;border-top:2px solid var(--accent);border-bottom:1px solid var(--border)}.zero-sum-dynamic-lab .zsd-control{display:grid;gap:5px;min-width:0}.zero-sum-dynamic-lab .zsd-control label{color:var(--fg-soft);font-size:12.5px;font-weight:750}.zero-sum-dynamic-lab .zsd-control output{color:var(--accent);font-variant-numeric:tabular-nums}.zero-sum-dynamic-lab input[type='range']{width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
    ".zero-sum-dynamic-lab .zsd-predict{margin:14px 0;padding:12px 14px;border-left:3px solid var(--zsd-gold);background:var(--bg)}.zero-sum-dynamic-lab .zsd-predict strong{display:block;margin-bottom:8px}.zero-sum-dynamic-lab .zsd-question-list{display:grid;gap:10px}.zero-sum-dynamic-lab .zsd-question{min-width:0;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg)}.zero-sum-dynamic-lab .zsd-question legend{padding:0 4px;color:var(--fg-soft);font-size:12.5px;font-weight:750;line-height:1.5}.zero-sum-dynamic-lab .zsd-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.zero-sum-dynamic-lab .zsd-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.zero-sum-dynamic-lab .zsd-actions>*{flex:1 1 170px}.zero-sum-dynamic-lab .zsd-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.zero-sum-dynamic-lab .zsd-pass{color:var(--zsd-green)}.zero-sum-dynamic-lab .zsd-warn{color:var(--zsd-red)}",
    ".zero-sum-dynamic-lab .zsd-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.zero-sum-dynamic-lab .zsd-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0}.zero-sum-dynamic-lab .zsd-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.zero-sum-dynamic-lab .zsd-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4}.zero-sum-dynamic-lab .zsd-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.zero-sum-dynamic-lab .zsd-layout{display:grid;grid-template-columns:minmax(230px,.75fr) minmax(0,1.25fr);gap:14px;align-items:start}.zero-sum-dynamic-lab .zsd-panel{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg)}.zero-sum-dynamic-lab .zsd-panel h4{font-size:13px;color:var(--fg-soft)}.zero-sum-dynamic-lab svg{display:block;width:100%;height:auto;color:var(--fg)}.zero-sum-dynamic-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.zero-sum-dynamic-lab .zsd-grid{stroke:currentColor;stroke-opacity:.15;stroke-width:1}.zero-sum-dynamic-lab .zsd-axis{stroke:currentColor;stroke-opacity:.65;stroke-width:1.2}.zero-sum-dynamic-lab .zsd-line-a{fill:none;stroke:var(--zsd-blue);stroke-width:3}.zero-sum-dynamic-lab .zsd-line-b{fill:none;stroke:var(--zsd-gold);stroke-width:3}.zero-sum-dynamic-lab .zsd-line-r{fill:none;stroke:var(--zsd-red);stroke-width:2;stroke-dasharray:6 4}.zero-sum-dynamic-lab .zsd-cell{fill:var(--bg);stroke:var(--border);stroke-width:1}.zero-sum-dynamic-lab .zsd-cell-good{fill:color-mix(in srgb,var(--zsd-green) 20%,var(--bg));stroke:var(--zsd-green);stroke-width:2}.zero-sum-dynamic-lab .zsd-legend{display:flex;flex-wrap:wrap;gap:7px 14px;margin:7px 2px 0;color:var(--fg-soft);font-size:12px}.zero-sum-dynamic-lab .zsd-swatch{display:inline-block;width:24px;height:0;margin-right:5px;border-top:3px solid currentColor;vertical-align:middle}.zero-sum-dynamic-lab .zsd-dash{border-top-style:dashed}",
    ".zero-sum-dynamic-lab .zsd-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:14px}.zero-sum-dynamic-lab table{width:100%;min-width:680px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.zero-sum-dynamic-lab th,.zero-sum-dynamic-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}.zero-sum-dynamic-lab th{color:var(--fg-soft);font-size:11.5px}.zero-sum-dynamic-lab td:not(:first-child){text-align:right}.zero-sum-dynamic-lab .zsd-boundary{margin-top:12px;padding:10px 12px;border-left:3px solid var(--zsd-red);background:var(--bg);color:var(--fg-soft);font-size:13px;line-height:1.7}",
    "@media(max-width:900px){.zero-sum-dynamic-lab .zsd-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.zero-sum-dynamic-lab .zsd-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:620px){.zero-sum-dynamic-lab .zsd-presets,.zero-sum-dynamic-lab .zsd-controls{grid-template-columns:minmax(0,1fr)}.zero-sum-dynamic-lab .zsd-options{grid-template-columns:minmax(0,1fr)}.zero-sum-dynamic-lab .zsd-panel{padding:5px}}@media(prefers-reduced-motion:reduce){.zero-sum-dynamic-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("");


  STYLE_TEXT += [
    ".zero-sum-dynamic-lab .zsd-scroll{max-width:100%;overflow:auto;max-height:480px;margin:14px 0;border:1px solid var(--border);border-radius:6px;background:var(--bg)}",
    ".zero-sum-dynamic-lab .zsd-scroll svg{display:block;width:900px;min-width:900px;max-width:none;height:auto}.zero-sum-dynamic-lab .zsd-scroll:focus-visible,.zero-sum-dynamic-lab summary:focus-visible,.zero-sum-dynamic-lab [tabindex='-1']:focus{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
    ".zero-sum-dynamic-lab .zsd-controls{grid-template-columns:repeat(3,minmax(0,1fr))}.zero-sum-dynamic-lab .zsd-controls label{display:grid;gap:6px;font-size:13px;min-width:0}.zero-sum-dynamic-lab .zsd-controls input,.zero-sum-dynamic-lab .zsd-controls select{width:100%;max-width:100%;min-height:44px;margin:0;padding:7px;color:var(--fg);background:var(--bg);border:1px solid var(--border);border-radius:5px}.zero-sum-dynamic-lab input[type=range]{padding:0}.zero-sum-dynamic-lab output{font-size:12px;color:var(--fg-soft)}",
    ".zero-sum-dynamic-lab .zsd-question{margin:12px 0}.zero-sum-dynamic-lab .zsd-options{grid-template-columns:repeat(2,minmax(0,1fr))}.zero-sum-dynamic-lab button:disabled{opacity:.5;cursor:not-allowed}.zero-sum-dynamic-lab h4{margin-top:18px}",
    ".zero-sum-dynamic-lab table{min-width:900px}.zero-sum-dynamic-lab caption{text-align:left;color:var(--fg-soft);padding:8px;font-size:13px}.zero-sum-dynamic-lab .zsd-exact{max-width:320px;overflow-wrap:anywhere}.zero-sum-dynamic-lab summary{cursor:pointer;min-height:32px;padding:4px}.zero-sum-dynamic-lab .zsd-exact div{font-size:12px;line-height:1.6;padding:5px}",
    "@media(max-width:650px){.zero-sum-dynamic-lab .zsd-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.zero-sum-dynamic-lab .zsd-options{grid-template-columns:1fr}}",
    "@media(prefers-reduced-motion:reduce){html:has(.zero-sum-dynamic-lab){scroll-behavior:auto!important}}"
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

  function checkNumber(x,name,lo,hi,integer){
    if(!finite(x)||x<lo||x>hi||(integer&&!Number.isInteger(x)))throw new RangeError(name+" out of range");
    return x;
  }
  function presetById(id){
    var p=STAGE_PRESETS.find(function(x){return x.id===id;});
    if(!p)throw new RangeError("unknown stage preset");return p;
  }
  function matrixR(input){
    if(!Array.isArray(input)||input.length!==2)throw new RangeError("matrix must be 2x2");
    var out=[];
    for(var i=0;i<2;i++){
      if(!Array.isArray(input[i])||input[i].length!==2)throw new RangeError("matrix must be 2x2");
      out[i]=[];
      for(var j=0;j<2;j++)out[i][j]=fromNumber(input[i][j]);
    }
    return out;
  }
  function minR(a,b){return cmp(a,b)<=0?a:b;}
  function maxR(a,b){return cmp(a,b)>=0?a:b;}
  function absR(a){return cmp(a,ZERO)<0?neg(a):a;}
  function lerp(a,b,t){return add(mul(sub(ONE,t),a),mul(t,b));}
  function solveR(g){
    var a=g[0][0],b=g[0][1],c=g[1][0],d=g[1][1],p=null,q=null,cells=[];
    var rowSecurity=maxR(minR(a,b),minR(c,d)),columnSecurity=minR(maxR(a,c),maxR(b,d));
    for(var i=0;i<2;i++)for(var j=0;j<2;j++)
      if(!cmp(g[i][j],minR(g[i][0],g[i][1]))&&!cmp(g[i][j],maxR(g[0][j],g[1][j])))cells.push({row:i,column:j});
    if(cells.length){p=cells[0].row===0?ONE:ZERO;q=cells[0].column===0?ONE:ZERO;}
    else{
      var denominator=add(sub(sub(a,b),c),d);
      p=div(sub(d,c),denominator);q=div(sub(d,b),denominator);
      if(cmp(p,ZERO)<=0||cmp(p,ONE)>=0||cmp(q,ZERO)<=0||cmp(q,ONE)>=0)
        throw new Error("2x2 saddle existence invariant failed");
    }
    var lower=minR(lerp(c,a,p),lerp(d,b,p)),upper=maxR(lerp(b,a,q),lerp(d,c,q));
    if(cmp(lower,upper))throw new Error("exact primal/dual saddle gap");
    return {p:p,q:q,value:lower,lower:lower,upper:upper,cells:cells,rowSecurity:rowSecurity,columnSecurity:columnSecurity};
  }
  function solvedPacket(s){
    return {value:asNumber(s.value),exactValue:exact(s.value),rowProbability:asNumber(s.p),columnProbability:asNumber(s.q),
      exactP:exact(s.p),exactQ:exact(s.q),mixed:!s.cells.length,pure:!!s.cells.length,pureCells:s.cells,
      rowSecurity:asNumber(s.rowSecurity),columnSecurity:asNumber(s.columnSecurity),
      exactRowSecurity:exact(s.rowSecurity),exactColumnSecurity:exact(s.columnSecurity),
      lower:packet(s.lower),upper:packet(s.upper),exactGap:"0"};
  }
  function matrixValue(matrix){return solvedPacket(solveR(matrixR(matrix)));}
  function copyConfig(input){
    if(input===undefined)input={};
    if(!input||typeof input!=="object"||Array.isArray(input))throw new TypeError("config must be an object");
    var c={};Object.keys(DEFAULTS).forEach(function(k){c[k]=input[k]===undefined?DEFAULTS[k]:input[k];});
    presetById(c.preset);checkNumber(c.gamma,"gamma",0,1);checkNumber(c.mobility,"mobility",0,1);
    checkNumber(c.iterations,"iterations",0,80,true);checkNumber(c.samples,"samples",20,2000,true);
    checkNumber(c.initial,"initial",-10,10);checkNumber(c.seed,"seed",0,4294967295,true);return c;
  }
  function vectorR(values){
    if(!Array.isArray(values)||values.length!==2)throw new RangeError("values must have two components");
    return [fromNumber(values[0]),fromNumber(values[1])];
  }
  function optionsConfig(gamma,options){
    if(options===undefined)options={};
    if(!options||typeof options!=="object"||Array.isArray(options))throw new TypeError("options must be an object");
    return copyConfig({gamma:gamma,preset:options.preset,mobility:options.mobility});
  }
  function transitionR(state,i,j,mobility){
    var base=rat(BigInt(TRANSITION_ZERO[state][i][j]),20n);
    return add(mul(sub(ONE,mobility),state===0?ONE:ZERO),mul(mobility,base));
  }
  function dynamicR(state,values,config){
    var matrix=presetById(config.preset).matrix,gamma=fromNumber(config.gamma),mob=fromNumber(config.mobility);
    return matrix.map(function(row,i){return row.map(function(reward,j){
      var p0=transitionR(state,i,j,mob),future=lerp(values[1],values[0],p0);
      return add(rat(BigInt(reward+state)),mul(gamma,future));
    });});
  }
  function dynamicMatrix(state,values,gamma,options){
    checkNumber(state,"state",0,1,true);var v=vectorR(values),c=optionsConfig(gamma,options);
    return dynamicR(state,v,c).map(function(row){return row.map(asNumber);});
  }
  function rawShapley(values,config){
    var v=vectorR(values),matrices=[dynamicR(0,v,config),dynamicR(1,v,config)];
    return {matrices:matrices,solutions:matrices.map(solveR)};
  }
  function shapley(values,gamma,options){
    var raw=rawShapley(values,optionsConfig(gamma,options));
    var rounded=raw.solutions.map(function(s){return asNumber(s.value);});
    if(rounded.some(function(v){return v===null;}))throw new RangeError("Shapley value exceeds finite display range");
    return {values:rounded,exactValues:raw.solutions.map(function(s){return exact(s.value);}),
      matrices:raw.matrices.map(function(g){return g.map(function(row){return row.map(asNumber);});}),
      exactMatrices:raw.matrices.map(function(g){return g.map(function(row){return row.map(exact);});}),
      certificates:raw.solutions.map(solvedPacket)};
  }
  function upperNumber(a){
    if(cmp(a,ZERO)<0)throw new RangeError("upperNumber expects a nonnegative rational");
    var v=asNumber(a);if(v===null)return null;
    if(cmp(fromNumber(v),a)>=0)return v;
    var d=new DataView(new ArrayBuffer(8));d.setFloat64(0,v);d.setBigUint64(0,d.getBigUint64(0)+1n);
    var up=d.getFloat64(0);return finite(up)?up:null;
  }
  function normInf(a,b){return Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]));}
  function makeRng(seed){
    var state=checkNumber(seed,"seed",0,4294967295,true);
    return function(){state=(Math.imul(1664525,state)+1013904223)>>>0;return state;};
  }
  function drawAction(rng,p){
    // Uniform midpoint grid. The rational threshold is not rounded to 0 or 1.
    return (2n*BigInt(rng())+1n)*p.d < p.n*8589934592n?0:1;
  }
  function sqrtR(a){
    if(a.n<0n)throw new RangeError("negative square root");
    if(a.n===0n)return 0;
    var e=a.n.toString(2).length-a.d.toString(2).length;
    if(e>=0?a.n<(a.d<<BigInt(e)):(a.n<<BigInt(-e))<a.d)e--;
    var half=Math.floor(e/2),shift=-2*half;
    var scaled=shift>=0?rat(a.n<<BigInt(shift),a.d):rat(a.n,a.d<<BigInt(-shift));
    var m=Math.sqrt(asNumber(scaled));
    var v=half< -1022?m*Math.pow(2,half+1074)*Number.MIN_VALUE:m*Math.pow(2,half);
    return finite(v)?v:null;
  }
  function sampleRaw(matrix,p,q,samples,seed){
    var rng=makeRng(seed),counts=[[0,0],[0,0]],total=ZERO,prefix=[];
    var weights=[[mul(p,q),mul(p,sub(ONE,q))],[mul(sub(ONE,p),q),mul(sub(ONE,p),sub(ONE,q))]];
    var mean=ZERO,variance=ZERO;
    for(var i=0;i<2;i++)for(var j=0;j<2;j++)mean=add(mean,mul(weights[i][j],matrix[i][j]));
    for(var i=0;i<2;i++)for(var j=0;j<2;j++){
      var delta=sub(matrix[i][j],mean);variance=add(variance,mul(weights[i][j],mul(delta,delta)));
    }
    for(var k=1;k<=samples;k++){
      var i=drawAction(rng,p),j=drawAction(rng,q);counts[i][j]++;total=add(total,matrix[i][j]);
      prefix.push(asNumber(div(total,rat(BigInt(k)))));
    }
    var actual=div(total,rat(BigInt(samples))),seSquared=div(variance,rat(BigInt(samples)));
    var se=sqrtR(seSquared);
    return {counts:counts,total:packet(total),mean:packet(actual),expected:packet(mean),variance:packet(variance),
      seSquared:packet(seSquared),standardError:se,exactDifference:exact(sub(actual,mean)),
      difference:asNumber(sub(actual,mean)),prefix:prefix,samples:samples,seed:seed,exactP:exact(p),exactQ:exact(q)};
  }
  function sampleLedger(matrix,p,q,samples,seed){
    checkNumber(samples,"samples",1,10000,true);
    return sampleRaw(matrixR(matrix),probability(p),probability(q),samples,seed);
  }
  function sampleMatrix(matrix,p,q,samples,seed){return sampleLedger(matrix,p,q,samples,seed).mean.value;}
  function iterate(input){
    var config=copyConfig(input),values=[config.initial,config.initial],rows=[];
    var gamma=fromNumber(config.gamma),den=sub(ONE,gamma),fixed=null;
    if(config.gamma<1 && (config.mobility===0||config.gamma===0)){
      var sv=solveR(matrixR(presetById(config.preset).matrix)).value;
      fixed=[div(sv,den),div(add(sv,ONE),den)];
    }
    for(var step=0;step<=config.iterations;step++){
      var update=shapley(values,config.gamma,config),residual=ZERO;
      for(var s=0;s<2;s++)residual=maxR(residual,absR(sub(parseExact(update.exactValues[s]),fromNumber(values[s]))));
      var bound=config.gamma<1?div(residual,den):null,actualError=null;
      if(fixed)actualError=maxR(absR(sub(fromNumber(values[0]),fixed[0])),absR(sub(fromNumber(values[1]),fixed[1])));
      rows.push({step:step,values:values.slice(),next:update.values.slice(),exactNext:update.exactValues,
        residual:asNumber(residual),exactResidual:exact(residual),bound:bound?upperNumber(bound):null,
        exactBound:bound?exact(bound):null,actualError:actualError?upperNumber(actualError):null,
        certificates:update.certificates,matrices:update.matrices,exactMatrices:update.exactMatrices});
      values=update.values;
    }
    var last=rows[rows.length-1],sampling=last.certificates.map(function(c,s){
      var g=last.exactMatrices[s].map(function(row){return row.map(parseExact);});
      return sampleRaw(g,parseExact(c.exactP),parseExact(c.exactQ),config.samples,(config.seed+(s?29:11))>>>0);
    });
    var modelRows=[],mob=fromNumber(config.mobility),stageMatrix=presetById(config.preset).matrix.map(function(row){return row.slice();});
    for(var s=0;s<2;s++)for(var i=0;i<2;i++)for(var j=0;j<2;j++){
      var p0=transitionR(s,i,j,mob);
      modelRows.push({state:s,row:i,column:j,reward:stageMatrix[i][j]+s,p0:packet(p0),p1:packet(sub(ONE,p0))});
    }
    return {config:config,rows:rows,last:last,stage:matrixValue(stageMatrix),stageMatrix:stageMatrix,
      sampled:sampling.map(function(s){return s.mean.value;}),sampling:sampling,modelRows:modelRows,
      contractive:config.gamma<1,closedForm:fixed?fixed.map(packet):null};
  }
  function format(value,digits){
    if(value===null||value===undefined||!finite(value))return "—";
    var places=digits===undefined?6:digits;
    if(value!==0&&(Math.abs(value)>=10000||Math.abs(value)<.0001))return value.toExponential(4);
    var s=value.toFixed(places);return places?s.replace(/0+$/,"").replace(/\.$/,""):s;
  }

  function assert(c,m){if(!c)throw new Error(m);}

  function node(doc,tag,attrs,children){
    var e=doc.createElement(tag);
    Object.keys(attrs||{}).forEach(function(k){var v=attrs[k];if(v===undefined||v===null||v===false)return;
      if(k==="text")e.textContent=v;else e.setAttribute(k==="className"?"class":k,v===true?"":String(v));});
    (Array.isArray(children)?children:children===undefined?[]:[children]).forEach(function(c){e.appendChild(c&&c.nodeType?c:doc.createTextNode(String(c)));});return e;
  }
  function svgNode(doc,tag,attrs,text){
    var e=doc.createElementNS(SVG_NS,tag);Object.keys(attrs||{}).forEach(function(k){e.setAttribute(k,String(attrs[k]));});
    if(text!==undefined)e.textContent=text;return e;
  }
  function installStyles(doc){
    if(doc.getElementById(STYLE_ID))return;var s=node(doc,"style",{id:STYLE_ID,text:STYLE_TEXT});doc.head.appendChild(s);
  }
  function region(doc,label,child){
    return node(doc,"div",{className:"zsd-scroll",tabindex:0,role:"region","aria-label":label},child);
  }
  function table(doc,caption,headers,rows){
    return node(doc,"table",{},[
      node(doc,"caption",{text:caption}),
      node(doc,"thead",{},node(doc,"tr",{},headers.map(function(h){return node(doc,"th",{scope:"col",text:h});}))),
      node(doc,"tbody",{},rows.map(function(row){return node(doc,"tr",{},row.map(function(v,i){return node(doc,i?"td":"th",i?{}:{scope:"row"},v);}));}))
    ]);
  }
  function exactDetails(doc,label,entries){
    return node(doc,"details",{className:"zsd-exact"},[node(doc,"summary",{text:label}),
      node(doc,"div",{text:entries.join("；")})]);
  }
  function drawStageMatrix(doc,data,revealed,uid){
    var svg=svgNode(doc,"svg",{viewBox:"0 0 900 340",role:"img","aria-labelledby":uid+"-title "+uid+"-desc"});
    svg.appendChild(svgNode(doc,"title",{id:uid+"-title"},"阶段零和收益矩阵"));
    svg.appendChild(svgNode(doc,"desc",{id:uid+"-desc"},revealed?
      "数值为行玩家收益，列玩家收益取相反数。绿色只标出同时是该行最小值与该列最大值的实际纯鞍点。":
      "数值为行玩家收益，列玩家收益取相反数。当前只显示已知矩阵，求解结果在预测后揭示。"));
    function tx(x,y,t,size){svg.appendChild(svgNode(doc,"text",{x:x,y:y,"text-anchor":"middle","font-size":size||15},t));}
    tx(450,28,"行玩家最大化，列玩家最小化；行动同时选择",17);
    tx(350,66,"C₀");tx(620,66,"C₁");tx(150,129,"R₀");tx(150,225,"R₁");
    for(var i=0;i<2;i++)for(var j=0;j<2;j++){
      var good=revealed&&data.stage.pureCells.some(function(c){return c.row===i&&c.column===j;});
      svg.appendChild(svgNode(doc,"rect",{x:220+j*270,y:82+i*96,width:260,height:86,rx:5,
        fill:good?"var(--zsd-green)":"var(--bg)","fill-opacity":good?.15:1,stroke:good?"var(--zsd-green)":"var(--border)",
        "stroke-width":good?3:1,"data-cell":i+","+j,"data-pure":String(good)}));
      tx(350+j*270,119+i*96,String(data.stageMatrix[i][j]),22);
      if(revealed)tx(350+j*270,146+i*96,good?"纯鞍点":"不是纯鞍点",13);
    }
    tx(450,291,revealed?"一组最优概率：p="+data.stage.exactP+"，q="+data.stage.exactQ+"；值="+data.stage.exactValue:"逐行找最小值作为保底，逐列找最大值作为上界。",15);
    tx(450,321,revealed?"值相同的格不一定是鞍点；还要核对所在行和列。":"下方两个状态的奖励分别为 A 与 A+1；转移表完整列出。",13);
    return svg;
  }
  function rationalLog10(value){
    var a=parseExact(value);if(a.n<=0n)return null;
    function logInteger(n){var bits=n.toString(2).length,shift=Math.max(0,bits-53);
      return Math.log10(Number(n>>BigInt(shift)))+shift*Math.LOG10E*Math.LN2;}
    return logInteger(a.n)-logInteger(a.d);
  }
  function drawSeries(doc,series,options,uid){
    var svg=svgNode(doc,"svg",{viewBox:"0 0 900 "+(options.log?410:380),role:"img","aria-labelledby":uid+"-title "+uid+"-desc"});
    svg.appendChild(svgNode(doc,"title",{id:uid+"-title"},options.title));
    svg.appendChild(svgNode(doc,"desc",{id:uid+"-desc"},options.description));
    var left=125,right=865,top=45,bottom=278,maxX=Math.max(1,options.maximumX),all=[];
    function zero(p){return p.zero===undefined?p.y===0:p.zero;}
    function logged(p){return p.logValue===undefined?Math.log10(p.y):p.logValue;}
    series.forEach(function(s){s.points.forEach(function(p){if(p.y!==null && (!options.log||!zero(p)))all.push(options.log?logged(p):p.y);});});
    var minimum=all.length?Math.min.apply(Math,all):0,maximum=all.length?Math.max.apply(Math,all):1;
    if(options.log && maximum-minimum<1){var center=(minimum+maximum)/2;minimum=center-.5;maximum=center+.5;}
    else if(minimum===maximum){var pad=minimum===0?1:Math.abs(minimum)*.1;minimum-=pad;maximum+=pad;}
    var x=function(v){return left+v/maxX*(right-left);},y=function(v){return top+(maximum-v)/(maximum-minimum)*(bottom-top);};
    function tx(xx,yy,t,anchor,size){svg.appendChild(svgNode(doc,"text",{x:xx,y:yy,"text-anchor":anchor||"middle","font-size":size||13},t));}
    tx(left,24,options.title,"start",16);
    for(var k=0;k<=4;k++){
      var yy=top+k/4*(bottom-top),v=maximum-k/4*(maximum-minimum);
      svg.appendChild(svgNode(doc,"line",{x1:left,x2:right,y1:yy,y2:yy,class:"zsd-grid"}));
      tx(left-12,yy+4,options.log?format(v,2):format(v,4),"end",12);
      var xx=left+k/4*(right-left);tx(xx,bottom+23,format(k/4*maxX,2),"middle",12);
    }
    series.forEach(function(s,index){
      var d="",previous=false;
      s.points.forEach(function(p){
        if(p.y===null){previous=false;return;}
        if(options.log&&zero(p)){
          svg.appendChild(svgNode(doc,"circle",{cx:x(p.x),cy:bottom+48,r:3,fill:s.color,"data-zero-series":index}));previous=false;return;
        }
        var yy=y(options.log?logged(p):p.y);
        if(options.log)svg.appendChild(svgNode(doc,"circle",{cx:x(p.x),cy:yy,r:2,fill:s.color,"data-positive-series":index}));
        d+=(previous?" L":" M")+x(p.x).toFixed(3)+" "+yy.toFixed(3);previous=true;
      });
      svg.appendChild(svgNode(doc,"path",{d:d.trim(),fill:"none",stroke:s.color,"stroke-width":2.5,
        "stroke-dasharray":s.dash?"6 4":"none","data-series":index}));
      if(s.points.length===1&&s.points[0].y!==null&&(!options.log||!zero(s.points[0])))
        svg.appendChild(svgNode(doc,"circle",{cx:x(s.points[0].x),cy:y(options.log?logged(s.points[0]):s.points[0].y),r:4,fill:s.color}));
      var xx=series.length>3?135+(index%2)*360:135+index*230,yy=series.length>3?335+Math.floor(index/2)*25:options.log?386:335;
      svg.appendChild(svgNode(doc,"line",{x1:xx,x2:xx+24,y1:yy,y2:yy,stroke:s.color,"stroke-width":3,"stroke-dasharray":s.dash?"5 3":"none"}));
      tx(xx+31,yy+4,s.name,"start",12);
    });
    tx(right,options.log?348:314,options.xLabel,"end",13);
    if(options.log)tx(left,361,"纵轴 log₁₀；下方圆点表示精确为 0，不给零值取对数。","start",12);
    return svg;
  }
  function drawIterationChart(doc,data,uid){
    return drawSeries(doc,[0,1].map(function(s){return {name:"Vₖ("+s+")",color:s?"var(--zsd-gold)":"var(--zsd-blue)",
      points:data.rows.map(function(r){return {x:r.step,y:r.values[s]};})};}),
      {title:"价值迭代：两个状态的 Vₖ",description:"横轴为完成的更新次数，纵轴为行玩家折扣总收益的价值候选；不混入残差。",
        maximumX:data.config.iterations,xLabel:"更新次数 k"},uid);
  }
  function drawResidualChart(doc,data,uid){
    var series=[{name:"残差 rₖ",color:"var(--zsd-red)",points:data.rows.map(function(r){return{x:r.step,y:r.residual,zero:r.exactResidual==="0",logValue:rationalLog10(r.exactResidual)};})}];
    if(data.contractive)series.push({name:"误差上界 rₖ/(1−γ)",color:"var(--zsd-blue)",dash:true,points:data.rows.map(function(r){return{x:r.step,y:r.bound,zero:r.exactBound==="0",logValue:rationalLog10(r.exactBound)};})});
    if(data.closedForm)series.push({name:"闭式解给出的实际误差",color:"var(--zsd-green)",points:data.rows.map(function(r){return{x:r.step,y:r.actualError};})});
    return drawSeries(doc,series,{title:"残差与固定点误差：独立的对数坐标",description:"显示每一轮精确残差的数值近似；gamma小于1时另画向上舍入的误差上界。零值用坐标区下方圆点表示。",
      maximumX:data.config.iterations,xLabel:"更新次数 k",log:true},uid);
  }
  function drawSamplingChart(doc,data,uid){
    var series=[];
    data.sampling.forEach(function(s,i){
      var color=i?"var(--zsd-gold)":"var(--zsd-blue)";
      series.push({name:"状态 "+i+" 的抽样均值",color:color,points:s.prefix.map(function(v,k){return{x:k+1,y:v};})});
    });
    data.sampling.forEach(function(s,i){
      series.push({name:"状态 "+i+" 的理论期望",color:i?"var(--zsd-gold)":"var(--zsd-blue)",dash:true,
        points:[{x:1,y:s.expected.value},{x:data.config.samples,y:s.expected.value}]});
    });
    var svg=drawSeries(doc,series,{title:"有限抽样：样本均值与理论期望",description:"实线使用最后一轮固定有效矩阵的每一步抽样均值，虚线为对应理论期望；不是动态状态轨迹。精确值在下方表中。",
      maximumX:data.config.samples,xLabel:"抽样次数 N"},uid);
    return svg;
  }
  function mount(root,api){
    if(!root||root.getAttribute("data-zsd-mounted"))return;
    root.setAttribute("data-zsd-mounted","true");
    var doc=root.ownerDocument;installStyles(doc);var uid="zsd-"+(++INSTANCE),answers=[null,null,null],revealed=false,cache=null,cacheKey="";
    var shell=node(doc,"div",{className:"zero-sum-dynamic-lab"});
    shell.appendChild(node(doc,"h3",{text:"从一局保底到逐状态价值证书"}));
    shell.appendChild(node(doc,"p",{className:"zsd-note",text:"先看矩阵与完整转移，再预测。所有奖励按行玩家收益计；列玩家最小化它。切换阶段预设会同时改变两个状态的奖励。"}));
    var controls=node(doc,"div",{className:"zsd-controls"}),fields={};
    var select=node(doc,"select",{id:uid+"-preset","aria-label":"阶段收益预设"});
    STAGE_PRESETS.forEach(function(p,i){select.appendChild(node(doc,"option",{value:p.id,text:["猜硬币矩阵","非对称矩阵","第三个矩阵"][i]}));});
    controls.appendChild(node(doc,"label",{for:select.id},["阶段收益预设",select]));fields.preset=select;
    [["gamma","折扣 γ",0,1,.01,"range"],["mobility","流动程度 α",0,1,.05,"range"],
      ["iterations","迭代轮数",0,80,1,"number"],["samples","抽样次数",20,2000,1,"number"],
      ["initial","两个状态的初始值",-10,10,.5,"number"],["seed","随机种子",0,4294967295,1,"number"]].forEach(function(c){
      var input=node(doc,"input",{id:uid+"-"+c[0],type:c[5],min:c[2],max:c[3],step:c[4],value:DEFAULTS[c[0]],"data-key":c[0]});
      var output=node(doc,"output",{for:input.id,hidden:c[5]!=="range"});controls.appendChild(node(doc,"label",{for:input.id},[c[1],input,output]));fields[c[0]]=input;
    });
    shell.appendChild(controls);
    var given=node(doc,"section",{},node(doc,"h4",{text:"1. 已知数据：收益与转移"}));
    var matrix=region(doc,"阶段收益矩阵，可横向滚动"),model=region(doc,"完整状态转移表，可横向滚动");
    given.appendChild(matrix);given.appendChild(model);shell.appendChild(given);
    var questions=[
      ["当前阶段矩阵有没有纯鞍点？",[["saddle","有纯鞍点"],["mixed","没有，需内点混合"]]],
      ["当前折扣能否使用固定点误差证书？",[["contract","γ < 1，可以"],["nocontract","γ = 1，不能"]]],
      ["一次有限抽样均值接近矩阵值，意味着？",[["evidence","当前抽样的有限证据"],["proof","证明所有模型都收敛"]]]
    ],buttons=[];
    questions.forEach(function(q,i){
      var field=node(doc,"fieldset",{className:"zsd-question"},node(doc,"legend",{text:(i+1)+". "+q[0]}));
      var choices=node(doc,"div",{className:"zsd-options"});
      q[1].forEach(function(pair){
        var b=node(doc,"button",{type:"button","data-question":i,"data-answer":pair[0],"aria-pressed":"false",text:pair[1]});
        b.addEventListener("click",function(){answers[i]=pair[0];revealed=false;render();});buttons.push(b);choices.appendChild(b);
      });field.appendChild(choices);shell.appendChild(field);
    });
    var reveal=node(doc,"button",{type:"button",className:"zsd-primary",text:"核对预测并揭示账本"}),reset=node(doc,"button",{type:"button",text:"重置实验"});
    shell.appendChild(node(doc,"div",{className:"zsd-actions"},[reveal,reset]));
    var feedback=node(doc,"p",{className:"zsd-feedback",role:"status","aria-live":"polite"});shell.appendChild(feedback);
    var results=node(doc,"section",{className:"zsd-results",hidden:true,"aria-labelledby":uid+"-result"});
    shell.appendChild(results);root.replaceChildren(shell);
    function config(){
      var c={preset:select.value};
      Object.keys(fields).forEach(function(k){if(k==="preset")return;var input=fields[k];
        if(input.value.trim()===""||!input.checkValidity())throw new RangeError("请修正输入范围；原输入保留，结果暂时隐藏。");
        c[k]=Number(input.value);
      });return copyConfig(c);
    }
    function buildResults(data){
      results.replaceChildren(node(doc,"h4",{id:uid+"-result",tabindex:-1,text:"2. 阶段矩阵：下界与上界接上了吗？"}));
      var s=data.stage;
      results.appendChild(region(doc,"阶段极小极大证书，可横向滚动",table(doc,"纯动作界与一组混合策略证书",["项目","数值"],[
        ["纯动作保底",s.exactRowSecurity],["纯动作上界",s.exactColumnSecurity],
        ["一组最优 p, q","p="+s.exactP+"；q="+s.exactQ],["混合保底 / 混合上界",s.lower.exact+" / "+s.upper.exact],
        ["两界之差",s.exactGap],["实际纯鞍点格",s.pureCells.length?s.pureCells.map(function(c){return"R"+c.row+"C"+c.column;}).join("，"):"无"]
      ])));
      results.appendChild(node(doc,"h4",{text:"3. 两个状态：价值、残差与每一轮记录"}));
      results.appendChild(region(doc,"价值迭代图，可横向滚动",drawIterationChart(doc,data,uid+"-values")));
      results.appendChild(region(doc,"残差与误差上界图，可横向滚动",drawResidualChart(doc,data,uid+"-residual")));
      results.appendChild(node(doc,"p",{className:"zsd-note",text:data.closedForm?
        "当前有闭式固定点：V*(0)≈"+format(data.closedForm[0].value)+"，V*(1)≈"+format(data.closedForm[1].value)+"。绿色曲线给出实际误差，可与上界比较。":
        data.contractive?"这里不预先假定固定点的精确值；用每一行的精确残差给出误差上界。":
        "γ=1：仍显示残差，但不报告折扣固定点误差上界。有限轮结果不能当成无限总和或平均收益的解。"}));
      results.appendChild(region(doc,"完整价值迭代表，可横向滚动",table(doc,"k 次更新后的 Vₖ，以及该行的 TVₖ 与误差证书",
        ["k","Vₖ(0)","Vₖ(1)","TVₖ(0)","TVₖ(1)","残差 rₖ","误差上界","精确分数"],
        data.rows.map(function(r){return [r.step,format(r.values[0]),format(r.values[1]),format(r.next[0]),format(r.next[1]),format(r.residual),
          r.bound===null?"无证书":format(r.bound),exactDetails(doc,"查看",["r="+r.exactResidual,"界="+(r.exactBound===null?"不适用":r.exactBound)])];}))));
      var matrixRows=[];
      data.last.exactMatrices.forEach(function(g,state){g.forEach(function(row,i){row.forEach(function(v,j){
        matrixRows.push([state,"R"+i+" C"+j,format(data.last.matrices[state][i][j]),exactDetails(doc,"Q 的精确值",[v])]);
      });});});
      results.appendChild(region(doc,"最后一轮有效收益矩阵，可横向滚动",table(doc,"抽样的对象：Qₛ[Vₖ]，含当前奖励与给定未来价值",["状态","动作对","Q 数值近似","精确分数"],matrixRows)));
      results.appendChild(node(doc,"h4",{text:"4. 固定最后一轮矩阵，再做有限抽样"}));
      results.appendChild(node(doc,"p",{className:"zsd-note",text:"固定种子生成可复现的伪随机序列；每个状态分别抽动作对，没有沿转移表模拟一条路径。理论标准误按理想独立抽样计算，不能当作当前误差上界。"}));
      results.appendChild(region(doc,"有限抽样均值图，可横向滚动",drawSamplingChart(doc,data,uid+"-sampling")));
      var countRows=[];
      data.sampling.forEach(function(s,state){for(var i=0;i<2;i++)for(var j=0;j<2;j++)
        countRows.push([state,"R"+i+" C"+j,s.counts[i][j],format(data.last.matrices[state][i][j])]);});
      results.appendChild(region(doc,"四格抽样次数，可横向滚动",table(doc,"每个状态的四格次数总和应等于抽样次数",["状态","动作对","次数","抽到的 Q 数值"],countRows)));
      results.appendChild(region(doc,"理论期望与抽样误差账本，可横向滚动",table(doc,"总体方差与标准误不等于这一次的绝对误差",
        ["状态","最优 p, q","理论期望","样本均值","差异","总体方差","标准误","精确核对"],
        data.sampling.map(function(s,i){return [i,"p≈"+format(data.last.certificates[i].rowProbability)+"；q≈"+format(data.last.certificates[i].columnProbability),format(s.expected.value),format(s.mean.value),format(s.difference),
          format(s.variance.value),format(s.standardError),exactDetails(doc,"查看",["p="+s.exactP,"q="+s.exactQ,"期望="+s.expected.exact,"均值="+s.mean.exact,
            "差="+s.exactDifference,"方差="+s.variance.exact,"SE²="+s.seSquared.exact])];}))));
      var prefix=node(doc,"details",{className:"zsd-prefix"},node(doc,"summary",{text:"展开全部 "+data.config.samples+" 步抽样均值"}));
      prefix.appendChild(region(doc,"每一步抽样均值，可横向滚动",table(doc,"同一固定矩阵与种子下的完整样本均值前缀",["抽样步数","状态 0 均值","状态 1 均值"],
        data.sampling[0].prefix.map(function(v,i){return[i+1,format(v),format(data.sampling[1].prefix[i])];}))));
      results.appendChild(prefix);
    }
    function render(){
      buttons.forEach(function(b){b.setAttribute("aria-pressed",String(answers[Number(b.dataset.question)]===b.dataset.answer));});
      var c;
      try{c=config();}catch(e){revealed=false;given.hidden=true;results.hidden=true;reveal.disabled=true;feedback.textContent=e.message;return;}
      Object.keys(fields).forEach(function(k){if(k!=="preset")fields[k].parentNode.querySelector("output").textContent=String(c[k]);});
      var key=JSON.stringify(c);if(cacheKey!==key){cache=iterate(c);cacheKey=key;}
      given.hidden=false;matrix.replaceChildren(drawStageMatrix(doc,cache,revealed,uid+"-stage"));
      model.replaceChildren(table(doc,"转移概率完整列出：每行 P₀+P₁=1；状态 1 的奖励比 A 多 1",["当前状态","动作对","奖励 r","P(下个状态=0)≈","P(下个状态=1)≈","精确概率"],
        cache.modelRows.map(function(r){return[r.state,"R"+r.row+" C"+r.column,r.reward,format(r.p0.value),format(r.p1.value),exactDetails(doc,"查看",["P₀="+r.p0.exact,"P₁="+r.p1.exact])];})));
      results.hidden=!revealed;reveal.disabled=revealed||answers.some(function(a){return a===null;});
      if(!revealed){feedback.textContent="已知矩阵和转移可先查看；请完成三项预测。";return;}
      var expected=[cache.stage.pure?"saddle":"mixed",cache.contractive?"contract":"nocontract","evidence"];
      var score=expected.reduce(function(n,a,i){return n+(answers[i]===a?1:0);},0);
      feedback.textContent="当前参数核对："+score+" / 3。"+(cache.stage.pure?"有纯鞍点；":"没有纯鞍点；")+
        (cache.contractive?"γ<1 有折扣证书；":"γ=1 无折扣证书；")+"有限抽样是当前模型的证据。调参数可继续比较，重新选择预测会隐藏结果。";
      buildResults(cache);
    }
    Object.keys(fields).forEach(function(k){fields[k].addEventListener(k==="preset"?"change":"input",render);});
    reveal.addEventListener("click",function(){if(!reveal.disabled){revealed=true;render();results.querySelector("h4").focus();}});
    reset.addEventListener("click",function(){Object.keys(fields).forEach(function(k){fields[k].value=String(DEFAULTS[k]);});
      answers=[null,null,null];revealed=false;render();buttons[0].focus();});
    render();
  }


  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    var pennies = matrixValue([[1, -1], [-1, 1]]);
    check(Math.abs(pennies.value) < 1e-12, "matching pennies value");
    check(Math.abs(pennies.rowProbability - 0.5) < 1e-12 && Math.abs(pennies.columnProbability - 0.5) < 1e-12, "matching pennies mixing");
    var mixed = matrixValue([[3, 0], [1, 2]]);
    check(Math.abs(mixed.value - 1.5) < 1e-12, "mixed matrix value");
    check(Math.abs(mixed.rowProbability - 0.25) < 1e-12 && Math.abs(mixed.columnProbability - 0.5) < 1e-12, "mixed matrix probabilities");
    var saddle = matrixValue([[3, 0], [5, 1]]);
    check(saddle.pure && Math.abs(saddle.value - 1) < 1e-12, "pure saddle detection");
    var update = shapley([0, 0], 0.8);
    check(update.values.length === 2 && update.matrices.length === 2, "Shapley state count");
    var left = shapley([0, 0], 0.7).values;
    var right = shapley([3, -2], 0.7).values;
    check(normInf(left, right) <= 0.7 * 5 + 1e-12, "Shapley contraction sample");
    var result = iterate({ gamma: 0.8, iterations: 12, samples: 100 });
    check(result.rows.length === 13, "iteration ledger length");
    check(result.rows.every(function (row) { return row.bound !== null; }), "discount certificate exists");
    var boundary = iterate({ gamma: 1, iterations: 8 });
    check(!boundary.contractive && boundary.rows[0].bound === null, "undiscounted boundary has no certificate");
    check(result.sampled.length === 2 && result.sampled.every(finite), "finite sampling ledger");
    var rejected = false;
    try { iterate({ gamma: NaN }); } catch (error) { rejected = error instanceof RangeError; }
    check(rejected, "non-finite parameters rejected");
    return { checks: checks, presets: STAGE_PRESETS.length };
  }

  return {
    STAGE_PRESETS: STAGE_PRESETS,
    matrixValue: matrixValue,
    dynamicMatrix: dynamicMatrix,
    shapley: shapley,
    iterate: iterate,
    sampleMatrix: sampleMatrix,
    sampleLedger: sampleLedger,
    DEFAULTS: DEFAULTS,
    TRANSITION_ZERO: TRANSITION_ZERO,
    copyConfig: copyConfig,
    drawStageMatrix: drawStageMatrix,
    drawIterationChart: drawIterationChart,
    drawResidualChart: drawResidualChart,
    drawSamplingChart: drawSamplingChart,
    selfTest: selfTest,
    mount: mount
  };
});

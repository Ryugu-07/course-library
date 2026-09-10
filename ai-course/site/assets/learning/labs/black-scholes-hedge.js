(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("black-scholes-hedge", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("black-scholes-hedge self-test: PASS (" + report.checks + " checks)" + String.fromCharCode(10));
    } catch (error) {
      process.stderr.write("black-scholes-hedge self-test: FAIL" + String.fromCharCode(10) + error.stack + String.fromCharCode(10));
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (root) {
  "use strict";

  var DEFAULTS = {
    S0: 100,
    K: 100,
    r: 0.05,
    sigma: 0.2,
    T: 1,
    mu: 0.08,
    steps: 12,
    seed: 43017
  };
  var PRESETS = [
    { id: "baseline", label: "基准：12 次调仓", S0: 100, K: 100, r: 0.05, sigma: 0.2, T: 1, mu: 0.08, steps: 12, seed: 43017 },
    { id: "fine", label: "细分：32 次调仓", S0: 100, K: 100, r: 0.05, sigma: 0.2, T: 1, mu: 0.08, steps: 32, seed: 43017 },
    { id: "stress", label: "压力：高波动", S0: 100, K: 100, r: 0.03, sigma: 0.45, T: 1, mu: 0.03, steps: 12, seed: 43017 },
    { id: "zero-vol", label: "边界：sigma=0", S0: 100, K: 105, r: 0.04, sigma: 0, T: 1, mu: 0.04, steps: 12, seed: 43017 }
  ];
  var GRID_STEPS=Object.freeze([4,8,12,24,48,96,192,384]);
  var SEEDS=Object.freeze([43017,107,20260910]);
  PRESETS[0].label="基准：12 个区间";PRESETS[1].steps=96;PRESETS[1].label="细分：96 个区间";
  PRESETS.push({id:"maturity",label:"到期：T=0",S0:100,K:100,r:.05,sigma:.2,T:0,mu:.08,steps:12,seed:43017});
  PRESETS.push({id:"forward-kink",label:"零波动平值：r=0",S0:100,K:100,r:0,sigma:0,T:1,mu:0,steps:12,seed:43017});
  PRESETS.push({id:"rare",label:"深度价外：小价格",S0:40,K:180,r:.05,sigma:.1,T:1,mu:.08,steps:12,seed:43017});
  PRESETS.forEach(Object.freeze);Object.freeze(PRESETS);Object.freeze(DEFAULTS);
  var SQRT_TWO_PI = Math.sqrt(2 * Math.PI);
  var SERIAL = 0;

  function finite(value) {
    return Number.isFinite(value);
  }

  function validate(value,lo,hi,name,integer){
    if(typeof value!=="number"||!Number.isFinite(value)||value<lo||value>hi||(integer&&!Number.isInteger(value)))throw new RangeError(name);
    return value;
  }
  function normalizeConfig(input){
    if(input!==undefined&&(!input||typeof input!=="object"||Array.isArray(input)))throw new TypeError("configuration");
    var c=Object.assign({},DEFAULTS);
    Object.keys(input||{}).forEach(function(k){if(!Object.prototype.hasOwnProperty.call(c,k))throw new RangeError("unknown "+k);c[k]=input[k];});
    validate(c.S0,1,250,"S0");validate(c.K,1,250,"K");validate(c.r,-.05,.2,"r");validate(c.sigma,0,.8,"sigma");validate(c.T,0,3,"T");validate(c.mu,-.2,.3,"mu");
    validate(c.steps,1,384,"steps",true);if(384%c.steps)throw new RangeError("steps must divide 384");
    validate(c.seed,0,4294967295,"seed",true);return c;
  }
  function presetConfig(p){var c={};Object.keys(DEFAULTS).forEach(function(k){c[k]=p[k];});return normalizeConfig(c);}
  function normalLogTail(value){
    if(typeof value!=="number"||Number.isNaN(value))throw new TypeError("normal argument");
    if(value===Infinity)return-Infinity;if(value===-Infinity)return 0;
    if(value<0)return Math.log1p(-Math.exp(normalLogTail(-value)));if(value===0)return-Math.LN2;
    var z=value/Math.sqrt(2),x=value<1e154?value*value/2:z*z;if(x===Infinity)return-Infinity;if(x===0)return-Math.LN2;
    var logPref=-x+.5*Math.log(x)-.5*Math.log(Math.PI);
    if(x<1.5){
      var ap=.5,term=2,total=term;
      for(var n=1;n<=1000;n++){ap++;term*=x/ap;total+=term;if(Math.abs(term)<=Math.abs(total)*Number.EPSILON)return Math.log1p(-Math.exp(logPref)*total)-Math.LN2;}
    }else{
      var b=x+.5,c=1e300,d=1/b,h=d;
      for(var i=1;i<=10000;i++){
        var an=-i*(i-.5);b+=2;d=an*d+b;if(Math.abs(d)<1e-300)d=1e-300;c=b+an/c;if(Math.abs(c)<1e-300)c=1e-300;
        d=1/d;var change=d*c;h*=change;if(Math.abs(change-1)<=4*Number.EPSILON)return logPref+Math.log(h)-Math.LN2;
      }
    }throw Error("normal tail did not converge");
  }
  function normalCdf(x){if(typeof x!=="number"||Number.isNaN(x))throw new TypeError("normal argument");return Math.exp(normalLogTail(-x));}
  function normalPdf(x){if(typeof x!=="number"||Number.isNaN(x))throw new TypeError("normal argument");return Math.exp(-.5*x*x)/SQRT_TWO_PI;}
  function legendre(n){
    var nodes=[],weights=[];
    for(var i=1;i<=n;i++){
      var x=Math.cos(Math.PI*(i-.25)/(n+.5)),p1,derivative;
      for(var k=0;k<30;k++){
        var p0=1;p1=x;
        for(var j=2;j<=n;j++){var p=((2*j-1)*x*p1-(j-1)*p0)/j;p0=p1;p1=p;}
        derivative=n*(x*p1-p0)/(x*x-1);var next=x-p1/derivative;
        if(Math.abs(next-x)<2e-16){x=next;break;}x=next;
      }
      var p0=1;p1=x;for(var j=2;j<=n;j++){var p=((2*j-1)*x*p1-(j-1)*p0)/j;p0=p1;p1=p;}
      derivative=n*(x*p1-p0)/(x*x-1);nodes.push(x);weights.push(2/((1-x*x)*derivative*derivative));
    }return{nodes:nodes,weights:weights};
  }
  var GL16=legendre(16),GL32=legendre(32),GL64=legendre(64);
  function integrate(f,left,right,rule){var mid=(left+right)/2,half=(right-left)/2,s=0;for(var i=0;i<rule.nodes.length;i++)s+=rule.weights[i]*f(mid+half*rule.nodes[i]);return half*s;}
  function adaptive(f,left,right,depth,absoluteBudget){
    var hi=integrate(f,left,right,GL32),lo=integrate(f,left,right,GL16);
    if(absoluteBudget===undefined)absoluteBudget=2e-14*Math.abs(hi);
    if(Math.abs(hi-lo)<=Math.max(absoluteBudget,2e-14*Math.abs(hi))||hi===0)return hi;
    if(depth>=16)throw Error("positive option integral did not converge");
    var mid=(left+right)/2;return adaptive(f,left,mid,depth+1,absoluteBudget/2)+adaptive(f,mid,right,depth+1,absoluteBudget/2);
  }
  // Integrate vega from zero total volatility. This positive representation
  // retains an out-of-the-money price instead of subtracting two rounded CDFs.
  function timeValue(S,K,r,T,sigma,m){
    if(S===0||sigma===0||T===0)return{value:0,logValue:-Infinity};
    var logW=Math.log(sigma)+.5*Math.log(T),w=sigma*Math.sqrt(T),a=m===0?0:Math.abs(m)/w;
    if(!Number.isFinite(a))return{value:0,logValue:-Infinity};
    var logIntegral;
    if(a>=8){
      var scale=1+a*a;if(!Number.isFinite(scale))return{value:0,logValue:-Infinity};
      var f=function(y){var v=y/scale,t=1/(1+v);return Math.exp(-a*a*(v+v*v/2)+w*w*(1-t*t)/8)*t*t;};
      var integral=integrate(f,0,50,GL64)/scale;
      logIntegral=-a*a/2-w*w/8+Math.log(integral);
    }else{
      var f=function(t){return Math.exp(-.5*(a/t)*(a/t)-w*w*t*t/8);},edges=[0],e=a>1e-14?Math.min(a,1):1;
      edges.push(e);while(e<1){e=Math.min(1,e*4);edges.push(e);}
      var total=0;for(var j=1;j<edges.length;j++)total+=adaptive(f,edges[j-1],edges[j],0);
      logIntegral=Math.log(total);
    }
    var logValue=(Math.log(S)+Math.log(K)-r*T)/2-Math.log(SQRT_TWO_PI)+logW+logIntegral;
    return{value:Math.exp(logValue),logValue:logValue};
  }
  function greekMeta(status,value,reason,details){return Object.assign({status:status,value:value},reason?{reason:reason}:{},details||{});}
  function availableGreekMetadata(g){var out={};Object.keys(g).forEach(function(k){out[k]=greekMeta("available",g[k]);});return out;}
  function samePresetConfig(a,b){return Object.keys(DEFAULTS).every(function(k){return a[k]===b[k];});}
  function blackScholes(S,K,r,sigma,T){
    validate(S,0,1e12,"S");validate(K,1,250,"K");validate(r,-.05,.2,"r");validate(sigma,0,.8,"sigma");validate(T,0,3,"T");
    var discounted=K*Math.exp(-r*T),difference=S-discounted,callIntrinsic=Math.max(difference,0),putIntrinsic=Math.max(-difference,0);
    var base={d1:null,d2:null,inputs:{S:S,K:K,r:r,sigma:sigma,T:T}};
    if(T===0){
      var diff=S-K,kink=diff===0,delta=diff>0?1:diff<0?0:.5;
      var callTheta=kink?(sigma>0?null:-Math.max(r*K,0)):diff>0?-r*K:0;
      var putTheta=kink?(sigma>0?null:Math.min(r*K,0)):diff<0?r*K:0;
      base.status="maturity-boundary";base.boundary="T=0：价格是支付；Vega 与 rho 严格为 0。kink 的 delta 仅为中点显示约定，gamma 无普通有限值；Theta 按到期前单侧极限。";
      base.call=Math.max(diff,0);base.put=Math.max(-diff,0);
      base.greeks={call:{delta:delta,gamma:kink?null:0,vega:0,theta:callTheta,rho:0},put:{delta:delta-1,gamma:kink?null:0,vega:0,theta:putTheta,rho:0}};
      base.greekMetadata={call:availableGreekMetadata(base.greeks.call),put:availableGreekMetadata(base.greeks.put)};
      ["call","put"].forEach(function(side){
        if(kink){base.greekMetadata[side].delta=greekMeta("convention",base.greeks[side].delta,"payoff kink; midpoint is not a derivative");base.greekMetadata[side].gamma=greekMeta("unavailable",null,"payoff kink");}
        base.greekMetadata[side].theta=greekMeta(base.greeks[side].theta===null?"unavailable":"one-sided",base.greeks[side].theta,"pre-maturity time limit");
      });
    }else if(sigma===0){
      var kink=difference===0,delta=difference>0?1:difference<0?0:.5;
      base.status="zero-volatility-boundary";base.boundary="σ=0：折现确定性支付。仅在精确计算边界相等时使用 kink 约定，不用 epsilon 把附近点视作相等；σ 的 Vega 使用右侧导数。";
      base.call=callIntrinsic;base.put=putIntrinsic;
      base.greeks={call:{delta:delta,gamma:kink?null:0,vega:kink?S*normalPdf(0)*Math.sqrt(T):0,theta:kink?(r===0?0:null):difference>0?-r*discounted:0,rho:kink?null:difference>0?T*discounted:0},
        put:{delta:delta-1,gamma:kink?null:0,vega:kink?S*normalPdf(0)*Math.sqrt(T):0,theta:kink?(r===0?0:null):difference<0?r*discounted:0,rho:kink?null:difference<0?-T*discounted:0}};
      base.greekMetadata={call:availableGreekMetadata(base.greeks.call),put:availableGreekMetadata(base.greeks.put)};
      ["call","put"].forEach(function(side){
        var meta=base.greekMetadata[side],g=base.greeks[side];meta.vega=greekMeta("one-sided",g.vega,"right derivative at sigma=0");
        if(kink){meta.delta=greekMeta("convention",g.delta,"forward kink; midpoint is not a derivative");["gamma","rho"].forEach(function(k){meta[k]=greekMeta("unavailable",null,"forward kink");});if(r!==0)meta.theta=greekMeta("unavailable",null,"time kink");}
      });
    }else if(S===0){
      base.status="zero-spot-boundary";base.boundary="S=0：吸收态；call 为 0，put 为折现执行价。";
      base.call=0;base.put=discounted;base.greeks={call:{delta:0,gamma:0,vega:0,theta:0,rho:0},put:{delta:-1,gamma:0,vega:0,theta:r*discounted,rho:-T*discounted}};
    }else{
      var rootT=Math.sqrt(T),w=sigma*rootT,logRatio=Math.abs(S-K)<K*.5?Math.log1p((S-K)/K):Math.log(S/K),m=logRatio+r*T;
      var standardized=m===0?0:m/w,d1=standardized+w/2,d2=standardized-w/2,tv=timeValue(S,K,r,T,sigma,m),pdf=normalPdf(d1),delta=normalCdf(d1),putDelta=-normalCdf(-d1);
      var logPdf=-.5*d1*d1-Math.log(SQRT_TWO_PI),gamma=Math.exp(logPdf-Math.log(S)-Math.log(sigma)-.5*Math.log(T));
      var vega=Math.exp(Math.log(S)+logPdf+.5*Math.log(T)),thetaDiffusion=-Math.exp(Math.log(S)+logPdf+Math.log(sigma)-.5*Math.log(T)-Math.LN2);
      base.status="regular";base.boundary="无股息 GBM、常数 r/σ 的模型内点；价格用正的时间价值积分，平价残差只检查代数一致性。";
      base.d1=d1;base.d2=d2;base.timeValue=tv.value;base.logTimeValue=tv.logValue;
      base.call=callIntrinsic+tv.value;base.put=putIntrinsic+tv.value;
      base.greeks={call:{delta:delta,gamma:gamma,vega:vega,theta:thetaDiffusion-r*discounted*normalCdf(d2),rho:T*discounted*normalCdf(d2)},
        put:{delta:putDelta,gamma:gamma,vega:vega,theta:thetaDiffusion+r*discounted*normalCdf(-d2),rho:-T*discounted*normalCdf(-d2)}};
    }
    if(!base.greekMetadata)base.greekMetadata={call:availableGreekMetadata(base.greeks.call),put:availableGreekMetadata(base.greeks.put)};
    ["call","put"].forEach(function(side){Object.keys(base.greeks[side]).forEach(function(key){
      var value=base.greeks[side][key];
      if(value!==null&&!Number.isFinite(value)){base.greeks[side][key]=null;base.greekMetadata[side][key]=greekMeta("unrepresentable",null,"finite mathematical derivative exceeds the floating-point range");}
    });});
    base.parityTarget=difference;base.parityResidual=base.call-base.put-difference;return base;
  }

  function nextUniform(state) {
    state.value = (1664525 * state.value + 1013904223) >>> 0;
    return (state.value + 1) / 4294967297;
  }

  function nextNormal(state) {
    var u1 = nextUniform(state);
    var u2 = nextUniform(state);
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  function generatePath(config) {
    var normalized = normalizeConfig(config);
    if (normalized.T === 0) return { prices: [normalized.S0], shocks: [], dt: 0 };
    var dt = normalized.T / normalized.steps, fineDt=normalized.T/384;
    var state = { value: normalized.seed >>> 0 };
    var prices = [normalized.S0];
    var shocks = [];
    var fine=[],fineTotal=0,comp=0;
    for(var k=0;k<384;k++){
      var dw=Math.sqrt(fineDt)*nextNormal(state);fine.push(dw);
      var adjusted=dw-comp,total=fineTotal+adjusted;comp=(total-fineTotal)-adjusted;fineTotal=total;
    }
    var i,brownian=0,block=384/normalized.steps;
    for (i = 0; i < normalized.steps; i += 1) {
      var inc=0,correction=0;for(var j=0;j<block;j++){var adjusted=fine[i*block+j]-correction,total=inc+adjusted;correction=(total-inc)-adjusted;inc=total;}
      brownian+=inc;if(i===normalized.steps-1)brownian=fineTotal;
      var z=inc/Math.sqrt(dt),time=i===normalized.steps-1?normalized.T:(i+1)*dt;
      var grossLogReturn = (normalized.mu - 0.5 * normalized.sigma * normalized.sigma) * time + normalized.sigma*brownian;
      prices.push(normalized.S0 * Math.exp(grossLogReturn));
      shocks.push(z);
    }
    return { prices: prices, shocks: shocks, dt: dt, brownianTerminal:fineTotal };
  }

  function discreteDeltaHedge(input) {
    var config = normalizeConfig(input);
    var pricing = blackScholes(config.S0, config.K, config.r, config.sigma, config.T);
    var path = generatePath(config);
    var rows = [];
    var shares = pricing.greeks.call.delta;
    var cash = pricing.call - shares * config.S0;
    var n = path.prices.length - 1;
    var dt = path.dt;
    var growth = Math.exp(config.r * dt);
    function rowAt(index, cashBefore, trade, optionValue, payoff) {
      var time = index === n ? config.T : index * dt;
      var stock = path.prices[index];
      var remaining = Math.max(0, config.T - time);
      var target = blackScholes(stock, config.K, config.r, config.sigma, remaining).greeks.call.delta;
      var portfolio = shares * stock + cash;
      return {
        index: index,
        time: time,
        stock: stock,
        remaining: remaining,
        targetDelta: target,
        shares: shares,
        cashBeforeRebalance: cashBefore,
        trade: trade,
        cash: cash,
        portfolio: portfolio,
        modelValue: optionValue,
        payoff: payoff,
        hedgeError: portfolio - optionValue,
        terminalError: payoff === null ? null : portfolio - payoff
      };
    }
    rows.push(rowAt(0, cash, 0, pricing.call, n === 0 ? Math.max(config.S0 - config.K, 0) : null));
    var i;
    for (i = 1; i <= n; i += 1) {
      var cashBefore = cash * growth;
      var stock = path.prices[i];
      var remaining = i===n?0:config.T - i * dt;
      var targetDelta = blackScholes(stock, config.K, config.r, config.sigma, remaining).greeks.call.delta;
      var trade = i < n ? targetDelta - shares : 0;
      if (i < n) {
        cash = cashBefore - trade * stock;
        shares = targetDelta;
      } else {
        cash = cashBefore;
      }
      var payoff = i === n ? Math.max(stock - config.K, 0) : null;
      var optionValue = i === n ? payoff : blackScholes(stock, config.K, config.r, config.sigma, remaining).call;
      rows.push(rowAt(i, cashBefore, trade, optionValue, payoff));
    }
    var terminal = rows[rows.length - 1];
    return {
      config: config,
      pricing: pricing,
      path: path,
      rows: rows,
      terminalError: terminal.terminalError,
      maxAbsHedgeError: rows.reduce(function (maximum, row) { return Math.max(maximum, Math.abs(row.hedgeError)); }, 0),
      assumptions: [
        "GBM stock dynamics with scenario drift mu",
        "constant r and sigma",
        "frictionless complete market",
        "continuous hedging is the theorem; this ledger rebalances only at a finite grid"
      ],
      scenarioNote: "The finite-grid terminal error is a path scenario, not a Black-Scholes theorem or a worst-case bound."
    };
  }

  var STYLE_ID = "cl-black-scholes-hedge-styles";
  var STYLE_TEXT = [
    ".bsh-lab{--bsh-blue:#2f6f9f;--bsh-green:#39734d;--bsh-gold:#a36a16;--bsh-red:#b3483b;--bsh-soft:var(--fg-soft,#6f6a60);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    "html[data-theme=\"dark\"] .bsh-lab{--bsh-blue:#82c8ff;--bsh-green:#7bc48c;--bsh-gold:#e3b45f;--bsh-red:#f08d7d;--bsh-soft:#b8b2a7}",
    ".bsh-lab *,.bsh-lab *::before,.bsh-lab *::after{box-sizing:border-box}.bsh-lab [hidden]{display:none!important}.bsh-lab h3{margin:0;font-size:1.18rem;letter-spacing:0}.bsh-lab p{margin:.65rem 0}.bsh-intro,.bsh-note,.bsh-feedback,.bsh-boundary{color:var(--bsh-soft);font-size:13px;line-height:1.7}.bsh-gate{margin:14px 0;padding:12px 14px;border-left:3px solid var(--bsh-gold);background:var(--bg)}.bsh-gate fieldset{border:0;min-width:0;margin:12px 0 0;padding:0}.bsh-gate legend{margin-bottom:7px;font-weight:700;line-height:1.5}.bsh-choice-row,.bsh-actions,.bsh-presets{display:flex;flex-wrap:wrap;gap:7px}.bsh-actions{margin-top:12px}.bsh-lab button{font:inherit;line-height:1.3;cursor:pointer;color:var(--fg);background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:7px 10px;min-height:44px}.bsh-lab button:hover{border-color:var(--bsh-blue)}.bsh-lab button[aria-pressed=\"true\"]{border-color:var(--bsh-blue);background:var(--bg);font-weight:700}.bsh-lab button:disabled{cursor:default;opacity:.65}.bsh-primary{border-color:var(--bsh-blue)!important;background:var(--bsh-blue)!important;color:#fff!important;font-weight:700}.bsh-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(185px,1fr));gap:10px;margin:12px 0}.bsh-control{min-width:0}.bsh-control label{display:block;font-size:13px;color:var(--bsh-soft);margin-bottom:4px}.bsh-control output{color:var(--fg);font-weight:700}.bsh-control input{display:block;width:100%;accent-color:var(--bsh-blue)}.bsh-scale{display:flex;justify-content:space-between;color:var(--bsh-soft);font-size:11px}.bsh-presets{margin:10px 0}.bsh-presets button[aria-pressed=\"true\"]{border-color:var(--bsh-gold);font-weight:700}.bsh-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:8px;margin:14px 0}.bsh-metric{border-top:2px solid var(--bsh-blue);padding:7px 8px;background:var(--bg)}.bsh-metric span{display:block;color:var(--bsh-soft);font-size:12px}.bsh-metric strong{display:block;font-size:1.08rem;color:var(--fg);overflow-wrap:anywhere}.bsh-frame{border:1px solid var(--border);background:var(--bg);padding:7px;min-width:0}.bsh-chart{width:100%;height:auto;display:block}.bsh-chart text{font-family:inherit;fill:var(--fg-soft,#6f6a60);font-size:11px}.bsh-axis{stroke:var(--border);stroke-width:1}.bsh-grid{stroke:var(--border);stroke-width:1;stroke-dasharray:3 4}.bsh-stock{fill:none;stroke:var(--bsh-blue);stroke-width:2.5}.bsh-portfolio{fill:none;stroke:var(--bsh-gold);stroke-width:2}.bsh-error{fill:none;stroke:var(--bsh-red);stroke-width:2.5}.bsh-strike,.bsh-zero{stroke:var(--bsh-green);stroke-width:1.5;stroke-dasharray:5 4}.bsh-chart-title{fill:var(--fg)!important;font-weight:700}.bsh-legend{display:flex;flex-wrap:wrap;gap:12px;color:var(--bsh-soft);font-size:12px;margin:7px 0}.bsh-swatch{display:inline-block;width:20px;height:3px;vertical-align:middle;margin-right:4px;background:var(--bsh-blue)}.bsh-swatch-gold{background:var(--bsh-gold)}.bsh-swatch-red{background:var(--bsh-red)}.bsh-swatch-green{background:var(--bsh-green)}.bsh-table-wrap{overflow-x:auto;max-width:100%;margin-top:12px}.bsh-table{border-collapse:collapse;width:100%;min-width:700px;font-size:12px}.bsh-table caption{text-align:left;color:var(--bsh-soft);padding:5px 0}.bsh-table th,.bsh-table td{border:1px solid var(--border);padding:6px 7px;text-align:right;white-space:nowrap}.bsh-table th:first-child,.bsh-table td:first-child{text-align:left}.bsh-table th{background:var(--block-bg);color:var(--fg)}.bsh-table td.bsh-negative{color:var(--bsh-red)}.bsh-boundary{border-left:3px solid var(--bsh-green);padding-left:10px}.bsh-footnote{font-size:12px;color:var(--bsh-soft)}.bsh-lab input:focus-visible,.bsh-lab button:focus-visible{outline:2px solid var(--bsh-blue);outline-offset:2px}@media(max-width:600px){.bsh-choice-row,.bsh-actions{display:grid;grid-template-columns:1fr}.bsh-choice-row button,.bsh-actions button{width:100%}.bsh-table{font-size:11px}.bsh-frame{padding:3px}.bsh-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}"
  ].join("");
  STYLE_TEXT+=".bsh-lab .bsh-frame{overflow-x:auto;overscroll-behavior-x:contain}.bsh-lab .bsh-chart{width:780px;max-width:none!important}.bsh-lab .bsh-table{min-width:1300px;display:table!important;max-width:none!important;overflow:visible!important}.bsh-lab .bsh-control input{min-height:44px;margin:0}.bsh-lab .bsh-control select{width:100%;min-height:44px;background:var(--bg);color:var(--fg);border:1px solid var(--border);font:inherit}.bsh-lab .bsh-table-wrap:focus-visible,.bsh-lab .bsh-frame:focus-visible,.bsh-lab select:focus-visible{outline:3px solid var(--bsh-blue);outline-offset:2px}.bsh-lab .bsh-table-wrap{overscroll-behavior-x:contain}@media(prefers-reduced-motion:reduce){html:has(.bsh-lab){scroll-behavior:auto!important}.bsh-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}";

  function format(value, digits) {
    if (value===null || !finite(value)) return "—";
    var places = digits === undefined ? 4 : digits;
    if(value===0)return"0";
    var text=value.toFixed(places);
    if(Math.abs(value)<.0001||Math.abs(value)>=1e6||Number(text)===0)return value.toExponential(5);
    return text.indexOf(".")>=0?text.replace(/0+$/,"").replace(/\.$/,""):text;
  }

  function greekText(result, side, key, digits) {
    var metadata = result.greekMetadata && result.greekMetadata[side] && result.greekMetadata[side][key];
    if (metadata && metadata.status === "unavailable") return "不可用";
    if (metadata && metadata.status === "one-sided") return format(metadata.value, digits) + "（单侧）";
    if (metadata && metadata.status === "convention") return format(metadata.value, digits) + "（显示约定）";
    if (metadata && metadata.status === "unrepresentable") return "超出数值范围";
    return format(result.greeks[side][key], digits);
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function append(node, children) {
    if (children === undefined || children === null) return node;
    if (!Array.isArray(children)) children = [children];
    children.forEach(function (child) {
      if (child !== undefined && child !== null && child !== false) node.appendChild(child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
    });
    return node;
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", value);
      else if (key === "htmlFor") node.setAttribute("for", value);
      else if (key === "text") node.textContent = value;
      else node.setAttribute(key, value === true ? "" : String(value));
    });
    return append(node, children);
  }

  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value !== undefined && value !== null) node.setAttribute(key === "className" ? "class" : key, String(value));
    });
    return append(node, children);
  }

  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function metric(doc, label, value) {
    return element(doc, "div", { className: "bsh-metric" }, [element(doc, "span", {}, label), element(doc, "strong", {}, value)]);
  }

  function drawChart(doc, svg, result, uid) {
    clear(svg);
    var width = 780;
    var height = 460;
    var left = 120;
    var right = 758;
    var top = 30;
    var middle = 195;
    var bottom = 410;
    var rows = result.rows;
    var allValues=rows.flatMap(function(row){return[row.stock,row.portfolio];}).concat([result.config.K,0]);
    var minStock=Math.min.apply(null,allValues),maxStock=Math.max.apply(null,allValues),stockPadding=Math.max(1,(maxStock-minStock)*.05);
    minStock-=stockPadding;maxStock+=stockPadding;
    var errorScale = Math.max.apply(null, rows.map(function (row) { return Math.abs(row.hedgeError); })) * 1.25;
    if(errorScale===0)errorScale=1;
    function x(index) { return left + (rows.length === 1 ? 0.5 : index / (rows.length - 1)) * (right - left); }
    function yStock(value) { return middle - ((value-minStock) / (maxStock-minStock)) * (middle - top); }
    function yError(value) { return bottom - ((value + errorScale) / (2 * errorScale)) * (bottom - middle - 50); }
    function path(key, mapper) {
      return rows.map(function (row, index) { return (index ? "L" : "M") + x(index).toFixed(12) + "," + mapper(row[key]).toFixed(12); }).join(" ");
    }
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("role", "img");
    svg.setAttribute("data-price-min",minStock);svg.setAttribute("data-price-max",maxStock);svg.setAttribute("data-error-scale",errorScale);
    svg.setAttribute("aria-labelledby", uid + "-chart-title " + uid + "-chart-desc");
    svg.appendChild(svgElement(doc, "title", { id: uid + "-chart-title" }, "GBM 价格路径与离散对冲误差"));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-chart-desc" }, "上图是固定 seed 的股票价格路径和执行价，下图是离散对冲组合相对 Black-Scholes 价值的误差；终点误差是场景读数。"));
    [minStock, (minStock+maxStock) / 2, maxStock].forEach(function (value) {
      var y = yStock(value);
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: y, x2: right, y2: y, className: "bsh-grid" }));
      svg.appendChild(svgElement(doc, "text", { x: left - 8, y: y + 4, "text-anchor": "end" }, format(value, 1)));
    });
    [0, errorScale, -errorScale].forEach(function (value) {
      var y = yError(value);
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: y, x2: right, y2: y, className: value === 0 ? "bsh-zero" : "bsh-grid" }));
      svg.appendChild(svgElement(doc, "text", { x: left - 8, y: y + 4, "text-anchor": "end" }, format(value, 2)));
    });
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: middle, x2: right, y2: middle, className: "bsh-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, className: "bsh-axis" }));
    svg.appendChild(svgElement(doc, "path", { d: path("stock", yStock), className: "bsh-stock" }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: yStock(result.config.K), x2: right, y2: yStock(result.config.K), className: "bsh-strike" }));
    svg.appendChild(svgElement(doc, "path", { d: path("portfolio", yStock), className: "bsh-portfolio" }));
    svg.appendChild(svgElement(doc, "path", { d: path("hedgeError", yError), className: "bsh-error" }));
    if(rows.length===1)[["stock",yStock,"bsh-stock"],["portfolio",yStock,"bsh-portfolio"],["hedgeError",yError,"bsh-error"]].forEach(function(v){svg.appendChild(svgElement(doc,"circle",{cx:x(0),cy:v[1](rows[0][v[0]]),r:4,className:v[2]}));});
    svg.appendChild(svgElement(doc, "text", { x: left, y: 18, className: "bsh-chart-title" }, "价格与组合价值"));
    svg.appendChild(svgElement(doc, "text", { x: right, y: 18, "text-anchor": "end" }, "蓝 S；金组合；绿 K"));
    svg.appendChild(svgElement(doc, "text", { x: left, y: middle + 25, className: "bsh-chart-title" }, "离散标记误差 = 组合 − 理论期权价值"));
    svg.appendChild(svgElement(doc, "text", { x: right, y: bottom + 27, "text-anchor": "end" }, "时间 t"));
    rows.forEach(function (row, index) {
      if (index === 0 || index === rows.length - 1 || index % Math.max(1, Math.floor(rows.length / 6)) === 0) {
        svg.appendChild(svgElement(doc, "text", { x: x(index), y: bottom + 14, "text-anchor": "middle" }, format(row.time, 2)));
      }
    });
  }

  function tableFor(doc, result) {
    var table = element(doc, "table", { className: "bsh-table" });
    table.appendChild(element(doc, "caption", {}, "逐行自融资账本；末行持仓按到期股票价值计价。无摩擦平仓不会改变组合价值或终点误差。"));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, ["t", "股票 S", "目标 Δ", "实际持股", "计息后现金", "买入股数", "买股支出", "调仓后现金", "组合价值", "期权/支付", "误差"].map(function (label) {
      return element(doc, "th", { scope: "col" }, label);
    }))));
    var body = element(doc, "tbody");
    result.rows.forEach(function (row) {
      body.appendChild(element(doc, "tr", {}, [
        element(doc, "td", {}, format(row.time, 3)),
        element(doc, "td", {}, format(row.stock, 4)),
        element(doc, "td", {}, format(row.targetDelta, 5)),
        element(doc, "td", {}, format(row.shares, 5)),
        element(doc, "td", {}, format(row.cashBeforeRebalance, 5)),
        element(doc, "td", {}, format(row.trade, 7)),
        element(doc, "td", {}, format(row.trade*row.stock, 7)),
        element(doc, "td", {}, format(row.cash, 5)),
        element(doc, "td", {}, format(row.portfolio, 5)),
        element(doc, "td", {}, format(row.modelValue, 5)),
        element(doc, "td", { className: row.hedgeError < 0 ? "bsh-negative" : "" }, format(row.hedgeError, 6))
      ]));
    });
    table.appendChild(body);
    return table;
  }

  function mount(rootNode, api) {
    var doc = rootNode.ownerDocument || document;
    installStyles(doc);
    SERIAL += 1;
    var uid = "bsh-" + SERIAL;
    var config = normalizeConfig(DEFAULTS);
    var predictions = { drift: null, discrete: null, zero: null, parity: null },revealed=false;
    var questions = [
      { key: "drift", prompt: "Black-Scholes 的欧式价格使用哪个漂移？", choices: [["r", "风险中性漂移 r"], ["mu", "历史/场景漂移 mu"], ["none", "不需要漂移"]], answer: "r" },
      { key: "discrete", prompt: "有限次调仓的 terminal error 应怎样读？", choices: [["scenario", "一条路径的场景读数"], ["theorem", "连续定理本身"], ["zero", "必定为 0"]], answer: "scenario" },
      { key: "zero", prompt: "sigma=0 且 T>0 时发生什么？", choices: [["deterministic", "风险中性路径确定，价格退化为折现内在价值"], ["blowup", "公式发散"], ["same", "仍有随机波动"]], answer: "deterministic" },
      { key: "parity", prompt: "put-call parity 需要完整的 GBM 假设吗？", choices: [["no", "不需要；它来自到期现金流与无套利"], ["yes", "需要 sigma>0"], ["mu", "需要知道 mu"]], answer: "no" }
    ];
    var shell = element(doc, "div", { className: "bsh-lab" });
    shell.appendChild(element(doc, "h3", {}, "Black-Scholes 定价与离散 delta 对冲"));
    shell.appendChild(element(doc, "p", { className: "bsh-intro" }, "先把定价公式、连续复制和有限网格场景分开；揭示后再调参。路径由固定 seed 生成，因此同样参数会得到同一份账本。"));
    var gate = element(doc, "form", { className: "bsh-gate", "aria-labelledby": uid + "-gate-title" });
    gate.appendChild(element(doc, "strong", { id: uid + "-gate-title" }, "预测门：先判断量词、边界与无套利关系"));
    var choices = [];
    questions.forEach(function (question, questionIndex) {
      var field = element(doc, "fieldset");
      field.appendChild(element(doc, "legend", {}, (questionIndex + 1) + ". " + question.prompt));
      var row = element(doc, "div", { className: "bsh-choice-row" });
      question.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false","data-question":question.key,"data-choice":choice[0] }, choice[1]);
        button.addEventListener("click", function () {
          predictions[question.key] = choice[0];
          choices.forEach(function (item) {
            if (item.key === question.key) item.button.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false");
          });
          revealed=false;experiment.setAttribute("hidden","hidden");
          reveal.disabled=questions.some(function(q){return predictions[q.key]===null;});
          feedback.textContent = "预测已记录；四项都选择后才揭示结果。";
        });
        choices.push({ key: question.key, value: choice[0], button: button });
        row.appendChild(button);
      });
      field.appendChild(row);
      gate.appendChild(field);
    });
    var gateActions = element(doc, "div", { className: "bsh-actions" });
    var reveal = element(doc, "button", { type: "submit", className: "bsh-primary",disabled:true }, "提交预测并揭示");
    var resetGate = element(doc, "button", { type: "button" }, "重置");
    var feedback = element(doc, "p", { className: "bsh-feedback", "aria-live": "polite" }, "四项预测完成后，结果账本才会出现。");
    gateActions.appendChild(reveal);
    gateActions.appendChild(resetGate);
    gate.appendChild(gateActions);
    gate.appendChild(feedback);
    shell.appendChild(gate);

    var experiment = element(doc, "section", { hidden: "hidden", "aria-labelledby": uid + "-results-title",tabindex:-1 });
    experiment.appendChild(element(doc, "h3", { id: uid + "-results-title" }, "确定性实验台：公式 Greeks 与有限网格账本"));
    experiment.appendChild(element(doc, "p", { className: "bsh-note" }, "定价端固定使用 r；平价核对的是 C-P=S0-K exp(-rT)，其中到期债券现金流为 K、当前价为 K exp(-rT)；路径端用 mu 生成一个 GBM 场景。市场假设是无摩擦、完备、常数 r/sigma、连续可交易；这里的有限次调仓只是对连续理论的数值压力测试。"));
    var presetRow = element(doc, "div", { className: "bsh-presets", role: "group", "aria-label": "教学预设" });
    PRESETS.forEach(function (preset) {
      var button = element(doc, "button", { type: "button", "aria-pressed": preset.id === "baseline" ? "true" : "false","data-preset":preset.id }, preset.label);
      button.addEventListener("click", function () { config = presetConfig(preset); render(); });
      presetRow.appendChild(button);
    });
    experiment.appendChild(presetRow);
    var controls = element(doc, "div", { className: "bsh-controls" });
    var inputs = {};
    function addRange(key, label, min, max, step, digits) {
      var id = uid + "-" + key;
      var input = element(doc, "input", { id: id, type: "range", min: min, max: max, step: step, "aria-label": label,"data-key":key });
      var output = element(doc, "output", { for: id });
      var wrapper = element(doc, "div", { className: "bsh-control" }, [
        element(doc, "label", { htmlFor: id }, [label + " = ", output]),
        input,
        element(doc, "div", { className: "bsh-scale" }, [element(doc, "span", {}, String(min)), element(doc, "span", {}, String(max))])
      ]);
      input.addEventListener("input", function () { config[key] = Number(input.value); render(); });
      controls.appendChild(wrapper);
      inputs[key] = { input: input, output: output, digits: digits };
    }
    addRange("S0", "初始股价 S₀", 1, 250, 1, 1);
    addRange("K", "执行价 K", 1, 250, 1, 1);
    addRange("r", "r", -0.05, 0.2, 0.005, 3);
    addRange("sigma", "sigma", 0, 0.8, 0.01, 2);
    addRange("T", "T", 0, 3, 0.05, 2);
    addRange("mu", "scenario mu", -0.2, 0.3, 0.01, 2);
    function addSelect(key,label,values){
      var id=uid+"-"+key,input=element(doc,"select",{id:id,"aria-label":label,"data-key":key}),output=element(doc,"output",{for:id});
      values.forEach(function(v){input.appendChild(element(doc,"option",{value:v},String(v)));});
      input.addEventListener("input",function(){config[key]=Number(input.value);render();});
      controls.appendChild(element(doc,"div",{className:"bsh-control"},[element(doc,"label",{htmlFor:id},[label+" = ",output]),input]));inputs[key]={input:input,output:output,digits:0};
    }
    addSelect("steps","时间区间数",GRID_STEPS);addSelect("seed","共同噪声种子",SEEDS);
    experiment.appendChild(controls);
    var metrics = element(doc, "div", { className: "bsh-metrics" });
    var boundaryNote = element(doc, "p", { className: "bsh-boundary", "aria-live": "polite" });
    var frame = element(doc, "div", { className: "bsh-frame",tabindex:0,role:"region","aria-label":"路径与误差图，可横向滚动" });
    var svg = svgElement(doc, "svg", { className: "bsh-chart", viewBox: "0 0 780 390" });
    frame.appendChild(svg);
    var legend = element(doc, "div", { className: "bsh-legend" }, [
      element(doc, "span", {}, [element(doc, "i", { className: "bsh-swatch" }), "股票 S"]),
      element(doc, "span", {}, [element(doc, "i", { className: "bsh-swatch bsh-swatch-gold" }), "对冲组合"]),
      element(doc, "span", {}, [element(doc, "i", { className: "bsh-swatch bsh-swatch-red" }), "误差"]),
      element(doc, "span", {}, [element(doc, "i", { className: "bsh-swatch bsh-swatch-green" }), "执行价 / 零线"])
    ]);
    var tableWrap = element(doc, "div", { className: "bsh-table-wrap",tabindex:0,role:"region","aria-label":"逐行自融资账本，可横向滚动" });
    var greekWrap=element(doc,"div",{className:"bsh-table-wrap",tabindex:0,role:"region","aria-label":"call 与 put Greeks，可横向滚动"});
    var gridWrap=element(doc,"div",{className:"bsh-table-wrap",tabindex:0,role:"region","aria-label":"共同路径各网格误差，可横向滚动"});
    var interpretation = element(doc, "p", { className: "bsh-footnote", "aria-live": "polite" });
    var reset = element(doc, "button", { type: "button" }, "重新预测");
    reset.addEventListener("click", resetAll);
    experiment.appendChild(metrics);
    experiment.appendChild(boundaryNote);
    experiment.appendChild(frame);
    experiment.appendChild(legend);
    experiment.appendChild(greekWrap);
    experiment.appendChild(tableWrap);
    experiment.appendChild(gridWrap);
    experiment.appendChild(interpretation);
    experiment.appendChild(reset);
    shell.appendChild(experiment);
    rootNode.replaceChildren(shell);

    function syncInputs() {
      Object.keys(inputs).forEach(function (key) {
        inputs[key].input.value = String(config[key]);
        inputs[key].output.textContent = key==="seed"?String(config[key]):format(config[key], inputs[key].digits);
      });
    }

    function render() {
      var result = discreteDeltaHedge(config);
      syncInputs();
      presetRow.querySelectorAll("button").forEach(function (button, index) {
        var preset = PRESETS[index];
        button.setAttribute("aria-pressed", samePresetConfig(preset, config) ? "true" : "false");
      });
      metrics.replaceChildren(
        metric(doc, "call", format(result.pricing.call, 5)),
        metric(doc, "put", format(result.pricing.put, 5)),
        metric(doc, "平价代数残差", format(result.pricing.parityResidual, 8)),
        metric(doc, "delta", greekText(result.pricing, "call", "delta", 5)),
        metric(doc, "gamma", greekText(result.pricing, "call", "gamma", 5)),
        metric(doc, "vega", greekText(result.pricing, "call", "vega", 5)),
        metric(doc, "theta", greekText(result.pricing, "call", "theta", 5)),
        metric(doc, "rho", greekText(result.pricing, "call", "rho", 5)),
        metric(doc, "本路径终点误差", format(result.terminalError, 6))
      );
      boundaryNote.textContent=result.pricing.boundary+(config.sigma===0&&config.mu!==config.r?" 注意：σ=0 而场景 μ≠r 不符合此无套利市场，下面仅作模型失配情景。":"");
      drawChart(doc, svg, result, uid);
      tableWrap.replaceChildren(tableFor(doc, result));
      function simpleTable(title,headers,rows){
        var t=element(doc,"table",{className:"bsh-table"});t.appendChild(element(doc,"caption",{},title));
        t.appendChild(element(doc,"thead",{},element(doc,"tr",{},headers.map(function(h){return element(doc,"th",{scope:"col"},h);}))));
        t.appendChild(element(doc,"tbody",{},rows.map(function(row){return element(doc,"tr",{},row.map(function(v){return element(doc,"td",{},v);}));})));return t;
      }
      greekWrap.replaceChildren(simpleTable("两种期权的敏感度（Vega/rho 每 1 绝对单位，Theta 每年日历时间）",["期权","Delta","Gamma","Vega","Theta","rho"],["call","put"].map(function(side){return[side].concat(["delta","gamma","vega","theta","rho"].map(function(k){return greekText(result.pricing,side,k,7);}));})));
      var comparisons=GRID_STEPS.map(function(steps){var h=discreteDeltaHedge(Object.assign({},config,{steps:steps}));return[steps,format(config.T/steps,7),format(h.path.prices[h.path.prices.length-1],7),format(h.terminalError,7),format(h.maxAbsHedgeError,7)];});
      gridWrap.replaceChildren(simpleTable("同一布朗路径的八个网格；末端股票值相同，误差不保证逐次减小",["区间数","h","共同终点 S(T)","有符号终点误差","网格最大标记误差"],comparisons));
      interpretation.textContent="384 个细区间的 Brownian 增量被聚合到各网格；终点股价相同，调仓策略不同。单路径网格误差不保证单调，也不等于总体强/弱误差。平价残差由共同时间价值构造而来，只是代数一致性检查；不能证明价格公式正确。浮点舍入会留下极小的确定性残差。";
    }

    function resetAll() {
      config = normalizeConfig(DEFAULTS);
      predictions = { drift: null, discrete: null, zero: null, parity: null };
      choices.forEach(function (item) { item.button.setAttribute("aria-pressed", "false"); });
      reveal.disabled = true;revealed=false;
      experiment.setAttribute("hidden", "hidden");
      feedback.className = "bsh-feedback";
      feedback.textContent = "四项预测完成后，结果账本才会出现。";
      syncInputs();
      choices[0].button.focus();
    }

    gate.addEventListener("submit", function (event) {
      event.preventDefault();
      if(revealed)return;
      var missing = questions.filter(function (question) { return predictions[question.key] === null; });
      if (missing.length) {
        feedback.className = "bsh-feedback bsh-boundary";
        feedback.textContent = "还缺 " + missing.length + " 项预测。";
        return;
      }
      var correct = questions.reduce(function (sum, question) { return sum + (predictions[question.key] === question.answer ? 1 : 0); }, 0);
      reveal.disabled = true;
      revealed=true;
      experiment.removeAttribute("hidden");
      feedback.textContent = "已揭示：" + correct + "/" + questions.length + " 项命中；现在可以调参。";
      feedback.className = "bsh-feedback" + (correct === questions.length ? " bsh-boundary" : "");
      render();
      experiment.focus();
      if (api && typeof api.announce === "function") api.announce(rootNode, feedback.textContent);
    });
    resetGate.addEventListener("click", resetAll);
    render();
  }

  function predictionAnswers() {
    return { drift: "r", discrete: "scenario", zero: "deterministic", parity: "no" };
  }

  function close(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-8 : tolerance);
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    assert(close(normalCdf(0), 0.5, 2e-7), "normal CDF at zero");
    assert(close(normalCdf(1.9599639845), 0.975, 2e-5), "normal CDF calibration");
    var base = blackScholes(100, 100, 0.05, 0.2, 1);
    assert(close(base.call, 10.45058, 2e-4), "European call formula");
    assert(close(base.put, 5.57353, 2e-4), "European put from parity");
    assert(close(base.parityResidual, 0, 1e-10), "put-call parity residual");
    assert(base.status === "regular" && base.d1 > base.d2, "regular d1/d2 status");
    assert(base.greeks.call.delta > 0 && base.greeks.call.delta < 1, "call delta range");
    assert(close(base.greeks.call.gamma, base.greeks.put.gamma, 1e-12), "gamma parity");
    assert(close(base.greeks.call.vega, base.greeks.put.vega, 1e-12), "vega parity");
    assert(close(base.greeks.call.delta - base.greeks.put.delta, 1, 1e-12), "delta parity");
    assert(close(base.greeks.call.rho - base.greeks.put.rho, 100 * Math.exp(-0.05), 1e-8), "rho parity");
    assert(base.greekMetadata.call.gamma.status === "available" && base.greekMetadata.call.vega.status === "available", "regular Greek metadata");
    var atMaturity = blackScholes(110, 100, 0.05, 0.2, 0);
    assert(atMaturity.status === "maturity-boundary" && atMaturity.call === 10 && atMaturity.put === 0, "T=0 payoff boundary");
    assert(atMaturity.greeks.call.delta === 1 && atMaturity.greeks.call.gamma === 0, "T=0 delta and gamma boundary");
    assert(atMaturity.greekMetadata.call.theta.status === "one-sided" && close(atMaturity.greeks.call.theta, -5), "T=0 one-sided theta");
    var atKink = blackScholes(100, 100, 0.05, 0.2, 0);
    assert(atKink.greeks.call.delta === 0.5 && atKink.greekMetadata.call.delta.status === "convention", "maturity kink delta convention");
    assert(atKink.greeks.call.vega===0&&atKink.greeks.put.vega===0,"at maturity payoff is independent of volatility, even at ATM");
    assert(atKink.greeks.call.gamma === null && atKink.greekMetadata.call.gamma.status === "unavailable", "maturity kink gamma unavailable");
    assert(atKink.greeks.call.theta === null && atKink.greekMetadata.call.theta.status === "unavailable", "maturity kink theta unavailable");
    var zeroVol = blackScholes(100, 105, 0.04, 0, 1);
    assert(zeroVol.status === "zero-volatility-boundary", "sigma=0 status");
    assert(close(zeroVol.call, Math.max(100 - 105 * Math.exp(-0.04), 0), 1e-12), "sigma=0 discounted intrinsic");
    assert(zeroVol.greeks.call.gamma === 0 && zeroVol.greeks.call.vega === 0, "sigma=0 curvature and vega boundary");
    assert(zeroVol.greekMetadata.call.gamma.status === "available" && zeroVol.greekMetadata.call.vega.status === "one-sided", "sigma=0 right volatility derivative");
    var forwardAtm = blackScholes(100 * Math.exp(-0.04), 100, 0.04, 0, 1);
    assert(forwardAtm.greeks.call.delta === 0.5 && forwardAtm.greekMetadata.call.delta.status === "convention", "sigma=0 forward-ATM delta");
    assert(forwardAtm.greeks.call.gamma === null && forwardAtm.greekMetadata.call.gamma.status === "unavailable", "sigma=0 forward-ATM gamma unavailable");
    assert(close(forwardAtm.greeks.call.vega, forwardAtm.inputs.S * normalPdf(0), 1e-12) && forwardAtm.greekMetadata.call.vega.status === "one-sided", "sigma=0 forward-ATM one-sided vega");
    assert(forwardAtm.greeks.call.theta === null && forwardAtm.greeks.call.rho === null, "sigma=0 forward-ATM unavailable time/rate Greeks");
    var zeroVolInMoney = blackScholes(110, 100, 0.04, 0, 1);
    assert(close(zeroVolInMoney.greeks.call.rho, 100 * Math.exp(-0.04), 1e-12), "sigma=0 call rho boundary");
    var atZeroSpot = blackScholes(0, 100, 0.05, 0.2, 1);
    assert(atZeroSpot.call === 0 && close(atZeroSpot.put, 100 * Math.exp(-0.05), 1e-12), "S=0 boundary");
    var hedge = discreteDeltaHedge(DEFAULTS);
    var repeat = discreteDeltaHedge(DEFAULTS);
    assert(JSON.stringify(hedge) === JSON.stringify(repeat), "seeded hedge determinism");
    assert(hedge.rows.length === DEFAULTS.steps + 1, "hedge row count");
    assert(close(hedge.rows[0].portfolio, hedge.pricing.call, 1e-10), "initial self-financing value");
    assert(close(hedge.rows[0].hedgeError, 0, 1e-10), "initial mark error");
    assert(hedge.rows.every(function (row) { return finite(row.stock) && finite(row.portfolio) && finite(row.hedgeError); }), "finite hedge ledger");
    assert(hedge.rows[hedge.rows.length - 1].payoff !== null, "terminal payoff recorded");
    assert(close(hedge.terminalError, hedge.rows[hedge.rows.length - 1].portfolio - hedge.rows[hedge.rows.length - 1].payoff, 1e-12), "terminal error definition");
    var deterministic = discreteDeltaHedge({ S0: 100, K: 90, r: 0.04, sigma: 0, T: 1, mu: 0.04, steps: 16, seed: 9 });
    assert(Math.abs(deterministic.terminalError) < 1e-8, "zero-vol deterministic hedge closes");
    var zeroTime = discreteDeltaHedge({ S0: 90, K: 100, r: 0.05, sigma: 0.2, T: 0, steps: 16, seed: 9 });
    assert(zeroTime.rows.length === 1 && zeroTime.terminalError === 0, "T=0 hedge boundary");
    assert(samePresetConfig(PRESETS[0], presetConfig(PRESETS[0])), "baseline preset comparison");
    ["S0", "K", "r", "sigma", "T", "mu", "steps"].forEach(function (key) {
      var changed = presetConfig(PRESETS[0]);
      changed[key] = key === "steps" ? changed[key] + 1 : changed[key] + (key === "sigma" || key === "T" ? 0.01 : 1);
      assert(!samePresetConfig(PRESETS[0], changed), "preset comparison includes " + key);
    });
    var answers = predictionAnswers();
    assert(answers.drift === "r" && answers.discrete === "scenario", "prediction gate pricing answers");
    assert(answers.zero === "deterministic" && answers.parity === "no", "prediction gate boundary answers");
    assert(format(10,0)==="10"&&format(0,0)==="0"&&format(.0001,3)!=="0","formats preserve integers and small nonzero values");
    assert(blackScholes(40,180,.05,.1,1).call>0,"deep OTM call survives CDF cancellation");
    assert(blackScholes(180,40,.05,.1,1).put>0,"deep OTM put survives parity cancellation");
    assert(close(blackScholes(100,100,0,1e-8,1).call,100*1e-8/SQRT_TWO_PI,1e-20),"tiny ATM time value");
    var kinkFlat=blackScholes(100,100,0,0,1);assert(kinkFlat.greeks.call.theta===0&&kinkFlat.greeks.put.theta===0,"sigma=r=0 time derivative exists at the spot kink");
    var terminalStock=hedge.path.prices[hedge.path.prices.length-1];
    GRID_STEPS.forEach(function(steps){var h=discreteDeltaHedge(Object.assign({},DEFAULTS,{steps:steps}));assert(h.path.prices[h.path.prices.length-1]===terminalStock,"all grids share exact terminal stock");});
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    DEFAULTS: DEFAULTS,
    PRESETS: PRESETS,
    GRID_STEPS:GRID_STEPS,SEEDS:SEEDS,presetConfig:presetConfig,format:format,drawChart:drawChart,
    normalizeConfig: normalizeConfig,
    samePresetConfig: samePresetConfig,
    normalCdf: normalCdf,
    normalPdf: normalPdf,
    normalLogTail:normalLogTail,timeValue:timeValue,
    blackScholes: blackScholes,
    generatePath: generatePath,
    discreteDeltaHedge: discreteDeltaHedge,
    predictionAnswers: predictionAnswers,
    selfTest: selfTest,
    mount: mount
  };
});

(function (host, factory) {
  "use strict";

  var exported = factory(host);

  if (typeof module === "object" && module.exports) module.exports = exported;
  if (host && host.CourseLearning && typeof host.CourseLearning.register === "function") {
    host.CourseLearning.register("quadrature-ode", exported.mount);
  }
  if (
    typeof module === "object" && module.exports &&
    typeof require === "function" && require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log(
        "quadrature-ode self-test: PASS (" + report.checks + " checks, " +
        report.quadraturePresets + " quadrature presets, " + report.odeMethods + " ODE methods)"
      );
    } catch (error) {
      console.error("quadrature-ode self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
}(
  typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : null,
  function (host) {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "cl-quadrature-ode-style";
    var INSTANCE = 0;
    var RK4_STABILITY_LIMIT = 2.785293563405281;

    var QUADRATURE_PRESETS = [
      {
        id: "smooth",
        label: "宽缓函数：cos(x) + x²",
        shortLabel: "宽缓函数",
        formula: "f(x) = cos(x) + x^2",
        f: function (x) { return Math.cos(x) + x * x; },
        exact: Math.sin(1) + 1 / 3,
        premise: "C⁴[0,1]；Simpson 要求偶数 N",
        boundary: "四阶是 h→0 的误差阶；一对网格不能证明已进入渐近区。"
      },
      {
        id: "peak",
        label: "窄峰：1 / (1 + 400(x − 0.65)²)",
        shortLabel: "窄峰",
        formula: "f(x) = 1 / (1 + 400(x - 0.65)^2)",
        f: function (x) {
          var d = x - 0.65;
          return 1 / (1 + 400 * d * d);
        },
        exact: (Math.atan(7) + Math.atan(13)) / 20,
        premise: "光滑，但还要分辨峰宽",
        boundary: "峰中心 0.65 与宽度约 0.05；先细化网格，观察误差是否进入稳定比例。"
      }
    ];

    QUADRATURE_PRESETS.push({
      id: "bump", label: "会被漏掉的 C⁴ 窄峰", shortLabel: "紧支撑窄峰",
      formula: "f(x) = (1 − u²)⁵ (|u| < 1)，否则 0；u = 128(x − 39/64)",
      f: function (x) { var u = 128 * (x - 39 / 64); return Math.abs(u) < 1 ? Math.pow(1 - u * u, 5) : 0; },
      exact: 4 / 693, premise: "C⁴；支撑 [77/128,79/128]",
      boundary: "初始五个自适应探针全为零，估计误差也是零，却漏掉整个积分 4/693。"
    });
    QUADRATURE_PRESETS.forEach(Object.freeze);
    Object.freeze(QUADRATURE_PRESETS);
    // REFERENCE_DATA_START
    var INTEGRAL_REFERENCES = {"smooth": {"hi": 1.1748043181412298, "lo": 7.579171340127931e-17, "text": "1.1748043181412298399858356549636323329558963941317043990060850433"}, "peak": {"hi": 0.14614618538579258, "lo": -1.251789124613339e-17, "text": "0.14614618538579256382102348165147821465413882217350848121456937091"}, "bump": {"hi": 0.005772005772005772, "lo": 5.006416958086023e-21, "text": "0.005772005772005772005772005772005772005772005772005772005772005772"}};
    Object.keys(INTEGRAL_REFERENCES).forEach(function(k){Object.freeze(INTEGRAL_REFERENCES[k]);});
    Object.freeze(INTEGRAL_REFERENCES);
    // REFERENCE_DATA_END

    var ODE_METHODS = [
      {
        id: "euler",
        label: "Euler",
        localOrder: 2,
        globalOrder: 1,
        factor: function (z) { return 1 - z; },
        stability: "0 <= z <= 2"
      },
      {
        id: "heun",
        label: "Heun",
        localOrder: 3,
        globalOrder: 2,
        factor: function (z) { return 1 - z + z * z / 2; },
        stability: "0 <= z <= 2"
      },
      {
        id: "rk4",
        label: "RK4",
        localOrder: 5,
        globalOrder: 4,
        factor: function (z) {
          return 1 - z + z * z / 2 - z * z * z / 6 + z * z * z * z / 24;
        },
        stability: "0 <= z <= 2.7852935634"
      }
    ];

    ODE_METHODS.push({
      id: "implicit", label: "隐式 Euler", localOrder: 2, globalOrder: 1,
      factor: function (z) { return 1 / (1 + z); }, stability: "z ≥ 0；z > 0 时衰减"
    });
    ODE_METHODS.forEach(Object.freeze);
    Object.freeze(ODE_METHODS);

    var QUADRATURE_QUESTIONS = [
      {
        key: "simpsonGrid",
        label: "复合 Simpson 的子区间数 N，首先必须满足什么？",
        options: [
          { value: "any", label: "任意正整数" },
          { value: "even", label: "偶数" },
          { value: "prime", label: "质数" }
        ],
        expected: "even"
      },
      {
        key: "peakMethod",
        label: "自适应估计误差为零，能否排除采样点之间还有窄峰？",
        options: [
          { value: "trapezoid", label: "能，因为容差已经满足" },
          { value: "simpson", label: "能，只要函数属于 C⁴" },
          { value: "adaptive", label: "不能；须检查特征尺度、分段信息或独立误差界" }
        ],
        expected: "adaptive"
      },
      {
        key: "simpsonRate",
        label: "在前提满足且进入渐近区后，h 减半时 Simpson 误差约怎样？",
        options: [
          { value: "two", label: "除以 2" },
          { value: "four", label: "除以 4" },
          { value: "sixteen", label: "除以 16" }
        ],
        expected: "sixteen"
      }
    ];

    var ODE_QUESTIONS = [
      {
        key: "orders",
        label: "对一阶方法，局部截断阶与全局误差阶的典型关系是？",
        options: [
          { value: "same", label: "相同" },
          { value: "local-higher", label: "局部阶高一阶" },
          { value: "unrelated", label: "没有关系" }
        ],
        expected: "local-higher"
      },
      {
        key: "stability",
        label: "试验方程上的绝对稳定，直接检查哪一个量？",
        options: [
          { value: "factor", label: "|G(z)| <= 1" },
          { value: "order", label: "全局阶越高越稳定" },
          { value: "exact", label: "只看 exact 的符号" }
        ],
        expected: "factor"
      },
      {
        key: "overshoot",
        label: "当 1 < z < 2 时，Euler 对正的衰减解会怎样？",
        options: [
          { value: "negative-stable", label: "变负但仍可能绝对稳定" },
          { value: "positive-exact", label: "保持正且等于 exact" },
          { value: "always-blow", label: "必然立刻发散" }
        ],
        expected: "negative-stable"
      }
    ];

    var STYLE_TEXT = [
      ".qode-lab{--qode-blue:var(--cl-blue,#315f9d);--qode-green:var(--cl-green,#39734d);--qode-red:var(--cl-red,#b64335);--qode-gold:var(--cl-gold,#9b6a12);--qode-muted:var(--fg-soft,#666);--qode-block:var(--block-bg,var(--bg,#fff));color:var(--fg);line-height:1.5;min-width:0;overflow:hidden}",
      ".qode-lab *,.qode-lab *::before,.qode-lab *::after{box-sizing:border-box}",
      ".qode-lab h3,.qode-lab h4,.qode-lab p{margin-top:0}",
      ".qode-lab .qode-intro,.qode-lab .qode-note,.qode-lab .qode-feedback{color:var(--qode-muted);overflow-wrap:anywhere}",
      ".qode-lab .qode-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:14px 0 10px}",
      ".qode-lab button,.qode-lab select,.qode-lab input{font:inherit;letter-spacing:0}",
      ".qode-lab button,.qode-lab select{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:inherit;cursor:pointer;overflow-wrap:anywhere}",
      ".qode-lab button:hover{border-color:var(--accent)}",
      ".qode-lab button[aria-pressed=\"true\"],.qode-lab .qode-primary{background:var(--accent);border-color:var(--accent);color:var(--bg);font-weight:700}",
      ".qode-lab button:focus-visible,.qode-lab select:focus-visible,.qode-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
      ".qode-lab .qode-panel{min-width:0}",
      ".qode-lab .qode-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 16px;margin:12px 0;padding:12px 14px;border-top:2px solid var(--accent);border-bottom:1px solid var(--border);background:var(--qode-block)}",
      ".qode-lab .qode-control{display:grid;gap:5px;min-width:0}",
      ".qode-lab .qode-control label,.qode-lab .qode-control-label{color:var(--qode-muted);font-size:13px;font-weight:700}",
      ".qode-lab .qode-control-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px}",
      ".qode-lab output{color:var(--accent);font-variant-numeric:tabular-nums}",
      ".qode-lab input[type=range]{width:100%;min-height:44px;margin:0;accent-color:var(--accent)}",
      ".qode-lab .qode-gate{margin:15px 0;padding:13px 14px;border-left:3px solid var(--qode-gold);background:var(--qode-block)}",
      ".qode-lab .qode-gate h4{margin:0 0 9px;color:var(--accent)}",
      ".qode-lab .qode-question-list{display:grid;gap:10px}",
      ".qode-lab .qode-question{display:grid;gap:5px;min-width:0}",
      ".qode-lab .qode-question label{color:var(--fg);font-size:13px;font-weight:700;overflow-wrap:anywhere}",
      ".qode-lab .qode-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}",
      ".qode-lab .qode-actions>*{flex:1 1 150px}",
      ".qode-lab .qode-feedback{min-height:1.5em;margin:9px 0 0}",
      ".qode-lab .qode-pass{color:var(--qode-green);font-weight:700}.qode-lab .qode-warn{color:var(--qode-red);font-weight:700}",
      ".qode-lab .qode-results{margin-top:16px;padding-top:14px;border-top:1px solid var(--border)}",
      ".qode-lab .qode-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:0 0 13px}",
      ".qode-lab .qode-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--qode-block)}",
      ".qode-lab .qode-metric:nth-child(3n+1){border-top-color:var(--qode-blue)}.qode-lab .qode-metric:nth-child(3n+2){border-top-color:var(--qode-gold)}.qode-lab .qode-metric:nth-child(3n){border-top-color:var(--qode-green)}",
      ".qode-lab .qode-metric span{display:block;color:var(--qode-muted);font-size:11px;overflow-wrap:anywhere}.qode-lab .qode-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
      ".qode-lab .qode-chart{min-width:0;margin:12px 0;padding:7px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow:hidden}",
      ".qode-lab .qode-chart svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg)}.qode-lab .qode-chart svg text{fill:currentColor;font-family:inherit;letter-spacing:0}",
      ".qode-lab .qode-ledger{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:12px}",
      ".qode-lab table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.qode-lab .qode-ledger table{min-width:960px}",
      ".qode-lab th,.qode-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere}.qode-lab th{color:var(--qode-muted);font-size:11px;font-weight:750}",
      ".qode-lab .qode-callout{margin:11px 0 0;padding:10px 12px;border-left:3px solid var(--qode-green);background:var(--qode-block);font-size:13px;line-height:1.65;overflow-wrap:anywhere}",
      ".qode-lab .qode-boundary{border-left-color:var(--qode-red)}",
      ".qode-lab [hidden]{display:none!important}",
      "@media(max-width:700px){.qode-lab .qode-controls{grid-template-columns:minmax(0,1fr)}}",
      "@media(max-width:430px){.qode-lab .qode-gate,.qode-lab .qode-controls{padding-left:10px;padding-right:10px}.qode-lab .qode-tabs{grid-template-columns:minmax(0,1fr)}}",
      "@media(prefers-reduced-motion:reduce){.qode-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
      ,".qode-lab .qode-chart{overflow-x:auto;overflow-y:hidden;padding:6px}.qode-lab .qode-chart svg{width:760px;min-width:760px;max-width:none}"
      ,".qode-lab [role=region]:focus-visible,.qode-lab .qode-results:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}"
      ,".qode-lab table{display:table}.qode-lab button:disabled{opacity:.55;cursor:default}"
      ,"@media(prefers-reduced-motion:reduce){html:has(.qode-lab){scroll-behavior:auto!important}}"
    ].join("\n");

    function finite(value) {
      return typeof value === "number" && isFinite(value);
    }

    function near(left, right, tolerance) {
      var scale = Math.max(1, Math.abs(left), Math.abs(right));
      return Math.abs(left - right) <= (tolerance || 1e-10) * scale;
    }

    function requireInteger(value, minimum, label) {
      var parsed = value;
      if (!finite(parsed) || Math.floor(parsed) !== parsed || parsed < minimum || parsed > 4096) {
        throw new RangeError(label + " must be an integer >= " + minimum);
      }
      return parsed;
    }

    function requirePositive(value, label) {
      var parsed = value;
      if (!finite(parsed) || parsed <= 0) throw new RangeError(label + " must be positive");
      return parsed;
    }

    function formatNumber(api, value, digits) {
      if (value === null || value === undefined) return "-";
      if (!finite(value)) return value === Infinity ? "+inf" : value === -Infinity ? "-inf" : "-";
      if (api && typeof api.format === "function") return api.format(value, digits);
      var places = digits === undefined ? 4 : digits;
      if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 1e6)) return value.toExponential(Math.min(places, 4));
      return places === 0 ? value.toFixed(0) : value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
    }

    function findQuadraturePreset(id) {
      for (var i = 0; i < QUADRATURE_PRESETS.length; i += 1) {
        if (QUADRATURE_PRESETS[i].id === id) return QUADRATURE_PRESETS[i];
      }
      throw new RangeError("unknown quadrature preset: " + id);
    }

    function interval(f, a, b) {
      if (typeof f !== "function" || !finite(a) || !finite(b) || !(a < b) || !finite(b-a)) throw new RangeError("finite interval a < b required");
    }
    function sampleFinite(f, x) {
      var y = f(x);
      if (!finite(y)) throw new RangeError("finite function value required");
      return y;
    }
    function checked(value) {
      if (!finite(value)) throw new RangeError("arithmetic overflow");
      return value;
    }
    function compositeTrapezoid(f, a, b, count) {
      interval(f,a,b);
      var n = requireInteger(count,1,"trapezoid N"), h=(b-a)/n;
      var sum = (sampleFinite(f,a)+sampleFinite(f,b))/2;
      for(var j=1;j<n;j++) sum += sampleFinite(f,a+j*h);
      return checked(h*sum);
    }
    function compositeSimpson(f, a, b, count) {
      interval(f,a,b);
      var n=requireInteger(count,2,"Simpson N");
      if(n%2) throw new RangeError("Simpson N must be even");
      var h=(b-a)/n, sum=sampleFinite(f,a)+sampleFinite(f,b);
      for(var j=1;j<n;j++) sum += (j%2 ? 4:2)*sampleFinite(f,a+j*h);
      return checked(h*sum/3);
    }
    function adaptiveSimpson(f,a,b,tolerance,maxDepth,maxEvaluations) {
      interval(f,a,b);
      var tol=requirePositive(tolerance,"自适应容差");
      var depthLimit=requireInteger(maxDepth===undefined?18:maxDepth,0,"depth");
      var budget=requireInteger(maxEvaluations===undefined?4096:maxEvaluations,5,"evaluation budget");
      if(depthLimit>20) throw new RangeError("depth must be <= 20");
      var samples=[], reasons={};
      function sample(x) {var y=sampleFinite(f,x);samples.push([x,y]);return y;}
      function local(l,r,fl,fm,fr) {return checked((r-l)*(fl+4*fm+fr)/6);}
      function stopped(value, reason) {reasons[reason]=true;return {value:value,errorEstimate:null,reachedLimit:true};}
      function recurse(l,r,fl,fm,fr,whole,eps,depth) {
        var m=l+(r-l)/2,lm=l+(m-l)/2,rm=m+(r-m)/2;
        if(!(l<lm&&lm<m&&m<rm&&rm<r)) return stopped(whole,"浮点中点不再细分");
        if(samples.length+2>budget) return stopped(whole,"求值预算耗尽");
        var flm=sample(lm),frm=sample(rm);
        var a0=local(l,m,fl,flm,fm),b0=local(m,r,fm,frm,fr),delta=checked(a0+b0-whole);
        var estimate=Math.abs(delta)/15;
        // The estimator may miss an unresolved feature even when estimate === 0.
        if(estimate<=eps) return {value:checked(a0+b0+delta/15),errorEstimate:estimate,reachedLimit:false};
        if(depth===0) {reasons["递归深度耗尽"]=true;return {value:checked(a0+b0+delta/15),errorEstimate:estimate,reachedLimit:true};}
        var aa=recurse(l,m,fl,flm,fm,a0,eps/2,depth-1);
        var bb=recurse(m,r,fm,frm,fr,b0,eps/2,depth-1);
        return {value:checked(aa.value+bb.value),errorEstimate:aa.errorEstimate===null||bb.errorEstimate===null?null:aa.errorEstimate+bb.errorEstimate,reachedLimit:aa.reachedLimit||bb.reachedLimit};
      }
      var m=a+(b-a)/2,fa=sample(a),fm=sample(m),fb=sample(b);
      var result=recurse(a,b,fa,fm,fb,local(a,b,fa,fm,fb),tol,depthLimit);
      result.samples=samples;result.evaluations=samples.length;
      result.tolerance=tol;result.maxDepth=depthLimit;result.maxEvaluations=budget;
      result.reasons=Object.keys(reasons);
      result.status=result.reachedLimit?result.reasons.join("；"):"估计准则通过（非误差保证）";
      return result;
    }
    function referenceError(value,reference) {
      return Math.abs((value-reference.hi)-reference.lo);
    }
    function quadratureExperiment(functionId,count,tolerance) {
      var preset=findQuadraturePreset(functionId),n=requireInteger(count,2,"quadrature N");
      if(n%2) throw new RangeError("quadrature N must be even");
      var tol=tolerance===undefined?1e-9:requirePositive(tolerance,"tolerance");
      var adaptive=adaptiveSimpson(preset.f,0,1,tol);
      var values={trapezoid:compositeTrapezoid(preset.f,0,1,n),simpson:compositeSimpson(preset.f,0,1,n),adaptive:adaptive.value};
      var split=null;
      if(functionId==="bump") {
        // These boundaries are supplied analytically, not discovered by the solver.
        var cuts=[0,77/128,79/128,1];
        var parts=cuts.slice(0,-1).map(function(a,i){return adaptiveSimpson(preset.f,a,cuts[i+1],tol/3);});
        split={value:parts.reduce(function(s,p){return s+p.value;},0),
          errorEstimate:parts.some(function(p){return p.errorEstimate===null;})?null:parts.reduce(function(s,p){return s+p.errorEstimate;},0),
          evaluations:parts.reduce(function(s,p){return s+p.evaluations;},0),
          reachedLimit:parts.some(function(p){return p.reachedLimit;}),
          samples:[].concat.apply([],parts.map(function(p){return p.samples;}))};
        split.status=split.reachedLimit?"资源限制：估计未完成":"已知支撑分段；估计准则通过（非保证）";
        values.split=split.value;
      }
      var ref=INTEGRAL_REFERENCES[functionId],errors={};
      Object.keys(values).forEach(function(k){errors[k]=referenceError(values[k],ref);});
      return {id:preset.id,label:preset.label,formula:preset.formula,exact:ref.hi,reference:ref,n:n,h:1/n,tolerance:tol,values:values,errors:errors,adaptive:adaptive,split:split,premise:preset.premise,boundary:preset.boundary};
    }
    function stabilityLabel(factor) {
      var a=Math.abs(factor);
      if(a>1) return "不稳定：幅值增长";
      if(a===1) return "边界：幅值不衰减";
      return factor<0?"衰减，但逐步变号":"衰减且非负";
    }
    function odeExperiment(lambda,finalTime,count) {
      var rate=requirePositive(lambda,"lambda"),time=requirePositive(finalTime,"T"),n=requireInteger(count,1,"ODE N");
      var product=rate*time;
      if(!finite(product)||product<1e-12||product>700) throw new RangeError("lambda*T must lie in [1e-12,700]");
      var h=time/n,z=product/n;
      if(!finite(h)||h===0) throw new RangeError("step size not representable");
      var exact=Math.exp(-product);
      var rows=ODE_METHODS.map(function(method) {
        var factor=method.factor(z),endpoint=checked(Math.pow(factor,n));
        return {id:method.id,label:method.label,factor:factor,localOrder:method.localOrder,globalOrder:method.globalOrder,endpoint:endpoint,firstValue:factor,
          absoluteError:Math.abs(endpoint-exact),stability:stabilityLabel(factor),
          stable:Math.abs(factor)<=1,decays:Math.abs(factor)<1,signFlip:factor<0,stabilityInterval:method.stability};
      });
      return {lambda:rate,finalTime:time,steps:n,h:h,z:z,exact:exact,rows:rows,
        boundary:"Euler：" + stabilityLabel(rows[0].factor)+"。稳定性按实际浮点 G 严格比较；边界附近应同时看解析区间。"};
    }

    function predictionAnswers(mode) {
      if (mode !== "quadrature" && mode !== "ode") throw new RangeError("unknown mode");
      var questions = mode === "quadrature" ? QUADRATURE_QUESTIONS : ODE_QUESTIONS;
      var answers = {};
      for (var i = 0; i < questions.length; i += 1) answers[questions[i].key] = questions[i].expected;
      return answers;
    }

    function predictionScore(mode, prediction) {
      var questions = mode === "quadrature" ? QUADRATURE_QUESTIONS : ODE_QUESTIONS;
      var correct = 0;
      for (var i = 0; i < questions.length; i += 1) {
        if (prediction[questions[i].key] === questions[i].expected) correct += 1;
      }
      return { correct: correct, total: questions.length };
    }

    function makeElement(api, doc, tag, attrs, children) {
      if (api && typeof api.el === "function") return api.el(tag, attrs || {}, children);
      var node = doc.createElement(tag);
      Object.keys(attrs || {}).forEach(function (key) {
        var value = attrs[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "htmlFor") node.setAttribute("for", value);
        else if (key === "className") node.setAttribute("class", value);
        else if (key === "text") node.textContent = value;
        else if (value === true) node.setAttribute(key, "");
        else node.setAttribute(key, String(value));
      });
      (Array.isArray(children) ? children : [children]).forEach(function (child) {
        if (child !== undefined && child !== null && child !== false) {
          node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
        }
      });
      return node;
    }

    function makeSvg(api, doc, tag, attrs, children) {
      if (api && typeof api.svg === "function") return api.svg(tag, attrs || {}, children);
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attrs || {}).forEach(function (key) {
        var value = attrs[key];
        if (value !== undefined && value !== null && value !== false) node.setAttribute(key, String(value));
      });
      (Array.isArray(children) ? children : [children]).forEach(function (child) {
        if (child !== undefined && child !== null && child !== false) {
          node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
        }
      });
      return node;
    }

    function clear(node) {
      while (node && node.firstChild) node.removeChild(node.firstChild);
    }

    function replaceChildren(node, children) {
      clear(node);
      (children || []).forEach(function (child) { if (child) node.appendChild(child); });
    }

    function installStyles(doc) {
      if (doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement).appendChild(style);
    }

    function metric(api, label, value) {
      return makeElement(api, null, "div", { className: "qode-metric" }, [
        makeElement(api, null, "span", {}, [label]),
        makeElement(api, null, "strong", {}, [value])
      ]);
    }

    function linePath(points, mapX, mapY) {
      var path = "";
      for (var i = 0; i < points.length; i += 1) {
        path += (i === 0 ? "M" : "L") + mapX(points[i][0]).toFixed(2) + " " + mapY(points[i][1]).toFixed(2) + " ";
      }
      return path.trim();
    }

    function chartText(api, doc, x, y, text, attrs) {
      var values = { x: x, y: y, "font-size": 11, fill: "var(--fg-soft)", "aria-hidden": "true" };
      Object.keys(attrs || {}).forEach(function (key) { values[key] = attrs[key]; });
      return makeSvg(api, doc, "text", values, [text]);
    }

    function plotSvg(api,doc,height,title,desc) {
      var svg=makeSvg(api,doc,"svg",{className:"qode-svg",viewBox:"0 0 760 "+height,role:"img","aria-label":title});
      svg.appendChild(makeSvg(api,doc,"title",{},[title]));
      svg.appendChild(makeSvg(api,doc,"desc",{},[desc]));
      return svg;
    }
    function plotLine(api,doc,svg,x1,y1,x2,y2,color) {
      svg.appendChild(makeSvg(api,doc,"line",{x1:x1,y1:y1,x2:x2,y2:y2,stroke:color||"var(--border)","stroke-width":1}));
    }
    function drawQuadratureChart(api,doc,data) {
      var svg=plotSvg(api,doc,data.split?445:405,"被积函数与算法的实际采样点","上图绘图网格专门包含已知窄峰内部点，不等于下方算法实际使用的探针。");
      var preset=findQuadraturePreset(data.id),xs=[];
      for(var i=0;i<=320;i++) xs.push(i/320);
      if(data.id==="bump") for(var k=0;k<=160;k++) xs.push(77/128+k/(160*64));
      xs.sort(function(a,b){return a-b;});
      var points=xs.map(function(x){return [x,preset.f(x)];});
      var maxY=Math.max.apply(null,points.map(function(p){return p[1];}))*1.1;
      var mx=function(x){return 60+660*x;},my=function(y){return 235-190*y/maxY;};
      svg.setAttribute("data-max-y",maxY);
      [0,.25,.5,.75,1].forEach(function(x){plotLine(api,doc,svg,mx(x),45,mx(x),235);svg.appendChild(chartText(api,doc,mx(x),255,String(x),{"text-anchor":"middle"}));});
      [0,maxY/2,maxY].forEach(function(y){plotLine(api,doc,svg,60,my(y),720,my(y));svg.appendChild(chartText(api,doc,53,my(y)+4,formatNumber(api,y,3),{"text-anchor":"end"}));});
      svg.appendChild(chartText(api,doc,60,22,"蓝线：函数形状；下方短线：实际算法探针",{"font-size":14}));
      svg.appendChild(makeSvg(api,doc,"path",{class:"qode-function",d:linePath(points,mx,my),fill:"none",stroke:"var(--qode-blue)","stroke-width":2.5}));
      var rows=[{id:"uniform",label:"均匀节点 N="+data.n,y:305,color:"var(--qode-red)",points:Array.from({length:data.n+1},function(_,j){return [j/data.n,preset.f(j/data.n)];})},
        {id:"adaptive",label:"普通自适应："+data.adaptive.evaluations+" 次求值",y:355,color:"var(--qode-gold)",points:data.adaptive.samples}];
      if(data.split) rows.push({id:"split",label:"已知支撑分段："+data.split.evaluations+" 次求值（含重复端点）",y:405,color:"var(--qode-green)",points:data.split.samples});
      rows.forEach(function(row){
        svg.appendChild(chartText(api,doc,60,row.y-15,row.label,{"font-size":12}));
        plotLine(api,doc,svg,60,row.y,720,row.y);
        row.points.forEach(function(p){svg.appendChild(makeSvg(api,doc,"line",{"data-probe":row.id,"data-x":p[0],"data-f":p[1],x1:mx(p[0]),x2:mx(p[0]),y1:row.y-5,y2:row.y+5,stroke:row.color,"stroke-width":1.5}));});
      });
      return svg;
    }
    function drawErrorChart(api,doc,data) {
      var svg=plotSvg(api,doc,320,"各求积结果的绝对误差","纵轴为 log10 绝对误差；若计算误差为零，单独画在零行，不冒充一个正数。");
      var keys=Object.keys(data.errors),names={trapezoid:"梯形",simpson:"Simpson",adaptive:"普通自适应",split:"已知支撑分段"};
      var logs=keys.filter(function(k){return data.errors[k]>0;}).map(function(k){return Math.log10(data.errors[k]);});
      var lo=logs.length?Math.floor(Math.min.apply(null,logs))-1:-1,hi=logs.length?Math.ceil(Math.max.apply(null,logs))+1:1;
      var my=function(l){return 220-175*(l-lo)/(hi-lo);};
      svg.setAttribute("data-log-min",lo);svg.setAttribute("data-log-max",hi);
      svg.appendChild(chartText(api,doc,60,22,"log₁₀ |数值结果 − 高精度解析参考|",{"font-size":14}));
      for(var j=0;j<=4;j++) {var l=lo+(hi-lo)*j/4;plotLine(api,doc,svg,60,my(l),720,my(l));svg.appendChild(chartText(api,doc,52,my(l)+4,formatNumber(api,l,2),{"text-anchor":"end"}));}
      plotLine(api,doc,svg,60,268,720,268);
      svg.appendChild(chartText(api,doc,52,272,"零",{"text-anchor":"end"}));
      var colors=["var(--qode-red)","var(--qode-blue)","var(--qode-gold)","var(--qode-green)"];
      keys.forEach(function(k,i){var x=120+i*170,e=data.errors[k],y=e===0?268:my(Math.log10(e));
        svg.appendChild(makeSvg(api,doc,"circle",{"data-error":k,"data-value":e,cx:x,cy:y,r:5,fill:colors[i]}));
        svg.appendChild(chartText(api,doc,x,y-10,formatNumber(api,e,3),{"text-anchor":"middle"}));
        svg.appendChild(chartText(api,doc,x,301,names[k],{"text-anchor":"middle","font-size":12}));
      });
      return svg;
    }
    function drawOdeChart(api,doc,data) {
      var series=data.rows.map(function(row){return {id:row.id,label:row.label,points:Array.from({length:data.steps+1},function(_,k){return [k*data.h,Math.pow(row.factor,k)];})};});
      var maxAbs=1;
      series.forEach(function(s){s.points.forEach(function(p){maxAbs=Math.max(maxAbs,Math.abs(p[1]));});});
      var transformed=maxAbs>10,limit=transformed?Math.asinh(maxAbs)*1.08:maxAbs*1.08;
      var mx=function(t){return 100+620*t/data.finalTime;};
      var my=function(y){return 290-230*((transformed?Math.asinh(y):y)+limit)/(2*limit);};
      var svg=plotSvg(api,doc,400,"四种 ODE 方法与解析衰减","折线连接各个离散时间点；黑色虚线用独立密网格绘制解析解。纵轴必要时使用 asinh(y)，保留符号且不截断。");
      svg.setAttribute("data-transform",transformed?"asinh":"linear");svg.setAttribute("data-limit",limit);
      svg.appendChild(chartText(api,doc,100,22,"z = λh = "+formatNumber(api,data.z,5)+"；"+(transformed?"纵轴按 asinh(y) 映射，刻度仍标原始 y":"纵轴线性"),{"font-size":13}));
      [-1,-.5,0,.5,1].forEach(function(f){
        var y=transformed?Math.sinh(f*limit):f*limit;
        plotLine(api,doc,svg,100,my(y),720,my(y),f===0?"currentColor":null);
        svg.appendChild(chartText(api,doc,92,my(y)+4,formatNumber(api,y,2),{"text-anchor":"end"}));
      });
      [0,.5,1].forEach(function(f){var x=mx(f*data.finalTime);plotLine(api,doc,svg,x,60,x,290);svg.appendChild(chartText(api,doc,x,312,formatNumber(api,f*data.finalTime,3),{"text-anchor":"middle"}));});
      svg.appendChild(chartText(api,doc,735,312,"t"));
      var times=[];
      for(var i=0;i<=512;i++) {times.push(data.finalTime*i/512);var fast=i/(32*data.lambda);if(fast<data.finalTime)times.push(fast);}
      times.sort(function(a,b){return a-b;});
      var exact=times.map(function(t){return [t,Math.exp(-data.lambda*t)];});
      svg.appendChild(makeSvg(api,doc,"path",{class:"qode-exact",d:linePath(exact,mx,my),fill:"none",stroke:"currentColor","stroke-width":2,"stroke-dasharray":"5 4"}));
      var colors=["var(--qode-red)","var(--qode-green)","var(--qode-blue)","var(--qode-gold)"];
      series.forEach(function(s,i) {
        svg.appendChild(makeSvg(api,doc,"path",{"data-trajectory":s.id,d:linePath(s.points,mx,my),fill:"none",stroke:colors[i],"stroke-width":1.8}));
        s.points.forEach(function(p){svg.appendChild(makeSvg(api,doc,"circle",{"data-method":s.id,"data-t":p[0],"data-y":p[1],cx:mx(p[0]),cy:my(p[1]),r:2.5,fill:colors[i]}));});
        var x=100+(i%2)*320,y=343+Math.floor(i/2)*25;
        plotLine(api,doc,svg,x,y,x+22,y,colors[i]);svg.appendChild(chartText(api,doc,x+28,y+4,s.label,{"font-size":12}));
      });
      svg.appendChild(chartText(api,doc,100,393,"黑色虚线：解析解 exp(−λt)；点：各步数值，连线不代表额外求解。",{"font-size":11}));
      return svg;
    }

    function rangeControl(api, doc, uid, label, min, max, step, value, onInput) {
      var id = uid + "-control-" + (++INSTANCE);
      var output = makeElement(api, doc, "output", { for: id }, [String(value)]);
      var head = makeElement(api, doc, "div", { className: "qode-control-head" }, [
        makeElement(api, doc, "span", {}, [label]), output
      ]);
      var input = makeElement(api, doc, "input", { id: id, type: "range", min: min, max: max, step: step, value: value, "aria-label": label });
      input.addEventListener("input", function () { onInput(Number(input.value)); });
      return {
        wrap: makeElement(api, doc, "div", { className: "qode-control" }, [head, input]),
        input: input,
        output: output
      };
    }

    function selectControl(api, doc, uid, label, options, value, onChange) {
      var id = uid + "-control-" + (++INSTANCE);
      var select = makeElement(api, doc, "select", { id: id, "aria-label": label });
      options.forEach(function (option) {
        select.appendChild(makeElement(api, doc, "option", { value: option.value }, [option.label]));
      });
      select.value = value;
      select.addEventListener("change", function () { onChange(select.value); });
      return {
        wrap: makeElement(api, doc, "div", { className: "qode-control" }, [
        makeElement(api, doc, "label", { htmlFor: id }, [label]), select
        ]),
        input: select
      };
    }

    function scrollRegion(api,doc,label,child,kind) {
      return makeElement(api,doc,"div",{className:kind||"qode-chart",role:"region",tabindex:0,"aria-label":label+"（可横向滚动）"},[child]);
    }
    function resultTable(api,doc,headers,rows) {
      return makeElement(api,doc,"table",{},[
        makeElement(api,doc,"thead",{},[makeElement(api,doc,"tr",{},headers.map(function(h){return makeElement(api,doc,"th",{scope:"col"},[h]);}))]),
        makeElement(api,doc,"tbody",{},rows.map(function(row){return makeElement(api,doc,"tr",{},row.map(function(v){return makeElement(api,doc,"td",{},[v]);}));}))
      ]);
    }
    function renderQuadratureResults(api,doc,root,section,data) {
      clear(section);
      section.appendChild(makeElement(api,doc,"h4",{},["求积结果：先比误差，再看求值成本"]));
      section.appendChild(makeElement(api,doc,"p",{className:"qode-note"},[data.formula+"；N="+data.n+"，h="+formatNumber(api,data.h,5)+"，容差="+data.tolerance]));
      section.appendChild(scrollRegion(api,doc,"函数与实际探针",drawQuadratureChart(api,doc,data)));
      section.appendChild(scrollRegion(api,doc,"求积误差",drawErrorChart(api,doc,data)));
      var names={trapezoid:"复合梯形",simpson:"复合 Simpson",adaptive:"普通自适应 Simpson",split:"已知支撑分段 Simpson"};
      var rows=Object.keys(data.values).map(function(k) {
        var result=k==="adaptive"?data.adaptive:k==="split"?data.split:null;
        return [names[k],formatNumber(api,data.values[k],10),formatNumber(api,data.errors[k],6),
          result?formatNumber(api,result.errorEstimate,5):"未使用估计器",
          String(result?result.evaluations:data.n+1),
          result?result.status:k==="simpson"?"N 为偶数；C⁴ 支撑 O(h⁴) 渐近阶":"C² 支撑 O(h²) 渐近阶"];
      });
      section.appendChild(scrollRegion(api,doc,"求积数值表",resultTable(api,doc,["方法","积分近似","绝对误差估算","算法内部误差估计","函数求值次数","停止理由 / 前提"],rows),"qode-ledger"));
      section.appendChild(makeElement(api,doc,"p",{className:"qode-callout qode-boundary"},[data.boundary]));
      section.appendChild(makeElement(api,doc,"p",{className:"qode-callout"},["高精度解析参考："+data.reference.text+"。离线以 100 位计算，按 65 位有效数字舍入显示（末尾零省略）。误差用高、低两段 binary64 参考估算，不是严格区间上界。函数求值与求和本身也有舍入误差。"]));
      section.appendChild(makeElement(api,doc,"p",{className:"qode-callout"},[data.split?"分段法预先知道支撑端点 77/128、79/128；普通算法没有这条信息。绘图也特意采样峰内部，不能把蓝线的细节算作算法已经看见的证据。":"蓝线的绘图网格与算法节点分开。换一个函数，应先检查尺度、光滑性，再做网格加密与独立误差诊断。"]));
    }
    function renderOdeResults(api,doc,section,data) {
      clear(section);
      section.appendChild(makeElement(api,doc,"h4",{},["ODE 结果：稳定、正性与精度分别检查"]));
      section.appendChild(makeElement(api,doc,"p",{className:"qode-note"},["λ="+data.lambda+"，T="+data.finalTime+"，N="+data.steps+"，h="+formatNumber(api,data.h,5)+"；解析终值 exp(−λT) 的浮点参考="+formatNumber(api,data.exact,10)]));
      section.appendChild(scrollRegion(api,doc,"ODE 轨迹",drawOdeChart(api,doc,data)));
      var rows=data.rows.map(function(row){return [row.label,formatNumber(api,row.factor,8),"O(h^"+row.localOrder+") / O(h^"+row.globalOrder+")",
        formatNumber(api,row.firstValue,8),formatNumber(api,row.endpoint,10),formatNumber(api,row.absoluteError,6),row.stability+"；理论有界区："+row.stabilityInterval];});
      section.appendChild(scrollRegion(api,doc,"ODE 数值表",resultTable(api,doc,["方法","单步 G(z)","局部 / 全局误差阶","第一步 y₁","终点 y_N ≈ y(T)","终点绝对误差估算","稳定性"],rows),"qode-ledger"));
      section.appendChild(makeElement(api,doc,"p",{className:"qode-callout qode-boundary"},[data.boundary+" |G|=1 只表示有界，不保证随步数衰减。稳定的负 G 仍会破坏正性。"]));
      section.appendChild(makeElement(api,doc,"p",{className:"qode-callout"},["这里直接计算浮点放大因子的 G^N，误差与 Math.exp 的浮点参考比较；显示零不证明真误差为零。小到超出 binary64 表示范围的轨迹点可能下溢为零。隐式 Euler 在此标量衰减问题中保持正性且稳定，但粗步长仍可造成很大的精度损失。一般非线性问题还要检查方程求解、尺度与结构。"]));
    }

    function mount(root, api) {
      var doc = root.ownerDocument;
      installStyles(doc);
      root.classList.add("qode-lab");
      var uid = "qode-" + (INSTANCE += 1);
      var state = {
        mode: "quadrature",
        functionId: "smooth",
        qN: 8,
        tolerance: 1e-9,
        lambda: 20,
        finalTime: 0.5,
        steps: 8,
        revealed: { quadrature: false, ode: false },
        prediction: { quadrature: {}, ode: {} }
      };
      var predictionSelects = { quadrature: {}, ode: {} };
      var modeButtons = {};
      var qPanel;
      var odePanel;
      var qResults;
      var odeResults;
      var feedback;
      var qFunctionControl;
      var qToleranceControl;
      var qRange;
      var lambdaRange;
      var timeRange;
      var stepRange;

      function announce(message) {
        if (api && typeof api.announce === "function") api.announce(root, message);
      }

      function lock(mode) {
        state.revealed[mode] = false;
        state.prediction[mode] = {};
        render();
      }

      function questionSelect(mode, question) {
        var id = uid + "-" + mode + "-" + question.key;
        var select = makeElement(api, doc, "select", { id: id, "aria-label": question.label });
        select.appendChild(makeElement(api, doc, "option", { value: "" }, ["请选择"]));
        question.options.forEach(function (option) {
          select.appendChild(makeElement(api, doc, "option", { value: option.value }, [option.label]));
        });
        select.addEventListener("change", function () {
          state.prediction[mode][question.key] = select.value;
          state.revealed[mode] = false;
          render();
        });
        predictionSelects[mode][question.key] = select;
        return makeElement(api, doc, "div", { className: "qode-question" }, [
          makeElement(api, doc, "label", { htmlFor: id }, [question.label]), select
        ]);
      }

      function predictionComplete(mode) {
        var questions = mode === "quadrature" ? QUADRATURE_QUESTIONS : ODE_QUESTIONS;
        return questions.every(function (question) { return state.prediction[mode][question.key]; });
      }

      function renderGate(mode) {
        submit.disabled = !predictionComplete(mode) || state.revealed[mode];
        var questions = mode === "quadrature" ? QUADRATURE_QUESTIONS : ODE_QUESTIONS;
        questions.forEach(function (question) {
          if (predictionSelects[mode][question.key]) predictionSelects[mode][question.key].value = state.prediction[mode][question.key] || "";
        });
        if (state.revealed[mode]) {
          var score = predictionScore(mode, state.prediction[mode]);
          feedback.className = "qode-feedback " + (score.correct === score.total ? "qode-pass" : "qode-warn");
          feedback.textContent = "预测得分 " + score.correct + "/" + score.total + "；现在对照逐项账本。";
        } else {
          feedback.className = "qode-feedback";
          feedback.textContent = predictionComplete(mode) ? "预测已记录，点击“提交预测并揭示”。" : "先完成当前模式的三项判断。";
        }
      }

      function render() {
        modeButtons.quadrature.setAttribute("aria-pressed", state.mode === "quadrature" ? "true" : "false");
        modeButtons.ode.setAttribute("aria-pressed", state.mode === "ode" ? "true" : "false");
        Object.keys(modeButtons).forEach(function(m) { modeButtons[m].setAttribute("aria-selected", String(state.mode === m)); modeButtons[m].tabIndex = state.mode === m ? 0 : -1; });
        qPanel.hidden = state.mode !== "quadrature";
        odePanel.hidden = state.mode !== "ode";
        qResults.hidden = !state.revealed.quadrature || state.mode !== "quadrature";
        odeResults.hidden = !state.revealed.ode || state.mode !== "ode";
        if (qFunctionControl) qFunctionControl.input.value = state.functionId;
        if (qToleranceControl) qToleranceControl.input.value = String(state.tolerance);
        if (qRange) {
          qRange.input.value = String(state.qN);
          qRange.output.textContent = String(state.qN);
        }
        if (lambdaRange) {
          lambdaRange.input.value = String(state.lambda);
          lambdaRange.output.textContent = String(state.lambda);
        }
        if (timeRange) {
          timeRange.input.value = String(state.finalTime);
          timeRange.output.textContent = formatNumber(api, state.finalTime, 2);
        }
        if (stepRange) {
          stepRange.input.value = String(state.steps);
          stepRange.output.textContent = String(state.steps);
        }
        renderGate(state.mode);
        if (state.revealed.quadrature && state.mode === "quadrature") {
          renderQuadratureResults(api, doc, root, qResults, quadratureExperiment(state.functionId, state.qN, state.tolerance));
        } else clear(qResults);
        if (state.revealed.ode && state.mode === "ode") {
          renderOdeResults(api, doc, odeResults, odeExperiment(state.lambda, state.finalTime, state.steps));
        } else clear(odeResults);
      }

      var shell = makeElement(api, doc, "div", { className: "qode-shell", "aria-labelledby": uid + "-title" });
      shell.appendChild(makeElement(api, doc, "h3", { id: uid + "-title" }, ["数值求积与 ODE 稳定性实验"]));
      shell.appendChild(makeElement(api, doc, "p", { className: "qode-intro" }, [
        "先作答，再对照积分误差、实际探针与 ODE 放大因子。估计器给出的容差状态不等于严格误差保证。"
      ]));
      var tabs = makeElement(api, doc, "div", { className: "qode-tabs", role: "tablist", "aria-label": "实验模式" });
      modeButtons.quadrature = makeElement(api, doc, "button", { type: "button", role: "tab", "aria-selected": "true", "aria-pressed": "true" }, ["数值求积"]);
      modeButtons.ode = makeElement(api, doc, "button", { type: "button", role: "tab", "aria-selected": "false", "aria-pressed": "false" }, ["ODE 稳定性"]);
      tabs.appendChild(modeButtons.quadrature);
      tabs.appendChild(modeButtons.ode);
      shell.appendChild(tabs);

      qPanel = makeElement(api, doc, "section", { className: "qode-panel", "aria-label": "求积参数" });
      var qControls = makeElement(api, doc, "div", { className: "qode-controls" });
      qFunctionControl = selectControl(api, doc, uid, "被积函数", QUADRATURE_PRESETS.map(function (preset) {
        return { value: preset.id, label: preset.label };
      }), state.functionId, function (value) { state.functionId = value; lock("quadrature"); });
      qControls.appendChild(qFunctionControl.wrap);
      qToleranceControl = selectControl(api, doc, uid, "自适应容差", [
        { value: "1e-6", label: "1e-6" }, { value: "1e-9", label: "1e-9" }, { value: "1e-12", label: "1e-12" }
      ], String(state.tolerance), function (value) { state.tolerance = Number(value); lock("quadrature"); });
      qControls.appendChild(qToleranceControl.wrap);
      qRange = rangeControl(api, doc, uid, "偶数子区间 N", 2, 256, 2, state.qN, function (value) {
        state.qN = Math.max(2, Math.min(256, 2 * Math.round(value / 2))); lock("quadrature");
      });
      qControls.appendChild(qRange.wrap);
      qPanel.appendChild(qControls);
      shell.appendChild(qPanel);

      odePanel = makeElement(api, doc, "section", { className: "qode-panel", "aria-label": "ODE 参数", hidden: true });
      var odeControls = makeElement(api, doc, "div", { className: "qode-controls" });
      lambdaRange = rangeControl(api, doc, uid, "lambda", 1, 40, 1, state.lambda, function (value) {
        state.lambda = Math.max(1, Math.min(40, Math.round(value))); lock("ode");
      });
      timeRange = rangeControl(api, doc, uid, "终点 T", 0.1, 1, 0.05, state.finalTime, function (value) {
        state.finalTime = Math.max(0.1, Math.min(1, value)); lock("ode");
      });
      stepRange = rangeControl(api, doc, uid, "步数 N", 1, 32, 1, state.steps, function (value) {
        state.steps = Math.max(1, Math.min(32, Math.round(value))); lock("ode");
      });
      odeControls.appendChild(lambdaRange.wrap);
      odeControls.appendChild(timeRange.wrap);
      odeControls.appendChild(stepRange.wrap);
      odePanel.appendChild(odeControls);
      shell.appendChild(odePanel);

      var gate = makeElement(api, doc, "section", { className: "qode-gate", "aria-labelledby": uid + "-gate-title" });
      gate.appendChild(makeElement(api, doc, "h4", { id: uid + "-gate-title" }, ["先预测，再揭示结果"]));
      var questionList = makeElement(api, doc, "div", { className: "qode-question-list" });
      QUADRATURE_QUESTIONS.forEach(function (question) { questionList.appendChild(questionSelect("quadrature", question)); });
      ODE_QUESTIONS.forEach(function (question) {
        var node = questionSelect("ode", question);
        node.hidden = true;
        questionList.appendChild(node);
      });
      gate.appendChild(questionList);
      var actions = makeElement(api, doc, "div", { className: "qode-actions" });
      var submit = makeElement(api, doc, "button", { type: "button", className: "qode-primary" }, ["提交预测并揭示"]);
      var reset = makeElement(api, doc, "button", { type: "button" }, ["重置"]);
      actions.appendChild(submit);
      actions.appendChild(reset);
      gate.appendChild(actions);
      feedback = makeElement(api, doc, "p", { className: "qode-feedback", "aria-live": "polite" }, ["先完成当前模式的三项判断。"]);
      gate.appendChild(feedback);
      shell.appendChild(gate);

      qResults = makeElement(api, doc, "section", { className: "qode-results", tabindex: -1, "aria-label": "求积结果", hidden: true });
      odeResults = makeElement(api, doc, "section", { className: "qode-results", tabindex: -1, "aria-label": "ODE 结果", hidden: true });
      shell.appendChild(qResults);
      shell.appendChild(odeResults);
      root.replaceChildren(shell);

      function setMode(mode) {
        state.mode = mode;
        state.revealed[mode] = false;
        state.prediction[mode] = {};
        var qQuestions = questionList.querySelectorAll(".qode-question");
        qQuestions.forEach(function (node, index) { node.hidden = mode === "quadrature" ? index >= QUADRATURE_QUESTIONS.length : index < QUADRATURE_QUESTIONS.length; });
        render();
      }
      Object.keys(modeButtons).forEach(function(mode) {
        var button=modeButtons[mode],panel=mode==="quadrature"?qPanel:odePanel;
        button.id=uid+"-tab-"+mode;
        button.setAttribute("aria-controls",uid+"-panel-"+mode);
        panel.id=uid+"-panel-"+mode;panel.setAttribute("role","tabpanel");panel.setAttribute("aria-labelledby",button.id);
        button.addEventListener("keydown",function(event){
          if(["ArrowLeft","ArrowRight","Home","End"].indexOf(event.key)<0)return;
          event.preventDefault();
          var next=event.key==="Home"?"quadrature":event.key==="End"?"ode":mode==="quadrature"?"ode":"quadrature";
          setMode(next);modeButtons[next].focus();
        });
      });
      modeButtons.quadrature.addEventListener("click", function () { setMode("quadrature"); });
      modeButtons.ode.addEventListener("click", function () { setMode("ode"); });
      submit.addEventListener("click", function () {
        if (!predictionComplete(state.mode)) {
          feedback.className = "qode-feedback qode-warn";
          feedback.textContent = "还缺判断；当前模式的三项都要填写。";
          announce(feedback.textContent);
          return;
        }
        state.revealed[state.mode] = true;
        render();
        (state.mode === "quadrature" ? qResults : odeResults).focus();
        announce("账本已揭示；现在可以逐项核对公式和边界。");
      });
      reset.addEventListener("click", function () {
        state.mode = "quadrature";
        state.functionId = "smooth";
        state.qN = 8;
        state.tolerance = 1e-9;
        state.lambda = 20;
        state.finalTime = 0.5;
        state.steps = 8;
        state.revealed = { quadrature: false, ode: false };
        state.prediction = { quadrature: {}, ode: {} };
        var qQuestions = questionList.querySelectorAll(".qode-question");
        qQuestions.forEach(function (node, index) { node.hidden = index >= QUADRATURE_QUESTIONS.length; });
        render();
        predictionSelects.quadrature.simpsonGrid.focus();
        announce("已重置预测和参数。");
      });
      render();
    }

    function selfTest() {
      var checks = 0;
      function assert(condition, message) {
        checks += 1;
        if (!condition) throw new Error(message);
      }
      function close(left, right, message, tolerance) {
        assert(near(left, right, tolerance || 1e-9), message + ": " + left + " vs " + right);
      }

      assert(QUADRATURE_PRESETS.length === 3, "three fixed quadrature presets");
      var smooth = findQuadraturePreset("smooth");
      var peak = findQuadraturePreset("peak");
      close(smooth.exact, Math.sin(1) + 1 / 3, "smooth analytic integral");
      close(peak.exact, (Math.atan(7) + Math.atan(13)) / 20, "peak analytic integral");
      close(compositeSimpson(function (x) { return 1 + x + x * x + x * x * x; }, 0, 1, 2), 25 / 12, "Simpson exact cubic identity");
      close(compositeTrapezoid(function (x) { return 1; }, 0, 1, 1), 1, "trapezoid endpoint N=1");
      var q2 = quadratureExperiment("smooth", 2, 1e-10);
      assert(q2.errors.simpson < q2.errors.trapezoid, "Simpson improves smooth N=2");
      var qp = quadratureExperiment("peak", 8, 1e-10);
      close(qp.adaptive.value, peak.exact, "adaptive peak reference", 1e-8);
      assert(qp.adaptive.evaluations >= 5, "adaptive has deterministic evaluations");
      assert(predictionAnswers("quadrature").simpsonGrid === "even", "quadrature prediction answer");
      var threw = false;
      try { compositeSimpson(smooth.f, 0, 1, 3); } catch (error) { threw = true; }
      assert(threw, "odd Simpson N rejected");
      threw = false;
      try { adaptiveSimpson(smooth.f, 0, 1, 0); } catch (error) { threw = true; }
      assert(threw, "zero 自适应容差 rejected");
      threw = false;
      try { quadratureExperiment("missing", 8); } catch (error) { threw = true; }
      assert(threw, "unknown preset rejected");

      var ode0 = odeExperiment(20, 0.5, 8);
      close(ode0.z, 1.25, "ODE default z");
      close(ode0.rows[0].factor, -0.25, "Euler amplification at overshoot case");
      assert(ode0.rows[0].signFlip && ode0.rows[0].stable, "Euler sign flip can be stable");
      close(ode0.rows[1].factor, 0.53125, "Heun amplification identity");
      close(ode0.rows[2].factor, 1 - 1.25 + 1.25 * 1.25 / 2 - Math.pow(1.25, 3) / 6 + Math.pow(1.25, 4) / 24, "RK4 Taylor factor");
      close(odeExperiment(3, 0.5, 1).rows[0].factor, -0.5, "Euler endpoint step");
      assert(!odeExperiment(5, 1, 1).rows[0].stable, "Euler outside stability at z=5");
      close(odeExperiment(2, 1, 1).rows[0].factor, -1, "Euler stability boundary factor");
      close(odeExperiment(2, 1, 1).exact, Math.exp(-2), "exact endpoint identity");
      assert(predictionAnswers("ode").overshoot === "negative-stable", "ODE prediction answer");
      threw = false;
      try { odeExperiment(0, 1, 1); } catch (error) { threw = true; }
      assert(threw, "nonpositive lambda rejected");
      threw = false;
      try { odeExperiment(1, 1, 0); } catch (error) { threw = true; }
      assert(threw, "zero ODE steps rejected");
      return { checks: checks, quadraturePresets: QUADRATURE_PRESETS.length, odeMethods: ODE_METHODS.length };
    }

    return {
      QUADRATURE_PRESETS: QUADRATURE_PRESETS,
      ODE_METHODS: ODE_METHODS,
      compositeTrapezoid: compositeTrapezoid,
      compositeSimpson: compositeSimpson,
      adaptiveSimpson: adaptiveSimpson,
      quadratureExperiment: quadratureExperiment,
      odeExperiment: odeExperiment,
      predictionAnswers: predictionAnswers,
      drawQuadratureChart: drawQuadratureChart,
      drawOdeChart: drawOdeChart,
      drawErrorChart: drawErrorChart,
      integralReferences: INTEGRAL_REFERENCES,
      mount: mount,
      selfTest: selfTest
    };
  }
));

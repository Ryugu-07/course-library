(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("linear-ode-resonance", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("linear-ode-resonance self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("linear-ode-resonance self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-linear-ode-resonance-styles";

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(a, b, tolerance) {
    return Math.abs(a - b) <= (tolerance || 1e-9);
  }

  function finiteRange(value,lo,hi,name){assert(typeof value==="number"&&Number.isFinite(value)&&value>=lo&&value<=hi,"invalid "+name);return value;}
  function rootClassification(zeta, omega0) {
    if(omega0===undefined)omega0=1;
    finiteRange(zeta,0,5,"zeta");finiteRange(omega0,.01,10,"omega0");
    if(zeta<1){var im=omega0*Math.sqrt((1-zeta)*(1+zeta));return{type:"underdamped",label:zeta===0?"无阻尼：纯虚根":"欠阻尼：共轭复根",roots:[{re:-zeta*omega0,im:im},{re:-zeta*omega0,im:-im}]};}
    if(zeta>1){var d=Math.sqrt((zeta-1)*(zeta+1));return{type:"overdamped",label:"过阻尼：两个负实根",roots:[{re:-omega0/(zeta+d),im:0},{re:-omega0*(zeta+d),im:0}]};}
    return{type:"critical",label:"临界阻尼：负重根",roots:[{re:-omega0,im:0},{re:-omega0,im:0}]};
  }
  function sinc(x){if(Math.abs(x)<1e-4){var q=x*x;return 1-q/6+q*q/120-q*q*q/5040;}return Math.sin(x)/x;}
  function validateResponse(omega0,omega,force,t){finiteRange(omega0,.01,10,"omega0");finiteRange(omega,0,20,"omega");finiteRange(force,-100,100,"force per mass");finiteRange(t,0,1000,"time");}
  function undampedResponse(omega0,omega,force,t){validateResponse(omega0,omega,force,t);return force*t/(omega0+omega)*Math.sin((omega0+omega)*t/2)*sinc((omega-omega0)*t/2);}
  function envelope(omega0,omega,force,t){validateResponse(omega0,omega,force,t);return Math.abs(force*t/(omega0+omega)*sinc((omega-omega0)*t/2));}
  function freeResponse(zeta,omega0,t){
    var roots=rootClassification(zeta,omega0);finiteRange(t,0,1000,"time");var tau=omega0*t;
    if(zeta<1){var b=Math.sqrt((1-zeta)*(1+zeta));return Math.exp(-zeta*tau)*(Math.cos(b*tau)+zeta*tau*sinc(b*tau));}
    if(zeta===1)return (1+tau)*Math.exp(-tau);
    var d=Math.sqrt((zeta-1)*(zeta+1)),q=d*tau;
    // exp(-zeta*tau)*sinh(q)/d evaluated without overflowing the separate hyperbolic factor.
    var slow=Math.exp(-tau/(zeta+d)),fast=Math.exp(-(zeta+d)*tau);
    var divided=q===0?0:slow*(-Math.expm1(-2*q))/(2*d);
    return (slow+fast)/2+zeta*divided;
  }
  function wronskian(omega0){return finiteRange(omega0,.01,10,"omega0");}
  function resonanceIdentity(omega0,force,t){validateResponse(omega0,omega0,force,t);var y=force*t*Math.sin(omega0*t)/(2*omega0),second=force*Math.cos(omega0*t)-force*omega0*t*Math.sin(omega0*t)/2;return second+omega0*omega0*y;}
  function trace(omega0,ratio,force,horizon,samples){
    finiteRange(ratio,.5,1.5,"ratio");finiteRange(horizon,.01,1000,"horizon");finiteRange(samples,2,20000,"samples");assert(Number.isInteger(samples),"samples integer");validateResponse(omega0,ratio*omega0,force,horizon);
    var points=[];for(var i=0;i<=samples;i++){var t=horizon*i/samples;points.push({t:t,y:undampedResponse(omega0,ratio*omega0,force,t),envelope:envelope(omega0,ratio*omega0,force,t)});}return points;
  }
  function classifyForcing(ratio){finiteRange(ratio,.5,1.5,"ratio");if(ratio===1)return "exact";if(ratio>=.92&&ratio<=1.08)return "near";return "off";}

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function format(value) {
    return value!==0&&Math.abs(value)<.001?value.toExponential(3):Number(value.toFixed(3)).toString();
  }

  function ensureStyles() {
    if (!host || !host.document || host.document.getElementById(STYLE_ID)) return;
    var style = host.document.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="linear-ode-resonance"]{--lor-accent:#315f9d;--lor-force:#b13d32;--lor-free:#347247;--lor-warn:#95670d;color:inherit}' +
      '[data-learning-lab="linear-ode-resonance"] .lor-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:end}' +
      '[data-learning-lab="linear-ode-resonance"] label{display:grid;gap:6px;font-weight:700}' +
      '[data-learning-lab="linear-ode-resonance"] select,[data-learning-lab="linear-ode-resonance"] input,[data-learning-lab="linear-ode-resonance"] button{min-height:44px;font:inherit}' +
      '[data-learning-lab="linear-ode-resonance"] button{border:1px solid currentColor;background:transparent;color:inherit;padding:8px 14px;cursor:pointer}' +
      '[data-learning-lab="linear-ode-resonance"] .lor-primary{background:var(--lor-accent);border-color:var(--lor-accent);color:white}' +
      '[data-learning-lab="linear-ode-resonance"] .lor-actions{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}' +
      '[data-learning-lab="linear-ode-resonance"] .lor-result[hidden]{display:none}' +
      '[data-learning-lab="linear-ode-resonance"] .lor-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;align-items:start}' +
      '[data-learning-lab="linear-ode-resonance"] svg{display:block;width:100%;min-width:700px;max-width:none;height:auto;border:1px solid color-mix(in srgb,currentColor 22%,transparent);background:var(--bg)}' +
      '[data-learning-lab="linear-ode-resonance"] .lor-table-wrap{overflow-x:auto;min-width:0;max-width:100%}' +
      '[data-learning-lab="linear-ode-resonance"] table{display:table;width:100%;min-width:600px;border-collapse:collapse}' +
      '[data-learning-lab="linear-ode-resonance"] th,[data-learning-lab="linear-ode-resonance"] td{padding:8px;border-bottom:1px solid color-mix(in srgb,currentColor 20%,transparent);text-align:left;vertical-align:top}' +
      '[data-learning-lab="linear-ode-resonance"] .lor-note{border-left:4px solid var(--lor-warn);padding-left:12px}' +
      '[data-learning-lab="linear-ode-resonance"] .lor-grid>*{min-width:0}[data-learning-lab="linear-ode-resonance"] select{min-width:0;width:100%;background:var(--bg);color:var(--fg)}[data-learning-lab="linear-ode-resonance"] .lor-visual{overflow-x:auto;min-width:0}[data-learning-lab="linear-ode-resonance"] svg text{fill:currentColor;font-family:inherit;font-size:12px}[data-learning-lab="linear-ode-resonance"] .lor-gridline{stroke:var(--border);stroke-width:1}[data-learning-lab="linear-ode-resonance"] :focus-visible{outline:3px solid var(--accent);outline-offset:2px}html[data-theme=dark] [data-learning-lab="linear-ode-resonance"]{--lor-accent:#90baff;--lor-force:#ffab95;--lor-free:#8edda0;--lor-warn:#e2b458}html[data-theme=dark] [data-learning-lab="linear-ode-resonance"] .lor-primary{color:#1b1d22}' +
      '@media(max-width:760px){[data-learning-lab="linear-ode-resonance"] .lor-controls,[data-learning-lab="linear-ode-resonance"] .lor-grid{grid-template-columns:minmax(0,1fr)}}';
    host.document.head.appendChild(style);
  }

  function renderSvg(points,horizon,zeta){
    var maxAbs=Math.max(.5,...points.map(p=>p.envelope));
    function graph(rows,key,top,extent,color,id){var d=rows.map((p,i)=>(i?"L":"M")+(65+570*p.t/horizon).toFixed(5)+" "+(top+100-90*p[key]/extent).toFixed(5)).join(" ");return '<path id="'+id+'" d="'+d+'" fill="none" stroke="'+color+'" stroke-width="2"/>';}
    function axes(top,extent){var out='';for(var i=0;i<=4;i++){var x=65+570*i/4;out+='<line x1="'+x+'" x2="'+x+'" y1="'+(top+10)+'" y2="'+(top+190)+'" class="lor-gridline"/><text x="'+x+'" y="'+(top+213)+'" text-anchor="middle">'+format(horizon*i/4)+'</text>';}for(var f of [-1,0,1]){var y=top+100-90*f;out+='<line x1="65" x2="635" y1="'+y+'" y2="'+y+'" class="lor-gridline"/><text x="57" y="'+(y+4)+'" text-anchor="end">'+format(f*extent)+'</text>';}return out;}
    var free=points.map(p=>({t:p.t,q:freeResponse(zeta,1,p.t)})),negative=points.map(p=>({t:p.t,envelope:-p.envelope}));
    return '<svg viewBox="0 0 720 580" role="img" aria-label="无阻尼受迫响应和独立阻尼自由响应，两个方程各自标注">'+
      '<text x="65" y="24">无阻尼受迫：y″+y=cos(rt)，y(0)=y′(0)=0</text><text x="65" y="43">蓝线：位移 y；红线：解析包络 ±A(t)；纵轴按包络缩放</text>'+axes(55,maxAbs)+graph(points,'envelope',55,maxAbs,'var(--lor-force)','lor-envelope-upper')+graph(negative,'envelope',55,maxAbs,'var(--lor-force)','lor-envelope-lower')+graph(points,'y',55,maxAbs,'var(--lor-accent)','lor-forced')+
      '<text x="660" y="268">t</text><text x="65" y="307">独立自由响应：q″+2ζq′+q=0，q(0)=1，q′(0)=0</text><text x="65" y="327">绿线随 ζ 改变；上图始终没有阻尼，不能把两者当成同一个解</text>'+axes(338,1)+graph(free,'q',338,1,'var(--lor-free)','lor-free')+'<text x="660" y="551">t</text></svg>';
  }

  function mount(root) {
    ensureStyles();
    root.innerHTML =
      '<div class="lor-controls">' +
      '<label>驱动频率比 r=ω/ω₀ <output data-role="ratio-output">0.98</output><input data-role="ratio" type="range" min="0.5" max="1.5" step="0.01" value="0.98"></label>' +
      '<label>观察终点 <output data-role="horizon-output">40</output><input data-role="horizon" type="range" min="10" max="80" step="2" value="40"></label>' +
      '<label>独立自由响应的阻尼比 ζ<select data-role="zeta"><option value="0.3">0.3 欠阻尼</option><option value="1">1 临界</option><option value="1.4">1.4 过阻尼</option></select></label>' +
      '</div>' +
      '<label>揭示前预测<select data-role="prediction"><option value="">请选择</option><option value="exact">精确共振</option><option value="near">近共振（0.92≤r≤1.08且r≠1）</option><option value="off">离共振有界响应</option></select></label>' +
      '<div class="lor-actions"><button class="lor-primary" type="button" data-role="reveal">揭示轨迹</button><button type="button" data-role="reset">重置</button></div>' +
      '<div class="lor-result" data-role="result" hidden aria-live="polite"></div>';

    var ratio = root.querySelector('[data-role="ratio"]');
    var horizon = root.querySelector('[data-role="horizon"]');
    var zeta = root.querySelector('[data-role="zeta"]');
    var prediction = root.querySelector('[data-role="prediction"]');
    var result = root.querySelector('[data-role="result"]');

    function render() {
      root.querySelector('[data-role="ratio-output"]').textContent = ratio.value;
      root.querySelector('[data-role="horizon-output"]').textContent = horizon.value;
      if (result.hidden) return;
      var r = Number(ratio.value);
      var h = Number(horizon.value);
      var points = trace(1,r,1,h,Math.ceil(Math.max(500,h*1.5*40/(2*Math.PI))));
      var maxAbs = Math.max.apply(null, points.map(function (point) { return Math.abs(point.y); }));
      var forcingClass = classifyForcing(r);
      var roots = rootClassification(Number(zeta.value), 1);
      var predictionText = prediction.value === forcingClass ? "预测命中" : "预测需修正";
      var boundary = forcingClass === "exact"
        ? "线性增长只属于无阻尼线性模型；任意正阻尼都会给有限稳态幅值。"
        : forcingClass === "near"
          ? "当前是有限观察窗中的慢拍频，不是精确共振。"
          : "有界结论针对当前无阻尼、固定余弦驱动 的解析模型。";
      result.innerHTML =
        '<div class="lor-grid"><div class="lor-visual" tabindex="0" role="region" aria-label="可横向滚动的两方程轨迹">' + renderSvg(points, h, Number(zeta.value)) + '</div><div>' +
        '<h4>' + predictionText + '</h4><div class="lor-table-wrap" tabindex="0" role="region" aria-label="可横向滚动的模型账本"><table><tbody>' +
        '<tr><th>无阻尼驱动分类</th><td>' + escapeHtml({exact:"精确共振",near:"近共振（约定窗口）",off:"离共振"}[forcingClass]) + '</td></tr>' +
        '<tr><th>当前采样最大 |y|</th><td>' + format(maxAbs) + '</td></tr>' +
        '<tr><th>下图自由方程的根</th><td>' + escapeHtml(roots.label) + '</td></tr>' +
        '<tr><th>上图齐次基的 Wronskian</th><td>W(cos t,sin t)=1</td></tr>' +
        '<tr><th>上图初值</th><td>y(0)=y&#39;(0)=0</td></tr>' +
        '</tbody></table></div><p class="lor-note">' + escapeHtml(boundary) + '</p></div></div>';
    }

    root.querySelector('[data-role="reveal"]').addEventListener("click", function () {
      if (!prediction.value) {
        prediction.focus();
        return;
      }
      result.hidden = false;
      render();
      result.querySelector(".lor-visual").focus();
    });
    root.querySelector('[data-role="reset"]').addEventListener("click", function () {
      ratio.value = "0.98";
      horizon.value = "40";
      zeta.value = "0.3";
      prediction.value = "";
      result.hidden = true;
      result.innerHTML = "";
      render();
      prediction.focus();
    });
    [ratio, horizon, zeta].forEach(function (control) {
      function changed(){result.hidden=true;prediction.value="";render();}
      control.addEventListener("input",changed);
      control.addEventListener("change",changed);
    });
    prediction.addEventListener("change",function(){result.hidden=true;});
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }
    check(rootClassification(0.2, 1).type === "underdamped", "underdamped roots");
    check(rootClassification(1, 1).type === "critical", "critical roots");
    check(rootClassification(2, 1).type === "overdamped", "overdamped roots");
    check(near(wronskian(2), 2), "Wronskian certificate");
    check(near(undampedResponse(1, 0.7, 1, 0), 0), "zero displacement initial condition");
    check(near(resonanceIdentity(2, 3, 0.4), 3 * Math.cos(0.8), 1e-9), "resonant equation identity");
    check(classifyForcing(1) === "exact", "exact resonance class");
    check(classifyForcing(0.96) === "near", "near resonance class");
    check(classifyForcing(0.7) === "off", "off resonance class");
    var t = 1.3;
    check(near(undampedResponse(1, 1 + 1e-6, 1, t), undampedResponse(1, 1, 1, t), 2e-6), "nonresonant limit approaches resonant response");
    check(trace(1, 1, 1, 10, 100).length === 101, "trace includes endpoints");
    return { checks: checks };
  }

  return {
    rootClassification: rootClassification,
    freeResponse:freeResponse,envelope:envelope,renderSvg:renderSvg,sinc:sinc,
    undampedResponse: undampedResponse,
    wronskian: wronskian,
    resonanceIdentity: resonanceIdentity,
    trace: trace,
    classifyForcing: classifyForcing,
    mount: mount,
    selfTest: selfTest
  };
});

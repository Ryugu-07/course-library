(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("special-function-boundaries", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("special-function-boundaries self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("special-function-boundaries self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var STYLE_ID = "cl-special-function-boundaries-styles";

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function near(a, b, tolerance) {
    return Math.abs(a - b) <= (tolerance || 1e-9);
  }

  function finiteRange(x, lo, hi, label) {
    if (typeof x !== "number" || !Number.isFinite(x) || x < lo || x > hi) throw new RangeError(label + " out of range");
  }
  function integerRange(x,lo,hi,label) {finiteRange(x,lo,hi,label);if(!Number.isInteger(x))throw new RangeError(label+" must be an integer");}
  // Bessel integral, sampled by the periodic midpoint rule; bounded teaching range |x|<=20.
  // This avoids alternating power-series cancellation at the larger plotted roots.
  function besselIntegral(x, derivative) {
    finiteRange(x,-20,20,"Bessel x");
    var sum=0;
    for(var j=0;j<128;j+=1){var t=Math.PI*(j+.5)/128,s=Math.sin(t);sum+=derivative?s*Math.sin(x*s):Math.cos(x*s);}
    return sum/128;
  }
  function besselJ0(x) { return besselIntegral(x,false); }
  function besselJ1(x) { return besselIntegral(x,true); }

  function bisectRoot(fn, left, right) {
    var fLeft = fn(left);
    var fRight = fn(right);
    if (fLeft === 0) return left;
    if (fLeft * fRight > 0) throw new Error("root is not bracketed");
    for (var i = 0; i < 80; i += 1) {
      var middle = (left + right) / 2;
      var fMiddle = fn(middle);
      if (Math.abs(fMiddle) < 1e-14) return middle;
      if (fLeft * fMiddle <= 0) {
        right = middle;
        fRight = fMiddle;
      } else {
        left = middle;
        fLeft = fMiddle;
      }
    }
    return (left + right) / 2;
  }

  var ROOT_CACHE = {};
  function besselRoots(count, boundary) {
    integerRange(count,0,6,"root count");
    if(boundary!=="dirichlet"&&boundary!=="neumann")throw new RangeError("unknown boundary");
    var key=boundary+count;if(ROOT_CACHE[key])return ROOT_CACHE[key].slice();
    var fn=boundary==="neumann"?besselJ1:besselJ0,roots=[],left=.01,fLeft=fn(left);
    for(var i=1;i<=400&&roots.length<count;i+=1){var right=i*.05,fRight=fn(right);if(fLeft*fRight<0)roots.push(bisectRoot(fn,left,right));left=right;fLeft=fRight;}
    if(roots.length!==count)throw new Error("requested roots exceed bounded scan");
    ROOT_CACHE[key]=roots;return roots.slice();
  }
  function besselJ0Roots(count) {return besselRoots(count,"dirichlet");}

  function legendreP(degree, x) {
    integerRange(degree,0,20,"Legendre degree");finiteRange(x,-1,1,"Legendre x");
    if (degree === 0) return 1;
    if (degree === 1) return x;
    var previous = 1;
    var current = x;
    for (var n = 1; n < degree; n += 1) {
      var next = ((2 * n + 1) * x * current - n * previous) / (n + 1);
      previous = current;
      current = next;
    }
    return current;
  }

  function legendreInnerProduct(a, b, panels) {
    var n = panels === undefined ? 2000 : panels;
    integerRange(n,2,20000,"Simpson panels");
    if (n % 2) n += 1;
    var h = 2 / n;
    var sum = 0;
    for (var i = 0; i <= n; i += 1) {
      var x = -1 + i * h;
      var weight = i === 0 || i === n ? 1 : i % 2 ? 4 : 2;
      sum += weight * legendreP(a, x) * legendreP(b, x);
    }
    return sum * h / 3;
  }

  function greenValue(x, source, length) {
    if(!Number.isFinite(length)||length<=0)throw new RangeError("length must be positive");
    finiteRange(x,0,length,"x");finiteRange(source,0,length,"source");
    if(source===0||source===length)throw new RangeError("point source must be interior");
    return x <= source
      ? x * (length - source) / length
      : source * (length - x) / length;
  }

  function greenCertificate(source, length) {
    var leftSlope = (length - source) / length;
    var rightSlope = -source / length;
    return {
      leftBoundary: greenValue(0, source, length),
      rightBoundary: greenValue(length, source, length),
      continuityValue: greenValue(source, source, length),
      leftSlope: leftSlope,
      rightSlope: rightSlope,
      derivativeJump: rightSlope - leftSlope
    };
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function format(value) {
    if(value!==0&&Math.abs(value)<1e-4)return value.toExponential(2);
    return (Math.round(value * 100000) / 100000).toString();
  }

  function ensureStyles() {
    if (!host || !host.document || host.document.getElementById(STYLE_ID)) return;
    var style = host.document.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="special-function-boundaries"]{--sfb-accent:var(--cl-blue,#0369a1);--sfb-root:var(--cl-red,#be123c);--sfb-warn:var(--cl-gold,#a16207);color:inherit;min-width:0;max-width:100%}' +
      '[data-learning-lab="special-function-boundaries"] .sfb-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:end}' +
      '[data-learning-lab="special-function-boundaries"] label{display:grid;gap:6px;font-weight:700}' +
      '[data-learning-lab="special-function-boundaries"] select,[data-learning-lab="special-function-boundaries"] input,[data-learning-lab="special-function-boundaries"] button{min-height:44px;font:inherit}' +
      '[data-learning-lab="special-function-boundaries"] button{border:1px solid currentColor;background:transparent;color:inherit;padding:8px 14px;cursor:pointer}' +
      '[data-learning-lab="special-function-boundaries"] .sfb-primary{background:var(--sfb-accent);border-color:var(--sfb-accent);color:white}' +
      '[data-learning-lab="special-function-boundaries"] .sfb-actions{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}' +
      '[data-learning-lab="special-function-boundaries"] .sfb-result[hidden]{display:none}' +
      '[data-learning-lab="special-function-boundaries"] .sfb-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;align-items:start}' +
      '[data-learning-lab="special-function-boundaries"] svg{display:block;width:100%;min-width:620px;height:auto;border:1px solid color-mix(in srgb,currentColor 22%,transparent);background:var(--bg,#fff);color:var(--fg,#24313a)}' +
      '[data-learning-lab="special-function-boundaries"] .sfb-table-wrap{overflow-x:auto}' +
      '[data-learning-lab="special-function-boundaries"] table{width:100%;border-collapse:collapse}' +
      '[data-learning-lab="special-function-boundaries"] th,[data-learning-lab="special-function-boundaries"] td{padding:8px;border-bottom:1px solid color-mix(in srgb,currentColor 20%,transparent);text-align:left;vertical-align:top}' +
      '[data-learning-lab="special-function-boundaries"] .sfb-note{border-left:4px solid var(--sfb-warn);padding-left:12px}' +
      '[data-learning-lab="special-function-boundaries"] .sfb-frame{overflow-x:auto;min-width:0}[data-learning-lab="special-function-boundaries"] svg text{fill:currentColor;font:13px system-ui}[data-learning-lab="special-function-boundaries"] [tabindex]:focus-visible{outline:3px solid var(--cl-focus,#1769aa)}[data-learning-lab="special-function-boundaries"] select{background:var(--bg,#fff);color:var(--fg,#24313a);min-width:0;max-width:100%}' +
      '@media(max-width:760px){[data-learning-lab="special-function-boundaries"] .sfb-controls,[data-learning-lab="special-function-boundaries"] .sfb-grid{grid-template-columns:1fr}}';
    host.document.head.appendChild(style);
  }

  function graphPath(values, xMin, xMax, yMin, yMax) {
    return values.map(function (point, index) {
      var x = 48 + 526 * (point.x - xMin) / (xMax - xMin);
      var y = 274 - 224 * (point.y - yMin) / (yMax - yMin);
      return (index ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2);
    }).join(" ");
  }

  function axes(xMin,xMax,yMin,yMax,xLabel) {
    var out="",Y=v=>274-224*(v-yMin)/(yMax-yMin),X=v=>48+526*(v-xMin)/(xMax-xMin);
    out+='<line x1="48" y1="'+Y(0)+'" x2="574" y2="'+Y(0)+'" stroke="currentColor"/>';
    out+='<line x1="'+X(0)+'" y1="50" x2="'+X(0)+'" y2="274" stroke="currentColor"/>';
    for(var i=0;i<=4;i++){var x=xMin+(xMax-xMin)*i/4;out+='<text x="'+X(x)+'" y="298" text-anchor="middle">'+format(x)+'</text>';}
    Array.from(new Set([yMin,0,yMax])).forEach(v=>{out+='<text x="41" y="'+(Y(v)+4)+'" text-anchor="end">'+format(v)+'</text>';});
    return out+'<text x="574" y="320" text-anchor="end">'+xLabel+'</text>';
  }
  function renderBessel(index,boundary,radius) {
    var roots=besselRoots(4,boundary),selected=index===0?0:roots[index-1],fn=boundary==="neumann"?besselJ1:besselJ0,values=[];
    for(var i=0;i<=300;i++){var x=15*i/300;values.push({x:x,y:fn(x)});}
    var rootX=48+526*selected/15,neumann=boundary==="neumann";
    return {svg:'<svg viewBox="0 0 620 350" role="img" aria-label="Bessel 边界函数与所选零点">'+axes(0,15,-.5,1.1,'z=kR')+'<path d="'+graphPath(values,0,15,-.5,1.1)+'" fill="none" stroke="var(--sfb-accent)" stroke-width="3"/>'+'<line x1="'+rootX+'" x2="'+rootX+'" y1="50" y2="274" stroke="var(--sfb-root)" stroke-dasharray="6 5"/>'+'<text x="55" y="25">'+(neumann?'Neumann：J₁(z)=−J₀′(z)':'Dirichlet：J₀(z)')+'；第 '+index+' 模</text><text x="55" y="338">竖线处满足边界；零点决定 ω/c=z/R，曲线本身是边界函数。</text></svg>',
    rows:[["无量纲 kR",format(selected)],["R",format(radius)],["ω/c=k",format(selected/radius)],[neumann?"边界残差 J₀′(kR)":"边界残差 J₀(kR)",format(neumann?-fn(selected):fn(selected))],["零模",neumann?"k=0、常数位移，已单独列为第0模":"常数不能满足固定边缘；无零模"]],
    note:"Bessel 积分用128点求积，正根由扫描与二分求得；限定 |z|≤20，不把该近似推广到任意大参数。Neumann 是规定法向导数为零的理想边界。"};
  }
  function renderLegendre(degree,compare) {
    var values=[];for(var i=0;i<=240;i++){var x=-1+2*i/240;values.push({x:x,y:legendreP(degree,x)});}
    var numeric=legendreInnerProduct(degree,compare,2000),exact=degree===compare?2/(2*degree+1):0;
    return {svg:'<svg viewBox="0 0 620 350" role="img" aria-label="Legendre 多项式在权重1下的正交性">'+axes(-1,1,-1.1,1.1,'x=cos θ')+'<path d="'+graphPath(values,-1,1,-1.1,1.1)+'" fill="none" stroke="var(--sfb-accent)" stroke-width="3"/><text x="55" y="25">P'+degree+'(x)，对照 P'+compare+'；区间 [-1,1]、权重 1</text><text x="55" y="338">也测试相同奇偶性的不同次数；不能只用奇函数积分为零来验收。</text></svg>',
    rows:[["次数 ℓ / 对照 j",degree+" / "+compare],["Pℓ(1)",format(legendreP(degree,1))],["2000格 Simpson 内积",format(numeric)],["精确内积",format(exact)],["绝对差",format(Math.abs(numeric-exact))]],note:"ℓ≠j 时内积为0；ℓ=j 时为2/(2ℓ+1)，未经归一化不能写成1。数值积分误差与解析正交关系分开。"};
  }
  function renderGreen(fraction,length) {
    var source=fraction*length,cert=greenCertificate(source,length);
    var values=[{x:0,y:0},{x:source,y:cert.continuityValue},{x:length,y:0}];
    var sourceX=48+526*fraction;
    return {svg:'<svg viewBox="0 0 620 350" role="img" aria-label="Dirichlet Green 函数的连续性与负导数跳跃">'+axes(0,length,0,.3*length,'x')+'<path d="'+graphPath(values,0,length,0,.3*length)+'" fill="none" stroke="var(--sfb-accent)" stroke-width="3"/><line x1="'+sourceX+'" x2="'+sourceX+'" y1="50" y2="274" stroke="var(--sfb-root)" stroke-dasharray="6 5"/><text x="55" y="25">−G″=δ(x−ξ)，ξ='+format(source)+'，L='+format(length)+'</text><text x="55" y="338">G 在 ξ 连续，一阶导数跳跃 −1；竖线是源位置，不是函数发散。</text></svg>',
    rows:[["G(0,ξ)",format(cert.leftBoundary)],["G(L,ξ)",format(cert.rightBoundary)],["G(ξ,ξ)",format(cert.continuityValue)],["左 / 右导数",format(cert.leftSlope)+" / "+format(cert.rightSlope)],["导数跳跃",format(cert.derivativeJump)]],note:"源在开区间内；G量纲为长度、导数跳跃无量纲。两端固定给唯一逆，Neumann零模问题另见正文。"};
  }

  function mount(root) {
    ensureStyles();
    root.innerHTML =
      '<div class="sfb-controls">' +
      '<label>边界问题<select data-role="mode"><option value="bessel">圆膜 Bessel</option><option value="legendre">球面 Legendre</option><option value="green">一维 Green</option></select></label>' +
      '<label>阶/根编号 <output data-role="index-output">1</output><input data-role="index" type="range" min="1" max="4" step="1" value="1"></label>' +
      '<label>点源位置 ξ/L <output data-role="source-output">0.4</output><input data-role="source" type="range" min="0.1" max="0.9" step="0.05" value="0.4"></label>' +
      '<label>径向边界<select data-role="boundary"><option value="dirichlet">Dirichlet：位移为零</option><option value="neumann">Neumann：法向导数为零</option></select></label>' +
      '<label>长度尺度 R / L <output data-role="length-output">1</output><input data-role="length" type="range" min="0.5" max="2" step="0.1" value="1"></label>'+
      '<label>Legendre 对照次数 <output data-role="compare-output">3</output><input data-role="compare" type="range" min="0" max="6" step="1" value="3"></label>'+
      '</div>' +
      '<label>揭示前预测<select data-role="prediction"><option value="">请选择</option><option value="zero-boundary">边界残差为零</option><option value="orthogonal">指定权重下正交/同次有范数</option><option value="negative-jump">导数跳跃为 -1</option></select></label>' +
      '<div class="sfb-actions"><button class="sfb-primary" type="button" data-role="reveal">揭示边界证书</button><button type="button" data-role="reset">重置</button></div>' +
      '<div class="sfb-result" data-role="result" hidden aria-live="polite"></div>';

    var mode = root.querySelector('[data-role="mode"]');
    var index = root.querySelector('[data-role="index"]');
    var source = root.querySelector('[data-role="source"]');
    var boundary=root.querySelector('[data-role="boundary"]'),length=root.querySelector('[data-role="length"]'),compare=root.querySelector('[data-role="compare"]');
    var prediction = root.querySelector('[data-role="prediction"]');
    var result = root.querySelector('[data-role="result"]');

    function expected() {
      return mode.value === "bessel" ? "zero-boundary" : mode.value === "legendre" ? "orthogonal" : "negative-jump";
    }

    function render() {
      index.min=mode.value==="bessel"&&boundary.value==="dirichlet"?"1":"0";
      index.max=mode.value==="legendre"?"6":"4";
      if(Number(index.value)<Number(index.min))index.value=index.min;
      root.querySelector('[data-role="index-output"]').textContent = index.value;
      root.querySelector('[data-role="length-output"]').textContent=length.value;
      root.querySelector('[data-role="compare-output"]').textContent=compare.value;
      boundary.disabled=mode.value!=="bessel";compare.disabled=mode.value!=="legendre";length.disabled=mode.value==="legendre";
      root.querySelector('[data-role="source-output"]').textContent = source.value;
      index.disabled = mode.value === "green";
      source.disabled = mode.value !== "green";
      if (result.hidden) return;
      var entry = mode.value === "bessel"
        ? renderBessel(Number(index.value),boundary.value,Number(length.value))
        : mode.value === "legendre"
          ? renderLegendre(Number(index.value),Number(compare.value))
          : renderGreen(Number(source.value),Number(length.value));
      var predictionText = prediction.value === expected() ? "预测命中" : "预测需修正";
      result.innerHTML =
        '<div class="sfb-grid"><div class="sfb-frame" tabindex="0" role="region" aria-label="边界函数图，可横向滚动">' + entry.svg + '</div><div><h4>' + predictionText + '</h4>' +
        '<div class="sfb-table-wrap" tabindex="0" role="region" aria-label="边界账本，可横向滚动"><table><tbody>' +
        entry.rows.map(function (row) {
          return '<tr><th>' + escapeHtml(row[0]) + '</th><td>' + escapeHtml(row[1]) + '</td></tr>';
        }).join("") +
        '</tbody></table></div><p class="sfb-note">' + escapeHtml(entry.note) + '</p></div></div>';
    }

    root.querySelector('[data-role="reveal"]').addEventListener("click", function () {
      if (!prediction.value) {
        prediction.focus();
        return;
      }
      result.hidden = false;
      render();
    });
    root.querySelector('[data-role="reset"]').addEventListener("click", function () {
      boundary.value="dirichlet";length.value="1";compare.value="3";
      mode.value = "bessel";
      index.value = "1";
      source.value = "0.4";
      prediction.value = "";
      result.hidden = true;
      result.innerHTML = "";
      render();
    });
    [mode, index, source, boundary, length, compare, prediction].forEach(function (control) {
      control.addEventListener("input", function(){result.hidden=true;render();});
      control.addEventListener("change", function(){result.hidden=true;render();});
    });
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }
    check(near(besselJ0(0), 1), "J0 at zero");
    var roots = besselJ0Roots(3);
    check(roots.length === 3, "three J0 roots found");
    check(near(roots[0], 2.4048255577, 1e-8), "first J0 root");
    check(Math.abs(besselJ0(roots[2])) < 1e-10, "third root residual");
    check(near(legendreP(2, 0), -0.5), "P2 at zero");
    check(near(legendreP(4, 1), 1), "Legendre endpoint");
    check(Math.abs(legendreInnerProduct(2, 3, 2000)) < 1e-10, "Legendre orthogonality");
    check(near(legendreInnerProduct(2, 2, 2000), 2 / 5, 1e-10), "Legendre norm");
    var cert = greenCertificate(0.4, 1);
    check(cert.leftBoundary === 0 && cert.rightBoundary === 0, "Green boundary values");
    check(near(cert.derivativeJump, -1), "Green derivative jump sign");
    check(near(greenValue(0.4, 0.4, 1), 0.24), "Green continuity value");
    return { checks: checks };
  }

  return {
    besselJ0: besselJ0,
    besselJ1: besselJ1,
    besselRoots: besselRoots,
    besselJ0Roots: besselJ0Roots,
    legendreP: legendreP,
    legendreInnerProduct: legendreInnerProduct,
    greenValue: greenValue,
    greenCertificate: greenCertificate,
    mount: mount,
    selfTest: selfTest
  };
});

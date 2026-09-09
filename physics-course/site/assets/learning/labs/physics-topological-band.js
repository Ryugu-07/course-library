(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("physics-topological-band", exported.mount);
  }
  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("physics-topological-band self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("physics-topological-band self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined"
    ? window
    : typeof globalThis !== "undefined"
      ? globalThis
      : null,
  function (host) {
    "use strict";

    var LAB_ID = "physics-topological-band";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "physics-topological-band-styles";
    var TWO_PI = 2 * Math.PI;
    var PI = Math.PI;

    var NEAR_GAP = 0.1;
    var DEFAULTS = { mass: -1, ky: 0 };
    var PRESETS = [
      { id: "chern-plus", label: "C=+1 区间", mass: -1, ky: 0 },
      { id: "chern-minus", label: "C=-1 区间", mass: 1, ky: 0 },
      { id: "trivial", label: "平庸区间", mass: 2.6, ky: 0 },
      { id: "critical", label: "gap 闭合", mass: 0, ky: 0 }
    ];
    var COLORS = { blue: "#315f9d", orange: "#a36a16", green: "#39734d", red: "#b64335", gold: "#8b6517", gray: "#7b8794" };
    var STYLE_TEXT = [
      '[data-learning-lab="physics-topological-band"]{--ptb-blue:#315f9d;--ptb-orange:#a36a16;--ptb-green:#39734d;--ptb-red:#b64335;--ptb-gold:#8b6517;display:block;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="physics-topological-band"] *{box-sizing:border-box}[data-learning-lab="physics-topological-band"] [hidden]{display:none!important}',
      '[data-learning-lab="physics-topological-band"] h3,[data-learning-lab="physics-topological-band"] h4{margin:0;letter-spacing:0}[data-learning-lab="physics-topological-band"] h3{font-size:1.18rem}[data-learning-lab="physics-topological-band"] h4{font-size:1rem;margin-top:14px}',
      '[data-learning-lab="physics-topological-band"] p{margin:8px 0}[data-learning-lab="physics-topological-band"] .ptb-muted,[data-learning-lab="physics-topological-band"] .ptb-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="physics-topological-band"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="physics-topological-band"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
      '[data-learning-lab="physics-topological-band"] .ptb-prediction-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}[data-learning-lab="physics-topological-band"] .ptb-prediction{display:grid;gap:5px;min-width:0}[data-learning-lab="physics-topological-band"] .ptb-prediction label{font-size:12.5px;font-weight:700}',
      '[data-learning-lab="physics-topological-band"] button,[data-learning-lab="physics-topological-band"] select,[data-learning-lab="physics-topological-band"] input{font:inherit;letter-spacing:0}',
      '[data-learning-lab="physics-topological-band"] button,[data-learning-lab="physics-topological-band"] select{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}',
      '[data-learning-lab="physics-topological-band"] button:hover{border-color:var(--ptb-blue)}[data-learning-lab="physics-topological-band"] button:focus-visible,[data-learning-lab="physics-topological-band"] select:focus-visible,[data-learning-lab="physics-topological-band"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}',
      '[data-learning-lab="physics-topological-band"] .ptb-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="physics-topological-band"] .ptb-actions>*{flex:1 1 170px}[data-learning-lab="physics-topological-band"] .ptb-primary{border-color:var(--ptb-blue);background:var(--ptb-blue);color:#fff;font-weight:750}[data-learning-lab="physics-topological-band"] .ptb-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="physics-topological-band"] .ptb-warn{color:var(--ptb-red)}',
      '[data-learning-lab="physics-topological-band"] .ptb-layout{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;align-items:start;min-width:0}[data-learning-lab="physics-topological-band"] .ptb-controls,[data-learning-lab="physics-topological-band"] .ptb-stage{min-width:0}[data-learning-lab="physics-topological-band"] .ptb-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="physics-topological-band"] .ptb-control{display:grid;gap:5px;min-width:0}[data-learning-lab="physics-topological-band"] .ptb-control label{display:flex;flex-wrap:wrap;justify-content:space-between;gap:5px;color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}[data-learning-lab="physics-topological-band"] output{color:var(--ptb-blue);font-variant-numeric:tabular-nums}',
      '[data-learning-lab="physics-topological-band"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--ptb-blue)}[data-learning-lab="physics-topological-band"] .ptb-stage-frame{min-width:0;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent);overflow-x:auto;overflow-y:hidden}[data-learning-lab="physics-topological-band"] svg{display:block;width:100%;min-width:820px;height:auto;max-width:none;color:var(--fg,currentColor)}[data-learning-lab="physics-topological-band"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="physics-topological-band"] .ptb-grid{stroke:var(--border,#cbd5e1);stroke-width:1;stroke-opacity:.7}[data-learning-lab="physics-topological-band"] .ptb-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.75}[data-learning-lab="physics-topological-band"] .ptb-edge{fill:none;stroke:var(--ptb-red);stroke-width:2.6}[data-learning-lab="physics-topological-band"] .ptb-edge-alt{fill:none;stroke:var(--ptb-orange);stroke-width:2.6}[data-learning-lab="physics-topological-band"] .ptb-gap{fill:var(--ptb-blue);opacity:.08}[data-learning-lab="physics-topological-band"] .ptb-selected{stroke:var(--ptb-gold);stroke-width:1.5;stroke-dasharray:5 4}[data-learning-lab="physics-topological-band"] .ptb-current{fill:var(--ptb-gold);stroke:var(--bg,#fff);stroke-width:1.2}',
      '[data-learning-lab="physics-topological-band"] .ptb-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="physics-topological-band"] .ptb-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#cbd5e1);background:var(--bg,transparent)}[data-learning-lab="physics-topological-band"] .ptb-metric:nth-child(4n+1){border-color:var(--ptb-blue)}[data-learning-lab="physics-topological-band"] .ptb-metric:nth-child(4n+2){border-color:var(--ptb-orange)}[data-learning-lab="physics-topological-band"] .ptb-metric:nth-child(4n+3){border-color:var(--ptb-green)}[data-learning-lab="physics-topological-band"] .ptb-metric:nth-child(4n){border-color:var(--ptb-red)}[data-learning-lab="physics-topological-band"] .ptb-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11.5px}[data-learning-lab="physics-topological-band"] .ptb-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
      '[data-learning-lab="physics-topological-band"] .ptb-ledger{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="physics-topological-band"] table{width:100%;min-width:600px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="physics-topological-band"] th,[data-learning-lab="physics-topological-band"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="physics-topological-band"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="physics-topological-band"] .ptb-legend{display:flex;flex-wrap:wrap;gap:7px 14px;margin:8px 0 0;color:var(--fg-soft,currentColor);font-size:12px}[data-learning-lab="physics-topological-band"] .ptb-key{display:inline-flex;align-items:center;gap:5px}[data-learning-lab="physics-topological-band"] .ptb-swatch{display:inline-block;width:18px;height:3px;background:var(--ptb-red)}[data-learning-lab="physics-topological-band"] .ptb-swatch[data-kind="edge-alt"]{background:var(--ptb-orange)}[data-learning-lab="physics-topological-band"] .ptb-swatch[data-kind="curvature"]{width:10px;height:10px;border-radius:2px;background:var(--ptb-blue)}[data-learning-lab="physics-topological-band"] .ptb-note{margin-top:11px;padding:10px 12px;border-left:3px solid var(--ptb-gold);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="physics-topological-band"] .ptb-preset-row{display:flex;flex-wrap:wrap;gap:7px}[data-learning-lab="physics-topological-band"] .ptb-preset-row button{flex:1 1 105px;font-size:12.5px}[data-learning-lab="physics-topological-band"] .ptb-preset-row button[aria-pressed="true"]{border-color:var(--ptb-blue);background:var(--ptb-blue);color:#fff;font-weight:750}',
      '@media(max-width:900px){[data-learning-lab="physics-topological-band"] .ptb-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:680px){[data-learning-lab="physics-topological-band"] .ptb-prediction-grid{grid-template-columns:1fr}[data-learning-lab="physics-topological-band"] .ptb-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="physics-topological-band"] .ptb-stage-frame svg{min-width:820px}}@media(max-width:430px){[data-learning-lab="physics-topological-band"] .ptb-metrics{grid-template-columns:1fr}[data-learning-lab="physics-topological-band"] .ptb-stage-frame{padding:4px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="physics-topological-band"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
      ,'[data-theme="dark"] [data-learning-lab="physics-topological-band"]{--ptb-blue:#85b9ef;--ptb-orange:#e6be68;--ptb-green:#83c69c;--ptb-red:#ed9f94;--ptb-gold:#e6be68}[data-learning-lab="physics-topological-band"] .ptb-stage-frame:focus-visible,[data-learning-lab="physics-topological-band"] .ptb-ledger:focus-visible{outline:3px solid var(--ptb-blue);outline-offset:2px}'
    ].join("");

    function assert(condition, message) { if (!condition) throw new Error(message); }

    function finite(value, label) {
      var number = Number(value);
      if (!Number.isFinite(number)) throw new RangeError(label + " must be finite");
      return number;
    }

    function near(left, right, tolerance) {
      var scale = Math.max(1, Math.abs(left), Math.abs(right));
      return Math.abs(left - right) <= (tolerance || 1e-8) * scale;
    }

    function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

    function formatNumber(value, digits) {
      if (!Number.isFinite(value)) return "—";
      var places = digits === undefined ? 3 : digits;
      if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
      var formatted = value.toFixed(places);
      return formatted.indexOf(".") < 0 ? formatted : formatted.replace(/0+$/, "").replace(/\.$/, "");
    }

    function formatInvariant(value, digits) { return Number.isFinite(value) ? formatNumber(value, digits) : "未定义"; }

    function normalizeConfig(input) {
      var source = input || {};
      var mass = finite(source.mass === undefined ? DEFAULTS.mass : source.mass, "mass");
      var ky = finite(source.ky === undefined ? DEFAULTS.ky : source.ky, "ky");
      if (mass < -3.2 || mass > 3.2 || ky < -PI || ky > PI) throw new RangeError("mass or ky is outside the teaching range");
      return { mass: mass, ky: ky };
    }

    function sinAngle(x){return x===0||Math.abs(x)===PI?0:Math.sin(x);}
    function cosAngle(x){return Math.abs(x)===PI/2?0:Math.cos(x);}
    function dVector(kx, ky, mass) {
      return {x:sinAngle(kx),y:sinAngle(ky),z:mass+cosAngle(kx)+cosAngle(ky)};
    }

    function dNorm(vector) { return Math.hypot(vector.x,vector.y,vector.z); }

    function massGapDistance(mass) {
      return Math.min(Math.abs(mass + 2), Math.abs(mass), Math.abs(mass - 2));
    }

    function qwzPhaseLabel(mass) {
      if (massGapDistance(mass) === 0) return NaN;
      if (mass < -2 || mass > 2) return 0;
      return mass < 0 ? 1 : -1;
    }

    function nearCriticalGap(gap) { return gap <= NEAR_GAP + 1e-12; }

    function berryCurvature(kx, ky, mass) {
      var vector = dVector(kx, ky, mass);
      var crossX = Math.sin(kx) * Math.cos(ky);
      var crossY = Math.cos(kx) * Math.sin(ky);
      var crossZ = Math.cos(kx) * Math.cos(ky);
      var triple = vector.x * crossX + vector.y * crossY + vector.z * crossZ;
      var norm = dNorm(vector);
      if (norm === 0) return NaN;
      return 0.5 * triple / Math.pow(norm, 3);
    }

    function integrateCurvature(mass, count) {
      var step = TWO_PI / count;
      var sum = 0;
      for (var ix = 0; ix < count; ix += 1) {
        var kx = -PI + (ix + 0.5) * step;
        for (var iy = 0; iy < count; iy += 1) {
          var ky = -PI + (iy + 0.5) * step;
          var curvature = berryCurvature(kx, ky, mass);
          if (!Number.isFinite(curvature)) return NaN;
          sum += curvature * step * step;
        }
      }
      return sum / TWO_PI;
    }

    var chernCache=new Map();
    function chernEstimate(mass,grid){
      var value=finite(mass,"mass"),count=Math.round(grid===undefined?64:finite(grid,"Chern grid"));
      if(count<9||count>512)throw new RangeError("Chern grid must be between 9 and 512");
      var key=value+":"+count;if(chernCache.has(key))return Object.assign({},chernCache.get(key));
      var analytic=qwzPhaseLabel(value),gap=bulkGap(value),result;
      if(gap===0)result={value:NaN,analytic:NaN,converged:false,grid:count,difference:NaN,status:"gap-closed"};
      else{
        var previous=integrateCurvature(value,count),difference=Infinity,converged=false;
        while(count<512){
          count=Math.min(512,count*2);var current=integrateCurvature(value,count);difference=Math.abs(current-previous);previous=current;
          // Mesh agreement alone can miss a narrow Dirac peak. Require resolution
          // of the analytic minimum mass scale too; never replace the integral.
          if(difference<1e-7&&4*TWO_PI/count<massGapDistance(value)){converged=true;break;}
        }
        result={value:previous,analytic:analytic,converged:converged,grid:count,difference:difference,status:converged?"mesh-converged":"under-resolved"};
      }
      if(chernCache.size>=128)chernCache.delete(chernCache.keys().next().value);
      chernCache.set(key,result);return Object.assign({},result);
    }
    function chernNumber(mass,grid){return chernEstimate(mass,grid).value;}

    function complexOverlap(left, right) {
      return { re: left[0].re * right[0].re + left[0].im * right[0].im + left[1].re * right[1].re + left[1].im * right[1].im, im: left[0].re * right[0].im - left[0].im * right[0].re + left[1].re * right[1].im - left[1].im * right[1].re };
    }

    function lowerEigenvector(kx,ky,mass){
      var v=dVector(kx,ky,mass),n=dNorm(v);if(!Number.isFinite(n)||n===0)return null;
      // Two local gauges avoid cancellation at either pole of the Bloch sphere.
      var u=v.z>=0?[{re:-v.x,im:v.y},{re:v.z+n,im:0}]:[{re:v.z-n,im:0},{re:v.x,im:v.y}];
      var length=Math.hypot(u[0].re,u[0].im,u[1].re,u[1].im);
      return u.map(function(z){return {re:z.re/length,im:z.im/length};});
    }

    function berryPhase(mass, ky, points) {
      var value = finite(mass, "mass");
      var slice = finite(ky, "ky");
      var count = Math.round(points === undefined ? 161 : finite(points, "Berry loop points"));
      if (count < 12) throw new RangeError("Berry loop needs at least 12 points");
      if (wilsonLoopDegenerate(value, slice)) return NaN;
      var product = { re: 1, im: 0 };
      var previous = lowerEigenvector(-PI, slice, value);
      if (!previous) return NaN;
      for (var index = 1; index <= count; index += 1) {
        var kx = -PI + TWO_PI * index / count;
        var current = lowerEigenvector(kx, slice, value);
        if (!current) return NaN;
        var overlap = complexOverlap(previous, current);
        var magnitude = Math.sqrt(overlap.re * overlap.re + overlap.im * overlap.im);
        if (magnitude < 1e-12) return NaN;
        product = { re: product.re * overlap.re / magnitude - product.im * overlap.im / magnitude, im: product.re * overlap.im / magnitude + product.im * overlap.re / magnitude };
        previous = current;
      }
      var phase = -Math.atan2(product.im, product.re);
      if (phase <= -PI) phase += TWO_PI;
      if (phase > PI) phase -= TWO_PI;
      return phase;
    }

    function bulkGap(mass,grid){
      var value=finite(mass,"mass");
      if(grid!==undefined&&Math.round(finite(grid,"gap grid"))<3)throw new RangeError("gap grid must be at least 3");
      // |d|²=m²+2+2m(a+b)+2ab is bilinear on a,b in [-1,1].
      return 2*massGapDistance(value);
    }
    function wilsonLoopDegenerate(mass,ky){
      return sinAngle(ky)===0&&Math.abs(mass+cosAngle(ky))===1;
    }

    function edgeSlice(mass, ky) {
      var effectiveMass = mass + cosAngle(ky);
      var exists = Math.abs(effectiveMass) < 1;
      var decay = Math.abs(effectiveMass);
      var localizationLength = exists && decay > 0 ? 1 / (-Math.log(decay)) : exists ? 0 : Infinity;
      return { effectiveMass: effectiveMass, exists: exists, negativeEnergy: -sinAngle(ky), positiveEnergy: sinAngle(ky), decay: decay, localizationLength: localizationLength };
    }

    function edgeSpectrum(mass, count) {
      var samples = Math.round(count === undefined ? 101 : finite(count, "edge samples"));
      if (samples < 2) throw new RangeError("edge samples must be at least 2");
      var points = [];
      for (var index = 0; index < samples; index += 1) {
        var ky = -PI + TWO_PI * index / (samples - 1);
        var edge = edgeSlice(mass, ky);
        points.push({ ky: ky, exists: edge.exists, negativeEnergy: edge.negativeEnergy, positiveEnergy: edge.positiveEnergy, bulkHalfGap: Math.sqrt(sinAngle(ky) * sinAngle(ky) + Math.pow(Math.abs(edge.effectiveMass) - 1, 2) ) });
      }
      return points;
    }

    function curvatureMap(mass, rows, columns) {
      var rowCount = Math.round(rows === undefined ? 17 : finite(rows, "curvature rows"));
      var columnCount = Math.round(columns === undefined ? 17 : finite(columns, "curvature columns"));
      if(rowCount<1||columnCount<1||rowCount>512||columnCount>512)throw new RangeError("curvature dimensions must be 1..512");
      var values = [];
      var min = Infinity;
      var max = -Infinity;
      for (var iy = 0; iy < rowCount; iy += 1) {
        for (var ix = 0; ix < columnCount; ix += 1) {
          var kx = -PI + (ix + 0.5) * TWO_PI / columnCount;
          var ky = -PI + (iy + 0.5) * TWO_PI / rowCount;
          var value = berryCurvature(kx, ky, mass);
          values.push({ kx: kx, ky: ky, value: value });
          if (Number.isFinite(value)) {
            min = Math.min(min, value);
            max = Math.max(max, value);
          }
        }
      }
      if (!Number.isFinite(min) || !Number.isFinite(max)) { min = 0; max = 0; }
      return { rows: rowCount, columns: columnCount, values: values, min: min, max: max };
    }

    function analyze(input) {
      var config = normalizeConfig(input);
      var edge = edgeSlice(config.mass, config.ky);
      var gap = bulkGap(config.mass);
      var closed = gap === 0;
      var estimate=chernEstimate(config.mass);
      var chern=estimate.analytic;
      var phase=berryPhase(config.mass,config.ky,512), coarsePhase=berryPhase(config.mass,config.ky,256);
      var phaseDifference=Math.abs(Math.atan2(Math.sin(phase-coarsePhase),Math.cos(phase-coarsePhase)));
      return { config: config, curvature: curvatureMap(config.mass), chern: chern, chernEstimate:estimate, hallConductivity: -chern, gap: gap, gapStatus: closed ? "closed" : nearCriticalGap(gap) ? "near" : "open", invariantsDefined: Number.isFinite(chern) && Number.isFinite(phase), berryPhase: phase, berryPoints:512, berryDifference:phaseDifference, edge: edge, edgeSpectrum: edgeSpectrum(config.mass) };
    }

    function makeElement(doc, tag, attributes, children) {
      var node = doc.createElement(tag);
      Object.keys(attributes || {}).forEach(function (key) {
        var value = attributes[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.setAttribute("class", String(value));
        else if (key === "text") node.textContent = String(value);
        else if (value === true) node.setAttribute(key, "");
        else node.setAttribute(key, String(value));
      });
      (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) {
        if (child === undefined || child === null || child === false) return;
        node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
      });
      return node;
    }

    function makeSvg(doc, tag, attributes, children) {
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attributes || {}).forEach(function (key) {
        var value = attributes[key];
        if (value === undefined || value === null || value === false) return;
        node.setAttribute(key === "className" ? "class" : key, String(value));
      });
      (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) {
        if (child === undefined || child === null || child === false) return;
        node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
      });
      return node;
    }

    function injectStyles(doc) {
      if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement).appendChild(style);
    }

    function svgText(doc, x, y, value, anchor, size) { return makeSvg(doc, "text", { x: x, y: y, "text-anchor": anchor || "start", "font-size": size || 11 }, [value]); }

    function colorFor(value, minimum, maximum) {
      if (!Number.isFinite(value)) return "transparent";
      var maxAbs = Math.max(Math.abs(minimum), Math.abs(maximum), 1e-9);
      var ratio = Math.max(-1, Math.min(1, value / maxAbs));
      return "color-mix(in srgb, var(--ptb-" + (ratio>=0?"red":"blue") + ") " + (90*Math.abs(ratio)).toFixed(3) + "%, transparent)";
    }

    function pathFrom(points) { return points.map(function (point, index) { return (index && !point.breakBefore ? "L" : "M") + point.x.toFixed(2) + " " + point.y.toFixed(2); }).join(" "); }

    function drawSvg(doc, result) {
      var svg=makeSvg(doc,"svg",{viewBox:"0 0 820 660",role:"img","aria-label":"Berry 曲率色标、半无限边界支与实际积分诊断"});
      function label(x,y,t,anchor,size){svg.appendChild(svgText(doc,x,y,t,anchor,size||12));}
      function line(x1,y1,x2,y2,cls){svg.appendChild(makeSvg(doc,"line",{x1:x1,y1:y1,x2:x2,y2:y2,class:cls||"ptb-axis"}));}
      var left=60,right=360,top=55,bottom=355,cw=300/result.curvature.columns,ch=300/result.curvature.rows;
      label(left,25,"Berry 曲率 Ω_−(k_x,k_y)","start",14);
      result.curvature.values.forEach(function(cell,i){
        var ix=i%result.curvature.columns,iy=Math.floor(i/result.curvature.columns);
        svg.appendChild(makeSvg(doc,"rect",{x:left+ix*cw,y:bottom-(iy+1)*ch,width:cw+.2,height:ch+.2,fill:colorFor(cell.value,result.curvature.min,result.curvature.max)}));
      });
      svg.appendChild(makeSvg(doc,"rect",{x:left,y:top,width:300,height:300,fill:"none",stroke:"currentColor"}));
      var maxAbs=Math.max(Math.abs(result.curvature.min),Math.abs(result.curvature.max));
      for(var i=0;i<60;i++)svg.appendChild(makeSvg(doc,"rect",{x:382,y:top+i*5,width:14,height:5.2,fill:colorFor(maxAbs*(1-2*(i+.5)/60),-maxAbs,maxAbs)}));
      label(389,42,"Ω","middle");label(402,59,formatNumber(maxAbs,2));label(402,209,"0");label(402,355,formatNumber(-maxAbs,2));
      [-1,0,1].forEach(function(t){var name=t===0?"0":t<0?"−π":"π";label(left+(t+1)*150,375,name,"middle");label(51,bottom-(t+1)*150+4,name,"end");});
      label(210,398,"k_x","middle");label(30,42,"k_y","middle");
      line(left,bottom-(result.config.ky+PI)/TWO_PI*300,right,bottom-(result.config.ky+PI)/TWO_PI*300,"ptb-selected");
      var el=510,er=792,emax=Math.ceil(Math.max(1.1,...result.edgeSpectrum.map(function(p){return p.bulkHalfGap;})));
      var mx=function(k){return el+(k+PI)/TWO_PI*(er-el);},my=function(e){return 205-e/emax*150;};
      label(el,25,"半无限边界支 / 体谱投影隙","start",14);
      [-1,-.5,0,.5,1].forEach(function(t){line(el,my(t*emax),er,my(t*emax),"ptb-grid");label(el-8,my(t*emax)+4,formatNumber(t*emax,1),"end");});
      line(el,top,el,bottom);label(el-27,42,"E","middle");
      [-1,0,1].forEach(function(t){label(mx(t*PI),375,t===0?"0":t<0?"−π":"π","middle");});label((el+er)/2,398,"k_y","middle");
      var lo=[],hi=[],positive=[],negative=[],previous=false;
      result.edgeSpectrum.forEach(function(p){var x=mx(p.ky);lo.push({x:x,y:my(-p.bulkHalfGap)});hi.push({x:x,y:my(p.bulkHalfGap)});if(p.exists){positive.push({x:x,y:my(p.positiveEnergy),breakBefore:!previous});negative.push({x:x,y:my(p.negativeEnergy),breakBefore:!previous});}previous=p.exists;});
      svg.appendChild(makeSvg(doc,"path",{d:pathFrom(lo.concat(hi.slice().reverse()))+" Z",class:"ptb-gap"}));
      [lo,hi].forEach(function(points){svg.appendChild(makeSvg(doc,"path",{d:pathFrom(points),fill:"none",stroke:COLORS.gray,"stroke-width":1.2}));});
      [positive,negative].forEach(function(points,i){if(points.length)svg.appendChild(makeSvg(doc,"path",{d:pathFrom(points),class:i?"ptb-edge-alt":"ptb-edge"}));});
      if(result.edge.exists)[result.edge.positiveEnergy,result.edge.negativeEnergy].forEach(function(e){svg.appendChild(makeSvg(doc,"circle",{cx:mx(result.config.ky),cy:my(e),r:5,class:"ptb-current"}));});
      label(60,425,"浅蓝：当前 k_y 的体谱投影隙；红 / 金：左 / 右半无限边界支。");
      label(60,451,"m="+formatNumber(result.config.mass,2)+"；k_y="+formatNumber(result.config.ky,3)+"；|λ|="+formatNumber(result.edge.decay,3)+"；振幅衰减长度 ξ="+(result.edge.exists?formatNumber(result.edge.localizationLength,3):"不适用"));
      label(60,478,"解析 QWZ C="+formatInvariant(result.chern,0)+"；全局能隙 Δ="+formatNumber(result.gap,4),"start",14);
      var est=result.chernEstimate;
      label(60,505,"实际曲率积分="+formatInvariant(est.value,6)+"；网格 "+est.grid+"×"+est.grid+"；相邻网格差="+formatNumber(est.difference,3));
      label(60,531,result.gap===0?"全局闭隙：不定义绝缘带 C。":est.converged?"网格一致性检查通过；这项诊断不是严格误差界。":"网格尚未充分分辨曲率尖峰；保留原始积分，不据此判定拓扑相。");
      label(60,557,"回路 γ="+formatInvariant(result.berryPhase,5)+" rad；512 点；256→512 点相位差="+formatNumber(result.berryDifference,3));
      label(60,586,result.edge.exists?"当前切片存在半无限边界解；有限宽条带的两侧重叠仍可能产生小能隙。":"当前切片无半无限边界解；单个切片不能决定整个布里渊区的 C。");
      label(60,618,"全局闭隙不等于每条回路闭隙：避开简并的回路仍有 Berry 相位。");
      return svg;
    }

    function metric(doc, label, value) { return makeElement(doc, "div", { className: "ptb-metric" }, [makeElement(doc, "span", { text: label }), makeElement(doc, "strong", { text: value })]); }

    function predictionField(doc, key, label, options) {
      var select = makeElement(doc, "select", { "data-ptb-prediction": key, "aria-label": label });
      select.appendChild(makeElement(doc, "option", { value: "", text: "请选择" }));
      options.forEach(function (option) { select.appendChild(makeElement(doc, "option", { value: option.value, text: option.label })); });
      return makeElement(doc, "div", { className: "ptb-prediction" }, [makeElement(doc, "label", {}, [label]), select]);
    }

    function selectedValue(form, key) {
      var select = form.querySelector('[data-ptb-prediction="' + key + '"]');
      return select && select.value ? select.value : "";
    }

    function mount(rootNode, api) {
      var doc = rootNode.ownerDocument || (host && host.document);
      if (!doc) throw new Error("a document is required to mount the lab");
      injectStyles(doc);
      var state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, preset: "default", feedback: "" };
      var shell = makeElement(doc, "div", { className: "ptb-shell" });
      shell.appendChild(makeElement(doc, "h3", { text: "Topology lab：Berry phase、Chern invariant 与 edge branch" }));
      shell.appendChild(makeElement(doc, "p", { className: "ptb-muted", text: "固定模型 H=d·σ；解析相图与实际曲率积分分开显示。Wilson 回路计算选定 k_y 的相位，半无限边界支用来核对体边对应。" }));
      var predictionForm = makeElement(doc, "form", { className: "ptb-predictions" });
      predictionForm.appendChild(makeElement(doc, "fieldset", {}, [
        makeElement(doc, "legend", { text: "先预测，再揭示" }),
        makeElement(doc, "div", { className: "ptb-prediction-grid" }, [
          predictionField(doc, "transition", "连续改变 m 穿过 0 时，C 是否改变？", [{ value: "change", label: "会，但先 gap 闭合" }, { value: "no", label: "不会改变" }, { value: "always", label: "任意点跳变" }]),
          predictionField(doc, "phase", "m=-1、k_y=0 的 Berry phase 更接近", [{ value: "pi", label: "π" }, { value: "zero", label: "0" }, { value: "undefined", label: "永远不定义" }]),
          predictionField(doc, "edge", "edge branch 能否单独定义 C？", [{ value: "no", label: "不能，需 bulk 积分" }, { value: "yes", label: "能，看到就等于 C" }, { value: "random", label: "完全随机" }])
        ])
      ]));
      var predictionActions = makeElement(doc, "div", { className: "ptb-actions" });
      var revealButton = makeElement(doc, "button", { type: "submit", className: "ptb-primary", text: "提交预测并揭示" });
      var resetButton = makeElement(doc, "button", { type: "button", text: "重置" });
      predictionActions.appendChild(revealButton);
      predictionActions.appendChild(resetButton);
      predictionForm.appendChild(predictionActions);
      var feedback = makeElement(doc, "p", { className: "ptb-feedback", "aria-live": "polite" });
      predictionForm.appendChild(feedback);
      shell.appendChild(predictionForm);

      var bench = makeElement(doc, "div", { hidden: true });
      var layout = makeElement(doc, "div", { className: "ptb-layout" });
      var controls = makeElement(doc, "div", { className: "ptb-controls" });
      controls.appendChild(makeElement(doc, "h4", { text: "参数" }));
      var inputs = {};
      function addRange(key, label, min, max, step, digits, scale) {
        scale=scale||1;
        var output = makeElement(doc, "output", { text: formatNumber(state.config[key], digits) });
        var input = makeElement(doc, "input", { type: "range", min: min, max: max, step: step, value: state.config[key]/scale, "aria-label": label });
        input.addEventListener("input", function () { state.config[key] = finite(input.value, key)*scale; state.preset = "custom"; state.feedback = "参数已更新；重新读 Berry 与 edge 两本账。"; render(); });
        inputs[key] = { input: input, output: output, digits: digits, scale:scale };
        controls.appendChild(makeElement(doc, "div", { className: "ptb-control" }, [makeElement(doc, "label", {}, [label, output]), input]));
      }
      addRange("mass", "质量参数 m", "-3.20", "3.20", "0.05", 2);
      addRange("ky", "选定 k_y", -32, 32, 1, 2, PI/32);
      controls.appendChild(makeElement(doc, "h4", { text: "预设" }));
      var presetRow = makeElement(doc, "div", { className: "ptb-preset-row" });
      PRESETS.forEach(function (preset) {
        var button = makeElement(doc, "button", { type: "button", text: preset.label, "data-ptb-preset": preset.id, "aria-pressed": "false" });
        button.addEventListener("click", function () { state.config = normalizeConfig(preset); state.preset = preset.id; state.feedback = "已切换预设；请比较 gap、C、Berry phase 和 edge branch。"; render(); announce(preset.label + "预设已应用。"); });
        presetRow.appendChild(button);
      });
      controls.appendChild(presetRow);
      var stage = makeElement(doc, "div", { className: "ptb-stage" });
      var frame = makeElement(doc, "div", { className: "ptb-stage-frame", tabindex:0, "aria-label":"拓扑图，可左右滚动" });
      var chartHost = makeElement(doc, "div");
      frame.appendChild(chartHost);
      frame.appendChild(makeElement(doc, "div", { className: "ptb-legend" }, [
        makeElement(doc, "span", { className: "ptb-key" }, [makeElement(doc, "i", { className: "ptb-swatch", "data-kind": "curvature" }), "Berry 曲率符号"]),
        makeElement(doc, "span", { className: "ptb-key" }, [makeElement(doc, "i", { className: "ptb-swatch" }), "左边界 E=+sin k_y"]),
        makeElement(doc, "span", { className: "ptb-key" }, [makeElement(doc, "i", { className: "ptb-swatch", "data-kind": "edge-alt" }), "右边界 E=−sin k_y"])
      ]));
      stage.appendChild(frame);
      layout.appendChild(controls);
      layout.appendChild(stage);
      bench.appendChild(layout);
      var metrics = makeElement(doc, "div", { className: "ptb-metrics" });
      bench.appendChild(metrics);
      var ledger = makeElement(doc, "div", { className: "ptb-ledger", tabindex:0, "aria-label":"拓扑账本，可左右滚动" });
      bench.appendChild(ledger);
      var note = makeElement(doc, "p", { className: "ptb-note" });
      bench.appendChild(note);
      shell.appendChild(bench);
      rootNode.replaceChildren(shell);

      function announce(message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); }

      function renderLedger(result) {
        var table = makeElement(doc, "table", {});
        table.appendChild(makeElement(doc, "thead", {}, [makeElement(doc, "tr", {}, [makeElement(doc, "th", { text: "账本" }), makeElement(doc, "th", { text: "当前数值" }), makeElement(doc, "th", { text: "边界" })])]));
        var rows = [
          ["Berry phase", "γ(k_y)=" + formatInvariant(result.berryPhase, 3) + " rad", Number.isFinite(result.berryPhase) ? "只对这条闭合回路给出模 2π 的相位；换 ky 会变。" : "Wilson loop 遇到能带简并，Berry phase undefined。"],
          ["解析 QWZ Chern 数", "C_-=" + formatInvariant(result.chern, 3), Number.isFinite(result.chern) ? "下带在整个 BZ 保持隔离；当前符号采用 A=i⟨u|∇u⟩。" : "bulk gap 闭合，绝缘体 Chern invariant undefined。"],
          ["实际曲率积分", formatInvariant(result.chernEstimate.value,6), result.chernEstimate.grid+"×"+result.chernEstimate.grid+" 网格；"+(result.chernEstimate.converged?"通过网格一致性检查（非严格误差界）":result.gap===0?"全局闭隙，不定义 C":"尚未充分分辨，不能按此数值判相")],
          ["Hall response", "σ_xy/(e²/h)=" + formatInvariant(result.hallConductivity, 3), "电子电荷 −e，σ_xy=j_x/E_y；填满下带时 σ_xy=−C_- e²/h。"],
          ["edge condition", "|m+cos k_y|=" + formatNumber(Math.abs(result.edge.effectiveMass), 3), result.edge.exists ? "当前切片有理想边界支。" : "当前切片无理想边界支；别把单点当 C。"],
          ["bulk gap", "Δ=" + formatNumber(result.gap, 3), result.gapStatus === "open" ? "当前参数远离数值 gap 闭合。" : result.gapStatus === "near" ? "Δ≤0.1，属于近临界区；相位标签仍需说明数值口径。" : "全局闭隙，C 未定义；不经过简并的 Wilson 回路仍可计算相位。"]
        ];
        var body = makeElement(doc, "tbody", {});
        rows.forEach(function (row) { body.appendChild(makeElement(doc, "tr", {}, [makeElement(doc, "td", { text: row[0] }), makeElement(doc, "td", { text: row[1] }), makeElement(doc, "td", { text: row[2] })])); });
        table.appendChild(body);
        return table;
      }

      function render() {
        Object.keys(inputs).forEach(function (key) { inputs[key].input.value = String(state.config[key]/inputs[key].scale); inputs[key].output.textContent = formatNumber(state.config[key], inputs[key].digits); });
        presetRow.querySelectorAll("button").forEach(function (button) { button.setAttribute("aria-pressed", button.getAttribute("data-ptb-preset") === state.preset ? "true" : "false"); });
        feedback.textContent = state.feedback;
        feedback.className = "ptb-feedback" + (state.feedback.indexOf("请先") === 0 ? " ptb-warn" : "");
        bench.hidden = !state.revealed;
        if (!state.revealed) return;
        var result = analyze(state.config);
        chartHost.replaceChildren(drawSvg(doc, result));
        metrics.replaceChildren(metric(doc, "解析下带 C", formatInvariant(result.chern, 3)), metric(doc, "bulk gap", formatNumber(result.gap, 3) + "（" + result.gapStatus + "）"), metric(doc, "Berry γ", formatInvariant(result.berryPhase, 3) + " rad"), metric(doc, "edge", result.edge.exists ? "存在" : "无"));
        ledger.replaceChildren(renderLedger(result));
        note.textContent = "边界提示：模型是干净、两带、平移不变的 QWZ 代理；本实验固定 A=i⟨u|∇u⟩，曲率与 Wilson 回路同号；定义 σ_xy=j_x/E_y，电子满带 Hall 为 −C e²/h。解析 C 不会覆盖实际积分。全局 gap 闭合时 C 未定义；只有回路本身遇到简并时，其 Berry 相位才未定义。";
      }

      predictionForm.addEventListener("change", function(){state.revealed=false;state.feedback="预测已变更，请重新提交。";render();});
      predictionForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var keys = ["transition", "phase", "edge"];
        if (!keys.every(function (key) { return selectedValue(predictionForm, key); })) { state.feedback = "请先完成三项预测；揭示前不显示热图、曲线和 invariant 账本。"; render(); return; }
        var expected = { transition: "change", phase: "pi", edge: "no" };
        var correct = keys.filter(function (key) { return selectedValue(predictionForm, key) === expected[key]; }).length;
        state.predictions = { transition: selectedValue(predictionForm, "transition"), phase: selectedValue(predictionForm, "phase"), edge: selectedValue(predictionForm, "edge") };
        if(!state.revealed){state.config=normalizeConfig(DEFAULTS);state.preset="default";}
        state.revealed = true;
        state.feedback = "已揭示：" + correct + "/3 命中。先看 gap，再谈 C；再用 edge branch 做 bulk-boundary 对账。";
        render();
        announce(state.feedback);
      });
      resetButton.addEventListener("click", function () { predictionForm.reset(); state = { config: normalizeConfig(DEFAULTS), predictions: {}, revealed: false, preset: "default", feedback: "" }; render(); announce("拓扑实验已重置；预测重新隐藏。"); });
      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) { checks += 1; assert(condition, message); }
      var minus = analyze(DEFAULTS);
      check(minus.chern > 0.85 && minus.chern < 1.15, "m=-1 has lower-band Chern number +1");
      check(near(minus.hallConductivity, -minus.chern, 1e-12) && Number.isFinite(minus.berryPhase), "sigma_xy=jx/Ey equals minus C for electron charge -e");
      check(minus.gap > 1.8, "m=-1 is gapped");
      check(Math.abs(Math.abs(minus.berryPhase) - PI) < 0.08, "m=-1 ky=0 Berry phase is pi modulo 2pi");
      check(minus.edge.exists && near(minus.edge.positiveEnergy, 0, 1e-12), "ky=0 slice has a zero-energy edge crossing");
      var plus = analyze({ mass: 1, ky: 0 });
      check(plus.chern < -0.85 && plus.chern > -1.15, "m=1 has lower-band Chern number -1");
      var trivial = analyze({ mass: 2.6, ky: 0 });
      check(Math.abs(trivial.chern) < 0.15 && !trivial.edge.exists, "m=2.6 is trivial with no ky=0 edge slice");
      var critical = bulkGap(0, 41);
      check(critical < 1e-8, "m=0 closes the bulk gap");
      var nearCritical = analyze({ mass: 1.95, ky: 0 });
      check(nearCritical.gapStatus === "near" && nearCritical.gap <= NEAR_GAP + 1e-10 && nearCritical.chern === -1 && Number.isFinite(nearCritical.chernEstimate.value), "analytic QWZ label and computed curvature integral are separately reported");
      var criticalAnalysis = analyze({ mass: 0, ky: 0 });
      check(criticalAnalysis.gapStatus === "closed" && !Number.isFinite(criticalAnalysis.chern) && !Number.isFinite(criticalAnalysis.hallConductivity) && !Number.isFinite(criticalAnalysis.berryPhase), "bulk gap closure makes Chern, Hall, and Wilson invariants undefined");
      check(Number.isFinite(berryPhase(0,PI/2))&&!Number.isFinite(analyze({mass:0,ky:PI/2}).chern),"a gapped slice retains Berry phase when another momentum closes the bulk gap");
      check(lowerEigenvector(PI, 0, 0) === null && !Number.isFinite(berryPhase(-2, 0)), "degenerate eigenvectors and Wilson loops never use an arbitrary state");
      check(normalizeConfig({ mass: -1, ky: -PI }).ky === -PI && normalizeConfig({ mass: -1, ky: PI }).ky === PI, "ky accepts exact BZ endpoints");
      check(Math.abs(edgeSlice(-1, 0).effectiveMass) < 1e-12 && edgeSlice(-1, 0).exists && !edgeSlice(-1, PI).exists, "edge condition is checked slice by slice");
      check(edgeSpectrum(-1, 31).length === 31 && curvatureMap(-1, 9, 9).values.length === 81, "visual samples honor requested sizes");
      var invalid = false;
      try { normalizeConfig({ mass: 5 }); } catch (error) { invalid = true; }
      check(invalid, "out-of-range mass is rejected");
      invalid = false;
      try { berryPhase(-1, 0, 4); } catch (error2) { invalid = true; }
      check(invalid, "too-short Berry loop is rejected");
      return { checks: checks };
    }

    return { LAB_ID: LAB_ID, DEFAULTS: DEFAULTS, PRESETS: PRESETS, normalizeConfig: normalizeConfig, dVector: dVector, berryCurvature: berryCurvature, chernNumber: chernNumber, chernEstimate:chernEstimate, lowerEigenvector: lowerEigenvector, berryPhase: berryPhase, bulkGap: bulkGap, massGapDistance: massGapDistance, qwzPhaseLabel: qwzPhaseLabel, wilsonLoopDegenerate: wilsonLoopDegenerate, edgeSlice: edgeSlice, edgeSpectrum: edgeSpectrum, curvatureMap: curvatureMap, analyze: analyze, mount: mount, selfTest: selfTest };
  }
);

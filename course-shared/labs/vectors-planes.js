(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("vectors-planes", exported.mount);
  }
  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log(
        "vectors-planes self-test: PASS (" +
          report.checks +
          " checks, " +
          report.scenarios +
          " scenarios)"
      );
    } catch (error) {
      console.error("vectors-planes self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : null,
  function (host) {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "cl-vectors-planes-style";
    var INSTANCE = 0;
    var DEFAULTS = { mode: "line-plane", scenario: "cross", offset: 1, tilt: 1 };

    var LINE_SCENARIOS = [
      { id: "cross", label: "直线相交平面", offset: 1, tilt: 1 },
      { id: "parallel", label: "平行不相交", offset: 1, tilt: 0 },
      { id: "contained", label: "直线包含于平面", offset: 0, tilt: 0 },
      { id: "zero-direction", label: "零方向向量", offset: 0, tilt: 0 },
      { id: "zero-normal", label: "零法向量", offset: 1, tilt: 1 }
    ];

    var PLANE_SCENARIOS = [
      { id: "cross", label: "两个平面相交", offset: 0, tilt: 0 },
      { id: "coincident", label: "平面重合", offset: 0, tilt: 0 },
      { id: "parallel", label: "平行不重合", offset: 1, tilt: 0 },
      { id: "zero-normal", label: "第二平面退化", offset: 0, tilt: 0 }
    ];

    var STYLE_TEXT = [
      ".vp-lab{--vp-blue:var(--cl-blue,#315f9d);--vp-gold:var(--cl-gold,#9b6a12);--vp-green:var(--cl-green,#39734d);--vp-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
      ".vp-lab *,.vp-lab *::before,.vp-lab *::after{box-sizing:border-box;}.vp-lab [hidden]{display:none!important;}",
      ".vp-lab h3,.vp-lab h4{margin:0;color:var(--fg);letter-spacing:0;}.vp-lab h3{font-size:1.18rem;}.vp-lab h4{margin-top:16px;font-size:1rem;}",
      ".vp-lab p{margin:.65em 0;}.vp-lab .vp-note,.vp-lab .vp-feedback,.vp-lab .vp-boundary{color:var(--fg-soft);font-size:13px;line-height:1.7;}",
      ".vp-lab button,.vp-lab select,.vp-lab input{font:inherit;letter-spacing:0;}.vp-lab button,.vp-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere;}",
      ".vp-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}.vp-lab button:hover{border-color:var(--accent);}.vp-lab button[aria-pressed=\"true\"],.vp-lab button.vp-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}.vp-lab button:focus-visible,.vp-lab select:focus-visible,.vp-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
      ".vp-lab .vp-predict{margin:14px 0;padding:13px 14px;border-left:3px solid var(--vp-gold);background:var(--bg);}.vp-lab .vp-predict-title{display:block;margin-bottom:10px;font-size:13px;}.vp-lab .vp-question-list{display:grid;gap:12px;}.vp-lab .vp-question{min-width:0;margin:0;padding:0;border:0;}.vp-lab .vp-question legend{max-width:100%;margin-bottom:7px;color:var(--fg);font-size:12.5px;font-weight:700;overflow-wrap:anywhere;}.vp-lab .vp-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}.vp-lab .vp-choice-row button{font-size:12px;}",
      ".vp-lab .vp-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}.vp-lab .vp-actions>*{flex:1 1 155px;}.vp-lab .vp-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}.vp-lab .vp-pass,.vp-lab .vp-ok{color:var(--vp-green);}.vp-lab .vp-warn,.vp-lab .vp-fail{color:var(--vp-red);}",
      ".vp-lab .vp-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px 16px;margin:14px 0;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}.vp-lab .vp-control{display:grid;gap:5px;min-width:0;}.vp-lab .vp-control label{color:var(--fg-soft);font-size:13px;font-weight:700;}.vp-lab .vp-control output{color:var(--accent);font-variant-numeric:tabular-nums;}",
      ".vp-lab .vp-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0;}.vp-lab .vp-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.vp-lab .vp-metric.vp-blue{border-top-color:var(--vp-blue);}.vp-lab .vp-metric.vp-gold{border-top-color:var(--vp-gold);}.vp-lab .vp-metric.vp-green{border-top-color:var(--vp-green);}.vp-lab .vp-metric.vp-red{border-top-color:var(--vp-red);}.vp-lab .vp-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4;}.vp-lab .vp-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
      ".vp-lab .vp-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.vp-lab .vp-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;margin-top:12px;}.vp-lab .vp-chart-frame{min-width:0;padding:7px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow-x:auto;}.vp-lab svg{display:block;width:100%;min-width:760px;max-width:none;height:auto;color:var(--fg);}.vp-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.vp-lab .vp-ledger{max-width:100%;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.vp-lab table{display:table;width:100%;min-width:760px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.vp-lab th,.vp-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere;}.vp-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750;}.vp-lab .vp-interpretation{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--vp-green);background:var(--bg);font-size:13px;line-height:1.7;}",
      "@media(max-width:820px){.vp-lab .vp-controls{grid-template-columns:repeat(2,minmax(0,1fr));}}",
      "@media(max-width:560px){.vp-lab .vp-controls,.vp-lab .vp-grid{grid-template-columns:minmax(0,1fr);}.vp-lab .vp-choice-row{grid-template-columns:minmax(0,1fr);}}",
      "@media(max-width:420px){.vp-lab .vp-predict{padding-left:11px;padding-right:11px;}.vp-lab th,.vp-lab td{padding-left:5px;padding-right:5px;}}",
      "@media(prefers-reduced-motion:reduce){.vp-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
    ].join("\n");

    STYLE_TEXT+='\n[data-theme="dark"] .vp-lab{--vp-blue:#8ab6e8;--vp-gold:#e0bc67;--vp-green:#8bc4a0;--vp-red:#f09b8e}.vp-chart-frame:focus-visible,.vp-ledger:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}';
    function scalarText(value,isNonzero){if(value===undefined)return '—';if(!finite(value))return '超出数值范围';if(value===0&&isNonzero)return '非零（数值下溢）';return formatNumber(value,4);}
    function finite(value) {
      return typeof value === "number" && isFinite(value);
    }

    function formatNumber(value, digits) {
      if (!finite(value)) return "—";
      if (value!==0 && (Math.abs(value)<.001 || Math.abs(value)>=10000))return value.toExponential(4);
      var text = Number(value).toFixed(digits === undefined ? 3 : digits);
      return (text.includes(".")?text.replace(/0+$/, "").replace(/\.$/, ""):text).replace(/^-0$/,"0");
    }

    function vector(values) {
      if (!Array.isArray(values) || values.length !== 3) throw new TypeError("vector must contain exactly three coordinates");
      var result = values.slice();
      if (!result.every(finite)) throw new RangeError("vector coordinates must be finite");
      return result;
    }

    function finiteSetting(value, fallback, label) {
      var number = value === undefined ? fallback : value;
      if (!finite(number)) throw new RangeError(label + " must be finite");
      return number;
    }

    function add(a, b) {
      return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    }

    function scale(a, factor) {
      return [a[0] * factor, a[1] * factor, a[2] * factor];
    }

    function subtract(a, b) {
      return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    }

    function dot(a, b) {
      return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }

    function cross(a, b) {
      return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
      ];
    }

    function norm(a) {
      return Math.hypot.apply(Math,a);
    }

    function vectorText(a) {
      return "(" + a.map(function (value) { return formatNumber(value, 3); }).join(", ") + ")";
    }

    function scenarioById(mode, id) {
      var list = mode === "plane-plane" ? PLANE_SCENARIOS : LINE_SCENARIOS;
      for (var i = 0; i < list.length; i += 1) {
        if (list[i].id === id) return list[i];
      }
      throw new Error("Unknown " + mode + " scenario: " + id);
    }

    function objectSettings(options){if(options===undefined)return{};if(!options||typeof options!=='object'||Array.isArray(options))throw new TypeError('options must be object');return options;}
    // Exact predicates for the binary64 numbers actually supplied, not for uncertain measurements.
    var bitsBuffer=new ArrayBuffer(8),bitsView=new DataView(bitsBuffer);
    function dyad(x){if(!finite(x))throw new RangeError('finite coordinate required');if(x===0)return{n:0n,e:0};bitsView.setFloat64(0,x,false);var bits=bitsView.getBigUint64(0,false),exponent=Number((bits>>52n)&2047n),mantissa=bits&((1n<<52n)-1n);if(exponent)mantissa+=1n<<52n;return{n:(bits>>63n)?-mantissa:mantissa,e:exponent?exponent-1075:-1074};}
    function plus(a,b){if(a.n===0n)return b;if(b.n===0n)return a;var e=Math.min(a.e,b.e);return{n:(a.n<<BigInt(a.e-e))+(b.n<<BigInt(b.e-e)),e:e};}
    function neg(a){return{n:-a.n,e:a.e};}function minus(a,b){return plus(a,neg(b));}function times(a,b){return{n:a.n*b.n,e:a.e+b.e};}
    function dDot(a,b){return a.reduce(function(s,x,i){return plus(s,times(x,b[i]));},{n:0n,e:0});}
    function dCross(a,b){return[minus(times(a[1],b[2]),times(a[2],b[1])),minus(times(a[2],b[0]),times(a[0],b[2])),minus(times(a[0],b[1]),times(a[1],b[0]))];}
    function parts(a){if(a.n===0n)return{m:0,e:0};var sign=a.n<0n?-1:1,n=a.n<0n?-a.n:a.n,bits=n.toString(2).length,shift=Math.max(0,bits-54);return{m:sign*Number(n>>BigInt(shift))/Math.pow(2,bits-shift-1),e:a.e+bits-1};}
    function scaledFloat(m,e){if(m===0)return 0;if(Math.abs(m)<1){m*=2;e--;}if(Math.abs(m)>=2){m/=2;e++;}if(e>1023)return m>0?Infinity:-Infinity;if(e<-1075)return m>0?0:-0;return e<-1022?m*Math.pow(2,e+1074)*Number.MIN_VALUE:m*Math.pow(2,e);}
    function dValue(a){var p=parts(a);return scaledFloat(p.m,p.e);}
    function ratio(a,b){if(b.n===0n)throw new RangeError('zero exact denominator');if(a.n===0n)return 0;var x=parts(a),y=parts(b);return scaledFloat(x.m/y.m,x.e-y.e);}
    function nonzero(a){return a.some(function(x){return x!==0;});}
    function unit(a){var max=Math.max.apply(Math,a.map(Math.abs)),b=a.map(function(x){return x/max;}),length=Math.hypot.apply(Math,b);return b.map(function(x){return x/length;});}
    function normalizedExact(a){var lead=a.find(function(x){return x.n!==0n;});if(!lead)return[0,0,0];var exponent=Math.max.apply(Math,a.filter(function(x){return x.n!==0n;}).map(function(x){return parts(x).e;}));var b=a.map(function(x){var p=parts(x);return scaledFloat(p.m,p.e-exponent);}),length=Math.hypot.apply(Math,b);return b.map(function(x){return x/length;});}
    function linePlane(options){var s=objectSettings(options),normal=vector(s.normal===undefined?[0,0,1]:s.normal),planePoint=vector(s.planePoint===undefined?[0,0,0]:s.planePoint),point=vector(s.point===undefined?[1,1,1]:s.point),direction=vector(s.direction===undefined?[1,0,0]:s.direction),r={normal:normal,planePoint:planePoint,point:point,direction:direction};
      if(!nonzero(normal)){r.relation='degenerate-plane';return r;}if(!nonzero(direction)){r.relation='degenerate-line';return r;}
      var N=normal.map(dyad),D=direction.map(dyad),Q=point.map(dyad),P=planePoint.map(dyad),den=dDot(N,D),off=dDot(N,Q.map(function(x,i){return minus(x,P[i]);}));r.denominator=dValue(den);r.offset=dValue(off);r.denominatorNonzero=den.n!==0n;r.offsetNonzero=off.n!==0n;
      if(den.n===0n){r.relation=off.n===0n?'contained':'parallel';return r;}
      r.relation='intersect';var numerator=neg(off),t=ratio(numerator,den),intersection=Q.map(function(x,i){return ratio(plus(times(x,den),times(D[i],numerator)),den);});r.conditionWarning=Math.abs(dot(unit(normal),unit(direction)))<1e-8;
      if(finite(t))r.parameter=t;else r.parameterUnrepresentable=true;if(intersection.every(finite))r.intersection=intersection;else r.intersectionUnrepresentable=true;return r;
    }
    function planePlane(options){var s=objectSettings(options),normal1=vector(s.normal1===undefined?[0,0,1]:s.normal1),normal2=vector(s.normal2===undefined?[1,0,0]:s.normal2),constant1=finiteSetting(s.constant1,0,'constant1'),constant2=finiteSetting(s.constant2,0,'constant2'),r={normal1:normal1,normal2:normal2,constant1:constant1,constant2:constant2};
      if(!nonzero(normal1)||!nonzero(normal2)){r.relation='degenerate-plane';r.degenerateEquationEmpty=(!nonzero(normal1)&&constant1!==0)||(!nonzero(normal2)&&constant2!==0);return r;}
      var A=normal1.map(dyad),B=normal2.map(dyad),c1=dyad(constant1),c2=dyad(constant2),C=dCross(A,B);r.crossNorm=Math.hypot.apply(Math,C.map(dValue));r.crossNonzero=C.some(function(x){return x.n!==0n;});
      if(r.crossNonzero){r.relation='intersect';r.intersectionDirection=normalizedExact(C);var v=B.map(function(x,i){return minus(times(c1,x),times(c2,A[i]));}),numerators=dCross(v,C),den=dDot(C,C),point=numerators.map(function(x){return ratio(x,den);});if(point.every(finite))r.intersectionPoint=point;else r.intersectionUnrepresentable=true;r.conditionWarning=Math.hypot.apply(Math,cross(unit(normal1),unit(normal2)))<1e-8;return r;}
      var pivot=normal1.findIndex(function(x){return x!==0;}),compatible=minus(times(c2,A[pivot]),times(c1,B[pivot])).n===0n;r.relation=compatible?'coincident':'parallel';r.ratio=ratio(B[pivot],A[pivot]);return r;
    }

    function analyze(options) {
      var settings = objectSettings(options);
      var mode = settings.mode === undefined ? DEFAULTS.mode : settings.mode;
      if (mode !== "line-plane" && mode !== "plane-plane") throw new Error("Unknown geometry mode: " + mode);
      var scenario = scenarioById(mode, settings.scenario === undefined ? DEFAULTS.scenario : settings.scenario);
      var offset = finiteSetting(settings.offset, scenario.offset, "offset");
      var tilt = finiteSetting(settings.tilt, scenario.tilt, "tilt");
      if(Math.abs(offset)>2||Math.abs(tilt)>2)throw new RangeError("experiment parameters must be in [-2,2]; use linePlane/planePlane for general data");
      if (mode === "line-plane") {
        var normal = scenario.id === "zero-normal" ? [0, 0, 0] : [0, 0, 1];
        var direction = scenario.id === "zero-direction" ? [0, 0, 0] : [1, 0, tilt];
        var result = linePlane({
          normal: normal,
          planePoint: [0, 0, 0],
          point: [1, 1, offset],
          direction: direction
        });
        result.mode = mode;
        result.scenario = scenario;
        result.offsetParameter = offset;
        result.tilt = tilt;
        return result;
      }
      var normal2;
      var constant2;
      if (scenario.id === "zero-normal") {
        normal2 = [0, 0, 0];
        constant2 = 0;
      } else if (scenario.id === "cross") {
        normal2 = [1, 0, tilt];
        constant2 = offset;
      } else {
        normal2 = [0, 0, 2];
        constant2 = 2 * offset;
      }
      var planeResult = planePlane({
        normal1: [0, 0, 1],
        normal2: normal2,
        constant1: 0,
        constant2: constant2
      });
      planeResult.mode = mode;
      planeResult.scenario = scenario;
      planeResult.offsetParameter = offset;
      planeResult.tilt = tilt;
      return planeResult;
    }

    function relationLabel(relation) {
      return {
        intersect: "相交",
        parallel: "平行且不相交",
        contained: "直线包含于平面",
        coincident: "平面重合",
        "degenerate-plane": "退化：零法向量",
        "degenerate-line": "退化：零方向向量"
      }[relation] || relation;
    }

    function element(doc, tag, attrs, children) {
      var node = doc.createElement(tag);
      Object.keys(attrs || {}).forEach(function (key) {
        var value = attrs[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.setAttribute("class", value);
        else if (key === "text") node.textContent = value;
        else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
        else if (value === true) node.setAttribute(key, "");
        else node.setAttribute(key, String(value));
      });
      if (children !== undefined && children !== null) {
        (Array.isArray(children) ? children : [children]).forEach(function (child) {
          if (child === null || child === undefined) return;
          node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
        });
      }
      return node;
    }

    function replaceChildren(node, children) {
      while (node.firstChild) node.removeChild(node.firstChild);
      (Array.isArray(children) ? children : [children]).forEach(function (child) {
        if (child === null || child === undefined) return;
        node.appendChild(child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
      });
    }

    function svgNode(doc, tag, attrs, text) {
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, String(attrs[key])); });
      if (text !== undefined) node.textContent = text;
      return node;
    }

    function installStyle(doc) {
      if (doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement).appendChild(style);
    }

    function clipLine(point,direction,bounds){var lo=-Infinity,hi=Infinity;for(var j=0;j<2;j++){if(direction[j]===0){if(point[j]<bounds[j][0]||point[j]>bounds[j][1])return null;}else{var a=(bounds[j][0]-point[j])/direction[j],b=(bounds[j][1]-point[j])/direction[j];lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));}}if(lo>hi||!finite(lo)||!finite(hi))return null;return[point.map(function(v,j){return v+lo*direction[j];}),point.map(function(v,j){return v+hi*direction[j];})];}
    function geometrySvg(doc,data,uid){var isLine=data.mode==='line-plane',svg=svgNode(doc,'svg',{viewBox:'0 0 760 575',role:'img','aria-labelledby':uid+'-svg-title '+uid+'-svg-desc'}),left=70,top=60,w=560,h=420,bounds=[[-3,5],[-3,3]];function sx(x){return left+70*(x+3);}function sz(z){return top+70*(3-z);}function add(tag,attrs,text){var n=svgNode(doc,tag,attrs,text);svg.appendChild(n);return n;}function txt(x,y,text,attrs){add('text',Object.assign({x:x,y:y,'font-size':13},attrs||{}),text);}
      add('title',{id:uid+'-svg-title'},isLine?'直线与平面的平行截面 y=1':'两个平面的截面 y=0');add('desc',{id:uid+'-svg-desc'},'横轴x、纵轴z使用相同单位比例。金线为合法第一平面，蓝线为直线或第二平面截线，红点为视窗内交点。退化对象不伪造平面。');
      txt(20,25,isLine?'平行截面 y=1：横坐标 x，纵坐标 z':'截面 y=0：横坐标 x，纵坐标 z',{'font-size':15,'font-weight':700});
      for(var x=-3;x<=5;x++){add('line',{x1:sx(x),y1:top,x2:sx(x),y2:top+h,stroke:'currentColor','stroke-opacity':.13});txt(sx(x),top+h+22,String(x),{'text-anchor':'middle'});}
      for(var z=-3;z<=3;z++){add('line',{x1:left,y1:sz(z),x2:left+w,y2:sz(z),stroke:'currentColor','stroke-opacity':.13});txt(left-10,sz(z)+4,String(z),{'text-anchor':'end'});}
      txt(left+w+18,top+h+5,'x');txt(left-5,top-15,'z');
      function line(q,d,color,kind){var segment=clipLine(q,d,bounds);if(!segment)return;add('line',{'data-geometry':kind,x1:sx(segment[0][0]),y1:sz(segment[0][1]),x2:sx(segment[1][0]),y2:sz(segment[1][1]),stroke:color,'stroke-width':kind==='plane1'?5:2.6});}
      if(isLine){if(nonzero(data.normal))line([0,0],[1,0],'var(--vp-gold)','plane1');if(nonzero(data.direction))line([data.point[0],data.point[2]],[data.direction[0],data.direction[2]],'var(--vp-blue)','line');add('circle',{cx:sx(data.point[0]),cy:sz(data.point[2]),r:5,fill:'var(--vp-gold)',stroke:'var(--bg)','stroke-width':2});txt(sx(data.point[0])+8,sz(data.point[2])-9,'q');}
      else{line([0,0],[1,0],'var(--vp-gold)','plane1');if(nonzero(data.normal2)){var a=data.normal2[0],b=data.normal2[2],c=data.constant2;line(a!==0?[c/a,0]:[0,c/b],[-b,a],'var(--vp-blue)','plane2');}}
      var intersection=isLine?data.intersection:data.intersectionPoint,visible=intersection&&intersection[0]>=-3&&intersection[0]<=5&&intersection[2]>=-3&&intersection[2]<=3;
      if(visible)add('circle',{'data-intersection':'true',cx:sx(intersection[0]),cy:sz(intersection[2]),r:5,fill:'var(--vp-red)',stroke:'var(--bg)','stroke-width':2});
      var msg=data.relation==='intersect'?(visible?'红点为交点；精确关系由方程判定。':'交点在此视窗外；请读下表坐标，不能由截图推断不相交。'):relationLabel(data.relation)+'；图只显示合法对象。';
      txt(20,525,msg);txt(20,550,isLine?(!nonzero(data.normal)?'金：点 q；零法向未定义平面。蓝：合法直线的可见部分':!nonzero(data.direction)?'金：平面 z=0 截线与点 q；零方向只给出一个点':'金：平面 z=0 的截线与点 q；蓝：无限直线在视窗内的部分'):'金：P₁ 截线；蓝：P₂ 截线；红点沿 y 方向延伸成空间交线');return svg;
    }
    function linePlaneSvg(doc,data,uid){return geometrySvg(doc,Object.assign({mode:'line-plane'},data),uid);}
    function planePlaneSvg(doc,data,uid){return geometrySvg(doc,Object.assign({mode:'plane-plane'},data),uid);}

    function metric(doc, label, value, color) {
      return element(doc, "div", { className: "vp-metric " + (color || "") }, [
        element(doc, "span", { text: label }),
        element(doc, "strong", { text: value })
      ]);
    }

    function choiceQuestion(doc, refs, key, legendText, choices) {
      var fieldset = element(doc, "fieldset", { className: "vp-question" });
      fieldset.appendChild(element(doc, "legend", { text: legendText }));
      var row = element(doc, "div", { className: "vp-choice-row" });
      refs[key] = [];
      choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice.label });
        button.addEventListener("click", function () {
          refs.state.predictions[key] = choice.value;refs.state.revealed=false;refs.results.hidden=true;refs.controls.hidden=true;
          renderPrediction(refs);
        });
        refs[key].push({ value: choice.value, node: button });
        row.appendChild(button);
      });
      fieldset.appendChild(row);
      return fieldset;
    }

    function renderPrediction(refs) {
      ["objects", "orthogonal", "coincident"].forEach(function (key) {
        (refs[key] || []).forEach(function (item) {
          item.node.setAttribute("aria-pressed", refs.state.predictions[key] === item.value ? "true" : "false");
        });
      });
      var answered = ["objects", "orthogonal", "coincident"].every(function (key) {
        return refs.state.predictions[key] !== null;
      });
      refs.feedback.textContent = answered ? "三个预测已记录，可以揭示结果。" : "请先完成三个预测。";
      refs.feedback.className = "vp-feedback";
    }

    function renderScenarioOptions(refs) {
      var list = refs.state.mode === "plane-plane" ? PLANE_SCENARIOS : LINE_SCENARIOS;
      replaceChildren(refs.scenarioSelect, list.map(function (scenario) {
        return element(refs.doc, "option", { value: scenario.id, text: scenario.label });
      }));
      refs.scenarioSelect.value = refs.state.scenario;
      if (refs.scenarioSelect.value !== refs.state.scenario) {
        refs.state.scenario = list[0].id;
        refs.scenarioSelect.value = refs.state.scenario;
      }
    }

    function renderResults(refs) {
      var state = refs.state;
      var data = analyze({
        mode: state.mode,
        scenario: state.scenario,
        offset: state.offset,
        tilt: state.tilt
      });
      refs.modeSelect.value = state.mode;
      renderScenarioOptions(refs);
      refs.offsetInput.value = String(state.offset);
      refs.offsetOutput.textContent = formatNumber(state.offset, 2);
      refs.tiltInput.value = String(state.tilt);
      refs.tiltOutput.textContent = formatNumber(state.tilt, 2);
      var isDegenerate = data.relation.indexOf("degenerate") === 0;
      refs.summary.textContent = relationLabel(data.relation) + "。这是由非零性、点积/叉积和常数项共同决定的关系。";
      refs.summary.className = "vp-interpretation " + (isDegenerate ? "vp-warn" : data.relation === "intersect" ? "vp-ok" : "vp-interpretation");
      replaceChildren(refs.metrics, [
        metric(refs.doc, "模式", state.mode === "line-plane" ? "直线—平面" : "平面—平面", "vp-blue"),
        metric(refs.doc, "关系", relationLabel(data.relation), isDegenerate ? "vp-red" : data.relation === "intersect" ? "vp-green" : "vp-gold"),
        metric(refs.doc, state.mode === "line-plane" ? "n·d" : "‖n₁×n₂‖", scalarText(state.mode === "line-plane" ? data.denominator : data.crossNorm,state.mode === "line-plane" ? data.denominatorNonzero:data.crossNonzero), "vp-blue"),
        metric(refs.doc, "偏移参数", formatNumber(data.offsetParameter, 2), "vp-gold")
      ]);
      replaceChildren(refs.chart, [
        element(refs.doc, "h4", { text: state.mode === "line-plane" ? "直线与平面的 y=1 截面" : "两个平面的 y=0 截面" }),
        element(refs.doc, "div", { className: "vp-chart-frame",tabindex:"0",role:"region","aria-label":"可横向滚动的向量平面关系图" }, state.mode === "line-plane"
          ? linePlaneSvg(refs.doc, data, refs.uid)
          : planePlaneSvg(refs.doc, data, refs.uid))
      ]);
      var rows;
      if (state.mode === "line-plane") {
        rows = [
          ["点 q", vectorText(data.point), "位置，不是方向"],
          ["方向 d", vectorText(data.direction), "自由向量"],
          ["法向 n", vectorText(data.normal), "平面 P 的法向"],
          ["n·d", scalarText(data.denominator,data.denominatorNonzero), "为零时还要检查偏移"],
          ["n·(q−p)", scalarText(data.offset,data.offsetNonzero), relationLabel(data.relation)],
          ["参数 / 交点", data.relation!=="intersect" ? "—" : (data.parameter===undefined?"参数超出数值范围":formatNumber(data.parameter, 3)) + " / " + (data.intersection?vectorText(data.intersection):"交点超出数值范围"), "代入证书"]
        ];
      } else {
        rows = [
          ["n₁", vectorText(data.normal1), "P₁ 法向"],
          ["n₂", vectorText(data.normal2), "P₂ 法向"],
          ["常数 c₁,c₂", formatNumber(data.constant1, 3) + ", " + formatNumber(data.constant2, 3), "平面偏移"],
          ["n₁×n₂ 范数", scalarText(data.crossNorm,data.crossNonzero), "非零给出交线方向"],
          ["比例", data.ratio === undefined ? "—" : scalarText(data.ratio,true), "平行时比较常数"],
          ["交线一点 / 方向",data.intersectionPoint?vectorText(data.intersectionPoint)+" / "+vectorText(data.intersectionDirection):data.intersectionUnrepresentable?"超出数值范围":"—","方向已单位化；代入两个平面核对"]
        ];
      }
      replaceChildren(refs.ledgerBody, rows.map(function (row) {
        return element(refs.doc, "tr", {}, [
          element(refs.doc, "th", { scope: "row", text: row[0] }),
          element(refs.doc, "td", { text: row[1] }),
          element(refs.doc, "td", { text: row[2] })
        ]);
      }));
      refs.boundary.textContent =
        "对象先验必须保留：点 q 负责位置，d 负责自由方向，n 负责法向。" +
        (state.mode === "line-plane"
          ? " 当 n·d=0，偏移 n·(q−p) 才区分包含与平行。"
          : " 当 n₁×n₂=0，比例常数才区分重合与平行。") +
        " 零向量输入不定义通常的直线或平面。判定针对输入中实际表示的二进制数；不把小数自动当作零，测量误差需另建模型。"+(data.conditionWarning?" 当前近乎平行，交点对输入扰动很敏感。":"");
    }

    function mount(root, api) {
      if (!root || !root.ownerDocument) return;
      var doc = root.ownerDocument;
      installStyle(doc);
      var uid = "vp-" + (INSTANCE += 1);
      var state = {
        mode: DEFAULTS.mode,
        scenario: DEFAULTS.scenario,
        offset: DEFAULTS.offset,
        tilt: DEFAULTS.tilt,
        revealed: false,
        predictions: { objects: null, orthogonal: null, coincident: null }
      };
      var refs = { doc: doc, uid: uid, state: state };
      var shell = element(doc, "div", { className: "vp-shell" });
      shell.appendChild(element(doc, "h3", { text: "向量、平面与位置关系实验" }));
      shell.appendChild(element(doc, "p", { className: "vp-note", text: "先区分对象，再看点积、叉积和常数项。相交、平行、重合与退化不会由一个数字单独决定。" }));

      var prediction = element(doc, "section", { className: "vp-predict", "aria-labelledby": uid + "-predict-title" });
      prediction.appendChild(element(doc, "strong", { className: "vp-predict-title", id: uid + "-predict-title", text: "先预测，再揭示" }));
      var questionList = element(doc, "div", { className: "vp-question-list" });
      questionList.appendChild(choiceQuestion(doc, refs, "objects", "1. q 和 d 的身份是什么？", [
        { value: "separate", label: "q 是点，d 是自由向量" },
        { value: "same", label: "都是同一个点" },
        { value: "normal", label: "d 必须是法向" }
      ]));
      questionList.appendChild(choiceQuestion(doc, refs, "orthogonal", "2. n·d=0 是否足以说明直线在平面内？", [
        { value: "need-offset", label: "不够，还要查点偏移" },
        { value: "contained", label: "足够，必在平面内" },
        { value: "intersect", label: "足够，必相交" }
      ]));
      questionList.appendChild(choiceQuestion(doc, refs, "coincident", "3. 平行法向量何时对应重合平面？", [
        { value: "coincident", label: "常数也按同一比例" },
        { value: "always-parallel", label: "法向平行就重合" },
        { value: "never", label: "平面永不重合" }
      ]));
      prediction.appendChild(questionList);
      var actions = element(doc, "div", { className: "vp-actions" });
      var reveal = element(doc, "button", { type: "button", className: "vp-primary", text: "揭示并核对" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      prediction.appendChild(actions);
      refs.feedback = element(doc, "p", { className: "vp-feedback", "aria-live": "polite", text: "请先完成三个预测。" });
      prediction.appendChild(refs.feedback);
      shell.appendChild(prediction);

      var controls = element(doc, "section", { className: "vp-controls", hidden: true, "aria-label": "向量和平面参数" });
      refs.controls=controls;
      refs.modeSelect = element(doc, "select", { "aria-label": "选择几何关系模式" });
      refs.modeSelect.appendChild(element(doc, "option", { value: "line-plane", text: "直线—平面" }));
      refs.modeSelect.appendChild(element(doc, "option", { value: "plane-plane", text: "平面—平面" }));
      refs.scenarioSelect = element(doc, "select", { "aria-label": "选择关系场景" });
      refs.offsetInput = element(doc, "input", { type: "range", min: "-2", max: "2", step: "0.25", value: String(DEFAULTS.offset), "aria-label": "位置偏移参数" });
      refs.offsetOutput = element(doc, "output", { text: formatNumber(DEFAULTS.offset, 2) });
      refs.tiltInput = element(doc, "input", { type: "range", min: "-2", max: "2", step: "0.25", value: String(DEFAULTS.tilt), "aria-label": "方向或法向倾斜参数" });
      refs.tiltOutput = element(doc, "output", { text: formatNumber(DEFAULTS.tilt, 2) });
      controls.appendChild(element(doc, "div", { className: "vp-control" }, [element(doc, "label", { text: "关系模式" }), refs.modeSelect]));
      controls.appendChild(element(doc, "div", { className: "vp-control" }, [element(doc, "label", { text: "场景" }), refs.scenarioSelect]));
      controls.appendChild(element(doc, "div", { className: "vp-control" }, [element(doc, "label", {}, ["偏移 = ", refs.offsetOutput]), refs.offsetInput]));
      controls.appendChild(element(doc, "div", { className: "vp-control" }, [element(doc, "label", {}, ["倾斜 = ", refs.tiltOutput]), refs.tiltInput]));
      shell.appendChild(controls);

      var results = element(doc, "section", { className: "vp-results", hidden: true, tabindex:"-1", "aria-labelledby": uid + "-results-title" });
      refs.results = results;
      results.appendChild(element(doc, "h4", { id: uid + "-results-title", text: "揭示后的证据账本" }));
      refs.summary = element(doc, "p", { className: "vp-interpretation", "aria-live": "polite" });
      results.appendChild(refs.summary);
      refs.metrics = element(doc, "div", { className: "vp-metrics" });
      results.appendChild(refs.metrics);
      var grid = element(doc, "div", { className: "vp-grid" });
      refs.chart = element(doc, "div");
      grid.appendChild(refs.chart);
      var ledger = element(doc, "div", { className: "vp-ledger",tabindex:"0",role:"region","aria-label":"可横向滚动的向量平面读数" });
      var table = element(doc, "table", { "aria-label": "向量和平面关系账本" });
      table.appendChild(element(doc, "caption", { text: "点、方向、法向和关系判定的证据" }));
      table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
        element(doc, "th", { scope: "col", text: "量" }),
        element(doc, "th", { scope: "col", text: "当前值" }),
        element(doc, "th", { scope: "col", text: "几何读法" })
      ])));
      refs.ledgerBody = element(doc, "tbody");
      table.appendChild(refs.ledgerBody);
      ledger.appendChild(table);
      grid.appendChild(ledger);
      results.appendChild(grid);
      refs.boundary = element(doc, "p", { className: "vp-boundary" });
      results.appendChild(refs.boundary);
      shell.appendChild(results);
      root.classList.add("vp-lab");
      root.replaceChildren(shell);

      function render() {
        controls.hidden = !state.revealed;
        results.hidden = !state.revealed;
        renderPrediction(refs);
        if (state.revealed) renderResults(refs);
      }

      reveal.addEventListener("click", function () {
        var answers = { objects: "separate", orthogonal: "need-offset", coincident: "coincident" };
        var keys = ["objects", "orthogonal", "coincident"];
        var missing = keys.filter(function (key) { return state.predictions[key] === null; });
        if (missing.length) {
          refs.feedback.textContent = "还缺少 " + missing.length + " 个预测。";
          refs.feedback.className = "vp-feedback vp-warn";
          return;
        }
        state.revealed = true;
        render();
        var hits = keys.filter(function (key) { return state.predictions[key] === answers[key]; }).length;
        refs.feedback.textContent = "已揭示：" + hits + "/3 个预测命中；位置关系需要完整的代入条件。";
        refs.feedback.className = "vp-feedback " + (hits === 3 ? "vp-pass" : "vp-warn");
        results.focus();
        if (api && typeof api.announce === "function") api.announce(root, refs.feedback.textContent);
      });
      reset.addEventListener("click", function () {
        state = {
          mode: DEFAULTS.mode,
          scenario: DEFAULTS.scenario,
          offset: DEFAULTS.offset,
          tilt: DEFAULTS.tilt,
          revealed: false,
          predictions: { objects: null, orthogonal: null, coincident: null }
        };
        refs.state = state;
        render();refs.objects[0].node.focus();
      });
      refs.modeSelect.addEventListener("change", function () {
        state.mode = refs.modeSelect.value;
        var list = state.mode === "plane-plane" ? PLANE_SCENARIOS : LINE_SCENARIOS;
        state.scenario = list[0].id;
        state.offset = list[0].offset;
        state.tilt = list[0].tilt;
        if (state.revealed) renderResults(refs);
      });
      refs.scenarioSelect.addEventListener("change", function () {
        state.scenario = refs.scenarioSelect.value;
        var scenario = scenarioById(state.mode, state.scenario);
        state.offset = scenario.offset;
        state.tilt = scenario.tilt;
        if (state.revealed) renderResults(refs);
      });
      refs.offsetInput.addEventListener("input", function () {
        state.offset = Number(refs.offsetInput.value);
        if (state.revealed) renderResults(refs);
      });
      refs.tiltInput.addEventListener("input", function () {
        state.tilt = Number(refs.tiltInput.value);
        if (state.revealed) renderResults(refs);
      });
      renderScenarioOptions(refs);
      render();
    }

    function selfTest() {
      var checks = 0;
      function assert(condition, message) {
        checks += 1;
        if (!condition) throw new Error(message);
      }
      function close(actual, expected, tolerance, message) {
        checks += 1;
        if (!finite(actual) || Math.abs(actual - expected) > tolerance) {
          throw new Error(message + ": " + actual + " vs " + expected);
        }
      }

      var crossResult = analyze({ mode: "line-plane", scenario: "cross", offset: 1, tilt: 1 });
      assert(crossResult.relation === "intersect", "line-plane intersection");
      close(crossResult.parameter, -1, 1e-12, "line-plane parameter");
      close(crossResult.intersection[2], 0, 1e-12, "line-plane intersection height");

      var parallelResult = analyze({ mode: "line-plane", scenario: "parallel", offset: 1, tilt: 0 });
      assert(parallelResult.relation === "parallel", "line-plane parallel");
      var containedResult = analyze({ mode: "line-plane", scenario: "contained", offset: 0, tilt: 0 });
      assert(containedResult.relation === "contained", "line-plane contained");
      assert(analyze({ mode: "line-plane", scenario: "zero-direction" }).relation === "degenerate-line", "zero direction");
      assert(analyze({ mode: "line-plane", scenario: "zero-normal" }).relation === "degenerate-plane", "zero normal");

      assert(analyze({ mode: "plane-plane", scenario: "cross", offset: 0, tilt: 0 }).relation === "intersect", "plane intersection");
      assert(analyze({ mode: "plane-plane", scenario: "coincident", offset: 0 }).relation === "coincident", "plane coincidence");
      assert(analyze({ mode: "plane-plane", scenario: "parallel", offset: 1 }).relation === "parallel", "plane parallel");
      assert(analyze({ mode: "plane-plane", scenario: "zero-normal" }).relation === "degenerate-plane", "plane degeneracy");
      close(dot([0, 0, 1], [1, 0, 2]), 2, 1e-12, "dot product");
      assert(norm(cross([0, 0, 1], [1, 0, 0])) === 1, "cross product");

      var rejected = false;
      try { analyze({ mode: "missing", scenario: "cross" }); } catch (error) { rejected = true; }
      assert(rejected, "unknown mode rejected");
      rejected = false;
      try { linePlane({ normal: [0, 0, NaN], planePoint: [0, 0, 0], point: [0, 0, 0], direction: [1, 0, 0] }); } catch (error) { rejected = error instanceof RangeError; }
      assert(rejected, "nonfinite vector rejected");
      return { checks: checks, scenarios: LINE_SCENARIOS.length + PLANE_SCENARIOS.length };
    }

    return {
      formatNumber:formatNumber,linePlaneSvg:linePlaneSvg,planePlaneSvg:planePlaneSvg,clipLine:clipLine,
      DEFAULTS: DEFAULTS,
      LINE_SCENARIOS: LINE_SCENARIOS,
      PLANE_SCENARIOS: PLANE_SCENARIOS,
      linePlane: linePlane,
      planePlane: planePlane,
      analyze: analyze,
      mount: mount,
      selfTest: selfTest
    };
  }
);

(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("quadric-sections", exported.mount);
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
        "quadric-sections self-test: PASS (" +
          report.checks +
          " checks, " +
          report.models +
          " models)"
      );
    } catch (error) {
      console.error("quadric-sections self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : null,
  function (host) {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "cl-quadric-sections-style";
    var INSTANCE = 0;
    var DEFAULTS = { modelId: "ellipsoid", axis: 2, slice: 0, angle: 25 };

    var MODELS = [
      {
        id: "ellipsoid",
        label: "椭球：(+,+,+), ρ=1",
        lambda: [1, 2, 3],
        linear: [0, 0, 0],
        rho: 1,
        center: [0.4, -0.3, 0.2],
        angle: 25,
        global: "椭球面"
      },
      {
        id: "one-sheet",
        label: "单叶双曲面：(+,+,−), ρ=1",
        lambda: [1, 1, -1],
        linear: [0, 0, 0],
        rho: 1,
        center: [0, 0, 0],
        angle: -20,
        global: "单叶双曲面"
      },
      {
        id: "two-sheet",
        label: "双叶双曲面：(+,-,-), ρ=1",
        lambda: [1, -1, -1],
        linear: [0, 0, 0],
        rho: 1,
        center: [0, 0, 0],
        angle: 15,
        global: "双叶双曲面"
      },
      {
        id: "cone",
        label: "二次锥面：(+,+,−), ρ=0",
        lambda: [1, 1, -1],
        linear: [0, 0, 0],
        rho: 0,
        center: [0, 0, 0],
        angle: 10,
        global: "二次锥面"
      },
      {
        id: "paraboloid",
        label: "椭圆抛物面：u²+v²−w=0",
        lambda: [1, 1, 0],
        linear: [0, 0, -1],
        rho: 0,
        center: [0, 0, 0],
        angle: 0,
        global: "椭圆抛物面"
      }
    ];

    MODELS=MODELS.concat([{"id": "saddle", "label": "双曲抛物面", "lambda": [1, -1, 0], "linear": [0, 0, -1], "rho": 0, "center": [0, 0, 0], "angle": 0, "global": "双曲抛物面"}, {"id": "elliptic-cylinder", "label": "椭圆柱面", "lambda": [1, 2, 0], "linear": [0, 0, 0], "rho": 1, "center": [0, 0, 0], "angle": 0, "global": "椭圆柱面"}, {"id": "hyperbolic-cylinder", "label": "双曲柱面", "lambda": [1, -1, 0], "linear": [0, 0, 0], "rho": 1, "center": [0, 0, 0], "angle": 0, "global": "双曲柱面"}, {"id": "parabolic-cylinder", "label": "抛物柱面", "lambda": [1, 0, 0], "linear": [0, -1, 0], "rho": 0, "center": [0, 0, 0], "angle": 0, "global": "抛物柱面"}, {"id": "point", "label": "单点", "lambda": [1, 2, 3], "linear": [0, 0, 0], "rho": 0, "center": [0, 0, 0], "angle": 0, "global": "单点"}, {"id": "intersecting-planes", "label": "相交平面对", "lambda": [1, -1, 0], "linear": [0, 0, 0], "rho": 0, "center": [0, 0, 0], "angle": 0, "global": "相交平面对"}, {"id": "parallel-planes", "label": "平行平面对", "lambda": [1, 0, 0], "linear": [0, 0, 0], "rho": 1, "center": [0, 0, 0], "angle": 0, "global": "平行平面对"}, {"id": "double-plane", "label": "重合平面", "lambda": [1, 0, 0], "linear": [0, 0, 0], "rho": 0, "center": [0, 0, 0], "angle": 0, "global": "重合平面"}, {"id": "empty", "label": "空集", "lambda": [1, 2, 3], "linear": [0, 0, 0], "rho": -1, "center": [0, 0, 0], "angle": 0, "global": "空集"}]);
    MODELS.forEach(function(m){[m.lambda,m.linear,m.center].forEach(Object.freeze);Object.freeze(m);});Object.freeze(MODELS);

    var STYLE_TEXT = [
      ".qs-lab{--qs-blue:var(--cl-blue,#315f9d);--qs-gold:var(--cl-gold,#9b6a12);--qs-green:var(--cl-green,#39734d);--qs-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
      ".qs-lab *,.qs-lab *::before,.qs-lab *::after{box-sizing:border-box;}.qs-lab [hidden]{display:none!important;}",
      ".qs-lab h3,.qs-lab h4{margin:0;color:var(--fg);letter-spacing:0;}.qs-lab h3{font-size:1.18rem;}.qs-lab h4{margin-top:16px;font-size:1rem;}",
      ".qs-lab p{margin:.65em 0;}.qs-lab .qs-note,.qs-lab .qs-feedback,.qs-lab .qs-boundary{color:var(--fg-soft);font-size:13px;line-height:1.7;}",
      ".qs-lab button,.qs-lab select,.qs-lab input{font:inherit;letter-spacing:0;}.qs-lab button,.qs-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere;}",
      ".qs-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}.qs-lab button:hover{border-color:var(--accent);}.qs-lab button[aria-pressed=\"true\"],.qs-lab button.qs-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}.qs-lab button:focus-visible,.qs-lab select:focus-visible,.qs-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
      ".qs-lab .qs-predict{margin:14px 0;padding:13px 14px;border-left:3px solid var(--qs-gold);background:var(--bg);}.qs-lab .qs-predict-title{display:block;margin-bottom:10px;font-size:13px;}.qs-lab .qs-question-list{display:grid;gap:12px;}.qs-lab .qs-question{min-width:0;margin:0;padding:0;border:0;}.qs-lab .qs-question legend{max-width:100%;margin-bottom:7px;color:var(--fg);font-size:12.5px;font-weight:700;overflow-wrap:anywhere;}.qs-lab .qs-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}.qs-lab .qs-choice-row button{font-size:12px;}",
      ".qs-lab .qs-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}.qs-lab .qs-actions>*{flex:1 1 155px;}.qs-lab .qs-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}.qs-lab .qs-pass,.qs-lab .qs-ok{color:var(--qs-green);}.qs-lab .qs-warn,.qs-lab .qs-fail{color:var(--qs-red);}",
      ".qs-lab .qs-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:12px 16px;margin:14px 0;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}.qs-lab .qs-control{display:grid;gap:5px;min-width:0;}.qs-lab .qs-control label{color:var(--fg-soft);font-size:13px;font-weight:700;}.qs-lab .qs-control output{color:var(--accent);font-variant-numeric:tabular-nums;}",
      ".qs-lab .qs-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0;}.qs-lab .qs-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.qs-lab .qs-metric.qs-blue{border-top-color:var(--qs-blue);}.qs-lab .qs-metric.qs-gold{border-top-color:var(--qs-gold);}.qs-lab .qs-metric.qs-green{border-top-color:var(--qs-green);}.qs-lab .qs-metric.qs-red{border-top-color:var(--qs-red);}.qs-lab .qs-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4;}.qs-lab .qs-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
      ".qs-lab .qs-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.qs-lab .qs-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;margin-top:12px;}.qs-lab .qs-chart-frame{min-width:0;padding:7px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow-x:auto;}.qs-lab svg{display:block;width:100%;min-width:760px;max-width:none;height:auto;color:var(--fg);}.qs-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.qs-lab .qs-ledger{max-width:100%;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.qs-lab table{display:table;width:100%;min-width:760px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.qs-lab th,.qs-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere;}.qs-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750;}.qs-lab .qs-interpretation{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--qs-green);background:var(--bg);font-size:13px;line-height:1.7;}",
      "@media(max-width:820px){.qs-lab .qs-controls{grid-template-columns:repeat(2,minmax(0,1fr));}}",
      "@media(max-width:560px){.qs-lab .qs-controls,.qs-lab .qs-grid{grid-template-columns:minmax(0,1fr);}.qs-lab .qs-choice-row{grid-template-columns:minmax(0,1fr);}}",
      "@media(max-width:420px){.qs-lab .qs-predict{padding-left:11px;padding-right:11px;}.qs-lab th,.qs-lab td{padding-left:5px;padding-right:5px;}}",
      "@media(prefers-reduced-motion:reduce){.qs-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
    ].join("\n");

    STYLE_TEXT+='\n[data-theme="dark"] .qs-lab{--qs-blue:#8ab6e8;--qs-gold:#e0bc67;--qs-green:#8bc4a0;--qs-red:#f09b8e}.qs-chart-frame:focus-visible,.qs-ledger:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}';
    function finite(value) {
      return typeof value === "number" && isFinite(value);
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function formatNumber(value, digits) {
      if (!finite(value)) return "—";
      if(value!==0&&(Math.abs(value)<.001||Math.abs(value)>=10000))return value.toExponential(4);
      var text = Number(value).toFixed(digits === undefined ? 3 : digits);
      return (text.includes(".")?text.replace(/0+$/, "").replace(/\.$/, ""):text).replace(/^-0$/,"0");
    }

    function modelById(id) {
      for (var i = 0; i < MODELS.length; i += 1) {
        if (MODELS[i].id === id) return MODELS[i];
      }
      throw new Error("Unknown quadric model: " + id);
    }

    function axisName(axis) {
      return ["u", "v", "w"][axis];
    }

    function remainingAxes(axis) {
      return [0, 1, 2].filter(function (value) { return value !== axis; });
    }

    function rotationMatrix(angle) {
      boundedNumber(angle,-360,360,"angle");var t = angle * Math.PI / 180;
      var c = Math.cos(t), s = Math.sin(t);
      return [[c, -s, 0], [s, c, 0], [0, 0, 1]];
    }

    function rotatePoint(point, angle) {
      var matrix = rotationMatrix(angle);
      return [
        matrix[0][0] * point[0] + matrix[0][1] * point[1] + matrix[0][2] * point[2],
        matrix[1][0] * point[0] + matrix[1][1] * point[1] + matrix[1][2] * point[2],
        matrix[2][0] * point[0] + matrix[2][1] * point[1] + matrix[2][2] * point[2]
      ];
    }

    function add3(a, b) {
      return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    }

    function subtract3(a, b) {
      return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    }

    function dot3(a, b) {
      return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }

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
    function boundedNumber(value,lo,hi,label){if(!finite(value)||value<lo||value>hi)throw new RangeError(label+' outside supported range');return value;}
    function sqrtExactRatio(a,b){if(a.n===0n)return 0;var x=parts(a),y=parts(b),m=Math.abs(x.m/y.m),e=x.e-y.e;if(e%2!==0){m*=2;e--;}return scaledFloat(Math.sqrt(m),e/2);}
    function sectionKind(a,b,l1,l2,rhs,exactRhs){
      [a,b,l1,l2,rhs].forEach(function(x){if(!finite(x))throw new RangeError('finite conic coefficients required');});
      var coefficients=[a,b],linear=[l1,l2],num=exactRhs||dyad(rhs),den=dyad(1),center=[0,0];
      coefficients.forEach(function(c,i){if(c!==0){var divisor=times(dyad(4),dyad(c));num=plus(times(num,divisor),times(times(dyad(linear[i]),dyad(linear[i])),den));den=times(den,divisor);center[i]=ratio(neg(dyad(linear[i])),times(dyad(2),dyad(c)));}});
      var sign=num.n===0n?0:(num.n>0n?1:-1)*(den.n>0n?1:-1),kind;
      if(a!==0&&b!==0){if((a>0)===(b>0))kind=sign===0?'point':sign===(a>0?1:-1)?'ellipse':'empty';else kind=sign===0?'pair-of-lines':'hyperbola';}
      else if(a!==0||b!==0){var qi=a!==0?0:1;if(linear[1-qi]!==0)kind='parabola';else kind=sign===0?'double-line':sign===(coefficients[qi]>0?1:-1)?'parallel-lines':'empty';}
      else kind=l1!==0||l2!==0?'line':sign===0?'whole-plane':'empty';
      return {a:a,b:b,l1:l1,l2:l2,rhs:rhs,rhsNonzero:(exactRhs||dyad(rhs)).n!==0n,shiftedRhs:ratio(num,den),shiftedSign:sign,center:center,kind:kind,
        radii:coefficients.map(function(c){return c===0?null:sqrtExactRatio(num,times(den,dyad(c)));})};
    }

    function kindLabel(kind) {
      return {
        ellipse: "椭圆",
        point: "一点",
        empty: "空集",
        hyperbola: "双曲线",
        "pair-of-lines": "相交直线对",
        parabola: "抛物线",
        "parallel-lines": "平行直线对",
        "double-line": "重合直线",
        line: "直线",
        "whole-plane": "整平面"
      }[kind] || kind;
    }

    function equationText(section) {
      return formatNumber(section.a, 2) + " X² + " + formatNumber(section.b, 2) + " Y² + " +
        formatNumber(section.l1, 2) + " X + " + formatNumber(section.l2, 2) + " Y = " +
        (section.rhs===0&&section.rhsNonzero?"非零（数值下溢）":formatNumber(section.rhs, 4));
    }

    function analyze(options) {
      var settings=options===undefined?{}:options;if(!settings||typeof settings!=="object"||Array.isArray(settings))throw new TypeError("options must be object");
      var model = modelById(settings.modelId === undefined ? DEFAULTS.modelId : settings.modelId);
      var axis = (settings.axis === undefined ? DEFAULTS.axis : settings.axis);
      var slice = (settings.slice === undefined ? DEFAULTS.slice : settings.slice);
      var angle = (settings.angle === undefined ? model.angle : settings.angle);
      if (!finite(axis) || Math.floor(axis) !== axis || axis < 0 || axis > 2) {
        throw new Error("Axis must be an integer from 0 to 2");
      }
      boundedNumber(slice,-4,4,"slice");
      boundedNumber(angle,-360,360,"angle");
      var rest = remainingAxes(axis);
      var symbolic=settings.slicePreset==="positive-tangent";
      if(settings.slicePreset!==undefined&&settings.slicePreset!==null&&!symbolic)throw new RangeError("unknown slice preset");
      if(symbolic){if(model.id!=="ellipsoid"||axis!==2)throw new RangeError("symbolic tangent requires ellipsoid w slice");slice=1/Math.sqrt(3);}
      var S=dyad(slice),rhsExact=symbolic?dyad(0):minus(minus(dyad(model.rho),times(dyad(model.lambda[axis]),times(S,S))),times(dyad(model.linear[axis]),S));
      var rhs=dValue(rhsExact);
      var section = sectionKind(
        model.lambda[rest[0]],
        model.lambda[rest[1]],
        model.linear[rest[0]],
        model.linear[rest[1]],
        rhs,rhsExact
      );
      var rotation = rotationMatrix(angle);
      var principalU = [rotation[0][0], rotation[1][0], rotation[2][0]];
      var principalV = [rotation[0][1], rotation[1][1], rotation[2][1]];
      var principalW = [rotation[0][2], rotation[1][2], rotation[2][2]];
      return {
        model: model,
        symbolicSlice:symbolic,
        axis: axis,
        axisLabel: axisName(axis),
        slice: slice,
        angle: angle,
        rest: rest,
        rhs: rhs,
        section: section,
        sectionLabel: kindLabel(section.kind),
        signature: model.lambda.map(function (value) { return value > 0 ? "+" : value < 0 ? "−" : "0"; }).join(" "),
        center: model.center,
        principalAxes: [principalU, principalV, principalW],
        rotation: rotation,
        hasCenter:model.linear.every(function(v,i){return model.lambda[i]!==0||v===0;}),
        centerUnique:model.lambda.every(function(v){return v!==0;}),
        worldPlaneNormal:[rotation[0][axis],rotation[1][axis],rotation[2][axis]],
        worldPlaneConstant:slice+dot3([rotation[0][axis],rotation[1][axis],rotation[2][axis]],model.center)
      };
    }

    function sectionPoint(data, point) {
      var principal = [0, 0, 0];
      principal[data.rest[0]] = point[0];
      principal[data.rest[1]] = point[1];
      principal[data.axis] = data.slice;
      var rotated = rotatePoint(principal, data.angle);
      return add3(rotated, data.center);
    }

    function projectSectionPoint(data, point) {
      var worldPoint = sectionPoint(data, point);
      var worldOrigin = sectionPoint(data, [0, 0]);
      var offset = subtract3(worldPoint, worldOrigin);
      return [
        dot3(offset, data.principalAxes[data.rest[0]]),
        dot3(offset, data.principalAxes[data.rest[1]])
      ];
    }

    function sectionCurve(data){
      var s=data.section,a=s.a,b=s.b,l1=s.l1,l2=s.l2,points=[];
      function sample(fn,lo,hi,n){for(var i=0;i<=n;i++)points.push(fn(lo+(hi-lo)*i/n));points.push(null);}
      if(s.kind==='ellipse')sample(function(t){return[s.center[0]+s.radii[0]*Math.cos(t),s.center[1]+s.radii[1]*Math.sin(t)];},0,2*Math.PI,360);
      else if(s.kind==='hyperbola'){
        var active=s.shiftedSign===(a>0?1:-1)?0:1,other=1-active;
        var coeff=[a,b],slope=Math.sqrt(Math.abs(coeff[other]/coeff[active]));
        [-1,1].forEach(function(sign){sample(function(t){var p=s.center.slice();p[active]+=sign*Math.hypot(s.radii[active],slope*(t-s.center[other]));p[other]=t;return p;},-4,4,800);});
      }else if(s.kind==='parabola'){
        var qi=a!==0?0:1,coefficient=qi===0?a:b,linear=qi===0?l2:l1,ownLinear=qi===0?l1:l2;
        sample(function(t){var p=[];p[qi]=t;p[1-qi]=(s.rhs-coefficient*t*t-ownLinear*t)/linear;return p;},-4,4,400);
      }else if(s.kind==='pair-of-lines'){
        var slope=Math.sqrt(Math.abs(a))/Math.sqrt(Math.abs(b));[-1,1].forEach(function(sign){sample(function(t){return[s.center[0]+t,s.center[1]+sign*slope*t];},-4,4,2);});
      }else if(s.kind==='parallel-lines'||s.kind==='double-line'){
        var q=a!==0?0:1;(s.kind==='double-line'?[0]:[-s.radii[q],s.radii[q]]).forEach(function(offset){sample(function(t){var p=[];p[q]=s.center[q]+offset;p[1-q]=t;return p;},-4,4,2);});
      }else if(s.kind==='line'){
        sample(function(t){return Math.abs(l2)>=Math.abs(l1)?[t,(s.rhs-l1*t)/l2]:[(s.rhs-l2*t)/l1,t];},-4,4,2);
      }else if(s.kind==='point')points.push(s.center);
      return points;
    }
    function contourSvg(doc,data,uid){
      var svg=svgNode(doc,'svg',{viewBox:'0 0 760 665',role:'img','aria-labelledby':uid+'-svg-title '+uid+'-svg-desc'}),left=100,top=70,size=480;
      function add(tag,attrs,text){var el=svgNode(doc,tag,attrs,text);svg.appendChild(el);return el;}function txt(x,y,text,attrs){add('text',Object.assign({x:x,y:y,'font-size':13},attrs||{}),text);}
      function X(v){return left+60*(v+4);}function Y(v){return top+60*(4-v);}
      add('title',{id:uid+'-svg-title'},'主轴坐标中的实际切片');add('desc',{id:uid+'-svg-desc'},'横纵坐标单位比例相同，窗口均为负4到4。曲线经绘图区域裁剪，坐标架随模型旋转；空图不自动表示空集。');
      var defs=add('defs',{}),clip=svgNode(doc,'clipPath',{id:uid+'-clip'});clip.appendChild(svgNode(doc,'rect',{x:left,y:top,width:size,height:size}));defs.appendChild(clip);
      txt(25,28,(data.symbolicSlice?'w=1/√3（符号预设）':data.axisLabel+'='+formatNumber(data.slice,4))+'：'+data.sectionLabel,{'font-size':16,'font-weight':700});
      txt(25,50,'截面坐标 X='+axisName(data.rest[0])+'，Y='+axisName(data.rest[1])+'；同为主轴单位坐标');
      for(var t=-4;t<=4;t++){add('line',{x1:X(t),x2:X(t),y1:top,y2:top+size,stroke:'currentColor','stroke-opacity':t===0?.5:.12});add('line',{x1:left,x2:left+size,y1:Y(t),y2:Y(t),stroke:'currentColor','stroke-opacity':t===0?.5:.12});txt(X(t),top+size+24,String(t),{'text-anchor':'middle'});txt(left-15,Y(t)+4,String(t),{'text-anchor':'end'});}
      txt(left+size+20,top+size+4,'X');txt(left-3,top-12,'Y');
      var group=add('g',{'clip-path':'url(#'+uid+'-clip)'}),points=sectionCurve(data),path='',open=false;
      points.forEach(function(p){if(!p||!p.every(finite)){open=false;return;}path+=(open?'L':'M')+X(p[0])+' '+Y(p[1])+' ';open=true;});
      if(path)group.appendChild(svgNode(doc,'path',{d:path,fill:'none',stroke:'var(--qs-blue)','stroke-width':2.6,'data-contour':'true'}));
      if(data.section.kind==='point')group.appendChild(svgNode(doc,'circle',{cx:X(data.section.center[0]),cy:Y(data.section.center[1]),r:5,fill:'var(--qs-red)'}));
      if(data.section.kind==='whole-plane')group.appendChild(svgNode(doc,'rect',{x:left,y:top,width:size,height:size,fill:'var(--qs-blue)','fill-opacity':.15}));
      if(data.section.kind==='empty'||data.section.kind==='whole-plane')txt(left+size/2,top+size/2,data.section.kind==='empty'?'无实点':'整个切平面都满足方程',{'text-anchor':'middle','font-size':17});
      txt(25,606,'固定视窗 [−4,4]²；曲线超出视窗的部分未画出。');
      txt(25,630,'旋转时图轴随主轴一起转动，轮廓不变；世界切平面见下表。');
      txt(25,652,data.symbolicSlice?'此按钮按精确代数切点计算；滑动后恢复普通数值输入。':'分类针对输入数值，不把接近零的右端直接改为零。');return svg;
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

    function metric(doc, label, value, color) {
      return element(doc, "div", { className: "qs-metric " + (color || "") }, [
        element(doc, "span", { text: label }),
        element(doc, "strong", { text: value })
      ]);
    }

    function choiceQuestion(doc, refs, key, legendText, choices) {
      var fieldset = element(doc, "fieldset", { className: "qs-question" });
      fieldset.appendChild(element(doc, "legend", { text: legendText }));
      var row = element(doc, "div", { className: "qs-choice-row" });
      refs[key] = [];
      choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice.label });
        button.addEventListener("click", function () {
          refs.state.predictions[key] = choice.value;refs.state.revealed=false;refs.controls.hidden=true;refs.results.hidden=true;
          renderPrediction(refs);
        });
        refs[key].push({ value: choice.value, node: button });
        row.appendChild(button);
      });
      fieldset.appendChild(row);
      return fieldset;
    }

    function renderPrediction(refs) {
      ["signature", "moves", "slice"].forEach(function (key) {
        (refs[key] || []).forEach(function (item) {
          item.node.setAttribute("aria-pressed", refs.state.predictions[key] === item.value ? "true" : "false");
        });
      });
      var answered = ["signature", "moves", "slice"].every(function (key) {
        return refs.state.predictions[key] !== null;
      });
      refs.feedback.textContent = answered ? "三个预测已记录，可以揭示结果。" : "请先完成三个预测。";
      refs.feedback.className = "qs-feedback";
    }

    function renderResults(refs) {
      var state = refs.state;
      var data = analyze({ modelId: state.modelId, axis: state.axis, slice: state.slice, angle: state.angle, slicePreset:state.slicePreset });
      refs.modelSelect.value = state.modelId;
      refs.axisSelect.value = String(state.axis);
      refs.sliceInput.value = String(state.slice);
      refs.sliceOutput.textContent = data.symbolicSlice?"1/√3 ≈ "+formatNumber(data.slice,6):formatNumber(state.slice,4);
      refs.angleInput.value = String(state.angle);
      refs.angleOutput.textContent = formatNumber(state.angle, 1);
      refs.summary.textContent =
        data.model.global + "；当前 " + (data.symbolicSlice?"w=1/√3（符号预设）":data.axisLabel + "=" + formatNumber(data.slice, 4)) +
        " 的截面是" + data.sectionLabel + "。图像只呈现这个截面的证据。";
      refs.summary.className = "qs-interpretation " + (data.section.kind === "empty" ? "qs-warn" : "qs-ok");
      replaceChildren(refs.metrics, [
        metric(refs.doc, "全局模型", data.model.global, "qs-blue"),
        metric(refs.doc, "特征值符号", data.signature, "qs-gold"),
        metric(refs.doc, "配方中心",data.hasCenter?(data.centerUnique?"唯一":"不唯一：沿零方向"):"不存在（有顶点或顶线）", "qs-blue"),
        metric(refs.doc, "主轴旋转", formatNumber(data.angle, 1) + "°", "qs-green"),
        metric(refs.doc, "当前截面", data.sectionLabel, data.section.kind === "empty" ? "qs-red" : "qs-green")
      ]);
      replaceChildren(refs.chart, [
        element(refs.doc, "h4", { text: "随主轴转动的截面坐标图" }),
        element(refs.doc, "div", { className: "qs-chart-frame",tabindex:"0",role:"region","aria-label":"可横向滚动的二次曲面截面图" }, contourSvg(refs.doc, data, refs.uid))
      ]);
      var axes = data.principalAxes;
      var rows = [
        ["二次项 λ", data.model.lambda.map(function (value) { return formatNumber(value, 2); }).join(", "), "特征值符号：" + data.signature],
        ["平移基点 c", data.center.map(function (value) { return formatNumber(value, 2); }).join(", "), data.hasCenter?"此基点是一个代数中心":"基点不是中心；核上一次项仍在"],
        ["主轴 eᵤ", axes[0].map(function (value) { return formatNumber(value, 2); }).join(", "), "旋转后的特征方向"],
        ["主轴 eᵥ", axes[1].map(function (value) { return formatNumber(value, 2); }).join(", "), "旋转后的特征方向"],
        ["主轴 e𝓌", axes[2].map(function (value) { return formatNumber(value, 2); }).join(", "), "旋转后的特征方向"],
        ["截面方程", equationText(data.section), "配方值 ≈ " + (data.section.shiftedRhs===0&&data.section.shiftedSign!==0?"非零（数值下溢）":formatNumber(data.section.shiftedRhs, 4))],
        ["截面边界",data.sectionLabel,data.symbolicSlice?"符号切点 w=1/√3":"数值切片 "+data.axisLabel+"="+formatNumber(data.slice,4)],
        ["世界切平面",data.worldPlaneNormal.map(function(v,i){return formatNumber(v,4)+["x","y","z"][i];}).join(" + ")+" = "+formatNumber(data.worldPlaneConstant,4),"法向与常数为近似读数；符号切点单独标注"]
      ];
      replaceChildren(refs.ledgerBody, rows.map(function (row) {
        return element(refs.doc, "tr", {}, [
          element(refs.doc, "th", { scope: "row", text: row[0] }),
          element(refs.doc, "td", { text: row[1] }),
          element(refs.doc, "td", { text: row[2] })
        ]);
      }));
      refs.boundary.textContent =
        "三层分开读：λ 的符号是全局二次项证据，基点 c 定位坐标架，是否有中心须检查核上的一次项，eᵤ,eᵥ,e𝓌 来自主轴旋转。" +
        " 当前 SVG 和截面表只检查一个二维切片，不能单独证明整个三维曲面的连通性或分类。";
    }

    function mount(root, api) {
      if (!root || !root.ownerDocument) return;
      var doc = root.ownerDocument;
      installStyle(doc);
      var uid = "qs-" + (INSTANCE += 1);
      var state = {
        modelId: DEFAULTS.modelId,
        axis: DEFAULTS.axis,
        slice: DEFAULTS.slice,
        angle: DEFAULTS.angle,
        revealed: false,
        predictions: { signature: null, moves: null, slice: null }
      };
      var refs = { doc: doc, uid: uid, state: state };
      var shell = element(doc, "div", { className: "qs-shell" });
      shell.appendChild(element(doc, "h3", { text: "二次曲面的主轴与实际截面" }));
      shell.appendChild(element(doc, "p", { className: "qs-note", text: "先判断全局符号与局部截面，再看配方和旋转后的证据。二维图不会替代三维定理。" }));

      var prediction = element(doc, "section", { className: "qs-predict", "aria-labelledby": uid + "-predict-title" });
      prediction.appendChild(element(doc, "strong", { className: "qs-predict-title", id: uid + "-predict-title", text: "先预测，再揭示" }));
      var questionList = element(doc, "div", { className: "qs-question-list" });
      questionList.appendChild(choiceQuestion(doc, refs, "signature", "1. (+,+,+) 且 ρ>0 的中心曲面整体如何？", [
        { value: "bounded", label: "有界椭球" },
        { value: "one-sheet", label: "一定是单叶" },
        { value: "unbounded", label: "必沿零方向延伸" }
      ]));
      questionList.appendChild(choiceQuestion(doc, refs, "moves", "2. 平移配方与旋转主轴各负责什么？", [
        { value: "separate", label: "平移处理一次项，旋转消交叉项" },
        { value: "same", label: "两者完全同一操作" },
        { value: "slice-only", label: "只影响截面，不影响方程" }
      ]));
      questionList.appendChild(choiceQuestion(doc, refs, "slice", "3. x²+2y²+3z²=1 在 z=0,1/√3,1 的截面？", [
        { value: "ellipse-point-empty", label: "椭圆、点、空集" },
        { value: "all-ellipse", label: "全是椭圆" },
        { value: "point-all", label: "全是点" }
      ]));
      prediction.appendChild(questionList);
      var actions = element(doc, "div", { className: "qs-actions" });
      var reveal = element(doc, "button", { type: "button", className: "qs-primary", text: "揭示并核对" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      prediction.appendChild(actions);
      refs.feedback = element(doc, "p", { className: "qs-feedback", "aria-live": "polite", text: "请先完成三个预测。" });
      prediction.appendChild(refs.feedback);
      shell.appendChild(prediction);

      var controls = element(doc, "section", { className: "qs-controls", hidden: true, "aria-label": "二次曲面参数" });refs.controls=controls;
      refs.modelSelect = element(doc, "select", { "aria-label": "选择二次曲面模型" });
      MODELS.forEach(function (model) {
        refs.modelSelect.appendChild(element(doc, "option", { value: model.id, text: model.label }));
      });
      refs.axisSelect = element(doc, "select", { "aria-label": "选择截面主轴" });
      ["u", "v", "w"].forEach(function (label, index) {
        refs.axisSelect.appendChild(element(doc, "option", { value: String(index), text: label + " = slice" }));
      });
      refs.sliceInput = element(doc, "input", { type: "range", min: "-2", max: "2", step: "any", value: String(DEFAULTS.slice), "aria-label": "截面位置" });
      refs.sliceOutput = element(doc, "output", { text: formatNumber(DEFAULTS.slice, 2) });
      refs.angleInput = element(doc, "input", { type: "range", min: "-60", max: "60", step: "1", value: String(DEFAULTS.angle), "aria-label": "主轴旋转角度" });
      refs.angleOutput = element(doc, "output", { text: formatNumber(DEFAULTS.angle, 1) });
      refs.tangentPreset = element(doc, "button", { type: "button", text: "椭球切点 w = 1/√3" });
      controls.appendChild(element(doc, "div", { className: "qs-control" }, [element(doc, "label", { text: "全局模型" }), refs.modelSelect]));
      controls.appendChild(element(doc, "div", { className: "qs-control" }, [element(doc, "label", { text: "截面主轴" }), refs.axisSelect]));
      controls.appendChild(element(doc, "div", { className: "qs-control" }, [element(doc, "label", {}, ["slice = ", refs.sliceOutput]), refs.sliceInput]));
      controls.appendChild(element(doc, "div", { className: "qs-control" }, [element(doc, "label", {}, ["旋转 = ", refs.angleOutput, "°"]), refs.angleInput]));
      controls.appendChild(element(doc, "div", { className: "qs-control" }, [element(doc, "label", { text: "精确退化截面" }), refs.tangentPreset]));
      shell.appendChild(controls);

      var results = element(doc, "section", { className: "qs-results", hidden: true, tabindex:"-1", "aria-labelledby": uid + "-results-title" });
      refs.results = results;
      results.appendChild(element(doc, "h4", { id: uid + "-results-title", text: "揭示后的证据账本" }));
      refs.summary = element(doc, "p", { className: "qs-interpretation", "aria-live": "polite" });
      results.appendChild(refs.summary);
      refs.metrics = element(doc, "div", { className: "qs-metrics" });
      results.appendChild(refs.metrics);
      var grid = element(doc, "div", { className: "qs-grid" });
      refs.chart = element(doc, "div");
      grid.appendChild(refs.chart);
      var ledger = element(doc, "div", { className: "qs-ledger",tabindex:"0",role:"region","aria-label":"可横向滚动的二次曲面读数" });
      var table = element(doc, "table", { "aria-label": "二次曲面全局与截面账本" });
      table.appendChild(element(doc, "caption", { text: "特征值、平移基点、主轴与指定截面" }));
      table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
        element(doc, "th", { scope: "col", text: "量" }),
        element(doc, "th", { scope: "col", text: "当前值" }),
        element(doc, "th", { scope: "col", text: "读法" })
      ])));
      refs.ledgerBody = element(doc, "tbody");
      table.appendChild(refs.ledgerBody);
      ledger.appendChild(table);
      grid.appendChild(ledger);
      results.appendChild(grid);
      refs.boundary = element(doc, "p", { className: "qs-boundary" });
      results.appendChild(refs.boundary);
      shell.appendChild(results);
      root.classList.add("qs-lab");
      root.replaceChildren(shell);

      function render() {
        controls.hidden = !state.revealed;
        results.hidden = !state.revealed;
        renderPrediction(refs);
        if (state.revealed) renderResults(refs);
      }

      reveal.addEventListener("click", function () {
        var answers = { signature: "bounded", moves: "separate", slice: "ellipse-point-empty" };
        var keys = ["signature", "moves", "slice"];
        var missing = keys.filter(function (key) { return state.predictions[key] === null; });
        if (missing.length) {
          refs.feedback.textContent = "还缺少 " + missing.length + " 个预测。";
          refs.feedback.className = "qs-feedback qs-warn";
          return;
        }
        state.revealed = true;
        render();
        var hits = keys.filter(function (key) { return state.predictions[key] === answers[key]; }).length;
        refs.feedback.textContent = "已揭示：" + hits + "/3 个预测命中；二维截面仍只是局部证据。";
        refs.feedback.className = "qs-feedback " + (hits === 3 ? "qs-pass" : "qs-warn");
        results.focus();if (api && typeof api.announce === "function") api.announce(root, refs.feedback.textContent);
      });
      reset.addEventListener("click", function () {
        state = {
          modelId: DEFAULTS.modelId,
          axis: DEFAULTS.axis,
          slice: DEFAULTS.slice,
          angle: DEFAULTS.angle,
          revealed: false,
          predictions: { signature: null, moves: null, slice: null }
        };
        refs.state = state;
        render();refs.signature[0].node.focus();
      });
      refs.modelSelect.addEventListener("change", function () {
        state.modelId = refs.modelSelect.value;state.slicePreset=null;
        if (state.revealed) renderResults(refs);
      });
      refs.axisSelect.addEventListener("change", function () {
        state.axis = Number(refs.axisSelect.value);state.slicePreset=null;
        if (state.revealed) renderResults(refs);
      });
      refs.sliceInput.addEventListener("input", function () {
        state.slice = Number(refs.sliceInput.value);state.slicePreset=null;
        if (state.revealed) renderResults(refs);
      });
      refs.angleInput.addEventListener("input", function () {
        state.angle = Number(refs.angleInput.value);
        if (state.revealed) renderResults(refs);
      });
      refs.tangentPreset.addEventListener("click", function () {
        state.modelId = "ellipsoid";
        state.axis = 2;
        state.slice = 1 / Math.sqrt(3);state.slicePreset="positive-tangent";
        state.angle = 0;
        if (state.revealed) renderResults(refs);
      });
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

      assert(MODELS.length === 14, "model count");
      var ellipse = analyze({ modelId: "ellipsoid", axis: 2, slice: 0, angle: 25 });
      assert(ellipse.signature === "+ + +", "ellipsoid signature");
      assert(ellipse.section.kind === "ellipse", "ellipsoid horizontal ellipse");
      var point = analyze({ modelId: "ellipsoid", axis: 2, slicePreset:"positive-tangent", angle: 0 });
      assert(point.section.kind === "point", "ellipsoid tangent point");
      var empty = analyze({ modelId: "ellipsoid", axis: 2, slice: 1, angle: 0 });
      assert(empty.section.kind === "empty", "ellipsoid empty slice");

      var oneSheet = analyze({ modelId: "one-sheet", axis: 2, slice: 4 });
      assert(oneSheet.section.kind === "ellipse", "one-sheet horizontal ellipse");
      var twoSheetEmpty = analyze({ modelId: "two-sheet", axis: 0, slice: 0 });
      assert(twoSheetEmpty.section.kind === "empty", "two-sheet middle empty");
      var twoSheetSlice = analyze({ modelId: "two-sheet", axis: 0, slice: 2 });
      assert(twoSheetSlice.section.kind === "ellipse", "two-sheet outer ellipse");

      var parabola = analyze({ modelId: "paraboloid", axis: 0, slice: 0 });
      assert(parabola.section.kind === "parabola", "paraboloid vertical parabola");
      close(analyze({ modelId: "paraboloid", axis: 2, slice: 1 }).section.shiftedRhs, 1, 1e-12, "paraboloid horizontal rhs");

      var coneLines = analyze({ modelId: "cone", axis: 0, slice: 0, angle: 10 });
      assert(coneLines.section.kind === "pair-of-lines", "cone apex gives a line pair");
      assert(sectionCurve(coneLines).filter(Boolean).length === 6, "two exact straight polylines need only endpoints and midpoint");
      var projected = projectSectionPoint(ellipse, [0.7, -0.4]);
      close(projected[0], 0.7, 1e-12, "section projection first coordinate");
      close(projected[1], -0.4, 1e-12, "section projection second coordinate");

      var rejected = false;
      try { analyze({ modelId: "missing" }); } catch (error) { rejected = true; }
      assert(rejected, "unknown model rejected");
      rejected = false;
      try { analyze({ modelId: "ellipsoid", axis: NaN }); } catch (error) { rejected = true; }
      assert(rejected, "non-finite axis rejected");
      rejected = false;
      try { analyze({ modelId: "ellipsoid", slice: Infinity }); } catch (error) { rejected = true; }
      assert(rejected, "non-finite slice rejected");
      return { checks: checks, models: MODELS.length };
    }

    return {
      formatNumber:formatNumber,contourSvg:contourSvg,rotationMatrix:rotationMatrix,
      DEFAULTS: DEFAULTS,
      MODELS: MODELS,
      sectionKind: sectionKind,
      sectionCurve: sectionCurve,
      sectionPoint: sectionPoint,
      projectSectionPoint: projectSectionPoint,
      analyze: analyze,
      mount: mount,
      selfTest: selfTest
    };
  }
);

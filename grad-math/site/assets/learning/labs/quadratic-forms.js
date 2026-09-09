(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("quadratic-forms", exported.mount);
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
        "quadratic-forms self-test: PASS (" +
          report.checks +
          " checks, " +
          report.families +
          " families)"
      );
    } catch (error) {
      console.error("quadratic-forms self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(
  typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : null,
  function (host) {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "cl-quadratic-forms-style";
    var INSTANCE = 0;

    var DEFAULTS = { familyId: "positive", b: 0.5, shear: 1 };

    var FAMILIES = [
      {
        id: "positive",
        label: "正定族：A=[[2,b],[b,2]]",
        a: 2,
        c: 2,
        min: -1.8,
        max: 1.8,
        step: 0.1
      },
      {
        id: "indefinite",
        label: "不定族：A=[[1,b],[b,-1]]",
        a: 1,
        c: -1,
        min: -1.8,
        max: 1.8,
        step: 0.1
      },
      {
        id: "semidefinite",
        label: "退化族：A=[[1,b],[b,b²]]",
        a: 1,
        c: null,
        min: -1.8,
        max: 1.8,
        step: 0.1
      }
    ];

    var STYLE_TEXT = [
      ".qf-lab{--qf-blue:var(--cl-blue,#315f9d);--qf-gold:var(--cl-gold,#9b6a12);--qf-green:var(--cl-green,#39734d);--qf-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere;}",
      ".qf-lab *,.qf-lab *::before,.qf-lab *::after{box-sizing:border-box;}.qf-lab [hidden]{display:none!important;}",
      ".qf-lab h3,.qf-lab h4{margin:0;color:var(--fg);letter-spacing:0;}.qf-lab h3{font-size:1.18rem;}.qf-lab h4{margin-top:16px;font-size:1rem;}",
      ".qf-lab p{margin:.65em 0;}.qf-lab .qf-note,.qf-lab .qf-feedback,.qf-lab .qf-boundary{color:var(--fg-soft);font-size:13px;line-height:1.7;}",
      ".qf-lab button,.qf-lab select,.qf-lab input{font:inherit;letter-spacing:0;}.qf-lab button,.qf-lab select{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere;}",
      ".qf-lab input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--accent);}.qf-lab button:hover{border-color:var(--accent);}.qf-lab button[aria-pressed=\"true\"],.qf-lab button.qf-primary{border-color:var(--accent);background:var(--accent);color:var(--bg);font-weight:750;}.qf-lab button:focus-visible,.qf-lab select:focus-visible,.qf-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px;}",
      ".qf-lab .qf-predict{margin:14px 0;padding:13px 14px;border-left:3px solid var(--qf-gold);background:var(--bg);}.qf-lab .qf-predict-title{display:block;margin-bottom:10px;font-size:13px;}.qf-lab .qf-question-list{display:grid;gap:12px;}.qf-lab .qf-question{min-width:0;margin:0;padding:0;border:0;}.qf-lab .qf-question legend{max-width:100%;margin-bottom:7px;color:var(--fg);font-size:12.5px;font-weight:700;overflow-wrap:anywhere;}.qf-lab .qf-choice-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}.qf-lab .qf-choice-row button{font-size:12px;}",
      ".qf-lab .qf-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}.qf-lab .qf-actions>*{flex:1 1 155px;}.qf-lab .qf-feedback{min-height:2em;margin:8px 0 0;font-weight:700;}.qf-lab .qf-pass,.qf-lab .qf-ok{color:var(--qf-green);}.qf-lab .qf-warn,.qf-lab .qf-fail{color:var(--qf-red);}",
      ".qf-lab .qf-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 16px;margin:14px 0;padding:12px;border:1px solid var(--border);border-radius:7px;background:var(--bg);}.qf-lab .qf-control{display:grid;gap:5px;min-width:0;}.qf-lab .qf-control label{color:var(--fg-soft);font-size:13px;font-weight:700;}.qf-lab .qf-control output{color:var(--accent);font-variant-numeric:tabular-nums;}",
      ".qf-lab .qf-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0;}.qf-lab .qf-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg);}.qf-lab .qf-metric.qf-blue{border-top-color:var(--qf-blue);}.qf-lab .qf-metric.qf-gold{border-top-color:var(--qf-gold);}.qf-lab .qf-metric.qf-green{border-top-color:var(--qf-green);}.qf-lab .qf-metric.qf-red{border-top-color:var(--qf-red);}.qf-lab .qf-metric span{display:block;color:var(--fg-soft);font-size:11.5px;line-height:1.4;}.qf-lab .qf-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
      ".qf-lab .qf-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border);}.qf-lab .qf-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;margin-top:12px;}.qf-lab .qf-chart-frame{min-width:0;padding:7px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow-x:auto;max-width:100%;}.qf-lab svg{display:block;width:100%;min-width:700px;height:auto;color:var(--fg);}.qf-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0;}.qf-lab .qf-ledger{max-width:100%;margin-top:14px;overflow-x:auto;-webkit-overflow-scrolling:touch;}.qf-lab table{width:100%;min-width:720px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;}.qf-lab th,.qf-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere;}.qf-lab th{color:var(--fg-soft);font-size:11.5px;font-weight:750;}.qf-lab .qf-interpretation{margin:12px 0 0;padding:11px 13px;border-left:3px solid var(--qf-green);background:var(--bg);font-size:13px;line-height:1.7;}",
      "@media(max-width:760px){.qf-lab .qf-controls,.qf-lab .qf-grid{grid-template-columns:minmax(0,1fr);}.qf-lab .qf-choice-row{grid-template-columns:minmax(0,1fr);}}",
      "@media(max-width:420px){.qf-lab .qf-predict{padding-left:11px;padding-right:11px;}.qf-lab th,.qf-lab td{padding-left:5px;padding-right:5px;}}",
      '[data-theme="dark"] .qf-lab{--qf-blue:#60a5fa;--qf-gold:#fbbf24;--qf-green:#4ade80;--qf-red:#fca5a5}.qf-lab [tabindex]:focus-visible{outline:3px solid var(--accent);outline-offset:-3px;}',
      "@media(prefers-reduced-motion:reduce){.qf-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}"
    ].join("\n");

    function finite(value) {
      return typeof value === "number" && isFinite(value);
    }

    function number(v){if(!finite(v))throw new RangeError('expected finite number');return v;}
    function bounded(v,lo,hi){number(v);if(v<lo||v>hi)throw new RangeError('outside teaching domain');return v;}
    function check2(a){if(!Array.isArray(a)||a.length!==2)throw new TypeError('expected 2 by 2 matrix');for(var i=0;i<2;i++){if(!Array.isArray(a[i])||a[i].length!==2)throw new TypeError('expected 2 by 2 matrix');for(var j=0;j<2;j++)number(a[i][j]);}return a;}
    function formatNumber(v,d){number(v);d=d===undefined?3:d;if(v===0)return'0';if(Math.abs(v)<Math.pow(10,-d)||Math.abs(v)>=1e6)return v.toExponential(3);var text=v.toFixed(d);return d?text.replace(/0+$/,'').replace(/\.$/,''):text;}
    function dyadic(value) {
      number(value); if (value===0) return {n:0n,e:0};
      var view=new DataView(new ArrayBuffer(8));view.setFloat64(0,value,false);
      var high=view.getUint32(0,false),low=view.getUint32(4,false),exponent=(high>>>20)&2047;
      var mantissa=(BigInt(high&1048575)<<32n)|BigInt(low);
      if(exponent)mantissa|=1n<<52n;
      return {n:high>>>31?-mantissa:mantissa,e:exponent?exponent-1075:-1074};
    }
    function exactDet(matrix) {
      check2(matrix);var a=dyadic(matrix[0][0]),b=dyadic(matrix[0][1]),c=dyadic(matrix[1][0]),d=dyadic(matrix[1][1]);
      var e1=a.e+d.e,e2=b.e+c.e,e=Math.min(e1,e2);
      return {n:((a.n*d.n)<<BigInt(e1-e))-((b.n*c.n)<<BigInt(e2-e)),e:e};
    }
    function ratio(numerator,denominator,requireNonzero) {
      if(denominator.n===0n)throw new RangeError("division by zero");
      if(numerator.n===0n)return 0;
      function parts(pair) {
        var n=pair.n<0n?-pair.n:pair.n,bits=n.toString(2).length,shift=Math.max(0,bits-54);
        return {mantissa:Number(n>>BigInt(shift))/Math.pow(2,Math.min(bits,54)-1),exponent:pair.e+bits-1};
      }
      var a=parts(numerator),b=parts(denominator),m=a.mantissa/b.mantissa,e=a.exponent-b.exponent;
      if(m<1){m*=2;e--;}
      if(m>=2){m/=2;e++;}
      var pivot=Math.max(-1022,Math.min(1023,e));
      var value=(m*Math.pow(2,pivot))*Math.pow(2,e-pivot);
      if(!Number.isFinite(value)||(requireNonzero&&value===0))throw new RangeError("result outside floating-point representation");
      return (numerator.n<0n)!==(denominator.n<0n)?-value:value;
    }
    function familyById(id) {
      for (var i = 0; i < FAMILIES.length; i += 1) {
        if (FAMILIES[i].id === id) return FAMILIES[i];
      }
      throw new Error("Unknown quadratic family: " + id);
    }

    function matrixFor(family, b) {
      family=familyById(typeof family==='string'?family:family&&family.id);bounded(b,-1.8,1.8);
      var c = family.c === null ? b * b : family.c;
      return [[family.a, b], [b, c]];
    }

    function matrixMultiply(left, right) {
      check2(left);check2(right);var output = [[0, 0], [0, 0]];
      for (var r = 0; r < 2; r += 1) {
        for (var c = 0; c < 2; c += 1) {
          output[r][c] = left[r][0] * right[0][c] + left[r][1] * right[1][c];
        }
      }
      return check2(output);
    }

    function transpose(matrix) {
      return [[matrix[0][0], matrix[1][0]], [matrix[0][1], matrix[1][1]]];
    }

    function eigenvaluesSymmetric(matrix){
      check2(matrix);if(matrix[0][1]!==matrix[1][0])throw new TypeError('expected exactly symmetric matrix');
      var a=matrix[0][0],b=matrix[0][1],c=matrix[1][1],scale=Math.max(Math.abs(a),Math.abs(b),Math.abs(c));
      if(scale===0)return[0,0];
      var aa=a/scale,bb=b/scale,cc=c/scale,mid=(aa+cc)/2,spread=Math.hypot((aa-cc)/2,bb);
      if(spread===0)return[a,c].sort(function(x,y){return y-x;});
      var root=mid+(mid>=0?spread:-spread),large=number(root*scale),u=dyadic(root),v=dyadic(scale),denominator={n:u.n*v.n,e:u.e+v.e},det=exactDet(matrix),small=ratio(det,denominator,true);
      return[large,small].sort(function(x,y){return y-x;});
    }
    function inertia(values){if(!Array.isArray(values)||values.length!==2)throw new TypeError('expected two real eigenvalues');var p=0,n=0,z=0;for(var i=0;i<2;i++){var v=number(values[i]);if(v>0)p++;else if(v<0)n++;else z++;}return{positive:p,negative:n,zero:z,tuple:[p,n,z]};}
    function determinant(matrix){return ratio(exactDet(matrix),{n:1n,e:0},false);}
    function matrixText(matrix) {
      return "[[" + formatNumber(matrix[0][0], 2) + "," + formatNumber(matrix[0][1], 2) +
        "],[" + formatNumber(matrix[1][0], 2) + "," + formatNumber(matrix[1][1], 2) + "]]";
    }

    function typeLabel(value) {
      if (value.positive && value.negative) return "不定";
      if (value.positive && !value.negative && !value.zero) return "正定";
      if (!value.positive && value.negative && !value.zero) return "负定";
      if (value.zero && (value.positive || value.negative)) return "半定 / 退化";
      return "零型";
    }

    function analyze(options){
      if(options!==undefined&&(!options||typeof options!=='object'||Array.isArray(options)))throw new TypeError('expected options');var o=options||{},family=familyById(o.familyId===undefined?DEFAULTS.familyId:o.familyId),b=bounded(o.b===undefined?DEFAULTS.b:o.b,-1.8,1.8),shear=bounded(o.shear===undefined?DEFAULTS.shear:o.shear,-1.5,1.5),matrix=matrixFor(family,b),a=matrix[0][0],c=matrix[1][1],C=[[1,shear],[0,1]];
      var det=family.id==='positive'?4-b*b:family.id==='indefinite'?-1-b*b:0;
      var eigen=family.id==='positive'?[2+Math.abs(b),2-Math.abs(b)]:family.id==='indefinite'?[Math.hypot(1,b),-Math.hypot(1,b)]:[1+b*b,0];
      var off=a*shear+b,last=family.id==='semidefinite'?off*off:a*shear*shear+2*b*shear+c,congruent=[[a,off],[off,last]],similar=matrixMultiply(matrixMultiply([[1,-shear],[0,1]],matrix),C),congruentEigen;
      if(family.id==='semidefinite')congruentEigen=[1+off*off,0];
      else{var mid=(a+last)/2,spread=Math.hypot((a-last)/2,off),large=mid+(mid>=0?spread:-spread);congruentEigen=[large,det/large].sort(function(x,y){return y-x;});}
      var originalInertia=inertia(eigen),newInertia=inertia(congruentEigen),point=[(-b*.5+Math.sqrt(a-det*.25))/a,.5],newPoint=[point[0]-shear*point[1],point[1]];
      var data={family:family,b:b,shear:shear,matrix:matrix,congruent:congruent,similar:similar,eigenvalues:eigen,congruentEigenvalues:congruentEigen,similarEigenvalues:eigen.slice(),inertia:originalInertia,congruentInertia:newInertia,determinant:det,type:typeLabel(originalInertia),point:point,newPoint:newPoint};
      data.originalValue=formValue(family.id,b,point);data.newValue=formValue(family.id,b,[newPoint[0]+shear*newPoint[1],newPoint[1]]);return data;
    }
    function formValue(id,b,v){familyById(id);bounded(b,-1.8,1.8);if(!Array.isArray(v)||v.length!==2)throw new TypeError('expected two coordinates');var x=number(v[0]),y=number(v[1]),z=x+b*y;
      var value=id==='positive'?(2+b)/2*(x+y)*(x+y)+(2-b)/2*(x-y)*(x-y):id==='indefinite'?z*z-(1+b*b)*y*y:z*z;return number(value);
    }
    function contourPoints(data){var paths=[];if(data.family.id==='positive'){var points=[];for(var i=0;i<=256;i++){var t=2*Math.PI*i/256,u=Math.cos(t)/Math.sqrt(2+data.b),v=Math.sin(t)/Math.sqrt(2-data.b);points.push([(u+v)/Math.sqrt(2),(u-v)/Math.sqrt(2)]);}paths.push(points);}
      else[-1,1].forEach(function(sign){var points=[];for(var i=0;i<=256;i++){var y=-3.5+7*i/256,x=sign*(data.family.id==='semidefinite'?1:Math.sqrt(1+(1+data.b*data.b)*y*y))-data.b*y;points.push([x,y]);}paths.push(points);});return paths;
    }
    function contourSvg(doc,data,uid){var svg=svgNode(doc,'svg',{viewBox:'0 0 740 520',role:'img','aria-labelledby':uid+'-svg-title '+uid+'-svg-desc'});svg.appendChild(svgNode(doc,'title',{id:uid+'-svg-title'},'同一二次型等值集合在两组坐标中的记录'));svg.appendChild(svgNode(doc,'desc',{id:uid+'-svg-desc'},'左为x坐标，右为y坐标。点对满足x=Cy，二次型值相同。曲线只显示坐标窗口内的部分。'));var defs=svgNode(doc,'defs',{});svg.appendChild(defs);var paths=contourPoints(data);
      [0,1].forEach(function(side){var ox=185+370*side,oy=235,scale=40,clip=uid+'-clip-'+side,cp=svgNode(doc,'clipPath',{id:clip});cp.appendChild(svgNode(doc,'rect',{x:ox-140,y:95,width:280,height:280}));defs.appendChild(cp);
        svg.appendChild(svgNode(doc,'rect',{x:15+370*side,y:60,width:340,height:350,rx:5,fill:'none',stroke:'currentColor','stroke-opacity':.2}));svg.appendChild(svgNode(doc,'text',{x:30+370*side,y:82,'font-size':14,'font-weight':700},side?'新坐标：yᵀ(CᵀAC)y=1':'旧坐标：xᵀAx=1'));
        for(var t=-3;t<=3;t++){svg.appendChild(svgNode(doc,'line',{x1:ox+40*t,y1:95,x2:ox+40*t,y2:375,stroke:'currentColor','stroke-opacity':t===0?.55:.12}));svg.appendChild(svgNode(doc,'line',{x1:ox-140,y1:oy-40*t,x2:ox+140,y2:oy-40*t,stroke:'currentColor','stroke-opacity':t===0?.55:.12}));svg.appendChild(svgNode(doc,'text',{x:ox+40*t,y:oy+18,'text-anchor':'middle','font-size':11},String(t)));if(t)svg.appendChild(svgNode(doc,'text',{x:ox-7,y:oy-40*t+4,'text-anchor':'end','font-size':11},String(t)));}
        paths.forEach(function(points){var d=points.map(function(v,i){var x=side?v[0]-data.shear*v[1]:v[0];return(i?'L':'M')+(ox+scale*x).toFixed(4)+','+(oy-scale*v[1]).toFixed(4);}).join(' ');svg.appendChild(svgNode(doc,'path',{d:d,fill:'none',stroke:side?'var(--qf-gold)':'var(--qf-blue)','stroke-width':2.5,'clip-path':'url(#'+clip+')','data-contour':side?'new':'old'}));});
        var v=side?data.newPoint:data.point;svg.appendChild(svgNode(doc,'circle',{cx:ox+40*v[0],cy:oy-40*v[1],r:5,fill:side?'var(--qf-gold)':'var(--qf-blue)','data-point':side?'new':'old'}));svg.appendChild(svgNode(doc,'text',{x:30+370*side,y:434,'font-size':13},(side?'y = ':'x = ')+'('+v.map(function(x){return formatNumber(x);}).join(', ')+')'));svg.appendChild(svgNode(doc,'text',{x:30+370*side,y:460,'font-size':13},'代回二次型 ≈ '+formatNumber(side?data.newValue:data.originalValue)));
        svg.appendChild(svgNode(doc,'text',{x:ox+145,y:oy-7,'font-size':12},side?'y₁':'x₁'));svg.appendChild(svgNode(doc,'text',{x:ox+7,y:93,'font-size':12},side?'y₂':'x₂'));
      });svg.appendChild(svgNode(doc,'text',{x:24,y:28,'font-size':16,'font-weight':700},'点对满足 x=Cy：坐标可以变，二次型值保持'));svg.appendChild(svgNode(doc,'text',{x:24,y:494,'font-size':13},'横纵同单位；曲线按窗口裁切。两张坐标图的欧氏长度不必代表同一几何长度。'));return svg;
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
      return element(doc, "div", { className: "qf-metric " + (color || "") }, [
        element(doc, "span", { text: label }),
        element(doc, "strong", { text: value })
      ]);
    }

    function choiceQuestion(doc, refs, key, legendText, choices) {
      var fieldset = element(doc, "fieldset", { className: "qf-question" });
      fieldset.appendChild(element(doc, "legend", { text: legendText }));
      var row = element(doc, "div", { className: "qf-choice-row" });
      refs[key] = [];
      choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice.label });
        button.addEventListener("click", function () {
          refs.state.predictions[key] = choice.value;
          refs.state.revealed=false;refs.render();
        });
        refs[key].push({ value: choice.value, node: button });
        row.appendChild(button);
      });
      fieldset.appendChild(row);
      return fieldset;
    }

    function renderPrediction(refs) {
      ["formula", "invariant", "signature"].forEach(function (key) {
        (refs[key] || []).forEach(function (item) {
          item.node.setAttribute("aria-pressed", refs.state.predictions[key] === item.value ? "true" : "false");
        });
      });
      var answered = ["formula", "invariant", "signature"].every(function (key) {
        return refs.state.predictions[key] !== null;
      });
      refs.feedback.textContent = answered ? "三个预测已记录，可以揭示结果。" : "请先完成三个预测。";
      refs.feedback.className = "qf-feedback";
    }

    function renderResults(refs) {
      var state = refs.state;
      var data = analyze({ familyId: state.familyId, b: state.b, shear: state.shear });
      refs.familySelect.value = state.familyId;
      refs.bInput.value = String(state.b);
      refs.bOutput.textContent = formatNumber(state.b, 2);
      refs.shearInput.value = String(state.shear);
      refs.shearOutput.textContent = formatNumber(state.shear, 2);
      refs.summary.textContent = data.type + "：原矩阵惯性为 (" + data.inertia.tuple.join(", ") + ")；合同后仍为 (" + data.congruentInertia.tuple.join(", ") + ")。";
      refs.summary.className = "qf-interpretation " + (data.inertia.negative ? "qf-warn" : "qf-ok");
      replaceChildren(refs.metrics, [
        metric(refs.doc, "二次型类型", data.type, data.inertia.negative ? "qf-red" : "qf-green"),
        metric(refs.doc, "det A", formatNumber(data.determinant, 3), "qf-blue"),
        metric(refs.doc, "原惯性", "(" + data.inertia.tuple.join(", ") + ")", "qf-gold"),
        metric(refs.doc, "合同惯性", "(" + data.congruentInertia.tuple.join(", ") + ")", "qf-green"),
        metric(refs.doc, "剪切参数 s", formatNumber(data.shear, 2), "qf-blue")
      ]);
      replaceChildren(refs.chart, [
        element(refs.doc, "h4", { text: "同一等值集合的两组坐标" }),
        element(refs.doc, "div", { className: "qf-chart-frame", tabindex:"0",role:"region","aria-label":"二次型坐标图，可横向滚动" }, contourSvg(refs.doc, data, refs.uid))
      ]);
      var rows = [
        ["A：二次型", matrixText(data.matrix), data.eigenvalues.map(function (v) { return formatNumber(v, 3); }).join(", "), "(" + data.inertia.tuple.join(", ") + ")"],
        ["CᵀAC：合同", matrixText(data.congruent), data.congruentEigenvalues.map(function (v) { return formatNumber(v, 3); }).join(", "), "(" + data.congruentInertia.tuple.join(", ") + ")"],
        ["C⁻¹AC：相似", matrixText(data.similar), data.similarEigenvalues.map(function (v) { return formatNumber(v, 3); }).join(", "), "谱应与 A 相同"]
      ];
      replaceChildren(refs.ledgerBody, rows.map(function (row) {
        return element(refs.doc, "tr", {}, row.map(function (value, index) {
          return element(refs.doc, index === 0 ? "th" : "td", index === 0 ? { scope: "row", text: value } : { text: value });
        }));
      }));
      refs.boundary.textContent =
        "读两本账：CᵀAC 的谱可能改变，但惯性必须保持；C⁻¹AC 的谱保持是相似不变量。" +
        " 惯性与相似谱来自所选模型的精确结构，数值矩阵元素是舍入记录；尤其平方形式始终有一个零方向。剪切det C=1才使本例行列式不变。等值线本身不是全空间正定证书。"+(data.family.id==="semidefinite"?" 原零方向=("+formatNumber(-data.b)+",1)，新零方向=("+formatNumber(-data.b-data.shear)+",1)。":"");
    }

    function mount(root, api) {
      if (!root || !root.ownerDocument) return;
      var doc = root.ownerDocument;
      installStyle(doc);
      var uid = "qf-" + (INSTANCE += 1);
      var state = {
        familyId: DEFAULTS.familyId,
        b: DEFAULTS.b,
        shear: DEFAULTS.shear,
        revealed: false,
        predictions: { formula: null, invariant: null, signature: null }
      };
      var refs = { doc: doc, uid: uid, state: state };
      var shell = element(doc, "div", { className: "qf-shell" });
      shell.appendChild(element(doc, "h3", { text: "合同变换与惯性账本" }));
      shell.appendChild(element(doc, "p", { className: "qf-note", text: "先判断变换公式和不变量，再看等值线。相似矩阵只作为对照，不代替合同结论。" }));

      var prediction = element(doc, "section", { className: "qf-predict", "aria-labelledby": uid + "-predict-title" });
      prediction.appendChild(element(doc, "strong", { className: "qf-predict-title", id: uid + "-predict-title", text: "先预测，再揭示" }));
      var questionList = element(doc, "div", { className: "qf-question-list" });
      questionList.appendChild(choiceQuestion(doc, refs, "formula", "1. x=Cy 后二次型矩阵如何变？", [
        { value: "congruence", label: "CᵀAC" },
        { value: "similarity", label: "C⁻¹AC" },
        { value: "transpose-only", label: "Aᵀ" }
      ]));
      questionList.appendChild(choiceQuestion(doc, refs, "invariant", "2. 可逆合同一定保留什么？", [
        { value: "inertia", label: "正负零个数" },
        { value: "eigenvalues", label: "每个特征值" },
        { value: "entries", label: "矩阵每个元素" }
      ]));
      questionList.appendChild(choiceQuestion(doc, refs, "signature", "3. diag(1,-1) 能合同成正定吗？", [
        { value: "no", label: "不能，符号型不变" },
        { value: "yes", label: "能，换坐标即可" },
        { value: "unknown", label: "只看一条曲线" }
      ]));
      prediction.appendChild(questionList);
      var actions = element(doc, "div", { className: "qf-actions" });
      var reveal = element(doc, "button", { type: "button", className: "qf-primary", text: "揭示并核对" });
      var reset = element(doc, "button", { type: "button", text: "重置" });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      prediction.appendChild(actions);
      refs.feedback = element(doc, "p", { className: "qf-feedback", "aria-live": "polite", text: "请先完成三个预测。" });
      prediction.appendChild(refs.feedback);
      shell.appendChild(prediction);

      var controls = element(doc, "section", { className: "qf-controls", hidden: true, "aria-label": "二次型参数" });
      refs.familySelect = element(doc, "select", { "aria-label": "选择二次型族" });
      FAMILIES.forEach(function (family) {
        refs.familySelect.appendChild(element(doc, "option", { value: family.id, text: family.label }));
      });
      refs.bInput = element(doc, "input", { type: "range", min: "-1.8", max: "1.8", step: "0.1", value: String(DEFAULTS.b), "aria-label": "交叉项参数 b" });
      refs.bOutput = element(doc, "output", { text: formatNumber(DEFAULTS.b, 2) });
      refs.shearInput = element(doc, "input", { type: "range", min: "-1.5", max: "1.5", step: "0.1", value: String(DEFAULTS.shear), "aria-label": "合同剪切参数 s" });
      refs.shearOutput = element(doc, "output", { text: formatNumber(DEFAULTS.shear, 2) });
      controls.appendChild(element(doc, "div", { className: "qf-control" }, [element(doc, "label", { text: "二次型族" }), refs.familySelect]));
      controls.appendChild(element(doc, "div", { className: "qf-control" }, [element(doc, "label", {}, ["交叉项 b = ", refs.bOutput]), refs.bInput]));
      controls.appendChild(element(doc, "div", { className: "qf-control" }, [element(doc, "label", {}, ["合同剪切 s = ", refs.shearOutput]), refs.shearInput]));
      shell.appendChild(controls);

      var results = element(doc, "section", { className: "qf-results", hidden: true, "aria-labelledby": uid + "-results-title" });
      refs.results = results;
      results.appendChild(element(doc, "h4", { id: uid + "-results-title", text: "揭示后的证据账本" }));
      refs.summary = element(doc, "p", { className: "qf-interpretation", "aria-live": "polite" });
      results.appendChild(refs.summary);
      refs.metrics = element(doc, "div", { className: "qf-metrics" });
      results.appendChild(refs.metrics);
      var grid = element(doc, "div", { className: "qf-grid" });
      refs.chart = element(doc, "div");
      grid.appendChild(refs.chart);
      var ledger = element(doc, "div", { className: "qf-ledger",tabindex:"0",role:"region","aria-label":"矩阵和惯性账本，可横向滚动" });
      var table = element(doc, "table", { "aria-label": "二次型变换矩阵与惯性账本" });
      table.appendChild(element(doc, "caption", { text: "原矩阵、合同矩阵和相似矩阵的对照" }));
      table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
        element(doc, "th", { scope: "col", text: "对象" }),
        element(doc, "th", { scope: "col", text: "矩阵" }),
        element(doc, "th", { scope: "col", text: "谱" }),
        element(doc, "th", { scope: "col", text: "惯性 / 读法" })
      ])));
      refs.ledgerBody = element(doc, "tbody");
      table.appendChild(refs.ledgerBody);
      ledger.appendChild(table);
      grid.appendChild(ledger);
      results.appendChild(grid);
      refs.boundary = element(doc, "p", { className: "qf-boundary" });
      results.appendChild(refs.boundary);
      shell.appendChild(results);
      root.classList.add("qf-lab");
      root.replaceChildren(shell);

      function render() {
        controls.hidden = !state.revealed;
        results.hidden = !state.revealed;
        renderPrediction(refs);
        if (state.revealed) renderResults(refs);
      }

      refs.render=render;
      reveal.addEventListener("click", function () {
        var answers = { formula: "congruence", invariant: "inertia", signature: "no" };
        var keys = ["formula", "invariant", "signature"];
        var missing = keys.filter(function (key) { return state.predictions[key] === null; });
        if (missing.length) {
          refs.feedback.textContent = "还缺少 " + missing.length + " 个预测。";
          refs.feedback.className = "qf-feedback qf-warn";
          return;
        }
        state.revealed = true;
        render();
        var hits = keys.filter(function (key) { return state.predictions[key] === answers[key]; }).length;
        refs.feedback.textContent = "已揭示：" + hits + "/3 个预测命中；合同与相似仍需分开读。";
        refs.feedback.className = "qf-feedback " + (hits === 3 ? "qf-pass" : "qf-warn");
        if (api && typeof api.announce === "function") api.announce(root, refs.feedback.textContent);
      });
      reset.addEventListener("click", function () {
        state = {
          familyId: DEFAULTS.familyId,
          b: DEFAULTS.b,
          shear: DEFAULTS.shear,
          revealed: false,
          predictions: { formula: null, invariant: null, signature: null }
        };
        refs.state = state;
        render();refs.formula[0].node.focus();
      });
      refs.familySelect.addEventListener("change", function () {
        state.familyId = refs.familySelect.value;
        if (state.revealed) renderResults(refs);
      });
      refs.bInput.addEventListener("input", function () {
        state.b = Number(refs.bInput.value);
        if (state.revealed) renderResults(refs);
      });
      refs.shearInput.addEventListener("input", function () {
        state.shear = Number(refs.shearInput.value);
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

      assert(FAMILIES.length === 3, "family count");
      var positive = analyze({ familyId: "positive", b: 0.5, shear: 1 });
      assert(positive.inertia.tuple.join(",") === "2,0,0", "positive inertia");
      assert(positive.congruentInertia.tuple.join(",") === "2,0,0", "positive congruent inertia");
      close(positive.determinant, 3.75, 1e-12, "positive determinant");
      close(positive.similarEigenvalues[0], positive.eigenvalues[0], 1e-8, "similar first eigenvalue");
      close(positive.similarEigenvalues[1], positive.eigenvalues[1], 1e-8, "similar second eigenvalue");

      var indefinite = analyze({ familyId: "indefinite", b: 0.5, shear: -1.2 });
      assert(indefinite.inertia.tuple.join(",") === "1,1,0", "indefinite inertia");
      assert(indefinite.congruentInertia.tuple.join(",") === "1,1,0", "indefinite congruent inertia");
      assert(indefinite.type === "不定", "indefinite type");

      var semidefinite = analyze({ familyId: "semidefinite", b: 1.1, shear: 0.4 });
      assert(semidefinite.inertia.tuple.join(",") === "1,0,1", "semidefinite inertia");
      close(semidefinite.determinant, 0, 1e-10, "semidefinite determinant");

      var rejected = false;
      try { analyze({ familyId: "missing" }); } catch (error) { rejected = true; }
      assert(rejected, "unknown family rejected");
      rejected = false;
      try { analyze({ familyId: DEFAULTS.familyId, b: NaN, shear: 0 }); } catch (error) { rejected = error instanceof RangeError; }
      assert(rejected, "nonfinite quadratic-form parameter rejected");
      return { checks: checks, families: FAMILIES.length };
    }

    return {
      DEFAULTS: DEFAULTS,
      FAMILIES: FAMILIES,
      matrixFor: matrixFor,
      eigenvaluesSymmetric: eigenvaluesSymmetric,
      formValue:formValue,contourPoints:contourPoints,contourSvg:contourSvg,formatNumber:formatNumber,
      inertia: inertia,
      analyze: analyze,
      mount: mount,
      selfTest: selfTest
    };
  }
);

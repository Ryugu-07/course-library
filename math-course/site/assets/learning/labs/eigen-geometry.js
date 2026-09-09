(function(host,factory){"use strict";var lab=factory();if(typeof module==='object'&&module.exports)module.exports=lab;if(host&&host.CourseLearning)host.CourseLearning.register('eigen-geometry',lab.mount);})(typeof window==='undefined'?null:window,function(){"use strict";
var STYLE_ID='eigen-geometry-lab-styles',INSTANCE=0;
  var PRESETS = [
    {
      id: "diag",
      label: "diag(2, 0.5)",
      matrix: { a: 2, b: 0, c: 0, d: 0.5 },
      matrixText: "[[2, 0], [0, 0.5]]",
      eigen: [
        { lambda: "2", value: 2, direction: "span{(1,0)ᵀ}", vector: { x: 1, y: 0 } },
        { lambda: "0.5", value: 0.5, direction: "span{(0,1)ᵀ}", vector: { x: 0, y: 1 } }
      ],
      realDirections: [
        { lambda: "2", value: 2, label: "λ=2", vector: { x: 1, y: 0 } },
        { lambda: "0.5", value: 0.5, label: "λ=0.5", vector: { x: 0, y: 1 } }
      ]
    },
    {
      id: "symmetric",
      label: "对称 [[2,1],[1,2]]",
      matrix: { a: 2, b: 1, c: 1, d: 2 },
      matrixText: "[[2, 1], [1, 2]]",
      eigen: [
        { lambda: "3", value: 3, direction: "span{(1,1)ᵀ}", vector: { x: 1, y: 1 } },
        { lambda: "1", value: 1, direction: "span{(1,−1)ᵀ}", vector: { x: 1, y: -1 } }
      ],
      realDirections: [
        { lambda: "3", value: 3, label: "λ=3", vector: { x: 1, y: 1 } },
        { lambda: "1", value: 1, label: "λ=1", vector: { x: 1, y: -1 } }
      ]
    },
    {
      id: "jordan",
      label: "Jordan [[1,1],[0,1]]",
      matrix: { a: 1, b: 1, c: 0, d: 1 },
      matrixText: "[[1, 1], [0, 1]]",
      eigen: [
        { lambda: "1（代数重数 2）", value: 1, direction: "span{(1,0)ᵀ}（仅此实方向）", vector: { x: 1, y: 0 } }
      ],
      realDirections: [
        { lambda: "1", value: 1, label: "λ=1；仅一条方向", vector: { x: 1, y: 0 } }
      ]
    },
    {
      id: "rotation",
      label: "90° 旋转 [[0,−1],[1,0]]",
      matrix: { a: 0, b: -1, c: 1, d: 0 },
      matrixText: "[[0, −1], [1, 0]]",
      eigen: [
        { lambda: "i", value: null, direction: "(1,−i)ᵀ（复特征向量）", vector: { x: 1, y: -1, complex: true } },
        { lambda: "−i", value: null, direction: "(1,i)ᵀ（复特征向量）", vector: { x: 1, y: 1, complex: true } }
      ],
      realDirections: []
    }
  ];


function finite(v){if(typeof v!=='number'||!Number.isFinite(v))throw new RangeError('expected finite number');return v;}
function preset(id){var found=PRESETS.find(function(p){return p.id===id;});if(!found)throw new RangeError('unknown preset');return found;}
function vector(v){if(!v||typeof v!=='object')throw new TypeError('expected vector');finite(v.x);finite(v.y);return v;}
function applyMatrix(a,v){if(!a||typeof a!=='object')throw new TypeError('expected matrix');['a','b','c','d'].forEach(function(k){finite(a[k]);});vector(v);return vector({x:a.a*v.x+a.b*v.y,y:a.c*v.x+a.d*v.y});}
function powerMatrix(id,k){preset(id);finite(k);if(!Number.isInteger(k)||k<0||k>20)throw new RangeError('integer power 0 to 20');
 if(id==='diag')return{a:Math.pow(2,k),b:0,c:0,d:Math.pow(.5,k)};
 if(id==='symmetric'){var q=Math.pow(3,k);return{a:(q+1)/2,b:(q-1)/2,c:(q-1)/2,d:(q+1)/2};}
 if(id==='jordan')return{a:1,b:k,c:0,d:1};
 return[{a:1,b:0,c:0,d:1},{a:0,b:-1,c:1,d:0},{a:-1,b:0,c:0,d:-1},{a:0,b:1,c:-1,d:0}][k%4];
}
function evaluate(options){if(options!==undefined&&(!options||typeof options!=='object'||Array.isArray(options)))throw new TypeError('expected options');var o=options||{},id=o.presetId===undefined?'diag':o.presetId,p=preset(id),angle=o.angle===undefined?35:o.angle,k=o.k===undefined?5:o.k;finite(angle);if(angle<0||angle>360)throw new RangeError('angle 0 to 360');var power=powerMatrix(id,k),theta=angle*Math.PI/180;
 // Cardinal directions are exact model inputs; other angles use trigonometric approximations.
 var unit=angle%90===0?[{x:1,y:0},{x:0,y:1},{x:-1,y:0},{x:0,y:-1}][(angle/90)%4]:{x:Math.cos(theta),y:Math.sin(theta)};
 var x={x:1.45*unit.x,y:1.45*unit.y},ax=applyMatrix(p.matrix,x),e2=applyMatrix(power,{x:0,y:1});return{preset:p,angle:angle,k:k,x:x,ax:ax,power:power,powerE2:e2,normX:Math.hypot(x.x,x.y),normAx:Math.hypot(ax.x,ax.y),normPower:Math.hypot(e2.x,e2.y)};
}
function formatNumber(v,d){finite(v);d=d===undefined?3:d;if(v===0)return'0';if(Math.abs(v)<Math.pow(10,-d)||Math.abs(v)>=1e6)return v.toExponential(3);var s=v.toFixed(d);return d?s.replace(/0+$/,'').replace(/\.$/,''):s;}
function fv(v){return'('+formatNumber(v.x)+', '+formatNumber(v.y)+')';}
function makeElement(api,tag,attrs,children){return api.el(tag,attrs,children);}
function makeSvg(api,tag,attrs,children){return api.svg(tag,attrs,children);}
function eigenSummary(p){if(p.id==='rotation')return'λ=i：(1,−i)ᵀ；λ=−i：(1,i)ᵀ。没有非零实特征向量。';return p.eigen.map(function(e){return'λ='+e.lambda+'，'+e.direction;}).join('；');}
  function injectStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".eigen-geometry-lab { --eg-eigen: var(--cl-gold, #9b6a12); --eg-input: var(--cl-blue, #315f9d); --eg-output: var(--cl-green, #39734d); --eg-muted: var(--fg-soft, #6f6a60); line-height: 1.5; }",
      "html[data-theme=\"dark\"] .eigen-geometry-lab { --eg-eigen: #e2b458; --eg-input: #83c8ff; --eg-output: #72bd8b; --eg-muted: #b8b2a7; }",
      ".eigen-geometry-lab .eg-layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; align-items: start; }",
      ".eigen-geometry-lab .eg-controls, .eigen-geometry-lab .eg-stage { min-width: 0; }",
      ".eigen-geometry-lab .eg-controls { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px 18px; }",
      ".eigen-geometry-lab .eg-control-section { display: grid; gap: 7px; }",
      ".eigen-geometry-lab .eg-control-section h4 { margin: 0; }",
      ".eigen-geometry-lab .eg-small, .eigen-geometry-lab .eg-note { margin: 0; color: var(--eg-muted); font-size: 13px; overflow-wrap: anywhere; }",
      ".eigen-geometry-lab .eg-presets { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }",
      ".eigen-geometry-lab .eg-button { min-width: 0; min-height: 44px; padding: 8px 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: inherit; cursor: pointer; font: inherit; line-height: 1.35; overflow-wrap: anywhere; }",
      ".eigen-geometry-lab .eg-button:hover { border-color: var(--accent); }",
      ".eigen-geometry-lab .eg-button[aria-pressed=true], .eigen-geometry-lab .eg-primary { border-color: var(--accent); background: var(--accent); color: var(--bg); font-weight: 700; }",
      ".eigen-geometry-lab .eg-button:focus-visible, .eigen-geometry-lab input:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
      ".eigen-geometry-lab .eg-field { display: grid; gap: 5px; }",
      ".eigen-geometry-lab .eg-field-caption { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 6px; color: var(--eg-muted); font-size: 13px; font-weight: 650; }",
      ".eigen-geometry-lab .eg-output { color: var(--accent); font-variant-numeric: tabular-nums; }",
      ".eigen-geometry-lab input[type=range] { display: block; width: 100%; min-height: 44px; margin: 0; accent-color: var(--accent); }",
      ".eigen-geometry-lab .eg-toggle { width: 100%; }",
      ".eigen-geometry-lab .eg-status { grid-column: 1 / -1; min-height: 1.5em; margin: 0; color: var(--eg-output); font-weight: 650; }",
      ".eigen-geometry-lab .eg-stage-frame { max-width:100%;overflow-x:auto;padding: 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); }",
      ".eigen-geometry-lab .eg-svg { display: block; width: 100%; min-width:700px; height: auto; color: inherit; }",
      ".eigen-geometry-lab .eg-svg text { fill: currentColor; font-family: inherit; letter-spacing: 0; }",
      ".eigen-geometry-lab .eg-panel { fill: var(--bg); stroke: var(--border); stroke-width: 1.2; }",
      ".eigen-geometry-lab .eg-grid { fill: none; stroke: currentColor; stroke-opacity: .13; stroke-width: 1; }",
      ".eigen-geometry-lab .eg-axis { fill: none; stroke: currentColor; stroke-opacity: .52; stroke-width: 1.2; }",
      ".eigen-geometry-lab .eg-circle { fill: none; stroke: var(--accent); stroke-opacity: .82; stroke-width: 2.2; }",
      ".eigen-geometry-lab .eg-eigen-line { fill: none; stroke: var(--eg-eigen); stroke-opacity: .72; stroke-width: 1.5; stroke-dasharray: 6 4; }",
      ".eigen-geometry-lab .eg-eigen-arrow { fill: none; stroke: var(--eg-eigen); stroke-width: 2.4; }",
      ".eigen-geometry-lab .eg-eigen-head { fill: var(--eg-eigen); stroke: var(--eg-eigen); }",
      ".eigen-geometry-lab .eg-input-vector { fill: none; stroke: var(--eg-input); stroke-width: 3; }",
      ".eigen-geometry-lab .eg-input-head { fill: var(--eg-input); stroke: var(--eg-input); }",
      ".eigen-geometry-lab .eg-output-vector { fill: none; stroke: var(--eg-output); stroke-width: 3; }",
      ".eigen-geometry-lab .eg-output-head { fill: var(--eg-output); stroke: var(--eg-output); }",
      ".eigen-geometry-lab .eg-origin { fill: currentColor; }",
      ".eigen-geometry-lab .eg-panel-label { font-size: 14px; font-weight: 700; }",
      ".eigen-geometry-lab .eg-axis-label, .eigen-geometry-lab .eg-eigen-label { font-size: 12px; }",
      ".eigen-geometry-lab .eg-eigen-label { fill: var(--eg-eigen) !important; font-weight: 700; }",
      ".eigen-geometry-lab .eg-vector-label { font-size: 12px; font-weight: 700; }",
      ".eigen-geometry-lab .eg-input-label { fill: var(--eg-input) !important; }",
      ".eigen-geometry-lab .eg-output-label { fill: var(--eg-output) !important; }",
      ".eigen-geometry-lab .eg-no-real { fill: var(--eg-muted) !important; font-size: 13px; }",
      ".eigen-geometry-lab .eg-details { display: grid; gap: 6px; margin-top: 10px; }",
      ".eigen-geometry-lab .eg-detail { margin: 0; padding: 8px 10px; border-left: 3px solid var(--border); background: var(--bg); overflow-wrap: anywhere; }",
      ".eigen-geometry-lab .eg-detail strong { color: var(--eg-muted); }",
      "@media (max-width: 700px) { .eigen-geometry-lab { margin-left: -8px; margin-right: -8px; padding: 14px; } .eigen-geometry-lab .eg-controls { grid-template-columns: minmax(0, 1fr); } .eigen-geometry-lab .eg-status { grid-column: auto; } .eigen-geometry-lab .eg-stage-frame { padding: 5px; overflow-x: auto; } .eigen-geometry-lab .eg-svg { min-width: 700px; } .eigen-geometry-lab .eg-presets { grid-template-columns: repeat(2, minmax(0, 1fr)); } }",
      "@media (prefers-reduced-motion: reduce) { .eigen-geometry-lab * { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }",
      '.eigen-geometry-lab [hidden]{display:none!important}.eigen-geometry-lab fieldset{min-width:0;border:0;padding:0;margin:12px 0}.eigen-geometry-lab legend{font-weight:700;margin-bottom:7px}.eigen-geometry-lab fieldset button{margin:3px;max-width:100%}.eigen-geometry-lab .eg-ledger{max-width:100%;overflow-x:auto}.eigen-geometry-lab table{min-width:620px;width:100%;border-collapse:collapse;font-size:13px}.eigen-geometry-lab td,.eigen-geometry-lab th{padding:8px;text-align:left;border-bottom:1px solid var(--border)}.eigen-geometry-lab [tabindex]:focus-visible{outline:3px solid var(--accent);outline-offset:-3px;}'
    ].join("\n");
    (doc.head || doc.documentElement || doc.body).appendChild(style);
  }


function scene(api,data,show,uid){var svg=makeSvg(api,'svg',{className:'eg-svg',viewBox:'0 0 740 510',role:'img','aria-labelledby':uid+'-title '+uid+'-desc'});svg.appendChild(makeSvg(api,'title',{id:uid+'-title'},'一次作用 x 与 Ax，使用同一标准坐标标尺'));svg.appendChild(makeSvg(api,'desc',{id:uid+'-desc'},'两图标准轴固定；右图细网格和单位圆被矩阵变换。金色虚线仅标特征直线，不编码伸缩量。'));
 var defs=makeSvg(api,'defs',{});svg.appendChild(defs);
 [0,1].forEach(function(side){var ox=185+370*side,oy=235,scale=28,left=ox-154,top=81,clip=uid+'-clip-'+side,cp=makeSvg(api,'clipPath',{id:clip});cp.appendChild(makeSvg(api,'rect',{x:left,y:top,width:308,height:308}));defs.appendChild(cp);
 var point=function(v){return{x:ox+scale*v.x,y:oy-scale*v.y};};var line=function(v,w,cls,attrs){var a=point(v),b=point(w);svg.appendChild(makeSvg(api,'line',Object.assign({x1:a.x,y1:a.y,x2:b.x,y2:b.y,className:cls},attrs||{})));};
 svg.appendChild(makeSvg(api,'rect',{className:'eg-panel',x:15+370*side,y:42,width:340,height:366,rx:5}));svg.appendChild(makeSvg(api,'text',{x:31+370*side,y:64,className:'eg-panel-label'},side?'一次作用后的标准坐标':'作用前的标准坐标'));
 for(var tick=-2;tick<=2;tick+=.5){[[{x:tick,y:-2.2},{x:tick,y:2.2}],[{x:-2.2,y:tick},{x:2.2,y:tick}]].forEach(function(pair){if(side)pair=pair.map(function(v){return applyMatrix(data.preset.matrix,v);});line(pair[0],pair[1],'eg-grid',{'clip-path':'url(#'+clip+')'});});}
 line({x:-5,y:0},{x:5,y:0},'eg-axis');line({x:0,y:-5},{x:0,y:5},'eg-axis');[-4,-2,0,2,4].forEach(function(t){var px=point({x:t,y:0}),py=point({x:0,y:t});svg.appendChild(makeSvg(api,'text',{x:px.x,y:oy+17,'text-anchor':'middle','font-size':11},String(t)));if(t!==0)svg.appendChild(makeSvg(api,'text',{x:ox-7,y:py.y+4,'text-anchor':'end','font-size':11},String(t)));});
 svg.appendChild(makeSvg(api,'text',{x:ox+143,y:oy-7,'font-size':12},side?'y₁':'x₁'));svg.appendChild(makeSvg(api,'text',{x:ox+7,y:oy-143,'font-size':12},side?'y₂':'x₂'));
 var pts=[];for(var i=0;i<=128;i++){var theta=2*Math.PI*i/128,v={x:Math.cos(theta),y:Math.sin(theta)};if(side)v=applyMatrix(data.preset.matrix,v);var pp=point(v);pts.push((i?'L':'M')+pp.x.toFixed(3)+','+pp.y.toFixed(3));}svg.appendChild(makeSvg(api,'path',{className:'eg-circle',d:pts.join(' ')}));
 data.preset.realDirections.forEach(function(e){var v=e.vector,len=Math.hypot(v.x,v.y),a={x:-5*v.x/len,y:-5*v.y/len},b={x:5*v.x/len,y:5*v.y/len};line(a,b,'eg-eigen-line');});
 if(show){var v=side?data.ax:data.x,pt=point(v);line({x:0,y:0},v,side?'eg-output-vector':'eg-input-vector');svg.appendChild(makeSvg(api,'circle',{cx:pt.x,cy:pt.y,r:4.5,fill:side?'var(--eg-output)':'var(--eg-input)','data-vector':side?'output':'input'}));}
 svg.appendChild(makeSvg(api,'text',{x:31+side*370,y:431,'font-size':13,className:side?'eg-output-label':'eg-input-label'},show?(side?'Ax = ':'x = ')+fv(side?data.ax:data.x):'向量图层隐藏'));
 svg.appendChild(makeSvg(api,'text',{x:31+side*370,y:457,'font-size':12},data.preset.realDirections.length?'金色虚线：'+data.preset.realDirections.map(function(e){return e.label;}).join('；'):'无非零实特征方向；圆的保持不代表每条直线保持'));
 });svg.appendChild(makeSvg(api,'text',{x:24,y:24,'font-size':15,'font-weight':700},'同一像素单位：先分清对象，再比较方向和长度'));
 svg.appendChild(makeSvg(api,'text',{x:24,y:490,'font-size':13},'两边使用相同单位长度；右侧细网格随 A 变化，标准坐标轴保持固定。'));return svg;}
function mount(root,api){var doc=root.ownerDocument;injectStyles(doc);var uid='eg-'+(++INSTANCE),state={presetId:'diag',angle:35,k:5,show:true,revealed:false,answers:[null,null,null]},shell=makeElement(api,'div',{className:'eg-shell'});shell.appendChild(makeElement(api,'h3',{},'特征方向与矩阵幂'));
 var predict=makeElement(api,'section',{className:'eg-predict'}),buttons=[];[['1. Jordan 块只有一个特征方向，可以对角化吗？',['不能，需要两个独立方向','能，因为特征值是实数']],['2. 90° 旋转保持单位圆，有实特征方向吗？',['没有','有，每条半径都是']],['3. J 的谱半径为 1，Jᵏe₂ 的长度怎样？',['仍会增长，含线性因子 k','始终为 1']]].forEach(function(q,i){var f=makeElement(api,'fieldset',{});f.appendChild(makeElement(api,'legend',{},q[0]));buttons[i]=q[1].map(function(label,j){var b=makeElement(api,'button',{className:'eg-button',type:'button','aria-pressed':'false'},label);b.addEventListener('click',function(){state.answers[i]=j;state.revealed=false;render();});f.appendChild(b);return b;});predict.appendChild(f);});
 var actions=makeElement(api,'div',{className:'eg-presets'}),reveal=makeElement(api,'button',{className:'eg-button eg-primary',type:'button'},'核对预测并揭示'),reset=makeElement(api,'button',{className:'eg-button',type:'button'},'重置');actions.appendChild(reveal);actions.appendChild(reset);predict.appendChild(actions);var feedback=makeElement(api,'p',{'aria-live':'polite',className:'eg-note'},'请先完成三个预测。');predict.appendChild(feedback);shell.appendChild(predict);
 var controls=makeElement(api,'section',{className:'eg-controls','aria-label':'特征几何实验控制'}),presetGroup=makeElement(api,'div',{className:'eg-presets','aria-label':'矩阵预设'}),presetButtons=[];PRESETS.forEach(function(p){var b=makeElement(api,'button',{className:'eg-button',type:'button','aria-pressed':'false'},p.label);b.addEventListener('click',function(){state.presetId=p.id;render();});presetGroup.appendChild(b);presetButtons.push(b);});controls.appendChild(presetGroup);
 function slider(name,key,min,max,step,value){var label=makeElement(api,'label',{className:'eg-field'},name),input=makeElement(api,'input',{type:'range',min:String(min),max:String(max),step:String(step),value:String(value),'aria-label':name}),output=makeElement(api,'output',{className:'eg-output'});label.appendChild(input);label.appendChild(output);input.addEventListener('input',function(){state[key]=Number(input.value);render();});controls.appendChild(label);return{input:input,output:output};}
 var angle=slider('一次作用的 x 角度（度）','angle',0,360,1,35),power=slider('幂读数的 k（固定初值 e₂）','k',0,20,1,5),toggle=makeElement(api,'button',{className:'eg-button',type:'button','aria-pressed':'true'},'隐藏向量 x 与 Ax');toggle.addEventListener('click',function(){state.show=!state.show;render();});controls.appendChild(toggle);shell.appendChild(controls);
 var results=makeElement(api,'section',{className:'eg-stage'}),frame=makeElement(api,'div',{className:'eg-stage-frame',tabindex:'0',role:'region','aria-label':'同标尺几何图，可横向滚动'}),details=makeElement(api,'div',{className:'eg-details'}),powerDetail=makeElement(api,'div',{className:'eg-details'});results.appendChild(frame);results.appendChild(details);results.appendChild(makeElement(api,'h4',{},'另一个实验：固定初值 e₂，反复作用 k 次'));results.appendChild(makeElement(api,'p',{className:'eg-note'},'下表固定 e₂，与上图长度 1.45、角度可调的 x 不同；上图始终只画一次 A。读数按显示精度舍入。'));results.appendChild(powerDetail);shell.appendChild(results);root.classList.add('eigen-geometry-lab');root.replaceChildren(shell);
 function render(){buttons.forEach(function(row,i){row.forEach(function(b,j){b.setAttribute('aria-pressed',state.answers[i]===j?'true':'false');});});controls.hidden=results.hidden=!state.revealed;feedback.textContent=state.answers.every(function(v){return v!==null;})?'预测已记录，可以核对。':'请先完成三个预测。';if(!state.revealed)return;var d=evaluate(state);presetButtons.forEach(function(b,i){b.setAttribute('aria-pressed',PRESETS[i].id===state.presetId?'true':'false');});angle.input.value=String(state.angle);angle.output.textContent=state.angle+'°';power.input.value=String(state.k);power.output.textContent='k = '+state.k;toggle.textContent=state.show?'隐藏向量 x 与 Ax':'显示向量 x 与 Ax';toggle.setAttribute('aria-pressed',state.show?'true':'false');frame.replaceChildren(scene(api,d,state.show,uid));details.replaceChildren(makeElement(api,'p',{className:'eg-detail'},'A='+d.preset.matrixText+'；'+eigenSummary(d.preset)),makeElement(api,'p',{className:'eg-detail'},'一次作用：x='+fv(d.x)+'，Ax='+fv(d.ax)+'；长度 '+formatNumber(d.normX)+' → '+formatNumber(d.normAx)));
 var wrap=makeElement(api,'div',{className:'eg-ledger',tabindex:'0',role:'region','aria-label':'矩阵幂读数，可横向滚动'}),table=makeElement(api,'table',{}),thead=makeElement(api,'thead',{}),row=makeElement(api,'tr',{});['k','Aᵏ 的行','Aᵏe₂','长度'].forEach(function(t){row.appendChild(makeElement(api,'th',{scope:'col'},t));});thead.appendChild(row);table.appendChild(thead);var body=makeElement(api,'tbody',{});[0,1,2,5,10,20,state.k].filter(function(v,i,a){return a.indexOf(v)===i;}).sort(function(a,b){return a-b;}).forEach(function(k){var a=evaluate({presetId:state.presetId,k:k}),m=a.power,tr=makeElement(api,'tr',{'data-k':k});[String(k),fv({x:m.a,y:m.b})+' / '+fv({x:m.c,y:m.d}),fv(a.powerE2),formatNumber(a.normPower)].forEach(function(v){tr.appendChild(makeElement(api,'td',{},v));});body.appendChild(tr);});table.appendChild(body);wrap.appendChild(table);powerDetail.replaceChildren(makeElement(api,'p',{className:'eg-detail'},'当前 k='+state.k+'：Aᵏe₂='+fv(d.powerE2)+'，长度='+formatNumber(d.normPower)),wrap);}
 reveal.addEventListener('click',function(){if(state.answers.some(function(v){return v===null;})){feedback.textContent='还有预测未作答。';return;}state.revealed=true;render();feedback.textContent='已揭示：'+state.answers.filter(function(v){return v===0;}).length+'/3 个预测命中。请用图与幂读数解释理由。';});reset.addEventListener('click',function(){state={presetId:'diag',angle:35,k:5,show:true,revealed:false,answers:[null,null,null]};render();buttons[0][0].focus();});render();}
return{PRESETS:PRESETS,applyMatrix:applyMatrix,powerMatrix:powerMatrix,evaluate:evaluate,formatNumber:formatNumber,scene:scene,mount:mount};
});

(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("physics-lockin-noise", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("physics-lockin-noise self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("physics-lockin-noise self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "physics-lockin-noise-styles";
  var STYLE_TEXT = [
    ".pln-lab{--pln-blue:var(--cl-blue,#315f9d);--pln-green:var(--cl-green,#39734d);--pln-gold:var(--cl-gold,#9b6a12);--pln-red:var(--cl-red,#b64335);color:var(--fg);line-height:1.55;max-width:100%;min-width:0;overflow-wrap:anywhere}",
    ".pln-lab *,.pln-lab *::before,.pln-lab *::after{box-sizing:border-box}.pln-lab [hidden]{display:none!important}.pln-lab h3,.pln-lab h4{margin:0;letter-spacing:0}.pln-lab h3{font-size:1.15rem}.pln-lab p{margin:.65em 0}.pln-lab button,.pln-lab input{font:inherit;letter-spacing:0}.pln-lab button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;line-height:1.35;overflow-wrap:anywhere}.pln-lab button:hover{border-color:var(--pln-blue)}.pln-lab button:focus-visible,.pln-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.pln-lab button[aria-pressed=true],.pln-lab .pln-primary{background:var(--pln-blue);border-color:var(--pln-blue);color:var(--bg);font-weight:750}.pln-note,.pln-feedback{color:var(--fg-soft);font-size:13px;line-height:1.65}.pln-prediction{margin:14px 0;padding:12px 14px;border-left:3px solid var(--pln-gold);background:var(--block-bg,var(--bg))}.pln-question{margin:0 0 12px;padding:0;border:0}.pln-question:last-of-type{margin-bottom:0}.pln-question legend{max-width:100%;margin-bottom:7px;font-size:13px;font-weight:750;line-height:1.5}.pln-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.pln-choices button{font-size:12px}.pln-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.pln-actions>*{flex:1 1 170px}.pln-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.pln-pass{color:var(--pln-green)}.pln-warn{color:var(--pln-red)}.pln-revealed{margin-top:18px;padding-top:16px;border-top:1px solid var(--border)}.pln-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0;align-items:end}.pln-control{display:grid;gap:5px;min-width:0}.pln-control label{color:var(--fg-soft);font-size:12.5px;font-weight:700}.pln-control output{color:var(--pln-blue);font-variant-numeric:tabular-nums}.pln-control input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--pln-blue)}.pln-scale{display:flex;justify-content:space-between;gap:8px;color:var(--fg-soft);font-size:11px}.pln-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;background:var(--bg);overflow-x:auto}.pln-stage-title{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin-bottom:8px;color:var(--fg-soft);font-size:13px}.pln-stage svg{display:block;width:100%;height:auto;min-width:760px;color:var(--fg)}.pln-stage svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.pln-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.65}.pln-grid{stroke:currentColor;stroke-width:1;stroke-opacity:.14}.pln-curve{fill:none;stroke:var(--pln-blue);stroke-width:2.5}.pln-secondary{fill:none;stroke:var(--pln-gold);stroke-width:2.2;stroke-dasharray:6 4}.pln-band{fill:var(--pln-gold);fill-opacity:.14;stroke:none}.pln-snr{fill:var(--pln-gold);fill-opacity:.72;stroke:none}.pln-marker{fill:var(--pln-red);stroke:var(--bg);stroke-width:1.5}.pln-bar{fill:var(--pln-green);fill-opacity:.78}.pln-label{font-size:11px;fill:var(--fg-soft)}.pln-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}.pln-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.pln-metric:nth-child(4n+1){border-color:var(--pln-blue)}.pln-metric:nth-child(4n+2){border-color:var(--pln-gold)}.pln-metric:nth-child(4n+3){border-color:var(--pln-green)}.pln-metric:nth-child(4n+4){border-color:var(--pln-red)}.pln-metric span{display:block;color:var(--fg-soft);font-size:11px}.pln-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.pln-formula{margin:12px 0 0;padding:9px 11px;border-left:3px solid var(--pln-blue);background:var(--bg);font-family:SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.65;overflow-x:auto}.pln-reset{margin-top:10px;color:var(--fg-soft)}@media(max-width:900px){.pln-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.pln-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){.pln-choices{grid-template-columns:minmax(0,1fr)}.pln-controls,.pln-metrics{grid-template-columns:minmax(0,1fr)}}@media(prefers-reduced-motion:reduce){.pln-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");
  var ID_SERIAL = 0;

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
  function uniqueId(prefix) { ID_SERIAL += 1; return prefix + "-" + ID_SERIAL; }
  function finite(value, fallback) { return typeof value === "number" && Number.isFinite(value) ? value : fallback; }
  function format(value, digits) {
    if (!Number.isFinite(value)) return "—";
    var places = digits === undefined ? 3 : digits;
    if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 1e5)) return value.toExponential(Math.min(places, 4));
    var text = Math.abs(value) > 0 && Math.abs(value) < 0.001 ? value.toExponential(Math.min(places, 4)) : value.toFixed(places);
    return text.indexOf(".") < 0 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
  }
  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }
  function appendChildren(node, children) {
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
    });
    return node;
  }
  function element(doc, tag, attrs, children) { return appendChildren(setAttributes(doc.createElement(tag), attrs), children); }
  function svgElement(doc, tag, attrs, children) { return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attrs), children); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function announce(api, root, message) { if (api && typeof api.announce === "function") api.announce(root, message); }
  function installStyles(doc) { if (!doc || !doc.getElementById || doc.getElementById(STYLE_ID)) return; var style = doc.createElement("style"); style.id = STYLE_ID; style.textContent = STYLE_TEXT; (doc.head || doc.documentElement).appendChild(style); }
  function metric(doc, label) { var value = element(doc, "strong", { text: "—" }); return { node: element(doc, "div", { className: "pln-metric" }, [element(doc, "span", { text: label }), value]), value: value }; }

  function lockinBandwidth(timeConstant) {
    if (typeof timeConstant !== "number" || !Number.isFinite(timeConstant) || timeConstant <= 0 || !Number.isFinite(0.25 / timeConstant)) throw new RangeError("positive representable time constant required");
    return 0.25 / timeConstant;
  }
  function bounded(value,fallback,lo,hi,label) {
    if(value===undefined)return fallback;
    if(typeof value!=="number" || !Number.isFinite(value) || value<lo || value>hi)throw new RangeError(label+" outside finite teaching range");
    return value;
  }
  function analyze(input) {
    var source = input || {};
    var amplitude = bounded(source.amplitude, 0.001, 0, 0.005, "amplitude");
    var frequency = bounded(source.frequency, 137, 20, 400, "frequency");
    var noisePSD = bounded(source.noisePSD, 1e-8, 1e-10, 5e-8, "noise PSD");
    var directBandwidth = bounded(source.directBandwidth, 1000, 50, 4000, "direct bandwidth");
    var timeConstant = bounded(source.timeConstant, 0.010, 0.001, 0.1, "time constant");
    var phaseDegrees = bounded(source.phaseDegrees, 0, -180, 180, "phase degrees");
    var phase = phaseDegrees * Math.PI / 180;
    var directNoiseRms = Math.sqrt(noisePSD * directBandwidth);
    var signalRms = amplitude / Math.sqrt(2);
    var directSNR = signalRms / directNoiseRms;
    var equivalentNoiseBandwidth = lockinBandwidth(timeConstant);
    var cutoff = 1 / (2 * Math.PI * timeConstant);
    var lockinNoiseRms = Math.sqrt(2 * noisePSD * equivalentNoiseBandwidth);
    var cosPhase = Math.abs(phaseDegrees) === 90 ? 0 : Math.cos(phase);
    var inPhase = amplitude * cosPhase;
    var quadrature = amplitude * (Math.abs(phaseDegrees) === 180 ? 0 : Math.sin(phase));
    var lockinSNR = Math.abs(inPhase) / lockinNoiseRms;
    var amplitudeSNR = amplitude / lockinNoiseRms;
    var rippleFraction = 1 / Math.hypot(1, 4 * Math.PI * frequency * timeConstant);
    var varianceModulation = 1 / Math.hypot(1, 2 * Math.PI * frequency * timeConstant);
    return { amplitude: amplitude, frequency: frequency, noisePSD: noisePSD, directBandwidth: directBandwidth, timeConstant: timeConstant, phaseDegrees: phaseDegrees, directNoiseRms: directNoiseRms, signalRms: signalRms, directSNR: directSNR, equivalentNoiseBandwidth: equivalentNoiseBandwidth, cutoff: cutoff, lockinNoiseRms: lockinNoiseRms, inPhase: inPhase, quadrature: quadrature, lockinSNR: lockinSNR, amplitudeSNR: amplitudeSNR, rippleFraction: rippleFraction, rippleAmplitude: amplitude * rippleFraction, varianceModulation: varianceModulation, settling99: Math.log(100) * timeConstant, improvement: amplitude === 0 ? null : Math.abs(cosPhase) * Math.sqrt(directBandwidth / equivalentNoiseBandwidth) };
  }

  function initialState() {
    return { amplitude: 0.001, frequency: 137, noisePSD: 1e-8, directBandwidth: 1000, timeConstant: 0.010, phaseDegrees: 0, predictions: [null, null, null, null], revealed: false };
  }

  function resetState(state) {
    var target = state || {};
    var defaults = initialState();
    Object.keys(defaults).forEach(function (key) { target[key] = Array.isArray(defaults[key]) ? defaults[key].slice() : defaults[key]; });
    return target;
  }

  function makeRange(doc, parent, label, key, min, max, step, digits, suffix, state, onInput) {
    var inputId = uniqueId("pln-" + key);
    var output = element(doc, "output", { for: inputId, text: format(state[key], digits) + suffix });
    var input = element(doc, "input", { id: inputId, type: "range", min: min, max: max, step: step, value: state[key], "aria-label": label });
    input.addEventListener("input", function () { state[key] = Number(input.value); output.textContent = format(state[key], digits) + suffix; onInput(); });
    var maxScale = element(doc, "span", { text: String(max) + suffix });
    parent.appendChild(element(doc, "div", { className: "pln-control" }, [element(doc, "label", { "for": inputId, text: label }), output, input, element(doc, "div", { className: "pln-scale" }, [element(doc, "span", { text: String(min) + suffix }), maxScale])]));
    return { key: key, input: input, output: output, digits: digits, suffix: suffix, maxScale: maxScale };
  }

  function drawChart(doc, chart, result) {
    clear(chart);
    chart.appendChild(svgElement(doc,"title",{text:"低通功率响应、直流相量、噪声 RMS 与 SNR 四图，刻度与单位独立"}));
    chart.appendChild(svgElement(doc,"desc",{text:"左上响应曲线在截止频率降到一半；金色矩形宽度为积分至无穷的等效噪声带宽。右上显示 I/Q 直流分量；下方分别比较噪声与信噪比。"}));
    function line(x1,y1,x2,y2,cls){chart.appendChild(svgElement(doc,"line",{x1:x1,y1:y1,x2:x2,y2:y2,class:cls||"pln-axis"}));}
    function text(x,y,label,anchor){chart.appendChild(svgElement(doc,"text",{x:x,y:y,class:"pln-label","text-anchor":anchor||"start"},[label]));}
    function rect(x,y,w,h,cls){chart.appendChild(svgElement(doc,"rect",{x:x,y:y,width:w,height:Math.max(0,h),class:cls||"pln-bar"}));}
    text(62,25,"低通功率响应 |H(f)|²；金色：等面积矩形");
    var left=62,right=344,top=60,bottom=248,sx=function(f){return left+f/(4*result.cutoff)*(right-left);},sy=function(v){return bottom-v*(bottom-top);};
    rect(left,top,sx(result.equivalentNoiseBandwidth)-left,bottom-top,"pln-band");
    [0,.5,1].forEach(function(v){text(left-8,sy(v)+4,v,"end");line(left,sy(v),right,sy(v),"pln-grid");});
    [0,1,2,4].forEach(function(k){text(sx(k*result.cutoff),269,format(k*result.cutoff,1),"middle");});
    line(left,top,left,bottom);line(left,bottom,right,bottom);line(sx(result.cutoff),top,sx(result.cutoff),bottom,"pln-secondary");
    var pts=[];for(var i=0;i<=200;i++){var f=4*result.cutoff*i/200;pts.push(sx(f)+","+sy(1/(1+Math.pow(f/result.cutoff,2))));}chart.appendChild(svgElement(doc,"polyline",{points:pts.join(" "),class:"pln-curve"}));
    text(right,290,"基带 f / Hz","end");text(left,313,"fc="+format(result.cutoff,2)+" Hz；ENBW="+format(result.equivalentNoiseBandwidth,2)+" Hz");text(left,333,"曲线延伸至图外；矩形使用 0 到 ∞ 的总面积");
    text(438,25,"I/Q 无噪声直流分量 / mV");
    var cx=585,cy=157,radius=90,scale=Math.max(result.amplitude,.0001),xx=cx+result.inPhase/scale*radius,yy=cy-result.quadrature/scale*radius;
    chart.appendChild(svgElement(doc,"circle",{cx:cx,cy:cy,r:result.amplitude/scale*radius,class:"pln-secondary"}));
    line(cx-radius-22,cy,cx+radius+22,cy);line(cx,cy-radius-22,cx,cy+radius+22);
    [-1,1].forEach(function(v){text(cx+v*radius,cy+24,format(v*scale*1000,2),"middle");text(cx+14,cy-v*radius+(v>0?-7:14),format(v*scale*1000,2));});text(cx-10,cy+18,"0","end");text(cx+radius+29,cy+4,"I");text(cx+8,cy-radius-24,"Q");
    line(cx,cy,xx,yy,"pln-curve");chart.appendChild(svgElement(doc,"circle",{cx:xx,cy:yy,r:5,class:"pln-marker"}));
    text(438,290,"φ="+format(result.phaseDegrees,0)+"°；|DC|="+format(result.amplitude*1000,3)+" mV");
    text(438,313,"2f₀ 纹波峰值="+format(result.rippleAmplitude*1000,3)+" mV");text(438,333,"纹波不计入上图的直流向量");
    function bars(x0,x1,values,labels,title){var y0=402,y1=576,max=(Math.max.apply(null,values)>0?Math.max.apply(null,values)*1.35:1);text(x0,374,title);line(x0,y0,x0,y1);line(x0,y1,x1,y1);[0,.5,1].forEach(function(a){var y=y1-a*(y1-y0);text(x0-8,y+4,format(a*max,3),"end");line(x0,y,x1,y,"pln-grid");});values.forEach(function(v,i){var x=x0+36+i*125,h=v/max*(y1-y0);rect(x,y1-h,55,h,i?"pln-bar":"pln-snr");text(x+27.5,y1-h-9,format(v,3),"middle");text(x+27.5,601,labels[i],"middle");});}
    bars(62,344,[result.directNoiseRms*1000,result.lockinNoiseRms*1000],["直接通道","锁相周期平均"],"噪声 RMS / mV");
    bars(438,720,[result.directSNR,result.lockinSNR],["正弦 RMS","|I| 直流"],"两种 SNR（无量纲，各按对应读出定义）");
    text(62,627,"锁相瞬时方差相对周期平均值的起伏：±"+format(result.varianceModulation*100,1)+"%");
    text(438,627,"单极点阶跃建立到 99%："+format(result.settling99,4)+" s");
  }

  function mount(root, api) {
    if (!root || !root.ownerDocument) return;
    var doc = root.ownerDocument; installStyles(doc); root.classList.add("pln-lab"); clear(root);
    var state = initialState();
    var questions = [
      { prompt: "白噪声 PSD 不变时，带宽扩大 4 倍，RMS 噪声？", options: ["加倍", "加 4 倍", "不变"], answer: 0 },
      { prompt: "单极点锁相时间常数 τ 加倍，ENBW？", options: ["减半", "加倍", "不变"], answer: 0 },
      { prompt: "锁相放大器能做什么？", options: ["凭空消灭所有噪声", "把参考频率附近的相干分量与窄带噪声分开", "改变信号的物理频率"], answer: 1 },
      { prompt: "参考相位错 90° 时，同相输出？", options: ["为零，但正交分量可非零", "加倍", "仍等于振幅且正交为零"], answer: 0 }
    ];
    root.appendChild(element(doc, "h3", { text: "预测闸门：锁相不是魔法，是带宽账本" }));
    root.appendChild(element(doc, "p", { className: "pln-note", text: "先预测 PSD 积分、时间常数和相位；揭示后可调信号、白噪声 PSD、直接带宽与锁相 ENBW。约定 x(t)=A cos(ωt+φ)，Q 通道使用 −2 sin(ωt) 参考，因此 Q=A sinφ。" }));
    var prediction = element(doc, "div", { className: "pln-prediction" }); var choiceButtons = [];
    questions.forEach(function (question, questionIndex) { var fieldset = element(doc, "fieldset", { className: "pln-question" }); fieldset.appendChild(element(doc, "legend", { text: (questionIndex + 1) + ". " + question.prompt })); var choices = element(doc, "div", { className: "pln-choices" }); choiceButtons[questionIndex] = []; question.options.forEach(function (label, optionIndex) { var button = element(doc, "button", { type: "button", text: label, "aria-pressed": "false" }); button.addEventListener("click", function () { state.revealed = false; state.predictions[questionIndex] = optionIndex; render(); choiceButtons[questionIndex].forEach(function (item) { item.setAttribute("aria-pressed", "false"); }); button.setAttribute("aria-pressed", "true"); }); choiceButtons[questionIndex].push(button); choices.appendChild(button); }); fieldset.appendChild(choices); prediction.appendChild(fieldset); });
    var feedback = element(doc, "p", { className: "pln-feedback", "aria-live": "polite" }); var actions = element(doc, "div", { className: "pln-actions" }); var reveal = element(doc, "button", { type: "button", className: "pln-primary", text: "揭示 PSD/SNR" }); var clearPredictions = element(doc, "button", { type: "button", text: "清空预测" }); actions.appendChild(reveal); actions.appendChild(clearPredictions); prediction.appendChild(actions); prediction.appendChild(feedback); root.appendChild(prediction);
    var revealed = element(doc, "div", { className: "pln-revealed", hidden: true }); revealed.appendChild(element(doc, "h4", { text: "直接测量与锁相读数" }));
    var controls = element(doc, "div", { className: "pln-controls" });
    var rangeControls = {};
    rangeControls.amplitude = makeRange(doc, controls, "信号振幅 A", "amplitude", 0, 0.005, 0.0001, 4, " V", state, render);
    rangeControls.frequency = makeRange(doc, controls, "参考频率 f₀", "frequency", 20, 400, 1, 0, " Hz", state, render);
    rangeControls.noisePSD = makeRange(doc, controls, "白噪声 PSD Sₙ", "noisePSD", 1e-10, 5e-8, 1e-10, 2, " V²/Hz", state, render);
    rangeControls.directBandwidth = makeRange(doc, controls, "直接测量带宽 B", "directBandwidth", 50, 4000, 10, 0, " Hz", state, render);
    rangeControls.timeConstant = makeRange(doc, controls, "锁相时间常数 τ", "timeConstant", 0.001, 0.1, 0.001, 3, " s", state, render);
    rangeControls.phaseDegrees = makeRange(doc, controls, "参考相位 φ", "phaseDegrees", -180, 180, 1, 0, "°", state, render);
    revealed.appendChild(controls);
    var stage = element(doc, "div", { className: "pln-stage", tabindex: "0", role: "region", "aria-label": "四幅实验图，可用左右方向键横向滚动" }); var stageTitle = element(doc, "div", { className: "pln-stage-title" }, [element(doc, "span", { text: "单极点低通与直流读出：周期平均噪声模型" }), element(doc, "span", { className: "pln-status", text: "" })]); var chart = svgElement(doc, "svg", { viewBox: "0 0 760 650", role: "img", "aria-label": "低通、相量、噪声与SNR四图" }); stage.appendChild(stageTitle); stage.appendChild(chart); revealed.appendChild(stage);
    var metrics = element(doc, "div", { className: "pln-metrics" }); var metricNodes = [metric(doc, "直接 SNR"), metric(doc, "|I| / 周期平均噪声 RMS"), metric(doc, "ENBW"), metric(doc, "同相 I / 正交 Q")]; metricNodes.forEach(function (item) { metrics.appendChild(item.node); }); revealed.appendChild(metrics);
    var diagnostics = element(doc,"p",{className:"pln-note"});revealed.appendChild(diagnostics);
    var formula = element(doc, "div", { className: "pln-formula", text: "x(t)=A cos(ωt+φ)；I=⟨2 cosωt·x⟩=A cosφ；Q=⟨−2 sinωt·x⟩=A sinφ；单边 PSD：σ²=SₙB" }); revealed.appendChild(formula); var reset = element(doc, "button", { type: "button", className: "pln-reset", text: "重置实验" }); revealed.appendChild(reset); root.appendChild(revealed);

    function syncControls() {
      Object.keys(rangeControls).forEach(function (key) {
        var control = rangeControls[key];
        control.input.value = state[control.key];
        control.output.textContent = format(state[control.key], control.digits) + control.suffix;
      });
      revealed.hidden = !state.revealed;
    }

    function render() {
      syncControls();
      var result = analyze(state);
      metricNodes[0].value.textContent = format(result.directSNR, 3);
      metricNodes[1].value.textContent = format(result.lockinSNR, 3);
      metricNodes[2].value.textContent = format(result.equivalentNoiseBandwidth, 2) + " Hz";
      metricNodes[3].value.textContent = format(result.inPhase * 1000, 3) + " mV（Q=" + format(result.quadrature * 1000, 3) + " mV）";
      stageTitle.querySelector(".pln-status").textContent = result.phaseDegrees === 0 ? "相位对齐：同相通道最大" : Math.abs(result.phaseDegrees)===180 ? "反相：I 为负，|I| 仍最大" : Math.abs(Math.abs(result.phaseDegrees) - 90) <= 10 ? "近正交：看 Q 通道" : "相位失配会降低 I 通道";
      formula.textContent = "I=A cosφ=" + format(result.inPhase * 1000, 3) + " mV；Q=A sinφ=⟨−2 sinωt·x⟩=" + format(result.quadrature * 1000, 3) + " mV；σ_LI=√(2SₙB_ENBW)=" + format(result.lockinNoiseRms * 1000, 3) + " mV；两种 SNR 比值=" + format(result.improvement, 2) + "×";
      diagnostics.textContent = "图中 I/Q 为无噪声直流分量。2f₀ 纹波峰值占 A 的 " + format(result.rippleFraction*100,2) + "%（A=0 时纹波也为 0）；瞬时噪声方差起伏 ±" + format(result.varianceModulation*100,2) + "% 。" + (result.rippleFraction>.1 ? "此配置纹波超过输入振幅的 10%，不能把整个输出近似为纯直流。" : "仍须按目标精度评估剩余纹波，并等待滤波器建立。");
      drawChart(doc, chart, result);
    }
    reveal.addEventListener("click", function () { if (state.predictions.some(function (value) { return value === null; })) { feedback.className = "pln-feedback pln-warn"; feedback.textContent = "请先完成四个预测，再揭示 PSD/SNR 账本。"; return; } var score = state.predictions.reduce(function (sum, value, index) { return sum + (value === questions[index].answer ? 1 : 0); }, 0); feedback.className = "pln-feedback " + (score === questions.length ? "pln-pass" : "pln-warn"); feedback.textContent = "预测命中 " + score + "/" + questions.length + "；现在看带宽如何把噪声积分进读数。"; state.revealed = true; render(); announce(api, root, feedback.textContent); });
    clearPredictions.addEventListener("click", function () { state.revealed = false; render(); state.predictions = [null, null, null, null]; choiceButtons.forEach(function (buttons) { buttons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); }); }); feedback.className = "pln-feedback"; feedback.textContent = "预测已清空。"; });
    reset.addEventListener("click", function () { resetState(state); choiceButtons.forEach(function (buttons) { buttons.forEach(function (button) { button.setAttribute("aria-pressed", "false"); }); }); feedback.className = "pln-feedback"; feedback.textContent = "实验已重置并上锁。"; render(); choiceButtons[0][0].focus(); announce(api, root, "锁相与噪声实验已重置。"); });
    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) { checks += 1; if (!condition) throw new Error("physics-lockin-noise self-test failed: " + message); }
    function close(left, right, tolerance, message) { assert(Math.abs(left - right) <= tolerance * Math.max(1, Math.abs(left), Math.abs(right)), message + " (" + left + " vs " + right + ")"); }
    close(lockinBandwidth(0.01), 25, 1e-12, "single-pole ENBW");
    var baseline = analyze({ amplitude: 0.001, frequency: 137, noisePSD: 1e-8, directBandwidth: 1000, timeConstant: 0.01, phaseDegrees: 0 });
    close(baseline.directNoiseRms, Math.sqrt(1e-5), 1e-12, "direct PSD integral");
    close(baseline.lockinNoiseRms, Math.sqrt(2 * 1e-8 * 25), 1e-12, "one-sided PSD lock-in integral");
    close(baseline.directSNR, (0.001 / Math.sqrt(2)) / Math.sqrt(1e-5), 1e-12, "direct SNR convention");
    close(baseline.lockinSNR, Math.sqrt(2), 1e-12, "lock-in SNR convention");
    close(analyze({ timeConstant: 0.02 }).equivalentNoiseBandwidth, 12.5, 1e-12, "longer time constant narrows ENBW");
    close(analyze({ directBandwidth: 4000 }).directNoiseRms, baseline.directNoiseRms * 2, 1e-12, "white noise square-root bandwidth");
    assert(Math.abs(analyze({ phaseDegrees: 90 }).inPhase) < 1e-15, "quadrature phase removes I channel");
    assert(analyze({ phaseDegrees: 90 }).quadrature > 0, "quadrature channel remains");
    close(analyze({ amplitude: 0.001, phaseDegrees: 30 }).quadrature, 0.001 * 0.5, 1e-12, "negative-sine reference gives Q=A sin phi");
    assert(baseline.improvement > 6 && baseline.improvement < 7, "default bandwidth improvement");
    var reset = initialState(); reset.phaseDegrees = 60; reset.directBandwidth = 3000; reset.predictions[0] = 1; reset.revealed = true; resetState(reset);
    assert(reset.phaseDegrees === 0 && reset.directBandwidth === 1000 && reset.predictions.every(function (value) { return value === null; }) && reset.revealed === false, "pure reset state");
    return { checks: checks };
  }

  return { lockinBandwidth: lockinBandwidth, analyze: analyze, initialState: initialState, resetState: resetState, mount: mount, selfTest: selfTest };
});

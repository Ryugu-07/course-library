(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("ee-mcu-pwm", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("ee-mcu-pwm self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("ee-mcu-pwm self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  "use strict";

  var LAB_ID = "ee-mcu-pwm";
  var STYLE_ID = "ee-mcu-pwm-styles";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var DEFAULTS = {
    supply: 3.3,
    sleepCurrentUa: 20,
    activeCurrentmA: 6,
    activeMs: 12,
    periodMs: 1000,
    sensorCurrentmA: 0.4,
    sensorActiveMs: 8,
    radioCurrentmA: 12,
    radioMs: 2,
    adcAtMs: 4,
    radioAtMs: 8,
    pwmStartMs: 5,
    pwmFrequencyHz: 1000,
    pwmDuty: 0.4,
    pwmHigh: 3.3,
    pwmLow: 0,
    loadResistance: 1000,
    filterCapacitance: 1e-6,
    timerRunsInSleep: true
  };
  var QUESTIONS = [
    { key: "ledger", prompt: "周期性唤醒系统的平均电流，最不能只看哪一个瞬时读数？", expected: "integral", choices: [["peak", "峰值电流一眼就够"], ["integral", "要按时间积分睡眠、活动和外设事件"], ["voltage", "只看供电电压"]] },
    { key: "ripple", prompt: "在同一个 RC 负载下，提高 PWM 频率通常会怎样？", expected: "smaller", choices: [["smaller", "纹波变小，平均值仍由占空比主导"], ["larger", "纹波必然变大"], ["zero", "纹波立即为零"]] },
    { key: "boundary", prompt: "MCU 进入睡眠后，PWM 是否继续运行最可靠的判断依据是什么？", expected: "peripheral", choices: [["peripheral", "具体外设与时钟源的数据手册条件"], ["duty", "只由占空比决定"], ["always", "所有 MCU 都会继续运行"]] }
  ];
  function assert(condition, message) { if (!condition) throw new Error(message); }
  function finite(value, label) { var number = Number(value); if (!isFinite(number)) throw new RangeError(label + " must be finite"); return number; }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function near(left, right, tolerance) { var scale = Math.max(1, Math.abs(left), Math.abs(right)); return Math.abs(left - right) <= (tolerance || 1e-8) * scale; }
  function format(value, digits) { if (!isFinite(value)) return "-"; var places = digits === undefined ? 2 : digits; if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) return value.toExponential(Math.min(places, 4)); return value.toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, ""); }
  function formatControl(key, value) {
    if (key === "activeMs") return format(value, 1) + " ms";
    if (key === "sleepCurrentUa") return format(value, 1) + " µA";
    if (key === "pwmDuty") return format(value * 100, 1) + "%";
    if (key === "pwmFrequencyHz") return format(value / 1000, 1) + " kHz";
    if (key === "filterCapacitance") return format(value * 1e6, 2) + " µF";
    return format(value, 2);
  }
  function normalize(input) {
    var source = input || {};
    return {
      supply: clamp(finite(source.supply === undefined ? DEFAULTS.supply : source.supply, "supply"), 1, 5.5),
      sleepCurrentUa: clamp(finite(source.sleepCurrentUa === undefined ? DEFAULTS.sleepCurrentUa : source.sleepCurrentUa, "sleep current"), 0, 500),
      activeCurrentmA: clamp(finite(source.activeCurrentmA === undefined ? DEFAULTS.activeCurrentmA : source.activeCurrentmA, "active current"), 0.1, 50),
      activeMs: clamp(finite(source.activeMs === undefined ? DEFAULTS.activeMs : source.activeMs, "active time"), 1, 500),
      periodMs: clamp(finite(source.periodMs === undefined ? DEFAULTS.periodMs : source.periodMs, "wake period"), 50, 10000),
      sensorCurrentmA: clamp(finite(source.sensorCurrentmA === undefined ? DEFAULTS.sensorCurrentmA : source.sensorCurrentmA, "sensor current"), 0, 50),
      sensorActiveMs: clamp(finite(source.sensorActiveMs === undefined ? DEFAULTS.sensorActiveMs : source.sensorActiveMs, "sensor active time"), 0, 500),
      radioCurrentmA: clamp(finite(source.radioCurrentmA === undefined ? DEFAULTS.radioCurrentmA : source.radioCurrentmA, "radio current"), 0, 100),
      radioMs: clamp(finite(source.radioMs === undefined ? DEFAULTS.radioMs : source.radioMs, "radio time"), 0, 100),
      adcAtMs: clamp(finite(source.adcAtMs === undefined ? DEFAULTS.adcAtMs : source.adcAtMs, "ADC event time"), 0, 500),
      radioAtMs: clamp(finite(source.radioAtMs === undefined ? DEFAULTS.radioAtMs : source.radioAtMs, "radio event time"), 0, 500),
      pwmStartMs: clamp(finite(source.pwmStartMs === undefined ? DEFAULTS.pwmStartMs : source.pwmStartMs, "PWM start time"), 0, 500),
      pwmFrequencyHz: clamp(finite(source.pwmFrequencyHz === undefined ? DEFAULTS.pwmFrequencyHz : source.pwmFrequencyHz, "PWM frequency"), 10, 20000),
      pwmDuty: clamp(finite(source.pwmDuty === undefined ? DEFAULTS.pwmDuty : source.pwmDuty, "PWM duty"), 0, 1),
      pwmHigh: clamp(finite(source.pwmHigh === undefined ? DEFAULTS.pwmHigh : source.pwmHigh, "PWM high"), 0, 5.5),
      pwmLow: clamp(finite(source.pwmLow === undefined ? DEFAULTS.pwmLow : source.pwmLow, "PWM low"), 0, 5.5),
      loadResistance: clamp(finite(source.loadResistance === undefined ? DEFAULTS.loadResistance : source.loadResistance, "load resistance"), 10, 100000),
      filterCapacitance: clamp(finite(source.filterCapacitance === undefined ? DEFAULTS.filterCapacitance : source.filterCapacitance, "filter capacitance"), 1e-9, 100e-6),
      timerRunsInSleep: source.timerRunsInSleep === undefined ? DEFAULTS.timerRunsInSleep : !(source.timerRunsInSleep === false || Number(source.timerRunsInSleep) === 0)
    };
  }
  function computeMcuPwm(input) {
    var state = normalize(input);
    var periodSeconds = state.periodMs / 1000;
    var activeFraction = clamp(state.activeMs / state.periodMs, 0, 1);
    var sensorFraction = clamp(state.sensorActiveMs / state.periodMs, 0, 1);
    var radioFraction = clamp(state.radioMs / state.periodMs, 0, 1);
    var mcuAverage = state.activeCurrentmA * activeFraction + state.sleepCurrentUa / 1000 * (1 - activeFraction);
    var sensorAverage = state.sensorCurrentmA * sensorFraction;
    var radioAverage = state.radioCurrentmA * radioFraction;
    var pwmPeriod = 1 / state.pwmFrequencyHz, pwmPeriodMs = pwmPeriod * 1000, onTime = pwmPeriod * state.pwmDuty, offTime = pwmPeriod - onTime, onTimeMs = pwmPeriodMs * state.pwmDuty;
    var tau = state.loadResistance * state.filterCapacitance, delta = state.pwmHigh - state.pwmLow;
    var tauMs = tau * 1000, minVoltage, maxVoltage, averageVoltage;
    if (state.pwmDuty <= 0) {
      minVoltage = state.pwmLow; maxVoltage = state.pwmLow; averageVoltage = state.pwmLow;
    } else if (state.pwmDuty >= 1) {
      minVoltage = state.pwmHigh; maxVoltage = state.pwmHigh; averageVoltage = state.pwmHigh;
    } else {
      var a = Math.exp(-onTime / tau), b = Math.exp(-offTime / tau);
      minVoltage = (state.pwmLow * (1 - b) + state.pwmHigh * b * (1 - a)) / (1 - a * b);
      maxVoltage = state.pwmHigh + (minVoltage - state.pwmHigh) * a;
      var highIntegral = state.pwmHigh * onTime + (minVoltage - state.pwmHigh) * tau * (1 - a);
      var lowIntegral = state.pwmLow * offTime + (maxVoltage - state.pwmLow) * tau * (1 - b);
      averageVoltage = (highIntegral + lowIntegral) / pwmPeriod;
    }
    var idealPwmAverage = state.pwmLow + delta * state.pwmDuty;
    var activeEnd = Math.min(state.activeMs, state.periodMs);
    var pwmStop = state.timerRunsInSleep ? state.periodMs : activeEnd, timerStart = Math.min(state.pwmStartMs, pwmStop);
    var waveformSegments = [], voltage = state.pwmLow, voltageIntegralMs = 0, voltageSquareIntegralMs = 0, commandIntegralMs = 0, wakeMin = voltage, wakeMax = voltage;
    function appendSegment(startMs, endMs, targetVoltage, kind) {
      var durationMs = Math.max(0, endMs - startMs);
      if (durationMs <= 0) return;
      var initialVoltage = voltage, difference = initialVoltage - targetVoltage, decay = Math.exp(-durationMs / tauMs), finalVoltage = targetVoltage + difference * decay;
      var oneMinusDecay = 1 - decay, oneMinusDecaySquared = 1 - decay * decay;
      var integralMs = targetVoltage * durationMs + difference * tauMs * oneMinusDecay;
      var squareIntegralMs = targetVoltage * targetVoltage * durationMs + 2 * targetVoltage * difference * tauMs * oneMinusDecay + difference * difference * tauMs * 0.5 * oneMinusDecaySquared;
      waveformSegments.push({ startMs: startMs, endMs: endMs, commandVoltage: targetVoltage, startVoltage: initialVoltage, endVoltage: finalVoltage, kind: kind });
      voltageIntegralMs += integralMs; voltageSquareIntegralMs += squareIntegralMs; commandIntegralMs += targetVoltage * durationMs; voltage = finalVoltage;
      wakeMin = Math.min(wakeMin, initialVoltage, finalVoltage); wakeMax = Math.max(wakeMax, initialVoltage, finalVoltage);
    }
    appendSegment(0, timerStart, state.pwmLow, "prestart");
    var cursor = timerStart, guard = 0;
    while (cursor < pwmStop - 1e-9 && guard < 200000) {
      var elapsedMs = cursor - timerStart, cyclePosition = elapsedMs / pwmPeriodMs, cycleNumber = Math.floor(cyclePosition + 1e-9), phaseMs = (cyclePosition - cycleNumber) * pwmPeriodMs;
      if (phaseMs < 1e-7 || pwmPeriodMs - phaseMs < 1e-7) phaseMs = 0;
      if (Math.abs(phaseMs - onTimeMs) < 1e-7) phaseMs = onTimeMs;
      var highPhase = state.pwmDuty >= 1 || (state.pwmDuty > 0 && phaseMs < onTimeMs);
      var untilBoundary = highPhase ? onTimeMs - phaseMs : pwmPeriodMs - phaseMs;
      if (untilBoundary <= 1e-9) untilBoundary = pwmPeriodMs;
      var next = Math.min(pwmStop, cursor + untilBoundary);
      appendSegment(cursor, next, highPhase ? state.pwmHigh : state.pwmLow, highPhase ? "pwm-high" : "pwm-low");
      cursor = next; guard += 1;
    }
    var heldOutputVoltage = state.pwmLow, heldOutputKind = "pwm-low";
    if (!state.timerRunsInSleep && state.pwmStartMs < activeEnd && state.pwmDuty > 0) {
      var stopPhaseMs = ((activeEnd - state.pwmStartMs) % pwmPeriodMs + pwmPeriodMs) % pwmPeriodMs;
      heldOutputVoltage = stopPhaseMs < onTimeMs || state.pwmDuty >= 1 ? state.pwmHigh : state.pwmLow;
      heldOutputKind = heldOutputVoltage === state.pwmHigh ? "hold-high" : "hold-low";
    }
    if (!state.timerRunsInSleep) appendSegment(pwmStop, state.periodMs, heldOutputVoltage, heldOutputKind);
    function segmentAt(timeMs) {
      for (var segmentIndex = 0; segmentIndex < waveformSegments.length; segmentIndex += 1) {
        if (timeMs < waveformSegments[segmentIndex].endMs || segmentIndex === waveformSegments.length - 1) return waveformSegments[segmentIndex];
      }
      return null;
    }
    function voltageAt(timeMs) {
      var segment = segmentAt(timeMs);
      if (!segment) return voltage;
      var elapsed = Math.max(0, Math.min(segment.endMs - segment.startMs, timeMs - segment.startMs));
      return segment.commandVoltage + (segment.startVoltage - segment.commandVoltage) * Math.exp(-elapsed / tauMs);
    }
    var plotSpanMs = state.timerRunsInSleep ? Math.max(6 * pwmPeriodMs, timerStart + 6 * pwmPeriodMs) : Math.max(6 * pwmPeriodMs, activeEnd + 3 * tauMs, timerStart + 2 * pwmPeriodMs);
    var plotEndMs = Math.min(state.periodMs, Math.max(0, plotSpanMs)), plotTimes = [], sampleCount = 240, plotIndex;
    for (plotIndex = 0; plotIndex <= sampleCount; plotIndex += 1) plotTimes.push(plotEndMs * plotIndex / sampleCount);
    waveformSegments.forEach(function (segment) { if (segment.startMs > 0 && segment.startMs < plotEndMs) plotTimes.push(segment.startMs); if (segment.endMs > 0 && segment.endMs < plotEndMs) plotTimes.push(segment.endMs); });
    plotTimes.sort(function (left, right) { return left - right; });
    var waveformPlot = [], lastPlotTime = -1;
    plotTimes.forEach(function (timeMs) { if (lastPlotTime >= 0 && Math.abs(timeMs - lastPlotTime) < 1e-9) return; var segment = segmentAt(timeMs); waveformPlot.push({ ms: timeMs, commandVoltage: segment ? segment.commandVoltage : state.pwmLow, outputVoltage: voltageAt(timeMs) }); lastPlotTime = timeMs; });
    var averageVoltageActual = voltageIntegralMs / state.periodMs, averageVoltageSquared = voltageSquareIntegralMs / state.periodMs;
    var loadAverageCurrentmA = averageVoltageActual / state.loadResistance * 1000, loadPowerW = averageVoltageSquared / state.loadResistance, loadPowermW = loadPowerW * 1000;
    var totalAverage = mcuAverage + sensorAverage + radioAverage + loadAverageCurrentmA;
    var chargePerPeriod = totalAverage * periodSeconds / 3600;
    var energyPerPeriod = state.supply * totalAverage / 1000 * periodSeconds;
    var timeline = [
      { name: "唤醒/MCU 活动", start: 0, end: activeEnd, kind: "active" },
      { name: "ADC", start: Math.min(state.adcAtMs, activeEnd), end: Math.min(state.adcAtMs + 1, activeEnd), kind: "adc" },
      { name: "PWM 定时器", start: Math.min(timerStart, pwmStop), end: pwmStop, kind: "pwm" },
      { name: "发送", start: Math.min(state.radioAtMs, activeEnd), end: Math.min(state.radioAtMs + state.radioMs, activeEnd), kind: "radio" }
    ];
    if (!state.timerRunsInSleep) timeline.push({ name: "停机后输出保持 " + (heldOutputVoltage === state.pwmHigh ? "高" : "低"), start: pwmStop, end: state.periodMs, kind: "hold" });
    timeline.push({ name: "睡眠", start: activeEnd, end: state.periodMs, kind: "sleep" });
    return {
      config: state,
      periodSeconds: periodSeconds,
      activeFraction: activeFraction,
      sensorFraction: sensorFraction,
      radioFraction: radioFraction,
      mcuAverage: mcuAverage,
      sensorAverage: sensorAverage,
      radioAverage: radioAverage,
      pwmLoadAverageCurrentmA: loadAverageCurrentmA,
      totalAverage: totalAverage,
      chargePerPeriodmAh: chargePerPeriod,
      energyPerPeriodJ: energyPerPeriod,
      averagePowerW: energyPerPeriod / periodSeconds,
      pwmPeriodUs: pwmPeriod * 1e6,
      onTimeUs: onTime * 1e6,
      tauMs: tau * 1000,
      minVoltage: minVoltage,
      maxVoltage: maxVoltage,
      averageVoltage: averageVoltageActual,
      steadyStateMinVoltage: minVoltage,
      steadyStateMaxVoltage: maxVoltage,
      steadyStateAverageVoltage: averageVoltage,
      averageVoltageSquared: averageVoltageSquared,
      idealPwmAverage: idealPwmAverage,
      systemIdealPwmAverage: commandIntegralMs / state.periodMs,
      ripple: maxVoltage - minVoltage,
      wakeMinVoltage: wakeMin,
      wakeMaxVoltage: wakeMax,
      wakeRipple: wakeMax - wakeMin,
      loadAverageCurrentmA: loadAverageCurrentmA,
      loadPowerW: loadPowerW,
      pwmLoadPowerW: loadPowerW,
      loadPowermW: loadPowermW,
      pwmLoadPowermW: loadPowermW,
      pwmLoadEnergyPerPeriodJ: loadPowerW * periodSeconds,
      waveformSegments: waveformSegments,
      waveformPlot: waveformPlot,
      pwmStartMs: timerStart,
      pwmStopMs: state.timerRunsInSleep ? null : pwmStop,
      pwmActiveEndMs: pwmStop,
      heldOutputVoltage: heldOutputVoltage,
      postStopOutput: state.timerRunsInSleep ? "睡眠中继续运行，无停机保持段" : "停机后保持 " + (heldOutputVoltage === state.pwmHigh ? "高电平" : "低电平"),
      timeline: timeline,
      dominantCurrent: state.activeCurrentmA * activeFraction >= state.sleepCurrentUa / 1000 * (1 - activeFraction) ? "活动段" : "睡眠段",
      pwmBoundary: state.timerRunsInSleep ? "定时器在睡眠时钟条件下继续，PWM 负载全周期计入" : "t=" + format(pwmStop, 1) + " ms 停机，GPIO 保持" + (heldOutputVoltage === state.pwmHigh ? "高" : "低") + "电平"
    };
  }
  function element(doc, tag, attrs, children) { var node = doc.createElement(tag); Object.keys(attrs || {}).forEach(function (key) { var value = attrs[key]; if (value === undefined || value === null || value === false) return; if (key === "className") node.setAttribute("class", String(value)); else if (key === "htmlFor") node.setAttribute("for", String(value)); else if (key === "text") node.textContent = String(value); else if (value === true) node.setAttribute(key, ""); else node.setAttribute(key, String(value)); }); (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) { if (child === undefined || child === null || child === false) return; node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); }); return node; }
  function svgElement(doc, tag, attrs, children) { var node = doc.createElementNS(SVG_NS, tag); Object.keys(attrs || {}).forEach(function (key) { var value = attrs[key]; if (value === undefined || value === null || value === false) return; node.setAttribute(key, String(value)); }); (Array.isArray(children) ? children : children === undefined ? [] : [children]).forEach(function (child) { if (child === undefined || child === null || child === false) return; node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child))); }); return node; }
  function svgText(doc, parent, value, x, y, attrs) { var all = attrs || {}; all.x = x; all.y = y; parent.appendChild(svgElement(doc, "text", all, value)); }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function installStyles(doc) {
    if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style"); style.id = STYLE_ID;
    style.textContent =
      '[data-learning-lab="' + LAB_ID + '"]{--emc-blue:#2b669e;--emc-red:#b7473b;--emc-green:#39734d;--emc-gold:#9a6a10;display:block;max-width:100%;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow:hidden;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] *{box-sizing:border-box}[data-learning-lab="' + LAB_ID + '"] [hidden]{display:none!important}[data-learning-lab="' + LAB_ID + '"] h3{margin:0;font-size:1.15rem;letter-spacing:0}[data-learning-lab="' + LAB_ID + '"] p{margin:8px 0}' +
      '[data-learning-lab="' + LAB_ID + '"] fieldset{min-width:0;margin:11px 0;padding:10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="' + LAB_ID + '"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}' +
      '[data-learning-lab="' + LAB_ID + '"] .emc-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}[data-learning-lab="' + LAB_ID + '"] button,[data-learning-lab="' + LAB_ID + '"] input,[data-learning-lab="' + LAB_ID + '"] select{font:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] button{min-width:0;min-height:44px;padding:8px 11px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor);line-height:1.35;cursor:pointer;overflow-wrap:anywhere}[data-learning-lab="' + LAB_ID + '"] button:hover{border-color:var(--emc-blue)}[data-learning-lab="' + LAB_ID + '"] button[aria-pressed="true"],[data-learning-lab="' + LAB_ID + '"] .emc-primary{border-color:var(--emc-blue);background:var(--emc-blue);color:#fff;font-weight:750}[data-learning-lab="' + LAB_ID + '"] button:disabled{cursor:not-allowed;opacity:.55}' +
      '[data-learning-lab="' + LAB_ID + '"] button:focus-visible,[data-learning-lab="' + LAB_ID + '"] input:focus-visible,[data-learning-lab="' + LAB_ID + '"] select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}[data-learning-lab="' + LAB_ID + '"] .emc-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="' + LAB_ID + '"] .emc-actions>*{flex:1 1 180px}[data-learning-lab="' + LAB_ID + '"] .emc-feedback{min-height:2em;margin:8px 0;font-weight:700;color:var(--fg-soft,currentColor)}' +
      '[data-learning-lab="' + LAB_ID + '"] .emc-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0;align-items:end}[data-learning-lab="' + LAB_ID + '"] .emc-control{display:grid;gap:5px;min-width:0}[data-learning-lab="' + LAB_ID + '"] .emc-control label{font-size:12.5px;font-weight:700}[data-learning-lab="' + LAB_ID + '"] output{color:var(--emc-blue);font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] input[type=range]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--emc-blue)}[data-learning-lab="' + LAB_ID + '"] select{width:100%;min-height:44px;padding:7px 9px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:var(--fg,currentColor)}' +
      '[data-learning-lab="' + LAB_ID + '"] .emc-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(260px,.8fr);gap:14px;align-items:start;margin-top:12px}[data-learning-lab="' + LAB_ID + '"] .emc-stage{min-width:0;padding:7px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg,currentColor)}[data-learning-lab="' + LAB_ID + '"] svg text{font-family:inherit;letter-spacing:0}' +
      '[data-learning-lab="' + LAB_ID + '"] .emc-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}[data-learning-lab="' + LAB_ID + '"] .emc-metric{min-width:0;padding:9px;border-top:2px solid var(--emc-blue);background:var(--bg,transparent)}[data-learning-lab="' + LAB_ID + '"] .emc-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .emc-metric strong{display:block;margin-top:3px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + LAB_ID + '"] .emc-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="' + LAB_ID + '"] table{width:100%;min-width:500px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + LAB_ID + '"] th,[data-learning-lab="' + LAB_ID + '"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top}[data-learning-lab="' + LAB_ID + '"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="' + LAB_ID + '"] .emc-note{margin-top:10px;color:var(--fg-soft,currentColor);font-size:12.5px;line-height:1.65}' +
      '@media(max-width:820px){[data-learning-lab="' + LAB_ID + '"] .emc-layout{grid-template-columns:1fr}}@media(max-width:620px){[data-learning-lab="' + LAB_ID + '"] .emc-choice-grid,[data-learning-lab="' + LAB_ID + '"] .emc-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){[data-learning-lab="' + LAB_ID + '"] .emc-choice-grid,[data-learning-lab="' + LAB_ID + '"] .emc-controls{grid-template-columns:1fr}[data-learning-lab="' + LAB_ID + '"] .emc-actions>*{flex-basis:100%}}@media(prefers-reduced-motion:reduce){[data-learning-lab="' + LAB_ID + '"] *{animation:none!important;transition:none!important}}';
    (doc.head || doc.documentElement).appendChild(style);
  }
  function announce(api, rootNode, message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); var live = rootNode.querySelector("[data-emc-live]"); if (live) live.textContent = message; }
  function drawSvg(doc, node, result) {
    clear(node); node.setAttribute("viewBox", "0 0 780 400"); node.setAttribute("role", "img"); node.setAttribute("aria-label", "MCU 唤醒睡眠事件时间线和 PWM 平均值与纹波波形");
    node.appendChild(svgElement(doc, "title", {}, "MCU 电流账本、事件时间线与 PWM 波形")); node.appendChild(svgElement(doc, "desc", {}, "上方是周期内的唤醒、ADC、PWM 定时器、发送、停机保持和睡眠事件；下方用实际分段指数 RC 响应比较 PWM 命令与输出，不用正弦代替。"));
    var blue = "var(--emc-blue)", red = "var(--emc-red)", green = "var(--emc-green)", gold = "var(--emc-gold)";
    node.appendChild(svgElement(doc, "rect", { x: 16, y: 24, width: 748, height: 166, rx: 6, fill: "none", stroke: "currentColor", "stroke-opacity": ".35" })); svgText(doc, node, "一个唤醒周期的事件时间线（ms）", 30, 46, { "font-size": 13, "font-weight": 700 });
    var left = 110, right = 742, top = 57, row = 18, scale = (right - left) / result.config.periodMs;
    function tx(ms) { return left + ms * scale; }
    node.appendChild(svgElement(doc, "line", { x1: left, y1: 174, x2: right, y2: 174, stroke: "currentColor", "stroke-opacity": ".45" })); svgText(doc, node, "0", left, 188, { "font-size": 10 }); svgText(doc, node, format(result.config.periodMs, 0), right, 188, { "font-size": 10, "text-anchor": "end" });
    result.timeline.forEach(function (event, index) { var y = top + index * row, x1 = tx(event.start), x2 = Math.max(x1 + 2, tx(event.end)); var color = event.kind === "active" ? blue : event.kind === "sleep" ? green : event.kind === "pwm" ? gold : event.kind === "hold" ? red : red; node.appendChild(svgElement(doc, "line", { x1: left, y1: y + 7, x2: right, y2: y + 7, stroke: "currentColor", "stroke-opacity": ".15" })); node.appendChild(svgElement(doc, "rect", { x: x1, y: y, width: Math.max(2, x2 - x1), height: 14, rx: 2, fill: color, "fill-opacity": ".75", stroke: color })); svgText(doc, node, event.name, 27, y + 11, { "font-size": 9.5, fill: color }); });
    svgText(doc, node, result.pwmBoundary, 420, 188, { "font-size": 9, "text-anchor": "middle", fill: gold });
    node.appendChild(svgElement(doc, "rect", { x: 16, y: 204, width: 748, height: 174, rx: 6, fill: "none", stroke: "currentColor", "stroke-opacity": ".35" })); svgText(doc, node, "PWM：占空比定平均值，RC 用分段指数响应", 30, 226, { "font-size": 13, "font-weight": 700 });
    var waveLeft = 48, waveRight = 735, waveTop = 242, waveBottom = 347, plot = result.waveformPlot, plotEnd = plot.length ? plot[plot.length - 1].ms : 1, waveMin = Math.min(0, result.config.pwmLow, result.wakeMinVoltage), waveMax = Math.max(result.config.pwmHigh, result.wakeMaxVoltage, 0.1), waveSpan = Math.max(0.1, waveMax - waveMin);
    node.appendChild(svgElement(doc, "line", { x1: waveLeft, y1: waveBottom, x2: waveRight, y2: waveBottom, stroke: "currentColor", "stroke-opacity": ".45" })); node.appendChild(svgElement(doc, "line", { x1: waveLeft, y1: waveTop, x2: waveLeft, y2: waveBottom, stroke: "currentColor", "stroke-opacity": ".45" }));
    var raw = [], smooth = [];
    plot.forEach(function (sample, index) { var u = plotEnd > 0 ? sample.ms / plotEnd : 0, rawV = sample.commandVoltage, smoothV = sample.outputVoltage, x = waveLeft + (waveRight - waveLeft) * u, yRaw = waveBottom - (waveBottom - waveTop) * (rawV - waveMin) / waveSpan, ySmooth = waveBottom - (waveBottom - waveTop) * (smoothV - waveMin) / waveSpan; raw.push((index ? "L" : "M") + x.toFixed(2) + " " + yRaw.toFixed(2)); smooth.push((index ? "L" : "M") + x.toFixed(2) + " " + ySmooth.toFixed(2)); });
    node.appendChild(svgElement(doc, "path", { d: raw.join(" "), fill: "none", stroke: red, "stroke-width": 2, "stroke-dasharray": "5 3" })); node.appendChild(svgElement(doc, "path", { d: smooth.join(" "), fill: "none", stroke: blue, "stroke-width": 3 })); var avgY = waveBottom - (waveBottom - waveTop) * (result.averageVoltage - waveMin) / waveSpan; node.appendChild(svgElement(doc, "line", { x1: waveLeft, y1: avgY, x2: waveRight, y2: avgY, stroke: gold, "stroke-dasharray": "6 4", "stroke-width": 2 }));
    svgText(doc, node, "方波命令", waveLeft + 4, waveTop + 14, { "font-size": 10, fill: red }); svgText(doc, node, "分段指数 RC 输出", waveLeft + 70, waveTop + 14, { "font-size": 10, fill: blue }); svgText(doc, node, "系统平均 " + format(result.averageVoltage, 2) + " V", waveRight - 4, avgY - 7, { "font-size": 10, "text-anchor": "end", fill: gold }); svgText(doc, node, "稳态纹波 " + format(result.ripple * 1000, 2) + " mV；绘图区 " + format(plotEnd, 1) + " ms", waveRight - 4, waveBottom + 18, { "font-size": 9, "text-anchor": "end", fill: blue }); svgText(doc, node, result.config.timerRunsInSleep ? "PWM 连续运行" : result.postStopOutput, waveLeft + 120, waveBottom + 18, { "font-size": 9, "text-anchor": "middle", fill: result.config.timerRunsInSleep ? gold : red });
  }
  function metric(doc, label, value) { return element(doc, "div", { className: "emc-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]); }
  function renderTable(doc, hostNode, result) { clear(hostNode); var rows = [["MCU 平均电流", format(result.mcuAverage, 4), "mA；活动 + 睡眠时间加权"], ["传感器平均电流", format(result.sensorAverage, 4), "mA；按有效时间占比"], ["发送平均电流", format(result.radioAverage, 4), "mA；按事件占空比"], ["PWM 负载平均电流", format(result.pwmLoadAverageCurrentmA, 4), "mA；(1/T)∫v(t)/R dt，已计入系统"], ["系统平均电流", format(result.totalAverage, 4), "mA；MCU + 传感器 + 发送 + PWM 负载"], ["每周期电荷", format(result.chargePerPeriodmAh * 1000, 3), "µAh；Iavg × 周期"], ["平均功率", format(result.averagePowerW * 1000, 3), "mW；供电电压 × 系统平均电流"], ["PWM 负载功率", format(result.loadPowermW, 3), "mW；(1/T)∫v²/R dt"], ["PWM 理想平均值", format(result.idealPwmAverage, 3), "V；Vlow + duty·ΔV（运行段）"], ["RC 输出系统平均值", format(result.averageVoltage, 3), "V；含启动/停机保持的整段积分"], ["RC 稳态平均值", format(result.steadyStateAverageVoltage, 3), "V；周期稳态的线性 RC 积分"], ["PWM 稳态纹波", format(result.ripple * 1000, 3), "mV 峰峰值；指数 RC 的稳态 min/max"], ["停机后输出", result.postStopOutput, "timerRunsInSleep=false 时的保持定义"], ["外设边界", result.pwmBoundary, "需回到具体 MCU 数据手册"]]; var body = element(doc, "tbody"); rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, [element(doc, "th", { scope: "row", text: row[0] }), element(doc, "td", { text: row[1] }), element(doc, "td", { text: row[2] })])); }); hostNode.appendChild(element(doc, "table", {}, [element(doc, "caption", { text: "MCU 功耗与 PWM 账本" }), element(doc, "thead", {}, [element(doc, "tr", {}, [element(doc, "th", { text: "量" }), element(doc, "th", { text: "读数" }), element(doc, "th", { text: "单位 / 解释" })])]), body])); }
  function mount(rootNode, api) {
    if (!rootNode || !rootNode.ownerDocument) return;
    var doc = rootNode.ownerDocument, uid = LAB_ID + "-" + (++INSTANCE), state = { config: normalize(DEFAULTS), predictions: {}, revealed: false, feedback: "请先完成三项预测。" }; rootNode.textContent = "";
    var shell = element(doc, "div", { className: "emc-shell" }); shell.appendChild(element(doc, "h3", { text: "MCU 实验：唤醒、睡眠与 PWM" })); shell.appendChild(element(doc, "p", { className: "emc-note", text: "先把周期当成电流账本，再判断 PWM 平均值、纹波和外设时钟边界。数值是低压教学设定，不是具体 MCU 或传感器数据手册。" }));
    var predictionHost = element(doc, "div"), groups = [];
    QUESTIONS.forEach(function (question, index) { var fieldset = element(doc, "fieldset"); fieldset.appendChild(element(doc, "legend", { text: (index + 1) + ". " + question.prompt })); var grid = element(doc, "div", { className: "emc-choice-grid" }), buttons = []; question.choices.forEach(function (choice) { var button = element(doc, "button", { type: "button", text: choice[1], "aria-pressed": "false" }); button.value = choice[0]; button.addEventListener("click", function () { state.predictions[question.key] = choice[0]; buttons.forEach(function (item) { item.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false"); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }); buttons.push(button); grid.appendChild(button); }); groups.push({ key: question.key, buttons: buttons }); fieldset.appendChild(grid); predictionHost.appendChild(fieldset); });
    shell.appendChild(predictionHost); var actions = element(doc, "div", { className: "emc-actions" }); var reveal = element(doc, "button", { type: "button", className: "emc-primary", text: "提交预测并揭示", disabled: true }); var reset = element(doc, "button", { type: "button", text: "重置实验" }); actions.appendChild(reveal); actions.appendChild(reset); shell.appendChild(actions); var feedback = element(doc, "p", { className: "emc-feedback", role: "status", "aria-live": "polite", text: state.feedback }); shell.appendChild(feedback);
    var results = element(doc, "div", { hidden: true }), controls = element(doc, "div", { className: "emc-controls" }); var specs = [["activeMs", "活动时间", 2, 100, 1], ["sleepCurrentUa", "睡眠电流", 1, 100, 1], ["pwmDuty", "PWM 占空比", 0.05, 0.95, 0.05], ["pwmFrequencyHz", "PWM 频率", 100, 5000, 100], ["filterCapacitance", "滤波电容", 0.1e-6, 5e-6, 0.1e-6]]; var inputs = {}, outputs = {};
    specs.forEach(function (spec) { var id = uid + "-" + spec[0]; var label = element(doc, "label", { htmlFor: id, text: spec[1] }); var output = element(doc, "output", { text: "" }); var wrap = element(doc, "div", { className: "emc-control" }, [label, output]); var input = element(doc, "input", { id: id, type: "range", min: spec[2], max: spec[3], step: spec[4], value: state.config[spec[0]], "aria-label": spec[1] }); input.addEventListener("input", function () { state.config[spec[0]] = Number(input.value); if (state.revealed) renderResult(); }); wrap.appendChild(input); controls.appendChild(wrap); inputs[spec[0]] = input; outputs[spec[0]] = output; });
    var sleepId = uid + "-timerRunsInSleep", sleepLabel = element(doc, "label", { htmlFor: sleepId, text: "睡眠时 PWM 定时器" }), sleepOutput = element(doc, "output", { text: "" }), sleepWrap = element(doc, "div", { className: "emc-control" }, [sleepLabel, sleepOutput]), sleepSelect = element(doc, "select", { id: sleepId, "aria-label": "睡眠时 PWM 定时器" }); sleepSelect.appendChild(element(doc, "option", { value: "true", text: "继续运行（条件式）" })); sleepSelect.appendChild(element(doc, "option", { value: "false", text: "睡眠时停止" })); sleepSelect.value = String(state.config.timerRunsInSleep); sleepSelect.addEventListener("change", function () { state.config.timerRunsInSleep = sleepSelect.value === "true"; if (state.revealed) renderResult(); }); sleepWrap.appendChild(sleepSelect); controls.appendChild(sleepWrap); outputs.timerRunsInSleep = sleepOutput; results.appendChild(controls);
    var layout = element(doc, "div", { className: "emc-layout" }), stage = element(doc, "div", { className: "emc-stage" }), svg = svgElement(doc, "svg", {}); stage.appendChild(svg); layout.appendChild(stage); var side = element(doc, "div"), metrics = element(doc, "div", { className: "emc-metrics" }); side.appendChild(metrics); var tableWrap = element(doc, "div", { className: "emc-table-wrap" }); side.appendChild(tableWrap); side.appendChild(element(doc, "p", { className: "emc-note", text: "平均电流要由实测时间窗积分确认，PWM 输出还受 GPIO 电阻、负载、滤波器、定时器时钟和唤醒瞬态影响。睡眠外设是否运行必须查具体型号、时钟源和低功耗模式条件。" })); layout.appendChild(side); results.appendChild(layout); shell.appendChild(results);
    function renderGate() { groups.forEach(function (group) { group.buttons.forEach(function (button) { button.setAttribute("aria-pressed", state.predictions[group.key] === button.value ? "true" : "false"); }); }); reveal.disabled = Object.keys(state.predictions).length !== QUESTIONS.length; }
    function renderResult() { var result = computeMcuPwm(state.config); results.hidden = !state.revealed; specs.forEach(function (spec) { outputs[spec[0]].textContent = formatControl(spec[0], result.config[spec[0]]); }); sleepOutput.textContent = result.config.timerRunsInSleep ? "条件继续" : "停止"; sleepSelect.value = String(result.config.timerRunsInSleep); drawSvg(doc, svg, result); clear(metrics); metrics.appendChild(metric(doc, "系统平均电流", format(result.totalAverage, 3) + " mA")); metrics.appendChild(metric(doc, "每周期电荷", format(result.chargePerPeriodmAh * 1000, 2) + " µAh")); metrics.appendChild(metric(doc, "PWM 平均值", format(result.averageVoltage, 2) + " V")); metrics.appendChild(metric(doc, "PWM 纹波", format(result.ripple * 1000, 2) + " mV")); renderTable(doc, tableWrap, result); }
    function render() { renderGate(); renderResult(); feedback.textContent = state.feedback; }
    reveal.addEventListener("click", function () { if (Object.keys(state.predictions).length !== QUESTIONS.length) { state.feedback = "请先完成三项预测。"; render(); return; } var score = QUESTIONS.reduce(function (sum, question) { return sum + (state.predictions[question.key] === question.expected ? 1 : 0); }, 0); state.revealed = true; state.feedback = "已揭示：" + score + " / " + QUESTIONS.length + " 命中。现在逐项核对 MCU 电流、PWM 波形和外设边界。"; render(); announce(api, rootNode, state.feedback); });
    reset.addEventListener("click", function () { state = { config: normalize(DEFAULTS), predictions: {}, revealed: false, feedback: "请先完成三项预测。" }; specs.forEach(function (spec) { inputs[spec[0]].value = state.config[spec[0]]; }); sleepSelect.value = String(state.config.timerRunsInSleep); render(); announce(api, rootNode, "MCU 与 PWM 实验已重置。"); }); rootNode.appendChild(shell); rootNode.appendChild(element(doc, "p", { className: "cl-sr-only", "data-emc-live": true, "aria-live": "polite" })); render();
  }
  function selfTest() { var checks = 0; function check(condition, message) { checks += 1; assert(condition, message); } var result = computeMcuPwm(DEFAULTS), stopped = computeMcuPwm({ timerRunsInSleep: false }), nonzero = computeMcuPwm({ pwmLow: 1, pwmHigh: 3, pwmDuty: 0.25 }), noActivity = computeMcuPwm({ pwmDuty: 0 }), faster = computeMcuPwm({ pwmFrequencyHz: 2000 }); var formulaA = Math.exp(-0.25), formulaB = Math.exp(-0.75), expectedMin = (1 * (1 - formulaB) + 3 * formulaB * (1 - formulaA)) / (1 - formulaA * formulaB); check(result.totalAverage > result.mcuAverage + result.sensorAverage + result.radioAverage, "PWM load enters system ledger"); check(near(result.totalAverage, result.mcuAverage + result.sensorAverage + result.radioAverage + result.pwmLoadAverageCurrentmA), "system current sums PWM load"); check(result.chargePerPeriodmAh > 0, "positive charge per period"); check(result.averageVoltage > 0 && result.averageVoltage < DEFAULTS.pwmHigh, "filtered PWM average"); check(result.ripple > 0, "default PWM has ripple"); check(result.waveformSegments[1].kind === "pwm-high" && result.waveformSegments[1].endVoltage > result.waveformSegments[1].startVoltage, "waveform uses exponential segment"); check(near(nonzero.steadyStateMinVoltage, expectedMin, 1e-9) && near(nonzero.steadyStateAverageVoltage, 1.5, 1e-9), "nonzero Vlow steady-state formula"); check(noActivity.ripple === 0 && noActivity.pwmLoadAverageCurrentmA === 0, "zero duty removes PWM load voltage"); check(faster.ripple < result.ripple, "higher PWM frequency lowers RC ripple"); check(stopped.pwmStopMs === stopped.config.activeMs && stopped.heldOutputVoltage === stopped.config.pwmHigh, "stopped timer defines held high output"); check(stopped.timeline.length === 6 && stopped.timeline[4].kind === "hold", "sleep timeline includes post-stop hold"); check(stopped.averageVoltage > result.averageVoltage && stopped.totalAverage > result.totalAverage, "stopping timer changes waveform and average current"); check(isFinite(result.averagePowerW) && isFinite(result.loadPowerW) && result.waveformPlot.length > 240, "finite power and plotted waveform"); check(JSON.stringify(result) === JSON.stringify(computeMcuPwm(DEFAULTS)), "deterministic result"); return { checks: checks }; }
  return { DEFAULTS: DEFAULTS, normalize: normalize, computeMcuPwm: computeMcuPwm, compute: computeMcuPwm, mount: mount, selfTest: selfTest };
});

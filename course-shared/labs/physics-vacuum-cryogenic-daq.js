(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("physics-vacuum-cryogenic-daq", exported.mount);
  }
  if (
    typeof module === "object" &&
    module.exports &&
    typeof require === "function" &&
    require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log("physics-vacuum-cryogenic-daq self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("physics-vacuum-cryogenic-daq self-test: FAIL\n" + error.stack);
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

    var LAB_ID = "physics-vacuum-cryogenic-daq";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "physics-vacuum-cryogenic-daq-styles";
    var TWO_PI = 2 * Math.PI;
    var DEFAULTS = {
      vacuum: { gasLoad: 0.012, pumpSpeed: 100, conductance: 25 },
      cryo: { radiation: 18, conduction: 22, wires: 7, signal: 3, cooling: 80 },
      daq: { sampleRate: 12000, signalHz: 2400, channels: 4, bits: 16, fullScale: 1, amplitude: 0.72 }
    };
    var PRESETS = {
      vacuum: [
        { id: "clean", label: "低气负载", gasLoad: 0.004, pumpSpeed: 120, conductance: 40 },
        { id: "conductance", label: "导管瓶颈", gasLoad: 0.012, pumpSpeed: 160, conductance: 8 },
        { id: "leak", label: "高气负载", gasLoad: 0.05, pumpSpeed: 100, conductance: 25 }
      ],
      cryo: [
        { id: "margin", label: "有余量", radiation: 18, conduction: 22, wires: 7, signal: 3, cooling: 80 },
        { id: "warm", label: "热负载过大", radiation: 32, conduction: 36, wires: 11, signal: 8, cooling: 80 },
        { id: "capacity", label: "更强制冷", radiation: 18, conduction: 22, wires: 7, signal: 3, cooling: 120 }
      ],
      daq: [
        { id: "safe", label: "采样充分", sampleRate: 12000, signalHz: 2400, channels: 4, bits: 16, fullScale: 1, amplitude: 0.72 },
        { id: "alias", label: "混叠演示", sampleRate: 12000, signalHz: 9000, channels: 4, bits: 16, fullScale: 1, amplitude: 0.72 },
        { id: "clip", label: "输入削顶", sampleRate: 12000, signalHz: 2400, channels: 4, bits: 16, fullScale: 1, amplitude: 1.18 }
      ]
    };
    var COLORS = { blue: "var(--vcd-blue)", orange: "var(--vcd-orange)", green: "var(--vcd-green)", red: "var(--vcd-red)", gold: "var(--vcd-gold)", gray: "var(--fg-soft)" };

    var STYLE_TEXT = [
      '[data-learning-lab="physics-vacuum-cryogenic-daq"]{--vcd-blue:#315f9d;--vcd-orange:#a36a16;--vcd-green:#39734d;--vcd-red:#b64335;--vcd-gold:#8b6517;display:block;min-width:0;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}',
      '[data-learning-lab="physics-vacuum-cryogenic-daq"] *{box-sizing:border-box}[data-learning-lab="physics-vacuum-cryogenic-daq"] [hidden]{display:none!important}',
      '[data-learning-lab="physics-vacuum-cryogenic-daq"] h3,[data-learning-lab="physics-vacuum-cryogenic-daq"] h4{margin:0;letter-spacing:0}[data-learning-lab="physics-vacuum-cryogenic-daq"] h3{font-size:1.18rem}[data-learning-lab="physics-vacuum-cryogenic-daq"] h4{font-size:1rem;margin-top:14px}',
      '[data-learning-lab="physics-vacuum-cryogenic-daq"] p{margin:8px 0}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-muted,[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-feedback{color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '[data-learning-lab="physics-vacuum-cryogenic-daq"] fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px}[data-learning-lab="physics-vacuum-cryogenic-daq"] legend{max-width:100%;padding:0 4px;font-size:13px;font-weight:750;line-height:1.5}',
      '[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-prediction-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-prediction{display:grid;gap:5px;min-width:0}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-prediction label{font-size:12.5px;font-weight:700}',
      '[data-learning-lab="physics-vacuum-cryogenic-daq"] button,[data-learning-lab="physics-vacuum-cryogenic-daq"] select,[data-learning-lab="physics-vacuum-cryogenic-daq"] input{font:inherit;letter-spacing:0}',
      '[data-learning-lab="physics-vacuum-cryogenic-daq"] button,[data-learning-lab="physics-vacuum-cryogenic-daq"] select{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg,transparent);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}',
      '[data-learning-lab="physics-vacuum-cryogenic-daq"] button:hover{border-color:var(--vcd-blue)}[data-learning-lab="physics-vacuum-cryogenic-daq"] button:focus-visible,[data-learning-lab="physics-vacuum-cryogenic-daq"] select:focus-visible,[data-learning-lab="physics-vacuum-cryogenic-daq"] input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}',
      '[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-actions{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-actions>*{flex:1 1 170px}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-primary{border-color:var(--vcd-blue);background:var(--vcd-blue);color:#fff;font-weight:750}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-feedback{min-height:2em;margin:8px 0;font-weight:700}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-warn{color:var(--vcd-red)}',
      '[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:13px 0 10px}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-tab{font-weight:700}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-tab[aria-selected="true"]{border-color:var(--vcd-blue);background:var(--vcd-blue);color:#fff}',
      '[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-layout{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;align-items:start;min-width:0}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-controls,[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-stage{min-width:0}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent)}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-control{display:grid;gap:5px;min-width:0}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-control label{display:flex;flex-wrap:wrap;justify-content:space-between;gap:5px;color:var(--fg-soft,currentColor);font-size:13px;font-weight:700}[data-learning-lab="physics-vacuum-cryogenic-daq"] output{color:var(--vcd-blue);font-variant-numeric:tabular-nums}',
      '[data-learning-lab="physics-vacuum-cryogenic-daq"] input[type="range"]{display:block;width:100%;min-height:44px;margin:0;accent-color:var(--vcd-blue)}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-stage-frame{min-width:0;padding:8px;border:1px solid var(--border,#cbd5e1);border-radius:7px;background:var(--bg,transparent);overflow-x:auto;overflow-y:hidden}[data-learning-lab="physics-vacuum-cryogenic-daq"] svg{display:block;width:100%;height:auto;min-width:720px;max-width:none;color:var(--fg,currentColor)}[data-learning-lab="physics-vacuum-cryogenic-daq"] svg text{fill:currentColor;font-family:inherit;letter-spacing:0}',
      '[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-grid{stroke:var(--border,#cbd5e1);stroke-width:1;stroke-opacity:.7}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-axis{stroke:currentColor;stroke-width:1.1;stroke-opacity:.75}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-blue{stroke:var(--vcd-blue);fill:none;stroke-width:2.5}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-orange{stroke:var(--vcd-orange);fill:none;stroke-width:2.3;stroke-dasharray:6 4}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-green{stroke:var(--vcd-green);fill:none;stroke-width:2.4}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-red{stroke:var(--vcd-red);fill:none;stroke-width:2.3;stroke-dasharray:5 4}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-dot{fill:var(--vcd-blue);stroke:var(--bg,#fff);stroke-width:1.2}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-threshold{stroke:var(--vcd-gold);stroke-width:1.8;stroke-dasharray:5 4}',
      '[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-metric{min-width:0;padding:9px;border-top:2px solid var(--border,#cbd5e1);background:var(--bg,transparent)}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-metric:nth-child(4n+1){border-color:var(--vcd-blue)}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-metric:nth-child(4n+2){border-color:var(--vcd-orange)}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-metric:nth-child(4n+3){border-color:var(--vcd-green)}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-metric:nth-child(4n){border-color:var(--vcd-red)}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-metric span{display:block;color:var(--fg-soft,currentColor);font-size:11.5px}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
      '[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-ledger{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}[data-learning-lab="physics-vacuum-cryogenic-daq"] table{width:100%;min-width:600px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="physics-vacuum-cryogenic-daq"] th,[data-learning-lab="physics-vacuum-cryogenic-daq"] td{padding:7px 8px;border-bottom:1px solid var(--border,#cbd5e1);text-align:left;vertical-align:top;overflow-wrap:anywhere}[data-learning-lab="physics-vacuum-cryogenic-daq"] th{color:var(--fg-soft,currentColor);font-size:11px}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-note{margin-top:11px;padding:10px 12px;border-left:3px solid var(--vcd-gold);color:var(--fg-soft,currentColor);font-size:13px;line-height:1.7}',
      '@media(max-width:900px){[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:680px){[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-prediction-grid{grid-template-columns:1fr}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-stage-frame svg{min-width:720px}}@media(max-width:430px){[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-tabs{grid-template-columns:1fr}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-metrics{grid-template-columns:1fr}[data-learning-lab="physics-vacuum-cryogenic-daq"] .vcd-stage-frame{padding:4px}}@media(prefers-reduced-motion:reduce){[data-learning-lab="physics-vacuum-cryogenic-daq"] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}'
      ,'[data-theme="dark"] [data-learning-lab="physics-vacuum-cryogenic-daq"]{--vcd-blue:#8ab4f8;--vcd-orange:#e3b56b;--vcd-green:#88c6a0;--vcd-red:#ed9995;--vcd-gold:#dfb971}'
    ].join("");

    function assert(condition, message) { if (!condition) throw new Error(message); }

    function finite(value, label) {
      var number = value;
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
      return places === 0 ? value.toFixed(0) : value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
    }

    function copyDefaults() {
      return {
        vacuum: { gasLoad: DEFAULTS.vacuum.gasLoad, pumpSpeed: DEFAULTS.vacuum.pumpSpeed, conductance: DEFAULTS.vacuum.conductance },
        cryo: { radiation: DEFAULTS.cryo.radiation, conduction: DEFAULTS.cryo.conduction, wires: DEFAULTS.cryo.wires, signal: DEFAULTS.cryo.signal, cooling: DEFAULTS.cryo.cooling },
        daq: { sampleRate: DEFAULTS.daq.sampleRate, signalHz: DEFAULTS.daq.signalHz, channels: DEFAULTS.daq.channels, bits: DEFAULTS.daq.bits, fullScale: DEFAULTS.daq.fullScale, amplitude: DEFAULTS.daq.amplitude }
      };
    }

    function normalizeConfig(input) {
      var source = input || {};
      var vacuumSource = source.vacuum || {};
      var cryoSource = source.cryo || {};
      var daqSource = source.daq || {};
      var vacuum = {
        gasLoad: finite(vacuumSource.gasLoad === undefined ? DEFAULTS.vacuum.gasLoad : vacuumSource.gasLoad, "gas load"),
        pumpSpeed: finite(vacuumSource.pumpSpeed === undefined ? DEFAULTS.vacuum.pumpSpeed : vacuumSource.pumpSpeed, "pump speed"),
        conductance: finite(vacuumSource.conductance === undefined ? DEFAULTS.vacuum.conductance : vacuumSource.conductance, "conductance")
      };
      var cryo = {
        radiation: finite(cryoSource.radiation === undefined ? DEFAULTS.cryo.radiation : cryoSource.radiation, "radiation heat"),
        conduction: finite(cryoSource.conduction === undefined ? DEFAULTS.cryo.conduction : cryoSource.conduction, "conduction heat"),
        wires: finite(cryoSource.wires === undefined ? DEFAULTS.cryo.wires : cryoSource.wires, "wire heat"),
        signal: finite(cryoSource.signal === undefined ? DEFAULTS.cryo.signal : cryoSource.signal, "signal heat"),
        cooling: finite(cryoSource.cooling === undefined ? DEFAULTS.cryo.cooling : cryoSource.cooling, "cooling capacity")
      };
      var daq = {
        sampleRate: finite(daqSource.sampleRate === undefined ? DEFAULTS.daq.sampleRate : daqSource.sampleRate, "sample rate"),
        signalHz: finite(daqSource.signalHz === undefined ? DEFAULTS.daq.signalHz : daqSource.signalHz, "signal frequency"),
        channels: finite(daqSource.channels === undefined ? DEFAULTS.daq.channels : daqSource.channels, "channels"),
        bits: finite(daqSource.bits === undefined ? DEFAULTS.daq.bits : daqSource.bits, "bits"),
        fullScale: finite(daqSource.fullScale === undefined ? DEFAULTS.daq.fullScale : daqSource.fullScale, "full scale"),
        amplitude: finite(daqSource.amplitude === undefined ? DEFAULTS.daq.amplitude : daqSource.amplitude, "amplitude")
      };
      if (vacuum.gasLoad < 0.001 || vacuum.gasLoad > 0.08 || vacuum.pumpSpeed < 20 || vacuum.pumpSpeed > 200 || vacuum.conductance < 5 || vacuum.conductance > 80) throw new RangeError("vacuum inputs are outside the teaching range");
      if (cryo.radiation > 80 || cryo.conduction > 80 || cryo.wires > 50 || cryo.signal > 40 || cryo.radiation < 0 || cryo.conduction < 0 || cryo.wires < 0 || cryo.signal < 0 || cryo.cooling < 20 || cryo.cooling > 180) throw new RangeError("cryogenic heat inputs are outside the teaching range");
      if (!Number.isInteger(daq.channels) || !Number.isInteger(daq.bits) || daq.sampleRate < 2000 || daq.sampleRate > 30000 || daq.signalHz < 100 || daq.signalHz > 30000 || daq.channels < 1 || daq.channels > 8 || daq.bits < 8 || daq.bits > 24 || daq.fullScale < 0.001 || daq.fullScale > 5 || daq.amplitude < 0 || daq.amplitude > 1.5 * daq.fullScale) throw new RangeError("DAQ inputs are outside the teaching range");
      return { vacuum: vacuum, cryo: cryo, daq: daq };
    }

    function vacuumBudget(input) {
      var config = normalizeConfig({ vacuum: input });
      var vacuum = config.vacuum;
      var effectiveSpeed = 1 / (1 / vacuum.pumpSpeed + 1 / vacuum.conductance);
      var pressure = vacuum.gasLoad / effectiveSpeed;
      var targetPressure = 0.001;
      return { config: vacuum, effectiveSpeed: effectiveSpeed, pressure: pressure, targetPressure: targetPressure, targetMargin: targetPressure / pressure, safe: pressure <= targetPressure };
    }

    function cryogenicBudget(input) {
      var config = normalizeConfig({ cryo: input });
      var cryo = config.cryo;
      var total = cryo.radiation + cryo.conduction + cryo.wires + cryo.signal;
      var safetyLimit = 0.8 * cryo.cooling;
      return { config: cryo, total: total, cooling: cryo.cooling, safetyLimit: safetyLimit, headroom: cryo.cooling - total, safetyHeadroom: safetyLimit - total, ratio: total / cryo.cooling, safe: total <= safetyLimit, overloaded: total > cryo.cooling };
    }

    function wrapFrequency(frequency, sampleRate) {
      finite(frequency, "frequency"); finite(sampleRate, "sample rate");
      if (sampleRate <= 0) throw new RangeError("sample rate must be positive");
      var wrapped = frequency % sampleRate;
      if (wrapped >= sampleRate / 2) wrapped -= sampleRate;
      if (wrapped < -sampleRate / 2) wrapped += sampleRate;
      return wrapped;

    }

    function adcSample(rawValue, fullScale) {
      var raw = finite(rawValue, "ADC sample");
      var scale = finite(fullScale, "full scale");
      if (scale <= 0) throw new RangeError("full scale must be positive");
      var value = clamp(raw, -scale, scale);
      return { raw: raw, value: value, clipped: value !== raw };
    }

    function sinCycles(cycles) {
      var phase = ((cycles % 1) + 1) % 1;
      if (phase === 0 || phase === 0.5) return 0;
      if (phase === 0.25) return 1;
      if (phase === 0.75) return -1;
      return Math.sin(TWO_PI * phase);
    }

    function sampledAdcValue(daq, time, frequency) {
      var source = daq || {};
      var sampleTime = finite(time, "sample time");
      var sampleFrequency = finite(frequency === undefined ? source.signalHz : frequency, "sample frequency");
      var raw = finite(source.amplitude, "amplitude") * sinCycles(sampleFrequency * sampleTime);
      return adcSample(raw, source.fullScale);
    }

    function daqBudget(input) {
      var config = normalizeConfig({ daq: input });
      var daq = config.daq;
      var nyquist = daq.sampleRate / 2;
      var signedAlias = wrapFrequency(daq.signalHz, daq.sampleRate);
      var alias = Math.abs(signedAlias);
      var lsb = 2 * daq.fullScale / Math.pow(2, daq.bits);
      var quantizationSnr = daq.amplitude > 0 && daq.amplitude <= daq.fullScale ? 20 * Math.log10(daq.amplitude * Math.sqrt(6) / lsb) : null;
      var dataRate = daq.sampleRate * daq.channels * daq.bits;
      return { config: daq, nyquist: nyquist, signedAlias: signedAlias, alias: alias, lsb: lsb, quantizationSnr: quantizationSnr, dataRate: dataRate, headroom: daq.fullScale - daq.amplitude, safeNyquist: daq.signalHz < nyquist, safeAmplitude: daq.amplitude <= daq.fullScale, safe: daq.signalHz < nyquist && daq.amplitude <= daq.fullScale };
    }


    // Mid-rise teaching ADC: 2^bits bins, decoded at each bin midpoint.
    function quantizeAdc(raw, fullScale, bits) {
      var clipped = adcSample(raw, fullScale);
      if (!Number.isInteger(bits) || bits < 1 || bits > 24) throw new RangeError("bits must be an integer from 1 to 24");
      var levels = Math.pow(2, bits), step = 2 * fullScale / levels;
      if (!(step > 0) || !Number.isFinite(step)) throw new RangeError("ADC step is not representable");
      var code = clamp(Math.floor((clipped.value / fullScale + 1) * levels / 2), 0, levels - 1);
      var value = fullScale * ((2 * code + 1) / levels - 1);
      return { raw: raw, clippedValue: clipped.value, clipped: clipped.clipped, code: code, value: value, error: value - clipped.value, step: step };
    }

    function daqWaveform(input) {
      var config = normalizeConfig({ daq: input }).daq;
      var result = daqBudget(config);
      var duration = Math.max(4 / config.signalHz, 12 / config.sampleRate);
      // At least 64 rendering segments per original period; these are not ADC samples.
      var segments = Math.max(256, Math.ceil(64 * config.signalHz * duration));
      var continuous = [], samples = [];
      for (var i = 0; i <= segments; i += 1) {
        var t = duration * i / segments;
        var analog = sampledAdcValue(config, t);
        continuous.push({ time: t, raw: analog.raw, clipped: analog.value,
          alias: config.amplitude * Math.sin(TWO_PI * result.signedAlias * t) });
      }
      for (var n = 0; n <= Math.floor(duration * config.sampleRate + 1e-10); n += 1) {
        var time = n / config.sampleRate;
        var q = quantizeAdc(config.amplitude * sinCycles(config.signalHz * n / config.sampleRate), config.fullScale, config.bits);
        q.time = time; q.index = n; samples.push(q);
      }
      return { duration: duration, segments: segments, continuous: continuous, samples: samples };
    }

    function runBudget(input) {
      var config = normalizeConfig(input || {});
      var vacuum = vacuumBudget(config.vacuum);
      var cryo = cryogenicBudget(config.cryo);
      var daq = daqBudget(config.daq);
      return { config: config, vacuum: vacuum, cryo: cryo, daq: daq, safe: vacuum.safe && cryo.safe && daq.safe };
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

    function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }

    function injectStyles(doc) {
      if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement).appendChild(style);
    }

    function svgText(doc, x, y, value, anchor, size) {
      return makeSvg(doc, "text", { x: x, y: y, "text-anchor": anchor || "start", "font-size": size || 11 }, [value]);
    }

    function drawVacuum(doc, result) {
      var svg = makeSvg(doc, "svg", { viewBox: "0 0 720 260", role: "img", "aria-label": "真空系统气负载、导管流导和泵速的串联预算" });
      var left = 70;
      var right = 650;
      var y = 105;
      svg.appendChild(svgText(doc, 24, 30, "真空预算：气负载 Q 经过流导 C 才到达泵 S", "start", 13));
      svg.appendChild(makeSvg(doc, "rect", { x: 80, y: 75, width: 125, height: 60, rx: 5, fill: COLORS.blue, opacity: .16, stroke: COLORS.blue }));
      svg.appendChild(svgText(doc, 142, 100, "腔体", "middle", 13));
      svg.appendChild(svgText(doc, 142, 119, "Q=" + formatNumber(result.config.gasLoad, 3) + " Pa·L/s", "middle", 11));
      svg.appendChild(makeSvg(doc, "line", { x1: 205, y1: y, x2: 300, y2: y, class: "vcd-blue" }));
      svg.appendChild(makeSvg(doc, "polygon", { points: "300,105 286,98 286,112", fill: COLORS.blue }));
      svg.appendChild(makeSvg(doc, "rect", { x: 300, y: 75, width: 135, height: 60, rx: 5, fill: COLORS.orange, opacity: .16, stroke: COLORS.orange }));
      svg.appendChild(svgText(doc, 367, 100, "导管", "middle", 13));
      svg.appendChild(svgText(doc, 367, 119, "C=" + formatNumber(result.config.conductance, 0) + " L/s", "middle", 11));
      svg.appendChild(makeSvg(doc, "line", { x1: 435, y1: y, x2: 530, y2: y, class: "vcd-orange" }));
      svg.appendChild(makeSvg(doc, "polygon", { points: "530,105 516,98 516,112", fill: COLORS.orange }));
      svg.appendChild(makeSvg(doc, "rect", { x: 530, y: 75, width: 115, height: 60, rx: 5, fill: COLORS.green, opacity: .16, stroke: COLORS.green }));
      svg.appendChild(svgText(doc, 587, 100, "泵", "middle", 13));
      svg.appendChild(svgText(doc, 587, 119, "S=" + formatNumber(result.config.pumpSpeed, 0) + " L/s", "middle", 11));
      svg.appendChild(svgText(doc, left, 177, "1/S_eff = 1/S + 1/C", "start", 13));
      svg.appendChild(svgText(doc, left, 200, "S_eff=" + formatNumber(result.effectiveSpeed, 2) + " L/s", "start", 13));
      svg.appendChild(svgText(doc, right, 177, "P=Q/S_eff", "end", 13));
      svg.appendChild(svgText(doc, right, 200, "P=" + formatNumber(result.pressure, 6) + " Pa", "end", 15));
      svg.appendChild(makeSvg(doc, "line", { x1: left, y1: 225, x2: right, y2: 225, class: "vcd-grid" }));
      svg.appendChild(svgText(doc, left, 245, "目标线：P≤" + formatNumber(result.targetPressure, 3) + " Pa", "start", 11));
      svg.appendChild(svgText(doc, right, 245, result.safe ? "当前压力在目标内" : "当前压力超过目标", "end", 11));
      return svg;
    }

    function drawCryo(doc, result) {
      var svg = makeSvg(doc, "svg", { viewBox: "0 0 720 350", role: "img", "aria-label": "低温热负载、额定能力与教学预算线，单位mW" });
      var left = 70, width = 580, maximum = Math.max(result.cooling, result.total, 1);
      var scale = width / maximum, y = 100, cursor = left;
      var keys = ["radiation", "conduction", "wires", "signal"];
      var labels = ["辐射", "传导", "引线", "信号"];
      var colors = [COLORS.blue, COLORS.orange, COLORS.green, COLORS.gold];
      svg.appendChild(svgText(doc, 24, 28, "热漏相加；制冷能力是指定温度下可移走热量的上限", "start", 13));
      keys.forEach(function (key, i) {
        svg.appendChild(makeSvg(doc, "rect", { x: 30 + i * 170, y: 48, width: 12, height: 12, fill: colors[i] }));
        svg.appendChild(svgText(doc, 48 + i * 170, 59, labels[i] + " " + formatNumber(result.config[key], 0) + " mW", "start", 11));
        var segment = result.config[key] * scale;
        svg.appendChild(makeSvg(doc, "rect", { x: cursor, y: y, width: segment, height: 48, fill: colors[i], opacity: .65 }));
        cursor += segment;
      });
      var capacityX = left + result.cooling * scale, safetyX = left + result.safetyLimit * scale;
      svg.appendChild(makeSvg(doc, "line", { x1: capacityX, y1: 86, x2: capacityX, y2: 158, class: "vcd-green" }));
      svg.appendChild(makeSvg(doc, "line", { x1: safetyX, y1: 86, x2: safetyX, y2: 158, class: "vcd-threshold" }));
      for (var i = 0; i <= 4; i += 1) {
        var x = left + width * i / 4;
        svg.appendChild(makeSvg(doc, "line", { x1: x, y1: 158, x2: x, y2: 164, class: "vcd-axis" }));
        svg.appendChild(svgText(doc, x, 180, formatNumber(maximum * i / 4, 1), "middle", 11));
      }
      svg.appendChild(svgText(doc, 650, 198, "热流 / mW", "end", 11));
      svg.appendChild(svgText(doc, 30, 221, "绿线：额定能力 " + formatNumber(result.cooling, 1) + " mW；金虚线：80% 教学预算线 " + formatNumber(result.safetyLimit, 1) + " mW", "start", 12));
      svg.appendChild(svgText(doc, 30, 247, "总负载 " + formatNumber(result.total, 1) + " mW；额定余量 " + formatNumber(result.headroom, 1) + " mW", "start", 13));
      svg.appendChild(svgText(doc, 30, 275, "教学线余量 " + formatNumber(result.safetyHeadroom, 1) + " mW；" + (result.safe ? "未超过教学线（等号处余量为零）" : result.overloaded ? "超过额定能力" : "超过教学线"), "start", 12));
      svg.appendChild(svgText(doc, 30, 315, "预算不求实际温度：稳态仍须满足 Q_in(T*) = Q_out(T*)。", "start", 12));
      return svg;
    }

    function drawDaq(doc, result) {
      var svg = makeSvg(doc, "svg", { viewBox: "0 0 720 410", role: "img", "aria-label": "模拟电压、削顶、量化采样和有符号混叠频率，横轴毫秒纵轴伏特" });
      var wave = daqWaveform(result.config), left = 60, right = 680, top = 70, bottom = 270;
      var ymax = Math.max(result.config.fullScale, result.config.amplitude) * 1.12;
      var mapX = function (t) { return left + t / wave.duration * (right - left); };
      var mapY = function (v) { return (top + bottom) / 2 - v / ymax * (bottom - top) / 2; };
      svg.appendChild(svgText(doc, 24, 24, "绿：原模拟正弦；橙虚线：削顶；蓝点：量化后数字码的代表电压", "start", 12));
      svg.appendChild(svgText(doc, 24, 45, "红虚线：有符号 alias 正弦（量化前在采样时刻与原信号相同）", "start", 12));
      [-1, 0, 1].forEach(function (k) {
        var v = k * result.config.fullScale, y = mapY(v);
        svg.appendChild(makeSvg(doc, "line", { x1: left, y1: y, x2: right, y2: y, class: k ? "vcd-threshold" : "vcd-axis" }));
        svg.appendChild(svgText(doc, left - 7, y + 4, formatNumber(v, 2), "end", 11));
      });
      svg.appendChild(svgText(doc, left, 64, "电压 / V（金线 ±满量程）", "start", 10));
      for (var i = 0; i <= 4; i += 1) {
        var x = left + (right - left) * i / 4;
        svg.appendChild(makeSvg(doc, "line", { x1: x, y1: top, x2: x, y2: bottom, class: "vcd-grid" }));
        svg.appendChild(svgText(doc, x, 290, formatNumber(wave.duration * 1000 * i / 4, 3), "middle", 11));
      }
      svg.appendChild(svgText(doc, right, 309, "时间 / ms", "end", 11));
      function path(field) { return wave.continuous.map(function (p, i) { return (i ? "L" : "M") + mapX(p.time).toFixed(3) + " " + mapY(p[field]).toFixed(3); }).join(" "); }
      svg.appendChild(makeSvg(doc, "path", { d: path("raw"), class: "vcd-green", "data-vcd-curve": "raw" }));
      if (!result.safeAmplitude) svg.appendChild(makeSvg(doc, "path", { d: path("clipped"), class: "vcd-orange", "data-vcd-curve": "clipped" }));
      if (!near(result.alias, result.config.signalHz, 1e-7)) svg.appendChild(makeSvg(doc, "path", { d: path("alias"), class: "vcd-red" }));
      wave.samples.forEach(function (p) { svg.appendChild(makeSvg(doc, "circle", { cx: mapX(p.time), cy: mapY(p.value), r: wave.samples.length > 100 ? 1.5 : 3.2, class: "vcd-dot" })); });
      svg.appendChild(svgText(doc, 30, 337, "f_s=" + formatNumber(result.config.sampleRate, 0) + " Hz；Nyquist=" + formatNumber(result.nyquist, 0) + " Hz；输入=" + formatNumber(result.config.signalHz, 0) + " Hz", "start", 12));
      svg.appendChild(svgText(doc, 30, 362, "signed alias=" + formatNumber(result.signedAlias, 0) + " Hz；LSB=" + formatNumber(result.lsb * 1e6, 2) + " µV；码数=" + Math.pow(2, result.config.bits), "start", 12));
      svg.appendChild(svgText(doc, 30, 389, result.safe ? "当前单频与幅度在边界内；图像不能代替抗混叠滤波检查。" : "混叠、Nyquist 等号或超量程：分别检查频率、相位和幅度条件。", "start", 12));
      return svg;
    }

    function metric(doc, label, value) {
      return makeElement(doc, "div", { className: "vcd-metric" }, [makeElement(doc, "span", { text: label }), makeElement(doc, "strong", { text: value })]);
    }

    function predictionField(doc, key, label, options) {
      var select = makeElement(doc, "select", { "data-vcd-prediction": key, "aria-label": label });
      select.appendChild(makeElement(doc, "option", { value: "", text: "请选择" }));
      options.forEach(function (option) { select.appendChild(makeElement(doc, "option", { value: option.value, text: option.label })); });
      return makeElement(doc, "div", { className: "vcd-prediction" }, [makeElement(doc, "label", {}, [label]), select]);
    }

    function selectedValue(form, key) {
      var select = form.querySelector('[data-vcd-prediction="' + key + '"]');
      return select && select.value ? select.value : "";
    }

    function mount(rootNode, api) {
      var doc = rootNode.ownerDocument || (host && host.document);
      if (!doc) throw new Error("a document is required to mount the lab");
      injectStyles(doc);
      var state = { config: copyDefaults(), predictions: {}, revealed: false, active: "vacuum", feedback: "" };
      var shell = makeElement(doc, "div", { className: "vcd-shell" });
      shell.appendChild(makeElement(doc, "h3", { text: "System-budget lab：真空、低温与 DAQ" }));
      shell.appendChild(makeElement(doc, "p", { className: "vcd-muted", text: "同一条实验链要同时过三道边界：气负载不能被串联流导忽略，热漏不能吃光制冷余量，采样不能越过 Nyquist 或 ADC 满量程。" }));

      var predictionForm = makeElement(doc, "form", { className: "vcd-predictions" });
      predictionForm.appendChild(makeElement(doc, "fieldset", {}, [
        makeElement(doc, "legend", { text: "先预测，再打开预算" }),
        makeElement(doc, "div", { className: "vcd-prediction-grid" }, [
          predictionField(doc, "vacuum", "S=100、C=25 串联时，S_eff 是", [{ value: "20", label: "20 L/s" }, { value: "100", label: "100 L/s" }, { value: "125", label: "125 L/s" }]),
          predictionField(doc, "cryo", "18+22+7+3=50 mW、Qcool=80 mW 时", [{ value: "safe", label: "低于 80% 安全线" }, { value: "overload", label: "超过制冷能力" }, { value: "none", label: "没有余量" }]),
          predictionField(doc, "daq", "f_s=12 kHz、输入 2.4 kHz 时", [{ value: "no-alias", label: "不发生混叠" }, { value: "alias", label: "折叠到别处" }, { value: "clip", label: "必然削顶" }])
        ])
      ]));
      var predictionActions = makeElement(doc, "div", { className: "vcd-actions" });
      var revealButton = makeElement(doc, "button", { type: "submit", className: "vcd-primary", text: "提交预测并揭示" });
      var resetButton = makeElement(doc, "button", { type: "button", text: "重置" });
      predictionActions.appendChild(revealButton);
      predictionActions.appendChild(resetButton);
      predictionForm.appendChild(predictionActions);
      var feedback = makeElement(doc, "p", { className: "vcd-feedback", "aria-live": "polite" });
      predictionForm.appendChild(feedback);
      shell.appendChild(predictionForm);

      var bench = makeElement(doc, "div", { hidden: true });
      var tabs = makeElement(doc, "div", { className: "vcd-tabs", role: "tablist", "aria-label": "预算类别" });
      var panels = {};
      var tabButtons = {};
      ["vacuum", "cryo", "daq"].forEach(function (key) {
        var title = key === "vacuum" ? "A · 真空" : key === "cryo" ? "B · 低温" : "C · DAQ";
        var button = makeElement(doc, "button", { type: "button", className: "vcd-tab", id: "vcd-tab-" + key, role: "tab", "aria-selected": key === state.active ? "true" : "false", "aria-controls": "vcd-panel-" + key, tabindex: key === state.active ? "0" : "-1", text: title });
        button.addEventListener("click", function () { state.active = key; render(); announce(title + "预算已打开。"); });
        button.addEventListener("keydown", function (event) {
          var keys = ["vacuum", "cryo", "daq"];
          var currentIndex = keys.indexOf(key);
          var nextIndex = currentIndex;
          if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % keys.length;
          else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentIndex + keys.length - 1) % keys.length;
          else if (event.key === "Home") nextIndex = 0;
          else if (event.key === "End") nextIndex = keys.length - 1;
          else return;
          event.preventDefault();
          state.active = keys[nextIndex];
          render();
          if (tabButtons[keys[nextIndex]] && typeof tabButtons[keys[nextIndex]].focus === "function") tabButtons[keys[nextIndex]].focus();
          announce((keys[nextIndex] === "vacuum" ? "A · 真空" : keys[nextIndex] === "cryo" ? "B · 低温" : "C · DAQ") + "预算已打开。");
        });
        tabButtons[key] = button;
        tabs.appendChild(button);
      });
      bench.appendChild(tabs);

      function makePanel(key, title, description) {
        var panel = makeElement(doc, "section", { className: "vcd-panel", id: "vcd-panel-" + key, role: "tabpanel", "aria-labelledby": "vcd-tab-" + key });
        panel.appendChild(makeElement(doc, "p", { className: "vcd-muted", text: title + "：" + description }));
        var layout = makeElement(doc, "div", { className: "vcd-layout" });
        var controls = makeElement(doc, "div", { className: "vcd-controls" });
        controls.appendChild(makeElement(doc, "h4", { text: "参数" }));
        var stage = makeElement(doc, "div", { className: "vcd-stage" });
        var frame = makeElement(doc, "div", { className: "vcd-stage-frame", tabindex: "0", "aria-label": title + "图表，可用方向键横向滚动" });
        var chart = makeElement(doc, "div");
        frame.appendChild(chart);
        stage.appendChild(frame);
        var metrics = makeElement(doc, "div", { className: "vcd-metrics" });
        stage.appendChild(metrics);
        layout.appendChild(controls);
        layout.appendChild(stage);
        panel.appendChild(layout);
        var ledger = makeElement(doc, "div", { className: "vcd-ledger", tabindex: "0", "aria-label": title + "数据表，可用方向键横向滚动" });
        panel.appendChild(ledger);
        return { panel: panel, controls: controls, chart: chart, metrics: metrics, ledger: ledger, inputs: {} };
      }

      panels.vacuum = makePanel("vacuum", "真空", "气负载 Q / 泵速 S 的压力还要经过串联流导 C。");
      panels.cryo = makePanel("cryo", "低温", "辐射、传导、引线和信号热漏相加，当前默认用 80% 制冷能力作为运行安全线。");
      panels.daq = makePanel("daq", "DAQ", "采样频率、输入频率、位数和幅度共同决定可辨识性、数据率与削顶风险。");
      bench.appendChild(panels.vacuum.panel);
      bench.appendChild(panels.cryo.panel);
      bench.appendChild(panels.daq.panel);
      var note = makeElement(doc, "p", { className: "vcd-note" });
      bench.appendChild(note);
      shell.appendChild(bench);
      rootNode.replaceChildren(shell);

      function announce(message) { if (api && typeof api.announce === "function") api.announce(rootNode, message); }

      function addRange(panel, path, label, min, max, step, digits) {
        var pathParts = path.split(".");
        var key = pathParts[pathParts.length - 1];
        var output = makeElement(doc, "output", { text: formatNumber(state.config[pathParts[0]][key], digits) });
        var input = makeElement(doc, "input", { type: "range", min: min, max: max, step: step, value: state.config[pathParts[0]][key], "aria-label": label });
        input.addEventListener("input", function () {
          state.config[pathParts[0]][key] = finite(Number(input.value), label);
          state.active = pathParts[0];
          state.feedback = "参数已更新；请重新读预算余量。";
          render();
        });
        panel.inputs[path] = { input: input, output: output, digits: digits };
        panel.controls.appendChild(makeElement(doc, "div", { className: "vcd-control" }, [makeElement(doc, "label", {}, [label, output]), input]));
      }

      addRange(panels.vacuum, "vacuum.gasLoad", "气负载 Q / Pa·L/s", "0.001", "0.080", "0.001", 3);
      addRange(panels.vacuum, "vacuum.pumpSpeed", "泵速 S / L/s", "20", "200", "5", 0);
      addRange(panels.vacuum, "vacuum.conductance", "流导 C / L/s", "5", "80", "1", 0);
      addRange(panels.cryo, "cryo.radiation", "辐射热漏 / mW", "0", "80", "1", 0);
      addRange(panels.cryo, "cryo.conduction", "传导热漏 / mW", "0", "80", "1", 0);
      addRange(panels.cryo, "cryo.wires", "引线热漏 / mW", "0", "50", "1", 0);
      addRange(panels.cryo, "cryo.signal", "信号热漏 / mW", "0", "40", "1", 0);
      addRange(panels.cryo, "cryo.cooling", "制冷能力 / mW", "20", "180", "1", 0);
      addRange(panels.daq, "daq.sampleRate", "采样率 f_s / Hz", "2000", "30000", "500", 0);
      addRange(panels.daq, "daq.signalHz", "输入频率 f / Hz", "100", "30000", "100", 0);
      addRange(panels.daq, "daq.channels", "通道数", "1", "8", "1", 0);
      addRange(panels.daq, "daq.bits", "ADC 位数", "8", "24", "1", 0);
      addRange(panels.daq, "daq.amplitude", "输入幅度 / V", "0", "1.5", "0.01", 2);

      function addPresets(panel, key) {
        panel.controls.appendChild(makeElement(doc, "h4", { text: "预设" }));
        var row = makeElement(doc, "div", { className: "vcd-preset-row" });
        PRESETS[key].forEach(function (preset) {
          var button = makeElement(doc, "button", { type: "button", text: preset.label, "data-vcd-preset": key + ":" + preset.id, "aria-pressed": "false" });
          button.addEventListener("click", function () {
            Object.keys(preset).forEach(function (field) { if (field !== "id" && field !== "label") state.config[key][field] = preset[field]; });
            state.active = key;
            state.feedback = "已切换预设；预算和边界已更新。";
            render();
            announce(preset.label + "预设已应用。");
          });
          row.appendChild(button);
        });
        panel.controls.appendChild(row);
      }
      addPresets(panels.vacuum, "vacuum");
      addPresets(panels.cryo, "cryo");
      addPresets(panels.daq, "daq");

      function renderLedger(key, result) {
        var rows;
        if (key === "vacuum") rows = [
          ["串联等效速度", "1/S_eff=1/S+1/C；S_eff=" + formatNumber(result.effectiveSpeed, 2) + " L/s", "导管流导小会限制整条抽气链。"],
          ["压力", "P=Q/S_eff=" + formatNumber(result.pressure, 6) + " Pa", result.safe ? "不超过 0.001 Pa 教学目标。" : "超过 0.001 Pa 教学目标。"],
          ["边界", "目标余量=" + formatNumber(result.targetMargin, 2) + " 倍", "实际开阀前必须核对差压、联锁、材料放气和受控 vent。"]
        ];
        else if (key === "cryo") rows = [
          ["热负载", "Q_in=" + formatNumber(result.total, 1) + " mW", "四项热漏相加，不能用单一传感器读数替代。"],
          ["制冷能力", "Q_cool=" + formatNumber(result.cooling, 1) + " mW；比值=" + formatNumber(result.ratio, 2), result.safe ? "不超过 80% 教学预算线，等号处预算余量为零。" : result.overloaded ? "已经超过额定制冷能力。" : "超过教学用安全线，需减载或提高能力。"],
          ["余量", "额定=" + formatNumber(result.headroom, 1) + " mW；安全线=" + formatNumber(result.safetyHeadroom, 1) + " mW", "低温系统要给接线、辐射屏和瞬态留出余量。"]
        ];
        else rows = [
          ["频率", "Nyquist=" + formatNumber(result.nyquist, 0) + " Hz；signed alias=" + formatNumber(result.signedAlias, 0) + " Hz", result.safeNyquist ? "当前输入严格低于 Nyquist。" : result.config.signalHz === result.nyquist ? "恰在 Nyquist 边界，按不安全处理。" : "已发生混叠，后端无法唯一恢复原频率。"],
          ["幅度", "满量程=±" + formatNumber(result.config.fullScale, 2) + " V；余量=" + formatNumber(result.headroom, 2) + " V", result.safeAmplitude ? "未削顶。" : "输入超过满量程，波形信息被截断。"],
          ["数据率", formatNumber(result.dataRate / 1000, 1) + " kbit/s；LSB=" + formatNumber(result.lsb * 1e6, 1) + " µV", "位数和通道数都会进入存储、传输与噪声预算。"]
        ];
        var table = makeElement(doc, "table", {});
        table.appendChild(makeElement(doc, "thead", {}, [makeElement(doc, "tr", {}, [makeElement(doc, "th", { text: "账本" }), makeElement(doc, "th", { text: "当前值" }), makeElement(doc, "th", { text: "判读" })])]));
        var body = makeElement(doc, "tbody", {});
        rows.forEach(function (row) { body.appendChild(makeElement(doc, "tr", {}, [makeElement(doc, "td", { text: row[0] }), makeElement(doc, "td", { text: row[1] }), makeElement(doc, "td", { text: row[2] })])); });
        table.appendChild(body);
        return table;
      }

      function renderPanel(key, result) {
        var panel = panels[key];
        var data = key === "vacuum" ? result.vacuum : key === "cryo" ? result.cryo : result.daq;
        Object.keys(panel.inputs).forEach(function (path) {
          var field = panel.inputs[path];
          var fieldParts = path.split(".");
          var value = state.config[fieldParts[0]][fieldParts[1]];
          field.input.value = String(value);
          field.output.textContent = formatNumber(value, field.digits);
        });
        panel.chart.replaceChildren(key === "vacuum" ? drawVacuum(doc, data) : key === "cryo" ? drawCryo(doc, data) : drawDaq(doc, data));
        if (key === "vacuum") panel.metrics.replaceChildren(metric(doc, "S_eff / L/s", formatNumber(data.effectiveSpeed, 2)), metric(doc, "P / Pa", formatNumber(data.pressure, 6)), metric(doc, "目标余量", formatNumber(data.targetMargin, 2) + "×"), metric(doc, "状态", data.safe ? "目标内" : "超目标"));
        else if (key === "cryo") panel.metrics.replaceChildren(metric(doc, "Q_in / mW", formatNumber(data.total, 1)), metric(doc, "Q_cool / mW", formatNumber(data.cooling, 1)), metric(doc, "安全余量", formatNumber(data.safetyHeadroom, 1)), metric(doc, "状态", data.safe ? (data.safetyHeadroom > 0 ? "有余量" : "教学线等号") : "需减载"));
        else panel.metrics.replaceChildren(metric(doc, "Nyquist / Hz", formatNumber(data.nyquist, 0)), metric(doc, "alias / Hz", formatNumber(data.alias, 0)), metric(doc, "数据率", formatNumber(data.dataRate / 1000, 1) + " kb/s"), metric(doc, "状态", data.safe ? "边界内" : "需处理"));
        panel.ledger.replaceChildren(renderLedger(key, data));
        if (key === "daq") {
          var samples = daqWaveform(data.config).samples.slice(0, 13);
          var table = makeElement(doc, "table");
          table.appendChild(makeElement(doc, "caption", { text: "前 13 个采样点：mid-rise 量化，误差相对削顶后的电压；原始超量程损失另列。" }));
          table.appendChild(makeElement(doc, "thead", {}, [makeElement(doc, "tr", {}, ["n", "t / ms", "原始 / V", "削顶后 / V", "数字码", "代表值 / V", "量化误差 / µV"].map(function (t) { return makeElement(doc, "th", { text: t }); }))]));
          table.appendChild(makeElement(doc, "tbody", {}, samples.map(function (q) {
            return makeElement(doc, "tr", {}, [q.index, formatNumber(q.time * 1000, 3), formatNumber(q.raw, 7), formatNumber(q.clippedValue, 7), q.code, formatNumber(q.value, 7), formatNumber(q.error * 1e6, 3)].map(function (t) { return makeElement(doc, "td", { text: t }); }));
          })));
          panel.ledger.appendChild(table);
        }
        PRESETS[key].forEach(function (preset) {
          var matches = Object.keys(preset).filter(function (f) { return f !== "id" && f !== "label"; }).every(function (f) { return state.config[key][f] === preset[f]; });
          panel.controls.querySelector('[data-vcd-preset="' + key + ':' + preset.id + '"]').setAttribute("aria-pressed", matches ? "true" : "false");
        });
        panel.panel.hidden = key !== state.active;
        panel.panel.setAttribute("aria-hidden", key !== state.active ? "true" : "false");
        tabButtons[key].setAttribute("aria-selected", key === state.active ? "true" : "false");
        tabButtons[key].setAttribute("tabindex", key === state.active ? "0" : "-1");
      }

      function render() {
        feedback.textContent = state.feedback;
        feedback.className = "vcd-feedback" + (state.feedback.indexOf("请先") === 0 ? " vcd-warn" : "");
        bench.hidden = !state.revealed;
        if (!state.revealed) return;
        var result;
        try { result = runBudget(state.config); } catch (error) { feedback.textContent = "输入超出教学范围：" + error.message; feedback.className = "vcd-feedback vcd-warn"; return; }
        renderPanel("vacuum", result);
        renderPanel("cryo", result);
        renderPanel("daq", result);
        note.textContent = "模型读法：真空忽略底压；低温比较目标温度下能力；DAQ 按每通道采样率计数据量，蓝点采用区间中点量化。图中加密点只用于绘图，前 13 个真实采样值另列于表。边界提示：这里的目标压力、80% 热负载线和满量程只是教学用验收阈值；真实装置还要按设备额定值、材料兼容性、受控泄压/排气、氧缺失、冷冻剂防护、接地隔离和硬件滤波规程执行。";
      }

      predictionForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var keys = ["vacuum", "cryo", "daq"];
        if (!keys.every(function (key) { return selectedValue(predictionForm, key); })) {
          state.feedback = "请先完成三项预测；揭示前不显示预算曲线和边界状态。";
          render();
          return;
        }
        var expected = { vacuum: "20", cryo: "safe", daq: "no-alias" };
        var correct = keys.filter(function (key) { return selectedValue(predictionForm, key) === expected[key]; }).length;
        state.predictions = { vacuum: selectedValue(predictionForm, "vacuum"), cryo: selectedValue(predictionForm, "cryo"), daq: selectedValue(predictionForm, "daq") };
        state.revealed = true;
        state.feedback = "已揭示：" + correct + "/3 命中。三个预算现在可以分别切换和施加压力。";
        render();
        announce(state.feedback);
      });
      predictionForm.addEventListener("change", function (event) {
        if (event.target.matches("[data-vcd-prediction]")) { state.revealed = false; state.feedback = "预测已更改，请重新提交。"; render(); }
      });
      resetButton.addEventListener("click", function () {
        predictionForm.reset();
        state = { config: copyDefaults(), predictions: {}, revealed: false, active: "vacuum", feedback: "" };
        render();
        predictionForm.querySelector("select").focus();
        announce("真空、低温与 DAQ 预算已重置；预测重新隐藏。");
      });
      render();
    }

    function selfTest() {
      var checks = 0;
      function check(condition, message) { checks += 1; assert(condition, message); }
      var base = runBudget(DEFAULTS);
      check(near(base.vacuum.effectiveSpeed, 20, 1e-12), "series pump and conductance give 20 L/s");
      check(near(base.vacuum.pressure, 0.0006, 1e-12), "default vacuum pressure is Q/S_eff");
      check(base.vacuum.safe, "default vacuum meets the teaching target");
      check(near(base.cryo.total, 50, 1e-12), "heat loads add to 50 mW");
      check(near(base.cryo.safetyLimit, 64, 1e-12) && base.cryo.safe, "default cryogenic budget stays below 80 percent");
      check(near(base.daq.nyquist, 6000, 1e-12) && near(base.daq.alias, 2400, 1e-12), "default DAQ is below Nyquist");
      check(near(base.daq.dataRate, 768000, 1e-12), "DAQ data rate is channels times bits times sample rate");
      check(base.daq.safeAmplitude && base.daq.headroom > 0, "default ADC input has headroom");
      check(near(base.daq.quantizationSnr, 20 * Math.log10(DEFAULTS.daq.amplitude * Math.sqrt(6) / base.daq.lsb), 1e-12), "peak-sine quantization SNR uses A times sqrt(6) over LSB");
      var conductance = vacuumBudget({ gasLoad: 0.012, pumpSpeed: 160, conductance: 8 });
      check(conductance.effectiveSpeed < 8.01 && conductance.pressure > base.vacuum.pressure, "small conductance limits the series chain");
      var overload = cryogenicBudget({ radiation: 32, conduction: 36, wires: 11, signal: 8, cooling: 80 });
      check(overload.total > overload.cooling && overload.overloaded && !overload.safe, "thermal overload is flagged");
      var alias = daqBudget({ sampleRate: 12000, signalHz: 9000, channels: 1, bits: 16, fullScale: 1, amplitude: 0.5 });
      check(near(alias.alias, 3000, 1e-12) && near(alias.signedAlias, -3000, 1e-12) && !alias.safeNyquist, "9 kHz folds to signed -3 kHz at 12 kHz sampling");
      check(near(sampledAdcValue(alias.config, 1 / alias.config.sampleRate).value, sampledAdcValue(alias.config, 1 / alias.config.sampleRate, alias.signedAlias).value, 1e-12), "signed alias preserves sampled phase");
      var clip = daqBudget({ sampleRate: 12000, signalHz: 2400, channels: 1, bits: 16, fullScale: 1, amplitude: 1.2 });
      check(!clip.safeAmplitude && clip.headroom < 0, "over-range ADC amplitude is flagged");
      check(adcSample(1.2, 1).value === 1 && adcSample(-1.2, 1).value === -1 && adcSample(1.2, 1).clipped, "ADC samples clamp symmetrically at full scale");
      var nyquist = daqBudget({ sampleRate: 12000, signalHz: 6000, channels: 1, bits: 16, fullScale: 1, amplitude: 0.5 });
      check(!nyquist.safeNyquist && near(nyquist.signedAlias, -6000, 1e-12), "exact Nyquist is an unsafe signed boundary");
      var invalid = false;
      try { normalizeConfig({ vacuum: { conductance: 0 } }); } catch (error) { invalid = true; }
      check(invalid, "invalid conductance is rejected");
      invalid = false;
      try { normalizeConfig({ daq: { sampleRate: 0 } }); } catch (error2) { invalid = true; }
      check(invalid, "invalid sample rate is rejected");
      return { checks: checks };
    }

    return {
      LAB_ID: LAB_ID,
      DEFAULTS: DEFAULTS,
      PRESETS: PRESETS,
      normalizeConfig: normalizeConfig,
      vacuumBudget: vacuumBudget,
      cryogenicBudget: cryogenicBudget,
      daqBudget: daqBudget,
      runBudget: runBudget,
      wrapFrequency: wrapFrequency,
      adcSample: adcSample,
      quantizeAdc: quantizeAdc,
      daqWaveform: daqWaveform,
      sampledAdcValue: sampledAdcValue,
      mount: mount,
      selfTest: selfTest
    };
  }
);

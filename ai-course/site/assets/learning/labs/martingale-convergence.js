(function (host) {
  "use strict";

  var STYLE_ID = "cl-martingale-convergence-style";
  var INSTANCE = 0;
  var FIXED_SCALE = 1;
  var MIN_B = 1;
  var MAX_B = 12;
  var MAX_N = 24;
  var EPSILON = 1e-10;
  var MODEL_A = {
    id: "spike",
    label: "模型 A：稀有尖峰鞅",
    limit: "0（a.s.）",
    l1: "否"
  };
  var MODEL_B = {
    id: "absorbed-walk",
    label: "模型 B：有界吸收走停",
    limit: "±B 的随机边界值",
    l1: "是"
  };
  var STYLE_TEXT = [
    ".martingale-convergence-lab { --mc-blue: var(--cl-blue, #315f9d); --mc-green: var(--cl-green, #39734d); --mc-red: var(--cl-red, #9b3f3f); --mc-gold: var(--cl-gold, #9b6a12); --mc-muted: var(--fg-soft, #6b6557); --mc-border: var(--border, #d7d0c2); --mc-block: var(--block-bg, #f4f1e9); line-height: 1.5; min-width: 0; }",
    "html[data-theme=\"dark\"] .martingale-convergence-lab { --mc-blue: #83c8ff; --mc-green: #72bd8b; --mc-red: #ef8a8a; --mc-gold: #e2b458; --mc-block: #252b32; }",
    ".martingale-convergence-lab *, .martingale-convergence-lab *::before, .martingale-convergence-lab *::after { box-sizing: border-box; }",
    ".martingale-convergence-lab h3, .martingale-convergence-lab h4, .martingale-convergence-lab p { margin-top: 0; }",
    ".martingale-convergence-lab .mc-intro, .martingale-convergence-lab .mc-note, .martingale-convergence-lab .mc-feedback { color: var(--mc-muted); }",
    ".martingale-convergence-lab .mc-prediction, .martingale-convergence-lab .mc-controls, .martingale-convergence-lab .mc-results { min-width: 0; }",
    ".martingale-convergence-lab .mc-prediction { margin: 16px 0 0; padding: 14px; border: 1px solid var(--mc-border); border-radius: 6px; background: var(--mc-block); }",
    ".martingale-convergence-lab .mc-prediction h4 { margin: 0 0 10px; color: var(--accent); }",
    ".martingale-convergence-lab .mc-prediction-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }",
    ".martingale-convergence-lab .mc-prediction-card { min-width: 0; margin: 0; padding: 10px; border: 1px solid var(--mc-border); border-radius: 5px; background: var(--bg); }",
    ".martingale-convergence-lab .mc-prediction-card legend { max-width: 100%; padding: 0 5px; color: var(--fg); font-weight: 700; overflow-wrap: anywhere; }",
    ".martingale-convergence-lab .mc-prediction-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px; }",
    ".martingale-convergence-lab .mc-prediction-row label, .martingale-convergence-lab .mc-control label { display: grid; gap: 4px; min-width: 0; color: var(--mc-muted); font-size: .9em; }",
    ".martingale-convergence-lab select, .martingale-convergence-lab input[type=range], .martingale-convergence-lab button { min-height: 44px; font: inherit; }",
    ".martingale-convergence-lab select { width: 100%; min-width: 0; padding: 7px 8px; border: 1px solid var(--mc-border); border-radius: 5px; background: var(--bg); color: inherit; }",
    ".martingale-convergence-lab input[type=range] { width: 100%; margin: 0; accent-color: var(--mc-blue); }",
    ".martingale-convergence-lab button { min-width: 0; padding: 7px 10px; border: 1px solid var(--mc-border); border-radius: 5px; background: var(--bg); color: inherit; cursor: pointer; overflow-wrap: anywhere; }",
    ".martingale-convergence-lab button:hover { border-color: var(--accent); }",
    ".martingale-convergence-lab button:focus-visible, .martingale-convergence-lab select:focus-visible, .martingale-convergence-lab input:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
    ".martingale-convergence-lab button[aria-pressed=\"true\"], .martingale-convergence-lab .mc-primary { border-color: var(--accent); background: var(--accent); color: var(--bg); font-weight: 700; }",
    ".martingale-convergence-lab .mc-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }",
    ".martingale-convergence-lab .mc-feedback { min-height: 1.5em; margin: 10px 0 0; }",
    ".martingale-convergence-lab .mc-pass { color: var(--mc-green); font-weight: 700; }",
    ".martingale-convergence-lab .mc-warn { color: var(--mc-red); font-weight: 700; }",
    ".martingale-convergence-lab .mc-control-panel { margin-top: 16px; padding: 12px 14px; border-top: 2px solid var(--accent); border-bottom: 1px solid var(--mc-border); }",
    ".martingale-convergence-lab .mc-control-panel h4 { margin: 0 0 9px; color: var(--accent); }",
    ".martingale-convergence-lab .mc-model-buttons { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-bottom: 10px; }",
    ".martingale-convergence-lab .mc-controls { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 16px; }",
    ".martingale-convergence-lab .mc-control { min-width: 0; }",
    ".martingale-convergence-lab .mc-control-label { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px; }",
    ".martingale-convergence-lab .mc-control-label output { color: var(--fg); font-variant-numeric: tabular-nums; font-weight: 700; }",
    ".martingale-convergence-lab .mc-disabled { opacity: .55; }",
    ".martingale-convergence-lab .mc-results { margin-top: 16px; }",
    ".martingale-convergence-lab .mc-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(132px, 1fr)); gap: 8px; margin: 0 0 14px; }",
    ".martingale-convergence-lab .mc-metric { min-width: 0; padding: 9px; border-top: 2px solid var(--mc-border); background: var(--mc-block); }",
    ".martingale-convergence-lab .mc-metric span { display: block; color: var(--mc-muted); font-size: .82em; overflow-wrap: anywhere; }",
    ".martingale-convergence-lab .mc-metric strong { display: block; margin-top: 3px; color: var(--fg); font-size: 1.02em; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }",
    ".martingale-convergence-lab .mc-ledger { min-width: 0; padding: 12px; border: 1px solid var(--mc-border); border-radius: 5px; background: var(--bg); }",
    ".martingale-convergence-lab .mc-ledger h4 { margin: 0 0 4px; color: var(--accent); }",
    ".martingale-convergence-lab .mc-ledger-note { margin: 0 0 10px; color: var(--mc-muted); font-size: .9em; }",
    ".martingale-convergence-lab .mc-mass-row, .martingale-convergence-lab .mc-state-row { display: grid; align-items: center; gap: 8px; min-width: 0; margin: 8px 0; }",
    ".martingale-convergence-lab .mc-mass-row { grid-template-columns: minmax(110px, .75fr) minmax(0, 1.45fr) minmax(90px, .55fr); }",
    ".martingale-convergence-lab .mc-state-row { grid-template-columns: 48px minmax(0, 1fr) 92px; }",
    ".martingale-convergence-lab .mc-mass-label, .martingale-convergence-lab .mc-state-label { color: var(--mc-muted); font-size: .88em; overflow-wrap: anywhere; }",
    ".martingale-convergence-lab .mc-track { position: relative; height: 18px; min-width: 0; overflow: hidden; border: 1px solid var(--mc-border); border-radius: 4px; background: var(--mc-block); }",
    ".martingale-convergence-lab .mc-fill { height: 100%; min-width: 0; border-radius: 3px; background: var(--mc-blue); }",
    ".martingale-convergence-lab .mc-fill-zero { background: var(--mc-blue); }",
    ".martingale-convergence-lab .mc-fill-spike { background: var(--mc-gold); }",
    ".martingale-convergence-lab .mc-fill-negative { background: var(--mc-red); }",
    ".martingale-convergence-lab .mc-fill-positive { background: var(--mc-green); }",
    ".martingale-convergence-lab .mc-fill-transient { background: var(--mc-blue); }",
    ".martingale-convergence-lab .mc-value { text-align: right; color: var(--fg); font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }",
    ".martingale-convergence-lab .mc-state-ledger { max-height: 510px; overflow-y: auto; padding-right: 3px; }",
    ".martingale-convergence-lab .mc-state-boundary { font-weight: 700; }",
    ".martingale-convergence-lab .mc-state-boundary .mc-state-label { color: var(--mc-gold); }",
    ".martingale-convergence-lab .mc-disclosure { margin-top: 12px; padding: 10px; border-left: 3px solid var(--mc-gold); background: var(--mc-block); color: var(--mc-muted); overflow-wrap: anywhere; }",
    ".martingale-convergence-lab .mc-disclosure strong { color: var(--fg); }",
    "@media (max-width: 700px) { .martingale-convergence-lab .mc-prediction-grid, .martingale-convergence-lab .mc-controls { grid-template-columns: minmax(0, 1fr); } .martingale-convergence-lab .mc-prediction-row { grid-template-columns: minmax(0, 1fr); } .martingale-convergence-lab .mc-model-buttons { grid-template-columns: minmax(0, 1fr); } .martingale-convergence-lab .mc-mass-row { grid-template-columns: minmax(88px, .8fr) minmax(0, 1.2fr) minmax(76px, .7fr); gap: 6px; } .martingale-convergence-lab .mc-ledger { padding: 10px; } }",
    "@media (prefers-reduced-motion: reduce) { .martingale-convergence-lab *, .martingale-convergence-lab *::before, .martingale-convergence-lab *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }"
  ].join("\n");

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function integerValue(value, minimum, name) {
    var number = Number(value);
    if (!Number.isFinite(number)) throw new Error(name + " must be finite");
    return Math.max(minimum, Math.floor(number));
  }

  function normaliseN(value) {
    return integerValue(value, 0, "n");
  }

  function normaliseB(value) {
    return integerValue(value, 1, "B");
  }

  function modelA(valueN, scale) {
    var n = normaliseN(valueN);
    var K = scale === undefined ? FIXED_SCALE : Number(scale);
    var spikeHeight = Math.pow(2, n);
    var spikeProbability = Math.pow(0.5, n);
    var aboveScale = spikeHeight > K;
    return {
      id: MODEL_A.id,
      n: n,
      scale: K,
      spikeHeight: spikeHeight,
      spikeProbability: spikeProbability,
      zeroProbability: 1 - spikeProbability,
      expectation: 1,
      limit: 0,
      l1Gap: 1,
      tailProbability: aboveScale ? spikeProbability : 0,
      tailExpectation: aboveScale ? 1 : 0,
      ui: false
    };
  }

  function walkDistribution(valueN, valueB) {
    var n = normaliseN(valueN);
    var B = normaliseB(valueB);
    var size = 2 * B + 1;
    var distribution = [];
    var next;
    var state;
    var step;
    var index;
    for (index = 0; index < size; index += 1) distribution.push(0);
    distribution[B] = 1;
    for (step = 0; step < n; step += 1) {
      next = [];
      for (index = 0; index < size; index += 1) next.push(0);
      for (index = 0; index < size; index += 1) {
        state = index - B;
        if (state === -B || state === B) {
          next[index] += distribution[index];
        } else {
          next[index - 1] += distribution[index] / 2;
          next[index + 1] += distribution[index] / 2;
        }
      }
      distribution = next;
    }
    return distribution;
  }

  function modelB(valueN, valueB) {
    var n = normaliseN(valueN);
    var B = normaliseB(valueB);
    var distribution = walkDistribution(n, B);
    var negativeProbability = distribution[0];
    var positiveProbability = distribution[2 * B];
    var transientMass = 0;
    var mean = 0;
    var absoluteMean = 0;
    var l1Gap = 0;
    var state;
    var probability;
    for (state = -B; state <= B; state += 1) {
      probability = distribution[state + B];
      mean += state * probability;
      absoluteMean += Math.abs(state) * probability;
      if (state > -B && state < B) {
        transientMass += probability;
        l1Gap += probability * (B - (state * state) / B);
      }
    }
    return {
      id: MODEL_B.id,
      n: n,
      B: B,
      distribution: distribution,
      negativeProbability: negativeProbability,
      positiveProbability: positiveProbability,
      absorbedMass: negativeProbability + positiveProbability,
      transientMass: transientMass,
      mean: mean,
      absoluteMean: absoluteMean,
      limitPositiveProbability: 0.5,
      limitNegativeProbability: 0.5,
      limitMean: 0,
      l1Gap: l1Gap,
      ui: true
    };
  }

  function formatNumber(api, value, digits) {
    var normalised = Math.abs(value) < EPSILON ? 0 : value;
    if (api && typeof api.format === "function") return api.format(normalised, digits);
    if (!Number.isFinite(normalised)) return "-";
    var text = normalised.toFixed(digits === undefined ? 4 : digits);
    return text.indexOf(".") === -1 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function makeElement(api, tag, attrs, children) {
    return api.el(tag, attrs || {}, children);
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function replaceChildren(node, children) {
    clear(node);
    (children || []).forEach(function (child) {
      if (child !== undefined && child !== null) node.appendChild(child);
    });
  }

  function installStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function metric(api, label, value) {
    return makeElement(api, "div", { className: "mc-metric" }, [
      makeElement(api, "span", {}, [label]),
      makeElement(api, "strong", {}, [value])
    ]);
  }

  function massRow(api, label, probability, tone, ariaLabel) {
    var fill = makeElement(api, "div", { className: "mc-fill " + tone });
    fill.style.width = String(Math.max(0, Math.min(100, probability * 100))) + "%";
    var track = makeElement(api, "div", { className: "mc-track", role: "img", "aria-label": ariaLabel }, [fill]);
    return makeElement(api, "div", { className: "mc-mass-row" }, [
      makeElement(api, "span", { className: "mc-mass-label" }, [label]),
      track,
      makeElement(api, "span", { className: "mc-value" }, [formatNumber(api, probability, 6)])
    ]);
  }

  function stateRow(api, state, probability, B) {
    var boundary = state === -B || state === B;
    var tone = state === -B ? "mc-fill-negative" : (state === B ? "mc-fill-positive" : "mc-fill-transient");
    var fill = makeElement(api, "div", { className: "mc-fill " + tone });
    fill.style.width = String(Math.max(0, Math.min(100, probability * 100))) + "%";
    var track = makeElement(api, "div", { className: "mc-track", role: "img", "aria-label": "状态 " + state + " 的概率 " + formatNumber(api, probability, 6) }, [fill]);
    return makeElement(api, "div", { className: "mc-state-row" + (boundary ? " mc-state-boundary" : "") }, [
      makeElement(api, "span", { className: "mc-state-label" }, [String(state)]),
      track,
      makeElement(api, "span", { className: "mc-value" }, [formatNumber(api, probability, 6)])
    ]);
  }

  function spikeLedger(api, data) {
    var ledger = makeElement(api, "section", { className: "mc-ledger", "aria-labelledby": "mc-spike-ledger-title" });
    ledger.appendChild(makeElement(api, "h4", { id: "mc-spike-ledger-title" }, ["模型 A：固定尺度概率质量"]));
    ledger.appendChild(makeElement(api, "p", { className: "mc-ledger-note" }, [
      "K=" + formatNumber(api, data.scale, 0) + " 固定；条形只画概率，右侧数字是精确解析值。"
    ]));
    ledger.appendChild(massRow(api, "Xₙ = 0", data.zeroProbability, "mc-fill-zero", "X_n 等于零的概率"));
    ledger.appendChild(massRow(api, "Xₙ = 2ⁿ", data.spikeProbability, "mc-fill-spike", "X_n 等于尖峰高度的概率"));
    ledger.appendChild(makeElement(api, "div", { className: "mc-disclosure" }, [
      makeElement(api, "strong", {}, ["尾部账："]),
      " P(Xₙ>K)=" + formatNumber(api, data.tailProbability, 6) + "，E[Xₙ·1{Xₙ>K}]=" + formatNumber(api, data.tailExpectation, 6) + "。n 变大时，概率质量变稀，尾部期望并不变小。"
    ]));
    return ledger;
  }

  function walkLedger(api, data) {
    var ledger = makeElement(api, "section", { className: "mc-ledger", "aria-labelledby": "mc-walk-ledger-title" });
    var stateLedger = makeElement(api, "div", { className: "mc-state-ledger", "aria-label": "吸收走停的状态概率账本" });
    var state;
    ledger.appendChild(makeElement(api, "h4", { id: "mc-walk-ledger-title" }, ["模型 B：状态概率账本"]));
    ledger.appendChild(makeElement(api, "p", { className: "mc-ledger-note" }, [
      "每一行是确定性动态规划得到的 P(Xₙ=s)；红、绿两端是冻结的吸收状态。"
    ]));
    for (state = -data.B; state <= data.B; state += 1) {
      stateLedger.appendChild(stateRow(api, state, data.distribution[state + data.B], data.B));
    }
    ledger.appendChild(stateLedger);
    ledger.appendChild(makeElement(api, "div", { className: "mc-disclosure" }, [
      makeElement(api, "strong", {}, ["L1 账："]),
      " 未吸收质量=" + formatNumber(api, data.transientMass, 6) + "，精确 E|Xₙ-X∞|=" + formatNumber(api, data.l1Gap, 6) + "；有限 B 给出 |Xₙ|≤B，因此全族 UI。"
    ]));
    return ledger;
  }

  function makeRangeControl(api, id, labelText, min, max, step, value, onInput) {
    var output = makeElement(api, "output", { id: id + "-output", className: "mc-output", "for": id }, [String(value)]);
    var label = makeElement(api, "label", { className: "mc-control-label", htmlFor: id }, [
      makeElement(api, "span", {}, [labelText]),
      output
    ]);
    var input = makeElement(api, "input", {
      id: id,
      type: "range",
      min: min,
      max: max,
      step: step,
      value: value,
      "aria-label": labelText
    });
    input.addEventListener("input", function () { onInput(Number(input.value)); });
    return {
      wrap: makeElement(api, "div", { className: "mc-control" }, [label, input]),
      input: input,
      output: output
    };
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    var uid = "mc-" + (INSTANCE += 1);
    var state = {
      model: MODEL_A.id,
      n: 8,
      B: 5,
      revealed: false,
      prediction: {
        aLimit: "",
        aL1: "",
        bLimit: "",
        bL1: ""
      }
    };
    var predictionSelects = {};
    var modelButtons = [];
    var results;
    var feedback;
    var controlPanel;
    var nRange;
    var bRange;
    var checkButton;

    function announce(message) {
      if (api && typeof api.announce === "function") api.announce(root, message);
    }

    function predictionSelect(parent, key, labelText, options) {
      var selectId = uid + "-" + key;
      var select = makeElement(api, "select", { id: selectId, "aria-label": labelText });
      options.forEach(function (option) {
        select.appendChild(makeElement(api, "option", { value: option.value }, [option.label]));
      });
      select.addEventListener("change", function () {
        state.prediction[key] = select.value;
        render();
      });
      predictionSelects[key] = select;
      parent.appendChild(makeElement(api, "label", { htmlFor: selectId }, [
        makeElement(api, "span", {}, [labelText]),
        select
      ]));
    }

    function predictionCard(legendText, limitKey, limitOptions, l1Key) {
      var card = makeElement(api, "fieldset", { className: "mc-prediction-card" }, [
        makeElement(api, "legend", {}, [legendText])
      ]);
      var row = makeElement(api, "div", { className: "mc-prediction-row" });
      predictionSelect(row, limitKey, "极限", limitOptions);
      predictionSelect(row, l1Key, "L1 收敛", [
        { value: "", label: "请选择" },
        { value: "yes", label: "是" },
        { value: "no", label: "否" }
      ]);
      card.appendChild(row);
      return card;
    }

    function predictionComplete() {
      return state.prediction.aLimit && state.prediction.aL1 && state.prediction.bLimit && state.prediction.bL1;
    }

    function predictionCorrect() {
      return state.prediction.aLimit === "zero" && state.prediction.aL1 === "no" &&
        state.prediction.bLimit === "boundary" && state.prediction.bL1 === "yes";
    }

    function currentData() {
      return state.model === MODEL_A.id ? modelA(state.n, FIXED_SCALE) : modelB(state.n, state.B);
    }

    function renderPredictionControls() {
      Object.keys(predictionSelects).forEach(function (key) {
        predictionSelects[key].value = state.prediction[key];
      });
    }

    function renderModelControls() {
      modelButtons.forEach(function (item) {
        item.button.setAttribute("aria-pressed", item.id === state.model ? "true" : "false");
      });
      nRange.input.value = String(state.n);
      nRange.output.textContent = String(state.n);
      bRange.input.value = String(state.B);
      bRange.output.textContent = String(state.B);
      bRange.input.disabled = state.model === MODEL_A.id;
      bRange.input.setAttribute("aria-disabled", state.model === MODEL_A.id ? "true" : "false");
      bRange.wrap.classList.toggle("mc-disabled", state.model === MODEL_A.id);
    }

    function renderResults() {
      var data = currentData();
      var metrics = makeElement(api, "div", { className: "mc-metrics" });
      replaceChildren(results, []);
      if (state.model === MODEL_A.id) {
        metrics.appendChild(metric(api, "当前 n", String(data.n)));
        metrics.appendChild(metric(api, "尖峰高度 2ⁿ", formatNumber(api, data.spikeHeight, 0)));
        metrics.appendChild(metric(api, "E Xₙ", formatNumber(api, data.expectation, 3)));
        metrics.appendChild(metric(api, "a.s. 极限", "0"));
        metrics.appendChild(metric(api, "E|Xₙ-X∞|", formatNumber(api, data.l1Gap, 3)));
        metrics.appendChild(metric(api, "UI", "否"));
        results.appendChild(metrics);
        results.appendChild(spikeLedger(api, data));
        results.appendChild(makeElement(api, "p", { className: "mc-disclosure" }, [
          "这是真实模型 A 的固定时刻账，不是路径抽样：P(Xₙ=2ⁿ)=2⁻ⁿ 且 E Xₙ=1。a.s. 的“最终出现 T”是无限路径论证，不能由这一个 n 的质量图单独推出。"
        ]));
      } else {
        metrics.appendChild(metric(api, "当前 (n, B)", "(" + data.n + ", " + data.B + ")"));
        metrics.appendChild(metric(api, "P(X∞=+B)", "1/2"));
        metrics.appendChild(metric(api, "P(未吸收)", formatNumber(api, data.transientMass, 6)));
        metrics.appendChild(metric(api, "E Xₙ", formatNumber(api, data.mean, 6)));
        metrics.appendChild(metric(api, "E|Xₙ-X∞|", formatNumber(api, data.l1Gap, 6)));
        metrics.appendChild(metric(api, "UI", "是：|Xₙ|≤B"));
        results.appendChild(metrics);
        results.appendChild(walkLedger(api, data));
        results.appendChild(makeElement(api, "p", { className: "mc-disclosure" }, [
          "状态质量由每一步的吸收动态规划精确递推；图上 n 越大，未吸收质量和 L1 距离越小。a.s. 吸收与 L1 极限仍由有限走廊的理论证明负责。"
        ]));
      }
    }

    function render() {
      renderPredictionControls();
      renderModelControls();
      controlPanel.hidden = !state.revealed;
      if (!state.revealed) {
        results.hidden = true;
        feedback.className = "mc-feedback";
        feedback.textContent = predictionComplete() ? "四格已填，点击“揭示账本”。" : "先为两个模型各选极限与 L1 判断。";
        return;
      }
      results.hidden = false;
      feedback.className = "mc-feedback " + (predictionCorrect() ? "mc-pass" : "mc-warn");
      feedback.textContent = predictionCorrect()
        ? "四格预测正确。现在可以调 n、B 和模型，读精确账本。"
        : "账本已揭示：对照模型 A 的尖峰尾账与模型 B 的吸收状态，修正预测。";
      renderResults();
    }

    installStyles(doc);
    root.classList.add("martingale-convergence-lab");

    var shell = makeElement(api, "div", { className: "mc-shell", "aria-labelledby": uid + "-title" });
    shell.appendChild(makeElement(api, "h3", { id: uid + "-title" }, ["鞅收敛实验：a.s.、L1 与 UI 的三本账"]));
    shell.appendChild(makeElement(api, "p", { className: "mc-intro" }, [
      "先预测两个完全可复算模型的极限与 L1 收敛；揭示后只显示精确概率递推，不使用随机样本。"
    ]));

    var predictionSection = makeElement(api, "section", { className: "mc-prediction", "aria-labelledby": uid + "-prediction-title" });
    predictionSection.appendChild(makeElement(api, "h4", { id: uid + "-prediction-title" }, ["预测门：四格都要先回答"]));
    var predictionGrid = makeElement(api, "div", { className: "mc-prediction-grid" });
    predictionGrid.appendChild(predictionCard("模型 A：尖峰鞅", "aLimit", [
      { value: "", label: "请选择" },
      { value: "zero", label: "0" },
      { value: "one", label: "1" },
      { value: "other", label: "其他" }
    ], "aL1"));
    predictionGrid.appendChild(predictionCard("模型 B：吸收走停", "bLimit", [
      { value: "", label: "请选择" },
      { value: "zero", label: "0" },
      { value: "boundary", label: "随机边界 ±B" },
      { value: "other", label: "其他" }
    ], "bL1"));
    predictionSection.appendChild(predictionGrid);
    feedback = makeElement(api, "p", { className: "mc-feedback", "aria-live": "polite" }, ["先为两个模型各选极限与 L1 判断。"]);
    var actionRow = makeElement(api, "div", { className: "mc-actions" });
    checkButton = makeElement(api, "button", { type: "button", className: "mc-primary" }, ["揭示账本"]);
    var resetButton = makeElement(api, "button", { type: "button" }, ["重置"]);
    checkButton.addEventListener("click", function () {
      if (!predictionComplete()) {
        feedback.className = "mc-feedback mc-warn";
        feedback.textContent = "还缺判断：模型 A、B 都要填写极限和 L1。";
        announce(feedback.textContent);
        return;
      }
      state.revealed = true;
      render();
      announce("账本已揭示；当前显示确定性模型计算。");
    });
    resetButton.addEventListener("click", function () {
      state.model = MODEL_A.id;
      state.n = 8;
      state.B = 5;
      state.revealed = false;
      state.prediction.aLimit = "";
      state.prediction.aL1 = "";
      state.prediction.bLimit = "";
      state.prediction.bL1 = "";
      render();
      announce("已重置预测、模型和参数。");
    });
    actionRow.appendChild(checkButton);
    actionRow.appendChild(resetButton);
    predictionSection.appendChild(actionRow);
    predictionSection.appendChild(feedback);
    shell.appendChild(predictionSection);

    controlPanel = makeElement(api, "section", { className: "mc-control-panel", "aria-labelledby": uid + "-control-title" });
    controlPanel.appendChild(makeElement(api, "h4", { id: uid + "-control-title" }, ["揭示后的模型控制"]));
    var modelButtonRow = makeElement(api, "div", { className: "mc-model-buttons", role: "group", "aria-label": "选择鞅模型" });
    [MODEL_A, MODEL_B].forEach(function (model) {
      var button = makeElement(api, "button", { type: "button", "aria-pressed": "false", "aria-label": model.label }, [model.label]);
      button.addEventListener("click", function () {
        state.model = model.id;
        render();
        announce("已切换到" + model.label + "。");
      });
      modelButtons.push({ id: model.id, button: button });
      modelButtonRow.appendChild(button);
    });
    controlPanel.appendChild(modelButtonRow);
    var controlGrid = makeElement(api, "div", { className: "mc-controls" });
    nRange = makeRangeControl(api, uid + "-n", "有限时刻 n", 0, MAX_N, 1, state.n, function (value) {
      state.n = clamp(Math.round(value), 0, MAX_N);
      render();
    });
    bRange = makeRangeControl(api, uid + "-b", "边界半宽 B（模型 B）", MIN_B, MAX_B, 1, state.B, function (value) {
      state.B = clamp(Math.round(value), MIN_B, MAX_B);
      render();
    });
    controlGrid.appendChild(nRange.wrap);
    controlGrid.appendChild(bRange.wrap);
    controlPanel.appendChild(controlGrid);
    shell.appendChild(controlPanel);

    results = makeElement(api, "section", { className: "mc-results", "aria-label": "揭示后的精确账本", hidden: true });
    shell.appendChild(results);
    root.replaceChildren(shell);
    render();
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    function close(left, right, message) {
      assert(Math.abs(left - right) < 1e-9, message + ": " + left + " vs " + right);
    }

    close(modelA(0).expectation, 1, "model A expectation at zero");
    close(modelA(0).spikeProbability, 1, "model A initial spike mass");
    close(modelA(1).spikeProbability, 0.5, "model A first spike mass");
    close(modelA(8).zeroProbability + modelA(8).spikeProbability, 1, "model A total mass");
    close(modelA(8).tailExpectation, 1, "model A fixed-scale tail expectation");
    assert(modelA(8).ui === false, "model A is not UI");

    var distribution = walkDistribution(2, 2);
    close(distribution[0], 0.25, "walk distribution negative boundary");
    close(distribution[2], 0.5, "walk distribution center");
    close(distribution[4], 0.25, "walk distribution positive boundary");

    close(modelB(0, 5).l1Gap, 5, "model B initial L1 gap");
    close(modelB(1, 5).l1Gap, 4.8, "model B one-step L1 gap");
    close(modelB(1, 1).l1Gap, 0, "B=1 absorbs in one step");
    for (var B = 1; B <= 8; B += 1) {
      var previousTransient = 1;
      for (var n = 0; n <= 24; n += 1) {
        var data = modelB(n, B);
        var total = data.distribution.reduce(function (sum, probability) { return sum + probability; }, 0);
        close(total, 1, "walk total mass B=" + B + " n=" + n);
        close(data.mean, 0, "walk mean B=" + B + " n=" + n);
        assert(data.transientMass <= previousTransient + 1e-9, "transient mass is monotone");
        assert(data.l1Gap >= -1e-12, "L1 gap is nonnegative");
        previousTransient = data.transientMass;
      }
      assert(modelB(1000, B).transientMass < 1e-8, "finite walk eventually absorbs for B=" + B);
    }
    assert(modelB(12, 5).ui === true, "model B is UI");
    return { checks: checks, models: 2 };
  }

  var exported = {
    MODEL_A: MODEL_A,
    MODEL_B: MODEL_B,
    modelA: modelA,
    walkDistribution: walkDistribution,
    modelB: modelB,
    selfTest: selfTest
  };

  if (typeof module !== "undefined" && module.exports) module.exports = exported;
  if (host && host.CourseLearning && typeof host.CourseLearning.register === "function") {
    host.CourseLearning.register("martingale-convergence", mount);
  }
  if (typeof module !== "undefined" && module.exports && typeof require !== "undefined" && require.main === module) {
    try {
      var report = selfTest();
      console.log("martingale-convergence self-test: PASS (" + report.checks + " checks, " + report.models + " models)");
    } catch (error) {
      console.error("martingale-convergence self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
}(typeof window !== "undefined" ? window : null));

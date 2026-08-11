(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "cl-backprop-styles";
  var PARAMETER_ORDER = [
    "w11", "w12", "w21", "w22", "v1", "v2", "b1", "b2", "bo"
  ];
  var PARAMETER_LABELS = {
    w11: "w₁₁  (x₁ → h₁)",
    w12: "w₁₂  (x₂ → h₁)",
    w21: "w₂₁  (x₁ → h₂)",
    w22: "w₂₂  (x₂ → h₂)",
    v1: "v₁   (h₁ → ŷ)",
    v2: "v₂   (h₂ → ŷ)",
    b1: "b₁   (hidden 1)",
    b2: "b₂   (hidden 2)",
    bo: "bᵧ   (output)"
  };

  var INITIAL = {
    activation: "sigmoid",
    x1: 0.8,
    x2: -0.4,
    target: 0.6,
    epsilon: 0.0001,
    learningRate: 0.08,
    selected: "w11",
    params: {
      w11: 0.7,
      w12: -0.5,
      w21: -0.6,
      w22: 0.8,
      v1: 0.9,
      v2: -0.7,
      b1: 0.1,
      b2: -0.15,
      bo: 0.05
    }
  };

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function cloneInitial() {
    var state = {
      activation: INITIAL.activation,
      x1: INITIAL.x1,
      x2: INITIAL.x2,
      target: INITIAL.target,
      epsilon: INITIAL.epsilon,
      learningRate: INITIAL.learningRate,
      selected: INITIAL.selected,
      params: {}
    };
    PARAMETER_ORDER.forEach(function (key) {
      state.params[key] = INITIAL.params[key];
    });
    return state;
  }

  function numberText(value, digits, api) {
    if (!finite(value)) {
      return "—";
    }
    if (api && typeof api.format === "function") {
      try {
        return api.format(value, digits);
      } catch (error) {
        // The host formatter is optional; use the deterministic fallback below.
      }
    }
    var places = typeof digits === "number" ? digits : 3;
    var rounded = Math.abs(value) < Math.pow(10, -(places + 1)) ? 0 : value;
    return rounded.toFixed(places);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function readNumber(input, fallback) {
    var value = Number(input.value);
    return finite(value) ? value : fallback;
  }

  function activationValue(kind, z) {
    if (kind === "relu") {
      return Math.max(0, z);
    }
    if (z >= 0) {
      var e = Math.exp(-z);
      return 1 / (1 + e);
    }
    var positive = Math.exp(z);
    return positive / (1 + positive);
  }

  function activationDerivative(kind, z) {
    if (kind === "relu") {
      return z > 0 ? 1 : 0;
    }
    var value = activationValue("sigmoid", z);
    return value * (1 - value);
  }

  function forward(state, params) {
    var p = params || state.params;
    var z1 = p.w11 * state.x1 + p.w12 * state.x2 + p.b1;
    var z2 = p.w21 * state.x1 + p.w22 * state.x2 + p.b2;
    var a1 = activationValue(state.activation, z1);
    var a2 = activationValue(state.activation, z2);
    var zOutput = p.v1 * a1 + p.v2 * a2 + p.bo;
    var prediction = activationValue(state.activation, zOutput);
    var loss = 0.5 * Math.pow(prediction - state.target, 2);
    return {
      z1: z1,
      z2: z2,
      a1: a1,
      a2: a2,
      zOutput: zOutput,
      prediction: prediction,
      loss: loss
    };
  }

  function analyticGradients(state, values) {
    var p = state.params;
    var dPrediction = values.prediction - state.target;
    var dZOutput = dPrediction * activationDerivative(state.activation, values.zOutput);
    var gradients = {};

    gradients.v1 = dZOutput * values.a1;
    gradients.v2 = dZOutput * values.a2;
    gradients.bo = dZOutput;

    var dA1 = dZOutput * p.v1;
    var dA2 = dZOutput * p.v2;
    var dZ1 = dA1 * activationDerivative(state.activation, values.z1);
    var dZ2 = dA2 * activationDerivative(state.activation, values.z2);

    gradients.w11 = dZ1 * state.x1;
    gradients.w12 = dZ1 * state.x2;
    gradients.b1 = dZ1;
    gradients.w21 = dZ2 * state.x1;
    gradients.w22 = dZ2 * state.x2;
    gradients.b2 = dZ2;
    gradients.dPrediction = dPrediction;
    gradients.dZOutput = dZOutput;
    gradients.dA1 = dA1;
    gradients.dA2 = dA2;
    gradients.dZ1 = dZ1;
    gradients.dZ2 = dZ2;
    return gradients;
  }

  function numericalGradient(state, key) {
    var epsilon = Math.max(1e-9, Math.abs(state.epsilon));
    var plus = {};
    var minus = {};
    PARAMETER_ORDER.forEach(function (name) {
      plus[name] = state.params[name];
      minus[name] = state.params[name];
    });
    plus[key] += epsilon;
    minus[key] -= epsilon;
    return (forward(state, plus).loss - forward(state, minus).loss) / (2 * epsilon);
  }

  function makeElement(tag, attrs, text) {
    var element = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (name) {
      if (attrs[name] !== null && attrs[name] !== undefined) {
        element.setAttribute(name, String(attrs[name]));
      }
    });
    if (text !== undefined) {
      element.textContent = text;
    }
    return element;
  }

  function makeSvgElement(tag, attrs, text) {
    var element = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (name) {
      if (attrs[name] !== null && attrs[name] !== undefined) {
        element.setAttribute(name, String(attrs[name]));
      }
    });
    if (text !== undefined) {
      element.textContent = text;
    }
    return element;
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".cl-backprop { --cl-bp-bg: var(--bg, #faf6ee); --cl-bp-panel: var(--block-bg, #f5f0e3); --cl-bp-border: var(--border, #e0d7c4); --cl-bp-fg: var(--fg, #2c2a26); --cl-bp-soft: var(--fg-soft, #6b6557); --cl-bp-accent: var(--accent, #8a5a2b); --cl-bp-blue: #2d6f9f; --cl-bp-green: #4d8658; --cl-bp-warn: #aa5d36; margin: 1.5rem 0 2rem; color: var(--cl-bp-fg); font-size: .95rem; line-height: 1.55; }",
      ".cl-backprop * { box-sizing: border-box; }",
      ".cl-backprop .cl-bp-shell { border: 1px solid var(--cl-bp-border); border-radius: 8px; overflow: hidden; background: var(--cl-bp-bg); }",
      ".cl-backprop .cl-bp-header { padding: 1.1rem 1.25rem .95rem; border-bottom: 1px solid var(--cl-bp-border); background: var(--cl-bp-panel); }",
      ".cl-backprop .cl-bp-kicker { margin: 0 0 .2rem; color: var(--cl-bp-accent); font-size: .75rem; font-weight: 800; letter-spacing: 0; text-transform: uppercase; }",
      ".cl-backprop h3 { margin: 0; color: var(--cl-bp-fg); font-size: 1.2rem; }",
      ".cl-backprop .cl-bp-header p { margin: .35rem 0 0; color: var(--cl-bp-soft); }",
      ".cl-backprop .cl-bp-controls { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .75rem; padding: .9rem 1.1rem; border-bottom: 1px solid var(--cl-bp-border); background: var(--cl-bp-panel); }",
      ".cl-backprop .cl-bp-fieldset { min-width: 0; margin: 0; padding: .65rem .7rem .7rem; border: 1px solid var(--cl-bp-border); border-radius: 6px; }",
      ".cl-backprop .cl-bp-fieldset legend { padding: 0 .25rem; color: var(--cl-bp-soft); font-size: .78rem; font-weight: 700; }",
      ".cl-backprop .cl-bp-label { display: flex; align-items: center; justify-content: space-between; gap: .4rem; margin: .28rem 0; color: var(--cl-bp-soft); font-size: .82rem; }",
      ".cl-backprop select, .cl-backprop input[type=number] { width: 100%; min-width: 0; border: 1px solid var(--cl-bp-border); border-radius: 7px; padding: .38rem .45rem; color: var(--cl-bp-fg); background: var(--cl-bp-bg); font: inherit; font-size: .84rem; }",
      ".cl-backprop input[type=range] { width: 100%; accent-color: var(--cl-bp-accent); }",
      ".cl-backprop .cl-bp-range-row { display: grid; grid-template-columns: 1fr 4.5rem; align-items: center; gap: .55rem; }",
      ".cl-backprop .cl-bp-range-value { color: var(--cl-bp-accent); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .78rem; text-align: right; }",
      ".cl-backprop .cl-bp-actions { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; margin-top: .7rem; }",
      ".cl-backprop button { border: 1px solid var(--cl-bp-accent); border-radius: 8px; padding: .42rem .7rem; color: var(--cl-bp-bg); background: var(--cl-bp-accent); cursor: pointer; font: inherit; font-size: .82rem; font-weight: 700; }",
      ".cl-backprop button:hover, .cl-backprop button:focus-visible { filter: brightness(1.08); }",
      ".cl-backprop button.cl-bp-secondary { color: var(--cl-bp-accent); background: transparent; }",
      ".cl-backprop .cl-bp-main { display: grid; grid-template-columns: minmax(0, 1.22fr) minmax(290px, .78fr); gap: 1rem; padding: 1rem; }",
      ".cl-backprop .cl-bp-graph-card, .cl-backprop .cl-bp-metric-card { border: 1px solid var(--cl-bp-border); border-radius: 6px; background: var(--cl-bp-panel); }",
      ".cl-backprop .cl-bp-graph-card { padding: .55rem .65rem .75rem; }",
      ".cl-backprop .cl-bp-svg { display: block; width: 100%; height: auto; min-height: 250px; overflow: visible; }",
      ".cl-backprop .cl-bp-caption { margin: .25rem .35rem 0; color: var(--cl-bp-soft); font-size: .78rem; }",
      ".cl-backprop .cl-bp-edge { stroke: var(--cl-bp-soft); stroke-width: 1.4; opacity: .5; transition: stroke .15s, stroke-width .15s, opacity .15s; }",
      ".cl-backprop .cl-bp-edge-selected { stroke: var(--cl-bp-accent); stroke-width: 3.2; opacity: 1; }",
      ".cl-backprop .cl-bp-edge-gradient { stroke: var(--cl-bp-blue); stroke-dasharray: 5 4; opacity: .75; }",
      ".cl-backprop .cl-bp-edge-label { fill: var(--cl-bp-soft); font: 11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; text-anchor: middle; paint-order: stroke; stroke: var(--cl-bp-panel); stroke-width: 4px; }",
      ".cl-backprop .cl-bp-edge-label-selected { fill: var(--cl-bp-accent); font-weight: 800; }",
      ".cl-backprop .cl-bp-node rect { fill: var(--cl-bp-bg); stroke: var(--cl-bp-border); stroke-width: 1.5; }",
      ".cl-backprop .cl-bp-node-selected rect { stroke: var(--cl-bp-accent); stroke-width: 3; }",
      ".cl-backprop .cl-bp-node-title { fill: var(--cl-bp-fg); font: 700 13px -apple-system, BlinkMacSystemFont, sans-serif; text-anchor: middle; }",
      ".cl-backprop .cl-bp-node-value { fill: var(--cl-bp-accent); font: 11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; text-anchor: middle; }",
      ".cl-backprop .cl-bp-node-detail { fill: var(--cl-bp-soft); font: 9px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; text-anchor: middle; }",
      ".cl-backprop .cl-bp-metric-card { padding: .78rem .85rem; }",
      ".cl-backprop .cl-bp-metric-card + .cl-bp-metric-card { margin-top: .7rem; }",
      ".cl-backprop .cl-bp-card-title { margin: 0 0 .5rem; color: var(--cl-bp-accent); font-size: .88rem; font-weight: 800; }",
      ".cl-backprop .cl-bp-big-number { margin: .05rem 0 .15rem; font: 700 1.55rem ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: var(--cl-bp-fg); }",
      ".cl-backprop .cl-bp-subtle { margin: 0; color: var(--cl-bp-soft); font-size: .78rem; }",
      ".cl-backprop .cl-bp-gradient-grid { display: grid; grid-template-columns: auto 1fr; gap: .23rem .65rem; margin: 0; font-size: .81rem; }",
      ".cl-backprop .cl-bp-gradient-grid dt { color: var(--cl-bp-soft); }",
      ".cl-backprop .cl-bp-gradient-grid dd { margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; text-align: right; }",
      ".cl-backprop .cl-bp-check { display: grid; grid-template-columns: 1fr 1fr; gap: .45rem; margin-top: .55rem; }",
      ".cl-backprop .cl-bp-check-item { padding: .45rem .55rem; border: 1px solid var(--cl-bp-border); border-radius: 8px; background: var(--cl-bp-bg); }",
      ".cl-backprop .cl-bp-check-label { display: block; color: var(--cl-bp-soft); font-size: .72rem; }",
      ".cl-backprop .cl-bp-check-value { display: block; margin-top: .12rem; font: 700 .86rem ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }",
      ".cl-backprop .cl-bp-status { margin: .65rem 0 0; padding: .45rem .55rem; border-radius: 8px; color: var(--cl-bp-green); background: rgba(77, 134, 88, .11); font-size: .78rem; }",
      ".cl-backprop .cl-bp-status-warning { color: var(--cl-bp-warn); background: rgba(170, 93, 54, .11); }",
      ".cl-backprop .cl-bp-explain { display: grid; grid-template-columns: repeat(3, 1fr); gap: .7rem; padding: 0 1rem 1rem; }",
      ".cl-backprop .cl-bp-explain article { padding: .7rem .75rem; border-top: 2px solid var(--cl-bp-border); background: transparent; }",
      ".cl-backprop .cl-bp-explain h4 { margin: 0 0 .25rem; color: var(--cl-bp-accent); font-size: .82rem; }",
      ".cl-backprop .cl-bp-explain p { margin: 0; color: var(--cl-bp-soft); font-size: .78rem; }",
      ".cl-backprop .cl-bp-announce { min-height: 1.3em; margin: 0 1rem .9rem; color: var(--cl-bp-soft); font-size: .78rem; }",
      "@media (max-width: 760px) { .cl-backprop .cl-bp-controls, .cl-backprop .cl-bp-main, .cl-backprop .cl-bp-explain { grid-template-columns: 1fr; } .cl-backprop .cl-bp-main { padding: .75rem; } .cl-backprop .cl-bp-explain { padding: 0 .75rem .75rem; } }"
    ].join("\n");
    (document.head || document.documentElement).appendChild(style);
  }

  function buildInterface(root) {
    root.innerHTML = [
      '<div class="cl-bp-shell">',
      '  <header class="cl-bp-header">',
      '    <p class="cl-bp-kicker">反向传播 · 可观察的链式法则</p>',
      '    <h3>追踪一个参数的梯度消息</h3>',
      '    <p>网络结构固定为 2 → 2 → 1。先看前向数值，再选一条边，比较解析梯度与中心差分。</p>',
      '  </header>',
      '  <div class="cl-bp-controls">',
      '    <fieldset class="cl-bp-fieldset">',
      '      <legend>非线性</legend>',
      '      <label class="cl-bp-label" for="cl-bp-activation">激活函数</label>',
      '      <select id="cl-bp-activation" data-cl-bp-activation aria-label="选择激活函数"><option value="sigmoid">sigmoid</option><option value="relu">ReLU</option></select>',
      '    </fieldset>',
      '    <fieldset class="cl-bp-fieldset">',
      '      <legend>观察对象</legend>',
      '      <label class="cl-bp-label" for="cl-bp-parameter">边 / 参数</label>',
      '      <select id="cl-bp-parameter" data-cl-bp-parameter aria-label="选择要检查的边或参数"></select>',
      '      <div class="cl-bp-range-row"><input type="range" min="-2" max="2" step="0.01" data-cl-bp-parameter-value aria-label="调整选中参数"><span class="cl-bp-range-value" data-cl-bp-parameter-readout></span></div>',
      '    </fieldset>',
      '    <fieldset class="cl-bp-fieldset">',
      '      <legend>中心差分</legend>',
      '      <label class="cl-bp-label" for="cl-bp-epsilon">步长 ε</label>',
      '      <input id="cl-bp-epsilon" type="number" min="0.000001" max="0.1" step="0.000001" data-cl-bp-epsilon aria-label="中心差分步长">',
      '      <p class="cl-bp-subtle">只用于检查，不参与更新。</p>',
      '    </fieldset>',
      '    <fieldset class="cl-bp-fieldset">',
      '      <legend>一次更新</legend>',
      '      <label class="cl-bp-label" for="cl-bp-learning-rate">学习率 η</label>',
      '      <div class="cl-bp-range-row"><input id="cl-bp-learning-rate" type="range" min="0" max="0.5" step="0.01" data-cl-bp-learning-rate aria-label="学习率"><span class="cl-bp-range-value" data-cl-bp-learning-rate-readout></span></div>',
      '      <div class="cl-bp-actions"><button type="button" data-cl-bp-step>更新选中参数</button><button type="button" class="cl-bp-secondary" data-cl-bp-reset>重置</button></div>',
      '    </fieldset>',
      '  </div>',
      '  <div class="cl-bp-main">',
      '    <div class="cl-bp-graph-card">',
      '      <svg class="cl-bp-svg" viewBox="0 0 520 280" role="img" aria-labelledby="cl-bp-svg-title cl-bp-svg-desc">',
      '        <title id="cl-bp-svg-title">2 到 2 到 1 的前向与反向传播计算图</title>',
      '        <desc id="cl-bp-svg-desc">节点显示当前激活值，橙色边是选中的参数，蓝色虚线表示梯度消息。</desc>',
      '        <g data-cl-bp-edges></g><g data-cl-bp-nodes></g>',
      '      </svg>',
      '      <p class="cl-bp-caption">橙色：当前选中参数；蓝色虚线：损失沿局部导数回传的消息。节点同时显示 z 与 a。</p>',
      '    </div>',
      '    <div>',
      '      <section class="cl-bp-metric-card">',
      '        <p class="cl-bp-card-title">前向结果</p>',
      '        <p class="cl-bp-big-number" data-cl-bp-prediction></p>',
      '        <p class="cl-bp-subtle" data-cl-bp-loss></p>',
      '      </section>',
      '      <section class="cl-bp-metric-card">',
      '        <p class="cl-bp-card-title">选中参数的梯度</p>',
      '        <dl class="cl-bp-gradient-grid">',
      '          <dt>局部链式法则</dt><dd data-cl-bp-analytic></dd>',
      '          <dt>中心差分</dt><dd data-cl-bp-numerical></dd>',
      '          <dt>相对误差</dt><dd data-cl-bp-relative></dd>',
      '        </dl>',
      '        <div class="cl-bp-check"><div class="cl-bp-check-item"><span class="cl-bp-check-label">dL / dŷ</span><span class="cl-bp-check-value" data-cl-bp-dprediction></span></div><div class="cl-bp-check-item"><span class="cl-bp-check-label">dL / dzᵧ</span><span class="cl-bp-check-value" data-cl-bp-dzoutput></span></div></div>',
      '        <p class="cl-bp-status" data-cl-bp-status aria-live="polite"></p>',
      '      </section>',
      '      <section class="cl-bp-metric-card">',
      '        <p class="cl-bp-card-title">消息分解</p>',
      '        <dl class="cl-bp-gradient-grid"><dt data-cl-bp-local-label>选中局部量</dt><dd data-cl-bp-local></dd><dt>隐藏层回传</dt><dd data-cl-bp-hidden></dd></dl>',
      '        <p class="cl-bp-subtle">把一个大梯度拆成许多相乘的小导数；每个节点只需传递自己的局部消息。</p>',
      '      </section>',
      '    </div>',
      '  </div>',
      '  <div class="cl-bp-explain">',
      '    <article><h4>先问自己</h4><p>若把选中的权重增大一点，预测会让损失上升还是下降？先看梯度符号，再按负梯度方向走。</p></article>',
      '    <article><h4>数值检查</h4><p>中心差分用两次前向估计斜率：它是推导的单元测试，不是训练方法；参数多时它要重复前向。</p></article>',
      '    <article><h4>边界提醒</h4><p>ReLU 在 z = 0 不可微；若差分跨过拐点，误差变大是边界信号，不是链式法则失效。</p></article>',
      '  </div>',
      '  <p class="cl-bp-announce" data-cl-bp-announce aria-live="polite"></p>',
      '</div>'
    ].join("");

    var parameterSelect = root.querySelector("[data-cl-bp-parameter]");
    PARAMETER_ORDER.forEach(function (key) {
      parameterSelect.appendChild(makeElement("option", { value: key }, PARAMETER_LABELS[key]));
    });
    return {
      activation: root.querySelector("[data-cl-bp-activation]"),
      parameter: parameterSelect,
      parameterValue: root.querySelector("[data-cl-bp-parameter-value]"),
      parameterReadout: root.querySelector("[data-cl-bp-parameter-readout]"),
      epsilon: root.querySelector("[data-cl-bp-epsilon]"),
      learningRate: root.querySelector("[data-cl-bp-learning-rate]"),
      learningRateReadout: root.querySelector("[data-cl-bp-learning-rate-readout]"),
      step: root.querySelector("[data-cl-bp-step]"),
      reset: root.querySelector("[data-cl-bp-reset]"),
      svg: root.querySelector(".cl-bp-svg"),
      edges: root.querySelector("[data-cl-bp-edges]"),
      nodes: root.querySelector("[data-cl-bp-nodes]"),
      prediction: root.querySelector("[data-cl-bp-prediction]"),
      loss: root.querySelector("[data-cl-bp-loss]"),
      analytic: root.querySelector("[data-cl-bp-analytic]"),
      numerical: root.querySelector("[data-cl-bp-numerical]"),
      relative: root.querySelector("[data-cl-bp-relative]"),
      dPrediction: root.querySelector("[data-cl-bp-dprediction]"),
      dZOutput: root.querySelector("[data-cl-bp-dzoutput]"),
      status: root.querySelector("[data-cl-bp-status]"),
      localLabel: root.querySelector("[data-cl-bp-local-label]"),
      local: root.querySelector("[data-cl-bp-local]"),
      hidden: root.querySelector("[data-cl-bp-hidden]"),
      announce: root.querySelector("[data-cl-bp-announce]")
    };
  }

  function edgeDefinition() {
    return [
      { key: "w11", x1: 92, y1: 78, x2: 195, y2: 78, labelX: 144, labelY: 66 },
      { key: "w12", x1: 92, y1: 202, x2: 195, y2: 202, labelX: 144, labelY: 218 },
      { key: "w21", x1: 92, y1: 78, x2: 195, y2: 208, labelX: 137, labelY: 133 },
      { key: "w22", x1: 92, y1: 202, x2: 195, y2: 72, labelX: 137, labelY: 148 },
      { key: "v1", x1: 285, y1: 78, x2: 414, y2: 140, labelX: 350, labelY: 94 },
      { key: "v2", x1: 285, y1: 202, x2: 414, y2: 140, labelX: 350, labelY: 192 }
    ];
  }

  function nodeDefinition() {
    return [
      { key: "x1", x: 42, y: 58, width: 100, height: 55, title: "x₁", kind: "input" },
      { key: "x2", x: 42, y: 175, width: 100, height: 55, title: "x₂", kind: "input" },
      { key: "h1", x: 195, y: 42, width: 100, height: 72, title: "h₁", kind: "hidden" },
      { key: "h2", x: 195, y: 166, width: 100, height: 72, title: "h₂", kind: "hidden" },
      { key: "output", x: 414, y: 112, width: 90, height: 62, title: "ŷ", kind: "output" }
    ];
  }

  function drawGraph(refs, state, values, gradients, api) {
    refs.edges.innerHTML = "";
    refs.nodes.innerHTML = "";
    var selected = state.selected;

    edgeDefinition().forEach(function (edge) {
      var line = makeSvgElement("line", {
        x1: edge.x1,
        y1: edge.y1,
        x2: edge.x2,
        y2: edge.y2,
        class: "cl-bp-edge" + (edge.key === selected ? " cl-bp-edge-selected" : "")
      });
      line.setAttribute("aria-label", PARAMETER_LABELS[edge.key] + " = " + numberText(state.params[edge.key], 3, api));
      refs.edges.appendChild(line);
      if (edge.key === selected) {
        var message = makeSvgElement("line", {
          x1: edge.x1,
          y1: edge.y1,
          x2: edge.x2,
          y2: edge.y2,
          class: "cl-bp-edge-gradient"
        });
        refs.edges.appendChild(message);
      }
      var label = makeSvgElement("text", {
        x: edge.labelX,
        y: edge.labelY,
        class: "cl-bp-edge-label" + (edge.key === selected ? " cl-bp-edge-label-selected" : "")
      }, edge.key.charAt(0) === "v" ? edge.key.replace("v", "v") + "=" + numberText(state.params[edge.key], 2, api) : edge.key + "=" + numberText(state.params[edge.key], 2, api));
      refs.edges.appendChild(label);
    });

    nodeDefinition().forEach(function (node) {
      var group = makeSvgElement("g", {
        class: "cl-bp-node" + ((node.key === "h1" && (selected === "w11" || selected === "w12" || selected === "b1")) || (node.key === "h2" && (selected === "w21" || selected === "w22" || selected === "b2")) || (node.key === "output" && (selected === "v1" || selected === "v2" || selected === "bo")) ? " cl-bp-node-selected" : "")
      });
      group.appendChild(makeSvgElement("rect", { x: node.x, y: node.y, width: node.width, height: node.height, rx: 11 }));
      group.appendChild(makeSvgElement("text", { x: node.x + node.width / 2, y: node.y + 19, class: "cl-bp-node-title" }, node.title));
      if (node.kind === "input") {
        var inputValue = node.key === "x1" ? state.x1 : state.x2;
        group.appendChild(makeSvgElement("text", { x: node.x + node.width / 2, y: node.y + 39, class: "cl-bp-node-value" }, "a=" + numberText(inputValue, 3, api)));
      } else if (node.kind === "hidden") {
        var hiddenZ = node.key === "h1" ? values.z1 : values.z2;
        var hiddenA = node.key === "h1" ? values.a1 : values.a2;
        group.appendChild(makeSvgElement("text", { x: node.x + node.width / 2, y: node.y + 39, class: "cl-bp-node-value" }, "a=" + numberText(hiddenA, 3, api)));
        group.appendChild(makeSvgElement("text", { x: node.x + node.width / 2, y: node.y + 56, class: "cl-bp-node-detail" }, "z=" + numberText(hiddenZ, 3, api)));
      } else {
        group.appendChild(makeSvgElement("text", { x: node.x + node.width / 2, y: node.y + 40, class: "cl-bp-node-value" }, "a=" + numberText(values.prediction, 3, api)));
        group.appendChild(makeSvgElement("text", { x: node.x + node.width / 2, y: node.y + 55, class: "cl-bp-node-detail" }, "L=" + numberText(values.loss, 3, api)));
      }
      refs.nodes.appendChild(group);
    });

    [
      { key: "b1", x: 245, y: 30, text: "b₁=" + numberText(state.params.b1, 2, api) },
      { key: "b2", x: 245, y: 254, text: "b₂=" + numberText(state.params.b2, 2, api) },
      { key: "bo", x: 470, y: 103, text: "bᵧ=" + numberText(state.params.bo, 2, api) }
    ].forEach(function (bias) {
      var biasLabel = makeSvgElement("text", {
        x: bias.x,
        y: bias.y,
        class: "cl-bp-edge-label" + (selected === bias.key ? " cl-bp-edge-label-selected" : "")
      }, bias.text);
      refs.nodes.appendChild(biasLabel);
    });
  }

  function update(refs, state, api) {
    var values = forward(state);
    var gradients = analyticGradients(state, values);
    var numerical = numericalGradient(state, state.selected);
    var analytic = gradients[state.selected];
    var scale = Math.max(1, Math.abs(analytic), Math.abs(numerical));
    var relative = Math.abs(analytic - numerical) / scale;
    var nearKink = state.activation === "relu" && (values.z1 === 0 || values.z2 === 0 || values.zOutput === 0);
    var isPass = relative < 1e-5 && !nearKink;

    drawGraph(refs, state, values, gradients, api);
    refs.activation.value = state.activation;
    refs.parameter.value = state.selected;
    refs.parameterValue.value = String(clamp(state.params[state.selected], -2, 2));
    refs.parameterReadout.textContent = numberText(state.params[state.selected], 3, api);
    refs.epsilon.value = String(state.epsilon);
    refs.learningRate.value = String(state.learningRate);
    refs.learningRateReadout.textContent = numberText(state.learningRate, 2, api);
    refs.prediction.textContent = "ŷ = " + numberText(values.prediction, 4, api);
    refs.loss.textContent = "平方损失 L = ½(ŷ − y)² = " + numberText(values.loss, 6, api) + "；目标 y = " + numberText(state.target, 3, api);
    refs.analytic.textContent = numberText(analytic, 8, api);
    refs.numerical.textContent = numberText(numerical, 8, api);
    refs.relative.textContent = numberText(relative, 3, api) + (relative < 1e-5 ? "  ✓" : "");
    refs.dPrediction.textContent = numberText(gradients.dPrediction, 5, api);
    refs.dZOutput.textContent = numberText(gradients.dZOutput, 5, api);
    refs.localLabel.textContent = "dL / d" + state.selected;
    refs.local.textContent = numberText(analytic, 6, api);
    refs.hidden.textContent = "dZ₁=" + numberText(gradients.dZ1, 4, api) + ", dZ₂=" + numberText(gradients.dZ2, 4, api);
    refs.status.className = "cl-bp-status" + (isPass ? "" : " cl-bp-status-warning");
    refs.status.textContent = nearKink ? "ReLU 在拐点附近：中心差分可能跨过不可微点。" : (isPass ? "两种斜率一致：解析梯度通过数值审计。" : "差异偏大：试试更合适的 ε，或检查是否靠近 ReLU 拐点。");
    refs.step.title = "只按负梯度更新 " + PARAMETER_LABELS[state.selected];
    return { values: values, gradients: gradients, numerical: numerical, relative: relative };
  }

  function announce(api, refs, root, message) {
    refs.announce.textContent = message;
    if (api && typeof api.announce === "function") {
      try {
        api.announce(root, message);
      } catch (error) {
        // Announcing is an optional host capability.
      }
    }
  }

  function registerLab() {
    if (!window.CourseLearning || typeof window.CourseLearning.register !== "function") {
      return;
    }
    window.CourseLearning.register("backprop", function (root, api) {
      if (!root || !root.querySelector || typeof document === "undefined") {
        return;
      }
      root.classList.add("cl-backprop");
      installStyles();
      var state = cloneInitial();
      var refs = buildInterface(root);
      var last = update(refs, state, api);

      refs.activation.addEventListener("change", function () {
        state.activation = refs.activation.value === "relu" ? "relu" : "sigmoid";
        last = update(refs, state, api);
        announce(api, refs, root, "已切换到 " + state.activation + "；先观察导数如何改变消息。 ");
      });
      refs.parameter.addEventListener("change", function () {
        state.selected = PARAMETER_ORDER.indexOf(refs.parameter.value) >= 0 ? refs.parameter.value : INITIAL.selected;
        last = update(refs, state, api);
        announce(api, refs, root, "现在检查 " + PARAMETER_LABELS[state.selected] + "。 ");
      });
      refs.parameterValue.addEventListener("input", function () {
        state.params[state.selected] = clamp(readNumber(refs.parameterValue, state.params[state.selected]), -2, 2);
        last = update(refs, state, api);
      });
      refs.epsilon.addEventListener("change", function () {
        state.epsilon = clamp(Math.abs(readNumber(refs.epsilon, INITIAL.epsilon)), 1e-6, 0.1);
        last = update(refs, state, api);
      });
      refs.learningRate.addEventListener("input", function () {
        state.learningRate = clamp(readNumber(refs.learningRate, INITIAL.learningRate), 0, 0.5);
        refs.learningRateReadout.textContent = numberText(state.learningRate, 2, api);
      });
      refs.step.addEventListener("click", function () {
        last = update(refs, state, api);
        var before = state.params[state.selected];
        state.params[state.selected] = clamp(before - state.learningRate * last.gradients[state.selected], -2, 2);
        last = update(refs, state, api);
        announce(api, refs, root, PARAMETER_LABELS[state.selected] + " 从 " + numberText(before, 4, api) + " 更新为 " + numberText(state.params[state.selected], 4, api) + "；只更新了这一个参数。 ");
      });
      refs.reset.addEventListener("click", function () {
        state = cloneInitial();
        last = update(refs, state, api);
        announce(api, refs, root, "已恢复确定性的初始网络。 ");
      });
    });
  }

  if (typeof window !== "undefined") {
    if (window.CourseLearning && typeof window.CourseLearning.register === "function") {
      registerLab();
    } else {
      window.addEventListener("courselearning-ready", registerLab, { once: true });
    }
  }
})();

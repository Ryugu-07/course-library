(function () {
  "use strict";

  var STYLE_ID = "cl-convolution-styles";
  var IMAGE_SIZE = 5;
  var KERNEL_SIZE = 3;
  var INITIAL_IMAGE = [
    [0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 1, 1, 1, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 0, 0, 0]
  ];
  var KERNELS = [
    {
      id: "edge",
      label: "边缘",
      note: "Sobel 竖直边缘：右侧更亮时响应为正",
      values: [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1]
      ]
    },
    {
      id: "blur",
      label: "模糊",
      note: "均值滤波：把 3×3 邻域平均",
      values: [
        [1 / 9, 1 / 9, 1 / 9],
        [1 / 9, 1 / 9, 1 / 9],
        [1 / 9, 1 / 9, 1 / 9]
      ]
    },
    {
      id: "sharpen",
      label: "锐化",
      note: "中心保留、邻居相减：强调局部变化",
      values: [
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0]
      ]
    }
  ];

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function cloneGrid(grid) {
    return grid.map(function (row) { return row.slice(); });
  }

  function kernelById(id) {
    for (var i = 0; i < KERNELS.length; i += 1) {
      if (KERNELS[i].id === id) return KERNELS[i];
    }
    return KERNELS[0];
  }

  function formatNumber(value, digits, api) {
    if (!finite(value)) return "—";
    if (api && typeof api.format === "function") {
      try {
        return api.format(value, digits);
      } catch (error) {
        // The host formatter is optional.
      }
    }
    var places = typeof digits === "number" ? digits : 3;
    var rounded = Math.abs(value) < Math.pow(10, -(places + 1)) ? 0 : value;
    var text = rounded.toFixed(places);
    return text.indexOf(".") === -1
      ? text
      : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function kernelText(value, api) {
    if (Math.abs(value - 1 / 9) < 1e-10) return "1/9";
    return formatNumber(value, 2, api);
  }

  function makeElement(tag, attrs, text) {
    var element = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (name) {
      if (attrs[name] !== undefined && attrs[name] !== null) {
        element.setAttribute(name, String(attrs[name]));
      }
    });
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function outputShape(state) {
    var rows = Math.floor((IMAGE_SIZE + 2 * state.padding - KERNEL_SIZE) / state.stride) + 1;
    var cols = rows;
    return { rows: rows, cols: cols };
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function clampPosition(state) {
    var shape = outputShape(state);
    state.row = clamp(state.row, 0, shape.rows - 1);
    state.col = clamp(state.col, 0, shape.cols - 1);
  }

  function imageValue(state, row, col) {
    if (row < 0 || row >= IMAGE_SIZE || col < 0 || col >= IMAGE_SIZE) return 0;
    return state.image[row][col];
  }

  function calculateAt(state, row, col) {
    var kernel = kernelById(state.kernel).values;
    var top = row * state.stride - state.padding;
    var left = col * state.stride - state.padding;
    var products = [];
    var sum = 0;
    for (var u = 0; u < KERNEL_SIZE; u += 1) {
      var productRow = [];
      for (var v = 0; v < KERNEL_SIZE; v += 1) {
        var pixel = imageValue(state, top + u, left + v);
        var product = pixel * kernel[u][v];
        productRow.push({
          row: top + u,
          col: left + v,
          pixel: pixel,
          kernel: kernel[u][v],
          product: product,
          padded: top + u < 0 || top + u >= IMAGE_SIZE || left + v < 0 || left + v >= IMAGE_SIZE
        });
        sum += product;
      }
      products.push(productRow);
    }
    return { top: top, left: left, products: products, sum: sum };
  }

  function calculateMap(state) {
    var shape = outputShape(state);
    var map = [];
    for (var row = 0; row < shape.rows; row += 1) {
      var outputRow = [];
      for (var col = 0; col < shape.cols; col += 1) {
        outputRow.push(calculateAt(state, row, col).sum);
      }
      map.push(outputRow);
    }
    return map;
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".cl-convolution { --cl-conv-bg: var(--bg, #faf6ee); --cl-conv-panel: var(--block-bg, #f5f0e3); --cl-conv-border: var(--border, #e0d7c4); --cl-conv-fg: var(--fg, #2c2a26); --cl-conv-soft: var(--fg-soft, #6b6557); --cl-conv-accent: var(--accent, #8a5a2b); --cl-conv-blue: #2d6f9f; --cl-conv-green: #39734d; --cl-conv-red: #a84235; margin: 1.5rem 0 2rem; padding: 0; border: 0; border-radius: 0; background: transparent; overflow: visible; color: var(--cl-conv-fg); font-size: .94rem; line-height: 1.5; }",
      ".cl-convolution * { box-sizing: border-box; }",
      ".cl-convolution .cl-conv-shell { overflow: visible; border: 0; border-radius: 0; background: transparent; }",
      ".cl-convolution .cl-conv-header { padding: 1.1rem 1.25rem .95rem; border-bottom: 1px solid var(--cl-conv-border); background: var(--cl-conv-panel); }",
      ".cl-convolution .cl-conv-kicker { margin: 0 0 .2rem; color: var(--cl-conv-accent); font-size: .75rem; font-weight: 800; letter-spacing: 0; text-transform: uppercase; }",
      ".cl-convolution h3, .cl-convolution h4 { color: var(--cl-conv-fg); }",
      ".cl-convolution .cl-conv-header h3 { margin: 0; font-size: 1.18rem; }",
      ".cl-convolution .cl-conv-header p { margin: .35rem 0 0; color: var(--cl-conv-soft); }",
      ".cl-convolution .cl-conv-controls { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(210px, .9fr) minmax(210px, .9fr); gap: .8rem; padding: .9rem 1.1rem; border-bottom: 1px solid var(--cl-conv-border); background: var(--cl-conv-panel); }",
      ".cl-convolution .cl-conv-fieldset { min-width: 0; margin: 0; padding: .65rem .7rem .7rem; border: 1px solid var(--cl-conv-border); border-radius: 6px; }",
      ".cl-convolution .cl-conv-fieldset legend { padding: 0 .25rem; color: var(--cl-conv-soft); font-size: .78rem; font-weight: 700; }",
      ".cl-convolution .cl-conv-kernel-buttons { display: flex; flex-wrap: wrap; gap: .45rem; }",
      ".cl-convolution button, .cl-convolution select { min-height: 44px; border: 1px solid var(--cl-conv-border); border-radius: 6px; background: var(--cl-conv-bg); color: var(--cl-conv-fg); font: inherit; }",
      ".cl-convolution button { padding: 8px 12px; cursor: pointer; }",
      ".cl-convolution button:hover { border-color: var(--cl-conv-accent); }",
      ".cl-convolution button:focus-visible, .cl-convolution select:focus-visible, .cl-convolution input:focus-visible { outline: 3px solid var(--cl-conv-blue); outline-offset: 2px; }",
      ".cl-convolution .cl-conv-kernel-button { flex: 1 1 6rem; color: var(--cl-conv-accent); font-size: .84rem; font-weight: 700; }",
      ".cl-convolution .cl-conv-kernel-button[aria-pressed=true], .cl-convolution .cl-conv-output-cell[aria-pressed=true] { border-color: var(--cl-conv-accent); background: var(--cl-conv-accent); color: var(--cl-conv-bg); }",
      ".cl-convolution .cl-conv-note { min-height: 2.5em; margin: .5rem 0 0; color: var(--cl-conv-soft); font-size: .76rem; }",
      ".cl-convolution .cl-conv-control { display: grid; grid-template-columns: 4.5rem minmax(0, 1fr) 3rem; gap: .45rem; align-items: center; margin: .15rem 0 .5rem; }",
      ".cl-convolution .cl-conv-control > span { color: var(--cl-conv-soft); font-size: .8rem; font-weight: 700; }",
      ".cl-convolution .cl-conv-control output { color: var(--cl-conv-accent); font: .84rem ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; text-align: right; }",
      ".cl-convolution input[type=range] { width: 100%; min-height: 44px; accent-color: var(--cl-conv-accent); }",
      ".cl-convolution select { width: 100%; padding: 7px 10px; }",
      ".cl-convolution .cl-conv-action-row { display: flex; flex-wrap: wrap; gap: .45rem; margin-top: .5rem; }",
      ".cl-convolution .cl-conv-action-row button { flex: 1 1 7rem; font-size: .8rem; }",
      ".cl-convolution .cl-conv-body { padding: 1rem; }",
      ".cl-convolution .cl-conv-workbench { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: .85rem; }",
      ".cl-convolution .cl-conv-card, .cl-convolution .cl-conv-output-card { min-width: 0; padding: .8rem; border: 1px solid var(--cl-conv-border); border-radius: 6px; background: var(--cl-conv-panel); }",
      ".cl-convolution .cl-conv-card h4, .cl-convolution .cl-conv-output-card h4 { margin: 0 0 .35rem; color: var(--cl-conv-accent); font-size: .92rem; }",
      ".cl-convolution .cl-conv-card > p { margin: .45rem 0; color: var(--cl-conv-soft); font-size: .78rem; }",
      ".cl-convolution .cl-conv-grid-wrap { max-width: 100%; overflow-x: auto; }",
      ".cl-convolution .cl-conv-grid { display: grid; grid-template-columns: repeat(var(--cl-conv-size), minmax(0, 1fr)); grid-auto-rows: 1fr; gap: 3px; width: min(100%, 320px); max-width: 100%; aspect-ratio: 1 / 1; }",
      ".cl-convolution .cl-conv-input-cell { width: 100%; height: 100%; min-height: 44px; padding: 0; border-color: var(--cl-conv-border); font: 700 1rem ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }",
      ".cl-convolution .cl-conv-input-cell.cl-conv-pixel-on { background: var(--cl-conv-blue); color: #fff; }",
      ".cl-convolution .cl-conv-input-cell.cl-conv-in-window { outline: 3px solid var(--cl-conv-accent); outline-offset: -3px; }",
      ".cl-convolution .cl-conv-receptive { min-height: 3.2em; margin: .7rem 0 .35rem; padding: .5rem .6rem; border-left: 3px solid var(--cl-conv-accent); background: var(--cl-conv-bg); color: var(--cl-conv-soft); font-size: .78rem; }",
      ".cl-convolution .cl-conv-reset { width: 100%; color: var(--cl-conv-accent); font-size: .8rem; }",
      ".cl-convolution .cl-conv-mini-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .7rem; }",
      ".cl-convolution .cl-conv-mini-title { margin: 0 0 .25rem; color: var(--cl-conv-soft); font-size: .74rem; font-weight: 700; }",
      ".cl-convolution .cl-conv-mini-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); grid-auto-rows: 1fr; gap: 3px; width: min(100%, 220px); aspect-ratio: 1 / 1; }",
      ".cl-convolution .cl-conv-mini-cell { display: flex; min-width: 0; min-height: 48px; align-items: center; justify-content: center; overflow-wrap: anywhere; padding: 2px; border: 1px solid var(--cl-conv-border); border-radius: 4px; background: var(--cl-conv-bg); color: var(--cl-conv-fg); text-align: center; font: .74rem ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }",
      ".cl-convolution .cl-conv-kernel-cell { color: var(--cl-conv-accent); font-weight: 700; }",
      ".cl-convolution .cl-conv-product-cell { font-size: .66rem; }",
      ".cl-convolution .cl-conv-product-cell.cl-conv-padding { border-style: dashed; color: var(--cl-conv-soft); }",
      ".cl-convolution .cl-conv-formula { min-height: 3.4em; margin: .75rem 0 0; padding: .6rem .7rem; border-left: 3px solid var(--cl-conv-accent); background: var(--cl-conv-bg); color: var(--cl-conv-fg); overflow-wrap: anywhere; font: .76rem/1.6 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }",
      ".cl-convolution .cl-conv-output-card { margin-top: .85rem; }",
      ".cl-convolution .cl-conv-output-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(190px, .8fr); gap: .8rem; align-items: start; }",
      ".cl-convolution .cl-conv-output-grid { width: min(100%, 320px); }",
      ".cl-convolution .cl-conv-output-cell { width: 100%; height: 100%; min-height: 44px; padding: 2px; border-color: var(--cl-conv-border); font: .75rem ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }",
      ".cl-convolution .cl-conv-output-cell.cl-conv-positive { background: #e3f0e6; color: #174f2b; }",
      ".cl-convolution .cl-conv-output-cell.cl-conv-negative { background: #f4e1df; color: #7d251e; }",
      ".cl-convolution .cl-conv-output-cell.cl-conv-zero { background: var(--cl-conv-bg); color: var(--cl-conv-soft); }",
      ".cl-convolution .cl-conv-output-cell[aria-pressed=true] { outline: 3px solid var(--cl-conv-accent); outline-offset: -3px; }",
      ".cl-convolution .cl-conv-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .5rem; }",
      ".cl-convolution .cl-conv-metric { min-width: 0; padding: .55rem; border-top: 2px solid var(--cl-conv-border); background: var(--cl-conv-bg); }",
      ".cl-convolution .cl-conv-metric span { display: block; color: var(--cl-conv-soft); font-size: .69rem; }",
      ".cl-convolution .cl-conv-metric strong { display: block; margin-top: .2rem; overflow-wrap: anywhere; color: var(--cl-conv-fg); font: .8rem ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }",
      ".cl-convolution .cl-conv-announce { min-height: 1.3em; margin: .7rem 0 0; color: var(--cl-conv-soft); font-size: .76rem; }",
      "@media (max-width: 900px) { .cl-convolution .cl-conv-controls { grid-template-columns: repeat(2, minmax(0, 1fr)); } .cl-convolution .cl-conv-workbench { grid-template-columns: 1fr; } }",
      "@media (max-width: 600px) { .cl-convolution .cl-conv-controls { grid-template-columns: 1fr; padding: .75rem; } .cl-convolution .cl-conv-body { padding: .75rem; } .cl-convolution .cl-conv-output-layout, .cl-convolution .cl-conv-mini-row { grid-template-columns: 1fr; } .cl-convolution .cl-conv-grid, .cl-convolution .cl-conv-output-grid { width: min(100%, 300px); } .cl-convolution .cl-conv-metrics { grid-template-columns: 1fr; } }"
    ].join("\n");
    (document.head || document.documentElement).appendChild(style);
  }

  function buildInterface(root) {
    root.innerHTML = [
      '<div class="cl-conv-shell">',
      '  <header class="cl-conv-header">',
      '    <p class="cl-conv-kicker">cross-correlation · shared weights · receptive field · bias = 0</p>',
      '    <h3>移动一个 3×3 窗口，追踪它看到的证据</h3>',
      '    <p>点击输入网格中的像素可切换 0/1；选择一个核，改步长或填充，再用上一格、下一格或输出格子移动窗口。</p>',
      '  </header>',
      '  <div class="cl-conv-controls">',
      '    <fieldset class="cl-conv-fieldset">',
      '      <legend>选择卷积核</legend>',
      '      <div class="cl-conv-kernel-buttons" data-cl-conv-kernels></div>',
      '      <p class="cl-conv-note" data-cl-conv-kernel-note></p>',
      '    </fieldset>',
      '    <fieldset class="cl-conv-fieldset">',
      '      <legend>步长与填充</legend>',
      '      <label class="cl-conv-control"><span>步长</span><select data-cl-conv-stride aria-label="选择步长"><option value="1">1：每格移动</option><option value="2">2：跳格移动</option></select><output data-cl-conv-stride-value>1</output></label>',
      '      <label class="cl-conv-control"><span>填充</span><select data-cl-conv-padding aria-label="选择填充像素数"><option value="0">0：valid</option><option value="1">1：边界补 0</option></select><output data-cl-conv-padding-value>0</output></label>',
      '      <p class="cl-conv-note" data-cl-conv-shape-note></p>',
      '    </fieldset>',
      '    <fieldset class="cl-conv-fieldset">',
      '      <legend>移动窗口</legend>',
      '      <label class="cl-conv-control"><span>输出行（从 0 开始）</span><input type="range" min="0" max="2" value="1" step="1" data-cl-conv-row aria-label="选择输出行，从 0 开始"><output data-cl-conv-row-value>1</output></label>',
      '      <label class="cl-conv-control"><span>输出列（从 0 开始）</span><input type="range" min="0" max="2" value="0" step="1" data-cl-conv-col aria-label="选择输出列，从 0 开始"><output data-cl-conv-col-value>0</output></label>',
      '      <div class="cl-conv-action-row"><button type="button" data-cl-conv-prev>上一窗口</button><button type="button" data-cl-conv-next>下一窗口</button><button type="button" data-cl-conv-scan aria-pressed="false">自动扫描</button></div>',
      '    </fieldset>',
      '  </div>',
      '  <div class="cl-conv-body">',
      '    <div class="cl-conv-workbench">',
      '      <section class="cl-conv-card" aria-labelledby="cl-conv-input-title">',
      '        <h4 id="cl-conv-input-title">输入图像 X · 5×5</h4>',
      '        <p>橙色边框是当前输出位置的感受野；蓝色像素值为 1。点击格子编辑这个玩具输入。</p>',
      '        <div class="cl-conv-grid-wrap"><div class="cl-conv-grid" data-cl-conv-input-grid role="grid" aria-label="5乘5输入像素网格"></div></div>',
      '        <p class="cl-conv-receptive" data-cl-conv-receptive aria-live="polite"></p>',
      '        <button type="button" class="cl-conv-reset" data-cl-conv-reset>恢复示例图像</button>',
      '      </section>',
      '      <section class="cl-conv-card" aria-labelledby="cl-conv-window-title">',
      '        <h4 id="cl-conv-window-title">当前窗口：逐元素乘加</h4>',
      '        <div class="cl-conv-mini-row">',
      '          <div><p class="cl-conv-mini-title">核 K（不翻转）</p><div class="cl-conv-mini-grid" data-cl-conv-kernel-grid role="grid" aria-label="当前卷积核"></div></div>',
      '          <div><p class="cl-conv-mini-title">窗口 × 核 = 乘积</p><div class="cl-conv-mini-grid" data-cl-conv-product-grid role="grid" aria-label="窗口与卷积核逐元素乘积"></div></div>',
      '        </div>',
      '        <p class="cl-conv-formula" data-cl-conv-formula aria-live="polite"></p>',
      '      </section>',
      '    </div>',
      '    <section class="cl-conv-output-card" aria-labelledby="cl-conv-output-title">',
      '      <h4 id="cl-conv-output-title">输出特征图 Y · 点击一个格子定位窗口</h4>',
      '      <div class="cl-conv-output-layout">',
      '        <div class="cl-conv-grid-wrap"><div class="cl-conv-grid cl-conv-output-grid" data-cl-conv-output-grid role="grid" aria-label="输出特征图"></div></div>',
      '        <div class="cl-conv-metrics">',
      '          <div class="cl-conv-metric"><span>当前输出</span><strong data-cl-conv-output-value></strong></div>',
      '          <div class="cl-conv-metric"><span>输出形状</span><strong data-cl-conv-output-shape></strong></div>',
      '          <div class="cl-conv-metric"><span>窗口左上角（零基输入索引）</span><strong data-cl-conv-top-left></strong></div>',
      '        </div>',
      '      </div>',
      '      <p class="cl-conv-announce" data-cl-conv-announce aria-live="polite"></p>',
      '    </section>',
      '  </div>',
      '</div>'
    ].join("");
    return {
      kernelButtons: Array.prototype.slice.call(root.querySelectorAll("[data-cl-conv-kernel]")),
      kernelContainer: root.querySelector("[data-cl-conv-kernels]"),
      kernelNote: root.querySelector("[data-cl-conv-kernel-note]"),
      stride: root.querySelector("[data-cl-conv-stride]"),
      strideValue: root.querySelector("[data-cl-conv-stride-value]"),
      padding: root.querySelector("[data-cl-conv-padding]"),
      paddingValue: root.querySelector("[data-cl-conv-padding-value]"),
      shapeNote: root.querySelector("[data-cl-conv-shape-note]"),
      row: root.querySelector("[data-cl-conv-row]"),
      rowValue: root.querySelector("[data-cl-conv-row-value]"),
      col: root.querySelector("[data-cl-conv-col]"),
      colValue: root.querySelector("[data-cl-conv-col-value]"),
      previous: root.querySelector("[data-cl-conv-prev]"),
      next: root.querySelector("[data-cl-conv-next]"),
      scan: root.querySelector("[data-cl-conv-scan]"),
      inputGrid: root.querySelector("[data-cl-conv-input-grid]"),
      receptive: root.querySelector("[data-cl-conv-receptive]"),
      reset: root.querySelector("[data-cl-conv-reset]"),
      kernelGrid: root.querySelector("[data-cl-conv-kernel-grid]"),
      productGrid: root.querySelector("[data-cl-conv-product-grid]"),
      formula: root.querySelector("[data-cl-conv-formula]"),
      outputGrid: root.querySelector("[data-cl-conv-output-grid]"),
      outputValue: root.querySelector("[data-cl-conv-output-value]"),
      outputShape: root.querySelector("[data-cl-conv-output-shape]"),
      topLeft: root.querySelector("[data-cl-conv-top-left]"),
      announce: root.querySelector("[data-cl-conv-announce]")
    };
  }

  function setGridSize(element, size) {
    element.style.setProperty("--cl-conv-size", String(size));
  }

  function renderInput(refs, state) {
    setGridSize(refs.inputGrid, IMAGE_SIZE);
    refs.inputGrid.innerHTML = "";
    var calculation = calculateAt(state, state.row, state.col);
    for (var row = 0; row < IMAGE_SIZE; row += 1) {
      for (var col = 0; col < IMAGE_SIZE; col += 1) {
        var inWindow = row >= calculation.top && row < calculation.top + KERNEL_SIZE
          && col >= calculation.left && col < calculation.left + KERNEL_SIZE;
        var value = state.image[row][col];
        var button = makeElement("button", {
          type: "button",
          "aria-pressed": value ? "true" : "false",
          "aria-label": "输入像素，第" + (row + 1) + "行第" + (col + 1) + "列，当前值 " + value + "。点击切换"
        }, String(value));
        button.className = "cl-conv-input-cell" + (value ? " cl-conv-pixel-on" : "") + (inWindow ? " cl-conv-in-window" : "");
        button.setAttribute("data-cl-conv-pixel-row", String(row));
        button.setAttribute("data-cl-conv-pixel-col", String(col));
        (function (inputRow, inputCol) {
          button.addEventListener("click", function () {
            state.image[inputRow][inputCol] = state.image[inputRow][inputCol] ? 0 : 1;
            update(refs, state, state.api);
            announce(refs, state, "已切换输入像素，零基坐标 (" + inputRow + ", " + inputCol + ")。");
          });
        }(row, col));
        refs.inputGrid.appendChild(button);
      }
    }
  }

  function renderKernel(refs, state, api) {
    var selected = kernelById(state.kernel);
    refs.kernelContainer.innerHTML = "";
    KERNELS.forEach(function (kernel) {
      var button = makeElement("button", {
        type: "button",
        "aria-pressed": kernel.id === state.kernel ? "true" : "false",
        "aria-label": "选择" + kernel.label + "卷积核"
      }, kernel.label);
      button.className = "cl-conv-kernel-button";
      button.setAttribute("data-cl-conv-kernel", kernel.id);
      button.addEventListener("click", function () {
        state.kernel = kernel.id;
        update(refs, state, api);
        announce(refs, state, "已选择" + kernel.label + "核；观察同一感受野的逐项乘加如何改变。");
      });
      refs.kernelContainer.appendChild(button);
    });
    refs.kernelNote.textContent = selected.note + "；实验使用互相关，不翻转 K。";
    refs.kernelGrid.innerHTML = "";
    setGridSize(refs.kernelGrid, KERNEL_SIZE);
    selected.values.forEach(function (row, rowIndex) {
      row.forEach(function (value, colIndex) {
        var cell = makeElement("div", {
          role: "gridcell",
          "aria-label": "核第" + (rowIndex + 1) + "行第" + (colIndex + 1) + "列：" + kernelText(value, api)
        }, kernelText(value, api));
        cell.className = "cl-conv-mini-cell cl-conv-kernel-cell";
        refs.kernelGrid.appendChild(cell);
      });
    });
  }

  function renderControls(refs, state) {
    var shape = outputShape(state);
    clampPosition(state);
    refs.stride.value = String(state.stride);
    refs.strideValue.textContent = String(state.stride);
    refs.padding.value = String(state.padding);
    refs.paddingValue.textContent = String(state.padding);
    refs.row.max = String(shape.rows - 1);
    refs.col.max = String(shape.cols - 1);
    refs.row.value = String(state.row);
    refs.col.value = String(state.col);
    refs.rowValue.textContent = String(state.row);
    refs.colValue.textContent = String(state.col);
    refs.shapeNote.textContent = "输出尺寸 " + shape.rows + "×" + shape.cols + "；floor((5 + 2×" + state.padding + " − 3) / " + state.stride + ") + 1。";
  }

  function renderProducts(refs, state, api, calculation) {
    var kernel = kernelById(state.kernel).values;
    refs.productGrid.innerHTML = "";
    setGridSize(refs.productGrid, KERNEL_SIZE);
    calculation.products.forEach(function (row, rowIndex) {
      row.forEach(function (term, colIndex) {
        var text = formatNumber(term.pixel, 0, api) + "×" + kernelText(kernel[rowIndex][colIndex], api) + "=" + formatNumber(term.product, 3, api);
        var cell = makeElement("div", {
          role: "gridcell",
          "aria-label": "窗口第" + (rowIndex + 1) + "行第" + (colIndex + 1) + "项：" + formatNumber(term.pixel, 0, api) + "乘以 " + kernelText(term.kernel, api) + " 等于 " + formatNumber(term.product, 3, api)
        }, text);
        cell.className = "cl-conv-mini-cell cl-conv-product-cell" + (term.padded ? " cl-conv-padding" : "");
        refs.productGrid.appendChild(cell);
      });
    });
  }

  function renderWindow(refs, state, api) {
    var calculation = calculateAt(state, state.row, state.col);
    var kernel = kernelById(state.kernel).values;
    var terms = [];
    var realCount = 0;
    calculation.products.forEach(function (row) {
      row.forEach(function (term) {
        if (!term.padded) realCount += 1;
        terms.push("(" + formatNumber(term.pixel, 0, api) + ")×(" + kernelText(term.kernel, api) + ")");
      });
    });
    renderProducts(refs, state, api, calculation);
    refs.formula.textContent = "逐元素乘加：" + terms.join(" + ") + " = " + formatNumber(calculation.sum, 3, api);
    refs.receptive.textContent = "感受野：输出坐标 (" + state.row + ", " + state.col + ") 读取零基输入/填充坐标行 "
      + calculation.top + "…" + (calculation.top + KERNEL_SIZE - 1)
      + "、列 " + calculation.left + "…" + (calculation.left + KERNEL_SIZE - 1)
      + "；9 格中 " + realCount + " 格是真实像素，" + (KERNEL_SIZE * KERNEL_SIZE - realCount) + " 格是填充 0。";
    refs.outputValue.textContent = formatNumber(calculation.sum, 3, api);
    refs.topLeft.textContent = "(" + calculation.top + ", " + calculation.left + ")";
  }

  function renderOutput(refs, state, api) {
    var shape = outputShape(state);
    var map = calculateMap(state);
    refs.outputGrid.innerHTML = "";
    setGridSize(refs.outputGrid, shape.rows);
    for (var row = 0; row < shape.rows; row += 1) {
      for (var col = 0; col < shape.cols; col += 1) {
        var value = map[row][col];
        var selected = row === state.row && col === state.col;
        var tone = value > 0.0005 ? " cl-conv-positive" : (value < -0.0005 ? " cl-conv-negative" : " cl-conv-zero");
        var button = makeElement("button", {
          type: "button",
          "aria-pressed": selected ? "true" : "false",
          "aria-label": "输出特征图，第" + (row + 1) + "行第" + (col + 1) + "列，值 " + formatNumber(value, 3, api)
        }, formatNumber(value, 3, api));
        button.className = "cl-conv-output-cell" + tone;
        (function (outputRow, outputCol) {
          button.addEventListener("click", function () {
            state.row = outputRow;
            state.col = outputCol;
            update(refs, state, state.api);
            announce(refs, state, "已定位到输出零基坐标 (" + outputRow + ", " + outputCol + ")。");
          });
        }(row, col));
        refs.outputGrid.appendChild(button);
      }
    }
    refs.outputShape.textContent = shape.rows + "×" + shape.cols;
  }

  function update(refs, state, api) {
    clampPosition(state);
    renderControls(refs, state);
    renderInput(refs, state);
    renderKernel(refs, state, api);
    renderWindow(refs, state, api);
    renderOutput(refs, state, api);
  }

  function announce(refs, state, message) {
    refs.announce.textContent = message;
    if (state && state.api && typeof state.api.announce === "function") {
      state.api.announce(state.root, message);
    }
  }

  function registerLab() {
    if (!window.CourseLearning || typeof window.CourseLearning.register !== "function") return;
    window.CourseLearning.register("convolution", function (root, api) {
      if (!root || !root.querySelector || typeof document === "undefined") return;
      root.classList.add("cl-convolution");
      installStyles();
      var state = {
        api: api,
        root: root,
        kernel: "edge",
        stride: 1,
        padding: 0,
        row: 1,
        col: 0,
        image: cloneGrid(INITIAL_IMAGE)
      };
      var refs = buildInterface(root);
      var scanTimer = null;

      function announceWithApi(message) {
        refs.announce.textContent = message;
        if (api && typeof api.announce === "function") api.announce(root, message);
      }

      function nextPosition(delta) {
        var shape = outputShape(state);
        var total = shape.rows * shape.cols;
        var current = state.row * shape.cols + state.col;
        var next = (current + delta + total) % total;
        state.row = Math.floor(next / shape.cols);
        state.col = next % shape.cols;
        update(refs, state, api);
      }

      function stopScanning() {
        if (scanTimer !== null) {
          window.clearInterval(scanTimer);
          scanTimer = null;
        }
        refs.scan.setAttribute("aria-pressed", "false");
        refs.scan.textContent = "自动扫描";
      }

      refs.stride.addEventListener("change", function () {
        stopScanning();
        state.stride = Number(refs.stride.value) || 1;
        clampPosition(state);
        update(refs, state, api);
        announceWithApi("步长已改为 " + state.stride + "；窗口会跳过相邻位置。");
      });
      refs.padding.addEventListener("change", function () {
        stopScanning();
        state.padding = Number(refs.padding.value) || 0;
        clampPosition(state);
        update(refs, state, api);
        announceWithApi("填充已改为 " + state.padding + "；越界格子按 0 参与计算。");
      });
      refs.row.addEventListener("input", function () {
        state.row = Number(refs.row.value) || 0;
        update(refs, state, api);
      });
      refs.col.addEventListener("input", function () {
        state.col = Number(refs.col.value) || 0;
        update(refs, state, api);
      });
      refs.previous.addEventListener("click", function () {
        nextPosition(-1);
        announceWithApi("窗口向前移动一格。");
      });
      refs.next.addEventListener("click", function () {
        nextPosition(1);
        announceWithApi("窗口向后移动一格。");
      });
      refs.scan.addEventListener("click", function () {
        if (scanTimer !== null) {
          stopScanning();
          announceWithApi("自动扫描已停止。");
          return;
        }
        refs.scan.setAttribute("aria-pressed", "true");
        refs.scan.textContent = "停止扫描";
        scanTimer = window.setInterval(function () {
          nextPosition(1);
        }, 900);
        announceWithApi("自动扫描已开始；每 0.9 秒移动到下一窗口。");
      });
      refs.reset.addEventListener("click", function () {
        stopScanning();
        state.image = cloneGrid(INITIAL_IMAGE);
        update(refs, state, api);
        announceWithApi("已恢复 5×5 示例图像。");
      });

      update(refs, state, api);
    });
  }

  if (typeof window !== "undefined") {
    if (window.CourseLearning && typeof window.CourseLearning.register === "function") {
      registerLab();
    } else {
      window.addEventListener("courselearning-ready", registerLab, { once: true });
    }
  }
}());

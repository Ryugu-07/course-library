(function (root, factory) {
  "use strict";
  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("cs-csapp-04-vm-malloc", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("cs-csapp-04-vm-malloc self-test: PASS (" + report.checks + " checks)");
    } catch (error) {
      console.error("cs-csapp-04-vm-malloc self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (host) {
  "use strict";

  var NAME = "cs-csapp-04-vm-malloc";
  var PAGE_SIZE = 0x1000;
  var PAGE_TABLE = { 0: 1, 1: 5, 2: 2, 3: 7 };

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function translate(address, pageSize, pageTable) {
    var value = Number(address);
    var size = Number(pageSize);
    var page = Math.floor(value / size);
    var offset = value % size;
    var frame = pageTable[page];
    return { address: value, page: page, offset: offset, frame: frame === undefined ? null : frame, fault: frame === undefined, physical: frame === undefined ? null : frame * size + offset };
  }

  function initialHeap() {
    return [
      { start: 0, size: 16, free: true },
      { start: 16, size: 24, free: false },
      { start: 40, size: 24, free: true },
      { start: 64, size: 32, free: false }
    ];
  }

  function cloneHeap(blocks) {
    return blocks.map(function (block) { return { start: block.start, size: block.size, free: block.free }; });
  }

  function allocate(blocks, size) {
    var result = cloneHeap(blocks);
    for (var index = 0; index < result.length; index += 1) {
      var block = result[index];
      if (!block.free || block.size < size) continue;
      if (block.size === size) {
        block.free = false;
        return { blocks: result, start: block.start, size: size, split: 0 };
      }
      result.splice(index, 1, { start: block.start, size: size, free: false }, { start: block.start + size, size: block.size - size, free: true });
      return { blocks: result, start: block.start, size: size, split: block.size - size };
    }
    return { blocks: result, start: null, size: size, split: 0 };
  }

  function freeAt(blocks, start) {
    var result = cloneHeap(blocks);
    var found = false;
    result.forEach(function (block) {
      if (block.start === Number(start)) {
        block.free = true;
        found = true;
      }
    });
    if (!found) return result;
    return coalesce(result);
  }

  function coalesce(blocks) {
    var result = [];
    cloneHeap(blocks).forEach(function (block) {
      var previous = result[result.length - 1];
      if (previous && previous.free && block.free && previous.start + previous.size === block.start) {
        previous.size += block.size;
      } else {
        result.push(block);
      }
    });
    return result;
  }

  function heapStats(blocks) {
    return {
      total: blocks.reduce(function (sum, block) { return sum + block.size; }, 0),
      free: blocks.filter(function (block) { return block.free; }).reduce(function (sum, block) { return sum + block.size; }, 0),
      largestFree: blocks.filter(function (block) { return block.free; }).reduce(function (maximum, block) { return Math.max(maximum, block.size); }, 0)
    };
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "text") node.textContent = attrs[key];
      else if (key === "className") node.className = attrs[key];
      else if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key]));
    });
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (attrs[key] !== undefined && attrs[key] !== null) node.setAttribute(key, String(attrs[key]));
    });
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child !== undefined && child !== null) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function hex(value) {
    return "0x" + Number(value).toString(16).toUpperCase();
  }

  function renderVm(doc, data) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 560 250", role: "img", "aria-label": "虚拟地址到物理地址翻译" });
    svg.appendChild(svgElement(doc, "rect", { x: 16, y: 75, width: 165, height: 70, rx: 5, fill: "var(--cav-blue)" }));
    svg.appendChild(svgElement(doc, "rect", { x: 198, y: 75, width: 165, height: 70, rx: 5, fill: "var(--cav-gold)" }));
    svg.appendChild(svgElement(doc, "rect", { x: 380, y: 75, width: 165, height: 70, rx: 5, fill: data.fault ? "var(--cav-red)" : "var(--cav-green)" }));
    svg.appendChild(svgElement(doc, "text", { x: 98, y: 105, class: "cav-label", fill: "#fff" }, "VA " + hex(data.address)));
    svg.appendChild(svgElement(doc, "text", { x: 98, y: 128, class: "cav-small-light" }, "页 " + data.page + " / 偏移 " + hex(data.offset)));
    svg.appendChild(svgElement(doc, "text", { x: 280, y: 105, class: "cav-label", fill: "#fff" }, data.fault ? "页表未命中" : "页 " + data.page + " → 帧 " + data.frame));
    svg.appendChild(svgElement(doc, "text", { x: 462, y: 105, class: "cav-label", fill: "#fff" }, data.fault ? "page fault" : "PA " + hex(data.physical)));
    svg.appendChild(svgElement(doc, "line", { x1: 181, y1: 110, x2: 198, y2: 110, stroke: "currentColor", "marker-end": "url(#cav-arrow)" }));
    svg.appendChild(svgElement(doc, "line", { x1: 363, y1: 110, x2: 380, y2: 110, stroke: "currentColor", "marker-end": "url(#cav-arrow)" }));
    svg.appendChild(svgElement(doc, "text", { x: 12, y: 28, class: "cav-small" }, "页大小 " + hex(PAGE_SIZE) + "；页内偏移始终保留；TLB 只缓存这条翻译"));
    svg.appendChild(svgElement(doc, "text", { x: 12, y: 205, class: "cav-small" }, data.fault ? "缺页：内核装入/建立映射后重试指令" : "页表项存在：物理地址 = 帧 × 页大小 + 偏移"));
    var marker = svgElement(doc, "marker", { id: "cav-arrow", markerWidth: 7, markerHeight: 7, refX: 6, refY: 3.5, orient: "auto" });
    marker.appendChild(svgElement(doc, "path", { d: "M0,0 L7,3.5 L0,7 z", fill: "currentColor" }));
    svg.insertBefore(svgElement(doc, "defs", {}, marker), svg.firstChild);
    return svg;
  }

  function renderHeap(doc, blocks, message) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 560 245", role: "img", "aria-label": "malloc 空闲块与合并" });
    var scale = 500 / 96;
    blocks.forEach(function (block) {
      var x = 24 + block.start * scale;
      var width = Math.max(2, block.size * scale);
      svg.appendChild(svgElement(doc, "rect", { x: x, y: 78, width: width, height: 54, fill: block.free ? "var(--cav-green)" : "var(--cav-blue)", stroke: "var(--bg)" }));
      svg.appendChild(svgElement(doc, "text", { x: x + width / 2, y: 101, class: "cav-label", fill: "#fff" }, block.free ? "free" : "used"));
      svg.appendChild(svgElement(doc, "text", { x: x + width / 2, y: 120, class: "cav-small-light", "text-anchor": "middle" }, block.start + "+" + block.size));
    });
    svg.appendChild(svgElement(doc, "line", { x1: 24, y1: 150, x2: 524, y2: 150, stroke: "currentColor" }));
    svg.appendChild(svgElement(doc, "text", { x: 24, y: 175, class: "cav-small" }, "堆地址 0"));
    svg.appendChild(svgElement(doc, "text", { x: 500, y: 175, class: "cav-small" }, "96"));
    svg.appendChild(svgElement(doc, "text", { x: 12, y: 28, class: "cav-small" }, message));
    return svg;
  }

  function installStyles(doc) {
    var styleId = "cl-" + NAME + "-styles";
    if (doc.getElementById(styleId)) return;
    var style = doc.createElement("style");
    style.id = styleId;
    style.textContent =
      '[data-learning-lab="' + NAME + '"]{--cav-blue:#315f9d;--cav-gold:#a36a16;--cav-green:#39734d;--cav-red:#b64335;display:block;max-width:100%;color:var(--fg,currentColor);line-height:1.55;overflow-wrap:anywhere}' +
      '[data-learning-lab="' + NAME + '"] *{box-sizing:border-box}[data-learning-lab="' + NAME + '"] h3,[data-learning-lab="' + NAME + '"] h4{margin:0;letter-spacing:0}' +
      '[data-learning-lab="' + NAME + '"] p{margin:8px 0}[data-learning-lab="' + NAME + '"] fieldset{border:0;min-width:0;margin:0;padding:0}[data-learning-lab="' + NAME + '"] legend{font-weight:750;margin-bottom:8px}' +
      '[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select,[data-learning-lab="' + NAME + '"] input{min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg,transparent);color:inherit;font:inherit;cursor:pointer}' +
      '[data-learning-lab="' + NAME + '"] button:hover,[data-learning-lab="' + NAME + '"] button:focus-visible,[data-learning-lab="' + NAME + '"] select:focus-visible,[data-learning-lab="' + NAME + '"] input:focus-visible{border-color:var(--accent);outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}' +
      '[data-learning-lab="' + NAME + '"] button[aria-pressed="true"],[data-learning-lab="' + NAME + '"] .cav-primary{background:var(--cav-blue);border-color:var(--cav-blue);color:#fff;font-weight:750}' +
      '[data-learning-lab="' + NAME + '"] .cav-choices,[data-learning-lab="' + NAME + '"] .cav-actions{display:flex;flex-wrap:wrap;gap:8px}[data-learning-lab="' + NAME + '"] .cav-actions{margin-top:12px}' +
      '[data-learning-lab="' + NAME + '"] .cav-feedback,[data-learning-lab="' + NAME + '"] .cav-note{min-height:2em;color:var(--fg-soft);font-size:13px}' +
      '[data-learning-lab="' + NAME + '"] .cav-revealed[hidden]{display:none}[data-learning-lab="' + NAME + '"] .cav-layout{display:grid;grid-template-columns:minmax(200px,.55fr) minmax(0,1.45fr);gap:16px;align-items:start;margin-top:16px}' +
      '[data-learning-lab="' + NAME + '"] .cav-controls{display:grid;gap:10px;padding:12px;border:1px solid var(--border);border-radius:7px}[data-learning-lab="' + NAME + '"] .cav-control{display:grid;gap:5px}[data-learning-lab="' + NAME + '"] .cav-control label{font-size:13px;font-weight:700;color:var(--fg-soft)}[data-learning-lab="' + NAME + '"] input[type=range]{width:100%;accent-color:var(--cav-blue)}' +
      '[data-learning-lab="' + NAME + '"] .cav-stage{min-width:0;padding:8px;border:1px solid var(--border);border-radius:7px;overflow:hidden}[data-learning-lab="' + NAME + '"] svg{display:block;width:100%;height:auto}[data-learning-lab="' + NAME + '"] .cav-label{font-size:13px;font-weight:750;text-anchor:middle;dominant-baseline:middle}[data-learning-lab="' + NAME + '"] .cav-small{font-size:11px;fill:var(--fg-soft)!important}[data-learning-lab="' + NAME + '"] .cav-small-light{font-size:10px;fill:#fff!important;text-anchor:middle}' +
      '[data-learning-lab="' + NAME + '"] .cav-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0}[data-learning-lab="' + NAME + '"] .cav-metric{padding:8px;border-top:2px solid var(--cav-blue)}[data-learning-lab="' + NAME + '"] .cav-metric span{display:block;color:var(--fg-soft);font-size:12px}[data-learning-lab="' + NAME + '"] .cav-metric strong{display:block;font-variant-numeric:tabular-nums}' +
      '[data-learning-lab="' + NAME + '"] table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}[data-learning-lab="' + NAME + '"] th,[data-learning-lab="' + NAME + '"] td{padding:6px;border-bottom:1px solid var(--border);text-align:left}' +
      '@media(max-width:760px){[data-learning-lab="' + NAME + '"] .cav-layout{grid-template-columns:1fr}}@media(max-width:520px){[data-learning-lab="' + NAME + '"] .cav-choices,[data-learning-lab="' + NAME + '"] .cav-actions{display:grid;grid-template-columns:1fr}[data-learning-lab="' + NAME + '"] button,[data-learning-lab="' + NAME + '"] select{width:100%}}';
    doc.head.appendChild(style);
  }

  function mount(root, api) {
    var doc = root.ownerDocument;
    installStyles(doc);
    root.replaceChildren();
    var shell = element(doc, "div", {});
    shell.appendChild(element(doc, "h3", { text: "虚拟页与堆块：两种间接层的状态机" }));
    shell.appendChild(element(doc, "p", { className: "cav-note", text: "先预测页内偏移和外部碎片，揭示后在地址翻译与 malloc 块账之间切换。" }));
    var form = element(doc, "form", {});
    var fieldset = element(doc, "fieldset");
    fieldset.appendChild(element(doc, "legend", { text: "预测门" }));
    var answers = { offset: null, fragment: null };
    var groupItems = [];
    function question(key, prompt, choices) {
      fieldset.appendChild(element(doc, "p", { className: "cav-question", text: prompt }));
      var row = element(doc, "div", { className: "cav-choices", role: "group", "aria-label": prompt });
      choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false", text: choice[1] });
        button.addEventListener("click", function () {
          answers[key] = choice[0];
          groupItems.forEach(function (item) { item.node.setAttribute("aria-pressed", answers[item.key] === item.value ? "true" : "false"); });
        });
        groupItems.push({ key: key, value: choice[0], node: button });
        row.appendChild(button);
      });
      fieldset.appendChild(row);
    }
    question("offset", "页表改变页号后，哪个部分不变？", [["page", "页号"], ["offset", "页内偏移"], ["frame", "物理帧号"]]);
    question("fragment", "空闲总量够但最大连续块不够，属于？", [["leak", "泄漏"], ["external", "外部碎片"], ["tlb", "TLB miss"]]);
    form.appendChild(fieldset);
    form.appendChild(element(doc, "div", { className: "cav-actions" }, [element(doc, "button", { type: "submit", className: "cav-primary", text: "提交预测并揭示" })]));
    var feedback = element(doc, "p", { className: "cav-feedback", role: "status", "aria-live": "polite", text: "请完成两项预测。" });
    form.appendChild(feedback);
    shell.appendChild(form);

    var revealed = element(doc, "section", { className: "cav-revealed", hidden: "hidden" });
    var modeActions = element(doc, "div", { className: "cav-actions" });
    var vmMode = element(doc, "button", { type: "button", "aria-pressed": "true", text: "地址翻译" });
    var heapMode = element(doc, "button", { type: "button", "aria-pressed": "false", text: "堆块管理" });
    modeActions.appendChild(vmMode);
    modeActions.appendChild(heapMode);
    revealed.appendChild(modeActions);
    var layoutShell = element(doc, "div", { className: "cav-layout" });
    var controls = element(doc, "div", { className: "cav-controls" });
    var addressInput = element(doc, "input", { type: "range", min: "4096", max: "16383", value: "4660", step: "4" });
    var addressOutput = element(doc, "output", { text: hex(4660) });
    controls.appendChild(element(doc, "div", { className: "cav-control" }, [element(doc, "label", {}, ["虚拟地址 ", addressOutput]), addressInput]));
    var allocateButton = element(doc, "button", { type: "button", className: "cav-primary", text: "malloc(20)" });
    var freeButton = element(doc, "button", { type: "button", text: "free(16)" });
    var heapReset = element(doc, "button", { type: "button", text: "重置堆" });
    var heapActions = element(doc, "div", { className: "cav-actions" });
    heapActions.appendChild(allocateButton);
    heapActions.appendChild(freeButton);
    heapActions.appendChild(heapReset);
    controls.appendChild(heapActions);
    layoutShell.appendChild(controls);
    var stage = element(doc, "div", { className: "cav-stage" });
    layoutShell.appendChild(stage);
    revealed.appendChild(layoutShell);
    var metrics = element(doc, "div", { className: "cav-metrics" });
    var firstMetric = element(doc, "div", { className: "cav-metric" });
    var secondMetric = element(doc, "div", { className: "cav-metric" });
    var thirdMetric = element(doc, "div", { className: "cav-metric" });
    metrics.appendChild(firstMetric);
    metrics.appendChild(secondMetric);
    metrics.appendChild(thirdMetric);
    revealed.appendChild(metrics);
    var table = element(doc, "table", { "aria-label": "虚拟内存与堆块账本" });
    table.innerHTML = "<thead><tr><th>对象</th><th>状态</th><th>不变量</th></tr></thead><tbody></tbody>";
    revealed.appendChild(table);
    var note = element(doc, "p", { className: "cav-note" });
    revealed.appendChild(note);
    shell.appendChild(revealed);
    root.appendChild(shell);

    var mode = "vm";
    var heap = initialHeap();
    function render() {
      var address = Number(addressInput.value);
      var data = translate(address, PAGE_SIZE, PAGE_TABLE);
      var stats = heapStats(heap);
      vmMode.setAttribute("aria-pressed", mode === "vm" ? "true" : "false");
      heapMode.setAttribute("aria-pressed", mode === "heap" ? "true" : "false");
      addressInput.disabled = mode !== "vm";
      allocateButton.disabled = mode !== "heap";
      freeButton.disabled = mode !== "heap";
      stage.replaceChildren(mode === "vm" ? renderVm(doc, data) : renderHeap(doc, heap, "绿色 free；蓝色 used；first-fit 从低地址寻找"));
      addressOutput.textContent = hex(address);
      if (mode === "vm") {
        firstMetric.innerHTML = "<span>虚拟页 / 偏移</span><strong>" + data.page + " / " + hex(data.offset) + "</strong>";
        secondMetric.innerHTML = "<span>物理结果</span><strong>" + (data.fault ? "page fault" : hex(data.physical)) + "</strong>";
        thirdMetric.innerHTML = "<span>权限/映射</span><strong>" + (data.fault ? "未映射" : "页 " + data.page + " → 帧 " + data.frame) + "</strong>";
        table.querySelector("tbody").innerHTML = "<tr><th>VA</th><td>" + hex(data.address) + "</td><td>页内偏移 " + hex(data.offset) + " 保留</td></tr><tr><th>页表</th><td>" + (data.fault ? "缺失" : "frame " + data.frame) + "</td><td>" + (data.fault ? "内核处理 fault" : "拼接 frame 与 offset") + "</td></tr>";
        note.textContent = "改变地址只改变虚拟页/偏移组合；同一页表映射下，页内偏移不被翻译。";
      } else {
        firstMetric.innerHTML = "<span>总堆空间</span><strong>" + stats.total + "</strong>";
        secondMetric.innerHTML = "<span>空闲总量</span><strong>" + stats.free + "</strong>";
        thirdMetric.innerHTML = "<span>最大空闲块</span><strong>" + stats.largestFree + "</strong>";
        table.querySelector("tbody").innerHTML = heap.map(function (block) {
          return "<tr><th>" + block.start + "</th><td>" + (block.free ? "free" : "used") + " / " + block.size + "</td><td>区间结束 " + (block.start + block.size) + "</td></tr>";
        }).join("");
        note.textContent = "free 后 coalesce 只合并相邻空闲块；空闲总量 " + stats.free + " 与最大连续块 " + stats.largestFree + " 是两个不同证据。";
      }
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!answers.offset || !answers.fragment) {
        feedback.textContent = "两项都要先下注。";
        return;
      }
      revealed.hidden = false;
      var score = (answers.offset === "offset" ? 1 : 0) + (answers.fragment === "external" ? 1 : 0);
      feedback.textContent = "预测已记录：" + score + " / 2 命中；现在查看映射与空闲区间。";
      render();
    });
    vmMode.addEventListener("click", function () { mode = "vm"; render(); });
    heapMode.addEventListener("click", function () { mode = "heap"; render(); });
    addressInput.addEventListener("input", render);
    allocateButton.addEventListener("click", function () { heap = allocate(heap, 20).blocks; render(); });
    freeButton.addEventListener("click", function () { heap = freeAt(heap, 16); render(); });
    heapReset.addEventListener("click", function () { heap = initialHeap(); render(); });
    render();
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      assert(condition, message);
    }
    var translated = translate(0x1234, PAGE_SIZE, PAGE_TABLE);
    check(translated.page === 1 && translated.offset === 0x234, "page decomposition");
    check(translated.physical === 0x5234, "page frame translation");
    check(translate(0x4567, PAGE_SIZE, PAGE_TABLE).fault, "unmapped page faults");
    var initial = initialHeap();
    var initialStats = heapStats(initial);
    check(initialStats.total === 96 && initialStats.free === 40 && initialStats.largestFree === 24, "initial heap ledger");
    var allocated = allocate(initial, 20);
    check(allocated.start === 40 && heapStats(allocated.blocks).free === 20, "first fit split");
    var merged = freeAt(initial, 16);
    check(merged.length === 2 && merged[0].free && merged[0].size === 64, "coalesce adjacent free blocks");
    check(heapStats(merged).total === 96, "heap coverage invariant");
    return { checks: checks };
  }

  return { mount: mount, selfTest: selfTest, translate: translate, allocate: allocate, freeAt: freeAt, coalesce: coalesce };
});

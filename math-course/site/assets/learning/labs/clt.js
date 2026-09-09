(function(root,factory){
  "use strict";
  var m=factory();
  if(typeof module==='object'&&module.exports)module.exports=m;
  if(root&&root.CourseLearning)root.CourseLearning.register('clt',m.mount);
  if(typeof module==='object'&&require.main===module)console.log('clt self-test: PASS',m.selfTest());
})(typeof window!=='undefined'?window:null,function(){
  "use strict";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var TRIALS = 2000;
  var BINS = 32;
  var X_MIN = -4;
  var X_MAX = 4;
  var INSTANCE=0;
  var BASE_SEED = 0xc17a5eed;

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) {
        return;
      }
      if (key === "className") {
        node.setAttribute("class", String(value));
      } else if (key === "htmlFor") {
        node.setAttribute("for", String(value));
      } else if (key.slice(0, 2) === "on" && typeof value === "function") {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (value === true) {
        node.setAttribute(key, "");
      } else {
        node.setAttribute(key, String(value));
      }
    });
    return node;
  }

  function appendChildren(node, children) {
    if (children === undefined || children === null) {
      return node;
    }
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === undefined || child === null || child === false) {
        return;
      }
      node.appendChild(
        child && child.nodeType
          ? child
          : document.createTextNode(String(child))
      );
    });
    return node;
  }

  function makeElement(api, tag, attrs, children) {
    if (api && typeof api.el === "function") {
      return api.el(tag, attrs || {}, children);
    }
    return appendChildren(
      setAttributes(document.createElement(tag), attrs || {}),
      children
    );
  }

  function makeSvg(api, tag, attrs, children) {
    if (api && typeof api.svg === "function") {
      return api.svg(tag, attrs || {}, children);
    }
    return appendChildren(
      setAttributes(document.createElementNS(SVG_NS, tag), attrs || {}),
      children
    );
  }

  function clear(node) {
    while (node && node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function replaceChildren(node, children) {
    clear(node);
    appendChildren(node, children);
  }

  function formatNumber(api, value, digits) {
    if (api && typeof api.format === "function") {
      return api.format(value, digits);
    }
    if (!Number.isFinite(value)) {
      return "—";
    }
    var text = value.toFixed(digits === undefined ? 3 : digits);
    return text.indexOf(".") === -1
      ? text
      : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function announce(api, root, message) {
    if (api && typeof api.announce === "function") {
      api.announce(root, message);
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function svgText(api, x, y, text, attrs) {
    var merged = Object.assign(
      {
        x: x,
        y: y,
        "font-size": "12",
        "text-anchor": "middle",
        fill: "currentColor"
      },
      attrs || {}
    );
    return makeSvg(api, "text", merged, [text]);
  }

  function hashSeed(text) {
    var hash = 2166136261;
    for (var i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) || 1;
  }

  function makeRng(seed) {
    var state = seed >>> 0;
    return function () {
      state = (state + 0x6d2b79f5) | 0;
      var value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function normalDensity(z) {
    return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
  }

  var DISTRIBUTIONS = {
    uniform: {
      label: "均匀 U(0,1)",
      shortLabel: "均匀",
      mean: 0.5,
      variance: 1 / 12,
      beta3: 3*Math.sqrt(3)/4,
      sample: function (rng) {
        return rng();
      },
      note: "母分布平坦且有界；n=1 时离钟形最直观。"
    },
    skewed: {
      label: "偏斜：指数 Exp(1)",
      shortLabel: "偏斜",
      mean: 1,
      variance: 1,
      beta3: 12/Math.E-2,
      sample: function (rng) {
        return -Math.log1p(-rng());
      },
      note: "右偏且有长尾；有限 n 的近似通常比均匀分布更慢。"
    },
    bimodal: {
      label: "双峰：两簇对称均匀分布",
      shortLabel: "双峰",
      mean: 0,
      variance: 76 / 75,
      beta3: 1.04/Math.pow(76/75,1.5),
      sample: function (rng) {
        var center = rng() < 0.5 ? -1 : 1;
        return center + (rng() - 0.5) * 0.4;
      },
      note: "两个窄区间对称出现；n 增大后两峰会被平均机制抹平。"
    }
  };

  function runExperiment(distributionKey, n, trials) {
    if (!Object.hasOwn(DISTRIBUTIONS,distributionKey)) throw new RangeError("未知母分布");
    if (!Number.isInteger(n)||n<1||n>128) throw new RangeError("n 必须为1到128的整数");
    if (trials===undefined) trials=TRIALS;
    if (!Number.isInteger(trials)||trials<100||trials>8000) throw new RangeError("R 必须为100到8000的整数");
    var distribution = DISTRIBUTIONS[distributionKey];
    var seed = hashSeed(
      "clt-fixed-v1:" + BASE_SEED + ":" + distributionKey + ":" + n
    );
    var rng = makeRng(seed);
    var values = [];
    var total = 0;
    var totalSquare = 0;
    var inCentralBand = 0;

    for (var trial = 0; trial < trials; trial += 1) {
      var sum = 0;
      for (var sample = 0; sample < n; sample += 1) {
        sum += distribution.sample(rng);
      }
      var standardized =
        (sum / n - distribution.mean) *
        Math.sqrt(n) /
        Math.sqrt(distribution.variance);
      values.push(standardized);
      total += standardized;
      totalSquare += standardized * standardized;
      if (Math.abs(standardized) <= 1) {
        inCentralBand += 1;
      }
    }

    var empiricalMean = total / trials;
    var empiricalVariance = Math.max(
      0,
      totalSquare / trials - empiricalMean * empiricalMean
    );
    var counts = [];
    for (var bin = 0; bin < BINS; bin += 1) {
      counts.push(0);
    }
    var outside = 0;
    var maxDensity = 0;
    var binWidth = (X_MAX - X_MIN) / BINS;
    values.forEach(function (value) {
      if (value < X_MIN || value >= X_MAX) {
        outside += 1;
        return;
      }
      var index = clamp(
        Math.floor(((value - X_MIN) / (X_MAX - X_MIN)) * BINS),
        0,
        BINS - 1
      );
      counts[index] += 1;
    });
    counts.forEach(function (count) {
      maxDensity = Math.max(maxDensity, count / (trials * binWidth));
    });

    return {
      distribution: distribution,
      values:values, trials:trials,
      berryEsseen:Math.min(1,.4748*distribution.beta3/Math.sqrt(n)),
      counts: counts,
      binWidth: binWidth,
      maxDensity: maxDensity,
      seed: seed,
      empiricalMean: empiricalMean,
      empiricalSd: Math.sqrt(empiricalVariance),
      centralCoverage: inCentralBand / trials,
      outside: outside,
      rawMeanSd: Math.sqrt(distribution.variance / n),
      n: n
    };
  }

  function drawPlot(api, svg, experiment, raw) {
    var uid=svg.getAttribute("data-plot-id");
    var scale=raw?experiment.rawMeanSd:1;
    var center=raw?experiment.distribution.mean:0;
    var axisScale=raw?Math.sqrt(experiment.distribution.variance):1;
    var left = 58;
    var top = 28;
    var width = 600;
    var height = 230;
    var bottom = top + height;
    var right = left + width;
    var yMax = Math.max(0.45, experiment.maxDensity * 1.2)/scale;
    var children = [
      makeSvg(api, "title", { id: uid+"-title" }, [
        raw?"原始样本均值的经验直方图":"标准化样本均值的经验直方图"
      ]),
      makeSvg(api, "desc", { id: uid+"-desc" }, [
        experiment.distribution.shortLabel +
          "母分布，样本量 n=" +
          experiment.n +
          "；柱形表示 " +
          experiment.trials +
          (raw?" 次重复实验的原始平均，金色曲线为正态近似。":" 次重复实验的 Z_n，金色曲线为标准正态。")
      ])
    ];

    function sx(value) {
      return left + ((value*scale/axisScale - X_MIN) / (X_MAX - X_MIN)) * width;
    }

    function sy(value) {
      return bottom - (value / yMax) * height;
    }

    for (var xTick = 0; xTick <= 4; xTick += 1) {
      var xValue = X_MIN + ((X_MAX - X_MIN) * xTick) / 4;
      var x = left+(xValue-X_MIN)/(X_MAX-X_MIN)*width;
      children.push(
        makeSvg(api, "line", {
          x1: x,
          y1: top,
          x2: x,
          y2: bottom,
          stroke: "currentColor",
          "stroke-opacity": "0.12"
        }),
        svgText(api, x, bottom + 23, formatNumber(api,center+axisScale*xValue,3), {
          "font-size": "13"
        })
      );
    }

    for (var yTick = 0; yTick <= 2; yTick += 1) {
      var yValue = (yMax * yTick) / 2;
      var y = sy(yValue);
      children.push(
        makeSvg(api, "line", {
          x1: left,
          y1: y,
          x2: right,
          y2: y,
          stroke: "currentColor",
          "stroke-opacity": yTick === 0 ? "0.32" : "0.1"
        }),
        svgText(api, left - 10, y + 4, formatNumber(api, yValue, 2), {
          "font-size": "13",
          "text-anchor": "end"
        })
      );
    }

    children.push(
      makeSvg(api, "line", {
        x1: left,
        y1: bottom,
        x2: right,
        y2: bottom,
        stroke: "currentColor",
        "stroke-width": "1.5"
      }),
      makeSvg(api, "line", {
        x1: left,
        y1: top,
        x2: left,
        y2: bottom,
        stroke: "currentColor",
        "stroke-width": "1.5"
      }),
      makeSvg(api, "line", {
        x1: sx(0),
        y1: top,
        x2: sx(0),
        y2: bottom,
        stroke: "currentColor",
        "stroke-dasharray": "4 4",
        "stroke-opacity": "0.42"
      })
    );

    for (var barIndex = 0; barIndex < BINS; barIndex += 1) {
      var density = experiment.counts[barIndex] / (experiment.trials * experiment.binWidth * scale);
      var barX = sx(X_MIN+experiment.binWidth*barIndex);
      var barWidth = width/BINS*scale/axisScale;
      var barY = sy(density);
      children.push(
        makeSvg(api, "rect", {
          x: barX,
          y: barY,
          width: barWidth,
          height: bottom-barY,
          "data-bin":barIndex,
          fill: "currentColor",
          "fill-opacity": "0.32"
        })
      );
    }

    var curvePoints = [];
    for (var point = 0; point <= 160; point += 1) {
      var z = X_MIN + ((X_MAX - X_MIN) * point) / 160;
      curvePoints.push(sx(z) + "," + sy(normalDensity(z)/scale));
    }
    children.push(
      makeSvg(api, "polyline", {
        points: curvePoints.join(" "),
        fill: "none",
        stroke: "var(--cl-gold, #9b6a12)",
        "stroke-width": "2.5",
        "stroke-linejoin": "round",
        "stroke-linecap": "round"
      }),
      svgText(api, right, bottom + 50, raw?"平均值":"z", {
        "font-size": "12",
        "text-anchor": "end"
      }),
      svgText(api, left - 10, top - 9, "密度", {
        "font-size": "12",
        "text-anchor": "end"
      }),
      makeSvg(api, "rect", {
        x: right - 154,
        y: top + 4,
        width: 12,
        height: 12,
        fill: "currentColor",
        "fill-opacity": "0.32"
      }),
      svgText(api, right - 136, top + 14, "经验直方图", {
        "font-size": "13",
        "text-anchor": "start"
      }),
      makeSvg(api, "line", {
        x1: right - 154,
        y1: top + 31,
        x2: right - 142,
        y2: top + 31,
        stroke: "var(--cl-gold, #9b6a12)",
        "stroke-width": "2.5"
      }),
      svgText(api, right - 136, top + 35, raw?"正态近似密度":"φ(z)", {
        "font-size": "13",
        "text-anchor": "start"
      })
    );

    replaceChildren(svg, children);
    svg.setAttribute(
      "aria-label",
      experiment.distribution.shortLabel +
        "母分布、n=" +
        experiment.n +
        (raw?" 时原始平均的经验密度与正态近似":" 时标准化均值的经验密度与标准正态")
    );
  }

  function makeMetric(api, label) {
    var value = makeElement(api, "strong", {}, ["—"]);
    var card = makeElement(api, "div", { className: "cl-metric" }, [
      makeElement(api, "span", {}, [label]),
      value
    ]);
    return { card: card, value: value };
  }

  function mount(root, api) {
    if (!root || typeof document === "undefined") {
      return;
    }

    var state = {
      distribution: "bimodal",
      n: 1, trials:TRIALS
    };

    var uid='clt-'+(++INSTANCE);
    root.classList.add('clt-lab');
    if(!document.getElementById('clt84-style')){
      var style=document.createElement('style');style.id='clt84-style';
      style.textContent='.clt-lab .cl-grid{grid-template-columns:minmax(0,1fr)}.clt-lab .clt-scroll{overflow-x:auto;max-width:100%}.clt-lab .cl-plot{min-width:700px;max-width:none;width:100%}.clt-lab .clt-scroll:focus-visible{outline:3px solid var(--accent)}.clt-lab [hidden]{display:none!important}.clt-lab .clt-predict{display:grid;gap:12px;margin:16px 0}.clt-lab select,.clt-lab button{min-height:44px;font:inherit;color:var(--fg);background:var(--bg);border:1px solid var(--border);border-radius:5px;padding:6px}.clt-lab label{display:grid;gap:6px}.clt-lab .cl-stage-frame{overflow:visible}.clt-lab .clt-predict select{max-width:100%}.clt-lab .cl-note{overflow-wrap:anywhere}';document.head.appendChild(style);
    }
    var heading = makeElement(api, "h3", {}, [
      "中心极限定理实验：平均的形状如何改变？"
    ]);
    var intro = makeElement(api, "p", { className: "cl-note" }, [
      "先预测，再调节分布和 n。每个设置都用固定伪随机数做 " +
        TRIALS +
        " 次重复实验；柱形是 Z_n 的经验密度，金色曲线是标准正态密度 φ(z)。"
    ]);

    var distributionSelect = makeElement(api, "select", {
      id: uid+"-distribution",
      "aria-label": "选择母分布"
    });
    Object.keys(DISTRIBUTIONS).forEach(function (key) {
      distributionSelect.appendChild(
        makeElement(api, "option", { value: key }, [
          DISTRIBUTIONS[key].label
        ])
      );
    });
    distributionSelect.value = state.distribution;

    var distributionLabel = makeElement(api, "label", {
      htmlFor: uid+"-distribution"
    }, ["母分布"]);
    var nOutput = makeElement(api, "output", { htmlFor: uid+"-n" }, [
      String(state.n)
    ]);
    var nLabel = makeElement(api, "label", { htmlFor: uid+"-n" }, [
      "每次平均的样本量 n = ",
      nOutput
    ]);
    var nInput = makeElement(api, "input", {
      id: uid+"-n",
      type: "range",
      min: "1",
      max: "128",
      step: "1",
      value: String(state.n),
      "aria-label": "每次平均的样本量 n"
    });

    var controlSection = makeElement(api, "section", {
      className: "cl-controls",
      "aria-labelledby": uid+"-controls-title"
    }, [
      makeElement(api, "h4", { id: uid+"-controls-title" }, ["参数"]),
      makeElement(api, "div", { className: "cl-control" }, [
        distributionLabel,
        distributionSelect
      ]),
      makeElement(api, "div", { className: "cl-control" }, [
        nLabel,
        nInput
      ]),
      makeElement(api, "p", { className: "cl-note" }, [
        "三种母分布均有有限且非零方差；R = ",
        "可调",
        " 只是重复次数，不是 n。"
      ])
    ]);

    var rSelect=makeElement(api,'select',{'aria-label':'重复次数 R'});
    [500,2000,8000].forEach(function(v){rSelect.appendChild(makeElement(api,'option',{value:String(v)},[String(v)]));});rSelect.value=String(state.trials);
    controlSection.appendChild(makeElement(api,'label',{},['重复次数 R（只改变经验估计的稳定性）',rSelect]));
    var svg = makeSvg(api, "svg", {
      className: "cl-plot",
      viewBox: "0 0 700 360",
      role: "img",
      "data-plot-id":uid+"-z",
      "aria-labelledby":uid+"-z-title "+uid+"-z-desc",
      "aria-label": "标准化样本均值的经验直方图"
    });
    var stageTitle = makeElement(api, "span", {
      id: uid+"-stage-title"
    }, ["标准化样本均值 Z_n"]);
    var plotNote = makeElement(api, "p", { className: "cl-note" }, []);
    var status = makeElement(api, "p", {
      className: "cl-note",
      "aria-live": "polite"
    }, []);

    var meanMetric = makeMetric(api, "经验均值 Ê[Z_n]");
    var sdMetric = makeMetric(api, "经验标准差 sd(Z_n)");
    var coverageMetric = makeMetric(api, "经验 P̂(|Z_n| ≤ 1)");
    var rawWidthMetric = makeMetric(api, "理论 sd(X̄_n) = σ/√n");
    var formula = makeElement(api, "div", { className: "cl-formula" }, []);
    var checklist = makeElement(api, "ul", {
      className: "cl-checklist",
      "aria-label": "实验读数与定理边界"
    });

    var stageSection = makeElement(api, "section", {
      className: "cl-stage",
      "aria-labelledby": uid+"-stage-title"
    }, [
      makeElement(api, "div", { className: "cl-stage-frame" }, [
        makeElement(api, "div", { className: "cl-stage-title" }, [
          stageTitle,
          makeElement(api, "span", {}, ["−4 ≤ z ≤ 4"])
        ]),
        makeElement(api,"div",{className:"clt-scroll",tabindex:"0",role:"region","aria-label":"可横向滚动的标准化均值图"},[svg])
      ]),
      plotNote,
      makeElement(api, "div", { className: "cl-metrics" }, [
        meanMetric.card,
        sdMetric.card,
        coverageMetric.card,
        rawWidthMetric.card
      ]),
      status,
      formula,
      makeElement(api, "h4", {}, ["LLN / CLT 条件速查"]),
      checklist
    ]);

    var rawSvg=makeSvg(api,'svg',{className:'cl-plot',viewBox:'0 0 700 360',role:'img','data-plot-id':uid+'-raw','aria-labelledby':uid+'-raw-title '+uid+'-raw-desc'});
    var rawFrame=makeElement(api,'div',{className:'cl-stage-frame'},[makeElement(api,'h4',{},['同一批数据：原始平均的收缩']),makeElement(api,'div',{className:'clt-scroll',tabindex:'0',role:'region','aria-label':'可横向滚动的原始平均图'},[rawSvg]),makeElement(api,'p',{className:'cl-note'},['横轴固定在 μ±4σ；n 增大后原始平均收缩。柱高按原始变量的箱宽重新归一化。两图只画 −4≤Z_n<4 的样本，区间外计数另列；正态参考曲线也仅显示中心±4个标准差。'])]);
    stageSection.appendChild(rawFrame);
    var grid = makeElement(api, "div", { className: "cl-grid" }, [
      controlSection,
      stageSection
    ]);

    grid.hidden=true;grid.tabIndex=-1;
    var predict=makeElement(api,'div',{className:'clt-predict'}),answers=[];
    [['n=1 的双峰母分布已经正态吗？','否','是'],['n增大，原始平均的标准差怎样变？','按1/√n缩小','保持不变'],['固定n，只增加R会改变真实分布吗？','不会；只改善经验估计','会；它会使真实分布正态化']].forEach(function(q){var select=makeElement(api,'select',{'aria-label':q[0]},[makeElement(api,'option',{value:''},['请选择预测']),makeElement(api,'option',{value:'yes'},[q[1]]),makeElement(api,'option',{value:'no'},[q[2]])]);select.addEventListener('change',function(){grid.hidden=true;});answers.push(select);predict.appendChild(makeElement(api,'label',{},[q[0],select]));});
    var reveal=makeElement(api,'button',{type:'button'},['提交预测并揭示']),reset=makeElement(api,'button',{type:'button'},['重新预测']),feedback=makeElement(api,'p',{className:'cl-note',role:'status'},['请先完成三项预测。']);
    reveal.addEventListener('click',function(){if(answers.some(function(a){return !a.value;})){feedback.textContent='三项都选好后再提交。';return;}feedback.textContent=answers.filter(function(a){return a.value==='yes';}).length+'/3 项预测正确。参数变化可继续观察同一机制。';grid.hidden=false;render();grid.focus();});
    reset.addEventListener('click',function(){answers.forEach(function(a){a.value='';});grid.hidden=true;state.distribution='bimodal';state.n=1;state.trials=TRIALS;distributionSelect.value=state.distribution;nInput.value='1';rSelect.value=String(TRIALS);feedback.textContent='已重置，请重新预测。';answers[0].focus();});
    predict.appendChild(reveal);predict.appendChild(reset);predict.appendChild(feedback);
    replaceChildren(root, [heading, intro, predict,grid]);

    function updateChecklist(experiment) {
      var nText = formatNumber(api, experiment.n, 0);
      var approximationText =
        experiment.n === 1
          ? "n=1 时这就是母分布的标准化形状，不能期待它已经是正态。"
          : "有限 n 只给近似；偏斜或双峰母分布的接近速度可能不同。";
      replaceChildren(checklist, [
        makeElement(api, "li", {}, [
          makeElement(api, "span", { className: "cl-pass" }, ["✓"]),
          makeElement(api, "span", {}, [
            "LLN 看位置：理论上 sd(X̄_n) = ",
            formatNumber(api, experiment.rawMeanSd, 3),
            "，n 增大时平均更集中；这不是形状结论。"
          ])
        ]),
        makeElement(api, "li", {}, [
          makeElement(api, "span", { className: "cl-pass" }, ["✓"]),
          makeElement(api, "span", {}, [
            "CLT 看形状：第一张图先减去 μ、再除以 σ/√n，比较的是 Z_n 与 N(0,1)。"
          ])
        ]),
        makeElement(api, "li", {}, [
          makeElement(api, "span", { className: "cl-pass" }, ["✓"]),
          makeElement(api, "span", {}, [
            "前提：独立同分布，且本实验母分布满足 0 < σ² < ∞。"
          ])
        ]),
        makeElement(api, "li", {}, [
          makeElement(api, "span", { className: "cl-warn" }, ["!"]),
          makeElement(api, "span", {}, [nText + "：" + approximationText])
        ])
      ]);
    }

    function render() {
      var experiment = runExperiment(state.distribution, state.n,state.trials);
      var distribution = experiment.distribution;
      nOutput.textContent = String(state.n);
      stageTitle.textContent =
        "标准化样本均值 Z_n（" + distribution.shortLabel + "）";
      plotNote.textContent =
        distribution.note +
        " 柱高按全部 " +
        state.trials +
        " 次实验归一化；金色曲线只是 N(0,1) 的参考极限。";
      status.textContent =
        "固定种子 " +
        experiment.seed +
        " · " +
        distribution.label +
        " · n = " +
        state.n +
        " · 每次平均取 " +
        state.n +
        " 个样本 · 区间外（z<−4 或 z≥4）" +
        experiment.outside +
        " / " +
        state.trials +
        " 个值未画出。CDF 的 Berry–Esseen 理论误差上界 ≤ " + formatNumber(api,experiment.berryEsseen,4) + "；此界不含有限R的抽样误差。";
      meanMetric.value.textContent = formatNumber(
        api,
        experiment.empiricalMean,
        3
      );
      sdMetric.value.textContent = formatNumber(api, experiment.empiricalSd, 3);
      coverageMetric.value.textContent =
        formatNumber(api, experiment.centralCoverage, 3) + "（正态约 0.683）";
      rawWidthMetric.value.textContent = formatNumber(
        api,
        experiment.rawMeanSd,
        3
      );
      formula.textContent =
        "Z_n = √n( X̄_n − μ ) / σ    ·    φ(z) = exp(−z²/2) / √(2π)";
      drawPlot(api, svg, experiment);
      drawPlot(api,rawSvg,experiment,true);
      updateChecklist(experiment);
    }

    rSelect.addEventListener("change",function(){state.trials=Number(rSelect.value);render();});
    distributionSelect.addEventListener("change", function () {
      state.distribution = distributionSelect.value;
      render();
      announce(api, root, "已切换到" + DISTRIBUTIONS[state.distribution].label);
    });
    nInput.addEventListener("input", function () {
      state.n = Number(nInput.value);
      render();
    });
    nInput.addEventListener("change", function () {
      announce(api, root, "样本量 n 已设为 " + state.n);
    });

    render();
  }
  function selfTest(){
    var n=0;function ok(v){n++;if(!v)throw new Error('CLT self-test '+n);}
    Object.keys(DISTRIBUTIONS).forEach(function(k){var e=runExperiment(k,1,500);ok(e.values.length===500);ok(e.counts.reduce(function(a,b){return a+b;},0)+e.outside===500);ok(e.empiricalSd>0);ok(e.berryEsseen>0&&e.berryEsseen<=1);ok(JSON.stringify(e.values)===JSON.stringify(runExperiment(k,1,500).values));});
    return {checks:n};
  }
  return {mount:mount,runExperiment:runExperiment,drawPlot:drawPlot,DISTRIBUTIONS:DISTRIBUTIONS,makeRng:makeRng,hashSeed:hashSeed,selfTest:selfTest};
});

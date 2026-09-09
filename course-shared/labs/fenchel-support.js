(function(host,factory) {
  "use strict";
  var exported=factory(host);
  if(typeof module==="object"&&module.exports)module.exports=exported;
  if(host&&host.CourseLearning)host.CourseLearning.register("fenchel-support",exported.mount);
  if(typeof module==="object"&&module.exports&&require.main===module)console.log("Fenchel support self-test PASS",exported.selfTest());
}(typeof window!=="undefined"?window:null,function(host) {
  "use strict";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var EPS = Number.EPSILON;
  var STYLE_TEXT = [
    ".fenchel-support-lab { --fs-function: var(--cl-blue, #315f9d); --fs-line: var(--cl-gold, #9b6a12); --fs-conjugate: var(--cl-green, #39734d); --fs-contact: var(--cl-red, #b64335); --fs-muted: var(--fg-soft, #6f6a60); --fs-warning: var(--cl-red, #b64335); line-height: 1.5; }",
    "html[data-theme=\"dark\"] .fenchel-support-lab { --fs-function: #83c8ff; --fs-line: #e2b458; --fs-conjugate: #72bd8b; --fs-contact: #f08c7d; --fs-muted: #b8b2a7; --fs-warning: #f08c7d; }",
    ".fenchel-support-lab .fs-layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; align-items: start; }",
    ".fenchel-support-lab .fs-controls, .fenchel-support-lab .fs-stage { min-width: 0; }",
    ".fenchel-support-lab .fs-controls { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(210px, .55fr); gap: 12px 18px; align-items: end; }",
    ".fenchel-support-lab .fs-controls > h4, .fenchel-support-lab .fs-controls > .fs-control:first-of-type, .fenchel-support-lab .fs-controls > .fs-note { grid-column: 1 / -1; }",
    ".fenchel-support-lab .fs-controls > h4 { margin: 0; }",
    ".fenchel-support-lab .fs-control { display: grid; gap: 6px; }",
    ".fenchel-support-lab .fs-label { color: var(--fg-soft); font-size: 13px; font-weight: 650; }",
    ".fenchel-support-lab .fs-preset-buttons { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }",
    ".fenchel-support-lab button { min-height: 44px; padding: 8px 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--fg); font: inherit; line-height: 1.35; cursor: pointer; }",
    ".fenchel-support-lab button:hover { border-color: var(--accent); }",
    ".fenchel-support-lab button[aria-pressed=\"true\"], .fenchel-support-lab .fs-primary { background: var(--accent); border-color: var(--accent); color: var(--bg); font-weight: 700; }",
    ".fenchel-support-lab input[type=range] { display: block; width: 100%; min-height: 44px; margin: 0; accent-color: var(--accent); }",
    ".fenchel-support-lab button:focus-visible, .fenchel-support-lab input:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
    ".fenchel-support-lab .fs-output { color: var(--accent); font-variant-numeric: tabular-nums; }",
    ".fenchel-support-lab .fs-note, .fenchel-support-lab .fs-status { margin: 0; color: var(--fs-muted); font-size: 13px; line-height: 1.65; overflow-wrap: anywhere; }",
    ".fenchel-support-lab .fs-status { min-height: 1.65em; color: var(--fg); font-weight: 650; }",
    ".fenchel-support-lab .fs-stage-frame { padding: 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); overflow-x: auto; -webkit-overflow-scrolling: touch; }",
    ".fenchel-support-lab .fs-svg { display: block; width: 100%; min-width: 660px; height: auto; color: var(--fg); }",
    ".fenchel-support-lab .fs-svg text { fill: currentColor; font-family: inherit; letter-spacing: 0; }",
    ".fenchel-support-lab .fs-panel { fill: var(--bg); stroke: var(--border); stroke-width: 1.2; }",
    ".fenchel-support-lab .fs-grid { fill: none; stroke: currentColor; stroke-opacity: .13; stroke-width: 1; }",
    ".fenchel-support-lab .fs-axis { fill: none; stroke: currentColor; stroke-opacity: .55; stroke-width: 1.35; }",
    ".fenchel-support-lab .fs-axis-label { fill: var(--fs-muted) !important; font-size: 11px; }",
    ".fenchel-support-lab .fs-panel-title { font-size: 15px; font-weight: 700; }",
    ".fenchel-support-lab .fs-curve, .fenchel-support-lab .fs-function, .fenchel-support-lab .fs-conjugate { fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2.7; }",
    ".fenchel-support-lab .fs-function { stroke: var(--fs-function); }",
    ".fenchel-support-lab .fs-conjugate { stroke: var(--fs-conjugate); }",
    ".fenchel-support-lab .fs-under { fill: none; stroke: var(--fs-line); stroke-width: 2.4; stroke-dasharray: 8 5; }",
    ".fenchel-support-lab .fs-contact-set { fill: none; stroke: var(--fs-contact); stroke-width: 5; stroke-linecap: round; opacity: .82; }",
    ".fenchel-support-lab .fs-contact-guide, .fenchel-support-lab .fs-domain-boundary { fill: none; stroke: var(--fs-contact); stroke-width: 1.4; stroke-dasharray: 5 4; opacity: .82; }",
    ".fenchel-support-lab .fs-current-guide { fill: none; stroke: var(--accent); stroke-width: 1.4; stroke-dasharray: 4 4; opacity: .8; }",
    ".fenchel-support-lab .fs-warning-guide { fill: none; stroke: var(--fs-warning); stroke-width: 1.8; stroke-dasharray: 6 4; opacity: .9; }",
    ".fenchel-support-lab .fs-point { fill: var(--fs-contact); stroke: var(--bg); stroke-width: 2; }",
    ".fenchel-support-lab .fs-current-point { fill: var(--accent); stroke: var(--bg); stroke-width: 2; }",
    ".fenchel-support-lab .fs-function-label { fill: var(--fs-function) !important; font-size: 12px; font-weight: 700; }",
    ".fenchel-support-lab .fs-line-label { fill: var(--fs-line) !important; font-size: 12px; font-weight: 700; }",
    ".fenchel-support-lab .fs-conjugate-label { fill: var(--fs-conjugate) !important; font-size: 12px; font-weight: 700; }",
    ".fenchel-support-lab .fs-contact-label { fill: var(--fs-contact) !important; font-size: 12px; font-weight: 700; }",
    ".fenchel-support-lab .fs-warning { fill: var(--fs-warning) !important; font-size: 12px; font-weight: 700; }",
    ".fenchel-support-lab .fs-warning-box { fill: var(--fs-warning); fill-opacity: .08; stroke: var(--fs-warning); stroke-opacity: .42; stroke-width: 1; }",
    ".fenchel-support-lab .fs-infinity-arrow { fill: none; stroke: var(--fs-warning); stroke-width: 2; }",
    ".fenchel-support-lab .fs-infinity-head { fill: var(--fs-warning); }",
    ".fenchel-support-lab .fs-formula { margin-top: 10px; overflow-x: auto; padding: 10px 12px; border-left: 3px solid var(--accent); background: var(--bg); font-family: \"SF Mono\", Menlo, Consolas, monospace; font-size: 13px; line-height: 1.65; }",
    ".fenchel-support-lab .fs-legend { display: flex; flex-wrap: wrap; gap: 7px 14px; margin-top: 10px; color: var(--fs-muted); font-size: 12px; }",
    ".fenchel-support-lab .fs-legend-item { display: inline-flex; align-items: center; gap: 5px; }",
    ".fenchel-support-lab .fs-legend-line { display: inline-block; width: 25px; height: 0; border-top: 3px solid currentColor; }",
    ".fenchel-support-lab .fs-legend-function { color: var(--fs-function); }",
    ".fenchel-support-lab .fs-legend-under { color: var(--fs-line); border-top-style: dashed; }",
    ".fenchel-support-lab .fs-legend-conjugate { color: var(--fs-conjugate); }",
    ".fenchel-support-lab .fs-legend-point { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--fs-contact); }",
    ".fenchel-support-lab .fs-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(128px, 1fr)); gap: 8px; margin-top: 12px; }",
    ".fenchel-support-lab .fs-metric { min-width: 0; padding: 9px 10px; border-top: 2px solid var(--border); background: var(--bg); }",
    ".fenchel-support-lab .fs-metric span { display: block; color: var(--fs-muted); font-size: 11.5px; line-height: 1.4; }",
    ".fenchel-support-lab .fs-metric strong { display: block; margin-top: 3px; color: var(--fg); font-size: 15px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }",
    ".fenchel-support-lab .fs-boundary-note { margin-top: 9px; padding: 8px 10px; border-left: 3px solid var(--fs-warning); background: var(--bg); color: var(--fs-muted); font-size: 12.5px; line-height: 1.6; }",
    "@media (max-width: 700px) { .fenchel-support-lab .fs-controls { grid-template-columns: minmax(0, 1fr); } .fenchel-support-lab .fs-controls > h4, .fenchel-support-lab .fs-controls > .fs-control:first-of-type, .fenchel-support-lab .fs-controls > .fs-note { grid-column: auto; } .fenchel-support-lab .fs-preset-buttons { grid-template-columns: minmax(0, 1fr); } .fenchel-support-lab .fs-stage-frame { padding: 5px; } .fenchel-support-lab .fs-svg { width: 660px; max-width: none; } }",
    "@media (prefers-reduced-motion: reduce) { .fenchel-support-lab * { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }"
    ,".fenchel-support-lab{min-width:0;overflow:hidden}.fenchel-support-lab .fs-svg{width:980px;min-width:980px;max-width:none}.fenchel-support-lab .fs-controls>.fs-preset-buttons,.fenchel-support-lab .fs-controls>.fs-control:has(input[id$='-offset']){grid-column:1/-1}"
    ,".fenchel-support-lab [role=region]:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}"
    ,"@media(prefers-reduced-motion:reduce){html:has(.fenchel-support-lab){scroll-behavior:auto!important}}"
  ].join("\n");

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
        child && child.nodeType ? child : document.createTextNode(String(child))
      );
    });
    return node;
  }

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

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function formatNumber(api, value, digits) {
    if (!Number.isFinite(value)) {
      return value === Infinity ? "+∞" : value === -Infinity ? "−∞" : "—";
    }
    if (value !== 0 && (Math.abs(value) < 0.001 || Math.abs(value) > 1e6)) return value.toExponential(5);
    var text = value.toFixed(digits === undefined ? 3 : digits);
    return text.indexOf(".") === -1
      ? text
      : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function svgText(api, x, y, text, attrs) {
    var merged = Object.assign(
      { x: x, y: y, "font-size": "12", "text-anchor": "middle", fill: "currentColor" },
      attrs || {}
    );
    return makeSvg(api, "text", merged, [text]);
  }

  function softplus(x) {
    return Math.max(x,0)+Math.log1p(Math.exp(-Math.abs(x)));
  }

  function softplusConjugate(s) {
    if (s < 0 || s > 1) {
      return Infinity;
    }
    if (s === 0 || s === 1) {
      return 0;
    }
    return s * Math.log(s) + (1 - s) * Math.log1p(-s);
  }

  var PRESETS = [
    {
      id: "quadratic",
      label: "f(x)=x²/2",
      sliderMin: -3,
      sliderMax: 3,
      sliderStep: 0.05,
      initialS: 1,
      left: { xMin: -3.2, xMax: 3.2, yMin: -0.45, yMax: 5.7 },
      right: { xMin: -3.2, xMax: 3.2, yMin: -0.45, yMax: 5.7 },
      domainMin: -Infinity,
      domainMax: Infinity,
      f: function (x) { return 0.5 * x * x; },
      fStar: function (s) { return 0.5 * s * s; },
      contact: function (s) { return { type: "point", x: s }; },
      formulaText: "f*(s)=s²/2；dom f*=ℝ；接触点 x=s。",
      domainText: "dom f*=ℝ"
    },
    {
      id: "absolute",
      label: "f(x)=|x|",
      sliderMin: -2,
      sliderMax: 2,
      sliderStep: 0.05,
      initialS: 0.5,
      left: { xMin: -3.2, xMax: 3.2, yMin: -0.45, yMax: 3.7 },
      right: { xMin: -2.2, xMax: 2.2, yMin: -0.45, yMax: 1.5 },
      domainMin: -1,
      domainMax: 1,
      f: function (x) { return Math.abs(x); },
      fStar: function (s) { return Math.abs(s) <= 1 ? 0 : Infinity; },
      contact: function (s) {
        if (Math.abs(s) < 1) {
          return { type: "point", x: 0 };
        }
        if (s === 1) {
          return { type: "ray", side: "right" };
        }
        if (s === -1) {
          return { type: "ray", side: "left" };
        }
        return { type: "none" };
      },
      formulaText: "f*(s)=0（|s|≤1），|s|>1 时 f*(s)=+∞。",
      domainText: "dom f*=[−1,1]"
    },
    {
      id: "softplus",
      label: "f(x)=log(1+eˣ)",
      sliderMin: -0.2,
      sliderMax: 1.2,
      sliderStep: 0.01,
      initialS: 0.5,
      left: { xMin: -5.5, xMax: 5.5, yMin: -5.6, yMax: 6.2 },
      right: { xMin: -0.25, xMax: 1.25, yMin: -0.85, yMax: 1.1 },
      domainMin: 0,
      domainMax: 1,
      f: softplus,
      fStar: softplusConjugate,
      contact: function (s) {
        if (s > 0 && s < 1) {
          return { type: "point", x: Math.log(s) - Math.log1p(-s) };
        }
        if (s === 0) {
          return { type: "asymptotic", direction: "x→−∞" };
        }
        if (s === 1) {
          return { type: "asymptotic", direction: "x→+∞" };
        }
        return { type: "none" };
      },
      formulaText: "f*(s)=s log s+(1−s)log(1−s)（0≤s≤1，约定 0log0=0）；域外为 +∞。",
      domainText: "dom f*=[0,1]"
    }
  ];

  PRESETS.forEach(function(p){Object.freeze(p.left);Object.freeze(p.right);Object.freeze(p);});
  Object.freeze(PRESETS);

  function getPreset(id) {
    for (var i = 0; i < PRESETS.length; i += 1) {
      if (PRESETS[i].id === id) {
        return PRESETS[i];
      }
    }
    throw new RangeError("unknown preset: "+id);
  }

  function requireNumber(x,min,max,label) {
    if(typeof x!=="number"||!Number.isFinite(x)||x<min||x>max)throw new RangeError(label+" outside finite interval ["+min+","+max+"]");
    return x;
  }
  function evaluate(preset,s,offset) {
    if(typeof preset==="string")preset=getPreset(preset);
    if(PRESETS.indexOf(preset)<0)throw new RangeError("known frozen preset required");
    requireNumber(s,preset.sliderMin,preset.sliderMax,"s");
    offset=offset===undefined?0:requireNumber(offset,-2,2,"vertical shift");
    var star=preset.fStar(s),isFinite=Number.isFinite(star);
    // The line is ell_s(x)+offset. Its global gap infimum is exactly -offset.
    return {id:preset.id,s:s,star:star,finite:isFinite,contact:preset.contact(s),offset:offset,
      intercept:isFinite?-star+offset:null,
      globalGapInfimum:isFinite?-offset:-Infinity,
      lowerBound:isFinite&&offset<=0,
      touches:isFinite&&offset===0&&["point","ray"].indexOf(preset.contact(s).type)>=0};
  }
  function shiftText(result) {
    if(!result.finite)return "这个斜率没有任何有限的全局仿射下界。";
    if(result.offset>0)return "上移后穿过函数：全局间隙的下确界 = −δ < 0；即使窗格内没看见交叉也不是下界。";
    if(result.offset<0)return "下移后仍是下界，但不是最高：全局间隙下确界 = −δ > 0，不会接触。";
    return result.contact.type==="asymptotic"?"最高下界；间隙下确界为零，却没有有限接触点。":"最高下界；间隙下确界为零，并在红色接触集取到。";
  }

  function contactText(api, result) {
    var contact = result.contact;
    if (!result.finite || contact.type === "none") {
      return "无：域外，f*(s)=+∞";
    }
    if (contact.type === "point") {
      return "有限点 x=" + formatNumber(api, contact.x, 3);
    }
    if (contact.type === "ray") {
      return contact.side === "right" ? "接触集 x≥0" : "接触集 x≤0";
    }
    return "无有限点；仅在 " + contact.direction + " 极限接触";
  }

  function boundaryText(api, preset, result) {
    if (!result.finite) {
      if (preset.id === "absolute") {
        return "域外无界：sx−|x| 沿一侧 x→无穷时趋于 +∞；不存在有限的最高仿射下界，也不画接触点。";
      }
      if (preset.id === "softplus") {
        return "域外无界：当 s<0 或 s>1 时，sx−log(1+eˣ) 在相应无穷方向趋于 +∞；不存在有限的最高仿射下界，也不画接触点。";
      }
      return "当前斜率不在有限域内：上确界无界。";
    }
    if (result.contact.type === "asymptotic") {
      return "边界值仍有限，但上确界只在 " + result.contact.direction + " 的极限上逼近；右图的当前点是 f* 的函数值，不是假造的有限接触点。";
    }
    if (result.contact.type === "ray") {
      return "折点边界：整条半射线都是接触集；图中用粗红线标出接触集，不把它缩成一个点。";
    }
    return "有限域内：红点表示左图的等号接触，右图蓝点表示当前 (s,f*(s))。";
  }

  function lineEquation(api, result) {
    if (!result.finite) {
      return "最高下界：不存在有限的 ℓ_s(x)，因为 f*(s)=+∞。";
    }
    return "最高下界：ℓ_s(x)=sx−f*(s)；当前 f*(s)=" + formatNumber(api, result.star, 4);
  }

  function metric(api, label) {
    var value = makeElement(api, "strong", {}, ["—"]);
    return {
      card: makeElement(api, "div", { className: "fs-metric" }, [
        makeElement(api, "span", {}, [label]),
        value
      ]),
      value: value
    };
  }

  function makeLegendItem(api, swatchClass, label) {
    var swatch = makeElement(api, "span", {
      className: "fs-legend-line " + swatchClass,
      "aria-hidden": "true"
    });
    return makeElement(api, "span", { className: "fs-legend-item" }, [swatch, label]);
  }

  function makePointLegendItem(api, label) {
    var swatch = makeElement(api, "span", {
      className: "fs-legend-point",
      "aria-hidden": "true"
    });
    return makeElement(api, "span", { className: "fs-legend-item" }, [swatch, label]);
  }

  function makeMapper(box, xMin, xMax, yMin, yMax) {
    return {
      sx: function (x) {
        return box.left + (x - xMin) / (xMax - xMin) * (box.right - box.left);
      },
      sy: function (y) {
        return box.bottom - (y - yMin) / (yMax - yMin) * (box.bottom - box.top);
      }
    };
  }

  function pathForFunction(mapper, min, max, fn, samples) {
    var d = "";
    for (var i = 0; i <= samples; i += 1) {
      var x = min + (max - min) * i / samples;
      var y = fn(x);
      if (!Number.isFinite(y)) {
        continue;
      }
      d += (d ? " L" : "M") + mapper.sx(x).toFixed(2) + "," + mapper.sy(y).toFixed(2);
    }
    return d;
  }

  function pathForLine(mapper, min, max, slope, intercept) {
    return "M" + mapper.sx(min).toFixed(2) + "," + mapper.sy(slope * min - intercept).toFixed(2) +
      " L" + mapper.sx(max).toFixed(2) + "," + mapper.sy(slope * max - intercept).toFixed(2);
  }

  function tickText(api, value, range) {
    var digits = Math.abs(range) < 2 ? 2 : 1;
    return formatNumber(api, value, digits);
  }

  function drawAxes(api, children, box, xMin, xMax, yMin, yMax, xLabel, yLabel) {
    var mapper = makeMapper(box, xMin, xMax, yMin, yMax);
    var i;
    for (i = 0; i <= 4; i += 1) {
      var xTick = xMin + (xMax - xMin) * i / 4;
      var x = mapper.sx(xTick);
      children.push(
        makeSvg(api, "line", {
          className: "fs-grid",
          x1: x,
          y1: box.top,
          x2: x,
          y2: box.bottom
        }),
        svgText(api, x, box.bottom + 21, tickText(api, xTick, xMax - xMin), {
          className: "fs-axis-label"
        })
      );
    }
    for (i = 0; i <= 4; i += 1) {
      var yTick = yMin + (yMax - yMin) * i / 4;
      var y = mapper.sy(yTick);
      children.push(
        makeSvg(api, "line", {
          className: "fs-grid",
          x1: box.left,
          y1: y,
          x2: box.right,
          y2: y
        }),
        svgText(api, box.left - 9, y + 4, tickText(api, yTick, yMax - yMin), {
          className: "fs-axis-label",
          "text-anchor": "end"
        })
      );
    }
    var xAxisY = yMin <= 0 && yMax >= 0 ? mapper.sy(0) : box.bottom;
    var yAxisX = xMin <= 0 && xMax >= 0 ? mapper.sx(0) : box.left;
    children.push(
      makeSvg(api, "line", {
        className: "fs-axis",
        x1: box.left,
        y1: xAxisY,
        x2: box.right,
        y2: xAxisY
      }),
      makeSvg(api, "line", {
        className: "fs-axis",
        x1: yAxisX,
        y1: box.top,
        x2: yAxisX,
        y2: box.bottom
      }),
      svgText(api, box.right, box.bottom + 40, xLabel, {
        className: "fs-axis-label",
        "text-anchor": "end"
      }),
      svgText(api, box.left - 9, box.top - 10, yLabel, {
        className: "fs-axis-label",
        "text-anchor": "end"
      })
    );
    return mapper;
  }

  function addPanelBase(api, children, panel, title) {
    children.push(
      makeSvg(api, "rect", {
        className: "fs-panel",
        x: panel.x,
        y: panel.y,
        width: panel.width,
        height: panel.height,
        rx: 6
      }),
      svgText(api, panel.x + 18, panel.y + 27, title, {
        className: "fs-panel-title",
        "text-anchor": "start"
      })
    );
  }

  function plotBox(panel) {
    return {
      left: panel.x + 58,
      right: panel.x + panel.width - 18,
      top: panel.y + 64,
      bottom: panel.y + panel.height - 58
    };
  }

  function addWarningBox(api, children, box, lines) {
    var x = box.left + 10;
    var y = box.top + 12;
    var width = box.right - box.left - 20;
    children.push(
      makeSvg(api, "rect", {
        className: "fs-warning-box",
        x: x,
        y: y,
        width: width,
        height: 64,
        rx: 4
      }),
      svgText(api, box.left + box.right >> 1, y + 22, lines[0], {
        className: "fs-warning"
      }),
      svgText(api, box.left + box.right >> 1, y + 42, lines[1], {
        className: "fs-warning"
      }),
      svgText(api, box.left + box.right >> 1, y + 59, lines[2], {
        className: "fs-warning",
        "font-size": "11"
      })
    );
  }

  function addInfinityCue(api, children, mapper, box, xValue, label) {
    var x = mapper.sx(xValue);
    var top = box.top + 37;
    var bottom = box.bottom - 9;
    children.push(
      makeSvg(api, "line", {
        className: "fs-infinity-arrow",
        x1: x,
        y1: bottom,
        x2: x,
        y2: top + 8
      }),
      makeSvg(api, "path", {
        className: "fs-infinity-head",
        d: "M" + x.toFixed(2) + "," + top.toFixed(2) +
          " l-6,10 h12 z"
      }),
      svgText(api, x, top - 7, label, {
        className: "fs-warning"
      })
    );
  }

  function drawPanel(api,children,preset,result,panel,side,clipId) {
    var box=plotBox(panel),range=side==="left"?preset.left:preset.right;
    addPanelBase(api,children,panel,side==="left"?"左图：函数与当前直线":"右图：共轭与当前斜率");
    var mapper=drawAxes(api,children,box,range.xMin,range.xMax,range.yMin,range.yMax,side==="left"?"x":"s",side==="left"?"函数值":"f*(s)");
    children.push(makeSvg(api,"defs",{},[makeSvg(api,"clipPath",{id:clipId},[makeSvg(api,"rect",{x:box.left,y:box.top,width:box.right-box.left,height:box.bottom-box.top})])]));
    var curves=makeSvg(api,"g",{"clip-path":"url(#"+clipId+")","data-panel":side,
      "data-xmin":range.xMin,"data-xmax":range.xMax,"data-ymin":range.yMin,"data-ymax":range.yMax,
      "data-left":box.left,"data-right":box.right,"data-top":box.top,"data-bottom":box.bottom});
    if(side==="left"){
      curves.appendChild(makeSvg(api,"path",{className:"fs-function",d:pathForFunction(mapper,range.xMin,range.xMax,preset.f,220)}));
      if(result.finite){
        curves.appendChild(makeSvg(api,"path",{className:"fs-under","data-slope":result.s,"data-star":result.star,"data-offset":result.offset,
          d:pathForLine(mapper,range.xMin,range.xMax,result.s,result.star-result.offset)}));
        var contact=result.contact;
        if(result.offset===0&&contact.type==="point"&&contact.x>=range.xMin&&contact.x<=range.xMax){
          curves.appendChild(makeSvg(api,"line",{className:"fs-contact-guide",x1:mapper.sx(contact.x),x2:mapper.sx(contact.x),y1:box.top,y2:box.bottom}));
          curves.appendChild(makeSvg(api,"circle",{className:"fs-point","data-contact-x":contact.x,"data-contact-y":preset.f(contact.x),cx:mapper.sx(contact.x),cy:mapper.sy(preset.f(contact.x)),r:5.5}));
        }
        if(result.offset===0&&contact.type==="ray"){
          var a=contact.side==="right"?0:range.xMin,b=contact.side==="right"?range.xMax:0;
          curves.appendChild(makeSvg(api,"path",{className:"fs-contact-set","data-ray":contact.side,d:pathForFunction(mapper,a,b,preset.f,80)}));
        }
      }
      children.push(curves);
      if(!result.finite)addWarningBox(api,children,box,["这个斜率没有有限全局下界","sx−f(x) 在某个方向无界","不绘制直线或接触点"]);
      else if(result.offset===0&&result.contact.type==="asymptotic"){
        children.push(svgText(api,(box.left+box.right)/2,box.top+22,"无有限接触点；"+result.contact.direction,{className:"fs-warning"}));
      }else if(result.offset===0&&result.contact.type==="point"&&(result.contact.x<range.xMin||result.contact.x>range.xMax)){
        children.push(svgText(api,(box.left+box.right)/2,box.top+22,"接触点在窗外；数值见下方",{className:"fs-contact-label"}));
      }
      children.push(svgText(api,(box.left+box.right)/2,panel.y+panel.height-12,
        result.finite?"δ="+String(result.offset)+"；间隙下确界="+formatNumber(api,result.globalGapInfimum,3):"域外：不以有限窗格伪造全局下界",
        {"font-size":11}));
    }else{
      var lo=Number.isFinite(preset.domainMin)?preset.domainMin:range.xMin;
      var hi=Number.isFinite(preset.domainMax)?preset.domainMax:range.xMax;
      curves.appendChild(makeSvg(api,"path",{className:"fs-conjugate",d:pathForFunction(mapper,lo,hi,preset.fStar,220)}));
      if(Number.isFinite(preset.domainMin)){
        [preset.domainMin,preset.domainMax].forEach(function(x){
          curves.appendChild(makeSvg(api,"line",{className:"fs-domain-boundary",x1:mapper.sx(x),x2:mapper.sx(x),y1:box.top,y2:box.bottom}));
          curves.appendChild(makeSvg(api,"circle",{"data-domain-end":x,cx:mapper.sx(x),cy:mapper.sy(preset.fStar(x)),r:3.5,fill:"var(--fs-conjugate)"}));
        });
      }
      curves.appendChild(makeSvg(api,"line",{className:"fs-current-guide",x1:mapper.sx(result.s),x2:mapper.sx(result.s),y1:box.top,y2:box.bottom}));
      if(result.finite)curves.appendChild(makeSvg(api,"circle",{className:"fs-current-point","data-current-s":result.s,"data-current-star":result.star,cx:mapper.sx(result.s),cy:mapper.sy(result.star),r:5.5}));
      children.push(curves);
      if(Number.isFinite(preset.domainMin)){
        addInfinityCue(api,children,mapper,box,(range.xMin+preset.domainMin)/2,"+∞");
        addInfinityCue(api,children,mapper,box,(range.xMax+preset.domainMax)/2,"+∞");
      }
      children.push(svgText(api,(box.left+box.right)/2,box.top+20,preset.domainText,{className:"fs-conjugate-label"}));
      children.push(svgText(api,(box.left+box.right)/2,panel.y+panel.height-12,
        result.finite?"当前点的数值 f*(s)="+formatNumber(api,result.star,5):"当前 s 在有限域外，没有有限当前点",
        {"font-size":11}));
    }
  }
  function drawScene(api,svg,preset,result,titleId,descId) {
    clear(svg);
    var children=[
      makeSvg(api,"title",{id:titleId},["Fenchel 支撑线："+preset.label+"；s="+String(result.s)+"；δ="+String(result.offset)]),
      makeSvg(api,"desc",{id:descId},["函数、直线和接触集均裁剪到各自坐标窗格；有限窗格不能证明全局下界。域外没有有限线，渐近接触没有有限红点。"])
    ];
    drawPanel(api,children,preset,result,{x:14,y:14,width:456,height:450},"left",titleId+"-left-clip");
    drawPanel(api,children,preset,result,{x:510,y:14,width:456,height:450},"right",titleId+"-right-clip");
    appendChildren(svg,children);
    svg.setAttribute("aria-label",preset.label+"；s="+String(result.s)+"；δ="+String(result.offset)+"；"+shiftText(result));
  }

  function buildLab(root, api) {
    if (!root || typeof document === "undefined") {
      return;
    }
    INSTANCE += 1;
    var instanceId = "fenchel-support-" + INSTANCE;
    var titleId = instanceId + "-plot-title";
    var descId = instanceId + "-plot-desc";
    var controlsTitleId = instanceId + "-controls-title";
    var statusId = instanceId + "-status";
    var slopeId = instanceId + "-slope";
    var state = { presetId: "quadratic", s: 1, offset: 0 };
    var refs = { presetButtons: [] };

    clear(root);
    root.classList.add("fenchel-support-lab");
    var style = document.createElement("style");
    style.textContent = STYLE_TEXT;
    root.appendChild(style);

    var heading = makeElement(api, "h3", {}, [
      "Fenchel 支撑线：斜率固定时，直线能抬多高？"
    ]);
    var intro = makeElement(api, "p", { className: "fs-note" }, [
      "先固定斜率 s。只有 f*(s) 有限时，才有最高线 ℓ_s(x)=sx−f*(s)。再改变上移量 δ，检查整条直线是否仍在函数下方；有限窗格看不出所有交叉，需结合全局间隙下确界。"
    ]);

    var presetGroup = makeElement(api, "div", {
      className: "fs-preset-buttons",
      role: "group",
      "aria-label": "选择凸函数预设"
    });
    PRESETS.forEach(function (preset) {
      var button = makeElement(api, "button", {
        type: "button",
        "aria-pressed": preset.id === state.presetId ? "true" : "false",
        "aria-label": "选择" + preset.label
      }, [preset.label]);
      button.addEventListener("click", function () {
        state.presetId = preset.id;
        state.s = preset.initialS;
        state.offset = 0;
        updateSlider(preset);
        update();
        announce("已切换到" + preset.label + "，当前斜率 s=" + formatNumber(api, state.s, 2));
      });
      refs.presetButtons.push({ id: preset.id, button: button });
      presetGroup.appendChild(button);
    });

    var slopeOutput = makeElement(api, "output", {
      htmlFor: slopeId,
      className: "fs-output"
    }, [formatNumber(api, state.s, 2)]);
    var slopeLabel = makeElement(api, "label", { htmlFor: slopeId }, [
      "斜率 s = ", slopeOutput
    ]);
    var slopeInput = makeElement(api, "input", {
      id: slopeId,
      type: "range",
      min: String(PRESETS[0].sliderMin),
      max: String(PRESETS[0].sliderMax),
      step: String(PRESETS[0].sliderStep),
      value: String(state.s),
      "aria-label": "支撑线斜率 s",
      "aria-describedby": statusId
    });
    refs.slopeInput = slopeInput;
    refs.slopeOutput = slopeOutput;

    var resetButton = makeElement(api, "button", {
      type: "button",
      className: "fs-primary"
    }, ["恢复当前预设的示例斜率"]);
    resetButton.addEventListener("click", function () {
      var preset = getPreset(state.presetId);
      state.s = preset.initialS;
      state.offset = 0;
      updateSlider(preset);
      update();
      announce("已恢复" + preset.label + "的示例斜率 s=" + formatNumber(api, state.s, 2));
    });

    var controls = makeElement(api, "section", {
      className: "fs-controls",
      "aria-labelledby": controlsTitleId
    }, [
      makeElement(api, "h4", { id: controlsTitleId }, ["操作台"]),
      makeElement(api, "div", { className: "fs-control" }, [
        makeElement(api, "span", { className: "fs-label" }, ["函数预设"]),
        presetGroup
      ]),
      makeElement(api, "div", { className: "fs-control" }, [
        slopeLabel,
        slopeInput
      ]),
      resetButton,
      makeElement(api, "p", { className: "fs-note" }, [
        "滑块是原生 range 控件，可用 Tab 聚焦、左右方向键微调；三组函数、公式和 SVG 几何均为固定确定性计算。"
      ])
    ]);

    var svg = makeSvg(api, "svg", {
      className: "fs-svg",
      viewBox: "0 0 980 480",
      role: "img",
      "aria-labelledby": titleId + " " + descId
    });
    var stageTitle = makeElement(api, "div", { className: "cl-stage-title" }, [
      makeElement(api, "span", {}, ["双图读法"]),
      makeElement(api, "span", { className: "fs-output" }, ["左：支撑线；右：共轭账本"])
    ]);
    var legend = makeElement(api, "div", {
      className: "fs-legend",
      "aria-label": "图例"
    }, [
      makeLegendItem(api, "fs-legend-function", "原函数 f"),
      makeLegendItem(api, "fs-legend-under", "直线 ℓ_s+δ（δ=0 时最高）"),
      makeLegendItem(api, "fs-legend-conjugate", "共轭 f*"),
      makePointLegendItem(api, "接触/当前点")
    ]);
    var sMetric = metric(api, "当前斜率 s");
    var starMetric = metric(api, "f*(s)");
    var interceptMetric = metric(api, "当前线截距 −f*(s)+δ");
    var contactMetric = metric(api, "接触/边界");
    var metrics = makeElement(api, "div", { className: "fs-metrics" }, [
      sMetric.card,
      starMetric.card,
      interceptMetric.card,
      contactMetric.card
    ]);
    refs.sMetric = sMetric.value;
    refs.starMetric = starMetric.value;
    refs.interceptMetric = interceptMetric.value;
    refs.contactMetric = contactMetric.value;
    var formula = makeElement(api, "div", { className: "fs-formula",role:"region",tabindex:0,"aria-label":"共轭公式说明" }, []);
    var status = makeElement(api, "p", {
      className: "fs-status",
      id: statusId,
      "aria-live": "polite"
    }, []);
    var boundary = makeElement(api, "p", { className: "fs-boundary-note" }, []);
    refs.formula = formula;
    refs.status = status;
    refs.boundary = boundary;

    var offsetId=instanceId+"-offset";
    var offsetOutput=makeElement(api,"output",{htmlFor:offsetId,className:"fs-output"},["0"]);
    var offsetInput=makeElement(api,"input",{id:offsetId,type:"range",min:-2,max:2,step:.0001,value:0,"aria-label":"相对最高线的上移量 δ"});
    offsetInput.addEventListener("input",function(){state.offset=Number(offsetInput.value);update();});
    controls.appendChild(makeElement(api,"div",{className:"fs-control"},[
      makeElement(api,"label",{htmlFor:offsetId},["上移量 δ = ",offsetOutput]),offsetInput
    ]));
    var edges=makeElement(api,"div",{className:"fs-preset-buttons",role:"group","aria-label":"检查边界附近"});
    [{label:"略小于 1",s:1-Number.EPSILON/2},{label:"等于 1",s:1},{label:"略大于 1",s:1+Number.EPSILON}].forEach(function(v){
      var button=makeElement(api,"button",{type:"button"},[v.label]);
      button.addEventListener("click",function(){state.s=v.s;updateSlider(getPreset(state.presetId));update();announce("精确存储斜率 s="+String(v.s));});
      edges.appendChild(button);
    });
    controls.appendChild(edges);
    controls.appendChild(makeElement(api,"p",{className:"fs-note"},["δ=0 是最高线，δ>0 向上抬、δ<0 向下移。边界按钮检查 1 两侧非常接近的斜率；完整数值显示在斜率栏。"]));
    var gapMetric=metric(api,"当前线的全局间隙下确界");
    metrics.appendChild(gapMetric.card);

    var stage = makeElement(api, "section", {
      className: "fs-stage",
      "aria-label": "Fenchel 支撑线图"
    }, [
      stageTitle,
      makeElement(api,"p",{className:"fs-note"},["双图保留完整字号。图框可左右滚动，键盘聚焦图框后用方向键查看另一侧。"]),
      makeElement(api, "div", { className: "fs-stage-frame", role:"region",tabindex:0,"aria-label":"可横向滚动的共轭双图" }, [svg]),
      legend,
      metrics,
      formula,
      status,
      boundary
    ]);
    var layout = makeElement(api, "div", { className: "fs-layout" }, [controls, stage]);
    root.appendChild(heading);
    root.appendChild(intro);
    root.appendChild(layout);
    refs.svg = svg;

    function announce(message) {
      if (api && typeof api.announce === "function") {
        api.announce(root, message);
      }
    }

    function updateSlider(preset) {
      slopeInput.setAttribute("min", String(preset.sliderMin));
      slopeInput.setAttribute("max", String(preset.sliderMax));
      slopeInput.setAttribute("step", String(preset.sliderStep));
      slopeInput.value = String(state.s);
    }

    function update() {
      var preset = getPreset(state.presetId);
      var result = evaluate(preset, state.s, state.offset);
      refs.slopeOutput.textContent = String(result.s);
      refs.sMetric.textContent = String(result.s);
      refs.starMetric.textContent = formatNumber(api, result.star, 4);
      refs.interceptMetric.textContent = result.finite
        ? formatNumber(api, result.intercept, 4)
        : "无有限值";
      refs.contactMetric.textContent = result.offset===0 ? contactText(api, result) : "此栏只在 δ=0 描述最高线接触";
      offsetInput.disabled=!result.finite;offsetInput.value=String(state.offset);offsetOutput.textContent=String(state.offset);
      gapMetric.value.textContent=result.finite?formatNumber(api,result.globalGapInfimum,4):"任意有限截距都为 −∞";
      refs.formula.textContent = preset.formulaText + "  当前：" + lineEquation(api, result)+"；显示直线 ℓ(x)=sx−f*(s)+δ，δ="+String(state.offset)+"。";
      refs.status.textContent = result.finite
        ? shiftText(result)
        : "当前斜率在有限域外；f*(s)=+∞，右图不显示有限当前点，左图不显示有限最高支撑线。";
      refs.boundary.textContent = shiftText(result)+" "+(result.offset===0?boundaryText(api,preset,result):"δ 不为零时不标记最高线的接触集；右图共轭值不随 δ 改变。");
      refs.presetButtons.forEach(function (item) {
        item.button.setAttribute("aria-pressed", item.id === preset.id ? "true" : "false");
      });
      drawScene(api, refs.svg, preset, result, titleId, descId);
    }

    slopeInput.addEventListener("input", function () {
      var preset = getPreset(state.presetId);
      var next = Number(slopeInput.value);
      state.s = clamp(Number.isFinite(next) ? next : preset.initialS, preset.sliderMin, preset.sliderMax);
      update();
    });
    slopeInput.addEventListener("change", function () {
      announce("当前" + getPreset(state.presetId).label + "的斜率 s=" + formatNumber(api, state.s, 2));
    });

    updateSlider(PRESETS[0]);
    update();
  }

  function selfTest(){
    var n=0;function ok(v){n++;if(!v)throw new Error("Fenchel self-test "+n);}
    ok(evaluate("quadratic",1.5).star===1.125);
    ok(evaluate("absolute",1).contact.type==="ray");
    ok(evaluate("absolute",1-Number.EPSILON/2).contact.type==="point");
    ok(!evaluate("absolute",1+Number.EPSILON).finite);
    ok(evaluate("softplus",0).contact.type==="asymptotic");
    ok(evaluate("softplus",Number.MIN_VALUE).contact.type==="point");
    ok(!evaluate("softplus",-Number.MIN_VALUE).finite);
    ok(evaluate("softplus",1-Number.EPSILON/2).contact.type==="point");
    ok(!evaluate("softplus",1+Number.EPSILON).finite);
    ok(evaluate("softplus",.5).star===-Math.log(2));
    ok(evaluate("softplus",0,.1).globalGapInfimum===-.1);
    ok(!evaluate("softplus",0,.1).lowerBound);
    ok(evaluate("absolute",0,-.1).lowerBound&&!evaluate("absolute",0,-.1).touches);
    return {checks:n};
  }
  return {PRESETS:PRESETS,getPreset:getPreset,evaluate:evaluate,softplus:softplus,drawScene:drawScene,mount:buildLab,selfTest:selfTest};
}));

(function () {
  "use strict";

  if (
    typeof window === "undefined" ||
    !window.CourseLearning ||
    typeof window.CourseLearning.register !== "function"
  ) {
    return;
  }

  var SVG_NS = "http://www.w3.org/2000/svg";
  var INSTANCE = 0;
  var ALL_PERMUTATIONS = [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0]
  ];

  var PRESETS = [
    {
      key: "regular",
      label: "正规连通三层（C₃）",
      description: "a,b 都是同一个三循环；动作在三点上自由且传递。",
      a: [1, 2, 0],
      b: [1, 2, 0],
      examples: [
        {
          label: "示例：a³（每个 sheet 都闭合）",
          word: ["a", "a", "a"]
        },
        {
          label: "示例：ab⁻¹（动作抵消）",
          word: ["a", "b^-1"]
        }
      ]
    },
    {
      key: "nonnormal",
      label: "非正规连通三层（S₃）",
      description: "a 是三循环、b 是换位；两者生成 S₃，覆盖仍然连通但不正规。",
      a: [1, 2, 0],
      b: [0, 2, 1],
      examples: [
        {
          label: "示例：b（从 s₀ 闭合）",
          word: ["b"]
        },
        {
          label: "示例：ab（从 s₀ 不闭合）",
          word: ["a", "b"]
        },
        {
          label: "示例：a³（回到任意起点）",
          word: ["a", "a", "a"]
        }
      ]
    },
    {
      key: "disconnected",
      label: "断开边界例（2+1）",
      description: "a 只交换 s₀,s₁，b 为恒等；这是三层覆盖，但总空间断开。",
      a: [1, 0, 2],
      b: [0, 1, 2],
      examples: [
        {
          label: "示例：a（在双层组件中换层）",
          word: ["a"]
        },
        {
          label: "示例：a²（回到双层组件起点）",
          word: ["a", "a"]
        },
        {
          label: "示例：b（每个组件都闭合）",
          word: ["b"]
        }
      ]
    }
  ];

  var STYLE_TEXT = [
    ".covering-monodromy-lab { --cm-a: #315f9d; --cm-b: #39734d; --cm-walk: #b26816; --cm-muted: var(--fg-soft, #6f6a60); --cm-panel: var(--bg, #fff); --cm-grid: currentColor; line-height: 1.5; }",
    "html[data-theme='dark'] .covering-monodromy-lab { --cm-a: #83c8ff; --cm-b: #72bd8b; --cm-walk: #f0b35b; --cm-muted: #b8b2a7; }",
    ".covering-monodromy-lab .cm-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; align-items: start; min-width: 0; }",
    ".covering-monodromy-lab .cm-controls, .covering-monodromy-lab .cm-stage { min-width: 0; }",
    ".covering-monodromy-lab .cm-controls { display: grid; gap: 13px; }",
    ".covering-monodromy-lab .cm-control { display: grid; gap: 6px; min-width: 0; }",
    ".covering-monodromy-lab .cm-label, .covering-monodromy-lab .cm-control > span { color: var(--cm-muted); font-size: 13px; font-weight: 650; }",
    ".covering-monodromy-lab select, .covering-monodromy-lab button { min-height: 44px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--fg); font: inherit; line-height: 1.35; }",
    ".covering-monodromy-lab select { width: 100%; padding: 7px 10px; }",
    ".covering-monodromy-lab button { padding: 8px 12px; cursor: pointer; }",
    ".covering-monodromy-lab button:hover { border-color: var(--accent); }",
    ".covering-monodromy-lab button[aria-pressed='true'], .covering-monodromy-lab .cm-primary { background: var(--accent); border-color: var(--accent); color: var(--bg); font-weight: 700; }",
    ".covering-monodromy-lab button:disabled { cursor: not-allowed; opacity: .55; }",
    ".covering-monodromy-lab button:focus-visible, .covering-monodromy-lab select:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
    ".covering-monodromy-lab .cm-sheet-picker { margin: 0; padding: 10px; border: 1px solid var(--border); border-radius: 6px; min-width: 0; }",
    ".covering-monodromy-lab .cm-sheet-picker legend { padding: 0 5px; color: var(--cm-muted); font-size: 13px; font-weight: 650; }",
    ".covering-monodromy-lab .cm-sheet-buttons { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; }",
    ".covering-monodromy-lab .cm-action-row, .covering-monodromy-lab .cm-token-row { display: flex; flex-wrap: wrap; gap: 8px; }",
    ".covering-monodromy-lab .cm-token-row > button { flex: 1 1 60px; font-family: 'SF Mono', Menlo, Consolas, monospace; font-weight: 700; }",
    ".covering-monodromy-lab .cm-action-row > button { flex: 1 1 100px; }",
    ".covering-monodromy-lab .cm-examples { display: grid; gap: 7px; }",
    ".covering-monodromy-lab .cm-examples button { width: 100%; text-align: left; font-size: 12.5px; }",
    ".covering-monodromy-lab .cm-note, .covering-monodromy-lab .cm-boundary { margin: 0; color: var(--cm-muted); font-size: 13px; line-height: 1.65; overflow-wrap: anywhere; }",
    ".covering-monodromy-lab .cm-status { min-height: 3.3em; margin: 0; padding: 10px 12px; border-left: 3px solid var(--cm-walk); background: var(--bg); color: var(--fg); font-size: 13px; line-height: 1.65; }",
    ".covering-monodromy-lab .cm-stage-frame { min-width: 0; padding: 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); overflow-x: hidden; }",
    ".covering-monodromy-lab .cm-stage-title { display: flex; justify-content: space-between; gap: 12px; margin: 0 0 8px; color: var(--cm-muted); font-size: 13px; }",
    ".covering-monodromy-lab .cm-svg { display: block; width: 100%; max-width: 100%; height: auto; min-width: 0; color: var(--fg); }",
    ".covering-monodromy-lab .cm-svg text { fill: currentColor; font-family: inherit; letter-spacing: 0; }",
    ".covering-monodromy-lab .cm-panel { fill: var(--cm-panel); stroke: var(--border); stroke-width: 1.2; }",
    ".covering-monodromy-lab .cm-panel-title { font-size: 16px; font-weight: 700; }",
    ".covering-monodromy-lab .cm-svg-note { fill: var(--cm-muted) !important; font-size: 12px; }",
    ".covering-monodromy-lab .cm-base-a, .covering-monodromy-lab .cm-edge-a { fill: none; stroke: var(--cm-a); }",
    ".covering-monodromy-lab .cm-base-b, .covering-monodromy-lab .cm-edge-b { fill: none; stroke: var(--cm-b); }",
    ".covering-monodromy-lab .cm-base-a, .covering-monodromy-lab .cm-base-b { stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }",
    ".covering-monodromy-lab .cm-edge-a, .covering-monodromy-lab .cm-edge-b { stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; opacity: .86; }",
    ".covering-monodromy-lab .cm-marker-a { fill: var(--cm-a); }",
    ".covering-monodromy-lab .cm-marker-b { fill: var(--cm-b); }",
    ".covering-monodromy-lab .cm-marker-walk { fill: var(--cm-walk); }",
    ".covering-monodromy-lab .cm-base-point, .covering-monodromy-lab .cm-node { fill: var(--cm-panel); stroke: var(--fg); stroke-width: 2; }",
    ".covering-monodromy-lab .cm-base-point { stroke: var(--cm-walk); stroke-width: 3; }",
    ".covering-monodromy-lab .cm-node-label { font-size: 15px; font-weight: 700; text-anchor: middle; dominant-baseline: central; }",
    ".covering-monodromy-lab .cm-edge-label-a { fill: var(--cm-a) !important; font-size: 12px; font-weight: 700; }",
    ".covering-monodromy-lab .cm-edge-label-b { fill: var(--cm-b) !important; font-size: 12px; font-weight: 700; }",
    ".covering-monodromy-lab .cm-walk { fill: none; stroke: var(--cm-walk); stroke-width: 6; stroke-linecap: round; stroke-linejoin: round; opacity: .94; }",
    ".covering-monodromy-lab .cm-walk-index { fill: var(--cm-walk) !important; font-size: 11px; font-weight: 800; }",
    ".covering-monodromy-lab .cm-start-ring { fill: none; stroke: var(--cm-a); stroke-width: 2; stroke-dasharray: 5 4; }",
    ".covering-monodromy-lab .cm-current-ring { fill: none; stroke: var(--cm-walk); stroke-width: 3; }",
    ".covering-monodromy-lab .cm-legend-line-a { stroke: var(--cm-a); stroke-width: 4; }",
    ".covering-monodromy-lab .cm-legend-line-b { stroke: var(--cm-b); stroke-width: 4; }",
    ".covering-monodromy-lab .cm-legend-line-walk { stroke: var(--cm-walk); stroke-width: 5; }",
    ".covering-monodromy-lab .cm-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(125px, 1fr)); gap: 8px; margin-top: 12px; }",
    ".covering-monodromy-lab .cm-metric { min-width: 0; padding: 9px 10px; border-top: 2px solid var(--border); background: var(--bg); }",
    ".covering-monodromy-lab .cm-metric span { display: block; color: var(--cm-muted); font-size: 11.5px; line-height: 1.4; }",
    ".covering-monodromy-lab .cm-metric strong { display: block; margin-top: 3px; color: var(--fg); font-size: 15px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }",
    ".covering-monodromy-lab .cm-formula { margin-top: 10px; padding: 9px 11px; border-left: 3px solid var(--accent); background: var(--bg); font-family: 'SF Mono', Menlo, Consolas, monospace; font-size: 12.5px; line-height: 1.65; overflow-wrap: anywhere; }",
    ".covering-monodromy-lab .cm-ledger-wrap { margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border); }",
    ".covering-monodromy-lab .cm-ledger-title { margin: 0 0 7px; color: var(--cm-muted); font-size: 13px; font-weight: 700; }",
    ".covering-monodromy-lab .cm-ledger { display: grid; gap: 5px; margin: 0; padding: 0; list-style: none; font-family: 'SF Mono', Menlo, Consolas, monospace; font-size: 12.5px; }",
    ".covering-monodromy-lab .cm-ledger li { display: grid; grid-template-columns: 34px minmax(0, 1fr); gap: 7px; align-items: center; min-width: 0; }",
    ".covering-monodromy-lab .cm-ledger .cm-step-no { color: var(--cm-muted); }",
    ".covering-monodromy-lab .cm-ledger .cm-step { padding: 6px 7px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg); overflow-wrap: anywhere; }",
    ".covering-monodromy-lab .cm-ledger .cm-from, .covering-monodromy-lab .cm-ledger .cm-to { font-weight: 700; }",
    ".covering-monodromy-lab .cm-ledger .cm-arrow { color: var(--cm-walk); padding: 0 5px; }",
    ".covering-monodromy-lab .cm-summary { margin-top: 12px; padding: 10px 12px; border: 1px solid var(--border); background: var(--bg); color: var(--fg); font-size: 13px; line-height: 1.65; overflow-wrap: anywhere; }",
    ".covering-monodromy-lab .cm-summary strong { color: var(--accent); }",
    "@media (max-width: 560px) { .covering-monodromy-lab .cm-stage-frame { overflow-x: auto; -webkit-overflow-scrolling: touch; } .covering-monodromy-lab .cm-svg { width: 920px; max-width: none; } .covering-monodromy-lab .cm-stage-title { align-items: flex-start; flex-direction: column; gap: 2px; } }",
    "@media (prefers-reduced-motion: reduce) { .covering-monodromy-lab * { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }"
  ].join("\n");

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
      } else if (key === "text") {
        node.textContent = String(value);
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

  function injectStyles() {
    if (document.getElementById("covering-monodromy-lab-styles")) {
      return;
    }
    var style = document.createElement("style");
    style.id = "covering-monodromy-lab-styles";
    style.textContent = STYLE_TEXT;
    document.head.appendChild(style);
  }

  function inversePermutation(permutation) {
    var inverse = [];
    permutation.forEach(function (target, source) {
      inverse[target] = source;
    });
    return inverse;
  }

  function permutationKey(permutation) {
    return permutation.join("");
  }

  function samePermutation(left, right) {
    return permutationKey(left) === permutationKey(right);
  }

  function containsPermutation(list, permutation) {
    var key = permutationKey(permutation);
    var found = false;
    list.forEach(function (item) {
      if (permutationKey(item) === key) {
        found = true;
      }
    });
    return found;
  }

  function compose(left, right) {
    var result = [];
    right.forEach(function (value) {
      result.push(left[value]);
    });
    return result;
  }

  function generateGroup(preset) {
    var generators = [
      preset.a,
      preset.b,
      inversePermutation(preset.a),
      inversePermutation(preset.b)
    ];
    var group = [[0, 1, 2]];
    var index = 0;
    while (index < group.length) {
      var current = group[index];
      index += 1;
      generators.forEach(function (generator) {
        var next = compose(current, generator);
        if (!containsPermutation(group, next)) {
          group.push(next);
        }
      });
    }
    return group;
  }

  function commutes(left, right) {
    var leftRight = compose(left, right);
    var rightLeft = compose(right, left);
    return samePermutation(leftRight, rightLeft);
  }

  function centralizerSize(preset) {
    var size = 0;
    ALL_PERMUTATIONS.forEach(function (candidate) {
      if (commutes(candidate, preset.a) && commutes(candidate, preset.b)) {
        size += 1;
      }
    });
    return size;
  }

  function computeOrbits(preset) {
    var visited = [false, false, false];
    var orbits = [];
    var permutations = [
      preset.a,
      preset.b,
      inversePermutation(preset.a),
      inversePermutation(preset.b)
    ];
    var start;
    for (start = 0; start < 3; start += 1) {
      if (visited[start]) {
        continue;
      }
      var orbit = [];
      var queue = [start];
      visited[start] = true;
      while (queue.length) {
        var current = queue.shift();
        orbit.push(current);
        permutations.forEach(function (permutation) {
          var next = permutation[current];
          if (!visited[next]) {
            visited[next] = true;
            queue.push(next);
          }
        });
      }
      orbit.sort(function (left, right) { return left - right; });
      orbits.push(orbit);
    }
    return orbits;
  }

  function computeAnalysis(preset, selected) {
    var group = generateGroup(preset);
    var orbits = computeOrbits(preset);
    var stabilizerSize = 0;
    group.forEach(function (permutation) {
      if (permutation[selected] === selected) {
        stabilizerSize += 1;
      }
    });
    var selectedOrbit = [];
    orbits.forEach(function (orbit) {
      if (orbit.indexOf(selected) !== -1) {
        selectedOrbit = orbit;
      }
    });
    var connected = orbits.length === 1;
    var normal = connected && stabilizerSize === 1;
    return {
      group: group,
      groupOrder: group.length,
      orbits: orbits,
      selectedOrbit: selectedOrbit,
      connected: connected,
      normal: normal,
      stabilizerSize: stabilizerSize,
      deckOrder: connected ? centralizerSize(preset) : null
    };
  }

  function groupName(order) {
    if (order === 1) {
      return "1";
    }
    if (order === 2) {
      return "C₂";
    }
    if (order === 3) {
      return "C₃";
    }
    if (order === 6) {
      return "S₃";
    }
    return "|M|=" + order;
  }

  function cycleNotation(permutation) {
    var visited = [false, false, false];
    var cycles = [];
    var start;
    for (start = 0; start < permutation.length; start += 1) {
      if (visited[start]) {
        continue;
      }
      var cycle = [start];
      visited[start] = true;
      var next = permutation[start];
      while (next !== start) {
        cycle.push(next);
        visited[next] = true;
        next = permutation[next];
      }
      if (cycle.length > 1) {
        cycles.push("(" + cycle.join("") + ")");
      }
    }
    return cycles.length ? cycles.join("") : "e";
  }

  function applyToken(preset, sheet, token) {
    var generator = token.charAt(0);
    var permutation = preset[generator];
    if (!permutation) {
      return sheet;
    }
    if (token.slice(1) === "^-1") {
      return inversePermutation(permutation)[sheet];
    }
    return permutation[sheet];
  }

  function tokenLabel(token) {
    if (token === "a^-1") {
      return "a⁻¹";
    }
    if (token === "b^-1") {
      return "b⁻¹";
    }
    return token;
  }

  function wordLabel(word) {
    if (!word.length) {
      return "空词 e";
    }
    return word.map(tokenLabel).join(" ");
  }

  function computePath(preset, start, word) {
    var current = start;
    var sheets = [start];
    var steps = [];
    word.forEach(function (token) {
      var next = applyToken(preset, current, token);
      steps.push({ token: token, from: current, to: next });
      current = next;
      sheets.push(current);
    });
    return {
      start: start,
      final: current,
      sheets: sheets,
      steps: steps,
      closed: current === start
    };
  }

  function orbitLabel(orbits) {
    return orbits.map(function (orbit) {
      return "{" + orbit.join(",") + "}";
    }).join(" ⊔ ");
  }

  function edgePath(nodes, from, to, kind, reverse) {
    var start = nodes[from];
    var end = nodes[to];
    if (from === to) {
      var direction = kind === "a" ? -1 : 1;
      if (reverse) {
        return "M " + (start.x + 14) + " " + (start.y - 20) +
          " C " + (start.x - direction * 62) + " " + (start.y - 92) +
          " " + (start.x + direction * 62) + " " + (start.y - 92) +
          " " + (start.x - 14) + " " + (start.y - 20);
      }
      return "M " + (start.x - 14) + " " + (start.y - 20) +
        " C " + (start.x + direction * 62) + " " + (start.y - 92) +
        " " + (start.x - direction * 62) + " " + (start.y - 92) +
        " " + (start.x + 14) + " " + (start.y - 20);
    }
    var geometryStart = reverse ? end : start;
    var geometryEnd = reverse ? start : end;
    var dx = geometryEnd.x - geometryStart.x;
    var dy = geometryEnd.y - geometryStart.y;
    var length = Math.sqrt(dx * dx + dy * dy) || 1;
    var normalX = -dy / length;
    var normalY = dx / length;
    var offset = kind === "a" ? 25 : -25;
    var midX = (geometryStart.x + geometryEnd.x) / 2 + normalX * offset;
    var midY = (geometryStart.y + geometryEnd.y) / 2 + normalY * offset;
    return "M " + start.x + " " + start.y +
      " Q " + midX + " " + midY + " " + end.x + " " + end.y;
  }

  function edgeLabelPoint(nodes, from, to, kind, reverse) {
    if (from === to) {
      return {
        x: nodes[from].x + (kind === "a" ? -48 : 48),
        y: nodes[from].y - 82
      };
    }
    var start = nodes[from];
    var end = nodes[to];
    var geometryStart = reverse ? end : start;
    var geometryEnd = reverse ? start : end;
    var dx = geometryEnd.x - geometryStart.x;
    var dy = geometryEnd.y - geometryStart.y;
    var length = Math.sqrt(dx * dx + dy * dy) || 1;
    var normalX = -dy / length;
    var normalY = dx / length;
    var offset = kind === "a" ? 31 : -31;
    return {
      x: (geometryStart.x + geometryEnd.x) / 2 + normalX * offset,
      y: (geometryStart.y + geometryEnd.y) / 2 + normalY * offset
    };
  }

  function svgText(api, x, y, text, className, attrs) {
    var options = attrs || {};
    options.x = x;
    options.y = y;
    if (className) {
      options.className = className;
    }
    return makeSvg(api, "text", options, [text]);
  }

  function drawArrowMarker(api, defs, id, className) {
    var marker = makeSvg(api, "marker", {
      id: id,
      markerWidth: "10",
      markerHeight: "10",
      refX: "8",
      refY: "4",
      orient: "auto",
      markerUnits: "userSpaceOnUse",
      viewBox: "0 0 10 8"
    });
    marker.appendChild(makeSvg(api, "path", {
      d: "M 0 0 L 10 4 L 0 8 Z",
      className: className
    }));
    defs.appendChild(marker);
  }

  function drawBaseSpace(api, svg) {
    var baseX = 22;
    var baseY = 32;
    svg.appendChild(makeSvg(api, "rect", {
      x: baseX,
      y: baseY,
      width: "330",
      height: "486",
      rx: "8",
      className: "cm-panel"
    }));
    svg.appendChild(svgText(api, 45, 65, "基空间 R₂ = a ∨ b", "cm-panel-title"));
    svg.appendChild(svgText(api, 45, 88, "两瓣玫瑰：每个生成回路都从尖点出发", "cm-svg-note"));

    svg.appendChild(makeSvg(api, "path", {
      d: "M 188 274 C 95 126 42 392 188 274",
      className: "cm-base-a",
      "marker-end": "url(#cm-arrow-a)"
    }));
    svg.appendChild(makeSvg(api, "path", {
      d: "M 192 274 C 285 126 338 392 192 274",
      className: "cm-base-b",
      "marker-end": "url(#cm-arrow-b)"
    }));
    svg.appendChild(makeSvg(api, "circle", {
      cx: "190",
      cy: "274",
      r: "9",
      className: "cm-base-point"
    }));
    svg.appendChild(svgText(api, 102, 183, "a", "cm-edge-label-a"));
    svg.appendChild(svgText(api, 278, 183, "b", "cm-edge-label-b"));
    svg.appendChild(svgText(api, 205, 266, "x₀", "cm-svg-note"));
    svg.appendChild(svgText(api, 45, 482, "回路词在这里被提升，再由纤维动作记录终点", "cm-svg-note"));
  }

  function drawCoverGraph(api, svg, preset, path, analysis) {
    var nodes = [
      { x: 740, y: 174 },
      { x: 570, y: 380 },
      { x: 910, y: 380 }
    ];
    var kinds = ["a", "b"];
    svg.appendChild(makeSvg(api, "rect", {
      x: "375",
      y: "32",
      width: "703",
      height: "486",
      rx: "8",
      className: "cm-panel"
    }));
    svg.appendChild(svgText(api, 398, 65, "三层 Schreier / 覆盖图", "cm-panel-title"));
    svg.appendChild(svgText(
      api,
      398,
      89,
      "每个节点是一个纤维点；彩色箭头是生成回路的提升动作",
      "cm-svg-note"
    ));
    svg.appendChild(svgText(
      api,
      815,
      65,
      "σₐ = " + cycleNotation(preset.a) + "   σᵦ = " + cycleNotation(preset.b),
      "cm-svg-note",
      { "text-anchor": "middle" }
    ));

    kinds.forEach(function (kind) {
      var permutation = preset[kind];
      var edgeIndex;
      for (edgeIndex = 0; edgeIndex < 3; edgeIndex += 1) {
        var target = permutation[edgeIndex];
        var point = edgeLabelPoint(nodes, edgeIndex, target, kind);
        svg.appendChild(makeSvg(api, "path", {
          d: edgePath(nodes, edgeIndex, target, kind),
          className: "cm-edge-" + kind,
          "marker-end": "url(#cm-arrow-" + kind + ")"
        }));
        svg.appendChild(svgText(
          api,
          point.x,
          point.y,
          kind,
          "cm-edge-label-" + kind,
          { "text-anchor": "middle" }
        ));
      }
    });

    path.steps.forEach(function (step, stepIndex) {
      var kind = step.token.charAt(0);
      var reverse = step.token.slice(1) === "^-1";
      var point = edgeLabelPoint(nodes, step.from, step.to, kind, reverse);
      svg.appendChild(makeSvg(api, "path", {
        d: edgePath(nodes, step.from, step.to, kind, reverse),
        className: "cm-walk",
        "marker-end": "url(#cm-arrow-walk)"
      }));
      svg.appendChild(svgText(
        api,
        point.x + 7,
        point.y + 8,
        String(stepIndex + 1),
        "cm-walk-index",
        { "text-anchor": "middle" }
      ));
    });

    nodes.forEach(function (node, index) {
      svg.appendChild(makeSvg(api, "circle", {
        cx: node.x,
        cy: node.y,
        r: "29",
        className: "cm-node"
      }));
      if (index === path.start) {
        svg.appendChild(makeSvg(api, "circle", {
          cx: node.x,
          cy: node.y,
          r: "38",
          className: "cm-start-ring"
        }));
      }
      if (index === path.final) {
        svg.appendChild(makeSvg(api, "circle", {
          cx: node.x,
          cy: node.y,
          r: "46",
          className: "cm-current-ring"
        }));
      }
      svg.appendChild(svgText(api, node.x, node.y, "s" + index, "cm-node-label"));
    });

    svg.appendChild(svgText(
      api,
      740,
      474,
      "虚线外环 = 选定起点 s" + path.start +
        "；橙色外环 = 当前 sheet s" + path.final,
      "cm-svg-note",
      { "text-anchor": "middle" }
    ));
    svg.appendChild(svgText(
      api,
      398,
      500,
      "轨道： " + orbitLabel(analysis.orbits) +
        "   |   monodromy image M ≅ " + groupName(analysis.groupOrder),
      "cm-svg-note"
    ));
  }

  function drawScene(api, svg, preset, path, analysis, ids) {
    clear(svg);
    svg.appendChild(makeSvg(api, "title", { id: ids.title }, [
      "两瓣玫瑰的三层 monodromy 覆盖图"
    ]));
    svg.appendChild(makeSvg(api, "desc", { id: ids.desc }, [
      "左侧为带 a、b 颜色标记的两瓣玫瑰基空间，右侧为三个纤维点组成的 Schreier 覆盖图。"
        + "橙色路径显示当前词，虚线外环是选定 sheet，橙色外环是当前 sheet。"
    ]));
    var defs = makeSvg(api, "defs");
    drawArrowMarker(api, defs, "cm-arrow-a", "cm-marker-a");
    drawArrowMarker(api, defs, "cm-arrow-b", "cm-marker-b");
    drawArrowMarker(api, defs, "cm-arrow-walk", "cm-marker-walk");
    svg.appendChild(defs);
    drawBaseSpace(api, svg);
    drawCoverGraph(api, svg, preset, path, analysis);
    svg.appendChild(makeSvg(api, "line", {
      x1: "405",
      y1: "540",
      x2: "435",
      y2: "540",
      className: "cm-legend-line-a"
    }));
    svg.appendChild(svgText(api, 442, 544, "a 边", "cm-edge-label-a"));
    svg.appendChild(makeSvg(api, "line", {
      x1: "505",
      y1: "540",
      x2: "535",
      y2: "540",
      className: "cm-legend-line-b"
    }));
    svg.appendChild(svgText(api, 542, 544, "b 边", "cm-edge-label-b"));
    svg.appendChild(makeSvg(api, "line", {
      x1: "605",
      y1: "540",
      x2: "635",
      y2: "540",
      className: "cm-legend-line-walk"
    }));
    svg.appendChild(svgText(api, 642, 544, "已走路径", "cm-svg-note"));
  }

  function renderLedger(api, node, path) {
    clear(node);
    if (!path.steps.length) {
      node.appendChild(makeElement(api, "p", {
        className: "cm-note"
      }, ["空词：当前 sheet 仍是选定起点。"]));
      return;
    }
    var list = makeElement(api, "ol", {
      className: "cm-ledger",
      "aria-label": "逐步路径账本"
    });
    path.steps.forEach(function (step, index) {
      var row = makeElement(api, "li", {}, [
        makeElement(api, "span", {
          className: "cm-step-no",
          "aria-hidden": "true"
        }, ["#" + (index + 1)]),
        makeElement(api, "span", { className: "cm-step" }, [
          makeElement(api, "span", { className: "cm-from" }, ["s" + step.from]),
          makeElement(api, "span", { className: "cm-arrow" }, [
            " —" + tokenLabel(step.token) + "→ "
          ]),
          makeElement(api, "span", { className: "cm-to" }, ["s" + step.to])
        ])
      ]);
      list.appendChild(row);
    });
    node.appendChild(list);
  }

  function metric(api, label) {
    var value = makeElement(api, "strong", {}, ["—"]);
    return {
      node: makeElement(api, "div", { className: "cm-metric" }, [
        makeElement(api, "span", {}, [label]),
        value
      ]),
      value: value
    };
  }

  function buildLab(root, api) {
    if (!root || typeof document === "undefined") {
      return;
    }
    injectStyles();
    root.classList.add("covering-monodromy-lab");
    clear(root);

    var instance = INSTANCE;
    INSTANCE += 1;
    var ids = {
      heading: "cm-heading-" + instance,
      title: "cm-svg-title-" + instance,
      desc: "cm-svg-desc-" + instance,
      preset: "cm-preset-" + instance
    };
    var state = {
      presetIndex: 0,
      start: 0,
      word: []
    };
    var refs = {};

    root.setAttribute("aria-labelledby", ids.heading);
    root.appendChild(makeElement(api, "h3", {
      id: ids.heading
    }, ["Monodromy 实验：三层覆盖的路径账本"]));
    root.appendChild(makeElement(api, "p", {
      className: "cm-note"
    }, [
      "把每次绕 a、b 的提升终点看成纤维上的置换。这里固定右作用并从左到右读词：先点 a 再点 b，就是先走 σₐ 再走 σᵦ。"
    ]));

    var layout = makeElement(api, "div", { className: "cm-grid" });
    var controls = makeElement(api, "div", {
      className: "cm-controls"
    });
    var stage = makeElement(api, "div", { className: "cm-stage" });
    layout.appendChild(controls);
    layout.appendChild(stage);
    root.appendChild(layout);

    var presetSelect = makeElement(api, "select", {
      id: ids.preset,
      "aria-label": "选择三层覆盖预设"
    });
    PRESETS.forEach(function (preset, index) {
      presetSelect.appendChild(makeElement(api, "option", {
        value: String(index)
      }, [preset.label]));
    });
    controls.appendChild(makeElement(api, "label", {
      className: "cm-control",
      htmlFor: ids.preset
    }, [
      makeElement(api, "span", { className: "cm-label" }, ["覆盖预设"]),
      presetSelect
    ]));
    refs.presetSelect = presetSelect;

    var sheetFieldset = makeElement(api, "fieldset", {
      className: "cm-sheet-picker"
    });
    sheetFieldset.appendChild(makeElement(api, "legend", {}, [
      "选定提升起点（得到共轭的 H 代表；正规时可能相同）"
    ]));
    var sheetButtons = makeElement(api, "div", {
      className: "cm-sheet-buttons"
    });
    refs.sheetButtons = [];
    [0, 1, 2].forEach(function (sheet) {
      var button = makeElement(api, "button", {
        type: "button",
        "aria-pressed": sheet === 0 ? "true" : "false",
        "aria-label": "选择纤维点 s" + sheet
      }, ["s" + sheet]);
      button.addEventListener("click", function () {
        state.start = sheet;
        update("已把提升起点换为 s" + sheet);
      });
      refs.sheetButtons.push(button);
      sheetButtons.appendChild(button);
    });
    sheetFieldset.appendChild(sheetButtons);
    controls.appendChild(sheetFieldset);

    controls.appendChild(makeElement(api, "div", {
      className: "cm-control"
    }, [
      makeElement(api, "span", { className: "cm-label" }, [
        "逐字输入回路词（monodromy 动作）"
      ])
    ]));
    var tokenRow = makeElement(api, "div", {
      className: "cm-token-row",
      role: "group",
      "aria-label": "输入回路生成字"
    });
    ["a", "a^-1", "b", "b^-1"].forEach(function (token) {
      var button = makeElement(api, "button", {
        type: "button",
        title: "输入 " + tokenLabel(token),
        "aria-label": "输入 " + tokenLabel(token)
      }, [tokenLabel(token)]);
      button.addEventListener("click", function () {
        state.word.push(token);
        update("已输入 " + tokenLabel(token));
      });
      tokenRow.appendChild(button);
    });
    controls.appendChild(tokenRow);

    var actionRow = makeElement(api, "div", {
      className: "cm-action-row"
    });
    var undoButton = makeElement(api, "button", {
      type: "button",
      "aria-label": "撤销最后一个字"
    }, ["撤销"]);
    var clearButton = makeElement(api, "button", {
      type: "button",
      "aria-label": "清空当前回路词"
    }, ["清空"]);
    undoButton.addEventListener("click", function () {
      if (state.word.length) {
        var removed = state.word.pop();
        update("已撤销 " + tokenLabel(removed));
      }
    });
    clearButton.addEventListener("click", function () {
      state.word = [];
      update("词已清空");
    });
    actionRow.appendChild(undoButton);
    actionRow.appendChild(clearButton);
    controls.appendChild(actionRow);
    refs.undoButton = undoButton;

    var exampleTitle = makeElement(api, "span", {
      className: "cm-label"
    }, ["示例词"]);
    var examples = makeElement(api, "div", {
      className: "cm-examples",
      role: "group",
      "aria-label": "装入示例回路词"
    });
    controls.appendChild(exampleTitle);
    controls.appendChild(examples);
    refs.examples = examples;

    controls.appendChild(makeElement(api, "p", {
      className: "cm-boundary"
    }, [
      "提示：闭合只问“是否回到选定 sheet”。换起点会重新计算同一个词；断开预设中，选定 sheet 只看到它所在的连通分支。"
    ]));

    var status = makeElement(api, "p", {
      className: "cm-status",
      role: "status",
      "aria-live": "polite",
      "aria-atomic": "true"
    }, ["正在加载实验…"]);
    stage.appendChild(status);
    refs.status = status;

    var stageFrame = makeElement(api, "div", {
      className: "cm-stage-frame"
    });
    stageFrame.appendChild(makeElement(api, "div", {
      className: "cm-stage-title"
    }, [
      makeElement(api, "span", {}, ["左：基空间；右：三层 Schreier 图"]),
      makeElement(api, "span", {}, ["不使用动画，橙色即当前词"])
    ]));
    var svg = makeSvg(api, "svg", {
      className: "cm-svg",
      viewBox: "0 0 1100 560",
      role: "img",
      "aria-labelledby": ids.title + " " + ids.desc
    });
    stageFrame.appendChild(svg);
    stage.appendChild(stageFrame);
    refs.svg = svg;

    var metrics = makeElement(api, "div", { className: "cm-metrics" });
    var wordMetric = metric(api, "当前词");
    var currentMetric = metric(api, "最终 sheet");
    var closedMetric = metric(api, "闭合？");
    var connectedMetric = metric(api, "连通性");
    var normalMetric = metric(api, "正规性");
    var deckMetric = metric(api, "甲板群摘要");
    [wordMetric, currentMetric, closedMetric, connectedMetric, normalMetric, deckMetric]
      .forEach(function (item) { metrics.appendChild(item.node); });
    stage.appendChild(metrics);
    refs.wordMetric = wordMetric.value;
    refs.currentMetric = currentMetric.value;
    refs.closedMetric = closedMetric.value;
    refs.connectedMetric = connectedMetric.value;
    refs.normalMetric = normalMetric.value;
    refs.deckMetric = deckMetric.value;

    var formula = makeElement(api, "div", {
      className: "cm-formula",
      "aria-label": "当前单值化公式"
    }, ["sᵢ · w = sᵢ · (逐字应用 σₐ、σᵦ)"]);
    stage.appendChild(formula);
    refs.formula = formula;

    var ledgerWrap = makeElement(api, "div", {
      className: "cm-ledger-wrap"
    });
    ledgerWrap.appendChild(makeElement(api, "h4", {
      className: "cm-ledger-title"
    }, ["路径账本"]));
    var ledger = makeElement(api, "div", {
      "aria-label": "当前词的路径账本"
    });
    ledgerWrap.appendChild(ledger);
    stage.appendChild(ledgerWrap);
    refs.ledger = ledger;

    var summary = makeElement(api, "div", {
      className: "cm-summary",
      "aria-label": "覆盖分类摘要"
    }, [""]);
    stage.appendChild(summary);
    refs.summary = summary;

    function update(reason) {
      var preset = PRESETS[state.presetIndex];
      var path = computePath(preset, state.start, state.word);
      var analysis = computeAnalysis(preset, state.start);
      var connectedText = analysis.connected
        ? "是（单轨道）"
        : "否（" + analysis.orbits.length + " 个轨道）";
      var closedText = path.closed
        ? "是：w∈Hₛ" + state.start
        : "否：w∉Hₛ" + state.start;
      var normalText;
      var deckText;
      if (!analysis.connected) {
        normalText = "不适用（先分组件）";
        deckText = "按组件读";
      } else if (analysis.normal) {
        normalText = "是（H ◁ F₂）";
        deckText = "N(H)/H ≅ " + groupName(analysis.deckOrder);
      } else {
        normalText = "否（H 非正规）";
        deckText = "N(H)/H ≅ " + groupName(analysis.deckOrder);
      }

      refs.presetSelect.value = String(state.presetIndex);
      refs.sheetButtons.forEach(function (button, index) {
        button.setAttribute(
          "aria-pressed",
          index === state.start ? "true" : "false"
        );
      });
      refs.undoButton.disabled = state.word.length === 0;
      refs.wordMetric.textContent = wordLabel(state.word);
      refs.currentMetric.textContent = "s" + path.final;
      refs.closedMetric.textContent = closedText;
      refs.connectedMetric.textContent = connectedText;
      refs.normalMetric.textContent = normalText;
      refs.deckMetric.textContent = deckText;
      refs.formula.textContent =
        "s" + state.start + " · " + wordLabel(state.word) +
        " = s" + path.final +
        "；闭合判据：s" + path.final + " = s" + state.start +
        " ⇔ w∈Hₛ" + state.start;
      refs.status.textContent =
        preset.label + "。从 s" + state.start + " 读词 " +
        wordLabel(state.word) + "，当前在 s" + path.final + "。" +
        (path.closed
          ? " 回到了选定 sheet，因此 w∈Hₛ" + state.start + "。"
          : " 尚未回到选定 sheet，因此 w∉Hₛ" + state.start + "。");
      renderLedger(api, refs.ledger, path);
      clear(refs.examples);
      preset.examples.forEach(function (example) {
        var exampleButton = makeElement(api, "button", {
          type: "button",
          title: "装入示例词 " + wordLabel(example.word)
        }, [example.label]);
        exampleButton.addEventListener("click", function () {
          state.word = example.word.slice();
          update("已装入示例词 " + wordLabel(state.word));
        });
        refs.examples.appendChild(exampleButton);
      });
      refs.summary.textContent =
        "预设说明：" + preset.description +
        "  置换生成的 monodromy image M ≅ " + groupName(analysis.groupOrder) +
        "；轨道为 " + orbitLabel(analysis.orbits) + "。" +
        (analysis.connected
          ? " 选定 s" + state.start + " 的稳定子就是 Hₛ" + state.start +
            "，甲板群按一般公式 N(H)/H 读取。"
          : " 整体不是连通覆盖分类对象；选定 s" + state.start +
            " 只代表轨道大小为 " + analysis.selectedOrbit.length +
            " 的连通分支。");
      drawScene(api, refs.svg, preset, path, analysis, ids);
      if (reason && api && typeof api.announce === "function") {
        api.announce(root, reason + "；最终在 s" + path.final + "。");
      }
    }

    presetSelect.addEventListener("change", function () {
      var next = parseInt(presetSelect.value, 10);
      if (isNaN(next) || next < 0 || next >= PRESETS.length) {
        next = 0;
      }
      state.presetIndex = next;
      state.start = 0;
      state.word = [];
      update("已切换覆盖预设");
    });

    update();
  }

  window.CourseLearning.register("covering-monodromy", buildLab);
}());

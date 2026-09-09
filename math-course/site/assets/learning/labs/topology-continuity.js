(function (root, factory) {
  "use strict";

  var exported = factory();
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("topology-continuity", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module && process.argv.indexOf("--self-test") !== -1) {
    try {
      var report = exported.selfTest();
      console.log("topology-continuity self-test: PASS (" + report.checks + " checks, " + report.presets + " presets)");
    } catch (error) {
      console.error("topology-continuity self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "topology-continuity-lab-styles";
  var INSTANCE = 0;

  /* Masks make every finite set operation explicit and deterministic. */
  var PRESETS = [
    {
      id: "sierpinski-to-discrete",
      label: "Sierpiński → 离散",
      kind: "map",
      description: "同一个集合、同一个恒等函数；只改变两端拓扑。",
      points: ["a", "b"],
      sourceOpenSets: [0, 1, 3],
      targetOpenSets: [0, 1, 2, 3],
      map: [0, 1],
      expected: "not-continuous",
      question: "恒等映射 f 的原像检验会给出什么？",
      options: [["continuous", "连续"], ["not-continuous", "不连续"]]
    },
    {
      id: "discrete-to-sierpinski",
      label: "离散 → Sierpiński",
      kind: "map",
      description: "反向恒等函数：离散源空间让每个原像都开。",
      points: ["a", "b"],
      sourceOpenSets: [0, 1, 2, 3],
      targetOpenSets: [0, 1, 3],
      map: [0, 1],
      expected: "continuous",
      question: "恒等映射 f 的原像检验会给出什么？",
      options: [["continuous", "连续"], ["not-continuous", "不连续"]]
    },
    {
      id: "quotient-fibers",
      label: "商空间：粘合纤维",
      kind: "quotient",
      description: "把 a₀、a₁ 粘成 A；下方开集由饱和原像决定。",
      points: ["a₀", "a₁", "b"],
      sourceOpenSets: [0, 3, 7],
      quotientPoints: ["A", "B"],
      quotientMap: [0, 0, 1],
      expected: "open",
      question: "商空间中的 {A} 是否开？",
      options: [["open", "是，开"], ["not-open", "否，不开"]]
    },
    {
      id: "product-sierpinski",
      label: "积空间：开矩形基",
      kind: "product",
      description: "两个 Sierpiński 空间的积；先列开矩形，再取并。",
      xPoints: ["0", "1"],
      xOpenSets: [0, 1, 3],
      yPoints: ["L", "R"],
      yOpenSets: [0, 1, 3],
      expected: "yes",
      question: "积集合 {0×L, 0×R, 1×L} 是否开？它本身不是一个矩形。",
      options: [["yes", "是：可由矩形取并"], ["no", "否：不是开集"]]
    }
  ];

  var STYLE_TEXT = [
    ".tc-lab svg .tc-point + text{fill:#fff}[data-theme=dark] .tc-lab svg .tc-point + text{fill:var(--bg,#191c22)}",
    ".tc-lab .tc-workbench{min-width:0;margin-top:20px;padding:12px;border:1px solid var(--border)}.tc-lab .tc-work-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.tc-lab .tc-work-controls label{min-width:0}.tc-lab select{width:100%;max-width:100%;min-width:0;min-height:44px;font:inherit;color:var(--fg);background:var(--bg);border:1px solid var(--border);padding:6px}.tc-lab select:focus-visible,.tc-lab [role=region]:focus-visible{outline:3px solid var(--tc-blue);outline-offset:2px}.tc-lab .tc-preimage-bad{fill:var(--tc-red);fill-opacity:.18;stroke:var(--tc-red);stroke-width:1.5}",
    ".tc-lab{--tc-blue:var(--cl-blue,#315f9d);--tc-green:var(--cl-green,#39734d);--tc-gold:var(--cl-gold,#9b6a12);--tc-red:var(--cl-red,#b64335);max-width:100%;min-width:0;color:var(--fg,#292722);line-height:1.55;overflow-wrap:anywhere}",
    ".tc-lab *,.tc-lab *::before,.tc-lab *::after{box-sizing:border-box}.tc-lab [hidden]{display:none!important}.tc-lab h3,.tc-lab h4{margin:0;letter-spacing:0;color:var(--fg,#292722)}.tc-lab h3{font-size:1.12rem}.tc-lab h4{font-size:1rem}.tc-lab p{margin:8px 0}.tc-lab .tc-note,.tc-lab .tc-feedback{color:var(--fg-soft,var(--muted,#6b6557));font-size:13px;line-height:1.65}",
    ".tc-lab button{font:inherit;min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);color:inherit;line-height:1.35;cursor:pointer;overflow-wrap:anywhere}.tc-lab button:hover{border-color:var(--tc-blue)}.tc-lab button:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.tc-lab button[aria-pressed=true],.tc-lab .tc-primary{border-color:var(--tc-blue);background:var(--tc-blue);color:var(--bg,#fff);font-weight:750}.tc-lab .tc-presets{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:10px 0 14px}.tc-lab .tc-presets button{font-size:12px}",
    ".tc-lab .tc-predict{margin-top:12px;padding:12px;border:1px solid var(--border,#d7d0c2);background:var(--block-bg,var(--bg,#fff))}.tc-lab .tc-predict strong{display:block;margin-bottom:8px}.tc-lab .tc-choice-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.tc-lab .tc-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.tc-lab .tc-actions>*{flex:1 1 160px}.tc-lab .tc-feedback{min-height:2em;margin:8px 0 0;font-weight:700}.tc-lab .tc-pass{color:var(--tc-green)}.tc-lab .tc-warn{color:var(--tc-red)}",
    ".tc-lab .tc-results{margin-top:18px;padding-top:16px;border-top:1px solid var(--border,#d7d0c2)}.tc-lab .tc-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:11px 0}.tc-lab .tc-metric{min-width:0;padding:8px;border-top:2px solid var(--border,#d7d0c2);background:var(--block-bg,var(--bg,#fff))}.tc-lab .tc-metric:nth-child(4n+1){border-color:var(--tc-blue)}.tc-lab .tc-metric:nth-child(4n+2){border-color:var(--tc-green)}.tc-lab .tc-metric:nth-child(4n+3){border-color:var(--tc-gold)}.tc-lab .tc-metric:nth-child(4n){border-color:var(--tc-red)}.tc-lab .tc-metric span{display:block;color:var(--fg-soft,var(--muted,#6b6557));font-size:11px;line-height:1.4}.tc-lab .tc-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".tc-lab .tc-visual{min-width:0;padding:7px;border:1px solid var(--border,#d7d0c2);border-radius:6px;background:var(--bg,#fff);overflow-x:auto}.tc-lab svg{display:block;width:100%;min-width:760px;max-width:none;height:auto;color:var(--fg,#292722)}.tc-lab svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.tc-lab .tc-grid{fill:var(--bg,#fff);stroke:currentColor;stroke-opacity:.15;stroke-width:1}.tc-lab .tc-axis{stroke:currentColor;stroke-opacity:.55;stroke-width:1.2}.tc-lab .tc-arrow{stroke:var(--tc-blue);stroke-width:2;fill:none;}.tc-lab .tc-point{fill:var(--tc-gold);stroke:var(--bg,#fff);stroke-width:1.5}.tc-lab .tc-open{fill:var(--tc-green);fill-opacity:.2;stroke:var(--tc-green);stroke-width:1.2}.tc-lab .tc-basis{fill:var(--tc-blue);fill-opacity:.18;stroke:var(--tc-blue);stroke-width:1.2}.tc-lab .tc-bad{color:var(--tc-red);font-weight:700}",
    ".tc-lab .tc-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:13px}.tc-lab table{display:table;white-space:normal;width:100%;min-width:760px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.tc-lab caption{padding:0 0 7px;text-align:left;color:var(--fg-soft,var(--muted,#6b6557));font-size:12px}.tc-lab th,.tc-lab td{white-space:normal;overflow-wrap:anywhere;padding:7px 8px;border-bottom:1px solid var(--border,#d7d0c2);text-align:left;vertical-align:top}.tc-lab th{color:var(--fg-soft,var(--muted,#6b6557));font-size:11.5px}.tc-lab .tc-check{margin-top:11px;padding:8px 10px;border-left:3px solid var(--tc-green);background:var(--block-bg,var(--bg,#fff));font-size:12.5px}.tc-lab .tc-check.tc-fail{border-color:var(--tc-red)}",
    "@media(max-width:760px){.tc-lab .tc-presets{grid-template-columns:repeat(2,minmax(0,1fr))}.tc-lab .tc-summary{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){.tc-lab .tc-presets,.tc-lab .tc-summary,.tc-lab .tc-choice-row{grid-template-columns:minmax(0,1fr)}.tc-lab .tc-visual{padding:4px}.tc-lab th,.tc-lab td{padding-left:5px;padding-right:5px}}@media(prefers-reduced-motion:reduce){.tc-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  function fail(message) {
    throw new Error("topology-continuity: " + message);
  }

  var MAX_POINTS=10;
  function pointCount(points) {
    var count=Array.isArray(points)?points.length:points;
    if(!Number.isInteger(count)||count<0||count>MAX_POINTS)fail("finite point count must be an integer from 0 to 10");
    if(Array.isArray(points)&&(new Set(points).size!==count||!points.every(function(v){return typeof v==="string"&&v.length>0;})))fail("point labels must be distinct nonempty strings");
    return count;
  }
  function deepFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.keys(value).forEach(function(k){deepFreeze(value[k]);});Object.freeze(value);}return value;}
  deepFreeze(PRESETS);

  function allMask(count) {
    return count === 0 ? 0 : Math.pow(2, count) - 1;
  }

  function uniqueMasks(masks) {
    if(!Array.isArray(masks))fail("open sets must be an array of masks");
    return Array.from(new Set(masks)).sort(function(a,b){return a-b;});
  }

  function topologyReport(points, openSets) {
    var count = pointCount(points);
    var universe = allMask(count);
    if(!Array.isArray(openSets))fail("open sets must be an array");
    var bad=openSets.findIndex(function(v){return !Number.isInteger(v)||v<0||v>universe;});
    if(bad>=0)return {points:Array.isArray(points)?points.slice():Array.from({length:count},function(_,i){return String(i);}),count:count,universe:universe,openSets:[],valid:false,missing:{type:"invalid-mask",mask:openSets[bad]}};
    var opens = uniqueMasks(openSets);
    var openLookup = Object.create(null);
    var invalidMask = null;
    opens.forEach(function (mask) {
      openLookup[mask] = true;
      if (mask < 0 || mask > universe) invalidMask = mask;
    });
    var missing = null;
    if (invalidMask !== null) missing = { type: "invalid-mask", mask: invalidMask };
    if (!openLookup[0]) missing = missing || { type: "missing-empty" };
    if (!openLookup[universe]) missing = missing || { type: "missing-universe" };
    if (!missing) {
      // On a finite set only finitely many distinct opens occur. Binary
      // union/intersection closure plus empty/universe suffices by induction.
      for(var i=0;i<opens.length&&!missing;i++)for(var j=i;j<opens.length&&!missing;j++){
        var union=opens[i]|opens[j],intersection=opens[i]&opens[j];
        if(!openLookup[union])missing={type:"union",family:[opens[i],opens[j]],result:union};
        else if(!openLookup[intersection])missing={type:"intersection",family:[opens[i],opens[j]],result:intersection};
      }
    }

    return {
      points: Array.isArray(points) ? points.slice() : Array.from({length:count},function(_,i){return String(i);}),
      count: count,
      universe: universe,
      openSets: opens,
      valid: !missing,
      missing: missing
    };
  }

  function isTopology(points, openSets) {
    return topologyReport(points, openSets).valid;
  }

  function isOpen(mask, topology) {
    return topology.openSets.indexOf(mask) !== -1;
  }

  function labelsForMask(points, mask) {
    var labels = [];
    (points || []).forEach(function (point, index) {
      if ((mask & Math.pow(2, index)) !== 0) labels.push(String(point));
    });
    return labels;
  }

  function setText(points, mask) {
    var labels = labelsForMask(points, mask);
    return labels.length ? "{" + labels.join(", ") + "}" : "∅";
  }

  function preimage(map, targetMask) {
    if(!Array.isArray(map)||map.length>MAX_POINTS||!map.every(function(v){return Number.isInteger(v)&&v>=0&&v<MAX_POINTS;})||!Number.isInteger(targetMask)||targetMask<0||targetMask>allMask(MAX_POINTS))fail("invalid finite map or target mask");
    var result = 0;
    (map || []).forEach(function (targetIndex, sourceIndex) {
      if ((targetMask & Math.pow(2, targetIndex)) !== 0) result |= Math.pow(2, sourceIndex);
    });
    return result;
  }

  function continuityLedger(sourcePoints, sourceOpenSets, targetPoints, targetOpenSets, map) {
    var source = topologyReport(sourcePoints, sourceOpenSets);
    var target = topologyReport(targetPoints, targetOpenSets);
    if (!source.valid || !target.valid) fail("continuity requires two valid finite topologies");
    if (!Array.isArray(map) || map.length !== source.count) fail("map must give one target index per source point");
    map.forEach(function (targetIndex) {
      if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= target.count) fail("map has an invalid target index");
    });
    var rows = target.openSets.map(function (openMask) {
      var inverse = preimage(map, openMask);
      return { targetMask: openMask, preimageMask: inverse, preimageOpen: isOpen(inverse, source) };
    });
    return {
      source: source,
      target: target,
      map: map.slice(),
      rows: rows,
      continuous: rows.every(function (row) { return row.preimageOpen; })
    };
  }

  function quotientTopology(sourcePoints, sourceOpenSets, quotientPoints, quotientMap) {
    var source = topologyReport(sourcePoints, sourceOpenSets);
    var quotientCount = pointCount(quotientPoints);
    if (!source.valid) fail("quotient source must be a valid finite topology");
    if (!Array.isArray(quotientMap) || quotientMap.length !== source.count) fail("quotient map has the wrong length");
    var seen = 0;
    quotientMap.forEach(function (targetIndex) {
      if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= quotientCount) fail("quotient map has an invalid fiber index");
      seen |= Math.pow(2, targetIndex);
    });
    if (seen !== allMask(quotientCount)) fail("quotient map must be surjective");
    var rows = [];
    var openSets = [];
    for (var mask = 0; mask <= allMask(quotientCount); mask += 1) {
      var inverse = preimage(quotientMap, mask);
      var open = isOpen(inverse, source);
      rows.push({ quotientMask: mask, preimageMask: inverse, preimageOpen: open });
      if (open) openSets.push(mask);
    }
    return {
      source: source,
      quotient: { points: Array.isArray(quotientPoints)?quotientPoints.slice():Array.from({length:quotientCount},function(_,i){return String(i);}), count: quotientCount, universe: allMask(quotientCount), openSets: openSets },
      map: quotientMap.slice(),
      rows: rows,
      openSets: openSets
    };
  }

  function productMask(xCount, yCount, xMask, yMask) {
    var result = 0;
    for (var x = 0; x < xCount; x += 1) {
      for (var y = 0; y < yCount; y += 1) {
        if ((xMask & Math.pow(2, x)) !== 0 && (yMask & Math.pow(2, y)) !== 0) {
          result |= Math.pow(2, x * yCount + y);
        }
      }
    }
    return result;
  }

  function productTopology(xPoints, xOpenSets, yPoints, yOpenSets) {
    var x = topologyReport(xPoints, xOpenSets);
    var y = topologyReport(yPoints, yOpenSets);
    if (!x.valid || !y.valid) fail("product requires two valid finite topologies");
    if(x.count*y.count>MAX_POINTS)fail("product exceeds the 10-point finite model limit");
    var basis = [];
    x.openSets.forEach(function (xMask) {
      y.openSets.forEach(function (yMask) {
        var rectangle = productMask(x.count, y.count, xMask, yMask);
        if (basis.indexOf(rectangle) === -1) basis.push(rectangle);
      });
    });
    basis.sort(function (a, b) { return a - b; });
    var generated=[0],seen=new Set([0]);
    for(var cursor=0;cursor<generated.length;cursor++)basis.forEach(function(b){
      var union=generated[cursor]|b;if(!seen.has(union)){seen.add(union);generated.push(union);}
    });
    var openSets=generated.sort(function(a,b){return a-b;});

    return {
      x: x,
      y: y,
      points: x.points.reduce(function (result, xPoint) {
        return result.concat(y.points.map(function (yPoint) { return String(xPoint) + "×" + String(yPoint); }));
      }, []),
      basis: basis,
      openSets: openSets,
      universe: allMask(x.count * y.count)
    };
  }

  function subsetReport(points,opens,mask){
    var t=topologyReport(points,opens);if(!t.valid)fail("subset operations require a valid topology");
    if(!Number.isInteger(mask)||mask<0||mask>t.universe)fail("invalid subset mask");
    var interior=0,closure=t.universe;
    t.openSets.forEach(function(U){if((U&mask)===U)interior|=U;var C=t.universe^U;if((C&mask)===mask)closure&=C;});
    var neighborhoods=Array.from({length:t.count},function(_,i){return t.openSets.filter(function(U){return U&(1<<i);}).reduce(function(a,b){return a&b;},t.universe);});
    return {topology:t,mask:mask,interior:interior,closure:closure,boundary:closure&(t.universe^interior),neighborhoods:neighborhoods};
  }
  var THREE_TOPOLOGIES=[];
  for(var family=0;family<256;family++){var opens=[];for(var mask=0;mask<8;mask++)if(family&(1<<mask))opens.push(mask);if(isTopology(["a","b","c"],opens))THREE_TOPOLOGIES.push(opens);}
  deepFreeze(THREE_TOPOLOGIES);

  function presetById(id) {
    for (var index = 0; index < PRESETS.length; index += 1) if (PRESETS[index].id === id) return PRESETS[index];
    fail("unknown preset " + id);
  }

  function analyze(id) {
    var preset = presetById(id);
    if (preset.kind === "map") {
      var map = continuityLedger(preset.points, preset.sourceOpenSets, preset.points, preset.targetOpenSets, preset.map);
      return { preset: preset, kind: "map", map: map, expected: preset.expected };
    }
    if (preset.kind === "quotient") {
      var quotient = quotientTopology(preset.points, preset.sourceOpenSets, preset.quotientPoints, preset.quotientMap);
      return { preset: preset, kind: "quotient", quotient: quotient, expected: preset.expected };
    }
    var product = productTopology(preset.xPoints, preset.xOpenSets, preset.yPoints, preset.yOpenSets);
    return { preset: preset, kind: "product", product: product, expected: preset.expected };
  }

  function formatMask(points, mask) {
    return setText(points, mask);
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) {
      checks += 1;
      if (!condition) fail("self-test failed: " + message);
    }
    var sierpinski = topologyReport(["a", "b"], [0, 1, 3]);
    check(sierpinski.valid, "Sierpiński topology is valid");
    check(!isTopology(["a", "b"], [0, 1, 2]), "missing union is rejected");
    check(setText(["a", "b"], 1) === "{a}", "finite mask labels");
    var forward = analyze("sierpinski-to-discrete").map;
    check(!forward.continuous, "Sierpiński to discrete identity is not continuous");
    check(forward.rows.some(function (row) { return row.targetMask === 2 && row.preimageMask === 2 && !row.preimageOpen; }), "the bad preimage is visible");
    var reverse = analyze("discrete-to-sierpinski").map;
    check(reverse.continuous, "discrete to Sierpiński identity is continuous");
    check(reverse.rows.every(function (row) { return row.preimageOpen; }), "all reverse preimages are open");
    var quotient = analyze("quotient-fibers").quotient;
    check(quotient.openSets.join(",") === "0,1,3", "quotient topology is Sierpiński");
    check(quotient.rows[1].preimageMask === 3 && quotient.rows[1].preimageOpen, "saturated fiber preimage is open");
    check(quotient.rows[2].preimageMask === 4 && !quotient.rows[2].preimageOpen, "non-saturated source open is not invented downstairs");
    var product = analyze("product-sierpinski").product;
    check(product.basis.length === 5, "duplicate empty rectangle is removed");
    check(product.openSets.indexOf(7) !== -1, "a union of product rectangles is open");
    check(product.openSets.indexOf(4) === -1, "a rectangle missing the common Sierpiński point is not open");
    PRESETS.forEach(function (preset) {
      var report = analyze(preset.id);
      check(report.preset.id === preset.id, preset.id + " is analyzable");
      check(report.expected === preset.expected, preset.id + " has a prediction key");
    });
    return { ok: true, checks: checks, presets: PRESETS.length };
  }

  function setAttributes(node, attributes) {
    Object.keys(attributes || {}).forEach(function (key) {
      var value = attributes[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function appendChildren(node, children, doc) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function element(doc, tag, attributes, children) {
    return appendChildren(setAttributes(doc.createElement(tag), attributes), children, doc);
  }

  function svgElement(doc, tag, attributes, children) {
    return appendChildren(setAttributes(doc.createElementNS(SVG_NS, tag), attributes), children, doc);
  }

  function installStyles(doc) {
    if (doc.getElementById && doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function mapSvg(doc, report, serial, selectedMask) {
    var svg = svgElement(doc, "svg", { viewBox: "0 0 620 250", role: "img", "aria-label": "有限集合上的映射与原像图" });
    svg.appendChild(svgElement(doc, "title", {}, report.kind === "map" ? "映射与开集原像" : report.kind === "quotient" ? "商映射的纤维" : "积空间的开矩形"));
svg.appendChild(svgElement(doc, "defs", {}, svgElement(doc, "marker", { id: "tc-arrow-" + serial, markerWidth: 8, markerHeight: 8, refX: 7, refY: 4, orient: "auto" }, svgElement(doc, "path", { d: "M0,0 L8,4 L0,8 z", fill: "var(--tc-blue)" }))));
    if (report.kind === "map") {
      var sourcePoints = report.map.source.points;
      var targetPoints = report.map.target.points;
      var leftX = 150;
      var rightX = 470;
      svg.setAttribute("viewBox","0 0 620 "+(sourcePoints.length>2?330:250));
      var sourceY = sourcePoints.map(function (_, index) { return 92 + index * 70; });
      var targetY = targetPoints.map(function (_, index) { return 92 + index * 70; });

      svg.appendChild(svgElement(doc, "text", { x: leftX, y: 28, "text-anchor": "middle", "font-size": 14, "font-weight": 750 }, "源空间 X"));
      svg.appendChild(svgElement(doc, "text", { x: rightX, y: 28, "text-anchor": "middle", "font-size": 14, "font-weight": 750 }, "目标空间 Y"));
      if(selectedMask!==undefined){
        var inverse=preimage(report.map.map,selectedMask);
        sourcePoints.forEach(function(_,i){if(inverse&(1<<i))svg.appendChild(svgElement(doc,"rect",{x:leftX-34,y:sourceY[i]-28,width:68,height:56,rx:8,className:isOpen(inverse,report.map.source)?"tc-open":"tc-preimage-bad","data-preimage-point":i}));});
        targetPoints.forEach(function(_,i){if(selectedMask&(1<<i))svg.appendChild(svgElement(doc,"rect",{x:rightX-34,y:targetY[i]-28,width:68,height:56,rx:8,className:"tc-open","data-target-point":i}));});
      }
      sourcePoints.forEach(function (point, index) {
        svg.appendChild(svgElement(doc, "circle", { cx: leftX, cy: sourceY[index], r: 20, className: "tc-point" }));
        svg.appendChild(svgElement(doc, "text", { x: leftX, y: sourceY[index] + 5, "text-anchor": "middle", "font-size": 14 }, String(point)));
        var targetIndex = report.map.map[index];
        svg.appendChild(svgElement(doc, "line", { x1: leftX + 24, y1: sourceY[index], x2: rightX - 24, y2: targetY[targetIndex], className: "tc-arrow", "marker-end": "url(#tc-arrow-" + serial + ")" }));
      });
      targetPoints.forEach(function (point, index) {
        svg.appendChild(svgElement(doc, "circle", { cx: rightX, cy: targetY[index], r: 20, className: "tc-point" }));
        svg.appendChild(svgElement(doc, "text", { x: rightX, y: targetY[index] + 5, "text-anchor": "middle", "font-size": 14 }, String(point)));
      });
      svg.appendChild(svgElement(doc, "text", { x: 310, y: sourcePoints.length>2?300:222, "text-anchor": "middle", "font-size": 12 }, report.map.continuous ? "每个目标开集的原像都在源拓扑中开" : "至少一个目标开集的原像不是源空间的开集"));
      return svg;
    }
    if (report.kind === "quotient") {
      var quotient = report.quotient;
      svg.appendChild(svgElement(doc, "text", { x: 150, y: 28, "text-anchor": "middle", "font-size": 14, "font-weight": 750 }, "X 的纤维"));
      svg.appendChild(svgElement(doc, "text", { x: 470, y: 28, "text-anchor": "middle", "font-size": 14, "font-weight": 750 }, "X/∼"));
      var fiberY = [72, 125, 178];
      quotient.source.points.forEach(function (point, index) {
        var target = quotient.map[index];
        svg.appendChild(svgElement(doc, "circle", { cx: 150, cy: fiberY[index], r: 18, className: "tc-point" }));
        svg.appendChild(svgElement(doc, "text", { x: 150, y: fiberY[index] + 5, "text-anchor": "middle", "font-size": 12 }, String(point)));
        svg.appendChild(svgElement(doc, "line", { x1: 173, y1: fiberY[index], x2: 445, y2: 98 + target * 82, className: "tc-arrow", "marker-end":"url(#tc-arrow-"+serial+")" }));
      });
      quotient.quotient.points.forEach(function (point, index) {
        svg.appendChild(svgElement(doc, "circle", { cx: 470, cy: 98 + index * 82, r: 23, className: "tc-open" }));
        svg.appendChild(svgElement(doc, "text", { x: 470, y: 103 + index * 82, "text-anchor": "middle", "font-size": 14 }, String(point)));
      });
      svg.appendChild(svgElement(doc, "text", { x: 310, y: 225, "text-anchor": "middle", "font-size": 12 }, "U 在商空间开 ⇔ q⁻¹(U) 在 X 开"));
      return svg;
    }
    var product = report.product;
    svg.appendChild(svgElement(doc, "text", { x: 310, y: 25, "text-anchor": "middle", "font-size": 14, "font-weight": 750 }, "X×Y：蓝框是一个基本开矩形"));
    var x0 = 170;
    var y0 = 55;
    var cellW = 90;
    var cellH = 65;
    var highlight = product.basis.filter(function (mask) { return mask !== 0 && mask !== product.universe; })[0] || 0;
    for (var x = 0; x < product.x.count; x += 1) {
      for (var y = 0; y < product.y.count; y += 1) {
        var cellMask = Math.pow(2, x * product.y.count + y);
        svg.appendChild(svgElement(doc, "rect", { x: x0 + y * cellW, y: y0 + x * cellH, width: cellW, height: cellH, className: (highlight & cellMask) !== 0 ? "tc-basis" : "tc-grid" }));
        svg.appendChild(svgElement(doc, "text", { x: x0 + y * cellW + cellW / 2, y: y0 + x * cellH + cellH / 2 + 5, "text-anchor": "middle", "font-size": 13 }, product.points[x * product.y.count + y]));
      }
    }
    product.x.points.forEach(function (point, index) { svg.appendChild(svgElement(doc, "text", { x: x0 - 18, y: y0 + index * cellH + cellH / 2 + 5, "text-anchor": "end", "font-size": 12 }, String(point))); });
    product.y.points.forEach(function (point, index) { svg.appendChild(svgElement(doc, "text", { x: x0 + index * cellW + cellW / 2, y: y0 - 10, "text-anchor": "middle", "font-size": 12 }, String(point))); });
    svg.appendChild(svgElement(doc, "text", { x: 310, y: 225, "text-anchor": "middle", "font-size": 12 }, "基本开矩形 U×V 取并生成积拓扑"));
    return svg;
  }

  function metric(doc, label, value) {
    return element(doc, "div", { className: "tc-metric" }, [element(doc, "span", { text: label }), element(doc, "strong", { text: value })]);
  }

  function renderTable(doc, report) {
    var table = element(doc, "table");
    table.appendChild(element(doc, "caption", { text: report.kind === "map" ? "连续性：逐个检查目标开集的原像" : report.kind === "quotient" ? "商拓扑：逐个检查商集的饱和原像" : "积拓扑：基本开矩形与生成的开集" }));
    var head = element(doc, "tr");
    var headings = report.kind === "map" ? ["目标开集 V", "原像 f⁻¹(V)", "原像在源中开？"] : report.kind === "quotient" ? ["商集 U", "q⁻¹(U)", "原像开？"] : ["基本矩形 / 计数", "掩码", "说明"];
    headings.forEach(function (heading) { head.appendChild(element(doc, "th", { scope: "col", text: heading })); });
    table.appendChild(element(doc, "thead", {}, head));
    var body = element(doc, "tbody");
    if (report.kind === "map") {
      report.map.rows.forEach(function (row) {
        body.appendChild(element(doc, "tr", {}, [element(doc, "td", { text: formatMask(report.map.target.points, row.targetMask) }), element(doc, "td", { text: formatMask(report.map.source.points, row.preimageMask) }), element(doc, "td", { className: row.preimageOpen ? "" : "tc-bad", text: row.preimageOpen ? "是" : "否" })]));
      });
    } else if (report.kind === "quotient") {
      report.quotient.rows.forEach(function (row) {
        body.appendChild(element(doc, "tr", {}, [element(doc, "td", { text: formatMask(report.quotient.quotient.points, row.quotientMask) }), element(doc, "td", { text: formatMask(report.quotient.source.points, row.preimageMask) }), element(doc, "td", { className: row.preimageOpen ? "" : "tc-bad", text: row.preimageOpen ? "是" : "否" })]));
      });
    } else {
      report.product.basis.forEach(function (mask) {
        body.appendChild(element(doc, "tr", {}, [element(doc, "td", { text: formatMask(report.product.points, mask) }), element(doc, "td", { text: String(mask) }), element(doc, "td", { text: "基本开矩形（或空集）" })]));
      });
      body.appendChild(element(doc, "tr", {}, [element(doc, "td", { text: "生成的开集数量" }), element(doc, "td", { text: String(report.product.openSets.length) }), element(doc, "td", { text: "基本矩形的任意并" })]));
      report.product.openSets.forEach(function(mask){
        body.appendChild(element(doc,"tr",{},[element(doc,"td",{text:formatMask(report.product.points,mask)}),element(doc,"td",{text:String(mask)}),element(doc,"td",{text:report.product.basis.indexOf(mask)>=0?"生成的开集；也是一个矩形":"生成的开集；需要矩形取并"})]));
      });
    }
    table.appendChild(body);
    return table;
  }

  function workbench(doc,serial){
    var points=["a","b","c"],sourceIndex=THREE_TOPOLOGIES.findIndex(function(t){return t.join(",")==="0,1,3,7";});
    var targetIndex=THREE_TOPOLOGIES.findIndex(function(t){return t.length===8;});
    var state={source:sourceIndex,target:targetIndex,map:[0,1,2],selected:1,subset:2};
    var box=element(doc,"section",{className:"tc-workbench","aria-label":"三点拓扑定义工作台"});
    box.appendChild(element(doc,"h4",{text:"三点工作台：变拓扑、变函数，再看原像与闭包"}));
    box.appendChild(element(doc,"p",{className:"tc-note",text:"这29种是集合 {a,b,c} 上全部有标号拓扑。所选目标开集用绿框；它的原像在源中开用绿框、不开用红框。判断依据是开集清单，框的位置不表示距离。内点、闭包和边界对左侧子集单独计算。"}));
    var controls=element(doc,"div",{className:"tc-work-controls"}),refs={};
    function select(label,options,initial){
      var input=element(doc,"select",{"aria-label":label});
      options.forEach(function(o){input.appendChild(element(doc,"option",{value:String(o[0]),text:o[1]}));});input.value=String(initial);
      controls.appendChild(element(doc,"label",{},[label,input]));return input;
    }
    var topologyOptions=THREE_TOPOLOGIES.map(function(t,i){return [i,"T"+i+"："+t.map(function(U){return setText(points,U);}).join("，")];});
    refs.source=select("三点源拓扑",topologyOptions,state.source);refs.target=select("三点目标拓扑",topologyOptions,state.target);
    refs.map=points.map(function(point,i){return select("f("+point+")",points.map(function(v,j){return [j,v];}),state.map[i]);});
    refs.selected=select("图中所选目标开集",[],state.selected);
    refs.subset=select("源空间子集 A",Array.from({length:8},function(_,i){return [i,setText(points,i)];}),state.subset);
    function fillTargets(){
      refs.selected.replaceChildren();var opens=THREE_TOPOLOGIES[state.target];
      if(opens.indexOf(state.selected)<0)state.selected=opens[0];
      opens.forEach(function(U){refs.selected.appendChild(element(doc,"option",{value:String(U),text:setText(points,U)}));});refs.selected.value=String(state.selected);
    }
    fillTargets();box.appendChild(controls);
    var output=element(doc,"div",{"aria-live":"polite"});box.appendChild(output);
    function render(){
      output.replaceChildren();var source=THREE_TOPOLOGIES[state.source],target=THREE_TOPOLOGIES[state.target];
      var map=continuityLedger(points,source,points,target,state.map),report={kind:"map",map:map};
      var subset=subsetReport(points,source,state.subset),inverse=preimage(state.map,state.selected);
      output.appendChild(element(doc,"p",{text:"τX = "+source.map(function(U){return setText(points,U);}).join("，")+"；τY = "+target.map(function(U){return setText(points,U);}).join("，")+"。"}));
      output.appendChild(element(doc,"p",{"data-selected-preimage":"",text:"所选 V="+setText(points,state.selected)+"；f⁻¹(V)="+setText(points,inverse)+"，在源中"+(isOpen(inverse,map.source)?"开":"不开")+"。全部目标开集检查后：f "+(map.continuous?"连续":"不连续")+"。"}));
      output.appendChild(element(doc,"div",{className:"tc-visual",role:"region",tabindex:"0","aria-label":"三点开集与原像图"},mapSvg(doc,report,serial+"-work",state.selected)));
      output.appendChild(element(doc,"div",{className:"tc-table-wrap",role:"region",tabindex:"0","aria-label":"三点连续性原像表"},renderTable(doc,report)));
      output.appendChild(element(doc,"p",{"data-subset-results":"",text:"A="+setText(points,state.subset)+"；内部 A°="+setText(points,subset.interior)+"；闭包 cl(A)="+setText(points,subset.closure)+"；边界 ∂A="+setText(points,subset.boundary)+"。"}));
      var table=element(doc,"table"),head=["点 x","最小开邻域 N(x)","N(x) ⊆ A？内点","N(x) ∩ A ≠ ∅？闭包点"];
      table.appendChild(element(doc,"thead",{},element(doc,"tr",{},head.map(function(v){return element(doc,"th",{scope:"col",text:v});}))));
      var body=element(doc,"tbody");points.forEach(function(point,i){var N=subset.neighborhoods[i];body.appendChild(element(doc,"tr",{},[point,setText(points,N),(N&state.subset)===N?"是":"否",(N&state.subset)!==0?"是":"否"].map(function(v){return element(doc,"td",{text:v});})));});table.appendChild(body);
      output.appendChild(element(doc,"div",{className:"tc-table-wrap",role:"region",tabindex:"0","aria-label":"三点邻域与闭包表"},table));
      output.appendChild(element(doc,"p",{className:"tc-note",text:"有限空间中，所有含 x 的开集之交仍开，故最小开邻域存在。实线通常没有最小开邻域，不能直接搬用这张有限表。试把源拓扑换为离散，或把函数改成常值，先预测再核对。"}));
    }
    refs.source.addEventListener("change",function(){state.source=Number(this.value);render();});
    refs.target.addEventListener("change",function(){state.target=Number(this.value);fillTargets();render();});
    refs.map.forEach(function(input,i){input.addEventListener("change",function(){state.map[i]=Number(this.value);render();});});
    refs.selected.addEventListener("change",function(){state.selected=Number(this.value);render();});
    refs.subset.addEventListener("change",function(){state.subset=Number(this.value);render();});
    render();return box;
  }

  function mount(rootNode, api) {
    var doc = rootNode.ownerDocument || (typeof document !== "undefined" ? document : null);
    if (!doc) return;
    installStyles(doc);
    rootNode.classList.add("tc-lab");
    INSTANCE += 1;
    var serial = INSTANCE;
    var state = { presetId: PRESETS[0].id, prediction: null, revealed: false };
    var announce = function (message) {
      if (api && typeof api.announce === "function") api.announce(rootNode, message);
    };

    function render(focusSelector) {
      var report = analyze(state.presetId);
      var preset = report.preset;
      var shell = element(doc, "div", { className: "tc-shell" });
      shell.appendChild(element(doc, "h3", { text: "有限拓扑账本：开集、原像与粘合" }));
      shell.appendChild(element(doc, "p", { className: "tc-note", text: "先选一个有限模型，再预测。脚本逐项枚举当前有限集合的开集运算；这能照亮定义，但不替代任意空间的证明。" }));

      var presetGrid = element(doc, "div", { className: "tc-presets", role: "group", "aria-label": "选择有限拓扑模型" });
      PRESETS.forEach(function (item) {
        var button = element(doc, "button", { type: "button", "aria-pressed": item.id === state.presetId ? "true" : "false", "data-preset":item.id, "aria-label": "载入" + item.label }, item.label);
        button.title = item.description;
        button.addEventListener("click", function () {
          state.presetId = item.id;
          state.prediction = null;
          state.revealed = false;
          render('[data-preset="'+item.id+'"]');
          announce("已载入" + item.label + "；请先作出预测。");
        });
        presetGrid.appendChild(button);
      });
      shell.appendChild(presetGrid);
      shell.appendChild(element(doc, "p", { className: "tc-note", text: preset.description }));
      var given=report.kind==="map"
        ? "X=Y="+setText(preset.points,allMask(preset.points.length))+"；源开集："+report.map.source.openSets.map(function(U){return setText(preset.points,U);}).join("，")+"；目标开集："+report.map.target.openSets.map(function(U){return setText(preset.points,U);}).join("，")
        : report.kind==="quotient"
          ? "源开集："+report.quotient.source.openSets.map(function(U){return setText(preset.points,U);}).join("，")+"；q(a₀)=q(a₁)=A，q(b)=B。"
          : "X={0,1} 的开集：∅,{0},X；Y={L,R} 的开集：∅,{L},Y。";
      shell.appendChild(element(doc,"p",{className:"tc-note",text:given}));

      var predict = element(doc, "fieldset", { className: "tc-predict" });
      predict.appendChild(element(doc, "legend", { text: preset.question }));
      var choices = element(doc, "div", { className: "tc-choice-row", role: "group", "aria-label": "预测选项" });
      preset.options.forEach(function (option) {
        var button = element(doc, "button", { type: "button","data-choice":option[0], "aria-pressed": state.prediction === option[0] ? "true" : "false" }, option[1]);
        button.addEventListener("click", function () { state.prediction = option[0];state.revealed=false; render('[data-choice="'+option[0]+'"]'); });
        choices.appendChild(button);
      });
      predict.appendChild(choices);
      var actions = element(doc, "div", { className: "tc-actions" });
      var reveal = element(doc, "button", { type: "button", className: "tc-primary", "data-reveal":"", text: "核对预测" });
      reveal.addEventListener("click", function () {
        if (!state.prediction) {
          announce("请先选择一个预测。");
          render("[data-reveal]");
          return;
        }
        state.revealed = true;
        render(".tc-results");
        announce("预测已核对；现在可以阅读有限开集账本。");
      });
      var reset = element(doc, "button", { type: "button", text: "重置实验" });
      reset.addEventListener("click", function () {
        state = { presetId: PRESETS[0].id, prediction: null, revealed: false };
        render(".tc-choice-row button");
        announce("拓扑实验已重置。");
      });
      actions.appendChild(reveal);
      actions.appendChild(reset);
      predict.appendChild(actions);
      var feedback = state.revealed ? (state.prediction === preset.expected ? "预测命中。" : "预测未命中；请逐行查看原像是否开。") : state.prediction ? "预测已记录；点击“核对预测”查看账本。" : "尚未作出预测。";
      predict.appendChild(element(doc, "p", { className: "tc-feedback " + (state.revealed ? (state.prediction === preset.expected ? "tc-pass" : "tc-warn") : ""), "aria-live": "polite", text: feedback }));
      shell.appendChild(predict);

      if (state.revealed) {
        var results = element(doc, "section", { className: "tc-results",tabindex:"-1", "aria-live": "polite" });
        results.appendChild(element(doc, "h4", { text: "可视化与定义账本" }));
        results.appendChild(element(doc, "div", { className: "tc-visual",role:"region",tabindex:"0","aria-label":"有限拓扑映射图" }, mapSvg(doc, report, serial)));
        var summary = element(doc, "div", { className: "tc-summary" });
        if (report.kind === "map") {
          summary.appendChild(metric(doc, "源空间开集数", String(report.map.source.openSets.length)));
          summary.appendChild(metric(doc, "目标空间开集数", String(report.map.target.openSets.length)));
          summary.appendChild(metric(doc, "合格原像", report.map.rows.filter(function (row) { return row.preimageOpen; }).length + "/" + report.map.rows.length));
          summary.appendChild(metric(doc, "连续？", report.map.continuous ? "是" : "否"));
        } else if (report.kind === "quotient") {
          summary.appendChild(metric(doc, "源空间开集数", String(report.quotient.source.openSets.length)));
          summary.appendChild(metric(doc, "商空间开集数", String(report.quotient.openSets.length)));
          summary.appendChild(metric(doc, "纤维数", String(report.quotient.quotient.points.length)));
          summary.appendChild(metric(doc, "{A} 是否开", report.quotient.openSets.indexOf(1) !== -1 ? "是" : "否"));
        } else {
          summary.appendChild(metric(doc, "|X|×|Y|", report.product.x.count + "×" + report.product.y.count));
          summary.appendChild(metric(doc, "基本矩形数", String(report.product.basis.length)));
          summary.appendChild(metric(doc, "积空间开集数", String(report.product.openSets.length)));
          summary.appendChild(metric(doc, "生成规则", "任意并"));
        }
        results.appendChild(summary);
        results.appendChild(element(doc, "div", { className: "tc-table-wrap",role:"region",tabindex:"0","aria-label":"有限拓扑定义表" }, renderTable(doc, report)));
        var note = report.kind === "map" ? "连续性的方向是“目标开集取原像”；正像开不参与这个定义。" : report.kind === "quotient" ? "商空间不把任意子集自动宣布为开；只有饱和原像在源空间开时才下传。" : "这里的基本矩形来自两端拓扑；有限枚举只说明这个具体积空间的开集。";
        results.appendChild(element(doc, "p", { className: "tc-check", text: note }));
        results.appendChild(workbench(doc,serial));
        shell.appendChild(results);
      }
      rootNode.replaceChildren(shell);
      if(focusSelector){var focused=rootNode.querySelector(focusSelector);if(focused)focused.focus();}
    }

    render();
  }

  return {
    PRESETS: PRESETS,
    THREE_TOPOLOGIES:THREE_TOPOLOGIES,
    subsetReport:subsetReport,
    mapSvg:mapSvg,
    topologyReport: topologyReport,
    isTopology: isTopology,
    isOpen: isOpen,
    preimage: preimage,
    continuityLedger: continuityLedger,
    quotientTopology: quotientTopology,
    productTopology: productTopology,
    analyze: analyze,
    selfTest: selfTest,
    mount: mount
  };
});

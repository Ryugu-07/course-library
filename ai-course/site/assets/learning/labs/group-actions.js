(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("group-actions", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      console.log("group-actions self-test: PASS (" + report.checks + " checks, " + report.groups + " groups, " + report.subgroupCases + " subgroup cases)");
    } catch (error) {
      console.error("group-actions self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function (host) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STYLE_ID = "group-actions-lab-styles";
  var INSTANCE = 0;

  function valueKey(value) {
    return Array.isArray(value) ? value.join(",") : String(value);
  }

  function composePermutation(left, right) {
    return left.map(function (_, index) { return left[right[index]]; });
  }

  function inversePermutation(permutation) {
    var inverse = new Array(permutation.length);
    permutation.forEach(function (value, index) { inverse[value] = index; });
    return inverse;
  }

  function makeGroup(spec) {
    var group = {
      id: spec.id,
      label: spec.label,
      values: spec.values,
      labels: spec.labels,
      identity: spec.identity,
      pointCount: spec.pointCount || 0,
      subgroups: spec.subgroups || []
    };
    group.indexOf = function (value) {
      var key = valueKey(value);
      for (var index = 0; index < group.values.length; index += 1) {
        if (valueKey(group.values[index]) === key) return index;
      }
      return -1;
    };
    group.mul = group.values.map(function (left) {
      return group.values.map(function (right) {
        return group.indexOf(spec.multiply(left, right));
      });
    });
    group.inv = group.values.map(function (value) { return group.indexOf(spec.inverse(value)); });
    return group;
  }

  var GROUPS = [
    makeGroup({
      id: "c4",
      label: "C4：旋转四次回到原位",
      values: [0, 1, 2, 3],
      labels: ["0", "1", "2", "3"],
      identity: 0,
      multiply: function (left, right) { return (left + right) % 4; },
      inverse: function (value) { return (4 - value) % 4; },
      subgroups: [
        { id: "half-turn", label: "H={0,2}（半圈子群）", elements: [0, 2], quotient: "C2" },
        { id: "trivial", label: "{0}（平凡子群）", elements: [0], quotient: "C4" },
        { id: "whole", label: "C4（整个群）", elements: [0, 1, 2, 3], quotient: "1" }
      ]
    }),
    makeGroup({
      id: "v4",
      label: "V4：四元 Klein 群",
      values: [0, 1, 2, 3],
      labels: ["e", "a", "b", "c"],
      identity: 0,
      multiply: function (left, right) { return left ^ right; },
      inverse: function (value) { return value; },
      subgroups: [
        { id: "a-line", label: "H={e,a}", elements: [0, 1], quotient: "C2" },
        { id: "b-line", label: "H={e,b}", elements: [0, 2], quotient: "C2" },
        { id: "trivial", label: "{e}（平凡子群）", elements: [0], quotient: "V4" },
        { id: "whole", label: "V4（整个群）", elements: [0, 1, 2, 3], quotient: "1" }
      ]
    }),
    makeGroup({
      id: "s3",
      label: "S3：三个对象的置换群",
      values: [
        [0, 1, 2],
        [1, 0, 2],
        [2, 1, 0],
        [0, 2, 1],
        [1, 2, 0],
        [2, 0, 1]
      ],
      labels: ["e", "s=(12)", "t=(13)", "u=(23)", "r=(123)", "r2=(132)"],
      identity: 0,
      pointCount: 3,
      multiply: composePermutation,
      inverse: inversePermutation,
      subgroups: [
        { id: "transposition", label: "H=<s>={e,(12)}", elements: [0, 1], quotient: null },
        { id: "a3", label: "A3=<r>={e,r,r2}", elements: [0, 4, 5], quotient: "C2" },
        { id: "trivial", label: "{e}（平凡子群）", elements: [0], quotient: "S3" },
        { id: "whole", label: "S3（整个群）", elements: [0, 1, 2, 3, 4, 5], quotient: "1" }
      ]
    })
  ];

  GROUPS[1].subgroups.splice(2,0,{id:"c-line",label:"H={e,c}",elements:[0,3],quotient:"C2"});
  GROUPS[2].subgroups.splice(1,0,{id:"transposition-13",label:"H={e,(13)}",elements:[0,2],quotient:null},{id:"transposition-23",label:"H={e,(23)}",elements:[0,3],quotient:null});
  function deepFreeze(o){Object.keys(o).forEach(function(k){if(o[k]&&typeof o[k]==='object')deepFreeze(o[k]);});return Object.freeze(o);}
  GROUPS.forEach(function(g){validateGroup(g);g.subgroups.forEach(function(h){validateSubgroup(g,h);});deepFreeze(g);});Object.freeze(GROUPS);

  var STYLE_TEXT = [
    ".ga-lab{--ga-blue:var(--accent,#315f9d);--ga-gold:var(--cl-gold,#9b6a12);--ga-green:var(--cl-green,#39734d);--ga-red:var(--cl-red,#b64335);--ga-muted:var(--fg-soft,#6b6557);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    ".ga-lab *,.ga-lab *::before,.ga-lab *::after{box-sizing:border-box}.ga-lab [hidden]{display:none!important}",
    ".ga-lab h3,.ga-lab h4{margin:0;color:var(--fg);letter-spacing:0}.ga-lab h3{font-size:1.18rem}.ga-lab h4{font-size:1rem}.ga-lab p{margin:7px 0}.ga-lab .ga-intro,.ga-lab .ga-note,.ga-lab .ga-status{color:var(--ga-muted);font-size:13px;line-height:1.7}",
    ".ga-lab .ga-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0}.ga-lab .ga-field{display:grid;gap:5px;min-width:0}.ga-lab .ga-field label{color:var(--ga-muted);font-size:12.5px;font-weight:750}.ga-lab select{width:100%;min-height:44px;padding:7px 9px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;line-height:1.35}.ga-lab button{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);cursor:pointer;font:inherit;line-height:1.35;overflow-wrap:anywhere}.ga-lab button:hover{border-color:var(--ga-blue)}.ga-lab button:focus-visible,.ga-lab select:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.ga-lab button[aria-pressed=true],.ga-lab button.ga-primary{border-color:var(--ga-blue);background:var(--ga-blue);color:var(--bg);font-weight:750}",
    ".ga-lab .ga-prediction{margin:14px 0;padding:12px;border-left:3px solid var(--ga-gold);background:var(--block-bg,var(--bg))}.ga-lab .ga-prediction h4{margin-bottom:6px}.ga-lab fieldset{min-width:0;margin:10px 0;padding:9px 10px;border:1px solid var(--border);background:var(--bg)}.ga-lab legend{max-width:100%;padding:0 3px;color:var(--fg);font-size:13px;font-weight:700;line-height:1.5}.ga-lab .ga-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.ga-lab .ga-options button{font-size:12px}.ga-lab .ga-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.ga-lab .ga-actions>*{flex:1 1 170px}.ga-lab .ga-status{min-height:1.7em;margin-top:9px;font-weight:700}.ga-lab .ga-pass{color:var(--ga-green)}.ga-lab .ga-warn{color:var(--ga-red)}",
    ".ga-lab .ga-evidence{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;margin-top:15px}.ga-lab .ga-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px}.ga-lab .ga-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--bg)}.ga-lab .ga-metric:nth-child(3n+1){border-color:var(--ga-blue)}.ga-lab .ga-metric:nth-child(3n+2){border-color:var(--ga-gold)}.ga-lab .ga-metric:nth-child(3n){border-color:var(--ga-green)}.ga-lab .ga-metric span{display:block;color:var(--ga-muted);font-size:11px}.ga-lab .ga-metric strong{display:block;margin-top:3px;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
    ".ga-lab .ga-frame{min-width:0;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch}.ga-lab .ga-svg{display:block;width:100%;min-width:760px;max-width:none;height:auto;color:var(--fg)}.ga-lab .ga-svg text{fill:currentColor;font-family:inherit;letter-spacing:0}.ga-lab .ga-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.ga-lab table{display:table;width:100%;min-width:760px;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.ga-lab caption{padding:0 0 7px;text-align:left;color:var(--ga-muted);font-size:12px;font-weight:700}.ga-lab th,.ga-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;white-space:normal;overflow-wrap:anywhere}.ga-lab th{color:var(--ga-muted);font-size:11px}.ga-lab .ga-certificate{padding:10px 12px;border-left:3px solid var(--ga-green);background:var(--block-bg,var(--bg));font-size:13px;line-height:1.7}.ga-lab .ga-certificate.ga-fail{border-left-color:var(--ga-red)}",
    "@media(max-width:680px){.ga-lab .ga-controls{grid-template-columns:minmax(0,1fr)}.ga-lab .ga-options{grid-template-columns:minmax(0,1fr)}.ga-lab .ga-frame{padding:5px}.ga-lab table{font-size:11.5px}}@media(prefers-reduced-motion:reduce){.ga-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
  ].join("\n");

  STYLE_TEXT+='\n[data-theme="dark"] .ga-lab{--ga-blue:#8ab6e8;--ga-gold:#e0bc67;--ga-green:#8bc4a0;--ga-red:#f09b8e}.ga-frame:focus-visible,.ga-table-wrap:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}.ga-lab input[type=range]{width:100%;margin:0;min-height:44px;accent-color:var(--ga-blue)}.ga-necklace{min-width:0;max-width:100%;margin-top:18px;padding-top:15px;border-top:1px solid var(--border)}';

  function getGroup(id) {
    for (var index = 0; index < GROUPS.length; index += 1) if (GROUPS[index].id === id) return GROUPS[index];
    if(id===undefined)return GROUPS[0];throw new RangeError("Unknown group: "+id);
  }

  function getSubgroup(group, id) {
    for (var index = 0; index < group.subgroups.length; index += 1) if (group.subgroups[index].id === id) return group.subgroups[index];
    if(id===undefined)return group.subgroups[0];throw new RangeError("Unknown subgroup: "+id);
  }

  function sortedUnique(values) {
    var seen = Object.create(null);
    return values.filter(function (value) {
      var key = String(value);
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function sameSet(left, right) {
    var a = left.slice().sort(function (x, y) { return x - y; });
    var b = right.slice().sort(function (x, y) { return x - y; });
    return a.length === b.length && a.every(function (value, index) { return value === b[index]; });
  }

  function cosetPartition(group, subgroup) {
    validateSubgroup(group,subgroup);
    var left = [];
    var right = [];
    var leftSeen = Object.create(null);
    var rightSeen = Object.create(null);
    for (var representative = 0; representative < group.values.length; representative += 1) {
      if (!leftSeen[representative]) {
        var leftMembers = sortedUnique(subgroup.elements.map(function (member) { return group.mul[representative][member]; }));
        left.push({ representative: representative, members: leftMembers });
        leftMembers.forEach(function (member) { leftSeen[member] = true; });
      }
      if (!rightSeen[representative]) {
        var rightMembers = sortedUnique(subgroup.elements.map(function (member) { return group.mul[member][representative]; }));
        right.push({ representative: representative, members: rightMembers });
        rightMembers.forEach(function (member) { rightSeen[member] = true; });
      }
    }
    return { left: left, right: right };
  }

  function normalityCertificate(group, subgroup, partition) {
    for (var element = 0; element < group.values.length; element += 1) {
      var conjugated = subgroup.elements.map(function (member) {
        return group.mul[group.mul[element][member]][group.inv[element]];
      });
      if (!sameSet(conjugated, subgroup.elements)) {
        var leftCoset = partition.left.filter(function (coset) { return coset.members.indexOf(element) >= 0; })[0];
        var rightCoset = partition.right.filter(function (coset) { return coset.members.indexOf(element) >= 0; })[0];
        return { normal: false, witness: element, leftCoset: leftCoset.members, rightCoset: rightCoset.members };
      }
    }
    return { normal: true, witness: null, leftCoset: null, rightCoset: null };
  }

  function validateGroup(group){
    if(!group||!Array.isArray(group.values)||group.values.length<1||group.values.length>64)throw new TypeError('finite group with 1–64 elements required');
    var n=group.values.length;function index(x){return Number.isInteger(x)&&x>=0&&x<n;}
    if(!Array.isArray(group.labels)||group.labels.length!==n||!group.labels.every(function(x){return typeof x==='string';})||new Set(group.values.map(valueKey)).size!==n)throw new TypeError('distinct labelled elements required');
    if(!index(group.identity)||!Array.isArray(group.mul)||group.mul.length!==n||!group.mul.every(function(row){return Array.isArray(row)&&row.length===n&&row.every(index);})||!Array.isArray(group.inv)||group.inv.length!==n||!group.inv.every(index))throw new TypeError('closed multiplication and inverse table required');
    for(var a=0;a<n;a++){if(group.mul[a][group.identity]!==a||group.mul[group.identity][a]!==a||group.mul[a][group.inv[a]]!==group.identity||group.mul[group.inv[a]][a]!==group.identity)throw new RangeError('identity or inverse law failed');for(var b=0;b<n;b++)for(var c=0;c<n;c++)if(group.mul[group.mul[a][b]][c]!==group.mul[a][group.mul[b][c]])throw new RangeError('associativity failed');}return group;
  }
  function validateSubgroup(group,subgroup){validateGroup(group);var n=group.values.length;if(!subgroup||!Array.isArray(subgroup.elements)||!subgroup.elements.length||new Set(subgroup.elements).size!==subgroup.elements.length||!subgroup.elements.every(function(i){return Number.isInteger(i)&&i>=0&&i<n;}))throw new TypeError('distinct subgroup indices required');var H=new Set(subgroup.elements);if(!H.has(group.identity)||!subgroup.elements.every(function(a){return H.has(group.inv[a])&&subgroup.elements.every(function(b){return H.has(group.mul[a][b]);});}))throw new RangeError('not a subgroup');return subgroup;}
  function quotientCertificate(group,subgroup){
    validateSubgroup(group,subgroup);var partition=cosetPartition(group,subgroup),cosetOf=new Array(group.values.length);
    partition.left.forEach(function(c,i){c.members.forEach(function(x){cosetOf[x]=i;});});
    var table=partition.left.map(function(a){return partition.left.map(function(b){return cosetOf[group.mul[a.representative][b.representative]];});}),failure=null;
    partition.left.forEach(function(a,i){partition.left.forEach(function(b,j){a.members.forEach(function(x){b.members.forEach(function(y){var result=group.mul[x][y];if(cosetOf[result]!==table[i][j]&&!failure)failure={leftCoset:i,rightCoset:j,left:a.representative,right:b.representative,alternateLeft:x,alternateRight:y,result:group.mul[a.representative][b.representative],alternateResult:result,resultCoset:table[i][j],alternateResultCoset:cosetOf[result]};});});});});
    return {available:!failure,wellDefined:!failure,table:failure?[]:table,cosetLabels:partition.left.map(function(c){return group.labels[c.representative]+'H';}),failure:failure};
  }
  function colorAction(mask,permutation,n){if(!Number.isInteger(n)||n<3||n>8||!Number.isInteger(mask)||mask<0||mask>=Math.pow(2,n)||!Array.isArray(permutation)||permutation.length!==n||new Set(permutation).size!==n||!permutation.every(function(i){return Number.isInteger(i)&&i>=0&&i<n;}))throw new RangeError("valid n-bit coloring and position permutation required");var result=0;for(var i=0;i<n;i++)if((mask>>(n-1-i))&1)result|=1<<(n-1-permutation[i]);return result;}
  function necklaceReport(n,mask,reflections){
    if(!Number.isInteger(n)||n<3||n>8)throw new RangeError('3–8 labelled positions required');
    if(!Number.isInteger(mask)||mask<0||mask>=Math.pow(2,n))throw new RangeError('coloring outside n-bit range');
    if(typeof reflections!=='boolean')throw new TypeError('reflection flag must be boolean');
    var operations=[];for(var k=0;k<n;k++)operations.push({label:'r^'+k,permutation:Array.from({length:n},function(_,i){return(i+k)%n;})});
    if(reflections)for(var j=0;j<n;j++)operations.push({label:'r^'+j+'s',permutation:Array.from({length:n},function(_,i){return(j-i+n)%n;})});
    var orbit=sortedUnique(operations.map(function(g){return colorAction(mask,g.permutation,n);})).sort(function(a,b){return a-b;}),stabilizers=operations.filter(function(g){return colorAction(mask,g.permutation,n)===mask;}).map(function(g){return g.label;});
    var seen=new Set(),orbits=[];for(var x=0;x<Math.pow(2,n);x++)if(!seen.has(x)){var members=sortedUnique(operations.map(function(g){return colorAction(x,g.permutation,n);})).sort(function(a,b){return a-b;});members.forEach(function(v){seen.add(v);});orbits.push({representative:x,members:members});}
    var fixCounts=operations.map(function(g){var count=0;for(var x=0;x<Math.pow(2,n);x++)if(colorAction(x,g.permutation,n)===x)count++;return count;});
    return{n:n,mask:mask,reflections:reflections,groupOrder:operations.length,operations:operations,orbit:orbit,stabilizers:stabilizers,orbits:orbits,fixCounts:fixCounts,burnside:fixCounts.reduce(function(a,b){return a+b;},0)/operations.length};
  }

  function analyze(groupId, subgroupId) {
    var group = getGroup(groupId);
    var subgroup = getSubgroup(group, subgroupId);
    var partition = cosetPartition(group, subgroup);
    var normality = normalityCertificate(group, subgroup, partition);
    var quotient = quotientCertificate(group, subgroup, partition, normality.normal);
    return {
      groupId: group.id,
      groupLabel: group.label,
      subgroupId: subgroup.id,
      subgroupLabel: subgroup.label,
      groupOrder: group.values.length,
      subgroupOrder: subgroup.elements.length,
      index: partition.left.length,
      lagrange: group.values.length === subgroup.elements.length * partition.left.length,
      leftCosets: partition.left,
      rightCosets: partition.right,
      normal: normality.normal,
      normalWitness: normality.witness,
      normalWitnessLeft: normality.leftCoset,
      normalWitnessRight: normality.rightCoset,
      quotient: quotient,
      quotientName: subgroup.quotient
    };
  }

  function installStyles(doc) {
    if (!doc || !doc.createElement || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    (doc.head || doc.documentElement || doc.body).appendChild(style);
  }

  function setAttributes(node, attributes) {
    Object.keys(attributes || {}).forEach(function (key) {
      var value = attributes[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "htmlFor") node.setAttribute("for", String(value));
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

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function labelMembers(group, members) {
    return members.map(function (member) { return group.labels[member]; }).join(" · ");
  }

  function renderCosetSvg(doc,report,serial){
    var group=getGroup(report.groupId),columns=3,blockWidth=240,maxMembers=Math.max.apply(Math,report.leftCosets.map(function(c){return c.members.length;})),blockHeight=42+22*maxMembers,rows=Math.ceil(report.leftCosets.length/columns),secondY=65+rows*(blockHeight+14)+45,height=secondY+rows*(blockHeight+14)+20;
    var svg=svgElement(doc,'svg',{className:'ga-svg',viewBox:'0 0 760 '+height,role:'img','aria-labelledby':'ga-svg-title-'+serial+' ga-svg-desc-'+serial});
    svg.appendChild(svgElement(doc,'title',{id:'ga-svg-title-'+serial},'左陪集与右陪集的完整分块'));
    svg.appendChild(svgElement(doc,'desc',{id:'ga-svg-desc-'+serial},'每个方框列出一个陪集的全部成员，两个区域分别是aH与Ha。列举顺序不是元素大小或空间位置。'));
    function draw(cosets,y,title,color){svg.appendChild(svgElement(doc,'text',{x:20,y:y-15,'font-size':16,'font-weight':700},title));cosets.forEach(function(c,i){var x=20+(i%columns)*blockWidth,top=y+Math.floor(i/columns)*(blockHeight+14);svg.appendChild(svgElement(doc,'rect',{x:x,y:top,width:220,height:blockHeight,rx:5,fill:'var(--bg)',stroke:color,'stroke-width':2,'data-coset':title+':'+i}));svg.appendChild(svgElement(doc,'text',{x:x+12,y:top+23,'font-size':14,'font-weight':700},'代表元 '+group.labels[c.representative]));c.members.forEach(function(member,j){svg.appendChild(svgElement(doc,'text',{x:x+12,y:top+48+j*22,'font-size':14,'data-member':member},group.labels[member]));});});}
    draw(report.leftCosets,55,'左陪集 aH','var(--ga-blue)');draw(report.rightCosets,secondY,'右陪集 Ha','var(--ga-gold)');return svg;
  }
  function necklaceSvg(doc,report,serial){
    var cols=4,rows=Math.ceil(report.orbit.length/cols),height=55+rows*150,svg=svgElement(doc,'svg',{className:'ga-svg',viewBox:'0 0 760 '+height,role:'img','aria-label':'当前着色的全部不同对称结果'});
    svg.appendChild(svgElement(doc,'text',{x:20,y:25,'font-size':15},'蓝填充表示 1；空心表示 0。位置从顶端起顺时针编号 0,…,'+(report.n-1)+'。'));
    report.orbit.forEach(function(mask,index){var cx=95+190*(index%cols),cy=105+150*Math.floor(index/cols);svg.appendChild(svgElement(doc,'circle',{cx:cx,cy:cy,r:35,fill:'none',stroke:'var(--border)'}));for(var j=0;j<report.n;j++){var t=2*Math.PI*j/report.n-Math.PI/2,one=(mask>>(report.n-1-j))&1;svg.appendChild(svgElement(doc,'circle',{cx:cx+35*Math.cos(t),cy:cy+35*Math.sin(t),r:7,fill:one?'var(--ga-blue)':'var(--bg)',stroke:'var(--ga-blue)','stroke-width':2,'data-bead':mask+':'+j}));svg.appendChild(svgElement(doc,'text',{x:cx+52*Math.cos(t),y:cy+52*Math.sin(t)+4,'font-size':10,'text-anchor':'middle'},String(j)));}svg.appendChild(svgElement(doc,'text',{x:cx,y:cy+76,'font-size':14,'text-anchor':'middle'},mask.toString(2).padStart(report.n,'0')));});return svg;
  }

  function necklaceWidget(doc){
    var shell=element(doc,'section',{className:'ga-necklace','aria-label':'二色环的群作用实验'}),state={n:4,mask:3,reflections:false};
    shell.appendChild(element(doc,'h4',{text:'从操作到结果：二色环的轨道与稳定子'}));
    shell.appendChild(element(doc,'p',{className:'ga-note',text:'你已预测过四位置 0011 的旋转结果。继续变更着色前，先猜不同结果数与稳定子大小；颜色互换不属于本实验的对称。'}));
    var controls=element(doc,'div',{className:'ga-controls'}),nSelect=element(doc,'select',{'aria-label':'环形位置数'}),actionSelect=element(doc,'select',{'aria-label':'允许的对称操作'}),maskInput=element(doc,'input',{type:'range',min:0,max:15,step:1,value:3,'aria-label':'选择二色着色'}),output=element(doc,'output');
    for(var n=3;n<=8;n++)nSelect.appendChild(element(doc,'option',{value:n,text:String(n)}));nSelect.value='4';
    actionSelect.appendChild(element(doc,'option',{value:'rotation',text:'仅旋转 Cₙ'}));actionSelect.appendChild(element(doc,'option',{value:'dihedral',text:'旋转与翻折 Dₙ'}));
    [['位置数 n',nSelect],['对称规则',actionSelect],['着色（按位置0开始读）',maskInput,output]].forEach(function(items){var field=element(doc,'div',{className:'ga-field'});field.appendChild(element(doc,'label',{text:items[0]}));items.slice(1).forEach(function(x){field.appendChild(x);});controls.appendChild(field);});shell.appendChild(controls);
    var result=element(doc,'div',{'aria-live':'polite'});shell.appendChild(result);
    function render(){var r=necklaceReport(state.n,state.mask,state.reflections);clear(result);maskInput.max=String(Math.pow(2,state.n)-1);maskInput.value=String(state.mask);output.textContent=state.mask.toString(2).padStart(state.n,'0');
      result.appendChild(element(doc,'p',{className:'ga-certificate',text:'当前着色：'+r.orbit.length+' 个不同结果，稳定子 '+r.stabilizers.length+' 个操作；'+r.groupOrder+' = '+r.orbit.length+' × '+r.stabilizers.length+'。固定它的操作：'+r.stabilizers.join(', ')+'。'}));
      var frame=element(doc,'div',{className:'ga-frame',tabindex:0,role:'region','aria-label':'可横向滚动的着色轨道图'});frame.appendChild(necklaceSvg(doc,r,'neck'));result.appendChild(frame);
      result.appendChild(element(doc,'p',{className:'ga-note',text:'对全部 '+Math.pow(2,state.n)+' 种着色，不动点数依次为 ['+r.fixCounts.join(', ')+']；操作顺序为 '+r.operations.map(function(g){return g.label;}).join(', ')+'。本环实验选顺时针一步为 r，将位置 i 送到 i+1；s 将 i 送到 −i（模 n）。'}));
      result.appendChild(element(doc,'p',{className:'ga-certificate',text:'Burnside：不动点总数 '+r.fixCounts.reduce(function(a,b){return a+b;},0)+' ÷ '+r.groupOrder+' = '+r.burnside+' 类；独立按轨道分块也得到 '+r.orbits.length+' 类。'}));
      var detail=element(doc,'details',{}),summary=element(doc,'summary',{text:'查看全部着色的轨道分划'});detail.appendChild(summary);var wrap=element(doc,'div',{className:'ga-table-wrap',tabindex:0,role:'region','aria-label':'可横向滚动的全部着色轨道表'}),table=element(doc,'table');table.appendChild(element(doc,'thead',{},element(doc,'tr',{},['代表位串','全部不同结果','轨道大小'].map(function(x){return element(doc,'th',{scope:'col',text:x});}))));var body=element(doc,'tbody');r.orbits.forEach(function(o){body.appendChild(element(doc,'tr',{},[o.representative.toString(2).padStart(state.n,'0'),o.members.map(function(x){return x.toString(2).padStart(state.n,'0');}).join(', '),String(o.members.length)].map(function(x){return element(doc,'td',{text:x});})));});table.appendChild(body);wrap.appendChild(table);detail.appendChild(wrap);result.appendChild(detail);
    }
    nSelect.addEventListener('change',function(){state.n=Number(nSelect.value);state.mask=Math.min(state.mask,Math.pow(2,state.n)-1);render();});actionSelect.addEventListener('change',function(){state.reflections=actionSelect.value==='dihedral';render();});maskInput.addEventListener('input',function(){state.mask=Number(maskInput.value);render();});render();return shell;
  }

  function renderEvidence(doc, evidence, report, group) {
    clear(evidence);
    evidence.appendChild(element(doc, "div", { className: "ga-metrics" }, [
      element(doc, "div", { className: "ga-metric" }, [element(doc, "span", { text: "群阶 |G|" }), element(doc, "strong", { text: String(report.groupOrder) })]),
      element(doc, "div", { className: "ga-metric" }, [element(doc, "span", { text: "子群阶 |H|" }), element(doc, "strong", { text: String(report.subgroupOrder) })]),
      element(doc, "div", { className: "ga-metric" }, [element(doc, "span", { text: "指数 [G:H]" }), element(doc, "strong", { text: String(report.index) })]),
      element(doc, "div", { className: "ga-metric" }, [element(doc, "span", { text: "Lagrange 证书" }), element(doc, "strong", { text: report.lagrange ? "通过" : "失败" })])
    ]));
    var frame = element(doc, "div", { className: "ga-frame",tabindex:0,role:"region","aria-label":"可横向滚动的左右陪集图" });
    frame.appendChild(renderCosetSvg(doc, report, evidence.getAttribute("data-ga-serial")));
    evidence.appendChild(frame);
    var tableWrap = element(doc, "div", { className: "ga-table-wrap",tabindex:0,role:"region","aria-label":"可横向滚动的群论证书表" });
    var table = element(doc, "table");
    table.appendChild(element(doc, "caption", { text: "有限操作账本：左/右陪集与商结构" }));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, [
      element(doc, "th", { scope: "col", text: "项目" }), element(doc, "th", { scope: "col", text: "结果" }), element(doc, "th", { scope: "col", text: "证书读法" })
    ])));
    var rows = [
      ["左陪集", report.leftCosets.map(function (coset) { return "{" + labelMembers(group, coset.members) + "}"; }).join("；"), "互不相交且覆盖 G"],
      ["右陪集", report.rightCosets.map(function (coset) { return "{" + labelMembers(group, coset.members) + "}"; }).join("；"), report.normal ? "与左陪集一致" : "与左陪集不必一致"],
      ["正规性", report.normal ? "是" : "否", report.normal ? "所有 gHg⁻¹=H" : "反例操作 " + group.labels[report.normalWitness] + ""],
      ["商群", report.quotient.available && report.quotient.wellDefined ? (report.quotientName || ("阶 " + report.index)) : "无诱导商群", report.quotient.available ? (report.quotient.wellDefined ? "陪集乘法良定义" : "良定义检查失败") : "H 非正规，只有陪集集合"]
    ];
    var body = element(doc, "tbody");
    rows.forEach(function (row) { body.appendChild(element(doc, "tr", {}, row.map(function (value) { return element(doc, "td", { text: value }); }))); });
    table.appendChild(body);
    tableWrap.appendChild(table);
    evidence.appendChild(tableWrap);
    var certificateText = report.normal && report.quotient.wellDefined
      ? "商群证书通过：每个余类用一个代表元相乘，结果仍落在唯一余类中。这里的“通过”是该有限模型的可计算证书；正规子群才是一般商群定理的假设。"
      : "商群证书停止：发现左陪集与右陪集不同，因此当前 H 不是正规子群；可以保留陪集分划，但不能用原群乘法诱导商群。";
    evidence.appendChild(element(doc, "div", { className: "ga-certificate " + (report.normal ? "" : "ga-fail") }, certificateText));
    if(report.quotient.available){var wrap=element(doc,'div',{className:'ga-table-wrap',tabindex:0,role:'region','aria-label':'可横向滚动的商群乘法表'}),qt=element(doc,'table',{'data-quotient-table':'true'});qt.appendChild(element(doc,'caption',{text:'实际商群乘法：行代表元在左，列代表元在右；置换先做右边'}));qt.appendChild(element(doc,'thead',{},element(doc,'tr',{},['·'].concat(report.quotient.cosetLabels).map(function(x){return element(doc,'th',{scope:'col',text:x});}))));var qb=element(doc,'tbody');report.quotient.table.forEach(function(row,i){var tr=element(doc,'tr',{},element(doc,'th',{scope:'row',text:report.quotient.cosetLabels[i]}));row.forEach(function(j){tr.appendChild(element(doc,'td',{text:report.quotient.cosetLabels[j]}));});qb.appendChild(tr);});qt.appendChild(qb);wrap.appendChild(qt);evidence.appendChild(wrap);}
    else{var f=report.quotient.failure,labels=group.labels;evidence.appendChild(element(doc,'p',{className:'ga-certificate ga-fail','data-product-failure':'true',text:'换代表元的直接反例：同一输入块 '+report.quotient.cosetLabels[f.leftCoset]+' 与 '+report.quotient.cosetLabels[f.rightCoset]+'，选择 ('+labels[f.left]+', '+labels[f.right]+') 得 '+labels[f.result]+'，落入 '+report.quotient.cosetLabels[f.resultCoset]+'；改选 ('+labels[f.alternateLeft]+', '+labels[f.alternateRight]+') 得 '+labels[f.alternateResult]+'，却落入 '+report.quotient.cosetLabels[f.alternateResultCoset]+'。'}));evidence.appendChild(element(doc,'p',{className:'ga-note',text:'左右陪集反例：g='+labels[report.normalWitness]+'，gH={'+labelMembers(group,report.normalWitnessLeft)+'}，Hg={'+labelMembers(group,report.normalWitnessRight)+'}。'}));}
    evidence.appendChild(necklaceWidget(doc));

  }

  function questionSpecs(report) {
    var blockOptions = [1,2,3,4,6].map(String);
    var normalOptions = ["是，H 正规", "否，H 不正规"];
    var quotientOptions = ["可以定义群商", "只能得到陪集集合"];
    return [
      { key: "blocks", prompt: "这组 H 会把 G 分成几块等大的左陪集？", options: blockOptions, answer: String(report.index) },
      { key: "normal", prompt: "这个 H 是否正规？", options: normalOptions, answer: report.normal ? normalOptions[0] : normalOptions[1] },
      { key: "quotient", prompt: "是否能用原群乘法在陪集上定义商群？", options: quotientOptions, answer: report.normal ? quotientOptions[0] : quotientOptions[1] },
      {key:"orbit",prompt:"只旋转四个环形位置，着色 0011 有几个不同结果？",options:["2","4","16"],answer:"4"}
    ];
  }

  function mount(root, api) {
    var doc = root.ownerDocument || (typeof document !== "undefined" ? document : null);
    if (!doc) return;
    installStyles(doc);
    root.classList.add("ga-lab");
    INSTANCE += 1;
    var serial = INSTANCE;
    var state = { groupId: "c4", subgroupId: "half-turn", predictions: Object.create(null), revealed: false };
    var shell = element(doc, "div", { className: "ga-shell" });
    shell.appendChild(element(doc, "h3", { text: "有限群证书台：陪集、正规性与商群" }));
    shell.appendChild(element(doc, "p", { className: "ga-intro", text: "选择一个小群和子群；所有乘法、逆元与陪集都由固定的离散表逐项计算。先预测，再揭晓证书。" }));
    var controls = element(doc, "div", { className: "ga-controls" });
    var groupField = element(doc, "div", { className: "ga-field" });
    var groupLabel = element(doc, "label", { htmlFor: "ga-group-" + serial, text: "有限群" });
    var groupSelect = element(doc, "select", { id: "ga-group-" + serial, "aria-label": "选择有限群" });
    GROUPS.forEach(function (group) { groupSelect.appendChild(element(doc, "option", { value: group.id, text: group.label })); });
    groupField.appendChild(groupLabel); groupField.appendChild(groupSelect);
    var subgroupField = element(doc, "div", { className: "ga-field" });
    var subgroupLabel = element(doc, "label", { htmlFor: "ga-subgroup-" + serial, text: "子群 H" });
    var subgroupSelect = element(doc, "select", { id: "ga-subgroup-" + serial, "aria-label": "选择子群" });
    subgroupField.appendChild(subgroupLabel); subgroupField.appendChild(subgroupSelect);
    controls.appendChild(groupField); controls.appendChild(subgroupField); shell.appendChild(controls);

    var prediction = element(doc, "section", { className: "ga-prediction", "aria-labelledby": "ga-prediction-title-" + serial });
    prediction.appendChild(element(doc, "h4", { id: "ga-prediction-title-" + serial, text: "先预测：把证书写在揭晓前" }));
    var questionList = element(doc, "div");
    prediction.appendChild(questionList);
    var actionRow = element(doc, "div", { className: "ga-actions" });
    var revealButton = element(doc, "button", { type: "button", className: "ga-primary", text: "核对预测并揭晓" });
    var resetButton = element(doc, "button", { type: "button", text: "重置实验" });
    actionRow.appendChild(revealButton); actionRow.appendChild(resetButton); prediction.appendChild(actionRow);
    var status = element(doc, "p", { className: "ga-status", "aria-live": "polite", "aria-atomic": "true" });
    prediction.appendChild(status); shell.appendChild(prediction);

    var evidence = element(doc, "section", { className: "ga-evidence", hidden: true, tabindex:-1, "data-ga-serial": String(serial), "aria-label": "有限群证书结果" });
    shell.appendChild(evidence);
    root.replaceChildren(shell);

    function announce(message) {
      if (api && typeof api.announce === "function") api.announce(root, message);
    }

    function resetPredictions() {
      state.predictions = Object.create(null);
      state.revealed = false;
      evidence.hidden = true;
      clear(evidence);
    }

    function renderSubgroups() {
      var group = getGroup(state.groupId);
      clear(subgroupSelect);
      group.subgroups.forEach(function (subgroup) { subgroupSelect.appendChild(element(doc, "option", { value: subgroup.id, text: subgroup.label })); });
      subgroupSelect.value = state.subgroupId;
    }

    function renderQuestions(report) {
      clear(questionList);
      questionSpecs(report).forEach(function (question, questionIndex) {
        var fieldset = element(doc, "fieldset");
        fieldset.appendChild(element(doc, "legend", { text: (questionIndex + 1) + ". " + question.prompt }));
        var options = element(doc, "div", { className: "ga-options", role: "group", "aria-label": question.prompt });
        question.options.forEach(function (option) {
          var button = element(doc, "button", { type: "button", "aria-pressed": state.predictions[question.key] === option ? "true" : "false", text: option,"data-question":question.key,"data-value":option });
          button.addEventListener("click", function () {
            state.predictions[question.key] = option;
            state.revealed = false;
            evidence.hidden = true;
            renderQuestions(report);questionList.querySelector('[data-question="'+question.key+'"][data-value="'+option+'"]').focus();
          });
          options.appendChild(button);
        });
        fieldset.appendChild(options); questionList.appendChild(fieldset);
      });
    }

    function render() {
      var group = getGroup(state.groupId);
      var report = analyze(state.groupId, state.subgroupId);
      groupSelect.value = state.groupId;
      renderSubgroups();
      renderQuestions(report);
      if (state.revealed) {
        evidence.hidden = false;
        renderEvidence(doc, evidence, report, group);
      }
    }

    groupSelect.addEventListener("change", function () {
      state.groupId = groupSelect.value;
      state.subgroupId = getGroup(state.groupId).subgroups[0].id;
      resetPredictions(); render();
      status.textContent = "已切换模型；请重新预测。"; status.className = "ga-status";
      announce("已切换有限群模型，请重新预测。");
    });
    subgroupSelect.addEventListener("change", function () {
      state.subgroupId = subgroupSelect.value;
      resetPredictions(); render();
      status.textContent = "已切换子群；请重新预测正规性与商群条件。"; status.className = "ga-status";
      announce("已切换子群，请重新预测。");
    });
    revealButton.addEventListener("click", function () {
      var report = analyze(state.groupId, state.subgroupId);
      var questions = questionSpecs(report);
      var answered = questions.every(function (question) { return state.predictions[question.key] !== undefined; });
      if (!answered) {
        status.textContent = "请先回答四道预测题，再揭晓有限证书。"; status.className = "ga-status ga-warn";
        announce("还有预测题未回答。");
        return;
      }
      var score = questions.reduce(function (total, question) { return total + (state.predictions[question.key] === question.answer ? 1 : 0); }, 0);
      state.revealed = true; evidence.hidden = false;
      renderEvidence(doc, evidence, report, getGroup(state.groupId));
      status.textContent = "预测得分 " + score + "/4；现在把枚举证书与一般定理的假设分开阅读。"; status.className = "ga-status " + (score === 4 ? "ga-pass" : "ga-warn");
      evidence.focus();
      announce("证书已揭晓，预测得分 " + score + "/4。");
    });
    resetButton.addEventListener("click", function () {
      state.groupId = "c4"; state.subgroupId = "half-turn"; resetPredictions(); render();
      status.textContent = "已回到 C4 与 H={0,2}；预测状态已清空。"; status.className = "ga-status";
      questionList.querySelector("button").focus();announce("实验已重置。");
    });
    render();
  }

  function assert(condition, message) {
    if (!condition) throw new Error("group-actions: " + message);
  }

  function selfTest() {
    var checks = 0;
    function check(condition, message) { checks += 1; assert(condition, message); }
    check(GROUPS.length === 3, "three exact group presets");
    var subgroupCases = 0;
    GROUPS.forEach(function (group) {
      check(group.mul.length === group.values.length, group.id + " multiplication rows");
      group.values.forEach(function (value, index) {
        check(group.mul[group.identity][index] === index && group.mul[index][group.identity] === index, group.id + " identity law");
        check(group.mul[index][group.inv[index]] === group.identity, group.id + " inverse law");
      });
      group.subgroups.forEach(function (subgroup) {
        subgroupCases += 1;
        var report = analyze(group.id, subgroup.id);
        check(report.lagrange, group.id + "/" + subgroup.id + " Lagrange product");
        check(report.leftCosets.every(function (coset) { return coset.members.length === subgroup.elements.length; }), group.id + "/" + subgroup.id + " left coset size");
        check(report.rightCosets.every(function (coset) { return coset.members.length === subgroup.elements.length; }), group.id + "/" + subgroup.id + " right coset size");
        check(report.leftCosets.reduce(function (all, coset) { return all.concat(coset.members); }, []).sort().join(",") === group.values.map(function (_, index) { return index; }).sort().join(","), group.id + "/" + subgroup.id + " partition");
      });
    });
    var c4 = analyze("c4", "half-turn");
    check(c4.normal && c4.quotient.available && c4.quotient.wellDefined, "C4 half-turn quotient certificate");
    check(c4.leftCosets.length === 2 && c4.leftCosets[0].members.length === 2, "C4 coset count and size");
    var v4 = analyze("v4", "a-line");
    check(v4.normal && v4.quotient.wellDefined, "V4 subgroup normality");
    var s3Bad = analyze("s3", "transposition");
    check(!s3Bad.normal && !s3Bad.quotient.available, "S3 transposition blocks quotient");
    check(s3Bad.normalWitness !== null && !sameSet(s3Bad.normalWitnessLeft, s3Bad.normalWitnessRight), "S3 left/right witness differs");
    var s3Good = analyze("s3", "a3");
    check(s3Good.normal && s3Good.quotient.available && s3Good.quotient.wellDefined, "S3 A3 quotient certificate");
    return { checks: checks, groups: GROUPS.length, subgroupCases: subgroupCases };
  }

  return {
    necklaceReport:necklaceReport,colorAction:colorAction,validateGroup:validateGroup,validateSubgroup:validateSubgroup,renderCosetSvg:renderCosetSvg,necklaceSvg:necklaceSvg,
    GROUPS: GROUPS,
    getGroup: getGroup,
    cosetPartition: cosetPartition,
    analyze: analyze,
    quotientCertificate: quotientCertificate,
    mount: mount,
    selfTest: selfTest
  };
});

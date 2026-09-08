"use strict";
// Exercise the shared contract and event wiring without a browser dependency.
const assert = require("node:assert/strict");
const renderer = require("../course-shared/research-renderer.js");
let checks = 0;
function equal(actual, expected) { assert.deepEqual(actual, expected); checks++; }
function throws(fn) { assert.throws(fn); checks++; }
equal(renderer.format(90), "90");
equal(renderer.format(100), "100");
equal(renderer.format(1.25), "1.25");
equal(renderer.format(null), "未定义");
equal(renderer.format(1e-8), "1.000e-8");
throws(() => renderer.format(Infinity));

let calls = 0;
const config = {
  title: "检验", predict: "先预测", scope: "确定性测试模型",
  controls: [["x", "整数 x", 0, 10, 1, 2], ["scale", "连续尺度", .1, 1, .1, .5]],
  compute(v) {
    calls++;
    return { numeric: { y: v.x * v.scale }, rows: [["输出", v.x * v.scale]],
      chart: { title: "可见结果", xlabel: "输入", ylabel: "输出", xticks: [0, 1, 2], series: [{ label: "曲线", points: [[0, 0], [1, v.x * v.scale], [2, 0]] }] }, text: "结果解释" };
  }
};
const lab = renderer.create("test", { test: config });
equal(lab.topics, ["test"]);
equal(lab.defaults("test"), { x: 2, scale: .5 });
equal(lab.compute("test").numeric.y, 1);
equal(lab.compute("test", { scale: .37 }).numeric.y, .74);
throws(() => lab.compute("test", { x: 1.5 }));
throws(() => lab.compute("test", { scale: 0 }));
throws(() => lab.compute("test", { x: 11 }));
throws(() => lab.compute("test", { x: NaN }));
throws(() => lab.compute("constructor"));
throws(() => lab.compute("__proto__"));
const independent = lab.defaults("test"); independent.x = 9;
equal(lab.defaults("test").x, 2);
const broken = renderer.create("broken", { bad: { ...config, compute: () => ({ rows: [["值", 1]], chart: { series: [{ points: [[0, Infinity]] }] } }) } });
throws(() => broken.compute("bad"));

class Node {
  constructor(tag, attrs, children) {
    this.tag = tag; this.attrs = attrs || {}; this.children = []; this.listeners = {};
    this.hidden = !!this.attrs.hidden;
    this.value = this.attrs.value === undefined ? "" : String(this.attrs.value);
    this.append(...(Array.isArray(children) ? children : children === undefined ? [] : [children]));
  }
  append(...items) { items.forEach(x => { if (x !== undefined && x !== null && x !== false) this.children.push(x instanceof Node ? x : String(x)); }); }
  appendChild(x) { this.append(x); return x; }
  replaceChildren(...items) { this.children = []; this.append(...items); }
  setAttribute(k, v) { this.attrs[k] = v; }
  getAttribute(k) { return this.attrs[k] ?? null; }
  addEventListener(k, fn) { this.listeners[k] = fn; }
  fire(k) { this.listeners[k](); }
  get textContent() { return this.children.map(x => x instanceof Node ? x.textContent : x).join(""); }
  set textContent(x) { this.children = [String(x)]; }
}
function all(node, predicate) {
  return (predicate(node) ? [node] : []).concat(node.children.filter(x => x instanceof Node).flatMap(x => all(x, predicate)));
}
const doc = { head: new Node("head"), getElementById(id) { return all(this.head, n => n.attrs.id === id)[0]; } };
const root = new Node("div", { "data-research-topic": "test" }); root.ownerDocument = doc;
const api = { el: (t, a, c) => new Node(t, a, c), svg: (t, a, c) => new Node(t, a, c) };
calls = 0; lab.mount(root, api);
equal(calls, 0); // Prediction state must not reveal computation.
const button = all(root, n => n.tag === "button")[0], reset = all(root, n => n.tag === "button")[1];
const output = all(root, n => n.attrs["data-research-output"])[0];
equal(output.hidden, true);
const sliders = all(root, n => n.tag === "input");
sliders[0].value = "4"; sliders[0].fire("input"); equal(calls, 0);
button.fire("click"); equal(output.hidden, false); equal(calls, 1);
equal(all(output, n => n.tag === "td")[0].textContent, "2");
sliders[0].value = "0"; sliders[0].fire("input");
equal(all(output, n => n.tag === "td")[0].textContent, "0");
const yTicks = all(output, n => n.tag === "text" && n.attrs.className === "rs-y-tick");
equal(yTicks.length, 1); equal(yTicks[0].textContent, "0");
const xTicks = all(output, n => n.tag === "text" && n.attrs.className === "rs-x-tick");
equal(xTicks.map(n => n.textContent), ["0", "1", "2"]);
equal(xTicks.map(n => n.attrs["text-anchor"]), ["start", "middle", "end"]);
reset.fire("click"); equal(Number(sliders[0].value), 2);
equal(all(output, n => n.tag === "td")[0].textContent, "1");
button.fire("click"); equal(output.hidden, true); equal(button.attrs["aria-expanded"], "false");
// A compute failure must show a recoverable explanation instead of stale results.
button.fire("click"); sliders[0].value = "99"; sliders[0].fire("input");
equal(all(output, n => n.attrs.role === "status").length, 1);
equal(all(output, n => n.tag === "table").length, 0);
reset.fire("click"); equal(all(output, n => n.tag === "table").length, 1);
// Isolated points must be visible and must not become a spurious connecting curve.
const scatter=renderer.create("scatter",{test:{...config,compute:()=>({rows:[["points",2]],chart:{title:"points",xlabel:"x",ylabel:"y",series:[{label:"roots",dots:true,points:[[-1,0],[1,0]]}]},text:"two roots"})}});
const scatterRoot=new Node("div",{"data-research-topic":"test"});scatterRoot.ownerDocument=doc;
scatter.mount(scatterRoot,api);all(scatterRoot,n=>n.tag==="button")[0].fire("click");
equal(all(scatterRoot,n=>n.attrs.className==="rs-data-point").length,2);
equal(all(scatterRoot,n=>n.tag==="polyline").length,0);
equal(all(scatterRoot,n=>n.attrs.className==="rs-data-point").map(n=>n.attrs.cx),[104,420]);
// A unit circle must stay circular when the plotting rectangle is not square.
const circle=renderer.create("circle",{test:{...config,compute:()=>({rows:[["points",4]],chart:{equalScale:true,title:"circle",xlabel:"x",ylabel:"y",series:[{dots:true,points:[[-1,0],[1,0],[0,-1],[0,1]]}]},text:"unit circle"})}});
const circleRoot=new Node("div",{"data-research-topic":"test"});circleRoot.ownerDocument=doc;
circle.mount(circleRoot,api);all(circleRoot,n=>n.tag==="button")[0].fire("click");
const cp=all(circleRoot,n=>n.attrs.className==="rs-data-point");
equal(cp.length,4);
equal(Math.abs((cp[1].attrs.cx-cp[0].attrs.cx)-(cp[2].attrs.cy-cp[3].attrs.cy))<1e-10,true);
equal(cp.every(p=>p.attrs.cx>=104&&p.attrs.cx<=420&&p.attrs.cy>=48&&p.attrs.cy<=254),true);
console.log(`PASS: ${checks} shared renderer contract and interaction checks`);

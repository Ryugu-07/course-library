(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ResearchLab = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function format(value) {
    if (typeof value === "string") return value;
    if (value === null) return "未定义";
    if (!Number.isFinite(value)) throw Error("结果必须为有限数值");
    if (value === 0) return "0";
    if (Math.abs(value) < 0.0001 || Math.abs(value) >= 100000) return value.toExponential(3);
    return Number(value.toFixed(5)).toString();
  }

  function create(name, configs) {
    function config(topic) {
      if (!Object.prototype.hasOwnProperty.call(configs, topic)) throw Error("未知实验主题：" + topic);
      return configs[topic];
    }
    function defaults(topic) {
      return Object.fromEntries(config(topic).controls.map(c => [c[0], c[5]]));
    }
    function compute(topic, input) {
      const spec = config(topic), values = Object.assign(defaults(topic), input || {});
      spec.controls.forEach(function (c) {
        const value = values[c[0]];
        if (!Number.isFinite(value) || value < c[2] || value > c[3]) throw Error(c[1] + " 超出本实验定义域");
        const integer = c[6] === true || (c[6] !== false && Number.isInteger(c[4]) && c[4] >= 1);
        if (integer && !Number.isInteger(value)) throw Error(c[1] + " 必须为整数");
      });
      if (spec.validate) spec.validate(values);
      const result = spec.compute(values);
      if (!result || !Array.isArray(result.rows) || !result.chart || !Array.isArray(result.chart.series)) {
        throw Error("实验缺少计算表或曲线");
      }
      result.rows.forEach(row => format(row[1]));
      result.chart.series.forEach(function (line) {
        if (!line.points.length || line.points.some(p => p.length !== 2 || !p.every(Number.isFinite))) {
          throw Error("曲线数据必须包含有限坐标");
        }
      });
      return Object.assign({}, result, { values: values });
    }
    function mount(root, api) {
      const { el, svg } = api, doc = root.ownerDocument;
      const topic = root.getAttribute("data-research-topic"), spec = config(topic);
      if (!doc.getElementById("research-lab-style")) {
        doc.head.appendChild(el("style", { id: "research-lab-style" }, `
          .rs-lab{line-height:1.75;min-width:0}.rs-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:12px}.rs-controls label{display:flex;flex-direction:column;gap:4px}.rs-lab input{width:100%}.rs-lab button{font:inherit;cursor:pointer;padding:7px 12px}.rs-lab output{font-variant-numeric:tabular-nums}.rs-lab figure{margin:20px 0}.rs-lab .rs-chart{width:100%;max-width:560px;display:block;margin:auto}.rs-chart text{font:20px sans-serif;fill:currentColor}.rs-lab figcaption>div{display:flex;align-items:center;text-align:left;gap:7px}.rs-lab figcaption svg{width:44px!important;height:20px!important;max-width:44px;flex-shrink:0;display:inline-block!important}.rs-lab table{width:100%;font-size:15px}.rs-lab th,.rs-lab td{padding:7px;text-align:left;overflow-wrap:anywhere}.rs-scope{border-left:3px solid #497ec5;padding-left:12px}.rs-output[hidden]{display:none}.rs-error{border-left:3px solid #c65c3d;padding-left:12px}
        `));
      }
      let values = defaults(topic), revealed = false;
      const inputs = {}, shell = el("div", { className: "rs-lab" });
      const controls = el("div", { className: "rs-controls" });
      const output = el("div", { className: "rs-output", "data-research-output": true, hidden: true });
      spec.controls.forEach(function (c) {
        const number = el("output", {}, format(values[c[0]]));
        const input = el("input", { type: "range", min: c[2], max: c[3], step: c[4], value: values[c[0]], "aria-label": c[1] });
        inputs[c[0]] = { input: input, number: number };
        input.addEventListener("input", function () {
          values[c[0]] = Number(input.value);
          number.textContent = format(values[c[0]]);
          if (revealed) render();
        });
        controls.appendChild(el("label", {}, [c[1], number, input]));
      });
      const reveal = el("button", { type: "button", "aria-expanded": "false" }, "查看计算与图像");
      const reset = el("button", { type: "button" }, "恢复本讲默认值");
      reveal.addEventListener("click", function () {
        revealed = !revealed;
        output.hidden = !revealed;
        reveal.setAttribute("aria-expanded", String(revealed));
        reveal.textContent = revealed ? "收起计算与图像" : "查看计算与图像";
        if (revealed) render();
      });
      reset.addEventListener("click", function () {
        values = defaults(topic);
        Object.keys(inputs).forEach(function (key) {
          inputs[key].input.value = values[key];
          inputs[key].number.textContent = format(values[key]);
        });
        if (revealed) render();
      });
      shell.append(el("h3", {}, spec.title), el("p", {}, spec.predict), controls,
        el("p", {}, [reveal, " ", reset]), el("p", { className: "rs-scope" }, spec.scope), output);
      root.replaceChildren(shell);

      function draw(chart) {
        const W = 440, H = 310, left = 104, right = 20, top = 48, bottom = 56;
        const points = chart.series.flatMap(s => s.points);
        if (!points.length) throw Error("缺少曲线坐标");
        let xmin = Math.min(...points.map(p => p[0])), xmax = Math.max(...points.map(p => p[0]));
        if (xmin === xmax) { xmin -= 0.5; xmax += 0.5; }
        const ymin = Math.min(0, ...points.map(p => p[1])), ymax = Math.max(0, ...points.map(p => p[1]));
        const pad = Math.max((ymax - ymin) * 0.07, 1e-10);
        const lo = ymin - pad, hi = ymax + pad;
        const X = x => left + (x - xmin) / (xmax - xmin) * (W - left - right);
        const Y = y => top + (hi - y) / (hi - lo) * (H - top - bottom);
        const g = svg("svg", { className: "rs-chart", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": chart.title + "；横轴：" + chart.xlabel + "；纵轴：" + chart.ylabel }, [
          svg("title", {}, chart.title), svg("text", { x: W / 2, y: 25, "text-anchor": "middle" }, chart.title),
          svg("path", { d: `M${left},${top}V${H-bottom}H${W-right}`, stroke: "currentColor", fill: "none" }),
          svg("text", { x: W / 2, y: H - 9, "text-anchor": "middle" }, chart.xlabel)
        ]);
        const tickFormat = n => n === 0 ? "0" : Math.abs(n) < 0.01 || Math.abs(n) >= 10000 ? n.toExponential(1) : Number(n.toFixed(2)).toString();
        [...new Set(chart.xticks || [xmin, (xmin + xmax) / 2, xmax])].forEach(x => {
          g.appendChild(svg("text", { className: "rs-x-tick", x: X(x), y: H - bottom + 27, "text-anchor": x === xmin ? "start" : x === xmax ? "end" : "middle" }, tickFormat(x)));
        });
        [...new Set([ymin, (ymin + ymax) / 2, ymax])].forEach(y => {
          g.appendChild(svg("text", { className: "rs-y-tick", x: left - 8, y: Y(y) + 7, "text-anchor": "end" }, tickFormat(y)));
        });
        const palette = ["#497ec5", "#c65c3d", "#20876c", "#9868b4"];
        const patterns = ["none", "8 4", "2 5", "10 3 2 3"];
        chart.series.forEach(function (s, i) {
          if (s.dots) {
            s.points.forEach(p => g.appendChild(svg("circle", { cx: X(p[0]), cy: Y(p[1]), r: 6, fill: s.color || palette[i % 4], className: "rs-data-point" })));
          } else g.appendChild(svg("polyline", { points: s.points.map(p => `${X(p[0])},${Y(p[1])}`).join(" "), fill: "none", stroke: s.color || palette[i % 4], "stroke-width": 3, "stroke-dasharray": s.dash || patterns[i % 4] }));
        });
        if (chart.marker && chart.marker.every(Number.isFinite)) g.appendChild(svg("circle", { cx: X(chart.marker[0]), cy: Y(chart.marker[1]), r: 6, fill: "none", stroke: "currentColor", "stroke-width": 2 }));
        const legend = el("figcaption", {}, chart.series.map(function (s, i) {
          return el("div", {}, [svg("svg", { viewBox: "0 0 44 20", "aria-hidden": "true" }, s.dots ? svg("circle", { cx: 22, cy: 10, r: 6, fill: s.color || palette[i % 4] }) : svg("path", { d: "M1,10H43", stroke: s.color || palette[i % 4], "stroke-width": 3, "stroke-dasharray": s.dash || patterns[i % 4] })), s.label]);
        }));
        legend.appendChild(el("p", {}, "纵轴：" + chart.ylabel + "。坐标范围随数据缩放；离散数据之间的连线仅便于阅读。"));
        return el("figure", {}, [g, legend]);
      }
      function render() {
        try {
          const result = compute(topic, values);
          const table = el("table", {}, [
            el("thead", {}, el("tr", {}, [el("th", { scope: "col" }, "计算量"), el("th", { scope: "col" }, "数值／解释")])),
            el("tbody", {}, result.rows.map(row => el("tr", {}, [el("th", { scope: "row" }, row[0]), el("td", {}, format(row[1]))])))
          ]);
          output.replaceChildren(table, draw(result.chart), el("p", { className: "rs-scope", "aria-live": "polite" }, result.text));
        } catch (error) {
          output.replaceChildren(el("p", { className: "rs-error", role: "status" }, "本设置无法计算：" + error.message + "。请调整参数，或恢复默认值后再试。"));
        }
      }
    }
    return { topics: Object.keys(configs), configs: configs, defaults: defaults, compute: compute, mount: mount };
  }
  return { create: create, format: format };
});

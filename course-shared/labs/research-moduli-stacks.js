(function (root, factory) {
  "use strict";
  const lib = factory(
    typeof module === "object" && module.exports
      ? require("../research-renderer")
      : root.ResearchLab
  );
  if (typeof module === "object" && module.exports) module.exports = lib;
  else if (root.CourseLearning) {
    root.CourseLearning.register("research-moduli-stacks", lib.mount);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (core) {
  "use strict";

  const unit = (t) => [Math.cos(t), Math.sin(t)];
  const clean = (x) => (Math.abs(x) < 1e-12 ? 0 : x);

  function quotient(w, nonzero) {
    if (!Number.isInteger(w) || w < 1 || w > 8 || ![0, 1].includes(nonzero)) {
      throw Error("无效权或点类型");
    }
    return {
      weight: w,
      stabilizer: nonzero ? `μ_${w}` : "Gm",
      finite: Boolean(nonzero),
      order: nonzero ? w : null,
      roots: nonzero
        ? Array.from({ length: w }, (_, i) => unit((2 * Math.PI * i) / w))
        : [],
      invariantExponents: [0],
      orbit: nonzero ? "C×" : "{0}",
      closure: nonzero ? "A¹" : "{0}",
      openQuotient: `Bμ_${w}`,
    };
  }

  function descent(d, m, w, sectionMode = 1) {
    if (
      ![d, m, w, sectionMode].every(Number.isInteger) ||
      Math.abs(d) > 8 ||
      m < 1 ||
      m > 8 ||
      w < 1 ||
      w > 8 ||
      ![0, 1].includes(sectionMode)
    ) {
      throw Error("次数、覆盖次数或截面模式越界");
    }

    const sectionDegree = w * d;
    const pullbackSectionDegree = m * sectionDegree;
    const nonzeroSectionAvailable = sectionDegree >= 0;
    const selectedObjectExists = sectionMode === 0 || nonzeroSectionAvailable;
    const selectedSection =
      sectionMode === 0
        ? "zero"
        : nonzeroSectionAvailable
          ? "example-nonzero"
          : "unavailable";

    let globalAutomorphisms = "不适用（所选非零截面不存在）";
    let infinityFiberStabilizer = "不适用（所选对象不存在）";
    if (selectedSection === "zero") {
      globalAutomorphisms = "C×";
      infinityFiberStabilizer = "Gm";
    } else if (selectedSection === "example-nonzero") {
      globalAutomorphisms = w === 1 ? "μ₁={1}，平凡" : `μ_${w}`;
      infinityFiberStabilizer =
        sectionDegree > 0
          ? "Gm（截面值在∞为0）"
          : w === 1
            ? "μ₁={1}，平凡"
            : `μ_${w}`;
    }

    return {
      degree: d,
      pullbackDegree: m * d,
      sectionDegree,
      pullbackSectionDegree,
      h0: Math.max(sectionDegree + 1, 0),
      pullbackH0: Math.max(pullbackSectionDegree + 1, 0),
      trivial: d === 0,
      sectionExists: nonzeroSectionAvailable,
      zeroSectionAlwaysExists: true,
      nonzeroSectionAvailable,
      selectedSection,
      selectedObjectExists,
      factorsThroughNonzeroOpen: selectedSection === "example-nonzero" && sectionDegree === 0,
      globalAutomorphisms,
      infinityFiberStabilizer,
    };
  }

  const configs = {
    "quotient-gm": {
      title: "两个轨道，不代表同一个模问题",
      predict:
        "先预测：把权1改为权2，轨道集合会变吗？固定x=1的群元素会多出哪一个？非零开子叠又会从普通点变成什么？",
      scope:
        "底域C，λ·x=λ^w x，w为正整数。左图式计算复几何点的作用与稳定子；任意底空间上的对象仍须是torsor加等变映射，不能用这组点替代。",
      controls: [
        ["w", "作用权 w", 1, 6, 1, 2],
        ["nonzero", "点类型：0原点 / 1非零代表", 0, 1, 1, 1],
      ],
      compute(v) {
        const r = quotient(v.w, v.nonzero);
        const theta = Array.from(
          { length: 145 },
          (_, i) => (2 * Math.PI * i) / 144
        );
        return {
          numeric: r,
          rows: [
            ["T点的对象", `线丛L、截面s∈Γ(T,L^⊗${v.w})及保持s的同构`],
            ["当前代表", v.nonzero ? "x=1" : "x=0"],
            ["当前轨道", r.orbit],
            ["轨道的Zariski闭包", r.closure],
            ["整个朴素轨道集合", "{零轨道, 非零轨道}"],
            ["仿射不变量环 / 商", "C[x]^Gm=C；Spec C只有一点"],
            ["非零开子叠", `[C×/Gm]_w ≃ ${r.openQuotient}`],
            [
              "当前自同构群",
              v.nonzero
                ? v.w === 1
                  ? "μ₁={1}，平凡"
                  : `μ_${v.w}；λ^${v.w}=1`
                : "整个Gm（复一维）",
            ],
            ["稳定子阶", v.nonzero ? r.order : "无限；不是仅图中的单位圆"],
            ["当前复几何点的无穷小自同构维数", v.nonzero ? 0 : 1],
            ["整个商叠是否DM", "否；原点有正维稳定子"],
          ],
          chart: {
            equalScale: true,
            title: "权作用与稳定子",
            xlabel: "复数实部",
            ylabel: "复数虚部",
            series: [
              { label: "群元素λ：单位圆截面", points: theta.map(unit) },
              {
                label: "像λ^w x",
                points: theta.map((t) => (v.nonzero ? unit(v.w * t) : [0, 0])),
              },
              {
                label: v.nonzero ? "全部有限稳定子μ_w" : "稳定子Gm的一圈截面",
                points: v.nonzero
                  ? r.roots.map((z) => z.map(clean))
                  : theta.map(unit),
                dots: true,
              },
            ],
          },
          text:
            "非零轨道是整个C×，图只画单位圆。改变权不会改变这条轨道或不变量商，却改变稳定子和非零开子叠Bμ_w；原点更具有整个Gm。图上的两条圆可能重合，正是只看轨迹无法辨认绕行次数与自同构的提醒。",
        };
      },
    },
    descent: {
      title: "在重叠上实际代入：拉回怎样改变一族线丛？",
      predict:
        "先预测：O(2)沿z↦z³拉回，过渡函数为何成为z⁶？若wd<0，非零截面模式应报告什么？整族自同构与无穷远纤维稳定子何时不同？",
      scope:
        "底域C，底空间P¹；d为线丛整数次数，m与w为正整数。基关系e₁=z^d e₀，F_m:[X₀:X₁]↦[X₀^m:X₁^m]。绘图使用连续相位，单位是整圈，不把主值相位的跳跃当作几何奇点。",
      controls: [
        ["d", "线丛次数 d", -3, 3, 1, 1],
        ["m", "映射次数 m", 1, 4, 1, 3],
        ["w", "截面所在张量幂 w", 1, 3, 1, 2],
        ["sectionMode", "截面：0零截面 / 1示例非零截面", 0, 1, 1, 1],
      ],
      compute(v) {
        const r = descent(v.d, v.m, v.w, v.sectionMode);
        const phase = Array.from({ length: 61 }, (_, i) => i / 60);
        let selectedObject = `(O(${v.d}), 0)`;
        let selectedSection = "零截面；任意次数都合法";
        let zeroOrder = "零截面不具有有限零点阶";

        if (r.selectedSection === "example-nonzero") {
          selectedObject = `(O(${v.d}), X₀^${r.sectionDegree})`;
          selectedSection = `齐次截面X₀^${r.sectionDegree}`;
          zeroOrder = `${r.sectionDegree} / ${r.pullbackSectionDegree}`;
        } else if (r.selectedSection === "unavailable") {
          selectedObject = "不存在：负次数线丛没有所选非零全局截面";
          selectedSection = "不适用；请切换到零截面模式";
          zeroOrder = "不适用";
        }

        return {
          numeric: r,
          rows: [
            ["原过渡函数 / 线丛", `z^${v.d} / O(${v.d})`],
            [
              "拉回过渡函数",
              `(z^${v.m})^${v.d} = z^${r.pullbackDegree}`,
            ],
            ["拉回线丛", `F_${v.m}^*O(${v.d})=O(${r.pullbackDegree})`],
            [
              "在两张仿射图上的torsor",
              "分别平凡；过渡函数在重叠Gm上可逆",
            ],
            [
              "在整个P¹上是否平凡",
              r.trivial ? "是，d=0" : "否，d≠0；不能用局部可逆正则函数消去",
            ],
            ["dim H⁰(P¹,L^⊗w)", r.h0],
            ["dim H⁰(P¹,F_m^*(L^⊗w))", r.pullbackH0],
            ["当前选择的T族对象", selectedObject],
            ["选取的截面", selectedSection],
            ["整族的全局自同构", r.globalAutomorphisms],
            ["无穷远纤维稳定子", r.infinityFiberStabilizer],
            ["整族是否落在非零开子叠Bμ_w", !r.selectedObjectExists ? "不适用；对象不存在" : r.factorsThroughNonzeroOpen ? "是；截面处处不消失" : "否；截面有零点或恒为零"],
            ["截面在∞的零点阶（原 / 拉回）", zeroOrder],
            ["这是否计算了整个模叠", "否；实际检查了一个T族的下降、箭头与基变换"],
          ],
          chart: {
            title: "过渡函数的连续相位",
            xlabel: "θ / 2π",
            ylabel: "相位 / 2π（连续提升）",
            series: [
              {
                label: "原过渡z^d",
                points: phase.map((t) => [t, v.d * t]),
              },
              {
                label: "拉回(z^m)^d",
                points: phase.map((t) => [t, r.pullbackDegree * t]),
              },
            ],
          },
          text:
            r.selectedSection === "unavailable"
              ? "wd<0时只有零截面；当前请求的示例非零截面不存在，因此没有对应对象、自同构群或零点阶。切换到零截面模式可继续检查合法对象。"
              : r.selectedSection === "zero"
                ? "零截面在任意次数都合法，整族的全局自同构为C×，每个纤维也有Gm稳定子。非平凡线丛不妨碍零截面存在。"
                : "示例截面不恒为零，所以整族的标量自同构缩为μ_w；若wd>0，它在∞的纤维值为0，该单个纤维的稳定子会跳成Gm。图示的F_m^*s只是拉回截面空间中的一条，不能把拉回旧截面误认为得到所有新截面。",
        };
      },
    },
  };

  return Object.assign(core.create("research-moduli-stacks", configs), {
    quotient,
    descent,
  });
});
